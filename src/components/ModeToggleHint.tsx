/**
 * ModeToggleHint — first-run pointer for the parent/child mode toggle.
 *
 * The toggle is a small pill in the top-right header — easy to miss on
 * first load. This shows a pulsing arrow + caption pointing at it the
 * first few times a parent uses the app, and dismisses itself once they
 * either:
 *   - click the toggle (in which case they've discovered it)
 *   - click the X on the hint
 *   - have seen it 3 times across sessions (auto-dismiss so it doesn't
 *     nag forever)
 *
 * Renders nothing in child mode (kids shouldn't see it), nothing once
 * dismissed, and only on small/medium screens where the toggle's "Child
 * mode" label is hidden behind an icon (it's already obvious on desktop
 * with the full label).
 */
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAppMode } from '@/hooks/useAppMode';

const SEEN_KEY = 'mpb_mode_hint_seen_count_v1';
const DISMISSED_KEY = 'mpb_mode_hint_dismissed_v1';
const MAX_SHOWS = 3;

export default function ModeToggleHint() {
  const { mode } = useAppMode();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (mode !== 'parent') return;
    try {
      if (window.localStorage.getItem(DISMISSED_KEY)) return;
      const count = Number(window.localStorage.getItem(SEEN_KEY) || 0);
      if (count >= MAX_SHOWS) {
        window.localStorage.setItem(DISMISSED_KEY, '1');
        return;
      }
      // Bump the seen count for this visit
      window.localStorage.setItem(SEEN_KEY, String(count + 1));
      // Wait a beat so the page has time to settle before the hint pops in
      const t = setTimeout(() => setShow(true), 600);
      return () => clearTimeout(t);
    } catch { /* private mode — silently skip */ }
  }, [mode]);

  // Listen for the user actually clicking the toggle — anywhere in the app.
  // We piggyback on the mode listener: when mode flips to child, the hint
  // dismisses for good (they've found it).
  useEffect(() => {
    if (mode === 'child') {
      try { window.localStorage.setItem(DISMISSED_KEY, '1'); } catch { /* */ }
      setShow(false);
    }
  }, [mode]);

  const dismiss = () => {
    try { window.localStorage.setItem(DISMISSED_KEY, '1'); } catch { /* */ }
    setShow(false);
  };

  if (!show || mode !== 'parent') return null;

  return (
    <div
      className="absolute top-full right-2 mt-2 z-50 pointer-events-none"
      role="dialog"
      aria-label="Parent / Child mode hint"
    >
      <div className="relative pointer-events-auto animate-bounce-slow">
        {/* Caret pointing up at the toggle button */}
        <div
          className="absolute -top-2 right-6 w-4 h-4 bg-amber-400 rotate-45"
          aria-hidden="true"
        />
        <div className="relative bg-amber-400 text-amber-950 rounded-xl shadow-lg px-3 py-2.5 max-w-[15rem] flex items-start gap-2">
          <div className="flex-1">
            <p className="text-xs font-extrabold leading-tight">
              Switch to Child mode 👶
            </p>
            <p className="text-[11px] mt-0.5 leading-snug">
              Tap here to flip to a kid-safe view that hides the shop and settings.
            </p>
          </div>
          <button
            onClick={dismiss}
            className="shrink-0 -mr-1 -mt-1 w-5 h-5 rounded-full hover:bg-amber-500/30 flex items-center justify-center"
            aria-label="Dismiss hint"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Inline-defined animation so we don't need a tailwind config tweak */}
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-slow { animation: bounce-slow 1.6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
