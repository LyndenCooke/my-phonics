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

// BORROWED TRICKY WORDS (Lynden 2026-08-24: "if you need one or two tricky
// words from just above, just do that"). The writer may lean on AT MOST TWO
// tricky words from the NEXT level's new list when the story genuinely needs
// them ("was", "my" in a Level 3 book). PAGE TEXT ONLY: the Python typeset
// gate exempts only the level's own tricky words from read_words, story_words
// and the TITLE, so a borrowed word anywhere but the page text kills the PDF.
export function borrowableTricky(level) {
  return (tricky[`level_${level + 1}`]?.new_tricky_words || []).map((w) => String(w).toLowerCase());
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

// A PROVEN STORY TO VARY (Lynden 2026-08-21: "the 33 books i made have great
// stories - make variations of them based on new places/objects and
// characters"). Inventing a plot from nothing is where most of our cost and
// nearly all our story defects came from; the library already contains 33
// plots he wrote and approved. This returns ONE of them at the right level
// to reskin, avoiding titles used recently.
// ANY PATTERN CAN SERVE ANY LEVEL (Lynden 2026-08-21: "even if its a level 1
// book it can follow a level 4 story structure but reimagine it for the right
// text to sound, setting, character and object"). What changes with level is
// the sentence length and vocabulary, not the shape of the story - so the
// picker reads the distilled patterns and honours each one's own honest floor
// (simplest_level) rather than matching source level to target level.
let patternCache = null;
export function sourceStoryFor(newLevel, avoidTitles = []) {
  if (!patternCache) {
    try {
      patternCache = JSON.parse(fs.readFileSync(dataFile("story_patterns.json"), "utf8")).patterns || [];
    } catch {
      patternCache = [];
    }
  }
  if (!patternCache.length) return null;
  const avoid = new Set((avoidTitles || []).map((t) => String(t).toLowerCase()));
  const usable = patternCache.filter((p) => (p.simplest_level || 1) <= Number(newLevel));
  if (!usable.length) return null;
  const fresh = usable.filter((p) => !avoid.has(String(p.title).toLowerCase()));
  const pool = fresh.length ? fresh : usable;
  const p = pool[Math.floor(Math.random() * pool.length)];
  return {
    title: p.title,
    patternName: p.pattern_name,
    spine: p.spine || [],
    device: p.device || "",
    slots: p.slots || [],
    hints: p.reimagine_hints || [],
    sourceLevel: p.source_level,
    pages: p.source_pages || [],
  };
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
  // The bank is not gospel: it is harvested from the curated library, which
  // may lean on the Future Sounds band, so it lists "market" (unstressed e)
  // as a Level 4 'ar' word and "by"/"happy" (word-final y) at Level 2. Any
  // word decodeProblems would reject must never reach the writer's legal-word
  // list or the read_words normaliser — offering it invites the exact story
  // the gate then bounces ("market" killed a finished book at typeset time,
  // 2026-08-22; "by" shipped in a Level 3 story, 2026-08-24).
  return greenWordsCache
    .filter((w) => w.level <= level)
    .map((w) => w.word)
    .filter((w) => !decodeProblems([w], level).length);
}

// DETERMINISTIC DECODABILITY (Lynden 2026-08-21: the LLM phonics gate cost
// real money to answer a question arithmetic can answer). Mirrors
// v2_helpers.decode_problem on the Python side, which is the gate that fails
// the PDF build - keeping both in step means the machine catches upstream
// what the renderer would refuse downstream.
const DOUBLED = new Set(["bb", "cc", "dd", "ff", "gg", "ll", "mm", "nn", "pp", "rr", "ss", "tt", "zz"]);
const DISHONEST = {
  listen: "silent t", listened: "silent t", castle: "silent t", whistle: "silent t",
  fasten: "silent t", answer: "silent w", was: "the a after w says /o/",
  wash: "the a after w says /o/", want: "the a after w says /o/", wanted: "the a after w says /o/",
  wants: "the a after w says /o/", wanting: "the a after w says /o/",
  watch: "the a after w says /o/", water: "the a after w says /o/",
  basket: "unstressed e", pocket: "unstressed e", rocket: "unstressed e", carpet: "unstressed e",
  target: "unstressed e", pocketed: "unstressed e",
  market: "unstressed e", tomato: "unstressed vowels", potato: "unstressed o", banana: "unstressed a",
  animal: "unstressed a", family: "unstressed i", biscuit: "ui says /i/", asked: "said askt",
  // uy says /igh/ — greedy matching read b-u-y-s as four honest letters and
  // "buys" sailed through at Level 3 (2026-08-24). Tricky from Level 4, so
  // these entries only bite below it and in titles/read_words.
  buy: "uy says /igh/", buys: "uy says /igh/", buying: "uy says /igh/",
};
const PEOPLE = new Set(["mum", "mummy", "dad", "daddy", "nan", "nana", "nani", "gran", "grandma", "grandad", "auntie", "uncle"]);

export function decodeProblems(words, level, { heroName = "", allowPeople = true, borrow = [] } = {}) {
  const lv = getLevel(level);
  if (!lv) return [];
  // `borrow` extends the tricky exemption for PAGE-TEXT checks only (see
  // borrowableTricky); callers checking the title or read_words pass none.
  const tricky = new Set([...lv.trickyWords, ...borrow].map((w) => String(w).toLowerCase()));
  const graphemes = [...new Set(lv.cumulative)].filter((g) => !g.includes("-")).sort((a, b) => b.length - a.length);
  // Multi-letter graphemes from HIGHER levels. A future digraph whose letters
  // are individually taught sails through greedy matching as singles — that is
  // how "window" (ow, L4) shipped in a Level 3 customer book and forced a full
  // editorial revision (Lynden 2026-08-24). A custom book's child-facing text
  // must not lean on the Future Sounds band the way the curated library may.
  const taughtSet = new Set(graphemes);
  const futureUnits = [];
  for (const l of allLevels()) {
    if (l.level <= level) continue;
    for (const g of l.graphemes || []) {
      if (g.length > 1 && !g.includes("-") && !taughtSet.has(g)) futureUnits.push({ g, level: l.level });
    }
  }
  const out = [];
  for (const raw of words || []) {
    const w = String(raw || "").toLowerCase().replace(/[^a-z']/g, "");
    if (!w || tricky.has(w) || w === String(heroName).toLowerCase()) continue;
    if (!allowPeople && PEOPLE.has(w)) { out.push(`"${raw}" is a person, not a word to practise`); continue; }
    if (PEOPLE.has(w)) continue;
    if (DISHONEST[w]) { out.push(`"${raw}" is not honestly decodable: ${DISHONEST[w]}`); continue; }
    // The -ed SUFFIX below Level 4: "opened"/"checked" decode letter-by-letter
    // (every single is taught) but the ending says /d/ or /t/ or unstressed
    // /id/ — a taught exception only from L4 (found by external review,
    // 2026-08-25). Honest e+d words (bed, red, shed, sled) keep their short e.
    if (level < 4 && /ed$/.test(w) && !/^[bcdfghjklmnpqrstvwz]{1,3}ed$/.test(w)) {
      out.push(`"${raw}" — the -ed ending is not taught until Level 4`);
      continue;
    }
    // The all-family (call, small, wall, falls…) says /or/, not short a —
    // same dishonesty class as the want family (Lynden 2026-08-24: "treat
    // like want family"). "all" itself is a Level 4 tricky word, exempted
    // above at L4+. "shall" keeps its honest short a. The suffix tail keeps
    // gallop/ballot honest — their a really does say /a/.
    if (/^[a-z]*all(s|es|ed|en|er|est|ing)?$/.test(w) && w !== "shall") {
      out.push(`"${raw}" is not honestly decodable: the a before ll says /or/`);
      continue;
    }
    for (const pair of ["kn", "wr", "mb", "gn", "tch", "dge"]) {
      if (w.includes(pair) && !graphemes.includes(pair)) { out.push(`"${raw}" contains "${pair}", not taught at Level ${level}`); break; }
    }
    let rest = w, guard = 30, bad = null;
    const units = [];
    const spans = []; // [start, end) of each consumed unit, for the future-digraph check
    let pos = 0;
    while (rest && guard--) {
      const hit = graphemes.find((g) => rest.startsWith(g));
      if (hit) { units.push(hit); spans.push([pos, pos + hit.length]); pos += hit.length; rest = rest.slice(hit.length); continue; }
      const dbl = rest.slice(0, 2);
      if (DOUBLED.has(dbl)) { units.push(dbl); spans.push([pos, pos + 2]); pos += 2; rest = rest.slice(2); continue; }
      // -ed is a deliberately TAUGHT exception from Level 4 (the prep page
      // teaches its three pronunciations). Below L4 the blanket strip let
      // "opened"/"checked" sail through a Level 3 story (found by external
      // review, 2026-08-25) — so the strip is now level-gated.
      if (level >= 4 && rest.length > 2 && rest.endsWith("ed")) { rest = rest.slice(0, -2); continue; }
      bad = rest[0]; break;
    }
    if (bad) { out.push(`"${raw}" uses "${bad}", not taught at Level ${level}`); continue; }
    // MAGIC-E: greedy letter matching read "takes" as t-a-k-e-s and "side" as
    // s-i-d-e — five honest singles — when the a_e/i_e split digraph is the
    // real code, taught at Level 5 (found by external review, 2026-08-25).
    // Detect single-vowel + single-consonant + final-e (optionally +s) in the
    // consumed units and require the split digraph to be taught.
    {
      let u = [...units];
      if (u.length >= 4 && u[u.length - 1] === "s") u = u.slice(0, -1);
      const n = u.length;
      if (
        n >= 3 && u[n - 1] === "e" &&
        u[n - 2].length === 1 && !"aeiou".includes(u[n - 2]) &&
        u[n - 3].length === 1 && "aiou".includes(u[n - 3])
      ) {
        const split = `${u[n - 3]}-e`;
        if (!lv.cumulative.includes(split)) {
          out.push(`"${raw}" uses the split digraph "${split}" (magic e), not taught at Level ${level}`);
          continue;
        }
      }
    }
    // Word-final y never says /y/ — it says /ee/ (happy) or /igh/ (by, my),
    // sounds taught at Level 6. Greedy matching consumed it as the L2
    // consonant, which is how "by" shipped in a Level 3 story (2026-08-24).
    if (level < 6 && w.length > 1 && units[units.length - 1] === "y") {
      out.push(`"${raw}" ends in "y", which says /ee/ or /igh/ there — not taught until Level 6`);
      continue;
    }
    // A future multi-letter grapheme counts as a violation when its letters
    // were consumed as SEPARATE units (o+w in "window") — but not when it
    // merely sits inside one longer taught unit ("ai" inside L4's "air").
    {
      let flagged = false;
      for (const { g, level: gl } of futureUnits) {
        let i = w.indexOf(g);
        while (i !== -1 && !flagged) {
          const inOneUnit = spans.some(([s, e]) => i >= s && i + g.length <= e && (e - s) >= g.length && units[spans.findIndex(([ss, ee]) => ss === s && ee === e)].length > 1);
          if (!inOneUnit) {
            out.push(`"${raw}" contains "${g}", a Level ${gl} sound not taught at Level ${level}`);
            flagged = true;
          }
          i = w.indexOf(g, i + 1);
        }
        if (flagged) break;
      }
      if (flagged) continue;
    }
    // Word-final -se/-ve = ONE grapheme unit (Lynden 2026-07-12, mirrored
    // from v2_helpers.split_into_phonemes): the final e is silent spelling
    // convention, not a phoneme. Merge only when the unit before s/v is a
    // multi-char grapheme (ur, ou, ee...) or a consonant — a LONE vowel
    // there means magic-e (wave, five), which keeps its V-C-e treatment.
    // The renderer refuses any such merged unit its level has not taught
    // ("purse" killed a finished L6 book's PDF at typeset, 2026-08-23).
    if (
      units.length >= 3 && units[units.length - 1] === "e" &&
      (units[units.length - 2] === "s" || units[units.length - 2] === "v") &&
      (units[units.length - 3].length >= 2 || !"aeiou".includes(units[units.length - 3]))
    ) {
      const unit = units[units.length - 2] + "e";
      if (!graphemes.includes(unit)) out.push(`"${raw}" ends in "${unit}" (one unit, silent e), not taught at Level ${level}`);
    }
  }
  return [...new Set(out)];
}
