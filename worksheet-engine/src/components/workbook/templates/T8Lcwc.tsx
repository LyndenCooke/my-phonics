import React from 'react';
import type { PoolObject, T8Content } from '@/data/pool/schema';
import { getLevelTheme } from '@/design/levelThemes';
import { INK } from '@/design/tokens';
import { mm } from '@/components/SheetShell';
import { gType } from '@/design/grammarTokens';
import { FlowyPage, FootArt, footArtSlot } from '@/components/workbook/WorkbookChrome';

// ---------------------------------------------------------------------------
// T8 — LOOK COVER WRITE CHECK (reading day, 8-10 minutes).
// Master plan zone map: Watch first strip ~15% (one word looked at, covered —
// fold cue on the column edge — written, checked); 5 word rows ~70% (look ·
// fold cue · write 1 · write 2 · check box), single-height write cells at L6;
// foot: ground wave + one perch creature in the outer corner, clear of all
// cells (a reserved foot band — the art cannot reach a cell).
// ---------------------------------------------------------------------------

const INK_LINE = '#1A1A1A';

/** The dashed vertical fold cue on the look column's edge. */
function FoldCue({ theme }: { theme: ReturnType<typeof getLevelTheme> }) {
  return (
    <div style={{ flex: '0 0 auto', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: mm(6) }}>
      <div style={{ flex: 1, borderLeft: `0.4mm dashed ${theme.primary}`, width: 0 }} />
    </div>
  );
}

export default function T8Lcwc({ pool, page }: { pool: PoolObject; page: number }) {
  const c = pool.content as T8Content;
  const theme = getLevelTheme(6);
  const tick: React.CSSProperties = {
    width: mm(6), height: mm(6), border: `0.4mm solid ${INK_LINE}`, borderRadius: mm(1), flex: '0 0 auto',
  };
  const writeCell: React.CSSProperties = {
    flex: 1, minWidth: 0, alignSelf: 'flex-end', borderBottom: `0.4mm solid ${INK_LINE}`, height: mm(9),
  };

  return (
    <FlowyPage theme={theme} title={pool.title} page={page}>
      {/* Watch first — the routine, worked on one word */}
      <div style={{ flex: '0 0 auto', background: theme.light, borderRadius: mm(6), padding: mm(6) }}>
        <div style={{ ...gType('instruction'), color: theme.accentText, marginBottom: mm(3) }}>Watch first</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: mm(5), ...gType('body') }}>
          <span style={{ color: INK.text }}>{c.example.word}</span>
          <span style={{ color: theme.primary }}>→</span>
          <span style={{ color: INK.text }}>look</span>
          <span style={{ color: theme.primary }}>·</span>
          <span style={{ color: INK.text }}>hide it</span>
          <span style={{ color: theme.primary }}>·</span>
          <span style={{ color: INK.text }}>write it</span>
          <span style={{ color: theme.primary }}>·</span>
          <span style={{ color: INK.text }}>check it</span>
        </div>
      </div>

      {/* instruction */}
      <div style={{ flex: '0 0 auto', marginTop: mm(5), ...gType('instruction'), color: INK.text }}>
        Look at the word. Hide it. Write it two times. Check it.
      </div>

      {/* column heads + the five word rows */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', marginTop: mm(4) }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: mm(4), paddingBottom: mm(1) }}>
          <span style={{ flex: '0 0 auto', width: mm(44), color: theme.accentText, ...gType('instruction') }}>look</span>
          <span style={{ flex: '0 0 auto', width: mm(6) }} />
          <span style={{ flex: 1, color: theme.accentText, ...gType('instruction') }}>write 1</span>
          <span style={{ flex: 1, color: theme.accentText, ...gType('instruction') }}>write 2</span>
          <span style={{ flex: '0 0 auto', width: mm(10), color: theme.accentText, textAlign: 'center', ...gType('instruction') }}>check</span>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
          {c.rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: mm(4), minHeight: mm(14) }}>
              <span style={{ flex: '0 0 auto', width: mm(44), color: INK.text, paddingBottom: mm(0.5), ...gType('body') }}>{r.word}</span>
              <FoldCue theme={theme} />
              <div style={writeCell} />
              <div style={writeCell} />
              <span style={{ flex: '0 0 auto', width: mm(10), display: 'flex', justifyContent: 'center', paddingBottom: mm(1) }}>
                <span style={tick} />
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* reserved foot band — one perch creature, outer corner, clear of cells */}
      <FootArt slot={footArtSlot(pool.art)} heightMm={18} />
    </FlowyPage>
  );
}
