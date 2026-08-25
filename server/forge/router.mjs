// HTTP routes for the custom-book forge. Mounted at /api/forge by the Vite
// dev-server plugin (dev/localhost only — never part of the production build).
import { cfg, configReport } from "./env.mjs";
import { allLevels } from "./phonics.mjs";
import * as db from "./db.mjs";
import { createCheckout, verifySession, PRICES } from "./stripe.mjs";
import { startGeneration, stashPhoto, isRunning, renderPdf, runNextStep, repairBook, MAX_BOOK_SPEND_USD } from "./jobs.mjs";
import { IS_SERVERLESS } from "./storage.mjs";

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

// Resolves the Supabase-authenticated user from the request's bearer token,
// or null for a guest. Used to gate the World of Books tier (must be signed
// in to join, and to keep access) and to link a created book to an account.
// A missing/invalid/expired token is just "not signed in" — never an error.
async function verifyUser(req) {
  const authz = req.headers.authorization || "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) return null;
  try {
    const r = await fetch(`${cfg.SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: cfg.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    const u = await r.json();
    return u?.id ? { id: u.id, email: u.email || null } : null;
  } catch {
    return null;
  }
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
      // The focus sound must be one of ITS level's own graphemes — a book
      // teaching a sound its level calls "future" contradicts its own phonics
      // pages (2026-08-15: an L4 book was created with the L5 grapheme "ai"
      // via direct API call and shipped labelling its focus sound as
      // "coming at Level 5"). The wizard already restricts the picker; this
      // closes the API path.
      {
        const lv = allLevels().find((l) => l.level === Number(b.level));
        if (!lv) return send(res, 400, { error: `Level ${b.level} does not exist.` });
        if (!lv.graphemes.includes(String(b.focus_sound))) {
          return send(res, 400, { error: `"${b.focus_sound}" is not a Level ${b.level} sound — it belongs to a different level. Pick one of: ${lv.graphemes.join(", ")}` });
        }
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
      // MERGE into the existing progress — progress.job is the book's entire
      // resumable state (finished scenes, references, cost, reviews), and
      // replacing the object wholesale here destroyed $2.60 of completed
      // work on 2026-08-14 and forced a from-scratch regeneration.
      if (!IS_SERVERLESS && row.status === "generating" && !isRunning(row.id)) {
        row = await db.updateBook(row.id, {
          status: "failed",
          progress: {
            ...(row.progress || {}),
            step: "failed",
            message: "The server restarted mid-generation — tap retry below (it's free).",
            pct: 0,
            job: row.progress?.job || null,
          },
        });
      }
      return send(res, 200, { book: { ...row, generating: isRunning(row.id) } });
    }

    // Advance a generating book by ONE step. This is how production works:
    // serverless functions cannot run a four-minute background job, so the
    // wizard calls this in a loop until { done: true }. Harmless under vite
    // too (the in-process driver holds the lock, so this returns busy).
    const stepMatch = p.match(/^\/books\/([0-9a-f-]{8,})\/step$/);
    if (req.method === "POST" && stepMatch) {
      const row = await db.getBook(stepMatch[1]);
      if (!row) return send(res, 404, { error: "not found" });
      if (!["generating"].includes(row.status)) {
        return send(res, 200, { done: ["ready", "approved", "text_ready", "needs_review", "content_rejected"].includes(row.status), status: row.status, step: "none" });
      }
      const r = await runNextStep(row.id);
      // DELIVER AT THE FINISH LINE (Lynden 2026-08-24: PDFs "sent straight
      // away"). The assemble step flips the book to ready; render both PDFs
      // and fire the email + GHL sync NOW rather than waiting for the
      // customer to press a download button. Runs exactly once (on the
      // assemble transition), never fails the step response, and the /pdf
      // endpoint stays as the manual re-render path.
      if (r.step === "assemble" && r.status !== "failed") {
        const scheme = req.headers["x-forwarded-proto"] || "https";
        const requestOrigin = req.headers.host ? `${scheme}://${req.headers.host}` : null;
        try {
          await renderPdf(row.id, { origin: requestOrigin });
        } catch (e) {
          console.warn(`[forge] delivery-at-ready render failed for ${row.id} (book still readable, /pdf can retry):`, e.message);
        }
      }
      return send(res, 200, r);
    }

    // Render (or fetch) the real book_v2 PDF for a finished book. Production
    // now renders for real too (api/render-book-html.py + pdf.mjs) and emails
    // the finished PDF to whoever ordered the book — see renderPdfServerless
    // in jobs.mjs. Locally this still goes through Python + Playwright direct.
    const pdfMatch = p.match(/^\/books\/([0-9a-f-]{8,})\/pdf$/);
    if (req.method === "POST" && pdfMatch) {
      const row = await db.getBook(pdfMatch[1]);
      if (!row) return send(res, 404, { error: "not found" });
      if (!row.pages) return send(res, 400, { error: "book not generated yet" });
      // The internal call to api/render-book-html MUST reuse the host this
      // request actually arrived on (the real custom domain), not
      // process.env.VERCEL_URL — VERCEL_URL always resolves to the
      // per-deployment *.vercel.app hostname, which Vercel's Deployment
      // Protection (SSO) blocks even in production; only custom domains are
      // exempt. Verified live 2026-08-09: calling the production endpoint
      // failed with "Protected deployment" until this fix.
      const scheme = req.headers["x-forwarded-proto"] || "https";
      const requestOrigin = req.headers.host ? `${scheme}://${req.headers.host}` : null;
      const url = await renderPdf(row.id, { origin: requestOrigin });
      return send(res, 200, { url });
    }

    if (req.method === "POST" && p === "/checkout") {
      const b = await readBody(req);
      // World of Books (£10) ties access to an account from the start — no
      // anonymous purchases. The £3 single-book tier stays guest-friendly.
      let worldUser = null;
      if (b.kind === "world") {
        worldUser = await verifyUser(req);
        if (!worldUser) return send(res, 401, { error: "Sign in to join the World of Books." });
      }
      // "Change the story idea" after a content rejection: the restored
      // credit from the rejected book pays for the new one — no Stripe, no
      // second charge. The transfer only succeeds if the source book really
      // holds a restored credit, so this can't be used to mint free books.
      if (b.kind === "book" && b.book_id && b.credit_from) {
        const source = await db.getBook(b.credit_from);
        if (!source || source.status !== "content_rejected") {
          return send(res, 400, { error: "No restored credit available on that book." });
        }
        const moved = await db.transferCredit(b.credit_from, b.book_id);
        if (!moved) return send(res, 402, { error: "That credit has already been used." });
        const book = await db.getBook(b.book_id);
        if (book && ["awaiting_payment", "failed"].includes(book.status)) startGeneration(b.book_id);
        return send(res, 200, { free: true, kind: "book", book_id: b.book_id, credit_used: true });
      }
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
            email: b.email || worldUser.email, kind: "world", user_id: worldUser.id,
            stripe_session_id: `voucher_world_${Date.now()}`,
            amount_pence: 0, status: "paid",
          });
          return send(res, 200, { free: true, kind: "world" });
        }
      }
      if (supplied) return send(res, 400, { error: "That code is not valid." });
      const session = await createCheckout({
        kind: b.kind, bookId: b.book_id, email: b.email || worldUser?.email, origin,
      });
      await db.insertOrder({
        book_id: b.book_id || null,
        email: b.email || worldUser?.email || null,
        kind: b.kind,
        user_id: b.kind === "world" ? worldUser.id : (b.user_id || null),
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
      if (IS_SERVERLESS) return send(res, 404, { error: "not available in production" });
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
        const user = await verifyUser(req);
        if (!user) return send(res, 401, { error: "Sign in to join the World of Books." });
        await db.insertOrder({
          email: b.email || user.email, kind: "world", user_id: user.id,
          stripe_session_id: `dev_world_${Date.now()}`,
          amount_pence: 0, status: "paid",
        });
        return send(res, 200, { ok: true });
      }
      return send(res, 400, { error: "bad kind" });
    }

    // Human sign-off at the text→image boundary (Lynden 2026-08-16): the book
    // rests at awaiting_imagery_approval with its full imagery contract in
    // progress.contract; this is the act that authorises image spend.
    if (req.method === "POST" && p === "/approve-imagery") {
      const b = await readBody(req);
      const book = await db.getBook(b.book_id);
      if (!book) return send(res, 404, { error: "not found" });
      if (book.status !== "awaiting_imagery_approval") {
        return send(res, 409, { error: `book is ${book.status}, not awaiting_imagery_approval` });
      }
      const job = book.progress?.job;
      if (!job) return send(res, 500, { error: "no job state on the book" });
      job.imageryApproved = true;
      // A reviewer's tweaks to per-page notes ride along as repair-style
      // corrections the scene prompts pick up (optional).
      if (b.notes && typeof b.notes === "object") job.repairNotes = b.notes;
      await db.updateBook(b.book_id, {
        status: "generating",
        progress: { ...(book.progress || {}), step: "hero", message: "Imagery approved — generating...", job },
      });
      startGeneration(b.book_id);
      return send(res, 200, { ok: true });
    }

    // Targeted repair: regenerate only the named pages/cover with their fault
    // notes, then re-run review + assembly. Body: { book_id, scenes: {"5":
    // "the figs must be gone"}, cover: "no painted lettering" }.
    if (req.method === "POST" && p === "/repair") {
      const b = await readBody(req);
      try {
        const r = await repairBook(b.book_id, { scenes: b.scenes || {}, cover: b.cover || null });
        return send(res, 200, { ok: true, ...r });
      } catch (e) {
        return send(res, 400, { error: e.message });
      }
    }

    // Cron sweeper (vercel.json, every 10 min): prod generation is driven by
    // the customer's browser, so a closed tab strands a paid book at
    // "generating" forever. The sweep adopts any book whose last step is
    // stale and drives it forward within this invocation's time budget —
    // nobody's book depends on their tab staying open (Lynden 2026-08-23,
    // "customers will be waiting"). Safe alongside a live tab: the per-step
    // lock returns "busy" instead of double-running.
    if (req.method === "GET" && p === "/sweep") {
      const stale = await db.staleGeneratingBooks(10);
      const deadline = Date.now() + 240_000;
      const swept = [];
      for (const b of stale.slice(0, 5)) {
        let steps = 0, last = null;
        while (Date.now() < deadline && steps < 40) {
          let r;
          try { r = await runNextStep(b.id); } catch (e) { r = { done: true, step: "error", error: String(e.message || e).slice(0, 120) }; }
          steps++; last = r;
          // A swept book that finishes must deliver too — same at-the-finish
          // hook as the /step path (the customer's tab is gone; nobody else
          // will press the button).
          if (r.step === "assemble" && r.status !== "failed") {
            const scheme = req.headers["x-forwarded-proto"] || "https";
            const requestOrigin = req.headers.host ? `${scheme}://${req.headers.host}` : null;
            try { await renderPdf(b.id, { origin: requestOrigin }); }
            catch (e) { console.warn(`[forge] sweep delivery render failed for ${b.id}:`, e.message); }
          }
          if (r.done || r.step === "busy") break;
        }
        swept.push({ id: b.id, steps, last: last?.step, status: last?.status || null });
        if (Date.now() >= deadline) break;
      }
      return send(res, 200, { checked: stale.length, swept });
    }

    if (req.method === "POST" && p === "/retry") {
      const b = await readBody(req);
      const book = await db.getBook(b.book_id);
      if (!book) return send(res, 404, { error: "not found" });
      if (book.status === "failed") {
        startGeneration(b.book_id);
      } else if (["paused_provider_credit", "paused_budget", "needs_review"].includes(book.status)) {
        // needs_review resume: a human has edited the story (or decided it is
        // fine) — clear the pending gate state so the machine re-judges the
        // manuscript fresh instead of instantly re-stopping on the same notes.
        if (book.status === "needs_review" && book.progress?.job) {
          const job = book.progress.job;
          job.pendingEditorNotes = null;
          job.exactPatchUsed = false;
          if ((job.sceneUrls || []).length) {
            // THE BOOK IS ALREADY PAINTED — resume at the gate that stopped
            // it, never at the story. Re-opening the story gate here rewrote
            // a finished book's manuscript into a different story while its
            // pictures stayed with the old one, and cost $1.49 to do it
            // (Nuh's "Cat Prints" became a moth-and-web story, 2026-08-25).
            job.reviewDone = false;
            job.editorTextRepairUsed = false;
          } else {
            // No images yet: the cheap text gates may safely run again.
            job.storyEditRequests = 0;
            job.qaDone = false;
            job.storyGateDone = false;
          }
          await db.updateBook(b.book_id, { status: "generating", progress: { ...(book.progress || {}), job } });
        }
        // Resume from the last checkpoint — same provider, same references,
        // nothing regenerated. A retry on paused_budget is the human act
        // that authorises one more budget unit (automation never raises it).
        const job = book.progress?.job || null;
        if (job && book.status === "paused_budget") {
          job.capUsd = Number((job.cost + MAX_BOOK_SPEND_USD).toFixed(2));
          await db.updateBook(b.book_id, { progress: { ...(book.progress || {}), job } });
        }
        startGeneration(b.book_id);
      } else if (book.status === "content_rejected") {
        // "Try the same idea again": the restored credit is reclaimed and the
        // book regenerates FROM SCRATCH (a fresh story attempt at the same
        // idea). The rejected drafts and editor reports stay archived on the
        // row for debugging.
        const reclaimed = await db.reclaimCreditForBook(b.book_id);
        if (!reclaimed) return send(res, 402, { error: "No restored credit found for this book." });
        // The rejected run is already archived durably in rejected_runs
        // (written at rejection time by runNextStep) — progress can be reset
        // clean for the fresh attempt.
        await db.updateBook(b.book_id, {
          progress: { step: "story", message: "Starting a fresh attempt at the same idea...", pct: 0, job: null },
        });
        startGeneration(b.book_id);
      }
      return send(res, 200, { ok: true });
    }

    // Link a created book to the signed-in account — the optional "Add to my
    // account" action after a book is ready. Requires a valid session so a
    // book can only ever be saved to the account that asked for it.
    const saveMatch = p.match(/^\/books\/([0-9a-f-]{8,})\/save$/);
    if (req.method === "POST" && saveMatch) {
      const user = await verifyUser(req);
      if (!user) return send(res, 401, { error: "Sign in to add this book to your account." });
      const book = await db.getBook(saveMatch[1]);
      if (!book) return send(res, 404, { error: "not found" });
      const updated = await db.updateBook(saveMatch[1], { user_id: user.id });
      return send(res, 200, { ok: true, book: updated });
    }

    if (req.method === "GET" && p === "/world") {
      const email = url.searchParams.get("email");
      const user = await verifyUser(req);
      const access = await db.hasWorldAccess({ email, userId: user?.id });
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
