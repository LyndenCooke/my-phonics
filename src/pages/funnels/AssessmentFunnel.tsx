import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Search, Sparkles, ChevronRight, Loader2, ArrowRight } from 'lucide-react';
import { useFunnelTracker } from '@/hooks/useFunnelTracker';
import FunnelLayout from '@/components/funnels/FunnelLayout';
import Assessment from '@/pages/Assessment';
import BundleUpsell from './BundleUpsell';
import BookUnlockedModal from '@/components/BookUnlockedModal';
import { BOOK_CATALOG } from '@/lib/bookCatalog';
import { supabase } from '@/integrations/supabase/client';

const LEVEL_CONFIG: Record<number, { colour: string; name: string }> = {
  1: { colour: '#E84B8A', name: 'Starting Stories' },
  2: { colour: '#F5A623', name: 'Longer Sounds' },
  3: { colour: '#4ABD6D', name: 'New Spellings' },
  4: { colour: '#5B9EFF', name: 'Building Fluency' },
  5: { colour: '#A78EFF', name: 'Reading Together' },
  6: { colour: '#2B8A6E', name: 'Reading Champion' },
};

type Mode = 'rapid' | 'full';
type Stage = 'choose' | 'assess' | 'result' | 'upsell' | 'paid-email' | 'free-book-email' | 'unlocked';

interface AnswersSummary {
  sounds_correct: number;
  sounds_asked: number;
  words_correct: number;
  words_asked: number;
}

export default function AssessmentFunnel() {
  useFunnelTracker();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('choose');
  const [mode, setMode] = useState<Mode>('rapid');
  const [level, setLevel] = useState(1);
  const [summary, setSummary] = useState<AnswersSummary | null>(null);

  const goToHub = () => navigate('/library', { state: { filterLevel: level } });

  // Step 1: chooser — two big buttons. Pick fast or thorough.
  if (stage === 'choose') {
    return (
      <FunnelLayout>
        <div className="max-w-md mx-auto text-center pt-8 sm:pt-12 mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            Find their{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--primary))] via-rose-500 to-amber-500">
              reading level
            </span>
          </h1>
          <p className="text-muted-foreground mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            Pick how thorough you want the test to be.
          </p>
        </div>

        <div className="max-w-md mx-auto space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <button
            onClick={() => { setMode('rapid'); setStage('assess'); }}
            className="w-full p-5 rounded-2xl border-2 border-[hsl(var(--primary))] bg-white text-left active:scale-[0.98] transition-all shadow-xl shadow-pink-500/10 hover:shadow-2xl hover:shadow-pink-500/20"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-rose-500 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-base font-extrabold text-foreground">3-minute check</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  A quick adaptive sound test. Good if you just want a starting point.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </div>
          </button>

          <button
            onClick={() => { setMode('full'); setStage('assess'); }}
            className="w-full p-5 rounded-2xl border-2 border-border bg-white text-left active:scale-[0.98] transition-all shadow-card hover:border-[hsl(var(--primary))]/50"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-foreground flex items-center justify-center shrink-0">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-base font-extrabold text-foreground">10-minute deep test</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sounds, real words, alien words and tricky words at every level.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </div>
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6 max-w-md mx-auto">
          Free book at their level when you finish. No card needed.
        </p>
      </FunnelLayout>
    );
  }

  // Step 2: run the actual assessment. Assessment.tsx handles onboarding +
  // adaptive testing internally; in funnelMode it hands the level back via
  // onFunnelComplete instead of asking for an email at the result screen.
  if (stage === 'assess') {
    return (
      <Assessment
        initialMode={mode}
        funnelMode
        onFunnelComplete={(lv, sm) => {
          setLevel(lv);
          setSummary(sm);
          setStage('result');
        }}
      />
    );
  }

  // Step 3: celebrate the level + free book unlock with one Continue button.
  // Email/payment are deferred to the next steps so action precedes ask.
  if (stage === 'result') {
    const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[1];
    return (
      <FunnelLayout>
        <div className="max-w-md mx-auto pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl rounded-2xl p-6 sm:p-8 text-center mb-5">
            <div
              className="w-24 h-24 mx-auto mb-5 rounded-full flex items-center justify-center text-white shadow-lg animate-in zoom-in duration-500"
              style={{ backgroundColor: config.colour }}
            >
              <Sparkles size={42} />
            </div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">
              Their reading level
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-1">
              Level {level}
            </h1>
            <p className="text-base font-bold mb-5" style={{ color: config.colour }}>
              {config.name}
            </p>
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-white text-sm font-bold shadow-md"
              style={{ backgroundColor: config.colour }}
            >
              <Sparkles size={14} /> Free book unlocked
            </div>
          </div>

          <button
            onClick={() => setStage('upsell')}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[hsl(var(--primary))] to-rose-500 text-white font-bold text-base shadow-lg shadow-pink-500/30 active:scale-[0.97] transition-transform duration-200 flex items-center justify-center gap-2"
          >
            Continue <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </FunnelLayout>
    );
  }

  // Step 4: bundle upsell — Yes goes to email-then-checkout, No goes to
  // email-only for the free book.
  if (stage === 'upsell') {
    return (
      <FunnelLayout>
        <BundleUpsell
          childName=""
          level={level}
          onAccept={() => setStage('paid-email')}
          onDecline={() => setStage('free-book-email')}
        />
      </FunnelLayout>
    );
  }

  // Step 5a: email modal then straight to Stripe checkout. The webhook
  // creates the Supabase account on payment success, ties guest_email to
  // the new user, and unlocks the bundle.
  if (stage === 'paid-email') {
    return (
      <FunnelLayout>
        <PaidCheckoutEmail
          level={level}
          onBack={() => setStage('upsell')}
        />
      </FunnelLayout>
    );
  }

  // Step 5b: free-book email capture. guest-assessment-signup creates the
  // user, saves the result, unlocks the level book, and emails a magic link.
  if (stage === 'free-book-email') {
    return (
      <FunnelLayout>
        <FreeBookEmail
          level={level}
          summary={summary}
          onSuccess={() => setStage('unlocked')}
        />
      </FunnelLayout>
    );
  }

  // Step 6: unlocked — celebrate and route to /library.
  const firstBook = BOOK_CATALOG.find(b => b.level === level);
  const coverUrl = firstBook
    ? `/covers/${firstBook.sub_level.replace(/^L/, '').replace('.', '_')}_cover.jpg`
    : null;

  return (
    <FunnelLayout>
      <BookUnlockedModal
        open={true}
        onClose={goToHub}
        onContinue={goToHub}
        title={firstBook?.title ?? `Level ${level} Book`}
        level={level}
        coverUrl={coverUrl}
        subtitle="Check your inbox for the login link"
        ctaLabel="Browse the Library"
      />
    </FunnelLayout>
  );
}

/* ─── Free-book email capture ───────────────────────────────────── */

interface FreeBookEmailProps {
  level: number;
  summary: AnswersSummary | null;
  onSuccess: () => void;
}

function FreeBookEmail({ level, summary, onSuccess }: FreeBookEmailProps) {
  const [childName, setChildName] = useState('');
  const [email, setEmail] = useState('');
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
            answers_summary: summary ?? {},
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <form
        onSubmit={handleSubmit}
        className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl rounded-2xl p-6 sm:p-7"
      >
        <p className="text-lg font-extrabold text-foreground mb-1 text-center">
          Where should we send your free book?
        </p>
        <p className="text-xs text-muted-foreground mb-5 text-center">
          We'll email a login link so the book is yours to keep.
        </p>

        <div className="space-y-3">
          <input
            type="text"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="Child's first name (optional)"
            className="w-full px-4 py-3.5 rounded-xl border-2 border-pink-200 bg-white text-foreground placeholder:text-muted-foreground focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-pink-500/10 outline-none transition-all"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
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
            <span>I agree to receive free phonics resources by email. Unsubscribe any time.</span>
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
              <>Send Me My Free Book <ArrowRight size={20} /></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─── Yes path: email then redirect to Stripe ────────────────────── */

interface PaidCheckoutEmailProps {
  level: number;
  onBack: () => void;
}

function PaidCheckoutEmail({ level, onBack }: PaidCheckoutEmailProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = email.trim() && !loading;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError('');

    try {
      // Look up the full bundle product by slug-equivalent (product_type).
      // Cast through any because `products` isn't in the generated types yet.
      const { data: products, error: dbError } = await (supabase as unknown as {
        from: (t: string) => {
          select: (s: string) => {
            eq: (c: string, v: string) => {
              eq: (c: string, v: boolean) => {
                limit: (n: number) => Promise<{ data: { id: string }[] | null; error: { message: string } | null }>;
              };
            };
          };
        };
      })
        .from('products')
        .select('id')
        .eq('product_type', 'full_bundle')
        .eq('is_active', true)
        .limit(1);

      if (dbError) throw new Error(dbError.message);
      if (!products || products.length === 0) {
        throw new Error('Bundle product not found. Please contact support.');
      }
      const product_id = products[0].id;

      // Create the checkout session. The webhook on payment success will
      // create the user account from guest_email and unlock the bundle.
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id,
            guest_email: email.trim(),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Could not start checkout');

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <form
        onSubmit={handleSubmit}
        className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl rounded-2xl p-6 sm:p-7"
      >
        <p className="text-lg font-extrabold text-foreground mb-1 text-center">
          Just one detail before checkout
        </p>
        <p className="text-xs text-muted-foreground mb-5 text-center">
          We'll email your login link straight after payment so all 32 books are yours.
        </p>

        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="w-full px-4 py-3.5 rounded-xl border-2 border-pink-200 bg-white text-foreground placeholder:text-muted-foreground focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-pink-500/10 outline-none transition-all"
            required
            autoFocus
          />

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-4 bg-gradient-to-r from-[hsl(var(--primary))] to-rose-500 text-white font-bold text-base rounded-xl shadow-lg shadow-pink-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>Continue to Checkout <ArrowRight size={20} /></>
            )}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>
        </div>
        {/* level is held by the caller for the celebration accent; we don't
            need to pass it to checkout — full bundle unlocks all 6 levels. */}
        <input type="hidden" value={level} readOnly />
      </form>
    </div>
  );
}
