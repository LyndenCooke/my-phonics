// ---------------------------------------------------------------------------
// Renderer — WorksheetSpec -> full HTML -> A4 PDF (+ PNG preview) via the
// worksheet-engine's Puppeteer install (no second Chromium download).
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { REPO_ROOT, FORGE_ROOT, fileUrl, INK } from './design/tokens.mjs';
import { getSubject, themeForSpec, pillsForSpec, footerCaptionFor } from './design/subjects.mjs';
import { baseCSS } from './design/css.mjs';
import { renderBlock, CATALOG } from './blocks/blocks.mjs';
import { rng, hasClipart, clipartPath } from './content/content.mjs';

const requireEngine = createRequire(path.join(REPO_ROOT, 'worksheet-engine', 'package.json'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function headerHTML(spec, theme) {
  const tileWord = spec.mascot && hasClipart(spec.mascot) ? spec.mascot : null;
  // The tile shows the grapheme on a phonics sheet; on any other subject it
  // shows the sheet's own badge (e.g. "×7", "3D") — never a stray "abc".
  const badge = spec.grapheme ?? spec.badge ?? '';
  const glyphMm = badge.length <= 1 ? 11 : badge.length === 2 ? 9 : badge.length === 3 ? 6.5 : 5;
  const tile = tileWord
    ? `<img src="${fileUrl(clipartPath(tileWord))}"/>`
    : badge ? `<span class="glyph" style="font-size:${glyphMm}mm">${esc(badge)}</span>` : '';
  const pills = pillsForSpec(spec).map((p) => `<div class="pill">${esc(p)}</div>`).join('');
  return `<div class="header">
    ${tile ? `<div class="tile">${tile}</div>` : ''}
    <div class="titles">
      <div class="title">${esc(spec.title)}</div>
      ${spec.subtitle ? `<div class="subtitle">${esc(spec.subtitle)}</div>` : ''}
    </div>
    <div class="pills">${pills}</div>
  </div>
  <div class="namebar"><span>Name</span><span class="fill"></span><span>Date</span><span class="datefill"></span></div>`;
}

function footerHTML(spec) {
  const subject = getSubject(spec.subject);
  return `<div class="footer">
    <div class="brand"><b>${esc(subject.brand)}</b> &middot; ${esc(subject.tagline)}</div>
    <div class="caption">${esc(spec.footer ?? footerCaptionFor(spec))}</div>
  </div>`;
}

export function specToHTML(spec) {
  const theme = themeForSpec(spec);
  const rand = rng(spec.seed ?? 42);
  let n = 0;
  const ctx = { theme, level: spec.level, grapheme: spec.grapheme ?? null, rand, nextNum: () => ++n };
  const blocksHtml = spec.blocks.map((b) => renderBlock(b, ctx)).join('');
  // Set by the fit loop when a sheet ends short and nothing else will fit: the
  // last panel stretches to the footer, so the leftover space sits INSIDE the
  // activity instead of below it (a finished page, not a truncated one).
  // The footer's `margin-top:auto` normally soaks up the free space, and auto
  // margins are resolved BEFORE flex-grow — so it has to be released first or
  // the panel has nothing left to grow into.
  // `:last-of-type` would match the footer (both are divs) — select the panel
  // sitting immediately above it instead. The footer's `margin-top:auto` also
  // has to be released: auto margins eat free space before flex-grow sees it.
  const stretch = spec.stretchLast ? '.page > .panel:has(+ .footer){flex:1 0 auto}.page > .footer{margin-top:0}' : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseCSS(theme)}${stretch}</style></head>
<body><div class="page">
${headerHTML(spec, theme)}
${blocksHtml}
${footerHTML(spec)}
</div></body></html>`;
}

let _browser;
export async function getBrowser() {
  if (!_browser) {
    const puppeteer = requireEngine('puppeteer');
    _browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'], timeout: 120000 });
  }
  return _browser;
}
export async function closeBrowser() {
  const b = _browser;
  _browser = null; // clear first — a crashed browser's close() can throw
  if (b) { try { await b.close(); } catch { /* already dead */ } }
}

/**
 * Render a spec to out/<slug>.pdf (+ .png preview + .html debug).
 * Returns { pdf, png, html, overflow } — overflow is the mm the content spills
 * past the page (0 = fits), measured in-browser for the QA loop.
 */
export async function renderSpec(spec, outDir = path.join(FORGE_ROOT, 'output')) {
  fs.mkdirSync(outDir, { recursive: true });
  const slug = (spec.slug ?? spec.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const html = specToHTML(spec);
  const htmlPath = path.join(outDir, `${slug}.html`);
  fs.writeFileSync(htmlPath, html);

  try {
    return await renderHtml(htmlPath, outDir, slug);
  } catch {
    // The shared Chromium goes stale in long-lived processes (the dev server
    // runs for hours) — relaunch once and retry before giving up.
    await closeBrowser();
    return await renderHtml(htmlPath, outDir, slug);
  }
}

async function renderHtml(htmlPath, outDir, slug) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.goto(fileUrl(htmlPath), { waitUntil: 'networkidle0' });
    await page.evaluateHandle('document.fonts.ready');
    const { overflow, slack } = await page.evaluate(() => {
      const p = document.querySelector('.page');
      const mm = (px) => px * 25.4 / 96;
      const pageBottom = p.getBoundingClientRect().bottom;
      let spill = 0;
      for (const el of p.querySelectorAll('*')) {
        spill = Math.max(spill, el.getBoundingClientRect().bottom - pageBottom);
      }
      // Dead space = the gap between the last activity panel and the footer.
      // The trim loop can only ever remove, so without this a page that was
      // over-trimmed (or composed from hot estimates) silently ships half-empty.
      const panels = p.querySelectorAll('.panel');
      const last = panels[panels.length - 1];
      const footer = p.querySelector('.footer');
      const gap = last && footer ? footer.getBoundingClientRect().top - last.getBoundingClientRect().bottom : 0;
      const r1 = (v) => Math.round(mm(v) * 10) / 10;
      return { overflow: r1(spill), slack: r1(Math.max(0, gap)) };
    });
    const pdfPath = path.join(outDir, `${slug}.pdf`);
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, preferCSSPageSize: true });
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1.5 });
    const pngPath = path.join(outDir, `${slug}.png`);
    await page.screenshot({ path: pngPath, fullPage: false });
    return { pdf: pdfPath, png: pngPath, html: htmlPath, overflow, slack };
  } finally {
    await page.close();
  }
}

/** Dead space we're willing to leave at the foot of a sheet before growing.
 *  ~20mm is about where a sheet starts to read as unfinished rather than airy. */
const SLACK_LIMIT = 20;

/**
 * Render with an auto-fit loop, in both directions:
 *  - overflow → trim one item from the trimmable block with the tallest
 *    per-item cost (respecting minimums); as a last resort drop the last block.
 *  - too much dead space → append a pre-built spare block from `spec.spare`
 *    (the planner stocks these) and re-render. If growing spills, we fall back
 *    to the last page that fitted.
 * Mutates a COPY of the spec.
 */
export async function renderFitted(spec, outDir) {
  const pristine = structuredClone(spec); // untrimmed blocks, by type
  let current = structuredClone(spec);
  let lastGood = null; // spec that fitted, kept in case a grow overflows
  let grew = 0;
  for (let attempt = 0; attempt < 16; attempt++) {
    const result = await renderSpec(current, outDir);

    if (result.overflow <= 0.5) {
      const spare = current.spare ?? [];
      if (result.slack > SLACK_LIMIT && spare.length && grew < 2) {
        lastGood = structuredClone(current);
        current.blocks.push(spare.shift());
        current.spare = spare;
        grew++;
        continue;
      }
      // Nothing left that fits — stretch the last panel over the gap instead.
      if (result.slack > SLACK_LIMIT && !current.stretchLast) {
        current.stretchLast = true;
        continue;
      }
      return { ...result, spec: current, trimmed: attempt > 0 };
    }

    // A grow caused the spill — the page before it was good, so go back to it.
    if (lastGood) {
      current = lastGood;
      lastGood = null;
      grew = 99; // don't try to grow again
      continue;
    }

    // Pick the trimmable block with the tallest per-item cost that can spare one.
    const candidates = current.blocks
      .map((b, i) => ({ b, i, cat: CATALOG[b.type] }))
      .filter(({ b, cat }) => cat?.trim && (b[cat.trim]?.length ?? 0) > (cat.minItems ?? 1))
      .sort((a, z) => (z.cat.perItem ?? 0) - (a.cat.perItem ?? 0));

    if (candidates.length) {
      const { b, cat } = candidates[0];
      // Grid blocks lose a whole row at a time, so the last row is never a
      // stray card or two.
      const step = cat.perRow && b[cat.trim].length % cat.perRow === 0 ? cat.perRow : 1;
      b[cat.trim] = b[cat.trim].slice(0, Math.max(cat.minItems ?? 1, b[cat.trim].length - step));
      // Paired arrays must shrink with their partner, or the sheet shows more
      // pictures than words / more bank words than gaps.
      if (b.type === 'cloze_sentences' && b.bank.length > b.sentences.length) b.bank = b.bank.slice(0, b.sentences.length);
      if (b.type === 'match_word_picture') b.scrambled = b.scrambled.filter((w) => b.words.includes(w));
    } else if (current.blocks.length > 1) {
      // Dropping a whole block frees a lot of height at once, so hand back the
      // items we shaved off the survivors while fighting for it — otherwise the
      // sheet ships both a block short AND half-empty.
      current.blocks = current.blocks.slice(0, -1).map((b) => {
        const full = pristine.blocks.find((p) => p.type === b.type);
        return full ? structuredClone(full) : b;
      });
    } else {
      return { ...(await renderSpec(current, outDir)), spec: current, trimmed: true };
    }
  }
  return { ...(await renderSpec(current, outDir)), spec: current, trimmed: true };
}
