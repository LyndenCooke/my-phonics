// Complete assessment item bank from MyPhonicsBooks Assessment Sheet
// 346 items across 6 levels, 5-6 categories each

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
  fluency?: number; // wpm threshold, L4+ only
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
  4: { sounds: 90, words: 85, alien: 75, tricky: 70, fluency: 90 },
  5: { sounds: 90, words: 85, alien: 75, tricky: 70, fluency: 100 },
  6: { sounds: 90, words: 85, alien: 75, tricky: 70, fluency: 110 },
};

export const AGE_EXPECTATIONS: AgeExpectation[] = [
  { age: '4–4.5', yearGroup: 'Reception (Autumn)', expectedLevel: 'Level 1', belowExpectations: 'N/A (starting point)', aboveExpectations: 'Level 2' },
  { age: '4.5–5', yearGroup: 'Reception (Spring/Summer)', expectedLevel: 'Level 1–2', belowExpectations: 'Still on early Level 1', aboveExpectations: 'Level 3' },
  { age: '5–5.5', yearGroup: 'Year 1 (Autumn)', expectedLevel: 'Level 2–3', belowExpectations: 'Level 1', aboveExpectations: 'Level 4' },
  { age: '5.5–6', yearGroup: 'Year 1 (Spring/Summer)', expectedLevel: 'Level 3–4', belowExpectations: 'Level 1–2', aboveExpectations: 'Level 5' },
  { age: '6–7', yearGroup: 'Year 2', expectedLevel: 'Level 4–5', belowExpectations: 'Level 1–3', aboveExpectations: 'Level 6' },
  { age: '7–8', yearGroup: 'Year 3', expectedLevel: 'Level 5–6', belowExpectations: 'Level 1–4', aboveExpectations: 'Beyond Level 6' },
];

export const LEVEL_NAMES: Record<number, { name: string; colour: string; phase: string }> = {
  1: { name: 'Starting Stories', colour: 'Pink', phase: 'Phase 2–3' },
  2: { name: 'Longer Sounds', colour: 'Amber', phase: 'Phase 3' },
  3: { name: 'New Spellings', colour: 'Green', phase: 'Phase 4–5' },
  4: { name: 'Building Fluency', colour: 'Blue', phase: 'Phase 5' },
  5: { name: 'Reading Together', colour: 'Purple', phase: 'Phase 5–6' },
  6: { name: 'Reading Champion', colour: 'Teal', phase: 'Phase 6' },
};

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

// All 346 items from the Excel Item Bank
let order = 0;
export const ASSESSMENT_ITEMS: AssessmentItem[] = [
  // ═══════════════════════════════════════
  // LEVEL 1 — Starting Stories (Pink)
  // ═══════════════════════════════════════

  // Sound Recognition (36 sounds)
  ...[
    's', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o',
    'c', 'k', 'ck', 'e', 'u', 'r', 'h', 'b', 'f', 'ff',
    'l', 'll', 'ss', 'j', 'v', 'w', 'x', 'y', 'z', 'zz',
    'qu', 'ch', 'sh', 'th', 'ng', 'nk',
  ].map(s => ({ level: 1, category: 'sound_recognition' as Category, item: s, targetGrapheme: s, sortOrder: ++order })),

  // Real Words (12)
  ...['sat', 'pin', 'dig', 'mop', 'cup', 'hug', 'check', 'fish', 'shop', 'thin', 'ring', 'quack']
    .map(w => ({ level: 1, category: 'word_reading' as Category, item: w, sortOrder: ++order })),

  // Alien Words (12)
  ...['teg', 'mip', 'fod', 'gub', 'hin', 'jat', 'zog', 'vum', 'cheb', 'shog', 'thep', 'quab']
    .map(w => ({ level: 1, category: 'alien_words' as Category, item: w, sortOrder: ++order })),

  // Tricky Words (6)
  ...['the', 'to', 'I', 'no', 'go', 'into']
    .map(w => ({ level: 1, category: 'tricky_words' as Category, item: w, sortOrder: ++order })),

  // Speedy Reading (12)
  ...['in', 'am', 'red', 'bin', 'yes', 'and', 'get', 'him', 'not', 'but', 'big', 'had']
    .map(w => ({ level: 1, category: 'speedy_reading' as Category, item: w, sortOrder: ++order })),

  // ═══════════════════════════════════════
  // LEVEL 2 — Longer Sounds (Amber)
  // ═══════════════════════════════════════

  // Sound Recognition (13 sounds)
  ...[
    { item: 'ay', grapheme: 'ay' },
    { item: 'ee', grapheme: 'ee' },
    { item: 'igh', grapheme: 'igh' },
    { item: 'ow (blow)', grapheme: 'ow (blow)' },
    { item: 'ow (cow)', grapheme: 'ow (cow)' },
    { item: 'oo (moon)', grapheme: 'oo (moon)' },
    { item: 'oo (look)', grapheme: 'oo (look)' },
    { item: 'ar', grapheme: 'ar' },
    { item: 'or', grapheme: 'or' },
    { item: 'air', grapheme: 'air' },
    { item: 'ir', grapheme: 'ir' },
    { item: 'ou', grapheme: 'ou' },
    { item: 'oy', grapheme: 'oy' },
  ].map(s => ({ level: 2, category: 'sound_recognition' as Category, item: s.item, targetGrapheme: s.grapheme, sortOrder: ++order })),

  // Real Words (13)
  ...['day', 'jeep', 'sight', 'low', 'cow', 'moon', 'look', 'park', 'fork', 'fair', 'fir', 'shout', 'boy']
    .map(w => ({ level: 2, category: 'word_reading' as Category, item: w, sortOrder: ++order })),

  // Alien Words (13)
  ...['tay', 'deeg', 'migh', 'gow', 'yow', 'hoond', 'jook', 'narp', 'mork', 'gair', 'zir', 'fout', 'noy']
    .map(w => ({ level: 2, category: 'alien_words' as Category, item: w, sortOrder: ++order })),

  // Tricky Words (12)
  ...['he', 'she', 'we', 'me', 'be', 'my', 'you', 'her', 'said', 'your', 'are', 'put']
    .map(w => ({ level: 2, category: 'tricky_words' as Category, item: w, sortOrder: ++order })),

  // Speedy Reading (12)
  ...['with', 'off', 'thin', 'will', 'his', 'them', 'that', 'have', 'long', 'this', 'back', 'much']
    .map(w => ({ level: 2, category: 'speedy_reading' as Category, item: w, sortOrder: ++order })),

  // ═══════════════════════════════════════
  // LEVEL 3 — New Spellings (Green)
  // ═══════════════════════════════════════

  // Sound Recognition (10 sounds)
  ...[
    { item: 'ea', grapheme: 'ea' },
    { item: 'a-e', grapheme: 'a-e' },
    { item: 'i-e', grapheme: 'i-e' },
    { item: 'o-e', grapheme: 'o-e' },
    { item: 'u-e', grapheme: 'u-e' },
    { item: 'oi', grapheme: 'oi' },
    { item: 'aw', grapheme: 'aw' },
    { item: 'ai', grapheme: 'ai' },
    { item: 'oa', grapheme: 'oa' },
    { item: 'ie', grapheme: 'ie' },
  ].map(s => ({ level: 3, category: 'sound_recognition' as Category, item: s.item, targetGrapheme: s.grapheme, sortOrder: ++order })),

  // Real Words (10)
  ...['cake', 'bike', 'stone', 'flute', 'coin', 'straw', 'snail', 'boat', 'pie', 'reach']
    .map(w => ({ level: 3, category: 'word_reading' as Category, item: w, sortOrder: ++order })),

  // Alien Words (10)
  ...['grafe', 'stime', 'broak', 'cloi', 'frawl', 'snaid', 'bleam', 'dripe', 'joap', 'spie']
    .map(w => ({ level: 3, category: 'alien_words' as Category, item: w, sortOrder: ++order })),

  // Tricky Words (14)
  ...['all', 'like', 'want', 'call', 'some', 'what', 'they', 'do', 'old', 'was', 'so', 'one', 'two', 'again']
    .map(w => ({ level: 3, category: 'tricky_words' as Category, item: w, sortOrder: ++order })),

  // Speedy Reading (12)
  ...['lots', 'black', 'went', 'stop', 'green', 'tree', 'make', 'came', 'play', 'round', 'feel', 'about']
    .map(w => ({ level: 3, category: 'speedy_reading' as Category, item: w, sortOrder: ++order })),

  // ═══════════════════════════════════════
  // LEVEL 4 — Building Fluency (Blue)
  // ═══════════════════════════════════════

  // Sound Recognition (5 sounds)
  ...[
    { item: 'are', grapheme: 'are' },
    { item: 'ur', grapheme: 'ur' },
    { item: 'er', grapheme: 'er' },
    { item: 'ew', grapheme: 'ew' },
    { item: 'ue', grapheme: 'ue' },
  ].map(s => ({ level: 4, category: 'sound_recognition' as Category, item: s.item, targetGrapheme: s.grapheme, sortOrder: ++order })),

  // Real Words (9)
  ...['stare', 'turn', 'fern', 'chew', 'true', 'brown', 'turnip', 'market', 'flower']
    .map(w => ({ level: 4, category: 'word_reading' as Category, item: w, sortOrder: ++order })),

  // Alien Words (10)
  ...['skare', 'clurn', 'blert', 'brewn', 'plue', 'jown', 'norp', 'pight', 'clow', 'zair']
    .map(w => ({ level: 4, category: 'alien_words' as Category, item: w, sortOrder: ++order })),

  // Tricky Words (15)
  ...['saw', 'watch', 'their', 'school', 'where', 'were', 'small', 'who', 'tall', 'brother', 'any', 'there', 'eyes', 'done', 'move']
    .map(w => ({ level: 4, category: 'tricky_words' as Category, item: w, sortOrder: ++order })),

  // Speedy Reading (12)
  ...['rest', 'smell', 'soft', 'stay', 'which', 'first', 'your', 'down', 'house', 'after', 'every', 'other']
    .map(w => ({ level: 4, category: 'speedy_reading' as Category, item: w, sortOrder: ++order })),

  // ═══════════════════════════════════════
  // LEVEL 5 — Reading Together (Purple)
  // ═══════════════════════════════════════

  // Sound Recognition (9 sounds)
  ...[
    { item: 'ore', grapheme: 'ore' },
    { item: 'oor', grapheme: 'oor' },
    { item: 'ire', grapheme: 'ire' },
    { item: 'ear', grapheme: 'ear' },
    { item: 'ure', grapheme: 'ure' },
    { item: 'tion', grapheme: 'tion' },
    { item: 'ph', grapheme: 'ph' },
    { item: 'kn', grapheme: 'kn' },
    { item: 'wr', grapheme: 'wr' },
  ].map(s => ({ level: 5, category: 'sound_recognition' as Category, item: s.item, targetGrapheme: s.grapheme, sortOrder: ++order })),

  // Real Words (9)
  ...['shore', 'floor', 'fire', 'near', 'sure', 'station', 'phone', 'knee', 'write']
    .map(w => ({ level: 5, category: 'word_reading' as Category, item: w, sortOrder: ++order })),

  // Alien Words (9)
  ...['blore', 'gloor', 'brire', 'snear', 'plure', 'tration', 'phest', 'knib', 'wrop']
    .map(w => ({ level: 5, category: 'alien_words' as Category, item: w, sortOrder: ++order })),

  // Tricky Words (13)
  ...['does', 'could', 'would', 'anyone', 'over', 'through', 'once', 'whole', 'people', 'water', 'though', 'knew', 'woman']
    .map(w => ({ level: 5, category: 'tricky_words' as Category, item: w, sortOrder: ++order })),

  // Speedy Reading (12)
  ...['thing', 'right', 'night', 'sleep', 'know', 'quick', 'little', 'think', 'smart', 'more', 'before', 'people']
    .map(w => ({ level: 5, category: 'speedy_reading' as Category, item: w, sortOrder: ++order })),

  // ═══════════════════════════════════════
  // LEVEL 6 — Reading Champion (Teal)
  // ═══════════════════════════════════════

  // Sound Recognition (5 sounds)
  ...[
    { item: 'ous', grapheme: 'ous' },
    { item: 'cious', grapheme: 'cious' },
    { item: 'tious', grapheme: 'tious' },
    { item: 'able', grapheme: 'able' },
    { item: 'ible', grapheme: 'ible' },
  ].map(s => ({ level: 6, category: 'sound_recognition' as Category, item: s.item, targetGrapheme: s.grapheme, sortOrder: ++order })),

  // Real Words (7)
  ...['famous', 'precious', 'cautious', 'readable', 'terrible', 'incredible', 'suspicious']
    .map(w => ({ level: 6, category: 'word_reading' as Category, item: w, sortOrder: ++order })),

  // Alien Words (7)
  ...['parvous', 'fricious', 'bontious', 'strable', 'plendible', 'marcious', 'gantible']
    .map(w => ({ level: 6, category: 'alien_words' as Category, item: w, sortOrder: ++order })),

  // Tricky Words (17)
  ...['should', 'many', 'above', 'father', 'son', 'mother', 'buy', 'bought', 'great', 'caught', 'worse', 'love', 'wear', 'thought', 'everyone', 'walk', 'talk']
    .map(w => ({ level: 6, category: 'tricky_words' as Category, item: w, sortOrder: ++order })),

  // Speedy Reading (10)
  ...['comfortable', 'invisible', 'operation', 'tomorrow', 'serious', 'remember', 'enormous', 'beautiful', 'different', 'important']
    .map(w => ({ level: 6, category: 'speedy_reading' as Category, item: w, sortOrder: ++order })),
];

// Helper: get items for a specific level and category
export function getItems(level: number, category: Category): AssessmentItem[] {
  return ASSESSMENT_ITEMS.filter(i => i.level === level && i.category === category);
}

// Categories in display order (per level)
export function getCategoriesForLevel(level: number): Category[] {
  const cats: Category[] = ['sound_recognition', 'word_reading', 'alien_words', 'tricky_words', 'speedy_reading'];
  if (level >= 4) cats.push('fluency');
  return cats;
}
