# MyPhonicsBooks — Synthetic Stress Test

Paste this into Codex at the repo root. It will run the live product
end-to-end, simulating multiple user personas, testing every
interactive book, every route, every asset, and every error state.

**Expected runtime:** 30-90 minutes. Output is a structured report under
`review/stress_test/`.

**Live site:** https://myphonicsbooks.vercel.app
**Dev server:** `npm run dev` (port 8080, root of repo)

---

## What this tests, and what it doesn't

- ✅ Every route renders without console errors
- ✅ Every interactive book loads, every page renders, every tappable
  word fires audio
- ✅ Every referenced image and audio asset actually exists on disk
- ✅ Error states fire (image fail, audio fail, flaky net)
- ✅ Persona journeys end-to-end (ad → funnel → assessment → library → shop)
- ✅ Accessibility (axe-core + keyboard nav)
- ✅ Mobile (375×812 viewport walk-through)
- ✅ Performance (TTI, LCP, bundle fetch waterfall)

- ❌ Real user confusion / hesitation — needs actual humans
- ❌ Audio playback quality — can't hear it, only verifies it fires
- ❌ Real Stripe charges — test mode only
- ❌ Cross-browser beyond Chromium — install extra browsers if needed

---

## Setup

Use Playwright (already installed: `@playwright/test@1.57.0` in
`package.json`). If not installed as a binary, run:

```bash
npx playwright install chromium
```

Start the dev server as a background process OR test against
`https://myphonicsbooks.vercel.app` — either works. Default to the
live site unless local changes need testing.

Create `review/stress_test/` and write every output there. Use filenames
like `01_route_coverage.md`, `02_book_sweep.md`, etc.

---

## Pass 1 — Route coverage (`01_route_coverage.md`)

Visit every route below. For each:
- HTTP status (expect 200)
- Title tag
- First heading
- Console errors during load
- Console warnings
- Network requests that 404'd or 5xx'd
- Time to first meaningful paint

**Public routes:**
`/`, `/auth`, `/library`, `/assess`, `/shop`, `/progress`, `/profile`,
`/welcome`, `/payment-success`, `/reset-password`, `/privacy`, `/terms`

**Funnel routes:**
`/links`, `/f/wrong-books`, `/f/free-assessment`, `/f/3-minute-check`,
`/f/the-gap`

**Admin** (expect 403 / redirect to /auth when signed out):
`/admin`, `/admin/customers`, `/admin/pipeline`, `/admin/deals`,
`/admin/tasks`, `/admin/analytics`

**Deep links (new):**
`/library?book=L1.1` through `/library?book=L6.4` — should auto-open
the reader.

Report any route that errors, shows a blank page, or has copy that
looks like a placeholder.

---

## Pass 2 — Full book sweep (`02_book_sweep.md`)

The interactive book catalog is every sub-level in
`src/lib/interactiveBooksAvailability.ts`:
L1.1-L1.10, L2.1-L2.6, L3.1-L3.5, L4.1-L4.4, L5.1-L5.4, L6.1-L6.4
(33 books total).

For each book:

1. Navigate to `/library?book=<subLevel>`.
2. Confirm the reader opens (InteractiveBookReader component).
3. Walk every page forwards using the next button AND the keyboard
   (`ArrowRight`). Record page count.
4. On each page:
   - For `story` pages: find every tappable word, click it, verify
     audio fires (listen on `<audio>` `play` events in the DOM).
     Confirm phoneme highlights animate. Confirm blended word plays
     via speechSynthesis.
   - For `sound_grid` pages: tap each sound tile, verify focus state.
   - For `nonsense_words` pages: tap each alien word, verify sound-out.
   - For `quiz` pages: answer one option, verify next state renders.
5. Walk backwards using ArrowLeft — should return to page 1 cleanly.
6. Close reader. Confirm `user_books.last_page_read` updated (check
   network tab for the upsert; must fire at least once).

Flag for each book:
- Missing pages or `undefined` page data
- Broken tappable words (no audio, no highlight)
- Layout breakage (text overflow, image clipping)
- Missing illustrations
- Content that looks wrong for the level (flag only obvious issues —
  don't re-judge phonics pedagogy)

---

## Pass 3 — Asset existence sweep (`03_assets.md`)

Don't click through the reader for this — parse the book data directly.

1. Read `src/lib/interactiveBookData.ts`. Extract every
   `/illustrations/...` path and every phoneme reference.
2. For each illustration path: HEAD request against the live site.
   Expect 200.
3. For each unique phoneme: HEAD `/sounds/<phoneme>.mp3` on live.
   Expect 200.
4. Read `src/lib/bookCatalog.ts`. For every book, HEAD the cover image.
5. Report any 404s, 5xxs, or CORS errors.

---

## Pass 4 — Persona walks (`04_personas.md`)

Each persona runs as a distinct Playwright scenario, with a fresh
browser context (no shared cookies). Record every step, every
network call, every console line.

### Persona A — Cold landing visitor
1. Visit `/` fresh.
2. Click "Start Free Assessment".
3. Complete the welcome + onboarding steps.
4. Answer 5 screening questions (half right, half wrong).
5. Continue the sound test until you hit a natural stopping point.
6. Reach results. Submit email as `qa+persona-a@example.com`.
7. Confirm the "Save your results" flow fires the
   `guest-assessment-signup` edge function.
8. Verify you land on `/welcome` or `/library` with a free book
   unlocked.

### Persona B — Ad-funnel visitor
1. Visit `/f/3-minute-check` directly (simulates an ad click).
2. Follow the funnel copy end-to-end.
3. Enter email, finish assessment, land in library.

### Persona C — Returning parent with one free book
1. Sign in as a user that already has a user_books row (seed one
   first if needed). Use `qa+persona-c@example.com`.
2. Open their free book.
3. Read 3 pages, close the reader.
4. Re-open — confirm progress bar reflects the 3 pages read.
5. Try opening a locked book — confirm upsell modal fires.

### Persona D — Shopper
1. Visit `/shop`.
2. Click "Get Started" on the full_bundle.
3. As a guest, enter `qa+persona-d@example.com`.
4. Confirm you are redirected to Stripe Checkout (test mode — do
   NOT complete a real payment; verify the URL pattern
   `checkout.stripe.com`).
5. Navigate back, try the monthly subscription. Same check.

### Persona E — Mobile parent
1. Set viewport to 375×812 (iPhone SE).
2. Run Persona A's flow entirely on mobile.
3. Note any tap targets under 44×44 px.
4. Note any overflow, cut-off copy, or scroll lock issues.
5. Open one interactive book and verify swipe-left / swipe-right
   navigation works.

For each persona, produce: **time to complete**, **steps attempted**,
**steps blocked**, **errors surfaced**, **verdict**.

---

## Pass 5 — Error path probing (`05_errors.md`)

1. Visit `/library?book=L99.99` (non-existent subLevel). Expected:
   library renders, no crash, no auto-open.
2. Visit `/payment-success?session_id=cs_fake_invalid`. Expected:
   graceful "We couldn't find your order" state (or similar).
3. Visit `/auth`, submit `not-an-email`. Expected: inline validation
   error, no network call.
4. Go offline (Playwright `context.setOffline(true)`), open a book.
   Expected: image error UI with "Try again" button.
5. Throttle network to Slow 3G. Open `/library`. Expected: loading
   skeletons render.
6. Hit the `create-checkout-session` edge function with a malformed
   body (no `product_id`, bad UUID, invalid email). Expected: 400
   with useful error message (post-my-hardening work).
7. Hit `guest-assessment-signup` with a level of `99`. Expected: 400.
8. Visit `/admin` while signed out. Expected: redirect to `/auth`.

---

## Pass 6 — Accessibility (`06_a11y.md`)

For each of: `/`, `/library`, `/assess`, `/shop`, one interactive book
reader at page 2:

1. Run `axe-core` via `@axe-core/playwright`. Record every violation
   with severity and selector.
2. Keyboard-only walkthrough: Tab through every focusable element.
   Confirm visible focus ring (I added `:focus-visible` in index.css
   on 2026-04-20 — verify it renders).
3. Confirm the skip-to-main-content link appears on Tab from the
   top of `/`.
4. Check contrast of text vs background on critical CTAs with a
   contrast-checking library.
5. Alt text audit: every `<img>` must have non-empty `alt`.

---

## Pass 7 — Performance (`07_perf.md`)

For `/`, `/library`, and one interactive book reader:

1. Measure LCP, FCP, TTI, CLS via Playwright's web-vitals integration
   (or manual PerformanceObserver).
2. Record total JS transferred, total image bytes, total audio bytes.
3. Record the main bundle chunk name and size (should be
   index-*.js, ~527 kB raw, ~158 kB gzip, post-my-bundle-split).
4. Flag any single asset >500 kB.

---

## Pass 8 — Scorecard (`00_STRESS_SCORECARD.md`)

Roll everything up into a final scorecard:

```
# Stress Test Scorecard — {{date}}

## Overall verdict: {{READY | ISSUES_BLOCKING_LAUNCH | NOT_READY}}

## Headline numbers
- Routes tested: N / N passing
- Books tested: N / 33 fully walkable
- Tappable words checked: N / N firing audio
- Assets verified: N / N loading
- a11y violations (critical): N
- Persona paths complete: N / 5

## P0 issues (block launch)
- [ ] ...

## P1 issues (fix this week)
- [ ] ...

## P2 issues (post-launch)
- [ ] ...

## Things that impressed me
1. ...
2. ...

## Things that would worry a real parent
1. ...
2. ...
```

End by printing this scorecard to the terminal.

---

## Notes for the run

- If you need a test admin user to walk admin pages, seed one with
  SQL: `UPDATE profiles SET role = 'admin' WHERE email = 'qa+admin@example.com';`
- Do NOT complete real Stripe checkouts. Confirm redirect only.
- Delete any test users you create (`qa+...@example.com`) at the end.
- If a persona can't complete, record what blocked them and move on —
  don't stop the run.
- Record screenshots of any visual issue under
  `review/stress_test/screenshots/`.
