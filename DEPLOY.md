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
| `SUPABASE_SERVICE_KEY` | yes | Service-role key. Books DB (`custom_books`, `custom_book_orders`) + Storage uploads. |
| `OPENAI_API_KEY` | yes | Story writing, direction, QA, and gpt-image-2 art. The default engine. |
| `STRIPE_SECRET_KEY` | yes (payments) | `sk_live_...` — without it checkout 500s; the voucher path still works. |
| `FORGE_VOUCHER_CODE` | optional | Lynden's private free-book test code. Unset = no voucher accepted. |
| `FAL_KEY` | optional | Third image-engine fallback (fal.ai). |
| `ELEVEN_LABS_API` | optional | ElevenLabs key. With it set, every finished book is narrated once (George, same voice as the library) so the online reader can read pages and words aloud. Unset = books ship silent. |

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

- **PDF typesetting** runs serverless now (`api/render-book-html.py` builds
  the HTML through the real book_v2 template, `server/forge/pdf.mjs` prints it
  with puppeteer + @sparticuz/chromium) and the finished PDF is emailed at the
  finish line. If that path fails for a book, the frontend still falls back
  to the interactive reader and `/api/forge/books/:id/pdf` can retry.
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
