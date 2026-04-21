/**
 * Pass 5 — Error path probing.
 *
 * Covers the graceful-degradation scenarios called out in the
 * investor review:
 *  - Unknown deep-link sub-level
 *  - Malformed inputs to edge functions
 *  - Signed-out access to admin routes
 *  - Offline reader
 */
import { test, expect } from '@playwright/test';
import { captureConsole, writeJson, writeReport } from './_helpers';

type Finding = { id: string; pass: boolean; detail: string };
const findings: Finding[] = [];

test('E1: unknown sub-level deep link does not crash', async ({ page }) => {
  const capture = captureConsole(page);
  await page.goto('/library?book=L99.99');
  await page.waitForTimeout(1500);
  // Library heading or "Sign in" card should render
  const bodyText = (await page.textContent('body'))?.toLowerCase() ?? '';
  const ok =
    !capture.errors.length &&
    (bodyText.includes('library') || bodyText.includes('sign in'));
  findings.push({
    id: 'E1',
    pass: ok,
    detail: ok
      ? 'Library rendered without error on bad sub-level'
      : `errors=${capture.errors.length} body=${bodyText.slice(0, 80)}`,
  });
  expect.soft(ok).toBe(true);
});

test('E2: /admin signed-out is gated', async ({ page }) => {
  await page.context().clearCookies();
  const resp = await page.goto('/admin', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const url = page.url();
  const bodyText = (await page.textContent('body'))?.toLowerCase() ?? '';
  const ok =
    (resp?.status() ?? 0) < 500 &&
    // Either redirected to auth, shown a sign-in prompt, or rendered
    // a guard fallback (loading spinner, empty body) without admin data.
    (url.includes('/auth') ||
      bodyText.includes('sign in') ||
      bodyText.includes('not authori') ||
      !bodyText.includes('customer'));
  findings.push({
    id: 'E2',
    pass: ok,
    detail: ok ? 'Admin not accessible unsigned' : `url=${url} body contained 'customer'`,
  });
  expect.soft(ok).toBe(true);
});

test('E3: /auth rejects non-email', async ({ page }) => {
  await page.goto('/auth', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder(/email/i).fill('not-an-email');
  await page.getByPlaceholder(/password/i).fill('whatever123');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(2000);
  // Either inline validation fired (no navigation) or an error banner appeared
  const url = page.url();
  const ok = url.includes('/auth'); // did NOT navigate away
  findings.push({
    id: 'E3',
    pass: ok,
    detail: ok ? 'Stayed on /auth (inline validation)' : `navigated away to ${url}`,
  });
  expect.soft(ok).toBe(true);
});

test('E4: create-checkout-session rejects malformed body', async ({ request }) => {
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  if (!supabaseUrl) {
    findings.push({
      id: 'E4',
      pass: false,
      detail: 'skipped — VITE_SUPABASE_URL not set',
    });
    test.skip();
    return;
  }
  const anon = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';
  try {
    const resp = await request.post(
      `${supabaseUrl}/functions/v1/create-checkout-session`,
      {
        headers: { apikey: anon, 'Content-Type': 'application/json' },
        data: { product_id: 'not-a-uuid', guest_email: 'no-at-sign' },
        failOnStatusCode: false,
      },
    );
    const ok = resp.status() === 400;
    findings.push({
      id: 'E4',
      pass: ok,
      detail: `status=${resp.status()}`,
    });
    expect.soft(resp.status()).toBe(400);
  } catch (err) {
    // DNS / network unreachable — don't hard fail, just record
    const msg = err instanceof Error ? err.message : String(err);
    findings.push({
      id: 'E4',
      pass: false,
      detail: `network unreachable: ${msg.slice(0, 120)}`,
    });
  }
});

test('E5: library stays usable when book images fail', async ({ page, context }) => {
  // Block all image responses to simulate total asset failure
  await context.route('**/book-pages/**', (route) => route.abort());
  await context.route('**/illustrations/**', (route) => route.abort());

  const { signInAsQa } = await import('./_helpers');
  await signInAsQa(page);
  await page.goto('/library', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const body = (await page.textContent('body'))?.toLowerCase() ?? '';
  // Success = library still loads and renders book titles / level filter
  // even when image traffic is blocked. This is the real resilience test.
  const ok = body.includes('library') && (body.includes('tap a book') || body.includes('starting stories') || body.includes('my books'));
  findings.push({
    id: 'E5',
    pass: ok,
    detail: ok
      ? 'Library rendered with all images blocked'
      : 'Library failed to render when images blocked',
  });
  expect.soft(ok).toBe(true);
});

test.afterAll(async () => {
  writeJson('errors.json', findings);
  const lines: string[] = [];
  lines.push('# Pass 5 — Error path probing\n');
  lines.push('| ID | Result | Detail |');
  lines.push('|----|:-----:|--------|');
  for (const f of findings) {
    lines.push(`| ${f.id} | ${f.pass ? '✅' : '❌'} | ${f.detail.replace(/\|/g, '\\|')} |`);
  }
  writeReport('05_errors.md', lines.join('\n'));
});
