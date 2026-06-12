const fs = require("fs");
const data = JSON.parse(fs.readFileSync("C:/Users/ASUS/myphonicsbooks/worksheet-engine/output/_research/stories_all.json", "utf8"));
const level = process.argv[2];
for (const [id, b] of Object.entries(data)) {
  if (!id.startsWith(level + ".")) continue;
  console.log(`\n=== ${id} ${b.title} | focus: ${b.focus.join(",")} ===`);
  console.log(`writing_words: ${(b.writing_words||[]).join(", ")}`);
  console.log(`story_words: ${(b.story_words||[]).join(", ")} | read_words: ${(b.read_words||[]).join(", ")}`);
  b.pages.forEach((p, pi) => {
    const sents = p.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
    for (const s of sents) {
      const clean = !/["'‘’“”—:;]/.test(s);
      const words = s.split(/\s+/).length;
      if (clean) console.log(`  p${pi+1} [${words}w ${s.length}c] ${s}`);
    }
  });
}
