// Style bake-off v2: TEXT-ONLY hero generation (no reference image — the old
// eye-ref was forcing chibi proportions + blush cheeks into every output).
// Same child, four genuinely different styles → public/custom-books/style-test/
// Run: node server/forge/styleTest.mjs
import fs from "node:fs";
import path from "node:path";
import { cfg, REPO_ROOT } from "./env.mjs";

const OUT_DIR = path.join(REPO_ROOT, "public", "custom-books", "style-test");

const CHILD =
  "A 6 year old boy with warm light-brown skin (#D4A574) and short curly black hair, wearing an orange jumper, " +
  "blue jeans and trainers, standing facing forward with a warm natural smile, arms relaxed at his sides, " +
  "full body head to toe, on a plain soft warm cream background with nothing else in the frame.";

const RULES =
  "Natural child proportions — NOT chibi, head normal size for a child. " +
  "EYES: TINY solid pure-black dot eyes, small like peppercorns or a teddy bear's bead eyes, drawn as little filled black dots — much smaller than typical cartoon eyes, no white in or around them, no highlight, no glint, no iris. " +
  "CHEEKS: plain skin, absolutely no blush, no pink circles, no cheek dots of any kind. No text anywhere.";

const STYLES = {
  A_house_watercolour:
    "Classic picture-book illustration: hand-drawn with confident clean black ink outlines and soft watercolour washes, gentle paper texture, warm storybook palette — the feel of a beautifully printed children's book.",
  B_soft_gouache:
    "Painterly gouache picture-book illustration: soft textured brushstrokes, no hard outlines, muted warm earthy palette, cosy and timeless like a modern Scandinavian picture-book.",
  C_modern_vector:
    "Contemporary flat illustration, high-end editorial children's book style: clean bold shapes, refined warm palette, subtle paper grain, minimal detail used with intent — sophisticated, not cutesy.",
  D_pencil_storybook:
    "Coloured-pencil and crayon picture-book illustration: visible pencil strokes and grain, loose warm hand-drawn outlines, soft nostalgic colours on cream paper — like a beloved classic bedtime book.",
};

async function textToImage(prompt, attempt = 0) {
  try {
    const res = await fetch("https://fal.run/fal-ai/flux-pro/v1.1", {
      method: "POST",
      headers: { Authorization: `Key ${cfg.FAL_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt, num_images: 1, output_format: "jpeg",
        image_size: "portrait_4_3", safety_tolerance: "5",
      }),
    });
    if (!res.ok) throw new Error(`fal ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    const img = await fetch(data.images[0].url);
    return Buffer.from(await img.arrayBuffer());
  } catch (e) {
    if (attempt < 3) {
      console.log(`  retry ${attempt + 1} (${e.message.slice(0, 60)})`);
      await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
      return textToImage(prompt, attempt + 1);
    }
    throw e;
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const [name, style] of Object.entries(STYLES)) {
  process.stdout.write(`${name}... `);
  const buf = await textToImage(`${style} ${CHILD} ${RULES}`);
  fs.writeFileSync(path.join(OUT_DIR, `${name}.jpg`), buf);
  console.log("done");
}
console.log("saved to", OUT_DIR);
