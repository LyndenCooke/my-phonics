import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:5181';

const browser = await chromium.launch();

async function shot(url, name, viewport = { width: 414, height: 900 }, onPage) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log(`[${name}] pageerror:`, e.message));
  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`[${name}] console.error:`, msg.text());
  });
  await page.goto(`${BASE}${url}`, { waitUntil: 'commit', timeout: 60000 });
  await page.waitForLoadState('domcontentloaded', { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2500);
  if (onPage) await onPage(page);
  const out = `scripts/_shot-${name}.png`;
  await page.screenshot({ path: out, fullPage: false });
  console.log('wrote', out);
  await ctx.close();
}

// 1. Landing hero
await shot('/', 'landing', { width: 1280, height: 900 });

// 2. /assessment chooser — two big buttons
await shot('/assessment', 'assessment-choose');

// 3. /assessment after picking 3-min — should be Assessment.tsx onboarding (DOB)
await shot('/assessment', 'assessment-3min-onboarding', { width: 414, height: 900 }, async (page) => {
  await page.getByText('3-minute check').first().click();
  await page.waitForTimeout(800);
});

// 4. /free-book picker (existing)
await shot('/free-book', 'free-book-pick');

await browser.close();
