// Compress every cover.png in public/illustrations to a smaller PNG
// (lossy palette + max 800px wide) AND emit a webp sibling. The display
// size of these covers is at most 160px CSS, so 800px wide is plenty
// even on @4x retina. Sources are typically 1024-2048px and uncompressed.
//
// Run: node scripts/optimize_covers.mjs
//
// Strategy:
//   - Read every cover.png
//   - Resize to max 800px wide, keep aspect ratio
//   - Write back as PNG (compressionLevel 9, palette mode for smaller files)
//   - Also emit cover.webp at quality 82 — modern browsers prefer this
//
// We don't yet update the image src in code to use webp; that's a follow-up
// (need <picture> with <source type=image/webp>). For now the smaller PNG
// alone is a 5-10x size reduction.

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const ROOT = 'public/illustrations';
const folders = readdirSync(ROOT).filter(name => {
  try { return statSync(join(ROOT, name)).isDirectory(); } catch { return false; }
});

let total = { before: 0, afterPng: 0, afterWebp: 0 };
let count = 0;

for (const folder of folders) {
  const cover = join(ROOT, folder, 'cover.png');
  try {
    const before = statSync(cover).size;
    const buf = await sharp(cover)
      .resize({ width: 800, withoutEnlargement: true })
      .png({ compressionLevel: 9, palette: true, quality: 80 })
      .toBuffer();
    await sharp(buf).toFile(cover);

    // Emit webp sibling
    const webp = cover.replace(/\.png$/, '.webp');
    await sharp(cover).resize({ width: 800, withoutEnlargement: true }).webp({ quality: 82 }).toFile(webp);

    const afterPng = statSync(cover).size;
    const afterWebp = statSync(webp).size;
    total.before += before;
    total.afterPng += afterPng;
    total.afterWebp += afterWebp;
    count++;
    console.log(`${folder}: ${(before / 1024).toFixed(0)}KB → png ${(afterPng / 1024).toFixed(0)}KB · webp ${(afterWebp / 1024).toFixed(0)}KB`);
  } catch (e) {
    console.log(`skip ${folder}: ${e.message}`);
  }
}

console.log(`\n${count} covers processed`);
console.log(`PNG: ${(total.before / 1024 / 1024).toFixed(1)}MB → ${(total.afterPng / 1024 / 1024).toFixed(1)}MB`);
console.log(`WebP siblings: ${(total.afterWebp / 1024 / 1024).toFixed(1)}MB total`);
