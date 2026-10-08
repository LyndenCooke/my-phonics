/**
 * Premium + founding members (2026-10-05).
 *
 *   free     — 1 book and 5 worksheets per rolling 7 days
 *   premium  — unlimited, including whole-pack worksheet PDFs
 *
 * The first 500 accounts are founding members: Premium for life, free. After
 * that Premium is a one-off £4.99. All of the rules live in Postgres
 * (migration 20261005120000_premium_founding_500.sql); this module only asks.
 * Entitlement is never decided from build-time flags — see the 2026-05-20
 * outage note in Index.tsx.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const PREMIUM_PRICE_LABEL = '£4.99';

export type FoundingSpots = { total: number; claimed: number; remaining: number };

export type DownloadPlan = {
  plan: 'free' | 'premium';
  premium_reason: 'founding' | 'paid' | 'admin' | null;
  founding_number: number | null;
  limits: { books: number; worksheets: number };
  used: { books: number; worksheets: number };
  spots: FoundingSpots;
  /** True only on the call that claimed this account's founding spot. */
  just_claimed?: boolean;
};

export type DownloadKind = 'book' | 'worksheet' | 'worksheet_pack';

export type DownloadDecision =
  | { allowed: true; plan?: DownloadPlan }
  | { allowed: false; reason: 'sign_in' | 'limit' | 'premium_only'; next_at?: string | null; plan?: DownloadPlan };

// The generated Supabase types predate these functions.
const rpc = supabase.rpc.bind(supabase) as unknown as (
  fn: string,
  args?: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string } | null }>;

/** The public tally. Works signed out. */
export function useFoundingSpots() {
  return useQuery({
    queryKey: ['founding_spots'],
    queryFn: async () => {
      const { data, error } = await rpc('founding_spots');
      if (error) throw new Error(error.message);
      return data as FoundingSpots;
    },
    staleTime: 60_000,
  });
}

/** The signed-in account's plan. First call claims a founding spot if any are left. */
export function useDownloadPlan() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['download_plan', user?.id],
    queryFn: async () => {
      const { data, error } = await rpc('get_download_plan');
      if (error) throw new Error(error.message);
      return data as DownloadPlan;
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

/** Asks the server whether this download is within the plan, and logs it if so. */
export async function requestDownload(kind: DownloadKind, item: string): Promise<DownloadDecision> {
  const { data, error } = await rpc('request_download', { p_kind: kind, p_item: item });
  if (error) throw new Error(error.message);
  return data as DownloadDecision;
}

/**
 * Opens Stripe Checkout for "Premium for life". Requires a signed-in session.
 * Resolves once the redirect has been kicked off; throws on failure.
 */
export async function startPremiumCheckout(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Please sign in first.');
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ premium: true }),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.url) throw new Error(data?.error || 'Could not start checkout');
  window.location.href = data.url;
}
