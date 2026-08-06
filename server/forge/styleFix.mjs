// Apply the production eye-rule + no-blush repair pass to the style-test
// candidates → *_fixed.jpg. Run: node server/forge/styleFix.mjs
import fs from "node:fs";
import path from "node:path";
import { cfg, REPO_ROOT } from "./env.mjs";

const DIR = path.join(REPO_ROOT, "public", "custom-books", "style-test");
const PROMPT =
  "Edit this illustration. Change ONLY two things: " +
  "1) EYES — replace the eyes with TINY solid black dot eyes, like a teddy bear's small round bead eyes: each eye becomes one small filled black dot noticeably SMALLER than the current eyes, with no white around it, no highlight, no iris, no outline. Keep the eyes in the same positions. " +
  "2) CHEEKS — remove all pink, peach or rosy blush circles from the cheeks, leaving plain smooth skin. " +
  "Keep the art style, character, pose, clothing, colours and everything else exactly the same.";

async function repair(file, attempt = 0) {
  try {
    const b64 = fs.readFileSync(path.join(DIR, file)).toString("base64");
    const res = await fetch("https://fal.run/fal-ai/flux-pro/kontext", {
      method: "POST",
      headers: { Authorization: `Key ${cfg.FAL_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: PROMPT, image_url: `data:image/jpeg;base64,${b64}`,
        num_images: 1, output_format: "jpeg", guidance_scale: 3.5,
        safety_tolerance: "5", aspect_ratio: "3:4",
      }),
    });
    if (!res.ok) throw new Error(`fal ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    const img = await fetch(data.images[0].url);
    return Buffer.from(await img.arrayBuffer());
  } catch (e) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
      return repair(file, attempt + 1);
    }
    throw e;
  }
}

for (const f of fs.readdirSync(DIR).filter((f) => f.endsWith(".jpg") && !f.includes("_fixed"))) {
  process.stdout.write(`${f}... `);
  const buf = await repair(f);
  fs.writeFileSync(path.join(DIR, f.replace(".jpg", "_fixed.jpg")), buf);
  console.log("fixed");
}
console.log("done");
