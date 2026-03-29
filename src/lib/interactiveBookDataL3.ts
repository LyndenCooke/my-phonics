/**
 * Interactive book data for Level 3 — "New Spellings"
 * Focus: split vowel digraphs (a-e, i-e, o-e, u-e) and vowel digraphs (ea, oi, aw, ai, oa, ie)
 *
 * L3.1 "The Big Bike Race"   — a-e, i-e
 * L3.2 "The Stone Flute"     — o-e, u-e
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
      w('is', 'is', ['i','z']),
      w('time', 'time', ['t','i-e','m']),
      w('for', 'for', ['f','or']),
      tricky('the', 'the'),
      w('race', 'race', ['r','a-e','s']),
      w('to', 'to', ['t','oo']),
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
    imageUrl: '/illustrations/3_1/page1.png',
  },

  // Page 2: "'Ride to the lake and back!' the man said."
  {
    type: 'story',
    sentences: ["'Ride to the lake and back!' the man said.", 'Can I win?', 'I grip my bike tight.'],
    words: [
      w("'Ride", 'ride', ['r','i-e','d']),
      w('to', 'to', ['t','oo']),
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
    imageUrl: '/illustrations/3_1/page2.png',
  },

  // Page 3: "Off I go! Past a tall pine tree..."
  {
    type: 'story',
    sentences: ['Off I go!', 'Past a tall pine tree.', 'Past a wide stone gate.', 'I ride fast in the sun.'],
    words: [
      w('Off', 'off', ['o','ff']),
      tricky('I', 'I'),
      w('go!', 'go', ['g','oa']),
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
    imageUrl: '/illustrations/3_1/page3.png',
  },

  // Page 4: "Look out! Stones on the track."
  {
    type: 'story',
    sentences: ['Look out!', 'Stones on the track.', 'A bike slides and a girl falls off.', 'She gave me a brave smile.'],
    words: [
      w('Look', 'look', ['l','oo','k']),
      w('out!', 'out', ['ow','t']),
      w('Stones', 'stones', ['s','t','o-e','n','s']),
      w('on', 'on', ['o','n']),
      tricky('the', 'the'),
      w('track.', 'track', ['t','r','a','ck']),
      tricky('A', 'a'),
      w('bike', 'bike', ['b','i-e','k']),
      w('slides', 'slides', ['s','l','i-e','d','s']),
      w('and', 'and', ['a','n','d']),
      tricky('a', 'a'),
      w('girl', 'girl', ['g','ur','l']),
      w('falls', 'falls', ['f','a','ll','s']),
      w('off.', 'off', ['o','ff']),
      tricky('She', 'she'),
      w('gave', 'gave', ['g','a-e','v']),
      w('me', 'me', ['m','ee']),
      tricky('a', 'a'),
      w('brave', 'brave', ['b','r','a-e','v']),
      w('smile.', 'smile', ['s','m','i-e','l']),
    ],
    imageUrl: '/illustrations/3_1/page4.png',
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
    imageUrl: '/illustrations/3_1/page5.png',
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
    imageUrl: '/illustrations/3_1/page6.png',
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
    imageUrl: '/illustrations/3_1/page7.png',
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
      w('day!', 'day', ['d','ai']),
    ],
    imageUrl: '/illustrations/3_1/page8.png',
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
    tricky('like', 'like'), tricky('what', 'what'), tricky('all', 'all')] },

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
// L3.2 — "The Stone Flute"
// Focus sounds: o-e, u-e
// ═══════════════════════════════════════════════════════════════════════════════

export const BOOK_L3_2_PAGES: InteractivePage[] = [
  {
    type: 'cover',
    title: 'The Stone Flute',
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
      w('stone', 'stone', ['s','t','o-e','n']),
      w('flute', 'flute', ['f','l','u-e','t']),
      w('note', 'note', ['n','o-e','t']),
      w('tune', 'tune', ['t','u-e','n']),
      w('cute', 'cute', ['c','u-e','t']),
      w('huge', 'huge', ['h','u-e','j']),
      w('home', 'home', ['h','o-e','m']),
      w('rose', 'rose', ['r','o-e','z']),
    ],
  },

  // Page 1
  {
    type: 'story',
    sentences: ["Mum has a huge box at home.", "'This is for you,' she said.", 'What can be inside?'],
    words: [
      w('Mum', 'mum', ['m','u','m']),
      w('has', 'has', ['h','a','z']),
      tricky('a', 'a'),
      w('huge', 'huge', ['h','u-e','j']),
      w('box', 'box', ['b','o','x']),
      w('at', 'at', ['a','t']),
      w('home.', 'home', ['h','o-e','m']),
      w("'This", 'this', ['th','i','s']),
      w('is', 'is', ['i','z']),
      w('for', 'for', ['f','or']),
      w("you,'", 'you', ['y','oo']),
      tricky('she', 'she'),
      tricky('said.', 'said'),
      tricky('What', 'what'),
      w('can', 'can', ['c','a','n']),
      w('be', 'be', ['b','ee']),
      w('inside?', 'inside', ['i','n','s','i-e','d']),
    ],
    imageUrl: '/illustrations/3_2/page1.png',
  },

  // Page 2
  {
    type: 'story',
    sentences: ['I take the top off the box.', 'Inside is a stone flute!', 'It looks old but so cute.'],
    words: [
      tricky('I', 'I'),
      w('take', 'take', ['t','a-e','k']),
      tricky('the', 'the'),
      w('top', 'top', ['t','o','p']),
      w('off', 'off', ['o','ff']),
      tricky('the', 'the'),
      w('box.', 'box', ['b','o','x']),
      w('Inside', 'inside', ['i','n','s','i-e','d']),
      w('is', 'is', ['i','z']),
      tricky('a', 'a'),
      w('stone', 'stone', ['s','t','o-e','n']),
      w('flute!', 'flute', ['f','l','u-e','t']),
      w('It', 'it', ['i','t']),
      w('looks', 'looks', ['l','oo','k','s']),
      w('old', 'old', ['o','l','d']),
      w('but', 'but', ['b','u','t']),
      tricky('so', 'so'),
      w('cute.', 'cute', ['c','u-e','t']),
    ],
    imageUrl: '/illustrations/3_2/page2.png',
  },

  // Page 3
  {
    type: 'story',
    sentences: ['I blow into the flute.', 'What a rude, flat note!', 'That is not a tune at all.'],
    words: [
      tricky('I', 'I'),
      w('blow', 'blow', ['b','l','ow']),
      w('into', 'into', ['i','n','t','oo']),
      tricky('the', 'the'),
      w('flute.', 'flute', ['f','l','u-e','t']),
      tricky('What', 'what'),
      tricky('a', 'a'),
      w('rude,', 'rude', ['r','u-e','d']),
      w('flat', 'flat', ['f','l','a','t']),
      w('note!', 'note', ['n','o-e','t']),
      w('That', 'that', ['th','a','t']),
      w('is', 'is', ['i','z']),
      w('not', 'not', ['n','o','t']),
      tricky('a', 'a'),
      w('tune', 'tune', ['t','u-e','n']),
      w('at', 'at', ['a','t']),
      tricky('all.', 'all'),
    ],
    imageUrl: '/illustrations/3_2/page3.png',
  },

  // Page 4
  {
    type: 'story',
    sentences: ["'Close your lips,' spoke Mum.", "'Blow soft and slow, like this.'", 'She gave a cute, sweet note.'],
    words: [
      w("'Close", 'close', ['c','l','o-e','s']),
      tricky('your', 'your'),
      w("lips,'", 'lips', ['l','i','p','s']),
      w('spoke', 'spoke', ['s','p','o-e','k']),
      w('Mum.', 'mum', ['m','u','m']),
      w("'Blow", 'blow', ['b','l','ow']),
      w('soft', 'soft', ['s','o','f','t']),
      w('and', 'and', ['a','n','d']),
      w('slow,', 'slow', ['s','l','ow']),
      tricky('like', 'like'),
      w("this.'", 'this', ['th','i','s']),
      tricky('She', 'she'),
      w('gave', 'gave', ['g','a-e','v']),
      tricky('a', 'a'),
      w('cute,', 'cute', ['c','u-e','t']),
      w('sweet', 'sweet', ['s','w','ee','t']),
      w('note.', 'note', ['n','o-e','t']),
    ],
    imageUrl: '/illustrations/3_2/page4.png',
  },

  // Page 5
  {
    type: 'story',
    sentences: ['I use the flute like Mum said.', 'A cute note rose up!', 'I play note, note, note!'],
    words: [
      tricky('I', 'I'),
      w('use', 'use', ['u-e','z']),
      tricky('the', 'the'),
      w('flute', 'flute', ['f','l','u-e','t']),
      tricky('like', 'like'),
      w('Mum', 'mum', ['m','u','m']),
      tricky('said.', 'said'),
      tricky('A', 'a'),
      w('cute', 'cute', ['c','u-e','t']),
      w('note', 'note', ['n','o-e','t']),
      w('rose', 'rose', ['r','o-e','z']),
      w('up!', 'up', ['u','p']),
      tricky('I', 'I'),
      w('play', 'play', ['p','l','ai']),
      w('note,', 'note', ['n','o-e','t']),
      w('note,', 'note', ['n','o-e','t']),
      w('note!', 'note', ['n','o-e','t']),
    ],
    imageUrl: '/illustrations/3_2/page5.png',
  },

  // Page 6
  {
    type: 'story',
    sentences: ['Those notes make a tune at last!', 'The tune fills up the room.', 'It is huge and sweet!'],
    words: [
      w('Those', 'those', ['th','o-e','z']),
      w('notes', 'notes', ['n','o-e','t','s']),
      w('make', 'make', ['m','a-e','k']),
      tricky('a', 'a'),
      w('tune', 'tune', ['t','u-e','n']),
      w('at', 'at', ['a','t']),
      w('last!', 'last', ['l','a','s','t']),
      tricky('The', 'the'),
      w('tune', 'tune', ['t','u-e','n']),
      w('fills', 'fills', ['f','i','ll','s']),
      w('up', 'up', ['u','p']),
      tricky('the', 'the'),
      w('room.', 'room', ['r','oo','m']),
      w('It', 'it', ['i','t']),
      w('is', 'is', ['i','z']),
      w('huge', 'huge', ['h','u-e','j']),
      w('and', 'and', ['a','n','d']),
      w('sweet!', 'sweet', ['s','w','ee','t']),
    ],
    imageUrl: '/illustrations/3_2/page6.png',
  },

  // Page 7
  {
    type: 'story',
    sentences: ['The tune woke Dad from his nap.', "'What a cute stone flute!' said Dad.", 'He gave me a huge smile.'],
    words: [
      tricky('The', 'the'),
      w('tune', 'tune', ['t','u-e','n']),
      w('woke', 'woke', ['w','o-e','k']),
      w('Dad', 'dad', ['d','a','d']),
      w('from', 'from', ['f','r','o','m']),
      w('his', 'his', ['h','i','z']),
      w('nap.', 'nap', ['n','a','p']),
      w("'What", 'what', []),
      tricky('a', 'a'),
      w('cute', 'cute', ['c','u-e','t']),
      w('stone', 'stone', ['s','t','o-e','n']),
      w("flute!'", 'flute', ['f','l','u-e','t']),
      tricky('said', 'said'),
      w('Dad.', 'dad', ['d','a','d']),
      tricky('He', 'he'),
      w('gave', 'gave', ['g','a-e','v']),
      w('me', 'me', ['m','ee']),
      tricky('a', 'a'),
      w('huge', 'huge', ['h','u-e','j']),
      w('smile.', 'smile', ['s','m','i-e','l']),
    ],
    imageUrl: '/illustrations/3_2/page7.png',
  },

  // Page 8
  {
    type: 'story',
    sentences: ['We all sit close to Mum.', 'I play my stone flute and smile.', 'The best tune fills the room!'],
    words: [
      w('We', 'we', ['w','ee']),
      tricky('all', 'all'),
      w('sit', 'sit', ['s','i','t']),
      w('close', 'close', ['c','l','o-e','s']),
      w('to', 'to', ['t','oo']),
      w('Mum.', 'mum', ['m','u','m']),
      tricky('I', 'I'),
      w('play', 'play', ['p','l','ai']),
      w('my', 'my', ['m','y']),
      w('stone', 'stone', ['s','t','o-e','n']),
      w('flute', 'flute', ['f','l','u-e','t']),
      w('and', 'and', ['a','n','d']),
      w('smile.', 'smile', ['s','m','i-e','l']),
      tricky('The', 'the'),
      w('best', 'best', ['b','e','s','t']),
      w('tune', 'tune', ['t','u-e','n']),
      w('fills', 'fills', ['f','i','ll','s']),
      tricky('the', 'the'),
      w('room!', 'room', ['r','oo','m']),
    ],
    imageUrl: '/illustrations/3_2/page8.png',
  },

  // ── QUIZ ──
  {
    type: 'quiz',
    questions: [
      { question: 'What was in the box?',
        options: [{ label: 'a stone flute', isCorrect: true }, { label: 'a drum', isCorrect: false }, { label: 'a hat', isCorrect: false }] },
      { question: 'Who helped with the flute?',
        options: [{ label: 'Mum', isCorrect: true }, { label: 'Dad', isCorrect: false }, { label: 'a friend', isCorrect: false }] },
      { question: 'What did the tune do?',
        options: [{ label: 'woke Dad', isCorrect: true }, { label: 'broke a cup', isCorrect: false }, { label: 'made it rain', isCorrect: false }] },
    ],
  },

  { type: 'sound_spotlight', sound: 'o-e', items: [
    { word: 'stone', imageUrl: '/images/words/stone.png', focusIndex: 2 },
    { word: 'note', imageUrl: '/images/words/note.png', focusIndex: 1 },
    { word: 'home', imageUrl: '/images/words/home.png', focusIndex: 1 },
    { word: 'bone', imageUrl: '/images/words/bone.png', focusIndex: 1 }] },
  { type: 'sound_spotlight', sound: 'u-e', items: [
    { word: 'flute', imageUrl: '/images/words/flute.png', focusIndex: 2 },
    { word: 'cute', imageUrl: '/images/words/cute.png', focusIndex: 1 },
    { word: 'tune', imageUrl: '/images/words/tune.png', focusIndex: 1 },
    { word: 'huge', imageUrl: '/images/words/huge.png', focusIndex: 1 }] },

  { type: 'word_reading', words: [
    w('stone', 'stone', ['s','t','o-e','n']), w('flute', 'flute', ['f','l','u-e','t']),
    w('note', 'note', ['n','o-e','t']), w('tune', 'tune', ['t','u-e','n']),
    w('cute', 'cute', ['c','u-e','t']), w('huge', 'huge', ['h','u-e','j'])] },

  { type: 'tricky_words', words: [
    tricky('said', 'said'), tricky('what', 'what'), tricky('she', 'she'),
    tricky('like', 'like'), tricky('all', 'all'), tricky('your', 'your')] },

  { type: 'spelling', words: [
    { word: 'note', imageUrl: '/images/words/note.png', letters: ['n','o','t','e'] },
    { word: 'tune', imageUrl: '/images/words/tune.png', letters: ['t','u','n','e'] },
    { word: 'flute', imageUrl: '/images/words/flute.png', letters: ['f','l','u','t','e'] },
    { word: 'stone', imageUrl: '/images/words/stone.png', letters: ['s','t','o','n','e'] }] },

  { type: 'nonsense_words', words: [
    w('blone', 'blone', ['b','l','o-e','n']), w('grute', 'grute', ['g','r','u-e','t']),
    w('snoke', 'snoke', ['s','n','o-e','k']), w('plune', 'plune', ['p','l','u-e','n']),
    w('froke', 'froke', ['f','r','o-e','k']), w('smute', 'smute', ['s','m','u-e','t']),
    w('stobe', 'stobe', ['s','t','o-e','b']), w('crune', 'crune', ['c','r','u-e','n'])] },

  { type: 'writing_practice', letters: ['o-e', 'u-e', 'o', 'u'] },

  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/3_2/page1.png', label: 'A huge box at home.', correctIndex: 0 },
    { imageUrl: '/illustrations/3_2/page2.png', label: 'A stone flute inside!', correctIndex: 1 },
    { imageUrl: '/illustrations/3_2/page3.png', label: 'A rude, flat note!', correctIndex: 2 },
    { imageUrl: '/illustrations/3_2/page4.png', label: 'Mum shows how.', correctIndex: 3 },
    { imageUrl: '/illustrations/3_2/page5.png', label: 'A cute note rose up!', correctIndex: 4 },
    { imageUrl: '/illustrations/3_2/page6.png', label: 'A tune at last!', correctIndex: 5 },
    { imageUrl: '/illustrations/3_2/page7.png', label: 'Dad woke up!', correctIndex: 6 },
    { imageUrl: '/illustrations/3_2/page8.png', label: 'The best tune.', correctIndex: 7 }] },

  { type: 'drawing', prompt: 'Draw Your Favourite Part' },
  { type: 'certificate', bookTitle: 'The Stone Flute' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// L3.3 — "Reach for the Treat!"
// Focus sounds: ea, ie
// ═══════════════════════════════════════════════════════════════════════════════

export const BOOK_L3_3_PAGES: InteractivePage[] = [
  {
    type: 'cover',
    title: 'Reach for the Treat!',
    subtitle: 'Level 3 · New Spellings',
    imageUrl: '/illustrations/3_3/cover.png',
  },
  {
    type: 'sound_grid',
    focusSounds: ['ea', 'ie'],
    allSounds: L3_ALL_SOUNDS,
  },
  {
    type: 'vocab_preview',
    words: [
      w('reach', 'reach', ['r','ea','ch']),
      w('treat', 'treat', ['t','r','ea','t']),
      w('team', 'team', ['t','ea','m']),
      w('each', 'each', ['ea','ch']),
      w('feast', 'feast', ['f','ea','s','t']),
      w('spies', 'spies', ['s','p','ie','z']),
      w('tries', 'tries', ['t','r','ie','z']),
      w('cries', 'cries', ['c','r','ie','z']),
    ],
  },

  // Page 1
  {
    type: 'story',
    sentences: ['The mango hangs up high in the tree.', 'It is big and ripe.', 'The boy wants it so much, but the branch is too far.'],
    words: [
      tricky('The', 'the'), w('mango', 'mango', ['m','a','n','g','oa']),
      w('hangs', 'hangs', ['h','a','ng','s']), w('up', 'up', ['u','p']),
      w('high', 'high', ['h','igh']), w('in', 'in', ['i','n']),
      tricky('the', 'the'), w('tree.', 'tree', ['t','r','ee']),
      w('It', 'it', ['i','t']), w('is', 'is', ['i','z']),
      w('big', 'big', ['b','i','g']), w('and', 'and', ['a','n','d']),
      w('ripe.', 'ripe', ['r','i-e','p']),
      tricky('The', 'the'), w('boy', 'boy', ['b','oi']),
      tricky('wants', 'want'), w('it', 'it', ['i','t']),
      tricky('so', 'so'), w('much,', 'much', ['m','u','ch']),
      w('but', 'but', ['b','u','t']), tricky('the', 'the'),
      w('branch', 'branch', ['b','r','a','n','ch']),
      w('is', 'is', ['i','z']), w('too', 'too', ['t','oo']),
      w('far.', 'far', ['f','ar']),
    ],
    imageUrl: '/illustrations/3_3/page1.png',
  },

  // Page 2
  {
    type: 'story',
    sentences: ['He jumps up high.', 'His hands reach and reach, but he can not grab it.', "'I am not big!' he said."],
    words: [
      tricky('He', 'he'), w('jumps', 'jumps', ['j','u','m','p','s']),
      w('up', 'up', ['u','p']), w('high.', 'high', ['h','igh']),
      w('His', 'his', ['h','i','z']), w('hands', 'hands', ['h','a','n','d','s']),
      w('reach', 'reach', ['r','ea','ch']), w('and', 'and', ['a','n','d']),
      w('reach,', 'reach', ['r','ea','ch']), w('but', 'but', ['b','u','t']),
      tricky('he', 'he'), w('can', 'can', ['c','a','n']),
      w('not', 'not', ['n','o','t']), w('grab', 'grab', ['g','r','a','b']),
      w('it.', 'it', ['i','t']),
      w("'I", 'I', []), w('am', 'am', ['a','m']),
      w('not', 'not', ['n','o','t']), w("big!'", 'big', ['b','i','g']),
      tricky('he', 'he'), tricky('said.', 'said'),
    ],
    imageUrl: '/illustrations/3_3/page2.png',
  },

  // Page 3
  {
    type: 'story',
    sentences: ['A girl runs up with a long stick.', 'She spies the same ripe mango too.', "'I want that treat!' she said."],
    words: [
      tricky('A', 'a'), w('girl', 'girl', ['g','ur','l']),
      w('runs', 'runs', ['r','u','n','s']), w('up', 'up', ['u','p']),
      w('with', 'with', ['w','i','th']), tricky('a', 'a'),
      w('long', 'long', ['l','o','ng']), w('stick.', 'stick', ['s','t','i','ck']),
      tricky('She', 'she'), w('spies', 'spies', ['s','p','ie','z']),
      tricky('the', 'the'), w('same', 'same', ['s','a-e','m']),
      w('ripe', 'ripe', ['r','i-e','p']), w('mango', 'mango', ['m','a','n','g','oa']),
      w('too.', 'too', ['t','oo']),
      w("'I", 'I', []), tricky('want', 'want'),
      w('that', 'that', ['th','a','t']),
      w("treat!'", 'treat', ['t','r','ea','t']),
      tricky('she', 'she'), tricky('said.', 'said'),
    ],
    imageUrl: '/illustrations/3_3/page3.png',
  },

  // Page 4
  {
    type: 'story',
    sentences: ['She tries to reach it with the stick.', 'Tap, tap, tap!', 'But the mango stays up high.', "'This is no good,' she said."],
    words: [
      tricky('She', 'she'), w('tries', 'tries', ['t','r','ie','z']),
      w('to', 'to', ['t','oo']), w('reach', 'reach', ['r','ea','ch']),
      w('it', 'it', ['i','t']), w('with', 'with', ['w','i','th']),
      tricky('the', 'the'), w('stick.', 'stick', ['s','t','i','ck']),
      w('Tap,', 'tap', ['t','a','p']), w('tap,', 'tap', ['t','a','p']),
      w('tap!', 'tap', ['t','a','p']),
      w('But', 'but', ['b','u','t']), tricky('the', 'the'),
      w('mango', 'mango', ['m','a','n','g','oa']),
      w('stays', 'stays', ['s','t','ai','s']),
      w('up', 'up', ['u','p']), w('high.', 'high', ['h','igh']),
      w("'This", 'this', ['th','i','s']), w('is', 'is', ['i','z']),
      w('no', 'no', ['n','oa']), w("good,'", 'good', ['g','oo','d']),
      tricky('she', 'she'), tricky('said.', 'said'),
    ],
    imageUrl: '/illustrations/3_3/page4.png',
  },

  // Page 5
  {
    type: 'story',
    sentences: ["'What if I lift you up?' said the boy.", "'Then you can reach it with the stick!'", "The girl grins. 'Yes! We can be a team!'"],
    words: [
      w("'What", 'what', []), w('if', 'if', ['i','f']),
      tricky('I', 'I'), w('lift', 'lift', ['l','i','f','t']),
      w('you', 'you', ['y','oo']), w("up?'", 'up', ['u','p']),
      tricky('said', 'said'), tricky('the', 'the'), w('boy.', 'boy', ['b','oi']),
      w("'Then", 'then', ['th','e','n']),
      w('you', 'you', ['y','oo']), w('can', 'can', ['c','a','n']),
      w('reach', 'reach', ['r','ea','ch']), w('it', 'it', ['i','t']),
      w('with', 'with', ['w','i','th']), tricky('the', 'the'),
      w("stick!'", 'stick', ['s','t','i','ck']),
      tricky('The', 'the'), w('girl', 'girl', ['g','ur','l']),
      w('grins.', 'grins', ['g','r','i','n','s']),
      w("'Yes!", 'yes', ['y','e','s']),
      w('We', 'we', ['w','ee']), w('can', 'can', ['c','a','n']),
      w('be', 'be', ['b','ee']), tricky('a', 'a'),
      w("team!'", 'team', ['t','ea','m']),
    ],
    imageUrl: '/illustrations/3_3/page5.png',
  },

  // Page 6
  {
    type: 'story',
    sentences: ['He lifts her up high.', 'She swings the stick and hits the branch.', 'Crack! The mango falls to the ground.'],
    words: [
      tricky('He', 'he'), w('lifts', 'lifts', ['l','i','f','t','s']),
      w('her', 'her', ['h','ur']), w('up', 'up', ['u','p']),
      w('high.', 'high', ['h','igh']),
      tricky('She', 'she'), w('swings', 'swings', ['s','w','i','ng','s']),
      tricky('the', 'the'), w('stick', 'stick', ['s','t','i','ck']),
      w('and', 'and', ['a','n','d']), w('hits', 'hits', ['h','i','t','s']),
      tricky('the', 'the'), w('branch.', 'branch', ['b','r','a','n','ch']),
      w('Crack!', 'crack', ['c','r','a','ck']),
      tricky('The', 'the'), w('mango', 'mango', ['m','a','n','g','oa']),
      w('falls', 'falls', ['f','a','ll','s']),
      w('to', 'to', ['t','oo']), tricky('the', 'the'),
      w('ground.', 'ground', ['g','r','ow','n','d']),
    ],
    imageUrl: '/illustrations/3_3/page6.png',
  },

  // Page 7
  {
    type: 'story',
    sentences: ["'We got it!' cries the girl.", 'The mango is plump and sweet.', 'They each eat a big bit.', 'What a feast!'],
    words: [
      w("'We", 'we', ['w','ee']), w('got', 'got', ['g','o','t']),
      w("it!'", 'it', ['i','t']), w('cries', 'cries', ['c','r','ie','z']),
      tricky('the', 'the'), w('girl.', 'girl', ['g','ur','l']),
      tricky('The', 'the'), w('mango', 'mango', ['m','a','n','g','oa']),
      w('is', 'is', ['i','z']), w('plump', 'plump', ['p','l','u','m','p']),
      w('and', 'and', ['a','n','d']), w('sweet.', 'sweet', ['s','w','ee','t']),
      tricky('They', 'they'), w('each', 'each', ['ea','ch']),
      w('eat', 'eat', ['ea','t']), tricky('a', 'a'),
      w('big', 'big', ['b','i','g']), w('bit.', 'bit', ['b','i','t']),
      tricky('What', 'what'), tricky('a', 'a'),
      w('feast!', 'feast', ['f','ea','s','t']),
    ],
    imageUrl: '/illustrations/3_3/page7.png',
  },

  // Page 8
  {
    type: 'story',
    sentences: ["'I am glad I met you,' said the boy.", "The girl ties a leaf on the stick.", "'This is OUR tree,' she said.", 'And from that day, they are the best mates.'],
    words: [
      w("'I", 'I', []), w('am', 'am', ['a','m']),
      w('glad', 'glad', ['g','l','a','d']), tricky('I', 'I'),
      w('met', 'met', ['m','e','t']),
      w("you,'", 'you', ['y','oo']), tricky('said', 'said'),
      tricky('the', 'the'), w('boy.', 'boy', ['b','oi']),
      tricky('The', 'the'), w('girl', 'girl', ['g','ur','l']),
      w('ties', 'ties', ['t','ie','z']), tricky('a', 'a'),
      w('leaf', 'leaf', ['l','ea','f']), w('on', 'on', ['o','n']),
      tricky('the', 'the'), w('stick.', 'stick', ['s','t','i','ck']),
      w("'This", 'this', ['th','i','s']), w('is', 'is', ['i','z']),
      w('OUR', 'our', ['ow','ur']),
      w("tree,'", 'tree', ['t','r','ee']),
      tricky('she', 'she'), tricky('said.', 'said'),
      w('And', 'and', ['a','n','d']), w('from', 'from', ['f','r','o','m']),
      w('that', 'that', ['th','a','t']), w('day,', 'day', ['d','ai']),
      tricky('they', 'they'), tricky('are', 'are'),
      tricky('the', 'the'), w('best', 'best', ['b','e','s','t']),
      w('mates.', 'mates', ['m','a-e','t','s']),
    ],
    imageUrl: '/illustrations/3_3/page8.png',
  },

  {
    type: 'quiz',
    questions: [
      { question: 'What was up in the tree?',
        options: [{ label: 'a mango', isCorrect: true }, { label: 'a bird', isCorrect: false }, { label: 'a kite', isCorrect: false }] },
      { question: 'How did they get it down?',
        options: [{ label: 'boy lifted girl with stick', isCorrect: true }, { label: 'they shook the tree', isCorrect: false }, { label: 'they waited for it to fall', isCorrect: false }] },
      { question: 'What did they become?',
        options: [{ label: 'best mates', isCorrect: true }, { label: 'sad', isCorrect: false }, { label: 'lost', isCorrect: false }] },
    ],
  },

  { type: 'sound_spotlight', sound: 'ea', items: [
    { word: 'reach', imageUrl: '/images/words/reach.png', focusIndex: 1 },
    { word: 'treat', imageUrl: '/images/words/treat.png', focusIndex: 2 },
    { word: 'feast', imageUrl: '/images/words/feast.png', focusIndex: 1 },
    { word: 'team', imageUrl: '/images/words/team.png', focusIndex: 1 }] },
  { type: 'sound_spotlight', sound: 'ie', items: [
    { word: 'tries', imageUrl: '/images/words/tries.png', focusIndex: 2 },
    { word: 'cries', imageUrl: '/images/words/cries.png', focusIndex: 2 },
    { word: 'ties', imageUrl: '/images/words/ties.png', focusIndex: 1 },
    { word: 'spies', imageUrl: '/images/words/spies.png', focusIndex: 2 }] },

  { type: 'word_reading', words: [
    w('reach', 'reach', ['r','ea','ch']), w('treat', 'treat', ['t','r','ea','t']),
    w('team', 'team', ['t','ea','m']), w('feast', 'feast', ['f','ea','s','t']),
    w('tries', 'tries', ['t','r','ie','z']), w('cries', 'cries', ['c','r','ie','z'])] },

  { type: 'tricky_words', words: [
    tricky('said', 'said'), tricky('what', 'what'), tricky('want', 'want'),
    tricky('they', 'they'), tricky('are', 'are'), tricky('so', 'so')] },

  { type: 'spelling', words: [
    { word: 'reach', imageUrl: '/images/words/reach.png', letters: ['r','e','a','c','h'] },
    { word: 'treat', imageUrl: '/images/words/treat.png', letters: ['t','r','e','a','t'] },
    { word: 'team', imageUrl: '/images/words/team.png', letters: ['t','e','a','m'] },
    { word: 'feast', imageUrl: '/images/words/feast.png', letters: ['f','e','a','s','t'] }] },

  { type: 'nonsense_words', words: [
    w('bleach', 'bleach', ['b','l','ea','ch']), w('dreap', 'dreap', ['d','r','ea','p']),
    w('sneat', 'sneat', ['s','n','ea','t']), w('freak', 'freak', ['f','r','ea','k']),
    w('glies', 'glies', ['g','l','ie','z']), w('pries', 'pries', ['p','r','ie','z']),
    w('brean', 'brean', ['b','r','ea','n']), w('stries', 'stries', ['s','t','r','ie','z'])] },

  { type: 'writing_practice', letters: ['ea', 'ie', 'e', 'a'] },

  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/3_3/page1.png', label: 'Mango up high!', correctIndex: 0 },
    { imageUrl: '/illustrations/3_3/page2.png', label: 'He can not reach.', correctIndex: 1 },
    { imageUrl: '/illustrations/3_3/page3.png', label: 'A girl with a stick.', correctIndex: 2 },
    { imageUrl: '/illustrations/3_3/page4.png', label: 'Still too high!', correctIndex: 3 },
    { imageUrl: '/illustrations/3_3/page5.png', label: 'We can be a team!', correctIndex: 4 },
    { imageUrl: '/illustrations/3_3/page6.png', label: 'The mango falls!', correctIndex: 5 },
    { imageUrl: '/illustrations/3_3/page7.png', label: 'What a feast!', correctIndex: 6 },
    { imageUrl: '/illustrations/3_3/page8.png', label: 'Best mates.', correctIndex: 7 }] },

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
      w('out', 'out', ['ow','t']), w('her', 'her', ['h','ur']),
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
    imageUrl: '/illustrations/3_4/page1.png',
  },

  // Page 2
  {
    type: 'story',
    sentences: ['She draws and draws.', 'The hawk has sharp claws and a long beak.', 'Oil drips on the sheet.'],
    words: [
      tricky('She', 'she'), w('draws', 'draws', ['d','r','aw','z']),
      w('and', 'and', ['a','n','d']), w('draws.', 'draws', ['d','r','aw','z']),
      tricky('The', 'the'), w('hawk', 'hawk', ['h','aw','k']),
      w('has', 'has', ['h','a','z']), w('sharp', 'sharp', ['sh','ar','p']),
      w('claws', 'claws', ['c','l','aw','z']), w('and', 'and', ['a','n','d']),
      tricky('a', 'a'), w('long', 'long', ['l','o','ng']),
      w('beak.', 'beak', ['b','ea','k']),
      w('Oil', 'oil', ['oi','l']), w('drips', 'drips', ['d','r','i','p','s']),
      w('on', 'on', ['o','n']), tricky('the', 'the'),
      w('sheet.', 'sheet', ['sh','ee','t']),
    ],
    imageUrl: '/illustrations/3_4/page2.png',
  },

  // Page 3
  {
    type: 'story',
    sentences: ["A boy points at it.", "'That is not right!' he said.", "'The claws are too big!'", 'Min feels raw inside.'],
    words: [
      tricky('A', 'a'), w('boy', 'boy', ['b','oi']),
      w('points', 'points', ['p','oi','n','t','s']),
      w('at', 'at', ['a','t']), w('it.', 'it', ['i','t']),
      w("'That", 'that', ['th','a','t']), w('is', 'is', ['i','z']),
      w('not', 'not', ['n','o','t']), w("right!'", 'right', ['r','igh','t']),
      tricky('he', 'he'), tricky('said.', 'said'),
      w("'The", 'the', []), w('claws', 'claws', ['c','l','aw','z']),
      tricky('are', 'are'), w('too', 'too', ['t','oo']),
      w("big!'", 'big', ['b','i','g']),
      w('Min', 'min', ['m','i','n']), w('feels', 'feels', ['f','ee','l','s']),
      w('raw', 'raw', ['r','aw']), w('inside.', 'inside', ['i','n','s','i-e','d']),
    ],
    imageUrl: '/illustrations/3_4/page3.png',
  },

  // Page 4
  {
    type: 'story',
    sentences: ['She wants to spoil it all.', 'But she stops.', 'No! She takes a fresh sheet.', "'I will draw that hawk!' she said."],
    words: [
      tricky('She', 'she'), tricky('wants', 'want'),
      w('to', 'to', ['t','oo']), w('spoil', 'spoil', ['s','p','oi','l']),
      w('it', 'it', ['i','t']), tricky('all.', 'all'),
      w('But', 'but', ['b','u','t']), tricky('she', 'she'),
      w('stops.', 'stops', ['s','t','o','p','s']),
      w('No!', 'no', ['n','oa']), tricky('She', 'she'),
      w('takes', 'takes', ['t','a-e','k','s']), tricky('a', 'a'),
      w('fresh', 'fresh', ['f','r','e','sh']),
      w('sheet.', 'sheet', ['sh','ee','t']),
      w("'I", 'I', []), w('will', 'will', ['w','i','ll']),
      w('draw', 'draw', ['d','r','aw']), w('that', 'that', ['th','a','t']),
      w("hawk!'", 'hawk', ['h','aw','k']),
      tricky('she', 'she'), tricky('said.', 'said'),
    ],
    imageUrl: '/illustrations/3_4/page4.png',
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
    imageUrl: '/illustrations/3_4/page5.png',
  },

  // Page 6
  {
    type: 'story',
    sentences: ['The boy steps up to look.', "He points at the claws.", "'Those claws are so good!' he said.", "'Can I join in?'"],
    words: [
      tricky('The', 'the'), w('boy', 'boy', ['b','oi']),
      w('steps', 'steps', ['s','t','e','p','s']),
      w('up', 'up', ['u','p']), w('to', 'to', ['t','oo']),
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
    imageUrl: '/illustrations/3_4/page6.png',
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
    imageUrl: '/illustrations/3_4/page7.png',
  },

  // Page 8
  {
    type: 'story',
    sentences: ['They pin it up for the class to see.', "Min grins. 'I am glad I did not stop,' she said.", "The boy grins too. 'That hawk is the best!'"],
    words: [
      tricky('They', 'they'), w('pin', 'pin', ['p','i','n']),
      w('it', 'it', ['i','t']), w('up', 'up', ['u','p']),
      w('for', 'for', ['f','or']), tricky('the', 'the'),
      w('class', 'class', ['c','l','a','ss']), w('to', 'to', ['t','oo']),
      w('see.', 'see', ['s','ee']),
      w('Min', 'min', ['m','i','n']), w('grins.', 'grins', ['g','r','i','n','s']),
      w("'I", 'I', []), w('am', 'am', ['a','m']),
      w('glad', 'glad', ['g','l','a','d']), tricky('I', 'I'),
      w('did', 'did', ['d','i','d']), w('not', 'not', ['n','o','t']),
      w("stop,'", 'stop', ['s','t','o','p']),
      tricky('she', 'she'), tricky('said.', 'said'),
      tricky('The', 'the'), w('boy', 'boy', ['b','oi']),
      w('grins', 'grins', ['g','r','i','n','s']),
      w('too.', 'too', ['t','oo']),
      w("'That", 'that', ['th','a','t']),
      w('hawk', 'hawk', ['h','aw','k']), w('is', 'is', ['i','z']),
      tricky('the', 'the'), w("best!'", 'best', ['b','e','s','t']),
    ],
    imageUrl: '/illustrations/3_4/page8.png',
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
      w('boat', 'boat', ['b','oa','t']), w('to', 'to', ['t','oo']),
      w('sail', 'sail', ['s','ai','l']), w('in.', 'in', ['i','n']),
      tricky('The', 'the'), w('sea', 'sea', ['s','ea']),
      w('is', 'is', ['i','z']), w('still.', 'still', ['s','t','i','ll']),
      tricky('He', 'he'), w('lets', 'lets', ['l','e','t','s']),
      w('out', 'out', ['ow','t']), tricky('a', 'a'),
      w('long', 'long', ['l','o','ng']),
      w('groan.', 'groan', ['g','r','oa','n']),
    ],
    imageUrl: '/illustrations/3_5/page1.png',
  },

  // Page 2
  {
    type: 'story',
    sentences: ["He moans and paces the road.", "'It is so slow!' he said.", "He spots a snail.", "'Even the snail wins the race!' he said."],
    words: [
      tricky('He', 'he'), w('moans', 'moans', ['m','oa','n','s']),
      w('and', 'and', ['a','n','d']), w('paces', 'paces', ['p','a-e','s','e','s']),
      tricky('the', 'the'), w('road.', 'road', ['r','oa','d']),
      w("'It", 'it', ['i','t']), w('is', 'is', ['i','z']),
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
    imageUrl: '/illustrations/3_5/page2.png',
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
      w('Is', 'is', ['i','z']), w('it', 'it', ['i','t']),
      tricky('the', 'the'), w('boat?', 'boat', ['b','oa','t']),
      tricky('He', 'he'), w('springs', 'springs', ['s','p','r','i','ng','s']),
      w('to', 'to', ['t','oo']), w('his', 'his', ['h','i','z']),
      w('feet!', 'feet', ['f','ee','t']),
    ],
    imageUrl: '/illustrations/3_5/page3.png',
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
      w('That', 'that', ['th','a','t']), w('is', 'is', ['i','z']),
      tricky('the', 'the'), w('stripe', 'stripe', ['s','t','r','i-e','p']),
      w('on', 'on', ['o','n']), w("Dad's", 'dads', ['d','a','d','s']),
      w('boat!', 'boat', ['b','oa','t']),
      w('Can', 'can', ['c','a','n']), w('it', 'it', ['i','t']),
      w('be?', 'be', ['b','ee']),
    ],
    imageUrl: '/illustrations/3_5/page4.png',
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
      w('his', 'his', ['h','i','z']), w('boat', 'boat', ['b','oa','t']),
      w('with', 'with', ['w','i','th']), w('fish', 'fish', ['f','i','sh']),
      w('each', 'each', ['ea','ch']), w('time.', 'time', ['t','i-e','m']),
      w('Is', 'is', ['i','z']), w('this', 'this', ['th','i','s']),
      w('his?', 'his', ['h','i','z']),
    ],
    imageUrl: '/illustrations/3_5/page5.png',
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
      w('Kai', 'kai', ['k','ai']), w('shouts', 'shouts', ['sh','ow','t','s']),
      w('back', 'back', ['b','a','ck']), w('as', 'as', ['a','z']),
      w('loud', 'loud', ['l','ow','d']), w('as', 'as', ['a','z']),
      tricky('he', 'he'), w('can.', 'can', ['c','a','n']),
      w("'DAD!", 'dad', ['d','a','d']),
      w('Is', 'is', ['i','z']), w('that', 'that', ['th','a','t']),
      w("you?'", 'you', ['y','oo']),
    ],
    imageUrl: '/illustrations/3_5/page6.png',
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
      w('runs', 'runs', ['r','u','n','s']), w('to', 'to', ['t','oo']),
      w('Kai.', 'kai', ['k','ai']),
      w('Dad', 'dad', ['d','a','d']), w('scoops', 'scoops', ['s','c','oo','p','s']),
      w('him', 'him', ['h','i','m']), w('up.', 'up', ['u','p']),
      tricky('They', 'they'), w('spin', 'spin', ['s','p','i','n']),
      w('and', 'and', ['a','n','d']), w('spin.', 'spin', ['s','p','i','n']),
      tricky('What', 'what'), tricky('a', 'a'),
      w('hug!', 'hug', ['h','u','g']),
    ],
    imageUrl: '/illustrations/3_5/page7.png',
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
      w('to', 'to', ['t','oo']), w('be', 'be', ['b','ee']),
      w("back!'", 'back', ['b','a','ck']),
      w('Kai', 'kai', ['k','ai']), w('gave', 'gave', ['g','a-e','v']),
      w('him', 'him', ['h','i','m']), tricky('a', 'a'),
      w('big', 'big', ['b','i','g']), w('grin.', 'grin', ['g','r','i','n']),
      tricky('The', 'the'), w('long', 'long', ['l','o','ng']),
      w('wait', 'wait', ['w','ai','t']), tricky('was', 'was'),
      w('worth', 'worth', ['w','or','th']), w('it.', 'it', ['i','t']),
    ],
    imageUrl: '/illustrations/3_5/page8.png',
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
