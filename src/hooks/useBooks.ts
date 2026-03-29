import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BOOK_CATALOG } from '@/lib/bookCatalog';

export function useBooks(level?: number | null) {
  return useQuery({
    queryKey: ['books', level],
    queryFn: async () => {
      // Fetch whatever Supabase has
      const { data: dbBooks } = await supabase
        .from('books')
        .select('*')
        .order('sort_order');

      const dbBySubLevel = new Map((dbBooks ?? []).map(b => [b.sub_level, b]));

      // Merge: DB version wins when present, otherwise use local catalog
      let catalog = BOOK_CATALOG;
      if (level) catalog = catalog.filter(c => c.level === level);

      return catalog.map(c => {
        const db = dbBySubLevel.get(c.sub_level);
        if (db) return db;
        // Synthesise a DB-shaped row from the catalog
        return {
          id: `local-${c.sub_level}`,
          level: c.level,
          sub_level: c.sub_level,
          title: c.title,
          slug: c.slug,
          focus_sounds: c.focus_sounds,
          tricky_words: c.tricky_words,
          story_words: c.story_words,
          cover_image_url: c.cover_image_url,
          pdf_url: c.pdf_url,
          page_count: c.page_count,
          sort_order: c.sort_order,
          is_free_sample: c.is_free_sample,
          is_published: c.is_published,
        };
      });
    },
  });
}

export function useUserBooks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user_books', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_books')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useBookPages(bookId: string | null) {
  return useQuery({
    queryKey: ['book_pages', bookId],
    queryFn: async () => {
      if (!bookId) return [];
      const { data, error } = await supabase
        .from('book_pages')
        .select('*')
        .eq('book_id', bookId)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!bookId,
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });
}

export function useChildren() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['children', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAssessmentItems() {
  return useQuery({
    queryKey: ['assessment_items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessment_items')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });
}

export function useQuizQuestions(bookId: string | null) {
  return useQuery({
    queryKey: ['quiz_questions', bookId],
    queryFn: async () => {
      if (!bookId) return [];
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('book_id', bookId)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!bookId,
  });
}

export function useProgressData() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['progress', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const [userBooksRes, booksRes, quizRes, assessmentRes, streakRes] = await Promise.all([
        supabase.from('user_books').select('*').eq('user_id', user.id),
        supabase.from('books').select('id, level, title'),
        supabase.from('quiz_attempts').select('*').eq('user_id', user.id),
        supabase.from('assessment_results').select('*').eq('user_id', user.id).order('completed_at', { ascending: false }).limit(1),
        supabase.from('reading_streaks').select('*').eq('user_id', user.id).order('activity_date', { ascending: false }).limit(30),
      ]);

      return {
        userBooks: userBooksRes.data ?? [],
        allBooks: booksRes.data ?? [],
        quizAttempts: quizRes.data ?? [],
        latestAssessment: assessmentRes.data?.[0] ?? null,
        recentStreaks: streakRes.data ?? [],
      };
    },
    enabled: !!user,
  });
}
