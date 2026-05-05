// Regenerate sentence audio for specified book pages by reading the
// canonical sentences directly out of the interactive book data files.
// Usage: node scripts/regen_audio_from_data.mjs L3_2 L3_3 L3_1:8
// (use ID alone to regen all 8 pages, or ID:N to regen page N only)

import fs from 'fs';
import path from 'path';
import https from 'https';

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) { console.error('Set ELEVENLABS_API_KEY first.'); process.exit(1); }
const VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'; // George
const OUTPUT_DIR = 'C:/Users/ASUS/myphonicsbooks/public/sounds/sentences';

const targets = process.argv.slice(2);
if (!targets.length) { console.error('Pass at least one book ID, e.g. L3_2 or L3_2:5'); process.exit(1); }

function loadBookSentences(bookId) {
  const m = bookId.match(/^L(\d)_(\d+)$/);
  if (!m) throw new Error(`Bad id: ${bookId}`);
  const lvl = +m[1], sub = +m[2];
  const file = lvl === 1
    ? 'src/lib/interactiveBookData.ts'
    : `src/lib/interactiveBookDataL${lvl}.ts`;
  const src = fs.readFileSync(file, 'utf8');
  const blockRe = new RegExp(`BOOK_L${lvl}_${sub}_PAGES[\\s\\S]*?\\n\\];`, 'm');
  const block = src.match(blockRe);
  if (!block) throw new Error(`block not found for ${bookId}`);
  const pages = [];
  const pageRe = /type:\s*'story',\s*sentences:\s*\[([^\]]+)\]/g;
  let pm;
  while ((pm = pageRe.exec(block[0])) !== null) {
    try { pages.push(new Function(`return [${pm[1]}]`)().join(' ')); }
    catch { pages.push(''); }
  }
  return pages;
}

function tts(text, outFile) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      text, model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true },
    });
    const req = https.request({
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
      method: 'POST',
      headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    }, res => {
      if (res.statusCode !== 200) {
        let e = ''; res.on('data', c => e += c);
        res.on('end', () => reject(new Error(`HTTP ${res.statusCode}: ${e}`))); return;
      }
      const chunks = []; res.on('data', c => chunks.push(c));
      res.on('end', () => { fs.writeFileSync(outFile, Buffer.concat(chunks)); resolve(); });
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

(async () => {
  for (const t of targets) {
    const [bookId, onePage] = t.split(':');
    const pages = loadBookSentences(bookId);
    const targetPages = onePage ? [+onePage] : pages.map((_, i) => i + 1);
    for (const p of targetPages) {
      const text = pages[p - 1];
      if (!text) { console.error(`(skip ${bookId}_p${p}: no text)`); continue; }
      const out = path.join(OUTPUT_DIR, `${bookId}_p${p}.mp3`);
      if (fs.existsSync(out)) fs.unlinkSync(out);
      console.log(`→ ${bookId}_p${p}: ${text.slice(0, 80)}${text.length>80?'…':''}`);
      await tts(text, out);
    }
  }
  console.log('Done.');
})().catch(e => { console.error(e); process.exit(1); });
