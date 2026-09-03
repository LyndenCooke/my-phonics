// Per-book narration for the online reader: one recording per story page
// (the sentence, read warmly) and one per unique word (so a child can tap
// any word and hear it). Generated ONCE when a book is assembled and stored
// next to its images, so reading costs nothing afterwards.
//
// Voice and settings are the SAME as the library's audio (George, see
// generate_sentence_audio_canonical.mjs at the repo root), so a family-made
// book sounds like every other MyPhonicsBooks book. The pause after each
// full stop is the same trick the library needed too.
//
// Cost model (ElevenLabs Creator tier, ~$0.00022 per credit): words go
// through turbo (0.5 credit/char), sentences through multilingual_v2 (1
// credit/char) for warmth. A six-page book is roughly 60 words + 6 sentences
// ≈ 0.10–0.15 USD. Every call is a durable spend attempt under the book's
// cap, exactly like an image, so the ledger sees it.
import { cfg } from "./env.mjs";
import * as db from "./db.mjs";
import { saveImage } from "./storage.mjs";
import { beginPaidCall, completePaidCall, failPaidCall, withSpendContext } from "./spend.mjs";

const VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"; // George
const WORD_MODEL = "eleven_turbo_v2_5";
const SENTENCE_MODEL = "eleven_multilingual_v2";
const USD_PER_CREDIT = 0.00022;
const CREDITS_PER_CHAR = { [WORD_MODEL]: 0.5, [SENTENCE_MODEL]: 1 };
// Studio-quality is wasted on a phone speaker; 22 kHz / 32 kbps keeps a whole
// book's audio under a megabyte.
const OUTPUT_FORMAT = "mp3_22050_32";
const CONCURRENCY = 2; // ElevenLabs starter tiers allow 2–5 parallel requests

export function audioKey() {
  return process.env.ELEVENLABS_API_KEY || cfg.ELEVEN_LABS_API || "";
}

/** Unique spoken words across the story pages, keyed lower-case, first-seen casing kept for the voice. */
export function wordsOf(pages) {
  const seen = new Map();
  for (const p of pages || []) {
    if (p.type !== "story" || !p.text) continue;
    for (const raw of String(p.text).split(/\s+/)) {
      const clean = raw.replace(/[^A-Za-z']/g, "").replace(/^'+|'+$/g, "");
      if (!clean) continue;
      const key = clean.toLowerCase();
      if (!seen.has(key)) seen.set(key, clean);
    }
  }
  return seen;
}

/** What still needs recording: sentences per story page and words, minus anything already stored. */
export function audioPlan(pages, { force = false } = {}) {
  const sentences = [];
  (pages || []).forEach((p, i) => {
    if (p.type !== "story" || !p.text) return;
    if (!force && p.audio?.sentence) return;
    sentences.push({ index: i, text: String(p.text) });
  });
  const have = new Set();
  if (!force) {
    for (const p of pages || []) for (const w of Object.keys(p.audio?.words || {})) have.add(w);
  }
  const words = [...wordsOf(pages)].filter(([key]) => !have.has(key)).map(([key, spoken]) => ({ key, spoken }));
  return { sentences, words };
}

export function estimateUsd(text, model) {
  return Number((String(text).length * (CREDITS_PER_CHAR[model] || 1) * USD_PER_CREDIT).toFixed(5));
}

function withSentencePauses(text) {
  return text.replace(/([.!?])\s+/g, '$1 <break time="0.5s" /> ');
}

async function tts(text, model, call) {
  const est = Math.max(0.001, estimateUsd(text, model));
  const receipt = await beginPaidCall({ call, provider: "elevenlabs", model, estimateUsd: est, requestMeta: { text } });
  let res;
  try {
    res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=${OUTPUT_FORMAT}`, {
      method: "POST",
      headers: {
        "xi-api-key": audioKey(),
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
        ...(receipt?.clientRequestId ? { "X-Client-Request-Id": receipt.clientRequestId } : {}),
      },
      body: JSON.stringify({
        text: model === SENTENCE_MODEL ? withSentencePauses(text) : text,
        model_id: model,
        voice_settings: model === SENTENCE_MODEL
          ? { stability: 0.4, similarity_boost: 0.75, style: 0.35, speed: 0.9 }
          : { stability: 0.5, similarity_boost: 0.75 },
      }),
    });
  } catch (e) {
    await failPaidCall(receipt, e);
    throw e;
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(`elevenlabs ${res.status}: ${body.slice(0, 200)}`);
    // 4xx is refused before synthesis and is never billed.
    await failPaidCall(receipt, err, { definitelyUnbilled: res.status >= 400 && res.status < 500 });
    throw err;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const billed = Number(res.headers.get("x-character-count") || text.length);
  await completePaidCall(receipt, {
    costUsd: estimateUsd("x".repeat(billed), model),
    providerRequestId: res.headers.get("request-id") || null,
    usage: { characters: billed },
  });
  return buf;
}

async function mapLimit(items, limit, fn) {
  const out = [];
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

/**
 * Record everything the reader needs for one finished book and write the
 * URLs into its pages. Idempotent: a second call records only what is
 * missing. Returns a summary; throws only when the book cannot be found or
 * no key is configured (callers at the finish line catch and carry on — a
 * book without sound is still a book).
 */
export async function generateBookAudio(bookId, { force = false } = {}) {
  if (!audioKey()) throw new Error("ELEVEN_LABS_API is not configured — narration skipped");
  const book = await db.getBook(bookId);
  if (!book?.pages) throw new Error("book has no pages yet");
  const pages = book.pages.map((p) => ({ ...p }));
  const plan = audioPlan(pages, { force });
  if (!plan.sentences.length && !plan.words.length) return { recorded: 0, skipped: true };

  const job = book.progress?.job || {};
  job.spendSeq = job.spendSeq || {};
  const seqKey = `e${Number(job.spendEpoch || 0)}:audio`;
  const spendCtx = {
    bookId, step: "audio", epoch: job.spendEpoch || 0,
    capUsd: job.capUsd, sequence: Number(job.spendSeq[seqKey]) || 0,
  };

  const wordUrls = {};
  let recorded = 0;
  await withSpendContext(spendCtx, async () => {
    await mapLimit(plan.words, CONCURRENCY, async ({ key, spoken }) => {
      const buf = await tts(spoken, WORD_MODEL, `word-${key}`);
      wordUrls[key] = await saveImage(bookId, `w-${key}.mp3`, buf);
      recorded += 1;
    });
    await mapLimit(plan.sentences, CONCURRENCY, async ({ index, text }) => {
      const buf = await tts(text, SENTENCE_MODEL, `sentence-${index}`);
      pages[index].audio = { ...(pages[index].audio || {}), sentence: await saveImage(bookId, `s-${index}.mp3`, buf) };
      recorded += 1;
    });
  });
  job.spendSeq[seqKey] = spendCtx.sequence;

  // Every story page carries the words IT uses, so a page renders with
  // nothing but itself (the share page and the reader both read one page).
  for (const p of pages) {
    if (p.type !== "story" || !p.text) continue;
    const mine = {};
    for (const [key] of wordsOf([p])) {
      const url = wordUrls[key] || p.audio?.words?.[key];
      if (url) mine[key] = url;
    }
    p.audio = { ...(p.audio || {}), words: mine };
  }

  await db.updateBook(bookId, {
    pages,
    progress: { ...(book.progress || {}), job: book.progress?.job ? job : book.progress?.job },
  });
  return { recorded, words: plan.words.length, sentences: plan.sentences.length };
}
