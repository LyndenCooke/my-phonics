import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import BookCard from '@/components/BookCard';
import { lazy, Suspense } from 'react';
const BookReader = lazy(() => import('@/components/BookReader'));
const InteractiveBookReader = lazy(() => import('@/components/InteractiveBookReader'));
import { hasInteractiveData } from '@/lib/interactiveBooksAvailability';
import ComprehensionQuiz from '@/components/ComprehensionQuiz';
import LevelFilter from '@/components/LevelFilter';
import BookUnlockedModal from '@/components/BookUnlockedModal';
import DownloadFormatDialog, { type DownloadFormat, formatDisplayLabel } from '@/components/DownloadFormatDialog';
import { useBooks, useUserBooks, useBookPages, useQuizQuestions, useProducts } from '@/hooks/useBooks';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useNotifications } from '@/hooks/useNotifications';
import { useTeacherSession } from '@/lib/teacherSession';
import { BookOpen, Lock, ShoppingBag, Loader2, Trophy } from 'lucide-react';
import FoundersClubBanner from '@/components/FoundersClubBanner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { Book } from '@/lib/types';
import { LEVELS } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function Index() {
  const location = useLocation();
  const navState = location.state as { filterLevel?: number; scrollToBookId?: string; from?: string } | null;
  const initialLevel = navState?.filterLevel ?? null;
  const scrollToBookId = navState?.scrollToBookId ?? null;
  // Teachers arrive via Link state={{ from: 'teachers' }} on /teachers/library.
  // We use this to (a) skip the regular library framing while the deep-linked
  // book is opening (avoids the flash of the parent library between mount
  // and the deep-link useEffect firing), and (b) send them back to
  // /teachers/library on close instead of stranding them on /library.
  const fromTeachers = navState?.from === 'teachers';
  const [selectedLevel, setSelectedLevel] = useState<number | null>(initialLevel);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [upsellBook, setUpsellBook] = useState<Book | null>(null);
  const [downloadBook, setDownloadBook] = useState<Book | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { add: addNotification } = useNotifications();

  // Automated stress-test bypass: the seeded QA account has every book
  // unlocked regardless of the books/user_books seed state. This only
  // unlocks reading — nothing else — and requires signing in as the
  // specific QA email.
  const isQaUser = user?.email?.toLowerCase() === 'qa@myphonicsbooks.com';
  // Teacher pass holders (TPT-TEACHERS code etc.) get read access to every
  // book without signing up — their entitlement lives in localStorage, not
  // auth.users, so the regular user_books gating doesn't see them.
  const { session: teacherSession } = useTeacherSession();
  const isTeacher = !!teacherSession;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: booksData, isLoading: booksLoading } = useBooks(selectedLevel);
  const { data: userBooksData } = useUserBooks();
  const { data: pagesData } = useBookPages(activeBookId);
  const { data: quizData } = useQuizQuestions(activeBookId);
  const { data: products } = useProducts();

  // Show "Book Unlocked" modal for first-time login (magic link users)
  const [showUnlockedModal, setShowUnlockedModal] = useState(false);
  const [unlockedModalBook, setUnlockedModalBook] = useState<{ title: string; level: number; coverUrl: string | null } | null>(null);

  useEffect(() => {
    if (!user || !userBooksData || !booksData) return;
    // Only show once per user
    const key = `mpb_welcomed_${user.id}`;
    if (localStorage.getItem(key)) return;

    // Find their free sample book
    const freeSample = userBooksData.find((ub: any) => ub.source === 'free_sample');
    if (!freeSample) return;

    const book = booksData.find((b: any) => b.id === freeSample.book_id);
    if (!book) return;

    const sub = book.sub_level as string;
    const coverUrl = book.cover_image_url ?? `/illustrations/${sub.replace(/^L/, '').replace('.', '_')}/cover.png`;
    setUnlockedModalBook({ title: book.title, level: book.level, coverUrl });
    setShowUnlockedModal(true);
    localStorage.setItem(key, '1');
  }, [user, userBooksData, booksData]);

  // Scroll to the unlocked book when arriving from /welcome so the user
  // lands ON their book card, with the surrounding locked books visible —
  // it builds curiosity for what comes next without them having to scroll.
  useEffect(() => {
    if (!scrollToBookId || booksLoading) return;
    // Wait one frame so the grid is in the DOM with its final layout
    const timer = setTimeout(() => {
      const el = document.getElementById(`book-card-${scrollToBookId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Soft highlight to draw the eye without being garish
        el.classList.add('ring-4', 'ring-primary', 'ring-offset-2');
        setTimeout(() => {
          el.classList.remove('ring-4', 'ring-primary', 'ring-offset-2');
        }, 2500);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [scrollToBookId, booksLoading, booksData]);

  const userBooksMap = new Map((userBooksData ?? []).map(ub => [ub.book_id, ub]));

  const books: Book[] = (booksData ?? []).map(b => {
    const ub = userBooksMap.get(b.id);
    return {
      id: b.id,
      level: b.level,
      subLevel: b.sub_level,
      title: b.title,
      slug: b.slug,
      focusSounds: b.focus_sounds,
      trickyWords: b.tricky_words ?? [],
      storyWords: b.story_words ?? [],
      coverImageUrl: b.cover_image_url ?? undefined,
      pdfUrl: b.pdf_url ?? undefined,
      pageCount: b.page_count ?? 16,
      sortOrder: b.sort_order,
      unlocked: import.meta.env.DEV || isAdmin || isQaUser || isTeacher || !!ub || (b.is_free_sample ?? false),
      completed: !!ub?.completed_at,
      lastPageRead: ub?.last_page_read ?? 0,
      pages: (pagesData && activeBookId === b.id)
        ? pagesData.map(p => ({
            id: p.id,
            pageNumber: p.page_number,
            pageType: p.page_type as Book['pages'][0]['pageType'],
            textContent: p.text_content ?? undefined,
            imageUrl: p.image_url ?? undefined,
          }))
        : [],
    };
  });

  const activeBook = activeBookId ? books.find(b => b.id === activeBookId) ?? null : null;

  // Deep-link support: `/library?book=L3.1` auto-opens that book's reader
  // once the book catalogue has loaded. Clears the query string once handled
  // so the URL doesn't sit with a stale param after closing the reader.
  // For teachers, if the book param doesn't resolve (typo, unpublished),
  // we bounce them back to the teacher library rather than leaving them on
  // an empty parent /library view they can't escape.
  useEffect(() => {
    if (activeBookId || books.length === 0) return;
    const params = new URLSearchParams(location.search);
    const wanted = params.get('book');
    if (!wanted) return;
    const match = books.find((b) => b.subLevel === wanted);
    if (match && match.unlocked) {
      setActiveBookId(match.id);
      const url = new URL(window.location.href);
      url.searchParams.delete('book');
      window.history.replaceState({}, '', url.toString());
    } else if (fromTeachers) {
      navigate('/teachers/library', { replace: true });
    }
  }, [activeBookId, books, location.search, fromTeachers, navigate]);

  // For teachers: closing the reader should return to the teacher library,
  // not strand them on the parent /library page (which is gated by auth and
  // would just show empty/locked content for a teacher-pass visitor).
  const closeReader = () => {
    setActiveBookId(null);
    if (fromTeachers) {
      navigate('/teachers/library', { replace: true });
    }
  };

  const quizQuestions = (quizData ?? []).map(q => ({
    id: q.id,
    bookId: q.book_id,
    quizType: q.quiz_type as 'comprehension' | 'word_reading' | 'sound_matching',
    questionText: q.question_text,
    options: Array.isArray(q.options) ? (q.options as string[]) : [],
    correctAnswer: q.correct_answer,
    sortOrder: q.sort_order,
  }));

  // Find the product that includes this book's level
  const getProductForLevel = (level: number) => {
    return products?.find(p =>
      p.product_type === 'level_pack' && p.levels_included.includes(level)
    );
  };

  const handleBookSelect = (book: Book) => {
    if (book.unlocked) {
      setActiveBookId(book.id);
    } else {
      // Show upsell
      setUpsellBook(book);
    }
  };

  // Gated download. Hits generate-pdf-download which enforces tier rules
  // (free: 1 ever, monthly sub: 1 new book/7d, bundle: unlimited). On
  // success the function returns the public Supabase Storage URL; we open
  // it in a new tab so the browser triggers the actual file download. On
  // throttle we render the cooldown / upgrade prompt as a toast.
  const formatCooldown = (iso: string): string => {
    const ms = new Date(iso).getTime() - Date.now();
    if (ms <= 0) return 'soon';
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.ceil((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (days >= 1) return `${days} day${days === 1 ? '' : 's'}`;
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  };

  // Triggered when a book's Download button is tapped. We don't kick off
  // the fetch here — that happens inside DownloadFormatDialog once the
  // parent chooses A5 vs A4. This indirection means we don't have to
  // hardcode a format and we get a focused "go to Download History"
  // success state instead of a toast that disappears.
  const handleDownloadBook = (book: Book) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setDownloadBook(book);
  };

  // Runs from inside DownloadFormatDialog once the user picks a format.
  // Returns success/error so the dialog can swap to its success or
  // retry state. No toasts here — the dialog owns the visible feedback.
  const performDownload = async (
    book: Book,
    format: DownloadFormat,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pdf-download`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ book_id: book.id, format }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        // Throttle / tier limit — surface the user-facing message.
        if (data?.error === 'download_limit') {
          const cooldown = data.cooldown_until
            ? ` Try again in ${formatCooldown(data.cooldown_until)}.`
            : '';
          return {
            success: false,
            error: `${data.message ?? 'Download not available.'}${cooldown}`,
          };
        }
        return { success: false, error: data?.error || 'Download failed' };
      }

      // Trigger a real file save by fetching the PDF as a blob and clicking
      // a hidden <a download>. window.open(url) after an await chain is
      // silently popup-blocked by Safari/Chrome and on installed PWAs.
      const pdfRes = await fetch(data.url);
      if (!pdfRes.ok) return { success: false, error: 'PDF file unavailable' };
      const blob = await pdfRes.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      // Suffix the filename with the user-facing label (A5 Booklet / A4
      // Sheets) so the file the parent saves matches what they ticked in
      // the picker, and the two variants don't clobber each other.
      a.download = `${book.title} (${formatDisplayLabel(format)}).pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

      // Client-side download_log insert. The edge function tries to log too
      // for entitlement-throttle reasons, but in practice we kept seeing the
      // log table sit at zero rows — likely because cached PWA bundles or
      // edge-function deploy hiccups break the server-side path silently.
      // Logging from the client (which has the user's JWT and RLS access to
      // their own rows) means Download History stays accurate regardless of
      // what happens server-side. Skip local-only catalog books (no FK match).
      if (user && !book.id.startsWith('local-')) {
        const { error: logErr } = await supabase
          .from('download_log')
          .insert({ user_id: user.id, book_id: book.id });
        if (logErr) console.warn('download_log insert failed (client):', logErr);
      }

      // Profile-tab badge surfaces the new download — keeps the path
      // discoverable even if the user closes the success modal.
      addNotification({
        icon: 'download',
        title: `${book.title} downloaded`,
        body: `${formatDisplayLabel(format)} saved — tap to re-download`,
        ctaLabel: 'View',
        ctaHref: '/profile/downloads',
      });
      queryClient.invalidateQueries({ queryKey: ['download_log'] });
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message || 'Download failed' };
    }
  };

  const handleGetFreeSample = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setCheckoutLoading(true);
    try {
      const freeProduct = products?.find(p => p.product_type === 'free_sample');
      if (!freeProduct) throw new Error('Free sample not available');

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ product_id: freeProduct.id }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.free) {
        toast.success('Free sample books unlocked!');
        // Refetch user books
        queryClient.invalidateQueries({ queryKey: ['user_books'] });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(errorMessage);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleBuyLevel = async (level: number) => {
    const product = getProductForLevel(level);
    if (!product) {
      navigate('/shop');
      return;
    }

    if (!user) {
      navigate('/shop');
      return;
    }

    setCheckoutLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ product_id: product.id }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.url) window.location.href = data.url;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(errorMessage);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleQuizComplete = async (score: number, total: number) => {
    const percentage = Math.round((score / total) * 100);
    const isPerfect = score === total;
    
    // Show success toast
    toast.success(
      isPerfect 
        ? `Perfect score! ${score}/${total} - You're a reading star!` 
        : `Quiz complete! You scored ${score}/${total}`,
      {
        icon: <Trophy className="w-4 h-4" />,
        duration: 4000,
      }
    );
    
    // Refetch user books to update progress
    await queryClient.invalidateQueries({ queryKey: ['user_books'] });
    await queryClient.invalidateQueries({ queryKey: ['progress'] });
    
    // Close quiz
    setShowQuiz(false);
    setActiveBookId(null);
  };

  if (showQuiz && activeBook && quizQuestions.length > 0) {
    return (
      <ComprehensionQuiz
        questions={quizQuestions}
        bookId={activeBook.id}
        bookTitle={activeBook.title}
        levelColor={LEVELS.find(l => l.level === activeBook.level)?.bgClass ?? 'bg-level-1'}
        onComplete={handleQuizComplete}
        onClose={() => {
          setShowQuiz(false);
          closeReader();
        }}
      />
    );
  }

  if (activeBook) {
    const readerFallback = (
      <div className="fixed inset-0 z-[9999] bg-slate-900" />
    );
    // Use interactive reader when phonics data exists, fallback to JPG reader
    if (hasInteractiveData(activeBook.subLevel)) {
      return (
        <Suspense fallback={readerFallback}>
          <InteractiveBookReader
            book={activeBook}
            onClose={closeReader}
            onFinish={closeReader}
          />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={readerFallback}>
        <BookReader
          book={activeBook}
          onClose={closeReader}
          onFinish={() => {
            if (quizQuestions.length > 0) {
              setShowQuiz(true);
            } else {
              closeReader();
            }
          }}
        />
      </Suspense>
    );
  }

  // No flash of the parent library for teachers: when a teacher follows a
  // deep link from /teachers/library, the deep-link useEffect needs the
  // books query to resolve first. Until activeBookId is set, show only a
  // loading screen — never the parent library grid. Once books load, the
  // useEffect either opens the reader (matched) or bounces back to
  // /teachers/library (unmatched), so this gate naturally clears.
  if (fromTeachers && !activeBookId) {
    const params = new URLSearchParams(location.search);
    if (params.get('book')) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      );
    }
  }

  const levelBgs: Record<number, string> = {
    1: 'bg-level-1', 2: 'bg-level-2', 3: 'bg-level-3',
    4: 'bg-level-4', 5: 'bg-level-5', 6: 'bg-level-6',
  };

  const formatPrice = (pence: number) => {
    if (pence === 0) return 'Free';
    return `£${(pence / 100).toFixed(2)}`;
  };

  return (
    <Layout>
      {/* Book Unlocked modal for first-time magic-link users */}
      {unlockedModalBook && (
        <BookUnlockedModal
          open={showUnlockedModal}
          onClose={() => setShowUnlockedModal(false)}
          onContinue={() => setShowUnlockedModal(false)}
          title={unlockedModalBook.title}
          level={unlockedModalBook.level}
          coverUrl={unlockedModalBook.coverUrl}
          ctaLabel="Start Reading"
        />
      )}

      <div className="px-4 pt-5 pb-2 max-w-2xl mx-auto">
        <div className="mb-5">
          <h2 className="font-display text-2xl font-extrabold text-foreground tracking-tight">My Library</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tap a book to start reading
          </p>
        </div>

        {/* Founders Club inline banner — visible to parents in the library
         *  before they hit the level filter. Hides itself once the offer
         *  expires. */}
        <FoundersClubBanner variant="inline" className="mb-5" />

        <div className="mb-5">
          <LevelFilter selected={selectedLevel} onSelect={setSelectedLevel} />
        </div>

        {!user && (
          <div className="mb-5 bg-card rounded-xl p-4 flex items-start gap-3 shadow-card border-l-4 border-primary">
            <div className="w-8 h-8 rounded-lg bg-tint-pink flex items-center justify-center shrink-0 mt-0.5">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Browsing as a guest</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Log in to access your library, or take the 3-minute assessment for a free book.
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/auth')}
                  className="text-xs font-bold text-primary-ink hover:underline"
                >
                  Log In →
                </button>
                <button
                  onClick={() => navigate('/assess')}
                  className="text-xs font-bold text-primary-ink hover:underline"
                >
                  Start Free Assessment →
                </button>
              </div>
            </div>
          </div>
        )}

        {user && !userBooksData?.length && (
          <div className="mb-5 bg-card rounded-xl p-4 flex items-start gap-3 shadow-card border-l-4 border-primary">
            <div className="w-8 h-8 rounded-lg bg-tint-pink flex items-center justify-center shrink-0 mt-0.5">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Unlock your first free book</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Take our 3-minute assessment to get a book at your child's level
              </p>
              <button
                onClick={() => navigate('/assess')}
                className="mt-2 text-xs font-bold text-primary hover:underline"
              >
                Start Assessment →
              </button>
            </div>
          </div>
        )}

        {booksLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onSelect={handleBookSelect}
                onDownload={handleDownloadBook}
              />
            ))}
          </div>
        )}

        {!booksLoading && books.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No books found for this level yet</p>
            <p className="text-xs text-muted-foreground mt-1">Check back soon for new releases</p>
          </div>
        )}
      </div>

      {/* Upsell dialog for locked books */}
      <Dialog open={!!upsellBook} onOpenChange={(open) => !open && setUpsellBook(null)}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          {upsellBook && (() => {
            const levelInfo = LEVELS.find(l => l.level === upsellBook.level);
            const product = getProductForLevel(upsellBook.level);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    {upsellBook.title}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    This book is part of Level {upsellBook.level}: {levelInfo?.name}
                  </DialogDescription>
                </DialogHeader>

                <div className={`${levelBgs[upsellBook.level]} text-white rounded-xl p-4 text-center`}>
                  <p className="text-2xl font-extrabold">Level {upsellBook.level}</p>
                  <p className="text-sm opacity-90">{levelInfo?.name}</p>
                  {product && (
                    <p className="text-lg font-extrabold mt-2">
                      {formatPrice(product.price_pence)}
                    </p>
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  {product && (
                    <button
                      onClick={() => {
                        setUpsellBook(null);
                        handleBuyLevel(upsellBook.level);
                      }}
                      disabled={checkoutLoading}
                      className="w-full py-3 rounded-xl font-bold text-sm gradient-primary text-primary-foreground shadow-button transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {checkoutLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          Buy {product.name}
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setUpsellBook(null);
                      navigate('/shop');
                    }}
                    className="w-full py-3 rounded-xl font-bold text-sm border-2 border-primary text-primary bg-card transition-all duration-200 active:scale-[0.97]"
                  >
                    View All Packs
                  </button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Download format picker — opens when a parent taps Download on
       *  any unlocked book. Owns its own download → success/error UI so
       *  Index.tsx doesn't need to track download state. */}
      <DownloadFormatDialog
        book={downloadBook}
        onClose={() => setDownloadBook(null)}
        onDownload={(format) => performDownload(downloadBook!, format)}
      />
    </Layout>
  );
}
