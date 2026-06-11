import React from 'react';
import type { PoolObject, T1Content } from '@/data/pool/schema';
import { getLevelTheme } from '@/design/levelThemes';
import { INK } from '@/design/tokens';
import { mm } from '@/components/SheetShell';
import TraceLine from '@/components/TraceLine';
import { JOINED_METRICS } from '@/design/handwriting';
import { FlowyPage, FootArt, footArtSlot } from '@/components/workbook/WorkbookChrome';

// ---------------------------------------------------------------------------
// T1 — HANDWRITING (practice sheet, NO instruction). Redesigned per the master
// plan: handwriting pages never teach. Tramline sets only — each set is one
// grey model row to trace plus one blank write row — with the standard
// handwriting markers (start dot, directional arrow) as page furniture in the
// row's left margin. 4 sets per page maximum, generous gaps. NO worked-example
// block, NO explanation of formation or joining anywhere on the page.
//
// Tramlines are the engine gold standard (TraceLine + handwriting.ts metrics):
// solid ascender · dashed level-colour midline · solid dark baseline · dashed
// descender. At L6 the models print JOINED (SchoolJoined / Playwrite GB J) —
// gated behind the font-sample approval: while `pendingFont` is set the model
// row renders its tramlines complete with the glyphs withheld (flagged
// PENDING-FONT in the QA report), so approval is a data flip, not a rebuild.
//
// No art may touch or approach the tramlines: the only permitted art is one
// self-contained perch creature in the reserved outer foot corner band.
// ---------------------------------------------------------------------------

/** L6 x-height — the joining band writes smaller than the formation band. */
const X_HEIGHT_MM = 6;
/** Tramline row width: content 198 minus the 10 mm marker margin. */
const ROW_WIDTH_MM = 188;

function Marker({ theme }: { theme: ReturnType<typeof getLevelTheme> }) {
  return (
    <div style={{ flex: '0 0 auto', width: mm(10), display: 'flex', alignItems: 'center', gap: mm(1), paddingBottom: mm(5) }}>
      <span style={{ width: mm(2.4), height: mm(2.4), borderRadius: '50%', background: theme.primary }} />
      <svg width={mm(4)} height={mm(3)} viewBox="0 0 4 3">
        <path d="M0,1.5 L2.8,1.5 M2,0.6 L2.9,1.5 L2,2.4" stroke={theme.primary} strokeWidth={0.45} fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function T1Handwriting({ pool, page }: { pool: PoolObject; page: number }) {
  const c = pool.content as T1Content;
  const theme = getLevelTheme(6);
  const sets = c.sets.slice(0, 4); // 4 sets per page maximum, enforced

  return (
    <FlowyPage theme={theme} title={pool.title} page={page}>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', paddingTop: mm(2) }}>
        {sets.map((set, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: mm(6) }}>
            {/* model row — grey joined model to trace (withheld while the
                joined font awaits approval; the tramlines are complete) */}
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <div style={{ flex: '0 0 auto', width: mm(10) }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <TraceLine
                  text={c.pendingFont ? '' : set.model}
                  xHeightMm={X_HEIGHT_MM}
                  widthMm={ROW_WIDTH_MM}
                  metrics={JOINED_METRICS}
                  color={INK.trace}
                  midlineColor={theme.primary}
                  joined
                />
              </div>
            </div>
            {/* write row — blank tramlines, start dot + arrow as furniture */}
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Marker theme={theme} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <TraceLine text="" xHeightMm={X_HEIGHT_MM} widthMm={ROW_WIDTH_MM} midlineColor={theme.primary} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* the one permitted art slot: a self-contained perch creature in the
          reserved outer foot corner, structurally clear of every tramline */}
      <FootArt slot={footArtSlot(pool.art)} heightMm={16} />
    </FlowyPage>
  );
}
