import React from 'react';
import type { BookData } from '@/data/schema';
import { getLevelTheme } from '@/design/levelThemes';
import { SPACE, RADIUS, RULE, INK, FONT, TYPE } from '@/design/tokens';
import WorksheetFrame, { ActivityNumber } from '@/components/WorksheetFrame';
import Clipart from '@/components/Clipart';

// Activity 3 — Sort by sound.
// Compact word bank (bigger words), then one column per sound with ruled
// writing lines SIZED TO THE WORD COUNT (max words in any bin + 1 spare), not a
// fixed 4. Columns are content-height so the sheet isn't mostly empty.

// A single ruled writing line: dotted midline + solid baseline.
function WritingLine() {
  return (
    <div style={{ height: '20mm', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: '52%', borderTop: `0.3mm dashed ${INK.rule}` }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, borderTop: `0.45mm solid ${INK.ruleStrong}` }} />
    </div>
  );
}

export default function SortBySound({ book }: { book: BookData }) {
  const theme = getLevelTheme(book.level);
  const bins = book.config?.sortBins ?? [];
  const bankWords = bins.flatMap((b) => b.words);

  // Bottom activity — "Label the picture": write the whole CVC word (uses only
  // words that have clipart). Chosen by SSP consult as the next skill after
  // initial-sound sorting (segment + spell the full word from a picture cue).
  const labelWords = (book.config?.labelWords ?? []).slice(0, 5);
  const labelEntries = labelWords
    .map((w) => book.decodableWords.find((d) => d.word === w))
    .filter((d): d is NonNullable<typeof d> => Boolean(d));

  return (
    <WorksheetFrame
      book={book}
      title="Sort by sound"
      instruction="Read each word, then write it under the sound it starts with."
      instructionNumber={1}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.md, height: '100%' }}>
        {/* Word bank — compact strip, bigger words */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACE.lg,
            border: `${RULE.hair} solid ${INK.rule}`,
            borderRadius: RADIUS.card,
            padding: `${SPACE.sm} ${SPACE.md}`,
          }}
        >
          <span style={{ fontSize: TYPE.chip, fontWeight: 700, color: INK.muted, textTransform: 'uppercase', letterSpacing: '0.04em', flex: '0 0 auto' }}>
            Word bank
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: `2mm ${SPACE.lg}` }}>
            {bankWords.map((w) => (
              <span key={w} style={{ fontFamily: FONT.hand, fontSize: '22pt', fontWeight: 700, color: INK.text }}>
                {w}
              </span>
            ))}
          </div>
        </div>

        {/* Sort columns — content height, anchored to top (no wasted stretch) */}
        <div style={{ display: 'flex', gap: SPACE.md, alignItems: 'flex-start' }}>
          {bins.map((bin) => (
            <div
              key={bin.sound}
              style={{
                flex: 1,
                border: `${RULE.hair} solid ${INK.rule}`,
                borderRadius: RADIUS.box,
                overflow: 'hidden',
              }}
            >
              {/* Light header: black letter + thin colour underline (accent only) */}
              <div style={{ textAlign: 'center', paddingTop: SPACE.sm }}>
                <span style={{ fontFamily: FONT.hand, fontSize: '26pt', fontWeight: 700, color: INK.text }}>{bin.sound}</span>
                <div style={{ height: RULE.header, width: '16mm', margin: '1.5mm auto 0', background: theme.primary, borderRadius: '1px' }} />
              </div>
              {/* One writing line per word in this bin (no spare) */}
              <div style={{ padding: `${SPACE.md} ${SPACE.sm} ${SPACE.md}`, display: 'flex', flexDirection: 'column', gap: SPACE.md }}>
                {bin.words.map((_, i) => (
                  <WritingLine key={i} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* -------------- Activity 2: Label the picture (write the word) --- */}
        {labelEntries.length > 0 && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACE.sm,
                borderTop: `${RULE.hair} solid ${INK.rule}`,
                paddingTop: SPACE.sm,
                fontSize: TYPE.instruction,
                fontWeight: 700,
              }}
            >
              <ActivityNumber n={2} color={theme.primary} />
              <span>Look at the picture, say the word, then write it.</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: SPACE.sm, marginTop: SPACE.md }}>
              {labelEntries.map((e) => (
                <div key={e.word} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACE.xs }}>
                  <Clipart imageKey={e.imageKey} word={e.word} size={24} />
                  <div style={{ width: '100%' }}>
                    <WritingLine />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </WorksheetFrame>
  );
}
