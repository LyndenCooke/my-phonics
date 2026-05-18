import { useMemo } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  BookOpen,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BOOK_CATALOG, type CatalogBook } from '@/lib/bookCatalog';
import { LEVELS } from '@/lib/types';
import {
  clearTeacherSession,
  useTeacherSession,
} from '@/lib/teacherSession';
import { formatDisplayLabel, type DownloadFormat } from '@/components/DownloadFormatDialog';

// Direct public-bucket URL — the `book-pdfs` bucket is set to public in
// migration 20260514140000_book_pdfs_public.sql, so the teacher page
// doesn't need to go through the entitlement-gated edge function at all.
// Internal format codes are inverted vs. the user-facing label:
//   bucket `a4/` = A5 Booklet (imposed for printing on A4)
//   bucket `a5/` = A4 Sheets   (one page per sheet)
function publicPdfUrl(slug: string, format: DownloadFormat): string {
  const base = import.meta.env.VITE_SUPABASE_URL as string;
  return `${base}/storage/v1/object/public/book-pdfs/${format}/${slug}.pdf`;
}

interface MergedBook extends CatalogBook {
  id: string;
  coverUrl: string;
}

export default function TeachersLibrary() {
  const { session, loading } = useTeacherSession();
  const navigate = useNavigate();

  // Merge DB books with the local catalog so the page lists everything
  // currently published — same merge strategy useBooks() uses, just
  // unauthenticated. Public RLS already exposes published books.
  const { data: books, isLoading: booksLoading } = useQuery({
    queryKey: ['teachers-library-books'],
    queryFn: async (): Promise<MergedBook[]> => {
      const { data: dbBooks } = await supabase
        .from('books')
        .select('id, sub_level, cover_image_url, slug, title, level')
        .order('sort_order');
      const dbBySubLevel = new Map((dbBooks ?? []).map((b) => [b.sub_level, b]));

      return BOOK_CATALOG.filter((c) => c.is_published).map((c) => {
        const db = dbBySubLevel.get(c.sub_level);
        const sub = c.sub_level.replace(/^L/, '').replace('.', '_');
        const fallbackCover = `/illustrations/${sub}/cover.png`;
        return {
          ...c,
          id: db?.id ?? `local-${c.sub_level}`,
          coverUrl: db?.cover_image_url ?? c.cover_image_url ?? fallbackCover,
          title: db?.title ?? c.title,
          slug: db?.slug ?? c.slug,
        };
      });
    },
    enabled: !!session,
  });

  const booksByLevel = useMemo(() => {
    const groups = new Map<number, MergedBook[]>();
    for (const b of books ?? []) {
      const list = groups.get(b.level) ?? [];
      list.push(b);
      groups.set(b.level, list);
    }
    return groups;
  }, [books]);

  const handleSignOut = () => {
    clearTeacherSession();
    navigate('/teachers', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/teachers" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary-ink transition-colors"
          >
            <img
              src="/logo/mpb-mark-transparent.png"
              alt=""
              className="w-7 h-7 object-contain"
              draggable={false}
            />
            <span className="hidden sm:inline">
              My<span className="text-primary-ink">Phonics</span>Books
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tint-pink text-primary-ink text-[11px] font-bold">
              <GraduationCap className="w-3 h-3" />
              {session.label}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 pb-24">
        <section className="mb-8 text-center sm:text-left">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Welcome, teacher.
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-snug">
            Every MyPhonicsBooks title is here, free for your classroom. Download
            the printable PDFs in whichever format prints best for you, or read
            online with your class.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Share the code with colleagues — no extra signup needed
          </div>
        </section>

        {booksLoading && (
          <div className="py-16 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!booksLoading &&
          LEVELS.map((level) => {
            const levelBooks = booksByLevel.get(level.level) ?? [];
            if (levelBooks.length === 0) return null;
            return (
              <section key={level.level} className="mb-10">
                <div className="flex items-baseline justify-between mb-3">
                  <h2 className={`font-display text-xl font-extrabold ${level.colorClass}`}>
                    Level {level.level} · {level.name}
                  </h2>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {level.ageRange}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {levelBooks.map((book) => (
                    <BookRow key={book.sub_level} book={book} levelBg={level.bgClass} />
                  ))}
                </div>
              </section>
            );
          })}

        <section className="mt-12 rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center">
          <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <h3 className="font-bold text-base text-foreground">
            Printable worksheets — coming soon
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto leading-snug">
            We're moving the classroom worksheet pack into this portal. Check
            back shortly — your code already covers it.
          </p>
        </section>
      </main>
    </div>
  );
}

function BookRow({ book, levelBg }: { book: MergedBook; levelBg: string }) {
  const readerHref = `/library?book=${book.sub_level}`;
  return (
    <article className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
      <div className={`relative aspect-[4/3] ${levelBg}/10`}>
        <img
          src={book.coverUrl}
          alt={book.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            // Fall back to the level colour block if a cover hasn't been
            // generated yet — keeps the grid visually intact instead of
            // showing a broken-image icon.
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/90 text-[10px] font-bold text-foreground">
          {book.sub_level}
        </span>
      </div>

      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-sm font-bold text-foreground leading-snug">
          {book.title}
        </h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Focus: {book.focus_sounds.slice(0, 4).join(' · ')}
          {book.focus_sounds.length > 4 ? '…' : ''}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-1.5">
          <a
            href={publicPdfUrl(book.slug, 'a4')}
            download={`${book.title} (${formatDisplayLabel('a4')}).pdf`}
            target="_blank"
            rel="noopener"
            className="flex items-center justify-center gap-1 py-2 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold hover:opacity-90 transition-opacity"
          >
            <Download className="w-3 h-3" />
            A5 Booklet
          </a>
          <a
            href={publicPdfUrl(book.slug, 'a5')}
            download={`${book.title} (${formatDisplayLabel('a5')}).pdf`}
            target="_blank"
            rel="noopener"
            className="flex items-center justify-center gap-1 py-2 rounded-lg bg-card border border-border text-foreground text-[11px] font-bold hover:bg-muted/40 transition-colors"
          >
            <Download className="w-3 h-3" />
            A4 Sheets
          </a>
        </div>

        <Link
          to={readerHref}
          className="mt-1.5 flex items-center justify-center gap-1 py-2 rounded-lg text-primary-ink text-[11px] font-bold hover:bg-tint-pink/40 transition-colors"
        >
          <BookOpen className="w-3 h-3" />
          Read online
        </Link>
      </div>
    </article>
  );
}
