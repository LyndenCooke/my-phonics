// ---------------------------------------------------------------------------
// HANDWRITING — the metric-driven guideline system.
//
// Why this exists: CSS line boxes add font-dependent leading above and below
// the glyphs, so positioning trace letters with CSS makes them float off the
// line by an unpredictable amount. SVG <text> instead places the alphabetic
// baseline EXACTLY at its `y` coordinate, regardless of the font's internal
// leading. So we render handwriting rows as SVG and compute the guideline
// positions from the font's REAL measured metrics.
//
// The metrics below are read from the actual glyph bounding boxes of each .ttf
// by scripts/measure-font.mjs (NOT from the OS/2 table, which on literacy
// fonts is padded for diacritics and overstates the visible ascender).
//
// To swap the trace font:
//   1) drop the .ttf in public/fonts and add an @font-face in globals.css
//   2) node scripts/measure-font.mjs public/fonts/<NewFont>.ttf
//   3) paste the printed ratios into the matching *_METRICS below
//   4) point FONT.trace (tokens.ts) at the new family
// No template changes required.
// ---------------------------------------------------------------------------

export interface FontMetrics {
  /** First family in the CSS stack these metrics were measured from. */
  family: string;
  /** Em ratios with font-size = 1em and baseline = 0. */
  xHeight: number; // top of x, o, a (the mid/x-height line)
  ascender: number; // top of tall lowercase h, b, d, k, l (the top line)
  capHeight: number; // top of capitals
  descender: number; // depth below baseline of p, q, g, y, j (positive value)
}

// Andika (SIL OFL) — literacy print face designed for beginning readers:
// upright, rounded, single-storey a/g, NO slant or entry strokes. Replaces the
// slanted EduQLDBeginner for the handwriting rows. Metrics measured from the
// real glyph bounding boxes (node scripts/measure-font.mjs Andika-Regular.ttf).
export const SCHOOL_PRINT_METRICS: FontMetrics = {
  family: "'Andika', 'Trebuchet MS', sans-serif",
  xHeight: 0.5078,
  ascender: 0.7813,
  capHeight: 0.7129,
  descender: 0.2393,
};

// Default trace metrics (alias) — point TraceLine at the current trace font.
export const TRACE_METRICS = SCHOOL_PRINT_METRICS;

// Playwrite GB J ("Playwrite England Joined", SIL OFL) — UK joined modern
// cursive for the L6+ joined model rows (first joins, no lead-ins). Metrics
// measured from the real glyph boxes (node scripts/measure-font.mjs
// public/fonts/PlaywriteGBJ-Regular.ttf). Pending Lynden's font-sample
// approval before any workbook handwriting page prints joined models.
export const JOINED_METRICS: FontMetrics = {
  family: "'SchoolJoined', 'Andika', 'Trebuchet MS', sans-serif",
  xHeight: 0.519,
  ascender: 0.89,
  capHeight: 0.89,
  descender: 0.394,
};

export interface RowGeometry {
  /** Font size in mm to use for the SVG <text>. */
  fontSizeMm: number;
  /** Total row height in mm (top pad + ascender..descender + bottom pad). */
  heightMm: number;
  /** Guideline Y positions in mm, measured from the top of the row. */
  ascenderY: number;
  xHeightY: number;
  baselineY: number;
  descenderY: number;
}

/**
 * Given the desired x-height in mm (the pedagogically meaningful size — large
 * for early levels), return the font-size and the four guideline Y positions so
 * that in this font:
 *   - x/o/a fill the baseline -> x-height band exactly,
 *   - tall lowercase (h, l, b, d) touch the top (ascender) line,
 *   - descenders (p, g, y) reach the bottom line,
 *   - every glyph sits ON the baseline (SVG guarantee).
 */
export function handwritingRow(
  xHeightMm: number,
  m: FontMetrics,
  padMm = 1.5,
): RowGeometry {
  const fontSizeMm = xHeightMm / m.xHeight;
  const ascMm = fontSizeMm * m.ascender;
  const descMm = fontSizeMm * m.descender;

  const ascenderY = padMm;
  const baselineY = padMm + ascMm;
  const xHeightY = baselineY - xHeightMm;
  const descenderY = baselineY + descMm;
  const heightMm = descenderY + padMm;

  return { fontSizeMm, heightMm, ascenderY, xHeightY, baselineY, descenderY };
}
