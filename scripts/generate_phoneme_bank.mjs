#!/usr/bin/env node
/**
 * Phoneme sound bank via OpenAI text-to-speech.
 *
 * Generates the pure sound for every grapheme on the ladder (the files the
 * PhonemePlayer plays from /sounds/{grapheme}.mp3), three takes each, so a
 * human can listen and keep the best. Nothing is overwritten until a take is
 * promoted. Run it once; the files are permanent and cost nothing to play.
 *
 *   OPENAI_API_KEY=sk-... node scripts/generate_phoneme_bank.mjs             # every grapheme, 3 takes
 *   node scripts/generate_phoneme_bank.mjs --only s,a,t,p --takes 5          # a few sounds, more takes
 *   node scripts/generate_phoneme_bank.mjs --dry-run                         # print the plan and cost, spend nothing
 *   node scripts/generate_phoneme_bank.mjs --promote s=2 --promote sh=1      # keep take 2 of /s/, take 1 of /sh/
 *   node scripts/generate_phoneme_bank.mjs --voice cedar                     # a different OpenAI voice
 *
 * Takes land in public/sounds/takes/{grapheme}-take-{n}.mp3 (gitignored).
 * Promoting copies the winner to public/sounds/{grapheme}.mp3 and keeps the
 * previous file as {grapheme}.previous.mp3 so a bad swap is one rename away.
 *
 * The key is read from the environment only. Never put it in browser code.
 * The voice is AI-generated; the reader says so on screen.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "myphonics_books", "data");
const SOUNDS = path.join(ROOT, "public", "sounds");
const TAKES = path.join(SOUNDS, "takes");

const args = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const DRY = args.includes("--dry-run");
const TAKE_COUNT = Number(flag("takes", 3));
const VOICE = flag("voice", "marin");
const MODEL = "gpt-4o-mini-tts";
const ONLY = (flag("only", "") || "").split(",").map((s) => s.trim()).filter(Boolean);
const PROMOTE = args.flatMap((a, i) => (a === "--promote" && args[i + 1] ? [args[i + 1]] : []));

// OpenAI list price for gpt-4o-mini-tts: $0.60 / 1M input text tokens and
// $12 / 1M output audio tokens. A one-second clip is roughly 25 audio tokens,
// so a whole bank of three takes each is well under a dollar.
const USD_PER_TAKE = 0.0006;

const graphemes = JSON.parse(fs.readFileSync(path.join(DATA, "graphemes_by_level.json"), "utf8"));
const pronunciations = JSON.parse(fs.readFileSync(path.join(DATA, "pronunciations.json"), "utf8"));

// Stop consonants are where a synthetic voice adds a schwa ("buh" for /b/).
// Their instruction is stricter and the clip is expected to be very short.
const STOPS = new Set(["b", "d", "g", "p", "t", "k", "c", "ck", "j", "ch", "qu"]);

function ladder() {
  const out = [];
  const seen = new Set();
  for (let level = 1; level <= 8; level++) {
    for (const g of graphemes[`level_${level}`]?.graphemes || []) {
      if (seen.has(g)) continue;
      seen.add(g);
      out.push({ grapheme: g, level });
    }
  }
  return out;
}

function fileKey(grapheme) {
  // Matches PhonemePlayer.getSoundUrl: split digraphs use an underscore,
  // suffixes drop their leading dash.
  return grapheme.replace(/^-/, "").replace(/-/g, "_");
}

function describe(grapheme, level) {
  const entry = pronunciations[grapheme.replace(/^-/, "")];
  const sounds = (entry?.sounds || []).filter((s) => s.from_level <= level).sort((a, b) => a.from_level - b.from_level);
  const first = sounds[0];
  if (first) return { sound: first.sound, examples: first.examples.slice(0, 3) };
  if (grapheme.includes("-")) {
    const v = grapheme[0];
    return { sound: `the long /${v}/ sound of the split digraph ${grapheme}`, examples: [] };
  }
  return { sound: `/${grapheme.replace(/^-/, "")}/`, examples: [] };
}

function instructionsFor(grapheme, level) {
  const { sound, examples } = describe(grapheme, level);
  const ex = examples.length ? ` It is the sound heard at the start or middle of ${examples.join(", ")}.` : "";
  const stop = STOPS.has(grapheme)
    ? " This is a stop sound: make it as one short, clipped burst with NO vowel after it. Never say \"buh\", \"duh\", \"kuh\" or any \"uh\". Stop the moment the burst is made."
    : " Sustain it briefly and cleanly, about half a second.";
  return [
    "Use clear standard British English (Received Pronunciation).",
    "Act as an expert synthetic phonics teacher recording a sound for a four-year-old.",
    `Produce only the pure phoneme ${sound} written "${grapheme}".${ex}`,
    stop,
    "Do not say the letter name. Do not add a word, a sentence, an explanation or any background sound. Nothing before it and nothing after it.",
  ].join(" ");
}

async function synth(grapheme, level) {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      voice: VOICE,
      input: grapheme.replace(/^-/, "").replace(/-/g, ""),
      instructions: instructionsFor(grapheme, level),
      response_format: "mp3",
    }),
  });
  if (!res.ok) throw new Error(`openai ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return Buffer.from(await res.arrayBuffer());
}

function promote(spec) {
  const [g, n] = spec.split("=");
  const src = path.join(TAKES, `${fileKey(g)}-take-${n}.mp3`);
  const dst = path.join(SOUNDS, `${fileKey(g)}.mp3`);
  if (!fs.existsSync(src)) throw new Error(`no such take: ${src}`);
  if (fs.existsSync(dst)) fs.copyFileSync(dst, path.join(SOUNDS, `${fileKey(g)}.previous.mp3`));
  fs.copyFileSync(src, dst);
  console.log(`promoted ${g} take ${n} → ${path.relative(ROOT, dst)}`);
}

async function main() {
  if (PROMOTE.length) {
    for (const p of PROMOTE) promote(p);
    return;
  }
  const targets = ladder().filter((t) => !ONLY.length || ONLY.includes(t.grapheme));
  if (!targets.length) { console.error("nothing to do"); process.exit(1); }
  const jobs = targets.length * TAKE_COUNT;
  console.log(`${targets.length} graphemes × ${TAKE_COUNT} takes = ${jobs} clips, voice "${VOICE}", ≈ $${(jobs * USD_PER_TAKE).toFixed(2)}`);
  if (DRY) {
    for (const t of targets) console.log(`  ${t.grapheme.padEnd(6)} L${t.level}  ${instructionsFor(t.grapheme, t.level).slice(0, 110)}…`);
    return;
  }
  if (!process.env.OPENAI_API_KEY) { console.error("Set OPENAI_API_KEY in the environment (never in the site)."); process.exit(1); }
  fs.mkdirSync(TAKES, { recursive: true });
  for (const t of targets) {
    for (let n = 1; n <= TAKE_COUNT; n++) {
      const out = path.join(TAKES, `${fileKey(t.grapheme)}-take-${n}.mp3`);
      if (fs.existsSync(out)) { console.log(`  skip ${t.grapheme} take ${n} (exists)`); continue; }
      try {
        fs.writeFileSync(out, await synth(t.grapheme, t.level));
        console.log(`  ok   ${t.grapheme} take ${n}`);
      } catch (e) {
        console.error(`  FAIL ${t.grapheme} take ${n}: ${e.message}`);
      }
    }
  }
  console.log(`\nListen in ${path.relative(ROOT, TAKES)}, then: node scripts/generate_phoneme_bank.mjs --promote s=2 --promote a=1 ...`);
}

main().catch((e) => { console.error(e); process.exit(1); });
