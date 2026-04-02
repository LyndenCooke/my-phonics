import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useCreateNote() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { contact_id?: string; deal_id?: string; content: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('crm_notes').insert({
        ...data,
        author_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customer'] });
      queryClient.invalidateQueries({ queryKey: ['admin-deals'] });
    },
  });
}
