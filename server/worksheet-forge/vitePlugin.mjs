// Vite dev-server plugin that mounts the worksheet-forge (the prompt→A4
// worksheet machine at worksheet-forge/) as an API at /api/worksheet-forge,
// powering the /create-worksheet page. apply: "serve" — exactly like the
// book forge, this exists ONLY on the local dev server; production builds
// contain none of it.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const FORGE_DIR = path.join(REPO_ROOT, "worksheet-forge");
// Web-generated sheets get their own subfolder so they never collide with
// CLI runs in worksheet-forge/output/.
const OUT_DIR = path.join(FORGE_DIR, "output", "web");
const MIME = { ".png": "image/png", ".pdf": "application/pdf", ".html": "text/html; charset=utf-8", ".json": "application/json" };

// One shared Chromium renders every sheet; serialize jobs so two tabs can't
// interleave the auto-fit render loop.
let queue = Promise.resolve();
function enqueue(job) {
  const run = queue.then(job, job);
  queue = run.then(() => undefined, () => undefined);
  return run;
}

let forgeModules = null;
async function loadForge() {
  if (!forgeModules) {
    const [planner, render, vision, layout] = await Promise.all([
      import(pathToFileURL(path.join(FORGE_DIR, "planner", "planner.mjs")).href),
      import(pathToFileURL(path.join(FORGE_DIR, "render.mjs")).href),
      import(pathToFileURL(path.join(FORGE_DIR, "planner", "vision.mjs")).href),
      import(pathToFileURL(path.join(FORGE_DIR, "planner", "layout.mjs")).href),
    ]);
    const scenes = await import(pathToFileURL(path.join(FORGE_DIR, "planner", "scenes.mjs")).href);
    forgeModules = { planner, render, vision, layout, scenes };
  }
  return forgeModules;
}

function readBody(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) {
        reject(new Error("body too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function sheetFromMeta(meta) {
  return {
    ...meta,
    png: `/worksheet-sheets/${meta.slug}.png`,
    pdf: `/worksheet-sheets/${meta.slug}.pdf`,
  };
}

function listRecent(limit = 24) {
  if (!fs.existsSync(OUT_DIR)) return [];
  return fs.readdirSync(OUT_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(OUT_DIR, f), "utf8"));
      } catch {
        return null;
      }
    })
    .filter((m) => m && m.slug
      && fs.existsSync(path.join(OUT_DIR, `${m.slug}.png`))
      && fs.existsSync(path.join(OUT_DIR, `${m.slug}.pdf`)))
    .sort((a, z) => (z.created ?? 0) - (a.created ?? 0))
    .slice(0, limit)
    .map(sheetFromMeta);
}

async function handleGenerate(req, res) {
  const body = await readBody(req);
  const prompt = String(body.prompt ?? "").trim().slice(0, 300);
  if (!prompt) return send(res, 400, { error: "prompt is required" });
  const seed = Number.isFinite(Number(body.seed))
    ? Math.abs(Math.trunc(Number(body.seed))) % 10000
    : Math.floor(Math.random() * 9000) + 100;
  const ai = body.ai !== false;

  const result = await enqueue(async () => {
    const { planner, render } = await loadForge();
    const spec = await planner.planFromPrompt(prompt, { seed, ai });
    return { spec, ...(await render.renderFitted(spec, OUT_DIR)) };
  });

  const finalSpec = result.spec;
  const meta = {
    slug: path.basename(result.pdf, ".pdf"),
    title: finalSpec.title,
    subtitle: finalSpec.subtitle ?? null,
    level: finalSpec.level,
    grapheme: finalSpec.grapheme ?? null,
    blocks: finalSpec.blocks.map((b) => b.type),
    prompt,
    seed,
    overflow: result.overflow,
    trimmed: Boolean(result.trimmed),
    created: Date.now(),
  };
  fs.writeFileSync(path.join(OUT_DIR, `${meta.slug}.json`), JSON.stringify(meta, null, 2));
  return send(res, 200, { sheet: sheetFromMeta(meta) });
}

// Recreate an uploaded worksheet: vision maps its activities onto our block
// catalogue, then the forge rebuilds those activity TYPES with our own
// decodable content. Nothing from the uploaded sheet is copied.
async function handleRecreate(req, res) {
  const body = await readBody(req, 16 * 1024 * 1024);
  const b64 = String(body.image_b64 ?? "");
  if (!b64) return send(res, 400, { error: "image_b64 is required" });
  const mime = /^image\/(png|jpeg|webp)$/.test(body.mime) ? body.mime : "image/png";
  const seed = Math.floor(Math.random() * 9000) + 100;

  const result = await enqueue(async () => {
    const { planner, render, vision, layout, scenes } = await loadForge();

    // Read the sheet's LAYOUT first. A phonics sheet goes down the phonics
    // path, where we can fill it with real decodable content; anything else
    // (write-about-the-picture, maths, general) is rebuilt shape-faithfully
    // from the generic layouts instead of being mangled into the nearest
    // phonics activity.
    const shape = await vision.analyzeWorksheetLayout(b64, mime);
    if (shape && shape.subject && shape.subject !== "phonics") {
      const spec = layout.planFromLayout(shape, { seed });
      if (spec) {
        // Draw our own artwork for any empty picture slots. Slow (Vertex image
        // gen, rate-limited) but it's the difference between a usable sheet and
        // a set of blank frames; it degrades to blank frames if art fails.
        await scenes.illustrateSpec(spec, { log: (m) => console.log(`  ${m}`) });
        return {
          analysis: { summary: shape.task ?? shape.title ?? "", ...shape },
          spec,
          ...(await render.renderFitted(spec, OUT_DIR)),
        };
      }
    }

    const analysis = await vision.analyzeWorksheetImage(b64, mime);
    if (!analysis) {
      const err = new Error("The AI eye isn't available right now (Gemini credits/gcloud login needed).");
      err.status = 503;
      throw err;
    }
    const spec = await planner.planFromAnalysis(analysis, { seed });
    return { analysis, spec, ...(await render.renderFitted(spec, OUT_DIR)) };
  });

  const finalSpec = result.spec;
  const meta = {
    slug: path.basename(result.pdf, ".pdf"),
    title: finalSpec.title,
    subtitle: finalSpec.subtitle ?? null,
    level: finalSpec.level,
    grapheme: finalSpec.grapheme ?? null,
    blocks: finalSpec.blocks.map((b) => b.type),
    prompt: `recreated from upload — ${result.analysis.summary ?? ""}`.trim(),
    seed,
    overflow: result.overflow,
    trimmed: Boolean(result.trimmed),
    created: Date.now(),
  };
  fs.writeFileSync(path.join(OUT_DIR, `${meta.slug}.json`), JSON.stringify(meta, null, 2));
  return send(res, 200, { sheet: sheetFromMeta(meta), detected: result.analysis });
}

export default function worksheetForgePlugin() {
  return {
    name: "mpb-worksheet-forge",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/worksheet-forge", (req, res) => {
        const p = (req.url || "/").split("?")[0];
        Promise.resolve()
          .then(() => {
            if (req.method === "GET" && p === "/health") {
              return send(res, 200, { ok: true, forge: fs.existsSync(path.join(FORGE_DIR, "forge.mjs")) });
            }
            if (req.method === "GET" && p === "/recent") {
              return send(res, 200, { sheets: listRecent() });
            }
            if (req.method === "POST" && p === "/generate") {
              return handleGenerate(req, res);
            }
            if (req.method === "POST" && p === "/recreate") {
              return handleRecreate(req, res);
            }
            return send(res, 404, { error: "not found" });
          })
          .catch((e) => send(res, e?.status ?? 500, { error: String(e?.message || e) }));
      });

      // Serve generated sheets ourselves — same reason as /custom-books:
      // Vite's public-dir serving caches fs checks at boot, so files created
      // mid-session would fall through to the SPA index.html.
      server.middlewares.use("/worksheet-sheets", (req, res, next) => {
        const rel = decodeURIComponent((req.url || "").split("?")[0]);
        const file = path.normalize(path.join(OUT_DIR, rel));
        if (!file.startsWith(OUT_DIR)) return next();
        fs.stat(file, (err, st) => {
          if (err || !st.isFile()) return next();
          res.setHeader("Content-Type", MIME[path.extname(file).toLowerCase()] || "application/octet-stream");
          res.setHeader("Cache-Control", "no-cache");
          if (path.extname(file).toLowerCase() === ".pdf") {
            res.setHeader("Content-Disposition", `inline; filename="${path.basename(file)}"`);
          }
          fs.createReadStream(file).pipe(res);
        });
      });
    },
  };
}
