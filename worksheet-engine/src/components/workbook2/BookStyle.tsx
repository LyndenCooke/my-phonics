import React from 'react';
import { getLevelTheme } from '@/design/levelThemes';
import { FONT, INK } from '@/design/tokens';
import { mm } from '@/components/SheetShell';
import { SCHOOL_PRINT_METRICS } from '@/design/handwriting';

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

// THE HANDWRITING ROW IS THE MASTER (Lynden, 2026-06-12). Its x-height is
// 5.5 mm; everything else derives from it so reading size, writing size and
// line spacing are ONE system:
//   - `word`/`example` (all child task text) = the handwriting glyph size,
//     so the child reads at the size they are expected to write.
//   - WRITE_PITCH (every plain write line) = the tramline's solid-to-solid
//     band (ascender line to baseline). The dotted guides are invisible on
//     plain lines but the spacing is identical, so the writing comes out the
//     same size everywhere.
export const HW_X_MM = 5.5;
const M = SCHOOL_PRINT_METRICS;
/** the handwriting glyph size (font size whose x-height is HW_X_MM). */
const HW_FONT_MM = HW_X_MM / M.xHeight; // ≈ 10.83mm ≈ 30.7pt
/** The universal write-line pitch. Calibrated by Lynden 2026-06-12: the
 *  WRITING is the focus of every page, so the lines are roomy and prominent
 *  (the handwriting band of 8.5mm read as cramped; 11mm gives the child
 *  space while keeping one consistent rhythm booklet-wide). */
export const WRITE_PITCH_MM = 11;

export const TYPE2 = {
  heading: '21pt',
  example: '22pt', // worked answers on lines — one size for every example
  word: '22pt', // child task text — one size everywhere
  body: '14pt', // instructions and numbers
  label: '11pt', // small-caps section labels and column heads
  small: '9pt', // page number ONLY
} as const;

/** ONE rule weight for every write line (0.4mm rasterised inconsistently). */
export const RULE_W = '0.5mm';

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

/** Bold black left heading + one instruction line (book back matter). The
 *  instruction is BODY size in ink — it is what the child must read, so it is
 *  never small or grey-faint. */
export function Heading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ flex: '0 0 auto', marginBottom: mm(5) }}>
      <div style={{ fontWeight: 700, fontSize: TYPE2.heading, color: INK.text, lineHeight: 1.1 }}>{title}</div>
      {sub && <div style={{ marginTop: mm(2), color: INK.muted, fontSize: TYPE2.body }}>{sub}</div>}
    </div>
  );
}

/** Small-caps accent section label ("NOW WRITE EACH WORD"). */
export function SectionLabel({ text, theme }: { text: string; theme: Theme }) {
  return (
    <div style={{ color: theme.accentText, fontSize: TYPE2.label, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: mm(3) }}>
      {text}
    </div>
  );
}

/** The dotted divider between sections (book style). */
export function DottedDivider() {
  return <div style={{ borderTop: `0.4mm dotted ${INK.rule}`, margin: `${mm(4.5)} 0` }} />;
}

/** The drawn finger-space mark: a clear ⊔ between two word strokes — big
 *  enough for a six-year-old to read at arm's length (no tiny ␣ glyph). */
function FingerSpaceMark({ theme }: { theme: Theme }) {
  return (
    <svg width={mm(9)} height={mm(6)} viewBox="0 0 9 6" style={{ flex: '0 0 auto' }}>
      <path d="M0.6,1 L0.6,4.6 M3,4.6 L3,2.4 M3,4.6 L6,4.6 M6,4.6 L6,2.4 M8.4,1 L8.4,4.6" stroke={theme.accentText} strokeWidth={0.8} fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** The book's writing-goal chips (p16 "WRITING GOALS"): tick-box + a BIG
 *  mark + label. Replaces the old check strip (no caret glyph). */
export function GoalChips({ theme }: { theme: Theme }) {
  const box: React.CSSProperties = { width: mm(6.5), height: mm(6.5), border: `0.45mm solid ${INK.ruleStrong}`, borderRadius: mm(1.2), flex: '0 0 auto' };
  const mark: React.CSSProperties = { color: theme.accentText, fontWeight: 700, fontSize: TYPE2.word, lineHeight: 1 };
  const item: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: mm(2), fontSize: TYPE2.body, color: INK.text, whiteSpace: 'nowrap' };
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={item}><span style={box} /><span style={mark}>Aa</span>Capital at the start</span>
      <span style={item}><span style={box} /><FingerSpaceMark theme={theme} />Finger spaces</span>
      <span style={item}><span style={box} /><span style={mark}>. ? !</span>End mark</span>
    </div>
  );
}

/** A colour story scene in a properly cropped, framed panel (book p16 style):
 *  rounded corners, hairline border, object-fit cover — the art fills the
 *  frame with no clipped-off edges poking out and can never float. */
export function StoryScene({ src, heightMm, pos = '50% 30%', alt = '' }: { src: string; heightMm: number; pos?: string; alt?: string }) {
  return (
    <div style={{ width: '100%', height: mm(heightMm), borderRadius: mm(3), border: `0.4mm solid ${INK.rule}`, overflow: 'hidden' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, display: 'block' }} />
    </div>
  );
}

/** A single plain write line at the universal pitch. Drawn as a
 *  pixel-snapped SVG stroke, NOT a CSS border: borders land on fractional
 *  device pixels and rasterise alternately thick and thin down a page;
 *  crispEdges snapping keeps every line identical. */
export function Line({ heightMm = WRITE_PITCH_MM }: { heightMm?: number }) {
  return (
    <svg width="100%" height={mm(heightMm)} viewBox={`0 0 100 ${heightMm}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <line x1={0} x2={100} y1={heightMm - 0.25} y2={heightMm - 0.25} stroke={INK.text} strokeWidth={0.5} shapeRendering="crispEdges" />
    </svg>
  );
}

/** The book's Sound Spotlight badge: level-colour circle, white sound. */
export function SoundBadge({ sound, theme, sizeMm = 11 }: { sound: string; theme: Theme; sizeMm?: number }) {
  return (
    <span
      style={{
        width: mm(sizeMm),
        height: mm(sizeMm),
        borderRadius: '50%',
        background: theme.primary,
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: TYPE2.body,
        fontWeight: 700,
        flex: '0 0 auto',
      }}
    >
      {sound}
    </span>
  );
}

/** Printed text SEATED ON a write line: the baseline sits on the rule and
 *  descenders dip below it, like real handwriting on the line. (CSS line
 *  boxes float text above the border because of the font's internal leading;
 *  the translate pulls the baseline down onto the rule.) */
export function SeatedText({ text, color, heightMm = WRITE_PITCH_MM }: { text: string; color: string; heightMm?: number }) {
  return (
    <div style={{ position: 'relative', height: mm(heightMm) }}>
      <span style={{ position: 'absolute', left: 0, bottom: 0, fontSize: TYPE2.example, color, lineHeight: 1, transform: 'translateY(10%)', whiteSpace: 'nowrap' }}>
        {text}
      </span>
      {/* the same pixel-snapped rule as every other write line */}
      <svg width="100%" height={mm(1)} viewBox="0 0 100 1" preserveAspectRatio="none" style={{ display: 'block', position: 'absolute', left: 0, bottom: 0 }}>
        <line x1={0} x2={100} y1={0.75} y2={0.75} stroke={INK.text} strokeWidth={0.5} shapeRendering="crispEdges" />
      </svg>
    </div>
  );
}

/** A long worked answer seated across TWO ruled lines (anything past ~34
 *  characters cannot sit on one 182mm line at the handwriting size). The
 *  split balances at a word boundary, like real writing flowing on. */
export function SeatedTextLines({ text, color }: { text: string; color: string }) {
  if (text.length <= 46) return <SeatedText text={text} color={color} />;
  const words = text.split(' ');
  let first = '';
  for (const w of words) {
    if ((first + ' ' + w).trim().length > text.length / 2) break;
    first = (first + ' ' + w).trim();
  }
  const rest = text.slice(first.length).trim();
  return (
    <>
      <SeatedText text={first} color={color} />
      <SeatedText text={rest} color={color} />
    </>
  );
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
