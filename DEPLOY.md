# Deploying MyPhonicsBooks (Vercel)

The site is a static Vite build plus ONE serverless function:
`api/forge/[[...path]].mjs`, which mounts the Create-A-Book forge router
(`server/forge/`) in production. In dev the identical router is mounted by
`server/forge/vitePlugin.mjs` — one router, two mounts.

## Environment variables (Vercel → Project → Settings → Environment Variables)

The gitignored `.env` files that power local dev do not exist in a deployment.
`server/forge/env.mjs` reads `process.env` first, so set these:

| Variable | Required | What it is |
|---|---|---|
| `VITE_SUPABASE_URL` | yes | Prod project: `https://jfbgdeyjngvzpfucwpuk.supabase.co` |
| `VITE_GOOGLE_CLIENT_ID` | committed in `.env` | Google Cloud OAuth "Web application" client ID (public). See "Google sign-in" below. Unset = falls back to the Supabase-hosted redirect flow. |
| `VITE_GOOGLE_ORIGIN_HOSTS` | committed in `.env` | Comma-separated hostnames registered as Authorised JavaScript origins on that client. The Google button only renders on these hosts; everywhere else uses the redirect fallback. |
| `SUPABASE_SERVICE_KEY` | yes | Service-role key. Books DB (`custom_books`, `custom_book_orders`) + Storage uploads. |
| `OPENAI_API_KEY` | yes | Story writing, direction, QA, and gpt-image-2 art. The default engine. |
| `STRIPE_SECRET_KEY` | yes (payments) | `sk_live_...` — without it checkout 500s; the voucher path still works. |
| `FORGE_VOUCHER_CODE` | optional | Lynden's private free-book test code. Unset = no voucher accepted. |
| `FAL_KEY` | optional | Third image-engine fallback (fal.ai). |

Never set `FORGE_IMG_ENGINE=vertex` in prod — the Vertex path shells out to
`gcloud`, which does not exist on a lambda.

## How generation works in production

A lambda cannot run a four-minute background job, so generation is a
**resumable step machine** (`server/forge/jobs.mjs`): story → QA → direction →
hero → one scene per step → cover → country → assemble. State lives in the
book row (`progress.job`), images in the public Supabase Storage bucket
`custom-books` (auto-created on first upload). The wizard drives it by calling
`POST /api/forge/books/:id/step` until `{ done: true }` — closing the tab
pauses generation; reopening the wizard resumes from the exact step it
stopped at, paying nothing twice.

## Known production degradations (by design)

- **PDF typesetting** returns 501 — it needs Python + Playwright, which run on
  the studio machine only. The frontend falls back to the interactive reader.
- **Photo likeness**: the uploaded photo is held in memory only (privacy) and
  may not survive to the hero step on a different lambda; the hero then
  generates from the described appearance instead.
- `/api/forge/dev/simulate-pay` is disabled in production.

## Static asset gotchas

Anything the function reads at runtime must be traced into the bundle —
`vercel.json` `includeFiles` covers `server/forge/assets/**` (vendored style
reference art + `green_words.json` word bank) and `myphonics_books/data/**`
(phonics JSON). If you add a new `readFileSync`, add its file there too;
`myphonics_books/output/**` is gitignored and can NEVER be read in prod.

## Google sign-in (own domain, no Supabase hostname on the consent screen)

`src/components/GoogleSignInButton.tsx` renders Google Identity Services on
our origin and exchanges the returned ID token with
`supabase.auth.signInWithIdToken`. The parent sees "continue to
myphonicsbooks.co.uk". Setup, once per environment:

1. **Google Cloud Console → APIs & Services → OAuth consent screen.**
   App name "MyPhonicsBooks", logo, support email, authorised domain
   `myphonicsbooks.co.uk`, links to `/privacy` and `/terms`. Publish the app
   (Testing mode caps you at 100 users and shows an "unverified" warning).
2. **Credentials → the existing Web application client.** The Google
   provider in Supabase already uses
   `325732048807-gbibje74sh43lalnei3dm389dquoaf7p.apps.googleusercontent.com`
   (it is public: it appears in the redirect Supabase sends to Google).
   Reuse it rather than creating another. Add these authorised JavaScript
   origins:
   `https://www.myphonicsbooks.co.uk`, `https://myphonicsbooks.co.uk`,
   `http://localhost:8080` (dev). Authorised redirect URIs: keep the existing
   `https://jfbgdeyjngvzpfucwpuk.supabase.co/auth/v1/callback` so the
   fallback redirect flow still works.
3. **Supabase dashboard → Authentication → Providers → Google.** Nothing
   to change: Supabase accepts ID tokens whose audience is the provider's
   own Client ID. Leave "Skip nonce checks" off: the button sends a hashed
   nonce to Google and the raw nonce to Supabase.
4. **Nothing to set in Vercel.** Both variables are committed in `.env`
   and Vite reads them at build time. If you add a new origin in Google
   (e.g. `http://localhost:8080` for dev), add its hostname to
   `VITE_GOOGLE_ORIGIN_HOSTS` too. A hostname in that list that Google does
   not know about makes the button fail with "origin is not allowed".

Preview deploys on `*.vercel.app` fall back to the redirect flow because
their hostnames are not in `VITE_GOOGLE_ORIGIN_HOSTS`.

Native (Capacitor) builds always use the redirect fallback: the GIS script
does not run inside a WebView. Native Google sign-in needs a plugin that
returns an ID token, which then goes through the same `signInWithIdToken`
call.
