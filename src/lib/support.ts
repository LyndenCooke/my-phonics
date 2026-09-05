/**
 * "Support MyPhonicsBooks" — the optional pay-what-you-like payment
 * (launch 2026-09-05). Every book, game and worksheet is free; signing up
 * (free) unlocks downloads; parents who want to can leave a thank-you.
 *
 * Shared by the /support page, the post-signup SupportPrompt and Profile.
 */
import { supabase } from '@/integrations/supabase/client';

/** Preset amounts in pence. £5 is the highlighted default. */
export const SUPPORT_AMOUNTS: { pence: number; label: string; note: string }[] = [
  { pence: 300, label: '£3', note: 'A coffee' },
  { pence: 500, label: '£5', note: 'A book' },
  { pence: 1000, label: '£10', note: 'A level' },
  { pence: 2000, label: '£20', note: 'A whole shelf' },
];

export const SUPPORT_MIN_PENCE = 100;
export const SUPPORT_MAX_PENCE = 50000;

/**
 * Opens Stripe Checkout for a one-off support payment. Requires a signed-in
 * session — the checkout function refuses anonymous support payments so the
 * thank-you lands on the right account. Resolves after the redirect has been
 * kicked off; throws with a user-facing message on failure.
 */
export async function startSupportCheckout(pence: number): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Please sign in first.');
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ support_pence: pence }),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.url) throw new Error(data?.error || 'Could not start checkout');
  window.location.href = data.url;
}

/** Parses a free-text amount ("7", "7.50", "£7.50") into pence, or null. */
export function parseSupportAmount(input: string): number | null {
  const cleaned = input.replace(/[£,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const pence = Math.round(parseFloat(cleaned) * 100);
  if (pence < SUPPORT_MIN_PENCE || pence > SUPPORT_MAX_PENCE) return null;
  return pence;
}

/** "£5" for whole pounds, "£7.50" otherwise. */
export function formatSupportAmount(pence: number): string {
  return `£${(pence / 100).toFixed(pence % 100 === 0 ? 0 : 2)}`;
}

// ── Post-signup prompt flag ──────────────────────────────────────────────
// Auth.tsx sets this the moment an account is created; the SupportPrompt in
// Layout shows once when a signed-in session is present, then clears it.
const PROMPT_KEY = 'mpb_support_prompt';

export function markSupportPromptPending(): void {
  try { localStorage.setItem(PROMPT_KEY, 'pending'); } catch { /* ignore */ }
}

export function isSupportPromptPending(): boolean {
  try { return localStorage.getItem(PROMPT_KEY) === 'pending'; } catch { return false; }
}

export function clearSupportPrompt(): void {
  try { localStorage.setItem(PROMPT_KEY, 'done'); } catch { /* ignore */ }
}
