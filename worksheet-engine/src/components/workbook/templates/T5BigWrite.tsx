import React from 'react';
import type { PoolObject, T5Content } from '@/data/pool/schema';
import { getLevelTheme } from '@/design/levelThemes';
import { INK } from '@/design/tokens';
import { mm } from '@/components/SheetShell';
import { gType } from '@/design/grammarTokens';
import { WriteLine } from '@/components/WriteLine';
import { CheckStrip } from '@/components/grammar/Illustration';
import { FlowyPage, FootArt, footArtSlot, DependencySlot } from '@/components/workbook/WorkbookChrome';

// ---------------------------------------------------------------------------
// T5 — BIG WRITE (workout day, closes the fortnight). Zone map: prompt slot +
// planning box ~30%; writing lines ~55% at 12 mm pitch (L4-L6, never
// compressed); check strip ~10%; one small grounded-foot art slot, NEVER
// inside the writing block (the reserved foot band sits after the check
// strip).
//
// L6 form: improve and extend a moment from the book. The improve-step
// weak/strong sentence pair is an AUTHORING DEPENDENCY — its slot renders
// clearly flagged empty and the page re-enters QA when the pair lands.
// ---------------------------------------------------------------------------

export default function T5BigWrite({ pool, page }: { pool: PoolObject; page: number }) {
  const c = pool.content as T5Content;
  const theme = getLevelTheme(6);

  return (
    <FlowyPage theme={theme} title={pool.title} page={page}>
      {/* prompt */}
      <div style={{ flex: '0 0 auto', ...gType('instruction'), color: INK.text }}>{c.prompt}</div>

      {/* the improve-step weak/strong pair — authoring dependency slot */}
      {c.pairPlaceholder && (
        <div style={{ flex: '0 0 auto', marginTop: mm(3) }}>
          <DependencySlot label="the moment to make better (to come)" heightMm={18} theme={theme} />
        </div>
      )}

      {/* planning box */}
      <div
        style={{
          flex: '0 0 auto',
          marginTop: mm(4),
          height: mm(c.planBoxMm),
          background: theme.light,
          borderRadius: mm(6),
          padding: `${mm(3)} ${mm(5)}`,
        }}
      >
        <span style={{ color: theme.accentText, ...gType('instruction') }}>Plan it here</span>
      </div>

      {/* the writing lines — 12 mm pitch, the block owns its own space */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', marginTop: mm(2) }}>
        <WriteLine lines={c.lines} gap="12mm" />
      </div>

      {/* check strip, then the reserved grounded-foot art band */}
      <div style={{ flex: '0 0 auto', marginTop: mm(3) }}>
        <CheckStrip items={['capitalLetter', 'fingerSpaces', 'fullStop']} theme={theme} />
      </div>
      <FootArt slot={footArtSlot(pool.art)} heightMm={18} />
    </FlowyPage>
  );
}
