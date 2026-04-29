import { useState } from 'react';
import Layout from '@/components/Layout';
import { useProducts, usePurchases } from '@/hooks/useBooks';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Loader2, Check, Star, Zap, Crown, Gift, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getStoredRefCode } from '@/lib/referral';
import { useCountdown, isFoundersClubActive } from '@/lib/foundersClub';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const PRODUCT_CONFIG: Record<string, {
  icon: typeof Star;
  gradient: string;
  badge?: string;
  features: string[];
}> = {
  free_sample: {
    icon: Gift,
    gradient: 'from-emerald-500 to-green-600',
    features: [
      'Free phonics assessment',
      '1 book at your child\'s level',
      'Progress tracking',
    ],
  },
  founders_club: {
    icon: Sparkles,
    gradient: 'from-pink-500 via-fuchsia-500 to-violet-600',
    badge: '£1 Limited',
    features: [
      'Lifetime access to all 33 books',
      'Every assessment & progress report',
      'All future books included',
      'For our first 1,000 founding families',
    ],
  },
  full_bundle: {
    icon: Crown,
    // Brand-trust gradient (indigo -> violet) — our premium, forever-yours tier.
    gradient: 'from-indigo-600 to-violet-600',
    badge: 'Best Value',
    features: [
      'All 33 books across 6 levels',
      'Yours forever — no expiry',
      'All assessments & tracking',
      'Future books included',
    ],
  },
  subscription: {
    icon: Zap,
    gradient: 'from-violet-500 to-purple-600',
    badge: '7-Day Free Trial',
    features: [
      'All 33 books, all levels',
      'New books as they launch',
      'Full assessment suite',
      'Cancel anytime',
    ],
  },
  subscription_annual: {
    icon: Star,
    gradient: 'from-pink-500 to-rose-600',
    badge: 'Launch Deal',
    features: [
      'Everything in monthly',
      'Price locked forever',
      'Save over 30% vs monthly',
      'Best for serious readers',
    ],
  },
};

export default function Shop() {
  const { data: products, isLoading } = useProducts();
  const { data: purchases } = usePurchases();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [guestDialog, setGuestDialog] = useState<{ open: boolean; productId: string | null }>({ open: false, productId: null });
  const [guestEmail, setGuestEmail] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);
  // Founders Club has terms attached: Founders commit to sharing feedback
  // at 24h and 1 week. Block the CTA until the box is ticked so nobody
  // joins without realising it's a feedback-loop programme, not just a
  // discount.
  const [foundersTermsAccepted, setFoundersTermsAccepted] = useState(false);

  const formatPrice = (pence: number) => {
    if (pence === 0) return 'Free';
    return `£${(pence / 100).toFixed(2)}`;
  };

  const handleCheckout = async (productId: string, guestEmailOverride?: string) => {
    const loadingKey = guestEmailOverride ? 'guest' : productId;
    setCheckoutLoading(loadingKey);
    try {
      const body: Record<string, string> = { product_id: productId };
      if (guestEmailOverride) {
        body.guest_email = guestEmailOverride;
      }
      // Attach affiliate ref code if the visitor came in via a /?ref=CODE
      // share link. The webhook reads this from Stripe metadata and credits
      // the referrer when the purchase completes.
      const ref = getStoredRefCode();
      if (ref) body.ref_code = ref;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const session = (await supabase.auth.getSession()).data.session;
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        { method: 'POST', headers, body: JSON.stringify(body) }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      if (data.free) {
        toast.success(`Free book unlocked at Level ${data.level}!`);
        setGuestDialog({ open: false, productId: null });
        navigate('/');
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setCheckoutLoading(null);
      setGuestLoading(false);
    }
  };

  const handleBuyClick = (productId: string, productType: string) => {
    // Free sample requires auth + assessment
    if (productType === 'free_sample') {
      if (!user) {
        navigate('/auth', { state: { returnTo: '/assess' } });
        return;
      }
      handleCheckout(productId);
      return;
    }

    if (user) {
      handleCheckout(productId);
    } else {
      setGuestDialog({ open: true, productId });
      setGuestEmail('');
    }
  };

  const handleGuestContinue = () => {
    if (!guestEmail || !guestEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!guestDialog.productId) return;
    setGuestLoading(true);
    handleCheckout(guestDialog.productId, guestEmail);
  };

  // Sort: founders_club FIRST while the offer is live (most urgent),
  // then free_sample, full_bundle, subscriptions. Once the offer expires
  // we drop founders_club to the end so it visually de-prioritises if it
  // somehow stays active in the DB.
  const foundersFirst = isFoundersClubActive();
  const sortOrder = foundersFirst
    ? ['founders_club', 'free_sample', 'full_bundle', 'subscription', 'subscription_annual']
    : ['free_sample', 'full_bundle', 'subscription', 'subscription_annual', 'founders_club'];
  const visibleProducts = (products ?? []).filter((p) => {
    // Hide founders_club once expired
    if (p.product_type === 'founders_club' && !foundersFirst) return false;
    // Hide founders_club / bundle / subscriptions to users who already own
    // them — no point showing "Buy Founders Club" to a Founder.
    if (purchases?.hasFoundersClub && p.product_type === 'founders_club') return false;
    if (purchases?.hasFullBundle && p.product_type === 'full_bundle') return false;
    if (purchases?.hasActiveSubscription && (p.product_type === 'subscription' || p.product_type === 'subscription_annual')) return false;
    return true;
  });
  const sortedProducts = [...visibleProducts].sort(
    (a, b) => sortOrder.indexOf(a.product_type) - sortOrder.indexOf(b.product_type)
  );

  return (
    <Layout>
      <div className="px-4 pt-5 pb-8 max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl font-extrabold text-foreground tracking-tight">Choose Your Plan</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Every plan includes assessments, progress tracking & development reports.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedProducts.map((product) => {
              const config = PRODUCT_CONFIG[product.product_type];
              if (!config) return null;

              const Icon = config.icon;
              const isFree = product.product_type === 'free_sample';
              const isSub = product.product_type === 'subscription';
              const isAnnual = product.product_type === 'subscription_annual';
              const isBundle = product.product_type === 'full_bundle';
              const isFounders = product.product_type === 'founders_club';
              const loading = checkoutLoading === product.id;

              return (
                <div
                  key={product.id}
                  className={`rounded-2xl overflow-hidden transition-all duration-200 shadow-card ${
                    isFounders ? 'ring-2 ring-fuchsia-500' : isBundle ? 'ring-2 ring-indigo-500' : 'border border-border'
                  }`}
                >
                  {/* Header */}
                  <div className={`bg-gradient-to-r ${config.gradient} px-5 py-4 text-white`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-5 h-5" />
                        <h3 className="font-bold text-lg">{product.name}</h3>
                      </div>
                      {config.badge && (
                        <span className="text-[11px] bg-white/25 backdrop-blur-sm px-2.5 py-1 rounded-full font-bold">
                          {config.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/85 mt-1">{product.description}</p>
                  </div>

                  {/* Body */}
                  <div className="bg-card px-5 py-4">
                    {/* Price — Founders Club shows the regular £99 lifetime
                     *  price struck through next to the £1 to make the
                     *  saving visible at a glance. */}
                    <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                      <span className="text-3xl font-extrabold text-foreground">
                        {formatPrice(product.price_pence)}
                      </span>
                      {isSub && <span className="text-sm text-muted-foreground">/month</span>}
                      {isAnnual && <span className="text-sm text-muted-foreground">/year</span>}
                      {isBundle && <span className="text-sm text-muted-foreground">one-time</span>}
                      {isFounders && (
                        <>
                          <span className="text-lg text-muted-foreground line-through tabular-nums">£99</span>
                          <span className="text-xs font-extrabold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">SAVE £98</span>
                        </>
                      )}
                    </div>
                    {isFounders && (
                      <p className="text-xs text-muted-foreground mb-3">Lifetime access · normally £99</p>
                    )}
                    {!isFounders && <div className="mb-3" />}

                    {/* Monthly equivalent for annual */}
                    {isAnnual && (
                      <p className="text-xs text-muted-foreground -mt-2 mb-3">
                        That's just {formatPrice(Math.round(product.price_pence / 12))}/month
                      </p>
                    )}

                    {/* Live countdown on the founders card */}
                    {isFounders && (
                      <FoundersCountdownLine />
                    )}

                    {/* Features */}
                    <ul className="space-y-2 mb-4">
                      {config.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                          <Check className="w-4 h-4 text-green-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {/* Founders Club T&Cs — must agree to share reviews
                     *  at 24h and 1 week. The Founders programme is a
                     *  feedback loop, not a deep discount. Be explicit. */}
                    {isFounders && (
                      <label className="flex items-start gap-2.5 mb-4 p-3 rounded-xl bg-fuchsia-50 border border-fuchsia-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={foundersTermsAccepted}
                          onChange={(e) => setFoundersTermsAccepted(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded border-fuchsia-300 text-fuchsia-600 focus:ring-fuchsia-300 shrink-0"
                        />
                        <span className="text-[11px] leading-relaxed text-foreground">
                          I'm joining as a Founder and agree to share <strong>two short reviews</strong> — one at 24 hours, one after a week — so the team can fix bugs and improve the app. Reviews are private unless I explicitly opt in to marketing on the form.
                        </span>
                      </label>
                    )}

                    {/* CTA */}
                    <button
                      onClick={() => handleBuyClick(product.id, product.product_type)}
                      disabled={!!checkoutLoading || (isFounders && !foundersTermsAccepted)}
                      className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.97] disabled:opacity-60 ${
                        isFree
                          ? 'bg-card border-2 border-emerald-600 text-emerald-700'
                          : `bg-gradient-to-r ${config.gradient} text-white shadow-lg`
                      }`}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      ) : isFree ? (
                        'Get Free Book'
                      ) : isSub ? (
                        'Start Free Trial'
                      ) : isFounders ? (
                        'Claim my £1 spot'
                      ) : (
                        'Get Started'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center mt-6">
          All prices in GBP. Subscriptions can be cancelled anytime from your profile.
        </p>
      </div>

      {/* Guest checkout dialog */}
      <Dialog open={guestDialog.open} onOpenChange={(open) => setGuestDialog({ open, productId: open ? guestDialog.productId : null })}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">How would you like to continue?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Sign in for the best experience, or continue as a guest.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => {
                setGuestDialog({ open: false, productId: null });
                navigate('/auth', { state: { returnTo: '/shop' } });
              }}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg transition-all duration-200 active:scale-[0.97]"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setGuestDialog({ open: false, productId: null });
                navigate('/auth', { state: { returnTo: '/shop', tab: 'register' } });
              }}
              className="w-full py-3 rounded-xl font-bold text-sm border-2 border-primary text-primary bg-card transition-all duration-200 active:scale-[0.97]"
            >
              Create Account
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 text-xs text-muted-foreground">or</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Continue as guest</label>
              <Input
                type="email"
                placeholder="Your email address"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGuestContinue()}
                className="rounded-xl"
              />
              <p className="text-[11px] text-muted-foreground">
                We'll create an account for you after purchase so you can access your books.
                By continuing you agree to our{' '}
                <a href="/terms" className="underline">Terms</a> and{' '}
                <a href="/privacy" className="underline">Privacy Policy</a>.
              </p>
              <button
                onClick={handleGuestContinue}
                disabled={guestLoading || !guestEmail}
                className="w-full py-3 rounded-xl font-bold text-sm bg-muted text-foreground transition-all duration-200 active:scale-[0.97] disabled:opacity-60"
              >
                {guestLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : 'Continue to Payment'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function FoundersCountdownLine() {
  const c = useCountdown();
  if (c.expired) return null;
  return (
    <p className="text-xs font-bold text-fuchsia-700 -mt-2 mb-3 tabular-nums">
      ⏳ Ends in {c.days}d {c.hours}h {c.minutes}m {String(c.seconds).padStart(2, '0')}s
    </p>
  );
}
