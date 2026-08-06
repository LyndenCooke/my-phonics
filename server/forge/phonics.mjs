// Level data for the custom-book pipeline, read straight from the canonical
// phonics JSON in myphonics_books/data (the same source the book pipeline uses).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BOOKS_DIR } from "./env.mjs";

const graphemes = JSON.parse(
  fs.readFileSync(path.join(BOOKS_DIR, "data", "graphemes_by_level.json"), "utf8"),
);
const tricky = JSON.parse(
  fs.readFileSync(path.join(BOOKS_DIR, "data", "tricky_words_by_level.json"), "utf8"),
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
        fs.readFileSync(path.join(BOOKS_DIR, "data", "reading_progression.json"), "utf8"),
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
        fs.readFileSync(path.join(BOOKS_DIR, "data", "pronunciations.json"), "utf8"),
      );
    } catch {
      pronCache = {};
    }
  }
  const entry = pronCache[String(grapheme || "").toLowerCase()];
  if (!entry) return [];
  return entry.sounds.filter((s) => s.from_level <= level);
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
