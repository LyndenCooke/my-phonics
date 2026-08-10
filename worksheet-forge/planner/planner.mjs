// ---------------------------------------------------------------------------
// Planner — natural-language prompt -> WorksheetSpec.
// Deterministic core (always works offline): parse level / target sound /
// activity intent, compose blocks to a height budget, fill content from the
// curriculum word banks with the decodability guard. Optional Gemini layer
// adds creative titles + sentence content — every AI word re-validated, and
// anything that fails decodability is silently replaced.
// ---------------------------------------------------------------------------
import {
  GRAPHEMES, levelKey, newGraphemes, cumulativeGraphemes, trickyWords,
  pickWords, pickPictureWords, alienWords, segmentWord, segmentPhonemes, sentenceViolations,
  isAllowed, containsGrapheme, realWordSet, rng, shuffle, hasClipart, wordBank,
  NOUNS, isBannedShape,
} from '../content/content.mjs';
import { CATALOG } from '../blocks/blocks.mjs';
import { geminiJSON } from './llm.mjs';
import { composeRecipe } from './compose.mjs';
import { ensureClipart } from '../content/artgen.mjs';

// Height budget: 297 − 16 margins − 24 header − 8 namebar − 8 footer − gaps
// leaves ~226mm. We deliberately compose a little OVER that (estimates run
// hot/cold per block) and let renderFitted trim items until the page fits —
// full pages beat safe pages.
const BLOCK_BUDGET = 268;
const FILL_TARGET = 240;

// ---------------------------------------------------------------------------
// Prompt parsing
// ---------------------------------------------------------------------------
const INTENTS = [
  [/word ?search/, 'wordsearch'],
  [/crack|decode|secret|\bcode\b/, 'code'],
  [/board ?game|race|track/, 'game'],
  // Bingo retired 2026-07-24 (Lynden): the caller list and the child's card
  // sit on the same sheet, so the child can see every word before it's called
  // — the game doesn't work on a single page. Asking for bingo now gets the
  // board game instead.
  [/bingo/, 'game'],
  [/assess|check|test|screening|psc/, 'assess'],
  [/handwrit|trace|formation|letter format/, 'handwriting'],
  [/segment|sound box|elkonin|phoneme frame/, 'segmenting'],
  [/sentence|comprehension|cloze|read and answer/, 'sentences'],
  [/draw/, 'draw'],
  [/alien|nonsense|real or/, 'alien'],
  [/fluen|speed|roll/, 'fluency'],
  [/spell|best bet|choice/, 'spelling'],
  // Last — "sort" also appears in "real or alien sort" phrasings, which the
  // /alien/ pattern above must win first.
  [/cut and stick|sort/, 'sorting'],
];

export function parsePrompt(prompt) {
  const p = prompt.toLowerCase();
  const out = { level: null, grapheme: null, intent: null, count: 1, theme: null };

  const lm = p.match(/\b(?:level|l)\s*([1-8])\b/) ?? p.match(/\bl([1-8])\b/);
  if (lm) out.level = parseInt(lm[1], 10);

  // target sound: quoted ('sh', "ay"), or "sound sh" / "the sh sound"
  const sm = p.match(/['"‘“]([a-z]{1,5}(?:-e)?)['"’”]/) ?? p.match(/\bsounds?\s+([a-z]{1,5}(?:-e)?)\b/) ?? p.match(/\b([a-z]{1,5}(?:-e)?)\s+sounds?\b/);
  if (sm && ['and', 'with', 'for', 'the'].includes(sm[1])) sm[1] = null;
  if (sm && sm[1] !== 'the') out.grapheme = sm[1];

  // Bare "for sh" / "of ay" — how people naturally type it on the web page.
  // Only accept a candidate the curriculum actually teaches, and never a
  // single letter mid-sentence ("for a level 2 child" must not target 'a').
  if (!out.grapheme) {
    const fm = p.match(/\b(?:for|of|on)\s+([a-z]{1,4}(?:-e)?)\b/);
    if (fm) {
      const cand = fm[1];
      const rest = p.slice(fm.index + fm[0].length);
      const singleLetterMidSentence = cand.length === 1 && rest.trim().length > 0;
      if (!singleLetterMidSentence && levelForGrapheme(cand)) out.grapheme = cand;
    }
  }

  for (const [re, intent] of INTENTS) if (re.test(p)) { out.intent = intent; break; }

  const cm = p.match(/\b(?:pack|set|series) of (\d+)|(\d+)\s+(?:worksheets|sheets|pages)\b/);
  if (cm) out.count = Math.min(12, parseInt(cm[1] ?? cm[2], 10));

  const tm = p.match(/\b(pirate|space|jungle|ocean|dinosaur|farm|castle|superhero|minibeast|seaside)s?\b/);
  if (tm) out.theme = tm[1];
  return out;
}

/** Choose a level that actually teaches the grapheme (first level where new). */
export function levelForGrapheme(g) {
  for (let l = 1; l <= 8; l++) if (newGraphemes(l).includes(g)) return l;
  for (let l = 1; l <= 8; l++) if (cumulativeGraphemes(l).includes(g)) return l;
  return null;
}

// ---------------------------------------------------------------------------
// Sentence machinery — template frames validated word-by-word at the level.
// ---------------------------------------------------------------------------
// kind: 'animate' frames need a living thing; 'thing' frames need an object;
// 'any' takes both. Keeps "The stew can run" off the page.
const FRAMES = [
  { t: 'I can see a ___.', kind: 'any' },
  { t: 'It is a big ___.', kind: 'any' },
  { t: 'Dad has a ___.', kind: 'thing' },
  { t: 'Mum and I got a ___.', kind: 'thing' },
  { t: 'The ___ is on the mat.', kind: 'thing' },
  { t: 'The ___ can run.', kind: 'animate' },
  { t: 'A ___ sat in the sun.', kind: 'animate' },
  { t: 'Look at the ___!', kind: 'any' },
  { t: 'The ___ is in the shed.', kind: 'thing' },
  { t: 'We went to see the ___.', kind: 'any' },
  { t: 'The ___ is wet.', kind: 'any' },
  { t: 'I like the red ___.', kind: 'thing' },
  { t: 'The ___ can hop and run.', kind: 'animate' },
  { t: 'The ___ is up on the hill.', kind: 'any' },
  // Longer frames — only survive validation at upper levels.
  { t: 'We saw a ___ down at the farm.', kind: 'any' },
  { t: 'A ___ can be a good pet.', kind: 'animate' },
  { t: 'It was fun to see the ___.', kind: 'any' },
  { t: 'The ___ made us all jump!', kind: 'any' },
  { t: 'My ___ is the best in town.', kind: 'thing' },
  { t: 'We took the ___ on the coach.', kind: 'thing' },
];

const ANIMATE = new Set([
  'ant', 'bat', 'bee', 'bird', 'bug', 'cat', 'chick', 'cow', 'crab', 'dad', 'deer', 'dog', 'duck', 'elf',
  'fox', 'frog', 'goat', 'gull', 'hen', 'kid', 'king', 'lamb', 'man', 'moth', 'mum', 'newt', 'nurse',
  'owl', 'pig', 'pup', 'ram', 'rat', 'seal', 'shark', 'sheep', 'snail', 'toad', 'vet', 'worm', 'clown',
]);
const YESNO = [
  'Can a cat sip milk?', 'Can a fish hop?', 'Is the sun hot?', 'Can a dog sing a song?',
  'Can you fit a ship in a cup?', 'Is a rock soft?', 'Can a hen dig?', 'Do bugs buzz?',
  'Can a crab clap?', 'Is jam for the bath?', 'Can a frog swim?', 'Do sheep sleep in beds?',
  'Can a moth lift a log?', 'Is snow hot?', 'Can you see the moon at night?', 'Do cows moo?',
  'Can a television swim?', 'Is a mansion bigger than a hut?', 'Can an explosion be quiet?',
  'Can you keep a shark in the bath?', 'Is it a good decision to sleep in class?',
];

function validFrames(level, pool) {
  return pool.filter((f) => {
    const t = typeof f === 'string' ? f : f.t;
    return sentenceViolations(t.replace('___', 'x'), level).filter((w) => w !== 'x').length === 0;
  });
}
const frameFits = (frame, word) =>
  frame.kind === 'any' || (frame.kind === 'animate') === ANIMATE.has(word);

function validSentences({ level, grapheme, rand, count }) {
  const frames = shuffle(validFrames(level, FRAMES), rand);
  // Gap words must be concrete nouns or the frames turn to nonsense
  // ("The gain is in the shed"). Prefer nouns on the target sound; fall back
  // to any decodable noun before giving up on the grapheme constraint.
  const nounPool = shuffle([...NOUNS], rand);
  let nouns = pickWords({ level, grapheme, count: count * 2, rand, prefer: nounPool }).filter((w) => NOUNS.has(w));
  if (nouns.length < count) {
    const extra = pickWords({ level, count: count * 2, rand, prefer: nounPool, exclude: nouns }).filter((w) => NOUNS.has(w));
    nouns = [...nouns, ...extra];
  }
  const out = [];
  const usedWords = new Set();
  for (const frame of frames) {
    if (out.length >= count) break;
    const w = nouns.find((n) => !usedWords.has(n) && frameFits(frame, n));
    if (!w) continue;
    const s = frame.t.replace('___', w);
    if (sentenceViolations(s, level).length === 0) {
      out.push({ sentence: s, word: w });
      usedWords.add(w);
    }
  }
  return out;
}

// Alternative-spelling map for best_bet distractors (upper levels).
const ALT_SPELLINGS = {
  ai: ['ay', 'a-e'], ay: ['ai', 'a-e'], 'a-e': ['ai', 'ay'],
  ee: ['ea', 'e-e'], ea: ['ee', 'e-e'],
  igh: ['i-e', 'ie', 'y'], 'i-e': ['igh', 'ie', 'y'], ie: ['igh', 'i-e'],
  oa: ['o-e', 'ow'], 'o-e': ['oa', 'ow'], ow: ['oa', 'o-e'],
  oo: ['u-e', 'ew'], 'u-e': ['oo', 'ew'],
  or: ['aw', 'au'], aw: ['or', 'au'],
  ur: ['ir', 'er'], ir: ['ur', 'er'], er: ['ur', 'ir'],
  oi: ['oy'], oy: ['oi'],
  // Suffix endings (L7-8): the classic "shun" confusion set.
  tion: ['sion', 'shun'], sion: ['tion', 'shun'],
  ous: ['us', 'ouse'], able: ['ible', 'abul'], ible: ['able', 'ibul'],
  cious: ['tious', 'shus'], tious: ['cious', 'shus'],
};
const RULES = {
  ay: 'ay likes the END of a word', ai: 'ai likes the MIDDLE of a word',
  oy: 'oy likes the END of a word', oi: 'oi likes the MIDDLE of a word',
  ow: 'ow often ends a word', 'a-e': 'the magic e makes the a say its name',
  'i-e': 'the magic e makes the i say its name', 'o-e': 'the magic e makes the o say its name',
};

// Real English words the word banks don't know about — a misspelling that
// lands on one of these (pain -> pane) would make "circle the real spelling"
// have two right answers.
const REAL_HOMOPHONES = new Set([
  'pane', 'mane', 'made', 'maid', 'male', 'mail', 'tale', 'tail', 'sale', 'sail',
  'wane', 'lane', 'cane', 'bale', 'bail', 'pale', 'pail', 'gale', 'main', 'wail',
  'whale', 'waste', 'waist', 'plane', 'plain', 'grate', 'great', 'steak', 'stake',
  'week', 'weak', 'meet', 'meat', 'see', 'sea', 'been', 'bean', 'road', 'rode',
  'rowed', 'sole', 'soul', 'hole', 'whole', 'toe', 'tow', 'blue', 'blew', 'threw',
  'through', 'buy', 'by', 'bye', 'higher', 'hire', 'night', 'knight', 'right', 'write',
]);

function misspell(word, grapheme, alt) {
  if (alt.includes('-')) return null; // split-digraph fakes too often land on real words
  let wrong = null;
  if (grapheme.includes('-')) {
    // a-e target -> replace the split pattern aXe with e.g. aiX / ayX
    const m = word.match(new RegExp(`${grapheme[0]}([bcdfghjklmnpqrstvwxz])e`));
    if (m) wrong = word.replace(m[0], alt + m[1]);
  } else {
    wrong = word.replace(grapheme, alt);
  }
  if (!wrong || wrong === word || REAL_HOMOPHONES.has(wrong) || realWordSet().has(wrong)) return null;
  return wrong;
}

// ---------------------------------------------------------------------------
// Block content builders
// ---------------------------------------------------------------------------
const builders = {
  trace_letters: ({ grapheme }) => ({ type: 'trace_letters', grapheme }),

  trace_words: ({ level, grapheme, rand, n = 3 }) => {
    // Art-strict: every row shows its picture cue or the row doesn't exist.
    const words = pickPictureWords({ level, grapheme, count: n, rand });
    return { type: 'trace_words', words };
  },

  missing_grapheme: ({ level, grapheme, rand }) => {
    // Art-strict: the picture IS the word cue — an empty card breaks the task.
    const words = pickPictureWords({ level, grapheme, count: 4, rand });
    const items = words.slice(0, 4).map((word) => {
      let gap = grapheme && containsGrapheme(word, grapheme) && !grapheme.includes('-') ? grapheme : null;
      if (!gap) {
        const seg = segmentWord(word, cumulativeGraphemes(level)) ?? [word[0]];
        gap = seg.filter((g) => !g.includes('-'))[Math.floor(rand() * seg.filter((g) => !g.includes('-')).length)] ?? word[0];
      }
      return { word, gap };
    });
    return { type: 'missing_grapheme', items, gapLabel: grapheme ? `sound ${grapheme}` : 'sound' };
  },

  phoneme_frames: ({ level, grapheme, rand }) => {
    // Picture-prompted: every row NEEDS clipart (the image is the word cue) —
    // a blank image slot makes the task impossible, so never pad with art-less
    // words; the planner drops/rebuilds the block instead.
    const candidates = pickPictureWords({ level, grapheme, count: 12, rand });
    const words = candidates.filter((w) => {
      const seg = segmentPhonemes(w, cumulativeGraphemes(level));
      return seg && seg.length >= 2 && seg.length <= 5 && !seg.some((g) => g.includes('-'));
    }).slice(0, 3);
    return { type: 'phoneme_frames', words };
  },

  read_and_tick: ({ level, grapheme, rand }) => {
    const words = pickPictureWords({ level, grapheme, count: 3, rand });
    const real = realWordSet();
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    const items = words.map((word) => {
      const distractors = [];
      for (const v of shuffle(vowels, rand)) {
        if (distractors.length >= 2) break;
        const m = word.replace(/[aeiou]/, v);
        if (m !== word && !distractors.includes(m) && m.length === word.length
            && isAllowed(m, level) && !isBannedShape(m)) {
          distractors.push(m);
        }
      }
      while (distractors.length < 2) {
        const alt = pickWords({ level, count: 1, rand, exclude: [word, ...distractors] })[0];
        if (!alt) break;
        distractors.push(alt);
      }
      return { word, options: shuffle([word, ...distractors.slice(0, 2)], rand) };
    });
    return { type: 'read_and_tick', items };
  },

  match_word_picture: ({ level, grapheme, rand, n = 4 }) => {
    const words = pickPictureWords({ level, grapheme, count: n, rand });
    let scrambled = shuffle(words, rand);
    if (words.length > 1 && scrambled.every((w, i) => w === words[i])) scrambled = [...words.slice(1), words[0]];
    return { type: 'match_word_picture', words, scrambled };
  },

  real_alien_sort: ({ level, grapheme, rand, n = 6 }) => {
    const realN = Math.ceil(n / 2);
    const reals = pickWords({ level, grapheme, count: realN, rand });
    const aliens = alienWords({ level, grapheme: grapheme && !grapheme.includes('-') ? grapheme : null, count: n - realN, rand });
    const words = shuffle([
      ...reals.map((w) => ({ word: w, alien: false })),
      ...aliens.map((w) => ({ word: w, alien: true })),
    ], rand);
    return { type: 'real_alien_sort', words };
  },

  roll_and_read: ({ level, grapheme, rand }) => {
    const words = pickWords({ level, grapheme, count: 24, rand });
    while (words.length < 24) words.push(...words.slice(0, 24 - words.length));
    const columns = Array.from({ length: 6 }, (_, c) => words.slice(c * 4, c * 4 + 4));
    return { type: 'roll_and_read', columns };
  },

  speed_read: ({ level, grapheme, rand, n = 12 }) => (
    { type: 'speed_read', words: pickWords({ level, grapheme, count: n, rand }) }),

  cloze_sentences: ({ level, grapheme, rand }) => {
    const picked = validSentences({ level, grapheme, rand, count: 3 });
    const bank = shuffle(picked.map((p) => p.word), rand);
    return {
      type: 'cloze_sentences',
      bank,
      sentences: picked.map((p) => p.sentence.replace(p.word, '____')),
    };
  },

  sentence_unjumble: ({ level, grapheme, rand }) => {
    const picked = validSentences({ level, grapheme, rand, count: 2 });
    return {
      type: 'sentence_unjumble',
      sentences: picked.map((p) => {
        const tokens = p.sentence.split(' ');
        let j = shuffle(tokens, rand);
        if (j.join(' ') === tokens.join(' ')) j = [...tokens.slice(1), tokens[0]];
        return { jumbled: j, answer: p.sentence };
      }),
    };
  },

  read_draw_write: ({ level, grapheme, rand }) => {
    const s = validSentences({ level, grapheme, rand, count: 1 })[0];
    return { type: 'read_draw_write', sentence: s?.sentence ?? 'I can see a cat.', twoLines: level >= 3 };
  },

  yes_no_questions: ({ level, rand, n = 5 }) => (
    { type: 'yes_no_questions', questions: shuffle(validFrames(level, YESNO), rand).slice(0, n) }),

  dictation: ({ level, grapheme, rand }) => {
    const items = level <= 2
      ? pickWords({ level, grapheme, count: 3, rand })
      : validSentences({ level, grapheme, rand, count: 3 }).map((p) => p.sentence);
    return { type: 'dictation', items };
  },

  board_game: ({ level, grapheme, rand }) => {
    const words = pickWords({ level, grapheme, count: 13, rand });
    // Aliens must carry the target grapheme too — an off-sound nonsense word
    // is just drift with extra steps.
    const aliens = alienWords({ level, grapheme: grapheme && !grapheme.includes('-') ? grapheme : null, count: 2, rand });
    const cells = shuffle([...words, ...aliens], rand).slice(0, 13);
    const events = {};
    const evCells = shuffle(cells.slice(2, 11), rand);
    if (evCells[0]) events[evCells[0]] = 'again';
    if (evCells[1]) events[evCells[1]] = 'miss';
    // Which cells survived the slice are alien — the block badges them.
    return { type: 'board_game', words: cells, events, aliens: cells.filter((w) => aliens.includes(w)) };
  },

  bingo: ({ level, grapheme, rand }) => {
    const words = pickWords({ level, grapheme, count: 12, rand });
    const gridWords = words.slice(0, 8);
    const grid = [...gridWords.slice(0, 4), '★', ...gridWords.slice(4, 8)];
    return { type: 'bingo', size: 3, grid, caller: shuffle(words, rand) };
  },

  sound_button_markup: ({ level, grapheme, rand, n = 4 }) => {
    const words = pickWords({ level, grapheme, count: n * 2, rand }).filter((w) => {
      const s = segmentPhonemes(w, cumulativeGraphemes(level));
      return s && !s.some((g) => g.includes('-'));
    }).slice(0, n);
    return { type: 'sound_button_markup', words };
  },

  best_bet: ({ level, grapheme, rand }) => {
    const g = grapheme && ALT_SPELLINGS[grapheme] ? grapheme : Object.keys(ALT_SPELLINGS).find((k) => cumulativeGraphemes(level).includes(k));
    const words = pickWords({ level, grapheme: g, count: 8, rand });
    const items = words.map((word) => {
      const wrongs = ALT_SPELLINGS[g].map((alt) => misspell(word, g, alt)).filter(Boolean);
      if (wrongs.length < 2 && !g.includes('-')) {
        // Transposed digraph ("fial" for fail) — the classic careless spelling.
        const swapped = word.replace(g, g[1] + g[0]);
        if (swapped !== word && !realWordSet().has(swapped) && !wrongs.includes(swapped)) wrongs.push(swapped);
      }
      if (!wrongs.length) return null;
      const options = shuffle([word, ...wrongs.slice(0, 2)], rand);
      return { options, answer: word };
    }).filter(Boolean).slice(0, 4);
    return { type: 'best_bet', items, rule: RULES[g] ?? null };
  },

  odd_one_out: ({ level, grapheme, rand, n = 4 }) => {
    const rows = [];
    for (let i = 0; i < n; i++) {
      const withG = pickWords({ level, grapheme, count: 3, rand, exclude: rows.flat() });
      const without = pickWords({ level, count: 6, rand, exclude: rows.flat() })
        .filter((w) => !grapheme || !containsGrapheme(w, grapheme))[0];
      if (withG.length === 3 && without) rows.push(shuffle([...withG, without], rand));
    }
    return { type: 'odd_one_out', rows };
  },

  picture_write: ({ level, grapheme, rand, n = 6 }) => {
    const half = Math.ceil(n / 2);
    const withG = pickPictureWords({ level, grapheme, count: half, rand });
    const withoutG = pickPictureWords({ level, count: half + 6, rand })
      .filter((w) => (!grapheme || !containsGrapheme(w, grapheme)) && !withG.includes(w)).slice(0, n - withG.length);
    return { type: 'picture_write', words: shuffle([...withG, ...withoutG], rand), grapheme };
  },

  word_search: ({ level, grapheme, rand }) => {
    const words = pickWords({ level, grapheme, count: 8, rand })
      .filter((w) => w.length >= 3 && w.length <= 8).slice(0, 6);
    const rows = 8, cols = 11;
    const grid = Array.from({ length: rows }, () => Array(cols).fill(null));
    const placed = [];
    for (const w of words) {
      for (let t = 0; t < 80; t++) {
        const horiz = rand() < 0.55;
        const r = Math.floor(rand() * (horiz ? rows : rows - w.length + 1));
        const c = Math.floor(rand() * (horiz ? cols - w.length + 1 : cols));
        let ok = true;
        for (let i = 0; i < w.length && ok; i++) {
          const cell = grid[horiz ? r : r + i][horiz ? c + i : c];
          if (cell && cell !== w[i]) ok = false;
        }
        if (!ok) continue;
        for (let i = 0; i < w.length; i++) grid[horiz ? r : r + i][horiz ? c + i : c] = w[i];
        placed.push(w);
        break;
      }
    }
    // Fill gaps from the placed words' own letters (stays level-friendly) and
    // re-roll if any row/column accidentally spells something rude.
    const pool = [...new Set(placed.join(''))];
    for (let attempt = 0; attempt < 20 && pool.length; attempt++) {
      const full = grid.map((row) => row.map((ch) => ch ?? pool[Math.floor(rand() * pool.length)]));
      const lines = [
        ...full.map((row) => row.join('')),
        ...Array.from({ length: cols }, (_, c) => full.map((row) => row[c]).join('')),
      ];
      const rude = lines.some((s) => {
        for (let len = 3; len <= 6; len++)
          for (let i = 0; i + len <= s.length; i++) {
            const sub = s.slice(i, i + len);
            if (!placed.includes(sub) && isBannedShape(sub)) return true;
          }
        return false;
      });
      if (!rude) return { type: 'word_search', grid: full, words: placed };
    }
    return { type: 'word_search', grid: [], words: [] };
  },

  crack_the_code: ({ level, grapheme, rand }) => {
    const SYMBOLS = ['★', '●', '▲', '■', '◆', '♥', '☀', '☂', '♪', '☾', '✚', '✿', '☁', '✦', '⬟', '⚑'];
    let words = pickWords({ level, grapheme, count: 4, rand }).filter((w) => w.length <= 6);
    let letters = [...new Set(words.join(''))].sort();
    while (letters.length > SYMBOLS.length && words.length > 3) {
      words = words.slice(0, -1);
      letters = [...new Set(words.join(''))].sort();
    }
    const syms = shuffle([...SYMBOLS], rand);
    const map = Object.fromEntries(letters.map((l, i) => [l, syms[i]]));
    return {
      type: 'crack_the_code',
      key: letters.map((l) => [l, map[l]]),
      items: words.map((w) => ({ word: w, symbols: [...w].map((ch) => map[ch]) })),
    };
  },

  sound_sort: ({ level, grapheme, rand }) => {
    const yes = pickWords({ level, grapheme, count: 4, rand });
    const no = pickWords({ level, count: 12, rand, exclude: yes })
      .filter((w) => !grapheme || !containsGrapheme(w, grapheme)).slice(0, 4);
    return { type: 'sound_sort', grapheme, cards: shuffle([...yes, ...no], rand), answers: { yes, no } };
  },
};

export function buildBlock(type, opts) {
  const b = builders[type];
  if (!b) throw new Error(`No builder for block "${type}"`);
  return b(opts);
}

// ---------------------------------------------------------------------------
// Recipes — block line-ups per intent, trimmed to the height budget.
// ---------------------------------------------------------------------------
const RECIPES = {
  handwriting: ['trace_letters', 'trace_words', 'missing_grapheme'],
  segmenting: ['phoneme_frames', 'missing_grapheme', 'dictation'],
  game: ['board_game', 'speed_read'],
  assess: ['real_alien_sort', 'speed_read', 'dictation'],
  sentences: ['cloze_sentences', 'sentence_unjumble', 'yes_no_questions'],
  draw: ['trace_words', 'read_draw_write'],
  alien: ['real_alien_sort', 'sound_button_markup', 'roll_and_read'],
  fluency: ['roll_and_read', 'speed_read', 'real_alien_sort'],
  spelling: ['best_bet', 'cloze_sentences', 'dictation'],
  wordsearch: ['word_search', 'crack_the_code', 'speed_read'],
  code: ['crack_the_code', 'speed_read', 'dictation'],
  sorting: ['sound_sort', 'dictation'],
};

function defaultRecipe(level) {
  if (level <= 2) return ['trace_letters', 'trace_words', 'missing_grapheme'];
  if (level <= 4) return ['phoneme_frames', 'read_and_tick', 'real_alien_sort'];
  if (level <= 6) return ['speed_read', 'cloze_sentences', 'real_alien_sort'];
  return ['best_bet', 'cloze_sentences', 'sentence_unjumble', 'yes_no_questions'];
}

/** Minimum content per block type — an empty panel must never render. */
export function blockHasContent(b) {
  switch (b.type) {
    case 'trace_letters': return !!b.grapheme;
    case 'trace_words': return (b.words?.length ?? 0) >= 2;
    case 'missing_grapheme': return (b.items?.length ?? 0) >= 3;
    case 'phoneme_frames': return (b.words?.length ?? 0) >= 2;
    case 'read_and_tick': return (b.items?.length ?? 0) >= 2 && b.items.every((i) => i.options?.length >= 2);
    case 'match_word_picture': return (b.words?.length ?? 0) >= 3;
    case 'real_alien_sort': return (b.words?.length ?? 0) >= 4;
    case 'roll_and_read': return (b.columns?.length ?? 0) === 6 && b.columns.every((c) => c.filter(Boolean).length >= 3);
    case 'speed_read': return (b.words?.length ?? 0) >= 8;
    case 'cloze_sentences': return (b.sentences?.length ?? 0) >= 2 && (b.bank?.length ?? 0) >= 2;
    case 'sentence_unjumble': return (b.sentences?.length ?? 0) >= 1;
    case 'read_draw_write': return !!b.sentence;
    case 'yes_no_questions': return (b.questions?.length ?? 0) >= 3;
    case 'dictation': return (b.items?.length ?? 0) >= 2;
    case 'board_game': return (b.words?.length ?? 0) >= 10;
    case 'bingo': return (b.grid?.length ?? 0) === 9 && (b.caller?.length ?? 0) >= 8;
    case 'picture_write': return (b.words?.length ?? 0) >= 3;
    case 'word_search': return (b.grid?.length ?? 0) >= 6 && (b.words?.length ?? 0) >= 4;
    case 'crack_the_code': return (b.items?.length ?? 0) >= 3 && (b.key?.length ?? 0) >= 5;
    case 'sound_sort': return !!b.grapheme && (b.cards?.length ?? 0) >= 6;
    case 'sound_button_markup': return (b.words?.length ?? 0) >= 3;
    case 'best_bet': return (b.items?.length ?? 0) >= 3;
    case 'odd_one_out': return (b.rows?.length ?? 0) >= 3;
    // Generic layouts — content comes from outside, so just check it arrived.
    case 'prompt_grid': return (b.items?.length ?? 0) >= 2;
    case 'question_rows': return (b.items?.length ?? 0) >= 2;
    case 'match_columns': return (b.pairs?.length ?? b.left?.length ?? 0) >= 2;
    case 'fill_table': return (b.rows?.length ?? 0) >= 2;
    default: return true;
  }
}

function estimate(block) {
  const c = CATALOG[block.type];
  if (!c) return 40;
  const items = block.items?.length ?? block.words?.length ?? block.sentences?.length ?? block.questions?.length ?? block.rows?.length ?? null;
  return c.perItem && items ? c.approxH + c.perItem * items : c.approxH;
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------------------------------------------------------------------------
// The public API
// ---------------------------------------------------------------------------
/** Validate/complete the level + grapheme pair (shared by prompt + image paths). */
function resolveTarget({ level, grapheme, seed }) {
  if (!level && grapheme) level = levelForGrapheme(grapheme) ?? 2;
  if (!level) level = 2;
  if (grapheme && !cumulativeGraphemes(level).includes(grapheme) && !newGraphemes(level).includes(grapheme)) {
    const l2 = levelForGrapheme(grapheme);
    if (l2) level = Math.max(level, l2);
    else grapheme = null; // unknown grapheme — drop rather than mislead
  }
  const wordCount = (g) => {
    let n = 0;
    for (let l = 1; l <= level; l++) for (const w of wordBank(l).words) if (containsGrapheme(w, g)) n++;
    return n;
  };
  if (!grapheme) {
    // Prefer a freshly-taught grapheme that actually has enough words to fill
    // a sheet; otherwise the best-stocked cumulative grapheme.
    const fresh = shuffle(newGraphemes(level).filter((g) => wordCount(g) >= 10), rng(seed));
    grapheme = fresh[0]
      ?? [...cumulativeGraphemes(level)].sort((a, b) => wordCount(b) - wordCount(a))[0];
  } else if (wordCount(grapheme) < 4) {
    console.warn(`  note: very few "${grapheme}" words at L${level} — sheet may lean on other sounds`);
  }
  return { level, grapheme };
}

/** Compose a page: build the named blocks, then top up with fillers. */
function composeBlocks(recipeNames, { level, grapheme, seed, rand, strict = false, fillers = null }) {
  // Picture-led blocks only work when the target sound has enough clipart
  // (L1-L3 sounds are well covered; vowel digraphs mostly are not). Swap
  // art-hungry blocks for text-led equivalents rather than drifting off-sound.
  const artWords = pickPictureWords({ level, grapheme, count: 6, rand: rng(seed + 7) });
  const ART_SWAP = {
    phoneme_frames: 'sound_button_markup',
    read_and_tick: 'odd_one_out',
    match_word_picture: 'speed_read',
    trace_words: 'speed_read',
    missing_grapheme: 'cloze_sentences',
    picture_write: 'odd_one_out',
  };
  const artAware = artWords.length >= 3
    ? recipeNames
    : recipeNames.map((t) => ART_SWAP[t] ?? t);

  const filtered = [...new Set(artAware)].filter((t) => {
    // Generic layouts have no builder — they render content supplied from
    // outside (a subject engine or an explicit spec), so the phonics planner
    // must never try to compose one.
    if (CATALOG[t].generic) return false;
    const [lo, hi] = CATALOG[t].levels;
    return level >= lo && level <= hi;
  });
  const names = filtered.length ? filtered : defaultRecipe(level);

  const blocks = [];
  const squeezedOut = []; // asked for, but the budget ran out — try again later
  let used = 0;
  for (const t of names) {
    let block = buildBlock(t, { level, grapheme, rand });
    if (!blockHasContent(block)) {
      // Sparse grapheme — rebuild without the grapheme constraint before
      // giving up on the block entirely.
      block = buildBlock(t, { level, grapheme: null, rand });
      if (!blockHasContent(block)) continue;
    }
    const h = estimate(block);
    if (used + h > BLOCK_BUDGET && blocks.length) { squeezedOut.push(block); continue; }
    blocks.push(block);
    used += h;
  }

  // Under-full page reads as unfinished — top up with a compatible filler.
  // But when the line-up was composed for the request as written, a generic
  // filler can contradict it (a "hates writing" sheet does not want dictation
  // bolted on). In strict mode the page only ever tops up with blocks the
  // request itself asked for.
  // A composed page tops up only with the block the composer nominated for the
  // job (`fillers`), so the sheet stays true to what was asked for.
  const FILLERS = strict ? (fillers ?? []) : level <= 2
    ? ['missing_grapheme', 'dictation', 'odd_one_out']
    : ['dictation', 'odd_one_out', 'sound_button_markup', 'speed_read'];
  for (const t of FILLERS) {
    if (used >= FILL_TARGET) break;
    if (blocks.some((b) => b.type === t)) continue;
    const [lo, hi] = CATALOG[t].levels;
    if (level < lo || level > hi) continue;
    const block = buildBlock(t, { level, grapheme, rand });
    if (!blockHasContent(block)) continue;
    const h = estimate(block);
    if (used + h > BLOCK_BUDGET) continue;
    blocks.push(block);
    used += h;
  }

  // Spares: built but not placed. Height estimates run hot, and the renderer
  // can only trim — so a page can measure short once it's really laid out.
  // renderFitted appends one of these if the finished sheet has dead space.
  // Still short and nothing left to add? Then the blocks we DO have should be
  // bigger. Rebuild the trimmable ones with a larger item count and let the
  // render loop trim back to a full page — this is what makes a single-activity
  // sheet (a remake of a one-task worksheet) fill A4 with more cards rather
  // than stretching one panel over half a page of white.
  if (used < FILL_TARGET) {
    for (let i = 0; i < blocks.length && used < FILL_TARGET; i++) {
      const cat = CATALOG[blocks[i].type];
      const field = cat?.trim;
      if (!field || !cat.perItem) continue;
      const have = blocks[i][field]?.length ?? 0;
      if (!have) continue;
      const room = Math.floor((BLOCK_BUDGET - used) / cat.perItem);
      if (room < 1) continue;
      // Ceiling on growth: a block should fill its space, not become a wall of
      // tiny boxes. ~1.6x the natural count keeps a 6-card grid at 9 (3x3).
      const cap = cat.maxItems ?? Math.ceil(have * 1.6);
      let want = Math.min(have + room, cap);
      // Grid blocks grow by whole rows — a lone card on the last row reads as
      // a mistake.
      if (cat.perRow) want = Math.floor(want / cat.perRow) * cat.perRow;
      if (want <= have) continue;
      const grown = buildBlock(blocks[i].type, { level, grapheme, rand, n: want });
      const got = grown[field]?.length ?? 0;
      if (!blockHasContent(grown) || got <= have) continue; // word bank ran dry
      used += (got - have) * cat.perItem;
      blocks[i] = grown;
    }
  }

  // A block the request actually asked for beats a generic filler, so anything
  // the budget squeezed out gets first refusal on the leftover space.
  const spare = [...squeezedOut];
  for (const t of FILLERS) {
    if (spare.length >= 2) break;
    if (blocks.some((b) => b.type === t) || spare.some((b) => b.type === t)) continue;
    const [lo, hi] = CATALOG[t].levels;
    if (level < lo || level > hi) continue;
    const block = buildBlock(t, { level, grapheme, rand });
    if (blockHasContent(block)) spare.push(block);
  }
  return { blocks, spare };
}

export async function planFromPrompt(prompt, { seed = 42, ai = true } = {}) {
  const parsed = parsePrompt(prompt);
  const { intent, theme } = parsed;
  const { level, grapheme } = resolveTarget({ level: parsed.level, grapheme: parsed.grapheme, seed });

  const rand = rng(seed);
  const keywordRecipe = RECIPES[intent] ?? defaultRecipe(level);

  // "Build anything": with AI on, the composer reads the request as written and
  // may compose any line-up from the catalogue — the keyword recipe is only its
  // starting suggestion. It picks blocks, never content; if it returns nothing
  // usable we fall straight back to the deterministic recipe.
  let recipeNames = keywordRecipe;
  let composed = null;
  if (ai) {
    composed = await composeRecipe(prompt, { level, grapheme, suggestion: keywordRecipe, budget: FILL_TARGET });
    if (composed) {
      recipeNames = composed.blocks;
      console.log(`  composed: ${composed.blocks.join(' + ')}${composed.why ? `\n  ${composed.why}` : ''}`);
    }
  }
  const { blocks, spare } = composeBlocks(recipeNames, {
    level, grapheme, seed, rand,
    strict: !!composed,
    fillers: composed?.spare ? [composed.spare] : [],
  });

  const strand = composed?.strand
    ?? { handwriting: 'Handwriting', assess: 'Check-up', sentences: 'Sentences', spelling: 'Spelling', game: 'Phonics games', wordsearch: 'Phonics games', code: 'Phonics games', sorting: 'Sorting sounds' }[intent] ?? 'Phonics';
  const isSuffix = level >= 7 && grapheme.length >= 3 && (GRAPHEMES[levelKey(8)].suffixes ?? []).includes(grapheme);
  const spec = {
    title: isSuffix ? `Word endings: -${grapheme}` : `The Sound ${grapheme}`,
    subtitle: theme ? `${cap(theme)} phonics practice` : null,
    level, grapheme, strand, seed,
    slug: `L${level}-${grapheme.replace(/[^a-z]/g, '')}-${intent ?? 'mix'}-${seed}`,
    blocks, spare,
  };

  if (ai) await aiPolish(spec, prompt, parsed);
  return spec;
}

/**
 * Recreate-from-image path: a vision analysis (see vision.mjs) names the
 * closest catalogue blocks; we rebuild those activity TYPES with our own
 * decodable content — nothing from the uploaded sheet is copied.
 */
export async function planFromAnalysis(analysis, { seed = 42, ai = true } = {}) {
  const rawLevel = Number(analysis?.level);
  const rawGrapheme = typeof analysis?.grapheme === 'string'
    ? analysis.grapheme.toLowerCase().replace(/[^a-z-]/g, '') || null
    : null;
  const { level, grapheme } = resolveTarget({
    level: rawLevel >= 1 && rawLevel <= 8 ? Math.trunc(rawLevel) : null,
    grapheme: rawGrapheme,
    seed,
  });

  const rand = rng(seed);
  const wanted = (Array.isArray(analysis?.blocks) ? analysis.blocks : [])
    .filter((t) => typeof t === 'string' && CATALOG[t] && t !== 'bingo');
  const recipeNames = [...(wanted.length ? wanted : defaultRecipe(level))];

  // "Completely remake" promise: if the source sheet was picture-led, draw any
  // missing clipart for this sound now (house style, cached forever) instead
  // of letting composeBlocks art-swap to text-led equivalents.
  const PICTURE_BLOCKS = ['picture_write', 'trace_words', 'match_word_picture', 'read_and_tick', 'missing_grapheme', 'phoneme_frames'];
  // Early-years-only blocks the vision pass may name on an upper-level sheet
  // (our ledger can place the sound higher than the source's phase) — swap for
  // the all-level picture equivalent rather than losing the picture task.
  if (level >= 5) {
    const UP_SWAP = { trace_words: 'picture_write', match_word_picture: 'picture_write', read_and_tick: 'picture_write' };
    for (let i = 0; i < recipeNames.length; i++) {
      const cat = CATALOG[recipeNames[i]];
      if (cat && level > cat.levels[1] && UP_SWAP[recipeNames[i]]) recipeNames[i] = UP_SWAP[recipeNames[i]];
    }
  }
  if (recipeNames.some((t) => PICTURE_BLOCKS.includes(t))) {
    const candidates = pickWords({ level, grapheme, count: 12, rand: rng(seed + 3) });
    await ensureClipart(candidates, { limit: 6, log: (m) => console.log(`  art: ${m}`) });
  }

  // A remake matches the source's SHAPE: one activity in, one activity out.
  // Never top up with fillers or spares — a teacher who uploads a single-task
  // sheet is asking for that sheet in our house style, not a fuller one.
  const { blocks } = composeBlocks(recipeNames, { level, grapheme, seed, rand, strict: true });

  const spec = {
    title: `The Sound ${grapheme}`,
    subtitle: 'Made just for you',
    level, grapheme, strand: 'Phonics', seed,
    slug: `L${level}-${grapheme.replace(/[^a-z]/g, '')}-recreated-${seed}`,
    blocks, spare: [],
  };
  if (ai) await aiPolish(spec, `recreate this style of worksheet: ${analysis?.summary ?? ''}`, { theme: null });
  return spec;
}

/** Optional Gemini pass: better titles + themed sentences. All output re-validated. */
async function aiPolish(spec, prompt, parsed) {
  const tricky = trickyWords(spec.level).join(', ');
  const cum = cumulativeGraphemes(spec.level).join(' ');
  const ask = `You are a UK synthetic-phonics author (Letters & Sounds style, British English).
User request: "${prompt}"
Worksheet: Level ${spec.level}, target grapheme "${spec.grapheme}"${parsed.theme ? `, theme "${parsed.theme}"` : ''}.
STRICT DECODABILITY: every word in child-facing sentences must be built ONLY from these graphemes: ${cum}
…or be one of these tricky words: ${tricky}. No other words at all.
Return JSON: {"title": "short playful title (<=28 chars, may mention the sound ${spec.grapheme})",
"subtitle": "one warm line for the header (<=48 chars, no constraint)",
"sentences": ["3 short decodable sentences using words with '${spec.grapheme}'"],
"yesno": ["4 silly decodable yes/no questions"]}`;
  const out = await geminiJSON(ask);
  if (!out) return;

  if (typeof out.title === 'string' && out.title.trim() && out.title.length <= 40) spec.title = out.title.trim();
  if (typeof out.subtitle === 'string' && out.subtitle.trim() && out.subtitle.length <= 60) spec.subtitle = out.subtitle.trim();

  const goodSentences = (out.sentences ?? []).filter((s) => typeof s === 'string' && s.length < 70 && sentenceViolations(s, spec.level).length === 0);
  const goodYesNo = (out.yesno ?? []).filter((s) => typeof s === 'string' && s.length < 70 && sentenceViolations(s, spec.level).length === 0);

  for (const b of spec.blocks) {
    if (b.type === 'read_draw_write' && goodSentences[0]) b.sentence = goodSentences[0];
    if (b.type === 'dictation' && spec.level >= 3 && goodSentences.length >= 2) b.items = goodSentences.slice(0, 3);
    if (b.type === 'yes_no_questions' && goodYesNo.length >= 3) b.questions = goodYesNo.slice(0, 5);
  }
}
