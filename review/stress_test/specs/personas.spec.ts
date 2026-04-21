/**
 * Pass 4 — Persona journeys.
 *
 * Each test is a distinct user path. Runs in BOTH desktop and mobile
 * projects (configured in playwright.config.ts) so we get responsive
 * coverage for free.
 *
 * These are intentionally shallow — they verify the critical path
 * reaches the right state, not every detail. The book-walk and
 * route-coverage passes do the fine-grained work.
 */
import { test, expect } from '@playwright/test';
import { captureConsole, signInAsQa, writeJson, writeReport } from './_helpers';

type PersonaRun = {
  persona: string;
  project: string;
  completed: boolean;
  stepsBlocked: string[];
  errors: string[];
};

const runs: PersonaRun[] = [];

test('Persona A — cold landing → hits primary CTA', async ({ page }, testInfo) => {
  const capture = captureConsole(page);
  const blocked: string[] = [];

  await page.goto('/');
  const cta = page.getByRole('button', { name: /free assessment/i }).first();
  if ((await cta.count()) === 0) blocked.push('No "free assessment" CTA found');
  else {
    await cta.click();
    await page.waitForURL(/\/assess/, { timeout: 10_000 }).catch(() => {
      blocked.push('Did not land on /assess after click');
    });
  }

  runs.push({
    persona: 'A — cold landing',
    project: testInfo.project.name,
    completed: blocked.length === 0,
    stepsBlocked: blocked,
    errors: capture.errors,
  });
  expect.soft(blocked.length).toBe(0);
});

test('Persona B — ad funnel entry point renders', async ({ page }, testInfo) => {
  const capture = captureConsole(page);
  const blocked: string[] = [];

  await page.goto('/f/3-minute-check');
  await page.waitForTimeout(800);
  const body = (await page.textContent('body'))?.toLowerCase() ?? '';
  if (body.includes('not found') || body.length < 300) {
    blocked.push('funnel page appears empty or 404');
  }

  runs.push({
    persona: 'B — ad funnel',
    project: testInfo.project.name,
    completed: blocked.length === 0,
    stepsBlocked: blocked,
    errors: capture.errors,
  });
  expect.soft(blocked.length).toBe(0);
});

test('Persona C — signed-in parent lands on library', async ({ page }, testInfo) => {
  const capture = captureConsole(page);
  const blocked: string[] = [];

  await signInAsQa(page);
  await page.waitForTimeout(1000);
  const url = page.url();
  // Success = landed somewhere inside the app (not still on /auth).
  // We don't require the reader to open because books may be locked
  // for QA if the production books table isn't seeded.
  if (url.includes('/auth')) {
    blocked.push(`Sign-in did not leave /auth — still at ${url}`);
  }

  await page.goto('/library', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const body = (await page.textContent('body'))?.toLowerCase() ?? '';
  if (!body.includes('library') && !body.includes('books')) {
    blocked.push('Library did not render after sign-in');
  }

  runs.push({
    persona: 'C — signed-in parent',
    project: testInfo.project.name,
    completed: blocked.length === 0,
    stepsBlocked: blocked,
    errors: capture.errors,
  });
  expect.soft(blocked.length).toBe(0);
});

test('Persona D — shopper reaches a purchase CTA', async ({ page, context }, testInfo) => {
  const capture = captureConsole(page);
  const blocked: string[] = [];

  await page.goto('/shop', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const buyBtn = page
    .getByRole('button', { name: /get started|start free trial|get free book/i })
    .first();
  if ((await buyBtn.count()) === 0) {
    blocked.push('No purchase CTA visible on /shop');
  }

  runs.push({
    persona: 'D — shopper',
    project: testInfo.project.name,
    completed: blocked.length === 0,
    stepsBlocked: blocked,
    errors: capture.errors,
  });
  expect.soft(blocked.length).toBe(0);

  await context.clearCookies();
});

test.afterAll(async () => {
  writeJson('personas.json', runs);

  const lines: string[] = [];
  lines.push('# Pass 4 — Persona journeys\n');
  lines.push('| Persona | Project | Completed | Blockers | Errors |');
  lines.push('|---------|---------|:---------:|---------:|-------:|');
  for (const r of runs) {
    lines.push(
      `| ${r.persona} | ${r.project} | ${r.completed ? '✅' : '❌'} | ${r.stepsBlocked.length} | ${r.errors.length} |`,
    );
  }

  const trouble = runs.filter((r) => r.stepsBlocked.length || r.errors.length);
  if (trouble.length) {
    lines.push('\n## Blockers / errors\n');
    for (const r of trouble) {
      lines.push(`### ${r.persona} (${r.project})`);
      for (const b of r.stepsBlocked) lines.push(`- blocker: ${b}`);
      for (const e of r.errors.slice(0, 5)) lines.push(`- error: ${e.slice(0, 200)}`);
      lines.push('');
    }
  }

  writeReport('04_personas.md', lines.join('\n'));
});
