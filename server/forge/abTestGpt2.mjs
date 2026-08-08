// A/B engine test: re-illustrate an existing finished book with gpt-image-2
// (same story, same directed briefs, same camera/anchor plan) and typeset a
// second PDF. Usage: node server/forge/abTestGpt2.mjs <bookId>
process.env.FORGE_IMG_ENGINE = "gpt2";

import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { generateHero, generateScene, generateCover, generateLandmark, CUSTOM_BOOKS_DIR } from "./images.mjs";
import { getBook } from "./db.mjs";
import { BOOKS_DIR } from "./env.mjs";

const bookId = process.argv[2];
if (!bookId) throw new Error("usage: node abTestGpt2.mjs <bookId>");

const book = await getBook(bookId);
if (!book?.story?.story) throw new Error("book has no story");
const story = book.story.story;
const directed = book.story.directed || [];

const outDir = path.join(CUSTOM_BOOKS_DIR, bookId, "gpt2");
fs.mkdirSync(outDir, { recursive: true });

const child = {
  name: book.child_name,
  age: book.child_age,
  city: book.city,
  country: book.country,
  cultureNotes: book.culture_notes,
  likes: book.likes,
  appearance: book.appearance || {},
};

// Same settingBlock construction as jobs.mjs
const setting = story.setting || {};
const settingBlock =
  (setting.place
    ? `WORLD CONSISTENCY (identical on every page unless the scene text says otherwise): This story happens in ${setting.place}. ` +
      `Setting details to keep identical: ${setting.architecture || ""}. Season: ${setting.season || "unspecified"}. Weather: ${setting.weather || "unspecified"}.`
    : "") +
  ((story.key_objects || []).length
    ? ` KEY OBJECTS — same physical object every time it appears (${story.key_objects.map((o) => `${o.name}: ${o.look}`).join("; ")}) — but ALWAYS in the state the scene describes.`
    : "");

let cost = 0;

console.log("hero (gpt-image-2)...");
const hero = await generateHero({ child });
cost += hero.cost;
fs.writeFileSync(path.join(outDir, "hero.jpg"), hero.buf);

const locationAnchors = {};
for (let i = 0; i < story.pages.length; i++) {
  const loc = (story.pages[i].location || "").trim().toLowerCase();
  const d = directed.find((x) => x.page === i + 1);
  const sceneBrief = d ? `${d.brief} ${child.name} feels ${d.emotion}. Staging: ${d.staging}` : story.pages[i].scene;
  const wantAnchor = d ? d.camera === "same-view" : true;
  console.log(`page ${i + 1}/${story.pages.length} [${d?.camera || "?"}]...`);
  const s = await generateScene({
    heroBuf: hero.buf,
    scene: sceneBrief,
    child,
    settingBlock,
    prevSceneBuf: wantAnchor && loc ? locationAnchors[loc] || null : null,
  });
  if (loc && !locationAnchors[loc] && (d?.camera ?? "wide") === "wide") locationAnchors[loc] = s.buf;
  cost += s.cost;
  fs.writeFileSync(path.join(outDir, `page${i + 1}.jpg`), s.buf);
}

console.log("cover...");
const cover = await generateCover({ heroBuf: hero.buf, title: story.title, child, likes: child.likes, settingBlock });
cost += cover.cost;
fs.writeFileSync(path.join(outDir, "cover.jpg"), cover.buf);

const prof = book.profile || {};
if (prof.landmark?.name) {
  console.log("landmark...");
  try {
    const lm = await generateLandmark({
      name: prof.landmark.name,
      imageBrief: prof.landmark.name, // brief not stored; name + city is enough for the engine
      city: book.city,
      country: book.country,
    });
    cost += lm.cost;
    fs.writeFileSync(path.join(outDir, "landmark.jpg"), lm.buf);
  } catch (e) {
    console.warn("landmark failed:", e.message);
  }
}

// Typeset the gpt2 PDF
const spec = {
  book_title: book.title,
  child_name: book.child_name,
  level: book.level,
  focus_sound: book.focus_sound,
  story_pages: story.pages.map((p) => p.text),
  story_words: story.focus_word_examples || [],
  read_words: story.read_words || [],
  questions: story.questions || [],
  alien_words: story.alien_words || [],
  tricky_words_used: story.tricky_words_used || [],
  images_dir: outDir,
  out_path: path.join(CUSTOM_BOOKS_DIR, bookId, "book_gpt2.pdf"),
  profile: prof,
};
const specPath = path.join(outDir, "pdf_spec.json");
fs.writeFileSync(specPath, JSON.stringify(spec), "utf8");
await new Promise((resolve, reject) => {
  execFile("py", ["-3.12", "-X", "utf8", path.join(BOOKS_DIR, "scripts", "generate_custom_book.py"), "--json", specPath],
    { cwd: BOOKS_DIR, windowsHide: true, timeout: 5 * 60 * 1000 },
    (err, stdout, stderr) => (err ? reject(new Error(String(stderr || err.message).slice(-400))) : resolve(stdout)));
});
console.log(`DONE gpt2 pdf: /custom-books/${bookId}/book_gpt2.pdf | image cost $${cost.toFixed(3)}`);
