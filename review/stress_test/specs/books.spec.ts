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
import { test } from '@playwright/test';
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
  lockedState: 'unlocked' | 'locked' | 'unknown';
  pageCount: number;
  errors: string[];
  failedRequests: { url: string; status: number }[];
};

const results: BookResult[] = [];

for (const subLevel of INTERACTIVE_SUB_LEVELS) {
  test(`book: ${subLevel}`, async ({ page }) => {
    const capture = captureConsole(page);

    await signInAsQa(page);
    await page.goto(`/library?book=${subLevel}`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(2000);

    let opened = false;
    try {
      await waitForReaderReady(page);
      opened = true;
    } catch {
      opened = false;
    }

    // If the reader didn't auto-open via deep-link, the book may be
    // locked for the QA user. Detect by looking for an upsell modal
    // or lock icon.
    let lockedState: BookResult['lockedState'] = 'unknown';
    if (!opened) {
      const bodyText = (await page.textContent('body'))?.toLowerCase() ?? '';
      if (bodyText.includes('unlock') || bodyText.includes('locked')) {
        lockedState = 'locked';
      } else if (bodyText.includes('my library')) {
        // Landed on library without reader — treat as locked (deep-link
        // guard requires book.unlocked)
        lockedState = 'locked';
      }
    } else {
      lockedState = 'unlocked';
    }

    let pageCount = 0;
    if (opened) {
      // Walk pages forward. Stop when Next button disappears or we've
      // gone past a reasonable max.
      for (let i = 0; i < 25; i++) {
        pageCount = i + 1;
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(200);
        const next = page.getByLabel(/next page/i);
        if ((await next.count()) === 0) break;
      }
    }

    results.push({
      subLevel,
      opened,
      lockedState,
      pageCount,
      errors: capture.errors,
      failedRequests: capture.failedRequests,
    });

    // No hard assertion — we record status and move on. The scorecard
    // flags unexpected locked states.
  });
}

test.afterAll(async () => {
  writeJson('books.json', results);

  const opened = results.filter((r) => r.opened);
  const locked = results.filter((r) => !r.opened && r.lockedState === 'locked');
  const broken = results.filter((r) => !r.opened && r.lockedState !== 'locked');

  const lines: string[] = [];
  lines.push('# Pass 2 — Interactive book walk\n');
  lines.push(`Books tested: **${results.length}** / ${INTERACTIVE_SUB_LEVELS.length}`);
  lines.push(`Opened + walked: **${opened.length}**`);
  lines.push(`Locked for QA user: **${locked.length}**`);
  lines.push(`Unknown failure: **${broken.length}**`);

  if (locked.length > 10) {
    lines.push(
      '\n> ⚠️ Most books are locked for the QA user. The seed SQL only ' +
      'inserts `user_books` rows for books that exist in the `books` ' +
      'table, so if that table is sparse in production almost nothing ' +
      'gets unlocked. Re-seed or add an `is_free_sample=true` flag to ' +
      'verify reader coverage.\n',
    );
  }

  lines.push('\n## Per-book results\n');
  lines.push('| Sub-level | Status | Pages walked | Console errors | Failed requests |');
  lines.push('|-----------|--------|-------------:|---------------:|----------------:|');
  for (const r of results) {
    const status = r.opened ? '✅ walked' : r.lockedState === 'locked' ? '🔒 locked' : '❌ broken';
    lines.push(
      `| ${r.subLevel} | ${status} | ${r.pageCount} | ${r.errors.length} | ${r.failedRequests.length} |`,
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
