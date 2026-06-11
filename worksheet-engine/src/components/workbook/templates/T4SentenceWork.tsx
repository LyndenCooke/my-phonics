import React from 'react';
import type { PoolObject, T4Content } from '@/data/pool/schema';
import { getLevelTheme } from '@/design/levelThemes';
import { INK } from '@/design/tokens';
import { mm } from '@/components/SheetShell';
import { gType } from '@/design/grammarTokens';
import { WriteLine } from '@/components/WriteLine';
import { CheckStrip } from '@/components/grammar/Illustration';
import { FlowyPage, FootArt, footArtSlot, NumBadge, CueChips, DependencySlot } from '@/components/workbook/WorkbookChrome';

// ---------------------------------------------------------------------------
// T4 — SENTENCE WORK. Zone map: Watch first tint box ~25% (the routine with
// Say it / Tap it cues); write block ~55% (3 items max, single lines at L6);
// check strip foot ~15%; one grounded art slot (reserved foot band).
//
// Two variants:
//   hold   — "Hold the sentence": the three approved book sentences are
//            printed (read · say · hide · write from memory), one write line
//            each.
//   answer — "Answer it in a sentence" (SW2, extended WO task): the
//            comprehension questions are an AUTHORING DEPENDENCY. The layout
//            renders complete with each question slot clearly flagged empty;
//            the page re-enters QA when the approved questions land.
// ---------------------------------------------------------------------------

export default function T4SentenceWork({ pool, page }: { pool: PoolObject; page: number }) {
  const c = pool.content as T4Content;
  const theme = getLevelTheme(6);
  const hold = c.variant === 'hold';

  return (
    <FlowyPage theme={theme} title={pool.title} page={page}>
      {/* Watch first — the routine */}
      <div style={{ flex: '0 0 auto', background: theme.light, borderRadius: mm(6), padding: mm(6) }}>
        <div style={{ ...gType('instruction'), color: theme.accentText, marginBottom: mm(3) }}>Watch first</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: mm(5), flexWrap: 'wrap' }}>
          <span style={{ color: INK.text, ...gType('instruction') }}>
            {hold ? 'Read the sentence. Hide it. Write it.' : 'Read the question. Answer it in a full sentence.'}
          </span>
          <CueChips cues={hold ? ['Say it', 'Tap it', 'Write it'] : ['Say it', 'Write it', 'Check it']} theme={theme} />
        </div>
      </div>

      {/* the write block */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', marginTop: mm(4) }}>
        {hold
          ? (c.sentences ?? []).map((s, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: mm(1) }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: mm(3) }}>
                  <NumBadge n={i + 1} theme={theme} />
                  <div style={{ flex: 1, background: theme.light, borderRadius: mm(4), padding: `${mm(1.5)} ${mm(4)}`, color: INK.text, ...gType('body') }}>
                    {s.text}
                  </div>
                </div>
                <div style={{ paddingLeft: mm(11) }}>
                  <WriteLine lines={c.linesPerItem} gap="11mm" />
                </div>
              </div>
            ))
          : Array.from({ length: c.placeholderSlots ?? 3 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: mm(1) }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: mm(3) }}>
                  <NumBadge n={i + 1} theme={theme} />
                  <div style={{ flex: 1 }}>
                    <DependencySlot label="question to come" heightMm={12} theme={theme} />
                  </div>
                </div>
                <div style={{ paddingLeft: mm(11) }}>
                  <WriteLine lines={c.linesPerItem} gap="11mm" />
                </div>
              </div>
            ))}
      </div>

      {/* foot — check strip, then the reserved art band */}
      <div style={{ flex: '0 0 auto', marginTop: mm(4) }}>
        <CheckStrip items={['capitalLetter', 'fingerSpaces', 'fullStop']} theme={theme} />
      </div>
      <FootArt slot={footArtSlot(pool.art)} heightMm={hold ? 22 : 18} />
    </FlowyPage>
  );
}
