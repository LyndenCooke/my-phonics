import React from 'react';
import type { CircleUnit } from '@/data/grammarSchema';
import { getLevelTheme } from '@/design/levelThemes';
import { FONT, INK } from '@/design/tokens';
import Clipart, { hasClipart } from '@/components/Clipart';
import { GrammarLayout, NumBadge } from '@/components/grammar/GrammarLayout';

// G-L6.5 — circle the adjective, underline the adverb. Two MARKS (not two
// colours) so it prints in black. A key line demonstrates each mark on a sample
// word; numbered sentences are printed large with room to mark on the line.

// A sample word shown with the mark applied, so the child sees what to do.
const DEMO: Record<string, string> = { adjective: 'big', adverb: 'quickly' };

function Key({ targets, accent }: { targets: CircleUnit['circle']['targets']; accent: string }) {
  return (
    <div style={{ display: 'flex', gap: '12mm', alignItems: 'center', fontSize: '11pt', justifyContent: 'center' }}>
      {targets.map((t) => (
        <span key={t.label} style={{ display: 'flex', alignItems: 'center', gap: '3mm' }}>
          {t.mark === 'circle' ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '14mm', height: '8mm', padding: '0 2mm', border: `0.6mm solid ${accent}`, borderRadius: '50%', fontFamily: FONT.hand, fontSize: '14pt', fontWeight: 700, color: INK.text }}>
              {DEMO[t.label] ?? ''}
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '14mm', borderBottom: `0.8mm solid ${accent}`, paddingBottom: '0.4mm', fontFamily: FONT.hand, fontSize: '14pt', fontWeight: 700, color: INK.text }}>
              {DEMO[t.label] ?? ''}
            </span>
          )}
          <span style={{ fontWeight: 700, color: INK.muted }}>
            {t.mark === 'circle' ? 'Circle the ' : 'Underline the '}
            {t.label}
          </span>
        </span>
      ))}
    </div>
  );
}

export default function GrammarCircle({ unit }: { unit: CircleUnit }) {
  const theme = getLevelTheme(unit.level);
  const { targets, rows } = unit.circle;
  const anyIcon = rows.some((r) => hasClipart(r.icon));

  return (
    <GrammarLayout unit={unit}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '4mm' }}>
        <div style={{ background: theme.light, border: `0.4mm solid ${theme.border}`, borderRadius: '3mm', padding: '2.5mm 3mm' }}>
          <Key targets={targets} accent={theme.accentText} />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '3.5mm', paddingBottom: '3.5mm', borderBottom: `0.3mm solid ${INK.rule}` }}>
              <NumBadge n={i + 1} accent={theme.primary} />
              <span style={{ flex: 1, fontFamily: FONT.hand, fontSize: '18pt', color: INK.text }}>{r.text}</span>
              {anyIcon && (
                <span style={{ flex: '0 0 auto', width: '14mm', height: '14mm' }}>
                  {hasClipart(r.icon) && <Clipart imageKey={r.icon!} word={r.text} fill multiply />}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </GrammarLayout>
  );
}
