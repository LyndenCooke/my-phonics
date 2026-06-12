import React from 'react';
import { getLevelTheme } from '@/design/levelThemes';
import { FONT, INK } from '@/design/tokens';
import { mm } from '@/components/SheetShell';

// ---------------------------------------------------------------------------
// BookStyle — the workbook redesign's design system, taken from the SHIPPED
// BOOK back matter (output/books/Level6, pages 12-18), which is the approved
// quality bar: calm white pages, generous margins, a bold black left-aligned
// heading with one grey instruction line, small-caps level-colour section
// labels separated by dotted dividers, thin level-colour card borders, shaded
// "cover" cells, colour story art in properly cropped framed panels, and the
// book's writing-goal chips (Aa · finger spaces · end mark). No header wave,
// no Watch-first box, no floating art, no bold ban (the books use bold
// headings; body text stays regular).
// ---------------------------------------------------------------------------

export type Theme = ReturnType<typeof getLevelTheme>;

/** Page geometry: A4 with the book's generous margins. */
export const WB2 = {
  marginMm: 14,
  contentWmm: 182,
} as const;

export const TYPE2 = {
  heading: '20pt',
  sub: '10.5pt',
  label: '10pt',
  body: '13pt',
  word: '16pt',
  small: '9pt',
} as const;

/** The root page: white, margins, tiny corner page number (book style). */
export function WbPage({ page, children }: { page: number; children: React.ReactNode }) {
  return (
    <div
      className="page"
      style={{
        position: 'relative',
        width: mm(210),
        height: mm(297),
        background: '#fff',
        overflow: 'hidden',
        fontFamily: FONT.body,
        color: INK.text,
        fontWeight: 400,
      }}
    >
      <div style={{ position: 'absolute', left: mm(WB2.marginMm), right: mm(WB2.marginMm), top: mm(14), bottom: mm(12), display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
      <div style={{ position: 'absolute', left: mm(8), bottom: mm(5), color: INK.faint, fontSize: TYPE2.small }}>{page}</div>
    </div>
  );
}

/** Bold black left heading + one grey instruction line (book back matter). */
export function Heading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ flex: '0 0 auto', marginBottom: mm(5) }}>
      <div style={{ fontWeight: 700, fontSize: TYPE2.heading, color: INK.text, lineHeight: 1.1 }}>{title}</div>
      {sub && <div style={{ marginTop: mm(1.5), color: INK.muted, fontSize: TYPE2.sub }}>{sub}</div>}
    </div>
  );
}

/** Small-caps accent section label ("NOW WRITE EACH WORD"). */
export function SectionLabel({ text, theme }: { text: string; theme: Theme }) {
  return (
    <div style={{ color: theme.accentText, fontSize: TYPE2.label, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: mm(2.5) }}>
      {text}
    </div>
  );
}

/** The dotted divider between sections (book style). */
export function DottedDivider() {
  return <div style={{ borderTop: `0.4mm dotted ${INK.rule}`, margin: `${mm(4.5)} 0` }} />;
}

/** The book's writing-goal chips (p16 "WRITING GOALS"): tick-box + mark +
 *  label. Replaces the old check strip (no caret glyph). */
const GOALS: { mark: string; label: string }[] = [
  { mark: 'Aa', label: 'Capital at the start' },
  { mark: '␣', label: 'Finger spaces' },
  { mark: '. ? !', label: 'Correct end mark' },
];
export function GoalChips({ theme, goals = GOALS }: { theme: Theme; goals?: { mark: string; label: string }[] }) {
  return (
    <div style={{ display: 'flex', gap: mm(6), flexWrap: 'wrap', alignItems: 'center' }}>
      {goals.map((g) => (
        <span key={g.label} style={{ display: 'inline-flex', alignItems: 'center', gap: mm(1.8), fontSize: TYPE2.sub, color: INK.text }}>
          <span style={{ width: mm(4.5), height: mm(4.5), border: `0.4mm solid ${INK.ruleStrong}`, borderRadius: mm(1), flex: '0 0 auto' }} />
          <span style={{ color: theme.accentText, fontWeight: 700 }}>{g.mark}</span>
          {g.label}
        </span>
      ))}
    </div>
  );
}

/** A colour story scene in a properly cropped, framed panel (book p16 style):
 *  rounded corners, hairline border, object-fit cover — the art fills the
 *  frame with no clipped-off edges poking out and can never float. */
export function StoryScene({ src, heightMm, alt = '' }: { src: string; heightMm: number; alt?: string }) {
  return (
    <div style={{ width: '100%', height: mm(heightMm), borderRadius: mm(3), border: `0.4mm solid ${INK.rule}`, overflow: 'hidden' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 30%', display: 'block' }} />
    </div>
  );
}

/** A single plain write line (book ink, 0.4mm). */
export function Line({ heightMm = 11 }: { heightMm?: number }) {
  return <div style={{ height: mm(heightMm), borderBottom: `0.4mm solid ${INK.text}` }} />;
}

/** The word card (thin level-colour border, like "Can You Read These?"). */
export function WordCard({ word, theme, widthMm }: { word: string; theme: Theme; widthMm?: number }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: widthMm ? mm(widthMm) : undefined,
        padding: `${mm(1.2)} ${mm(3)}`,
        border: `0.5mm solid ${theme.primary}`,
        borderRadius: mm(2.5),
        fontSize: TYPE2.word,
        color: INK.text,
        background: '#fff',
      }}
    >
      {word}
    </span>
  );
}
