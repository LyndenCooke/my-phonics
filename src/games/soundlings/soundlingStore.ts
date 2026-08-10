/**
 * Soundlings persistence — localStorage now, Supabase later.
 *
 * Follows the stamps.ts pattern (mpb_stamps_v1): a single versioned key,
 * defensive reads, silent writes. Everything the game knows about a child's
 * collection lives here so the phase-2 Supabase sync is a swap of this
 * module, not a rewrite of the game.
 *
 * Feed model: a first-try correct encounter feeds 1, a solved-after-retry
 * encounter feeds 0.5 (the child still wins, just slower growth). Stages:
 * egg → hatched (3 feeds) → grown (10) → golden (25). The daily glowing
 * egg hatches early, at 2 feeds.
 */

export const HATCH_FEEDS = 3;
export const GLOW_HATCH_FEEDS = 2;
export const GROWN_FEEDS = 10;
export const GOLDEN_FEEDS = 25;
/** Days without feeding before a hatched Soundling naps. */
const SLEEPY_DAYS = 3;

const STORAGE_KEY = 'mpb_soundlings_v1';

export type Stage = 'egg' | 'hatched' | 'grown' | 'golden';

export interface SoundlingState {
  feeds: number;
  lastFedDate: string; // YYYY-MM-DD local
  hatchedDate: string; // '' until hatched
}

type Store = Record<string, SoundlingState>;

const EMPTY: SoundlingState = { feeds: 0, lastFedDate: '', hatchedDate: '' };

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function readStore(): Store {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch { /* quota — ignore */ }
}

export function getSoundling(grapheme: string): SoundlingState {
  return { ...EMPTY, ...readStore()[grapheme] };
}

export function getAllSoundlings(): Record<string, SoundlingState> {
  const store = readStore();
  const out: Record<string, SoundlingState> = {};
  for (const [k, v] of Object.entries(store)) out[k] = { ...EMPTY, ...v };
  return out;
}

export function stageOf(state: SoundlingState, glowing = false): Stage {
  if (state.feeds >= GOLDEN_FEEDS) return 'golden';
  if (state.feeds >= GROWN_FEEDS) return 'grown';
  if (state.hatchedDate || state.feeds >= (glowing ? GLOW_HATCH_FEEDS : HATCH_FEEDS)) return 'hatched';
  return 'egg';
}

/** A hatched Soundling naps after a few days without a feed — "wake me
 *  up!", never sad or sick. Eggs don't sleep. */
export function isAsleep(state: SoundlingState): boolean {
  if (!state.hatchedDate || !state.lastFedDate) return false;
  const last = new Date(`${state.lastFedDate}T00:00:00`);
  return (Date.now() - last.getTime()) / 86_400_000 >= SLEEPY_DAYS;
}

export interface FeedResult {
  state: SoundlingState;
  before: Stage;
  after: Stage;
}

/** Feed a Soundling. firstTry feeds 1, otherwise 0.5. Returns the stage
 *  before and after so the game can celebrate hatch/grow/golden moments. */
export function feedSoundling(grapheme: string, firstTry: boolean, glowing = false): FeedResult {
  const store = readStore();
  const current = { ...EMPTY, ...store[grapheme] };
  const before = stageOf(current, glowing);

  const next: SoundlingState = {
    feeds: current.feeds + (firstTry ? 1 : 0.5),
    lastFedDate: todayIso(),
    hatchedDate: current.hatchedDate,
  };
  const after = stageOf(next, glowing);
  if (after !== 'egg' && !next.hatchedDate) next.hatchedDate = todayIso();

  store[grapheme] = next;
  writeStore(store);
  return { state: next, before, after };
}

/** Deterministic "glowing egg of the day" — one unhatched grapheme from
 *  the level glows and hatches a feed early. Seeded by date so it changes
 *  daily but never mid-session. */
export function glowingEggOfDay(levelGpcs: string[]): string | null {
  const store = readStore();
  const unhatched = levelGpcs.filter(g => stageOf({ ...EMPTY, ...store[g] }) === 'egg');
  if (unhatched.length === 0) return null;
  const seedStr = todayIso();
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  return unhatched[seed % unhatched.length];
}

/** Count of hatched (or better) Soundlings across the whole collection —
 *  gates Feeding Frenzy at 3. */
export function hatchedCount(): number {
  return Object.values(getAllSoundlings()).filter(s => s.hatchedDate !== '').length;
}

/** Dev helper — wipe the collection (not surfaced to children). */
export function resetSoundlings(): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
