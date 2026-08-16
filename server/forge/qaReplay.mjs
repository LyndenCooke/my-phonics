// QA REPLAY HARNESS — regression suite for the vision QA gates, run against
// ARCHIVED book images. Zero image-generation calls: every case re-judges an
// already-paid-for picture, so a full run costs only the QA model's pennies
// (Lynden 2026-08-15: "replay archived failures for free" — the first step of
// the cost doctrine, before any new generation is allowed).
//
//   node server/forge/qaReplay.mjs             # run every case (vertex LLM)
//   node server/forge/qaReplay.mjs idris       # one book's cases
//   FORGE_LLM=openai node server/forge/qaReplay.mjs   # explicit engine override
//
// Every case is a KNOWN historical failure: the correct outcome is FAIL. A
// case that comes back "pass" means the QA gate has gone lenient and would
// ship that defect again — the harness exits non-zero so CI can catch it.
//
// PROVENANCE. Amira's page texts are verbatim from her pdf_spec.json and
// Zahra's from her published book.html. Idris's "Figs on the Tray" story text
// was destroyed by the pre-rejected_runs state wipe (2026-08-15), so his page
// texts and assertions are RECONSTRUCTED from the surviving images and
// Lynden's fault descriptions — the assertions encode the fault being tested,
// not the lost wording.
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

// Default to the gcloud Vertex path BEFORE claude.mjs is imported (its engine
// choice is a module-level const): a replay must never spend OpenAI credit
// unless explicitly told to.
if (!process.env.FORGE_LLM && !process.env.ANTHROPIC_API_KEY) {
  process.env.FORGE_LLM = "vertex";
}

const { coverContentQA, sceneConsistencyQA } = await import("./claude.mjs");
const { loadByUrl } = await import("./storage.mjs");
const sharp = (await import("sharp")).default;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_BOOKS = path.join(__dirname, "..", "..", "public", "custom-books");

const IDRIS = "147dc48c-e52e-4f3e-8892-7a775f046986";
const AMIRA = "5378b365-ee09-4618-a9e9-33c5ddde1f64";
const TWO_SCENE = "two-scene-test";
const ZAHRA_BASE = (supabaseUrl) =>
  `${supabaseUrl}/storage/v1/object/public/custom-books/34e1ed41-e1fc-43ad-8093-82583b0cf2d8`;

async function loadImage(ref) {
  if (/^https?:/.test(ref)) return loadByUrl(ref);
  const p = path.join(PUBLIC_BOOKS, ref.replace(/\//g, path.sep));
  return fs.existsSync(p) ? fs.readFileSync(p) : null;
}

// Same downscale images.mjs applies to QA character refs — the QA judge never
// needs (or gets) full-resolution sheets.
async function qaRef(name, ref) {
  const buf = await loadImage(ref);
  if (!buf) return null;
  const small = await sharp(buf).resize({ width: 512, withoutEnlargement: true }).jpeg({ quality: 70 }).toBuffer();
  return { name, b64: small.toString("base64"), mime: "image/jpeg" };
}

function buildCases(supabaseUrl) {
  const Z = ZAHRA_BASE(supabaseUrl);
  return [
    // ── Idris — "Figs on the Tray" (content_rejected, images survive on disk) ──
    {
      book: "idris",
      name: "cover: painted title lettering",
      kind: "cover",
      image: `${IDRIS}/cover.jpg`,
      why: "The artwork contains the painted title 'Figs on the Tray'; the template typesets the real title later, so embedded lettering is a production blocker.",
    },
    {
      book: "idris",
      name: "page 5: figs visibly available while the story says they are gone",
      kind: "scene",
      image: `${IDRIS}/page5.jpg`,
      reconstructed: true,
      sceneText: "The figs are all gone. The tray is empty and Idris is sad.",
      objectsBlock:
        " KEY OBJECTS ON THIS PAGE — the brass tray (normally: a round engraved brass tray) — ON THIS PAGE: empty, no figs on it; the figs — ON THIS PAGE: none remain, all the figs are gone.",
      assertions: {
        required: [{ object: "figs", assertion: "no figs remain available to Idris — the tray is empty AND no whole figs sit on or near the table within his reach" }],
        forbidden: [{ object: "figs", assertion: "whole uneaten figs visible on the table or beside the tray" }],
      },
      refs: [["Idris (the main character)", `${IDRIS}/cast_idris.jpg`]],
    },
    {
      book: "idris",
      name: "final page: sharing resolution without the recipients",
      kind: "scene",
      image: `${IDRIS}/page6.jpg`,
      reconstructed: true,
      sceneText: "Idris shares the figs. He sets them on the tray for Dad and Grandad.",
      objectsBlock:
        " KEY OBJECTS ON THIS PAGE — the brass tray (normally: a round engraved brass tray) — ON THIS PAGE: fig pieces being laid on it to share.",
      assertions: {
        required: [
          { object: "Dad", assertion: "Dad is present in the scene receiving or about to receive the figs" },
          { object: "Grandad", assertion: "Grandad is present in the scene receiving or about to receive the figs" },
        ],
        forbidden: [],
      },
      refs: [
        ["Idris (the main character)", `${IDRIS}/cast_idris.jpg`],
        ["Dad", `${IDRIS}/cast_dad.jpg`],
        ["Grandad", `${IDRIS}/cast_grandad.jpg`],
      ],
    },

    // ── Amira — "The Train in the Drain" (rejected; texts verbatim from pdf_spec) ──
    {
      book: "amira",
      name: "hook page: hook-into-drain action not actually drawn",
      kind: "scene",
      image: `${AMIRA}/page5.jpg`,
      sceneText: "Amira slid the hook into the drain. She pulled and the train popped up.",
      objectsBlock:
        " KEY OBJECTS ON THIS PAGE — the long hook (normally: a long metal hook from the market stand) — ON THIS PAGE: in Amira's hands, sliding into the drain; the drain grate (normally: a dark slotted drain grate in the ground) — ON THIS PAGE: the hook enters it; the red toy train — ON THIS PAGE: popping up out of the drain on the hook.",
      assertions: {
        required: [
          { object: "hook", assertion: "Amira is holding the hook and the hook is visibly entering or inside the drain opening — the action itself, not before or after it" },
          { object: "toy train", assertion: "the train is emerging from the drain, attached to or lifted by the hook" },
        ],
        forbidden: [],
      },
      refs: [["Amira (the main character)", `${AMIRA}/hero.jpg`]],
    },

    // ── Yusuf two-scene test — "The Cat at the Gate" (Lynden 2026-08-16: the
    // finalised page 3 PASSED scene QA yet ships a semi-transparent motion-
    // smeared "ghost" cat you can see the bench through, and the action reads
    // as nothing more than a boy at a door. defect_sweep had no opacity rule
    // at the time — this fixture keeps it honest.) ──
    {
      book: "yusuf",
      name: "page 3: cat rendered as a see-through motion smear",
      kind: "scene",
      image: `${TWO_SCENE}/final_scene3.jpg`,
      sceneText: "Yusuf pulled the flat gate, and it made a noise. The cat hopped back and hid under the bench.",
      objectsBlock:
        " KEY OBJECTS ON THIS PAGE — the cat (normally: a small grey tabby cat, solid and clearly drawn) — ON THIS PAGE: hopping back and hiding under the bench; the flat gate (normally: a turquoise metal barred flat gate) — ON THIS PAGE: being pulled by Yusuf, making a noise; the bench — ON THIS PAGE: the cat hides under it.",
      assertions: {
        required: [{ object: "cat", assertion: "the cat is drawn as a solid, opaque, clearly-formed animal a child can point at — hiding under the bench" }],
        forbidden: [{ object: "cat", assertion: "the cat rendered translucent, ghost-like, motion-blurred or as a smear the background shows through" }],
      },
      refs: [["the cat (object reference)", `${TWO_SCENE}/ref_cat.png`]],
    },

    // ── Zahra — "The Star Card" (shipped 'ready', later judged defective; assets in prod bucket) ──
    {
      book: "zahra",
      name: "clothing-change page: hero redressed against her reference sheet",
      kind: "scene-sweep", // run every page; at least one must fail character_match
      images: [1, 2, 3, 4, 5, 6].map((n) => `${Z}/page${n}.jpg`),
      sceneTexts: [
        "Zahra had a star card for Gran. She went up to the roof.",
        "Wind hit the card and it shot off! Zahra ran down the steps with Mum.",
        "In the yard dust hid it all. Zahra looked by pots and steps.",
        "No card was in the dust. Then a red dot showed on a mat.",
        "Zahra lifted the mat and found it! The star card was bent but not split.",
        "Zahra handed Gran the star card. Gran hugged her in the yard.",
      ],
      objectsBlock:
        " KEY OBJECTS — the star card (normally: a handmade card with a red star dot on it); the courtyard mat (normally: a patterned mat in the yard).",
      refs: [["Zahra (the main character)", `${Z}/cast_zahra.jpg`]],
      why: "One page shipped the hero bare-headed in a yellow dress; her sheet fixes a white headscarf and pink tunic (2026-08-14).",
    },
    {
      book: "zahra",
      name: "mat pages: the mat's declared state/identity must hold across pages 4-5",
      kind: "scene",
      image: `${Z}/page4.jpg`,
      sceneText: "No card was in the dust. Then a red dot showed on a mat.",
      objectsBlock:
        " KEY OBJECTS ON THIS PAGE — the courtyard mat (normally: the SAME patterned mat as the object reference, identical pattern, tassels and proportions every time) — ON THIS PAGE: lying flat with the star card hidden under it, only a red dot of the card showing at its edge; the star card — ON THIS PAGE: hidden under the mat, only its red dot visible.",
      assertions: {
        required: [
          { object: "mat", assertion: "the mat matches its reference identity — same pattern, same tassels, same proportions" },
          { object: "star card", assertion: "the card itself is NOT visible except a red dot showing at the mat's edge" },
        ],
        forbidden: [{ object: "star card", assertion: "the whole card lying in open view" }],
      },
      refs: [
        ["Zahra (the main character)", `${Z}/cast_zahra.jpg`],
        ["the courtyard mat (object reference)", `${Z}/object_courtyardmat.jpg`],
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
const filter = (process.argv[2] || "").toLowerCase();
const { cfg } = await import("./env.mjs");
if (!cfg.SUPABASE_URL) {
  console.error("SUPABASE_URL missing — run from the repo with .env present.");
  process.exit(2);
}
const cases = buildCases(cfg.SUPABASE_URL).filter((c) => !filter || c.book === filter);
if (!cases.length) {
  console.error(`no cases match "${filter}" (books: idris, amira, zahra, yusuf)`);
  process.exit(2);
}

let totalCost = 0;
let regressions = 0;
const rows = [];

async function judgeScene(c, imageRef, sceneText) {
  const buf = await loadImage(imageRef);
  if (!buf) throw new Error(`image missing: ${imageRef}`);
  const characterRefs = (await Promise.all((c.refs || []).map(([n, r]) => qaRef(n, r)))).filter(Boolean);
  const res = await sceneConsistencyQA(buf.toString("base64"), {
    sceneText,
    objectsBlock: c.objectsBlock || "",
    characterRefs,
    assertions: c.assertions || null,
  });
  totalCost += res.cost || 0;
  return res.data;
}

for (const c of cases) {
  process.stdout.write(`[${c.book}] ${c.name} ... `);
  try {
    let failed, detail;
    if (c.kind === "cover") {
      const buf = await loadImage(c.image);
      if (!buf) throw new Error(`image missing: ${c.image}`);
      const res = await coverContentQA(buf.toString("base64"));
      totalCost += res.cost || 0;
      failed = !res.data.pass;
      detail = res.data.reason || JSON.stringify(res.data).slice(0, 200);
    } else if (c.kind === "scene-sweep") {
      const verdicts = [];
      for (let i = 0; i < c.images.length; i++) {
        const v = await judgeScene(c, c.images[i], c.sceneTexts[i]);
        verdicts.push({ page: i + 1, pass: v.pass, reason: v.reason, character_match: v.character_match });
      }
      const failing = verdicts.filter((v) => !v.pass);
      failed = failing.length > 0;
      detail = failed
        ? failing.map((v) => `p${v.page}: ${v.reason}`).join(" | ")
        : `all ${verdicts.length} pages passed — wardrobe change not caught`;
    } else {
      const v = await judgeScene(c, c.image, c.sceneText);
      failed = !v.pass;
      detail = v.reason || JSON.stringify(v).slice(0, 200);
    }
    const ok = failed; // every case is a known defect: FAIL is the correct verdict
    if (!ok) regressions++;
    rows.push({ book: c.book, name: c.name, verdict: failed ? "FAIL (correct)" : "PASS (REGRESSION)", detail, reconstructed: !!c.reconstructed });
    console.log(failed ? "caught ✓" : "MISSED ✗");
  } catch (e) {
    regressions++;
    rows.push({ book: c.book, name: c.name, verdict: "ERROR", detail: e.message });
    console.log(`error: ${e.message}`);
  }
}

console.log("\n──────────────────────────── QA REPLAY REPORT ────────────────────────────");
for (const r of rows) {
  console.log(`\n[${r.book}] ${r.name}${r.reconstructed ? "  (reconstructed text — needs Lynden sign-off)" : ""}`);
  console.log(`  verdict: ${r.verdict}`);
  console.log(`  detail:  ${String(r.detail).slice(0, 500)}`);
}
console.log(`\nQA spend this run: $${totalCost.toFixed(4)} (LLM: ${process.env.FORGE_LLM || (cfg.ANTHROPIC_API_KEY ? "anthropic" : cfg.OPENAI_API_KEY ? "openai" : "vertex")})`);
console.log(regressions ? `\n${regressions} case(s) NOT caught — the QA gate is too lenient to ship.` : "\nAll known defects caught. QA gate holds.");
process.exit(regressions ? 1 : 0);
