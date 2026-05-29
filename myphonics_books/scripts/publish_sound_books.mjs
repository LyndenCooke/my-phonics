// Publish the built Sound Book PDFs to Supabase Storage so the school library
// can link to them. Reads the service-role key from myphonics_books/.env.
//
//   node scripts/publish_sound_books.mjs           # upload all
//   node scripts/publish_sound_books.mjs --dry-run # list only
//
// Source:  output/sound_books/L{n}/L{n}_{seq}_{grapheme}.pdf
// Target:  bucket "sound-book-pdfs" / {n}_{seq}.pdf   (public)
// The app id SD-L{n}.{seq} maps to the key {n}_{seq}, so the frontend can
// build the URL deterministically.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = join(__dirname, '..');
const SOUND_DIR = join(BASE, 'output', 'sound_books');
const BUCKET = 'sound-book-pdfs';
const PROD_URL = 'https://jfbgdeyjngvzpfucwpuk.supabase.co';
const DRY = process.argv.includes('--dry-run');

function loadServiceKey() {
  const env = readFileSync(join(BASE, '.env'), 'utf8');
  const m = env.match(/^SUPABASE_SERVICE_KEY=(.+)$/m);
  if (!m) throw new Error('SUPABASE_SERVICE_KEY not found in myphonics_books/.env');
  return m[1].trim().replace(/^["']|["']$/g, '');
}

// L1_01_s.pdf -> { level: 1, seq: "01", key: "1_01" }
function parseFile(name) {
  const m = /^L(\d+)_(\d+)_/.exec(name);
  if (!m) return null;
  return { level: Number(m[1]), seq: m[2], key: `${Number(m[1])}_${m[2]}` };
}

function collect() {
  const seen = new Set();
  const files = [];
  for (const lvl of readdirSync(SOUND_DIR)) {
    const dir = join(SOUND_DIR, lvl);
    if (!/^L\d+$/.test(lvl) || !existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.pdf')) continue;
      const parsed = parseFile(f);
      if (!parsed) continue;
      if (seen.has(parsed.key)) continue; // dedupe (e.g. L5_01 a_e vs a_e_split_digraph)
      seen.add(parsed.key);
      files.push({ ...parsed, path: join(dir, f), name: f });
    }
  }
  return files.sort((a, b) => a.level - b.level || a.seq.localeCompare(b.seq));
}

async function ensureBucket(key) {
  const res = await fetch(`${PROD_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  if (res.ok) { console.log(`Created public bucket "${BUCKET}".`); return; }
  const body = await res.json().catch(() => ({}));
  if (res.status === 409 || /already exists/i.test(body.message ?? '')) {
    console.log(`Bucket "${BUCKET}" already exists.`);
    return;
  }
  throw new Error(`bucket create failed (${res.status}): ${JSON.stringify(body)}`);
}

async function upload(key, file) {
  const bytes = readFileSync(file.path);
  const res = await fetch(`${PROD_URL}/storage/v1/object/${BUCKET}/${file.key}.pdf`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      'Content-Type': 'application/pdf',
      'x-upsert': 'true',
    },
    body: bytes,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`upload ${file.key} failed (${res.status}): ${body}`);
  }
}

async function main() {
  const files = collect();
  console.log(`Found ${files.length} sound book PDFs.`);
  if (DRY) {
    for (const f of files) console.log(`  ${f.name} -> ${f.key}.pdf`);
    return;
  }
  const key = loadServiceKey();
  await ensureBucket(key);
  let ok = 0;
  for (const f of files) {
    await upload(key, f);
    ok++;
    if (ok % 10 === 0 || ok === files.length) console.log(`  uploaded ${ok}/${files.length}`);
  }
  console.log(`Done. ${ok} files at ${PROD_URL}/storage/v1/object/public/${BUCKET}/{level}_{seq}.pdf`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
