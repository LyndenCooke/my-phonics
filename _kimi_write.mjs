// Kimi on the IDENTICAL writer prompt, streamed. Streaming is not optional:
// a non-streamed call sits silent past Node's 300s undici headers timeout and
// dies with UND_ERR_HEADERS_TIMEOUT while the request keeps running server-side,
// which then holds Kimi's single concurrency slot and 429s everything after.
import { cfg } from "./server/forge/env.mjs";
import { buildWriterMessages } from "./server/forge/claude.mjs";
import { getLevel, greenWordsUpTo, progressionUpTo, pronunciationsFor, coreStoriesFor, sourceStoryFor, decodeProblems } from "./server/forge/phonics.mjs";

const model = process.argv[2] || "kimi-k2.6";
const LEVEL = 5, SOUND = "oi";
const opts = {
  level: getLevel(LEVEL),
  child: { name: "Ravi", age: 6, country: "India", cultureNotes: "We live in Jaipur - pink sandstone walls, a busy bazaar, kites over the rooftops, marigolds at the door." },
  focusSound: SOUND, pagesCount: 8,
  greenWords: greenWordsUpTo(LEVEL), progression: progressionUpTo(LEVEL),
  pronunciations: pronunciationsFor(SOUND, LEVEL), source: sourceStoryFor(LEVEL, []),
  exemplars: coreStoriesFor(LEVEL),
};
const messages = buildWriterMessages(opts);
console.log(`model ${model} | pattern "${opts.source.title}" | prompt ${messages[0].content.length + messages[1].content.length} chars`);

const t0 = Date.now();
const res = await fetch("https://api.moonshot.ai/v1/chat/completions", {
  method: "POST",
  headers: { Authorization: `Bearer ${cfg.KIMI_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ model, messages, response_format: { type: "json_object" }, max_tokens: 20000, stream: true, stream_options: { include_usage: true } }),
});
if (!res.ok) { console.log("status", res.status, (await res.text()).slice(0, 300)); process.exit(1); }

let content = "", usage = null, reasoning = 0;
const reader = res.body.getReader();
const dec = new TextDecoder();
let buf = "";
for (;;) {
  const { done, value } = await reader.read();
  if (done) break;
  buf += dec.decode(value, { stream: true });
  const lines = buf.split("\n");
  buf = lines.pop() || "";
  for (const line of lines) {
    if (!line.startsWith("data:")) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    try {
      const j = JSON.parse(payload);
      if (j.usage) usage = j.usage;
      const d = j.choices?.[0]?.delta || {};
      if (d.content) content += d.content;
      if (d.reasoning_content) reasoning += d.reasoning_content.length;
    } catch { /* partial frame */ }
  }
}

const secs = ((Date.now() - t0) / 1000).toFixed(0);
console.log(`streamed ok in ${secs}s | reasoning chars ${reasoning} | usage ${JSON.stringify(usage)}`);
let data;
try { data = JSON.parse(content); } catch (e) { console.log("JSON parse failed. First 400 chars:\n" + content.slice(0, 400)); process.exit(1); }

console.log("\nTITLE:", data.title);
(data.pages || []).forEach((p, i) => console.log(`  ${i + 1}. ${p.text}`));
const words = [...new Set(((data.pages || []).map((p) => p.text).join(" ") + " " + (data.title || "")).toLowerCase().match(/[a-z']+/g) || [])];
console.log("decode:", decodeProblems(words, LEVEL, { heroName: "ravi" }).join("; ") || "clean");
console.log("read_words:", JSON.stringify(data.read_words));
if (usage) {
  for (const [label, r] of [["$0.60/$2.50", { i: 0.6, o: 2.5 }], ["$1/$5", { i: 1, o: 5 }]]) {
    const c = ((usage.prompt_tokens || 0) * r.i + (usage.completion_tokens || 0) * r.o) / 1e6;
    console.log(`est at ${label} per M: $${c.toFixed(3)}   (gpt-5.5 $0.272, gpt-5.4-mini $0.014)`);
  }
}
