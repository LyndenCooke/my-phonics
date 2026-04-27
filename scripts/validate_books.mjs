// Validates phoneme-letter consistency across all 6 interactive book data files.
// Filter out known false-positives: split-digraphs handle a trailing 'e'
// implicitly via buildLetterSpans, so word=[i,n,s,i-e,d] is correct for 'inside'.
import fs from "fs";
import path from "path";

const ROOT = "C:/Users/ASUS/myphonicsbooks/.claude/worktrees/practical-spence-48957b/src/lib";
const FILES = [
  "interactiveBookData.ts",
  "interactiveBookDataL2.ts",
  "interactiveBookDataL3.ts",
  "interactiveBookDataL4.ts",
  "interactiveBookDataL5.ts",
  "interactiveBookDataL6.ts",
];
const SPLIT_DIGRAPHS = new Set(["a-e","i-e","o-e","u-e","e-e"]);

const findings = { mismatches: [], silentE: [] };

function stripPunct(s) { return s.toLowerCase().replace(/[^a-z]/g, ""); }

for (const file of FILES) {
  const text = fs.readFileSync(path.join(ROOT, file), "utf8");
  const lines = text.split("\n");
  let book = { lvl: 1, sub: 1 };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bm = line.match(/BOOK_L(\d+)_(\d+)_PAGES/);
    if (bm) book = { lvl: +bm[1], sub: +bm[2] };

    const wordRe = /\bword\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*\[([^\]]+)\]\s*\)/g;
    let m;
    while ((m = wordRe.exec(line))) {
      const display = m[1], word = m[2];
      const phs = m[3].split(",").map(s => s.trim().replace(/^'(.*)'$/, "$1"));
      const phLetters = phs.map(p => p.replace("-","")).join("").toLowerCase();
      const wordLetters = stripPunct(word);
      if (phLetters === wordLetters) continue;

      // False positive: any split digraph in phs implicitly adds a trailing 'e'.
      const hasSplit = phs.some(p => SPLIT_DIGRAPHS.has(p));
      const expected = hasSplit ? phLetters + "" : phLetters;
      // For split digraphs the trailing 'e' is appended by the renderer, so
      // expected becomes phLetters with an 'e' inserted somewhere — we
      // approximate: if removing the 'e' from the word gives phLetters, OK.
      if (hasSplit && wordLetters.replace(/e$/, "") + "e" === wordLetters
          && wordLetters.replace(/e$/, "") === phLetters.replace(/e$/, "")) {
        continue; // split-digraph handled
      }
      // Better heuristic: if the word can be reconstructed by inserting one 'e'
      // somewhere in phLetters, accept (split-digraph trailing-e case).
      if (hasSplit) {
        let ok = false;
        for (let j = 0; j <= phLetters.length; j++) {
          if (phLetters.slice(0,j) + "e" + phLetters.slice(j) === wordLetters) { ok = true; break; }
        }
        if (ok) continue;
      }

      // Silent-e at end without split digraph (e.g., 'gone' [g,o,n] vs 'gone')
      if (wordLetters.endsWith("e") && wordLetters.slice(0, -1) === phLetters) {
        findings.silentE.push({ book: `L${book.lvl}.${book.sub}`, file, line: i+1, display, word, phonemes: phs });
        continue;
      }

      findings.mismatches.push({
        book: `L${book.lvl}.${book.sub}`, file, line: i+1,
        display, word, phonemes: phs, phConcat: phLetters, wordLetters,
      });
    }
  }
}

console.log("=== REMAINING PHONEME MISMATCHES ===");
console.log(`Found ${findings.mismatches.length}`);
for (const e of findings.mismatches.slice(0, 60)) {
  console.log(`  ${e.book} ${e.file}:${e.line}  ${e.display} word='${e.word}' [${e.phonemes.join(",")}] -> '${e.phConcat}' vs '${e.wordLetters}'`);
}
if (findings.mismatches.length > 60) console.log(`  ...${findings.mismatches.length - 60} more`);

console.log("");
console.log("=== SILENT-E AT END (no split digraph) ===");
console.log(`Found ${findings.silentE.length}`);
const seByWord = new Map();
for (const e of findings.silentE) {
  if (!seByWord.has(e.word)) seByWord.set(e.word, []);
  seByWord.get(e.word).push(e);
}
for (const [w, ins] of [...seByWord.entries()].sort((a,b) => b[1].length - a[1].length).slice(0, 25)) {
  const books = [...new Set(ins.map(i => i.book))].sort();
  console.log(`  '${w}': ${ins.length} occurrences in ${books.join(", ")}`);
}

fs.writeFileSync("/tmp/findings.json", JSON.stringify(findings, null, 2));
