import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { CheckCircle, BookOpen, ArrowRight, Loader2, Heart } from 'lucide-react';
import { hapticSuccess } from '@/lib/native';
import { supabase } from '@/integrations/supabase/client';
import AddToHomeScreenPrompt from '@/components/AddToHomeScreenPrompt';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sessionId = searchParams.get('session_id');
  // ?support=1 — a pay-what-you-like thank-you, not a purchase that unlocks
  // anything. Skip the unlock polling and just say thank you.
  const isSupport = searchParams.get('support') === '1';

  // Webhook latency: Stripe fires checkout.session.completed within a few
  // seconds of payment, but the browser hits this page first. Poll the
  // purchases query until it shows the new row, so the UI reflects
  // membership immediately rather than after a manual refresh.
  const [unlocking, setUnlocking] = useState(true);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (!user || isSupport) { setUnlocking(false); return; }

    let cancelled = false;
    let attempts = 0;

    // Self-heal: even if the Stripe webhook ran fine, ALSO call the
    // ensure_my_books_unlocked() RPC. It's idempotent and scoped to the
    // caller's own completed purchases, so calling it on every success-
    // page load guarantees their books are present regardless of whether
    // the webhook unlocked them, partially unlocked them, or failed
    // outright. Without this, founders occasionally see "Ready!" but
    // their library is empty and we get support emails.
    const selfHeal = async () => {
      try {
        const { data: insertedCount, error } = await (supabase.rpc as unknown as (fn: string) => Promise<{ data: number | null; error: unknown }>)('ensure_my_books_unlocked');
        if (error) {
          console.warn('ensure_my_books_unlocked failed (non-fatal):', error);
          return;
        }
        if (typeof insertedCount === 'number' && insertedCount > 0) {
          // Force the user_books query to refetch so the library reflects
          // the rows we just inserted.
          await queryClient.invalidateQueries({ queryKey: ['user_books'] });
        }
      } catch (err) {
        console.warn('ensure_my_books_unlocked threw (non-fatal):', err);
      }
    };
    selfHeal();

    const poll = async () => {
      attempts += 1;
      // Force a fresh fetch of all the membership-relevant caches
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['purchases'] }),
        queryClient.invalidateQueries({ queryKey: ['user_books'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
      ]);
      const data: any = queryClient.getQueryData(['purchases', user.id]);
      const userBooks: any = queryClient.getQueryData(['user_books', user.id]);
      if (cancelled) return;
      // Done when we see BOTH a purchase row AND at least one unlocked
      // book. Either alone isn't enough — that was the previous bug
      // (purchase row appeared, books stayed locked, page said "Ready").
      if (data?.hasAnyPaid && Array.isArray(userBooks) && userBooks.length > 0) {
        setUnlocking(false);
        hapticSuccess();
        return;
      }
      // Stop polling after 30s — fall back to user-tappable retry button.
      if (Date.now() - startedAt.current > 30_000) {
        setUnlocking(false);
        return;
      }
      // After ~10s with a purchase but no books, kick the self-heal RPC
      // again — the webhook may have just inserted the purchase row but
      // bailed before unlocking the books.
      if (attempts === 8 && data?.hasAnyPaid && (!userBooks || userBooks.length === 0)) {
        await selfHeal();
      }
      // Backoff: 1s for first 5 tries, then 3s
      setTimeout(poll, attempts < 5 ? 1000 : 3000);
    };
    poll();
    return () => { cancelled = true; };
  }, [user, queryClient, isSupport]);

  // Fallback button — if polling ended but books still aren't unlocked,
  // user can tap to retry the self-heal RPC manually.
  const [retrying, setRetrying] = useState(false);
  const handleRetry = async () => {
    setRetrying(true);
    try {
      await (supabase.rpc as unknown as (fn: string) => Promise<{ data: number | null; error: unknown }>)('ensure_my_books_unlocked');
      await queryClient.invalidateQueries({ queryKey: ['user_books'] });
      await queryClient.invalidateQueries({ queryKey: ['purchases'] });
    } finally {
      setRetrying(false);
    }
  };
  const userBooksData = queryClient.getQueryData<unknown[]>(['user_books', user?.id]);
  const showRetry = !unlocking && user && (!userBooksData || userBooksData.length === 0);

  if (isSupport) {
    return (
      <Layout>
        <div className="px-4 pt-12 pb-8 max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-tint-pink flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-primary fill-current" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-foreground mb-2">Thank you!</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Your support keeps every book, game and worksheet free for the next family.
            A receipt is on its way from Stripe.
          </p>
          <button
            onClick={() => navigate('/library')}
            className="w-full py-3.5 rounded-xl font-bold text-sm gradient-primary text-primary-foreground shadow-button transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2 press-scale"
          >
            <BookOpen className="w-4 h-4" />
            Back to the Library
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 pt-12 pb-8 max-w-lg mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          {unlocking ? (
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          ) : (
            <CheckCircle className="w-8 h-8 text-green-600" />
          )}
        </div>
        <h1 className="font-display text-2xl font-extrabold text-foreground mb-2">
          {unlocking ? 'Unlocking your books…' : 'You\'re in! 🎉'}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {unlocking
            ? 'This usually takes a few seconds — hang tight.'
            : user
            ? "All your books are unlocked and ready to read."
            : "We've sent you an email to set your password and access your books."}
        </p>

        {/* Add-to-Home-Screen prompt — fires when unlocking completes.
         *  This is the highest-leverage moment in the funnel: they just
         *  paid, motivation is sky-high, and one tap saves them from
         *  ever having to retype the URL. Hidden if already installed. */}
        {!unlocking && user && (
          <AddToHomeScreenPrompt />
        )}

        {!unlocking && (user ? (
          <div className="space-y-3">
            {showRetry && (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="w-full py-3 rounded-xl font-bold text-sm border-2 border-amber-400 bg-amber-50 text-amber-800 active:scale-[0.97] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {retrying ? 'Unlocking…' : 'Books not showing? Tap to unlock now'}
              </button>
            )}
            <button
              onClick={() => navigate('/library')}
              className="w-full py-3.5 rounded-xl font-bold text-sm gradient-primary text-primary-foreground shadow-button transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2 press-scale"
            >
              <BookOpen className="w-4 h-4" />
              Open My Library
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => navigate('/auth')}
              className="w-full py-3 rounded-xl font-bold text-sm gradient-primary text-primary-foreground shadow-button transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2"
            >
              Sign In to Access Books
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-xs text-muted-foreground">
              Check your email for a link to set your password.
            </p>
          </div>
        ))}
      </div>
    </Layout>
  );
}
