import { supabase } from '@/integrations/supabase/client';
import { syncToGHL } from '@/lib/ghlClient';

/**
 * Parent feedback / testimonials.
 *
 * A submission is written to the `reviews` table (kind='general') and
 * mirrored to the GHL CRM via `contact.feedback`, where the user triages
 * it into website testimonials (when consent is given) or issues to fix.
 *
 * The returning-user pop-up is gated entirely client-side via localStorage:
 *   - it only auto-shows once the parent has returned (2nd+ session),
 *   - "Maybe later" snoozes it for SNOOZE_DAYS,
 *   - once submitted it never auto-shows again.
 */

const DONE_KEY = 'mpb_feedback_done';
const SNOOZE_KEY = 'mpb_feedback_snooze_until';
const SESSIONS_KEY = 'mpb_app_sessions';
const SNOOZE_DAYS = 4;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface FeedbackInput {
  rating: number;          // 1-5
  loved: string;           // what they loved — the testimonial text (may be empty)
  improvement: string;     // what could be better — private, never featured (may be empty)
  consentMarketing: boolean; // OK to feature the "loved" text as a testimonial
  consentNamed: boolean;     // OK to attribute with first name
  source: string;          // 'profile' | 'returning_popup'
}

export async function submitFeedback(input: FeedbackInput): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You need to be signed in to leave feedback.');

  const now = new Date().toISOString();
  // `reviews` isn't in the generated Supabase types yet, so cast the client.
  const { error } = await (supabase as any).from('reviews').insert({
    user_id: user.id,
    kind: 'general',
    source: input.source,
    due_at: now,
    prompted_at: now,
    submitted_at: now,
    rating: input.rating,
    // `feedback` holds the featurable praise; `improvement` is private.
    feedback: input.loved.trim() || null,
    improvement: input.improvement.trim() || null,
    consent_marketing: input.consentMarketing,
    consent_named: input.consentNamed,
  });
  if (error) throw error;

  markFeedbackDone();

  // Mirror to GHL CRM. Non-blocking by design (syncToGHL swallows errors)
  // so a CRM hiccup never blocks the parent's "thank you".
  await syncToGHL('contact.feedback', {
    rating: input.rating,
    feedback: input.loved.trim(),
    improvement: input.improvement.trim(),
    consent_marketing: input.consentMarketing,
    consent_named: input.consentNamed,
    source: input.source,
    email: user.email ?? '',
    full_name: (user.user_metadata as Record<string, unknown> | undefined)?.full_name ?? '',
  });
}

// ─── Returning-user pop-up gate ──────────────────────────────────────

// Module-level guard so React StrictMode's double-mount (dev) doesn't
// count one page load as two sessions.
let sessionCounted = false;

/** Count this page load as a session (once) and return the running total. */
export function recordSession(): number {
  const current = parseInt(localStorage.getItem(SESSIONS_KEY) ?? '0', 10) || 0;
  if (sessionCounted) return current;
  sessionCounted = true;
  const next = current + 1;
  try { localStorage.setItem(SESSIONS_KEY, String(next)); } catch { /* private mode */ }
  return next;
}

export function feedbackGiven(): boolean {
  return localStorage.getItem(DONE_KEY) === '1';
}

export function markFeedbackDone(): void {
  try {
    localStorage.setItem(DONE_KEY, '1');
    localStorage.removeItem(SNOOZE_KEY);
  } catch { /* private mode */ }
}

/** Snooze the auto pop-up for SNOOZE_DAYS ("Maybe later" / dismissed). */
export function snoozeFeedback(): void {
  try {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * DAY_MS));
  } catch { /* private mode */ }
}

function snoozeActive(): boolean {
  const until = parseInt(localStorage.getItem(SNOOZE_KEY) ?? '0', 10) || 0;
  return until > Date.now();
}

/**
 * Should the pop-up auto-open for this session? True only when the parent
 * has come back (>= 2 sessions), hasn't already given feedback, and isn't
 * inside a snooze window.
 */
export function shouldAutoPrompt(sessionCount: number): boolean {
  return sessionCount >= 2 && !feedbackGiven() && !snoozeActive();
}
