import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminFeedback {
  id: string;
  user_id: string | null;
  rating: number | null;
  loved: string | null;        // reviews.feedback — the featurable praise
  improvement: string | null;  // reviews.improvement — private
  source: string | null;
  kind: string | null;
  consent_marketing: boolean;
  consent_named: boolean;
  featured: boolean;
  submitted_at: string | null;
  full_name: string | null;
  email: string | null;
}

/**
 * Every submitted review across all customers, newest first, with the
 * customer's name/email attached. Powers the global Admin → Feedback page.
 *
 * `reviews` isn't in the generated Supabase types yet, so the client is
 * cast at the call site. Admin RLS ("Admins read all reviews") gates this.
 */
export function useAdminFeedback() {
  return useQuery({
    queryKey: ['admin-feedback'],
    queryFn: async (): Promise<AdminFeedback[]> => {
      const { data: reviews, error } = await (supabase as any)
        .from('reviews')
        .select('id, user_id, rating, feedback, improvement, source, kind, consent_marketing, consent_named, featured, submitted_at')
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      if (!reviews?.length) return [];

      const userIds = [...new Set(reviews.map((r: any) => r.user_id).filter(Boolean))];
      const profileMap = new Map<string, { full_name: string | null; email: string | null }>();
      if (userIds.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds as string[]);
        (profiles ?? []).forEach(p => profileMap.set(p.id, { full_name: p.full_name, email: p.email }));
      }

      return reviews.map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        rating: r.rating,
        loved: r.feedback,
        improvement: r.improvement,
        source: r.source,
        kind: r.kind,
        consent_marketing: !!r.consent_marketing,
        consent_named: !!r.consent_named,
        featured: !!r.featured,
        submitted_at: r.submitted_at,
        full_name: profileMap.get(r.user_id)?.full_name ?? null,
        email: profileMap.get(r.user_id)?.email ?? null,
      }));
    },
  });
}
