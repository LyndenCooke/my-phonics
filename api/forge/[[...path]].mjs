// Production mount for the Create-A-Book forge API.
//
// In dev, server/forge/vitePlugin.mjs serves the same router at /api/forge on
// the vite dev server. This file is the missing production half: a Vercel
// Node function that strips the /api/forge prefix (connect did that for us in
// dev) and hands the request to the identical router. One router, two mounts,
// zero behavioural drift.
//
// Secrets come from Vercel env vars (see DEPLOY.md at the repo root) — the
// gitignored .env files this reads locally do not exist in a deployment, and
// env.mjs already prefers process.env for exactly that reason.
import { handleForge } from "../../server/forge/router.mjs";

export default function handler(req, res) {
  const original = req.url || "/";
  req.url = original.replace(/^\/api\/forge/, "") || "/";
  return handleForge(req, res);
}

// One generation step (an image + its zoomed eye QA, or the story write) can
// legitimately take a couple of minutes — that is why generation is a step
// machine at all. 300s is Fluid Compute's ceiling and gives the slowest step
// (story + retries) comfortable room.
export const config = { maxDuration: 300 };
