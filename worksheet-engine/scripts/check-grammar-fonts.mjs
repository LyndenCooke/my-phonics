// ---------------------------------------------------------------------------
// GRAMMAR FONT-SIZE GUARD — fails the build if any node in the flowy grammar
// booklet hard-codes a font size outside the locked four-role token set.
//
// The one type scale lives in src/design/grammarTokens.ts and is applied through
// gSize()/gType() as CSS vars. The only literal font-size values allowed in the
// scanned files are those CSS vars; a raw pt value (e.g. '15pt') fails here.
//
// Run: npm run check:fonts
// ---------------------------------------------------------------------------

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

// Only the flowy grammar booklet surface is governed by the one-scale rule.
// The legacy boxed strand (GrammarLayout / GrammarSheet / GrammarBuild …) is
// intentionally NOT scanned — it is not part of the flowy booklet.
const FILES = [
  'src/components/grammar/FlowyLayout.tsx',
  'src/components/grammar/FlowySheet.tsx',
  'src/components/grammar/Illustration.tsx',
  'src/components/WriteLine.tsx',
  ...listDir('src/components/grammar/booklet'),
];

function listDir(rel) {
  const dir = path.join(ROOT, rel);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'))
    .map((f) => path.join(rel, f));
}

const ALLOWED = new Set([
  'var(--type-title)',
  'var(--type-instruction)',
  'var(--type-body)',
  'var(--type-footer)',
  'var(--type-display)',
]);

// fontSize: '<value>'  |  fontSize: "<value>"  |  fontSize: `<value>`
const RE = /fontSize:\s*(['"`])([^'"`]*)\1/g;

let failures = 0;
for (const rel of FILES) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) continue;
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split('\n');
  let m;
  while ((m = RE.exec(src)) !== null) {
    const value = m[2];
    if (!ALLOWED.has(value)) {
      const lineNo = src.slice(0, m.index).split('\n').length;
      console.error(
        `✗ ${rel}:${lineNo}  font-size "${value}" is outside the token set.\n` +
          `    ${lines[lineNo - 1].trim()}`,
      );
      failures += 1;
    }
  }
}

if (failures) {
  console.error(
    `\n${failures} disallowed font size(s). Use gSize()/gType() with one of the ` +
      `four roles (title/instruction/body/footer) or display on the cover/certificate.`,
  );
  process.exit(1);
}
console.log(`✓ grammar font guard: all font sizes use the locked token set (${FILES.length} files scanned).`);
