# Pass 2 — Developer Review (Senior Full-Stack)

## Executive judgement

I verified that the app builds and type-checks, but launch readiness is constrained by architecture drift (two app surfaces), weak type strictness, sparse automated testing, and some security/ops gaps. This is **launchable only after a focused hardening sprint**, not in current state for investor-level technical diligence.

---

## Build/deploy checks I ran

In `myphonics_books/phonics-fun-hub` (as requested):

1. `npm install` ✅ (up to date)
2. `npm run build` ✅ (build succeeds; main JS chunk warning ~626.51kB)
3. `npx tsc --noEmit` ✅
4. `npm test` ✅ (1 test file, 1 test)

Additional checks:
5. `python -m pytest -q` in `myphonics_books` ❌ (2 failing tests)
6. `python scripts/validate_story_phonics.py L1.1/L3.1/L5.1` ⚠️ (script skipped target stories: “No story text found”)

---

## Code quality

### TypeScript quality

**Verified concern (P1): strict mode effectively disabled.**
- `strict: false`, `noImplicitAny: false`, `strictNullChecks: false`, and unused checks disabled. This dramatically lowers static safety in launch code paths. `myphonics_books/phonics-fun-hub/tsconfig.app.json:15-26`, `myphonics_books/phonics-fun-hub/tsconfig.json:3-14`.

**Verified concern (P1): partial error handling in data hooks.**
- Some queries throw on `error`, but `useBooks()` ignores Supabase error and silently falls back to local catalog synthesis. This can mask backend outages/misconfigurations. `myphonics_books/phonics-fun-hub/src/hooks/useBooks.ts:10-43`.

**Verified concern (P1): duplicated app codepaths.**
- A full app exists at repo root `src/` and another in `myphonics_books/phonics-fun-hub/src`, increasing divergence risk for logic and bugfix rollout. Route surfaces already differ. `src/App.tsx:76-104`, `myphonics_books/phonics-fun-hub/src/App.tsx:23-34`.

### React patterns

**Verified concern (P1): progress is not persisted while reading in current reader flow.**
- `last_page_read`/`completed_at` types exist but I found no update path from reader state into Supabase during read sessions. Claims of progress tracking therefore depend on quizzes/purchases rather than page progression telemetry. `src/integrations/supabase/types.ts` (user_books fields), `src/components/InteractiveBookReader.tsx:893-975`, `src/pages/Index.tsx:245-268`.

**Verified concern (P2): monolithic interactive reader component.**
- `InteractiveBookReader.tsx` is very large and combines rendering, interaction, navigation and multiple page modes, making regression risk high. `src/components/InteractiveBookReader.tsx`.

### Python pipeline quality/testability

**Verified concern (P1): script sprawl and low cohesion.**
- Very high number of highly specific scripts (many one-off level scripts), limiting maintainability and repeatability. `myphonics_books/scripts/` directory listing.

**Verified concern (P1): key pipeline scripts are very large.**
- Example sizes: `generate_gemini_images.py` ~2848 lines; `generate_book.py` ~704 lines. This creates review and test burden. (`wc -l` run).

**Verified concern (P1): validator-tooling drift.**
- The dedicated validator could not parse current story modules in spot checks, indicating mismatch between canonical story format and QA tool assumptions. `myphonics_books/scripts/validate_story_phonics.py:310-341` vs actual story modules (`myphonics_books/data/*story*.py`).

### Dead/abandoned/duplicated artifacts

**Verified concern (P2): repository still contains legacy/placeholder docs and duplicate infra footprints.**
- Root README placeholder remains. `README.md:1-3`.
- Duplicate function folders and app copies increase chance of stale code shipping. (root vs hub folders).

---

## Security & data

### Auth model and RLS

**Verified positive:** RLS is enabled and policies are defined across core tables and storage buckets in migration files. `myphonics_books/phonics-fun-hub/supabase/migrations/20260318173340_ffc867d9-4e1a-4a39-866f-02319f827be4.sql:11-313`, `:336-372`.

**Verified concern (P1): broad CORS on edge functions.**
- `Access-Control-Allow-Origin: *` for checkout/signup handlers, which is common for public endpoints but increases abuse surface if rate limiting and origin checks are absent. `supabase/functions/create-checkout-session/index.ts:3-6`, `supabase/functions/guest-assessment-signup/index.ts:8-11`.

**Verified concern (P1): input validation is minimal.**
- `guest_email` and `email` checks are simple (`includes('@')` style), no stricter schema validation; product and metadata inputs rely on basic guardrails. `supabase/functions/create-checkout-session/index.ts:35-43`, `supabase/functions/guest-assessment-signup/index.ts:19-26`.

**Verified concern (P1): potential operational inefficiency and privacy risk in guest signup.**
- Guest signup calls `auth.admin.listUsers()` then searches in-memory by email. This does not scale and increases privileged data exposure in function execution context. `supabase/functions/guest-assessment-signup/index.ts:34-36`.

### Secret handling

**Verified positive:** code references env variables for Supabase/Stripe/API providers rather than hardcoding.
- Web client env usage: `myphonics_books/phonics-fun-hub/src/integrations/supabase/client.ts:5-11`.
- Backend env usage: `supabase/functions/create-checkout-session/index.ts:14-17,97-100`.

**Verified concern (P1): local `.env` exists with live-looking VITE values in workspace.**
- I did not print values, but keys are set for Supabase vars, which is fine locally but should be checked against `.gitignore` and CI secret handling. (command-based verification only).

### PII handling (assessment/personalised flow)

**Verified concern (P1): child/parent identifiable fields are collected and stored; legal disclosures are not obvious in app routes/files.**
- Child name + parent email captured in assessment and profile flows. `src/pages/Assessment.tsx:1253-1261`, `src/pages/Profile.tsx:126-131`, `supabase/functions/guest-assessment-signup/index.ts:19-65`.
- I did not find privacy/terms pages in route/file scan.

---

## Build, deploy, ops

### CI/CD

**Verified concern (P0): no visible CI workflow.**
- No `.github/workflows` found in repo scan.

### Monitoring/logging/analytics

**Verified concern (P1): no centralized error monitoring integration found in reviewed web surfaces (e.g. Sentry/Datadog hooks absent).**
- Errors mostly go to toasts or console in-page.

**Verified nuance:** there is lightweight acquisition tracking capture (`useFunnelTracker`) and CRM source sync logic, but this is not a full product analytics pipeline for feature usage, retention or error telemetry. `src/hooks/useFunnelTracker.ts:16-92`.

### Performance

**Verified concern (P1): large production bundle warning.**
- Build emits `index-*.js` ~626.51kB and Rollup chunk-size warning. Could impact mobile performance and first interaction. (build output).

**Verified concern (P2): high static asset footprint risk.**
- Extensive image/audio assets and page-level JPG readers may increase bandwidth, especially on mobile/flaky connections.

---

## Testing

**Verified concern (P0): launch confidence insufficient due low automated coverage and current failures.**
- Web app: 1 passing test only. `myphonics_books/phonics-fun-hub/src/test/example.test.ts`.
- Python tests: 2 failing assertions in word-bank validation baseline. (`python -m pytest -q` output).
- Validator utility drift against active story files weakens curriculum QA gate.

Minimum launch confidence package (recommended):
- Smoke E2E for assessment → unlock → library → checkout redirect.
- Unit tests for adaptive engine scoring thresholds and level transitions.
- Contract tests for edge functions (`create-checkout-session`, `guest-assessment-signup`, webhook idempotency).
- Pipeline regression tests: story schema compatibility + decodability gate.

---

## Prioritised punch list

### P0 — Blocks launch
1. Establish CI pipeline with required checks (build, tsc, tests, lint, migration check).
2. Raise test confidence: fix failing Python tests and add E2E happy-path for assessment + purchase + read.
3. Decide and enforce single production app surface (root vs hub) to avoid shipping drift.

### P1 — Fix in launch week
1. Move TS config toward strictness (`strict`, `strictNullChecks`, `noImplicitAny`) and fix resulting issues.
2. Add robust schema validation for edge-function inputs (email/product payloads, origin controls, rate limits).
3. Implement reader progress persistence (`last_page_read` updates) and completion telemetry.
4. Reduce bundle size via code-splitting/manual chunks and asset loading strategy.
5. Restore/replace story phonics validator compatibility with current story file schema.
6. Add privacy/terms surfaces and link at data-capture points.

### P2 — Post-launch
1. Refactor monolithic interactive reader into smaller modules.
2. Consolidate and prune one-off pipeline scripts into reusable command groups.
3. Add structured logging + alerting dashboards.
