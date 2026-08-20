// Text-only pipeline test (Lynden 2026-08-15): story → phonics QA →
// plausibility → STORY EDITOR GATE, then stop. No images, no PDF — a full
// exercise of the new premise lock, six-beat plan, severity-derived verdict
// and same-premise revision, at pennies instead of dollars.
//
// Requires the local vite dev server (localhost:8080) and the
// server/forge/.text_only marker file (created/removed by the runner).
const BASE = "http://localhost:8080/api/forge";

async function j(path, opts = {}) {
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetch(`${BASE}${path}`, {
        ...opts,
        headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
      });
    } catch (e) {
      if (attempt >= 5) throw e;
      await new Promise((r) => setTimeout(r, 4000));
      continue;
    }
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    if (!res.ok) throw new Error(`${path} -> ${res.status}: ${JSON.stringify(data).slice(0, 400)}`);
    return data;
  }
}

console.log("1) Creating book (same Yusuf/Istanbul persona as the failed illustrated test)...");
const { book } = await j("/books", {
  method: "POST",
  body: JSON.stringify({
    child_name: "Yusuf",
    child_age: 6,
    country: "Turkiye",
    country_flag: "🇹🇷",
    city: "Istanbul",
    culture_notes: "A Muslim family in Istanbul; street cats, the ferry across the Bosphorus, simit from the bakery.",
    likes: "Cats and boats",
    appearance: { gender: "boy", skinTone: "light olive", hair: "short dark brown hair" },
    faith: "Muslim",
    level: 5,
    focus_sound: "oi",
    email: "lyndencooke@gmail.com",
  }),
});
console.log("   book_id:", book.id);

console.log("2) Dev-simulating payment (starts generation)...");
await j("/dev/simulate-pay", { method: "POST", body: JSON.stringify({ kind: "book", book_id: book.id }) });

console.log("3) Polling (dev driver runs the machine in-process)...");
let row;
for (let i = 0; i < 120; i++) {
  await new Promise((r) => setTimeout(r, 5000));
  ({ book: row } = await j(`/books/${book.id}`));
  const pr = row.progress || {};
  process.stdout.write(`   [${String(pr.step || "?").padEnd(18)}] ${String(pr.message || "").slice(0, 80)}\r\n`);
  if (["text_ready", "content_rejected", "failed", "paused_budget", "paused_provider_credit", "ready"].includes(row.status)) break;
}

console.log("\n=== FINAL STATUS:", row.status, "===");
const jb = row.progress?.job || {};
const story = jb.story || row.story?.story;
console.log("Title:", story?.title);
console.log("\n--- PREMISE ---\n", JSON.stringify(story?.premise, null, 1));
console.log("\n--- SIX-BEAT PLAN ---\n", JSON.stringify(story?.story_plan, null, 1));
console.log("\n--- PAGES ---");
(story?.pages || []).forEach((p, i) => console.log(`  p${i + 1}: ${p.text}`));
const bd = jb.breakdown || row.cost_breakdown || {};
for (const key of ["story_gate_first", "story_gate_second", "story_gate"]) {
  if (bd[key]) {
    const r = bd[key];
    console.log(`\n--- ${key.toUpperCase()} ---`);
    console.log("cold_read:", r.cold_read);
    console.log("issues:", JSON.stringify(r.issues, null, 1));
    console.log("advisory pass:", r.pass, "| reason:", r.reason);
  }
}
if (bd.story_gate_minors) console.log("\nminor notes (shipped anyway):", JSON.stringify(bd.story_gate_minors, null, 1));
console.log("\n--- COST ---");
console.log("total USD:", jb.cost ?? row.cost_usd);
console.log("stages:", JSON.stringify(bd.stages, null, 1));
