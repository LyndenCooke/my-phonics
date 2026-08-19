// (b) CHAINED TWO-SCENE PROOF (Lynden 2026-08-17): do the one-thread
// storyboard's briefs, generated on the CHAINED Responses path, close the
// chat-vs-API image gap? Uses Hamza pages 3 and 4 — the mechanism turn
// (slack cord -> taut cord, kite low -> mid-height), which is exactly the
// continuity a chain should carry and stateless generation kept dropping.
//
// Spend: 1 hero sheet + 2 chained scenes. Estimated $1.0-1.6 total.
import fs from "node:fs";
import { generateHero, generateScene } from "./server/forge/images.mjs";

const j = JSON.parse(fs.readFileSync("one_thread_book.json", "utf8"));
const t = (l) => j.transcript.find((x) => x.label === l).data;
const fin = t("storyboard-gate");
const review = t("editor");
const story = review.fixed_story;
const P = (n) => fin.pages.find((p) => p.page === n);

const child = {
  name: j.child.name, age: j.child.age,
  city: j.setting.city, country: j.setting.country,
  appearance: {
    gender: j.child.gender, skinTone: j.child.skinTone, hair: j.child.hair,
    outfit: "a plain teal thobe-style tunic and dark trousers with brown sandals",
  },
};

const OUT = "public/custom-books/chain-proof-hamza";
fs.mkdirSync(OUT, { recursive: true });
let total = 0;
const log = (label, cost, qa) => {
  total += cost || 0;
  console.log(`[${label}] $${(cost || 0).toFixed(3)} | qa: ${qa ? `${qa.pass} (${String(qa.reason || "").slice(0, 90)})` : "n/a"} | running $${total.toFixed(3)}`);
};

console.log(`CHAIN PROOF: ${child.name} p3->p4 (${story.title})\n`);

// 1. hero sheet
const hero = await generateHero({ child });
fs.writeFileSync(`${OUT}/hero.png`, hero.buf);
log("hero", hero.cost, hero.qa);

// 2. scene 3 — starts the chain
const p3 = P(3);
const s3 = await generateScene({
  heroBuf: hero.buf,
  scene: p3.brief,
  child,
  pageText: story.pages[2].text,
  camera: "wide",
  assertions: { required: p3.required_visible_states, forbidden: p3.forbidden_visible_states },
  chainEnabled: true,
});
fs.writeFileSync(`${OUT}/scene3.png`, s3.buf);
log("scene3 (chain start)", s3.cost, s3.qa);

// 3. scene 4 — continues the SAME response chain, and also gets scene 3 as
// prevBuf, plus the carries_forward contract appended to the brief.
const p4 = P(4);
const s4 = await generateScene({
  heroBuf: hero.buf,
  scene: `${p4.brief} CONTINUITY CONTRACT inherited from the previous image: ${P(3).carries_forward}`,
  child,
  pageText: story.pages[3].text,
  camera: "mid",
  prevBuf: s3.buf,
  assertions: { required: p4.required_visible_states, forbidden: p4.forbidden_visible_states },
  previousResponseId: s3.responseId || null,
  chainEnabled: true,
});
fs.writeFileSync(`${OUT}/scene4.png`, s4.buf);
log("scene4 (chained)", s4.cost, s4.qa);

console.log(`\nTOTAL: $${total.toFixed(3)} — images in ${OUT}/`);
