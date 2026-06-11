// ---------------------------------------------------------------------------
// QA gate check 3 — saturated-pixel measurement. The whole workbook palette is
// the level indigo plus greys and black, and every line-art asset is binarised
// B/W, so ANY saturated pixel whose hue is outside the indigo band means a
// colour artefact (the classic failure: a chroma-key marker bled into edges by
// a resize — see SKILL.md). Measured per rasterised page, never judged by eye
// (thin lines alias to false colour at viewing scale, so the threshold ignores
// isolated low-count noise only if it is achromatic; saturated non-indigo
// pixels must be exactly zero).
//
// Usage: node scripts/qa-saturation.mjs output/qa_L6_workbook
// ---------------------------------------------------------------------------

import sharp from 'sharp';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const dir = process.argv[2] || 'output/qa_L6_workbook';

/** rgb -> { h (deg), s (0-1), v (0-1) } */
function hsv(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, v: max / 255 };
}

// The level palette band: indigo #6366F1 (h≈239), its light tint and the
// accent #4338CA (h≈248). Anything saturated outside this band is a failure.
const HUE_MIN = 200;
const HUE_MAX = 280;
const SAT_THRESHOLD = 0.25;

let failures = 0;
const files = (await readdir(dir)).filter((f) => f.endsWith('.png')).sort();
for (const f of files) {
  const img = sharp(path.join(dir, f));
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  let bad = 0;
  const samples = [];
  for (let i = 0; i < data.length; i += ch) {
    const { h, s, v } = hsv(data[i], data[i + 1], data[i + 2]);
    if (s > SAT_THRESHOLD && v > 0.2 && (h < HUE_MIN || h > HUE_MAX)) {
      bad += 1;
      if (samples.length < 3) {
        const px = (i / ch) % info.width;
        const py = Math.floor(i / ch / info.width);
        samples.push(`(${px},${py}) rgb(${data[i]},${data[i + 1]},${data[i + 2]})`);
      }
    }
  }
  const ok = bad === 0;
  if (!ok) failures += 1;
  console.log(`${ok ? '✓' : '✗'} ${f}: ${bad} saturated non-indigo pixel(s)${samples.length ? ' e.g. ' + samples.join(' ') : ''}`);
}
console.log(failures ? `\n${failures} page(s) FAILED the saturation check.` : '\nAll pages pass: saturated non-indigo pixels = 0.');
process.exit(failures ? 1 : 0);
