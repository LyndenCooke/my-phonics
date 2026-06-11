// ---------------------------------------------------------------------------
// trim-clipart.mjs — tightly crop the white border off generated clipart so the
// object fills its own frame. This is what makes a picture read "large" in a
// card WITHOUT scaling-and-clipping the object. Pairs with mix-blend-mode:
// multiply at render time (any white left inside the bbox disappears on a white
// card). Originals are backed up to public/clipart/_raw/ first.
//
//   node scripts/trim-clipart.mjs               # trim the default sound_a set
//   node scripts/trim-clipart.mjs cat pan ant   # trim specific keys
// ---------------------------------------------------------------------------

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const DIR = path.join(process.cwd(), 'public', 'clipart');
const RAW = path.join(DIR, '_raw');
fs.mkdirSync(RAW, { recursive: true });

const DEFAULT = ['cat', 'mat', 'hat', 'bag', 'pan', 'ant', 'axe', 'rat', 'jam'];
const keys = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT;

const PAD = 0.04; // 4% breathing margin re-added around the trimmed object

for (const key of keys) {
  const file = path.join(DIR, `${key}.png`);
  if (!fs.existsSync(file)) {
    console.warn(`! ${key}.png not found — skipping`);
    continue;
  }
  // Back up the original once.
  const backup = path.join(RAW, `${key}.png`);
  if (!fs.existsSync(backup)) fs.copyFileSync(file, backup);

  const src = fs.readFileSync(backup); // always trim from the pristine original
  try {
    const trimmed = await sharp(src)
      .trim({ background: '#ffffff', threshold: 18 })
      .toBuffer();
    const meta = await sharp(trimmed).metadata();
    const pad = Math.round(Math.max(meta.width, meta.height) * PAD);
    const out = await sharp(trimmed)
      .extend({ top: pad, bottom: pad, left: pad, right: pad, background: '#ffffff' })
      .png()
      .toBuffer();
    fs.writeFileSync(file, out);
    console.log(`✓ ${key}.png trimmed ${meta.width}x${meta.height} (+${pad}px pad)`);
  } catch (e) {
    console.error(`✗ ${key}: ${e.message}`);
  }
}
console.log('done');
