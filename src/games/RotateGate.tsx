/**
 * RotateGate — phone-fit for the fixed-landscape canvas games.
 *
 * The engine games play on a fixed 1280×720 logical stage letterboxed into
 * the screen. On a phone held upright that shrinks the game to a tiny
 * strip, so:
 *  - on mount we ATTEMPT fullscreen + a landscape orientation lock (works
 *    on Android Chrome while the Play-tap's user activation is still
 *    fresh; silently refused elsewhere);
 *  - whenever the viewport is a portrait phone, a friendly full-screen
 *    prompt asks the child to turn the phone sideways — the game stays
 *    paused behind it because the overlay swallows the taps.
 *
 * Drop <RotateGate /> inside a game's fixed-inset root, after the canvas
 * and before the close button (so closing still works while gated).
 */
import { useEffect, useState } from 'react';

function isPhonePortrait(): boolean {
  return window.innerHeight > window.innerWidth
    && Math.min(window.innerWidth, window.innerHeight) < 600;
}

export default function RotateGate() {
  const [portrait, setPortrait] = useState(isPhonePortrait());

  useEffect(() => {
    const onChange = () => setPortrait(isPhonePortrait());
    window.addEventListener('resize', onChange);
    window.addEventListener('orientationchange', onChange);
    return () => {
      window.removeEventListener('resize', onChange);
      window.removeEventListener('orientationchange', onChange);
    };
  }, []);

  // Best-effort fullscreen + landscape lock (Android). iOS has no lock —
  // the overlay does the asking there.
  useEffect(() => {
    let locked = false;
    (async () => {
      try {
        if (!isPhonePortrait()) return;
        const el = document.documentElement;
        if (el.requestFullscreen) {
          await el.requestFullscreen().catch(() => {});
        }
        const o = screen.orientation as ScreenOrientation & { lock?: (v: string) => Promise<void> };
        if (o?.lock) {
          await o.lock('landscape');
          locked = true;
        }
      } catch { /* refused or unsupported — overlay handles it */ }
    })();
    return () => {
      try {
        const o = screen.orientation as ScreenOrientation & { unlock?: () => void };
        if (locked) o.unlock?.();
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      } catch { /* fine */ }
    };
  }, []);

  if (!portrait) return null;
  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 px-10 text-center"
      style={{ background: 'rgba(18,26,40,0.96)' }}
    >
      <span
        aria-hidden
        className="text-7xl"
        style={{ display: 'inline-block', animation: 'mpb-rotate-hint 1.6s ease-in-out infinite' }}
      >
        📱
      </span>
      <p className="font-display text-2xl font-extrabold text-white leading-snug">
        Turn your phone sideways to play!
      </p>
      <p className="font-child text-base text-white/70">
        This game is much bigger in landscape.
      </p>
      <style>{`
        @keyframes mpb-rotate-hint {
          0%, 20% { transform: rotate(0deg); }
          55%, 80% { transform: rotate(-90deg); }
          100% { transform: rotate(-90deg); }
        }
      `}</style>
    </div>
  );
}
