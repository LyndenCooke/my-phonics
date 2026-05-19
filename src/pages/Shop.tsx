import { useState } from 'react';
import Layout from '@/components/Layout';
import { useProducts, usePurchases } from '@/hooks/useBooks';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, Check, Crown, Ticket, Heart, Sparkles, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getStoredRefCode } from '@/lib/referral';
import { redeemTeacherCode } from '@/lib/teacherSession';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

// All books, everything — features shared by both the monthly/annual sub
// card and the lifetime card. The lifetime card appends "future books".
const SUB_FEATURES = [
  'All 33 books across 6 levels — downloadable',
  'Every printable worksheet',
  'All sound mats and TPT printables',
  'Full assessments and progress reports',
];

const LIFETIME_FEATURES = [
  ...SUB_FEATURES,
  'All future books included as we add them',
  'Yours forever — pay once',
];

// Free-tier entitlements shown in the "Current plan" card so signed-in
// visitors can see what they already have before deciding to upgrade.
const FREE_FEATURES = [
  '6 free books to read and download',
  '6 free worksheets',
  'Free sound mats and TPT printables',
  'Free phonics assessment',
];

export default function Shop() {
  const { data: products, isLoading } = useProducts();
  const { data: purchases } = usePurchases();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [guestDialog, setGuestDialog] = useState<{ open: boolean; productId: string | null }>({ open: false, productId: null });
  const [guestEmail, setGuestEmail] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);
  // Friends & family voucher — reuses the teacher_codes mechanism so a valid
  // code unlocks the whole library locally with no payment / signup.
  const [voucher, setVoucher] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);

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

  const handleBuyClick = (productId: string) => {
    if (user) {
      handleCheckout(productId);
    } else {
      setGuestDialog({ open: true, productId });
      setGuestEmail('');
    }
  };

  const handleRedeemVoucher = async () => {
    const trimmed = voucher.trim();
    if (!trimmed) {
      setVoucherError('Please enter your code.');
      return;
    }
    setVoucherLoading(true);
    setVoucherError(null);
    const result = await redeemTeacherCode(trimmed);
    setVoucherLoading(false);
    if (!result.ok) {
      setVoucherError(result.error);
      return;
    }
    toast.success('Library unlocked — welcome!');
    navigate('/library', { replace: true });
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

  // Lookup the three concrete products we render (monthly sub, annual sub,
  // and lifetime bundle). Prices come straight from the DB so updating
  // products.price_pence (matched to the Stripe price IDs) is the only
  // place a price change has to land.
  const monthly = products?.find((p) => p.product_type === 'subscription');
  const annual  = products?.find((p) => p.product_type === 'subscription_annual');
  const lifetime = products?.find((p) => p.product_type === 'full_bundle');

  // Subscription card has a Monthly/Yearly toggle. Default to Yearly so the
  // best-value option is the one the user sees first.
  const [subCadence, setSubCadence] = useState<'month' | 'year'>('year');
  const activeSub = subCadence === 'month' ? monthly : annual;

  // What plan is the signed-in user already on? Drives the "Current plan"
  // panel at the top of the page.
  const currentPlan: 'lifetime' | 'subscriber' | 'free' =
    purchases?.hasFullBundle ? 'lifetime' :
    purchases?.hasActiveSubscription ? 'subscriber' : 'free';

  return (
    <Layout>
      <div className="px-4 pt-5 pb-8 max-w-lg mx-auto">
        {/* Header — softer mobile-app style. Matches the new Profile/Home
         *  visual language: pink accent on key word, generous spacing. */}
        <div className="text-center mb-8 px-2">
          <h1 className="font-display text-3xl font-extrabold text-foreground tracking-tight leading-tight">
            Choose Your <span className="text-primary-ink">Plan</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Unlock all books, assessments and rewards.
          </p>
        </div>

        {/* Current plan — signed-in users see their entitlement status up
         *  top so they can tell at a glance what they already have before
         *  comparing the upgrade options below. */}
        {user && (
          <div className="mb-5 rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] uppercase tracking-wide font-bold text-muted-foreground">Current plan</p>
              <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                currentPlan === 'lifetime' ? 'bg-indigo-100 text-indigo-700' :
                currentPlan === 'subscriber' ? 'bg-emerald-100 text-emerald-700' :
                'bg-muted text-muted-foreground'
              }`}>
                {currentPlan === 'lifetime' ? 'Lifetime' :
                 currentPlan === 'subscriber' ? 'Subscriber' :
                 'Free account'}
              </span>
            </div>
            <p className="text-sm font-bold text-foreground mb-2">
              {currentPlan === 'lifetime' ? 'Everything unlocked — forever' :
               currentPlan === 'subscriber' ? 'All books and worksheets unlocked' :
               '6 books, 6 free worksheets'}
            </p>
            <ul className="space-y-1.5">
              {(currentPlan === 'free' ? FREE_FEATURES : LIFETIME_FEATURES).map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Subscription card — Monthly / Yearly toggle inside one card.
             *  Same feature list either way; only the price + cadence
             *  suffix change. */}
            {monthly && annual && !purchases?.hasActiveSubscription && !purchases?.hasFullBundle && (
              <div className="rounded-3xl overflow-hidden shadow-card border border-border">
                <div className="bg-gradient-to-r from-pink-500 to-rose-600 px-5 py-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-5 h-5" />
                      <h3 className="font-bold text-lg">All books, everything</h3>
                    </div>
                  </div>
                  <p className="text-sm text-white/85 mt-1">Every book, every worksheet — read, download, repeat.</p>
                </div>

                <div className="bg-card px-5 py-4">
                  {/* Cadence toggle */}
                  <div className="inline-flex rounded-xl border border-border bg-muted/30 p-1 mb-4">
                    <button
                      type="button"
                      onClick={() => setSubCadence('month')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        subCadence === 'month' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                      }`}
                      aria-pressed={subCadence === 'month'}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubCadence('year')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                        subCadence === 'year' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                      }`}
                      aria-pressed={subCadence === 'year'}
                    >
                      Yearly
                      <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">SAVE 50%</span>
                    </button>
                  </div>

                  <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                    <span className="text-3xl font-extrabold text-foreground">
                      {formatPrice(activeSub?.price_pence ?? 0)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {subCadence === 'month' ? '/month' : '/year'}
                    </span>
                  </div>
                  {subCadence === 'year' && annual && (
                    <p className="text-xs text-muted-foreground mb-3">
                      That's just {formatPrice(Math.round(annual.price_pence / 12))}/month, billed yearly
                    </p>
                  )}
                  {subCadence === 'month' && <div className="mb-3" />}

                  <ul className="space-y-2 mb-4">
                    {SUB_FEATURES.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => activeSub && handleBuyClick(activeSub.id)}
                    disabled={!!checkoutLoading || !activeSub}
                    className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.97] disabled:opacity-60 bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg"
                  >
                    {checkoutLoading === activeSub?.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      'Get Started'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Lifetime — one-off card with the friends & family voucher */}
            {lifetime && !purchases?.hasFullBundle && (
              <div className="rounded-3xl overflow-hidden shadow-card ring-2 ring-indigo-500">
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Crown className="w-5 h-5" />
                      <h3 className="font-bold text-lg">Lifetime — Everything Forever</h3>
                    </div>
                    <span className="text-[11px] bg-white/25 backdrop-blur-sm px-2.5 py-1 rounded-full font-bold">Best Value</span>
                  </div>
                  <p className="text-sm text-white/85 mt-1">Pay once. Every book — now and in the future.</p>
                </div>

                <div className="bg-card px-5 py-4">
                  <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                    <span className="text-3xl font-extrabold text-foreground">
                      {formatPrice(lifetime.price_pence)}
                    </span>
                    <span className="text-sm text-muted-foreground">one-time</span>
                  </div>
                  <div className="mb-3" />

                  <ul className="space-y-2 mb-4">
                    {LIFETIME_FEATURES.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleBuyClick(lifetime.id)}
                    disabled={!!checkoutLoading}
                    className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.97] disabled:opacity-60 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg"
                  >
                    {checkoutLoading === lifetime.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      'Get Started'
                    )}
                  </button>

                  {/* Friends & family voucher. Valid code (MYPHONICSFRIENDS)
                   *  bypasses Stripe and unlocks the library via the
                   *  teacher_codes session flow — no payment, no signup. */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Heart className="w-3.5 h-3.5 text-primary-ink" />
                      <p className="text-xs font-bold text-foreground">Got a friends & family code?</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
                      Enter it below and we'll unlock everything — free.
                    </p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Ticket className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                          type="text"
                          value={voucher}
                          onChange={(e) => { setVoucher(e.target.value.toUpperCase()); setVoucherError(null); }}
                          onKeyDown={(e) => e.key === 'Enter' && handleRedeemVoucher()}
                          placeholder="Enter code"
                          autoComplete="off"
                          autoCapitalize="characters"
                          autoCorrect="off"
                          spellCheck={false}
                          className="rounded-xl pl-8 h-10 font-mono text-sm font-bold tracking-wider uppercase"
                          disabled={voucherLoading}
                        />
                      </div>
                      <button
                        onClick={handleRedeemVoucher}
                        disabled={voucherLoading || !voucher.trim()}
                        className="h-10 px-4 rounded-xl font-bold text-xs bg-foreground text-background shadow-button active:scale-[0.97] transition-transform disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-1.5"
                      >
                        {voucherLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                      </button>
                    </div>
                    {voucherError && (
                      <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5 mt-2">
                        {voucherError}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Already on a paid plan — show a quiet confirmation card so
             *  the page isn't empty for upgraded users. */}
            {purchases?.hasFullBundle && (
              <div className="rounded-3xl border border-border bg-card p-5 text-center shadow-card">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 mb-2">
                  <Lock className="w-5 h-5" />
                </div>
                <p className="font-bold text-foreground">You're on Lifetime</p>
                <p className="text-xs text-muted-foreground mt-1">Every book, every worksheet, forever.</p>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center mt-6 leading-relaxed">
          Secure checkout. Cancel anytime. All prices in GBP.
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
