// Targeted repair of the Hana book's skipping mechanics (Lynden 2026-08-21):
// the rope was drawn as a doubled oval (two strands between the handles), the
// final page had meaningless oval marks on the grass, and the story taught the
// wrong PE cue, so the advice/execution pages must show the rope OVERHEAD.
import fs from "node:fs";
import { generateScene } from "./server/forge/images.mjs";

const DIR = "public/custom-books/dbe476ed-c865-4689-9348-49cdd308a630";
const child = {
  name: "Hana", age: 6, city: "Kyoto", country: "Japan",
  appearance: {
    gender: "girl", skinTone: "light",
    hair: "straight black hair in a neat bob with a short fringe",
    outfit: "a mustard-yellow cardigan over a white top, a coral-pink skirt with cream flowers, navy leggings and pink trainers",
  },
};
const buf = (f) => fs.readFileSync(`${DIR}/${f}`);
const heroBuf = buf("hero.jpg");
const castRefs = [
  { id: "mum", name: "Mum", buf: buf("cast_mum.jpg") },
  { id: "dad", name: "Dad", buf: buf("cast_dad.jpg") },
];
const objectRefs = [{ name: "long red skipping rope", buf: buf("object_longredskippingrope.jpg") }];

// ONE ROPE, ONE CURVE. Every brief states the rope's topology explicitly:
// a single continuous line from Mum's handle to Dad's handle. The doubled
// oval came from nothing ever saying that out loud.
const ROPE = " THE ROPE IS ONE SINGLE CONTINUOUS LINE from the handle in Mum's hand to the handle in Dad's hand - exactly one strand, never two, never a closed loop or oval, never a second rope. It is the same long red rope with pale wooden handles as the reference image.";
const SET = " Riverside grass in Kyoto in spring: a low grey stone wall along the river, wooden houses with dark tiled roofs and red paper lanterns behind, cherry trees in blossom. Keep this setting identical to the other pages. All eyes are solid black filled ovals with no highlights.";
const CLEAN = " The grass is plain and clean: NO oval marks, rings, spots, shadows, footprints or rope pieces lying on the ground anywhere in the frame.";

const PAGES = [
  // p7 and p8 came back as near-identical mid-air shots, which is what made
  // the sequencing activity unsolvable last time. p7 is now the TAKE-OFF at
  // close range with the rope still coming down; p8 stays the wide triumph.
  { n: 7, camera: "mid",
    text: '"Up, then jump!" Hana said. She bent her legs and sprang up as the rope fell to her feet.',
    brief: `CLOSE-UP on Hana from the knees up, filling most of the frame, seen slightly from the side as she springs upward: knees bent, heels just leaving the grass, both fists raised, mouth open in a shout. The single red rope is still HIGH AND DESCENDING - it comes down steeply from the upper right corner of the picture on a clear diagonal, its nearest point level with her shoulder, NOT yet under her feet and NOT a low curve on the ground. Mum and Dad are cropped out of frame except one hand holding a handle at the right edge.${ROPE}${CLEAN}${SET}`, },
];

let cost = 0;
for (const p of PAGES) {
  const prevBuf = fs.existsSync(`${DIR}/page${p.n - 1}.jpg`) ? buf(`page${p.n - 1}.jpg`) : null;
  const s = await generateScene({
    heroBuf, scene: p.brief, child, pageText: p.text, camera: p.camera,
    prevBuf, castRefs, objectRefs, chainEnabled: false,
    assertions: {
      required: [{ object: "rope", assertion: "exactly ONE continuous rope line between Mum's handle and Dad's handle" }],
      forbidden: [
        { object: "rope", assertion: "a second strand, a closed oval, or two ropes" },
        { object: "grass", assertion: "oval marks, rings, spots or loose rope pieces on the ground" },
      ],
    },
  });
  fs.writeFileSync(`${DIR}/page${p.n}.jpg`, s.buf);
  cost += s.cost || 0;
  const c = s.qa?.consistency;
  console.log(`[page${p.n}] $${(s.cost || 0).toFixed(3)} running $${cost.toFixed(2)}${c && !c.pass ? ` QA: ${String(c.reason).slice(0, 90)}` : ""}`);
  if (cost > 1.2) throw new Error(`cap: $${cost.toFixed(2)}`);
}
console.log(`TOTAL: $${cost.toFixed(2)}`);
