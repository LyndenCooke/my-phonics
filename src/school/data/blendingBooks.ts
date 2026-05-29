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
  id: string;              // BB-L{level}.{globalSeq2} — e.g. BB-L4.08
  level: number;
  bookNumber: number;      // 1..12 globally across the curriculum
  title: string;
  focus: string;           // what the book practises
  graphemes: string[];     // GPCs covered
}

const bbId = (level: number, bookNumber: number): string =>
  `BB-L${level}.${String(bookNumber).padStart(2, '0')}`;

const mk = (
  level: number,
  bookNumber: number,
  title: string,
  focus: string,
  graphemes: string[],
): BlendingBook => ({ id: bbId(level, bookNumber), level, bookNumber, title, focus, graphemes });

export const BLENDING_BOOKS: BlendingBook[] = [
  // L1 — 2 books
  mk(1, 1, 'Blending Book 1 — s a t p',     'CVC with s, a, t, p',         ['s', 'a', 't', 'p']),
  mk(1, 2, 'Blending Book 2 — SATPIN + MDGO', 'CVC with all 10 L1 sounds', ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o']),

  // L2 — 3 books
  mk(2, 3, 'Blending Book 3 — c k ck e u r h b', 'CVC with c, k, ck, e, u, r, h, b', ['c', 'k', 'ck', 'e', 'u', 'r', 'h', 'b']),
  mk(2, 4, 'Blending Book 4 — f l j v w x y z',  'CVC with f, l, j, v, w, x, y, z',  ['f', 'l', 'j', 'v', 'w', 'x', 'y', 'z']),
  mk(2, 5, 'Blending Book 5 — ff ll ss doubles', 'CVC + double-letter endings',      ['ff', 'll', 'ss']),

  // L3 — 2 books
  mk(3, 6, 'Blending Book 6 — sh ch th digraphs', 'CVCC/CCVC with consonant digraphs', ['sh', 'ch', 'th']),
  mk(3, 7, 'Blending Book 7 — nk ng qu',          'Words ending in nk/ng + qu words',  ['nk', 'ng', 'qu']),

  // L4 — 3 books
  mk(4, 8,  'Blending Book 8 — ay ee igh',                'Vowel digraphs (set 1)', ['ay', 'ee', 'igh']),
  mk(4, 9,  'Blending Book 9 — ow (blow) oo ar or',       'Vowel digraphs (set 2)', ['ow (blow)', 'oo (zoo)', 'oo (look)', 'ar', 'or']),
  mk(4, 10, 'Blending Book 10 — air ir ou oy',            'Vowel digraphs (set 3)', ['air', 'ir', 'ou', 'oy']),

  // L5 — 2 books
  mk(5, 11, 'Blending Book 11 — split digraphs',  'a-e, i-e, o-e, u-e',     ['a-e', 'i-e', 'o-e', 'u-e']),
  mk(5, 12, 'Blending Book 12 — alt spellings',   'ea, ie, oi, aw, ai, oa', ['ea', 'ie', 'oi', 'aw', 'ai', 'oa']),

  // L6-L8 — no Blending Books; children are fluent enough at this point.
];

export function getBlendingBooksByLevel(level: number): BlendingBook[] {
  return BLENDING_BOOKS.filter((b) => b.level === level);
}

export function getBlendingBookById(id: string): BlendingBook | undefined {
  return BLENDING_BOOKS.find((b) => b.id === id);
}

export const BLENDING_BOOK_TOTAL = BLENDING_BOOKS.length; // 12
