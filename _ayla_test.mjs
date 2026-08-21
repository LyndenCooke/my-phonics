// Text-only Ayla story -> 4 illustrated pages, to see the new per-page physics
// contract in action. Flat lane, no jobs machine.
import fs from "node:fs";
import { generateHero, generateScene } from "./server/forge/images.mjs";

const DIR = "public/custom-books/_ayla_test";
fs.mkdirSync(DIR, { recursive: true });
const child = {
  name: "Ayla", age: 6, city: "Izmir", country: "Turkey",
  appearance: {
    gender: "girl", skinTone: "light olive", hair: "dark wavy shoulder-length hair",
    outfit: "a soft green long-sleeved top, navy trousers to the ankle, and white plimsolls",
  },
};
const SET = " A shaded stone terrace outside a white house with a red-tiled roof in a hillside town near Izmir: worn stone flags underfoot, a fig tree in a terracotta pot, a low whitewashed wall, hills behind. Keep this setting identical on every page. All eyes are solid black filled ovals with no highlights.";

const PAGES = [
  { n: 1, text: "Ayla has a dish. The dish has a fish.",
    brief: "Ayla kneels on the stone flags beside a wide shallow white dish of water set on the ground. A small orange toy fish rests on the bottom of the dish, under the water. She looks into the dish, delighted.",
    physics: "CONTACT: the dish rests flat on the stone flags, its whole base touching. Ayla's knees and shins rest on the ground; one hand rests on the dish rim. SUPPORT: the ground carries the dish and the child. COUNT: exactly one dish, one toy fish, one child, no adult. The water surface is flat and level with a visible rim of dish above it." },
  { n: 2, text: "Ayla has a ship. The dish has a shell.",
    brief: "Ayla holds a small wooden toy ship in both hands, just above the water, about to set it down. A single curved cream shell now sits at the far side of the dish, under the water.",
    physics: "CONTACT: both of Ayla's hands grip the toy ship, fingers visibly around its hull; the ship is in the air just above the water and NOT yet touching it. The shell rests on the bottom of the dish at the far side. SUPPORT: ground carries the dish. COUNT: one ship, one shell, one dish, one child." },
  { n: 3, text: "Can the ship get to the shell? Ayla puffs.",
    brief: "Close on Ayla leaning over the dish, cheeks puffed, blowing hard at the little ship. The ship floats on the water at the near side; the shell is still at the far side.",
    physics: "CONTACT: the ship floats ON the water - its hull sits in the surface with a small dip of water around it, not above it and not sunk. Ayla's face is close to the water, lips pursed, hands flat on the flags either side of the dish taking her weight. COUNT: one ship afloat, one shell submerged, no fan yet in frame." },
  { n: 4, text: "The ship did not go. Ayla huffs.",
    brief: "Ayla sits back on her heels with her arms folded, frowning at the dish. The ship still floats at the near side, exactly where it was, nowhere nearer the shell.",
    physics: "CONTACT: the ship still floats on the water at the SAME near side as the previous page - unmoved. Ayla sits back, her folded arms resting against her chest, her weight on her heels and shins. COUNT: one ship, one shell, one dish. No fan is visible anywhere in the frame yet." },
];

const hero = await generateHero({ child });
fs.writeFileSync(`${DIR}/hero.png`, hero.buf);
let cost = hero.cost || 0;
console.log(`hero $${(hero.cost || 0).toFixed(3)}`);
let prevBuf = null;
for (const p of PAGES) {
  const s = await generateScene({
    heroBuf: hero.buf, scene: p.brief + SET, child, pageText: p.text,
    camera: p.n === 3 ? "mid" : "wide", prevBuf, physics: p.physics, chainEnabled: false,
  });
  fs.writeFileSync(`${DIR}/page${p.n}.png`, s.buf);
  prevBuf = s.buf; cost += s.cost || 0;
  const c = s.qa?.consistency;
  console.log(`page${p.n} $${(s.cost || 0).toFixed(3)} running $${cost.toFixed(2)}${c && !c.pass ? ` [${c.severity}] ${String(c.reason).slice(0, 70)}` : ""}`);
}
console.log(`TOTAL $${cost.toFixed(2)}`);
