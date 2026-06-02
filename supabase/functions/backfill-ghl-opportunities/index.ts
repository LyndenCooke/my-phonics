import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// One-shot backfill that seeds GHL with one opportunity per profile in
// the matching pipeline stage. Mirrors the in-app pipeline classification
// from src/hooks/useAdminPipeline.ts so the GHL board lines up with the
// /admin/pipeline board immediately after the first run.
//
// Calls GHL directly (no function-to-function HTTP hop) to avoid Supabase's
// per-source gateway rate limit. Honors GHL's 429 Retry-After so the run
// survives bursts past GHL's 100 requests / 10 seconds / location budget.
//
// Invoke:
//   curl -X POST <function-url> -H "x-admin-key: $BACKFILL_TOKEN"
//
// Add ?dry=1 to preview without writing to GHL.
// Add ?limit=N to cap the number of profiles processed.

const GHL_API_KEY = Deno.env.get('GHL_API_KEY') ?? '';
const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID') ?? '';
const GHL_BASE = 'https://services.leadconnectorhq.com';
const PIPELINE_NAME = 'MyPhonicsBooks Customers';

const STAGES = [
  'New Lead',
  'Assessed',
  'Free Trial',
  'Purchased',
  'Subscribed',
  'Churned',
] as const;
type Stage = typeof STAGES[number];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-key',
};

const ghlHeaders = (extra: Record<string, string> = {}) => ({
  Authorization: `Bearer ${GHL_API_KEY}`,
  Version: '2021-07-28',
  ...extra,
});

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Fetch wrapper that honors GHL's 429 Retry-After. */
async function ghlFetch(url: string, init?: RequestInit): Promise<Response> {
  let res = await fetch(url, init);
  if (res.status !== 429) return res;
  const retry = res.headers.get('Retry-After') ?? res.headers.get('retry-after');
  const sleepMs = Math.min(25_000, Math.max(500, (retry ? parseFloat(retry) : 1) * 1000));
  await sleep(sleepMs);
  res = await fetch(url, init);
  return res;
}

interface PipelineConfig {
  pipelineId: string;
  stageIds: Record<Stage, string>;
}

async function readConfig(supabase: SupabaseClient): Promise<PipelineConfig | null> {
  const { data } = await supabase.from('ghl_pipeline_config').select('key, value');
  if (!data) return null;
  const map = new Map(data.map((r) => [r.key, r.value]));
  const pipelineId = map.get('pipeline_id');
  if (!pipelineId) return null;
  const stageIds = {} as Record<Stage, string>;
  for (const s of STAGES) {
    const id = map.get(`stage:${s}`);
    if (!id) return null;
    stageIds[s] = id;
  }
  return { pipelineId, stageIds };
}

async function writeConfig(supabase: SupabaseClient, cfg: PipelineConfig) {
  const rows = [
    { key: 'pipeline_id', value: cfg.pipelineId },
    ...STAGES.map((s) => ({ key: `stage:${s}`, value: cfg.stageIds[s] })),
  ];
  await supabase.from('ghl_pipeline_config').upsert(rows, { onConflict: 'key' });
}

async function discoverPipeline(): Promise<PipelineConfig | { error: string }> {
  const res = await ghlFetch(
    `${GHL_BASE}/opportunities/pipelines?locationId=${GHL_LOCATION_ID}`,
    { headers: ghlHeaders() }
  );
  if (!res.ok) return { error: `Pipeline list failed (${res.status})` };
  const body = await res.json();
  const pipeline = (body?.pipelines ?? []).find((p: { name: string }) => p.name === PIPELINE_NAME);
  if (!pipeline) {
    return { error: `Pipeline "${PIPELINE_NAME}" not found in GHL. Create it in Settings → Pipelines with 6 stages: ${STAGES.join(', ')}.` };
  }
  const stageIds = {} as Record<Stage, string>;
  for (const s of STAGES) {
    // Case-insensitive — GHL UI doesn't normalise case on save.
    const found = pipeline.stages.find((x: { name: string }) => x.name.toLowerCase() === s.toLowerCase());
    if (!found) return { error: `Pipeline "${PIPELINE_NAME}" missing stage "${s}"` };
    stageIds[s] = found.id;
  }
  return { pipelineId: pipeline.id, stageIds };
}

async function ensureConfig(supabase: SupabaseClient): Promise<PipelineConfig | { error: string }> {
  const cached = await readConfig(supabase);
  if (cached) return cached;
  const fresh = await discoverPipeline();
  if ('error' in fresh) return fresh;
  await writeConfig(supabase, fresh);
  return fresh;
}

async function findContactId(email: string): Promise<string | null> {
  const res = await ghlFetch(
    `${GHL_BASE}/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(email)}`,
    { headers: ghlHeaders() }
  );
  if (!res.ok) return null;
  const body = await res.json();
  return body?.contact?.id ?? null;
}

async function createContact(email: string, fullName: string | null): Promise<string | null> {
  const [firstName, ...lastParts] = (fullName ?? '').split(' ');
  const lastName = lastParts.join(' ');
  const res = await ghlFetch(`${GHL_BASE}/contacts/`, {
    method: 'POST',
    headers: ghlHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      locationId: GHL_LOCATION_ID,
      email,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      name: fullName || undefined,
      tags: ['myphonicsbooks', 'new-lead'],
    }),
  });
  if (!res.ok) return null;
  const body = await res.json();
  return body?.contact?.id ?? null;
}

async function findOpportunity(contactId: string, pipelineId: string): Promise<{ id: string; pipelineStageId: string } | null> {
  const res = await ghlFetch(
    `${GHL_BASE}/opportunities/search?location_id=${GHL_LOCATION_ID}&contact_id=${contactId}&pipeline_id=${pipelineId}`,
    { headers: ghlHeaders() }
  );
  if (!res.ok) return null;
  const body = await res.json();
  return (body?.opportunities ?? [])[0] ?? null;
}

async function createOpportunity(args: {
  contactId: string;
  pipelineId: string;
  stageId: string;
  name: string;
  monetaryValue?: number;
  status: 'open' | 'won' | 'lost';
}): Promise<boolean> {
  const body: Record<string, unknown> = {
    locationId: GHL_LOCATION_ID,
    pipelineId: args.pipelineId,
    pipelineStageId: args.stageId,
    contactId: args.contactId,
    name: args.name,
    status: args.status,
  };
  if (typeof args.monetaryValue === 'number') body.monetaryValue = args.monetaryValue;
  const res = await ghlFetch(`${GHL_BASE}/opportunities/`, {
    method: 'POST',
    headers: ghlHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  return res.ok;
}

async function updateOpportunity(args: {
  opportunityId: string;
  pipelineId: string;
  stageId: string;
  status: 'open' | 'won' | 'lost';
  monetaryValue?: number;
}): Promise<boolean> {
  const body: Record<string, unknown> = {
    pipelineId: args.pipelineId,
    pipelineStageId: args.stageId,
    status: args.status,
  };
  if (typeof args.monetaryValue === 'number') body.monetaryValue = args.monetaryValue;
  const res = await ghlFetch(`${GHL_BASE}/opportunities/${args.opportunityId}`, {
    method: 'PUT',
    headers: ghlHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  return res.ok;
}

function statusForStage(stage: Stage): 'open' | 'won' | 'lost' {
  if (stage === 'Subscribed' || stage === 'Purchased') return 'won';
  if (stage === 'Churned') return 'lost';
  return 'open';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const BACKFILL_TOKEN = Deno.env.get('BACKFILL_TOKEN');
    const provided = (req.headers.get('x-admin-key') ?? '').trim();
    if (!BACKFILL_TOKEN || provided !== BACKFILL_TOKEN) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      return new Response(JSON.stringify({ error: 'GHL not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const dry = url.searchParams.get('dry') === '1';
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : null;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const cfg = await ensureConfig(supabase);
    if ('error' in cfg) {
      return new Response(JSON.stringify(cfg), {
        status: 412,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [profilesRes, purchasesRes, assessmentsRes] = await Promise.all([
      supabase.from('profiles').select('id, email, full_name'),
      supabase
        .from('purchases')
        .select('user_id, status, subscription_state, stripe_subscription_id, amount_paid, completed_at'),
      supabase.from('assessment_results').select('user_id'),
    ]);
    if (profilesRes.error) throw profilesRes.error;
    if (purchasesRes.error) throw purchasesRes.error;

    const purchasesByUser = new Map<string, typeof purchasesRes.data>();
    for (const p of purchasesRes.data ?? []) {
      const list = purchasesByUser.get(p.user_id) ?? [];
      list.push(p);
      purchasesByUser.set(p.user_id, list);
    }
    const assessedUsers = new Set((assessmentsRes.data ?? []).map((a) => a.user_id));

    const summary = {
      total_profiles: 0,
      new_lead: 0,
      assessed: 0,
      free_trial: 0,
      purchased: 0,
      subscribed: 0,
      churned: 0,
      skipped_no_email: 0,
      errors: 0,
    };
    const detail: Array<{ email: string; stage: Stage; ltv_gbp: number; ok: boolean; action?: string; reason?: string }> = [];

    let processed = 0;
    for (const profile of profilesRes.data ?? []) {
      summary.total_profiles++;
      if (limit !== null && processed >= limit) break;

      if (!profile.email) {
        summary.skipped_no_email++;
        continue;
      }

      const myPurchases = purchasesByUser.get(profile.id) ?? [];
      const trialing = myPurchases.find((p) => p.subscription_state === 'trialing');
      const active = myPurchases.find((p) => p.subscription_state === 'active');
      const cancelled = myPurchases.find((p) => p.subscription_state === 'cancelled');
      const oneTimeCompleted = myPurchases.find(
        (p) => p.status === 'completed' && !p.stripe_subscription_id
      );

      let stage: Stage;
      if (active) stage = 'Subscribed';
      else if (trialing) stage = 'Free Trial';
      else if (oneTimeCompleted) stage = 'Purchased';
      else if (cancelled) stage = 'Churned';
      else if (assessedUsers.has(profile.id)) stage = 'Assessed';
      else stage = 'New Lead';

      const ltvPence = myPurchases
        .filter((p) => p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount_paid ?? 0), 0);
      const ltvGbp = ltvPence / 100;

      const stageKey = (
        stage === 'New Lead' ? 'new_lead' :
        stage === 'Assessed' ? 'assessed' :
        stage === 'Free Trial' ? 'free_trial' :
        stage === 'Purchased' ? 'purchased' :
        stage === 'Subscribed' ? 'subscribed' : 'churned'
      ) as keyof typeof summary;
      summary[stageKey] = (summary[stageKey] as number) + 1;

      if (dry) {
        detail.push({ email: profile.email, stage, ltv_gbp: ltvGbp, ok: true, reason: 'dry-run' });
        processed++;
        continue;
      }

      try {
        let contactId = await findContactId(profile.email);
        if (!contactId) contactId = await createContact(profile.email, profile.full_name);
        if (!contactId) throw new Error('could not resolve GHL contact');

        const stageId = cfg.stageIds[stage];
        const status = statusForStage(stage);
        const opportunityName = profile.full_name?.trim() || profile.email;
        const monetaryValue = ltvGbp > 0 ? ltvGbp : undefined;

        const existing = await findOpportunity(contactId, cfg.pipelineId);
        let action: string;
        if (existing) {
          if (existing.pipelineStageId !== stageId || monetaryValue !== undefined) {
            const ok = await updateOpportunity({
              opportunityId: existing.id,
              pipelineId: cfg.pipelineId,
              stageId,
              status,
              monetaryValue,
            });
            if (!ok) throw new Error('opportunity update failed');
            action = existing.pipelineStageId !== stageId ? 'moved' : 'updated';
          } else {
            action = 'noop';
          }
        } else {
          const ok = await createOpportunity({
            contactId,
            pipelineId: cfg.pipelineId,
            stageId,
            name: opportunityName,
            monetaryValue,
            status,
          });
          if (!ok) throw new Error('opportunity create failed');
          action = 'created';
        }
        detail.push({ email: profile.email, stage, ltv_gbp: ltvGbp, ok: true, action });
      } catch (err) {
        summary.errors++;
        detail.push({ email: profile.email, stage, ltv_gbp: ltvGbp, ok: false, reason: (err as Error).message });
      }
      processed++;

      // Spread requests to stay well under GHL's 100 req / 10s location
      // budget (each row makes 2-4 GHL calls). 150ms × 54 ≈ 8s extra,
      // total run ~25-35s, comfortable inside 60s budget.
      await sleep(150);
    }

    return new Response(
      JSON.stringify({ dry, processed, summary, detail }, null, 2),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
