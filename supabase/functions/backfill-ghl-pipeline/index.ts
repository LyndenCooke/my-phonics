import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// One-shot backfill — populates GHL with each existing customer's CURRENT
// state so the user's pipeline workflow (which moves opportunities based
// on tags) has something to react to. Without this step the pipeline
// looks empty because tags only fire on NEW events going forward.
//
// Invoke once with the service-role key in the Authorization header:
//   curl -X POST <function-url> \
//        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
//
// Idempotent: re-running just re-applies the same tags. Safe to retry.
// Delete this function after the backfill is done — it's not needed for
// ongoing operation (the stripe-webhook handles forward events).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) {
      return new Response(JSON.stringify({ error: "Stripe not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth: require a one-off BACKFILL_TOKEN secret in the x-admin-key
    // header. Simpler than checking SUPABASE_SERVICE_ROLE_KEY because
    // there's exactly one valid value (no confusion between anon/secret/
    // publishable keys). Token is rotated/deleted with the function.
    const BACKFILL_TOKEN = Deno.env.get("BACKFILL_TOKEN");
    const provided = (req.headers.get("x-admin-key") ?? "").trim();
    if (!BACKFILL_TOKEN || provided !== BACKFILL_TOKEN) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Allow the caller to dry-run by passing ?dry=1
    const url = new URL(req.url);
    const dry = url.searchParams.get("dry") === "1";

    // ?lookup_email=<email> — debug mode: hit GHL's contact search and
    // return what's actually on the contact (tags, location, customFields).
    // Used to verify whether tags from the webhook/backfill actually landed
    // in the location the user is viewing in GHL.
    const lookupEmail = url.searchParams.get("lookup_email");
    if (lookupEmail) {
      const GHL_API_KEY = Deno.env.get("GHL_API_KEY") ?? "";
      const GHL_LOCATION_ID = Deno.env.get("GHL_LOCATION_ID") ?? "";
      if (!GHL_API_KEY || !GHL_LOCATION_ID) {
        return new Response(
          JSON.stringify({ error: "GHL not configured", GHL_LOCATION_ID }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const searchRes = await fetch(
        `https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(lookupEmail)}`,
        {
          headers: {
            Authorization: `Bearer ${GHL_API_KEY}`,
            Version: "2021-07-28",
          },
        }
      );
      const searchBody = await searchRes.json();
      const contactId = searchBody?.contact?.id ?? null;

      let contactDetail: any = null;
      if (contactId) {
        const detailRes = await fetch(
          `https://services.leadconnectorhq.com/contacts/${contactId}`,
          {
            headers: {
              Authorization: `Bearer ${GHL_API_KEY}`,
              Version: "2021-07-28",
            },
          }
        );
        contactDetail = await detailRes.json();
      }

      return new Response(
        JSON.stringify(
          {
            location_id_used: GHL_LOCATION_ID,
            search_status: searchRes.status,
            search_response: searchBody,
            contact_id: contactId,
            contact_detail: contactDetail,
          },
          null,
          2
        ),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ?lookup_opps=<email> — debug mode that returns every opportunity in
    // the "MyPhonicsBooks Customers" pipeline for the given contact email.
    // Used to investigate duplicate-opportunity / failed-move bugs.
    const lookupOpps = url.searchParams.get("lookup_opps");
    if (lookupOpps) {
      const GHL_API_KEY = Deno.env.get("GHL_API_KEY") ?? "";
      const GHL_LOCATION_ID = Deno.env.get("GHL_LOCATION_ID") ?? "";
      const ghl = (u: string) => fetch(u, {
        headers: { Authorization: `Bearer ${GHL_API_KEY}`, Version: "2021-07-28" },
      });
      const searchRes = await ghl(
        `https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(lookupOpps)}`
      );
      const searchBody = await searchRes.json();
      const contactId = searchBody?.contact?.id ?? null;
      if (!contactId) {
        return new Response(JSON.stringify({ error: "contact not found", searchBody }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Fetch cached pipeline ID from our config table so we don't have to
      // hard-code it. Falls back to listing all opportunities for the contact.
      const sbForLookup = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: cfgRows } = await sbForLookup
        .from("ghl_pipeline_config").select("key, value").eq("key", "pipeline_id");
      const pipelineId = cfgRows?.[0]?.value;
      const oppsUrl = pipelineId
        ? `https://services.leadconnectorhq.com/opportunities/search?location_id=${GHL_LOCATION_ID}&contact_id=${contactId}&pipeline_id=${pipelineId}`
        : `https://services.leadconnectorhq.com/opportunities/search?location_id=${GHL_LOCATION_ID}&contact_id=${contactId}`;
      const oppsRes = await ghl(oppsUrl);
      const oppsBody = await oppsRes.json();
      return new Response(JSON.stringify({ contactId, pipelineId, opportunities: oppsBody?.opportunities ?? oppsBody }, null, 2), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ?list_pipelines=1 — debug mode that returns every pipeline GHL knows
    // about for this location, including stage names. Used to verify the
    // expected "MyPhonicsBooks Customers" pipeline exists with the right
    // stages before ghl-opportunity-sync can bootstrap.
    if (url.searchParams.get("list_pipelines") === "1") {
      const GHL_API_KEY = Deno.env.get("GHL_API_KEY") ?? "";
      const GHL_LOCATION_ID = Deno.env.get("GHL_LOCATION_ID") ?? "";
      const res = await fetch(
        `https://services.leadconnectorhq.com/opportunities/pipelines?locationId=${GHL_LOCATION_ID}`,
        { headers: { Authorization: `Bearer ${GHL_API_KEY}`, Version: "2021-07-28" } }
      );
      const body = await res.json();
      return new Response(JSON.stringify({ status: res.status, body }, null, 2), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ?inspect_sub=<id> — debug mode that returns the raw Stripe subscription
    // for the given subscription ID. Used to verify whether trial-detection
    // in the webhook is working correctly. Returns trial_start/end + status
    // + price + cancellation details.
    const inspectSub = url.searchParams.get("inspect_sub");
    if (inspectSub) {
      const res = await fetch(`https://api.stripe.com/v1/subscriptions/${inspectSub}`, {
        headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
      });
      const body = await res.json();
      return new Response(
        JSON.stringify(
          {
            status_code: res.status,
            subscription: {
              id: body.id,
              status: body.status,
              trial_start: body.trial_start,
              trial_end: body.trial_end,
              current_period_start: body.current_period_start,
              current_period_end: body.current_period_end,
              cancel_at: body.cancel_at,
              canceled_at: body.canceled_at,
              cancellation_details: body.cancellation_details,
              items: body.items?.data?.map((i: any) => ({
                price_id: i.price?.id,
                amount: i.price?.unit_amount,
                interval: i.price?.recurring?.interval,
              })),
            },
            error: body.error ?? null,
          },
          null,
          2
        ),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch purchases, profiles, and products separately rather than via
    // PostgREST relation joins — the schema cache doesn't always pick up
    // the FKs reliably for new functions. Stitching client-side is fast
    // enough at this scale (<a few hundred rows).
    const { data: rawRows, error } = await supabase
      .from("purchases")
      .select("user_id, product_id, status, stripe_subscription_id, stripe_customer_id, completed_at, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIds = Array.from(new Set((rawRows ?? []).map((r) => r.user_id).filter(Boolean)));
    const productIds = Array.from(new Set((rawRows ?? []).map((r) => r.product_id).filter(Boolean)));

    const [profilesRes, productsRes] = await Promise.all([
      userIds.length
        ? supabase.from("profiles").select("id, email, full_name").in("id", userIds)
        : Promise.resolve({ data: [], error: null }),
      productIds.length
        ? supabase.from("products").select("id, name, product_type").in("id", productIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (profilesRes.error || productsRes.error) {
      return new Response(
        JSON.stringify({
          error: profilesRes.error?.message || productsRes.error?.message,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const profileById = new Map<string, { email: string | null; full_name: string | null }>();
    for (const p of profilesRes.data ?? []) {
      profileById.set(p.id, { email: p.email, full_name: p.full_name });
    }
    const productById = new Map<string, { name: string | null; product_type: string | null }>();
    for (const p of productsRes.data ?? []) {
      productById.set(p.id, { name: p.name, product_type: p.product_type });
    }

    type Purchase = {
      user_id: string;
      status: string | null;
      stripe_subscription_id: string | null;
      stripe_customer_id: string | null;
      completed_at: string | null;
      created_at: string;
      product: { name: string | null; product_type: string | null } | null;
      profile: { email: string | null; full_name: string | null } | null;
    };

    const rows: Purchase[] = (rawRows ?? []).map((r) => ({
      user_id: r.user_id,
      status: r.status,
      stripe_subscription_id: r.stripe_subscription_id,
      stripe_customer_id: r.stripe_customer_id,
      completed_at: r.completed_at,
      created_at: r.created_at,
      product: r.product_id ? productById.get(r.product_id) ?? null : null,
      profile: profileById.get(r.user_id) ?? null,
    }));

    // Group by user — we want one classification per user, based on their
    // most recent activity. Most-recent-first sort above means the first
    // row we see per user is the latest one.
    const byUser = new Map<string, Purchase[]>();
    for (const r of (rows ?? []) as Purchase[]) {
      const list = byUser.get(r.user_id) ?? [];
      list.push(r);
      byUser.set(r.user_id, list);
    }

    const summary = {
      total_users: byUser.size,
      free_trial: 0,
      purchased: 0,
      cancelled: 0,
      skipped_no_email: 0,
      skipped_no_completed: 0,
      stripe_errors: 0,
      ghl_errors: 0,
    };
    const detail: Array<{ user_id: string; email: string | null; event: string; reason?: string }> = [];

    async function fetchSub(subId: string): Promise<any | null> {
      try {
        const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
          headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
        });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    }

    async function fireGHL(event: string, data: Record<string, unknown>) {
      if (dry) return { ok: true };
      try {
        const { error } = await supabase.functions.invoke("ghl-sync", {
          body: { event, data },
        });
        if (error) {
          summary.ghl_errors++;
          return { ok: false, err: error.message };
        }
        return { ok: true };
      } catch (err) {
        summary.ghl_errors++;
        return { ok: false, err: (err as Error).message };
      }
    }

    for (const [userId, purchases] of byUser) {
      // Pick the most recent purchase that actually completed (or is a
      // subscription with a stripe_subscription_id). Pending/failed rows
      // don't tell us anything useful about CRM state.
      const latestSub = purchases.find(
        (p) => p.stripe_subscription_id && p.status === "completed"
      );
      const latestOneTime = purchases.find(
        (p) => !p.stripe_subscription_id && p.status === "completed"
      );

      const profile = purchases[0].profile;
      const email = profile?.email ?? null;
      const fullName = profile?.full_name ?? null;

      if (!email) {
        summary.skipped_no_email++;
        detail.push({ user_id: userId, email: null, event: "skipped", reason: "no email" });
        continue;
      }
      if (!latestSub && !latestOneTime) {
        summary.skipped_no_completed++;
        detail.push({ user_id: userId, email, event: "skipped", reason: "no completed purchase" });
        continue;
      }

      // Subscription customers get classified by Stripe's current status —
      // the purchases table may be out of date if a cancel happened outside
      // our webhook (Stripe dashboard, customer portal, dunning).
      if (latestSub?.stripe_subscription_id) {
        const sub = await fetchSub(latestSub.stripe_subscription_id);
        if (!sub) {
          summary.stripe_errors++;
          detail.push({
            user_id: userId,
            email,
            event: "skipped",
            reason: `stripe fetch failed for ${latestSub.stripe_subscription_id}`,
          });
          continue;
        }

        const baseData = {
          email,
          full_name: fullName,
          user_id: userId,
          product_name: latestSub.product?.name ?? null,
          product_type: latestSub.product?.product_type ?? null,
          stripe_customer_id: latestSub.stripe_customer_id,
          stripe_subscription_id: sub.id,
        };

        // Mirror Stripe's current state into purchases.subscription_state
        // so the in-app CRM pipeline can derive Free Trial / Subscribed /
        // Churned without re-hitting Stripe at read time.
        let nextState: string | null = null;
        if (sub.status === "trialing") nextState = "trialing";
        else if (sub.status === "active" || sub.status === "past_due") nextState = "active";
        else if (sub.status === "canceled" || sub.status === "incomplete_expired") nextState = "cancelled";
        if (nextState && !dry) {
          await supabase
            .from("purchases")
            .update({ subscription_state: nextState })
            .eq("stripe_subscription_id", sub.id);
        }

        if (sub.status === "trialing") {
          summary.free_trial++;
          await fireGHL("contact.free_trial", { ...baseData, trial_end: sub.trial_end ?? null });
          detail.push({ user_id: userId, email, event: "contact.free_trial" });
        } else if (sub.status === "active" || sub.status === "past_due") {
          summary.purchased++;
          await fireGHL("contact.purchased", baseData);
          detail.push({ user_id: userId, email, event: "contact.purchased" });
        } else if (sub.status === "canceled" || sub.status === "incomplete_expired") {
          // Decide trial-vs-paid by whether the cancel happened before
          // the trial would have ended.
          const cancelledAtMs = (sub.canceled_at ?? 0) * 1000;
          const trialEndMs = (sub.trial_end ?? 0) * 1000;
          const cancelledDuringTrial = trialEndMs > 0 && cancelledAtMs > 0 && cancelledAtMs < trialEndMs;
          summary.cancelled++;
          await fireGHL("contact.cancelled", {
            ...baseData,
            cancelled_during_trial: cancelledDuringTrial,
            cancellation_reason: sub.cancellation_details?.reason ?? null,
          });
          detail.push({
            user_id: userId,
            email,
            event: "contact.cancelled",
            reason: cancelledDuringTrial ? "during-trial" : "after-paid",
          });
        } else {
          // incomplete / paused / unpaid — skip, not clear what tag fits
          detail.push({ user_id: userId, email, event: "skipped", reason: `sub status=${sub.status}` });
        }
      } else if (latestOneTime) {
        summary.purchased++;
        await fireGHL("contact.purchased", {
          email,
          full_name: fullName,
          user_id: userId,
          product_name: latestOneTime.product?.name ?? null,
          product_type: latestOneTime.product?.product_type ?? null,
          stripe_customer_id: latestOneTime.stripe_customer_id,
        });
        detail.push({ user_id: userId, email, event: "contact.purchased" });
      }
    }

    return new Response(
      JSON.stringify({ dry, summary, detail }, null, 2),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
