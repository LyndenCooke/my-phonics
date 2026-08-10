/**
 * Soundling names — one per grapheme across the 8-level journey (82 total).
 *
 * Naming rule: every name CONTAINS its grapheme and aims to be decodable
 * at or below the level that teaches it, so the name itself is reading
 * practice. DRAFT v1 — pending pedagogy review; a handful of L6–L8 names
 * trade strict decodability for charm and are marked with (!).
 *
 * Keys match JOURNEY_LEVELS[n].gpcs strings exactly (including "-ous").
 */

export const SOUNDLING_NAMES: Record<string, string> = {
  // Level 1 — Ditties
  s: 'Sam', a: 'Ant', t: 'Tip', p: 'Pip', i: 'Itt', n: 'Nan',
  m: 'Mim', d: 'Dot', g: 'Gig', o: 'Pop',
  // Level 2 — First Sounds
  c: 'Cub', k: 'Kit', ck: 'Sock', e: 'Egg', u: 'Pup', r: 'Rex',
  h: 'Hen', b: 'Bob', f: 'Fin', ff: 'Puff', l: 'Lil', ll: 'Bell',
  ss: 'Hiss', j: 'Jet', v: 'Vet', w: 'Wig', x: 'Fox', y: 'Yak', z: 'Zig',
  // Level 3 — Special Friends
  sh: 'Shell', nk: 'Wink', ch: 'Chip', th: 'Moth', ng: 'Ping',
  qu: 'Quin', zz: 'Buzz',
  // Level 4 — Longer Sounds
  ay: 'Jay', ee: 'Bee', igh: 'Night', ow: 'Snow', oo: 'Moon',
  ar: 'Star', or: 'Corn', air: 'Chair', ir: 'Bird', ou: 'Cloud', oy: 'Joy',
  // Level 5 — New Spellings
  'a-e': 'Snake', 'i-e': 'Kite', 'o-e': 'Mole', 'u-e': 'Cube',
  ea: 'Pea', ie: 'Pie', oi: 'Coil', aw: 'Paw', ai: 'Snail', oa: 'Toad',
  // Level 6 — Building Fluency
  ur: 'Burr', er: 'Herb', are: 'Hare', ew: 'Newt', ue: 'Glue',
  wr: 'Wren', kn: 'Knot', ge: 'Sage', dge: 'Smidge', mb: 'Lamb',
  gn: 'Gnome', ph: 'Phin', wh: 'Whale',
  // Level 7 — Reading Together
  ire: 'Squire', ore: 'Snore', ear: 'Earl', oor: 'Moor',
  ure: 'Cure', tion: 'Potion',
  // Level 8 — Reading Champion (adjectives as hero names, on purpose)
  '-ous': 'Curious', '-cious': 'Precious', '-tious': 'Cautious',
  '-able': 'Huggable', '-ible': 'Incredible',
};

export function soundlingName(grapheme: string): string {
  return SOUNDLING_NAMES[grapheme] ?? grapheme.toUpperCase();
}
