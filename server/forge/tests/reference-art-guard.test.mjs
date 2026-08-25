// Prove the never-again guard, with no API spend: simulate exactly what went
// wrong on Nuh's book — a story replaced under a job that still holds the old
// story's cast and prop reference art.
import fs from "node:fs";
const src = fs.readFileSync("C:/Users/ASUS/myphonicsbooks/server/forge/jobs.mjs", "utf8");

// pull the two functions out of the module so we can exercise them directly
const sigFn = src.match(/function storySignature[\s\S]*?\n}/)[0];
const ensureFn = src.match(/function ensureSheetsMatchStory[\s\S]*?\n}/)[0];
const mod = new Function(`${sigFn}\n${ensureFn}\nreturn {storySignature, ensureSheetsMatchStory};`)();

const mothStory = { cast: [{ id: "nuh", who: "Nuh" }, { id: "dad", who: "Dad" }], key_objects: [{ name: "moth" }, { name: "web" }, { name: "stick" }] };
const catStory = { cast: [{ id: "nuh", who: "Nuh" }, { id: "mum", who: "Mum" }], key_objects: [{ name: "cat prints" }, { name: "shed" }] };

const job = { story: mothStory, castSheets: {}, objectSheets: {}, breakdown: {} };
mod.ensureSheetsMatchStory(job);                        // first paint of the moth story
job.castSheets = { nuh: {}, dad: {} };                  // reference art gets drawn
job.objectSheets = { moth: {}, web: {}, stick: {} };

console.log("BEFORE story swap: cast", Object.keys(job.castSheets), "objects", Object.keys(job.objectSheets));
job.story = catStory;                                    // the story is replaced (any path)
mod.ensureSheetsMatchStory(job);                         // next paint
console.log("AFTER  story swap: cast", Object.keys(job.castSheets), "objects", Object.keys(job.objectSheets));
console.log("discarded record:", JSON.stringify(job.breakdown.stale_sheets_discarded));

// Correct behaviour is GRANULAR: the moth story's Dad and its props go, the
// hero (unchanged) stays — redrawing him would be money burnt for nothing.
const dadGone = !job.castSheets.dad;
const propsGone = Object.keys(job.objectSheets).length === 0;
const heroKept = Boolean(job.castSheets.nuh);
// and a second pass with nothing changed must discard nothing at all
job.castSheets.mum = {};
mod.ensureSheetsMatchStory(job);
const stable = Boolean(job.castSheets.nuh) && Boolean(job.castSheets.mum);
console.log(`dad dropped: ${dadGone} | moth props dropped: ${propsGone} | hero kept: ${heroKept} | stable on re-check: ${stable}`);
const ok = dadGone && propsGone && heroKept && stable;
console.log(ok ? "\nPASS — only what changed is discarded" : "\nFAIL");
process.exit(ok ? 0 : 1);
