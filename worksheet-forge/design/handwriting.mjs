// ---------------------------------------------------------------------------
// Handwriting line system — a straight port of the engine's TraceLine.tsx +
// handwriting.ts (metric-driven guideline math, baseline-exact glyph seating).
// Emits SVG strings instead of React elements. viewBox units == mm,
// preserveAspectRatio="none" keeps the vertical scale locked to mm.
// ---------------------------------------------------------------------------
import { INK, CONTENT_W, FONTS } from './tokens.mjs';

// Andika metrics measured from real glyph boxes (worksheet-engine
// scripts/measure-font.mjs) — em ratios, baseline = 0.
export const TRACE_METRICS = {
  xHeight: 0.5078,
  ascender: 0.7813,
  capHeight: 0.7129,
  descender: 0.2393,
  family: FONTS.family,
};

export function handwritingRow(xHeightMm, m = TRACE_METRICS, padMm = 1.5) {
  const fontSizeMm = xHeightMm / m.xHeight;
  const asc = fontSizeMm * m.ascender;
  const desc = fontSizeMm * m.descender;
  const baselineY = padMm + asc;
  return {
    fontSizeMm,
    heightMm: padMm + asc + desc + padMm,
    ascenderY: baselineY - asc,
    xHeightY: baselineY - xHeightMm,
    baselineY,
    descenderY: baselineY + desc,
  };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * One SVG handwriting row. opts:
 *   text        grey trace glyphs ('' => blank ruled row)
 *   model       leading black model portion (shares the <text> with the trace)
 *   modelWeight 700 for trace models, 400 for plain black words
 *   segments    [{text, fill, fontWeight}] — per-run tspans (missing-grapheme
 *               cards use fill:'transparent' so the gap reserves true width)
 *   xHeightMm, widthMm, color, startXMm, align ('start'|'middle'),
 *   midlineColor, ascenderDashed, showAscender, showDescender, letterSpacingMm
 */
export function traceLineSVG(opts = {}) {
  const {
    text = '',
    model,
    modelWeight = 700,
    segments,
    xHeightMm = 9,
    widthMm = CONTENT_W,
    color = INK.trace,
    startXMm = 4,
    align = 'start',
    midlineColor,
    ascenderDashed = false,
    showAscender = true,
    showDescender = true,
    letterSpacingMm = 0,
  } = opts;

  const g = handwritingRow(xHeightMm);
  const anchorX = align === 'middle' ? widthMm / 2 : startXMm;
  const line = (y, stroke, w, dash) =>
    `<line x1="0" x2="${widthMm}" y1="${y}" y2="${y}" stroke="${stroke}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;

  const lines = [
    showAscender ? line(g.ascenderY, INK.guideFaint, 0.3, ascenderDashed ? '1.6 1.4' : undefined) : '',
    line(g.xHeightY, midlineColor ?? INK.faint, 0.3, '1.6 1.4'),
    line(g.baselineY, INK.ruleStrong, 0.45),
    showDescender ? line(g.descenderY, INK.guideFaint, 0.3, '1.6 1.4') : '',
  ].join('');

  let glyphs = '';
  if (text || model || (segments && segments.length)) {
    const runs = segments && segments.length
      ? segments.map((s) => `<tspan fill="${s.fill ?? color}"${s.fontWeight ? ` font-weight="${s.fontWeight}"` : ''}>${esc(s.text)}</tspan>`).join('')
      : [
          model ? `<tspan fill="${INK.text}" font-weight="${modelWeight}">${esc(model)}</tspan>` : '',
          text ? `<tspan fill="${color}">${esc(model ? ` ${text}` : text)}</tspan>` : '',
        ].join('');
    glyphs = `<text x="${anchorX}" y="${g.baselineY}"${align === 'middle' ? ' text-anchor="middle"' : ''} font-family="${TRACE_METRICS.family.replace(/'/g, '&#39;')}" font-size="${g.fontSizeMm}"${letterSpacingMm ? ` letter-spacing="${letterSpacingMm}"` : ''} xml:space="preserve">${runs}</text>`;
  }

  return `<svg width="100%" height="${g.heightMm}mm" viewBox="0 0 ${widthMm} ${g.heightMm}" preserveAspectRatio="none" style="display:block">${lines}${glyphs}</svg>`;
}

/** A plain single answer line (WriteLine) — for writing answers, not handwriting practice. */
export function writeLineSVG({ widthMm = CONTENT_W, heightMm = 9 } = {}) {
  const y = heightMm - 1.5;
  return `<svg width="100%" height="${heightMm}mm" viewBox="0 0 ${widthMm} ${heightMm}" preserveAspectRatio="none" style="display:block"><line x1="0" x2="${widthMm}" y1="${y}" y2="${y}" stroke="${INK.ruleStrong}" stroke-width="0.4"/></svg>`;
}
