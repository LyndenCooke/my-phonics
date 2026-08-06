// HTTP routes for the custom-book forge. Mounted at /api/forge by the Vite
// dev-server plugin (dev/localhost only — never part of the production build).
import { cfg, configReport } from "./env.mjs";
import { allLevels } from "./phonics.mjs";
import * as db from "./db.mjs";
import { createCheckout, verifySession, PRICES } from "./stripe.mjs";
import { startGeneration, stashPhoto, isRunning, renderPdf } from "./jobs.mjs";

function readBody(req, limit = 25 * 1024 * 1024) {
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

// Public projection of a book row (no email, no internal notes).
function publicBook(b) {
  return {
    id: b.id,
    title: b.title,
    level: b.level,
    focus_sound: b.focus_sound,
    child_name: b.child_name,
    country: b.country,
    country_flag: b.country_flag,
    pages: b.pages,
    profile: b.profile,
  };
}

export async function handleForge(req, res) {
  const url = new URL(req.url, "http://localhost");
  // req.url here is already stripped of the /api/forge prefix by connect
  const p = url.pathname;
  const origin = `http://${req.headers.host?.replace(/^::/, "localhost") || "localhost:8080"}`;

  try {
    if (req.method === "GET" && p === "/health") {
      const mode = await db.initDb();
      return send(res, 200, { ok: true, config: configReport(), store: mode });
    }

    if (req.method === "GET" && p === "/levels") {
      return send(res, 200, { levels: allLevels(), prices: PRICES });
    }

    if (req.method === "POST" && p === "/books") {
      const b = await readBody(req);
      if (!b.child_name || !b.level || !b.focus_sound) {
        return send(res, 400, { error: "child_name, level and focus_sound are required" });
      }
      const row = await db.insertBook({
        user_id: b.user_id || null,
        email: b.email || null,
        child_name: String(b.child_name).slice(0, 40),
        child_age: b.child_age ? Number(b.child_age) : null,
        country: b.country || null,
        country_flag: b.country_flag || null,
        city: b.city ? String(b.city).slice(0, 60) : null,
        culture_notes: b.culture_notes || null,
        likes: b.likes || null,
        faith: b.faith || null,
        appearance: b.appearance || {},
        photo_used: Boolean(b.photo_b64),
        level: Number(b.level),
        focus_sound: String(b.focus_sound),
        status: "awaiting_payment",
        share_requested: Boolean(b.share_requested),
        wall_of_love_opt_in: Boolean(b.wall_of_love_opt_in),
      });
      if (b.photo_b64) stashPhoto(row.id, b.photo_b64, b.photo_mime);
      return send(res, 200, { book: row });
    }

    const bookMatch = p.match(/^\/books\/([0-9a-f-]{8,})$/);
    if (req.method === "GET" && bookMatch) {
      let row = await db.getBook(bookMatch[1]);
      if (!row) return send(res, 404, { error: "not found" });
      // Self-heal: a "generating" row with no live job is an orphan (the dev
      // server restarted mid-generation). Flip it to failed so the wizard
      // shows the free retry button instead of polling forever.
      if (row.status === "generating" && !isRunning(row.id)) {
        row = await db.updateBook(row.id, {
          status: "failed",
          progress: { step: "failed", message: "The server restarted mid-generation — tap retry below (it's free).", pct: 0 },
        });
      }
      return send(res, 200, { book: { ...row, generating: isRunning(row.id) } });
    }

    // Render (or fetch) the real book_v2 PDF for a finished book.
    const pdfMatch = p.match(/^\/books\/([0-9a-f-]{8,})\/pdf$/);
    if (req.method === "POST" && pdfMatch) {
      const row = await db.getBook(pdfMatch[1]);
      if (!row) return send(res, 404, { error: "not found" });
      if (!row.pages) return send(res, 400, { error: "book not generated yet" });
      const url = await renderPdf(row.id);
      return send(res, 200, { url });
    }

    if (req.method === "POST" && p === "/checkout") {
      const b = await readBody(req);
      // Private test voucher — redeems to a £0 paid order and skips Stripe
      // entirely. Compared here on the server so the code is never shipped to
      // the browser; an unset FORGE_VOUCHER_CODE accepts nothing (see env.mjs).
      // Timing-safe-ish compare is overkill for a single private code, but the
      // length check stops a blank/short guess matching by accident.
      const supplied = String(b.voucher || "").trim();
      const secret = cfg.FORGE_VOUCHER_CODE;
      if (supplied && secret && supplied.length === secret.length && supplied === secret) {
        if (b.kind === "book" && b.book_id) {
          const book = await db.getBook(b.book_id);
          if (!book) return send(res, 404, { error: "not found" });
          await db.insertOrder({
            book_id: b.book_id, email: b.email || book.email, kind: "book",
            stripe_session_id: `voucher_${b.book_id.slice(0, 8)}`,
            amount_pence: 0, status: "paid",
          });
          if (["awaiting_payment", "failed"].includes(book.status)) startGeneration(b.book_id);
          return send(res, 200, { free: true, kind: "book", book_id: b.book_id });
        }
        if (b.kind === "world") {
          await db.insertOrder({
            email: b.email, kind: "world",
            stripe_session_id: `voucher_world_${Date.now()}`,
            amount_pence: 0, status: "paid",
          });
          return send(res, 200, { free: true, kind: "world" });
        }
      }
      if (supplied) return send(res, 400, { error: "That code is not valid." });
      const session = await createCheckout({
        kind: b.kind, bookId: b.book_id, email: b.email, origin,
      });
      await db.insertOrder({
        book_id: b.book_id || null,
        email: b.email || null,
        kind: b.kind,
        stripe_session_id: session.id,
        amount_pence: PRICES[b.kind].amount,
        status: "pending",
      });
      return send(res, 200, { url: session.url });
    }

    if (req.method === "GET" && p === "/verify") {
      const sessionId = url.searchParams.get("session_id");
      if (!sessionId) return send(res, 400, { error: "session_id required" });
      const v = await verifySession(sessionId);
      if (!v.paid) return send(res, 200, { paid: false });
      await db.updateOrderBySession(sessionId, { status: "paid", email: v.email });
      if (v.kind === "book" && v.bookId) {
        const book = await db.getBook(v.bookId);
        if (book && ["awaiting_payment", "failed"].includes(book.status)) {
          await db.updateBook(v.bookId, { email: book.email || v.email });
          startGeneration(v.bookId);
        }
      }
      return send(res, 200, { paid: true, kind: v.kind, book_id: v.bookId, email: v.email });
    }

    // Dev-only helper: simulate a successful payment without Stripe. The forge
    // server only exists in `vite` dev, so this can never reach production.
    if (req.method === "POST" && p === "/dev/simulate-pay") {
      const b = await readBody(req);
      if (b.kind === "book" && b.book_id) {
        const book = await db.getBook(b.book_id);
        if (!book) return send(res, 404, { error: "not found" });
        await db.insertOrder({
          book_id: b.book_id, email: b.email || book.email, kind: "book",
          stripe_session_id: `dev_${b.book_id.slice(0, 8)}_${b.kind}`,
          amount_pence: 0, status: "paid",
        });
        if (["awaiting_payment", "failed"].includes(book.status)) startGeneration(b.book_id);
        return send(res, 200, { ok: true });
      }
      if (b.kind === "world") {
        await db.insertOrder({
          email: b.email, kind: "world",
          stripe_session_id: `dev_world_${Date.now()}`,
          amount_pence: 0, status: "paid",
        });
        return send(res, 200, { ok: true });
      }
      return send(res, 400, { error: "bad kind" });
    }

    if (req.method === "POST" && p === "/retry") {
      const b = await readBody(req);
      const book = await db.getBook(b.book_id);
      if (!book) return send(res, 404, { error: "not found" });
      if (book.status === "failed") startGeneration(b.book_id);
      return send(res, 200, { ok: true });
    }

    if (req.method === "GET" && p === "/world") {
      const email = url.searchParams.get("email");
      const access = await db.hasWorldAccess(email);
      const books = await db.listBooks({ is_public: true });
      const wall = books
        .filter((b) => b.wall_of_love_opt_in && b.profile)
        .map((b) => ({ ...b.profile, title: b.title, book_id: b.id }));
      return send(res, 200, {
        access,
        wall,
        books: books.map((b) => (access ? publicBook(b) : {
          id: b.id, title: b.title, level: b.level, focus_sound: b.focus_sound,
          child_name: b.child_name, country: b.country, country_flag: b.country_flag,
          cover: b.pages?.[0]?.imageUrl || null, locked: true,
        })),
      });
    }

    if (req.method === "GET" && p === "/admin/queue") {
      const all = await db.listBooks({});
      const queue = all.filter((b) => b.share_requested && ["ready"].includes(b.status));
      const decided = all.filter((b) => ["approved", "rejected"].includes(b.status));
      return send(res, 200, { queue, decided, costs: await db.costSummary() });
    }

    if (req.method === "POST" && p === "/admin/decision") {
      const b = await readBody(req);
      const book = await db.getBook(b.book_id);
      if (!book) return send(res, 404, { error: "not found" });
      await db.updateBook(b.book_id, b.approve
        ? { status: "approved", is_public: true, review_note: b.note || null }
        : { status: "rejected", is_public: false, review_note: b.note || null });
      return send(res, 200, { ok: true });
    }

    return send(res, 404, { error: `no route ${req.method} ${p}` });
  } catch (e) {
    console.error("[forge]", e);
    return send(res, 500, { error: String(e.message || e) });
  }
}
