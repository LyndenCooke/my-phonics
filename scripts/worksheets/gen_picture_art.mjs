// Draw the clipart the Level 4-8 picture sheets need (content/imageable.mjs),
// in the house style via Vertex, into worksheet-forge/artcache/.
//
// Hard spend cap (Lynden, 2026-10-02: $25). Every successful image is logged
// to artcache/_spend.json at Vertex's gemini-2.5-flash-image price, and the
// run stops before an image would cross the cap — across runs, not per run.
// Sequential with a courtesy gap; waits out 429s rather than hammering.
//
//   node scripts/worksheets/gen_picture_art.mjs            # draw what's missing
//   node scripts/worksheets/gen_picture_art.mjs --dry-run  # list + cost only
//   node scripts/worksheets/gen_picture_art.mjs --redo claw,saw   # redraw after QA
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const forge = (p) => import(path.join(ROOT, 'worksheet-forge', p).replace(/\\/g, '/').replace(/^([A-Z]):/, 'file:///$1:'));
const { clipart, isAllowed, hasGraphemeUnit } = await forge('content/content.mjs');
const { imageableFor, describe } = await forge('content/imageable.mjs');
const { ART_CACHE, generateSubject } = await forge('content/artgen.mjs');

const CAP_USD = 25;
const PER_IMAGE_USD = 0.039;
const SPEND = path.join(ART_CACHE, '_spend.json');
const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const redo = (args[args.indexOf('--redo') + 1] ?? '').split(',').filter((w) => args.includes('--redo') && w);

// Which words: every picture word that is decodable at the level its sound
// is taught (the sounds come from the worksheet plan).
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'marketing', 'worksheets_plan.json'), 'utf-8'));
const want = new Map(); // word -> description
for (const pack of plan) {
  if (pack.level < 4) continue;
  for (const sh of pack.sheets) {
    const g = sh.grapheme;
    if (!g) continue;
    for (const w of imageableFor(g, pack.level)) {
      if (isAllowed(w, pack.level) && hasGraphemeUnit(w, g, pack.level)) want.set(w, describe(w));
    }
  }
}
const index = clipart();
const todo = redo.length ? redo : [...want.keys()].filter((w) => !index.has(w));

fs.mkdirSync(ART_CACHE, { recursive: true });
const spend = fs.existsSync(SPEND) ? JSON.parse(fs.readFileSync(SPEND, 'utf-8')) : { usd: 0, images: [] };
console.log(`${todo.length} to draw · est $${(todo.length * PER_IMAGE_USD).toFixed(2)} · spent so far $${spend.usd.toFixed(2)} of $${CAP_USD}`);
if (dry) { console.log(todo.join(', ')); process.exit(0); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let drawn = 0;
for (const w of todo) {
  if (spend.usd + PER_IMAGE_USD > CAP_USD) { console.log(`CAP: stopping at $${spend.usd.toFixed(2)}`); break; }
  const file = path.join(ART_CACHE, `${w}.png`);
  let png = null;
  for (let attempt = 0; attempt < 4 && !png; attempt++) {
    try {
      png = await generateSubject(want.get(w) ?? describe(w));
    } catch (e) {
      if (e.status === 429 && attempt < 3) { const s = 20 * (attempt + 1); console.log(`  429 — waiting ${s}s`); await sleep(s * 1000); continue; }
      console.log(`  FAIL ${w}: ${e.message}`);
      if (/gcloud|auth|401|403/.test(e.message)) process.exit(2);
      break;
    }
  }
  if (!png) continue;
  fs.writeFileSync(file, png);
  spend.usd = +(spend.usd + PER_IMAGE_USD).toFixed(3);
  spend.images.push({ word: w, at: new Date().toISOString() });
  fs.writeFileSync(SPEND, JSON.stringify(spend, null, 1));
  drawn++;
  console.log(`  ${drawn}/${todo.length} ${w}  ($${spend.usd.toFixed(2)})`);
  await sleep(1500);
}
console.log(`done: ${drawn} drawn · total spend $${spend.usd.toFixed(2)}`);
