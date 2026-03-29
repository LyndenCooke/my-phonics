/**
 * Interactive book page data for Level 5 books
 * L5 focus sounds: ore, oor, ire, ear, ure, tion, ph, kn, wr
 */

import type { InteractivePage, StoryWord } from './interactiveBookData';

// ── Helpers ──

function word(display: string, w: string, phonemes: string[]): StoryWord {
  return { display, word: w, phonemes };
}
function tricky(display: string, w: string): StoryWord {
  return { display, word: w, phonemes: [], isTricky: true };
}

// L5 cumulative sounds (all sounds from L1–L5)
const L5_ALL_SOUNDS = [
  's/ss', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o',
  'c/k/ck', 'e', 'u', 'r', 'h', 'b', 'f/ff',
  'l/ll', 'j', 'v', 'w', 'x', 'y', 'z/zz',
  'qu', 'ch', 'sh', 'th', 'ng', 'nk',
  // L2
  'ai', 'ee', 'igh', 'oa', 'oo', 'ar', 'or', 'ur', 'ow', 'oi',
  'er',
  // L3
  'aw/au', 'ew', 'oe', 'ou', 'ie', 'ea', 'wh', 'ph',
  // L4
  'ay', 'ey', 'a_e', 'e_e', 'i_e', 'o_e', 'u_e',
  // L5
  'ore', 'oor', 'ire', 'ear', 'ure', 'tion', 'kn', 'wr',
];

// ═══════════════════════════════════════════════════════════════════════════
// L5.1 — "Before the Shore"
// Focus sounds: ore, ire, oor (Flashback/Time Shift structure)
// Setting: British seaside, boy finds a stone
// ═══════════════════════════════════════════════════════════════════════════

export const BOOK_L5_1_PAGES: InteractivePage[] = [
  // ── COVER ──
  { type: 'cover', title: 'Before the Shore', subtitle: 'Level 5 · Confident Reader', imageUrl: '/illustrations/5_1/cover.png' },

  // ── SOUNDS ──
  {
    type: 'sound_grid',
    focusSounds: ['ore', 'ire', 'oor'],
    allSounds: L5_ALL_SOUNDS,
  },

  // ── VOCAB PREVIEW ──
  {
    type: 'vocab_preview',
    words: [
      word('shore', 'shore', ['sh','ore']),
      word('before', 'before', ['b','e','f','ore']),
      word('explore', 'explore', ['e','x','p','l','ore']),
      word('fire', 'fire', ['f','ire']),
      word('wire', 'wire', ['w','ire']),
      word('floor', 'floor', ['f','l','oor']),
      word('stone', 'stone', ['s','t','o_e','n']),
      word('flames', 'flames', ['f','l','a_e','m','s']),
    ],
  },

  // ── STORY PAGES ──
  // Page 1
  {
    type: 'story',
    sentences: ['The boy went home from the park.', 'He was tired, and his feet were sore.', 'He sat on a bench to rest.', 'Then he saw something on the path — a smooth, flat stone.', 'He picked it up.'],
    words: [
      tricky('The', 'the'), word('boy', 'boy', ['b','oy']), word('went', 'went', ['w','e','n','t']),
      word('home', 'home', ['h','o_e','m']), word('from', 'from', ['f','r','o','m']),
      tricky('the', 'the'), word('park.', 'park', ['p','ar','k']),
      tricky('He', 'he'), tricky('was', 'was'), word('tired,', 'tired', ['t','ire','d']),
      word('and', 'and', ['a','n','d']), word('his', 'his', ['h','i','s']),
      word('feet', 'feet', ['f','ee','t']), tricky('were', 'were'),
      word('sore.', 'sore', ['s','ore']),
      tricky('He', 'he'), word('sat', 'sat', ['s','a','t']),
      word('on', 'on', ['o','n']), tricky('a', 'a'), word('bench', 'bench', ['b','e','n','ch']),
      tricky('to', 'to'), word('rest.', 'rest', ['r','e','s','t']),
      word('Then', 'then', ['th','e','n']), tricky('he', 'he'),
      word('saw', 'saw', ['s','aw']), tricky('something', 'something'),
      word('on', 'on', ['o','n']), tricky('the', 'the'),
      word('path', 'path', ['p','a','th']),
      tricky('a', 'a'), word('smooth,', 'smooth', ['s','m','oo','th']),
      word('flat', 'flat', ['f','l','a','t']), word('stone.', 'stone', ['s','t','o_e','n']),
      tricky('He', 'he'), word('picked', 'picked', ['p','i','ck','d']),
      word('it', 'it', ['i','t']), word('up.', 'up', ['u','p']),
    ],
    imageUrl: '/illustrations/5_1/page1.png',
  },

  // Page 2
  {
    type: 'story',
    sentences: ['The stone felt cool in his hand.', 'It had a shine, like something from the shore.', 'Once, before this week, he had seen a stone just like it.', 'He sat still and let his mind go back.'],
    words: [
      tricky('The', 'the'), word('stone', 'stone', ['s','t','o_e','n']),
      word('felt', 'felt', ['f','e','l','t']), word('cool', 'cool', ['c','oo','l']),
      word('in', 'in', ['i','n']), word('his', 'his', ['h','i','s']),
      word('hand.', 'hand', ['h','a','n','d']),
      word('It', 'it', ['i','t']), word('had', 'had', ['h','a','d']),
      tricky('a', 'a'), word('shine,', 'shine', ['sh','i_e','n']),
      word('like', 'like', ['l','i_e','k']), tricky('something', 'something'),
      word('from', 'from', ['f','r','o','m']), tricky('the', 'the'),
      word('shore.', 'shore', ['sh','ore']),
      tricky('Once,', 'once'), word('before', 'before', ['b','e','f','ore']),
      word('this', 'this', ['th','i','s']), word('week,', 'week', ['w','ee','k']),
      tricky('he', 'he'), word('had', 'had', ['h','a','d']),
      word('seen', 'seen', ['s','ee','n']), tricky('a', 'a'),
      word('stone', 'stone', ['s','t','o_e','n']), word('just', 'just', ['j','u','s','t']),
      word('like', 'like', ['l','i_e','k']), word('it.', 'it', ['i','t']),
      tricky('He', 'he'), word('sat', 'sat', ['s','a','t']),
      word('still', 'still', ['s','t','i','ll']), word('and', 'and', ['a','n','d']),
      word('let', 'let', ['l','e','t']), word('his', 'his', ['h','i','s']),
      word('mind', 'mind', ['m','i_e','n','d']), tricky('go', 'go'),
      word('back.', 'back', ['b','a','ck']),
    ],
    imageUrl: '/illustrations/5_1/page2.png',
  },

  // Page 3
  {
    type: 'story',
    sentences: ['Before the cold came, he went with Mum and Dad to the shore.', 'The air was fresh and the sand soft.', '"Come and explore with me!" said Dad.', 'They ran along the beach and played in the waves.', 'That night, they sat by a fire and the flames jumped and flicked.'],
    words: [
      word('Before', 'before', ['b','e','f','ore']), tricky('the', 'the'),
      word('cold', 'cold', ['c','o_e','l','d']), word('came,', 'came', ['c','a_e','m']),
      tricky('he', 'he'), word('went', 'went', ['w','e','n','t']),
      word('with', 'with', ['w','i','th']), word('Mum', 'mum', ['m','u','m']),
      word('and', 'and', ['a','n','d']), word('Dad', 'dad', ['d','a','d']),
      tricky('to', 'to'), tricky('the', 'the'),
      word('shore.', 'shore', ['sh','ore']),
      tricky('The', 'the'), word('air', 'air', ['air']),
      tricky('was', 'was'), word('fresh', 'fresh', ['f','r','e','sh']),
      word('and', 'and', ['a','n','d']), tricky('the', 'the'),
      word('sand', 'sand', ['s','a','n','d']), word('soft.', 'soft', ['s','o','f','t']),
      word('Come', 'come', ['c','o','m']), word('and', 'and', ['a','n','d']),
      word('explore', 'explore', ['e','x','p','l','ore']),
      word('with', 'with', ['w','i','th']), word('me!', 'me', ['m','ee']),
      tricky('said', 'said'), word('Dad.', 'dad', ['d','a','d']),
      tricky('They', 'they'), word('ran', 'ran', ['r','a','n']),
      word('along', 'along', ['a','l','o','ng']), tricky('the', 'the'),
      word('beach', 'beach', ['b','ea','ch']), word('and', 'and', ['a','n','d']),
      word('played', 'played', ['p','l','ay','d']), word('in', 'in', ['i','n']),
      tricky('the', 'the'), word('waves.', 'waves', ['w','a_e','v','s']),
      word('That', 'that', ['th','a','t']), word('night,', 'night', ['n','igh','t']),
      tricky('they', 'they'), word('sat', 'sat', ['s','a','t']),
      word('by', 'by', ['b','y']), tricky('a', 'a'),
      word('fire', 'fire', ['f','ire']), word('and', 'and', ['a','n','d']),
      tricky('the', 'the'), word('flames', 'flames', ['f','l','a_e','m','s']),
      word('jumped', 'jumped', ['j','u','m','p','d']),
      word('and', 'and', ['a','n','d']), word('flicked.', 'flicked', ['f','l','i','ck','d']),
    ],
    imageUrl: '/illustrations/5_1/page3.png',
  },

  // Page 4
  {
    type: 'story',
    sentences: ['The next day, he explored the rock pools.', 'He found more and more shells!', 'Mum helped him put them on a wire.', '"We can make a gift," she said.', 'He twisted the wire with care.', 'It looked so nice!'],
    words: [
      tricky('The', 'the'), word('next', 'next', ['n','e','x','t']),
      word('day,', 'day', ['d','ay']), tricky('he', 'he'),
      word('explored', 'explored', ['e','x','p','l','ore','d']),
      tricky('the', 'the'), word('rock', 'rock', ['r','o','ck']),
      word('pools.', 'pools', ['p','oo','l','s']),
      tricky('He', 'he'), word('found', 'found', ['f','ou','n','d']),
      word('more', 'more', ['m','ore']), word('and', 'and', ['a','n','d']),
      word('more', 'more', ['m','ore']), word('shells!', 'shells', ['sh','e','ll','s']),
      word('Mum', 'mum', ['m','u','m']), word('helped', 'helped', ['h','e','l','p','d']),
      word('him', 'him', ['h','i','m']), word('put', 'put', ['p','u','t']),
      word('them', 'them', ['th','e','m']), word('on', 'on', ['o','n']),
      tricky('a', 'a'), word('wire.', 'wire', ['w','ire']),
      tricky('We', 'we'), word('can', 'can', ['c','a','n']),
      word('make', 'make', ['m','a_e','k']), tricky('a', 'a'),
      word('gift,', 'gift', ['g','i','f','t']), tricky('she', 'she'),
      tricky('said.', 'said'),
      tricky('He', 'he'), word('twisted', 'twisted', ['t','w','i','s','t','e','d']),
      tricky('the', 'the'), word('wire', 'wire', ['w','ire']),
      word('with', 'with', ['w','i','th']), word('care.', 'care', ['c','air']),
      word('It', 'it', ['i','t']), word('looked', 'looked', ['l','oo','k','d']),
      tricky('so', 'so'), word('nice!', 'nice', ['n','i_e','s']),
    ],
    imageUrl: '/illustrations/5_1/page4.png',
  },

  // Page 5
  {
    type: 'story',
    sentences: ['Then it was time to go.', 'He spotted a stone by the shore.', 'It was smooth and flat.', '"Keep it safe," said Dad.', '"So you never forget this trip."', 'He put the stone in his pocket with a smile.'],
    words: [
      word('Then', 'then', ['th','e','n']), word('it', 'it', ['i','t']),
      tricky('was', 'was'), word('time', 'time', ['t','i_e','m']),
      tricky('to', 'to'), tricky('go.', 'go'),
      tricky('He', 'he'), word('spotted', 'spotted', ['s','p','o','tt','e','d']),
      tricky('a', 'a'), word('stone', 'stone', ['s','t','o_e','n']),
      word('by', 'by', ['b','y']), tricky('the', 'the'),
      word('shore.', 'shore', ['sh','ore']),
      word('It', 'it', ['i','t']), tricky('was', 'was'),
      word('smooth', 'smooth', ['s','m','oo','th']),
      word('and', 'and', ['a','n','d']), word('flat.', 'flat', ['f','l','a','t']),
      word('Keep', 'keep', ['k','ee','p']), word('it', 'it', ['i','t']),
      word('safe,', 'safe', ['s','a_e','f']), tricky('said', 'said'),
      word('Dad.', 'dad', ['d','a','d']),
      tricky('So', 'so'), tricky('you', 'you'),
      word('never', 'never', ['n','e','v','er']),
      word('forget', 'forget', ['f','or','g','e','t']),
      word('this', 'this', ['th','i','s']), word('trip.', 'trip', ['t','r','i','p']),
      tricky('He', 'he'), word('put', 'put', ['p','u','t']),
      tricky('the', 'the'), word('stone', 'stone', ['s','t','o_e','n']),
      word('in', 'in', ['i','n']), word('his', 'his', ['h','i','s']),
      word('pocket', 'pocket', ['p','o','ck','e','t']),
      word('with', 'with', ['w','i','th']), tricky('a', 'a'),
      word('smile.', 'smile', ['s','m','i_e','l']),
    ],
    imageUrl: '/illustrations/5_1/page5.png',
  },

  // Page 6
  {
    type: 'story',
    sentences: ['The boy sat up and looked around.', 'He still had that shore stone at home.', 'But in his hand was a new stone, just as smooth!', 'He held it up to the light.', 'The shore felt so close.'],
    words: [
      tricky('The', 'the'), word('boy', 'boy', ['b','oy']),
      word('sat', 'sat', ['s','a','t']), word('up', 'up', ['u','p']),
      word('and', 'and', ['a','n','d']), word('looked', 'looked', ['l','oo','k','d']),
      word('around.', 'around', ['a','r','ou','n','d']),
      tricky('He', 'he'), word('still', 'still', ['s','t','i','ll']),
      word('had', 'had', ['h','a','d']), word('that', 'that', ['th','a','t']),
      word('shore', 'shore', ['sh','ore']), word('stone', 'stone', ['s','t','o_e','n']),
      word('at', 'at', ['a','t']), word('home.', 'home', ['h','o_e','m']),
      word('But', 'but', ['b','u','t']), word('in', 'in', ['i','n']),
      word('his', 'his', ['h','i','s']), word('hand', 'hand', ['h','a','n','d']),
      tricky('was', 'was'), tricky('a', 'a'), word('new', 'new', ['n','ew']),
      word('stone,', 'stone', ['s','t','o_e','n']), word('just', 'just', ['j','u','s','t']),
      word('as', 'as', ['a','s']), word('smooth!', 'smooth', ['s','m','oo','th']),
      tricky('He', 'he'), word('held', 'held', ['h','e','l','d']),
      word('it', 'it', ['i','t']), word('up', 'up', ['u','p']),
      tricky('to', 'to'), tricky('the', 'the'),
      word('light.', 'light', ['l','igh','t']),
      tricky('The', 'the'), word('shore', 'shore', ['sh','ore']),
      word('felt', 'felt', ['f','e','l','t']), tricky('so', 'so'),
      word('close.', 'close', ['c','l','o_e','s']),
    ],
    imageUrl: '/illustrations/5_1/page6.png',
  },

  // Page 7
  {
    type: 'story',
    sentences: ['He ran home to get his shore stone.', 'Now he had a pair!', 'He took some wire and made a loop for each one.', 'He would make a gift for Mum — just like before.'],
    words: [
      tricky('He', 'he'), word('ran', 'ran', ['r','a','n']),
      word('home', 'home', ['h','o_e','m']), tricky('to', 'to'),
      word('get', 'get', ['g','e','t']), word('his', 'his', ['h','i','s']),
      word('shore', 'shore', ['sh','ore']), word('stone.', 'stone', ['s','t','o_e','n']),
      word('Now', 'now', ['n','ow']), tricky('he', 'he'),
      word('had', 'had', ['h','a','d']), tricky('a', 'a'),
      word('pair!', 'pair', ['p','air']),
      tricky('He', 'he'), word('took', 'took', ['t','oo','k']),
      tricky('some', 'some'), word('wire', 'wire', ['w','ire']),
      word('and', 'and', ['a','n','d']), word('made', 'made', ['m','a_e','d']),
      tricky('a', 'a'), word('loop', 'loop', ['l','oo','p']),
      word('for', 'for', ['f','or']), word('each', 'each', ['ea','ch']),
      word('one.', 'one', ['w','u','n']),
      tricky('He', 'he'), tricky('would', 'would'),
      word('make', 'make', ['m','a_e','k']), tricky('a', 'a'),
      word('gift', 'gift', ['g','i','f','t']), word('for', 'for', ['f','or']),
      word('Mum', 'mum', ['m','u','m']), word('just', 'just', ['j','u','s','t']),
      word('like', 'like', ['l','i_e','k']), word('before.', 'before', ['b','e','f','ore']),
    ],
    imageUrl: '/illustrations/5_1/page7.png',
  },

  // Page 8
  {
    type: 'story',
    sentences: ['He gave the stones to Mum.', '"From the shore and from the park," he said.', 'She smiled wide.', '"I will keep them with me," she said.', '"So I never forget."', 'She wore them on her bag that day.'],
    words: [
      tricky('He', 'he'), word('gave', 'gave', ['g','a_e','v']),
      tricky('the', 'the'), word('stones', 'stones', ['s','t','o_e','n','s']),
      tricky('to', 'to'), word('Mum.', 'mum', ['m','u','m']),
      word('From', 'from', ['f','r','o','m']), tricky('the', 'the'),
      word('shore', 'shore', ['sh','ore']), word('and', 'and', ['a','n','d']),
      word('from', 'from', ['f','r','o','m']), tricky('the', 'the'),
      word('park,', 'park', ['p','ar','k']), tricky('he', 'he'),
      tricky('said.', 'said'),
      tricky('She', 'she'), word('smiled', 'smiled', ['s','m','i_e','l','d']),
      word('wide.', 'wide', ['w','i_e','d']),
      tricky('I', 'I'), word('will', 'will', ['w','i','ll']),
      word('keep', 'keep', ['k','ee','p']), word('them', 'them', ['th','e','m']),
      word('with', 'with', ['w','i','th']), word('me,', 'me', ['m','ee']),
      tricky('she', 'she'), tricky('said.', 'said'),
      tricky('So', 'so'), tricky('I', 'I'),
      word('never', 'never', ['n','e','v','er']),
      word('forget.', 'forget', ['f','or','g','e','t']),
      tricky('She', 'she'), word('wore', 'wore', ['w','ore']),
      word('them', 'them', ['th','e','m']), word('on', 'on', ['o','n']),
      word('her', 'her', ['h','er']), word('bag', 'bag', ['b','a','g']),
      word('that', 'that', ['th','a','t']), word('day.', 'day', ['d','ay']),
    ],
    imageUrl: '/illustrations/5_1/page8.png',
  },

  // ── QUIZ ──
  {
    type: 'quiz',
    questions: [
      { question: 'Where did the boy go with Mum and Dad?',
        options: [{ label: 'the shore', isCorrect: true }, { label: 'the shop', isCorrect: false }, { label: 'school', isCorrect: false }] },
      { question: 'What did the boy find on the path?',
        options: [{ label: 'a stone', isCorrect: true }, { label: 'a shell', isCorrect: false }, { label: 'a coin', isCorrect: false }] },
      { question: 'What did he make for Mum?',
        options: [{ label: 'a gift with wire and stones', isCorrect: true }, { label: 'a cake', isCorrect: false }, { label: 'a card', isCorrect: false }] },
    ],
  },

  // ── SOUND SPOTLIGHTS ──
  { type: 'sound_spotlight', sound: 'ore', items: [
    { word: 'shore', imageUrl: '/images/words/shore.png', focusIndex: 2 },
    { word: 'more', imageUrl: '/images/words/more.png', focusIndex: 1 },
    { word: 'before', imageUrl: '/images/words/before.png', focusIndex: 3 },
    { word: 'explore', imageUrl: '/images/words/explore.png', focusIndex: 4 },
  ] },
  { type: 'sound_spotlight', sound: 'ire', items: [
    { word: 'fire', imageUrl: '/images/words/fire.png', focusIndex: 1 },
    { word: 'wire', imageUrl: '/images/words/wire.png', focusIndex: 1 },
    { word: 'tired', imageUrl: '/images/words/tired.png', focusIndex: 1 },
    { word: 'hire', imageUrl: '/images/words/hire.png', focusIndex: 1 },
  ] },

  // ── WORD READING ──
  { type: 'word_reading', words: [
    word('shore', 'shore', ['sh','ore']), word('fire', 'fire', ['f','ire']),
    word('wire', 'wire', ['w','ire']), word('more', 'more', ['m','ore']),
    word('before', 'before', ['b','e','f','ore']), word('explore', 'explore', ['e','x','p','l','ore']),
  ] },

  // ── TRICKY WORDS ──
  { type: 'tricky_words', words: [
    tricky('said', 'said'), tricky('was', 'was'), tricky('once', 'once'),
    tricky('would', 'would'), tricky('something', 'something'), tricky('they', 'they'),
  ] },

  // ── NONSENSE WORDS ──
  { type: 'nonsense_words', words: [
    word('blore', 'blore', ['b','l','ore']), word('glire', 'glire', ['g','l','ire']),
    word('frore', 'frore', ['f','r','ore']), word('snire', 'snire', ['s','n','ire']),
    word('plore', 'plore', ['p','l','ore']), word('drire', 'drire', ['d','r','ire']),
    word('spore', 'spore', ['s','p','ore']), word('twire', 'twire', ['t','w','ire']),
  ] },

  // ── SPELLING ──
  { type: 'spelling', words: [
    { word: 'shore', imageUrl: '/images/words/shore.png', letters: ['sh','o','r','e'] },
    { word: 'fire', imageUrl: '/images/words/fire.png', letters: ['f','i','r','e'] },
    { word: 'wire', imageUrl: '/images/words/wire.png', letters: ['w','i','r','e'] },
    { word: 'more', imageUrl: '/images/words/more.png', letters: ['m','o','r','e'] },
  ] },

  // ── STORY ORDERING ──
  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/5_1/page1.png', label: 'He found a stone.', correctIndex: 0 },
    { imageUrl: '/illustrations/5_1/page3.png', label: 'He explored the shore.', correctIndex: 1 },
    { imageUrl: '/illustrations/5_1/page4.png', label: 'He found shells.', correctIndex: 2 },
    { imageUrl: '/illustrations/5_1/page5.png', label: 'He kept a stone.', correctIndex: 3 },
    { imageUrl: '/illustrations/5_1/page7.png', label: 'He made a gift.', correctIndex: 4 },
    { imageUrl: '/illustrations/5_1/page8.png', label: 'He gave it to Mum.', correctIndex: 5 },
  ] },

  // ── DRAWING + CERTIFICATE ──
  { type: 'drawing', prompt: 'Draw Your Favourite Part' },
  { type: 'certificate', bookTitle: 'Before the Shore' },
];


// ═══════════════════════════════════════════════════════════════════════════
// L5.2 — "Near the Door"
// Focus sounds: ear, oor (Dual Perspective structure)
// Setting: Nordic cabin, girl finds a fox
// ═══════════════════════════════════════════════════════════════════════════

export const BOOK_L5_2_PAGES: InteractivePage[] = [
  { type: 'cover', title: 'Near the Door', subtitle: 'Level 5 · Confident Reader', imageUrl: '/illustrations/5_2/cover.png' },

  {
    type: 'sound_grid',
    focusSounds: ['ear', 'oor'],
    allSounds: L5_ALL_SOUNDS,
  },

  {
    type: 'vocab_preview',
    words: [
      word('near', 'near', ['n','ear']),
      word('dear', 'dear', ['d','ear']),
      word('hear', 'hear', ['h','ear']),
      word('clear', 'clear', ['c','l','ear']),
      word('fear', 'fear', ['f','ear']),
      word('door', 'door', ['d','oor']),
      word('floor', 'floor', ['f','l','oor']),
    ],
  },

  // Page 1
  {
    type: 'story',
    sentences: ['I was sitting on the floor when I heard a sound.', 'Crunch, crunch, crunch.', 'It came from near the door.', 'What could it be?', 'I crept over and put my ear to the door.', 'Crunch, crunch.', 'I heard it again.'],
    words: [
      tricky('I', 'I'), tricky('was', 'was'),
      word('sitting', 'sitting', ['s','i','tt','i','ng']),
      word('on', 'on', ['o','n']), tricky('the', 'the'),
      word('floor', 'floor', ['f','l','oor']),
      word('when', 'when', ['wh','e','n']), tricky('I', 'I'),
      word('heard', 'heard', ['h','ear','d']), tricky('a', 'a'),
      word('sound.', 'sound', ['s','ou','n','d']),
      word('Crunch,', 'crunch', ['c','r','u','n','ch']),
      word('crunch,', 'crunch', ['c','r','u','n','ch']),
      word('crunch.', 'crunch', ['c','r','u','n','ch']),
      word('It', 'it', ['i','t']), word('came', 'came', ['c','a_e','m']),
      word('from', 'from', ['f','r','o','m']),
      word('near', 'near', ['n','ear']), tricky('the', 'the'),
      word('door.', 'door', ['d','oor']),
      word('What', 'what', ['wh','o','t']), tricky('could', 'could'),
      word('it', 'it', ['i','t']), word('be?', 'be', ['b','ee']),
      tricky('I', 'I'), word('crept', 'crept', ['c','r','e','p','t']),
      tricky('over', 'over'), word('and', 'and', ['a','n','d']),
      word('put', 'put', ['p','u','t']), word('my', 'my', ['m','y']),
      word('ear', 'ear', ['ear']), tricky('to', 'to'),
      tricky('the', 'the'), word('door.', 'door', ['d','oor']),
      word('Crunch,', 'crunch', ['c','r','u','n','ch']),
      word('crunch.', 'crunch', ['c','r','u','n','ch']),
      tricky('I', 'I'), word('heard', 'heard', ['h','ear','d']),
      word('it', 'it', ['i','t']), word('again.', 'again', ['a','g','ai','n']),
    ],
    imageUrl: '/illustrations/5_2/page1.png',
  },

  // Page 2
  {
    type: 'story',
    sentences: ['Dad heard it too.', 'He was in his seat by the fire.', 'He looked at me and smiled.', '"I can tell what that is," he said.', '"It is clear to me. But I will not say."'],
    words: [
      word('Dad', 'dad', ['d','a','d']), word('heard', 'heard', ['h','ear','d']),
      word('it', 'it', ['i','t']), word('too.', 'too', ['t','oo']),
      tricky('He', 'he'), tricky('was', 'was'), word('in', 'in', ['i','n']),
      word('his', 'his', ['h','i','s']), word('seat', 'seat', ['s','ea','t']),
      word('by', 'by', ['b','y']), tricky('the', 'the'),
      word('fire.', 'fire', ['f','ire']),
      tricky('He', 'he'), word('looked', 'looked', ['l','oo','k','d']),
      word('at', 'at', ['a','t']), word('me', 'me', ['m','ee']),
      word('and', 'and', ['a','n','d']), word('smiled.', 'smiled', ['s','m','i_e','l','d']),
      tricky('I', 'I'), word('can', 'can', ['c','a','n']),
      word('tell', 'tell', ['t','e','ll']), word('what', 'what', ['wh','o','t']),
      word('that', 'that', ['th','a','t']), word('is,', 'is', ['i','z']),
      tricky('he', 'he'), tricky('said.', 'said'),
      word('It', 'it', ['i','t']), word('is', 'is', ['i','z']),
      word('clear', 'clear', ['c','l','ear']), tricky('to', 'to'),
      word('me.', 'me', ['m','ee']), word('But', 'but', ['b','u','t']),
      tricky('I', 'I'), word('will', 'will', ['w','i','ll']),
      word('not', 'not', ['n','o','t']), word('say.', 'say', ['s','ay']),
    ],
    imageUrl: '/illustrations/5_2/page2.png',
  },

  // Page 3
  {
    type: 'story',
    sentences: ['But what was it?', 'I saw a dark shape near the door through the window.', 'It seemed to shift in the snow.', 'Was it a big beast from the forest?', 'My heart beat fast.', 'I felt a little fear.'],
    words: [
      word('But', 'but', ['b','u','t']), word('what', 'what', ['wh','o','t']),
      tricky('was', 'was'), word('it?', 'it', ['i','t']),
      tricky('I', 'I'), word('saw', 'saw', ['s','aw']),
      tricky('a', 'a'), word('dark', 'dark', ['d','ar','k']),
      word('shape', 'shape', ['sh','a_e','p']),
      word('near', 'near', ['n','ear']), tricky('the', 'the'),
      word('door', 'door', ['d','oor']), tricky('through', 'through'),
      tricky('the', 'the'), word('window.', 'window', ['w','i','n','d','ow']),
      word('It', 'it', ['i','t']), word('seemed', 'seemed', ['s','ee','m','d']),
      tricky('to', 'to'), word('shift', 'shift', ['sh','i','f','t']),
      word('in', 'in', ['i','n']), tricky('the', 'the'),
      word('snow.', 'snow', ['s','n','ow']),
      tricky('Was', 'was'), word('it', 'it', ['i','t']),
      tricky('a', 'a'), word('big', 'big', ['b','i','g']),
      word('beast', 'beast', ['b','ea','s','t']), word('from', 'from', ['f','r','o','m']),
      tricky('the', 'the'), word('forest?', 'forest', ['f','o','r','e','s','t']),
      word('My', 'my', ['m','y']), word('heart', 'heart', ['h','ear','t']),
      word('beat', 'beat', ['b','ea','t']), word('fast.', 'fast', ['f','a','s','t']),
      tricky('I', 'I'), word('felt', 'felt', ['f','e','l','t']),
      tricky('a', 'a'), word('little', 'little', ['l','i','tt','l']),
      word('fear.', 'fear', ['f','ear']),
    ],
    imageUrl: '/illustrations/5_2/page3.png',
  },

  // Page 4
  {
    type: 'story',
    sentences: ['Dad just sat and smiled at me.', '"My dear," he said, "you do not need to fear.', 'Just open the door and look.', 'You will see what it is."'],
    words: [
      word('Dad', 'dad', ['d','a','d']), word('just', 'just', ['j','u','s','t']),
      word('sat', 'sat', ['s','a','t']), word('and', 'and', ['a','n','d']),
      word('smiled', 'smiled', ['s','m','i_e','l','d']),
      word('at', 'at', ['a','t']), word('me.', 'me', ['m','ee']),
      word('My', 'my', ['m','y']), word('dear,', 'dear', ['d','ear']),
      tricky('he', 'he'), tricky('said,', 'said'),
      tricky('you', 'you'), tricky('do', 'do'),
      word('not', 'not', ['n','o','t']), word('need', 'need', ['n','ee','d']),
      tricky('to', 'to'), word('fear.', 'fear', ['f','ear']),
      word('Just', 'just', ['j','u','s','t']),
      word('open', 'open', ['o_e','p','e','n']),
      tricky('the', 'the'), word('door', 'door', ['d','oor']),
      word('and', 'and', ['a','n','d']), word('look.', 'look', ['l','oo','k']),
      tricky('You', 'you'), word('will', 'will', ['w','i','ll']),
      word('see', 'see', ['s','ee']), word('what', 'what', ['wh','o','t']),
      word('it', 'it', ['i','t']), word('is.', 'is', ['i','z']),
    ],
    imageUrl: '/illustrations/5_2/page4.png',
  },

  // Page 5
  {
    type: 'story',
    sentences: ['I reached for the door.', 'My hand felt cool on the handle.', 'I pulled the door wide open.', 'And sitting in the snow was... a fox!', 'A soft red fox with big, pointed ears!'],
    words: [
      tricky('I', 'I'), word('reached', 'reached', ['r','ea','ch','d']),
      word('for', 'for', ['f','or']), tricky('the', 'the'),
      word('door.', 'door', ['d','oor']),
      word('My', 'my', ['m','y']), word('hand', 'hand', ['h','a','n','d']),
      word('felt', 'felt', ['f','e','l','t']), word('cool', 'cool', ['c','oo','l']),
      word('on', 'on', ['o','n']), tricky('the', 'the'),
      word('handle.', 'handle', ['h','a','n','d','l']),
      tricky('I', 'I'), word('pulled', 'pulled', ['p','u','ll','d']),
      tricky('the', 'the'), word('door', 'door', ['d','oor']),
      word('wide', 'wide', ['w','i_e','d']),
      word('open.', 'open', ['o_e','p','e','n']),
      word('And', 'and', ['a','n','d']), word('sitting', 'sitting', ['s','i','tt','i','ng']),
      word('in', 'in', ['i','n']), tricky('the', 'the'),
      word('snow', 'snow', ['s','n','ow']), tricky('was', 'was'),
      tricky('a', 'a'), word('fox!', 'fox', ['f','o','x']),
      tricky('A', 'a'), word('soft', 'soft', ['s','o','f','t']),
      word('red', 'red', ['r','e','d']), word('fox', 'fox', ['f','o','x']),
      word('with', 'with', ['w','i','th']), word('big,', 'big', ['b','i','g']),
      word('pointed', 'pointed', ['p','oi','n','t','e','d']),
      word('ears!', 'ears', ['ear','s']),
    ],
    imageUrl: '/illustrations/5_2/page5.png',
  },

  // Page 6
  {
    type: 'story',
    sentences: ['Dad stood up and came over.', '"I have been feeding him," he said.', '"The poor little thing was so thin.', 'He comes near when he is looking for food."'],
    words: [
      word('Dad', 'dad', ['d','a','d']), word('stood', 'stood', ['s','t','oo','d']),
      word('up', 'up', ['u','p']), word('and', 'and', ['a','n','d']),
      word('came', 'came', ['c','a_e','m']), tricky('over.', 'over'),
      tricky('I', 'I'), tricky('have', 'have'),
      word('been', 'been', ['b','ee','n']),
      word('feeding', 'feeding', ['f','ee','d','i','ng']),
      word('him,', 'him', ['h','i','m']), tricky('he', 'he'),
      tricky('said.', 'said'),
      tricky('The', 'the'), word('poor', 'poor', ['p','oor']),
      word('little', 'little', ['l','i','tt','l']),
      word('thing', 'thing', ['th','i','ng']), tricky('was', 'was'),
      tricky('so', 'so'), word('thin.', 'thin', ['th','i','n']),
      tricky('He', 'he'), word('comes', 'comes', ['c','o','m','s']),
      word('near', 'near', ['n','ear']), word('when', 'when', ['wh','e','n']),
      tricky('he', 'he'), word('is', 'is', ['i','z']),
      word('looking', 'looking', ['l','oo','k','i','ng']),
      word('for', 'for', ['f','or']), word('food.', 'food', ['f','oo','d']),
    ],
    imageUrl: '/illustrations/5_2/page6.png',
  },

  // Page 7
  {
    type: 'story',
    sentences: ['Dad got some food and set it on the floor of the step.', 'The fox crept near, his feet soft on the snow.', 'He ate and ate!', 'His tail flicked as he munched.', 'I sat on the floor and just looked at him.'],
    words: [
      word('Dad', 'dad', ['d','a','d']), word('got', 'got', ['g','o','t']),
      tricky('some', 'some'), word('food', 'food', ['f','oo','d']),
      word('and', 'and', ['a','n','d']), word('set', 'set', ['s','e','t']),
      word('it', 'it', ['i','t']), word('on', 'on', ['o','n']),
      tricky('the', 'the'), word('floor', 'floor', ['f','l','oor']),
      tricky('of', 'of'), tricky('the', 'the'),
      word('step.', 'step', ['s','t','e','p']),
      tricky('The', 'the'), word('fox', 'fox', ['f','o','x']),
      word('crept', 'crept', ['c','r','e','p','t']),
      word('near,', 'near', ['n','ear']),
      word('his', 'his', ['h','i','s']), word('feet', 'feet', ['f','ee','t']),
      word('soft', 'soft', ['s','o','f','t']), word('on', 'on', ['o','n']),
      tricky('the', 'the'), word('snow.', 'snow', ['s','n','ow']),
      tricky('He', 'he'), word('ate', 'ate', ['a_e','t']),
      word('and', 'and', ['a','n','d']), word('ate!', 'ate', ['a_e','t']),
      word('His', 'his', ['h','i','s']), word('tail', 'tail', ['t','ai','l']),
      word('flicked', 'flicked', ['f','l','i','ck','d']),
      word('as', 'as', ['a','s']), tricky('he', 'he'),
      word('munched.', 'munched', ['m','u','n','ch','d']),
      tricky('I', 'I'), word('sat', 'sat', ['s','a','t']),
      word('on', 'on', ['o','n']), tricky('the', 'the'),
      word('floor', 'floor', ['f','l','oor']),
      word('and', 'and', ['a','n','d']), word('just', 'just', ['j','u','s','t']),
      word('looked', 'looked', ['l','oo','k','d']),
      word('at', 'at', ['a','t']), word('him.', 'him', ['h','i','m']),
    ],
    imageUrl: '/illustrations/5_2/page7.png',
  },

  // Page 8
  {
    type: 'story',
    sentences: ['"Dear little fox," I said to him.', '"You are safe. Come back soon."', 'Dad smiled at me.', '"He will, my dear. He can tell that we are his friends."', 'The fox looked up, then ran back into the trees.'],
    words: [
      word('Dear', 'dear', ['d','ear']), word('little', 'little', ['l','i','tt','l']),
      word('fox,', 'fox', ['f','o','x']), tricky('I', 'I'),
      tricky('said', 'said'), tricky('to', 'to'),
      word('him.', 'him', ['h','i','m']),
      tricky('You', 'you'), tricky('are', 'are'),
      word('safe.', 'safe', ['s','a_e','f']),
      word('Come', 'come', ['c','o','m']), word('back', 'back', ['b','a','ck']),
      word('soon.', 'soon', ['s','oo','n']),
      word('Dad', 'dad', ['d','a','d']), word('smiled', 'smiled', ['s','m','i_e','l','d']),
      word('at', 'at', ['a','t']), word('me.', 'me', ['m','ee']),
      tricky('He', 'he'), word('will,', 'will', ['w','i','ll']),
      word('my', 'my', ['m','y']), word('dear.', 'dear', ['d','ear']),
      tricky('He', 'he'), word('can', 'can', ['c','a','n']),
      word('tell', 'tell', ['t','e','ll']), word('that', 'that', ['th','a','t']),
      tricky('we', 'we'), tricky('are', 'are'),
      word('his', 'his', ['h','i','s']), word('friends.', 'friends', ['f','r','e','n','d','s']),
      tricky('The', 'the'), word('fox', 'fox', ['f','o','x']),
      word('looked', 'looked', ['l','oo','k','d']),
      word('up,', 'up', ['u','p']), word('then', 'then', ['th','e','n']),
      word('ran', 'ran', ['r','a','n']), word('back', 'back', ['b','a','ck']),
      word('into', 'into', ['i','n','t','oo']),
      tricky('the', 'the'), word('trees.', 'trees', ['t','r','ee','s']),
    ],
    imageUrl: '/illustrations/5_2/page8.png',
  },

  // ── QUIZ ──
  {
    type: 'quiz',
    questions: [
      { question: 'What was the crunching sound near the door?',
        options: [{ label: 'a fox', isCorrect: true }, { label: 'a bear', isCorrect: false }, { label: 'a cat', isCorrect: false }] },
      { question: 'Why did the fox come near?',
        options: [{ label: 'he was looking for food', isCorrect: true }, { label: 'he was lost', isCorrect: false }, { label: 'he was cold', isCorrect: false }] },
      { question: 'How did the girl feel at the end?',
        options: [{ label: 'happy', isCorrect: true }, { label: 'scared', isCorrect: false }, { label: 'sad', isCorrect: false }] },
    ],
  },

  // ── SOUND SPOTLIGHTS ──
  { type: 'sound_spotlight', sound: 'ear', items: [
    { word: 'near', imageUrl: '/images/words/near.png', focusIndex: 1 },
    { word: 'dear', imageUrl: '/images/words/dear.png', focusIndex: 1 },
    { word: 'hear', imageUrl: '/images/words/hear.png', focusIndex: 1 },
    { word: 'fear', imageUrl: '/images/words/fear.png', focusIndex: 1 },
  ] },
  { type: 'sound_spotlight', sound: 'oor', items: [
    { word: 'door', imageUrl: '/images/words/door.png', focusIndex: 1 },
    { word: 'floor', imageUrl: '/images/words/floor.png', focusIndex: 2 },
    { word: 'poor', imageUrl: '/images/words/poor.png', focusIndex: 1 },
    { word: 'moor', imageUrl: '/images/words/moor.png', focusIndex: 1 },
  ] },

  { type: 'word_reading', words: [
    word('near', 'near', ['n','ear']), word('dear', 'dear', ['d','ear']),
    word('fear', 'fear', ['f','ear']), word('door', 'door', ['d','oor']),
    word('floor', 'floor', ['f','l','oor']), word('clear', 'clear', ['c','l','ear']),
  ] },

  { type: 'tricky_words', words: [
    tricky('said', 'said'), tricky('was', 'was'), tricky('could', 'could'),
    tricky('through', 'through'), tricky('over', 'over'), tricky('are', 'are'),
  ] },

  { type: 'nonsense_words', words: [
    word('snear', 'snear', ['s','n','ear']), word('gloor', 'gloor', ['g','l','oor']),
    word('drear', 'drear', ['d','r','ear']), word('ploor', 'ploor', ['p','l','oor']),
    word('frear', 'frear', ['f','r','ear']), word('broor', 'broor', ['b','r','oor']),
    word('spear', 'spear', ['s','p','ear']), word('troor', 'troor', ['t','r','oor']),
  ] },

  { type: 'spelling', words: [
    { word: 'near', imageUrl: '/images/words/near.png', letters: ['n','e','a','r'] },
    { word: 'dear', imageUrl: '/images/words/dear.png', letters: ['d','e','a','r'] },
    { word: 'door', imageUrl: '/images/words/door.png', letters: ['d','o','o','r'] },
    { word: 'fear', imageUrl: '/images/words/fear.png', letters: ['f','e','a','r'] },
  ] },

  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/5_2/page1.png', label: 'I heard a sound.', correctIndex: 0 },
    { imageUrl: '/illustrations/5_2/page3.png', label: 'I saw a shape.', correctIndex: 1 },
    { imageUrl: '/illustrations/5_2/page5.png', label: 'It was a fox!', correctIndex: 2 },
    { imageUrl: '/illustrations/5_2/page6.png', label: 'Dad was feeding him.', correctIndex: 3 },
    { imageUrl: '/illustrations/5_2/page7.png', label: 'The fox ate and ate.', correctIndex: 4 },
    { imageUrl: '/illustrations/5_2/page8.png', label: 'The fox ran back.', correctIndex: 5 },
  ] },

  { type: 'drawing', prompt: 'Draw Your Favourite Part' },
  { type: 'certificate', bookTitle: 'Near the Door' },
];


// ═══════════════════════════════════════════════════════════════════════════
// L5.3 — "Sure She Can"
// Focus sounds: ure, tion (Embedded Instructions structure)
// Setting: Jaipur kite festival, girl makes a kite with Dadaji
// ═══════════════════════════════════════════════════════════════════════════

export const BOOK_L5_3_PAGES: InteractivePage[] = [
  { type: 'cover', title: 'Sure She Can', subtitle: 'Level 5 · Confident Reader', imageUrl: '/illustrations/5_3/cover.png' },

  {
    type: 'sound_grid',
    focusSounds: ['ure', 'tion'],
    allSounds: L5_ALL_SOUNDS,
  },

  {
    type: 'vocab_preview',
    words: [
      word('sure', 'sure', ['sh','ure']),
      word('pure', 'pure', ['p','ure']),
      word('attention', 'attention', ['a','tt','e','n','tion']),
      word('section', 'section', ['s','e','c','tion']),
      word('direction', 'direction', ['d','i','r','e','c','tion']),
      word('concentration', 'concentration', ['c','o','n','s','e','n','t','r','a','tion']),
      word('frustration', 'frustration', ['f','r','u','s','t','r','a','tion']),
      word('action', 'action', ['a','c','tion']),
    ],
  },

  // Page 1
  {
    type: 'story',
    sentences: ['Kites of every colour filled the sky over Jaipur.', 'Red and green and blue, they soared and spun and dipped in the clear winter air.', 'The girl stood on the rooftop and watched with wide eyes.', 'She wanted to fly a kite more than anything.', 'But she did not own one.'],
    words: [
      word('Kites', 'kites', ['k','i_e','t','s']), tricky('of', 'of'),
      word('every', 'every', ['e','v','r','ee']),
      word('colour', 'colour', ['c','o','l','er']),
      word('filled', 'filled', ['f','i','ll','d']),
      tricky('the', 'the'), word('sky', 'sky', ['s','k','y']),
      tricky('over', 'over'), word('Jaipur.', 'jaipur', ['j','ai','p','ure']),
      word('Red', 'red', ['r','e','d']), word('and', 'and', ['a','n','d']),
      word('green', 'green', ['g','r','ee','n']), word('and', 'and', ['a','n','d']),
      word('blue,', 'blue', ['b','l','ue']), tricky('they', 'they'),
      word('soared', 'soared', ['s','ore','d']),
      word('and', 'and', ['a','n','d']), word('spun', 'spun', ['s','p','u','n']),
      word('and', 'and', ['a','n','d']), word('dipped', 'dipped', ['d','i','pp','d']),
      word('in', 'in', ['i','n']), tricky('the', 'the'),
      word('clear', 'clear', ['c','l','ear']),
      word('winter', 'winter', ['w','i','n','t','er']),
      word('air.', 'air', ['air']),
      tricky('The', 'the'), word('girl', 'girl', ['g','er','l']),
      word('stood', 'stood', ['s','t','oo','d']), word('on', 'on', ['o','n']),
      tricky('the', 'the'), word('rooftop', 'rooftop', ['r','oo','f','t','o','p']),
      word('and', 'and', ['a','n','d']), word('watched', 'watched', ['w','o','t','ch','d']),
      word('with', 'with', ['w','i','th']), word('wide', 'wide', ['w','i_e','d']),
      word('eyes.', 'eyes', ['eye','s']),
      tricky('She', 'she'), word('wanted', 'wanted', ['w','o','n','t','e','d']),
      tricky('to', 'to'), word('fly', 'fly', ['f','l','y']),
      tricky('a', 'a'), word('kite', 'kite', ['k','i_e','t']),
      word('more', 'more', ['m','ore']), word('than', 'than', ['th','a','n']),
      word('anything.', 'anything', ['e','n','ee','th','i','ng']),
      word('But', 'but', ['b','u','t']), tricky('she', 'she'),
      word('did', 'did', ['d','i','d']), word('not', 'not', ['n','o','t']),
      word('own', 'own', ['ow','n']), word('one.', 'one', ['w','u','n']),
    ],
    imageUrl: '/illustrations/5_3/page1.png',
  },

  // Page 2
  {
    type: 'story',
    sentences: ['Dadaji sat near the wall, smiling at all the kites.', 'He held up a thin sheet of paper and two bamboo sticks.', '"We can make one," he said.', '"I can show you the instructions.', 'Pay close attention and follow each step."', 'She felt a rush of joy.'],
    words: [
      word('Dadaji', 'dadaji', ['d','a','d','a','j','ee']),
      word('sat', 'sat', ['s','a','t']), word('near', 'near', ['n','ear']),
      tricky('the', 'the'), word('wall,', 'wall', ['w','a','ll']),
      word('smiling', 'smiling', ['s','m','i_e','l','i','ng']),
      word('at', 'at', ['a','t']), word('all', 'all', ['a','ll']),
      tricky('the', 'the'), word('kites.', 'kites', ['k','i_e','t','s']),
      tricky('He', 'he'), word('held', 'held', ['h','e','l','d']),
      word('up', 'up', ['u','p']), tricky('a', 'a'),
      word('thin', 'thin', ['th','i','n']), word('sheet', 'sheet', ['sh','ee','t']),
      tricky('of', 'of'), word('paper', 'paper', ['p','a_e','p','er']),
      word('and', 'and', ['a','n','d']), tricky('two', 'two'),
      word('bamboo', 'bamboo', ['b','a','m','b','oo']),
      word('sticks.', 'sticks', ['s','t','i','ck','s']),
      tricky('We', 'we'), word('can', 'can', ['c','a','n']),
      word('make', 'make', ['m','a_e','k']), word('one,', 'one', ['w','u','n']),
      tricky('he', 'he'), tricky('said.', 'said'),
      tricky('I', 'I'), word('can', 'can', ['c','a','n']),
      word('show', 'show', ['sh','ow']), tricky('you', 'you'),
      tricky('the', 'the'), word('instructions.', 'instructions', ['i','n','s','t','r','u','c','tion','s']),
      word('Pay', 'pay', ['p','ay']), word('close', 'close', ['c','l','o_e','s']),
      word('attention', 'attention', ['a','tt','e','n','tion']),
      word('and', 'and', ['a','n','d']), word('follow', 'follow', ['f','o','ll','ow']),
      word('each', 'each', ['ea','ch']), word('step.', 'step', ['s','t','e','p']),
      tricky('She', 'she'), word('felt', 'felt', ['f','e','l','t']),
      tricky('a', 'a'), word('rush', 'rush', ['r','u','sh']),
      tricky('of', 'of'), word('joy.', 'joy', ['j','oy']),
    ],
    imageUrl: '/illustrations/5_3/page2.png',
  },

  // Pages 3-8 (condensed for brevity — same pattern)
  {
    type: 'story',
    sentences: ['"Step one," said Dadaji.', '"Lay the sticks in a cross shape.', 'Tie them at this section here — that is the frame."', 'With great concentration, the girl tied the sticks.', '"Perfect!" said Dadaji.', '"Now pass the string around each point."'],
    words: [
      word('Step', 'step', ['s','t','e','p']), word('one,', 'one', ['w','u','n']),
      tricky('said', 'said'), word('Dadaji.', 'dadaji', ['d','a','d','a','j','ee']),
      word('Lay', 'lay', ['l','ay']), tricky('the', 'the'),
      word('sticks', 'sticks', ['s','t','i','ck','s']), word('in', 'in', ['i','n']),
      tricky('a', 'a'), word('cross', 'cross', ['c','r','o','ss']),
      word('shape.', 'shape', ['sh','a_e','p']),
      word('Tie', 'tie', ['t','ie']), word('them', 'them', ['th','e','m']),
      word('at', 'at', ['a','t']), word('this', 'this', ['th','i','s']),
      word('section', 'section', ['s','e','c','tion']),
      word('here', 'here', ['h','ear']), word('that', 'that', ['th','a','t']),
      word('is', 'is', ['i','z']), tricky('the', 'the'),
      word('frame.', 'frame', ['f','r','a_e','m']),
      word('With', 'with', ['w','i','th']), word('great', 'great', ['g','r','ea','t']),
      word('concentration,', 'concentration', ['c','o','n','s','e','n','t','r','a','tion']),
      tricky('the', 'the'), word('girl', 'girl', ['g','er','l']),
      word('tied', 'tied', ['t','ie','d']), tricky('the', 'the'),
      word('sticks.', 'sticks', ['s','t','i','ck','s']),
      word('Perfect!', 'perfect', ['p','er','f','e','c','t']),
      tricky('said', 'said'), word('Dadaji.', 'dadaji', ['d','a','d','a','j','ee']),
      word('Now', 'now', ['n','ow']), word('pass', 'pass', ['p','a','ss']),
      tricky('the', 'the'), word('string', 'string', ['s','t','r','i','ng']),
      word('around', 'around', ['a','r','ou','n','d']),
      word('each', 'each', ['ea','ch']), word('point.', 'point', ['p','oi','n','t']),
    ],
    imageUrl: '/illustrations/5_3/page3.png',
  },

  {
    type: 'story',
    sentences: ['"Step two," said Dadaji.', '"Lay the paper flat on the frame.', 'Fold each section over the string and press it down."', 'The girl worked fast.', 'But the paper slipped.', 'There was a rip — a long split ran right through the kite.', 'Her heart sank.'],
    words: [
      word('Step', 'step', ['s','t','e','p']), tricky('two,', 'two'),
      tricky('said', 'said'), word('Dadaji.', 'dadaji', ['d','a','d','a','j','ee']),
      word('Lay', 'lay', ['l','ay']), tricky('the', 'the'),
      word('paper', 'paper', ['p','a_e','p','er']),
      word('flat', 'flat', ['f','l','a','t']), word('on', 'on', ['o','n']),
      tricky('the', 'the'), word('frame.', 'frame', ['f','r','a_e','m']),
      word('Fold', 'fold', ['f','o_e','l','d']), word('each', 'each', ['ea','ch']),
      word('section', 'section', ['s','e','c','tion']),
      tricky('over', 'over'), tricky('the', 'the'),
      word('string', 'string', ['s','t','r','i','ng']),
      word('and', 'and', ['a','n','d']), word('press', 'press', ['p','r','e','ss']),
      word('it', 'it', ['i','t']), word('down.', 'down', ['d','ow','n']),
      tricky('The', 'the'), word('girl', 'girl', ['g','er','l']),
      word('worked', 'worked', ['w','er','k','d']),
      word('fast.', 'fast', ['f','a','s','t']),
      word('But', 'but', ['b','u','t']), tricky('the', 'the'),
      word('paper', 'paper', ['p','a_e','p','er']),
      word('slipped.', 'slipped', ['s','l','i','pp','d']),
      tricky('There', 'there'), tricky('was', 'was'),
      tricky('a', 'a'), word('rip', 'rip', ['r','i','p']),
      tricky('a', 'a'), word('long', 'long', ['l','o','ng']),
      word('split', 'split', ['s','p','l','i','t']),
      word('ran', 'ran', ['r','a','n']), word('right', 'right', ['r','igh','t']),
      tricky('through', 'through'), tricky('the', 'the'),
      word('kite.', 'kite', ['k','i_e','t']),
      word('Her', 'her', ['h','er']), word('heart', 'heart', ['h','ear','t']),
      word('sank.', 'sank', ['s','a','nk']),
    ],
    imageUrl: '/illustrations/5_3/page4.png',
  },

  {
    type: 'story',
    sentences: ['The girl crumpled the torn paper in her hands.', '"I am full of frustration!" she said.', '"I give up!"', 'Dadaji did not rush.', 'He sat with a calm look on his face and waited.', '"Are you sure you want to stop?" he said softly.', '"We are not done yet."'],
    words: [
      tricky('The', 'the'), word('girl', 'girl', ['g','er','l']),
      word('crumpled', 'crumpled', ['c','r','u','m','p','l','d']),
      tricky('the', 'the'), word('torn', 'torn', ['t','ore','n']),
      word('paper', 'paper', ['p','a_e','p','er']),
      word('in', 'in', ['i','n']), word('her', 'her', ['h','er']),
      word('hands.', 'hands', ['h','a','n','d','s']),
      tricky('I', 'I'), word('am', 'am', ['a','m']),
      word('full', 'full', ['f','u','ll']), tricky('of', 'of'),
      word('frustration!', 'frustration', ['f','r','u','s','t','r','a','tion']),
      tricky('she', 'she'), tricky('said.', 'said'),
      tricky('I', 'I'), word('give', 'give', ['g','i','v']),
      word('up!', 'up', ['u','p']),
      word('Dadaji', 'dadaji', ['d','a','d','a','j','ee']),
      word('did', 'did', ['d','i','d']), word('not', 'not', ['n','o','t']),
      word('rush.', 'rush', ['r','u','sh']),
      tricky('He', 'he'), word('sat', 'sat', ['s','a','t']),
      word('with', 'with', ['w','i','th']), tricky('a', 'a'),
      word('calm', 'calm', ['c','ar','m']),
      word('look', 'look', ['l','oo','k']), word('on', 'on', ['o','n']),
      word('his', 'his', ['h','i','s']), word('face', 'face', ['f','a_e','s']),
      word('and', 'and', ['a','n','d']), word('waited.', 'waited', ['w','ai','t','e','d']),
      tricky('Are', 'are'), tricky('you', 'you'),
      word('sure', 'sure', ['sh','ure']), tricky('you', 'you'),
      word('want', 'want', ['w','o','n','t']), tricky('to', 'to'),
      word('stop?', 'stop', ['s','t','o','p']),
      tricky('he', 'he'), tricky('said', 'said'),
      word('softly.', 'softly', ['s','o','f','t','l','ee']),
      tricky('We', 'we'), tricky('are', 'are'),
      word('not', 'not', ['n','o','t']), word('done', 'done', ['d','u','n']),
      word('yet.', 'yet', ['y','e','t']),
    ],
    imageUrl: '/illustrations/5_3/page5.png',
  },

  {
    type: 'story',
    sentences: ['The girl took a long breath and tried again.', '"Slow action this time," said Dadaji.', '"Press each section flat before you move on.', 'Work in one direction only."', 'She worked with great care.', 'She pressed. She smoothed. She waited.', 'The paper held.', '"It is working!" she cried.'],
    words: [
      tricky('The', 'the'), word('girl', 'girl', ['g','er','l']),
      word('took', 'took', ['t','oo','k']), tricky('a', 'a'),
      word('long', 'long', ['l','o','ng']), word('breath', 'breath', ['b','r','e','th']),
      word('and', 'and', ['a','n','d']), word('tried', 'tried', ['t','r','ie','d']),
      word('again.', 'again', ['a','g','ai','n']),
      word('Slow', 'slow', ['s','l','ow']),
      word('action', 'action', ['a','c','tion']),
      word('this', 'this', ['th','i','s']), word('time,', 'time', ['t','i_e','m']),
      tricky('said', 'said'), word('Dadaji.', 'dadaji', ['d','a','d','a','j','ee']),
      word('Press', 'press', ['p','r','e','ss']), word('each', 'each', ['ea','ch']),
      word('section', 'section', ['s','e','c','tion']),
      word('flat', 'flat', ['f','l','a','t']),
      word('before', 'before', ['b','e','f','ore']),
      tricky('you', 'you'), word('move', 'move', ['m','oo','v']),
      word('on.', 'on', ['o','n']),
      word('Work', 'work', ['w','er','k']), word('in', 'in', ['i','n']),
      word('one', 'one', ['w','u','n']),
      word('direction', 'direction', ['d','i','r','e','c','tion']),
      word('only.', 'only', ['o_e','n','l','ee']),
      tricky('She', 'she'), word('worked', 'worked', ['w','er','k','d']),
      word('with', 'with', ['w','i','th']), word('great', 'great', ['g','r','ea','t']),
      word('care.', 'care', ['c','air']),
      tricky('She', 'she'), word('pressed.', 'pressed', ['p','r','e','ss','d']),
      tricky('She', 'she'), word('smoothed.', 'smoothed', ['s','m','oo','th','d']),
      tricky('She', 'she'), word('waited.', 'waited', ['w','ai','t','e','d']),
      tricky('The', 'the'), word('paper', 'paper', ['p','a_e','p','er']),
      word('held.', 'held', ['h','e','l','d']),
      word('It', 'it', ['i','t']), word('is', 'is', ['i','z']),
      word('working!', 'working', ['w','er','k','i','ng']),
      tricky('she', 'she'), word('cried.', 'cried', ['c','r','ie','d']),
    ],
    imageUrl: '/illustrations/5_3/page6.png',
  },

  {
    type: 'story',
    sentences: ['At last, the kite was done.', '"Look at the picture we made!" she cried.', 'Dadaji tied the string to the centre.', '"Now for the action!" he said.', '"Run in that direction and let the wind catch it!"', 'She ran with all her might and let the string out.'],
    words: [
      word('At', 'at', ['a','t']), word('last,', 'last', ['l','a','s','t']),
      tricky('the', 'the'), word('kite', 'kite', ['k','i_e','t']),
      tricky('was', 'was'), word('done.', 'done', ['d','u','n']),
      word('Look', 'look', ['l','oo','k']), word('at', 'at', ['a','t']),
      tricky('the', 'the'), word('picture', 'picture', ['p','i','c','t','ure']),
      tricky('we', 'we'), word('made!', 'made', ['m','a_e','d']),
      tricky('she', 'she'), word('cried.', 'cried', ['c','r','ie','d']),
      word('Dadaji', 'dadaji', ['d','a','d','a','j','ee']),
      word('tied', 'tied', ['t','ie','d']), tricky('the', 'the'),
      word('string', 'string', ['s','t','r','i','ng']),
      tricky('to', 'to'), tricky('the', 'the'),
      word('centre.', 'centre', ['s','e','n','t','er']),
      word('Now', 'now', ['n','ow']), word('for', 'for', ['f','or']),
      tricky('the', 'the'), word('action!', 'action', ['a','c','tion']),
      tricky('he', 'he'), tricky('said.', 'said'),
      word('Run', 'run', ['r','u','n']), word('in', 'in', ['i','n']),
      word('that', 'that', ['th','a','t']),
      word('direction', 'direction', ['d','i','r','e','c','tion']),
      word('and', 'and', ['a','n','d']), word('let', 'let', ['l','e','t']),
      tricky('the', 'the'), word('wind', 'wind', ['w','i','n','d']),
      word('catch', 'catch', ['c','a','tch']),
      word('it!', 'it', ['i','t']),
      tricky('She', 'she'), word('ran', 'ran', ['r','a','n']),
      word('with', 'with', ['w','i','th']), word('all', 'all', ['a','ll']),
      word('her', 'her', ['h','er']), word('might', 'might', ['m','igh','t']),
      word('and', 'and', ['a','n','d']), word('let', 'let', ['l','e','t']),
      tricky('the', 'the'), word('string', 'string', ['s','t','r','i','ng']),
      word('out.', 'out', ['ou','t']),
    ],
    imageUrl: '/illustrations/5_3/page7.png',
  },

  {
    type: 'story',
    sentences: ['The kite shot up into the pure blue sky.', 'It soared higher and higher!', '"Woh Kata!" cheered the people on the next rooftop.', 'Dadaji clapped his hands with joy.', 'The girl watched her kite spin and dance over the pink city.', '"Pure joy!" she cried. "Pure joy!"'],
    words: [
      tricky('The', 'the'), word('kite', 'kite', ['k','i_e','t']),
      word('shot', 'shot', ['sh','o','t']), word('up', 'up', ['u','p']),
      word('into', 'into', ['i','n','t','oo']),
      tricky('the', 'the'), word('pure', 'pure', ['p','ure']),
      word('blue', 'blue', ['b','l','ue']), word('sky.', 'sky', ['s','k','y']),
      word('It', 'it', ['i','t']), word('soared', 'soared', ['s','ore','d']),
      word('higher', 'higher', ['h','igh','er']),
      word('and', 'and', ['a','n','d']), word('higher!', 'higher', ['h','igh','er']),
      word('Woh', 'woh', ['w','o','h']), word('Kata!', 'kata', ['k','a','t','a']),
      word('cheered', 'cheered', ['ch','ear','d']),
      tricky('the', 'the'), tricky('people', 'people'),
      word('on', 'on', ['o','n']), tricky('the', 'the'),
      word('next', 'next', ['n','e','x','t']),
      word('rooftop.', 'rooftop', ['r','oo','f','t','o','p']),
      word('Dadaji', 'dadaji', ['d','a','d','a','j','ee']),
      word('clapped', 'clapped', ['c','l','a','pp','d']),
      word('his', 'his', ['h','i','s']), word('hands', 'hands', ['h','a','n','d','s']),
      word('with', 'with', ['w','i','th']), word('joy.', 'joy', ['j','oy']),
      tricky('The', 'the'), word('girl', 'girl', ['g','er','l']),
      word('watched', 'watched', ['w','o','t','ch','d']),
      word('her', 'her', ['h','er']), word('kite', 'kite', ['k','i_e','t']),
      word('spin', 'spin', ['s','p','i','n']), word('and', 'and', ['a','n','d']),
      word('dance', 'dance', ['d','a','n','s']),
      tricky('over', 'over'), tricky('the', 'the'),
      word('pink', 'pink', ['p','i','nk']),
      word('city.', 'city', ['s','i','t','ee']),
      word('Pure', 'pure', ['p','ure']), word('joy!', 'joy', ['j','oy']),
      tricky('she', 'she'), word('cried.', 'cried', ['c','r','ie','d']),
      word('Pure', 'pure', ['p','ure']), word('joy!', 'joy', ['j','oy']),
    ],
    imageUrl: '/illustrations/5_3/page8.png',
  },

  // ── QUIZ ──
  {
    type: 'quiz',
    questions: [
      { question: 'What did the girl want to do?',
        options: [{ label: 'fly a kite', isCorrect: true }, { label: 'fly a plane', isCorrect: false }, { label: 'paint a picture', isCorrect: false }] },
      { question: 'What happened to the paper?',
        options: [{ label: 'it ripped', isCorrect: true }, { label: 'it flew away', isCorrect: false }, { label: 'it got wet', isCorrect: false }] },
      { question: 'How did the girl feel at the end?',
        options: [{ label: 'pure joy', isCorrect: true }, { label: 'frustrated', isCorrect: false }, { label: 'tired', isCorrect: false }] },
    ],
  },

  { type: 'sound_spotlight', sound: 'ure', items: [
    { word: 'sure', imageUrl: '/images/words/sure.png', focusIndex: 1 },
    { word: 'pure', imageUrl: '/images/words/pure.png', focusIndex: 1 },
    { word: 'picture', imageUrl: '/images/words/picture.png', focusIndex: 4 },
    { word: 'nature', imageUrl: '/images/words/nature.png', focusIndex: 3 },
  ] },
  { type: 'sound_spotlight', sound: 'tion', items: [
    { word: 'action', imageUrl: '/images/words/action.png', focusIndex: 2 },
    { word: 'section', imageUrl: '/images/words/section.png', focusIndex: 3 },
    { word: 'station', imageUrl: '/images/words/station.png', focusIndex: 3 },
    { word: 'direction', imageUrl: '/images/words/direction.png', focusIndex: 5 },
  ] },

  { type: 'word_reading', words: [
    word('sure', 'sure', ['sh','ure']), word('pure', 'pure', ['p','ure']),
    word('action', 'action', ['a','c','tion']), word('section', 'section', ['s','e','c','tion']),
    word('direction', 'direction', ['d','i','r','e','c','tion']),
    word('frustration', 'frustration', ['f','r','u','s','t','r','a','tion']),
  ] },

  { type: 'tricky_words', words: [
    tricky('said', 'said'), tricky('was', 'was'), tricky('they', 'they'),
    tricky('people', 'people'), tricky('through', 'through'), tricky('over', 'over'),
  ] },

  { type: 'nonsense_words', words: [
    word('plure', 'plure', ['p','l','ure']), word('tration', 'tration', ['t','r','a','tion']),
    word('brure', 'brure', ['b','r','ure']), word('snection', 'snection', ['s','n','e','c','tion']),
    word('frure', 'frure', ['f','r','ure']), word('draction', 'draction', ['d','r','a','c','tion']),
    word('glure', 'glure', ['g','l','ure']), word('prection', 'prection', ['p','r','e','c','tion']),
  ] },

  { type: 'spelling', words: [
    { word: 'sure', imageUrl: '/images/words/sure.png', letters: ['s','u','r','e'] },
    { word: 'pure', imageUrl: '/images/words/pure.png', letters: ['p','u','r','e'] },
    { word: 'action', imageUrl: '/images/words/action.png', letters: ['a','c','t','i','o','n'] },
    { word: 'section', imageUrl: '/images/words/section.png', letters: ['s','e','c','t','i','o','n'] },
  ] },

  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/5_3/page1.png', label: 'She watched the kites.', correctIndex: 0 },
    { imageUrl: '/illustrations/5_3/page2.png', label: 'Dadaji showed the instructions.', correctIndex: 1 },
    { imageUrl: '/illustrations/5_3/page4.png', label: 'The paper ripped!', correctIndex: 2 },
    { imageUrl: '/illustrations/5_3/page5.png', label: 'She felt frustrated.', correctIndex: 3 },
    { imageUrl: '/illustrations/5_3/page6.png', label: 'She tried again.', correctIndex: 4 },
    { imageUrl: '/illustrations/5_3/page8.png', label: 'The kite flew! Pure joy!', correctIndex: 5 },
  ] },

  { type: 'drawing', prompt: 'Draw Your Favourite Part' },
  { type: 'certificate', bookTitle: 'Sure She Can' },
];


// ═══════════════════════════════════════════════════════════════════════════
// L5.4 — "A Place for Me"
// Focus sounds: review of all L5 sounds (Before/After Contrast structure)
// Setting: Salvador, Brazil — celebration/carnival
// ═══════════════════════════════════════════════════════════════════════════

export const BOOK_L5_4_PAGES: InteractivePage[] = [
  { type: 'cover', title: 'A Place for Me', subtitle: 'Level 5 · Confident Reader', imageUrl: '/illustrations/5_4/cover.png' },

  {
    type: 'sound_grid',
    focusSounds: ['ore', 'oor', 'ire', 'ear', 'ure', 'tion'],
    allSounds: L5_ALL_SOUNDS,
  },

  {
    type: 'vocab_preview',
    words: [
      word('shore', 'shore', ['sh','ore']),
      word('door', 'door', ['d','oor']),
      word('fire', 'fire', ['f','ire']),
      word('near', 'near', ['n','ear']),
      word('pure', 'pure', ['p','ure']),
      word('celebration', 'celebration', ['s','e','l','e','b','r','a','tion']),
      word('colourful', 'colourful', ['c','o','l','er','f','u','l']),
    ],
  },

  // Page 1
  {
    type: 'story',
    sentences: ['I came to a celebration in a colourful street near the shore.', 'But I did not know anyone.', 'I stood alone in the corner, watching the people dance and sing.', 'My heart felt heavy.'],
    words: [
      tricky('I', 'I'), word('came', 'came', ['c','a_e','m']),
      tricky('to', 'to'), tricky('a', 'a'),
      word('celebration', 'celebration', ['s','e','l','e','b','r','a','tion']),
      word('in', 'in', ['i','n']), tricky('a', 'a'),
      word('colourful', 'colourful', ['c','o','l','er','f','u','l']),
      word('street', 'street', ['s','t','r','ee','t']),
      word('near', 'near', ['n','ear']), tricky('the', 'the'),
      word('shore.', 'shore', ['sh','ore']),
      word('But', 'but', ['b','u','t']), tricky('I', 'I'),
      word('did', 'did', ['d','i','d']), word('not', 'not', ['n','o','t']),
      word('know', 'know', ['n','ow']), tricky('anyone.', 'anyone'),
      tricky('I', 'I'), word('stood', 'stood', ['s','t','oo','d']),
      word('alone', 'alone', ['a','l','o_e','n']),
      word('in', 'in', ['i','n']), tricky('the', 'the'),
      word('corner,', 'corner', ['c','or','n','er']),
      word('watching', 'watching', ['w','o','t','ch','i','ng']),
      tricky('the', 'the'), tricky('people', 'people'),
      word('dance', 'dance', ['d','a','n','s']),
      word('and', 'and', ['a','n','d']), word('sing.', 'sing', ['s','i','ng']),
      word('My', 'my', ['m','y']), word('heart', 'heart', ['h','ear','t']),
      word('felt', 'felt', ['f','e','l','t']), word('heavy.', 'heavy', ['h','e','v','ee']),
    ],
    imageUrl: '/illustrations/5_4/page1.png',
  },

  // Page 2
  {
    type: 'story',
    sentences: ['I could hear music and laughter from every door.', 'I could see food and drums.', 'But no one saw me.', 'I felt left out.'],
    words: [
      tricky('I', 'I'), tricky('could', 'could'),
      word('hear', 'hear', ['h','ear']),
      word('music', 'music', ['m','ew','s','i','k']),
      word('and', 'and', ['a','n','d']),
      word('laughter', 'laughter', ['l','ar','f','t','er']),
      word('from', 'from', ['f','r','o','m']),
      word('every', 'every', ['e','v','r','ee']),
      word('door.', 'door', ['d','oor']),
      tricky('I', 'I'), tricky('could', 'could'),
      word('see', 'see', ['s','ee']), word('food', 'food', ['f','oo','d']),
      word('and', 'and', ['a','n','d']), word('drums.', 'drums', ['d','r','u','m','s']),
      word('But', 'but', ['b','u','t']), word('no', 'no', ['n','o']),
      word('one', 'one', ['w','u','n']), word('saw', 'saw', ['s','aw']),
      word('me.', 'me', ['m','ee']),
      tricky('I', 'I'), word('felt', 'felt', ['f','e','l','t']),
      word('left', 'left', ['l','e','f','t']),
      word('out.', 'out', ['ou','t']),
    ],
    imageUrl: '/illustrations/5_4/page2.png',
  },

  // Page 3
  {
    type: 'story',
    sentences: ['The song grew louder.', 'Everyone was having the best time.', 'But not me.', 'I put my hand on my heart.', 'I was alone.'],
    words: [
      tricky('The', 'the'), word('song', 'song', ['s','o','ng']),
      word('grew', 'grew', ['g','r','ew']),
      word('louder.', 'louder', ['l','ou','d','er']),
      tricky('Everyone', 'everyone'), tricky('was', 'was'),
      word('having', 'having', ['h','a','v','i','ng']),
      tricky('the', 'the'), word('best', 'best', ['b','e','s','t']),
      word('time.', 'time', ['t','i_e','m']),
      word('But', 'but', ['b','u','t']), word('not', 'not', ['n','o','t']),
      word('me.', 'me', ['m','ee']),
      tricky('I', 'I'), word('put', 'put', ['p','u','t']),
      word('my', 'my', ['m','y']), word('hand', 'hand', ['h','a','n','d']),
      word('on', 'on', ['o','n']), word('my', 'my', ['m','y']),
      word('heart.', 'heart', ['h','ear','t']),
      tricky('I', 'I'), tricky('was', 'was'),
      word('alone.', 'alone', ['a','l','o_e','n']),
    ],
    imageUrl: '/illustrations/5_4/page3.png',
  },

  // Page 4
  {
    type: 'story',
    sentences: ['Then a boy saw me.', 'He had a warm smile.', 'He came over and held out his hand.', '"Will you come dance with me?" he said.', 'I felt surprised and happy!'],
    words: [
      word('Then', 'then', ['th','e','n']), tricky('a', 'a'),
      word('boy', 'boy', ['b','oy']), word('saw', 'saw', ['s','aw']),
      word('me.', 'me', ['m','ee']),
      tricky('He', 'he'), word('had', 'had', ['h','a','d']),
      tricky('a', 'a'), word('warm', 'warm', ['w','or','m']),
      word('smile.', 'smile', ['s','m','i_e','l']),
      tricky('He', 'he'), word('came', 'came', ['c','a_e','m']),
      tricky('over', 'over'), word('and', 'and', ['a','n','d']),
      word('held', 'held', ['h','e','l','d']),
      word('out', 'out', ['ou','t']), word('his', 'his', ['h','i','s']),
      word('hand.', 'hand', ['h','a','n','d']),
      word('Will', 'will', ['w','i','ll']), tricky('you', 'you'),
      word('come', 'come', ['c','o','m']),
      word('dance', 'dance', ['d','a','n','s']),
      word('with', 'with', ['w','i','th']),
      word('me?', 'me', ['m','ee']),
      tricky('he', 'he'), tricky('said.', 'said'),
      tricky('I', 'I'), word('felt', 'felt', ['f','e','l','t']),
      word('surprised', 'surprised', ['s','er','p','r','i_e','s','d']),
      word('and', 'and', ['a','n','d']),
      tricky('happy!', 'happy'),
    ],
    imageUrl: '/illustrations/5_4/page4.png',
  },

  // Page 5
  {
    type: 'story',
    sentences: ['We went to a food stall.', 'The man gave us golden-brown acarajé.', 'It was so good!', 'I took a bite and smiled.', 'This pure joy was new to me.'],
    words: [
      tricky('We', 'we'), word('went', 'went', ['w','e','n','t']),
      tricky('to', 'to'), tricky('a', 'a'),
      word('food', 'food', ['f','oo','d']),
      word('stall.', 'stall', ['s','t','a','ll']),
      tricky('The', 'the'), word('man', 'man', ['m','a','n']),
      word('gave', 'gave', ['g','a_e','v']),
      word('us', 'us', ['u','s']),
      word('golden-brown', 'golden-brown', ['g','o_e','l','d','e','n','b','r','ow','n']),
      word('acarajé.', 'acaraje', ['a','c','a','r','a','j','ay']),
      word('It', 'it', ['i','t']), tricky('was', 'was'),
      tricky('so', 'so'), word('good!', 'good', ['g','oo','d']),
      tricky('I', 'I'), word('took', 'took', ['t','oo','k']),
      tricky('a', 'a'), word('bite', 'bite', ['b','i_e','t']),
      word('and', 'and', ['a','n','d']),
      word('smiled.', 'smiled', ['s','m','i_e','l','d']),
      word('This', 'this', ['th','i','s']),
      word('pure', 'pure', ['p','ure']),
      word('joy', 'joy', ['j','oy']), tricky('was', 'was'),
      word('new', 'new', ['n','ew']), tricky('to', 'to'),
      word('me.', 'me', ['m','ee']),
    ],
    imageUrl: '/illustrations/5_4/page5.png',
  },

  // Page 6
  {
    type: 'story',
    sentences: ['We walked down the street together.', 'We saw the old colourful buildings.', 'We heard drums near the fire.', '"I like this place," I said.', '"And I like you," said the boy.'],
    words: [
      tricky('We', 'we'), word('walked', 'walked', ['w','a','l','k','d']),
      word('down', 'down', ['d','ow','n']), tricky('the', 'the'),
      word('street', 'street', ['s','t','r','ee','t']),
      tricky('together.', 'together'),
      tricky('We', 'we'), word('saw', 'saw', ['s','aw']),
      tricky('the', 'the'), word('old', 'old', ['o_e','l','d']),
      word('colourful', 'colourful', ['c','o','l','er','f','u','l']),
      word('buildings.', 'buildings', ['b','i','l','d','i','ng','s']),
      tricky('We', 'we'), word('heard', 'heard', ['h','ear','d']),
      word('drums', 'drums', ['d','r','u','m','s']),
      word('near', 'near', ['n','ear']), tricky('the', 'the'),
      word('fire.', 'fire', ['f','ire']),
      tricky('I', 'I'), word('like', 'like', ['l','i_e','k']),
      word('this', 'this', ['th','i','s']),
      word('place,', 'place', ['p','l','a_e','s']),
      tricky('I', 'I'), tricky('said.', 'said'),
      word('And', 'and', ['a','n','d']), tricky('I', 'I'),
      word('like', 'like', ['l','i_e','k']),
      tricky('you,', 'you'), tricky('said', 'said'),
      tricky('the', 'the'), word('boy.', 'boy', ['b','oy']),
    ],
    imageUrl: '/illustrations/5_4/page6.png',
  },

  // Page 7
  {
    type: 'story',
    sentences: ['Soon we were dancing!', 'Other children came to join us.', 'The music was all around.', 'We spun and laughed.', 'The fire and the drums made the perfect sound for our dance.'],
    words: [
      word('Soon', 'soon', ['s','oo','n']), tricky('we', 'we'),
      tricky('were', 'were'), word('dancing!', 'dancing', ['d','a','n','s','i','ng']),
      tricky('Other', 'other'), word('children', 'children', ['ch','i','l','d','r','e','n']),
      word('came', 'came', ['c','a_e','m']), tricky('to', 'to'),
      word('join', 'join', ['j','oi','n']),
      word('us.', 'us', ['u','s']),
      tricky('The', 'the'), word('music', 'music', ['m','ew','s','i','k']),
      tricky('was', 'was'), word('all', 'all', ['a','ll']),
      word('around.', 'around', ['a','r','ou','n','d']),
      tricky('We', 'we'), word('spun', 'spun', ['s','p','u','n']),
      word('and', 'and', ['a','n','d']),
      word('laughed.', 'laughed', ['l','ar','f','d']),
      tricky('The', 'the'), word('fire', 'fire', ['f','ire']),
      word('and', 'and', ['a','n','d']), tricky('the', 'the'),
      word('drums', 'drums', ['d','r','u','m','s']),
      word('made', 'made', ['m','a_e','d']), tricky('the', 'the'),
      word('perfect', 'perfect', ['p','er','f','e','c','t']),
      word('sound', 'sound', ['s','ou','n','d']),
      word('for', 'for', ['f','or']), tricky('our', 'our'),
      word('dance.', 'dance', ['d','a','n','s']),
    ],
    imageUrl: '/illustrations/5_4/page7.png',
  },

  // Page 8
  {
    type: 'story',
    sentences: ['As evening came, we sat together.', 'I held the boy\'s hand.', 'I did not want to leave.', '"Will you come back?" he asked.', '"Yes," I said. "This is my place too."'],
    words: [
      word('As', 'as', ['a','s']), word('evening', 'evening', ['ee','v','n','i','ng']),
      word('came,', 'came', ['c','a_e','m']), tricky('we', 'we'),
      word('sat', 'sat', ['s','a','t']), tricky('together.', 'together'),
      tricky('I', 'I'), word('held', 'held', ['h','e','l','d']),
      tricky('the', 'the'), word('boy\'s', 'boys', ['b','oy','s']),
      word('hand.', 'hand', ['h','a','n','d']),
      tricky('I', 'I'), word('did', 'did', ['d','i','d']),
      word('not', 'not', ['n','o','t']), word('want', 'want', ['w','o','n','t']),
      tricky('to', 'to'), word('leave.', 'leave', ['l','ea','v']),
      word('Will', 'will', ['w','i','ll']), tricky('you', 'you'),
      word('come', 'come', ['c','o','m']),
      word('back?', 'back', ['b','a','ck']), tricky('he', 'he'),
      word('asked.', 'asked', ['ar','s','k','d']),
      word('Yes,', 'yes', ['y','e','s']), tricky('I', 'I'),
      tricky('said.', 'said'), word('This', 'this', ['th','i','s']),
      word('is', 'is', ['i','z']), word('my', 'my', ['m','y']),
      word('place', 'place', ['p','l','a_e','s']),
      word('too.', 'too', ['t','oo']),
    ],
    imageUrl: '/illustrations/5_4/page8.png',
  },

  // ── QUIZ ──
  {
    type: 'quiz',
    questions: [
      { question: 'How did the narrator feel at the start?',
        options: [{ label: 'alone and sad', isCorrect: true }, { label: 'happy and excited', isCorrect: false }, { label: 'angry', isCorrect: false }] },
      { question: 'Who came to talk to the narrator?',
        options: [{ label: 'a boy', isCorrect: true }, { label: 'a girl', isCorrect: false }, { label: 'a man', isCorrect: false }] },
      { question: 'What did they do together?',
        options: [{ label: 'danced and ate food', isCorrect: true }, { label: 'played football', isCorrect: false }, { label: 'went swimming', isCorrect: false }] },
    ],
  },

  // ── SOUND SPOTLIGHTS (review all L5 sounds) ──
  { type: 'sound_spotlight', sound: 'ore', items: [
    { word: 'shore', imageUrl: '/images/words/shore.png', focusIndex: 2 },
    { word: 'more', imageUrl: '/images/words/more.png', focusIndex: 1 },
    { word: 'before', imageUrl: '/images/words/before.png', focusIndex: 3 },
    { word: 'score', imageUrl: '/images/words/score.png', focusIndex: 2 },
  ] },
  { type: 'sound_spotlight', sound: 'ear', items: [
    { word: 'near', imageUrl: '/images/words/near.png', focusIndex: 1 },
    { word: 'hear', imageUrl: '/images/words/hear.png', focusIndex: 1 },
    { word: 'heart', imageUrl: '/images/words/heart.png', focusIndex: 1 },
    { word: 'clear', imageUrl: '/images/words/clear.png', focusIndex: 2 },
  ] },

  { type: 'word_reading', words: [
    word('shore', 'shore', ['sh','ore']), word('door', 'door', ['d','oor']),
    word('fire', 'fire', ['f','ire']), word('near', 'near', ['n','ear']),
    word('pure', 'pure', ['p','ure']), word('celebration', 'celebration', ['s','e','l','e','b','r','a','tion']),
  ] },

  { type: 'tricky_words', words: [
    tricky('said', 'said'), tricky('was', 'was'), tricky('could', 'could'),
    tricky('people', 'people'), tricky('anyone', 'anyone'), tricky('together', 'together'),
  ] },

  { type: 'nonsense_words', words: [
    word('blore', 'blore', ['b','l','ore']), word('gloor', 'gloor', ['g','l','oor']),
    word('brire', 'brire', ['b','r','ire']), word('snear', 'snear', ['s','n','ear']),
    word('plure', 'plure', ['p','l','ure']), word('tration', 'tration', ['t','r','a','tion']),
    word('frore', 'frore', ['f','r','ore']), word('drear', 'drear', ['d','r','ear']),
  ] },

  { type: 'spelling', words: [
    { word: 'shore', imageUrl: '/images/words/shore.png', letters: ['sh','o','r','e'] },
    { word: 'near', imageUrl: '/images/words/near.png', letters: ['n','e','a','r'] },
    { word: 'pure', imageUrl: '/images/words/pure.png', letters: ['p','u','r','e'] },
    { word: 'fire', imageUrl: '/images/words/fire.png', letters: ['f','i','r','e'] },
  ] },

  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/5_4/page1.png', label: 'I was alone.', correctIndex: 0 },
    { imageUrl: '/illustrations/5_4/page3.png', label: 'My heart felt heavy.', correctIndex: 1 },
    { imageUrl: '/illustrations/5_4/page4.png', label: 'A boy came to me.', correctIndex: 2 },
    { imageUrl: '/illustrations/5_4/page5.png', label: 'We ate food.', correctIndex: 3 },
    { imageUrl: '/illustrations/5_4/page7.png', label: 'We danced!', correctIndex: 4 },
    { imageUrl: '/illustrations/5_4/page8.png', label: 'This is my place.', correctIndex: 5 },
  ] },

  { type: 'drawing', prompt: 'Draw Your Favourite Part' },
  { type: 'certificate', bookTitle: 'A Place for Me' },
];
