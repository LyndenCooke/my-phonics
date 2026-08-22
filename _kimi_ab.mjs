// A/B the REAL writer prompt on Kimi vs gpt-5.5 (Lynden 2026-08-22: "its way
// too expensive try the kimi api key but at the same time the writing is the
// easy part"). Same system prompt, same story, same schema - only the vendor
// changes. Reports tokens both ways so the saving is arithmetic, not a claim.
import fs from "node:fs";
import { cfg } from "./server/forge/env.mjs";
import { writeStory } from "./server/forge/claude.mjs";
import { getLevel, greenWordsUpTo, progressionUpTo, pronunciationsFor, coreStoriesFor, sourceStoryFor, decodeProblems } from "./server/forge/phonics.mjs";

const LEVEL = 5, SOUND = "oi";
const level = getLevel(LEVEL);
const child = {
  name: "Ravi", age: 6, country: "India",
  cultureNotes: "We live in Jaipur - pink sandstone walls with carved window screens, a busy bazaar, kites over the rooftops, marigolds at the door, and Nani makes chai on the terrace.",
};
const source = sourceStoryFor(LEVEL, []);
const shared = {
  level, child, focusSound: SOUND, pagesCount: 8,
  greenWords: greenWordsUpTo(LEVEL), progression: progressionUpTo(LEVEL),
  pronunciations: pronunciationsFor(SOUND, LEVEL), source, exemplars: coreStoriesFor(LEVEL),
};
console.log(`pattern: ${source.title} -> ${source.patternName}\n`);

// ---- 1. the incumbent, through the normal path ----
const a = await writeStory(shared);
const words = [...new Set(a.data.pages.map((p) => p.text).join(" ").toLowerCase().match(/[a-z']+/g))];
console.log(`GPT-5.5   $${a.cost.toFixed(3)}   "${a.data.title}"`);
a.data.pages.forEach((p, i) => console.log(`   ${i + 1}. ${p.text}`));
console.log("   decode:", decodeProblems(words, LEVEL, { heroName: "ravi" }).join("; ") || "clean");

// ---- 2. Kimi, given the identical system + user message ----
// Rebuild exactly what writeStory sends by calling it with a vendor hook is not
// possible without touching it, so mirror its inputs through the same helper.
const { buildWriterMessages } = await import("./server/forge/claude.mjs");
const msgs = buildWriterMessages ? buildWriterMessages(shared) : null;
if (!msgs) {
  console.log("\n(no message-builder export yet - see _kimi_ab note)");
  process.exit(0);
}

async function kimi(model, messages, maxTokens = 16000) {
  const t0 = Date.now();
  const r = await fetch("https://api.moonshot.ai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.KIMI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, response_format: { type: "json_object" }, max_tokens: maxTokens }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`${model} ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
  const u = j.usage || {};
  return {
    data: JSON.parse(j.choices[0].message.content),
    inTok: u.prompt_tokens || 0,
    outTok: u.completion_tokens || 0,
    reasoning: u.completion_tokens_details?.reasoning_tokens || 0,
    secs: ((Date.now() - t0) / 1000).toFixed(0),
  };
}

for (const model of ["kimi-k2.6", "kimi-k3"]) {
  try {
    const b = await kimi(model, msgs);
    const w = [...new Set((b.data.pages || []).map((p) => p.text).join(" ").toLowerCase().match(/[a-z']+/g) || [])];
    console.log(`\n${model}  in ${b.inTok} / out ${b.outTok} (${b.reasoning} reasoning)  ${b.secs}s   "${b.data.title}"`);
    (b.data.pages || []).forEach((p, i) => console.log(`   ${i + 1}. ${p.text}`));
    console.log("   decode:", decodeProblems(w, LEVEL, { heroName: "ravi" }).join("; ") || "clean");
    // cost at published Kimi rates vs what we pay OpenAI
    for (const [label, rate] of [["@ $0.60/$2.50", { i: 0.6, o: 2.5 }], ["@ $1.00/$5.00", { i: 1, o: 5 }]]) {
      const c = (b.inTok * rate.i + b.outTok * rate.o) / 1e6;
      console.log(`   est ${label}: $${c.toFixed(3)}  (gpt-5.5 same job: $${a.cost.toFixed(3)})`);
    }
  } catch (e) {
    console.log(`\n${model}: ${e.message}`);
  }
}
