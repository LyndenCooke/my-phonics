/**
 * useAppMode — parent vs child mode toggle.
 *
 * Parent mode: full app — library grid, shop, assess, admin etc.
 * Child mode (default after first unlock): simplified home built around a
 *             single "Continue reading" card + book carousel. Hides
 *             shop/assess/admin so the kid can't wander into purchase flows.
 *
 * State persists in localStorage so a parent's choice carries across
 * sessions on the same device. Switching FROM child mode back to parent
 * mode requires the parent PIN — set by the parent on first toggle. This
 * stops a curious kid from tapping the "Parent" pill and seeing the buy
 * flow. The PIN itself is stored hashed-only in localStorage (sha-256);
 * we don't sync to the cloud because a per-device PIN is fine for v1.
 */
import { useEffect, useState } from 'react';

export type AppMode = 'parent' | 'child';

const MODE_KEY = 'mpb_app_mode';
const PIN_HASH_KEY = 'mpb_parent_pin_hash';
const MODE_AUTO_KEY = 'mpb_app_mode_autoset_v1';

/** One-time auto-default to child mode when the user first has unlocked
 *  books. Skipped if the parent has manually toggled (we don't want to
 *  override their choice on subsequent sessions). Called from Index.tsx
 *  after the books query resolves. */
export function maybeAutoDefaultToChild(hasUnlockedBooks: boolean): void {
  if (typeof window === 'undefined') return;
  if (!hasUnlockedBooks) return;
  try {
    if (window.localStorage.getItem(MODE_AUTO_KEY)) return;     // already auto-set once
    if (window.localStorage.getItem(MODE_KEY)) return;          // parent has manually toggled
    window.localStorage.setItem(MODE_KEY, 'child');
    window.localStorage.setItem(MODE_AUTO_KEY, '1');
    listeners.forEach(l => l('child'));
  } catch { /* private mode — ignore */ }
}

function readMode(): AppMode {
  if (typeof window === 'undefined') return 'parent';
  try {
    const v = window.localStorage.getItem(MODE_KEY);
    return v === 'child' ? 'child' : 'parent';
  } catch {
    return 'parent';
  }
}

/** All hook callers stay in sync: any setMode anywhere updates them all. */
const listeners = new Set<(m: AppMode) => void>();

export function useAppMode(): { mode: AppMode; setMode: (m: AppMode) => void; toggle: () => void } {
  const [mode, setLocal] = useState<AppMode>(readMode);

  useEffect(() => {
    const fn = (m: AppMode) => setLocal(m);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  const setMode = (m: AppMode) => {
    try { window.localStorage.setItem(MODE_KEY, m); } catch { /* private mode — ignore */ }
    listeners.forEach(l => l(m));
  };

  const toggle = () => setMode(mode === 'parent' ? 'child' : 'parent');

  return { mode, setMode, toggle };
}

// ─── Parent PIN ─────────────────────────────────────────────────────────

async function sha256(text: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    // Fallback for SSR / older browsers — not cryptographically secure, but
    // PIN storage is best-effort anyway since localStorage isn't a secret.
    return text;
  }
  const buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Has a parent PIN been set yet? */
export function hasParentPin(): boolean {
  try { return !!window.localStorage.getItem(PIN_HASH_KEY); } catch { return false; }
}

/** Set / overwrite the parent PIN. */
export async function setParentPin(pin: string): Promise<void> {
  const hash = await sha256(pin);
  try { window.localStorage.setItem(PIN_HASH_KEY, hash); } catch { /* private mode */ }
}

/** Returns true if the supplied PIN matches the stored hash. */
export async function verifyParentPin(pin: string): Promise<boolean> {
  let stored = '';
  try { stored = window.localStorage.getItem(PIN_HASH_KEY) || ''; } catch { return false; }
  if (!stored) return false;
  const hash = await sha256(pin);
  return hash === stored;
}

/** Dev / forgot-PIN escape hatch — clears the stored hash so the user can
 *  set a new PIN. Wired up to a small "Forgot?" link in the PIN dialog. */
export function clearParentPin(): void {
  try { window.localStorage.removeItem(PIN_HASH_KEY); } catch { /* */ }
}
