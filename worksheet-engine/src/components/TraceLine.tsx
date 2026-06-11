import React from 'react';
import { INK, PAGE } from '@/design/tokens';
import { TRACE_METRICS, handwritingRow, type FontMetrics } from '@/design/handwriting';

// ---------------------------------------------------------------------------
// TraceLine — one SVG handwriting row: four ruled guidelines (ascender,
// x-height, baseline, descender) plus optional dotted letters to trace.
//
// Alignment is exact, not tuned: the SVG <text> `y` attribute IS the alphabetic
// baseline, so glyphs sit ON the baseline regardless of the font's leading. The
// guideline Y positions come from the trace font's REAL measured metrics
// (handwriting.ts), so x-letters fill baseline->x-height, ascenders touch the
// top line and descenders reach the bottom line.
//
// The SVG is sized in real millimetres (viewBox units == mm). It fills its
// container width; preserveAspectRatio="none" keeps the VERTICAL scale locked to
// mm (so seating stays exact) while the width stretches to fit — with widthMm
// set to the true container width the horizontal scale is ~1, so glyphs are not
// distorted.
// ---------------------------------------------------------------------------

interface Props {
  /** Letters/words to trace. Empty string => a blank ruled writing row. */
  text?: string;
  /** x-height in mm — the real letter size. Bigger for early levels. */
  xHeightMm?: number;
  /** Row width in mm (defaults to the full content width). */
  widthMm?: number;
  /** Trace font metrics (defaults to the school-print face). */
  metrics?: FontMetrics;
  /** Colour of the dotted trace glyphs. */
  color?: string;
  /** Left inset before the first glyph, in mm. */
  startXMm?: number;
  /** Extra space between glyphs, in mm (user units). */
  letterSpacingMm?: number;
  /** Extra gap between words (on top of the font's space), in mm — a finger space. */
  wordSpacingMm?: number;
  /** Show the ascender (top) line. */
  showAscender?: boolean;
  /** Show the descender (bottom) line. */
  showDescender?: boolean;
  /** A leading BLACK model portion (e.g. the first letter), rendered before the
   *  grey trace `text` on the same baseline (shared <text> => no measuring). */
  model?: string;
  /** Font weight of the model portion. 700 (bold) for trace models; 400 reads
   *  cleaner for whole black words like the missing-sound cards. */
  modelWeight?: number;
  /** Colour of the x-height (mid) guideline. Defaults to faint grey. */
  midlineColor?: string;
  /** Render the ascender (top) line dashed instead of solid. */
  ascenderDashed?: boolean;
  /** Horizontal anchoring of the glyphs. 'middle' optically centres the word
   *  on the line (used for the "missing letter" cards). */
  align?: 'start' | 'middle';
  /** Per-letter runs rendered as consecutive tspans in ONE <text>. Lets a word
   *  be drawn with some letters invisible (fill:'transparent') so the missing
   *  grapheme still reserves its real width and the visible letters centre as
   *  the COMPLETE word would. Overrides model/text when set. */
  segments?: { text: string; fill?: string; fontWeight?: number }[];
  /** Re-enable OpenType joining features (calt/liga) on THIS row's glyphs only.
   *  The global stylesheet kills every discretionary feature to protect
   *  decodable body text from ligature glyph-eating; a joined handwriting model
   *  (SchoolJoined) needs its contextual joins back. Scoped here, nowhere else. */
  joined?: boolean;
}

export default function TraceLine({
  text = '',
  xHeightMm = 9,
  widthMm = PAGE.contentWidthMm,
  metrics = TRACE_METRICS,
  color = INK.trace,
  startXMm = 4,
  letterSpacingMm = 0,
  wordSpacingMm = 0,
  showAscender = true,
  showDescender = true,
  model,
  modelWeight = 700,
  midlineColor,
  ascenderDashed = false,
  align = 'start',
  segments,
  joined = false,
}: Props) {
  const g = handwritingRow(xHeightMm, metrics);
  const anchorX = align === 'middle' ? widthMm / 2 : startXMm;

  const lineProps = (
    y: number,
    stroke: string,
    width: number,
    dash?: string,
  ): React.SVGProps<SVGLineElement> => ({
    x1: 0,
    x2: widthMm,
    y1: y,
    y2: y,
    stroke,
    strokeWidth: width,
    strokeDasharray: dash,
  });

  return (
    <svg
      width="100%"
      height={`${g.heightMm}mm`}
      viewBox={`0 0 ${widthMm} ${g.heightMm}`}
      preserveAspectRatio="none"
      style={{ display: 'block' }}
    >
      {/* Guidelines (top -> bottom) */}
      {showAscender && (
        <line {...lineProps(g.ascenderY, INK.guideFaint, 0.3, ascenderDashed ? '1.6 1.4' : undefined)} />
      )}
      <line {...lineProps(g.xHeightY, midlineColor ?? INK.faint, 0.3, '1.6 1.4')} />
      <line {...lineProps(g.baselineY, INK.ruleStrong, 0.45)} />
      {showDescender && (
        <line {...lineProps(g.descenderY, INK.guideFaint, 0.3, '1.6 1.4')} />
      )}

      {/* Glyphs — baseline = g.baselineY (exact). Optional black model portion
          then the grey trace text, sharing one <text> so they flow together. */}
      {(text || model || (segments && segments.length > 0)) && (
        <text
          x={anchorX}
          y={g.baselineY}
          textAnchor={align === 'middle' ? 'middle' : undefined}
          fontFamily={metrics.family}
          fontSize={g.fontSizeMm}
          letterSpacing={letterSpacingMm || undefined}
          wordSpacing={wordSpacingMm || undefined}
          xmlSpace="preserve"
          style={joined ? { fontFeatureSettings: '"calt" 1, "liga" 1', fontVariantLigatures: 'common-ligatures contextual' } : undefined}
        >
          {segments && segments.length > 0 ? (
            segments.map((s, i) => (
              <tspan key={i} fill={s.fill ?? color} fontWeight={s.fontWeight}>
                {s.text}
              </tspan>
            ))
          ) : (
            <>
              {model && (
                <tspan fill={INK.text} fontWeight={modelWeight}>
                  {model}
                </tspan>
              )}
              {text && <tspan fill={color}>{model ? ` ${text}` : text}</tspan>}
            </>
          )}
        </text>
      )}
    </svg>
  );
}
