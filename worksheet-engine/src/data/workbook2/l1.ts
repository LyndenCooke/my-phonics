// ---------------------------------------------------------------------------
// L1 WORKBOOK — Ditties (Pink). Two books, three weeks each, sound-heavy:
// every book section opens with a Sounds page (the sound_a pattern) and the
// writing ladder is letters → words → a caption big write. All sentences are
// VERBATIM book text; all words come from the books' word lists + the L1
// tricky words (I, the). Sources: stories_all.json dump of the shipped
// story data (Tap! Tap! Tap! = old 1.1, The Mud on the Dog = old 1.2).
// ---------------------------------------------------------------------------

import type { W2LevelData, W2BookData } from '@/data/workbook2/levels';
import { W2_LEVEL_SPECS } from '@/data/workbook2/levels';
import { soundPagesFor } from '@/data/workbook2/soundPages';

const BOOKS: W2BookData[] = [
  {
    num: 1,
    title: 'Tap! Tap! Tap!',
    spellPractise: ['tap', 'sat', 'pat', 'the'],
    grammar: ['g-l1-1'],
    hold: [
      'I sit at a mat.',
      'It is a cat!',
    ],
    listen: [
      'Is it a rat?',
      'I pat the cat.',
    ],
    // one page per sound, curriculum order (graphemes_by_level level_1)
    soundPages: soundPagesFor('s', 'a', 't', 'p', 'i'),
    bigWrite: { prompt: 'Look at the picture from the book. Write about it.', scene: '/storyart/l1_1/page5.png', pos: '50% 40%' },
    ladders: [
      { sound: 's', word: 'sit', sentence: 'I sit at a mat.' },
      { sound: 't', word: 'tap', sentence: 'Tap, tap, tap!' },
    ],
  },
  {
    num: 2,
    title: 'The Mud on the Dog',
    spellPractise: ['dog', 'mud', 'mop', 'the'],
    grammar: ['g-l1-2', 'g-l1-3'],
    hold: [
      'It is a big dog.',
      'I mop the dog.',
    ],
    listen: [
      'I got a dog.',
      'Mud is on the dog.',
    ],
    soundPages: soundPagesFor('n', 'm', 'd', 'g', 'o'),
    // sequencing variant: scenes authored in a SHUFFLED display order; the
    // child numbers them 1-4 (key on the Answers page)
    bigWrite: {
      prompt: 'Number the pictures 1 to 4 in story order. Then write about the story.',
      scene: '/storyart/l1_2/page2.png',
      scenes: [
        { src: '/storyart/l1_2/page4.png' },
        { src: '/storyart/l1_2/page1.png' },
        { src: '/storyart/l1_2/page6.png' },
        { src: '/storyart/l1_2/page2.png' },
      ],
    },
    ladders: [
      { sound: 'm', word: 'mum', sentence: 'Mud is on me!' },
      { sound: 'd', word: 'dog', sentence: 'I got a dog.' },
    ],
  },
];

export const L1_DATA: W2LevelData = {
  spec: W2_LEVEL_SPECS[1],
  books: BOOKS,
  swykA: [
    { kind: 'circle', label: 'Circle each word', refs: [{ sourceUnit: 'G-L1.1', rowRef: 0 }, { sourceUnit: 'G-L1.1', rowRef: 1 }, { sourceUnit: 'G-L1.1', rowRef: 2 }, { sourceUnit: 'G-L1.1', rowRef: 3 }] },
    { kind: 'rewrite', label: 'Read it, then write it', refs: [{ sourceUnit: 'G-L1.2', rowRef: 1 }, { sourceUnit: 'G-L1.2', rowRef: 2 }] },
  ],
  swykB: {
    groups: [
      { kind: 'rewrite', label: 'Write it again with finger spaces', refs: [{ sourceUnit: 'G-L1.3', rowRef: 0 }, { sourceUnit: 'G-L1.3', rowRef: 1 }] },
    ],
    writeTask: 'Write about the dog.',
    writeLines: 2,
  },
  swykAnswers: 'Every word circled. The dog is a mess! Mum got a tub. I pat the cat. The cat naps.',
  spellings: [
    { title: 'Tap! Tap! Tap!', words: ['tap', 'sat', 'pat', 'the'] },
    { title: 'The Mud on the Dog', words: ['dog', 'mud', 'mop', 'the'] },
    { title: 'Half-term test', words: ['tap', 'sat', 'dog', 'mud'] },
  ],
  grownUps: [
    { title: 'Sounds come first', body: 'Level 1 is mostly sound work. Use the sound books before each reading book; the Sounds page repeats the same letters in writing.' },
    { title: 'Little and often', body: 'One page a day, about five minutes, after the day\'s sound book or reading. Never push on to a second page.' },
    { title: 'Three weeks a book', body: 'There is no rush: each book runs about three weeks, with sound books and blending between reading days.' },
    { title: 'Spell it works twice', body: 'Practise the words the day before the test. On test day, cover the top half and read the words from the Spelling words page.' },
    { title: 'Listen and write', body: 'Read the sentence aloud twice. The child says it back, taps a finger per word, then writes it. The sentences are in the Answers.' },
    { title: 'The big write is a caption', body: 'The picture is the prompt. One line is a win at this level; ideas first, neatness second.' },
    { title: 'Handwriting', body: 'The child traces the grey writing and keeps going to the end of each line. Little and neat beats lots and rushed.' },
    { title: 'The last week', body: 'Show what you know and the spelling check tell you if your child is ready for Level 2.' },
  ],
};
