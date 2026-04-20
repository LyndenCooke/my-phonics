# Pass 1 — Orientation

## What the product is (investor-readable)

MyPhonicsBooks is a blended literacy product: families can buy structured decodable books as printable PDFs and also read them as interactive web books with tappable phonics support, assessment and progress surfaces. The educational promise is explicit: every story word should be decodable at the child’s level or on that level’s tricky-word list. This rule is repeated in core product docs and underpins the curriculum proposition. Sources: `myphonics_books/CLAUDE.md:3-6`, `myphonics_books/README.md:28-33`.

The product is presented as UK-phonics aligned and culturally differentiated: each book setting is intended to show contemporary global contexts (not tokenized “culture themes”), creating both a literacy and worldview angle. The repository contains both production pipeline assets (story data, image generation scripts, PDF assembly scripts) and a customer-facing React app with funnels, assessment, library, shop and reading experience routes. Sources: `myphonics_books/README.md:13-21`, `myphonics_books/README.md:118-146`, `src/App.tsx:76-104`.

Operationally, this is currently a hybrid between “content studio” and “SaaS app.” The pipeline side has many one-off and level-specific generation scripts; the web side has live payment/auth paths (Supabase + Stripe) and growing product/funnel complexity including admin CRM routes. This gives launch speed, but introduces consistency risk between curriculum source-of-truth files, seeded DB content and marketed claims. Sources: `myphonics_books/scripts/` listing, `supabase/functions/create-checkout-session/index.ts:96-175`, `myphonics_books/PRODUCTION_CHECKLIST.md:85-165`, `myphonics_books/docs/curriculum_ladder.md:19-61`.

---

## Real surfaces

### 0) Top-level folder listing (requested orientation snapshot)

Top-level repo folders/files visible at review time included: `agents/`, `content/`, `marketing/`, `myphonics_apps/`, `myphonics_books/`, `remotion-transfer/`, root `src/`, `supabase/`, and deployment/build files (`vercel.json`, Vite/Tailwind/TS configs). This confirms the product is split across book generation, web app, marketing ops and backend functions in one monorepo-style layout.

### A) User-facing web routes (root app)

From router config:
- `/` (marketing landing)
- `/library`
- `/welcome`
- `/assess`
- `/shop`
- `/payment-success`
- `/progress`
- `/profile`
- `/auth`
- `/reset-password`
- Funnels: `/links`, `/f/wrong-books`, `/f/free-assessment`, `/f/3-minute-check`, `/f/the-gap`
- Admin: `/admin`, `/admin/customers`, `/admin/customers/:id`, `/admin/pipeline`, `/admin/deals`, `/admin/tasks`, `/admin/analytics`
- `*` fallback not found. Source: `src/App.tsx:76-105`.

### B) Secondary web app surface (phonics-fun-hub)

A smaller route surface exists in `myphonics_books/phonics-fun-hub`:
- `/`, `/library`, `/assess`, `/shop`, `/payment-success`, `/progress`, `/profile`, `/auth`, `/reset-password`, `*`. Source: `myphonics_books/phonics-fun-hub/src/App.tsx:23-34`.

### C) Serverless/API entry points (Supabase functions)

Production-critical edge functions include:
- `create-checkout-session`
- `stripe-webhook`
- `guest-assessment-signup`
- `save-assessment-result`
- `save-quiz-attempt`
- `track-reading-activity`
- `generate-pdf-download`
- `ghl-sync`.
Source: `supabase/functions/*/index.ts` and mirrored `myphonics_books/phonics-fun-hub/supabase/functions/*/index.ts`.

### D) Script entry points (pipeline + app)

Web scripts (`npm`):
- `dev`, `build`, `build:dev`, `lint`, `preview`, `test`, `test:watch`. Source: `package.json:6-13`, `myphonics_books/phonics-fun-hub/package.json:6-13`.

Pipeline scripts explicitly documented:
- `py -3.12 scripts/generate_gemini_images.py L1`
- `py -3.12 scripts/generate_pilot_books.py L1`
- `scripts/validate_story_phonics.py` modes (all/level/book/fix). Source: `myphonics_books/CLAUDE.md:91-94`, `myphonics_books/scripts/validate_story_phonics.py:7-11`.

### E) Deployed artifacts / distributables

- Static SPA build output under `dist/` via Vite.
- Static asset rewrites for `/book-pdfs`, `/covers`, `/book-pages`, `/illustrations`, `/sounds`, `/images` in Vercel config.
- Print-ready PDF outputs in pipeline path (`output/books/Level{n}`) and book page image exports for web (`phonics-fun-hub/public/book-pages`).
Sources: `vercel.json:2-10`, `myphonics_books/CLAUDE.md:89`, `myphonics_books/scripts/export_book_pages.py:18-20`.

---

## What is built vs stubbed vs missing

### Built (verified)
- End-to-end auth + payments path scaffolded (Supabase auth, Stripe checkout, webhook handler). `supabase/functions/create-checkout-session/index.ts:14-175`, `supabase/functions/stripe-webhook/index.ts`.
- Assessment and adaptive engine are implemented in front-end code (not just mock UI). `src/pages/Assessment.tsx:64-260`.
- Interactive reader exists with level/sublevel data maps across L1–L6. `src/components/InteractiveBookReader.tsx:891-978`, `src/lib/interactiveBookData.ts:1960-1994`.

### Stubbed / inconsistent
- Root README is still placeholder (“TODO: Document your project here”). `README.md:1-3`.
- Curriculum status is inconsistent across canonical docs (example: L4–L6 shown as not started in README, but complete/in-progress in checklist). `myphonics_books/README.md:67-75` vs `myphonics_books/PRODUCTION_CHECKLIST.md:119-165`.
- Story validator script cannot parse several current story files (“No story text found”), indicating tooling drift. Verified by running `python scripts/validate_story_phonics.py L1.1/L3.1/L5.1`. Script usage: `myphonics_books/scripts/validate_story_phonics.py:7-11`.

### Missing / weak for investor-grade launch
- No visible CI workflows (`.github/workflows` absent).
- Legal pages (privacy/terms/GDPR) are not wired in route surfaces or source files.
- Test depth is low (1 web test; narrow python tests with failures).
Sources: file tree inspection, `myphonics_books/phonics-fun-hub/src/test/example.test.ts`, `myphonics_books/tests/test_word_bank_validation.py` test run results.

---

## Architecture diagram (ASCII)

```text
[Curriculum files]
  myphonics_books/data/graphemes_by_level.json
  myphonics_books/data/tricky_words_by_level.json
  myphonics_books/data/*story*.py
            |
            v
[Python generation pipeline]
  generate_* scripts + core/*
  -> story validation
  -> image generation (Gemini/Flux/etc)
  -> Jinja template render
  -> Playwright PDF export
            |
            +--> output/books/Level*/**.pdf (print product)
            +--> export_book_pages.py -> phonics-fun-hub/public/book-pages/*
            |
            v
[Storage / backend]
  Supabase Postgres (books, pages, user_books, purchases, assessments, quizzes)
  Supabase Storage buckets (covers/pages/pdfs/drawings)
  Supabase Edge Functions (checkout, webhook, signup, save results)
            |
            v
[React web apps]
  Root src/ app (marketing + funnels + interactive + admin)
  phonics-fun-hub app (library/shop/assessment variant)
            |
            v
[Customer]
  Parent lands on funnel/landing
  -> assessment
  -> free unlock or Stripe checkout
  -> library + interactive reading + progress
  -> optional PDF download
```
