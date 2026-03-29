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
  imageUrl: string;
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
  options: { label: string; imageUrl?: string; isCorrect: boolean }[];
}

export interface SpellingWord {
  word: string;
  imageUrl: string;
  letters: string[];      // The letters to drag into place
}

export type InteractivePage =
  | { type: 'cover'; title: string; subtitle: string; imageUrl: string }
  | { type: 'sound_grid'; focusSounds: string[]; allSounds: string[] }
  | { type: 'vocab_preview'; words: StoryWord[] }
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

  // ── 2. FOCUS SOUNDS ──
  {
    type: 'sound_grid',
    focusSounds: ['s', 'a', 't', 'p', 'i', 'n'],
    allSounds: [
      's/ss', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o',
      'c/k/ck', 'e', 'u', 'r', 'h', 'b', 'f/ff',
      'l/ll', 'j', 'v', 'w', 'x', 'y', 'z/zz',
      'qu', 'ch', 'sh', 'th', 'ng', 'nk',
    ],
  },

  // ── 3. STORY WORDS (vocab preview before reading) ──
  {
    type: 'vocab_preview',
    words: [
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
        options: [{ label: 'cat', imageUrl: '/images/words/cat.png', isCorrect: true }, { label: 'dog', imageUrl: '/images/words/dog.png', isCorrect: false }, { label: 'fish', imageUrl: '/images/words/fish.png', isCorrect: false }] },
      { question: 'What does the cat do at the end?',
        options: [{ label: 'naps', imageUrl: '/images/words/nap.png', isCorrect: true }, { label: 'runs', imageUrl: '/images/words/runs.png', isCorrect: false }, { label: 'sits', imageUrl: '/images/words/sat.png', isCorrect: false }] },
      { question: 'Is the cat thin or fat?',
        options: [{ label: 'fat', imageUrl: '/images/words/fat.png', isCorrect: true }, { label: 'thin', imageUrl: '/images/words/thin.png', isCorrect: false }] },
    ],
  },

  // ── 10-15. SOUND SPOTLIGHTS ──
  { type: 'sound_spotlight', sound: 's', items: [
    { word: 'sun', imageUrl: '/images/words/sun.png', focusIndex: 0 }, { word: 'sock', imageUrl: '/images/words/sock.png', focusIndex: 0 },
    { word: 'six', imageUrl: '/images/words/six.png', focusIndex: 0 }, { word: 'sad', imageUrl: '/images/words/sad.png', focusIndex: 0 }] },
  { type: 'sound_spotlight', sound: 'a', items: [
    { word: 'hat', imageUrl: '/images/words/hat.png', focusIndex: 1 }, { word: 'cat', imageUrl: '/images/words/cat.png', focusIndex: 1 },
    { word: 'map', imageUrl: '/images/words/map.png', focusIndex: 1 }, { word: 'van', imageUrl: '/images/words/van.png', focusIndex: 1 }] },
  { type: 'sound_spotlight', sound: 't', items: [
    { word: 'tin', imageUrl: '/images/words/tin.png', focusIndex: 0 }, { word: 'tap', imageUrl: '/images/words/tap.png', focusIndex: 0 },
    { word: 'ten', imageUrl: '/images/words/ten.png', focusIndex: 0 }, { word: 'tub', imageUrl: '/images/words/tub.png', focusIndex: 0 }] },
  { type: 'sound_spotlight', sound: 'p', items: [
    { word: 'pig', imageUrl: '/images/words/pig.png', focusIndex: 0 }, { word: 'pan', imageUrl: '/images/words/pan.png', focusIndex: 0 },
    { word: 'pin', imageUrl: '/images/words/pin.png', focusIndex: 0 }, { word: 'peg', imageUrl: '/images/words/peg.png', focusIndex: 0 }] },
  { type: 'sound_spotlight', sound: 'i', items: [
    { word: 'bin', imageUrl: '/images/words/bin.png', focusIndex: 1 }, { word: 'dig', imageUrl: '/images/words/dig.png', focusIndex: 1 },
    { word: 'fin', imageUrl: '/images/words/fin.png', focusIndex: 1 }, { word: 'zip', imageUrl: '/images/words/zip.png', focusIndex: 1 }] },
  { type: 'sound_spotlight', sound: 'n', items: [
    { word: 'net', imageUrl: '/images/words/net.png', focusIndex: 0 }, { word: 'nut', imageUrl: '/images/words/nut.png', focusIndex: 0 },
    { word: 'nap', imageUrl: '/images/words/nap.png', focusIndex: 0 }, { word: 'nod', imageUrl: '/images/words/nod.png', focusIndex: 0 }] },

  // ── 16. WORD READING ──
  { type: 'word_reading', words: [cvc('sat', 'sat'), cvc('pat', 'pat'), cvc('tap', 'tap'), cvc('nap', 'nap')] },

  // ── 17. TRICKY WORDS ──
  { type: 'tricky_words', words: [tricky('I', 'I'), tricky('a', 'a'), tricky('the', 'the'), tricky('is', 'is'), tricky('happy', 'happy')] },

  // ── 18. SPELLING ──
  { type: 'spelling', words: [
    { word: 'cat', imageUrl: '/images/words/cat.png', letters: ['c','a','t'] },
    { word: 'tap', imageUrl: '/images/words/tap.png', letters: ['t','a','p'] },
    { word: 'mat', imageUrl: '/images/words/mat.png', letters: ['m','a','t'] },
    { word: 'sat', imageUrl: '/images/words/sat.png', letters: ['s','a','t'] }] },

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

  // ── SOUNDS ──
  {
    type: 'sound_grid',
    focusSounds: ['m', 'd', 'g', 'o'],
    allSounds: [
      's/ss', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o',
      'c/k/ck', 'e', 'u', 'r', 'h', 'b', 'f/ff',
      'l/ll', 'j', 'v', 'w', 'x', 'y', 'z/zz',
      'qu', 'ch', 'sh', 'th', 'ng', 'nk',
    ],
  },

  // ── STORY WORDS (vocab preview before reading) ──
  {
    type: 'vocab_preview',
    words: [
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
      options: [{ label: 'dog', imageUrl: '/images/words/dog.png', isCorrect: true }, { label: 'cat', imageUrl: '/images/words/cat.png', isCorrect: false }, { label: 'pig', imageUrl: '/images/words/pig.png', isCorrect: false }] },
    { question: 'What got on the dog?',
      options: [{ label: 'mud', imageUrl: '/images/words/mud.png', isCorrect: true }, { label: 'paint', imageUrl: '/images/words/paint.png', isCorrect: false }, { label: 'sand', imageUrl: '/images/words/sand.png', isCorrect: false }] },
    { question: 'Who got the tub at the end?',
      options: [{ label: 'Mum', imageUrl: '/images/words/mum.png', isCorrect: true }, { label: 'Dad', imageUrl: '/images/words/dad.png', isCorrect: false }, { label: 'the dog', imageUrl: '/images/words/dog.png', isCorrect: false }] },
  ]},

  // ── SOUND SPOTLIGHTS (m, d, g, o) ──
  { type: 'sound_spotlight', sound: 'm', items: [
    { word: 'man', imageUrl: '/images/words/man.png', focusIndex: 0 }, { word: 'mop', imageUrl: '/images/words/mop.png', focusIndex: 0 },
    { word: 'mix', imageUrl: '/images/words/mix.png', focusIndex: 0 }, { word: 'mum', imageUrl: '/images/words/mum.png', focusIndex: 0 }] },
  { type: 'sound_spotlight', sound: 'd', items: [
    { word: 'dog', imageUrl: '/images/words/dog.png', focusIndex: 0 }, { word: 'dig', imageUrl: '/images/words/dig.png', focusIndex: 0 },
    { word: 'dip', imageUrl: '/images/words/dip.png', focusIndex: 0 }, { word: 'dot', imageUrl: '/images/words/dot.png', focusIndex: 0 }] },
  { type: 'sound_spotlight', sound: 'g', items: [
    { word: 'gap', imageUrl: '/images/words/gap.png', focusIndex: 0 }, { word: 'gas', imageUrl: '/images/words/gas.png', focusIndex: 0 },
    { word: 'gum', imageUrl: '/images/words/gum.png', focusIndex: 0 }, { word: 'gift', imageUrl: '/images/words/gift.png', focusIndex: 0 }] },
  { type: 'sound_spotlight', sound: 'o', items: [
    { word: 'log', imageUrl: '/images/words/log.png', focusIndex: 1 }, { word: 'fog', imageUrl: '/images/words/fog.png', focusIndex: 1 },
    { word: 'hot', imageUrl: '/images/words/hot.png', focusIndex: 1 }, { word: 'pot', imageUrl: '/images/words/pot.png', focusIndex: 1 }] },

  // ── WORD READING ──
  { type: 'word_reading', words: [cvc('dog', 'dog'), cvc('mud', 'mud'), cvc('mop', 'mop'), cvc('got', 'got')] },

  // ── TRICKY WORDS ──
  { type: 'tricky_words', words: [tricky('I', 'I'), tricky('a', 'a'), tricky('the', 'the'), tricky('is', 'is'), tricky('no', 'no')] },

  // ── SPELLING ──
  { type: 'spelling', words: [
    { word: 'dog', imageUrl: '/images/words/dog.png', letters: ['d','o','g'] },
    { word: 'mud', imageUrl: '/images/words/mud.png', letters: ['m','u','d'] },
    { word: 'mop', imageUrl: '/images/words/mop.png', letters: ['m','o','p'] },
    { word: 'tub', imageUrl: '/images/words/tub.png', letters: ['t','u','b'] }] },

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

// ═══════════════════════════════════════════════════════════════════════════
// L1.3 — "The Fish in the Tank"
// Focus sounds: sh, nk
// ═══════════════════════════════════════════════════════════════════════════

export const BOOK_L1_3_PAGES: InteractivePage[] = [
  // ── COVER ──
  { type: 'cover', title: 'The Fish in the Tank', subtitle: 'Level 1 · Starting Stories', imageUrl: '/illustrations/1_3/cover.png' },

  // ── SOUNDS + STORY WORDS (pre-reading) ──
  {
    type: 'sound_grid',
    focusSounds: ['sh', 'nk'],
    allSounds: [
      's','a','t','p','i','n','m','d','g','o',
      'c','k','ck','e','u','r','h','b','f','ff',
      'l','ll','ss','j','v','w','x','y','z','zz',
      'qu','ch','sh','th','ng','nk',
    ],
    storyWords: [
      { display: 'fish', word: 'fish', phonemes: ['f','i','sh'] },
      { display: 'tank', word: 'tank', phonemes: ['t','a','nk'] },
      { display: 'wish', word: 'wish', phonemes: ['w','i','sh'] },
      cvc('bag', 'bag'),
      cvc('cup', 'cup'),
      cvc('sad', 'sad'),
    ],
  },

  // ── STORY WORDS (vocab preview before reading) ──
  {
    type: 'vocab_preview',
    words: [
      { display: 'fish', word: 'fish', phonemes: ['f','i','sh'] },
      { display: 'tank', word: 'tank', phonemes: ['t','a','nk'] },
      { display: 'wish', word: 'wish', phonemes: ['w','i','sh'] },
      cvc('bag', 'bag'),
      cvc('cup', 'cup'),
      cvc('sad', 'sad'),
    ],
  },

  // ── STORY PAGES ──
  // Page 1: "I have a fish! It is in a bag."
  {
    type: 'story', sentences: ['I have a fish!', 'It is in a bag.'],
    words: [
      tricky('I', 'I'), tricky('have', 'have'), tricky('a', 'a'),
      { display: 'fish!', word: 'fish', phonemes: ['f','i','sh'] },
      { display: 'It', word: 'it', phonemes: ['i','t'] }, tricky('is', 'is'),
      { display: 'in', word: 'in', phonemes: ['i','n'] }, tricky('a', 'a'),
      cvc('bag.', 'bag'),
    ],
    imageUrl: '/illustrations/1_3/page1.png', audioUrl: '/sounds/sentences/L1_3_p1.mp3',
  },
  // Page 2: "The fish is sad. The bag is not big."
  {
    type: 'story', sentences: ['The fish is sad.', 'The bag is not big.'],
    words: [
      tricky('The', 'the'), { display: 'fish', word: 'fish', phonemes: ['f','i','sh'] },
      tricky('is', 'is'), cvc('sad.', 'sad'),
      tricky('The', 'the'), cvc('bag', 'bag'), tricky('is', 'is'),
      { display: 'not', word: 'not', phonemes: ['n','o','t'] }, cvc('big.', 'big'),
    ],
    imageUrl: '/illustrations/1_3/page2.png', audioUrl: '/sounds/sentences/L1_3_p2.mp3',
  },
  // Page 3: "I get a cup. No! It is not big."
  {
    type: 'story', sentences: ['I get a cup.', 'No! It is not big.'],
    words: [
      tricky('I', 'I'), { display: 'get', word: 'get', phonemes: ['g','e','t'] },
      tricky('a', 'a'), cvc('cup.', 'cup'),
      tricky('No!', 'no'), { display: 'It', word: 'it', phonemes: ['i','t'] },
      tricky('is', 'is'), { display: 'not', word: 'not', phonemes: ['n','o','t'] },
      cvc('big.', 'big'),
    ],
    imageUrl: '/illustrations/1_3/page3.png', audioUrl: '/sounds/sentences/L1_3_p3.mp3',
  },
  // Page 4: "I get a tank. Yes! The fish can go in!"
  {
    type: 'story', sentences: ['I get a tank.', 'Yes! The fish can go in!'],
    words: [
      tricky('I', 'I'), { display: 'get', word: 'get', phonemes: ['g','e','t'] },
      tricky('a', 'a'), { display: 'tank.', word: 'tank', phonemes: ['t','a','nk'] },
      { display: 'Yes!', word: 'yes', phonemes: ['y','e','s'] },
      tricky('The', 'the'), { display: 'fish', word: 'fish', phonemes: ['f','i','sh'] },
      { display: 'can', word: 'can', phonemes: ['c','a','n'] },
      tricky('go', 'go'), { display: 'in!', word: 'in', phonemes: ['i','n'] },
    ],
    imageUrl: '/illustrations/1_3/page4.png', audioUrl: '/sounds/sentences/L1_3_p4.mp3',
  },
  // Page 5: "Wish, wish! The fish is in the tank!"
  {
    type: 'story', sentences: ['Wish, wish!', 'The fish is in the tank!'],
    words: [
      { display: 'Wish,', word: 'wish', phonemes: ['w','i','sh'] },
      { display: 'wish!', word: 'wish', phonemes: ['w','i','sh'] },
      tricky('The', 'the'), { display: 'fish', word: 'fish', phonemes: ['f','i','sh'] },
      tricky('is', 'is'), { display: 'in', word: 'in', phonemes: ['i','n'] },
      tricky('the', 'the'), { display: 'tank!', word: 'tank', phonemes: ['t','a','nk'] },
    ],
    imageUrl: '/illustrations/1_3/page5.png', audioUrl: '/sounds/sentences/L1_3_p5.mp3',
  },
  // Page 6: "The fish is not sad. I am happy!"
  {
    type: 'story', sentences: ['The fish is not sad.', 'I am happy!'],
    words: [
      tricky('The', 'the'), { display: 'fish', word: 'fish', phonemes: ['f','i','sh'] },
      tricky('is', 'is'), { display: 'not', word: 'not', phonemes: ['n','o','t'] },
      cvc('sad.', 'sad'),
      tricky('I', 'I'), { display: 'am', word: 'am', phonemes: ['a','m'] },
      tricky('happy!', 'happy'),
    ],
    imageUrl: '/illustrations/1_3/page6.png', audioUrl: '/sounds/sentences/L1_3_p6.mp3',
  },

  // ── COMPREHENSION QUIZ ──
  { type: 'quiz', questions: [
    { question: 'What pet is in the story?',
      options: [{ label: 'fish', imageUrl: '/images/words/fish.png', isCorrect: true }, { label: 'dog', imageUrl: '/images/words/dog.png', isCorrect: false }, { label: 'cat', imageUrl: '/images/words/cat.png', isCorrect: false }] },
    { question: 'Where does the fish end up?',
      options: [{ label: 'tank', imageUrl: '/images/words/tank.png', isCorrect: true }, { label: 'cup', imageUrl: '/images/words/cup.png', isCorrect: false }, { label: 'bag', imageUrl: '/images/words/bag.png', isCorrect: false }] },
    { question: 'Why was the cup no good?',
      options: [{ label: 'not big', isCorrect: true }, { label: 'too hot', isCorrect: false }, { label: 'had a lid', isCorrect: false }] },
  ]},

  // ── SOUND SPOTLIGHTS (sh, nk) ──
  { type: 'sound_spotlight', sound: 'sh', items: [
    { word: 'ship', imageUrl: '/images/words/ship.png', focusIndex: 0 }, { word: 'fish', imageUrl: '/images/words/fish.png', focusIndex: 2 },
    { word: 'shed', imageUrl: '/images/words/shed.png', focusIndex: 0 }, { word: 'shop', imageUrl: '/images/words/shop.png', focusIndex: 0 }] },
  { type: 'sound_spotlight', sound: 'nk', items: [
    { word: 'sink', imageUrl: '/images/words/sink.png', focusIndex: 2 }, { word: 'tank', imageUrl: '/images/words/tank.png', focusIndex: 2 },
    { word: 'bank', imageUrl: '/images/words/bank.png', focusIndex: 2 }, { word: 'ink', imageUrl: '/images/words/ink.png', focusIndex: 1 }] },

  // ── WORD READING ──
  { type: 'word_reading', words: [
    { display: 'fish', word: 'fish', phonemes: ['f','i','sh'] },
    { display: 'tank', word: 'tank', phonemes: ['t','a','nk'] },
    { display: 'wish', word: 'wish', phonemes: ['w','i','sh'] },
    cvc('bag', 'bag')] },

  // ── TRICKY WORDS ──
  { type: 'tricky_words', words: [tricky('I', 'I'), tricky('a', 'a'), tricky('the', 'the'), tricky('is', 'is'), tricky('no', 'no'), tricky('go', 'go')] },

  // ── SPELLING ──
  { type: 'spelling', words: [
    { word: 'fish', imageUrl: '/images/words/fish.png', letters: ['f','i','sh'] },
    { word: 'tank', imageUrl: '/images/words/tank.png', letters: ['t','a','nk'] },
    { word: 'wish', imageUrl: '/images/words/wish.png', letters: ['w','i','sh'] },
    { word: 'sad', imageUrl: '/images/words/sad.png', letters: ['s','a','d'] }] },

  // ── ALIEN WORDS ──
  { type: 'nonsense_words', words: [
    { display: 'shim', word: 'shim', phonemes: ['sh','i','m'] },
    { display: 'fash', word: 'fash', phonemes: ['f','a','sh'] },
    { display: 'nush', word: 'nush', phonemes: ['n','u','sh'] },
    { display: 'gish', word: 'gish', phonemes: ['g','i','sh'] },
    { display: 'tink', word: 'tink', phonemes: ['t','i','nk'] },
    { display: 'donk', word: 'donk', phonemes: ['d','o','nk'] },
    { display: 'bunk', word: 'bunk', phonemes: ['b','u','nk'] },
    { display: 'lenk', word: 'lenk', phonemes: ['l','e','nk'] },
    cvc('thud', 'thud'), cvc('chop', 'chop'),
    { display: 'thib', word: 'thib', phonemes: ['th','i','b'] },
    { display: 'quop', word: 'quop', phonemes: ['qu','o','p'] }] },

  // ── WRITING PRACTICE ──
  { type: 'writing_practice', letters: ['sh', 'nk'] },

  // ── STORY ORDERING ──
  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/1_3/page1.png', label: 'A fish in a bag.', correctIndex: 0 },
    { imageUrl: '/illustrations/1_3/page2.png', label: 'The fish is sad.', correctIndex: 1 },
    { imageUrl: '/illustrations/1_3/page3.png', label: 'I get a cup.', correctIndex: 2 },
    { imageUrl: '/illustrations/1_3/page4.png', label: 'I get a tank.', correctIndex: 3 },
    { imageUrl: '/illustrations/1_3/page5.png', label: 'Wish, wish!', correctIndex: 4 },
    { imageUrl: '/illustrations/1_3/page6.png', label: 'I am happy!', correctIndex: 5 }] },

  // ── DRAWING ──
  { type: 'drawing', prompt: 'Draw Your Favourite Part' },

  // ── CERTIFICATE ──
  { type: 'certificate', bookTitle: 'The Fish in the Tank' },
];

// ═══════════════════════════════════════════════════════════════════════════
// L1.4 — "The Red Socks"
// Focus sounds: c, k, ck, e
// ═══════════════════════════════════════════════════════════════════════════

export const BOOK_L1_4_PAGES: InteractivePage[] = [
  // ── COVER ──
  { type: 'cover', title: 'The Red Socks', subtitle: 'Level 1 · Starting Stories', imageUrl: '/illustrations/1_4/cover.png' },

  // ── SOUNDS + STORY WORDS ──
  {
    type: 'sound_grid',
    focusSounds: ['c', 'k', 'ck', 'e'],
    allSounds: [
      's','a','t','p','i','n','m','d','g','o',
      'c','k','ck','e','u','r','h','b','f','ff',
      'l','ll','ss','j','v','w','x','y','z','zz',
      'qu','ch','sh','th','ng','nk',
    ],
    storyWords: [
      { display: 'socks', word: 'socks', phonemes: ['s','o','ck','s'] },
      { display: 'check', word: 'check', phonemes: ['ch','e','ck'] },
      cvc('red', 'red'), cvc('bed', 'bed'),
      cvc('hen', 'hen'), cvc('pen', 'pen'),
      { display: 'peck', word: 'peck', phonemes: ['p','e','ck'] },
      { display: 'kick', word: 'kick', phonemes: ['k','i','ck'] },
    ],
  },

  // ── VOCAB PREVIEW ──
  {
    type: 'vocab_preview',
    words: [
      { display: 'socks', word: 'socks', phonemes: ['s','o','ck','s'] },
      { display: 'check', word: 'check', phonemes: ['ch','e','ck'] },
      cvc('red', 'red'), cvc('bed', 'bed'),
      cvc('hen', 'hen'), cvc('pen', 'pen'),
      { display: 'peck', word: 'peck', phonemes: ['p','e','ck'] },
      { display: 'kick', word: 'kick', phonemes: ['k','i','ck'] },
    ],
  },

  // ── STORY PAGES ──
  // Page 1: "I have no socks! I am sad."
  {
    type: 'story', sentences: ['I have no socks!', 'I am sad.'],
    words: [
      tricky('I', 'I'), tricky('have', 'have'), tricky('no', 'no'),
      { display: 'socks!', word: 'socks', phonemes: ['s','o','ck','s'] },
      tricky('I', 'I'), { display: 'am', word: 'am', phonemes: ['a','m'] },
      cvc('sad.', 'sad'),
    ],
    imageUrl: '/illustrations/1_4/page1.png', audioUrl: '/sounds/sentences/L1_4_p1.mp3',
  },
  // Page 2: "I check the bed. I get a sock. Not red!"
  {
    type: 'story', sentences: ['I check the bed.', 'I get a sock.', 'Not red!'],
    words: [
      tricky('I', 'I'), { display: 'check', word: 'check', phonemes: ['ch','e','ck'] },
      tricky('the', 'the'), cvc('bed.', 'bed'),
      tricky('I', 'I'), { display: 'get', word: 'get', phonemes: ['g','e','t'] },
      tricky('a', 'a'), { display: 'sock.', word: 'sock', phonemes: ['s','o','ck'] },
      { display: 'Not', word: 'not', phonemes: ['n','o','t'] }, cvc('red!', 'red'),
    ],
    imageUrl: '/illustrations/1_4/page2.png', audioUrl: '/sounds/sentences/L1_4_p2.mp3',
  },
  // Page 3: "I check the bag. I get a sock. Not red!"
  {
    type: 'story', sentences: ['I check the bag.', 'I get a sock.', 'Not red!'],
    words: [
      tricky('I', 'I'), { display: 'check', word: 'check', phonemes: ['ch','e','ck'] },
      tricky('the', 'the'), cvc('bag.', 'bag'),
      tricky('I', 'I'), { display: 'get', word: 'get', phonemes: ['g','e','t'] },
      tricky('a', 'a'), { display: 'sock.', word: 'sock', phonemes: ['s','o','ck'] },
      { display: 'Not', word: 'not', phonemes: ['n','o','t'] }, cvc('red!', 'red'),
    ],
    imageUrl: '/illustrations/1_4/page3.png', audioUrl: '/sounds/sentences/L1_4_p3.mp3',
  },
  // Page 4: "I check the hen pen. The hen has red socks!"
  {
    type: 'story', sentences: ['I check the hen pen.', 'The hen has red socks!'],
    words: [
      tricky('I', 'I'), { display: 'check', word: 'check', phonemes: ['ch','e','ck'] },
      tricky('the', 'the'), cvc('hen', 'hen'), cvc('pen.', 'pen'),
      tricky('The', 'the'), cvc('hen', 'hen'), tricky('has', 'has'),
      cvc('red', 'red'), { display: 'socks!', word: 'socks', phonemes: ['s','o','ck','s'] },
    ],
    imageUrl: '/illustrations/1_4/page4.png', audioUrl: '/sounds/sentences/L1_4_p4.mp3',
  },
  // Page 5: "I get the socks. The hen pecks me! Peck, peck!"
  {
    type: 'story', sentences: ['I get the socks.', 'The hen pecks me!', 'Peck, peck!'],
    words: [
      tricky('I', 'I'), { display: 'get', word: 'get', phonemes: ['g','e','t'] },
      tricky('the', 'the'), { display: 'socks.', word: 'socks', phonemes: ['s','o','ck','s'] },
      tricky('The', 'the'), cvc('hen', 'hen'),
      { display: 'pecks', word: 'pecks', phonemes: ['p','e','ck','s'] },
      { display: 'me!', word: 'me', phonemes: ['m','e'] },
      { display: 'Peck,', word: 'peck', phonemes: ['p','e','ck'] },
      { display: 'peck!', word: 'peck', phonemes: ['p','e','ck'] },
    ],
    imageUrl: '/illustrations/1_4/page5.png', audioUrl: '/sounds/sentences/L1_4_p5.mp3',
  },
  // Page 6: "Red socks on me! I can kick! I am so happy!"
  {
    type: 'story', sentences: ['Red socks on me!', 'I can kick!', 'I am so happy!'],
    words: [
      cvc('Red', 'red'), { display: 'socks', word: 'socks', phonemes: ['s','o','ck','s'] },
      { display: 'on', word: 'on', phonemes: ['o','n'] },
      { display: 'me!', word: 'me', phonemes: ['m','e'] },
      tricky('I', 'I'), { display: 'can', word: 'can', phonemes: ['c','a','n'] },
      { display: 'kick!', word: 'kick', phonemes: ['k','i','ck'] },
      tricky('I', 'I'), { display: 'am', word: 'am', phonemes: ['a','m'] },
      tricky('so', 'so'), tricky('happy!', 'happy'),
    ],
    imageUrl: '/illustrations/1_4/page6.png', audioUrl: '/sounds/sentences/L1_4_p6.mp3',
  },

  // ── COMPREHENSION QUIZ ──
  { type: 'quiz', questions: [
    { question: 'What colour socks does the child want?',
      options: [{ label: 'red', imageUrl: '/images/words/red.png', isCorrect: true }, { label: 'blue', isCorrect: false }, { label: 'green', isCorrect: false }] },
    { question: 'Where were the red socks?',
      options: [{ label: 'hen pen', imageUrl: '/images/words/hen.png', isCorrect: true }, { label: 'bed', imageUrl: '/images/words/bed.png', isCorrect: false }, { label: 'bag', imageUrl: '/images/words/bag.png', isCorrect: false }] },
    { question: 'What did the hen do?',
      options: [{ label: 'pecked', imageUrl: '/images/words/peck.png', isCorrect: true }, { label: 'ran', imageUrl: '/images/words/ran.png', isCorrect: false }, { label: 'sat', imageUrl: '/images/words/sat.png', isCorrect: false }] },
  ]},

  // ── SOUND SPOTLIGHTS (c, k, ck, e) ──
  { type: 'sound_spotlight', sound: 'c', items: [
    { word: 'cup', imageUrl: '/images/words/cup.png', focusIndex: 0 }, { word: 'cap', imageUrl: '/images/words/cap.png', focusIndex: 0 },
    { word: 'cob', imageUrl: '/images/words/cob.png', focusIndex: 0 }, { word: 'cab', imageUrl: '/images/words/cab.png', focusIndex: 0 }] },
  { type: 'sound_spotlight', sound: 'k', items: [
    { word: 'kit', imageUrl: '/images/words/kit.png', focusIndex: 0 }, { word: 'kid', imageUrl: '/images/words/kid.png', focusIndex: 0 },
    { word: 'keg', imageUrl: '/images/words/keg.png', focusIndex: 0 }, { word: 'kip', imageUrl: '/images/words/kip.png', focusIndex: 0 }] },
  { type: 'sound_spotlight', sound: 'ck', items: [
    { word: 'duck', imageUrl: '/images/words/duck.png', focusIndex: 2 }, { word: 'sock', imageUrl: '/images/words/sock.png', focusIndex: 2 },
    { word: 'lock', imageUrl: '/images/words/lock.png', focusIndex: 2 }, { word: 'kick', imageUrl: '/images/words/kick.png', focusIndex: 2 }] },
  { type: 'sound_spotlight', sound: 'e', items: [
    { word: 'bed', imageUrl: '/images/words/bed.png', focusIndex: 1 }, { word: 'red', imageUrl: '/images/words/red.png', focusIndex: 1 },
    { word: 'hen', imageUrl: '/images/words/hen.png', focusIndex: 1 }, { word: 'web', imageUrl: '/images/words/web.png', focusIndex: 1 }] },

  // ── WORD READING ──
  { type: 'word_reading', words: [
    { display: 'socks', word: 'socks', phonemes: ['s','o','ck','s'] },
    { display: 'check', word: 'check', phonemes: ['ch','e','ck'] },
    { display: 'peck', word: 'peck', phonemes: ['p','e','ck'] },
    { display: 'kick', word: 'kick', phonemes: ['k','i','ck'] }] },

  // ── TRICKY WORDS ──
  { type: 'tricky_words', words: [tricky('I', 'I'), tricky('a', 'a'), tricky('the', 'the'), tricky('no', 'no'), tricky('have', 'have'), tricky('happy', 'happy')] },

  // ── SPELLING ──
  { type: 'spelling', words: [
    { word: 'red', imageUrl: '/images/words/red.png', letters: ['r','e','d'] },
    { word: 'hen', imageUrl: '/images/words/hen.png', letters: ['h','e','n'] },
    { word: 'kick', imageUrl: '/images/words/kick.png', letters: ['k','i','ck'] },
    { word: 'bed', imageUrl: '/images/words/bed.png', letters: ['b','e','d'] }] },

  // ── ALIEN WORDS ──
  { type: 'nonsense_words', words: [
    cvc('keb', 'keb'), cvc('ced', 'ced'), cvc('dek', 'dek'), cvc('kem', 'kem'),
    { display: 'feck', word: 'feck', phonemes: ['f','e','ck'] },
    { display: 'veck', word: 'veck', phonemes: ['v','e','ck'] },
    { display: 'bick', word: 'bick', phonemes: ['b','i','ck'] },
    { display: 'ruck', word: 'ruck', phonemes: ['r','u','ck'] },
    cvc('cug', 'cug'), cvc('kib', 'kib'),
    { display: 'nuck', word: 'nuck', phonemes: ['n','u','ck'] },
    { display: 'teck', word: 'teck', phonemes: ['t','e','ck'] }] },

  // ── WRITING PRACTICE ──
  { type: 'writing_practice', letters: ['c', 'k', 'ck', 'e'] },

  // ── STORY ORDERING ──
  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/1_4/page1.png', label: 'I have no socks!', correctIndex: 0 },
    { imageUrl: '/illustrations/1_4/page2.png', label: 'I check the bed.', correctIndex: 1 },
    { imageUrl: '/illustrations/1_4/page3.png', label: 'I check the bag.', correctIndex: 2 },
    { imageUrl: '/illustrations/1_4/page4.png', label: 'The hen has red socks!', correctIndex: 3 },
    { imageUrl: '/illustrations/1_4/page5.png', label: 'Peck, peck!', correctIndex: 4 },
    { imageUrl: '/illustrations/1_4/page6.png', label: 'I can kick!', correctIndex: 5 }] },

  // ── DRAWING ──
  { type: 'drawing', prompt: 'Draw Your Favourite Part' },

  // ── CERTIFICATE ──
  { type: 'certificate', bookTitle: 'The Red Socks' },
];

// ═══════════════════════════════════════════════════════════════════════════
// L1.5 — "Run, Pup, Run!"
// Focus sounds: u, r, h, b
// ═══════════════════════════════════════════════════════════════════════════

export const BOOK_L1_5_PAGES: InteractivePage[] = [
  // ── COVER ──
  { type: 'cover', title: 'Run, Pup, Run!', subtitle: 'Level 1 · Starting Stories', imageUrl: '/illustrations/1_5/cover.png' },

  // ── SOUNDS + STORY WORDS ──
  {
    type: 'sound_grid',
    focusSounds: ['u', 'r', 'h', 'b'],
    allSounds: [
      's','a','t','p','i','n','m','d','g','o',
      'c','k','ck','e','u','r','h','b','f','ff',
      'l','ll','ss','j','v','w','x','y','z','zz',
      'qu','ch','sh','th','ng','nk',
    ],
    storyWords: [
      cvc('run', 'run'), cvc('pup', 'pup'), cvc('hut', 'hut'),
      { display: 'bush', word: 'bush', phonemes: ['b','u','sh'] },
      cvc('tub', 'tub'), cvc('rub', 'rub'),
      cvc('hug', 'hug'), cvc('hid', 'hid'),
    ],
  },

  // ── VOCAB PREVIEW ──
  {
    type: 'vocab_preview',
    words: [
      cvc('run', 'run'), cvc('pup', 'pup'), cvc('hut', 'hut'),
      { display: 'bush', word: 'bush', phonemes: ['b','u','sh'] },
      cvc('tub', 'tub'), cvc('rub', 'rub'),
      cvc('hug', 'hug'), cvc('hid', 'hid'),
    ],
  },

  // ── STORY PAGES ──
  // Page 1: "I have a pup. The pup can run!"
  {
    type: 'story', sentences: ['I have a pup.', 'The pup can run!'],
    words: [
      tricky('I', 'I'), tricky('have', 'have'), tricky('a', 'a'), cvc('pup.', 'pup'),
      tricky('The', 'the'), cvc('pup', 'pup'),
      { display: 'can', word: 'can', phonemes: ['c','a','n'] }, cvc('run!', 'run'),
    ],
    imageUrl: '/illustrations/1_5/page1.png', audioUrl: '/sounds/sentences/L1_5_p1.mp3',
  },
  // Page 2: "Run, pup, run! The pup hid in the hut."
  {
    type: 'story', sentences: ['Run, pup, run!', 'The pup hid in the hut.'],
    words: [
      cvc('Run,', 'run'), cvc('pup,', 'pup'), cvc('run!', 'run'),
      tricky('The', 'the'), cvc('pup', 'pup'), cvc('hid', 'hid'),
      { display: 'in', word: 'in', phonemes: ['i','n'] }, tricky('the', 'the'), cvc('hut.', 'hut'),
    ],
    imageUrl: '/illustrations/1_5/page2.png', audioUrl: '/sounds/sentences/L1_5_p2.mp3',
  },
  // Page 3: "Run, pup, run! The pup hid in the bush."
  {
    type: 'story', sentences: ['Run, pup, run!', 'The pup hid in the bush.'],
    words: [
      cvc('Run,', 'run'), cvc('pup,', 'pup'), cvc('run!', 'run'),
      tricky('The', 'the'), cvc('pup', 'pup'), cvc('hid', 'hid'),
      { display: 'in', word: 'in', phonemes: ['i','n'] }, tricky('the', 'the'),
      { display: 'bush.', word: 'bush', phonemes: ['b','u','sh'] },
    ],
    imageUrl: '/illustrations/1_5/page3.png', audioUrl: '/sounds/sentences/L1_5_p3.mp3',
  },
  // Page 4: "Run, pup, run! The pup is in the tub!"
  {
    type: 'story', sentences: ['Run, pup, run!', 'The pup is in the tub!'],
    words: [
      cvc('Run,', 'run'), cvc('pup,', 'pup'), cvc('run!', 'run'),
      tricky('The', 'the'), cvc('pup', 'pup'), tricky('is', 'is'),
      { display: 'in', word: 'in', phonemes: ['i','n'] }, tricky('the', 'the'), cvc('tub!', 'tub'),
    ],
    imageUrl: '/illustrations/1_5/page4.png', audioUrl: '/sounds/sentences/L1_5_p4.mp3',
  },
  // Page 5: "I rub the pup. Rub, rub, rub!"
  {
    type: 'story', sentences: ['I rub the pup.', 'Rub, rub, rub!'],
    words: [
      tricky('I', 'I'), cvc('rub', 'rub'), tricky('the', 'the'), cvc('pup.', 'pup'),
      cvc('Rub,', 'rub'), cvc('rub,', 'rub'), cvc('rub!', 'rub'),
    ],
    imageUrl: '/illustrations/1_5/page5.png', audioUrl: '/sounds/sentences/L1_5_p5.mp3',
  },
  // Page 6: "The pup and me! A big hug!"
  {
    type: 'story', sentences: ['The pup and me!', 'A big hug!'],
    words: [
      tricky('The', 'the'), cvc('pup', 'pup'),
      { display: 'and', word: 'and', phonemes: ['a','n','d'] },
      { display: 'me!', word: 'me', phonemes: ['m','e'] },
      tricky('A', 'a'), cvc('big', 'big'), cvc('hug!', 'hug'),
    ],
    imageUrl: '/illustrations/1_5/page6.png', audioUrl: '/sounds/sentences/L1_5_p6.mp3',
  },

  // ── COMPREHENSION QUIZ ──
  { type: 'quiz', questions: [
    { question: 'What animal is in the story?',
      options: [{ label: 'pup', imageUrl: '/images/words/pup.png', isCorrect: true }, { label: 'cat', imageUrl: '/images/words/cat.png', isCorrect: false }, { label: 'hen', imageUrl: '/images/words/hen.png', isCorrect: false }] },
    { question: 'Where did the pup hide first?',
      options: [{ label: 'hut', imageUrl: '/images/words/hut.png', isCorrect: true }, { label: 'bush', imageUrl: '/images/words/bush.png', isCorrect: false }, { label: 'tub', imageUrl: '/images/words/tub.png', isCorrect: false }] },
    { question: 'What happens at the end?',
      options: [{ label: 'a big hug', imageUrl: '/images/words/hug.png', isCorrect: true }, { label: 'pup runs', imageUrl: '/images/words/run.png', isCorrect: false }, { label: 'pup hides', imageUrl: '/images/words/hid.png', isCorrect: false }] },
  ]},

  // ── SOUND SPOTLIGHTS (u, r, h, b) ──
  { type: 'sound_spotlight', sound: 'u', items: [
    { word: 'bus', imageUrl: '/images/words/bus.png', focusIndex: 1 }, { word: 'cup', imageUrl: '/images/words/cup.png', focusIndex: 1 },
    { word: 'jug', imageUrl: '/images/words/jug.png', focusIndex: 1 }, { word: 'rug', imageUrl: '/images/words/rug.png', focusIndex: 1 }] },
  { type: 'sound_spotlight', sound: 'r', items: [
    { word: 'run', imageUrl: '/images/words/run.png', focusIndex: 0 }, { word: 'rat', imageUrl: '/images/words/rat.png', focusIndex: 0 },
    { word: 'rug', imageUrl: '/images/words/rug.png', focusIndex: 0 }, { word: 'rod', imageUrl: '/images/words/rod.png', focusIndex: 0 }] },
  { type: 'sound_spotlight', sound: 'h', items: [
    { word: 'hat', imageUrl: '/images/words/hat.png', focusIndex: 0 }, { word: 'hen', imageUrl: '/images/words/hen.png', focusIndex: 0 },
    { word: 'hug', imageUrl: '/images/words/hug.png', focusIndex: 0 }, { word: 'hop', imageUrl: '/images/words/hop.png', focusIndex: 0 }] },
  { type: 'sound_spotlight', sound: 'b', items: [
    { word: 'bat', imageUrl: '/images/words/bat.png', focusIndex: 0 }, { word: 'bed', imageUrl: '/images/words/bed.png', focusIndex: 0 },
    { word: 'bus', imageUrl: '/images/words/bus.png', focusIndex: 0 }, { word: 'bun', imageUrl: '/images/words/bun.png', focusIndex: 0 }] },

  // ── WORD READING ──
  { type: 'word_reading', words: [cvc('run', 'run'), cvc('pup', 'pup'), cvc('hug', 'hug'), cvc('rub', 'rub')] },

  // ── TRICKY WORDS ──
  { type: 'tricky_words', words: [tricky('I', 'I'), tricky('a', 'a'), tricky('the', 'the'), tricky('is', 'is'), tricky('have', 'have')] },

  // ── SPELLING ──
  { type: 'spelling', words: [
    { word: 'run', imageUrl: '/images/words/run.png', letters: ['r','u','n'] },
    { word: 'pup', imageUrl: '/images/words/pup.png', letters: ['p','u','p'] },
    { word: 'hug', imageUrl: '/images/words/hug.png', letters: ['h','u','g'] },
    { word: 'tub', imageUrl: '/images/words/tub.png', letters: ['t','u','b'] }] },

  // ── ALIEN WORDS ──
  { type: 'nonsense_words', words: [
    cvc('hup', 'hup'), cvc('rud', 'rud'), cvc('bup', 'bup'), cvc('reb', 'reb'),
    cvc('hib', 'hib'), cvc('rup', 'rup'), cvc('hab', 'hab'),
    { display: 'besh', word: 'besh', phonemes: ['b','e','sh'] },
    cvc('gub', 'gub'), cvc('mub', 'mub'), cvc('lub', 'lub'), cvc('vub', 'vub')] },

  // ── WRITING PRACTICE ──
  { type: 'writing_practice', letters: ['u', 'r', 'h', 'b'] },

  // ── STORY ORDERING ──
  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/1_5/page1.png', label: 'The pup can run!', correctIndex: 0 },
    { imageUrl: '/illustrations/1_5/page2.png', label: 'Hid in the hut.', correctIndex: 1 },
    { imageUrl: '/illustrations/1_5/page3.png', label: 'Hid in the bush.', correctIndex: 2 },
    { imageUrl: '/illustrations/1_5/page4.png', label: 'In the tub!', correctIndex: 3 },
    { imageUrl: '/illustrations/1_5/page5.png', label: 'Rub, rub, rub!', correctIndex: 4 },
    { imageUrl: '/illustrations/1_5/page6.png', label: 'A big hug!', correctIndex: 5 }] },

  // ── DRAWING ──
  { type: 'drawing', prompt: 'Draw Your Favourite Part' },

  // ── CERTIFICATE ──
  { type: 'certificate', bookTitle: 'Run, Pup, Run!' },
];

// ═══════════════════════════════════════════════════════════════════════════
// L1.6 — "Fox Fell Off!"
// Focus sounds: f, l, ff, ll
// ═══════════════════════════════════════════════════════════════════════════

export const BOOK_L1_6_PAGES: InteractivePage[] = [
  // ── COVER ──
  { type: 'cover', title: 'Fox Fell Off!', subtitle: 'Level 1 · Starting Stories', imageUrl: '/illustrations/1_6/cover.png' },

  // ── SOUNDS ──
  {
    type: 'sound_grid',
    focusSounds: ['f', 'l', 'ff', 'll'],
    allSounds: [
      's','a','t','p','i','n','m','d','g','o',
      'c','k','ck','e','u','r','h','b','f','ff',
      'l','ll','ss','j','v','w','x','y','z','zz',
      'qu','ch','sh','th','ng','nk',
    ],
  },

  // ── VOCAB PREVIEW ──
  {
    type: 'vocab_preview',
    words: [
      { display: 'fox', word: 'fox', phonemes: ['f','o','x'] },
      { display: 'fell', word: 'fell', phonemes: ['f','e','ll'] },
      { display: 'off', word: 'off', phonemes: ['o','ff'] },
      cvc('log', 'log'),
      { display: 'wall', word: 'wall', phonemes: ['w','a','ll'] },
      { display: 'hill', word: 'hill', phonemes: ['h','i','ll'] },
      { display: 'fall', word: 'fall', phonemes: ['f','a','ll'] },
      cvc('mat', 'mat'),
    ],
  },

  // ── STORY PAGES ──
  // Page 1: "I have a fox. Fox is on a log."
  {
    type: 'story', sentences: ['I have a fox.', 'Fox is on a log.'],
    words: [
      tricky('I', 'I'), tricky('have', 'have'), tricky('a', 'a'),
      { display: 'fox.', word: 'fox', phonemes: ['f','o','x'] },
      { display: 'Fox', word: 'fox', phonemes: ['f','o','x'] }, tricky('is', 'is'),
      { display: 'on', word: 'on', phonemes: ['o','n'] }, tricky('a', 'a'),
      cvc('log.', 'log'),
    ],
    imageUrl: '/illustrations/1_6/page1.png', audioUrl: '/sounds/sentences/L1_6_p1.mp3',
  },
  // Page 2: "Fox fell off the log! Oh, Fox!"
  {
    type: 'story', sentences: ['Fox fell off the log!', 'Oh, Fox!'],
    words: [
      { display: 'Fox', word: 'fox', phonemes: ['f','o','x'] },
      { display: 'fell', word: 'fell', phonemes: ['f','e','ll'] },
      { display: 'off', word: 'off', phonemes: ['o','ff'] },
      tricky('the', 'the'), cvc('log!', 'log'),
      tricky('Oh,', 'oh'), { display: 'Fox!', word: 'fox', phonemes: ['f','o','x'] },
    ],
    imageUrl: '/illustrations/1_6/page2.png', audioUrl: '/sounds/sentences/L1_6_p2.mp3',
  },
  // Page 3: "Fox is on a wall. Fox fell off the wall!"
  {
    type: 'story', sentences: ['Fox is on a wall.', 'Fox fell off the wall!'],
    words: [
      { display: 'Fox', word: 'fox', phonemes: ['f','o','x'] }, tricky('is', 'is'),
      { display: 'on', word: 'on', phonemes: ['o','n'] }, tricky('a', 'a'),
      { display: 'wall.', word: 'wall', phonemes: ['w','a','ll'] },
      { display: 'Fox', word: 'fox', phonemes: ['f','o','x'] },
      { display: 'fell', word: 'fell', phonemes: ['f','e','ll'] },
      { display: 'off', word: 'off', phonemes: ['o','ff'] },
      tricky('the', 'the'), { display: 'wall!', word: 'wall', phonemes: ['w','a','ll'] },
    ],
    imageUrl: '/illustrations/1_6/page3.png', audioUrl: '/sounds/sentences/L1_6_p3.mp3',
  },
  // Page 4: "Fox is on a hill. Fox fell off the hill!"
  {
    type: 'story', sentences: ['Fox is on a hill.', 'Fox fell off the hill!'],
    words: [
      { display: 'Fox', word: 'fox', phonemes: ['f','o','x'] }, tricky('is', 'is'),
      { display: 'on', word: 'on', phonemes: ['o','n'] }, tricky('a', 'a'),
      { display: 'hill.', word: 'hill', phonemes: ['h','i','ll'] },
      { display: 'Fox', word: 'fox', phonemes: ['f','o','x'] },
      { display: 'fell', word: 'fell', phonemes: ['f','e','ll'] },
      { display: 'off', word: 'off', phonemes: ['o','ff'] },
      tricky('the', 'the'), { display: 'hill!', word: 'hill', phonemes: ['h','i','ll'] },
    ],
    imageUrl: '/illustrations/1_6/page4.png', audioUrl: '/sounds/sentences/L1_6_p4.mp3',
  },
  // Page 5: "I get a big, fat mat. Sit on it, Fox!"
  {
    type: 'story', sentences: ['I get a big, fat mat.', 'Sit on it, Fox!'],
    words: [
      tricky('I', 'I'), { display: 'get', word: 'get', phonemes: ['g','e','t'] },
      tricky('a', 'a'), cvc('big,', 'big'), { display: 'fat', word: 'fat', phonemes: ['f','a','t'] },
      cvc('mat.', 'mat'),
      { display: 'Sit', word: 'sit', phonemes: ['s','i','t'] },
      { display: 'on', word: 'on', phonemes: ['o','n'] },
      { display: 'it,', word: 'it', phonemes: ['i','t'] },
      { display: 'Fox!', word: 'fox', phonemes: ['f','o','x'] },
    ],
    imageUrl: '/illustrations/1_6/page5.png', audioUrl: '/sounds/sentences/L1_6_p5.mp3',
  },
  // Page 6: "Fox is on the mat! Fox did not fall off! I hug Fox!"
  {
    type: 'story', sentences: ['Fox is on the mat!', 'Fox did not fall off!', 'I hug Fox!'],
    words: [
      { display: 'Fox', word: 'fox', phonemes: ['f','o','x'] }, tricky('is', 'is'),
      { display: 'on', word: 'on', phonemes: ['o','n'] }, tricky('the', 'the'),
      cvc('mat!', 'mat'),
      { display: 'Fox', word: 'fox', phonemes: ['f','o','x'] },
      cvc('did', 'did'), { display: 'not', word: 'not', phonemes: ['n','o','t'] },
      { display: 'fall', word: 'fall', phonemes: ['f','a','ll'] },
      { display: 'off!', word: 'off', phonemes: ['o','ff'] },
      tricky('I', 'I'), cvc('hug', 'hug'),
      { display: 'Fox!', word: 'fox', phonemes: ['f','o','x'] },
    ],
    imageUrl: '/illustrations/1_6/page6.png', audioUrl: '/sounds/sentences/L1_6_p6.mp3',
  },

  // ── COMPREHENSION QUIZ ──
  { type: 'quiz', questions: [
    { question: 'What animal is in the story?',
      options: [{ label: 'fox', isCorrect: true }, { label: 'dog', isCorrect: false }, { label: 'cat', isCorrect: false }] },
    { question: 'What does Fox keep falling off?',
      options: [{ label: 'lots of things', isCorrect: true }, { label: 'a bed', isCorrect: false }, { label: 'a cup', isCorrect: false }] },
    { question: 'What stops Fox falling?',
      options: [{ label: 'a mat', isCorrect: true }, { label: 'a box', isCorrect: false }, { label: 'a net', isCorrect: false }] },
  ]},

  // ── SOUND SPOTLIGHTS (f, ff, l, ll) ──
  { type: 'sound_spotlight', sound: 'f', items: [
    { word: 'fox', imageUrl: '/images/words/fox.png', focusIndex: 0 },
    { word: 'fat', imageUrl: '/images/words/fat.png', focusIndex: 0 },
    { word: 'fig', imageUrl: '/images/words/fig.png', focusIndex: 0 },
    { word: 'fin', imageUrl: '/images/words/fin.png', focusIndex: 0 }] },
  { type: 'sound_spotlight', sound: 'll', items: [
    { word: 'fell', imageUrl: '/images/words/fell.png', focusIndex: 2 },
    { word: 'wall', imageUrl: '/images/words/wall.png', focusIndex: 2 },
    { word: 'hill', imageUrl: '/images/words/hill.png', focusIndex: 2 },
    { word: 'bell', imageUrl: '/images/words/bell.png', focusIndex: 2 }] },

  // ── WORD READING ──
  { type: 'word_reading', words: [
    { display: 'fox', word: 'fox', phonemes: ['f','o','x'] },
    { display: 'fell', word: 'fell', phonemes: ['f','e','ll'] },
    { display: 'off', word: 'off', phonemes: ['o','ff'] },
    { display: 'wall', word: 'wall', phonemes: ['w','a','ll'] },
    { display: 'hill', word: 'hill', phonemes: ['h','i','ll'] },
    { display: 'fall', word: 'fall', phonemes: ['f','a','ll'] }] },

  // ── TRICKY WORDS ──
  { type: 'tricky_words', words: [tricky('I', 'I'), tricky('a', 'a'), tricky('the', 'the'), tricky('have', 'have'), tricky('oh', 'oh'), tricky('happy', 'happy')] },

  // ── SPELLING ──
  { type: 'spelling', words: [
    { word: 'fox', imageUrl: '/images/words/fox.png', letters: ['f','o','x'] },
    { word: 'fell', imageUrl: '/images/words/fell.png', letters: ['f','e','ll'] },
    { word: 'off', imageUrl: '/images/words/off.png', letters: ['o','ff'] },
    { word: 'hill', imageUrl: '/images/words/hill.png', letters: ['h','i','ll'] }] },

  // ── ALIEN WORDS ──
  { type: 'nonsense_words', words: [
    { display: 'fob', word: 'fob', phonemes: ['f','o','b'] },
    { display: 'lep', word: 'lep', phonemes: ['l','e','p'] },
    { display: 'fud', word: 'fud', phonemes: ['f','u','d'] },
    { display: 'lig', word: 'lig', phonemes: ['l','i','g'] },
    { display: 'fass', word: 'fass', phonemes: ['f','a','ss'] },
    { display: 'loff', word: 'loff', phonemes: ['l','o','ff'] },
    { display: 'dill', word: 'dill', phonemes: ['d','i','ll'] },
    { display: 'mell', word: 'mell', phonemes: ['m','e','ll'] },
    cvc('nop', 'nop'), cvc('tig', 'tig'),
    cvc('bun', 'bun'), cvc('ped', 'ped')] },

  // ── WRITING PRACTICE ──
  { type: 'writing_practice', letters: ['f', 'ff', 'l', 'll'] },

  // ── STORY ORDERING ──
  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/1_6/page1.png', label: 'Fox on a log.', correctIndex: 0 },
    { imageUrl: '/illustrations/1_6/page2.png', label: 'Fell off the log!', correctIndex: 1 },
    { imageUrl: '/illustrations/1_6/page3.png', label: 'Fox on a wall.', correctIndex: 2 },
    { imageUrl: '/illustrations/1_6/page4.png', label: 'Fox on a hill.', correctIndex: 3 },
    { imageUrl: '/illustrations/1_6/page5.png', label: 'A big, fat mat.', correctIndex: 4 },
    { imageUrl: '/illustrations/1_6/page6.png', label: 'Fox did not fall!', correctIndex: 5 }] },

  // ── DRAWING ──
  { type: 'drawing', prompt: 'Draw Your Favourite Part' },

  // ── CERTIFICATE ──
  { type: 'certificate', bookTitle: 'Fox Fell Off!' },
];

// ═══════════════════════════════════════════════════════════════════════════
// L1.7 — "The Jam Jug"
// Focus sounds: j, v, w
// ═══════════════════════════════════════════════════════════════════════════

export const BOOK_L1_7_PAGES: InteractivePage[] = [
  // ── COVER ──
  { type: 'cover', title: 'The Jam Jug', subtitle: 'Level 1 · Starting Stories', imageUrl: '/illustrations/1_7/cover.png' },

  // ── SOUNDS ──
  {
    type: 'sound_grid',
    focusSounds: ['j', 'v', 'w'],
    allSounds: [
      's','a','t','p','i','n','m','d','g','o',
      'c','k','ck','e','u','r','h','b','f','ff',
      'l','ll','ss','j','v','w','x','y','z','zz',
      'qu','ch','sh','th','ng','nk',
    ],
  },

  // ── VOCAB PREVIEW ──
  {
    type: 'vocab_preview',
    words: [
      { display: 'jam', word: 'jam', phonemes: ['j','a','m'] },
      { display: 'jug', word: 'jug', phonemes: ['j','u','g'] },
      { display: 'van', word: 'van', phonemes: ['v','a','n'] },
      { display: 'wet', word: 'wet', phonemes: ['w','e','t'] },
      cvc('rug', 'rug'),
      cvc('dip', 'dip'),
      cvc('rag', 'rag'),
      cvc('mop', 'mop'),
    ],
  },

  // ── STORY PAGES ──
  // Page 1: "Dad has a van. The van has jam in big jugs."
  {
    type: 'story', sentences: ['Dad has a van.', 'The van has jam in big jugs.'],
    words: [
      { display: 'Dad', word: 'dad', phonemes: ['d','a','d'] },
      { display: 'has', word: 'has', phonemes: ['h','a','s'] },
      tricky('a', 'a'), { display: 'van.', word: 'van', phonemes: ['v','a','n'] },
      tricky('The', 'the'), { display: 'van', word: 'van', phonemes: ['v','a','n'] },
      { display: 'has', word: 'has', phonemes: ['h','a','s'] },
      { display: 'jam', word: 'jam', phonemes: ['j','a','m'] },
      { display: 'in', word: 'in', phonemes: ['i','n'] }, cvc('big', 'big'),
      { display: 'jugs.', word: 'jug', phonemes: ['j','u','g'] },
    ],
    imageUrl: '/illustrations/1_7/page1.png', audioUrl: '/sounds/sentences/L1_7_p1.mp3',
  },
  // Page 2: "I dip in a jug. Fig jam! It is yum!"
  {
    type: 'story', sentences: ['I dip in a jug.', 'Fig jam! It is yum!'],
    words: [
      tricky('I', 'I'), cvc('dip', 'dip'),
      { display: 'in', word: 'in', phonemes: ['i','n'] }, tricky('a', 'a'),
      { display: 'jug.', word: 'jug', phonemes: ['j','u','g'] },
      { display: 'Fig', word: 'fig', phonemes: ['f','i','g'] },
      { display: 'jam!', word: 'jam', phonemes: ['j','a','m'] },
      { display: 'It', word: 'it', phonemes: ['i','t'] }, tricky('is', 'is'),
      { display: 'yum!', word: 'yum', phonemes: ['y','u','m'] },
    ],
    imageUrl: '/illustrations/1_7/page2.png', audioUrl: '/sounds/sentences/L1_7_p2.mp3',
  },
  // Page 3: "I dip in a jug. Red jam! It is yum!"
  {
    type: 'story', sentences: ['I dip in a jug.', 'Red jam! It is yum!'],
    words: [
      tricky('I', 'I'), cvc('dip', 'dip'),
      { display: 'in', word: 'in', phonemes: ['i','n'] }, tricky('a', 'a'),
      { display: 'jug.', word: 'jug', phonemes: ['j','u','g'] },
      { display: 'Red', word: 'red', phonemes: ['r','e','d'] },
      { display: 'jam!', word: 'jam', phonemes: ['j','a','m'] },
      { display: 'It', word: 'it', phonemes: ['i','t'] }, tricky('is', 'is'),
      { display: 'yum!', word: 'yum', phonemes: ['y','u','m'] },
    ],
    imageUrl: '/illustrations/1_7/page3.png', audioUrl: '/sounds/sentences/L1_7_p3.mp3',
  },
  // Page 4: "The jug tips! Jam on the rug! Oh, no!"
  {
    type: 'story', sentences: ['The jug tips!', 'Jam on the rug!', 'Oh, no!'],
    words: [
      tricky('The', 'the'), { display: 'jug', word: 'jug', phonemes: ['j','u','g'] },
      { display: 'tips!', word: 'tip', phonemes: ['t','i','p'] },
      { display: 'Jam', word: 'jam', phonemes: ['j','a','m'] },
      { display: 'on', word: 'on', phonemes: ['o','n'] },
      tricky('the', 'the'), cvc('rug!', 'rug'),
      tricky('Oh,', 'oh'), tricky('no!', 'no'),
    ],
    imageUrl: '/illustrations/1_7/page4.png', audioUrl: '/sounds/sentences/L1_7_p4.mp3',
  },
  // Page 5: "I get a wet rag. I mop it up."
  {
    type: 'story', sentences: ['I get a wet rag.', 'I mop it up.'],
    words: [
      tricky('I', 'I'), { display: 'get', word: 'get', phonemes: ['g','e','t'] },
      tricky('a', 'a'), { display: 'wet', word: 'wet', phonemes: ['w','e','t'] },
      cvc('rag.', 'rag'),
      tricky('I', 'I'), cvc('mop', 'mop'),
      { display: 'it', word: 'it', phonemes: ['i','t'] },
      { display: 'up.', word: 'up', phonemes: ['u','p'] },
    ],
    imageUrl: '/illustrations/1_7/page5.png', audioUrl: '/sounds/sentences/L1_7_p5.mp3',
  },
  // Page 6: "No jam on the rug! I did it! I hug Dad."
  {
    type: 'story', sentences: ['No jam on the rug!', 'I did it!', 'I hug Dad.'],
    words: [
      tricky('No', 'no'), { display: 'jam', word: 'jam', phonemes: ['j','a','m'] },
      { display: 'on', word: 'on', phonemes: ['o','n'] },
      tricky('the', 'the'), cvc('rug!', 'rug'),
      tricky('I', 'I'), cvc('did', 'did'), { display: 'it!', word: 'it', phonemes: ['i','t'] },
      tricky('I', 'I'), cvc('hug', 'hug'),
      { display: 'Dad.', word: 'dad', phonemes: ['d','a','d'] },
    ],
    imageUrl: '/illustrations/1_7/page6.png', audioUrl: '/sounds/sentences/L1_7_p6.mp3',
  },

  // ── COMPREHENSION QUIZ ──
  { type: 'quiz', questions: [
    { question: 'What is in the jugs?',
      options: [{ label: 'jam', isCorrect: true }, { label: 'milk', isCorrect: false }, { label: 'soup', isCorrect: false }] },
    { question: 'What happens to the jug?',
      options: [{ label: 'it tips over', isCorrect: true }, { label: 'it breaks', isCorrect: false }, { label: 'it falls off', isCorrect: false }] },
    { question: 'How does the child clean up?',
      options: [{ label: 'a wet rag', isCorrect: true }, { label: 'a big mop', isCorrect: false }, { label: 'a towel', isCorrect: false }] },
  ]},

  // ── SOUND SPOTLIGHTS (j, v, w) ──
  { type: 'sound_spotlight', sound: 'j', items: [
    { word: 'jam', imageUrl: '/images/words/jam.png', focusIndex: 0 },
    { word: 'jug', imageUrl: '/images/words/jug.png', focusIndex: 0 },
    { word: 'jet', imageUrl: '/images/words/jet.png', focusIndex: 0 },
    { word: 'jog', imageUrl: '/images/words/jog.png', focusIndex: 0 }] },
  { type: 'sound_spotlight', sound: 'v', items: [
    { word: 'van', imageUrl: '/images/words/van.png', focusIndex: 0 },
    { word: 'vet', imageUrl: '/images/words/vet.png', focusIndex: 0 },
    { word: 'vim', imageUrl: '/images/words/vim.png', focusIndex: 0 },
    { word: 'vat', imageUrl: '/images/words/vat.png', focusIndex: 0 }] },
  { type: 'sound_spotlight', sound: 'w', items: [
    { word: 'wet', imageUrl: '/images/words/wet.png', focusIndex: 0 },
    { word: 'win', imageUrl: '/images/words/win.png', focusIndex: 0 },
    { word: 'web', imageUrl: '/images/words/web.png', focusIndex: 0 },
    { word: 'wig', imageUrl: '/images/words/wig.png', focusIndex: 0 }] },

  // ── WORD READING ──
  { type: 'word_reading', words: [
    { display: 'jam', word: 'jam', phonemes: ['j','a','m'] },
    { display: 'jug', word: 'jug', phonemes: ['j','u','g'] },
    { display: 'van', word: 'van', phonemes: ['v','a','n'] },
    { display: 'wet', word: 'wet', phonemes: ['w','e','t'] },
    cvc('rug', 'rug'), cvc('rag', 'rag')] },

  // ── TRICKY WORDS ──
  { type: 'tricky_words', words: [tricky('I', 'I'), tricky('a', 'a'), tricky('the', 'the'), tricky('no', 'no'), tricky('oh', 'oh')] },

  // ── SPELLING ──
  { type: 'spelling', words: [
    { word: 'jam', imageUrl: '/images/words/jam.png', letters: ['j','a','m'] },
    { word: 'jug', imageUrl: '/images/words/jug.png', letters: ['j','u','g'] },
    { word: 'van', imageUrl: '/images/words/van.png', letters: ['v','a','n'] },
    { word: 'wet', imageUrl: '/images/words/wet.png', letters: ['w','e','t'] }] },

  // ── ALIEN WORDS ──
  { type: 'nonsense_words', words: [
    { display: 'jib', word: 'jib', phonemes: ['j','i','b'] },
    { display: 'vog', word: 'vog', phonemes: ['v','o','g'] },
    { display: 'wup', word: 'wup', phonemes: ['w','u','p'] },
    { display: 'jed', word: 'jed', phonemes: ['j','e','d'] },
    { display: 'vam', word: 'vam', phonemes: ['v','a','m'] },
    { display: 'wid', word: 'wid', phonemes: ['w','i','d'] },
    { display: 'jun', word: 'jun', phonemes: ['j','u','n'] },
    { display: 'vep', word: 'vep', phonemes: ['v','e','p'] },
    cvc('nob', 'nob'), cvc('teg', 'teg'),
    cvc('dup', 'dup'), cvc('hin', 'hin')] },

  // ── WRITING PRACTICE ──
  { type: 'writing_practice', letters: ['j', 'v', 'w'] },

  // ── STORY ORDERING ──
  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/1_7/page1.png', label: 'Dad has a van.', correctIndex: 0 },
    { imageUrl: '/illustrations/1_7/page2.png', label: 'Fig jam! Yum!', correctIndex: 1 },
    { imageUrl: '/illustrations/1_7/page3.png', label: 'Red jam! Yum!', correctIndex: 2 },
    { imageUrl: '/illustrations/1_7/page4.png', label: 'Jam on the rug!', correctIndex: 3 },
    { imageUrl: '/illustrations/1_7/page5.png', label: 'I mop it up.', correctIndex: 4 },
    { imageUrl: '/illustrations/1_7/page6.png', label: 'I hug Dad.', correctIndex: 5 }] },

  // ── DRAWING ──
  { type: 'drawing', prompt: 'Draw Your Favourite Part' },

  // ── CERTIFICATE ──
  { type: 'certificate', bookTitle: 'The Jam Jug' },
];

// ═══════════════════════════════════════════════════════════════════════════
// L1.8 — "The Yak and the Box"
// Focus sounds: x, y, z
// ═══════════════════════════════════════════════════════════════════════════

export const BOOK_L1_8_PAGES: InteractivePage[] = [
  // ── COVER ──
  { type: 'cover', title: 'The Yak and the Box', subtitle: 'Level 1 · Starting Stories', imageUrl: '/illustrations/1_8/cover.png' },

  // ── SOUNDS ──
  {
    type: 'sound_grid',
    focusSounds: ['x', 'y', 'z'],
    allSounds: [
      's','a','t','p','i','n','m','d','g','o',
      'c','k','ck','e','u','r','h','b','f','ff',
      'l','ll','ss','j','v','w','x','y','z','zz',
      'qu','ch','sh','th','ng','nk',
    ],
  },

  // ── VOCAB PREVIEW ──
  {
    type: 'vocab_preview',
    words: [
      { display: 'yak', word: 'yak', phonemes: ['y','a','k'] },
      { display: 'box', word: 'box', phonemes: ['b','o','x'] },
      { display: 'six', word: 'six', phonemes: ['s','i','x'] },
      { display: 'zip', word: 'zip', phonemes: ['z','i','p'] },
      { display: 'fix', word: 'fix', phonemes: ['f','i','x'] },
      cvc('fig', 'fig'),
      cvc('hut', 'hut'),
      cvc('set', 'set'),
    ],
  },

  // ── STORY PAGES ──
  // Page 1: "I have a yak. The yak is big!"
  {
    type: 'story', sentences: ['I have a yak.', 'The yak is big!'],
    words: [
      tricky('I', 'I'), tricky('have', 'have'), tricky('a', 'a'),
      { display: 'yak.', word: 'yak', phonemes: ['y','a','k'] },
      tricky('The', 'the'), { display: 'yak', word: 'yak', phonemes: ['y','a','k'] },
      tricky('is', 'is'), cvc('big!', 'big'),
    ],
    imageUrl: '/illustrations/1_8/page1.png', audioUrl: '/sounds/sentences/L1_8_p1.mp3',
  },
  // Page 2: "I have a box. I zip it up. Six figs in the box."
  {
    type: 'story', sentences: ['I have a box.', 'I zip it up.', 'Six figs in the box.'],
    words: [
      tricky('I', 'I'), tricky('have', 'have'), tricky('a', 'a'),
      { display: 'box.', word: 'box', phonemes: ['b','o','x'] },
      tricky('I', 'I'), { display: 'zip', word: 'zip', phonemes: ['z','i','p'] },
      { display: 'it', word: 'it', phonemes: ['i','t'] },
      { display: 'up.', word: 'up', phonemes: ['u','p'] },
      { display: 'Six', word: 'six', phonemes: ['s','i','x'] },
      { display: 'figs', word: 'fig', phonemes: ['f','i','g'] },
      { display: 'in', word: 'in', phonemes: ['i','n'] },
      tricky('the', 'the'), { display: 'box.', word: 'box', phonemes: ['b','o','x'] },
    ],
    imageUrl: '/illustrations/1_8/page2.png', audioUrl: '/sounds/sentences/L1_8_p2.mp3',
  },
  // Page 3: "The yak sat on the box! Oh, no!"
  {
    type: 'story', sentences: ['The yak sat on the box!', 'Oh, no!'],
    words: [
      tricky('The', 'the'), { display: 'yak', word: 'yak', phonemes: ['y','a','k'] },
      cvc('sat', 'sat'), { display: 'on', word: 'on', phonemes: ['o','n'] },
      tricky('the', 'the'), { display: 'box!', word: 'box', phonemes: ['b','o','x'] },
      tricky('Oh,', 'oh'), tricky('no!', 'no'),
    ],
    imageUrl: '/illustrations/1_8/page3.png', audioUrl: '/sounds/sentences/L1_8_p3.mp3',
  },
  // Page 4: "I fix the box. I set it on top of the hut."
  {
    type: 'story', sentences: ['I fix the box.', 'I set it on top of the hut.'],
    words: [
      tricky('I', 'I'), { display: 'fix', word: 'fix', phonemes: ['f','i','x'] },
      tricky('the', 'the'), { display: 'box.', word: 'box', phonemes: ['b','o','x'] },
      tricky('I', 'I'), cvc('set', 'set'),
      { display: 'it', word: 'it', phonemes: ['i','t'] },
      { display: 'on', word: 'on', phonemes: ['o','n'] },
      cvc('top', 'top'), tricky('of', 'of'),
      tricky('the', 'the'), cvc('hut.', 'hut'),
    ],
    imageUrl: '/illustrations/1_8/page4.png', audioUrl: '/sounds/sentences/L1_8_p4.mp3',
  },
  // Page 5: "The yak can not get it! I get the six figs."
  {
    type: 'story', sentences: ['The yak can not get it!', 'I get the six figs.'],
    words: [
      tricky('The', 'the'), { display: 'yak', word: 'yak', phonemes: ['y','a','k'] },
      { display: 'can', word: 'can', phonemes: ['c','a','n'] },
      { display: 'not', word: 'not', phonemes: ['n','o','t'] },
      { display: 'get', word: 'get', phonemes: ['g','e','t'] },
      { display: 'it!', word: 'it', phonemes: ['i','t'] },
      tricky('I', 'I'), { display: 'get', word: 'get', phonemes: ['g','e','t'] },
      tricky('the', 'the'), { display: 'six', word: 'six', phonemes: ['s','i','x'] },
      { display: 'figs.', word: 'fig', phonemes: ['f','i','g'] },
    ],
    imageUrl: '/illustrations/1_8/page5.png', audioUrl: '/sounds/sentences/L1_8_p5.mp3',
  },
  // Page 6: "I munch a fig. The big yak gets a fig. Yum!"
  {
    type: 'story', sentences: ['I munch a fig.', 'The big yak gets a fig.', 'Yum!'],
    words: [
      tricky('I', 'I'), { display: 'munch', word: 'munch', phonemes: ['m','u','n','ch'] },
      tricky('a', 'a'), cvc('fig.', 'fig'),
      tricky('The', 'the'), cvc('big', 'big'),
      { display: 'yak', word: 'yak', phonemes: ['y','a','k'] },
      { display: 'gets', word: 'get', phonemes: ['g','e','t'] },
      tricky('a', 'a'), cvc('fig.', 'fig'),
      { display: 'Yum!', word: 'yum', phonemes: ['y','u','m'] },
    ],
    imageUrl: '/illustrations/1_8/page6.png', audioUrl: '/sounds/sentences/L1_8_p6.mp3',
  },

  // ── COMPREHENSION QUIZ ──
  { type: 'quiz', questions: [
    { question: 'What animal is in the story?',
      options: [{ label: 'a yak', isCorrect: true }, { label: 'a dog', isCorrect: false }, { label: 'a fox', isCorrect: false }] },
    { question: 'What does the yak sit on?',
      options: [{ label: 'the box', isCorrect: true }, { label: 'the mat', isCorrect: false }, { label: 'the rug', isCorrect: false }] },
    { question: 'Where does the child put the box?',
      options: [{ label: 'on the hut', isCorrect: true }, { label: 'in the van', isCorrect: false }, { label: 'on the hill', isCorrect: false }] },
  ]},

  // ── SOUND SPOTLIGHTS (x, y, z) ──
  { type: 'sound_spotlight', sound: 'x', items: [
    { word: 'box', imageUrl: '/images/words/box.png', focusIndex: 2 },
    { word: 'six', imageUrl: '/images/words/six.png', focusIndex: 2 },
    { word: 'fox', imageUrl: '/images/words/fox.png', focusIndex: 2 },
    { word: 'mix', imageUrl: '/images/words/mix.png', focusIndex: 2 }] },
  { type: 'sound_spotlight', sound: 'y', items: [
    { word: 'yak', imageUrl: '/images/words/yak.png', focusIndex: 0 },
    { word: 'yam', imageUrl: '/images/words/yam.png', focusIndex: 0 },
    { word: 'yap', imageUrl: '/images/words/yap.png', focusIndex: 0 },
    { word: 'yes', imageUrl: '/images/words/yes.png', focusIndex: 0 }] },
  { type: 'sound_spotlight', sound: 'z', items: [
    { word: 'zip', imageUrl: '/images/words/zip.png', focusIndex: 0 },
    { word: 'zap', imageUrl: '/images/words/zap.png', focusIndex: 0 },
    { word: 'zig', imageUrl: '/images/words/zig.png', focusIndex: 0 },
    { word: 'zag', imageUrl: '/images/words/zag.png', focusIndex: 0 }] },

  // ── WORD READING ──
  { type: 'word_reading', words: [
    { display: 'yak', word: 'yak', phonemes: ['y','a','k'] },
    { display: 'box', word: 'box', phonemes: ['b','o','x'] },
    { display: 'six', word: 'six', phonemes: ['s','i','x'] },
    { display: 'zip', word: 'zip', phonemes: ['z','i','p'] },
    { display: 'fix', word: 'fix', phonemes: ['f','i','x'] },
    cvc('hut', 'hut')] },

  // ── TRICKY WORDS ──
  { type: 'tricky_words', words: [tricky('I', 'I'), tricky('a', 'a'), tricky('the', 'the'), tricky('have', 'have'), tricky('no', 'no'), tricky('oh', 'oh')] },

  // ── SPELLING ──
  { type: 'spelling', words: [
    { word: 'yak', imageUrl: '/images/words/yak.png', letters: ['y','a','k'] },
    { word: 'box', imageUrl: '/images/words/box.png', letters: ['b','o','x'] },
    { word: 'six', imageUrl: '/images/words/six.png', letters: ['s','i','x'] },
    { word: 'zip', imageUrl: '/images/words/zip.png', letters: ['z','i','p'] }] },

  // ── ALIEN WORDS ──
  { type: 'nonsense_words', words: [
    { display: 'yob', word: 'yob', phonemes: ['y','o','b'] },
    { display: 'zeg', word: 'zeg', phonemes: ['z','e','g'] },
    { display: 'xip', word: 'xip', phonemes: ['x','i','p'] },
    { display: 'yud', word: 'yud', phonemes: ['y','u','d'] },
    { display: 'zan', word: 'zan', phonemes: ['z','a','n'] },
    { display: 'bix', word: 'bix', phonemes: ['b','i','x'] },
    { display: 'yem', word: 'yem', phonemes: ['y','e','m'] },
    { display: 'zop', word: 'zop', phonemes: ['z','o','p'] },
    cvc('nub', 'nub'), cvc('tig', 'tig'),
    cvc('pod', 'pod'), cvc('lem', 'lem')] },

  // ── WRITING PRACTICE ──
  { type: 'writing_practice', letters: ['x', 'y', 'z'] },

  // ── STORY ORDERING ──
  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/1_8/page1.png', label: 'I have a yak.', correctIndex: 0 },
    { imageUrl: '/illustrations/1_8/page2.png', label: 'Six figs in a box.', correctIndex: 1 },
    { imageUrl: '/illustrations/1_8/page3.png', label: 'Yak sat on the box!', correctIndex: 2 },
    { imageUrl: '/illustrations/1_8/page4.png', label: 'I fix the box.', correctIndex: 3 },
    { imageUrl: '/illustrations/1_8/page5.png', label: 'Yak can not get it!', correctIndex: 4 },
    { imageUrl: '/illustrations/1_8/page6.png', label: 'I munch a fig.', correctIndex: 5 }] },

  // ── DRAWING ──
  { type: 'drawing', prompt: 'Draw Your Favourite Part' },

  // ── CERTIFICATE ──
  { type: 'certificate', bookTitle: 'The Yak and the Box' },
];

// ═══════════════════════════════════════════════════════════════════════════
// L1.9 — "Chop, Chop, Chop!"
// Focus sounds: ch, th
// ═══════════════════════════════════════════════════════════════════════════

export const BOOK_L1_9_PAGES: InteractivePage[] = [
  // ── COVER ──
  { type: 'cover', title: 'Chop, Chop, Chop!', subtitle: 'Level 1 · Starting Stories', imageUrl: '/illustrations/1_9/cover.png' },

  // ── SOUNDS ──
  {
    type: 'sound_grid',
    focusSounds: ['ch', 'th'],
    allSounds: [
      's','a','t','p','i','n','m','d','g','o',
      'c','k','ck','e','u','r','h','b','f','ff',
      'l','ll','ss','j','v','w','x','y','z','zz',
      'qu','ch','sh','th','ng','nk',
    ],
  },

  // ── VOCAB PREVIEW ──
  {
    type: 'vocab_preview',
    words: [
      { display: 'chop', word: 'chop', phonemes: ['ch','o','p'] },
      { display: 'chip', word: 'chip', phonemes: ['ch','i','p'] },
      { display: 'thin', word: 'thin', phonemes: ['th','i','n'] },
      { display: 'thick', word: 'thick', phonemes: ['th','i','ck'] },
      { display: 'this', word: 'this', phonemes: ['th','i','s'] },
      { display: 'munch', word: 'munch', phonemes: ['m','u','n','ch'] },
      cvc('dip', 'dip'),
      cvc('pan', 'pan'),
    ],
  },

  // ── STORY PAGES ──
  // Page 1: "Nan chops, chops, chops! This is fun!"
  {
    type: 'story', sentences: ['Nan chops, chops, chops!', 'This is fun!'],
    words: [
      { display: 'Nan', word: 'nan', phonemes: ['n','a','n'] },
      { display: 'chops,', word: 'chop', phonemes: ['ch','o','p'] },
      { display: 'chops,', word: 'chop', phonemes: ['ch','o','p'] },
      { display: 'chops!', word: 'chop', phonemes: ['ch','o','p'] },
      { display: 'This', word: 'this', phonemes: ['th','i','s'] },
      tricky('is', 'is'), { display: 'fun!', word: 'fun', phonemes: ['f','u','n'] },
    ],
    imageUrl: '/illustrations/1_9/page1.png', audioUrl: '/sounds/sentences/L1_9_p1.mp3',
  },
  // Page 2: "Nan chops it thin. Nan chops it thick."
  {
    type: 'story', sentences: ['Nan chops it thin.', 'Nan chops it thick.'],
    words: [
      { display: 'Nan', word: 'nan', phonemes: ['n','a','n'] },
      { display: 'chops', word: 'chop', phonemes: ['ch','o','p'] },
      { display: 'it', word: 'it', phonemes: ['i','t'] },
      { display: 'thin.', word: 'thin', phonemes: ['th','i','n'] },
      { display: 'Nan', word: 'nan', phonemes: ['n','a','n'] },
      { display: 'chops', word: 'chop', phonemes: ['ch','o','p'] },
      { display: 'it', word: 'it', phonemes: ['i','t'] },
      { display: 'thick.', word: 'thick', phonemes: ['th','i','ck'] },
    ],
    imageUrl: '/illustrations/1_9/page2.png', audioUrl: '/sounds/sentences/L1_9_p2.mp3',
  },
  // Page 3: "Chips in a hot pan. I got a big dish!"
  {
    type: 'story', sentences: ['Chips in a hot pan.', 'I got a big dish!'],
    words: [
      { display: 'Chips', word: 'chip', phonemes: ['ch','i','p'] },
      { display: 'in', word: 'in', phonemes: ['i','n'] }, tricky('a', 'a'),
      cvc('hot', 'hot'), cvc('pan.', 'pan'),
      tricky('I', 'I'), cvc('got', 'got'), tricky('a', 'a'),
      cvc('big', 'big'), { display: 'dish!', word: 'dish', phonemes: ['d','i','sh'] },
    ],
    imageUrl: '/illustrations/1_9/page3.png', audioUrl: '/sounds/sentences/L1_9_p3.mp3',
  },
  // Page 4: "I got a chip. That chip is thick!"
  {
    type: 'story', sentences: ['I got a chip.', 'That chip is thick!'],
    words: [
      tricky('I', 'I'), cvc('got', 'got'), tricky('a', 'a'),
      { display: 'chip.', word: 'chip', phonemes: ['ch','i','p'] },
      { display: 'That', word: 'that', phonemes: ['th','a','t'] },
      { display: 'chip', word: 'chip', phonemes: ['ch','i','p'] },
      tricky('is', 'is'), { display: 'thick!', word: 'thick', phonemes: ['th','i','ck'] },
    ],
    imageUrl: '/illustrations/1_9/page4.png', audioUrl: '/sounds/sentences/L1_9_p4.mp3',
  },
  // Page 5: "I dip a chip in. Yum, yum, yum!"
  {
    type: 'story', sentences: ['I dip a chip in.', 'Yum, yum, yum!'],
    words: [
      tricky('I', 'I'), cvc('dip', 'dip'), tricky('a', 'a'),
      { display: 'chip', word: 'chip', phonemes: ['ch','i','p'] },
      { display: 'in.', word: 'in', phonemes: ['i','n'] },
      { display: 'Yum,', word: 'yum', phonemes: ['y','u','m'] },
      { display: 'yum,', word: 'yum', phonemes: ['y','u','m'] },
      { display: 'yum!', word: 'yum', phonemes: ['y','u','m'] },
    ],
    imageUrl: '/illustrations/1_9/page5.png', audioUrl: '/sounds/sentences/L1_9_p5.mp3',
  },
  // Page 6: "Chips with Nan! Munch, munch, munch!"
  {
    type: 'story', sentences: ['Chips with Nan!', 'Munch, munch, munch!'],
    words: [
      { display: 'Chips', word: 'chip', phonemes: ['ch','i','p'] },
      { display: 'with', word: 'with', phonemes: ['w','i','th'] },
      { display: 'Nan!', word: 'nan', phonemes: ['n','a','n'] },
      { display: 'Munch,', word: 'munch', phonemes: ['m','u','n','ch'] },
      { display: 'munch,', word: 'munch', phonemes: ['m','u','n','ch'] },
      { display: 'munch!', word: 'munch', phonemes: ['m','u','n','ch'] },
    ],
    imageUrl: '/illustrations/1_9/page6.png', audioUrl: '/sounds/sentences/L1_9_p6.mp3',
  },

  // ── COMPREHENSION QUIZ ──
  { type: 'quiz', questions: [
    { question: 'Who is making chips?',
      options: [{ label: 'Nan', isCorrect: true }, { label: 'Dad', isCorrect: false }, { label: 'Mum', isCorrect: false }] },
    { question: 'How does Nan chop them?',
      options: [{ label: 'thin and thick', isCorrect: true }, { label: 'big and small', isCorrect: false }, { label: 'long and short', isCorrect: false }] },
    { question: 'What does the child do with a chip?',
      options: [{ label: 'dips it in', isCorrect: true }, { label: 'drops it', isCorrect: false }, { label: 'cuts it up', isCorrect: false }] },
  ]},

  // ── SOUND SPOTLIGHTS (ch, th) ──
  { type: 'sound_spotlight', sound: 'ch', items: [
    { word: 'chop', imageUrl: '/images/words/chop.png', focusIndex: 0 },
    { word: 'chin', imageUrl: '/images/words/chin.png', focusIndex: 0 },
    { word: 'chat', imageUrl: '/images/words/chat.png', focusIndex: 0 },
    { word: 'chip', imageUrl: '/images/words/chip.png', focusIndex: 0 }] },
  { type: 'sound_spotlight', sound: 'th', items: [
    { word: 'thin', imageUrl: '/images/words/thin.png', focusIndex: 0 },
    { word: 'bath', imageUrl: '/images/words/bath.png', focusIndex: 2 },
    { word: 'moth', imageUrl: '/images/words/moth.png', focusIndex: 2 },
    { word: 'path', imageUrl: '/images/words/path.png', focusIndex: 2 }] },

  // ── WORD READING ──
  { type: 'word_reading', words: [
    { display: 'chop', word: 'chop', phonemes: ['ch','o','p'] },
    { display: 'chip', word: 'chip', phonemes: ['ch','i','p'] },
    { display: 'thin', word: 'thin', phonemes: ['th','i','n'] },
    { display: 'thick', word: 'thick', phonemes: ['th','i','ck'] },
    { display: 'this', word: 'this', phonemes: ['th','i','s'] },
    { display: 'that', word: 'that', phonemes: ['th','a','t'] }] },

  // ── TRICKY WORDS ──
  { type: 'tricky_words', words: [tricky('I', 'I'), tricky('a', 'a'), tricky('the', 'the'), tricky('is', 'is'), tricky('have', 'have'), tricky('happy', 'happy')] },

  // ── SPELLING ──
  { type: 'spelling', words: [
    { word: 'chop', imageUrl: '/images/words/chop.png', letters: ['ch','o','p'] },
    { word: 'chip', imageUrl: '/images/words/chip.png', letters: ['ch','i','p'] },
    { word: 'thin', imageUrl: '/images/words/thin.png', letters: ['th','i','n'] },
    { word: 'this', imageUrl: '/images/words/this.png', letters: ['th','i','s'] }] },

  // ── ALIEN WORDS ──
  { type: 'nonsense_words', words: [
    { display: 'chod', word: 'chod', phonemes: ['ch','o','d'] },
    { display: 'chep', word: 'chep', phonemes: ['ch','e','p'] },
    { display: 'chib', word: 'chib', phonemes: ['ch','i','b'] },
    { display: 'chun', word: 'chun', phonemes: ['ch','u','n'] },
    { display: 'thob', word: 'thob', phonemes: ['th','o','b'] },
    { display: 'them', word: 'them', phonemes: ['th','e','m'] },
    { display: 'thud', word: 'thud', phonemes: ['th','u','d'] },
    { display: 'thig', word: 'thig', phonemes: ['th','i','g'] },
    { display: 'dach', word: 'dach', phonemes: ['d','a','ch'] },
    { display: 'mich', word: 'mich', phonemes: ['m','i','ch'] },
    { display: 'foch', word: 'foch', phonemes: ['f','o','ch'] },
    { display: 'luch', word: 'luch', phonemes: ['l','u','ch'] }] },

  // ── WRITING PRACTICE ──
  { type: 'writing_practice', letters: ['ch', 'th'] },

  // ── STORY ORDERING ──
  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/1_9/page1.png', label: 'Nan chops!', correctIndex: 0 },
    { imageUrl: '/illustrations/1_9/page2.png', label: 'Thin and thick.', correctIndex: 1 },
    { imageUrl: '/illustrations/1_9/page3.png', label: 'Chips in a pan.', correctIndex: 2 },
    { imageUrl: '/illustrations/1_9/page4.png', label: 'A thick chip!', correctIndex: 3 },
    { imageUrl: '/illustrations/1_9/page5.png', label: 'Dip it in!', correctIndex: 4 },
    { imageUrl: '/illustrations/1_9/page6.png', label: 'Munch, munch!', correctIndex: 5 }] },

  // ── DRAWING ──
  { type: 'drawing', prompt: 'Draw Your Favourite Part' },

  // ── CERTIFICATE ──
  { type: 'certificate', bookTitle: 'Chop, Chop, Chop!' },
];

// ═══════════════════════════════════════════════════════════════════════════
// L1.10 — "Buzz and Sing!"
// Focus sounds: ss, zz, qu, ng
// ═══════════════════════════════════════════════════════════════════════════

export const BOOK_L1_10_PAGES: InteractivePage[] = [
  // ── COVER ──
  { type: 'cover', title: 'Buzz and Sing!', subtitle: 'Level 1 · Starting Stories', imageUrl: '/illustrations/1_10/cover.png' },

  // ── SOUNDS ──
  {
    type: 'sound_grid',
    focusSounds: ['ss', 'zz', 'qu', 'ng'],
    allSounds: [
      's','a','t','p','i','n','m','d','g','o',
      'c','k','ck','e','u','r','h','b','f','ff',
      'l','ll','ss','j','v','w','x','y','z','zz',
      'qu','ch','sh','th','ng','nk',
    ],
  },

  // ── VOCAB PREVIEW ──
  {
    type: 'vocab_preview',
    words: [
      { display: 'buzz', word: 'buzz', phonemes: ['b','u','zz'] },
      { display: 'hiss', word: 'hiss', phonemes: ['h','i','ss'] },
      { display: 'sing', word: 'sing', phonemes: ['s','i','ng'] },
      { display: 'song', word: 'song', phonemes: ['s','o','ng'] },
      { display: 'long', word: 'long', phonemes: ['l','o','ng'] },
      { display: 'quick', word: 'quick', phonemes: ['qu','i','ck'] },
      cvc('bug', 'bug'),
      cvc('log', 'log'),
    ],
  },

  // ── STORY PAGES ──
  // Page 1: "I sit on a big log. Buzz, buzz, buzz!"
  {
    type: 'story', sentences: ['I sit on a big log.', 'Buzz, buzz, buzz!'],
    words: [
      tricky('I', 'I'), cvc('sit', 'sit'),
      { display: 'on', word: 'on', phonemes: ['o','n'] }, tricky('a', 'a'),
      cvc('big', 'big'), cvc('log.', 'log'),
      { display: 'Buzz,', word: 'buzz', phonemes: ['b','u','zz'] },
      { display: 'buzz,', word: 'buzz', phonemes: ['b','u','zz'] },
      { display: 'buzz!', word: 'buzz', phonemes: ['b','u','zz'] },
    ],
    imageUrl: '/illustrations/1_10/page1.png', audioUrl: '/sounds/sentences/L1_10_p1.mp3',
  },
  // Page 2: "A big bug sits on a rock. Hiss, hiss, hiss!"
  {
    type: 'story', sentences: ['A big bug sits on a rock.', 'Hiss, hiss, hiss!'],
    words: [
      tricky('A', 'a'), cvc('big', 'big'), cvc('bug', 'bug'),
      { display: 'sits', word: 'sit', phonemes: ['s','i','t'] },
      { display: 'on', word: 'on', phonemes: ['o','n'] }, tricky('a', 'a'),
      { display: 'rock.', word: 'rock', phonemes: ['r','o','ck'] },
      { display: 'Hiss,', word: 'hiss', phonemes: ['h','i','ss'] },
      { display: 'hiss,', word: 'hiss', phonemes: ['h','i','ss'] },
      { display: 'hiss!', word: 'hiss', phonemes: ['h','i','ss'] },
    ],
    imageUrl: '/illustrations/1_10/page2.png', audioUrl: '/sounds/sentences/L1_10_p2.mp3',
  },
  // Page 3: "I sing a long, long song!"
  {
    type: 'story', sentences: ['I sing a long, long song!'],
    words: [
      tricky('I', 'I'), { display: 'sing', word: 'sing', phonemes: ['s','i','ng'] },
      tricky('a', 'a'), { display: 'long,', word: 'long', phonemes: ['l','o','ng'] },
      { display: 'long', word: 'long', phonemes: ['l','o','ng'] },
      { display: 'song!', word: 'song', phonemes: ['s','o','ng'] },
    ],
    imageUrl: '/illustrations/1_10/page3.png', audioUrl: '/sounds/sentences/L1_10_p3.mp3',
  },
  // Page 4: "I sing! No buzz! No hiss!"
  {
    type: 'story', sentences: ['I sing!', 'No buzz! No hiss!'],
    words: [
      tricky('I', 'I'), { display: 'sing!', word: 'sing', phonemes: ['s','i','ng'] },
      tricky('No', 'no'), { display: 'buzz!', word: 'buzz', phonemes: ['b','u','zz'] },
      tricky('No', 'no'), { display: 'hiss!', word: 'hiss', phonemes: ['h','i','ss'] },
    ],
    imageUrl: '/illustrations/1_10/page4.png',
  },
  // Page 5: "I sing quick! I sing and sing!"
  {
    type: 'story', sentences: ['I sing quick!', 'I sing and sing!'],
    words: [
      tricky('I', 'I'), { display: 'sing', word: 'sing', phonemes: ['s','i','ng'] },
      { display: 'quick!', word: 'quick', phonemes: ['qu','i','ck'] },
      tricky('I', 'I'), { display: 'sing', word: 'sing', phonemes: ['s','i','ng'] },
      { display: 'and', word: 'and', phonemes: ['a','n','d'] },
      { display: 'sing!', word: 'sing', phonemes: ['s','i','ng'] },
    ],
    imageUrl: '/illustrations/1_10/page5.png', audioUrl: '/sounds/sentences/L1_10_p5.mp3',
  },
  // Page 6: "Buzz! Hiss! I sing with the bugs!"
  {
    type: 'story', sentences: ['Buzz! Hiss!', 'I sing with the bugs!'],
    words: [
      { display: 'Buzz!', word: 'buzz', phonemes: ['b','u','zz'] },
      { display: 'Hiss!', word: 'hiss', phonemes: ['h','i','ss'] },
      tricky('I', 'I'), { display: 'sing', word: 'sing', phonemes: ['s','i','ng'] },
      { display: 'with', word: 'with', phonemes: ['w','i','th'] },
      tricky('the', 'the'), { display: 'bugs!', word: 'bug', phonemes: ['b','u','g'] },
    ],
    imageUrl: '/illustrations/1_10/page6.png', audioUrl: '/sounds/sentences/L1_10_p6.mp3',
  },

  // ── COMPREHENSION QUIZ ──
  { type: 'quiz', questions: [
    { question: 'Where does the child sit?',
      options: [{ label: 'on a log', isCorrect: true }, { label: 'on a rock', isCorrect: false }, { label: 'on a mat', isCorrect: false }] },
    { question: 'What sounds do the bugs make?',
      options: [{ label: 'buzz and hiss', isCorrect: true }, { label: 'sing and hum', isCorrect: false }, { label: 'tap and clap', isCorrect: false }] },
    { question: 'What makes the bugs stop?',
      options: [{ label: 'the singing', isCorrect: true }, { label: 'a loud bang', isCorrect: false }, { label: 'the rain', isCorrect: false }] },
  ]},

  // ── SOUND SPOTLIGHTS (ng, qu, ss, zz) ──
  { type: 'sound_spotlight', sound: 'ng', items: [
    { word: 'ring', imageUrl: '/images/words/ring.png', focusIndex: 2 },
    { word: 'song', imageUrl: '/images/words/song.png', focusIndex: 2 },
    { word: 'king', imageUrl: '/images/words/king.png', focusIndex: 2 },
    { word: 'gong', imageUrl: '/images/words/gong.png', focusIndex: 2 }] },
  { type: 'sound_spotlight', sound: 'qu', items: [
    { word: 'quiz', imageUrl: '/images/words/quiz.png', focusIndex: 0 },
    { word: 'quit', imageUrl: '/images/words/quit.png', focusIndex: 0 },
    { word: 'quack', imageUrl: '/images/words/quack.png', focusIndex: 0 },
    { word: 'quill', imageUrl: '/images/words/quill.png', focusIndex: 0 }] },
  { type: 'sound_spotlight', sound: 'ss', items: [
    { word: 'hiss', imageUrl: '/images/words/hiss.png', focusIndex: 2 },
    { word: 'moss', imageUrl: '/images/words/moss.png', focusIndex: 2 },
    { word: 'miss', imageUrl: '/images/words/miss.png', focusIndex: 2 },
    { word: 'boss', imageUrl: '/images/words/boss.png', focusIndex: 2 }] },
  { type: 'sound_spotlight', sound: 'zz', items: [
    { word: 'buzz', imageUrl: '/images/words/buzz.png', focusIndex: 2 },
    { word: 'fizz', imageUrl: '/images/words/fizz.png', focusIndex: 2 },
    { word: 'jazz', imageUrl: '/images/words/jazz.png', focusIndex: 2 },
    { word: 'fuzz', imageUrl: '/images/words/fuzz.png', focusIndex: 2 }] },

  // ── WORD READING ──
  { type: 'word_reading', words: [
    { display: 'buzz', word: 'buzz', phonemes: ['b','u','zz'] },
    { display: 'hiss', word: 'hiss', phonemes: ['h','i','ss'] },
    { display: 'sing', word: 'sing', phonemes: ['s','i','ng'] },
    { display: 'song', word: 'song', phonemes: ['s','o','ng'] },
    { display: 'quick', word: 'quick', phonemes: ['qu','i','ck'] },
    { display: 'ring', word: 'ring', phonemes: ['r','i','ng'] }] },

  // ── TRICKY WORDS ──
  { type: 'tricky_words', words: [tricky('I', 'I'), tricky('a', 'a'), tricky('the', 'the'), tricky('no', 'no')] },

  // ── SPELLING ──
  { type: 'spelling', words: [
    { word: 'buzz', imageUrl: '/images/words/buzz.png', letters: ['b','u','zz'] },
    { word: 'hiss', imageUrl: '/images/words/hiss.png', letters: ['h','i','ss'] },
    { word: 'sing', imageUrl: '/images/words/sing.png', letters: ['s','i','ng'] },
    { word: 'song', imageUrl: '/images/words/song.png', letters: ['s','o','ng'] }] },

  // ── ALIEN WORDS ──
  { type: 'nonsense_words', words: [
    { display: 'rong', word: 'rong', phonemes: ['r','o','ng'] },
    { display: 'bung', word: 'bung', phonemes: ['b','u','ng'] },
    { display: 'ding', word: 'ding', phonemes: ['d','i','ng'] },
    { display: 'mang', word: 'mang', phonemes: ['m','a','ng'] },
    { display: 'quob', word: 'quob', phonemes: ['qu','o','b'] },
    { display: 'quem', word: 'quem', phonemes: ['qu','e','m'] },
    { display: 'doss', word: 'doss', phonemes: ['d','o','ss'] },
    { display: 'tuss', word: 'tuss', phonemes: ['t','u','ss'] },
    { display: 'mozz', word: 'mozz', phonemes: ['m','o','zz'] },
    { display: 'nuzz', word: 'nuzz', phonemes: ['n','u','zz'] },
    { display: 'lizz', word: 'lizz', phonemes: ['l','i','zz'] },
    { display: 'dazz', word: 'dazz', phonemes: ['d','a','zz'] }] },

  // ── WRITING PRACTICE ──
  { type: 'writing_practice', letters: ['ss', 'zz', 'qu', 'ng'] },

  // ── STORY ORDERING ──
  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/1_10/page1.png', label: 'Buzz, buzz, buzz!', correctIndex: 0 },
    { imageUrl: '/illustrations/1_10/page2.png', label: 'Hiss, hiss, hiss!', correctIndex: 1 },
    { imageUrl: '/illustrations/1_10/page3.png', label: 'A long, long song!', correctIndex: 2 },
    { imageUrl: '/illustrations/1_10/page4.png', label: 'The bugs stop!', correctIndex: 3 },
    { imageUrl: '/illustrations/1_10/page5.png', label: 'I sing quick!', correctIndex: 4 },
    { imageUrl: '/illustrations/1_10/page6.png', label: 'I sing with bugs!', correctIndex: 5 }] },

  // ── DRAWING ──
  { type: 'drawing', prompt: 'Draw Your Favourite Part' },

  // ── CERTIFICATE ──
  { type: 'certificate', bookTitle: 'Buzz and Sing!' },
];

import {
  BOOK_L2_1_PAGES, BOOK_L2_2_PAGES, BOOK_L2_3_PAGES,
  BOOK_L2_4_PAGES, BOOK_L2_5_PAGES,
} from './interactiveBookDataL2';
import {
  BOOK_L3_1_PAGES, BOOK_L3_2_PAGES, BOOK_L3_3_PAGES,
  BOOK_L3_4_PAGES, BOOK_L3_5_PAGES,
} from './interactiveBookDataL3';
import {
  BOOK_L4_1_PAGES, BOOK_L4_2_PAGES, BOOK_L4_3_PAGES, BOOK_L4_4_PAGES,
} from './interactiveBookDataL4';
import {
  BOOK_L5_1_PAGES, BOOK_L5_2_PAGES, BOOK_L5_3_PAGES, BOOK_L5_4_PAGES,
} from './interactiveBookDataL5';
import {
  BOOK_L6_1_PAGES, BOOK_L6_2_PAGES, BOOK_L6_3_PAGES, BOOK_L6_4_PAGES,
} from './interactiveBookDataL6';

/** Map of sub-level keys to interactive page data (expandable to more books) */
export const INTERACTIVE_BOOKS: Record<string, InteractivePage[]> = {
  'L1.1': BOOK_L1_1_PAGES,
  'L1.2': BOOK_L1_2_PAGES,
  'L1.3': BOOK_L1_3_PAGES,
  'L1.4': BOOK_L1_4_PAGES,
  'L1.5': BOOK_L1_5_PAGES,
  'L1.6': BOOK_L1_6_PAGES,
  'L1.7': BOOK_L1_7_PAGES,
  'L1.8': BOOK_L1_8_PAGES,
  'L1.9': BOOK_L1_9_PAGES,
  'L1.10': BOOK_L1_10_PAGES,
  'L2.1': BOOK_L2_1_PAGES,
  'L2.2': BOOK_L2_2_PAGES,
  'L2.3': BOOK_L2_3_PAGES,
  'L2.4': BOOK_L2_4_PAGES,
  'L2.5': BOOK_L2_5_PAGES,
  'L3.1': BOOK_L3_1_PAGES,
  'L3.2': BOOK_L3_2_PAGES,
  'L3.3': BOOK_L3_3_PAGES,
  'L3.4': BOOK_L3_4_PAGES,
  'L3.5': BOOK_L3_5_PAGES,
  'L4.1': BOOK_L4_1_PAGES,
  'L4.2': BOOK_L4_2_PAGES,
  'L4.3': BOOK_L4_3_PAGES,
  'L4.4': BOOK_L4_4_PAGES,
  'L5.1': BOOK_L5_1_PAGES,
  'L5.2': BOOK_L5_2_PAGES,
  'L5.3': BOOK_L5_3_PAGES,
  'L5.4': BOOK_L5_4_PAGES,
  'L6.1': BOOK_L6_1_PAGES,
  'L6.2': BOOK_L6_2_PAGES,
  'L6.3': BOOK_L6_3_PAGES,
  'L6.4': BOOK_L6_4_PAGES,
};

/** Check if interactive data exists for a given book sub-level */
export function hasInteractiveData(subLevel: string): boolean {
  return subLevel in INTERACTIVE_BOOKS;
}
