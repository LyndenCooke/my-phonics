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
    sentences: ['The boy went through the park on his way home.', 'He was tired, and his feet were sore from play.', 'He sat on a bench to rest for a bit.', 'On the path he saw a smooth, flat stone.', 'He bent to pick it up and held it.'],
    words: [
      tricky('The', 'the'), word('boy', 'boy', ['b','oy']),
      word('went', 'went', ['w','e','n','t']), tricky('through', 'through'),
      tricky('the', 'the'), word('park', 'park', ['p','ar','k']),
      word('on', 'on', ['o','n']), word('his', 'his', ['h','i','s']),
      word('way', 'way', ['w','ay']), word('home.', 'home', ['h','o-e','m']),
      tricky('He', 'he'), tricky('was', 'was'),
      word('tired,', 'tired', ['t','ire','d']), word('and', 'and', ['a','n','d']),
      word('his', 'his', ['h','i','s']), word('feet', 'feet', ['f','ee','t']),
      tricky('were', 'were'), word('sore', 'sore', ['s','ore']),
      word('from', 'from', ['f','r','o','m']), word('play.', 'play', ['p','l','ay']),
      tricky('He', 'he'), word('sat', 'sat', ['s','a','t']),
      word('on', 'on', ['o','n']), tricky('a', 'a'),
      word('bench', 'bench', ['b','e','n','ch']), tricky('to', 'to'),
      word('rest', 'rest', ['r','e','s','t']), word('for', 'for', ['f','or']),
      tricky('a', 'a'), word('bit.', 'bit', ['b','i','t']),
      word('On', 'on', ['o','n']), tricky('the', 'the'),
      word('path', 'path', ['p','a','th']), tricky('he', 'he'),
      word('saw', 'saw', ['s','aw']), tricky('a', 'a'),
      word('smooth,', 'smooth', ['s','m','oo','th']), word('flat', 'flat', ['f','l','a','t']),
      word('stone.', 'stone', ['s','t','o-e','n']),
      tricky('He', 'he'), word('bent', 'bent', ['b','e','n','t']),
      tricky('to', 'to'), word('pick', 'pick', ['p','i','ck']),
      word('it', 'it', ['i','t']), word('up', 'up', ['u','p']),
      word('and', 'and', ['a','n','d']), word('held', 'held', ['h','e','l','d']),
      word('it.', 'it', ['i','t']),
    ],
    imageUrl: '/illustrations/5_1/page1.png', audioUrl: '/sounds/sentences/L5_1_p1.mp3',
  },

  // Page 2
  {
    type: 'story',
    sentences: ['The stone felt cool in his hand as he sat.', 'It had a shine, like one found by the shore.', 'Once, before this winter, he had seen a stone like it.', 'He sat still and went back to that day.', 'Leaves fell near the bench, and he shut his eyes.'],
    words: [
      tricky('The', 'the'), word('stone', 'stone', ['s','t','o-e','n']),
      word('felt', 'felt', ['f','e','l','t']), word('cool', 'cool', ['c','oo','l']),
      word('in', 'in', ['i','n']), word('his', 'his', ['h','i','s']),
      word('hand', 'hand', ['h','a','n','d']), word('as', 'as', ['a','s']),
      tricky('he', 'he'), word('sat.', 'sat', ['s','a','t']),
      word('It', 'it', ['i','t']), word('had', 'had', ['h','a','d']),
      tricky('a', 'a'), word('shine,', 'shine', ['sh','i-e','n']),
      word('like', 'like', ['l','i-e','k']), tricky('one', 'one'),
      word('found', 'found', ['f','ou','n','d']), word('by', 'by', ['b','y']),
      tricky('the', 'the'), word('shore.', 'shore', ['sh','ore']),
      tricky('Once,', 'once'), word('before', 'before', ['b','e','f','ore']),
      word('this', 'this', ['th','i','s']), word('winter,', 'winter', ['w','i','n','t','er']),
      tricky('he', 'he'), word('had', 'had', ['h','a','d']),
      word('seen', 'seen', ['s','ee','n']), tricky('a', 'a'),
      word('stone', 'stone', ['s','t','o-e','n']), word('like', 'like', ['l','i-e','k']),
      word('it.', 'it', ['i','t']),
      tricky('He', 'he'), word('sat', 'sat', ['s','a','t']),
      word('still', 'still', ['s','t','i','ll']), word('and', 'and', ['a','n','d']),
      word('went', 'went', ['w','e','n','t']), word('back', 'back', ['b','a','ck']),
      tricky('to', 'to'), word('that', 'that', ['th','a','t']),
      word('day.', 'day', ['d','ay']),
      word('Leaves', 'leaves', ['l','ea','v','s']), word('fell', 'fell', ['f','e','ll']),
      word('near', 'near', ['n','ear']), tricky('the', 'the'),
      word('bench,', 'bench', ['b','e','n','ch']), word('and', 'and', ['a','n','d']),
      tricky('he', 'he'), word('shut', 'shut', ['sh','u','t']),
      word('his', 'his', ['h','i','s']), tricky('eyes.', 'eyes'),
    ],
    imageUrl: '/illustrations/5_1/page2.png', audioUrl: '/sounds/sentences/L5_1_p2.mp3',
  },

  // Page 3
  {
    type: 'story',
    sentences: ['Before winter came, Dad took him to the shore.', 'The sea air was pure and fresh, and the sand felt soft.', '"Let us explore!" said Dad, and they ran on the beach.', 'They splashed in waves and watched the fire by the rocks.', 'Dad took a photo as flames moved in slow motion.'],
    words: [
      word('Before', 'before', ['b','e','f','ore']),
      word('winter', 'winter', ['w','i','n','t','er']), word('came,', 'came', ['c','a-e','m']),
      word('Dad', 'dad', ['d','a','d']), word('took', 'took', ['t','oo','k']),
      word('him', 'him', ['h','i','m']), tricky('to', 'to'),
      tricky('the', 'the'), word('shore.', 'shore', ['sh','ore']),
      tricky('The', 'the'), word('sea', 'sea', ['s','ea']),
      word('air', 'air', ['air']), tricky('was', 'was'),
      word('pure', 'pure', ['p','ure']), word('and', 'and', ['a','n','d']),
      word('fresh,', 'fresh', ['f','r','e','sh']), word('and', 'and', ['a','n','d']),
      tricky('the', 'the'), word('sand', 'sand', ['s','a','n','d']),
      word('felt', 'felt', ['f','e','l','t']), word('soft.', 'soft', ['s','o','f','t']),
      word('Let', 'let', ['l','e','t']), word('us', 'us', ['u','s']),
      word('explore!', 'explore', ['e','x','p','l','ore']),
      tricky('said', 'said'), word('Dad,', 'dad', ['d','a','d']),
      word('and', 'and', ['a','n','d']), tricky('they', 'they'),
      word('ran', 'ran', ['r','a','n']), word('on', 'on', ['o','n']),
      tricky('the', 'the'), word('beach.', 'beach', ['b','ea','ch']),
      tricky('They', 'they'), word('splashed', 'splashed', ['s','p','l','a','sh','ed']),
      word('in', 'in', ['i','n']), word('waves', 'waves', ['w','a-e','v','s']),
      word('and', 'and', ['a','n','d']), word('watched', 'watched', ['w','a','tch','ed']),
      tricky('the', 'the'), word('fire', 'fire', ['f','ire']),
      word('by', 'by', ['b','y']), tricky('the', 'the'),
      word('rocks.', 'rocks', ['r','o','ck','s']),
      word('Dad', 'dad', ['d','a','d']), word('took', 'took', ['t','oo','k']),
      tricky('a', 'a'), word('photo', 'photo', ['ph','o','t','o']),
      word('as', 'as', ['a','s']), word('flames', 'flames', ['f','l','a-e','m','s']),
      word('moved', 'moved', ['m','o-e','v','ed']), word('in', 'in', ['i','n']),
      word('slow', 'slow', ['s','l','ow']), word('motion.', 'motion', ['m','o-e','tion']),
    ],
    imageUrl: '/illustrations/5_1/page3.png', audioUrl: '/sounds/sentences/L5_1_p3.mp3',
  },

  // Page 4
  {
    type: 'story',
    sentences: ['The next day, he explored the rock pools near the shore.', 'He found more and more shells and set them in a pile.', 'Dad helped him put the best ones on a wire.', '"We can make a gift," said Dad, and the boy grinned.', 'He twisted the wire with care, and it looked nice.'],
    words: [
      tricky('The', 'the'), word('next', 'next', ['n','e','x','t']),
      word('day,', 'day', ['d','ay']), tricky('he', 'he'),
      word('explored', 'explored', ['e','x','p','l','ore','d']),
      tricky('the', 'the'), word('rock', 'rock', ['r','o','ck']),
      word('pools', 'pools', ['p','oo','l','s']), word('near', 'near', ['n','ear']),
      tricky('the', 'the'), word('shore.', 'shore', ['sh','ore']),
      tricky('He', 'he'), word('found', 'found', ['f','ou','n','d']),
      word('more', 'more', ['m','ore']), word('and', 'and', ['a','n','d']),
      word('more', 'more', ['m','ore']), word('shells', 'shells', ['sh','e','ll','s']),
      word('and', 'and', ['a','n','d']), word('set', 'set', ['s','e','t']),
      word('them', 'them', ['th','e','m']), word('in', 'in', ['i','n']),
      tricky('a', 'a'), word('pile.', 'pile', ['p','i-e','l']),
      word('Dad', 'dad', ['d','a','d']), word('helped', 'helped', ['h','e','l','p','ed']),
      word('him', 'him', ['h','i','m']), word('put', 'put', ['p','u','t']),
      tricky('the', 'the'), word('best', 'best', ['b','e','s','t']),
      word('ones', 'ones', ['o-e','n','s']), word('on', 'on', ['o','n']),
      tricky('a', 'a'), word('wire.', 'wire', ['w','ire']),
      tricky('We', 'we'), word('can', 'can', ['c','a','n']),
      word('make', 'make', ['m','a-e','k']), tricky('a', 'a'),
      word('gift,', 'gift', ['g','i','f','t']), tricky('said', 'said'),
      word('Dad,', 'dad', ['d','a','d']), word('and', 'and', ['a','n','d']),
      tricky('the', 'the'), word('boy', 'boy', ['b','oy']),
      word('grinned.', 'grinned', ['g','r','i','nn','ed']),
      tricky('He', 'he'), word('twisted', 'twisted', ['t','w','i','s','t','e','d']),
      tricky('the', 'the'), word('wire', 'wire', ['w','ire']),
      word('with', 'with', ['w','i','th']), word('care,', 'care', ['c','are']),
      word('and', 'and', ['a','n','d']), word('it', 'it', ['i','t']),
      word('looked', 'looked', ['l','oo','k','ed']), word('nice.', 'nice', ['n','i-e','s']),
    ],
    imageUrl: '/illustrations/5_1/page4.png', audioUrl: '/sounds/sentences/L5_1_p4.mp3',
  },

  // Page 5
  {
    type: 'story',
    sentences: ['Then it was time to go home from the shore.', 'He spotted a smooth, flat stone by the water line.', '"Keep it safe," said Dad, so you remember this trip.', 'He put the stone in his pocket and smiled.'],
    words: [
      word('Then', 'then', ['th','e','n']), word('it', 'it', ['i','t']),
      tricky('was', 'was'), word('time', 'time', ['t','i-e','m']),
      tricky('to', 'to'), tricky('go', 'go'),
      word('home', 'home', ['h','o-e','m']), word('from', 'from', ['f','r','o','m']),
      tricky('the', 'the'), word('shore.', 'shore', ['sh','ore']),
      tricky('He', 'he'), word('spotted', 'spotted', ['s','p','o','tt','e','d']),
      tricky('a', 'a'), word('smooth,', 'smooth', ['s','m','oo','th']),
      word('flat', 'flat', ['f','l','a','t']), word('stone', 'stone', ['s','t','o-e','n']),
      word('by', 'by', ['b','y']), tricky('the', 'the'),
      tricky('water', 'water'), word('line.', 'line', ['l','i-e','n']),
      word('Keep', 'keep', ['k','ee','p']), word('it', 'it', ['i','t']),
      word('safe,', 'safe', ['s','a-e','f']), tricky('said', 'said'),
      word('Dad,', 'dad', ['d','a','d']), tricky('so', 'so'),
      tricky('you', 'you'), word('remember', 'remember', ['r','e','m','e','m','b','er']),
      word('this', 'this', ['th','i','s']), word('trip.', 'trip', ['t','r','i','p']),
      tricky('He', 'he'), word('put', 'put', ['p','u','t']),
      tricky('the', 'the'), word('stone', 'stone', ['s','t','o-e','n']),
      word('in', 'in', ['i','n']), word('his', 'his', ['h','i','s']),
      word('pocket', 'pocket', ['p','o','ck','e','t']),
      word('and', 'and', ['a','n','d']), word('smiled.', 'smiled', ['s','m','i-e','l','d']),
    ],
    imageUrl: '/illustrations/5_1/page5.png', audioUrl: '/sounds/sentences/L5_1_p5.mp3',
  },

  // Page 6
  {
    type: 'story',
    sentences: ['Back on the bench, the boy sat up and smiled.', 'He still had that shore stone at home on a shelf.', 'But this was a new stone, smooth and cool to hold.', 'He held it up to the light and took a breath.', 'The shore felt so close again, right at his feet.'],
    words: [
      word('Back', 'back', ['b','a','ck']), word('on', 'on', ['o','n']),
      tricky('the', 'the'), word('bench,', 'bench', ['b','e','n','ch']),
      tricky('the', 'the'), word('boy', 'boy', ['b','oy']),
      word('sat', 'sat', ['s','a','t']), word('up', 'up', ['u','p']),
      word('and', 'and', ['a','n','d']), word('smiled.', 'smiled', ['s','m','i-e','l','d']),
      tricky('He', 'he'), word('still', 'still', ['s','t','i','ll']),
      word('had', 'had', ['h','a','d']), word('that', 'that', ['th','a','t']),
      word('shore', 'shore', ['sh','ore']), word('stone', 'stone', ['s','t','o-e','n']),
      word('at', 'at', ['a','t']), word('home', 'home', ['h','o-e','m']),
      word('on', 'on', ['o','n']), tricky('a', 'a'),
      word('shelf.', 'shelf', ['sh','e','l','f']),
      word('But', 'but', ['b','u','t']), word('this', 'this', ['th','i','s']),
      tricky('was', 'was'), tricky('a', 'a'),
      word('new', 'new', ['n','ew']), word('stone,', 'stone', ['s','t','o-e','n']),
      word('smooth', 'smooth', ['s','m','oo','th']), word('and', 'and', ['a','n','d']),
      word('cool', 'cool', ['c','oo','l']), tricky('to', 'to'),
      word('hold.', 'hold', ['h','o','l','d']),
      tricky('He', 'he'), word('held', 'held', ['h','e','l','d']),
      word('it', 'it', ['i','t']), word('up', 'up', ['u','p']),
      tricky('to', 'to'), tricky('the', 'the'),
      word('light', 'light', ['l','igh','t']), word('and', 'and', ['a','n','d']),
      word('took', 'took', ['t','oo','k']), tricky('a', 'a'),
      word('breath.', 'breath', ['b','r','ea','th']),
      tricky('The', 'the'), word('shore', 'shore', ['sh','ore']),
      word('felt', 'felt', ['f','e','l','t']), tricky('so', 'so'),
      word('close', 'close', ['c','l','o-e','s']), tricky('again,', 'again'),
      word('right', 'right', ['r','igh','t']), word('at', 'at', ['a','t']),
      word('his', 'his', ['h','i','s']), word('feet.', 'feet', ['f','ee','t']),
    ],
    imageUrl: '/illustrations/5_1/page6.png', audioUrl: '/sounds/sentences/L5_1_p6.mp3',
  },

  // Page 7
  {
    type: 'story',
    sentences: ['He ran home and in at the front door.', 'He got his shore stone, so now he had two.', 'He knew where Dad kept the wire and thin cord.', 'He made a loop for each stone and tied knots.', 'He wrote Dad on a tag, for a gift later.'],
    words: [
      tricky('He', 'he'), word('ran', 'ran', ['r','a','n']),
      word('home', 'home', ['h','o-e','m']), word('and', 'and', ['a','n','d']),
      word('in', 'in', ['i','n']), word('at', 'at', ['a','t']),
      tricky('the', 'the'), word('front', 'front', ['f','r','o','n','t']),
      word('door.', 'door', ['d','oor']),
      tricky('He', 'he'), word('got', 'got', ['g','o','t']),
      word('his', 'his', ['h','i','s']), word('shore', 'shore', ['sh','ore']),
      word('stone,', 'stone', ['s','t','o-e','n']), tricky('so', 'so'),
      word('now', 'now', ['n','ow']), tricky('he', 'he'),
      word('had', 'had', ['h','a','d']), tricky('two.', 'two'),
      tricky('He', 'he'), tricky('knew', 'knew'),
      tricky('where', 'where'), word('Dad', 'dad', ['d','a','d']),
      word('kept', 'kept', ['k','e','p','t']), tricky('the', 'the'),
      word('wire', 'wire', ['w','ire']), word('and', 'and', ['a','n','d']),
      word('thin', 'thin', ['th','i','n']), word('cord.', 'cord', ['c','or','d']),
      tricky('He', 'he'), word('made', 'made', ['m','a-e','d']),
      tricky('a', 'a'), word('loop', 'loop', ['l','oo','p']),
      word('for', 'for', ['f','or']), word('each', 'each', ['ea','ch']),
      word('stone', 'stone', ['s','t','o-e','n']), word('and', 'and', ['a','n','d']),
      word('tied', 'tied', ['t','ie','d']), word('knots.', 'knots', ['kn','o','t','s']),
      tricky('He', 'he'), word('wrote', 'wrote', ['wr','o-e','t']),
      word('Dad', 'dad', ['d','a','d']), word('on', 'on', ['o','n']),
      tricky('a', 'a'), word('tag,', 'tag', ['t','a','g']),
      word('for', 'for', ['f','or']), tricky('a', 'a'),
      word('gift', 'gift', ['g','i','f','t']), word('later.', 'later', ['l','a-e','t','er']),
    ],
    imageUrl: '/illustrations/5_1/page7.png', audioUrl: '/sounds/sentences/L5_1_p7.mp3',
  },

  // Page 8
  {
    type: 'story',
    sentences: ['He gave the stones to Dad in the sitting room.', '"From the shore and from the park," he said, proud.', 'Dad smiled wide and hooked them on his brown bag.', '"I will keep them with me, so I never forget."', 'Dad wore them that day, hanging bright on his bag.'],
    words: [
      tricky('He', 'he'), word('gave', 'gave', ['g','a-e','v']),
      tricky('the', 'the'), word('stones', 'stones', ['s','t','o-e','n','s']),
      tricky('to', 'to'), word('Dad', 'dad', ['d','a','d']),
      word('in', 'in', ['i','n']), tricky('the', 'the'),
      word('sitting', 'sitting', ['s','i','tt','i','ng']),
      word('room.', 'room', ['r','oo','m']),
      word('From', 'from', ['f','r','o','m']), tricky('the', 'the'),
      word('shore', 'shore', ['sh','ore']), word('and', 'and', ['a','n','d']),
      word('from', 'from', ['f','r','o','m']), tricky('the', 'the'),
      word('park,', 'park', ['p','ar','k']), tricky('he', 'he'),
      tricky('said,', 'said'), word('proud.', 'proud', ['p','r','ou','d']),
      word('Dad', 'dad', ['d','a','d']), word('smiled', 'smiled', ['s','m','i-e','l','d']),
      word('wide', 'wide', ['w','i-e','d']), word('and', 'and', ['a','n','d']),
      word('hooked', 'hooked', ['h','oo','k','ed']),
      word('them', 'them', ['th','e','m']), word('on', 'on', ['o','n']),
      word('his', 'his', ['h','i','s']), word('brown', 'brown', ['b','r','ow','n']),
      word('bag.', 'bag', ['b','a','g']),
      tricky('I', 'I'), word('will', 'will', ['w','i','ll']),
      word('keep', 'keep', ['k','ee','p']), word('them', 'them', ['th','e','m']),
      word('with', 'with', ['w','i','th']), word('me,', 'me', ['m','ee']),
      tricky('so', 'so'), tricky('I', 'I'),
      word('never', 'never', ['n','e','v','er']),
      word('forget.', 'forget', ['f','or','g','e','t']),
      word('Dad', 'dad', ['d','a','d']), word('wore', 'wore', ['w','ore']),
      word('them', 'them', ['th','e','m']), word('that', 'that', ['th','a','t']),
      word('day,', 'day', ['d','ay']), word('hanging', 'hanging', ['h','a','ng','i','ng']),
      word('bright', 'bright', ['b','r','igh','t']), word('on', 'on', ['o','n']),
      word('his', 'his', ['h','i','s']), word('bag.', 'bag', ['b','a','g']),
    ],
    imageUrl: '/illustrations/5_1/page8.png', audioUrl: '/sounds/sentences/L5_1_p8.mp3',
  },

  // ── QUIZ ──
  {
    type: 'quiz',
    questions: [
      { question: 'Where did the boy go with Dad?',
        options: [{ label: 'the shore', isCorrect: true }, { label: 'the shop', isCorrect: false }, { label: 'school', isCorrect: false }] },
      { question: 'What did the boy find on the path?',
        options: [{ label: 'a stone', isCorrect: true }, { label: 'a shell', isCorrect: false }, { label: 'a coin', isCorrect: false }] },
      { question: 'What did he make for Dad?',
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
    tricky('they', 'they'), tricky('through', 'through'), tricky('knew', 'knew'),
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
    { imageUrl: '/illustrations/5_1/page8.png', label: 'He gave it to Dad.', correctIndex: 5 },
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
      word('attention', 'attention', ['a','tt','e','n','tion']),
      word('section', 'section', ['s','e','c','tion']),
      word('direction', 'direction', ['d','i','r','e','c','tion']),
      tricky('concentration', 'concentration'),
      tricky('frustration', 'frustration'),
      word('action', 'action', ['a','c','tion']),
    ],
  },

  // Page 1
  {
    type: 'story',
    sentences: ['Kites of every colour filled the sky over Jaipur.', 'Red and green and blue, they soared and spun and dipped in the clear winter air.', 'The girl stood on the rooftop and watched with wide eyes.', 'She wanted to fly a kite more than anything.', 'But she did not own one.'],
    words: [
      word('Kites', 'kites', ['k','i-e','t','s']), tricky('of', 'of'),
      word('every', 'every', ['e','v','r','ee']),
      word('colour', 'colour', ['c','o','l','er']),
      word('filled', 'filled', ['f','i','ll','ed']),
      tricky('the', 'the'), word('sky', 'sky', ['s','k','y']),
      tricky('over', 'over'), tricky('Jaipur.', 'jaipur'),
      word('Red', 'red', ['r','e','d']), word('and', 'and', ['a','n','d']),
      word('green', 'green', ['g','r','ee','n']), word('and', 'and', ['a','n','d']),
      word('blue,', 'blue', ['b','l','ue']), tricky('they', 'they'),
      word('soared', 'soared', ['s','ore','ed']),
      word('and', 'and', ['a','n','d']), word('spun', 'spun', ['s','p','u','n']),
      word('and', 'and', ['a','n','d']), word('dipped', 'dipped', ['d','i','pp','ed']),
      word('in', 'in', ['i','n']), tricky('the', 'the'),
      word('clear', 'clear', ['c','l','ear']),
      word('winter', 'winter', ['w','i','n','t','er']),
      word('air.', 'air', ['air']),
      tricky('The', 'the'), word('girl', 'girl', ['g','ir','l']),
      word('stood', 'stood', ['s','t','oo','d']), word('on', 'on', ['o','n']),
      tricky('the', 'the'), word('rooftop', 'rooftop', ['r','oo','f','t','o','p']),
      word('and', 'and', ['a','n','d']), word('watched', 'watched', ['w','a','t','ch','ed']),
      word('with', 'with', ['w','i','th']), word('wide', 'wide', ['w','i-e','d']),
      tricky('eyes.', 'eyes'),
      tricky('She', 'she'), word('wanted', 'wanted', ['w','a','n','t','e','d']),
      tricky('to', 'to'), word('fly', 'fly', ['f','l','y']),
      tricky('a', 'a'), word('kite', 'kite', ['k','i-e','t']),
      word('more', 'more', ['m','ore']), word('than', 'than', ['th','a','n']),
      tricky('anything.', 'anything'),
      word('But', 'but', ['b','u','t']), tricky('she', 'she'),
      word('did', 'did', ['d','i','d']), word('not', 'not', ['n','o','t']),
      word('own', 'own', ['ow','n']), tricky('one.', 'one'),
    ],
    imageUrl: '/illustrations/5_3/page1.png', audioUrl: '/sounds/sentences/L5_3_p1.mp3',
  },

  // Page 2
  {
    type: 'story',
    sentences: ['Dadaji sat near the wall, smiling at all the kites.', 'He held up a thin sheet of paper and two bamboo sticks.', '"We can make one," he said.', '"I can show you the instructions.', 'Pay close attention and follow each step."', 'She felt a rush of joy.'],
    words: [
      word('Dadaji', 'dadaji', ['d','a','d','a','j','ee']),
      word('sat', 'sat', ['s','a','t']), word('near', 'near', ['n','ear']),
      tricky('the', 'the'), tricky('wall,', 'wall'),
      word('smiling', 'smiling', ['s','m','i-e','l','i','ng']),
      word('at', 'at', ['a','t']), tricky('all', 'all'),
      tricky('the', 'the'), word('kites.', 'kites', ['k','i-e','t','s']),
      tricky('He', 'he'), word('held', 'held', ['h','e','l','d']),
      word('up', 'up', ['u','p']), tricky('a', 'a'),
      word('thin', 'thin', ['th','i','n']), word('sheet', 'sheet', ['sh','ee','t']),
      tricky('of', 'of'), tricky('paper', 'paper'),
      word('and', 'and', ['a','n','d']), tricky('two', 'two'),
      word('bamboo', 'bamboo', ['b','a','m','b','oo']),
      word('sticks.', 'sticks', ['s','t','i','ck','s']),
      tricky('We', 'we'), word('can', 'can', ['c','a','n']),
      word('make', 'make', ['m','a-e','k']), tricky('one,', 'one'),
      tricky('he', 'he'), tricky('said.', 'said'),
      tricky('I', 'I'), word('can', 'can', ['c','a','n']),
      word('show', 'show', ['sh','ow']), tricky('you', 'you'),
      tricky('the', 'the'), tricky('instructions.', 'instructions'),
      word('Pay', 'pay', ['p','ay']), word('close', 'close', ['c','l','o-e','s']),
      word('attention', 'attention', ['a','tt','e','n','tion']),
      word('and', 'and', ['a','n','d']), word('follow', 'follow', ['f','o','ll','ow']),
      word('each', 'each', ['ea','ch']), word('step.', 'step', ['s','t','e','p']),
      tricky('She', 'she'), word('felt', 'felt', ['f','e','l','t']),
      tricky('a', 'a'), word('rush', 'rush', ['r','u','sh']),
      tricky('of', 'of'), word('joy.', 'joy', ['j','oy']),
    ],
    imageUrl: '/illustrations/5_3/page2.png', audioUrl: '/sounds/sentences/L5_3_p2.mp3',
  },

  // Page 3
  {
    type: 'story',
    sentences: ['"Step one," said Dadaji.', '"Lay the sticks in a cross shape.', 'Tie them at this section here — that is the frame."', 'With great concentration, the girl tied the sticks.', '"Perfect!" said Dadaji.', '"Now pass the string around each point."'],
    words: [
      word('Step', 'step', ['s','t','e','p']), tricky('one,', 'one'),
      tricky('said', 'said'), word('Dadaji.', 'dadaji', ['d','a','d','a','j','ee']),
      word('Lay', 'lay', ['l','ay']), tricky('the', 'the'),
      word('sticks', 'sticks', ['s','t','i','ck','s']), word('in', 'in', ['i','n']),
      tricky('a', 'a'), word('cross', 'cross', ['c','r','o','ss']),
      word('shape.', 'shape', ['sh','a-e','p']),
      word('Tie', 'tie', ['t','ie']), word('them', 'them', ['th','e','m']),
      word('at', 'at', ['a','t']), word('this', 'this', ['th','i','s']),
      word('section', 'section', ['s','e','c','tion']),
      tricky('here', 'here'), word('that', 'that', ['th','a','t']),
      tricky('is', 'is'), tricky('the', 'the'),
      word('frame.', 'frame', ['f','r','a-e','m']),
      word('With', 'with', ['w','i','th']), word('great', 'great', ['g','r','ea','t']),
      tricky('concentration,', 'concentration'),
      tricky('the', 'the'), word('girl', 'girl', ['g','ir','l']),
      word('tied', 'tied', ['t','ie','d']), tricky('the', 'the'),
      word('sticks.', 'sticks', ['s','t','i','ck','s']),
      tricky('Perfect!', 'perfect'),
      tricky('said', 'said'), word('Dadaji.', 'dadaji', ['d','a','d','a','j','ee']),
      word('Now', 'now', ['n','ow']), word('pass', 'pass', ['p','a','ss']),
      tricky('the', 'the'), word('string', 'string', ['s','t','r','i','ng']),
      word('around', 'around', ['a','r','ou','n','d']),
      word('each', 'each', ['ea','ch']), word('point.', 'point', ['p','oi','n','t']),
    ],
    imageUrl: '/illustrations/5_3/page3.png', audioUrl: '/sounds/sentences/L5_3_p3.mp3',
  },

  {
    type: 'story',
    sentences: ['"Step two," said Dadaji.', '"Lay the paper flat on the frame.', 'Fold each section over the string and press it down."', 'The girl worked fast.', 'But the paper slipped.', 'There was a rip — a long split ran right through the kite.', 'Her heart sank.'],
    words: [
      word('Step', 'step', ['s','t','e','p']), tricky('two,', 'two'),
      tricky('said', 'said'), word('Dadaji.', 'dadaji', ['d','a','d','a','j','ee']),
      word('Lay', 'lay', ['l','ay']), tricky('the', 'the'),
      tricky('paper', 'paper'),
      word('flat', 'flat', ['f','l','a','t']), word('on', 'on', ['o','n']),
      tricky('the', 'the'), word('frame.', 'frame', ['f','r','a-e','m']),
      word('Fold', 'fold', ['f','o','l','d']), word('each', 'each', ['ea','ch']),
      word('section', 'section', ['s','e','c','tion']),
      tricky('over', 'over'), tricky('the', 'the'),
      word('string', 'string', ['s','t','r','i','ng']),
      word('and', 'and', ['a','n','d']), word('press', 'press', ['p','r','e','ss']),
      word('it', 'it', ['i','t']), word('down.', 'down', ['d','ow','n']),
      tricky('The', 'the'), word('girl', 'girl', ['g','ir','l']),
      word('worked', 'worked', ['w','er','k','ed']),
      word('fast.', 'fast', ['f','a','s','t']),
      word('But', 'but', ['b','u','t']), tricky('the', 'the'),
      tricky('paper', 'paper'),
      word('slipped.', 'slipped', ['s','l','i','pp','ed']),
      tricky('There', 'there'), tricky('was', 'was'),
      tricky('a', 'a'), word('rip', 'rip', ['r','i','p']),
      tricky('a', 'a'), word('long', 'long', ['l','o','ng']),
      word('split', 'split', ['s','p','l','i','t']),
      word('ran', 'ran', ['r','a','n']), word('right', 'right', ['r','igh','t']),
      tricky('through', 'through'), tricky('the', 'the'),
      word('kite.', 'kite', ['k','i-e','t']),
      word('Her', 'her', ['h','er']), word('heart', 'heart', ['h','ear','t']),
      word('sank.', 'sank', ['s','a','nk']),
    ],
    imageUrl: '/illustrations/5_3/page4.png', audioUrl: '/sounds/sentences/L5_3_p4.mp3',
  },

  {
    type: 'story',
    sentences: ['The girl crumpled the torn paper in her hands.', '"I am full of frustration!" she said.', '"I give up!"', 'Dadaji did not rush.', 'He sat with a calm look on his face and waited.', '"Are you sure you want to stop?" he said softly.', '"We are not done yet."'],
    words: [
      tricky('The', 'the'), word('girl', 'girl', ['g','ir','l']),
      word('crumpled', 'crumpled', ['c','r','u','m','p','l','ed']),
      tricky('the', 'the'), word('torn', 'torn', ['t','ore','n']),
      tricky('paper', 'paper'),
      word('in', 'in', ['i','n']), word('her', 'her', ['h','er']),
      word('hands.', 'hands', ['h','a','n','d','s']),
      tricky('I', 'I'), word('am', 'am', ['a','m']),
      word('full', 'full', ['f','u','ll']), tricky('of', 'of'),
      tricky('frustration!', 'frustration'),
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
      word('his', 'his', ['h','i','s']), word('face', 'face', ['f','a-e','s']),
      word('and', 'and', ['a','n','d']), word('waited.', 'waited', ['w','ai','t','e','d']),
      tricky('Are', 'are'), tricky('you', 'you'),
      tricky('sure', 'sure'), tricky('you', 'you'),
      word('want', 'want', ['w','a','n','t']), tricky('to', 'to'),
      word('stop?', 'stop', ['s','t','o','p']),
      tricky('he', 'he'), tricky('said', 'said'),
      word('softly.', 'softly', ['s','o','f','t','l','ee']),
      tricky('We', 'we'), tricky('are', 'are'),
      word('not', 'not', ['n','o','t']), word('done', 'done', ['d','u','n']),
      word('yet.', 'yet', ['y','e','t']),
    ],
    imageUrl: '/illustrations/5_3/page5.png', audioUrl: '/sounds/sentences/L5_3_p5.mp3',
  },

  {
    type: 'story',
    sentences: ['The girl took a long breath and tried again.', '"Slow action this time," said Dadaji.', '"Press each section flat before you move on.', 'Work in one direction only."', 'She worked with great care.', 'She pressed. She smoothed. She waited.', 'The paper held.', '"It is working!" she cried.'],
    words: [
      tricky('The', 'the'), word('girl', 'girl', ['g','ir','l']),
      word('took', 'took', ['t','oo','k']), tricky('a', 'a'),
      word('long', 'long', ['l','o','ng']), word('breath', 'breath', ['b','r','e','th']),
      word('and', 'and', ['a','n','d']), word('tried', 'tried', ['t','r','ie','d']),
      word('again.', 'again', ['a','g','ai','n']),
      word('Slow', 'slow', ['s','l','ow']),
      word('action', 'action', ['a','c','tion']),
      word('this', 'this', ['th','i','s']), word('time,', 'time', ['t','i-e','m']),
      tricky('said', 'said'), word('Dadaji.', 'dadaji', ['d','a','d','a','j','ee']),
      word('Press', 'press', ['p','r','e','ss']), word('each', 'each', ['ea','ch']),
      word('section', 'section', ['s','e','c','tion']),
      word('flat', 'flat', ['f','l','a','t']),
      word('before', 'before', ['b','e','f','ore']),
      tricky('you', 'you'), word('move', 'move', ['m','oo','v']),
      word('on.', 'on', ['o','n']),
      word('Work', 'work', ['w','er','k']), word('in', 'in', ['i','n']),
      tricky('one', 'one'),
      word('direction', 'direction', ['d','i','r','e','c','tion']),
      word('only.', 'only', ['o','n','l','ee']),
      tricky('She', 'she'), word('worked', 'worked', ['w','er','k','ed']),
      word('with', 'with', ['w','i','th']), word('great', 'great', ['g','r','ea','t']),
      word('care.', 'care', ['c','are']),
      tricky('She', 'she'), word('pressed.', 'pressed', ['p','r','e','ss','ed']),
      tricky('She', 'she'), word('smoothed.', 'smoothed', ['s','m','oo','th','ed']),
      tricky('She', 'she'), word('waited.', 'waited', ['w','ai','t','e','d']),
      tricky('The', 'the'), tricky('paper', 'paper'),
      word('held.', 'held', ['h','e','l','d']),
      word('It', 'it', ['i','t']), tricky('is', 'is'),
      word('working!', 'working', ['w','er','k','i','ng']),
      tricky('she', 'she'), word('cried.', 'cried', ['c','r','ie','d']),
    ],
    imageUrl: '/illustrations/5_3/page6.png', audioUrl: '/sounds/sentences/L5_3_p6.mp3',
  },

  {
    type: 'story',
    sentences: ['At last, the kite was done.', '"Look at the picture we made!" she cried.', 'Dadaji tied the string to the centre.', '"Now for the action!" he said.', '"Run in that direction and let the wind catch it!"', 'She ran with all her might and let the string out.'],
    words: [
      word('At', 'at', ['a','t']), word('last,', 'last', ['l','a','s','t']),
      tricky('the', 'the'), word('kite', 'kite', ['k','i-e','t']),
      tricky('was', 'was'), word('done.', 'done', ['d','u','n']),
      word('Look', 'look', ['l','oo','k']), word('at', 'at', ['a','t']),
      tricky('the', 'the'), word('picture', 'picture', ['p','i','c','t','ure']),
      tricky('we', 'we'), word('made!', 'made', ['m','a-e','d']),
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
      word('with', 'with', ['w','i','th']), tricky('all', 'all'),
      word('her', 'her', ['h','er']), word('might', 'might', ['m','igh','t']),
      word('and', 'and', ['a','n','d']), word('let', 'let', ['l','e','t']),
      tricky('the', 'the'), word('string', 'string', ['s','t','r','i','ng']),
      word('out.', 'out', ['ou','t']),
    ],
    imageUrl: '/illustrations/5_3/page7.png', audioUrl: '/sounds/sentences/L5_3_p7.mp3',
  },

  {
    type: 'story',
    sentences: ['The kite shot up into the pure blue sky.', 'It soared higher and higher!', '"Woh Kata!" cheered the people on the next rooftop.', 'Dadaji clapped his hands with joy.', 'The girl watched her kite spin and dance over the pink city.', '"Pure joy!" she cried. "Pure joy!"'],
    words: [
      tricky('The', 'the'), word('kite', 'kite', ['k','i-e','t']),
      word('shot', 'shot', ['sh','o','t']), word('up', 'up', ['u','p']),
      tricky('into', 'into'),
      tricky('the', 'the'), word('pure', 'pure', ['p','ure']),
      word('blue', 'blue', ['b','l','ue']), word('sky.', 'sky', ['s','k','y']),
      word('It', 'it', ['i','t']), word('soared', 'soared', ['s','ore','ed']),
      word('higher', 'higher', ['h','igh','er']),
      word('and', 'and', ['a','n','d']), word('higher!', 'higher', ['h','igh','er']),
      word('Woh', 'woh', ['w','o','h']), word('Kata!', 'kata', ['k','a','t','a']),
      word('cheered', 'cheered', ['ch','ear','ed']),
      tricky('the', 'the'), tricky('people', 'people'),
      word('on', 'on', ['o','n']), tricky('the', 'the'),
      word('next', 'next', ['n','e','x','t']),
      word('rooftop.', 'rooftop', ['r','oo','f','t','o','p']),
      word('Dadaji', 'dadaji', ['d','a','d','a','j','ee']),
      word('clapped', 'clapped', ['c','l','a','pp','ed']),
      word('his', 'his', ['h','i','s']), word('hands', 'hands', ['h','a','n','d','s']),
      word('with', 'with', ['w','i','th']), word('joy.', 'joy', ['j','oy']),
      tricky('The', 'the'), word('girl', 'girl', ['g','ir','l']),
      word('watched', 'watched', ['w','a','t','ch','ed']),
      word('her', 'her', ['h','er']), word('kite', 'kite', ['k','i-e','t']),
      word('spin', 'spin', ['s','p','i','n']), word('and', 'and', ['a','n','d']),
      word('dance', 'dance', ['d','a','n','s']),
      tricky('over', 'over'), tricky('the', 'the'),
      word('pink', 'pink', ['p','i','nk']),
      word('city.', 'city', ['s','i','t','ee']),
      word('Pure', 'pure', ['p','ure']), word('joy!', 'joy', ['j','oy']),
      tricky('she', 'she'), word('cried.', 'cried', ['c','r','ie','d']),
      word('Pure', 'pure', ['p','ure']), word('joy!', 'joy', ['j','oy']),
    ],
    imageUrl: '/illustrations/5_3/page8.png', audioUrl: '/sounds/sentences/L5_3_p8.mp3',
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

  { type: 'sound_spotlight', sound: 'ure',
    explanation: "The letters 'ure' make two different sounds. Tap each one to hear!",
    variants: [
      { audioKey: 'ure_yoor', label: "sounds 'yoor'", example: 'pure' },
      { audioKey: 'ure_ur',   label: "sounds 'ur'",   example: 'nature' },
    ],
    items: [
      // /jʊər/ — 'yoor' words: the 'y'-glide before 'ure' is triggered by
      // certain preceding consonants (p, c/k, m, s+e, etc). 'lure' /lʊər/
      // doesn't qualify — no /j/ glide after 'l' — so it lives elsewhere.
      // 'sure' is also excluded: its 's' is irregular (/ʃ/) and it lives
      // in the vocab tricky list.
      { word: 'pure',   imageUrl: '/images/words/pure.png',   focusIndex: 1, morphSplit: 1, variant: 'ure_yoor' },
      { word: 'cure',   imageUrl: '/images/words/cure.png',   focusIndex: 1, morphSplit: 1, variant: 'ure_yoor' },
      { word: 'secure', imageUrl: '/images/words/secure.png', focusIndex: 3, morphSplit: 3, variant: 'ure_yoor' },
      // /ər/ — 'ur' words: sound like nat-ure, pict-ure, fut-ure
      { word: 'nature',  imageUrl: '/images/words/nature.png',  focusIndex: 3, morphSplit: 3, variant: 'ure_ur' },
      { word: 'picture', imageUrl: '/images/words/picture.png', focusIndex: 4, morphSplit: 4, variant: 'ure_ur' },
      { word: 'future',  imageUrl: '/images/words/future.png',  focusIndex: 3, morphSplit: 3, variant: 'ure_ur' },
    ],
  },
  { type: 'sound_spotlight', sound: 'tion', items: [
    { word: 'action', imageUrl: '/images/words/action.png', focusIndex: 2 },
    { word: 'section', imageUrl: '/images/words/section.png', focusIndex: 3 },
    { word: 'station', imageUrl: '/images/words/station.png', focusIndex: 3 },
    { word: 'direction', imageUrl: '/images/words/direction.png', focusIndex: 5 },
  ] },

  { type: 'word_reading', words: [
    tricky('sure', 'sure'), word('pure', 'pure', ['p','ure']),
    word('action', 'action', ['a','c','tion']), word('section', 'section', ['s','e','c','tion']),
    word('direction', 'direction', ['d','i','r','e','c','tion']),
    tricky('frustration', 'frustration'),
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
    { word: 'sure', imageUrl: '/images/words/sure.png', letters: ['sh','ure'] },
    { word: 'pure', imageUrl: '/images/words/pure.png', letters: ['p','ure'] },
    { word: 'action', imageUrl: '/images/words/action.png', letters: ['a','c','tion'] },
    { word: 'section', imageUrl: '/images/words/section.png', letters: ['s','e','c','tion'] },
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
