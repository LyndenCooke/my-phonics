// TWO-SCENE PROOF→FINALISE TEST (cost doctrine step 3, Lynden 2026-08-15/16).
// Proves character/object/location/state continuity across two consecutive
// scenes WITHOUT generating a cover, worksheets, profile page or full book —
// and proves the two-tier engine plan: cheap Vertex proof first, OpenAI
// finalise only after the proof passes, with the proof's QA corrections baked
// into the finalise prompts.
//
//   node server/forge/_test_two_scene.mjs proof              # Vertex proof pass
//   node server/forge/_test_two_scene.mjs finalise           # OpenAI final render (requires passed proof)
//   node server/forge/_test_two_scene.mjs proof <bookId>     # different source book
//
// Source story defaults to the text_ready Yusuf book (already paid for and
// passed every text gate; single location; gate/cat/rug state changes page to
// page — a real continuity workout). Pages 1-2 are used.
//
// HARD CAPS (doctrine): the OpenAI finalise stage aborts BEFORE any call that
// would take its cumulative spend over $0.30. The Vertex proof is billed to
// GCP (~$0.04/image) and spends zero OpenAI credit — enforced by the pinned
// engine order (FORGE_IMG_ENGINE set = no cross-engine fallback, chain off).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// LLM tier (director, QA, state extraction) stays on Vertex in BOTH phases —
// set before claude.mjs is imported (its engine choice is module-level).
if (!process.env.FORGE_LLM && !process.env.ANTHROPIC_API_KEY) {
  process.env.FORGE_LLM = "vertex";
}

const { directScenes, extractSceneState } = await import("./claude.mjs");
const { generateHero, generateScene, generateAnimal } = await import("./images.mjs");
const { cfg } = await import("./env.mjs");

// Pages 3-4 (0-indexed 2,3): Yusuf is ALONE with the cat on both — no cast
// sheets needed, matching the doctrine's "one character reference" scope —
// and the continuity load is real: the gate's state (creaks shut → pushed
// slowly), the cat's reaction (hops back, hides under the bench → stays
// back), same hall, same rug. Round 1 used pages 1-2 and Mum appeared TWICE
// because the brief staged her while the no-cast-refs prompt said the hero
// was alone — the pages must match the reference budget.
const PAGES = [2, 3];
// Animals in the key-object list need generateAnimal's eye-reference stack:
// prompting alone never gives an animal the house dot-eye (2026-08-05 lyrebird
// doctrine), and round 2's cat came out with yellow irised eyes to prove it.
const ANIMAL_RE = /\b(cat|kitten|dog|puppy|bird|owl|hen|chick|duck|rabbit|goat|sheep|lamb|donkey|horse|fish|mouse|hamster|tortoise|turtle)\b/i;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "..", "public", "custom-books", "two-scene-test");
fs.mkdirSync(OUT_DIR, { recursive: true });

const FINALISE_CAP_USD = 0.3; // doctrine: two-scene visual proof cap
const EST_SCENE_FULL = 0.2; // stateless gpt-image with full-res refs (usage-priced)
const EST_SCENE_SMALL = 0.12; // same call with 768px JPEG refs

const phase = (process.argv[2] || "proof").toLowerCase();
const BOOK_ID = process.argv[3] || "606c0fdd-6af9-44be-9511-2b90c66a6f2b";
const statePath = path.join(OUT_DIR, "state.json");

function loadState() {
  return fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, "utf8")) : {};
}
function saveState(s) {
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}

async function fetchBook(id) {
  const res = await fetch(`${cfg.SUPABASE_URL}/rest/v1/custom_books?id=eq.${id}&select=*`, {
    headers: { apikey: cfg.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${cfg.SUPABASE_SERVICE_KEY}` },
  });
  const rows = await res.json();
  if (!rows?.[0]) throw new Error(`book ${id} not found`);
  return rows[0];
}

// Local copies of jobs.mjs's (unexported) prompt-block builders — kept
// deliberately identical in behaviour so the test exercises the same context
// the real pipeline would give the illustrator.
function worldBlockOf(story) {
  const setting = story.setting || {};
  return setting.place
    ? `WORLD CONSISTENCY (identical on every page unless the scene text says otherwise): This story happens in ${setting.place}. ` +
      `Setting details to keep identical: ${setting.architecture || ""}. Season: ${setting.season || "unspecified"}. Weather: ${setting.weather || "unspecified"}.`
    : "";
}
function directorObjectsBlock(story, objects) {
  const keyObjects = story.key_objects || [];
  const lookFor = (name) => keyObjects.find((o) => o.name.toLowerCase() === String(name || "").toLowerCase())?.look || "";
  if (!objects?.length) {
    return keyObjects.length ? " KEY OBJECTS: none of the story's recurring objects are visible in this frame. Do not draw them." : "";
  }
  const lines = objects.map((o) => `${o.name}${lookFor(o.name) ? ` (normally: ${lookFor(o.name)})` : ""} — ON THIS PAGE: ${o.state}`);
  return (
    ` KEY OBJECTS ON THIS PAGE — ${lines.join("; ")}. ` +
    "The 'normally' description is what the object looks like when it is finished and in its usual state; the ON THIS PAGE state WINS over it. " +
    "If a state says an object does not exist yet, is empty, unfinished or absent, draw it that way or not at all. Draw no recurring object that is not listed here."
  );
}
function assertionText(d) {
  return d && (d.required_visible_states?.length || d.forbidden_visible_states?.length)
    ? ` MUST BE CLEARLY VISIBLE: ${(d.required_visible_states || []).map((a) => `${a.object} — ${a.assertion}`).join("; ")}.` +
        ((d.forbidden_visible_states || []).length ? ` MUST NOT BE SHOWN: ${(d.forbidden_visible_states || []).map((a) => `${a.object} — ${a.assertion}`).join("; ")}.` : "")
    : "";
}

async function downscaleRef(buf) {
  return sharp(buf).resize({ width: 768, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
}

async function runScene({ book, story, directed, pageIndex, heroBuf, prevBuf, carriedState, correction, compressRefs, objectRefs = [] }) {
  const child = {
    name: book.child_name, age: book.child_age, city: book.city, country: book.country,
    cultureNotes: book.culture_notes, likes: book.likes, appearance: book.appearance || {},
  };
  const d = directed.find((x) => x.page === pageIndex + 1);
  const page = story.pages[pageIndex];
  const sceneBrief = d
    ? `${d.brief} ${child.name} feels ${d.emotion}. Staging: ${d.staging}${assertionText(d)}`
    : page.scene;
  const carried = carriedState
    ? ` ACTUAL STATE AFTER THE PREVIOUS PAGE (binding — redraw each object exactly like this except what this page's action changes): ${carriedState}`
    : "";
  const useHero = compressRefs ? await downscaleRef(heroBuf) : heroBuf;
  const usePrev = prevBuf ? (compressRefs ? await downscaleRef(prevBuf) : prevBuf) : null;
  const useObjects = compressRefs
    ? await Promise.all(objectRefs.map(async (o) => ({ ...o, buf: await downscaleRef(o.buf) })))
    : objectRefs;
  return generateScene({
    heroBuf: useHero,
    scene: sceneBrief + (correction ? ` CORRECTION FROM THE PROOF PASS — the previous rendering of this page had this specific problem; avoid it from the start: ${correction}` : ""),
    child,
    settingBlock: worldBlockOf(story) + directorObjectsBlock(story, d?.objects) + carried,
    anchorBuf: null,
    prevBuf: usePrev,
    camera: pageIndex === PAGES[0] ? "wide" : d?.camera || "new-angle",
    castRefs: [],
    objectRefs: useObjects,
    pageText: page.text,
    assertions: d ? { required: d.required_visible_states || [], forbidden: d.forbidden_visible_states || [] } : null,
    previousResponseId: null,
    chainEnabled: false,
  });
}

// ---------------------------------------------------------------------------
const book = await fetchBook(BOOK_ID);
const story = book.progress?.job?.story;
if (!story) throw new Error(`book ${BOOK_ID} has no story in progress.job — pick a text_ready book`);
console.log(`[two-scene] "${story.title}" — ${book.child_name}, L${book.level} "${book.focus_sound}" — phase: ${phase}`);

const state = loadState();
let totalCost = 0;

if (phase === "proof") {
  process.env.FORGE_IMG_ENGINE = "vertex"; // pinned: no fallback, chain off

  // Director pass (text-only, Vertex): staging + per-page assertions for the
  // whole story — stored so the finalise phase (and any proof retry) reuses
  // the identical plan rather than paying to re-derive it.
  const directedPath = path.join(OUT_DIR, "directed.json");
  let directed;
  if (fs.existsSync(directedPath)) {
    console.log("[two-scene] reusing stored director plan");
    directed = JSON.parse(fs.readFileSync(directedPath, "utf8"));
  } else {
    console.log("[two-scene] directing scenes (vertex text call)...");
    const dir = await directScenes({ story, child: { name: book.child_name } });
    totalCost += dir.cost;
    directed = dir.data.pages || dir.data;
    fs.writeFileSync(directedPath, JSON.stringify(directed, null, 2));
  }

  const heroPath = path.join(OUT_DIR, "proof_hero.png");
  let hero;
  if (fs.existsSync(heroPath)) {
    console.log("[two-scene] reusing stored hero reference");
    hero = { buf: fs.readFileSync(heroPath), cost: 0 };
  } else {
    console.log("[two-scene] generating hero reference (vertex)...");
    hero = await generateHero({ child: { name: book.child_name, age: book.child_age, appearance: book.appearance || {}, city: book.city, country: book.country } });
    totalCost += hero.cost;
    fs.writeFileSync(heroPath, hero.buf);
  }

  // Animal key objects get a locked identity reference with the correct
  // dot-eye baked in — the ONLY fix that survives into scenes (never painted).
  const animalRefs = [];
  for (const o of story.key_objects || []) {
    if (!ANIMAL_RE.test(o?.name || "")) continue;
    const refFile = path.join(OUT_DIR, `ref_${o.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.png`);
    if (fs.existsSync(refFile)) {
      console.log(`[two-scene] reusing stored ${o.name} reference`);
      animalRefs.push({ name: o.name, buf: fs.readFileSync(refFile) });
    } else {
      console.log(`[two-scene] generating ${o.name} reference (vertex, eye-ref stack)...`);
      const a = await generateAnimal({ name: o.name, appearance: o.look || o.name });
      totalCost += a.cost;
      fs.writeFileSync(refFile, a.buf);
      animalRefs.push({ name: o.name, buf: a.buf });
    }
  }

  // A re-run after a failed proof feeds the previous round's QA reasons back
  // in as corrections — same mechanism the finalise phase uses, so a proof
  // retry converges instead of rolling the same dice again.
  const priorCorrections = state.proof?.corrections || {};
  const corrections = {};
  let prevBuf = null;
  let carriedState = null;
  const verdicts = [];
  for (const i of PAGES) {
    console.log(`[two-scene] proof scene (story page ${i + 1}, vertex)...`);
    const s = await runScene({ book, story, directed, pageIndex: i, heroBuf: hero.buf, prevBuf, carriedState, correction: priorCorrections[i + 1], objectRefs: animalRefs });
    totalCost += s.cost;
    fs.writeFileSync(path.join(OUT_DIR, `proof_scene${i + 1}.jpg`), s.buf);
    const cons = s.qa?.consistency;
    verdicts.push({ page: i + 1, eye_pass: s.qa?.pass !== false, consistency_pass: cons ? cons.pass : null, reason: cons?.reason || null, repaired: Boolean(s.qa?.consistencyRepaired) });
    if (cons && !cons.pass) corrections[i + 1] = cons.reason;
    else if (s.qa?.consistencyRepaired && cons?.pass) corrections[i + 1] = `(repaired in proof — original fault: ${s.qa.consistency.reason || "see qa notes"})`;
    if (s.qa?.pass === false) corrections[i + 1] = `${corrections[i + 1] ? corrections[i + 1] + " " : ""}EYE RULE: every eye (human AND animal) must be a tiny solid black filled dot — no white, no iris, no highlight.`;
    prevBuf = s.buf;
    try {
      const objectNames = [...new Set([...(story.key_objects || []).map((o) => o?.name), ...((directed.find((x) => x.page === i + 1)?.objects || []).map((o) => o?.name))].filter(Boolean))];
      if (objectNames.length) {
        const st = await extractSceneState(s.buf.toString("base64"), { objectNames });
        totalCost += st.cost;
        carriedState = st.data.states || null;
      }
    } catch (e) {
      console.warn(`[two-scene] state extraction failed: ${e.message}`);
      carriedState = null;
    }
  }

  // The eye rule is non-negotiable — an eye fail blocks the proof exactly
  // like a consistency fail (round 2 "passed" with a yellow-eyed cat because
  // this verdict only looked at consistency).
  const proofPassed = verdicts.every((v) => v.consistency_pass !== false && v.eye_pass !== false);
  saveState({ ...state, bookId: BOOK_ID, proof: { passed: proofPassed, verdicts, corrections, carriedStateAfter1: null, cost: Number(totalCost.toFixed(4)), at: new Date().toISOString() } });
  console.log("\n──────────── PROOF REPORT ────────────");
  for (const v of verdicts) console.log(`scene ${v.page}: eye=${v.eye_pass ? "ok" : "FAIL"} consistency=${v.consistency_pass === null ? "n/a" : v.consistency_pass ? "PASS" : "FAIL"}${v.repaired ? " (after repair)" : ""}${v.reason ? ` — ${String(v.reason).slice(0, 200)}` : ""}`);
  console.log(`proof spend (GCP/Vertex): $${totalCost.toFixed(4)} — OpenAI spend: $0`);
  console.log(proofPassed ? "PROOF PASSED — finalise is authorised (run with: finalise)" : "PROOF FAILED — do NOT finalise; fix and re-run proof.");
  process.exit(proofPassed ? 0 : 1);
}

if (phase === "finalise") {
  if (!state.proof?.passed) throw new Error("no passed proof on record — run the proof phase first (finalise without a passed proof is exactly the spend the doctrine forbids)");
  process.env.FORGE_IMG_ENGINE = "openai"; // pinned: a failed OpenAI call must abort, not fall back
  process.env.FORGE_CHAIN_SCENES = "0"; // stateless — the test measures the ref-upload strategy itself

  const directed = JSON.parse(fs.readFileSync(path.join(OUT_DIR, "directed.json"), "utf8"));
  const heroBuf = fs.readFileSync(path.join(OUT_DIR, "proof_hero.png"));
  const corrections = state.proof.corrections || {};
  const animalRefs = (story.key_objects || [])
    .filter((o) => ANIMAL_RE.test(o?.name || ""))
    .map((o) => {
      const refFile = path.join(OUT_DIR, `ref_${o.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.png`);
      return fs.existsSync(refFile) ? { name: o.name, buf: fs.readFileSync(refFile) } : null;
    })
    .filter(Boolean);

  const spendGuard = (est, label) => {
    if (totalCost + est > FINALISE_CAP_USD) {
      throw new Error(`HARD CAP: $${totalCost.toFixed(2)} spent + ~$${est} for ${label} would exceed the $${FINALISE_CAP_USD} finalise cap — aborting before the call.`);
    }
  };

  const abTest = [];
  let prevBuf = null;
  let carriedState = null;
  const verdicts = [];
  for (const i of PAGES) {
    const compressRefs = i !== PAGES[0]; // A/B: first scene full-res refs, second 768px JPEG refs
    spendGuard(compressRefs ? EST_SCENE_SMALL : EST_SCENE_FULL, `scene ${i + 1}`);
    console.log(`[two-scene] finalise scene (story page ${i + 1}, openai, refs: ${compressRefs ? "768px jpeg" : "full-res"})...`);
    const s = await runScene({ book, story, directed, pageIndex: i, heroBuf, prevBuf, carriedState, correction: corrections[i + 1], compressRefs, objectRefs: animalRefs });
    totalCost += s.cost;
    fs.writeFileSync(path.join(OUT_DIR, `final_scene${i + 1}.jpg`), s.buf);
    const cons = s.qa?.consistency;
    verdicts.push({ page: i + 1, eye_pass: s.qa?.pass !== false, consistency_pass: cons ? cons.pass : null, reason: cons?.reason || null, repaired: Boolean(s.qa?.consistencyRepaired) });
    abTest.push({ scene: i + 1, refs: compressRefs ? "768px-jpeg" : "full-res", cost_usd: Number(s.cost.toFixed(4)) });
    prevBuf = s.buf;
    try {
      const objectNames = [...new Set([...(story.key_objects || []).map((o) => o?.name), ...((directed.find((x) => x.page === i + 1)?.objects || []).map((o) => o?.name))].filter(Boolean))];
      if (objectNames.length) {
        const st = await extractSceneState(s.buf.toString("base64"), { objectNames });
        totalCost += st.cost;
        carriedState = st.data.states || null;
      }
    } catch { carriedState = null; }
  }

  const passed = verdicts.every((v) => v.consistency_pass !== false && v.eye_pass !== false);
  saveState({ ...state, finalise: { passed, verdicts, abTest, cost: Number(totalCost.toFixed(4)), at: new Date().toISOString() } });
  console.log("\n──────────── FINALISE REPORT ────────────");
  for (const v of verdicts) console.log(`scene ${v.page}: eye=${v.eye_pass ? "ok" : "FAIL"} consistency=${v.consistency_pass === null ? "n/a" : v.consistency_pass ? "PASS" : "FAIL"}${v.repaired ? " (after repair)" : ""}${v.reason ? ` — ${String(v.reason).slice(0, 200)}` : ""}`);
  console.log(`ref-strategy A/B: ${abTest.map((a) => `scene${a.scene} ${a.refs} = $${a.cost_usd}`).join("  |  ")}`);
  console.log(`finalise spend: $${totalCost.toFixed(4)} (cap $${FINALISE_CAP_USD})`);
  console.log(passed ? "FINALISE PASSED — compare proof_ vs final_ images for continuity + character match." : "FINALISE FAILED — see reasons above.");
  process.exit(passed ? 0 : 1);
}

throw new Error(`unknown phase "${phase}" — use proof or finalise`);
