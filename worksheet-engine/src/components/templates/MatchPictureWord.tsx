import React from 'react';
import type { BookData } from '@/data/schema';
import { getLevelTheme } from '@/design/levelThemes';
import { SPACE, RULE, INK, FONT, TYPE } from '@/design/tokens';
import WorksheetFrame, { ActivityNumber } from '@/components/WorksheetFrame';
import Clipart from '@/components/Clipart';
import TraceLine from '@/components/TraceLine';

// Activity (1) Match, then (2) trace + write.
//  TOP: match the picture to the word. The dot sits RIGHT NEXT TO the picture
//  and RIGHT NEXT TO the word, with a big empty span between them, so the child
//  draws one long line across the page. Picture column = deterministic reversal
//  of the word column.
//  BOTTOM: trace each word (finger-spaced) then write it.
const TRACE_W = 150; // mm for the bottom trace lines

export default function MatchPictureWord({ book }: { book: BookData }) {
  const theme = getLevelTheme(book.level);

  const words = (book.config?.matchWords ?? book.decodableWords.map((w) => w.word)).slice(0, 5);
  const entries = words
    .map((w) => book.decodableWords.find((d) => d.word === w))
    .filter((d): d is NonNullable<typeof d> => Boolean(d));
  const pictures = [...entries].reverse(); // deterministic shuffle

  const dot: React.CSSProperties = {
    width: '3mm',
    height: '3mm',
    borderRadius: '50%',
    border: `0.4mm solid ${INK.faint}`,
    background: '#fff',
    flex: '0 0 auto',
  };

  return (
    <WorksheetFrame
      book={book}
      title="Match, then write"
      instruction="Draw a line from each picture to the word that matches."
      instructionNumber={1}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* ---------------------------------------- TOP HALF: matching ---- */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', minHeight: 0 }}>
          {pictures.map((pic, i) => {
            const word = entries[i];
            return (
              <div key={pic.word} style={{ display: 'flex', alignItems: 'center' }}>
                {/* picture + dot, hugging the left edge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm, flex: '0 0 auto' }}>
                  <Clipart imageKey={pic.imageKey} word={pic.word} size={26} />
                  <span style={dot} />
                </div>
                {/* long empty span = the line the child draws */}
                <div style={{ flex: 1 }} />
                {/* dot + word, hugging the right edge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm, flex: '0 0 auto' }}>
                  <span style={dot} />
                  <span style={{ fontFamily: FONT.hand, fontSize: '28pt', fontWeight: 700, color: INK.text }}>
                    {word.word}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* -------------------------------- section 2 header + divider ---- */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACE.sm,
            borderTop: `${RULE.hair} solid ${INK.rule}`,
            paddingTop: SPACE.sm,
            marginTop: SPACE.xs,
            fontSize: TYPE.instruction,
            fontWeight: 700,
          }}
        >
          <ActivityNumber n={2} color={theme.primary} />
          <span>Trace each word, then write it on your own.</span>
        </div>

        {/* ------------------------------ BOTTOM HALF: trace then write --- */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', minHeight: 0 }}>
          {entries.map((e) => (
            <div key={e.word} style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm }}>
              <Clipart imageKey={e.imageKey} word={e.word} size={11} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <TraceLine text={`${e.word} ${e.word}`} xHeightMm={8} widthMm={TRACE_W} wordSpacingMm={3} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </WorksheetFrame>
  );
}
