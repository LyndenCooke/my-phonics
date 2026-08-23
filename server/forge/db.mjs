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

let fileFallbackAt = 0;

export async function initDb() {
  // "file" is a FALLBACK, not a destination: one transient network blip at
  // startup used to strand the whole session on the local store (2026-08-15:
  // a freshly restarted dev server answered "not found" for every real
  // Supabase book). Re-probe Supabase periodically so the fallback heals.
  if (mode === "supabase") return mode;
  if (mode === "file" && Date.now() - fileFallbackAt < 60_000) return mode;
  try {
    await rest("custom_books?select=id&limit=1");
    if (mode === "file") console.warn("[forge] Supabase store recovered — leaving file fallback");
    mode = "supabase";
  } catch (e) {
    if (mode !== "file") console.warn("[forge] Supabase store unavailable, using local file store:", e.message);
    mode = "file";
    fileFallbackAt = Date.now();
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

// Books stuck mid-generation with nobody driving them. Prod's step machine
// is advanced by the customer's browser; a closed tab strands the book at
// "generating" forever. Staleness comes from progress.job.lockAt (stamped by
// every step) rather than updated_at, which has no update trigger.
export async function staleGeneratingBooks(minutes = 10) {
  await initDb();
  const cutoff = Date.now() - minutes * 60_000;
  // AGE FENCE: only books CREATED in the last 24h are adopted. Anything
  // older marked "generating" is pre-sweeper debris (dev experiments,
  // half-runs from other machines) — the first live sweep found four,
  // one from 13 days earlier, and started spending real API money
  // finishing a book nobody was waiting for (2026-08-23). A genuinely
  // stranded customer book is always fresh; old strays stay untouched
  // for a human to retry or delete.
  const ageFence = Date.now() - 24 * 3600_000;
  const stale = (b) => {
    if (new Date(b.created_at).getTime() < ageFence) return false;
    const at = b.progress?.job?.lockAt;
    return !at || at < cutoff;
  };
  if (mode === "supabase") {
    const rows = await rest("custom_books?status=eq.generating&select=id,progress,created_at&order=created_at.desc&limit=25");
    return rows.filter(stale).map((b) => ({ id: b.id }));
  }
  return loadFile().custom_books.filter((b) => b.status === "generating" && stale(b)).map((b) => ({ id: b.id }));
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

// Credit bookkeeping for the double-reject flow (Lynden 2026-08-14): when
// the editor gate rejects a book twice, the customer's payment must not be
// consumed — their paid order flips to "credit_restored" and can either be
// re-used on the same book (retry) or carried to a brand-new book (transfer).
async function patchOrders(where, patch) {
  if (mode === "supabase") {
    return (await rest(`custom_book_orders?${where}`, { method: "PATCH", body: JSON.stringify(patch) })) || [];
  }
  return null; // file mode handled by callers
}

export async function restoreCreditForBook(bookId) {
  await initDb();
  if (mode === "supabase") {
    return patchOrders(`book_id=eq.${bookId}&status=eq.paid`, { status: "credit_restored" });
  }
  const s = loadFile();
  const hit = s.custom_book_orders.filter((o) => o.book_id === bookId && o.status === "paid");
  hit.forEach((o) => { o.status = "credit_restored"; });
  saveFile(s);
  return hit;
}

export async function reclaimCreditForBook(bookId) {
  await initDb();
  if (mode === "supabase") {
    const rows = await patchOrders(`book_id=eq.${bookId}&status=eq.credit_restored`, { status: "paid" });
    return rows.length > 0;
  }
  const s = loadFile();
  const hit = s.custom_book_orders.filter((o) => o.book_id === bookId && o.status === "credit_restored");
  hit.forEach((o) => { o.status = "paid"; });
  saveFile(s);
  return hit.length > 0;
}

// Move a restored credit from a content-rejected book onto a new book row
// ("Change the story idea"). Returns true if a credit actually moved.
export async function transferCredit(fromBookId, toBookId) {
  await initDb();
  if (mode === "supabase") {
    const rows = await patchOrders(
      `book_id=eq.${fromBookId}&status=eq.credit_restored`,
      { book_id: toBookId, status: "paid" },
    );
    return rows.length > 0;
  }
  const s = loadFile();
  const hit = s.custom_book_orders.filter((o) => o.book_id === fromBookId && o.status === "credit_restored");
  hit.forEach((o) => { o.book_id = toBookId; o.status = "paid"; });
  saveFile(s);
  return hit.length > 0;
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

// Last N story shapes used, most-recent first — lets the shape picker avoid
// repeating what the last few families just got (two "The swap" books shipped
// back to back, 2026-08-07 and 2026-08-09, because the picker had no memory).
export async function recentStoryShapes(limit = 5) {
  await initDb();
  let rows;
  if (mode === "supabase") {
    rows = await rest(`custom_books?select=cost_breakdown&order=created_at.desc&limit=${limit}`);
  } else {
    rows = loadFile().custom_books.slice(0, limit);
  }
  return rows.map((b) => b.cost_breakdown?.story_shape).filter(Boolean);
}

// Which published books have recently been varied, so the next one reskins a
// different plot (Lynden 2026-08-21).
export async function recentSourceStories(limit = 6) {
  await initDb();
  let rows;
  if (mode === "supabase") {
    rows = await rest(`custom_books?select=cost_breakdown&order=created_at.desc&limit=${limit}`);
  } else {
    rows = loadFile().custom_books.slice(0, limit);
  }
  return rows.map((b) => b.cost_breakdown?.source_story).filter(Boolean);
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
