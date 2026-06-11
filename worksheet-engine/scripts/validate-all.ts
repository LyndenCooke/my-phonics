// Validate every book's data before printing. Run: npm run validate
import fs from 'node:fs';
import path from 'node:path';
import { BOOKS } from '../src/lib/registry';
import { validateBook } from '../src/data/validate';
import { GRAMMAR_UNITS, getGrammarPage } from '../src/lib/grammarRegistry';
import { GRAMMAR_ASSETS } from '../src/data/grammarAssets';
import type { GrammarUnit } from '../src/data/grammarSchema';

let errors = 0;

for (const book of Object.values(BOOKS)) {
  const issues = validateBook(book);
  const errs = issues.filter((i) => i.level === 'error');
  const warns = issues.filter((i) => i.level === 'warning');
  errors += errs.length;

  const status = errs.length ? '✗' : warns.length ? '!' : '✓';
  console.log(`\n${status} ${book.bookTitle} (${book.levelLabel})`);
  for (const i of issues) {
    console.log(`   ${i.level === 'error' ? 'ERROR  ' : 'warning'}  ${i.message}`);
  }
  if (!issues.length) console.log('   no issues');
}

// --- grammar art slots -------------------------------------------------------
// The engine rule: a slot whose asset is not approved (manifest status !== 'ok',
// or no file) stays EMPTY on the page — never a substitute, never an off-style
// one-off. This report is how those empty slots are surfaced, so a gap is never
// silently shipped.

const CLIPART_DIR = path.join(process.cwd(), 'public', 'clipart');
const EXTS = ['svg', 'png', 'webp', 'jpg'];

function artRenderable(key: string): boolean {
  const entry = GRAMMAR_ASSETS[key];
  if (entry && entry.status !== 'ok') return false;
  return EXTS.some((ext) => fs.existsSync(path.join(CLIPART_DIR, `${key}.${ext}`)));
}

/** Every asset key a unit's page references, across all art slots. */
function unitArtKeys(unit: GrammarUnit): string[] {
  const keys: string[] = [];
  if (unit.illustration) {
    keys.push(...unit.illustration.assets);
  }
  keys.push(...(unit.rowArt ?? []));
  keys.push(...(unit.watchArt ?? []));
  for (const d of unit.decorations ?? []) keys.push(d.key);
  if (unit.format === 'build') {
    for (const r of unit.build.rows) if (r.icon) keys.push(r.icon);
  }
  return [...new Set(keys)];
}

console.log('\nGrammar art slots (empty until approved art is supplied):');
let emptySlots = 0;
for (const unit of Object.values(GRAMMAR_UNITS)) {
  const withheld = unitArtKeys(unit).filter((k) => !artRenderable(k));
  if (!withheld.length) continue;
  emptySlots += withheld.length;
  console.log(`   ${unit.code} (L${unit.level} p${getGrammarPage(unit.id)}) — empty: ${withheld.join(', ')}`);
}
if (!emptySlots) console.log('   none — every referenced slot has approved art');

const needingArt = Object.values(GRAMMAR_ASSETS).filter((a) => a.status !== 'ok');
if (needingArt.length) {
  console.log('\nManifest keys awaiting approved art:');
  for (const a of needingArt) console.log(`   ${a.key} (${a.status})${a.note ? ` — ${a.note}` : ''}`);
}

// --- workbook assembly dry-run ------------------------------------------------
// Both editions must assemble to a coherent page list (teaching order, gapless
// numbering, Answers last, Edition A drops the book-carried pages). Edition A
// is dry-run ONLY — no Edition A document is rendered in this pass.

import { assembleWorkbook, validateAssembly } from '../src/lib/workbook';

console.log('\nWorkbook assembly dry-run:');
for (const edition of ['B', 'A'] as const) {
  try {
    const doc = assembleWorkbook(6, edition);
    const issues = validateAssembly(doc);
    errors += issues.length;
    const status = issues.length ? '✗' : '✓';
    console.log(`   ${status} L6 Edition ${edition}: ${doc.pages.length} pages, contents ${doc.contents.map((c) => `${c.label} ${c.pages}`).join(' · ')}`);
    for (const i of issues) console.log(`      ERROR  ${i}`);
  } catch (e) {
    errors += 1;
    console.log(`   ✗ L6 Edition ${edition}: ${(e as Error).message}`);
  }
}

console.log(`\n${errors ? `${errors} error(s) — fix before printing.` : 'All books valid.'}`);
process.exit(errors ? 1 : 0);
