/**
 * Single source-of-truth audio generator for MyPhonicsBooks.
 *
 * Reads sentences from `.scratch/canonical_sentences.json` — which is
 * extracted from `src/lib/interactiveBookData*.ts` (the on-screen text).
 * That keeps the spoken audio aligned with what the child sees.
 *
 * Re-extract the JSON when interactive text changes:
 *   node scripts/extract_canonical_sentences.mjs
 *
 * Generate audio:
 *   ELEVENLABS_API_KEY=... node generate_sentence_audio_canonical.mjs
 *
 * Pass `--force` to overwrite existing mp3s. Otherwise existing files
 * are kept (use this when adding new keys without re-billing for old).
 *
 * Each generated mp3 has a sidecar `.txt` with the text it was made
 * from. On future runs, if a key's text differs from its sidecar, the
 * mp3 is regenerated automatically — this prevents the drift problem
 * we hit on 2026-05-16 (audio matched an old draft of L2.1).
 */
import fs from 'fs';
import path from 'path';
import https from 'https';

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error('Missing ELEVENLABS_API_KEY env var.');
  process.exit(1);
}

const VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'; // George
const OUTPUT_DIR = path.resolve('public/sounds/sentences');
const SENTENCES_FILE = path.resolve('.scratch/canonical_sentences.json');
const FORCE = process.argv.includes('--force');

if (!fs.existsSync(SENTENCES_FILE)) {
  console.error(`Missing ${SENTENCES_FILE}. Run the extractor first.`);
  process.exit(1);
}

const SENTENCES = JSON.parse(fs.readFileSync(SENTENCES_FILE, 'utf8'));
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

/**
 * The text sent to ElevenLabs gets an explicit pause after each sentence-
 * ending mark — without it George runs straight through full stops, which
 * parents flagged ("doesn't pause at full stops"). The sidecar .txt keeps
 * the ORIGINAL canonical text so drift detection still compares apples to
 * apples; only the API payload is transformed.
 */
function withSentencePauses(text) {
  return text.replace(/([.!?])\s+/g, '$1 <break time="0.5s" /> ');
}

function generateAudio(key, text) {
  return new Promise((resolve, reject) => {
    const outPath = path.join(OUTPUT_DIR, `${key}.mp3`);
    const body = JSON.stringify({
      text: withSentencePauses(text),
      // multilingual_v2 with lower stability + style reads with warmth and
      // intonation; monolingual_v1 @ 0.75 stability was flat ("no emotion").
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.4, similarity_boost: 0.75, style: 0.35, speed: 0.9 },
    });

    const options = {
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${VOICE_ID}`,
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        let errBody = '';
        res.on('data', d => errBody += d);
        res.on('end', () => reject(new Error(`${res.statusCode} for ${key}: ${errBody}`)));
        return;
      }
      const file = fs.createWriteStream(outPath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        fs.writeFileSync(path.join(OUTPUT_DIR, `${key}.txt`), text, 'utf8');
        resolve();
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function needsRegen(key, text) {
  const mp3Path = path.join(OUTPUT_DIR, `${key}.mp3`);
  const txtPath = path.join(OUTPUT_DIR, `${key}.txt`);
  if (FORCE) return true;
  if (!fs.existsSync(mp3Path)) return true;
  if (!fs.existsSync(txtPath)) return true;
  // Strip a leading BOM and trailing whitespace before comparing. Six sidecars
  // were written with a BOM, which made this compare false on every run and
  // would have re-billed ElevenLabs for audio that was already correct.
  const onDisk = fs.readFileSync(txtPath, 'utf8').replace(/^﻿/, '').trim();
  return onDisk !== text.trim();
}

async function main() {
  const entries = Object.entries(SENTENCES);
  console.log(`Total keys: ${entries.length}. Force=${FORCE}`);
  let ok = 0, skip = 0, fail = 0;

  for (const [key, text] of entries) {
    if (!needsRegen(key, text)) {
      skip++;
      continue;
    }
    try {
      await generateAudio(key, text);
      ok++;
      console.log(`OK   ${key}`);
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      fail++;
      console.error(`FAIL ${key}: ${e.message}`);
    }
  }

  console.log(`\nGenerated: ${ok}, Skipped (up-to-date): ${skip}, Failed: ${fail}`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
