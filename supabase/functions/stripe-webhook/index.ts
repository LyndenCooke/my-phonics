import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_WEBHOOK_SECRET || !STRIPE_SECRET_KEY) {
      return new Response("Stripe not configured", { status: 500 });
    }

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return new Response("No signature", { status: 400 });
    }

    // Verify webhook signature
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(STRIPE_WEBHOOK_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const parts = sig.split(",").reduce((acc: Record<string, string>, part) => {
      const [k, v] = part.split("=");
      acc[k] = v;
      return acc;
    }, {});

    const timestamp = parts["t"];
    const expectedSig = parts["v1"];

    const payload = `${timestamp}.${body}`;
    const signatureBytes = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(payload));
    const computedSig = Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (computedSig !== expectedSig) {
      return new Response("Invalid signature", { status: 400 });
    }

    const event = JSON.parse(body);
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ─── Helper: fire GHL sync (non-blocking, swallow errors) ───
    // Calls the ghl-sync edge function so a successful purchase is reflected
    // as a GHL contact event/tag. Failures are logged but never block the
    // webhook response — Stripe must always see 200.
    async function syncGHL(eventName: string, data: Record<string, unknown>) {
      try {
        await supabaseAdmin.functions.invoke("ghl-sync", {
          body: { event: eventName, data },
        });
      } catch (err) {
        console.error("ghl-sync invoke failed (non-fatal):", err);
      }
    }

    // ─── Helper: unlock all books for a user ───
    async function unlockAllBooks(userId: string, purchaseId?: string) {
      const { data: books } = await supabaseAdmin
        .from("books")
        .select("id");

      if (books) {
        for (const book of books) {
          await supabaseAdmin.from("user_books").upsert(
            {
              user_id: userId,
              book_id: book.id,
              source: purchaseId ? "purchase" : "subscription",
              purchase_id: purchaseId || null,
            },
            { onConflict: "user_id,book_id" }
          );
        }
      }
    }

    // ─── Helper: resolve or create user from session ───
    async function resolveUser(session: any): Promise<string | null> {
      let userId = session.client_reference_id;
      const guestEmail = session.metadata?.guest_email;

      if (!userId && guestEmail) {
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(
          (u: any) => u.email === guestEmail
        );

        if (existingUser) {
          userId = existingUser.id;
        } else {
          const tempPassword = crypto.randomUUID() + "Aa1!";
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: guestEmail,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { full_name: "" },
          });

          if (createError || !newUser?.user) {
            console.error("Failed to create guest user:", createError);
            return null;
          }

          userId = newUser.user.id;

          // Send password reset
          const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
          const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
          await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ email: guestEmail }),
          });
        }
      }

      return userId;
    }

    // ─── Helper: record affiliate attribution if metadata.ref_code present ───
    // 50% commission on the gross amount paid (in pence). Adjust here if
    // we want different rates per product type later.
    const COMMISSION_RATE = 0.5;
    async function recordAttribution(session: any, buyerUserId: string | null, productId?: string) {
      const refCode = session.metadata?.ref_code;
      if (!refCode) return;

      const { data: referrer } = await supabaseAdmin
        .from("referrals")
        .select("user_id, code")
        .eq("code", refCode)
        .single();

      if (!referrer) {
        console.log("ref_code not found in referrals table:", refCode);
        return;
      }

      // Don't credit a user for their own purchase
      if (buyerUserId && referrer.user_id === buyerUserId) {
        console.log("Skipping self-referral:", refCode);
        return;
      }

      const amount_pence = session.amount_total || 0;
      const commission_pence = Math.round(amount_pence * COMMISSION_RATE);

      const { error: insertErr } = await supabaseAdmin.from("referral_attributions").insert({
        referrer_user_id: referrer.user_id,
        buyer_user_id: buyerUserId,
        buyer_email: session.customer_email || session.metadata?.guest_email || null,
        ref_code: refCode,
        stripe_session_id: session.id,
        product_id: productId || null,
        amount_pence,
        commission_pence,
      });

      if (insertErr) {
        // Unique violation on stripe_session_id is fine — webhook may retry
        if (insertErr.code !== "23505") {
          console.error("Attribution insert failed:", insertErr);
        }
        return;
      }

      // Bump rollup counters on the referrer row
      await supabaseAdmin.rpc("increment_referral_stats", {
        p_user_id: referrer.user_id,
        p_commission: commission_pence,
      }).then(() => {}, async () => {
        // Fallback if the RPC isn't deployed: update directly
        const { data: cur } = await supabaseAdmin
          .from("referrals")
          .select("total_conversions, total_earnings_pence")
          .eq("user_id", referrer.user_id)
          .single();
        if (cur) {
          await supabaseAdmin
            .from("referrals")
            .update({
              total_conversions: (cur.total_conversions || 0) + 1,
              total_earnings_pence: (cur.total_earnings_pence || 0) + commission_pence,
            })
            .eq("user_id", referrer.user_id);
        }
      });
    }

    // ─── Handle events ───
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = await resolveUser(session);
      const productId = session.metadata?.product_id;
      const productType = session.metadata?.product_type;

      if (!userId) {
        console.error("No user ID resolved for session:", session.id);
        return new Response(JSON.stringify({ received: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // Create or update purchase record
      const { data: existingPurchase } = await supabaseAdmin
        .from("purchases")
        .select("id")
        .eq("stripe_session_id", session.id)
        .single();

      if (existingPurchase) {
        await supabaseAdmin
          .from("purchases")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            stripe_payment_intent_id: session.payment_intent,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription || null,
          })
          .eq("stripe_session_id", session.id);
      } else {
        await supabaseAdmin.from("purchases").insert({
          user_id: userId,
          product_id: productId,
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription || null,
          amount_paid: session.amount_total || 0,
          currency: session.currency || "gbp",
          status: "completed",
          completed_at: new Date().toISOString(),
        });
      }

      // Affiliate attribution — if a ref_code came in via metadata, credit
      // the referrer. Run AFTER the purchase row exists so we have the
      // amount_total figure to compute commission against.
      await recordAttribution(session, userId, productId).catch((err) => {
        console.error("recordAttribution failed:", err);
      });

      // Unlock books based on product type
      if (productType === "subscription" || productType === "subscription_annual") {
        // Subscriptions unlock ALL books
        const { data: purchase } = await supabaseAdmin
          .from("purchases")
          .select("id")
          .eq("stripe_session_id", session.id)
          .single();
        await unlockAllBooks(userId, purchase?.id);
      } else if (productId) {
        // One-time purchase: unlock by levels_included
        const { data: product } = await supabaseAdmin
          .from("products")
          .select("levels_included")
          .eq("id", productId)
          .single();

        if (product) {
          const { data: books } = await supabaseAdmin
            .from("books")
            .select("id")
            .in("level", product.levels_included);

          if (books) {
            const { data: purchase } = await supabaseAdmin
              .from("purchases")
              .select("id")
              .eq("stripe_session_id", session.id)
              .single();

            for (const book of books) {
              await supabaseAdmin.from("user_books").upsert(
                {
                  user_id: userId,
                  book_id: book.id,
                  source: "purchase",
                  purchase_id: purchase?.id,
                },
                { onConflict: "user_id,book_id" }
              );
            }
          }
        }
      }

      // GHL sync — fire contact.purchased so the CRM tags / pipelines
      // update on the buyer's contact. Best-effort.
      const buyerEmail = session.customer_email || session.metadata?.guest_email || null;
      if (buyerEmail) {
        const { data: productRow } = await supabaseAdmin
          .from("products")
          .select("name, product_type")
          .eq("id", productId ?? "")
          .single();
        await syncGHL("contact.purchased", {
          email: buyerEmail,
          user_id: userId,
          product_id: productId,
          product_type: productType ?? productRow?.product_type ?? null,
          product_name: productRow?.name ?? null,
          amount_pence: session.amount_total ?? 0,
          currency: session.currency ?? "gbp",
          stripe_session_id: session.id,
        });
      }

    } else if (event.type === "customer.subscription.deleted") {
      // Subscription cancelled — remove subscription-sourced book access
      const subscription = event.data.object;
      const customerId = subscription.customer;

      // Find user by stripe_customer_id
      const { data: purchases } = await supabaseAdmin
        .from("purchases")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .limit(1);

      if (purchases && purchases.length > 0) {
        const userId = purchases[0].user_id;

        // Remove subscription-sourced books (keep purchased ones)
        await supabaseAdmin
          .from("user_books")
          .delete()
          .eq("user_id", userId)
          .eq("source", "subscription");

        // Mark purchase as cancelled
        await supabaseAdmin
          .from("purchases")
          .update({ status: "cancelled" })
          .eq("stripe_subscription_id", subscription.id);
      }

    } else if (event.type === "invoice.payment_failed") {
      // Subscription payment failed
      const invoice = event.data.object;
      console.error("Invoice payment failed:", invoice.id, "customer:", invoice.customer);

    } else if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;
      await supabaseAdmin
        .from("purchases")
        .update({ status: "failed" })
        .eq("stripe_payment_intent_id", paymentIntent.id);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
