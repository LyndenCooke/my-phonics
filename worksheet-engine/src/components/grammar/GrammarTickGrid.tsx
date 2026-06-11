import React from 'react';
import type { TickGridUnit } from '@/data/grammarSchema';
import { getLevelTheme } from '@/design/levelThemes';
import { FONT, INK } from '@/design/tokens';
import { GrammarLayout, NumBadge, GRAMMAR_PT } from '@/components/grammar/GrammarLayout';

// G-L6.1 — tick the kind each sentence is. A bound-booklet replacement for the
// old cut-and-sort: each sentence is a numbered row, four tick columns, the
// child ticks one. The end mark is the clue. Each column head carries a tiny
// plain-words hint of what that sentence type does (matches the creative ref).

// What each sentence type does, in child words — shown under the column head.
const COLUMN_HINT: Record<string, string> = {
  Statement: 'tells you something',
  Question: 'asks something',
  Command: 'tells you to do it',
  Exclamation: 'shows strong feeling',
};

export default function GrammarTickGrid({ unit }: { unit: TickGridUnit }) {
  const theme = getLevelTheme(unit.level);
  const { columns, rows } = unit.tickgrid;
  const cols = `1fr repeat(${columns.length}, 22mm)`;

  const tick: React.CSSProperties = {
    width: '6mm',
    height: '6mm',
    border: `0.4mm solid ${INK.ruleStrong}`,
    borderRadius: '1mm',
  };

  return (
    <GrammarLayout unit={unit}>
      <div style={{ height: '100%', display: 'grid', gridTemplateRows: `auto repeat(${rows.length}, 1fr)` }}>
        {/* column heads — name + plain-words hint */}
        <div style={{ display: 'grid', gridTemplateColumns: cols, alignItems: 'end', borderBottom: `0.5mm solid ${theme.border}`, paddingBottom: '1.5mm' }}>
          <span />
          {columns.map((c) => (
            <span key={c} style={{ textAlign: 'center', lineHeight: 1.1, padding: '0 1mm' }}>
              <span style={{ display: 'block', fontSize: '8.5pt', fontWeight: 700, color: theme.accentText }}>{c}</span>
              {COLUMN_HINT[c] && (
                <span style={{ display: 'block', fontSize: '6.5pt', color: INK.faint, marginTop: '0.4mm' }}>{COLUMN_HINT[c]}</span>
              )}
            </span>
          ))}
        </div>

        {/* numbered sentence rows */}
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: cols, alignItems: 'center', borderBottom: `0.3mm solid ${INK.rule}` }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '2.5mm', fontFamily: FONT.hand, fontSize: `${GRAMMAR_PT.sentence}pt`, color: INK.text }}>
              <NumBadge n={i + 1} accent={theme.primary} />
              {r.text}
            </span>
            {columns.map((c) => (
              <span key={c} style={{ display: 'flex', justifyContent: 'center' }}>
                <span style={tick} />
              </span>
            ))}
          </div>
        ))}
      </div>
    </GrammarLayout>
  );
}
