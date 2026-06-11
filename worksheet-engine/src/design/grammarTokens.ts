// ---------------------------------------------------------------------------
// GRAMMAR TYPE TOKENS — the one locked type scale for every grammar page.
//
// Four roles only on a worksheet page (title / instruction / body / footer),
// plus two front-matter display sizes used ONLY on the cover and certificate.
// These are the ONLY font sizes allowed anywhere in a grammar booklet, and there
// is no bold (emphasis is the accent colour and size). Every grammar component
// reads its size through `gSize`/`gType` so the scale is set once, on the page
// root, as CSS custom properties (see GRAMMAR_LAYOUT_VARS).
//
// A build guard (scripts/check-grammar-fonts.mjs, `npm run check:fonts`) fails
// if any grammar node hard-codes a font size outside this set.
// ---------------------------------------------------------------------------

/** The role → size map (points). Recorded for the guard and docs. */
export const GRAMMAR_TYPE = {
  title: '27pt',
  instruction: '16pt',
  body: '18pt',
  footer: '9pt',
  display: '44pt', // cover and certificate only
} as const;

export type GrammarRole = keyof typeof GRAMMAR_TYPE;

/** The custom properties set ONCE on the page root and used everywhere. */
export const GRAMMAR_LAYOUT_VARS: Record<string, string> = {
  '--type-title': GRAMMAR_TYPE.title,
  '--type-instruction': GRAMMAR_TYPE.instruction,
  '--type-body': GRAMMAR_TYPE.body,
  '--type-footer': GRAMMAR_TYPE.footer,
  '--type-display': GRAMMAR_TYPE.display,
  '--write-line-gap': '9mm', // the rewrite-sheet target; one number, used everywhere
  '--cloze-gap-width': '26mm',
  '--cloze-gap-pad': '3mm',
};

const ROLE_VAR: Record<GrammarRole, string> = {
  title: 'var(--type-title)',
  instruction: 'var(--type-instruction)',
  body: 'var(--type-body)',
  footer: 'var(--type-footer)',
  display: 'var(--type-display)',
};

/** The set of font-size string literals the guard accepts. */
export const ALLOWED_FONT_SIZES: readonly string[] = Object.values(ROLE_VAR);

/** The font-size value (a CSS var) for a role. Use this everywhere; never write
 *  a raw pt size into a grammar node. */
export function gSize(role: GrammarRole): string {
  return ROLE_VAR[role];
}

/** Convenience style object: `{ fontSize: var(--type-<role>) }`. Spread it. */
export function gType(role: GrammarRole): { fontSize: string } {
  return { fontSize: ROLE_VAR[role] };
}

/** Writing-line / cloze layout tokens, as CSS var references. */
export const WRITE_LINE_GAP = 'var(--write-line-gap)';
export const CLOZE_GAP_WIDTH = 'var(--cloze-gap-width)';
export const CLOZE_GAP_PAD = 'var(--cloze-gap-pad)';
