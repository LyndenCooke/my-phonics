import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useProducts, usePurchases } from '@/hooks/useBooks';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Check, Crown, Ticket, Sparkles, Lock, Star, Heart, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/** Sticker shadow — shared "paper & stickers" token. */
const STICKER = '0 1px 2px rgba(40,30,40,0.10), 0 8px 20px rgba(40,30,40,0.10)';

/** Tiny Wall-of-Love teaser under the plans — real consented quotes only. */
function LoveTeaser() {
  const [quotes, setQuotes] = useState<{ id: string; quote: string; first_name: string | null; rating: number | null }[]>([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await (supabase as unknown as {
        from: (t: string) => {
          select: (c: string) => { order: (k: string, o: { ascending: boolean }) => { limit: (n: number) => Promise<{ data: { id: string; quote: string; first_name: string | null; rating: number | null }[] | null }> } };
        };
      })
        .from('public_testimonials')
        .select('id, quote, first_name, rating')
        .order('submitted_at', { ascending: false })
        .limit(3);
      if (alive) setQuotes(data ?? []);
    })();
    return () => { alive = false; };
  }, []);

  if (quotes.length === 0) return null;
  return (
    <section className="mt-10">
      <div className="grid sm:grid-cols-3 gap-3">
        {quotes.map((q, i) => (
          <figure
            key={q.id}
            className="rounded-3xl bg-white p-4"
            style={{ boxShadow: STICKER, border: '1px solid rgba(40,30,40,0.05)', rotate: `${[-1, 0.8, -0.6][i]}deg` }}
          >
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} className={`w-3.5 h-3.5 ${(q.rating ?? 5) >= n ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/25'}`} />
              ))}
            </div>
            <blockquote className="text-[13px] text-foreground leading-relaxed mt-2 line-clamp-3">“{q.quote}”</blockquote>
            <figcaption className="text-xs font-display font-extrabold text-primary-ink mt-2">— {q.first_name ?? 'A parent'}</figcaption>
          </figure>
        ))}
      </div>
      <div className="text-center mt-5">
        <Link
          to="/love"
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-display font-extrabold text-primary-ink press-scale"
          style={{ boxShadow: STICKER }}
        >
          <Heart className="w-4 h-4 fill-current" /> Read our Wall of Love <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getStoredRefCode } from '@/lib/referral';
import PartnerCodeField from '@/components/PartnerCodeField';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

// Survives the /auth redirect so the visitor can pick the voucher flow
// back up after signing in or creating an account. sessionStorage rather
// than localStorage so it auto-clears with the tab if they abandon.
const PENDING_VOUCHER_KEY = 'mpb_pending_voucher';

type RedeemVoucherResponse =
  | { ok: true; product_type: string; code: string; label: string }
  | { ok: false; reason: string };

function reasonToMessage(reason: string): string {
  switch (reason) {
    case 'auth_required': return 'Please sign in to redeem your voucher.';
    case 'invalid_or_expired': return 'That code is not valid or has expired.';
    case 'product_not_found': return 'This voucher can\'t be redeemed right now — please contact support.';
    default: return 'Something went wrong. Please try again.';
  }
}

// All books, everything — features shared by both the monthly/annual sub
// card and the lifetime card. The lifetime card appends "future books".
const SUB_FEATURES = [
  'All 33 books across 8 levels — downloadable',
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
  const queryClient = useQueryClient();
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

  const redeemForSignedInUser = async (code: string): Promise<boolean> => {
    const { data, error } = await (supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: RedeemVoucherResponse | null; error: unknown }>)('redeem_voucher_for_user', {
      p_code: code,
    });
    if (error || !data) {
      setVoucherError('Something went wrong. Please try again.');
      return false;
    }
    if (!data.ok) {
      setVoucherError(reasonToMessage(data.reason));
      return false;
    }
    // Refresh both the purchases flag (gates the Pricing cards / nav)
    // and the per-book unlock state in the library.
    await queryClient.invalidateQueries({ queryKey: ['purchases'] });
    await queryClient.invalidateQueries({ queryKey: ['user_books'] });
    toast.success('Library unlocked — welcome!');
    setVoucherDialogOpen(false);
    navigate('/library', { replace: true });
    return true;
  };

  const handleRedeemVoucher = async () => {
    const trimmed = voucher.trim();
    if (!trimmed) {
      setVoucherError('Please enter your code.');
      return;
    }
    setVoucherLoading(true);
    setVoucherError(null);

    // Signed-out path: stash the code and bounce to /auth. The post-auth
    // useEffect below picks it back up and finishes the redemption.
    if (!user) {
      try { sessionStorage.setItem(PENDING_VOUCHER_KEY, trimmed); } catch { /* ignore */ }
      setVoucherLoading(false);
      setVoucherDialogOpen(false);
      toast.info('Create an account to claim your voucher.');
      navigate('/auth', { state: { returnTo: '/pricing', tab: 'register' } });
      return;
    }

    await redeemForSignedInUser(trimmed);
    setVoucherLoading(false);
  };

  // After the visitor signs in / signs up, finish the voucher redemption
  // they started. The code lives in sessionStorage from the moment they
  // pressed Apply while signed out; clearing it whether we succeed or
  // fail so a stale code can't haunt later visits.
  useEffect(() => {
    if (!user) return;
    let pending: string | null = null;
    try { pending = sessionStorage.getItem(PENDING_VOUCHER_KEY); } catch { /* ignore */ }
    if (!pending) return;
    try { sessionStorage.removeItem(PENDING_VOUCHER_KEY); } catch { /* ignore */ }
    setVoucher(pending);
    setVoucherDialogOpen(true);
    void redeemForSignedInUser(pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // "Get Started" on the Lifetime card opens the voucher prompt first. If
  // the buyer doesn't have a code, "Skip" continues to Stripe Checkout.
  const handleLifetimeClick = () => {
    setVoucher('');
    setVoucherError(null);
    setVoucherDialogOpen(true);
  };

  const handleLifetimeSkipToCheckout = () => {
    if (!lifetime) return;
    setVoucherDialogOpen(false);
    handleBuyClick(lifetime.id);
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

  // Subscription card has a Monthly/Yearly toggle. Default to Monthly so the
  // cheapest headline price (£4.99) is what the visitor sees first — they
  // can flip to Yearly to compare.
  const [subCadence, setSubCadence] = useState<'month' | 'year'>('month');
  const activeSub = subCadence === 'month' ? monthly : annual;

  // Voucher dialog is opened from the Lifetime "Get Started" click — sits
  // between the click and the Stripe redirect so voucher holders (friends,
  // family, affiliates) can enter the code without ever paying. Skipping
  // sends them straight to Stripe Checkout for the £39 charge.
  const [voucherDialogOpen, setVoucherDialogOpen] = useState(false);

  // What plan is the signed-in user already on? Drives the "Current plan"
  // panel at the top of the page.
  const currentPlan: 'lifetime' | 'subscriber' | 'free' =
    purchases?.hasFullBundle ? 'lifetime' :
    purchases?.hasActiveSubscription ? 'subscriber' : 'free';

  return (
    <Layout>
      <div className="px-4 lg:px-8 pt-5 pb-8 max-w-lg lg:max-w-5xl mx-auto">
        {/* Header — "paper & stickers" language shared with Home/Library. */}
        <div className="text-center mb-9 px-2">
          <span
            className="inline-block rounded-full bg-white px-4 py-1.5 text-xs font-extrabold rotate-1 text-primary-ink"
            style={{ boxShadow: STICKER, border: '2px solid #fff', outline: '2px solid #E84B8A30' }}
          >
            Simple pricing · cancel anytime
          </span>
          <h1 className="font-display text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight leading-tight mt-4">
            One plan. Every book.
          </h1>
          <p className="text-sm lg:text-base text-muted-foreground mt-2 leading-relaxed">
            All 33 books, eight levels, every worksheet and assessment.
          </p>
        </div>

        {/* Partner / discount code entry — a code from a poster gives the
         *  customer their discount and credits the partner at checkout. */}
        <PartnerCodeField />

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
          <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-5">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-5 lg:items-start">
            {/* Subscription card — Monthly / Yearly toggle inside one card.
             *  Same feature list either way; only the price + cadence
             *  suffix change. */}
            {monthly && annual && !purchases?.hasActiveSubscription && !purchases?.hasFullBundle && (
              <div className="rounded-[2rem] bg-white" style={{ boxShadow: STICKER, border: '1px solid rgba(40,30,40,0.06)' }}>
                <div className="px-5 pt-5 lg:px-6 lg:pt-6">
                  <div className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ background: '#E84B8A', boxShadow: '0 6px 14px -4px #E84B8A80' }}>
                      <Sparkles className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-display font-extrabold text-lg text-foreground leading-tight">All books, everything</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Read, download, repeat.</p>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4 lg:px-6">
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
                    <span className="font-display text-4xl font-extrabold text-foreground tabular-nums">
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
                    className="w-full h-13 py-3.5 rounded-2xl font-display font-extrabold text-base text-white transition-all active:translate-y-[4px] disabled:opacity-60"
                    style={{ background: '#E84B8A', boxShadow: '0 5px 0 #BE1862, 0 14px 28px -10px #E84B8A80' }}
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
              <div
                className="relative rounded-[2rem] bg-white"
                style={{ boxShadow: STICKER, border: '2px solid #4F46E5', outline: '4px solid #4F46E520' }}
              >
                {/* Best Value sticker */}
                <span
                  className="absolute -top-3 right-5 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold rotate-2 text-indigo-700"
                  style={{ boxShadow: STICKER, border: '2px solid #fff', outline: '2px solid #4F46E540' }}
                >
                  Best value
                </span>

                <div className="px-5 pt-5 lg:px-6 lg:pt-6">
                  <div className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ background: '#4F46E5', boxShadow: '0 6px 14px -4px #4F46E580' }}>
                      <Crown className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-display font-extrabold text-lg text-foreground leading-tight">Lifetime — everything forever</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Pay once. Every book, now and in the future.</p>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4 lg:px-6">
                  <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                    <span className="font-display text-4xl font-extrabold text-foreground tabular-nums">
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
                    onClick={handleLifetimeClick}
                    disabled={!!checkoutLoading}
                    className="w-full h-13 py-3.5 rounded-2xl font-display font-extrabold text-base text-white transition-all active:translate-y-[4px] disabled:opacity-60"
                    style={{ background: '#4F46E5', boxShadow: '0 5px 0 #3730A3, 0 14px 28px -10px #4F46E580' }}
                  >
                    {checkoutLoading === lifetime.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      'Get Started'
                    )}
                  </button>
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

        {/* Social proof — real quotes + link to the Wall of Love */}
        <LoveTeaser />

        <p className="text-xs text-muted-foreground text-center mt-8 leading-relaxed">
          Secure checkout. Cancel anytime. All prices in GBP.
        </p>
      </div>

      {/* Voucher prompt — opens when "Get Started" is pressed on the
       *  Lifetime card. Valid code redeems via redeem_voucher_for_user
       *  (requires signup) and grants the full_bundle product to the
       *  user's account. Skip → continue to Stripe Checkout for £39. */}
      <Dialog open={voucherDialogOpen} onOpenChange={setVoucherDialogOpen}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Have a voucher code?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {user
                ? 'Pop it in below to unlock everything free. No code? Skip to checkout.'
                : 'Enter your code and we\'ll send you to sign up. Your account will unlock as soon as you confirm.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Ticket className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
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
                  autoFocus
                  className="rounded-xl pl-9 h-11 font-mono text-sm font-bold tracking-wider uppercase"
                  disabled={voucherLoading}
                />
              </div>
              <button
                onClick={handleRedeemVoucher}
                disabled={voucherLoading || !voucher.trim()}
                className="h-11 px-5 rounded-xl font-bold text-sm bg-foreground text-background shadow-button active:scale-[0.97] transition-transform disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {voucherLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
              </button>
            </div>
            {voucherError && (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {voucherError}
              </p>
            )}

            <button
              onClick={handleLifetimeSkipToCheckout}
              disabled={voucherLoading || !!checkoutLoading}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg active:scale-[0.97] transition-transform disabled:opacity-60"
            >
              No code — continue to checkout ({lifetime ? formatPrice(lifetime.price_pence) : ''})
            </button>
          </div>
        </DialogContent>
      </Dialog>

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
                navigate('/auth', { state: { returnTo: '/pricing' } });
              }}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg transition-all duration-200 active:scale-[0.97]"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setGuestDialog({ open: false, productId: null });
                navigate('/auth', { state: { returnTo: '/pricing', tab: 'register' } });
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
