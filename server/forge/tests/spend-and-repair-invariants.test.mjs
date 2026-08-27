import assert from "node:assert/strict";
import fs from "node:fs";
import { canonicalCharacterSpec } from "../jobs.mjs";

const specA = canonicalCharacterSpec({ id: "same", child_name: "Mia", child_age: 6, appearance: { hair: "dark bob" } });
const specB = canonicalCharacterSpec({ id: "same", child_name: "Mia", child_age: 6, appearance: { hair: "dark bob" } });
assert.deepEqual(specA, specB, "the same book must receive the same canonical outfit");
assert.ok(specA.outfit, "a missing wizard outfit must be filled before hero generation");

const source = fs.readFileSync(new URL("../jobs.mjs", import.meta.url), "utf8");
assert.match(source, /job\.assembled = true;\s*await updateBook\(book\.id/,
  "assembly must mark the job complete before persisting");
assert.match(source, /progress: \{ step: "done", message: "Your book is ready!", pct: 100, job \}/,
  "ready progress must retain the repair snapshot");
assert.match(source, /const CANDIDATES = 1;/, "production must write one draft, not run a tournament");
assert.match(source, /The title must contain the hero's exact name/, "title/hero must be a deterministic gate");

const imageSource = fs.readFileSync(new URL("../images.mjs", import.meta.url), "utf8");
assert.match(imageSource, /FORGE_PER_PAGE_QA === "1"/, "per-page repaint QA must be opt-in");

const spendSource = fs.readFileSync(new URL("../spend.mjs", import.meta.url), "utf8");
assert.match(spendSource, /X-Client-Request-Id|clientRequestId/,
  "every paid call must carry a durable client request id");

console.log("PASS - cost, story, identity and ready-book invariants are guarded");
