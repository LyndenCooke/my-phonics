// ---------------------------------------------------------------------------
// DESIGN TOKENS — the locked design system. Layout values are constants so the
// same data always produces the same page (deterministic). Change a token to
// re-style every worksheet at once.
//
// Design intent (2026-06): a PRINTED classroom worksheet, not a web page.
//   - colour is used sparingly: level badge, one thin header rule, activity
//     number circles, small accents. Everything else is black on white.
//   - borders are light grey hairlines; writing lines are grey.
//   - small corner radii; tight vertical rhythm.
// ---------------------------------------------------------------------------

export const PAGE = {
  // A4 portrait
  width: '210mm',
  height: '297mm',
  // Print-safe inset (kept clear of printer no-print margins)
  inset: '12mm',
  // Usable content width = 210 - 2*inset. Used to size SVG handwriting rows in
  // real mm (deterministic — no reliance on flex measuring at render time).
  contentWidthMm: 186,
} as const;

// Small radii only — printed worksheets are not rounded "cards".
export const RADIUS = {
  box: '1.5mm',
  card: '1mm',
  pill: '999px',
} as const;

export const SPACE = {
  xs: '2mm',
  sm: '3.5mm',
  md: '5mm',
  lg: '8mm',
  xl: '12mm',
} as const;

// Hairline rule weights (printed worksheets use thin lines, not chunky borders).
export const RULE = {
  hair: '0.3mm', // light grey cell borders / dividers
  base: '0.4mm', // handwriting baseline ("ground")
  header: '0.8mm', // the single coloured header rule
} as const;

export const FONT = {
  // Instructions, headings, labels: clean, readable, single-storey a/g.
  body: "'Andika', 'Trebuchet MS', sans-serif",
  // Handwriting face — Andika (SIL literacy print: upright, rounded,
  // single-storey a/g, no slant/entry strokes). Used inside the SVG handwriting
  // rows (rendered light grey to trace over) and for black model letters / word
  // cards. Guidelines come from its measured metrics in handwriting.ts.
  // NOTE: Andika is a TEMPORARY placeholder — the final brand handwriting font is
  // Sassoon (Primary/Infant). Swap = drop ttf, re-measure, repoint; no layout change.
  trace: "'Andika', 'Trebuchet MS', sans-serif",
  hand: "'Andika', 'Trebuchet MS', sans-serif",
} as const;

export const TYPE = {
  bannerTitle: '19pt',
  sectionTitle: '13pt',
  instruction: '11.5pt',
  hint: '9.5pt',
  footer: '8.5pt',
  chip: '9pt',
} as const;

// Greys used across the design system (never level-specific).
// trace = the light grey of dotted letters to be traced over.
export const INK = {
  text: '#1a1a1a',
  muted: '#5f5f5f',
  faint: '#8a8a8a',
  trace: '#b3b3b3', // dotted trace glyphs
  rule: '#d6d6d6', // light grey cell borders
  ruleStrong: '#9a9a9a', // baseline / stronger divider
  guideFaint: '#e0e0e0', // descender / ascender hint lines
} as const;
