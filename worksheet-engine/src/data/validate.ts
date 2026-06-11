import type { BookData } from '@/data/schema';
import { LEVEL_THEMES } from '@/design/levelThemes';

// ---------------------------------------------------------------------------
// VALIDATION — fail loudly on bad data before it reaches a printed sheet.
// Run via `npm run validate`. Returns a list of human-readable problems; an
// empty list means the book is safe to render.
// ---------------------------------------------------------------------------

export interface ValidationIssue {
  level: 'error' | 'warning';
  message: string;
}

// Rough capacity limits for the locked layout. Longer content overflows boxes,
// so we flag it deterministically instead of letting it spill on the page.
const LIMITS = {
  maxMatchWords: 6,
  maxSortBins: 4,
  maxWordsPerBin: 5,
  maxWordLength: 9, // characters that still fit a trace cell at the set size
};

export function validateBook(book: BookData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const err = (m: string) => issues.push({ level: 'error', message: m });
  const warn = (m: string) => issues.push({ level: 'warning', message: m });

  // --- Level / theme -------------------------------------------------------
  if (!LEVEL_THEMES[book.level]) {
    err(`level ${book.level} has no theme — must be one of ${Object.keys(LEVEL_THEMES).join(', ')}`);
  }

  // --- Core fields present -------------------------------------------------
  if (!book.focusSounds?.length) err('focusSounds is empty');
  if (!book.decodableWords?.length) err('decodableWords is empty');

  const focus = new Set(book.focusSounds.map((s) => s.toLowerCase()));
  const wordSet = new Set(book.decodableWords.map((w) => w.word.toLowerCase()));

  // --- Per-word checks -----------------------------------------------------
  for (const { word, imageKey } of book.decodableWords) {
    if (!imageKey) warn(`word "${word}" has no imageKey — will render a placeholder box`);
    if (word.length > LIMITS.maxWordLength) {
      warn(`word "${word}" is ${word.length} chars — may overflow the trace cell (limit ${LIMITS.maxWordLength})`);
    }
    // Every letter of a decodable word should be a focus sound (or already taught).
    const stray = [...word.toLowerCase()].filter((ch) => !focus.has(ch));
    if (stray.length) {
      warn(`word "${word}" uses ${[...new Set(stray)].join(', ')} which are not in focusSounds`);
    }
  }

  // --- Match activity ------------------------------------------------------
  const match = book.config?.matchWords ?? [];
  if (book.activityTypes.includes('match-picture-word')) {
    if (match.length > LIMITS.maxMatchWords) {
      warn(`matchWords has ${match.length} items — page fits ${LIMITS.maxMatchWords}, the rest will overflow`);
    }
    for (const w of match) {
      if (!wordSet.has(w.toLowerCase())) err(`matchWords contains "${w}" which is not in decodableWords`);
    }
  }

  // --- Sort activity -------------------------------------------------------
  const bins = book.config?.sortBins ?? [];
  if (book.activityTypes.includes('sort-by-sound')) {
    if (!bins.length) err('sort-by-sound is active but config.sortBins is missing');
    if (bins.length > LIMITS.maxSortBins) {
      warn(`${bins.length} sort bins — page fits ${LIMITS.maxSortBins}, narrow columns will crowd`);
    }
    for (const bin of bins) {
      if (bin.words.length > LIMITS.maxWordsPerBin) {
        warn(`sort bin "${bin.sound}" has ${bin.words.length} words — fits ${LIMITS.maxWordsPerBin}`);
      }
      for (const w of bin.words) {
        if (!wordSet.has(w.toLowerCase())) err(`sort bin "${bin.sound}" contains "${w}" not in decodableWords`);
        if (!w.toLowerCase().startsWith(bin.sound.toLowerCase())) {
          warn(`"${w}" in bin "${bin.sound}" does not start with that sound`);
        }
      }
    }
  }

  return issues;
}
