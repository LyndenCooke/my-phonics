import React from 'react';
import type { BookData } from '@/data/schema';
import { getLevelTheme } from '@/design/levelThemes';
import { PAGE, RADIUS, SPACE, RULE, FONT, TYPE, INK } from '@/design/tokens';

// ---------------------------------------------------------------------------
// WorksheetFrame — the LOCKED chrome shared by every worksheet.
//
// Printed-worksheet styling (not a web page): the page is black on white.
// Colour appears ONLY as a small level badge, a single thin header rule, a thin
// footer rule and small accents. No large colour fills, no rounded cards.
// ---------------------------------------------------------------------------

interface Props {
  /** A book drives the header. Omit it and pass the header primitives instead
   *  (used by the per-grapheme sound sheets, which are not a single book). */
  book?: BookData;
  /** Header overrides — required when `book` is omitted. */
  level?: number;
  levelLabel?: string;
  bookTitle?: string;
  levelSubtitle?: string;
  /** Worksheet title, e.g. "Trace the new sounds". */
  title: string;
  /** Child-friendly instruction line. */
  instruction: string;
  /** If the sheet has numbered activities, show this number on the first one. */
  instructionNumber?: number;
  children: React.ReactNode;
}

export default function WorksheetFrame({
  book,
  level: levelProp,
  levelLabel: levelLabelProp,
  bookTitle: bookTitleProp,
  levelSubtitle: levelSubtitleProp,
  title,
  instruction,
  instructionNumber,
  children,
}: Props) {
  const level = book?.level ?? levelProp;
  if (level == null) throw new Error('WorksheetFrame needs a `book` or an explicit `level`.');
  const levelLabel = book?.levelLabel ?? levelLabelProp ?? '';
  const bookTitle = book?.bookTitle ?? bookTitleProp ?? '';
  const levelSubtitle = book?.levelSubtitle ?? levelSubtitleProp ?? '';
  const theme = getLevelTheme(level); // throws if level has no theme

  return (
    <div
      className="page"
      style={{
        width: PAGE.width,
        height: PAGE.height,
        padding: PAGE.inset,
        boxSizing: 'border-box',
        background: '#fff',
        color: INK.text,
        fontFamily: FONT.body,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ----------------------------------------------------- HEADER ------ */}
      <header style={{ flex: '0 0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACE.sm }}>
          {/* Small level badge — one of the few coloured elements. */}
          <span
            style={{
              flex: '0 0 auto',
              background: theme.primary,
              color: '#fff',
              borderRadius: RADIUS.box,
              fontWeight: 700,
              fontSize: '10pt',
              letterSpacing: '0.02em',
              padding: '1mm 2.5mm',
              transform: 'translateY(-0.5mm)',
            }}
          >
            {levelLabel}
          </span>

          {/* Title (black) */}
          <h1 style={{ flex: 1, margin: 0, fontSize: TYPE.bannerTitle, fontWeight: 700, color: INK.text, lineHeight: 1.05 }}>
            {title}
          </h1>

          {/* Book + level subtitle (grey, right) */}
          <div style={{ textAlign: 'right', lineHeight: 1.25, flex: '0 0 auto' }}>
            <div style={{ fontWeight: 700, fontSize: '10.5pt', color: INK.text }}>{bookTitle}</div>
            <div style={{ fontSize: TYPE.chip, color: INK.muted }}>{levelSubtitle}</div>
          </div>
        </div>

        {/* The single coloured rule. */}
        <div style={{ height: RULE.header, background: theme.primary, marginTop: SPACE.xs, borderRadius: '1px' }} />
      </header>

      {/* ----------------------------------------------- INSTRUCTION ------ */}
      <div
        style={{
          marginTop: SPACE.sm,
          display: 'flex',
          alignItems: 'center',
          gap: SPACE.sm,
          fontSize: TYPE.instruction,
          color: INK.text,
        }}
      >
        {instructionNumber != null ? (
          <ActivityNumber n={instructionNumber} color={theme.primary} />
        ) : (
          /* small colour accent bullet, not a fill */
          <span style={{ flex: '0 0 auto', width: '2.5mm', height: '2.5mm', borderRadius: '50%', background: theme.primary }} />
        )}
        <span style={{ fontWeight: 700 }}>{instruction}</span>
      </div>

      {/* --------------------------------------------- ACTIVITY AREA ------ */}
      <main style={{ flex: 1, marginTop: SPACE.sm, minHeight: 0 }}>{children}</main>

      {/* ---------------------------------------------------- FOOTER ------ */}
      <footer style={{ flex: '0 0 auto', marginTop: SPACE.sm }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: TYPE.footer,
            color: INK.faint,
            borderTop: `${RULE.hair} solid ${INK.rule}`,
            paddingTop: SPACE.xs,
          }}
        >
          <span>
            <strong style={{ color: theme.primary }}>MyPhonicsBooks</strong> · myphonicsbooks.co.uk
          </span>
          <span>
            {[levelLabel, bookTitle].filter(Boolean).join(' · ')}
          </span>
        </div>
      </footer>
    </div>
  );
}

/** Small round activity-number badge in the level colour. */
export function ActivityNumber({ n, color }: { n: number; color: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '6mm',
        height: '6mm',
        borderRadius: '50%',
        background: color,
        color: '#fff',
        fontWeight: 700,
        fontSize: '11pt',
        flex: '0 0 auto',
      }}
    >
      {n}
    </span>
  );
}
