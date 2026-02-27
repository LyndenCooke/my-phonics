# MyPhonicsBooks

Personalised, phonics-structured reading books for children aged 4–8. Parents enter their child's name, interests, and reading level — the system generates a print-ready A5 PDF. Print on A4, fold, staple — real book.

## The Core Promise

**Every word in every story is either:**
1. **Decodable** at the selected level (the child can sound it out using only taught graphemes), OR
2. **A listed tricky word** for that level or below.

No exceptions. This is the entire educational value.

## How It Works

```
Parent Input → Level Selection → Story Personalisation → Phonics Validation → PDF Assembly
```

A parent picks a reading level, chooses a story template, and enters their child's name and interests. The system generates a fully personalised, phonics-constrained story, validates every word against the taught grapheme set, and produces a print-ready A5 booklet.

## Reading Levels

Six levels aligned to the Read Write Inc (RWI) colour-band progression:

| Level | Name | RWI Band | What's Taught |
|-------|------|----------|---------------|
| 1 | Starting Stories | Red | All Set 1 sounds — single letters, digraphs (sh, th, ch, ng, nk, qu) |
| 2 | Longer Sounds | Green + Purple | Set 2 long vowels — ay, ee, igh, ow, oo, ar, or, air, ir, ou, oy |
| 3 | New Spellings | Pink + Orange | Early Set 3 — split digraphs (a-e, i-e, o-e, u-e) + consonant clusters |
| 4 | Building Fluency | Yellow | Later Set 3 — are, ur, er, ew, ue, ow (as in cow) |
| 5 | Reading Together | Blue | Final Set 3 — ore, oor, ire, ear, ure, tion |
| 6 | Reading Champion | Grey | Suffix patterns — ous, cious/tious, able/ible |

5 stories per level = **30 unique books**.

> **Note:** MyPhonicsBooks is an independent product. We are not associated with Read Write Inc or Ruth Miskin Training. Our phonics progression is based on Letters and Sounds (public domain) and aligned to the RWI colour-band sequence for familiarity.

## Book Format

- **Size:** A5 (half A4), saddle-stitched (fold and staple)
- **Level 1:** 12 pages (3 sheets of A4) — one sentence per page, large illustrations
- **Levels 2–6:** 16 pages (4 sheets of A4) — story text + illustrations, activity pages, writing practice, nonsense word challenge, reading certificate
- **Font:** [Andika](https://software.sil.org/andika/) (SIL International) — designed for literacy with single-storey 'a' and 'g'

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+ (for frontend)
- [Playwright](https://playwright.dev/) (for PDF rendering)

### Installation

```bash
# Clone the repository
git clone https://github.com/LyndenCooke/my-phonics.git
cd my-phonics

# Install Python dependencies
pip install -r requirements.txt

# Install Playwright browser
playwright install chromium

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys
```

### Generate a Book

```bash
python generate_book.py          # Generates PDF in output/books/
python preview_pages.py          # Generates page previews in output/previews/
```

### Run the Frontend (development)

```bash
cd frontend
npm install
npm run dev
```

### Run the Backend

```bash
# FastAPI (main API)
uvicorn main:app --reload

# Express (Stripe payments)
cd backend
npm install
node server.js
```

## Project Structure

```
myphonicsbooks/
├── data/                          # Phonics knowledge base
│   ├── graphemes_by_level.json    # Taught graphemes per level (cumulative)
│   ├── tricky_words_by_level.json # Exception words per level
│   ├── story_summaries.json       # 30 story outlines with sound coverage
│   ├── story_templates/           # 10 story arc templates (JSON)
│   ├── word_banks/                # Permitted decodable words per level
│   ├── rwi_reference.json         # RWI sound progression reference
│   └── assessment_structure.json  # Assessment design
│
├── book_templates/                # Jinja2 HTML/CSS page templates
│   ├── book.html                  # Standard 16-page template (L2–L6)
│   └── base.html                  # Base HTML template
│
├── execution/                     # AI generation pipeline
│   ├── generate_story_text.py     # Claude API story generation
│   ├── generate_questions.py      # Comprehension questions
│   ├── generate_worksheet.py      # Writing worksheet content
│   ├── validate_word_bank.py      # Phonics quality gate
│   ├── process_order.py           # Order orchestration
│   └── utils/                     # Level config, word banks, API clients
│
├── frontend/                      # React + Vite + Tailwind
├── backend/                       # Express.js (Stripe checkout)
├── assets/fonts/                  # Andika font files (SIL licence)
├── tests/                         # Pytest suite
│
├── generate_book.py               # PDF generation entry point
├── validate_words.py              # Grapheme decomposition + validation
├── rebuild_word_banks.py          # Rebuild word banks from grapheme data
├── main.py                        # FastAPI server
└── requirements.txt               # Python dependencies
```

## 10 Story Templates

| # | Template | Story Arc | Emotional Theme |
|---|----------|-----------|-----------------|
| 1 | The Adventure | Goes somewhere new | Courage |
| 2 | The Lost Thing | Finds and returns something | Kindness |
| 3 | The New Friend | Meets someone different | Friendship |
| 4 | The Big Day | Special event | Excitement |
| 5 | The Helper | Solves a problem | Empathy |
| 6 | The Discovery | Finds a secret place | Wonder |
| 7 | The Pet Story | Animal companion | Care |
| 8 | The Sport/Game | Competition or team activity | Perseverance |
| 9 | The Weather Day | Weather changes the day | Adaptability |
| 10 | The Family Day | Outing with family | Belonging |

Each template defines 8 scenes with placeholders for the child's name, friend, location, and interests.

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Claude — story generation and phonics validation |
| `OPENAI_API_KEY` | DALL-E 3 — illustration generation |
| `STRIPE_SECRET_KEY` | Payment processing |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Database and storage (production) |
| `RESEND_API_KEY` | Transactional email delivery |

See `.env.example` for the full list including feature flags.

## Tech Stack

- **Story generation:** Claude (Anthropic) with phonics-constrained prompting
- **PDF rendering:** Jinja2 + Playwright (HTML/CSS → A5 PDF)
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** FastAPI (API) + Express.js (Stripe)
- **Database:** SQLite (MVP) / Supabase (production)
- **Payments:** Stripe Checkout
- **Email:** Resend
- **Font:** Andika (SIL Open Font Licence)

## Development Status

- [x] PDF generation pipeline (Jinja2 + Playwright)
- [x] Phonics data structure (6 levels, graphemes, tricky words)
- [x] 30 story summaries with sound coverage plans
- [x] 10 story template definitions
- [x] Book template (16-page HTML/CSS)
- [x] Phonics validation engine
- [x] RWI-aligned level mapping
- [ ] Word bank rebuild (match new level mapping)
- [ ] Story text generation (Claude API pipeline)
- [ ] Image generation (illustration placeholders only)
- [ ] Frontend completion
- [ ] Payment integration
- [ ] Assessment funnel

## Language

British English throughout — colour, organised, mum.

## Licence

All rights reserved. This is a commercial product.

Font files (Andika) are distributed under the [SIL Open Font Licence](https://scripts.sil.org/OFL).
