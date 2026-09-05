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
 * The input text is never the bare grapheme - a TTS model reads "s" as the
 * letter name "ess". See SPOKEN below for what is actually sent.
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

// WHAT THE MODEL IS GIVEN TO SPEAK.
// A TTS model reads its input as text, so a bare grapheme "s" comes out as the
// letter name "ess" whatever the instructions say (that is exactly what the
// first bank did). Every grapheme therefore maps to one of two inputs:
//   say  – a respelling the model can only voice as the sustained sound ("sss")
//   word – an example word plus the position of the target sound in it; the
//          instructions tell the model to say that one sound and nothing else.
// Stops and vowels have no respelling that reads cleanly, so they use a word.
const SPOKEN = {
  // L1
  s: { say: "sss" }, a: { word: "ant", at: "first" }, t: { word: "tap", at: "first" },
  p: { word: "pan", at: "first" }, i: { word: "ink", at: "first" }, n: { say: "nnn" },
  m: { say: "mmm" }, d: { word: "dog", at: "first" }, g: { word: "got", at: "first" },
  o: { word: "ox", at: "first" },
  // L2
  c: { word: "cat", at: "first" }, k: { word: "kit", at: "first" }, ck: { word: "duck", at: "last" },
  e: { word: "egg", at: "first" }, u: { word: "up", at: "first" }, r: { say: "rrr" },
  h: { word: "hat", at: "first" }, b: { word: "bat", at: "first" }, f: { say: "fff" },
  ff: { say: "fff" }, l: { say: "lll" }, ll: { say: "lll" }, ss: { say: "sss" },
  j: { word: "jam", at: "first" }, v: { say: "vvv" }, w: { word: "wet", at: "first" },
  x: { word: "box", at: "last" }, y: { word: "yes", at: "first" }, z: { say: "zzz" },
  // L3
  sh: { say: "shhh" }, nk: { word: "sink", at: "last" }, ch: { word: "chip", at: "first" },
  th: { say: "thhh" }, ng: { word: "sing", at: "last" }, qu: { word: "quick", at: "first" },
  zz: { say: "zzz" },
  // L4
  wh: { word: "when", at: "first" }, ay: { word: "day", at: "last" }, ee: { word: "bee", at: "last" },
  igh: { word: "high", at: "last" }, ow: { word: "blow", at: "last" }, oo: { word: "moon", at: "middle" },
  ar: { word: "car", at: "last" }, or: { word: "for", at: "last" }, air: { word: "hair", at: "last" },
  ir: { word: "bird", at: "middle" }, ou: { word: "out", at: "first" }, oy: { word: "boy", at: "last" },
  // L5
  "a-e": { word: "cake", at: "middle" }, "i-e": { word: "kite", at: "middle" },
  "o-e": { word: "bone", at: "middle" }, "u-e": { word: "cube", at: "middle" },
  ea: { word: "sea", at: "last" }, ie: { word: "pie", at: "last" }, oi: { word: "coin", at: "middle" },
  aw: { word: "saw", at: "last" }, ai: { word: "rain", at: "middle" }, oa: { word: "boat", at: "middle" },
  tch: { word: "catch", at: "last" }, dge: { word: "bridge", at: "last" }, kn: { word: "knee", at: "first" },
  wr: { word: "write", at: "first" }, mb: { word: "lamb", at: "last" }, gn: { word: "gnat", at: "first" },
  // L6
  ph: { say: "fff" }, ur: { word: "fur", at: "last" }, er: { word: "her", at: "last" },
  are: { word: "care", at: "last" }, ew: { word: "new", at: "last" }, ue: { word: "blue", at: "last" },
  // L7
  ire: { word: "fire", at: "last" }, ore: { word: "more", at: "last" }, ear: { word: "hear", at: "last" },
  oor: { word: "door", at: "last" }, ure: { word: "pure", at: "last" }, tion: { word: "station", at: "last" },
  // L8
  ous: { word: "famous", at: "last" }, able: { word: "table", at: "last" }, ible: { word: "terrible", at: "last" },
  cious: { word: "delicious", at: "last" }, tious: { word: "cautious", at: "last" }, sion: { word: "television", at: "last" },
};

// Stop consonants are where a synthetic voice adds a schwa ("buh" for /b/).
// Their instruction is stricter and the clip is expected to be very short.
const STOPS = new Set(["b", "d", "g", "p", "t", "k", "c", "ck", "j", "ch", "qu", "tch", "dge", "x", "nk"]);

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

function spoken(grapheme) {
  return SPOKEN[grapheme] || { say: grapheme.replace(/^-/, "").replace(/-/g, "") };
}

function inputFor(grapheme) {
  const sp = spoken(grapheme);
  return sp.say ?? sp.word;
}

function instructionsFor(grapheme, level) {
  const { sound } = describe(grapheme, level);
  const sp = spoken(grapheme);
  const stop = STOPS.has(grapheme)
    ? " This is a stop sound: make it as one short, clipped burst with NO vowel after it. Never say \"buh\", \"duh\", \"kuh\" or any \"uh\". Stop the moment the burst is made."
    : " Sustain it briefly and cleanly, about half a second.";
  const what = sp.say
    ? `The text "${sp.say}" is not a word and not a letter name: voice it as the single continuous speech sound ${sound}, the sound the letters "${grapheme}" make.`
    : `The text is the word "${sp.word}". Do NOT say the word. Say only its ${sp.at} sound, ${sound}, which is the sound the letters "${grapheme}" make in "${sp.word}". Leave every other sound of the word out.`;
  return [
    "Use clear standard British English (Received Pronunciation).",
    "Act as an expert synthetic phonics teacher recording one pure sound for a four-year-old.",
    what,
    stop,
    "Never say a letter name (not \"ess\", \"ay\", \"bee\"). No word, no sentence, no explanation, no background sound. Nothing before the sound and nothing after it.",
  ].join(" ");
}

async function synth(grapheme, level) {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      voice: VOICE,
      input: inputFor(grapheme),
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
    for (const t of targets) console.log(`  ${t.grapheme.padEnd(6)} L${t.level}  input="${inputFor(t.grapheme)}"  ${instructionsFor(t.grapheme, t.level).slice(0, 90)}…`);
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
