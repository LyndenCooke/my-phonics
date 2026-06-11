import React from 'react';
import type { BookData } from '@/data/schema';
import { SPACE, INK, FONT } from '@/design/tokens';
import WorksheetFrame from '@/components/WorksheetFrame';
import TraceLine from '@/components/TraceLine';

// Activity 1 — Trace the new sounds.
// One handwriting row per focus sound: a black model letter, several dotted
// copies to trace, then a blank stretch of the same ruled line to write on.
const LABEL_W = 24; // mm
const TRACE_W = 156; // mm (content 186 - label - gap), keeps SVG x-scale ~1
const X_HEIGHT = 9; // mm — large letters for early hands

export default function TraceSounds({ book }: { book: BookData }) {
  return (
    <WorksheetFrame
      book={book}
      title="Trace the new sounds"
      instruction="Trace each sound, then write it on your own."
      instructionNumber={1}
    >
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
        {book.focusSounds.map((sound) => (
          <div key={sound} style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm }}>
            {/* Black model letter in the solid handwriting face */}
            <div
              style={{
                width: `${LABEL_W}mm`,
                flex: '0 0 auto',
                textAlign: 'center',
                fontFamily: FONT.hand,
                fontSize: '30pt',
                fontWeight: 700,
                color: INK.text,
                lineHeight: 1,
              }}
            >
              {sound}
            </div>

            {/* Trace copies (dotted) then blank line to write on */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <TraceLine
                text={`${sound} ${sound} ${sound} ${sound}`}
                xHeightMm={X_HEIGHT}
                widthMm={TRACE_W}
                wordSpacingMm={3}
              />
            </div>
          </div>
        ))}
      </div>
    </WorksheetFrame>
  );
}
