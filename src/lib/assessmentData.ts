// Assessment item bank — aligned to the 8-level reading journey.
//
// Levels 1–3 are written around the Set 1 progression in src/lib/levels8.ts and
// reuse the items from the school bank (src/school/data/assessmentItems.ts) so
// the parent and school assessments agree. Levels 4–8 lift the old parent
// Level 2–6 item sets verbatim with a level re-tag (same content, new number):
// old L2 → L4, old L3 → L5, old L4 → L6, old L5 → L7, old L6 → L8.
//
// Every real and alien word is decodable using only the graphemes taught up to
// and including its level (see JOURNEY_LEVELS in levels8.ts).

import { JOURNEY_LEVELS } from './levels8';

export type Category = 'sound_recognition' | 'word_reading' | 'alien_words' | 'tricky_words' | 'speedy_reading' | 'fluency';

export interface AssessmentItem {
  level: number;
  category: Category;
  item: string;
  targetGrapheme?: string; // only for sound_recognition
  sortOrder: number;
}

export interface PassCriteria {
  sounds: number;
  words: number;
  alien: number;
  tricky: number;
  fluency?: number; // wpm threshold, L6+ only
}

export interface AgeExpectation {
  age: string;
  yearGroup: string;
  expectedLevel: string;
  belowExpectations: string;
  aboveExpectations: string;
}

export const PASS_CRITERIA: Record<number, PassCriteria> = {
  1: { sounds: 90, words: 85, alien: 75, tricky: 70 },
  2: { sounds: 90, words: 85, alien: 75, tricky: 70 },
  3: { sounds: 90, words: 85, alien: 75, tricky: 70 },
  4: { sounds: 90, words: 85, alien: 75, tricky: 70 },
  5: { sounds: 90, words: 85, alien: 75, tricky: 70 },
  6: { sounds: 90, words: 85, alien: 75, tricky: 70, fluency: 90 },
  7: { sounds: 90, words: 85, alien: 75, tricky: 70, fluency: 100 },
  8: { sounds: 90, words: 85, alien: 75, tricky: 70, fluency: 110 },
};

// Age expectations read against the 8-level journey. Age buckets match
// getAgeRangeFromDob in Assessment.tsx; levels reference the ranges in
// JOURNEY_LEVELS (Reception → Year 3).
export const AGE_EXPECTATIONS: AgeExpectation[] = [
  { age: '4–4.5', yearGroup: 'Reception (Autumn)', expectedLevel: 'Level 1', belowExpectations: 'N/A (starting point)', aboveExpectations: 'Level 2' },
  { age: '4.5–5', yearGroup: 'Reception (Spring/Summer)', expectedLevel: 'Level 1–2', belowExpectations: 'Still on early Level 1', aboveExpectations: 'Level 3' },
  { age: '5–5.5', yearGroup: 'Year 1 (Autumn)', expectedLevel: 'Level 2–3', belowExpectations: 'Level 1', aboveExpectations: 'Level 4' },
  { age: '5.5–6', yearGroup: 'Year 1 (Spring/Summer)', expectedLevel: 'Level 3–4', belowExpectations: 'Level 1–2', aboveExpectations: 'Level 5' },
  { age: '6–7', yearGroup: 'Year 2', expectedLevel: 'Level 4–6', belowExpectations: 'Level 1–3', aboveExpectations: 'Level 7' },
  { age: '7–8', yearGroup: 'Year 3', expectedLevel: 'Level 6–8', belowExpectations: 'Level 1–5', aboveExpectations: 'Beyond Level 8' },
];

// Names, colours and phases sourced from JOURNEY_LEVELS (levels8.ts) so the
// assessment never drifts from the journey source of truth.
const PHASE_BY_LEVEL: Record<number, string> = {
  1: 'Phase 2', 2: 'Phase 2–3', 3: 'Phase 3', 4: 'Phase 3–4',
  5: 'Phase 5', 6: 'Phase 5', 7: 'Phase 5–6', 8: 'Phase 6',
};

export const LEVEL_NAMES: Record<number, { name: string; colour: string; phase: string }> =
  Object.fromEntries(
    JOURNEY_LEVELS.map((l) => [l.level, { name: l.name, colour: l.colourName, phase: PHASE_BY_LEVEL[l.level] ?? '' }]),
  );

export const CATEGORY_LABELS: Record<Category, string> = {
  sound_recognition: 'Sounds',
  word_reading: 'Real Words',
  alien_words: 'Alien Words',
  tricky_words: 'Tricky Words',
  speedy_reading: 'Speedy Reading',
  fluency: 'Fluency',
};

export const CATEGORY_INSTRUCTIONS: Record<Category, string> = {
  sound_recognition: 'Show your child each sound. Ask: "What sound does this make?"',
  word_reading: 'Ask your child to read each real word aloud.',
  alien_words: 'Tell your child these are made-up words. Ask them to sound out each one.',
  tricky_words: 'Show each tricky word. These can\'t be sounded out — they need to be recognised.',
  speedy_reading: 'Ask your child to read these words as quickly as they can.',
  fluency: 'Use a Level book passage. Time 1 minute. Count words read correctly.',
};

// ─── Item bank ────────────────────────────────────────────────
// Built level by level so a single running counter gives every item a stable
// sortOrder. Plain strings become sound/word/etc. items; for sounds the string
// is also the target grapheme unless an explicit { item, grapheme } is given.

interface ItemBlock {
  category: Category;
  items: Array<string | { item: string; grapheme?: string }>;
}

let order = 0;
function makeLevel(level: number, blocks: ItemBlock[]): AssessmentItem[] {
  const out: AssessmentItem[] = [];
  for (const block of blocks) {
    for (const raw of block.items) {
      const item = typeof raw === 'string' ? raw : raw.item;
      const grapheme = typeof raw === 'string' ? raw : (raw.grapheme ?? raw.item);
      out.push({
        level,
        category: block.category,
        item,
        targetGrapheme: block.category === 'sound_recognition' ? grapheme : undefined,
        sortOrder: ++order,
      });
    }
  }
  return out;
}

export const ASSESSMENT_ITEMS: AssessmentItem[] = [
  // ═══════════════════════════════════════
  // LEVEL 1 — Ditties (Pink) · s a t p i n m d g o
  // ═══════════════════════════════════════
  ...makeLevel(1, [
    { category: 'sound_recognition', items: ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o'] },
    { category: 'word_reading', items: ['sat', 'pin', 'dog', 'mop', 'dig', 'nit', 'tap', 'tip', 'nip', 'pan'] },
    { category: 'alien_words', items: ['pid', 'gom', 'sot', 'nid', 'mig', 'tog', 'dap', 'nop', 'gip', 'sim'] },
    { category: 'tricky_words', items: ['I', 'the'] },
  ]),

  // ═══════════════════════════════════════
  // LEVEL 2 — First Sounds (Coral) · c k ck e u r h b f ff l ll ss j v w x y z
  // ═══════════════════════════════════════
  ...makeLevel(2, [
    { category: 'sound_recognition', items: ['c', 'k', 'ck', 'e', 'u', 'r', 'h', 'b', 'f', 'ff', 'l', 'll', 'ss'] },
    { category: 'word_reading', items: ['duck', 'bell', 'huff', 'jet', 'web', 'fox', 'cup', 'red', 'log', 'kiss'] },
    { category: 'alien_words', items: ['veck', 'zuff', 'rell', 'hib', 'lub', 'fick', 'joss', 'wug', 'yat', 'beff'] },
    { category: 'tricky_words', items: ['no', 'go', 'to', 'into', 'is'] },
  ]),

  // ═══════════════════════════════════════
  // LEVEL 3 — Special Friends (Amber) · sh nk ch th ng qu zz
  // ═══════════════════════════════════════
  ...makeLevel(3, [
    { category: 'sound_recognition', items: ['sh', 'ch', 'th', 'ng', 'nk', 'qu', 'zz'] },
    { category: 'word_reading', items: ['ship', 'chop', 'thin', 'ring', 'bank', 'quick', 'buzz', 'fish', 'rush', 'much'] },
    { category: 'alien_words', items: ['shog', 'chib', 'thup', 'ning', 'zonk', 'quab', 'theng', 'shuck', 'chid', 'nunk'] },
    { category: 'tricky_words', items: ['he', 'she', 'we', 'me', 'be'] },
  ]),

  // ═══════════════════════════════════════
  // LEVEL 4 — Longer Sounds (Green) · lifted from old parent Level 2
  // ═══════════════════════════════════════
  ...makeLevel(4, [
    {
      category: 'sound_recognition',
      items: [
        'ay', 'ee', 'igh',
        { item: 'ow (blow)', grapheme: 'ow (blow)' },
        { item: 'ow (cow)', grapheme: 'ow (cow)' },
        { item: 'oo (moon)', grapheme: 'oo (moon)' },
        { item: 'oo (look)', grapheme: 'oo (look)' },
        'ar', 'or', 'air', 'ir', 'ou', 'oy',
      ],
    },
    { category: 'word_reading', items: ['day', 'jeep', 'sight', 'low', 'cow', 'moon', 'look', 'park', 'fork', 'fair', 'fir', 'shout', 'boy'] },
    { category: 'alien_words', items: ['tay', 'deeg', 'migh', 'gow', 'yow', 'hoond', 'jook', 'narp', 'mork', 'gair', 'zir', 'fout', 'noy'] },
    { category: 'tricky_words', items: ['he', 'she', 'we', 'me', 'be', 'my', 'you', 'her', 'said', 'your', 'are', 'put'] },
    { category: 'speedy_reading', items: ['with', 'off', 'thin', 'will', 'his', 'them', 'that', 'have', 'long', 'this', 'back', 'much'] },
  ]),

  // ═══════════════════════════════════════
  // LEVEL 5 — New Spellings (Blue) · lifted from old parent Level 3
  // ═══════════════════════════════════════
  ...makeLevel(5, [
    {
      category: 'sound_recognition',
      items: ['ea', 'a-e', 'i-e', 'o-e', 'u-e', 'oi', 'aw', 'ai', 'oa', 'ie'],
    },
    { category: 'word_reading', items: ['cake', 'bike', 'stone', 'flute', 'coin', 'straw', 'snail', 'boat', 'pie', 'reach'] },
    { category: 'alien_words', items: ['grafe', 'stime', 'broak', 'cloi', 'frawl', 'snaid', 'bleam', 'dripe', 'joap', 'spie'] },
    { category: 'tricky_words', items: ['all', 'like', 'want', 'call', 'some', 'what', 'they', 'do', 'old', 'was', 'so', 'one', 'two', 'again'] },
    { category: 'speedy_reading', items: ['lots', 'black', 'went', 'stop', 'green', 'tree', 'make', 'came', 'play', 'round', 'feel', 'about'] },
  ]),

  // ═══════════════════════════════════════
  // LEVEL 6 — Building Fluency (Indigo) · lifted from old parent Level 4
  // ═══════════════════════════════════════
  ...makeLevel(6, [
    {
      category: 'sound_recognition',
      items: ['are', 'ur', 'er', 'ew', 'ue'],
    },
    { category: 'word_reading', items: ['stare', 'turn', 'fern', 'chew', 'true', 'brown', 'turnip', 'market', 'flower'] },
    { category: 'alien_words', items: ['skare', 'clurn', 'blert', 'brewn', 'plue', 'jown', 'norp', 'pight', 'clow', 'zair'] },
    { category: 'tricky_words', items: ['saw', 'watch', 'their', 'school', 'where', 'were', 'small', 'who', 'tall', 'brother', 'any', 'there', 'eyes', 'done', 'move'] },
    { category: 'speedy_reading', items: ['rest', 'smell', 'soft', 'stay', 'which', 'first', 'your', 'down', 'house', 'after', 'every', 'other'] },
  ]),

  // ═══════════════════════════════════════
  // LEVEL 7 — Reading Together (Purple) · lifted from old parent Level 5
  // ═══════════════════════════════════════
  ...makeLevel(7, [
    {
      category: 'sound_recognition',
      items: ['ore', 'oor', 'ire', 'ear', 'ure', 'tion', 'ph', 'kn', 'wr'],
    },
    { category: 'word_reading', items: ['shore', 'floor', 'fire', 'near', 'sure', 'station', 'phone', 'knee', 'write'] },
    { category: 'alien_words', items: ['blore', 'gloor', 'brire', 'snear', 'plure', 'tration', 'phest', 'knib', 'wrop'] },
    { category: 'tricky_words', items: ['does', 'could', 'would', 'anyone', 'over', 'through', 'once', 'whole', 'people', 'water', 'though', 'knew', 'woman'] },
    { category: 'speedy_reading', items: ['thing', 'right', 'night', 'sleep', 'know', 'quick', 'little', 'think', 'smart', 'more', 'before', 'people'] },
  ]),

  // ═══════════════════════════════════════
  // LEVEL 8 — Reading Champion (Teal) · lifted from old parent Level 6
  // ═══════════════════════════════════════
  ...makeLevel(8, [
    {
      category: 'sound_recognition',
      items: ['-ous', '-cious', '-tious', '-able', '-ible'],
    },
    { category: 'word_reading', items: ['famous', 'precious', 'cautious', 'readable', 'terrible', 'incredible', 'suspicious'] },
    { category: 'alien_words', items: ['parvous', 'fricious', 'bontious', 'strable', 'plendible', 'marcious', 'gantible'] },
    { category: 'tricky_words', items: ['should', 'many', 'above', 'father', 'son', 'mother', 'buy', 'bought', 'great', 'caught', 'worse', 'love', 'wear', 'thought', 'everyone', 'walk', 'talk'] },
    { category: 'speedy_reading', items: ['comfortable', 'invisible', 'operation', 'tomorrow', 'serious', 'remember', 'enormous', 'beautiful', 'different', 'important'] },
  ]),
];

// Helper: get items for a specific level and category
export function getItems(level: number, category: Category): AssessmentItem[] {
  return ASSESSMENT_ITEMS.filter(i => i.level === level && i.category === category);
}

// Categories in display order (per level)
export function getCategoriesForLevel(level: number): Category[] {
  const cats: Category[] = ['sound_recognition', 'word_reading', 'alien_words', 'tricky_words', 'speedy_reading'];
  if (level >= 6) cats.push('fluency');
  return cats;
}
