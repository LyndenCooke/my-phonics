// PILOT: Responses API multi-turn image continuity vs the current stateless
// gpt-image-2 pipeline. Generates a 4-page mini-sequence where each turn
// chains via previous_response_id, so the model carries the actual generated
// world forward — the mechanism the forge lacks (SKILL.md §5.5).
//
// Measures: (1) does the rock/pad/setting stay consistent turn to turn,
// (2) does the house style hold (watercolour, dot eyes) from one style ref,
// (3) cost per turn from usage. Writes images + a report to _pilot_out/.
import fs from "node:fs";
import path from "node:path";
import { cfg } from "./server/forge/env.mjs";

const OUT = "_pilot_out";
fs.mkdirSync(OUT, { recursive: true });

const KEY = cfg.OPENAI_API_KEY;
if (!KEY) throw new Error("no OPENAI_API_KEY in forge env");

const MODEL = process.env.PILOT_MODEL || "gpt-5.5";
const styleRef = fs.readFileSync("server/forge/assets/scene_ref.png").toString("base64");
const eyeRef = fs.readFileSync("server/forge/assets/eye_ref.png").toString("base64");

async function turn({ text, previousId, images = [] }) {
  const content = [
    { type: "input_text", text },
    ...images.map((b64) => ({ type: "input_image", image_url: `data:image/png;base64,${b64}` })),
  ];
  const body = {
    model: MODEL,
    input: [{ role: "user", content }],
    tools: [{ type: "image_generation", size: "1536x1024", quality: "medium" }],
  };
  if (previousId) body.previous_response_id = previousId;
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`responses ${res.status}: ${JSON.stringify(data).slice(0, 500)}`);
  const imgCall = (data.output || []).find((o) => o.type === "image_generation_call");
  return {
    id: data.id,
    imageB64: imgCall?.result || null,
    usage: data.usage || null,
    status: data.status,
  };
}

const report = [];
const STYLE_PREAMBLE =
  "You are illustrating a children's picture book. The attached reference images show our publishing house's exact style: " +
  "hand-drawn watercolour children's book art, soft textures, clean black outlines, and the signature eye style — every character's eyes are tiny solid black filled dots, NO white sclera, NO iris, NO highlight. " +
  "Match this style exactly in every image you generate in this conversation. ";

const PAGES = [
  {
    label: "page1",
    prompt:
      STYLE_PREAMBLE +
      "PAGE 1: A wide view of a bright Lagos beach. A six-year-old Nigerian girl with warm brown skin, dark braids with yellow beads, a yellow patterned tunic and pink trousers stands on the sand. Beside her, ONE large dark-grey rounded rock with a flat top ledge sits at the waterline near a low concrete sea wall. On the rock's flat ledge sits a small blue spiral-bound drawing pad with a yellow star sticker. The sea is calm and far out. Painted wooden kiosks and palm trees in the background.",
    images: [styleRef, eyeRef],
  },
  {
    label: "page2",
    prompt:
      "PAGE 2 of the same book, SAME place a moment later: the girl has walked a few steps away down the beach (show her mid-distance), and the tide has come in a little — foamy water now reaches partway up the sand toward the rock. THE SAME rock (same shape, same size, same position by the sea wall) with THE SAME blue pad in exactly the same spot on its ledge. Everything else unchanged.",
  },
  {
    label: "page3",
    prompt:
      "PAGE 3, SAME place again: the water has risen further and now surrounds the base of the rock, foam splashing against its lower half — but the pad on the top ledge is still dry. The girl, seen closer now, runs back toward the rock looking worried. SAME rock, same shape and position; SAME pad in the same spot.",
  },
  {
    label: "page4",
    prompt:
      "PAGE 4, the rescue: the girl reaches the rock and lifts the blue pad up off the ledge with one hand, just as a wave breaks against the rock below. Show the SAME rock and the SAME pad (now in her hand, star sticker visible). Relieved expression. Same beach, same sea wall and kiosks behind.",
  },
];

let prevId = null;
for (const page of PAGES) {
  const started = Date.now();
  const r = await turn({ text: page.prompt, previousId: prevId, images: page.images || [] });
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  if (r.imageB64) {
    fs.writeFileSync(path.join(OUT, `${page.label}.png`), Buffer.from(r.imageB64, "base64"));
  }
  report.push({ page: page.label, responseId: r.id, status: r.status, gotImage: Boolean(r.imageB64), seconds: Number(secs), usage: r.usage });
  console.log(`${page.label}: ${r.status}, image=${Boolean(r.imageB64)}, ${secs}s, usage=${JSON.stringify(r.usage)}`);
  prevId = r.id;
}

fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
console.log("\nDONE — images and report.json in", OUT);
