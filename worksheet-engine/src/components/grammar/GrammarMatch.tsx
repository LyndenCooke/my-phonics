import React from 'react';
import type { MatchUnit } from '@/data/grammarSchema';
import { getLevelTheme } from '@/design/levelThemes';
import { FONT, INK } from '@/design/tokens';
import { GrammarLayout } from '@/components/grammar/GrammarLayout';

// G-L6.6 — draw a line from each pair to its short form. Left column in order,
// right column in a deterministic scramble (rotate by 2) so the answer isn't a
// straight line. Dot anchors on each inner edge. We-do row carries a level dot.

function rotate<T>(arr: T[], by: number): T[] {
  const n = arr.length;
  const k = ((by % n) + n) % n;
  return [...arr.slice(k), ...arr.slice(0, k)];
}

export default function GrammarMatch({ unit }: { unit: MatchUnit }) {
  const theme = getLevelTheme(unit.level);
  const left = unit.match.pairs.map((p) => p.left);
  const right = rotate(unit.match.pairs.map((p) => p.right), 2);

  const cell: React.CSSProperties = {
    border: `0.4mm solid ${theme.border}`,
    borderRadius: '2mm',
    display: 'flex',
    alignItems: 'center',
    padding: '0 4mm',
    height: '13mm',
    fontFamily: FONT.hand,
    fontSize: '18pt',
    fontWeight: 700,
    color: INK.text,
  };
  const dot = { width: '2.4mm', height: '2.4mm', borderRadius: '50%', background: theme.primary, flex: '0 0 auto' } as React.CSSProperties;

  return (
    <GrammarLayout unit={unit}>
      <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1fr 22mm 1fr', alignItems: 'center', rowGap: '2mm' }}>
        {left.map((l, i) => (
          <React.Fragment key={i}>
            <div style={{ ...cell, justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '2mm' }}>
                {i < unit.weDoCount && <span style={dot} />}
                {l}
              </span>
              <span style={dot} />
            </div>
            <div />
            <div style={{ ...cell, justifyContent: 'flex-start', gap: '3mm' }}>
              <span style={dot} />
              <span>{right[i]}</span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </GrammarLayout>
  );
}
