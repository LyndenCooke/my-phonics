import { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { submitFeedback } from '@/lib/feedback';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where the prompt was shown from — stored on the review + GHL note. */
  source: string;
  /** Fired after a successful submit (parent can mark its own state). */
  onSubmitted?: () => void;
  title?: string;
  description?: string;
}

/**
 * Star rating + written feedback + two consent checkboxes. Used by both the
 * Profile "Share your feedback" card and the returning-user pop-up.
 */
export default function FeedbackDialog({
  open, onOpenChange, source, onSubmitted,
  title = 'How are we doing?',
  description = 'Your feedback helps us improve — and great comments may feature on our website.',
}: FeedbackDialogProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [consentNamed, setConsentNamed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setRating(0); setHover(0); setFeedback('');
    setConsentMarketing(false); setConsentNamed(false); setSubmitting(false);
  };

  const handleClose = (next: boolean) => {
    if (submitting) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: 'Pick a star rating', description: 'Tap a star to rate your experience.' });
      return;
    }
    setSubmitting(true);
    try {
      await submitFeedback({ rating, feedback, consentMarketing, consentNamed, source });
      toast({ title: 'Thank you! 💛', description: 'Your feedback has been sent to our team.' });
      onSubmitted?.();
      reset();
      onOpenChange(false);
    } catch (err) {
      setSubmitting(false);
      toast({
        title: 'Could not send feedback',
        description: (err as Error).message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-extrabold">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Star rating */}
        <div className="flex items-center justify-center gap-1.5 py-2">
          {[1, 2, 3, 4, 5].map((n) => {
            const active = (hover || rating) >= n;
            return (
              <button
                key={n}
                type="button"
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                className="p-1 transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  className={`w-9 h-9 ${active ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-muted-foreground/40'}`}
                />
              </button>
            );
          })}
        </div>

        {/* Written feedback */}
        <Textarea
          placeholder="What did you love? What could be better? (optional)"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
          className="resize-none rounded-xl"
        />

        {/* Consent — required before anything is shown publicly. */}
        <div className="space-y-3 rounded-xl bg-muted/40 p-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={consentMarketing}
              onCheckedChange={(c) => setConsentMarketing(c === true)}
              className="mt-0.5"
            />
            <span className="text-sm text-foreground leading-snug">
              You can feature my comment as a testimonial on your website &amp; socials.
            </span>
          </label>
          <label className={`flex items-start gap-3 ${consentMarketing ? 'cursor-pointer' : 'opacity-50'}`}>
            <Checkbox
              checked={consentNamed}
              disabled={!consentMarketing}
              onCheckedChange={(c) => setConsentNamed(c === true)}
              className="mt-0.5"
            />
            <span className="text-sm text-foreground leading-snug">
              You can use my first name alongside it.
            </span>
          </label>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-button active:scale-[0.97] transition-transform duration-200 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? 'Sending…' : 'Send feedback'}
        </button>
      </DialogContent>
    </Dialog>
  );
}
