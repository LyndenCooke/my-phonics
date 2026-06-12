// ---------------------------------------------------------------------------
// L4 WORKBOOK — Longer Sounds (Green). Six books across the six weeks; the
// reading books take over from the sound books, so the Sounds page retires
// and Use your grammar arrives. All sentences are VERBATIM book text; words
// come from the books' word lists + the L4 tricky words (was, my, you, they,
// her, all, are). Book six is the round-up: Fix and answer replaces new
// grammar. Grammar distribution per the master plan: B1 4.1 · B2 4.2 ·
// B3 4.4 · B4 4.3 · B5 4.5 · B6 revisit.
// ---------------------------------------------------------------------------

import type { W2LevelData, W2BookData } from '@/data/workbook2/levels';
import { W2_LEVEL_SPECS } from '@/data/workbook2/levels';

const PROMPT = 'Look at this moment from the book. Write what happens next.';

const BOOKS: W2BookData[] = [
  {
    num: 1,
    title: 'The Night Light',
    spellPractise: ['high', 'day', 'light', 'see', 'night', 'my'],
    grammar: ['g-l4-1'],
    hold: ['I need a light.', 'I see my toy cat!'],
    listen: ['It is night.', 'I hug my toy cat.'],
    questions: [null, null, null],
    useGrammar: { chips: ['and', 'day', 'night', 'see', 'light'], scene: '/storyart/l4_1/page3.png', pos: '50% 45%' },
    bigWrite: { prompt: PROMPT, scene: '/storyart/l4_1/page7.png', pos: '50% 45%' },
    ladders: [
      { sound: 'igh', word: 'light', sentence: 'I need a light.' },
      { sound: 'ee', word: 'see', sentence: 'I can see in the shop.' },
    ],
  },
  {
    num: 2,
    title: 'Moo at the Zoo',
    spellPractise: ['zoo', 'cow', 'owl', 'moo', 'cool', 'you'],
    grammar: ['g-l4-2'],
    hold: ['I look at the cow.', 'I see a cool pool.'],
    listen: ['I look up.', 'The owl bows at me.'],
    questions: [null, null, null],
    useGrammar: { chips: ['and', 'zoo', 'owl', 'cool', 'moo'], scene: '/storyart/l4_2/page4.png', pos: '50% 50%' },
    bigWrite: { prompt: PROMPT, scene: '/storyart/l4_2/page7.png', pos: '50% 40%' },
    ladders: [
      { sound: 'oo', word: 'zoo', sentence: 'I see a cool pool.' },
      { sound: 'ow', word: 'cow', sentence: 'The owl bows at me.' },
    ],
  },
  {
    num: 3,
    title: 'Morning on the Farm',
    spellPractise: ['farm', 'barn', 'corn', 'dark', 'torch', 'they'],
    grammar: ['g-l4-4'],
    hold: ['The farm is big!', 'I get a torch for the dark.'],
    listen: ['Now it is dark.', 'I can see a farm!'],
    questions: [null, null, null],
    useGrammar: { chips: ['and', 'farm', 'barn', 'corn', 'dark'], scene: '/storyart/l4_3/page5.png', pos: '50% 50%' },
    bigWrite: { prompt: PROMPT, scene: '/storyart/l4_3/page7.png', pos: '50% 50%' },
    ladders: [
      { sound: 'ar', word: 'farm', sentence: 'It is dark in the barn.' },
      { sound: 'or', word: 'corn', sentence: 'Good food for the farm.' },
    ],
  },
  {
    num: 4,
    title: 'The Fair in the Air',
    spellPractise: ['fair', 'air', 'pair', 'hair', 'sir', 'was'],
    grammar: ['g-l4-3'],
    hold: ['The air is cool.', 'I win the pair!'],
    listen: ['I go to the fair!', 'I sit in a chair.'],
    questions: [null, null, null],
    useGrammar: { chips: ['and', 'fair', 'air', 'pair', 'hair'], scene: '/storyart/l4_4/page2.png', pos: '50% 45%' },
    bigWrite: { prompt: PROMPT, scene: '/storyart/l4_4/page5.png', pos: '50% 40%' },
    ladders: [
      { sound: 'air', word: 'fair', sentence: 'I go to the fair!' },
      { sound: 'ir', word: 'sir', sentence: 'I sit in a chair.' },
    ],
  },
  {
    num: 5,
    title: 'Round and Round',
    spellPractise: ['out', 'shout', 'loud', 'toy', 'joy', 'boy'],
    grammar: ['g-l4-5'],
    hold: ['I went out with my toy car.', 'It got loud!'],
    listen: ['But it ran too far!', 'I shouted out loud.'],
    questions: [null, null, null],
    useGrammar: { chips: ['and', 'out', 'loud', 'toy', 'joy'], scene: '/storyart/l4_5/page2.png', pos: '50% 50%' },
    bigWrite: { prompt: PROMPT, scene: '/storyart/l4_5/page7.png', pos: '50% 45%' },
    ladders: [
      { sound: 'ou', word: 'out', sentence: 'I shouted out loud.' },
      { sound: 'oy', word: 'toy', sentence: 'My toy!' },
    ],
  },
  {
    num: 6,
    title: 'The Night Fair',
    spellPractise: ['night', 'fair', 'cool', 'moon', 'corn', 'shout'],
    grammar: [],
    hold: ['I see lots of lamps.', 'The moon is low and round.'],
    listen: ['It is night!', 'The air is cool.'],
    questions: [null, null, null],
    useGrammar: { chips: ['and', 'night', 'fair', 'moon', 'cool'], scene: '/storyart/l4_6/page3.png', pos: '50% 50%' },
    revisit: [
      { kind: 'rewrite', label: 'Join the two ideas with and', refs: [{ sourceUnit: 'G-L4.1', rowRef: 2 }] },
      { kind: 'tick', label: 'Choose the end mark', refs: [{ sourceUnit: 'G-L4.2', rowRef: 0 }, { sourceUnit: 'G-L4.2', rowRef: 1 }] },
      { kind: 'match', label: 'One and more than one', refs: [{ sourceUnit: 'G-L4.4', rowRef: 0 }, { sourceUnit: 'G-L4.4', rowRef: 2 }] },
    ],
    bigWrite: { prompt: PROMPT, scene: '/storyart/l4_6/page7.png', pos: '50% 45%' },
    ladders: [
      { sound: 'igh', word: 'night', sentence: 'It is night!' },
      { sound: 'oo', word: 'moon', sentence: 'The air is cool.' },
    ],
  },
];

export const L4_DATA: W2LevelData = {
  spec: W2_LEVEL_SPECS[4],
  books: BOOKS,
  swykA: [
    { kind: 'rewrite', label: 'Join the two ideas with and', refs: [{ sourceUnit: 'G-L4.1', rowRef: 0 }, { sourceUnit: 'G-L4.1', rowRef: 1 }] },
    { kind: 'rewrite', label: 'Write the day with a capital letter', refs: [{ sourceUnit: 'G-L4.3', rowRef: 0 }] },
    { kind: 'tick', label: 'Choose the end mark', refs: [{ sourceUnit: 'G-L4.2', rowRef: 1 }, { sourceUnit: 'G-L4.2', rowRef: 2 }, { sourceUnit: 'G-L4.2', rowRef: 3 }, { sourceUnit: 'G-L4.2', rowRef: 4 }] },
  ],
  swykB: {
    groups: [
      { kind: 'match', label: 'One and more than one', refs: [{ sourceUnit: 'G-L4.4', rowRef: 1 }, { sourceUnit: 'G-L4.4', rowRef: 3 }] },
      { kind: 'build', label: 'Add the ending', refs: [{ sourceUnit: 'G-L4.5', rowRef: 1 }] },
    ],
    writeTask: 'Write two sentences about the fair. Use and.',
    writeLines: 3,
  },
  swykAnswers: 'The cat is big and soft. I jump and sing. Tuesday. End marks: . ! ? . foxes; wishes; buzzing.',
  spellings: [
    { title: 'The Night Light', words: ['high', 'day', 'light', 'see', 'night', 'my', 'was', 'all'] },
    { title: 'Moo at the Zoo', words: ['zoo', 'cow', 'owl', 'moo', 'cool', 'you', 'they', 'are'] },
    { title: 'Morning on the Farm', words: ['farm', 'barn', 'corn', 'dark', 'torch', 'they', 'her', 'was'] },
    { title: 'The Fair in the Air', words: ['fair', 'air', 'pair', 'hair', 'sir', 'was', 'my', 'all'] },
    { title: 'Round and Round', words: ['out', 'shout', 'loud', 'toy', 'joy', 'boy', 'you', 'are'] },
    { title: 'The Night Fair', words: ['night', 'fair', 'cool', 'moon', 'corn', 'shout', 'her', 'they'] },
    { title: 'Half-term test', words: ['light', 'zoo', 'farm', 'fair', 'out', 'moon', 'was', 'they'] },
  ],
  grownUps: [
    { title: 'Little and often', body: 'One page a day, about five minutes, after the day\'s reading or sound book. Never push on to a second page.' },
    { title: 'The order matters', body: 'Each book\'s pages run in teaching order: grammar, Sentences, Answer it, Use your grammar, Spell it, Big write, then Handwriting in its own slot.' },
    { title: 'Spell it works twice', body: 'Practise the words the day before the test. On test day, cover the top half and read the words from the Spelling words page.' },
    { title: 'The first one is done', body: 'On grammar pages the first item is completed in colour. Talk it through together before the child does the rest.' },
    { title: 'Listen and write', body: 'Read the sentence aloud twice. The child says it back, taps a finger per word, then writes it. The sentences are in the Answers.' },
    { title: 'The big write is the win', body: 'The picture is the prompt. Spelling mistakes are fine here; ideas first, then check against the writing goals together.' },
    { title: 'Handwriting', body: 'The child traces the grey writing and keeps going to the end of each line. Little and neat beats lots and rushed.' },
    { title: 'The last week', body: 'Show what you know and the half-term test are a check, not an exam. Secure here means ready for Level 5.' },
  ],
};
