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
  'ay', 'ey', 'a-e', 'e-e', 'i-e', 'o-e', 'u-e',
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
  { type: 'cover', title: 'Before the Shore', subtitle: 'Level 5 · Reading Together', imageUrl: '/illustrations/5_1/cover.png' },

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
      word('stone', 'stone', ['s','t','o-e','n']),
      word('flames', 'flames', ['f','l','a-e','m','s']),
    ],
  },

  // ── STORY PAGES ──
  // Page 1
  {
    type: 'story',
    sentences: ['The boy went home from the park.', 'He was tired, and his feet were sore.', 'He sat on a bench to rest.', 'Then he saw something on the path — a smooth, flat stone.', 'He picked it up.'],
    words: [
      tricky('The', 'the'), word('boy', 'boy', ['b','oy']), word('went', 'went', ['w','e','n','t']),
      word('home', 'home', ['h','o-e','m']), word('from', 'from', ['f','r','o','m']),
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
      word('flat', 'flat', ['f','l','a','t']), word('stone.', 'stone', ['s','t','o-e','n']),
      tricky('He', 'he'), word('picked', 'picked', ['p','i','ck','ed']),
      word('it', 'it', ['i','t']), word('up.', 'up', ['u','p']),
    ],
    imageUrl: '/illustrations/5_1/page1.png', audioUrl: '/sounds/sentences/L5_1_p1.mp3',
  },

  // Page 2
  {
    type: 'story',
    sentences: ['The stone felt cool in his hand.', 'It had a shine, like something from the shore.', 'Once, before this week, he had seen a stone just like it.', 'He sat still and let his mind go back.'],
    words: [
      tricky('The', 'the'), word('stone', 'stone', ['s','t','o-e','n']),
      word('felt', 'felt', ['f','e','l','t']), word('cool', 'cool', ['c','oo','l']),
      word('in', 'in', ['i','n']), word('his', 'his', ['h','i','s']),
      word('hand.', 'hand', ['h','a','n','d']),
      word('It', 'it', ['i','t']), word('had', 'had', ['h','a','d']),
      tricky('a', 'a'), word('shine,', 'shine', ['sh','i-e','n']),
      word('like', 'like', ['l','i-e','k']), tricky('something', 'something'),
      word('from', 'from', ['f','r','o','m']), tricky('the', 'the'),
      word('shore.', 'shore', ['sh','ore']),
      tricky('Once,', 'once'), word('before', 'before', ['b','e','f','ore']),
      word('this', 'this', ['th','i','s']), word('week,', 'week', ['w','ee','k']),
      tricky('he', 'he'), word('had', 'had', ['h','a','d']),
      word('seen', 'seen', ['s','ee','n']), tricky('a', 'a'),
      word('stone', 'stone', ['s','t','o-e','n']), word('just', 'just', ['j','u','s','t']),
      word('like', 'like', ['l','i-e','k']), word('it.', 'it', ['i','t']),
      tricky('He', 'he'), word('sat', 'sat', ['s','a','t']),
      word('still', 'still', ['s','t','i','ll']), word('and', 'and', ['a','n','d']),
      word('let', 'let', ['l','e','t']), word('his', 'his', ['h','i','s']),
      word('mind', 'mind', ['m','i-e','n','d']), tricky('go', 'go'),
      word('back.', 'back', ['b','a','ck']),
    ],
    imageUrl: '/illustrations/5_1/page2.png', audioUrl: '/sounds/sentences/L5_1_p2.mp3',
  },

  // Page 3
  {
    type: 'story',
    sentences: ['Before the cold came, he went with Mum and Dad to the shore.', 'The air was fresh and the sand soft.', '"Come and explore with me!" said Dad.', 'They ran along the beach and played in the waves.', 'That night, they sat by a fire and the flames jumped and flicked.'],
    words: [
      word('Before', 'before', ['b','e','f','ore']), tricky('the', 'the'),
      word('cold', 'cold', ['c','o','l','d']), word('came,', 'came', ['c','a-e','m']),
      tricky('he', 'he'), word('went', 'went', ['w','e','n','t']),
      word('with', 'with', ['w','i','th']), word('Mum', 'mum', ['m','u','m']),
      word('and', 'and', ['a','n','d']), word('Dad', 'dad', ['d','a','d']),
      tricky('to', 'to'), tricky('the', 'the'),
      word('shore.', 'shore', ['sh','ore']),
      tricky('The', 'the'), word('air', 'air', ['air']),
      tricky('was', 'was'), word('fresh', 'fresh', ['f','r','e','sh']),
      word('and', 'and', ['a','n','d']), tricky('the', 'the'),
      word('sand', 'sand', ['s','a','n','d']), word('soft.', 'soft', ['s','o','f','t']),
      tricky('Come', 'come'), word('and', 'and', ['a','n','d']),
      word('explore', 'explore', ['e','x','p','l','ore']),
      word('with', 'with', ['w','i','th']), word('me!', 'me', ['m','ee']),
      tricky('said', 'said'), word('Dad.', 'dad', ['d','a','d']),
      tricky('They', 'they'), word('ran', 'ran', ['r','a','n']),
      word('along', 'along', ['a','l','o','ng']), tricky('the', 'the'),
      word('beach', 'beach', ['b','ea','ch']), word('and', 'and', ['a','n','d']),
      word('played', 'played', ['p','l','ay','ed']), word('in', 'in', ['i','n']),
      tricky('the', 'the'), word('waves.', 'waves', ['w','a-e','v','s']),
      word('That', 'that', ['th','a','t']), word('night,', 'night', ['n','igh','t']),
      tricky('they', 'they'), word('sat', 'sat', ['s','a','t']),
      word('by', 'by', ['b','y']), tricky('a', 'a'),
      word('fire', 'fire', ['f','ire']), word('and', 'and', ['a','n','d']),
      tricky('the', 'the'), word('flames', 'flames', ['f','l','a-e','m','s']),
      word('jumped', 'jumped', ['j','u','m','p','ed']),
      word('and', 'and', ['a','n','d']), word('flicked.', 'flicked', ['f','l','i','ck','ed']),
    ],
    imageUrl: '/illustrations/5_1/page3.png', audioUrl: '/sounds/sentences/L5_1_p3.mp3',
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
      word('Mum', 'mum', ['m','u','m']), word('helped', 'helped', ['h','e','l','p','ed']),
      word('him', 'him', ['h','i','m']), word('put', 'put', ['p','u','t']),
      word('them', 'them', ['th','e','m']), word('on', 'on', ['o','n']),
      tricky('a', 'a'), word('wire.', 'wire', ['w','ire']),
      tricky('We', 'we'), word('can', 'can', ['c','a','n']),
      word('make', 'make', ['m','a-e','k']), tricky('a', 'a'),
      word('gift,', 'gift', ['g','i','f','t']), tricky('she', 'she'),
      tricky('said.', 'said'),
      tricky('He', 'he'), word('twisted', 'twisted', ['t','w','i','s','t','e','d']),
      tricky('the', 'the'), word('wire', 'wire', ['w','ire']),
      word('with', 'with', ['w','i','th']), word('care.', 'care', ['c','are']),
      word('It', 'it', ['i','t']), word('looked', 'looked', ['l','oo','k','ed']),
      tricky('so', 'so'), word('nice!', 'nice', ['n','i-e','s']),
    ],
    imageUrl: '/illustrations/5_1/page4.png', audioUrl: '/sounds/sentences/L5_1_p4.mp3',
  },

  // Page 5
  {
    type: 'story',
    sentences: ['Then it was time to go.', 'He spotted a stone by the shore.', 'It was smooth and flat.', '"Keep it safe," said Dad.', '"So you never forget this trip."', 'He put the stone in his pocket with a smile.'],
    words: [
      word('Then', 'then', ['th','e','n']), word('it', 'it', ['i','t']),
      tricky('was', 'was'), word('time', 'time', ['t','i-e','m']),
      tricky('to', 'to'), tricky('go.', 'go'),
      tricky('He', 'he'), word('spotted', 'spotted', ['s','p','o','tt','e','d']),
      tricky('a', 'a'), word('stone', 'stone', ['s','t','o-e','n']),
      word('by', 'by', ['b','y']), tricky('the', 'the'),
      word('shore.', 'shore', ['sh','ore']),
      word('It', 'it', ['i','t']), tricky('was', 'was'),
      word('smooth', 'smooth', ['s','m','oo','th']),
      word('and', 'and', ['a','n','d']), word('flat.', 'flat', ['f','l','a','t']),
      word('Keep', 'keep', ['k','ee','p']), word('it', 'it', ['i','t']),
      word('safe,', 'safe', ['s','a-e','f']), tricky('said', 'said'),
      word('Dad.', 'dad', ['d','a','d']),
      tricky('So', 'so'), tricky('you', 'you'),
      word('never', 'never', ['n','e','v','er']),
      word('forget', 'forget', ['f','or','g','e','t']),
      word('this', 'this', ['th','i','s']), word('trip.', 'trip', ['t','r','i','p']),
      tricky('He', 'he'), word('put', 'put', ['p','u','t']),
      tricky('the', 'the'), word('stone', 'stone', ['s','t','o-e','n']),
      word('in', 'in', ['i','n']), word('his', 'his', ['h','i','s']),
      word('pocket', 'pocket', ['p','o','ck','e','t']),
      word('with', 'with', ['w','i','th']), tricky('a', 'a'),
      word('smile.', 'smile', ['s','m','i-e','l']),
    ],
    imageUrl: '/illustrations/5_1/page5.png', audioUrl: '/sounds/sentences/L5_1_p5.mp3',
  },

  // Page 6
  {
    type: 'story',
    sentences: ['The boy sat up and looked around.', 'He still had that shore stone at home.', 'But in his hand was a new stone, just as smooth!', 'He held it up to the light.', 'The shore felt so close.'],
    words: [
      tricky('The', 'the'), word('boy', 'boy', ['b','oy']),
      word('sat', 'sat', ['s','a','t']), word('up', 'up', ['u','p']),
      word('and', 'and', ['a','n','d']), word('looked', 'looked', ['l','oo','k','ed']),
      word('around.', 'around', ['a','r','ou','n','d']),
      tricky('He', 'he'), word('still', 'still', ['s','t','i','ll']),
      word('had', 'had', ['h','a','d']), word('that', 'that', ['th','a','t']),
      word('shore', 'shore', ['sh','ore']), word('stone', 'stone', ['s','t','o-e','n']),
      word('at', 'at', ['a','t']), word('home.', 'home', ['h','o-e','m']),
      word('But', 'but', ['b','u','t']), word('in', 'in', ['i','n']),
      word('his', 'his', ['h','i','s']), word('hand', 'hand', ['h','a','n','d']),
      tricky('was', 'was'), tricky('a', 'a'), word('new', 'new', ['n','ew']),
      word('stone,', 'stone', ['s','t','o-e','n']), word('just', 'just', ['j','u','s','t']),
      word('as', 'as', ['a','s']), word('smooth!', 'smooth', ['s','m','oo','th']),
      tricky('He', 'he'), word('held', 'held', ['h','e','l','d']),
      word('it', 'it', ['i','t']), word('up', 'up', ['u','p']),
      tricky('to', 'to'), tricky('the', 'the'),
      word('light.', 'light', ['l','igh','t']),
      tricky('The', 'the'), word('shore', 'shore', ['sh','ore']),
      word('felt', 'felt', ['f','e','l','t']), tricky('so', 'so'),
      word('close.', 'close', ['c','l','o-e','s']),
    ],
    imageUrl: '/illustrations/5_1/page6.png', audioUrl: '/sounds/sentences/L5_1_p6.mp3',
  },

  // Page 7
  {
    type: 'story',
    sentences: ['He ran home to get his shore stone.', 'Now he had a pair!', 'He took some wire and made a loop for each one.', 'He would make a gift for Mum — just like before.'],
    words: [
      tricky('He', 'he'), word('ran', 'ran', ['r','a','n']),
      word('home', 'home', ['h','o-e','m']), tricky('to', 'to'),
      word('get', 'get', ['g','e','t']), word('his', 'his', ['h','i','s']),
      word('shore', 'shore', ['sh','ore']), word('stone.', 'stone', ['s','t','o-e','n']),
      word('Now', 'now', ['n','ow']), tricky('he', 'he'),
      word('had', 'had', ['h','a','d']), tricky('a', 'a'),
      word('pair!', 'pair', ['p','air']),
      tricky('He', 'he'), word('took', 'took', ['t','oo','k']),
      tricky('some', 'some'), word('wire', 'wire', ['w','ire']),
      word('and', 'and', ['a','n','d']), word('made', 'made', ['m','a-e','d']),
      tricky('a', 'a'), word('loop', 'loop', ['l','oo','p']),
      word('for', 'for', ['f','or']), word('each', 'each', ['ea','ch']),
      tricky('one.', 'one'),
      tricky('He', 'he'), tricky('would', 'would'),
      word('make', 'make', ['m','a-e','k']), tricky('a', 'a'),
      word('gift', 'gift', ['g','i','f','t']), word('for', 'for', ['f','or']),
      word('Mum', 'mum', ['m','u','m']), word('just', 'just', ['j','u','s','t']),
      word('like', 'like', ['l','i-e','k']), word('before.', 'before', ['b','e','f','ore']),
    ],
    imageUrl: '/illustrations/5_1/page7.png', audioUrl: '/sounds/sentences/L5_1_p7.mp3',
  },

  // Page 8
  {
    type: 'story',
    sentences: ['He gave the stones to Mum.', '"From the shore and from the park," he said.', 'She smiled wide.', '"I will keep them with me," she said.', '"So I never forget."', 'She wore them on her bag that day.'],
    words: [
      tricky('He', 'he'), word('gave', 'gave', ['g','a-e','v']),
      tricky('the', 'the'), word('stones', 'stones', ['s','t','o-e','n','s']),
      tricky('to', 'to'), word('Mum.', 'mum', ['m','u','m']),
      word('From', 'from', ['f','r','o','m']), tricky('the', 'the'),
      word('shore', 'shore', ['sh','ore']), word('and', 'and', ['a','n','d']),
      word('from', 'from', ['f','r','o','m']), tricky('the', 'the'),
      word('park,', 'park', ['p','ar','k']), tricky('he', 'he'),
      tricky('said.', 'said'),
      tricky('She', 'she'), word('smiled', 'smiled', ['s','m','i-e','l','d']),
      word('wide.', 'wide', ['w','i-e','d']),
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
    imageUrl: '/illustrations/5_1/page8.png', audioUrl: '/sounds/sentences/L5_1_p8.mp3',
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
    { word: 'shore', imageUrl: '/images/words/shore.png', letters: ['sh','ore'] },
    { word: 'fire', imageUrl: '/images/words/fire.png', letters: ['f','ire'] },
    { word: 'wire', imageUrl: '/images/words/wire.png', letters: ['w','ire'] },
    { word: 'more', imageUrl: '/images/words/more.png', letters: ['m','ore'] },
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
  { type: 'cover', title: 'Near the Door', subtitle: 'Level 5 · Reading Together', imageUrl: '/illustrations/5_2/cover.png' },

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
      word('It', 'it', ['i','t']), word('came', 'came', ['c','a-e','m']),
      word('from', 'from', ['f','r','o','m']),
      word('near', 'near', ['n','ear']), tricky('the', 'the'),
      word('door.', 'door', ['d','oor']),
      word('What', 'what', ['wh','a','t']), tricky('could', 'could'),
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
    imageUrl: '/illustrations/5_2/page1.png', audioUrl: '/sounds/sentences/L5_2_p1.mp3',
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
      tricky('He', 'he'), word('looked', 'looked', ['l','oo','k','ed']),
      word('at', 'at', ['a','t']), word('me', 'me', ['m','ee']),
      word('and', 'and', ['a','n','d']), word('smiled.', 'smiled', ['s','m','i-e','l','d']),
      tricky('I', 'I'), word('can', 'can', ['c','a','n']),
      word('tell', 'tell', ['t','e','ll']), word('what', 'what', ['wh','a','t']),
      word('that', 'that', ['th','a','t']), tricky('is,', 'is'),
      tricky('he', 'he'), tricky('said.', 'said'),
      word('It', 'it', ['i','t']), tricky('is', 'is'),
      word('clear', 'clear', ['c','l','ear']), tricky('to', 'to'),
      word('me.', 'me', ['m','ee']), word('But', 'but', ['b','u','t']),
      tricky('I', 'I'), word('will', 'will', ['w','i','ll']),
      word('not', 'not', ['n','o','t']), word('say.', 'say', ['s','ay']),
    ],
    imageUrl: '/illustrations/5_2/page2.png', audioUrl: '/sounds/sentences/L5_2_p2.mp3',
  },

  // Page 3
  {
    type: 'story',
    sentences: ['But what was it?', 'I saw a dark shape near the door through the window.', 'It seemed to shift in the snow.', 'Was it a big beast from the forest?', 'My heart beat fast.', 'I felt a little fear.'],
    words: [
      word('But', 'but', ['b','u','t']), word('what', 'what', ['wh','a','t']),
      tricky('was', 'was'), word('it?', 'it', ['i','t']),
      tricky('I', 'I'), word('saw', 'saw', ['s','aw']),
      tricky('a', 'a'), word('dark', 'dark', ['d','ar','k']),
      word('shape', 'shape', ['sh','a-e','p']),
      word('near', 'near', ['n','ear']), tricky('the', 'the'),
      word('door', 'door', ['d','oor']), tricky('through', 'through'),
      tricky('the', 'the'), word('window.', 'window', ['w','i','n','d','ow']),
      word('It', 'it', ['i','t']), word('seemed', 'seemed', ['s','ee','m','ed']),
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
    imageUrl: '/illustrations/5_2/page3.png', audioUrl: '/sounds/sentences/L5_2_p3.mp3',
  },

  // Page 4
  {
    type: 'story',
    sentences: ['Dad just sat and smiled at me.', '"My dear," he said, "you do not need to fear.', 'Just open the door and look.', 'You will see what it is."'],
    words: [
      word('Dad', 'dad', ['d','a','d']), word('just', 'just', ['j','u','s','t']),
      word('sat', 'sat', ['s','a','t']), word('and', 'and', ['a','n','d']),
      word('smiled', 'smiled', ['s','m','i-e','l','d']),
      word('at', 'at', ['a','t']), word('me.', 'me', ['m','ee']),
      word('My', 'my', ['m','y']), word('dear,', 'dear', ['d','ear']),
      tricky('he', 'he'), tricky('said,', 'said'),
      tricky('you', 'you'), tricky('do', 'do'),
      word('not', 'not', ['n','o','t']), word('need', 'need', ['n','ee','d']),
      tricky('to', 'to'), word('fear.', 'fear', ['f','ear']),
      word('Just', 'just', ['j','u','s','t']),
      word('open', 'open', ['o','p','e','n']),
      tricky('the', 'the'), word('door', 'door', ['d','oor']),
      word('and', 'and', ['a','n','d']), word('look.', 'look', ['l','oo','k']),
      tricky('You', 'you'), word('will', 'will', ['w','i','ll']),
      word('see', 'see', ['s','ee']), word('what', 'what', ['wh','a','t']),
      word('it', 'it', ['i','t']), tricky('is.', 'is'),
    ],
    imageUrl: '/illustrations/5_2/page4.png', audioUrl: '/sounds/sentences/L5_2_p4.mp3',
  },

  // Page 5
  {
    type: 'story',
    sentences: ['I reached for the door.', 'My hand felt cool on the handle.', 'I pulled the door wide open.', 'And sitting in the snow was... a fox!', 'A soft red fox with big, pointed ears!'],
    words: [
      tricky('I', 'I'), word('reached', 'reached', ['r','ea','ch','ed']),
      word('for', 'for', ['f','or']), tricky('the', 'the'),
      word('door.', 'door', ['d','oor']),
      word('My', 'my', ['m','y']), word('hand', 'hand', ['h','a','n','d']),
      word('felt', 'felt', ['f','e','l','t']), word('cool', 'cool', ['c','oo','l']),
      word('on', 'on', ['o','n']), tricky('the', 'the'),
      word('handle.', 'handle', ['h','a','n','d','l']),
      tricky('I', 'I'), tricky('pulled', 'pulled'),
      tricky('the', 'the'), word('door', 'door', ['d','oor']),
      word('wide', 'wide', ['w','i-e','d']),
      word('open.', 'open', ['o','p','e','n']),
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
    imageUrl: '/illustrations/5_2/page5.png', audioUrl: '/sounds/sentences/L5_2_p5.mp3',
  },

  // Page 6
  {
    type: 'story',
    sentences: ['Dad stood up and came over.', '"I have been feeding him," he said.', '"The poor little thing was so thin.', 'He comes near when he is looking for food."'],
    words: [
      word('Dad', 'dad', ['d','a','d']), word('stood', 'stood', ['s','t','oo','d']),
      word('up', 'up', ['u','p']), word('and', 'and', ['a','n','d']),
      word('came', 'came', ['c','a-e','m']), tricky('over.', 'over'),
      tricky('I', 'I'), tricky('have', 'have'),
      word('been', 'been', ['b','ee','n']),
      word('feeding', 'feeding', ['f','ee','d','i','ng']),
      word('him,', 'him', ['h','i','m']), tricky('he', 'he'),
      tricky('said.', 'said'),
      tricky('The', 'the'), word('poor', 'poor', ['p','oor']),
      word('little', 'little', ['l','i','tt','l']),
      word('thing', 'thing', ['th','i','ng']), tricky('was', 'was'),
      tricky('so', 'so'), word('thin.', 'thin', ['th','i','n']),
      tricky('He', 'he'), tricky('comes', 'comes'),
      word('near', 'near', ['n','ear']), word('when', 'when', ['wh','e','n']),
      tricky('he', 'he'), tricky('is', 'is'),
      word('looking', 'looking', ['l','oo','k','i','ng']),
      word('for', 'for', ['f','or']), word('food.', 'food', ['f','oo','d']),
    ],
    imageUrl: '/illustrations/5_2/page6.png', audioUrl: '/sounds/sentences/L5_2_p6.mp3',
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
      tricky('He', 'he'), word('ate', 'ate', ['a-e','t']),
      word('and', 'and', ['a','n','d']), word('ate!', 'ate', ['a-e','t']),
      word('His', 'his', ['h','i','s']), word('tail', 'tail', ['t','ai','l']),
      word('flicked', 'flicked', ['f','l','i','ck','ed']),
      word('as', 'as', ['a','s']), tricky('he', 'he'),
      word('munched.', 'munched', ['m','u','n','ch','ed']),
      tricky('I', 'I'), word('sat', 'sat', ['s','a','t']),
      word('on', 'on', ['o','n']), tricky('the', 'the'),
      word('floor', 'floor', ['f','l','oor']),
      word('and', 'and', ['a','n','d']), word('just', 'just', ['j','u','s','t']),
      word('looked', 'looked', ['l','oo','k','ed']),
      word('at', 'at', ['a','t']), word('him.', 'him', ['h','i','m']),
    ],
    imageUrl: '/illustrations/5_2/page7.png', audioUrl: '/sounds/sentences/L5_2_p7.mp3',
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
      word('safe.', 'safe', ['s','a-e','f']),
      tricky('Come', 'come'), word('back', 'back', ['b','a','ck']),
      word('soon.', 'soon', ['s','oo','n']),
      word('Dad', 'dad', ['d','a','d']), word('smiled', 'smiled', ['s','m','i-e','l','d']),
      word('at', 'at', ['a','t']), word('me.', 'me', ['m','ee']),
      tricky('He', 'he'), word('will,', 'will', ['w','i','ll']),
      word('my', 'my', ['m','y']), word('dear.', 'dear', ['d','ear']),
      tricky('He', 'he'), word('can', 'can', ['c','a','n']),
      word('tell', 'tell', ['t','e','ll']), word('that', 'that', ['th','a','t']),
      tricky('we', 'we'), tricky('are', 'are'),
      tricky('his', 'his'), tricky('friends.', 'friends'),
      tricky('The', 'the'), word('fox', 'fox', ['f','o','x']),
      word('looked', 'looked', ['l','oo','k','ed']),
      word('up,', 'up', ['u','p']), word('then', 'then', ['th','e','n']),
      word('ran', 'ran', ['r','a','n']), word('back', 'back', ['b','a','ck']),
      tricky('into', 'into'),
      tricky('the', 'the'), word('trees.', 'trees', ['t','r','ee','s']),
    ],
    imageUrl: '/illustrations/5_2/page8.png', audioUrl: '/sounds/sentences/L5_2_p8.mp3',
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
    { word: 'near', imageUrl: '/images/words/near.png', letters: ['n','ear'] },
    { word: 'dear', imageUrl: '/images/words/dear.png', letters: ['d','ear'] },
    { word: 'door', imageUrl: '/images/words/door.png', letters: ['d','oor'] },
    { word: 'fear', imageUrl: '/images/words/fear.png', letters: ['f','ear'] },
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

// ═══════════════════════════════════════════════════════════════════════════
// L5.3 — "Sure She Can"
// Focus sounds: ure, tion (Embedded Instructions structure)
// Setting: rooftop kite-making in a pink Indian-style town with Grandad
// ═══════════════════════════════════════════════════════════════════════════

export const BOOK_L5_3_PAGES: InteractivePage[] = [
  { type: 'cover', title: 'Sure She Can', subtitle: 'Level 5 · Reading Together', imageUrl: '/illustrations/5_3/cover.png' },

  {
    type: 'sound_grid',
    focusSounds: ['ure', 'tion'],
    allSounds: L5_ALL_SOUNDS,
    note: "The letters 'ure' have two sounds! At the end of a word it can sound like 'yoor' (as in pure) OR like 'ur' (as in nature). You'll meet both in this book.",
  },

  {
    type: 'vocab_preview',
    words: [
      tricky('sure', 'sure'),
      word('pure', 'pure', ['p','ure']),
      word('instruction', 'instruction', ['i','n','s','t','r','u','c','tion']),
      word('knot', 'knot', ['kn','o','t']),
      word('wrap', 'wrap', ['wr','a','p']),
      word('wrist', 'wrist', ['wr','i','s','t']),
      word('phone', 'phone', ['ph','o-e','n']),
      word('entire', 'entire', ['e','n','t','ire']),
    ],
  },

  // Page 1
  {
    type: 'story',
    sentences: [
      'Kites filled the pure blue sky over the pink town.',
      'On the rooftop, a girl stood with Grandad near the door.',
      'She looked up and dreamed of a kite of her own.',
      'But she did not have one yet at all.',
      'Now she could learn at last.',
    ],
    words: [
      word('Kites', 'kites', ['k','i-e','t','s']), word('filled', 'filled', ['f','i','ll','ed']),
      tricky('the', 'the'), word('pure', 'pure', ['p','ure']),
      word('blue', 'blue', ['b','l','ue']), word('sky', 'sky', ['s','k','y']),
      tricky('over', 'over'), tricky('the', 'the'),
      word('pink', 'pink', ['p','i','nk']), word('town.', 'town', ['t','ow','n']),
      word('On', 'on', ['o','n']), tricky('the', 'the'),
      word('rooftop,', 'rooftop', ['r','oo','f','t','o','p']),
      tricky('a', 'a'), word('girl', 'girl', ['g','ir','l']),
      word('stood', 'stood', ['s','t','oo','d']), word('with', 'with', ['w','i','th']),
      word('Grandad', 'grandad', ['g','r','a','n','d','a','d']),
      word('near', 'near', ['n','ear']), tricky('the', 'the'),
      word('door.', 'door', ['d','oor']),
      tricky('She', 'she'), word('looked', 'looked', ['l','oo','k','ed']),
      word('up', 'up', ['u','p']), word('and', 'and', ['a','n','d']),
      word('dreamed', 'dreamed', ['d','r','ea','m','ed']),
      tricky('of', 'of'), tricky('a', 'a'),
      word('kite', 'kite', ['k','i-e','t']), tricky('of', 'of'),
      word('her', 'her', ['h','er']), word('own.', 'own', ['ow','n']),
      word('But', 'but', ['b','u','t']), tricky('she', 'she'),
      word('did', 'did', ['d','i','d']), word('not', 'not', ['n','o','t']),
      tricky('have', 'have'), tricky('one', 'one'),
      word('yet', 'yet', ['y','e','t']), word('at', 'at', ['a','t']),
      tricky('all.', 'all'),
      word('Now', 'now', ['n','ow']), tricky('she', 'she'),
      tricky('could', 'could'), word('learn', 'learn', ['l','ear','n']),
      word('at', 'at', ['a','t']), word('last.', 'last', ['l','a','s','t']),
    ],
    imageUrl: '/illustrations/5_3/page1.png', audioUrl: '/sounds/sentences/L5_3_p1.mp3',
  },

  // Page 2
  {
    type: 'story',
    sentences: [
      'Grandad sat with thin sticks, string, and a sheet of paper.',
      '"We can make a kite," he said with a soft smile.',
      'He showed her a neat instruction card from his pocket.',
      '"Are you sure you can follow it?" he asked.',
      'The girl nodded and smiled, ready to start at once.',
    ],
    words: [
      word('Grandad', 'grandad', ['g','r','a','n','d','a','d']),
      word('sat', 'sat', ['s','a','t']), word('with', 'with', ['w','i','th']),
      word('thin', 'thin', ['th','i','n']), word('sticks,', 'sticks', ['s','t','i','ck','s']),
      word('string,', 'string', ['s','t','r','i','ng']),
      word('and', 'and', ['a','n','d']), tricky('a', 'a'),
      word('sheet', 'sheet', ['sh','ee','t']), tricky('of', 'of'),
      tricky('paper.', 'paper'),
      tricky('We', 'we'), word('can', 'can', ['c','a','n']),
      word('make', 'make', ['m','a-e','k']), tricky('a', 'a'),
      word('kite,', 'kite', ['k','i-e','t']),
      tricky('he', 'he'), tricky('said', 'said'),
      word('with', 'with', ['w','i','th']), tricky('a', 'a'),
      word('soft', 'soft', ['s','o','f','t']),
      word('smile.', 'smile', ['s','m','i-e','l']),
      tricky('He', 'he'), word('showed', 'showed', ['sh','ow','ed']),
      word('her', 'her', ['h','er']), tricky('a', 'a'),
      word('neat', 'neat', ['n','ea','t']),
      word('instruction', 'instruction', ['i','n','s','t','r','u','c','tion']),
      word('card', 'card', ['c','ar','d']), word('from', 'from', ['f','r','o','m']),
      word('his', 'his', ['h','i','s']), word('pocket.', 'pocket', ['p','o','ck','e','t']),
      tricky('Are', 'are'), tricky('you', 'you'),
      tricky('sure', 'sure'), tricky('you', 'you'),
      word('can', 'can', ['c','a','n']), word('follow', 'follow', ['f','o','ll','ow']),
      word('it?', 'it', ['i','t']),
      tricky('he', 'he'), word('asked.', 'asked', ['a','s','k','ed']),
      tricky('The', 'the'), word('girl', 'girl', ['g','ir','l']),
      word('nodded', 'nodded', ['n','o','dd','ed']),
      word('and', 'and', ['a','n','d']),
      word('smiled,', 'smiled', ['s','m','i-e','l','ed']),
      tricky('ready', 'ready'), tricky('to', 'to'),
      word('start', 'start', ['s','t','ar','t']),
      word('at', 'at', ['a','t']), tricky('once.', 'once'),
    ],
    imageUrl: '/illustrations/5_3/page2.png', audioUrl: '/sounds/sentences/L5_3_p2.mp3',
  },

  // Page 3
  {
    type: 'story',
    sentences: [
      '"Step one," said Grandad.',
      '"Lay two sticks in a cross with the long ends down."',
      '"Tie a tight knot where the sticks meet in the middle."',
      'The girl tied the knot and pulled the string firm.',
      '"Now wrap the string round each end," said Grandad.',
    ],
    words: [
      word('Step', 'step', ['s','t','e','p']), tricky('one,', 'one'),
      tricky('said', 'said'), word('Grandad.', 'grandad', ['g','r','a','n','d','a','d']),
      word('Lay', 'lay', ['l','ay']), tricky('two', 'two'),
      word('sticks', 'sticks', ['s','t','i','ck','s']),
      word('in', 'in', ['i','n']), tricky('a', 'a'),
      word('cross', 'cross', ['c','r','o','ss']),
      word('with', 'with', ['w','i','th']), tricky('the', 'the'),
      word('long', 'long', ['l','o','ng']), word('ends', 'ends', ['e','n','d','s']),
      word('down.', 'down', ['d','ow','n']),
      word('Tie', 'tie', ['t','ie']), tricky('a', 'a'),
      word('tight', 'tight', ['t','igh','t']), word('knot', 'knot', ['kn','o','t']),
      tricky('where', 'where'), tricky('the', 'the'),
      word('sticks', 'sticks', ['s','t','i','ck','s']),
      word('meet', 'meet', ['m','ee','t']),
      word('in', 'in', ['i','n']), tricky('the', 'the'),
      word('middle.', 'middle', ['m','i','dd','l']),
      tricky('The', 'the'), word('girl', 'girl', ['g','ir','l']),
      word('tied', 'tied', ['t','ie','d']), tricky('the', 'the'),
      word('knot', 'knot', ['kn','o','t']),
      word('and', 'and', ['a','n','d']), word('pulled', 'pulled', ['p','u','ll','ed']),
      tricky('the', 'the'), word('string', 'string', ['s','t','r','i','ng']),
      word('firm.', 'firm', ['f','ir','m']),
      word('Now', 'now', ['n','ow']), word('wrap', 'wrap', ['wr','a','p']),
      tricky('the', 'the'), word('string', 'string', ['s','t','r','i','ng']),
      word('round', 'round', ['r','ou','n','d']),
      word('each', 'each', ['ea','ch']), word('end,', 'end', ['e','n','d']),
      tricky('said', 'said'), word('Grandad.', 'grandad', ['g','r','a','n','d','a','d']),
    ],
    imageUrl: '/illustrations/5_3/page3.png', audioUrl: '/sounds/sentences/L5_3_p3.mp3',
  },

  // Page 4
  {
    type: 'story',
    sentences: [
      '"Step two," said Grandad.',
      '"Lay the paper flat on the frame."',
      '"Wrap each side over the string and press it down."',
      'The paper slipped, and a long rip ripped right through.',
      'The girl sat near the frame and felt very sad.',
    ],
    words: [
      word('Step', 'step', ['s','t','e','p']), tricky('two,', 'two'),
      tricky('said', 'said'), word('Grandad.', 'grandad', ['g','r','a','n','d','a','d']),
      word('Lay', 'lay', ['l','ay']), tricky('the', 'the'),
      tricky('paper', 'paper'), word('flat', 'flat', ['f','l','a','t']),
      word('on', 'on', ['o','n']), tricky('the', 'the'),
      word('frame.', 'frame', ['f','r','a-e','m']),
      word('Wrap', 'wrap', ['wr','a','p']), word('each', 'each', ['ea','ch']),
      word('side', 'side', ['s','i-e','d']),
      tricky('over', 'over'), tricky('the', 'the'),
      word('string', 'string', ['s','t','r','i','ng']),
      word('and', 'and', ['a','n','d']), word('press', 'press', ['p','r','e','ss']),
      word('it', 'it', ['i','t']), word('down.', 'down', ['d','ow','n']),
      tricky('The', 'the'), tricky('paper', 'paper'),
      word('slipped,', 'slipped', ['s','l','i','pp','ed']),
      word('and', 'and', ['a','n','d']), tricky('a', 'a'),
      word('long', 'long', ['l','o','ng']), word('rip', 'rip', ['r','i','p']),
      word('ripped', 'ripped', ['r','i','pp','ed']),
      word('right', 'right', ['r','igh','t']), tricky('through.', 'through'),
      tricky('The', 'the'), word('girl', 'girl', ['g','ir','l']),
      word('sat', 'sat', ['s','a','t']), word('near', 'near', ['n','ear']),
      tricky('the', 'the'), word('frame', 'frame', ['f','r','a-e','m']),
      word('and', 'and', ['a','n','d']), word('felt', 'felt', ['f','e','l','t']),
      word('very', 'very', ['v','e','r','ee']),
      word('sad.', 'sad', ['s','a','d']),
    ],
    imageUrl: '/illustrations/5_3/page4.png', audioUrl: '/sounds/sentences/L5_3_p4.mp3',
  },

  // Page 5
  {
    type: 'story',
    sentences: [
      'She ripped the sheet and shouted, "I quit, Grandad!"',
      'Grandad waited, still and kind, and did not rush at all.',
      '"Are you sure you want to stop now?" he asked.',
      '"We can try once more. I am right here with you."',
      'He rested a hand on her wrist and smiled.',
    ],
    words: [
      tricky('She', 'she'), word('ripped', 'ripped', ['r','i','pp','ed']),
      tricky('the', 'the'), word('sheet', 'sheet', ['sh','ee','t']),
      word('and', 'and', ['a','n','d']),
      word('shouted,', 'shouted', ['sh','ou','t','e','d']),
      tricky('I', 'I'), word('quit,', 'quit', ['qu','i','t']),
      word('Grandad!', 'grandad', ['g','r','a','n','d','a','d']),
      word('Grandad', 'grandad', ['g','r','a','n','d','a','d']),
      word('waited,', 'waited', ['w','ai','t','e','d']),
      word('still', 'still', ['s','t','i','ll']),
      word('and', 'and', ['a','n','d']),
      word('kind,', 'kind', ['k','i','n','d']),
      word('and', 'and', ['a','n','d']),
      word('did', 'did', ['d','i','d']), word('not', 'not', ['n','o','t']),
      word('rush', 'rush', ['r','u','sh']),
      word('at', 'at', ['a','t']), tricky('all.', 'all'),
      tricky('Are', 'are'), tricky('you', 'you'),
      tricky('sure', 'sure'), tricky('you', 'you'),
      word('want', 'want', ['w','a','n','t']), tricky('to', 'to'),
      word('stop', 'stop', ['s','t','o','p']), word('now?', 'now', ['n','ow']),
      tricky('he', 'he'), word('asked.', 'asked', ['a','s','k','ed']),
      tricky('We', 'we'), word('can', 'can', ['c','a','n']),
      word('try', 'try', ['t','r','y']), tricky('once', 'once'),
      word('more.', 'more', ['m','ore']),
      tricky('I', 'I'), word('am', 'am', ['a','m']),
      word('right', 'right', ['r','igh','t']), tricky('here', 'here'),
      word('with', 'with', ['w','i','th']), tricky('you.', 'you'),
      tricky('He', 'he'), word('rested', 'rested', ['r','e','s','t','e','d']),
      tricky('a', 'a'), word('hand', 'hand', ['h','a','n','d']),
      word('on', 'on', ['o','n']), word('her', 'her', ['h','er']),
      word('wrist', 'wrist', ['wr','i','s','t']),
      word('and', 'and', ['a','n','d']),
      word('smiled.', 'smiled', ['s','m','i-e','l','ed']),
    ],
    imageUrl: '/illustrations/5_3/page5.png', audioUrl: '/sounds/sentences/L5_3_p5.mp3',
  },

  // Page 6
  {
    type: 'story',
    sentences: [
      'The girl nodded, took a deep breath, and set a new sheet.',
      '"Read the instruction again, and we go slow this time."',
      '"Press each side flat before you move on."',
      'She wrapped, smoothed, and waited until the paper held firm.',
      'Grandad checked the wind on his phone and smiled at her.',
    ],
    words: [
      tricky('The', 'the'), word('girl', 'girl', ['g','ir','l']),
      word('nodded,', 'nodded', ['n','o','dd','ed']),
      word('took', 'took', ['t','oo','k']), tricky('a', 'a'),
      word('deep', 'deep', ['d','ee','p']),
      word('breath,', 'breath', ['b','r','ea','th']),
      word('and', 'and', ['a','n','d']), word('set', 'set', ['s','e','t']),
      tricky('a', 'a'), word('new', 'new', ['n','ew']),
      word('sheet.', 'sheet', ['sh','ee','t']),
      word('Read', 'read', ['r','ea','d']), tricky('the', 'the'),
      word('instruction', 'instruction', ['i','n','s','t','r','u','c','tion']),
      word('again,', 'again', ['a','g','ai','n']),
      word('and', 'and', ['a','n','d']), tricky('we', 'we'),
      tricky('go', 'go'), word('slow', 'slow', ['s','l','ow']),
      word('this', 'this', ['th','i','s']), word('time.', 'time', ['t','i-e','m']),
      word('Press', 'press', ['p','r','e','ss']), word('each', 'each', ['ea','ch']),
      word('side', 'side', ['s','i-e','d']), word('flat', 'flat', ['f','l','a','t']),
      word('before', 'before', ['b','e','f','ore']),
      tricky('you', 'you'), word('move', 'move', ['m','oo','v']),
      word('on.', 'on', ['o','n']),
      tricky('She', 'she'), word('wrapped,', 'wrapped', ['wr','a','pp','ed']),
      word('smoothed,', 'smoothed', ['s','m','oo','th','ed']),
      word('and', 'and', ['a','n','d']), word('waited', 'waited', ['w','ai','t','e','d']),
      word('until', 'until', ['u','n','t','i','l']), tricky('the', 'the'),
      tricky('paper', 'paper'),
      word('held', 'held', ['h','e','l','d']),
      word('firm.', 'firm', ['f','ir','m']),
      word('Grandad', 'grandad', ['g','r','a','n','d','a','d']),
      word('checked', 'checked', ['ch','e','ck','ed']),
      tricky('the', 'the'), word('wind', 'wind', ['w','i','n','d']),
      word('on', 'on', ['o','n']), word('his', 'his', ['h','i','s']),
      word('phone', 'phone', ['ph','o-e','n']),
      word('and', 'and', ['a','n','d']),
      word('smiled', 'smiled', ['s','m','i-e','l','ed']),
      word('at', 'at', ['a','t']), word('her.', 'her', ['h','er']),
    ],
    imageUrl: '/illustrations/5_3/page6.png', audioUrl: '/sounds/sentences/L5_3_p6.mp3',
  },

  // Page 7
  {
    type: 'story',
    sentences: [
      'At last, the kite was ready, light to hold.',
      'Grandad tied the line to the middle with a strong knot.',
      'He said, "Run and let the wind pull it up."',
      'She ran, and the kite soared up high.',
      'The yellow shape rose over more roofs.',
    ],
    words: [
      word('At', 'at', ['a','t']), word('last,', 'last', ['l','a','s','t']),
      tricky('the', 'the'), word('kite', 'kite', ['k','i-e','t']),
      tricky('was', 'was'), tricky('ready,', 'ready'),
      word('light', 'light', ['l','igh','t']),
      tricky('to', 'to'), word('hold.', 'hold', ['h','o','l','d']),
      word('Grandad', 'grandad', ['g','r','a','n','d','a','d']),
      word('tied', 'tied', ['t','ie','d']), tricky('the', 'the'),
      word('line', 'line', ['l','i-e','n']),
      tricky('to', 'to'), tricky('the', 'the'),
      word('middle', 'middle', ['m','i','dd','l']),
      word('with', 'with', ['w','i','th']), tricky('a', 'a'),
      word('strong', 'strong', ['s','t','r','o','ng']),
      word('knot.', 'knot', ['kn','o','t']),
      tricky('He', 'he'), tricky('said,', 'said'),
      word('Run', 'run', ['r','u','n']),
      word('and', 'and', ['a','n','d']), word('let', 'let', ['l','e','t']),
      tricky('the', 'the'), word('wind', 'wind', ['w','i','n','d']),
      word('pull', 'pull', ['p','u','ll']), word('it', 'it', ['i','t']),
      word('up.', 'up', ['u','p']),
      tricky('She', 'she'), word('ran,', 'ran', ['r','a','n']),
      word('and', 'and', ['a','n','d']), tricky('the', 'the'),
      word('kite', 'kite', ['k','i-e','t']), word('soared', 'soared', ['s','ore','ed']),
      word('up', 'up', ['u','p']), word('high.', 'high', ['h','igh']),
      tricky('The', 'the'), word('yellow', 'yellow', ['y','e','ll','ow']),
      word('shape', 'shape', ['sh','a-e','p']),
      word('rose', 'rose', ['r','o-e','s']),
      tricky('over', 'over'), word('more', 'more', ['m','ore']),
      word('roofs.', 'roofs', ['r','oo','f','s']),
    ],
    imageUrl: '/illustrations/5_3/page7.png', audioUrl: '/sounds/sentences/L5_3_p7.mp3',
  },

  // Page 8
  {
    type: 'story',
    sentences: [
      'We hear cheers from a near roof as the kite turns.',
      'Grandad clapped and beamed with joy and pride.',
      'The girl shouted, "Pure joy, Grandad!" and waved the line high.',
      'The kite soared, and we watched the entire sky.',
      'Grandad asked, "Shall we make more before we go in?"',
    ],
    words: [
      tricky('We', 'we'), word('hear', 'hear', ['h','ear']),
      word('cheers', 'cheers', ['ch','ear','s']),
      word('from', 'from', ['f','r','o','m']), tricky('a', 'a'),
      word('near', 'near', ['n','ear']), word('roof', 'roof', ['r','oo','f']),
      word('as', 'as', ['a','s']), tricky('the', 'the'),
      word('kite', 'kite', ['k','i-e','t']), word('turns.', 'turns', ['t','ur','n','s']),
      word('Grandad', 'grandad', ['g','r','a','n','d','a','d']),
      word('clapped', 'clapped', ['c','l','a','pp','ed']),
      word('and', 'and', ['a','n','d']),
      word('beamed', 'beamed', ['b','ea','m','ed']),
      word('with', 'with', ['w','i','th']), word('joy', 'joy', ['j','oy']),
      word('and', 'and', ['a','n','d']), word('pride.', 'pride', ['p','r','i-e','d']),
      tricky('The', 'the'), word('girl', 'girl', ['g','ir','l']),
      word('shouted,', 'shouted', ['sh','ou','t','e','d']),
      word('Pure', 'pure', ['p','ure']), word('joy,', 'joy', ['j','oy']),
      word('Grandad!', 'grandad', ['g','r','a','n','d','a','d']),
      word('and', 'and', ['a','n','d']),
      word('waved', 'waved', ['w','a-e','v','ed']),
      tricky('the', 'the'), word('line', 'line', ['l','i-e','n']),
      word('high.', 'high', ['h','igh']),
      tricky('The', 'the'), word('kite', 'kite', ['k','i-e','t']),
      word('soared,', 'soared', ['s','ore','ed']),
      word('and', 'and', ['a','n','d']), tricky('we', 'we'),
      word('watched', 'watched', ['w','a','t','ch','ed']),
      tricky('the', 'the'), word('entire', 'entire', ['e','n','t','ire']),
      word('sky.', 'sky', ['s','k','y']),
      word('Grandad', 'grandad', ['g','r','a','n','d','a','d']),
      word('asked,', 'asked', ['a','s','k','ed']),
      word('Shall', 'shall', ['sh','a','ll']), tricky('we', 'we'),
      word('make', 'make', ['m','a-e','k']), word('more', 'more', ['m','ore']),
      word('before', 'before', ['b','e','f','ore']),
      tricky('we', 'we'), tricky('go', 'go'),
      word('in?', 'in', ['i','n']),
    ],
    imageUrl: '/illustrations/5_3/page8.png', audioUrl: '/sounds/sentences/L5_3_p8.mp3',
  },

  // ── QUIZ ──
  {
    type: 'quiz',
    questions: [
      { question: 'What did the girl want to do?',
        options: [{ label: 'fly a kite', isCorrect: true }, { label: 'fly a plane', isCorrect: false }, { label: 'paint a picture', isCorrect: false }] },
      { question: 'What happened to the paper on the first try?',
        options: [{ label: 'it ripped', isCorrect: true }, { label: 'it flew away', isCorrect: false }, { label: 'it got wet', isCorrect: false }] },
      { question: 'How did the girl feel at the end?',
        options: [{ label: 'pure joy', isCorrect: true }, { label: 'sad', isCorrect: false }, { label: 'tired', isCorrect: false }] },
    ],
  },

  { type: 'sound_spotlight', sound: 'ure',
    explanation: "The letters 'ure' make two different sounds. Tap each one to hear!",
    variants: [
      { audioKey: 'ure_yoor', label: "sounds 'yoor'", example: 'pure' },
      { audioKey: 'ure_ur',   label: "sounds 'ur'",   example: 'nature' },
    ],
    items: [
      { word: 'pure',   imageUrl: '/images/words/pure.png',   focusIndex: 1, morphSplit: 1, variant: 'ure_yoor' },
      { word: 'cure',   imageUrl: '/images/words/cure.png',   focusIndex: 1, morphSplit: 1, variant: 'ure_yoor' },
      { word: 'secure', imageUrl: '/images/words/secure.png', focusIndex: 3, morphSplit: 3, variant: 'ure_yoor' },
      { word: 'nature',  imageUrl: '/images/words/nature.png',  focusIndex: 3, morphSplit: 3, variant: 'ure_ur' },
      { word: 'picture', imageUrl: '/images/words/picture.png', focusIndex: 4, morphSplit: 4, variant: 'ure_ur' },
      { word: 'future',  imageUrl: '/images/words/future.png',  focusIndex: 3, morphSplit: 3, variant: 'ure_ur' },
    ],
  },
  { type: 'sound_spotlight', sound: 'tion', items: [
    { word: 'action', imageUrl: '/images/words/action.png', focusIndex: 2 },
    { word: 'section', imageUrl: '/images/words/section.png', focusIndex: 3 },
    { word: 'station', imageUrl: '/images/words/station.png', focusIndex: 3 },
    { word: 'instruction', imageUrl: '/images/words/instruction.png', focusIndex: 7 },
  ] },

  { type: 'word_reading', words: [
    tricky('sure', 'sure'), word('pure', 'pure', ['p','ure']),
    word('instruction', 'instruction', ['i','n','s','t','r','u','c','tion']),
    word('knot', 'knot', ['kn','o','t']),
    word('wrap', 'wrap', ['wr','a','p']),
    word('phone', 'phone', ['ph','o-e','n']),
  ] },

  { type: 'tricky_words', words: [
    tricky('said', 'said'), tricky('was', 'was'),
    tricky('you', 'you'), tricky('are', 'are'),
    tricky('here', 'here'), tricky('through', 'through'),
  ] },

  { type: 'nonsense_words', words: [
    word('plure', 'plure', ['p','l','ure']), word('tration', 'tration', ['t','r','a','tion']),
    word('brure', 'brure', ['b','r','ure']), word('snection', 'snection', ['s','n','e','c','tion']),
    word('frure', 'frure', ['f','r','ure']), word('draction', 'draction', ['d','r','a','c','tion']),
    word('glure', 'glure', ['g','l','ure']), word('prection', 'prection', ['p','r','e','c','tion']),
  ] },

  { type: 'spelling', words: [
    { word: 'sure', imageUrl: '/images/words/sure.png', letters: ['sh','ure'] },
    { word: 'pure', imageUrl: '/images/words/pure.png', letters: ['p','ure'] },
    { word: 'knot', imageUrl: '/images/words/knot.png', letters: ['kn','o','t'] },
    { word: 'wrap', imageUrl: '/images/words/wrap.png', letters: ['wr','a','p'] },
  ] },

  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/5_3/page1.png', label: 'She dreamed of a kite.', correctIndex: 0 },
    { imageUrl: '/illustrations/5_3/page2.png', label: 'Grandad showed an instruction card.', correctIndex: 1 },
    { imageUrl: '/illustrations/5_3/page4.png', label: 'The paper ripped through!', correctIndex: 2 },
    { imageUrl: '/illustrations/5_3/page5.png', label: 'Grandad waited, kind and calm.', correctIndex: 3 },
    { imageUrl: '/illustrations/5_3/page6.png', label: 'She wrapped and smoothed it firm.', correctIndex: 4 },
    { imageUrl: '/illustrations/5_3/page8.png', label: 'The kite soared. Pure joy!', correctIndex: 5 },
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
  { type: 'cover', title: 'A Place for Me', subtitle: 'Level 5 · Reading Together', imageUrl: '/illustrations/5_4/cover.png' },

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
      tricky('I', 'I'), word('came', 'came', ['c','a-e','m']),
      tricky('to', 'to'), tricky('a', 'a'),
      word('celebration', 'celebration', ['s','e','l','e','b','r','a','tion']),
      word('in', 'in', ['i','n']), tricky('a', 'a'),
      word('colourful', 'colourful', ['c','o','l','er','f','u','l']),
      word('street', 'street', ['s','t','r','ee','t']),
      word('near', 'near', ['n','ear']), tricky('the', 'the'),
      word('shore.', 'shore', ['sh','ore']),
      word('But', 'but', ['b','u','t']), tricky('I', 'I'),
      word('did', 'did', ['d','i','d']), word('not', 'not', ['n','o','t']),
      word('know', 'know', ['kn','ow']), tricky('anyone.', 'anyone'),
      tricky('I', 'I'), word('stood', 'stood', ['s','t','oo','d']),
      word('alone', 'alone', ['a','l','o-e','n']),
      word('in', 'in', ['i','n']), tricky('the', 'the'),
      word('corner,', 'corner', ['c','or','n','er']),
      word('watching', 'watching', ['w','a','t','ch','i','ng']),
      tricky('the', 'the'), tricky('people', 'people'),
      word('dance', 'dance', ['d','a','n','s']),
      word('and', 'and', ['a','n','d']), word('sing.', 'sing', ['s','i','ng']),
      word('My', 'my', ['m','y']), word('heart', 'heart', ['h','ear','t']),
      word('felt', 'felt', ['f','e','l','t']), word('heavy.', 'heavy', ['h','e','v','ee']),
    ],
    imageUrl: '/illustrations/5_4/page1.png', audioUrl: '/sounds/sentences/L5_4_p1.mp3',
  },

  // Page 2
  {
    type: 'story',
    sentences: ['I could hear music and laughter from every door.', 'I could see food and drums.', 'But no one saw me.', 'I felt left out.'],
    words: [
      tricky('I', 'I'), tricky('could', 'could'),
      word('hear', 'hear', ['h','ear']),
      tricky('music', 'music'),
      word('and', 'and', ['a','n','d']),
      tricky('laughter', 'laughter'),
      word('from', 'from', ['f','r','o','m']),
      word('every', 'every', ['e','v','r','ee']),
      word('door.', 'door', ['d','oor']),
      tricky('I', 'I'), tricky('could', 'could'),
      word('see', 'see', ['s','ee']), word('food', 'food', ['f','oo','d']),
      word('and', 'and', ['a','n','d']), word('drums.', 'drums', ['d','r','u','m','s']),
      word('But', 'but', ['b','u','t']), word('no', 'no', ['n','o']),
      tricky('one', 'one'), word('saw', 'saw', ['s','aw']),
      word('me.', 'me', ['m','ee']),
      tricky('I', 'I'), word('felt', 'felt', ['f','e','l','t']),
      word('left', 'left', ['l','e','f','t']),
      word('out.', 'out', ['ou','t']),
    ],
    imageUrl: '/illustrations/5_4/page2.png', audioUrl: '/sounds/sentences/L5_4_p2.mp3',
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
      word('time.', 'time', ['t','i-e','m']),
      word('But', 'but', ['b','u','t']), word('not', 'not', ['n','o','t']),
      word('me.', 'me', ['m','ee']),
      tricky('I', 'I'), word('put', 'put', ['p','u','t']),
      word('my', 'my', ['m','y']), word('hand', 'hand', ['h','a','n','d']),
      word('on', 'on', ['o','n']), word('my', 'my', ['m','y']),
      word('heart.', 'heart', ['h','ear','t']),
      tricky('I', 'I'), tricky('was', 'was'),
      word('alone.', 'alone', ['a','l','o-e','n']),
    ],
    imageUrl: '/illustrations/5_4/page3.png', audioUrl: '/sounds/sentences/L5_4_p3.mp3',
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
      word('smile.', 'smile', ['s','m','i-e','l']),
      tricky('He', 'he'), word('came', 'came', ['c','a-e','m']),
      tricky('over', 'over'), word('and', 'and', ['a','n','d']),
      word('held', 'held', ['h','e','l','d']),
      word('out', 'out', ['ou','t']), word('his', 'his', ['h','i','s']),
      word('hand.', 'hand', ['h','a','n','d']),
      word('Will', 'will', ['w','i','ll']), tricky('you', 'you'),
      tricky('come', 'come'),
      word('dance', 'dance', ['d','a','n','s']),
      word('with', 'with', ['w','i','th']),
      word('me?', 'me', ['m','ee']),
      tricky('he', 'he'), tricky('said.', 'said'),
      tricky('I', 'I'), word('felt', 'felt', ['f','e','l','t']),
      tricky('surprised', 'surprised'),
      word('and', 'and', ['a','n','d']),
      tricky('happy!', 'happy'),
    ],
    imageUrl: '/illustrations/5_4/page4.png', audioUrl: '/sounds/sentences/L5_4_p4.mp3',
  },

  // Page 5
  {
    type: 'story',
    sentences: ['We went to a food stall.', 'The man gave us golden-brown acarajé.', 'It was so good!', 'I took a bite and smiled.', 'This pure joy was new to me.'],
    words: [
      tricky('We', 'we'), word('went', 'went', ['w','e','n','t']),
      tricky('to', 'to'), tricky('a', 'a'),
      word('food', 'food', ['f','oo','d']),
      tricky('stall.', 'stall'),
      tricky('The', 'the'), word('man', 'man', ['m','a','n']),
      word('gave', 'gave', ['g','a-e','v']),
      word('us', 'us', ['u','s']),
      word('golden-brown', 'golden-brown', ['g','o','l','d','e','n','b','r','ow','n']),
      tricky('acarajé.', 'acaraje'),
      word('It', 'it', ['i','t']), tricky('was', 'was'),
      tricky('so', 'so'), word('good!', 'good', ['g','oo','d']),
      tricky('I', 'I'), word('took', 'took', ['t','oo','k']),
      tricky('a', 'a'), word('bite', 'bite', ['b','i-e','t']),
      word('and', 'and', ['a','n','d']),
      word('smiled.', 'smiled', ['s','m','i-e','l','d']),
      word('This', 'this', ['th','i','s']),
      word('pure', 'pure', ['p','ure']),
      word('joy', 'joy', ['j','oy']), tricky('was', 'was'),
      word('new', 'new', ['n','ew']), tricky('to', 'to'),
      word('me.', 'me', ['m','ee']),
    ],
    imageUrl: '/illustrations/5_4/page5.png', audioUrl: '/sounds/sentences/L5_4_p5.mp3',
  },

  // Page 6
  {
    type: 'story',
    sentences: ['We walked down the street together.', 'We saw the old colourful buildings.', 'We heard drums near the fire.', '"I like this place," I said.', '"And I like you," said the boy.'],
    words: [
      tricky('We', 'we'), tricky('walked', 'walked'),
      word('down', 'down', ['d','ow','n']), tricky('the', 'the'),
      word('street', 'street', ['s','t','r','ee','t']),
      tricky('together.', 'together'),
      tricky('We', 'we'), word('saw', 'saw', ['s','aw']),
      tricky('the', 'the'), word('old', 'old', ['o','l','d']),
      word('colourful', 'colourful', ['c','o','l','er','f','u','l']),
      word('buildings.', 'buildings', ['b','i','l','d','i','ng','s']),
      tricky('We', 'we'), word('heard', 'heard', ['h','ear','d']),
      word('drums', 'drums', ['d','r','u','m','s']),
      word('near', 'near', ['n','ear']), tricky('the', 'the'),
      word('fire.', 'fire', ['f','ire']),
      tricky('I', 'I'), word('like', 'like', ['l','i-e','k']),
      word('this', 'this', ['th','i','s']),
      word('place,', 'place', ['p','l','a-e','s']),
      tricky('I', 'I'), tricky('said.', 'said'),
      word('And', 'and', ['a','n','d']), tricky('I', 'I'),
      word('like', 'like', ['l','i-e','k']),
      tricky('you,', 'you'), tricky('said', 'said'),
      tricky('the', 'the'), word('boy.', 'boy', ['b','oy']),
    ],
    imageUrl: '/illustrations/5_4/page6.png', audioUrl: '/sounds/sentences/L5_4_p6.mp3',
  },

  // Page 7
  {
    type: 'story',
    sentences: ['Soon we were dancing!', 'Other children came to join us.', 'The music was all around.', 'We spun and laughed.', 'The fire and the drums made the perfect sound for our dance.'],
    words: [
      word('Soon', 'soon', ['s','oo','n']), tricky('we', 'we'),
      tricky('were', 'were'), word('dancing!', 'dancing', ['d','a','n','s','i','ng']),
      tricky('Other', 'other'), word('children', 'children', ['ch','i','l','d','r','e','n']),
      word('came', 'came', ['c','a-e','m']), tricky('to', 'to'),
      word('join', 'join', ['j','oi','n']),
      word('us.', 'us', ['u','s']),
      tricky('The', 'the'), tricky('music', 'music'),
      tricky('was', 'was'), tricky('all', 'all'),
      word('around.', 'around', ['a','r','ou','n','d']),
      tricky('We', 'we'), word('spun', 'spun', ['s','p','u','n']),
      word('and', 'and', ['a','n','d']),
      tricky('laughed.', 'laughed'),
      tricky('The', 'the'), word('fire', 'fire', ['f','ire']),
      word('and', 'and', ['a','n','d']), tricky('the', 'the'),
      word('drums', 'drums', ['d','r','u','m','s']),
      word('made', 'made', ['m','a-e','d']), tricky('the', 'the'),
      tricky('perfect', 'perfect'),
      word('sound', 'sound', ['s','ou','n','d']),
      word('for', 'for', ['f','or']), tricky('our', 'our'),
      word('dance.', 'dance', ['d','a','n','s']),
    ],
    imageUrl: '/illustrations/5_4/page7.png', audioUrl: '/sounds/sentences/L5_4_p7.mp3',
  },

  // Page 8
  {
    type: 'story',
    sentences: ['As evening came, we sat together.', 'I held the boy\'s hand.', 'I did not want to leave.', '"Will you come back?" he asked.', '"Yes," I said. "This is my place too."'],
    words: [
      word('As', 'as', ['a','s']), word('evening', 'evening', ['ee','v','n','i','ng']),
      word('came,', 'came', ['c','a-e','m']), tricky('we', 'we'),
      word('sat', 'sat', ['s','a','t']), tricky('together.', 'together'),
      tricky('I', 'I'), word('held', 'held', ['h','e','l','d']),
      tricky('the', 'the'), word('boy\'s', 'boys', ['b','oy','s']),
      word('hand.', 'hand', ['h','a','n','d']),
      tricky('I', 'I'), word('did', 'did', ['d','i','d']),
      word('not', 'not', ['n','o','t']), word('want', 'want', ['w','a','n','t']),
      tricky('to', 'to'), word('leave.', 'leave', ['l','ea','v']),
      word('Will', 'will', ['w','i','ll']), tricky('you', 'you'),
      tricky('come', 'come'),
      word('back?', 'back', ['b','a','ck']), tricky('he', 'he'),
      word('asked.', 'asked', ['a','s','k','ed']),
      word('Yes,', 'yes', ['y','e','s']), tricky('I', 'I'),
      tricky('said.', 'said'), word('This', 'this', ['th','i','s']),
      tricky('is', 'is'), word('my', 'my', ['m','y']),
      word('place', 'place', ['p','l','a-e','s']),
      word('too.', 'too', ['t','oo']),
    ],
    imageUrl: '/illustrations/5_4/page8.png', audioUrl: '/sounds/sentences/L5_4_p8.mp3',
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
    { word: 'shore', imageUrl: '/images/words/shore.png', letters: ['sh','ore'] },
    { word: 'near', imageUrl: '/images/words/near.png', letters: ['n','ear'] },
    { word: 'pure', imageUrl: '/images/words/pure.png', letters: ['p','ure'] },
    { word: 'fire', imageUrl: '/images/words/fire.png', letters: ['f','ire'] },
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
