import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsData {
  totalCustomers: number;
  totalRevenuePence: number;
  totalPurchases: number;
  totalAssessments: number;
  activeReaders7d: number;
  dailySignups: { day: string; signup_count: number }[];
  dailyRevenue: { day: string; total_pence: number; tx_count: number }[];
  recentActivity: {
    type: 'signup' | 'purchase' | 'assessment';
    email: string;
    detail: string;
    date: string;
  }[];
}

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async (): Promise<AnalyticsData> => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [profilesRes, purchasesRes, assessmentsRes, signupsRes, revenueRes, recentReadersRes, recentSignupsRes, recentPurchasesRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('purchases').select('amount_paid').eq('status', 'completed'),
        supabase.from('assessment_results').select('id', { count: 'exact', head: true }),
        supabase.from('admin_daily_signups').select('*').order('day', { ascending: true }),
        supabase.from('admin_daily_revenue').select('*').order('day', { ascending: true }),
        supabase.from('reading_streaks').select('user_id').gte('activity_date', sevenDaysAgo.split('T')[0]),
        supabase.from('profiles').select('email, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('purchases').select('user_id, amount_paid, completed_at, profiles(email)').eq('status', 'completed').order('completed_at', { ascending: false }).limit(5),
      ]);

      const totalRevenuePence = (purchasesRes.data ?? []).reduce((sum, p) => sum + p.amount_paid, 0);
      const uniqueReaders = new Set((recentReadersRes.data ?? []).map(r => r.user_id));

      const recentActivity: AnalyticsData['recentActivity'] = [];

      (recentSignupsRes.data ?? []).forEach(p => {
        recentActivity.push({
          type: 'signup',
          email: p.email,
          detail: 'Signed up',
          date: p.created_at ?? '',
        });
      });

      (recentPurchasesRes.data ?? []).forEach(p => {
        const profile = p.profiles as unknown as { email: string } | null;
        recentActivity.push({
          type: 'purchase',
          email: profile?.email ?? 'Unknown',
          detail: `Purchased - £${(p.amount_paid / 100).toFixed(2)}`,
          date: p.completed_at ?? '',
        });
      });

      recentActivity.sort((a, b) => (b.date > a.date ? 1 : -1));

      return {
        totalCustomers: profilesRes.count ?? 0,
        totalRevenuePence,
        totalPurchases: purchasesRes.data?.length ?? 0,
        totalAssessments: assessmentsRes.count ?? 0,
        activeReaders7d: uniqueReaders.size,
        dailySignups: (signupsRes.data ?? []).map(d => ({
          day: d.day ?? '',
          signup_count: d.signup_count ?? 0,
        })),
        dailyRevenue: (revenueRes.data ?? []).map(d => ({
          day: d.day ?? '',
          total_pence: d.total_pence ?? 0,
          tx_count: d.tx_count ?? 0,
        })),
        recentActivity: recentActivity.slice(0, 10),
      };
    },
  });
}
