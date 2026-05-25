/**
 * Abandoned-checkout queue — pending purchases with a stripe_session_id
 * older than 30 minutes (filter window keeps in-flight checkouts out of
 * the list). The user can fire a recovery email per-row or batch.
 *
 * Pending rows WITHOUT a stripe_session_id are pre-Stripe placeholders
 * (free sample flow, etc.) and don't count as abandoned checkouts.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AbandonedCheckout {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  product_name: string | null;
  product_type: string | null;
  amount_pence: number;
  stripe_session_id: string;
  created_at: string;
  age_hours: number;
}

const STALE_MINUTES = 30;

export function useAbandonedCheckouts() {
  return useQuery({
    queryKey: ['admin-abandoned-checkouts'],
    queryFn: async () => {
      const staleBefore = new Date(Date.now() - STALE_MINUTES * 60_000).toISOString();
      const { data: rows, error } = await supabase
        .from('purchases')
        .select('id, user_id, product_id, amount_paid, stripe_session_id, created_at, status, dismissed_from_recovery_at, dismissed_from_recovery_reason')
        .eq('status', 'pending')
        .not('stripe_session_id', 'is', null)
        .is('dismissed_from_recovery_at', null)
        .lt('created_at', staleBefore)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userIds = Array.from(new Set((rows ?? []).map(r => r.user_id).filter(Boolean)));
      const productIds = Array.from(new Set((rows ?? []).map(r => r.product_id).filter(Boolean)));

      const [profilesRes, productsRes] = await Promise.all([
        userIds.length
          ? supabase.from('profiles').select('id, email, full_name').in('id', userIds)
          : Promise.resolve({ data: [], error: null }),
        productIds.length
          ? supabase.from('products').select('id, name, product_type').in('id', productIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const profileById = new Map<string, { email: string; full_name: string | null }>(
        (profilesRes.data ?? []).map(p => [p.id, { email: p.email, full_name: p.full_name }])
      );
      const productById = new Map<string, { name: string; product_type: string }>(
        (productsRes.data ?? []).map(p => [p.id, { name: p.name, product_type: p.product_type }])
      );

      const now = Date.now();
      const items: AbandonedCheckout[] = (rows ?? []).map(r => {
        const profile = profileById.get(r.user_id);
        const product = r.product_id ? productById.get(r.product_id) : undefined;
        const ageHours = (now - new Date(r.created_at).getTime()) / 3_600_000;
        return {
          id: r.id,
          user_id: r.user_id,
          email: profile?.email ?? null,
          full_name: profile?.full_name ?? null,
          product_name: product?.name ?? null,
          product_type: product?.product_type ?? null,
          amount_pence: r.amount_paid ?? 0,
          stripe_session_id: r.stripe_session_id!,
          created_at: r.created_at,
          age_hours: Math.round(ageHours * 10) / 10,
        };
      });

      return items;
    },
    // Polling because new abandonments arrive continuously and stale data
    // here directly costs money. Light query — 4 fields, one filter.
    refetchInterval: 60_000,
  });
}

export function useDismissRecovery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ purchaseId, reason }: { purchaseId: string; reason?: string }) => {
      const { error } = await supabase
        .from('purchases')
        .update({
          dismissed_from_recovery_at: new Date().toISOString(),
          dismissed_from_recovery_reason: reason ?? null,
        })
        .eq('id', purchaseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-abandoned-checkouts'] });
    },
  });
}

export function useUndoDismiss() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (purchaseId: string) => {
      const { error } = await supabase
        .from('purchases')
        .update({
          dismissed_from_recovery_at: null,
          dismissed_from_recovery_reason: null,
        })
        .eq('id', purchaseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-abandoned-checkouts'] });
    },
  });
}

export function useDismissedCheckouts() {
  return useQuery({
    queryKey: ['admin-dismissed-checkouts'],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('purchases')
        .select('id, user_id, product_id, amount_paid, stripe_session_id, created_at, status, dismissed_from_recovery_at, dismissed_from_recovery_reason')
        .not('dismissed_from_recovery_at', 'is', null)
        .order('dismissed_from_recovery_at', { ascending: false })
        .limit(50);
      if (error) throw error;

      const userIds = Array.from(new Set((rows ?? []).map(r => r.user_id).filter(Boolean)));
      const productIds = Array.from(new Set((rows ?? []).map(r => r.product_id).filter(Boolean)));

      const [profilesRes, productsRes] = await Promise.all([
        userIds.length
          ? supabase.from('profiles').select('id, email, full_name').in('id', userIds)
          : Promise.resolve({ data: [], error: null }),
        productIds.length
          ? supabase.from('products').select('id, name, product_type').in('id', productIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const profileById = new Map<string, { email: string; full_name: string | null }>(
        (profilesRes.data ?? []).map(p => [p.id, { email: p.email, full_name: p.full_name }])
      );
      const productById = new Map<string, { name: string; product_type: string }>(
        (productsRes.data ?? []).map(p => [p.id, { name: p.name, product_type: p.product_type }])
      );

      return (rows ?? []).map(r => {
        const profile = profileById.get(r.user_id);
        const product = r.product_id ? productById.get(r.product_id) : undefined;
        return {
          id: r.id,
          user_id: r.user_id,
          email: profile?.email ?? null,
          full_name: profile?.full_name ?? null,
          product_name: product?.name ?? null,
          product_type: product?.product_type ?? null,
          amount_pence: r.amount_paid ?? 0,
          stripe_session_id: r.stripe_session_id!,
          created_at: r.created_at,
          dismissed_at: r.dismissed_from_recovery_at,
          dismissed_reason: r.dismissed_from_recovery_reason,
        };
      });
    },
  });
}

export function useSendRecoveryEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (row: AbandonedCheckout) => {
      if (!row.email) throw new Error('No email for this user — cannot send');
      const { error } = await supabase.functions.invoke('ghl-sync', {
        body: {
          event: 'contact.abandoned_checkout',
          data: {
            email: row.email,
            full_name: row.full_name,
            product_name: row.product_name,
            product_type: row.product_type,
            amount_pence: row.amount_pence,
            stripe_session_id: row.stripe_session_id,
          },
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-abandoned-checkouts'] });
    },
  });
}
