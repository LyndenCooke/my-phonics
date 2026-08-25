// The hole that shipped a black star onto six pages: the object kept its NAME
// ("the shell") while its look lost the star, so the old drawing survived.
import fs from "node:fs";
const src = fs.readFileSync("C:/Users/ASUS/myphonicsbooks/server/forge/jobs.mjs", "utf8");
const mod = new Function(
  src.match(/function storySignature[\s\S]*?\n}/)[0] + "\n" +
  src.match(/function ensureSheetsMatchStory[\s\S]*?\n}/)[0] +
  "\nreturn {ensureSheetsMatchStory};",
)();

const withStar = { cast: [{ id: "sana", who: "Sana", appearance: "pink hijab, yellow jumper" }], key_objects: [{ name: "the shell", look: "A palm-sized red shell with a black star at its hinge." }] };
const noStar = { cast: [{ id: "sana", who: "Sana", appearance: "pink hijab, yellow jumper" }], key_objects: [{ name: "the shell", look: "A palm-sized red shell on its curved outer surface." }] };

const job = { story: withStar, castSheets: {}, objectSheets: {}, breakdown: {} };
mod.ensureSheetsMatchStory(job);
job.objectSheets = { "the shell": { url: "starred-shell.jpg" } };
job.castSheets = { sana: { url: "sana.jpg" } };

job.story = noStar;                       // the star is stripped; NAME is unchanged
mod.ensureSheetsMatchStory(job);
const shellGone = !job.objectSheets["the shell"];
const castKept = Boolean(job.castSheets.sana);   // Sana did not change — keep her art

console.log("starred shell reference discarded:", shellGone);
console.log("unchanged cast art kept:", castKept);
console.log(shellGone && castKept ? "\nPASS — a changed description invalidates only that drawing" : "\nFAIL");
process.exit(shellGone && castKept ? 0 : 1);
