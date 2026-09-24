import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { useFunnelTracker } from '@/hooks/useFunnelTracker';
import FunnelLayout from '@/components/funnels/FunnelLayout';
import QuickScreening from '@/components/funnels/QuickScreening';
import BundleUpsell from './BundleUpsell';
import MonthlyDownsell from './MonthlyDownsell';
import BookUnlockedModal from '@/components/BookUnlockedModal';
import { BOOK_CATALOG } from '@/lib/bookCatalog';
import { JOURNEY_LEVELS, journeyLevelOf } from '@/lib/levels8';
import { useTranslation } from 'react-i18next';

const HUB_URL = import.meta.env.VITE_HUB_URL || '/library';

// Journey-8 name + colour per level, sourced from the journey source of truth.
const LEVEL_CONFIG: Record<number, { colour: string; name: string }> =
  Object.fromEntries(JOURNEY_LEVELS.map((l) => [l.level, { colour: l.hex, name: l.name }]));

type Step = 'assessment' | 'capture' | 'upsell' | 'downsell' | 'unlocked';

export default function FreeAssessment() {
  useFunnelTracker();
  const navigate = useNavigate();
  const { t } = useTranslation('funnels');
  const [step, setStep] = useState<Step>('assessment');
  const [level, setLevel] = useState(1);
  const [childName, setChildName] = useState('');
  const [email, setEmail] = useState('');

  const goToHub = () => { window.location.href = HUB_URL; };

  // Step 1: assessment runs immediately on landing — no email gate, no wordy intro.
  if (step === 'assessment') {
    return (
      <FunnelLayout>
        <QuickScreening
          childName={childName}
          onComplete={(lv) => { setLevel(lv); setStep('capture'); }}
          onBack={() => navigate('/')}
        />
      </FunnelLayout>
    );
  }

  // Step 2: result celebration + email capture together. The email links the
  // assessment + free book to the user; guest-assessment-signup creates the
  // user, saves the result, unlocks the level book, and emails a magic link.
  if (step === 'capture') {
    return (
      <FunnelLayout>
        <ResultCapture
          level={level}
          initialChildName={childName}
          initialEmail={email}
          onSuccess={({ childName: name, email: e }) => {
            setChildName(name);
            setEmail(e);
            setStep('upsell');
          }}
        />
      </FunnelLayout>
    );
  }

  if (step === 'upsell') {
    return (
      <FunnelLayout>
        <BundleUpsell
          childName={childName}
          level={level}
          onAccept={goToHub}
          onDecline={() => setStep('downsell')}
        />
      </FunnelLayout>
    );
  }

  if (step === 'downsell') {
    return (
      <FunnelLayout>
        <MonthlyDownsell
          childName={childName}
          level={level}
          onAccept={goToHub}
          onDecline={() => setStep('unlocked')}
        />
      </FunnelLayout>
    );
  }

  // unlocked — celebrate the free book and route to library
  const firstBook = BOOK_CATALOG.find(b => journeyLevelOf(b.sub_level) === level);
  const coverUrl = firstBook
    ? `/covers/${firstBook.sub_level.replace(/^L/, '').replace('.', '_')}_cover.jpg`
    : null;

  return (
    <FunnelLayout>
      <BookUnlockedModal
        open={true}
        onClose={goToHub}
        onContinue={goToHub}
        title={firstBook?.title ?? t('shared.levelBookFallback', { level })}
        level={level}
        coverUrl={coverUrl}
        subtitle={t('shared.checkEmail', { email })}
        ctaLabel={t('shared.browseLibrary')}
      />
    </FunnelLayout>
  );
}

/* ─── Result + email capture (combined screen) ──────────────────────── */

interface ResultCaptureProps {
  level: number;
  initialChildName: string;
  initialEmail: string;
  onSuccess: (data: { childName: string; email: string }) => void;
}

function ResultCapture({ level, initialChildName, initialEmail, onSuccess }: ResultCaptureProps) {
  const { t } = useTranslation('funnels');
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[1];
  const [childName, setChildName] = useState(initialChildName);
  const [email, setEmail] = useState(initialEmail);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = email.trim() && consent && !loading;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/guest-assessment-signup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            child_name: childName.trim(),
            recommended_level: level,
            highest_level_passed: Math.max(1, level - 1),
            answers_summary: { source: 'quick-screening' },
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('shared.signupFailed'));
      onSuccess({ childName: childName.trim(), email: email.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common:errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Celebration */}
      <div className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl rounded-2xl p-6 sm:p-7 text-center mb-4">
        <div
          className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-white shadow-lg animate-in zoom-in duration-500"
          style={{ backgroundColor: config.colour }}
        >
          <Sparkles size={36} />
        </div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">
          {t('freeAssessment.resultLabel')}
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-1">
          {t('freeAssessment.level', { level })}
        </h1>
        <p className="text-sm font-bold mb-3" style={{ color: config.colour }} dir="ltr" lang="en">
          {config.name}
        </p>
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-white text-sm font-bold"
          style={{ backgroundColor: config.colour }}
        >
          <Sparkles size={14} /> {t('freeAssessment.freeUnlocked')}
        </div>
      </div>

      {/* Email capture — book gets linked to this email */}
      <form
        onSubmit={handleSubmit}
        className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl rounded-2xl p-6"
      >
        <p className="text-base font-bold text-foreground mb-1 text-center">
          {t('freeAssessment.saveTitle')}
        </p>
        <p className="text-xs text-muted-foreground mb-4 text-center">
          {t('shared.loginLinkKeep')}
        </p>

        <div className="space-y-3">
          <input
            type="text"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder={t('shared.childNameOptional')}
            className="w-full px-4 py-3.5 rounded-xl border-2 border-pink-200 bg-white text-foreground placeholder:text-muted-foreground focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-pink-500/10 outline-none transition-all"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('shared.emailPlaceholder')}
            className="w-full px-4 py-3.5 rounded-xl border-2 border-pink-200 bg-white text-foreground placeholder:text-muted-foreground focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-pink-500/10 outline-none transition-all"
            required
          />
          <label className="flex items-start gap-3 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-pink-300 text-[hsl(var(--primary))] focus:ring-pink-500/20"
            />
            <span>{t('shared.consent')}</span>
          </label>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-4 bg-gradient-to-r from-[hsl(var(--primary))] to-rose-500 text-white font-bold text-base rounded-xl shadow-lg shadow-pink-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>{t('shared.sendFreeBook')} <ArrowRight size={20} className="rtl:-scale-x-100" /></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
