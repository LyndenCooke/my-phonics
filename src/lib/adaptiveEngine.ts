/**
 * Adaptive Assessment Engine
 *
 * Finds the child's phonics level as quickly as possible using:
 * 1. Screening: 6 words → starting level
 * 2. Tranche sampling: 3-item probes → pass/fail/continue
 * 3. Level confidence: early pass/fail after 2-3 categories
 * 4. Sound map: green/red/grey circles for results
 */

import type { Category } from './assessmentData';
import { ASSESSMENT_ITEMS, PASS_CRITERIA, getItems } from './assessmentData';

// ─── Screening ───────────────────────────────────────────────

export const SCREENING_WORDS = [
  { level: 1, word: 'fish' },
  { level: 2, word: 'park' },
  { level: 3, word: 'cake' },
  { level: 4, word: 'flower' },
  { level: 5, word: 'station' },
  { level: 6, word: 'incredible' },
];

/**
 * Determine starting level from screening ticks.
 * Returns the highest consecutive ticked level (min 1, max 5).
 * If all ticked → start at L5 (still verify top).
 */
export function calculateStartLevel(checks: Record<number, boolean>): number {
  let highest = 0;
  for (let level = 1; level <= 6; level++) {
    if (checks[level]) {
      highest = level;
    } else {
      break; // Gap found — stop at the gap
    }
  }
  // Start AT the highest passed level (to confirm it), cap at 5
  return Math.max(1, Math.min(highest, 5));
}

// ─── Tranche Logic ───────────────────────────────────────────

export type TrancheDecision = 'pass' | 'fail' | 'continue';

const TRANCHE_SIZE = 3;
const SMALL_CATEGORY_THRESHOLD = 6;

/**
 * Check if a category is small enough to test all items (no tranching).
 */
export function isSmallCategory(level: number, category: Category): boolean {
  const items = getItems(level, category);
  return items.length <= SMALL_CATEGORY_THRESHOLD;
}

/**
 * Get the items for a specific tranche within a category.
 * Tranche 1 = first 3, Tranche 2 = next 3, Tranche 3 = remainder.
 * For small categories, returns all items in tranche 1.
 */
export function getTrancheItems(level: number, category: Category, tranche: number) {
  const allItems = getItems(level, category);

  if (isSmallCategory(level, category)) {
    return tranche === 1 ? allItems : [];
  }

  const start = (tranche - 1) * TRANCHE_SIZE;
  if (tranche <= 2) {
    return allItems.slice(start, start + TRANCHE_SIZE);
  }
  // Tranche 3 = everything after first 6
  return allItems.slice(TRANCHE_SIZE * 2);
}

/**
 * Evaluate whether a tranche result means pass, fail, or continue.
 */
export function evaluateTranche(
  tranche: number,
  trancheCorrect: number,
  trancheTotal: number,
  cumulativeCorrect: number,
  cumulativeTotal: number,
): TrancheDecision {
  if (tranche === 1) {
    if (trancheCorrect === trancheTotal) return 'pass';   // 3/3 → skip
    if (trancheCorrect === 0) return 'fail';              // 0/3 → skip
    return 'continue';                                     // mixed → tranche 2
  }

  if (tranche === 2) {
    if (cumulativeCorrect >= cumulativeTotal - 1) return 'pass';  // 5-6/6
    if (cumulativeCorrect <= 2) return 'fail';                     // 0-2/6
    return 'continue';                                              // 3-4/6 → tranche 3
  }

  // Tranche 3: always finishes (3-wrong rule handles early exit)
  return 'continue';
}

// ─── Level Confidence ────────────────────────────────────────

export type LevelConfidence = 'clearly-passing' | 'borderline' | 'clearly-failing';

export interface CategoryResult {
  category: Category;
  correct: number;
  total: number;
  percentage: number;
  passed: boolean;
}

/**
 * Get the pass threshold for a category.
 */
export function getCategoryThreshold(level: number, category: Category): number {
  const criteria = PASS_CRITERIA[level];
  switch (category) {
    case 'sound_recognition': return criteria.sounds;
    case 'word_reading': return criteria.words;
    case 'alien_words': return criteria.alien;
    case 'tricky_words': return criteria.tricky;
    default: return 0;
  }
}

/**
 * Check level confidence after each completed category.
 * Returns action: 'auto-pass', 'stop-fail', or 'continue'.
 */
export function checkLevelConfidence(
  completedCategories: CategoryResult[],
  totalCategories: number,
): 'auto-pass' | 'stop-fail' | 'continue' {
  const count = completedCategories.length;
  const passedCount = completedCategories.filter(c => c.passed).length;
  const failedCount = count - passedCount;

  // First 2 categories both failed → stop
  if (count >= 2 && failedCount === count) return 'stop-fail';

  // 3+ categories all passed → auto-pass
  if (count >= 3 && passedCount === count) return 'auto-pass';

  // 3+ categories with 2+ failed → stop
  if (count >= 3 && failedCount >= 2) return 'stop-fail';

  return 'continue';
}

// ─── Sound Map ───────────────────────────────────────────────

export interface SoundStatus {
  grapheme: string;
  displayName: string;
  level: number;
  status: 'known' | 'unknown' | 'untested';
}

export interface ResultItem {
  item: string;
  level: number;
  category: Category;
  status: 'known' | 'unknown' | 'untested';
}

export interface Answer {
  level: number;
  category: Category;
  item: string;
  isCorrect: boolean;
}

export interface LevelScore {
  level: number;
  categories: CategoryResult[];
  passed: boolean;
  fluencyWpm?: number;
  autoAdvanced?: boolean;  // level was auto-passed via confidence
}

/**
 * Build the sound map for final results.
 * Levels below screening start are marked 'untested' (not assumed known).
 */
export function buildSoundMap(
  answers: Answer[],
  levelScores: LevelScore[],
  startLevel: number,
): SoundStatus[] {
  const allSounds = ASSESSMENT_ITEMS.filter(i => i.category === 'sound_recognition');

  return allSounds.map(sound => {
    // Check if this sound was directly tested
    const answer = answers.find(
      a => a.level === sound.level && a.category === 'sound_recognition' && a.item === sound.item
    );
    if (answer) {
      return {
        grapheme: sound.targetGrapheme || sound.item,
        displayName: sound.item,
        level: sound.level,
        status: answer.isCorrect ? 'known' as const : 'unknown' as const,
      };
    }

    // Level passed (including auto-advance) but sound not directly tested → assumed known
    const levelScore = levelScores.find(ls => ls.level === sound.level);
    if (levelScore?.passed) {
      return { grapheme: sound.targetGrapheme || sound.item, displayName: sound.item, level: sound.level, status: 'known' as const };
    }

    // Everything else is untested (skipped via screening OR above fail point)
    return { grapheme: sound.targetGrapheme || sound.item, displayName: sound.item, level: sound.level, status: 'untested' as const };
  });
}

/**
 * Build a full results map across all categories (sounds, words, alien words, tricky words).
 * Groups results by level and category for display.
 */
export function buildResultsMap(
  answers: Answer[],
  levelScores: LevelScore[],
): ResultItem[] {
  const testableCategories: Category[] = ['sound_recognition', 'word_reading', 'alien_words', 'tricky_words'];
  const allItems = ASSESSMENT_ITEMS.filter(i => testableCategories.includes(i.category));

  return allItems.map(item => {
    // Check if directly tested
    const answer = answers.find(
      a => a.level === item.level && a.category === item.category && a.item === item.item
    );
    if (answer) {
      return {
        item: item.item,
        level: item.level,
        category: item.category,
        status: answer.isCorrect ? 'known' as const : 'unknown' as const,
      };
    }

    // Level passed but item not directly tested → assumed known
    const levelScore = levelScores.find(ls => ls.level === item.level);
    if (levelScore?.passed) {
      return { item: item.item, level: item.level, category: item.category, status: 'known' as const };
    }

    return { item: item.item, level: item.level, category: item.category, status: 'untested' as const };
  });
}

// ─── Helpers ─────────────────────────────────────────────────

export const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-pink-500',
  2: 'bg-amber-500',
  3: 'bg-green-500',
  4: 'bg-blue-500',
  5: 'bg-purple-500',
  6: 'bg-teal-500',
};

export const LEVEL_NAMES_SHORT: Record<number, string> = {
  1: 'Starting Stories',
  2: 'Longer Sounds',
  3: 'New Spellings',
  4: 'Building Fluency',
  5: 'Reading Together',
  6: 'Reading Champion',
};
