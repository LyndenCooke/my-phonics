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
  /** Readiness-check results keyed by the stamp number they were taken
   *  with. Only stamps 3, 4, 5 have a check-in; 1 and 2 are warm-up. */
  checkInResults: Record<number, boolean>;
}

type StampStore = Record<string, BookStamps>;

const EMPTY: BookStamps = { count: 0, lastReadDate: '', readDates: [], checkInResults: {} };

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
  const raw = store[bookId];
  if (!raw) return EMPTY;
  // Migrate older records that pre-date checkInResults
  return { ...EMPTY, ...raw, checkInResults: raw.checkInResults ?? {} };
}

/** Returns true if the next stamp this child would earn should gate on a
 *  readiness check-in. Stamps 3, 4, 5 gate; 1 and 2 are free warm-ups. */
export function needsCheckIn(bookId: string): boolean {
  const current = getStamps(bookId);
  if (current.lastReadDate === todayIso()) return false; // already earned today, no gate
  const nextStamp = Math.min(MAX_STAMPS, current.count + 1);
  return nextStamp >= 3;
}

/** Award a stamp for today's reading if not already earned today.
 *  Optionally records whether the readiness check-in was passed (for
 *  stamps 3+; ignored for 1 and 2). Returns the new state and whether a
 *  stamp was actually awarded on this call. */
export function awardStamp(
  bookId: string,
  opts?: { checkInPassed?: boolean }
): { state: BookStamps; awardedNow: boolean } {
  const store = readStore();
  const current = store[bookId] ?? EMPTY;
  const today = todayIso();

  if (current.lastReadDate === today) {
    return { state: { ...EMPTY, ...current, checkInResults: current.checkInResults ?? {} }, awardedNow: false };
  }

  const newCount = Math.min(MAX_STAMPS, current.count + 1);
  const newDates = current.readDates.includes(today)
    ? current.readDates
    : [...current.readDates, today];
  const checkInResults = { ...(current.checkInResults ?? {}) };
  if (opts?.checkInPassed !== undefined && newCount >= 3) {
    checkInResults[newCount] = opts.checkInPassed;
  }
  const next: BookStamps = { count: newCount, lastReadDate: today, readDates: newDates, checkInResults };
  store[bookId] = next;
  writeStore(store);
  return { state: next, awardedNow: true };
}

/** True when all three gated check-ins (stamps 3, 4, 5) were passed. Used
 *  to unlock the "Ready to Move Up!" badge on the champion certificate. */
export function isReadyToMoveUp(stamps: BookStamps): boolean {
  if (stamps.count < MAX_STAMPS) return false;
  return stamps.checkInResults[3] === true
      && stamps.checkInResults[4] === true
      && stamps.checkInResults[5] === true;
}

/** Dev helper — reset stamps for a specific book (used by UI "start over"). */
export function resetStamps(bookId: string): void {
  const store = readStore();
  delete store[bookId];
  writeStore(store);
}
