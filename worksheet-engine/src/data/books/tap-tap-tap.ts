import type { BookData } from '@/data/schema';

// ---------------------------------------------------------------------------
// Tap! Tap! Tap!  —  L1.1  —  Level 1 · Starting Stories
// Focus sounds: s a t p i n  (Set 1, no clusters)
// ---------------------------------------------------------------------------

const tapTapTap: BookData = {
  bookId: 'tap-tap-tap',
  bookTitle: 'Tap! Tap! Tap!',
  level: 1,
  levelLabel: 'L1.1',
  levelSubtitle: 'Level 1 · Starting Stories',

  focusSounds: ['s', 'a', 't', 'p', 'i', 'n'],

  decodableWords: [
    { word: 'tap', imageKey: 'tap' },
    { word: 'sat', imageKey: 'sat' },
    { word: 'pin', imageKey: 'pin' },
    { word: 'tin', imageKey: 'tin' },
    { word: 'nap', imageKey: 'nap' },
    { word: 'pan', imageKey: 'pan' },
    { word: 'ant', imageKey: 'ant' },
    { word: 'sit', imageKey: 'sit' },
  ],

  trickyWords: ['the', 'I'],

  sentences: ['Pat sat.', 'I tap the tin.', 'A pin is in the pan.'],

  comprehensionPrompts: [
    'What did Pat tap?',
    'Draw your favourite part of the story.',
  ],

  grammarGoals: ['Spaces between words', 'A capital letter to start'],
  writingGoals: ['Form s, a, t, p, i, n on the line', 'Write a CVC word from a picture'],

  activityTypes: [
    'trace-sounds',
    'sound-spotting',
    'match-picture-word',
    'missing-sound',
    'sort-by-sound',
    'cut-and-stick',
    'read-and-tick',
    'sentence-builder',
    'draw-and-write',
    'challenge',
  ],

  config: {
    // Sort the decodable words by their INITIAL sound into 3 clean bins.
    sortBins: [
      { sound: 's', words: ['sat', 'sit'] },
      { sound: 't', words: ['tap', 'tin'] },
      { sound: 'p', words: ['pin', 'pan'] },
    ],
    matchWords: ['tap', 'pin', 'pan', 'ant'],
    // "Label the picture" — write the whole CVC word (only words with clipart).
    labelWords: ['tap', 'pin', 'pan', 'tin', 'ant'],
    // Read-and-tick: which clipart words to test (correct + auto distractors).
    tickWords: ['tap', 'pin', 'pan', 'tin', 'ant'],
    // Alien words: nonsense CVCs built only from s a t p i n, none a real word.
    alienWords: ['tas', 'nas', 'tis', 'nis', 'pis', 'sas'].filter((w) =>
      [...w].every((ch) => 'satpin'.includes(ch)),
    ),
  },
};

export default tapTapTap;
