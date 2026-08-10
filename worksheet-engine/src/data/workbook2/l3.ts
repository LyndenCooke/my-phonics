// ---------------------------------------------------------------------------
// L3 WORKBOOK — Special Friends (Amber). Three books; the special-friend
// digraphs lead, so every book opens with a Sounds page. All sentences are
// VERBATIM book text; words come from the books' word lists + the L3 tricky
// words (he, she, we, me, be).
// ---------------------------------------------------------------------------

import type { W2LevelData, W2BookData } from '@/data/workbook2/levels';
import { W2_LEVEL_SPECS } from '@/data/workbook2/levels';
import { soundPagesFor } from '@/data/workbook2/soundPages';

const BOOKS: W2BookData[] = [
  {
    num: 1,
    soundPages: soundPagesFor('sh', 'nk'),
    title: 'The Fish in the Tank',
    spellPractise: ['fish', 'tank', 'wish', 'bag', 'she', 'we'],
    grammar: ['g-l3-1'],
    hold: ['It is in a bag.', 'The fish can go in!'],
    listen: ['I get a tank.', 'The fish is sad.'],
    questions: [null, null, null],
    bigWrite: { prompt: 'Look at the picture from the book. Write about it.', scene: '/storyart/l3_1/page5.png', pos: '50% 45%' },
    ladders: [
      { sound: 'sh', word: 'fish', sentence: 'I have a fish!' },
      { sound: 'nk', word: 'tank', sentence: 'I get a tank.' },
    ],
  },
  {
    num: 2,
    soundPages: soundPagesFor('ch', 'th'),
    title: 'Chop, Chop, Chop!',
    spellPractise: ['chop', 'chip', 'thin', 'thick', 'this', 'that'],
    grammar: ['g-l3-2'],
    hold: ['Nan chops it thin.', 'That chip is thick!'],
    listen: ['I got a chip.', 'This is fun!'],
    questions: [null, null, null],
    bigWrite: {
      prompt: 'Number the pictures 1 to 4 in story order. Then write what happens.',
      scene: '/storyart/l3_2/page5.png',
      scenes: [
        { src: '/storyart/l3_2/page4.png' },
        { src: '/storyart/l3_2/page1.png' },
        { src: '/storyart/l3_2/page6.png' },
        { src: '/storyart/l3_2/page2.png' },
      ],
    },
    ladders: [
      { sound: 'ch', word: 'chip', sentence: 'I got a chip.' },
      { sound: 'th', word: 'that', sentence: 'This is fun!' },
    ],
  },
  {
    num: 3,
    soundPages: soundPagesFor('ng', 'qu', 'zz'),
    title: 'Buzz and Sing!',
    spellPractise: ['buzz', 'sing', 'song', 'hiss', 'quick', 'long'],
    grammar: ['g-l3-3', 'g-l3-4'],
    hold: ['I sit on a big log.', 'I sing and sing!'],
    listen: ['The bugs go!', 'I sing with the bugs!'],
    questions: [null, null, null],
    bigWrite: { prompt: 'Look at the picture from the book. Write about it.', scene: '/storyart/l3_3/page3.png', pos: '50% 45%' },
    ladders: [
      { sound: 'ng', word: 'song', sentence: 'I sing and sing!' },
      { sound: 'zz', word: 'buzz', sentence: 'Buzz, buzz, buzz!' },
    ],
  },
];

export const L3_DATA: W2LevelData = {
  spec: W2_LEVEL_SPECS[3],
  books: BOOKS,
  swykA: [
    { kind: 'tick', label: 'Name or not a name?', refs: [{ sourceUnit: 'G-L3.1', rowRef: 0 }, { sourceUnit: 'G-L3.1', rowRef: 1 }, { sourceUnit: 'G-L3.1', rowRef: 2 }, { sourceUnit: 'G-L3.1', rowRef: 3 }] },
    { kind: 'tick', label: 'Statement or question?', refs: [{ sourceUnit: 'G-L3.3', rowRef: 0 }, { sourceUnit: 'G-L3.3', rowRef: 1 }, { sourceUnit: 'G-L3.3', rowRef: 2 }, { sourceUnit: 'G-L3.3', rowRef: 3 }] },
    { kind: 'match', label: 'Match the question to its answer', refs: [{ sourceUnit: 'G-L3.4', rowRef: 1 }, { sourceUnit: 'G-L3.4', rowRef: 3 }] },
  ],
  swykB: {
    groups: [
      { kind: 'rewrite', label: 'Write it with a question mark', refs: [{ sourceUnit: 'G-L3.2', rowRef: 0 }, { sourceUnit: 'G-L3.2', rowRef: 2 }] },
    ],
    writeTask: 'Write about the fish.',
    writeLines: 2,
  },
  swykAnswers: 'Jack name; dog not; Nan name; cat not. Statement; question; statement; question. Jack can hop; It is hot at noon. Is it hot? Will Jack run?',
  spellings: [
    { title: 'The Fish in the Tank', words: ['fish', 'tank', 'wish', 'bag', 'she', 'we', 'he', 'me'] },
    { title: 'Chop, Chop, Chop!', words: ['chop', 'chip', 'thin', 'thick', 'this', 'that', 'we', 'be'] },
    { title: 'Buzz and Sing!', words: ['buzz', 'sing', 'song', 'hiss', 'quick', 'long', 'she', 'me'] },
    { title: 'Half-term test', words: ['fish', 'tank', 'chop', 'thin', 'sing', 'buzz', 'she', 'we'] },
  ],
  grownUps: [
    { title: 'Special friends', body: 'Two letters, one sound. Use the sound books before each reading book; the Sounds page repeats the same sounds in writing.' },
    { title: 'Little and often', body: 'One page a day, about five minutes, after the day\'s sound book or reading. Never push on to a second page.' },
    { title: 'The order matters', body: 'Each book\'s pages run in teaching order: Sounds, grammar, Sentences, Answer it, Spell it, Big write, then Handwriting in its own slot.' },
    { title: 'Spell it works twice', body: 'Practise the words the day before the test. On test day, cover the top half and read the words from the Spelling words page.' },
    { title: 'The first one is done', body: 'On grammar pages the first item is completed in colour. Talk it through together before the child does the rest.' },
    { title: 'Listen and write', body: 'Read the sentence aloud twice. The child says it back, taps a finger per word, then writes it. The sentences are in the Answers.' },
    { title: 'The big write grows', body: 'The picture is the prompt. Two or three lines is a win at this level.' },
    { title: 'The last week', body: 'Show what you know and the spelling check tell you if your child is ready for Level 4.' },
  ],
};
