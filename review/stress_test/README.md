# Stress test suite

Playwright-driven end-to-end stress tests covering the whole
production web app. Runs locally or in CI, drives a real Chromium
browser through every route, every interactive book, and five
persona journeys.

## Layout

```
review/stress_test/
├── playwright.config.ts       # Dedicated config (separate from repo root stub)
├── specs/
│   ├── _helpers.ts            # Auth fixture + report writers
│   ├── routes.spec.ts         # Pass 1 — every public + funnel + admin route
│   ├── books.spec.ts          # Pass 2 — walk all 33 interactive books (QA auth)
│   ├── personas.spec.ts       # Pass 4 — 5 user journeys (desktop + mobile)
│   ├── errors.spec.ts         # Pass 5 — error paths, bad inputs, offline
│   ├── a11y.spec.ts           # Pass 6 — axe-core WCAG AA scan
│   └── perf.spec.ts           # Pass 7 — FCP / LCP / transfer size
├── _out/                      # Generated JSON + HTML report (gitignored)
├── 01_route_coverage.md       # Human-readable report (written by the spec)
├── 02_book_sweep.md
├── 04_personas.md
├── 05_errors.md
├── 06_a11y.md
└── 07_perf.md
```

## Local setup (one-time)

From the repo root:

```bash
# Install Playwright browsers
npx playwright install chromium

# Create a local env file for the QA credentials (not committed)
cp review/stress_test/.env.playwright.example .env.playwright
# ... then fill in QA_EMAIL and QA_PASSWORD
```

## Running locally

```bash
# Full suite against the live site
npx playwright test --config review/stress_test/playwright.config.ts

# Just one pass
npx playwright test --config review/stress_test/playwright.config.ts \
  review/stress_test/specs/routes.spec.ts

# Against a local dev server (start `npm run dev` first)
BASE_URL=http://localhost:8080 npx playwright test \
  --config review/stress_test/playwright.config.ts

# Open the interactive HTML report after a run
npx playwright show-report review/stress_test/_out/html
```

## Running in CI

Every push to `master` triggers `.github/workflows/stress-test.yml`.
The workflow also runs nightly at 02:00 UTC and can be kicked off
manually from the Actions tab.

### Required GitHub secrets

Set these in **Settings → Secrets and variables → Actions**:

| Secret | Purpose |
|--------|---------|
| `QA_EMAIL` | `qa@myphonicsbooks.com` (the seeded QA user) |
| `QA_PASSWORD` | The password you set when creating the QA user |
| `VITE_SUPABASE_URL` | Your Supabase project URL (optional — only needed for the `create-checkout-session` probe in errors.spec.ts) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key (same caveat) |

The run produces two artifacts per matrix project:
- `stress-test-html-<project>` — Playwright's HTML UI, retained 14 days
- `stress-test-reports-<project>` — raw JSON + human-readable MD, retained 30 days

## What each pass covers

- **Pass 1 — Routes:** navigates to every public, funnel, and admin
  URL; records status, load time, console errors, and 4xx/5xx.
- **Pass 2 — Books:** signs in as QA, deep-links every interactive
  sub-level (L1.1 → L6.4), walks every page forwards, captures
  failed media requests.
- **Pass 4 — Personas:** five journeys (cold landing, ad funnel,
  signed-in parent, shopper, mobile) — runs against both desktop and
  iPhone 12 viewports.
- **Pass 5 — Errors:** bad deep link, admin gate, bad email, malformed
  edge-function body, offline reader.
- **Pass 6 — A11y:** axe-core WCAG 2.1 AA on landing, library, assess,
  shop, and one interactive reader. Hard-fails the build on any
  critical violation.
- **Pass 7 — Perf:** FCP, LCP, DCL, transfer size for `/`, `/library`,
  `/assess`.

Pass 3 (asset existence) is a separate Python script — see
`_check_assets.py`. It runs off the repo, no browser needed.

## Reading the reports

Each pass writes a markdown summary at `review/stress_test/0N_<name>.md`.
The `00_STRESS_SCORECARD.md` is assembled manually after a run by
reading the six per-pass reports — it's the human digest, not a
generated artifact.
