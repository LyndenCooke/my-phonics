/**
 * Interactive book data for Level 3 — "New Spellings"
 * Focus: split vowel digraphs (a-e, i-e, o-e, u-e) and vowel digraphs (ea, oi, aw, ai, oa, ie)
 *
 * L3.1 "The Big Bike Race"   — a-e, i-e
 * L3.2 "Lost at the Night Market" — o-e, u-e
 * L3.3 "Reach for the Treat" — ea, ie
 * L3.4 "What Min Saw"        — oi, aw
 * L3.5 "The Boat with the Red Sail" — ai, oa
 */

import type { InteractivePage, StoryWord } from './interactiveBookData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function w(display: string, word: string, phonemes: string[]): StoryWord {
  return { display, word, phonemes };
}

function tricky(display: string, word: string): StoryWord {
  return { display, word, phonemes: [], isTricky: true };
}

// Level 3 allSounds grid (all L1 + L2 + L3 sounds)
const L3_ALL_SOUNDS = [
  's/ss', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o',
  'c/k/ck', 'e', 'u', 'r', 'h', 'b', 'f/ff',
  'l/ll', 'j', 'v', 'w', 'x', 'y', 'z/zz',
  'qu', 'ch', 'sh', 'th', 'ng', 'nk',
  'ee', 'oo', 'ar', 'or', 'ur', 'ow', 'oi',
  'ea', 'a-e', 'i-e', 'o-e', 'u-e', 'aw', 'ai', 'oa', 'ie',
];

// ═══════════════════════════════════════════════════════════════════════════════
// L3.1 — "The Big Bike Race"
// Focus sounds: a-e, i-e
// ═══════════════════════════════════════════════════════════════════════════════

export const BOOK_L3_1_PAGES: InteractivePage[] = [
  // ── COVER ──
  {
    type: 'cover',
    title: 'The Big Bike Race',
    subtitle: 'Level 3 · New Spellings',
    imageUrl: '/illustrations/3_1/cover.png',
  },

  // ── SOUND GRID ──
  {
    type: 'sound_grid',
    focusSounds: ['a-e', 'i-e'],
    allSounds: L3_ALL_SOUNDS,
  },

  // ── VOCAB PREVIEW ──
  {
    type: 'vocab_preview',
    words: [
      w('ride', 'ride', ['r','i-e','d']),
      w('bike', 'bike', ['b','i-e','k']),
      w('gate', 'gate', ['g','a-e','t']),
      w('lake', 'lake', ['l','a-e','k']),
      w('made', 'made', ['m','a-e','d']),
      w('brave', 'brave', ['b','r','a-e','v']),
      w('pine', 'pine', ['p','i-e','n']),
      w('wide', 'wide', ['w','i-e','d']),
      w('line', 'line', ['l','i-e','n']),
    ],
  },

  // ── STORY PAGES ──
  // Page 1: "Bikes line up at the gate..."
  {
    type: 'story',
    sentences: ['Bikes line up at the gate.', 'It is time for the race to start!', 'I stand with my bike on the line.'],
    words: [
      w('Bikes', 'bikes', ['b','i-e','k','s']),
      w('line', 'line', ['l','i-e','n']),
      w('up', 'up', ['u','p']),
      w('at', 'at', ['a','t']),
      tricky('the', 'the'),
      w('gate.', 'gate', ['g','a-e','t']),
      w('It', 'it', ['i','t']),
      tricky('is', 'is'),
      w('time', 'time', ['t','i-e','m']),
      w('for', 'for', ['f','or']),
      tricky('the', 'the'),
      w('race', 'race', ['r','a-e','s']),
      tricky('to', 'to'),
      w('start!', 'start', ['s','t','ar','t']),
      tricky('I', 'I'),
      w('stand', 'stand', ['s','t','a','n','d']),
      w('with', 'with', ['w','i','th']),
      w('my', 'my', ['m','y']),
      w('bike', 'bike', ['b','i-e','k']),
      w('on', 'on', ['o','n']),
      tricky('the', 'the'),
      w('line.', 'line', ['l','i-e','n']),
    ],
    imageUrl: '/illustrations/3_1/page1.png', audioUrl: '/sounds/sentences/L3_1_p1.mp3',
  },

  // Page 2: "'Ride to the lake and back!' the man said."
  {
    type: 'story',
    sentences: ["'Ride to the lake and back!' the man said.", 'Can I win?', 'I grip my bike tight.'],
    words: [
      w("'Ride", 'ride', ['r','i-e','d']),
      tricky('to', 'to'),
      tricky('the', 'the'),
      w('lake', 'lake', ['l','a-e','k']),
      w('and', 'and', ['a','n','d']),
      w("back!'", 'back', ['b','a','ck']),
      tricky('the', 'the'),
      w('man', 'man', ['m','a','n']),
      tricky('said.', 'said'),
      w('Can', 'can', ['c','a','n']),
      tricky('I', 'I'),
      w('win?', 'win', ['w','i','n']),
      tricky('I', 'I'),
      w('grip', 'grip', ['g','r','i','p']),
      w('my', 'my', ['m','y']),
      w('bike', 'bike', ['b','i-e','k']),
      w('tight.', 'tight', ['t','igh','t']),
    ],
    imageUrl: '/illustrations/3_1/page2.png', audioUrl: '/sounds/sentences/L3_1_p2.mp3',
  },

  // Page 3: "Off I go! Past a tall pine tree..."
  {
    type: 'story',
    sentences: ['Off I go!', 'Past a tall pine tree.', 'Past a wide stone gate.', 'I ride fast in the sun.'],
    words: [
      w('Off', 'off', ['o','ff']),
      tricky('I', 'I'),
      tricky('go!', 'go'),
      w('Past', 'past', ['p','a','s','t']),
      tricky('a', 'a'),
      tricky('tall', 'tall'),
      w('pine', 'pine', ['p','i-e','n']),
      w('tree.', 'tree', ['t','r','ee']),
      w('Past', 'past', ['p','a','s','t']),
      tricky('a', 'a'),
      w('wide', 'wide', ['w','i-e','d']),
      w('stone', 'stone', ['s','t','o-e','n']),
      w('gate.', 'gate', ['g','a-e','t']),
      tricky('I', 'I'),
      w('ride', 'ride', ['r','i-e','d']),
      w('fast', 'fast', ['f','a','s','t']),
      w('in', 'in', ['i','n']),
      tricky('the', 'the'),
      w('sun.', 'sun', ['s','u','n']),
    ],
    imageUrl: '/illustrations/3_1/page3.png', audioUrl: '/sounds/sentences/L3_1_p3.mp3',
  },

  // Page 4: "Look out! Stones on the track."
  {
    type: 'story',
    sentences: ['Look out!', 'Stones on the track.', 'A bike slides and a girl falls off.', 'She gave me a brave smile.'],
    words: [
      w('Look', 'look', ['l','oo','k']),
      w('out!', 'out', ['ou','t']),
      w('Stones', 'stones', ['s','t','o-e','n','s']),
      w('on', 'on', ['o','n']),
      tricky('the', 'the'),
      w('track.', 'track', ['t','r','a','ck']),
      tricky('A', 'a'),
      w('bike', 'bike', ['b','i-e','k']),
      w('slides', 'slides', ['s','l','i-e','d','s']),
      w('and', 'and', ['a','n','d']),
      tricky('a', 'a'),
      w('girl', 'girl', ['g','ir','l']),
      w('falls', 'falls', ['f','a','ll','s']),
      w('off.', 'off', ['o','ff']),
      tricky('She', 'she'),
      w('gave', 'gave', ['g','a-e','v']),
      w('me', 'me', ['m','ee']),
      tricky('a', 'a'),
      w('brave', 'brave', ['b','r','a-e','v']),
      w('smile.', 'smile', ['s','m','i-e','l']),
    ],
    imageUrl: '/illustrations/3_1/page4.png', audioUrl: '/sounds/sentences/L3_1_p4.mp3',
  },

  // Page 5: "I can see the lake!"
  {
    type: 'story',
    sentences: ['I can see the lake!', 'It shines in the sun.', 'I ride past it and turn back.'],
    words: [
      tricky('I', 'I'),
      w('can', 'can', ['c','a','n']),
      w('see', 'see', ['s','ee']),
      tricky('the', 'the'),
      w('lake!', 'lake', ['l','a-e','k']),
      w('It', 'it', ['i','t']),
      w('shines', 'shines', ['sh','i-e','n','s']),
      w('in', 'in', ['i','n']),
      tricky('the', 'the'),
      w('sun.', 'sun', ['s','u','n']),
      tricky('I', 'I'),
      w('ride', 'ride', ['r','i-e','d']),
      w('past', 'past', ['p','a','s','t']),
      w('it', 'it', ['i','t']),
      w('and', 'and', ['a','n','d']),
      w('turn', 'turn', ['t','ur','n']),
      w('back.', 'back', ['b','a','ck']),
    ],
    imageUrl: '/illustrations/3_1/page5.png', audioUrl: '/sounds/sentences/L3_1_p5.mp3',
  },

  // Page 6: "Can I make it back in time?"
  {
    type: 'story',
    sentences: ['Can I make it back in time?', 'I ride and ride.', 'I must not be late!'],
    words: [
      w('Can', 'can', ['c','a','n']),
      tricky('I', 'I'),
      w('make', 'make', ['m','a-e','k']),
      w('it', 'it', ['i','t']),
      w('back', 'back', ['b','a','ck']),
      w('in', 'in', ['i','n']),
      w('time?', 'time', ['t','i-e','m']),
      tricky('I', 'I'),
      w('ride', 'ride', ['r','i-e','d']),
      w('and', 'and', ['a','n','d']),
      w('ride.', 'ride', ['r','i-e','d']),
      tricky('I', 'I'),
      w('must', 'must', ['m','u','s','t']),
      w('not', 'not', ['n','o','t']),
      w('be', 'be', ['b','ee']),
      w('late!', 'late', ['l','a-e','t']),
    ],
    imageUrl: '/illustrations/3_1/page6.png', audioUrl: '/sounds/sentences/L3_1_p6.mp3',
  },

  // Page 7: "I am past the line! I made it!"
  {
    type: 'story',
    sentences: ['I am past the line!', 'I made it!', 'I slide off my bike with a wide grin.'],
    words: [
      tricky('I', 'I'),
      w('am', 'am', ['a','m']),
      w('past', 'past', ['p','a','s','t']),
      tricky('the', 'the'),
      w('line!', 'line', ['l','i-e','n']),
      tricky('I', 'I'),
      w('made', 'made', ['m','a-e','d']),
      w('it!', 'it', ['i','t']),
      tricky('I', 'I'),
      w('slide', 'slide', ['s','l','i-e','d']),
      w('off', 'off', ['o','ff']),
      w('my', 'my', ['m','y']),
      w('bike', 'bike', ['b','i-e','k']),
      w('with', 'with', ['w','i','th']),
      tricky('a', 'a'),
      w('wide', 'wide', ['w','i-e','d']),
      w('grin.', 'grin', ['g','r','i','n']),
    ],
    imageUrl: '/illustrations/3_1/page7.png', audioUrl: '/sounds/sentences/L3_1_p7.mp3',
  },

  // Page 8: "A prize! I am on the top step!"
  {
    type: 'story',
    sentences: ['A prize!', 'I am on the top step!', 'I smile and wave at my mates.', 'What a good day!'],
    words: [
      tricky('A', 'a'),
      w('prize!', 'prize', ['p','r','i-e','z']),
      tricky('I', 'I'),
      w('am', 'am', ['a','m']),
      w('on', 'on', ['o','n']),
      tricky('the', 'the'),
      w('top', 'top', ['t','o','p']),
      w('step!', 'step', ['s','t','e','p']),
      tricky('I', 'I'),
      w('smile', 'smile', ['s','m','i-e','l']),
      w('and', 'and', ['a','n','d']),
      w('wave', 'wave', ['w','a-e','v']),
      w('at', 'at', ['a','t']),
      w('my', 'my', ['m','y']),
      w('mates.', 'mates', ['m','a-e','t','s']),
      tricky('What', 'what'),
      tricky('a', 'a'),
      w('good', 'good', ['g','oo','d']),
      w('day!', 'day', ['d','ay']),
    ],
    imageUrl: '/illustrations/3_1/page8.png', audioUrl: '/sounds/sentences/L3_1_p8.mp3',
  },

  // ── QUIZ ──
  {
    type: 'quiz',
    questions: [
      { question: 'Where did they ride to?',
        options: [{ label: 'the lake', isCorrect: true }, { label: 'the shops', isCorrect: false }, { label: 'the park', isCorrect: false }] },
      { question: 'What happened on the track?',
        options: [{ label: 'a girl fell off', isCorrect: true }, { label: 'it rained', isCorrect: false }, { label: 'a dog ran past', isCorrect: false }] },
      { question: 'What happened at the end?',
        options: [{ label: 'he got on the top step', isCorrect: true }, { label: 'he fell off', isCorrect: false }, { label: 'he came last', isCorrect: false }] },
    ],
  },

  // ── SOUND SPOTLIGHTS ──
  { type: 'sound_spotlight', sound: 'a-e', items: [
    { word: 'cake', imageUrl: '/images/words/cake.png', focusIndex: 1 },
    { word: 'gate', imageUrl: '/images/words/gate.png', focusIndex: 1 },
    { word: 'lake', imageUrl: '/images/words/lake.png', focusIndex: 1 },
    { word: 'name', imageUrl: '/images/words/name.png', focusIndex: 1 }] },
  { type: 'sound_spotlight', sound: 'i-e', items: [
    { word: 'bike', imageUrl: '/images/words/bike.png', focusIndex: 1 },
    { word: 'ride', imageUrl: '/images/words/ride.png', focusIndex: 1 },
    { word: 'pine', imageUrl: '/images/words/pine.png', focusIndex: 1 },
    { word: 'smile', imageUrl: '/images/words/smile.png', focusIndex: 2 }] },

  // ── WORD READING ──
  { type: 'word_reading', words: [
    w('bike', 'bike', ['b','i-e','k']), w('gate', 'gate', ['g','a-e','t']),
    w('ride', 'ride', ['r','i-e','d']), w('lake', 'lake', ['l','a-e','k']),
    w('made', 'made', ['m','a-e','d']), w('line', 'line', ['l','i-e','n'])] },

  // ── TRICKY WORDS ──
  { type: 'tricky_words', words: [
    tricky('the', 'the'), tricky('said', 'said'), tricky('some', 'some'),
    w('like', 'like', ['l','i-e','k']), tricky('what', 'what'), tricky('all', 'all')] },

  // ── SPELLING ──
  { type: 'spelling', words: [
    { word: 'bike', imageUrl: '/images/words/bike.png', letters: ['b','i','k','e'] },
    { word: 'gate', imageUrl: '/images/words/gate.png', letters: ['g','a','t','e'] },
    { word: 'ride', imageUrl: '/images/words/ride.png', letters: ['r','i','d','e'] },
    { word: 'lake', imageUrl: '/images/words/lake.png', letters: ['l','a','k','e'] }] },

  // ── NONSENSE WORDS ──
  { type: 'nonsense_words', words: [
    w('dake', 'dake', ['d','a-e','k']), w('fipe', 'fipe', ['f','i-e','p']),
    w('grine', 'grine', ['g','r','i-e','n']), w('blate', 'blate', ['b','l','a-e','t']),
    w('snide', 'snide', ['s','n','i-e','d']), w('prame', 'prame', ['p','r','a-e','m']),
    w('trike', 'trike', ['t','r','i-e','k']), w('glane', 'glane', ['g','l','a-e','n'])] },

  // ── WRITING PRACTICE ──
  { type: 'writing_practice', letters: ['a-e', 'i-e', 'a', 'i'] },

  // ── STORY ORDERING ──
  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/3_1/page1.png', label: 'Bikes line up at the gate.', correctIndex: 0 },
    { imageUrl: '/illustrations/3_1/page2.png', label: 'Ride to the lake!', correctIndex: 1 },
    { imageUrl: '/illustrations/3_1/page3.png', label: 'Past a pine tree.', correctIndex: 2 },
    { imageUrl: '/illustrations/3_1/page4.png', label: 'A girl falls off!', correctIndex: 3 },
    { imageUrl: '/illustrations/3_1/page5.png', label: 'I can see the lake!', correctIndex: 4 },
    { imageUrl: '/illustrations/3_1/page6.png', label: 'Can I make it?', correctIndex: 5 },
    { imageUrl: '/illustrations/3_1/page7.png', label: 'I made it!', correctIndex: 6 },
    { imageUrl: '/illustrations/3_1/page8.png', label: 'A prize!', correctIndex: 7 }] },

  // ── DRAWING ──
  { type: 'drawing', prompt: 'Draw Your Favourite Part' },

  // ── CERTIFICATE ──
  { type: 'certificate', bookTitle: 'The Big Bike Race' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// L3.2 — "Lost at the Night Market"
// Focus sounds: o-e, u-e
// ═══════════════════════════════════════════════════════════════════════════════

export const BOOK_L3_2_PAGES: InteractivePage[] = [
  {
    type: 'cover',
    title: 'Lost at the Night Market',
    subtitle: 'Level 3 · New Spellings',
    imageUrl: '/illustrations/3_2/cover.png',
  },
  {
    type: 'sound_grid',
    focusSounds: ['o-e', 'u-e'],
    allSounds: L3_ALL_SOUNDS,
  },
  {
    type: 'vocab_preview',
    words: [
      w('close', 'close', ['c','l','o-e','s']),
      w('spoke', 'spoke', ['s','p','o-e','k']),
      w('huge', 'huge', ['h','u-e','j']),
      w('stone', 'stone', ['s','t','o-e','n']),
      w('home', 'home', ['h','o-e','m']),
      w('froze', 'froze', ['f','r','o-e','z']),
      w('bright', 'bright', ['b','r','igh','t']),
      w('noodle', 'noodle', ['n','oo','d','l']),
    ],
  },

  // Page 1
  {
    type: 'story',
    sentences: ['Mum and I went to the night market.', 'It was huge!', "\u2018Stay close to me,\u2019 Mum spoke.", 'And I did.'],
    words: [
      w('Mum', 'mum', ['m','u','m']),
      w('and', 'and', ['a','n','d']),
      tricky('I', 'I'),
      w('went', 'went', ['w','e','n','t']),
      tricky('to', 'to'),
      tricky('the', 'the'),
      w('night', 'night', ['n','igh','t']),
      w('market.', 'market', ['m','ar','k','e','t']),
      w('It', 'it', ['i','t']),
      tricky('was', 'was'),
      w('huge!', 'huge', ['h','u-e','j']),
      w("'Stay", 'stay', ['s','t','ay']),
      w('close', 'close', ['c','l','o-e','s']),
      tricky('to', 'to'),
      w("me,'", 'me', ['m','ee']),
      w('Mum', 'mum', ['m','u','m']),
      w('spoke.', 'spoke', ['s','p','o-e','k']),
      w('And', 'and', ['a','n','d']),
      tricky('I', 'I'),
      w('did.', 'did', ['d','i','d']),
    ],
    imageUrl: '/illustrations/3_2/page1.png', audioUrl: '/sounds/sentences/L3_2_p1.mp3',
  },

  // Page 2
  {
    type: 'story',
    sentences: ['We see cute stone elephants on a stall.', 'We see bright noodle pots.', 'The food smelt so good!'],
    words: [
      tricky('We', 'we'),
      w('see', 'see', ['s','ee']),
      w('cute', 'cute', ['c','u-e','t']),
      w('stone', 'stone', ['s','t','o-e','n']),
      tricky('elephants', 'elephant'),
      w('on', 'on', ['o','n']),
      tricky('a', 'a'),
      tricky('stall.', 'stall'),
      tricky('We', 'we'),
      w('see', 'see', ['s','ee']),
      w('bright', 'bright', ['b','r','igh','t']),
      w('noodle', 'noodle', ['n','oo','d','l']),
      w('pots.', 'pots', ['p','o','t','s']),
      tricky('The', 'the'),
      w('food', 'food', ['f','oo','d']),
      w('smelt', 'smelt', ['s','m','e','l','t']),
      tricky('so', 'so'),
      w('good!', 'good', ['g','oo','d']),
    ],
    imageUrl: '/illustrations/3_2/page2.png', audioUrl: '/sounds/sentences/L3_2_p2.mp3',
  },

  // Page 3
  {
    type: 'story',
    sentences: ['Then a man bumped me!', 'I spun round and round.', 'I cannot see Mum!', 'I froze.'],
    words: [
      w('Then', 'then', ['th','e','n']),
      tricky('a', 'a'),
      w('man', 'man', ['m','a','n']),
      w('bumped', 'bumped', ['b','u','m','p','d']),
      w('me!', 'me', ['m','ee']),
      tricky('I', 'I'),
      w('spun', 'spun', ['s','p','u','n']),
      w('round', 'round', ['r','ou','n','d']),
      w('and', 'and', ['a','n','d']),
      w('round.', 'round', ['r','ou','n','d']),
      tricky('I', 'I'),
      w('cannot', 'cannot', ['c','a','n','o','t']),
      w('see', 'see', ['s','ee']),
      w('Mum!', 'mum', ['m','u','m']),
      tricky('I', 'I'),
      w('froze.', 'froze', ['f','r','o-e','z']),
    ],
    imageUrl: '/illustrations/3_2/page3.png', audioUrl: '/sounds/sentences/L3_2_p3.mp3',
  },

  // Page 4
  {
    type: 'story',
    sentences: ['It was dark and loud.', 'I felt so small.', "\u2018Mum!\u2019 I shout.", 'But Mum is not there.'],
    words: [
      w('It', 'it', ['i','t']),
      tricky('was', 'was'),
      w('dark', 'dark', ['d','ar','k']),
      w('and', 'and', ['a','n','d']),
      w('loud.', 'loud', ['l','ou','d']),
      tricky('I', 'I'),
      w('felt', 'felt', ['f','e','l','t']),
      tricky('so', 'so'),
      tricky('small.', 'small'),
      w("'Mum!'", 'mum', ['m','u','m']),
      tricky('I', 'I'),
      w('shout.', 'shout', ['sh','ou','t']),
      w('But', 'but', ['b','u','t']),
      w('Mum', 'mum', ['m','u','m']),
      w('is', 'is', ['i','z']),
      w('not', 'not', ['n','o','t']),
      tricky('there.', 'there'),
    ],
    imageUrl: '/illustrations/3_2/page4.png', audioUrl: '/sounds/sentences/L3_2_p4.mp3',
  },

  // Page 5
  {
    type: 'story',
    sentences: ['Then I see the cute stone elephants!', 'We went past those!', 'Mum must be close!'],
    words: [
      w('Then', 'then', ['th','e','n']),
      tricky('I', 'I'),
      w('see', 'see', ['s','ee']),
      tricky('the', 'the'),
      w('cute', 'cute', ['c','u-e','t']),
      w('stone', 'stone', ['s','t','o-e','n']),
      tricky('elephants!', 'elephant'),
      tricky('We', 'we'),
      w('went', 'went', ['w','e','n','t']),
      w('past', 'past', ['p','a','s','t']),
      w('those!', 'those', ['th','o-e','z']),
      w('Mum', 'mum', ['m','u','m']),
      w('must', 'must', ['m','u','s','t']),
      w('be', 'be', ['b','ee']),
      w('close!', 'close', ['c','l','o-e','s']),
    ],
    imageUrl: '/illustrations/3_2/page5.png', audioUrl: '/sounds/sentences/L3_2_p5.mp3',
  },

  // Page 6
  {
    type: 'story',
    sentences: ['I run past the bright lights.', 'I run past the noodle stall.', 'Then\u2026 I see Mum!'],
    words: [
      tricky('I', 'I'),
      w('run', 'run', ['r','u','n']),
      w('past', 'past', ['p','a','s','t']),
      tricky('the', 'the'),
      w('bright', 'bright', ['b','r','igh','t']),
      w('lights.', 'lights', ['l','igh','t','s']),
      tricky('I', 'I'),
      w('run', 'run', ['r','u','n']),
      w('past', 'past', ['p','a','s','t']),
      tricky('the', 'the'),
      w('noodle', 'noodle', ['n','oo','d','l']),
      tricky('stall.', 'stall'),
      w('Then...', 'then', ['th','e','n']),
      tricky('I', 'I'),
      w('see', 'see', ['s','ee']),
      w('Mum!', 'mum', ['m','u','m']),
    ],
    imageUrl: '/illustrations/3_2/page6.png', audioUrl: '/sounds/sentences/L3_2_p6.mp3',
  },

  // Page 7
  {
    type: 'story',
    sentences: ['Mum gave me a huge tight hug.', "\u2018You are safe!\u2019 she spoke.", 'I did not let go.'],
    words: [
      w('Mum', 'mum', ['m','u','m']),
      w('gave', 'gave', ['g','a-e','v']),
      w('me', 'me', ['m','ee']),
      tricky('a', 'a'),
      w('huge', 'huge', ['h','u-e','j']),
      w('tight', 'tight', ['t','igh','t']),
      w('hug.', 'hug', ['h','u','g']),
      tricky("'You", 'you'),
      tricky('are', 'are'),
      w("safe!'", 'safe', ['s','a-e','f']),
      tricky('she', 'she'),
      w('spoke.', 'spoke', ['s','p','o-e','k']),
      tricky('I', 'I'),
      w('did', 'did', ['d','i','d']),
      w('not', 'not', ['n','o','t']),
      w('let', 'let', ['l','e','t']),
      tricky('go.', 'go'),
    ],
    imageUrl: '/illustrations/3_2/page7.png', audioUrl: '/sounds/sentences/L3_2_p7.mp3',
  },

  // Page 8
  {
    type: 'story',
    sentences: ['We sat close and ate hot noodles in the moonlight.', "\u2018Stay close to me!\u2019 spoke Mum.", 'I gave a huge grin.', 'Home time!'],
    words: [
      tricky('We', 'we'),
      w('sat', 'sat', ['s','a','t']),
      w('close', 'close', ['c','l','o-e','s']),
      w('and', 'and', ['a','n','d']),
      w('ate', 'ate', ['a-e','t']),
      w('hot', 'hot', ['h','o','t']),
      w('noodles', 'noodles', ['n','oo','d','l','s']),
      w('in', 'in', ['i','n']),
      tricky('the', 'the'),
      w('moonlight.', 'moonlight', ['m','oo','n','l','igh','t']),
      w("'Stay", 'stay', ['s','t','ay']),
      w('close', 'close', ['c','l','o-e','s']),
      tricky('to', 'to'),
      w("me!'", 'me', ['m','ee']),
      w('spoke', 'spoke', ['s','p','o-e','k']),
      w('Mum.', 'mum', ['m','u','m']),
      tricky('I', 'I'),
      w('gave', 'gave', ['g','a-e','v']),
      tricky('a', 'a'),
      w('huge', 'huge', ['h','u-e','j']),
      w('grin.', 'grin', ['g','r','i','n']),
      w('Home', 'home', ['h','o-e','m']),
      w('time!', 'time', ['t','i-e','m']),
    ],
    imageUrl: '/illustrations/3_2/page8.png', audioUrl: '/sounds/sentences/L3_2_p8.mp3',
  },

  // ── QUIZ ──
  {
    type: 'quiz',
    questions: [
      { question: 'What did the girl see on the stall?',
        options: [{ label: 'stone elephants', isCorrect: true }, { label: 'toy cars', isCorrect: false }, { label: 'hats', isCorrect: false }] },
      { question: 'How did the girl find Mum?',
        options: [{ label: 'she remembered the elephant stall', isCorrect: true }, { label: 'a man helped', isCorrect: false }, { label: 'Mum called out', isCorrect: false }] },
      { question: 'What did they eat at the end?',
        options: [{ label: 'noodles', isCorrect: true }, { label: 'rice', isCorrect: false }, { label: 'cake', isCorrect: false }] },
    ],
  },

  { type: 'sound_spotlight', sound: 'o-e', items: [
    { word: 'stone', imageUrl: '/images/words/stone.png', focusIndex: 2 },
    { word: 'spoke', imageUrl: '/images/words/spoke.png', focusIndex: 2 },
    { word: 'home', imageUrl: '/images/words/home.png', focusIndex: 1 },
    { word: 'close', imageUrl: '/images/words/close.png', focusIndex: 2 }] },
  { type: 'sound_spotlight', sound: 'u-e', items: [
    { word: 'huge', imageUrl: '/images/words/huge.png', focusIndex: 1 },
    { word: 'cute', imageUrl: '/images/words/cute.png', focusIndex: 1 },
    { word: 'rule', imageUrl: '/images/words/rule.png', focusIndex: 1 },
    { word: 'rude', imageUrl: '/images/words/rude.png', focusIndex: 1 }] },

  { type: 'word_reading', words: [
    w('close', 'close', ['c','l','o-e','s']), w('spoke', 'spoke', ['s','p','o-e','k']),
    w('huge', 'huge', ['h','u-e','j']), w('stone', 'stone', ['s','t','o-e','n']),
    w('cute', 'cute', ['c','u-e','t']), w('home', 'home', ['h','o-e','m'])] },

  { type: 'tricky_words', words: [
    tricky('I', 'I'), tricky('the', 'the'), tricky('you', 'you'),
    tricky('she', 'she'), tricky('we', 'we'), tricky('elephant', 'elephant')] },

  { type: 'spelling', words: [
    { word: 'close', imageUrl: '/images/words/close.png', letters: ['c','l','o','s','e'] },
    { word: 'spoke', imageUrl: '/images/words/spoke.png', letters: ['s','p','o','k','e'] },
    { word: 'huge', imageUrl: '/images/words/huge.png', letters: ['h','u','g','e'] },
    { word: 'stone', imageUrl: '/images/words/stone.png', letters: ['s','t','o','n','e'] }] },

  { type: 'nonsense_words', words: [
    w('blone', 'blone', ['b','l','o-e','n']), w('brude', 'brude', ['b','r','u-e','d']),
    w('snoke', 'snoke', ['s','n','o-e','k']), w('plune', 'plune', ['p','l','u-e','n']),
    w('frope', 'frope', ['f','r','o-e','p']), w('smude', 'smude', ['s','m','u-e','d']),
    w('stobe', 'stobe', ['s','t','o-e','b']), w('trupe', 'trupe', ['t','r','u-e','p'])] },

  { type: 'writing_practice', letters: ['o-e', 'u-e', 'o', 'u'] },

  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/3_2/page1.png', label: 'Mum and I at the market.', correctIndex: 0 },
    { imageUrl: '/illustrations/3_2/page2.png', label: 'Stone elephants on a stall!', correctIndex: 1 },
    { imageUrl: '/illustrations/3_2/page3.png', label: 'A man bumped me! Lost!', correctIndex: 2 },
    { imageUrl: '/illustrations/3_2/page4.png', label: 'Dark and loud. Mum!', correctIndex: 3 },
    { imageUrl: '/illustrations/3_2/page5.png', label: 'The elephants! I remember!', correctIndex: 4 },
    { imageUrl: '/illustrations/3_2/page6.png', label: 'I see Mum!', correctIndex: 5 },
    { imageUrl: '/illustrations/3_2/page7.png', label: 'A huge tight hug.', correctIndex: 6 },
    { imageUrl: '/illustrations/3_2/page8.png', label: 'Noodles in the moonlight.', correctIndex: 7 }] },

  { type: 'drawing', prompt: 'Draw Your Favourite Part' },
  { type: 'certificate', bookTitle: 'Lost at the Night Market' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// L3.3 — "Reach for the Treat!"
// Focus sounds: ea, ie — Helping your community, Accra Ghana
// ═══════════════════════════════════════════════════════════════════════════════

export const BOOK_L3_3_PAGES: InteractivePage[] = [
  { type: 'cover', title: 'Reach for the Treat!', subtitle: 'Level 3 · New Spellings', imageUrl: '/illustrations/3_3/cover.png' },
  { type: 'sound_grid', focusSounds: ['ea', 'ie'], allSounds: L3_ALL_SOUNDS },

  { type: 'vocab_preview', words: [
    w('reach', 'reach', ['r','ea','ch']), w('clean', 'clean', ['c','l','ea','n']),
    w('team', 'team', ['t','ea','m']), w('each', 'each', ['ea','ch']),
    w('treat', 'treat', ['t','r','ea','t']), w('feast', 'feast', ['f','ea','s','t']),
    w('tried', 'tried', ['t','r','ie','d']), w('cried', 'cried', ['c','r','ie','d']),
    w('spied', 'spied', ['s','p','ie','d']), w('dream', 'dream', ['d','r','ea','m']),
    w('neat', 'neat', ['n','ea','t']), w('beam', 'beam', ['b','ea','m']),
  ]},

  // Page 1 — girl sees Nana tired at her gate
  { type: 'story',
    sentences: ['Nana sits by her gate.', 'She looks so tired.', '"I need to clean," she said.', '"But it is too much."'],
    words: [
      w('Nana', 'nana', ['n','a','n','a']), w('sits', 'sits', ['s','i','t','s']),
      w('by', 'by', ['b','igh']), w('her', 'her', ['h','er']),
      w('gate.', 'gate', ['g','a-e','t']),
      tricky('She', 'she'), w('looks', 'looks', ['l','oo','k','s']),
      tricky('so', 'so'), w('tired.', 'tired', ['t','ir','d']),
      tricky('"I', 'I'), w('need', 'need', ['n','ee','d']),
      tricky('to', 'to'), w('clean,"', 'clean', ['c','l','ea','n']),
      tricky('she', 'she'), tricky('said.', 'said'),
      w('"But', 'but', ['b','u','t']), w('it', 'it', ['i','t']),
      tricky('is', 'is'), w('too', 'too', ['t','oo']),
      w('much."', 'much', ['m','u','ch']),
    ],
    imageUrl: '/illustrations/3_3/page1.png', audioUrl: '/sounds/sentences/L3_3_p1.mp3' },

  // Page 2 — girl tries to help but can't reach
  { type: 'story',
    sentences: ['I kneel by each plant pot and clean the leaves.', '"Let me help, Nana!" I said.', 'She tried to grin.'],
    words: [
      tricky('I', 'I'), w('kneel', 'kneel', ['k','n','ee','l']),
      w('by', 'by', ['b','igh']), w('each', 'each', ['ea','ch']),
      w('plant', 'plant', ['p','l','a','n','t']), w('pot', 'pot', ['p','o','t']),
      w('and', 'and', ['a','n','d']), w('clean', 'clean', ['c','l','ea','n']),
      tricky('the', 'the'), w('leaves.', 'leaves', ['l','ea','v','s']),
      w('"Let', 'let', ['l','e','t']), tricky('me', 'me'),
      w('help,', 'help', ['h','e','l','p']), w('Nana!"', 'nana', ['n','a','n','a']),
      tricky('I', 'I'), tricky('said.', 'said'),
      tricky('She', 'she'), w('tried', 'tried', ['t','r','ie','d']),
      tricky('to', 'to'), w('grin.', 'grin', ['g','r','i','n']),
    ],
    imageUrl: '/illustrations/3_3/page2.png', audioUrl: '/sounds/sentences/L3_3_p2.mp3' },

  // Page 3 — girl finds boy at football pitch
  { type: 'story',
    sentences: ['I run and find him.', '"Please, can you help?" I cried.', '"We need to be a team!"'],
    words: [
      tricky('I', 'I'), w('run', 'run', ['r','u','n']),
      w('and', 'and', ['a','n','d']), w('find', 'find', ['f','i-e','n','d']),
      w('him.', 'him', ['h','i','m']),
      w('"Please,', 'please', ['p','l','ea','s']),
      w('can', 'can', ['c','a','n']), w('you', 'you', ['y','oo']),
      w('help?"', 'help', ['h','e','l','p']),
      tricky('I', 'I'), w('cried.', 'cried', ['c','r','ie','d']),
      w('"We', 'we', ['w','ee']), w('need', 'need', ['n','ee','d']),
      tricky('to', 'to'), tricky('be', 'be'), tricky('a', 'a'),
      w('team!"', 'team', ['t','ea','m']),
    ],
    imageUrl: '/illustrations/3_3/page3.png', audioUrl: '/sounds/sentences/L3_3_p3.mp3' },

  // Page 4 — both kids clean the yard
  { type: 'story',
    sentences: ['We each grab a cloth.', 'We clean the step and sweep the yard.', 'Leaves fly!'],
    words: [
      tricky('We', 'we'), w('each', 'each', ['ea','ch']),
      w('grab', 'grab', ['g','r','a','b']), tricky('a', 'a'),
      w('cloth.', 'cloth', ['c','l','o','th']),
      tricky('We', 'we'), w('clean', 'clean', ['c','l','ea','n']),
      tricky('the', 'the'), w('step', 'step', ['s','t','e','p']),
      w('and', 'and', ['a','n','d']), w('sweep', 'sweep', ['s','w','ee','p']),
      tricky('the', 'the'), w('yard.', 'yard', ['y','ar','d']),
      w('Leaves', 'leaves', ['l','ea','v','s']), w('fly!', 'fly', ['f','l','igh']),
    ],
    imageUrl: '/illustrations/3_3/page4.png', audioUrl: '/sounds/sentences/L3_3_p4.mp3' },

  // Page 5 — teamwork to reach the shelf
  { type: 'story',
    sentences: ['I stand on a stool.', 'He holds it.', 'I reach up and grab each tin from the shelf.', '"I got them!"'],
    words: [
      tricky('I', 'I'), w('stand', 'stand', ['s','t','a','n','d']),
      w('on', 'on', ['o','n']), tricky('a', 'a'),
      w('stool.', 'stool', ['s','t','oo','l']),
      tricky('He', 'he'), w('holds', 'holds', ['h','oa','l','d','s']),
      w('it.', 'it', ['i','t']),
      tricky('I', 'I'), w('reach', 'reach', ['r','ea','ch']),
      w('up', 'up', ['u','p']), w('and', 'and', ['a','n','d']),
      w('grab', 'grab', ['g','r','a','b']), w('each', 'each', ['ea','ch']),
      w('tin', 'tin', ['t','i','n']), w('from', 'from', ['f','r','o','m']),
      tricky('the', 'the'), w('shelf.', 'shelf', ['sh','e','l','f']),
      tricky('"I', 'I'), w('got', 'got', ['g','o','t']),
      w('them!"', 'them', ['th','e','m']),
    ],
    imageUrl: '/illustrations/3_3/page5.png', audioUrl: '/sounds/sentences/L3_3_p5.mp3' },

  // Page 6 — tins lined up, Nana delighted
  { type: 'story',
    sentences: ['We clean each tin and line them up neat.', 'Nana peeks in.', '"What a dream team!" she cried.'],
    words: [
      tricky('We', 'we'), w('clean', 'clean', ['c','l','ea','n']),
      w('each', 'each', ['ea','ch']), w('tin', 'tin', ['t','i','n']),
      w('and', 'and', ['a','n','d']), w('line', 'line', ['l','i-e','n']),
      w('them', 'them', ['th','e','m']), w('up', 'up', ['u','p']),
      w('neat.', 'neat', ['n','ea','t']),
      w('Nana', 'nana', ['n','a','n','a']), w('peeks', 'peeks', ['p','ee','k','s']),
      w('in.', 'in', ['i','n']),
      tricky('"What', 'what'), tricky('a', 'a'),
      w('dream', 'dream', ['d','r','ea','m']),
      w('team!"', 'team', ['t','ea','m']),
      tricky('she', 'she'), w('cried.', 'cried', ['c','r','ie','d']),
    ],
    imageUrl: '/illustrations/3_3/page6.png', audioUrl: '/sounds/sentences/L3_3_p6.mp3' },

  // Page 7 — kids at the shop
  { type: 'story',
    sentences: ['Then we run to the shop.', 'We get beans and rice and sweet plantain for Nana.', 'What a treat!'],
    words: [
      w('Then', 'then', ['th','e','n']), tricky('we', 'we'),
      w('run', 'run', ['r','u','n']), tricky('to', 'to'),
      tricky('the', 'the'), w('shop.', 'shop', ['sh','o','p']),
      tricky('We', 'we'), w('get', 'get', ['g','e','t']),
      w('beans', 'beans', ['b','ea','n','s']), w('and', 'and', ['a','n','d']),
      w('rice', 'rice', ['r','i-e','s']), w('and', 'and', ['a','n','d']),
      w('sweet', 'sweet', ['s','w','ee','t']),
      w('plantain', 'plantain', ['p','l','a','n','t','ai','n']),
      w('for', 'for', ['f','or']), w('Nana.', 'nana', ['n','a','n','a']),
      tricky('What', 'what'), tricky('a', 'a'),
      w('treat!', 'treat', ['t','r','ea','t']),
    ],
    imageUrl: '/illustrations/3_3/page7.png', audioUrl: '/sounds/sentences/L3_3_p7.mp3' },

  // Page 8 — kitchen, Nana serves food
  { type: 'story',
    sentences: ['Nana grins and grins.', 'She brings us each a big feast —', 'beans and rice with fried plantain!', 'We beam. "Thank you, Nana!"'],
    words: [
      w('Nana', 'nana', ['n','a','n','a']), w('grins', 'grins', ['g','r','i','n','s']),
      w('and', 'and', ['a','n','d']), w('grins.', 'grins', ['g','r','i','n','s']),
      tricky('She', 'she'), w('brings', 'brings', ['b','r','i','ng','s']),
      w('us', 'us', ['u','s']), w('each', 'each', ['ea','ch']),
      tricky('a', 'a'), w('big', 'big', ['b','i','g']),
      w('feast', 'feast', ['f','ea','s','t']), tricky('—', '—'),
      w('beans', 'beans', ['b','ea','n','s']), w('and', 'and', ['a','n','d']),
      w('rice', 'rice', ['r','i-e','s']), w('with', 'with', ['w','i','th']),
      w('fried', 'fried', ['f','r','ie','d']),
      w('plantain!', 'plantain', ['p','l','a','n','t','ai','n']),
      tricky('We', 'we'), w('beam.', 'beam', ['b','ea','m']),
      w('"Thank', 'thank', ['th','a','nk']),
      w('you,', 'you', ['y','oo']), w('Nana!"', 'nana', ['n','a','n','a']),
    ],
    imageUrl: '/illustrations/3_3/page8.png', audioUrl: '/sounds/sentences/L3_3_p8.mp3' },

  // ── QUIZ ──
  { type: 'quiz', questions: [
    { question: 'What did Nana need help with?',
      options: [{ label: 'cleaning her shelf', isCorrect: true }, { label: 'cooking food', isCorrect: false }, { label: 'finding her cat', isCorrect: false }] },
    { question: 'How did the children reach the shelf?',
      options: [{ label: 'stood on a stool', isCorrect: true }, { label: 'climbed a tree', isCorrect: false }, { label: 'used a ladder', isCorrect: false }] },
    { question: 'What treat did Nana give them?',
      options: [{ label: 'beans and rice with fried plantain', isCorrect: true }, { label: 'a mango', isCorrect: false }, { label: 'a cake', isCorrect: false }] },
  ]},

  // ── SOUND SPOTLIGHTS ──
  { type: 'sound_spotlight', sound: 'ea', items: [
    { word: 'reach', imageUrl: '/images/words/reach.png', focusIndex: 1 },
    { word: 'clean', imageUrl: '/images/words/clean.png', focusIndex: 2 },
    { word: 'treat', imageUrl: '/images/words/treat.png', focusIndex: 2 },
    { word: 'team', imageUrl: '/images/words/team.png', focusIndex: 1 }] },
  { type: 'sound_spotlight', sound: 'ie', items: [
    { word: 'tried', imageUrl: '/images/words/tried.png', focusIndex: 2 },
    { word: 'cried', imageUrl: '/images/words/cried.png', focusIndex: 2 },
    { word: 'fried', imageUrl: '/images/words/fried.png', focusIndex: 2 },
    { word: 'dried', imageUrl: '/images/words/dried.png', focusIndex: 2 }] },

  // ── WORD READING ──
  { type: 'word_reading', words: [
    w('reach', 'reach', ['r','ea','ch']), w('clean', 'clean', ['c','l','ea','n']),
    w('team', 'team', ['t','ea','m']), w('treat', 'treat', ['t','r','ea','t']),
    w('tried', 'tried', ['t','r','ie','d']), w('cried', 'cried', ['c','r','ie','d'])] },

  // ── TRICKY WORDS ──
  { type: 'tricky_words', words: [
    tricky('she', 'she'), tricky('said', 'said'), tricky('I', 'I'),
    tricky('the', 'the'), tricky('to', 'to'), tricky('my', 'my')] },

  // ── SPELLING ──
  { type: 'spelling', words: [
    { word: 'reach', imageUrl: '/images/words/reach.png', letters: ['r','ea','ch'] },
    { word: 'clean', imageUrl: '/images/words/clean.png', letters: ['c','l','ea','n'] },
    { word: 'team', imageUrl: '/images/words/team.png', letters: ['t','ea','m'] },
    { word: 'treat', imageUrl: '/images/words/treat.png', letters: ['t','r','ea','t'] }] },

  // ── ALIEN WORDS ──
  { type: 'nonsense_words', words: [
    w('blea', 'blea', ['b','l','ea']), w('smea', 'smea', ['s','m','ea']),
    w('trea', 'trea', ['t','r','ea']), w('plean', 'plean', ['p','l','ea','n']),
    w('spie', 'spie', ['s','p','ie']), w('flie', 'flie', ['f','l','ie']),
    w('drie', 'drie', ['d','r','ie']), w('gried', 'gried', ['g','r','ie','d']),
    w('sneat', 'sneat', ['s','n','ea','t']), w('cleam', 'cleam', ['c','l','ea','m']),
    w('breap', 'breap', ['b','r','ea','p']), w('stie', 'stie', ['s','t','ie'])] },

  { type: 'writing_practice', letters: ['ea', 'ie'] },

  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/3_3/page1.png', label: 'Nana is tired. "I need to clean."', correctIndex: 0 },
    { imageUrl: '/illustrations/3_3/page2.png', label: 'I clean the leaves for Nana.', correctIndex: 1 },
    { imageUrl: '/illustrations/3_3/page3.png', label: 'I find him. "We need a team!"', correctIndex: 2 },
    { imageUrl: '/illustrations/3_3/page4.png', label: 'We clean and sweep the yard.', correctIndex: 3 },
    { imageUrl: '/illustrations/3_3/page5.png', label: 'I reach each tin from the shelf!', correctIndex: 4 },
    { imageUrl: '/illustrations/3_3/page6.png', label: 'What a dream team!', correctIndex: 5 },
    { imageUrl: '/illustrations/3_3/page7.png', label: 'We get sweet plantain at the shop.', correctIndex: 6 },
    { imageUrl: '/illustrations/3_3/page8.png', label: 'Nana brings us a feast! We beam.', correctIndex: 7 }] },

  { type: 'drawing', prompt: 'Draw Your Favourite Part' },
  { type: 'certificate', bookTitle: 'Reach for the Treat!' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// L3.4 — "What Min Saw"
// Focus sounds: oi, aw — Min and Mum take an autumn walk through Seoul.
// ═══════════════════════════════════════════════════════════════════════════════

export const BOOK_L3_4_PAGES: InteractivePage[] = [
  {
    type: 'cover',
    title: 'What Min Saw',
    subtitle: 'Level 3 · New Spellings',
    imageUrl: '/illustrations/3_4/cover.png',
  },
  {
    type: 'sound_grid',
    focusSounds: ['oi', 'aw'],
    allSounds: L3_ALL_SOUNDS,
  },
  {
    type: 'vocab_preview',
    words: [
      w('saw', 'saw', ['s','aw']),
      w('hawk', 'hawk', ['h','aw','k']),
      w('claws', 'claws', ['c','l','aw','z']),
      w('points', 'points', ['p','oi','n','t','s']),
      w('soil', 'soil', ['s','oi','l']),
      w('coats', 'coats', ['c','oa','t','s']),
      w('stream', 'stream', ['s','t','r','ea','m']),
      w('stones', 'stones', ['s','t','o-e','n','s']),
      w('home', 'home', ['h','o-e','m']),
      w('leaves', 'leaves', ['l','ea','v','s']),
    ],
  },

  // Page 1 — apartment, Min and Mum putting on coats
  {
    type: 'story',
    sentences: ['Min and Mum put on thick coats.', "'Let us go!' said Min with a big grin."],
    words: [
      w('Min', 'min', ['m','i','n']), w('and', 'and', ['a','n','d']),
      w('Mum', 'mum', ['m','u','m']), tricky('put', 'put'),
      w('on', 'on', ['o','n']), w('thick', 'thick', ['th','i','ck']),
      w('coats.', 'coats', ['c','oa','t','s']),
      w("'Let", 'let', ['l','e','t']), w('us', 'us', ['u','s']),
      w("go!'", 'go', ['g','o']), tricky('said', 'said'),
      w('Min', 'min', ['m','i','n']), w('with', 'with', ['w','i','th']),
      tricky('a', 'a'), w('big', 'big', ['b','i','g']),
      w('grin.', 'grin', ['g','r','i','n']),
    ],
    imageUrl: '/illustrations/3_4/page1.png', audioUrl: '/sounds/sentences/L3_4_p1.mp3',
  },

  // Page 2 — Seoul street, Min pointing at a tall building
  {
    type: 'story',
    sentences: ['Min and Mum step on to the street.', 'Min points at a big block.', "'Look at that!' she said."],
    words: [
      w('Min', 'min', ['m','i','n']), w('and', 'and', ['a','n','d']),
      w('Mum', 'mum', ['m','u','m']), w('step', 'step', ['s','t','e','p']),
      w('on', 'on', ['o','n']), tricky('to', 'to'),
      tricky('the', 'the'), w('street.', 'street', ['s','t','r','ee','t']),
      w('Min', 'min', ['m','i','n']), w('points', 'points', ['p','oi','n','t','s']),
      w('at', 'at', ['a','t']), tricky('a', 'a'),
      w('big', 'big', ['b','i','g']), w('block.', 'block', ['b','l','o','ck']),
      w("'Look", 'look', ['l','oo','k']), w('at', 'at', ['a','t']),
      w("that!'", 'that', ['th','a','t']),
      tricky('she', 'she'), tricky('said.', 'said'),
    ],
    imageUrl: '/illustrations/3_4/page2.png', audioUrl: '/sounds/sentences/L3_4_p2.mp3',
  },

  // Page 3 — park, grey cat near Min
  {
    type: 'story',
    sentences: ['They go to the park.', 'A cat sits in the grass.', "'Look! A cat!' said Min."],
    words: [
      tricky('They', 'they'), tricky('go', 'go'),
      tricky('to', 'to'), tricky('the', 'the'),
      w('park.', 'park', ['p','ar','k']),
      tricky('A', 'a'), w('cat', 'cat', ['c','a','t']),
      w('sits', 'sits', ['s','i','t','s']), w('in', 'in', ['i','n']),
      tricky('the', 'the'), w('grass.', 'grass', ['g','r','a','ss']),
      w("'Look!", 'look', ['l','oo','k']), tricky('A', 'a'),
      w("cat!'", 'cat', ['c','a','t']),
      tricky('said', 'said'), w('Min.', 'min', ['m','i','n']),
    ],
    imageUrl: '/illustrations/3_4/page3.png', audioUrl: '/sounds/sentences/L3_4_p3.mp3',
  },

  // Page 4 — stream with stepping stones
  {
    type: 'story',
    sentences: ['Min sees a stream.', 'She hops on the stones in the soil.', "'Min, look out!' said Mum."],
    words: [
      w('Min', 'min', ['m','i','n']), w('sees', 'sees', ['s','ee','s']),
      tricky('a', 'a'), w('stream.', 'stream', ['s','t','r','ea','m']),
      tricky('She', 'she'), w('hops', 'hops', ['h','o','p','s']),
      w('on', 'on', ['o','n']), tricky('the', 'the'),
      w('stones', 'stones', ['s','t','o-e','n','s']),
      w('in', 'in', ['i','n']), tricky('the', 'the'),
      w('soil.', 'soil', ['s','oi','l']),
      w("'Min,", 'min', ['m','i','n']), w('look', 'look', ['l','oo','k']),
      w("out!'", 'out', ['ou','t']),
      tricky('said', 'said'), w('Mum.', 'mum', ['m','u','m']),
    ],
    imageUrl: '/illustrations/3_4/page4.png', audioUrl: '/sounds/sentences/L3_4_p4.mp3',
  },

  // Page 5 — hilltop overlooking Seoul
  {
    type: 'story',
    sentences: ['They go up the hill.', 'Min sees big trees and hills.', "'Look at this!' she said."],
    words: [
      tricky('They', 'they'), tricky('go', 'go'),
      w('up', 'up', ['u','p']), tricky('the', 'the'),
      w('hill.', 'hill', ['h','i','ll']),
      w('Min', 'min', ['m','i','n']), w('sees', 'sees', ['s','ee','s']),
      w('big', 'big', ['b','i','g']),
      w('trees', 'trees', ['t','r','ee','s']),
      w('and', 'and', ['a','n','d']),
      w('hills.', 'hills', ['h','i','ll','s']),
      w("'Look", 'look', ['l','oo','k']), w('at', 'at', ['a','t']),
      w("this!'", 'this', ['th','i','s']),
      tricky('she', 'she'), tricky('said.', 'said'),
    ],
    imageUrl: '/illustrations/3_4/page5.png', audioUrl: '/sounds/sentences/L3_4_p5.mp3',
  },

  // Page 6 — open grass, hawk circling, Min pointing up
  {
    type: 'story',
    sentences: ['A big hawk is up high!', 'Min points at it.', 'The hawk has sharp claws.'],
    words: [
      tricky('A', 'a'), w('big', 'big', ['b','i','g']),
      w('hawk', 'hawk', ['h','aw','k']), tricky('is', 'is'),
      w('up', 'up', ['u','p']), w('high!', 'high', ['h','igh']),
      w('Min', 'min', ['m','i','n']), w('points', 'points', ['p','oi','n','t','s']),
      w('at', 'at', ['a','t']), w('it.', 'it', ['i','t']),
      tricky('The', 'the'), w('hawk', 'hawk', ['h','aw','k']),
      tricky('has', 'has'), w('sharp', 'sharp', ['sh','ar','p']),
      w('claws.', 'claws', ['c','l','aw','z']),
    ],
    imageUrl: '/illustrations/3_4/page6.png', audioUrl: '/sounds/sentences/L3_4_p6.mp3',
  },

  // Page 7 — Min and Mum sitting on grass, hawk above
  {
    type: 'story',
    sentences: ['They sit on the grass.', 'The hawk stays up high.', "'It looks just right,' Mum said."],
    words: [
      tricky('They', 'they'), w('sit', 'sit', ['s','i','t']),
      w('on', 'on', ['o','n']), tricky('the', 'the'),
      w('grass.', 'grass', ['g','r','a','ss']),
      tricky('The', 'the'), w('hawk', 'hawk', ['h','aw','k']),
      w('stays', 'stays', ['s','t','ay','s']),
      w('up', 'up', ['u','p']), w('high.', 'high', ['h','igh']),
      w("'It", 'it', ['i','t']), w('looks', 'looks', ['l','oo','k','s']),
      w('just', 'just', ['j','u','s','t']),
      w("right,'", 'right', ['r','igh','t']),
      w('Mum', 'mum', ['m','u','m']), tricky('said.', 'said'),
    ],
    imageUrl: '/illustrations/3_4/page7.png', audioUrl: '/sounds/sentences/L3_4_p7.mp3',
  },

  // Page 8 — walking home through golden autumn leaves
  {
    type: 'story',
    sentences: ['On the way home, Min runs in the leaves.', "'I will tell Dad what I saw!' said Min."],
    words: [
      w('On', 'on', ['o','n']), tricky('the', 'the'),
      w('way', 'way', ['w','ay']),
      w('home,', 'home', ['h','o-e','m']),
      w('Min', 'min', ['m','i','n']), w('runs', 'runs', ['r','u','n','s']),
      w('in', 'in', ['i','n']), tricky('the', 'the'),
      w('leaves.', 'leaves', ['l','ea','v','s']),
      tricky("'I", 'I'), w('will', 'will', ['w','i','ll']),
      w('tell', 'tell', ['t','e','ll']), w('Dad', 'dad', ['d','a','d']),
      tricky('what', 'what'), tricky('I', 'I'),
      w("saw!'", 'saw', ['s','aw']),
      tricky('said', 'said'), w('Min.', 'min', ['m','i','n']),
    ],
    imageUrl: '/illustrations/3_4/page8.png', audioUrl: '/sounds/sentences/L3_4_p8.mp3',
  },

  {
    type: 'quiz',
    questions: [
      { question: 'Where did Min and Mum go?',
        options: [{ label: 'for a walk', isCorrect: true }, { label: 'to school', isCorrect: false }, { label: 'to bed', isCorrect: false }] },
      { question: 'What did Min see in the park?',
        options: [{ label: 'a cat', isCorrect: true }, { label: 'a fish', isCorrect: false }, { label: 'a dog', isCorrect: false }] },
      { question: 'What was up high in the sky?',
        options: [{ label: 'a hawk', isCorrect: true }, { label: 'a kite', isCorrect: false }, { label: 'a plane', isCorrect: false }] },
    ],
  },

  { type: 'sound_spotlight', sound: 'oi', items: [
    { word: 'oil', imageUrl: '/images/words/oil.png', focusIndex: 0 },
    { word: 'coin', imageUrl: '/images/words/coin.png', focusIndex: 1 },
    { word: 'join', imageUrl: '/images/words/join.png', focusIndex: 1 },
    { word: 'soil', imageUrl: '/images/words/soil.png', focusIndex: 1 }] },
  { type: 'sound_spotlight', sound: 'aw', items: [
    { word: 'saw', imageUrl: '/images/words/saw.png', focusIndex: 1 },
    { word: 'hawk', imageUrl: '/images/words/hawk.png', focusIndex: 1 },
    { word: 'straw', imageUrl: '/images/words/straw.png', focusIndex: 3 },
    { word: 'claw', imageUrl: '/images/words/claw.png', focusIndex: 2 }] },

  { type: 'word_reading', words: [
    w('saw', 'saw', ['s','aw']), w('hawk', 'hawk', ['h','aw','k']),
    w('soil', 'soil', ['s','oi','l']), w('points', 'points', ['p','oi','n','t','s']),
    w('claws', 'claws', ['c','l','aw','z']), w('join', 'join', ['j','oi','n'])] },

  { type: 'tricky_words', words: [
    tricky('said', 'said'), tricky('she', 'she'), tricky('they', 'they'),
    tricky('what', 'what'), tricky('the', 'the'), tricky('to', 'to')] },

  { type: 'spelling', words: [
    { word: 'saw', imageUrl: '/images/words/saw.png', letters: ['s','a','w'] },
    { word: 'hawk', imageUrl: '/images/words/hawk.png', letters: ['h','a','w','k'] },
    { word: 'oil', imageUrl: '/images/words/oil.png', letters: ['o','i','l'] },
    { word: 'join', imageUrl: '/images/words/join.png', letters: ['j','o','i','n'] }] },

  { type: 'nonsense_words', words: [
    w('bloin', 'bloin', ['b','l','oi','n']), w('crawk', 'crawk', ['c','r','aw','k']),
    w('froil', 'froil', ['f','r','oi','l']), w('snaw', 'snaw', ['s','n','aw']),
    w('gloid', 'gloid', ['g','l','oi','d']), w('prawn', 'prawn', ['p','r','aw','n']),
    w('troil', 'troil', ['t','r','oi','l']), w('flawk', 'flawk', ['f','l','aw','k'])] },

  { type: 'writing_practice', letters: ['oi', 'aw', 'o', 'a'] },

  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/3_4/page1.png', label: 'Min and Mum put on coats.', correctIndex: 0 },
    { imageUrl: '/illustrations/3_4/page2.png', label: 'On the street.', correctIndex: 1 },
    { imageUrl: '/illustrations/3_4/page3.png', label: 'A cat in the park.', correctIndex: 2 },
    { imageUrl: '/illustrations/3_4/page4.png', label: 'Hops on the stones.', correctIndex: 3 },
    { imageUrl: '/illustrations/3_4/page5.png', label: 'Up the hill.', correctIndex: 4 },
    { imageUrl: '/illustrations/3_4/page6.png', label: 'A hawk up high!', correctIndex: 5 },
    { imageUrl: '/illustrations/3_4/page7.png', label: 'They sit and look.', correctIndex: 6 },
    { imageUrl: '/illustrations/3_4/page8.png', label: 'On the way home.', correctIndex: 7 }] },

  { type: 'drawing', prompt: 'Draw What You Saw on a Walk' },
  { type: 'certificate', bookTitle: 'What Min Saw' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// L3.5 — "The Boat with the Red Sail"
// Focus sounds: ai, oa
// ═══════════════════════════════════════════════════════════════════════════════

export const BOOK_L3_5_PAGES: InteractivePage[] = [
  {
    type: 'cover',
    title: 'The Boat with the Red Sail',
    subtitle: 'Level 3 · New Spellings',
    imageUrl: '/illustrations/3_5/cover.png',
  },
  {
    type: 'sound_grid',
    focusSounds: ['ai', 'oa'],
    allSounds: L3_ALL_SOUNDS,
  },
  {
    type: 'vocab_preview',
    words: [
      w('wait', 'wait', ['w','ai','t']),
      w('rain', 'rain', ['r','ai','n']),
      w('sail', 'sail', ['s','ai','l']),
      w('snail', 'snail', ['s','n','ai','l']),
      w('boat', 'boat', ['b','oa','t']),
      w('coast', 'coast', ['c','oa','s','t']),
      w('groan', 'groan', ['g','r','oa','n']),
      w('foam', 'foam', ['f','oa','m']),
    ],
  },

  // Page 1
  {
    type: 'story',
    sentences: ['Kai stands at the coast in the warm rain.', 'He waits for a boat to sail in.', 'The sea is still.', 'He lets out a long groan.'],
    words: [
      w('Kai', 'kai', ['k','ai']), w('stands', 'stands', ['s','t','a','n','d','s']),
      w('at', 'at', ['a','t']), tricky('the', 'the'),
      w('coast', 'coast', ['c','oa','s','t']), w('in', 'in', ['i','n']),
      tricky('the', 'the'), w('warm', 'warm', ['w','ar','m']),
      w('rain.', 'rain', ['r','ai','n']),
      tricky('He', 'he'), w('waits', 'waits', ['w','ai','t','s']),
      w('for', 'for', ['f','or']), tricky('a', 'a'),
      w('boat', 'boat', ['b','oa','t']), tricky('to', 'to'),
      w('sail', 'sail', ['s','ai','l']), w('in.', 'in', ['i','n']),
      tricky('The', 'the'), w('sea', 'sea', ['s','ea']),
      tricky('is', 'is'), w('still.', 'still', ['s','t','i','ll']),
      tricky('He', 'he'), w('lets', 'lets', ['l','e','t','s']),
      w('out', 'out', ['ou','t']), tricky('a', 'a'),
      w('long', 'long', ['l','o','ng']),
      w('groan.', 'groan', ['g','r','oa','n']),
    ],
    imageUrl: '/illustrations/3_5/page1.png', audioUrl: '/sounds/sentences/L3_5_p1.mp3',
  },

  // Page 2
  {
    type: 'story',
    sentences: ["He moans and paces the road.", "'It is so slow!' he said.", "He spots a snail.", "'Even the snail wins the race!' he said."],
    words: [
      tricky('He', 'he'), w('moans', 'moans', ['m','oa','n','s']),
      w('and', 'and', ['a','n','d']), w('paces', 'paces', ['p','a-e','c','s']),
      tricky('the', 'the'), w('road.', 'road', ['r','oa','d']),
      w("'It", 'it', ['i','t']), tricky('is', 'is'),
      tricky('so', 'so'), w("slow!'", 'slow', ['s','l','ow']),
      tricky('he', 'he'), tricky('said.', 'said'),
      tricky('He', 'he'), w('spots', 'spots', ['s','p','o','t','s']),
      tricky('a', 'a'), w('snail.', 'snail', ['s','n','ai','l']),
      w("'Even", 'even', ['ee','v','e','n']),
      tricky('the', 'the'), w('snail', 'snail', ['s','n','ai','l']),
      w('wins', 'wins', ['w','i','n','s']), tricky('the', 'the'),
      w("race!'", 'race', ['r','a-e','s']),
      tricky('he', 'he'), tricky('said.', 'said'),
    ],
    imageUrl: '/illustrations/3_5/page2.png', audioUrl: '/sounds/sentences/L3_5_p2.mp3',
  },

  // Page 3
  {
    type: 'story',
    sentences: ['Then a shape floats on the foam!', 'It bobs and dips in the waves.', 'Is it the boat?', 'He springs to his feet!'],
    words: [
      w('Then', 'then', ['th','e','n']), tricky('a', 'a'),
      w('shape', 'shape', ['sh','a-e','p']),
      w('floats', 'floats', ['f','l','oa','t','s']),
      w('on', 'on', ['o','n']), tricky('the', 'the'),
      w('foam!', 'foam', ['f','oa','m']),
      w('It', 'it', ['i','t']), w('bobs', 'bobs', ['b','o','b','s']),
      w('and', 'and', ['a','n','d']), w('dips', 'dips', ['d','i','p','s']),
      w('in', 'in', ['i','n']), tricky('the', 'the'),
      w('waves.', 'waves', ['w','a-e','v','s']),
      tricky('Is', 'is'), w('it', 'it', ['i','t']),
      tricky('the', 'the'), w('boat?', 'boat', ['b','oa','t']),
      tricky('He', 'he'), w('springs', 'springs', ['s','p','r','i','ng','s']),
      tricky('to', 'to'), tricky('his', 'his'),
      w('feet!', 'feet', ['f','ee','t']),
    ],
    imageUrl: '/illustrations/3_5/page3.png', audioUrl: '/sounds/sentences/L3_5_p3.mp3',
  },

  // Page 4
  {
    type: 'story',
    sentences: ['The boat sails in close.', 'He can spot a red stripe on the sail!', "That is the stripe on Dad's boat!", 'Can it be?'],
    words: [
      tricky('The', 'the'), w('boat', 'boat', ['b','oa','t']),
      w('sails', 'sails', ['s','ai','l','s']), w('in', 'in', ['i','n']),
      w('close.', 'close', ['c','l','o-e','s']),
      tricky('He', 'he'), w('can', 'can', ['c','a','n']),
      w('spot', 'spot', ['s','p','o','t']), tricky('a', 'a'),
      w('red', 'red', ['r','e','d']), w('stripe', 'stripe', ['s','t','r','i-e','p']),
      w('on', 'on', ['o','n']), tricky('the', 'the'),
      w('sail!', 'sail', ['s','ai','l']),
      w('That', 'that', ['th','a','t']), tricky('is', 'is'),
      tricky('the', 'the'), w('stripe', 'stripe', ['s','t','r','i-e','p']),
      w('on', 'on', ['o','n']), w("Dad's", 'dads', ['d','a','d','s']),
      w('boat!', 'boat', ['b','oa','t']),
      w('Can', 'can', ['c','a','n']), w('it', 'it', ['i','t']),
      w('be?', 'be', ['b','ee']),
    ],
    imageUrl: '/illustrations/3_5/page4.png', audioUrl: '/sounds/sentences/L3_5_p4.mp3',
  },

  // Page 5
  {
    type: 'story',
    sentences: ['He can see fish!', 'A big load sits at the front.', 'Kai claps!', 'Dad loads his boat with fish each time.', 'Is this his?'],
    words: [
      tricky('He', 'he'), w('can', 'can', ['c','a','n']),
      w('see', 'see', ['s','ee']), w('fish!', 'fish', ['f','i','sh']),
      tricky('A', 'a'), w('big', 'big', ['b','i','g']),
      w('load', 'load', ['l','oa','d']), w('sits', 'sits', ['s','i','t','s']),
      w('at', 'at', ['a','t']), tricky('the', 'the'),
      w('front.', 'front', ['f','r','o','n','t']),
      w('Kai', 'kai', ['k','ai']), w('claps!', 'claps', ['c','l','a','p','s']),
      w('Dad', 'dad', ['d','a','d']), w('loads', 'loads', ['l','oa','d','s']),
      tricky('his', 'his'), w('boat', 'boat', ['b','oa','t']),
      w('with', 'with', ['w','i','th']), w('fish', 'fish', ['f','i','sh']),
      w('each', 'each', ['ea','ch']), w('time.', 'time', ['t','i-e','m']),
      tricky('Is', 'is'), w('this', 'this', ['th','i','s']),
      w('his?', 'his', ['h','i','z']),
    ],
    imageUrl: '/illustrations/3_5/page5.png', audioUrl: '/sounds/sentences/L3_5_p5.mp3',
  },

  // Page 6
  {
    type: 'story',
    sentences: ["Then a voice calls from the boat.", "'Kai! Kai!'", "Kai shouts back as loud as he can.", "'DAD! Is that you?'"],
    words: [
      w('Then', 'then', ['th','e','n']), tricky('a', 'a'),
      w('voice', 'voice', ['v','oi','s']),
      w('calls', 'calls', ['c','a','ll','s']), w('from', 'from', ['f','r','o','m']),
      tricky('the', 'the'), w('boat.', 'boat', ['b','oa','t']),
      w("'Kai!", 'kai', ['k','ai']), w("Kai!'", 'kai', ['k','ai']),
      w('Kai', 'kai', ['k','ai']), w('shouts', 'shouts', ['sh','ou','t','s']),
      w('back', 'back', ['b','a','ck']), w('as', 'as', ['a','z']),
      w('loud', 'loud', ['l','ou','d']), w('as', 'as', ['a','z']),
      tricky('he', 'he'), w('can.', 'can', ['c','a','n']),
      w("'DAD!", 'dad', ['d','a','d']),
      tricky('Is', 'is'), w('that', 'that', ['th','a','t']),
      w("you?'", 'you', ['y','oo']),
    ],
    imageUrl: '/illustrations/3_5/page6.png', audioUrl: '/sounds/sentences/L3_5_p6.mp3',
  },

  // Page 7
  {
    type: 'story',
    sentences: ['The boat docks.', 'Dad leaps off and runs to Kai.', 'Dad scoops him up.', 'They spin and spin.', 'What a hug!'],
    words: [
      tricky('The', 'the'), w('boat', 'boat', ['b','oa','t']),
      w('docks.', 'docks', ['d','o','ck','s']),
      w('Dad', 'dad', ['d','a','d']), w('leaps', 'leaps', ['l','ea','p','s']),
      w('off', 'off', ['o','ff']), w('and', 'and', ['a','n','d']),
      w('runs', 'runs', ['r','u','n','s']), tricky('to', 'to'),
      w('Kai.', 'kai', ['k','ai']),
      w('Dad', 'dad', ['d','a','d']), w('scoops', 'scoops', ['s','c','oo','p','s']),
      w('him', 'him', ['h','i','m']), w('up.', 'up', ['u','p']),
      tricky('They', 'they'), w('spin', 'spin', ['s','p','i','n']),
      w('and', 'and', ['a','n','d']), w('spin.', 'spin', ['s','p','i','n']),
      tricky('What', 'what'), tricky('a', 'a'),
      w('hug!', 'hug', ['h','u','g']),
    ],
    imageUrl: '/illustrations/3_5/page7.png', audioUrl: '/sounds/sentences/L3_5_p7.mp3',
  },

  // Page 8
  {
    type: 'story',
    sentences: ["'I was at sea for so long,' said Dad.", "'I am so glad to be back!'", 'Kai gave him a big grin.', 'The long wait was worth it.'],
    words: [
      tricky("'I", 'I'), tricky('was', 'was'),
      w('at', 'at', ['a','t']), w('sea', 'sea', ['s','ea']),
      w('for', 'for', ['f','or']), tricky('so', 'so'),
      w("long,'", 'long', ['l','o','ng']),
      tricky('said', 'said'), w('Dad.', 'dad', ['d','a','d']),
      tricky("'I", 'I'), w('am', 'am', ['a','m']),
      tricky('so', 'so'), w('glad', 'glad', ['g','l','a','d']),
      tricky('to', 'to'), w('be', 'be', ['b','ee']),
      w("back!'", 'back', ['b','a','ck']),
      w('Kai', 'kai', ['k','ai']), w('gave', 'gave', ['g','a-e','v']),
      w('him', 'him', ['h','i','m']), tricky('a', 'a'),
      w('big', 'big', ['b','i','g']), w('grin.', 'grin', ['g','r','i','n']),
      tricky('The', 'the'), w('long', 'long', ['l','o','ng']),
      w('wait', 'wait', ['w','ai','t']), tricky('was', 'was'),
      w('worth', 'worth', ['w','or','th']), w('it.', 'it', ['i','t']),
    ],
    imageUrl: '/illustrations/3_5/page8.png', audioUrl: '/sounds/sentences/L3_5_p8.mp3',
  },

  {
    type: 'quiz',
    questions: [
      { question: 'Who was Kai waiting for?',
        options: [{ label: 'Dad', isCorrect: true }, { label: 'Mum', isCorrect: false }, { label: 'a friend', isCorrect: false }] },
      { question: 'What colour was the sail?',
        options: [{ label: 'red', isCorrect: true }, { label: 'blue', isCorrect: false }, { label: 'white', isCorrect: false }] },
      { question: 'What was on the boat?',
        options: [{ label: 'fish', isCorrect: true }, { label: 'toys', isCorrect: false }, { label: 'food', isCorrect: false }] },
    ],
  },

  { type: 'sound_spotlight', sound: 'ai', items: [
    { word: 'sail', imageUrl: '/images/words/sail.png', focusIndex: 1 },
    { word: 'rain', imageUrl: '/images/words/rain.png', focusIndex: 1 },
    { word: 'snail', imageUrl: '/images/words/snail.png', focusIndex: 2 },
    { word: 'wait', imageUrl: '/images/words/wait.png', focusIndex: 1 }] },
  { type: 'sound_spotlight', sound: 'oa', items: [
    { word: 'boat', imageUrl: '/images/words/boat.png', focusIndex: 1 },
    { word: 'coat', imageUrl: '/images/words/coat.png', focusIndex: 1 },
    { word: 'road', imageUrl: '/images/words/road.png', focusIndex: 1 },
    { word: 'goat', imageUrl: '/images/words/goat.png', focusIndex: 1 }] },

  { type: 'word_reading', words: [
    w('boat', 'boat', ['b','oa','t']), w('sail', 'sail', ['s','ai','l']),
    w('rain', 'rain', ['r','ai','n']), w('coast', 'coast', ['c','oa','s','t']),
    w('wait', 'wait', ['w','ai','t']), w('groan', 'groan', ['g','r','oa','n'])] },

  { type: 'tricky_words', words: [
    tricky('said', 'said'), tricky('was', 'was'), tricky('so', 'so'),
    tricky('he', 'he'), tricky('what', 'what'), tricky('they', 'they')] },

  { type: 'spelling', words: [
    { word: 'boat', imageUrl: '/images/words/boat.png', letters: ['b','o','a','t'] },
    { word: 'sail', imageUrl: '/images/words/sail.png', letters: ['s','a','i','l'] },
    { word: 'rain', imageUrl: '/images/words/rain.png', letters: ['r','a','i','n'] },
    { word: 'wait', imageUrl: '/images/words/wait.png', letters: ['w','a','i','t'] }] },

  { type: 'nonsense_words', words: [
    w('blain', 'blain', ['b','l','ai','n']), w('froat', 'froat', ['f','r','oa','t']),
    w('snait', 'snait', ['s','n','ai','t']), w('groal', 'groal', ['g','r','oa','l']),
    w('plaid', 'plaid', ['p','l','ai','d']), w('troam', 'troam', ['t','r','oa','m']),
    w('stain', 'stain', ['s','t','ai','n']), w('cloat', 'cloat', ['c','l','oa','t'])] },

  { type: 'writing_practice', letters: ['ai', 'oa', 'a', 'o'] },

  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/3_5/page1.png', label: 'Kai waits in the rain.', correctIndex: 0 },
    { imageUrl: '/illustrations/3_5/page2.png', label: 'Slow as a snail!', correctIndex: 1 },
    { imageUrl: '/illustrations/3_5/page3.png', label: 'A shape on the foam!', correctIndex: 2 },
    { imageUrl: '/illustrations/3_5/page4.png', label: 'A red sail!', correctIndex: 3 },
    { imageUrl: '/illustrations/3_5/page5.png', label: 'Fish on the boat!', correctIndex: 4 },
    { imageUrl: '/illustrations/3_5/page6.png', label: 'Kai! Kai!', correctIndex: 5 },
    { imageUrl: '/illustrations/3_5/page7.png', label: 'Dad scoops him up!', correctIndex: 6 },
    { imageUrl: '/illustrations/3_5/page8.png', label: 'The wait was worth it.', correctIndex: 7 }] },

  { type: 'drawing', prompt: 'Draw Your Favourite Part' },
  { type: 'certificate', bookTitle: 'The Boat with the Red Sail' },
];
