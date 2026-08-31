import assert from "node:assert/strict";
import fs from "node:fs";
import { buildEntityStateLedger, buildExpectedAssertions, canonicalCharacterSpec, normaliseDirectedSettingPlan, objectiveVisualFailures, styleIssues, validateDirectedContinuity } from "../jobs.mjs";
import { isReleasedDuplicate } from "../spend.mjs";

assert.equal(isReleasedDuplicate({ allowed: false, reason: "duplicate operation", status: "released" }), true,
  "a definitively unbilled duplicate key may advance to a fresh key");
assert.equal(isReleasedDuplicate({ allowed: false, reason: "duplicate operation", status: "confirmed" }), false,
  "a confirmed duplicate must remain blocked");

const specA = canonicalCharacterSpec({ id: "same", child_name: "Mia", child_age: 6, appearance: { hair: "dark bob" } });
const specB = canonicalCharacterSpec({ id: "same", child_name: "Mia", child_age: 6, appearance: { hair: "dark bob" } });
assert.deepEqual(specA, specB, "the same book must receive the same canonical outfit");
assert.ok(specA.outfit, "a missing wizard outfit must be filled before hero generation");
const boySpec = canonicalCharacterSpec({ id: "milo-test", child_name: "Milo", child_age: 6, appearance: { gender: "boy", hair: "short curls" } });
assert.doesNotMatch(boySpec.outfit, /dress|skirt|tunic/i, "a submitted boy must never be assigned the feminine outfit pool");

const miaStory = { title: "Feed for Three Sheep", pages: [
  { text: "Mia has a job to feed three sheep." }, { text: "She sets three tubs on the grass." },
  { text: "Dad helps her fill the three tubs." }, { text: "The sheep rush to one tub." },
  { text: "The shy sheep stays back by the shed." },
] };
const miaIssues = styleIssues(miaStory, { child_name: "Mia", level: 4 });
assert.ok(miaIssues.some((i) => /undifferentiated animal group/.test(i.detail)),
  "the archived shy-sheep contradiction must be blocked before direction");
const miloSearchIssues = styleIssues({ title: "Milo and the Jeep", pages: [
  { text: "Is it in his box? A car, but not his jeep!" },
  { text: "Is it on his bed? A truck, but not his jeep!" },
] }, { child_name: "Milo", level: 4 });
assert.ok(miloSearchIssues.some((i) => i.area === "premise" && /temporarily blocked/.test(i.detail)),
  "repetitive search premises must stop before image spend");
const theoSearchIssues = styleIssues({ title: "Theo and the Green Pouch", pages: [
  { text: "Theo checked his bag. His pouch was not in it!" },
  { text: "He checked by the bench. No pouch was in that spot!" },
  { text: "He checked by the shop step. Still no pouch!" },
] }, { child_name: "Theo", level: 4 });
assert.ok(theoSearchIssues.some((i) => i.area === "premise"),
  "location-by-location lost-object searches must stop before image spend");

const expected = buildExpectedAssertions([{ required_visible_states: [{ assertion: "Exactly three sheep." }], forbidden_visible_states: [] }], "Mia");
const failures = objectiveVisualFailures(expected, [{ id: "p1:required:1", pass: false, observed: "Only two sheep." }]);
assert.equal(failures.length, 2, "a failed count and omitted identity check must both block");
assert.ok(failures.every((f) => f.severity === "major"));
const flowExpected = buildExpectedAssertions([{ required_visible_states: [], forbidden_visible_states: [], flow_paths: [{
  substance: "red drink", source: "inside the red cup", exit: "the lid's drinking slot",
  route: "a continuous downward stream", destination: "on the cream cloth",
  forbidden_exits: ["the sealed cup base", "the side wall", "the sleeve"],
}] }], "Elsie");
assert.match(flowExpected.find((a) => a.kind === "flow")?.assertion || "", /exits ONLY through the lid's drinking slot/,
  "the final editor must trace liquid through the director-specified real opening");
const missingFlow = validateDirectedContinuity({ pages: [{ text: "The cup tips over and spills.", location: "cart" }] }, [{
  setting_id: "cart", setting_relation: "new-setting", camera: "wide", objects: [], flow_paths: [],
}]);
assert.ok(missingFlow.some((f) => /supplied no source\/exit\/route\/destination/.test(f)),
  "a director cannot leave flow topology blank on a spill page");

const continuity = validateDirectedContinuity({ pages: [
  { text: "The sheep rush to one tub.", location: "field" }, { text: "The shy sheep stays back by the shed.", location: "field" },
] }, [
  { setting_id: "field", setting_relation: "new-setting", camera: "wide", objects: [{ name: "shy sheep", state: "crowding at the same tub" }] },
  { setting_id: "field", setting_relation: "same-setting-new-angle", camera: "new-angle", objects: [{ name: "shy sheep", state: "standing back by the shed, not eating" }] },
]);
assert.equal(continuity.length, 1, "stays/remains must preserve the entity's previous directed state");
const badSettingPlan = validateDirectedContinuity({ pages: [
  { text: "Mia is in the field.", location: "field" },
  { text: "She stays in the field.", location: "field" },
] }, [
  { setting_id: "field", setting_relation: "same-view", camera: "same-view", objects: [] },
  { setting_id: "field", setting_relation: "new-setting", camera: "wide", objects: [] },
]);
assert.ok(badSettingPlan.length >= 2, "the director must plan first visits and revisits consistently before painting");
const groupedSettings = normaliseDirectedSettingPlan({ pages: [
  { location: "cart-front" }, { location: "cart-edge" }, { location: "cart-spill" },
] }, [
  { setting_id: "cart-front", setting_relation: "new-setting" },
  { setting_id: "cart-edge", setting_relation: "same-setting-closeup" },
  { setting_id: "cart-spill", setting_relation: "same-setting-new-angle" },
]);
assert.deepEqual(groupedSettings.map((p) => p.setting_id), ["cart-front", "cart-edge", "cart-spill"],
  "code must not guess setting membership and accidentally attach a returning scene to the intervening room");
assert.ok(validateDirectedContinuity({ pages: [{ text: "At the cart.", location: "cart" }, { text: "At the cart edge.", location: "edge" }] }, groupedSettings.slice(0, 2))
  .some((f) => /first visits cart-edge/.test(f)), "a continuation using an unknown canonical setting id must stop before painting");
const ledger = buildEntityStateLedger(miaStory, [{ objects: [{ name: "shy sheep", state: "back by shed" }] }]);
assert.deepEqual(ledger[0], {
  page: 1, text: "Mia has a job to feed three sheep.",
  entities: [{ name: "shy sheep", identity_lock: "", state: "back by shed" }],
}, "the exact directed entity state must survive for audit and final review");

const objectIdentityStory = { pages: [{ text: "Milo sets the track." }, { text: "The track runs to the bush." }] };
const objectIdentityPlan = [
  { setting_id: "garden", setting_relation: "new-setting", camera: "wide", objects: [{ name: "track", identity_lock: "one compact grey U-shaped track with two straight arms", state: "flat on path" }] },
  { setting_id: "garden", setting_relation: "same-setting-new-angle", camera: "new-angle", objects: [{ name: "track", identity_lock: "one long grey track with one curved end", state: "flat, aimed at bush" }] },
];
assert.ok(validateDirectedContinuity(objectIdentityStory, objectIdentityPlan)
  .some((f) => /changes track's immutable identity/.test(f)), "object geometry drift must stop before painting");

const source = fs.readFileSync(new URL("../jobs.mjs", import.meta.url), "utf8");
assert.match(source, /job\.assembled = true;\s*await updateBook\(book\.id/,
  "assembly must mark the job complete before persisting");
assert.match(source, /progress: \{ step: "done", message: "Your book is ready!", pct: 100, job \}/,
  "ready progress must retain the repair snapshot");
assert.match(source, /const CANDIDATES = 1;/, "production must write one draft, not run a tournament");
assert.match(source, /return "storyBlocked"/, "a second manuscript with open majors must stop before paint");
assert.match(source, /hero identity failed before scenes/, "hero identity must be gated before scene generation");
assert.match(source, /The title must contain the hero's exact name/, "title/hero must be a deterministic gate");
assert.match(source, /setting_page\$\{i \+ 1\}\.jpg/, "location anchors must use immutable setting files, never mutable page files");

const imageSource = fs.readFileSync(new URL("../images.mjs", import.meta.url), "utf8");
assert.match(imageSource, /FORGE_PER_PAGE_QA === "1"/, "per-page repaint QA must be opt-in");
assert.match(imageSource, /immutable SETTING PLATE/, "scene prompts must separate the fixed setting from the current cast");

const claudeSource = fs.readFileSync(new URL("../claude.mjs", import.meta.url), "utf8");
assert.match(claudeSource, /anthropicJudgeOk = false;[\s\S]{0,300}return callJson\(\{ system, content, schema, maxTokens, tier, judge \}\)/,
  "a dead Anthropic judge must fall through to Vertex instead of the writer judging itself");
assert.match(claudeSource, /tier === "story"\s*\? \(judge \? OPENAI_PHONICS_MODEL : OPENAI_STORY_MODEL\)/,
  "when no second vendor is available, the story judge must use a different OpenAI model from the writer");

const spendSource = fs.readFileSync(new URL("../spend.mjs", import.meta.url), "utf8");
assert.match(spendSource, /X-Client-Request-Id|clientRequestId/,
  "every paid call must carry a durable client request id");

console.log("PASS - cost, story, identity and ready-book invariants are guarded");
