// COMPLETE THE ONE-THREAD BOOKS (Lynden 2026-08-17 "complete the books"):
// hero + cast sheet + chained scenes + cover for each planned book, then the
// real PDF template. Scenes run on the Responses chain with each page's
// carries_forward contract, and EVERY brief carries the key-object identity
// pin (the chain proof's kite went green->red because nothing pinned it).
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { generateHero, generateCastMember, generateScene, generateObjectRef, generateLandmark } from "./server/forge/images.mjs";

const BOOKS = [
  { file: "one_thread_hamza_v2.json", slug: "hamza", outfit: "a plain teal thobe-style tunic, dark trousers and brown sandals" },
  { file: "one_thread_case1.json", slug: "safa", outfit: "a lilac tunic with long sleeves, navy trousers, a small white hijab and white shoes" },
  { file: "one_thread_case2.json", slug: "danyal", outfit: "a mustard kurta, dark trousers and brown sandals" },
  { file: "one_thread_zaid.json", slug: "zaid", outfit: "a plain sand-coloured thobe-style tunic that reaches below his knees, long dark trousers showing beneath it so no bare legs are visible, shoulders fully covered, and brown sandals" },
  { file: "one_thread_case3.json", slug: "maryam", outfit: "a cream hijab worn properly and covering ALL her hair (no hair visible at the front, sides or back), a rose-pink long-sleeved tunic, dark blue trousers and dark shoes" },
];

const only = process.argv[2]; // optional slug filter
let grand = 0;

for (const B of BOOKS) {
  if (only && B.slug !== only) continue;
  const j = JSON.parse(fs.readFileSync(B.file, "utf8"));
  const t = (l) => j.transcript.find((x) => x.label === l).data;
  const story = t("editor").fixed_story;
  const fin = t("storyboard-gate");
  const dir = `public/custom-books/onethread-${B.slug}`;
  fs.mkdirSync(dir, { recursive: true });

  const child = {
    name: j.child.name, age: j.child.age, city: j.setting.city, country: j.setting.country,
    appearance: { gender: j.child.gender, skinTone: j.child.skinTone, hair: j.child.hair, outfit: B.outfit },
  };
    // SECTION 20.5: pin object identity ONLY on pages where the storyboard
  // places it (a pin in every brief made the resolution bowl appear on p1).
  const placements = t("storyboard-gate").object_placements || null;
  const pinText = (objs) => objs.length
    ? ` KEY OBJECT IDENTITY, FIXED FOR THE WHOLE BOOK - never change colour, shape or design between pages: ${objs.map((o) => `${o.name}: ${o.description}`).join("; ")}.`
    : "";
  const objectPin = pinText(story.key_objects || []); // cover + legacy books
  const pinFor = (pageNo) => pinText((story.key_objects || []).filter((o) => {
    if (!placements) return true;
    const op = placements.find((x) => o.name.toLowerCase().includes(x.object.toLowerCase()) || x.object.toLowerCase().includes(o.name.toLowerCase()));
    return op ? op.pages_present.includes(pageNo) : true;
  }));
  const castPlacements = t("storyboard-gate").cast_placements || null;
  const heroKey = j.child.name.toLowerCase();
  const castOnPage = (pageNo, refs) => refs.filter((r) => {
    if (!castPlacements) return true;
    const cp = castPlacements.find((x) => String(x.cast_id).toLowerCase().includes(String(r.id).toLowerCase()));
    return cp ? cp.pages_present.includes(pageNo) : true;
  });
  const objOnPage = (pageNo, refs) => refs.filter((r) => {
    const op = (fin.object_placements || []).find((x) => r.name.toLowerCase().includes(x.object.toLowerCase()) || x.object.toLowerCase().includes(r.name.toLowerCase()));
    return op ? op.pages_present.includes(pageNo) : true;
  });

  let cost = 0;
  const CAP = Number(process.env.FORGE_BOOK_IMG_CAP || 1.75);
const log = (label, c, qa) => { cost += c || 0; grand += c || 0; console.log(`  [${B.slug}/${label}] $${(c || 0).toFixed(3)}${qa && !qa.pass ? ` QA-FAIL: ${String(qa.reason).slice(0, 80)}` : ""} — book $${cost.toFixed(2)} grand $${grand.toFixed(2)}`); if (cost > CAP) throw new Error(`HARD CAP (20.10): ${B.slug} images $${cost.toFixed(2)} > $${CAP} - stopping; harness is resume-aware, images on disk are kept`); };

  console.log(`\n==== ${B.slug}: "${story.title}" (${story.pages.length}pp) ====`);
  // RESUME-AWARE: anything already on disk is paid for — reuse it.
  const have = (f) => fs.existsSync(`${dir}/${f}`) ? fs.readFileSync(`${dir}/${f}`) : null;
  let heroBuf = have("hero.png");
  if (heroBuf) { console.log(`  [${B.slug}/hero] reused from disk`); }
  else { const hero = await generateHero({ child }); heroBuf = hero.buf; fs.writeFileSync(`${dir}/hero.png`, heroBuf); log("hero", hero.cost, hero.qa); }

  // one adult cast sheet if the story has one
  let castRefs = [];
  // FIXED cast picker: never the hero (by id OR name substring) — the first
  // run generated a duplicate hero sheet for every book.
  const heroName = child.name.toLowerCase();
  const adult = (story.cast || []).find((c) =>
    !/hero|child/i.test(c.id) &&
    !String(c.id).toLowerCase().includes(heroName) &&
    // possessives ("Zaid’s dad") are NOT the hero - strip them before testing
    !String(c.who || "").toLowerCase().replace(new RegExp(heroName + "[’']s", "g"), "").includes(heroName));
  if (adult) {
    const cf = `cast_${adult.id.replace(/\W+/g, "_")}.png`;
    let cbuf = have(cf);
    if (cbuf) { console.log(`  [${B.slug}/cast:${adult.id}] reused from disk`); }
    else { const cs = await generateCastMember({ member: { id: adult.id, who: adult.who, appearance: adult.appearance }, child }); cbuf = cs.buf; fs.writeFileSync(`${dir}/${cf}`, cbuf); log(`cast:${adult.id}`, cs.cost, cs.qa); }
    castRefs = [{ id: adult.id, name: adult.who, buf: cbuf }];
  }

  // OBJECT REFERENCE SHEETS - 20.5 declares them required; this lane never made them.
  const objectRefs = [];
  for (const o of story.key_objects || []) {
    const of = `object_${o.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`;
    let obuf = have(of);
    if (obuf) { console.log(`  [${B.slug}/object:${o.name}] reused from disk`); }
    else { const r = await generateObjectRef({ name: o.name, look: o.description, child }); obuf = r.buf; fs.writeFileSync(`${dir}/${of}`, obuf); log(`object:${o.name}`, r.cost, r.qa); }
    objectRefs.push({ name: o.name, buf: obuf });
  }
  let prevBuf = null, prevId = null;
  for (let i = 0; i < story.pages.length; i++) {
    const existing = have(`page${i + 1}.png`);
    if (existing) { prevBuf = existing; console.log(`  [${B.slug}/page${i + 1}] reused from disk`); continue; }
    const fp = fin.pages.find((x) => x.page === i + 1) || {};
    const contract = i > 0 ? ` CONTINUITY CONTRACT inherited from the previous image: ${(fin.pages.find((x) => x.page === i) || {}).carries_forward || ""}` : "";
    const s = await generateScene({
      heroBuf,
      scene: `${fp.brief || story.pages[i].scene}${pinFor(i + 1)}${contract}`,
      child,
      pageText: story.pages[i].text,
      camera: i % 2 === 0 ? "wide" : "mid",
      prevBuf,
      castRefs: castOnPage(i + 1, castRefs),
      objectRefs: objOnPage(i + 1, objectRefs),
      assertions: fp.required_visible_states ? { required: fp.required_visible_states, forbidden: fp.forbidden_visible_states || [] } : null,
      previousResponseId: prevId,
      chainEnabled: true,
    });
    fs.writeFileSync(`${dir}/page${i + 1}.png`, s.buf);
    prevBuf = s.buf; prevId = s.responseId || prevId;
    log(`page${i + 1}`, s.cost, s.qa);
    if (s.qa?.consistency && !s.qa.consistency.pass) console.log(`  [${B.slug}/page${i + 1}] CONSISTENCY-FAIL (shipped after 1 repair): ${String(s.qa.consistency.reason).slice(0, 140)}`);
  }

  // COVER = one of the story's own images (Lynden 2026-08-20): clear face,
  // no spoiler, nominated by the storyboard gate. Portrait 3:4 crop around
  // the hero's side of the frame. No cover generation, no cover drift.
  if (!have("cover.png")) {
    const srcPage = fin.cover_source_page && fin.cover_source_page >= 1 && fin.cover_source_page <= story.pages.length ? fin.cover_source_page : 1;
    const side = fin.cover_hero_side || "left";
    const src = `${dir}/page${srcPage}.png`;
    const meta = await sharp(src).metadata();
    const cw = Math.min(meta.width, Math.round(meta.height * 3 / 4));
    const left = side === "left" ? 0 : side === "right" ? meta.width - cw : Math.round((meta.width - cw) / 2);
    await sharp(src).extract({ left, top: 0, width: cw, height: meta.height }).toFile(`${dir}/cover.png`);
    console.log(`  [${B.slug}/cover] cropped from page${srcPage} (hero ${side}) - $0.00`);
  } else { console.log(`  [${B.slug}/cover] reused from disk`); }

  // Landmark postcard for the Meet the Star page (was rendering half-empty).
  const lmPlan = t("storyboard-gate").landmark;
  if (lmPlan && !have("landmark.png")) {
    const lr = await generateLandmark({ name: lmPlan.name, imageBrief: lmPlan.image_brief, city: j.setting.city, country: j.setting.country });
    fs.writeFileSync(`${dir}/landmark.png`, lr.buf);
    log("landmark", lr.cost, lr.qa);
  } else if (lmPlan) { console.log(`  [${B.slug}/landmark] reused from disk`); }
  // spec for the real template renderer (jpg conversion happens after)
  const spec = {
    book_title: story.title, child_name: child.name, level: j.level, focus_sound: j.sound,
    story_pages: story.pages.map((p) => p.text),
    story_words: story.read_words, read_words: story.read_words,
    questions: [], alien_words: [], tricky_words_used: story.tricky_words_used || [],
    shifty_marks: {}, pronunciation_notes: [],
    images_dir: path.resolve(dir), out_path: path.resolve(`${dir}/book.pdf`),
    profile: { name: child.name, age: child.age, country: child.country, countryFlag: "", likes: j.likes || "", culture: j.setting.culture, faith: "Muslim", landmark: lmPlan ? { name: lmPlan.name, fact: lmPlan.fact } : null },
  };
  fs.writeFileSync(`${dir}/pdf_spec.json`, JSON.stringify(spec, null, 1));
  console.log(`  ${B.slug} images done: $${cost.toFixed(2)}`);
}
console.log(`\nGRAND TOTAL (images): $${grand.toFixed(2)}`);
