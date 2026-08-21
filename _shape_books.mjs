// Illustrate two of the shape-test stories so Lynden can see different story
// STRUCTURES as finished books. Deliberately varied cameras per page: the Ayla
// test proved that correct physics with identical framing still yields six
// pictures a child cannot tell apart.
import fs from "node:fs";
import { generateHero, generateCastMember, generateScene } from "./server/forge/images.mjs";

const child = {
  name: "Rania", age: 6, city: "Amman", country: "Jordan",
  appearance: {
    gender: "girl", skinTone: "light brown", hair: "dark brown hair in a single plait",
    outfit: "a long-sleeved mustard-yellow tunic reaching below her knees, loose dark green trousers to the ankle, and grey trainers",
  },
};
const MUM = {
  id: "mum", who: "Rania's mum",
  appearance: "A Jordanian woman in her thirties, warm light-brown skin, a plum-coloured headscarf covering all her hair, a long charcoal tunic with long sleeves and dark trousers, flat brown shoes. Her eyes are solid black filled ovals with no highlights.",
};
const SET = " Amman: pale honey-coloured stone houses stacked up the hillside, long flights of worn stone steps, flat roofs with washing lines, dusty road edges, a hot blue sky. Keep this setting identical across the book. All eyes are solid black filled ovals with no highlights.";

const BOOKS = [
  {
    slug: "wait", title: "The Coach to the Coast", level: 5, sound: "oa",
    pages: [
      { text: "Rania was keen to see the coast. She had to wait at the road.",
        camera: "wide", brief: "Wide establishing shot: Rania stands at a dusty roadside stop at the bottom of a stone-stepped street, looking eagerly up the empty road. Mum stands beside her with bags at her feet.",
        physics: "CONTACT: Rania's trainers rest flat on the dusty road edge; the bags sit on the ground beside Mum's feet, their weight on the ground. COUNT: one child, one adult, three bags, no coach in sight. SUPPORT: the ground carries everyone and everything." },
      { text: "Mum had a note for the coach. It said the slow coach was late.",
        camera: "mid", brief: "Mid shot from the side: Mum holds a small printed note in both hands, tilted so Rania can see it. Rania leans in, shoulders dropping with disappointment.",
        physics: "CONTACT: Mum's fingers grip both edges of the note, the paper flat and slightly bent by her grip. Rania's hands hang at her sides. COUNT: one note, one child, one adult, no coach." },
      { text: "Rania kicked dust and gave a big sigh. Mum had a big load at her feet.",
        camera: "low", brief: "Low camera near the ground: Rania's foot mid-kick sending up a puff of dust, her face above looking bored. Behind her feet sit the stacked bags.",
        physics: "CONTACT: one trainer is in the air just above the road, the other flat on the ground taking her weight; a small cloud of dust rises where the moving foot has just been. The bags rest stacked, the top one leaning. COUNT: one child, three bags." },
      { text: "The top bag sagged on the hot ground. Coats slid out and fell in the dust.",
        camera: "close", brief: "Close on the bags: the top bag has slumped sideways, its opening gaping, and two folded coats have slid out onto the dusty road. Rania's hands enter the frame reaching for them.",
        physics: "CONTACT: the split bag rests on the ground, sagging; the coats lie flat in the dust, fully touching the ground, half out of the bag mouth. Rania's two hands reach in from the frame edge and are about to touch the nearer coat. COUNT: exactly two coats out of the bag, three bags total." },
      { text: "She stuffed the coats back, but the bag split. Rania stopped and had a good plan.",
        camera: "mid", brief: "Mid shot: Rania kneels beside the bag, one hand still holding a coat, staring at a clear split along the bag's seam. Her face is thoughtful, an idea arriving.",
        physics: "CONTACT: Rania's knees rest on the road; one hand grips a bunched coat, the other rests on the bag. The split runs along the bag's side seam and is clearly open. COUNT: one split bag, one coat in hand, one coat still on the ground." },
      { text: "She opened her pack and laid the coats flat. Mum had a free hand and a big grin.",
        camera: "mid", brief: "Rania holds her own small backpack open on her lap and lays a folded coat flat inside it. Mum stands beside her, one hand now empty and open, smiling down at her.",
        physics: "CONTACT: the backpack rests on Rania's lap, held open by one hand while the other lowers a folded coat into it, the coat touching the pack's inside. Mum's near hand is visibly empty and open. COUNT: one backpack, two coats, one now inside." },
      { text: "The wait felt long, but Rania kept a grin. She spotted cars, goats, vans, and cabs.",
        camera: "wide", brief: "Wide shot along the road: Rania sits on a low stone wall beside Mum, pointing at passing traffic - a van, a small cab, and two goats being led along the verge. She is smiling now, the packed bag at her feet.",
        physics: "CONTACT: Rania sits on the low stone wall, her weight on the wall, legs hanging with feet off the ground; one arm extends pointing up the road. The goats' hooves are on the verge. COUNT: one van, one cab, two goats, one child, one adult." },
      { text: "Then the coach came, low and loud! Rania smiled with her pack on her back.",
        camera: "wide", brief: "The coach arrives: a long cream-and-blue coach pulls in at the roadside, low and close. Rania stands with her backpack on her shoulders, beaming up at it, Mum beside her with one bag.",
        physics: "CONTACT: the coach's tyres rest on the road, the whole vehicle grounded; the backpack's two straps sit over both of Rania's shoulders, the pack against her back. COUNT: one coach, one child wearing one pack, one adult holding one bag." },
    ],
  },
  {
    slug: "alone", title: "The Loaf on the Road", level: 5, sound: "oa",
    pages: [
      { text: "Rania went to the shop with Mum on the stone road. She had the loaf to take home on her own.",
        camera: "wide", brief: "Wide shot outside a small corner shop on a stone street: Mum stands at the shop door, Rania in front of her holding a long wrapped loaf in both arms, the stepped street rising behind them.",
        physics: "CONTACT: Rania's two arms are wrapped around the loaf, holding it against her chest; her feet flat on the stone paving. Mum's hand rests on the shop doorframe. COUNT: one loaf, one child, one adult." },
      { text: "Mum gave her the loaf and stood by the shop. The road home felt long for the first time.",
        camera: "over-shoulder", brief: "Over Rania's shoulder from behind: we see what she sees - the long stone road climbing away between houses, empty and bright. Her plait and the top of the loaf are in the near frame.",
        physics: "CONTACT: the loaf is held against her chest, visible at the bottom edge of frame. The road surface is continuous from her feet to the top of the hill. COUNT: one road, no other people in the street ahead." },
      { text: "She held the hot loaf tight under her coat. She stepped past the bench, the lamp, the gate.",
        camera: "mid", brief: "Mid tracking shot from the side: Rania walking with determination, the loaf tucked under one arm against her body, passing a stone bench, a street lamp and an iron gate in a row behind her.",
        physics: "CONTACT: the loaf is clamped between her upper arm and her ribs, her forearm across it; one foot is mid-stride off the ground. The bench legs stand on the paving. COUNT: one bench, one lamp, one gate, one loaf." },
      { text: "A goat stood in the road and began to munch. Rania stopped and felt stuck with the loaf.",
        camera: "wide", brief: "Wide shot: a brown-and-white goat stands squarely in the middle of the narrow road, chewing, facing Rania. She has stopped short, both arms around the loaf, uncertain.",
        physics: "CONTACT: all four of the goat's hooves are on the road surface. Rania stands still, both feet flat, both arms around the loaf. There is a clear gap of road between child and goat. COUNT: exactly one goat, one child." },
      { text: "She went to pass but the goat gave a groan. It put one hoof on the low stone step.",
        camera: "close", brief: "Close on the goat: it turns its head towards us with a complaining bleat, and lifts one front hoof onto a low stone step at the road's edge. Rania's shoulder and the loaf are at the frame edge.",
        physics: "CONTACT: three hooves remain on the road, ONE front hoof rests on the low stone step, clearly touching it. The goat's eyes are solid black filled ovals. COUNT: one goat, one step, one child partly in frame." },
      { text: "Then she saw the wide gate was open. She went in the gate and past the goat.",
        camera: "mid", brief: "Mid shot: Rania slips through an open iron gate into a narrow side passage, glancing back at the goat still in the road. The gate stands wide, swung back against the wall.",
        physics: "CONTACT: the gate is swung fully open, its edge touching the wall; Rania walks through the opening with the loaf still under her arm, her body clear of both gateposts. COUNT: one gate, one goat behind her in the road, one loaf." },
      { text: "Mum came up the road and smiled at Rania. She was past the goat with the loaf.",
        camera: "wide", brief: "Wide shot on the far side: Rania emerges back onto the road above the goat, and Mum is coming up the steps towards her, smiling with pride.",
        physics: "CONTACT: both are on the stone road/steps, feet flat. The goat is now BEHIND Rania, further down the road. COUNT: one child, one adult, one goat, one loaf still under her arm." },
      { text: "She went up the steps and kept hold of the loaf. She felt big on her first trip on the road.",
        camera: "low", brief: "Low camera looking up the stone steps: Rania climbs the last steps towards home, the loaf held proudly in both arms, chin up, the honey-stone houses and blue sky above her.",
        physics: "CONTACT: one foot is planted on a higher step taking her weight, the other pushing off the step below; both arms wrapped round the loaf against her chest. COUNT: one child, one loaf, no goat in frame." },
    ],
  },
];

let grand = 0;
for (const B of BOOKS) {
  const DIR = `public/custom-books/_shape_${B.slug}`;
  fs.mkdirSync(DIR, { recursive: true });
  const have = (f) => (fs.existsSync(`${DIR}/${f}`) ? fs.readFileSync(`${DIR}/${f}`) : null);
  let cost = 0;
  console.log(`\n==== ${B.slug}: ${B.title} ====`);

  let heroBuf = have("hero.png");
  if (!heroBuf) {
    const h = await generateHero({ child });
    heroBuf = h.buf; fs.writeFileSync(`${DIR}/hero.png`, heroBuf); cost += h.cost || 0;
    console.log(`  hero $${(h.cost || 0).toFixed(3)}`);
  }
  let mumBuf = have("cast_mum.png");
  if (!mumBuf) {
    const c = await generateCastMember({ member: MUM, child });
    mumBuf = c.buf; fs.writeFileSync(`${DIR}/cast_mum.png`, mumBuf); cost += c.cost || 0;
    console.log(`  cast:mum $${(c.cost || 0).toFixed(3)}`);
  }
  const castRefs = [{ id: "mum", name: "Mum", buf: mumBuf }];

  let prevBuf = null;
  for (let i = 0; i < B.pages.length; i++) {
    const n = i + 1;
    const existing = have(`page${n}.png`);
    if (existing) { prevBuf = existing; console.log(`  page${n} reused`); continue; }
    const p = B.pages[i];
    // Mum is only in the frame on the pages where the text puts her.
    const mumOnPage = /mum/i.test(p.text) || /mum/i.test(p.brief);
    const s = await generateScene({
      heroBuf, scene: p.brief + SET, child, pageText: p.text, camera: p.camera,
      prevBuf, physics: p.physics, castRefs: mumOnPage ? castRefs : [], chainEnabled: false,
    });
    fs.writeFileSync(`${DIR}/page${n}.png`, s.buf);
    prevBuf = s.buf; cost += s.cost || 0; grand += s.cost || 0;
    const c = s.qa?.consistency;
    console.log(`  page${n} $${(s.cost || 0).toFixed(3)}${c && !c.pass ? ` [${c.severity}] ${String(c.reason).slice(0, 60)}` : ""}`);
    if (cost > 1.1) throw new Error(`cap hit on ${B.slug}: $${cost.toFixed(2)}`);
  }
  grand += 0;
  console.log(`  ${B.slug} total $${cost.toFixed(2)}`);
}
console.log(`\nGRAND TOTAL $${grand.toFixed(2)}`);
