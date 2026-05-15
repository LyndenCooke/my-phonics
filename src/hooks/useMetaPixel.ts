/**
 * useMetaPixel — fire a Meta Pixel PageView on every React Router navigation.
 *
 * The pixel snippet in index.html only fires once on initial document load.
 * Without this hook the SPA reads as a single "PageView" event in Events
 * Manager and the in-funnel dropoff signal Meta's optimiser learns from is
 * lost.
 *
 * Safe in dev: if window.fbq isn't present (ad-blocker, no consent, pixel
 * not yet configured with a real ID) the hook silently does nothing.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    fbq?: (command: string, ...args: unknown[]) => void;
  }
}

export function useMetaPixel(): void {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined' || !window.fbq) return;
    window.fbq('track', 'PageView');
  }, [location.pathname, location.search]);
}
