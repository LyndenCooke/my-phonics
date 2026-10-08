// Prints {"<level>:<grapheme>": n} — how many curated picture words each
// Level 4-8 sound has with art in the library right now. plan.py uses it to
// decide whether a sound gets a picture-led sheet (n >= 3) or a text one.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const forge = (p) => import(pathToFileURL(path.join(ROOT, 'worksheet-forge', p)).href);
const { hasClipart, isAllowed, hasGraphemeUnit } = await forge('content/content.mjs');
const { imageableFor } = await forge('content/imageable.mjs');

const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'marketing', 'worksheets_plan.json'), 'utf-8'));
const out = {};
for (const pack of plan) {
  for (const sh of pack.sheets) {
    const g = sh.grapheme;
    if (!g || pack.level < 4) continue;
    out[`${pack.level}:${g}`] = imageableFor(g, pack.level)
      .filter((w) => isAllowed(w, pack.level) && hasGraphemeUnit(w, g, pack.level) && hasClipart(w)).length;
  }
}
process.stdout.write(JSON.stringify(out));
