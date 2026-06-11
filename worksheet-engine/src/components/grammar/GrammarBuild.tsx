import React from 'react';
import type { BuildUnit } from '@/data/grammarSchema';
import { getLevelTheme } from '@/design/levelThemes';
import { FONT, INK } from '@/design/tokens';
import Clipart, { hasClipart } from '@/components/Clipart';
import { GrammarLayout, NumBadge, WriteLine } from '@/components/grammar/GrammarLayout';

// G-L6.2 — grow the noun phrase. A labelled word panel of describing words on
// top, then numbered rows: an optional on-task picture, the plain phrase, then a
// TraceLine writing row to write the grown phrase. (Creative ref: word panel +
// numbered rows + per-row icons.)

export default function GrammarBuild({ unit }: { unit: BuildUnit }) {
  const theme = getLevelTheme(unit.level);
  const { wordBank, rows } = unit.build;
  const anyIcon = rows.some((r) => hasClipart(r.icon));

  return (
    <GrammarLayout unit={unit}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* word panel — describing words to choose from. Extra top space sets it
            apart from the §2 subtitle; bigger label + words for young readers. */}
        <div style={{ marginTop: '6mm', display: 'flex', alignItems: 'center', gap: '5mm', background: theme.light, border: `0.4mm solid ${theme.border}`, borderRadius: '3mm', padding: '3mm 4mm' }}>
          <span style={{ fontSize: '11pt', fontWeight: 700, color: theme.accentText, flex: '0 0 28mm', lineHeight: 1.15 }}>
            Choose from these words:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2mm 8mm', flex: 1, justifyContent: 'space-between' }}>
            {wordBank.map((w) => (
              <span key={w} style={{ fontFamily: FONT.hand, fontSize: '17pt', fontWeight: 700, color: INK.text }}>
                {w}
              </span>
            ))}
          </div>
        </div>

        {/* numbered build rows. The writing line sits just BELOW the arrow
            (alignSelf flex-end on a tall-ish row) so the child writes under it. */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '3mm', minHeight: '12mm' }}>
              <NumBadge n={i + 1} accent={theme.primary} />
              {anyIcon && (
                <span style={{ flex: '0 0 auto', width: '13mm', height: '13mm' }}>
                  {hasClipart(r.icon) && <Clipart imageKey={r.icon!} word={r.base} fill multiply />}
                </span>
              )}
              <span style={{ flex: '0 0 auto', width: '34mm', whiteSpace: 'nowrap', fontFamily: FONT.hand, fontSize: '16.5pt', color: INK.muted }}>{r.base}</span>
              <span style={{ flex: '0 0 auto', color: theme.accentText, fontWeight: 700, fontSize: '13pt' }}>→</span>
              <div style={{ flex: 1, alignSelf: 'flex-end', paddingBottom: '2mm' }}>
                <WriteLine />
              </div>
            </div>
          ))}
        </div>
      </div>
    </GrammarLayout>
  );
}
