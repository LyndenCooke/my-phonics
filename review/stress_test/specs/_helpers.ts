/**
 * Shared helpers for stress-test specs.
 */
import { Page, BrowserContext, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

export const OUT_DIR = path.resolve(__dirname, '..', '_out');

export function ensureOutDir() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

export function writeReport(filename: string, body: string) {
  const target = path.resolve(__dirname, '..', filename);
  fs.writeFileSync(target, body, 'utf-8');
}

export function writeJson(filename: string, data: unknown) {
  ensureOutDir();
  fs.writeFileSync(path.join(OUT_DIR, filename), JSON.stringify(data, null, 2));
}

export function requireQaCreds() {
  const email = process.env.QA_EMAIL;
  const password = process.env.QA_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'QA_EMAIL and QA_PASSWORD must be set via env or .env.playwright'
    );
  }
  return { email, password };
}

/**
 * Signs the QA user in by driving the /auth form. Returns once the
 * post-login redirect lands on /library.
 */
export async function signInAsQa(page: Page) {
  const { email, password } = requireQaCreds();
  await page.goto('/auth');
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/library|\/welcome/, { timeout: 20_000 });
}

/**
 * Save signed-in storage state to a scratch file so other specs can
 * reuse it without re-authenticating on every test.
 */
export async function saveAuthState(context: BrowserContext, suffix = 'qa') {
  ensureOutDir();
  const target = path.join(OUT_DIR, `auth-${suffix}.json`);
  await context.storageState({ path: target });
  return target;
}

/**
 * Wait for the interactive reader's first story page to become visible.
 * Throws if it doesn't show up within 15s (signals a broken render).
 */
export async function waitForReaderReady(page: Page) {
  await expect(
    page.locator('[aria-label="Next page"], [aria-label="Close book"]')
  ).toBeVisible({ timeout: 15_000 });
}

export type ConsoleCapture = {
  errors: string[];
  warnings: string[];
  failedRequests: { url: string; status: number }[];
};

/**
 * Wire up console/network capture on a page. Returns a mutable object
 * you can read after navigation.
 */
export function captureConsole(page: Page): ConsoleCapture {
  const bucket: ConsoleCapture = {
    errors: [],
    warnings: [],
    failedRequests: [],
  };
  page.on('console', (msg) => {
    if (msg.type() === 'error') bucket.errors.push(msg.text());
    if (msg.type() === 'warning') bucket.warnings.push(msg.text());
  });
  page.on('response', (resp) => {
    if (resp.status() >= 400) {
      bucket.failedRequests.push({ url: resp.url(), status: resp.status() });
    }
  });
  return bucket;
}

export const INTERACTIVE_SUB_LEVELS = [
  'L1.1', 'L1.2', 'L1.3', 'L1.4', 'L1.5',
  'L1.6', 'L1.7', 'L1.8', 'L1.9', 'L1.10',
  'L2.1', 'L2.2', 'L2.3', 'L2.4', 'L2.5', 'L2.6',
  'L3.1', 'L3.2', 'L3.3', 'L3.4', 'L3.5',
  'L4.1', 'L4.2', 'L4.3', 'L4.4',
  'L5.1', 'L5.2', 'L5.3', 'L5.4',
  'L6.1', 'L6.2', 'L6.3', 'L6.4',
] as const;
