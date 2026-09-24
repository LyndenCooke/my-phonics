import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  title,
  description,
}: FeedbackDialogProps) {
  const { t } = useTranslation('prompts');
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [loved, setLoved] = useState('');
  const [improvement, setImprovement] = useState('');
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [consentNamed, setConsentNamed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setRating(0); setHover(0); setLoved(''); setImprovement('');
    setConsentMarketing(false); setConsentNamed(false); setSubmitting(false);
  };

  const handleClose = (next: boolean) => {
    if (submitting) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: t('feedback.pickRating'), description: t('feedback.pickRatingBody') });
      return;
    }
    setSubmitting(true);
    try {
      await submitFeedback({ rating, loved, improvement, consentMarketing, consentNamed, source });
      toast({ title: t('feedback.thanks'), description: t('feedback.thanksBody') });
      onSubmitted?.();
      reset();
      onOpenChange(false);
    } catch (err) {
      setSubmitting(false);
      toast({
        title: t('feedback.sendFailed'),
        description: (err as Error).message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-extrabold">{title ?? t('feedback.title')}</DialogTitle>
          <DialogDescription>{description ?? t('feedback.description')}</DialogDescription>
        </DialogHeader>

        {/* Star rating */}
        <div className="flex items-center justify-center gap-1.5 py-2" dir="ltr">
          {[1, 2, 3, 4, 5].map((n) => {
            const active = (hover || rating) >= n;
            return (
              <button
                key={n}
                type="button"
                aria-label={t('feedback.stars', { count: n })}
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

        {/* What they loved — this is the testimonial-worthy text, kept
            separate so it can be featured publicly on its own. */}
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-foreground">{t('feedback.lovedLabel')}</label>
          <Textarea
            placeholder={t('feedback.lovedPlaceholder')}
            value={loved}
            onChange={(e) => setLoved(e.target.value)}
            rows={3}
            className="resize-none rounded-xl"
          />
        </div>

        {/* What could be better — private, never shown publicly even with
            testimonial consent. Only the "loved" text is featurable. */}
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-foreground">{t('feedback.improveLabel')}</label>
          <Textarea
            placeholder={t('feedback.improvePlaceholder')}
            value={improvement}
            onChange={(e) => setImprovement(e.target.value)}
            rows={3}
            className="resize-none rounded-xl"
          />
          <p className="text-[11px] text-muted-foreground">{t('feedback.privateNote')}</p>
        </div>

        {/* Consent — required before anything is shown publicly. */}
        <div className="space-y-3 rounded-xl bg-muted/40 p-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={consentMarketing}
              onCheckedChange={(c) => setConsentMarketing(c === true)}
              className="mt-0.5"
            />
            <span className="text-sm text-foreground leading-snug">
              {t('feedback.consentMarketing')}
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
              {t('feedback.consentNamed')}
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
          {submitting ? t('feedback.sending') : t('feedback.send')}
        </button>
      </DialogContent>
    </Dialog>
  );
}
