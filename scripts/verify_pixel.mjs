import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:8080';
const FUNNEL = `${BASE}/f/wrong-books`;
const TEST_EMAIL = `pixel-test+${Date.now()}@myphonicsbooks.co.uk`;

const pixelHits = [];

function classifyPixel(req) {
  try {
    const u = new URL(req.url());
    if (!u.hostname.endsWith('facebook.com')) return null;
    if (!u.pathname.startsWith('/tr')) return null;
    // GET pixel beacon: params are in the URL
    let ev = u.searchParams.get('ev');
    let id = u.searchParams.get('id');
    let contentName = u.searchParams.get('cd[content_name]');
    // POST pixel (advanced matching): params are in the form body
    if (!ev && req.method() === 'POST') {
      const body = req.postData() ?? '';
      const params = new URLSearchParams(body);
      ev = params.get('ev');
      id = params.get('id');
      contentName = params.get('cd[content_name]');
    }
    return { ev: ev ?? '(none)', id: id ?? '(none)', cd_content_name: contentName, method: req.method() };
  } catch {
    return null;
  }
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
});
// Strip the automation tell so fbevents.js doesn't silently drop events
await ctx.addInitScript(() => {
  Object.defineProperty(navigator, 'webdriver', { get: () => false });
});
const page = await ctx.newPage();

page.on('request', (req) => {
  const url = req.url();
  if (url.includes('facebook') || url.includes('fbevents')) {
    console.log(`[fb-req] ${req.method()} ${url.slice(0, 160)}`);
  }
  if (url.includes('supabase') && req.method() !== 'GET') {
    console.log(`[supabase] ${req.method()} ${url.slice(0, 140)}`);
  }
  const hit = classifyPixel(req);
  if (hit) {
    pixelHits.push({ when: new Date().toISOString(), ...hit });
    console.log(
      `[pixel]  ${hit.method.padEnd(4)} ${String(hit.ev).padEnd(12)} ` +
      `id=${hit.id} content_name=${hit.cd_content_name ?? '-'}`,
    );
  }
});

page.on('response', async (res) => {
  const url = res.url();
  if (url.includes('supabase') && res.request().method() !== 'GET') {
    console.log(`[supabase-res] ${res.status()} ${url.slice(0, 120)}`);
    if (res.status() >= 400) {
      const body = await res.text().catch(() => '');
      console.log(`   body: ${body.slice(0, 300)}`);
    }
  }
  if (url.includes('signals/config')) {
    const body = await res.text().catch(() => '');
    console.log(`[fb-config-res] ${res.status()}`);
    console.log(`   body[0..600]: ${body.slice(0, 600)}`);
  }
});

page.on('console', (msg) => {
  const t = msg.type();
  if (t === 'error' || t === 'warning') console.log(`[console.${t}]`, msg.text());
});

page.on('requestfailed', (req) => {
  if (req.url().includes('facebook') || req.url().includes('connect.facebook'))
    console.log('[req-failed]', req.url(), req.failure()?.errorText);
});

console.log(`→ loading ${FUNNEL}`);
await page.goto(FUNNEL, { waitUntil: 'networkidle' });

console.log('→ waiting 1.5s for PageView to fire');
await page.waitForTimeout(1500);

const pixelState = await page.evaluate(() => ({
  pixelId: window.__META_PIXEL_ID ?? null,
  fbqType: typeof window.fbq,
  fbqQueue: window.fbq?.queue?.length ?? null,
  fbqLoaded: window.fbq?.loaded ?? null,
}));
console.log('[diag] pixel state:', pixelState);

// Manually trigger a tracking event and watch for network
console.log('→ manually calling fbq("track", "ViewContent") to isolate the form path');
await page.evaluate(() => window.fbq && window.fbq('track', 'ViewContent', { manual: 1 }));
await page.waitForTimeout(2000);
const webdriver = await page.evaluate(() => navigator.webdriver);
console.log('[diag] navigator.webdriver =', webdriver);

const beforeSubmit = pixelHits.filter((h) => h.ev === 'PageView').length;
console.log(`→ PageView events so far: ${beforeSubmit}`);

console.log('→ filling form');
await page.getByPlaceholder("Child's first name").fill('TestKid');
await page.getByPlaceholder('Your email address').fill(TEST_EMAIL);
await page.getByRole('checkbox').check();

console.log(`→ submitting with email ${TEST_EMAIL}`);
await page.getByRole('button', { name: /find their level/i }).click();

console.log('→ waiting 5s for Lead event');
await page.waitForTimeout(5000);

const errEl = await page.locator('.text-destructive').first().textContent().catch(() => null);
if (errEl) console.log('[diag] form-error displayed:', errEl);
const stillOnFunnel = await page.evaluate(() => location.pathname);
console.log('[diag] current path:', stillOnFunnel);

const leads = pixelHits.filter((h) => h.ev === 'Lead');
const pageViews = pixelHits.filter((h) => h.ev === 'PageView');

console.log('\n========== RESULT ==========');
console.log(`PageView hits: ${pageViews.length}`);
console.log(`Lead hits:     ${leads.length}`);
if (leads.length) {
  console.log(`Lead content_name: ${leads[0].cd_content_name}`);
  console.log(`Pixel ID seen:     ${leads[0].id}`);
}
const ok = pageViews.length >= 1 && leads.length >= 1;
console.log(`Verdict: ${ok ? 'PASS — pixel fires end-to-end' : 'FAIL'}`);

await browser.close();
process.exit(ok ? 0 : 1);
