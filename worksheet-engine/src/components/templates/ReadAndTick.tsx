import React from 'react';
import type { BookData, DecodableWord } from '@/data/schema';
import { SPACE, INK, FONT, RADIUS, RULE } from '@/design/tokens';
import WorksheetFrame from '@/components/WorksheetFrame';
import Clipart from '@/components/Clipart';

// Activity — Read and tick.
// Picture + three words; the child reads all three and ticks the one that
// matches the picture. Distractors are taken deterministically from the book's
// other decodable words, and the correct option's POSITION rotates by row so
// the answer isn't always first. Reads decodableWords (config.tickWords picks
// which clipart words to test). Pure word-reading discrimination.

/** Three options for row `i`: the target plus two deterministic distractors,
 *  rotated so the correct answer sits in a different column each row. */
function optionsFor(entries: DecodableWord[], target: DecodableWord, i: number): string[] {
  const others = entries.filter((e) => e.word !== target.word);
  const d1 = others[i % others.length]?.word;
  const d2 = others[(i + 1) % others.length]?.word;
  const opts = [...new Set([target.word, d1, d2].filter(Boolean) as string[])];
  // rotate left by i so the target moves across columns row to row
  const k = i % opts.length;
  return [...opts.slice(k), ...opts.slice(0, k)];
}

export default function ReadAndTick({ book }: { book: BookData }) {
  const all = book.decodableWords;
  const entries = (book.config?.tickWords ?? book.config?.labelWords ?? all.map((w) => w.word))
    .map((w) => all.find((d) => d.word === w))
    .filter((d): d is DecodableWord => Boolean(d))
    .slice(0, 5);

  const tick: React.CSSProperties = {
    width: '6mm',
    height: '6mm',
    border: `0.5mm solid ${INK.ruleStrong}`,
    borderRadius: RADIUS.card,
    flex: '0 0 auto',
  };

  return (
    <WorksheetFrame
      book={book}
      title="Read and tick"
      instruction="Read the three words. Tick the one that matches the picture."
      instructionNumber={1}
    >
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', height: '100%' }}>
        {entries.map((e, i) => (
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
            <Clipart imageKey={e.imageKey} word={e.word} size={24} />
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around' }}>
              {optionsFor(all, e, i).map((opt) => (
                <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm }}>
                  <span style={{ fontFamily: FONT.hand, fontSize: '24pt', fontWeight: 700, color: INK.text }}>{opt}</span>
                  <span style={tick} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </WorksheetFrame>
  );
}
