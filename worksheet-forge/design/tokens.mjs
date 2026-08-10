// ---------------------------------------------------------------------------
// worksheet-forge design tokens.
// Colours are the ledger level themes — mirrored from
// worksheet-engine/src/design/levelThemes.ts (single source of truth there).
// Never default to pink: getLevelTheme throws on an unknown level.
// ---------------------------------------------------------------------------
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const FORGE_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const REPO_ROOT = path.dirname(FORGE_ROOT);
export const ENGINE_PUBLIC = path.join(REPO_ROOT, 'worksheet-engine', 'public');

export const LEVEL_THEMES = {
  1: { level: 1, name: 'Ditties',          primary: '#E84B8A', light: '#FDEAF2', border: '#F6B8D2', accentText: '#C2185B' },
  2: { level: 2, name: 'First Sounds',     primary: '#F97066', light: '#FFEDEB', border: '#FBB6B0', accentText: '#C2410C' },
  3: { level: 3, name: 'Special Friends',  primary: '#F59E0B', light: '#FFF6E5', border: '#FAD79A', accentText: '#B45309' },
  4: { level: 4, name: 'Longer Sounds',    primary: '#22C55E', light: '#E7F9EE', border: '#9DE7BA', accentText: '#15803D' },
  5: { level: 5, name: 'New Spellings',    primary: '#3B82F6', light: '#E9F1FE', border: '#A8C7FB', accentText: '#1D4ED8' },
  6: { level: 6, name: 'Building Fluency', primary: '#6366F1', light: '#ECEDFE', border: '#B6B9FA', accentText: '#4338CA' },
  7: { level: 7, name: 'Reading Together', primary: '#8B5CF6', light: '#F1EBFE', border: '#C9B6FB', accentText: '#6D28D9' },
  8: { level: 8, name: 'Reading Champion', primary: '#14B8A6', light: '#E4FBF7', border: '#8EE6DB', accentText: '#0F766E' },
};

export function getLevelTheme(level) {
  const t = LEVEL_THEMES[level];
  if (!t) throw new Error(`No level theme for level ${level} — refusing to fall back to a default colour.`);
  return t;
}

export const INK = {
  text: '#1a1a1a',
  muted: '#5f5f5f',
  faint: '#8a8a8a',
  trace: '#b3b3b3',
  rule: '#d6d6d6',
  ruleStrong: '#9a9a9a',
  guideFaint: '#e0e0e0',
  footerBg: '#f2f2f2',
};

// A4 geometry in mm (matches the engine's SheetShell contract).
export const PAGE = { w: 210, h: 297, margin: 8 };
export const CONTENT_W = PAGE.w - PAGE.margin * 2; // 194

export const FONTS = {
  regular: path.join(ENGINE_PUBLIC, 'fonts', 'Andika-Regular.ttf'),
  bold: path.join(ENGINE_PUBLIC, 'fonts', 'Andika-Bold.ttf'),
  family: `'Andika','Trebuchet MS',sans-serif`,
};

export const fileUrl = (p) => 'file:///' + p.replace(/\\/g, '/').replace(/^\/+/, '');
