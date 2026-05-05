// Run critique_story.mjs on every book in parallel batches.
// Writes outputs to scripts/critique_output/<id>.md.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ALL = ['L1_1','L1_2','L1_3','L1_4','L1_5','L1_6','L1_7','L1_8','L1_9','L1_10',
             'L2_2','L2_3','L2_4','L2_5','L2_6',
             'L3_1','L3_2','L3_3','L3_4','L3_5',
             'L4_1','L4_2','L4_3','L4_4',
             'L5_1','L5_2','L5_3','L5_4',
             'L6_1','L6_2','L6_3','L6_4'];

const BATCH = 5;
const script = path.join(__dirname, 'critique_story.mjs');

function runOne(id) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const proc = spawn(process.execPath, [script, id], { stdio: ['ignore','ignore','pipe'] });
    let err = '';
    proc.stderr.on('data', d => err += d);
    proc.on('close', code => {
      const dt = ((Date.now()-t0)/1000).toFixed(1);
      if (code === 0) console.log(`✔ ${id} (${dt}s)`);
      else console.log(`✗ ${id} (${dt}s) — ${err.slice(0,200)}`);
      resolve({ id, ok: code === 0, err });
    });
  });
}

(async () => {
  const results = [];
  for (let i = 0; i < ALL.length; i += BATCH) {
    const slice = ALL.slice(i, i+BATCH);
    console.log(`\n— Batch ${i/BATCH+1}: ${slice.join(', ')}`);
    const out = await Promise.all(slice.map(runOne));
    results.push(...out);
  }
  const failed = results.filter(r => !r.ok);
  console.log(`\nDone. ${results.length - failed.length}/${results.length} succeeded.`);
  if (failed.length) {
    console.log('Failed:');
    for (const f of failed) console.log(`  ${f.id}: ${f.err.slice(0,300)}`);
  }
})();
