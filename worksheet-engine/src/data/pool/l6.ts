import type { PoolObject } from '@/data/pool/schema';

// ---------------------------------------------------------------------------
// L6 WORKBOOK POOL — Building Fluency (Indigo, getLevelTheme(6)).
// Authored from WORKBOOK_PLAN_L6.md v2 + TEACHER_SEQUENCE_L6.md v2.
//
// Content provenance (the absolute rules):
//   - Grammar pages reference the approved units in src/data/grammar/l6.ts by
//     id and reuse them VERBATIM. Art slot assignments come from the workbook
//     plan (the pool object owns them, not the unit).
//   - Every selected word and sentence carries a `source` pointer. The full
//     selection record (awaiting Lynden's approval) is
//     docs/workbook_plans/L6_SELECTIONS.md.
//   - Authoring dependencies (SW2 question sets, big-write weak/strong pairs,
//     spelling-test word lists) are flagged placeholders — see
//     docs/workbook_plans/L6_DEPENDENCIES.md. No invented content, ever.
//
// Book text pointers use the shipped book page numbers, e.g. "Book L6.1 p6" =
// story page 6 of The Purple Purse (data/purple_purse_story_l4_1_book1.py via
// NEW_TO_OLD, rendered in output/books/Level6/6_1 The Purple Purse.pdf).
// "Word bank (old L6)" = data/word_banks/level_6_words.json — the bank that
// carries the ur/er/are/ew/ue alternatives. "Tricky L{n}" = the cumulative
// tricky list in data/tricky_words_by_level.json.
// ---------------------------------------------------------------------------

/** Book titles in teaching order — the contents page's "Book → pages" lines. */
export const L6_BOOKS: Record<number, string> = {
  1: 'The Purple Purse',
  2: 'The Brown Owl',
  3: 'The New Glue',
  4: 'The Cheeky Monkey',
};

const WB = { A: 'wb', B: 'wb' } as const;
const BOOK = { A: 'book', B: 'wb' } as const;

export const L6_POOL: PoolObject[] = [
  // ===========================================================================
  // B1 — The Purple Purse (ur er) · 7 days
  // ===========================================================================
  {
    id: 'L6.B1.SP1', strand: 'SP', book: 1, slot: 'W1-D1 RD', editions: WB,
    template: 'T8', title: 'Look Cover Write Check',
    content: {
      kind: 'T8',
      example: { word: 'nurse', source: 'Book L6.1 writing_words · word bank (old L6)' },
      rows: [
        { word: 'purple', source: 'Book L6.1 writing_words · word bank (old L6)' },
        { word: 'purse', source: 'Book L6.1 writing_words · word bank (old L6)' },
        { word: 'church', source: 'Book L6.1 writing_words · word bank (old L6)' },
        { word: 'fern', source: 'Book L6.1 writing_words · word bank (old L6)' },
        { word: 'never', source: 'Book L6.1 writing_words · word bank (old L6)' },
      ],
    },
    art: [{ key: 'cat', placement: 'perch', sizeMm: 14 }],
  },
  {
    id: 'L6.B1.GR1', strand: 'GR', book: 1, slot: 'W1-D2 RD', editions: WB,
    template: 'T2', title: 'Apostrophes for contractions',
    content: { kind: 'T2', unitId: 'g-l6-6', watchArt: ['purse'] },
    art: [
      { key: 'purse', placement: 'grounded-box', sizeMm: 18 },
      { key: 'cat', placement: 'perch', sizeMm: 16 },
    ],
  },
  {
    id: 'L6.B1.SW1', strand: 'SW', book: 1, slot: 'W1-D3 RD', editions: BOOK,
    template: 'T4', title: 'Hold the sentence',
    content: {
      kind: 'T4', variant: 'hold', linesPerItem: 1,
      sentences: [
        { text: 'I turned my pockets inside out, but it was not there.', source: 'Book L6.1 p1, verbatim' },
        { text: 'Then a market lady held up a purple purse!', source: 'Book L6.1 p6, verbatim' },
        { text: 'Dad and I walked home in the warm afternoon.', source: 'Book L6.1 p8, verbatim' },
      ],
    },
    art: [{ key: 'hero_purse_action', placement: 'grounded-foot', sizeMm: 18 }],
  },
  {
    id: 'L6.B1.DI1', strand: 'DI', book: 1, slot: 'W1-D4 RD', editions: WB,
    template: 'T9', title: 'Listen and write',
    content: {
      kind: 'T9', slots: 3,
      sentences: [
        { text: 'Dad came with me to search.', source: 'Book L6.1 p2, verbatim' },
        { text: 'We walked up and down the street.', source: 'Book L6.1 p2, verbatim' },
        { text: 'I held the purse close to my chest.', source: 'Book L6.1 p8, verbatim' },
      ],
    },
  },
  {
    id: 'L6.B1.SW2', strand: 'SW', book: 1, slot: 'W1-D5 WO', editions: WB,
    template: 'T4', title: 'Answer it in a sentence',
    content: {
      kind: 'T4', variant: 'answer', linesPerItem: 2, placeholderSlots: 3,
      dependencyNote: 'Comprehension question set for The Purple Purse — author from the book text, decodability-checked (master plan §6.1).',
    },
    art: [{ key: 'purse', placement: 'perch', sizeMm: 16 }],
  },
  {
    id: 'L6.B1.HW1', strand: 'HW', book: 1, slot: 'HW-SLOT W1', editions: BOOK,
    template: 'T1', title: 'First joins',
    content: {
      kind: 'T1', pendingFont: true,
      sets: [
        { model: 'ur ur ur', source: 'L6 GPC (ledger) — diagonal join family' },
        { model: 'er er er', source: 'L6 GPC (ledger) — diagonal join family' },
        { model: 'turn turn', source: 'word bank (old L6)' },
        { model: 'her her', source: 'Tricky L4 (cumulative)' },
      ],
    },
    art: [{ key: 'cat', placement: 'perch', sizeMm: 14 }],
  },
  {
    id: 'L6.B1.SP2', strand: 'SP', book: 1, slot: 'W2-D1 RD (warm-up D6)', editions: WB,
    template: 'T8', title: 'Look Cover Write Check',
    content: {
      kind: 'T8',
      example: { word: 'said', source: 'Tricky L5 (revision)' },
      rows: [
        { word: 'their', source: 'Tricky L6 (new, B1 set)' },
        { word: 'oh', source: 'Tricky L6 (new, B1 set)' },
        { word: 'were', source: 'Tricky L5 (revision)' },
        { word: 'there', source: 'Tricky L5 (revision)' },
        { word: 'when', source: 'Tricky L5 (revision)' },
      ],
    },
    art: [{ key: 'purse', placement: 'perch', sizeMm: 14 }],
  },
  {
    id: 'L6.B1.GR2', strand: 'GR', book: 1, slot: 'W2-D2 RD (D6)', editions: WB,
    template: 'T2', title: 'Keep the tense the same',
    content: { kind: 'T2', unitId: 'g-l6-7', watchArt: ['card'] },
    art: [
      { key: 'cat', placement: 'grounded-foot', sizeMm: 16 },
      { key: 'card', placement: 'grounded-box', sizeMm: 14 },
    ],
  },
  {
    id: 'L6.B1.ST1', strand: 'ST', book: 1, slot: 'W2-D4 WO (D7)', editions: WB,
    template: 'T10', title: 'Spelling test',
    content: {
      kind: 'T10', lines: 10, variant: 'book',
      dependencyNote: 'Spelling test word list for The Purple Purse — select 10 from the book focus sounds + L6 tricky words; publish in TEACHER_SEQUENCE_L6.md (master plan §6.4).',
    },
  },
  {
    id: 'L6.B1.BW1', strand: 'BW', book: 1, slot: 'W2-D5 WO (D7)', editions: WB,
    template: 'T5', title: 'Big write',
    content: {
      kind: 'T5',
      prompt: 'Make this moment from the book better, then write what happens next.',
      planBoxMm: 40, lines: 9, pairPlaceholder: true,
      dependencyNote: 'Improve-step weak/strong sentence pair for The Purple Purse — author from the book text (master plan §6.2).',
    },
    art: [{ key: 'hero_purse_standing', placement: 'grounded-foot', sizeMm: 16 }],
  },
  {
    id: 'L6.B1.HW2', strand: 'HW', book: 1, slot: 'HW-SLOT W2', editions: WB,
    template: 'T1', title: 'Joined words',
    content: {
      kind: 'T1', pendingFont: true,
      sets: [
        { model: 'purse purple', source: 'Book L6.1 writing_words · word bank (old L6)' },
        { model: 'fern never', source: 'Book L6.1 writing_words · word bank (old L6)' },
        { model: 'their oh', source: 'Tricky L6 (B1 set)' },
        { model: 'the soft purple purse', source: 'Approved phrase set — G-L6.2 answer row 2, verbatim' },
      ],
    },
  },

  // ===========================================================================
  // B2 — The Brown Owl (are ow) · 7 days
  // ===========================================================================
  {
    id: 'L6.B2.SP1', strand: 'SP', book: 2, slot: 'W1-D1 RD', editions: WB,
    template: 'T8', title: 'Look Cover Write Check',
    content: {
      kind: 'T8',
      example: { word: 'stare', source: 'Book L6.2 writing_words · word bank (old L6)' },
      rows: [
        { word: 'care', source: 'Book L6.2 writing_words · word bank (old L6)' },
        { word: 'dare', source: 'Book L6.2 writing_words · word bank (old L6)' },
        { word: 'owl', source: 'Book L6.2 writing_words · word bank (old L3)' },
        { word: 'brown', source: 'Book L6.2 writing_words · word bank (old L4)' },
        { word: 'down', source: 'Book L6.2 writing_words · word bank (old L3)' },
      ],
    },
    art: [{ key: 'leaf', placement: 'perch', sizeMm: 14 }],
  },
  {
    id: 'L6.B2.GR1', strand: 'GR', book: 2, slot: 'W1-D2 RD', editions: WB,
    template: 'T2', title: 'Four kinds of sentence',
    content: { kind: 'T2', unitId: 'g-l6-1', watchArt: ['leaf', 'branch'] },
    art: [{ key: 'scene_owl_branch', placement: 'perch', sizeMm: 20 }],
  },
  {
    id: 'L6.B2.SW1', strand: 'SW', book: 2, slot: 'W1-D3 RD', editions: BOOK,
    template: 'T4', title: 'Hold the sentence',
    content: {
      kind: 'T4', variant: 'hold', linesPerItem: 1,
      sentences: [
        { text: 'Then the owl spread its wings and swooped down from the branch.', source: 'Book L6.2 p5, verbatim' },
        { text: 'We set off down the dark path together.', source: 'Book L6.2 p2, verbatim' },
        { text: 'The brown owl and her owlets were safe in the dark.', source: 'Book L6.2 p8, verbatim' },
      ],
    },
    art: [{ key: 'scene_owl_branch', placement: 'grounded-foot', sizeMm: 20 }],
  },
  {
    id: 'L6.B2.DI1', strand: 'DI', book: 2, slot: 'W1-D4 RD', editions: WB,
    template: 'T9', title: 'Listen and write',
    content: {
      kind: 'T9', slots: 3,
      sentences: [
        { text: 'The air was cool on my bare cheeks.', source: 'Book L6.2 p2, verbatim' },
        { text: 'I stared back but I did not dare to get close.', source: 'Book L6.2 p4, verbatim' },
        { text: 'We went home under the stars.', source: 'Book L6.2 p8, verbatim' },
      ],
    },
  },
  {
    id: 'L6.B2.SW2', strand: 'SW', book: 2, slot: 'W1-D5 WO', editions: WB,
    template: 'T4', title: 'Answer it in a sentence',
    content: {
      kind: 'T4', variant: 'answer', linesPerItem: 2, placeholderSlots: 3,
      dependencyNote: 'Comprehension question set for The Brown Owl — author from the book text, decodability-checked (master plan §6.1).',
    },
    art: [{ key: 'owlets', placement: 'perch', sizeMm: 16 }],
  },
  {
    id: 'L6.B2.HW1', strand: 'HW', book: 2, slot: 'HW-SLOT W1', editions: BOOK,
    template: 'T1', title: 'First joins',
    content: {
      kind: 'T1', pendingFont: true,
      sets: [
        { model: 'ow ow ow', source: 'L6 GPC (ledger) — horizontal join family' },
        { model: 'down town', source: 'Book L6.2 writing_words · word bank (old L3)' },
        { model: 'brown brown', source: 'Book L6.2 writing_words' },
        { model: 'owl howl', source: 'Book L6.2 story_words · read_words' },
      ],
    },
    art: [{ key: 'leaf', placement: 'perch', sizeMm: 14 }],
  },
  {
    id: 'L6.B2.SP2', strand: 'SP', book: 2, slot: 'W2-D1 RD (warm-up D6)', editions: WB,
    template: 'T8', title: 'Look Cover Write Check',
    content: {
      kind: 'T8',
      example: { word: 'come', source: 'Tricky L5 (revision)' },
      rows: [
        { word: 'people', source: 'Tricky L6 (new, B2 set)' },
        { word: 'Mr', source: 'Tricky L6 (new, B2 set)' },
        { word: 'Mrs', source: 'Tricky L6 (new, B2 set)' },
        { word: 'their', source: 'Tricky L6 (revision, B1 set)' },
        { word: 'oh', source: 'Tricky L6 (revision, B1 set)' },
      ],
    },
    art: [{ key: 'branch', placement: 'perch', sizeMm: 14 }],
  },
  {
    id: 'L6.B2.GR2', strand: 'GR', book: 2, slot: 'W2-D2 RD (D6)', editions: WB,
    template: 'T2', title: 'Joining with when, if, that, because',
    content: { kind: 'T2', unitId: 'g-l6-4', watchArt: ['purse'] },
    art: [{ key: 'scene_owl_owlets_moon', placement: 'grounded-foot', sizeMm: 42 }],
  },
  {
    id: 'L6.B2.ST1', strand: 'ST', book: 2, slot: 'W2-D4 WO (D7)', editions: WB,
    template: 'T10', title: 'Spelling test',
    content: {
      kind: 'T10', lines: 10, variant: 'book',
      dependencyNote: 'Spelling test word list for The Brown Owl — select 10 from the book focus sounds + L6 tricky words; publish in TEACHER_SEQUENCE_L6.md (master plan §6.4).',
    },
  },
  {
    id: 'L6.B2.BW1', strand: 'BW', book: 2, slot: 'W2-D5 WO (D7)', editions: WB,
    template: 'T5', title: 'Big write',
    content: {
      kind: 'T5',
      prompt: 'Make this moment from the book better, then write what happens next.',
      planBoxMm: 40, lines: 9, pairPlaceholder: true,
      dependencyNote: 'Improve-step weak/strong sentence pair for The Brown Owl (the owlets moment) — author from the book text (master plan §6.2).',
    },
    art: [{ key: 'scene_owl_owlets_moon', placement: 'grounded-foot', sizeMm: 18 }],
  },
  {
    id: 'L6.B2.HW2', strand: 'HW', book: 2, slot: 'HW-SLOT W2', editions: WB,
    template: 'T1', title: 'Joined words',
    content: {
      kind: 'T1', pendingFont: true,
      sets: [
        { model: 'care dare stare', source: 'Book L6.2 writing_words · word bank (old L6)' },
        { model: 'brown down', source: 'Book L6.2 writing_words' },
        { model: 'people people', source: 'Tricky L6 (B2 set)' },
        { model: 'the big brown owl', source: 'Approved phrase set — G-L6.2 worked example answer, verbatim' },
      ],
    },
  },

  // ===========================================================================
  // B3 — The New Glue (ew ue) · 9 days
  // ===========================================================================
  {
    id: 'L6.B3.SP1', strand: 'SP', book: 3, slot: 'W1-D1 RD', editions: WB,
    template: 'T8', title: 'Look Cover Write Check',
    content: {
      kind: 'T8',
      example: { word: 'new', source: 'Book L6.3 writing_words · word bank (old L6)' },
      rows: [
        { word: 'glue', source: 'Book L6.3 writing_words · word bank (old L6)' },
        { word: 'blue', source: 'Book L6.3 writing_words · word bank (old L6)' },
        { word: 'drew', source: 'Book L6.3 writing_words · word bank (old L6)' },
        { word: 'true', source: 'Book L6.3 writing_words · word bank (old L6)' },
        { word: 'flew', source: 'Book L6.3 writing_words · word bank (old L6)' },
      ],
    },
    art: [{ key: 'cup', placement: 'perch', sizeMm: 14 }],
  },
  {
    id: 'L6.B3.GR1', strand: 'GR', book: 3, slot: 'W1-D2 RD', editions: WB,
    template: 'T2', title: 'Make the noun phrase grow',
    content: { kind: 'T2', unitId: 'g-l6-2', watchArt: ['owl'] },
    art: [{ key: 'moon', placement: 'grounded-foot', sizeMm: 16 }],
  },
  {
    id: 'L6.B3.SW1', strand: 'SW', book: 3, slot: 'W1-D3 RD', editions: BOOK,
    template: 'T4', title: 'Hold the sentence',
    content: {
      kind: 'T4', variant: 'hold', linesPerItem: 1,
      sentences: [
        { text: 'The girl had a pot of new blue glue.', source: 'Book L6.3 p1, verbatim' },
        { text: 'The cup fell and tea ran down on to the new rug.', source: 'Book L6.3 p4, verbatim' },
        { text: 'The cat just sat and chewed its fur clean.', source: 'Book L6.3 p7, verbatim' },
      ],
    },
    art: [{ key: 'hero_glue_action', placement: 'grounded-foot', sizeMm: 18 }],
  },
  {
    id: 'L6.B3.DI1', strand: 'DI', book: 3, slot: 'W1-D4 RD', editions: WB,
    template: 'T9', title: 'Listen and write',
    content: {
      kind: 'T9', slots: 3,
      sentences: [
        { text: 'She drew a bird on a card.', source: 'Book L6.3 p1, verbatim' },
        { text: 'The cat grew cross and ran.', source: 'Book L6.3 p3, verbatim' },
        { text: 'At last, the card was finished.', source: 'Book L6.3 p8, verbatim' },
      ],
    },
  },
  {
    id: 'L6.B3.SW2', strand: 'SW', book: 3, slot: 'W1-D5 WO', editions: WB,
    template: 'T4', title: 'Answer it in a sentence',
    content: {
      kind: 'T4', variant: 'answer', linesPerItem: 2, placeholderSlots: 3,
      dependencyNote: 'Comprehension question set for The New Glue — author from the book text, decodability-checked (master plan §6.1).',
    },
    art: [{ key: 'bird', placement: 'perch', sizeMm: 16 }],
  },
  {
    id: 'L6.B3.HW1', strand: 'HW', book: 3, slot: 'HW-SLOT W1', editions: BOOK,
    template: 'T1', title: 'Joins',
    content: {
      kind: 'T1', pendingFont: true,
      sets: [
        { model: 'ew ew ew', source: 'L6 GPC (ledger) — join families' },
        { model: 'ue ue ue', source: 'L6 GPC (ledger) — join families' },
        { model: 'new flew', source: 'Book L6.3 writing_words · word bank (old L6)' },
        { model: 'glue blue', source: 'Book L6.3 writing_words · word bank (old L6)' },
      ],
    },
    art: [{ key: 'cup', placement: 'perch', sizeMm: 14 }],
  },
  {
    id: 'L6.B3.SP2', strand: 'SP', book: 3, slot: 'W2-D1 RD (warm-up D6)', editions: WB,
    template: 'T8', title: 'Look Cover Write Check',
    content: {
      kind: 'T8',
      example: { word: 'people', source: 'Tricky L6 (revision, B2 set)' },
      rows: [
        { word: 'looked', source: 'Tricky L6 (new, B3 set)' },
        { word: 'called', source: 'Tricky L6 (new, B3 set)' },
        { word: 'asked', source: 'Tricky L6 (new, B3 set)' },
        { word: 'Mr', source: 'Tricky L6 (revision, B2 set)' },
        { word: 'Mrs', source: 'Tricky L6 (revision, B2 set)' },
      ],
    },
    art: [{ key: 'glue', placement: 'perch', sizeMm: 14 }],
  },
  {
    id: 'L6.B3.GR2', strand: 'GR', book: 3, slot: 'W2-D2 RD (D6)', editions: WB,
    template: 'T2', title: 'Joining with and, but, or, so',
    content: { kind: 'T2', unitId: 'g-l6-3', watchArt: ['glue'] },
    art: [{ key: 'scene_cup_rug_glue', placement: 'perch', sizeMm: 20 }],
  },
  {
    id: 'L6.B3.GR3', strand: 'GR', book: 3, slot: 'W2-D3 RD (D7)', editions: WB,
    template: 'T2', title: 'Adjectives and adverbs',
    content: { kind: 'T2', unitId: 'g-l6-5', watchArt: ['leaf'] },
    art: [{ key: 'cat', placement: 'grounded-foot', sizeMm: 16 }],
  },
  {
    id: 'L6.B3.ST1', strand: 'ST', book: 3, slot: 'W2-D4 WO (D8)', editions: WB,
    template: 'T10', title: 'Spelling test',
    content: {
      kind: 'T10', lines: 10, variant: 'book',
      dependencyNote: 'Spelling test word list for The New Glue — select 10 from the book focus sounds + L6 tricky words; publish in TEACHER_SEQUENCE_L6.md (master plan §6.4).',
    },
  },
  {
    id: 'L6.B3.BW1', strand: 'BW', book: 3, slot: 'W2-D5 WO (D9)', editions: WB,
    template: 'T5', title: 'Big write',
    content: {
      kind: 'T5',
      prompt: 'Make this moment from the book better, then write what happens next.',
      planBoxMm: 40, lines: 9, pairPlaceholder: true,
      dependencyNote: 'Improve-step weak/strong sentence pair for The New Glue (the glue moment) — author from the book text (master plan §6.2).',
    },
    art: [{ key: 'hero_glue_standing', placement: 'grounded-foot', sizeMm: 16 }],
  },
  {
    id: 'L6.B3.HW2', strand: 'HW', book: 3, slot: 'HW-SLOT W2', editions: WB,
    template: 'T1', title: 'Joined words',
    content: {
      kind: 'T1', pendingFont: true,
      sets: [
        { model: 'drew threw', source: 'Book L6.3 story_words · word bank (old L6)' },
        { model: 'true blue', source: 'Book L6.3 writing_words · word bank (old L6)' },
        { model: 'looked called', source: 'Tricky L6 (B3 set)' },
        { model: 'the new blue glue', source: 'Approved phrase set — G-L6.2 answer row 1, verbatim' },
      ],
    },
  },

  // ===========================================================================
  // B4 — The Cheeky Monkey (review) · 5 days
  // ===========================================================================
  {
    id: 'L6.B4.SP1', strand: 'SP', book: 4, slot: 'W1-D1 RD', editions: WB,
    template: 'T8', title: 'Look Cover Write Check',
    content: {
      kind: 'T8',
      example: { word: 'brown', source: 'Book L6.4 writing_words' },
      rows: [
        { word: 'could', source: 'Tricky L6 (new, B4 set)' },
        { word: 'furry', source: 'Book L6.4 writing_words' },
        { word: 'now', source: 'Book L6.4 writing_words · word bank (old L3)' },
        { word: 'stare', source: 'Book L6.4 writing_words · word bank (old L6)' },
        { word: 'blue', source: 'Book L6.4 writing_words · word bank (old L6)' },
      ],
    },
    art: [{ key: 'moon', placement: 'perch', sizeMm: 14 }],
  },
  {
    id: 'L6.B4.GR1', strand: 'RV', book: 4, slot: 'W1-D2 RD', editions: WB,
    template: 'T2', title: 'Fix and answer',
    content: { kind: 'T2', unitId: 'g-l6-review' },
    art: [{ key: 'scene_review', placement: 'perch', sizeMm: 20 }],
  },
  {
    id: 'L6.B4.SW1', strand: 'SW', book: 4, slot: 'W1-D3 RD', editions: BOOK,
    template: 'T4', title: 'Hold the sentence',
    content: {
      kind: 'T4', variant: 'hold', linesPerItem: 1,
      sentences: [
        { text: 'But the monkey just grinned and ran on.', source: 'Book L6.4 p4, verbatim' },
        { text: 'The monkey sat by the water with his snack.', source: 'Book L6.4 p6, verbatim' },
        { text: 'Her dark gown flowed in the warm air.', source: 'Book L6.4 p7, verbatim' },
      ],
    },
  },
  {
    id: 'L6.B4.DI1', strand: 'DI', book: 4, slot: 'W1-D4 RD', editions: WB,
    template: 'T9', title: 'Listen and write',
    content: {
      kind: 'T9', slots: 3,
      sentences: [
        { text: 'It sat on a wall and turned to stare.', source: 'Book L6.4 p3, verbatim' },
        { text: 'The blue lake was still and cool.', source: 'Book L6.4 p2, verbatim' },
        { text: 'The boy sat down with Mum by the water.', source: 'Book L6.4 p8, verbatim' },
      ],
    },
  },
  {
    id: 'L6.B4.HW1', strand: 'HW', book: 4, slot: 'HW-SLOT', editions: BOOK,
    template: 'T1', title: 'Joined phrases',
    content: {
      kind: 'T1', pendingFont: true,
      sets: [
        { model: 'the soft purple purse', source: 'Approved phrase set — G-L6.2 answer row 2, verbatim' },
        { model: 'the big brown owl', source: 'Approved phrase set — G-L6.2 worked example answer, verbatim' },
        { model: 'the new blue glue', source: 'Approved phrase set — G-L6.2 answer row 1, verbatim' },
        { model: 'the soft fluffy owlets', source: 'Approved phrase set — G-L6.2 answer row 4, verbatim' },
      ],
    },
  },
  {
    id: 'L6.B4.ST1', strand: 'ST', book: 4, slot: 'W1-D5 WO', editions: WB,
    template: 'T10', title: 'Spelling test',
    content: {
      kind: 'T10', lines: 10, variant: 'book',
      dependencyNote: 'Spelling test word list for The Cheeky Monkey — select 10 from the level review sounds + L6 tricky words; publish in TEACHER_SEQUENCE_L6.md (master plan §6.4).',
    },
  },
  {
    id: 'L6.B4.BW1', strand: 'BW', book: 4, slot: 'd28 WO', editions: WB,
    template: 'T5', title: 'Big write',
    content: {
      kind: 'T5',
      prompt: 'Make this moment from the book better, then write what happens next.',
      planBoxMm: 40, lines: 9, pairPlaceholder: true,
      dependencyNote: 'Improve-step weak/strong sentence pair for The Cheeky Monkey (the monkey moment) — author from the book text (master plan §6.2).',
    },
    art: [{ key: 'hero_monkey_standing', placement: 'grounded-foot', sizeMm: 16 }],
  },
  {
    id: 'L6.B4.HW2', strand: 'HW', book: 4, slot: 'HW-SLOT W2', editions: WB,
    template: 'T1', title: 'Joined words',
    content: {
      kind: 'T1', pendingFont: true,
      sets: [
        { model: 'oh their could', source: 'Tricky L6 (review)' },
        { model: 'looked called', source: 'Tricky L6 (review)' },
        { model: 'asked people', source: 'Tricky L6 (review)' },
        { model: 'Mr Mrs', source: 'Tricky L6 (review)' },
      ],
    },
  },

  // ===========================================================================
  // Closing pool (LEVEL) — the week-6 assessment event + Answers
  // ===========================================================================
  {
    id: 'L6.SWYK-A', strand: 'SWYK', book: 'LEVEL', slot: 'BLOCK-W6 WO d29', editions: WB,
    template: 'T6', title: 'Show what you know',
    content: {
      kind: 'T6',
      blocks: [
        {
          label: 'Tick the kind · match the short form',
          items: [
            { task: 'Tick the kind', sourceUnit: 'G-L6.1', rowRef: 0, answer: 'Statement' },
            { task: 'Tick the kind', sourceUnit: 'G-L6.1', rowRef: 2, answer: 'Command' },
            { task: 'Match the short form', sourceUnit: 'G-L6.6', rowRef: 0, answer: "I'm" },
            { task: 'Match the short form', sourceUnit: 'G-L6.6', rowRef: 3, answer: "we're" },
          ],
        },
        {
          label: 'Grow the noun phrase · choose the joining word',
          items: [
            { task: 'Grow the noun phrase', sourceUnit: 'G-L6.2', rowRef: 2, answer: 'the bare brown branch' },
            { task: 'Choose the joining word', sourceUnit: 'G-L6.3', rowRef: 1, answer: 'and' },
            { task: 'Choose the joining word', sourceUnit: 'G-L6.4', rowRef: 0, answer: 'if' },
          ],
        },
      ],
    },
    art: [{ key: 'monkey', placement: 'perch', sizeMm: 16 }],
  },
  {
    id: 'L6.SWYK-B', strand: 'SWYK', book: 'LEVEL', slot: 'BLOCK-W6 WO d29', editions: WB,
    template: 'T6', title: 'Show what you know',
    content: {
      kind: 'T6',
      blocks: [
        {
          label: 'Rewrite in the past',
          items: [
            { task: 'Rewrite in the past', sourceUnit: 'G-L6.7', rowRef: 2, answer: 'She drew a bird and gave it to Mum.' },
            { task: 'Rewrite in the past', sourceUnit: 'G-L6.7', rowRef: 3, answer: 'Dad turned to look and slipped over.' },
          ],
        },
      ],
      writeTask: {
        prompt: 'Now you write three sentences about the monkey. Use a joining word and a noun phrase.',
        lines: 4,
      },
    },
    art: [{ key: 'owl', placement: 'perch', sizeMm: 16 }],
  },
  {
    id: 'L6.ST-HT', strand: 'ST', book: 'LEVEL', slot: 'BLOCK-W6 WO d30', editions: WB,
    template: 'T10', title: 'Half-term spelling test',
    content: {
      kind: 'T10', lines: 10, variant: 'half-term',
      dependencyNote: 'Half-term test word list — select 10 across all four books from approved lists; publish in TEACHER_SEQUENCE_L6.md (master plan §6.4).',
    },
  },
  {
    id: 'L6.ANS-A', strand: 'ANS', book: 'LEVEL', slot: 'final', editions: WB,
    template: 'T7', title: 'Answers',
    content: { kind: 'T7', part: 'A' },
  },
  {
    id: 'L6.ANS-B', strand: 'ANS', book: 'LEVEL', slot: 'final', editions: WB,
    template: 'T7', title: 'Answers',
    content: { kind: 'T7', part: 'B' },
  },
];

export default L6_POOL;
