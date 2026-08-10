// ---------------------------------------------------------------------------
// L5 WORKBOOK — New Spellings (Blue). Five books; split digraphs and the
// first alternative spellings. All sentences are VERBATIM book text; words
// come from the books' word lists + the L5 tricky words. Grammar per the
// master plan: B1 5.1 · B2 5.2 · B3 5.3 · B4 5.4 · B5 5.5 + 5.6.
// ---------------------------------------------------------------------------

import type { W2LevelData, W2BookData } from '@/data/workbook2/levels';
import { W2_LEVEL_SPECS } from '@/data/workbook2/levels';

const PROMPT = 'Look at this moment from the book. Write what happens next.';

const BOOKS: W2BookData[] = [
  {
    num: 1,
    title: 'The Big Bike Race',
    spellPractise: ['ride', 'bike', 'gate', 'lake', 'made', 'brave'],
    grammar: ['g-l5-1'],
    hold: ['I grip my bike tight.', 'I can see the lake!'],
    listen: ['I made it!', 'I ride and ride.'],
    questions: ['What did I ride to and from?', 'Did I win a prize?', 'Was it a good day?'],
    useGrammar: { chips: ['so', 'like', 'ride', 'bike', 'lake'], scene: '/storyart/l5_1/page3.png', pos: '50% 45%' },
    bigWrite: { prompt: PROMPT, scene: '/storyart/l5_1/page7.png', pos: '50% 45%' },
    ladders: [
      { sound: 'i-e', word: 'ride', sentence: 'I ride and ride.' },
      { sound: 'a-e', word: 'gate', sentence: 'I am past the line!' },
    ],
  },
  {
    num: 2,
    title: 'Lost at the Night Market',
    spellPractise: ['close', 'huge', 'stone', 'spoke', 'when', 'there'],
    grammar: ['g-l5-2'],
    hold: ['It was huge!', 'Mum must be close!'],
    listen: ['I felt so small.', 'I did not let go.'],
    questions: ['What did I lose at the night market?', 'Did I feel small and scared?', 'Did Mum give me a huge hug at the end?'],
    useGrammar: { chips: ['when', 'there', 'huge', 'close', 'stone'], scene: '/storyart/l5_2/page2.png', pos: '50% 50%' },
    bigWrite: {
      prompt: 'Number the pictures 1 to 4 in story order. Then write the story. Use First, Next, Then and Last.',
      scene: '/storyart/l5_2/page7.png',
      scenes: [
        { src: '/storyart/l5_2/page5.png' },
        { src: '/storyart/l5_2/page1.png' },
        { src: '/storyart/l5_2/page8.png' },
        { src: '/storyart/l5_2/page3.png' },
      ],
    },
    ladders: [
      { sound: 'u-e', word: 'huge', sentence: 'It was huge!' },
      { sound: 'o-e', word: 'stone', sentence: 'Mum must be close!' },
    ],
  },
  {
    num: 3,
    title: 'The Dream Team',
    spellPractise: ['clean', 'team', 'reach', 'feast', 'tries', 'spies'],
    grammar: ['g-l5-3'],
    hold: ['We each grab a cloth.', 'Nana grins and grins.'],
    listen: ['She looks so tired.', 'What a treat!'],
    questions: ['What did Nana need help with?', 'Did we clean the tins and line them up?', 'What treat did Nana make for us?'],
    useGrammar: { chips: ['some', 'have', 'clean', 'team', 'reach'], scene: '/storyart/l5_3/page4.png', pos: '50% 50%' },
    revisit: [
      { kind: 'build', label: 'Double the letter, then add the ending', refs: [{ sourceUnit: 'G-L5.1', rowRef: 2 }, { sourceUnit: 'G-L5.1', rowRef: 3 }] },
      { kind: 'match', label: 'Add the prefix un-', refs: [{ sourceUnit: 'G-L5.2', rowRef: 1 }, { sourceUnit: 'G-L5.2', rowRef: 3 }] },
    ],
    bigWrite: { prompt: PROMPT, scene: '/storyart/l5_3/page8.png', pos: '50% 45%' },
    ladders: [
      { sound: 'ea', word: 'clean', sentence: 'What a treat!' },
      { sound: 'ie', word: 'tries', sentence: 'She tried to grin.' },
    ],
  },
  {
    num: 4,
    title: 'What Min Saw',
    spellPractise: ['coin', 'point', 'soil', 'join', 'saw', 'hawk'],
    grammar: ['g-l5-4'],
    hold: ['Min saw a big red bus zoom past.', 'She smiled at Mum.'],
    listen: ['Min was so glad.', 'Min looked up.'],
    questions: ['What did Min see at the park?', 'What did Min find in the stream?', 'Did Min see a hawk fly past?'],
    useGrammar: { chips: ['saw', 'coin', 'soil', 'hawk', 'paw'], scene: '/storyart/l5_4/page3.png', pos: '50% 50%' },
    bigWrite: {
      prompt: 'Number the pictures 1 to 4 in story order. Then write the story. Use First, Next, Then and Last.',
      scene: '/storyart/l5_4/page6.png',
      scenes: [
        { src: '/storyart/l5_4/page5.png' },
        { src: '/storyart/l5_4/page1.png' },
        { src: '/storyart/l5_4/page8.png' },
        { src: '/storyart/l5_4/page3.png' },
      ],
    },
    ladders: [
      { sound: 'aw', word: 'saw', sentence: 'Min was so glad.' },
      { sound: 'oi', word: 'coin', sentence: 'Min still had her coin.' },
    ],
  },
  {
    num: 5,
    title: 'The Boat with the Red Sail',
    spellPractise: ['rain', 'sail', 'boat', 'coat', 'road', 'snail'],
    grammar: ['g-l5-5', 'g-l5-6'],
    hold: ['It has a big red sail!', 'His coat is soaked in mud.'],
    listen: ['It is Dad!', 'Kai spots the red sail!'],
    questions: ['What did Kai see out at sea?', 'Did Kai fall in the mud?', 'Was it Dad on the boat?'],
    useGrammar: { chips: ['big', 'red', 'soft', 'boat', 'sail'], scene: '/storyart/l5_5/page2.png', pos: '50% 50%' },
    bigWrite: { prompt: PROMPT, scene: '/storyart/l5_5/page7.png', pos: '50% 40%' },
    ladders: [
      { sound: 'ai', word: 'sail', sentence: 'Kai spots the red sail!' },
      { sound: 'oa', word: 'coat', sentence: 'His coat is soaked in mud.' },
    ],
  },
];

export const L5_DATA: W2LevelData = {
  spec: W2_LEVEL_SPECS[5],
  books: BOOKS,
  swykA: [
    { kind: 'build', label: 'Double the letter, then add the ending', refs: [{ sourceUnit: 'G-L5.1', rowRef: 0 }, { sourceUnit: 'G-L5.1', rowRef: 1 }] },
    { kind: 'rewrite', label: 'Write it with commas in the list', refs: [{ sourceUnit: 'G-L5.3', rowRef: 1 }, { sourceUnit: 'G-L5.3', rowRef: 2 }] },
    { kind: 'match', label: 'Add the prefix un-', refs: [{ sourceUnit: 'G-L5.2', rowRef: 0 }, { sourceUnit: 'G-L5.2', rowRef: 2 }] },
  ],
  swykB: {
    groups: [
      { kind: 'circle', label: 'Circle the noun. Underline the verb', refs: [{ sourceUnit: 'G-L5.5', rowRef: 0 }, { sourceUnit: 'G-L5.5', rowRef: 1 }] },
      { kind: 'build', label: 'Build the noun phrase', refs: [{ sourceUnit: 'G-L5.6', rowRef: 1 }] },
    ],
    writeTask: 'Write three sentences about the boat. Use First, Next and Then.',
    writeLines: 3,
  },
  swykAnswers: 'hopped; buzzing. We saw a duck, a hen, a pig. He got a cup, a bun, a jam. unkind; unzip. dog runs; duck quacks. the wet fox.',
  spellings: [
    { title: 'The Big Bike Race', words: ['ride', 'bike', 'gate', 'lake', 'made', 'brave', 'like', 'so', 'have', 'one'] },
    { title: 'Lost at the Night Market', words: ['close', 'huge', 'stone', 'spoke', 'when', 'there', 'said', 'come', 'were', 'out'] },
    { title: 'The Dream Team', words: ['clean', 'team', 'reach', 'feast', 'tries', 'spies', 'some', 'little', 'do', 'what'] },
    { title: 'What Min Saw', words: ['coin', 'point', 'soil', 'join', 'saw', 'hawk', 'claw', 'paw', 'when', 'there'] },
    { title: 'The Boat with the Red Sail', words: ['rain', 'sail', 'boat', 'coat', 'road', 'snail', 'trail', 'toast', 'said', 'out'] },
    { title: 'Half-term test', words: ['ride', 'huge', 'clean', 'coin', 'boat', 'when', 'there', 'some', 'said', 'what'] },
  ],
  grownUps: [
    { title: 'Little and often', body: 'One page a day, about five minutes, after the day\'s reading or sound book. Never push on to a second page.' },
    { title: 'The order matters', body: 'Each book\'s pages run in teaching order: grammar, Sentences, Answer it, Use your grammar, Spell it, Big write, then Handwriting in its own slot.' },
    { title: 'Spell it works twice', body: 'Practise the words the day before the test. On test day, cover the top half and read the words from the Spelling words page.' },
    { title: 'The first one is done', body: 'On grammar pages the first item is completed in colour. Talk it through together before the child does the rest.' },
    { title: 'Listen and write', body: 'Read the sentence aloud twice. The child says it back, taps a finger per word, then writes it. The sentences are in the Answers.' },
    { title: 'The big write is the win', body: 'The picture is the prompt. Try First, Next and Then to order the ideas; check the writing goals together.' },
    { title: 'Handwriting', body: 'The child traces the grey writing and keeps going to the end of each line. Pre-cursive flicks begin here; little and neat beats lots and rushed.' },
    { title: 'The last week', body: 'Show what you know and the half-term test are a check, not an exam. Secure here means ready for Level 6.' },
  ],
};
