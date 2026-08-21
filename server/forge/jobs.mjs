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
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getLevel, greenWordsUpTo, progressionUpTo, pronunciationsFor, pronunciationNoteFor, focusSoundViolations, focusSoundCountViolation, coreStoriesFor } from "./phonics.mjs";
import { fixMechanics, checkProse } from "./prose.mjs";
import { writeStory, reviewStory, rewriteStory, reviewStoryPlausibility, fixStoryPlausibility, directScenes, countryFacts, markShiftySounds, extractSceneState, storyEditorReview, reviseStoryAfterEditor, deriveEditorVerdict, STORY_SHAPES } from "./claude.mjs";
import { generateHero, generateCastMember, generateObjectRef, generateScene, generateCover, generateLandmark } from "./images.mjs";
import { saveImage, loadByUrl, IS_SERVERLESS, CUSTOM_BOOKS_DIR } from "./storage.mjs";
import { getBook, updateBook, recentStoryShapes, restoreCreditForBook } from "./db.mjs";
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

// Maximum AUTOMATIC spend per book. Reaching it PAUSES the job (resumable,
// nothing lost) instead of letting rewrites and regenerations run open-ended
// — the $2.60 loss on 2026-08-14 came from a from-scratch regeneration that
// no ceiling would have allowed to double-spend silently. A human retry on a
// paused_budget book authorises one more budget unit (see router.mjs).
export const MAX_BOOK_SPEND_USD = Number(process.env.FORGE_MAX_BOOK_USD || 6);

// Text-only test mode (Lynden 2026-08-14): stop after the story editor gate,
// before a single image is generated. A rejected draft then costs pennies.
// Switched by env var OR a dev marker file next to this module, so a test
// run can flip it without restarting the vite process.
function isTextOnly() {
  if (process.env.FORGE_TEXT_ONLY === "1") return true;
  try {
    return fs.existsSync(path.join(path.dirname(fileURLToPath(import.meta.url)), ".text_only"));
  } catch {
    return false;
  }
}

// A double editor rejection is a CONTENT decision, not an infrastructure
// failure — carried as a typed error so runNextStep can route it to the
// content_rejected state (credit restored, assets preserved) instead of the
// generic "failed" retry flow.
class ContentRejectedError extends Error {
  constructor(message) {
    super(message);
    this.contentRejected = true;
  }
}

// Provider-credit exhaustion is a PAUSE, not a failure: the job keeps every
// checkpoint and resumes with the same provider once credits are topped up
// (OpenAI ran dry mid-book on 2026-08-12 and the book died; a silent
// fallback provider is banned — it breaks character/style continuity).
const PROVIDER_CREDIT_RE = /insufficient[_ ]quota|billing[_ ]hard[_ ]limit|exceeded your current quota|payment required|insufficient credit|\b402\b/i;

// How many EDIT REQUESTS the story gate may issue before the book proceeds
// with the remaining notes attached (Lynden 2026-08-17: "no full rejections,
// only edit requests after judgements"). Each pass costs roughly a first
// draft, so this is the spend ceiling on rewriting, not a quality dial.
const STORY_EDIT_REQUESTS = Number(process.env.FORGE_STORY_EDIT_REQUESTS || 2);

function newJob(book) {
  return {
    v: 1,
    cost: 0,
    breakdown: { story_usd: 0, images_usd: 0, qa_notes: [], stages: {} },
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
  // STORY GATE BEFORE ANY IMAGE (Lynden 2026-08-14): "Yusuf and the Star
  // Tin" was double-rejected for story thinness with 16 finished paid
  // illustrations. Both rejections were visible in the text alone, so the
  // editor now judges the manuscript here — premise, six-beat plan, page
  // texts — while a rejected draft still costs pennies. Nothing downstream
  // (direction, hero, scenes, cover) runs until the story has passed.
  if (!job.storyGateDone) return "storyGate";
  if (job.textOnly) return job.textReported ? "done" : "textReport";
  if (!job.directDone) return "direct";
  // IMAGERY APPROVAL GATE (Lynden 2026-08-16, "idea one"): the text→image
  // boundary is where the money starts, so by default a book STOPS here with
  // its full imagery contract (story + director plan + visible-state
  // assertions) and waits for a human sign-off before a single image is
  // generated. FORGE_AUTO_APPROVE=1 restores the old straight-through flow.
  if (!job.imageryApproved && process.env.FORGE_AUTO_APPROVE !== "1") return "awaitImagery";
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

  // EXACTLY SIX STORY WORDS, deterministically (Lynden 2026-08-14: a book
  // shipped displaying eight). The schema asks the writer for 6 but nothing
  // enforced it — so normalise here: focus-sound words first, then other
  // words from the list, topped up from the story's own decodable vocabulary
  // if the writer under-delivered, hard-capped at 6.
  //
  // SPLIT IS 2 + 4 (Lynden 2026-08-16, was 3 + 3): two words for the focus
  // sound, then four story words drawn from the LEVEL's own decodable bank.
  // The sound is already spotlighted elsewhere in the book; this page earns
  // more by widening the child's level vocabulary than by drilling the sound
  // a third time.
  {
    const focus = String(book.focus_sound || "").toLowerCase();
    const uniq = [...new Set((story.read_words || []).map((w) => String(w).toLowerCase()).filter(Boolean))];
    const bank = new Set(greenWordsUpTo(book.level).map((w) => String(w).toLowerCase()));
    const textTokens = [...new Set(story.pages.flatMap((p) => (p.text.toLowerCase().match(/[a-z']+/g) || [])))];
    const hasFocus = (w) => focus && w.includes(focus);
    const focusPool = [...new Set([
      ...uniq.filter(hasFocus),
      ...(story.focus_word_examples || []).map((w) => String(w).toLowerCase()),
      ...textTokens.filter((t) => hasFocus(t) && bank.has(t)),
    ])];
    const otherPool = [...new Set([
      ...uniq.filter((w) => !hasFocus(w)),
      ...textTokens.filter((t) => !hasFocus(t) && t.length > 2 && bank.has(t)),
    ])];
    const six = [...focusPool.slice(0, 2), ...otherPool.slice(0, 4)];
    for (const w of [...otherPool.slice(4), ...focusPool.slice(2)]) {
      if (six.length >= 6) break;
      if (!six.includes(w)) six.push(w);
    }
    if (six.length !== (story.read_words || []).length || six.some((w, i) => w !== String(story.read_words?.[i] || "").toLowerCase())) {
      console.warn(`[forge] read_words normalised ${JSON.stringify(story.read_words)} -> ${JSON.stringify(six)}`);
    }
    story.read_words = six.slice(0, 6);
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

// Reset everything downstream of the story so the machine re-enters at
// phonics QA with a revised manuscript. The hero sheet survives (same child);
// cast/object sheets are on-demand caches keyed by name, so unchanged members
// are reused and new ones get drawn.
function resetAfterStoryRevision(job, revisedStory) {
  job.story = revisedStory;
  job.qaDone = false;
  job.plausibilityDone = false;
  job.storyGateDone = false;
  job.directDone = false;
  job.directed = null;
  job.sceneUrls = [];
  job.anchors = {};
  job.coverUrl = null;
  job.chainResponseId = null;
  job.carriedState = null;
}

// The text-only editor gate. Severity decides (deriveEditorVerdict): only a
// critical/major issue blocks; minors are internal notes and the book
// proceeds. One bounded same-premise revision; a second rejection is a
// content rejection (credit restored), never a delivery of the weak book.
async function stepStoryGate(book, job) {
  const level = getLevel(book.level);
  const { data: review, cost } = await storyEditorReview({ story: job.story, level, focusSound: book.focus_sound });
  job.cost += cost || 0; job.breakdown.story_usd += cost || 0;
  const verdict = deriveEditorVerdict(review);

  if (verdict.pass) {
    if (verdict.minors.length) {
      // Minor-only review: the book ships; the notes stay for the audit trail.
      job.breakdown.story_gate_minors = verdict.minors;
    }
    job.breakdown.story_gate = review;
    job.storyGateDone = true;
    if (isTextOnly()) job.textOnly = true;
    return;
  }

  const detail = verdict.blocking.map((i) => `[${i.severity}/${i.area}] ${i.detail}`).join(" | ") || review.reason;
  // NO FULL REJECTIONS — EDIT REQUESTS ONLY (Lynden 2026-08-17). A gate never
  // kills a book now; it asks for edits and the writer works them. Rejecting a
  // paid book outright was the expensive half of "an expensive QA system that
  // reliably rejects books after the money is spent" — the customer waits, the
  // credit bounces back, and nothing ships.
  //
  // Bounded at STORY_EDIT_REQUESTS passes because unbounded rewriting is
  // unbounded spend, and each pass costs about what the first draft did. After
  // the last pass the remaining notes are carried as edit requests on the row
  // (story_gate_edit_requests) and the book PROCEEDS — the notes are what a
  // human acts on, rather than a dead job.
  if (job.storyEditRequests >= STORY_EDIT_REQUESTS) {
    job.breakdown.story_gate_second = review;
    job.breakdown.story_gate_edit_requests = verdict.blocking;
    job.breakdown.story_gate = review;
    job.storyGateDone = true;
    if (isTextOnly()) job.textOnly = true;
    console.warn(`[forge] story gate: ${STORY_EDIT_REQUESTS} edit passes used, proceeding with ${verdict.blocking.length} open edit request(s): ${detail.slice(0, 200)}`);
    return;
  }

  // ONE bounded revision. The premise is LOCKED unless the editor explicitly
  // rejected the premise itself (a blocking issue with area "premise") —
  // the 2026-08-14 revision abandoned the simit-cart premise and invented an
  // unrelated star-tin book, which is exactly what the lock forbids.
  job.storyRetryUsed = true;
  job.storyEditRequests = (job.storyEditRequests || 0) + 1;
  job.breakdown[job.storyEditRequests === 1 ? "story_gate_first" : `story_gate_pass_${job.storyEditRequests}`] = review;
  // The premise unlocks once the editor calls it unusable — and also on the
  // LAST edit pass, because a premise that has already survived one failed
  // rewrite is the thing that keeps failing (Omar, 08-16: two drafts rejected
  // for the same engineless premise because the lock never lifted).
  const premiseRejected = verdict.blocking.some((i) => String(i.area || "").toLowerCase() === "premise")
    || job.storyEditRequests >= STORY_EDIT_REQUESTS;
  const child = childOf(book);
  const pagesCount = storyPagesFor(book.level);
  const revised = await reviseStoryAfterEditor({
    level, child, focusSound: book.focus_sound, pagesCount,
    story: job.story, review, premiseRejected,
    greenWords: greenWordsUpTo(book.level),
    progression: progressionUpTo(book.level),
    exemplars: coreStoriesFor(book.level),
  });
  job.cost += revised.cost || 0; job.breakdown.story_usd += revised.cost || 0;
  resetAfterStoryRevision(job, revised.data);
  // machine re-enters at "qa" with the revised story
}

// Terminal step of a FORGE_TEXT_ONLY run: publish the approved manuscript
// and every editor report onto the row (status "text_ready") without
// spending a cent on images. Used for cheap story-quality test runs.
async function stepTextReport(book, job) {
  await updateBook(book.id, {
    status: "text_ready",
    title: job.story.title,
    story: { story: job.story, validation: job.validation },
    cost_usd: Number(job.cost.toFixed(4)),
    cost_breakdown: job.breakdown,
    progress: { step: "text_ready", message: "Text-only run complete — story approved, no images generated.", pct: 100, job },
  });
  job.textReported = true;
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
  // NEVER build a cast sheet for the hero: the hero reference (stepHero) is
  // their single fixed identity, and a second independently-generated sheet
  // inevitably wears a different outfit. On 2026-08-15 a revised story listed
  // Idris in its own cast, the QA was handed two conflicting "Idris" sheets,
  // and every page-2 attempt failed character match against one or the other
  // — an unwinnable deadlock that killed the book.
  const heroName = String(book.child_name || "").toLowerCase().trim();
  if (heroName && (key === heroName || key.includes(heroName))) return null;
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
  // Ownership/absence assertions go into the GENERATION brief too, not just
  // the QA — draw the allocation right first time rather than repair it.
  const assertionText = d && (d.required_visible_states?.length || d.forbidden_visible_states?.length)
    ? ` MUST BE CLEARLY VISIBLE: ${(d.required_visible_states || []).map((a) => `${a.object} — ${a.assertion}`).join("; ")}.` +
      ((d.forbidden_visible_states || []).length ? ` MUST NOT BE SHOWN: ${(d.forbidden_visible_states || []).map((a) => `${a.object} — ${a.assertion}`).join("; ")}.` : "")
    : "";
  let sceneBrief = d ? `${d.brief} ${child.name} feels ${d.emotion}. Staging: ${d.staging}${assertionText}` : story.pages[i].scene;
  // Targeted repair (Lynden 2026-08-16, "edits instead of a complete re-run"):
  // a repair note for this page rides into the brief so the regeneration
  // fixes the named fault from the start instead of re-rolling the dice.
  const repairNote = job.repairNotes?.[i + 1] || job.repairNotes?.[String(i + 1)];
  if (repairNote) sceneBrief += ` REPAIR — the previous version of this page had this specific problem; fix it and keep everything else the same: ${repairNote}`;
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

  const sceneArgs = {
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
    // Director-declared ownership/negative-state assertions for this page —
    // verified against the finished image by sceneConsistencyQA (an object
    // being visible is not the same as the allocation being visible).
    assertions: d ? { required: d.required_visible_states || [], forbidden: d.forbidden_visible_states || [] } : null,
    previousResponseId: job.chainResponseId,
  };
  let s = await generateScene(sceneArgs);
  // A FAILED CONSISTENCY QA IS BLOCKING (Lynden 2026-08-15, "The Train in the
  // Drain": pages 4-5 failed QA with exact, correct reasons — "she is not
  // shown actually sliding a hook into the drain" — and the old code logged a
  // console warning and SHIPPED them; the paid-for verdict went in the bin).
  // generateScene already did one chained repair; here we regenerate the
  // scene ONCE from scratch (chain broken, so the model can't just re-emit
  // its own bad picture), and if the action still is not visible the book
  // fails resumably at this scene instead of delivering a page whose central
  // action happens off-camera.
  if (s.qa?.consistency && !s.qa.consistency.pass) {
    console.warn(`[forge] page ${i + 1} consistency QA failed after repair — regenerating from scratch: ${s.qa.consistency.reason}`);
    job.cost += s.cost; job.breakdown.images_usd += s.cost;
    job.breakdown.qa_notes.push({ ...s.qa, page: i + 1, discarded: "consistency fail — regenerated" });
    s = await generateScene({ ...sceneArgs, previousResponseId: null });
    if (s.qa?.consistency && !s.qa.consistency.pass) {
      job.cost += s.cost; job.breakdown.images_usd += s.cost;
      job.breakdown.qa_notes.push({ ...s.qa, page: i + 1, discarded: "consistency fail — page rejected" });
      // NO FULL REJECTIONS - EDIT REQUESTS ONLY (20.2), and that doctrine was
      // never applied here: a single stubborn page killed a fully paid book
      // (Amara, 2026-08-21 - the QA read the cart's own wooden side slats as
      // the story's "plank" and failed the page twice). Two attempts is the
      // spend ceiling; the third picture ships with the fault recorded as an
      // open edit request, and the cold editor still sees it downstream.
      job.qaEditRequests = job.qaEditRequests || [];
      job.qaEditRequests.push({ page: i + 1, reason: String(s.qa.consistency.reason).slice(0, 300) });
      console.warn(`[forge] page ${i + 1}: shipping after 2 failed attempts, recorded as an edit request - ${String(s.qa.consistency.reason).slice(0, 160)}`);
    }
  }
  job.cost += s.cost; job.breakdown.images_usd += s.cost;
  if (s.responseId) job.chainResponseId = s.responseId;
  job.breakdown.qa_notes.push({ ...s.qa, page: i + 1, location: loc || null, camera, anchored: Boolean(anchorBuf), chained: Boolean(s.responseId) });

  // Record what the approved image ACTUALLY shows for each key object, for
  // the next page to inherit. Non-fatal: a failed extraction just means the
  // next page falls back to plan-only state, as every page did before this.
  try {
    // The continuity register is DYNAMIC: an object joins it the moment the
    // story makes it matter, not only if it was declared a key_object up
    // front. "The Star Card"'s mat became the story's hiding place on page 3
    // yet was never tracked — its pattern, tassels and lifted-edge physics
    // drifted page to page (Lynden 2026-08-14). Director-declared per-page
    // objects are exactly that register, so record their state too.
    const objectNames = [...new Set([
      ...(story.key_objects || []).map((o) => o?.name),
      ...((d?.objects || []).map((o) => o?.name)),
    ].filter(Boolean))];
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
  // Repair mode regenerates an EXISTING page in place; normal generation
  // appends the next page. saveImage upserts the same filename either way.
  if (i < job.sceneUrls.length) job.sceneUrls[i] = url;
  else job.sceneUrls.push(url);
  if (loc && !job.anchors[loc]) job.anchors[loc] = url;
}

async function stepCover(book, job) {
  // THE COVER IS A STORY PAGE, NOT A NEW PAINTING (Lynden 2026-08-20:
  // "the cover should just be taken from one of the images of the story").
  // Generating a separate cover cost money and invented a whole class of
  // defects nothing else had: painted-in lettering (which killed this very
  // book after two paid attempts), a hero drawn twice, a setting the story
  // never visits. A crop of an image that already passed its own page QA
  // has none of those failure modes and costs nothing.
  //
  // Which page: the FIRST page is the setup - the hero is present, the mood
  // is warm, and it cannot spoil the ending. Skip it only if the director
  // marked it as having no clear view of the hero.
  const idx = 0;
  const srcUrl = job.sceneUrls[idx];
  if (!srcUrl) throw new Error("cover needs at least one finished story page");
  const srcBuf = await loadByUrl(srcUrl);
  const meta = await sharp(srcBuf).metadata();
  // Portrait 3:4 window, leaning toward the middle so whatever the hero is
  // looking at stays in frame (a hard-third crop once cut the story object
  // out entirely).
  const cw = Math.min(meta.width, Math.round(meta.height * 3 / 4));
  // CENTRE THE CROP ON THE HERO, not on the frame. A fixed centre crop cut
  // the hero in half at the left edge on the first book to use this path
  // (Amara, 2026-08-21). findFaces already exists and costs about a penny;
  // the biggest face is the hero at this scale, and a cover whose child is
  // clipped is not a cover.
  let centre = 0.5;
  try {
    const { findFaces } = await import("./claude.mjs");
    const f = await findFaces(srcBuf.toString("base64"));
    job.cost += f.cost || 0; job.breakdown.story_usd += f.cost || 0;
    const faces = (f.data?.faces || []).filter((x) => x.w > 0 && x.h > 0);
    if (faces.length) {
      // The BIGGEST face is usually the adult (they are nearer the camera and
      // simply larger) - the cover must centre on the CHILD, so prefer a face
      // labelled with the hero's name or as a child, and only fall back to size.
      const heroName = String(book.child_name || "").toLowerCase();
      const isHero = (f) => {
        const who = String(f.who || "").toLowerCase();
        return (heroName && who.includes(heroName)) || /(girl|boy|child|kid)/.test(who);
      };
      const pick = faces.filter(isHero).sort((a, b) => (b.w * b.h) - (a.w * a.h))[0]
        || faces.sort((a, b) => (b.w * b.h) - (a.w * a.h))[0];
      centre = Math.min(0.98, Math.max(0.02, pick.x + pick.w / 2));
    }
  } catch (e) {
    console.warn("[forge] cover face-find unavailable, centring crop:", e.message);
  }
  // Place the window so the hero sits at its centre, clamped inside the image.
  const left = Math.max(0, Math.min(meta.width - cw, Math.round(centre * meta.width - cw / 2)));
  const buf = await sharp(srcBuf).extract({ left, top: 0, width: cw, height: meta.height }).jpeg({ quality: 92 }).toBuffer();
  job.coverUrl = await saveImage(book.id, "cover.jpg", buf);
  job.breakdown.cover_source = { page: idx + 1, method: "crop of story page (no generation)", heroCentre: Number(centre.toFixed(3)) };
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
    // 1024px, not 640: the editor must be able to resolve the details its
    // rubric asks about (a hook on a stall, the slot width of a drain grate).
    const small = await reviewThumb(buf, 1024);
    images.push({ b64: small.toString("base64"), mime: "image/jpeg" });
  }

  // No silent caps: any per-page QA verdict that stayed failed reaches the
  // editor instead of dying in a console log (the exact failure of
  // 2026-08-15 — the QA had named the missing hook action and nobody read it).
  const unresolvedQa = (job.breakdown.qa_notes || [])
    .filter((n) => n && n.page && n.consistency && n.consistency.pass === false && !n.discarded)
    .map((n) => ({ page: n.page, reason: String(n.consistency.reason || "").slice(0, 300) }));

  const { coldEditorReview } = await import("./claude.mjs");
  const { data: review, cost } = await coldEditorReview({ story, level, focusSound: book.focus_sound, images, unresolvedQa });
  job.cost += cost || 0;
  job.breakdown.editor_review = review;
  // GATE MANIFEST: record that this gate ran AND that it answered its two
  // real-world lenses. A rubric field the model leaves empty is a gate that
  // did not really run, and until now nothing noticed (Lynden 2026-08-21).
  job.gates = job.gates || {};
  job.gates.cold_editor = {
    ran: true,
    teaching_truth: (review.teaching_truth || "").slice(0, 400) || "MISSING",
    image_physics: (review.image_physics || "").slice(0, 400) || "MISSING",
    issues: (review.issues || []).length,
  };
  if (!review.teaching_truth || !review.image_physics) {
    console.warn("[forge] cold editor skipped a real-world lens - treating as a blocking issue");
    review.issues = [...(review.issues || []), {
      severity: "major",
      area: !review.teaching_truth ? "teaching-truth" : "image-physics",
      detail: "The final gate did not answer this lens, so the book was never checked against the real world.",
    }];
  }

  // Pass/fail is DERIVED from issue severities, never from the model's
  // separately generated boolean (on 2026-08-14 a book was killed by a review
  // whose issues were all "minor" yet whose pass came out false). Minor-only
  // review = ship, with the notes kept internally.
  const verdict = deriveEditorVerdict(review);
  if (!verdict.pass) {
    const detail = verdict.blocking.map((i) => `[${i.severity}/${i.area}] ${i.detail}`).join(" | ") || review.reason;
    if (job.editorRetryUsed) {
      // NO FULL REJECTIONS — EDIT REQUESTS ONLY (Lynden 2026-08-17). The one
      // revision is spent, so the remaining notes ride on the row as edit
      // requests and the book proceeds. This gate sits AFTER the illustrations,
      // so rejecting here threw away everything already paid for; the story
      // gate before any image is what stops genuinely weak books cheaply.
      job.breakdown.editor_review_second = review;
      job.breakdown.editor_edit_requests = verdict.blocking;
      // reviewDone MUST be set on this path too: it is the only thing that
      // stops the machine re-entering this step, and this step costs a vision
      // call over every page image. Returning without it is an unbounded paid
      // loop, not a rejection.
      if (verdict.minors.length) job.breakdown.editor_review_minors = verdict.minors;
      job.reviewDone = true;
      console.warn(`[forge] editor gate: revision spent, proceeding with ${verdict.blocking.length} open edit request(s): ${detail.slice(0, 200)}`);
      return;
    }
    // ONE bounded revision (Lynden 2026-08-13: "rewrite once"): revise the
    // story against the editor's reasons — SAME PREMISE unless the editor
    // explicitly rejected the premise itself — then send the book back
    // through the machine from phonics QA. The revised story faces the
    // text-only story gate again BEFORE any scene regenerates.
    job.editorRetryUsed = true;
    job.breakdown.editor_review_first = review;

    // TARGETED REPAIR BEFORE FULL REWRITE (Lynden 2026-08-21). A rejection
    // used to rewrite the story and REPAINT EVERY PAGE plus the cover: on the
    // first website book that was ~$1.30 of the $3.48 spent re-drawing six
    // pages nobody had complained about. If every blocking issue is page-local
    // (a picture problem, not a story problem) the fix is to redraw only the
    // named pages with the editor's own words as the correction note - which
    // is exactly what repairBook already did for humans, and what this path
    // never called. A story-level fault still gets the full rewrite.
    // Allow-listing page-local areas was the wrong way round: the first real
    // rejection came back tagged "story-state" ("Page 5 does not show the
    // resolution"), a picture fault that names its own page, and the book took
    // a full rewrite + 6 repaints instead of one redraw. Only genuinely
    // BOOK-level faults justify a rewrite; anything else naming a page is
    // repaired in place (Lynden 2026-08-21).
    const BOOK_LEVEL = new Set(["premise", "story", "language", "phonics", "safety", "teaching-truth"]);
    const pageOf = (i) => {
      const m = String(i.detail || "").match(/\bpages?\s+(\d+)/i);
      return m ? Number(m[1]) : null;
    };
    const allPageLocal = verdict.blocking.every((i) => !BOOK_LEVEL.has(String(i.area || "").toLowerCase()) && pageOf(i));
    if (allPageLocal) {
      const notes = {};
      for (const i of verdict.blocking) {
        const n = pageOf(i);
        notes[n] = notes[n] ? `${notes[n]} ${i.detail}` : i.detail;
      }
      job.repairNotes = { ...(job.repairNotes || {}), ...notes };
      for (const n of Object.keys(notes).map(Number).sort((a, b) => a - b)) {
        if (n >= 1 && n <= job.sceneUrls.length) await stepScene(book, job, n - 1);
      }
      job.breakdown.editor_targeted_repair = notes;
      job.reviewDone = false; // the mended book re-earns its verdict
      console.warn(`[forge] editor gate: repairing only page(s) ${Object.keys(notes).join(", ")} instead of repainting the book`);
      return;
    }

    const premiseRejected = verdict.blocking.some((i) => String(i.area || "").toLowerCase() === "premise");
    const child = childOf(book);
    const pagesCount = storyPagesFor(book.level);
    const revised = await reviseStoryAfterEditor({
      level, child, focusSound: book.focus_sound, pagesCount,
      story, review, premiseRejected,
      greenWords: greenWordsUpTo(book.level),
      progression: progressionUpTo(book.level),
      exemplars: coreStoriesFor(book.level),
    });
    job.cost += revised.cost || 0;
    job.breakdown.story_usd += revised.cost || 0;
    resetAfterStoryRevision(job, revised.data);
    return; // machine re-enters at "qa" with the revised story
  }
  if (verdict.minors.length) job.breakdown.editor_review_minors = verdict.minors;
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
    storyGate: ["story_editor", "A demanding editor is reading the manuscript before we mix any paint...", 22],
    textReport: ["text_ready", "Text-only run complete — story approved, no images generated.", 100],
    direct: ["directing", `Directing the scenes (walking the story in ${name}'s shoes)...`, 25],
    awaitImagery: ["awaiting_imagery_approval", "Story approved - the imagery plan is waiting for sign-off before any paint is mixed...", 28],
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
  // A step the map does not know must never crash the whole job (awaitImagery
  // did exactly that for every website book after the 08-16 approval gate).
  const [s, m, p] = map[step] || ["working", "Working on the book...", 50];
  return { step: s, message: m, pct: p };
}

// Advance the machine by exactly one unit of work. Returns
// { done, step, status } — `step` is what just RAN (or "busy"/"done").
export async function runNextStep(bookId) {
  const book = await getBook(bookId);
  if (!book) throw new Error("book not found");
  if (["ready", "approved", "rejected", "text_ready", "content_rejected"].includes(book.status)) {
    return { done: true, step: "done", status: book.status };
  }
  if (!getLevel(book.level)) throw new Error(`bad level ${book.level}`);

  let job = book.progress?.job || null;
  // Lock: refuse to double-run a step that another invocation started moments
  // ago (two tabs, double-click). Stale locks are reclaimed.
  if (job?.lockAt && Date.now() - job.lockAt < LOCK_MS && job.lockStep === nextStepOf(job)) {
    return { done: false, step: "busy", status: book.status };
  }
  if (!job) job = newJob(book);
  if (!job.breakdown.stages) job.breakdown.stages = {}; // jobs from before the ledger existed

  const step = nextStepOf(job);
  if (step === "done") return { done: true, step: "done", status: book.status === "generating" ? "ready" : book.status };
  if (step === "awaitImagery") {
    // Not a step that RUNS — a resting state. The full imagery contract is
    // surfaced on the row for review; POST /api/forge/approve-imagery flips
    // job.imageryApproved and restarts generation from the hero step.
    await updateBook(bookId, {
      status: "awaiting_imagery_approval",
      progress: {
        step: "awaiting_imagery_approval",
        message: "Story approved. Waiting for imagery sign-off before any images are generated.",
        pct: 35,
        contract: {
          title: job.story.title,
          setting: job.story.setting,
          key_objects: job.story.key_objects,
          cast: job.story.cast,
          pages: (job.story.pages || []).map((p, i) => {
            const d = (job.directed || []).find((x) => x.page === i + 1) || {};
            return {
              page: i + 1, text: p.text, location: p.location || null,
              brief: d.brief || p.scene, camera: d.camera || null,
              objects: d.objects || [], cast_present: d.cast_present || [],
              required_visible_states: d.required_visible_states || [],
              forbidden_visible_states: d.forbidden_visible_states || [],
            };
          }),
        },
        job,
      },
    });
    return { done: true, step: "awaitImagery", status: "awaiting_imagery_approval" };
  }

  // SPEND CEILING: past the cap the job PAUSES (fully resumable) instead of
  // spending further. A human retry authorises one more budget unit by
  // raising job.capUsd (router.mjs) — automation never raises it itself.
  const cap = Number(job.capUsd || MAX_BOOK_SPEND_USD);
  if (job.cost >= cap) {
    console.error(`[forge] ADMIN: book ${bookId} paused at spend cap ($${job.cost.toFixed(2)} >= $${cap})`);
    await updateBook(bookId, {
      status: "paused_budget",
      progress: {
        ...(book.progress || {}),
        step: "paused_budget",
        message: "Taking a little longer than usual — the team has been alerted and your book will continue shortly.",
        pct: book.progress?.pct ?? 0,
        job,
      },
    });
    return { done: true, step: "paused", status: "paused_budget" };
  }

  job.lockAt = Date.now();
  job.lockStep = step;
  await persist(bookId, job, displayFor(book, job, step));

  const costBefore = job.cost;
  try {
    if (step === "story") await stepStory(book, job);
    else if (step === "qa") await stepQa(book, job);
    else if (step === "plausibility") await stepPlausibility(book, job);
    else if (step === "storyGate") await stepStoryGate(book, job);
    else if (step === "textReport") await stepTextReport(book, job);
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
    // Per-step cost ledger records even a failed step's spend.
    job.breakdown.stages[step] = Number(((job.breakdown.stages[step] || 0) + (job.cost - costBefore)).toFixed(4));

    if (e?.contentRejected) {
      // Two rejected drafts: never deliver the weak book, never start a
      // third automatic paid rewrite. Job + assets + editor reports are all
      // preserved in progress.job for debugging; the customer's credit is
      // restored; the state is distinct from infrastructure "failed".
      try {
        await restoreCreditForBook(bookId);
      } catch (err) {
        console.error(`[forge] ADMIN: credit restore failed for content-rejected book ${bookId}:`, err.message);
      }
      await updateBook(bookId, {
        status: "content_rejected",
        cost_usd: Number(job.cost.toFixed(4)),
        cost_breakdown: job.breakdown,
        // Durable archive in its OWN column — progress is rewritten wholesale
        // by every later step, so an archive stored there survives seconds
        // (the first try-again run wiped its predecessor's audit trail,
        // 2026-08-15). Append-only: each rejected run stacks up.
        rejected_runs: [
          ...(book.rejected_runs || []),
          { rejected_at: new Date().toISOString(), detail: String(e.message || e).slice(0, 300), job },
        ],
        progress: {
          step: "content_rejected",
          message: "We couldn't get this story to meet our quality standard. Your book credit has not been used — you can try the same idea again or choose a different story idea.",
          detail: String(e.message || e).slice(0, 300),
          pct: 0,
          job, // convenience copy for the wizard; the durable one is rejected_runs
        },
      });
      return { done: true, step, status: "content_rejected" };
    }

    if (PROVIDER_CREDIT_RE.test(String(e.message || e))) {
      // Provider credits ran out: PAUSE, don't fail, and never switch image
      // provider mid-book (a fallback breaks character/style continuity).
      // Every completed image is already checkpointed in job; after topping
      // up, retry resumes from this exact step with the same provider.
      console.error(`[forge] ADMIN: book ${bookId} paused — provider credits exhausted at step "${step}": ${e.message}`);
      await updateBook(bookId, {
        status: "paused_provider_credit",
        progress: {
          ...(book.progress || {}),
          step: "paused_provider_credit",
          message: "Your book is safe and saved — it will continue from exactly where it stopped shortly.",
          detail: String(e.message || e).slice(0, 300),
          pct: book.progress?.pct ?? 0,
          job,
        },
      });
      return { done: true, step, status: "paused_provider_credit" };
    }

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
  // Per-step cost ledger — separates story, each gate, each scene image,
  // cover, country pack and review so a cost overrun names its stage.
  const delta = job.cost - costBefore;
  if (delta > 0) {
    job.breakdown.stages[step] = Number(((job.breakdown.stages[step] || 0) + delta).toFixed(4));
  }
  const after = nextStepOf(job);
  if (after !== "done") {
    // Show the NEXT step's message so the bar never sits on a finished stage.
    await persist(bookId, job, displayFor(book, job, after));
  }
  const finalStatus = after === "done" ? (job.textReported ? "text_ready" : "ready") : "generating";
  return { done: after === "done", step, status: finalStatus };
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

// TARGETED REPAIR (Lynden 2026-08-16, "make any necessary edits instead of a
// complete re-run"): regenerate ONLY the named pages/cover of a finished (or
// editor-rejected) book, each with its fault note baked into the brief, then
// re-enter the normal step machine so the cold-editor review and assembly run
// again over the mended book. Everything not named keeps its paid-for image.
export async function repairBook(bookId, { scenes = {}, cover = null } = {}) {
  const book = await getBook(bookId);
  if (!book) throw new Error("book not found");
  const job = book.progress?.job;
  if (!job?.story) throw new Error("no job state with a story on this book — repair needs the archived job");
  if (!job.sceneUrls?.length) throw new Error("no generated scenes to repair");

  job.repairNotes = { ...scenes, ...(cover ? { cover } : {}) };
  // A human asked for this repair — that IS the imagery sign-off, and the
  // book's images were approved-for-spend when they were first generated.
  job.imageryApproved = true;
  const pageNums = Object.keys(scenes).map(Number).filter((n) => n >= 1 && n <= job.sceneUrls.length);
  if (!pageNums.length && !cover) throw new Error("nothing to repair — pass scenes {page: note} and/or cover note");

  // Regenerate the named scenes in place, cheapest-first order irrelevant —
  // sequential keeps prev-page continuity references coherent.
  await updateBook(bookId, { status: "generating", progress: { ...(book.progress || {}), step: "repair", message: `Repairing ${pageNums.length ? `page${pageNums.length > 1 ? "s" : ""} ${pageNums.join(", ")}` : ""}${cover ? `${pageNums.length ? " + " : ""}cover` : ""}...`, job } });
  for (const n of pageNums.sort((a, b) => a - b)) {
    await stepScene(book, job, n - 1);
    await persist(bookId, job, { step: "repair", message: `Repaired page ${n}`, pct: 80, job });
  }
  if (cover) job.coverUrl = null; // nextStepOf re-enters at "cover" with the note applied

  // The mended book must re-earn its verdict: review + assembly rerun.
  job.reviewDone = false;
  job.assembled = false;
  await persist(bookId, job, { step: "repair", message: "Repairs done — re-running the editor review...", pct: 85, job });
  startGeneration(bookId);
  return { repaired: pageNums, cover: Boolean(cover) };
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
    // Story Words page shows ALL SIX read_words, not just the focus examples
    // (passing only focus_word_examples was hiding half the page). Six in
    // total: 2 containing the target sound, then 4 further decodable story
    // words for the level (Lynden 2026-08-16; was 3 + 3 on 08-13).
    story_words: (story.read_words?.length ? story.read_words : (story.focus_word_examples || [])).slice(0, 6),
    read_words: (story.read_words || []).slice(0, 6),
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
