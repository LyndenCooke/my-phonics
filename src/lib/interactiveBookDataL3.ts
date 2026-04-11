/**
 * Interactive book data for Level 3 — "New Spellings"
 * Focus: split vowel digraphs (a-e, i-e, o-e, u-e) and vowel digraphs (ea, oi, aw, ai, oa, ie)
 *
 * L3.1 "The Big Bike Race"   — a-e, i-e
 * L3.2 "Lost at the Night Market" — o-e, u-e
 * L3.3 "Reach for the Treat" — ea, ie
 * L3.4 "Draw It Again"       — oi, aw
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
      w('tall', 'tall', ['t','a','ll']),
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

  // Page 8: "A prize! A flat plate with my name on it!"
  {
    type: 'story',
    sentences: ['A prize!', 'A flat plate with my name on it!', 'I wave at my mates.', 'What a good day!'],
    words: [
      tricky('A', 'a'),
      w('prize!', 'prize', ['p','r','i-e','z']),
      tricky('A', 'a'),
      w('flat', 'flat', ['f','l','a','t']),
      w('plate', 'plate', ['p','l','a-e','t']),
      w('with', 'with', ['w','i','th']),
      w('my', 'my', ['m','y']),
      w('name', 'name', ['n','a-e','m']),
      w('on', 'on', ['o','n']),
      w('it!', 'it', ['i','t']),
      tricky('I', 'I'),
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
      { question: 'What prize did the rider get?',
        options: [{ label: 'a plate with a name', isCorrect: true }, { label: 'a cup', isCorrect: false }, { label: 'a hat', isCorrect: false }] },
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
      w('stall.', 'stall', ['s','t','a','ll']),
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
      w('small.', 'small', ['s','m','a','ll']),
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
      w('stall.', 'stall', ['s','t','a','ll']),
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

  // Page 1 — girl sees Nana struggling
  { type: 'story',
    sentences: ['Nana sits by her green gate.', 'She looks so tired.', '"I need to clean," she said.', '"But I can not reach the high shelf."'],
    words: [
      w('Nana', 'nana', ['n','a','n','a']), w('sits', 'sits', ['s','i','t','s']),
      w('by', 'by', ['b','igh']), w('her', 'her', ['h','er']),
      w('green', 'green', ['g','r','ee','n']), w('gate.', 'gate', ['g','a-e','t']),
      tricky('She', 'she'), w('looks', 'looks', ['l','oo','k','s']),
      tricky('so', 'so'), w('tired.', 'tired', ['t','ir','d']),
      tricky('"I', 'I'), w('need', 'need', ['n','ee','d']),
      tricky('to', 'to'), w('clean,"', 'clean', ['c','l','ea','n']),
      tricky('she', 'she'), tricky('said.', 'said'),
      w('"But', 'but', ['b','u','t']), tricky('I', 'I'),
      w('can', 'can', ['c','a','n']), w('not', 'not', ['n','o','t']),
      w('reach', 'reach', ['r','ea','ch']), tricky('the', 'the'),
      w('high', 'high', ['h','igh']), w('shelf."', 'shelf', ['sh','e','l','f']),
    ],
    imageUrl: '/illustrations/3_3/page1.png', audioUrl: '/sounds/sentences/L3_3_p1.mp3' },

  // Page 2 — girl tries to help but can't reach
  { type: 'story',
    sentences: ['I run to Nana.', '"I can reach it!" I said.', 'I tried and tried, but the shelf is too high.', 'I need a plan!'],
    words: [
      tricky('I', 'I'), w('run', 'run', ['r','u','n']),
      tricky('to', 'to'), w('Nana.', 'nana', ['n','a','n','a']),
      tricky('"I', 'I'), w('can', 'can', ['c','a','n']),
      w('reach', 'reach', ['r','ea','ch']), w('it!"', 'it', ['i','t']),
      tricky('I', 'I'), tricky('said.', 'said'),
      tricky('I', 'I'), w('tried', 'tried', ['t','r','ie','d']),
      w('and', 'and', ['a','n','d']), w('tried,', 'tried', ['t','r','ie','d']),
      w('but', 'but', ['b','u','t']), tricky('the', 'the'),
      w('shelf', 'shelf', ['sh','e','l','f']), tricky('is', 'is'),
      w('too', 'too', ['t','oo']), w('high.', 'high', ['h','igh']),
      tricky('I', 'I'), w('need', 'need', ['n','ee','d']),
      tricky('a', 'a'), w('plan!', 'plan', ['p','l','a','n']),
    ],
    imageUrl: '/illustrations/3_3/page2.png', audioUrl: '/sounds/sentences/L3_3_p2.mp3' },

  // Page 3 — girl calls friend from the street
  { type: 'story',
    sentences: ['I spied my friend by the road.', '"Please, can you help?" I cried.', '"We need to be a team!"'],
    words: [
      tricky('I', 'I'), w('spied', 'spied', ['s','p','ie','d']),
      tricky('my', 'my'), w('friend', 'friend', ['f','r','e','n','d']),
      w('by', 'by', ['b','igh']), tricky('the', 'the'), w('road.', 'road', ['r','oa','d']),
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
    sentences: ['I stand on the stool.', 'My friend holds it.', 'I reach up and grab each tin from the shelf.', '"I got them!"'],
    words: [
      tricky('I', 'I'), w('stand', 'stand', ['s','t','a','n','d']),
      w('on', 'on', ['o','n']), tricky('the', 'the'),
      w('stool.', 'stool', ['s','t','oo','l']),
      tricky('My', 'my'), w('friend', 'friend', ['f','r','e','n','d']),
      w('holds', 'holds', ['h','oa','l','d','s']), w('it.', 'it', ['i','t']),
      tricky('I', 'I'), w('reach', 'reach', ['r','ea','ch']),
      w('up', 'up', ['u','p']), w('and', 'and', ['a','n','d']),
      w('grab', 'grab', ['g','r','a','b']), w('each', 'each', ['ea','ch']),
      w('tin', 'tin', ['t','i','n']), w('from', 'from', ['f','r','o','m']),
      tricky('the', 'the'), w('shelf.', 'shelf', ['sh','e','l','f']),
      w('"I', 'I', []), w('got', 'got', ['g','o','t']),
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

  // Page 7 — Nana serves food
  { type: 'story',
    sentences: ['Nana grins.', '"Sit, sit!" she said.', 'She brings us each a big, sweet treat —', 'beans and rice with fried plantain!'],
    words: [
      w('Nana', 'nana', ['n','a','n','a']), w('grins.', 'grins', ['g','r','i','n','s']),
      w('"Sit,', 'sit', ['s','i','t']), w('sit!"', 'sit', ['s','i','t']),
      tricky('she', 'she'), tricky('said.', 'said'),
      tricky('She', 'she'), w('brings', 'brings', ['b','r','i','ng','s']),
      w('us', 'us', ['u','s']), w('each', 'each', ['ea','ch']),
      tricky('a', 'a'), w('big,', 'big', ['b','i','g']),
      w('sweet', 'sweet', ['s','w','ee','t']),
      w('treat', 'treat', ['t','r','ea','t']), w('—', '—', []),
      w('beans', 'beans', ['b','ea','n','s']), w('and', 'and', ['a','n','d']),
      w('rice', 'rice', ['r','i-e','s']), w('with', 'with', ['w','i','th']),
      w('fried', 'fried', ['f','r','ie','d']),
      w('plantain!', 'plantain', ['p','l','a','n','t','ai','n']),
    ],
    imageUrl: '/illustrations/3_3/page7.png', audioUrl: '/sounds/sentences/L3_3_p7.mp3' },

  // Page 8 — warm ending
  { type: 'story',
    sentences: ['We feast and beam.', '"Thank you, Nana!"', 'Helping feels like the best treat of all.'],
    words: [
      tricky('We', 'we'), w('feast', 'feast', ['f','ea','s','t']),
      w('and', 'and', ['a','n','d']), w('beam.', 'beam', ['b','ea','m']),
      w('"Thank', 'thank', ['th','a','nk']),
      w('you,', 'you', ['y','oo']), w('Nana!"', 'nana', ['n','a','n','a']),
      w('Helping', 'helping', ['h','e','l','p','i','ng']),
      w('feels', 'feels', ['f','ee','l','s']),
      w('like', 'like', ['l','i-e','k']),
      tricky('the', 'the'), w('best', 'best', ['b','e','s','t']),
      w('treat', 'treat', ['t','r','ea','t']),
      w('of', 'of', ['o','f']), tricky('all.', 'all'),
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
    { word: 'spied', imageUrl: '/images/words/spied.png', focusIndex: 2 },
    { word: 'fried', imageUrl: '/images/words/fried.png', focusIndex: 2 }] },

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
    { imageUrl: '/illustrations/3_3/page1.png', label: 'Nana needs to clean.', correctIndex: 0 },
    { imageUrl: '/illustrations/3_3/page2.png', label: 'I tried but it is too high!', correctIndex: 1 },
    { imageUrl: '/illustrations/3_3/page3.png', label: 'I spied my friend. We need a team!', correctIndex: 2 },
    { imageUrl: '/illustrations/3_3/page4.png', label: 'We clean and sweep.', correctIndex: 3 },
    { imageUrl: '/illustrations/3_3/page5.png', label: 'I reach each tin from the shelf!', correctIndex: 4 },
    { imageUrl: '/illustrations/3_3/page6.png', label: 'What a dream team!', correctIndex: 5 },
    { imageUrl: '/illustrations/3_3/page7.png', label: 'Nana brings a sweet treat!', correctIndex: 6 },
    { imageUrl: '/illustrations/3_3/page8.png', label: 'Helping is the best treat of all.', correctIndex: 7 }] },

  { type: 'drawing', prompt: 'Draw Your Favourite Part' },
  { type: 'certificate', bookTitle: 'Reach for the Treat!' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// L3.4 — "Draw It Again!"
// Focus sounds: oi, aw
// ═══════════════════════════════════════════════════════════════════════════════

export const BOOK_L3_4_PAGES: InteractivePage[] = [
  {
    type: 'cover',
    title: 'Draw It Again!',
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
      w('draw', 'draw', ['d','r','aw']),
      w('hawk', 'hawk', ['h','aw','k']),
      w('claws', 'claws', ['c','l','aw','z']),
      w('oil', 'oil', ['oi','l']),
      w('points', 'points', ['p','oi','n','t','s']),
      w('toil', 'toil', ['t','oi','l']),
      w('raw', 'raw', ['r','aw']),
      w('spoil', 'spoil', ['s','p','oi','l']),
    ],
  },

  // Page 1
  {
    type: 'story',
    sentences: ["Min gets out her oil sticks and a big sheet.", "'I will draw a hawk with sharp claws!' she said.", 'She grips a stick tight.'],
    words: [
      w('Min', 'min', ['m','i','n']), w('gets', 'gets', ['g','e','t','s']),
      w('out', 'out', ['ou','t']), w('her', 'her', ['h','er']),
      w('oil', 'oil', ['oi','l']), w('sticks', 'sticks', ['s','t','i','ck','s']),
      w('and', 'and', ['a','n','d']), tricky('a', 'a'),
      w('big', 'big', ['b','i','g']), w('sheet.', 'sheet', ['sh','ee','t']),
      w("'I", 'I', []), w('will', 'will', ['w','i','ll']),
      w('draw', 'draw', ['d','r','aw']), tricky('a', 'a'),
      w('hawk', 'hawk', ['h','aw','k']), w('with', 'with', ['w','i','th']),
      w('sharp', 'sharp', ['sh','ar','p']),
      w("claws!'", 'claws', ['c','l','aw','z']),
      tricky('she', 'she'), tricky('said.', 'said'),
      tricky('She', 'she'), w('grips', 'grips', ['g','r','i','p','s']),
      tricky('a', 'a'), w('stick', 'stick', ['s','t','i','ck']),
      w('tight.', 'tight', ['t','igh','t']),
    ],
    imageUrl: '/illustrations/3_4/page1.png', audioUrl: '/sounds/sentences/L3_4_p1.mp3',
  },

  // Page 2
  {
    type: 'story',
    sentences: ['She draws and draws.', 'The hawk has sharp claws and a long beak.', 'Oil drips on the sheet.'],
    words: [
      tricky('She', 'she'), w('draws', 'draws', ['d','r','aw','z']),
      w('and', 'and', ['a','n','d']), w('draws.', 'draws', ['d','r','aw','z']),
      tricky('The', 'the'), w('hawk', 'hawk', ['h','aw','k']),
      tricky('has', 'has'), w('sharp', 'sharp', ['sh','ar','p']),
      w('claws', 'claws', ['c','l','aw','z']), w('and', 'and', ['a','n','d']),
      tricky('a', 'a'), w('long', 'long', ['l','o','ng']),
      w('beak.', 'beak', ['b','ea','k']),
      w('Oil', 'oil', ['oi','l']), w('drips', 'drips', ['d','r','i','p','s']),
      w('on', 'on', ['o','n']), tricky('the', 'the'),
      w('sheet.', 'sheet', ['sh','ee','t']),
    ],
    imageUrl: '/illustrations/3_4/page2.png', audioUrl: '/sounds/sentences/L3_4_p2.mp3',
  },

  // Page 3
  {
    type: 'story',
    sentences: ["A boy points at it.", "'That is not right!' he said.", "'The claws are too big!'", 'Min feels raw inside.'],
    words: [
      tricky('A', 'a'), w('boy', 'boy', ['b','oy']),
      w('points', 'points', ['p','oi','n','t','s']),
      w('at', 'at', ['a','t']), w('it.', 'it', ['i','t']),
      w("'That", 'that', ['th','a','t']), tricky('is', 'is'),
      w('not', 'not', ['n','o','t']), w("right!'", 'right', ['r','igh','t']),
      tricky('he', 'he'), tricky('said.', 'said'),
      w("'The", 'the', []), w('claws', 'claws', ['c','l','aw','z']),
      tricky('are', 'are'), w('too', 'too', ['t','oo']),
      w("big!'", 'big', ['b','i','g']),
      w('Min', 'min', ['m','i','n']), w('feels', 'feels', ['f','ee','l','s']),
      w('raw', 'raw', ['r','aw']), w('inside.', 'inside', ['i','n','s','i-e','d']),
    ],
    imageUrl: '/illustrations/3_4/page3.png', audioUrl: '/sounds/sentences/L3_4_p3.mp3',
  },

  // Page 4
  {
    type: 'story',
    sentences: ['She wants to spoil it all.', 'But she stops.', 'No! She takes a fresh sheet.', "'I will draw that hawk!' she said."],
    words: [
      tricky('She', 'she'), tricky('wants', 'want'),
      tricky('to', 'to'), w('spoil', 'spoil', ['s','p','oi','l']),
      w('it', 'it', ['i','t']), tricky('all.', 'all'),
      w('But', 'but', ['b','u','t']), tricky('she', 'she'),
      w('stops.', 'stops', ['s','t','o','p','s']),
      tricky('No!', 'no'), tricky('She', 'she'),
      w('takes', 'takes', ['t','a-e','k','s']), tricky('a', 'a'),
      w('fresh', 'fresh', ['f','r','e','sh']),
      w('sheet.', 'sheet', ['sh','ee','t']),
      w("'I", 'I', []), w('will', 'will', ['w','i','ll']),
      w('draw', 'draw', ['d','r','aw']), w('that', 'that', ['th','a','t']),
      w("hawk!'", 'hawk', ['h','aw','k']),
      tricky('she', 'she'), tricky('said.', 'said'),
    ],
    imageUrl: '/illustrations/3_4/page4.png', audioUrl: '/sounds/sentences/L3_4_p4.mp3',
  },

  // Page 5
  {
    type: 'story',
    sentences: ['This time, she draws with smooth oil strokes.', 'The claws look just right.', 'The wings spread wide and shine in the light!'],
    words: [
      w('This', 'this', ['th','i','s']), w('time,', 'time', ['t','i-e','m']),
      tricky('she', 'she'), w('draws', 'draws', ['d','r','aw','z']),
      w('with', 'with', ['w','i','th']), w('smooth', 'smooth', ['s','m','oo','th']),
      w('oil', 'oil', ['oi','l']), w('strokes.', 'strokes', ['s','t','r','o-e','k','s']),
      tricky('The', 'the'), w('claws', 'claws', ['c','l','aw','z']),
      w('look', 'look', ['l','oo','k']), w('just', 'just', ['j','u','s','t']),
      w('right.', 'right', ['r','igh','t']),
      tricky('The', 'the'), w('wings', 'wings', ['w','i','ng','s']),
      w('spread', 'spread', ['s','p','r','e','d']),
      w('wide', 'wide', ['w','i-e','d']), w('and', 'and', ['a','n','d']),
      w('shine', 'shine', ['sh','i-e','n']),
      w('in', 'in', ['i','n']), tricky('the', 'the'),
      w('light!', 'light', ['l','igh','t']),
    ],
    imageUrl: '/illustrations/3_4/page5.png', audioUrl: '/sounds/sentences/L3_4_p5.mp3',
  },

  // Page 6
  {
    type: 'story',
    sentences: ['The boy steps up to look.', "He points at the claws.", "'Those claws are so good!' he said.", "'Can I join in?'"],
    words: [
      tricky('The', 'the'), w('boy', 'boy', ['b','oy']),
      w('steps', 'steps', ['s','t','e','p','s']),
      w('up', 'up', ['u','p']), tricky('to', 'to'),
      w('look.', 'look', ['l','oo','k']),
      tricky('He', 'he'), w('points', 'points', ['p','oi','n','t','s']),
      w('at', 'at', ['a','t']), tricky('the', 'the'),
      w('claws.', 'claws', ['c','l','aw','z']),
      w("'Those", 'those', ['th','o-e','z']),
      w('claws', 'claws', ['c','l','aw','z']), tricky('are', 'are'),
      tricky('so', 'so'), w("good!'", 'good', ['g','oo','d']),
      tricky('he', 'he'), tricky('said.', 'said'),
      w("'Can", 'can', ['c','a','n']), tricky('I', 'I'),
      w('join', 'join', ['j','oi','n']), w("in?'", 'in', ['i','n']),
    ],
    imageUrl: '/illustrations/3_4/page6.png', audioUrl: '/sounds/sentences/L3_4_p6.mp3',
  },

  // Page 7
  {
    type: 'story',
    sentences: ['Min nods.', 'He grabs oil sticks too.', 'They draw a green lawn with soil and straw.', 'They toil and toil!'],
    words: [
      w('Min', 'min', ['m','i','n']), w('nods.', 'nods', ['n','o','d','s']),
      tricky('He', 'he'), w('grabs', 'grabs', ['g','r','a','b','s']),
      w('oil', 'oil', ['oi','l']), w('sticks', 'sticks', ['s','t','i','ck','s']),
      w('too.', 'too', ['t','oo']),
      tricky('They', 'they'), w('draw', 'draw', ['d','r','aw']),
      tricky('a', 'a'), w('green', 'green', ['g','r','ee','n']),
      w('lawn', 'lawn', ['l','aw','n']), w('with', 'with', ['w','i','th']),
      w('soil', 'soil', ['s','oi','l']), w('and', 'and', ['a','n','d']),
      w('straw.', 'straw', ['s','t','r','aw']),
      tricky('They', 'they'), w('toil', 'toil', ['t','oi','l']),
      w('and', 'and', ['a','n','d']), w('toil!', 'toil', ['t','oi','l']),
    ],
    imageUrl: '/illustrations/3_4/page7.png', audioUrl: '/sounds/sentences/L3_4_p7.mp3',
  },

  // Page 8
  {
    type: 'story',
    sentences: ['They pin it up for the class to see.', "Min grins. 'I am glad I did not stop,' she said.", "The boy grins too. 'That hawk is the best!'"],
    words: [
      tricky('They', 'they'), w('pin', 'pin', ['p','i','n']),
      w('it', 'it', ['i','t']), w('up', 'up', ['u','p']),
      w('for', 'for', ['f','or']), tricky('the', 'the'),
      w('class', 'class', ['c','l','a','ss']), tricky('to', 'to'),
      w('see.', 'see', ['s','ee']),
      w('Min', 'min', ['m','i','n']), w('grins.', 'grins', ['g','r','i','n','s']),
      w("'I", 'I', []), w('am', 'am', ['a','m']),
      w('glad', 'glad', ['g','l','a','d']), tricky('I', 'I'),
      w('did', 'did', ['d','i','d']), w('not', 'not', ['n','o','t']),
      w("stop,'", 'stop', ['s','t','o','p']),
      tricky('she', 'she'), tricky('said.', 'said'),
      tricky('The', 'the'), w('boy', 'boy', ['b','oy']),
      w('grins', 'grins', ['g','r','i','n','s']),
      w('too.', 'too', ['t','oo']),
      w("'That", 'that', ['th','a','t']),
      w('hawk', 'hawk', ['h','aw','k']), tricky('is', 'is'),
      tricky('the', 'the'), w("best!'", 'best', ['b','e','s','t']),
    ],
    imageUrl: '/illustrations/3_4/page8.png', audioUrl: '/sounds/sentences/L3_4_p8.mp3',
  },

  {
    type: 'quiz',
    questions: [
      { question: 'What did Min draw?',
        options: [{ label: 'a hawk', isCorrect: true }, { label: 'a dog', isCorrect: false }, { label: 'a fish', isCorrect: false }] },
      { question: 'What did the boy say at first?',
        options: [{ label: 'the claws are too big', isCorrect: true }, { label: 'it is pretty', isCorrect: false }, { label: 'can I have it', isCorrect: false }] },
      { question: 'What did Min do?',
        options: [{ label: 'drew it again', isCorrect: true }, { label: 'gave up', isCorrect: false }, { label: 'ran away', isCorrect: false }] },
    ],
  },

  { type: 'sound_spotlight', sound: 'oi', items: [
    { word: 'oil', imageUrl: '/images/words/oil.png', focusIndex: 0 },
    { word: 'coin', imageUrl: '/images/words/coin.png', focusIndex: 1 },
    { word: 'join', imageUrl: '/images/words/join.png', focusIndex: 1 },
    { word: 'soil', imageUrl: '/images/words/soil.png', focusIndex: 1 }] },
  { type: 'sound_spotlight', sound: 'aw', items: [
    { word: 'draw', imageUrl: '/images/words/draw.png', focusIndex: 2 },
    { word: 'hawk', imageUrl: '/images/words/hawk.png', focusIndex: 1 },
    { word: 'straw', imageUrl: '/images/words/straw.png', focusIndex: 3 },
    { word: 'claw', imageUrl: '/images/words/claw.png', focusIndex: 2 }] },

  { type: 'word_reading', words: [
    w('draw', 'draw', ['d','r','aw']), w('hawk', 'hawk', ['h','aw','k']),
    w('oil', 'oil', ['oi','l']), w('join', 'join', ['j','oi','n']),
    w('claws', 'claws', ['c','l','aw','z']), w('toil', 'toil', ['t','oi','l'])] },

  { type: 'tricky_words', words: [
    tricky('said', 'said'), tricky('she', 'she'), tricky('he', 'he'),
    tricky('are', 'are'), tricky('so', 'so'), tricky('they', 'they')] },

  { type: 'spelling', words: [
    { word: 'draw', imageUrl: '/images/words/draw.png', letters: ['d','r','a','w'] },
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
    { imageUrl: '/illustrations/3_4/page1.png', label: 'Min draws a hawk.', correctIndex: 0 },
    { imageUrl: '/illustrations/3_4/page2.png', label: 'Sharp claws and beak.', correctIndex: 1 },
    { imageUrl: '/illustrations/3_4/page3.png', label: 'A boy says not right.', correctIndex: 2 },
    { imageUrl: '/illustrations/3_4/page4.png', label: 'Min tries again.', correctIndex: 3 },
    { imageUrl: '/illustrations/3_4/page5.png', label: 'Claws look just right!', correctIndex: 4 },
    { imageUrl: '/illustrations/3_4/page6.png', label: 'Can I join in?', correctIndex: 5 },
    { imageUrl: '/illustrations/3_4/page7.png', label: 'They draw together.', correctIndex: 6 },
    { imageUrl: '/illustrations/3_4/page8.png', label: 'The best hawk!', correctIndex: 7 }] },

  { type: 'drawing', prompt: 'Draw Your Favourite Part' },
  { type: 'certificate', bookTitle: 'Draw It Again!' },
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
      w("'I", 'I', []), tricky('was', 'was'),
      w('at', 'at', ['a','t']), w('sea', 'sea', ['s','ea']),
      w('for', 'for', ['f','or']), tricky('so', 'so'),
      w("long,'", 'long', ['l','o','ng']),
      tricky('said', 'said'), w('Dad.', 'dad', ['d','a','d']),
      w("'I", 'I', []), w('am', 'am', ['a','m']),
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
