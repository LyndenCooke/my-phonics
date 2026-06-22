import { lazy, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBooks } from '@/hooks/useBooks';
import { hasInteractiveData } from '@/lib/interactiveBooksAvailability';
import BookReader from '@/components/BookReader';

const InteractiveBookReader = lazy(() => import('@/components/InteractiveBookReader'));

/**
 * SchoolRead — opens an interactive / picture book reader INSIDE the school app
 * so teachers stay on the school site instead of being bounced to the parent
 * (consumer) /library surface.
 *
 * The :slug param is the parent-6 sub-level (e.g. "L3.1"), which is the key the
 * interactive book data and the consumer book catalogue are keyed by. School
 * book cards pass their `parent6SubLevel`. The book is force-unlocked because
 * access has already been gated by school membership at the library level.
 */
export default function SchoolRead() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { data: books = [] } = useBooks();
  const back = () => navigate('/school/app/library');

  const match = books.find((b) => b.subLevel === slug);
  if (!match) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-600">That book isn’t available to read yet.</p>
        <button onClick={back} className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold">
          Back to library
        </button>
      </div>
    );
  }

  const book = { ...match, unlocked: true };
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
