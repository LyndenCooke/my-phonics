// Adopt the ORIGINAL 8.4 hero sheets as the injected references.
//
// Lynden 2026-08-05: "this is not the same art style as the other books clearly."
// He is right. The forge run generated brand-new hero sheets, and between
// BASE_STYLE's "simple rounded shapes"/"cute like a teddy bear" and the size
// wording I added ("a smaller, rounder child's face"), they came back chibi —
// big round heads, stubby limbs, blush circles. Every scene then inherited that
// from the injected reference, so all 9 pages drifted off-fleet together.
//
// The style does not need inventing: the book's ORIGINAL sheets (April/July,
// archived at _archive_L8_4_B1_20260805_1555) already have BOTH the right cast
// (white Australian, light-brown ponytail / sandy hair) AND the fleet look —
// fine outlines, naturalistic proportions, muted palette. Injecting art that was
// already approved is far more reliable than describing it.
//
// One problem to solve first: each sheet has decorative birds standing beside
// the child. Injected as a hero reference those would (a) add extra animals to
// pages that must contain exactly one, and (b) reintroduce the pale-ringed bird
// eye that started this whole thread. So every element except the child is
// erased back to the sheet's own cream — the sheets are plain cream behind the
// figure, so this touches no character art.
//
//   node scripts/adopt_L8_4_fleet_refs.mjs
//
// Writes hero_mia/hero_tom/hero_dad into output/images/L8_4_B1/, keeping the
// forge-generated animal sheets (whose eyes are correct) untouched.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const IMG = path.join(REPO, "myphonics_books", "output", "images");
const SRC = path.join(IMG, "_archive_L8_4_B1_20260805_1555");
const OUT = path.join(IMG, "L8_4_B1");

// hero_tom / hero_dad are the 04-19 originals; Mia's April sheet was overwritten
// during a later pass, so her pre-QA July copy is the last one in fleet style.
const ADOPT = [
  ["hero_mia_pre_qa0729.png", "hero_mia.png"],
  ["hero_tom.png", "hero_tom.png"],
  ["hero_dad.png", "hero_dad.png"],
];

// Keep only the largest connected non-cream blob (the child) and erase the rest.
// Deterministic, and it cannot touch the figure: the birds are separate blobs
// standing clear of it on plain background.
async function keepLargestSubject(srcPath) {
  const img = sharp(srcPath).ensureAlpha();
  const { width, height } = await img.metadata();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;

  // The background is the sheet's own cream. Sample a corner rather than
  // assuming a hex — the sheets differ slightly in paper tone.
  const bg = [data[0], data[1], data[2]];
  // Tolerance 60, measured not guessed. The soft contact shadow under the feet
  // sits at distance ~37 from the paper and the faintest real art (face skin)
  // at ~110, so 60 splits them cleanly. At the obvious-looking 26 the shadow
  // counted as foreground and BRIDGED the birds to the child, making the whole
  // group one blob — Mia and Dad then kept their birds.
  const isBg = (i) =>
    Math.abs(data[i] - bg[0]) < 60 &&
    Math.abs(data[i + 1] - bg[1]) < 60 &&
    Math.abs(data[i + 2] - bg[2]) < 60;

  const N = width * height;
  const fg = new Uint8Array(N);
  for (let p = 0; p < N; p++) if (!isBg(p * ch)) fg[p] = 1;

  const label = new Int32Array(N).fill(-1);
  const stack = new Int32Array(N);
  let best = -1, bestSize = 0, next = 0;
  for (let s = 0; s < N; s++) {
    if (!fg[s] || label[s] !== -1) continue;
    const id = next++;
    let top = 0, size = 0;
    stack[top++] = s;
    label[s] = id;
    while (top > 0) {
      const p = stack[--top];
      size++;
      const x = p % width, y = (p / width) | 0;
      if (x > 0 && fg[p - 1] && label[p - 1] === -1) { label[p - 1] = id; stack[top++] = p - 1; }
      if (x < width - 1 && fg[p + 1] && label[p + 1] === -1) { label[p + 1] = id; stack[top++] = p + 1; }
      if (y > 0 && fg[p - width] && label[p - width] === -1) { label[p - width] = id; stack[top++] = p - width; }
      if (y < height - 1 && fg[p + width] && label[p + width] === -1) { label[p + width] = id; stack[top++] = p + width; }
    }
    if (size > bestSize) { bestSize = size; best = id; }
  }

  // Bounding box of the child, so everything outside it can be wiped flat.
  // Erasing only the bird BLOBS leaves ghosts: the birds' pale interior fills
  // are within the background tolerance, so they were never foreground and
  // survived as faint outlines of a bird — still a bird to the model.
  let bx0 = width, by0 = height, bx1 = 0, by1 = 0;
  for (let p = 0; p < N; p++) {
    if (label[p] !== best) continue;
    const x = p % width, y = (p / width) | 0;
    if (x < bx0) bx0 = x;
    if (x > bx1) bx1 = x;
    if (y < by0) by0 = y;
    if (y > by1) by1 = y;
  }

  let erased = 0;
  const out = Buffer.from(data);
  const wipe = (p) => {
    const i = p * ch;
    if (out[i] === bg[0] && out[i + 1] === bg[1] && out[i + 2] === bg[2]) return;
    out[i] = bg[0]; out[i + 1] = bg[1]; out[i + 2] = bg[2];
    if (ch === 4) out[i + 3] = 255;
    erased++;
  };
  for (let p = 0; p < N; p++) {
    const x = p % width, y = (p / width) | 0;
    const outside = x < bx0 || x > bx1 || y < by0 || y > by1;
    if (outside || (fg[p] && label[p] !== best)) wipe(p);
  }
  const buf = await sharp(out, { raw: { width, height, channels: ch } }).png().toBuffer();
  return { buf, erased, kept: bestSize, blobs: next };
}

for (const [from, to] of ADOPT) {
  const src = path.join(SRC, from);
  if (!fs.existsSync(src)) throw new Error(`missing ${src}`);
  const r = await keepLargestSubject(src);
  fs.writeFileSync(path.join(OUT, to), r.buf);
  console.log(
    `  ${from} → ${to}  (${r.blobs} blobs, kept ${r.kept} px, erased ${r.erased} px)`,
  );
}
console.log("\nFleet reference sheets adopted. Animal sheets left as they are.");
