/**
 * Pass 7 — Web vitals.
 *
 * Measures LCP, FCP, and transferred bytes for the three most
 * important public pages. No extra deps — just PerformanceObserver
 * injected into the page.
 */
import { test } from '@playwright/test';
import { writeJson, writeReport } from './_helpers';

type PerfResult = {
  page: string;
  lcpMs: number | null;
  fcpMs: number | null;
  domContentLoadedMs: number;
  transferBytes: number;
  requestCount: number;
};

const results: PerfResult[] = [];

async function measure(
  page: import('@playwright/test').Page,
  url: string,
): Promise<PerfResult> {
  let transferBytes = 0;
  let requestCount = 0;
  page.on('response', async (resp) => {
    requestCount++;
    try {
      const size = parseInt(resp.headers()['content-length'] ?? '0', 10);
      if (!Number.isNaN(size)) transferBytes += size;
    } catch {
      /* ignore */
    }
  });

  await page.goto(url, { waitUntil: 'load' });

  const timing = await page.evaluate(
    () =>
      new Promise<{ lcp: number | null; fcp: number | null; dcl: number }>((resolve) => {
        let lcp: number | null = null;
        let fcp: number | null = null;
        try {
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'largest-contentful-paint') lcp = entry.startTime;
              if (entry.name === 'first-contentful-paint') fcp = entry.startTime;
            }
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.name === 'first-contentful-paint') fcp = entry.startTime;
            }
          }).observe({ type: 'paint', buffered: true });
        } catch {
          /* ignore */
        }
        const dcl =
          performance.timing.domContentLoadedEventEnd -
          performance.timing.navigationStart;
        setTimeout(() => resolve({ lcp, fcp, dcl }), 3000);
      }),
  );

  return {
    page: url,
    lcpMs: timing.lcp,
    fcpMs: timing.fcp,
    domContentLoadedMs: timing.dcl,
    transferBytes,
    requestCount,
  };
}

test('perf: /', async ({ page }) => {
  results.push(await measure(page, '/'));
});

test('perf: /library', async ({ page }) => {
  results.push(await measure(page, '/library'));
});

test('perf: /assess', async ({ page }) => {
  results.push(await measure(page, '/assess'));
});

test.afterAll(async () => {
  writeJson('perf.json', results);

  const lines: string[] = [];
  lines.push('# Pass 7 — Performance\n');
  lines.push('| Page | FCP (ms) | LCP (ms) | DCL (ms) | Transfer (KB) | Requests |');
  lines.push('|------|---------:|---------:|---------:|--------------:|---------:|');
  for (const r of results) {
    lines.push(
      `| ${r.page} | ${r.fcpMs?.toFixed(0) ?? '—'} | ${r.lcpMs?.toFixed(0) ?? '—'} | ${r.domContentLoadedMs} | ${(r.transferBytes / 1024).toFixed(0)} | ${r.requestCount} |`,
    );
  }

  lines.push('\n## Targets');
  lines.push('- FCP < 1800ms = good, < 3000ms = needs improvement');
  lines.push('- LCP < 2500ms = good, < 4000ms = needs improvement');

  writeReport('07_perf.md', lines.join('\n'));
});
