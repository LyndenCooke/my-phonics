/**
 * Interactive book page data for Level 4 books
 * L4 focus sounds: ur/er, are/ow, ew/ue, review of all L4
 */

import type { InteractivePage, StoryWord } from './interactiveBookData';

// ─��� Helpers ���─

function word(display: string, w: string, phonemes: string[]): StoryWord {
  return { display, word: w, phonemes };
}
function tricky(display: string, w: string): StoryWord {
  return { display, word: w, phonemes: [], isTricky: true };
}

// L4 cumulative sounds (all sounds from L1���L4)
const L4_ALL_SOUNDS = [
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
];

// ══════════════════════════���════════════════════════���═══════════════════════
// L4.1 — "The Purple Purse"
// Focus sounds: ur, er
// Setting: European market town — lost and found story
// ════════════════════════���══════════════════════════════════════════════════

export const BOOK_L4_1_PAGES: InteractivePage[] = [
  // ── COVER ──
  { type: 'cover', title: 'The Purple Purse', subtitle: 'Level 4 · Building Fluency', imageUrl: '/illustrations/4_1/cover.png' },

  // ── SOUNDS ──
  {
    type: 'sound_grid',
    focusSounds: ['ur', 'er'],
    allSounds: L4_ALL_SOUNDS,
  },

  // ── VOCAB PREVIEW ──
  {
    type: 'vocab_preview',
    words: [
      word('purple', 'purple', ['p','ur','p','l']),
      word('purse', 'purse', ['p','ur','s']),
      word('turned', 'turned', ['t','ur','n','d']),
      word('further', 'further', ['f','ur','th','er']),
      word('ferns', 'ferns', ['f','er','n','s']),
      word('kerb', 'kerb', ['k','er','b']),
      word('burst', 'burst', ['b','ur','s','t']),
      word('church', 'church', ['ch','ur','ch']),
      word('baker', 'baker', ['b','ai','k','er']),
      word('currant', 'currant', ['c','ur','r','a','n','t']),
    ],
  },

  // ��─ STORY PAGES ──
  // Page 1
  {
    type: 'story',
    sentences: ['My purple purse was gone!', 'I turned my pockets inside out, but it was not there.', 'I was so upset!'],
    words: [
      tricky('My', 'my'), word('purple', 'purple', ['p','ur','p','l']),
      word('purse', 'purse', ['p','ur','s']), tricky('was', 'was'),
      word('gone!', 'gone', ['g','o','n']),
      tricky('I', 'I'), word('turned', 'turned', ['t','ur','n','d']),
      tricky('my', 'my'), word('pockets', 'pockets', ['p','o','ck','e','t','s']),
      word('inside', 'inside', ['i','n','s','i_e','d']), word('out,', 'out', ['ou','t']),
      word('but', 'but', ['b','u','t']), word('it', 'it', ['i','t']),
      tricky('was', 'was'), word('not', 'not', ['n','o','t']),
      word('there.', 'there', ['th','ere']),
      tricky('I', 'I'), tricky('was', 'was'), tricky('so', 'so'),
      word('upset!', 'upset', ['u','p','s','e','t']),
    ],
    imageUrl: '/illustrations/4_1/page1.png',
  },

  // Page 2
  {
    type: 'story',
    sentences: ['Dad came with me to search.', 'We walked up and down the street.', "'It must be here,' said Dad."],
    words: [
      word('Dad', 'dad', ['d','a','d']), word('came', 'came', ['c','ai','m']),
      word('with', 'with', ['w','i','th']), tricky('me', 'me'),
      tricky('to', 'to'), word('search.', 'search', ['s','ear','ch']),
      tricky('We', 'we'), word('walked', 'walked', ['w','a','lk','d']),
      word('up', 'up', ['u','p']), word('and', 'and', ['a','n','d']),
      word('down', 'down', ['d','ow','n']), tricky('the', 'the'),
      word('street.', 'street', ['s','t','r','ee','t']),
      word("'It", 'it', ['i','t']), word('must', 'must', ['m','u','s','t']),
      tricky('be', 'be'), word("here,'", 'here', ['h','ere']),
      tricky('said', 'said'), word('Dad.', 'dad', ['d','a','d']),
    ],
    imageUrl: '/illustrations/4_1/page2.png',
  },

  // Page 3
  {
    type: 'story',
    sentences: ['I looked under the bench in the park.', 'I searched in the ferns.', 'Not there!'],
    words: [
      tricky('I', 'I'), word('looked', 'looked', ['l','oo','k','d']),
      word('under', 'under', ['u','n','d','er']), tricky('the', 'the'),
      word('bench', 'bench', ['b','e','n','ch']), word('in', 'in', ['i','n']),
      tricky('the', 'the'), word('park.', 'park', ['p','ar','k']),
      tricky('I', 'I'), word('searched', 'searched', ['s','ear','ch','d']),
      word('in', 'in', ['i','n']), tricky('the', 'the'),
      word('ferns.', 'ferns', ['f','er','n','s']),
      word('Not', 'not', ['n','o','t']), word('there!', 'there', ['th','ere']),
    ],
    imageUrl: '/illustrations/4_1/page3.png',
  },

  // Page 4
  {
    type: 'story',
    sentences: ["'A currant bun?' said the baker.", 'But I had no coins to pay!', 'I turned away, sad.'],
    words: [
      word("'A", 'a', ['a']), word('currant', 'currant', ['c','ur','r','a','n','t']),
      word("bun?'", 'bun', ['b','u','n']), tricky('said', 'said'),
      tricky('the', 'the'), word('baker.', 'baker', ['b','ai','k','er']),
      word('But', 'but', ['b','u','t']), tricky('I', 'I'),
      word('had', 'had', ['h','a','d']), tricky('no', 'no'),
      word('coins', 'coins', ['c','oi','n','s']), tricky('to', 'to'),
      word('pay!', 'pay', ['p','ai']),
      tricky('I', 'I'), word('turned', 'turned', ['t','ur','n','d']),
      word('away,', 'away', ['a','w','ai']), word('sad.', 'sad', ['s','a','d']),
    ],
    imageUrl: '/illustrations/4_1/page4.png',
  },

  // Page 5
  {
    type: 'story',
    sentences: ['Further on, we passed a church.', 'Past more stalls and tall garden walls.', 'I started to give up.'],
    words: [
      word('Further', 'further', ['f','ur','th','er']), word('on,', 'on', ['o','n']),
      tricky('we', 'we'), word('passed', 'passed', ['p','a','ss','d']),
      tricky('a', 'a'), word('church.', 'church', ['ch','ur','ch']),
      word('Past', 'past', ['p','a','s','t']), word('more', 'more', ['m','ore']),
      word('stalls', 'stalls', ['s','t','a','ll','s']), word('and', 'and', ['a','n','d']),
      word('tall', 'tall', ['t','a','ll']), word('garden', 'garden', ['g','ar','d','e','n']),
      word('walls.', 'walls', ['w','a','ll','s']),
      tricky('I', 'I'), word('started', 'started', ['s','t','ar','t','e','d']),
      tricky('to', 'to'), word('give', 'give', ['g','i_e','v']),
      word('up.', 'up', ['u','p']),
    ],
    imageUrl: '/illustrations/4_1/page5.png',
  },

  // Page 6
  {
    type: 'story',
    sentences: ['Then a market lady held up a purple purse!', "'I found this on the kerb. Is it yours?'"],
    words: [
      word('Then', 'then', ['th','e','n']), tricky('a', 'a'),
      word('market', 'market', ['m','ar','k','e','t']), word('lady', 'lady', ['l','ai','d','ee']),
      word('held', 'held', ['h','e','l','d']), word('up', 'up', ['u','p']),
      tricky('a', 'a'), word('purple', 'purple', ['p','ur','p','l']),
      word('purse!', 'purse', ['p','ur','s']),
      word("'I", 'I', ['I']), word('found', 'found', ['f','ou','n','d']),
      tricky('this', 'this'), word('on', 'on', ['o','n']),
      tricky('the', 'the'), word('kerb.', 'kerb', ['k','er','b']),
      tricky('Is', 'is'), word('it', 'it', ['i','t']),
      word("yours?'", 'yours', ['y','or','s']),
    ],
    imageUrl: '/illustrations/4_1/page6.png',
  },

  // Page 7
  {
    type: 'story',
    sentences: ['I turned the purse over.', 'My coins were still in it!', "'Thank you!' I burst out, smiling."],
    words: [
      tricky('I', 'I'), word('turned', 'turned', ['t','ur','n','d']),
      tricky('the', 'the'), word('purse', 'purse', ['p','ur','s']),
      word('over.', 'over', ['o_e','v','er']),
      tricky('My', 'my'), word('coins', 'coins', ['c','oi','n','s']),
      tricky('were', 'were'), word('still', 'still', ['s','t','i','ll']),
      word('in', 'in', ['i','n']), word('it!', 'it', ['i','t']),
      word("'Thank", 'thank', ['th','a','nk']),
      word("you!'", 'you', ['y','oo']),
      tricky('I', 'I'), word('burst', 'burst', ['b','ur','s','t']),
      word('out,', 'out', ['ou','t']), word('smiling.', 'smiling', ['s','m','igh','l','i','ng']),
    ],
    imageUrl: '/illustrations/4_1/page7.png',
  },

  // Page 8
  {
    type: 'story',
    sentences: ['Dad and I walked home in the warm afternoon.', 'I held the purse close to my chest.', "'She was so kind,' I said."],
    words: [
      word('Dad', 'dad', ['d','a','d']), word('and', 'and', ['a','n','d']),
      tricky('I', 'I'), word('walked', 'walked', ['w','a','lk','d']),
      word('home', 'home', ['h','o_e','m']), word('in', 'in', ['i','n']),
      tricky('the', 'the'), word('warm', 'warm', ['w','ar','m']),
      word('afternoon.', 'afternoon', ['a','f','t','er','n','oo','n']),
      tricky('I', 'I'), word('held', 'held', ['h','e','l','d']),
      tricky('the', 'the'), word('purse', 'purse', ['p','ur','s']),
      word('close', 'close', ['c','l','o_e','s']), tricky('to', 'to'),
      tricky('my', 'my'), word('chest.', 'chest', ['ch','e','s','t']),
      word("'She", 'she', ['sh','ee']), tricky('was', 'was'),
      tricky('so', 'so'), word("kind,'", 'kind', ['k','igh','n','d']),
      tricky('I', 'I'), tricky('said.', 'said'),
    ],
    imageUrl: '/illustrations/4_1/page8.png',
  },

  // ── QUIZ ──
  {
    type: 'quiz',
    questions: [
      { question: 'What did the child lose?',
        options: [{ label: 'Her purple purse', isCorrect: true }, { label: 'Her coins', isCorrect: false }, { label: 'Her bag', isCorrect: false }] },
      { question: 'Who found the purse?',
        options: [{ label: 'A market lady', isCorrect: true }, { label: 'Dad', isCorrect: false }, { label: 'The baker', isCorrect: false }] },
      { question: 'Where did the child search first?',
        options: [{ label: 'Under a bench in the park', isCorrect: true }, { label: 'At the church', isCorrect: false }, { label: 'In a shop', isCorrect: false }] },
    ],
  },

  // ── WORD READING ──
  { type: 'word_reading', words: [
    word('nurse', 'nurse', ['n','ur','s']),
    word('church', 'church', ['ch','ur','ch']),
    word('curve', 'curve', ['c','ur','v']),
    word('burst', 'burst', ['b','ur','s','t']),
    word('perch', 'perch', ['p','er','ch']),
    word('herd', 'herd', ['h','er','d']),
  ] },

  // ── TRICKY WORDS ��─
  { type: 'tricky_words', words: [
    tricky('the', 'the'), tricky('to', 'to'), tricky('I', 'I'),
    tricky('said', 'said'), tricky('was', 'was'), tricky('all', 'all'),
    tricky('like', 'like'), tricky('her', 'her'), tricky('my', 'my'),
    tricky('are', 'are'), tricky('she', 'she'), tricky('no', 'no'),
    tricky('so', 'so'), tricky('what', 'what'),
  ] },

  // ── NONSENSE WORDS ──
  { type: 'nonsense_words', words: [
    word('durse', 'durse', ['d','ur','s']),
    word('burve', 'burve', ['b','ur','v']),
    word('turk', 'turk', ['t','ur','k']),
    word('flurn', 'flurn', ['f','l','ur','n']),
    word('snurp', 'snurp', ['s','n','ur','p']),
    word('churm', 'churm', ['ch','ur','m']),
    word('ferb', 'ferb', ['f','er','b']),
    word('blerp', 'blerp', ['b','l','er','p']),
    word('glerch', 'glerch', ['g','l','er','ch']),
    word('dert', 'dert', ['d','er','t']),
    word('swerb', 'swerb', ['s','w','er','b']),
    word('plert', 'plert', ['p','l','er','t']),
  ] },

  // ── SPELLING ──
  { type: 'spelling', words: [
    { word: 'purple', imageUrl: '/images/words/purple.png', letters: ['p','ur','p','l','e'] },
    { word: 'purse', imageUrl: '/images/words/purse.png', letters: ['p','ur','s','e'] },
    { word: 'nurse', imageUrl: '/images/words/nurse.png', letters: ['n','ur','s','e'] },
    { word: 'church', imageUrl: '/images/words/church.png', letters: ['ch','ur','ch'] },
  ] },

  // ── WRITING PRACTICE ──
  { type: 'writing_practice', letters: ['ur', 'er'] },

  // ── STORY ORDERING ──
  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/4_1/page1.png', label: 'My purple purse was gone!', correctIndex: 0 },
    { imageUrl: '/illustrations/4_1/page2.png', label: 'Dad came to search.', correctIndex: 1 },
    { imageUrl: '/illustrations/4_1/page3.png', label: 'Looking under the bench.', correctIndex: 2 },
    { imageUrl: '/illustrations/4_1/page4.png', label: 'No coins to pay!', correctIndex: 3 },
    { imageUrl: '/illustrations/4_1/page6.png', label: 'A market lady found it!', correctIndex: 4 },
    { imageUrl: '/illustrations/4_1/page8.png', label: 'Walking home together.', correctIndex: 5 },
  ] },

  // ── DRAWING ──
  { type: 'drawing', prompt: 'Draw Your Favourite Part' },

  // ── CERTIFICATE ──
  { type: 'certificate', bookTitle: 'The Purple Purse' },
];


// ═════════════════════════════════════���═════════════════════════════════════
// L4.2 — "The Brown Owl"
// Focus sounds: are, ow (as in cow)
// Setting: British woodland at dusk
// ══════════════════════════════════════��════════════════════════════════════

export const BOOK_L4_2_PAGES: InteractivePage[] = [
  // ── COVER ──
  { type: 'cover', title: 'The Brown Owl', subtitle: 'Level 4 · Building Fluency', imageUrl: '/illustrations/4_2/cover.png' },

  // ── SOUNDS ──
  {
    type: 'sound_grid',
    focusSounds: ['are', 'ow'],
    allSounds: L4_ALL_SOUNDS,
  },

  // ── VOCAB PREVIEW ──
  {
    type: 'vocab_preview',
    words: [
      word('owl', 'owl', ['ow','l']),
      word('stared', 'stared', ['s','t','are','d']),
      word('brown', 'brown', ['b','r','ow','n']),
      word('dare', 'dare', ['d','are']),
      word('howl', 'howl', ['h','ow','l']),
      word('care', 'care', ['c','are']),
      word('rare', 'rare', ['r','are']),
      word('growl', 'growl', ['g','r','ow','l']),
    ],
  },

  // ── STORY PAGES ──
  // Page 1
  {
    type: 'story',
    sentences: ['It was getting dark.', 'From deep in the trees came a loud howl, then a growl.', 'What was that?', 'I stared out the window but all I saw were shadows.'],
    words: [
      word('It', 'it', ['i','t']), tricky('was', 'was'),
      word('getting', 'getting', ['g','e','tt','i','ng']), word('dark.', 'dark', ['d','ar','k']),
      word('From', 'from', ['f','r','o','m']), word('deep', 'deep', ['d','ee','p']),
      word('in', 'in', ['i','n']), tricky('the', 'the'),
      word('trees', 'trees', ['t','r','ee','s']), word('came', 'came', ['c','a_e','m']),
      tricky('a', 'a'), word('loud', 'loud', ['l','ou','d']),
      word('howl,', 'howl', ['h','ow','l']), word('then', 'then', ['th','e','n']),
      tricky('a', 'a'), word('growl.', 'growl', ['g','r','ow','l']),
      tricky('What', 'what'), tricky('was', 'was'), word('that?', 'that', ['th','a','t']),
      tricky('I', 'I'), word('stared', 'stared', ['s','t','are','d']),
      word('out', 'out', ['ou','t']), tricky('the', 'the'),
      word('window', 'window', ['w','i','n','d','ow']),
      word('but', 'but', ['b','u','t']), tricky('all', 'all'),
      tricky('I', 'I'), word('saw', 'saw', ['s','aw']),
      tricky('were', 'were'), word('shadows.', 'shadows', ['sh','a','d','ow','s']),
    ],
    imageUrl: '/illustrations/4_2/page1.png',
  },

  // Page 2
  {
    type: 'story',
    sentences: ["'Can we go and look?' I asked Mum.", 'She got me my thick coat and boots.', 'We set off down the dark path together.', 'The air was cool on my bare cheeks.'],
    words: [
      word("'Can", 'can', ['c','a','n']), tricky('we', 'we'),
      word('go', 'go', ['g','oa']), word('and', 'and', ['a','n','d']),
      word("look?'", 'look', ['l','oo','k']), tricky('I', 'I'),
      word('asked', 'asked', ['a','s','k','d']), word('Mum.', 'mum', ['m','u','m']),
      tricky('She', 'she'), word('got', 'got', ['g','o','t']),
      tricky('me', 'me'), tricky('my', 'my'), word('thick', 'thick', ['th','i','ck']),
      word('coat', 'coat', ['c','oa','t']), word('and', 'and', ['a','n','d']),
      word('boots.', 'boots', ['b','oo','t','s']),
      tricky('We', 'we'), word('set', 'set', ['s','e','t']),
      word('off', 'off', ['o','ff']), word('down', 'down', ['d','ow','n']),
      tricky('the', 'the'), word('dark', 'dark', ['d','ar','k']),
      word('path', 'path', ['p','a','th']), word('together.', 'together', ['t','o','g','e','th','er']),
      tricky('The', 'the'), word('air', 'air', ['air']),
      tricky('was', 'was'), word('cool', 'cool', ['c','oo','l']),
      word('on', 'on', ['o','n']), tricky('my', 'my'),
      word('bare', 'bare', ['b','are']), word('cheeks.', 'cheeks', ['ch','ee','k','s']),
    ],
    imageUrl: '/illustrations/4_2/page2.png',
  },

  // Page 3
  {
    type: 'story',
    sentences: ["Then Mum stopped and stared up.", "'Look!' she said.", 'A big brown owl sat on a bare branch.', 'It stared down at us and did not look scared at all.'],
    words: [
      word('Then', 'then', ['th','e','n']), word('Mum', 'mum', ['m','u','m']),
      word('stopped', 'stopped', ['s','t','o','pp','d']), word('and', 'and', ['a','n','d']),
      word('stared', 'stared', ['s','t','are','d']), word('up.', 'up', ['u','p']),
      word("'Look!'", 'look', ['l','oo','k']), tricky('she', 'she'), tricky('said.', 'said'),
      tricky('A', 'a'), word('big', 'big', ['b','i','g']),
      word('brown', 'brown', ['b','r','ow','n']), word('owl', 'owl', ['ow','l']),
      word('sat', 'sat', ['s','a','t']), word('on', 'on', ['o','n']),
      tricky('a', 'a'), word('bare', 'bare', ['b','are']),
      word('branch.', 'branch', ['b','r','a','n','ch']),
      word('It', 'it', ['i','t']), word('stared', 'stared', ['s','t','are','d']),
      word('down', 'down', ['d','ow','n']), word('at', 'at', ['a','t']),
      word('us', 'us', ['u','s']), word('and', 'and', ['a','n','d']),
      word('did', 'did', ['d','i','d']), word('not', 'not', ['n','o','t']),
      word('look', 'look', ['l','oo','k']), word('scared', 'scared', ['s','c','are','d']),
      word('at', 'at', ['a','t']), tricky('all.', 'all'),
    ],
    imageUrl: '/illustrations/4_2/page3.png',
  },

  // Page 4
  {
    type: 'story',
    sentences: ['I stared at the owl.', 'The owl stared right back.', "'How rare!' said Mum.", "'You do not see owls like this!'", 'I wanted to get close but I did not dare.'],
    words: [
      tricky('I', 'I'), word('stared', 'stared', ['s','t','are','d']),
      word('at', 'at', ['a','t']), tricky('the', 'the'), word('owl.', 'owl', ['ow','l']),
      tricky('The', 'the'), word('owl', 'owl', ['ow','l']),
      word('stared', 'stared', ['s','t','are','d']), word('right', 'right', ['r','igh','t']),
      word('back.', 'back', ['b','a','ck']),
      word("'How", 'how', ['h','ow']), word("rare!'", 'rare', ['r','are']),
      tricky('said', 'said'), word('Mum.', 'mum', ['m','u','m']),
      word("'You", 'you', ['y','ou']), tricky('do', 'do'),
      word('not', 'not', ['n','o','t']), tricky('see', 'see'),
      word('owls', 'owls', ['ow','l','s']), tricky('like', 'like'),
      word("this!'", 'this', ['th','i','s']),
      tricky('I', 'I'), word('wanted', 'wanted', ['w','o','n','t','e','d']),
      tricky('to', 'to'), word('get', 'get', ['g','e','t']),
      word('close', 'close', ['c','l','o_e','s']), word('but', 'but', ['b','u','t']),
      tricky('I', 'I'), word('did', 'did', ['d','i','d']),
      word('not', 'not', ['n','o','t']), word('dare.', 'dare', ['d','are']),
    ],
    imageUrl: '/illustrations/4_2/page4.png',
  },

  // Page 5
  {
    type: 'story',
    sentences: ['Then the owl spread its wings and swooped down.', 'Wow!', 'It landed on a stump close to us.', 'I froze.', 'I did not dare to make a sound.'],
    words: [
      word('Then', 'then', ['th','e','n']), tricky('the', 'the'),
      word('owl', 'owl', ['ow','l']), word('spread', 'spread', ['s','p','r','e','d']),
      word('its', 'its', ['i','t','s']), word('wings', 'wings', ['w','i','ng','s']),
      word('and', 'and', ['a','n','d']), word('swooped', 'swooped', ['s','w','oo','p','d']),
      word('down.', 'down', ['d','ow','n']),
      word('Wow!', 'wow', ['w','ow']),
      word('It', 'it', ['i','t']), word('landed', 'landed', ['l','a','n','d','e','d']),
      word('on', 'on', ['o','n']), tricky('a', 'a'),
      word('stump', 'stump', ['s','t','u','m','p']),
      word('close', 'close', ['c','l','o_e','s']), tricky('to', 'to'),
      word('us.', 'us', ['u','s']),
      tricky('I', 'I'), word('froze.', 'froze', ['f','r','o_e','z']),
      tricky('I', 'I'), word('did', 'did', ['d','i','d']),
      word('not', 'not', ['n','o','t']), word('dare', 'dare', ['d','are']),
      tricky('to', 'to'), word('make', 'make', ['m','a_e','k']),
      tricky('a', 'a'), word('sound.', 'sound', ['s','ou','n','d']),
    ],
    imageUrl: '/illustrations/4_2/page5.png',
  },

  // Page 6
  {
    type: 'story',
    sentences: ['The owl looked up at a hole high in the tree.', "Out came soft cheeps.", "'Owlets!' said Mum.", "'She must look after them!'", 'I peeked and saw fluffy brown faces staring down at me.'],
    words: [
      tricky('The', 'the'), word('owl', 'owl', ['ow','l']),
      word('looked', 'looked', ['l','oo','k','d']), word('up', 'up', ['u','p']),
      word('at', 'at', ['a','t']), tricky('a', 'a'),
      word('hole', 'hole', ['h','o_e','l']), word('high', 'high', ['h','igh']),
      word('in', 'in', ['i','n']), tricky('the', 'the'),
      word('tree.', 'tree', ['t','r','ee']),
      word('Out', 'out', ['ou','t']), word('came', 'came', ['c','a_e','m']),
      word('soft', 'soft', ['s','o','f','t']), word('cheeps.', 'cheeps', ['ch','ee','p','s']),
      word("'Owlets!'", 'owlets', ['ow','l','e','t','s']),
      tricky('said', 'said'), word('Mum.', 'mum', ['m','u','m']),
      word("'She", 'she', ['sh','e']), word('must', 'must', ['m','u','s','t']),
      word('look', 'look', ['l','oo','k']), word('after', 'after', ['a','f','t','er']),
      word("them!'", 'them', ['th','e','m']),
      tricky('I', 'I'), word('peeked', 'peeked', ['p','ee','k','d']),
      word('and', 'and', ['a','n','d']), word('saw', 'saw', ['s','aw']),
      word('fluffy', 'fluffy', ['f','l','u','ff','y']),
      word('brown', 'brown', ['b','r','ow','n']),
      word('faces', 'faces', ['f','a_e','s','e','s']),
      word('staring', 'staring', ['s','t','are','i','ng']),
      word('down', 'down', ['d','ow','n']), word('at', 'at', ['a','t']),
      tricky('me.', 'me'),
    ],
    imageUrl: '/illustrations/4_2/page6.png',
  },

  // Page 7
  {
    type: 'story',
    sentences: ['The owl swooped back up with a mouse in its claws.', 'The owlets crowded round, cheeping loud.', 'What a rare sight!', 'Mum and I shared a smile.'],
    words: [
      tricky('The', 'the'), word('owl', 'owl', ['ow','l']),
      word('swooped', 'swooped', ['s','w','oo','p','d']),
      word('back', 'back', ['b','a','ck']), word('up', 'up', ['u','p']),
      word('with', 'with', ['w','i','th']), tricky('a', 'a'),
      word('mouse', 'mouse', ['m','ou','s']), word('in', 'in', ['i','n']),
      word('its', 'its', ['i','t','s']), word('claws.', 'claws', ['c','l','aw','s']),
      tricky('The', 'the'), word('owlets', 'owlets', ['ow','l','e','t','s']),
      word('crowded', 'crowded', ['c','r','ow','d','e','d']),
      word('round,', 'round', ['r','ou','n','d']),
      word('cheeping', 'cheeping', ['ch','ee','p','i','ng']),
      word('loud.', 'loud', ['l','ou','d']),
      tricky('What', 'what'), tricky('a', 'a'),
      word('rare', 'rare', ['r','are']), word('sight!', 'sight', ['s','igh','t']),
      word('Mum', 'mum', ['m','u','m']), word('and', 'and', ['a','n','d']),
      tricky('I', 'I'), word('shared', 'shared', ['sh','are','d']),
      tricky('a', 'a'), word('smile.', 'smile', ['s','m','igh','l']),
    ],
    imageUrl: '/illustrations/4_2/page7.png',
  },

  // Page 8
  {
    type: 'story',
    sentences: ['We went home under the stars.', "'I want to go back and care for them,' I said.", "Mum took my hand.", "'We will,' she said.", 'I smiled all the way home.', 'The brown owl and her owlets were safe in the dark.'],
    words: [
      tricky('We', 'we'), word('went', 'went', ['w','e','n','t']),
      word('home', 'home', ['h','o_e','m']), word('under', 'under', ['u','n','d','er']),
      tricky('the', 'the'), word('stars.', 'stars', ['s','t','ar','s']),
      word("'I", 'I', []), word('want', 'want', ['w','o','n','t']),
      tricky('to', 'to'), word('go', 'go', ['g','oa']),
      word('back', 'back', ['b','a','ck']), word('and', 'and', ['a','n','d']),
      word('care', 'care', ['c','are']), word('for', 'for', ['f','or']),
      word("them,'", 'them', ['th','e','m']), tricky('I', 'I'), tricky('said.', 'said'),
      word('Mum', 'mum', ['m','u','m']), word('took', 'took', ['t','oo','k']),
      tricky('my', 'my'), word('hand.', 'hand', ['h','a','n','d']),
      word("'We", 'we', ['w','e']), word("will,'", 'will', ['w','i','ll']),
      tricky('she', 'she'), tricky('said.', 'said'),
      tricky('I', 'I'), word('smiled', 'smiled', ['s','m','igh','l','d']),
      tricky('all', 'all'), tricky('the', 'the'),
      word('way', 'way', ['w','ay']), word('home.', 'home', ['h','o_e','m']),
      tricky('The', 'the'), word('brown', 'brown', ['b','r','ow','n']),
      word('owl', 'owl', ['ow','l']), word('and', 'and', ['a','n','d']),
      tricky('her', 'her'), word('owlets', 'owlets', ['ow','l','e','t','s']),
      tricky('were', 'were'), word('safe', 'safe', ['s','a_e','f']),
      word('in', 'in', ['i','n']), tricky('the', 'the'),
      word('dark.', 'dark', ['d','ar','k']),
    ],
    imageUrl: '/illustrations/4_2/page8.png',
  },

  // ─��� QUIZ ──
  {
    type: 'quiz',
    questions: [
      { question: 'What did the owl have in its claws?',
        options: [{ label: 'A mouse', isCorrect: true }, { label: 'A worm', isCorrect: false }, { label: 'A leaf', isCorrect: false }] },
      { question: 'Why did the child not dare to get close?',
        options: [{ label: 'Did not want to scare it', isCorrect: true }, { label: 'Was too tired', isCorrect: false }, { label: 'Mum said no', isCorrect: false }] },
      { question: "What does 'rare' mean?",
        options: [{ label: 'Not seen often', isCorrect: true }, { label: 'Very big', isCorrect: false }, { label: 'Very old', isCorrect: false }] },
    ],
  },

  // ── WORD READING ──
  { type: 'word_reading', words: [
    word('howl', 'howl', ['h','ow','l']),
    word('bare', 'bare', ['b','are']),
    word('brown', 'brown', ['b','r','ow','n']),
    word('stared', 'stared', ['s','t','are','d']),
    word('down', 'down', ['d','ow','n']),
    word('care', 'care', ['c','are']),
  ] },

  // ── TRICKY WORDS ──
  { type: 'tricky_words', words: [
    tricky('said', 'said'), tricky('was', 'was'), tricky('what', 'what'),
    tricky('were', 'were'), tricky('she', 'she'), tricky('all', 'all'),
  ] },

  // ── NONSENSE WORDS ──
  { type: 'nonsense_words', words: [
    word('zare', 'zare', ['z','are']),
    word('gow', 'gow', ['g','ow']),
    word('mowl', 'mowl', ['m','ow','l']),
    word('frow', 'frow', ['f','r','ow']),
    word('jare', 'jare', ['j','are']),
    word('plown', 'plown', ['p','l','ow','n']),
    word('chowl', 'chowl', ['ch','ow','l']),
    word('thare', 'thare', ['th','are']),
    word('drow', 'drow', ['d','r','ow']),
    word('scrow', 'scrow', ['s','c','r','ow']),
    word('blare', 'blare', ['b','l','are']),
    word('snown', 'snown', ['s','n','ow','n']),
  ] },

  // ── SPELLING ──
  { type: 'spelling', words: [
    { word: 'stare', imageUrl: '/images/words/stare.png', letters: ['s','t','are'] },
    { word: 'care', imageUrl: '/images/words/care.png', letters: ['c','are'] },
    { word: 'dare', imageUrl: '/images/words/dare.png', letters: ['d','are'] },
    { word: 'owl', imageUrl: '/images/words/owl.png', letters: ['ow','l'] },
  ] },

  // ── WRITING PRACTICE ──
  { type: 'writing_practice', letters: ['are', 'ow'] },

  // ── STORY ORDERING ──
  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/4_2/page1.png', label: 'A loud howl in the dark.', correctIndex: 0 },
    { imageUrl: '/illustrations/4_2/page2.png', label: 'Off down the dark path.', correctIndex: 1 },
    { imageUrl: '/illustrations/4_2/page3.png', label: 'A big brown owl!', correctIndex: 2 },
    { imageUrl: '/illustrations/4_2/page5.png', label: 'The owl swooped down.', correctIndex: 3 },
    { imageUrl: '/illustrations/4_2/page6.png', label: 'Owlets in the tree!', correctIndex: 4 },
    { imageUrl: '/illustrations/4_2/page8.png', label: 'Home under the stars.', correctIndex: 5 },
  ] },

  // ── DRAWING ──
  { type: 'drawing', prompt: 'Draw Your Favourite Part' },

  // ── CERTIFICATE ──
  { type: 'certificate', bookTitle: 'The Brown Owl' },
];


// ═════���══════════════════════════════════��══════════════════════════════════
// L4.3 — "The New Glue"
// Focus sounds: ew, ue
// Setting: Modern Oaxacan home (Mexico)
// ═══════════════════════════════════════════════════════════════════════════

export const BOOK_L4_3_PAGES: InteractivePage[] = [
  // ── COVER ──
  { type: 'cover', title: 'The New Glue', subtitle: 'Level 4 · Building Fluency', imageUrl: '/illustrations/4_3/cover.png' },

  // ── SOUNDS ──
  {
    type: 'sound_grid',
    focusSounds: ['ew', 'ue'],
    allSounds: L4_ALL_SOUNDS,
  },

  // ── VOCAB PREVIEW ──
  {
    type: 'vocab_preview',
    words: [
      word('glue', 'glue', ['g','l','ue']),
      word('blue', 'blue', ['b','l','ue']),
      word('new', 'new', ['n','ew']),
      word('drew', 'drew', ['d','r','ew']),
      word('threw', 'threw', ['th','r','ew']),
      word('grew', 'grew', ['g','r','ew']),
      word('true', 'true', ['t','r','ue']),
      word('rescued', 'rescued', ['r','e','s','c','ue','d']),
    ],
  },

  // ── STORY PAGES ──
  // Page 1
  {
    type: 'story',
    sentences: ['The girl had a pot of new blue glue.', 'She drew a bird on a card.', '"This card is for Mum," she said to Dad.', 'She pressed the blue glue on — but she pressed too hard!'],
    words: [
      tricky('The', 'the'), word('girl', 'girl', ['g','ur','l']),
      word('had', 'had', ['h','a','d']), tricky('a', 'a'),
      word('pot', 'pot', ['p','o','t']), word('of', 'of', ['o','f']),
      word('new', 'new', ['n','ew']), word('blue', 'blue', ['b','l','ue']),
      word('glue.', 'glue', ['g','l','ue']),
      tricky('She', 'she'), word('drew', 'drew', ['d','r','ew']),
      tricky('a', 'a'), word('bird', 'bird', ['b','ur','d']),
      word('on', 'on', ['o','n']), tricky('a', 'a'), word('card.', 'card', ['c','ar','d']),
      word('"This', 'this', ['th','i','s']), word('card', 'card', ['c','ar','d']),
      tricky('is', 'is'), word('for', 'for', ['f','or']),
      word('Mum,"', 'mum', ['m','u','m']), tricky('she', 'she'),
      tricky('said', 'said'), tricky('to', 'to'), word('Dad.', 'dad', ['d','a','d']),
      tricky('She', 'she'), word('pressed', 'pressed', ['p','r','e','ss','d']),
      tricky('the', 'the'), word('blue', 'blue', ['b','l','ue']),
      word('glue', 'glue', ['g','l','ue']), word('on', 'on', ['o','n']),
      word('but', 'but', ['b','u','t']), tricky('she', 'she'),
      word('pressed', 'pressed', ['p','r','e','ss','d']),
      word('too', 'too', ['t','oo']), word('hard!', 'hard', ['h','ar','d']),
    ],
    imageUrl: '/illustrations/4_3/page1.png',
  },

  // Page 2
  {
    type: 'story',
    sentences: ['The blue glue spread across the desk and stuck to her hand!', 'She pulled and she shook.', 'Then the card flew off her hand, down the hall and down the stairs!'],
    words: [
      tricky('The', 'the'), word('blue', 'blue', ['b','l','ue']),
      word('glue', 'glue', ['g','l','ue']), word('spread', 'spread', ['s','p','r','e','d']),
      word('across', 'across', ['a','c','r','o','ss']),
      tricky('the', 'the'), word('desk', 'desk', ['d','e','s','k']),
      word('and', 'and', ['a','n','d']), word('stuck', 'stuck', ['s','t','u','ck']),
      tricky('to', 'to'), tricky('her', 'her'), word('hand!', 'hand', ['h','a','n','d']),
      tricky('She', 'she'), word('pulled', 'pulled', ['p','u','ll','d']),
      word('and', 'and', ['a','n','d']), tricky('she', 'she'),
      word('shook.', 'shook', ['sh','oo','k']),
      word('Then', 'then', ['th','e','n']), tricky('the', 'the'),
      word('card', 'card', ['c','ar','d']), word('flew', 'flew', ['f','l','ew']),
      word('off', 'off', ['o','ff']), tricky('her', 'her'),
      word('hand,', 'hand', ['h','a','n','d']), word('down', 'down', ['d','ow','n']),
      tricky('the', 'the'), word('hall', 'hall', ['h','a','ll']),
      word('and', 'and', ['a','n','d']), word('down', 'down', ['d','ow','n']),
      tricky('the', 'the'), word('stairs!', 'stairs', ['s','t','air','s']),
    ],
    imageUrl: '/illustrations/4_3/page2.png',
  },

  // Page 3
  {
    type: 'story',
    sentences: ['The card landed right on the cat at the foot of the stairs.', 'The cat grew cross and ran.', 'It had blue glue and bits of card stuck in its fur!'],
    words: [
      tricky('The', 'the'), word('card', 'card', ['c','ar','d']),
      word('landed', 'landed', ['l','a','n','d','e','d']),
      word('right', 'right', ['r','igh','t']), word('on', 'on', ['o','n']),
      tricky('the', 'the'), word('cat', 'cat', ['c','a','t']),
      word('at', 'at', ['a','t']), tricky('the', 'the'),
      word('foot', 'foot', ['f','oo','t']), word('of', 'of', ['o','f']),
      tricky('the', 'the'), word('stairs.', 'stairs', ['s','t','air','s']),
      tricky('The', 'the'), word('cat', 'cat', ['c','a','t']),
      word('grew', 'grew', ['g','r','ew']), word('cross', 'cross', ['c','r','o','ss']),
      word('and', 'and', ['a','n','d']), word('ran.', 'ran', ['r','a','n']),
      word('It', 'it', ['i','t']), word('had', 'had', ['h','a','d']),
      word('blue', 'blue', ['b','l','ue']), word('glue', 'glue', ['g','l','ue']),
      word('and', 'and', ['a','n','d']), word('bits', 'bits', ['b','i','t','s']),
      word('of', 'of', ['o','f']), word('card', 'card', ['c','ar','d']),
      word('stuck', 'stuck', ['s','t','u','ck']), word('in', 'in', ['i','n']),
      word('its', 'its', ['i','t','s']), word('fur!', 'fur', ['f','ur']),
    ],
    imageUrl: '/illustrations/4_3/page3.png',
  },

  // Page 4
  {
    type: 'story',
    sentences: ['The cat flew into the front room and jumped on the shelf.', 'It bumped a blue cup of tea.', 'The cup fell and tea ran down on to the new rug.'],
    words: [
      tricky('The', 'the'), word('cat', 'cat', ['c','a','t']),
      word('flew', 'flew', ['f','l','ew']), tricky('into', 'into'),
      tricky('the', 'the'), word('front', 'front', ['f','r','o','n','t']),
      word('room', 'room', ['r','oo','m']), word('and', 'and', ['a','n','d']),
      word('jumped', 'jumped', ['j','u','m','p','d']),
      word('on', 'on', ['o','n']), tricky('the', 'the'),
      word('shelf.', 'shelf', ['sh','e','l','f']),
      word('It', 'it', ['i','t']), word('bumped', 'bumped', ['b','u','m','p','d']),
      tricky('a', 'a'), word('blue', 'blue', ['b','l','ue']),
      word('cup', 'cup', ['c','u','p']), word('of', 'of', ['o','f']),
      word('tea.', 'tea', ['t','ea']),
      tricky('The', 'the'), word('cup', 'cup', ['c','u','p']),
      word('fell', 'fell', ['f','e','ll']), word('and', 'and', ['a','n','d']),
      word('tea', 'tea', ['t','ea']), word('ran', 'ran', ['r','a','n']),
      word('down', 'down', ['d','ow','n']), word('on', 'on', ['o','n']),
      tricky('to', 'to'), tricky('the', 'the'),
      word('new', 'new', ['n','ew']), word('rug.', 'rug', ['r','u','g']),
    ],
    imageUrl: '/illustrations/4_3/page4.png',
  },

  // Page 5
  {
    type: 'story',
    sentences: ['Then the cat ran into the kitchen.', 'Dad was at the sink.', 'He turned to look, but he did not see the wet patch on the ground.', 'So he slid and fell with a bump!', '"This is all due to that blue glue!" he said.'],
    words: [
      word('Then', 'then', ['th','e','n']), tricky('the', 'the'),
      word('cat', 'cat', ['c','a','t']), word('ran', 'ran', ['r','a','n']),
      tricky('into', 'into'), tricky('the', 'the'),
      word('kitchen.', 'kitchen', ['k','i','t','ch','e','n']),
      word('Dad', 'dad', ['d','a','d']), tricky('was', 'was'),
      word('at', 'at', ['a','t']), tricky('the', 'the'),
      word('sink.', 'sink', ['s','i','nk']),
      tricky('He', 'he'), word('turned', 'turned', ['t','ur','n','d']),
      tricky('to', 'to'), word('look,', 'look', ['l','oo','k']),
      word('but', 'but', ['b','u','t']), tricky('he', 'he'),
      word('did', 'did', ['d','i','d']), word('not', 'not', ['n','o','t']),
      tricky('see', 'see'), tricky('the', 'the'),
      word('wet', 'wet', ['w','e','t']), word('patch', 'patch', ['p','a','t','ch']),
      word('on', 'on', ['o','n']), tricky('the', 'the'),
      word('ground.', 'ground', ['g','r','ou','n','d']),
      tricky('So', 'so'), tricky('he', 'he'),
      word('slid', 'slid', ['s','l','i','d']), word('and', 'and', ['a','n','d']),
      word('fell', 'fell', ['f','e','ll']), word('with', 'with', ['w','i','th']),
      tricky('a', 'a'), word('bump!', 'bump', ['b','u','m','p']),
      word('"This', 'this', ['th','i','s']), tricky('is', 'is'),
      tricky('all', 'all'), word('due', 'due', ['d','ue']),
      tricky('to', 'to'), word('that', 'that', ['th','a','t']),
      word('blue', 'blue', ['b','l','ue']), word('glue!"', 'glue', ['g','l','ue']),
      tricky('he', 'he'), tricky('said.', 'said'),
    ],
    imageUrl: '/illustrations/4_3/page5.png',
  },

  // Page 6
  {
    type: 'story',
    sentences: ['Then the cat ran out into the garden.', 'It jumped on the wall and bumped a pot of blue flowers.', 'The pot started to fall!', 'The girl threw her arms out and rescued it just in time.'],
    words: [
      word('Then', 'then', ['th','e','n']), tricky('the', 'the'),
      word('cat', 'cat', ['c','a','t']), word('ran', 'ran', ['r','a','n']),
      word('out', 'out', ['ou','t']), tricky('into', 'into'),
      tricky('the', 'the'), word('garden.', 'garden', ['g','ar','d','e','n']),
      word('It', 'it', ['i','t']), word('jumped', 'jumped', ['j','u','m','p','d']),
      word('on', 'on', ['o','n']), tricky('the', 'the'),
      word('wall', 'wall', ['w','a','ll']), word('and', 'and', ['a','n','d']),
      word('bumped', 'bumped', ['b','u','m','p','d']), tricky('a', 'a'),
      word('pot', 'pot', ['p','o','t']), word('of', 'of', ['o','f']),
      word('blue', 'blue', ['b','l','ue']), word('flowers.', 'flowers', ['f','l','ow','er','s']),
      tricky('The', 'the'), word('pot', 'pot', ['p','o','t']),
      word('started', 'started', ['s','t','ar','t','e','d']),
      tricky('to', 'to'), word('fall!', 'fall', ['f','a','ll']),
      tricky('The', 'the'), word('girl', 'girl', ['g','ur','l']),
      word('threw', 'threw', ['th','r','ew']), tricky('her', 'her'),
      word('arms', 'arms', ['ar','m','s']), word('out', 'out', ['ou','t']),
      word('and', 'and', ['a','n','d']), word('rescued', 'rescued', ['r','e','s','c','ue','d']),
      word('it', 'it', ['i','t']), word('just', 'just', ['j','u','s','t']),
      word('in', 'in', ['i','n']), word('time.', 'time', ['t','i_e','m']),
    ],
    imageUrl: '/illustrations/4_3/page6.png',
  },

  // Page 7
  {
    type: 'story',
    sentences: ['"That cat!" said Dad.', 'They cleaned up all the glue and the mess.', 'The girl wiped the blue stain off the desk.', 'The cat just sat and chewed its fur clean.'],
    words: [
      word('"That', 'that', ['th','a','t']), word('cat!"', 'cat', ['c','a','t']),
      tricky('said', 'said'), word('Dad.', 'dad', ['d','a','d']),
      tricky('They', 'they'), word('cleaned', 'cleaned', ['c','l','ea','n','d']),
      word('up', 'up', ['u','p']), tricky('all', 'all'),
      tricky('the', 'the'), word('glue', 'glue', ['g','l','ue']),
      word('and', 'and', ['a','n','d']), tricky('the', 'the'),
      word('mess.', 'mess', ['m','e','ss']),
      tricky('The', 'the'), word('girl', 'girl', ['g','ur','l']),
      word('wiped', 'wiped', ['w','i_e','p','d']), tricky('the', 'the'),
      word('blue', 'blue', ['b','l','ue']), word('stain', 'stain', ['s','t','ai','n']),
      word('off', 'off', ['o','ff']), tricky('the', 'the'),
      word('desk.', 'desk', ['d','e','s','k']),
      tricky('The', 'the'), word('cat', 'cat', ['c','a','t']),
      word('just', 'just', ['j','u','s','t']), word('sat', 'sat', ['s','a','t']),
      word('and', 'and', ['a','n','d']), word('chewed', 'chewed', ['ch','ew','d']),
      word('its', 'its', ['i','t','s']), word('fur', 'fur', ['f','ur']),
      word('clean.', 'clean', ['c','l','ea','n']),
    ],
    imageUrl: '/illustrations/4_3/page7.png',
  },

  // Page 8
  {
    type: 'story',
    sentences: ['At last, the card was finished.', 'Mum came home and the girl gave it to her.', '"You drew this for me?" said Mum.', '"It is true," said the girl.', '"And it was all due to the new blue glue!"'],
    words: [
      word('At', 'at', ['a','t']), word('last,', 'last', ['l','a','s','t']),
      tricky('the', 'the'), word('card', 'card', ['c','ar','d']),
      tricky('was', 'was'), word('finished.', 'finished', ['f','i','n','i','sh','d']),
      word('Mum', 'mum', ['m','u','m']), word('came', 'came', ['c','a_e','m']),
      word('home', 'home', ['h','o_e','m']), word('and', 'and', ['a','n','d']),
      tricky('the', 'the'), word('girl', 'girl', ['g','ur','l']),
      word('gave', 'gave', ['g','a_e','v']), word('it', 'it', ['i','t']),
      tricky('to', 'to'), tricky('her.', 'her'),
      word('"You', 'you', ['y','ou']), word('drew', 'drew', ['d','r','ew']),
      word('this', 'this', ['th','i','s']), word('for', 'for', ['f','or']),
      word('me?"', 'me', ['m','e']), tricky('said', 'said'),
      word('Mum.', 'mum', ['m','u','m']),
      word('"It', 'it', ['i','t']), tricky('is', 'is'),
      word('true,"', 'true', ['t','r','ue']), tricky('said', 'said'),
      tricky('the', 'the'), word('girl.', 'girl', ['g','ur','l']),
      word('"And', 'and', ['a','n','d']), word('it', 'it', ['i','t']),
      tricky('was', 'was'), tricky('all', 'all'),
      word('due', 'due', ['d','ue']), tricky('to', 'to'),
      tricky('the', 'the'), word('new', 'new', ['n','ew']),
      word('blue', 'blue', ['b','l','ue']), word('glue!"', 'glue', ['g','l','ue']),
    ],
    imageUrl: '/illustrations/4_3/page8.png',
  },

  // ── QUIZ ──
  {
    type: 'quiz',
    questions: [
      { question: 'What did the girl make for Mum?',
        options: [{ label: 'A card with a bird', isCorrect: true }, { label: 'A painting', isCorrect: false }, { label: 'A cake', isCorrect: false }] },
      { question: 'What started the chain of events?',
        options: [{ label: 'Too much glue', isCorrect: true }, { label: 'The cat knocked it', isCorrect: false }, { label: 'Dad slipped', isCorrect: false }] },
      { question: "What does 'rescued' mean?",
        options: [{ label: 'Saved from danger', isCorrect: true }, { label: 'Threw away', isCorrect: false }, { label: 'Broke into pieces', isCorrect: false }] },
    ],
  },

  // ── WORD READING ──
  { type: 'word_reading', words: [
    word('chewed', 'chewed', ['ch','ew','d']),
    word('rescued', 'rescued', ['r','e','s','c','ue','d']),
    word('flew', 'flew', ['f','l','ew']),
    word('true', 'true', ['t','r','ue']),
    word('blue', 'blue', ['b','l','ue']),
    word('new', 'new', ['n','ew']),
  ] },

  // ── TRICKY WORDS ──
  { type: 'tricky_words', words: [
    tricky('said', 'said'), tricky('was', 'was'), tricky('she', 'she'),
    tricky('all', 'all'), tricky('so', 'so'), tricky('into', 'into'),
  ] },

  // ── NONSENSE WORDS ──
  { type: 'nonsense_words', words: [
    word('plew', 'plew', ['p','l','ew']),
    word('snew', 'snew', ['s','n','ew']),
    word('tew', 'tew', ['t','ew']),
    word('bew', 'bew', ['b','ew']),
    word('gew', 'gew', ['g','ew']),
    word('stue', 'stue', ['s','t','ue']),
    word('bue', 'bue', ['b','ue']),
    word('frue', 'frue', ['f','r','ue']),
    word('pue', 'pue', ['p','ue']),
    word('grue', 'grue', ['g','r','ue']),
  ] },

  // ── SPELLING ──
  { type: 'spelling', words: [
    { word: 'new', imageUrl: '/images/words/new.png', letters: ['n','ew'] },
    { word: 'glue', imageUrl: '/images/words/glue.png', letters: ['g','l','ue'] },
    { word: 'blue', imageUrl: '/images/words/blue.png', letters: ['b','l','ue'] },
    { word: 'drew', imageUrl: '/images/words/drew.png', letters: ['d','r','ew'] },
  ] },

  // ��─ WRITING PRACTICE ──
  { type: 'writing_practice', letters: ['ew', 'ue'] },

  // ── STORY ORDERING ──
  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/4_3/page1.png', label: 'New blue glue!', correctIndex: 0 },
    { imageUrl: '/illustrations/4_3/page2.png', label: 'The card flew off!', correctIndex: 1 },
    { imageUrl: '/illustrations/4_3/page3.png', label: 'Card stuck on the cat!', correctIndex: 2 },
    { imageUrl: '/illustrations/4_3/page5.png', label: 'Dad slid and fell!', correctIndex: 3 },
    { imageUrl: '/illustrations/4_3/page6.png', label: 'Girl rescued the pot!', correctIndex: 4 },
    { imageUrl: '/illustrations/4_3/page8.png', label: 'Mum loved the card.', correctIndex: 5 },
  ] },

  // ── DRAWING ──
  { type: 'drawing', prompt: 'Draw Your Favourite Part' },

  // ── CERTIFICATE ──
  { type: 'certificate', bookTitle: 'The New Glue' },
];


// ═══════��═══════════════════════════════���═══════════════════════════════════
// L4.4 — "The Cheeky Monkey"
// Focus sounds: are, ur, er, ew, ue, ow (REVIEW of all L4)
// Setting: Masjid Putra, Putrajaya, Malaysia
// ═══════════���═══════════════════════════��═════════════════════════════════��═

export const BOOK_L4_4_PAGES: InteractivePage[] = [
  // ── COVER ──
  { type: 'cover', title: 'The Cheeky Monkey', subtitle: 'Level 4 · Building Fluency', imageUrl: '/illustrations/4_4/cover.png' },

  // ── SOUNDS ──
  {
    type: 'sound_grid',
    focusSounds: ['are', 'ur', 'er', 'ew', 'ue', 'ow'],
    allSounds: L4_ALL_SOUNDS,
  },

  // ── VOCAB PREVIEW ──
  {
    type: 'vocab_preview',
    words: [
      word('brown', 'brown', ['b','r','ow','n']),
      word('furry', 'furry', ['f','ur','r','y']),
      word('down', 'down', ['d','ow','n']),
      word('now', 'now', ['n','ow']),
      word('cheeky', 'cheeky', ['ch','ee','k','y']),
      word('new', 'new', ['n','ew']),
      word('glow', 'glow', ['g','l','ow']),
      word('true', 'true', ['t','r','ue']),
    ],
  },

  // ── STORY PAGES ──
  // Page 1
  {
    type: 'story',
    sentences: ['The sun was up.', 'It was a new day!', 'The boy and Mum went to the big pink mosque.', '"Wow!" said the boy.', '"It is so big!"'],
    words: [
      tricky('The', 'the'), word('sun', 'sun', ['s','u','n']),
      tricky('was', 'was'), word('up.', 'up', ['u','p']),
      word('It', 'it', ['i','t']), tricky('was', 'was'),
      tricky('a', 'a'), word('new', 'new', ['n','ew']), word('day!', 'day', ['d','ay']),
      tricky('The', 'the'), word('boy', 'boy', ['b','oy']),
      word('and', 'and', ['a','n','d']), word('Mum', 'mum', ['m','u','m']),
      word('went', 'went', ['w','e','n','t']), tricky('to', 'to'),
      tricky('the', 'the'), word('big', 'big', ['b','i','g']),
      word('pink', 'pink', ['p','i','nk']), word('mosque.', 'mosque', ['m','o','s','k']),
      word('"Wow!"', 'wow', ['w','ow']), tricky('said', 'said'),
      tricky('the', 'the'), word('boy.', 'boy', ['b','oy']),
      word('"It', 'it', ['i','t']), tricky('is', 'is'),
      tricky('so', 'so'), word('big!"', 'big', ['b','i','g']),
    ],
    imageUrl: '/illustrations/4_4/page1.png',
  },

  // Page 2
  {
    type: 'story',
    sentences: ['They went down to the water.', 'The blue lake was still and cool.', 'Pink and blue — how grand it was!'],
    words: [
      tricky('They', 'they'), word('went', 'went', ['w','e','n','t']),
      word('down', 'down', ['d','ow','n']), tricky('to', 'to'),
      tricky('the', 'the'), word('water.', 'water', ['w','or','t','er']),
      tricky('The', 'the'), word('blue', 'blue', ['b','l','ue']),
      word('lake', 'lake', ['l','a_e','k']), tricky('was', 'was'),
      word('still', 'still', ['s','t','i','ll']), word('and', 'and', ['a','n','d']),
      word('cool.', 'cool', ['c','oo','l']),
      word('Pink', 'pink', ['p','i','nk']), word('and', 'and', ['a','n','d']),
      word('blue', 'blue', ['b','l','ue']), word('how', 'how', ['h','ow']),
      word('grand', 'grand', ['g','r','a','n','d']), word('it', 'it', ['i','t']),
      tricky('was!', 'was'),
    ],
    imageUrl: '/illustrations/4_4/page2.png',
  },

  // Page 3
  {
    type: 'story',
    sentences: ['But then he saw something brown and furry.', 'A monkey!', 'It sat on a wall and turned to stare.', '"Wow!" said the boy.', '"What is THAT?"'],
    words: [
      word('But', 'but', ['b','u','t']), word('then', 'then', ['th','e','n']),
      tricky('he', 'he'), word('saw', 'saw', ['s','aw']),
      tricky('something', 'something'), word('brown', 'brown', ['b','r','ow','n']),
      word('and', 'and', ['a','n','d']), word('furry.', 'furry', ['f','ur','r','y']),
      tricky('A', 'a'), word('monkey!', 'monkey', ['m','o','n','k','ey']),
      word('It', 'it', ['i','t']), word('sat', 'sat', ['s','a','t']),
      word('on', 'on', ['o','n']), tricky('a', 'a'),
      word('wall', 'wall', ['w','a','ll']), word('and', 'and', ['a','n','d']),
      word('turned', 'turned', ['t','ur','n','d']), tricky('to', 'to'),
      word('stare.', 'stare', ['s','t','are']),
      word('"Wow!"', 'wow', ['w','ow']), tricky('said', 'said'),
      tricky('the', 'the'), word('boy.', 'boy', ['b','oy']),
      word('"What', 'what', ['wh','a','t']), tricky('is', 'is'),
      word('THAT?"', 'that', ['th','a','t']),
    ],
    imageUrl: '/illustrations/4_4/page3.png',
  },

  // Page 4
  {
    type: 'story',
    sentences: ['The monkey had his snack!', 'It ran into the garden — fast!', '"Stop!" said the boy.', 'But the monkey just grinned and ran on.'],
    words: [
      tricky('The', 'the'), word('monkey', 'monkey', ['m','o','n','k','ey']),
      word('had', 'had', ['h','a','d']), word('his', 'his', ['h','i','s']),
      word('snack!', 'snack', ['s','n','a','ck']),
      word('It', 'it', ['i','t']), word('ran', 'ran', ['r','a','n']),
      tricky('into', 'into'), tricky('the', 'the'),
      word('garden', 'garden', ['g','ar','d','e','n']),
      word('fast!', 'fast', ['f','a','s','t']),
      word('"Stop!"', 'stop', ['s','t','o','p']),
      tricky('said', 'said'), tricky('the', 'the'), word('boy.', 'boy', ['b','oy']),
      word('But', 'but', ['b','u','t']), tricky('the', 'the'),
      word('monkey', 'monkey', ['m','o','n','k','ey']),
      word('just', 'just', ['j','u','s','t']),
      word('grinned', 'grinned', ['g','r','i','nn','d']),
      word('and', 'and', ['a','n','d']), word('ran', 'ran', ['r','a','n']),
      word('on.', 'on', ['o','n']),
    ],
    imageUrl: '/illustrations/4_4/page4.png',
  },

  // Page 5
  {
    type: 'story',
    sentences: ['The boy ran after it.', 'Round and round!', 'The brown furry tail went past a tree.', '"Oh no! Where did it go?"'],
    words: [
      tricky('The', 'the'), word('boy', 'boy', ['b','oy']),
      word('ran', 'ran', ['r','a','n']), word('after', 'after', ['a','f','t','er']),
      word('it.', 'it', ['i','t']),
      word('Round', 'round', ['r','ou','n','d']), word('and', 'and', ['a','n','d']),
      word('round!', 'round', ['r','ou','n','d']),
      tricky('The', 'the'), word('brown', 'brown', ['b','r','ow','n']),
      word('furry', 'furry', ['f','ur','r','y']),
      word('tail', 'tail', ['t','ai','l']), word('went', 'went', ['w','e','n','t']),
      word('past', 'past', ['p','a','s','t']), tricky('a', 'a'),
      word('tree.', 'tree', ['t','r','ee']),
      word('"Oh', 'oh', ['o']), word('no!', 'no', ['n','oa']),
      tricky('Where', 'where'), word('did', 'did', ['d','i','d']),
      word('it', 'it', ['i','t']), word('go?"', 'go', ['g','oa']),
    ],
    imageUrl: '/illustrations/4_4/page5.png',
  },

  // Page 6
  {
    type: 'story',
    sentences: ['At last, the boy stopped.', 'The monkey sat by the water with his snack.', 'It had not run off!', 'It just sat and munched.'],
    words: [
      word('At', 'at', ['a','t']), word('last,', 'last', ['l','a','s','t']),
      tricky('the', 'the'), word('boy', 'boy', ['b','oy']),
      word('stopped.', 'stopped', ['s','t','o','pp','d']),
      tricky('The', 'the'), word('monkey', 'monkey', ['m','o','n','k','ey']),
      word('sat', 'sat', ['s','a','t']), word('by', 'by', ['b','y']),
      tricky('the', 'the'), word('water', 'water', ['w','or','t','er']),
      word('with', 'with', ['w','i','th']), word('his', 'his', ['h','i','s']),
      word('snack.', 'snack', ['s','n','a','ck']),
      word('It', 'it', ['i','t']), word('had', 'had', ['h','a','d']),
      word('not', 'not', ['n','o','t']), word('run', 'run', ['r','u','n']),
      word('off!', 'off', ['o','ff']),
      word('It', 'it', ['i','t']), word('just', 'just', ['j','u','s','t']),
      word('sat', 'sat', ['s','a','t']), word('and', 'and', ['a','n','d']),
      word('munched.', 'munched', ['m','u','n','ch','d']),
    ],
    imageUrl: '/illustrations/4_4/page6.png',
  },

  // Page 7
  {
    type: 'story',
    sentences: ['Mum got there too.', 'Her dark gown flowed in the warm air.', 'She had a true glow.', '"You ran so fast!" she said with a grin.'],
    words: [
      word('Mum', 'mum', ['m','u','m']), word('got', 'got', ['g','o','t']),
      tricky('there', 'there'), word('too.', 'too', ['t','oo']),
      tricky('Her', 'her'), word('dark', 'dark', ['d','ar','k']),
      word('gown', 'gown', ['g','ow','n']), word('flowed', 'flowed', ['f','l','ow','d']),
      word('in', 'in', ['i','n']), tricky('the', 'the'),
      word('warm', 'warm', ['w','ar','m']), word('air.', 'air', ['air']),
      tricky('She', 'she'), word('had', 'had', ['h','a','d']),
      tricky('a', 'a'), word('true', 'true', ['t','r','ue']),
      word('glow.', 'glow', ['g','l','ow']),
      word('"You', 'you', ['y','ou']), word('ran', 'ran', ['r','a','n']),
      tricky('so', 'so'), word('fast!"', 'fast', ['f','a','s','t']),
      tricky('she', 'she'), tricky('said', 'said'),
      word('with', 'with', ['w','i','th']), tricky('a', 'a'),
      word('grin.', 'grin', ['g','r','i','n']),
    ],
    imageUrl: '/illustrations/4_4/page7.png',
  },

  // Page 8
  {
    type: 'story',
    sentences: ['The boy sat down with Mum by the water.', 'The monkey was still munching.', '"Wow!" said the boy with a grin.', '"This is the best day!"'],
    words: [
      tricky('The', 'the'), word('boy', 'boy', ['b','oy']),
      word('sat', 'sat', ['s','a','t']), word('down', 'down', ['d','ow','n']),
      word('with', 'with', ['w','i','th']), word('Mum', 'mum', ['m','u','m']),
      word('by', 'by', ['b','y']), tricky('the', 'the'),
      word('water.', 'water', ['w','or','t','er']),
      tricky('The', 'the'), word('monkey', 'monkey', ['m','o','n','k','ey']),
      tricky('was', 'was'), word('still', 'still', ['s','t','i','ll']),
      word('munching.', 'munching', ['m','u','n','ch','i','ng']),
      word('"Wow!"', 'wow', ['w','ow']), tricky('said', 'said'),
      tricky('the', 'the'), word('boy', 'boy', ['b','oy']),
      word('with', 'with', ['w','i','th']), tricky('a', 'a'),
      word('grin.', 'grin', ['g','r','i','n']),
      word('"This', 'this', ['th','i','s']), tricky('is', 'is'),
      tricky('the', 'the'), word('best', 'best', ['b','e','s','t']),
      word('day!"', 'day', ['d','ay']),
    ],
    imageUrl: '/illustrations/4_4/page8.png',
  },

  // ── QUIZ ──
  {
    type: 'quiz',
    questions: [
      { question: 'What did the monkey take from the boy?',
        options: [{ label: 'His snack', isCorrect: true }, { label: 'His hat', isCorrect: false }, { label: 'His bag', isCorrect: false }] },
      { question: 'Why do you think the monkey took the snack?',
        options: [{ label: 'It was hungry', isCorrect: true }, { label: 'It was playing', isCorrect: false }, { label: 'Someone told it to', isCorrect: false }] },
      { question: "What does 'cheeky' mean?",
        options: [{ label: 'Naughty and fun', isCorrect: true }, { label: 'Scared and shy', isCorrect: false }, { label: 'Big and strong', isCorrect: false }] },
    ],
  },

  // ── WORD READING ──
  { type: 'word_reading', words: [
    word('stare', 'stare', ['s','t','are']),
    word('turn', 'turn', ['t','ur','n']),
    word('true', 'true', ['t','r','ue']),
    word('glow', 'glow', ['g','l','ow']),
    word('brown', 'brown', ['b','r','ow','n']),
    word('new', 'new', ['n','ew']),
  ] },

  // ── TRICKY WORDS ──
  { type: 'tricky_words', words: [
    tricky('said', 'said'), tricky('was', 'was'), tricky('the', 'the'),
    tricky('to', 'to'), tricky('I', 'I'), tricky('her', 'her'),
    tricky('you', 'you'), tricky('where', 'where'),
  ] },

  // ── NONSENSE WORDS ──
  { type: 'nonsense_words', words: [
    word('frow', 'frow', ['f','r','ow']),
    word('plew', 'plew', ['p','l','ew']),
    word('grue', 'grue', ['g','r','ue']),
    word('blare', 'blare', ['b','l','are']),
    word('chur', 'chur', ['ch','ur']),
    word('frur', 'frur', ['f','r','ur']),
    word('stue', 'stue', ['s','t','ue']),
    word('snew', 'snew', ['s','n','ew']),
    word('trow', 'trow', ['t','r','ow']),
    word('fler', 'fler', ['f','l','er']),
  ] },

  // ── SPELLING ���─
  { type: 'spelling', words: [
    { word: 'brown', imageUrl: '/images/words/brown.png', letters: ['b','r','ow','n'] },
    { word: 'new', imageUrl: '/images/words/new.png', letters: ['n','ew'] },
    { word: 'true', imageUrl: '/images/words/true.png', letters: ['t','r','ue'] },
    { word: 'furry', imageUrl: '/images/words/furry.png', letters: ['f','ur','r','y'] },
  ] },

  // ── WRITING PRACTICE ──
  { type: 'writing_practice', letters: ['ow', 'ew', 'ue', 'ur', 'are'] },

  // ── STORY ORDERING ─��
  { type: 'story_ordering', items: [
    { imageUrl: '/illustrations/4_4/page1.png', label: 'The big pink mosque!', correctIndex: 0 },
    { imageUrl: '/illustrations/4_4/page2.png', label: 'Blue lake, so grand.', correctIndex: 1 },
    { imageUrl: '/illustrations/4_4/page3.png', label: 'A brown furry monkey!', correctIndex: 2 },
    { imageUrl: '/illustrations/4_4/page4.png', label: 'The monkey ran off!', correctIndex: 3 },
    { imageUrl: '/illustrations/4_4/page6.png', label: 'Monkey sat and munched.', correctIndex: 4 },
    { imageUrl: '/illustrations/4_4/page8.png', label: 'The best day!', correctIndex: 5 },
  ] },

  // ── DRAWING ──
  { type: 'drawing', prompt: 'Draw Your Favourite Part' },

  // ── CERTIFICATE ──
  { type: 'certificate', bookTitle: 'The Cheeky Monkey' },
];
