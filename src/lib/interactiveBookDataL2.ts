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
  { type: 'cover', title: 'The Night Light', subtitle: 'Level 2 · Longer Sounds', imageUrl: '/illustrations/2_1/cover.png' },

  { type: 'sound_grid', focusSounds: ['ay', 'ee', 'igh'], allSounds: L2_ALL_SOUNDS },

  { type: 'vocab_preview', words: [
    pw('high', 'high', ['h','igh']), pw('day', 'day', ['d','ay']),
    pw('sigh', 'sigh', ['s','igh']), pw('need', 'need', ['n','ee','d']),
    pw('light', 'light', ['l','igh','t']), pw('see', 'see', ['s','ee']),
    pw('way', 'way', ['w','ay']), pw('night', 'night', ['n','igh','t']),
    pw('say', 'say', ['s','ay']), pw('yay', 'yay', ['y','ay']),
  ]},

  // Page 1 — boy at home at dusk, searching sofa cushions for toy cat
  { type: 'story', sentences: ['The day ends.', 'I sigh.'],
    words: [
      tricky('The', 'the'), pw('day', 'day', ['d','ay']), pw('ends.', 'ends', ['e','n','d','s']),
      tricky('I', 'I'), pw('sigh.', 'sigh', ['s','igh']),
    ],
    imageUrl: '/illustrations/2_1/page1.png', audioUrl: '/sounds/sentences/L2_1_p1.mp3' },

  // Page 2 — dad and boy step out onto Tokyo street at night
  { type: 'story', sentences: ['We go out.', 'It is night.'],
    words: [
      tricky('We', 'we'), tricky('go', 'go'), pw('out.', 'out', ['ou','t']),
      pw('It', 'it', ['i','t']), tricky('is', 'is'), pw('night.', 'night', ['n','igh','t']),
    ],
    imageUrl: '/illustrations/2_1/page2.png', audioUrl: '/sounds/sentences/L2_1_p2.mp3' },

  // Page 3 — boy peering into bright konbini, searching
  { type: 'story', sentences: ['See the lights!', 'I can see!'],
    words: [
      pw('See', 'see', ['s','ee']), tricky('the', 'the'), pw('lights!', 'light', ['l','igh','t']),
      tricky('I', 'I'), cvc('can', 'can'), pw('see!', 'see', ['s','ee']),
    ],
    imageUrl: '/illustrations/2_1/page3.png', audioUrl: '/sounds/sentences/L2_1_p3.mp3' },

  // Page 4 — darker side street, boy pointing, worried
  { type: 'story', sentences: ['It is dim.', 'I need a light.'],
    words: [
      pw('It', 'it', ['i','t']), tricky('is', 'is'), pw('dim.', 'dim', ['d','i','m']),
      tricky('I', 'I'), pw('need', 'need', ['n','ee','d']), tricky('a', 'a'), pw('light.', 'light', ['l','igh','t']),
    ],
    imageUrl: '/illustrations/2_1/page4.png', audioUrl: '/sounds/sentences/L2_1_p4.mp3' },

  // Page 5 — both looking up at the full moon high above the city
  { type: 'story', sentences: ['A light up high!', 'The moon!'],
    words: [
      tricky('A', 'a'), pw('light', 'light', ['l','igh','t']),
      pw('up', 'up', ['u','p']), pw('high!', 'high', ['h','igh']),
      tricky('The', 'the'), tricky('moon!', 'moon'),
    ],
    imageUrl: '/illustrations/2_1/page5.png', audioUrl: '/sounds/sentences/L2_1_p5.mp3' },

  // Page 6 — dad crouches down, comforting sad boy
  { type: 'story', sentences: ['Dad can see.', 'I am sad.'],
    words: [
      pw('Dad', 'dad', ['d','a','d']), cvc('can', 'can'), pw('see.', 'see', ['s','ee']),
      tricky('I', 'I'), cvc('am', 'am'), pw('sad.', 'sad', ['s','a','d']),
    ],
    imageUrl: '/illustrations/2_1/page6.png', audioUrl: '/sounds/sentences/L2_1_p6.mp3' },

  // Page 7 — dad points at the toy cat under a street light, boy runs toward it
  { type: 'story', sentences: ['My cat!', 'I see it!', 'Yay!'],
    words: [
      tricky('My', 'my'), pw('cat!', 'cat', ['c','a','t']),
      tricky('I', 'I'), pw('see', 'see', ['s','ee']), pw('it!', 'it', ['i','t']),
      pw('Yay!', 'yay', ['y','ay']),
    ],
    imageUrl: '/illustrations/2_1/page7.png', audioUrl: '/sounds/sentences/L2_1_p7.mp3' },

  // Page 8 — boy hugging toy cat, both smiling happily
  { type: 'story', sentences: ['Day and night!', 'I say "Yay!"'],
    words: [
      pw('Day', 'day', ['d','ay']),
      pw('and', 'and', ['a','n','d']), pw('night!', 'night', ['n','igh','t']),
      tricky('I', 'I'), pw('say', 'say', ['s','ay']),
      pw('"Yay!"', 'yay', ['y','ay']),
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
// L2.2  —  Moo at the Zoo  (Focus: ow, oo)
// ═══════════════════════════════════════════════════════════════════════════

export const BOOK_L2_2_PAGES: InteractivePage[] = [
  { type: 'cover', title: 'Moo at the Zoo', subtitle: 'Level 2 · Longer Sounds', imageUrl: '/illustrations/2_2/cover.png' },

  { type: 'sound_grid', focusSounds: ['ow', 'oo'], allSounds: L2_ALL_SOUNDS },

  { type: 'vocab_preview', words: [
    pw('zoo', 'zoo', ['z','oo']), pw('cow', 'cow', ['c','ow']),
    pw('owl', 'owl', ['ow','l']), pw('moo', 'moo', ['m','oo']),
    pw('hoop', 'hoop', ['h','oo','p']), pw('cool', 'cool', ['c','oo','l']),
    pw('wow', 'wow', ['w','ow']), pw('boo', 'boo', ['b','oo']),
  ]},

  // Page 1
  { type: 'story', sentences: ['I go to the zoo with my dad.', 'I need to see the owl!'],
    words: [
      tricky('I', 'I'), tricky('go', 'go'), tricky('to', 'to'), tricky('the', 'the'),
      pw('zoo', 'zoo', ['z','oo']),
      pw('with', 'with', ['w','i','th']), tricky('my', 'my'), cvc('dad.', 'dad'),
      tricky('I', 'I'), pw('need', 'need', ['n','ee','d']), tricky('to', 'to'),
      pw('see', 'see', ['s','ee']), tricky('the', 'the'), pw('owl!', 'owl', ['ow','l']),
    ],
    imageUrl: '/illustrations/2_2/page1.png', audioUrl: '/sounds/sentences/L2_2_p1.mp3' },

  // Page 2
  { type: 'story', sentences: ['I look at the cows.', 'Moo! Moo! No owl.', 'I will look on.'],
    words: [
      tricky('I', 'I'), pw('look', 'look', ['l','oo','k']),
      pw('at', 'at', ['a','t']), tricky('the', 'the'),
      pw('cows.', 'cow', ['c','ow']),
      pw('Moo!', 'moo', ['m','oo']), pw('Moo!', 'moo', ['m','oo']),
      tricky('No', 'no'), pw('owl.', 'owl', ['ow','l']),
      tricky('I', 'I'), pw('will', 'will', ['w','i','ll']),
      pw('look', 'look', ['l','oo','k']), pw('on.', 'on', ['o','n']),
    ],
    imageUrl: '/illustrations/2_2/page2.png', audioUrl: '/sounds/sentences/L2_2_p2.mp3' },

  // Page 3
  { type: 'story', sentences: ['Wow! A big show.', 'A seal can shoot a hoop!', 'No owl.'],
    words: [
      pw('Wow!', 'wow', ['w','ow']), tricky('A', 'a'), cvc('big', 'big'),
      pw('show.', 'show', ['sh','ow']),
      tricky('A', 'a'), pw('seal', 'seal', ['s','ee','l']), cvc('can', 'can'),
      pw('shoot', 'shoot', ['sh','oo','t']), tricky('a', 'a'),
      pw('hoop!', 'hoop', ['h','oo','p']),
      tricky('No', 'no'), pw('owl.', 'owl', ['ow','l']),
    ],
    imageUrl: '/illustrations/2_2/page3.png', audioUrl: '/sounds/sentences/L2_2_p3.mp3' },

  // Page 4
  { type: 'story', sentences: ['Ooh! I see a cool pool.', 'Fish zoom in it. No owl.'],
    words: [
      pw('Ooh!', 'ooh', ['oo']), tricky('I', 'I'), pw('see', 'see', ['s','ee']),
      tricky('a', 'a'), pw('cool', 'cool', ['c','oo','l']),
      pw('pool.', 'pool', ['p','oo','l']),
      pw('Fish', 'fish', ['f','i','sh']), pw('zoom', 'zoom', ['z','oo','m']),
      pw('in', 'in', ['i','n']), pw('it.', 'it', ['i','t']),
      tricky('No', 'no'), pw('owl.', 'owl', ['ow','l']),
    ],
    imageUrl: '/illustrations/2_2/page4.png', audioUrl: '/sounds/sentences/L2_2_p4.mp3' },

  // Page 5
  { type: 'story', sentences: ['Boo! A big dim room.', 'I see bats. No owl!'],
    words: [
      pw('Boo!', 'boo', ['b','oo']), tricky('A', 'a'), cvc('big', 'big'),
      cvc('dim', 'dim'), pw('room.', 'room', ['r','oo','m']),
      tricky('I', 'I'), pw('see', 'see', ['s','ee']),
      pw('bats.', 'bat', ['b','a','t']), tricky('No', 'no'), pw('owl!', 'owl', ['ow','l']),
    ],
    imageUrl: '/illustrations/2_2/page5.png', audioUrl: '/sounds/sentences/L2_2_p5.mp3' },

  // Page 6
  { type: 'story', sentences: ['I am so sad now.', 'Then my dad calls, "Look up!"'],
    words: [
      tricky('I', 'I'), pw('am', 'am', ['a','m']), tricky('so', 'so'),
      cvc('sad', 'sad'), pw('now.', 'now', ['n','ow']),
      pw('Then', 'then', ['th','e','n']), tricky('my', 'my'), cvc('dad', 'dad'),
      pw('calls,', 'call', ['c','a','ll']),
      pw('"Look', 'look', ['l','oo','k']), pw('up!"', 'up', ['u','p']),
    ],
    imageUrl: '/illustrations/2_2/page6.png', audioUrl: '/sounds/sentences/L2_2_p6.mp3' },

  // Page 7
  { type: 'story', sentences: ['Hoo! Hoo!', 'I look up. The owl!', 'It is up high!'],
    words: [
      pw('Hoo!', 'hoo', ['h','oo']), pw('Hoo!', 'hoo', ['h','oo']),
      tricky('I', 'I'), pw('look', 'look', ['l','oo','k']),
      pw('up.', 'up', ['u','p']), tricky('The', 'the'), pw('owl!', 'owl', ['ow','l']),
      pw('It', 'it', ['i','t']), tricky('is', 'is'),
      pw('up', 'up', ['u','p']), pw('high!', 'high', ['h','igh']),
    ],
    imageUrl: '/illustrations/2_2/page7.png', audioUrl: '/sounds/sentences/L2_2_p7.mp3' },

  // Page 8
  { type: 'story', sentences: ['The owl bows at me.', 'I bow too.', 'The zoo is so good!'],
    words: [
      tricky('The', 'the'), pw('owl', 'owl', ['ow','l']),
      pw('bows', 'bow', ['b','ow']), pw('at', 'at', ['a','t']), tricky('me.', 'me'),
      tricky('I', 'I'), pw('bow', 'bow', ['b','ow']), pw('too.', 'too', ['t','oo']),
      tricky('The', 'the'), pw('zoo', 'zoo', ['z','oo']), tricky('is', 'is'),
      tricky('so', 'so'), pw('good!', 'good', ['g','oo','d']),
    ],
    imageUrl: '/illustrations/2_2/page8.png', audioUrl: '/sounds/sentences/L2_2_p8.mp3' },

  { type: 'quiz', questions: [
    { question: 'What was the child looking for?',
      options: [{ label: 'an owl', isCorrect: true }, { label: 'a cow', isCorrect: false }, { label: 'a bat', isCorrect: false }] },
    { question: 'What sound does the cow make?',
      options: [{ label: 'Moo!', isCorrect: true }, { label: 'Boo!', isCorrect: false }, { label: 'Hoo!', isCorrect: false }] },
    { question: 'Who spotted the owl first?',
      options: [{ label: 'Dad', isCorrect: true }, { label: 'the child', isCorrect: false }, { label: 'a seal', isCorrect: false }] },
  ]},

  { type: 'sound_spotlight', sound: 'ow', items: [
    { word: 'cow', imageUrl: '/images/words/cow.png', focusIndex: 1 },
    { word: 'owl', imageUrl: '/images/words/owl.png', focusIndex: 0 },
    { word: 'now', imageUrl: '/images/words/now.png', focusIndex: 1 },
    { word: 'down', imageUrl: '/images/words/down.png', focusIndex: 1 },
  ]},
  { type: 'sound_spotlight', sound: 'oo', items: [
    { word: 'zoo', imageUrl: '/images/words/zoo.png', focusIndex: 1 },
    { word: 'moon', imageUrl: '/images/words/moon.png', focusIndex: 1 },
    { word: 'look', imageUrl: '/images/words/look.png', focusIndex: 1 },
    { word: 'cool', imageUrl: '/images/words/cool.png', focusIndex: 1 },
  ]},

  { type: 'word_reading', words: [
    pw('zoo', 'zoo', ['z','oo']), pw('owl', 'owl', ['ow','l']),
    pw('cool', 'cool', ['c','oo','l']), pw('hoop', 'hoop', ['h','oo','p']),
  ]},

  { type: 'tricky_words', words: [
    tricky('the', 'the'), tricky('I', 'I'), tricky('to', 'to'),
    tricky('no', 'no'), tricky('my', 'my'), tricky('me', 'me'),
  ]},

  { type: 'spelling', words: [
    { word: 'zoo', imageUrl: '/images/words/zoo.png', letters: ['z','oo'] },
    { word: 'owl', imageUrl: '/images/words/owl.png', letters: ['ow','l'] },
    { word: 'cool', imageUrl: '/images/words/cool.png', letters: ['c','oo','l'] },
    { word: 'cow', imageUrl: '/images/words/cow.png', letters: ['c','ow'] },
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

  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/2_2/page1.png', label: 'I go to the zoo!', correctIndex: 0 },
    { imageUrl: '/illustrations/2_2/page2.png', label: 'Cows! Moo! No owl.', correctIndex: 1 },
    { imageUrl: '/illustrations/2_2/page3.png', label: 'A seal shoots hoops!', correctIndex: 2 },
    { imageUrl: '/illustrations/2_2/page4.png', label: 'A cool pool. No owl.', correctIndex: 3 },
    { imageUrl: '/illustrations/2_2/page5.png', label: 'Boo! Bats. No owl!', correctIndex: 4 },
    { imageUrl: '/illustrations/2_2/page6.png', label: 'Dad calls, "Look up!"', correctIndex: 5 },
    { imageUrl: '/illustrations/2_2/page7.png', label: 'The owl! Up high!', correctIndex: 6 },
    { imageUrl: '/illustrations/2_2/page8.png', label: 'The zoo is so good!', correctIndex: 7 },
  ]},

  { type: 'drawing', prompt: 'Draw Your Favourite Part' },
  { type: 'certificate', bookTitle: 'Moo at the Zoo' },
];

// ═══════════════════════════════════════════════════════════════════════════
// L2.3  —  Morning on the Farm  (Focus: ar, or)
// ═══════════════════════════════════════════════════════════════════════════

export const BOOK_L2_3_PAGES: InteractivePage[] = [
  { type: 'cover', title: 'Morning on the Farm', subtitle: 'Level 2 · Longer Sounds', imageUrl: '/illustrations/2_3/cover.png' },

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
  { type: 'story', sentences: ['I get a torch for the dark.', 'I march to the big barn door.'],
    words: [
      tricky('I', 'I'), pw('get', 'get', ['g','e','t']), tricky('a', 'a'),
      pw('torch', 'torch', ['t','or','ch']), pw('for', 'for', ['f','or']),
      tricky('the', 'the'), pw('dark.', 'dark', ['d','ar','k']),
      tricky('I', 'I'), pw('march', 'march', ['m','ar','ch']),
      tricky('to', 'to'), tricky('the', 'the'), cvc('big', 'big'),
      pw('barn', 'barn', ['b','ar','n']), pw('door.', 'door', ['d','oo','r']),
    ],
    imageUrl: '/illustrations/2_3/page5.png', audioUrl: '/sounds/sentences/L2_3_p5.mp3' },

  // Page 6
  { type: 'story', sentences: ['It is dark in the barn.', 'I look far into a corner.', 'I see a thing!'],
    words: [
      pw('It', 'it', ['i','t']), tricky('is', 'is'), pw('dark', 'dark', ['d','ar','k']),
      pw('in', 'in', ['i','n']), tricky('the', 'the'), pw('barn.', 'barn', ['b','ar','n']),
      tricky('I', 'I'), pw('look', 'look', ['l','oo','k']),
      pw('far', 'far', ['f','ar']), tricky('into', 'into'),
      tricky('a', 'a'), pw('corner.', 'corner', ['c','or','n','er']),
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
  { type: 'story', sentences: ['I hug the warm kid with my dad.', 'This farm is too good!'],
    words: [
      tricky('I', 'I'), cvc('hug', 'hug'), tricky('the', 'the'),
      pw('warm', 'warm', ['w','ar','m']), cvc('kid', 'kid'),
      pw('with', 'with', ['w','i','th']), tricky('my', 'my'), cvc('dad.', 'dad'),
      pw('This', 'this', ['th','i','s']), pw('farm', 'farm', ['f','ar','m']),
      tricky('is', 'is'), pw('too', 'too', ['t','oo']),
      pw('good!', 'good', ['g','oo','d']),
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
  { type: 'cover', title: 'The Fair in the Air', subtitle: 'Level 2 · Longer Sounds', imageUrl: '/illustrations/2_4/cover.png' },

  { type: 'sound_grid', focusSounds: ['air', 'ir'], allSounds: L2_ALL_SOUNDS },

  { type: 'vocab_preview', words: [
    pw('fair', 'fair', ['f','air']), pw('air', 'air', ['air']),
    pw('pair', 'pair', ['p','air']), pw('hair', 'hair', ['h','air']),
    pw('sir', 'sir', ['s','ir']), pw('fir', 'fir', ['f','ir']),
    pw('chair', 'chair', ['ch','air']), pw('stir', 'stir', ['s','t','ir']),
  ]},

  // Page 1
  { type: 'story', sentences: ['I go to the fair!', 'I can see it.', 'The air is cool. The fair is so big!'],
    words: [
      tricky('I', 'I'), tricky('go', 'go'), tricky('to', 'to'), tricky('the', 'the'),
      pw('fair!', 'fair', ['f','air']),
      tricky('I', 'I'), cvc('can', 'can'), pw('see', 'see', ['s','ee']),
      pw('it.', 'it', ['i','t']),
      tricky('The', 'the'), pw('air', 'air', ['air']), tricky('is', 'is'),
      pw('cool.', 'cool', ['c','oo','l']),
      tricky('The', 'the'), pw('fair', 'fair', ['f','air']), tricky('is', 'is'),
      tricky('so', 'so'), cvc('big!', 'big'),
    ],
    imageUrl: '/illustrations/2_4/page1.png', audioUrl: '/sounds/sentences/L2_4_p1.mp3' },

  // Page 2
  { type: 'story', sentences: ['The air is in my hair!', 'It is such a gush!', 'I put my hat on.'],
    words: [
      tricky('The', 'the'), pw('air', 'air', ['air']), tricky('is', 'is'),
      pw('in', 'in', ['i','n']), tricky('my', 'my'), pw('hair!', 'hair', ['h','air']),
      pw('It', 'it', ['i','t']), tricky('is', 'is'),
      pw('such', 'such', ['s','u','ch']), tricky('a', 'a'),
      pw('gush!', 'gush', ['g','u','sh']),
      tricky('I', 'I'), tricky('put', 'put'), tricky('my', 'my'),
      cvc('hat', 'hat'), pw('on.', 'on', ['o','n']),
    ],
    imageUrl: '/illustrations/2_4/page2.png', audioUrl: '/sounds/sentences/L2_4_p2.mp3' },

  // Page 3
  { type: 'story', sentences: ['Look! Toy ducks, a pair!', '"I can win!" I say.'],
    words: [
      pw('Look!', 'look', ['l','oo','k']),
      pw('Toy', 'toy', ['t','oy']), pw('ducks,', 'duck', ['d','u','ck']),
      tricky('a', 'a'), pw('pair!', 'pair', ['p','air']),
      pw('"I', 'I', []), cvc('can', 'can'), pw('win!"', 'win', ['w','i','n']),
      tricky('I', 'I'), pw('say.', 'say', ['s','ay']),
    ],
    imageUrl: '/illustrations/2_4/page3.png', audioUrl: '/sounds/sentences/L2_4_p3.mp3' },

  // Page 4
  { type: 'story', sentences: ['"Yes!" I say.', 'I win the pair!', 'I hug my pair. My pair is so good!'],
    words: [
      pw('"Yes!"', 'yes', ['y','e','s']), tricky('I', 'I'), pw('say.', 'say', ['s','ay']),
      tricky('I', 'I'), pw('win', 'win', ['w','i','n']), tricky('the', 'the'),
      pw('pair!', 'pair', ['p','air']),
      tricky('I', 'I'), cvc('hug', 'hug'), tricky('my', 'my'),
      pw('pair.', 'pair', ['p','air']), tricky('My', 'my'),
      pw('pair', 'pair', ['p','air']), tricky('is', 'is'),
      tricky('so', 'so'), pw('good!', 'good', ['g','oo','d']),
    ],
    imageUrl: '/illustrations/2_4/page4.png', audioUrl: '/sounds/sentences/L2_4_p4.mp3' },

  // Page 5
  { type: 'story', sentences: ['A gush in the air!', 'My pair shoots up, up, up!', 'No! My pair!'],
    words: [
      tricky('A', 'a'), pw('gush', 'gush', ['g','u','sh']),
      pw('in', 'in', ['i','n']), tricky('the', 'the'), pw('air!', 'air', ['air']),
      tricky('My', 'my'), pw('pair', 'pair', ['p','air']),
      pw('shoots', 'shoot', ['sh','oo','t']),
      pw('up,', 'up', ['u','p']), pw('up,', 'up', ['u','p']),
      pw('up!', 'up', ['u','p']),
      tricky('No!', 'no'), tricky('My', 'my'), pw('pair!', 'pair', ['p','air']),
    ],
    imageUrl: '/illustrations/2_4/page5.png', audioUrl: '/sounds/sentences/L2_4_p5.mp3' },

  // Page 6
  { type: 'story', sentences: ['"Sir! Sir! My pair is in the air!"', 'The sir said, "I can see it! By the fir!"'],
    words: [
      pw('"Sir!', 'sir', ['s','ir']), pw('Sir!', 'sir', ['s','ir']),
      tricky('My', 'my'), pw('pair', 'pair', ['p','air']), tricky('is', 'is'),
      pw('in', 'in', ['i','n']), tricky('the', 'the'), pw('air!"', 'air', ['air']),
      tricky('The', 'the'), pw('sir', 'sir', ['s','ir']),
      tricky('said,', 'said'), pw('"I', 'I', []),
      cvc('can', 'can'), pw('see', 'see', ['s','ee']),
      pw('it!', 'it', ['i','t']), pw('By', 'by', ['b','y']),
      tricky('the', 'the'), pw('fir!"', 'fir', ['f','ir']),
    ],
    imageUrl: '/illustrations/2_4/page6.png', audioUrl: '/sounds/sentences/L2_4_p6.mp3' },

  // Page 7
  { type: 'story', sentences: ['The sir ran to a big fir.', 'My pair is in the fir!', 'He got my pair down!'],
    words: [
      tricky('The', 'the'), pw('sir', 'sir', ['s','ir']), cvc('ran', 'ran'),
      tricky('to', 'to'), tricky('a', 'a'), cvc('big', 'big'),
      pw('fir.', 'fir', ['f','ir']),
      tricky('My', 'my'), pw('pair', 'pair', ['p','air']),
      tricky('is', 'is'), pw('in', 'in', ['i','n']), tricky('the', 'the'),
      pw('fir!', 'fir', ['f','ir']),
      tricky('He', 'he'), cvc('got', 'got'), tricky('my', 'my'),
      pw('pair', 'pair', ['p','air']), pw('down!', 'down', ['d','ow','n']),
    ],
    imageUrl: '/illustrations/2_4/page7.png', audioUrl: '/sounds/sentences/L2_4_p7.mp3' },

  // Page 8
  { type: 'story', sentences: ['I hug my pair.', 'I sit in a chair.', 'The fair is fun! My pair is back!'],
    words: [
      tricky('I', 'I'), cvc('hug', 'hug'), tricky('my', 'my'),
      pw('pair.', 'pair', ['p','air']),
      tricky('I', 'I'), cvc('sit', 'sit'), pw('in', 'in', ['i','n']),
      tricky('a', 'a'), pw('chair.', 'chair', ['ch','air']),
      tricky('The', 'the'), pw('fair', 'fair', ['f','air']),
      tricky('is', 'is'), cvc('fun!', 'fun'),
      tricky('My', 'my'), pw('pair', 'pair', ['p','air']),
      tricky('is', 'is'), pw('back!', 'back', ['b','a','ck']),
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
  { type: 'cover', title: 'Round and Round', subtitle: 'Level 2 · Longer Sounds', imageUrl: '/illustrations/2_5/cover.png' },

  { type: 'sound_grid', focusSounds: ['ou', 'oy'], allSounds: L2_ALL_SOUNDS },

  { type: 'vocab_preview', words: [
    pw('round', 'round', ['r','ou','n','d']), pw('loud', 'loud', ['l','ou','d']),
    pw('out', 'out', ['ou','t']), pw('shout', 'shout', ['sh','ou','t']),
    pw('found', 'found', ['f','ou','n','d']), pw('toy', 'toy', ['t','oy']),
    pw('joy', 'joy', ['j','oy']), pw('boy', 'boy', ['b','oy']),
  ]},

  // Page 1
  { type: 'story', sentences: ['I went out with my toy car.', 'I zoomed it round and round.', 'Zoom! Zoom!'],
    words: [
      tricky('I', 'I'), pw('went', 'went', ['w','e','n','t']),
      pw('out', 'out', ['ou','t']), pw('with', 'with', ['w','i','th']),
      tricky('my', 'my'), pw('toy', 'toy', ['t','oy']), pw('car.', 'car', ['c','ar']),
      tricky('I', 'I'), pw('zoomed', 'zoom', ['z','oo','m']),
      pw('it', 'it', ['i','t']), pw('round', 'round', ['r','ou','n','d']),
      pw('and', 'and', ['a','n','d']), pw('round.', 'round', ['r','ou','n','d']),
      pw('Zoom!', 'zoom', ['z','oo','m']), pw('Zoom!', 'zoom', ['z','oo','m']),
    ],
    imageUrl: '/illustrations/2_5/page1.png', audioUrl: '/sounds/sentences/L2_5_p1.mp3' },

  // Page 2
  { type: 'story', sentences: ['I zoomed it far down the path.', 'Round and round!', 'It got loud!'],
    words: [
      tricky('I', 'I'), pw('zoomed', 'zoom', ['z','oo','m']),
      pw('it', 'it', ['i','t']), pw('far', 'far', ['f','ar']),
      pw('down', 'down', ['d','ow','n']), tricky('the', 'the'),
      pw('path.', 'path', ['p','a','th']),
      pw('Round', 'round', ['r','ou','n','d']), pw('and', 'and', ['a','n','d']),
      pw('round!', 'round', ['r','ou','n','d']),
      pw('It', 'it', ['i','t']), cvc('got', 'got'),
      pw('loud!', 'loud', ['l','ou','d']),
    ],
    imageUrl: '/illustrations/2_5/page2.png', audioUrl: '/sounds/sentences/L2_5_p2.mp3' },

  // Page 3
  { type: 'story', sentences: ['But it ran too far!', 'My toy!', 'I looked around and around.', 'I can not see it!'],
    words: [
      pw('But', 'but', ['b','u','t']), pw('it', 'it', ['i','t']),
      cvc('ran', 'ran'), pw('too', 'too', ['t','oo']), pw('far!', 'far', ['f','ar']),
      tricky('My', 'my'), pw('toy!', 'toy', ['t','oy']),
      tricky('I', 'I'), pw('looked', 'look', ['l','oo','k']),
      pw('around', 'around', ['a','r','ou','n','d']),
      pw('and', 'and', ['a','n','d']), pw('around.', 'around', ['a','r','ou','n','d']),
      tricky('I', 'I'), cvc('can', 'can'), cvc('not', 'not'),
      pw('see', 'see', ['s','ee']), pw('it!', 'it', ['i','t']),
    ],
    imageUrl: '/illustrations/2_5/page3.png', audioUrl: '/sounds/sentences/L2_5_p3.mp3' },

  // Page 4
  { type: 'story', sentences: ['I shouted out loud.', '"Mum! I need you!', 'I can not see my toy!"'],
    words: [
      tricky('I', 'I'), pw('shouted', 'shout', ['sh','ou','t']),
      pw('out', 'out', ['ou','t']), pw('loud.', 'loud', ['l','ou','d']),
      pw('"Mum!', 'mum', ['m','u','m']), tricky('I', 'I'),
      pw('need', 'need', ['n','ee','d']), tricky('you!', 'you'),
      tricky('I', 'I'), cvc('can', 'can'), cvc('not', 'not'),
      pw('see', 'see', ['s','ee']), tricky('my', 'my'), pw('toy!"', 'toy', ['t','oy']),
    ],
    imageUrl: '/illustrations/2_5/page4.png', audioUrl: '/sounds/sentences/L2_5_p4.mp3' },

  // Page 5
  { type: 'story', sentences: ['Mum ran out to me.', '"I will look around and around," she said.'],
    words: [
      cvc('Mum', 'mum'), cvc('ran', 'ran'), pw('out', 'out', ['ou','t']),
      tricky('to', 'to'), tricky('me.', 'me'),
      pw('"I', 'I', []), pw('will', 'will', ['w','i','ll']),
      pw('look', 'look', ['l','oo','k']),
      pw('around', 'around', ['a','r','ou','n','d']),
      pw('and', 'and', ['a','n','d']),
      pw('around,"', 'around', ['a','r','ou','n','d']),
      tricky('she', 'she'), tricky('said.', 'said'),
    ],
    imageUrl: '/illustrations/2_5/page5.png', audioUrl: '/sounds/sentences/L2_5_p5.mp3' },

  // Page 6
  { type: 'story', sentences: ['We looked around the big rock.', 'No toy!', 'We looked around the shed.', 'No toy!'],
    words: [
      tricky('We', 'we'), pw('looked', 'look', ['l','oo','k']),
      pw('around', 'around', ['a','r','ou','n','d']),
      tricky('the', 'the'), cvc('big', 'big'), pw('rock.', 'rock', ['r','o','ck']),
      tricky('No', 'no'), pw('toy!', 'toy', ['t','oy']),
      tricky('We', 'we'), pw('looked', 'look', ['l','oo','k']),
      pw('around', 'around', ['a','r','ou','n','d']),
      tricky('the', 'the'), pw('shed.', 'shed', ['sh','e','d']),
      tricky('No', 'no'), pw('toy!', 'toy', ['t','oy']),
    ],
    imageUrl: '/illustrations/2_5/page6.png', audioUrl: '/sounds/sentences/L2_5_p6.mp3' },

  // Page 7
  { type: 'story', sentences: ['"Look!" said Mum. "I found it!"', 'My toy! Joy! Joy!', 'I shouted out loud!'],
    words: [
      pw('"Look!"', 'look', ['l','oo','k']), tricky('said', 'said'),
      cvc('Mum.', 'mum'), pw('"I', 'I', []),
      pw('found', 'found', ['f','ou','n','d']), pw('it!"', 'it', ['i','t']),
      tricky('My', 'my'), pw('toy!', 'toy', ['t','oy']),
      pw('Joy!', 'joy', ['j','oy']), pw('Joy!', 'joy', ['j','oy']),
      tricky('I', 'I'), pw('shouted', 'shout', ['sh','ou','t']),
      pw('out', 'out', ['ou','t']), pw('loud!', 'loud', ['l','ou','d']),
    ],
    imageUrl: '/illustrations/2_5/page7.png', audioUrl: '/sounds/sentences/L2_5_p7.mp3' },

  // Page 8
  { type: 'story', sentences: ['I hugged my toy and I hugged Mum.', '"Thank you!" I said.', 'We went in.'],
    words: [
      tricky('I', 'I'), pw('hugged', 'hug', ['h','u','g']),
      tricky('my', 'my'), pw('toy', 'toy', ['t','oy']),
      pw('and', 'and', ['a','n','d']), tricky('I', 'I'),
      pw('hugged', 'hug', ['h','u','g']), cvc('Mum.', 'mum'),
      pw('"Thank', 'thank', ['th','a','nk']),
      tricky('you!"', 'you'), tricky('I', 'I'), tricky('said.', 'said'),
      tricky('We', 'we'), pw('went', 'went', ['w','e','n','t']),
      pw('in.', 'in', ['i','n']),
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
    { word: 'enjoy', imageUrl: '/images/words/enjoy.png', focusIndex: 2 },
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
