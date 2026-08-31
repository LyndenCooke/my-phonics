// Generation as a RESUMABLE STEP MACHINE: story â†’ phonics QA â†’ direction â†’
// hero â†’ one scene per step â†’ cover â†’ country pack â†’ assemble.
//
// Why steps and not one long job: production is Vercel serverless, where a
// function must answer within its time budget and NOTHING in memory survives
// between invocations. The old runJob() held the hero image in a local
// variable for four minutes â€” fine under vite, impossible on a lambda. So all
// state now lives in the book row (progress.job, plain JSON) and all images
// live in storage (URLs in that JSON, re-downloaded when a later step needs
// one as a reference). Any invocation, anywhere, can pick up exactly where
// the last one stopped: runNextStep(bookId) does one unit of work (â‰¤ ~60s),
// persists, returns.
//
// Two drivers, one engine:
//   dev (vite)   â€” startGeneration() loops the steps in-process, exactly the
//                  old behaviour from the outside.
//   prod (Vercel)â€” startGeneration() only INITIALISES; the wizard drives by
//                  calling POST /books/:id/step until { done: true }.
import { execFile } from "node:child_process";
import fs from "node:fs";
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getLevel, greenWordsUpTo, progressionUpTo, pronunciationsFor, pronunciationNoteFor, focusSoundViolations, focusSoundCountViolation, coreStoriesFor, sourceStoryFor, decodeProblems, borrowableTricky, isFutureSoundProblem } from "./phonics.mjs";
import { fixMechanics, checkProse } from "./prose.mjs";
import { writeStory, writeStoryCompact, stageStoryForBook, checkStoryState, polishStoryAloud, nameBreakdown, fixStoryWords, reviewStory, rewriteStory, reviewStoryPlausibility, fixStoryPlausibility, directScenes, countryFacts, markShiftySounds, extractSceneState, storyEditorReview, storyEditorFollowUp, reviseStoryAfterEditor, deriveEditorVerdict, judgeFluency, STORY_SHAPES } from "./claude.mjs";
import { withSpendContext, SpendCapError, DuplicateSpendOperationError } from "./spend.mjs";
import { generateHero, generateCastMember, generateObjectRef, generateScene, generateCover, generateLandmark } from "./images.mjs";
import { saveImage, loadByUrl, publicUrl, IS_SERVERLESS, CUSTOM_BOOKS_DIR } from "./storage.mjs";
import { getBook, updateBook, recentStoryShapes, recentSourceStories, restoreCreditForBook } from "./db.mjs";
import { BOOKS_DIR, cfg } from "./env.mjs";

export { CUSTOM_BOOKS_DIR };

const running = new Set();
// Uploaded photos are held in memory only, never written anywhere. In prod a
// later invocation may not be the one that stashed the photo â€” the hero then
// generates without the likeness rather than failing. Documented degradation.
const photoStash = new Map(); // bookId -> {b64, mime}

export function stashPhoto(bookId, b64, mime) {
  photoStash.set(bookId, { b64, mime });
}

export function isRunning(bookId) {
  return running.has(bookId);
}

// A step claims the row before working and releases after. Not a real mutex â€”
// Supabase REST gives us no compare-and-swap â€” but two polite clients (the
// wizard's driver never overlaps its own calls) only race if the user opens
// two tabs, and then the stale-after window keeps it self-healing.
const LOCK_MS = 2 * 60 * 1000;

// Maximum AUTOMATIC spend per book. Reaching it PAUSES the job (resumable,
// nothing lost) instead of letting rewrites and regenerations run open-ended
// â€” the $2.60 loss on 2026-08-14 came from a from-scratch regeneration that
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
// failure â€” carried as a typed error so runNextStep can route it to the
// content_rejected state (credit restored, assets preserved) instead of the
// generic "failed" retry flow.
class ContentRejectedError extends Error {
  constructor(message) {
    super(message);
    this.contentRejected = true;
  }
}

// A book that still carries an open MAJOR after every allowed pass STOPS for
// a human (Lynden 2026-08-24: "Never export, illustrate or call the book
// complete with an open MAJOR. The pass ceiling should limit spending, not
// lower the publication standard."). Job and reports are preserved and
// resumable; the credit is NOT restored â€” a human fixes and continues.
class NeedsReviewError extends Error {
  constructor(message) {
    super(message);
    this.needsReview = true;
  }
}

// Provider-credit exhaustion is a PAUSE, not a failure: the job keeps every
// checkpoint and resumes with the same provider once credits are topped up
// (OpenAI ran dry mid-book on 2026-08-12 and the book died; a silent
// fallback provider is banned â€” it breaks character/style continuity).
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
    characterSpec: canonicalCharacterSpec(book),
    // Responses-API conversation chain (SKILL.md Â§5.5): the last approved
    // scene turn's response id. Each scene chains onto this so the model
    // carries the actual generated world forward; the cover chains onto the
    // final scene. null until the first chained scene succeeds â€” and stays
    // null if the chain path is disabled or failing (stateless fallback).
    chainResponseId: null,
    chainDepth: 0,
    // Actual-result state (extractSceneState): what the last APPROVED image
    // literally shows for each key object â€” size, position, layout of marks.
    // Injected into the next page's prompt as binding fact, because mutable
    // state (dots drawn on a card) is pinned by neither the identity
    // reference nor the loose conversation chain.
    carriedState: null,
  };
}

// PER-CALL COST LEDGER (Lynden 2026-08-24: "$1.14 for 54 words" could not be
// diagnosed because every model call collapsed into two bucket totals). Every
// charge lands here as {call, usd}, so cost_breakdown.calls reads like an
// itemised receipt â€” which call, in order, and what it cost.
function charge(job, bucket, call, cost, model) {
  const c = Number(cost) || 0;
  job.cost += c;
  job.breakdown[bucket] += c;
  // model = the ACTUAL model id the API returned for this call (audit demand,
  // Lynden 2026-08-24: the ledger must name the model, not the alias).
  (job.breakdown.calls ||= []).push({ call, usd: Number(c.toFixed(4)), ...(model ? { model } : {}) });
}

function nextStepOf(job) {
  if (!job.story) return "story";
  if (!job.qaDone) return "qa";
  // The plausibility gate was a SECOND paid read of the same 60-word story,
  // costing $0.41 on a book whose whole text was $1.83 (Lynden 2026-08-21:
  // "how are we spending so much on the story itself"). Its duties moved into
  // the story gate, which already reads the manuscript and already owns the
  // edit-request loop. Left here as a no-op flag so resumed jobs written by
  // the old machine still advance.
  if (!job.plausibilityDone) { job.plausibilityDone = true; }
  // STORY GATE BEFORE ANY IMAGE (Lynden 2026-08-14): "Yusuf and the Star
  // Tin" was double-rejected for story thinness with 16 finished paid
  // illustrations. Both rejections were visible in the text alone, so the
  // editor now judges the manuscript here â€” premise, six-beat plan, page
  // texts â€” while a rejected draft still costs pennies. Nothing downstream
  // (direction, hero, scenes, cover) runs until the story has passed.
  if (!job.storyGateDone) return "storyGate";
  if (job.textOnly) return job.textReported ? "done" : "textReport";
  if (!job.directDone) return "direct";
  // IMAGERY BOUNDARY â€” AUTONOMOUS BY DEFAULT (Lynden 2026-08-23, "how can I
  // repair pages in place if I'm asleep"): the textâ†’image boundary is where
  // the money starts, and the machine now decides at it by itself:
  //   - CLEAN gate pass (no open edit requests) â†’ paint. A human pause here
  //     only helps when a human is watching; a paying customer's book must
  //     not sleep until morning.
  //   - Gate proceeded WITH open majors â†’ NO IMAGE MONEY follows a flawed
  //     story (the night-loop run-1 rule, now enforced in prod): one fresh
  //     attempt at the same spec while failure still costs pennies.
  //   - The fresh attempt is also flawed â†’ paint it anyway, ship, and
  //     AUTO-FLAG the book for the morning admin queue â€” a book with a known
  //     wrinkle now beats a customer staring at a spinner.
  // FORGE_MANUAL_IMAGERY=1 restores the human sign-off pause for review
  // sessions; FORGE_AUTO_APPROVE=1 keeps its old meaning (paint regardless).
  if (!job.imageryApproved && process.env.FORGE_AUTO_APPROVE !== "1") {
    if (process.env.FORGE_MANUAL_IMAGERY === "1") return "awaitImagery";
    const openReqs = job.breakdown?.story_gate_edit_requests || [];
    if (!openReqs.length) {
      job.imageryApproved = true;
    } else if (!job.freshAttemptUsed) {
      return "freshStory";
    } else {
      job.autoFlag = (job.autoFlag || []).concat(openReqs.map((i) => `[story/${i.area}] ${i.detail}`));
      job.imageryApproved = true;
    }
  }
  if (!job.heroUrl) return "hero";
  if (job.sceneUrls.length < job.story.pages.length) return `scene:${job.sceneUrls.length}`;
  if (!job.coverUrl) return "cover";
  if (!job.countryDone) return "country";
  // Editor-ordered repaints run ONE PER INVOCATION. stepReview used to
  // repaint every faulted page inside its own invocation, which blew
  // Vercel's 300s ceiling: the invocation was killed before anything
  // persisted and the next attempt re-ran (and re-paid for) the whole
  // review — Lynden's own book looped at "editor" for 40 minutes on
  // 2026-08-26 exactly this way.
  if ((job.repairQueue || []).length) return `repair:${job.repairQueue[0]}`;
  if (!job.reviewDone) return "review";
  if (!job.assembled) return "assemble";
  return "done";
}

// The ROW's cost must never lag the job's (Lynden 2026-08-26: "you're lying to
// me on price"). It was written only at a few milestones, so every charge after
// the last one â€” the cold editor, the cover face-find, assembly â€” stayed
// invisible: a book reported as $2.16 had actually spent $3.06. Every persist
// now carries the running total and the itemised breakdown, so what the row
// says is what has been spent.
async function persist(bookId, job, display) {
  await updateBook(bookId, {
    progress: { ...display, job },
    cost_usd: Number((job.cost || 0).toFixed(4)),
    cost_breakdown: job.breakdown,
  });
}

// ---------------------------------------------------------------- helpers --

const HERO_OUTFITS = [
  "a sunflower-yellow cardigan, raspberry-pink knee-length dress, teal leggings and pink-and-white trainers",
  "a cobalt-blue jumper, rust-orange trousers and white trainers",
  "a forest-green long-sleeved top, navy dungarees and red trainers",
  "a plum-purple tunic, mustard trousers and dark blue trainers",
];

export function canonicalCharacterSpec(book) {
  const appearance = { ...(book.appearance || {}) };
  if (!appearance.outfit) {
    const seed = [...String(book.id || book.child_name || "hero")].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
    appearance.outfit = HERO_OUTFITS[seed % HERO_OUTFITS.length];
  }
  return Object.freeze({
    name: book.child_name, age: book.child_age, gender: appearance.gender || null,
    skinTone: appearance.skinTone || null, hair: appearance.hair || null,
    outfit: appearance.outfit,
  });
}

function childOf(book) {
  const spec = canonicalCharacterSpec(book);
  return {
    name: book.child_name,
    age: book.child_age,
    city: book.city,
    country: book.country,
    cultureNotes: book.culture_notes,
    likes: book.likes,
    appearance: { ...(book.appearance || {}), outfit: spec.outfit },
    characterSpec: spec,
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
      return `${o.name}${look ? ` (story look: ${look})` : ""} â€” IMMUTABLE IDENTITY: ${o.identity_lock || look || "keep its exact established build"} â€” ON THIS PAGE: ${o.state}`;
    });
    return (
      ` KEY OBJECTS ON THIS PAGE â€” ${lines.join("; ")}. ` +
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
      ` KEY OBJECTS ON THIS PAGE â€” the same physical object every time it appears (${used
        .map((o) => `${o.name}: ${o.look}`)
        .join("; ")}). These descriptions say what each object LOOKS like, never where it is: its position and its current state come from the scene above and from nothing else. ` +
      "Draw ONLY the objects this scene calls for â€” never add an object just because it has been described."
    );
  };
  return { fromDirector, fromText };
}

// Custom books hold a fixed print budget â€” 16 total pages at L1-4, 20 at
// L5-8 (Lynden 2026-08-09, re-affirmed 2026-08-13 after a 17-page export).
// With the fixed activity/profile page set, that leaves exactly 6 story
// pages at L1-4 and 8 at L5-8, independent of the library's storyPages.
// The +Â£1 "longer story" add-on (Lynden 2026-08-26) upgrades an L1-4 book
// to 8 story pages, which necessarily moves it onto the 20-page print set â€”
// the 16-page booklet has exactly 6 story slots. L5-8 already include 8.
function storyPagesFor(book) {
  if (book.level > 4) return 8;
  return book.extra_pages ? 8 : 6;
}

// ------------------------------------------------------------------ steps --

async function stepStory(book, job) {
  const level = getLevel(book.level);
  const child = childOf(book);
  const pagesCount = storyPagesFor(book);
  // One story shape per book, chosen at random from whatever hasn't shipped
  // in the last few books â€” plain randomness let the same shape land twice in
  // a row ("The swap", 2026-08-07 and 2026-08-09), and both leant on the same
  // collect-a-few-objects crutch (Lynden 2026-08-09). Falls back to the full
  // list if recent history can't be read or would exclude everything.
  let pool = STORY_SHAPES;
  try {
    const recent = new Set(await recentStoryShapes(5));
    const fresh = STORY_SHAPES.filter((s) => !recent.has(s.name));
    if (fresh.length) pool = fresh;
  } catch {
    // history unavailable â€” fall back to the full pool rather than fail the book
  }
  const shape = pool[Math.floor(Math.random() * pool.length)];

// VARY A PROVEN BOOK RATHER THAN INVENT A PLOT (Lynden 2026-08-21: "the 33
// books i made have great stories... make variations of them based on new
// places/objects and characters"). Inventing plots is where our cost and
// most of our story defects lived. The source supplies the spine; the shape
// stays only as a fallback for when no source is available at this level.
let source = null;
try {
  source = sourceStoryFor(book.level, await recentSourceStories(6));
} catch (e) {
  console.warn("[forge] no source story available, inventing instead:", e.message);
}
if (source) console.log(`[forge] varying "${source.title}" for ${book.child_name}`);
  const writerOpts = {
    level, child, focusSound: book.focus_sound, pagesCount,
    greenWords: greenWordsUpTo(book.level),
    progression: progressionUpTo(book.level),
    pronunciations: pronunciationsFor(book.focus_sound, book.level),
    shape,
    source,
    exemplars: coreStoriesFor(book.level),
  };
  // CANDIDATES-AND-PICK (Lynden 2026-08-24, opt-in via FORGE_STORY_CANDIDATES):
  // generate N first drafts, decode-check each for free, then a BLIND fluency
  // judge (pages only, cross-vendor) picks the one that sounds most like
  // English. Three fresh drafts can beat repeatedly repairing one robotic one.
  // Default 1 = production behaviour unchanged.
  // One constrained draft is the production contract. The former tournament
  // could buy six drafts plus twelve judging/state calls before the real
  // editor saw a word. The story gate below already owns one bounded repair.
  const CANDIDATES = 1;
  // COMPACT MODE (Lynden 2026-08-25): the write call carries only the compact
  // writing contract; illustration data and the state chain are STAGED after
  // selection so they cannot bend the prose. FORGE_WRITER_PROMPT=compact.
  const COMPACT = process.env.FORGE_WRITER_PROMPT === "compact";
  // Each compact candidate gets a DIFFERENT curated story engine (2026-08-25:
  // without one, three books running converged on zip-snag plots â€” the same
  // diversity collapse the full brief once fixed with shape memory).
  // Engines come from the SAME short-term-memory pool the full brief uses, so
  // a shape used in the last few books cannot come round again â€” compact mode
  // was drawing from the raw list and repeating (Lynden 2026-08-25: "why is
  // every story the exact same?").
  const enginePool = pool.length >= CANDIDATES ? pool : STORY_SHAPES;
  const engineOffset = Math.floor(Math.random() * enginePool.length);
  const engineFor = (i) => enginePool[(engineOffset + i) % enginePool.length];
  const writeFn = COMPACT
    ? (i = 0) => writeStoryCompact({ level, child, focusSound: book.focus_sound, pagesCount, borrow: borrowableTricky(book.level), engine: engineFor(i) })
    : () => writeStory(writerOpts);
  const asStory = (d) => COMPACT
    ? { title: d.title, pages: (d.pages || []).map((t) => ({ text: String(t) })), read_words: d.story_words || [] }
    : d;
  let story;
  if (CANDIDATES === 1) {
    const one = await writeFn();
    charge(job, "story_usd", COMPACT ? "writeStoryCompact" : "writeStory", one.cost, one.model);
    story = asStory(one.data);
    if (COMPACT) job.breakdown.chosen_engine = engineFor(0).name;
  } else {
    const drafts = await Promise.all(Array.from({ length: CANDIDATES }, (_, i) => writeFn(i)));
    drafts.forEach((d, i) => charge(job, "story_usd", `${COMPACT ? "writeStoryCompact" : "writeStory"}:candidate${i + 1}`, d.cost, d.model));
    drafts.forEach((d) => { d.data = asStory(d.data); });
    // REDRAW, DON'T REPAIR (Lynden 2026-08-26: "on the website you will not be
    // able to intervene"). Three fresh compact drafts cost about $0.20; ONE
    // revision cycle costs about $0.60 once the re-stage and re-direct behind
    // it are counted, and a weak draft usually stays weak. So a batch whose
    // best draft is still poor is thrown away and redrawn, up to
    // FORGE_STORY_BATCHES times, before the paid gate is ever entered.
    const judgeBatch = async (drafts, batch) => Promise.all(drafts.map(async (d, i) => {
      const dec = storyDecodeProblems(d.data, book.level, child.name).problems.length;
      const texts = (d.data.pages || []).map((p) => p.text);
      let fails = 99, score = 0, contra = 99, contraDetail = [];
      try {
        const fl = await judgeFluency({ pages: texts });
        charge(job, "story_usd", `judgeFluency:b${batch}c${i + 1}`, fl.cost, fl.model);
        fails = (fl.data.failures || []).length;
        score = fl.data.read_aloud_score || 0;
      } catch (e) {
        console.warn(`[forge] fluency judge failed for candidate ${i + 1}:`, e.message);
      }
      // Physical-state audit BEFORE the pick (Lynden 2026-08-25): a draft
      // whose mechanism is never stated loses to one whose chain is complete.
      try {
        const st = await checkStoryState({ pages: texts });
        charge(job, "story_usd", `checkStoryState:b${batch}c${i + 1}`, st.cost, st.model);
        contraDetail = (st.data.contradictions || []).map((c) => `p${c.page}: ${c.detail}`);
        contra = contraDetail.length;
      } catch (e) {
        console.warn(`[forge] state check failed for candidate ${i + 1}:`, e.message);
      }
      // Countable house faults are free to check and must count at the pick,
      // not only later at the gate.
      const style = COMPACT ? styleIssues(d.data, book).length : 0;
      return { i, d, dec, fails, score, contra, contraDetail, style, title: d.data.title, engine: COMPACT ? engineFor(i).name : null };
    }));
    // WEIGHTED, not lexicographic (2026-08-25): a pedantic state "contradiction"
    // outranked a 0-failure 9/10 draft and picked a 4-failure one. Contradictions
    // weigh more than fluency failures but can no longer veto alone.
    const penalty = (c) => c.contra * 1.5 + c.fails + c.style * 1.5;
    const BATCHES = Math.min(3, Math.max(1, Number(process.env.FORGE_STORY_BATCHES || 1)));
    const GOOD_ENOUGH = Number(process.env.FORGE_DRAFT_PENALTY || 3);
    let judged = await judgeBatch(drafts, 1);
    judged.sort((a, b) => (penalty(a) - penalty(b)) || (a.dec - b.dec) || (b.score - a.score));
    for (let batch = 2; batch <= BATCHES && penalty(judged[0]) > GOOD_ENOUGH; batch++) {
      console.warn(`[forge] best of batch ${batch - 1} still scores ${penalty(judged[0]).toFixed(1)} (want <= ${GOOD_ENOUGH}) â€” redrawing rather than repairing`);
      const more = await Promise.all(Array.from({ length: CANDIDATES }, (_, i) => writeFn(i + (batch - 1) * CANDIDATES)));
      more.forEach((d, i) => charge(job, "story_usd", `${COMPACT ? "writeStoryCompact" : "writeStory"}:b${batch}c${i + 1}`, d.cost, d.model));
      more.forEach((d) => { d.data = asStory(d.data); });
      judged = [...judged, ...(await judgeBatch(more, batch))];
      judged.sort((a, b) => (penalty(a) - penalty(b)) || (a.dec - b.dec) || (b.score - a.score));
    }
    const win = judged[0];
    console.log(`[forge] picked "${win.title}" â€” penalty ${penalty(win).toFixed(1)} (fluency ${win.fails}, state ${win.contra}, style ${win.style}) from ${judged.length} draft(s)`);
    // Keep every candidate's TEXT, not just its scores (Lynden 2026-08-25:
    // "so i can review orginal text and changed text"). Without this the
    // rejected drafts vanish and the winner's original wording is overwritten
    // by the first revision, leaving no before/after to review.
    job.breakdown.candidates = judged.map((c) => ({ candidate: c.i + 1, title: c.title, engine: c.engine, state_contradictions: c.contra, contradiction_detail: c.contraDetail, style_faults: c.style, fluency_failures: c.fails, decode_problems: c.dec, read_aloud_score: c.score, chosen: c === win, pages: (c.d.data.pages || []).map((p) => p.text) }));
    if (win.engine) job.breakdown.chosen_engine = win.engine;
    if (win.contra > 0) console.warn(`[forge] best candidate still carries ${win.contra} state contradiction(s): ${win.contraDetail.join(" | ").slice(0, 200)}`);
    console.log(`[forge] candidates: chose #${win.i + 1} "${win.title}" (${win.fails} fluency failures, ${win.dec} decode problems, score ${win.score}) of ${CANDIDATES}`);
    story = win.d.data;
  }

  if (COMPACT) {
    await applyStaging(job, story, book, child, level);
  }
  // The as-written draft, frozen before any polish, fix or revision touches
  // it â€” the "original text" half of every before/after review.
  job.breakdown.draft_pages = { title: story.title, pages: story.pages.map((p) => p.text) };

  // THE WRITER READS ITS OWN WORK BEFORE ANY JUDGE DOES. Cheap craft pass,
  // then verified for free: if the prettier wording smuggled in a word this
  // level cannot decode, we keep the original line. A polish that breaks the
  // phonics contract is not a polish (Lynden 2026-08-21).
  if (process.env.FORGE_PAID_POLISH === "1") try {
    const polish = await polishStoryAloud({ story, level, childName: child.name, focusSound: book.focus_sound });
    charge(job, "story_usd", "polishStoryAloud", polish.cost, polish.model);
    const pages = polish.data?.pages || [];
    if (pages.length === story.pages.length) {
      let kept = 0;
      story.pages = story.pages.map((p, i) => {
        // strip a "Page 3:" style label if the pass adds one back
        const raw = String(pages[i] || "").trim().replace(/^page\s*\d+\s*[:.\-]\s*/i, "");
        const next = fixMechanics(raw, child.name);
        if (!next || next === p.text) return p;
        const words = (next.toLowerCase().match(/[a-z']+/g) || []);
        const bad = decodeProblems([...new Set(words)], book.level, { heroName: child.name, borrow: borrowableTricky(book.level) });
        if (bad.length) return p; // prettier but not decodable - keep the original
        kept++;
        return { ...p, text: next };
      });
      const t = String(polish.data?.title || "").trim();
      if (t && !decodeProblems(t.toLowerCase().match(/[a-z']+/g) || [], book.level, { heroName: child.name }).length) story.title = t;
      job.breakdown.read_aloud_pass = { changed: polish.data?.changed, lines_improved: kept };
      console.log(`[forge] read-aloud pass improved ${kept} line(s): ${String(polish.data?.changed).slice(0, 120)}`);
    }
  } catch (e) {
    console.warn("[forge] read-aloud pass unavailable:", e.message);
  }

  job.story = story;
  // The WINNER's engine is what this book actually used â€” recording the
  // full-brief `shape` here in compact mode fed the cross-book shape memory a
  // lie, so it never blocked the engine that really repeated (2026-08-25).
  job.breakdown.story_shape = job.breakdown.chosen_engine || shape.name;
  job.breakdown.source_story = source?.title || null;
  job.breakdown.shape_fulfilment = story.shape_fulfilment;
}

// Stage (or RE-stage) a compact story's locked pages into everything the book
// machine needs. Re-staging matters: a revision changed "ball" to "can" in
// the text while every scene brief still said "ball", and the cold editor
// rightly stopped the book (Huw, 2026-08-25). stagedPagesHash tracks what the
// staged data was derived from; stepQa re-stages whenever the text moved.
async function applyStaging(job, story, book, child, level) {
  const staged = await stageStoryForBook({ story, level, child, focusSound: book.focus_sound });
  charge(job, "story_usd", "stageStoryForBook", staged.cost, staged.model);
  const s = staged.data;
  story.pages = story.pages.map((p, i) => ({ ...p, scene: s.pages?.[i]?.scene || "", location: s.pages?.[i]?.location || `page-${i + 1}` }));
  Object.assign(story, {
    premise: s.premise, story_plan: s.story_plan, setting: s.setting,
    key_objects: s.key_objects || [], cast: s.cast || [], cover_brief: s.cover_brief,
    state_chain: s.state_chain || [], focus_word_examples: s.focus_word_examples || [],
    tricky_words_used: s.tricky_words_used || [], questions: s.questions || [],
    alien_words: s.alien_words || [], shape_fulfilment: s.shape_fulfilment || "",
  });
  job.stagedPagesHash = story.pages.map((p) => p.text).join("|");
  // A chain row whose causing sentence is MISSING is a physical-state gap
  // the pages skipped â€” surface it for the editor rather than burying it.
  const gaps = (s.state_chain || []).filter((r) => /^MISSING/i.test(String(r.causing_sentence || "")));
  job.breakdown.state_chain_gaps = gaps.length ? gaps.map((g) => `p${g.page}: ${g.causing_sentence}`) : [];
  if (gaps.length) console.warn(`[forge] stager found ${gaps.length} state-chain gap(s): ${job.breakdown.state_chain_gaps.join(" | ")}`);
}

// Whole-story decodability with the borrowed-tricky allowance (Lynden
// 2026-08-24: "if you need one or two tricky words from just above, just do
// that"). Up to TWO of the next level's tricky words may appear in PAGE TEXT;
// the title and read_words stay strict, because the Python typeset gate only
// exempts the level's own tricky words there and a borrowed word in either
// kills the PDF after the money is spent.
// At most this many DISTINCT above-level words may stand in the page text as
// Future Sounds (Lynden 2026-08-25). The band previews them; the title and the
// practice words stay strict, and a dishonest spelling is never previewable.
const FUTURE_SOUND_ALLOWANCE = Number(process.env.FORGE_FUTURE_SOUNDS || 2);

function storyDecodeProblems(story, level, heroName) {
  const tok = (s) => String(s || "").toLowerCase().match(/[a-z']+/g) || [];
  const strictWords = [...new Set([...tok(story.title), ...(story.read_words || []).flatMap(tok)])];
  const borrow = borrowableTricky(level);
  const pageWords = [...new Set((story.pages || []).flatMap((p) => tok(p.text)))];
  const pageProblems = decodeProblems(pageWords, level, { heroName, borrow });
  const future = pageProblems.filter(isFutureSoundProblem);
  const allowedFuture = future.slice(0, FUTURE_SOUND_ALLOWANCE);
  const problems = [
    ...decodeProblems(strictWords, level, { heroName }),
    ...pageProblems.filter((p) => !allowedFuture.includes(p)),
  ];
  story.future_sound_words = allowedFuture
    .map((p) => (String(p).match(/^"([^"]+)"/) || [])[1])
    .filter(Boolean);
  const borrowed = pageWords.filter((w) => borrow.includes(w));
  if (borrowed.length > 2) {
    problems.push(`story borrows ${borrowed.length} tricky words from the next level (${borrowed.join(", ")}) â€” at most 2 allowed`);
  }
  return { problems: [...new Set(problems)], borrowed };
}

async function stepQa(book, job) {
  const level = getLevel(book.level);
  const child = childOf(book);
  const pagesCount = storyPagesFor(book);
  let story = job.story;

  // Compact mode: a revision or exact patch re-enters here with changed page
  // text â€” the staged scenes/premise/state chain were derived from the OLD
  // text and must be rebuilt or the pictures illustrate a different story.
  if (process.env.FORGE_WRITER_PROMPT === "compact" && job.stagedPagesHash) {
    const h = (story.pages || []).map((p) => p.text).join("|");
    if (h !== job.stagedPagesHash) {
      console.log("[forge] page text changed since staging â€” re-staging");
      await applyStaging(job, story, book, child, level);
    }
  }

  // A couple of slightly-above-level words are FINE â€” book_v2 previews them
  // as Future Sounds. Only rewrite when violations pile up (>3 distinct).
  // DETERMINISTIC FIRST (Lynden 2026-08-21). Whether a word is buildable from
  // the taught graphemes is arithmetic, not judgement, and paying a reasoning
  // model to answer it is waste. The LLM gate now runs ONLY when the cheap
  // check finds something, or as a spot-check it cannot do (sound choice).
  // read_words is a LIST, not prose â€” a bad entry is deleted by code, never
  // sent to a model. fixStoryWords is only ever shown pages + title, so a
  // dishonest practice word could NEVER be cleared by the surgical fix and
  // always escalated to a full rewrite (found 2026-08-22: "market" did this).
  // The normaliser below tops the list back up to six from clean words.
  // Tricky words are NOT decoding practice: decodeProblems SKIPS them (they
  // are legal in prose), so "the" passed the filter and printed as a Story
  // Word (Erin, 2026-08-24). Practice words must be buildable, not memorised.
  const trickySet = new Set(level.trickyWords.map((w) => String(w).toLowerCase()));
  {
    const clean = (story.read_words || []).filter(
      (w) => String(w).toLowerCase() !== String(child.name).toLowerCase() &&
        !trickySet.has(String(w).toLowerCase()) &&
        !decodeProblems([w], book.level, { heroName: child.name, allowPeople: false }).length,
    );
    if (clean.length !== (story.read_words || []).length) {
      console.log(`[forge] read_words sanitised: dropped ${JSON.stringify((story.read_words || []).filter((w) => !clean.includes(w)))}`);
      story.read_words = clean;
    }
  }
  const cheapFindings = storyDecodeProblems(story, book.level, child.name).problems;
  let validation = { ok: true, violations: [], focus_sound_count: 0 };
  if (cheapFindings.length) {
    const review = await reviewStory({ level, story, focusSound: book.focus_sound, childName: child.name });
    charge(job, "story_usd", "reviewStory", review.cost, review.model);
    validation = review.data;
  } else {
    console.log("[forge] phonics: deterministic check clean - skipping the paid gate");
  }
  validation.violations = [
    ...(validation.violations || []),
    ...cheapFindings.map((reason) => ({ word: "", page: 0, reason })),
  ];
  if (cheapFindings.length) validation.ok = false;

  // Deterministic check the model gate above cannot do: it verifies "oo" is
  // a taught GRAPHEME, not that a specific word uses a sound this level has
  // actually unlocked (short /oo/ in "book"/"look" slipped through as if
  // interchangeable with long /oo/ in "moon" â€” see focusSoundViolations).
  // Folded into the SAME violations list so it drives the existing rewrite
  // path rather than a second, easy-to-ignore channel.
  const focusViolations = focusSoundViolations({ story, focusSound: book.focus_sound, level: book.level });
  if (focusViolations.length) {
    validation = { ...validation, ok: false, violations: [...(validation.violations || []), ...focusViolations] };
  }
  // A book that landed on just 1-2 focus-sound words (Lynden 2026-08-11:
  // "there is only one story word... should be at least 3") â€” deterministic,
  // counts story.focus_word_examples directly.
  const countViolation = focusSoundCountViolation({ story, focusSound: book.focus_sound });
  if (countViolation) {
    validation = { ...validation, ok: false, violations: [...(validation.violations || []), countViolation] };
  }

  const distinct = new Set((validation.violations || []).map((v) => v.word.toLowerCase())).size;
  // A generic above-level word is fine in small numbers (Future Sounds
  // preview handles it) â€” but a focus-word EXAMPLE using an untaught sound of
  // the very grapheme this book is teaching, or too few focus-sound words
  // overall, is never fine, so either forces a rewrite regardless of the
  // >3 threshold.
  // The >3 threshold is for ABOVE-LEVEL words, which the Future Sounds band
  // legitimately previews. It must never apply to what the DETERMINISTIC check
  // found: an untaught grapheme or a dishonest spelling fails the PDF build
  // outright, so letting one through here just moves the death to render time
  // ("market" reached the renderer and killed the book, 2026-08-22).
  const mustFix = cheapFindings.length > 0;
  // SURGICAL FIRST (Lynden 2026-08-22). A deterministic finding is usually one
  // bad word; swapping that word costs a fraction of regenerating the book and
  // cannot disturb pages that were fine. Only a genuine pile-up, or a fix that
  // fails to clear the problem, falls through to the full rewrite below.
  if (mustFix && distinct <= 3 && !focusViolations.length && !countViolation) {
    try {
      const edit = await fixStoryWords({ story, level, childName: child.name, problems: cheapFindings });
      charge(job, "story_usd", "fixStoryWords", edit.cost, edit.model);
      const patched = { ...story, pages: story.pages.map((p) => ({ ...p })) };
      for (const f of edit.data?.fixes || []) {
        const i = Number(f.page) - 1;
        if (i >= 0 && i < patched.pages.length && f.text) patched.pages[i].text = fixMechanics(String(f.text).trim(), child.name);
      }
      if (edit.data?.title) patched.title = String(edit.data.title).trim();
      const after = storyDecodeProblems(patched, book.level, child.name).problems;
      if (!after.length) {
        story = patched;
        job.breakdown.word_fix = { note: edit.data?.note, pages: (edit.data?.fixes || []).map((f) => f.page) };
        console.log(`[forge] word fix instead of rewrite: ${edit.data?.note}`);
        validation = { ok: true, violations: [], focus_sound_count: validation.focus_sound_count };
      } else {
        console.warn("[forge] word fix did not clear it, falling back to a rewrite:", after.join("; "));
      }
    } catch (e) {
      console.warn("[forge] word fix unavailable, falling back to a rewrite:", e.message);
    }
  }

  if (!validation.ok && (mustFix || distinct > 3 || focusViolations.length > 0 || countViolation)) {
    const fixed = await rewriteStory({
      level, child, focusSound: book.focus_sound, pagesCount, story, violations: validation.violations,
    });
    charge(job, "story_usd", "rewriteStory", fixed.cost, fixed.model);
    story = fixed.data;
    const recheck = await reviewStory({ level, story, focusSound: book.focus_sound, childName: child.name });
    charge(job, "story_usd", "reviewStory:recheck", recheck.cost, recheck.model);
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
  // enforced it â€” so normalise here: focus-sound words first, then other
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
    // This normaliser runs AFTER the decode gate, so anything it injects from
    // the text or the bank skips every check upstream â€” it re-introduced
    // "market" into read_words after QA had passed (2026-08-22). Every word
    // that can enter the six must clear the same free deterministic check.
    // heroName exempts the child's name from decode checks, but the renderer
    // separately rejects the name as a practice word ("a person, not a word to
    // practise") â€” so it must be barred here by its own test.
    const decodable = (w) =>
      String(w).toLowerCase() !== String(child.name).toLowerCase() &&
      !trickySet.has(String(w).toLowerCase()) &&
      !decodeProblems([w], book.level, { heroName: child.name, allowPeople: false }).length;
    const uniq = [...new Set((story.read_words || []).map((w) => String(w).toLowerCase()).filter(Boolean))].filter(decodable);
    const bank = new Set(greenWordsUpTo(book.level).map((w) => String(w).toLowerCase()));
    const textTokens = [...new Set(story.pages.flatMap((p) => (p.text.toLowerCase().match(/[a-z']+/g) || [])))];
    const hasFocus = (w) => focus && w.includes(focus);
    const focusPool = [...new Set([
      ...uniq.filter(hasFocus),
      ...(story.focus_word_examples || []).map((w) => String(w).toLowerCase()).filter(decodable),
      ...textTokens.filter((t) => hasFocus(t) && bank.has(t) && decodable(t)),
    ])];
    const otherPool = [...new Set([
      ...uniq.filter((w) => !hasFocus(w)),
      ...textTokens.filter((t) => !hasFocus(t) && t.length > 2 && bank.has(t) && decodable(t)),
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
  // Marking the same words twice buys nothing: the answer depends only on the
  // words and the level. A book that went round the gate three times paid for
  // SIX identical markings (Lynden 2026-08-25: "$2.71 on text is ridiculous").
  const shiftyKey = `${book.level}|${[...buttonWords].sort().join(",")}`;
  if (job.shiftyKey === shiftyKey && job.shiftyMarks) {
    console.log("[forge] shifty marks unchanged â€” reusing (no call)");
  } else if (buttonWords.length) {
    job.shiftyMarks = {};
    try {
      const sh = await markShiftySounds({ words: buttonWords, level: book.level });
      charge(job, "story_usd", "markShiftySounds", sh.cost, sh.model);
      job.shiftyKey = shiftyKey;
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

  // A borrowed next-level tricky word is TAUGHT, not smuggled: it joins
  // tricky_words_used so the tricky strip introduces it like any other.
  {
    const { borrowed } = storyDecodeProblems(story, book.level, child.name);
    const tokens = new Set(story.pages.flatMap((p) => String(p.text || "").toLowerCase().match(/[a-z']+/g) || []));
    const actualTricky = level.trickyWords.map((w) => String(w).toLowerCase()).filter((w) => tokens.has(w));
    // Exact reconciliation, never an additive merge: revisions may remove a
    // tricky word and the printed strip must describe the final manuscript.
    story.tricky_words_used = [...new Set([...actualTricky, ...borrowed])];
    // Always overwrite: a revision that removed a borrowed word must not
    // leave the old list behind (a run reported ["her","you"] from a draft
    // whose final text contained neither, 2026-08-24).
    job.breakdown.borrowed_tricky = borrowed;
  }

  job.story = story;
  job.validation = validation;
  job.qaDone = true;
}

// Runs BEFORE any image exists â€” the last chance to catch a story whose
// premise is physically or logically self-contradictory. "The Thick Pen"
// shipped "The bag had a gap. The cap fell into sand." then "The thick pen
// fit the gap": a rigid cap cannot fall through a hole a thin pen later
// plugs. No other gate could have caught it â€” decodability only checks
// words are legal, and the image-consistency QA only checks a picture
// matches its OWN page's text, not whether the text's claim is possible at
// all (Lynden 2026-08-10). One bounded rewrite, same doctrine as stepQa â€”
// never loop forever, and log rather than block the book if it still fails.
async function stepPlausibility(book, job) {
  const level = getLevel(book.level);
  const child = childOf(book);
  const pagesCount = storyPagesFor(book);
  let story = job.story;

  const review = await reviewStoryPlausibility({ story });
  charge(job, "story_usd", "reviewStoryPlausibility", review.cost, review.model);
  let result = review.data;
  if (!result.pass && result.issues?.length) {
    const fixed = await fixStoryPlausibility({
      level, child, focusSound: book.focus_sound, pagesCount, story, issues: result.issues,
    });
    charge(job, "story_usd", "fixStoryPlausibility", fixed.cost, fixed.model);
    story = fixed.data;
    story.pages = story.pages.map((p) => ({ ...p, text: fixMechanics(p.text, child.name) }));
    const recheck = await reviewStoryPlausibility({ story });
    charge(job, "story_usd", "reviewStoryPlausibility:recheck", recheck.cost, recheck.model);
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
  const wasCast = JSON.stringify((job.story?.cast || []).map((c) => c.id).sort());
  const wasObjects = JSON.stringify((job.story?.key_objects || []).map((o) => o.name).sort());
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
  // CAST AND PROP REFERENCES BELONG TO THE OLD STORY (Lynden 2026-08-25).
  // These caches are keyed by name and were NOT cleared here, so a revised
  // story kept painting the previous one's people and props: a book whose
  // text became "Cat Prints" still carried a moth-story cast (Dad) and props
  // (moth, web) and the illustrator faithfully drew a cobweb, a moth and a
  // father who appear nowhere in the words.
  const nowCast = JSON.stringify((revisedStory?.cast || []).map((c) => c.id).sort());
  const nowObjects = JSON.stringify((revisedStory?.key_objects || []).map((o) => o.name).sort());
  if (nowCast !== wasCast) job.castSheets = {};
  if (nowObjects !== wasObjects) job.objectSheets = {};
}

// DETERMINISTIC STYLE FAULTS THAT BLOCK (Lynden 2026-08-25, on a story the
// editor passed with zero issues while saying "with Mum" on five of six pages
// and the hero's name seven times). These are countable, so they are not left
// to a judge's mood: they are injected into the editor's issue list as majors,
// which makes the existing revision path fix them and the follow-up verify it.
export function styleIssues(story, book) {
  const pages = (story.pages || []).map((p) => String(p.text || ""));
  const out = [];
  const shyPage = pages.findIndex((t) => /\b(?:shy|small|timid)\s+(?:sheep|animal|dog|cat|goat|pony)\b/i.test(t));
  if (shyPage > 0) {
    const ambiguous = pages.slice(0, shyPage).findIndex((t) => /\bthe\s+(?:sheep|animals|dogs|cats|goats|ponies)\b/i.test(t));
    if (ambiguous >= 0) out.push({
      severity: "major", area: "story", page: ambiguous + 1, replacement: "",
      detail: `Page ${ambiguous + 1} uses an undifferentiated animal group immediately before page ${shyPage + 1} says one shy animal "stays back". State exactly which animals act so the director cannot place the shy animal in two incompatible states.`,
    });
  }
  // GRADED SEVERITY (Lynden 2026-08-27, "we need some leniency â€¦ we can't
  // waste money on little things that aren't too noticeable"): a small
  // overshoot of a style rule is a MINOR â€” it ships with a flag for the
  // audit trail and costs nothing. Only an egregious breach, or a fault a
  // buyer/child would actually notice, blocks and buys edit passes. The
  // proof this was needed: Ben's test book (2026-08-27) spent two edit
  // passes + the exact patch and then STOPPED over a name used 4 times
  // instead of 3.
  const parentRe = /\b(Mum|Dad|Mam|Nan|Nana|Gran|Grandad|Grandma|Mummy|Daddy)\b/;
  const parentPages = pages.map((t, i) => (parentRe.test(t) ? i + 1 : 0)).filter(Boolean);
  if (parentPages.length > 2) {
    out.push({
      severity: parentPages.length > 3 ? "major" : "minor", area: "language", page: parentPages[2], replacement: "",
      detail: `A parent is named in the text on ${parentPages.length} of ${pages.length} pages (${parentPages.join(", ")}). Presence belongs in the pictures: name the parent only on the pages where they DO something, at most two. Rewrite the other pages so the hero acts â€” do not simply delete "with Mum" and leave a stub.`,
    });
  }
  const name = String(book.child_name || "");
  if (name) {
    const titleHasName = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(String(story.title || ""));
    if (!titleHasName) {
      out.push({ severity: "major", area: "language", page: 0, replacement: "",
        detail: `The title must contain the hero's exact name "${name}". Rewrite the title before any illustration is generated and keep it decodable at Level ${book.level}.` });
    }
    const uses = pages.join(" ").split(new RegExp(`\\b${name}\\b`)).length - 1;
    if (uses > 3) {
      // 4-5 uses reads fine to a child â€” minor, ships flagged. 6+ is the
      // name-on-every-page monotony the 08-25 ruling was about â€” blocks.
      // (Also: don't claim the name is undecodable â€” "Ben" decodes at L2;
      // the real objection is repetitive prose.)
      out.push({
        severity: uses > 5 ? "major" : "minor", area: "language", page: 0, replacement: "",
        detail: `The hero's name "${name}" appears ${uses} times; prefer two or three â€” first sentence, the turning point, near the end â€” with he/she elsewhere so the prose does not drum the name.`,
      });
    }
  }
  // "big, big, big" is the Level 1 ditty device; above that it is padding.
  // One padded page is a minor (ships flagged); padding on several pages is
  // the book leaning on the crutch â€” that blocks.
  if (Number(book.level) > 1) {
    const padded = [];
    pages.forEach((t, i) => {
      const m = t.match(/\b(\w+), *\1\b/i);
      if (m) padded.push({ page: i + 1, sample: m[0] });
    });
    for (const p of padded) {
      out.push({ severity: padded.length > 1 ? "major" : "minor", area: "language", page: p.page, replacement: "", detail: `Page ${p.page} pads with repetition ("${p.sample}"). Repeating a word for rhythm is the Level 1 ditty form; at Level ${book.level} say something new instead.` });
    }
  }
  return out;
}

// The text-only editor gate. Severity decides (deriveEditorVerdict): only a
// critical/major issue blocks; minors are internal notes and the book
// proceeds. One bounded same-premise revision; a second rejection is a
// content rejection (credit restored), never a delivery of the weak book.
async function stepStoryGate(book, job) {
  const level = getLevel(book.level);
  // CONVERGENT RE-REVIEW (Lynden 2026-08-23, "i recommend the first one"): a
  // revised manuscript is judged ONLY on whether the previous notes were
  // fixed, plus regressions the revision itself introduced â€” never a fresh
  // cold read, which raised brand-new majors every pass and never converged.
  let review;
  if (job.pendingEditorNotes?.length) {
    const fu = await storyEditorFollowUp({ story: job.story, level, focusSound: book.focus_sound, notes: job.pendingEditorNotes });
    charge(job, "story_usd", "storyEditorFollowUp", fu.cost, fu.model);
    const verdicts = fu.data.note_verdicts || [];
    const unfixed = job.pendingEditorNotes
      .map((n, i) => ({ n, v: verdicts.find((x) => Number(x.note) === i + 1) }))
      .filter(({ v }) => !v?.fixed)
      .map(({ n, v }) => ({ ...n, detail: `${n.detail} â€” STILL UNFIXED: ${v?.reason || "the follow-up returned no verdict for this note"}` }));
    review = {
      issues: [...unfixed, ...(fu.data.regressions || [])],
      story_quality: fu.data.summary || "",
      language_quality: "",
    };
    job.breakdown[`story_gate_followup_${job.storyEditRequests || 0}`] = fu.data;
    console.log(`[forge] follow-up review: ${verdicts.filter((v) => v.fixed).length}/${job.pendingEditorNotes.length} notes fixed, ${(fu.data.regressions || []).length} regression(s)`);
  } else {
    // Findings the pick could not fix ride into the editor's read (Lynden
    // 2026-08-25: winners still carried one flagged gap the editor never saw).
    const chosen = (job.breakdown.candidates || []).find((c) => c.chosen);
    const machineFindings = [
      ...((chosen?.contradiction_detail) || []).map((d) => `state audit: ${d}`),
      ...((job.breakdown.state_chain_gaps) || []).map((d) => `state chain: ${d}`),
      ...((job.breakdown.prose_issues) || []).map((i) => `prose check p${i.page}: ${i.detail}`),
    ];
    const first = await storyEditorReview({ story: job.story, level, focusSound: book.focus_sound, machineFindings });
    charge(job, "story_usd", "storyEditorReview", first.cost, first.model);
    review = first.data;
  }
  // Countable faults do not depend on the judge noticing them.
  {
    const style = styleIssues(job.story, book);
    if (style.length) {
      review = { ...review, issues: [...(review.issues || []), ...style] };
      console.warn(`[forge] deterministic style faults added to the gate: ${style.map((s) => s.detail.slice(0, 60)).join(" | ")}`);
    }
  }
  const verdict = deriveEditorVerdict(review);

  if (verdict.pass) {
    job.pendingEditorNotes = null;
    // A pass wipes any edit-request list from an earlier ceiling pass â€” the
    // imagery boundary keys off it, and a stale list would trigger the
    // fresh-story path on a book whose exact patch just cleared everything.
    job.breakdown.story_gate_edit_requests = [];
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
  // THE PASS CEILING LIMITS SPENDING, NOT THE STANDARD (Lynden 2026-08-24,
  // superseding the 08-17 "proceed with edit requests" rule after two runs in
  // a row shipped with an open major). At the ceiling:
  //   1. EXACT PATCH, free: the editor now supplies the corrected page text
  //      per issue (`replacement`), so code transcribes it verbatim â€” no
  //      model call, no chance of a rewrite fixing one thing and breaking
  //      another. Each patched line is decode-checked before it lands.
  //   2. Still blocking after the patch (or nothing patchable) â†’ the book
  //      STOPS for manual review. It never proceeds, is never illustrated,
  //      with an open MAJOR.
  if (job.storyEditRequests >= STORY_EDIT_REQUESTS) {
    job.breakdown.story_gate_second = review;
    job.breakdown.story_gate_edit_requests = verdict.blocking;
    job.breakdown.story_gate = review;
    const child = childOf(book);
    const patchable = verdict.blocking.filter((i) => Number(i.page) >= 1 && String(i.replacement || "").trim());
    if (!job.exactPatchUsed && patchable.length) {
      job.exactPatchUsed = true;
      const revised = { ...job.story, pages: job.story.pages.map((p) => ({ ...p })) };
      let applied = 0;
      for (const iss of patchable) {
        const i = Number(iss.page) - 1;
        if (i < 0 || i >= revised.pages.length) continue;
        const next = fixMechanics(String(iss.replacement).trim(), child.name);
        const bad = decodeProblems(
          [...new Set(next.toLowerCase().match(/[a-z']+/g) || [])],
          book.level, { heroName: child.name, borrow: borrowableTricky(book.level) },
        );
        if (bad.length) { console.warn(`[forge] exact patch for page ${i + 1} rejected (not decodable): ${bad.join("; ")}`); continue; }
        revised.pages[i].text = next;
        applied++;
      }
      if (applied) {
        console.log(`[forge] exact patch: transcribed the editor's own text onto ${applied}/${patchable.length} page(s), re-judging`);
        job.breakdown.exact_patch = { applied, of: patchable.length };
        job.pendingEditorNotes = verdict.blocking;
        resetAfterStoryRevision(job, revised);
        return; // re-enters at qa, then the gate's follow-up judges the patch
      }
    }
    throw new NeedsReviewError(`story gate: open ${verdict.blocking.length} blocking issue(s) after ${STORY_EDIT_REQUESTS} edit pass(es) and the exact-patch attempt â€” ${detail.slice(0, 220)}`);
  }

  // TRANSCRIBE BEFORE YOU BUY A REWRITE (Lynden 2026-08-25: "$2.71 on text is
  // ridiculous"). The editor already writes the corrected line; a broad
  // rewrite costs ~$0.29 AND forces a re-stage and a re-direct behind it,
  // which is where a book's text bill really goes. So when every blocking
  // issue names a page and carries a replacement, apply them verbatim for
  // nothing and let the follow-up judge the result. Only faults that no line
  // can fix â€” a rejected premise, a missing beat â€” still buy the rewrite.
  if (!job.firstPatchUsed) {
    const patchable = verdict.blocking.filter((i) => {
      const pg = Number((Array.isArray(i.pages) ? i.pages[0] : i.page) || 0);
      return pg >= 1 && pg <= (job.story.pages || []).length && String(i.replacement || "").trim();
    });
    if (patchable.length && patchable.length === verdict.blocking.length) {
      job.firstPatchUsed = true;
      const child = childOf(book);
      const patched = { ...job.story, pages: job.story.pages.map((p) => ({ ...p })) };
      const applied = [];
      for (const iss of patchable) {
        const idx = Number((Array.isArray(iss.pages) ? iss.pages[0] : iss.page)) - 1;
        const next = fixMechanics(String(iss.replacement).trim(), child.name);
        const bad = decodeProblems([...new Set(next.toLowerCase().match(/[a-z']+/g) || [])], book.level,
          { heroName: child.name, borrow: borrowableTricky(book.level) });
        if (bad.length) { console.warn(`[forge] first-pass patch for page ${idx + 1} rejected (not decodable): ${bad.join("; ")}`); continue; }
        patched.pages[idx].text = next;
        applied.push(idx + 1);
      }
      // Only skip the paid rewrite if the patch actually cleared everything
      // BLOCKING — a leftover minor ships flagged and must not buy a rewrite
      // (graded leniency, Lynden 2026-08-27).
      if (applied.length === patchable.length && !styleIssues(patched, book).some((i) => i.severity !== "minor")) {
        job.breakdown.first_pass_patch = { pages: applied };
        job.pendingEditorNotes = verdict.blocking;
        console.log(`[forge] first-pass patch: transcribed the editor's own lines onto page(s) ${applied.join(", ")} â€” no rewrite bought`);
        resetAfterStoryRevision(job, patched);
        return; // re-enters at qa, then the follow-up judges the patch
      }
      console.warn("[forge] first-pass patch did not clear everything â€” falling through to the revision");
    }
  }

  // ONE bounded revision. The premise is LOCKED unless the editor explicitly
  // rejected the premise itself (a blocking issue with area "premise") â€”
  // the 2026-08-14 revision abandoned the simit-cart premise and invented an
  // unrelated star-tin book, which is exactly what the lock forbids.
  job.storyRetryUsed = true;
  job.storyEditRequests = (job.storyEditRequests || 0) + 1;
  job.breakdown[job.storyEditRequests === 1 ? "story_gate_first" : `story_gate_pass_${job.storyEditRequests}`] = review;
  // The premise unlocks once the editor calls it unusable â€” and also on the
  // LAST edit pass, because a premise that has already survived one failed
  // rewrite is the thing that keeps failing (Omar, 08-16: two drafts rejected
  // for the same engineless premise because the lock never lifted).
  const premiseRejected = verdict.blocking.some((i) => String(i.area || "").toLowerCase() === "premise")
    || job.storyEditRequests >= STORY_EDIT_REQUESTS;
  const child = childOf(book);
  const pagesCount = storyPagesFor(book);
  const revised = await reviseStoryAfterEditor({
    level, child, focusSound: book.focus_sound, pagesCount,
    story: job.story, review, premiseRejected,
    greenWords: greenWordsUpTo(book.level),
    progression: progressionUpTo(book.level),
    exemplars: coreStoriesFor(book.level),
  });
  charge(job, "story_usd", "reviseStoryAfterEditor", revised.cost, revised.model);

  // VERIFY THE NOTES WERE WORKED, NOT NARRATED. The reviser must claim, per
  // numbered note, which pages it changed; code checks the claim against the
  // old story. A note whose claimed pages are all byte-identical was skipped
  // no matter what the prose says â€” those notes (only) get ONE more targeted
  // pass, so a $0.32 revision can no longer half-do its job silently.
  {
    const pageKey = (s, i) => JSON.stringify({ t: s?.pages?.[i]?.text || "", s: s?.pages?.[i]?.scene || "" });
    const structurallyChanged = (revised.data.pages || []).length !== (job.story.pages || []).length;
    // Index against the SAME list the reviser numbered (it filters by severity
    // itself; verdict.blocking additionally promotes story-state minors, so
    // the two can disagree and the note numbers would point at the wrong issues).
    const bySeverity = (review.issues || []).filter((i) => ["critical", "major", "reject"].includes(String(i.severity || "").toLowerCase()));
    const numberedNotes = bySeverity.length ? bySeverity : (review.issues || []);
    // The NEXT gate pass judges only these notes (convergent re-review),
    // never a fresh cold read of the whole manuscript.
    job.pendingEditorNotes = numberedNotes;
    const skipped = numberedNotes.filter((issue, n) => {
      if (structurallyChanged) return false;
      const r = (revised.data.note_responses || []).find((x) => Number(x.note) === n + 1);
      if (!r) return true;
      const pages = (r.fixed_on_pages || []).map((p) => Number(p) - 1).filter((i) => i >= 0 && i < job.story.pages.length);
      return !pages.some((i) => pageKey(revised.data, i) !== pageKey(job.story, i));
    });
    job.breakdown.note_responses = revised.data.note_responses || [];
    delete revised.data.note_responses;
    if (skipped.length && !job.noteRetryUsed) {
      job.noteRetryUsed = true;
      console.warn(`[forge] revision skipped ${skipped.length} editor note(s), one targeted retry: ${skipped.map((i) => i.detail.slice(0, 80)).join(" | ")}`);
      const again = await reviseStoryAfterEditor({
        level, child, focusSound: book.focus_sound, pagesCount,
        story: revised.data, review: { ...review, issues: skipped }, premiseRejected: false,
        greenWords: greenWordsUpTo(book.level),
        progression: progressionUpTo(book.level),
        exemplars: coreStoriesFor(book.level),
      });
      charge(job, "story_usd", "reviseStoryAfterEditor:noteRetry", again.cost, again.model);
      job.breakdown.note_retry_responses = again.data.note_responses || [];
      delete again.data.note_responses;
      revised.data = again.data;
    } else if (skipped.length) {
      job.breakdown.notes_skipped_after_retry = skipped.map((i) => i.detail);
    }
  }
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
    progress: { step: "text_ready", message: "Text-only run complete â€” story approved, no images generated.", pct: 100, job },
  });
  job.textReported = true;
}

// THE PAINT MUST ALWAYS BELONG TO THE STORY IN THE BOOK (Lynden 2026-08-25:
// "make sure it never happens again"). castSheets and objectSheets are caches
// keyed by NAME, so any path that changes the story â€” a gate revision, an
// exact patch, a human edit, a restore â€” could leave the previous story's
// people and props in them, and the illustrator draws what it is given: Nuh's
// book was painted with a moth, a cobweb and a Dad that its words never
// mention. resetAfterStoryRevision now clears them, but that only covers ONE
// path. This signature check covers every path, including ones not yet
// written: before any picture is planned or painted, if the story's cast or
// key objects no longer match the sheets we hold, the sheets are thrown away
// and redrawn from the story that is actually in the book.
// The signature covers the DESCRIPTIONS, not just the names (Lynden
// 2026-08-25). Keying on names alone left a hole big enough to ship through:
// a "black star" was stripped from a lone shell's `look` before painting, but
// the object was still called "the shell", so the already-drawn reference
// survived and the star was injected onto all six pages anyway. If what the
// thing LOOKS LIKE changes, the old drawing of it is worthless.
function storySignature(story) {
  const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
  return JSON.stringify({
    cast: (story?.cast || []).map((c) => `${norm(c.id)}:${norm(c.who)}:${norm(c.appearance)}`).sort(),
    objects: (story?.key_objects || []).map((o) => `${norm(o.name)}:${norm(o.look)}`).sort(),
  });
}
// PER-ENTRY, not all-or-nothing: a changed prop description must not throw
// away a perfectly good (and paid-for) drawing of the hero's mum. Each cast
// member and key object carries its own signature; only the ones that no
// longer match â€” or that the story has dropped â€” are discarded and redrawn.
function ensureSheetsMatchStory(job) {
  const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
  const castSigs = Object.fromEntries((job.story?.cast || []).map((c) => [norm(c.id), `${norm(c.who)}|${norm(c.appearance)}`]));
  const objectSigs = Object.fromEntries((job.story?.key_objects || []).map((o) => [norm(o.name), norm(o.look)]));
  const prev = job.sheetSigs || { cast: {}, objects: {} };
  const dropped = { cast: [], objects: [] };

  for (const key of Object.keys(job.castSheets || {})) {
    const k = norm(key);
    if (prev.cast[k] !== undefined && castSigs[k] === prev.cast[k]) continue;
    if (castSigs[k] !== undefined && prev.cast[k] === undefined) continue; // never drawn under a signature yet
    delete job.castSheets[key];
    dropped.cast.push(key);
  }
  for (const key of Object.keys(job.objectSheets || {})) {
    const k = norm(key);
    if (prev.objects[k] !== undefined && objectSigs[k] === prev.objects[k]) continue;
    if (objectSigs[k] !== undefined && prev.objects[k] === undefined) continue;
    delete job.objectSheets[key];
    dropped.objects.push(key);
  }
  if (dropped.cast.length || dropped.objects.length) {
    console.warn(`[forge] the story changed what these look like â€” discarding reference art for ${[...dropped.cast, ...dropped.objects].join(", ")} so nothing from the old story can be painted`);
    job.breakdown.stale_sheets_discarded = dropped;
  }
  job.sheetSigs = { cast: castSigs, objects: objectSigs };
}

async function stepDirect(book, job) {
  ensureSheetsMatchStory(job);
  try {
    const d = await directScenes({ story: job.story, child: childOf(book) });
    charge(job, "story_usd", "directScenes", d.cost, d.model);
    job.directed = normaliseDirectedSettingPlan(job.story, d.data.pages);
    job.breakdown.entity_state_ledger = buildEntityStateLedger(job.story, job.directed);
    const continuity = validateDirectedContinuity(job.story, job.directed);
    if (continuity.length) {
      job.breakdown.director_continuity_failures = continuity;
      throw new NeedsReviewError(`director state ledger failed before painting: ${continuity.join(" | ").slice(0, 240)}`);
    }
  } catch (e) {
    if (e?.needsReview) throw e;
    console.warn("[forge] director pass failed before painting:", e.message);
    throw new NeedsReviewError(`illustration director failed before painting: ${String(e.message).slice(0, 240)}`);
  }
  job.directDone = true;
}

const STATE_WORDS = /\b(crowd(?:ed|ing)?|eat(?:ing)?|back|wait(?:ing)?|full|empty|open|closed|inside|outside|held|holding|moving|still|separate[ d]?|together)\b/gi;

export function buildEntityStateLedger(story, directed) {
  return (directed || []).map((page, i) => ({
    page: i + 1,
    text: String(story?.pages?.[i]?.text || ""),
    entities: (page.objects || []).map((object) => ({
      name: String(object.name || "").trim(),
      identity_lock: String(object.identity_lock || "").trim(),
      state: String(object.state || "").trim(),
    })).filter((object) => object.name),
  }));
}

export function normaliseDirectedSettingPlan(story, directed) {
  return (directed || []).map((page, i) => {
    // Normalise spelling only. Never guess that a continuation belongs to the
    // immediately previous setting: a book may leave a garden for a bedroom
    // and then RETURN to the earlier garden. The director must name that
    // canonical setting explicitly and validation rejects an unknown one.
    const settingId = String(page?.setting_id || story?.pages?.[i]?.location || `setting-${i + 1}`).trim().toLowerCase();
    return { ...page, setting_id: settingId };
  });
}

export function validateDirectedContinuity(story, directed) {
  const failures = [];
  const previous = new Map();
  const identityLocks = new Map();
  const seenSettings = new Set();
  for (let i = 0; i < (directed || []).length; i++) {
    const text = String(story?.pages?.[i]?.text || "");
    const plannedSetting = String(directed[i]?.setting_id || "").trim().toLowerCase();
    const relation = directed[i]?.setting_relation;
    const camera = directed[i]?.camera;
    if (!plannedSetting) failures.push(`page ${i + 1} has no canonical setting id`);
    const firstVisit = !seenSettings.has(plannedSetting);
    if (firstVisit && relation !== "new-setting") failures.push(`page ${i + 1} first visits ${plannedSetting} but is planned as ${relation}`);
    if (!firstVisit && relation === "new-setting") failures.push(`page ${i + 1} revisits ${plannedSetting} but is planned as a new setting`);
    if (relation === "same-view" && camera !== "same-view") failures.push(`page ${i + 1} same-view plan conflicts with ${camera} camera`);
    if (relation === "same-setting-closeup" && camera !== "closeup") failures.push(`page ${i + 1} close-up setting plan conflicts with ${camera} camera`);
    if (relation === "same-setting-new-angle" && camera !== "new-angle") failures.push(`page ${i + 1} new-angle setting plan conflicts with ${camera} camera`);
    if (/\b(?:pour(?:s|ed|ing)?|spill(?:s|ed|ing)?|leak(?:s|ed|ing)?|spray(?:s|ed|ing)?|drip(?:s|ped|ping)?|flow(?:s|ed|ing)?|stream(?:s|ed|ing)?|tips?|tipped|tipping)\b/i.test(text)
      && !(directed[i]?.flow_paths || []).length) {
      failures.push(`page ${i + 1} describes a flow but the director supplied no source/exit/route/destination plan`);
    }
    seenSettings.add(plannedSetting);
    for (const object of directed[i]?.objects || []) {
      const key = String(object.name || "").toLowerCase().trim();
      if (!key) continue;
      const identityLock = String(object.identity_lock || "").trim();
      const priorIdentity = identityLocks.get(key);
      if (priorIdentity && identityLock !== priorIdentity.lock) {
        failures.push(`page ${i + 1} changes ${key}'s immutable identity from page ${priorIdentity.page}`);
      } else if (!priorIdentity && identityLock) {
        identityLocks.set(key, { lock: identityLock, page: i + 1 });
      }
      const state = String(object.state || "").toLowerCase();
      const stateWords = new Set(state.match(STATE_WORDS)?.map((w) => w.replace(/ing$|ed$/g, "")) || []);
      const prior = previous.get(key);
      if (prior && /\b(stays?|remains?|still)\b/i.test(text)) {
        const opposites = [["full", "empty"], ["open", "closed"], ["inside", "outside"], ["moving", "still"], ["together", "separate"], ["crowd", "back"]];
        const contradicted = opposites.some(([a, b]) =>
          (prior.words.has(a) && stateWords.has(b)) || (prior.words.has(b) && stateWords.has(a)));
        if (contradicted) failures.push(`page ${i + 1} says ${key} stays/remains, but direction changes it from "${prior.state}" to "${state}"`);
      }
      previous.set(key, { state, words: stateWords, page: i + 1 });
    }
  }
  return failures;
}

async function stepHero(book, job) {
  const photo = photoStash.get(book.id);
  const hero = await generateHero({ child: childOf(book), photoB64: photo?.b64, photoMime: photo?.mime });
  charge(job, "images_usd", "generateHero", hero.cost, hero.model); job.breakdown.qa_notes.push(hero.qa);
  job.heroUrl = await saveImage(book.id, "hero.jpg", hero.buf);
}

async function castSheetFor(book, job, id) {
  const key = String(id).toLowerCase();
  // NEVER build a cast sheet for the hero: the hero reference (stepHero) is
  // their single fixed identity, and a second independently-generated sheet
  // inevitably wears a different outfit. On 2026-08-15 a revised story listed
  // Idris in its own cast, the QA was handed two conflicting "Idris" sheets,
  // and every page-2 attempt failed character match against one or the other
  // â€” an unwinnable deadlock that killed the book.
  const heroName = String(book.child_name || "").toLowerCase().trim();
  if (heroName && (key === heroName || key.includes(heroName))) return null;
  if (job.castSheets[key]) {
    const buf = await loadByUrl(job.castSheets[key].url);
    return buf ? { name: job.castSheets[key].name, buf } : null;
  }
  const member = (job.story.cast || []).find((m) => m?.id?.toLowerCase() === key);
  if (!member) return null;
  try {
    const heroBuf = job.heroUrl ? await loadByUrl(job.heroUrl).catch(() => null) : null;
    const c = await generateCastMember({ member, child: childOf(book), heroBuf });
    charge(job, "images_usd", "generateCastMember", c.cost, c.model); job.breakdown.qa_notes.push(c.qa);
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
// â€” no error, just a missing reference and the object drifting on that page
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

// A locked identity reference for a recurring key object (SKILL.md Â§5.1) â€”
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
    charge(job, "images_usd", "generateObjectRef", r.cost, r.model); job.breakdown.qa_notes.push(r.qa);
    const url = await saveImage(book.id, `object_${key.replace(/[^a-z0-9]/g, "")}.jpg`, r.buf);
    job.objectSheets[key] = { name: obj.name, url };
    return { name: obj.name, buf: r.buf };
  } catch (e) {
    console.warn(`[forge] object reference for ${rawName} failed:`, e.message);
    return null;
  }
}

async function stepScene(book, job, i) {
  ensureSheetsMatchStory(job); // never paint the previous story's cast or props
  const story = job.story;
  const child = childOf(book);
  const { fromDirector, fromText } = makeObjectBlocks(story);
  const heroBuf = await loadByUrl(job.heroUrl);
  if (!heroBuf) throw new Error("hero image missing from storage");

  const d = job.directed?.find((x) => x.page === i + 1);
  // The director's canonical physical setting groups writer-level positions
  // such as cart-edge, cart-spill and cart-clean under one reusable plate.
  const loc = (d?.setting_id || story.pages[i].location || "").trim().toLowerCase();
  // Ownership/absence assertions go into the GENERATION brief too, not just
  // the QA â€” draw the allocation right first time rather than repair it.
  const assertionText = d && (d.required_visible_states?.length || d.forbidden_visible_states?.length)
    ? ` MUST BE CLEARLY VISIBLE: ${(d.required_visible_states || []).map((a) => `${a.object} â€” ${a.assertion}`).join("; ")}.` +
      ((d.forbidden_visible_states || []).length ? ` MUST NOT BE SHOWN: ${(d.forbidden_visible_states || []).map((a) => `${a.object} â€” ${a.assertion}`).join("; ")}.` : "")
    : "";
  let sceneBrief = d ? `${d.brief} ${child.name} feels ${d.emotion}. Staging: ${d.staging}${assertionText}` : story.pages[i].scene;
  // Targeted repair (Lynden 2026-08-16, "edits instead of a complete re-run"):
  // a repair note for this page rides into the brief so the regeneration
  // fixes the named fault from the start instead of re-rolling the dice.
  const repairNote = job.repairNotes?.[i + 1] || job.repairNotes?.[String(i + 1)];
  if (repairNote) sceneBrief += ` REPAIR â€” the previous version of this page had this specific problem; fix it and keep everything else the same: ${repairNote}`;
  // The anchor is injected on EVERY revisit â€” the camera tag decides HOW it is
  // used, never WHETHER (see SKILL.md Â§3; gating on same-view was the worst
  // bug in this pipeline's history).
  let anchorUrl = loc ? job.anchors[loc] || null : null;
  let anchorBuf = anchorUrl ? await loadByUrl(anchorUrl) : null;
  // Legacy jobs pointed the location anchor at the first mutable page file.
  // A targeted page repair then overwrote the canonical setting by accident.
  // Detach it into an immutable setting plate before any paid image call.
  if (loc && anchorBuf && job.sceneUrls.includes(anchorUrl)) {
    const sourcePage = Math.max(1, job.sceneUrls.indexOf(anchorUrl) + 1);
    anchorUrl = await saveImage(book.id, `setting_page${sourcePage}.jpg`, anchorBuf);
    job.anchors[loc] = anchorUrl;
  }
  const camera = anchorBuf ? d?.camera || "new-angle" : "wide";

  // The location anchor is fixed to the FIRST image ever made there â€” good
  // for permanent architecture, but stale for anything set-dressing added
  // since (a rock's exact ledge shape, where an undeclared prop landed). The
  // PREVIOUS page's actual image, when it shares this page's location, is
  // what a manual "what would the next image look like, using the last one
  // as reference" workflow would use â€” undeclared recurring set-pieces (the
  // book was on a different-shaped rock every page) only carry forward this
  // way, since they were never captured as a formal key_objects reference
  // (Lynden 2026-08-11: "the rock changes in every scene... no continuation
  // of story through realistic image/object progression"). Skipped when it's
  // literally the same file as the anchor (page 2, the anchor's own source).
  const prevDirection = i > 0 ? job.directed?.find((x) => x.page === i) : null;
  const prevLoc = i > 0 ? (prevDirection?.setting_id || story.pages[i - 1].location || "").trim().toLowerCase() : null;
  const prevUrl = prevLoc && prevLoc === loc && job.sceneUrls[i - 1] && job.sceneUrls[i - 1] !== anchorUrl
    ? job.sceneUrls[i - 1]
    : null;
  const prevBuf = prevUrl ? await loadByUrl(prevUrl) : null;

  const wanted = d?.cast_present?.length
    ? d.cast_present
    : (story.cast || []).map((m) => m?.id).filter((id) => id && story.pages[i].text.toLowerCase().includes(id.toLowerCase()));
  const castRefs = (await Promise.all(wanted.map((id) => castSheetFor(book, job, id)))).filter(Boolean);

  // Key objects the director declared visible on THIS page get their locked
  // identity reference injected too (see objectSheetFor) â€” falls back to
  // matching the object's name in the page text when there is no director
  // pass, same pattern castRefs already uses above.
  const wantedObjects = d?.objects?.length
    ? d.objects.map((o) => o.name)
    : (story.key_objects || []).map((o) => o?.name).filter((n) => n && story.pages[i].text.toLowerCase().includes(n.toLowerCase()));
  const objectRefs = (await Promise.all(wantedObjects.map((name) => objectSheetFor(book, job, name)))).filter(Boolean);

  // The previous approved image's ACTUAL state (see extractSceneState) binds
  // this page harder than any plan does â€” a card's dots stay where the last
  // picture actually put them, in the size it actually drew the card.
  const carried = job.carriedState && prevLoc === loc
    ? ` ACTUAL STATE AFTER THE PREVIOUS PAGE (binding â€” redraw each object exactly like this except what this page's action changes): ${job.carriedState}`
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
    // consistency QA in generateScene â€” a story page always has real text,
    // unlike the cover, which has none to check against.
    pageText: story.pages[i].text,
    // Director-declared ownership/negative-state assertions for this page â€”
    // verified against the finished image by sceneConsistencyQA (an object
    // being visible is not the same as the allocation being visible).
    assertions: d ? { required: d.required_visible_states || [], forbidden: d.forbidden_visible_states || [] } : null,
    // The director's per-page mechanics go into the prompt verbatim: contact,
    // support, counts, and the shape of any rope or line. Designing the
    // plausibility in is cheaper than paying QA to find it missing, and a
    // general homily about objects resting on surfaces could never have
    // prevented a two-stranded skipping rope (Lynden 2026-08-21).
    physics: [
      d?.physics || "",
      ...((d?.flow_paths || []).map((flow) =>
        `FLOW PATH — ${flow.substance}: starts ${flow.source}; exits ONLY through ${flow.exit}; follows ${flow.route}; lands ${flow.destination}; MUST NOT emerge through ${(flow.forbidden_exits || []).join(", ") || "any sealed surface"}.`)),
    ].filter(Boolean).join(" "),
    // Keep a chain only for a short adjacent run in the same mutable world.
    // A full-book chain made later pages reread every earlier turn and caused
    // page-eight cost to exceed page-one cost fivefold.
    previousResponseId: prevLoc === loc && carried && Number(job.chainDepth || 0) < 2
      ? job.chainResponseId : null,
  };
  let s = await generateScene(sceneArgs);
  // A FAILED CONSISTENCY QA IS BLOCKING (Lynden 2026-08-15, "The Train in the
  // Drain": pages 4-5 failed QA with exact, correct reasons â€” "she is not
  // shown actually sliding a hook into the drain" â€” and the old code logged a
  // console warning and SHIPPED them; the paid-for verdict went in the bin).
  // generateScene already did one chained repair; here we regenerate the
  // scene ONCE from scratch (chain broken, so the model can't just re-emit
  // its own bad picture), and if the action still is not visible the book
  // fails resumably at this scene instead of delivering a page whose central
  // action happens off-camera.
  if (s.qa?.consistency && !s.qa.consistency.pass && s.qa.consistency.severity !== "minor") {
    console.warn(`[forge] page ${i + 1} consistency QA failed after repair â€” regenerating from scratch: ${s.qa.consistency.reason}`);
    charge(job, "images_usd", `generateScene:p${i + 1}:discarded`, s.cost, s.model);
    job.breakdown.qa_notes.push({ ...s.qa, page: i + 1, discarded: "consistency fail â€” regenerated" });
    s = await generateScene({ ...sceneArgs, previousResponseId: null });
    if (s.qa?.consistency && !s.qa.consistency.pass) {
      charge(job, "images_usd", `generateScene:p${i + 1}:discarded`, s.cost, s.model);
      job.breakdown.qa_notes.push({ ...s.qa, page: i + 1, discarded: "consistency fail â€” page rejected" });
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
  charge(job, "images_usd", `generateScene:p${i + 1}`, s.cost, s.model);
  if (s.responseId) {
    job.chainDepth = sceneArgs.previousResponseId ? Number(job.chainDepth || 0) + 1 : 1;
    job.chainResponseId = s.responseId;
  } else {
    job.chainDepth = 0;
    job.chainResponseId = null;
  }
  job.breakdown.qa_notes.push({ ...s.qa, page: i + 1, location: loc || null, camera, anchored: Boolean(anchorBuf), chained: Boolean(s.responseId) });

  // Record what the approved image ACTUALLY shows for each key object, for
  // the next page to inherit. Non-fatal: a failed extraction just means the
  // next page falls back to plan-only state, as every page did before this.
  try {
    // The continuity register is DYNAMIC: an object joins it the moment the
    // story makes it matter, not only if it was declared a key_object up
    // front. "The Star Card"'s mat became the story's hiding place on page 3
    // yet was never tracked â€” its pattern, tassels and lifted-edge physics
    // drifted page to page (Lynden 2026-08-14). Director-declared per-page
    // objects are exactly that register, so record their state too.
    const objectNames = [...new Set([
      ...(story.key_objects || []).map((o) => o?.name),
      ...((d?.objects || []).map((o) => o?.name)),
    ].filter(Boolean))];
    if (objectNames.length) {
      const st = await extractSceneState(s.buf.toString("base64"), { objectNames });
      charge(job, "story_usd", `extractSceneState:p${i + 1}`, st.cost, st.model);
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
  if (loc && !job.anchors[loc]) {
    // pageN.jpg is repairable; the setting plate must never be overwritten.
    job.anchors[loc] = await saveImage(book.id, `setting_page${i + 1}.jpg`, s.buf);
  }
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
  // WHICH PAGE: the one where the hero's face is biggest and clearest, taken
  // from every page except the last (the last page is the resolution and
  // would spoil the ending). Fixed page 1 put an adult in the middle of the
  // frame and cropped the child to a sliver - the editor rejected the book
  // for it (Nadia, 2026-08-21).
  const { findFaces } = await import("./claude.mjs");
  const heroName = String(book.child_name || "").toLowerCase();
  const isHero = (f) => {
    const who = String(f.who || "").toLowerCase();
    return (heroName && who.includes(heroName)) || /(girl|boy|child|kid)/.test(who);
  };
  const candidates = job.sceneUrls.slice(0, Math.max(1, job.sceneUrls.length - 1));
  let best = { idx: 0, area: -1, centre: 0.5 };
  for (let n = 0; n < candidates.length; n++) {
    try {
      const b64 = (await loadByUrl(candidates[n])).toString("base64");
      const f = await findFaces(b64);
      charge(job, "story_usd", "findFaces:cover", f.cost, f.model);
      const kid = (f.data?.faces || []).filter(isHero).sort((a, c) => (c.w * c.h) - (a.w * a.h))[0];
      if (kid && kid.w * kid.h > best.area) best = { idx: n, area: kid.w * kid.h, centre: kid.x + kid.w / 2 };
    } catch { /* keep looking */ }
  }
  const idx = best.idx;
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
  const centre = best.area > 0 ? Math.min(0.98, Math.max(0.02, best.centre)) : 0.5;
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
    charge(job, "story_usd", "countryFacts", cf.cost, cf.model);
    job.country = cf.data;
    // How to SAY this child's name, for the tricky-word strip. No static
    // table can know that Tomasz is Tom-ash or Siobhan is Shi-vawn, and a
    // personalised book puts that word on nearly every page (2026-08-21).
    try {
      const nb = await nameBreakdown({ name: book.child_name, country: book.country });
      charge(job, "story_usd", "nameBreakdown", nb.cost, nb.model);
      job.nameBreakdown = nb.data;
    } catch (e) {
      console.warn('[forge] name breakdown unavailable:', e.message);
    }
    const lm = await generateLandmark({
      name: cf.data.landmark.name,
      imageBrief: cf.data.landmark.image_brief,
      city: book.city,
      country: book.country,
    });
    charge(job, "images_usd", "generateLandmark", lm.cost, lm.model); job.breakdown.qa_notes.push(lm.qa);
    job.landmarkUrl = await saveImage(book.id, "landmark.jpg", lm.buf);
  } catch (e) {
    console.warn("[forge] country pack failed (profile renders without it):", e.message);
  }
  job.countryDone = true;
}

// Cold-editor whole-book gate (Lynden 2026-08-13): a critic-framed review of
// the FINISHED book â€” cover + every page image + every sentence at once â€”
// because per-page checklist judges structurally cannot see a thin premise,
// a drifting object, or a phonics page contradicting the story. An external
// cold read caught all of those in "The Chip on Top" after every per-page
// gate had passed. Reject-severity issues fail the book rather than ship it.
// One editor-ordered repaint, in its own invocation (routed as "repair:N" —
// see nextStepOf). Splitting these out of stepReview is what keeps every
// invocation under Vercel's time ceiling.
async function stepRepairPage(book, job) {
  const n = Number(job.repairQueue[0]);
  await stepScene(book, job, n - 1);
  job.repairQueue = job.repairQueue.slice(1);
}

export function buildExpectedAssertions(directed, childName) {
  return (directed || []).flatMap((page, i) => {
    const required = (page.required_visible_states || []).map((a, n) => ({
      id: `p${i + 1}:required:${n + 1}`, page: i + 1, kind: "required", assertion: a.assertion,
    }));
    const forbidden = (page.forbidden_visible_states || []).map((a, n) => ({
      id: `p${i + 1}:forbidden:${n + 1}`, page: i + 1, kind: "forbidden", assertion: a.assertion,
    }));
    const flows = (page.flow_paths || []).map((flow, n) => ({
      id: `p${i + 1}:flow:${n + 1}`, page: i + 1, kind: "flow",
      assertion: `Trace the visible ${flow.substance} continuously: it starts ${flow.source}, exits ONLY through ${flow.exit}, follows ${flow.route}, and lands ${flow.destination}. It must not emerge through ${(flow.forbidden_exits || []).join(", ") || "any sealed surface"}.`,
    }));
    return [...required, ...forbidden, ...flows, {
      id: `p${i + 1}:hero-identity`, page: i + 1, kind: "identity",
      assertion: `${childName} matches the canonical hero reference in face, skin, hair and exact clothing colours; the hero and the page's central action are not unintentionally cropped.`,
    }];
  });
}

export function objectiveVisualFailures(expectedAssertions, assertionChecks) {
  const checks = new Map((assertionChecks || []).map((c) => [String(c.id), c]));
  return expectedAssertions.filter((a) => checks.get(a.id)?.pass !== true).map((a) => {
    const observed = checks.get(a.id)?.observed || "The editor returned no observation for this required check.";
    return { severity: "major", area: a.kind === "identity" ? "object-identity" : a.kind === "flow" ? "image-physics" : "story-state",
      pages: [a.page], detail: `${a.assertion} OBSERVED: ${observed}` };
  });
}

async function stepReview(book, job) {
  const story = job.story;
  const level = getLevel(book.level);
  const expectedAssertions = buildExpectedAssertions(job.directed, book.child_name);

  // CHECKPOINTED VERDICT: the editor's answer is persisted the moment it
  // comes back, so a killed invocation resumes from the verdict instead of
  // paying for the read again. Cleared whenever the book changes (repaints,
  // text repair, cover re-crop) — a mended book re-earns a FRESH verdict.
  let review = job.pendingReview;
  if (!review) {
    const { reviewThumb } = await import("./images.mjs");

    const urls = [job.coverUrl, ...job.sceneUrls].filter(Boolean);
    const images = [];
    for (const url of urls) {
      const buf = await loadByUrl(url);
      // 1024px, not 640: the editor must be able to resolve the details its
      // rubric asks about (a hook on a stall, the slot width of a drain grate).
      // 640px is plenty for a whole-book read and cuts the largest input this
      // pipeline sends. The editor judges composition, continuity and whether
      // the action is visible at a reviewable 1024px without full render files. The
      // per-page QA still sees full-size images (Lynden 2026-08-22, on cost).
      const small = await reviewThumb(buf, 1024);
      images.push({ b64: small.toString("base64"), mime: "image/jpeg" });
    }

    // No silent caps: any per-page QA verdict that stayed failed reaches the
    // editor instead of dying in a console log (the exact failure of
    // 2026-08-15 â€” the QA had named the missing hook action and nobody read it).
    const unresolvedQa = (job.breakdown.qa_notes || [])
      .filter((n) => n && n.page && n.consistency && n.consistency.pass === false && !n.discarded)
      .map((n) => ({ page: n.page, reason: String(n.consistency.reason || "").slice(0, 300) }));

    const { coldEditorReview } = await import("./claude.mjs");
    const r = await coldEditorReview({ story, level, focusSound: book.focus_sound, images, unresolvedQa, expectedAssertions });
    review = r.data;
    charge(job, "story_usd", "coldEditorReview", r.cost, r.model);
    job.pendingReview = review;
    await persist(book.id, job, displayFor(book, job, "review"));
  }
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

  // Vision observes; code decides. Every expected assertion must be returned
  // exactly once and pass. Missing checks, count mismatches, cropping, broken
  // contact and identity drift become majors regardless of the model verdict.
  const objectiveFailures = objectiveVisualFailures(expectedAssertions, review.assertion_checks);
  if (objectiveFailures.length) review.issues = [...(review.issues || []), ...objectiveFailures];

  review.issues = (review.issues || []).map((issue) => {
    const text = `${issue.area || ""} ${issue.detail || ""}`;
    return /identity|outfit|wardrobe|clothing|skin tone|hair colour/i.test(text)
      ? { ...issue, severity: "major" }
      : issue;
  });
  // Record the final code-enforced count, not the model-only count captured
  // before mandatory assertions and severity promotion were applied.
  job.gates.cold_editor.issues = review.issues.length;

  // Pass/fail is DERIVED from issue severities, never from the model's
  // separately generated boolean (on 2026-08-14 a book was killed by a review
  // whose issues were all "minor" yet whose pass came out false). Minor-only
  // review = ship, with the notes kept internally.
  const verdict = deriveEditorVerdict(review);
  if (!verdict.pass) {
    const detail = verdict.blocking.map((i) => `[${i.severity}/${i.area}] ${i.detail}`).join(" | ") || review.reason;
    // SECOND, SMARTER REPAIR BEFORE GIVING UP (Lynden 2026-08-25: "why is it
    // not doing that automatically, how would the customer know this"). The
    // first repair repaints the named pages. If the editor still objects, the
    // fault is usually the TEXT, not the brush: "Nuh gets Mum from the back"
    // is a beat no single picture can show, so repainting it forever cannot
    // win. The editor now supplies an exact `replacement` line, so apply it,
    // re-stage that page's scene brief from the new words, and repaint once
    // more. Only if THAT fails does a human get involved.
    if (false && job.editorRetryUsed && !job.editorTextRepairUsed) {
      const textFixes = verdict.blocking
        .map((i) => ({ page: Number((Array.isArray(i.pages) ? i.pages[0] : i.page) || 0), replacement: String(i.replacement || "").trim() }))
        .filter((f) => f.page >= 1 && f.page <= (job.story.pages || []).length && f.replacement);
      if (textFixes.length) {
        job.editorTextRepairUsed = true;
        const child = childOf(book);
        const applied = [];
        for (const f of textFixes) {
          const next = fixMechanics(f.replacement, child.name);
          const bad = decodeProblems([...new Set(next.toLowerCase().match(/[a-z']+/g) || [])], book.level,
            { heroName: child.name, borrow: borrowableTricky(book.level) });
          if (bad.length) { console.warn(`[forge] editor text fix for page ${f.page} rejected (not decodable): ${bad.join("; ")}`); continue; }
          job.story.pages[f.page - 1].text = next;
          applied.push(f.page);
        }
        if (applied.length) {
          job.breakdown.editor_text_repair = { pages: applied };
          console.warn(`[forge] editor gate: repainting failed, so applying the editor's own words to page(s) ${applied.join(", ")} and re-staging`);
          if (process.env.FORGE_WRITER_PROMPT === "compact") {
            await applyStaging(job, job.story, book, child, getLevel(book.level));
          }
          job.repairNotes = { ...(job.repairNotes || {}), ...Object.fromEntries(applied.map((n) => [n, "The text of this page changed â€” draw exactly what it now says."])) };
          job.repairQueue = applied;      // one page per invocation (repair:N)
          job.pendingReview = null;
          job.reviewDone = false; // the mended book re-earns its verdict
          return;
        }
      }
    }

    if (job.editorRetryUsed) {
      // NEVER SHIP WITH AN OPEN MAJOR â€” AT THIS GATE TOO (Lynden 2026-08-25:
      // "The Stuck Lunch Box" reached `ready` carrying two majors and a
      // do-not-ship-as-is verdict, because the 08-24 hard stop only guarded
      // the story gate). The revision is spent, so the book STOPS for a human
      // instead of proceeding with edit requests: nothing already paid for is
      // lost â€” the job, images and reports are preserved, and /retry resumes
      // after a human edit or repair.
      job.breakdown.editor_review_second = review;
      job.breakdown.editor_edit_requests = verdict.blocking;
      if (verdict.minors.length) job.breakdown.editor_review_minors = verdict.minors;
      job.pendingReview = null; // a human will change the book; re-read it on /retry
      throw new NeedsReviewError(`cold editor: ${verdict.blocking.length} blocking issue(s) after the one revision â€” ${detail.slice(0, 220)}`);
    }
    // ONE bounded revision (Lynden 2026-08-13: "rewrite once"): revise the
    // story against the editor's reasons â€” SAME PREMISE unless the editor
    // explicitly rejected the premise itself â€” then send the book back
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
    // teaching-truth is NOT in this set: a teaching-truth fault that names a
    // page is almost always a PICTURE fault (Kai 2026-08-23: "the track is
    // drawn as one continuous wavy line, but a toy car leaves paired wheel
    // marks" â€” drawable, page 5). Leaving it book-level sent that book to a
    // full rewrite that wiped six finished scenes and the cover, the exact
    // $1.30 throw-away this path exists to prevent. A teaching-truth fault in
    // the TEXT is caught by the text-only story gate before any image exists.
    const BOOK_LEVEL = new Set(["premise", "story", "language", "phonics", "safety"]);
    // The editor now states the pages on each issue; the prose regex stays as
    // a fallback for older rows and for a model that leaves the list empty.
    const pageOf = (i) => {
      if (Array.isArray(i.pages) && i.pages.length) return Number(i.pages[0]);
      const m = String(i.detail || "").match(/pages?\s+(\d+)/i);
      return m ? Number(m[1]) : null;
    };
    const pagesOf = (i) => (Array.isArray(i.pages) && i.pages.length
      ? i.pages.map(Number)
      : [pageOf(i)].filter(Boolean));
    // A cover fault is the cheapest fix in the book - re-choose and re-crop -
    // but it names no page number, so it fell through to a full rewrite and
    // threw away six finished pages (Nadia, 2026-08-21).
    const isCoverFault = (i) => /cover/i.test(String(i.detail || ""));
    if (verdict.blocking.every(isCoverFault)) {
      job.coverUrl = null;
      job.pendingReview = null;
      job.reviewDone = false;
      job.breakdown.editor_cover_recrop = verdict.blocking.map((i) => i.detail);
      console.warn("[forge] editor gate: re-cropping the cover, keeping the finished pages");
      return;
    }
    // NO POST-IMAGES REWRITES, EVER (Lynden 2026-08-23, after the first real
    // prod book: a clean-gate story was painted for ~$2.80, this editor
    // called it "too thin", and the autonomous rewrite+repaint shipped a
    // WORSE book at $5.55 with open majors at both layers). Story quality is
    // the PRE-images gate's job â€” it is the only place a weak story is cheap
    // to kill. Here, with every scene already paid for: repair the pages the
    // editor names, and anything it cannot pin to a page rides out as an
    // AUTO-FLAG on the row for the morning admin queue. The customer gets
    // their book tonight; a human reviews the flag over coffee and can push
    // a repaired version to the same link.
    const notes = {};
    for (const i of verdict.blocking) {
      for (const n of pagesOf(i)) notes[n] = notes[n] ? `${notes[n]} ${i.detail}` : i.detail;
    }
    const unrepairable = verdict.blocking.filter((i) => !pagesOf(i).length && !isCoverFault(i));
    if (unrepairable.length) {
      job.autoFlag = (job.autoFlag || []).concat(unrepairable.map((i) => `[${i.area}] ${i.detail}`));
      job.breakdown.editor_unrepairable_flagged = unrepairable;
      console.warn(`[forge] editor gate: ${unrepairable.length} book-level note(s) flagged for the admin queue (no rewrite)`);
    }
    if (Object.keys(notes).length) {
      job.repairNotes = { ...(job.repairNotes || {}), ...notes };
      job.repairQueue = Object.keys(notes).map(Number).sort((a, b) => a - b)
        .filter((n) => n >= 1 && n <= job.sceneUrls.length);  // one per invocation
      job.breakdown.editor_targeted_repair = notes;
      job.pendingReview = null;
      job.reviewDone = false; // the mended book re-earns its verdict
      console.warn(`[forge] editor gate: repairing only page(s) ${Object.keys(notes).join(", ")} instead of repainting the book`);
      return;
    }
    // A blocking objective or book-level failure never becomes ready merely
    // because it lacks a repaintable page number.
    if (unrepairable.length) {
      throw new NeedsReviewError(`cold editor: ${unrepairable.length} blocking issue(s) need a human decision — ${detail.slice(0, 220)}`);
    }
    // Nothing page-repairable and no blocking issue remains.
    if (verdict.minors.length) job.breakdown.editor_review_minors = verdict.minors;
    job.pendingReview = null;
    job.reviewDone = true;
    return;
  }
  if (verdict.minors.length) job.breakdown.editor_review_minors = verdict.minors;
  job.pendingReview = null;
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
      nameBreakdown: job.nameBreakdown || null,
      facts: job.country?.facts || [],
      landmark: job.country
        ? { name: job.country.landmark.name, fact: job.country.landmark.fact, imageUrl: job.landmarkUrl }
        : null,
    },
  ];

  job.assembled = true;
  await updateBook(book.id, {
    status: "ready",
    title: story.title,
    pages,
    // A book that shipped with known open notes carries them on the row â€”
    // the admin queue surfaces review_note, so the morning pass sees every
    // auto-flagged book without digging through job breakdowns.
    ...(job.autoFlag?.length ? { review_note: `AUTO-FLAG: ${job.autoFlag.join(" | ")}`.slice(0, 2000) } : {}),
    story: { story, validation: job.validation, directed: job.directed, shiftyMarks: job.shiftyMarks },
    profile: pages[pages.length - 1],
    cost_usd: Number(job.cost.toFixed(4)),
    cost_breakdown: job.breakdown,
    progress: { step: "done", message: "Your book is ready!", pct: 100, job },
  });

  // The typeset PDF needs Python + Playwright â€” dev-machine only. In prod the
  // reader is the product and the PDF button degrades gracefully (501 â†’ the
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
    freshStory: ["story", `Taking a fresh run at ${name}'s story...`, 5],
    story: ["story", `Writing ${name}'s story around the sound "${book.focus_sound}"...`, 5],
    qa: ["phonics_qa", "Checking every word is decodable at this level...", 15],
    plausibility: ["plausibility_qa", "Checking the story actually makes sense...", 20],
    storyGate: ["story_editor", "A demanding editor is reading the manuscript before we mix any paint...", 22],
    textReport: ["text_ready", "Text-only run complete â€” story approved, no images generated.", 100],
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
// { done, step, status } â€” `step` is what just RAN (or "busy"/"done").
export async function runNextStep(bookId) {
  const book = await getBook(bookId);
  if (!book) throw new Error("book not found");
  if (["ready", "approved", "rejected", "text_ready", "content_rejected", "needs_review"].includes(book.status)) {
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
    // Not a step that RUNS â€” a resting state. The full imagery contract is
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
  // raising job.capUsd (router.mjs) â€” automation never raises it itself.
  const cap = Number(job.capUsd || MAX_BOOK_SPEND_USD);
  if (job.cost >= cap) {
    console.error(`[forge] ADMIN: book ${bookId} paused at spend cap ($${job.cost.toFixed(2)} >= $${cap})`);
    await updateBook(bookId, {
      status: "paused_budget",
      progress: {
        ...(book.progress || {}),
        step: "paused_budget",
        message: "Taking a little longer than usual â€” the team has been alerted and your book will continue shortly.",
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
    // Sequence numbers continue from the step's persisted high-water mark
    // instead of restarting at 0 each invocation — otherwise a re-entered
    // step collides with its own confirmed operation keys and is refused as
    // a duplicate (the "paused_budget at $0.59" wedge, 2026-08-27). The mark
    // rides on the job, so it persists with every existing persist() call.
    job.spendSeq = job.spendSeq || {};
    const spendSeqKey = `e${Number(job.spendEpoch || 0)}:${step}`;
    const spendCtx = { bookId, step, epoch: job.spendEpoch || 0, capUsd: cap,
      sequence: Number(job.spendSeq[spendSeqKey]) || 0 };
    try {
    await withSpendContext(spendCtx, async () => {
    if (step === "freshStory") {
      // Open majors survived the gate's edit passes: abandon the manuscript
      // (cheap â€” no image exists yet) and write a fresh one at the same spec.
      // Archived in the breakdown; the second attempt paints regardless (with
      // an auto-flag) so the customer always gets a book.
      console.warn(`[forge] story reached the imagery boundary with open majors â€” fresh attempt instead of painting "${job.story?.title}"`);
      job.freshAttemptUsed = true;
      job.breakdown.abandoned_story = { title: job.story?.title, open_requests: job.breakdown.story_gate_edit_requests };
      job.story = null; job.qaDone = false; job.storyGateDone = false; job.directDone = false;
      job.validation = null; job.directed = null; job.pendingEditorNotes = null;
      job.storyRetryUsed = false; job.noteRetryUsed = false; job.storyEditRequests = 0;
      job.shiftyMarks = null;
      delete job.breakdown.story_gate_edit_requests;
    }
    else if (step === "story") await stepStory(book, job);
    else if (step === "qa") await stepQa(book, job);
    else if (step === "plausibility") await stepPlausibility(book, job);
    else if (step === "storyGate") await stepStoryGate(book, job);
    else if (step === "textReport") await stepTextReport(book, job);
    else if (step === "direct") await stepDirect(book, job);
    else if (step === "hero") await stepHero(book, job);
    else if (step.startsWith("scene:")) await stepScene(book, job, Number(step.split(":")[1]));
    else if (step === "cover") await stepCover(book, job);
    else if (step === "country") await stepCountry(book, job);
    else if (step.startsWith("repair:")) await stepRepairPage(book, job);
    else if (step === "review") await stepReview(book, job);
    else if (step === "assemble") await stepAssemble(book, job);
    });
    } finally {
      job.spendSeq[spendSeqKey] = Math.max(
        Number(job.spendSeq[spendSeqKey]) || 0, Number(spendCtx.sequence) || 0);
    }
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
        // Durable archive in its OWN column â€” progress is rewritten wholesale
        // by every later step, so an archive stored there survives seconds
        // (the first try-again run wiped its predecessor's audit trail,
        // 2026-08-15). Append-only: each rejected run stacks up.
        rejected_runs: [
          ...(book.rejected_runs || []),
          { rejected_at: new Date().toISOString(), detail: String(e.message || e).slice(0, 300), job },
        ],
        progress: {
          step: "content_rejected",
          message: "We couldn't get this story to meet our quality standard. Your book credit has not been used â€” you can try the same idea again or choose a different story idea.",
          detail: String(e.message || e).slice(0, 300),
          pct: 0,
          job, // convenience copy for the wizard; the durable one is rejected_runs
        },
      });
      return { done: true, step, status: "content_rejected" };
    }

    if (e?.needsReview) {
      console.error(`[forge] ADMIN: book ${bookId} needs manual review at step "${step}": ${String(e.message || e).slice(0, 200)}`);
      await updateBook(bookId, {
        status: "needs_review",
        cost_usd: Number(job.cost.toFixed(4)),
        cost_breakdown: job.breakdown,
        // The admin queue reads review_note â€” a book waiting on a human must
        // be visible there without forensics (Lynden 2026-08-25).
        review_note: `NEEDS REVIEW: ${String(e.message || e).slice(0, 1900)}`,
        progress: {
          step: "needs_review",
          message: "Almost there â€” one page is having a final check by a person. We will email you the moment it is ready.",
          detail: String(e.message || e).slice(0, 300),
          pct: book.progress?.pct ?? 0,
          job, // everything preserved: a human edits the story, then retry resumes
        },
      });
      return { done: true, step, status: "needs_review" };
    }

    if (PROVIDER_CREDIT_RE.test(String(e.message || e))) {
      // Provider credits ran out: PAUSE, don't fail, and never switch image
      // provider mid-book (a fallback breaks character/style continuity).
      // Every completed image is already checkpointed in job; after topping
      // up, retry resumes from this exact step with the same provider.
      console.error(`[forge] ADMIN: book ${bookId} paused â€” provider credits exhausted at step "${step}": ${e.message}`);
      await updateBook(bookId, {
        status: "paused_provider_credit",
        cost_usd: Number(job.cost.toFixed(4)),
        cost_breakdown: job.breakdown,
        progress: {
          ...(book.progress || {}),
          step: "paused_provider_credit",
          message: "Your book is safe and saved â€” it will continue from exactly where it stopped shortly.",
          detail: String(e.message || e).slice(0, 300),
          pct: book.progress?.pct ?? 0,
          job,
        },
      });
      return { done: true, step, status: "paused_provider_credit" };
    }

    if (e instanceof DuplicateSpendOperationError || e?.duplicateSpend) {
      return { done: false, step: "busy", status: "generating" };
    }
    if (e instanceof SpendCapError || e?.spendCap) {
      await updateBook(bookId, {
        status: "paused_budget",
        cost_usd: Number(job.cost.toFixed(4)),
        cost_breakdown: job.breakdown,
        progress: { ...(book.progress || {}), step: "paused_budget",
          message: "The book reached its spend limit and is safely paused.",
          detail: String(e.message || e).slice(0, 300), pct: book.progress?.pct ?? 0, job },
      });
      return { done: true, step, status: "paused_budget" };
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
  // Per-step cost ledger â€” separates story, each gate, each scene image,
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
    // No background work on a lambda â€” set up the row and let the wizard
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
  if (!job?.story) throw new Error("no job state with a story on this book â€” repair needs the archived job");
  if (!job.sceneUrls?.length) throw new Error("no generated scenes to repair");

  job.repairNotes = { ...scenes, ...(cover ? { cover } : {}) };
  // A human asked for this repair â€” that IS the imagery sign-off, and the
  // book's images were approved-for-spend when they were first generated.
  job.imageryApproved = true;
  const pageNums = Object.keys(scenes).map(Number).filter((n) => n >= 1 && n <= job.sceneUrls.length);
  if (!pageNums.length && !cover) throw new Error("nothing to repair â€” pass scenes {page: note} and/or cover note");

  // Regenerate the named scenes in place, cheapest-first order irrelevant â€”
  // sequential keeps prev-page continuity references coherent.
  await updateBook(bookId, { status: "generating", progress: { ...(book.progress || {}), step: "repair", message: `Repairing ${pageNums.length ? `page${pageNums.length > 1 ? "s" : ""} ${pageNums.join(", ")}` : ""}${cover ? `${pageNums.length ? " + " : ""}cover` : ""}...`, job } });
  for (const n of pageNums.sort((a, b) => a - b)) {
    // SPEND CEILING APPLIES TO REPAIRS TOO (Lynden 2026-08-26: a repair ran
    // $6.41 past a $5.98 cap because only the step machine checked it). Same
    // rule as generation: at the cap, pause fully-resumable — the remaining
    // repairNotes survive on the job, and a human /retry buys the next unit.
    const cap = Number(job.capUsd || MAX_BOOK_SPEND_USD);
    if (job.cost >= cap) {
      console.error(`[forge] ADMIN: repair of ${bookId} paused at spend cap ($${job.cost.toFixed(2)} >= $${cap}) — pages ${pageNums.filter((m) => m >= n).join(", ")} not repainted`);
      await updateBook(bookId, {
        status: "paused_budget",
        progress: { ...(book.progress || {}), step: "repair", message: `Repair paused at the spend cap ($${cap}) — pages ${pageNums.filter((m) => m >= n).join(", ")} still waiting.`, job },
      });
      return { repaired: pageNums.filter((m) => m < n), paused_at_cap: true, cover: false };
    }
    await stepScene(book, job, n - 1);
    await persist(bookId, job, { step: "repair", message: `Repaired page ${n}`, pct: 80, job });
  }
  if (cover) job.coverUrl = null; // nextStepOf re-enters at "cover" with the note applied

  // The mended book must re-earn its verdict: review + assembly rerun.
  job.reviewDone = false;
  job.pendingReview = null;
  job.assembled = false;
  await persist(bookId, job, { step: "repair", message: "Repairs done â€” re-running the editor review...", pct: 85, job });
  startGeneration(bookId);
  return { repaired: pageNums, cover: Boolean(cover) };
}

// Render the finished book through the REAL book pipeline (book_v2.html).
// Locally: scripts/generate_custom_book.py â†’ Playwright â†’ A5 PDF, direct.
// In production: api/render-book-html.py (same Jinja2 template) â†’ Node
// Chromium (pdf.mjs) â†’ A5 PDF, then emailed to whoever ordered the book
// (email.mjs). See renderPdfServerless above for why it's split this way.
const pdfInFlight = new Map();

export function renderPdf(bookId, opts = {}) {
  if (pdfInFlight.has(bookId)) return pdfInFlight.get(bookId);
  const p = (IS_SERVERLESS ? renderPdfServerless(bookId, opts.origin, { force: opts.force }) : renderPdfInner(bookId, opts))
    .finally(() => pdfInFlight.delete(bookId));
  pdfInFlight.set(bookId, p);
  return p;
}

// Shared by both the local (Python+Playwright) and serverless (Python HTML
// function + Node Chromium) renderers â€” everything about turning a book row
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
    // The fallback list goes to the renderer's decodability gate unchecked, so
    // it gets the same free filter read_words already had upstream â€” a single
    // dishonest example here fails the whole typeset after the money is spent.
    story_words: (story.read_words?.length
      ? story.read_words
      : (story.focus_word_examples || []).filter((w) => !decodeProblems([w], book.level, { heroName: book.child_name, allowPeople: false }).length)
    ).slice(0, 6),
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
// back off the resulting local dir â€” same naming contract as the local path's
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
async function renderPdfServerless(bookId, origin, { force = false } = {}) {
  const book = await getBook(bookId);
  if (!book?.pages) throw new Error("book has no pages yet");

  // A book.pdf already in storage was saved AFTER the page-count gate passed,
  // so it is a delivered, valid book — hand its URL back instead of paying
  // for a full re-render. Every admin-ledger click used to re-typeset the
  // whole book (Lynden 2026-08-26, "the links don't work" — slow renders and
  // gate refusals looked like dead links). force re-renders (repair path).
  if (!force) {
    const existing = publicUrl(bookId, "book.pdf");
    try {
      const head = await fetch(existing, { method: "HEAD" });
      if (head.ok) return existing;
    } catch { /* storage blip — fall through to a fresh render */ }
  }

  const spec = { ...buildPdfSpecCore(book), book_id: bookId, image_urls: imageUrlsOf(book) };

  // MUST be the real custom-domain host the request arrived on (passed in
  // by router.mjs), not process.env.VERCEL_URL â€” that always resolves to the
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
  // custom books are exactly 16 pages at L1-4 and 20 at L5-8 â€” anything else
  // is unstitchable and must never reach the customer.
  // 8 story pages (L5-8, or an L1-4 book with the +£1 longer-story add-on)
  // always means the 20-page set; only the 6-story L1-4 booklet is 16.
  const storyPageCount = (book.pages || []).filter((p) => p.type === "story").length;
  const expectedPages = book.level <= 4 && storyPageCount < 8 ? 16 : 20;
  const gotPages = pdfPageCount(pdfBuf);
  if (gotPages !== expectedPages) {
    throw new Error(`page-count gate: rendered PDF has ${gotPages} pages, Level ${book.level} requires exactly ${expectedPages} â€” not delivering`);
  }
  const pdfUrl = await saveImage(bookId, "book.pdf", pdfBuf);

  // A4 print-at-home booklet alongside the A5 (Lynden 2026-08-23: "the pdf
  // is sent with the a5 print straight away pdf and the a4 version"). Never
  // fatal â€” a book with only its A5 still delivers.
  let a4Url = null;
  try {
    const { imposeA4Booklet } = await import("./pdf.mjs");
    const a4Buf = await imposeA4Booklet(pdfBuf);
    a4Url = await saveImage(bookId, "book-a4-booklet.pdf", a4Buf);
  } catch (e) {
    console.warn(`[forge] A4 imposition failed for ${bookId} (A5 still delivered):`, e.message);
  }

  const { sendBookReadyEmail } = await import("./email.mjs");
  const emailResult = await sendBookReadyEmail({
    to: book.email,
    childName: book.child_name,
    title: book.title || `${book.child_name}'s Story`,
    pdfBuf,
    pdfUrl,
    a4Url,
  });
  if (!emailResult.sent) {
    console.warn(`[forge] book-ready email not sent for ${bookId}: ${emailResult.reason}`);
  }

  // GHL hand-off: tag-based, not webhook-based (the Inbound Webhook trigger
  // is a paid premium feature â€” Lynden 2026-08-23). The forge upserts the
  // contact, fills the book custom fields, and re-adds "book-ready"; a
  // standard Contact-Tag-Added workflow in GHL owns everything after that.
  // AWAITED, not fire-and-forget: Vercel freezes the lambda the moment the
  // response returns, so an un-awaited promise here simply never runs (the
  // first live test produced zero GHL calls, 2026-08-23). The try/catch
  // keeps CRM downtime from ever blocking delivery.
  try {
    const { syncBookReadyContact } = await import("./ghl.mjs");
    const r = await syncBookReadyContact({
      email: book.email,
      childName: book.child_name,
      title: book.title || `${book.child_name}'s Story`,
      a5Url: pdfUrl,
      a4Url,
      level: book.level,
      focusSound: book.focus_sound,
    });
    if (r.synced) console.log(`[forge] GHL contact tagged book-ready for ${bookId} (${r.fields} fields${r.missing?.length ? `, missing: ${r.missing.join(", ")}` : ""})`);
    else if (r.reason !== "no_ghl_env") console.warn(`[forge] GHL sync skipped for ${bookId}: ${r.reason}`);
  } catch (e) {
    console.warn(`[forge] GHL sync failed for ${bookId}:`, e.message);
  }

  return pdfUrl;
}
