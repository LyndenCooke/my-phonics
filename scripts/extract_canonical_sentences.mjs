/**
 * Extract canonical story sentences from interactive book data.
 *
 * Walks every `BOOK_L{N}_{sub}_PAGES` export in src/lib/interactiveBookData*.ts,
 * pulls the `sentences: [...]` array from each `type: 'story'` page in order,
 * joins them with spaces, and writes one JSON entry per audio key.
 *
 * Run: node scripts/extract_canonical_sentences.mjs
 * Output: .scratch/canonical_sentences.json
 *
 * Re-run this whenever you change a `sentences:` array (or add/remove a story
 * page) in any of the interactiveBookData files. Then run
 * generate_sentence_audio_canonical.mjs to push the changes to the mp3s.
 */
import fs from 'fs';
import path from 'path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\//, ''), '..');
const LIB_DIR = path.join(REPO, 'src', 'lib');
const OUT = path.join(REPO, '.scratch', 'canonical_sentences.json');

const TS_FILES = [
  'interactiveBookData.ts',
  'interactiveBookDataL2.ts',
  'interactiveBookDataL3.ts',
  'interactiveBookDataL4.ts',
  'interactiveBookDataL5.ts',
  'interactiveBookDataL6.ts',
];

const BOOK_RE = /export\s+const\s+BOOK_L(\d+)_(\d+)_PAGES\s*:\s*InteractivePage\[\]\s*=\s*\[/g;

/** Find the matching closing bracket for `[` at `openIdx`.
 *  Skips JS line (`//`) and block (`/* *\/`) comments so contractions
 *  like `doesn't` in a comment don't open a phantom string and swallow
 *  the real closing bracket. */
function matchBracket(src, openIdx) {
  let depth = 0;
  let inStr = null;
  let i = openIdx;
  while (i < src.length) {
    const c = src[i];
    if (inStr) {
      if (c === '\\') { i += 2; continue; }
      if (c === inStr) inStr = null;
    } else {
      if (c === '/' && src[i + 1] === '/') {
        const nl = src.indexOf('\n', i);
        if (nl === -1) return -1;
        i = nl + 1; continue;
      }
      if (c === '/' && src[i + 1] === '*') {
        const end = src.indexOf('*/', i + 2);
        if (end === -1) return -1;
        i = end + 2; continue;
      }
      if (c === '"' || c === "'" || c === '`') inStr = c;
      else if (c === '[') depth++;
      else if (c === ']') { depth--; if (depth === 0) return i; }
    }
    i++;
  }
  return -1;
}

/** Extract `sentences: [...]` arrays from a body, in source order.
 *  Returns an array of arrays-of-strings. */
function extractSentenceArrays(body) {
  const out = [];
  const re = /sentences\s*:\s*\[/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const open = body.indexOf('[', m.index);
    const close = matchBracket(body, open);
    if (close === -1) continue;
    const inner = body.slice(open + 1, close);
    // Parse each string literal in `inner`. Strings use ', ", or `.
    const sentences = [];
    let i = 0;
    while (i < inner.length) {
      const c = inner[i];
      if (c === "'" || c === '"' || c === '`') {
        const quote = c;
        let j = i + 1;
        let s = '';
        while (j < inner.length) {
          const ch = inner[j];
          if (ch === '\\') {
            const next = inner[j + 1];
            if (next === 'u') {
              // \uXXXX → unicode character
              s += String.fromCharCode(parseInt(inner.slice(j + 2, j + 6), 16));
              j += 6;
            } else if (next === 'n') { s += '\n'; j += 2; }
            else if (next === 't') { s += '\t'; j += 2; }
            else if (next === 'r') { s += '\r'; j += 2; }
            else { s += next; j += 2; }
            continue;
          }
          if (ch === quote) break;
          s += ch;
          j++;
        }
        sentences.push(s);
        i = j + 1;
      } else {
        i++;
      }
    }
    out.push(sentences);
  }
  return out;
}

const result = {};
let totalKeys = 0;

for (const fname of TS_FILES) {
  const fpath = path.join(LIB_DIR, fname);
  if (!fs.existsSync(fpath)) continue;
  const src = fs.readFileSync(fpath, 'utf8');

  BOOK_RE.lastIndex = 0;
  let m;
  while ((m = BOOK_RE.exec(src)) !== null) {
    const level = m[1];
    const sub = m[2];
    const open = src.indexOf('[', m.index + m[0].length - 1);
    const close = matchBracket(src, open);
    if (close === -1) continue;
    const body = src.slice(open + 1, close);
    const sentenceArrays = extractSentenceArrays(body);

    sentenceArrays.forEach((arr, idx) => {
      const key = `L${level}_${sub}_p${idx + 1}`;
      result[key] = arr.join(' ');
      totalKeys++;
    });
  }
}

if (!fs.existsSync(path.dirname(OUT))) fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(result, null, 2), 'utf8');
console.log(`Wrote ${totalKeys} keys → ${path.relative(REPO, OUT)}`);
