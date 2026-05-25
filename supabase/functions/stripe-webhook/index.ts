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

    // ─── Helper: fetch Stripe subscription (for trialing-status checks) ───
    async function fetchStripeSubscription(subscriptionId: string): Promise<any | null> {
      try {
        const res = await fetch(
          `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
          { headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } }
        );
        if (!res.ok) return null;
        return await res.json();
      } catch (err) {
        console.error("fetchStripeSubscription failed:", err);
        return null;
      }
    }

    // ─── Helper: resolve buyer email from a Stripe customer ID ───
    // For subscription.* events we don't get an email in the payload, only
    // a customer ID. Walk it back through our purchases table (which stores
    // stripe_customer_id) to the profiles row.
    async function emailForCustomer(customerId: string): Promise<{ userId: string | null; email: string | null }> {
      const { data: purchases } = await supabaseAdmin
        .from("purchases")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .limit(1);
      const userId = purchases?.[0]?.user_id ?? null;
      if (!userId) return { userId: null, email: null };
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .single();
      return { userId, email: profile?.email ?? null };
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

      // GHL sync — distinguish trial starts from real purchases. Trials
      // carry amount_total: 0 today (the first charge happens at trial end),
      // so contact.purchased would be the wrong signal for the CRM. We fetch
      // the subscription to check its actual status rather than inferring
      // from amount/product type — Stripe is the source of truth.
      const buyerEmail = session.customer_email || session.metadata?.guest_email || null;
      if (buyerEmail) {
        const { data: productRow } = await supabaseAdmin
          .from("products")
          .select("name, product_type")
          .eq("id", productId ?? "")
          .single();

        // Trial detection — two signals, either is sufficient. Belt-and-braces
        // because the previous "status === trialing" check alone misclassified
        // a known trial as a purchase (likely a transient fetch failure on the
        // subscriptions endpoint that silently returned null).
        let isTrialStart = false;
        let trialEnd: number | null = null;
        let subFetchOk = false;
        if (session.subscription) {
          const sub = await fetchStripeSubscription(session.subscription);
          subFetchOk = !!sub;
          console.log("[stripe-webhook] subscription fetch", {
            id: session.subscription,
            ok: subFetchOk,
            status: sub?.status,
            trial_end: sub?.trial_end,
          });
          if (sub?.status === "trialing") {
            isTrialStart = true;
            trialEnd = sub.trial_end ?? null;
          } else if (sub?.trial_end && sub.trial_end * 1000 > Date.now()) {
            // Race-condition fallback: status might briefly be 'incomplete'
            // between checkout.completed and trial activation.
            isTrialStart = true;
            trialEnd = sub.trial_end;
          }
        }

        // If this looks like a subscription checkout but we couldn't confirm
        // any state, prefer free_trial over purchased — wrong direction is
        // much less painful in the CRM (a free-trial tag on a real buyer is
        // easy to spot; a purchased tag on a trialer is invisible).
        if (
          !isTrialStart &&
          !subFetchOk &&
          session.subscription &&
          (productType === "subscription")
        ) {
          console.warn(
            "[stripe-webhook] subscription fetch failed; defaulting to free_trial for product_type=subscription"
          );
          isTrialStart = true;
        }

        const ghlPayload: Record<string, unknown> = {
          email: buyerEmail,
          user_id: userId,
          product_id: productId,
          product_type: productType ?? productRow?.product_type ?? null,
          product_name: productRow?.name ?? null,
          amount_pence: session.amount_total ?? 0,
          currency: session.currency ?? "gbp",
          stripe_session_id: session.id,
          stripe_customer_id: session.customer ?? null,
          stripe_subscription_id: session.subscription ?? null,
        };

        if (isTrialStart) {
          await syncGHL("contact.free_trial", { ...ghlPayload, trial_end: trialEnd });
        } else {
          await syncGHL("contact.purchased", ghlPayload);
        }
      }

      // Persist the lifecycle state so the in-app CRM pipeline can derive
      // Free Trial vs Subscribed without re-hitting Stripe. NULL stays NULL
      // for one-time purchases.
      if (session.subscription) {
        await supabaseAdmin
          .from("purchases")
          .update({ subscription_state: isTrialStart ? "trialing" : "active" })
          .eq("stripe_session_id", session.id);
      }

    } else if (event.type === "checkout.session.expired") {
      // Stripe expires unfinished checkouts ~24h after creation. Fire an
      // abandoned-checkout event so the user's GHL workflow can send a
      // recovery email. This is the auto path; admin/recovery has a manual
      // button for in-the-moment recovery before Stripe expires the session.
      const session = event.data.object;
      const buyerEmail =
        session.customer_email || session.metadata?.guest_email || null;
      if (buyerEmail) {
        const productId = session.metadata?.product_id;
        const { data: productRow } = await supabaseAdmin
          .from("products")
          .select("name, product_type")
          .eq("id", productId ?? "")
          .single();
        await syncGHL("contact.abandoned_checkout", {
          email: buyerEmail,
          product_id: productId,
          product_type: session.metadata?.product_type ?? productRow?.product_type ?? null,
          product_name: productRow?.name ?? null,
          amount_pence: session.amount_total ?? 0,
          stripe_session_id: session.id,
        });
        // Mark our purchases row so it stops showing in the admin recovery
        // queue — Stripe has officially given up on this session.
        await supabaseAdmin
          .from("purchases")
          .update({ status: "failed" })
          .eq("stripe_session_id", session.id)
          .eq("status", "pending");
      }

    } else if (event.type === "customer.subscription.updated") {
      // Detect trial → active transition (first paid charge after the 7-day
      // trial). Stripe sends previous_attributes.status when status changes,
      // so we only fire the CRM event on the actual flip, not on every
      // subscription update (which includes things like card-on-file changes).
      const subscription = event.data.object;
      const previous = event.data.previous_attributes ?? {};
      const wasTrialing = previous.status === "trialing";
      const nowActive = subscription.status === "active";

      if (wasTrialing && nowActive) {
        // Persist the lifecycle change so the CRM pipeline moves the
        // contact from Free Trial → Subscribed.
        await supabaseAdmin
          .from("purchases")
          .update({ subscription_state: "active" })
          .eq("stripe_subscription_id", subscription.id);

        const { userId, email } = await emailForCustomer(subscription.customer);
        if (email) {
          // Pull product info off the subscription's first item.price.product
          // so the CRM knows which plan converted. Best-effort — if it fails
          // we still fire the event with what we have.
          let productName: string | null = null;
          let productType: string | null = null;
          try {
            const { data: purchaseRow } = await supabaseAdmin
              .from("purchases")
              .select("product_id, products(name, product_type)")
              .eq("stripe_subscription_id", subscription.id)
              .limit(1)
              .single();
            productName = (purchaseRow as any)?.products?.name ?? null;
            productType = (purchaseRow as any)?.products?.product_type ?? null;
          } catch {
            // ignore — we still send what we have
          }

          await syncGHL("contact.trial_converted", {
            email,
            user_id: userId,
            product_name: productName,
            product_type: productType,
            stripe_customer_id: subscription.customer,
            stripe_subscription_id: subscription.id,
          });
        }
      }

    } else if (event.type === "customer.subscription.deleted") {
      // Subscription cancelled — remove subscription-sourced book access
      // AND notify GHL so the contact's free-trial / active tag is replaced
      // with cancelled. Without this step the CRM thinks every churned
      // customer is still on trial forever.
      const subscription = event.data.object;
      const customerId = subscription.customer;

      // Find user by stripe_customer_id
      const { data: purchases } = await supabaseAdmin
        .from("purchases")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .limit(1);

      let userId: string | null = null;
      if (purchases && purchases.length > 0) {
        userId = purchases[0].user_id;

        // Remove subscription-sourced books (keep purchased ones)
        await supabaseAdmin
          .from("user_books")
          .delete()
          .eq("user_id", userId)
          .eq("source", "subscription");

        // Mark purchase as cancelled — both `status` (legacy field) and
        // `subscription_state` (drives the CRM pipeline) so the contact
        // moves to Churned.
        await supabaseAdmin
          .from("purchases")
          .update({ status: "cancelled", subscription_state: "cancelled" })
          .eq("stripe_subscription_id", subscription.id);
      }

      // Resolve email for GHL — even if no purchase row matched, walk
      // through to keep the CRM in sync.
      const { email } = await emailForCustomer(customerId);
      if (email) {
        // cancelled_during_trial lets GHL automation distinguish a "tried
        // the product and bounced" contact from a "paid then cancelled"
        // contact — different nurture flows.
        const cancelledDuringTrial = subscription.status === "canceled" &&
          (subscription.trial_end ?? 0) * 1000 > Date.now();
        await syncGHL("contact.cancelled", {
          email,
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          cancelled_during_trial: cancelledDuringTrial,
          cancellation_reason: subscription.cancellation_details?.reason ?? null,
        });
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
