/**
 * Google Ads sign-up conversion. The site is a SPA, so instead of an event
 * snippet on a "thank you" page we send the conversion when a freshly created
 * account first signs in on this device: email sign-ups (live session or
 * after confirming the email) and Google sign-ups alike.
 */
import type { User } from '@supabase/supabase-js';

const SIGNUP_SEND_TO = 'AW-18493574238/7aBACOiDxZAdEN6YtvJE';
// An account counts as new for a day, which covers confirming the email later.
const NEW_ACCOUNT_MS = 24 * 60 * 60 * 1000;
const REPORTED_KEY = 'mpb_ads_signup_reported';

export function reportSignupConversion(user: User): void {
  const created = Date.parse(user.created_at ?? '');
  if (!created || Date.now() - created > NEW_ACCOUNT_MS) return;
  try {
    if (localStorage.getItem(REPORTED_KEY) === user.id) return;
    localStorage.setItem(REPORTED_KEY, user.id);
  } catch {
    return;
  }
  (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag?.('event', 'conversion', { send_to: SIGNUP_SEND_TO });
}
