/**
 * The 8-level reading journey — parent-app source of truth.
 *
 * Mirrors `src/school/data/levels.ts` + `sublevelMapping.ts` (which must stay
 * self-contained so the school module can be lifted out). Values come from the
 * Curriculum Ledger v2.0. The book catalogue in Supabase is still tagged with
 * the legacy parent-6 levels/sub-levels; `JOURNEY_SUBLEVEL_BY_LEGACY` places
 * each shipped book on the 8-level journey without touching the data layer.
 */

export interface JourneyLevel {
  level: number;
  name: string;
  colourName: string;
  /** Ledger banner colour. */
  hex: string;
  /** Darker same-hue ink for text on white (WCAG AA). */
  inkHex: string;
  ageRange: string;
  /** One-line parent-facing description of what this level teaches. */
  focus: string;
  /** Grapheme-phoneme correspondences taught at this level. */
  gpcs: string[];
  /** Tricky words newly introduced at this level. */
  trickyWords: string[];
}

export const JOURNEY_LEVELS: JourneyLevel[] = [
  {
    level: 1, name: 'Ditties', colourName: 'Pink', hex: '#E84B8A', inkHex: '#BE1862',
    ageRange: 'Ages 4–5', focus: 'First sounds and simple 3-letter words',
    gpcs: ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o'],
    trickyWords: ['I', 'the'],
  },
  {
    level: 2, name: 'First Sounds', colourName: 'Coral', hex: '#F97066', inkHex: '#C2362C',
    ageRange: 'Ages 4–5', focus: 'The rest of the alphabet, plus ck, ff, ll, ss',
    gpcs: ['c', 'k', 'ck', 'e', 'u', 'r', 'h', 'b', 'f', 'ff', 'l', 'll', 'ss', 'j', 'v', 'w', 'x', 'y', 'z'],
    trickyWords: ['no', 'go', 'to', 'into', 'is'],
  },
  {
    level: 3, name: 'Special Friends', colourName: 'Amber', hex: '#F59E0B', inkHex: '#92600A',
    ageRange: 'Ages 4–5', focus: 'Two letters, one sound — sh, ch, th, ng…',
    gpcs: ['sh', 'nk', 'ch', 'th', 'ng', 'qu', 'zz'],
    trickyWords: ['he', 'she', 'we', 'me', 'be'],
  },
  {
    level: 4, name: 'Longer Sounds', colourName: 'Green', hex: '#22C55E', inkHex: '#15803D',
    ageRange: 'Ages 4–6', focus: 'Vowel teams like ay, ee, igh, oo and ar',
    gpcs: ['ay', 'ee', 'igh', 'ow', 'oo', 'ar', 'or', 'air', 'ir', 'ou', 'oy'],
    trickyWords: ['was', 'my', 'you', 'they', 'her', 'all', 'are'],
  },
  {
    level: 5, name: 'New Spellings', colourName: 'Blue', hex: '#3B82F6', inkHex: '#1D4FD8',
    ageRange: 'Ages 5–6', focus: 'Split digraphs (a-e, i-e) and new spellings',
    gpcs: ['a-e', 'i-e', 'o-e', 'u-e', 'ea', 'ie', 'oi', 'aw', 'ai', 'oa'],
    trickyWords: ['said', 'so', 'have', 'like', 'some', 'come', 'were', 'there', 'little', 'one', 'do', 'when', 'out', 'what'],
  },
  {
    level: 6, name: 'Building Fluency', colourName: 'Indigo', hex: '#6366F1', inkHex: '#4338CA',
    ageRange: 'Ages 5–7', focus: 'Alternative spellings — wr, kn, ph, dge…',
    gpcs: ['ur', 'er', 'are', 'ow', 'ew', 'ue', 'wr', 'kn', 'ge', 'dge', 'mb', 'gn', 'ph', 'wh'],
    trickyWords: ['oh', 'their', 'people', 'Mr', 'Mrs', 'looked', 'called', 'asked', 'could'],
  },
  {
    level: 7, name: 'Reading Together', colourName: 'Purple', hex: '#8B5CF6', inkHex: '#6D3BD8',
    ageRange: 'Ages 6–7', focus: 'Trigraphs (ire, ore, ear) and -tion endings',
    gpcs: ['ire', 'ore', 'ear', 'oor', 'ure', 'tion'],
    trickyWords: ['because', 'find', 'kind', 'child', 'children', 'wild', 'most', 'only', 'both', 'old', 'every', 'great', 'pretty', 'beautiful', 'after', 'father'],
  },
  {
    level: 8, name: 'Reading Champion', colourName: 'Teal', hex: '#14B8A6', inkHex: '#0E7C70',
    ageRange: 'Ages 6–8', focus: 'Suffixes and word-building — -ous, -able, -ible',
    gpcs: ['-ous', '-cious', '-tious', '-able', '-ible'],
    trickyWords: ['hour', 'move', 'prove', 'sure', 'sugar', 'eye', 'should', 'would', 'who', 'whole', 'any', 'many', 'water', 'again', 'half', 'money', 'parents'],
  },
];

export const JOURNEY_LEVEL_COUNT = JOURNEY_LEVELS.length;

export function getJourneyLevel(level: number): JourneyLevel | undefined {
  return JOURNEY_LEVELS.find((l) => l.level === level);
}

/**
 * Legacy parent-6 sub_level (as stored in Supabase `books.sub_level`) →
 * journey-8 sub_level. Keep in sync with school/data/sublevelMapping.ts.
 */
export const JOURNEY_SUBLEVEL_BY_LEGACY: Record<string, string> = {
  'L1.1': 'L1.1', 'L1.2': 'L1.2',
  'L1.4': 'L2.1', 'L1.5': 'L2.2', 'L1.6': 'L2.3', 'L1.7': 'L2.4', 'L1.8': 'L2.5',
  'L1.3': 'L3.1', 'L1.9': 'L3.2', 'L1.10': 'L3.3',
  'L2.1': 'L4.1', 'L2.2': 'L4.2', 'L2.3': 'L4.3', 'L2.4': 'L4.4', 'L2.5': 'L4.5', 'L2.6': 'L4.6',
  'L3.1': 'L5.1', 'L3.2': 'L5.2', 'L3.3': 'L5.3', 'L3.4': 'L5.4', 'L3.5': 'L5.5',
  'L4.1': 'L6.1', 'L4.2': 'L6.2', 'L4.3': 'L6.3', 'L4.4': 'L6.4',
  'L5.1': 'L7.1', 'L5.2': 'L7.2', 'L5.3': 'L7.3', 'L5.4': 'L7.4',
  'L6.1': 'L8.1', 'L6.2': 'L8.2', 'L6.3': 'L8.3', 'L6.4': 'L8.4',
};

/**
 * Legacy parent-6 level ↔ journey-8 level conversion. The book catalogue in
 * Supabase is still tagged with legacy levels, so a handful of surfaces store
 * or receive legacy level numbers. These maps are the single source of truth
 * for crossing between the two scales; prefer them over inline copies.
 *
 *  - LEGACY → JOURNEY uses the FIRST journey level of each legacy band (the
 *    legacy L1 band split into journey L1–L3 resolves to L1 — Ditties).
 *  - JOURNEY → LEGACY collapses the journey L1–L3 split back onto legacy L1.
 *
 * Keep in step with `JOURNEY_SUBLEVEL_BY_LEGACY` above.
 */
export const LEGACY_TO_JOURNEY_LEVEL: Record<number, number> = {
  1: 1, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8,
};

export const JOURNEY_TO_LEGACY_LEVEL: Record<number, number> = {
  1: 1, 2: 1, 3: 1, 4: 2, 5: 3, 6: 4, 7: 5, 8: 6,
};

/** Journey level (1–8) for a stored legacy parent-6 level. */
export function journeyLevelOfLegacy(legacyLevel: number): number {
  return LEGACY_TO_JOURNEY_LEVEL[legacyLevel] ?? legacyLevel;
}

/** Legacy parent-6 level for a journey level (1–8), for legacy-tagged data. */
export function legacyLevelOfJourney(journeyLevel: number): number {
  return JOURNEY_TO_LEGACY_LEVEL[journeyLevel] ?? journeyLevel;
}

/** Parse "L4.3" → { level: 4, index: 3 }. Returns null for unknown shapes. */
export function parseSubLevel(subLevel: string): { level: number; index: number } | null {
  const m = /^L(\d+)\.(\d+)$/.exec(subLevel);
  if (!m) return null;
  return { level: Number(m[1]), index: Number(m[2]) };
}

/** Journey placement for a legacy sub_level; null if the book isn't mapped. */
export function journeyPlacement(legacySubLevel: string): { level: number; index: number; subLevel: string } | null {
  const mapped = JOURNEY_SUBLEVEL_BY_LEGACY[legacySubLevel];
  if (!mapped) return null;
  const parsed = parseSubLevel(mapped);
  if (!parsed) return null;
  return { ...parsed, subLevel: mapped };
}

/** Journey level (1–8) for a legacy sub_level, with a safe fallback to the
 *  legacy level number so unmapped books still render somewhere sensible. */
export function journeyLevelOf(legacySubLevel: string): number {
  return journeyPlacement(legacySubLevel)?.level
    ?? parseSubLevel(legacySubLevel)?.level
    ?? 1;
}

/** Sort key that orders books along the 8-level journey. */
export function journeySortKey(legacySubLevel: string): number {
  const p = journeyPlacement(legacySubLevel) ?? parseSubLevel(legacySubLevel) ?? { level: 9, index: 99 };
  return p.level * 100 + p.index;
}
