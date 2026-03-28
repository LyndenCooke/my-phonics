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

export interface OrderingItem {
  imageUrl: string;
  label: string;        // Short label shown below image
  correctIndex: number; // 0-based correct position in story order
}

export interface QuizQuestion {
  question: string;
  imageUrl?: string;      // Optional image for the question
  options: { label: string; emoji?: string; isCorrect: boolean }[];
}

export interface SpellingWord {
  word: string;
  emoji: string;
  letters: string[];      // The letters to drag into place
}

export type InteractivePage =
  | { type: 'cover'; title: string; subtitle: string; imageUrl: string }
  | { type: 'sound_grid'; focusSounds: string[]; allSounds: string[]; storyWords: StoryWord[] }
  | { type: 'story'; sentences: string[]; words: StoryWord[]; imageUrl: string; audioUrl?: string }
  | { type: 'sound_spotlight'; sound: string; items: SpotlightItem[] }
  | { type: 'word_reading'; words: StoryWord[] }
  | { type: 'tricky_words'; words: StoryWord[] }
  | { type: 'writing_practice'; letters: string[] }
  | { type: 'drawing'; prompt: string }
  | { type: 'nonsense_words'; words: StoryWord[] }
  | { type: 'story_ordering'; items: OrderingItem[] }
  | { type: 'quiz'; questions: QuizQuestion[] }
  | { type: 'spelling'; words: SpellingWord[] }
  | { type: 'certificate'; bookTitle: string };

// Helper: auto-split a simple CVC word into single-letter phonemes
function cvc(display: string, word: string): StoryWord {
  return { display, word, phonemes: word.split('') };
}

function tricky(display: string, word: string): StoryWord {
  return { display, word, phonemes: [], isTricky: true };
}

export const BOOK_L1_1_PAGES: InteractivePage[] = [
  // ── 1. COVER ──
  {
    type: 'cover',
    title: 'Tap! Tap! Tap!',
    subtitle: 'Level 1 · Starting Stories',
    imageUrl: '/illustrations/1_1/cover.png',
  },

  // ── 2. FOCUS SOUNDS (before the story — let them practise) ──
  {
    type: 'sound_grid',
    focusSounds: ['s', 'a', 't', 'p', 'i', 'n'],
    allSounds: ['s', 'a', 't', 'p', 'i', 'n'],
    storyWords: [
      cvc('sit', 'sit'), cvc('mat', 'mat'), cvc('tap', 'tap'),
      cvc('rat', 'rat'), cvc('bat', 'bat'), cvc('pat', 'pat'),
      cvc('cat', 'cat'), cvc('fat', 'fat'),
      { display: 'naps', word: 'naps', phonemes: ['n','a','p','s'] },
    ],
  },

  // ── 3-8. STORY PAGES ──
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
    imageUrl: '/illustrations/1_1/page1.png',
    audioUrl: '/sounds/sentences/L1_1_p1.mp3',
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
    imageUrl: '/illustrations/1_1/page2.png',
    audioUrl: '/sounds/sentences/L1_1_p2.mp3',
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
    imageUrl: '/illustrations/1_1/page3.png',
    audioUrl: '/sounds/sentences/L1_1_p3.mp3',
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
    imageUrl: '/illustrations/1_1/page4.png',
    audioUrl: '/sounds/sentences/L1_1_p4.mp3',
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
    imageUrl: '/illustrations/1_1/page5.png',
    audioUrl: '/sounds/sentences/L1_1_p5.mp3',
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
    imageUrl: '/illustrations/1_1/page6.png',
    audioUrl: '/sounds/sentences/L1_1_p6.mp3',
  },

  // ── 8. COMPREHENSION QUIZ (while story is fresh) ──
  {
    type: 'quiz',
    questions: [
      { question: 'What animal is in the story?',
        options: [{ label: 'cat', emoji: '🐱', isCorrect: true }, { label: 'dog', emoji: '🐶', isCorrect: false }, { label: 'fish', emoji: '🐟', isCorrect: false }] },
      { question: 'What does the cat do at the end?',
        options: [{ label: 'naps', emoji: '😴', isCorrect: true }, { label: 'runs', emoji: '🏃', isCorrect: false }, { label: 'sits', emoji: '🪑', isCorrect: false }] },
      { question: 'Is the cat thin or fat?',
        options: [{ label: 'fat', emoji: '🐱', isCorrect: true }, { label: 'thin', emoji: '🐈', isCorrect: false }] },
    ],
  },

  // ── 10-15. SOUND SPOTLIGHTS ──
  { type: 'sound_spotlight', sound: 's', items: [
    { word: 'sun', emoji: '☀️', focusIndex: 0 }, { word: 'sock', emoji: '🧦', focusIndex: 0 },
    { word: 'six', emoji: '6️⃣', focusIndex: 0 }, { word: 'sad', emoji: '😢', focusIndex: 0 }] },
  { type: 'sound_spotlight', sound: 'a', items: [
    { word: 'hat', emoji: '🎩', focusIndex: 1 }, { word: 'cat', emoji: '🐱', focusIndex: 1 },
    { word: 'map', emoji: '🗺️', focusIndex: 1 }, { word: 'van', emoji: '🚐', focusIndex: 1 }] },
  { type: 'sound_spotlight', sound: 't', items: [
    { word: 'tin', emoji: '🥫', focusIndex: 0 }, { word: 'tap', emoji: '🚰', focusIndex: 0 },
    { word: 'ten', emoji: '🔟', focusIndex: 0 }, { word: 'tub', emoji: '🛁', focusIndex: 0 }] },
  { type: 'sound_spotlight', sound: 'p', items: [
    { word: 'pig', emoji: '🐷', focusIndex: 0 }, { word: 'pan', emoji: '🍳', focusIndex: 0 },
    { word: 'pin', emoji: '📌', focusIndex: 0 }, { word: 'peg', emoji: '🪡', focusIndex: 0 }] },
  { type: 'sound_spotlight', sound: 'i', items: [
    { word: 'bin', emoji: '🗑️', focusIndex: 1 }, { word: 'dig', emoji: '⛏️', focusIndex: 1 },
    { word: 'fin', emoji: '🦈', focusIndex: 1 }, { word: 'zip', emoji: '🤐', focusIndex: 1 }] },
  { type: 'sound_spotlight', sound: 'n', items: [
    { word: 'net', emoji: '🥅', focusIndex: 0 }, { word: 'nut', emoji: '🥜', focusIndex: 0 },
    { word: 'nap', emoji: '😴', focusIndex: 0 }, { word: 'nod', emoji: '🙂', focusIndex: 0 }] },

  // ── 16. WORD READING ──
  { type: 'word_reading', words: [cvc('sat', 'sat'), cvc('pat', 'pat'), cvc('tap', 'tap'), cvc('nap', 'nap')] },

  // ── 17. TRICKY WORDS ──
  { type: 'tricky_words', words: [tricky('I', 'I'), tricky('a', 'a'), tricky('the', 'the'), tricky('is', 'is'), tricky('happy', 'happy')] },

  // ── 18. SPELLING ──
  { type: 'spelling', words: [
    { word: 'cat', emoji: '🐱', letters: ['c','a','t'] },
    { word: 'tap', emoji: '👋', letters: ['t','a','p'] },
    { word: 'mat', emoji: '🟫', letters: ['m','a','t'] },
    { word: 'sat', emoji: '🪑', letters: ['s','a','t'] }] },

  // ── 19. ALIEN WORDS ──
  { type: 'nonsense_words', words: [
    cvc('sap','sap'), cvc('tas','tas'), cvc('pim','pim'), cvc('nit','nit'),
    cvc('tib','tib'), cvc('pag','pag'), cvc('nas','nas'), cvc('sib','sib'),
    cvc('nat','nat'), cvc('pis','pis'), cvc('tup','tup'), cvc('sut','sut')] },

  // ── 20. WRITING PRACTICE ──
  { type: 'writing_practice', letters: ['s', 'a', 't', 'p'] },
  { type: 'writing_practice', letters: ['i', 'n', 's', 'a'] },

  // ── 22. STORY ORDERING ──
  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/1_1/page1.png', label: 'I sit at a mat.', correctIndex: 0 },
    { imageUrl: '/illustrations/1_1/page2.png', label: 'Is it a rat?', correctIndex: 1 },
    { imageUrl: '/illustrations/1_1/page3.png', label: 'It is not a rat.', correctIndex: 2 },
    { imageUrl: '/illustrations/1_1/page4.png', label: 'I pat at it.', correctIndex: 3 },
    { imageUrl: '/illustrations/1_1/page5.png', label: 'It is a cat!', correctIndex: 4 },
    { imageUrl: '/illustrations/1_1/page6.png', label: 'The cat naps.', correctIndex: 5 }] },

  // ── 23. DRAWING ──
  { type: 'drawing', prompt: 'Draw Your Favourite Part' },

  // ── 24. CERTIFICATE ──
  { type: 'certificate', bookTitle: 'Tap! Tap! Tap!' },
];

// ═══════════════════════════════════════════════════════════════════════════
// L1.2 — "The Mud on the Dog"
// Focus sounds: m, d, g, o
// ═══════════════════════════════════════════════════════════════════════════

export const BOOK_L1_2_PAGES: InteractivePage[] = [
  // ── COVER ──
  { type: 'cover', title: 'The Mud on the Dog', subtitle: 'Level 1 · Starting Stories', imageUrl: '/illustrations/1_2/cover.png' },

  // ── SOUNDS + STORY WORDS (pre-reading) ──
  {
    type: 'sound_grid',
    focusSounds: ['m', 'd', 'g', 'o'],
    allSounds: ['m', 'd', 'g', 'o'],
    storyWords: [
      cvc('dog', 'dog'), cvc('mud', 'mud'), cvc('mop', 'mop'),
      cvc('got', 'got'), cvc('big', 'big'), cvc('ran', 'ran'),
      { display: 'mess', word: 'mess', phonemes: ['m','e','ss'] },
      cvc('tub', 'tub'), cvc('mum', 'mum'),
    ],
  },

  // ── STORY PAGES ──
  {
    type: 'story', sentences: ['I got a dog.', 'It is a big dog.'],
    words: [
      tricky('I', 'I'), cvc('got', 'got'), tricky('a', 'a'), cvc('dog.', 'dog'),
      { display: 'It', word: 'it', phonemes: ['i','t'] }, tricky('is', 'is'),
      tricky('a', 'a'), cvc('big', 'big'), cvc('dog.', 'dog'),
    ],
    imageUrl: '/illustrations/1_2/page1.png', audioUrl: '/sounds/sentences/L1_2_p1.mp3',
  },
  {
    type: 'story', sentences: ['The dog ran in the mud.', 'Mud, mud, mud!'],
    words: [
      tricky('The', 'the'), cvc('dog', 'dog'), cvc('ran', 'ran'),
      { display: 'in', word: 'in', phonemes: ['i','n'] }, tricky('the', 'the'),
      cvc('mud.', 'mud'), cvc('Mud,', 'mud'), cvc('mud,', 'mud'), cvc('mud!', 'mud'),
    ],
    imageUrl: '/illustrations/1_2/page2.png', audioUrl: '/sounds/sentences/L1_2_p2.mp3',
  },
  {
    type: 'story', sentences: ['The dog is a mess!', 'Mud is on the dog.'],
    words: [
      tricky('The', 'the'), cvc('dog', 'dog'), tricky('is', 'is'), tricky('a', 'a'),
      { display: 'mess!', word: 'mess', phonemes: ['m','e','ss'] },
      cvc('Mud', 'mud'), tricky('is', 'is'), { display: 'on', word: 'on', phonemes: ['o','n'] },
      tricky('the', 'the'), cvc('dog.', 'dog'),
    ],
    imageUrl: '/illustrations/1_2/page3.png', audioUrl: '/sounds/sentences/L1_2_p3.mp3',
  },
  {
    type: 'story', sentences: ['I get a mop.', 'I mop the dog.'],
    words: [
      tricky('I', 'I'), { display: 'get', word: 'get', phonemes: ['g','e','t'] },
      tricky('a', 'a'), cvc('mop.', 'mop'),
      tricky('I', 'I'), cvc('mop', 'mop'), tricky('the', 'the'), cvc('dog.', 'dog'),
    ],
    imageUrl: '/illustrations/1_2/page4.png', audioUrl: '/sounds/sentences/L1_2_p4.mp3',
  },
  {
    type: 'story', sentences: ['No!', 'The mop is a mess!', 'Mud is on me!'],
    words: [
      tricky('No!', 'no'), tricky('The', 'the'), cvc('mop', 'mop'), tricky('is', 'is'),
      tricky('a', 'a'), { display: 'mess!', word: 'mess', phonemes: ['m','e','ss'] },
      cvc('Mud', 'mud'), tricky('is', 'is'), { display: 'on', word: 'on', phonemes: ['o','n'] },
      { display: 'me!', word: 'me', phonemes: ['m','e'] },
    ],
    imageUrl: '/illustrations/1_2/page5.png', audioUrl: '/sounds/sentences/L1_2_p5.mp3',
  },
  {
    type: 'story', sentences: ['Mum got a tub.', 'The dog sat in it.', 'No mud! No mess!'],
    words: [
      cvc('Mum', 'mum'), cvc('got', 'got'), tricky('a', 'a'), cvc('tub.', 'tub'),
      tricky('The', 'the'), cvc('dog', 'dog'), cvc('sat', 'sat'),
      { display: 'in', word: 'in', phonemes: ['i','n'] }, { display: 'it.', word: 'it', phonemes: ['i','t'] },
      tricky('No', 'no'), cvc('mud!', 'mud'), tricky('No', 'no'),
      { display: 'mess!', word: 'mess', phonemes: ['m','e','ss'] },
    ],
    imageUrl: '/illustrations/1_2/page6.png', audioUrl: '/sounds/sentences/L1_2_p6.mp3',
  },

  // ── COMPREHENSION QUIZ ──
  { type: 'quiz', questions: [
    { question: 'What animal is in the story?',
      options: [{ label: 'dog', emoji: '🐶', isCorrect: true }, { label: 'cat', emoji: '🐱', isCorrect: false }, { label: 'pig', emoji: '🐷', isCorrect: false }] },
    { question: 'What got on the dog?',
      options: [{ label: 'mud', emoji: '🟤', isCorrect: true }, { label: 'paint', emoji: '🎨', isCorrect: false }, { label: 'sand', emoji: '🏖️', isCorrect: false }] },
    { question: 'Who got the tub at the end?',
      options: [{ label: 'Mum', emoji: '👩', isCorrect: true }, { label: 'Dad', emoji: '👨', isCorrect: false }, { label: 'the dog', emoji: '🐶', isCorrect: false }] },
  ]},

  // ── SOUND SPOTLIGHTS (m, d, g, o) ──
  { type: 'sound_spotlight', sound: 'm', items: [
    { word: 'man', emoji: '🧑', focusIndex: 0 }, { word: 'mop', emoji: '🧹', focusIndex: 0 },
    { word: 'mix', emoji: '🥣', focusIndex: 0 }, { word: 'mum', emoji: '👩', focusIndex: 0 }] },
  { type: 'sound_spotlight', sound: 'd', items: [
    { word: 'dog', emoji: '🐶', focusIndex: 0 }, { word: 'dig', emoji: '⛏️', focusIndex: 0 },
    { word: 'dip', emoji: '🫕', focusIndex: 0 }, { word: 'dot', emoji: '⚫', focusIndex: 0 }] },
  { type: 'sound_spotlight', sound: 'g', items: [
    { word: 'gap', emoji: '🕳️', focusIndex: 0 }, { word: 'gas', emoji: '⛽', focusIndex: 0 },
    { word: 'gum', emoji: '🫧', focusIndex: 0 }, { word: 'gift', emoji: '🎁', focusIndex: 0 }] },
  { type: 'sound_spotlight', sound: 'o', items: [
    { word: 'log', emoji: '🪵', focusIndex: 1 }, { word: 'fog', emoji: '🌫️', focusIndex: 1 },
    { word: 'hot', emoji: '🔥', focusIndex: 1 }, { word: 'pot', emoji: '🍲', focusIndex: 1 }] },

  // ── WORD READING ──
  { type: 'word_reading', words: [cvc('dog', 'dog'), cvc('mud', 'mud'), cvc('mop', 'mop'), cvc('got', 'got')] },

  // ── TRICKY WORDS ──
  { type: 'tricky_words', words: [tricky('I', 'I'), tricky('a', 'a'), tricky('the', 'the'), tricky('is', 'is'), tricky('no', 'no')] },

  // ── SPELLING ──
  { type: 'spelling', words: [
    { word: 'dog', emoji: '🐶', letters: ['d','o','g'] },
    { word: 'mud', emoji: '🟤', letters: ['m','u','d'] },
    { word: 'mop', emoji: '🧹', letters: ['m','o','p'] },
    { word: 'tub', emoji: '🛁', letters: ['t','u','b'] }] },

  // ── ALIEN WORDS ──
  { type: 'nonsense_words', words: [
    cvc('mog','mog'), cvc('dop','dop'), cvc('gim','gim'), cvc('dom','dom'),
    cvc('gat','gat'), cvc('mig','mig'), cvc('god','god'), cvc('dug','dug'),
    cvc('mab','mab'), cvc('gop','gop'), cvc('dit','dit'), cvc('meg','meg')] },

  // ── WRITING PRACTICE ──
  { type: 'writing_practice', letters: ['m', 'd', 'g', 'o'] },

  // ── STORY ORDERING ──
  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/1_2/page1.png', label: 'I got a dog.', correctIndex: 0 },
    { imageUrl: '/illustrations/1_2/page2.png', label: 'Mud, mud, mud!', correctIndex: 1 },
    { imageUrl: '/illustrations/1_2/page3.png', label: 'The dog is a mess!', correctIndex: 2 },
    { imageUrl: '/illustrations/1_2/page4.png', label: 'I mop the dog.', correctIndex: 3 },
    { imageUrl: '/illustrations/1_2/page5.png', label: 'Mud is on me!', correctIndex: 4 },
    { imageUrl: '/illustrations/1_2/page6.png', label: 'No mud! No mess!', correctIndex: 5 }] },

  // ── DRAWING ──
  { type: 'drawing', prompt: 'Draw Your Favourite Part' },

  // ── CERTIFICATE ──
  { type: 'certificate', bookTitle: 'The Mud on the Dog' },
];

/** Map of sub-level keys to interactive page data (expandable to more books) */
export const INTERACTIVE_BOOKS: Record<string, InteractivePage[]> = {
  'L1.1': BOOK_L1_1_PAGES,
  'L1.2': BOOK_L1_2_PAGES,
};

/** Check if interactive data exists for a given book sub-level */
export function hasInteractiveData(subLevel: string): boolean {
  return subLevel in INTERACTIVE_BOOKS;
}
