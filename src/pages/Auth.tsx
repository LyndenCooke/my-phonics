import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Mode = 'signin' | 'signup' | 'forgot';

export default function Auth() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // ── Google OAuth ─────────────────────────────────────────────────────
  // Supabase handles the redirect dance. Successful sign-in lands the user
  // back on /library where AuthContext picks up the session. Requires the
  // Google provider to be enabled in the Supabase dashboard with redirect
  // URLs set to the production + preview Vercel domains.
  const handleGoogle = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/library` },
      });
      if (error) throw error;
      // signInWithOAuth redirects the page; we won't reach this line
      // unless something blocked the redirect.
    } catch (err: any) {
      toast({ title: 'Google sign-in failed', description: err.message, variant: 'destructive' });
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
        toast({ title: 'Check your email', description: 'We sent you a password reset link.' });
        setMode('signin');
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        toast({ title: 'Account created!', description: 'Please check your email to confirm your account.' });
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate('/library');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative">
      {/* Top-left back arrow — always a way out of the auth screen */}
      <Link
        to="/"
        className="absolute top-4 left-4 flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg"
        aria-label="Back to home"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="w-full max-w-sm">
        {/* Logo (clickable — returns to landing) */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block hover:opacity-80 transition-opacity" aria-label="MyPhonicsBooks home">
            <img src="/logo/mpb-mark-transparent.png" alt="" className="w-20 h-20 object-contain mx-auto mb-2" draggable={false} />
            <h1 className="font-display text-2xl font-extrabold text-foreground tracking-tight">
              My<span className="text-primary-ink">Phonics</span>Books
            </h1>
          </Link>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === 'signin' ? 'Welcome back!' : mode === 'signup' ? 'Create your account' : 'Reset your password'}
          </p>

          {/* Trust strip — indigo accent, brand "we handle your data with care" voice. */}
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-trust-tint text-trust-ink text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Your family's data stays private
          </div>
        </div>

        {/* ── Google sign-in (above the email/password form because OAuth
         *  is faster for most parents — fewer passwords to remember). */}
        {mode !== 'forgot' && (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-white border-2 border-border hover:border-primary/40 text-foreground font-bold text-sm shadow-sm hover:shadow flex items-center justify-center gap-2.5 transition-all disabled:opacity-60"
            >
              {/* Google "G" mark — inline SVG to avoid an extra dep */}
              <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.61 20.08H42V20H24v8h11.3c-1.65 4.66-6.08 8-11.3 8-6.63 0-12-5.37-12-12s5.37-12 12-12c3.06 0 5.84 1.15 7.96 3.04l5.66-5.66C34.05 6.05 29.27 4 24 4 12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20c0-1.34-.14-2.65-.39-3.92z"/>
                <path fill="#FF3D00" d="M6.31 14.69l6.57 4.81C14.66 15.13 18.97 12 24 12c3.06 0 5.84 1.15 7.96 3.04l5.66-5.66C34.05 6.05 29.27 4 24 4 16.32 4 9.66 8.34 6.31 14.69z"/>
                <path fill="#4CAF50" d="M24 44c5.17 0 9.86-1.98 13.41-5.21l-6.19-5.24C29.21 35.09 26.71 36 24 36c-5.2 0-9.62-3.32-11.28-7.96l-6.52 5.02C9.5 39.55 16.23 44 24 44z"/>
                <path fill="#1976D2" d="M43.61 20.08H42V20H24v8h11.3c-.79 2.24-2.23 4.16-4.09 5.55l6.19 5.24C40.99 35.27 44 30 44 24c0-1.34-.14-2.65-.39-3.92z"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">or use email</span></div>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          {mode !== 'forgot' && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          )}

          {mode === 'signin' && (
            <button type="button" onClick={() => setMode('forgot')} className="text-xs text-primary font-medium">
              Forgot password?
            </button>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-button active:scale-[0.97] transition-transform duration-200 disabled:opacity-60"
          >
            {submitting
              ? 'Please wait...'
              : mode === 'signin'
              ? 'Sign In'
              : mode === 'signup'
              ? 'Create Account'
              : 'Send Reset Link'}
          </button>

          {mode === 'signup' && (
            <p className="text-[11px] text-muted-foreground text-center">
              By creating an account you agree to our{' '}
              <a href="/terms" className="underline">Terms</a> and{' '}
              <a href="/privacy" className="underline">Privacy Policy</a>.
            </p>
          )}
        </form>

        <div className="text-center mt-6">
          {mode === 'forgot' ? (
            <button onClick={() => setMode('signin')} className="text-sm text-muted-foreground flex items-center gap-1 mx-auto">
              <ArrowLeft className="w-3 h-3" /> Back to sign in
            </button>
          ) : (
            <p className="text-sm text-muted-foreground">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-primary font-bold"
              >
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
