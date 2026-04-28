import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function badRequest(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Try to authenticate — but allow guest checkout
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const supabaseUser = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData } = await supabaseUser.auth.getClaims(token);
      if (claimsData?.claims) {
        userId = claimsData.claims.sub;
      }
    }

    let payload: { product_id?: unknown; guest_email?: unknown; ref_code?: unknown };
    try {
      payload = await req.json();
    } catch {
      return badRequest("Invalid JSON body");
    }

    const product_id = typeof payload.product_id === "string" ? payload.product_id.trim() : "";
    const guest_email =
      typeof payload.guest_email === "string" ? payload.guest_email.trim().toLowerCase() : "";
    const ref_code_raw =
      typeof payload.ref_code === "string" ? payload.ref_code.trim().toUpperCase() : "";
    // Validate referral code shape — 4-12 uppercase alphanumerics. We don't
    // hard-fail if it's invalid; just drop it. The webhook will look it up
    // and skip attribution if no matching referrer exists.
    const ref_code = /^[A-Z0-9]{4,12}$/.test(ref_code_raw) ? ref_code_raw : "";

    if (!product_id || !UUID_RE.test(product_id)) {
      return badRequest("product_id must be a valid UUID");
    }
    if (guest_email && !EMAIL_RE.test(guest_email)) {
      return badRequest("guest_email is not a valid email address");
    }
    if (!userId && !guest_email) {
      return badRequest("Email required for guest checkout");
    }

    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      return new Response(JSON.stringify({ error: "Product not found" }), { status: 404, headers: corsHeaders });
    }

    // ─── Free sample: 1 book at assessed level ───
    if (product.product_type === "free_sample") {
      if (!userId) {
        return new Response(JSON.stringify({ error: "Please create an account and complete the assessment to get your free book" }), { status: 400, headers: corsHeaders });
      }

      // Get user's latest assessment result
      const { data: assessment } = await supabaseAdmin
        .from("assessment_results")
        .select("recommended_level")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        .limit(1)
        .single();

      if (!assessment) {
        return new Response(JSON.stringify({ error: "Please complete the free assessment first to find your child's level" }), { status: 400, headers: corsHeaders });
      }

      const level = assessment.recommended_level;

      // Get the first book at that level (lowest sort_order)
      const { data: books } = await supabaseAdmin
        .from("books")
        .select("id")
        .eq("level", level)
        .order("sort_order", { ascending: true })
        .limit(1);

      if (books && books.length > 0) {
        await supabaseAdmin.from("user_books").upsert(
          { user_id: userId, book_id: books[0].id, source: "free_sample" },
          { onConflict: "user_id,book_id" }
        );
      }

      return new Response(JSON.stringify({ success: true, free: true, level }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Paid products: create Stripe checkout ───
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) {
      return new Response(JSON.stringify({ error: "Stripe not configured" }), { status: 500, headers: corsHeaders });
    }

    if (!product.stripe_price_id) {
      return new Response(JSON.stringify({ error: "Product has no Stripe price configured" }), { status: 400, headers: corsHeaders });
    }

    // Determine email for Stripe
    let customerEmail = guest_email || null;
    if (userId && !customerEmail) {
      const { data: profile } = await supabaseAdmin.from("profiles").select("email").eq("id", userId).single();
      customerEmail = profile?.email || null;
    }

    const isSubscription = product.product_type === "subscription" || product.product_type === "subscription_annual";
    const mode = isSubscription ? "subscription" : "payment";

    const body = new URLSearchParams({
      mode,
      "line_items[0][price]": product.stripe_price_id,
      "line_items[0][quantity]": "1",
      success_url: `${req.headers.get("origin") || "https://myphonicsbooks.com"}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin") || "https://myphonicsbooks.com"}/shop`,
      "metadata[product_id]": product.id,
      "metadata[product_type]": product.product_type,
      currency: "gbp",
    });

    // 7-day free trial for monthly subscription
    if (product.product_type === "subscription") {
      body.set("subscription_data[trial_period_days]", "7");
    }

    // Set client_reference_id for authenticated users
    if (userId) {
      body.set("client_reference_id", userId);
    }

    // For guests, store email in metadata so webhook can create account
    if (!userId && guest_email) {
      body.set("metadata[guest_email]", guest_email);
    }

    // Affiliate ref code — webhook reads this on checkout.session.completed
    // and writes a row to referral_attributions crediting the referrer.
    // We skip attribution if the buyer is the same user as the referrer
    // (handled in the webhook, not here).
    if (ref_code) {
      body.set("metadata[ref_code]", ref_code);
    }

    if (customerEmail) {
      body.set("customer_email", customerEmail);
    }

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      return new Response(JSON.stringify({ error: session.error?.message || "Stripe error" }), { status: 400, headers: corsHeaders });
    }

    // Create pending purchase (user_id may be null for guests — we'll fill it in webhook)
    if (userId) {
      await supabaseAdmin.from("purchases").insert({
        user_id: userId,
        product_id: product.id,
        stripe_session_id: session.id,
        amount_paid: product.price_pence,
        currency: "gbp",
        status: "pending",
      });
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
