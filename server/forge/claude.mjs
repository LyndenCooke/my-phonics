// Claude API calls for the custom-book pipeline: story writing, decodability
// review, and the eye-rule vision QA on generated images. Costs are tracked
// per call so each book gets a real cost breakdown.
import { execFile } from "node:child_process";
import { cfg } from "./env.mjs";

// The JUDGE model (Lynden 2026-08-16). OpenAI writes; Claude reads cold. Opus 5
// costs the same as the 4.8 it replaces ($5/$25 per 1M) and is materially better
// at exactly this job — finding real faults without inventing them.
// Two things about Opus 5 the gates have to respect:
//   - thinking is ON by default, and max_tokens caps thinking AND the answer
//     together, so every judge call needs real headroom (JUDGE_MAX_TOKENS).
//   - it can decline a request outright: HTTP 200, stop_reason "refusal", empty
//     content. Check stop_reason before reading content.
const MODEL = "claude-opus-5";
// $ per 1M tokens (Opus 5 = same rate as Opus 4.8)
const PRICE_IN = 5.0;
const PRICE_OUT = 25.0;
// Judge calls get 16k regardless of what the caller asked for. The editor gate
// asked for 6000, which was already twice fatal on the OpenAI path ("Unterminated
// string", 08-15) BEFORE thinking tokens shared the budget. 16k, not more: above
// ~16k a non-streaming request starts risking the SDK's HTTP timeout.
const JUDGE_MAX_TOKENS = 16000;

let client = null;
// Lazy dynamic import, kept deliberately: a static import made the serverless
// bundle depend on a package the trace didn't ship, and the whole function died
// at cold start with ERR_MODULE_NOT_FOUND before serving a single request.
// NOTE (08-16): this path DOES now run in production — it is the cross-vendor
// judge. If the trace still drops @anthropic-ai/sdk, the import throws inside
// the judge's try/catch and the gate quietly falls back to the writer's engine
// (warning in the logs) instead of taking the function down. Watch for
// "cross-vendor judge (anthropic) failed" after the first prod deploy.
async function getClient() {
  if (!client) {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    client = new Anthropic({ apiKey: cfg.ANTHROPIC_API_KEY });
  }
  return client;
}

// Cached input is NOT billed at the input rate: a cache write costs 1.25x and a
// read 0.1x. Pricing them as plain input would overstate a cached judge call by
// roughly the size of the rubric — and an inaccurate ledger is exactly what let
// a "$6 cap" quietly be worth double (08-15).
function usageCost(usage) {
  const cacheWrite = (usage.cache_creation_input_tokens || 0) * PRICE_IN * 1.25;
  const cacheRead = (usage.cache_read_input_tokens || 0) * PRICE_IN * 0.1;
  return (
    ((usage.input_tokens || 0) * PRICE_IN + cacheWrite + cacheRead +
      (usage.output_tokens || 0) * PRICE_OUT) / 1_000_000
  );
}

// Last Anthropic judge call's raw usage, for cost benchmarking only.
let lastJudgeUsage = null;
export function getLastJudgeUsage() {
  return lastJudgeUsage;
}

// ---------------- OpenAI backend ----------------
// Preferred over Vertex when an OpenAI key is configured (Lynden 2026-07-26:
// the OpenAI account is funded again). Unlike Vertex it needs no gcloud login,
// which is what killed the previous run mid-session when the token expired.
const OPENAI_STORY_MODEL = "gpt-5.5"; // story, rewrite, director
const OPENAI_FAST_MODEL = "gpt-5.4-mini"; // vision QA, country pack
// Phonics work (decodability, shifty marking) goes to gpt-5.6-sol: 5.4-mini
// cannot segment graphemes — it reported 137 violations on an 8-page book,
// including the book's own focus words (ambitious, nutritious, scrumptious).
const OPENAI_PHONICS_MODEL = "gpt-5.6-sol";
// $ per 1M tokens (platform pricing, July 2026)
const OPENAI_PRICES = {
  "gpt-5.5": { in: 5.0, out: 30.0 },
  "gpt-5.4-mini": { in: 0.75, out: 4.5 },
  "gpt-5.6-sol": { in: 5.0, out: 30.0 },
};

// Read a streamed chat completion. Streaming is not for show: a non-streamed
// gpt-5.5 story call sits silent past Node's 300s undici headers timeout and
// dies with UND_ERR_HEADERS_TIMEOUT (it killed a Level 7 run). Streaming
// returns headers immediately, so only a genuine stall can time us out.
async function readStream(res) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let usage = {};
  let refusal = "";
  let finish = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";
    for (const part of parts) {
      const line = part.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") continue;
      let chunk;
      try {
        chunk = JSON.parse(payload);
      } catch {
        continue;
      }
      const delta = chunk.choices?.[0]?.delta;
      if (delta?.content) text += delta.content;
      if (delta?.refusal) refusal += delta.refusal;
      if (chunk.choices?.[0]?.finish_reason) finish = chunk.choices[0].finish_reason;
      if (chunk.usage) usage = chunk.usage;
    }
  }
  return { text, usage, refusal, finish };
}

async function openaiJson({ model, system, content, schema, images = [], maxTokens = 16000, attempt = 0 }) {
  const userContent = images.length
    ? [
        ...images.map((i) => ({
          type: "image_url",
          image_url: { url: `data:${i.mime || "image/jpeg"};base64,${i.b64}` },
        })),
        { type: "text", text: content },
      ]
    : content;
  const retry = async (why) => {
    if (attempt >= 4) throw new Error(`openai ${model}: ${why}`);
    const wait = Math.min(60_000, 4000 * 2 ** attempt) * (0.75 + Math.random() * 0.5);
    console.warn(`[forge] openai ${model} ${why} — retry ${attempt + 1}/4 in ${Math.round(wait / 1000)}s`);
    await new Promise((r) => setTimeout(r, wait));
    return openaiJson({ model, system, content, schema, images, maxTokens, attempt: attempt + 1 });
  };

  let res;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userContent },
        ],
        max_completion_tokens: maxTokens,
        stream: true,
        stream_options: { include_usage: true },
        response_format: {
          type: "json_schema",
          json_schema: { name: "forge_response", schema, strict: true },
        },
      }),
    });
  } catch (e) {
    // Network-level failure (timeout, socket reset) — worth one more go.
    return retry(`fetch failed (${e.cause?.code || e.message})`);
  }
  if (!res.ok) {
    const text = await res.text();
    // Exhausted credits also arrive as a 429, but no amount of backoff fixes
    // them — fail fast WITH the body so the job machine's provider-credit
    // classifier (PROVIDER_CREDIT_RE in jobs.mjs) can pause the job instead
    // of burning four retries and landing in generic "failed".
    if (/insufficient_quota|credit_balance_exhausted|billing/i.test(text)) {
      throw new Error(`openai ${model} ${res.status} insufficient_quota: ${text.slice(0, 200)}`);
    }
    if ([429, 500, 502, 503, 504].includes(res.status)) return retry(`${res.status}: ${text.slice(0, 120)}`);
    throw new Error(`openai ${model} ${res.status}: ${text.slice(0, 300)}`);
  }
  let stream;
  try {
    stream = await readStream(res);
  } catch (e) {
    return retry(`stream broke (${e.cause?.code || e.message})`);
  }
  if (stream.refusal) throw new Error(`openai ${model} refused: ${stream.refusal.slice(0, 200)}`);
  const text = stream.text;
  if (!text) throw new Error(`openai ${model}: empty response (${stream.finish})`);
  const u = stream.usage || {};
  const price = OPENAI_PRICES[model] || OPENAI_PRICES[OPENAI_FAST_MODEL];
  const cost = ((u.prompt_tokens || 0) * price.in + (u.completion_tokens || 0) * price.out) / 1_000_000;
  try {
    return { data: JSON.parse(text), cost };
  } catch (e) {
    // Truncated/mangled JSON (finish=length, mid-stream clip) is transient —
    // re-request rather than kill the job ("Unterminated string" ended a run
    // at the story gate, 2026-08-15).
    return retry(`unparseable JSON (${e.message.slice(0, 60)}; finish=${stream.finish})`);
  }
}

// ---------------- Vertex Gemini fallback (gcloud OAuth) ----------------
// Used when no real ANTHROPIC_API_KEY is configured. Same project/region as
// the offline book pipeline (see myphonics_books/scripts/generate_sound_books.py).
// Backend order: a real Anthropic key wins, then OpenAI, then Vertex Gemini.
// FORGE_LLM=vertex forces the old path.
// A KEYED ANTHROPIC ACCOUNT DOES NOT TAKE OVER THE PIPELINE (Lynden 2026-08-16).
// The key was added so prod gets a cross-vendor cold read, not to change who
// writes. The old order ("a real Anthropic key wins") predates the OpenAI path;
// leaving it would have silently moved the story writer, the director and all
// eight vision-QA gates off the models every piece of doctrine was tuned on.
// OpenAI stays the writer while it is keyed; Anthropic is the judge. Force the
// old behaviour with FORGE_LLM=anthropic, or Gemini with FORGE_LLM=vertex.
// FORGE_LLM is an ABSOLUTE override, not a preference. qaReplay.mjs sets
// FORGE_LLM=vertex precisely so a replay never spends paid credit; once the
// Anthropic key existed, "prefer vertex" would have quietly fallen through to
// Opus 5 for every archived vision case — the opposite of a free replay.
const forceVertex = process.env.FORGE_LLM === "vertex";
const useOpenAI =
  Boolean(cfg.OPENAI_API_KEY) && !forceVertex && process.env.FORGE_LLM !== "anthropic";
const useVertex = forceVertex || (!useOpenAI && !cfg.ANTHROPIC_API_KEY);
const VERTEX_STORY_MODEL = "gemini-2.5-pro"; // story writing needs the strong model
const VERTEX_FAST_MODEL = "gemini-2.5-flash"; // QA / vision checks
const VERTEX_PRICES = {
  "gemini-2.5-pro": { in: 1.25, out: 10.0 },
  "gemini-2.5-flash": { in: 0.3, out: 2.5 },
};

let gcloudToken = { value: null, at: 0 };
export function invalidateGcloudToken() {
  gcloudToken = { value: null, at: 0 };
}
export function getGcloudToken() {
  if (gcloudToken.value && Date.now() - gcloudToken.at < 25 * 60 * 1000) {
    return Promise.resolve(gcloudToken.value);
  }
  return new Promise((resolve, reject) => {
    execFile(
      "gcloud",
      ["auth", "print-access-token"],
      { shell: true, windowsHide: true },
      (err, stdout) => {
        if (err) return reject(new Error(`gcloud auth failed: ${err.message}`));
        gcloudToken = { value: stdout.trim(), at: Date.now() };
        resolve(gcloudToken.value);
      },
    );
  });
}

// Gemini's responseSchema is an OpenAPI subset — it rejects additionalProperties.
function toGeminiSchema(schema) {
  if (Array.isArray(schema)) return schema.map(toGeminiSchema);
  if (schema && typeof schema === "object") {
    const out = {};
    for (const [k, v] of Object.entries(schema)) {
      if (k === "additionalProperties") continue;
      out[k] = toGeminiSchema(v);
    }
    return out;
  }
  return schema;
}

async function vertexGenerate({ model, system, parts, schema, maxTokens }) {
  // Vertex rate-limits burst traffic (429 RESOURCE_EXHAUSTED) — this pipeline
  // fires an eye-QA call per image, so retries with exponential backoff are
  // required, and flash/pro have separate quota pools so the final attempts
  // swap models rather than give up.
  const MAX_ATTEMPTS = 6;
  let lastErr;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const useModel = attempt < 4 ? model : model === VERTEX_FAST_MODEL ? VERTEX_STORY_MODEL : VERTEX_FAST_MODEL;
    if (attempt > 0) {
      const delay = Math.min(60_000, 2000 * 2 ** (attempt - 1)) * (0.75 + Math.random() * 0.5);
      await new Promise((r) => setTimeout(r, delay));
    }
    const token = await getGcloudToken();
    const url =
      `https://${cfg.VERTEX_REGION}-aiplatform.googleapis.com/v1/projects/${cfg.VERTEX_PROJECT}` +
      `/locations/${cfg.VERTEX_REGION}/publishers/google/models/${useModel}:generateContent`;
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          responseMimeType: "application/json",
          responseSchema: toGeminiSchema(schema),
        },
      }),
    });
    const data = await res.json();
    if (res.status === 401 || res.status === 403) {
      // gcloud access token expired mid-job — drop the cache so the next
      // attempt mints a fresh one (tokens live ~60 min; long books cross it).
      gcloudToken = { value: null, at: 0 };
      lastErr = new Error(`vertex ${useModel} ${res.status}: token expired, refreshing`);
      console.warn(`[forge] ${lastErr.message} — retry ${attempt + 1}/${MAX_ATTEMPTS - 1}`);
      continue;
    }
    if (res.status === 429 || res.status === 503) {
      lastErr = new Error(`vertex ${useModel} ${res.status}: ${JSON.stringify(data).slice(0, 200)}`);
      console.warn(`[forge] ${lastErr.message} — retry ${attempt + 1}/${MAX_ATTEMPTS - 1}`);
      continue;
    }
    if (!res.ok) {
      throw new Error(`vertex ${useModel} ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
    }
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ?? "";
    if (!text) throw new Error(`vertex ${useModel}: empty response (${data.candidates?.[0]?.finishReason})`);
    // A MAX_TOKENS finish means the JSON was cut off mid-string — parsing it
    // throws "Unterminated string". Retry with more headroom instead: the
    // describe-first QA rubrics routinely outgrow their nominal budget.
    if (data.candidates?.[0]?.finishReason === "MAX_TOKENS") {
      maxTokens = Math.min(maxTokens * 2, 16000);
      lastErr = new Error(`vertex ${useModel}: response truncated at token limit — retrying with maxTokens=${maxTokens}`);
      console.warn(`[forge] ${lastErr.message}`);
      continue;
    }
    const u = data.usageMetadata || {};
    const price = VERTEX_PRICES[useModel] || VERTEX_PRICES["gemini-2.5-flash"];
    const cost =
      ((u.promptTokenCount || 0) * price.in +
        ((u.candidatesTokenCount || 0) + (u.thoughtsTokenCount || 0)) * price.out) /
      1_000_000;
    return { data: JSON.parse(text), cost };
  }
  throw lastErr;
}

// CROSS-VENDOR JUDGING (Lynden 2026-08-16, "idea one"): a gate that judges a
// story must not run on the vendor that WROTE it — same-model review shares
// the writer's blind spots (the 08-13 cold-ChatGPT lesson). Callers do not
// name a vendor (naming one got it backwards: "openai" was hard-coded on both
// gates while OpenAI was also the writer, so the cross-read never happened).
// They pass `judge: true` and the alternate is derived from whoever writes.
const writerVendor = useOpenAI ? "openai" : useVertex ? "vertex" : "anthropic";

// Vertex is only reachable where the gcloud CLI is installed and authed — true
// on Lynden's machine, false on Vercel. Probed once, lazily, and never retried
// after a failure, so a prod judge falls straight back to the writer's vendor
// instead of paying a failed exec on every gate.
let vertexJudgeOk = null;
// Every vendor EXCEPT the writer, best-first. A keyed vendor is preferred over
// Vertex because Vertex needs a local gcloud CLI and so is unavailable in prod
// — putting it last is what gives Vercel a real cold read once a second key
// exists there (Lynden added ANTHROPIC_API_KEY 2026-08-16 for exactly that).
// FORGE_JUDGE pins the judging vendor (openai | vertex | anthropic) for cost
// experiments; it still never selects the writer's own vendor, so pinning the
// writer's vendor just disables the cold read rather than faking one.
const JUDGE_ORDER = process.env.FORGE_JUDGE
  ? [process.env.FORGE_JUDGE]
  : ["anthropic", "openai", "vertex"];
// Thinking depth for judge calls. Opus 5 bills thinking tokens, and on the
// first real text-only run the two gates cost $0.55 of a $1.02 story — most of
// it thinking, not input. Low/medium are unusually strong on this model, so
// the level is tunable without touching code (FORGE_JUDGE_EFFORT).
const JUDGE_EFFORT = process.env.FORGE_JUDGE_EFFORT || "medium";
const vendorKeyed = { anthropic: () => Boolean(cfg.ANTHROPIC_API_KEY), openai: () => Boolean(cfg.OPENAI_API_KEY), vertex: () => true };
// `prefer` lets an individual gate ask for a cheaper vendor than the default
// judge (plausibility does — see reviewStoryPlausibility). A preference never
// overrides the one hard rule: the judge is never the writer's own vendor.
async function judgeVendorFor(prefer = null) {
  const order = prefer && !process.env.FORGE_JUDGE
    ? [prefer, ...JUDGE_ORDER.filter((v) => v !== prefer)]
    : JUDGE_ORDER;
  for (const v of order) {
    if (v === writerVendor || !vendorKeyed[v]()) continue;
    if (v !== "vertex") return v;
    if (vertexJudgeOk === false) continue;
    if (vertexJudgeOk === null) {
      try {
        await getGcloudToken();
        vertexJudgeOk = true;
      } catch {
        vertexJudgeOk = false;
        console.warn("[forge] cross-vendor judging unavailable (no gcloud) — gates run on the writer's vendor");
        continue;
      }
    }
    return "vertex";
  }
  return null; // single-vendor deployment: the gate still runs, just not cold
}

// judge: false | true (default judge) | "vertex" | "anthropic" | "openai"
// (a preferred vendor for this gate, still never the writer's own).
async function callJson({ system, content, schema, maxTokens = 16000, tier = "story", judge = false }) {
  const vendor = judge ? await judgeVendorFor(typeof judge === "string" ? judge : null) : null;
  if (vendor === "openai") {
    return openaiJson({
      model: tier === "phonics" ? OPENAI_PHONICS_MODEL : tier === "story" ? OPENAI_STORY_MODEL : OPENAI_FAST_MODEL,
      system, content, schema, maxTokens,
    });
  }
  if (vendor === "vertex") {
    // A judge failing is not a book failing: fall through to the normal
    // engine rather than killing a paid job over a transient Vertex error.
    try {
      return await vertexGenerate({
        model: tier === "story" ? VERTEX_STORY_MODEL : VERTEX_FAST_MODEL,
        system, parts: [{ text: content }], schema, maxTokens,
      });
    } catch (e) {
      console.warn(`[forge] cross-vendor judge (vertex) failed, falling back to writer: ${e.message}`);
    }
  }
  if (vendor === "anthropic") {
    // As with Vertex: a judge failing is not a book failing. Fall through to
    // the writer's engine rather than killing a paid job over a bad key or a
    // transient Anthropic error.
    try {
      const r = await (await getClient()).messages.create({
        model: MODEL,
        max_tokens: Math.max(maxTokens, JUDGE_MAX_TOKENS),
        // The rubric is the same bytes for every book this gate ever judges,
        // and it is far and away the largest stable block in the request — so
        // cache it and pay ~0.1x for it from the second book onward. The story
        // itself stays uncached in the user turn, where it belongs: it differs
        // every call and would invalidate the prefix if it sat above it.
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content }],
        output_config: { format: { type: "json_schema", schema }, effort: JUDGE_EFFORT },
      });
      lastJudgeUsage = r.usage;
      // Opus 5 can decline: 200 OK, empty content, stop_reason "refusal".
      // Reading content[0] blind would throw a confusing parse error instead.
      if (r.stop_reason === "refusal") {
        throw new Error(`declined the request (${r.stop_details?.category ?? "no category"})`);
      }
      if (r.stop_reason === "max_tokens") {
        throw new Error("response hit max_tokens — JSON is truncated");
      }
      const t = r.content.find((b) => b.type === "text")?.text ?? "";
      return { data: JSON.parse(t), cost: usageCost(r.usage) };
    } catch (e) {
      console.warn(`[forge] cross-vendor judge (anthropic) failed, falling back to writer: ${e.message}`);
    }
  }
  if (useOpenAI) {
    return openaiJson({
      model:
        tier === "phonics"
          ? OPENAI_PHONICS_MODEL
          : tier === "story"
            ? OPENAI_STORY_MODEL
            : OPENAI_FAST_MODEL,
      system,
      content,
      schema,
      maxTokens,
    });
  }
  if (useVertex) {
    return vertexGenerate({
      model: tier === "story" ? VERTEX_STORY_MODEL : VERTEX_FAST_MODEL,
      system,
      parts: [{ text: content }],
      schema,
      maxTokens,
    });
  }
  const response = await (await getClient()).messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content }],
    output_config: { format: { type: "json_schema", schema } },
  });
  if (response.stop_reason === "refusal") {
    throw new Error("Claude declined the request (refusal)");
  }
  const text = response.content.find((b) => b.type === "text")?.text ?? "";
  return { data: JSON.parse(text), cost: usageCost(response.usage) };
}

const STORY_SCHEMA = {
  type: "object",
  properties: {
    // Forces the shape-avoidance rules below to be an explicit commitment
    // made DURING generation, not a hope buried in prose the model may skim.
    // Prep beats QA: a required field the writer must answer is a much
    // stronger guardrail than another paragraph of instructions, and costs
    // nothing extra since it rides the same call (Lynden 2026-08-09).
    shape_fulfilment: { type: "string", description: "One sentence: what makes THIS story genuinely follow its assigned shape, and confirm it is not secretly the make-something-and-spill-it story or a string of collected/traded/swapped objects." },
    // The PREMISE LOCK. Filled in before the pages are written, and preserved
    // verbatim through any editorial revision: a revision deepens THIS story,
    // it never invents a new one (the 2026-08-14 revision abandoned a
    // simit-cart premise and returned an unrelated star-tin book).
    premise: {
      type: "object",
      properties: {
        main_character: { type: "string" },
        setting: { type: "string", description: "Where the whole story happens, in one phrase." },
        central_goal: { type: "string", description: "What the hero wants, and why a child would care." },
        important_object: { type: "string", description: "The story's central object, if it has one — else the central thing at stake." },
        inciting_problem: { type: "string", description: "What goes wrong or stands in the way." },
        cultural_context: { type: "string", description: "The child's world as the pictures will show it." },
        core_premise: { type: "string", description: "The whole story in one sentence." },
      },
      required: ["main_character", "setting", "central_goal", "important_object", "inciting_problem", "cultural_context", "core_premise"],
      additionalProperties: false,
    },
    // The SIX-BEAT PLAN, committed to before any page text. A story whose
    // beats cannot be filled honestly (no real setback, no plan, resolution
    // not earned by the hero's own action) is a phonics exercise wearing a
    // story's clothes and will be rejected by the editor gate.
    story_plan: {
      type: "object",
      properties: {
        goal: { type: "string", description: "What does the character want, and why does it matter?" },
        problem: { type: "string", description: "What prevents them from getting it?" },
        first_attempt: { type: "string", description: "What do they try first?" },
        setback: { type: "string", description: "Why that attempt does not work, or how the problem becomes harder. Need not be dramatic: it can cost time, cause disappointment, damage something slightly, require cooperation, or force a change of plan." },
        plan_and_action: { type: "string", description: "What the character notices, decides or does differently." },
        earned_resolution: { type: "string", description: "How their own action produces the ending, and how they feel." },
      },
      required: ["goal", "problem", "first_attempt", "setback", "plan_and_action", "earned_resolution"],
      additionalProperties: false,
    },
    title: { type: "string" },
    setting: {
      type: "object",
      properties: {
        place: { type: "string" },
        architecture: { type: "string" },
        season: { type: "string" },
        weather: { type: "string" },
      },
      required: ["place", "architecture", "season", "weather"],
      additionalProperties: false,
    },
    key_objects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          look: { type: "string" },
        },
        required: ["name", "look"],
        additionalProperties: false,
      },
    },
    // Everyone in the book who is NOT the hero. Without this they are
    // re-invented from the word "mum" on every page, and her clothes change
    // colour page to page (Lynden 2026-07-26).
    cast: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          who: { type: "string" },
          appearance: { type: "string" },
        },
        required: ["id", "who", "appearance"],
        additionalProperties: false,
      },
    },
    pages: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          scene: { type: "string" },
          location: { type: "string" },
        },
        required: ["text", "scene", "location"],
        additionalProperties: false,
      },
    },
    cover_brief: { type: "string" },
    focus_word_examples: { type: "array", items: { type: "string" } },
    tricky_words_used: { type: "array", items: { type: "string" } },
    read_words: { type: "array", items: { type: "string" } },
    questions: { type: "array", items: { type: "string" } },
    alien_words: { type: "array", items: { type: "string" } },
  },
  required: ["shape_fulfilment", "premise", "story_plan", "title", "cover_brief", "setting", "key_objects", "cast", "pages", "focus_word_examples", "tricky_words_used", "read_words", "questions", "alien_words"],
  additionalProperties: false,
};

// Story shapes. One is chosen per book so consecutive books cannot converge on
// the same plot — which is exactly what happened when the writer was given a
// single fixed beat sequence: five books running were "child makes a thing for
// a relative, spills it, cleans up, is praised" (Lynden 2026-07-26). The list
// was widened and the picker given short-term memory (see recentStoryShapes in
// db.mjs) after the SAME shape, "The swap", shipped two books running and both
// leant on a small pile of traded/collected objects as the plot engine —
// Lynden 2026-08-09: "all the stories ive been given...always based on a
// child finding 3 objects or something...RWI have a good range." The goal is
// RWI's breadth of story ENGINE, not just a different noun each time.
export const STORY_SHAPES = [
  { name: "The search", how: "Something is missing or has been mislaid and the hero looks for it. Each page is a place searched and a clue found or a wrong guess ruled out. It turns up somewhere ordinary but surprising — and often somewhere the reader could have spotted in an earlier picture." },
  { name: "The unwelcome weather", how: "The weather or the season wrecks the plan, and the child has to change what they were going to do. The story is the adjusting, not the sulking; the new plan ends up better than the old one." },
  { name: "Too small, too slow, not yet", how: "The hero cannot do the thing — they cannot reach, lift, keep up or stay awake. They find a way that uses what they actually have. Nobody simply hands them the solution." },
  { name: "The visitor", how: "Someone or something arrives — a guest, a new neighbour, a lost animal, a delivery — and the household reorganises around them. The hero's job is to welcome, and the story ends with the visitor settled or on their way." },
  { name: "The job to be done", how: "A real task with real steps, given to the hero and finished by them: feeding animals, stacking a stall, carrying water, sorting a delivery, taking something across town. The interest is in the doing and in getting it right." },
  { name: "The mistake put right", how: "The hero causes a problem — through haste, guessing, or not asking — and has to own it and fix it. The fixing costs them something, and the story ends with them telling the truth about it." },
  { name: "Sharing what will not go round", how: "There is not enough of something for everyone. The hero works out a fair way, and the fairness is the ending." },
  { name: "Noticing something nobody else has", how: "The hero spots a small thing everyone else walks past — a sound, a mark, an animal, a change — and follows it to something worth knowing. The story is curiosity rewarded." },
  { name: "The wait", how: "Something is coming and cannot be hurried: dough rising, a seed, a tide, a bus, a letter, an egg. The story is how the hero fills and endures the waiting, and the arrival is the last page." },
  { name: "Helping someone who needs it", how: "Another person's problem, not the hero's, and the hero notices and steps in. They give something up to do it. The thanks is not the point — the noticing is." },
  { name: "The swap", how: "The hero trades or exchanges things through the story, each swap changing what is possible, and ends up with what was actually needed all along. Use SPARINGLY — this shape has been overused; only pick it if nothing else fits, and keep it to ONE clean exchange, not a string of collected objects." },
  { name: "Getting there", how: "A journey on foot across a real place with real obstacles — a hill, a puddle, a crowd, a wrong turn — with something at the end worth the walk. The place is the co-star." },
  { name: "Learning the knack", how: "The hero cannot yet do a specific skill — whistle, swim a length, balance a bike, tie a knot, catch a ball — and tries, fails in a small realistic way, adjusts, and gets it by the end through practice, not a lucky break or someone else doing it for them." },
  { name: "The rescue", how: "A real, physical stuck-thing: an animal caught somewhere, a boat drifting, a kite snagged, a ball down a drain. The hero works out HOW to reach or free it using what is actually to hand — no magic tool appears from nowhere." },
  { name: "Follow the trail", how: "The hero follows a trail of something sensory — footprints, a smell, a sound, a line of feathers — through several real places to find where it leads. Each page is a fresh clue, not a repeat of the last one." },
  { name: "The build", how: "The hero constructs one real, functional thing across the book — a den, a kite, a raft, a cart, a bird table — in genuine physical stages, and tests it at the end. The test can half-fail and get fixed; it should not be effortless." },
  { name: "The mix-up", how: "A mix-up causes real confusion — two near-identical things swapped by accident, a wrong address, a wrong day — and the hero works out what actually happened by noticing a specific detail, not by luck." },
  { name: "Too much of it", how: "The opposite of a shortage: there is suddenly too much of something (rain, dough, deliveries, guests, washing) and the hero has to cope with the overflow. The fun is in the escalating problem and the practical fix, not a telling-off." },
  { name: "The race against time", how: "Something will happen if the hero is not quick enough — the tide will come in, the shop will shut, the ice will melt, the bus will leave — and every page raises the pressure a little. They make it (or find a good-enough alternative) through a real effort, not a shortcut." },
  { name: "The fair contest", how: "A real game or contest between the hero and a friend or sibling — a race, a competition, a challenge — where the story's interest is in how it is played (fairness, effort, a near-miss) rather than simply who wins." },
  { name: "First time alone", how: "The hero does an everyday thing unsupervised for the very first time — walking a short errand, minding a younger sibling, cooking one step of a meal — and the newness itself, handled a little nervously and then confidently, is the story." },
  { name: "The puzzle", how: "A concrete practical problem with no obvious answer — how to cross without getting wet, how to carry more than two hands allow, how to reach something too high — solved by the hero trying more than one real idea before the one that works." },
  { name: "Side by side", how: "Two people or two things are set up as a genuine contrast across the book — big and small, fast and slow, old and new, quiet and loud — each page showing the difference in action, building to a moment where the difference turns out to be exactly what was needed." },
];

export async function writeStory({ level, child, focusSound, pagesCount, greenWords = [], progression = null, pronunciations = [], shape = null, exemplars = [] }) {
  const system = `You are the senior story writer for MyPhonicsBooks, a British systematic synthetic phonics programme (Letters and Sounds based, NOT Read Write Inc). You write decodable stories for children aged 4-8 that celebrate the child's own culture and background. British English throughout (colour, mum, favourite).

THE STORY COMES FROM THE SOUND, NOT FROM A THEME. Start from the focus sound "${focusSound}": brainstorm the best decodable words it unlocks, pick the ones with the most story potential, and build the most engaging story THOSE words can tell. Do not force the story around the child's hobbies — that constrains it. The child's world appears in what we SEE, not in what the plot must be.

HARD PHONICS RULES:
- Every word must be decodable using ONLY these taught graphemes: ${JSON.stringify(level.cumulative)}
- ...OR be one of these allowed tricky words: ${JSON.stringify(level.trickyWords)}
- WORD BANK — the child's full unlocked vocabulary (this level + all levels before it). Draw from it freely; you may also build other words from the taught graphemes: ${JSON.stringify(greenWords)}
- The child's first name "${child.name}" is allowed as a proper noun (names are exempt).
${pronunciations.length > 1 ? `- "${focusSound}" HAS MORE THAN ONE SOUND: ${pronunciations.map((p) => `${p.sound} as in ${p.examples.slice(0, 2).join(", ")}`).join("; ")}. The book must show BOTH — choose your focus words so at least one uses each sound, so the child learns to try both and pick the one that makes a real word. Never teach only half of a grapheme. Only use a sound this level has actually unlocked — do not mix in a word from a sound not taught until a later level.
` : ""}- The FOCUS SOUND for this book is "${focusSound}". Use it in AT LEAST FOUR different words across the whole book, up to a maximum of six — four is the floor, not "one is fine". THE TITLE SHOULD CARRY THE FOCUS SOUND wherever it can do so naturally ("Hana Takes Her Turn" for "ur"), because the title is the first thing the child decodes. A book that lands on one or two focus-sound words has FAILED even if the rest of the story is good. Spread across the story naturally rather than crammed onto one page, but never fewer than three distinct words.
- If the perfect story word needs one sound from a level or two above, you may use it SPARINGLY (a word or two in the whole book) — the book automatically previews these as "Future Sounds". Never more than that.
- THE -ed PAST-TENSE SUFFIX (Lynden 2026-08-15): at Level 4 and above, -ed on verbs (slipped, pulled, hugged) is a deliberately TAUGHT EXCEPTION — the book's preparation page teaches its three pronunciations — so past-tense narration is allowed and normal, and -ed does NOT count against the sparingly-above-level allowance. Below Level 4, prefer wording that avoids -ed where a natural alternative exists.
- Do NOT use any other proper nouns unless fully decodable.
- THE TITLE OBEYS EVERY PHONICS RULE ON THIS PAGE. A book titled "Hana Gets the Knack" shipped with "kn" in the title, which is not taught at any level of this scheme - it broke the 100% decodable promise before the cover was even opened (2026-08-21). Every word of the title must be decodable at this level or on the tricky list.
${progression ? `
READING PROGRESSION — Level ${level.level} (${progression.name}). This is what makes a Level ${level.level} book a Level ${level.level} book. A book that is decodable but written like a lower level has FAILED:
- ${progression.sentences_per_page[0]}${progression.sentences_per_page[1] !== progression.sentences_per_page[0] ? `-${progression.sentences_per_page[1]}` : ""} sentence(s) per page, roughly ${progression.words_per_sentence[0]}-${progression.words_per_sentence[1]} words each.
- Punctuation available: ${progression.punctuation.join(", ")}. Do NOT use punctuation from above this level.
- Sentence forms available: ${progression.sentence_forms.join(", ")}.
${progression.devices_new.length ? `- Language devices taught at THIS level (show them off): ${progression.devices_new.join("; ")}.` : ""}
${progression.must_include.length ? `- This book MUST include: ${progression.must_include.map((m) => `(${m})`).join(" ")}` : ""}
- ${progression.note}
` : `- Sentence caps: Level ${level.level} stories use ${level.level <= 3 ? "1 short sentence" : level.level <= 5 ? "1-2 short sentences" : "2-3 sentences"} per page.`}

A DEVICE IS A CEILING AS WELL AS A FLOOR. "At least two time adverbials" does NOT mean one on every page — First, Next, Then, After that, Finally down the whole book reads like a worksheet, not a story. Use each device where the story genuinely calls for it and nowhere else, and never open more than two pages in the same way. The same applies to the focus sound: hitting a minimum is not the goal, sounding like a real book is.

MECHANICS — non-negotiable, they are what the child is being taught:
- EVERY sentence starts with a CAPITAL LETTER and ends with . ? or !
- Names and the pronoun I are always capitalised. A family word used AS a name is capitalised (Mum said, Nani smiled) but not after a determiner (her mum, his nani).
- ONE consistent tense across the whole book (past tense unless there is a reason not to).
${progression && !progression.punctuation.some((p) => p.includes("speech")) ? `- NO DIALOGUE AT THIS LEVEL. Speech marks are not taught until Level 6, so a character must not speak — not even without quotation marks. "Dad held up a brush. Will you fix it?" is unattributed speech and confuses a child who has not met speech marks. Tell the story in narration: "Dad held up a brush for Tomás to take."` : `- Dialogue is allowed at this level: punctuate it with speech marks and attribute it ("Stay with me!" said Mum).`}

${exemplars.length ? `REAL PUBLISHED MPB BOOKS AT THIS LEVEL — study these before writing. Match their register, their sentence rhythm, and above all their CONTINUITY LOAD (how little they ask the illustrator to keep identical between pages):
${exemplars.map((e) => `"${e.title}": ${e.pages.join(" | ")}`).join("\n")}

` : ""}KEEP THE ILLUSTRATOR'S JOB POSSIBLE — this is a picture book, and the pictures are drawn one page at a time:
- PREFER STORIES THAT MOVE. The published books above tend to travel through settings — a new scene or a new spot page to page — because a fresh backdrop only has to be right ONCE. A story that sits in one location while a single object slowly changes (dots accumulating on a card, a craft being assembled step by step) demands pixel-perfect object continuity across every page, which is the single hardest thing to illustrate consistently. Do not build the plot on it unless the story shape genuinely demands it.
- If an object DOES change across pages, give it ONE simple, boldly visible change (empty bowl → full bowl), never a precise accumulating layout (never "one more dot each page", "one more brick each page").
- The fewer recurring props the better: characters carry the continuity; scenery refreshes.

STORY RULES:
- LANGUAGE A CHILD ACTUALLY SPEAKS. Every sentence must sound like something a real 4-8 year old would say or a parent would say TO one — never literary, poetic or adult narration. "The wash ran up and up" (using "wash" as a noun for the tide, an idiom "up and up") is the kind of phrasing that fails this: a child does not talk like that. Prefer plain, concrete, everyday words and ordinary sentence shapes over anything that sounds like it was written to be admired rather than read aloud to a child. The published books above are the register to match. BRITISH VOCABULARY always: 'the washing' never 'the wash', 'trousers' never 'pants' as outerwear. Never join two clauses with a comma plus 'and' — write two short sentences instead. HONEST SOUNDS: a word only counts as decodable if saying its taught letter-sounds actually produces the word children say — 'wash' sounds out to rhyme with 'cash' but is said 'wosh'; 'basket' is said 'baskit'. Words like these are NOT decodable whatever the letters suggest: avoid them.
- POINTABLE BEATS (2026-08-20, the paper-boat lesson): every beat — the problem, the setback, the fix — must change something a child could POINT AT between two pictures: sunk vs floating, wet vs dry, empty vs full, here vs gone. A setback or fix whose before/after differs only subtly (a slight lean, patting something flatter, a small adjustment) is INVISIBLE at picture-book scale and must not be written, however physically true it is.
- THE STORY MUST TEACH THE REAL TECHNIQUE. When the plot turns on how something is physically done - skipping, catching, riding, whisking, planting - the advice a character gives and the hero's winning action must match how that skill is ACTUALLY taught to children. A skipping book had Mum say "wait for the tap on the ground, then jump", which cues the jump far too late; the recognised PE cue is to watch the rope come over your head and jump as it comes down (Lynden 2026-08-21). A hero who succeeds by following wrong advice teaches the wrong thing, however charming the pages are. If you are not sure how a skill is really taught, choose a simpler action you are sure of.
- ROPES, STRINGS AND CHAINS ARE ONE CONTINUOUS LINE. Any brief showing a rope held between two people must say so explicitly - one single strand from one hand to the other, never a closed oval or two strands - because the illustrator will otherwise draw a doubled loop that cannot exist. Say where the low point of the curve is (at her shins / under her feet / above her head) on EVERY page the rope appears, since that position is the whole mechanism.
- NO DECORATIVE MARKS ON THE GROUND. Never ask for shadow ovals, rings, spots or scattered props on grass or floor to 'fill' a frame - they read as debris and make the picture look machine-made.
- DRAWABLE, NOT INVENTED: the story's central mechanism must be a common, instantly recognisable childhood activity or object doing what it always does — something with a thousand photos. Never invent a new toy, contraption or novel combination of objects (a ring threaded on a string between two people is an invention; a kite, a ball, a bucket on a rope are not). When an everyday object has a traditional most-recognisable form, key_objects must name that form (a washing line is a rope stretched between two posts with wooden pegs — never a folding metal rack).
- Exactly ${pagesCount} pages.
- The hero is ${child.name}, age ${child.age ?? "5"}, from ${child.country || "the UK"}.
- The child's culture and home appear through what we SEE in the scenes (food, clothing, places, family life), guided by: ${child.cultureNotes || "everyday family life"}. Show culture with warmth and dignity — never stereotypes, never preachy text.
- THE FAMILY'S NOTES ARE SET DRESSING, NEVER PLOT. Nothing from the family's notes or the child's hobbies may become the story's obstacle, its solution, a plot-driving character or animal, or the reason anything happens. (A note saying the family loves feeding the harbour cats once turned into eight cats blocking the ferry gate as the story's obstacle — that is exactly the failure.) The plot comes from the story shape and the focus-sound words ALONE; the notes only colour what the pictures show around it.
- SAFE BEHAVIOUR IS NON-NEGOTIABLE. These books model behaviour for four-to-eight-year-olds. The hero must NEVER be shown doing a risky physical action alone — reaching into drains, holes or machines, using tools, anything near heat, deep water, traffic or heights. The child keeps the agency (they notice the problem, spot the solution, make the plan) and an adult shares the risky step in the same page's text and scene ("Amira had a think. She got Mum and the long hook."). A parent reading aloud must never flinch.
- A QUIET MORAL. The best of these books leave a small lesson a parent would want — effort pays off, patience, honesty, kindness, fairness, gratitude: Islamic values lived in everyday action. Let the events carry it (the stool book: she frees the stuck stool herself through effort and earns the view) — never state it in the text, never preach.
- Emotional journey + Dear Zoo-style hooks: curiosity gaps, repetition with variation, a satisfying ending.
- A PREMISE IS NOT A PLOT. Before writing a single page, fill in the "premise" (the story's fixed identity: character, setting, goal, object, problem, cultural context, one-sentence premise) and then the "story_plan" — SIX BEATS the finished pages must actually deliver:
  1. GOAL — what the character wants, and why it matters to them.
  2. PROBLEM — what prevents them from getting it.
  3. FIRST ATTEMPT — what they try.
  4. SETBACK — why that attempt does not work, or how the problem gets harder. The setback does not need to be dramatic or upsetting: it can cost the character time, create disappointment, damage something slightly, require asking for cooperation, or force them to change their plan. But it must be REAL — a story where the first attempt simply works has no middle.
  5. PLAN AND ACTION — what the character notices, decides or does differently.
  6. EARNED RESOLUTION — how their own action produces the ending, and how they feel.
  The pages then TELL that plan. A situation corrected in one glance — a mix-up spotted and swapped back, a lost thing found by simply looking, a task done without obstacle — is a phonics exercise wearing a story's clothes, and it FAILS ("The Chip on Top", rejected 2026-08-13; "Yusuf and the Star Tin", rejected 2026-08-14: "the problem is stated quickly, then solved by simply finding the tin again"). Tension does not need danger — it needs something the child wants that might not happen. Where the level's word bank is too small to SAY the depth, carry it through what happens and through the "scene" briefs — emotion and effort can live in the pictures while the text stays simple and decodable.
- NARRATION, NOT INSTRUCTIONS. "Yusuf can check the top" reads like a worksheet telling the reader what is possible; "Yusuf checks the top" is a story telling what happens. Never use "can/could + verb" for an action the hero actually performs. Every sentence continues the story from the last one — a reader should never wonder "which box? from where? why?" because the sentence names things the story has not introduced.
- THE PROSE MOVES THE READER BETWEEN PLACES. If the pictures change location (quay to ferry deck, street to kitchen), a sentence must make the move ("Mum and Yusuf get on the big ferry") — characters must never simply BE in the new place on the next page while the words say nothing.
- For each page also write "scene": a rich one-sentence illustration brief (what we see, setting, action, mood). Scenes must be visually specific and culturally accurate.

STORY SHAPE — ${shape ? `THIS book must use this shape: **${shape.name}** — ${shape.how}` : "choose a shape that suits the sound"}.
STAY ON THE SHAPE'S OWN THROUGHLINE. Do not bolt on an unrelated detour that the shape's own description does not call for (e.g. a race-against-time story is about the hero's own effort against the clock — stopping mid-race to solve a completely separate problem, like freeing a trapped animal, is a second story wearing the first one's clothes, not "a real effort"). If the shape's own tension needs raising, raise THAT tension — do not invent a new one.
DO NOT WRITE THE DEFAULT BOOK. There is one story these books fall into every single time, and it is now forbidden unless the shape above actually is it: *child decides to make something for a grown-up → assembles ingredients → spills or drops it → wipes it up → finishes it → gives it to the grown-up, who praises them.* If your draft is that story, throw it away and write a different one.
- The hero does NOT have to make or cook anything. Most children's stories are not about manufacturing an object.
- The problem does NOT have to be a spill, a drop or a breakage. Weather, a wrong guess, someone else's need, a shortage, a misunderstanding, being too small, running out of time, an animal, a lost thing, a queue, a change of plan — all better than another spill.
- The ending does NOT have to be handing the thing to an adult and being praised. A child can end by understanding something, deciding something, helping someone, being surprised, or simply enjoying what they made happen.
- The adults do not have to solve it, and the hero does not have to be perfect.
- A SECOND FORBIDDEN DEFAULT: the hero collecting, trading, or gathering a small string of objects one after another (three ingredients, three swapped items, three things found). This has become just as repetitive as the spill-and-praise story — it happens because it is the easiest shape to write, not because it is the best one for THIS book. Prefer a story engine driven by a skill, a physical obstacle, a contest, a rescue, a puzzle, a mix-up, or time pressure — something happening TO the hero or something the hero must work out, not a shopping list they tick off.

BEAT COVERAGE — the pictures must be able to TELL the story on their own:
- EVERY OBSTACLE POSED MUST BE OVERCOME ON THE PAGE, BY THE HERO. If a page shows or asks about a problem ("Can Yusuf get to it?"), a later page must SHOW the hero getting past that specific problem through their own visible effort or idea — never a detour that quietly forgets it, never a cut to the goal already reached. A book that posed cats blocking a gate and then simply arrived at the dock has FAILED: the reader is owed the page where the hero gets past the cats. The stool book is the model — stool stuck, she digs and rocks it free, she sees over the wall: setup, effort, earned result.
- Whatever shape you use, the MIDDLE of the book must show real events happening, not a jump from "starting" to "finished". If something is made, built, searched for, fixed, grown or learned, at least one page shows that process physically happening. A reader must never have to imagine an event that happened between two pages.
- Something must CHANGE between the first page and the last — a thing, a situation, or what the child understands. Name what it is before you start.
- Anything that CHANGES must change on the page, in order: an unbaked mixture cannot appear as a finished decorated cake without the page that transforms it, and once decorated it keeps the SAME decoration to the end of the book.
- PROP AGREEMENT — every physical object you name in a page's "text" must also appear in that page's "scene". Do not mention a tool, food or toy in the text unless the illustration shows it.
- SAY WHERE THE WORK IS HAPPENING, AND KEEP IT THERE. Name the surface exactly and the same way every time: "the kitchen table", "the worktop", "the floor". Never use a word that could be either — "a mat" is the worst offender, because a mat can be on the floor OR on a table, and the illustrator will pick a different one each page. If a mat is in the story, say "the mat on the floor" or "the table mat", every time.
- WORK STAYS ON ONE SURFACE. If the child is working at the table, they are at the table on the next page too. If they are on the floor, they stay on the floor. The work only moves between the floor and a table if a sentence actually moves it ("Cerys carried the bowl to the table") — otherwise the reader sees a child kneeling on the floor on one page and standing at a worktop on the next, and the two pages stop being the same afternoon.
- CAUSES MUST BE ESTABLISHED. Whatever makes things go wrong has to be something the reader already knows about — shown in an earlier picture, or named in an earlier sentence. Never introduce a new prop or condition in the same breath as the accident it causes: "the chair cracked on the wet step" is a cheat if no wet step was ever mentioned or drawn. Either plant it earlier (a page where the step is being washed, or rain in the window) or let the mishap come from something already in the story — the thing being too heavy, a hand slipping, a leg already known to be split. A five-year-old should be able to say WHY it went wrong.
- ARRIVALS MUST STILL BE ARRIVALS. If someone arrives partway through, they must not be in the story before then, in the words or the pictures. Do not have the whole family standing together on page 1 and then "arrive" on page 6.

HOUSE VALUES — the story must not contradict Islamic values, in what happens or in what the pictures will have to show:
- Food is halal: no pork, bacon, ham or pig, and no alcohol anywhere in the story or its settings (no wine with a meal, no bottles on a shelf, no bar or pub).
- No gambling or betting; no Halloween, Christmas or Easter; no idols, statues for worship, or the devotional practices of other faiths.
- No romance, dating or physical affection between adults who are not family. Warmth between parents, grandparents, siblings and friends is the heart of these books.
- Nothing that makes disobedience to parents, dishonesty or cruelty look clever or rewarded — the child may make mistakes, but the story's sympathy sits with putting them right.
- Muslim family life is welcome and normal when it fits the child's world: a mosque, a prayer mat, a hijab, Ramadan, Eid, saying bismillah before eating.
- Every culture on earth is welcome — celebrate the child's country through its landscape, food, crafts, language, games, animals and family life.
- NO TALKING ANIMALS. Animals in these books are real animals: they do not speak, wear clothes, keep house or behave like people. A cat may be a much-loved cat and be central to the story; it may not have a conversation. Dogs are fine — many cultures keep them — and so is any real creature behaving as itself.
- NOTHING SUPERNATURAL, and NO WISHES COMING TRUE. No magic, spells, fairies, genies, lucky charms, talking toys or objects that move by themselves, and no wish or hope that is granted by anything other than effort. When the child wants something, they get it by working for it, thinking it through, or being helped by their family — never because they wished. (This is also what makes the story teach something.)
- TRY TO AVOID MUSIC. Where the story could just as well be about cooking, building, mending, growing, drawing, sport or helping, choose that instead of making or playing an instrument or a singing performance. Not forbidden, but do not reach for it.
- CELEBRATIONS — in general, do not build the story around a celebration at all.
  NEVER: birthdays (cake with candles, party hats, presents), Christmas, Easter, Halloween, Valentine's.
  AVOID RELIGIOUS FESTIVALS GENERALLY, of ANY faith — including Islamic ones. Do not make Eid or Ramadan the occasion of the story unless the family's own notes specifically ask for it. These are reading books, not festival books, and the everyday is where they work best.
  If an occasion genuinely helps the story, prefer a non-religious one from the child's own culture: a harvest or rice festival, a national or independence day, a kite or lantern festival, a new baby, a family wedding, the end of the school year, a market day.
  Best of all, no occasion: guests arriving, a grandparent visiting, the first day of term, helping a neighbour, mending something, cooking together.
  (Ordinary religious life is NOT a celebration and remains perfectly welcome in the background of any story: a hijab, a prayer mat, a mosque along the street, saying bismillah before eating.)

WORLD CONSISTENCY (for the illustrator — this is as important as the story):
- "setting": place = where the whole story happens; architecture = 3-5 concrete DRAWABLE features (building materials, roof shapes, walls, floors, street furniture — never just a nationality); season; weather. These stay IDENTICAL across every page unless the story itself changes them.
- Keep the story in 1-3 physical locations maximum. Give every page a "location": a short lowercase id like "kitchen" or "garden". Reuse the SAME id whenever the action happens in the same place — consecutive pages in one spot are good storytelling.
- "key_objects": up to 3 recurring objects, each with "look" = one exact visual description (colour, material, size, distinguishing marks) that will be repeated verbatim in every illustration prompt where it appears.
- A PLOT-CRITICAL MARK GETS AN EXACT SHAPE AND AN EXACT PLACE. If the story's mechanism depends on telling two similar objects apart, or on recognising one specific feature (a chip, a crack, a patch, a label), that feature's "look" must pin BOTH its shape AND its fixed location — "a small crescent-shaped piece missing from the upper-right corner of the lid", never just "a chip on top". A vague mark gets drawn differently on every page and the story's own logic becomes invisible. And the two similar objects must differ by exactly that one named feature — same colour, same size, same everything else — so the feature is the ONLY tell, and it must be a feature big and bold enough for a four-year-old to spot in a small printed picture. Describe ONLY the object's appearance — never where it sits or what it is doing ("a small silver metal teapot", NOT "a teapot simmering on the stove"): the description is reused on other pages, and placement written into it gets drawn in places it does not belong.
- "cast": EVERY named or recurring person in the story who is not ${child.name} — mum, dad, a friend, a shopkeeper. Maximum 3, and only people who actually appear. "id" = short lowercase id used on the pages ("mum", "dad"). EACH CAST MEMBER MUST BE SOMEBODY, NOT A CATEGORY: give them a name or a relationship a child would actually say — Mum, Dad, Nana, Auntie, Sam — and use THAT in the story text. Never let a story sentence call a person "the woman", "the man" or "the kids"; that is a label, not a character, and it reads as though the writer never decided who they were. Each cast member is ONE person (if a group appears, they are background, not cast). "who" = their role in one phrase; "appearance" = a FIXED, drawable description that will be repeated in every illustration they appear in: approximate age, build, hair, and the exact clothing they wear for the WHOLE book including colours ("a woman in her thirties, warm brown skin, a sage-green abaya with gold trim and a cream headscarf"). They wear the same outfit on every page — a character does not change clothes mid-story. Culturally accurate for ${child.country || "the UK"}, with the same warmth and dignity as the hero.
- THE PROFILE-PAGE LANDMARK IS NOT A PLACE OF WORSHIP. When a wonder from the child's country is chosen for the "Meet the Star" page it must be a secular landmark — a mountain, bridge, castle, river, tower, market, forest, harbour, railway, national park. Never an active religious site of another faith (a Kyoto book chose the Fushimi Inari torii gates, a working Shinto shrine, 2026-08-21). A mosque is welcome; other faiths' shrines, temples, churches and cathedrals are not.
- "cover_brief": one sentence describing the COVER illustration — the hero in the single most joyful, most tempting moment of THIS story, with the story's central object clearly in shot, in the story's own setting. It must be a real moment from this book (usually the triumph), never the child's hobbies or a generic pose.

ALSO RETURN (for the practice pages of the printed book):
- "read_words": EXACTLY 6 decodable practice words drawn from words that actually appear in this story's text, each fully decodable at this level. HONEST SOUNDS ONLY: the Story Words page prints these under "sound out each phoneme, then blend", so a word only qualifies if saying its taught letter-sounds actually produces the spoken word. "listened" (silent t, schwa e), "wash" (said "wosh"), "basket" (said "baskit") and anything with a silent letter are BANNED here however ordinary they look. EXACTLY 2 of the 6 must contain "${focusSound}" using a sound this level has taught (two of the focus words required above); the other 4 are other decodable words from the story that are worth a child's practice at this level — widen the vocabulary rather than repeating the focus sound again. Never return a list where only one word contains the focus sound.
- "questions": exactly 3 short comprehension questions about THIS story, phrased for a grown-up to ask a 4-8 year old.
- "alien_words": exactly 4 made-up nonsense words (not real words) that are fully decodable at this level and each contain "${focusSound}".`;

  const content = `Write the ${pagesCount}-page decodable story now. Focus sound: "${focusSound}". Remember: every word decodable at Level ${level.level} or in the tricky list, focus sound in at least 3 (up to 3) distinct words, read_words exactly 6 words with exactly 2 containing the focus sound and 4 other level-worthy story words, and every sentence in words and phrasing an actual young child would say aloud — not literary or adult narration.`;
  return callJson({ system, content, schema: STORY_SCHEMA });
}

const REVIEW_SCHEMA = {
  type: "object",
  properties: {
    ok: { type: "boolean" },
    violations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          word: { type: "string" },
          page: { type: "integer" },
          reason: { type: "string" },
        },
        required: ["word", "page", "reason"],
        additionalProperties: false,
      },
    },
    focus_sound_count: { type: "integer" },
  },
  required: ["ok", "violations", "focus_sound_count"],
  additionalProperties: false,
};

export async function reviewStory({ level, story, focusSound, childName }) {
  const system = `You are the phonics QA gate for MyPhonicsBooks. You verify decodability.

A word PASSES if ANY of these is true:
- it can be fully segmented into these taught graphemes: ${JSON.stringify(level.cumulative)}
- it appears in this tricky-word list: ${JSON.stringify(level.trickyWords)}
- it is the child's name "${childName}"
Punctuation and capitalisation are ignored.

HOW TO CHECK — segment before you judge, one word at a time. Walk the word left to right taking the LONGEST taught grapheme that matches at each position ("scrumptious" = s·c·r·u·m·p·tious when "tious" is taught; "nutritious" = n·u·t·r·i·tious). A word is only a violation if you reach a position where NO taught grapheme matches. Never report a word as a violation because it looks long, looks advanced, or is a word you would not expect a young child to read — those are not the test. The book's own focus grapheme "${focusSound}" is taught at this level, so words built from it pass.

Report only genuine violations, with the position that failed as the reason.`;
  const content = `Check this story. Also count how many distinct words contain the focus grapheme "${focusSound}".\n\n${JSON.stringify(story.pages.map((p, i) => ({ page: i + 1, text: p.text })))}`;
  return callJson({ system, content, schema: REVIEW_SCHEMA, tier: "phonics" });
}

export async function rewriteStory({ level, child, focusSound, pagesCount, story, violations }) {
  const system = `You are the senior story writer for MyPhonicsBooks fixing decodability violations. Keep the same title, plot and scenes wherever possible — change only what is needed to remove the violations. Allowed graphemes: ${JSON.stringify(level.cumulative)}. Allowed tricky words: ${JSON.stringify(level.trickyWords)}. The name "${child.name}" is allowed. Focus sound "${focusSound}" should still appear in AT LEAST 3 distinct words (up to 3 - not fewer). British English. Exactly ${pagesCount} pages.

THE BOOK MUST STILL READ LIKE A BOOK. Removing a violation is never a licence to damage the prose: every sentence starts with a CAPITAL LETTER, proper nouns stay capitalised, and the whole story stays in ONE consistent tense (past tense unless the original was written in present). Do not drop articles, mangle word order, or leave telegraphic fragments to dodge a word — rewrite the sentence properly instead. If a violation cannot be removed without wrecking the sentence, rephrase the whole page.`;
  const content = `Original story:\n${JSON.stringify(story)}\n\nViolations to fix:\n${JSON.stringify(violations)}\n\nReturn the corrected story.`;
  return callJson({ system, content, schema: STORY_SCHEMA });
}

// The gate every other QA in this file skips: does the STORY ITSELF make
// physical/logical sense, before a single image is generated? Built after
// "The Thick Pen" shipped "The bag had a gap. The cap fell into sand." then
// "The thick pen fit the gap" — a rigid cap cannot fall through a hole a
// THIN PEN later plugs; either the hole is cap-sized (too big for the pen to
// block) or pen-sized (too small for the cap to have passed through). No
// existing gate could ever catch this: decodability only checks words are
// legal, prose QA only checks mechanics, and the image-consistency QA (see
// sceneConsistencyQA) only checks that a picture matches ITS OWN page's
// text — it has no way to know the text's premise is self-contradictory,
// and in fact the illustrator quietly drew something sensible instead
// (sand trickling from the hole, cap already on the ground) while the text
// kept claiming the impossible version. Lynden 2026-08-10: "how does a cap
// fall through a whole in the bag that a pen can fill?"
const PLAUSIBILITY_SCHEMA = {
  type: "object",
  properties: {
    causal_chain: { type: "string", description: "Walk the story page by page: what physically changes on each page, and does it follow from the page before using real-world size, weight and mechanism logic? Describe this BEFORE judging." },
    dual_role_objects: { type: "string", description: "List every object that plays a physical role — passing through, blocking, fitting into, carrying, holding — on MORE THAN ONE page. For EACH one, state its implied size on every occasion it plays that role, in one line per occasion (e.g. 'gap: page 5 must be big enough for a rigid cap to pass through; page 6 must be small enough for a thin pen to block it'). Then say explicitly whether those occasions describe ONE consistent size, or whether the object would need to be two incompatible sizes at once. If there are no such objects, say so." },
    // Built after a Level 4 search story ("Amina and the Book") wrote every
    // pre-reveal page's `scene` field with the missing book already visible
    // in the bag — "peeks from the bag", "a tiny corner is just visible",
    // "still tucked low in the bag" — on pages 1-6, even though the plot is
    // Amina searching for it and it is only found on page 7. dual_role_objects
    // catches incompatible SIZES; nothing caught an object whose STORY STATE
    // (hidden vs found; unmade vs finished; arrived vs not-yet-arrived)
    // contradicts itself across pages until this field was added
    // (Lynden 2026-08-11: "the book is visible as a mini book before the book
    // should be revealed"). This must be checked on the `scene` text (the
    // actual image brief), not just the reader-facing `text` — the reader's
    // sentence can honestly say "no book was on the rug" while the `scene`
    // field describing that same page still shows the book peeking out.
    concealed_objects: {
      type: "string",
      description: "Name every object the plot treats as MISSING, HIDDEN, LOST, NOT YET MADE, or NOT YET ARRIVED until a specific page (a search story's missing item; something the hero is making; a character who arrives partway through). For each one, state the page it is first revealed/found/completed/arrives on. Then, for EVERY page BEFORE that reveal page, quote whether that page's `scene` field (the illustration brief, not just the reader's sentence) describes the object as visible, glimpsed, peeking, or otherwise present — even faintly, even in the background, even only partly. If ANY pre-reveal page's scene field shows it, name the page and quote the exact phrase. If there are no such objects, say so explicitly."
    },
    issues: {
      type: "array",
      items: {
        type: "object",
        properties: {
          page: { type: "integer" },
          problem: { type: "string", description: "The specific physical or logical contradiction, and why a sharp adult reader would object to it." },
        },
        required: ["page", "problem"],
        additionalProperties: false,
      },
    },
    pass: { type: "boolean" },
  },
  required: ["causal_chain", "dual_role_objects", "concealed_objects", "issues", "pass"],
  additionalProperties: false,
};

export async function reviewStoryPlausibility({ story }) {
  const system =
    "You are the physical and logical plausibility QA gate for MyPhonicsBooks — checked on the WORDS ALONE, before any illustration exists. " +
    "Describe the causal chain first, page by page, THEN the dual_role_objects size comparison, THEN concealed_objects, THEN judge — a bare pass/fail rubber-stamps everything, the same lesson learned the hard way on every other QA gate in this pipeline. Do not hedge with 'plausible if X' or 'this could work if Y' — commit to a real-world size for the object and check it against BOTH occasions; if a single consistent size cannot satisfy every occasion, that is a fail, not a maybe. " +
    "pass is FALSE if: dual_role_objects finds an object that would need two incompatible sizes to make the story true (check this exhaustively first); concealed_objects finds any page BEFORE an object's reveal/find/completion/arrival page whose `scene` field shows that object even partly (a search story whose bag secretly already shows the missing item defeats its own plot — this is just as much a fail as a size contradiction); a fix, tool or event's scale does not match the scale of the problem it solves; a cause is claimed for an effect that could not actually produce it; an obstacle or question the story poses is never RESOLVED ON THE PAGE (if a page establishes something blocking the hero — cats across a gate, a locked door, a flooded path — a later page must show how the hero actually got past THAT thing; a story that poses 'Can Yusuf get to the dock?' behind a wall of cats and then simply shows him at the dock has skipped its own answer, and that is a fail even though nothing is physically impossible); or a sequence of events a sensible adult would find genuinely self-contradictory, even allowing for the usual warmth and simplicity of a picture book. " +
    "APERTURES AND PASSAGES: whenever the story moves an object INTO or OUT OF a container, gap, opening or barrier (a drain, a letterbox, a jar, a fence, a grate), commit to real-world sizes for BOTH the object and the opening and check the passage both ways — a toy train is far wider than the slots of a standard drain grate, so 'the train ran into the drain' needs a named wider opening (a broken corner, an uncovered section, a gap beside the grate), and the SAME opening must serve the retrieval. If the scene briefs draw a barrier the object cannot pass, that is a fail; the fix is to name the opening explicitly in both text-or-scene so the illustrator draws it (2026-08-15, 'The Train in the Drain'). " +
    "ADULT PRESENCE FOR RISKY ACTIONS: these books model behaviour for four-to-eight-year-olds. If the hero performs a risky physical action — reaching into a drain, hole or machine, using a tool, anything near heat, deep water, traffic or heights — an adult must be present and part of that action in the SAME page's text or scene. The child keeps the agency (they notice, plan and decide); the adult shares the doing. A five-year-old putting her hand into a public drain alone is a fail even though it is physically possible. " +
    "Do NOT flag ordinary picture-book compression, coincidence, or the everyday things a child protagonist is allowed to do well (finding something, succeeding at a task, an adult being kind) — this is not a check for total realism, only for claims that are actually impossible or self-contradictory on their own terms. Report only genuine issues. " +
    "Every genuine problem found in dual_role_objects or concealed_objects MUST ALSO appear as its own entry in `issues` (page + problem) — the fields above are your working notes, `issues` is what actually drives the rewrite, and a problem left only in the notes never gets fixed.";
  const content = `Check this story's physical and logical plausibility. Each page includes both the reader's sentence (text) and the illustration brief (scene) — a concealed object's contradiction usually lives in scene, not text:\n\n${JSON.stringify(story.pages.map((p, i) => ({ page: i + 1, text: p.text, scene: p.scene })))}`;
  // Judged by a DIFFERENT vendor than the writer whenever possible — and by
  // preference the CHEAP one (Lynden 2026-08-17). This gate is mechanical
  // (sizes, apertures, ownership, contradictions) rather than literary, so it
  // is the half of judging that can afford Gemini: measured $0.035 vs $0.067
  // on the bench, and roughly $0.26 -> ~$0.13 on a real book. The cold editor
  // keeps Claude, where the literary read is worth the money. Falls back to
  // the normal judge order when Vertex is unavailable (i.e. in prod).
  return callJson({ system, content, schema: PLAUSIBILITY_SCHEMA, judge: "vertex" });
}

export async function fixStoryPlausibility({ level, child, focusSound, pagesCount, story, issues }) {
  const system = `You are the senior story writer for MyPhonicsBooks fixing physical/logical plausibility issues. Keep the same title, characters and setting wherever possible — change only what is needed to make the flagged events make real-world sense. Allowed graphemes: ${JSON.stringify(level.cumulative)}. Allowed tricky words: ${JSON.stringify(level.trickyWords)}. The name "${child.name}" is allowed. Focus sound "${focusSound}" should still appear in AT LEAST 3 distinct words (up to 3 - not fewer). British English. Exactly ${pagesCount} pages.

Fix the underlying MECHANISM, not just the wording — if an object's size or a fix's scale doesn't match the problem, change what actually happens on that page so cause and effect genuinely line up. For a concealed-object issue (an object shown too early in a page's \`scene\` field), rewrite that page's \`scene\` field so the object stays genuinely out of view until its reveal page — not just reworded to sound more hidden while still describing it as visible. Keep every other page's text, scenes and props untouched unless the fix requires a small knock-on change (e.g. a later page referring to the now-changed event). Every sentence still starts with a CAPITAL LETTER and the whole story stays in ONE consistent tense.`;
  const content = `Original story:\n${JSON.stringify(story)}\n\nPlausibility issues to fix:\n${JSON.stringify(issues)}\n\nReturn the corrected story.`;
  return callJson({ system, content, schema: STORY_SCHEMA });
}

const DIRECT_SCHEMA = {
  type: "object",
  properties: {
    pages: {
      type: "array",
      items: {
        type: "object",
        properties: {
          page: { type: "integer" },
          emotion: { type: "string" },
          staging: { type: "string" },
          brief: { type: "string" },
          camera: { type: "string", enum: ["wide", "closeup", "new-angle", "same-view"] },
          // Which key objects are ACTUALLY visible on this page, and what
          // state each is in right now. Replaces string-matching the object
          // list against the page text — that matched "date balls" against a
          // page that merely mentioned "dates", and the finished balls got
          // drawn three pages before they existed.
          objects: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                state: { type: "string" },
              },
              required: ["name", "state"],
              additionalProperties: false,
            },
          },
          // Cast ids visible on this page. Each one's character sheet is
          // injected into the prompt as a reference, so they look the same
          // every time they appear.
          cast_present: { type: "array", items: { type: "string" } },
          // OWNERSHIP / NEGATIVE-STATE ASSERTIONS (Lynden 2026-08-15, after
          // "no fig was left for Idris" shipped as a picture of Idris beside
          // three unallocated figs): object PRESENCE is not enough — the QA
          // verifies each of these against the finished image. Convert every
          // textual absence into POSITIVE visible evidence (empty hands, an
          // empty spot, the others visibly holding theirs).
          required_visible_states: {
            type: "array",
            items: {
              type: "object",
              properties: {
                object: { type: "string" },
                assertion: { type: "string", description: "What the image must CLEARLY show about this object: who holds/owns it, its count, its location, or the positive evidence of an absence (e.g. 'each of the three figs sits directly in front of Mum, Dad or Grandad — visibly THEIRS' / 'the space in front of Idris is visibly empty, his hands empty')." },
              },
              required: ["object", "assertion"],
              additionalProperties: false,
            },
          },
          forbidden_visible_states: {
            type: "array",
            items: {
              type: "object",
              properties: {
                object: { type: "string" },
                assertion: { type: "string", description: "What the image must NOT show because it would reverse the text's meaning (e.g. 'a fig held by Idris or sitting unallocated directly in front of him')." },
              },
              required: ["object", "assertion"],
              additionalProperties: false,
            },
          },
        },
        required: ["page", "emotion", "staging", "brief", "camera", "objects", "cast_present", "required_visible_states", "forbidden_visible_states"],
        additionalProperties: false,
      },
    },
  },
  required: ["pages"],
  additionalProperties: false,
};

// The illustration-director pass (mirrors the printed pipeline's step 3):
// walk the story AS THE CHARACTER before a single image prompt is written,
// so objects sit where they'd really be and every scene makes diegetic sense.
export async function directScenes({ story, child }) {
  const system = `You are the Illustration Director for MyPhonicsBooks. Before any images are generated, you walk through the story IN THE CHARACTER'S SHOES, page by page, and rewrite each illustration brief so the scene makes real-world sense.

For every page, reason through:
1. PURPOSE — what is this moment for in the story? What should the reader feel?
2. THE CHARACTER — what does ${child.name} see, do and feel right now? Their body language and expression must show it.
3. OBJECT LOGIC — where would each object PHYSICALLY be for this scene to make sense? A decorative shell lives on a shop shelf, not in a dinner dish. A dish someone is buying fish for stays at home (or in a bag) until it is used. Food sits on a counter or in ice, money passes hand to hand.
4. CONTINUITY OF MOTION — an object stays exactly where it was on the previous page unless someone moved it in the story; if it moved, the scene should show or imply who moved it. Same for people: if nobody left the room, they are still there.
4a. WHERE IS THE WORK HAPPENING? Every brief must state the surface the action sits on — the table, the worktop, the floor, the step, the mat ON THE FLOOR, the mat ON THE TABLE — never an unqualified "mat", which the illustrator will read as a floor mat on one page and a table mat on the next. Then KEEP IT: the surface on this page is the surface from the previous page unless the story text moved it. A child kneeling on the floor with a bowl, then standing at a worktop with the same bowl, is two different afternoons. If the story does move the work, the brief must show the moving.
4b. OBJECT STATE OVER TIME — objects CHANGE as the story progresses and must appear in the state they are in ON THIS PAGE, never their final state early: paper is BLANK until the character paints it (the finished picture exists only from the page it is completed), food disappears as it is eaten, a wrapped present stays wrapped until opened. State each such object's current state explicitly in the brief.
5. CAMERA — direct like a real picture book, and use the camera to PROTECT consistency:
   - "wide" for the FIRST page in a location (establishing shot).
   - For later pages in the same location, PREFER "closeup" or "new-angle": zoom in on the object or a hand, zoom out, over-the-shoulder, through-the-window, low angle, or a DIFFERENT CORNER of the same location. Zoom-ins/outs, changed angles and different spots within the setting show little repeated background, so nothing can contradict the established view — this is the safest and most cinematic choice. (E.g. the moment a picture is finished = a zoom-in on the paper itself.)
   - Choose "same-view" ONLY when the storytelling genuinely needs the identical frame repeated (a before/after beat). Then NOTHING in the background may change or be added.
   - NEVER re-show a wide view of a location with different geography than before (if a window view showed bushes, a path cannot appear there later). If you can't guarantee it matches, go closer instead.
   - Every page after the first in a location is drawn WITH the establishing image in front of the illustrator as a hard reference, so the room itself is already guaranteed. Your camera choice only decides how close we stand.
   - A CLOSEUP MUST BE WRITTEN AS A CROP, or it will be drawn as another mid-shot and the whole book ends up at one distance. Say what fills the frame and what is cut off by its edges: "her face and the bowl fill the frame, the counter runs out of shot on both sides", "we are down at table height, the glasses tower in the foreground". If your brief could be drawn as a whole person standing in a room, it is not a closeup — rewrite it.
   - Across the book the camera must genuinely MOVE: at most two wide shots in the whole book, and at least two pages where we are close enough that the room is mostly out of frame. Eight pictures taken from the same distance is the commonest way these books look cheap.
   - A CLOSEUP IS OF THE CHILD DOING THE THING, never of the thing alone. Always keep ${child.name}'s face and shoulders in the frame, watching what their hands are doing ("close on ${child.name} from the chest up, her face lit with concentration as she tips the fruit into the jug"). NEVER write a brief whose subject is only hands, only an object, or "a hand reaches in" — an arm entering the picture with no body attached looks like a mistake in a picture book. The child is the star of every page they are on.
5a. DESTINATION DISCIPLINE — if the story is a journey toward somewhere, the destination appears AT MOST twice: optionally as a small distant glimpse in the opening establishing shot (far below, across the water — clearly not yet reached), and then NOT AGAIN until the arrival page, where reaching it is the payoff. Every mid-journey page frames the route and its obstacle — the lane, the hill, the mud, the crowd — with the destination out of frame. A book where the dock is visible in every picture reads as though the hero was standing next to it all along, and the arrival means nothing.
6. ONE ROOM PER FRAME — a brief must only describe what exists INSIDE this page's location. NEVER say another room is "visible behind", "adjoining" or "in the background" — the illustrator will invent furniture (counters, shelves) that was never there and break the established view. If the character came from another room, show it through their action alone (carrying something, walking in), never through the background. Never introduce furniture into a location that its earlier pages did not have, and mention each object at most once per brief.
7. PROP AGREEMENT — every physical object named in the page TEXT must appear in the brief for that page (if the text says she got a wooden spoon, the spoon is in the picture). Conversely, do not stage an object the story has not brought into the scene.
   NUMBERS MUST MATCH. If the text says six holes, draw six; if it says "the kids came", draw more than one child; if it says a nail, the nail is visible. A child counts what is in the picture, and a picture that disagrees with the words teaches them not to trust it.
8. CREATURE EYES — if a small creature (snail, insect, bird) appears, its eyes are minuscule black dots proportional to its size (a snail's eyes sit at the tips of its stalks); say so in the brief so no oversized black blob lands on its face.
8a. THE STORY'S TELL MUST BE IN SHOT. If the plot turns on a distinguishing feature (a chip on one lid, a patch on one bag, a crack in one pot), then on EVERY page where that object appears the brief states the feature's exact shape and its exact fixed location, angled toward the camera — never hidden by a hand, the tilt, or the crop. On any page where the two similar objects appear together, the brief must stage them so a child who cannot read can point at which is which. On the page where the character USES the feature to decide, the brief shows them looking at or touching that exact spot.

9. OBJECTS ON THIS PAGE — fill "objects" with every physical thing a reader would actually SEE in this frame that the continuity of the book depends on, each with the state it is in ON THIS PAGE ("bowl — empty, waiting on the mat"; "date balls — do not draw, they do not exist yet, the mix is still wet paste"). Leave the list EMPTY if none are visible.
   THE REGISTER IS DYNAMIC — AN OBJECT JOINS IT THE MOMENT IT MATTERS. Not just the declared key objects: the instant the story makes something load-bearing (the mat the lost card hides under, the bench the hero climbs, the pot that gets knocked), it becomes a tracked object. Give it ONE full fixed description in its FIRST appearance's state ("a rectangular woven mat, red and cream diamond pattern, plain red border, short cream tassels along both short edges") and then list it on EVERY later page it is visible, described the SAME way, with only its state changing. An object described loosely once and re-imagined per page is how a mat changed its pattern, border and tassels across three consecutive pages of a real book (2026-08-14).
   ATTACHED PARTS MOVE WITH THEIR OBJECT. Tassels, fringes, straps, lids-on-hinges, handles belong to the object: when an edge of the mat is lifted, the tassels on that edge rise WITH it — never left lying flat on the ground while the mat curls up without them. When something is lifted, folded or moved, state in the brief which exact part moves, what moves with it, and what stays put.
   EACH IMAGE STARTS FROM THE PREVIOUS IMAGE'S PHYSICAL STATE. If page N ended with the card poking out from under the mat's near edge, page N+1 begins with exactly that — same corner, same amount showing — and shows only the one realistic change this page's action makes (that same edge lifted enough to reveal the card; the card's bent corner still bent afterwards). Never re-stage a scene from scratch when the previous page already established where everything physically is.
   WHEN SOMETHING IS DAMAGED, SAY WHAT IS STILL INTACT. "The chair broke" is read as generic breakage and the illustrator escalates it into wreckage, which then contradicts the next page where it is simply mended. Name the damage narrowly and list what is untouched: "one front leg has come loose and that corner has sunk — the seat is whole and attached, the back is joined on, the other three legs are sound". Damage needs a stated limit exactly as object state does.
   The key-object descriptions you were given are the FINISHED look of each object. Anything the character MAKES during the story must not be listed until the page where it is finished — if the story ends with six date balls, pages 1-5 have no date balls in them, only ingredients and mixture. Listing it early is what puts the finished object in the picture before it has been made.

9a. OWNERSHIP AND ABSENCE ARE VISIBLE FACTS. Whenever the text turns on WHO HAS an object, HOW MANY there are, or that someone has NONE, fill "required_visible_states" and "forbidden_visible_states" for that page. The question is never "is the object visible?" but "does the picture clearly communicate the allocation the text describes?" Convert every absence into positive visible evidence a non-reading child can point at: an empty plate, empty hands, an empty space where the object had been, the OTHER characters visibly holding their allocated ones, a container shown empty, a clear contrast between who has something and who does not. ("No fig was left for Idris" = required: each fig visibly in front of its owner + the space and hands in front of Idris visibly empty; forbidden: any fig held by Idris or sitting unallocated beside him. A real book shipped that exact page with three unclaimed figs next to the hero, 2026-08-15.) Leave both lists empty on pages where ownership/count/absence does not matter.
10. WHO IS IN THE FRAME — fill "cast_present" with the ids of the story's cast members actually visible on this page (empty if the hero is alone). Only list someone if the reader can SEE them: a mum who called from another room is not in the frame. If someone was in the room on the previous page and nobody left, they are still there — do not silently remove them.
   BUT DO NOT PUT EVERYONE IN EVERY FRAME. A book where all the characters stand in all eight pictures is one flat tableau repeated eight times, and the child stops being the subject of their own story. The hero must be ALONE in at least two pages — the pages about their own effort, concentration or setback are theirs. Bring an adult into frame when they DO something in the story (hand over the spoon, comfort, taste, praise); otherwise let the hero have the page. Grown-ups can be established once and then be elsewhere in the house.

Then write "brief": a 1-2 sentence illustration instruction that bakes all of that in — specific about placement ("on the shelf behind the counter", "in Mum's hands"), the character's emotion, and what stayed the same. Also fill "staging" (one sentence: where each key object is on this page and why) and "emotion" (the character's feeling, one or two words).`;
  const content = `Story setting: ${JSON.stringify(story.setting)}\nKey objects: ${JSON.stringify(story.key_objects)}\nCast (everyone who is not ${child.name}): ${JSON.stringify(story.cast || [])}\nPages (text, original scene idea, location):\n${JSON.stringify(story.pages.map((p, i) => ({ page: i + 1, text: p.text, scene: p.scene, location: p.location })))}\n\nDirect all ${story.pages.length} pages now.`;
  return callJson({ system, content, schema: DIRECT_SCHEMA, tier: "story" });
}

const SHIFTY_SCHEMA = {
  type: "object",
  properties: {
    words: {
      type: "array",
      items: {
        type: "object",
        properties: {
          word: { type: "string" },
          graphemes: { type: "array", items: { type: "string" } },
          shifty: {
            type: "array",
            items: {
              type: "object",
              properties: {
                grapheme: { type: "string" },
                index: { type: "integer" },
                says: { type: "string" },
              },
              required: ["grapheme", "index", "says"],
              additionalProperties: false,
            },
          },
        },
        required: ["word", "graphemes", "shifty"],
        additionalProperties: false,
      },
    },
  },
  required: ["words"],
  additionalProperties: false,
};

// Shifty sounds: a TAUGHT LETTER making one of its OTHER sounds gets the
// slate diamond, not a dot (the u in "nutritious" says /oo/, not the /u/ of
// "up"). Only the book's own words need this — ledger words resolve
// themselves — and every annotation is filtered against the ledger's
// diamond-eligible list at render time, so a wrong answer can only be
// dropped, never invent a mark.
export async function markShiftySounds({ words, level }) {
  const system = `You mark up words for a British synthetic phonics book (Letters and Sounds, NOT Read Write Inc), for children aged 4-8.

A SHIFTY SOUND is a letter or letter-group making one of its OTHER pronunciations instead of the sound it was taught as:
- the u in "put", "full", "push" says /oo/ — shifty (taught u says /u/ as in "up")
- the u in "unicorn", "human", "music" says /yoo/ — shifty
- the o in "son", "come", "love" says /u/ — shifty
- the a in "was", "want", "wash" says /o/ — shifty
- a word-final y saying /ee/ ("cheeky") or /igh/ ("my") — shifty
- the u in "up", "cup", "mud" says /u/ — NOT shifty, that is its taught sound

An ALTERNATIVE SPELLING is NOT a shifty sound: "ti" spelling /sh/ in "patient", or the whole taught unit "tious" in "nutritious", is a grapheme in its own right and is never marked shifty. Only mark a letter that is making a DIFFERENT sound from the one it was taught as.

For each word: split it into its graphemes in order, then list ONLY the shifty ones. "index" is the 0-based position of that grapheme's FIRST LETTER in the word as spelled (in "nutritious", n=0, u=1, t=2, r=3, i=4, tious=5). If a word has no shifty sounds, return an empty list for it. Be conservative: when in doubt, do not mark it.`;
  const content = `Level ${level} book. Mark these words:\n${JSON.stringify(words)}`;
  return callJson({ system, content, schema: SHIFTY_SCHEMA, tier: "phonics", maxTokens: 6000 });
}

const COUNTRY_SCHEMA = {
  type: "object",
  properties: {
    facts: { type: "array", items: { type: "string" } },
    landmark: {
      type: "object",
      properties: {
        name: { type: "string" },
        image_brief: { type: "string" },
        fact: { type: "string" },
      },
      required: ["name", "image_brief", "fact"],
      additionalProperties: false,
    },
    greeting: { type: "string" },
  },
  required: ["facts", "landmark", "greeting"],
  additionalProperties: false,
};

// Dishes and ingredients that normally contain pork or alcohol. Told in the
// prompt not to use them, gpt-5.4-mini still returned okonomiyaki twice — a
// list a regex can check must not be left to the model (same lesson as the
// eye QA). Deliberately narrow: these are the everyday-preparation risks, not
// a ruling on anything contested.
const RISKY_FOOD = [
  "okonomiyaki", "ramen", "gyoza", "chashu", "tonkotsu", "katsu",
  "bacon", "ham", "prosciutto", "pancetta", "chorizo", "salami", "pepperoni",
  "sausage", "hot dog", "pork", "lard", "gammon", "black pudding",
  "carbonara", "paella", "cassoulet", "feijoada", "jamón", "jamon",
  "gelatine", "gelatin", "marshmallow",
  "wine", "beer", "sake", "mirin", "rum", "brandy", "sherry", "cider", "vodka", "whisky",
];

export function riskyFoodIn(text) {
  const hay = String(text || "").toLowerCase();
  return RISKY_FOOD.filter((t) => hay.includes(t));
}

// Profile-page country pack: the "bring the world together" content — fun
// facts a parent can read aloud, plus a landmark to paint in the house style.
// Facts are checked against RISKY_FOOD and re-asked until clean.
export async function countryFacts({ country, city, cultureNotes, attempt = 0, avoid = [] }) {
  const system = `You write the "Meet the Star" country panel for MyPhonicsBooks — personalised phonics books whose mission is bringing the world together: families reading a book learn something real and warm about the star child's country. Audience: a parent reading aloud to a 4-8 year old. British English. Joyful, respectful, never stereotyped, never preachy.

HOUSE VALUES — the publisher's content must not contradict Islamic values, and this panel is illustrated, so your landmark choice decides what gets drawn:
- NEVER choose an idol, a religious statue, a temple deity, or any figure made for worship (the Leshan Giant Buddha, Christ the Redeemer and the like are not options), and never choose a church, temple or shrine as a place of worship. A mosque is fine.
- PREFER natural wonders (mountains, waterfalls, lakes, forests, deserts, wildlife), and civic or historic architecture with no devotional purpose: towers, bridges, palaces, forts, harbours, markets, parks, stadiums, railways, observatories.
- Facts must contain no alcohol, pork or gambling, and no Western holidays (Christmas, Easter, Halloween, Valentine's, birthdays).
- FOOD FACTS: name only dishes that are halal AS NORMALLY MADE. It is not enough that a dish CAN be made without pork or alcohol — if the everyday version of it contains pork, bacon, lard, gelatine, mirin, sake or wine, choose something else. A Muslim family reading it aloud should not have to add a caveat. Beware in particular: okonomiyaki, ramen and gyoza (pork), paella and chorizo dishes, carbonara and prosciutto, black pudding, most cured sausages, many stews cooked with wine, and desserts set with gelatine. Fruit, bread, rice and noodle dishes, grilled meat and fish, sweets, pastries, teas and street snacks give you plenty to choose from.
- A food fact is not compulsory. Landscape, wildlife, weather, games children play, crafts, inventions, language and how people greet each other are all excellent and carry no risk.
- Avoid religious festivals of any faith as facts, Islamic ones included. Non-religious cultural, seasonal or national events are welcome — a harvest or rice festival, a kite or lantern festival, an independence day — described as what families and children actually do. Facts about landscape, wildlife, food, crafts, games, language and inventions are usually better still.
- Everything else about the country — its landscape, animals, food, games, language, crafts, history — is open, and should be celebrated warmly.`;
  const content = `Country: ${country}${city ? `. The child's family is from ${city}` : ""}${cultureNotes ? `. Family's own words about their world: ${cultureNotes}` : ""}.

Return:
- "facts": exactly 3 fun facts a young child would find delightful (food, animals, festivals, how children play or say hello — concrete and surprising, one short sentence each).${city ? ` Make at least one fact about ${city} specifically.` : ""}
- "landmark": the most recognisable, child-friendly landmark or natural wonder ${city ? `from ${city} or ` : ""}from ${country}. "name" = its name; "image_brief" = one vivid sentence describing it visually for an illustrator (shapes, colours, setting — no people needed); "fact" = one wow-fact about it for a child, MAXIMUM 12 words.
- "greeting": how a child says "hello" in the main local language, written as: word (language) — e.g. "Cześć! (Polish)". If English-speaking, use a warm local expression instead.${avoid.length ? `\n\nYOUR LAST ANSWER WAS REJECTED because it named: ${avoid.join(", ")}. Either that food normally contains pork or alcohol, or that landmark is a place of worship of another faith (torii gates, shrines, temples, pagodas and cathedrals all count, however scenic). Do not mention them again in any form. If it was the landmark, choose a secular one — a mountain, castle, bridge, tower, river, forest, harbour or national park. Pick facts about something else entirely — landscape, wildlife, games, crafts, weather, language.` : ""}`;
  const res = await callJson({ system, content, schema: COUNTRY_SCHEMA, tier: "fast", maxTokens: 4000 });

  // Deterministic gate: re-ask (twice) naming what was wrong, then drop the
  // offending facts rather than print them.
  // A DEVOTIONAL LANDMARK IS A HOUSE-VALUES FAIL, even when it reads as
  // scenery. The prompt already banned shrines, and the picker still chose
  // the Fushimi Inari torii gates for a Kyoto book - a working Shinto
  // shrine that presents as "famous red gates on a mountain trail"
  // (Lynden 2026-08-21). Prose rules do not catch what the model does not
  // classify as worship, so the name and the brief are checked by keyword.
  const lm = res.data.landmark || {};
  const worship = /(torii|shrine|temple|pagoda|stupa|church|cathedral|basilica|chapel|abbey|monastery|convent|synagogue|shinto|buddhis\w*|hindu|taoist|sikh|gurdwara|wat|monk\w*|altar|idol|deity|buddha|statue of christ|christ the redeemer)/i;
  const worshipHit = worship.test(`${lm.name || ""} ${lm.image_brief || ""} ${lm.fact || ""}`);
  if (worshipHit && attempt < 2) {
    console.warn(`[forge] landmark "${lm.name}" is a place of worship - re-asking`);
    const retry = await countryFacts({
      country, city, cultureNotes, attempt: attempt + 1, avoid: [...avoid, String(lm.name || "that landmark")],
    });
    return { data: retry.data, cost: res.cost + retry.cost };
  }

  const bad = [...new Set((res.data.facts || []).flatMap((f) => riskyFoodIn(f)))];
  if (bad.length && attempt < 2) {
    console.warn(`[forge] country facts named ${bad.join(", ")} — re-asking`);
    const retry = await countryFacts({
      country, city, cultureNotes, attempt: attempt + 1, avoid: [...avoid, ...bad],
    });
    return { data: retry.data, cost: res.cost + retry.cost };
  }
  if (bad.length) {
    res.data.facts = (res.data.facts || []).filter((f) => riskyFoodIn(f).length === 0);
    console.warn(`[forge] dropped ${bad.join(", ")} facts after retries`);
  }
  return res;
}

const EYE_QA_SCHEMA = {
  type: "object",
  properties: {
    // Described BEFORE the verdict on purpose: asked for a bare pass/fail on a
    // whole 1024px page, the vision model rubber-stamped every image (it once
    // wrote "solid black dots, no white sclera" about eyes that were plainly
    // white almonds with black pupils). Making it state what is literally
    // inside the eye outline first turns the check back into a check.
    eyes_seen: { type: "string" },
    // Same lesson, different feature: a finished page shipped with the hero
    // missing her NOSE (2026-08-11, "Amina Gets Food" p5) because this gate
    // only ever asked about eyes — a checklist QA answers only its checklist.
    // The face crop is already zoomed; asking about the whole face is free.
    features_seen: { type: "string", description: "For each visible face: list which facial features are actually drawn — eyes, eyebrows, nose, mouth. Name any that are MISSING on a face shown from the front or three-quarter view (a profile or turned-away head is exempt)." },
    pass: { type: "boolean" },
    reason: { type: "string" },
  },
  required: ["eyes_seen", "features_seen", "pass", "reason"],
  additionalProperties: false,
};

const FACES_SCHEMA = {
  type: "object",
  properties: {
    faces: {
      type: "array",
      items: {
        type: "object",
        properties: {
          who: { type: "string" },
          x: { type: "number" },
          y: { type: "number" },
          w: { type: "number" },
          h: { type: "number" },
        },
        required: ["who", "x", "y", "w", "h"],
        additionalProperties: false,
      },
    },
  },
  required: ["faces"],
  additionalProperties: false,
};

// Locate every face so the eye check can be run on a zoomed crop instead of
// the full page — at page scale a pair of eyes is a handful of pixels and the
// checker cannot actually see what it is being asked about.
export async function findFaces(imageB64, mediaType = "image/jpeg") {
  const system =
    "You locate faces in children's book illustrations. Return one entry per visible face (humans, animals, toys — anything with eyes), as a tight box around the HEAD only. " +
    "Coordinates are fractions of the image size, origin top-left: x,y = top-left corner of the box, w,h = its width and height (e.g. a head in the middle covering a fifth of the image = x 0.4, y 0.4, w 0.2, h 0.2). " +
    "Return an empty list if there are no faces. Never return more than 6.";
  const content = "List every face in this image with its box.";
  if (useOpenAI) {
    return openaiJson({
      model: OPENAI_FAST_MODEL,
      system,
      content,
      schema: FACES_SCHEMA,
      images: [{ b64: imageB64, mime: mediaType }],
      maxTokens: 2000,
    });
  }
  if (useVertex) {
    return vertexGenerate({
      model: VERTEX_FAST_MODEL,
      system,
      parts: [{ inlineData: { mimeType: mediaType, data: imageB64 } }, { text: content }],
      schema: FACES_SCHEMA,
      maxTokens: 2000,
    });
  }
  const response = await (await getClient()).messages.create({
    model: MODEL,
    max_tokens: 1000,
    system,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: imageB64 } },
          { type: "text", text: content },
        ],
      },
    ],
    output_config: { format: { type: "json_schema", schema: FACES_SCHEMA } },
  });
  const text = response.content.find((b) => b.type === "text")?.text ?? "";
  return { data: JSON.parse(text), cost: usageCost(response.usage) };
}

// The non-negotiable MPB eye rule: every eye is a solid black filled oval.
const SCENE_QA_SCHEMA = {
  type: "object",
  properties: {
    // Describe-before-judge, same discipline as the eye rule (SKILL.md §5:
    // "a bare pass/fail rubber-stamps everything"). Answering the checklist
    // questions in order is what makes the model actually look, rather than
    // pattern-matching "cute kids book picture, looks fine".
    named_objects: { type: "string", description: "Every physical thing the sentence names, and whether each is visible in the image." },
    action_shown: { type: "string", description: "What is the character physically doing in the image, in one sentence — compare it to what the text says is happening." },
    object_states: { type: "string", description: "For each key object visible: its declared state for this page, and whether the image matches that state or shows something earlier/later/wrong." },
    mechanism_legible: { type: "string", description: "If the sentence describes an object physically interacting with another (fitting into, plugging, opening, breaking, pouring into, tying to, etc.): does the image draw the SECOND object/feature that the first one interacts with (e.g. a hole, gap, slot, container), and does the image show contact/alignment between them? IF THE SENTENCE NAMES A SPECIFIC ATTACHMENT POINT (a leg, a wing, a handle, a specific part of a body or object), the image must show the interaction AT THAT EXACT PART — string described as being 'on its leg' drawn instead around a tail, a wing, or anywhere else on the body is a FAIL even though a string and the animal are both visible and technically touching. Name the exact part the text specifies and the exact part the image actually shows contact at; if they differ, that is a mismatch. A child who cannot read must be able to see the mechanism at the RIGHT location, not just both objects somewhere on the page. If the sentence describes no such interaction, say so and skip this check." },
    // The open-ended sweep. Every failure this gate has ever shipped was
    // something its checklist never asked about (a nose missing from a face,
    // a map read from its blank back, a bag squashed against the map under
    // one arm — all in one book, 2026-08-11). The checklist fields above stay
    // because they force specific comparisons, but this field is the fresh
    // eyes: what would a picky parent flipping through object to?
    defect_sweep: { type: "string", description: "Look at the whole image with fresh eyes, ignoring the checklist above, and list anything a sharp parent flipping through a printed book would object to. Check in particular: (1) any object a character is USING is oriented the way its user would actually use it — a person reading a map, book or note must be looking at its printed face, not its blank back with the print facing the camera; (2) held or carried items relate to each other and the body sensibly — no item squashed against, merged into, or impossibly overlapping another; (3) no body part or object is malformed, duplicated, or missing something obvious; (4) every character, creature and object is painted SOLID and OPAQUE in the house style — if the background is visible THROUGH any body or object, or a figure is rendered as a see-through ghost, a double-exposure, or a motion smear with trailing duplicates (a 'speed blur' cat instead of a solidly drawn running cat), that is a delivery-blocking printing-error-grade defect, not a style choice (a real page shipped its cat as a transparent grey smear under a bench, 2026-08-16). Name each real problem specifically, or say the image is clean. Do NOT flag ordinary style simplifications or things a checklist field above already covers." },
    distinguishing_feature: { type: "string", description: "If a key object's declared look names a distinguishing mark (a chip, a patch, a crack, a label): describe where in THIS image that mark actually is — its shape and its position on the object — and whether it matches the declared shape and location. If two similar objects share the frame, say whether a child could point at which is which WITHOUT reading the text. If no key object declares such a mark, say 'none declared'." },
    character_match: { type: "string", description: "For EACH character reference sheet provided after the scene image: describe literally what that character wears IN THE SCENE — head covering (present or absent, and its colour), hairstyle, top garment and its colour, bottom garment and its colour, footwear, any accessories — then compare item by item against their reference sheet. Identity is the WHOLE look: a child who wears a white headscarf and pink tunic on her sheet but appears bare-headed in a yellow dress is a DIFFERENT character, and that is a delivery-blocking fail even when the face matches. If no reference sheets were provided, say 'no references provided'." },
    state_assertions: { type: "string", description: "If STATE ASSERTIONS were provided with this page: go through them ONE BY ONE. For each REQUIRED state, describe what the image actually shows about that object's ownership/count/location and say clearly SATISFIED or NOT SATISFIED — 'the object is visible somewhere' does not satisfy an ownership assertion; the allocation itself must be readable from the picture by a child who cannot read. For each FORBIDDEN state, say whether the image shows it. If no assertions were provided, say 'none provided'." },
    pass: { type: "boolean" },
    reason: { type: "string", description: "If failing: the specific, narrow thing to fix — never just 'regenerate the page'." },
  },
  required: ["named_objects", "action_shown", "object_states", "mechanism_legible", "distinguishing_feature", "character_match", "state_assertions", "defect_sweep", "pass", "reason"],
  additionalProperties: false,
};

// Cover-content QA (Lynden 2026-08-15): the raw cover artwork is typeset
// LATER — the template overlays the real title, level band and branding — so
// any lettering painted INTO the art collides with it. The generator is told
// to leave clear space, but "Figs on the Tray" regenerated its cover with a
// painted title and nothing checked (only the eye QA looks at covers). One
// cheap full-frame vision call per cover; jobs.mjs regenerates once on fail
// and rejects rather than typesetting over embedded lettering.
const COVER_CONTENT_SCHEMA = {
  type: "object",
  properties: {
    scan: { type: "string", description: "Scan the WHOLE image region by region (top band, centre, lower third, corners, signs/awnings/objects within the scene) and describe anything that looks like writing: letters, words, numbers, title lettering, logos, shop signs, labels, watermarks, or text-LIKE painted marks (squiggles clearly imitating writing). Describe what you actually see before judging." },
    embedded_text_present: { type: "boolean", description: "true if ANY lettering, numbers, logos, signage text, watermarks or text-like marks appear anywhere in the artwork." },
    detected_text: { type: "array", items: { type: "string" }, description: "Each piece of detected text/lettering, transcribed if legible, else described (e.g. 'illegible script on the awning'). Empty if none." },
    pass: { type: "boolean", description: "true ONLY if the artwork is completely free of text and text-like marks." },
    reason: { type: "string", description: "If failing: where the lettering is and what it says/resembles." },
  },
  required: ["scan", "embedded_text_present", "detected_text", "pass", "reason"],
  additionalProperties: false,
};

export async function coverContentQA(imageB64, mediaType = "image/jpeg") {
  const system =
    "You QA the RAW cover artwork of a children's picture book BEFORE typesetting. The print template overlays the real title, level band and branding later, so the artwork itself must contain NO text of any kind: no letters or words, no title lettering, no numbers, no logos, no signs with writing, no watermarks, no painted marks that imitate writing. " +
    "Scan the whole frame region by region and describe what you see before judging — decorative patterns, tilework and abstract ornament are fine; anything readable or clearly text-like is not.";
  const content = "Inspect this cover artwork for embedded text or lettering of any kind.";
  if (useOpenAI) {
    return openaiJson({
      model: OPENAI_FAST_MODEL,
      system,
      content,
      schema: COVER_CONTENT_SCHEMA,
      images: [{ b64: imageB64, mime: mediaType }],
      maxTokens: 1500,
    });
  }
  if (useVertex) {
    return vertexGenerate({
      model: VERTEX_FAST_MODEL,
      system,
      parts: [{ inlineData: { mimeType: mediaType, data: imageB64 } }, { text: content }],
      schema: COVER_CONTENT_SCHEMA,
      maxTokens: 1500,
    });
  }
  const response = await (await getClient()).messages.create({
    model: MODEL,
    max_tokens: 1200,
    system,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: imageB64 } },
          { type: "text", text: content },
        ],
      },
    ],
    output_config: { format: { type: "json_schema", schema: COVER_CONTENT_SCHEMA } },
  });
  const text = response.content.find((b) => b.type === "text")?.text ?? "";
  return { data: JSON.parse(text), cost: usageCost(response.usage) };
}

// The consistency check SKILL.md §5 specifies and flags as NOT BUILT — "no
// gate checks that the pictures agree with each other or with the words".
// 8.4's "The Thick Pen" shipped a page whose text says the pen plugs a hole
// in the bag and whose image shows neither the hole nor the pen touching the
// bag (Lynden 2026-08-09: "the text says X... it doesn't show that"). This
// covers the two highest-value questions from that list — §5 Q7 (every named
// object visible) and Q9 (the picture shows THIS sentence's action, not a
// moment before or after) — plus key-object state (Q8/Q12), which is exactly
// what failed here: "thick pen" was declared as "fits the gap" for this page
// and the image drew it nowhere near the bag.
export async function sceneConsistencyQA(imageB64, { sceneText, objectsBlock = "", characterRefs = [], assertions = null }, mediaType = "image/jpeg") {
  const objectLines = objectsBlock.trim() || "(no key objects declared for this page)";
  const assertionsBlock = assertions && ((assertions.required || []).length || (assertions.forbidden || []).length)
    ? `\n\nSTATE ASSERTIONS for this page (verify each in state_assertions — these carry the story's meaning):\nREQUIRED (the image must clearly show): ${JSON.stringify(assertions.required || [])}\nFORBIDDEN (the image must not show): ${JSON.stringify(assertions.forbidden || [])}`
    : "";
  const system =
    "You QA a children's picture-book illustration against the page it illustrates. Describe what you literally see before judging — a bare pass/fail rubber-stamps everything, because 'a nice picture of kids in a market' looks fine at a glance even when it fails to show the actual sentence. " +
    "Answer named_objects, action_shown, object_states, mechanism_legible, distinguishing_feature, character_match, state_assertions and defect_sweep with what is ACTUALLY IN THE IMAGE, not what you'd expect a good illustration to contain. Only then set pass. " +
    "OWNERSHIP AND ABSENCE: when a state assertion says an object belongs to someone, has a certain count, or that a character has NONE, the picture must communicate that allocation to a child who cannot read — the object merely being visible somewhere in the frame does NOT satisfy it, and an object sitting unallocated next to a character the text says has none actively CONTRADICTS it. pass is FALSE if any required assertion is not clearly satisfied or any forbidden state is shown. " +
    "pass is FALSE if: any object the sentence names is entirely absent from the image; the image shows a moment clearly before or after the sentence's action rather than the action itself; a key object is shown in a state that contradicts its declared state for this page (e.g. declared 'not yet plugged into the hole' but the image shows it already inserted, or vice versa); the sentence describes one object physically interacting with a second (fitting into, plugging, opening, tying, pouring, etc.) and the image does not draw that second object/feature at all, or draws both objects with no visible contact between them — an object being merely present near another is NOT the same as the image showing them interact; OR the sentence names a specific attachment point (a leg, a wing, a handle) and the image shows the interaction at a DIFFERENT part of the same object/creature (string described as tied 'on its leg' but drawn around a tail or wing is a fail, even though a string and the animal are both visible); OR a key object's declared distinguishing mark (a chip, a patch, a crack) is missing from the image, drawn with a clearly different shape, or drawn at a different location on the object than declared — the mark is the story's own logic made visible, and 'some small dark smudge somewhere' does not count as the declared mark; OR two similar objects share the frame and a child could NOT point at which is which without reading; OR character_match found ANY wardrobe difference from a reference sheet — head covering present on the sheet but absent in the scene (or vice versa), a different garment type, a different garment colour, different footwear, a different hairstyle. A character's identity is their WHOLE look, and one page redressing them is a delivery-blocking error even when the face is right (a real book shipped its hero bare-headed in a yellow dress on one page and in her white headscarf and pink tunic on every other, 2026-08-14); OR defect_sweep found a genuine problem — an object being read/used facing the wrong way, held items impossibly overlapping, a malformed or incomplete body part. A child who cannot read the words must be able to point at the picture and see the specific thing the sentence describes happening, at the place it says it is happening. " +
    "LIGHT, SHADE AND BACKDROP ARE LOAD-BEARING, NOT STYLE (a cat asserted to rest in a cool shaded spot was drawn in full sun, and a courtyard scene grew open sea behind its established wall, 2026-08-20): if an assertion or the text places a character or object in shade, in a cool spot, or out of the sun, the figure must sit clearly INSIDE the cast shadow, not beside it; and the established backdrop must persist — sea, streets or skyline appearing behind characters the story placed at an enclosed wall or courtyard is a fail unless the page brief says the view opens up. " +
    "Minor artistic license is fine — this is not a check for a literal diagram. Fail only for a genuine, obvious mismatch a child's parent would notice.";
  const refIntro = characterRefs.length
    ? `\n\nAfter the scene image, ${characterRefs.length === 1 ? "1 reference sheet follows" : `${characterRefs.length} reference sheets follow`}, in this order: ${characterRefs.map((r) => r.name).join(", ")}. These sheets are each character's FIXED look for the whole book — compare wardrobe item by item in character_match.`
    : "";
  const content =
    `PAGE TEXT: "${sceneText}"\n\nKEY OBJECTS for this page:\n${objectLines}${assertionsBlock}${refIntro}\n\n` +
    "Does this image show the text, the declared object states, every state assertion, and each referenced character's fixed look correctly?";
  const allImages = [
    { b64: imageB64, mime: mediaType },
    ...characterRefs.map((r) => ({ b64: r.b64, mime: r.mime || "image/jpeg" })),
  ];
  if (useOpenAI) {
    return openaiJson({
      model: OPENAI_FAST_MODEL,
      system,
      content,
      schema: SCENE_QA_SCHEMA,
      images: allImages,
      maxTokens: 2500,
    });
  }
  if (useVertex) {
    return vertexGenerate({
      model: VERTEX_FAST_MODEL,
      system,
      parts: [...allImages.map((im) => ({ inlineData: { mimeType: im.mime, data: im.b64 } })), { text: content }],
      schema: SCENE_QA_SCHEMA,
      maxTokens: 2500,
    });
  }
  const response = await (await getClient()).messages.create({
    model: MODEL,
    max_tokens: 1600,
    system,
    messages: [
      {
        role: "user",
        content: [
          ...allImages.map((im) => ({ type: "image", source: { type: "base64", media_type: im.mime, data: im.b64 } })),
          { type: "text", text: content },
        ],
      },
    ],
    output_config: { format: { type: "json_schema", schema: SCENE_QA_SCHEMA } },
  });
  const text = response.content.find((b) => b.type === "text")?.text ?? "";
  return { data: JSON.parse(text), cost: usageCost(response.usage) };
}

// Cold-editor whole-book review — the gate that catches what per-page
// checklists structurally cannot. Every per-page QA judge sees one image and
// one checklist; a cold external read of the FINISHED book (ChatGPT,
// 2026-08-13, "The Chip on Top") instantly caught what all of them passed:
// a premise too thin to be a story, an identification mark too vague to
// identify anything, unnatural narration, and a phonics page contradicting
// the story. The difference was not the model — it was the framing (critic,
// not verifier) and the altitude (whole book, not one page). This gate
// recreates that: full book, cold read FIRST, rubric second, verdict last.
const EDITOR_REVIEW_SCHEMA = {
  type: "object",
  properties: {
    cold_read: { type: "string", description: "Read the whole book cold, cover to last page, BEFORE applying any rubric. React as a demanding children's-book editor flipping through a finished copy: what works, and what would make you stop and reject it? Write 3-8 sentences of honest reaction — praise only what genuinely earns it." },
    story_quality: { type: "string", description: "Judge the story AS A STORY: does the hero have a goal a child cares about, a developed problem with real tension, a visible attempt (with effort or thought) to solve it, and a satisfying earned resolution? A coherent-but-flat exercise (a mix-up corrected in one glance, a task with no obstacle) FAILS this even if nothing is wrong with it. Name what is missing if anything." },
    language_quality: { type: "string", description: "Judge every sentence as narration a parent reads aloud: does each read naturally and connectedly ('Yusuf checks the top'), or like an instruction or exercise line ('Yusuf can check the top')? Does the prose establish transitions the pictures show (boarding a ferry, entering a room), or do characters teleport between pages? Quote any sentence that fails. IMPORTANT CONSTRAINT ON YOUR OWN SUGGESTIONS: this is a decodable book — the right wording is the most natural wording available WITHIN the level's taught sounds. Never propose a more literary word that uses an above-level sound ('caught' over 'hit' at a level where 'augh' is untaught is a WORSE sentence, not a better one); if a line is awkward, the fix must come from the same phonics window the story already uses." },
    object_identity: { type: "string", description: "Track every recurring object across all page images: is it recognisably THE SAME physical object every time (same proportions, same details, same distinguishing marks in the same place at the same size)? If the plot depends on a distinguishing feature, could a child point to it on every relevant page and tell similar objects apart WITHOUT the text? Name each drift specifically." },
    image_text_agreement: { type: "string", description: "For each page: does the picture show this sentence's moment — every named object visible, the action itself (not before/after), numbers matching? Note any page where the words and picture disagree." },
    action_realisation: { type: "string", description: "THE CENTRAL ACTIONS, page by page. For EACH page, first STATE what the sentence requires to be VISIBLE in the picture (the tool being held, the object entering the gap, the thing rising, the two objects in contact), THEN say whether the picture actually shows it. A page whose crucial action happens off-camera — the character shown thinking before it and celebrating after it, with the action itself never drawn — is a delivery-blocking failure even if every object is present somewhere in the frame (a real book shipped its hero 'sliding the hook into the drain' while the picture showed her crouching empty-handed, 2026-08-15)." },
    physical_possibility: { type: "string", description: "OBJECT PHYSICS: could the story's central events actually happen given the sizes, openings and geometry the PICTURES establish? Compare dimensions: can the object that 'fell in' fit through the opening the picture draws? Can it come back out the way the text says? Does each object's position/state on a page follow from where the previous page's picture left it? Name any event the pictures make physically impossible (a toy train drawn far wider than the drain-grate slots it supposedly slipped through, 2026-08-15)." },
    safety: { type: "string", description: "Would a parent flinch? A young child modelled doing something risky — reaching into drains or gaps, wielding tools, near heat, water, traffic or heights — WITHOUT an adult visibly present and part of the action is a delivery-blocking failure: these books model behaviour for four-to-eight-year-olds. The child keeping the agency (noticing, planning, deciding) while the adult shares the risky step is the standard." },
    phonics_presentation: { type: "string", description: "Check the book's phonics pages against its own story: do the Story Words appear in the story text? Does any story word rely on a sound the book itself lists as not-yet-taught (beyond the allowed one-or-two Future Sound previews)? Is the book's own focus sound ever ALSO labelled as a future/not-yet-taught sound (a direct self-contradiction)? Do the activity questions use the story's own vocabulary ('chip' asked as 'mark' fails this)? Note contradictions." },
    issues: {
      type: "array",
      description: "Every genuine defect found above, one entry each, most severe first. Empty only if the book is genuinely clean. SEVERITY IS THE VERDICT: 'critical' or 'major' = the book must not ship as-is; 'minor' = the book remains suitable to deliver and this is an internal note. If several minor observations COLLECTIVELY show a structural weakness (e.g. the story has no developed plot), do not list them as scattered minors — combine or promote them into ONE major issue that names the structural problem. NO DISCRETION ON STORY-STATE: use area 'story-state' (never 'image-text') and severity major-or-worse whenever the failure touches the story's load-bearing meaning — the central problem is not visible in the pictures; a picture contradicts the central problem; the main attempt or action is missing; the resolution is not visually demonstrated (including the recipients of a sharing/giving resolution being absent when receiving IS the resolution); object ownership shown reverses the meaning of the text; a stated absence is contradicted by the object being visibly available. A missing decorative detail is a minor; a missing story beat never is. (The same page-5 contradiction was called minor by one review and major by the next, 2026-08-15 — that discretion is what this rule removes.)",
      items: {
        type: "object",
        properties: {
          severity: { type: "string", enum: ["critical", "major", "minor"] },
          area: { type: "string", description: "premise | story | story-state | language | object-identity | image-text | action | physics | safety | phonics | print" },
          detail: { type: "string" },
        },
        required: ["severity", "area", "detail"],
        additionalProperties: false,
      },
    },
    pass: { type: "boolean", description: "Your overall opinion. ADVISORY ONLY — the shipping decision is derived in code from the issue severities above, so make the severities carry your verdict: if you would not ship it, at least one issue must be critical or major." },
    reason: { type: "string", description: "One-sentence verdict a colleague could act on." },
  },
  required: ["cold_read", "story_quality", "language_quality", "object_identity", "image_text_agreement", "action_realisation", "physical_possibility", "safety", "phonics_presentation", "issues", "pass", "reason"],
  additionalProperties: false,
};

// The shipping decision, derived FROM the structured issues — never from the
// model's separately generated boolean. On 2026-08-14 a book was killed by a
// review whose three issues were all "minor" yet whose pass came out false:
// the boolean and the severity labels are generated independently and can
// contradict each other, and severity is the one the rubric defines.
// Legacy "reject" (the old two-value enum) counts as blocking.
export function deriveEditorVerdict(review) {
  const issues = review?.issues || [];
  // Story-state failures (central problem invisible/contradicted, missing
  // attempt or resolution, ownership reversing the text, contradicted
  // absence) are blocking REGARDLESS of the severity the model typed — the
  // same page-5 contradiction was "minor" in one review and "major" in the
  // next (2026-08-15). Code removes that discretion.
  const isBlocking = (i) =>
    ["critical", "major", "reject"].includes(String(i.severity || "").toLowerCase()) ||
    String(i.area || "").toLowerCase() === "story-state";
  const blocking = issues.filter(isBlocking);
  const minors = issues.filter((i) => !isBlocking(i) && String(i.severity || "").toLowerCase() === "minor");
  return { pass: blocking.length === 0, blocking, minors };
}

// The editor runs on the STORY-tier model, never the fast tier (Lynden
// 2026-08-15, "The Train in the Drain": the mini model at 640px thumbs
// passed a book whose central action was never illustrated and whose event
// was physically impossible, with an empty issues list and a $0.006 bill —
// while a free cold ChatGPT read caught everything. The most consequential
// judgment in the pipeline gets the strongest model and full-size pages;
// ~$0.10-0.30 per book is the cheapest insurance the forge buys).
export async function coldEditorReview({ story, level, focusSound, images, unresolvedQa = [] }) {
  const system =
    "You are the final quality gate for MyPhonicsBooks: a demanding children's-book editor reviewing a FINISHED custom book before it is allowed to ship. You are a critic, not a verifier — your job is to find the reasons this book should NOT ship, and pass it only if you genuinely cannot. " +
    "You are reviewing the whole book at once: the images are the cover followed by every story page in order, and the text of each page is given alongside. " +
    "The cover image is RAW ARTWORK reviewed before typesetting: the print template overlays the title, level band and branding later, so a cover with empty space and no text is CORRECT — never raise missing title/typography as an issue. " +
    "Fill cold_read FIRST, before any rubric thinking — first impressions catch what checklists miss. Then work through the rubric fields describing what you ACTUALLY SEE in each image — never what a good illustration would be expected to contain, and never a hedge like 'I would check whether…': you are the check, so look and say what is there. Then list issues and give the verdict. " +
    "Hold the bar of a real published picture book: 'decodable and coherent' is the entry fee, not the standard. A book passes only if the story would hold a four-to-eight-year-old, the pictures tell the story on their own — including every central action actually drawn, every event physically possible in the world the pictures establish, and no unsafe behaviour modelled — and nothing on the phonics pages contradicts the book itself. " +
    "SEVERITY DISCIPLINE: your severities ARE the verdict — code ships any book with no critical or major issue. 'minor' means 'still fine to deliver'. If your honest view is that the book should not ship, you MUST express that as at least one critical or major issue (promoting or combining minors into a named structural major where needed) — never as a false pass boolean over a list of minors.";
  const pagesBlock = story.pages.map((p, i) => `Page ${i + 1}: "${p.text}"`).join("\n");
  const qaBlock = unresolvedQa.length
    ? `\nUNRESOLVED PER-PAGE QA FLAGS (a page-level judge already failed these and repair did not fully fix them — verify each yourself and weigh it in your verdict):\n${unresolvedQa.map((q) => `- page ${q.page}: ${q.reason}`).join("\n")}\n`
    : "";
  const content =
    `Level ${level.level} (${level.name}) custom book, focus sound "${focusSound}". Title: "${story.title}".\n\n` +
    `PAGE TEXTS:\n${pagesBlock}\n\n` +
    `STORY WORDS (must appear in the story; 2 with the focus sound, 4 other level words): ${JSON.stringify(story.read_words || [])}\n` +
    `KEY OBJECTS AS DECLARED: ${JSON.stringify(story.key_objects || [])}\n${qaBlock}\n` +
    `The ${images.length} images attached are: the cover, then story pages 1-${images.length - 1} in order.\n\n` +
    "Review the finished book now.";
  if (useOpenAI) {
    return openaiJson({
      model: OPENAI_STORY_MODEL,
      system,
      content,
      schema: EDITOR_REVIEW_SCHEMA,
      images,
      maxTokens: 6000,
    });
  }
  if (useVertex) {
    return vertexGenerate({
      model: VERTEX_STORY_MODEL,
      system,
      parts: [...images.map((im) => ({ inlineData: { mimeType: im.mime, data: im.b64 } })), { text: content }],
      schema: EDITOR_REVIEW_SCHEMA,
      maxTokens: 6000,
    });
  }
  const response = await (await getClient()).messages.create({
    model: MODEL,
    max_tokens: 3000,
    system,
    messages: [
      {
        role: "user",
        content: [
          ...images.map((im) => ({ type: "image", source: { type: "base64", media_type: im.mime, data: im.b64 } })),
          { type: "text", text: content },
        ],
      },
    ],
    output_config: { format: { type: "json_schema", schema: EDITOR_REVIEW_SCHEMA } },
  });
  const text = response.content.find((b) => b.type === "text")?.text ?? "";
  return { data: JSON.parse(text), cost: usageCost(response.usage) };
}

// TEXT-ONLY editor gate, run BEFORE any image exists (Lynden 2026-08-14,
// after "Yusuf and the Star Tin" was double-rejected for story thinness with
// 16 finished illustrations already paid for): both of that book's rejections
// were fully visible in the text alone, so story quality is now judged on the
// premise, the six-beat plan and the page texts while a rejected draft still
// costs pennies. The whole-book coldEditorReview stays after assembly for
// what only images can show (object drift, image-text disagreement).
const STORY_EDITOR_SCHEMA = {
  type: "object",
  properties: {
    cold_read: { type: "string", description: "Read the story text cold, page by page, BEFORE applying any rubric — as a demanding children's-book editor reading a manuscript. 3-6 sentences of honest reaction." },
    premise_check: { type: "string", description: "Is the premise a real story premise — a character a child cares about, wanting something that matters, with a genuine problem in the way? Or a situation that merely gets corrected?" },
    plan_check: { type: "string", description: "Test the six-beat plan against the actual pages: does a real first attempt happen ON the pages? Does a real setback make things harder or cost something? Does the hero notice/decide/do something differently? Is the resolution produced by the hero's own effort? Name any beat the pages promise but do not deliver." },
    story_quality: { type: "string", description: "Judge the story AS A STORY: goal, developed problem with tension, visible effort, earned resolution. A coherent-but-flat exercise FAILS even if nothing is 'wrong' with it." },
    language_quality: { type: "string", description: "Judge every sentence as read-aloud narration. Quote any line that is stiff, caption-like or unnatural ('Idris had a think and a way' fails this), and for EACH quoted line PROPOSE the best replacement wording available WITHIN the level's taught sounds — the job is to find natural English inside the phonics window, never to accept unnatural English and never to reach for an above-level word. Put the proposed rewording in the corresponding issue's detail too, so the revision can use it." },
    issues: {
      type: "array",
      description: "Every genuine defect, most severe first. SEVERITY IS THE VERDICT: critical/major = must not proceed; minor = fine to proceed, internal note. If several minors collectively mean the story has no developed plot, combine them into ONE major issue naming the structural problem. Use area 'premise' ONLY when the premise itself is unusable and no amount of deepening the same story could fix it — and note that A PREMISE WITH NO ENGINE IS EXACTLY THAT CASE. If the hero causes nothing, or the problem resolves through weather, luck, time passing or an adult acting instead of the hero, file it as area 'premise', not 'story': the writer is allowed to replace a premise you reject, but is otherwise LOCKED to the one you were given, so a plot-engine failure filed under 'story' forces a rewrite that must keep the engineless premise and will fail again for the same reason (Omar's 'boy watches the moon from a roof', 2026-08-16: both drafts rejected for exactly this, one wasted rewrite).",
      items: {
        type: "object",
        properties: {
          severity: { type: "string", enum: ["critical", "major", "minor"] },
          area: { type: "string", description: "premise | story | language | phonics" },
          detail: { type: "string" },
        },
        required: ["severity", "area", "detail"],
        additionalProperties: false,
      },
    },
    pass: { type: "boolean", description: "Advisory only — the decision is derived in code from issue severities." },
    reason: { type: "string", description: "One-sentence verdict a colleague could act on." },
  },
  required: ["cold_read", "premise_check", "plan_check", "story_quality", "language_quality", "issues", "pass", "reason"],
  additionalProperties: false,
};

export async function storyEditorReview({ story, level, focusSound }) {
  const system =
    "You are the STORY gate for MyPhonicsBooks custom books: a demanding children's-book editor judging a decodable manuscript BEFORE illustration money is spent. You are a critic, not a verifier — find the reasons this story should not be illustrated, and pass it only if you genuinely cannot. " +
    "Hold the bar of a real published picture book: 'decodable and coherent' is the entry fee, not the standard. The commonest failure in this pipeline is THINNESS — a problem stated quickly and solved by simply doing the obvious thing, with no attempt, no setback, and no earned resolution. Weigh the six-beat plan against what the PAGES actually show: a plan is worthless if the pages skip its beats. " +
    "Respect the level: the vocabulary is deliberately constrained, so judge depth by EVENTS and the scene briefs, not by richness of language. Simple words telling a real story pass; rich words telling no story fail. " +
    "SAFETY IS BLOCKING: if the hero performs a risky physical action (reaching into drains/holes, using tools, heat, deep water, traffic, heights) without an adult present and part of that action in the same page, that is a major issue — these books model behaviour for young children. " +
    "The -ed past-tense suffix is a deliberately taught exception at Level 4 and above (the book's prep page teaches its three pronunciations) — never raise -ed usage as a phonics issue at L4+. " +
    "SEVERITY DISCIPLINE: your severities ARE the verdict — code proceeds on any review with no critical or major issue, and 'minor' means 'still fine to proceed'. If your honest view is that this story should not be illustrated, you MUST say so as at least one critical or major issue.";
  const pagesBlock = story.pages.map((p, i) => `Page ${i + 1}: "${p.text}"\n  scene: ${p.scene}`).join("\n");
  const content =
    `Level ${level.level} (${level.name}) custom book manuscript, focus sound "${focusSound}". Title: "${story.title}".\n\n` +
    `PREMISE:\n${JSON.stringify(story.premise || {}, null, 1)}\n\n` +
    `SIX-BEAT PLAN:\n${JSON.stringify(story.story_plan || {}, null, 1)}\n\n` +
    `PAGES:\n${pagesBlock}\n\n` +
    "Review the manuscript now.";
  // 6000, not 3000: the describe-first rubric makes reviews long, and a
  // clipped response is truncated JSON — "Unterminated string at position
  // 1268" killed a run at this gate on 2026-08-15.
  // The gate runs on a DIFFERENT vendor than the writer (cross-vendor cold
  // read) wherever a second vendor is reachable.
  return callJson({ system, content, schema: STORY_EDITOR_SCHEMA, tier: "story", maxTokens: 6000, judge: true });
}

// One bounded editorial rewrite after an editor rejection (Lynden
// 2026-08-13: "rewrite once"). The PREMISE IS LOCKED (Lynden 2026-08-14,
// after a revision abandoned the simit-cart premise and invented an
// unrelated star-tin book): a revision deepens the SAME story — stronger
// obstacle, a real first attempt and setback, an earned resolution — and
// may only replace the premise when the editor has explicitly rejected the
// premise itself as unusable (an issue with area "premise" at blocking
// severity), which the caller signals via premiseRejected.
export async function reviseStoryAfterEditor({ level, child, focusSound, pagesCount, story, review, greenWords = [], progression = null, exemplars = [], premiseRejected = false }) {
  const rejects = (review.issues || []).filter((i) => ["critical", "major", "reject"].includes(String(i.severity || "").toLowerCase()));
  const premiseBlock = premiseRejected
    ? `The editor has explicitly rejected the PREMISE ITSELF as unusable, so you may build a new premise — but keep the hero ${child.name} (age ${child.age ?? "5"}, from ${child.country || "the UK"}), the focus sound "${focusSound}" and the level's constraints, and fill in a fresh "premise" and "story_plan" before the pages.`
    : `PRESERVE THE EXISTING PREMISE, CHARACTERS, SETTING, GOAL AND CENTRAL OBJECT. The story's locked premise is:
${JSON.stringify(story.premise || { title: story.title, setting: story.setting, key_objects: story.key_objects }, null, 1)}

Deepen the SAME story by strengthening the obstacle, adding an unsuccessful first attempt or setback, giving the character a meaningful plan or choice, and making the resolution result from that effort. Do not replace the story with a new premise — the same character wants the same thing in the same place with the same object; what changes is how hard it is and what the hero does about it. Return the SAME "premise" object verbatim, and a revised "story_plan" whose six beats the new pages actually deliver.`;
  const system = `You are the senior story writer for MyPhonicsBooks revising a book a demanding editor has REJECTED. This is the one revision the book gets — fix every rejection reason properly, do not patch around them.

${premiseBlock}

HARD CONSTRAINTS (unchanged from the original brief):
- Every word decodable from these graphemes: ${JSON.stringify(level.cumulative)} — or one of these tricky words: ${JSON.stringify(level.trickyWords)}. The name "${child.name}" is allowed.
- The focus sound "${focusSound}" in AT LEAST 3 distinct words (and no more than 3).
- Exactly ${pagesCount} pages. British English. One consistent tense. Every sentence starts with a capital and ends with . ? or !
${progression ? `- Level ${level.level} progression: ${progression.sentences_per_page[0]}${progression.sentences_per_page[1] !== progression.sentences_per_page[0] ? `-${progression.sentences_per_page[1]}` : ""} sentence(s) per page, ${progression.words_per_sentence[0]}-${progression.words_per_sentence[1]} words each; punctuation limited to: ${progression.punctuation.join(", ")}.` : ""}
- WORD BANK you may draw from freely: ${JSON.stringify(greenWords)}
- Narration, not instructions: never "can/could + verb" for an action the hero performs. Prose moves the reader between locations. A plot-critical distinguishing mark gets an exact shape and an exact fixed location in its key_object "look".
- SAFE BEHAVIOUR IS NON-NEGOTIABLE (revisions introduce this failure most often — a rewrite once sent the hero running back through a public souk alone, 2026-08-15): the hero must never do a risky physical action alone — moving unaccompanied through public streets/crowds, reaching into drains or gaps, using tools, anything near heat, deep water, traffic or heights. The child keeps the agency (notices, plans, decides); an adult is present and part of any risky step in the SAME page's text and scene.
- NATURALNESS NEVER OVERRIDES DECODABILITY. When the editor calls a line awkward, replace it with the most natural wording available WITHIN the taught graphemes above — never a more literary word that needs an above-level sound ("caught" for "hit" at a level where its sound is untaught makes the book WORSE). If no natural in-level word exists, restructure the sentence instead.
${exemplars.length ? `\nPublished books at this level — match their register:\n${exemplars.map((e) => `"${e.title}": ${e.pages.join(" | ")}`).join("\n")}\n` : ""}`;
  const content = `REJECTED story:\n${JSON.stringify(story)}\n\nEDITOR'S REJECTION REASONS (every one must be genuinely fixed):\n${JSON.stringify(rejects.length ? rejects : review.issues)}\n\nEditor's assessment for context:\nStory quality: ${review.story_quality}\nLanguage: ${review.language_quality}\n\nReturn the revised story.`;
  return callJson({ system, content, schema: STORY_SCHEMA, tier: "story" });
}

// Actual-result state extraction — the missing half of continuity. The plan
// says what SHOULD happen on a page; nothing recorded what the approved
// image ACTUALLY shows, so mutable object state had no anchor: the dot card
// in "Food for All" kept its identity (white card — pinned by its reference
// sheet) but its SIZE and the PLACEMENT of the dots on it changed page to
// page (Lynden 2026-08-12), because dot layout is state, not identity, and
// state lived nowhere. After a page passes QA this runs once on the real
// image; the result is injected into the NEXT page's prompt as binding fact.
const SCENE_STATE_SCHEMA = {
  type: "object",
  properties: {
    states: { type: "string", description: "For EACH key object visible in this image: its exact current visible state, precisely enough that another artist could redraw it identically — its approximate size relative to nearby things, its position, its orientation, and the exact layout of any marks, contents or attachments ON it (e.g. 'the white card is palm-sized, lying flat on the mat, with three black dots in a horizontal row across its upper half'). If the object carries a distinguishing mark (a chip, a patch, a crack), record that mark's exact shape and exact position on the object so the next page can redraw it identically. One sentence per object. Only objects from the provided list; skip ones not visible." },
  },
  required: ["states"],
  additionalProperties: false,
};

export async function extractSceneState(imageB64, { objectNames = [] }, mediaType = "image/jpeg") {
  const system =
    "You record continuity state for a children's picture book. Describe ONLY what is literally visible — this exact text will be handed to the illustrator of the NEXT page as binding fact, so precision about size, position, orientation and the layout of marks/contents matters more than prose style.";
  const content = `Key objects to record: ${objectNames.join(", ") || "(none declared)"}.\n\nRecord each one's exact current visible state.`;
  if (useOpenAI) {
    return openaiJson({
      model: OPENAI_FAST_MODEL,
      system,
      content,
      schema: SCENE_STATE_SCHEMA,
      images: [{ b64: imageB64, mime: mediaType }],
      maxTokens: 1200,
    });
  }
  if (useVertex) {
    return vertexGenerate({
      model: VERTEX_FAST_MODEL,
      system,
      parts: [{ inlineData: { mimeType: mediaType, data: imageB64 } }, { text: content }],
      schema: SCENE_STATE_SCHEMA,
      maxTokens: 1200,
    });
  }
  const response = await (await getClient()).messages.create({
    model: MODEL,
    max_tokens: 800,
    system,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: imageB64 } },
          { type: "text", text: content },
        ],
      },
    ],
    output_config: { format: { type: "json_schema", schema: SCENE_STATE_SCHEMA } },
  });
  const text = response.content.find((b) => b.type === "text")?.text ?? "";
  return { data: JSON.parse(text), cost: usageCost(response.usage) };
}

export async function eyeRuleQA(imageB64, mediaType = "image/jpeg") {
  const system = `You QA children's book illustrations for MyPhonicsBooks. The rule you check is the EYE RULE: every character or animal eye must be a small SOLID BLACK FILLED dot/oval — no white sclera, no catchlight, no glint, no highlight, no coloured iris, no outlined-but-unfilled eyes. Closed eyes (curved lines) are fine. Images with no eyes pass. Be strict: a single white pixel highlight inside an eye is a FAIL.
Eye dots must also be PROPORTIONAL to the creature: a stray black blotch or smear on a face, or an eye dot grossly oversized for a small creature (a snail, insect or bird), is a FAIL — small creatures get minuscule dots (a snail's eyes sit at the tips of its stalks, nowhere else).

You ALSO check FACE COMPLETENESS: every face drawn from the front or three-quarter view must have its basic features actually drawn — eyes, nose and mouth. A face with eyebrows, eyes, blush and a mouth but NO NOSE has shipped in a finished book; nobody noticed because nobody was asked. A profile or turned-away head is exempt; a deliberately simplified background figure too small to carry features is exempt.

HOW TO ANSWER — do this in order, and do not skip steps 1-2:
1. "eyes_seen": for EACH character, describe literally what you can see inside the outline of each eye — the shapes and the colours, in the order they appear ("a white almond shape with a smaller black circle inside it", or "one solid black oval, no other colour"). Describe what is actually there, not what the house style says should be there.
2. "features_seen": for EACH face, list the features actually drawn (eyes / eyebrows / nose / mouth) and name any that are missing on a front or three-quarter face.
3. Only then decide "pass". pass is FALSE if what you described contains ANY white, grey or coloured area inside an eye outline — including a white almond with a black pupil sitting in it, which is the single most common failure — OR if a front/three-quarter face is missing its nose or mouth.`;
  const question = "Does this image pass the eye rule? Look closely at every eye.";
  if (useOpenAI) {
    return openaiJson({
      model: OPENAI_FAST_MODEL,
      system,
      content: question,
      schema: EYE_QA_SCHEMA,
      images: [{ b64: imageB64, mime: mediaType }],
      maxTokens: 2000,
    });
  }
  if (useVertex) {
    return vertexGenerate({
      model: VERTEX_FAST_MODEL,
      system,
      parts: [
        { inlineData: { mimeType: mediaType, data: imageB64 } },
        { text: "Does this image pass the eye rule? Look closely at every eye." },
      ],
      schema: EYE_QA_SCHEMA,
      maxTokens: 2000,
    });
  }
  const response = await (await getClient()).messages.create({
    model: MODEL,
    max_tokens: 1000,
    system,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: imageB64 } },
          { type: "text", text: "Does this image pass the eye rule? Look closely at every eye." },
        ],
      },
    ],
    output_config: { format: { type: "json_schema", schema: EYE_QA_SCHEMA } },
  });
  if (response.stop_reason === "refusal") return { data: { pass: true, eyes_seen: "", features_seen: "", reason: "qa-skipped" }, cost: 0 };
  const text = response.content.find((b) => b.type === "text")?.text ?? "";
  return { data: JSON.parse(text), cost: usageCost(response.usage) };
}
