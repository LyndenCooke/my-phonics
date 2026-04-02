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
