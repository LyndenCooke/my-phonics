// ---------------------------------------------------------------------------
// Content engine — curriculum data, decodability, segmentation, word picking,
// alien-word generation and the clipart index.
// Canonical data lives in myphonics_books/data (JSON is canonical, never the
// xlsx). Words offered to a block ALWAYS pass the decodability guard.
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, ENGINE_PUBLIC, FORGE_ROOT } from '../design/tokens.mjs';

const DATA = path.join(REPO_ROOT, 'myphonics_books', 'data');
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf-8'));

export const GRAPHEMES = readJson(path.join(DATA, 'graphemes_by_level.json'));
export const TRICKY = readJson(path.join(DATA, 'tricky_words_by_level.json'));

const wordBankCache = {};
export function wordBank(level) {
  if (!wordBankCache[level]) {
    wordBankCache[level] = readJson(path.join(DATA, 'word_banks', `level_${level}_words.json`));
  }
  return wordBankCache[level];
}

export const levelKey = (level) => `level_${level}`;
export const cumulativeGraphemes = (level) => GRAPHEMES[levelKey(level)].cumulative_graphemes;
export const newGraphemes = (level) => GRAPHEMES[levelKey(level)].graphemes;
export const trickyWords = (level) => TRICKY[levelKey(level)].cumulative;

/** Every real word across all banks — the "is this a real word" oracle. */
let allRealWords;
export function realWordSet() {
  if (!allRealWords) {
    allRealWords = new Set();
    for (let l = 1; l <= 8; l++) for (const w of wordBank(l).words) allRealWords.add(w.toLowerCase());
  }
  return allRealWords;
}

const CONSONANT = '[bcdfghjklmnpqrstvwxz]';
const isSplit = (g) => /^[aeiou]-e$/.test(g);
const splitRegex = (g) => new RegExp(`${g[0]}${CONSONANT}e`);

/** Does `word` contain grapheme `g` (split digraphs supported)? */
export function containsGrapheme(word, g) {
  return isSplit(g) ? splitRegex(g).test(word) : word.includes(g);
}

/**
 * Phoneme-TRUE grapheme check: the word must actually SEGMENT with `g` as one
 * of its units at this level. Substring matching lies — "chair" contains the
 * letters 'ai' but reads ch-air, so it must never count as an 'ai' word.
 */
export function hasGraphemeUnit(word, g, level) {
  if (!containsGrapheme(word.toLowerCase(), g)) return false;
  const seg = segmentWord(word, cumulativeGraphemes(level));
  return seg ? seg.includes(g) : false;
}

/**
 * Greedy longest-match segmentation of a word into taught graphemes.
 * Returns an array of grapheme strings, or null if the word cannot be fully
 * segmented (=> not decodable with this grapheme set). Split digraphs are
 * returned as e.g. ['c','a-e','k'] for "cake".
 */
export function segmentWord(word, graphemes) {
  const w = word.toLowerCase();
  const plain = [...graphemes].filter((g) => !isSplit(g)).sort((a, b) => b.length - a.length);
  const splits = [...graphemes].filter(isSplit);

  // Handle one split digraph: mark the vowel + trailing e as consumed together.
  for (const sd of splits) {
    const m = w.match(new RegExp(`^(.*)${sd[0]}(${CONSONANT})e(.*)$`));
    if (m) {
      const [, pre, cons, post] = m;
      const preSeg = pre ? segmentWord(pre, graphemes) : [];
      const consSeg = segmentWord(cons, graphemes);
      const postSeg = post ? segmentWord(post, graphemes) : [];
      if (preSeg && consSeg && postSeg) return [...preSeg, sd, ...consSeg, ...postSeg];
    }
  }

  const memo = new Map();
  const go = (i) => {
    if (i === w.length) return [];
    if (memo.has(i)) return memo.get(i);
    for (const g of plain) {
      if (w.startsWith(g, i)) {
        const rest = go(i + g.length);
        if (rest) { const r = [g, ...rest]; memo.set(i, r); return r; }
      }
    }
    memo.set(i, null);
    return null;
  };
  return go(0);
}

/** Every multi-letter grapheme in the whole scheme (L8 cumulative). */
let multiGraphemes;
function allMultiGraphemes() {
  if (!multiGraphemes) {
    multiGraphemes = new Set(cumulativeGraphemes(8).filter((g) => g.length > 1 && !isSplit(g)));
  }
  return multiGraphemes;
}

/**
 * Decodable at level, or a taught tricky word.
 *
 * Naive segmentation alone is NOT enough for real words: "soap" segments as
 * s-o-a-p from L1 single letters, but 'oa' is one sound the child hasn't been
 * taught — the word is a trap, not practice. So after segmenting we reject a
 * word if any adjacent single-letter units combine into a KNOWN grapheme from
 * a later level (hidden digraph), or if it hides an untaught split digraph
 * ("cake" at L1).
 */
export function isAllowed(word, level) {
  const w = word.toLowerCase().replace(/[^a-z'-]/g, '');
  if (!w) return true;
  if (trickyWords(level).map((t) => t.toLowerCase()).includes(w)) return true;
  const cum = cumulativeGraphemes(level);
  const seg = segmentWord(w, cum);
  if (!seg) return false;

  // Hidden split digraph: vowel-consonant-e ending with that split untaught.
  const sd = w.match(new RegExp(`([aeiou])${CONSONANT}e$`));
  if (sd && !cum.includes(`${sd[1]}-e`) && !seg.includes(`${sd[1]}-e`)) return false;

  // Hidden digraph/trigraph across adjacent single-letter units.
  const multi = allMultiGraphemes();
  for (let i = 0; i < seg.length - 1; i++) {
    if (seg[i].length !== 1) continue;
    const pair = seg[i] + seg[i + 1];
    if (seg[i + 1].length === 1 && multi.has(pair) && !cum.includes(pair)) return false;
    const triple = seg[i + 2] && seg[i + 1].length === 1 && seg[i + 2].length === 1 ? pair + seg[i + 2] : null;
    if (triple && multi.has(triple) && !cum.includes(triple)) return false;
  }
  return true;
}

/**
 * Phoneme-true segmentation for sound boxes / sound buttons: like
 * segmentWord, but adjacent identical letters collapse into one unit
 * ("pass" -> p-a-ss, 3 sounds) even before the double grapheme is taught.
 */
export function segmentPhonemes(word, graphemes) {
  const seg = segmentWord(word, graphemes);
  if (!seg) return null;
  const out = [];
  for (const g of seg) {
    const prev = out[out.length - 1];
    if (prev && prev.length === 1 && g === prev) out[out.length - 1] = prev + g;
    else out.push(g);
  }
  return out;
}

/** Validate a sentence word-by-word; returns the offending words. */
export function sentenceViolations(sentence, level) {
  return sentence.split(/\s+/).map((t) => t.toLowerCase().replace(/[^a-z'-]/g, ''))
    .filter((w) => w && !isAllowed(w, level));
}

// Deterministic PRNG so a given seed reproduces a sheet exactly.
export function rng(seed = 42) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}
export const shuffle = (arr, rand) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Pick words at `level` containing grapheme `g` (or any word if g is null),
 * preferring the level's own bank then earlier banks. Every word re-checked
 * against the decodability guard.
 */
export function pickWords({ level, grapheme = null, count = 8, rand = rng(), prefer = null, exclude = [] }) {
  const seen = new Set(exclude.map((w) => w.toLowerCase()));
  const out = [];
  const take = (words, keepOrder = false) => {
    for (const w of keepOrder ? words : shuffle(words, rand)) {
      if (out.length >= count) break;
      const lw = w.toLowerCase();
      if (seen.has(lw)) continue;
      // Phoneme-true: "chair" must not pass as an 'ai' word (it reads ch-air).
      if (grapheme && !hasGraphemeUnit(lw, grapheme, level)) continue;
      if (!isAllowed(lw, level)) continue;
      seen.add(lw);
      out.push(lw);
    }
  };
  if (prefer) take(prefer, true);
  for (let l = level; l >= 1 && out.length < count; l--) take(wordBank(l).words);
  return out;
}

// Graphemes that never end an English-looking word — keep aliens pronounceable.
const BAD_FINAL = new Set(['wh', 'qu', 'h', 'j', 'w', 'y', 'v', 'r']);
const BAD_INITIAL = new Set(['ck', 'ng', 'nk', 'x', 'zz', 'ff', 'll', 'ss', 'tch', 'dge']);

/** Generate pronounceable alien (nonsense) words from taught graphemes. */
export function alienWords({ level, grapheme = null, count = 4, rand = rng() }) {
  const cum = cumulativeGraphemes(level);
  const vowelish = cum.filter((g) => /^[aeiou]/.test(g) && !isSplit(g));
  const consonantish = cum.filter((g) => /^[^aeiou]/.test(g));
  const real = realWordSet();
  const out = new Set();
  let guard = 0;
  while (out.size < count && guard++ < 4000) {
    const v = grapheme && /^[aeiou]/.test(grapheme) ? grapheme : vowelish[Math.floor(rand() * vowelish.length)];
    const c1 = consonantish[Math.floor(rand() * consonantish.length)];
    const c2 = grapheme && /^[^aeiou]/.test(grapheme) ? grapheme : consonantish[Math.floor(rand() * consonantish.length)];
    if (isSplit(v) || BAD_INITIAL.has(c1) || BAD_FINAL.has(c2)) continue;
    const w = rand() < 0.5 ? c1 + v + c2 : v + c2;
    if (w.length < 2 || w.length > 6 || real.has(w) || isBannedShape(w)) continue;
    if (/(.)\1{2,}/.test(w)) continue;
    if (grapheme && !w.includes(grapheme)) continue;
    out.add(w);
  }
  return [...out];
}

// ---------------------------------------------------------------------------
// Concrete nouns — words that can be THE subject of a sentence frame or a
// picture task. Curated: every one is imageable and a real single-word noun.
// (Only used after passing the decodability guard, so listing upper-level
// words here is safe for lower levels.)
// ---------------------------------------------------------------------------
export const NOUNS = new Set([
  'ant', 'axe', 'bag', 'bat', 'bed', 'bee', 'bell', 'bin', 'bird', 'boat', 'book', 'boot', 'box', 'bug', 'bun', 'bus',
  'cab', 'cap', 'cat', 'chick', 'chip', 'clock', 'coat', 'cod', 'coin', 'cot', 'cow', 'crab', 'cup',
  'dad', 'deer', 'den', 'dog', 'doll', 'dot', 'drum', 'duck', 'egg', 'elf', 'fan', 'farm', 'fig', 'fish', 'fox', 'frog',
  'gate', 'goat', 'gull', 'hat', 'hen', 'hill', 'hut', 'ink', 'jam', 'jet', 'jug', 'kid', 'king', 'kit', 'lamb', 'leaf',
  'lid', 'log', 'man', 'map', 'mat', 'milk', 'moon', 'moth', 'mug', 'mum', 'nail', 'net', 'nut', 'owl', 'pan', 'peg',
  'pen', 'pig', 'pin', 'pip', 'pod', 'pond', 'pot', 'pup', 'rain', 'ram', 'rat', 'ring', 'rock', 'rug', 'sack', 'seal', 'shark',
  'shed', 'sheep', 'shell', 'ship', 'shop', 'snail', 'sock', 'spoon', 'star', 'sun', 'tap', 'taxi', 'tent', 'tin', 'toad',
  'train', 'tree', 'truck', 'tub', 'van', 'vet', 'web', 'wig', 'worm', 'zip',
  'beach', 'chain', 'church', 'cloud', 'clown', 'coach', 'crew', 'crown', 'house', 'jewel',
  'newt', 'nurse', 'peach', 'porch', 'purse', 'road', 'screw', 'soap', 'stew', 'torch', 'town',
  'boy', 'toy', 'girl', 'car', 'park', 'fork', 'corn', 'book', 'foot', 'wood', 'light',
  'tray', 'clay', 'hay', 'boat', 'coat', 'sheet', 'queen', 'chair', 'barn', 'card',
  'television', 'mansion', 'station',
  'bone', 'rope', 'nose', 'rose', 'stone', 'home', 'cone', 'cake', 'snake', 'cape', 'plane',
  'whale', 'tape', 'cave', 'kite', 'bike', 'slide', 'vine', 'flute', 'cube', 'tube', 'mole', 'mule',
]);

// Alien/distractor shapes that must never reach a worksheet — rude lookalikes.
export const BANNED_SHAPES = new Set([
  'fux', 'fuk', 'fuc', 'fck', 'sht', 'shet', 'shat', 'dik', 'dic', 'dck', 'cok', 'coc', 'kok',
  'tit', 'tets', 'arss', 'niga', 'nig', 'fag', 'wank', 'wnk', 'nob', 'pis', 'piss', 'crap',
  'sex', 'seks', 'hor', 'hoe', 'slut', 'slag', 'bich', 'bitc', 'prik', 'prck', 'cnt', 'cunt',
]);
export const isBannedShape = (w) => BANNED_SHAPES.has(w) || [...BANNED_SHAPES].some((b) => b.length >= 4 && w.includes(b));

// ---------------------------------------------------------------------------
// Clipart index — house-style art from the engine's libraries. word -> path.
// ---------------------------------------------------------------------------
let clipartIndex;
export function clipart() {
  if (clipartIndex) return clipartIndex;
  clipartIndex = new Map();
  const add = (word, p) => { if (!clipartIndex.has(word)) clipartIndex.set(word, p); };
  const soundart = path.join(ENGINE_PUBLIC, 'soundart');
  if (fs.existsSync(soundart)) {
    for (const dir of fs.readdirSync(soundart)) {
      const d = path.join(soundart, dir);
      if (!fs.statSync(d).isDirectory()) continue;
      for (const f of fs.readdirSync(d)) {
        if (f.endsWith('.png')) add(path.basename(f, '.png').toLowerCase(), path.join(d, f));
      }
    }
  }
  const flat = path.join(ENGINE_PUBLIC, 'clipart');
  if (fs.existsSync(flat)) {
    for (const f of fs.readdirSync(flat)) {
      if (f.endsWith('.png') && !f.startsWith('hero_') && !f.startsWith('scene_') && !f.startsWith('cover_')) {
        add(path.basename(f, '.png').toLowerCase(), path.join(flat, f));
      }
    }
  }
  const set1 = path.join(REPO_ROOT, 'assets', 'phonics', 'set1_clipart');
  if (fs.existsSync(set1)) {
    for (const f of fs.readdirSync(set1)) {
      const m = f.match(/^[a-z]+_([a-z]+)\.png$/);
      if (m) add(m[1].toLowerCase(), path.join(set1, f));
    }
  }
  // On-demand generated art (content/artgen.mjs) — the persisted cache of
  // every picture the forge has drawn for past remakes.
  const artcache = path.join(FORGE_ROOT, 'artcache');
  if (fs.existsSync(artcache)) {
    for (const f of fs.readdirSync(artcache)) {
      if (f.endsWith('.png')) add(path.basename(f, '.png').toLowerCase(), path.join(artcache, f));
    }
  }
  return clipartIndex;
}
export const hasClipart = (word) => clipart().has(word.toLowerCase());
export const clipartPath = (word) => clipart().get(word.toLowerCase());

/** Words that have clipart — concrete nouns first (a picture must be nameable). */
export function pickPictureWords(opts) {
  const rand = opts.rand ?? rng();
  const withArt = [...clipart().keys()].filter((w) => realWordSet().has(w));
  const nounArt = withArt.filter((w) => NOUNS.has(w));
  const otherArt = withArt.filter((w) => !NOUNS.has(w));
  const preferred = pickWords({ ...opts, rand, prefer: [...shuffle(nounArt, rand), ...shuffle(otherArt, rand)], count: opts.count });
  return preferred.filter((w) => hasClipart(w));
}
