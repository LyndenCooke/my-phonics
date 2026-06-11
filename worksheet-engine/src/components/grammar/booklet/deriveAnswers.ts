import type { GrammarUnit } from '@/data/grammarSchema';

// Derive the answer-key line for a unit straight from its approved data, so the
// key never drifts from the sheet and carries no new text. One short string per
// unit, rendered under the unit heading on the answers page.

/** The word(s) that change between a source sentence and its corrected form. */
function diffWords(from: string, to: string): string {
  const a = from.split(/\s+/);
  const b = to.split(/\s+/);
  const changed: string[] = [];
  for (let i = 0; i < b.length; i += 1) {
    if (a[i] !== b[i]) changed.push(b[i].replace(/[.,!?]$/, ''));
  }
  return changed.join(' ');
}

export function deriveAnswers(unit: GrammarUnit): string {
  switch (unit.format) {
    case 'tickgrid': {
      const cats = unit.tickgrid.categories ?? unit.tickgrid.columns;
      return cats
        .map((cat) => {
          const nums = unit.tickgrid.rows
            .map((r, i) => (r.answer === cat ? i + 1 : null))
            .filter((n): n is number => n !== null);
          return nums.length ? `${cat} ${nums.join(', ')}.` : '';
        })
        .filter(Boolean)
        .join(' ');
    }
    case 'build':
      return unit.build.rows.map((r) => r.answer).join('; ') + '.';
    case 'cloze':
      return unit.cloze.rows.map((r) => r.answer).join('; ') + '.';
    case 'circle':
      return unit.circle.rows
        .map((r) => {
          const adj = r.finds.find((f) => f.target === 'adjective')?.word ?? '';
          const adv = r.finds.find((f) => f.target === 'adverb')?.word ?? '';
          return adj && adv ? `${adj} and ${adv}` : [adj, adv].filter(Boolean).join(' ');
        })
        .join('; ') + '.';
    case 'match':
      return unit.match.pairs.map((p) => `${p.left} is ${p.right}`).join('; ') + '.';
    case 'rewrite':
      return unit.rewrite.rows.map((r) => diffWords(r.text, r.answer)).join('; ') + '.';
    case 'review':
      // Just the answers, in order — concise, matching the printed key.
      return unit.review.items.map((it) => it.answer).join('; ') + '.';
    default:
      return '';
  }
}
