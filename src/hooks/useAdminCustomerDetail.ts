import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAdminCustomerDetail(profileId: string | undefined) {
  return useQuery({
    queryKey: ['admin-customer', profileId],
    queryFn: async () => {
      if (!profileId) throw new Error('No profile ID');

      const [profileRes, childrenRes, purchasesRes, userBooksRes, assessmentsRes, notesRes, tasksRes, contactRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', profileId).single(),
        supabase.from('children').select('*').eq('user_id', profileId).order('created_at'),
        supabase.from('purchases').select('*, products(name, product_type)').eq('user_id', profileId).order('created_at', { ascending: false }),
        supabase.from('user_books').select('*, books(title, level, sub_level)').eq('user_id', profileId),
        supabase.from('assessment_results').select('*').eq('user_id', profileId).order('completed_at', { ascending: false }),
        supabase.from('crm_notes').select('*').eq('contact_id', profileId).order('created_at', { ascending: false }),
        supabase.from('crm_tasks').select('*').eq('contact_id', profileId).order('due_date'),
        supabase.from('crm_contacts').select('*, crm_pipeline_stages(name, colour)').eq('profile_id', profileId).maybeSingle(),
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
      };
    },
    enabled: !!profileId,
  });
}
