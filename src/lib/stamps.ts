/**
 * Stamps — day-cooldown reading repetition tracker
 *
 * Pedagogy: kids need to read the same decodable book multiple times to build
 * fluency (typical school practice is 5 reads). We reward each unique day's
 * reading with a stamp. Same-day re-reads do NOT award another stamp — the
 * child has to come back tomorrow. After 5 stamps, the full "Reading
 * Champion" certificate unlocks.
 *
 * Currently localStorage-only; supabase sync is future work.
 */

export const MAX_STAMPS = 5;
const STORAGE_KEY = 'mpb_stamps_v1';

export interface BookStamps {
  count: number;            // 0–5
  lastReadDate: string;     // YYYY-MM-DD (local time)
  readDates: string[];      // log of unique read dates
}

type StampStore = Record<string, BookStamps>;

const EMPTY: BookStamps = { count: 0, lastReadDate: '', readDates: [] };

/** Local date as YYYY-MM-DD — uses local timezone so "tomorrow" means the
 *  child's local tomorrow, not UTC's. */
export function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function readStore(): StampStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StampStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: StampStore): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch { /* quota/private mode — ignore */ }
}

export function getStamps(bookId: string): BookStamps {
  const store = readStore();
  return store[bookId] ?? EMPTY;
}

/** Award a stamp for today's reading if not already earned today.
 *  Returns the new state and whether a stamp was actually awarded on this
 *  call (so the UI can decide whether to celebrate or gently remind). */
export function awardStamp(bookId: string): { state: BookStamps; awardedNow: boolean } {
  const store = readStore();
  const current = store[bookId] ?? EMPTY;
  const today = todayIso();

  if (current.lastReadDate === today) {
    return { state: current, awardedNow: false };
  }

  const newCount = Math.min(MAX_STAMPS, current.count + 1);
  const newDates = current.readDates.includes(today)
    ? current.readDates
    : [...current.readDates, today];
  const next: BookStamps = { count: newCount, lastReadDate: today, readDates: newDates };
  store[bookId] = next;
  writeStore(store);
  return { state: next, awardedNow: true };
}

/** Dev helper — reset stamps for a specific book (used by UI "start over"). */
export function resetStamps(bookId: string): void {
  const store = readStore();
  delete store[bookId];
  writeStore(store);
}
