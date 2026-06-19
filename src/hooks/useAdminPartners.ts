import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// `partners` / `partner_commissions` / mark_partner_commissions_paid were added
// after the last `supabase gen types` run, so they're not in the generated
// Database type yet. Cast the client loosely here only; callers stay typed via
// the Partner interface below. Regenerate types to drop this.
const db = supabase as unknown as {
  from: (table: string) => any;
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
};

export interface Partner {
  id: string;
  code: string;
  email: string;
  partner_name: string | null;
  commission_rate: number;
  discount_rate: number;
  active: boolean;
  created_at: string;
  // derived
  sales_count: number;
  owed_pence: number;
  paid_pence: number;
}

/**
 * Partners = shops/libraries/clubs given a code. The code applies a customer
 * discount at checkout AND accrues commission to the partner's email. Payout is
 * manual for now (mark paid) — Stripe Connect auto-payout is a later phase.
 */
export function useAdminPartners() {
  return useQuery({
    queryKey: ['admin-partners'],
    queryFn: async (): Promise<Partner[]> => {
      const [{ data: partners, error: pErr }, { data: comms, error: cErr }] = await Promise.all([
        db.from('partners').select('*').order('created_at', { ascending: false }),
        db.from('partner_commissions').select('partner_id, commission_pence, paid_out'),
      ]);
      if (pErr) throw pErr;
      if (cErr) throw cErr;

      const agg = new Map<string, { sales: number; owed: number; paid: number }>();
      for (const c of (comms ?? []) as Array<{ partner_id: string; commission_pence: number; paid_out: boolean }>) {
        const a = agg.get(c.partner_id) ?? { sales: 0, owed: 0, paid: 0 };
        a.sales += 1;
        if (c.paid_out) a.paid += c.commission_pence;
        else a.owed += c.commission_pence;
        agg.set(c.partner_id, a);
      }

      return ((partners ?? []) as Partner[]).map((p) => {
        const a = agg.get(p.id) ?? { sales: 0, owed: 0, paid: 0 };
        return { ...p, sales_count: a.sales, owed_pence: a.owed, paid_pence: a.paid } as Partner;
      });
    },
  });
}

export function useCreatePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { code: string; email: string; partner_name?: string }) => {
      const { data, error } = await supabase.functions.invoke('create-partner', { body: input });
      if (error) {
        // On a non-2xx, supabase-js puts the Response in error.context; the real
        // message is in its JSON body, not error.message (which is generic).
        let msg = error.message;
        try {
          const ctx = (error as unknown as { context?: Response }).context;
          if (ctx && typeof ctx.json === 'function') {
            const body = await ctx.json();
            if (body?.error) msg = body.error;
          }
        } catch { /* keep generic message */ }
        throw new Error(msg);
      }
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-partners'] }),
  });
}

export function useMarkPartnerPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (partnerId: string) => {
      const { data, error } = await db.rpc('mark_partner_commissions_paid', { p_partner_id: partnerId });
      if (error) throw error;
      return data as number;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-partners'] }),
  });
}
