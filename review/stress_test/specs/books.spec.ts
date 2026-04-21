/**
 * Pass 2 — Book walk.
 *
 * For every interactive book:
 *  - Sign in as QA (every book unlocked)
 *  - Deep-link to the book via ?book=<subLevel>
 *  - Confirm the reader opens
 *  - Walk every page forward with ArrowRight
 *  - Close the reader
 *
 * Captures any console errors and any broken images / audio requests.
 */
import { test, expect } from '@playwright/test';
import {
  INTERACTIVE_SUB_LEVELS,
  captureConsole,
  signInAsQa,
  waitForReaderReady,
  writeJson,
  writeReport,
} from './_helpers';

type BookResult = {
  subLevel: string;
  opened: boolean;
  pageCount: number;
  errors: string[];
  failedRequests: { url: string; status: number }[];
};

const results: BookResult[] = [];

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  // Empty — each test signs in its own context so we don't lose state
});

for (const subLevel of INTERACTIVE_SUB_LEVELS) {
  test(`book: ${subLevel}`, async ({ page }) => {
    const capture = captureConsole(page);

    await signInAsQa(page);
    await page.goto(`/library?book=${subLevel}`);

    let opened = true;
    try {
      await waitForReaderReady(page);
    } catch {
      opened = false;
    }

    let pageCount = 0;
    if (opened) {
      // Walk pages forward. Stop when Next button disappears or we've
      // gone past a reasonable max.
      for (let i = 0; i < 25; i++) {
        pageCount = i + 1;
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(250);
        const next = page.getByLabel(/next page/i);
        if ((await next.count()) === 0) break;
      }
    }

    results.push({
      subLevel,
      opened,
      pageCount,
      errors: capture.errors,
      failedRequests: capture.failedRequests,
    });

    // Soft assertions so one broken book doesn't abort the whole run
    expect.soft(opened, `${subLevel} opened`).toBe(true);
  });
}

test.afterAll(async () => {
  writeJson('books.json', results);

  const lines: string[] = [];
  lines.push('# Pass 2 — Interactive book walk\n');
  lines.push(`Books tested: **${results.length}** / ${INTERACTIVE_SUB_LEVELS.length}\n`);
  const broken = results.filter((r) => !r.opened || r.errors.length);
  lines.push(`Books with issues: **${broken.length}**\n`);

  lines.push('\n## Per-book results\n');
  lines.push('| Sub-level | Opened | Pages walked | Console errors | Failed requests |');
  lines.push('|-----------|:------:|-------------:|---------------:|----------------:|');
  for (const r of results) {
    lines.push(
      `| ${r.subLevel} | ${r.opened ? '✅' : '❌'} | ${r.pageCount} | ${r.errors.length} | ${r.failedRequests.length} |`,
    );
  }

  const trouble = results.filter((r) => r.errors.length || r.failedRequests.length);
  if (trouble.length) {
    lines.push('\n## Issues\n');
    for (const r of trouble) {
      lines.push(`### ${r.subLevel}`);
      for (const e of r.errors.slice(0, 8)) {
        lines.push(`- **console error:** ${e.slice(0, 200)}`);
      }
      for (const f of r.failedRequests.slice(0, 8)) {
        lines.push(`- **${f.status}:** ${f.url}`);
      }
      lines.push('');
    }
  }

  writeReport('02_book_sweep.md', lines.join('\n'));
});
