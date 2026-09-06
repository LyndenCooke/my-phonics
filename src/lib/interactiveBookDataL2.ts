/**
 * Interactive book page data for Level 2 books.
 * L2 introduces long vowel digraphs: ay, ee, igh, ow, oo, ar, or, air, ir, ou, oy
 */

import type { InteractivePage, StoryWord } from './interactiveBookData';

// ── Helpers (duplicated to keep module self-contained) ──
function cvc(display: string, word: string): StoryWord {
  return { display, word, phonemes: word.split('') };
}
function tricky(display: string, word: string): StoryWord {
  return { display, word, phonemes: [], isTricky: true };
}
/** Word with explicit phoneme breakdown */
function pw(display: string, word: string, phonemes: string[]): StoryWord {
  return { display, word, phonemes };
}

// L2 cumulative sound grid (L1 Set 1 + L2 digraphs)
const L2_ALL_SOUNDS = [
  's', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o',
  'c', 'k', 'ck', 'e', 'u', 'r', 'h', 'b', 'f', 'ff',
  'l', 'll', 'ss', 'j', 'v', 'w', 'x', 'y', 'z', 'zz',
  'qu', 'ch', 'sh', 'th', 'ng', 'nk',
  'ay', 'ee', 'igh', 'ow', 'oo',
  'ar', 'or', 'air', 'ir', 'ou', 'oy',
];

// ═══════════════════════════════════════════════════════════════════════════
// L2.1  —  The Night Light  (Focus: ay, ee, igh)
// ═══════════════════════════════════════════════════════════════════════════

export const BOOK_L2_1_PAGES: InteractivePage[] = [
  { type: 'cover', title: 'The Night Light', subtitle: 'Level 4 · Longer Sounds', imageUrl: '/illustrations/2_1/cover.png' },

  { type: 'sound_grid', focusSounds: ['ay', 'ee', 'igh'], allSounds: L2_ALL_SOUNDS },

  { type: 'vocab_preview', words: [
    pw('day', 'day', ['d','ay']), pw('way', 'way', ['w','ay']),
    pw('say', 'say', ['s','ay']), pw('yay', 'yay', ['y','ay']),
    pw('see', 'see', ['s','ee']), pw('need', 'need', ['n','ee','d']),
    pw('light', 'light', ['l','igh','t']), pw('night', 'night', ['n','igh','t']),
    pw('high', 'high', ['h','igh']), pw('toy', 'toy', ['t','oy']),
  ]},

  // Page 1 — boy at home at dusk, searching sofa cushions for toy cat
    { type: 'story', sentences: ['The day ends.', 'I can\'t see my toy cat.'],
    words: [
      tricky('The', 'the'),
      pw('day', 'day', ['d', 'ay']),
      cvc('ends.', 'ends'),
      tricky('I', 'I'),
      cvc('can\'t', 'cant'),
      pw('see', 'see', ['s', 'ee']),
      cvc('my', 'my'),
      pw('toy', 'toy', ['t', 'oy']),
      cvc('cat.', 'cat'),
    ],
    imageUrl: '/illustrations/2_1/page1.png', audioUrl: '/sounds/sentences/L2_1_p1.mp3' },
  { type: 'story', sentences: ['We go out to look.', 'It is night.'],
    words: [
      cvc('We', 'we'),
      tricky('go', 'go'),
      pw('out', 'out', ['ou', 't']),
      tricky('to', 'to'),
      pw('look.', 'look', ['l', 'oo', 'k']),
      cvc('It', 'it'),
      tricky('is', 'is'),
      pw('night.', 'night', ['n', 'igh', 't']),
    ],
    imageUrl: '/illustrations/2_1/page2.png', audioUrl: '/sounds/sentences/L2_1_p2.mp3' },
  { type: 'story', sentences: ['Look at the lights.', 'I can see in the shop.'],
    words: [
      pw('Look', 'look', ['l', 'oo', 'k']),
      cvc('at', 'at'),
      tricky('the', 'the'),
      pw('lights.', 'lights', ['l', 'igh', 't', 's']),
      tricky('I', 'I'),
      cvc('can', 'can'),
      pw('see', 'see', ['s', 'ee']),
      cvc('in', 'in'),
      tricky('the', 'the'),
      pw('shop.', 'shop', ['sh', 'o', 'p']),
    ],
    imageUrl: '/illustrations/2_1/page3.png', audioUrl: '/sounds/sentences/L2_1_p3.mp3' },
  { type: 'story', sentences: ['It is dim on the way.', 'I need a light.'],
    words: [
      cvc('It', 'it'),
      tricky('is', 'is'),
      cvc('dim', 'dim'),
      cvc('on', 'on'),
      tricky('the', 'the'),
      pw('way.', 'way', ['w', 'ay']),
      tricky('I', 'I'),
      pw('need', 'need', ['n', 'ee', 'd']),
      tricky('a', 'a'),
      pw('light.', 'light', ['l', 'igh', 't']),
    ],
    imageUrl: '/illustrations/2_1/page4.png', audioUrl: '/sounds/sentences/L2_1_p4.mp3' },
  { type: 'story', sentences: ['Look, a light up high!', 'It is the moon.'],
    words: [
      pw('Look,', 'look', ['l', 'oo', 'k']),
      tricky('a', 'a'),
      pw('light', 'light', ['l', 'igh', 't']),
      cvc('up', 'up'),
      pw('high!', 'high', ['h', 'igh']),
      cvc('It', 'it'),
      tricky('is', 'is'),
      tricky('the', 'the'),
      pw('moon.', 'moon', ['m', 'oo', 'n']),
    ],
    imageUrl: '/illustrations/2_1/page5.png', audioUrl: '/sounds/sentences/L2_1_p5.mp3' },
  { type: 'story', sentences: ['Dad can see I am sad.', 'He hugs me in the light.'],
    words: [
      cvc('Dad', 'dad'),
      cvc('can', 'can'),
      pw('see', 'see', ['s', 'ee']),
      tricky('I', 'I'),
      cvc('am', 'am'),
      cvc('sad.', 'sad'),
      cvc('He', 'he'),
      cvc('hugs', 'hugs'),
      cvc('me', 'me'),
      cvc('in', 'in'),
      tricky('the', 'the'),
      pw('light.', 'light', ['l', 'igh', 't']),
    ],
    imageUrl: '/illustrations/2_1/page6.png', audioUrl: '/sounds/sentences/L2_1_p6.mp3' },
  { type: 'story', sentences: ['I see my toy cat!', 'Dad and I run to it.'],
    words: [
      tricky('I', 'I'),
      pw('see', 'see', ['s', 'ee']),
      cvc('my', 'my'),
      pw('toy', 'toy', ['t', 'oy']),
      cvc('cat!', 'cat'),
      cvc('Dad', 'dad'),
      cvc('and', 'and'),
      tricky('I', 'I'),
      cvc('run', 'run'),
      tricky('to', 'to'),
      cvc('it.', 'it'),
    ],
    imageUrl: '/illustrations/2_1/page7.png', audioUrl: '/sounds/sentences/L2_1_p7.mp3' },
  { type: 'story', sentences: ['I hug my toy cat.', '"Yay, my toy!"'],
    words: [
      tricky('I', 'I'),
      cvc('hug', 'hug'),
      cvc('my', 'my'),
      pw('toy', 'toy', ['t', 'oy']),
      cvc('cat.', 'cat'),
      pw('"Yay,', 'yay', ['y', 'ay']),
      cvc('my', 'my'),
      pw('toy!"', 'toy', ['t', 'oy']),
    ],
    imageUrl: '/illustrations/2_1/page8.png', audioUrl: '/sounds/sentences/L2_1_p8.mp3' },

  // ── QUIZ ──
  { type: 'quiz', questions: [
    { question: 'What did the boy lose?',
      options: [{ label: 'his cat', isCorrect: true }, { label: 'his hat', isCorrect: false }, { label: 'his bag', isCorrect: false }] },
    { question: 'What was up high in the night sky?',
      options: [{ label: 'the moon', isCorrect: true }, { label: 'a kite', isCorrect: false }, { label: 'a plane', isCorrect: false }] },
    { question: 'What did the boy say when he found his cat?',
      options: [{ label: 'Yay!', isCorrect: true }, { label: 'No!', isCorrect: false }, { label: 'Help!', isCorrect: false }] },
  ]},

  // ── SOUND SPOTLIGHTS ──
  { type: 'sound_spotlight', sound: 'ay', items: [
    { word: 'day', imageUrl: '/images/words/day.png', focusIndex: 1 },
    { word: 'say', imageUrl: '/images/words/say.png', focusIndex: 1 },
    { word: 'play', imageUrl: '/images/words/play.png', focusIndex: 2 },
    { word: 'stay', imageUrl: '/images/words/stay.png', focusIndex: 2 },
  ]},
  { type: 'sound_spotlight', sound: 'ee', items: [
    { word: 'see', imageUrl: '/images/words/see.png', focusIndex: 1 },
    { word: 'tree', imageUrl: '/images/words/tree.png', focusIndex: 2 },
    { word: 'feel', imageUrl: '/images/words/feel.png', focusIndex: 1 },
    { word: 'jeep', imageUrl: '/images/words/jeep.png', focusIndex: 1 },
  ]},
  { type: 'sound_spotlight', sound: 'igh', items: [
    { word: 'high', imageUrl: '/images/words/high.png', focusIndex: 1 },
    { word: 'night', imageUrl: '/images/words/night.png', focusIndex: 1 },
    { word: 'light', imageUrl: '/images/words/light.png', focusIndex: 1 },
    { word: 'sight', imageUrl: '/images/words/sight.png', focusIndex: 1 },
  ]},

  // ── WORD READING ──
  { type: 'word_reading', words: [
    pw('high', 'high', ['h','igh']), pw('day', 'day', ['d','ay']),
    pw('sigh', 'sigh', ['s','igh']), pw('light', 'light', ['l','igh','t']),
    pw('see', 'see', ['s','ee']), pw('way', 'way', ['w','ay']),
    pw('night', 'night', ['n','igh','t']),
  ]},

  // ── TRICKY WORDS ──
  { type: 'tricky_words', words: [tricky('the', 'the'), tricky('I', 'I'), tricky('is', 'is'), tricky('a', 'a')] },

  // ── SPELLING ──
  { type: 'spelling', words: [
    { word: 'day', imageUrl: '/images/words/day.png', letters: ['d','ay'] },
    { word: 'see', imageUrl: '/images/words/see.png', letters: ['s','ee'] },
    { word: 'high', imageUrl: '/images/words/high.png', letters: ['h','igh'] },
    { word: 'night', imageUrl: '/images/words/night.png', letters: ['n','igh','t'] },
  ]},

  // ── ALIEN WORDS ──
  { type: 'nonsense_words', words: [
    pw('fay', 'fay', ['f','ay']), pw('tay', 'tay', ['t','ay']),
    pw('zay', 'zay', ['z','ay']), pw('nay', 'nay', ['n','ay']),
    pw('tee', 'tee', ['t','ee']), pw('mee', 'mee', ['m','ee']),
    pw('ree', 'ree', ['r','ee']), pw('zee', 'zee', ['z','ee']),
    pw('nigh', 'nigh', ['n','igh']), pw('digh', 'digh', ['d','igh']),
    pw('figh', 'figh', ['f','igh']), pw('jigh', 'jigh', ['j','igh']),
  ]},

  { type: 'writing_practice', letters: ['ay', 'ee', 'igh'] },

  { type: 'grammar', variant: 'word_order', title: 'Build the sentence!', items: [
    { correctWords: ['The', 'day', 'ends.'], imageUrl: '/illustrations/2_1/page1.png' },
    { correctWords: ['I', 'see', 'the', 'moon.'], imageUrl: '/illustrations/2_1/page5.png' },
  ]},

  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/2_1/page1.png', label: 'The day ends. I sigh.', correctIndex: 0 },
    { imageUrl: '/illustrations/2_1/page2.png', label: 'We go out. It is night.', correctIndex: 1 },
    { imageUrl: '/illustrations/2_1/page3.png', label: 'See the lights! I can see!', correctIndex: 2 },
    { imageUrl: '/illustrations/2_1/page4.png', label: 'It is dim. I need a light.', correctIndex: 3 },
    { imageUrl: '/illustrations/2_1/page5.png', label: 'A light up high! The moon!', correctIndex: 4 },
    { imageUrl: '/illustrations/2_1/page6.png', label: 'Dad can see. I am sad.', correctIndex: 5 },
    { imageUrl: '/illustrations/2_1/page7.png', label: 'My cat! I see it! Yay!', correctIndex: 6 },
    { imageUrl: '/illustrations/2_1/page8.png', label: 'Day and night! I say Yay!', correctIndex: 7 },
  ]},

  { type: 'drawing', prompt: 'Draw Your Favourite Part' },
  { type: 'certificate', bookTitle: 'The Night Light' },
];

// ═══════════════════════════════════════════════════════════════════════════
// L2.2  —  Hot Food, Cool Moon  (Focus: ow, oo)
// Written 2026-07-22, replacing the original story for this slot. Rules it
// exists to honour — the replaced story broke all of them:
//   "ow" here is ONLY /oʊ/ (blow/snow/show); /aʊ/ (owl/cow/wow) is level 6.
//   3+ genuine words per target sound is enough — never pad lines with
//   sound-matching words, and check each one's level ("ar" is L2.3).
//   Setting is a lowkey window onto a community: a British street-food night
//   market, girl + mum from a white English revert family, both in hijab —
//   carried by the art, text universal.
// ═══════════════════════════════════════════════════════════════════════════

export const BOOK_L2_2_PAGES: InteractivePage[] = [
  { type: 'cover', title: 'Hot Food, Cool Moon', subtitle: 'Level 4 · Longer Sounds', imageUrl: '/illustrations/2_2/cover.png' },

  { type: 'sound_grid', focusSounds: ['ow', 'oo'], allSounds: L2_ALL_SOUNDS },

  { type: 'vocab_preview', words: [
    pw('food', 'food', ['f','oo','d']), pw('moon', 'moon', ['m','oo','n']),
    pw('wok', 'wok', ['w','o','k']), pw('bowl', 'bowl', ['b','ow','l']),
    pw('cool', 'cool', ['c','oo','l']), pw('too', 'too', ['t','oo']),
    pw('row', 'row', ['r','ow']), pw('low', 'low', ['l','ow']),
  ]},

  // Page 1
  { type: 'story', sentences: ['The sun dips low.', 'I go with my mum to get food.'],
    words: [
      tricky('The', 'the'), cvc('sun', 'sun'), pw('dips', 'dip', ['d','i','p','s']),
      pw('low.', 'low', ['l','ow']),
      tricky('I', 'I'), tricky('go', 'go'), pw('with', 'with', ['w','i','th']),
      tricky('my', 'my'), cvc('mum', 'mum'), tricky('to', 'to'),
      cvc('get', 'get'), pw('food.', 'food', ['f','oo','d']),
    ],
    imageUrl: '/illustrations/2_2/page1.png', audioUrl: '/sounds/sentences/L2_2_p1.mp3' },

  // Page 2
  { type: 'story', sentences: ['It is night.', 'Food shops in a row!', 'Yum!'],
    words: [
      pw('It', 'it', ['i','t']), tricky('is', 'is'), pw('night.', 'night', ['n','igh','t']),
      pw('Food', 'food', ['f','oo','d']), pw('shops', 'shop', ['sh','o','p','s']),
      pw('in', 'in', ['i','n']), tricky('a', 'a'), pw('row!', 'row', ['r','ow']),
      cvc('Yum!', 'yum'),
    ],
    imageUrl: '/illustrations/2_2/page2.png', audioUrl: '/sounds/sentences/L2_2_p2.mp3' },

  // Page 3
  { type: 'story', sentences: ['I see a man at a big wok.', 'Hiss! Pop! The food hops!'],
    words: [
      tricky('I', 'I'), pw('see', 'see', ['s','ee']), tricky('a', 'a'),
      cvc('man', 'man'), pw('at', 'at', ['a','t']), tricky('a', 'a'),
      cvc('big', 'big'), cvc('wok.', 'wok'),
      pw('Hiss!', 'hiss', ['h','i','ss']), cvc('Pop!', 'pop'),
      tricky('The', 'the'), pw('food', 'food', ['f','oo','d']),
      pw('hops!', 'hop', ['h','o','p','s']),
    ],
    imageUrl: '/illustrations/2_2/page3.png', audioUrl: '/sounds/sentences/L2_2_p3.mp3' },

  // Page 4
  { type: 'story', sentences: ['Mum gets me a bowl.', 'Ooh! It is too hot!'],
    words: [
      cvc('Mum', 'mum'), pw('gets', 'get', ['g','e','t','s']), tricky('me', 'me'),
      tricky('a', 'a'), pw('bowl.', 'bowl', ['b','ow','l']),
      pw('Ooh!', 'ooh', ['oo']), pw('It', 'it', ['i','t']), tricky('is', 'is'),
      pw('too', 'too', ['t','oo']), cvc('hot!', 'hot'),
    ],
    imageUrl: '/illustrations/2_2/page4.png', audioUrl: '/sounds/sentences/L2_2_p4.mp3' },

  // Page 5
  { type: 'story', sentences: ['I huff and puff on it.', 'Huff! Puff! This is no fun!'],
    words: [
      tricky('I', 'I'), pw('huff', 'huff', ['h','u','ff']),
      pw('and', 'and', ['a','n','d']), pw('puff', 'puff', ['p','u','ff']),
      pw('on', 'on', ['o','n']), pw('it.', 'it', ['i','t']),
      pw('Huff!', 'huff', ['h','u','ff']), pw('Puff!', 'puff', ['p','u','ff']),
      pw('This', 'this', ['th','i','s']), tricky('is', 'is'),
      tricky('no', 'no'), cvc('fun!', 'fun'),
    ],
    imageUrl: '/illustrations/2_2/page5.png', audioUrl: '/sounds/sentences/L2_2_p5.mp3' },

  // Page 6
  { type: 'story', sentences: ['Mum said, "Sit with me.', 'See the moon!"'],
    words: [
      cvc('Mum', 'mum'), tricky('said,', 'said'),
      cvc('"Sit', 'sit'), pw('with', 'with', ['w','i','th']), tricky('me.', 'me'),
      pw('See', 'see', ['s','ee']), tricky('the', 'the'),
      pw('moon!"', 'moon', ['m','oo','n']),
    ],
    imageUrl: '/illustrations/2_2/page6.png', audioUrl: '/sounds/sentences/L2_2_p6.mp3' },

  // Page 7
  { type: 'story', sentences: ['The moon is big and yellow!', 'Then I dig in. It is not hot!', 'Yum, yum, yum!'],
    words: [
      tricky('The', 'the'), pw('moon', 'moon', ['m','oo','n']), tricky('is', 'is'),
      cvc('big', 'big'), pw('and', 'and', ['a','n','d']),
      pw('yellow!', 'yellow', ['y','e','ll','ow']),
      pw('Then', 'then', ['th','e','n']), tricky('I', 'I'), cvc('dig', 'dig'),
      pw('in.', 'in', ['i','n']), pw('It', 'it', ['i','t']), tricky('is', 'is'),
      pw('not', 'not', ['n','o','t']), cvc('hot!', 'hot'),
      cvc('Yum,', 'yum'), cvc('yum,', 'yum'), cvc('yum!', 'yum'),
    ],
    imageUrl: '/illustrations/2_2/page7.png', audioUrl: '/sounds/sentences/L2_2_p7.mp3' },

  // Page 8
  { type: 'story', sentences: ['We sit low on the mat.', 'The night is cool.', 'I am with my mum. It is fun!'],
    words: [
      tricky('We', 'we'), cvc('sit', 'sit'), pw('low', 'low', ['l','ow']),
      pw('on', 'on', ['o','n']), tricky('the', 'the'), cvc('mat.', 'mat'),
      tricky('The', 'the'), pw('night', 'night', ['n','igh','t']), tricky('is', 'is'),
      pw('cool.', 'cool', ['c','oo','l']),
      tricky('I', 'I'), pw('am', 'am', ['a','m']), pw('with', 'with', ['w','i','th']),
      tricky('my', 'my'), cvc('mum.', 'mum'),
      pw('It', 'it', ['i','t']), tricky('is', 'is'), cvc('fun!', 'fun'),
    ],
    imageUrl: '/illustrations/2_2/page8.png', audioUrl: '/sounds/sentences/L2_2_p8.mp3' },

  { type: 'quiz', questions: [
    { question: 'What did the child go to get with Mum?',
      options: [{ label: 'food', isCorrect: true }, { label: 'a pet', isCorrect: false }, { label: 'a hat', isCorrect: false }] },
    { question: 'Why was the child sad?',
      options: [{ label: 'The food was too hot', isCorrect: true }, { label: 'The shop was shut', isCorrect: false }, { label: 'It began to rain', isCorrect: false }] },
    { question: 'What did Mum say to look at?',
      options: [{ label: 'the moon', isCorrect: true }, { label: 'the wok', isCorrect: false }, { label: 'a bus', isCorrect: false }] },
  ]},

  { type: 'sound_spotlight', sound: 'ow', items: [
    { word: 'show', imageUrl: '/images/words/show.png', focusIndex: 1 },
    { word: 'own', imageUrl: '/images/words/own.png', focusIndex: 0 },
    { word: 'row', imageUrl: '/images/words/row.png', focusIndex: 1 },
    { word: 'low', imageUrl: '/images/words/low.png', focusIndex: 1 },
  ]},
  { type: 'sound_spotlight', sound: 'oo', items: [
    { word: 'food', imageUrl: '/images/words/food.png', focusIndex: 1 },
    { word: 'moon', imageUrl: '/images/words/moon.png', focusIndex: 1 },
    { word: 'room', imageUrl: '/images/words/room.png', focusIndex: 1 },
    { word: 'cool', imageUrl: '/images/words/cool.png', focusIndex: 1 },
  ]},

  { type: 'word_reading', words: [
    pw('food', 'food', ['f','oo','d']), pw('moon', 'moon', ['m','oo','n']),
    pw('bowl', 'bowl', ['b','ow','l']), pw('low', 'low', ['l','ow']),
  ]},

  { type: 'tricky_words', words: [
    tricky('the', 'the'), tricky('I', 'I'), tricky('to', 'to'),
    tricky('me', 'me'), tricky('we', 'we'), tricky('said', 'said'),
  ]},

  { type: 'spelling', words: [
    { word: 'food', imageUrl: '/images/words/food.png', letters: ['f','oo','d'] },
    { word: 'moon', imageUrl: '/images/words/moon.png', letters: ['m','oo','n'] },
    { word: 'cool', imageUrl: '/images/words/cool.png', letters: ['c','oo','l'] },
    { word: 'low', imageUrl: '/images/words/low.png', letters: ['l','ow'] },
  ]},

  { type: 'nonsense_words', words: [
    pw('dow', 'dow', ['d','ow']), pw('jow', 'jow', ['j','ow']),
    pw('fow', 'fow', ['f','ow']), pw('zow', 'zow', ['z','ow']),
    pw('dool', 'dool', ['d','oo','l']), pw('toof', 'toof', ['t','oo','f']),
    pw('mool', 'mool', ['m','oo','l']), pw('joom', 'joom', ['j','oo','m']),
    pw('choom', 'choom', ['ch','oo','m']), pw('voot', 'voot', ['v','oo','t']),
    pw('foom', 'foom', ['f','oo','m']), pw('thook', 'thook', ['th','oo','k']),
  ]},

  { type: 'writing_practice', letters: ['ow', 'oo'] },

  { type: 'grammar', variant: 'word_order', title: 'Build the sentence!', items: [
    { correctWords: ['I', 'see', 'the', 'moon.'], imageUrl: '/illustrations/2_2/page7.png' },
    { correctWords: ['The', 'food', 'is', 'hot.'], imageUrl: '/illustrations/2_2/page4.png' },
  ]},

  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/2_2/page1.png', label: 'We go to get food.', correctIndex: 0 },
    { imageUrl: '/illustrations/2_2/page2.png', label: 'Food shops in a row!', correctIndex: 1 },
    { imageUrl: '/illustrations/2_2/page3.png', label: 'Hiss! Pop! A big wok!', correctIndex: 2 },
    { imageUrl: '/illustrations/2_2/page4.png', label: 'Ooh! It is too hot!', correctIndex: 3 },
    { imageUrl: '/illustrations/2_2/page5.png', label: 'Huff! Puff!', correctIndex: 4 },
    { imageUrl: '/illustrations/2_2/page6.png', label: 'Sit and see the moon.', correctIndex: 5 },
    { imageUrl: '/illustrations/2_2/page7.png', label: 'I dig in. Yum!', correctIndex: 6 },
    { imageUrl: '/illustrations/2_2/page8.png', label: 'The night is cool.', correctIndex: 7 },
  ]},

  { type: 'drawing', prompt: 'Draw Your Favourite Part' },
  { type: 'certificate', bookTitle: 'Hot Food, Cool Moon' },
];

// ═══════════════════════════════════════════════════════════════════════════
// L2.3  —  Morning on the Farm  (Focus: ar, or)
// ═══════════════════════════════════════════════════════════════════════════

export const BOOK_L2_3_PAGES: InteractivePage[] = [
  { type: 'cover', title: 'Morning on the Farm', subtitle: 'Level 4 · Longer Sounds', imageUrl: '/illustrations/2_3/cover.png' },

  { type: 'sound_grid', focusSounds: ['ar', 'or'], allSounds: L2_ALL_SOUNDS },

  { type: 'vocab_preview', words: [
    pw('farm', 'farm', ['f','ar','m']), pw('barn', 'barn', ['b','ar','n']),
    pw('corn', 'corn', ['c','or','n']), pw('torch', 'torch', ['t','or','ch']),
    pw('dark', 'dark', ['d','ar','k']), pw('morning', 'morning', ['m','or','n','i','ng']),
    pw('yard', 'yard', ['y','ar','d']), pw('fork', 'fork', ['f','or','k']),
  ]},

  // Page 1
  { type: 'story', sentences: ['We go far in the car.', 'I can see a farm!'],
    words: [
      tricky('We', 'we'), tricky('go', 'go'), pw('far', 'far', ['f','ar']),
      pw('in', 'in', ['i','n']), tricky('the', 'the'), pw('car.', 'car', ['c','ar']),
      tricky('I', 'I'), cvc('can', 'can'), pw('see', 'see', ['s','ee']),
      tricky('a', 'a'), pw('farm!', 'farm', ['f','ar','m']),
    ],
    imageUrl: '/illustrations/2_3/page1.png', audioUrl: '/sounds/sentences/L2_3_p1.mp3' },

  // Page 2
  { type: 'story', sentences: ['The farm is big!', 'I see a yard with corn in a jar.'],
    words: [
      tricky('The', 'the'), pw('farm', 'farm', ['f','ar','m']), tricky('is', 'is'),
      cvc('big!', 'big'),
      tricky('I', 'I'), pw('see', 'see', ['s','ee']), tricky('a', 'a'),
      pw('yard', 'yard', ['y','ar','d']),
      pw('with', 'with', ['w','i','th']), pw('corn', 'corn', ['c','or','n']),
      pw('in', 'in', ['i','n']), tricky('a', 'a'), pw('jar.', 'jar', ['j','ar']),
    ],
    imageUrl: '/illustrations/2_3/page2.png', audioUrl: '/sounds/sentences/L2_3_p2.mp3' },

  // Page 3
  { type: 'story', sentences: ['I get a fork for the garden.', 'I dig, dig, dig!', 'Good food for the farm.'],
    words: [
      tricky('I', 'I'), pw('get', 'get', ['g','e','t']), tricky('a', 'a'),
      pw('fork', 'fork', ['f','or','k']), pw('for', 'for', ['f','or']),
      tricky('the', 'the'), pw('garden.', 'garden', ['g','ar','d','e','n']),
      tricky('I', 'I'), cvc('dig,', 'dig'), cvc('dig,', 'dig'), cvc('dig!', 'dig'),
      pw('Good', 'good', ['g','oo','d']), pw('food', 'food', ['f','oo','d']),
      pw('for', 'for', ['f','or']), tricky('the', 'the'),
      pw('farm.', 'farm', ['f','ar','m']),
    ],
    imageUrl: '/illustrations/2_3/page3.png', audioUrl: '/sounds/sentences/L2_3_p3.mp3' },

  // Page 4
  { type: 'story', sentences: ['Now it is dark.', 'I look at the barn.', 'I need to look in the barn!'],
    words: [
      pw('Now', 'now', ['n','ow']), pw('it', 'it', ['i','t']), tricky('is', 'is'),
      pw('dark.', 'dark', ['d','ar','k']),
      tricky('I', 'I'), pw('look', 'look', ['l','oo','k']),
      pw('at', 'at', ['a','t']), tricky('the', 'the'), pw('barn.', 'barn', ['b','ar','n']),
      tricky('I', 'I'), pw('need', 'need', ['n','ee','d']), tricky('to', 'to'),
      pw('look', 'look', ['l','oo','k']), pw('in', 'in', ['i','n']),
      tricky('the', 'the'), pw('barn!', 'barn', ['b','ar','n']),
    ],
    imageUrl: '/illustrations/2_3/page4.png', audioUrl: '/sounds/sentences/L2_3_p4.mp3' },

  // Page 5
  { type: 'story', sentences: ['I get a torch for the dark.', 'I march to the big barn doors.'],
    words: [
      tricky('I', 'I'), pw('get', 'get', ['g','e','t']), tricky('a', 'a'),
      pw('torch', 'torch', ['t','or','ch']), pw('for', 'for', ['f','or']),
      tricky('the', 'the'), pw('dark.', 'dark', ['d','ar','k']),
      tricky('I', 'I'), pw('march', 'march', ['m','ar','ch']),
      tricky('to', 'to'), tricky('the', 'the'), cvc('big', 'big'),
      pw('barn', 'barn', ['b','ar','n']), pw('doors.', 'doors', ['d','oo','r','s']),
    ],
    imageUrl: '/illustrations/2_3/page5.png', audioUrl: '/sounds/sentences/L2_3_p5.mp3' },

  // Page 6
  { type: 'story', sentences: ['It is dark in the barn.', 'I look far into a pen.', 'I see a thing!'],
    words: [
      pw('It', 'it', ['i','t']), tricky('is', 'is'), pw('dark', 'dark', ['d','ar','k']),
      pw('in', 'in', ['i','n']), tricky('the', 'the'), pw('barn.', 'barn', ['b','ar','n']),
      tricky('I', 'I'), pw('look', 'look', ['l','oo','k']),
      pw('far', 'far', ['f','ar']), tricky('into', 'into'),
      tricky('a', 'a'), pw('pen.', 'pen', ['p','e','n']),
      tricky('I', 'I'), pw('see', 'see', ['s','ee']), tricky('a', 'a'),
      pw('thing!', 'thing', ['th','i','ng']),
    ],
    imageUrl: '/illustrations/2_3/page6.png', audioUrl: '/sounds/sentences/L2_3_p6.mp3' },

  // Page 7
  { type: 'story', sentences: ['A kid! Born this morning!', 'Her mum is with her.'],
    words: [
      tricky('A', 'a'), cvc('kid!', 'kid'), pw('Born', 'born', ['b','or','n']),
      pw('this', 'this', ['th','i','s']),
      pw('morning!', 'morning', ['m','or','n','i','ng']),
      tricky('Her', 'her'), cvc('mum', 'mum'), tricky('is', 'is'),
      pw('with', 'with', ['w','i','th']), tricky('her.', 'her'),
    ],
    imageUrl: '/illustrations/2_3/page7.png', audioUrl: '/sounds/sentences/L2_3_p7.mp3' },

  // Page 8
  { type: 'story', sentences: ['I hug the warm kid with my dad.', 'This farm is too good!', 'I wish I had a farm!'],
    words: [
      tricky('I', 'I'), cvc('hug', 'hug'), tricky('the', 'the'),
      pw('warm', 'warm', ['w','ar','m']), cvc('kid', 'kid'),
      pw('with', 'with', ['w','i','th']), tricky('my', 'my'), cvc('dad.', 'dad'),
      pw('This', 'this', ['th','i','s']), pw('farm', 'farm', ['f','ar','m']),
      tricky('is', 'is'), pw('too', 'too', ['t','oo']),
      pw('good!', 'good', ['g','oo','d']),
      tricky('I', 'I'), pw('wish', 'wish', ['w','i','sh']),
      tricky('I', 'I'), pw('had', 'had', ['h','a','d']),
      tricky('a', 'a'), pw('farm!', 'farm', ['f','ar','m']),
    ],
    imageUrl: '/illustrations/2_3/page8.png', audioUrl: '/sounds/sentences/L2_3_p8.mp3' },

  { type: 'quiz', questions: [
    { question: 'What did the child find in the barn?',
      options: [{ label: 'a baby goat', isCorrect: true }, { label: 'a cat', isCorrect: false }, { label: 'an owl', isCorrect: false }] },
    { question: 'What did the child dig with?',
      options: [{ label: 'a fork', isCorrect: true }, { label: 'a stick', isCorrect: false }, { label: 'a mop', isCorrect: false }] },
    { question: 'Why did the child need a torch?',
      options: [{ label: 'it was dark', isCorrect: true }, { label: 'it was raining', isCorrect: false }, { label: 'it was far', isCorrect: false }] },
  ]},

  { type: 'sound_spotlight', sound: 'ar', items: [
    { word: 'farm', imageUrl: '/images/words/farm.png', focusIndex: 1 },
    { word: 'park', imageUrl: '/images/words/park.png', focusIndex: 1 },
    { word: 'car', imageUrl: '/images/words/car.png', focusIndex: 1 },
    { word: 'smart', imageUrl: '/images/words/smart.png', focusIndex: 2 },
  ]},
  { type: 'sound_spotlight', sound: 'or', items: [
    { word: 'fork', imageUrl: '/images/words/fork.png', focusIndex: 1 },
    { word: 'corn', imageUrl: '/images/words/corn.png', focusIndex: 1 },
    { word: 'more', imageUrl: '/images/words/more.png', focusIndex: 1 },
    { word: 'shore', imageUrl: '/images/words/shore.png', focusIndex: 2 },
  ]},

  { type: 'word_reading', words: [
    pw('farm', 'farm', ['f','ar','m']), pw('barn', 'barn', ['b','ar','n']),
    pw('torch', 'torch', ['t','or','ch']), pw('morning', 'morning', ['m','or','n','i','ng']),
    pw('dark', 'dark', ['d','ar','k']), pw('corn', 'corn', ['c','or','n']),
  ]},

  { type: 'tricky_words', words: [
    tricky('the', 'the'), tricky('I', 'I'), tricky('we', 'we'),
    tricky('go', 'go'), tricky('a', 'a'), tricky('her', 'her'),
  ]},

  { type: 'spelling', words: [
    { word: 'farm', imageUrl: '/images/words/farm.png', letters: ['f','ar','m'] },
    { word: 'barn', imageUrl: '/images/words/barn.png', letters: ['b','ar','n'] },
    { word: 'corn', imageUrl: '/images/words/corn.png', letters: ['c','or','n'] },
    { word: 'fork', imageUrl: '/images/words/fork.png', letters: ['f','or','k'] },
  ]},

  { type: 'nonsense_words', words: [
    pw('zar', 'zar', ['z','ar']), pw('thar', 'thar', ['th','ar']),
    pw('shar', 'shar', ['sh','ar']), pw('yark', 'yark', ['y','ar','k']),
    pw('jarn', 'jarn', ['j','ar','n']), pw('varm', 'varm', ['v','ar','m']),
    pw('zor', 'zor', ['z','or']), pw('jork', 'jork', ['j','or','k']),
    pw('dorn', 'dorn', ['d','or','n']), pw('gorch', 'gorch', ['g','or','ch']),
    pw('thort', 'thort', ['th','or','t']), pw('vorn', 'vorn', ['v','or','n']),
  ]},

  { type: 'writing_practice', letters: ['ar', 'or'] },

  { type: 'grammar', variant: 'word_order', title: 'Build the sentence!', items: [
    { correctWords: ['We', 'go', 'to', 'the', 'farm.'], imageUrl: '/illustrations/2_3/page1.png' },
    { correctWords: ['I', 'hug', 'the', 'kid.'], imageUrl: '/illustrations/2_3/page8.png' },
  ]},

  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/2_3/page1.png', label: 'We go far to a farm.', correctIndex: 0 },
    { imageUrl: '/illustrations/2_3/page2.png', label: 'A yard with corn.', correctIndex: 1 },
    { imageUrl: '/illustrations/2_3/page3.png', label: 'I dig with a fork.', correctIndex: 2 },
    { imageUrl: '/illustrations/2_3/page4.png', label: 'Now it is dark.', correctIndex: 3 },
    { imageUrl: '/illustrations/2_3/page5.png', label: 'I get a torch.', correctIndex: 4 },
    { imageUrl: '/illustrations/2_3/page6.png', label: 'I see a thing!', correctIndex: 5 },
    { imageUrl: '/illustrations/2_3/page7.png', label: 'A kid! Born today!', correctIndex: 6 },
    { imageUrl: '/illustrations/2_3/page8.png', label: 'I hug the warm kid.', correctIndex: 7 },
  ]},

  { type: 'drawing', prompt: 'Draw Your Favourite Part' },
  { type: 'certificate', bookTitle: 'Morning on the Farm' },
];

// ═══════════════════════════════════════════════════════════════════════════
// L2.4  —  The Fair in the Air  (Focus: air, ir)
// ═══════════════════════════════════════════════════════════════════════════

export const BOOK_L2_4_PAGES: InteractivePage[] = [
  { type: 'cover', title: 'The Fair in the Air', subtitle: 'Level 4 · Longer Sounds', imageUrl: '/illustrations/2_4/cover.png' },

  { type: 'sound_grid', focusSounds: ['air', 'ir'], allSounds: L2_ALL_SOUNDS },

  { type: 'vocab_preview', words: [
    pw('fair', 'fair', ['f','air']), pw('air', 'air', ['air']),
    pw('pair', 'pair', ['p','air']), pw('hair', 'hair', ['h','air']),
    pw('sir', 'sir', ['s','ir']), pw('fir', 'fir', ['f','ir']),
    pw('chair', 'chair', ['ch','air']), pw('stir', 'stir', ['s','t','ir']),
  ]},

  // Page 1
    { type: 'story', sentences: ['I go to the fair.', 'The fair is so big!', 'The air is cool on my chin.'],
    words: [
      tricky('I', 'I'),
      tricky('go', 'go'),
      tricky('to', 'to'),
      tricky('the', 'the'),
      pw('fair.', 'fair', ['f', 'air']),
      tricky('The', 'the'),
      pw('fair', 'fair', ['f', 'air']),
      tricky('is', 'is'),
      cvc('so', 'so'),
      cvc('big!', 'big'),
      tricky('The', 'the'),
      pw('air', 'air', ['air']),
      tricky('is', 'is'),
      pw('cool', 'cool', ['c', 'oo', 'l']),
      cvc('on', 'on'),
      cvc('my', 'my'),
      pw('chin.', 'chin', ['ch', 'i', 'n']),
    ],
    imageUrl: '/illustrations/2_4/page1.png', audioUrl: '/sounds/sentences/L2_4_p1.mp3' },
  { type: 'story', sentences: ['A big wind swirls in.', 'It picks up my hair!', 'My hair is up in the air!'],
    words: [
      tricky('A', 'a'),
      cvc('big', 'big'),
      cvc('wind', 'wind'),
      pw('swirls', 'swirls', ['s', 'w', 'ir', 'l', 's']),
      cvc('in.', 'in'),
      cvc('It', 'it'),
      pw('picks', 'picks', ['p', 'i', 'ck', 's']),
      cvc('up', 'up'),
      cvc('my', 'my'),
      pw('hair!', 'hair', ['h', 'air']),
      cvc('My', 'my'),
      pw('hair', 'hair', ['h', 'air']),
      tricky('is', 'is'),
      cvc('up', 'up'),
      cvc('in', 'in'),
      tricky('the', 'the'),
      pw('air!', 'air', ['air']),
    ],
    imageUrl: '/illustrations/2_4/page2.png', audioUrl: '/sounds/sentences/L2_4_p2.mp3' },
  { type: 'story', sentences: ['I stop at a stand.', 'A pair of ducks!', 'The man says I can win the pair.'],
    words: [
      tricky('I', 'I'),
      cvc('stop', 'stop'),
      cvc('at', 'at'),
      tricky('a', 'a'),
      cvc('stand.', 'stand'),
      tricky('A', 'a'),
      pw('pair', 'pair', ['p', 'air']),
      tricky('of', 'of'),
      pw('ducks!', 'ducks', ['d', 'u', 'ck', 's']),
      tricky('The', 'the'),
      cvc('man', 'man'),
      pw('says', 'says', ['s', 'ay', 's']),
      tricky('I', 'I'),
      cvc('can', 'can'),
      cvc('win', 'win'),
      tricky('the', 'the'),
      pw('pair.', 'pair', ['p', 'air']),
    ],
    imageUrl: '/illustrations/2_4/page3.png', audioUrl: '/sounds/sentences/L2_4_p3.mp3' },
  { type: 'story', sentences: ['I win!', 'I win the pair!', 'I jump up high and the man claps for me.'],
    words: [
      tricky('I', 'I'),
      cvc('win!', 'win'),
      tricky('I', 'I'),
      cvc('win', 'win'),
      tricky('the', 'the'),
      pw('pair!', 'pair', ['p', 'air']),
      tricky('I', 'I'),
      cvc('jump', 'jump'),
      cvc('up', 'up'),
      pw('high', 'high', ['h', 'igh']),
      cvc('and', 'and'),
      tricky('the', 'the'),
      cvc('man', 'man'),
      cvc('claps', 'claps'),
      pw('for', 'for', ['f', 'or']),
      cvc('me.', 'me'),
    ],
    imageUrl: '/illustrations/2_4/page4.png', audioUrl: '/sounds/sentences/L2_4_p4.mp3' },
  { type: 'story', sentences: ['But the wind swirls back!', 'It lifts my pair up into the air.', 'No, no!', 'My pair!'],
    words: [
      cvc('But', 'but'),
      tricky('the', 'the'),
      cvc('wind', 'wind'),
      pw('swirls', 'swirls', ['s', 'w', 'ir', 'l', 's']),
      pw('back!', 'back', ['b', 'a', 'ck']),
      cvc('It', 'it'),
      cvc('lifts', 'lifts'),
      cvc('my', 'my'),
      pw('pair', 'pair', ['p', 'air']),
      cvc('up', 'up'),
      tricky('into', 'into'),
      tricky('the', 'the'),
      pw('air.', 'air', ['air']),
      tricky('No,', 'no'),
      tricky('no!', 'no'),
      cvc('My', 'my'),
      pw('pair!', 'pair', ['p', 'air']),
    ],
    imageUrl: '/illustrations/2_4/page5.png', audioUrl: '/sounds/sentences/L2_4_p5.mp3' },
  { type: 'story', sentences: ['My pair lands up in a fir tree.', 'I run to the man.', '"Sir!', 'Sir!', 'My pair is in the fir!"'],
    words: [
      cvc('My', 'my'),
      pw('pair', 'pair', ['p', 'air']),
      cvc('lands', 'lands'),
      cvc('up', 'up'),
      cvc('in', 'in'),
      tricky('a', 'a'),
      pw('fir', 'fir', ['f', 'ir']),
      pw('tree.', 'tree', ['t', 'r', 'ee']),
      tricky('I', 'I'),
      cvc('run', 'run'),
      tricky('to', 'to'),
      tricky('the', 'the'),
      cvc('man.', 'man'),
      pw('"Sir!', 'sir', ['s', 'ir']),
      pw('Sir!', 'sir', ['s', 'ir']),
      cvc('My', 'my'),
      pw('pair', 'pair', ['p', 'air']),
      tricky('is', 'is'),
      cvc('in', 'in'),
      tricky('the', 'the'),
      pw('fir!"', 'fir', ['f', 'ir']),
    ],
    imageUrl: '/illustrations/2_4/page6.png', audioUrl: '/sounds/sentences/L2_4_p6.mp3' },
  { type: 'story', sentences: ['The man is quick.', 'Up the fir he goes!', 'He gets my pair from the top.'],
    words: [
      tricky('The', 'the'),
      cvc('man', 'man'),
      tricky('is', 'is'),
      pw('quick.', 'quick', ['qu', 'i', 'ck']),
      cvc('Up', 'up'),
      tricky('the', 'the'),
      pw('fir', 'fir', ['f', 'ir']),
      cvc('he', 'he'),
      pw('goes!', 'goes', ['g', 'oe', 's']),
      cvc('He', 'he'),
      cvc('gets', 'gets'),
      cvc('my', 'my'),
      pw('pair', 'pair', ['p', 'air']),
      cvc('from', 'from'),
      tricky('the', 'the'),
      cvc('top.', 'top'),
    ],
    imageUrl: '/illustrations/2_4/page7.png', audioUrl: '/sounds/sentences/L2_4_p7.mp3' },
  { type: 'story', sentences: ['The wind is soft.', 'I sit in a chair with my pair.', 'It is the best day at the fair!'],
    words: [
      tricky('The', 'the'),
      cvc('wind', 'wind'),
      tricky('is', 'is'),
      cvc('soft.', 'soft'),
      tricky('I', 'I'),
      cvc('sit', 'sit'),
      cvc('in', 'in'),
      tricky('a', 'a'),
      pw('chair', 'chair', ['ch', 'air']),
      pw('with', 'with', ['w', 'i', 'th']),
      cvc('my', 'my'),
      pw('pair.', 'pair', ['p', 'air']),
      cvc('It', 'it'),
      tricky('is', 'is'),
      tricky('the', 'the'),
      cvc('best', 'best'),
      pw('day', 'day', ['d', 'ay']),
      cvc('at', 'at'),
      tricky('the', 'the'),
      pw('fair!', 'fair', ['f', 'air']),
    ],
    imageUrl: '/illustrations/2_4/page8.png', audioUrl: '/sounds/sentences/L2_4_p8.mp3' },

  { type: 'quiz', questions: [
    { question: 'What did the child win at the fair?',
      options: [{ label: 'a pair of toy ducks', isCorrect: true }, { label: 'a hat', isCorrect: false }, { label: 'a ball', isCorrect: false }] },
    { question: 'Why did the pair go up in the air?',
      options: [{ label: 'a gush of wind', isCorrect: true }, { label: 'a bird took it', isCorrect: false }, { label: 'it fell off', isCorrect: false }] },
    { question: 'Where did the pair land?',
      options: [{ label: 'in a fir tree', isCorrect: true }, { label: 'on the roof', isCorrect: false }, { label: 'in a pool', isCorrect: false }] },
  ]},

  { type: 'sound_spotlight', sound: 'air', items: [
    { word: 'fair', imageUrl: '/images/words/fair.png', focusIndex: 1 },
    { word: 'hair', imageUrl: '/images/words/hair.png', focusIndex: 1 },
    { word: 'chair', imageUrl: '/images/words/chair.png', focusIndex: 2 },
    { word: 'pair', imageUrl: '/images/words/pair.png', focusIndex: 1 },
  ]},
  { type: 'sound_spotlight', sound: 'ir', items: [
    { word: 'sir', imageUrl: '/images/words/sir.png', focusIndex: 1 },
    { word: 'fir', imageUrl: '/images/words/fir.png', focusIndex: 1 },
    { word: 'stir', imageUrl: '/images/words/stir.png', focusIndex: 2 },
    { word: 'bird', imageUrl: '/images/words/bird.png', focusIndex: 1 },
  ]},

  { type: 'word_reading', words: [
    pw('fair', 'fair', ['f','air']), pw('pair', 'pair', ['p','air']),
    pw('chair', 'chair', ['ch','air']), pw('fir', 'fir', ['f','ir']),
  ]},

  { type: 'tricky_words', words: [
    tricky('the', 'the'), tricky('I', 'I'), tricky('my', 'my'),
    tricky('to', 'to'), tricky('no', 'no'), tricky('said', 'said'),
  ]},

  { type: 'spelling', words: [
    { word: 'fair', imageUrl: '/images/words/fair.png', letters: ['f','air'] },
    { word: 'pair', imageUrl: '/images/words/pair.png', letters: ['p','air'] },
    { word: 'sir', imageUrl: '/images/words/sir.png', letters: ['s','ir'] },
    { word: 'fir', imageUrl: '/images/words/fir.png', letters: ['f','ir'] },
  ]},

  { type: 'nonsense_words', words: [
    pw('dair', 'dair', ['d','air']), pw('jair', 'jair', ['j','air']),
    pw('lair', 'lair', ['l','air']), pw('tair', 'tair', ['t','air']),
    pw('gir', 'gir', ['g','ir']), pw('nir', 'nir', ['n','ir']),
    pw('dir', 'dir', ['d','ir']), pw('bir', 'bir', ['b','ir']),
    pw('mair', 'mair', ['m','air']), pw('vair', 'vair', ['v','air']),
    pw('zair', 'zair', ['z','air']), pw('chir', 'chir', ['ch','ir']),
  ]},

  { type: 'writing_practice', letters: ['air', 'ir'] },

  { type: 'grammar', variant: 'word_order', title: 'Build the sentence!', items: [
    { correctWords: ['I', 'go', 'to', 'the', 'fair.'], imageUrl: '/illustrations/2_4/page1.png' },
    { correctWords: ['I', 'win', 'a', 'pair.'], imageUrl: '/illustrations/2_4/page4.png' },
  ]},

  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/2_4/page1.png', label: 'I go to the fair!', correctIndex: 0 },
    { imageUrl: '/illustrations/2_4/page2.png', label: 'Wind in my hair!', correctIndex: 1 },
    { imageUrl: '/illustrations/2_4/page3.png', label: 'I can win a pair!', correctIndex: 2 },
    { imageUrl: '/illustrations/2_4/page4.png', label: 'I win the pair!', correctIndex: 3 },
    { imageUrl: '/illustrations/2_4/page5.png', label: 'My pair shoots up!', correctIndex: 4 },
    { imageUrl: '/illustrations/2_4/page6.png', label: 'Sir! My pair!', correctIndex: 5 },
    { imageUrl: '/illustrations/2_4/page7.png', label: 'Pair in the fir tree.', correctIndex: 6 },
    { imageUrl: '/illustrations/2_4/page8.png', label: 'I sit in a chair.', correctIndex: 7 },
  ]},

  { type: 'drawing', prompt: 'Draw Your Favourite Part' },
  { type: 'certificate', bookTitle: 'The Fair in the Air' },
];

// ═══════════════════════════════════════════════════════════════════════════
// L2.5  —  Round and Round  (Focus: ou, oy)
// ═══════════════════════════════════════════════════════════════════════════

export const BOOK_L2_5_PAGES: InteractivePage[] = [
  { type: 'cover', title: 'Round and Round', subtitle: 'Level 4 · Longer Sounds', imageUrl: '/illustrations/2_5/cover.png' },

  { type: 'sound_grid', focusSounds: ['ou', 'oy'], allSounds: L2_ALL_SOUNDS },

  { type: 'vocab_preview', words: [
    pw('round', 'round', ['r','ou','n','d']), pw('loud', 'loud', ['l','ou','d']),
    pw('out', 'out', ['ou','t']), pw('shout', 'shout', ['sh','ou','t']),
    pw('found', 'found', ['f','ou','n','d']), pw('toy', 'toy', ['t','oy']),
    pw('joy', 'joy', ['j','oy']), pw('boy', 'boy', ['b','oy']),
  ]},

  // Page 1
    { type: 'story', sentences: ['I went out with my toy car.', 'I zoomed it round and round.', 'Zoom!', 'Zoom!'],
    words: [
      tricky('I', 'I'),
      cvc('went', 'went'),
      pw('out', 'out', ['ou', 't']),
      pw('with', 'with', ['w', 'i', 'th']),
      cvc('my', 'my'),
      pw('toy', 'toy', ['t', 'oy']),
      pw('car.', 'car', ['c', 'ar']),
      tricky('I', 'I'),
      pw('zoomed', 'zoomed', ['z', 'oo', 'm', 'ed']),
      cvc('it', 'it'),
      pw('round', 'round', ['r', 'ou', 'n', 'd']),
      cvc('and', 'and'),
      pw('round.', 'round', ['r', 'ou', 'n', 'd']),
      pw('Zoom!', 'zoom', ['z', 'oo', 'm']),
      pw('Zoom!', 'zoom', ['z', 'oo', 'm']),
    ],
    imageUrl: '/illustrations/2_5/page1.png', audioUrl: '/sounds/sentences/L2_5_p1.mp3' },
  { type: 'story', sentences: ['I zoomed it far down the path.', 'Round and round!', 'It got loud!'],
    words: [
      tricky('I', 'I'),
      pw('zoomed', 'zoomed', ['z', 'oo', 'm', 'ed']),
      cvc('it', 'it'),
      pw('far', 'far', ['f', 'ar']),
      pw('down', 'down', ['d', 'ow', 'n']),
      tricky('the', 'the'),
      pw('path.', 'path', ['p', 'a', 'th']),
      pw('Round', 'round', ['r', 'ou', 'n', 'd']),
      cvc('and', 'and'),
      pw('round!', 'round', ['r', 'ou', 'n', 'd']),
      cvc('It', 'it'),
      cvc('got', 'got'),
      pw('loud!', 'loud', ['l', 'ou', 'd']),
    ],
    imageUrl: '/illustrations/2_5/page2.png', audioUrl: '/sounds/sentences/L2_5_p2.mp3' },
  { type: 'story', sentences: ['But it ran too far!', 'My toy!', 'I looked around and around.', 'I can\'t see it!'],
    words: [
      cvc('But', 'but'),
      cvc('it', 'it'),
      cvc('ran', 'ran'),
      pw('too', 'too', ['t', 'oo']),
      pw('far!', 'far', ['f', 'ar']),
      cvc('My', 'my'),
      pw('toy!', 'toy', ['t', 'oy']),
      tricky('I', 'I'),
      pw('looked', 'looked', ['l', 'oo', 'k', 'ed']),
      pw('around', 'around', ['ar', 'ou', 'n', 'd']),
      cvc('and', 'and'),
      pw('around.', 'around', ['ar', 'ou', 'n', 'd']),
      tricky('I', 'I'),
      cvc('can\'t', 'cant'),
      pw('see', 'see', ['s', 'ee']),
      cvc('it!', 'it'),
    ],
    imageUrl: '/illustrations/2_5/page3.png', audioUrl: '/sounds/sentences/L2_5_p3.mp3' },
  { type: 'story', sentences: ['I shouted out loud.', '"Mum!', 'I need you!', 'I can\'t see my toy!"'],
    words: [
      tricky('I', 'I'),
      pw('shouted', 'shouted', ['sh', 'ou', 't', 'ed']),
      pw('out', 'out', ['ou', 't']),
      pw('loud.', 'loud', ['l', 'ou', 'd']),
      cvc('"Mum!', 'mum'),
      tricky('I', 'I'),
      pw('need', 'need', ['n', 'ee', 'd']),
      pw('you!', 'you', ['y', 'ou']),
      tricky('I', 'I'),
      cvc('can\'t', 'cant'),
      pw('see', 'see', ['s', 'ee']),
      cvc('my', 'my'),
      pw('toy!"', 'toy', ['t', 'oy']),
    ],
    imageUrl: '/illustrations/2_5/page4.png', audioUrl: '/sounds/sentences/L2_5_p4.mp3' },
  { type: 'story', sentences: ['Mum ran out to me.', '"I will look around and around," she said.'],
    words: [
      cvc('Mum', 'mum'),
      cvc('ran', 'ran'),
      pw('out', 'out', ['ou', 't']),
      tricky('to', 'to'),
      cvc('me.', 'me'),
      tricky('"I', 'I'),
      pw('will', 'will', ['w', 'i', 'll']),
      pw('look', 'look', ['l', 'oo', 'k']),
      pw('around', 'around', ['ar', 'ou', 'n', 'd']),
      cvc('and', 'and'),
      pw('around,"', 'around', ['ar', 'ou', 'n', 'd']),
      pw('she', 'she', ['sh', 'e']),
      pw('said.', 'said', ['s', 'ai', 'd']),
    ],
    imageUrl: '/illustrations/2_5/page5.png', audioUrl: '/sounds/sentences/L2_5_p5.mp3' },
  { type: 'story', sentences: ['We looked around the big rock.', 'No toy!', 'We looked around the shed.', 'No toy!'],
    words: [
      cvc('We', 'we'),
      pw('looked', 'looked', ['l', 'oo', 'k', 'ed']),
      pw('around', 'around', ['ar', 'ou', 'n', 'd']),
      tricky('the', 'the'),
      cvc('big', 'big'),
      pw('rock.', 'rock', ['r', 'o', 'ck']),
      tricky('No', 'no'),
      pw('toy!', 'toy', ['t', 'oy']),
      cvc('We', 'we'),
      pw('looked', 'looked', ['l', 'oo', 'k', 'ed']),
      pw('around', 'around', ['ar', 'ou', 'n', 'd']),
      tricky('the', 'the'),
      pw('shed.', 'shed', ['sh', 'ed']),
      tricky('No', 'no'),
      pw('toy!', 'toy', ['t', 'oy']),
    ],
    imageUrl: '/illustrations/2_5/page6.png', audioUrl: '/sounds/sentences/L2_5_p6.mp3' },
  { type: 'story', sentences: ['"Look!" said Mum.', '"I found it!" My toy!', 'Joy!', 'Joy!', 'I shouted out loud!'],
    words: [
      pw('"Look!"', 'look', ['l', 'oo', 'k']),
      pw('said', 'said', ['s', 'ai', 'd']),
      cvc('Mum.', 'mum'),
      tricky('"I', 'I'),
      pw('found', 'found', ['f', 'ou', 'n', 'd']),
      cvc('it!"', 'it'),
      cvc('My', 'my'),
      pw('toy!', 'toy', ['t', 'oy']),
      pw('Joy!', 'joy', ['j', 'oy']),
      pw('Joy!', 'joy', ['j', 'oy']),
      tricky('I', 'I'),
      pw('shouted', 'shouted', ['sh', 'ou', 't', 'ed']),
      pw('out', 'out', ['ou', 't']),
      pw('loud!', 'loud', ['l', 'ou', 'd']),
    ],
    imageUrl: '/illustrations/2_5/page7.png', audioUrl: '/sounds/sentences/L2_5_p7.mp3' },
  { type: 'story', sentences: ['I hugged my toy and I hugged Mum.', '"Thank you!" I said.', 'We went in.'],
    words: [
      tricky('I', 'I'),
      pw('hugged', 'hugged', ['h', 'u', 'gg', 'ed']),
      cvc('my', 'my'),
      pw('toy', 'toy', ['t', 'oy']),
      cvc('and', 'and'),
      tricky('I', 'I'),
      pw('hugged', 'hugged', ['h', 'u', 'gg', 'ed']),
      cvc('Mum.', 'mum'),
      pw('"Thank', 'thank', ['th', 'a', 'nk']),
      pw('you!"', 'you', ['y', 'ou']),
      tricky('I', 'I'),
      pw('said.', 'said', ['s', 'ai', 'd']),
      cvc('We', 'we'),
      cvc('went', 'went'),
      cvc('in.', 'in'),
    ],
    imageUrl: '/illustrations/2_5/page8.png', audioUrl: '/sounds/sentences/L2_5_p8.mp3' },

  { type: 'quiz', questions: [
    { question: 'What happened to the toy car?',
      options: [{ label: 'it ran too far', isCorrect: true }, { label: 'it broke', isCorrect: false }, { label: 'a dog took it', isCorrect: false }] },
    { question: 'Why did the child shout for Mum?',
      options: [{ label: 'could not find the toy', isCorrect: true }, { label: 'was hurt', isCorrect: false }, { label: 'was hungry', isCorrect: false }] },
    { question: 'Who found the toy?',
      options: [{ label: 'Mum', isCorrect: true }, { label: 'Dad', isCorrect: false }, { label: 'the child', isCorrect: false }] },
  ]},

  { type: 'sound_spotlight', sound: 'ou', items: [
    { word: 'out', imageUrl: '/images/words/out.png', focusIndex: 0 },
    { word: 'loud', imageUrl: '/images/words/loud.png', focusIndex: 1 },
    { word: 'round', imageUrl: '/images/words/round.png', focusIndex: 1 },
    { word: 'shout', imageUrl: '/images/words/shout.png', focusIndex: 2 },
  ]},
  { type: 'sound_spotlight', sound: 'oy', items: [
    { word: 'toy', imageUrl: '/images/words/toy.png', focusIndex: 1 },
    { word: 'joy', imageUrl: '/images/words/joy.png', focusIndex: 1 },
    { word: 'boy', imageUrl: '/images/words/boy.png', focusIndex: 1 },
    { word: 'enjoy', imageUrl: '/images/words/enjoy.png', focusIndex: 3 },
  ]},

  { type: 'word_reading', words: [
    pw('out', 'out', ['ou','t']), pw('shout', 'shout', ['sh','ou','t']),
    pw('round', 'round', ['r','ou','n','d']), pw('toy', 'toy', ['t','oy']),
  ]},

  { type: 'tricky_words', words: [
    tricky('I', 'I'), tricky('my', 'my'), tricky('we', 'we'),
    tricky('she', 'she'), tricky('said', 'said'), tricky('you', 'you'), tricky('to', 'to'),
  ]},

  { type: 'spelling', words: [
    { word: 'out', imageUrl: '/images/words/out.png', letters: ['ou','t'] },
    { word: 'loud', imageUrl: '/images/words/loud.png', letters: ['l','ou','d'] },
    { word: 'toy', imageUrl: '/images/words/toy.png', letters: ['t','oy'] },
    { word: 'joy', imageUrl: '/images/words/joy.png', letters: ['j','oy'] },
  ]},

  { type: 'nonsense_words', words: [
    pw('mout', 'mout', ['m','ou','t']), pw('gound', 'gound', ['g','ou','n','d']),
    pw('fout', 'fout', ['f','ou','t']), pw('dound', 'dound', ['d','ou','n','d']),
    pw('loy', 'loy', ['l','oy']), pw('noy', 'noy', ['n','oy']),
    pw('voy', 'voy', ['v','oy']), pw('foy', 'foy', ['f','oy']),
    pw('chouch', 'chouch', ['ch','ou','ch']), pw('moush', 'moush', ['m','ou','sh']),
    pw('gouk', 'gouk', ['g','ou','k']), pw('noump', 'noump', ['n','ou','m','p']),
  ]},

  { type: 'writing_practice', letters: ['ou', 'oy'] },

  { type: 'grammar', variant: 'word_order', title: 'Build the sentence!', items: [
    { correctWords: ['The', 'toy', 'is', 'loud.'], imageUrl: '/illustrations/2_5/page2.png' },
    { correctWords: ['Mum', 'found', 'my', 'toy.'], imageUrl: '/illustrations/2_5/page7.png' },
  ]},

  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/2_5/page1.png', label: 'Zoom! Round and round!', correctIndex: 0 },
    { imageUrl: '/illustrations/2_5/page2.png', label: 'It got loud!', correctIndex: 1 },
    { imageUrl: '/illustrations/2_5/page3.png', label: 'It ran too far!', correctIndex: 2 },
    { imageUrl: '/illustrations/2_5/page4.png', label: 'I shouted out loud.', correctIndex: 3 },
    { imageUrl: '/illustrations/2_5/page5.png', label: 'Mum will look around.', correctIndex: 4 },
    { imageUrl: '/illustrations/2_5/page6.png', label: 'No toy! No toy!', correctIndex: 5 },
    { imageUrl: '/illustrations/2_5/page7.png', label: 'Mum found it! Joy!', correctIndex: 6 },
    { imageUrl: '/illustrations/2_5/page8.png', label: 'Thank you, Mum!', correctIndex: 7 },
  ]},

  { type: 'drawing', prompt: 'Draw Your Favourite Part' },
  { type: 'certificate', bookTitle: 'Round and Round' },
];

// ═══════════════════════════════════════════════════════════════════════════
// L2.6  —  The Night Fair  (Review: all L2 sounds)
// ═══════════════════════════════════════════════════════════════════════════

export const BOOK_L2_6_PAGES: InteractivePage[] = [
  { type: 'cover', title: 'The Night Fair', subtitle: 'Level 4 · Review', imageUrl: '/illustrations/2_6/cover.png' },

  { type: 'sound_grid', focusSounds: ['ay', 'ee', 'igh', 'ow', 'oo', 'ar', 'or', 'air', 'ir', 'ou', 'oy'], allSounds: L2_ALL_SOUNDS },

  { type: 'vocab_preview', words: [
    pw('night', 'night', ['n','igh','t']), pw('bright', 'bright', ['b','r','igh','t']),
    pw('lamps', 'lamps', ['l','a','m','p','s']), pw('drum', 'drum', ['d','r','u','m']),
    pw('food', 'food', ['f','oo','d']), pw('spoon', 'spoon', ['s','p','oo','n']),
    pw('toy', 'toy', ['t','oy']), pw('bird', 'bird', ['b','ir','d']),
    pw('stool', 'stool', ['s','t','oo','l']), pw('stars', 'stars', ['s','t','ar','s']),
    pw('moon', 'moon', ['m','oo','n']), pw('round', 'round', ['r','ou','n','d']),
  ]},

  // Page 1 — girl and mum enter the souq at night
    { type: 'story', sentences: ['It is night!', 'We go to the souq.', 'The lights up high are so bright!'],
    words: [
      cvc('It', 'it'),
      tricky('is', 'is'),
      pw('night!', 'night', ['n', 'igh', 't']),
      cvc('We', 'we'),
      tricky('go', 'go'),
      tricky('to', 'to'),
      tricky('the', 'the'),
      pw('souq.', 'souq', ['s', 'ou', 'q']),
      tricky('The', 'the'),
      pw('lights', 'lights', ['l', 'igh', 't', 's']),
      cvc('up', 'up'),
      pw('high', 'high', ['h', 'igh']),
      pw('are', 'are', ['are']),
      cvc('so', 'so'),
      pw('bright!', 'bright', ['b', 'r', 'igh', 't']),
    ],
    imageUrl: '/illustrations/2_6/page1.png', audioUrl: '/sounds/sentences/L2_6_p1.mp3' },
  { type: 'story', sentences: ['I see lots of lamps.', 'Each one is so cool!', 'I feel such joy.'],
    words: [
      tricky('I', 'I'),
      pw('see', 'see', ['s', 'ee']),
      cvc('lots', 'lots'),
      tricky('of', 'of'),
      cvc('lamps.', 'lamps'),
      pw('Each', 'each', ['ea', 'ch']),
      cvc('one', 'one'),
      tricky('is', 'is'),
      cvc('so', 'so'),
      pw('cool!', 'cool', ['c', 'oo', 'l']),
      tricky('I', 'I'),
      pw('feel', 'feel', ['f', 'ee', 'l']),
      pw('such', 'such', ['s', 'u', 'ch']),
      pw('joy.', 'joy', ['j', 'oy']),
    ],
    imageUrl: '/illustrations/2_6/page2.png', audioUrl: '/sounds/sentences/L2_6_p2.mp3' },
  { type: 'story', sentences: ['A man plays a drum in the dark.', 'Tap, tap, tap!', 'I stay to see.'],
    words: [
      tricky('A', 'a'),
      cvc('man', 'man'),
      pw('plays', 'plays', ['p', 'l', 'ay', 's']),
      tricky('a', 'a'),
      cvc('drum', 'drum'),
      cvc('in', 'in'),
      tricky('the', 'the'),
      pw('dark.', 'dark', ['d', 'ar', 'k']),
      cvc('Tap,', 'tap'),
      cvc('tap,', 'tap'),
      cvc('tap!', 'tap'),
      tricky('I', 'I'),
      pw('stay', 'stay', ['s', 't', 'ay']),
      tricky('to', 'to'),
      pw('see.', 'see', ['s', 'ee']),
    ],
    imageUrl: '/illustrations/2_6/page3.png', audioUrl: '/sounds/sentences/L2_6_p3.mp3' },
  { type: 'story', sentences: ['Mum gets food for us.', 'I try a spoon.', 'It is hot and so yum!'],
    words: [
      cvc('Mum', 'mum'),
      cvc('gets', 'gets'),
      pw('food', 'food', ['f', 'oo', 'd']),
      pw('for', 'for', ['f', 'or']),
      cvc('us.', 'us'),
      tricky('I', 'I'),
      cvc('try', 'try'),
      tricky('a', 'a'),
      pw('spoon.', 'spoon', ['s', 'p', 'oo', 'n']),
      cvc('It', 'it'),
      tricky('is', 'is'),
      cvc('hot', 'hot'),
      cvc('and', 'and'),
      cvc('so', 'so'),
      cvc('yum!', 'yum'),
    ],
    imageUrl: '/illustrations/2_6/page4.png', audioUrl: '/sounds/sentences/L2_6_p4.mp3' },
  { type: 'story', sentences: ['I see a toy bird with soft hair.', '"Can I get it, Mum?" She says yes!'],
    words: [
      tricky('I', 'I'),
      pw('see', 'see', ['s', 'ee']),
      tricky('a', 'a'),
      pw('toy', 'toy', ['t', 'oy']),
      pw('bird', 'bird', ['b', 'ir', 'd']),
      pw('with', 'with', ['w', 'i', 'th']),
      cvc('soft', 'soft'),
      pw('hair.', 'hair', ['h', 'air']),
      cvc('"Can', 'can'),
      tricky('I', 'I'),
      cvc('get', 'get'),
      cvc('it,', 'it'),
      cvc('Mum?"', 'mum'),
      pw('She', 'she', ['sh', 'e']),
      pw('says', 'says', ['s', 'ay', 's']),
      cvc('yes!', 'yes'),
    ],
    imageUrl: '/illustrations/2_6/page5.png', audioUrl: '/sounds/sentences/L2_6_p5.mp3' },
  { type: 'story', sentences: ['I sit on a stool.', 'The fair is so much fun!', 'The air is cool.'],
    words: [
      tricky('I', 'I'),
      cvc('sit', 'sit'),
      cvc('on', 'on'),
      tricky('a', 'a'),
      pw('stool.', 'stool', ['s', 't', 'oo', 'l']),
      tricky('The', 'the'),
      pw('fair', 'fair', ['f', 'air']),
      tricky('is', 'is'),
      cvc('so', 'so'),
      pw('much', 'much', ['m', 'u', 'ch']),
      cvc('fun!', 'fun'),
      tricky('The', 'the'),
      pw('air', 'air', ['air']),
      tricky('is', 'is'),
      pw('cool.', 'cool', ['c', 'oo', 'l']),
    ],
    imageUrl: '/illustrations/2_6/page6.png', audioUrl: '/sounds/sentences/L2_6_p6.mp3' },
  { type: 'story', sentences: ['Look up!', 'I see stars in the sky.', 'The moon is low and round.'],
    words: [
      pw('Look', 'look', ['l', 'oo', 'k']),
      cvc('up!', 'up'),
      tricky('I', 'I'),
      pw('see', 'see', ['s', 'ee']),
      pw('stars', 'stars', ['s', 't', 'ar', 's']),
      cvc('in', 'in'),
      tricky('the', 'the'),
      cvc('sky.', 'sky'),
      tricky('The', 'the'),
      pw('moon', 'moon', ['m', 'oo', 'n']),
      tricky('is', 'is'),
      pw('low', 'low', ['l', 'ow']),
      cvc('and', 'and'),
      pw('round.', 'round', ['r', 'ou', 'n', 'd']),
    ],
    imageUrl: '/illustrations/2_6/page7.png', audioUrl: '/sounds/sentences/L2_6_p7.mp3' },
  { type: 'story', sentences: ['My night at the souq is so good.', 'I wave good night to the big moon.'],
    words: [
      cvc('My', 'my'),
      pw('night', 'night', ['n', 'igh', 't']),
      cvc('at', 'at'),
      tricky('the', 'the'),
      pw('souq', 'souq', ['s', 'ou', 'q']),
      tricky('is', 'is'),
      cvc('so', 'so'),
      pw('good.', 'good', ['g', 'oo', 'd']),
      tricky('I', 'I'),
      cvc('wave', 'wave'),
      pw('good', 'good', ['g', 'oo', 'd']),
      pw('night', 'night', ['n', 'igh', 't']),
      tricky('to', 'to'),
      tricky('the', 'the'),
      cvc('big', 'big'),
      pw('moon.', 'moon', ['m', 'oo', 'n']),
    ],
    imageUrl: '/illustrations/2_6/page8.png', audioUrl: '/sounds/sentences/L2_6_p8.mp3' },

  // ── QUIZ ──
  { type: 'quiz', questions: [
    { question: 'Where did the girl go at night?',
      options: [{ label: 'the souq', isCorrect: true }, { label: 'the zoo', isCorrect: false }, { label: 'the park', isCorrect: false }] },
    { question: 'What toy did she get?',
      options: [{ label: 'a bird', isCorrect: true }, { label: 'a camel', isCorrect: false }, { label: 'a drum', isCorrect: false }] },
    { question: 'What did she see up high in the sky?',
      options: [{ label: 'the moon', isCorrect: true }, { label: 'a kite', isCorrect: false }, { label: 'a bird', isCorrect: false }] },
  ]},

  // ── SOUND SPOTLIGHTS ──
  { type: 'sound_spotlight', sound: 'igh', items: [
    { word: 'night', imageUrl: '/images/words/night.png', focusIndex: 1 },
    { word: 'bright', imageUrl: '/images/words/bright.png', focusIndex: 2 },
    { word: 'high', imageUrl: '/images/words/high.png', focusIndex: 1 },
    { word: 'light', imageUrl: '/images/words/light.png', focusIndex: 1 },
  ]},
  { type: 'sound_spotlight', sound: 'oo', items: [
    { word: 'moon', imageUrl: '/images/words/moon.png', focusIndex: 1 },
    { word: 'cool', imageUrl: '/images/words/cool.png', focusIndex: 1 },
    { word: 'food', imageUrl: '/images/words/food.png', focusIndex: 1 },
    { word: 'stool', imageUrl: '/images/words/stool.png', focusIndex: 2 },
  ]},
  { type: 'sound_spotlight', sound: 'ou', items: [
    { word: 'round', imageUrl: '/images/words/round.png', focusIndex: 1 },
    { word: 'shout', imageUrl: '/images/words/shout.png', focusIndex: 2 },
    { word: 'out', imageUrl: '/images/words/out.png', focusIndex: 0 },
    { word: 'loud', imageUrl: '/images/words/loud.png', focusIndex: 1 },
  ]},

  // ── WORD READING ──
  { type: 'word_reading', words: [
    pw('night', 'night', ['n','igh','t']), pw('bright', 'bright', ['b','r','igh','t']),
    pw('cool', 'cool', ['c','oo','l']), pw('moon', 'moon', ['m','oo','n']),
    pw('round', 'round', ['r','ou','n','d']), pw('fair', 'fair', ['f','air']),
    pw('dark', 'dark', ['d','ar','k']),
  ]},

  // ── TRICKY WORDS ──
  { type: 'tricky_words', words: [tricky('the', 'the'), tricky('I', 'I'), tricky('we', 'we'), tricky('to', 'to'), tricky('my', 'my'), tricky('are', 'are')] },

  // ── SPELLING ──
  { type: 'spelling', words: [
    { word: 'night', imageUrl: '/images/words/night.png', letters: ['n','igh','t'] },
    { word: 'moon', imageUrl: '/images/words/moon.png', letters: ['m','oo','n'] },
    { word: 'round', imageUrl: '/images/words/round.png', letters: ['r','ou','n','d'] },
    { word: 'fair', imageUrl: '/images/words/fair.png', letters: ['f','air'] },
  ]},

  // ── ALIEN WORDS ──
  { type: 'nonsense_words', words: [
    pw('tay', 'tay', ['t','ay']), pw('jee', 'jee', ['j','ee']),
    pw('migh', 'migh', ['m','igh']), pw('zow', 'zow', ['z','ow']),
    pw('joo', 'joo', ['j','oo']), pw('thar', 'thar', ['th','ar']),
    pw('gor', 'gor', ['g','or']), pw('vair', 'vair', ['v','air']),
    pw('bir', 'bir', ['b','ir']), pw('dou', 'dou', ['d','ou']),
    pw('foy', 'foy', ['f','oy']), pw('zar', 'zar', ['z','ar']),
  ]},

  { type: 'writing_practice', letters: ['igh', 'oo'] },

  { type: 'grammar', variant: 'word_order', title: 'Build the sentence!', items: [
    { correctWords: ['I', 'see', 'the', 'lamps.'], imageUrl: '/illustrations/2_6/page2.png' },
    { correctWords: ['The', 'moon', 'is', 'round.'], imageUrl: '/illustrations/2_6/page7.png' },
  ]},

  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/2_6/page1.png', label: 'It is night! We go to the souq.', correctIndex: 0 },
    { imageUrl: '/illustrations/2_6/page2.png', label: 'I see lots of lamps. Joy!', correctIndex: 1 },
    { imageUrl: '/illustrations/2_6/page3.png', label: 'A man plays a drum. Tap, tap!', correctIndex: 2 },
    { imageUrl: '/illustrations/2_6/page4.png', label: 'Mum gets food. It is yum!', correctIndex: 3 },
    { imageUrl: '/illustrations/2_6/page5.png', label: 'I see a toy bird. Can I get it?', correctIndex: 4 },
    { imageUrl: '/illustrations/2_6/page6.png', label: 'I sit on a stool. The air is cool.', correctIndex: 5 },
    { imageUrl: '/illustrations/2_6/page7.png', label: 'The moon is low and round.', correctIndex: 6 },
    { imageUrl: '/illustrations/2_6/page8.png', label: 'I wave good night to the moon.', correctIndex: 7 },
  ]},

  { type: 'drawing', prompt: 'Draw Your Favourite Part' },
  { type: 'certificate', bookTitle: 'The Night Fair' },
];
