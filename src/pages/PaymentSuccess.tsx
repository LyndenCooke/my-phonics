import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { CheckCircle, BookOpen, ArrowRight, Loader2, Smartphone } from 'lucide-react';
import { hapticSuccess } from '@/lib/native';
import AddToHomeScreenPrompt from '@/components/AddToHomeScreenPrompt';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sessionId = searchParams.get('session_id');

  // Webhook latency: Stripe fires checkout.session.completed within a few
  // seconds of payment, but the browser hits this page first. Poll the
  // purchases query until it shows the new row, so the UI reflects
  // membership immediately rather than after a manual refresh.
  const [unlocking, setUnlocking] = useState(true);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (!user) { setUnlocking(false); return; }

    let cancelled = false;
    let attempts = 0;
    const poll = async () => {
      attempts += 1;
      // Force a fresh fetch of all the membership-relevant caches
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['purchases'] }),
        queryClient.invalidateQueries({ queryKey: ['user_books'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
      ]);
      const data: any = queryClient.getQueryData(['purchases', user.id]);
      if (cancelled) return;
      if (data?.hasAnyPaid) {
        setUnlocking(false);
        hapticSuccess();
        return;
      }
      // Stop polling after 30s — webhook may have failed; let user proceed
      // anyway, books will appear when they refresh later.
      if (Date.now() - startedAt.current > 30_000) {
        setUnlocking(false);
        return;
      }
      // Backoff: 1s for first 5 tries, then 3s
      setTimeout(poll, attempts < 5 ? 1000 : 3000);
    };
    poll();
    return () => { cancelled = true; };
  }, [user, queryClient]);

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
          <button
            onClick={() => navigate('/library')}
            className="w-full py-3.5 rounded-xl font-bold text-sm gradient-primary text-primary-foreground shadow-button transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2 press-scale"
          >
            <BookOpen className="w-4 h-4" />
            Open My Library
          </button>
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
