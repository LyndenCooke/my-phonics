/**
 * Pass 1 — Route coverage.
 *
 * Hits every public, funnel, and admin route on the live site and
 * records HTTP status, document title, first heading, and any console
 * errors or 4xx/5xx network requests during the load.
 *
 * Runs against:      BASE_URL env var (defaults to live vercel URL).
 * Output JSON:       review/stress_test/_out/routes.json
 * Markdown report:   review/stress_test/01_route_coverage.md
 *
 * Run:  npx playwright test review/stress_test/specs/routes.spec.ts
 */
import { test, expect } from '@playwright/test';
import { writeJson, writeReport } from './_helpers';

const ROUTES = {
  public: [
    '/', '/auth', '/library', '/assess', '/shop', '/progress', '/profile',
    '/welcome', '/payment-success', '/reset-password', '/privacy', '/terms',
  ],
  funnels: [
    '/links', '/f/wrong-books', '/f/free-assessment',
    '/f/3-minute-check', '/f/the-gap',
  ],
  adminExpectsAuth: [
    '/admin', '/admin/customers', '/admin/pipeline',
    '/admin/deals', '/admin/tasks', '/admin/analytics',
  ],
  deepLinks: [
    '/library?book=L1.1', '/library?book=L3.1',
    '/library?book=L5.1', '/library?book=L6.4',
  ],
} as const;

type RouteResult = {
  url: string;
  category: string;
  status: number;
  title: string;
  firstHeading: string | null;
  consoleErrors: string[];
  consoleWarnings: string[];
  failedRequests: { url: string; status: number }[];
  loadTimeMs: number;
};

const results: RouteResult[] = [];

for (const [category, urls] of Object.entries(ROUTES)) {
  for (const route of urls) {
    test(`route: ${category} — ${route}`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const consoleWarnings: string[] = [];
      const failedRequests: { url: string; status: number }[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
        if (msg.type() === 'warning') consoleWarnings.push(msg.text());
      });
      page.on('response', (resp) => {
        if (resp.status() >= 400) {
          failedRequests.push({ url: resp.url(), status: resp.status() });
        }
      });

      const t0 = Date.now();
      // Use domcontentloaded — Supabase real-time clients keep the
      // network alive indefinitely, so `networkidle` times out even on
      // perfectly-working pages.
      const resp = await page.goto(route, {
        waitUntil: 'domcontentloaded',
        timeout: 20_000,
      });
      const loadTimeMs = Date.now() - t0;

      // Wait a beat so React lazy routes finish rendering
      await page.waitForTimeout(1500);

      const title = await page.title();
      const firstHeading = await page
        .locator('h1, h2')
        .first()
        .textContent()
        .catch(() => null);

      results.push({
        url: route,
        category,
        status: resp?.status() ?? 0,
        title,
        firstHeading: firstHeading?.trim() ?? null,
        consoleErrors,
        consoleWarnings,
        failedRequests,
        loadTimeMs,
      });

      expect(resp?.status(), `status for ${route}`).toBeLessThan(500);
    });
  }
}

test.afterAll(async () => {
  writeJson('routes.json', results);

  const lines: string[] = [];
  lines.push('# Pass 1 — Route coverage\n');
  lines.push(`Routes tested: **${results.length}**\n`);

  const withErrors = results.filter(
    (r) => r.consoleErrors.length || r.failedRequests.length || r.status >= 400,
  );
  lines.push(`Routes with issues: **${withErrors.length}**\n`);

  lines.push('\n## Per-route results\n');
  lines.push('| Route | Status | Load (ms) | Heading | Errors | 4xx/5xx |');
  lines.push('|-------|-------:|----------:|---------|-------:|--------:|');
  for (const r of results) {
    const heading = (r.firstHeading ?? '—').slice(0, 50).replace(/\|/g, '\\|');
    lines.push(
      `| \`${r.url}\` | ${r.status} | ${r.loadTimeMs} | ${heading} | ${r.consoleErrors.length} | ${r.failedRequests.length} |`,
    );
  }

  lines.push('\n## Console errors\n');
  for (const r of results.filter((r) => r.consoleErrors.length)) {
    lines.push(`### \`${r.url}\``);
    for (const e of r.consoleErrors.slice(0, 10)) {
      lines.push(`- ${e.slice(0, 200)}`);
    }
    lines.push('');
  }

  lines.push('\n## Failed network requests\n');
  for (const r of results.filter((r) => r.failedRequests.length)) {
    lines.push(`### \`${r.url}\``);
    for (const f of r.failedRequests.slice(0, 10)) {
      lines.push(`- ${f.status} ${f.url}`);
    }
    lines.push('');
  }

  writeReport('01_route_coverage.md', lines.join('\n'));
});
