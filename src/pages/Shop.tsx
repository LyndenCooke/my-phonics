import { useState } from 'react';
import Layout from '@/components/Layout';
import { LEVELS } from '@/lib/types';
import { useProducts } from '@/hooks/useBooks';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Loader2 } from 'lucide-react';
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

const levelBgs: Record<number, string> = {
  1: 'bg-level-1', 2: 'bg-level-2', 3: 'bg-level-3',
  4: 'bg-level-4', 5: 'bg-level-5', 6: 'bg-level-6',
};

const badgeMap: Record<string, string | null> = {
  starter_bundle: 'Popular',
  full_bundle: 'Best Value',
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
        toast.success('Free sample books added to your library!');
        setGuestDialog({ open: false, productId: null });
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

  const handleGuestContinue = () => {
    if (!guestEmail || !guestEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!guestDialog.productId) return;
    setGuestLoading(true);
    handleCheckout(guestDialog.productId, guestEmail);
  };

  return (
    <Layout>
      <div className="px-4 pt-5 pb-8 max-w-lg mx-auto">
        <h2 className="text-2xl font-extrabold text-foreground mb-1 tracking-tight">Shop</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Choose the right pack for your child's reading journey.
        </p>

        <div className="grid grid-cols-3 gap-2.5 mb-8">
          {LEVELS.map((level) => (
            <div
              key={level.level}
              className={`${levelBgs[level.level]} text-white rounded-xl p-3 text-center shadow-card relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-black/10" />
              <div className="relative">
                <p className="text-xl font-extrabold">L{level.level}</p>
                <p className="text-[10px] font-medium opacity-90 leading-tight mt-0.5">{level.name}</p>
              </div>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {(products ?? []).map((product) => {
              const badge = badgeMap[product.product_type] ?? null;
              const featured = product.product_type === 'starter_bundle' || product.product_type === 'full_bundle';
              const isFree = product.product_type === 'free_sample';
              const isSub = product.product_type === 'subscription';
              const isLoading = checkoutLoading === product.id;

              return (
                <div
                  key={product.id}
                  className={`rounded-xl p-4 transition-all duration-200 shadow-card ${
                    featured ? 'border-2 border-primary bg-tint-pink' : 'border border-border bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-foreground">{product.name}</h3>
                        {badge && (
                          <span className="text-[10px] gradient-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold shadow-sm">
                            {badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <BookOpen className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {isSub ? 'All books' : `Levels ${product.levels_included.join(', ')}`}
                        </span>
                      </div>
                    </div>
                    <span className="text-xl font-extrabold text-foreground whitespace-nowrap ml-3">
                      {isSub ? `${formatPrice(product.price_pence)}/mo` : formatPrice(product.price_pence)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleBuyClick(product.id)}
                    disabled={!!checkoutLoading}
                    className={`w-full py-3 rounded-lg font-bold text-sm transition-all duration-200 active:scale-[0.97] disabled:opacity-60 ${
                      isFree
                        ? 'bg-card border-2 border-primary text-primary'
                        : 'gradient-primary text-primary-foreground shadow-button'
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : isFree ? 'Get Free Sample' : 'Buy Now'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
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
              className="w-full py-3 rounded-xl font-bold text-sm gradient-primary text-primary-foreground shadow-button transition-all duration-200 active:scale-[0.97]"
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
