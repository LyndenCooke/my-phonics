/**
 * Word bank + round builder for the "What sound is it?" game.
 *
 * Pedagogy: grapheme recognition inside real decodable words — the child
 * sees (and can hear) a word from their level and taps the grapheme hiding
 * in it. Words are chosen so the target spelling actually appears in the
 * word, and stay decodable at roughly the level the grapheme is taught
 * (Curriculum Ledger v2.0 sequence in lib/levels8.ts).
 *
 * Keys match `JOURNEY_LEVELS[n].gpcs` strings exactly. Graphemes that read
 * differently in different words (ow in snow/cow, oo in moon/look) share
 * one key — the SPELLING is what the child is hunting, which is correct
 * for both pronunciations.
 */
import type { JourneyLevel } from '@/lib/levels8';

export const WORD_BANK: Record<string, string[]> = {
  // Level 1 — Ditties
  s: ['sun', 'sock'], a: ['ant', 'apple'], t: ['tap', 'ten'], p: ['pig', 'pan'],
  i: ['ink', 'pin'], n: ['net', 'nap'], m: ['map', 'mum'], d: ['dog', 'dad'],
  g: ['gap', 'dig'], o: ['dot', 'hot'],
  // Level 2 — First Sounds
  c: ['cat', 'cup'], k: ['kit', 'kid'], ck: ['duck', 'sock'], e: ['egg', 'bed'],
  u: ['up', 'mud'], r: ['run', 'rat'], h: ['hat', 'hen'], b: ['bat', 'big'],
  f: ['fan', 'fun'], ff: ['puff', 'huff'], l: ['leg', 'lip'], ll: ['bell', 'doll'],
  ss: ['hiss', 'mess'], j: ['jam', 'jet'], v: ['van', 'vet'], w: ['wet', 'win'],
  x: ['box', 'six'], y: ['yes', 'yak'], z: ['zip', 'zoo'],
  // Level 3 — Special Friends
  sh: ['ship', 'shop'], nk: ['pink', 'sink'], ch: ['chip', 'chat'],
  th: ['thin', 'moth'], ng: ['ring', 'song'], qu: ['quiz', 'quick'],
  zz: ['buzz', 'fizz'],
  // Level 4 — Longer Sounds (ow/oo cover both pronunciations on purpose)
  ay: ['play', 'day'], ee: ['see', 'tree'], igh: ['high', 'night'],
  ow: ['snow', 'cow', 'blow', 'brown'], oo: ['moon', 'look', 'zoo', 'book'],
  ar: ['car', 'star'], or: ['fork', 'corn'], air: ['hair', 'chair'],
  ir: ['bird', 'girl'], ou: ['out', 'cloud'], oy: ['boy', 'toy'],
  // Level 5 — New Spellings
  'a-e': ['cake', 'gate'], 'i-e': ['bike', 'time'], 'o-e': ['home', 'bone'],
  'u-e': ['cube', 'flute'], ea: ['eat', 'sea'], ie: ['pie', 'tie'],
  oi: ['coin', 'soil'], aw: ['saw', 'paw'], ai: ['rain', 'tail'],
  oa: ['boat', 'coat'],
  // Level 6 — Building Fluency
  ur: ['fur', 'burn'], er: ['her', 'ladder'], are: ['care', 'share'],
  ew: ['new', 'chew'], ue: ['blue', 'glue'], wr: ['write', 'wrap'],
  kn: ['knee', 'knot'], ge: ['cage', 'page'], dge: ['bridge', 'badge'],
  mb: ['lamb', 'comb'], gn: ['sign', 'gnome'], ph: ['phone', 'dolphin'],
  wh: ['when', 'whale'],
  // Level 7 — Reading Together
  ire: ['fire', 'wire'], ore: ['more', 'shore'], ear: ['hear', 'near'],
  oor: ['door', 'floor'], ure: ['pure', 'cure'], tion: ['station', 'action'],
  // Level 8 — Reading Champion (suffixes; hyphen stripped for matching)
  '-ous': ['famous', 'nervous'], '-cious': ['delicious', 'precious'],
  '-tious': ['cautious', 'scrumptious'], '-able': ['enjoyable', 'comfortable'],
  '-ible': ['incredible', 'invisible'],
};

export interface GameRound {
  word: string;
  /** The grapheme hiding in the word (as shown on its tile). */
  target: string;
  /** Shuffled options including the target. */
  options: string[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── phonics-truth layer ─────────────────────────────────────────────
// Letter-containment lies: "fork" contains the letter o but not the /o/
// sound; "face" has a c that says /s/. The green-words ledger carries the
// real grapheme breakdown per word (units), injected here by
// lib/greenWords once the ledger loads (a setter, to avoid an import
// cycle). Distractor checks consult it so a "wrong" option is never a
// sound that is actually IN the word.
let LEDGER_UNITS: Record<string, string[]> | null = null;

export function setLedgerUnits(units: Record<string, string[]>): void {
  LEDGER_UNITS = units;
}

/** True when the ledger says this word genuinely contains this sound. */
export function soundInWord(g: string, word: string): boolean {
  const u = LEDGER_UNITS?.[word];
  if (!u) return false;
  return u.includes(g) || u.includes(displayGrapheme(g));
}

/** Say a grapheme's SOUND (the pre-recorded phoneme MP3s in /sounds/,
 *  a-e → a_e naming). Silent on miss — never TTS a bare phoneme. */
export function playPhoneme(g: string): void {
  const key = g.replace(/^-/, '').replace(/-/g, '_').toLowerCase();
  if (!key) return;
  try {
    currentWordAudio?.pause();
    const audio = new Audio(`/sounds/${key}.mp3`);
    currentWordAudio = audio;
    audio.play().catch(() => { /* optional */ });
  } catch { /* optional */ }
}

/** The grapheme as the child sees it on a tile ("-ous" → "ous"). */
export function displayGrapheme(g: string): string {
  return g.replace(/^-/, '');
}

/**
 * Build N rounds from a level's GPC list. Distractors come from the same
 * level (same sounds the child is currently learning), padded from the
 * full bank when a level is short. A distractor must not ALSO appear in
 * the word, or the "wrong" answer would secretly be right (e.g. never
 * offer "s" alongside "sun" unless it's the target).
 *
 * `bank` defaults to the curated WORD_BANK; pass the ledger-backed bank
 * from lib/greenWords.useGameBank for real curriculum depth (its keys are
 * taught-sounds-only, which also keeps padded distractors level-safe).
 */
export function buildRounds(level: JourneyLevel, count: number, bank: Record<string, string[]> = WORD_BANK): GameRound[] {
  const pool = level.gpcs.filter(g => bank[g]?.length);
  if (pool.length === 0) return [];

  const allGraphemes = Object.keys(bank);
  const targets = shuffle(pool);
  const rounds: GameRound[] = [];

  for (let i = 0; i < count; i++) {
    const target = targets[i % targets.length];
    const words = bank[target];
    const word = words[Math.floor(Math.random() * words.length)];

    const isValidDistractor = (g: string) =>
      g !== target && !word.includes(displayGrapheme(g)) && !soundInWord(g, word);
    const sameLevel = shuffle(pool.filter(isValidDistractor));
    const padding = shuffle(allGraphemes.filter(g => isValidDistractor(g) && !sameLevel.includes(g)));
    const distractors = [...sameLevel, ...padding].slice(0, 2);

    rounds.push({ word, target, options: shuffle([target, ...distractors]) });
  }
  return rounds;
}

// ─── "Finish the word" rounds ────────────────────────────────────────

export interface FinishRound {
  /** Letters before the blank. */
  before: string;
  /** Letters after the blank. */
  after: string;
  /** The full word (for the speaker button). */
  word: string;
  /** The missing grapheme. */
  target: string;
  options: string[];
}

/** Words a wrong tile must never visually form next to the blank —
 *  "d_ck" with an "i" tile on offer is not a children's game. */
const BLOCKED_FORMS = new Set(['dick', 'cock', 'tit', 'tits', 'shit', 'fuck', 'arse', 'piss', 'crap', 'sex', 'fag', 'damn', 'hell']);

/**
 * Build N "finish the word" rounds: the target grapheme is blanked out of
 * the word and the child picks the missing sound. Split digraphs (a-e)
 * are excluded — a word with two blanks reads as a puzzle, not phonics.
 */
export function buildFinishRounds(level: JourneyLevel, count: number, bank: Record<string, string[]> = WORD_BANK): FinishRound[] {
  const usable = (g: string) => {
    if (g.includes('-') && !g.startsWith('-')) return false; // split digraph
    const shown = displayGrapheme(g);
    return (bank[g] ?? []).some(w => w.includes(shown));
  };
  const pool = level.gpcs.filter(usable);
  if (pool.length === 0) return [];

  const allGraphemes = Object.keys(bank).filter(usable);
  const targets = shuffle(pool);
  const rounds: FinishRound[] = [];

  for (let i = 0; i < count; i++) {
    const target = targets[i % targets.length];
    const shown = displayGrapheme(target);
    const words = bank[target].filter(w => w.includes(shown));
    const word = words[Math.floor(Math.random() * words.length)];
    const at = word.indexOf(shown);
    const before = word.slice(0, at);
    const after = word.slice(at + shown.length);

    const isValidDistractor = (g: string) => {
      if (g === target) return false;
      const d = displayGrapheme(g);
      if (d === shown) return false;
      // A distractor must not ALSO complete the word into something real
      // (the same word, or anything on the blocklist).
      const formed = before + d + after;
      if (formed === word || BLOCKED_FORMS.has(formed)) return false;
      // never offer a sound that is genuinely in the word
      if (soundInWord(g, word)) return false;
      return true;
    };
    const sameLevel = shuffle(pool.filter(isValidDistractor));
    const padding = shuffle(allGraphemes.filter(g => isValidDistractor(g) && !sameLevel.includes(g)));
    const distractors = [...sameLevel, ...padding].slice(0, 2);

    rounds.push({ before, after, word, target, options: shuffle([target, ...distractors]) });
  }
  return rounds;
}

// ─── "Hear it, find it" (tricky word) rounds ─────────────────────────

export interface TrickyRound {
  /** The word that gets spoken aloud. */
  target: string;
  options: string[];
}

/**
 * Tricky words the child should know by this level — cumulative across
 * levels 1..N (tricky words are introduced once, then assumed). Padded
 * with the NEXT level's words when the pool is too small for a round
 * (Level 1 only introduces "I" and "the").
 */
export function trickyPoolForLevel(levels: JourneyLevel[], level: JourneyLevel): string[] {
  const learnt = levels
    .filter(l => l.level <= level.level)
    .flatMap(l => l.trickyWords);
  if (learnt.length >= 3) return learnt;
  const next = levels.find(l => l.level === level.level + 1);
  return [...learnt, ...(next?.trickyWords ?? [])];
}

/** Build N listen-and-tap rounds from the level's tricky-word pool.
 *  Targets favour the child's own level; distractors come from anything
 *  they've met so far. */
export function buildTrickyRounds(levels: JourneyLevel[], level: JourneyLevel, count: number): TrickyRound[] {
  const pool = trickyPoolForLevel(levels, level);
  if (pool.length < 3) return [];

  const own = level.trickyWords.length >= 2 ? level.trickyWords : pool;
  const targets = shuffle(own);
  const rounds: TrickyRound[] = [];

  for (let i = 0; i < count; i++) {
    const target = targets[i % targets.length];
    const distractors = shuffle(pool.filter(w => w.toLowerCase() !== target.toLowerCase())).slice(0, 2);
    rounds.push({ target, options: shuffle([target, ...distractors]) });
  }
  return rounds;
}

/**
 * Say a word aloud — the pre-recorded ElevenLabs (George) MP3 in
 * /sounds/words/, or SILENCE. No browser-TTS fallback: the robot voice
 * mangles short words ("jet" that doesn't sound like jet), and the game
 * banks now prefer voiced words via the audio manifest, so a miss means
 * the manifest is stale — regenerate it, don't let a robot teach.
 */
let currentWordAudio: HTMLAudioElement | null = null;

export function speakWord(word: string): void {
  const key = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!key) return;
  try {
    currentWordAudio?.pause();
    const audio = new Audio(`/sounds/words/${key}.mp3`);
    currentWordAudio = audio;
    audio.play().catch(() => { /* silent on miss — never TTS */ });
  } catch {
    /* silent on miss */
  }
}

