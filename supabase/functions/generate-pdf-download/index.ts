// Gated PDF download endpoint. Checks the user's tier (free / monthly / bundle)
// before handing back a download URL, and logs the download so future requests
// can enforce the throttle.
//
// Tier rules (enforced by `public.check_download_entitlement` SQL function):
//   bundle  — full_bundle / founders_club / subscription_annual  → unlimited
//   monthly — active subscription                                 → 1 new book / 7d
//   free    — no paid product                                     → 1 download ever
//
// Re-downloading a book the user has already downloaded is always allowed
// (e.g. they want the A4 booklet after grabbing the A5 earlier) and does
// not consume any cap.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STORAGE_PUBLIC =
  "https://jfbgdeyjngvzpfucwpuk.supabase.co/storage/v1/object/public/book-pdfs";

type Format = "a5" | "a4";

function buildPdfUrl(subLevel: string | null, format: Format): string | null {
  if (!subLevel) return null;
  const slug = subLevel.replace(/^L/, "").replace(".", "_");
  return `${STORAGE_PUBLIC}/${format}/${slug}.pdf`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Sentinel so we can confirm in the dashboard's function logs that the
  // post-v2 build is actually being hit (the previous flow was emitting
  // nothing visible, making it impossible to diagnose silent failures).
  console.log("generate-pdf-download invoked", { method: req.method });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
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
    const { data: claimsData, error: claimsError } =
      await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const book_id = body?.book_id as string | undefined;
    const format: Format = body?.format === "a4" ? "a4" : "a5";
    if (!book_id) {
      return new Response(JSON.stringify({ error: "book_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // The book must be unlocked for this user (granted via free sample,
    // purchase, subscription, or admin grant). Entitlement check is separate
    // and gates the *download*, not the *access* — interactive reading inside
    // the app is allowed for any unlocked book.
    const { data: userBook } = await supabaseAdmin
      .from("user_books")
      .select("id")
      .eq("user_id", userId)
      .eq("book_id", book_id)
      .maybeSingle();

    if (!userBook) {
      return new Response(JSON.stringify({ error: "Not authorised" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Tier + throttle check.
    const { data: entitlement, error: entErr } = await supabaseAdmin.rpc(
      "check_download_entitlement",
      { p_user_id: userId, p_book_id: book_id }
    );
    if (entErr) {
      console.error("entitlement check failed:", entErr);
      return new Response(
        JSON.stringify({ error: "Entitlement check failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!entitlement?.allowed) {
      return new Response(
        JSON.stringify({
          error: "download_limit",
          tier: entitlement?.tier,
          reason: entitlement?.reason,
          cooldown_until: entitlement?.cooldown_until ?? null,
          message: entitlement?.message ?? "Download not available right now.",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Resolve the book → sub_level for URL construction.
    const { data: book } = await supabaseAdmin
      .from("books")
      .select("sub_level, title")
      .eq("id", book_id)
      .maybeSingle();

    const url = buildPdfUrl(book?.sub_level ?? null, format);
    if (!url) {
      return new Response(JSON.stringify({ error: "PDF not available" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log every successful download. Throttles use COUNT(DISTINCT book_id),
    // so re-downloads of the same book don't over-count. Earlier we skipped
    // already-owned re-downloads here, but that left bundle/founders users
    // with an empty download_log (their entitlement always resolves to
    // 'already_owned'), so Profile -> Download History stayed empty even
    // after a real download. We now log every hit and surface insert errors
    // instead of swallowing them.
    const { error: logErr } = await supabaseAdmin.from("download_log").insert({
      user_id: userId,
      book_id,
    });
    if (logErr) {
      console.error(
        "download_log insert failed",
        { user_id: userId, book_id, format, code: logErr.code, message: logErr.message },
      );
    }

    return new Response(
      JSON.stringify({
        url,
        title: book?.title ?? "MyPhonicsBooks",
        format,
        tier: entitlement?.tier,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
