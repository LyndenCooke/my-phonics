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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    const { book_id } = await req.json();
    if (!book_id) {
      return new Response(JSON.stringify({ error: "book_id required" }), { status: 400, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check user has access
    const { data: userBook } = await supabaseAdmin
      .from("user_books")
      .select("id")
      .eq("user_id", userId)
      .eq("book_id", book_id)
      .single();

    if (!userBook) {
      return new Response(JSON.stringify({ error: "Not authorised" }), { status: 403, headers: corsHeaders });
    }

    // Get book PDF path
    const { data: book } = await supabaseAdmin
      .from("books")
      .select("pdf_url, title")
      .eq("id", book_id)
      .single();

    if (!book?.pdf_url) {
      return new Response(JSON.stringify({ error: "PDF not available" }), { status: 404, headers: corsHeaders });
    }

    // Generate signed URL (60 min expiry)
    const { data: signedUrl, error: signError } = await supabaseAdmin.storage
      .from("book-pdfs")
      .createSignedUrl(book.pdf_url, 3600);

    if (signError) {
      return new Response(JSON.stringify({ error: "Could not generate download link" }), { status: 500, headers: corsHeaders });
    }

    // Log download
    await supabaseAdmin.from("download_log").insert({
      user_id: userId,
      book_id,
    });

    return new Response(
      JSON.stringify({ url: signedUrl.signedUrl, title: book.title }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
