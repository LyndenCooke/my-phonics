import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Stripe Customer Portal session — gives the user a hosted page where they
// can cancel, swap payment method, view invoices, etc. We don't roll our
// own cancel UI: it's a legal/UX minefield (proration, dunning, refund
// policy) and Stripe handles all of it correctly out of the box.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) {
      return new Response(JSON.stringify({ error: "Stripe not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth required — there's no guest version of the portal.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Sign in required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData } = await supabaseUser.auth.getClaims(token);
    const userId = claimsData?.claims?.sub;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find the user's most-recent Stripe customer ID. A user can have
    // multiple purchase rows (Monthly, then Lifetime, etc.) but they all
    // share one Stripe customer if Stripe deduped them on email. We just
    // grab the most recent non-null.
    const { data: purchases } = await supabaseAdmin
      .from("purchases")
      .select("stripe_customer_id, created_at")
      .eq("user_id", userId)
      .not("stripe_customer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1);

    const customerId = purchases?.[0]?.stripe_customer_id;
    if (!customerId) {
      return new Response(
        JSON.stringify({ error: "No subscription found for this account" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const origin = req.headers.get("origin") || "https://myphonicsbooks.co.uk";
    const body = new URLSearchParams({
      customer: customerId,
      return_url: `${origin}/profile/account`,
    });

    const stripeRes = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const session = await stripeRes.json();
    if (!stripeRes.ok) {
      return new Response(
        JSON.stringify({ error: session.error?.message || "Stripe error" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
