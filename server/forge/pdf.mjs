// Serverless PDF rendering — the Node half of the split described in
// api/render-book-html.py's docstring. Playwright (the local studio-machine
// renderer's PDF backend) does not run on Vercel; puppeteer-core +
// @sparticuz/chromium does. This module ONLY does HTML -> PDF; building that
// HTML is the Python function's job, so the same Jinja2 template logic that
// produces every other MyPhonicsBooks PDF also produces this one — nothing
// about the book_v2 template itself is reimplemented here.
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

// Deterministic page count of a rendered PDF, no dependencies: count page
// objects, cross-checked against the page tree's /Count. Chromium's PDF
// output keeps object dicts uncompressed, so both are reliably visible.
export function pdfPageCount(buf) {
  const s = buf.toString("latin1");
  const pageObjs = (s.match(/\/Type\s*\/Page[^s]/g) || []).length;
  const counts = [...s.matchAll(/\/Count\s+(\d+)/g)].map((m) => Number(m[1]));
  const treeCount = counts.length ? Math.max(...counts) : 0;
  return Math.max(pageObjs, treeCount);
}

// A4 2-up saddle-stitch imposition of an A5 book — the "print at home"
// version. Mirrors scripts/make_printable_booklet.py's saddle_stitch_order
// EXACTLY (sheet i: front = (n-2i, 1+2i), back = (2+2i, n-1-2i)): each
// output page is one side of one A4 landscape sheet holding two A5 pages;
// a parent prints double-sided, flip on the LONG edge, folds, staples.
export async function imposeA4Booklet(a5Buf) {
  const { PDFDocument } = await import("pdf-lib");
  const src = await PDFDocument.load(a5Buf);
  const n = src.getPageCount();
  if (n % 4 !== 0) throw new Error(`booklet imposition needs a multiple of 4 pages, got ${n}`);
  const pairs = [];
  for (let i = 0; i < n / 4; i++) {
    pairs.push([n - 2 * i, 1 + 2 * i]);
    pairs.push([2 + 2 * i, n - 1 - 2 * i]);
  }
  const out = await PDFDocument.create();
  const A4_W = 841.89, A4_H = 595.28; // landscape A4 in points = two portrait A5s
  const embedded = await out.embedPdf(src, [...new Set(pairs.flat())].map((p) => p - 1))
    .then((pages) => {
      const uniq = [...new Set(pairs.flat())];
      const map = {};
      uniq.forEach((p, i) => { map[p] = pages[i]; });
      return map;
    });
  for (const [left, right] of pairs) {
    const page = out.addPage([A4_W, A4_H]);
    for (const [num, x] of [[left, 0], [right, A4_W / 2]]) {
      const ep = embedded[num];
      // Scale each A5 page to exactly half the sheet, preserving aspect.
      const s = Math.min((A4_W / 2) / ep.width, A4_H / ep.height);
      page.drawPage(ep, { x: x + ((A4_W / 2) - ep.width * s) / 2, y: (A4_H - ep.height * s) / 2, xScale: s, yScale: s });
    }
  }
  return Buffer.from(await out.save());
}

// Mirrors PlaywrightPDFGenerator.generate() in myphonics_books/core/pdf_generator.py
// EXACTLY — A5, zero margin, print backgrounds, CSS page size wins. Any
// drift here means the serverless PDF looks different from the studio one.
export async function htmlUrlToPdf(htmlUrl) {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
    // puppeteer-core's launch() defaults to a 30s timeout waiting for the
    // browser's websocket endpoint to come up. Live-tested and confirmed:
    // that's not enough on a cold serverless invocation — @sparticuz/chromium
    // has to decompress its ~50MB brotli-packed binary to /tmp first, and
    // the launch timed out (TimeoutError, puppeteer's util.js) before that
    // finished. Function maxDuration is 300s (vercel.json), so there's
    // budget to allow much longer here.
    timeout: 120000,
    // Separate from the above: this governs individual CDP protocol command
    // timeouts (Puppeteer's own error points here specifically: "Increase
    // the 'protocolTimeout' setting"). Set generously alongside it rather
    // than found the hard way a third time.
    protocolTimeout: 120000,
  });
  try {
    const page = await browser.newPage();
    // Blanket default for anything not given an explicit timeout above —
    // Puppeteer scatters its own 30s defaults across launch(), goto(), AND
    // pdf() independently (each one had to be found live, one at a time);
    // this is a safety net against a fourth one surfacing the same way.
    page.setDefaultTimeout(120000);
    // Fetch the HTML text ourselves and use setContent() rather than
    // page.goto(htmlUrl) — Supabase Storage serves the uploaded book.html as
    // Content-Type: text/plain regardless of what content-type was sent on
    // upload (reproduced directly against the Storage API; not an upload
    // bug, a serving quirk), and with X-Content-Type-Options: nosniff set,
    // Chromium trusts that header and renders the literal HTML source as
    // text instead of parsing it — the 2026-08-10 production PDF came back
    // as 2728 pages of visible "<!DOCTYPE html>..." source text. setContent()
    // sidesteps the whole problem: no navigation, no server content-type
    // involved at all, matching the local Playwright pipeline's
    // set_content(..., "domcontentloaded") exactly.
    const htmlRes = await fetch(htmlUrl);
    if (!htmlRes.ok) throw new Error(`failed to fetch rendered HTML: ${htmlRes.status}`);
    const html = await htmlRes.text();
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 120000 });
    await page.evaluate(() => document.fonts.ready);
    await new Promise((resolve) => setTimeout(resolve, 200));
    const buf = await page.pdf({
      width: "148mm",
      height: "210mm",
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      printBackground: true,
      preferCSSPageSize: true,
      // page.pdf() has ITS OWN 30s default timeout, entirely separate from
      // launch()'s and goto()'s — easy to miss since neither of those two
      // fixing first actually touched this one. Live-tested: this heavy,
      // image-dense multi-page HTML genuinely takes longer than 30s to
      // rasterize to PDF.
      timeout: 120000,
    });
    return Buffer.from(buf);
  } finally {
    await browser.close();
  }
}
