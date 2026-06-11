import React from 'react';
import type { PoolObject, T10Content } from '@/data/pool/schema';
import { getLevelTheme } from '@/design/levelThemes';
import { INK } from '@/design/tokens';
import { mm } from '@/components/SheetShell';
import { gType } from '@/design/grammarTokens';
import { WriteLine } from '@/components/WriteLine';
import { FlowyPage, NumBadge } from '@/components/workbook/WorkbookChrome';

// ---------------------------------------------------------------------------
// T10 — SPELLING TEST (workout day, week 2; ST-HT is the half-term variant).
// Master plan zone map: 10 numbered single write lines ~75% at 12mm+ pitch;
// "My score" box + check strip variant ("I checked my tricky words") ~15%.
//
// NO ART ON A TEST PAGE — this component reserves no art zone at all.
// THE TEST WORDS ARE NEVER PRINTED HERE. The word list is an authoring
// dependency (L6_DEPENDENCIES.md); once approved it is published in the
// teacher sequence doc and the Answers pages — never on this page.
// ---------------------------------------------------------------------------

export default function T10SpellingTest({ pool, page }: { pool: PoolObject; page: number }) {
  const c = pool.content as T10Content;
  const theme = getLevelTheme(6);

  return (
    <FlowyPage theme={theme} title={pool.title} page={page}>
      {/* the numbered write lines, two columns of five for a clean 12mm+ pitch */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', paddingTop: mm(2) }}>
        {Array.from({ length: c.lines }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: mm(4), alignItems: 'flex-end' }}>
            <NumBadge n={i + 1} theme={theme} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <WriteLine lines={1} gap="12mm" />
            </div>
          </div>
        ))}
      </div>

      {/* foot — My score + the check strip variant */}
      <div style={{ flex: '0 0 auto', display: 'flex', gap: mm(4), alignItems: 'stretch', marginTop: mm(5) }}>
        <div
          style={{
            flex: '0 0 auto',
            background: theme.light,
            borderRadius: mm(3),
            padding: `0 ${mm(5)}`,
            height: mm(12),
            display: 'flex',
            alignItems: 'center',
            gap: mm(4),
          }}
        >
          <span style={{ color: theme.accentText, ...gType('instruction') }}>My score</span>
          <span style={{ borderBottom: `0.4mm solid ${INK.text}`, width: mm(14), height: mm(8) }} />
          <span style={{ color: INK.text, ...gType('instruction') }}>out of {c.lines}</span>
        </div>
        <div
          style={{
            flex: 1,
            background: theme.light,
            borderRadius: mm(3),
            padding: `0 ${mm(5)}`,
            height: mm(12),
            display: 'flex',
            alignItems: 'center',
            gap: mm(3),
          }}
        >
          <span style={{ color: theme.accentText, ...gType('instruction') }}>Check</span>
          <span style={{ color: INK.text, ...gType('instruction') }}>I checked my tricky words</span>
          <span style={{ width: mm(6), height: mm(6), border: `0.4mm solid ${INK.text}`, borderRadius: mm(1), flex: '0 0 auto' }} />
        </div>
      </div>
    </FlowyPage>
  );
}
