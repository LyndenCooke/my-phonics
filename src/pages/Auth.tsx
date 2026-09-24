import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authErrorMessage } from '@/lib/authErrors';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { markSupportPromptPending } from '@/lib/support';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation, Trans } from 'react-i18next';

type Mode = 'signin' | 'signup' | 'forgot';

export default function Auth() {
  const [searchParams] = useSearchParams();
  // "Create a free account" buttons send ?mode=signup so a new parent lands
  // on the Create Account form, not "Welcome back! Sign In".
  const [mode, setMode] = useState<Mode>(() => (searchParams.get('mode') === 'signup' ? 'signup' : 'signin'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation('auth');
  // Where to land after a successful sign-in — e.g. the World of Books wizard
  // sends guests here with ?redirect=/create-book?resume=1&want=world so they
  // pick up right where they left off instead of losing their in-progress book.
  const redirectTo = searchParams.get('redirect') || '/library';

  // ── Google sign-in ───────────────────────────────────────────────────
  // Primary path is <GoogleSignInButton>: Google Identity Services on our
  // own origin, ID token exchanged with supabase.auth.signInWithIdToken.
  // The parent sees "continue to myphonicsbooks.co.uk", not the Supabase
  // project hostname. AuthContext still picks the session up through
  // onAuthStateChange, so nothing downstream changes.
  //
  // handleGoogleRedirect is the legacy fallback (Supabase-hosted OAuth
  // redirect). It runs when VITE_GOOGLE_CLIENT_ID is unset, on native
  // builds, or if the Google script fails to load. Requires the Google
  // provider to be enabled in the Supabase dashboard with redirect URLs set
  // to the production + preview Vercel domains.
  const handleGoogleRedirect = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}${redirectTo}` },
      });
      if (error) throw error;
      // signInWithOAuth redirects the page; we won't reach this line
      // unless something blocked the redirect.
    } catch (err) {
      toast({ title: t('toast.googleFailed'), description: authErrorMessage(err), variant: 'destructive' });
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) throw error;
        toast({ title: t('toast.checkEmail'), description: t('toast.resetSent') });
        setMode('signin');
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        // Show the one-time optional "support us" pop-up once they land
        // (SupportPrompt in Layout waits for a live session).
        markSupportPromptPending();
        toast({ title: t('toast.accountCreated'), description: t('toast.confirmEmail') });
        // If email confirmation is off, signUp already left us a live session
        // — carry on to redirectTo. If confirmation is required there's no
        // session yet, but this is harmless: the destination just shows its
        // normal signed-out state until they confirm and sign in.
        navigate(redirectTo);
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate(redirectTo);
      }
    } catch (err) {
      toast({ title: t('toast.error'), description: authErrorMessage(err), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative">
      {/* Top-start back arrow — always a way out of the auth screen */}
      <Link
        to="/"
        className="absolute top-4 start-4 flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg"
        aria-label={t('page.backToHome')}
      >
        <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" /> {t('page.back')}
      </Link>
      {/* Language first, so a parent can switch before signing up */}
      <div className="absolute top-4 end-4">
        <LanguageSwitcher variant="compact" />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo (clickable — returns to landing) */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block hover:opacity-80 transition-opacity" aria-label={t('page.homeAria')}>
            <img src="/logo/mpb-mark-transparent.png" alt="" className="w-20 h-20 object-contain mx-auto mb-2" draggable={false} />
            <h1 dir="ltr" className="font-display text-2xl font-extrabold text-foreground tracking-tight">
              My<span className="text-primary-ink">Phonics</span>Books
            </h1>
          </Link>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === 'signin' ? t('page.welcomeBack') : mode === 'signup' ? t('page.createYourAccount') : t('page.resetYourPassword')}
          </p>

          {/* Trust strip — indigo accent, brand "we handle your data with care" voice. */}
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-trust-tint text-trust-ink text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            {t('page.trust')}
          </div>
        </div>

        {/* ── Google sign-in (above the email/password form because OAuth
         *  is faster for most parents — fewer passwords to remember). */}
        {mode !== 'forgot' && (
          <>
            <GoogleSignInButton
              disabled={submitting}
              onFallback={handleGoogleRedirect}
              onSignedIn={() => navigate(redirectTo)}
              onError={(message) => toast({ title: t('toast.googleFailed'), description: message, variant: 'destructive' })}
            />

            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">{t('page.orUseEmail')}</span></div>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="relative">
              <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('page.fullName')}
                aria-label={t('page.fullName')}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full ps-10 pe-4 py-3 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              placeholder={t('page.email')}
              aria-label={t('page.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full ps-10 pe-4 py-3 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          {mode !== 'forgot' && (
            <div className="relative">
              <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('page.password')}
                aria-label={t('page.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full ps-10 pe-10 py-3 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t('page.hidePassword') : t('page.showPassword')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          )}

          {mode === 'signin' && (
            <button type="button" onClick={() => setMode('forgot')} className="text-xs text-primary font-medium">
              {t('page.forgotPassword')}
            </button>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-button active:scale-[0.97] transition-transform duration-200 disabled:opacity-60"
          >
            {submitting
              ? t('page.pleaseWait')
              : mode === 'signin'
              ? t('page.signIn')
              : mode === 'signup'
              ? t('page.createAccount')
              : t('page.sendResetLink')}
          </button>

          {mode === 'signup' && (
            <p className="text-[11px] text-muted-foreground text-center">
              <Trans
                t={t}
                i18nKey="page.agree"
                components={{
                  terms: <a href="/terms" className="underline" />,
                  privacy: <a href="/privacy" className="underline" />,
                }}
              />
            </p>
          )}
        </form>

        <div className="text-center mt-6">
          {mode === 'forgot' ? (
            <button onClick={() => setMode('signin')} className="text-sm text-muted-foreground flex items-center gap-1 mx-auto">
              <ArrowLeft className="w-3 h-3 rtl:-scale-x-100" /> {t('page.backToSignIn')}
            </button>
          ) : (
            <p className="text-sm text-muted-foreground">
              {mode === 'signin' ? t('page.noAccount') : t('page.haveAccount')}{' '}
              <button
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-primary font-bold"
              >
                {mode === 'signin' ? t('page.signUp') : t('page.signIn')}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
