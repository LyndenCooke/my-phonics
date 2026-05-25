/**
 * Sound Books — 73 books, one per GPC, real-photo format.
 *
 * Distinct from Storybooks (illustrated narratives) and Blending Books
 * (illustrated blending practice). Each Sound Book introduces ONE new
 * grapheme with real photographs paired with image-able words.
 *
 * Mirrored from myphonics_books/data/sound_books/inventory.py — see that
 * file for the full word lists per book. This TS port keeps only what
 * the school preview needs to display (titles, focus graphemes, sample
 * words, comparison sounds).
 */

export interface SoundBook {
  level: number;
  bookNumber: number;     // ordinal within the level
  title: string;          // e.g. "Sound Book: sh"
  graphemes: string[];    // one or more (some books combine pairs e.g. ff+ll)
  sampleWords: string[];  // up to 3-4 example words
  comparisonSounds: string[]; // alternative spellings shown for L5+
}

const b = (
  level: number,
  bookNumber: number,
  title: string,
  graphemes: string[],
  sampleWords: string[],
  comparisonSounds: string[] = [],
): SoundBook => ({ level, bookNumber, title, graphemes, sampleWords, comparisonSounds });

export const SOUND_BOOKS: SoundBook[] = [
  // L1 — Ditties (10)
  b(1, 1,  'Sound Book: s', ['s'], ['sun', 'snake', 'sock', 'sandwich']),
  b(1, 2,  'Sound Book: a', ['a'], ['apple', 'ant', 'astronaut', 'alligator']),
  b(1, 3,  'Sound Book: t', ['t'], ['tiger', 'train', 'tree', 'turtle']),
  b(1, 4,  'Sound Book: p', ['p'], ['penguin', 'piano', 'pumpkin', 'parrot']),
  b(1, 5,  'Sound Book: i', ['i'], ['ice cream', 'igloo', 'insect', 'island']),
  b(1, 6,  'Sound Book: n', ['n'], ['nest', 'nose', 'net', 'nurse']),
  b(1, 7,  'Sound Book: m', ['m'], ['monkey', 'moon', 'mushroom', 'mountain']),
  b(1, 8,  'Sound Book: d', ['d'], ['dog', 'dinosaur', 'drum', 'duck']),
  b(1, 9,  'Sound Book: g', ['g'], ['giraffe', 'guitar', 'goat', 'grape']),
  b(1, 10, 'Sound Book: o', ['o'], ['octopus', 'orange', 'ostrich', 'oven']),

  // L2 — First Sounds (15)
  b(2, 1,  'Sound Book: c',         ['c'],            ['cat', 'carrot', 'camel', 'castle']),
  b(2, 2,  'Sound Book: k',         ['k'],            ['kite', 'kangaroo', 'key', 'koala']),
  b(2, 3,  'Sound Book: ck',        ['ck'],           ['duck', 'lock', 'rock', 'clock']),
  b(2, 4,  'Sound Book: e',         ['e'],            ['elephant', 'egg', 'engine', 'envelope']),
  b(2, 5,  'Sound Book: u',         ['u'],            ['umbrella', 'unicorn', 'urn', 'uniform']),
  b(2, 6,  'Sound Book: r',         ['r'],            ['rabbit', 'rainbow', 'robot', 'rocket']),
  b(2, 7,  'Sound Book: h',         ['h'],            ['hat', 'horse', 'helicopter', 'house']),
  b(2, 8,  'Sound Book: b',         ['b'],            ['ball', 'butterfly', 'banana', 'boat']),
  b(2, 9,  'Sound Book: f',         ['f'],            ['fish', 'frog', 'flower', 'fire']),
  b(2, 10, 'Sound Book: l',         ['l'],            ['lion', 'lamp', 'lemon', 'ladder']),
  b(2, 11, 'Sound Book: ff + ll',   ['ff', 'll'],     ['cliff', 'puff', 'bell', 'shell']),
  b(2, 12, 'Sound Book: ss + zz',   ['ss', 'zz'],     ['glass', 'dress', 'buzz', 'fizz']),
  b(2, 13, 'Sound Book: j',         ['j'],            ['jelly', 'jacket', 'jungle', 'jigsaw']),
  b(2, 14, 'Sound Book: v + w',     ['v', 'w'],       ['violin', 'vase', 'whale', 'wheel']),
  b(2, 15, 'Sound Book: x + y + z', ['x', 'y', 'z'],  ['xylophone', 'box', 'yacht', 'zebra']),

  // L3 — Special Friends (6)
  b(3, 1, 'Sound Book: sh', ['sh'], ['shark', 'sheep', 'shell', 'shoe']),
  b(3, 2, 'Sound Book: nk', ['nk'], ['tank', 'bank', 'sink', 'pink']),
  b(3, 3, 'Sound Book: ch', ['ch'], ['chicken', 'chair', 'cheese', 'chimpanzee']),
  b(3, 4, 'Sound Book: th', ['th'], ['thumb', 'thunder', 'throne', 'tooth']),
  b(3, 5, 'Sound Book: ng', ['ng'], ['king', 'ring', 'wing', 'song']),
  b(3, 6, 'Sound Book: qu', ['qu'], ['queen', 'quilt', 'quail', 'quarter']),

  // L4 — Longer Sounds (12)
  b(4, 1,  'Sound Book: ay',          ['ay'],  ['play', 'tray', 'clay', 'ray']),
  b(4, 2,  'Sound Book: ee',          ['ee'],  ['tree', 'bee', 'sheep', 'wheel']),
  b(4, 3,  'Sound Book: igh',         ['igh'], ['light', 'night', 'sight', 'fright']),
  b(4, 4,  'Sound Book: ow',          ['ow'],  ['snow', 'bow', 'crow', 'window']),
  b(4, 5,  'Sound Book: oo (long)',   ['oo'],  ['moon', 'spoon', 'balloon', 'bamboo']),
  b(4, 6,  'Sound Book: oo (short)',  ['oo'],  ['book', 'foot', 'wood', 'wool']),
  b(4, 7,  'Sound Book: ar',          ['ar'],  ['car', 'star', 'jar', 'guitar']),
  b(4, 8,  'Sound Book: or',          ['or'],  ['fork', 'corn', 'storm', 'horse']),
  b(4, 9,  'Sound Book: air',         ['air'], ['chair', 'fair', 'hair', 'pair']),
  b(4, 10, 'Sound Book: ir',          ['ir'],  ['bird', 'shirt', 'skirt', 'dirt']),
  b(4, 11, 'Sound Book: ou',          ['ou'],  ['house', 'mouse', 'cloud', 'shout']),
  b(4, 12, 'Sound Book: oy',          ['oy'],  ['toy', 'boy', 'enjoy', 'employ']),

  // L5 — New Spellings (10) — comparison sounds appear here for the first time
  b(5, 1,  'Sound Book: a-e', ['a-e'], ['cake', 'snake', 'plane', 'grape'],   ['ay', 'ai']),
  b(5, 2,  'Sound Book: i-e', ['i-e'], ['kite', 'bike', 'slide', 'smile'],    ['igh', 'ie']),
  b(5, 3,  'Sound Book: o-e', ['o-e'], ['bone', 'stone', 'home', 'rope'],     ['ow', 'oa']),
  b(5, 4,  'Sound Book: u-e', ['u-e'], ['cube', 'flute', 'tube', 'mule'],     ['oo', 'ue', 'ew']),
  b(5, 5,  'Sound Book: ea',  ['ea'],  ['leaf', 'beach', 'peach', 'seal'],    ['ee']),
  b(5, 6,  'Sound Book: ie',  ['ie'],  ['pie', 'tie', 'field', 'chief'],      ['igh', 'i-e']),
  b(5, 7,  'Sound Book: oi',  ['oi'],  ['coin', 'boil', 'soil', 'point'],     ['oy']),
  b(5, 8,  'Sound Book: aw',  ['aw'],  ['saw', 'claw', 'straw', 'paw'],       ['or']),
  b(5, 9,  'Sound Book: ai',  ['ai'],  ['rain', 'train', 'paint', 'snail'],   ['ay', 'a-e']),
  b(5, 10, 'Sound Book: oa',  ['oa'],  ['boat', 'goat', 'coat', 'road'],      ['ow', 'o-e']),

  // L6 — Building Fluency (9)
  b(6, 1, 'Sound Book: ur',       ['ur'],       ['fur', 'nurse', 'purse', 'burn'],          ['ir', 'er']),
  b(6, 2, 'Sound Book: er',       ['er'],       ['flower', 'butter', 'river', 'hammer'],    ['ir', 'ur']),
  b(6, 3, 'Sound Book: are',      ['are'],      ['care', 'hare', 'scare', 'share'],         ['air']),
  b(6, 4, 'Sound Book: ow',       ['ow'],       ['cow', 'owl', 'towel', 'frown'],           ['ou']),
  b(6, 5, 'Sound Book: ew + ue',  ['ew', 'ue'], ['stew', 'chew', 'blue', 'glue'],           ['oo', 'u-e']),
  b(6, 6, 'Sound Book: wr + kn',  ['wr', 'kn'], ['wrist', 'write', 'knee', 'knife'],        ['r', 'n']),
  b(6, 7, 'Sound Book: ge + dge', ['ge', 'dge'],['cage', 'stage', 'bridge', 'hedge'],       ['j']),
  b(6, 8, 'Sound Book: mb + gn',  ['mb', 'gn'], ['thumb', 'lamb', 'gnome', 'sign'],         ['m', 'n']),
  b(6, 9, 'Sound Book: ph + wh',  ['ph', 'wh'], ['phone', 'photo', 'whale', 'wheel'],       ['f', 'w']),

  // L7 — Reading Together (6)
  b(7, 1, 'Sound Book: ire',  ['ire'],  ['fire', 'tire', 'wire', 'hire'],          ['i-e', 'igh']),
  b(7, 2, 'Sound Book: ore',  ['ore'],  ['shore', 'store', 'bore', 'core'],        ['or', 'aw', 'oor']),
  b(7, 3, 'Sound Book: ear',  ['ear'],  ['gear', 'hear', 'near', 'year'],          ['ee', 'ea']),
  b(7, 4, 'Sound Book: oor',  ['oor'],  ['door', 'floor', 'poor', 'moor'],         ['or', 'ore']),
  b(7, 5, 'Sound Book: ure',  ['ure'],  ['picture', 'nature', 'future', 'cure'],   ['oo']),
  b(7, 6, 'Sound Book: tion', ['tion'], ['station', 'action', 'caution', 'nation']),

  // L8 — Reading Champion (5)
  b(8, 1, 'Sound Book: -ous',   ['-ous'],   ['famous', 'dangerous', 'curious', 'nervous']),
  b(8, 2, 'Sound Book: -cious', ['-cious'], ['precious', 'vicious', 'delicious', 'conscious']),
  b(8, 3, 'Sound Book: -tious', ['-tious'], ['ambitious', 'cautious', 'nutritious', 'infectious']),
  b(8, 4, 'Sound Book: -able',  ['-able'],  ['comfortable', 'reliable', 'enjoyable', 'valuable']),
  b(8, 5, 'Sound Book: -ible',  ['-ible'],  ['visible', 'edible', 'flexible', 'incredible']),
];

export function getSoundBooksByLevel(level: number): SoundBook[] {
  return SOUND_BOOKS.filter((s) => s.level === level);
}

export const SOUND_BOOK_TOTAL = SOUND_BOOKS.length; // 73
