import React from 'react';
import type { BookData } from '@/data/schema';
import { SPACE, INK, FONT, RULE, RADIUS } from '@/design/tokens';
import WorksheetFrame from '@/components/WorksheetFrame';
import TraceLine from '@/components/TraceLine';

// Activity — Read, draw and write.
// Two panels. Each: a model sentence to read, a large box to draw it in, and a
// ruled line to write it on. Comprehension + composition off a decodable cue.
// Reads sentences (the most decodable cue we have).
export default function DrawAndWrite({ book }: { book: BookData }) {
  const sentences = book.sentences.slice(0, 2);

  return (
    <WorksheetFrame
      book={book}
      title="Read, draw and write"
      instruction="Read the sentence. Draw it in the box, then write it underneath."
      instructionNumber={1}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.md, height: '100%' }}>
        {sentences.map((s, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ fontFamily: FONT.hand, fontSize: '19pt', fontWeight: 700, color: INK.text }}>{s}</div>
            {/* Draw box — grows to fill the panel */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                border: `${RULE.hair} solid ${INK.rule}`,
                borderRadius: RADIUS.box,
                marginTop: SPACE.xs,
              }}
            />
            {/* Write line */}
            <div style={{ marginTop: SPACE.xs }}>
              <TraceLine text="" xHeightMm={7} />
            </div>
          </div>
        ))}
      </div>
    </WorksheetFrame>
  );
}
