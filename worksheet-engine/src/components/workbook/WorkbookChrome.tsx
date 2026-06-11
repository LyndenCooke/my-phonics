import React from 'react';
import type { getLevelTheme } from '@/design/levelThemes';
import type { ArtSlot } from '@/data/pool/schema';
import { INK } from '@/design/tokens';
import { SheetPage, mm } from '@/components/SheetShell';
import Clipart, { hasClipart } from '@/components/Clipart';
import { FlowyBackground, FooterStrapline, PageBadge } from '@/components/grammar/FlowyLayout';
import { GRAMMAR_LAYOUT_VARS, gType } from '@/design/grammarTokens';

// ---------------------------------------------------------------------------
// WorkbookChrome — the locked flowy chrome generalised for the workbook's
// non-grammar templates (T1, T4, T5, T6, T8, T9, T10). Identical page
// furniture to FlowyLayout: full-bleed wavy header carrying the title, the
// one type scale (no bold), faint foot ground wave, round page badge, footer
// strapline. Bodies are flex children of the content column.
//
// Art lives ONLY in reserved zones (COMPOSE, DO NOT DECORATE):
//   - FootArt: a reserved full-width band at the page foot. The art sits in
//     the OUTER (right) corner on a ground shadow; the band holds no content,
//     so art over cells/lines/boxes is structurally impossible.
//   - RailArt: the fixed-width right-rail column (a flex sibling — content
//     physically ends where the rail begins). Used beside write lines.
// A slot whose manifest art is missing stays EMPTY (Clipart gate) and is
// surfaced by the QA flag report — never substituted.
// ---------------------------------------------------------------------------

type Theme = ReturnType<typeof getLevelTheme>;

export function FlowyPage({
  theme,
  title,
  page,
  children,
}: {
  theme: Theme;
  title: string;
  page: number;
  children: React.ReactNode;
}) {
  return (
    <SheetPage>
      <FlowyBackground theme={theme} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          ...GRAMMAR_LAYOUT_VARS,
          fontWeight: 400,
          color: INK.text,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ flex: '0 0 ' + mm(40), display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          <div style={{ marginTop: mm(13), textAlign: 'center', color: '#fff', lineHeight: 1.05, padding: `0 ${mm(16)}`, ...gType('title') }}>
            {title}
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: `0 ${mm(6)} ${mm(28)}` }}>
          {children}
        </div>
      </div>
      <FooterStrapline theme={theme} />
      <PageBadge page={page} theme={theme} />
    </SheetPage>
  );
}

/** First art slot with a foot placement (perch / grounded-foot), if any. */
export function footArtSlot(art?: ArtSlot[]): ArtSlot | undefined {
  return (art ?? []).find((a) => a.placement === 'perch' || a.placement === 'grounded-foot');
}

/** The reserved foot band: full content width, fixed height, holds ONLY the
 *  art (right/outer corner). Renders as the body's final flex row, so nothing
 *  else can occupy it and the art cannot reach any cell above. */
export function FootArt({ slot, heightMm = 20 }: { slot?: ArtSlot; heightMm?: number }) {
  if (!slot || !hasClipart(slot.key)) {
    // keep an empty slot genuinely empty (no band at all when nothing renders)
    return null;
  }
  const size = Math.min(slot.sizeMm ?? 16, heightMm - 2);
  return (
    <div style={{ flex: '0 0 auto', height: mm(heightMm), overflow: 'hidden', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', paddingRight: mm(2) }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: mm(size), height: mm(size) }}>
          <Clipart imageKey={slot.key} word={slot.key} fill multiply />
        </div>
        {slot.placement === 'grounded-foot' && (
          <div style={{ width: '70%', height: mm(2), background: INK.text, opacity: 0.12, borderRadius: '50%', marginTop: mm(0.5) }} />
        )}
      </div>
    </div>
  );
}

/** Small filled level-colour number circle (the booklet NumBadge). */
export function NumBadge({ n, theme }: { n: number; theme: Theme }) {
  return (
    <span
      style={{
        flex: '0 0 auto',
        width: mm(8),
        height: mm(8),
        borderRadius: '50%',
        background: theme.primary,
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...gType('instruction'),
      }}
    >
      {n}
    </span>
  );
}

/** Cue chips for the Watch-first strips (Say it · Tap it · Write it …). */
export function CueChips({ cues, theme }: { cues: string[]; theme: Theme }) {
  return (
    <div style={{ display: 'flex', gap: mm(4), flexWrap: 'wrap' }}>
      {cues.map((c) => (
        <span
          key={c}
          style={{
            border: `0.4mm solid ${theme.primary}`,
            borderRadius: mm(4),
            padding: `${mm(1)} ${mm(4)}`,
            color: theme.accentText,
            ...gType('instruction'),
          }}
        >
          {c}
        </span>
      ))}
    </div>
  );
}

/** The flagged empty placeholder for an authoring dependency: the layout is
 *  complete; the content slot is unmistakably awaiting approved content. The
 *  page is excluded from the QA pass-list until the content lands. */
export function DependencySlot({ label, heightMm, theme }: { label: string; heightMm: number; theme: Theme }) {
  return (
    <div
      style={{
        height: mm(heightMm),
        border: `0.5mm dashed ${theme.border}`,
        borderRadius: mm(4),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: INK.faint,
        ...gType('instruction'),
      }}
    >
      {label}
    </div>
  );
}
