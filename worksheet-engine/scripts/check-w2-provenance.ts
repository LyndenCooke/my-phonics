// Provenance checker for the W2 workbook selections.
// Run: npx tsx scripts/check-w2-provenance.ts
//
// Verifies, for every level data file:
//   - every hold / listen / ladder sentence appears VERBATIM in its book's
//     shipped story text;
//   - every spell-practise / spelling-list word appears in the book's word
//     lists, the cumulative tricky words, the story text, or the grammar
//     units' own content (chips reuse unit banks/answers);
//   - every grammar unit id and SWYK/revisit pointer resolves.
// The no-invention rule, enforced by machine.

import fs from 'node:fs';
import { w2Levels, getW2Level } from '../src/data/workbook2/registry';
import { getGrammarUnit, getGrammarUnitByCode, getBookletUnits } from '../src/lib/grammarRegistry';

const stories = JSON.parse(fs.readFileSync('output/_research/stories_all.json', 'utf8')) as Record<
  string,
  { title: string; pages: string[]; story_words: string[]; read_words: string[]; writing_words: string[] }
>;
const tricky = JSON.parse(
  fs.readFileSync('C:/Users/ASUS/myphonicsbooks/myphonics_books/data/tricky_words_by_level.json', 'utf8'),
) as Record<string, { cumulative: string[] }>;

// the approved per-sound sources for the single-sound pages: the transcribed
// Sound Pack sheets (Drive/TPT) and the extra-grapheme authoring file
const packManifest = JSON.parse(fs.readFileSync('output/_research/soundpacks/soundpack_manifest.json', 'utf8')) as Record<
  string, { trace_words: string[]; missing: { word: string }[] }
>;
const extraGraphemes = JSON.parse(fs.readFileSync('output/_research/soundpacks/extra_graphemes.json', 'utf8')) as Record<
  string, { trace_words: string[]; missing: { word: string }[] }
>;
function soundSource(g: string): Set<string> | null {
  const src = packManifest[g] ?? (g.startsWith('_') ? null : extraGraphemes[g]);
  if (!src || !src.trace_words) return null;
  return new Set([...src.trace_words, ...src.missing.map((m) => m.word)].map((w) => w.toLowerCase()));
}

// every approved word-bank word (the banks are keyed by the OLD levels; all
// of them are approved selection sources — see L6_SELECTIONS.md remap note)
const bankWords = new Set<string>();
for (let n = 1; n <= 6; n += 1) {
  const bank = JSON.parse(
    fs.readFileSync(`C:/Users/ASUS/myphonicsbooks/myphonics_books/data/word_banks/level_${n}_words.json`, 'utf8'),
  ) as { words: string[] };
  for (const w of bank.words) bankWords.add(w.toLowerCase());
}

let errors = 0;
function fail(msg: string) {
  errors += 1;
  console.log(`  ERROR  ${msg}`);
}

function norm(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

for (const level of w2Levels()) {
  const data = getW2Level(level);
  console.log(`\nLevel ${level}: ${data.books.length} books`);
  const trickySet = new Set((tricky[`level_${level}`]?.cumulative ?? []).map((w) => w.toLowerCase()));
  // grammar unit content pool: chips reuse banks/answers, and a ladder or
  // hold sentence may be a VERBATIM approved unit row
  const unitWords = new Set<string>();
  let unitText = '';
  for (const u of getBookletUnits(level)) {
    const dump = JSON.stringify(u).toLowerCase();
    unitText += ` ${JSON.stringify(u)}`;
    for (const w of dump.match(/[a-z']+/g) ?? []) unitWords.add(w);
  }

  for (const book of data.books) {
    const story = stories[`${level}.${book.num}`];
    if (!story) {
      fail(`${level}.${book.num} has no story dump`);
      continue;
    }
    const text = norm(story.pages.join(' '));
    const textWords = new Set((text.toLowerCase().match(/[a-z']+/g) ?? []));
    const listWords = new Set(
      [...story.story_words, ...story.read_words, ...story.writing_words].map((w) => w.toLowerCase()),
    );

    const checkSentence = (s: string, kind: string) => {
      if (!text.includes(norm(s)) && !unitText.includes(norm(s))) {
        fail(`${story.title} ${kind} not verbatim: "${s}"`);
      }
    };
    const checkWord = (w: string, kind: string) => {
      const lw = w.toLowerCase();
      if (!listWords.has(lw) && !trickySet.has(lw) && !textWords.has(lw) && !unitWords.has(lw) && !bankWords.has(lw)) {
        fail(`${story.title} ${kind} word has no source: "${w}"`);
      }
    };

    for (const sp of book.soundPages ?? []) {
      const ok = soundSource(sp.grapheme);
      if (!ok) {
        fail(`${story.title} sound page "${sp.grapheme}" has no approved sheet or authoring`);
        continue;
      }
      for (const t of sp.trace) {
        if (!ok.has(t.word.toLowerCase())) fail(`${story.title} sound "${sp.grapheme}" trace word not on the approved sheet: "${t.word}"`);
      }
      for (const m of sp.missing) {
        if (!ok.has(m.word.toLowerCase())) fail(`${story.title} sound "${sp.grapheme}" missing word not on the approved sheet: "${m.word}"`);
      }
    }
    for (const s of book.hold) checkSentence(s, 'hold');
    for (const s of book.listen) checkSentence(s, 'listen');
    for (const l of book.ladders) {
      checkSentence(l.sentence, 'ladder');
      checkWord(l.word, 'ladder');
    }
    for (const w of book.spellPractise) checkWord(w, 'practise');
    for (const w of book.useGrammar?.chips ?? []) checkWord(w, 'chip');
    for (const g of book.grammar) {
      if (!getGrammarUnit(g)) fail(`${story.title} unknown grammar unit ${g}`);
    }
    for (const grp of book.revisit ?? []) {
      for (const r of grp.refs) {
        if (!getGrammarUnitByCode(r.sourceUnit)) fail(`${story.title} revisit pointer ${r.sourceUnit} unresolved`);
      }
    }
  }

  for (const grp of [...data.swykA, ...data.swykB.groups]) {
    for (const r of grp.refs) {
      if (!getGrammarUnitByCode(r.sourceUnit)) fail(`L${level} SWYK pointer ${r.sourceUnit} unresolved`);
    }
  }
  for (const s of data.spellings) {
    // spelling lists may draw from any book at the level + tricky words
    const levelWords = new Set<string>();
    for (const b of data.books) {
      const st = stories[`${level}.${b.num}`];
      if (!st) continue;
      for (const w of [...st.story_words, ...st.read_words, ...st.writing_words]) levelWords.add(w.toLowerCase());
      for (const w of norm(st.pages.join(' ')).toLowerCase().match(/[a-z']+/g) ?? []) levelWords.add(w);
    }
    for (const w of s.words) {
      const lw = w.toLowerCase();
      if (!levelWords.has(lw) && !trickySet.has(lw) && !unitWords.has(lw) && !bankWords.has(lw)) {
        fail(`L${level} spelling list "${s.title}" word has no source: "${w}"`);
      }
    }
  }
}

console.log(errors ? `\n${errors} provenance error(s).` : '\nAll selections trace to approved sources.');
process.exit(errors ? 1 : 0);
