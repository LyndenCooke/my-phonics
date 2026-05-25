/**
 * Source-of-truth for the school-8 level structure.
 *
 * All values come from the Curriculum Ledger v2.0
 * (`myphonics_books/output/worksheet_plan/CURRICULUM_LEDGER.md`).
 *
 * Strictly NO imports from src/lib — this directory must stay self-contained
 * so it can be lifted into a standalone Vite app later.
 */

export interface SchoolLevel {
  level: number;
  name: string;
  colourName: string;
  hex: string;
  ageRange: string;
  rwiBand: string;
  phaseLabel: string;
  gpcs: string[];           // grapheme-phoneme correspondences taught at this level
  trickyWordsNew: string[]; // tricky words newly introduced
  decodableRule: string;
  sentenceLength: string;
  bookCount: number;        // for the dashboard summary
}

export const SCHOOL_LEVELS: SchoolLevel[] = [
  {
    level: 1,
    name: 'Ditties',
    colourName: 'Pink',
    hex: '#E84B8A',
    ageRange: 'Ages 4–5',
    rwiBand: 'Early Set 1 / Sound Blending 1–4',
    phaseLabel: 'Phase 2 (Sets 1–2)',
    gpcs: ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o'],
    trickyWordsNew: ['I', 'the'],
    decodableRule: 'VC or CVC words from the 10 GPCs. No clusters, digraphs, or doubles.',
    sentenceLength: '3–5 words',
    bookCount: 2,
  },
  {
    level: 2,
    name: 'First Sounds',
    colourName: 'Coral',
    hex: '#F97066',
    ageRange: 'Ages 4–5',
    rwiBand: 'Set 1 singles + doubles / Sound Blending 5–7',
    phaseLabel: 'Phase 2 (Sets 3–5)',
    gpcs: ['c', 'k', 'ck', 'e', 'u', 'r', 'h', 'b', 'f', 'ff', 'l', 'll', 'ss', 'j', 'v', 'w', 'x', 'y', 'z'],
    trickyWordsNew: ['no', 'go', 'to', 'into', 'is'],
    decodableRule: 'CVC and CVCC words using all single-letter GPCs and ck. Double-letter endings (ff, ll, ss) permitted.',
    sentenceLength: '3–6 words',
    bookCount: 5,
  },
  {
    level: 3,
    name: 'Special Friends',
    colourName: 'Amber',
    hex: '#F59E0B',
    ageRange: 'Ages 4–5',
    rwiBand: 'Set 1 special friends / Red Ditty',
    phaseLabel: 'Phase 3 (consonant digraphs) + Phase 4',
    gpcs: ['sh', 'nk', 'ch', 'th', 'ng', 'qu', 'zz'],
    trickyWordsNew: ['he', 'she', 'we', 'me', 'be'],
    decodableRule: 'CVC, CVCC and CCVC words. Adjacent consonant clusters permitted (stop, frog, crisp).',
    sentenceLength: '4–7 words',
    bookCount: 3,
  },
  {
    level: 4,
    name: 'Longer Sounds',
    colourName: 'Green',
    hex: '#22C55E',
    ageRange: 'Ages 4–6',
    rwiBand: 'Set 2 / Pink + Orange',
    phaseLabel: 'Phase 3 (vowel digraphs)',
    gpcs: ['ay', 'ee', 'igh', 'ow (blow)', 'oo (zoo)', 'oo (look)', 'ar', 'or', 'air', 'ir', 'ou', 'oy'],
    trickyWordsNew: ['was', 'my', 'you', 'they', 'her', 'all', 'are'],
    decodableRule: 'All taught GPCs including vowel digraphs and trigraph igh. Two-syllable decodable words introduced.',
    sentenceLength: '4–8 words',
    bookCount: 6,
  },
  {
    level: 5,
    name: 'New Spellings',
    colourName: 'Blue',
    hex: '#3B82F6',
    ageRange: 'Ages 5–6',
    rwiBand: 'Early Set 3 / Yellow + Blue',
    phaseLabel: 'Phase 5 (split digraphs + first alternatives)',
    gpcs: ['a-e', 'i-e', 'o-e', 'u-e', 'ea', 'ie', 'oi', 'aw', 'ai', 'oa'],
    trickyWordsNew: ['said', 'so', 'have', 'like', 'some', 'come', 'were', 'there', 'little', 'one', 'do', 'when', 'out', 'what'],
    decodableRule: 'Previously taught GPCs plus split digraphs and first alternative spellings. Multi-syllable increasingly common.',
    sentenceLength: '5–10 words',
    bookCount: 5,
  },
  {
    level: 6,
    name: 'Building Fluency',
    colourName: 'Indigo',
    hex: '#6366F1',
    ageRange: 'Ages 5–7',
    rwiBand: 'Set 3 continued / Grey 1–8',
    phaseLabel: 'Phase 5 (alternatives + consonant alternatives)',
    gpcs: ['ur', 'er', 'are', 'ow (brown)', 'ew', 'ue', 'wr', 'kn', 'ge', 'dge', 'mb', 'gn', 'ph', 'wh'],
    trickyWordsNew: ['oh', 'their', 'people', 'Mr', 'Mrs', 'looked', 'called', 'asked', 'could'],
    decodableRule: 'Full Phase 5 repertoire including consonant alternatives and alternative pronunciations of known graphemes.',
    sentenceLength: '6–12 words, occasional compound',
    bookCount: 4,
  },
  {
    level: 7,
    name: 'Reading Together',
    colourName: 'Purple',
    hex: '#8B5CF6',
    ageRange: 'Ages 6–7',
    rwiBand: 'Grey 9–11',
    phaseLabel: 'Phase 5 (late) – Phase 6 (trigraphs)',
    gpcs: ['ire', 'ore', 'ear', 'oor', 'ure', 'tion'],
    trickyWordsNew: ['door', 'floor', 'poor', 'because', 'find', 'kind', 'mind', 'behind', 'child', 'children', 'wild', 'climb', 'most', 'only', 'both', 'old', 'cold', 'gold', 'hold', 'told', 'every', 'everybody', 'even', 'great', 'break', 'steak', 'pretty', 'beautiful', 'after', 'fast', 'last', 'past', 'father', 'class', 'grass', 'pass', 'plant', 'path', 'bath'],
    decodableRule: 'Full Phase 5 repertoire including trigraphs. Complex sentence structures expected.',
    sentenceLength: '8–15 words, compound and complex',
    bookCount: 4,
  },
  {
    level: 8,
    name: 'Reading Champion',
    colourName: 'Teal',
    hex: '#14B8A6',
    ageRange: 'Ages 6–8',
    rwiBand: 'Grey 12–13',
    phaseLabel: 'Phase 6 (suffix morphology)',
    gpcs: ['-ous', '-cious', '-tious', '-able', '-ible'],
    trickyWordsNew: ['hour', 'move', 'prove', 'improve', 'sure', 'sugar', 'eye', 'could', 'should', 'would', 'who', 'whole', 'any', 'many', 'clothes', 'busy', 'people', 'water', 'again', 'half', 'money', 'Mr', 'Mrs', 'parents', 'Christmas'],
    decodableRule: 'Full Phase 5 GPC repertoire plus Phase 6 morphology. Suffix and root changes are explicit teaching points.',
    sentenceLength: 'Varied, including sentence-variety techniques',
    bookCount: 4,
  },
];

export const SCHOOL_LEVEL_COUNT = SCHOOL_LEVELS.length;

export function getSchoolLevel(level: number): SchoolLevel | undefined {
  return SCHOOL_LEVELS.find((l) => l.level === level);
}

/** Age-expectation table used by the assessment results screen. */
export interface AgeExpectation {
  age: string;
  yearGroup: string;
  expectedLevel: string;
  belowExpectations: string;
  aboveExpectations: string;
}

export const AGE_EXPECTATIONS: AgeExpectation[] = [
  { age: '4–4.5', yearGroup: 'Reception (Autumn)',          expectedLevel: 'Level 1',     belowExpectations: 'N/A (starting point)', aboveExpectations: 'Level 2' },
  { age: '4.5–5', yearGroup: 'Reception (Spring/Summer)',   expectedLevel: 'Level 1–3',   belowExpectations: 'Still on Level 1',     aboveExpectations: 'Level 4' },
  { age: '5–5.5', yearGroup: 'Year 1 (Autumn)',             expectedLevel: 'Level 3–4',   belowExpectations: 'Level 1–2',            aboveExpectations: 'Level 5' },
  { age: '5.5–6', yearGroup: 'Year 1 (Spring/Summer)',      expectedLevel: 'Level 4–5',   belowExpectations: 'Level 1–3',            aboveExpectations: 'Level 6' },
  { age: '6–7',   yearGroup: 'Year 2',                      expectedLevel: 'Level 5–7',   belowExpectations: 'Level 1–4',            aboveExpectations: 'Level 8' },
  { age: '7–8',   yearGroup: 'Year 3',                      expectedLevel: 'Level 7–8',   belowExpectations: 'Level 1–6',            aboveExpectations: 'Beyond Level 8' },
];

/** Adaptive-assessment pass thresholds (percentages, fluency in wpm). */
export interface PassCriteria {
  sounds: number;
  words: number;
  alien: number;
  tricky: number;
  fluency?: number;
}

export const PASS_CRITERIA: Record<number, PassCriteria> = {
  1: { sounds: 90, words: 85, alien: 75, tricky: 70 },
  2: { sounds: 90, words: 85, alien: 75, tricky: 70 },
  3: { sounds: 90, words: 85, alien: 75, tricky: 70 },
  4: { sounds: 90, words: 85, alien: 75, tricky: 70 },
  5: { sounds: 90, words: 85, alien: 75, tricky: 70, fluency: 90 },
  6: { sounds: 90, words: 85, alien: 75, tricky: 70, fluency: 90 },
  7: { sounds: 90, words: 85, alien: 75, tricky: 70, fluency: 100 },
  8: { sounds: 90, words: 85, alien: 75, tricky: 70, fluency: 110 },
};
