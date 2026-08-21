import fs from "node:fs";
import { generateScene } from "./server/forge/images.mjs";
const DIR = "public/custom-books/_ayla_test";
const child = {
  name: "Ayla", age: 6, city: "Izmir", country: "Turkey",
  appearance: { gender: "girl", skinTone: "light olive", hair: "dark wavy shoulder-length hair",
    outfit: "a soft green long-sleeved top, navy trousers to the ankle, and white plimsolls" },
};
const SET = " A shaded stone terrace outside a white house with a red-tiled roof in a hillside town near Izmir: worn stone flags underfoot, a fig tree in a terracotta pot, a low whitewashed wall, hills behind. Keep this setting identical to the other pages. All eyes are solid black filled ovals with no highlights.";
const PAGES = [
  { n: 5, camera: "wide", text: "Ayla gets a fan. She fans the ship.",
    brief: "Ayla kneels beside the dish holding a flat woven hand fan in both hands, sweeping it towards the little ship. The ship has begun to move across the water towards the shell, a small ripple behind it.",
    physics: "CONTACT: both hands grip the fan's handle, fingers visible around it; the fan is held in the air above the near edge of the dish and does NOT touch the water. The ship floats ON the water, hull sitting in the surface, now part-way across the dish. SUPPORT: the dish rests flat on the stone flags; Ayla's weight is on her knees and shins. COUNT: one fan, one ship, one shell, one dish, one child, no adult." },
  { n: 6, camera: "mid", text: "The ship gets to the shell. Ayla is glad.",
    brief: "Close on Ayla beaming with both hands clasped, the fan resting on the flags beside her. In the dish the little ship now floats right beside the cream shell at the far side.",
    physics: "CONTACT: the ship floats on the water directly next to the shell, their sides almost touching, both at the FAR side of the dish. The fan lies flat on the stone flags, its whole face on the ground. Ayla's clasped hands touch each other at her chest. COUNT: one ship, one shell, one fan, one dish, one child." },
];
let cost = 0;
let prevBuf = fs.readFileSync(`${DIR}/page4.png`);
const heroBuf = fs.readFileSync(`${DIR}/hero.png`);
for (const p of PAGES) {
  const s = await generateScene({ heroBuf, scene: p.brief + SET, child, pageText: p.text,
    camera: p.camera, prevBuf, physics: p.physics, chainEnabled: false });
  fs.writeFileSync(`${DIR}/page${p.n}.png`, s.buf);
  prevBuf = s.buf; cost += s.cost || 0;
  const c = s.qa?.consistency;
  console.log(`page${p.n} $${(s.cost || 0).toFixed(3)}${c && !c.pass ? ` [${c.severity}] ${String(c.reason).slice(0,70)}` : " (QA clean)"}`);
}
console.log(`TOTAL $${cost.toFixed(2)}`);
