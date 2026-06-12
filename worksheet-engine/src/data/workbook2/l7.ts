// ---------------------------------------------------------------------------
// L7 WORKBOOK — Reading Together (Purple). Four books; late Phase 5
// trigraphs and richer sentences. All sentences are VERBATIM book text;
// words come from the books' word lists + the L7 tricky words. Grammar per
// the master plan: B1 7.1 · B2 7.2 · B3 7.3 + 7.4 · B4 7.5 + 7.6.
//
// Ladder note: two sentences carry the nearest verbatim fit rather than the
// target grapheme (no short enough oor/ure sentence exists in the books) —
// flagged in the selections record.
// ---------------------------------------------------------------------------

import type { W2LevelData, W2BookData } from '@/data/workbook2/levels';
import { W2_LEVEL_SPECS } from '@/data/workbook2/levels';

const PROMPT = 'Look at this moment from the book. Write what happens next.';

const BOOKS: W2BookData[] = [
  {
    num: 1,
    title: 'Before the Shore',
    spellPractise: ['shore', 'fire', 'wire', 'more', 'before', 'explore'],
    grammar: ['g-l7-1'],
    hold: ['The stone felt cool in his hand.', 'He found more and more shells!'],
    listen: ['He picked it up.', 'Now he had a pair!'],
    questions: [null, null, null],
    useGrammar: { chips: ['more', 'before', 'shore', 'fire', 'wire'], scene: '/storyart/l7_1/page3.png', pos: '50% 45%' },
    bigWrite: { prompt: PROMPT, scene: '/storyart/l7_1/page7.png', pos: '50% 45%' },
    ladders: [
      { sound: 'ore', word: 'shore', sentence: 'He found more and more shells!' },
      { sound: 'ire', word: 'wire', sentence: 'He twisted the wire with care.' },
    ],
  },
  {
    num: 2,
    title: 'Near the Door',
    spellPractise: ['hear', 'near', 'dear', 'fear', 'door', 'floor'],
    grammar: ['g-l7-2'],
    hold: ['I crept near.', 'He stood near me and did not run.'],
    listen: ['I kept still.', 'I spoke clear and slow.'],
    questions: [null, null, null],
    useGrammar: { chips: ['their', 'there', 'here', 'hear', 'near'], scene: '/storyart/l7_2/page3.png', pos: '50% 50%' },
    bigWrite: { prompt: PROMPT, scene: '/storyart/l7_2/page7.png', pos: '50% 45%' },
    ladders: [
      { sound: 'ear', word: 'near', sentence: 'I crept near.' },
      { sound: 'oor', word: 'door', sentence: 'I spoke soft and clear.' },
    ],
  },
  {
    num: 3,
    title: 'Sure She Can!',
    spellPractise: ['sure', 'pure', 'section', 'action', 'direction', 'attention'],
    grammar: ['g-l7-3', 'g-l7-4'],
    hold: ['But the paper slipped.', 'At last, the kite was done.'],
    listen: ['Her heart sank.', 'It flew higher and higher!'],
    questions: [null, null, null],
    useGrammar: { chips: ['sure', 'pure', 'action', 'direction', 'attention'], scene: '/storyart/l7_3/page2.png', pos: '50% 45%' },
    bigWrite: { prompt: PROMPT, scene: '/storyart/l7_3/page8.png', pos: '50% 40%' },
    ladders: [
      { sound: 'ure', word: 'pure', sentence: 'It flew higher and higher!' },
      { sound: 'tion', word: 'section', sentence: 'At last, the kite was done.' },
    ],
  },
  {
    num: 4,
    title: 'A Place for Me',
    spellPractise: ['shore', 'floor', 'explore', 'near', 'fear', 'sure'],
    grammar: ['g-l7-5', 'g-l7-6'],
    hold: ['We went from section to section.', 'Dad picked me up and held me tight.'],
    listen: ['I looked left.', 'I was alone.'],
    questions: [null, null, null],
    useGrammar: { chips: ['near', 'fear', 'sure', 'section', 'direction'], scene: '/storyart/l7_4/page4.png', pos: '50% 45%' },
    bigWrite: { prompt: PROMPT, scene: '/storyart/l7_4/page8.png', pos: '50% 45%' },
    ladders: [
      { sound: 'ear', word: 'fear', sentence: 'I felt a fear in my chest.' },
      { sound: 'tion', word: 'direction', sentence: 'He knew the direction to go.' },
    ],
  },
];

export const L7_DATA: W2LevelData = {
  spec: W2_LEVEL_SPECS[7],
  books: BOOKS,
  swykA: [
    { kind: 'rewrite', label: 'Add the possessive apostrophe', refs: [{ sourceUnit: 'G-L7.1', rowRef: 0 }, { sourceUnit: 'G-L7.1', rowRef: 1 }] },
    { kind: 'rewrite', label: 'Write it with was and -ing', refs: [{ sourceUnit: 'G-L7.4', rowRef: 1 }] },
    { kind: 'cloze', label: 'Choose the right homophone', refs: [{ sourceUnit: 'G-L7.2', rowRef: 0 }, { sourceUnit: 'G-L7.2', rowRef: 1 }, { sourceUnit: 'G-L7.2', rowRef: 2 }, { sourceUnit: 'G-L7.2', rowRef: 3 }] },
  ],
  swykB: {
    groups: [
      { kind: 'tick', label: 'Sort the suffix', refs: [{ sourceUnit: 'G-L7.5', rowRef: 2 }, { sourceUnit: 'G-L7.5', rowRef: 3 }] },
      { kind: 'rewrite', label: 'Write it with was and -ing', refs: [{ sourceUnit: 'G-L7.4', rowRef: 0 }] },
    ],
    writeTask: 'Write three sentences about the kite. Use First, Next and Then.',
    writeLines: 3,
  },
  swykAnswers: "That is Tim's bag. This is Meg's cat. She was playing with the dog. there; their; hear; here. -less; -ly. He was jumping in the pond.",
  spellings: [
    { title: 'Before the Shore', words: ['shore', 'fire', 'wire', 'more', 'before', 'explore', 'door', 'because', 'only', 'old'] },
    { title: 'Near the Door', words: ['hear', 'near', 'dear', 'fear', 'door', 'floor', 'poor', 'behind', 'cold', 'every'] },
    { title: 'Sure She Can!', words: ['sure', 'pure', 'section', 'action', 'direction', 'attention', 'kind', 'find', 'great', 'after'] },
    { title: 'A Place for Me', words: ['shore', 'floor', 'explore', 'near', 'fear', 'sure', 'children', 'most', 'both', 'pretty'] },
    { title: 'Half-term test', words: ['shore', 'near', 'door', 'sure', 'section', 'because', 'children', 'every', 'only', 'find'] },
  ],
  grownUps: [
    { title: 'Little and often', body: 'One page a day, about five minutes, after the day\'s reading or sound book. Never push on to a second page.' },
    { title: 'The order matters', body: 'Each book\'s pages run in teaching order: grammar, Sentences, Answer it, more grammar, Use your grammar, Spell it, Big write, then Handwriting in its own slot.' },
    { title: 'Spell it works twice', body: 'Practise the words the day before the test. On test day, cover the top half and read the words from the Spelling words page.' },
    { title: 'The first one is done', body: 'On grammar pages the first item is completed in colour. Talk it through together before the child does the rest.' },
    { title: 'Listen and write', body: 'Read the sentence aloud twice. The child says it back, taps a finger per word, then writes it. The sentences are in the Answers.' },
    { title: 'The big write grows', body: 'The picture is the prompt. Aim for a little recount: First, Next, Then. Check the writing goals together.' },
    { title: 'Handwriting', body: 'The child traces the grey writing and keeps going to the end of each line. Joining is settling in now.' },
    { title: 'The last week', body: 'Show what you know and the half-term test are a check, not an exam. Secure here means ready for Level 8.' },
  ],
};
