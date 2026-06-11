// ---------------------------------------------------------------------------
// generate-mascot.mjs — make a header-tile character mascot from a book's
// reference art. Sends the source illustration(s) to gemini-2.5-flash-image and
// asks for ONLY the characters on a plain white background (no scene), so the
// result drops cleanly into the worksheet header tile (white bg → multiply).
//
//   node scripts/generate-mascot.mjs <outKey> <refImage> [refImage2...]
//   e.g. node scripts/generate-mascot.mjs tap-mascot \
//        ../myphonics_books/output/images/L1_1_B1/cover.png
// Then trim: node scripts/trim-clipart.mjs tap-mascot
// ---------------------------------------------------------------------------

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const PROJECT = process.env.GCP_PROJECT || 'iron-entropy-496317-q9';
const MODEL = 'gemini-2.5-flash-image';
const URL = `https://aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/global/publishers/google/models/${MODEL}:generateContent`;
const GCLOUD = process.env.GCLOUD_PATH || 'C:\\Users\\ASUS\\AppData\\Local\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd';
const OUT = path.join(process.cwd(), 'public', 'clipart');

const [outKey, ...refs] = process.argv.slice(2);
if (!outKey || !refs.length) {
  console.error('usage: node scripts/generate-mascot.mjs <outKey> <refImage> [more...]');
  process.exit(1);
}

const PROMPT =
  'Using the attached children\'s book illustration(s) as the character and style ' +
  'reference, draw ONLY the same little boy (short brown hair, green-and-white ' +
  'striped t-shirt, dark trousers) sitting happily together with the same chubby ' +
  'orange tabby cat. Keep their exact look and the soft, warm children\'s book ' +
  'illustration style with clean outlines. Plain pure WHITE background — remove the ' +
  'room, window, wooden floor and striped rug completely. Both characters centred ' +
  'and close together, filling most of the frame. No floor shadow, no border, no ' +
  'text, no letters, no numbers. Square image.';

function token() {
  return execSync(`"${GCLOUD}" auth print-access-token`, { encoding: 'utf8' }).trim();
}

const parts = refs.map((f) => ({
  inlineData: { mimeType: 'image/png', data: fs.readFileSync(path.resolve(f)).toString('base64') },
}));
parts.push({ text: PROMPT });

const res = await fetch(URL, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig: { responseModalities: ['IMAGE'] } }),
});
if (!res.ok) {
  console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  process.exit(1);
}
const json = await res.json();
const p = json?.candidates?.[0]?.content?.parts ?? [];
const img = p.find((x) => x.inlineData)?.inlineData;
if (!img?.data) {
  console.error('no image in response');
  process.exit(1);
}
fs.writeFileSync(path.join(OUT, `${outKey}.png`), Buffer.from(img.data, 'base64'));
console.log(`✓ ${outKey}.png (${(Buffer.from(img.data, 'base64').length / 1024).toFixed(0)} KB)`);
