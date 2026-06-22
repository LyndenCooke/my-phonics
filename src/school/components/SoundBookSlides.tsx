import { lazy, Suspense } from 'react';
import type { Book } from '@/lib/types';
import { INTERACTIVE_BOOKS } from '@/lib/interactiveBookData';
import { SOUND_BOOK_DECKS } from '@/lib/soundBookInteractiveData';
import type { SoundBook } from '../data/soundBooks';

const InteractiveBookReader = lazy(() => import('@/components/InteractiveBookReader'));

// Register the sound-book decks into the reader's lookup once, at module load,
// so InteractiveBookReader[book.subLevel] resolves. Mutates the (const) object.
Object.assign(INTERACTIVE_BOOKS, SOUND_BOOK_DECKS);

/**
 * SoundBookSlides — plays a Sound Book as interactive on-screen slides using the
 * exact same reader as the storybooks. Builds a synthetic Book whose subLevel is
 * the SoundBook id (the deck key). The id is prefixed `local-` so the reader's
 * reading-progress write no-ops (no DB rows for sound books); stamps are
 * localStorage-only, so there are no server side-effects.
 */
export default function SoundBookSlides({ book, onClose }: { book: SoundBook; onClose: () => void }) {
  const synthetic: Book = {
    id: `local-${book.id}`,
    level: book.level,
    subLevel: book.id,
    title: book.title,
    slug: book.id,
    focusSounds: book.graphemes,
    trickyWords: [],
    storyWords: [],
    pageCount: 0,
    sortOrder: 0,
    unlocked: true,
    completed: false,
    lastPageRead: 0,
    pages: [],
  };
  return (
    <Suspense fallback={<div className="fixed inset-0 z-[9999] bg-slate-900" />}>
      <InteractiveBookReader book={synthetic} onClose={onClose} onFinish={onClose} />
    </Suspense>
  );
}
