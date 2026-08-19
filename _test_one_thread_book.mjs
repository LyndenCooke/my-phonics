// ONE-THREAD BOOK TEST (Lynden 2026-08-17): everything for one book in a
// single gpt-5.6-sol conversation — story, self-check, editor review, forward
// image simulation, backward planning pass, storyboard plausibility gate.
// STOPS BEFORE ANY IMAGE GENERATION. The hypothesis (from the ChatGPT-web
// experiment): the planner and painter sharing one context is what made the
// chat's images good, so the plan itself should be born in one context too.
//
// Simplicity doctrine baked in (Lynden: "the more details the more chance of
// failure"): one location thread, hero + one adult, at most TWO key objects,
// ONE physical mechanism, calibrated against the published MPB books.
import fs from "node:fs";
import { cfg } from "./server/forge/env.mjs";
import { getLevel, coreStoriesFor } from "./server/forge/phonics.mjs";

const MODEL = "gpt-5.6-sol";
const PRICE = { in: 5.0, out: 30.0 }; // per 1M tokens (mirrors claude.mjs)
let totalCost = 0;
let prevId = null;
const transcript = [];

async function turn(label, input, schema) {
  const body = {
    model: MODEL,
    input,
    reasoning: { effort: "medium" },
    text: { format: { type: "json_schema", name: "out", schema, strict: true } },
  };
  if (prevId) body.previous_response_id = prevId;
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.OPENAI_API_KEY}` },
    body: JSON.stringify(body),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`${label}: ${res.status} ${JSON.stringify(j).slice(0, 300)}`);
  prevId = j.id;
  const text = (j.output || []).flatMap((o) => o.content || []).find((c) => c.type === "output_text")?.text ?? "";
  const cost = ((j.usage?.input_tokens || 0) * PRICE.in + (j.usage?.output_tokens || 0) * PRICE.out) / 1e6;
  totalCost += cost;
  const data = JSON.parse(text);
  transcript.push({ label, cost: Number(cost.toFixed(4)), usage: j.usage, data });
  console.log(`[${label}] $${cost.toFixed(4)} (in ${j.usage?.input_tokens} out ${j.usage?.output_tokens}) — running $${totalCost.toFixed(3)}`);
  return data;
}

// ---------------- persona + level ----------------
// CASE_JSON env overrides the default persona for variance runs.
const CASE = process.env.CASE_JSON ? JSON.parse(fs.readFileSync(process.env.CASE_JSON, "utf8")) : null;
const child = CASE?.child || { name: "Hamza", age: 6, gender: "boy", skinTone: "light brown", hair: "short black hair" };
const setting = CASE?.setting || { country: "Oman", city: "Muscat", culture: "A Muslim family in Muscat; whitewashed houses, the corniche, fishing boats, kites on the beach." };
const LEVEL = CASE?.level ?? 4, SOUND = CASE?.sound ?? "ow";
const LIKES = CASE?.likes || "kites and cats";
const level = getLevel(LEVEL);
if (!level) throw new Error("no level data");
if (!level.graphemes.includes(SOUND)) throw new Error(`"${SOUND}" is not an L${LEVEL} grapheme`);
const exemplars = coreStoriesFor(LEVEL, 2);

// SHIFTY SOUNDS (Lynden 2026-08-17: "low" and "down" use different ow sounds).
// A grapheme+SOUND pair is only decodable at or above its allowed_from_level —
// grapheme-string checking alone let L6 words (now, down) into an L4 book,
// including its title. Build an explicit constraint block from the ledger, and
// keep the gated example words for a deterministic post-check.
const shifty = JSON.parse(fs.readFileSync("myphonics_books/data/shifty_sounds.json", "utf8"));
const gated = [];      // { grapheme, sound, examples } pronunciations NOT yet taught
const shiftyLines = [];
for (const card of shifty.alt_pronunciation_cards || []) {
  const prons = card.pronunciations || [];
  const taught = prons.filter((x) => x.allowed_from_level <= LEVEL);
  const later = prons.filter((x) => x.allowed_from_level > LEVEL);
  if (!later.length || !level.cumulative.includes(card.grapheme)) continue;
  for (const g of later) gated.push({ grapheme: card.grapheme, sound: g.sound, examples: g.examples || [] });
  shiftyLines.push(
    `"${card.grapheme}" at Level ${LEVEL} is ONLY ${taught.map((x) => `${x.sound} as in ${(x.examples || []).slice(0, 3).join("/")}`).join(" or ")} — NEVER ${later.map((x) => `${x.sound} as in ${(x.examples || []).slice(0, 3).join("/")} (that is Level ${x.allowed_from_level})`).join("; ")}.`);
}
const shiftyBlock = shiftyLines.length
  ? `
SHIFTY SOUNDS — A GRAPHEME ONLY COUNTS WITH ITS TAUGHT SOUND. Words using a not-yet-taught pronunciation are NOT decodable at this level, in the story text, the title or the read_words:
- ${shiftyLines.join(String.fromCharCode(10)+"- ")}`
  : "";
const pagesCount = LEVEL >= 5 ? 8 : 6;

// ---------------- schemas (strict) ----------------
const S = (props, required = Object.keys(props)) => ({ type: "object", properties: props, required, additionalProperties: false });
const arr = (items) => ({ type: "array", items });
const str = { type: "string" };
const PAGE = S({ text: str, scene: str });
const STORY = S({
  title: str,
  premise: S({ hero_want: str, problem: str, mechanism: str, resolution: str }),
  key_objects: arr(S({ name: str, description: str })),
  cast: arr(S({ id: str, who: str, appearance: str })),
  pages: arr(PAGE),
  read_words: arr(str),
  focus_word_examples: arr(str),
  tricky_words_used: arr(str),
  cover_brief: str,
});
const CHECKED = S({ violations_found: arr(str), story: STORY });
const REVIEW = S({
  cold_read: str,
  issues: arr(S({ severity: { type: "string", enum: ["critical", "major", "minor"] }, area: str, detail: str })),
  fixed_story: STORY,
});
const FWD = S({ pages: arr(S({ page: { type: "integer" }, what_child_sees: str, changed_from_previous: str, must_not_change: str, draft_brief: str })) });
const BWD = S({ reasoning: str, pages: arr(S({ page: { type: "integer" }, evidence_planted: str, revised_brief: str })) });
const STATE = S({ object: str, assertion: str });
const FINAL = S({
  storyboard_verdict: { type: "string", enum: ["plausible", "fixed_now_plausible"] },
  physical_issues_found: arr(str),
  cover: S({ brief: str }),
  pages: arr(S({
    page: { type: "integer" },
    brief: str,
    required_visible_states: arr(STATE),
    forbidden_visible_states: arr(STATE),
    carries_forward: str,
  })),
});

// ---------------- the one conversation ----------------
const doctrine = `You are the entire creative team for ONE MyPhonicsBooks personalised decodable book, working in one continuous conversation: writer, phonics checker, editor, storyboard artist and continuity supervisor. British English throughout.

SIMPLICITY IS THE HOUSE STYLE. The published MyPhonicsBooks below are the quality bar — notice how simple they are. One story thread in one connected location. Hero plus AT MOST one adult. AT MOST TWO key objects. Exactly ONE physical mechanism, so ordinary a parent could re-enact it in the kitchen. Never add depth, sub-plots, planted objects or extra beats: every added detail is another thing the illustrations can get wrong.

SAFE BEHAVIOUR: the child notices, decides and leads; an adult shares any risky step in the same page. Modest dress (knees and shoulders covered). All eyes in any scene description are solid black filled ovals.

PHONICS CONTRACT for Level ${LEVEL}: every word decodable using ONLY these graphemes: ${JSON.stringify(level.cumulative)} — or on this tricky list: ${JSON.stringify(level.trickyWords)}. The name "${child.name}" is always allowed. Focus sound "${SOUND}" in at least 3 distinct words of the story text. read_words: EXACTLY 6 words that appear in the story text — EXACTLY 2 containing "${SOUND}", plus 4 other level-worthy words.

${shiftyBlock}

PUBLISHED EXEMPLARS (the bar for simplicity and warmth):
${JSON.stringify(exemplars).slice(0, 4000)}`;

console.log(`ONE-THREAD BOOK: ${child.name}, L${LEVEL} "${SOUND}", ${setting.city} — model ${MODEL}\n`);

// 1. write
const story1 = await turn("write", `${doctrine}

Write the ${pagesCount}-page story now for ${child.name}, age ${child.age}, in ${setting.city}, ${setting.country}. ${setting.culture} ${child.gender === "girl" ? "She" : "He"} likes ${LIKES}. Each page: one or two short sentences a young child would say aloud, plus a scene brief. Keep it SIMPLE.`, STORY);

// 2. self-check
const checked = await turn("self-check", `Now check your own story with fresh eyes against the phonics contract and the simplicity caps (one thread, one adult, max two key objects, one mechanism, read_words 2+4). List every violation you find, then return the corrected story. If nothing is wrong, return it unchanged with an empty violations list.`, CHECKED);

// 3. editor review (same thread — Lynden 2026-08-17: one window for everything)
const review = await turn("editor", `Read the story again as a demanding but fair editor whose calibration bar is the published exemplars above — NOT literary fiction. Blocking (critical/major) is ONLY: nonsense or contradiction, a hero who causes nothing, unsafe behaviour, phonics violations, or text/scene disagreement. Simplicity is never a fault. Stiff caption-like lines are minor: fix them yourself in fixed_story rather than demanding a rewrite. Return your issues and the final story.`, REVIEW);
const story = review.fixed_story;

// 4. forward simulation
await turn("plan-forward", `Now storyboard it. For each page 1..${pagesCount}: what does a child SEE, what visibly changed from the previous image, what must NOT change, and a draft illustration brief. Think like film continuity: each image starts from the physical state the previous one created.`, FWD);

// 5. backward pass
await turn("plan-backward", `Now plan it BACKWARDS. Start from the final image and walk back to page 1: for each page, what must ALREADY be visible so the later pages are believable — evidence planted early, states that persist, residue that remains after the mechanism resolves. Revise each brief accordingly.`, BWD);

// 6. storyboard plausibility gate + final package
const final = await turn("storyboard-gate", `Final gate: judge the whole revised storyboard as a physical sequence. Materials must behave like themselves (water soaks and darkens — never pebbles or beads; cloth drapes; wind moves light things first). Every mechanism's cause must be VISIBLY connected to its effect in the frame. Reject impossible or unconnected states and fix them. Then output the final package: cover brief plus, for each page, the final brief, required_visible_states and forbidden_visible_states (assert ONLY the load-bearing mechanism and character continuity — keep the list short), and carries_forward (what the next image inherits).`, FINAL);

// ---------------- report ----------------
// Deterministic shifty check: the ledger's own example words for gated
// pronunciations must not appear anywhere in the final text or word lists.
const allText = [story.title, ...story.pages.map((p) => p.text), ...story.read_words, ...story.focus_word_examples].join(" ").toLowerCase();
const shiftyViolations = gated.flatMap((g) => g.examples.filter((w) => new RegExp(`\b${w.toLowerCase()}\b`).test(allText)).map((w) => `"${w}" uses ${g.grapheme}=${g.sound} (not taught until later)`));

const out = { child, setting, level: LEVEL, sound: SOUND, model: MODEL, shiftyViolations, totalCost: Number(totalCost.toFixed(4)), transcript };
fs.writeFileSync(process.env.OUT_JSON || "one_thread_book.json", JSON.stringify(out, null, 1));

console.log("\n──────── ONE-THREAD RESULT ────────");
console.log("title:", story.title);
console.log("read_words:", JSON.stringify(story.read_words));
console.log("editor issues:", review.issues.map((i) => `${i.severity}/${i.area}`).join(", ") || "none");
console.log("self-check violations:", checked.violations_found.length);
console.log("storyboard verdict:", final.storyboard_verdict);
console.log("physical issues caught at the gate:", final.physical_issues_found.length);
final.physical_issues_found.forEach((s) => console.log("  -", s.slice(0, 110)));
console.log("\npages:");
story.pages.forEach((p, i) => console.log(`  p${i + 1}: ${p.text}`));
console.log(`\nassertions per page: ${final.pages.map((p) => p.required_visible_states.length + p.forbidden_visible_states.length).join(", ")}`);
console.log(`TOTAL COST: $${totalCost.toFixed(3)}  (${transcript.length} turns, one conversation)`);
console.log("full record -> one_thread_book.json");
