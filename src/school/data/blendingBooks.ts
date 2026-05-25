/**
 * Blending Books — 12 small (A6) illustrated practice books.
 *
 * These are the "pre-ditty" / pre-storybook blending practice.
 * Format inspired by Read Write Inc Sound Blending Books: child sees
 * the word on the right page, blends ("Fred Talks") it, then turns
 * the page and sees the same word with a cartoon illustration to
 * check. 5-8 words per book, progressing in difficulty.
 *
 * Used BEFORE the corresponding storybook for each level. Front-loads
 * the new GPCs so the storybook becomes a fluency read, not a
 * decoding struggle.
 *
 * Source: myphonics_books/output/worksheet_plan/curriculum_resource_plan.md
 * Section 1.2.
 */

export interface BlendingBook {
  level: number;
  bookNumber: number;   // 1..12 across the curriculum
  title: string;
  focus: string;        // what the book practises
  graphemes: string[];  // GPCs covered
}

export const BLENDING_BOOKS: BlendingBook[] = [
  // L1 — 2 books
  { level: 1, bookNumber: 1, title: 'Blending Book 1 — s a t p',     focus: 'CVC with s, a, t, p',           graphemes: ['s', 'a', 't', 'p'] },
  { level: 1, bookNumber: 2, title: 'Blending Book 2 — SATPIN + MDGO', focus: 'CVC with all 10 L1 sounds',   graphemes: ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o'] },

  // L2 — 3 books
  { level: 2, bookNumber: 3, title: 'Blending Book 3 — c k ck e u r h b', focus: 'CVC with c, k, ck, e, u, r, h, b', graphemes: ['c', 'k', 'ck', 'e', 'u', 'r', 'h', 'b'] },
  { level: 2, bookNumber: 4, title: 'Blending Book 4 — f l j v w x y z',  focus: 'CVC with f, l, j, v, w, x, y, z',  graphemes: ['f', 'l', 'j', 'v', 'w', 'x', 'y', 'z'] },
  { level: 2, bookNumber: 5, title: 'Blending Book 5 — ff ll ss doubles', focus: 'CVC + double-letter endings',      graphemes: ['ff', 'll', 'ss'] },

  // L3 — 2 books
  { level: 3, bookNumber: 6, title: 'Blending Book 6 — sh ch th digraphs', focus: 'CVCC/CCVC with consonant digraphs', graphemes: ['sh', 'ch', 'th'] },
  { level: 3, bookNumber: 7, title: 'Blending Book 7 — nk ng qu',          focus: 'Words ending in nk/ng + qu words',  graphemes: ['nk', 'ng', 'qu'] },

  // L4 — 3 books
  { level: 4, bookNumber: 8,  title: 'Blending Book 8 — ay ee igh',        focus: 'Vowel digraphs (set 1)', graphemes: ['ay', 'ee', 'igh'] },
  { level: 4, bookNumber: 9,  title: 'Blending Book 9 — ow oo ar or',      focus: 'Vowel digraphs (set 2)', graphemes: ['ow', 'oo', 'ar', 'or'] },
  { level: 4, bookNumber: 10, title: 'Blending Book 10 — air ir ou oy',    focus: 'Vowel digraphs (set 3)', graphemes: ['air', 'ir', 'ou', 'oy'] },

  // L5 — 2 books
  { level: 5, bookNumber: 11, title: 'Blending Book 11 — split digraphs',  focus: 'a-e, i-e, o-e, u-e',     graphemes: ['a-e', 'i-e', 'o-e', 'u-e'] },
  { level: 5, bookNumber: 12, title: 'Blending Book 12 — alt spellings',   focus: 'ea, ie, oi, aw, ai, oa', graphemes: ['ea', 'ie', 'oi', 'aw', 'ai', 'oa'] },

  // L6-L8 — no Blending Books; children are fluent enough at this point.
];

export function getBlendingBooksByLevel(level: number): BlendingBook[] {
  return BLENDING_BOOKS.filter((b) => b.level === level);
}

export const BLENDING_BOOK_TOTAL = BLENDING_BOOKS.length; // 12
