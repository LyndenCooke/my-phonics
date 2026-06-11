// ---------------------------------------------------------------------------
// PDF generator — renders each print route to a print-accurate A4 PDF with
// Puppeteer (headless Chrome print). This is the most faithful route for our
// needs: real web fonts (the dotted tracing font), CSS clipart layout and
// exact @page sizing all render exactly as Chrome shows them. @react-pdf was
// rejected — it can't embed the dashed font or do this layout.
//
// Usage:
//   1) start the app:   npm run dev   (or: npm run build && npm start)
//   2) in another shell: npm run pdf            -> all sheets
//                        npm run pdf tap-tap-tap trace-sounds   -> one sheet
// Output: ./output/<book>__<sheet>.pdf
// ---------------------------------------------------------------------------

import puppeteer from 'puppeteer';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const OUT = path.join(process.cwd(), 'output');

async function sheetList() {
  const [book, sheet] = process.argv.slice(2);
  if (book && sheet) return [{ book, sheet }];
  const res = await fetch(`${BASE}/api/sheets`);
  if (!res.ok) throw new Error(`Could not fetch ${BASE}/api/sheets — is the app running?`);
  return res.json();
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const sheets = await sheetList();
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

  for (const { book, sheet } of sheets) {
    const page = await browser.newPage();
    const url = `${BASE}/print/${book}/${sheet}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready); // wait for fonts to load
    const file = path.join(OUT, `${book}__${sheet}.pdf`);
    await page.pdf({ path: file, format: 'A4', printBackground: true, preferCSSPageSize: true });
    await page.close();
    console.log(`✓ ${file}`);
  }

  await browser.close();
  console.log(`\nDone — ${sheets.length} sheet(s) in ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
