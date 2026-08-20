// Full illustrated run #6 (2026-08-15): first end-to-end test of the reworked
// pipeline — story gate BEFORE images, severity-derived verdicts, premise
// lock, per-step cost ledger, spend cap, pause/content_rejected safety net.
// Local dev server; dev driver runs the machine in-process, we just poll.
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

console.log("1) Creating book (fresh persona: Amira, Kuala Lumpur, L4 'ai')...");
const { book } = await j("/books", {
  method: "POST",
  body: JSON.stringify({
    child_name: "Amira",
    child_age: 5,
    country: "Malaysia",
    country_flag: "🇲🇾",
    city: "Kuala Lumpur",
    culture_notes: "A Muslim family in Kuala Lumpur; the morning market, rain almost every afternoon, grandma's kuih on a tin plate.",
    likes: "Drawing and rainy days",
    appearance: { gender: "girl", skinTone: "warm tan", hair: "dark hair in two plaits under a small headscarf" },
    faith: "Muslim",
    level: 4,
    focus_sound: "ai",
    email: "lyndencooke@gmail.com",
  }),
});
console.log("   book_id:", book.id);

console.log("2) Dev-simulating payment (starts generation)...");
await j("/dev/simulate-pay", { method: "POST", body: JSON.stringify({ kind: "book", book_id: book.id }) });

console.log("3) Polling (full illustrated run — up to 90 min)...");
let row;
let last = "";
for (let i = 0; i < 540; i++) {
  await new Promise((r) => setTimeout(r, 10000));
  try {
    ({ book: row } = await j(`/books/${book.id}`));
  } catch {
    continue;
  }
  const pr = row.progress || {};
  const line = `[${String(pr.step || "?").padEnd(18)}] ${pr.pct ?? "?"}% ${String(pr.message || "").slice(0, 70)}`;
  if (line !== last) { console.log("   " + line); last = line; }
  if (["ready", "content_rejected", "failed", "paused_budget", "paused_provider_credit"].includes(row.status) && !row.generating) break;
}

console.log("\n=== FINAL STATUS:", row.status, "===");
console.log("Title:", row.title);
const bd = row.cost_breakdown || row.progress?.job?.breakdown || {};
const jb = row.progress?.job || {};
const story = row.story?.story || jb.story;

console.log("\n--- PREMISE ---\n", JSON.stringify(story?.premise, null, 1));
console.log("\n--- SIX-BEAT PLAN ---\n", JSON.stringify(story?.story_plan, null, 1));
console.log("\n--- PAGES ---");
(story?.pages || []).forEach((p, i) => console.log(`  p${i + 1}: ${p.text}`));

for (const key of ["story_gate_first", "story_gate_second", "story_gate", "editor_review_first", "editor_review_second", "editor_review"]) {
  if (bd[key]) {
    const r = bd[key];
    console.log(`\n--- ${key.toUpperCase()} ---`);
    console.log("cold_read:", r.cold_read);
    console.log("issues:", JSON.stringify(r.issues, null, 1));
    console.log("advisory pass:", r.pass, "| reason:", r.reason);
  }
}

console.log("\n--- COST ---");
console.log("total USD:", row.cost_usd ?? jb.cost);
console.log("stages:", JSON.stringify(bd.stages, null, 1));

if (row.status === "ready") {
  console.log("\n4) Rendering PDF...");
  const pdfRes = await j(`/books/${book.id}/pdf`, { method: "POST" });
  console.log("   PDF URL:", pdfRes.url);
}
console.log("\nDONE. book_id:", book.id);
