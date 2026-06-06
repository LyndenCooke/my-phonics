import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CrmTask {
  id: string;
  contact_id: string | null;
  deal_id: string | null;
  assigned_to: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string | null;
  contact?: { profiles?: { email: string; full_name: string | null } };
}

export function useAdminTasks(filter?: 'all' | 'overdue' | 'mine' | 'completed') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-tasks', filter],
    queryFn: async () => {
      let query = supabase
        .from('crm_tasks')
        .select('*, crm_contacts(profiles(email, full_name))')
        .order('due_date', { ascending: true });

      if (filter === 'completed') {
        query = query.eq('is_completed', true);
      } else if (filter === 'overdue') {
        query = query.eq('is_completed', false).lt('due_date', new Date().toISOString());
      } else if (filter === 'mine' && user) {
        query = query.eq('assigned_to', user.id).eq('is_completed', false);
      } else {
        query = query.eq('is_completed', false);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map(t => ({
        ...t,
        contact: t.crm_contacts as unknown as CrmTask['contact'],
      })) as CrmTask[];
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      profile_id?: string;
      contact_id?: string;
      deal_id?: string;
      assigned_to?: string;
      title: string;
      description?: string;
      due_date?: string;
    }) => {
      const { error } = await supabase.from('crm_tasks').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['admin-customer'] });
    },
  });
}

export function useToggleTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { error } = await supabase
        .from('crm_tasks')
        .update({
          is_completed,
          completed_at: is_completed ? new Date().toISOString() : null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['admin-customer'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('crm_tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['admin-customer'] });
    },
  });
}

export interface PipelineStage { id: string; name: string; colour: string | null; sort_order: number | null; }

export function usePipelineStages() {
  return useQuery({
    queryKey: ['crm-pipeline-stages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_pipeline_stages')
        .select('id, name, colour, sort_order')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as PipelineStage[];
    },
  });
}

export function useUpdateStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ profile_id, stage_id }: { profile_id: string; stage_id: string }) => {
      const { error } = await supabase.from('crm_contacts')
        .update({ stage_id, updated_at: new Date().toISOString() })
        .eq('profile_id', profile_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customer'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pipeline'] });
    },
  });
}
