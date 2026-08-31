// Illustration pipeline for custom books: hero-injection via Flux Kontext
// (fal.ai) — the same engine + pattern as the offline book pipeline
// (myphonics_books/scripts/generate_flux_images.py), with the house EYES RULE
// baked into every prompt and an automatic Claude vision QA + one retry.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { cfg, BOOKS_DIR, REPO_ROOT } from "./env.mjs";
import { eyeRuleQA, heroIdentityQA, findFaces, sceneConsistencyQA } from "./claude.mjs";
import { beginPaidCall, completePaidCall, failPaidCall } from "./spend.mjs";

const KONTEXT_COST = 0.04; // $ per Kontext Pro image
const KONTEXT_MAX_COST = 0.08; // $ per Kontext Max (multi-ref) image

// THE company style — copied VERBATIM from the printed-book pipeline
// (myphonics_books/scripts/generate_gemini_images.py BASE_STYLE), per Lynden
// 2026-07-22: custom books must look as close to the company's images as
// possible. Same engine too: gemini-2.5-flash-image on Vertex.
// House modesty rule (Lynden 2026-07-26) — applies to EVERY character in
// EVERY image, children and adults, in every setting. Rides on BASE_STYLE so
// no image path can miss it.
// House values rule (Lynden 2026-07-26). MyPhonicsBooks celebrates every
// culture in the world, and does so without drawing anything that contradicts
// Islamic values. This is about what is DRAWN — the story-side equivalent
// lives in the writer prompt.
const HOUSE_VALUES =
  "HOUSE VALUES — nothing in the picture may contradict Islamic values, in the foreground or the background: " +
  "NO pork, bacon, ham or pig meat, and no pigs among farm or food animals; " +
  "NO alcohol of any kind — no wine, beer or spirits, no bottles, glasses, barrels, bars or pubs, not even on a distant shelf, market stall, restaurant table or shop front; " +
  "NO idols, religious statues, shrines or figures made for worship, and no devotional imagery of any faith (a famous building may appear as architecture, but never a statue of a deity or a place of worship shown as a place of worship for another faith); " +
  "NO gambling, betting, cards or lottery; " +
  "NO Western holiday imagery — no Christmas trees, Santa, Halloween costumes or pumpkins, painted Easter eggs, Valentine's hearts, and no birthday parties (no cake with candles, party hats or wrapped birthday presents). " +
  "AVOID FESTIVAL SCENES GENERALLY, religious festivals of every faith included: these are everyday stories, so unless the scene explicitly describes a festival, draw ordinary life. " +
  "(Ordinary religious life is not a festival and is welcome in the background: a hijab, a prayer mat, a mosque along the street.) " +
  "NO romantic contact, and no physical contact between adult men and women who are not family — family warmth between parents and children is welcome; " +
  "NO nudity, bathing or undressing scenes; " +
  "NEVER depict a prophet. " +
  "Mosques, prayer mats, hijabs, Ramadan and Eid are all welcome and should be drawn with warmth and dignity when the story calls for them. " +
  "ANIMALS ARE REAL ANIMALS: they stand and move as their species does, never on two legs like a person, never in clothes, never talking, gesturing or holding a conversation. A pet is a pet, a bird is a bird. Dogs are perfectly fine to draw. " +
  "NOTHING MAGICAL: no sparkles, glows, floating objects, fairies, genies or wishes taking effect — everything in the picture happens for an ordinary physical reason. ";

const MODEST_DRESS =
  "MODEST DRESS — every character in every picture, adults and children, boys and girls: " +
  "knees and shoulders are always covered. NO shorts, NO short skirts, NO sleeveless tops, " +
  "NO low necklines, NO bare midriffs, NO swimwear. Boys wear full-length trousers; girls wear " +
  "full-length trousers, or a skirt or dress that covers the knee, and sleeves at least to the elbow. " +
  "Necklines are high and modest. This holds in hot weather, at the beach, at play and in sport — " +
  "if the setting would normally suggest less clothing, dress the character modestly anyway " +
  "(long lightweight clothes, a longer sports kit). If an outfit description mentions shorts or a " +
  "sleeveless top, draw full-length trousers and sleeves instead.";

const BASE_STYLE =
  "Whimsical children's book illustration. Hand-drawn cartoon style with " +
  "soft watercolour textured backgrounds and clean black-outlined characters. " +
  "CRITICAL EYE RULE: Every character (human, animal, everyone) MUST have eyes that are " +
  "tiny solid black filled circles like dots drawn with a black marker pen. " +
  "NO white around the black, NO iris, NO pupil, NO highlight, NO detail whatsoever. " +
  "Just small simple black dots - cute and friendly like a teddy bear's eyes. " +
  "Warm, friendly, inviting. Soft pastel backgrounds with pops of bright colour. " +
  "Simple rounded shapes, gentle lighting. Professional picture book quality. " +
  "No text, words, letters, or numbers in the image. " +
  // Re-synced 2026-08-05 with generate_gemini_images.py, which had gained these
  // two clauses on 07-27 while this copy stayed behind. The drift was not
  // cosmetic: the 8.4 rebuild kept returning pages inset in a cream mat with a
  // drawn frame — precisely the failure FULL BLEED was written to stop — and I
  // built a pixel-trim workaround for a problem the fleet had already fixed in
  // the prompt. If the fleet's BASE_STYLE changes again, change it here too.
  "NO GLOW: characters sit directly on the background with a clean outline. NO " +
  "coloured haze, halo, aura, glow, mist or soft cloud of colour around any " +
  "character or object, and no drop shadow ringing them. " +
  "FULL BLEED: the artwork fills the whole image edge to edge. NO border, NO " +
  "frame, NO cream or white margin, NO rounded corners, NO painted-panel edge, " +
  "NO vignette. " +
  MODEST_DRESS + " " + HOUSE_VALUES;

// Approved printed-book art used as style references: hero for the eye/character
// style, a real scene page for full-scene rendering, the cover for cover mood.
// VENDORED into server/forge/assets/ (2026-08-06): the originals live under
// myphonics_books/output/, which is GITIGNORED — a Vercel deployment simply
// does not contain them, and the style injection silently degrades to
// text-only prompts. The output/ copies are still preferred locally so a
// re-approved reference takes effect without re-vendoring.
const ASSETS = path.join(path.dirname(fileURLToPath(import.meta.url)), "assets");
function refPath(assetName, ...outputParts) {
  const original = path.join(BOOKS_DIR, "output", "images", ...outputParts);
  return fs.existsSync(original) ? original : path.join(ASSETS, assetName);
}
const EYE_REF_PATH = refPath("eye_ref.png", "L4_1_B1", "hero_reference.png");
const SCENE_REF_PATH = refPath("scene_ref.png", "L4_1_B1", "page3.png");
const COVER_REF_PATH = refPath("cover_ref.png", "L4_1_B1", "cover.png");

// gpt-image-2 served by fal.ai (Lynden 2026-07-23: primary art engine — best
// reference-following; bills the FAL key, so OpenAI's billing cap is
// irrelevant). Vertex Gemini (the printed books' own engine) is the
// automatic fallback if a gpt-image-2 call fails.
const GPT_IMG_COST = 0.07; // fal gpt-image-2, medium quality (estimate)

function refUri(p, mime = "image/png") {
  return toDataUri(fs.readFileSync(p), mime);
}

async function gptImage(prompt, refUris, size, attempt = 0) {
  try {
    return await falRun("fal-ai/gpt-image-2/edit", {
      prompt,
      image_urls: refUris,
      image_size: size,
      quality: "medium",
      num_images: 1,
    });
  } catch (e) {
    if (attempt < 2 && /\b(429|500|502|503|504)\b/.test(e.message)) {
      await new Promise((r) => setTimeout(r, 8000 * (attempt + 1)));
      return gptImage(prompt, refUris, size, attempt + 1);
    }
    throw e;
  }
}

// ─── gpt-image-2 direct on OpenAI (Lynden 2026-07-26: "use openai api key") ───
// Same model as the fal route, billed to the OpenAI account instead, and with
// no gcloud dependency. Reference images go up as multipart on /images/edits.
// Pricing (July 2026): image input $8/M tokens, image output $30/M — a medium
// 1024px edit with a couple of refs lands around $0.07.
const OPENAI_IMG_MODEL = "gpt-image-2";
const OPENAI_SIZES = {
  portrait_4_3: "1024x1536",
  landscape_4_3: "1536x1024",
  square_hd: "1024x1024",
};

function costFromImageUsage(u = {}) {
  const inTok = u.input_tokens || 0;
  const outTok = u.output_tokens || 0;
  return (inTok * 8 + outTok * 30) / 1_000_000;
}

let lastOpenAIImageCost = 0;
export function takeLastOpenAIImageCost() {
  const c = lastOpenAIImageCost;
  lastOpenAIImageCost = 0;
  return c;
}

async function openaiImage(prompt, refBufs, size, attempt = 0) {
  const receipt = await beginPaidCall({ call: `image-edit-${attempt + 1}`, provider: "openai", model: OPENAI_IMG_MODEL, estimateUsd: 0.35,
    requestMeta: { prompt, reference_count: refBufs.length, size: OPENAI_SIZES[size] || "1024x1024", quality: "medium" } });
  const fd = new FormData();
  fd.append("model", OPENAI_IMG_MODEL);
  fd.append("prompt", prompt);
  fd.append("size", OPENAI_SIZES[size] || "1024x1024");
  fd.append("quality", "medium");
  fd.append("n", "1");
  refBufs.forEach((buf, i) => {
    fd.append("image[]", new Blob([buf], { type: "image/png" }), `ref${i}.png`);
  });
  let res;
  try {
    res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.OPENAI_API_KEY}`,
        ...(receipt?.clientRequestId ? { "X-Client-Request-Id": receipt.clientRequestId } : {}) },
      body: fd,
    });
  } catch (e) {
    await failPaidCall(receipt, e);
    throw e;
  }
  if (!res.ok) {
    const text = await res.text();
    await failPaidCall(receipt, new Error(`${res.status}: ${text.slice(0, 120)}`), {
      definitelyUnbilled: true, providerRequestId: res.headers.get("x-request-id"),
    });
    // Exhausted credits are a 429 no backoff can fix — fail fast with the
    // body so jobs.mjs pauses the book (paused_provider_credit) immediately.
    const billing = /insufficient_quota|credit_balance_exhausted|billing/i.test(text);
    if (!billing && [429, 500, 502, 503, 504].includes(res.status) && attempt < 3) {
      const wait = Math.min(60_000, 5000 * 2 ** attempt) * (0.75 + Math.random() * 0.5);
      console.warn(`[forge] openai image ${res.status} — retry ${attempt + 1}/3 in ${Math.round(wait / 1000)}s`);
      await new Promise((r) => setTimeout(r, wait));
      return openaiImage(prompt, refBufs, size, attempt + 1);
    }
    throw new Error(`openai image ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) {
    await failPaidCall(receipt, new Error("openai image: no image in response"), { providerRequestId: res.headers.get("x-request-id") });
    throw new Error("openai image: no image in response");
  }
  lastOpenAIImageCost = costFromImageUsage(data.usage);
  await completePaidCall(receipt, { costUsd: lastOpenAIImageCost, providerRequestId: res.headers.get("x-request-id"), usage: data.usage,
    responseMeta: { image_count: 1 } });
  return Buffer.from(b64, "base64");
}

// ─── Responses API multi-turn image chain (SKILL.md §5.5, built 2026-08-11) ───
// The hybrid continuity mechanism, piloted before adoption: each scene turn
// chains to the previous one via previous_response_id, so the model carries
// the ACTUAL generated world forward (the rock keeps its shape, the pad stays
// where the last image left it) — while hero/cast/object identity references
// are still attached to every turn as input images, because the pilot showed
// conversation state alone lets the hero's outfit pattern drift page to page.
// Identity comes from references; world state comes from the chain.
const RESPONSES_MODEL = "gpt-5.5";
// FLOOR estimate only (Lynden 2026-08-15: "$20 became $3" — the flat $0.08
// undercounted real billing badly, because each call also uploads several
// full-size reference images whose INPUT image tokens bill on top of the
// generation, and the flat figure ignored them entirely; the ledger tracked
// ~$7.5 of a real ~$17 day, and the $6 budget cap was silently worth ~2x its
// face value). When the API reports usage we now price the actual tokens and
// take whichever is larger; the flat figure remains only as the floor for
// responses that omit usage.
const RESPONSES_IMAGE_COST = 0.08;
// gpt-5.5 pricing (mirrors OPENAI_PRICES in claude.mjs) per 1M tokens.
const RESPONSES_PRICE = { in: 5.0, out: 30.0 };

function responsesUsageCost(usage) {
  if (!usage) return RESPONSES_IMAGE_COST;
  const computed =
    ((usage.input_tokens || 0) * RESPONSES_PRICE.in + (usage.output_tokens || 0) * RESPONSES_PRICE.out) / 1_000_000;
  return Math.max(computed, RESPONSES_IMAGE_COST);
}

async function responsesImage({ prompt, refBufs = [], previousResponseId = null, size = "1536x1024" }, attempt = 0) {
  const content = [
    { type: "input_text", text: prompt },
    ...refBufs.map((buf) => ({ type: "input_image", image_url: toDataUri(buf, "image/png") })),
  ];
  const body = {
    model: RESPONSES_MODEL,
    input: [{ role: "user", content }],
    tools: [{ type: "image_generation", size, quality: "medium" }],
  };
  if (previousResponseId) body.previous_response_id = previousResponseId;
  const receipt = await beginPaidCall({ call: `responses-image-${attempt + 1}`, provider: "openai", model: RESPONSES_MODEL, estimateUsd: 0.65,
    requestMeta: { prompt, reference_count: refBufs.length, previous_response_id: previousResponseId, size, quality: "medium" } });
  let res;
  try {
    res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.OPENAI_API_KEY}`, "Content-Type": "application/json",
        ...(receipt?.clientRequestId ? { "X-Client-Request-Id": receipt.clientRequestId } : {}) },
      body: JSON.stringify(body),
    });
  } catch (e) {
    await failPaidCall(receipt, e);
    throw e;
  }
  if (!res.ok) {
    const text = await res.text();
    await failPaidCall(receipt, new Error(`${res.status}: ${text.slice(0, 120)}`), {
      definitelyUnbilled: true, providerRequestId: res.headers.get("x-request-id"),
    });
    // Same billing fast-fail as openaiImage — see comment there.
    const billing = /insufficient_quota|credit_balance_exhausted|billing/i.test(text);
    if (!billing && [429, 500, 502, 503, 504].includes(res.status) && attempt < 3) {
      const wait = Math.min(60_000, 5000 * 2 ** attempt) * (0.75 + Math.random() * 0.5);
      console.warn(`[forge] responses image ${res.status} — retry ${attempt + 1}/3 in ${Math.round(wait / 1000)}s`);
      await new Promise((r) => setTimeout(r, wait));
      return responsesImage({ prompt, refBufs, previousResponseId, size }, attempt + 1);
    }
    throw new Error(`responses image ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  const imgCall = (data.output || []).find((o) => o.type === "image_generation_call");
  if (!imgCall?.result) {
    await failPaidCall(receipt, new Error(`responses image: no image in output (status ${data.status})`), {
      providerRequestId: res.headers.get("x-request-id"),
    });
    throw new Error(`responses image: no image in output (status ${data.status})`);
  }
  const cost = responsesUsageCost(data.usage);
  await completePaidCall(receipt, { costUsd: cost, providerRequestId: res.headers.get("x-request-id"), usage: data.usage,
    responseMeta: { response_id: data.id, image_count: 1, status: data.status } });
  return { buf: Buffer.from(imgCall.result, "base64"), responseId: data.id, cost };
}

// Storage moved to storage.mjs (2026-08-06): images must go to Supabase
// Storage in production, where this filesystem is read-only. Re-exported so
// old imports keep working.
export { CUSTOM_BOOKS_DIR, saveImage } from "./storage.mjs";

function toDataUri(buf, mime = "image/png") {
  return `data:${mime};base64,${buf.toString("base64")}`;
}

async function falRun(model, args) {
  const res = await fetch(`https://fal.run/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${cfg.FAL_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`fal ${model} ${res.status}: ${t.slice(0, 300)}`);
  }
  const data = await res.json();
  const url = data?.images?.[0]?.url;
  if (!url) throw new Error(`fal ${model}: no image in response`);
  const img = await fetch(url);
  return Buffer.from(await img.arrayBuffer());
}

// ─── Vertex Gemini image generation (the printed books' engine) ───
// Faithful port of generate_gemini_images.py: gemini-2.5-flash-image,
// responseModalities IMAGE, labelled reference parts, backoff on 429.
const VERTEX_IMG_MODEL = "gemini-2.5-flash-image";
const VERTEX_IMG_COST = 0.039; // ~1290 output tokens @ $30/M

async function vertexImage(parts, attempt = 0) {
  const { getGcloudToken, invalidateGcloudToken } = await import("./claude.mjs");
  const token = await getGcloudToken();
  const url =
    `https://${cfg.VERTEX_REGION}-aiplatform.googleapis.com/v1/projects/${cfg.VERTEX_PROJECT}` +
    `/locations/${cfg.VERTEX_REGION}/publishers/google/models/${VERTEX_IMG_MODEL}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    const retriable = [429, 503].includes(res.status) || [401, 403].includes(res.status);
    if ([401, 403].includes(res.status)) invalidateGcloudToken();
    if (retriable && attempt < 5) {
      const wait = Math.min(60_000, 5000 * 2 ** attempt) * (0.75 + Math.random() * 0.5);
      console.warn(`[forge] vertex image ${res.status} — retry ${attempt + 1}/5 in ${Math.round(wait / 1000)}s`);
      await new Promise((r) => setTimeout(r, wait));
      return vertexImage(parts, attempt + 1);
    }
    throw new Error(`vertex image ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  const imgPart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!imgPart) throw new Error("vertex image: no image in response");
  return Buffer.from(imgPart.inlineData.data, "base64");
}

async function kontext(prompt, imageUri, aspect = "4:3") {
  return falRun("fal-ai/flux-pro/kontext", {
    prompt,
    image_url: imageUri,
    num_images: 1,
    output_format: "jpeg",
    guidance_scale: 3.5,
    safety_tolerance: "5",
    aspect_ratio: aspect,
  });
}

async function kontextMulti(prompt, imageUris, aspect = "3:4") {
  return falRun("fal-ai/flux-pro/kontext/max/multi", {
    prompt,
    image_urls: imageUris,
    num_images: 1,
    output_format: "jpeg",
    guidance_scale: 3.5,
    safety_tolerance: "5",
    aspect_ratio: aspect,
  });
}

// Engine order. Default: gpt-image-2 on OpenAI when a key is configured
// (no gcloud dependency), then Vertex Gemini, then gpt-image-2 via fal.
// FORGE_IMG_ENGINE=openai|vertex|gpt2 forces a primary; the rest stay as
// fallbacks in the order below. Each engine's real cost differs, so this
// returns {buf, cost} rather than letting the caller assume one.
const ENGINE_COSTS = { vertex: VERTEX_IMG_COST, gpt2: GPT_IMG_COST };

function engineOrder() {
  // An EXPLICIT engine override pins that engine with NO fallback: a proof
  // pass forced onto Vertex must fail loudly rather than quietly finish the
  // job on OpenAI credit — silent cross-engine fallback is exactly how a
  // "cheap" run stops being cheap (Lynden 2026-08-16), and mid-book engine
  // switches break character/style continuity anyway.
  if (process.env.FORGE_IMG_ENGINE) return [process.env.FORGE_IMG_ENGINE];
  const preferred = cfg.OPENAI_API_KEY ? "openai" : "vertex";
  const all = ["openai", "vertex", "gpt2"];
  return [preferred, ...all.filter((e) => e !== preferred)];
}

// Mirrors PROVIDER_CREDIT_RE in jobs.mjs (kept inline to avoid an import
// cycle). When the primary engine dies of EXHAUSTED CREDIT and the fallbacks
// then fail for their own reasons (no gcloud on Vercel, dead fal key), the
// error that must surface is the CREDIT one — it is the only actionable one,
// and it is what the step machine classifies into paused_provider_credit so
// the book checkpoints instead of failing. Surfacing the last fallback's
// noise instead turned a resumable pause into a $5.11 failed book
// (Omar, prod, 2026-08-23).
const IMG_CREDIT_RE = /insufficient[_ ]quota|billing[_ ]hard[_ ]limit|exceeded your current quota|payment required|insufficient credit|no credits remaining|credit_balance_exhausted|\b402\b/i;

async function withFallback(fns, label) {
  const order = engineOrder().filter((name) => fns[name]);
  let lastErr, creditErr;
  for (const name of order) {
    try {
      const buf = await fns[name]();
      const cost = name === "openai" ? takeLastOpenAIImageCost() : ENGINE_COSTS[name];
      return { buf, cost, engine: name };
    } catch (e) {
      lastErr = e;
      if (!creditErr && IMG_CREDIT_RE.test(String(e.message || e))) creditErr = e;
      console.warn(`[forge] ${label} engine "${name}" failed, trying next:`, e.message);
    }
  }
  throw creditErr || lastErr || new Error(`no image engine available for ${label}`);
}

// Eye QA, zoomed. A pair of eyes on a 1024px page is a few dozen pixels, and
// asked about the whole page the checker passed everything — including obvious
// white-sclera faces. So: find the faces, crop each head, blow it up, and ask
// about that. Returns {qa, cost}; qa.pass is false if ANY face fails.
export async function eyeQAZoomed(buf) {
  let cost = 0;
  const b64 = buf.toString("base64");
  // Whole-page pass first: catches stray blotches and eyes on things the face
  // finder does not think of as faces.
  const whole = await eyeRuleQA(b64);
  cost += whole.cost;
  let qa = { ...whole.data, checked: "page" };

  let faces = [];
  try {
    const f = await findFaces(b64);
    cost += f.cost;
    faces = (f.data.faces || []).slice(0, 4);
  } catch {
    // face finder unavailable — the whole-page verdict stands
  }

  const meta = await sharp(buf).metadata();
  for (const face of faces) {
    try {
      // Pad the box generously: the finder's boxes are approximate, and a
      // clipped eye is worse than extra background.
      const pad = 0.35;
      const x0 = Math.max(0, (face.x - face.w * pad) * meta.width);
      const y0 = Math.max(0, (face.y - face.h * pad) * meta.height);
      const x1 = Math.min(meta.width, (face.x + face.w * (1 + pad)) * meta.width);
      const y1 = Math.min(meta.height, (face.y + face.h * (1 + pad)) * meta.height);
      const w = Math.round(x1 - x0);
      const h = Math.round(y1 - y0);
      if (w < 24 || h < 24) continue;
      const crop = await sharp(buf)
        .extract({ left: Math.round(x0), top: Math.round(y0), width: w, height: h })
        .resize({ width: 768, height: 768, fit: "inside", kernel: "lanczos3" })
        .png()
        .toBuffer();
      const r = await eyeRuleQA(crop.toString("base64"), "image/png");
      cost += r.cost;
      if (!r.data.pass) {
        qa = { ...r.data, checked: `face:${face.who || "character"}` };
        break;
      }
    } catch {
      // a bad box shouldn't fail the book
    }
  }
  return { qa, cost };
}

// The eye-only edit. gpt-image-2 on OpenAI when a key is configured (it keeps
// the rest of the frame closer than Kontext, which likes to restyle), Kontext
// on fal otherwise. Returns {buf, cost}.
async function eyeRepairEdit(buf, prompt) {
  if (cfg.OPENAI_API_KEY) {
    try {
      const meta = await sharp(buf).metadata();
      const size =
        meta.width === meta.height ? "square_hd" : meta.width > meta.height ? "landscape_4_3" : "portrait_4_3";
      const out = await openaiImage(prompt, [buf], size);
      return { buf: out, cost: takeLastOpenAIImageCost() };
    } catch (e) {
      console.warn("[forge] openai eye repair failed, trying kontext:", e.message);
    }
  }
  const out = await kontext(prompt, toDataUri(buf, "image/jpeg"));
  return { buf: out, cost: KONTEXT_COST };
}

// Up to two repair passes that ONLY fix the eyes. Two, not one, because the
// check is now strict enough to actually catch the failures and a white-sclera
// face must never reach a printed book. Exported so an already generated book
// can be re-gated without re-rolling its story.
export async function repairEyes(buf, qa) {
  let cost = 0;
  for (let attempt = 1; attempt <= 2 && !qa.pass; attempt++) {
    try {
      // The face gate now also fails on a missing nose/mouth (a hero shipped
      // nose-less, 2026-08-11) — an eye-only edit prompt cannot fix that, so
      // the repair instruction follows what the QA actually found.
      const missingFeature = /nose|mouth/i.test(`${qa.reason || ""} ${qa.features_seen || ""}`) && !/no (missing|faces?)/i.test(qa.reason || "");
      const fixed = await eyeRepairEdit(
        buf,
        (missingFeature
          ? `Edit this image. A character's face is missing a basic feature: ${qa.reason} Draw the missing feature in — a small simple nose or mouth matching the art style of the other faces in the image — changing nothing else about the face or the picture. Also ensure every eye is one small solid pure-black filled dot with no white, no highlight and no iris. `
          : "Edit this image. Change ONLY the eyes: replace every eye with one small solid pure-black filled dot — tiny like a teddy bear's bead eyes, the same size or smaller than the current eyes, with no white, no highlight, no glint and no iris. The whole eye shape must be filled in solid black: if an eye currently has a white area with a dark pupil inside it, the white area goes too — do not leave any white showing. Eye dots must be proportional to the creature: on small creatures (snails, insects, birds) they are minuscule, and a snail's eyes sit at the tips of its stalks. Remove any stray black blotches or smears from faces. ") +
        "Keep the art style, characters, pose and everything else exactly the same.",
      );
      cost += fixed.cost;
      buf = fixed.buf;
      const r2 = await eyeQAZoomed(buf);
      qa = { ...r2.qa, repaired: attempt };
      cost += r2.cost;
    } catch {
      break; // keep what we have if the repair engine fails
    }
  }
  return { buf, cost, qa };
}

// Generate + eye-QA with automatic repair. genFn returns {buf, cost, engine}.
// Returns {buf, cost, qa}.
async function generateWithEyeQA(genFn, label) {
  const gen = await genFn();
  let buf = gen.buf;
  let cost = gen.cost;
  let qa = { pass: true, reason: "not-checked", engine: gen.engine };
  try {
    const r = await eyeQAZoomed(buf);
    qa = r.qa;
    cost += r.cost;
  } catch {
    // QA unavailable — keep the image rather than failing the book
  }
  const rep = await repairEyes(buf, qa);
  buf = rep.buf; cost += rep.cost; qa = rep.qa;
  return { buf, cost, qa: { ...qa, label, engine: gen.engine } };
}

// Character description in the exact voice of the printed books'
// HERO_PROMPTS (generate_gemini_images.py).
export function heroPrompt(child) {
  const a = child.appearance || {};
  // Gender must be explicit and reinforced: in this soft round-faced style an
  // unstated or unstressed gender renders ambiguous, and boys drift girlish —
  // "Yusuf looks like a girl" happened on two test books (Lynden 2026-08-12).
  const genderLine = a.gender === "boy"
    ? ". UNMISTAKABLY A BOY at first glance, whatever his hair length: boyish face and build, boyish clothing, no long eyelashes, no bow, no dress or skirt"
    : a.gender === "girl"
      ? ". Unmistakably a girl at first glance"
      : "";
  return (
    `A cartoon ${a.gender || "child"} character, about ${child.age ?? 5} years old, ` +
    (a.skinTone ? `with ${a.skinTone} skin` : "") +
    (a.hair ? ` and ${a.hair}` : "") +
    genderLine +
    `. ${a.outfit ? `Wearing ${a.outfit}` : `Wearing bright comfortable everyday clothes that feel at home in ${child.country || "the UK"}`}. ` +
    "The character has small friendly dot eyes, solid black, tiny and cute like a teddy bear - not too big, " +
    "and a cheerful smile. Standing in a neutral pose, facing the viewer, full body visible from head to toe. " +
    "Arms slightly away from body, feet shoulder-width apart. " +
    "Plain light cream solid-colour background (no scenery, no objects, no patterns)."
  );
}

// Hero generation — gpt-image-2 with the printed books' art as style refs
// (the art-generator skill's eye-style injection, upgraded to full style
// injection). The child's photo (if provided) is a likeness reference only
// and is never published anywhere. Vertex Gemini fallback keeps the same
// reference pattern the printed pipeline uses.
export async function generateHero({ child, photoB64, photoMime }) {
  const gptRefs = [refUri(EYE_REF_PATH), refUri(SCENE_REF_PATH)];
  if (photoB64) gptRefs.push(`data:${photoMime || "image/jpeg"};base64,${photoB64}`);
  const gptPrompt =
    "The first two reference images show our publishing house's illustration style: hand-drawn children's book art with soft textures, clean black outlines, and the signature eye style — tiny solid black filled dots with NO white, NO highlights, NO iris. Match this exact style. " +
    (photoB64
      ? "The final reference image is a photo of the real child — the new character should warmly resemble them (face shape, hair, skin tone) while staying fully in the cartoon style, NOT realistic. "
      : "") +
    `Now draw a NEW character (a different person from the style references): ${heroPrompt(child)} ${BASE_STYLE}`;

  const vertexParts = [
    { text: "EYE STYLE REFERENCE — The new character MUST have the EXACT same eye style as this character: tiny solid black dots, no white highlights, no detail. Copy this eye style exactly:" },
    { inlineData: { mimeType: "image/png", data: fs.readFileSync(EYE_REF_PATH).toString("base64") } },
    ...(photoB64
      ? [
          { text: "LIKENESS REFERENCE — a photo of the real child. Resemble warmly, stay fully cartoon:" },
          { inlineData: { mimeType: photoMime || "image/jpeg", data: photoB64 } },
        ]
      : []),
    { text: `Now generate a NEW character (different person, different outfit from the first reference) but with the SAME tiny solid black dot eye style. Here is the character to generate: ${heroPrompt(child)} ${BASE_STYLE}` },
  ];

  const openaiRefs = [fs.readFileSync(EYE_REF_PATH), fs.readFileSync(SCENE_REF_PATH)];
  if (photoB64) openaiRefs.push(Buffer.from(photoB64, "base64"));
  const gen = () => withFallback({
    openai: () => openaiImage(gptPrompt, openaiRefs, "portrait_4_3"),
    vertex: () => vertexImage(vertexParts),
    gpt2: () => gptImage(gptPrompt, gptRefs, "portrait_4_3"),
  }, "hero");
  const hero = await generateWithEyeQA(gen, "hero");
  try {
    const identity = await heroIdentityQA(hero.buf.toString("base64"), child.characterSpec || {
      age: child.age,
      gender: child.appearance?.gender,
      skinTone: child.appearance?.skinTone,
      hair: child.appearance?.hair,
      outfit: child.appearance?.outfit,
    });
    hero.cost += identity.cost;
    hero.qa = { eye: hero.qa, identity: identity.data, pass: Boolean(hero.qa?.pass && identity.data?.match) };
  } catch (e) {
    hero.qa = { eye: hero.qa, identity: { match: false, reason: `identity QA unavailable: ${e.message}` }, pass: false };
  }
  return hero;
}

// The location reference is injected on EVERY page that revisits a location,
// not only on identical-frame beats: a closeup or a new angle still has to be
// the SAME ROOM, with the same fixtures and materials. Text alone cannot hold
// a floor plan — without the picture the model re-invents the window, floor
// and units on every page.
// A closeup must never amputate the character. Cropping to "hands doing the
// action" produces a disembodied hand entering frame from the edge, which in a
// picture book reads as a mistake, not as a shot.
// Furniture and props must be physically buildable. The commonest failures are
// a chair whose legs and seat do not join up, and a character sitting on
// nothing because the chair beside them was never put underneath them
// (Lynden 2026-07-26, the Portugal book's last page).
const PHYSICAL_PLAUSIBILITY =
  "PHYSICALLY REAL OBJECTS: everything drawn must be something that could actually be built and used. " +
  "Furniture is complete and correctly assembled — a chair has four legs of equal length that reach the floor, a seat resting squarely on them and a back joined to the seat; legs do not bend, float, merge or go missing, and the object keeps the same number of parts it had on earlier pages. " +
  "ANYONE SITTING MUST BE SITTING ON SOMETHING: draw the chair, stool, cushion or step fully underneath them, taking their weight, at a height that matches how their legs are drawn. Never leave a seated character resting on thin air, and never place their chair beside them instead of under them. " +
  "Nothing hovers: every object rests on a surface, hangs from a fixing, or is held in a hand. " +
  "DAMAGE IS ONLY EVER WHAT THE SCENE SAYS IT IS: if one part has come loose or broken, every other part of that object is whole, attached and undamaged. Never smash, splinter, dismantle or overturn an object beyond the specific damage described. ";

const NO_FLOATING_LIMBS =
  "NO FLOATING BODY PARTS: the character must be a whole person in the frame — keep their face and shoulders in shot as part of the closeup, looking at what they are doing. " +
  "NEVER draw a hand or arm entering the picture from the edge with no body attached, and never crop a person to just their hands. " +
  "If the action cannot be shown close-up with the character's face in the frame, pull the camera back until it can.";

function locationRefText(camera) {
  const base =
    "LOCATION REFERENCE — the scene below happens in EXACTLY the place shown in this image. " +
    "Treat this as an immutable SETTING PLATE, not a cast list: ignore and remove every person or animal shown in it, then add ONLY the characters and animals required by the new scene and its identity references. " +
    "The room's architecture and contents are FIXED by it: same window shape, size, position and pane pattern; " +
    "same floor material and pattern; same wall colour and finish; same furniture, units and fittings in the same places; " +
    "same colours, lighting, weather and season. " +
    "Do NOT add ANY furniture, counters, shelves, tables, appliances or structures that are not already in this reference, " +
    "and do not duplicate anything that is — each object appears exactly once, where the reference puts it, unless a character is actively moving it. ";
  if (camera === "same-view")
    return base + "CAMERA: reproduce this reference's exact viewpoint and framing. Nothing in the background changes or moves — only the characters' action and expression differ.";
  if (camera === "closeup")
    return (
      base +
      "CAMERA: this is a CLOSE SHOT, and it must read as one. The subject fills at least two thirds of the frame and the room is CROPPED — walls, counters and furniture run out of shot at the frame edges rather than being shown whole. Do not draw a whole standing figure in a whole room; come close enough that we could not tell how big the room is. " +
      "Whatever background is still visible must be a genuine part of the place shown in the reference (same materials and fittings), never a new or invented one. " +
      NO_FLOATING_LIMBS
    );
  return base + "CAMERA: shoot this page from a DIFFERENT ANGLE or a different corner of the SAME place — the viewpoint changes, the place itself does not. Every surface, fitting and material must be recognisably the ones in the reference.";
}

// A character sheet for a NON-hero cast member (mum, dad, a friend), drawn
// once and then injected into every page they appear on. Without this they are
// redrawn from the word "mum" each time and their clothes change colour page
// to page.
export async function generateCastMember({ member, child, heroBuf = null }) {
  // FAMILY LOOKS RELATED (Lynden 2026-08-23: a shipped book's Dad and son
  // plainly weren't family — pale straight-haired Dad, brown curly-haired
  // son). For a relative, the hero's own sheet rides along as a reference
  // and the prompt binds skin tone and hair family to it. Words alone were
  // not enough: the writer's "appearance" text never mentioned the hero.
  // ...but only the HERO'S relatives. A lost-child plot can cast the OTHER
  // child's parents ("boy_mum", "the boy's mum") — binding them to the hero's
  // colouring would be exactly wrong (caught on the Amina souk story before
  // it cost anything, 2026-08-23).
  const memberDesc = `${member.who || ""} ${member.id || ""}`.toLowerCase();
  const heroName = String(child?.name || "").toLowerCase().replace(/[^a-z]/g, "") || "___none___";
  const REL = "(mum|mummy|mother|dad|daddy|father|nan|nana|nani|gran|grandma|grandad|grandpa|aunt|auntie|uncle|brother|sister|sibling)";
  const isFamily =
    new RegExp(`\\b${REL}\\b`).test(memberDesc) &&
    !new RegExp(`\\b(his|her|their)\\s+${REL}\\b`).test(memberDesc) &&
    // a possessive/compound naming anyone but the hero ("boy_mum", "the
    // boy's mum") is the OTHER family; "amina's mum" is the hero's own.
    !new RegExp(`\\b(?!${heroName}\\b)\\w+(_|'s\\s*)${REL}\\b`).test(memberDesc);
  const familyClause = isFamily && heroBuf
    ? `FAMILY RESEMBLANCE IS MANDATORY: a reference image of the book's HERO is attached — this character is the hero's close family (${member.who}). Give them the SAME skin tone as the hero and hair in the same colour family (texture may differ with age), and a face that clearly belongs to the same family, so parent and child read as related at a glance. Do NOT copy the hero's outfit or age — only the family colouring and likeness. `
    : "";
  // The age clause must follow the DECLARED cast member, not assume adult.
  // "This is an ADULT" was hard-coded (added 2026-07-26 because a mum drawn
  // from text alone rendered as an older sister) — and then "Sam, Amina's
  // pal, a six-year-old boy" got a beard and adult height, and every scene
  // faithfully matched his wrong sheet, so no downstream QA could ever catch
  // it: the reference itself was the error (Lynden's "Food for All" book,
  // 2026-08-12). Child cast members are real and common — a pal, a sibling.
  const isChild = /\b(boy|girl|child|kid|toddler|baby|little (?:brother|sister)|(?:[3-9]|1[0-2]|three|four|five|six|seven|eight|nine|ten|eleven|twelve)[- ]year[- ]old)\b/i.test(`${member.who || ""} ${member.appearance || ""}`);
  const ageClause = isChild
    ? "CHILD PROPORTIONS: this is a CHILD, close in age and height to the book's young hero — a child's build and round face, clearly a playmate or sibling, NOT an adult and NOT taller than a grown-up. No facial hair ever. "
    : "GROWN-UP PROPORTIONS: this is an ADULT, not a child — an adult's height and build, a fuller adult face with a softer jaw and gentle laughter lines, clearly older and taller than a young child. They should read instantly as a parent. ";
  const brief =
    `A cartoon character for a children's picture book: ${member.who}. ${member.appearance}. ` +
    `They belong to the same family world as the hero of the book, set in ${child.city ? `${child.city}, ` : ""}${child.country || "the UK"} — culturally accurate, warm and dignified. ` +
    familyClause +
    ageClause +
    "Standing in a neutral pose, facing the viewer, full body visible from head to toe, arms slightly away from the body. " +
    "The character has small friendly dot eyes, solid black, tiny and cute like a teddy bear - not too big. " +
    "Plain light cream solid-colour background (no scenery, no objects, no patterns). " +
    BASE_STYLE;
  const prompt =
    "The first two reference images show our publishing house's illustration style: hand-drawn children's book art with soft textures, clean black outlines, and the signature eye style — tiny solid black filled dots with NO white, NO highlights, NO iris. Match this exact style. " +
    `Now draw a NEW character (a different person from the style references): ${brief}`;
  const familyRef = isFamily && heroBuf ? [heroBuf] : [];
  const refs = [fs.readFileSync(EYE_REF_PATH), fs.readFileSync(SCENE_REF_PATH), ...familyRef];
  const vertexParts = [
    { text: "EYE STYLE REFERENCE — the new character MUST have the EXACT same eye style: tiny solid black dots, no white, no detail:" },
    { inlineData: { mimeType: "image/png", data: refs[0].toString("base64") } },
    ...(familyRef.length ? [
      { text: "HERO REFERENCE — the new character is this hero's close family: match their skin tone and hair-colour family exactly (not their outfit or age):" },
      { inlineData: { mimeType: "image/jpeg", data: heroBuf.toString("base64") } },
    ] : []),
    { text: `Now generate a NEW character (a different person from the reference) with the SAME eye style: ${brief}` },
  ];
  const gen = () => withFallback({
    openai: () => openaiImage(prompt, refs, "portrait_4_3"),
    vertex: () => vertexImage(vertexParts),
    gpt2: () => gptImage(prompt, [refUri(EYE_REF_PATH), refUri(SCENE_REF_PATH), ...familyRef.map((b) => toDataUri(b, "image/jpeg"))], "portrait_4_3"),
  }, `cast:${member.id}`);
  return generateWithEyeQA(gen, `cast:${member.id}`);
}

// An OBJECT identity reference — a recurring key object (a cap, a bag, a toy)
// drawn once in isolation and injected into every scene it appears in, the
// same fix hero/cast sheets already got. Without this a key object is
// redrawn from its text description alone on every page and drifts (a red
// cap with a white zigzag trim came out a different red, a different trim,
// even a different shape from page to page — SKILL.md §5.1 always required
// this reference; it just was not built yet). No eye QA — objects have no
// face — so this skips generateWithEyeQA and calls withFallback directly.
export async function generateObjectRef({ name, look, child }) {
  const brief =
    `${look}. A single object, shown clearly on its own — no hands, no character holding it, no other objects. ` +
    `It belongs in the same story world as ${child?.city ? `${child.city}, ` : ""}${child?.country || "the UK"}. ` +
    "Centred, filling most of the frame, plain light cream solid-colour background (no scenery, no patterns, no shadow). " +
    BASE_STYLE;
  const prompt =
    "The reference image shows our publishing house's illustration style: hand-drawn children's book art with soft textures and clean black outlines. Match this exact style. " +
    `Now draw a single OBJECT (not a character, not a scene) in that style: ${brief}`;
  const refs = [fs.readFileSync(SCENE_REF_PATH)];
  const vertexParts = [
    { text: "STYLE REFERENCE — match this illustration style exactly (soft textures, clean black outlines):" },
    { inlineData: { mimeType: "image/png", data: refs[0].toString("base64") } },
    { text: `Now draw a single OBJECT (not a character, not a scene) in that same style: ${brief}` },
  ];
  const gen = () => withFallback({
    openai: () => openaiImage(prompt, refs, "square_hd"),
    vertex: () => vertexImage(vertexParts),
    gpt2: () => gptImage(prompt, [refUri(SCENE_REF_PATH)], "square_hd"),
  }, `object:${name}`);
  const result = await gen();
  return { buf: result.buf, cost: result.cost, qa: { pass: true, reason: "no-face-no-eye-qa", engine: result.engine } };
}

// An ANIMAL reference sheet. Prompting alone will not give an animal the house
// eye: the model obeys the rule for people and hands every bird a pale iris and
// a catchlight regardless of how emphatically BASE_STYLE states it (8.4's
// lyrebird, 2026-08-05). A HUMAN eye reference does not fix it either — the
// model keeps its own idea of what a bird's eye looks like. So an animal whose
// eye is ALREADY right gets injected: L4.6's little bird and L6.2's barn owl
// both have clean solid black eyes. With those in the stack the eye comes out
// correct on generation, which is the only acceptable fix — painting a black
// disc on afterwards reads as pasted-on and does not survive into the scenes.
const ANIMAL_EYE_REFS = [
  refPath("animal_bird_ref.png", "L4_6_B1", "object_ref_bird.png"),
  refPath("animal_owl_ref.png", "L6_2_B1", "owl_reference.png"),
];

export async function generateAnimal({ name, appearance }) {
  const brief =
    `${appearance} ` +
    "A REAL animal of its species: it stands and moves as that animal does — never on two legs like a person, " +
    "never in clothes, never talking or gesturing. " +
    "Shown side-on, the whole animal in frame, on a plain light cream solid-colour background " +
    "(no scenery, no ground, no shadow, no other objects). " +
    BASE_STYLE;
  const refs = ANIMAL_EYE_REFS.filter((p) => fs.existsSync(p)).map((p) => fs.readFileSync(p));
  const vertexParts = [
    ...refs.flatMap((buf) => [
      {
        text:
          "EYE STYLE REFERENCE — look closely at this animal's eye: it is ONE tiny solid black filled dot, " +
          "with no white, no sclera, no coloured iris, no pale ring and no highlight. The animal you generate " +
          "MUST have this exact eye.",
      },
      { inlineData: { mimeType: "image/png", data: buf.toString("base64") } },
    ]),
    {
      text:
        "Now generate a COMPLETELY DIFFERENT animal (a different species from the references above) " +
        `with that SAME tiny solid black eye. SUBJECT: ${brief}`,
    },
  ];
  const prompt =
    "The reference images show our publishing house's animal style, and in particular the signature eye — " +
    "a tiny solid black filled dot with NO white, NO iris, NO highlight. Match that eye exactly. " +
    `Now draw a DIFFERENT animal from the references: ${brief}`;
  const gen = () => withFallback({
    openai: () => openaiImage(prompt, refs, "square_hd"),
    vertex: () => vertexImage(vertexParts),
    gpt2: () => gptImage(prompt, ANIMAL_EYE_REFS.map(refUri), "square_hd"),
  }, `animal:${name}`);
  return generateWithEyeQA(gen, `animal:${name}`);
}

// Scene generation with story-level continuity:
// - settingBlock: the story's fixed world (setting, architecture, season,
//   weather, and the key objects THIS page actually uses) — appended to the
//   scene prompt.
// - anchorBuf: the first image already generated at this page's location,
//   injected as a hard visual reference (see locationRefText).
// - camera: how this page is framed within that established place.
// castRefs: [{name, buf}] — character sheets for the non-hero people visible
// on this page, injected so they look the same every time they appear.
// objectRefs: [{name, buf}] — identity references for recurring key objects
// visible on this page (see generateObjectRef), injected the same way.
// prevBuf: the immediately PREVIOUS page's actual image, when it shares this
// page's location — carries forward anything set-dressing added since the
// anchor was taken (a specific rock's ledge, an undeclared prop's exact
// spot) that no fixed reference was ever generated for. Anchor = "what does
// this place permanently look like"; prevBuf = "what does it look like RIGHT
// NOW" — both can be true and useful at once.
export async function generateScene({ heroBuf, scene, child, settingBlock = "", anchorBuf = null, prevBuf = null, camera = "wide", castRefs = [], objectRefs = [], pageText = "", assertions = null, physics = "", previousResponseId = null, chainEnabled = true }) {
  // Whole-book QA is the default: paint the set once, compare the contact
  // sheet once, then make one consolidated repair decision. Per-page vision
  // QA remains an explicit diagnostic switch, not a hidden repaint trigger.
  const perPageQa = process.env.FORGE_PER_PAGE_QA === "1";
  const heroUri = toDataUri(heroBuf, "image/png");
  // The hero's look goes in as TEXT as well as a reference image. The
  // reference alone is not enough on the establishing page — it is the one
  // page with no location anchor, and in a wide shot the model repeatedly
  // redressed the child (a football shirt in one book, a plain red tee in the
  // next) and drew them younger. Words hold what the picture does not.
  const a = child.appearance || {};
  const heroLook =
    `THE MAIN CHARACTER'S LOOK IS FIXED AND MUST MATCH THEIR REFERENCE IMAGE EXACTLY ON EVERY PAGE: ` +
    `${child.name} is ${child.age ?? 5} years old` +
    (a.skinTone ? `, with ${a.skinTone} skin` : "") +
    (a.hair ? `, ${a.hair}` : "") +
    (a.outfit ? `, and wears ${a.outfit} — the SAME clothes in the SAME colours in every picture of this book` : "") +
    `. Never redress them, never change their age or size between pages, and never swap their outfit for something the scene suggests. `;
  // `correction` is appended only on the one repair pass consistency QA can
  // trigger below — undefined on the normal first attempt.
  const buildFullScene = (correction) =>
    `${scene}${physics ? ` PHYSICS OF THIS PICTURE - obey these exactly: ${physics}` : ""} ${heroLook} Setting reflects ${child.city ? `${child.city}, ` : ""}${child.country || "the UK"} authentically and warmly. ${NO_FLOATING_LIMBS} ${PHYSICAL_PLAUSIBILITY} ${settingBlock} ${BASE_STYLE}` +
    (correction ? ` CORRECTION FROM QA — fix this specific problem, keep everything else the same: ${correction}` : "");
  // Downscaled reference sheets for the consistency QA's character_match
  // check — the hero + every cast member in this scene. The QA compares the
  // scene's wardrobe (head covering, garments, colours, footwear, hair)
  // against these sheets item by item; page 4 of a real book redressed the
  // hero entirely and no gate could see it (Lynden 2026-08-14).
  const qaCharacterRefs = [];
  try {
    const heroSmall = await sharp(heroBuf).resize({ width: 512, withoutEnlargement: true }).jpeg({ quality: 70 }).toBuffer();
    qaCharacterRefs.push({ name: `${child.name} (the main character)`, b64: heroSmall.toString("base64"), mime: "image/jpeg" });
    for (const c of castRefs) {
      const small = await sharp(c.buf).resize({ width: 512, withoutEnlargement: true }).jpeg({ quality: 70 }).toBuffer();
      qaCharacterRefs.push({ name: c.name, b64: small.toString("base64"), mime: "image/jpeg" });
    }
  } catch {
    // QA refs are best-effort; consistency QA still runs without them
  }

  const samePlace = locationRefText(camera);
  // A character the text MENTIONS is not a character who is present. Page 1 of
  // the Portugal book said the chair "was for Grandad" and the illustrator
  // duly put Grandad in the frame, three pages before he arrives.
  const castText = castRefs.length
    ? `The next ${castRefs.length === 1 ? "reference image is the OTHER CHARACTER" : `${castRefs.length} reference images are the OTHER CHARACTERS`} in this scene (${castRefs.map((c) => c.name).join(", ")}) — keep each one's exact appearance: same face, same hair, same clothing in the same colours, same proportions, same tiny solid black dot eyes. They wear the SAME outfit on every page of the book; never recolour or restyle their clothes. ` +
      `ONLY these people and the main character are in this picture — no other family members, no bystanders. Someone the words merely mention is NOT in the frame. `
    : "THE MAIN CHARACTER IS ALONE in this picture. Draw no other people at all — no family members, no bystanders, nobody in a doorway or a window. Someone the words merely mention or talk about is NOT in the frame. ";

  // A recurring key object (a cap, a bag) redrawn from its text description
  // alone drifts colour, shape and trim page to page — the same failure mode
  // castRefs already fixed for people. objectRefs carries a locked identity
  // reference for each one visible on this page (see generateObjectRef).
  const objectText = objectRefs.length
    ? `The next ${objectRefs.length === 1 ? "reference image is a KEY OBJECT" : `${objectRefs.length} reference images are KEY OBJECTS`} in this scene (${objectRefs.map((o) => o.name).join(", ")}) — keep each one's exact appearance identical: same colours, same shape, same markings, same materials, every time it appears. Only draw it in the state this page's text and setting describe (its position, and whether it is open/closed, full/empty, finished/unfinished); never change its fixed identity. `
    : "";
  const prevText = prevBuf
    ? "The next reference image is THIS BOOK'S OWN PREVIOUS PAGE, in the same place as the scene you are about to draw — this is what the world actually looked like a moment ago. Any recurring object, structure or set-dressing visible in it (a rock's shape, where something was left, the exact background layout) MUST stay the same identity in the new scene, even if it was never separately described — only change what this page's action requires. This is continuity evidence, not the final word on identity — if it conflicts with a character/object reference image above, THIS reference loses. "
    : "";

  // Rebuilt per attempt so a consistency-QA repair pass (below) can append
  // its correction to the same scene brief rather than starting from scratch.
  const composeGen = (correction) => {
    const fullScene = buildFullScene(correction);
    const gptPrompt =
      "The first reference image is the MAIN CHARACTER — keep this character's exact appearance (face, hair, skin tone, outfit, proportions, tiny solid black dot eyes) identical in the generated scene. " +
      castText +
      objectText +
      prevText +
      (anchorBuf
        ? `The final reference image is the ${samePlace} `
        : "The final reference image shows our publishing house's style for full illustrated scenes — match its rendering, texture, palette and mood exactly. ") +
      `SCENE TO GENERATE: ${fullScene}`;
    const gptRefs = [
      heroUri,
      ...castRefs.map((c) => toDataUri(c.buf, "image/png")),
      ...objectRefs.map((o) => toDataUri(o.buf, "image/png")),
      ...(prevBuf ? [toDataUri(prevBuf, "image/png")] : []),
      anchorBuf ? toDataUri(anchorBuf, "image/png") : refUri(SCENE_REF_PATH),
    ];
    const vertexParts = [
      { text: "REFERENCE IMAGE 1 — This is the main character. Keep this character's exact appearance (face, hair, skin tone, outfit, proportions, eyes) in the generated scene:" },
      { inlineData: { mimeType: "image/png", data: heroBuf.toString("base64") } },
      ...castRefs.flatMap((c) => [
        { text: `REFERENCE — this is ${c.name}, also in this scene. Keep their exact appearance: same face, same hair, same clothing in the same colours, same dot eyes:` },
        { inlineData: { mimeType: "image/png", data: c.buf.toString("base64") } },
      ]),
      ...objectRefs.flatMap((o) => [
        { text: `REFERENCE — this is the key object "${o.name}". Keep its exact appearance identical (same colours, shape, markings, materials); only its state/position may change to match this page:` },
        { inlineData: { mimeType: "image/png", data: o.buf.toString("base64") } },
      ]),
      ...(prevBuf
        ? [
            { text: "REFERENCE — this is the book's own PREVIOUS page, same place. Keep any recurring object, structure or set-dressing visible in it (a rock's shape, where something was left) the same identity in the new scene, even if never separately described — only change what this page's action requires:" },
            { inlineData: { mimeType: "image/png", data: prevBuf.toString("base64") } },
          ]
        : []),
      ...(anchorBuf
        ? [
            { text: `LOCATION REFERENCE — ${samePlace}` },
            { inlineData: { mimeType: "image/png", data: anchorBuf.toString("base64") } },
          ]
        : [
            { text: "STYLE REFERENCE — our publishing house's style for full illustrated scenes. Match its rendering, watercolour texture, palette and mood exactly (do NOT copy its content):" },
            { inlineData: { mimeType: "image/png", data: fs.readFileSync(SCENE_REF_PATH).toString("base64") } },
          ]),
      { text: `SCENE TO GENERATE: ${fullScene}` },
    ];
    const openaiRefs = [
      heroBuf,
      ...castRefs.map((c) => c.buf),
      ...objectRefs.map((o) => o.buf),
      ...(prevBuf ? [prevBuf] : []),
      anchorBuf || fs.readFileSync(SCENE_REF_PATH),
    ];
    return () => withFallback({
      openai: () => openaiImage(gptPrompt, openaiRefs, "landscape_4_3"),
      vertex: () => vertexImage(vertexParts),
      gpt2: () => gptImage(gptPrompt, gptRefs, "landscape_4_3"),
    }, "scene");
  };

  // ── HYBRID CHAIN PATH (SKILL.md §5.5, adopted after the 2026-08-11 pilot) ──
  // Conversation state carries the WORLD forward (the rock keeps its shape,
  // the tide keeps its progress); per-turn reference images pin IDENTITY
  // (the pilot showed chain-only lets the hero's outfit drift). prevBuf is
  // NOT attached here — the chain itself already holds the previous image,
  // which is the whole point. Any failure falls through to the stateless
  // legacy path below, which never chains but always works.
  // The chain path runs on the OpenAI Responses API regardless of image
  // engine, so it must ALSO respect an explicit non-openai engine override —
  // otherwise FORGE_IMG_ENGINE=vertex still bills every scene to OpenAI.
  const chainWanted = chainEnabled && cfg.OPENAI_API_KEY && process.env.FORGE_CHAIN_SCENES !== "0" && engineOrder()[0] === "openai";
  if (chainWanted) {
    try {
      const chainRefs = [heroBuf, ...castRefs.map((c) => c.buf), ...objectRefs.map((o) => o.buf), ...(anchorBuf ? [anchorBuf] : [])];
      const chainRefText =
        "The attached reference images, in order: first the MAIN CHARACTER — keep this character's exact appearance (face, hair, skin tone, outfit, proportions, tiny solid black dot eyes) identical. " +
        castText + objectText +
        (anchorBuf ? `The final reference image is the ${samePlace} ` : "");
      const chainScenePrompt = (correction) =>
        (previousResponseId
          ? "CONTINUING THE SAME BOOK: this is the next page of the story you have been illustrating in this conversation. Keep the world exactly as the previous image left it — every structure, rock, prop and piece of set-dressing keeps its shape, position and identity — and change ONLY what this page's action requires. "
          : "This begins a children's picture book you will illustrate page by page in this conversation. Establish the world carefully — later pages must keep every structure and prop you draw now. ") +
        chainRefText +
        `SCENE TO GENERATE: ${buildFullScene(correction)}`;

      let turn = await responsesImage({ prompt: chainScenePrompt(), refBufs: chainRefs, previousResponseId, size: "1536x1024" });
      let cost = turn.cost;
      let buf = turn.buf;
      let responseId = turn.responseId;

      let eye = await eyeQAZoomed(buf);
      cost += eye.cost;
      let qa = { ...eye.qa, engine: "responses-chain" };
      if (!qa.pass) {
        const repaired = await repairEyes(buf, qa);
        buf = repaired.buf; cost += repaired.cost; qa = { ...repaired.qa, engine: "responses-chain" };
      }

      if (pageText && perPageQa) {
        const check = await sceneConsistencyQA(buf.toString("base64"), { sceneText: pageText, objectsBlock: settingBlock, characterRefs: qaCharacterRefs, assertions });
        cost += check.cost;
        // Only a BLOCKING fault is worth a regeneration: a failed page costs
      // 4-6x a clean one, and paying that for a cosmetic note is waste
      // (Lynden 2026-08-21). Minor faults ride along as recorded notes.
      if (!check.data.pass && check.data.severity !== "minor") {
          // The repair turn chains onto the FAILED turn so the model edits
          // its own picture rather than starting over — the same multi-turn
          // edit flow the Responses API is built for.
          const retry = await responsesImage({
            prompt: `CORRECTION — the previous image has a specific problem to fix, keeping everything else exactly the same: ${check.data.reason}`,
            refBufs: [],
            previousResponseId: turn.responseId,
            size: "1536x1024",
          });
          cost += retry.cost;
          let rbuf = retry.buf;
          const reye = await eyeQAZoomed(rbuf);
          cost += reye.cost;
          let rqa = { ...reye.qa, engine: "responses-chain" };
          if (!rqa.pass) {
            const rrep = await repairEyes(rbuf, rqa);
            rbuf = rrep.buf; cost += rrep.cost; rqa = { ...rrep.qa, engine: "responses-chain" };
          }
          const recheck = await sceneConsistencyQA(rbuf.toString("base64"), { sceneText: pageText, objectsBlock: settingBlock, characterRefs: qaCharacterRefs, assertions });
          cost += recheck.cost;
          buf = rbuf;
          responseId = retry.responseId;
          qa = { ...rqa, consistency: recheck.data, consistencyRepaired: true };
        } else {
          qa = { ...qa, consistency: check.data };
        }
      }
      return { buf, cost, qa, responseId };
    } catch (e) {
      console.warn("[forge] chained scene failed, falling back to stateless path:", e.message);
    }
  }

  let result = await generateWithEyeQA(composeGen(), "scene");

  // Consistency QA — SKILL.md §5's specified-but-unbuilt check: does the
  // picture actually show what this page's text says, in the state the
  // director declared? Only runs when the caller supplies pageText (jobs.mjs
  // does, for every real story page). One repair pass, bounded: a second
  // wrong picture ships rather than looping, same doctrine as repairEyes.
  if (pageText && perPageQa) {
    try {
      const check = await sceneConsistencyQA(result.buf.toString("base64"), { sceneText: pageText, objectsBlock: settingBlock, characterRefs: qaCharacterRefs, assertions });
      result.cost += check.cost;
      if (!check.data.pass) {
        const retry = await generateWithEyeQA(composeGen(check.data.reason), "scene");
        const recheck = await sceneConsistencyQA(retry.buf.toString("base64"), { sceneText: pageText, objectsBlock: settingBlock, characterRefs: qaCharacterRefs, assertions });
        result = {
          buf: retry.buf,
          cost: result.cost + retry.cost + recheck.cost,
          qa: { ...result.qa, consistency: recheck.data, consistencyRepaired: true },
        };
      } else {
        result = { ...result, qa: { ...result.qa, consistency: check.data } };
      }
    } catch (e) {
      // consistency QA unavailable - ship the eye-QA'd image, but say so:
      // a silent catch here hid a whole missing gate (Zaid run, 2026-08-19).
      console.warn("[forge] scene consistency QA unavailable:", e.message);
    }
  }
  return result;
}

// The cover sells THIS story, not the child's hobby list. `brief` is the
// story's own cover moment (hero + the story's central object, in the story's
// world); `anchorBuf` is the main location's established image so the cover
// can't wander off to a beach the book never visits.
// castRefs, same shape as generateScene. Without it a cover with a second
// character described in words only drifts: 8.4's cover gave Tom black hair and
// blue jeans when his sheet says sandy hair and khaki cargos (2026-08-05). The
// scene path had solved this already — the cover just never got the parameter.
export async function generateCover({ heroBuf, brief, child, settingBlock = "", anchorBuf = null, castRefs = [], objectRefs = [], previousResponseId = null, chainEnabled = true }) {
  const heroUri = toDataUri(heroBuf, "image/png");
  const castText = castRefs.length
    ? `The next ${castRefs.length === 1 ? "reference image is the OTHER CHARACTER" : `${castRefs.length} reference images are the OTHER CHARACTERS`} on this cover (${castRefs.map((c) => c.name).join(", ")}) — keep each one's exact appearance: same face, same hair colour, same clothing in the same colours, same proportions, same tiny solid black dot eyes. `
    : "";
  const objectText = objectRefs.length
    ? `The next ${objectRefs.length === 1 ? "reference image is a KEY OBJECT" : `${objectRefs.length} reference images are KEY OBJECTS`} on this cover (${objectRefs.map((o) => o.name).join(", ")}) — keep each one's exact appearance identical to its reference: same colours, shape, markings, materials. Show it in its final story state, matching the cover moment. `
    : "";
  const coverBrief =
    `A joyful children's book COVER illustration starring the exact same character. THE COVER MOMENT: ${brief} ` +
    "The cover must show this story's own world and its central object — never a generic scene, a holiday setting or the child's hobbies unless the story itself happens there. " +
    "Full illustrated scene in our house style, richly painted with soft watercolour texture (NOT a flat vector character on a plain background). " +
    `Leave gentle empty space at the top of the image for a title to be overlaid later. ${settingBlock} ${BASE_STYLE}`;
  const placeRef = anchorBuf
    ? "REFERENCE IMAGE 2 — the story's own location. The cover happens in this place (or clearly in its world): keep the same architecture, materials, colours and light. "
    : "";
  const gptPrompt =
    "The first reference image is the MAIN CHARACTER — keep this character's exact appearance (face, hair, skin tone, outfit, proportions, tiny solid black dot eyes). " +
    castText +
    objectText +
    (anchorBuf ? placeRef : "") +
    `The final reference image is one of our publishing house's real book covers — match its illustration style, composition feel and warmth (do NOT copy its content or characters). ` +
    `COVER TO GENERATE: ${coverBrief}`;
  const vertexParts = [
    { text: "REFERENCE IMAGE 1 — This is the main character. Keep this character's exact appearance in the generated scene:" },
    { inlineData: { mimeType: "image/png", data: heroBuf.toString("base64") } },
    ...castRefs.flatMap((c) => [
      { text: `REFERENCE — this is ${c.name}, also on this cover. Keep their exact appearance: same face, same hair colour, same clothing in the same colours, same dot eyes:` },
      { inlineData: { mimeType: "image/png", data: c.buf.toString("base64") } },
    ]),
    ...objectRefs.flatMap((o) => [
      { text: `REFERENCE — this is the key object "${o.name}" on the cover. Keep its exact appearance identical (same colours, shape, markings, materials), shown in its final story state:` },
      { inlineData: { mimeType: "image/png", data: o.buf.toString("base64") } },
    ]),
    ...(anchorBuf
      ? [{ text: placeRef }, { inlineData: { mimeType: "image/png", data: anchorBuf.toString("base64") } }]
      : []),
    { text: "FINAL REFERENCE — one of our real book covers. Match its illustration style, painterly texture, composition feel and warmth (do NOT copy its content or characters):" },
    { inlineData: { mimeType: "image/png", data: fs.readFileSync(COVER_REF_PATH).toString("base64") } },
    { text: `COVER TO GENERATE: ${coverBrief}` },
  ];
  // Chained cover: continuing the book's own conversation from the final
  // scene means the cover inherits the resolved world and final object
  // states directly — the exact thing the cover contract (§8) needs. Same
  // hybrid rule as scenes: identity references still attached per turn.
  // Same engine-override guard as generateScene: chained covers are OpenAI
  // calls and must not run when the engine is pinned elsewhere.
  const chainWanted = chainEnabled && cfg.OPENAI_API_KEY && process.env.FORGE_CHAIN_SCENES !== "0" && engineOrder()[0] === "openai";
  if (chainWanted) {
    try {
      const chainRefs = [heroBuf, ...castRefs.map((c) => c.buf), ...objectRefs.map((o) => o.buf), fs.readFileSync(COVER_REF_PATH)];
      const chainPrompt =
        (previousResponseId
          ? "This conversation's book is finished — now generate its COVER. Keep the story's world exactly as the previous pages established it (same place, same final object states, same characters). "
          : "") +
        "The attached reference images, in order: first the MAIN CHARACTER — keep this character's exact appearance identical. " +
        castText + objectText +
        "The final reference image is one of our publishing house's real book covers — match its illustration style, composition feel and warmth (do NOT copy its content or characters). " +
        `COVER TO GENERATE: ${coverBrief}`;
      const turn = await responsesImage({ prompt: chainPrompt, refBufs: chainRefs, previousResponseId, size: "1024x1536" });
      let cost = turn.cost;
      let buf = turn.buf;
      let eye = await eyeQAZoomed(buf);
      cost += eye.cost;
      let qa = { ...eye.qa, engine: "responses-chain" };
      if (!qa.pass) {
        const repaired = await repairEyes(buf, qa);
        buf = repaired.buf; cost += repaired.cost; qa = { ...repaired.qa, engine: "responses-chain" };
      }
      return { buf, cost, qa, responseId: turn.responseId };
    } catch (e) {
      console.warn("[forge] chained cover failed, falling back to stateless path:", e.message);
    }
  }

  const openaiRefs = [heroBuf, ...castRefs.map((c) => c.buf), ...objectRefs.map((o) => o.buf), ...(anchorBuf ? [anchorBuf] : []), fs.readFileSync(COVER_REF_PATH)];
  const gen = () => withFallback({
    openai: () => openaiImage(gptPrompt, openaiRefs, "portrait_4_3"),
    vertex: () => vertexImage(vertexParts),
    gpt2: () => gptImage(
      gptPrompt,
      // castRefs/objectRefs were missing here: the prompt promised an "OTHER
      // CHARACTER" reference the model never received, so it misread the
      // publisher cover ref as the cast member (Zaid cover, 2026-08-19).
      [heroUri, ...castRefs.map((c) => toDataUri(c.buf, "image/png")), ...objectRefs.map((o) => toDataUri(o.buf, "image/png")), ...(anchorBuf ? [toDataUri(anchorBuf, "image/png")] : []), refUri(COVER_REF_PATH)],
      "portrait_4_3",
    ),
  }, "cover");
  return generateWithEyeQA(gen, "cover");
}

// Landmark art for the "Meet the Star" profile page — house style, no
// characters, painted like a postcard from the child's homeland.
export async function generateLandmark({ name, imageBrief, city, country }) {
  const where = [city, country].filter(Boolean).join(", ");
  const parts = [
    { text: "REFERENCE IMAGE — our publishing house's illustration style. Match its hand-drawn rendering, watercolour texture and warm palette exactly:" },
    { inlineData: { mimeType: "image/png", data: fs.readFileSync(SCENE_REF_PATH).toString("base64") } },
    { text: `SCENE TO GENERATE: A beautiful SQUARE postcard illustration of ${name}${where ? ` in ${where}` : ""}: ${imageBrief} Composed to fit fully in a square frame with the whole landmark visible. Golden warm light, inviting and joyful, no people or text in the image. ${BASE_STYLE}` },
  ];
  const landmarkPrompt = `Match the illustration style of the reference image exactly. A beautiful SQUARE postcard illustration of ${name}${where ? ` in ${where}` : ""}: ${imageBrief} Composed to fit fully in a square frame with the whole landmark visible. Golden warm light, no people or text. ${BASE_STYLE}`;
  const gen = () => withFallback({
    openai: () => openaiImage(landmarkPrompt, [fs.readFileSync(SCENE_REF_PATH)], "square_hd"),
    vertex: () => vertexImage(parts),
    gpt2: () => gptImage(landmarkPrompt, [refUri(SCENE_REF_PATH)], "square_hd"),
  }, "landmark");
  return generateWithEyeQA(gen, "landmark");
}



// Small review thumbnail — the cold-editor gate reads the whole book at
// once, so each page is downscaled to keep the payload sane while leaving
// plenty of pixels to judge composition, continuity and the story's
// distinguishing marks.
export async function reviewThumb(buf, width = 640) {
  return sharp(buf).resize({ width, withoutEnlargement: true }).jpeg({ quality: 72 }).toBuffer();
}
