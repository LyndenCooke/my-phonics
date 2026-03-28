/**
 * Interactive book page data for L1.1 "Tap! Tap! Tap!"
 *
 * Each page is described as structured data so the InteractiveBookReader
 * can render it with tappable words, phoneme breakdowns, activities, etc.
 */

export interface StoryWord {
  display: string;      // What appears on screen (may include punctuation)
  word: string;         // Clean word for audio lookup
  phonemes: string[];   // Phoneme breakdown  e.g. ["s","i","t"]
  isTricky?: boolean;   // "Tricky word" — learn by sight, not sounding out
}

export interface SpotlightItem {
  word: string;
  emoji: string;        // Placeholder for real images in future
  focusIndex: number;   // Index of the focus letter in the word
}

export type InteractivePage =
  | { type: 'cover'; title: string; subtitle: string; imageUrl: string }
  | { type: 'image_page'; imageUrl: string }
  | { type: 'sound_grid'; focusSounds: string[]; allSounds: string[]; storyWords: StoryWord[] }
  | { type: 'story'; sentences: string[]; words: StoryWord[]; imageUrl: string }
  | { type: 'sound_spotlight'; sound: string; items: SpotlightItem[] }
  | { type: 'word_reading'; words: StoryWord[] }
  | { type: 'tricky_words'; words: StoryWord[] }
  | { type: 'writing_practice'; letters: string[] }
  | { type: 'drawing'; prompt: string }
  | { type: 'nonsense_words'; words: StoryWord[] }
  | { type: 'certificate'; bookTitle: string };

// Helper: auto-split a simple CVC word into single-letter phonemes
function cvc(display: string, word: string): StoryWord {
  return { display, word, phonemes: word.split('') };
}

function tricky(display: string, word: string): StoryWord {
  return { display, word, phonemes: [], isTricky: true };
}

export const BOOK_L1_1_PAGES: InteractivePage[] = [
  // Page 1: Cover
  {
    type: 'cover',
    title: 'Tap! Tap! Tap!',
    subtitle: 'Level 1 · Starting Stories',
    imageUrl: '/book-pages/1_1/p1.jpg',
  },

  // Page 2: Guide for Grown-Ups (show as image)
  { type: 'image_page', imageUrl: '/book-pages/1_1/p2.jpg' },

  // Page 3: Sounds in This Book + Story Words
  {
    type: 'sound_grid',
    focusSounds: ['s', 'a', 't', 'p', 'i', 'n'],
    allSounds: [
      's','a','t','p','i','n',
      'm','d','g','o','c','k',
      'ck','e','u','r','h','b',
      'f','ff','l','ll','ss','j',
      'v','w','x','y','z','zz',
      'qu','ch','sh','th','ng','nk',
    ],
    storyWords: [
      cvc('sit', 'sit'), cvc('mat', 'mat'), cvc('tap', 'tap'),
      cvc('rat', 'rat'), cvc('bat', 'bat'), cvc('pat', 'pat'),
      cvc('cat', 'cat'), cvc('fat', 'fat'),
      { display: 'naps', word: 'naps', phonemes: ['n','a','p','s'] },
    ],
  },

  // Page 4: Story - "I sit at a mat. Tap, tap, tap!"
  {
    type: 'story',
    sentences: ['I sit at a mat.', 'Tap, tap, tap!'],
    words: [
      tricky('I', 'I'),
      cvc('sit', 'sit'),
      { display: 'at', word: 'at', phonemes: ['a','t'] },
      tricky('a', 'a'),
      cvc('mat.', 'mat'),
      cvc('Tap,', 'tap'),
      cvc('tap,', 'tap'),
      cvc('tap!', 'tap'),
    ],
    imageUrl: '/book-pages/1_1/p4.jpg',
  },

  // Page 5: Story - "Is it a rat? Is it a bat?"
  {
    type: 'story',
    sentences: ['Is it a rat?', 'Is it a bat?'],
    words: [
      { display: 'Is', word: 'is', phonemes: ['i','s'] },
      { display: 'it', word: 'it', phonemes: ['i','t'] },
      tricky('a', 'a'),
      cvc('rat?', 'rat'),
      { display: 'Is', word: 'is', phonemes: ['i','s'] },
      { display: 'it', word: 'it', phonemes: ['i','t'] },
      tricky('a', 'a'),
      cvc('bat?', 'bat'),
    ],
    imageUrl: '/book-pages/1_1/p5.jpg',
  },

  // Page 6: Story - "It is not a rat. It is not a bat."
  {
    type: 'story',
    sentences: ['It is not a rat.', 'It is not a bat.'],
    words: [
      { display: 'It', word: 'it', phonemes: ['i','t'] },
      { display: 'is', word: 'is', phonemes: ['i','s'] },
      { display: 'not', word: 'not', phonemes: ['n','o','t'] },
      tricky('a', 'a'),
      cvc('rat.', 'rat'),
      { display: 'It', word: 'it', phonemes: ['i','t'] },
      { display: 'is', word: 'is', phonemes: ['i','s'] },
      { display: 'not', word: 'not', phonemes: ['n','o','t'] },
      tricky('a', 'a'),
      cvc('bat.', 'bat'),
    ],
    imageUrl: '/book-pages/1_1/p6.jpg',
  },

  // Page 7: Story - "Tap, tap! I pat at it."
  {
    type: 'story',
    sentences: ['Tap, tap!', 'I pat at it.'],
    words: [
      cvc('Tap,', 'tap'),
      cvc('tap!', 'tap'),
      tricky('I', 'I'),
      cvc('pat', 'pat'),
      { display: 'at', word: 'at', phonemes: ['a','t'] },
      { display: 'it.', word: 'it', phonemes: ['i','t'] },
    ],
    imageUrl: '/book-pages/1_1/p7.jpg',
  },

  // Page 8: Story - "It is a cat! A fat cat!"
  {
    type: 'story',
    sentences: ['It is a cat!', 'A fat cat!'],
    words: [
      { display: 'It', word: 'it', phonemes: ['i','t'] },
      { display: 'is', word: 'is', phonemes: ['i','s'] },
      tricky('a', 'a'),
      cvc('cat!', 'cat'),
      tricky('A', 'a'),
      cvc('fat', 'fat'),
      cvc('cat!', 'cat'),
    ],
    imageUrl: '/book-pages/1_1/p8.jpg',
  },

  // Page 9: Story - "I pat the cat. The cat naps. I am happy!"
  {
    type: 'story',
    sentences: ['I pat the cat.', 'The cat naps.', 'I am happy!'],
    words: [
      tricky('I', 'I'),
      cvc('pat', 'pat'),
      tricky('the', 'the'),
      cvc('cat.', 'cat'),
      tricky('The', 'the'),
      cvc('cat', 'cat'),
      { display: 'naps.', word: 'naps', phonemes: ['n','a','p','s'] },
      tricky('I', 'I'),
      { display: 'am', word: 'am', phonemes: ['a','m'] },
      tricky('happy!', 'happy'),
    ],
    imageUrl: '/book-pages/1_1/p9.jpg',
  },

  // Pages 10-15: Sound Spotlights (s, a, t, p, i, n)
  {
    type: 'sound_spotlight',
    sound: 's',
    items: [
      { word: 'sun', emoji: '☀️', focusIndex: 0 },
      { word: 'sock', emoji: '🧦', focusIndex: 0 },
      { word: 'six', emoji: '6️⃣', focusIndex: 0 },
      { word: 'sad', emoji: '😢', focusIndex: 0 },
    ],
  },
  {
    type: 'sound_spotlight',
    sound: 'a',
    items: [
      { word: 'hat', emoji: '🎩', focusIndex: 1 },
      { word: 'cat', emoji: '🐱', focusIndex: 1 },
      { word: 'map', emoji: '🗺️', focusIndex: 1 },
      { word: 'van', emoji: '🚐', focusIndex: 1 },
    ],
  },
  {
    type: 'sound_spotlight',
    sound: 't',
    items: [
      { word: 'tin', emoji: '🥫', focusIndex: 0 },
      { word: 'tap', emoji: '🚰', focusIndex: 0 },
      { word: 'ten', emoji: '🔟', focusIndex: 0 },
      { word: 'tub', emoji: '🛁', focusIndex: 0 },
    ],
  },
  {
    type: 'sound_spotlight',
    sound: 'p',
    items: [
      { word: 'pig', emoji: '🐷', focusIndex: 0 },
      { word: 'pan', emoji: '🍳', focusIndex: 0 },
      { word: 'pin', emoji: '📌', focusIndex: 0 },
      { word: 'peg', emoji: '🪡', focusIndex: 0 },
    ],
  },
  {
    type: 'sound_spotlight',
    sound: 'i',
    items: [
      { word: 'bin', emoji: '🗑️', focusIndex: 1 },
      { word: 'dig', emoji: '⛏️', focusIndex: 1 },
      { word: 'fin', emoji: '🦈', focusIndex: 1 },
      { word: 'zip', emoji: '🤐', focusIndex: 1 },
    ],
  },
  {
    type: 'sound_spotlight',
    sound: 'n',
    items: [
      { word: 'net', emoji: '🥅', focusIndex: 0 },
      { word: 'nut', emoji: '🥜', focusIndex: 0 },
      { word: 'nap', emoji: '😴', focusIndex: 0 },
      { word: 'nod', emoji: '🙂', focusIndex: 0 },
    ],
  },

  // Page 16: Can You Read These Words?
  {
    type: 'word_reading',
    words: [
      cvc('sat', 'sat'),
      cvc('pat', 'pat'),
      cvc('tap', 'tap'),
      cvc('nap', 'nap'),
    ],
  },

  // Page 17: Tricky Words
  {
    type: 'tricky_words',
    words: [
      tricky('I', 'I'),
      tricky('a', 'a'),
      tricky('the', 'the'),
      tricky('is', 'is'),
      tricky('happy', 'happy'),
    ],
  },

  // Page 18: Writing Practice
  { type: 'writing_practice', letters: ['s', 'a', 't', 'p'] },

  // Page 19: Notes for Grown-Ups (image)
  { type: 'image_page', imageUrl: '/book-pages/1_1/p19.jpg' },

  // Page 20: Draw Your Favourite Part
  { type: 'drawing', prompt: 'Draw Your Favourite Part' },

  // Page 21: Nonsense Words Challenge
  {
    type: 'nonsense_words',
    words: [
      cvc('sap', 'sap'), cvc('tas', 'tas'), cvc('pim', 'pim'),
      cvc('nit', 'nit'), cvc('tib', 'tib'), cvc('pag', 'pag'),
      cvc('nas', 'nas'), cvc('sib', 'sib'), cvc('nat', 'nat'),
      cvc('pis', 'pis'), cvc('tup', 'tup'), cvc('sut', 'sut'),
    ],
  },

  // Page 22: Writing Practice (2nd set)
  { type: 'writing_practice', letters: ['i', 'n', 's', 'a'] },

  // Page 23: Certificate
  { type: 'certificate', bookTitle: 'Tap! Tap! Tap!' },

  // Page 24: Back Cover (image)
  { type: 'image_page', imageUrl: '/book-pages/1_1/p24.jpg' },
];

/** Map of sub-level keys to interactive page data (expandable to more books) */
export const INTERACTIVE_BOOKS: Record<string, InteractivePage[]> = {
  'L1.1': BOOK_L1_1_PAGES,
};

/** Check if interactive data exists for a given book sub-level */
export function hasInteractiveData(subLevel: string): boolean {
  return subLevel in INTERACTIVE_BOOKS;
}
