// COMPLETE THE ONE-THREAD BOOKS (Lynden 2026-08-17 "complete the books"):
// hero + cast sheet + chained scenes + cover for each planned book, then the
// real PDF template. Scenes run on the Responses chain with each page's
// carries_forward contract, and EVERY brief carries the key-object identity
// pin (the chain proof's kite went green->red because nothing pinned it).
import fs from "node:fs";
import path from "node:path";
import { generateHero, generateCastMember, generateScene, generateCover } from "./server/forge/images.mjs";

const BOOKS = [
  { file: "one_thread_hamza_v2.json", slug: "hamza", outfit: "a plain teal thobe-style tunic, dark trousers and brown sandals" },
  { file: "one_thread_case1.json", slug: "safa", outfit: "a lilac tunic with long sleeves, navy trousers, a small white hijab and white shoes" },
  { file: "one_thread_case2.json", slug: "danyal", outfit: "a mustard kurta, dark trousers and brown sandals" },
  { file: "one_thread_case3.json", slug: "maryam", outfit: "a rose-pink long-sleeved tunic, dark blue trousers, a cream scarf and dark shoes" },
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
  // KEY OBJECT IDENTITY PIN — same words in every brief and the cover.
  const objectPin = (story.key_objects || []).length
    ? ` KEY OBJECT IDENTITY, FIXED FOR THE WHOLE BOOK — never change colour, shape or design between pages: ${story.key_objects.map((o) => `${o.name}: ${o.description}`).join("; ")}.`
    : "";

  let cost = 0;
  const log = (label, c, qa) => { cost += c || 0; grand += c || 0; console.log(`  [${B.slug}/${label}] $${(c || 0).toFixed(3)}${qa && !qa.pass ? ` QA-FAIL: ${String(qa.reason).slice(0, 80)}` : ""} — book $${cost.toFixed(2)} grand $${grand.toFixed(2)}`); };

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
    !String(c.who || "").toLowerCase().includes(heroName));
  if (adult) {
    const cf = `cast_${adult.id.replace(/\W+/g, "_")}.png`;
    let cbuf = have(cf);
    if (cbuf) { console.log(`  [${B.slug}/cast:${adult.id}] reused from disk`); }
    else { const cs = await generateCastMember({ member: { id: adult.id, who: adult.who, appearance: adult.appearance }, child }); cbuf = cs.buf; fs.writeFileSync(`${dir}/${cf}`, cbuf); log(`cast:${adult.id}`, cs.cost, cs.qa); }
    castRefs = [{ name: adult.who, buf: cbuf }];
  }

  let prevBuf = null, prevId = null;
  for (let i = 0; i < story.pages.length; i++) {
    const existing = have(`page${i + 1}.png`);
    if (existing) { prevBuf = existing; console.log(`  [${B.slug}/page${i + 1}] reused from disk`); continue; }
    const fp = fin.pages.find((x) => x.page === i + 1) || {};
    const contract = i > 0 ? ` CONTINUITY CONTRACT inherited from the previous image: ${(fin.pages.find((x) => x.page === i) || {}).carries_forward || ""}` : "";
    const s = await generateScene({
      heroBuf,
      scene: `${fp.brief || story.pages[i].scene}${objectPin}${contract}`,
      child,
      pageText: story.pages[i].text,
      camera: i % 2 === 0 ? "wide" : "mid",
      prevBuf,
      castRefs,
      assertions: fp.required_visible_states ? { required: fp.required_visible_states, forbidden: fp.forbidden_visible_states || [] } : null,
      previousResponseId: prevId,
      chainEnabled: true,
    });
    fs.writeFileSync(`${dir}/page${i + 1}.png`, s.buf);
    prevBuf = s.buf; prevId = s.responseId || prevId;
    log(`page${i + 1}`, s.cost, s.qa);
  }

  const coverExisting = have("cover.png");
  const cover = coverExisting ? { buf: coverExisting, cost: 0, qa: { pass: true } } : await generateCover({
    heroBuf,
    brief: `${fin.cover?.brief || story.cover_brief}${objectPin}`,
    child, castRefs,
    previousResponseId: prevId, chainEnabled: true,
  });
  fs.writeFileSync(`${dir}/cover.png`, cover.buf);
  log("cover", cover.cost, cover.qa);

  // spec for the real template renderer (jpg conversion happens after)
  const spec = {
    book_title: story.title, child_name: child.name, level: j.level, focus_sound: j.sound,
    story_pages: story.pages.map((p) => p.text),
    story_words: story.read_words, read_words: story.read_words,
    questions: [], alien_words: [], tricky_words_used: story.tricky_words_used || [],
    shifty_marks: {}, pronunciation_notes: [],
    images_dir: path.resolve(dir), out_path: path.resolve(`${dir}/book.pdf`),
    profile: { name: child.name, age: child.age, country: child.country, countryFlag: "", likes: j.CASE?.likes || "", culture: j.setting.culture, faith: "Muslim" },
  };
  fs.writeFileSync(`${dir}/pdf_spec.json`, JSON.stringify(spec, null, 1));
  console.log(`  ${B.slug} images done: $${cost.toFixed(2)}`);
}
console.log(`\nGRAND TOTAL (images): $${grand.toFixed(2)}`);
