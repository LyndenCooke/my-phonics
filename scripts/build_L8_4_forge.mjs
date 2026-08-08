// Rebuild 8.4 "The Incredible Bush Walk" art through the Create-A-Book forge
// pipeline (server/forge/SKILL.md) instead of an ad-hoc per-book script.
//
// Lynden 2026-08-05: the earlier attempt hand-rolled its own prompts in
// scripts/regen_L8_4_art.py. Same model, same gcloud project — but a different
// prompt system, so the art did not match the fleet, and the eye rule had to be
// patched in pixels afterwards. Both are symptoms of bypassing the forge.
//
// What the forge gives us that the ad-hoc script did not:
//   * BASE_STYLE verbatim from generate_gemini_images.py — the company look
//   * MODEST_DRESS + HOUSE_VALUES on every image, unskippable
//   * approved printed-book art (L4.1) injected as a STYLE reference, so the
//     eye style is copied visually rather than merely described
//   * hero + cast sheets, and a LOCATION ANCHOR injected on every revisit
//   * describe-before-judging eye QA, zoomed to each face
//
// Story text and phonics data are NOT touched — they are already audited, and
// the cast spec below is lifted from the story's own cover_prompt (white
// Australian family, skin #E8C5A0). The earlier hero refs overrode that with
// brown skin and black hair, which is where the character drift came from.
//
//   node scripts/build_L8_4_forge.mjs            # cast sheets + all 9 images
//   node scripts/build_L8_4_forge.mjs page4      # named targets
//   node scripts/build_L8_4_forge.mjs --cast     # cast/animal sheets only
//
// ENGINE (Lynden 2026-08-06): OpenAI from here on — "we're no longer using
// gcloud after this and it will be through openai as it is more consistent."
// Vertex held the eye rule fine but wandered on composition and framing between
// re-rolls, which is what made page 3 and page 7 take three attempts each.
// Override for a one-off comparison with FORGE_IMG_ENGINE=vertex FORGE_LLM=vertex.
// Set before the forge modules load, since they read these at import time.
process.env.FORGE_IMG_ENGINE ||= "openai";
process.env.FORGE_LLM ||= "openai";

import fs from "node:fs";
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const OUT = path.join(REPO, "myphonics_books", "output", "images", "L8_4_B1");

// pathToFileURL, not a bare path: on Windows an absolute path starts "C:" and
// the ESM loader reads that as an unsupported URL scheme.
const { generateHero, generateCastMember, generateAnimal, generateScene, generateCover } =
  await import(pathToFileURL(path.join(REPO, "server", "forge", "images.mjs")).href);

// ── The world, per SKILL.md §4: place + drawable architecture, season, weather.
// "Drawable" is the operative word — a nationality is not a thing anyone can
// draw, so the features are named explicitly (feedback_mpb_setting_needs_architecture).
const SETTING =
  "THE STORY'S WORLD, identical on every page: a bush walking track in the Blue Mountains, " +
  "New South Wales, Australia. Drawable features, and only these: tall straight eucalyptus gums " +
  "with smooth pale cream-and-grey bark that peels in ribbons; a narrow red-brown earth track; " +
  "an understorey of tree ferns and low grey-green scrub; layered honey-coloured sandstone cliffs; " +
  "and a blue haze hanging over the valley. Late summer, warm bright afternoon, clear sky. " +
  "No signage lettering of any kind — signs and boards are blank. ";

// Cast, taken verbatim from the story's own cover_prompt. ONE outfit each for
// the whole book (SKILL.md §4).
const MIA = {
  name: "Mia",
  age: 10,
  country: "Australia",
  city: "the Blue Mountains",
  appearance: {
    gender: "girl",
    skinTone: "fair, lightly sun-tanned #E8C5A0",
    hair: "light brown wavy hair #A0784C in a high ponytail",
    outfit:
      "a green short-sleeved t-shirt, khaki cargo trousers to the ankle, brown hiking boots and a green backpack",
  },
};

const TOM = {
  name: "Tom",
  age: 7,
  country: "Australia",
  city: "the Blue Mountains",
  appearance: {
    gender: "boy",
    skinTone: "fair, lightly sun-tanned #E8C5A0",
    hair: "sandy reddish-brown short hair #B5734A",
    outfit:
      "a red short-sleeved t-shirt, khaki cargo trousers to the ankle, brown hiking boots and a blue backpack, " +
      "carrying a small notebook",
  },
};

const DAD = {
  id: "dad",
  who: "the children's dad, a man in his early forties",
  appearance:
    "Fair, sun-weathered skin #E8C5A0, dark brown hair and a full dark brown beard. He wears a " +
    "KHAKI short-sleeved bush shirt with a brown belt, KHAKI cargo trousers, brown walking boots and a " +
    "wide-brimmed tan bush hat, and carries a metal water bottle. Kind and relaxed",
};

const ANIMALS = {
  lyrebird: {
    name: "lyrebird",
    appearance:
      "A superb lyrebird — an Australian ground bird about the size of a chicken, with a warm brown " +
      "body, a paler cream throat, strong grey legs, a slender dark curved beak, a small fine crest, " +
      "and an ENORMOUS silver-grey lyre-shaped tail fanned wide and upright behind it. Beak open, singing.",
  },
  rosella: {
    name: "rosella",
    appearance:
      "A crimson rosella — a small Australian parrot with a vivid scarlet red head, chest and belly, " +
      "a deep blue cheek patch, blue and black wings, a blue tail, a pale curved beak and grey feet. " +
      "Perched side-on on a short bare twig.",
  },
};

// Who is actually PRESENT, from the story text. A character the words merely
// mention is not in the frame (SKILL.md §3): page 4 is Tom alone discovering the
// lyrebird, and the whole point of the page is that nobody else is there.
// `hero` is whoever the frame is built around; everyone else rides as a cast ref.
const PAGES = {
  page1: { hero: "mia", cast: ["tom", "dad"], animals: [], location: "trailhead", camera: "wide" },
  page2: { hero: "mia", cast: ["tom"], animals: ["rosella"], location: "grove", camera: "new-angle" },
  page3: { hero: "mia", cast: ["tom"], animals: [], location: "grove", camera: "closeup" },
  page4: { hero: "tom", cast: [], animals: ["lyrebird"], location: "clearing", camera: "new-angle" },
  page5: { hero: "mia", cast: ["tom"], animals: ["lyrebird"], location: "clearing", camera: "new-angle" },
  page6: { hero: "mia", cast: ["tom"], animals: [], location: "lookout", camera: "wide" },
  page7: { hero: "mia", cast: ["tom", "dad"], animals: [], location: "centre", camera: "wide" },
  page8: { hero: "mia", cast: ["tom"], animals: [], location: "home", camera: "closeup" },
};

const COVER = { hero: "mia", cast: ["tom"], animals: ["lyrebird"], location: "clearing" };

// Sizes drift both ways — Tom came back taller than Mia, and Mia as tall as her
// dad. Restated on every page rather than trusted to the reference alone.
const SIZES =
  // "a smaller ROUNDER child's face" was mine, and together with BASE_STYLE's
  // "simple rounded shapes" it is what turned the hero sheets chibi — big round
  // heads on stubby bodies, nothing like the fleet. Height is stated as height;
  // nothing here describes face shape or proportions any more.
  "RELATIVE SIZES, fixed on every page: Tom is the youngest and is clearly SHORTER than Mia, at least " +
  "a head shorter. Mia is clearly taller and older than Tom. Dad is a grown adult and is clearly the " +
  "tallest of the three. Draw all three with NATURAL, REALISTIC CHILDREN'S-BOOK PROPORTIONS exactly as " +
  "in their reference sheets — normal head-to-body ratio, not oversized heads, not chibi. " +
  // Hair colour is the single most-drifted attribute across the book: Tom has
  // come back black-haired twice and Mia's tone has wandered from light brown to
  // dark brunette page to page. Restate both as colours, not just "as reference".
  "HAIR COLOUR IS FIXED: Tom's hair is SANDY REDDISH-BROWN (#B5734A) — never black, never dark brown. " +
  "Mia's hair is LIGHT BROWN (#A0784C) worn in a ponytail — never dark brunette, never black. " +
  "Both children keep the exact same hair colour on every page. ";

// The hero and cast sheets are drawn on a plain cream background so the figure
// reads cleanly, and that cream leaks into the scenes: page 6 and the cover came
// back inset inside a cream mat with a drawn frame round the picture. The
// reference's background is not the scene's background.
const FULL_BLEED =
  "FULL BLEED: the scene fills the ENTIRE rectangular image and its background reaches and touches all " +
  "four edges. Do NOT copy the plain cream background of the character reference sheets. No cream or " +
  "white border, no drawn frame, no mount or mat, no rounded corners, no vignette fading to blank paper. ";

// Per-page reinforcement for briefs that keep losing a specific rule. A close
// two-shot with both children side by side equalises their heights however
// firmly SIZES states it, so page 3 gets the difference expressed as a concrete
// landmark ("head to her shoulder") rather than a comparative.
const PAGE_NOTES = {
  page3:
    "CRITICAL: Tom is much younger and SMALLER than Mia — the top of his head reaches only to Mia's " +
    "SHOULDER. Do not draw them the same height and do not make Tom the taller of the two. ",
  page7:
    // Adding the no-lettering rule alone cost us Dad: the model drew three
    // children. With a long constraint appended, the adult has to be asserted
    // again or he is quietly demoted to a third kid.
    "THREE PEOPLE ONLY: Mia, Tom, and their DAD. Dad is a GROWN ADULT MAN with adult proportions — " +
    "clearly a head and shoulders taller than both children, with his full dark beard, khaki bush shirt, " +
    "khaki cargo trousers and wide-brimmed tan bush hat. He is NOT a third child. " +
    "The three framed artworks are PURE ABSTRACT PATTERN — concentric circles, dots and curved lines in " +
    "red, gold and white, nothing else. There are NO letters, words, numbers, signatures, titles or " +
    "wall labels anywhere in the picture: no lettering on the paintings, the frames or the walls. ",
  page8:
    "The open notebook shows a child's simple pencil DRAWINGS only — a little sketch of a bird and some " +
    "wavy scribble marks. There are absolutely NO letters, words, numbers or writing anywhere in the " +
    "picture, on the notebook pages or elsewhere. No sparkles, stars or glints anywhere. ",
};

const INTERIORS = {
  centre:
    "INTERIOR: a calm visitor-centre gallery — plain white walls, a polished pale timber floor, " +
    "daylight from a window out of frame. One room only; no other room is visible. ",
  // "the Blue Mountains" alone got drawn as jagged alpine peaks with snow. They
  // are a sandstone plateau: FLAT-TOPPED escarpments and stepped cliffs, no
  // summits. Say the shape, not the name (feedback_mpb_setting_needs_architecture).
  home:
    "INTERIOR: the family's living room at dusk — a soft armchair-sofa, a side table with a lit lamp, " +
    "and a large window. Through the window, FLAT-TOPPED sandstone escarpments and stepped cliff lines " +
    "in dark silhouette against a golden-pink sunset — a level plateau skyline, NOT pointed alpine " +
    "peaks and NO snow. One room only; no other room is visible. The children are indoors at home, so " +
    "they are not wearing their backpacks. ",
};

function storyBriefs() {
  const raw = fs.readFileSync(
    path.join(REPO, "myphonics_books", "data", "bush_walk_story_l6_4_book1.py"),
    "utf8",
  );
  // Pull each page's image_prompt and drop the trailing style boilerplate — the
  // forge appends BASE_STYLE itself, and two style blocks fight each other.
  const briefs = {};
  const re = /"page_number":\s*(\d+)[\s\S]*?"image_prompt":\s*\(([\s\S]*?)\n\s*\),/g;
  let m;
  while ((m = re.exec(raw))) {
    const body = m[2]
      .split("\n")
      .map((l) => l.trim().replace(/^"|"$/g, ""))
      .join(" ")
      .replace(/"\s+"/g, "");
    const cut = body.search(/Whimsical children's book illustration/);
    briefs[`page${m[1]}`] = (cut > 0 ? body.slice(0, cut) : body).trim();
  }
  return briefs;
}

const COVER_BRIEF =
  "A LOW CLOSE VIEW along the forest floor. A single lyrebird stands large in the lower half of the " +
  "frame, side-on, its enormous silver tail fanned wide and filling the upper frame behind it, beak " +
  "open, singing. Mia and Tom are smaller and further back on the left, kneeling together on the " +
  "red-earth track, watching it — the bird is the hero of the picture, not the children. Tall pale gum " +
  "trunks and a blue-hazed cliff beyond, bright open sky.";

const ANIMAL_RULE =
  "There is EXACTLY ONE animal in this picture and it is the one in the animal reference image. " +
  "Do not add a second bird or animal anywhere — not in the trees, not in the background, not on the " +
  "ground. Its eye is the same tiny solid black dot as the children's. ";

const sheet = (n) => path.join(OUT, `${n}.png`);
const load = (n) => fs.readFileSync(sheet(n));

// Some pages ignore FULL_BLEED and hand back the picture inset in a cream mat,
// sometimes with a drawn frame (8.4 page 6 did it twice running). Re-rolling is
// a coin toss and costs an image; trimming is exact. Scan in from each edge for
// the first row/column that is not near-uniform pale, and cut there. A page
// that is genuinely full bleed has no such border and comes back untouched.
async function trimMat(buf) {
  const img = sharp(buf);
  const { width, height } = await img.metadata();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const paleRow = (y) => {
    let pale = 0;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * ch;
      if (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2] > 232) pale++;
    }
    return pale / width > 0.94;
  };
  const paleCol = (x) => {
    let pale = 0;
    for (let y = 0; y < height; y++) {
      const i = (y * width + x) * ch;
      if (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2] > 232) pale++;
    }
    return pale / height > 0.94;
  };
  let top = 0, bottom = height - 1, left = 0, right = width - 1;
  while (top < bottom && paleRow(top)) top++;
  while (bottom > top && paleRow(bottom)) bottom--;
  while (left < right && paleCol(left)) left++;
  while (right > left && paleCol(right)) right--;
  // A drawn frame sits just inside the mat — step past a thin dark rule too.
  const pad = top > 4 || left > 4 ? 2 : 0;
  top += pad; left += pad; bottom -= pad; right -= pad;
  const w = right - left + 1, h = bottom - top + 1;
  if (w < width * 0.5 || h < height * 0.5) return { buf, trimmed: false };
  if (w === width && h === height) return { buf, trimmed: false };
  const out = await sharp(buf).extract({ left, top, width: w, height: h }).png().toBuffer();
  return { buf: out, trimmed: true, from: `${width}x${height}`, to: `${w}x${h}` };
}

async function buildSheets(only) {
  fs.mkdirSync(OUT, { recursive: true });
  const want = (n) => !only.length || only.includes(n);
  let cost = 0;

  for (const [key, child] of [["hero_mia", MIA], ["hero_tom", TOM]]) {
    if (!want(key)) continue;
    process.stdout.write(`  [${key}] generating...`);
    const r = await generateHero({ child });
    fs.writeFileSync(sheet(key), r.buf);
    cost += r.cost;
    console.log(` saved (${Math.round(r.buf.length / 1024)} KB, eyes: ${r.qa.pass ? "pass" : r.qa.reason})`);
  }
  if (want("hero_dad")) {
    process.stdout.write("  [hero_dad] generating...");
    const r = await generateCastMember({ member: DAD, child: MIA });
    fs.writeFileSync(sheet("hero_dad"), r.buf);
    cost += r.cost;
    console.log(` saved (${Math.round(r.buf.length / 1024)} KB, eyes: ${r.qa.pass ? "pass" : r.qa.reason})`);
  }
  for (const [id, spec] of Object.entries(ANIMALS)) {
    const key = `animal_${id}`;
    if (!want(key)) continue;
    process.stdout.write(`  [${key}] generating...`);
    const r = await generateAnimal(spec);
    fs.writeFileSync(sheet(key), r.buf);
    cost += r.cost;
    console.log(` saved (${Math.round(r.buf.length / 1024)} KB, eyes: ${r.qa.pass ? "pass" : r.qa.reason})`);
  }
  return cost;
}

async function main() {
  const args = process.argv.slice(2);
  const castOnly = args.includes("--cast");
  const targets = args.filter((a) => !a.startsWith("-"));
  // --trim re-runs only the deterministic mat trim over what is already on
  // disk, so a stubborn page can be fixed without paying for another image.
  if (args.includes("--trim")) {
    for (const n of [...Object.keys(PAGES), "cover"]) {
      if (!fs.existsSync(sheet(n))) continue;
      const t = await trimMat(fs.readFileSync(sheet(n)));
      if (t.trimmed) fs.writeFileSync(sheet(n), t.buf);
      console.log(`  [${n}] ${t.trimmed ? `trimmed ${t.from} → ${t.to}` : "full bleed already"}`);
    }
    return;
  }

  const briefs = storyBriefs();
  const missing = Object.keys(PAGES).filter((p) => !briefs[p]);
  if (missing.length) throw new Error(`no image_prompt parsed for: ${missing.join(", ")}`);

  let cost = 0;
  const sheetTargets = targets.filter((t) => t.startsWith("hero_") || t.startsWith("animal_"));
  if (castOnly || sheetTargets.length || !targets.length) {
    console.log("Cast + animal sheets:");
    cost += await buildSheets(sheetTargets);
  }
  if (castOnly) {
    console.log(`\nSheets done. $${cost.toFixed(3)}`);
    return;
  }

  const people = { mia: MIA, tom: TOM };
  const anchors = {};              // location id -> first image made there
  const order = [...Object.keys(PAGES), "cover"];
  const pageTargets = targets.filter((t) => order.includes(t));

  for (const name of order) {
    const spec = name === "cover" ? COVER : PAGES[name];
    const out = sheet(name);
    // An anchor must exist before a later page at the same location can use it,
    // so earlier pages are loaded from disk when only one page is targeted.
    if (pageTargets.length && !pageTargets.includes(name)) {
      if (!anchors[spec.location] && fs.existsSync(out)) anchors[spec.location] = fs.readFileSync(out);
      continue;
    }

    const heroKey = spec.hero === "tom" ? "hero_tom" : "hero_mia";
    const heroBuf = load(heroKey);
    const child = people[spec.hero];
    const castRefs = spec.cast.map((c) => ({
      name: c === "dad" ? "their dad" : people[c].name,
      buf: load(c === "dad" ? "hero_dad" : `hero_${c}`),
    }));
    for (const a of spec.animals) castRefs.push({ name: ANIMALS[a].name, buf: load(`animal_${a}`) });

    const settingBlock =
      // FULL_BLEED is no longer appended here: the forge BASE_STYLE now carries
      // the fleet's own FULL BLEED clause, and repeating rules only dilutes the
      // style signal in an already long prompt.
      (INTERIORS[spec.location] || SETTING) + SIZES +
      (spec.animals.length ? ANIMAL_RULE : "") + (PAGE_NOTES[name] || "");
    const anchorBuf = anchors[spec.location] || null;

    process.stdout.write(
      `  [${name}] ${spec.location}${anchorBuf ? " (anchored)" : " (first visit)"}...`,
    );
    const r =
      name === "cover"
        ? await generateCover({ heroBuf, brief: COVER_BRIEF, child, settingBlock, anchorBuf, castRefs })
        : await generateScene({
            heroBuf, scene: briefs[name], child, settingBlock, anchorBuf, camera: spec.camera, castRefs,
          });
    const t = await trimMat(r.buf);
    fs.writeFileSync(out, t.buf);
    cost += r.cost;
    // The anchor is what later pages copy the place from, so it must be the
    // trimmed frame — a mat baked into the anchor propagates to every revisit.
    if (!anchors[spec.location]) anchors[spec.location] = t.buf;
    console.log(
      ` saved (${Math.round(t.buf.length / 1024)} KB, eyes: ${r.qa.pass ? "pass" : r.qa.reason}` +
        `${t.trimmed ? `, mat trimmed ${t.from}→${t.to}` : ""})`,
    );
  }

  console.log(`\nDone. ~$${cost.toFixed(3)} on ${process.env.FORGE_IMG_ENGINE}.`);
}

await main();
