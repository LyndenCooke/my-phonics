// Serverless PDF rendering — the Node half of the split described in
// api/render-book-html.py's docstring. Playwright (the local studio-machine
// renderer's PDF backend) does not run on Vercel; puppeteer-core +
// @sparticuz/chromium does. This module ONLY does HTML -> PDF; building that
// HTML is the Python function's job, so the same Jinja2 template logic that
// produces every other MyPhonicsBooks PDF also produces this one — nothing
// about the book_v2 template itself is reimplemented here.
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

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
    // Same reasoning as the Python side's set_content(..., "domcontentloaded"):
    // everything (images, fonts) is embedded as a data URI, so there is no
    // real network activity to wait for past the initial load.
    await page.goto(htmlUrl, { waitUntil: "domcontentloaded", timeout: 120000 });
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
