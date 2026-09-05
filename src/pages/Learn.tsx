/**
 * Learn — primary home tab for everyone.
 *
 * Replaces the old parent/child mode toggle: the simplified hub that
 * used to be conditionally rendered as `ChildHomeScreen` from inside
 * `/library` (Index.tsx) now lives at its own permanent route. Tapping
 * a book deep-links into `/library?book={subLevel}`, which Index.tsx
 * already handles by auto-opening the reader.
 *
 * Auth note: the page renders for signed-out visitors too — they just
 * see locked books. Tapping a locked book sends them to /library where
 * the existing upsell flow takes over. Anonymous reads of `useBooks`
 * are allowed by RLS (books table is publicly readable).
 */
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ChildHomeScreen from '@/components/ChildHomeScreen';
import { useBooks, useUserBooks } from '@/hooks/useBooks';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import type { Book } from '@/lib/types';
import { journeyLevelOf } from '@/lib/levels8';

export default function Learn() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { data: booksData } = useBooks(null);
  const { data: userBooksData } = useUserBooks();

  const isQaUser = user?.email?.toLowerCase() === 'hello@myphonicsbooks.co.uk';
  const userBooksMap = new Map((userBooksData ?? []).map(ub => [ub.book_id, ub]));

  // Same `Book` shape Index.tsx builds — minimal fields the hub needs
  // (cover, level, lock state, completion). We deliberately skip `pages`
  // here because tapping a book deep-links into /library which fetches
  // pages itself. Avoids a wasted query per book on this tab.
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
      // See Index.tsx:142 — never key entitlement off import.meta.env.DEV.
      // Launch 2026-09-05: every book is free to read for everyone.
      unlocked: true,
      completed: !!ub?.completed_at,
      lastPageRead: ub?.last_page_read ?? 0,
      pages: [],
    };
  });

  const handleBookSelect = (book: Book) => {
    if (book.unlocked) {
      // Library's deep-link handler opens the reader for this sub-level
      // (Index.tsx:145) — keeps the single source of truth for reading UI
      // in /library and avoids re-implementing the reader stack here.
      navigate(`/library?book=${book.subLevel}`);
    } else {
      // Send the parent to the library on the relevant level so the
      // upsell + locked-book interaction fires there.
      navigate('/library', { state: { filterLevel: journeyLevelOf(book.subLevel) } });
    }
  };

  return (
    <Layout>
      <ChildHomeScreen books={books} onBookSelect={handleBookSelect} />
    </Layout>
  );
}
