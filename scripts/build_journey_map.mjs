// Build the public Curriculum Journey Map data.
//
// Reads the read-only curriculum spine at
//   myphonics_books/data/lesson_overviews.json
// and writes a trimmed copy the website can fetch at runtime to
//   public/journey/lesson_map.json
//
// The trim drops the teacher-facing `objective` field (not shown in the
// on-screen map) and keeps every other field. The source file is never
// modified.
//
// Run it with a single command:
//   npm run journey:build
//
// (or directly: node scripts/build_journey_map.mjs)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const SOURCE = resolve(root, 'myphonics_books/data/lesson_overviews.json');
const OUT = resolve(root, 'public/journey/lesson_map.json');

const raw = JSON.parse(readFileSync(SOURCE, 'utf8'));

if (!Array.isArray(raw.map) || typeof raw.total_lessons !== 'number') {
  throw new Error('Unexpected lesson_overviews.json shape: need { total_lessons, map[] }');
}

const map = raw.map.map((row) => {
  // Keep every field except the teacher-only objective.
  const { objective, ...keep } = row;
  return keep;
});

// Sanity: rows must be a contiguous 1..N run so the map can trust `n`.
map.forEach((row, i) => {
  if (row.n !== i + 1) {
    throw new Error(`Lesson map is not contiguous at index ${i}: n=${row.n}`);
  }
});
if (map.length !== raw.total_lessons) {
  throw new Error(`total_lessons (${raw.total_lessons}) != map length (${map.length})`);
}

const out = {
  total_lessons: raw.total_lessons,
  generated_from: 'myphonics_books/data/lesson_overviews.json',
  map,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out) + '\n', 'utf8');

console.log(`journey map: wrote ${map.length} lessons to ${OUT}`);
