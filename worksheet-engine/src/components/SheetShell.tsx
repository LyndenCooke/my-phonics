import React from 'react';
import { FONT, INK } from '@/design/tokens';
import Clipart from '@/components/Clipart';
import type { LevelTheme } from '@/design/levelThemes';

// ---------------------------------------------------------------------------
// SheetShell — the LOCKED `sound_a` chrome, extracted from SingleSound.tsx so
// EVERY strand (Sound, Grammar, …) renders through the same header bar, panels,
// section heads and footer. A Grammar sheet and a Sound sheet must read as one
// scheme; that only holds if they share this chrome rather than each rebuilding
// its own. See worksheet_template_spec.md (the design contract) and the L6
// grammar build spec.
//
// Fixed A4 in millimetres, absolutely positioned (NOT flowing layout). Children
// position themselves with the exported geometry helpers (PAGE/M/W/PAD/mm/abs).
// ---------------------------------------------------------------------------

export const PAGE = { w: 210, h: 297 };
export const M = 6; // outer margin
export const W = PAGE.w - 2 * M; // 198 content width
export const PAD = 6; // panel inner padding

export const mm = (n: number) => `${n}mm`;
export const abs = (x: number, y: number, w: number, h: number): React.CSSProperties => ({
  position: 'absolute',
  left: mm(x),
  top: mm(y),
  width: mm(w),
  height: mm(h),
  boxSizing: 'border-box',
});

/** White, level-border, rounded — the standard activity panel. */
export const panelStyle = (border: string): React.CSSProperties => ({
  background: '#fff',
  border: `0.6mm solid ${border}`,
  borderRadius: mm(6),
});

/** A smaller bordered card (used inside panels, e.g. missing-sound cards). */
export const cardStyle = (border: string): React.CSSProperties => ({
  background: '#fff',
  border: `0.5mm solid ${border}`,
  borderRadius: mm(4),
  boxSizing: 'border-box',
});

/** The root A4 page. */
export function SheetPage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="page"
      style={{
        position: 'relative',
        width: mm(PAGE.w),
        height: mm(PAGE.h),
        background: '#fff',
        overflow: 'hidden',
        fontFamily: FONT.body,
        color: INK.text,
      }}
    >
      {children}
    </div>
  );
}

interface HeaderProps {
  theme: LevelTheme;
  /** Centred white title — the sheet topic (e.g. "The Sound a", "Four kinds of sentence"). */
  title: string;
  /** Title font size in pt (28 for the sound master; smaller for longer titles). */
  titlePt?: number;
  /** First pill (white): the level label, e.g. "L6" / "Level 1". */
  levelLabel: string;
  /** Second pill: the STRAND, e.g. "Grammar" / "Handwriting". */
  strand: string;
  /** Strand-pill colours. Defaults to the sound master's amber. */
  strandPill?: { bg: string; color: string };
  /** Left white tile: a mascot clipart key (rendered if the art exists). */
  mascotImageKey?: string;
  mascotWord?: string;
  /** Fallback glyph drawn in the tile when no mascot art is given/resolves. */
  tileGlyph?: string;
}

const HEADER = { y: 6, h: 26 };
const AMBER = { bg: '#FBEDC8', color: '#9A6A00' };

/** The indigo/level header bar: centred title, left mascot tile, right pills.
 *  Byte-for-byte the sound_a header, parameterised. */
export function SheetHeader({
  theme,
  title,
  titlePt = 28,
  levelLabel,
  strand,
  strandPill = AMBER,
  mascotImageKey,
  mascotWord = '',
  tileGlyph,
}: HeaderProps) {
  const primary = theme.primary;
  const hasMascot = !!mascotImageKey;
  const tileW = hasMascot ? 20 : 17;
  const tileH = hasMascot ? 20 : 17;

  return (
    <div style={{ ...abs(M, HEADER.y, W, HEADER.h), background: primary, borderRadius: mm(6) }}>
      {/* title — fills the bar, centred both axes; constrained width so a long
          title wraps in the middle without colliding with tile/pills. */}
      <div
        style={{
          ...abs(0, 0, W, HEADER.h),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `0 ${mm(46)}`,
          textAlign: 'center',
          color: '#fff',
          fontWeight: 700,
          fontSize: `${titlePt}pt`,
          lineHeight: 1.05,
          letterSpacing: '0.005em',
        }}
      >
        {title}
      </div>

      {/* left tile — mascot if art exists, else a clean brand glyph */}
      <div
        style={{
          ...abs(4, (HEADER.h - tileH) / 2, tileW, tileH),
          background: '#fff',
          borderRadius: mm(4.5),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: hasMascot ? '1mm' : 0,
        }}
      >
        {hasMascot ? (
          <Clipart imageKey={mascotImageKey!} word={mascotWord} multiply fill />
        ) : (
          <span style={{ fontFamily: FONT.hand, fontSize: '17pt', fontWeight: 700, color: primary, lineHeight: 1 }}>
            {tileGlyph ?? ''}
          </span>
        )}
      </div>

      {/* right pills — level pill over strand pill, vertically centred */}
      <div
        style={{
          ...abs(W - 40, (HEADER.h - 15) / 2, 36, 15),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: mm(1.5),
        }}
      >
        <span style={{ background: '#fff', color: primary, fontWeight: 700, fontSize: '9pt', borderRadius: mm(4), padding: '0.5mm 3mm' }}>
          {levelLabel}
        </span>
        <span style={{ background: strandPill.bg, color: strandPill.color, fontWeight: 700, fontSize: '8.5pt', borderRadius: mm(4), padding: '0.5mm 2.5mm' }}>
          {strand}
        </span>
      </div>
    </div>
  );
}

/** Level numbered circle + black title + grey subtitle, pinned to a panel top.
 *  Identical to the sound master's section head. */
export function SectionHead({
  n,
  title,
  subtitle,
  accent,
  inlineSubtitle = false,
  titleColor = INK.text,
}: {
  n: number;
  title: string;
  subtitle?: string;
  accent: string;
  inlineSubtitle?: boolean;
  titleColor?: string;
}) {
  return (
    <div style={{ position: 'absolute', left: mm(PAD), top: mm(PAD - 1), right: mm(PAD), display: 'flex', alignItems: 'baseline', columnGap: mm(3), rowGap: mm(1), flexWrap: 'wrap' }}>
      <span
        style={{
          alignSelf: 'center',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: mm(7),
          height: mm(7),
          borderRadius: '50%',
          background: accent,
          color: '#fff',
          fontWeight: 700,
          fontSize: '12pt',
          flex: '0 0 auto',
        }}
      >
        {n}
      </span>
      <span style={{ color: titleColor, fontWeight: 700, fontSize: '16pt' }}>{title}</span>
      {subtitle && (
        <span style={{ color: INK.muted, fontSize: '10.5pt', ...(inlineSubtitle ? {} : { width: '100%', paddingLeft: mm(10) }) }}>
          {subtitle}
        </span>
      )}
    </div>
  );
}

/** Grey caption bar at the foot. Left = brand, right = sheet caption. */
export function SheetFooter({ theme, right }: { theme: LevelTheme; right: string }) {
  return (
    <div
      style={{
        ...abs(M, 285, W, 7),
        background: '#F1F1F1',
        borderRadius: mm(3),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 5mm',
        color: INK.muted,
        fontSize: '8.5pt',
      }}
    >
      <span>
        <strong style={{ color: theme.primary }}>MyPhonicsBooks</strong> · decodable phonics practice
      </span>
      <span>{right}</span>
    </div>
  );
}
