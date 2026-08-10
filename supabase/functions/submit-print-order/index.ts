// submit-print-order
//
// Submits ONE book to Bookvault's print-on-demand API and logs the result
// to print_orders. Called ONLY by stripe-webhook (service-role client,
// with an internal shared-secret header — see the auth check below) and
// directly by scripts/test_print_fulfilment.mjs for pipeline testing via
// the deployed stripe-webhook endpoint, never this function directly.
//
// ┌──────────────────────────────────────────────────────────────────────┐
// │ callBookvaultApi() below is built against Bookvault's real public     │
// │ OpenAPI spec (api.bookvault.app/v3), not a guess — see the comment    │
// │ directly above the function for what was verified, what's still an   │
// │ open question, and where each value came from.                       │
// └──────────────────────────────────────────────────────────────────────┘
//
// Idempotency: the print_orders table has a UNIQUE (stripe_session_id,
// book_slug) constraint, used as an insert-or-fetch backstop. But the real
// concurrency guard is the atomic CLAIM step below — an UPDATE that only
// succeeds if status is still 'pending' or 'failed', moving it to
// 'processing' before Bookvault is ever called. If two requests race for
// the same row, only one UPDATE can win (Postgres serialises row updates);
// the loser sees 0 rows affected and skips the Bookvault call entirely.
// This is what actually prevents a duplicate physical order — a plain
// SELECT-then-decide (as this file used to do) does not, because two
// concurrent reads can both observe 'pending' before either writes.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

interface SubmitPrintOrderRequest {
  stripe_session_id: string;
  stripe_payment_intent_id?: string | null;
  purchase_id?: string | null;
  user_id?: string | null;
  book_slug: string;
  quantity?: number;
  shipping_name?: string | null;
  shipping_phone?: string | null;
  shipping_email?: string | null;
  shipping_address?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
  } | null;
}

interface ShippingAddress {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
}

// ─── Notify Lynden on failure ───────────────────────────────────────────
// Always logs clearly to the Supabase Edge Function log (grep for
// "[PRINT ORDER FAILED]"). Additionally sends an email via Resend IF
// RESEND_API_KEY and PRINT_ALERT_EMAIL are both set as function secrets —
// entirely optional, skipped silently (with a log line) if not configured.
// No other email provider is wired up anywhere in this codebase today, so
// Resend is a guess at what you'd want to use, not something confirmed —
// swap this out freely if you use something else.
async function notifyFailure(context: {
  stripeSessionId: string;
  bookSlug: string;
  reason: string;
  detail?: unknown;
}) {
  console.error(
    "[PRINT ORDER FAILED] manual fulfilment needed —",
    "session:", context.stripeSessionId,
    "book:", context.bookSlug,
    "reason:", context.reason,
    "detail:", JSON.stringify(context.detail ?? null)
  );

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const PRINT_ALERT_EMAIL = Deno.env.get("PRINT_ALERT_EMAIL");
  if (!RESEND_API_KEY || !PRINT_ALERT_EMAIL) {
    console.log("[PRINT ORDER FAILED] email alert not configured (RESEND_API_KEY / PRINT_ALERT_EMAIL unset) — Supabase log is the only alert for this failure.");
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MyPhonicsBooks Fulfilment <alerts@myphonicsbooks.co.uk>",
        to: [PRINT_ALERT_EMAIL],
        subject: `Print order failed — manual fulfilment needed (${context.bookSlug})`,
        text: [
          `A Bookvault print order failed and needs fulfilling manually.`,
          ``,
          `Stripe session: ${context.stripeSessionId}`,
          `Book slug: ${context.bookSlug}`,
          `Reason: ${context.reason}`,
          `Detail: ${JSON.stringify(context.detail ?? null, null, 2)}`,
        ].join("\n"),
      }),
    });
    if (!res.ok) {
      console.error("[PRINT ORDER FAILED] Resend alert email itself failed to send:", res.status, await res.text());
    }
  } catch (err) {
    console.error("[PRINT ORDER FAILED] Resend alert email threw:", err);
  }
}

// A blank/missing shipping address used to be submitted to Bookvault as
// empty strings and silently marked 'submitted' as if it had succeeded —
// this is the pre-flight gate that stops that. Only the fields Bookvault's
// OrderAddress actually requires (Addressee/Address1/Town/County) are
// checked; Postcode's requirement is country-dependent on Bookvault's side
// so we don't hard-require it here, but we do require SOME address was
// collected at all.
function validateShippingAddress(name: string | null, address: ShippingAddress | null): string | null {
  if (!address) return "No shipping address was collected for this order";
  if (!address.line1?.trim()) return "Shipping address is missing line1";
  if (!address.city?.trim()) return "Shipping address is missing city/town";
  if (!name?.trim()) return "Shipping address is missing a recipient name";
  return null;
}

// ─── Bookvault API call ──────────────────────────────────────────────────
// Verified against Bookvault's real public OpenAPI spec
// (https://api.bookvault.app/v3/swagger/docs/v3, discovered via
// https://help.bookvault.app/api-setup on 2026-07-11) — this is no longer
// a guess at the shape. Two things remain genuinely unresolvable without
// info only Lynden has, both fail closed (clear error, no request sent)
// until set:
//   - BOOKVAULT_PAY_METHOD: the API requires one of Credit/Upfront/Draft/
//     Saved on every order. This is a billing setup choice tied to your
//     Bookvault account (e.g. do you have a credit line, or pay per order
//     on a card on file?) — not something derivable from the docs.
//   - Everything else defaults sensibly but is a secret, so it's a
//     one-line change (no redeploy) if it needs adjusting: dispatch
//     service, base URL.
//
// One address-shape risk worth testing before relying on it: Bookvault's
// OrderAddress requires Addressee/Address1/Town/County. Stripe's UK
// address collection does NOT reliably populate a "state/county" value
// for GB addresses (the field isn't shown in Stripe's UK address form),
// so County may arrive empty. Falls back to Town below so the field is
// never literally blank, but confirm with a real test order whether
// Bookvault actually enforces County for GB — the spec doesn't say either
// way (per-country requirements live server-side, not in the schema).
async function callBookvaultApi(params: {
  bookvaultTitleId: string; // 13-digit ISBN — Bookvault's OrderLines reference titles by ISBN, not an opaque ID
  quantity: number;
  shippingName: string | null;
  shippingPhone: string | null;
  shippingEmail: string | null;
  shippingAddress: ShippingAddress | null;
  externalReference: string; // -> Order.DocRef, max 90 chars
}): Promise<{ ok: true; response: unknown; bookvaultOrderId: string | null } | { ok: false; response: unknown; error: string }> {
  const BOOKVAULT_API_KEY = Deno.env.get("BOOKVAULT_API_KEY");
  const BOOKVAULT_API_BASE_URL = Deno.env.get("BOOKVAULT_API_BASE_URL") || "https://api.bookvault.app/v3";
  const BOOKVAULT_PAY_METHOD = Deno.env.get("BOOKVAULT_PAY_METHOD");
  const BOOKVAULT_DISPATCH_SERVICE = Deno.env.get("BOOKVAULT_DISPATCH_SERVICE") || "Tracked";

  if (!BOOKVAULT_API_KEY) {
    return { ok: false, response: null, error: "BOOKVAULT_API_KEY not configured as a function secret" };
  }
  if (!BOOKVAULT_PAY_METHOD) {
    return {
      ok: false,
      response: null,
      error: "BOOKVAULT_PAY_METHOD not configured — set it to Credit, Upfront, Draft or Saved to match your Bookvault account's billing setup before this can place a real order",
    };
  }

  const isbn = params.bookvaultTitleId.replace(/[^0-9X]/gi, "");
  if (isbn.length !== 13) {
    return {
      ok: false,
      response: null,
      error: `book_print_mapping.bookvault_title_id "${params.bookvaultTitleId}" is not a 13-digit ISBN — Bookvault's OrderLines reference titles by ISBN`,
    };
  }

  const county = params.shippingAddress?.state || params.shippingAddress?.city || "";

  // Field names/nesting match BookVAULT.Order exactly (Address, OrderLines,
  // DispatchRequest, DocRef are all top-level per the spec).
  const requestBody = {
    DocRef: params.externalReference,
    Status: "Active", // vs. Draft/PreSale/BatchPayment — Active so it actually enters production rather than sitting unprinted; reconsider if you want a manual review step first
    DispatchRequest: { RequestedService: BOOKVAULT_DISPATCH_SERVICE },
    Address: {
      Addressee: params.shippingName || "Customer",
      Address1: params.shippingAddress?.line1 ?? "",
      Address2: params.shippingAddress?.line2 || undefined,
      Town: params.shippingAddress?.city ?? "",
      County: county,
      Postcode: params.shippingAddress?.postal_code ?? "",
      Country: { ISO_Code: params.shippingAddress?.country ?? "GB" },
      // Required by Bookvault whenever RequestedService is a tracked
      // service (Tracked / CheapestTracked, the default above).
      TelNumber: params.shippingPhone || undefined,
      Email: params.shippingEmail || undefined,
    },
    OrderLines: [
      { LineNumber: 1, ISBN: isbn, Quantity: params.quantity },
    ],
  };

  const endpoint = `${BOOKVAULT_API_BASE_URL.replace(/\/$/, "")}/Order?payMethod=${encodeURIComponent(BOOKVAULT_PAY_METHOD)}`;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        // Literal scheme per https://help.bookvault.app/api-setup:
        // "Authorization: basic bv_YOUR_API_KEY" — not standard
        // base64-encoded HTTP Basic auth, the raw key after "basic ".
        Authorization: `basic ${BOOKVAULT_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
  } catch (err) {
    return { ok: false, response: null, error: `Network error calling Bookvault: ${err}` };
  }

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // Bookvault may not always return JSON (e.g. a plain-text 502) — keep
    // going, we still record the HTTP status.
  }

  if (!res.ok) {
    return { ok: false, response: json, error: `Bookvault returned HTTP ${res.status}` };
  }

  const responseObj = (json ?? {}) as Record<string, unknown>;

  // Bookvault can return HTTP 200 with CriticalError: true and a Messages
  // array describing what's wrong (e.g. an OrderLine ErrorCode like
  // Title_Not_In_Library) — a 200 status alone doesn't mean the order was
  // actually accepted.
  if (responseObj.CriticalError === true) {
    return {
      ok: false,
      response: json,
      error: `Bookvault CriticalError: ${JSON.stringify(responseObj.Messages ?? [])}`,
    };
  }

  // Order ID field per BookVAULT.Order: PodRef ("POD's reference for the
  // order"), an int32 — stringified for storage.
  const bookvaultOrderId = responseObj.PodRef != null ? String(responseObj.PodRef) : null;

  return { ok: true, response: json, bookvaultOrderId };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ─── Internal auth ───────────────────────────────────────────────────
  // This function places real, chargeable Bookvault orders, so it must
  // never be reachable by anyone who merely has the (public, frontend-
  // bundled) Supabase anon key. verify_jwt is off (see config.toml) so
  // stripe-webhook's service-role invoke works without extra plumbing —
  // this shared-secret header is the actual gate. Set INTERNAL_FUNCTION_SECRET
  // as a function secret (any random string) and it's automatically
  // required from here on; until it's set, EVERY request is rejected
  // (fail closed, not fail open).
  const INTERNAL_FUNCTION_SECRET = Deno.env.get("INTERNAL_FUNCTION_SECRET");
  if (!INTERNAL_FUNCTION_SECRET || req.headers.get("x-internal-secret") !== INTERNAL_FUNCTION_SECRET) {
    console.error("[submit-print-order] rejected: missing/invalid x-internal-secret");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    let payload: SubmitPrintOrderRequest;
    try {
      payload = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeSessionId = payload.stripe_session_id?.trim();
    const bookSlug = payload.book_slug?.trim();
    if (!stripeSessionId || !bookSlug) {
      return new Response(JSON.stringify({ error: "stripe_session_id and book_slug are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const quantity = Number.isInteger(payload.quantity) && (payload.quantity as number) > 0 ? (payload.quantity as number) : 1;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ─── Idempotent insert-or-fetch (uniqueness backstop) ───
    const { data: insertedRow, error: insertError } = await supabaseAdmin
      .from("print_orders")
      .insert({
        stripe_session_id: stripeSessionId,
        stripe_payment_intent_id: payload.stripe_payment_intent_id ?? null,
        purchase_id: payload.purchase_id ?? null,
        user_id: payload.user_id ?? null,
        book_slug: bookSlug,
        quantity,
        status: "pending",
        shipping_name: payload.shipping_name ?? null,
        shipping_phone: payload.shipping_phone ?? null,
        shipping_email: payload.shipping_email ?? null,
        shipping_address: payload.shipping_address ?? null,
      })
      .select()
      .single();

    let orderRow = insertedRow;

    if (insertError) {
      if (insertError.code !== "23505") {
        console.error("[submit-print-order] insert failed (not a duplicate):", insertError);
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Already seen this (session, book) pair — fetch it instead.
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from("print_orders")
        .select()
        .eq("stripe_session_id", stripeSessionId)
        .eq("book_slug", bookSlug)
        .single();

      if (fetchError || !existing) {
        console.error("[submit-print-order] duplicate insert but couldn't fetch existing row:", fetchError);
        return new Response(JSON.stringify({ error: "Duplicate row could not be fetched" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      orderRow = existing;

      if (existing.status !== "pending" && existing.status !== "failed") {
        // submitted / shipped / processing (another call already claimed
        // it right now) — nothing for this call to do.
        console.log("[submit-print-order] already processed/in flight, skipping:", stripeSessionId, bookSlug, existing.status);
        return new Response(JSON.stringify({ status: "skipped", reason: "already processed", order: existing }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!orderRow) {
      return new Response(JSON.stringify({ error: "No order row to process" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Resolve our book_slug -> Bookvault title ID ───
    const { data: mapping } = await supabaseAdmin
      .from("book_print_mapping")
      .select("bookvault_title_id, is_active")
      .eq("book_slug", bookSlug)
      .single();

    if (!mapping || !mapping.is_active || !mapping.bookvault_title_id) {
      const reason = !mapping
        ? "No book_print_mapping row for this book_slug"
        : !mapping.is_active
        ? "book_print_mapping row is marked inactive"
        : "book_print_mapping row has no bookvault_title_id set";

      await supabaseAdmin
        .from("print_orders")
        .update({ status: "failed", error_message: reason, updated_at: new Date().toISOString() })
        .eq("id", orderRow.id);

      await notifyFailure({ stripeSessionId, bookSlug, reason });

      return new Response(JSON.stringify({ status: "failed", reason }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Atomic claim ───
    // Only succeeds if status is still 'pending' or 'failed' — see the
    // file header comment for why this (not the insert-or-fetch above) is
    // what actually prevents a concurrent duplicate Bookvault order.
    const { data: claimedRow } = await supabaseAdmin
      .from("print_orders")
      .update({
        status: "processing",
        bookvault_title_id: mapping.bookvault_title_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderRow.id)
      .in("status", ["pending", "failed"])
      .select()
      .single();

    if (!claimedRow) {
      console.log("[submit-print-order] lost the claim race (another call already has it), skipping:", stripeSessionId, bookSlug);
      return new Response(JSON.stringify({ status: "skipped", reason: "already claimed by another request" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Validate shipping address before we spend a real Bookvault order on it ───
    const addressError = validateShippingAddress(claimedRow.shipping_name, claimedRow.shipping_address as ShippingAddress | null);
    if (addressError) {
      await supabaseAdmin
        .from("print_orders")
        .update({ status: "failed", error_message: addressError, updated_at: new Date().toISOString() })
        .eq("id", orderRow.id);

      await notifyFailure({ stripeSessionId, bookSlug, reason: addressError });

      return new Response(JSON.stringify({ status: "failed", reason: addressError }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Call Bookvault ───
    // DocRef is capped at 90 chars by Bookvault; a Stripe session ID plus
    // book_slug can occasionally exceed that, so use our own row's UUID
    // instead — it's globally unique, fixed-length, and already the
    // primary key we'd look the order up by anyway.
    const externalReference = orderRow.id;
    const result = await callBookvaultApi({
      bookvaultTitleId: mapping.bookvault_title_id,
      quantity,
      shippingName: claimedRow.shipping_name,
      shippingPhone: claimedRow.shipping_phone,
      shippingEmail: claimedRow.shipping_email,
      shippingAddress: claimedRow.shipping_address as ShippingAddress | null,
      externalReference,
    });

    if (!result.ok) {
      await supabaseAdmin
        .from("print_orders")
        .update({
          status: "failed",
          error_message: result.error,
          bookvault_response: result.response,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderRow.id);

      await notifyFailure({ stripeSessionId, bookSlug, reason: result.error, detail: result.response });

      return new Response(JSON.stringify({ status: "failed", reason: result.error }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: updatedRow } = await supabaseAdmin
      .from("print_orders")
      .update({
        status: "submitted",
        bookvault_order_id: result.bookvaultOrderId,
        bookvault_response: result.response,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderRow.id)
      .select()
      .single();

    console.log("[submit-print-order] submitted to Bookvault:", stripeSessionId, bookSlug, result.bookvaultOrderId);

    return new Response(JSON.stringify({ status: "submitted", order: updatedRow }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[submit-print-order] unhandled error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
