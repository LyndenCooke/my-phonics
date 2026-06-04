import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import FeedbackDialog from '@/components/FeedbackDialog';
import { recordSession, shouldAutoPrompt, snoozeFeedback } from '@/lib/feedback';

// Routes where a feedback pop-up would be intrusive or out of place.
const SUPPRESSED_PREFIXES = ['/admin', '/school', '/auth', '/reset-password', '/landing'];

/**
 * Returning-user feedback pop-up. Mounted once at the app root. Auto-opens
 * (after a short settle delay) for a signed-in parent who has come back and
 * hasn't yet given feedback. Closing without submitting snoozes it for a few
 * days; submitting retires it for good. All gating lives in lib/feedback.
 */
export default function FeedbackPrompt() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const submittedRef = useRef(false);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!user || firedRef.current) return;

    const path = window.location.pathname;
    if (SUPPRESSED_PREFIXES.some((p) => path.startsWith(p))) return;

    const sessions = recordSession();
    if (!shouldAutoPrompt(sessions)) return;

    firedRef.current = true;
    // Let the app paint + the parent orient before interrupting.
    const t = window.setTimeout(() => setOpen(true), 4000);
    return () => window.clearTimeout(t);
  }, [user]);

  const handleOpenChange = (next: boolean) => {
    // Dismissed (X / backdrop / "maybe later") without submitting → snooze.
    if (!next && !submittedRef.current) snoozeFeedback();
    setOpen(next);
  };

  if (!user) return null;

  return (
    <FeedbackDialog
      open={open}
      onOpenChange={handleOpenChange}
      source="returning_popup"
      onSubmitted={() => { submittedRef.current = true; }}
      title="Enjoying MyPhonicsBooks?"
      description="You've been back a few times — we'd love a quick star rating and any thoughts. It really helps."
    />
  );
}
