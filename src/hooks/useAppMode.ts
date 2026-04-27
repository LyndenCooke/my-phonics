/**
 * useAppMode — parent vs child mode toggle.
 *
 * Parent mode (default): full app — library grid, shop, assess, admin etc.
 * Child mode: simplified home built around a single "Continue reading"
 *             card + book carousel. Hides shop/assess/admin so the kid
 *             can't wander into purchase flows.
 *
 * State persists in localStorage so a parent's choice carries across
 * sessions on the same device. The toggle is intentionally not gated by
 * a PIN at this stage — a small "PARENT" pill in the corner is enough
 * for the launch. PIN gating is the obvious next iteration.
 */
import { useEffect, useState } from 'react';

export type AppMode = 'parent' | 'child';

const KEY = 'mpb_app_mode';

function readMode(): AppMode {
  if (typeof window === 'undefined') return 'parent';
  try {
    const v = window.localStorage.getItem(KEY);
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
    try { window.localStorage.setItem(KEY, m); } catch { /* private mode — ignore */ }
    listeners.forEach(l => l(m));
  };

  const toggle = () => setMode(mode === 'parent' ? 'child' : 'parent');

  return { mode, setMode, toggle };
}
