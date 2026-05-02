/**
 * FoundersReviewPrompt — the feedback loop that makes the £1 Founders
 * Club worth it for us.
 *
 * Founders agreed to share a review at 24h and 1 week. The DB has those
 * rows scheduled by trigger. This component:
 *   - Fetches the next pending review for the current user (where due_at
 *     ≤ now and submitted_at IS NULL)
 *   - Renders an inline prompt card on Profile / Library
 *   - On submit, writes rating + feedback + consent flags back to the row
 *
 * Two distinct copies depending on kind:
 *   - founders_24h — "How are the first 24 hours going? Anything broken?"
 *   - founders_1week — "After a week with your child, would you tell
 *     another parent about us?"
 *
 * Consent is two checkboxes: marketing (we may quote your feedback) and
 * named (you're happy to be attributed). Default both off — opt-in only.
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Star, MessageCircle, Sparkles, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { hapticLight, hapticSuccess } from '@/lib/native';

// Snooze key — when the parent taps "Remind me later" we hide the modal
// for 24 hours on this device so we don't pester them on every page nav.
const SNOOZE_KEY = 'mpb_review_snooze_until';
const SNOOZE_HOURS = 24;

interface ReviewRow {
  id: string;
  kind: 'founders_24h' | 'founders_1week' | 'general';
  due_at: string;
  submitted_at: string | null;
}

export default function FoundersReviewPrompt() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pending, setPending] = useState<ReviewRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [consentNamed, setConsentNamed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    // Respect the local snooze — if the user dismissed within the last
    // SNOOZE_HOURS, don't even hit the DB for this session.
    const snoozedUntil = Number(localStorage.getItem(SNOOZE_KEY) ?? '0');
    if (snoozedUntil && snoozedUntil > Date.now()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      // Find the earliest pending review whose due_at has passed
      const { data } = await supabase
        .from('reviews')
        .select('id, kind, due_at, submitted_at')
        .eq('user_id', user.id)
        .is('submitted_at', null)
        .lte('due_at', new Date().toISOString())
        .order('due_at', { ascending: true })
        .limit(1);
      if (cancelled) return;
      setPending((data?.[0] as ReviewRow) ?? null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const snooze = () => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_HOURS * 60 * 60 * 1000));
    setPending(null);
  };

  if (loading || !pending || !user) return null;

  const isFirstReview = pending.kind === 'founders_24h';

  const submit = async () => {
    if (rating === 0) {
      toast({ title: 'Please tap a star', description: 'A quick rating helps us see at a glance how you\'re finding it.' });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from('reviews')
      .update({
        rating,
        feedback: feedback.trim() || null,
        consent_marketing: consentMarketing,
        consent_named: consentMarketing && consentNamed, // named only meaningful with marketing
        submitted_at: new Date().toISOString(),
      })
      .eq('id', pending.id);
    setSubmitting(false);
    if (error) {
      toast({ title: 'Couldn\'t save', description: error.message, variant: 'destructive' });
      return;
    }
    hapticSuccess();
    toast({ title: 'Thank you 💜', description: 'Your feedback genuinely makes the next version of MyPhonicsBooks better.' });
    setPending(null);
  };

  // Render as a modal popup via a portal — escapes the AnimatedRoutes
  // motion.div containing block (same fix as the bottom nav) and sits on
  // top of whatever page the parent is currently looking at.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isFirstReview ? 'First-day feedback' : 'One-week feedback'}
      className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-3"
    >
      {/* Scrim — tap to snooze */}
      <button
        aria-label="Close feedback"
        onClick={snooze}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      />

      {/* Modal card */}
      <div
        className="relative w-full max-w-md rounded-3xl bg-gradient-to-br from-fuchsia-50 to-pink-50 border-2 border-fuchsia-300 p-5 shadow-2xl animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-300 max-h-[calc(100vh-2rem)] overflow-y-auto"
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
      >
        {/* Close button — top right */}
        <button
          onClick={snooze}
          aria-label="Remind me later"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 hover:bg-white border border-fuchsia-200 flex items-center justify-center"
        >
          <X className="w-4 h-4 text-fuchsia-700" />
        </button>

        <div className="flex items-start gap-3 mb-4 pr-8">
          <div className="w-10 h-10 rounded-xl bg-fuchsia-500 text-white flex items-center justify-center shrink-0">
            {isFirstReview ? <MessageCircle className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-base font-extrabold text-foreground leading-tight">
              {isFirstReview ? 'How are the first 24 hours going?' : 'A week in — would you tell a friend?'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {isFirstReview
                ? "You're a Founder. Honest feedback now is gold — what's working, what's broken, what's missing. We read every word."
                : "It's been a week. Your child has had a few sessions. What stuck? What didn't? If a friend asked, what would you say?"}
            </p>
          </div>
        </div>

        {/* Star rating */}
        <div className="flex items-center justify-center gap-1.5 mb-4 py-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => { hapticLight(); setRating(n); }}
              className="active:scale-90 transition-transform"
              aria-label={`${n} stars`}
            >
              <Star
                className={`w-9 h-9 ${n <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
                strokeWidth={2}
              />
            </button>
          ))}
        </div>

        {/* Free-text feedback */}
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder={isFirstReview
            ? "Anything broken? Confusing? Beautiful? Tell us in your own words…"
            : 'What would you say to another parent? (Optional but it helps us so much.)'}
          rows={4}
          className="w-full px-3 py-2.5 rounded-xl bg-white border border-fuchsia-200 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-fuchsia-300 mb-3"
        />

        {/* Consent — opt-in only */}
        <label className="flex items-start gap-2.5 mb-2 cursor-pointer">
          <input
            type="checkbox"
            checked={consentMarketing}
            onChange={(e) => setConsentMarketing(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-fuchsia-300 text-fuchsia-600 focus:ring-fuchsia-300"
          />
          <span className="text-xs text-foreground leading-relaxed">
            Happy for MyPhonicsBooks to share my feedback in marketing (anonymously by default).
          </span>
        </label>
        {consentMarketing && (
          <label className="flex items-start gap-2.5 mb-3 ml-6 cursor-pointer">
            <input
              type="checkbox"
              checked={consentNamed}
              onChange={(e) => setConsentNamed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-fuchsia-300 text-fuchsia-600 focus:ring-fuchsia-300"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              Also happy to be quoted by name (e.g. "Sarah, parent of 5-year-old").
            </span>
          </label>
        )}

        <div className="flex gap-2 mt-1">
          <button
            onClick={snooze}
            className="flex-1 py-3 rounded-xl border-2 border-fuchsia-200 bg-white text-fuchsia-700 font-bold text-sm active:scale-[0.97] transition-transform"
          >
            Remind me later
          </button>
          <button
            onClick={submit}
            disabled={submitting || rating === 0}
            className="flex-1 py-3 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-extrabold text-sm shadow-button active:scale-[0.97] transition-transform disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {submitting ? 'Sending…' : <>Send <Check className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
