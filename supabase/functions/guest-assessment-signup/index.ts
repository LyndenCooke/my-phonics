// Guest assessment signup: email-only lightweight signup.
// Creates (or finds) a Supabase user, saves their assessment result,
// and unlocks a free sample book at their recommended level. The
// "you've unlocked your book" email is sent by GoHighLevel — we fire
// a contact.assessed event so GHL's workflow can email the matching
// PDF + login link. Supabase no longer sends its own magic link from
// this endpoint to avoid duplicate emails.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return badRequest("Invalid JSON body");
    }

    const emailRaw = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const child_name =
      typeof body.child_name === "string" ? body.child_name.trim().slice(0, 80) : "";
    const recommended_level_raw = body.recommended_level;
    const highest_level_passed = body.highest_level_passed;
    const answers_summary = body.answers_summary;

    if (!EMAIL_RE.test(emailRaw)) {
      return badRequest("Valid email required");
    }
    if (emailRaw.length > 254) {
      return badRequest("Email too long");
    }
    const recommended_level =
      typeof recommended_level_raw === "number" ? Math.floor(recommended_level_raw) : NaN;
    if (!Number.isInteger(recommended_level) || recommended_level < 1 || recommended_level > 6) {
      return badRequest("recommended_level must be an integer 1-6");
    }

    const email = emailRaw;

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
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

    // 3. Unlock the first book at the recommended level as a free sample.
    // We also need the title + sub_level so we can build the PDF link
    // for the GHL email (PDFs live at /book-pdfs/{level}_{sub}.pdf).
    const { data: books } = await supabaseAdmin
      .from("books")
      .select("id, title, sub_level")
      .eq("level", recommended_level)
      .order("sort_order", { ascending: true })
      .limit(1);

    let bookTitle = `Level ${recommended_level} Book`;
    let bookPdfUrl = "";
    if (books && books.length > 0) {
      await supabaseAdmin.from("user_books").upsert(
        { user_id: userId, book_id: books[0].id, source: "free_sample" },
        { onConflict: "user_id,book_id" }
      );
      bookTitle = books[0].title ?? bookTitle;
      const subSlug = (books[0].sub_level ?? `L${recommended_level}.1`)
        .replace(/^L/, "")
        .replace(".", "_");
      bookPdfUrl = `https://myphonicsbooks.com/book-pdfs/${subSlug}.pdf`;
    }

    // 4. GHL sync — fire contact.assessed so the CRM tags the lead with
    // their level + funnel source AND writes custom fields the email
    // template merges in (book title, public PDF link, login URL).
    // GHL is the sole email sender; we no longer trigger Supabase's
    // built-in magic-link send. Best-effort; failures must not block.
    const origin = req.headers.get("origin") || "https://myphonicsbooks.com";
    const loginUrl = `${origin}/welcome?email=${encodeURIComponent(email)}`;
    try {
      await supabaseAdmin.functions.invoke("ghl-sync", {
        body: {
          event: "contact.assessed",
          data: {
            email,
            full_name: child_name || "",
            recommended_level,
            source: "assessment-funnel",
            custom_fields: {
              book_title: bookTitle,
              book_pdf_url: bookPdfUrl,
              login_url: loginUrl,
            },
          },
        },
      });
    } catch (err) {
      console.error("ghl-sync invoke failed (non-fatal):", err);
    }

    return new Response(
      JSON.stringify({ success: true, recommended_level, email_sent: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: corsHeaders });
  }
});
