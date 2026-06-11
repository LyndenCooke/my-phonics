import React from 'react';
import type { PoolObject, T9Content } from '@/data/pool/schema';
import { getLevelTheme } from '@/design/levelThemes';
import { INK } from '@/design/tokens';
import { mm } from '@/components/SheetShell';
import { gType } from '@/design/grammarTokens';
import { WriteLine } from '@/components/WriteLine';
import { CheckStrip } from '@/components/grammar/Illustration';
import { FlowyPage, NumBadge, CueChips } from '@/components/workbook/WorkbookChrome';

// ---------------------------------------------------------------------------
// T9 — LISTEN AND WRITE (reading day, 8-10 minutes).
// Master plan zone map: Watch first cue strip ~15% (the grown-up reads the
// sentence; Say it / Tap it cues — structural copy); 3 numbered sentence
// slots × 2 single lines ~65%, generous pitch; check strip foot ~15%
// (capital · spaces · end mark).
//
// THE DICTATION SENTENCES ARE NEVER PRINTED ON THIS PAGE. They live in the
// pool object only so the assembler can print them in the Answers pages and
// the teacher sequence doc. This component deliberately never reads
// `content.sentences`.
// ---------------------------------------------------------------------------

export default function T9ListenWrite({ pool, page }: { pool: PoolObject; page: number }) {
  const c = pool.content as T9Content;
  const theme = getLevelTheme(6);

  return (
    <FlowyPage theme={theme} title={pool.title} page={page}>
      {/* Watch first — the listening routine, cues only */}
      <div style={{ flex: '0 0 auto', background: theme.light, borderRadius: mm(6), padding: mm(6) }}>
        <div style={{ ...gType('instruction'), color: theme.accentText, marginBottom: mm(3) }}>Watch first</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: mm(5), flexWrap: 'wrap' }}>
          <span style={{ color: INK.text, ...gType('instruction') }}>The grown-up reads the sentence.</span>
          <CueChips cues={['Say it', 'Tap it', 'Write it']} theme={theme} />
        </div>
      </div>

      {/* the three numbered sentence slots — two single lines each */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', marginTop: mm(4) }}>
        {Array.from({ length: c.slots }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: mm(4), alignItems: 'flex-start' }}>
            <NumBadge n={i + 1} theme={theme} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <WriteLine lines={2} gap="12mm" />
            </div>
          </div>
        ))}
      </div>

      {/* foot — the self-check strip */}
      <div style={{ flex: '0 0 auto', marginTop: mm(4) }}>
        <CheckStrip items={['capitalLetter', 'fingerSpaces', 'fullStop']} theme={theme} />
      </div>
    </FlowyPage>
  );
}
