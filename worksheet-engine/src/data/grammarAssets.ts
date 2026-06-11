// ---------------------------------------------------------------------------
// GRAMMAR ASSET MANIFEST — one line-art style, dot eyes, from the book world.
//
// Every workbook-interior asset is ONE black line-art treatment with a trimmed
// transparent background and small solid pure-black dot eyes on every creature
// (the eye culture — the single most enforced rule in the book pipeline). The
// art is derived from the shipped L6 books via the generation pipeline in
// scripts/generate_l6_assets.py (book-faithful colour pass, then line-art
// conversion anchored on an approved line-art asset). The one exception is
// `cover_scene`: a full-colour scene lifted straight off a shipped book page —
// covers are the hooks. Approved on the L6 contact sheet, 2026-06-10.
//
// `status`:
//   ok        — approved art in the chosen style is in place
//   redraw    — a file exists but breaks the style (recolour / fix the eyes)
//   missing   — no art yet; supply approved line-art before this slot fills
//
// The renderer (Clipart) draws a key ONLY when its manifest status is `ok` AND
// its file exists. A slot whose art is `redraw`/`missing` stays EMPTY (and
// `npm run validate` reports it) — never a clip-art substitute, never an
// off-style one-off among the line art.
// ---------------------------------------------------------------------------

export type AssetStatus = 'ok' | 'redraw' | 'missing';

export interface AssetEntry {
  key: string;
  /** file under /public/clipart (when present). */
  file?: string;
  status: AssetStatus;
  note?: string;
}

export const GRAMMAR_ASSETS: Record<string, AssetEntry> = {
  // characters (line art, dot eyes)
  owl: { key: 'owl', file: 'owl.png', status: 'ok', note: 'the Brown Owl tawny, from owl_ref_icon.png' },
  owlets: { key: 'owlets', file: 'owlets.png', status: 'ok' },
  cat: { key: 'cat', file: 'cat.png', status: 'ok', note: 'the New Glue ginger tabby, redrawn as line art' },
  monkey: { key: 'monkey', file: 'monkey.png', status: 'ok' },
  bird: { key: 'bird', file: 'bird.png', status: 'ok', note: 'the bird from the New Glue card drawing' },
  // the four book heroes, standing + action (line art, dot eyes)
  hero_purse_standing: { key: 'hero_purse_standing', file: 'hero_purse_standing.png', status: 'ok' },
  hero_purse_action: { key: 'hero_purse_action', file: 'hero_purse_action.png', status: 'ok' },
  hero_owl_standing: { key: 'hero_owl_standing', file: 'hero_owl_standing.png', status: 'ok' },
  hero_owl_action: { key: 'hero_owl_action', file: 'hero_owl_action.png', status: 'ok' },
  hero_glue_standing: { key: 'hero_glue_standing', file: 'hero_glue_standing.png', status: 'ok' },
  hero_glue_action: { key: 'hero_glue_action', file: 'hero_glue_action.png', status: 'ok' },
  hero_monkey_standing: { key: 'hero_monkey_standing', file: 'hero_monkey_standing.png', status: 'ok', note: 'eyes behind glasses slightly larger than dots — flagged at approval' },
  hero_monkey_action: { key: 'hero_monkey_action', file: 'hero_monkey_action.png', status: 'ok', note: 'eyes behind glasses slightly larger than dots — flagged at approval' },
  // objects (line art)
  branch: { key: 'branch', file: 'branch.png', status: 'ok' },
  tree: { key: 'tree', file: 'tree.png', status: 'ok' },
  leaf: { key: 'leaf', file: 'leaf.png', status: 'ok' },
  moon: { key: 'moon', file: 'moon.png', status: 'ok' },
  purse: { key: 'purse', file: 'purse.png', status: 'ok' },
  glue: { key: 'glue', file: 'glue.png', status: 'ok' },
  cup: { key: 'cup', file: 'cup.png', status: 'ok' },
  card: { key: 'card', file: 'card.png', status: 'ok' },
  // composed scenes (line art, one drawn moment each; the rug lives inside the
  // cup scene — there is deliberately no separate rug slot)
  scene_owl_branch: { key: 'scene_owl_branch', file: 'scene_owl_branch.png', status: 'ok', note: 'the owl on the bare branch (The Brown Owl)' },
  scene_cup_rug_glue: { key: 'scene_cup_rug_glue', file: 'scene_cup_rug_glue.png', status: 'ok', note: 'tipped cup, tea run on the rug, glue beside (The New Glue)' },
  scene_owl_owlets_moon: { key: 'scene_owl_owlets_moon', file: 'scene_owl_owlets_moon.png', status: 'ok', note: 'the owl and two owlets on the branch under the moon (The Brown Owl)' },
  scene_review: { key: 'scene_review', file: 'scene_review.png', status: 'ok', note: 'the monkey on the wall with the stolen snack (The Cheeky Monkey)' },
  // the cover panel — the ONE full-colour asset (covers are the hooks)
  cover_scene: { key: 'cover_scene', file: 'cover_scene.png', status: 'ok', note: 'curated straight from The Brown Owl page 6 — never regenerate as a group scene' },
};

/** Asset keys for L6, in book-world order. */
export const L6_ASSET_KEYS = [
  'owl', 'owlets', 'branch', 'leaf', 'moon', 'purse', 'glue', 'cup', 'cat', 'card', 'bird', 'monkey',
  'scene_owl_branch', 'scene_cup_rug_glue', 'scene_owl_owlets_moon', 'scene_review', 'cover_scene',
  'hero_purse_standing', 'hero_purse_action', 'hero_owl_standing', 'hero_owl_action',
  'hero_glue_standing', 'hero_glue_action', 'hero_monkey_standing', 'hero_monkey_action',
] as const;

/** The keys still needing approved art (redraw or missing) — surfaced by the
 *  validate step so the gap is never silently shipped. */
export function assetsNeedingArt(): AssetEntry[] {
  return Object.values(GRAMMAR_ASSETS).filter((a) => a.status !== 'ok');
}
