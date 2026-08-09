// Claude API calls for the custom-book pipeline: story writing, decodability
// review, and the eye-rule vision QA on generated images. Costs are tracked
// per call so each book gets a real cost breakdown.
import { execFile } from "node:child_process";
import { cfg } from "./env.mjs";

const MODEL = "claude-opus-4-8";
// $ per 1M tokens
const PRICE_IN = 5.0;
const PRICE_OUT = 25.0;

let client = null;
// Lazy dynamic import: the Anthropic path only runs when a real sk-ant- key is
// configured, which it never is in production (OpenAI is the backend there).
// A static import made the serverless bundle depend on a package the trace
// didn't ship, and the whole function died at cold start with
// ERR_MODULE_NOT_FOUND before serving a single request.
async function getClient() {
  if (!client) {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    client = new Anthropic({ apiKey: cfg.ANTHROPIC_API_KEY });
  }
  return client;
}

function usageCost(usage) {
  return (
    ((usage.input_tokens || 0) * PRICE_IN + (usage.output_tokens || 0) * PRICE_OUT) / 1_000_000
  );
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
    if ([429, 500, 502, 503, 504].includes(res.status)) return retry(`${res.status}`);
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
  return { data: JSON.parse(text), cost };
}

// ---------------- Vertex Gemini fallback (gcloud OAuth) ----------------
// Used when no real ANTHROPIC_API_KEY is configured. Same project/region as
// the offline book pipeline (see myphonics_books/scripts/generate_sound_books.py).
// Backend order: a real Anthropic key wins, then OpenAI, then Vertex Gemini.
// FORGE_LLM=vertex forces the old path.
const useOpenAI =
  !cfg.ANTHROPIC_API_KEY && Boolean(cfg.OPENAI_API_KEY) && process.env.FORGE_LLM !== "vertex";
const useVertex = !cfg.ANTHROPIC_API_KEY && !useOpenAI;
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

async function callJson({ system, content, schema, maxTokens = 16000, tier = "story" }) {
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
  required: ["title", "cover_brief", "setting", "key_objects", "cast", "pages", "focus_word_examples", "tricky_words_used", "read_words", "questions", "alien_words"],
  additionalProperties: false,
};

// Story shapes. One is chosen per book so consecutive books cannot converge on
// the same plot — which is exactly what happened when the writer was given a
// single fixed beat sequence: five books running were "child makes a thing for
// a relative, spills it, cleans up, is praised" (Lynden 2026-07-26).
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
  { name: "The swap", how: "The hero trades or exchanges things through the story, each swap changing what is possible, and ends up with what was actually needed all along." },
  { name: "Getting there", how: "A journey on foot across a real place with real obstacles — a hill, a puddle, a crowd, a wrong turn — with something at the end worth the walk. The place is the co-star." },
];

export async function writeStory({ level, child, focusSound, pagesCount, greenWords = [], progression = null, pronunciations = [], shape = null }) {
  const system = `You are the senior story writer for MyPhonicsBooks, a British systematic synthetic phonics programme (Letters and Sounds based, NOT Read Write Inc). You write decodable stories for children aged 4-8 that celebrate the child's own culture and background. British English throughout (colour, mum, favourite).

THE STORY COMES FROM THE SOUND, NOT FROM A THEME. Start from the focus sound "${focusSound}": brainstorm the best decodable words it unlocks, pick the ones with the most story potential, and build the most engaging story THOSE words can tell. Do not force the story around the child's hobbies — that constrains it. The child's world appears in what we SEE, not in what the plot must be.

HARD PHONICS RULES:
- Every word must be decodable using ONLY these taught graphemes: ${JSON.stringify(level.cumulative)}
- ...OR be one of these allowed tricky words: ${JSON.stringify(level.trickyWords)}
- WORD BANK — the child's full unlocked vocabulary (this level + all levels before it). Draw from it freely; you may also build other words from the taught graphemes: ${JSON.stringify(greenWords)}
- The child's first name "${child.name}" is allowed as a proper noun (names are exempt).
${pronunciations.length > 1 ? `- "${focusSound}" HAS MORE THAN ONE SOUND: ${pronunciations.map((p) => `${p.sound} as in ${p.examples.slice(0, 2).join(", ")}`).join("; ")}. The book must show BOTH — choose your focus words so at least one uses each sound, so the child learns to try both and pick the one that makes a real word. Never teach only half of a grapheme.
` : ""}- The FOCUS SOUND for this book is "${focusSound}". Use it in ONE to THREE different words across the whole book — three is a maximum, not a target, and one well-placed word in a strong story beats three crammed in. The sound is taught properly on the Sound Spotlight page regardless, so the story does NOT have to carry it. Never bend a sentence, or repeat the same showcase words page after page, to hit a count.
- If the perfect story word needs one sound from a level or two above, you may use it SPARINGLY (a word or two in the whole book) — the book automatically previews these as "Future Sounds". Never more than that.
- Do NOT use any other proper nouns unless fully decodable.
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

STORY RULES:
- Exactly ${pagesCount} pages.
- The hero is ${child.name}, age ${child.age ?? "5"}, from ${child.country || "the UK"}.
- The child's culture and home appear through what we SEE in the scenes (food, clothing, places, family life), guided by: ${child.cultureNotes || "everyday family life"}. Show culture with warmth and dignity — never stereotypes, never preachy text. (For flavour only, not plot: the child likes ${child.likes || "playing"}.)
- Emotional journey + Dear Zoo-style hooks: curiosity gaps, repetition with variation, a satisfying ending.
- For each page also write "scene": a rich one-sentence illustration brief (what we see, setting, action, mood). Scenes must be visually specific and culturally accurate.

STORY SHAPE — ${shape ? `THIS book must use this shape: **${shape.name}** — ${shape.how}` : "choose a shape that suits the sound"}.
DO NOT WRITE THE DEFAULT BOOK. There is one story these books fall into every single time, and it is now forbidden unless the shape above actually is it: *child decides to make something for a grown-up → assembles ingredients → spills or drops it → wipes it up → finishes it → gives it to the grown-up, who praises them.* If your draft is that story, throw it away and write a different one.
- The hero does NOT have to make or cook anything. Most children's stories are not about manufacturing an object.
- The problem does NOT have to be a spill, a drop or a breakage. Weather, a wrong guess, someone else's need, a shortage, a misunderstanding, being too small, running out of time, an animal, a lost thing, a queue, a change of plan — all better than another spill.
- The ending does NOT have to be handing the thing to an adult and being praised. A child can end by understanding something, deciding something, helping someone, being surprised, or simply enjoying what they made happen.
- The adults do not have to solve it, and the hero does not have to be perfect.

BEAT COVERAGE — the pictures must be able to TELL the story on their own:
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
- "key_objects": up to 3 recurring objects, each with "look" = one exact visual description (colour, material, size, distinguishing marks) that will be repeated verbatim in every illustration prompt where it appears. Describe ONLY the object's appearance — never where it sits or what it is doing ("a small silver metal teapot", NOT "a teapot simmering on the stove"): the description is reused on other pages, and placement written into it gets drawn in places it does not belong.
- "cast": EVERY named or recurring person in the story who is not ${child.name} — mum, dad, a friend, a shopkeeper. Maximum 3, and only people who actually appear. "id" = short lowercase id used on the pages ("mum", "dad"). EACH CAST MEMBER MUST BE SOMEBODY, NOT A CATEGORY: give them a name or a relationship a child would actually say — Mum, Dad, Nana, Auntie, Sam — and use THAT in the story text. Never let a story sentence call a person "the woman", "the man" or "the kids"; that is a label, not a character, and it reads as though the writer never decided who they were. Each cast member is ONE person (if a group appears, they are background, not cast). "who" = their role in one phrase; "appearance" = a FIXED, drawable description that will be repeated in every illustration they appear in: approximate age, build, hair, and the exact clothing they wear for the WHOLE book including colours ("a woman in her thirties, warm brown skin, a sage-green abaya with gold trim and a cream headscarf"). They wear the same outfit on every page — a character does not change clothes mid-story. Culturally accurate for ${child.country || "the UK"}, with the same warmth and dignity as the hero.
- "cover_brief": one sentence describing the COVER illustration — the hero in the single most joyful, most tempting moment of THIS story, with the story's central object clearly in shot, in the story's own setting. It must be a real moment from this book (usually the triumph), never the child's hobbies or a generic pose.

ALSO RETURN (for the practice pages of the printed book):
- "read_words": 6-8 decodable practice words from or related to the story, each fully decodable at this level, at least half containing "${focusSound}".
- "questions": exactly 3 short comprehension questions about THIS story, phrased for a grown-up to ask a 4-8 year old.
- "alien_words": exactly 4 made-up nonsense words (not real words) that are fully decodable at this level and each contain "${focusSound}".`;

  const content = `Write the ${pagesCount}-page decodable story now. Focus sound: "${focusSound}". Remember: every word decodable at Level ${level.level} or in the tricky list, focus sound in at least 3 words.`;
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
  const system = `You are the senior story writer for MyPhonicsBooks fixing decodability violations. Keep the same title, plot and scenes wherever possible — change only what is needed to remove the violations. Allowed graphemes: ${JSON.stringify(level.cumulative)}. Allowed tricky words: ${JSON.stringify(level.trickyWords)}. The name "${child.name}" is allowed. Focus sound "${focusSound}" should still appear in one to three words. British English. Exactly ${pagesCount} pages.

THE BOOK MUST STILL READ LIKE A BOOK. Removing a violation is never a licence to damage the prose: every sentence starts with a CAPITAL LETTER, proper nouns stay capitalised, and the whole story stays in ONE consistent tense (past tense unless the original was written in present). Do not drop articles, mangle word order, or leave telegraphic fragments to dodge a word — rewrite the sentence properly instead. If a violation cannot be removed without wrecking the sentence, rephrase the whole page.`;
  const content = `Original story:\n${JSON.stringify(story)}\n\nViolations to fix:\n${JSON.stringify(violations)}\n\nReturn the corrected story.`;
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
        },
        required: ["page", "emotion", "staging", "brief", "camera", "objects", "cast_present"],
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
6. ONE ROOM PER FRAME — a brief must only describe what exists INSIDE this page's location. NEVER say another room is "visible behind", "adjoining" or "in the background" — the illustrator will invent furniture (counters, shelves) that was never there and break the established view. If the character came from another room, show it through their action alone (carrying something, walking in), never through the background. Never introduce furniture into a location that its earlier pages did not have, and mention each object at most once per brief.
7. PROP AGREEMENT — every physical object named in the page TEXT must appear in the brief for that page (if the text says she got a wooden spoon, the spoon is in the picture). Conversely, do not stage an object the story has not brought into the scene.
   NUMBERS MUST MATCH. If the text says six holes, draw six; if it says "the kids came", draw more than one child; if it says a nail, the nail is visible. A child counts what is in the picture, and a picture that disagrees with the words teaches them not to trust it.
8. CREATURE EYES — if a small creature (snail, insect, bird) appears, its eyes are minuscule black dots proportional to its size (a snail's eyes sit at the tips of its stalks); say so in the brief so no oversized black blob lands on its face.

9. OBJECTS ON THIS PAGE — fill "objects" with ONLY the key objects a reader would actually SEE in this frame, each with the state it is in ON THIS PAGE ("bowl — empty, waiting on the mat"; "date balls — do not draw, they do not exist yet, the mix is still wet paste"). Leave the list EMPTY if none are visible.
   WHEN SOMETHING IS DAMAGED, SAY WHAT IS STILL INTACT. "The chair broke" is read as generic breakage and the illustrator escalates it into wreckage, which then contradicts the next page where it is simply mended. Name the damage narrowly and list what is untouched: "one front leg has come loose and that corner has sunk — the seat is whole and attached, the back is joined on, the other three legs are sound". Damage needs a stated limit exactly as object state does.
   The key-object descriptions you were given are the FINISHED look of each object. Anything the character MAKES during the story must not be listed until the page where it is finished — if the story ends with six date balls, pages 1-5 have no date balls in them, only ingredients and mixture. Listing it early is what puts the finished object in the picture before it has been made.

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
- "greeting": how a child says "hello" in the main local language, written as: word (language) — e.g. "Cześć! (Polish)". If English-speaking, use a warm local expression instead.${avoid.length ? `\n\nYOUR LAST ANSWER WAS REJECTED because it named: ${avoid.join(", ")}. These normally contain pork or alcohol. Do not mention them again in any form. Pick facts about something else entirely — landscape, wildlife, games, crafts, weather, language.` : ""}`;
  const res = await callJson({ system, content, schema: COUNTRY_SCHEMA, tier: "fast", maxTokens: 4000 });

  // Deterministic gate: re-ask (twice) naming what was wrong, then drop the
  // offending facts rather than print them.
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
    pass: { type: "boolean" },
    reason: { type: "string" },
  },
  required: ["eyes_seen", "pass", "reason"],
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
    mechanism_legible: { type: "string", description: "If the sentence describes an object physically interacting with another (fitting into, plugging, opening, breaking, pouring into, tying to, etc.): does the image draw the SECOND object/feature that the first one interacts with (e.g. a hole, gap, slot, container), and does the image show contact/alignment between them? A child who cannot read must be able to see the mechanism, not just both objects somewhere on the page. If the sentence describes no such interaction, say so and skip this check." },
    pass: { type: "boolean" },
    reason: { type: "string", description: "If failing: the specific, narrow thing to fix — never just 'regenerate the page'." },
  },
  required: ["named_objects", "action_shown", "object_states", "mechanism_legible", "pass", "reason"],
  additionalProperties: false,
};

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
export async function sceneConsistencyQA(imageB64, { sceneText, objectsBlock = "" }, mediaType = "image/jpeg") {
  const objectLines = objectsBlock.trim() || "(no key objects declared for this page)";
  const system =
    "You QA a children's picture-book illustration against the page it illustrates. Describe what you literally see before judging — a bare pass/fail rubber-stamps everything, because 'a nice picture of kids in a market' looks fine at a glance even when it fails to show the actual sentence. " +
    "Answer named_objects, action_shown, object_states and mechanism_legible with what is ACTUALLY IN THE IMAGE, not what you'd expect a good illustration to contain. Only then set pass. " +
    "pass is FALSE if: any object the sentence names is entirely absent from the image; the image shows a moment clearly before or after the sentence's action rather than the action itself; a key object is shown in a state that contradicts its declared state for this page (e.g. declared 'not yet plugged into the hole' but the image shows it already inserted, or vice versa); or the sentence describes one object physically interacting with a second (fitting into, plugging, opening, tying, pouring, etc.) and the image does not draw that second object/feature at all, or draws both objects with no visible contact between them — an object being merely present near another is NOT the same as the image showing them interact. A child who cannot read the words must be able to point at the picture and see the specific thing the sentence describes happening. " +
    "Minor artistic license is fine — this is not a check for a literal diagram. Fail only for a genuine, obvious mismatch a child's parent would notice.";
  const content =
    `PAGE TEXT: "${sceneText}"\n\nKEY OBJECTS for this page:\n${objectLines}\n\n` +
    "Does this image show the text and the declared object states correctly?";
  if (useOpenAI) {
    return openaiJson({
      model: OPENAI_FAST_MODEL,
      system,
      content,
      schema: SCENE_QA_SCHEMA,
      images: [{ b64: imageB64, mime: mediaType }],
      maxTokens: 2000,
    });
  }
  if (useVertex) {
    return vertexGenerate({
      model: VERTEX_FAST_MODEL,
      system,
      parts: [{ inlineData: { mimeType: mediaType, data: imageB64 } }, { text: content }],
      schema: SCENE_QA_SCHEMA,
      maxTokens: 2000,
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
    output_config: { format: { type: "json_schema", schema: SCENE_QA_SCHEMA } },
  });
  const text = response.content.find((b) => b.type === "text")?.text ?? "";
  return { data: JSON.parse(text), cost: usageCost(response.usage) };
}

export async function eyeRuleQA(imageB64, mediaType = "image/jpeg") {
  const system = `You QA children's book illustrations for MyPhonicsBooks. The rule you check is the EYE RULE: every character or animal eye must be a small SOLID BLACK FILLED dot/oval — no white sclera, no catchlight, no glint, no highlight, no coloured iris, no outlined-but-unfilled eyes. Closed eyes (curved lines) are fine. Images with no eyes pass. Be strict: a single white pixel highlight inside an eye is a FAIL.
Eye dots must also be PROPORTIONAL to the creature: a stray black blotch or smear on a face, or an eye dot grossly oversized for a small creature (a snail, insect or bird), is a FAIL — small creatures get minuscule dots (a snail's eyes sit at the tips of its stalks, nowhere else).

HOW TO ANSWER — do this in order, and do not skip step 1:
1. "eyes_seen": for EACH character, describe literally what you can see inside the outline of each eye — the shapes and the colours, in the order they appear ("a white almond shape with a smaller black circle inside it", or "one solid black oval, no other colour"). Describe what is actually there, not what the house style says should be there.
2. Only then decide "pass". If what you described contains ANY white, grey or coloured area inside an eye outline — including a white almond with a black pupil sitting in it, which is the single most common failure — then pass is FALSE.`;
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
  if (response.stop_reason === "refusal") return { data: { pass: true, eyes_seen: "", reason: "qa-skipped" }, cost: 0 };
  const text = response.content.find((b) => b.type === "text")?.text ?? "";
  return { data: JSON.parse(text), cost: usageCost(response.usage) };
}
