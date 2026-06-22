import { lazy, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBooks } from '@/hooks/useBooks';
import { hasInteractiveData } from '@/lib/interactiveBooksAvailability';
import type { Book } from '@/lib/types';
import BookReader from '@/components/BookReader';

const InteractiveBookReader = lazy(() => import('@/components/InteractiveBookReader'));

/**
 * SchoolRead — opens an interactive / picture book reader INSIDE the school app
 * so teachers stay on the school site instead of being bounced to the parent
 * (consumer) /library surface.
 *
 * The :slug param is the parent-6 sub-level (e.g. "L1.3") — the key the consumer
 * book catalogue and interactive data are stored under. School book cards pass
 * their `parent6SubLevel`. useBooks() returns DB-shaped (snake_case) rows, so we
 * match on `sub_level` and map to the camelCase `Book` shape the readers expect
 * (same mapping the consumer Index uses), force-unlocked since school membership
 * already gated access.
 */
export default function SchoolRead() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { data: rows = [], isLoading } = useBooks();
  const back = () => navigate('/school/app/library');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (rows as any[]).find((b) => b.sub_level === slug);

  if (isLoading) {
    return <div className="fixed inset-0 z-[9999] bg-slate-900" />;
  }
  if (!raw) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-600">That book isn’t available to read yet.</p>
        <button onClick={back} className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold">
          Back to library
        </button>
      </div>
    );
  }

  const book: Book = {
    id: raw.id,
    level: raw.level,
    subLevel: raw.sub_level,
    title: raw.title,
    slug: raw.slug,
    focusSounds: raw.focus_sounds ?? [],
    trickyWords: raw.tricky_words ?? [],
    storyWords: raw.story_words ?? [],
    coverImageUrl: raw.cover_image_url ?? undefined,
    pdfUrl: raw.pdf_url ?? undefined,
    pageCount: raw.page_count ?? 16,
    sortOrder: raw.sort_order,
    unlocked: true,
    completed: false,
    lastPageRead: 0,
    pages: [],
  };

  const fallback = <div className="fixed inset-0 z-[9999] bg-slate-900" />;

  return (
    <Suspense fallback={fallback}>
      {hasInteractiveData(book.subLevel) ? (
        <InteractiveBookReader book={book} onClose={back} onFinish={back} />
      ) : (
        <BookReader book={book} onClose={back} onFinish={back} />
      )}
    </Suspense>
  );
}
