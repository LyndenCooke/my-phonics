/**
 * Pass 6 — Accessibility audit.
 *
 * Runs axe-core against the landing page, library, assessment start,
 * shop, and one interactive book. Reports violations grouped by
 * severity.
 *
 * Requires: @axe-core/playwright (installed by the stress-test
 * workflow + local setup script).
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { signInAsQa, writeJson, writeReport } from './_helpers';

type AxeFinding = {
  page: string;
  violations: {
    id: string;
    impact: string | null;
    help: string;
    nodes: number;
  }[];
};

const findings: AxeFinding[] = [];

async function scan(page: import('@playwright/test').Page, label: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  findings.push({
    page: label,
    violations: results.violations.map((v) => ({
      id: v.id,
      impact: v.impact ?? null,
      help: v.help,
      nodes: v.nodes.length,
    })),
  });
}

test('a11y: landing', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500);
  await scan(page, '/');
});

test('a11y: library (signed out)', async ({ page }) => {
  await page.goto('/library');
  await page.waitForTimeout(500);
  await scan(page, '/library');
});

test('a11y: assessment welcome', async ({ page }) => {
  await page.goto('/assess');
  await page.waitForTimeout(500);
  await scan(page, '/assess');
});

test('a11y: shop', async ({ page }) => {
  await page.goto('/shop');
  await page.waitForTimeout(500);
  await scan(page, '/shop');
});

test('a11y: interactive reader on L1.1', async ({ page }) => {
  await signInAsQa(page);
  await page.goto('/library?book=L1.1');
  await page.waitForTimeout(2000);
  await scan(page, 'reader:L1.1');
});

test.afterAll(async () => {
  writeJson('a11y.json', findings);

  const lines: string[] = [];
  lines.push('# Pass 6 — Accessibility (axe-core)\n');
  lines.push('| Page | Critical | Serious | Moderate | Minor |');
  lines.push('|------|---------:|--------:|---------:|------:|');
  for (const f of findings) {
    const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    for (const v of f.violations) {
      if (v.impact && v.impact in counts) {
        counts[v.impact as keyof typeof counts]++;
      }
    }
    lines.push(
      `| ${f.page} | ${counts.critical} | ${counts.serious} | ${counts.moderate} | ${counts.minor} |`,
    );
  }

  lines.push('\n## Top violations per page\n');
  for (const f of findings) {
    if (!f.violations.length) continue;
    lines.push(`### ${f.page}`);
    for (const v of f.violations.slice(0, 10)) {
      lines.push(`- **[${v.impact ?? 'unknown'}]** ${v.id} — ${v.help} (${v.nodes} node(s))`);
    }
    lines.push('');
  }

  writeReport('06_a11y.md', lines.join('\n'));
});

// Hard-fail on critical violations; soft-flag the rest
test.afterEach(async () => {
  const latest = findings[findings.length - 1];
  if (!latest) return;
  const critical = latest.violations.filter((v) => v.impact === 'critical');
  expect.soft(critical.length, `critical a11y on ${latest.page}`).toBe(0);
});
