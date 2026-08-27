// Where generated book art lives. Two homes, one interface:
//
//   dev (vite)      → public/custom-books/{bookId}/{name}   (served by vite)
//   prod (Vercel)   → Supabase Storage bucket "custom-books" (public bucket)
//
// The split exists because Vercel's filesystem is read-only at runtime — the
// old saveImage() wrote into public/, which simply cannot work in a serverless
// function. Everything returns/accepts public URLs; loadImage() gives the raw
// Buffer back for reference-injection (the hero sheet is downloaded again when
// a later invocation needs it, because Buffers do not survive between
// serverless invocations).
import fs from "node:fs";
import path from "node:path";
import { cfg, REPO_ROOT } from "./env.mjs";

export const IS_SERVERLESS = Boolean(process.env.VERCEL);
export const CUSTOM_BOOKS_DIR = path.join(REPO_ROOT, "public", "custom-books");
const BUCKET = "custom-books";

function storageHeaders(extra = {}) {
  return {
    apikey: cfg.SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${cfg.SUPABASE_SERVICE_KEY}`,
    ...extra,
  };
}

let bucketReady = false;
async function ensureBucket() {
  if (bucketReady) return;
  // Idempotent: 409 = already exists. Public bucket — the images ARE the
  // product preview and the URLs are unguessable (uuid path segments).
  const res = await fetch(`${cfg.SUPABASE_URL}/storage/v1/bucket`, {
    method: "POST",
    headers: storageHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  if (!res.ok && res.status !== 409) {
    const text = await res.text();
    // A 400 "already exists" variant also counts as ready.
    if (!/exist/i.test(text)) throw new Error(`storage bucket: ${res.status} ${text.slice(0, 200)}`);
  }
  bucketReady = true;
}

const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".pdf": "application/pdf", ".json": "application/json" };

export function publicUrl(bookId, name) {
  if (!IS_SERVERLESS) return `/custom-books/${bookId}/${name}`;
  return `${cfg.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${bookId}/${name}`;
}

async function uploadToBucket(bookId, name, buf) {
  await ensureBucket();
  const mime = MIME[path.extname(name).toLowerCase()] || "application/octet-stream";
  const res = await fetch(
    `${cfg.SUPABASE_URL}/storage/v1/object/${BUCKET}/${bookId}/${name}`,
    {
      method: "POST",
      headers: storageHeaders({ "Content-Type": mime, "x-upsert": "true" }),
      body: buf,
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`storage upload ${name}: ${res.status} ${text.slice(0, 200)}`);
  }
}

export async function saveImage(bookId, name, buf) {
  if (!IS_SERVERLESS) {
    const dir = path.join(CUSTOM_BOOKS_DIR, bookId);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, name), buf);
    // DUAL-WRITE (2026-08-27): also mirror to Supabase Storage, best-effort.
    // Dev-only books used to live solely on this machine's disk, so the prod
    // admin's serverless renderer found no images and shipped "[ Scene N ]"
    // placeholder PDFs for all three of the owner's test books. Local disk
    // stays the dev source of truth (URLs unchanged); storage is the mirror
    // prod reads. A failed upload must never fail generation — warn and move
    // on; the image-presence gate now catches any book that slips through.
    try {
      await uploadToBucket(bookId, name, buf);
    } catch (e) {
      console.warn(`[forge] storage mirror failed for ${bookId}/${name} (book unaffected locally):`, e.message);
    }
    return publicUrl(bookId, name);
  }
  await uploadToBucket(bookId, name, buf);
  return publicUrl(bookId, name);
}

export async function loadImage(bookId, name) {
  if (!IS_SERVERLESS) {
    const p = path.join(CUSTOM_BOOKS_DIR, bookId, name);
    return fs.existsSync(p) ? fs.readFileSync(p) : null;
  }
  const res = await fetch(publicUrl(bookId, name));
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

// Load by public URL — used when the job state recorded a URL rather than a
// (bookId, name) pair. Dev URLs are root-relative, so map them back to disk.
export async function loadByUrl(url) {
  if (!url) return null;
  if (url.startsWith("/custom-books/")) {
    const p = path.join(REPO_ROOT, "public", url.replace(/^\//, "").replace(/\//g, path.sep));
    return fs.existsSync(p) ? fs.readFileSync(p) : null;
  }
  const res = await fetch(url);
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}
