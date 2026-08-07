// Re-vendor the phonics data the forge reads at runtime into
// server/forge/assets/data/, where the serverless bundle can actually see it.
//
// Why this exists: the lambda's includeFiles glob for myphonics_books/data
// never delivered the files (/var/task/myphonics_books/... ENOENT at cold
// start), and a hand-copied vendored file drifts the moment someone edits the
// curriculum. So this runs as npm prebuild — locally AND on Vercel — and the
// vendored copies are refreshed on every single build. They are also
// committed, so the repo works even where prebuild hasn't run.
//
// green_words.json is special: its source of truth is a build artefact under
// gitignored output/ (scripts/build_word_ledger.py). It refreshes only where
// that file exists (the studio machine) and otherwise keeps the committed copy.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "myphonics_books", "data");
const DST = path.join(ROOT, "server", "forge", "assets", "data");

const FILES = [
  "graphemes_by_level.json",
  "tricky_words_by_level.json",
  "reading_progression.json",
  "pronunciations.json",
];

fs.mkdirSync(DST, { recursive: true });
for (const f of FILES) {
  const from = path.join(SRC, f);
  if (!fs.existsSync(from)) {
    // Missing source + missing vendored copy = a broken forge; say so now,
    // at build time, not at a customer's checkout.
    if (!fs.existsSync(path.join(DST, f))) {
      console.error(`[sync-forge-data] MISSING ${f} (no source, no vendored copy)`);
      process.exit(1);
    }
    continue;
  }
  fs.copyFileSync(from, path.join(DST, f));
}

const gw = path.join(ROOT, "myphonics_books", "output", "worksheet_plan", "green_words.json");
if (fs.existsSync(gw)) fs.copyFileSync(gw, path.join(ROOT, "server", "forge", "assets", "green_words.json"));

console.log(`[sync-forge-data] vendored ${FILES.length} data files -> server/forge/assets/data`);
