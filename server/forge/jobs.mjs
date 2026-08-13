// Generation as a RESUMABLE STEP MACHINE: story → phonics QA → direction →
// hero → one scene per step → cover → country pack → assemble.
//
// Why steps and not one long job: production is Vercel serverless, where a
// function must answer within its time budget and NOTHING in memory survives
// between invocations. The old runJob() held the hero image in a local
// variable for four minutes — fine under vite, impossible on a lambda. So all
// state now lives in the book row (progress.job, plain JSON) and all images
// live in storage (URLs in that JSON, re-downloaded when a later step needs
// one as a reference). Any invocation, anywhere, can pick up exactly where
// the last one stopped: runNextStep(bookId) does one unit of work (≤ ~60s),
// persists, returns.
//
// Two drivers, one engine:
//   dev (vite)   — startGeneration() loops the steps in-process, exactly the
//                  old behaviour from the outside.
//   prod (Vercel)— startGeneration() only INITIALISES; the wizard drives by
//                  calling POST /books/:id/step until { done: true }.
import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { getLevel, greenWordsUpTo, progressionUpTo, pronunciationsFor, pronunciationNoteFor, focusSoundViolations, focusSoundCountViolation, coreStoriesFor } from "./phonics.mjs";
import { fixMechanics, checkProse } from "./prose.mjs";
import { writeStory, reviewStory, rewriteStory, reviewStoryPlausibility, fixStoryPlausibility, directScenes, countryFacts, markShiftySounds, extractSceneState, STORY_SHAPES } from "./claude.mjs";
import { generateHero, generateCastMember, generateObjectRef, generateScene, generateCover, generateLandmark } from "./images.mjs";
import { saveImage, loadByUrl, IS_SERVERLESS, CUSTOM_BOOKS_DIR } from "./storage.mjs";
import { getBook, updateBook, recentStoryShapes } from "./db.mjs";
import { BOOKS_DIR } from "./env.mjs";

export { CUSTOM_BOOKS_DIR };

const running = new Set();
// Uploaded photos are held in memory only, never written anywhere. In prod a
// later invocation may not be the one that stashed the photo — the hero then
// generates without the likeness rather than failing. Documented degradation.
const photoStash = new Map(); // bookId -> {b64, mime}

export function stashPhoto(bookId, b64, mime) {
  photoStash.set(bookId, { b64, mime });
}

export function isRunning(bookId) {
  return running.has(bookId);
}

// A step claims the row before working and releases after. Not a real mutex —
// Supabase REST gives us no compare-and-swap — but two polite clients (the
// wizard's driver never overlaps its own calls) only race if the user opens
// two tabs, and then the stale-after window keeps it self-healing.
const LOCK_MS = 2 * 60 * 1000;

function newJob(book) {
  return {
    v: 1,
    cost: 0,
    breakdown: { story_usd: 0, images_usd: 0, qa_notes: [] },
    sceneUrls: [],
    anchors: {},      // location id -> image URL
    castSheets: {},   // cast id -> { name, url }
    objectSheets: {}, // key_object name (lowercased) -> { name, url }
    // Responses-API conversation chain (SKILL.md §5.5): the last approved
    // scene turn's response id. Each scene chains onto this so the model
    // carries the actual generated world forward; the cover chains onto the
    // final scene. null until the first chained scene succeeds — and stays
    // null if the chain path is disabled or failing (stateless fallback).
    chainResponseId: null,
    // Actual-result state (extractSceneState): what the last APPROVED image
    // literally shows for each key object — size, position, layout of marks.
    // Injected into the next page's prompt as binding fact, because mutable
    // state (dots drawn on a card) is pinned by neither the identity
    // reference nor the loose conversation chain.
    carriedState: null,
  };
}

function nextStepOf(job) {
  if (!job.story) return "story";
  if (!job.qaDone) return "qa";
  if (!job.plausibilityDone) return "plausibility";
  if (!job.directDone) return "direct";
  if (!job.heroUrl) return "hero";
  if (job.sceneUrls.length < job.story.pages.length) return `scene:${job.sceneUrls.length}`;
  if (!job.coverUrl) return "cover";
  if (!job.countryDone) return "country";
  if (!job.reviewDone) return "review";
  if (!job.assembled) return "assemble";
  return "done";
}

async function persist(bookId, job, display) {
  await updateBook(bookId, { progress: { ...display, job } });
}

// ---------------------------------------------------------------- helpers --

function childOf(book) {
  return {
    name: book.child_name,
    age: book.child_age,
    city: book.city,
    country: book.country,
    cultureNotes: book.culture_notes,
    likes: book.likes,
    appearance: book.appearance || {},
  };
}

function worldBlockOf(story) {
  const setting = story.setting || {};
  return setting.place
    ? `WORLD CONSISTENCY (identical on every page unless the scene text says otherwise): This story happens in ${setting.place}. ` +
      `Setting details to keep identical: ${setting.architecture || ""}. Season: ${setting.season || "unspecified"}. Weather: ${setting.weather || "unspecified"}.`
    : "";
}

const objectWords = (name) =>
  String(name || "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !["the", "some", "with", "your", "their", "that", "this"].includes(w));

function makeObjectBlocks(story) {
  const keyObjects = story.key_objects || [];
  const lookFor = (name) =>
    keyObjects.find((o) => o.name.toLowerCase() === String(name || "").toLowerCase())?.look || "";
  // Director-declared objects, with per-page state that WINS over the look.
  const fromDirector = (objects) => {
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
  };
  // Fallback: every significant word of the name must appear in the page text.
  const fromText = (text) => {
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
  };
  return { fromDirector, fromText };
}

// Custom books hold a fixed print budget — 16 total pages at L1-4, 20 at
// L5-8 (Lynden 2026-08-09, re-affirmed 2026-08-13 after a 17-page export).
// With the fixed activity/profile page set, that leaves exactly 6 story
// pages at L1-4 and 8 at L5-8, independent of the library's storyPages.
function storyPagesFor(level) {
  return level <= 4 ? 6 : 8;
}

// ------------------------------------------------------------------ steps --

async function stepStory(book, job) {
  const level = getLevel(book.level);
  const child = childOf(book);
  const pagesCount = storyPagesFor(book.level);
  // One story shape per book, chosen at random from whatever hasn't shipped
  // in the last few books — plain randomness let the same shape land twice in
  // a row ("The swap", 2026-08-07 and 2026-08-09), and both leant on the same
  // collect-a-few-objects crutch (Lynden 2026-08-09). Falls back to the full
  // list if recent history can't be read or would exclude everything.
  let pool = STORY_SHAPES;
  try {
    const recent = new Set(await recentStoryShapes(5));
    const fresh = STORY_SHAPES.filter((s) => !recent.has(s.name));
    if (fresh.length) pool = fresh;
  } catch {
    // history unavailable — fall back to the full pool rather than fail the book
  }
  const shape = pool[Math.floor(Math.random() * pool.length)];
  const { data: story, cost } = await writeStory({
    level, child, focusSound: book.focus_sound, pagesCount,
    greenWords: greenWordsUpTo(book.level),
    progression: progressionUpTo(book.level),
    pronunciations: pronunciationsFor(book.focus_sound, book.level),
    shape,
    exemplars: coreStoriesFor(book.level),
  });
  job.story = story;
  job.breakdown.story_shape = shape.name;
  job.breakdown.shape_fulfilment = story.shape_fulfilment;
  job.cost += cost; job.breakdown.story_usd += cost;
}

async function stepQa(book, job) {
  const level = getLevel(book.level);
  const child = childOf(book);
  const pagesCount = storyPagesFor(book.level);
  let story = job.story;

  // A couple of slightly-above-level words are FINE — book_v2 previews them
  // as Future Sounds. Only rewrite when violations pile up (>3 distinct).
  const review = await reviewStory({ level, story, focusSound: book.focus_sound, childName: child.name });
  job.cost += review.cost; job.breakdown.story_usd += review.cost;
  let validation = review.data;

  // Deterministic check the model gate above cannot do: it verifies "oo" is
  // a taught GRAPHEME, not that a specific word uses a sound this level has
  // actually unlocked (short /oo/ in "book"/"look" slipped through as if
  // interchangeable with long /oo/ in "moon" — see focusSoundViolations).
  // Folded into the SAME violations list so it drives the existing rewrite
  // path rather than a second, easy-to-ignore channel.
  const focusViolations = focusSoundViolations({ story, focusSound: book.focus_sound, level: book.level });
  if (focusViolations.length) {
    validation = { ...validation, ok: false, violations: [...(validation.violations || []), ...focusViolations] };
  }
  // A book that landed on just 1-2 focus-sound words (Lynden 2026-08-11:
  // "there is only one story word... should be at least 3") — deterministic,
  // counts story.focus_word_examples directly.
  const countViolation = focusSoundCountViolation({ story, focusSound: book.focus_sound });
  if (countViolation) {
    validation = { ...validation, ok: false, violations: [...(validation.violations || []), countViolation] };
  }

  const distinct = new Set((validation.violations || []).map((v) => v.word.toLowerCase())).size;
  // A generic above-level word is fine in small numbers (Future Sounds
  // preview handles it) — but a focus-word EXAMPLE using an untaught sound of
  // the very grapheme this book is teaching, or too few focus-sound words
  // overall, is never fine, so either forces a rewrite regardless of the
  // >3 threshold.
  if (!validation.ok && (distinct > 3 || focusViolations.length > 0 || countViolation)) {
    const fixed = await rewriteStory({
      level, child, focusSound: book.focus_sound, pagesCount, story, violations: validation.violations,
    });
    job.cost += fixed.cost; job.breakdown.story_usd += fixed.cost;
    story = fixed.data;
    const recheck = await reviewStory({ level, story, focusSound: book.focus_sound, childName: child.name });
    job.cost += recheck.cost; job.breakdown.story_usd += recheck.cost;
    validation = recheck.data;
    const recheckFocus = focusSoundViolations({ story, focusSound: book.focus_sound, level: book.level });
    if (recheckFocus.length) {
      validation = { ...validation, ok: false, violations: [...(validation.violations || []), ...recheckFocus] };
    }
    const recheckCount = focusSoundCountViolation({ story, focusSound: book.focus_sound });
    if (recheckCount) {
      validation = { ...validation, ok: false, violations: [...(validation.violations || []), recheckCount] };
    }
  }

  // Mechanics are TAUGHT by these books, so they are fixed deterministically.
  story.pages = story.pages.map((p) => ({ ...p, text: fixMechanics(p.text, child.name) }));
  const proseIssues = checkProse({
    pages: story.pages.map((p) => p.text),
    childName: child.name,
    level: book.level,
    progression: progressionUpTo(book.level),
  });
  if (proseIssues.length) job.breakdown.prose_issues = proseIssues;

  // Shifty diamonds for the sound-button words. Non-fatal: dots-only if it fails.
  const buttonWords = [
    ...new Set(
      [...(story.focus_word_examples || []), ...(story.read_words || []), ...(story.alien_words || [])]
        .map((w) => String(w).toLowerCase().trim())
        .filter(Boolean),
    ),
  ];
  job.shiftyMarks = {};
  if (buttonWords.length) {
    try {
      const sh = await markShiftySounds({ words: buttonWords, level: book.level });
      job.cost += sh.cost; job.breakdown.story_usd += sh.cost;
      for (const entry of sh.data.words || []) {
        const marks = (entry.shifty || [])
          .filter((s) => Number.isInteger(s.index) && s.index >= 0)
          .map((s) => ({ index: s.index, says: s.says || null }));
        if (marks.length) job.shiftyMarks[String(entry.word).toLowerCase()] = marks;
      }
    } catch (e) {
      console.warn("[forge] shifty marking failed (dots only):", e.message);
    }
  }

  job.story = story;
  job.validation = validation;
  job.qaDone = true;
}

// Runs BEFORE any image exists — the last chance to catch a story whose
// premise is physically or logically self-contradictory. "The Thick Pen"
// shipped "The bag had a gap. The cap fell into sand." then "The thick pen
// fit the gap": a rigid cap cannot fall through a hole a thin pen later
// plugs. No other gate could have caught it — decodability only checks
// words are legal, and the image-consistency QA only checks a picture
// matches its OWN page's text, not whether the text's claim is possible at
// all (Lynden 2026-08-10). One bounded rewrite, same doctrine as stepQa —
// never loop forever, and log rather than block the book if it still fails.
async function stepPlausibility(book, job) {
  const level = getLevel(book.level);
  const child = childOf(book);
  const pagesCount = storyPagesFor(book.level);
  let story = job.story;

  const review = await reviewStoryPlausibility({ story });
  job.cost += review.cost; job.breakdown.story_usd += review.cost;
  let result = review.data;
  if (!result.pass && result.issues?.length) {
    const fixed = await fixStoryPlausibility({
      level, child, focusSound: book.focus_sound, pagesCount, story, issues: result.issues,
    });
    job.cost += fixed.cost; job.breakdown.story_usd += fixed.cost;
    story = fixed.data;
    story.pages = story.pages.map((p) => ({ ...p, text: fixMechanics(p.text, child.name) }));
    const recheck = await reviewStoryPlausibility({ story });
    job.cost += recheck.cost; job.breakdown.story_usd += recheck.cost;
    result = recheck.data;
    if (!result.pass) {
      console.warn(`[forge] story still fails plausibility QA after one rewrite: ${JSON.stringify(result.issues)}`);
    }
  }

  job.story = story;
  job.breakdown.plausibility = result;
  job.plausibilityDone = true;
}

async function stepDirect(book, job) {
  try {
    const d = await directScenes({ story: job.story, child: childOf(book) });
    job.cost += d.cost; job.breakdown.story_usd += d.cost;
    job.directed = d.data.pages;
  } catch (e) {
    console.warn("[forge] director pass failed, using raw scene briefs:", e.message);
    job.directed = null;
  }
  job.directDone = true;
}

async function stepHero(book, job) {
  const photo = photoStash.get(book.id);
  const hero = await generateHero({ child: childOf(book), photoB64: photo?.b64, photoMime: photo?.mime });
  job.cost += hero.cost; job.breakdown.images_usd += hero.cost; job.breakdown.qa_notes.push(hero.qa);
  job.heroUrl = await saveImage(book.id, "hero.jpg", hero.buf);
}

async function castSheetFor(book, job, id) {
  const key = String(id).toLowerCase();
  if (job.castSheets[key]) {
    const buf = await loadByUrl(job.castSheets[key].url);
    return buf ? { name: job.castSheets[key].name, buf } : null;
  }
  const member = (job.story.cast || []).find((m) => m?.id?.toLowerCase() === key);
  if (!member) return null;
  try {
    const c = await generateCastMember({ member, child: childOf(book) });
    job.cost += c.cost; job.breakdown.images_usd += c.cost; job.breakdown.qa_notes.push(c.qa);
    const url = await saveImage(book.id, `cast_${key.replace(/[^a-z0-9]/g, "")}.jpg`, c.buf);
    job.castSheets[key] = { name: member.who || member.id, url };
    return { name: member.who || member.id, buf: c.buf };
  } catch (e) {
    console.warn(`[forge] cast sheet for ${id} failed:`, e.message);
    return null;
  }
}

// The director names an object per-page in its own words ("black string",
// "the string", "string") which rarely matches key_objects[].name character
// for character. An exact-match lookup silently returns null on any mismatch
// — no error, just a missing reference and the object drifting on that page
// exactly like it did before references existed at all (the test book's
// string). Substring match both ways, case-insensitive, is enough: whichever
// name is shorter should appear whole inside the other.
function resolveKeyObject(story, rawName) {
  const key = String(rawName || "").toLowerCase().trim();
  if (!key) return null;
  const objects = story.key_objects || [];
  const exact = objects.find((o) => o?.name?.toLowerCase() === key);
  if (exact) return exact;
  return objects.find((o) => {
    const oName = String(o?.name || "").toLowerCase();
    if (!oName) return false;
    return key.includes(oName) || oName.includes(key);
  }) || null;
}

// A locked identity reference for a recurring key object (SKILL.md §5.1) —
// generated once per book, the same "sheet, then inject everywhere" fix
// castSheetFor already does for people. Without this a key object (a cap, a
// bag) is redrawn from its text `look` alone on every page and its colour,
// shape and trim drift page to page. Always cached and looked up under the
// CANONICAL key_objects.name (never the director's per-page wording), so a
// page calling it "black string" and another calling it "the string" still
// hit the same cached reference instead of silently generating none.
async function objectSheetFor(book, job, rawName) {
  const obj = resolveKeyObject(job.story, rawName);
  if (!obj) return null;
  const key = obj.name.toLowerCase();
  if (job.objectSheets[key]) {
    const buf = await loadByUrl(job.objectSheets[key].url);
    return buf ? { name: job.objectSheets[key].name, buf } : null;
  }
  try {
    const r = await generateObjectRef({ name: obj.name, look: obj.look, child: childOf(book) });
    job.cost += r.cost; job.breakdown.images_usd += r.cost; job.breakdown.qa_notes.push(r.qa);
    const url = await saveImage(book.id, `object_${key.replace(/[^a-z0-9]/g, "")}.jpg`, r.buf);
    job.objectSheets[key] = { name: obj.name, url };
    return { name: obj.name, buf: r.buf };
  } catch (e) {
    console.warn(`[forge] object reference for ${rawName} failed:`, e.message);
    return null;
  }
}

async function stepScene(book, job, i) {
  const story = job.story;
  const child = childOf(book);
  const { fromDirector, fromText } = makeObjectBlocks(story);
  const heroBuf = await loadByUrl(job.heroUrl);
  if (!heroBuf) throw new Error("hero image missing from storage");

  const loc = (story.pages[i].location || "").trim().toLowerCase();
  const d = job.directed?.find((x) => x.page === i + 1);
  const sceneBrief = d ? `${d.brief} ${child.name} feels ${d.emotion}. Staging: ${d.staging}` : story.pages[i].scene;
  // The anchor is injected on EVERY revisit — the camera tag decides HOW it is
  // used, never WHETHER (see SKILL.md §3; gating on same-view was the worst
  // bug in this pipeline's history).
  const anchorUrl = loc ? job.anchors[loc] || null : null;
  const anchorBuf = anchorUrl ? await loadByUrl(anchorUrl) : null;
  const camera = anchorBuf ? d?.camera || "new-angle" : "wide";

  // The location anchor is fixed to the FIRST image ever made there — good
  // for permanent architecture, but stale for anything set-dressing added
  // since (a rock's exact ledge shape, where an undeclared prop landed). The
  // PREVIOUS page's actual image, when it shares this page's location, is
  // what a manual "what would the next image look like, using the last one
  // as reference" workflow would use — undeclared recurring set-pieces (the
  // book was on a different-shaped rock every page) only carry forward this
  // way, since they were never captured as a formal key_objects reference
  // (Lynden 2026-08-11: "the rock changes in every scene... no continuation
  // of story through realistic image/object progression"). Skipped when it's
  // literally the same file as the anchor (page 2, the anchor's own source).
  const prevLoc = i > 0 ? (story.pages[i - 1].location || "").trim().toLowerCase() : null;
  const prevUrl = prevLoc && prevLoc === loc && job.sceneUrls[i - 1] && job.sceneUrls[i - 1] !== anchorUrl
    ? job.sceneUrls[i - 1]
    : null;
  const prevBuf = prevUrl ? await loadByUrl(prevUrl) : null;

  const wanted = d?.cast_present?.length
    ? d.cast_present
    : (story.cast || []).map((m) => m?.id).filter((id) => id && story.pages[i].text.toLowerCase().includes(id.toLowerCase()));
  const castRefs = (await Promise.all(wanted.map((id) => castSheetFor(book, job, id)))).filter(Boolean);

  // Key objects the director declared visible on THIS page get their locked
  // identity reference injected too (see objectSheetFor) — falls back to
  // matching the object's name in the page text when there is no director
  // pass, same pattern castRefs already uses above.
  const wantedObjects = d?.objects?.length
    ? d.objects.map((o) => o.name)
    : (story.key_objects || []).map((o) => o?.name).filter((n) => n && story.pages[i].text.toLowerCase().includes(n.toLowerCase()));
  const objectRefs = (await Promise.all(wantedObjects.map((name) => objectSheetFor(book, job, name)))).filter(Boolean);

  // The previous approved image's ACTUAL state (see extractSceneState) binds
  // this page harder than any plan does — a card's dots stay where the last
  // picture actually put them, in the size it actually drew the card.
  const carried = job.carriedState && prevLoc === loc
    ? ` ACTUAL STATE AFTER THE PREVIOUS PAGE (binding — redraw each object exactly like this except what this page's action changes): ${job.carriedState}`
    : "";

  const s = await generateScene({
    heroBuf,
    scene: sceneBrief,
    child,
    settingBlock:
      worldBlockOf(story) +
      (d ? fromDirector(d.objects) : fromText(`${story.pages[i].text} ${sceneBrief}`)) +
      carried,
    anchorBuf,
    prevBuf,
    camera,
    castRefs,
    objectRefs,
    // The actual sentence this page illustrates, for the picture-vs-text
    // consistency QA in generateScene — a story page always has real text,
    // unlike the cover, which has none to check against.
    pageText: story.pages[i].text,
    previousResponseId: job.chainResponseId,
  });
  job.cost += s.cost; job.breakdown.images_usd += s.cost;
  if (s.responseId) job.chainResponseId = s.responseId;
  job.breakdown.qa_notes.push({ ...s.qa, page: i + 1, location: loc || null, camera, anchored: Boolean(anchorBuf), chained: Boolean(s.responseId) });

  // Record what the approved image ACTUALLY shows for each key object, for
  // the next page to inherit. Non-fatal: a failed extraction just means the
  // next page falls back to plan-only state, as every page did before this.
  try {
    const objectNames = (story.key_objects || []).map((o) => o?.name).filter(Boolean);
    if (objectNames.length) {
      const st = await extractSceneState(s.buf.toString("base64"), { objectNames });
      job.cost += st.cost; job.breakdown.story_usd += st.cost;
      job.carriedState = st.data.states || null;
    }
  } catch (e) {
    console.warn(`[forge] state extraction failed for page ${i + 1}:`, e.message);
    job.carriedState = null;
  }
  if (s.qa?.consistency && !s.qa.consistency.pass) {
    console.warn(`[forge] page ${i + 1} consistency QA still failing after repair: ${s.qa.consistency.reason}`);
  }
  const url = await saveImage(book.id, `page${i + 1}.jpg`, s.buf);
  job.sceneUrls.push(url);
  if (loc && !job.anchors[loc]) job.anchors[loc] = url;
}

async function stepCover(book, job) {
  const story = job.story;
  const child = childOf(book);
  const { fromText } = makeObjectBlocks(story);
  const heroBuf = await loadByUrl(job.heroUrl);
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
  const anchorUrl = mainLoc ? job.anchors[mainLoc] : null;
  const coverObjectNames = (story.key_objects || []).map((o) => o?.name).filter((n) => n && coverBrief.toLowerCase().includes(n.toLowerCase()));
  const objectRefs = (await Promise.all(coverObjectNames.map((name) => objectSheetFor(book, job, name)))).filter(Boolean);
  const cover = await generateCover({
    heroBuf,
    brief: coverBrief,
    child,
    settingBlock: worldBlockOf(story) + fromText(coverBrief),
    anchorBuf: anchorUrl ? await loadByUrl(anchorUrl) : null,
    objectRefs,
    previousResponseId: job.chainResponseId,
  });
  job.cost += cover.cost; job.breakdown.images_usd += cover.cost; job.breakdown.qa_notes.push(cover.qa);
  job.coverUrl = await saveImage(book.id, "cover.jpg", cover.buf);
}

async function stepCountry(book, job) {
  try {
    const cf = await countryFacts({
      country: book.country || "the United Kingdom",
      city: book.city || null,
      cultureNotes: book.culture_notes || null,
    });
    job.cost += cf.cost; job.breakdown.story_usd += cf.cost;
    job.country = cf.data;
    const lm = await generateLandmark({
      name: cf.data.landmark.name,
      imageBrief: cf.data.landmark.image_brief,
      city: book.city,
      country: book.country,
    });
    job.cost += lm.cost; job.breakdown.images_usd += lm.cost; job.breakdown.qa_notes.push(lm.qa);
    job.landmarkUrl = await saveImage(book.id, "landmark.jpg", lm.buf);
  } catch (e) {
    console.warn("[forge] country pack failed (profile renders without it):", e.message);
  }
  job.countryDone = true;
}

// Cold-editor whole-book gate (Lynden 2026-08-13): a critic-framed review of
// the FINISHED book — cover + every page image + every sentence at once —
// because per-page checklist judges structurally cannot see a thin premise,
// a drifting object, or a phonics page contradicting the story. An external
// cold read caught all of those in "The Chip on Top" after every per-page
// gate had passed. Reject-severity issues fail the book rather than ship it.
async function stepReview(book, job) {
  const story = job.story;
  const level = getLevel(book.level);
  const { reviewThumb } = await import("./images.mjs");

  const urls = [job.coverUrl, ...job.sceneUrls].filter(Boolean);
  const images = [];
  for (const url of urls) {
    const buf = await loadByUrl(url);
    const small = await reviewThumb(buf);
    images.push({ b64: small.toString("base64"), mime: "image/jpeg" });
  }

  const { coldEditorReview } = await import("./claude.mjs");
  const { data: review, cost } = await coldEditorReview({ story, level, focusSound: book.focus_sound, images });
  job.cost += cost || 0;
  job.breakdown.editor_review = review;

  const rejects = (review.issues || []).filter((i) => i.severity === "reject");
  if (!review.pass || rejects.length) {
    const detail = rejects.map((i) => `[${i.area}] ${i.detail}`).join(" | ") || review.reason;
    throw new Error(`editor gate rejected the book: ${detail}`.slice(0, 290));
  }
  job.reviewDone = true;
}

async function stepAssemble(book, job) {
  const story = job.story;
  const child = childOf(book);
  const level = getLevel(book.level);
  const pages = [
    { type: "cover", title: story.title, imageUrl: job.coverUrl, levelColour: level.colour, levelName: level.name, focusSound: book.focus_sound },
    ...story.pages.map((p, i) => ({ type: "story", text: p.text, imageUrl: job.sceneUrls[i] })),
    {
      type: "profile",
      heroUrl: job.heroUrl,
      name: child.name,
      age: child.age,
      city: book.city || null,
      country: child.country,
      countryFlag: book.country_flag,
      likes: child.likes,
      culture: child.cultureNotes,
      faith: book.faith || null,
      greeting: job.country?.greeting || null,
      facts: job.country?.facts || [],
      landmark: job.country
        ? { name: job.country.landmark.name, fact: job.country.landmark.fact, imageUrl: job.landmarkUrl }
        : null,
    },
  ];

  await updateBook(book.id, {
    status: "ready",
    title: story.title,
    pages,
    story: { story, validation: job.validation, directed: job.directed, shiftyMarks: job.shiftyMarks },
    profile: pages[pages.length - 1],
    cost_usd: Number(job.cost.toFixed(4)),
    cost_breakdown: job.breakdown,
    progress: { step: "done", message: "Your book is ready!", pct: 100 },
  });
  job.assembled = true;

  // The typeset PDF needs Python + Playwright — dev-machine only. In prod the
  // reader is the product and the PDF button degrades gracefully (501 → the
  // frontend falls back to the interactive reader).
  if (!IS_SERVERLESS) {
    try {
      await renderPdf(book.id, { force: true });
    } catch (e) {
      console.warn("[forge] pdf typeset failed (book still readable):", e.message);
    }
  }
}

// Human-facing progress line per step. pct is monotonic across the machine.
function displayFor(book, job, step) {
  const name = book.child_name;
  const total = job.story?.pages?.length || 8;
  const map = {
    story: ["story", `Writing ${name}'s story around the sound "${book.focus_sound}"...`, 5],
    qa: ["phonics_qa", "Checking every word is decodable at this level...", 15],
    plausibility: ["plausibility_qa", "Checking the story actually makes sense...", 20],
    direct: ["directing", `Directing the scenes (walking the story in ${name}'s shoes)...`, 25],
    hero: ["hero", `Drawing ${name} as a book character (eye rule enforced)...`, 30],
    cover: ["cover", "Painting the cover...", 85],
    country: ["country", `Collecting wonders from ${book.country || "home"}...`, 90],
    review: ["editor", "A cold-eyed editor is reading the finished book...", 93],
    assemble: ["assemble", "Binding the book...", 96],
    done: ["done", "Your book is ready!", 100],
  };
  if (step.startsWith("scene:")) {
    const i = Number(step.split(":")[1]);
    return { step: "scenes", message: `Illustrating page ${i + 1} of ${total}...`, pct: 35 + Math.round((i / total) * 45) };
  }
  const [s, m, p] = map[step];
  return { step: s, message: m, pct: p };
}

// Advance the machine by exactly one unit of work. Returns
// { done, step, status } — `step` is what just RAN (or "busy"/"done").
export async function runNextStep(bookId) {
  const book = await getBook(bookId);
  if (!book) throw new Error("book not found");
  if (["ready", "approved", "rejected"].includes(book.status)) return { done: true, step: "done", status: book.status };
  if (!getLevel(book.level)) throw new Error(`bad level ${book.level}`);

  let job = book.progress?.job || null;
  // Lock: refuse to double-run a step that another invocation started moments
  // ago (two tabs, double-click). Stale locks are reclaimed.
  if (job?.lockAt && Date.now() - job.lockAt < LOCK_MS && job.lockStep === nextStepOf(job)) {
    return { done: false, step: "busy", status: book.status };
  }
  if (!job) job = newJob(book);

  const step = nextStepOf(job);
  if (step === "done") return { done: true, step: "done", status: "ready" };

  job.lockAt = Date.now();
  job.lockStep = step;
  await persist(bookId, job, displayFor(book, job, step));

  try {
    if (step === "story") await stepStory(book, job);
    else if (step === "qa") await stepQa(book, job);
    else if (step === "plausibility") await stepPlausibility(book, job);
    else if (step === "direct") await stepDirect(book, job);
    else if (step === "hero") await stepHero(book, job);
    else if (step.startsWith("scene:")) await stepScene(book, job, Number(step.split(":")[1]));
    else if (step === "cover") await stepCover(book, job);
    else if (step === "country") await stepCountry(book, job);
    else if (step === "review") await stepReview(book, job);
    else if (step === "assemble") await stepAssemble(book, job);
  } catch (e) {
    job.lockAt = null;
    job.lockStep = null;
    await updateBook(bookId, {
      status: "failed",
      progress: {
        step: "failed",
        message: String(e.message || e).slice(0, 300),
        pct: 0,
        job, // kept: retry resumes from the failed step, not from scratch
      },
    });
    throw e;
  }

  job.lockAt = null;
  job.lockStep = null;
  const after = nextStepOf(job);
  if (after !== "done") {
    // Show the NEXT step's message so the bar never sits on a finished stage.
    await persist(bookId, job, displayFor(book, job, after));
  }
  return { done: after === "done", step, status: after === "done" ? "ready" : "generating" };
}

// -------------------------------------------------------------- lifecycle --

export async function startGeneration(bookId) {
  if (running.has(bookId)) return;
  const book = await getBook(bookId);
  if (!book) return;

  // Resume-aware: a failed book keeps its job state, so retry continues from
  // the failed step (paying again for nothing already done).
  await updateBook(bookId, { status: "generating" });

  if (IS_SERVERLESS) {
    // No background work on a lambda — set up the row and let the wizard
    // drive via POST /books/:id/step. Kick nothing off here.
    const job = book.progress?.job || newJob(book);
    await persist(bookId, job, displayFor(book, job, nextStepOf(job)));
    return;
  }

  running.add(bookId);
  (async () => {
    for (;;) {
      const r = await runNextStep(bookId);
      if (r.done) break;
      if (r.step === "busy") await new Promise((res) => setTimeout(res, 5000));
    }
  })()
    .catch((e) => console.error("[forge] generation failed", bookId, e))
    .finally(() => {
      running.delete(bookId);
      photoStash.delete(bookId);
    });
}

// Render the finished book through the REAL book pipeline (book_v2.html).
// Locally: scripts/generate_custom_book.py → Playwright → A5 PDF, direct.
// In production: api/render-book-html.py (same Jinja2 template) → Node
// Chromium (pdf.mjs) → A5 PDF, then emailed to whoever ordered the book
// (email.mjs). See renderPdfServerless above for why it's split this way.
const pdfInFlight = new Map();

export function renderPdf(bookId, opts = {}) {
  if (pdfInFlight.has(bookId)) return pdfInFlight.get(bookId);
  const p = (IS_SERVERLESS ? renderPdfServerless(bookId, opts.origin) : renderPdfInner(bookId, opts))
    .finally(() => pdfInFlight.delete(bookId));
  pdfInFlight.set(bookId, p);
  return p;
}

// Shared by both the local (Python+Playwright) and serverless (Python HTML
// function + Node Chromium) renderers — everything about turning a book row
// into a book_v2 spec except WHERE the source images live, which is the only
// thing that differs between the two (see generate_custom_book.py's
// build_custom_book_data docstring for the same principle on the Python side).
function buildPdfSpecCore(book) {
  const story = book.story?.story || {};
  return {
    book_title: book.title || `${book.child_name}'s Story`,
    child_name: book.child_name,
    level: book.level,
    focus_sound: book.focus_sound,
    story_pages: book.pages.filter((p) => p.type === "story").map((p) => p.text),
    // Story Words page shows ALL SIX read_words (>=3 with the focus sound),
    // not just the 3 focus examples — Lynden 2026-08-13: "six Story Words in
    // total; at least three containing the target sound; three additional
    // important decodable story words." The writer already returns exactly
    // this set; passing only focus_word_examples was hiding half of it.
    story_words: story.read_words?.length ? story.read_words : (story.focus_word_examples || []),
    read_words: story.read_words || [],
    questions: story.questions || [],
    alien_words: story.alien_words || [],
    tricky_words_used: story.tricky_words_used || [],
    shifty_marks: book.story?.shiftyMarks || {},
    pronunciation_notes: [pronunciationNoteFor(book.focus_sound, book.level)].filter(Boolean),
    profile: book.profile || {},
  };
}

async function renderPdfInner(bookId, { force = false } = {}) {
  const dir = path.join(CUSTOM_BOOKS_DIR, bookId);
  const outPath = path.join(dir, "book.pdf");
  const url = `/custom-books/${bookId}/book.pdf`;
  if (!force && fs.existsSync(outPath)) return url;

  const book = await getBook(bookId);
  if (!book?.pages) throw new Error("book has no pages yet");
  const spec = { ...buildPdfSpecCore(book), images_dir: dir, out_path: outPath };
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

// image_urls keys must match what api/render-book-html.py's fetch_images
// writes (cover/page1../hero/landmark) and what build_custom_book_data reads
// back off the resulting local dir — same naming contract as the local path's
// cover.jpg/pageN.jpg/hero.jpg/landmark.jpg convention.
function imageUrlsOf(book) {
  const urls = {};
  const cover = book.pages.find((p) => p.type === "cover");
  if (cover?.imageUrl) urls.cover = cover.imageUrl;
  book.pages.filter((p) => p.type === "story").forEach((p, i) => {
    if (p.imageUrl) urls[`page${i + 1}`] = p.imageUrl;
  });
  if (book.profile?.heroUrl) urls.hero = book.profile.heroUrl;
  if (book.profile?.landmark?.imageUrl) urls.landmark = book.profile.landmark.imageUrl;
  return urls;
}

// The serverless PDF pipeline: Python function builds the real book_v2 HTML
// (same Jinja2 template + business logic as the studio machine) and uploads
// it to storage; Chromium here converts that HTML to the final PDF; then the
// finished book is emailed to whoever ordered it. See api/render-book-html.py
// and pdf.mjs for why this is split this way (Playwright doesn't run on
// Vercel's Python runtime).
async function renderPdfServerless(bookId, origin) {
  const book = await getBook(bookId);
  if (!book?.pages) throw new Error("book has no pages yet");

  const spec = { ...buildPdfSpecCore(book), book_id: bookId, image_urls: imageUrlsOf(book) };

  // MUST be the real custom-domain host the request arrived on (passed in
  // by router.mjs), not process.env.VERCEL_URL — that always resolves to the
  // per-deployment *.vercel.app hostname, which Vercel's Deployment
  // Protection blocks even in production (custom domains are exempt).
  // Verified live 2026-08-09: this fetch 401'd with "Protected deployment"
  // until callers started passing the request's own origin through.
  if (!origin) throw new Error("renderPdfServerless needs the request's origin (VERCEL_URL is blocked by deployment protection)");
  const htmlRes = await fetch(`${origin}/api/render-book-html`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(spec),
  });
  if (!htmlRes.ok) {
    throw new Error(`render-book-html failed: ${htmlRes.status} ${(await htmlRes.text()).slice(0, 300)}`);
  }
  const { html_url: htmlUrl } = await htmlRes.json();

  const { htmlUrlToPdf, pdfPageCount } = await import("./pdf.mjs");
  const pdfBuf = await htmlUrlToPdf(htmlUrl);
  // HARD PAGE-COUNT GATE (Lynden 2026-08-13, after a 17-page L3 book shipped):
  // custom books are exactly 16 pages at L1-4 and 20 at L5-8 — anything else
  // is unstitchable and must never reach the customer.
  const expectedPages = book.level <= 4 ? 16 : 20;
  const gotPages = pdfPageCount(pdfBuf);
  if (gotPages !== expectedPages) {
    throw new Error(`page-count gate: rendered PDF has ${gotPages} pages, Level ${book.level} requires exactly ${expectedPages} — not delivering`);
  }
  const pdfUrl = await saveImage(bookId, "book.pdf", pdfBuf);

  const { sendBookReadyEmail } = await import("./email.mjs");
  const emailResult = await sendBookReadyEmail({
    to: book.email,
    childName: book.child_name,
    title: book.title || `${book.child_name}'s Story`,
    pdfBuf,
    pdfUrl,
  });
  if (!emailResult.sent) {
    console.warn(`[forge] book-ready email not sent for ${bookId}: ${emailResult.reason}`);
  }

  return pdfUrl;
}
