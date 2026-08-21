// Text-only comparison across deliberately DIFFERENT story engines: is the
// "child + object" sameness the shape picker, or our own simplicity doctrine?
// No images, so each story costs about a quarter of a dollar.
import { writeStory, polishStoryAloud, STORY_SHAPES } from "./server/forge/claude.mjs";
import { getLevel, greenWordsUpTo, progressionUpTo, pronunciationsFor, coreStoriesFor, decodeProblems } from "./server/forge/phonics.mjs";

const LEVEL = 5, SOUND = "oa";
const level = getLevel(LEVEL);
const child = {
  name: "Rania", age: 6, country: "Jordan",
  cultureNotes: "We live in Amman - pale stone houses stacked up the hillsides, long flights of steps between them, washing lines on flat roofs, Sitti's kitchen always full of neighbours.",
};
const WANTED = ["Sharing what will not go round", "The wait", "First time alone", "Helping someone who needs it"];
let total = 0;
for (const name of WANTED) {
  const shape = STORY_SHAPES.find((s) => s.name === name);
  const r = await writeStory({
    level, child, focusSound: SOUND, pagesCount: 8,
    greenWords: greenWordsUpTo(LEVEL), progression: progressionUpTo(LEVEL),
    pronunciations: pronunciationsFor(SOUND, LEVEL), shape, exemplars: coreStoriesFor(LEVEL),
  });
  total += r.cost || 0;
  const st = r.data;
  const words = [...new Set((st.pages.map((p) => p.text).join(" ") + " " + st.title).toLowerCase().match(/[a-z']+/g))];
  const bad = decodeProblems(words, LEVEL, { heroName: child.name });
  const nameUses = (st.pages.map((p) => p.text).join(" ").match(new RegExp(child.name, "g")) || []).length;
  console.log(`\n===== ${name} ($${(r.cost || 0).toFixed(2)}) =====`);
  console.log(`TITLE: ${st.title}`);
  console.log(`objects: ${JSON.stringify((st.key_objects || []).map((o) => o.name))} | cast: ${JSON.stringify((st.cast || []).map((c) => c.id))} | name used ${nameUses}x | decode: ${bad.length ? bad.join("; ") : "clean"}`);
  st.pages.forEach((p, i) => console.log(`  ${i + 1}. ${p.text}`));
}
console.log(`\nTOTAL $${total.toFixed(2)}`);
