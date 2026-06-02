import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Mirrors the in-app CRM Pipeline (src/hooks/useAdminPipeline.ts) into GHL
// as a real opportunity pipeline. One opportunity per profile, stage moves
// in lockstep with contact lifecycle events fired from ghl-sync.
//
// Self-bootstrapping: on first call we look up the pipeline in GHL by name.
// If missing, we attempt to create it via the API; if that's denied (Private
// Integration Tokens may lack the scope), the response tells the caller to
// create it in the GHL UI with the exact stage names below. IDs are cached
// in public.ghl_pipeline_config so we don't re-query GHL on every event.

const GHL_API_KEY = Deno.env.get('GHL_API_KEY') ?? '';
const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID') ?? '';
const GHL_BASE = 'https://services.leadconnectorhq.com';
const PIPELINE_NAME = 'MyPhonicsBooks Customers';

// Must match the names in public.crm_pipeline_stages so the in-app board
// and GHL stay in lockstep. Order = sort_order from the DB.
const STAGES = [
  'New Lead',
  'Assessed',
  'Free Trial',
  'Purchased',
  'Subscribed',
  'Churned',
] as const;
type StageName = typeof STAGES[number];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncPayload {
  email: string;
  full_name?: string | null;
  stage: StageName;
  // Optional opportunity fields — drive the GHL card.
  monetary_value?: number;        // GBP, not pence
  status?: 'open' | 'won' | 'lost' | 'abandoned';
  source?: string | null;         // e.g. "assessment-funnel"
  acquisition?: string | null;    // paid / voucher / referral / trial
}

const ghlHeaders = (extra: Record<string, string> = {}) => ({
  Authorization: `Bearer ${GHL_API_KEY}`,
  Version: '2021-07-28',
  ...extra,
});

/**
 * Wrapped fetch that honors GHL's 429 Retry-After. The rolling
 * 100-requests-per-10s location quota trips easily during backfills;
 * retrying once with the server-specified delay turns rate-limit errors
 * into mild latency instead of dropped rows. Capped at 25s sleep to
 * stay inside Supabase's 60s function budget.
 */
async function ghlFetch(url: string, init?: RequestInit): Promise<Response> {
  let res = await fetch(url, init);
  if (res.status !== 429) return res;
  const retryAfterHeader = res.headers.get('Retry-After') ?? res.headers.get('retry-after');
  const retryAfterSec = retryAfterHeader ? parseFloat(retryAfterHeader) : 1;
  const sleepMs = Math.min(25_000, Math.max(500, retryAfterSec * 1000));
  await new Promise((r) => setTimeout(r, sleepMs));
  res = await fetch(url, init);
  return res;
}

interface PipelineConfig {
  pipelineId: string;
  stageIds: Record<StageName, string>;
}

/** Read cached pipeline + stage IDs from Supabase. Returns null if not bootstrapped. */
async function readConfig(supabase: SupabaseClient): Promise<PipelineConfig | null> {
  const { data, error } = await supabase
    .from('ghl_pipeline_config')
    .select('key, value');
  if (error || !data) return null;
  const map = new Map(data.map((r) => [r.key, r.value]));
  const pipelineId = map.get('pipeline_id');
  if (!pipelineId) return null;
  const stageIds = {} as Record<StageName, string>;
  for (const s of STAGES) {
    const id = map.get(`stage:${s}`);
    if (!id) return null; // partial config = unbootstrapped
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

/** Find a pipeline by name in this GHL location. */
async function findPipelineByName(name: string): Promise<{ id: string; stages: Array<{ id: string; name: string }> } | null> {
  const res = await ghlFetch(
    `${GHL_BASE}/opportunities/pipelines?locationId=${GHL_LOCATION_ID}`,
    { headers: ghlHeaders() }
  );
  if (!res.ok) return null;
  const body = await res.json();
  const pipelines: Array<{ id: string; name: string; stages: Array<{ id: string; name: string }> }> =
    body?.pipelines ?? [];
  return pipelines.find((p) => p.name === name) ?? null;
}

/**
 * Attempt to create the pipeline via API. GHL only exposes pipeline
 * creation on certain plans / OAuth scopes — Private Integration Tokens
 * typically can't. We try, and surface the error if it fails so the
 * caller knows to create in the UI.
 */
async function tryCreatePipeline(): Promise<{ id: string; stages: Array<{ id: string; name: string }> } | { error: string }> {
  const body = {
    locationId: GHL_LOCATION_ID,
    name: PIPELINE_NAME,
    stages: STAGES.map((s, i) => ({ name: s, position: i + 1 })),
  };
  const res = await ghlFetch(`${GHL_BASE}/opportunities/pipelines/`, {
    method: 'POST',
    headers: ghlHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    return { error: `GHL pipeline create failed (${res.status}): ${await res.text()}` };
  }
  const created = await res.json();
  return created?.pipeline ?? created;
}

/**
 * Discover or create the pipeline. Returns cached config when available.
 * On miss, looks up by name → creates if absent → caches IDs.
 */
async function ensureConfig(supabase: SupabaseClient): Promise<PipelineConfig | { error: string; needsManualSetup?: boolean }> {
  const cached = await readConfig(supabase);
  if (cached) return cached;

  let pipeline = await findPipelineByName(PIPELINE_NAME);
  if (!pipeline) {
    const created = await tryCreatePipeline();
    if ('error' in created) {
      return {
        error: `Pipeline "${PIPELINE_NAME}" not found and could not be auto-created. ${created.error}. Create it manually in GHL Settings → Pipelines with these stages in order: ${STAGES.join(', ')}.`,
        needsManualSetup: true,
      };
    }
    pipeline = created as { id: string; stages: Array<{ id: string; name: string }> };
  }

  // Resolve stage IDs by name (case-insensitive — GHL UI lets users save
  // "assessed" or "Assessed" interchangeably and we don't want a casing
  // mismatch to break the integration). If any expected stage is missing,
  // surface that — better to fail loudly than silently drop a stage.
  const stageIds = {} as Record<StageName, string>;
  for (const s of STAGES) {
    const found = pipeline.stages.find((x) => x.name.toLowerCase() === s.toLowerCase());
    if (!found) {
      return {
        error: `Pipeline "${PIPELINE_NAME}" exists but is missing stage "${s}". Expected stages in order: ${STAGES.join(', ')}.`,
        needsManualSetup: true,
      };
    }
    stageIds[s] = found.id;
  }

  const cfg: PipelineConfig = { pipelineId: pipeline.id, stageIds };
  await writeConfig(supabase, cfg);
  return cfg;
}

/** Look up the GHL contact id for an email. */
async function findContactId(email: string): Promise<string | null> {
  const res = await ghlFetch(
    `${GHL_BASE}/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(email)}`,
    { headers: ghlHeaders() }
  );
  if (!res.ok) return null;
  const body = await res.json();
  return body?.contact?.id ?? null;
}

/**
 * Create a GHL contact when the opportunity sync is called for an email
 * we've never seen. Mostly used by the backfill — for forward events,
 * ghl-sync usually creates the contact first. Lets us avoid a double
 * function invocation per backfill row (which was timing out at 54×).
 */
async function createContactMinimal(email: string, fullName: string | null | undefined): Promise<string | null> {
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
  if (!res.ok) {
    console.error('GHL contact create (opportunity-sync) failed:', await res.text());
    return null;
  }
  const body = await res.json();
  return body?.contact?.id ?? null;
}

/**
 * Find an existing opportunity for this contact in our pipeline so we can
 * update-in-place instead of creating duplicates. GHL's search endpoint
 * lets us filter by contact_id + pipeline_id directly.
 */
async function findOpportunity(contactId: string, pipelineId: string): Promise<{ id: string; pipelineStageId: string } | null> {
  const url = `${GHL_BASE}/opportunities/search?location_id=${GHL_LOCATION_ID}&contact_id=${contactId}&pipeline_id=${pipelineId}`;
  const res = await fetch(url, { headers: ghlHeaders() });
  if (!res.ok) return null;
  const body = await res.json();
  const opps: Array<{ id: string; pipelineStageId: string }> = body?.opportunities ?? [];
  return opps[0] ?? null;
}

async function createOpportunity(args: {
  contactId: string;
  pipelineId: string;
  stageId: string;
  name: string;
  monetaryValue?: number;
  status: 'open' | 'won' | 'lost' | 'abandoned';
  source?: string | null;
}): Promise<string | null> {
  const body: Record<string, unknown> = {
    locationId: GHL_LOCATION_ID,
    pipelineId: args.pipelineId,
    pipelineStageId: args.stageId,
    contactId: args.contactId,
    name: args.name,
    status: args.status,
  };
  if (typeof args.monetaryValue === 'number') body.monetaryValue = args.monetaryValue;
  if (args.source) body.source = args.source;
  const res = await ghlFetch(`${GHL_BASE}/opportunities/`, {
    method: 'POST',
    headers: ghlHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error('GHL opportunity create failed:', await res.text());
    return null;
  }
  const created = await res.json();
  return created?.opportunity?.id ?? created?.id ?? null;
}

async function updateOpportunity(args: {
  opportunityId: string;
  pipelineId: string;
  stageId: string;
  status?: 'open' | 'won' | 'lost' | 'abandoned';
  monetaryValue?: number;
  name?: string;
}): Promise<boolean> {
  const body: Record<string, unknown> = {
    pipelineId: args.pipelineId,
    pipelineStageId: args.stageId,
  };
  if (args.status) body.status = args.status;
  if (typeof args.monetaryValue === 'number') body.monetaryValue = args.monetaryValue;
  if (args.name) body.name = args.name;
  const res = await ghlFetch(`${GHL_BASE}/opportunities/${args.opportunityId}`, {
    method: 'PUT',
    headers: ghlHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error('GHL opportunity update failed:', await res.text());
    return false;
  }
  return true;
}

/** Default status per stage. Subscribed/Purchased = won, Churned = lost. */
function statusForStage(stage: StageName): 'open' | 'won' | 'lost' {
  if (stage === 'Subscribed' || stage === 'Purchased') return 'won';
  if (stage === 'Churned') return 'lost';
  return 'open';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      return new Response(JSON.stringify({ error: 'GHL not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const cfg = await ensureConfig(supabase);
    if ('error' in cfg) {
      return new Response(JSON.stringify(cfg), {
        status: cfg.needsManualSetup ? 412 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = (await req.json()) as SyncPayload;
    const { email, full_name, stage, monetary_value, status, source, acquisition } = payload;

    if (!email || !stage || !STAGES.includes(stage)) {
      return new Response(
        JSON.stringify({ error: 'Required: email + stage (one of ' + STAGES.join(', ') + ')' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stageId = cfg.stageIds[stage];
    let contactId = await findContactId(email);
    if (!contactId) {
      // Auto-create the contact so backfill / one-off scripts don't have
      // to do a separate ghl-sync call (which caused nested-invocation
      // timeouts at scale). Forward lifecycle events still go through
      // ghl-sync, which handles tags + custom fields more richly.
      contactId = await createContactMinimal(email, full_name ?? null);
      if (!contactId) {
        return new Response(
          JSON.stringify({ error: `Could not create GHL contact for ${email}` }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const finalStatus = status ?? statusForStage(stage);
    const opportunityName = full_name?.trim() || email;

    const existing = await findOpportunity(contactId, cfg.pipelineId);
    let opportunityId: string | null;
    let action: 'created' | 'moved' | 'noop' | 'protected';

    if (existing) {
      // Protect against backward moves to New Lead. contact.created fires
      // on every login (AuthContext), and without this guard would drag
      // every existing opportunity back to New Lead. New Lead is a starting
      // stage only — once an opportunity has progressed (Assessed, Free
      // Trial, Purchased, Subscribed, Churned), it stays.
      if (stage === 'New Lead' && existing.pipelineStageId !== cfg.stageIds['New Lead']) {
        return new Response(
          JSON.stringify({ success: true, action: 'protected', opportunityId: existing.id, stage }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // If they're already in the right stage with no value change, skip
      // the PUT to keep GHL audit logs tidy.
      const needsMove = existing.pipelineStageId !== stageId;
      const needsValue = typeof monetary_value === 'number';
      if (needsMove || needsValue) {
        await updateOpportunity({
          opportunityId: existing.id,
          pipelineId: cfg.pipelineId,
          stageId,
          status: finalStatus,
          monetaryValue: monetary_value,
          name: opportunityName,
        });
        action = needsMove ? 'moved' : 'noop';
      } else {
        action = 'noop';
      }
      opportunityId = existing.id;
    } else {
      opportunityId = await createOpportunity({
        contactId,
        pipelineId: cfg.pipelineId,
        stageId,
        name: opportunityName,
        monetaryValue: monetary_value,
        status: finalStatus,
        source: source ?? null,
      });
      action = 'created';
    }

    // Acquisition (paid/voucher/referral/trial) is carried as a contact
    // tag rather than an opportunity field because GHL opportunities don't
    // have native tag support. The tag is already managed by ghl-sync
    // events — passing it here would duplicate that work.
    void acquisition;

    return new Response(
      JSON.stringify({ success: true, action, opportunityId, stage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('ghl-opportunity-sync error:', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
