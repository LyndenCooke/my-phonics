#!/usr/bin/env node
// ---------------------------------------------------------------------------
// worksheet-forge CLI.
//
//   node forge.mjs "a handwriting worksheet for the sound sh"
//   node forge.mjs "level 5 spelling choices for 'ai'" --seed 7
//   node forge.mjs "board game for level 3" --no-ai
//   node forge.mjs --spec path/to/spec.json
//   node forge.mjs --pack "sounds sh ch th for level 3"   (one sheet per sound)
//
// Output: worksheet-forge/output/<slug>.pdf + .png preview + .html debug.
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';
import { planFromPrompt, planFromAnalysis, parsePrompt } from './planner/planner.mjs';
import { analyzeWorksheetImage, analyzeWorksheetLayout } from './planner/vision.mjs';
import { planFromLayout } from './planner/layout.mjs';
import { illustrateSpec } from './planner/scenes.mjs';
import { renderFitted, closeBrowser } from './render.mjs';
import { FORGE_ROOT } from './design/tokens.mjs';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const getFlagValue = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const prompt = args.filter((a, i) => !a.startsWith('--') && (i === 0 || args[i - 1] !== '--seed' && args[i - 1] !== '--spec' && args[i - 1] !== '--out')).join(' ');

const seed = parseInt(getFlagValue('--seed', '42'), 10);
const ai = !flags.has('--no-ai');
const outDir = getFlagValue('--out', path.join(FORGE_ROOT, 'output'));

async function run() {
  const specPath = getFlagValue('--spec', null);
  const specs = [];

  const fromImage = getFlagValue('--from', null);
  if (fromImage) {
    const mime = /\.jpe?g$/i.test(fromImage) ? 'image/jpeg' : /\.webp$/i.test(fromImage) ? 'image/webp' : 'image/png';
    const b64 = fs.readFileSync(fromImage).toString('base64');

    if (flags.has('--layout')) {
      // Layout-faithful remake: rebuild the SHAPE of any sheet, whatever the
      // subject, rather than mapping it onto the nearest phonics activity.
      const analysis = await analyzeWorksheetLayout(b64, mime);
      if (!analysis) {
        console.error('Vision analysis unavailable (no Gemini/Vertex access).');
        process.exit(1);
      }
      const shape = (analysis.sections ?? []).map((s) => s.type).join(' + ');
      console.log(`  layout: ${analysis.subject ?? '?'} → ${shape}`);
      console.log(`  "${analysis.title ?? ''}" — ${analysis.task ?? ''}`);
      const spec = planFromLayout(analysis, { seed });
      if (!spec) {
        console.error('Nothing usable in the layout reading.');
        process.exit(1);
      }
      // Fill the picture slots with our own artwork (unless --no-art).
      if (!flags.has('--no-art')) await illustrateSpec(spec, { log: (m) => console.log(`  ${m}`) });
      specs.push(spec);
    } else {
      // Phonics remake: vision → block mapping → rebuilt with our own
      // decodable content.
      const analysis = await analyzeWorksheetImage(b64, mime);
      if (!analysis) {
        console.error('Vision analysis unavailable (no Gemini/Vertex access).');
        process.exit(1);
      }
      console.log(`  detected: L${analysis.level ?? '?'} "${analysis.grapheme ?? '?'}" → ${(analysis.blocks ?? []).join(' + ')}`);
      console.log(`  ${analysis.summary ?? ''}`);
      specs.push(await planFromAnalysis(analysis, { seed, ai }));
    }
  } else if (specPath) {
    specs.push(JSON.parse(fs.readFileSync(specPath, 'utf-8')));
  } else if (flags.has('--pack')) {
    const parsed = parsePrompt(prompt);
    const sounds = (prompt.match(/\b[a-z]{1,3}(?:-e)?\b(?=.*for level)/g) ?? []);
    const list = sounds.length ? sounds : [null];
    let i = 0;
    for (const s of list) {
      specs.push(await planFromPrompt(`sound ${s ?? ''} ${prompt}`, { seed: seed + i++, ai }));
    }
  } else {
    if (!prompt) {
      console.error('Usage: node forge.mjs "<prompt>" [--seed N] [--no-ai] [--out DIR] | --spec file.json');
      process.exit(1);
    }
    const parsed = parsePrompt(prompt);
    for (let i = 0; i < parsed.count; i++) {
      specs.push(await planFromPrompt(prompt, { seed: seed + i * 101, ai }));
    }
  }

  for (const spec of specs) {
    const t0 = Date.now();
    const { pdf, png, overflow, trimmed } = await renderFitted(spec, outDir);
    const flag = overflow > 0.5 ? `  ⚠ OVERFLOW ${overflow}mm` : trimmed ? '  (auto-fitted)' : '';
    console.log(`✓ ${path.basename(pdf)}  (${Date.now() - t0}ms)${flag}`);
    console.log(`  preview: ${png}`);
  }
  await closeBrowser();
}

run().catch(async (e) => { console.error(e); await closeBrowser(); process.exit(1); });
