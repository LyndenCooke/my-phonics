// INTERACTIVE EDITION OF A CUSTOM BOOK.
//
// Every forge book already carries what the library's InteractiveBookReader
// needs — page text, the six Story Words, the tricky words the writer leaned
// on, four alien words, the finished scene paintings — so the interactive
// book (tappable words, phoneme breakdowns, sound grid, ordering game,
// certificate) is DERIVED from the finished row rather than generated. No
// LLM call, no cost, no storage: `publicBook()` builds it on every read, so
// every book ever made (and every repair) has an interactive edition the
// moment it is ready, in lock-step with the PDF.
//
// The page shapes mirror src/lib/interactiveBookData.ts (InteractivePage).
// Keep the two in step: a page type the reader does not know renders blank.
import { allLevels, getLevel } from "./phonics.mjs";

const DOUBLED = new Set(["bb", "cc", "dd", "ff", "gg", "ll", "mm", "nn", "pp", "rr", "ss", "tt", "zz"]);

// Every grapheme the whole ladder teaches, longest first. Segmenting against
// the FULL ladder (not just the book's level) keeps the odd Future-Sound word
// honest: "window" in a Level 3 book still breaks as w-i-n-d-ow, which is the
// breakdown the child will eventually learn, rather than five singles.
let unitsCache = null;
function allUnits() {
  if (!unitsCache) {
    const set = new Set();
    for (const l of allLevels()) for (const g of l.cumulative || []) if (!g.includes("-")) set.add(g);
    unitsCache = [...set].sort((a, b) => b.length - a.length);
  }
  return unitsCache;
}

/** Break a word into the grapheme chunks the reader plays and annotates
 *  (e.g. "brown" → ["b","r","ow","n"], "came" → ["c","a-e","m"]). */
export function segmentWord(word) {
  const w = String(word || "").toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return [];
  const units = [];
  let rest = w, guard = 40;
  while (rest && guard--) {
    const hit = allUnits().find((g) => rest.startsWith(g));
    if (hit && hit.length > 1) { units.push(hit); rest = rest.slice(hit.length); continue; }
    // A doubled consonant is ONE sound (hopping → h-o-pp-i-ng), the same as
    // the reader's own splitDigraphs — checked before the single letter wins.
    const dbl = rest.slice(0, 2);
    if (DOUBLED.has(dbl)) { units.push(dbl); rest = rest.slice(2); continue; }
    units.push(rest[0]);
    rest = rest.slice(1);
  }
  // Magic-e: vowel + single consonant + final e (optionally + s) → the split
  // digraph sits where the vowel is and the silent e disappears, exactly how
  // the curated library writes it (['c','a-e','m'] for "came").
  const tail = units[units.length - 1] === "s" && units.length >= 4 ? 1 : 0;
  const n = units.length - tail;
  if (
    n >= 3 && units[n - 1] === "e" &&
    units[n - 2].length === 1 && !"aeiou".includes(units[n - 2]) &&
    units[n - 3].length === 1 && "aeiou".includes(units[n - 3])
  ) {
    const out = units.slice(0, n - 3).concat([`${units[n - 3]}-e`, units[n - 2]]);
    return tail ? out.concat(units.slice(n)) : out;
  }
  // Word-final -se / -ve after a consonant or a long vowel unit is one silent
  // -e spelling unit (purse → p-ur-se), mirroring v2_helpers and the L4 data.
  if (
    units.length >= 3 && units[units.length - 1] === "e" &&
    (units[units.length - 2] === "s" || units[units.length - 2] === "v") &&
    (units[units.length - 3].length >= 2 || !"aeiou".includes(units[units.length - 3]))
  ) {
    return units.slice(0, -2).concat([units[units.length - 2] + "e"]);
  }
  return units;
}

const clean = (s) => String(s || "").toLowerCase().replace(/[^a-z']/g, "");

/** A tappable word: tricky words (and the hero's name) are learnt by sight —
 *  the reader shows them without a breakdown; everything else sounds out. */
function makeWord(display, trickySet, heroName) {
  const word = clean(display);
  if (!word) return null;
  if (trickySet.has(word) || word === clean(heroName)) {
    return { display, word, phonemes: [], isTricky: true };
  }
  return { display, word, phonemes: segmentWord(word) };
}

function splitSentences(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+(?=[^a-z])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Build the InteractivePage[] for a finished custom-book row. Returns null
 * when the row has no usable story yet (still generating, failed, legacy).
 */
export function buildInteractivePages(row) {
  const story = row?.story?.story;
  const pages = Array.isArray(row?.pages) ? row.pages : [];
  const level = getLevel(Number(row?.level));
  if (!story?.pages?.length || !level) return null;

  const hero = row.child_name || "";
  const focus = String(row.focus_sound || "");
  const trickySet = new Set([
    ...(level.trickyWords || []),
    ...(story.tricky_words_used || []),
  ].map(clean));

  const storyRows = pages.filter((p) => p?.type === "story");
  const coverRow = pages.find((p) => p?.type === "cover");

  const storyPages = story.pages.map((p, i) => {
    const text = String(p?.text || "");
    const words = text.split(/\s+/).map((t) => makeWord(t, trickySet, hero)).filter(Boolean);
    return {
      type: "story",
      sentences: splitSentences(text),
      words,
      imageUrl: storyRows[i]?.imageUrl || "",
    };
  });

  // Six Story Words from the writer, topped up with the focus-word examples,
  // never the hero's name or a tricky word, six to nine in all.
  const seen = new Set();
  const practice = [];
  for (const w of [...(story.read_words || []), ...(story.focus_word_examples || [])]) {
    const c = clean(w);
    if (!c || seen.has(c) || trickySet.has(c) || c === clean(hero)) continue;
    seen.add(c);
    practice.push({ display: c, word: c, phonemes: segmentWord(c) });
    if (practice.length >= 9) break;
  }
  const withFocus = practice.filter((w) => w.word.includes(focus.replace("-", "")));
  const readingWords = (withFocus.length >= 2 ? withFocus.concat(practice.filter((w) => !withFocus.includes(w))) : practice).slice(0, 6);

  // Tricky words: the hero's name first (it is the one word every reader of
  // THIS book must learn by sight), then the tricky words the story used.
  const trickyWords = [];
  if (hero) trickyWords.push({ display: hero, word: clean(hero), phonemes: [], isTricky: true });
  for (const t of story.tricky_words_used || []) {
    const c = clean(t);
    if (c && !trickyWords.some((x) => x.word === c)) trickyWords.push({ display: c, word: c, phonemes: [], isTricky: true });
  }

  const alien = (story.alien_words || [])
    .map((w) => clean(w))
    .filter(Boolean)
    .map((w) => ({ display: w, word: w, phonemes: segmentWord(w) }));

  const ordering = storyPages
    .filter((p) => p.imageUrl)
    .slice(0, 6)
    .map((p, i) => ({ imageUrl: p.imageUrl, label: p.sentences[0] || "", correctIndex: i }));

  // Quiz the book can mark itself: "which word has the sound?" from the
  // Story Words (the writer's three grown-up questions are open-ended and
  // stay on the PDF's back page), then "which picture shows this sentence?"
  // from the finished scenes.
  const nonFocus = practice.filter((w) => !withFocus.includes(w));
  const soundQuestions = withFocus.slice(0, 2).map((w, i) => {
    const wrong = nonFocus.slice(i * 2, i * 2 + 2);
    if (wrong.length < 2) return null;
    const options = [{ label: w.word, isCorrect: true }, ...wrong.map((o) => ({ label: o.word, isCorrect: false }))];
    const shift = (i + 1) % options.length;
    return { question: `Which word has the sound "${focus}"?`, options: options.slice(shift).concat(options.slice(0, shift)) };
  }).filter(Boolean);
  const pictureQuestions = storyPages
    .filter((p) => p.imageUrl)
    .slice(0, 2)
    .map((p, i, arr) => {
      const pool = storyPages.filter((o) => o.imageUrl && o !== p).slice(0, 2);
      if (pool.length < 2) return null;
      const options = [{ imageUrl: p.imageUrl, label: "", isCorrect: true }, ...pool.map((o) => ({ imageUrl: o.imageUrl, label: "", isCorrect: false }))];
      // Rotate so the right answer is not always the first tile (deterministic:
      // the same book asks the same quiz every time it is opened).
      const shift = (i + arr.length) % options.length;
      return { question: `Which picture shows: "${p.sentences[0] || ""}"`, options: options.slice(shift).concat(options.slice(0, shift)) };
    })
    .filter(Boolean);
  const quizQuestions = [...soundQuestions, ...pictureQuestions];

  const out = [
    {
      type: "cover",
      title: story.title || row.title || "My Book",
      subtitle: `A book made for ${hero} · Level ${level.level} · Sound "${focus}"`,
      imageUrl: coverRow?.imageUrl || "",
    },
    { type: "sound_grid", focusSounds: [focus], allSounds: [...(level.cumulative || [])] },
    ...(practice.length ? [{ type: "vocab_preview", words: practice }] : []),
    ...(trickyWords.length ? [{ type: "tricky_words", words: trickyWords }] : []),
    ...storyPages,
    ...(readingWords.length ? [{ type: "word_reading", words: readingWords }] : []),
    ...(alien.length ? [{ type: "nonsense_words", words: alien }] : []),
    ...(quizQuestions.length >= 2 ? [{ type: "quiz", questions: quizQuestions }] : []),
    { type: "writing_practice", letters: [...new Set([focus, ...readingWords.map((w) => w.phonemes[0]).filter(Boolean)])].slice(0, 4) },
    ...(ordering.length >= 3 ? [{ type: "story_ordering", items: ordering }] : []),
    { type: "drawing", prompt: `Draw ${hero}'s favourite part` },
    { type: "certificate", bookTitle: story.title || row.title || "My Book" },
  ];
  return out;
}
