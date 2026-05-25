/**
 * Notes attach directly to a profile (the customer) or to a specific
 * purchase row (e.g. "called about this abandoned checkout"). The legacy
 * contact_id column on crm_notes is left in place for old rows but new
 * inserts go through profile_id / purchase_id.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CrmNote {
  id: string;
  profile_id: string | null;
  purchase_id: string | null;
  content: string;
  author_id: string | null;
  created_at: string | null;
}

export function useCreateNote() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { profile_id?: string; purchase_id?: string; content: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('crm_notes').insert({
        ...data,
        author_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-customer'] });
      queryClient.invalidateQueries({ queryKey: ['admin-deals'] });
      if (vars.purchase_id) {
        queryClient.invalidateQueries({ queryKey: ['admin-notes-purchase', vars.purchase_id] });
      }
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase.from('crm_notes').delete().eq('id', noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customer'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notes-purchase'] });
    },
  });
}

export function useNotesForPurchase(purchaseId: string | undefined) {
  return useQuery({
    queryKey: ['admin-notes-purchase', purchaseId],
    enabled: !!purchaseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_notes')
        .select('id, profile_id, purchase_id, content, author_id, created_at')
        .eq('purchase_id', purchaseId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as CrmNote[];
    },
  });
}
