// Run the FORGE's own eye gate over a book's images.
//
// Lynden 2026-08-05: "revert to our system that i made before with the image
// generator skill md... we've never added in the circle separately."
//
// Correct. server/forge already solves this properly and I should not have
// written anything new:
//   eyeQAZoomed  — vision QA that finds each face, crops and enlarges it, and
//                  judges the eyes at a size where a white sclera is visible
//                  (a whole-page pass misses them and rubber-stamps everything)
//   repairEyes   — up to two EYE-ONLY model edits, re-QA'd after each
//
// It never paints a black circle on top. That reads as pasted-on, which is
// exactly what Lynden rejected.
//
//   node gate_eyes_L8_4.mjs [--dir output/images/L8_4_B1] [--dry]

import fs from "node:fs";
import path from "node:path";
import { eyeQAZoomed, repairEyes } from "./server/forge/images.mjs";

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const dirArg = args.indexOf("--dir");
const DIR = dirArg >= 0 ? args[dirArg + 1]
  : "myphonics_books/output/images/L8_4_B1";

const files = fs.readdirSync(DIR)
  .filter((f) => f.endsWith(".png"))
  .filter((f) => /^(cover|page\d+|hero_|animal_)/.test(f))
  .sort();

let totalCost = 0;
let failed = [];

for (const f of files) {
  const p = path.join(DIR, f);
  let buf = fs.readFileSync(p);
  let qa, cost = 0;
  try {
    const r = await eyeQAZoomed(buf);
    qa = r.qa; cost += r.cost;
  } catch (e) {
    console.log(`  ${f.padEnd(22)} QA unavailable: ${e.message}`);
    continue;
  }

  if (qa.pass) {
    console.log(`  ${f.padEnd(22)} PASS   (${qa.checked || "page"})`);
    totalCost += cost;
    continue;
  }

  console.log(`  ${f.padEnd(22)} FAIL   ${(qa.reason || "").slice(0, 90)}`);
  if (qa.eyes_seen) console.log(`      saw: ${String(qa.eyes_seen).slice(0, 160)}`);
  if (dry) { failed.push(f); totalCost += cost; continue; }

  const rep = await repairEyes(buf, qa);
  cost += rep.cost;
  if (rep.qa.pass) {
    fs.writeFileSync(p, rep.buf);
    console.log(`  ${f.padEnd(22)} REPAIRED (pass ${rep.qa.repaired})`);
  } else {
    console.log(`  ${f.padEnd(22)} STILL FAILING after repair — left unchanged`);
    failed.push(f);
  }
  totalCost += cost;
}

console.log(`\ncost $${totalCost.toFixed(4)}`);
if (failed.length) console.log(`unresolved: ${failed.join(", ")}`);
