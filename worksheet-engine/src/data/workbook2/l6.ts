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

import type { W2LevelData, W2BookData } from '@/data/workbook2/levels';
import { W2_LEVEL_SPECS } from '@/data/workbook2/levels';

const BOOKS: W2BookData[] = [
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
    bigWrite: {
      prompt: 'Number the pictures 1 to 4 in story order. Then write the story. Use a joining word in your sentences.',
      scene: '/storyart/l6_2/page7.png',
      scenes: [
        { src: '/storyart/l6_2/page5.png' },
        { src: '/storyart/l6_2/page1.png' },
        { src: '/storyart/l6_2/page8.png' },
        { src: '/storyart/l6_2/page3.png' },
      ],
    },
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
    bigWrite: {
      prompt: 'Number the pictures 1 to 4 in story order. Then write the story. Use a joining word in your sentences.',
      scene: '/storyart/l6_4/page4.png',
      scenes: [
        { src: '/storyart/l6_4/page5.png' },
        { src: '/storyart/l6_4/page1.png' },
        { src: '/storyart/l6_4/page8.png' },
        { src: '/storyart/l6_4/page3.png' },
      ],
    },
    ladders: [
      { sound: 'ow', word: 'down', sentence: 'Round and round!' },
      { sound: 'ue', word: 'true', sentence: 'She had a true glow.' },
    ],
  },
];

export const L6_DATA: W2LevelData = {
  spec: W2_LEVEL_SPECS[6],
  books: BOOKS,
  swykA: [
    { kind: 'tick', label: 'Tick the kind', refs: [{ sourceUnit: 'G-L6.1', rowRef: 0 }, { sourceUnit: 'G-L6.1', rowRef: 2 }] },
    { kind: 'match', label: 'Draw a line to join each pair to its short form', refs: [{ sourceUnit: 'G-L6.6', rowRef: 0 }, { sourceUnit: 'G-L6.6', rowRef: 3 }] },
    { kind: 'build', label: 'Write the noun phrase again, grown bigger', refs: [{ sourceUnit: 'G-L6.2', rowRef: 2 }] },
    { kind: 'cloze', label: 'Write the best joining word in each gap', refs: [{ sourceUnit: 'G-L6.3', rowRef: 1 }, { sourceUnit: 'G-L6.4', rowRef: 0 }] },
  ],
  swykB: {
    groups: [
      { kind: 'rewrite', label: 'Rewrite each one all in the past tense', refs: [{ sourceUnit: 'G-L6.7', rowRef: 2 }, { sourceUnit: 'G-L6.7', rowRef: 3 }] },
    ],
    writeTask: 'Write three sentences about the monkey. Use a joining word and a noun phrase.',
    writeLines: 3,
  },
  swykAnswers: "Statement; Command; I'm; we're; the bare, brown branch; and; if; gave; slipped.",
  // Selected from the books' approved word lists, the word banks that carry
  // the L6 GPCs, and the L6 tricky words — recorded in L6_SELECTIONS.md.
  spellings: [
    { title: 'The Purple Purse', words: ['purse', 'purple', 'turn', 'fur', 'church', 'her', 'fern', 'never', 'their', 'oh'] },
    { title: 'The Brown Owl', words: ['care', 'dare', 'stare', 'bare', 'owl', 'brown', 'down', 'people', 'Mr', 'Mrs'] },
    { title: 'The New Glue', words: ['new', 'flew', 'drew', 'grew', 'blue', 'glue', 'true', 'looked', 'called', 'asked'] },
    { title: 'The Cheeky Monkey', words: ['how', 'now', 'town', 'furry', 'turn', 'stare', 'blue', 'drew', 'their', 'could'] },
    { title: 'Half-term test', words: ['purse', 'her', 'bare', 'owl', 'down', 'new', 'glue', 'true', 'people', 'could'] },
  ],
  grownUps: [
    { title: 'Little and often', body: 'One page a day, about five minutes, after the day\'s reading or sound book. Never push on to a second page.' },
    { title: 'The order matters', body: 'Each book\'s pages run in teaching order: grammar, Sentences, Answer it, more grammar, Use your grammar, Spell it, Big write, then Handwriting in its own slot.' },
    { title: 'Spell it works twice', body: 'Practise the words the day before the test. On test day, cover the top half and read the words from the Spelling words page.' },
    { title: 'The first one is done', body: 'On grammar pages the first item is completed in purple. Talk it through together before the child does the rest.' },
    { title: 'Listen and write', body: 'Read the sentence aloud twice. The child says it back, taps a finger per word, then writes it. The sentences are in the Answers.' },
    { title: 'The big write is the win', body: 'The picture is the prompt. Spelling mistakes are fine here; ideas first, then check against the writing goals together.' },
    { title: 'Handwriting', body: 'The child traces the grey writing and keeps going to the end of each line. Little and neat beats lots and rushed.' },
    { title: 'The last week', body: 'Show what you know and the half-term test are a check, not an exam. Secure here means ready for Level 7.' },
  ],
};
