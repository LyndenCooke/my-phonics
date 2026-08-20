// TEXT-ONLY x10 (cost-doctrine step 2, Lynden 2026-08-16). Ten varied stories
// through story -> phonics QA -> plausibility -> cold editor, then STOP before
// a single image. Judges run at FORGE_JUDGE_EFFORT=medium (the bench found
// medium finds the same issues as high for ~27% less).
//
// Doctrine gates: >=80% first-draft acceptance, <=$0.10 per rejected story.
// Self-aborts if the first 3 average > $1.20 or the running total passes $9.
import fs from "node:fs";
const BASE = "http://127.0.0.1:8080/api/forge";
const OUT = process.argv[2] || "text_only_x10.jsonl";
const HARD_TOTAL = Number(process.env.HARD_TOTAL || 9.0), EARLY_AVG = Number(process.env.EARLY_AVG || 1.2);

async function j(path, opts = {}) {
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetch(`${BASE}${path}`, { ...opts, headers: { "Content-Type": "application/json", ...(opts.headers || {}) } });
    } catch (e) { if (attempt >= 5) throw e; await new Promise(r => setTimeout(r, 4000)); continue; }
    const text = await res.text();
    let data; try { data = JSON.parse(text); } catch { data = text; }
    if (!res.ok) {
      // 5xx is transient (an ENETUNREACH between dev server and Supabase
      // stranded a paid job mid-run on 08-16); 4xx is our bug, fail fast.
      if (res.status >= 500 && attempt < 8) { await new Promise(r => setTimeout(r, 5000)); continue; }
      throw new Error(`${path} -> ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
    }
    return data;
  }
}

const CASES = process.env.CASES_FILE
  ? JSON.parse(fs.readFileSync(process.env.CASES_FILE, "utf8"))
  : [
  { child_name: "Yusuf",  country: "Turkiye",     city: "Istanbul",   level: 5, focus_sound: "oi", likes: "Cats and boats",        appearance: { gender: "boy",  skinTone: "light olive", hair: "short dark brown hair" } },
  { child_name: "Amira",  country: "Egypt",       city: "Cairo",      level: 4, focus_sound: "ai", likes: "Kites and drawing",     appearance: { gender: "girl", skinTone: "olive",       hair: "dark hair under a hijab" } },
  { child_name: "Idris",  country: "Morocco",     city: "Fez",        level: 3, focus_sound: "ck", likes: "Figs and football",     appearance: { gender: "boy",  skinTone: "medium brown", hair: "short black hair" } },
  { child_name: "Zahra",  country: "Pakistan",    city: "Lahore",     level: 6, focus_sound: "ar", likes: "Stars and rooftops",    appearance: { gender: "girl", skinTone: "medium",      hair: "long dark hair under a scarf" } },
  { child_name: "Bilal",  country: "Indonesia",   city: "Yogyakarta", level: 2, focus_sound: "sh", likes: "Fish and rivers",       appearance: { gender: "boy",  skinTone: "tan",         hair: "short black hair" } },
  { child_name: "Sumaya", country: "Somalia",     city: "Hargeisa",   level: 5, focus_sound: "ee", likes: "Goats and singing",     appearance: { gender: "girl", skinTone: "deep brown",  hair: "hair under a bright scarf" } },
  { child_name: "Omar",   country: "Jordan",      city: "Amman",      level: 4, focus_sound: "oo", likes: "Bikes and bread",       appearance: { gender: "boy",  skinTone: "light olive", hair: "curly dark hair" } },
  { child_name: "Nadia",  country: "Malaysia",    city: "Melaka",     level: 3, focus_sound: "ng", likes: "Kittens and markets",   appearance: { gender: "girl", skinTone: "tan",         hair: "black hair in a plait" } },
  { child_name: "Tariq",  country: "Bangladesh",  city: "Sylhet",     level: 6, focus_sound: "or", likes: "Boats and rain",        appearance: { gender: "boy",  skinTone: "medium brown", hair: "short black hair" } },
  { child_name: "Layla",  country: "Saudi Arabia",city: "Jeddah",     level: 2, focus_sound: "ch", likes: "Cats and the sea",      appearance: { gender: "girl", skinTone: "light olive", hair: "dark hair under a scarf" } },
];

let total = 0;
const rows = [];
for (const [i, c] of CASES.entries()) {
  const started = Date.now();
  console.log(`\n===== ${i + 1}/10  ${c.child_name} (L${c.level}, "${c.focus_sound}") =====`);
  let row, err = null, bookId = null;
  try {
    const { book } = await j("/books", { method: "POST", body: JSON.stringify({
      ...c, child_age: 6, country_flag: "", culture_notes: `A Muslim family in ${c.city}.`,
      faith: "Muslim", email: "lyndencooke@gmail.com",
    }) });
    bookId = book.id;
    await j("/dev/simulate-pay", { method: "POST", body: JSON.stringify({ kind: "book", book_id: book.id }) });
    for (let n = 0; n < 150; n++) {
      await new Promise(r => setTimeout(r, 5000));
      ({ book: row } = await j(`/books/${book.id}`));
      if (["text_ready","content_rejected","failed","paused_budget","paused_provider_credit","ready"].includes(row.status)) break;
    }
  } catch (e) { err = e.message; }

  const jb = row?.progress?.job || {};
  const bd = jb.breakdown || {};
  const st = jb.story || row?.story?.story || {};
  const cost = jb.cost ?? row?.cost_usd ?? 0;
  // A revision is now ANY edit pass: the edit-request policy writes
  // story_gate_first / story_gate_pass_N, and only writes story_gate_second
  // when the passes are exhausted. Keying off story_gate_second alone
  // reported a book that took two edit passes as a clean first draft.
  const revised = Boolean(bd.story_gate_first || bd.story_gate_pass_2 ||
    bd.story_gate_second || bd.editor_review_first);
  const focus = String(c.focus_sound).toLowerCase();
  const rw = st.read_words || [];
  const rec = {
    n: i + 1, book_id: bookId, child: c.child_name, level: c.level, sound: c.focus_sound,
    status: row?.status || "error", error: err, cost,
    first_draft_accepted: row?.status === "text_ready" && !revised,
    revised, title: st.title,
    open_edit_requests: (bd.story_gate_edit_requests || []).length + (bd.editor_edit_requests || []).length,
    read_words: rw,
    focus_words_on_page: rw.filter(w => String(w).toLowerCase().includes(focus)).length,
    stages: bd.stages || { qa: bd.qa, story: bd.story_usd },
    secs: Math.round((Date.now() - started) / 1000),
  };
  rows.push(rec);
  fs.appendFileSync(OUT, JSON.stringify(rec) + "\n");
  total += cost;
  console.log(`  -> ${rec.status} | $${cost.toFixed(4)} | first-draft ${rec.first_draft_accepted} | words ${JSON.stringify(rw)} (${rec.focus_words_on_page} with "${focus}") | ${rec.secs}s | running $${total.toFixed(2)}`);

  if (i === 2 && total / 3 > EARLY_AVG) { console.log(`\nABORT: first 3 averaged $${(total/3).toFixed(2)} > $${EARLY_AVG}`); break; }
  if (total > HARD_TOTAL) { console.log(`\nABORT: running total $${total.toFixed(2)} > $${HARD_TOTAL}`); break; }
}

const done = rows.filter(r => r.status === "text_ready");
const acc = rows.length ? done.filter(r => r.first_draft_accepted).length / rows.length : 0;
const rejected = rows.filter(r => r.status === "content_rejected");
console.log("\n──────── TEXT-ONLY x10 SUMMARY ────────");
console.log(`stories run:            ${rows.length}`);
console.log(`text_ready:             ${done.length}`);
console.log(`content_rejected:       ${rejected.length}`);
console.log(`first-draft acceptance: ${(acc * 100).toFixed(0)}%  (doctrine gate: >=80%)`);
console.log(`total spend:            $${total.toFixed(2)}`);
console.log(`mean per story:         $${(total / (rows.length || 1)).toFixed(3)}  (doctrine cap: $0.10)`);
const edits = rows.filter(r => r.open_edit_requests > 0);
console.log(`books with open edit requests: ${edits.length}` + (edits.length ? ` — ${edits.map(e => e.child + "(" + e.open_edit_requests + ")").join(", ")}` : ""));
if (rejected.length) console.log(`mean per rejected:      $${(rejected.reduce((a, r) => a + r.cost, 0) / rejected.length).toFixed(3)}`);
const bad = rows.filter(r => r.read_words?.length && (r.read_words.length !== 6 || r.focus_words_on_page !== 2));
console.log(`story-words 2+4 split:  ${rows.length - bad.length}/${rows.length} correct` + (bad.length ? ` — off: ${bad.map(b => `${b.child}(${b.read_words.length}w/${b.focus_words_on_page}f)`).join(", ")}` : ""));
