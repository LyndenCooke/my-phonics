// Re-render a production book's PDF locally (fetch row + images from
// Supabase, run generate_custom_book.py) to verify template/page-count
// changes before deploying. Usage: node _render_test.mjs <book_id>
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { getBook } from "./server/forge/db.mjs";
import { BOOKS_DIR } from "./server/forge/env.mjs";
import { pronunciationNoteFor } from "./server/forge/phonics.mjs";

const bookId = process.argv[2];
if (!bookId) throw new Error("usage: node _render_test.mjs <book_id>");

const book = await getBook(bookId);
if (!book?.pages) throw new Error("book not found or has no pages");

const dir = path.resolve("_render_test_out", bookId);
fs.mkdirSync(dir, { recursive: true });

async function dl(name, url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${name}: ${res.status}`);
  fs.writeFileSync(path.join(dir, name), Buffer.from(await res.arrayBuffer()));
}

const cover = book.pages.find((p) => p.type === "cover");
if (cover?.imageUrl) await dl("cover.jpg", cover.imageUrl);
const storyPages = book.pages.filter((p) => p.type === "story");
for (let i = 0; i < storyPages.length; i++) {
  if (storyPages[i].imageUrl) await dl(`page${i + 1}.jpg`, storyPages[i].imageUrl);
}
if (book.profile?.heroUrl) await dl("hero.jpg", book.profile.heroUrl);
if (book.profile?.landmark?.imageUrl) await dl("landmark.jpg", book.profile.landmark.imageUrl);

const story = book.story?.story || {};
const spec = {
  book_title: book.title || `${book.child_name}'s Story`,
  child_name: book.child_name,
  level: book.level,
  focus_sound: book.focus_sound,
  story_pages: storyPages.map((p) => p.text),
  story_words: story.focus_word_examples || [],
  read_words: story.read_words || [],
  questions: story.questions || [],
  alien_words: story.alien_words || [],
  tricky_words_used: story.tricky_words_used || [],
  shifty_marks: book.story?.shiftyMarks || {},
  pronunciation_notes: [pronunciationNoteFor(book.focus_sound, book.level)].filter(Boolean),
  profile: book.profile || {},
  images_dir: dir,
  out_path: path.join(dir, "book.pdf"),
};
const specPath = path.join(dir, "pdf_spec.json");
fs.writeFileSync(specPath, JSON.stringify(spec), "utf8");

await new Promise((resolve, reject) => {
  execFile(
    "py",
    ["-3.12", "-X", "utf8", path.join(BOOKS_DIR, "scripts", "generate_custom_book.py"), "--json", specPath],
    { cwd: BOOKS_DIR, windowsHide: true, timeout: 5 * 60 * 1000 },
    (err, stdout, stderr) => {
      if (err) return reject(new Error(`render failed: ${String(stderr || err.message).slice(-800)}`));
      console.log(stdout.trim());
      resolve();
    },
  );
});
console.log("PDF at:", spec.out_path);
