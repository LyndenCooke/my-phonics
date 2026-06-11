import React from 'react';
import type { ClozeUnit } from '@/data/grammarSchema';
import { getLevelTheme } from '@/design/levelThemes';
import { FONT, INK } from '@/design/tokens';
import Clipart, { hasClipart } from '@/components/Clipart';
import { GrammarLayout, NumBadge, GRAMMAR_PT } from '@/components/grammar/GrammarLayout';

// G-L6.3 / G-L6.4 — write the joining word in the gap. The bank is a row of
// rounded word "pills"; then each numbered sentence is printed as
// `before [ruled gap] after` with an optional on-task picture on the right.
// bankNote marks the L6.4 words as "joining words to know" (recognised now,
// spelled to mastery at L7).

export default function GrammarCloze({ unit }: { unit: ClozeUnit }) {
  const theme = getLevelTheme(unit.level);
  const { wordBank, bankNote, rows } = unit.cloze;
  const anyIcon = rows.some((r) => hasClipart(r.icon));

  return (
    <GrammarLayout unit={unit}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* word-bank band — note + pills, centred in the space between the §2
            subtitle and the first row (balanced margin top/bottom). */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3mm', marginTop: '3mm', marginBottom: '6mm' }}>
          {bankNote && (
            <div style={{ fontSize: '10pt', color: theme.accentText, fontWeight: 700 }}>{bankNote}</div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6mm', flexWrap: 'wrap' }}>
            {wordBank.map((w) => (
              <span
                key={w}
                style={{
                  fontFamily: FONT.hand,
                  fontSize: '17pt',
                  fontWeight: 700,
                  color: theme.accentText,
                  background: theme.light,
                  border: `0.5mm solid ${theme.border}`,
                  borderRadius: '3mm',
                  padding: '1.5mm 8mm',
                }}
              >
                {w}
              </span>
            ))}
          </div>
        </div>

        {/* numbered cloze rows — ruled like the tick-grid so the rhythm matches
            and the vertical space reads as deliberate rows, not empty gaps. */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '3mm', paddingBottom: '2.5mm', borderBottom: `0.3mm solid ${INK.rule}` }}>
              <NumBadge n={i + 1} accent={theme.primary} />
              <span style={{ display: 'flex', alignItems: 'center', gap: '3mm', flex: 1, fontFamily: FONT.hand, fontSize: `${GRAMMAR_PT.sentence}pt`, color: INK.text }}>
                <span>{r.before}</span>
                <span style={{ width: '30mm', height: '7mm', flex: '0 0 auto', borderBottom: `0.4mm solid ${INK.ruleStrong}` }} />
                <span>{r.after}</span>
              </span>
              {anyIcon && (
                <span style={{ flex: '0 0 auto', width: '13mm', height: '13mm' }}>
                  {hasClipart(r.icon) && <Clipart imageKey={r.icon!} word={r.answer} fill multiply />}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </GrammarLayout>
  );
}
