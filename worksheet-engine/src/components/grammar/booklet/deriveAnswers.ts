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
    case 'circle': {
      // A row that finds every word (L1 "What is a word?") has no useful
      // word-by-word key; say so once instead of printing empty slots.
      const rowAns = unit.circle.rows.map((r) => {
        const words = r.text.split(/\s+/).filter(Boolean);
        if (r.finds.length >= words.length) return 'every word';
        return r.finds.map((f) => f.word).join(' and ');
      });
      if (rowAns.every((a) => a === 'every word')) return 'Every word in each sentence is circled.';
      return rowAns.join('; ') + '.';
    }
    case 'match':
      return unit.match.pairs.map((p) => `${p.left} is ${p.right}`).join('; ') + '.';
    case 'rewrite': {
      // Multi-sentence recount units print only three rows (see RewriteBody);
      // the key must list the same rows.
      const rows = unit.rewrite.rows.some((r) => r.answer.length > 46)
        ? unit.rewrite.rows.slice(0, 3)
        : unit.rewrite.rows;
      // Pure copy rows (L1 "Say a sentence") have no diff; the key would be
      // empty slots, so say what the task is instead.
      const parts = rows.map((r) => diffWords(r.text, r.answer));
      if (parts.every((p) => !p)) return 'Each sentence is copied as it is shown.';
      // A diff that rewrites most of the sentence reads as word salad in the
      // key; print the full corrected sentence instead.
      return parts.map((p, i) => (p && p.length < rows[i].answer.length * 0.6 ? p : rows[i].answer)).join('; ') + '.';
    }
    case 'review':
      // Just the answers, in order — concise, matching the printed key.
      return unit.review.items.map((it) => it.answer).join('; ') + '.';
    default:
      return '';
  }
}
