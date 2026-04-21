# Stress Test Scorecard — 2026-04-21 (partial)

## Overall verdict: PARTIAL RUN — BROWSER PASSES BLOCKED

Only Pass 3 (static asset existence) completed. The browser-dependent
passes (1 route coverage, 2 book walks, 4 personas, 5 error probing
via a real SPA, 6 a11y, 7 perf) could not be run because the "Claude in
Chrome" MCP extension was not reachable during this session.

## Executed passes

- ✅ **Pass 3 — Asset existence** (see `03_assets.md`)
- ⏸ **Pass 1 — Route coverage** — needs browser (SPA shell is identical across URLs)
- ⏸ **Pass 2 — Book walk** — needs browser + QA auth
- ⏸ **Pass 4 — Persona journeys** — needs browser
- ⏸ **Pass 5 — Error probing** — partially possible; deferred alongside the browser pass for consistency
- ⏸ **Pass 6 — Accessibility** — needs axe-core in browser
- ⏸ **Pass 7 — Performance** — needs browser timing APIs

## Headline numbers (from executed passes)

| Metric                              | Value        |
|-------------------------------------|--------------|
| Static asset references scanned     | 822          |
| Static assets present               | 797          |
| Static assets missing               | **25** (12 real, 13 template-literal false positives) |
| Phonemes referenced                 | all covered  |
| Book covers referenced              | all covered  |

## P0 — Blocks launch

- [ ] **12 word-image files are referenced by L2 and L3 interactive
      books but don't exist in `public/images/words/`.** Users hitting
      those `word_images` pages will see broken images. Missing:
      `bright`, `clean`, `close`, `cried`, `dried`, `food`, `fried`,
      `rude`, `rule`, `spoke`, `stool`, `tried`. Source:
      `src/lib/interactiveBookDataL2.ts`, `src/lib/interactiveBookDataL3.ts`.
      Either generate these illustrations or remove those entries from
      the interactive data.

## P1 — Fix this week

- [ ] Get the "Claude in Chrome" MCP extension connected (or run
      Playwright locally) so the browser-dependent passes can run.
      Without them we don't have visual / interaction coverage for
      any of the 33 interactive books.
- [ ] Confirm Vercel is deploying the latest `master`. A WebFetch of
      `/` during this session returned the old page title
      ("Personalised phonics books for your child"), which I removed
      in commit `a933fb1` on 2026-04-20. May have been a cache; worth
      a manual check of the Vercel dashboard and a fresh incognito
      reload of the live URL.

## P2 — Post-launch

- [ ] Once the browser passes run successfully, wire them up as a
      GitHub Action on every push — turns this from a one-off check
      into a permanent regression gate.

## Things that impressed me (from what was testable)

1. Phoneme audio coverage is 100% — every phoneme referenced in the
   interactive data has a matching `.mp3` in `/public/sounds/`.
2. Book cover coverage is 100% — every `cover_image_url` in the
   catalog resolves to a real file.
3. Static asset footprint is disciplined (only 12 real misses out of
   800+ references) — for a content-heavy product this is healthy.

## Things that would worry a real parent (from what was testable)

1. **Broken images on word-focus pages in L2/L3.** A parent 4 pages into
   a book suddenly sees a placeholder icon next to "bright" — that
   breaks immersion badly for early readers.

## Next run

Once the browser MCP is connected, re-run this full workflow. The
repo already has:

- `review/STRESS_TEST_PROMPT.md` — the canonical 8-pass brief
- `review/STRESS_TEST_PROMPT.pdf` — same, as a PDF
- `review/stress_test/_check_assets.py` — the asset sweep used here;
  rerunnable at any time via `py -3.12 review/stress_test/_check_assets.py`

The QA user (`qa@myphonicsbooks.com`) already has every book unlocked,
so browser passes can start immediately once the extension connects.
