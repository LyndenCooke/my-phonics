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
    const userId = claimsData.claims.sub as string;

    const { child_id, book_id, last_page_read } = await req.json();
    if (!book_id || last_page_read === undefined) {
      return new Response(JSON.stringify({ error: "book_id and last_page_read required" }), { status: 400, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Update last page read
    await supabaseAdmin
      .from("user_books")
      .update({ last_page_read: last_page_read })
      .eq("user_id", userId)
      .eq("book_id", book_id);

    // Check if book is finished
    const { data: book } = await supabaseAdmin
      .from("books")
      .select("page_count")
      .eq("id", book_id)
      .single();

    if (book && last_page_read >= (book.page_count || 0)) {
      // Update reading streak
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabaseAdmin
        .from("reading_streaks")
        .select("id, books_read")
        .eq("user_id", userId)
        .eq("activity_date", today)
        .maybeSingle();

      if (existing) {
        await supabaseAdmin
          .from("reading_streaks")
          .update({ books_read: (existing.books_read || 0) + 1 })
          .eq("id", existing.id);
      } else {
        await supabaseAdmin.from("reading_streaks").insert({
          user_id: userId,
          child_id: child_id || null,
          activity_date: today,
          books_read: 1,
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
