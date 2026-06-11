// ---------------------------------------------------------------------------
// LEVEL THEMES — single source of truth for worksheet branding.
//
// Colours come from the v2.0 Curriculum Ledger (output/worksheet_plan/
// CURRICULUM_LEDGER.md). Every printed artefact at a level MUST use that
// level's colour. There is NO pink default — getLevelTheme() throws if a level
// has no theme, so a mis-keyed book fails loudly instead of silently shipping
// L1 pink on an L5 sheet.
// ---------------------------------------------------------------------------

export interface LevelTheme {
  /** 1–8 */
  level: number;
  /** Ledger level name */
  name: string;
  /** Banner / cover bar, badge, activity numbers, section borders */
  primary: string;
  /** Soft tinted background for instruction boxes / sort bins */
  light: string;
  /** Hairline borders, row dividers */
  border: string;
  /** Darker shade for accented text labels */
  accentText: string;
  /** Badge circle fill (usually == primary) */
  badge: string;
}

// Keyed by level number. Hex values are the ledger colours — do not edit
// without updating the ledger.
export const LEVEL_THEMES: Record<number, LevelTheme> = {
  1: { level: 1, name: 'Ditties',          primary: '#E84B8A', light: '#FDEAF2', border: '#F6B8D2', accentText: '#C2185B', badge: '#E84B8A' },
  2: { level: 2, name: 'First Sounds',     primary: '#F97066', light: '#FFEDEB', border: '#FBB6B0', accentText: '#C2410C', badge: '#F97066' },
  3: { level: 3, name: 'Special Friends',  primary: '#F59E0B', light: '#FFF6E5', border: '#FAD79A', accentText: '#B45309', badge: '#F59E0B' },
  4: { level: 4, name: 'Longer Sounds',    primary: '#22C55E', light: '#E7F9EE', border: '#9DE7BA', accentText: '#15803D', badge: '#22C55E' },
  5: { level: 5, name: 'New Spellings',    primary: '#3B82F6', light: '#E9F1FE', border: '#A8C7FB', accentText: '#1D4ED8', badge: '#3B82F6' },
  6: { level: 6, name: 'Building Fluency', primary: '#6366F1', light: '#ECEDFE', border: '#B6B9FA', accentText: '#4338CA', badge: '#6366F1' },
  7: { level: 7, name: 'Reading Together', primary: '#8B5CF6', light: '#F1EBFE', border: '#C9B6FB', accentText: '#6D28D9', badge: '#8B5CF6' },
  8: { level: 8, name: 'Reading Champion', primary: '#14B8A6', light: '#E4FBF7', border: '#8EE6DB', accentText: '#0F766E', badge: '#14B8A6' },
};

/**
 * Returns the theme for a level. Throws on an unknown level — never falls back
 * to a default colour. This is the guard the curriculum ledger requires.
 */
export function getLevelTheme(level: number): LevelTheme {
  const theme = LEVEL_THEMES[level];
  if (!theme) {
    throw new Error(
      `No level theme for level ${level}. Valid levels: ${Object.keys(LEVEL_THEMES).join(', ')}. ` +
      `Worksheets must use a ledger colour — refusing to fall back to a default.`,
    );
  }
  return theme;
}
