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

    const { child_id, answers } = await req.json();
    if (!answers || !Array.isArray(answers)) {
      return new Response(JSON.stringify({ error: "answers array required" }), { status: 400, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get assessment items to join with answers
    const itemIds = answers.map((a: any) => a.item_id);
    const { data: items } = await supabaseAdmin
      .from("assessment_items")
      .select("*")
      .in("id", itemIds);

    if (!items) {
      return new Response(JSON.stringify({ error: "Items not found" }), { status: 400, headers: corsHeaders });
    }

    const itemMap = new Map(items.map(i => [i.id, i]));

    // Calculate scores per round
    let soundsCorrect = 0, soundsAsked = 0;
    let wordsCorrect = 0, wordsAsked = 0;
    let trickyCorrect = 0, trickyAsked = 0;

    const detailedAnswers = answers.map((a: any) => {
      const item = itemMap.get(a.item_id);
      if (!item) return null;

      if (item.round_type === "sound_recognition") {
        soundsAsked++;
        if (a.is_correct) soundsCorrect++;
      } else if (item.round_type === "word_reading") {
        wordsAsked++;
        if (a.is_correct) wordsCorrect++;
      } else if (item.round_type === "tricky_words") {
        trickyAsked++;
        if (a.is_correct) trickyCorrect++;
      }

      return {
        item_id: a.item_id,
        item_text: item.item_text,
        round_type: item.round_type,
        target_level: item.target_level,
        is_correct: a.is_correct,
      };
    }).filter(Boolean);

    // Determine recommended level
    // Group by target_level, check 70% pass rate at each level
    const levelScores: Record<number, { correct: number; total: number }> = {};
    for (const da of detailedAnswers) {
      if (!da) continue;
      if (!levelScores[da.target_level]) levelScores[da.target_level] = { correct: 0, total: 0 };
      levelScores[da.target_level].total++;
      if (da.is_correct) levelScores[da.target_level].correct++;
    }

    let highestLevelPassed = 0;
    for (let lvl = 1; lvl <= 6; lvl++) {
      const score = levelScores[lvl];
      if (!score) break;
      if (score.correct / score.total >= 0.7) {
        highestLevelPassed = lvl;
      } else {
        break;
      }
    }

    let recommendedLevel = Math.min(highestLevelPassed + 1, 6);
    
    // If child got <50% of Level 1 sounds, recommend Level 1
    const lvl1Sounds = detailedAnswers.filter(
      (d: any) => d && d.round_type === "sound_recognition" && d.target_level === 1
    );
    if (lvl1Sounds.length > 0) {
      const lvl1SoundsCorrect = lvl1Sounds.filter((d: any) => d.is_correct).length;
      if (lvl1SoundsCorrect / lvl1Sounds.length < 0.5) {
        recommendedLevel = 1;
      }
    }

    // Save result
    await supabaseAdmin.from("assessment_results").insert({
      user_id: userId,
      child_id: child_id || null,
      total_sounds_correct: soundsCorrect,
      total_sounds_asked: soundsAsked,
      total_words_correct: wordsCorrect,
      total_words_asked: wordsAsked,
      total_tricky_correct: trickyCorrect,
      total_tricky_asked: trickyAsked,
      highest_level_passed: highestLevelPassed,
      recommended_level: recommendedLevel,
      detailed_answers: detailedAnswers,
    });

    // Update child's current_level if child_id provided
    if (child_id) {
      await supabaseAdmin
        .from("children")
        .update({ current_level: recommendedLevel })
        .eq("id", child_id)
        .eq("user_id", userId);
    }

    return new Response(
      JSON.stringify({
        recommended_level: recommendedLevel,
        highest_level_passed: highestLevelPassed,
        sounds: { correct: soundsCorrect, total: soundsAsked },
        words: { correct: wordsCorrect, total: wordsAsked },
        tricky: { correct: trickyCorrect, total: trickyAsked },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
