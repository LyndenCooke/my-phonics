#!/usr/bin/env node
// Test script for the Bookvault print-on-demand fulfilment pipeline.
//
// Simulates a real Stripe `checkout.session.completed` webhook for a
// physical book purchase and posts it — correctly signed — to the
// deployed stripe-webhook function, exactly as Stripe itself would. This
// exercises the FULL pipeline: signature verification, metadata
// extraction, the book_print_mapping lookup, the (stubbed) Bookvault
// call, and the print_orders logging — without needing a real Stripe
// checkout, a real Stripe product/price, or touching live Stripe at all.
//
// It also fires the same event a second time to prove idempotency: the
// second run should report "skipped, already processed" rather than
// creating a duplicate print_orders row or a second Bookvault call.
//
// PREREQUISITES
//   1. submit-print-order and the updated create-checkout-session must be
//      deployed.
//   2. INTERNAL_FUNCTION_SECRET must be set as a Supabase function secret
//      (any random string — e.g. `openssl rand -hex 32`), and it must be
//      the SAME value on both stripe-webhook and submit-print-order.
//      stripe-webhook sends it as the x-internal-secret header when it
//      invokes submit-print-order; without it, submit-print-order rejects
//      every request with 401 — this is what stops the print-ordering
//      endpoint from being callable by anyone who finds its public URL.
//      You (the test script) never need this value yourself — you only
//      ever call stripe-webhook, never submit-print-order directly.
//   3. BOOKVAULT_API_KEY and BOOKVAULT_PAY_METHOD must be set as Supabase
//      function secrets for a real Bookvault call to succeed.
//      BOOKVAULT_API_BASE_URL does NOT need setting — it defaults to
//      Bookvault's real base URL (https://api.bookvault.app/v3), verified
//      against their public API docs. BOOKVAULT_PAY_METHOD has no safe
//      default (Credit/Upfront/Draft/Saved is a billing choice tied to
//      your Bookvault account) — without it, submit-print-order correctly
//      logs a 'failed' print_orders row rather than guessing. That's a
//      legitimate test result for "does the pipeline plumbing work", just
//      not "does Bookvault accept the order".
//   4. Set up your 1-2 test titles in Bookvault first and grab their
//      13-digit ISBNs — pass them with --bookvault-title-id below
//      (Bookvault's OrderLines reference titles by ISBN, not a separate ID).
//
// USAGE
//   SUPABASE_SERVICE_ROLE_KEY=... STRIPE_WEBHOOK_SECRET=... \
//     node scripts/test_print_fulfilment.mjs \
//       --book-slug tap-tap-tap --bookvault-title-id <id-from-bookvault> \
//       [--book-slug the-night-light --bookvault-title-id <id-2>] \
//       [--supabase-url https://xxxx.supabase.co] \
//       [--email guest-test@example.com]
//
//   Both env vars are Supabase Edge Function secrets, NOT anything in
//   this repo's .env — get them from the Supabase dashboard
//   (Project Settings > API for the service role key; Edge Functions >
//   stripe-webhook > secrets, or your Stripe dashboard, for the webhook
//   signing secret). Never commit either of them.
//
// One --book-slug/--bookvault-title-id pair simulates a single-book
// purchase; two pairs simulate one order shipping two books (a reader
// set), which is the multi-book case the pipeline has to handle.

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

function parseArgs(argv) {
  const bookSlugs = [];
  const bookvaultTitleIds = [];
  let supabaseUrl = process.env.VITE_SUPABASE_URL || null;
  let email = "print-pipeline-test@myphonicsbooks.co.uk";

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--book-slug") bookSlugs.push(argv[++i]);
    else if (arg === "--bookvault-title-id") bookvaultTitleIds.push(argv[++i]);
    else if (arg === "--supabase-url") supabaseUrl = argv[++i];
    else if (arg === "--email") email = argv[++i];
    else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }

  if (bookSlugs.length === 0 || bookSlugs.length !== bookvaultTitleIds.length) {
    console.error(
      "Provide matching --book-slug / --bookvault-title-id pairs (1 or 2), e.g.\n" +
      "  node scripts/test_print_fulfilment.mjs --book-slug tap-tap-tap --bookvault-title-id 9781234567897"
    );
    process.exit(1);
  }

  // Bookvault's OrderLines reference titles by 13-digit ISBN — fail fast
  // here with a clear message rather than deep inside the pipeline.
  for (const id of bookvaultTitleIds) {
    if (id.replace(/[^0-9X]/gi, "").length !== 13) {
      console.error(`--bookvault-title-id "${id}" doesn't look like a 13-digit ISBN. Bookvault references titles by ISBN, not a separate opaque ID — check the title in your Bookvault account.`);
      process.exit(1);
    }
  }

  if (!supabaseUrl) {
    console.error("No Supabase URL. Pass --supabase-url or set VITE_SUPABASE_URL in .env.");
    process.exit(1);
  }

  return { bookSlugs, bookvaultTitleIds, supabaseUrl, email };
}

async function signStripePayload(body, secret) {
  // Mirrors the manual HMAC verification in supabase/functions/stripe-webhook
  // exactly — t=<unix ts>,v1=<hex hmac-sha256 of "${ts}.${body}">.
  const timestamp = Math.floor(Date.now() / 1000);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${body}`));
  const hex = Array.from(new Uint8Array(sigBytes)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `t=${timestamp},v1=${hex}`;
}

async function main() {
  const { bookSlugs, bookvaultTitleIds, supabaseUrl, email } = parseArgs(process.argv.slice(2));

  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
  if (!SERVICE_ROLE_KEY || !WEBHOOK_SECRET) {
    console.error("Set SUPABASE_SERVICE_ROLE_KEY and STRIPE_WEBHOOK_SECRET as environment variables before running (see the header comment for where to find them).");
    process.exit(1);
  }

  console.log(`Using Supabase project: ${supabaseUrl}`);
  console.log("Double-check that's the right project — local .env can point at a different one than prod.\n");

  const supabase = createClient(supabaseUrl, SERVICE_ROLE_KEY);

  // ── 1. Verify the book slugs are real, and upsert the mapping rows ──
  for (let i = 0; i < bookSlugs.length; i++) {
    const slug = bookSlugs[i];
    const { data: book, error } = await supabase.from("books").select("slug, title").eq("slug", slug).single();
    if (error || !book) {
      console.error(`book_slug "${slug}" was not found in the books table. Aborting.`);
      process.exit(1);
    }
    console.log(`Book found: ${slug} -> "${book.title}"`);

    const { error: mapError } = await supabase.from("book_print_mapping").upsert(
      {
        book_slug: slug,
        book_title: book.title,
        bookvault_title_id: bookvaultTitleIds[i],
        is_active: true,
      },
      { onConflict: "book_slug" }
    );
    if (mapError) {
      console.error(`Failed to upsert book_print_mapping for ${slug}:`, mapError.message);
      process.exit(1);
    }
  }
  console.log("book_print_mapping rows upserted.\n");

  // ── 2. Upsert a throwaway test product row (no Stripe API calls at all — ──
  //      this test never creates a real Stripe product/price/checkout).
  const TEST_PRODUCT_NAME = "TEST — Print Fulfilment Pipeline";
  const { data: existingProduct } = await supabase
    .from("products")
    .select("id")
    .eq("name", TEST_PRODUCT_NAME)
    .maybeSingle();

  let productId = existingProduct?.id;
  if (productId) {
    await supabase
      .from("products")
      .update({ book_slugs: bookSlugs, requires_shipping: true, product_type: "physical_book", levels_included: [] })
      .eq("id", productId);
  } else {
    const { data: newProduct, error: productError } = await supabase
      .from("products")
      .insert({
        name: TEST_PRODUCT_NAME,
        product_type: "physical_book",
        book_slugs: bookSlugs,
        requires_shipping: true,
        levels_included: [],
        price_pence: 699 * bookSlugs.length,
        is_active: false, // never sellable — test fixture only
        sort_order: 9999,
      })
      .select("id")
      .single();
    if (productError) {
      console.error("Failed to create test product row:", productError.message);
      process.exit(1);
    }
    productId = newProduct.id;
  }
  console.log(`Test product ready: ${productId} (book_slugs: ${bookSlugs.join(", ")})\n`);

  // ── 3. Build the fake Stripe event ──
  const sessionId = `cs_test_print_pipeline_${Date.now()}`;
  const shippingAddress = {
    name: "Test Buyer",
    address: {
      line1: "10 Test Street",
      line2: null,
      city: "London",
      state: null,
      postal_code: "E1 6AN",
      country: "GB",
    },
  };

  const buildEvent = () => ({
    id: `evt_test_${Date.now()}`,
    type: "checkout.session.completed",
    data: {
      object: {
        id: sessionId,
        object: "checkout.session",
        payment_intent: `pi_test_${sessionId}`,
        customer: null,
        customer_email: email,
        // Bookvault requires a phone number whenever a tracked dispatch
        // service is requested (submit-print-order's default) — Stripe
        // puts phone_number_collection's result here, not on shipping.
        customer_details: { phone: "+447700900000", email },
        client_reference_id: null,
        amount_total: 699 * bookSlugs.length,
        currency: "gbp",
        metadata: {
          product_id: productId,
          product_type: "physical_book",
          guest_email: email,
          book_slugs: JSON.stringify(bookSlugs),
        },
        shipping_details: shippingAddress,
        subscription: null,
      },
    },
  });

  const webhookUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/stripe-webhook`;

  async function fireWebhook(label) {
    const body = JSON.stringify(buildEvent());
    const signature = await signStripePayload(body, WEBHOOK_SECRET);
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "stripe-signature": signature },
      body,
    });
    const text = await res.text();
    console.log(`[${label}] POST ${webhookUrl} -> HTTP ${res.status}`);
    console.log(`[${label}] response body: ${text}\n`);
    return res.status;
  }

  console.log(`Firing fake checkout.session.completed (session ${sessionId}) — first delivery...`);
  await fireWebhook("first delivery");

  // Give the fire-and-forget submit-print-order invokes a moment to land.
  await new Promise((r) => setTimeout(r, 2500));

  console.log("Checking print_orders...");
  const { data: orders, error: ordersError } = await supabase
    .from("print_orders")
    .select("book_slug, status, bookvault_order_id, error_message, created_at")
    .eq("stripe_session_id", sessionId)
    .order("created_at", { ascending: true });

  if (ordersError) {
    console.error("Couldn't read print_orders:", ordersError.message);
  } else if (!orders || orders.length === 0) {
    console.error(
      "No print_orders rows were created. Most likely cause: submit-print-order isn't deployed yet " +
      "(it wasn't deployed automatically — deploy it, then re-run this script)."
    );
  } else {
    for (const o of orders) {
      console.log(`  ${o.book_slug}: status=${o.status}${o.bookvault_order_id ? ` bookvault_order_id=${o.bookvault_order_id}` : ""}${o.error_message ? ` error="${o.error_message}"` : ""}`);
    }
  }

  console.log(`\nFiring the SAME event again (same session ${sessionId}) to check idempotency...`);
  await fireWebhook("retry delivery");
  await new Promise((r) => setTimeout(r, 2500));

  const { data: ordersAfterRetry } = await supabase
    .from("print_orders")
    .select("id, book_slug, status")
    .eq("stripe_session_id", sessionId);

  console.log(`\nprint_orders rows for this session after the retry: ${ordersAfterRetry?.length ?? 0} (expected: ${bookSlugs.length}, one per book — NOT doubled).`);
  for (const o of ordersAfterRetry ?? []) {
    console.log(`  ${o.book_slug}: status=${o.status}`);
  }

  console.log(
    "\nDone. If a row shows status=failed with reason mentioning BOOKVAULT_PAY_METHOD, that's expected " +
    "until you set it as a function secret (Credit/Upfront/Draft/Saved — matches your Bookvault billing " +
    "setup). Any other failure reason is worth reading closely against print_orders.bookvault_response, " +
    "which always has Bookvault's raw reply."
  );
}

main().catch((err) => {
  console.error("Test script crashed:", err);
  process.exit(1);
});
