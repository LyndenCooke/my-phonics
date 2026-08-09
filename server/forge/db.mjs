// Persistence for custom books. Primary store: Supabase (service role, REST).
// If the service key turns out not to work against the prod project, we fall
// back to a local JSON file store so the localhost demo still works end-to-end
// (health endpoint reports which store is active).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cfg } from "./env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, ".data");
const FILE_STORE = path.join(DATA_DIR, "store.json");

let mode = "unknown"; // 'supabase' | 'file'

function headers() {
  return {
    apikey: cfg.SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${cfg.SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

async function rest(pathQ, opts = {}) {
  const res = await fetch(`${cfg.SUPABASE_URL}/rest/v1/${pathQ}`, {
    ...opts,
    headers: { ...headers(), ...(opts.headers || {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`supabase ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

// ---------- file fallback ----------
function loadFile() {
  if (!fs.existsSync(FILE_STORE)) return { custom_books: [], custom_book_orders: [] };
  return JSON.parse(fs.readFileSync(FILE_STORE, "utf8"));
}
function saveFile(s) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE_STORE, JSON.stringify(s, null, 2));
}
function uuid() {
  return crypto.randomUUID();
}

export async function initDb() {
  if (mode !== "unknown") return mode;
  try {
    await rest("custom_books?select=id&limit=1");
    mode = "supabase";
  } catch (e) {
    console.warn("[forge] Supabase store unavailable, using local file store:", e.message);
    mode = "file";
  }
  return mode;
}

export function dbMode() {
  return mode;
}

export async function insertBook(row) {
  await initDb();
  if (mode === "supabase") {
    const [r] = await rest("custom_books", { method: "POST", body: JSON.stringify(row) });
    return r;
  }
  const s = loadFile();
  const r = { id: uuid(), created_at: new Date().toISOString(), ...row };
  s.custom_books.push(r);
  saveFile(s);
  return r;
}

export async function updateBook(id, patch) {
  await initDb();
  patch.updated_at = new Date().toISOString();
  if (mode === "supabase") {
    const [r] = await rest(`custom_books?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    return r;
  }
  const s = loadFile();
  const r = s.custom_books.find((b) => b.id === id);
  if (r) Object.assign(r, patch);
  saveFile(s);
  return r;
}

export async function getBook(id) {
  await initDb();
  if (mode === "supabase") {
    const rows = await rest(`custom_books?id=eq.${id}&limit=1`);
    return rows[0] || null;
  }
  return loadFile().custom_books.find((b) => b.id === id) || null;
}

export async function listBooks(filter = {}) {
  await initDb();
  if (mode === "supabase") {
    let q = "custom_books?order=created_at.desc";
    if (filter.is_public) q += "&is_public=eq.true";
    if (filter.status) q += `&status=eq.${filter.status}`;
    if (filter.share_requested) q += "&share_requested=eq.true";
    return rest(q);
  }
  let rows = loadFile().custom_books;
  if (filter.is_public) rows = rows.filter((b) => b.is_public);
  if (filter.status) rows = rows.filter((b) => b.status === filter.status);
  if (filter.share_requested) rows = rows.filter((b) => b.share_requested);
  return rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export async function insertOrder(row) {
  await initDb();
  if (mode === "supabase") {
    const [r] = await rest("custom_book_orders", { method: "POST", body: JSON.stringify(row) });
    return r;
  }
  const s = loadFile();
  const r = { id: uuid(), created_at: new Date().toISOString(), status: "pending", ...row };
  s.custom_book_orders.push(r);
  saveFile(s);
  return r;
}

export async function updateOrderBySession(sessionId, patch) {
  await initDb();
  if (mode === "supabase") {
    const rows = await rest(
      `custom_book_orders?stripe_session_id=eq.${encodeURIComponent(sessionId)}`,
      { method: "PATCH", body: JSON.stringify(patch) },
    );
    return rows[0] || null;
  }
  const s = loadFile();
  const r = s.custom_book_orders.find((o) => o.stripe_session_id === sessionId);
  if (r) Object.assign(r, patch);
  saveFile(s);
  return r;
}

// World of Books access is keyed primarily by user_id now (the £10 tier
// requires sign-in — see checkout()), with the pre-migration email match kept
// as a fallback so orders placed before accounts existed still unlock.
export async function hasWorldAccess({ email, userId } = {}) {
  await initDb();
  if (!email && !userId) return false;
  if (mode === "supabase") {
    if (userId) {
      const rows = await rest(
        `custom_book_orders?kind=eq.world&status=eq.paid&user_id=eq.${encodeURIComponent(userId)}&select=id&limit=1`,
      );
      if (rows.length > 0) return true;
    }
    if (email) {
      const rows = await rest(
        `custom_book_orders?kind=eq.world&status=eq.paid&email=eq.${encodeURIComponent(email)}&select=id&limit=1`,
      );
      if (rows.length > 0) return true;
    }
    return false;
  }
  const orders = loadFile().custom_book_orders;
  return orders.some(
    (o) => o.kind === "world" && o.status === "paid"
      && ((userId && o.user_id === userId) || (email && o.email === email)),
  );
}

export async function costSummary() {
  await initDb();
  const books = await listBooks({});
  const done = books.filter((b) => ["ready", "approved", "rejected"].includes(b.status));
  const total = done.reduce((s, b) => s + Number(b.cost_usd || 0), 0);
  return {
    books_generated: done.length,
    total_cost_usd: Number(total.toFixed(4)),
    avg_cost_usd: done.length ? Number((total / done.length).toFixed(4)) : 0,
  };
}
