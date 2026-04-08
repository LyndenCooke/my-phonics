// Guest assessment signup: email-only lightweight signup.
// Creates (or finds) a Supabase user, saves their assessment result,
// unlocks a free sample book at their recommended level, and emails
// a magic link so they can log in.

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
    const { email, child_name, recommended_level, highest_level_passed, answers_summary } = await req.json();

    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Valid email required" }), { status: 400, headers: corsHeaders });
    }
    if (!recommended_level || recommended_level < 1 || recommended_level > 6) {
      return new Response(JSON.stringify({ error: "recommended_level required (1-6)" }), { status: 400, headers: corsHeaders });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseAdmin = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 1. Find or create user
    let userId: string;
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const tempPassword = crypto.randomUUID() + "Aa1!";
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: child_name || "" },
      });
      if (createError || !newUser?.user) {
        return new Response(JSON.stringify({ error: createError?.message || "Failed to create user" }), { status: 500, headers: corsHeaders });
      }
      userId = newUser.user.id;
    }

    // 2. Save assessment result (basic — full detail can come later)
    await supabaseAdmin.from("assessment_results").insert({
      user_id: userId,
      recommended_level,
      highest_level_passed: highest_level_passed ?? Math.max(1, recommended_level - 1),
      total_sounds_correct: answers_summary?.sounds_correct ?? 0,
      total_sounds_asked: answers_summary?.sounds_asked ?? 0,
      total_words_correct: answers_summary?.words_correct ?? 0,
      total_words_asked: answers_summary?.words_asked ?? 0,
      total_tricky_correct: 0,
      total_tricky_asked: 0,
      detailed_answers: answers_summary?.detail ?? [],
    });

    // 3. Unlock the first book at the recommended level as a free sample
    const { data: books } = await supabaseAdmin
      .from("books")
      .select("id")
      .eq("level", recommended_level)
      .order("sort_order", { ascending: true })
      .limit(1);

    if (books && books.length > 0) {
      await supabaseAdmin.from("user_books").upsert(
        { user_id: userId, book_id: books[0].id, source: "free_sample" },
        { onConflict: "user_id,book_id" }
      );
    }

    // 4. Send a magic link so they can log in by email
    const origin = req.headers.get("origin") || "https://myphonicsbooks.vercel.app";
    await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email,
        create_user: false,
        email_redirect_to: `${origin}/welcome`,
      }),
    });

    return new Response(
      JSON.stringify({ success: true, recommended_level, email_sent: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: corsHeaders });
  }
});
