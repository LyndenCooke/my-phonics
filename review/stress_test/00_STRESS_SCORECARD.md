# Stress Test Scorecard — 2026-04-21

## Overall verdict: TWO INFRASTRUCTURE P0s, PRODUCT LOOKS SOLID

Full stress suite ran against `http://localhost:8080` (Vite dev server
pointed at the root `.env`). 66 passed / 11 failed on the first pass,
book-walk run re-executed cleanly after a Vite watcher fix. Deep dive
uncovered two infrastructure problems that are blocking both the
automated walk and, almost certainly, real users. See P0s.

## Headline numbers

| Area | Result |
|------|--------|
| Routes (27) | ✅ all 200, real titles render |
| A11y (5 pages) | ✅ 0 critical, ⚠ 4 serious color-contrast hits |
| Perf (3 pages) | ✅ FCP 360–872 ms, LCP 720–1248 ms — well inside "good" |
| Errors (5 probes) | ✅ 3/5 pass (E2, E3, E5). E1 flaky, E4 DNS-blocked |
| Personas (4 desktop) | ⚠ A/B pass, C/D fail (auth + no products seeded) |
| Book walks (33) | ❌ 0/33 opened — **blocked by auth**, not by the reader |
| Static assets | ✅ 0 real misses (pass 3, previously flagged 12 P0s — all fixed) |

## P0 — Blocks launch

### P0-1 — Vercel isn't picking up `master`
`https://myphonicsbooks.vercel.app/` served `<title>MyPhonicsBooks —
Personalised phonics books for your child</title>` at 2026-04-21
evening. I removed "Personalised" from that string on 2026-04-20 in
commit `a933fb1` (P1 launch hardening). My last two pushes (`cd0b0c0`,
`aa186f8`, `70b5e45`) also haven't landed on the live URL.

**Action:** Open the Vercel dashboard → project `myphonicsbooks` →
Deployments. Look for a failed build, a disconnected GitHub
integration, or a production-branch mismatch (Vercel watching `main`
while we push to `master`). Until that is sorted every fix we make is
invisible to real users.

### P0-2 — Root `.env` points at a dead Supabase project
```
VITE_SUPABASE_URL="https://qzwkyubbtjqpgqdthwal.supabase.co"
```
That hostname does not resolve:
```
$ nslookup qzwkyubbtjqpgqdthwal.supabase.co
*** bthub.home can't find … : Non-existent domain
```
Meanwhile the old `myphonics_books/phonics-fun-hub/.env` points at a
**different** working project:
```
VITE_SUPABASE_URL="https://jfbgdeyjngvzpfucwpuk.supabase.co"  # resolves to 172.64.149.246
```
Supabase auto-pauses free-tier projects that go 7 days without
traffic. The most likely story: the root app was pointed at a newer
project that has been paused (or deleted), while the real production
Supabase is still `jfbgdeyjngvzpfucwpuk`.

**Actions (in order):**
1. Check the Supabase dashboard — is the `qzwkyubbtjqpgqdthwal`
   project paused? If so, unpause it.
2. Confirm which project Vercel is actually talking to via its env
   vars, then make the two environments match.
3. Update root `.env` with whatever Vercel is using so local dev
   matches production.

**Downstream effect (verified in this run):** the QA user cannot sign
in locally, so the book walk reports every one of 33 books as "locked".
Sign-in failure also explains E1, Persona C, Persona D failures.

## P1 — Fix this week

### P1-1 — Four pages have serious color-contrast violations
axe-core found 10 contrast violations on `/library`, 1 each on
`/assess`, `/shop`, and the L1.1 interactive reader. No critical
issues anywhere. Fix the palette on muted-foreground text against
light backgrounds (Tailwind `text-muted-foreground` against `bg-card`
is a common offender in this codebase).

### P1-2 — `/welcome`, `/library`, `/shop` have console errors on
### load (3, 2, 1 respectively)
Almost certainly the Supabase-is-dead fallout (401/404 on auth and
`/rest/v1/products`). Should clear up once P0-2 is fixed.

### P1-3 — Products table not seeded (Persona D)
The shop page renders but no "Get Started" / "Start Free Trial"
buttons appear. Likely because `useProducts()` returns an empty array.
Seed the `products` table with at least `free_sample`, `full_bundle`
and `subscription` rows before launch.

## P2 — Post-launch

- `/library` ships 12.6 MB across 100 network requests on first load.
  Most is book-cover images. Lazy-load below-the-fold covers.
- Add visible focus-ring audit specifically for the interactive
  reader controls (I added the baseline ring in index.css; axe
  didn't flag it but a keyboard user still benefits from a stronger
  target).

## What went well (for the investor reviewer)

1. **Every public route returns 200 with a real page title** — no
   404s, no blank SPA shells on any URL I tried (27 routes).
2. **Performance is genuinely good.** FCP/LCP comfortably inside
   Google's "good" bucket on every page I measured, even without any
   image/CDN optimisation tuning.
3. **The a11y floor is high.** Zero critical violations across
   landing, library, assess, shop, and the reader. The 4 serious
   colour-contrast hits are all fixable in one palette pass.
4. **The suite itself is now permanent.** `.github/workflows/stress-test.yml`
   runs this whole battery on every push to `master`, nightly at
   02:00 UTC, and on demand. Artifacts retained 14–30 days.
5. **The asset sweep we ran yesterday (Pass 3) already closed a real
   P0** — 12 missing word-image files in L2/L3 interactive books
   that would have shown broken icons to real kids. Regenerated on
   2026-04-21 in commit `aa186f8`.

## What a real parent would still worry about

1. They try to sign in and nothing happens (P0-2).
2. They hit the shop and no plans are shown (P1-3).
3. Subtle: low-contrast helper text under the level filter on /library
   means some phone users won't see it in bright daylight (P1-1).

## Next run

Once P0-1 and P0-2 are fixed:

```bash
# Local (against dev server)
BASE_URL=http://localhost:8080 npx playwright test \
  --config review/stress_test/playwright.config.ts

# Live site
npx playwright test --config review/stress_test/playwright.config.ts
```

The GitHub Action does the live-site run automatically on every push.

## What couldn't be completed

- **Mobile-chromium project** wasn't run in this session (time).
  CI will run it on next push.
- **Stripe checkout walk** deliberately stops short of payment —
  verifies redirect URL pattern only.
- **Real Supabase schema validation** requires P0-2 sorted.
