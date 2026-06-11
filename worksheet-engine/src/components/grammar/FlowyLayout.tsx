import React from 'react';
import type { GrammarUnit } from '@/data/grammarSchema';
import { getLevelTheme } from '@/design/levelThemes';
import { INK } from '@/design/tokens';
import Clipart, { hasClipart } from '@/components/Clipart';
import { SheetPage, mm } from '@/components/SheetShell';
import { WriteLine } from '@/components/WriteLine';
import { GRAMMAR_LAYOUT_VARS, gType, gSize } from '@/design/grammarTokens';
import { FootSceneBand, ApplyRail, CheckStrip, applyRailKey, hasFootBand } from '@/components/grammar/Illustration';

// ---------------------------------------------------------------------------
// FlowyLayout — the LOCKED "flowy" grammar chrome. Shared by every grammar
// format and by the booklet front/back matter so the whole pack reads as one
// scheme. Per grammar_layout_spec.md:
//   - full-bleed wavy header, level colour, white centred TITLE ONLY
//     (no pills, no mascot tile, no subtitle on a worksheet page).
//   - a soft tinted "Watch first" box: label, the worked example (inline with a
//     centred arrow, or stacked for a long rewrite), and an optional terminology
//     note at instruction size in ink.
//   - the instruction line, then the format body, then the apply line + ruled
//     lines, all on the ONE type scale, NO bold, plain black writing lines at a
//     constant `--write-line-gap`.
//   - a faint ground wave, a round page badge and a footer strapline.
//   - a decoration layer of 2–3 flat line-art objects in white space.
//
// The type scale and writing-line gap are set ONCE here, as CSS vars on the page
// root, and read everywhere through gSize()/gType() and the WriteLine token.
// ---------------------------------------------------------------------------

const INK_LINE = '#1A1A1A';
/** Usable Watch-first width: content 198 minus 2 × 8 mm padding. */
const WATCH_USABLE_MM = 182;
const FOOTER_TEXT = 'MyPhonicsBooks · myphonicsbooks.co.uk';

/** The page background: full-bleed wavy header band + a faint ground wave. */
export function FlowyBackground({ theme }: { theme: ReturnType<typeof getLevelTheme> }) {
  return (
    <>
      {/* solid fill at the very top so the band bleeds to the edge regardless of
          the wavy path. */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: mm(210), height: mm(20), background: theme.primary }} />
      <svg viewBox="0 0 210 297" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: mm(210), height: mm(297) }}>
        {/* header band: bottom edge is one sine period, mean y 38, amplitude 4
            (runs between y 34 and y 42). */}
        <path d="M0,0 L210,0 L210,38 C175,42 140,42 105,38 C70,34 35,34 0,38 Z" fill={theme.primary} />
        {/* faint ground wave behind the footer, level colour at 8% */}
        <path d="M0,281 C48,273 96,289 146,279 C180,272 198,284 210,279 L210,297 L0,297 Z" fill={theme.primary} opacity={0.08} />
      </svg>
    </>
  );
}

/** The round page-number badge (level colour fill, white number, footer role). */
export function PageBadge({ page, theme }: { page: number; theme: ReturnType<typeof getLevelTheme> }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: mm(186),
        top: mm(279),
        width: mm(12),
        height: mm(12),
        background: theme.primary,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        ...gType('footer'),
      }}
    >
      {page}
    </div>
  );
}

/** The footer strapline, baseline near y 289, footer role. */
export function FooterStrapline({ theme, text = FOOTER_TEXT }: { theme: ReturnType<typeof getLevelTheme>; text?: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: mm(6),
        top: mm(286),
        height: mm(6),
        display: 'flex',
        alignItems: 'center',
        color: INK.muted,
        ...gType('footer'),
      }}
    >
      <span style={{ color: theme.primary }}>{text.split(' · ')[0]}</span>
      <span>&nbsp;· {text.split(' · ').slice(1).join(' · ')}</span>
    </div>
  );
}

/** The decoration layer: 2–3 flat line-art objects placed in white space, on
 *  their own absolute layer (never affects content). Drawn only where the art
 *  exists, so missing keys degrade to nothing rather than a placeholder box. */
export function DecorationLayer({ unit }: { unit: { decorations?: GrammarUnit['decorations'] } }) {
  return (
    <>
      {(unit.decorations ?? []).map((d, i) =>
        hasClipart(d.key) ? (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: mm(d.xMm),
              top: mm(d.yMm),
              width: mm(d.sizeMm),
              height: mm(d.sizeMm),
              transform: d.rotationDeg ? `rotate(${d.rotationDeg}deg)` : undefined,
            }}
          >
            <Clipart imageKey={d.key} word={d.key} fill multiply />
          </div>
        ) : null,
      )}
    </>
  );
}

/** The worked example inside the Watch-first box. Short → inline (prompt, centred
 *  arrow, answer in accent). Long or marked stacked → two lines. Gap-fill (cloze)
 *  shows the complete sentence with the answer written into the gap. Circle shows
 *  the example sentence with its adjective circled and its adverb underlined. */
function WorkedExample({ unit }: { unit: GrammarUnit }) {
  const theme = getLevelTheme(unit.level);
  const { prompt, answer } = unit.s1;
  const gapFill = prompt.includes('___');

  // circle: show the marked sentence (adjective circled, adverb underlined).
  if (unit.format === 'circle') {
    const [adj = '', adv = ''] = answer.split('/').map((s) => s.trim());
    const tokens = prompt.split(/(\s+)/);
    return (
      <div style={{ ...gType('body'), color: INK.text, lineHeight: 1.35 }}>
        {tokens.map((tk, i) => {
          const bare = tk.replace(/[.,!?]/g, '');
          if (adj && bare === adj) {
            return (
              <span key={i} style={{ border: `0.6mm solid ${theme.accentText}`, borderRadius: '50%', padding: '0 2.5mm', color: theme.accentText }}>{tk}</span>
            );
          }
          if (adv && bare === adv) {
            return (
              <span key={i} style={{ borderBottom: `0.8mm solid ${theme.accentText}`, color: theme.accentText }}>{tk}</span>
            );
          }
          return <span key={i}>{tk}</span>;
        })}
      </div>
    );
  }

  // cloze: complete sentence, answer written in the gap (accent + underline).
  if (gapFill) {
    const [head, tail = ''] = prompt.split('___');
    return (
      <div style={{ ...gType('body'), color: INK.text, lineHeight: 1.35 }}>
        {head}
        <span style={{ color: theme.accentText, borderBottom: `0.5mm solid ${theme.border}`, padding: '0 2mm' }}>{answer}</span>
        {tail}
      </div>
    );
  }

  // inline vs stacked. Estimate the inline width at 18 pt; fall back to stacked
  // if it would exceed the usable Watch-first width.
  const estWidthMm = (prompt.length + answer.length + 3) * 3.1;
  const stacked = unit.s1.exampleLayout === 'stacked' || estWidthMm > WATCH_USABLE_MM;

  if (stacked) {
    return (
      <div style={{ ...gType('body'), lineHeight: 1.4 }}>
        <div style={{ color: INK.text }}>{prompt}</div>
        <div style={{ color: theme.accentText }}>{answer}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: mm(6), ...gType('body') }}>
      <span style={{ color: INK.text }}>{prompt}</span>
      <span style={{ color: theme.primary }}>→</span>
      <span style={{ color: theme.accentText }}>{answer}</span>
    </div>
  );
}

export function FlowyLayout({
  unit,
  page,
  children,
}: {
  unit: GrammarUnit;
  page: number;
  children: React.ReactNode;
}) {
  const theme = getLevelTheme(unit.level);
  const applyLines = unit.apply?.lines ?? 3;
  // The review page reuses approved rows and has no worked example, so it skips
  // the Watch-first box and gives the items the full body height.
  const showWatch = unit.format !== 'review';
  // The reserved zones: a right rail BESIDE the apply lines (a flex sibling —
  // the lines column physically ends where the rail begins) and/or the foot
  // band BELOW the apply block. Geometry lives in the components, not the data.
  const railKey = applyRailKey(unit.illustration);
  const footBand = hasFootBand(unit.illustration);

  return (
    <SheetPage>
      <FlowyBackground theme={theme} />

      {/* content column — sets the one type scale + regular weight for every
          descendant, then flows the regions top to bottom. */}
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
        {/* header band spacer — title centred, vertical centre ~ y 20 */}
        <div style={{ flex: '0 0 ' + mm(40), display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          <div style={{ marginTop: mm(13), textAlign: 'center', color: '#fff', lineHeight: 1.05, padding: `0 ${mm(16)}`, ...gType('title') }}>
            {unit.name}
          </div>
        </div>

        {/* the worksheet body, inside the content box. No motif band — the
            header wave and the foot ground wave carry the flowy identity. */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: `0 ${mm(6)} ${mm(28)}` }}>
          {/* Watch first box — an optional small line-art accent sits in its
              reserved right rail, never behind the example text. */}
          {showWatch && (
            <div style={{ flex: '0 0 auto', background: theme.light, borderRadius: mm(6), padding: mm(6), display: 'flex', alignItems: 'center', gap: mm(5) }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...gType('instruction'), color: theme.accentText, marginBottom: mm(3) }}>Watch first</div>
                <WorkedExample unit={unit} />
                {unit.s1.note && (
                  <div style={{ ...gType('instruction'), color: INK.text, lineHeight: 1.3, marginTop: mm(3) }}>{unit.s1.note}</div>
                )}
              </div>
              {(unit.watchArt ?? []).filter((k) => hasClipart(k)).slice(0, 2).map((k) => (
                <div key={k} style={{ flex: '0 0 auto', width: mm(16), height: mm(16) }}>
                  <Clipart imageKey={k} word={k} fill multiply />
                </div>
              ))}
            </div>
          )}

          {/* instruction line — Watch-first bottom + 5 mm */}
          <div style={{ flex: '0 0 auto', marginTop: showWatch ? mm(5) : 0, ...gType('instruction'), color: INK.text }}>
            {unit.doInstruction}
          </div>

          {/* activity area — instruction bottom + one write-line-gap */}
          <div style={{ flex: 1, minHeight: 0, marginTop: 'var(--write-line-gap)', position: 'relative' }}>
            {children}
          </div>

          {/* apply block — one full instruction sentence, then ruled lines whose
              first line sits one write-line-gap below the prompt. When a rail is
              reserved it is a fixed-width flex SIBLING of this column, so the
              lines end where the rail begins — overlap is impossible. */}
          {unit.apply && (
            <div style={{ flex: '0 0 auto', marginTop: mm(6), display: 'flex', alignItems: 'flex-end', gap: mm(4) }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...gType('instruction'), color: INK.text }}>{unit.apply.prompt}</div>
                {/* self-check strip sits directly above the apply ruled lines */}
                {unit.check && (
                  <div style={{ marginTop: mm(3), marginBottom: mm(2) }}>
                    <CheckStrip items={unit.check.items} theme={theme} />
                  </div>
                )}
                {/* WriteLine's first row is itself one gap tall, so its first rule
                    sits exactly one --write-line-gap below the prompt. */}
                <WriteLine lines={applyLines} color={INK_LINE} />
              </div>
              {railKey && <ApplyRail imageKey={railKey} heightMm={unit.illustration?.railHeightMm} />}
            </div>
          )}

          {/* reserved foot band — a full-width, full-opacity scene below the
              apply block. Holds no content; the art never leaves it. */}
          {footBand && unit.illustration && (
            <FootSceneBand illustration={unit.illustration} />
          )}
        </div>
      </div>

      {/* all L6 art renders inside the reserved zones above (foot band, apply
          rail, row art column, watch accent). Only legacy levels without an
          `illustration` still use the absolute decoration layer. */}
      {!unit.illustration && <DecorationLayer unit={unit} />}
      <FooterStrapline theme={theme} />
      <PageBadge page={page} theme={theme} />
    </SheetPage>
  );
}

// Kept for any importer expecting the old shared constant. Line colour is now
// the ink token; the gap is the `--write-line-gap` CSS var.
export const FLOW = { line: INK_LINE, sentencePt: 18, examplePt: 18 };

// Re-export so format bodies can read the body role size when needed.
export { gSize };
