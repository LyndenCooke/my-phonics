// ---------------------------------------------------------------------------
// L6 WORKBOOK (book-style system) — one booklet for the whole level, used
// alongside the four reading books and the nine L6 sound books across the
// six-week block. One ~5-minute page per day; the Spell it page is used twice
// (practise early in the book's run, the test at its close); big writes close
// each book so they land days apart.
//
// Provenance rules unchanged: grammar units verbatim by id; every selected
// word/sentence carries its source in L6_SELECTIONS.md; SW2 questions and
// test word lists remain authoring dependencies (L6_DEPENDENCIES.md).
// ---------------------------------------------------------------------------

import type { HwLadder } from '@/components/workbook2/W2Skills';

export interface W2Book {
  num: number;
  title: string;
  /** six practise words for the Spell it page (sound + tricky mix). */
  spellPractise: string[];
  /** grammar unit ids in teaching order (1-3 per book). */
  grammar: string[];
  /** two hold-the-sentence items, verbatim book text. */
  hold: string[];
  /** two dictation sentences (NEVER printed on the page; Answers only). */
  listen: string[];
  /** Answer-it page: 3 approved questions, or null while awaited. Absent =
   *  no Answer-it page (the review book). */
  questions?: (string | null)[];
  /** Use your grammar: approved words by pointer + a story scene. `pos` is
   *  the crop focus (CSS object-position) so the scene's ACTION shows. */
  useGrammar: { chips: string[]; scene: string; pos?: string };
  bigWrite: { prompt: string; scene: string; pos?: string };
  ladders: HwLadder[];
}

export const W2_L6_BOOKS: W2Book[] = [
  {
    num: 1,
    title: 'The Purple Purse',
    spellPractise: ['purple', 'purse', 'church', 'fern', 'their', 'oh'],
    grammar: ['g-l6-6', 'g-l6-7'],
    hold: [
      'I turned my pockets inside out, but it was not there.',
      'Then a market lady held up a purple purse!',
    ],
    listen: [
      'Dad came with me to search.',
      'We walked up and down the street.',
    ],
    questions: [null, null, null],
    useGrammar: { chips: ["it's", "didn't", "can't", 'stuck', 'ran', 'gave'], scene: '/storyart/l6_1/page8.png' },
    bigWrite: { prompt: 'Look at this moment from the book. Write what happens next.', scene: '/storyart/l6_1/page6.png' },
    ladders: [
      { sound: 'ur', word: 'purse', sentence: 'My purple purse was gone!' },
      { sound: 'er', word: 'fern', sentence: 'I searched in the ferns.' },
    ],
  },
  {
    num: 2,
    title: 'The Brown Owl',
    spellPractise: ['care', 'dare', 'owl', 'brown', 'down', 'people'],
    grammar: ['g-l6-1', 'g-l6-4'],
    hold: [
      'Then the owl spread its wings and swooped down from the branch.',
      'We set off down the dark path together.',
    ],
    listen: [
      'The air was cool on my bare cheeks.',
      'We went home under the stars.',
    ],
    questions: [null, null, null],
    useGrammar: { chips: ['when', 'if', 'that', 'because', 'bare', 'brown'], scene: '/storyart/l6_2/page2.png', pos: '50% 45%' },
    bigWrite: { prompt: 'Look at this moment from the book. Write what happens next.', scene: '/storyart/l6_2/page7.png' },
    ladders: [
      { sound: 'are', word: 'bare', sentence: 'The owl sat on a bare branch.' },
      { sound: 'ow', word: 'down', sentence: 'The owl stared down at me.' },
    ],
  },
  {
    num: 3,
    title: 'The New Glue',
    spellPractise: ['new', 'glue', 'blue', 'drew', 'looked', 'asked'],
    grammar: ['g-l6-2', 'g-l6-3', 'g-l6-5'],
    hold: [
      'The girl had a pot of new blue glue.',
      'The cat just sat and chewed its fur clean.',
    ],
    listen: [
      'She drew a bird on a card.',
      'At last, the card was finished.',
    ],
    questions: [null, null, null],
    useGrammar: { chips: ['and', 'but', 'or', 'so', 'new', 'blue'], scene: '/storyart/l6_3/page4.png', pos: '50% 72%' },
    bigWrite: { prompt: 'Look at this moment from the book. Write what happens next.', scene: '/storyart/l6_3/page6.png', pos: '50% 70%' },
    ladders: [
      { sound: 'ew', word: 'drew', sentence: 'She drew a bird on a card.' },
      { sound: 'ue', word: 'glue', sentence: 'The new glue stuck fast.' },
    ],
  },
  {
    num: 4,
    title: 'The Cheeky Monkey',
    spellPractise: ['could', 'furry', 'now', 'stare', 'blue', 'their'],
    grammar: ['g-l6-review'],
    hold: [
      'But the monkey just grinned and ran on.',
      'Her dark gown flowed in the warm air.',
    ],
    listen: [
      'The blue lake was still and cool.',
      'The boy sat down with Mum by the water.',
    ],
    useGrammar: { chips: ['could', "didn't", 'and', 'but', 'brown', 'furry'], scene: '/storyart/l6_4/page6.png', pos: '50% 62%' },
    bigWrite: { prompt: 'Look at this moment from the book. Write what happens next.', scene: '/storyart/l6_4/page4.png', pos: '50% 68%' },
    ladders: [
      { sound: 'ow', word: 'down', sentence: 'Round and round!' },
      { sound: 'ue', word: 'true', sentence: 'She had a true glow.' },
    ],
  },
];

/** Show-what-you-know item pointers (approved rows by pointer only). */
export const W2_L6_SWYK = {
  ticks: [
    { sourceUnit: 'G-L6.1', rowRef: 0 },
    { sourceUnit: 'G-L6.1', rowRef: 2 },
  ],
  matches: [
    { sourceUnit: 'G-L6.6', rowRef: 0 },
    { sourceUnit: 'G-L6.6', rowRef: 3 },
  ],
  build: { sourceUnit: 'G-L6.2', rowRef: 2 },
  clozes: [
    { sourceUnit: 'G-L6.3', rowRef: 1 },
    { sourceUnit: 'G-L6.4', rowRef: 0 },
  ],
  rewrites: [
    { sourceUnit: 'G-L6.7', rowRef: 2 },
    { sourceUnit: 'G-L6.7', rowRef: 3 },
  ],
  writeTask: 'Now you write three sentences about the monkey. Use a joining word and a noun phrase.',
};
