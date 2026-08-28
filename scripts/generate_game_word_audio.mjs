/**
 * Generate ElevenLabs (George) MP3s for every word the phonics games can
 * speak: the WORD_BANK words (What sound is it? / Finish the word) and the
 * JOURNEY_LEVELS tricky words (Hear it, find it).
 *
 * Word lists are extracted from the TS sources at run time so the audio
 * library can never drift from the game data (the same drift problem the
 * sentence audio hit on 2026-05-16).
 *
 * Files land in public/sounds/words/{key}.mp3 with key = lowercase word
 * stripped of non-letters — the same convention the book reader and
 * lib/soundGameWords.ts speakWord() use. Existing files are kept.
 *
 *   ELEVENLABS_API_KEY=... node scripts/generate_game_word_audio.mjs
 */
import fs from 'fs';
import path from 'path';
import https from 'https';

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error('Missing ELEVENLABS_API_KEY env var.');
  process.exit(1);
}

const VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'; // George — same voice as the reader
const OUTPUT_DIR = path.resolve('public/sounds/words');

// ── Extract word lists from the TS sources ──────────────────────────

function quotedStrings(block) {
  return [...block.matchAll(/'([^']+)'/g)].map(m => m[1]);
}

const gameWordsTs = fs.readFileSync(path.resolve('src/lib/soundGameWords.ts'), 'utf8');
const bankMatch = gameWordsTs.match(/export const WORD_BANK[^=]*=\s*\{([\s\S]*?)\n\};/);
if (!bankMatch) { console.error('Could not find WORD_BANK in soundGameWords.ts'); process.exit(1); }
// WORD_BANK values are quoted words; quoted KEYS ('a-e', '-ous') contain
// non-letters and normalise to keys we never request, so no need to filter.
const bankWords = quotedStrings(bankMatch[1]);

const levelsTs = fs.readFileSync(path.resolve('src/lib/levels8.ts'), 'utf8');
const trickyWords = [...levelsTs.matchAll(/trickyWords:\s*\[([^\]]*)\]/g)]
  .flatMap(m => quotedStrings(m[1]));

// Green-words ledger (Milo's Cannon, Word Pop, Finish the Word pools)
const ledger = JSON.parse(fs.readFileSync(path.resolve('public/green_words.json'), 'utf8'));
const ledgerWords = (ledger.words ?? []).map(w => w.word);

// Sound Spotter object bank
const safariTs = fs.readFileSync(path.resolve('src/games/soundSafari/safariData.ts'), 'utf8');
const safariWords = [...safariTs.matchAll(/word:\s*'([^']+)'/g)].map(m => m[1]);

const allWords = [...new Set([...bankWords, ...trickyWords, ...ledgerWords, ...safariWords])];
const toKey = w => w.toLowerCase().replace(/[^a-z]/g, '');

const missing = allWords
  .map(w => ({ word: w, key: toKey(w) }))
  .filter(({ key }) => key && !fs.existsSync(path.join(OUTPUT_DIR, `${key}.mp3`)));

console.log(`Game words: ${allWords.length} total, ${missing.length} missing MP3s.`);

// ── Generate ────────────────────────────────────────────────────────

function generate(word, key) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      text: word,
      model_id: 'eleven_turbo_v2_5', // matches the existing word library
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    });
    const req = https.request({
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${VOICE_ID}`,
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      if (res.statusCode !== 200) {
        let err = '';
        res.on('data', d => err += d);
        res.on('end', () => reject(new Error(`HTTP ${res.statusCode} for "${word}": ${err}`)));
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        fs.writeFileSync(path.join(OUTPUT_DIR, `${key}.mp3`), Buffer.concat(chunks));
        resolve();
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

let ok = 0, fail = 0;
for (const { word, key } of missing) {
  try {
    await generate(word, key);
    ok++;
    console.log(`OK   ${key}`);
    await new Promise(r => setTimeout(r, 400));
  } catch (e) {
    fail++;
    console.error(`FAIL ${key}: ${e.message}`);
  }
}
console.log(`\nGenerated: ${ok}, Failed: ${fail}, Already present: ${allWords.length - missing.length}`);
if (fail > 0) process.exit(1);
