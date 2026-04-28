/**
 * Founders Club — the £1 limited launch offer.
 *
 * Anchor: a fixed end date so the timer counts down to the SAME moment for
 * every visitor (not "18 days from when you first land"). Set once on
 * launch day so the offer expires for everyone simultaneously.
 *
 * Anchor date: 2026-05-16 23:59:59 UTC (18 days from launch on 2026-04-28).
 *
 * Once expired, banners hide themselves and the £1 product can be marked
 * inactive in the products table (or this constant flipped — UI checks
 * `isFoundersClubActive()` and degrades gracefully).
 */
import { useEffect, useState } from 'react';

/** Hard-coded launch end. Change this in one place to extend / shorten. */
export const FOUNDERS_END_AT = new Date('2026-05-16T23:59:59.000Z').getTime();

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  expired: boolean;
}

export function getCountdown(now = Date.now()): Countdown {
  const totalMs = Math.max(0, FOUNDERS_END_AT - now);
  const expired = totalMs <= 0;
  const days = Math.floor(totalMs / 86_400_000);
  const hours = Math.floor((totalMs % 86_400_000) / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMs % 60_000) / 1_000);
  return { days, hours, minutes, seconds, totalMs, expired };
}

/** Re-renders every second while the offer is live. After expiry, stops the
 *  interval to avoid wasted ticks. */
export function useCountdown(): Countdown {
  const [c, setC] = useState<Countdown>(() => getCountdown());
  useEffect(() => {
    if (c.expired) return;
    const id = setInterval(() => setC(getCountdown()), 1000);
    return () => clearInterval(id);
  }, [c.expired]);
  return c;
}

export function isFoundersClubActive(): boolean {
  return Date.now() < FOUNDERS_END_AT;
}

/** The price tag we tell users. Mirror of what's seeded in the products
 *  table — kept here so the banner / share copy can render without an API
 *  round-trip. */
export const FOUNDERS_PRICE_PENCE = 100;
export const FOUNDERS_PRICE_DISPLAY = '£1';
