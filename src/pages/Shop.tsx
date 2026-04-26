import { useState } from 'react';
import Layout from '@/components/Layout';
import { useProducts } from '@/hooks/useBooks';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Loader2, Check, Star, Zap, Crown, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [guestDialog, setGuestDialog] = useState<{ open: boolean; productId: string | null }>({ open: false, productId: null });
  const [guestEmail, setGuestEmail] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);

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

  // Sort: free_sample first, then full_bundle, subscription, subscription_annual
  const sortOrder = ['free_sample', 'full_bundle', 'subscription', 'subscription_annual'];
  const sortedProducts = [...(products ?? [])].sort(
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
              const loading = checkoutLoading === product.id;

              return (
                <div
                  key={product.id}
                  className={`rounded-2xl overflow-hidden transition-all duration-200 shadow-card ${
                    isBundle ? 'ring-2 ring-indigo-500' : 'border border-border'
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
                    {/* Price */}
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-3xl font-extrabold text-foreground">
                        {formatPrice(product.price_pence)}
                      </span>
                      {isSub && <span className="text-sm text-muted-foreground">/month</span>}
                      {isAnnual && <span className="text-sm text-muted-foreground">/year</span>}
                      {isBundle && <span className="text-sm text-muted-foreground">one-time</span>}
                    </div>

                    {/* Monthly equivalent for annual */}
                    {isAnnual && (
                      <p className="text-xs text-muted-foreground -mt-2 mb-3">
                        That's just {formatPrice(Math.round(product.price_pence / 12))}/month
                      </p>
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

                    {/* CTA */}
                    <button
                      onClick={() => handleBuyClick(product.id, product.product_type)}
                      disabled={!!checkoutLoading}
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
