# MyPhonicsBooks

Decodable phonics books for children aged 4-8, with an adaptive reading
assessment, an interactive hub, and culturally grounded stories set
around the world. Built on the UK Letters and Sounds progression.

**Live site:** https://myphonicsbooks.com *(update once public)*

---

## Repo layout

```
.
├── src/                          # Production web app (Vite + React + TS)
│   ├── pages/                    # Landing, library, assessment, shop, admin CRM
│   ├── components/               # Including InteractiveBookReader
│   └── integrations/supabase/    # Generated types + client
│
├── supabase/                     # Postgres migrations + edge functions
│   ├── functions/                # checkout, guest signup, save results, webhook
│   └── migrations/
│
├── myphonics_books/              # Python pipeline that produces A5 PDFs
│   ├── data/                     # Curriculum data, story text, tricky words
│   ├── scripts/                  # generate_*.py per level + per book
│   ├── core/                     # Pipeline + phonics validator
│   ├── templates/                # Jinja2 book templates
│   └── CLAUDE.md                 # Production playbook for book creation
│
├── marketing/                    # Meta ads (Remotion) + frameworks
├── content/                      # Channel content library
├── remotion-transfer/            # Shared Remotion compositions
├── agents/                       # Experimental agent workflows
├── review/                       # Launch-readiness reviews (investor pack)
└── .github/workflows/            # CI (build + typecheck + tests + pytest)
```

The production web app is at the **repo root** (`/src`). The copy
inside `myphonics_books/phonics-fun-hub/` is a legacy mirror — see
`myphonics_books/phonics-fun-hub/LEGACY.md`.

## Stack

- **Web:** Vite, React 18, TypeScript, Tailwind, shadcn/ui, React Query
- **Backend:** Supabase (Postgres + Auth + Storage + Edge Functions)
- **Payments:** Stripe (via Supabase edge functions)
- **Hosting:** Vercel
- **Book pipeline:** Python 3.12, Playwright, Jinja2, Flux/Gemini image gen, ElevenLabs audio

## Local development

```bash
# Web app
npm install
npm run dev            # http://localhost:8080
npm run build          # production build
npm test               # vitest
npm run lint

# Book pipeline
cd myphonics_books
py -3.12 scripts/generate_gemini_images.py L1   # regenerate images
py -3.12 scripts/generate_pilot_books.py L1     # regenerate PDFs
py -3.12 -m pytest                               # pipeline tests
```

## Environment variables

Copy `.env.example` to `.env.local`. Required keys:

- `VITE_SUPABASE_URL` — your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon key

Edge functions have their own secrets configured in the Supabase
dashboard (Stripe keys, service role, etc.). Never commit those.

## Levels

| Level | Name | Colour | Books | Key feature |
|-------|------|--------|-------|-------------|
| L1 | Starting Stories | Pink | 10 | Set 1 graphemes, 6 story pages |
| L2 | Longer Sounds | Amber | 5 | Long vowels, 8 pages |
| L3 | New Spellings | Green | 5 | Split digraphs, initial clusters |
| L4 | Building Fluency | Blue | 4 | Complex vowels, multi-syllable |
| L5 | Reading Together | Purple | 4 | Final Set 3, comprehension |
| L6 | Reading Champion | Teal | 4 | Suffixes, independent reading |

See `myphonics_books/docs/curriculum_ladder.md` for the full sound
progression and `myphonics_books/PRODUCTION_CHECKLIST.md` for per-book
status.

## License & content

The source code in this repository is proprietary. Book content,
illustrations, and audio are the copyright of MyPhonicsBooks.

## Contact

`hello@myphonicsbooks.com`
