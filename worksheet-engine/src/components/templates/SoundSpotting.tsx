import React from 'react';
import type { BookData } from '@/data/schema';
import { getLevelTheme } from '@/design/levelThemes';
import { SPACE, INK, FONT, RULE } from '@/design/tokens';
import WorksheetFrame from '@/components/WorksheetFrame';

// Activity — Spot the sound.
// One row per focus sound: the child reads the book's decodable words and
// circles the target grapheme everywhere it appears. A genuine
// grapheme-discrimination task (find the target among other taught letters),
// not just re-tracing. Reads only focusSounds + decodableWords.
export default function SoundSpotting({ book }: { book: BookData }) {
  const theme = getLevelTheme(book.level);
  const words = book.decodableWords.map((w) => w.word);

  return (
    <WorksheetFrame
      book={book}
      title="Spot the sound"
      instruction="Read each row of words. Circle the sound on the left every time you see it."
      instructionNumber={1}
    >
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
        {book.focusSounds.map((sound) => (
          <div
            key={sound}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACE.md,
              borderTop: `${RULE.hair} solid ${INK.rule}`,
              paddingTop: SPACE.sm,
            }}
          >
            {/* Target grapheme + thin colour underline (accent only) */}
            <div style={{ flex: '0 0 auto', width: '20mm', textAlign: 'center' }}>
              <span style={{ fontFamily: FONT.hand, fontSize: '26pt', fontWeight: 700, color: INK.text }}>{sound}</span>
              <div style={{ height: RULE.header, width: '12mm', margin: '1mm auto 0', background: theme.primary, borderRadius: '1px' }} />
            </div>

            {/* The words to scan — finger-spaced, big enough to circle a letter */}
            <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: `2mm ${SPACE.lg}` }}>
              {words.map((w) => (
                <span
                  key={w}
                  style={{ fontFamily: FONT.hand, fontSize: '22pt', fontWeight: 700, color: INK.text, letterSpacing: '0.06em' }}
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </WorksheetFrame>
  );
}
