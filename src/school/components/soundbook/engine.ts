// Engine for the bespoke interactive Sound Book experience — theme system,
// audio helpers, and per-grapheme content. This is NOT the storybook reader; it
// drives a custom, animated, full-screen activity sequence.

export type ActivityKind =
  | 'meet' | 'pop' | 'blend' | 'hunt' | 'build' | 'finish';

export interface SoundBookContent {
  id: string;          // SoundBook id, e.g. "SD-L1.01"
  grapheme: string;    // focus sound, e.g. "s"
  level: number;
  title: string;       // "Sound Book: s"
  hint: string;        // articulation cue
  words: string[];     // featured words (have /images/words/<w>.png AND the sound)
  activities: ActivityKind[];
}

// ── Theme ────────────────────────────────────────────────────────────────────
export interface Theme {
  hex: string;
  name: string;
  bg: string;          // page background (tailwind gradient classes)
  accentText: string;
  accentBg: string;    // literal bg-{color} matching accentText (Tailwind-safe)
  bubble: string;      // gradient for the hero/letter bubble
  soft: string;        // soft tinted surface
  ring: string;
}

// All class fragments are LITERALS so Tailwind's JIT scanner generates them.
const PALETTE: Record<number, { hex: string; name: string; from: string; to: string; accentText: string; accentBg: string; bubbleFrom: string; bubbleTo: string; soft: string; ring: string }> = {
  1: { hex: '#E84B8A', name: 'Ditties', from: 'from-pink-50', to: 'to-rose-100', accentText: 'text-pink-600', accentBg: 'bg-pink-600', bubbleFrom: 'from-pink-400', bubbleTo: 'to-rose-500', soft: 'bg-pink-50', ring: 'ring-pink-300' },
  2: { hex: '#F97066', name: 'First Sounds', from: 'from-orange-50', to: 'to-red-100', accentText: 'text-orange-600', accentBg: 'bg-orange-600', bubbleFrom: 'from-orange-400', bubbleTo: 'to-red-500', soft: 'bg-orange-50', ring: 'ring-orange-300' },
  3: { hex: '#F59E0B', name: 'Special Friends', from: 'from-amber-50', to: 'to-yellow-100', accentText: 'text-amber-600', accentBg: 'bg-amber-600', bubbleFrom: 'from-amber-400', bubbleTo: 'to-yellow-500', soft: 'bg-amber-50', ring: 'ring-amber-300' },
  4: { hex: '#22C55E', name: 'Longer Sounds', from: 'from-green-50', to: 'to-emerald-100', accentText: 'text-green-600', accentBg: 'bg-green-600', bubbleFrom: 'from-green-400', bubbleTo: 'to-emerald-500', soft: 'bg-green-50', ring: 'ring-green-300' },
  5: { hex: '#3B82F6', name: 'New Spellings', from: 'from-blue-50', to: 'to-sky-100', accentText: 'text-blue-600', accentBg: 'bg-blue-600', bubbleFrom: 'from-blue-400', bubbleTo: 'to-sky-500', soft: 'bg-blue-50', ring: 'ring-blue-300' },
  6: { hex: '#6366F1', name: 'Building Fluency', from: 'from-indigo-50', to: 'to-violet-100', accentText: 'text-indigo-600', accentBg: 'bg-indigo-600', bubbleFrom: 'from-indigo-400', bubbleTo: 'to-violet-500', soft: 'bg-indigo-50', ring: 'ring-indigo-300' },
  7: { hex: '#8B5CF6', name: 'Reading Together', from: 'from-violet-50', to: 'to-purple-100', accentText: 'text-violet-600', accentBg: 'bg-violet-600', bubbleFrom: 'from-violet-400', bubbleTo: 'to-purple-500', soft: 'bg-violet-50', ring: 'ring-violet-300' },
  8: { hex: '#14B8A6', name: 'Reading Champion', from: 'from-teal-50', to: 'to-cyan-100', accentText: 'text-teal-600', accentBg: 'bg-teal-600', bubbleFrom: 'from-teal-400', bubbleTo: 'to-cyan-500', soft: 'bg-teal-50', ring: 'ring-teal-300' },
};

export function theme(level: number): Theme {
  const p = PALETTE[level] ?? PALETTE[1];
  return {
    hex: p.hex,
    name: p.name,
    bg: `bg-gradient-to-br ${p.from} ${p.to}`,
    accentText: p.accentText,
    accentBg: p.accentBg,
    bubble: `bg-gradient-to-br ${p.bubbleFrom} ${p.bubbleTo}`,
    soft: p.soft,
    ring: p.ring,
  };
}

// ── Audio (silent on miss) ───────────────────────────────────────────────────
const norm = (s: string) => s.toLowerCase().replace(/-/g, '_');
const wordKey = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

function play(url: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const a = new Audio(url);
      a.onended = () => resolve();
      a.onerror = () => resolve();
      a.play().catch(() => resolve());
      // safety timeout so sequences never hang on a missing file
      setTimeout(resolve, 1600);
    } catch { resolve(); }
  });
}

export const playPhoneme = (g: string) => play(`/sounds/${norm(g)}.mp3`);
export const playWord = (w: string) => play(`/sounds/words/${wordKey(w)}.mp3`);

export async function soundOutThenBlend(word: string): Promise<void> {
  for (const g of word.split('')) {
    await playPhoneme(g);
    await new Promise((r) => setTimeout(r, 120));
  }
  await new Promise((r) => setTimeout(r, 160));
  await playWord(word);
}

export const imgFor = (w: string) => `/images/words/${wordKey(w)}.png`;

// ── Content (L1) ─────────────────────────────────────────────────────────────
const DEFAULT_ACTS: ActivityKind[] = ['meet', 'pop', 'blend', 'hunt', 'build', 'finish'];

export const SOUND_BOOK_CONTENT: Record<string, SoundBookContent> = {
  'SD-L1.01': { id: 'SD-L1.01', grapheme: 's', level: 1, title: 'Sound Book: s', hint: 'Hiss like a snake — ssss', words: ['sun', 'sock', 'six', 'sad'], activities: DEFAULT_ACTS },
  'SD-L1.02': { id: 'SD-L1.02', grapheme: 'a', level: 1, title: 'Sound Book: a', hint: 'Open wide — a-a-a', words: ['cat', 'hat', 'map', 'van'], activities: DEFAULT_ACTS },
  'SD-L1.03': { id: 'SD-L1.03', grapheme: 't', level: 1, title: 'Sound Book: t', hint: 'Tongue tap — t-t-t', words: ['tap', 'tin', 'ten', 'tub'], activities: DEFAULT_ACTS },
  'SD-L1.04': { id: 'SD-L1.04', grapheme: 'p', level: 1, title: 'Sound Book: p', hint: 'Pop your lips — p-p-p', words: ['pig', 'pan', 'pin', 'peg'], activities: DEFAULT_ACTS },
  'SD-L1.05': { id: 'SD-L1.05', grapheme: 'i', level: 1, title: 'Sound Book: i', hint: 'Short and quick — i-i-i', words: ['fin', 'bin', 'dig', 'zip'], activities: DEFAULT_ACTS },
  'SD-L1.06': { id: 'SD-L1.06', grapheme: 'n', level: 1, title: 'Sound Book: n', hint: 'Hum it — nnnn', words: ['net', 'nap', 'nut', 'nod'], activities: DEFAULT_ACTS },
  'SD-L1.07': { id: 'SD-L1.07', grapheme: 'm', level: 1, title: 'Sound Book: m', hint: 'Lips together — mmmm', words: ['mat', 'mop', 'mug', 'mud'], activities: DEFAULT_ACTS },
  'SD-L1.08': { id: 'SD-L1.08', grapheme: 'd', level: 1, title: 'Sound Book: d', hint: 'Tongue tap, voiced — d-d-d', words: ['dog', 'dip', 'den', 'dam'], activities: DEFAULT_ACTS },
  'SD-L1.09': { id: 'SD-L1.09', grapheme: 'g', level: 1, title: 'Sound Book: g', hint: 'Back of the throat — g-g-g', words: ['gas', 'gap', 'gum', 'gig'], activities: DEFAULT_ACTS },
  'SD-L1.10': { id: 'SD-L1.10', grapheme: 'o', level: 1, title: 'Sound Book: o', hint: 'Round mouth — o-o-o', words: ['hot', 'log', 'cot', 'mop'], activities: DEFAULT_ACTS },
};

export const SOUND_BOOK_CONTENT_IDS: ReadonlySet<string> = new Set(Object.keys(SOUND_BOOK_CONTENT));

// All L1 words with web images — used as the distractor pool for Sound Hunt.
export const WORD_POOL: string[] = Array.from(
  new Set(Object.values(SOUND_BOOK_CONTENT).flatMap((c) => c.words)),
);

export function distractorsWithout(grapheme: string, exclude: string[], n: number): string[] {
  const out: string[] = [];
  for (const w of WORD_POOL) {
    if (out.length >= n) break;
    if (w.includes(grapheme)) continue;
    if (exclude.includes(w)) continue;
    out.push(w);
  }
  return out;
}
