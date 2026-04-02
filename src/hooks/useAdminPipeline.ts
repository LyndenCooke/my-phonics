import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PipelineStage {
  id: string;
  name: string;
  sort_order: number;
  colour: string | null;
}

export interface PipelineContact {
  id: string;
  profile_id: string;
  stage_id: string | null;
  source: string | null;
  tags: string[];
  lifetime_value_pence: number;
  last_activity_at: string | null;
  created_at: string | null;
  profile?: { email: string; full_name: string | null };
}

export function useAdminPipeline() {
  return useQuery({
    queryKey: ['admin-pipeline'],
    queryFn: async () => {
      const [stagesRes, contactsRes] = await Promise.all([
        supabase.from('crm_pipeline_stages').select('*').order('sort_order'),
        supabase.from('crm_contacts').select('*, profiles(email, full_name)').order('created_at', { ascending: false }),
      ]);

      if (stagesRes.error) throw stagesRes.error;

      const stages = stagesRes.data as PipelineStage[];
      const contacts = (contactsRes.data ?? []).map(c => ({
        ...c,
        profile: c.profiles as unknown as { email: string; full_name: string | null } | undefined,
      })) as PipelineContact[];

      return { stages, contacts };
    },
  });
}

export function useMoveContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, stageId }: { contactId: string; stageId: string }) => {
      const { error } = await supabase
        .from('crm_contacts')
        .update({ stage_id: stageId })
        .eq('id', contactId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pipeline'] });
    },
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { profile_id: string; stage_id?: string; source?: string }) => {
      const { error } = await supabase.from('crm_contacts').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pipeline'] });
    },
  });
}
