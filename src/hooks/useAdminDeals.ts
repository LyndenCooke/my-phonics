import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Deal {
  id: string;
  contact_id: string;
  stage_id: string | null;
  product_id: string | null;
  title: string;
  value_pence: number;
  status: string;
  expected_close_date: string | null;
  closed_at: string | null;
  created_at: string | null;
  contact?: { profile_id: string; profiles?: { email: string; full_name: string | null } };
  stage?: { name: string; colour: string | null };
}

export function useAdminDeals(filters?: { status?: string; stage_id?: string }) {
  return useQuery({
    queryKey: ['admin-deals', filters],
    queryFn: async () => {
      let query = supabase
        .from('crm_deals')
        .select('*, crm_contacts(profile_id, profiles(email, full_name)), crm_pipeline_stages(name, colour)')
        .order('created_at', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.stage_id) query = query.eq('stage_id', filters.stage_id);

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map(d => ({
        ...d,
        contact: d.crm_contacts as Deal['contact'],
        stage: d.crm_pipeline_stages as Deal['stage'],
      })) as Deal[];
    },
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      contact_id: string;
      title: string;
      value_pence?: number;
      stage_id?: string;
      product_id?: string;
      expected_close_date?: string;
    }) => {
      const { error } = await supabase.from('crm_deals').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pipeline'] });
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; status?: string; stage_id?: string; value_pence?: number; closed_at?: string }) => {
      const { error } = await supabase.from('crm_deals').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pipeline'] });
    },
  });
}
