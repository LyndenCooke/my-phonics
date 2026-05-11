import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useBooks, useUserBooks } from '@/hooks/useBooks';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, ChevronRight, Loader2, BookOpen, Lock, Check, Mail, Download } from 'lucide-react';
import { LEVELS } from '@/lib/types';

const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-level-1', 2: 'bg-level-2', 3: 'bg-level-3',
  4: 'bg-level-4', 5: 'bg-level-5', 6: 'bg-level-6',
};

export default function Welcome() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') ?? '';
  const { user, loading: authLoading } = useAuth();
  const { data: userBooks, isLoading: ubLoading } = useUserBooks();
  const { data: allBooks, isLoading: booksLoading } = useBooks();

  // Find the first free-sample book the user has unlocked
  const [unlockedBook, setUnlockedBook] = useState<any>(null);

  // Magic-link state for visitors arriving from a GHL email with ?email=...
  // The GHL "Continue reading" button sends them here so we can issue a
  // fresh Supabase login link on the spot (links would expire if we
  // baked them into the email at send time).
  const [linkSent, setLinkSent] = useState(false);
  const [linkSending, setLinkSending] = useState(false);
  const [linkError, setLinkError] = useState('');

  useEffect(() => {
    if (!userBooks || !allBooks) return;
    const freeSample = userBooks.find((ub: any) => ub.source === 'free_sample') || userBooks[0];
    if (!freeSample) return;
    const book = allBooks.find((b: any) => b.id === freeSample.book_id);
    if (book) setUnlockedBook(book);
  }, [userBooks, allBooks]);

  // Auto-send the magic link on first arrival from GHL, then show the
  // "check your inbox" screen. If no email param is present we bounce
  // to /assess as before.
  useEffect(() => {
    if (authLoading || user) return;
    if (!emailParam) {
      navigate('/assess');
      return;
    }
    if (linkSent || linkSending) return;
    setLinkSending(true);
    supabase.auth
      .signInWithOtp({
        email: emailParam,
        options: { emailRedirectTo: `${window.location.origin}/welcome` },
      })
      .then(({ error }) => {
        if (error) setLinkError(error.message);
        else setLinkSent(true);
      })
      .finally(() => setLinkSending(false));
  }, [authLoading, user, emailParam, linkSent, linkSending, navigate]);

  const loading = authLoading || ubLoading || booksLoading;

  // Visitor arriving via the GHL email button — show "check your inbox"
  // confirmation. We render this BEFORE the auth-loading gate so they
  // aren't staring at a spinner while the OTP request completes.
  if (!user && emailParam) {
    return (
      <Layout>
        <div className="px-4 pt-12 pb-8 max-w-md mx-auto text-center">
          <div className="bg-card border border-border rounded-3xl p-8 shadow-card">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-tint-pink flex items-center justify-center">
              <Mail className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground mb-2">
              Check your inbox
            </h1>
            <p className="text-sm text-muted-foreground mb-1">
              We've sent a one-tap login link to
            </p>
            <p className="text-sm font-bold text-foreground mb-5 break-all">{emailParam}</p>
            {linkSending && (
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Sending link…
              </p>
            )}
            {linkSent && !linkSending && (
              <p className="text-xs text-muted-foreground">
                Tap the button in that email to log in and unlock your book.
              </p>
            )}
            {linkError && (
              <p className="text-xs text-destructive">{linkError}</p>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const level = unlockedBook?.level ?? 1;
  const levelInfo = LEVELS.find(l => l.level === level);

  return (
    <Layout>
      <div className="px-4 pt-8 pb-8 max-w-md mx-auto text-center">
        <div className="mb-5">
          <div className="inline-flex items-center gap-2 bg-tint-pink px-3 py-1.5 rounded-full mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wide">
              You're in!
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Your free book is ready
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            We've unlocked a book at your child's level. Tap to start reading.
          </p>
        </div>

        {unlockedBook ? (
          <div className="mb-6">
            <button
              onClick={() => navigate('/library', { state: { filterLevel: level, openBookId: unlockedBook.id } })}
              className="block w-full group"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-card bg-card border-2 border-primary transition-transform duration-200 group-active:scale-[0.97]">
                {unlockedBook.cover_image_url ? (
                  <img
                    src={unlockedBook.cover_image_url}
                    alt={unlockedBook.title}
                    className="w-full aspect-[3/4] object-cover"
                  />
                ) : (
                  <div className={`w-full aspect-[3/4] flex items-center justify-center ${LEVEL_COLORS[level]} text-white`}>
                    <BookOpen className="w-16 h-16 opacity-70" />
                  </div>
                )}
                <div className={`${LEVEL_COLORS[level]} text-white py-3 px-4 text-left`}>
                  <p className="text-xs opacity-90">Level {level} — {levelInfo?.name}</p>
                  <p className="font-bold text-lg">{unlockedBook.title}</p>
                </div>
              </div>
            </button>

            {/* Download button — sits under the title so parents can grab
                the PDF without leaving the page. Files are public at
                /book-pdfs/{level}_{sub}.pdf so this is a direct anchor. */}
            {unlockedBook.sub_level && (
              <a
                href={`/book-pdfs/${unlockedBook.sub_level.replace(/^L/, '').replace('.', '_')}.pdf`}
                download={`${unlockedBook.title}.pdf`}
                target="_blank"
                rel="noopener"
                className="mt-3 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-card border-2 border-border font-bold text-sm text-foreground shadow-card active:scale-[0.97] transition-transform duration-200 hover:border-primary"
              >
                <Download className="w-4 h-4" /> Download PDF
              </a>
            )}
          </div>
        ) : (
          <div className="mb-6 p-6 bg-card border border-border rounded-2xl">
            <p className="text-sm text-muted-foreground">
              Your book is being prepared. Head to the library to browse what's available.
            </p>
          </div>
        )}

        <button
          onClick={() => navigate('/library', {
            // No level filter on purpose — show the whole library so the
            // unlocked book sits among all the locked ones the parent
            // could unlock next. scrollToBookId centres their book in view.
            state: unlockedBook ? { scrollToBookId: unlockedBook.id } : undefined,
          })}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl gradient-primary text-primary-foreground font-bold text-base shadow-button active:scale-[0.97] transition-transform duration-200"
        >
          Continue to Library <ChevronRight className="w-4 h-4" />
        </button>

        {/* Password creation for magic-link users */}
        <PasswordSetup />

        <p className="text-xs text-muted-foreground mt-4">
          Your progress is saved. Come back anytime to pick up where you left off.
        </p>
      </div>
    </Layout>
  );
}

function PasswordSetup() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (done) {
    return (
      <div className="mt-5 flex items-center justify-center gap-2 text-sm text-green-600">
        <Check className="w-4 h-4" />
        Password set — you can now sign in with email &amp; password
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('At least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords don\'t match'); return; }
    setSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setDone(true);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 bg-card border border-border rounded-xl p-4 text-left">
      <div className="flex items-center gap-2 mb-3">
        <Lock className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm font-bold text-foreground">Create a password</p>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        So you can sign in next time without a magic link.
      </p>
      <input
        type="password"
        placeholder="Password (min 6 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm mb-2"
      />
      <input
        type="password"
        placeholder="Confirm password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm mb-3"
      />
      {error && <p className="text-xs text-destructive mb-2">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-full py-2.5 rounded-lg gradient-primary text-primary-foreground font-bold text-sm disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Set Password'}
      </button>
      <p className="text-xs text-muted-foreground mt-2 text-center">Optional — you can skip this</p>
    </form>
  );
}
