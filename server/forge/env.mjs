// Loads the keys the forge server needs from the two .env files already in the
// repo (root .env for the Supabase URL, myphonics_books/.env for the API keys).
// Never log these values.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, "..", "..");
export const BOOKS_DIR = path.join(REPO_ROOT, "myphonics_books");

function parseEnvFile(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key) out[key] = val;
  }
  return out;
}

const rootEnv = parseEnvFile(path.join(REPO_ROOT, ".env"));
const booksEnv = parseEnvFile(path.join(BOOKS_DIR, ".env"));

// Only accept a real Anthropic key — the .env currently holds a placeholder
// ("your_anthropic_key — ...") which would otherwise be sent as a header and
// crash fetch with a ByteString error (that's what failed the first smoke run).
const rawAnthropic = booksEnv.ANTHROPIC_API_KEY || "";
const anthropicKey = rawAnthropic.startsWith("sk-ant-") ? rawAnthropic : "";

export const cfg = {
  SUPABASE_URL: rootEnv.VITE_SUPABASE_URL || booksEnv.SUPABASE_URL || "",
  SUPABASE_SERVICE_KEY: booksEnv.SUPABASE_SERVICE_KEY || "",
  SUPABASE_ANON_KEY: rootEnv.VITE_SUPABASE_PUBLISHABLE_KEY || booksEnv.SUPABASE_ANON_KEY || "",
  ANTHROPIC_API_KEY: anthropicKey,
  OPENAI_API_KEY: booksEnv.OPENAI_API_KEY || "",
  FAL_KEY: booksEnv.FAL_KEY || "",
  STRIPE_SECRET_KEY: booksEnv.STRIPE_SECRET_KEY || "",
  ELEVEN_LABS_API: booksEnv.ELEVEN_LABS_API || "",
  // Vertex AI fallback (gcloud OAuth) — the LLM path that is known-good on
  // this machine when no Anthropic key is configured.
  VERTEX_PROJECT: booksEnv.VERTEX_PROJECT || "iron-entropy-496317-q9",
  VERTEX_REGION: booksEnv.VERTEX_REGION || "us-central1",
};

export function configReport() {
  return {
    supabase_url: cfg.SUPABASE_URL || "(missing)",
    supabase_service_key: cfg.SUPABASE_SERVICE_KEY ? "present" : "missing",
    llm: cfg.ANTHROPIC_API_KEY
      ? "anthropic (claude)"
      : cfg.OPENAI_API_KEY
        ? "openai (gpt-5)"
        : "vertex gemini (gcloud fallback)",
    openai_key: cfg.OPENAI_API_KEY ? "present" : "missing",
    fal_key: cfg.FAL_KEY ? "present" : "missing",
    stripe_secret_key: cfg.STRIPE_SECRET_KEY
      ? cfg.STRIPE_SECRET_KEY.startsWith("sk_live")
        ? "present (LIVE mode)"
        : cfg.STRIPE_SECRET_KEY.startsWith("sk_test")
          ? "present (test mode)"
          : "present (unknown prefix)"
      : "missing",
  };
}
