// ---------------------------------------------------------------------------
// L2 WORKBOOK — First Sounds (Coral). Five books over the six weeks, still
// sound-led: every book opens with a Sounds page. All sentences are VERBATIM
// book text; words come from the books' word lists + the L2 tricky words
// (no, go, to, into, is). Book five is the round-up: a Fix and answer page
// of pointer-reused items instead of new grammar.
// ---------------------------------------------------------------------------

import type { W2LevelData, W2BookData } from '@/data/workbook2/levels';
import { W2_LEVEL_SPECS } from '@/data/workbook2/levels';

const BOOKS: W2BookData[] = [
  {
    num: 1,
    title: 'The Red Socks',
    spellPractise: ['sock', 'red', 'kick', 'peck', 'no'],
    grammar: ['g-l2-1'],
    hold: ['I check the bed.', 'The hen has red socks!'],
    listen: ['I get the socks.', 'I can kick!'],
    sounds: {
      graphemes: ['c', 'k', 'ck'],
      words: ['kick', 'sock', 'peck'],
      missing: [
        { word: 'sock', hide: 'ck' },
        { word: 'kick', hide: 'k' },
        { word: 'red', hide: 'e' },
      ],
    },
    bigWrite: { prompt: 'Look at the picture from the book. Write about it.', scene: '/storyart/l2_1/page4.png', pos: '50% 45%' },
    ladders: [
      { sound: 'ck', word: 'sock', sentence: 'I get a sock.' },
      { sound: 'e', word: 'red', sentence: 'Not red!' },
    ],
  },
  {
    num: 2,
    title: 'Run, Pup, Run!',
    spellPractise: ['run', 'pup', 'hut', 'rub', 'go'],
    grammar: ['g-l2-2'],
    hold: ['I have a pup.', 'The pup can run!'],
    listen: ['I rub the pup.', 'A big hug!'],
    sounds: {
      graphemes: ['u', 'r', 'h'],
      words: ['run', 'hut', 'rub'],
      missing: [
        { word: 'run', hide: 'u' },
        { word: 'hut', hide: 'h' },
        { word: 'rub', hide: 'r' },
      ],
    },
    bigWrite: { prompt: 'Look at the picture from the book. Write about it.', scene: '/storyart/l2_2/page4.png', pos: '50% 45%' },
    ladders: [
      { sound: 'u', word: 'pup', sentence: 'Run, pup, run!' },
      { sound: 'b', word: 'tub', sentence: 'I rub the pup.' },
    ],
  },
  {
    num: 3,
    title: 'Fox Fell Off!',
    spellPractise: ['fox', 'fell', 'off', 'hill', 'no'],
    grammar: ['g-l2-3'],
    hold: ['Fox is on a log.', 'Fox fell off the log!'],
    listen: ['Fox is on the mat!', 'I hug Fox!'],
    sounds: {
      graphemes: ['f', 'ff', 'll'],
      words: ['fox', 'off', 'fell'],
      missing: [
        { word: 'off', hide: 'ff' },
        { word: 'fell', hide: 'll' },
        { word: 'fox', hide: 'f' },
      ],
    },
    bigWrite: { prompt: 'Look at the picture from the book. Write about it.', scene: '/storyart/l2_3/page2.png', pos: '50% 45%' },
    ladders: [
      { sound: 'ff', word: 'off', sentence: 'Fox fell off the log!' },
      { sound: 'll', word: 'hill', sentence: 'Fox is on a hill.' },
    ],
  },
  {
    num: 4,
    title: 'The Jam Jug',
    spellPractise: ['jam', 'jug', 'van', 'wet', 'to'],
    grammar: ['g-l2-4'],
    hold: ['Dad has a van.', 'Jam on the rug!'],
    listen: ['I dip in a jug.', 'I mop it up.'],
    sounds: {
      graphemes: ['j', 'v', 'w'],
      words: ['jam', 'van', 'wet'],
      missing: [
        { word: 'jam', hide: 'j' },
        { word: 'van', hide: 'v' },
        { word: 'wet', hide: 'w' },
      ],
    },
    bigWrite: { prompt: 'Look at the picture from the book. Write about it.', scene: '/storyart/l2_4/page4.png', pos: '50% 50%' },
    ladders: [
      { sound: 'j', word: 'jug', sentence: 'I dip in a jug.' },
      { sound: 'w', word: 'wet', sentence: 'I get a wet rag.' },
    ],
  },
  {
    num: 5,
    title: 'The Yak and the Box',
    spellPractise: ['yak', 'box', 'six', 'zip', 'into'],
    grammar: [],
    hold: ['The yak is big!', 'I fix the box.'],
    listen: ['I get a box.', 'I zip it up.'],
    sounds: {
      graphemes: ['x', 'y', 'z'],
      words: ['box', 'yak', 'zip'],
      missing: [
        { word: 'box', hide: 'x' },
        { word: 'yak', hide: 'y' },
        { word: 'zip', hide: 'z' },
      ],
    },
    revisit: [
      { kind: 'rewrite', label: 'Write it with a capital letter', refs: [{ sourceUnit: 'G-L2.1', rowRef: 2 }] },
      { kind: 'rewrite', label: 'Write it with a full stop', refs: [{ sourceUnit: 'G-L2.2', rowRef: 1 }] },
      { kind: 'tick', label: 'Word or sentence?', refs: [{ sourceUnit: 'G-L2.4', rowRef: 4 }, { sourceUnit: 'G-L2.4', rowRef: 5 }] },
    ],
    bigWrite: { prompt: 'Look at the picture from the book. Write about it.', scene: '/storyart/l2_5/page3.png', pos: '50% 50%' },
    ladders: [
      { sound: 'x', word: 'six', sentence: 'I get a box.' },
      { sound: 'z', word: 'zip', sentence: 'I zip it up.' },
    ],
  },
];

export const L2_DATA: W2LevelData = {
  spec: W2_LEVEL_SPECS[2],
  books: BOOKS,
  swykA: [
    { kind: 'rewrite', label: 'Write it with a capital letter', refs: [{ sourceUnit: 'G-L2.1', rowRef: 0 }, { sourceUnit: 'G-L2.1', rowRef: 1 }] },
    { kind: 'rewrite', label: 'Write it with the word I', refs: [{ sourceUnit: 'G-L2.3', rowRef: 1 }] },
    { kind: 'tick', label: 'Word or sentence?', refs: [{ sourceUnit: 'G-L2.4', rowRef: 0 }, { sourceUnit: 'G-L2.4', rowRef: 1 }, { sourceUnit: 'G-L2.4', rowRef: 2 }, { sourceUnit: 'G-L2.4', rowRef: 3 }] },
  ],
  swykB: {
    groups: [
      { kind: 'rewrite', label: 'Write it with a full stop', refs: [{ sourceUnit: 'G-L2.2', rowRef: 0 }, { sourceUnit: 'G-L2.2', rowRef: 2 }] },
    ],
    writeTask: 'Write about the pup.',
    writeLines: 2,
  },
  swykAnswers: 'I can hop. Sam is in a box. I am on a mat. Word; Sentence; Word; Sentence. I am in a van. It is hot.',
  spellings: [
    { title: 'The Red Socks', words: ['sock', 'red', 'kick', 'peck', 'no', 'is'] },
    { title: 'Run, Pup, Run!', words: ['run', 'pup', 'hut', 'rub', 'go', 'is'] },
    { title: 'Fox Fell Off!', words: ['fox', 'fell', 'off', 'hill', 'no', 'to'] },
    { title: 'The Jam Jug', words: ['jam', 'jug', 'van', 'wet', 'to', 'into'] },
    { title: 'The Yak and the Box', words: ['yak', 'box', 'six', 'zip', 'into', 'go'] },
    { title: 'Half-term test', words: ['sock', 'run', 'fox', 'jam', 'box', 'no'] },
  ],
  grownUps: [
    { title: 'Sounds still lead', body: 'Level 2 finishes the first sounds. Use the sound books before each reading book; the Sounds page repeats the same letters in writing.' },
    { title: 'Little and often', body: 'One page a day, about five minutes, after the day\'s sound book or reading. Never push on to a second page.' },
    { title: 'The order matters', body: 'Each book\'s pages run in teaching order: Sounds, grammar, Sentences, Spell it, Big write, then Handwriting in its own slot.' },
    { title: 'Spell it works twice', body: 'Practise the words the day before the test. On test day, cover the top half and read the words from the Spelling words page.' },
    { title: 'The first one is done', body: 'On grammar pages the first item is completed in colour. Talk it through together before the child does the rest.' },
    { title: 'Listen and write', body: 'Read the sentence aloud twice. The child says it back, taps a finger per word, then writes it. The sentences are in the Answers.' },
    { title: 'The big write is a caption', body: 'The picture is the prompt. One or two lines is a win at this level.' },
    { title: 'The last week', body: 'Show what you know and the spelling check tell you if your child is ready for Level 3.' },
  ],
};
