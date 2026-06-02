/**
 * Referral attribution — captures the `?ref=CODE` query param the first time
 * a visitor lands on the site and stores it in localStorage so it survives
 * navigation, sign-up, and the Stripe checkout redirect.
 *
 * Flow:
 *   1. Visitor lands at /?ref=ABC123 (shared from a friend's WhatsApp link).
 *   2. captureRefFromUrl() reads the param, stores it (60-day TTL), strips
 *      it from the URL so refresh / share-back doesn't re-trigger.
 *   3. On checkout, getStoredRefCode() is read and sent to the
 *      create-checkout-session edge function as metadata.
 *   4. The Stripe webhook reads metadata.ref_code on completion and writes
 *      an attribution row crediting the referrer.
 *
 * 90-day TTL — generous affiliate cookie window.
 */

import { supabase } from '@/integrations/supabase/client';

const KEY = 'mpb_ref_code';
const KEY_TS = 'mpb_ref_code_ts';
const TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

/** Call once on app boot (e.g. in App.tsx or LandingPage). Idempotent. */
export function captureRefFromUrl(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    const ref = url.searchParams.get('ref');
    if (!ref) return;
    const clean = ref.trim().toUpperCase().slice(0, 12);
    if (!/^[A-Z0-9]{4,12}$/.test(clean)) return;

    window.localStorage.setItem(KEY, clean);
    window.localStorage.setItem(KEY_TS, String(Date.now()));

    // Fire-and-forget click tracker. Bumps total_clicks on the referrer's
    // row. Failure is silent — analytics, not auth.
    supabase.rpc('track_referral_click', { p_code: clean }).then(() => {}, () => {});

    // Strip ?ref= from the URL bar — keeps it tidy and prevents a refresh
    // from looking like a fresh referral hit.
    url.searchParams.delete('ref');
    const newUrl = url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash;
    window.history.replaceState({}, '', newUrl);
  } catch {
    /* private mode / malformed URL — ignore */
  }
}

export function getStoredRefCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const ref = window.localStorage.getItem(KEY);
    const ts = Number(window.localStorage.getItem(KEY_TS) || 0);
    if (!ref) return null;
    if (Date.now() - ts > TTL_MS) {
      window.localStorage.removeItem(KEY);
      window.localStorage.removeItem(KEY_TS);
      return null;
    }
    return ref;
  } catch {
    return null;
  }
}

export function clearStoredRefCode(): void {
  try {
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem(KEY_TS);
  } catch { /* */ }
}

/** Build a shareable URL for the user's own referral code. */
export function buildShareUrl(code: string, origin?: string): string {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://myphonicsbooks.com');
  return `${base}/?ref=${code}`;
}

/** Pre-formatted WhatsApp share message. Conversational, parent-to-parent
 *  voice — not corporate-affiliate copy. */
export function buildWhatsappMessage(code: string, origin?: string): string {
  const url = buildShareUrl(code, origin);
  return [
    `Hey! We've been using MyPhonicsBooks with our little one and they're loving it. Every book is phonics-aligned, beautifully illustrated and set somewhere different in the world.`,
    ``,
    `It's just £4.99/month (with a free trial) or £39 for lifetime access to all 33 books. Thought of you:`,
    ``,
    url,
  ].join('\n');
}

/** Pre-formatted Facebook share message — slightly more formal, public-feed
 *  voice (people read FB posts differently to WhatsApp DMs). */
export function buildFacebookMessage(code: string, origin?: string): string {
  const url = buildShareUrl(code, origin);
  return [
    `If you've got a 4 to 8 year old learning to read, MyPhonicsBooks is brilliant. 33 phonics-aligned books with stories from around the world, tap-any-word audio and parent progress tracking.`,
    ``,
    `Free 7-day trial, then £4.99/month or £39 lifetime:`,
    url,
  ].join('\n');
}
