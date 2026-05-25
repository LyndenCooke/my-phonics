/**
 * Assessment item bank for the school-8 structure.
 *
 * Levels 1–3 are written from scratch around RWI Set 1 progression.
 * Levels 4–8 lift the corresponding item sets from the production
 * (parent-6) bank verbatim with a level re-tag — same content, new level
 * number. Some tricky words land at the "wrong" level under the new
 * pedagogy (e.g. "he/she/we" in old L2 → now better-placed at L3) but
 * we preserve every item to avoid data loss; refinement is a follow-up.
 */

export type Category =
  | 'sound_recognition'
  | 'word_reading'
  | 'alien_words'
  | 'tricky_words'
  | 'speedy_reading'
  | 'fluency';

export interface AssessmentItem {
  level: number;
  category: Category;
  item: string;
  targetGrapheme?: string;
  sortOrder: number;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  sound_recognition: 'Sounds',
  word_reading: 'Real Words',
  alien_words: 'Alien Words',
  tricky_words: 'Tricky Words',
  speedy_reading: 'Speedy Reading',
  fluency: 'Fluency',
};

interface ItemBlock {
  category: Category;
  items: Array<string | { item: string; grapheme?: string }>;
}

function makeItems(level: number, blocks: ItemBlock[], counter: { n: number }): AssessmentItem[] {
  const out: AssessmentItem[] = [];
  for (const block of blocks) {
    for (const raw of block.items) {
      if (typeof raw === 'string') {
        out.push({
          level,
          category: block.category,
          item: raw,
          targetGrapheme: block.category === 'sound_recognition' ? raw : undefined,
          sortOrder: ++counter.n,
        });
      } else {
        out.push({
          level,
          category: block.category,
          item: raw.item,
          targetGrapheme: block.category === 'sound_recognition' ? (raw.grapheme ?? raw.item) : undefined,
          sortOrder: ++counter.n,
        });
      }
    }
  }
  return out;
}

export const ASSESSMENT_ITEMS: AssessmentItem[] = (() => {
  const o = { n: 0 };
  return [
    // ── L1 Ditties (NEW) ─────────────────────────────────────────────
    ...makeItems(1, [
      { category: 'sound_recognition', items: ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o'] },
      { category: 'word_reading',      items: ['sat', 'pin', 'dog', 'mop', 'dig', 'nit', 'tap', 'tip', 'nip', 'pan'] },
      { category: 'alien_words',       items: ['pid', 'gom', 'sot', 'nid', 'mig', 'tog', 'dap', 'nop', 'gip', 'sim'] },
      { category: 'tricky_words',      items: ['I', 'the'] },
    ], o),

    // ── L2 First Sounds (NEW) ────────────────────────────────────────
    ...makeItems(2, [
      { category: 'sound_recognition', items: ['c', 'k', 'ck', 'e', 'u', 'r', 'h', 'b', 'f', 'ff', 'l', 'll', 'ss'] },
      { category: 'word_reading',      items: ['duck', 'bell', 'huff', 'jet', 'web', 'fox', 'cup', 'red', 'log', 'kiss'] },
      { category: 'alien_words',       items: ['veck', 'zuff', 'rell', 'hib', 'lub', 'fick', 'joss', 'wug', 'yat', 'beff'] },
      { category: 'tricky_words',      items: ['no', 'go', 'to', 'into', 'is'] },
    ], o),

    // ── L3 Special Friends (NEW) ─────────────────────────────────────
    ...makeItems(3, [
      { category: 'sound_recognition', items: ['sh', 'ch', 'th', 'ng', 'nk', 'qu', 'zz'] },
      { category: 'word_reading',      items: ['ship', 'chop', 'thin', 'ring', 'bank', 'quick', 'buzz', 'fish', 'rush', 'much'] },
      { category: 'alien_words',       items: ['shog', 'chib', 'thup', 'ning', 'zonk', 'quab', 'theng', 'shuck', 'chid', 'nunk'] },
      { category: 'tricky_words',      items: ['he', 'she', 'we', 'me', 'be'] },
    ], o),

    // ── L4 Longer Sounds (lifted from old L2) ────────────────────────
    ...makeItems(4, [
      {
        category: 'sound_recognition',
        items: [
          { item: 'ay' }, { item: 'ee' }, { item: 'igh' },
          { item: 'ow (blow)' }, { item: 'ow (cow)' },
          { item: 'oo (moon)' }, { item: 'oo (look)' },
          { item: 'ar' }, { item: 'or' }, { item: 'air' },
          { item: 'ir' }, { item: 'ou' }, { item: 'oy' },
        ],
      },
      { category: 'word_reading',   items: ['day', 'jeep', 'sight', 'low', 'cow', 'moon', 'look', 'park', 'fork', 'fair', 'fir', 'shout', 'boy'] },
      { category: 'alien_words',    items: ['tay', 'deeg', 'migh', 'gow', 'yow', 'hoond', 'jook', 'narp', 'mork', 'gair', 'zir', 'fout', 'noy'] },
      { category: 'tricky_words',   items: ['was', 'my', 'you', 'they', 'her', 'all', 'are', 'said', 'your', 'put'] },
      { category: 'speedy_reading', items: ['with', 'off', 'thin', 'will', 'his', 'them', 'that', 'have', 'long', 'this', 'back', 'much'] },
    ], o),

    // ── L5 New Spellings (lifted from old L3) ────────────────────────
    ...makeItems(5, [
      {
        category: 'sound_recognition',
        items: [
          { item: 'ea' }, { item: 'a-e' }, { item: 'i-e' }, { item: 'o-e' }, { item: 'u-e' },
          { item: 'oi' }, { item: 'aw' }, { item: 'ai' }, { item: 'oa' }, { item: 'ie' },
        ],
      },
      { category: 'word_reading',   items: ['cake', 'bike', 'stone', 'flute', 'coin', 'straw', 'snail', 'boat', 'pie', 'reach'] },
      { category: 'alien_words',    items: ['grafe', 'stime', 'broak', 'cloi', 'frawl', 'snaid', 'bleam', 'dripe', 'joap', 'spie'] },
      { category: 'tricky_words',   items: ['said', 'so', 'have', 'like', 'some', 'come', 'were', 'there', 'little', 'one', 'do', 'when', 'out', 'what'] },
      { category: 'speedy_reading', items: ['lots', 'black', 'went', 'stop', 'green', 'tree', 'make', 'came', 'play', 'round', 'feel', 'about'] },
    ], o),

    // ── L6 Building Fluency (lifted from old L4) ─────────────────────
    ...makeItems(6, [
      { category: 'sound_recognition', items: [{ item: 'are' }, { item: 'ur' }, { item: 'er' }, { item: 'ew' }, { item: 'ue' }] },
      { category: 'word_reading',      items: ['stare', 'turn', 'fern', 'chew', 'true', 'brown', 'turnip', 'market', 'flower'] },
      { category: 'alien_words',       items: ['skare', 'clurn', 'blert', 'brewn', 'plue', 'jown', 'norp', 'pight', 'clow', 'zair'] },
      { category: 'tricky_words',      items: ['oh', 'their', 'people', 'Mr', 'Mrs', 'looked', 'called', 'asked', 'could'] },
      { category: 'speedy_reading',    items: ['rest', 'smell', 'soft', 'stay', 'which', 'first', 'your', 'down', 'house', 'after', 'every', 'other'] },
    ], o),

    // ── L7 Reading Together (lifted from old L5) ─────────────────────
    ...makeItems(7, [
      {
        category: 'sound_recognition',
        items: [
          { item: 'ore' }, { item: 'oor' }, { item: 'ire' }, { item: 'ear' }, { item: 'ure' },
          { item: 'tion' }, { item: 'ph' }, { item: 'kn' }, { item: 'wr' },
        ],
      },
      { category: 'word_reading',   items: ['shore', 'floor', 'fire', 'near', 'sure', 'station', 'phone', 'knee', 'write'] },
      { category: 'alien_words',    items: ['blore', 'gloor', 'brire', 'snear', 'plure', 'tration', 'phest', 'knib', 'wrop'] },
      { category: 'tricky_words',   items: ['does', 'could', 'would', 'anyone', 'over', 'through', 'once', 'whole', 'people', 'water', 'though', 'knew', 'woman'] },
      { category: 'speedy_reading', items: ['thing', 'right', 'night', 'sleep', 'know', 'quick', 'little', 'think', 'smart', 'more', 'before', 'people'] },
    ], o),

    // ── L8 Reading Champion (lifted from old L6) ─────────────────────
    ...makeItems(8, [
      { category: 'sound_recognition', items: [{ item: '-ous' }, { item: '-cious' }, { item: '-tious' }, { item: '-able' }, { item: '-ible' }] },
      { category: 'word_reading',      items: ['famous', 'precious', 'cautious', 'readable', 'terrible', 'incredible', 'suspicious'] },
      { category: 'alien_words',       items: ['parvous', 'fricious', 'bontious', 'strable', 'plendible', 'marcious', 'gantible'] },
      { category: 'tricky_words',      items: ['should', 'many', 'above', 'father', 'son', 'mother', 'buy', 'bought', 'great', 'caught', 'worse', 'love', 'wear', 'thought', 'everyone', 'walk', 'talk'] },
      { category: 'speedy_reading',    items: ['comfortable', 'invisible', 'operation', 'tomorrow', 'serious', 'remember', 'enormous', 'beautiful', 'different', 'important'] },
    ], o),
  ];
})();

export function getAssessmentItems(level: number, category: Category): AssessmentItem[] {
  return ASSESSMENT_ITEMS.filter((i) => i.level === level && i.category === category);
}
