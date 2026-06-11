import React from 'react';
import type { BookData } from '@/data/schema';
import { getLevelTheme } from '@/design/levelThemes';
import { SPACE, INK, FONT, TYPE, RULE, RADIUS } from '@/design/tokens';
import WorksheetFrame, { ActivityNumber } from '@/components/WorksheetFrame';
import TraceLine from '@/components/TraceLine';

// Activity — Challenge (the extension sheet).
//  (1) Read the alien words — nonsense CVCs built ONLY from taught sounds, so
//      they can't be read from memory; pure decoding. Colour a star per word read.
//  (2) Super sentence — write your own sentence using a tricky word from the bank.
// Reads config.alienWords (or derives a deterministic set) + trickyWords.

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

/** Deterministic nonsense CVCs from the focus sounds, skipping real book words. */
function deriveAlien(book: BookData): string[] {
  const single = book.focusSounds.filter((s) => s.length === 1);
  const vowels = single.filter((s) => VOWELS.has(s));
  const cons = single.filter((s) => !VOWELS.has(s));
  const real = new Set(book.decodableWords.map((w) => w.word.toLowerCase()));
  const out: string[] = [];
  for (const c1 of cons) {
    for (const v of vowels) {
      for (const c2 of cons) {
        if (c1 === c2) continue;
        const w = `${c1}${v}${c2}`;
        if (!real.has(w) && !out.includes(w)) out.push(w);
        if (out.length >= 4) return out;
      }
    }
  }
  return out;
}

/** A small hollow star outline to colour in when a word is read. */
function Star() {
  return (
    <svg width="6mm" height="6mm" viewBox="0 0 24 24" style={{ display: 'block' }}>
      <path
        d="M12 2l2.9 6.2 6.8.7-5.1 4.6 1.5 6.7L12 17.8 5.9 20.2l1.5-6.7L2.3 8.9l6.8-.7z"
        fill="none"
        stroke={INK.ruleStrong}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Challenge({ book }: { book: BookData }) {
  const theme = getLevelTheme(book.level);
  const alien = (book.config?.alienWords ?? deriveAlien(book)).slice(0, 6);
  const tricky = book.trickyWords;

  return (
    <WorksheetFrame
      book={book}
      title="Challenge"
      instruction="Sound out each alien word. Colour a star every time you read one!"
      instructionNumber={1}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* (1) Alien word cards */}
        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', alignContent: 'space-around', gap: SPACE.md, minHeight: 0 }}>
          {alien.map((w) => (
            <div
              key={w}
              style={{
                flex: '1 1 28%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: SPACE.md,
                border: `${RULE.hair} solid ${INK.rule}`,
                borderRadius: RADIUS.box,
                padding: `${SPACE.sm} ${SPACE.md}`,
              }}
            >
              <span style={{ fontFamily: FONT.hand, fontSize: '30pt', fontWeight: 700, color: INK.text, letterSpacing: '0.04em' }}>{w}</span>
              <Star />
            </div>
          ))}
        </div>

        {/* (2) Super sentence */}
        <div
          style={{
            flex: '0 0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: SPACE.sm,
            borderTop: `${RULE.hair} solid ${INK.rule}`,
            paddingTop: SPACE.sm,
            marginTop: SPACE.md,
            fontSize: TYPE.instruction,
            fontWeight: 700,
          }}
        >
          <ActivityNumber n={2} color={theme.primary} />
          <span>Super sentence — write your own sentence using one of these words:</span>
        </div>

        {tricky.length > 0 && (
          <div style={{ display: 'flex', gap: SPACE.md, margin: `${SPACE.sm} 0 ${SPACE.sm} 8mm` }}>
            {tricky.map((t) => (
              <span
                key={t}
                style={{
                  fontFamily: FONT.hand,
                  fontSize: '20pt',
                  fontWeight: 700,
                  color: INK.text,
                  border: `${RULE.hair} solid ${INK.rule}`,
                  borderRadius: RADIUS.card,
                  padding: '0.5mm 3mm',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <div style={{ flex: '0 0 auto' }}>
          <TraceLine text="" xHeightMm={7} />
          <TraceLine text="" xHeightMm={7} />
        </div>
      </div>
    </WorksheetFrame>
  );
}
