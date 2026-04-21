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

test('Persona C — signed-in parent can open a book', async ({ page }, testInfo) => {
  const capture = captureConsole(page);
  const blocked: string[] = [];

  await signInAsQa(page);
  await page.goto('/library?book=L1.1');
  await page.waitForTimeout(2000);

  const closeBtn = page.getByLabel(/close book/i);
  if ((await closeBtn.count()) === 0) {
    blocked.push('Reader did not open for QA user on L1.1');
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

test('Persona D — shopper hits Stripe redirect', async ({ page, context }, testInfo) => {
  const capture = captureConsole(page);
  const blocked: string[] = [];

  await page.goto('/shop');
  await page.waitForTimeout(1500);
  const buyBtn = page.getByRole('button', { name: /get started|start free trial/i }).first();
  if ((await buyBtn.count()) === 0) {
    blocked.push('No purchase CTA visible on /shop');
  } else {
    // Listen for the eventual Stripe redirect but don't actually complete
    const stripePromise = page
      .waitForURL(/checkout\.stripe\.com|stripe\.com\/checkout/, { timeout: 12_000 })
      .catch(() => null);
    await buyBtn.click();

    // Shop opens a guest-email dialog for unauthenticated users — fill it
    const emailInput = page.getByPlaceholder(/your email/i);
    if ((await emailInput.count()) > 0) {
      await emailInput.fill('qa-shopper@myphonicsbooks.test');
      await page.getByRole('button', { name: /continue to payment/i }).click();
    }

    const reached = await stripePromise;
    if (!reached) blocked.push('Did not redirect to Stripe checkout');
  }

  runs.push({
    persona: 'D — shopper',
    project: testInfo.project.name,
    completed: blocked.length === 0,
    stepsBlocked: blocked,
    errors: capture.errors,
  });
  expect.soft(blocked.length).toBe(0);

  // Clean up — don't leave a Stripe session in a weird state
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
