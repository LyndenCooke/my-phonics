import React from 'react';
import type { BookData } from '@/data/schema';
import { SPACE, INK, FONT, RULE, RADIUS } from '@/design/tokens';
import WorksheetFrame from '@/components/WorksheetFrame';
import Clipart from '@/components/Clipart';

// Activity — Fill in the missing sound.
// Picture + the word with its INITIAL grapheme replaced by a write box. The
// child says the word, isolates the first sound, and writes the grapheme.
// (Initial-sound segmenting — the first step toward spelling a whole CVC word.)
// Uses words that have clipart (config.labelWords falls back to all clipart).
export default function MissingSound({ book }: { book: BookData }) {
  const entries = (book.config?.labelWords ?? book.decodableWords.map((w) => w.word))
    .map((w) => book.decodableWords.find((d) => d.word === w))
    .filter((d): d is NonNullable<typeof d> => Boolean(d))
    .slice(0, 5);

  const blank: React.CSSProperties = {
    width: '16mm',
    height: '16mm',
    border: `0.5mm solid ${INK.ruleStrong}`,
    borderRadius: RADIUS.box,
    flex: '0 0 auto',
  };

  return (
    <WorksheetFrame
      book={book}
      title="Fill in the missing sound"
      instruction="Say the word. Write the first sound in the box."
      instructionNumber={1}
    >
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', height: '100%' }}>
        {entries.map((e) => (
          <div
            key={e.word}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACE.lg,
              borderTop: `${RULE.hair} solid ${INK.rule}`,
              paddingTop: SPACE.sm,
            }}
          >
            <Clipart imageKey={e.imageKey} word={e.word} size={26} />
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm }}>
              <span style={blank} />
              <span style={{ fontFamily: FONT.hand, fontSize: '40pt', fontWeight: 700, color: INK.text, lineHeight: 1 }}>
                {e.word.slice(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </WorksheetFrame>
  );
}
