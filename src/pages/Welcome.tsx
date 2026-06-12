import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useBooks, useUserBooks } from '@/hooks/useBooks';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight, Loader2, BookOpen, Mail, Download } from 'lucide-react';
import { getJourneyLevel, journeyLevelOf, JOURNEY_LEVELS } from '@/lib/levels8';
import PasswordSetup from '@/components/PasswordSetup';

/** Sticker shadow — white border + soft drop, same as the rest of the
 *  paper-and-stickers surfaces. */
const STICKER = '0 1px 2px rgba(40,30,40,0.10), 0 8px 20px rgba(40,30,40,0.10)';

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
          <div
            className="rounded-[1.75rem] bg-white p-8"
            style={{ boxShadow: STICKER, border: '1px solid rgba(40,30,40,0.05)' }}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-tint-pink flex items-center justify-center">
              <Mail className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-extrabold text-foreground mb-2">
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

  // Books in Supabase are tagged with legacy parent-6 sub_levels; place this
  // one on the 8-level journey for naming and colour.
  const journeyLevel = unlockedBook?.sub_level
    ? journeyLevelOf(unlockedBook.sub_level)
    : (unlockedBook?.level ?? 1);
  const levelInfo = getJourneyLevel(journeyLevel) ?? JOURNEY_LEVELS[0];
  const hex = levelInfo.hex;
  const ink = levelInfo.inkHex;

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
      <div className="px-4 pt-8 lg:pt-12 pb-8 max-w-md lg:max-w-4xl mx-auto text-center">
        {/* ── Header — centred at every size ── */}
        <div className="mb-7 lg:mb-10">
          <span
            className="inline-block rounded-full bg-white px-4 py-1.5 text-xs font-extrabold -rotate-1 mb-4"
            style={{ color: ink, boxShadow: STICKER, border: '2px solid #fff', outline: `2px solid ${hex}30` }}
          >
            You're in! 🎉
          </span>
          <h1 className="font-display text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">
            Your free book is ready
          </h1>
          <p className="text-sm lg:text-base text-muted-foreground mt-2">
            We've unlocked a book at your child's level. Tap to start reading.
          </p>
        </div>

        {unlockedBook ? (
          // Landscape: the book object on the left, actions on the right —
          // one balanced spread. Mobile keeps the single centred column.
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center lg:text-left">
            {/* The book as a physical object */}
            <div className="relative mb-6 lg:mb-0">
              <div
                aria-hidden
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[20rem] h-[20rem] rounded-full blur-3xl opacity-[0.16] pointer-events-none"
                style={{ background: hex }}
              />
              <button
                onClick={() => navigate('/library', { state: { filterLevel: unlockedBook.level, openBookId: unlockedBook.id } })}
                aria-label={`Open ${unlockedBook.title}`}
                className="relative block mx-auto w-[58%] max-w-[15rem] press-scale"
                style={{ rotate: '-2deg' }}
              >
                {/* page edges */}
                <span aria-hidden className="absolute top-[3px] -right-[5px] bottom-[1px] w-[10px] rounded-r-md bg-[#f3ead9] ring-1 ring-black/10" />
                <span aria-hidden className="absolute top-[6px] -right-[9px] bottom-[3px] w-[10px] rounded-r-md bg-[#e9dfc8] ring-1 ring-black/10" />
                <span className="relative block aspect-[3/4] rounded-lg rounded-r-md overflow-hidden ring-1 ring-black/15 shadow-[0_24px_45px_-18px_rgba(40,30,40,0.45)]">
                  {coverUrl ? (
                    <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center" style={{ background: hex }}>
                      <BookOpen className="w-12 h-12 text-white opacity-80" />
                    </span>
                  )}
                  {/* spine shading */}
                  <span aria-hidden className="absolute inset-y-0 left-0 w-[7%] bg-gradient-to-r from-black/25 to-transparent" />
                </span>
                {/* ground shadow */}
                <span aria-hidden className="absolute -bottom-4 left-[8%] right-[8%] h-4 rounded-[100%] bg-black/15 blur-md" />
              </button>
            </div>

            {/* Title + level + actions */}
            <div className="lg:pr-4">
              <p className="text-xs font-extrabold uppercase tracking-wide" style={{ color: ink }}>
                Level {journeyLevel} · {levelInfo.name}
              </p>
              <h2 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground mt-1">
                {unlockedBook.title}
              </h2>

              {/* Download buttons — A5 (one-page-per-sheet) for screen/standard
                  print, A4 booklet for fold-and-staple home printing. PDFs live
                  in the public Supabase Storage `book-pdfs` bucket; the same
                  URLs are used by the post-assessment marketing email. */}
              {unlockedBook.sub_level && (() => {
                const slug = unlockedBook.sub_level.replace(/^L/, '').replace('.', '_');
                const BUCKET = 'https://jfbgdeyjngvzpfucwpuk.supabase.co/storage/v1/object/public/book-pdfs';
                return (
                  <div className="mt-5 flex flex-col gap-2.5">
                    <a
                      href={`${BUCKET}/a5/${slug}.pdf`}
                      download={`${unlockedBook.title}.pdf`}
                      target="_blank"
                      rel="noopener"
                      className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-white font-bold text-sm text-foreground transition-all active:translate-y-[2px]"
                      style={{ boxShadow: `0 3px 0 rgba(40,30,40,0.08), ${STICKER}`, border: '1px solid rgba(40,30,40,0.06)' }}
                    >
                      <Download className="w-4 h-4" /> Read on screen / print A5
                    </a>
                    <a
                      href={`${BUCKET}/a4/${slug}.pdf`}
                      download={`${unlockedBook.title} (Printable Booklet).pdf`}
                      target="_blank"
                      rel="noopener"
                      className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-white font-bold text-sm text-foreground transition-all active:translate-y-[2px]"
                      style={{ boxShadow: `0 3px 0 rgba(40,30,40,0.08), ${STICKER}`, border: '1px solid rgba(40,30,40,0.06)' }}
                    >
                      <Download className="w-4 h-4" /> Print and fold (A4 booklet)
                    </a>
                  </div>
                );
              })()}

              <button
                onClick={() => navigate('/library', {
                  // No level filter on purpose — show the whole library so the
                  // unlocked book sits among all the locked ones the parent
                  // could unlock next. scrollToBookId centres their book in view.
                  state: { scrollToBookId: unlockedBook.id },
                })}
                className="mt-4 w-full h-14 rounded-2xl font-display text-lg font-extrabold text-white flex items-center justify-center gap-2 transition-all active:translate-y-[4px]"
                style={{ background: hex, boxShadow: `0 5px 0 ${ink}, 0 14px 28px -10px ${hex}80` }}
              >
                Continue to Library <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              className="mb-6 p-6 rounded-[1.75rem] bg-white"
              style={{ boxShadow: STICKER, border: '1px solid rgba(40,30,40,0.05)' }}
            >
              <p className="text-sm text-muted-foreground">
                Your book is being prepared. Head to the library to browse what's available.
              </p>
            </div>
            <button
              onClick={() => navigate('/library')}
              className="w-full max-w-md mx-auto h-14 rounded-2xl font-display text-lg font-extrabold text-white flex items-center justify-center gap-2 transition-all active:translate-y-[4px]"
              style={{ background: '#E84B8A', boxShadow: '0 5px 0 #BE1862, 0 14px 28px -10px #E84B8A80' }}
            >
              Continue to Library <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Password creation for magic-link users */}
        <div className="max-w-md mx-auto">
          <PasswordSetup />
          <p className="text-xs text-muted-foreground mt-4">
            Your progress is saved. Come back anytime to pick up where you left off.
          </p>
        </div>
      </div>
    </Layout>
  );
}
