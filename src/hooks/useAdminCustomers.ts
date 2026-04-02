import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminCustomer {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string | null;
  children_count: number;
  total_spent_pence: number;
  purchase_count: number;
  has_assessment: boolean;
  last_activity: string | null;
}

export function useAdminCustomers(search?: string) {
  return useQuery({
    queryKey: ['admin-customers', search],
    queryFn: async (): Promise<AdminCustomer[]> => {
      // Fetch all profiles
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (search) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
      }
      const { data: profiles, error: pErr } = await query;
      if (pErr) throw pErr;
      if (!profiles?.length) return [];

      const userIds = profiles.map(p => p.id);

      // Fetch related data in parallel
      const [childrenRes, purchasesRes, assessmentsRes] = await Promise.all([
        supabase.from('children').select('user_id').in('user_id', userIds),
        supabase.from('purchases').select('user_id, amount_paid, completed_at').eq('status', 'completed').in('user_id', userIds),
        supabase.from('assessment_results').select('user_id').in('user_id', userIds),
      ]);

      // Build lookup maps
      const childrenCount = new Map<string, number>();
      (childrenRes.data ?? []).forEach(c => {
        childrenCount.set(c.user_id, (childrenCount.get(c.user_id) ?? 0) + 1);
      });

      const spentMap = new Map<string, { total: number; count: number; last: string | null }>();
      (purchasesRes.data ?? []).forEach(p => {
        const existing = spentMap.get(p.user_id) ?? { total: 0, count: 0, last: null };
        existing.total += p.amount_paid;
        existing.count += 1;
        if (!existing.last || (p.completed_at && p.completed_at > existing.last)) {
          existing.last = p.completed_at;
        }
        spentMap.set(p.user_id, existing);
      });

      const assessedSet = new Set((assessmentsRes.data ?? []).map(a => a.user_id));

      return profiles.map(p => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        created_at: p.created_at,
        children_count: childrenCount.get(p.id) ?? 0,
        total_spent_pence: spentMap.get(p.id)?.total ?? 0,
        purchase_count: spentMap.get(p.id)?.count ?? 0,
        has_assessment: assessedSet.has(p.id),
        last_activity: spentMap.get(p.id)?.last ?? p.created_at,
      }));
    },
  });
}
