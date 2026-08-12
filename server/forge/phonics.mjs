// Level data for the custom-book pipeline, read straight from the canonical
// phonics JSON in myphonics_books/data (the same source the book pipeline uses).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BOOKS_DIR } from "./env.mjs";

// Every data read resolves through here: the live curriculum file first, the
// vendored copy in assets/data second. The vendored copies are refreshed by
// scripts/sync-forge-data.mjs on every build (npm prebuild), because the
// serverless bundle cannot see myphonics_books/ at all — its includeFiles
// glob never delivered them and the lambda ENOENT'd at cold start.
const VENDORED = path.join(path.dirname(fileURLToPath(import.meta.url)), "assets", "data");
function dataFile(name) {
  const live = path.join(BOOKS_DIR, "data", name);
  return fs.existsSync(live) ? live : path.join(VENDORED, name);
}

const graphemes = JSON.parse(
  fs.readFileSync(dataFile("graphemes_by_level.json"), "utf8"),
);
const tricky = JSON.parse(
  fs.readFileSync(dataFile("tricky_words_by_level.json"), "utf8"),
);

export function getLevel(level) {
  const g = graphemes[`level_${level}`];
  const t = tricky[`level_${level}`];
  if (!g || !t) return null;
  return {
    level,
    name: g.name,
    colour: g.colour,
    graphemes: g.graphemes,
    cumulative: g.cumulative_graphemes,
    trickyWords: t.cumulative,
    storyPages: g.story_pages ?? 8,
    fontSize: g.font_size ?? 24,
  };
}

export function allLevels() {
  return [1, 2, 3, 4, 5, 6, 7, 8].map(getLevel).filter(Boolean);
}

// Reading/writing progression per level — how much text, which punctuation,
// which sentence forms and devices. One spec, read by BOTH the story writer
// and the text QA gate so they cannot disagree.
let progressionCache = null;
export function progressionFor(level) {
  if (!progressionCache) {
    try {
      progressionCache = JSON.parse(
        fs.readFileSync(dataFile("reading_progression.json"), "utf8"),
      ).levels;
    } catch {
      progressionCache = {};
    }
  }
  return progressionCache[String(level)] || null;
}

// Everything allowed AT or BELOW this level (punctuation and sentence forms
// are cumulative — a Level 7 book may still use a full stop).
export function progressionUpTo(level) {
  const here = progressionFor(level);
  if (!here) return null;
  const punctuation = new Set();
  const forms = new Set();
  for (let l = 1; l <= level; l++) {
    const p = progressionFor(l);
    if (!p) continue;
    p.punctuation.forEach((x) => punctuation.add(x));
    p.sentence_forms.forEach((x) => forms.add(x));
  }
  return { ...here, punctuation: [...punctuation], sentence_forms: [...forms] };
}

// A grapheme with more than one taught pronunciation must be taught with BOTH
// (Lynden 2026-07-26: "u-e should always be explained as some words are /oo/
// and some are /yoo/"). Returns a ready-made "Watch Out" note for the Story
// Words page, or null when the grapheme only says one thing at this level.
let pronCache = null;
export function pronunciationsFor(grapheme, level) {
  if (!pronCache) {
    try {
      pronCache = JSON.parse(
        fs.readFileSync(dataFile("pronunciations.json"), "utf8"),
      );
    } catch {
      pronCache = {};
    }
  }
  const entry = pronCache[String(grapheme || "").toLowerCase()];
  if (!entry) return [];
  return entry.sounds.filter((s) => s.from_level <= level);
}

// Words used to teach the focus grapheme must use a SOUND actually taught by
// this level, not just a taught SPELLING. Built after a Level 4 "oo" book
// used "moon" (long /oo/, taught from Level 4 — correct) alongside "book" and
// "look" (short /oo/, not taught until Level 5 — above-level) as if they were
// interchangeable focus-word examples, because decodability QA only checked
// that "oo" is a taught grapheme, never which of its sounds a specific word
// uses (Lynden 2026-08-11: "two versions of /oo/ was used... which one should
// it be?"). This is deterministic, not a model judgement: pronunciations.json
// already lists each sound's curated example words and the level it unlocks,
// so a word appearing in an ABOVE-level sound's example list is unambiguous —
// no segmentation call needed, same doctrine as capitals/punctuation in
// prose.mjs (SKILL.md §13: use code for facts a model does not need to guess).
export function focusSoundViolations({ story, focusSound, level }) {
  if (!pronCache) {
    try {
      pronCache = JSON.parse(fs.readFileSync(dataFile("pronunciations.json"), "utf8"));
    } catch {
      pronCache = {};
    }
  }
  const entry = pronCache[String(focusSound || "").toLowerCase()];
  if (!entry || entry.sounds.length < 2) return [];
  const aboveLevel = entry.sounds.filter((s) => s.from_level > level);
  if (!aboveLevel.length) return [];

  const violations = [];
  const seen = new Set();
  for (const sound of aboveLevel) {
    for (const example of sound.examples || []) {
      const word = String(example).toLowerCase();
      const re = new RegExp(`\\b${word}\\b`, "i");
      (story.pages || []).forEach((p, i) => {
        const inText = re.test(p.text || "");
        const inScene = re.test(p.scene || "");
        if (!inText && !inScene) return;
        const key = `${word}:${i + 1}`;
        if (seen.has(key)) return;
        seen.add(key);
        violations.push({
          word: example,
          page: i + 1,
          reason: `"${example}" uses "${focusSound}" saying ${sound.sound}, not taught until Level ${sound.from_level} — this Level ${level} book can only use the sound(s) already unlocked for "${focusSound}".`,
        });
      });
    }
  }
  return violations;
}

// A book must use AT LEAST 3 distinct focus-sound word forms — not "1 to 3"
// (that phrasing in the story-writer prompt let the model land on a single
// word, "soon", for a whole "oo" book). Deterministic: focus_word_examples is
// exactly the field the story schema asks the writer to fill with these
// words, so counting its distinct entries needs no model judgement (Lynden
// 2026-08-11: "there is only one story word... should be at least 3").
export function focusSoundCountViolation({ story, focusSound }) {
  const words = [...new Set((story.focus_word_examples || []).map((w) => String(w).toLowerCase().trim()).filter(Boolean))];
  if (words.length >= 3) return null;
  return {
    word: focusSound || "(focus sound)",
    page: 0,
    reason: `Only ${words.length} distinct focus-sound word form(s) used (${JSON.stringify(words)}) — this book must use AT LEAST 3 distinct focus-sound words, not one or two.`,
  };
}

// Real published MPB books as story exemplars (Lynden 2026-08-12: "use the
// 33 core MPB for support with stories"). The library's stories are
// structurally easier on the illustrator BY DESIGN — they tend to move
// through settings page to page with little accumulating object state,
// where the forge's invented plots kept hinging on one object mutating in
// one location (the dot card, the pad on the rock). These exemplars teach
// the writer that rhythm by example, not just by rule.
//
// The digest carries the ORIGINAL 6-level ids; the forge runs the 8-level
// system. Mapping per the 2026-06-08 realignment: old L1 split into new
// L1-L3; old L2..L6 shifted to new L4..L8.
let coreStoriesCache = null;
export function coreStoriesFor(newLevel, count = 3) {
  if (!coreStoriesCache) {
    try {
      coreStoriesCache = JSON.parse(fs.readFileSync(dataFile("core_story_digest.json"), "utf8")).books || [];
    } catch {
      coreStoriesCache = [];
    }
  }
  const oldLevel = newLevel <= 3 ? 1 : newLevel - 2;
  const atLevel = coreStoriesCache.filter((b) => b.level === oldLevel);
  // Spread picks across the level rather than always the same first books.
  const picked = [];
  const step = Math.max(1, Math.floor(atLevel.length / count));
  for (let i = 0; i < atLevel.length && picked.length < count; i += step) picked.push(atLevel[i]);
  return picked.map((b) => ({ title: b.title, pages: b.pages }));
}

export function pronunciationNoteFor(grapheme, level) {
  const sounds = pronunciationsFor(grapheme, level);
  if (sounds.length < 2) return null;
  const list = sounds.map((s) => s.sound).join(" and ");
  return {
    title: `Watch Out — "${grapheme}" says ${list}`,
    body:
      `The same spelling "${grapheme}" does not always say the same sound. ` +
      sounds
        .map((s) => `In ${s.examples.slice(0, 2).join(" and ")} it says ${s.sound}.`)
        .join(" ") +
      " Try both sounds and listen for the one that makes a word you know.",
    examples: sounds.flatMap((s) => s.examples.slice(0, 3).map((w) => `${w} → ${s.sound}`)),
  };
}

// Cumulative green-word bank: every decodable word from this level and all
// levels before it (the child's full unlocked vocabulary).
let greenWordsCache = null;
export function greenWordsUpTo(level) {
  if (!greenWordsCache) {
    // The ledger build artefact is preferred (regenerating the ledger takes
    // effect immediately), but it lives under gitignored output/ and so does
    // not exist in a deployment — the vendored copy in assets/ covers prod.
    // No silent empty fallback: a story written with ZERO green words is
    // garbage that still LOOKS like a book, which is worse than an error.
    const candidates = [
      path.join(BOOKS_DIR, "output", "worksheet_plan", "green_words.json"),
      path.join(path.dirname(fileURLToPath(import.meta.url)), "assets", "green_words.json"),
    ];
    for (const p of candidates) {
      try {
        greenWordsCache = JSON.parse(fs.readFileSync(p, "utf8")).words;
        break;
      } catch { /* try next */ }
    }
    if (!greenWordsCache?.length) throw new Error("green_words.json missing — cannot write a decodable story without the word bank");
  }
  return greenWordsCache.filter((w) => w.level <= level).map((w) => w.word);
}
