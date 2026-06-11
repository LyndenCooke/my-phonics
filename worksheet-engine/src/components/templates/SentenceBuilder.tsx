import React from 'react';
import type { BookData } from '@/data/schema';
import { getLevelTheme } from '@/design/levelThemes';
import { SPACE, INK, FONT, TYPE, RULE, RADIUS } from '@/design/tokens';
import WorksheetFrame from '@/components/WorksheetFrame';
import TraceLine from '@/components/TraceLine';

// Activity — Read and write the sentence.
// TOP: a small reminder strip of the book's grammar goals (capital letter,
// finger spaces, full stop). BODY: each sentence shown as a model, then a blank
// ruled handwriting line to copy it. Reads sentences + grammarGoals.
export default function SentenceBuilder({ book }: { book: BookData }) {
  const theme = getLevelTheme(book.level);
  const sentences = book.sentences.slice(0, 3);
  const reminders = book.grammarGoals.slice(0, 3);

  return (
    <WorksheetFrame
      book={book}
      title="Read and write"
      instruction="Read each sentence out loud, then write it neatly on the line."
      instructionNumber={1}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Grammar reminder strip */}
        {reminders.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: `1.5mm ${SPACE.md}`,
              border: `${RULE.hair} solid ${INK.rule}`,
              borderRadius: RADIUS.card,
              padding: `${SPACE.xs} ${SPACE.md}`,
              marginBottom: SPACE.md,
            }}
          >
            <span style={{ fontSize: TYPE.chip, fontWeight: 700, color: INK.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Remember
            </span>
            {reminders.map((r) => (
              <span key={r} style={{ display: 'inline-flex', alignItems: 'center', gap: SPACE.xs, fontSize: TYPE.hint, color: INK.text }}>
                <span style={{ width: '2mm', height: '2mm', borderRadius: '50%', background: theme.primary, flex: '0 0 auto' }} />
                {r}
              </span>
            ))}
          </div>
        )}

        {/* Sentences: model + a line to copy onto */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', minHeight: 0 }}>
          {sentences.map((s, i) => (
            <div key={i}>
              <div style={{ fontFamily: FONT.hand, fontSize: '20pt', fontWeight: 700, color: INK.text, marginBottom: '1.5mm' }}>
                {s}
              </div>
              <TraceLine text="" xHeightMm={7} />
            </div>
          ))}
        </div>
      </div>
    </WorksheetFrame>
  );
}
