import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useBooks, useUserBooks } from '@/hooks/useBooks';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, ChevronRight, Loader2, BookOpen, Mail, Download } from 'lucide-react';
import { LEVELS } from '@/lib/types';
import PasswordSetup from '@/components/PasswordSetup';

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

  // Some seeded book rows don't have `cover_image_url` set, which dropped
  // parents onto a big BookOpen-icon placeholder after submitting their
  // email. Fall back to the public `/covers/{n}_{sub}_cover.jpg` path the
  // funnel reveal page already uses — same image, same source of truth.
  const fallbackCover = unlockedBook?.sub_level
    ? `/covers/${unlockedBook.sub_level.replace(/^L/, '').replace('.', '_')}_cover.jpg`
    : null;
  const coverUrl: string | null = unlockedBook?.cover_image_url || fallbackCover;

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
              className="group block mx-auto w-full max-w-[220px]"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-card bg-card border-2 border-primary transition-transform duration-200 group-active:scale-[0.97]">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={unlockedBook.title}
                    className="w-full aspect-[3/4] object-cover"
                  />
                ) : (
                  <div className={`w-full aspect-[3/4] flex items-center justify-center ${LEVEL_COLORS[level]} text-white`}>
                    <BookOpen className="w-12 h-12 opacity-70" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Level {level} — {levelInfo?.name}
              </p>
              <p className="font-bold text-base text-foreground">
                {unlockedBook.title}
              </p>
            </button>

            {/* Download buttons — A5 (one-page-per-sheet) for screen/standard
                print, A4 booklet for fold-and-staple home printing. PDFs live
                in the public Supabase Storage `book-pdfs` bucket; the same
                URLs are used by the post-assessment marketing email. */}
            {unlockedBook.sub_level && (() => {
              const slug = unlockedBook.sub_level.replace(/^L/, '').replace('.', '_');
              const BUCKET = 'https://jfbgdeyjngvzpfucwpuk.supabase.co/storage/v1/object/public/book-pdfs';
              return (
                <div className="mt-3 flex flex-col gap-2">
                  <a
                    href={`${BUCKET}/a5/${slug}.pdf`}
                    download={`${unlockedBook.title}.pdf`}
                    target="_blank"
                    rel="noopener"
                    className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-card border-2 border-border font-bold text-sm text-foreground shadow-card active:scale-[0.97] transition-transform duration-200 hover:border-primary"
                  >
                    <Download className="w-4 h-4" /> Read on screen / print A5
                  </a>
                  <a
                    href={`${BUCKET}/a4/${slug}.pdf`}
                    download={`${unlockedBook.title} (Printable Booklet).pdf`}
                    target="_blank"
                    rel="noopener"
                    className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-card border-2 border-border font-bold text-sm text-foreground shadow-card active:scale-[0.97] transition-transform duration-200 hover:border-primary"
                  >
                    <Download className="w-4 h-4" /> Print and fold (A4 booklet)
                  </a>
                </div>
              );
            })()}
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

