import React from 'react';
import type { BookData } from '@/data/schema';
import { getLevelTheme } from '@/design/levelThemes';
import { SPACE, INK, FONT, TYPE, RULE, RADIUS } from '@/design/tokens';
import WorksheetFrame from '@/components/WorksheetFrame';
import Clipart from '@/components/Clipart';

// Activity — Cut and stick by sound.
// TOP: one empty bin per sound (a place to stick). BOTTOM: a "cut here" strip of
// picture cards (no word — the child names the picture, hears the FIRST sound,
// and sticks it in the right bin). A hands-on version of sort-by-sound.
// Reads sortBins (the bins) + labelWords/clipart (the cards).
export default function CutAndStick({ book }: { book: BookData }) {
  const theme = getLevelTheme(book.level);

  // Cards = the words that have clipart (the only ones we can show as a picture).
  const cards = (book.config?.labelWords ?? book.decodableWords.map((w) => w.word))
    .map((w) => book.decodableWords.find((d) => d.word === w))
    .filter((d): d is NonNullable<typeof d> => Boolean(d))
    .slice(0, 6);

  // Bins are derived from the cards' OWN initial sounds (ordered by focusSounds)
  // so every card has a home and no bin is left unfillable. This intentionally
  // ignores config.sortBins, whose words may not all have clipart.
  const cardSounds = new Set(cards.map((c) => c.word[0].toLowerCase()));
  const bins = book.focusSounds.filter((s) => cardSounds.has(s.toLowerCase()));

  return (
    <WorksheetFrame
      book={book}
      title="Cut and stick by sound"
      instruction="Cut out the pictures. Say each one and stick it under its first sound."
      instructionNumber={1}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Bins to stick into */}
        <div style={{ flex: 1, display: 'flex', gap: SPACE.md, minHeight: 0 }}>
          {bins.map((sound) => (
            <div
              key={sound}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                border: `${RULE.hair} solid ${INK.rule}`,
                borderRadius: RADIUS.box,
                overflow: 'hidden',
              }}
            >
              <div style={{ textAlign: 'center', paddingTop: SPACE.sm }}>
                <span style={{ fontFamily: FONT.hand, fontSize: '26pt', fontWeight: 700, color: INK.text }}>{sound}</span>
                <div style={{ height: RULE.header, width: '14mm', margin: '1.5mm auto 0', background: theme.primary, borderRadius: '1px' }} />
              </div>
              <div style={{ flex: 1 }} />
            </div>
          ))}
        </div>

        {/* Cut line */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACE.sm,
            margin: `${SPACE.md} 0`,
            color: INK.faint,
            fontSize: TYPE.hint,
          }}
        >
          <span style={{ flex: '0 0 auto', fontWeight: 700, letterSpacing: '0.04em' }}>✂ cut here</span>
          <span style={{ flex: 1, borderTop: `0.4mm dashed ${INK.ruleStrong}` }} />
        </div>

        {/* Picture cards to cut out */}
        <div style={{ flex: '0 0 auto', display: 'flex', gap: SPACE.sm, justifyContent: 'space-between' }}>
          {cards.map((c) => (
            <div
              key={c.word}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: SPACE.xs,
                border: `0.4mm dashed ${INK.ruleStrong}`,
                borderRadius: RADIUS.box,
              }}
            >
              <Clipart imageKey={c.imageKey} word={c.word} size={20} />
            </div>
          ))}
        </div>
      </div>
    </WorksheetFrame>
  );
}
