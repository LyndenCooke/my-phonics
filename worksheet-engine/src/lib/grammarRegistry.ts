import type { GrammarUnit, GrammarBookletMeta } from '@/data/grammarSchema';

import l1 from '@/data/grammar/l1';
import l2 from '@/data/grammar/l2';
import l3 from '@/data/grammar/l3';
import l4 from '@/data/grammar/l4';
import l5 from '@/data/grammar/l5';
import l6, { bookletMeta as l6Meta } from '@/data/grammar/l6';
import l7 from '@/data/grammar/l7';
import l8 from '@/data/grammar/l8';

// ---------------------------------------------------------------------------
// GRAMMAR REGISTRY — maps unit id -> grammar unit data, across all 8 levels.
// Each level is its OWN booklet (its own page numbers); L6 is the hand-built
// exemplar, the rest are specialist-authored drafts (scripts/author_grammar.py).
// ---------------------------------------------------------------------------

const BY_LEVEL: Record<number, GrammarUnit[]> = { 1: l1, 2: l2, 3: l3, 4: l4, 5: l5, 6: l6, 7: l7, 8: l8 };
const ALL: GrammarUnit[] = [l1, l2, l3, l4, l5, l6, l7, l8].flat();

// Booklet front/back matter, per level. Only L6 is assembled today; other levels
// are added here as their packs are authored.
const BOOKLET_META: Record<number, GrammarBookletMeta> = { 6: l6Meta };

/** The number of front-matter pages before the first worksheet (cover, contents,
 *  how-to). The first unit sheet is therefore page 4. */
export const FRONT_MATTER = 3;

export const GRAMMAR_UNITS: Record<string, GrammarUnit> = Object.fromEntries(
  ALL.map((u) => [u.id, u]),
);

export function getGrammarUnit(id: string): GrammarUnit | undefined {
  return GRAMMAR_UNITS[id];
}

/** Booklet page number for a unit, computed PER LEVEL (each level is its own
 *  booklet). Front matter (cover · contents · how-to) is pages 1–3, so the
 *  first worksheet of a level is page 4. */
export function getGrammarPage(id: string): number {
  const u = GRAMMAR_UNITS[id];
  if (!u) return 1;
  const within = (BY_LEVEL[u.level] ?? []).findIndex((x) => x.id === id);
  return FRONT_MATTER + 1 + Math.max(0, within);
}

/** Every grammar unit in the {book, sheet} shape the PDF script uses. */
export function allGrammarSheets(): { book: string; sheet: string }[] {
  return ALL.map((u) => ({ book: 'grammar', sheet: u.id }));
}

/** The booklet front/back matter for a level (undefined until authored). */
export function getBookletMeta(level: number): GrammarBookletMeta | undefined {
  return BOOKLET_META[level];
}

/** The units of a level in page order (the review unit, if any, sits last). */
export function getBookletUnits(level: number): GrammarUnit[] {
  return BY_LEVEL[level] ?? [];
}

/** The fixed page numbers of the back matter for a level's booklet. The booklet
 *  ends on Answers — there is no certificate page. */
export function getBackMatterPages(level: number): { answers: number } {
  const n = getBookletUnits(level).length;
  const answers = FRONT_MATTER + 1 + n; // after the last unit page
  return { answers };
}

/** Look a unit up by its display code, e.g. "G-L6.1". */
export function getGrammarUnitByCode(code: string): GrammarUnit | undefined {
  return ALL.find((u) => u.code === code);
}

/** Resolve the display text of a reused review item by pointer (sourceUnit code
 *  + 0-based rowRef). The review page carries NO new decodable text — it shows
 *  only sentences already approved in the seven units. */
export function resolveReviewText(sourceUnit: string, rowRef: number): string {
  const u = getGrammarUnitByCode(sourceUnit);
  if (!u) return '';
  switch (u.format) {
    case 'tickgrid':
      return u.tickgrid.rows[rowRef]?.text ?? '';
    case 'build':
      return u.build.rows[rowRef]?.base ?? '';
    case 'cloze': {
      const r = u.cloze.rows[rowRef];
      return r ? `${r.before} ___ ${r.after}` : '';
    }
    case 'circle':
      return u.circle.rows[rowRef]?.text ?? '';
    case 'match': {
      const p = u.match.pairs[rowRef];
      return p ? p.left : '';
    }
    case 'rewrite':
      return u.rewrite.rows[rowRef]?.text ?? '';
    default:
      return '';
  }
}
