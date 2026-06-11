import React from 'react';
import type { SoundSheetData } from '@/data/soundSchema';
import { getLevelTheme } from '@/design/levelThemes';
import { INK } from '@/design/tokens';
import TraceLine from '@/components/TraceLine';
import Clipart from '@/components/Clipart';
import {
  SheetPage,
  SheetHeader,
  SheetFooter,
  SectionHead,
  panelStyle,
  cardStyle,
  M,
  W,
  PAD,
  abs,
} from '@/components/SheetShell';

// ---------------------------------------------------------------------------
// SingleSound — the LOCKED master, a FIXED A4 recreation of the Sound-Pack
// reference (public/worksheets/Sound_Pack/sound_a.pdf). Chrome (header bar,
// panels, section heads, footer) now comes from SheetShell so Sound and Grammar
// share one look; only the §1/§2/§3 BODY layout lives here.
//
// LAYOUT MAP (mm, A4 210x297):
//   header  6,6    198x26   level bar (tile · title · pills, all v-centred)
//   §1      6,36   198x40   trace the letter (model + 4 traces + free space)
//   §2      6,80   198x146  trace the words (5 rows x 3 cards)
//   §3      6,230  198x52   write the missing letter (4 cards)
//   footer  6,285  198x7    grey caption bar
// ---------------------------------------------------------------------------

const HEAD_H = 11; // header block inside a panel — title + inline subtitle

const REGION = {
  s1: { y: 36, h: 40 },
  s2: { y: 80, h: 146 },
  s3: { y: 230, h: 52 },
};

export default function SingleSound({ sheet }: { sheet: SoundSheetData }) {
  const theme = getLevelTheme(sheet.level);
  const pink = theme.primary;
  const border = theme.border;
  const panel = panelStyle(border);
  const card = cardStyle(border);

  // --- §2 row geometry (PANEL-RELATIVE coords — children sit inside the panel)
  const innerW = W - 2 * PAD;
  const rowsTop = PAD + HEAD_H;
  const rowsBottom = REGION.s2.h - PAD;
  const ROW_GAP = 2;
  const rowH = (rowsBottom - rowsTop - ROW_GAP * (sheet.traceWords.length - 1)) / sheet.traceWords.length;
  const picW = 30;
  const cGap = 4;
  const writeW = (innerW - picW - cGap * 2) / 2;
  const colA = PAD;
  const colB = colA + picW + cGap;
  const colC = colB + writeW + cGap;

  // --- §3 card geometry (panel-relative) ------------------------------------
  const s3Top = PAD + HEAD_H;
  const s3Bottom = REGION.s3.h - PAD;
  const s3H = s3Bottom - s3Top;
  const s3Gap = 4;
  const s3W = (innerW - s3Gap * (sheet.missingWords.length - 1)) / sheet.missingWords.length;

  /** Full word as per-letter runs, with the target grapheme INVISIBLE — it
   *  reserves its real width so the visible letters centre as the complete word
   *  would (true optical centring of the imagined word). */
  const missingSegments = (word: string) =>
    [...word].map((ch) =>
      ch.toLowerCase() === sheet.grapheme.toLowerCase()
        ? { text: ch, fill: 'transparent' }
        : { text: ch, fill: INK.text, fontWeight: 400 },
    );

  return (
    <SheetPage>
      <SheetHeader
        theme={theme}
        title={`The Sound ${sheet.grapheme}`}
        levelLabel={sheet.levelLabel}
        strand={sheet.strand ?? `Sound · ${sheet.phoneme}`}
        mascotImageKey={sheet.characterImageKey}
        mascotWord={sheet.grapheme}
        tileGlyph={sheet.grapheme}
      />

      {/* ====================================================== §1 ======== */}
      <div style={{ ...abs(M, REGION.s1.y, W, REGION.s1.h), ...panel }}>
        <SectionHead n={1} title={`Trace the Letter ${sheet.grapheme}`} subtitle="Trace the letter. Then write some on your own." inlineSubtitle accent={pink} />
        <div style={{ ...abs(PAD, PAD + HEAD_H, innerW, REGION.s1.h - (PAD + HEAD_H) - PAD), display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '100%' }}>
            <TraceLine
              model={sheet.grapheme}
              text={Array(4).fill(sheet.grapheme).join(' ')}
              xHeightMm={8}
              widthMm={innerW}
              wordSpacingMm={2}
              midlineColor={border}
            />
          </div>
        </div>
      </div>

      {/* ====================================================== §2 ======== */}
      <div style={{ ...abs(M, REGION.s2.y, W, REGION.s2.h), ...panel }}>
        <SectionHead n={2} title="Trace the Words" subtitle="Trace each word. Then write it on your own." inlineSubtitle accent={pink} />
        {sheet.traceWords.map((tw, i) => {
          const y = rowsTop + i * (rowH + ROW_GAP);
          return (
            <React.Fragment key={tw.word}>
              <div style={{ ...abs(colA, y, picW, rowH), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clipart imageKey={tw.imageKey} word={tw.word} blank multiply fill />
              </div>
              <div style={{ ...abs(colB, y, writeW, rowH), display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '100%' }}>
                  <TraceLine text={`${tw.word}  ${tw.word}`} xHeightMm={7} widthMm={writeW} midlineColor={border} />
                </div>
              </div>
              <div style={{ ...abs(colC, y, writeW, rowH), display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '100%' }}>
                  <TraceLine text="" xHeightMm={7} widthMm={writeW} midlineColor={border} />
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* ====================================================== §3 ======== */}
      <div style={{ ...abs(M, REGION.s3.y, W, REGION.s3.h), ...panel }}>
        <SectionHead n={3} title={`Write the Missing ${sheet.grapheme}`} subtitle={`What letter is missing? Write the ${sheet.grapheme}.`} inlineSubtitle accent={pink} />
        {sheet.missingWords.map((mw, i) => {
          const x = PAD + i * (s3W + s3Gap);
          return (
            <div key={mw.word} style={{ ...abs(x, s3Top, s3W, s3H), ...card, padding: '2mm', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, minHeight: 0, display: 'flex', paddingBottom: '1mm' }}>
                <Clipart imageKey={mw.imageKey} word={mw.word} blank multiply fill />
              </div>
              <TraceLine segments={missingSegments(mw.word)} xHeightMm={6} widthMm={s3W - 4} midlineColor={border} showAscender={false} align="middle" />
            </div>
          );
        })}
      </div>

      <SheetFooter theme={theme} right={`Single Sound · ${sheet.phoneme}`} />
    </SheetPage>
  );
}
