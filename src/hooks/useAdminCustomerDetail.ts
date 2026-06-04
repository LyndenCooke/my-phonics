import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAdminCustomerDetail(profileId: string | undefined) {
  return useQuery({
    queryKey: ['admin-customer', profileId],
    queryFn: async () => {
      if (!profileId) throw new Error('No profile ID');

      const [profileRes, childrenRes, purchasesRes, userBooksRes, assessmentsRes, notesRes, tasksRes, contactRes, reviewsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', profileId).single(),
        supabase.from('children').select('*').eq('user_id', profileId).order('created_at'),
        supabase.from('purchases').select('*, products(name, product_type)').eq('user_id', profileId).order('created_at', { ascending: false }),
        supabase.from('user_books').select('*, books(title, level, sub_level)').eq('user_id', profileId),
        supabase.from('assessment_results').select('*').eq('user_id', profileId).order('completed_at', { ascending: false }),
        // Notes/tasks now key off profile_id directly. The contact_id
        // path is kept for the small number of legacy rows that pre-date
        // the migration — combining both queries here avoids losing them.
        supabase
          .from('crm_notes')
          .select('*')
          .or(`profile_id.eq.${profileId},contact_id.eq.${profileId}`)
          .order('created_at', { ascending: false }),
        supabase
          .from('crm_tasks')
          .select('*')
          .or(`profile_id.eq.${profileId},contact_id.eq.${profileId}`)
          .order('due_date'),
        supabase.from('crm_contacts').select('*, crm_pipeline_stages(name, colour)').eq('profile_id', profileId).maybeSingle(),
        // Submitted feedback / testimonials. `reviews` isn't in the
        // generated types yet, so the client is cast at the call site.
        (supabase as any)
          .from('reviews')
          .select('*')
          .eq('user_id', profileId)
          .not('submitted_at', 'is', null)
          .order('submitted_at', { ascending: false }),
      ]);

      if (profileRes.error) throw profileRes.error;

      return {
        profile: profileRes.data,
        children: childrenRes.data ?? [],
        purchases: purchasesRes.data ?? [],
        userBooks: userBooksRes.data ?? [],
        assessments: assessmentsRes.data ?? [],
        notes: notesRes.data ?? [],
        tasks: tasksRes.data ?? [],
        contact: contactRes.data,
        reviews: reviewsRes.data ?? [],
      };
    },
    enabled: !!profileId,
  });
}
