/**
 * Pipeline data is DERIVED, not stored. Each profile is classified into
 * exactly one stage based on their purchases + assessment history:
 *
 *   Churned    — has a cancelled subscription and no current active one
 *   Free Trial — has a purchase with subscription_state='trialing'
 *   Subscribed — has a purchase with subscription_state='active'
 *   Purchased  — has any completed one-time purchase (no active sub)
 *   Assessed   — has at least one assessment_results row, no purchase
 *   New Lead   — has a profile only, nothing else
 *
 * Stage names come from the existing crm_pipeline_stages table so the
 * colours and ordering stay editable in the DB. The legacy crm_contacts
 * table is no longer read here — it was a manual store and drifted.
 *
 * Because contacts are derived, there's no useMoveContact / useCreateContact.
 * State follows reality; manual overrides can be added back as a thin
 * exception table if/when needed.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PipelineStage {
  id: string;
  name: string;
  sort_order: number;
  colour: string | null;
}

export interface PipelineContact {
  // Synthetic id — we use the profile id since each profile maps to one
  // contact card. Stage_id is the matched stage from crm_pipeline_stages.
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

// Names must match rows in crm_pipeline_stages exactly.
const STAGE = {
  NEW_LEAD: 'New Lead',
  ASSESSED: 'Assessed',
  FREE_TRIAL: 'Free Trial',
  PURCHASED: 'Purchased',
  SUBSCRIBED: 'Subscribed',
  CHURNED: 'Churned',
} as const;

type PurchaseRow = {
  user_id: string;
  status: string | null;
  subscription_state: string | null;
  stripe_subscription_id: string | null;
  amount_paid: number | null;
  completed_at: string | null;
  created_at: string;
};
type ProfileRow = { id: string; email: string; full_name: string | null; created_at: string | null };
type AssessmentRow = { user_id: string; completed_at: string | null };

export function useAdminPipeline() {
  return useQuery({
    queryKey: ['admin-pipeline'],
    queryFn: async () => {
      const [stagesRes, profilesRes, purchasesRes, assessmentsRes] = await Promise.all([
        supabase.from('crm_pipeline_stages').select('*').order('sort_order'),
        supabase.from('profiles').select('id, email, full_name, created_at'),
        supabase
          .from('purchases')
          .select('user_id, status, subscription_state, stripe_subscription_id, amount_paid, completed_at, created_at')
          .order('created_at', { ascending: false }),
        supabase.from('assessment_results').select('user_id, completed_at'),
      ]);

      if (stagesRes.error) throw stagesRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (purchasesRes.error) throw purchasesRes.error;
      // assessment_results may not be readable under all RLS configs — ignore
      // the error and treat missing data as "no assessment" rather than crash.

      const stages = stagesRes.data as PipelineStage[];
      const stageByName = new Map(stages.map(s => [s.name, s] as const));

      // Index purchases + assessments by user_id for O(1) lookup.
      const purchasesByUser = new Map<string, PurchaseRow[]>();
      for (const p of (purchasesRes.data ?? []) as PurchaseRow[]) {
        const list = purchasesByUser.get(p.user_id) ?? [];
        list.push(p);
        purchasesByUser.set(p.user_id, list);
      }
      const assessedUsers = new Set<string>();
      for (const a of (assessmentsRes.data ?? []) as AssessmentRow[]) {
        assessedUsers.add(a.user_id);
      }

      const contacts: PipelineContact[] = [];
      for (const profile of (profilesRes.data ?? []) as ProfileRow[]) {
        const myPurchases = purchasesByUser.get(profile.id) ?? [];

        // Priority order matters — a user can have multiple historical
        // purchases; classify by their CURRENT state.
        const trialing = myPurchases.find(p => p.subscription_state === 'trialing');
        const active = myPurchases.find(p => p.subscription_state === 'active');
        const cancelled = myPurchases.find(p => p.subscription_state === 'cancelled');
        const oneTimeCompleted = myPurchases.find(
          p => p.status === 'completed' && !p.stripe_subscription_id && (p.amount_paid ?? 0) > 0
        );

        let stageName: string;
        if (active) stageName = STAGE.SUBSCRIBED;
        else if (trialing) stageName = STAGE.FREE_TRIAL;
        else if (oneTimeCompleted) stageName = STAGE.PURCHASED;
        else if (cancelled) stageName = STAGE.CHURNED;
        else if (assessedUsers.has(profile.id)) stageName = STAGE.ASSESSED;
        else stageName = STAGE.NEW_LEAD;

        // Sum amount_paid across COMPLETED rows for a rough lifetime value.
        // Pending/failed rows don't count.
        const ltv = myPurchases
          .filter(p => p.status === 'completed')
          .reduce((sum, p) => sum + (p.amount_paid ?? 0), 0);

        // last_activity_at = max(completed_at) across purchases, fallback to
        // profile.created_at so the card sorts sensibly even for cold leads.
        const lastActivity = myPurchases
          .map(p => p.completed_at)
          .filter((v): v is string => !!v)
          .sort()
          .pop() ?? profile.created_at;

        contacts.push({
          id: profile.id,
          profile_id: profile.id,
          stage_id: stageByName.get(stageName)?.id ?? null,
          source: null,
          tags: [],
          lifetime_value_pence: ltv,
          last_activity_at: lastActivity,
          created_at: profile.created_at,
          profile: { email: profile.email, full_name: profile.full_name },
        });
      }

      return { stages, contacts };
    },
  });
}
