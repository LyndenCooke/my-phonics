// Vite dev-server plugin that mounts the custom-book forge API at /api/forge.
// apply: "serve" means it exists ONLY on the local dev server — production
// builds contain none of this (and none of the secret-bearing code paths).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CUSTOM_BOOKS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "custom-books",
);
const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".pdf": "application/pdf" };

export default function forgePlugin() {
  return {
    name: "mpb-forge",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/forge", (req, res) => {
        import("./router.mjs")
          .then(({ handleForge }) => handleForge(req, res))
          .catch((e) => {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: String(e.message || e) }));
          });
      });
      // Serve generated book assets ourselves. Vite's public-dir serving
      // caches fs checks at boot, so directories created mid-session (every
      // newly generated book) silently fall through to the SPA index.html —
      // the "text came but no images" bug.
      server.middlewares.use("/custom-books", (req, res, next) => {
        const rel = decodeURIComponent((req.url || "").split("?")[0]);
        const file = path.normalize(path.join(CUSTOM_BOOKS_DIR, rel));
        if (!file.startsWith(CUSTOM_BOOKS_DIR)) return next();
        fs.stat(file, (err, st) => {
          if (err || !st.isFile()) return next();
          res.setHeader("Content-Type", MIME[path.extname(file).toLowerCase()] || "application/octet-stream");
          res.setHeader("Cache-Control", "no-cache");
          fs.createReadStream(file).pipe(res);
        });
      });
    },
  };
}
