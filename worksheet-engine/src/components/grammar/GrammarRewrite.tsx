import React from 'react';
import type { RewriteUnit } from '@/data/grammarSchema';
import { getLevelTheme } from '@/design/levelThemes';
import { FONT, INK } from '@/design/tokens';
import Clipart, { hasClipart } from '@/components/Clipart';
import { GrammarLayout, NumBadge, WriteLine } from '@/components/grammar/GrammarLayout';

// G-L6.7 — rewrite and improve. A numbered, tinted box holds the slipped
// sentence (with an optional on-task picture); a plain writing line below is
// where the child writes it back in the past.

export default function GrammarRewrite({ unit }: { unit: RewriteUnit }) {
  const theme = getLevelTheme(unit.level);
  const { rows } = unit.rewrite;
  const anyIcon = rows.some((r) => hasClipart(r.icon));

  return (
    <GrammarLayout unit={unit}>
      <div style={{ height: '100%', paddingTop: '3mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '1.5mm' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2.5mm' }}>
              <NumBadge n={i + 1} accent={theme.primary} />
              {anyIcon && (
                <span style={{ flex: '0 0 auto', width: '11mm', height: '11mm' }}>
                  {hasClipart(r.icon) && <Clipart imageKey={r.icon!} word={r.text} fill multiply />}
                </span>
              )}
              <div
                style={{
                  flex: 1,
                  background: theme.light,
                  border: `0.3mm solid ${theme.border}`,
                  borderRadius: '2mm',
                  padding: '1.5mm 3mm',
                  fontFamily: FONT.hand,
                  fontSize: '14.5pt',
                  color: INK.muted,
                }}
              >
                {r.text}
              </div>
            </div>
            <div style={{ paddingLeft: '9mm', paddingTop: '6mm' }}>
              <WriteLine lines={2} />
            </div>
          </div>
        ))}
      </div>
    </GrammarLayout>
  );
}
