/**
 * useGoogleAnalytics — fire a GA4 pageview on every React Router navigation.
 *
 * The gtag.js snippet in index.html only fires once on initial document
 * load. Without this hook, an SPA reads as "one big session on /" and
 * the per-page funnel data is useless. Mounting this hook anywhere
 * inside <BrowserRouter> turns every route change into a tracked
 * page_view, including the search string for funnel attribution.
 *
 * Safe in dev: if window.gtag isn't present (ad-blocker, no consent,
 * GA tag removed), the hook silently does nothing.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = 'G-WR9QE9ZMEN';

export function useGoogleAnalytics(): void {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined' || !window.gtag) return;
    // GA4 page_view best practice: fire as a config update with the new
    // path so the referrer / location fields are populated correctly.
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location.pathname, location.search]);
}
