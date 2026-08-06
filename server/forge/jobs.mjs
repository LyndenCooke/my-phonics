// The generation job: story → phonics QA → hero → scenes → cover → real
// book_v2 PDF, with live progress written to the book row so the wizard can
// poll it.
import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { getLevel, greenWordsUpTo, progressionUpTo, pronunciationsFor, pronunciationNoteFor } from "./phonics.mjs";
import { fixMechanics, checkProse } from "./prose.mjs";
import { writeStory, reviewStory, rewriteStory, directScenes, countryFacts, markShiftySounds, STORY_SHAPES } from "./claude.mjs";
import { generateHero, generateCastMember, generateScene, generateCover, generateLandmark, saveImage, CUSTOM_BOOKS_DIR } from "./images.mjs";
import { getBook, updateBook } from "./db.mjs";
import { BOOKS_DIR } from "./env.mjs";

const running = new Set();
// Uploaded photos are held in memory only for the duration of the job —
// never written to disk, never published.
const photoStash = new Map(); // bookId -> {b64, mime}

export function stashPhoto(bookId, b64, mime) {
  photoStash.set(bookId, { b64, mime });
}

async function progress(bookId, step, message, pct) {
  await updateBook(bookId, { progress: { step, message, pct } });
}

export function isRunning(bookId) {
  return running.has(bookId);
}

// Render the finished book through the REAL book pipeline (book_v2.html via
// scripts/generate_custom_book.py → Playwright → A5 PDF). Returns the public
// URL. Idempotent: an existing PDF is reused unless force is set.
const pdfInFlight = new Map(); // bookId -> Promise<url> (dedupe concurrent renders)

export function renderPdf(bookId, opts = {}) {
  if (pdfInFlight.has(bookId)) return pdfInFlight.get(bookId);
  const p = renderPdfInner(bookId, opts).finally(() => pdfInFlight.delete(bookId));
  pdfInFlight.set(bookId, p);
  return p;
}

async function renderPdfInner(bookId, { force = false } = {}) {
  const dir = path.join(CUSTOM_BOOKS_DIR, bookId);
  const outPath = path.join(dir, "book.pdf");
  const url = `/custom-books/${bookId}/book.pdf`;
  if (!force && fs.existsSync(outPath)) return url;

  const book = await getBook(bookId);
  if (!book?.pages) throw new Error("book has no pages yet");
  const story = book.story?.story || {};
  const spec = {
    book_title: book.title || `${book.child_name}'s Story`,
    child_name: book.child_name,
    level: book.level,
    focus_sound: book.focus_sound,
    story_pages: book.pages.filter((p) => p.type === "story").map((p) => p.text),
    story_words: story.focus_word_examples || [],
    read_words: story.read_words || [],
    questions: story.questions || [],
    alien_words: story.alien_words || [],
    tricky_words_used: story.tricky_words_used || [],
    shifty_marks: book.story?.shiftyMarks || {},
    // "Watch Out" note when the focus grapheme has two sounds (u-e says /yoo/
    // in cube and /oo/ in flute) — a child taught only one will stall on the
    // other.
    pronunciation_notes: [pronunciationNoteFor(book.focus_sound, book.level)].filter(Boolean),
    images_dir: dir,
    out_path: outPath,
    profile: book.profile || {},
  };
  const specPath = path.join(dir, "pdf_spec.json");
  fs.writeFileSync(specPath, JSON.stringify(spec), "utf8");

  await new Promise((resolve, reject) => {
    execFile(
      "py",
      ["-3.12", "-X", "utf8", path.join(BOOKS_DIR, "scripts", "generate_custom_book.py"), "--json", specPath],
      { cwd: BOOKS_DIR, windowsHide: true, timeout: 5 * 60 * 1000 },
      (err, stdout, stderr) => {
        if (err) return reject(new Error(`pdf render failed: ${String(stderr || err.message).slice(-400)}`));
        resolve(stdout);
      },
    );
  });
  if (!fs.existsSync(outPath)) throw new Error("pdf render produced no file");
  return url;
}

export async function startGeneration(bookId) {
  if (running.has(bookId)) return;
  running.add(bookId);
  runJob(bookId)
    .catch(async (e) => {
      console.error("[forge] generation failed", bookId, e);
      await updateBook(bookId, {
        status: "failed",
        progress: { step: "failed", message: String(e.message || e).slice(0, 300), pct: 0 },
      }).catch(() => {});
    })
    .finally(() => {
      running.delete(bookId);
      photoStash.delete(bookId);
    });
}

async function runJob(bookId) {
  const book = await getBook(bookId);
  if (!book) throw new Error("book not found");
  const level = getLevel(book.level);
  if (!level) throw new Error(`bad level ${book.level}`);

  const child = {
    name: book.child_name,
    age: book.child_age,
    city: book.city,
    country: book.country,
    cultureNotes: book.culture_notes,
    likes: book.likes,
    appearance: book.appearance || {},
  };
  const pagesCount = Math.min(level.storyPages, 8);
  let cost = 0;
  const breakdown = { story_usd: 0, images_usd: 0, qa_notes: [] };

  await updateBook(bookId, { status: "generating" });

  // 1. Story — sound-first, armed with the full cumulative green-word bank
  await progress(bookId, "story", `Writing ${child.name}'s story around the sound "${book.focus_sound}"...`, 5);
  const progression = progressionUpTo(book.level);
  // One story shape per book, chosen at random. Left to itself the writer
  // produces the same book every time (five running were "child makes a thing
  // for a relative, spills it, is praised").
  const shape = STORY_SHAPES[Math.floor(Math.random() * STORY_SHAPES.length)];
  await progress(bookId, "story", `Writing ${child.name}'s story around the sound "${book.focus_sound}"...`, 5);
  console.log(`[forge] story shape: ${shape.name}`);
  let { data: story, cost: c1 } = await writeStory({
    level, child, focusSound: book.focus_sound, pagesCount,
    greenWords: greenWordsUpTo(book.level),
    progression,
    pronunciations: pronunciationsFor(book.focus_sound, book.level),
    shape,
  });
  breakdown.story_shape = shape.name;
  cost += c1; breakdown.story_usd += c1;

  // 2. Phonics QA. A couple of slightly-above-level words are FINE — the
  // book_v2 renderer previews them as Future Sounds (same doctrine as the
  // printed books: zero rewrites for future-sound words). Only rewrite when
  // violations pile up (>3 distinct words).
  await progress(bookId, "phonics_qa", "Checking every word is decodable at this level...", 15);
  const review = await reviewStory({ level, story, focusSound: book.focus_sound, childName: child.name });
  cost += review.cost; breakdown.story_usd += review.cost;
  let validation = review.data;
  const distinctViolations = new Set((validation.violations || []).map((v) => v.word.toLowerCase())).size;
  if (!validation.ok && distinctViolations > 3) {
    await progress(bookId, "phonics_fix", `Fixing ${validation.violations.length} tricky word(s)...`, 20);
    const fixed = await rewriteStory({
      level, child, focusSound: book.focus_sound, pagesCount, story, violations: validation.violations,
    });
    cost += fixed.cost; breakdown.story_usd += fixed.cost;
    story = fixed.data;
    const recheck = await reviewStory({ level, story, focusSound: book.focus_sound, childName: child.name });
    cost += recheck.cost; breakdown.story_usd += recheck.cost;
    validation = recheck.data;
  }

  // 2a2. Mechanics. Capitals and terminal punctuation are the things the book
  // is TEACHING, so they are fixed deterministically rather than hoped for —
  // a rewrite once returned an entire book in lower case. Whatever a regex
  // cannot fix is recorded for review.
  story.pages = story.pages.map((p) => ({ ...p, text: fixMechanics(p.text, child.name) }));
  const proseIssues = checkProse({
    pages: story.pages.map((p) => p.text),
    childName: child.name,
    level: book.level,
    progression,
  });
  if (proseIssues.length) {
    console.warn("[forge] prose issues:", JSON.stringify(proseIssues).slice(0, 500));
    breakdown.prose_issues = proseIssues;
  }

  // 2a. Shifty-sound marking for the words that get sound buttons. A taught
  // letter making a different sound (the u in "nutritious" says /oo/, not the
  // /u/ of "up") must print as a slate diamond, not a dot. Non-fatal: without
  // it the book still renders, just with ordinary dots.
  const buttonWords = [
    ...new Set(
      [...(story.focus_word_examples || []), ...(story.read_words || []), ...(story.alien_words || [])]
        .map((w) => String(w).toLowerCase().trim())
        .filter(Boolean),
    ),
  ];
  let shiftyMarks = {};
  if (buttonWords.length) {
    try {
      await progress(bookId, "shifty", "Marking the shifty sounds...", 22);
      const sh = await markShiftySounds({ words: buttonWords, level: book.level });
      cost += sh.cost; breakdown.story_usd += sh.cost;
      for (const entry of sh.data.words || []) {
        // Keep the SOUND with the index: the renderer drops a diamond whose
        // pronunciation is not taught until a higher level (a Level 6 book
        // was marking the a in "after" as /ar/, an L7 sound).
        const marks = (entry.shifty || [])
          .filter((s) => Number.isInteger(s.index) && s.index >= 0)
          .map((s) => ({ index: s.index, says: s.says || null }));
        if (marks.length) shiftyMarks[String(entry.word).toLowerCase()] = marks;
      }
    } catch (e) {
      console.warn("[forge] shifty marking failed (dots only):", e.message);
    }
  }

  // 2b. Illustration direction — think like the character BEFORE prompting
  // images: purpose of each moment, what the child sees/does/feels, and
  // where every object physically belongs so the staging makes sense.
  await progress(bookId, "directing", "Directing the scenes (walking the story in " + child.name + "'s shoes)...", 25);
  let directed = null;
  try {
    const d = await directScenes({ story, child });
    cost += d.cost; breakdown.story_usd += d.cost;
    directed = d.data.pages;
  } catch (e) {
    console.warn("[forge] director pass failed, using raw scene briefs:", e.message);
  }

  // 3. Hero (with eye-style injection + optional photo likeness)
  await progress(bookId, "hero", `Drawing ${child.name} as a book character (eye rule enforced)...`, 30);
  const photo = photoStash.get(bookId);
  const hero = await generateHero({ child, photoB64: photo?.b64, photoMime: photo?.mime });
  cost += hero.cost; breakdown.images_usd += hero.cost; breakdown.qa_notes.push(hero.qa);
  const heroUrl = saveImage(bookId, "hero.jpg", hero.buf);

  // 3b. Character sheets for everyone who is NOT the hero — drawn once, then
  // injected into every page they appear on, otherwise Mum is re-invented from
  // the word "mum" each time and her clothes change colour page to page.
  // Drawn LAZILY, on the first page that actually needs them: writers declare
  // cast who then barely feature (a mum who appears on one page of eight), and
  // an unused sheet is $0.07 of nothing.
  const castDefs = new Map(
    (story.cast || []).slice(0, 3).filter((m) => m?.id).map((m) => [m.id.toLowerCase(), m]),
  );
  const castSheets = {}; // id -> {name, buf}
  async function castSheetFor(id) {
    const key = String(id).toLowerCase();
    if (castSheets[key]) return castSheets[key];
    const member = castDefs.get(key);
    if (!member) return null;
    try {
      await progress(bookId, "cast", `Drawing ${member.who || member.id}...`, 33);
      const c = await generateCastMember({ member, child });
      cost += c.cost; breakdown.images_usd += c.cost; breakdown.qa_notes.push(c.qa);
      castSheets[key] = { name: member.who || member.id, buf: c.buf };
      saveImage(bookId, `cast_${key.replace(/[^a-z0-9]/g, "")}.jpg`, c.buf);
      return castSheets[key];
    } catch (e) {
      console.warn(`[forge] cast sheet for ${member.id} failed:`, e.message);
      return null;
    }
  }

  // 4. Scenes — hero injected into every page, plus WORLD CONSISTENCY:
  // the story's fixed setting/season/weather/objects ride along on every
  // prompt, and pages sharing a location reuse the first image of that
  // location as a same-viewpoint background reference.
  const setting = story.setting || {};
  const worldBlock = setting.place
    ? `WORLD CONSISTENCY (identical on every page unless the scene text says otherwise): This story happens in ${setting.place}. ` +
      `Setting details to keep identical: ${setting.architecture || ""}. Season: ${setting.season || "unspecified"}. Weather: ${setting.weather || "unspecified"}.`
    : "";

  // Key objects ride along ONLY on the pages that actually use them. Injecting
  // the whole list into every prompt put "the karak pot simmering on the
  // stove" into a floor-level cleaning scene — and the model duly drew a hob
  // on the floor. An object's description says what it LOOKS like; the scene
  // alone says where it is, what state it is in, and whether it is there.
  const keyObjects = story.key_objects || [];
  const lookFor = (name) =>
    keyObjects.find((o) => o.name.toLowerCase() === String(name || "").toLowerCase())?.look || "";

  // Preferred path: the director says which objects are visible on this page
  // and in what state. Only those are described to the illustrator, and the
  // state overrides the description — a "date balls" entry that says "not yet
  // made" keeps the finished balls out of the frame.
  function objectsBlockFromDirector(objects) {
    if (!objects?.length) {
      return keyObjects.length
        ? " KEY OBJECTS: none of the story's recurring objects are visible in this frame. Do not draw them."
        : "";
    }
    const lines = objects.map((o) => {
      const look = lookFor(o.name);
      return `${o.name}${look ? ` (normally: ${look})` : ""} — ON THIS PAGE: ${o.state}`;
    });
    return (
      ` KEY OBJECTS ON THIS PAGE — ${lines.join("; ")}. ` +
      "The 'normally' description is what the object looks like when it is finished and in its usual state; the ON THIS PAGE state WINS over it. " +
      "If a state says an object does not exist yet, is empty, unfinished or absent, draw it that way or not at all. Draw no recurring object that is not listed here."
    );
  }

  // Fallback for when the director pass fails: require EVERY significant word
  // of the object's name to appear, so "date balls" no longer matches a page
  // that just mentions dates.
  const objectWords = (name) =>
    String(name || "")
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !["the", "some", "with", "your", "their", "that", "this"].includes(w));
  function objectsBlockFor(text) {
    const hay = String(text || "").toLowerCase();
    const used = keyObjects.filter((o) => {
      const words = objectWords(o.name);
      return words.length > 0 && words.every((w) => hay.includes(w));
    });
    if (!used.length) return "";
    return (
      ` KEY OBJECTS ON THIS PAGE — the same physical object every time it appears (${used
        .map((o) => `${o.name}: ${o.look}`)
        .join("; ")}). These descriptions say what each object LOOKS like, never where it is: its position and its current state come from the scene above and from nothing else. ` +
      "Draw ONLY the objects this scene calls for — never add an object just because it has been described."
    );
  }

  const sceneUrls = [];
  const locationAnchors = {}; // location id -> established image of that place
  for (let i = 0; i < story.pages.length; i++) {
    const pctBase = 35 + Math.round((i / story.pages.length) * 45);
    await progress(bookId, "scenes", `Illustrating page ${i + 1} of ${story.pages.length}...`, pctBase);
    const loc = (story.pages[i].location || "").trim().toLowerCase();
    // Directed brief (staging + emotion baked in) wins over the raw scene idea.
    const d = directed?.find((x) => x.page === i + 1);
    const sceneBrief = d ? `${d.brief} ${child.name} feels ${d.emotion}. Staging: ${d.staging}` : story.pages[i].scene;
    // Anchoring: the FIRST image at a location establishes it, and every later
    // page there gets that image as a hard visual reference — closeups and new
    // angles included. (Restricting the reference to "same-view" pages meant
    // any book whose director never used that tag — i.e. most of them, since
    // the doctrine tells it to prefer closeups — got no visual continuity at
    // all and re-invented the room page by page.) The camera tag now decides
    // HOW the reference is used, not WHETHER it is used.
    const anchorBuf = loc ? locationAnchors[loc] || null : null;
    // The first page in a location is the establishing shot, whatever it was
    // tagged — there is nothing yet for a closeup to be consistent with.
    const camera = anchorBuf ? d?.camera || "new-angle" : "wide";
    const s = await generateScene({
      heroBuf: hero.buf,
      scene: sceneBrief,
      child,
      settingBlock:
        worldBlock +
        (d ? objectsBlockFromDirector(d.objects) : objectsBlockFor(`${story.pages[i].text} ${sceneBrief}`)),
      anchorBuf,
      camera,
      // Only the people actually in this frame. Falls back to every cast
      // member the page text names, so a failed director pass still keeps
      // them consistent.
      castRefs: (
        await Promise.all(
          (d?.cast_present?.length
            ? d.cast_present
            : [...castDefs.keys()].filter((id) => story.pages[i].text.toLowerCase().includes(id))
          ).map((id) => castSheetFor(id)),
        )
      ).filter(Boolean),
    });
    if (loc && !locationAnchors[loc]) locationAnchors[loc] = s.buf;
    cost += s.cost; breakdown.images_usd += s.cost;
    breakdown.qa_notes.push({ ...s.qa, page: i + 1, location: loc || null, camera, anchored: Boolean(anchorBuf) });
    sceneUrls.push(saveImage(bookId, `page${i + 1}.jpg`, s.buf));
  }

  // 5. Cover — the story's OWN cover moment, in the story's own place. The
  // old brief was "celebrating <the child's likes>", which is why a book about
  // baking a cake got a cover of the child on a beach.
  await progress(bookId, "cover", "Painting the cover...", 85);
  const mainLoc = Object.entries(
    story.pages.reduce((acc, p) => {
      const l = (p.location || "").trim().toLowerCase();
      if (l) acc[l] = (acc[l] || 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1])[0]?.[0];
  const coverBrief =
    story.cover_brief ||
    `${child.name} in the happiest moment of the story "${story.title}", holding or beside the story's central object. ${story.pages[story.pages.length - 1]?.scene || ""}`;
  const cover = await generateCover({
    heroBuf: hero.buf,
    brief: coverBrief,
    child,
    settingBlock: worldBlock + objectsBlockFor(coverBrief),
    anchorBuf: (mainLoc && locationAnchors[mainLoc]) || null,
  });
  cost += cover.cost; breakdown.images_usd += cover.cost; breakdown.qa_notes.push(cover.qa);
  const coverUrl = saveImage(bookId, "cover.jpg", cover.buf);

  // 5b. Country pack for the "Meet the Star" page: fun facts + greeting +
  // a landmark painted in the house style. Non-fatal — the profile page
  // still renders without it.
  let country = null;
  let landmarkUrl = null;
  try {
    await progress(bookId, "country", `Collecting wonders from ${book.country || "home"}...`, 90);
    const cf = await countryFacts({
      country: book.country || "the United Kingdom",
      city: book.city || null,
      cultureNotes: book.culture_notes || null,
    });
    cost += cf.cost; breakdown.story_usd += cf.cost;
    country = cf.data;
    const lm = await generateLandmark({
      name: country.landmark.name,
      imageBrief: country.landmark.image_brief,
      city: book.city,
      country: book.country,
    });
    cost += lm.cost; breakdown.images_usd += lm.cost; breakdown.qa_notes.push(lm.qa);
    landmarkUrl = saveImage(bookId, "landmark.jpg", lm.buf);
  } catch (e) {
    console.warn("[forge] country pack failed (profile renders without it):", e.message);
  }

  // 6. Assemble pages (profile page at the back — hero image, never the photo)
  await progress(bookId, "assemble", "Binding the book...", 95);
  const pages = [
    { type: "cover", title: story.title, imageUrl: coverUrl, levelColour: level.colour, levelName: level.name, focusSound: book.focus_sound },
    ...story.pages.map((p, i) => ({ type: "story", text: p.text, imageUrl: sceneUrls[i] })),
    {
      type: "profile",
      heroUrl,
      name: child.name,
      age: child.age,
      city: book.city || null,
      country: child.country,
      countryFlag: book.country_flag,
      likes: child.likes,
      culture: child.cultureNotes,
      faith: book.faith || null,
      greeting: country?.greeting || null,
      facts: country?.facts || [],
      landmark: country
        ? { name: country.landmark.name, fact: country.landmark.fact, imageUrl: landmarkUrl }
        : null,
    },
  ];

  await updateBook(bookId, {
    status: "ready",
    title: story.title,
    pages,
    story: { story, validation, directed, shiftyMarks },
    profile: pages[pages.length - 1],
    cost_usd: Number(cost.toFixed(4)),
    cost_breakdown: breakdown,
    progress: { step: "typeset", message: "Typesetting the printable book...", pct: 97 },
  });

  // 7. Real book_v2 PDF. Non-fatal: the interactive book is already ready,
  // and the frontend's PDF button re-triggers renderPdf on demand.
  try {
    await renderPdf(bookId, { force: true });
  } catch (e) {
    console.warn("[forge] pdf typeset failed (book still readable):", e.message);
  }
  await updateBook(bookId, {
    progress: { step: "done", message: "Your book is ready!", pct: 100 },
  });
}
