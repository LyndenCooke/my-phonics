/**
 * Manual testimonials — admin-curated quotes that didn't come through
 * in-app feedback. Stored in the `testimonials` table (admin-managed RLS)
 * and unioned into the public wall via the public_testimonials view.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// `testimonials` isn't in the generated types yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export interface ManualTestimonial {
  id: string;
  quote: string;
  author_name: string | null;
  rating: number;
  featured: boolean;
  created_at: string;
}

export function useManualTestimonials() {
  return useQuery({
    queryKey: ['admin-testimonials'],
    queryFn: async (): Promise<ManualTestimonial[]> => {
      const { data, error } = await sb
        .from('testimonials')
        .select('id, quote, author_name, rating, featured, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateTestimonial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { quote: string; author_name?: string; rating?: number }) => {
      const { error } = await sb.from('testimonials').insert({
        quote: v.quote,
        author_name: v.author_name || null,
        rating: v.rating ?? 5,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-testimonials'] }),
  });
}

export function useDeleteTestimonial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from('testimonials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-testimonials'] }),
  });
}

export function useToggleTestimonial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id: string; featured: boolean }) => {
      const { error } = await sb.from('testimonials').update({ featured: v.featured }).eq('id', v.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-testimonials'] }),
  });
}
