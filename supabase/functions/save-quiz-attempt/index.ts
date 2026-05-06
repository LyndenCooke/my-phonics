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

    const { child_id, book_id, quiz_type, answers } = await req.json();
    if (!book_id || !quiz_type || !answers) {
      return new Response(JSON.stringify({ error: "book_id, quiz_type, and answers required" }), { status: 400, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get correct answers
    const questionIds = answers.map((a: any) => a.question_id);
    const { data: questions } = await supabaseAdmin
      .from("quiz_questions")
      .select("id, correct_answer")
      .in("id", questionIds);

    if (!questions) {
      return new Response(JSON.stringify({ error: "Questions not found" }), { status: 400, headers: corsHeaders });
    }

    const correctMap = new Map(questions.map(q => [q.id, q.correct_answer]));

    let score = 0;
    const detailedAnswers = answers.map((a: any) => {
      const correct = correctMap.get(a.question_id);
      const isCorrect = a.selected_answer === correct;
      if (isCorrect) score++;
      return {
        question_id: a.question_id,
        selected: a.selected_answer,
        correct,
        is_correct: isCorrect,
      };
    });

    // Save attempt
    await supabaseAdmin.from("quiz_attempts").insert({
      user_id: userId,
      child_id: child_id || null,
      book_id,
      quiz_type,
      score,
      total_questions: answers.length,
      answers: detailedAnswers,
    });

    // If 100% on comprehension, mark book as completed
    if (quiz_type === "comprehension" && score === answers.length) {
      await supabaseAdmin
        .from("user_books")
        .update({ completed_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("book_id", book_id)
        .is("completed_at", null);
    }

    // Update reading streak
    const today = new Date().toISOString().split("T")[0];
    const { data: existing } = await supabaseAdmin
      .from("reading_streaks")
      .select("id, quizzes_completed")
      .eq("user_id", userId)
      .eq("activity_date", today)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from("reading_streaks")
        .update({ quizzes_completed: (existing.quizzes_completed || 0) + 1 })
        .eq("id", existing.id);
    } else {
      await supabaseAdmin.from("reading_streaks").insert({
        user_id: userId,
        child_id: child_id || null,
        activity_date: today,
        quizzes_completed: 1,
      });
    }

    return new Response(
      JSON.stringify({ score, total: answers.length, details: detailedAnswers }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
