// Replay the NEW QA checks against ARCHIVED images — no generation, pennies
// (Lynden 2026-08-15: "use the archived Idris images as free test fixtures
// with known expected failures before another paid run").
//
// Fixtures and expected outcomes:
//   1. Idris cover (embedded painted title)      -> coverContentQA FAIL
//   2. Amira cover (clean, title-free)           -> coverContentQA PASS
//   3. Idris p5 (3 unallocated figs beside him)  -> sceneConsistencyQA FAIL
//   4. Idris p6 (Dad+Grandad absent at sharing)  -> sceneConsistencyQA FAIL
//   5. Amira p6 (train visibly held, hugging Mum)-> sceneConsistencyQA PASS
//
// Imports the forge modules directly — the vite server is not involved.
import { coverContentQA, sceneConsistencyQA } from "./server/forge/claude.mjs";
import { loadByUrl } from "./server/forge/storage.mjs";
import { getBook } from "./server/forge/db.mjs";

const IDRIS = "147dc48c-e52e-4f3e-8892-7a775f046986";
const AMIRA = "5378b365-ee09-4618-a9e9-33c5ddde1f64";

const idris = await getBook(IDRIS);
const amira = await getBook(AMIRA);
const ij = idris?.progress?.job || {};
if (!ij.coverUrl || !(ij.sceneUrls || []).length) throw new Error("Idris job assets missing from archive");
const amiraPages = (amira?.pages || []).filter((p) => p.type === "story");
const amiraCoverUrl = amira?.pages?.[0]?.imageUrl;

async function b64Of(url) {
  const buf = await loadByUrl(url);
  if (!buf) throw new Error(`could not load ${url}`);
  return buf.toString("base64");
}

let passCount = 0, failCount = 0;
function verdict(name, expected, actualPass, detail) {
  const got = actualPass ? "PASS" : "FAIL";
  const ok = got === expected;
  ok ? passCount++ : failCount++;
  console.log(`\n${ok ? "✓" : "✗ WRONG"} [${name}] expected ${expected}, got ${got}`);
  console.log(`   ${detail}`);
}

// --- 1. Idris cover: embedded painted title must be detected -------------
{
  const r = await coverContentQA(await b64Of(ij.coverUrl));
  verdict("idris-cover-lettering", "FAIL", r.data.pass,
    `embedded_text_present=${r.data.embedded_text_present} detected=${JSON.stringify(r.data.detected_text)} — ${r.data.reason}`);
}

// --- 2. Amira cover: clean, must pass ------------------------------------
{
  const r = await coverContentQA(await b64Of(amiraCoverUrl));
  verdict("amira-cover-clean", "PASS", r.data.pass,
    `embedded_text_present=${r.data.embedded_text_present} detected=${JSON.stringify(r.data.detected_text)} — ${r.data.reason}`);
}

// --- 3. Idris page 5: ownership/negative-state contradiction -------------
{
  const p5 = ij.story.pages[4];
  const r = await sceneConsistencyQA(await b64Of(ij.sceneUrls[4]), {
    sceneText: p5.text,
    objectsBlock: "figs — three ripe purple figs; the brass tray with star marks",
    characterRefs: [],
    assertions: {
      required: [
        { object: "figs", assertion: "each of the three figs sits directly in front of Mum, Dad or Grandad — visibly allocated to THEM, not to Idris" },
        { object: "space in front of Idris", assertion: "visibly empty — no fig in front of him, his hands empty" },
      ],
      forbidden: [
        { object: "figs", assertion: "any fig held by Idris or sitting unallocated directly beside/in front of Idris" },
      ],
    },
  });
  verdict("idris-p5-negative-state", "FAIL", r.data.pass,
    `state_assertions: ${String(r.data.state_assertions).slice(0, 300)}`);
}

// --- 4. Idris page 6: sharing resolution must show the recipients --------
{
  const p6 = ij.story.pages[5];
  const r = await sceneConsistencyQA(await b64Of(ij.sceneUrls[5]), {
    sceneText: p6.text,
    objectsBlock: "fig bits on the brass tray's star marks",
    characterRefs: [],
    assertions: {
      required: [
        { object: "family", assertion: "Mum, Dad AND Grandad all visibly present receiving/taking their share of the fig bits — the 'for all' resolution must be seen, not implied" },
        { object: "fig bits", assertion: "split pieces set out at the tray's star marks for every person" },
      ],
      forbidden: [],
    },
  });
  verdict("idris-p6-resolution-recipients", "FAIL", r.data.pass,
    `state_assertions: ${String(r.data.state_assertions).slice(0, 300)}`);
}

// --- 5. Amira page 6: correct possession scene must still pass -----------
{
  const p6 = amiraPages[5];
  const r = await sceneConsistencyQA(await b64Of(p6.imageUrl), {
    sceneText: p6.text,
    objectsBlock: "the small red toy train — wet but recovered",
    characterRefs: [],
    assertions: {
      required: [
        { object: "toy train", assertion: "visibly in Amira's possession (in her hand or held against her) — clearly recovered, not lost" },
      ],
      forbidden: [
        { object: "toy train", assertion: "still inside or under the drain grate" },
      ],
    },
  });
  verdict("amira-p6-correct-possession", "PASS", r.data.pass,
    `state_assertions: ${String(r.data.state_assertions).slice(0, 300)}`);
}

console.log(`\n=== REPLAY RESULT: ${passCount}/5 checks behaved as expected, ${failCount} wrong ===`);
process.exit(failCount ? 1 : 0);
