import assert from "node:assert/strict";
import fs from "node:fs";
import { buildEntityStateLedger, buildExpectedAssertions, canonicalCharacterSpec, objectiveVisualFailures, styleIssues, validateDirectedContinuity } from "../jobs.mjs";

const specA = canonicalCharacterSpec({ id: "same", child_name: "Mia", child_age: 6, appearance: { hair: "dark bob" } });
const specB = canonicalCharacterSpec({ id: "same", child_name: "Mia", child_age: 6, appearance: { hair: "dark bob" } });
assert.deepEqual(specA, specB, "the same book must receive the same canonical outfit");
assert.ok(specA.outfit, "a missing wizard outfit must be filled before hero generation");

const miaStory = { title: "Feed for Three Sheep", pages: [
  { text: "Mia has a job to feed three sheep." }, { text: "She sets three tubs on the grass." },
  { text: "Dad helps her fill the three tubs." }, { text: "The sheep rush to one tub." },
  { text: "The shy sheep stays back by the shed." },
] };
const miaIssues = styleIssues(miaStory, { child_name: "Mia", level: 4 });
assert.ok(miaIssues.some((i) => /undifferentiated animal group/.test(i.detail)),
  "the archived shy-sheep contradiction must be blocked before direction");

const expected = buildExpectedAssertions([{ required_visible_states: [{ assertion: "Exactly three sheep." }], forbidden_visible_states: [] }], "Mia");
const failures = objectiveVisualFailures(expected, [{ id: "p1:required:1", pass: false, observed: "Only two sheep." }]);
assert.equal(failures.length, 2, "a failed count and omitted identity check must both block");
assert.ok(failures.every((f) => f.severity === "major"));

const continuity = validateDirectedContinuity({ pages: [
  { text: "The sheep rush to one tub." }, { text: "The shy sheep stays back by the shed." },
] }, [
  { objects: [{ name: "shy sheep", state: "crowding at the same tub" }] },
  { objects: [{ name: "shy sheep", state: "standing back by the shed, not eating" }] },
]);
assert.equal(continuity.length, 1, "stays/remains must preserve the entity's previous directed state");
const ledger = buildEntityStateLedger(miaStory, [{ objects: [{ name: "shy sheep", state: "back by shed" }] }]);
assert.deepEqual(ledger[0], {
  page: 1, text: "Mia has a job to feed three sheep.",
  entities: [{ name: "shy sheep", state: "back by shed" }],
}, "the exact directed entity state must survive for audit and final review");

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
