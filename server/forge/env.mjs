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
    } else {
      // Strip a trailing inline comment from an UNQUOTED value, the way dotenv
      // does. The Anthropic key was pasted with "  # Claude — story generation"
      // after it (2026-08-16); the em dash rode into the auth header and every
      // Anthropic call died with a ByteString error before leaving the process.
      // Quoted values are left alone so a '#' inside a real secret survives.
      val = val.replace(/\s+#.*$/, "").trim();
    }
    if (key) out[key] = val;
  }
  return out;
}

// Sources, in priority order: real environment variables first (that is how
// Vercel injects secrets in production — the .env files below are gitignored
// and simply do not exist in a deployment), then the two repo .env files that
// power local dev.
const rootEnv = parseEnvFile(path.join(REPO_ROOT, ".env"));
const fileEnv = parseEnvFile(path.join(BOOKS_DIR, ".env"));
const booksEnv = new Proxy(fileEnv, {
  get: (t, k) => process.env[k] ?? t[k],
});

// Only accept a real Anthropic key — the .env currently holds a placeholder
// ("your_anthropic_key — ...") which would otherwise be sent as a header and
// crash fetch with a ByteString error (that's what failed the first smoke run).
const rawAnthropic = booksEnv.ANTHROPIC_API_KEY || "";
const anthropicKey = rawAnthropic.startsWith("sk-ant-") ? rawAnthropic : "";

export const cfg = {
  SUPABASE_URL: process.env.VITE_SUPABASE_URL || rootEnv.VITE_SUPABASE_URL || booksEnv.SUPABASE_URL || "",
  SUPABASE_SERVICE_KEY: booksEnv.SUPABASE_SERVICE_KEY || "",
  SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY || rootEnv.VITE_SUPABASE_PUBLISHABLE_KEY || booksEnv.SUPABASE_ANON_KEY || "",
  ANTHROPIC_API_KEY: anthropicKey,
  OPENAI_API_KEY: booksEnv.OPENAI_API_KEY || "",
  FAL_KEY: booksEnv.FAL_KEY || "",
  // Kimi (Moonshot) - a far cheaper text vendor for the writing and judging
  // work, which is not the hard part of this pipeline (Lynden 2026-08-22).
  // The .env spells it Kimi_API_KEy; accept any casing.
  KIMI_API_KEY: booksEnv.KIMI_API_KEY || booksEnv.Kimi_API_KEy || booksEnv.kimi_api_key || "",
  STRIPE_SECRET_KEY: booksEnv.STRIPE_SECRET_KEY || "",
  ELEVEN_LABS_API: booksEnv.ELEVEN_LABS_API || "",
  // Same key already used by supabase/functions/stripe-webhook for print-ops
  // alerts — reused here to email a finished Create-A-Book PDF to the family.
  RESEND_API_KEY: booksEnv.RESEND_API_KEY || "",
  // Private test voucher (Lynden 2026-08-06): makes Create-A-Book free so he
  // can test the real flow without paying. Lives in myphonics_books/.env and is
  // ONLY ever compared server-side — never sent to the browser, never in the
  // client bundle, and .env is gitignored, so the code stays private. Unset
  // means no voucher is accepted at all, which is the safe default: an empty
  // string must never match an empty submission.
  FORGE_VOUCHER_CODE: booksEnv.FORGE_VOUCHER_CODE || "",
  // GoHighLevel inbound-webhook URL for the book-ready delivery workflow.
  // Unset = the CRM hand-off is skipped (Resend email still goes out).
  GHL_BOOK_WEBHOOK_URL: process.env.GHL_BOOK_WEBHOOK_URL || booksEnv.GHL_BOOK_WEBHOOK_URL || "",
  // Vertex AI fallback (gcloud OAuth) — the LLM path that is known-good on
  // this machine when no Anthropic key is configured.
  VERTEX_PROJECT: booksEnv.VERTEX_PROJECT || "iron-entropy-496317-q9",
  VERTEX_REGION: booksEnv.VERTEX_REGION || "us-central1",
};

export function configReport() {
  return {
    // Which model is actually writing, so a stale dev server on another port
    // cannot silently ignore FORGE_WRITER_MODEL (it has cost two test runs).
    writer_model: process.env.FORGE_WRITER_MODEL || "(default story tier)",
    image_engine: process.env.FORGE_IMG_ENGINE || "(failover order)",
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
