# MyPhonicsBooks

**Decodable phonics books for children aged 4–8. Every book is an open window to a different contemporary culture.**

*Print at home. Fold. Staple. Read the world.*

> **Last Updated:** 7 March 2026

---

## 🌍 The Open Window

MyPhonicsBooks does two things at once:

1. **Teaches children to read** using scientifically structured, decodable phonics books where every word is matched to exactly what they can decode
2. **Opens a window to the world** by setting every book in a different contemporary culture — showing children that kids around the globe have families, pets, parks, and bedtimes just like them

A child in Birmingham reads about a child in Nairobi. A child in London reads about a child in Yokohama. And in every book, every single word is one they can actually sound out.

**No other product does both.** Decodable readers are typically generic. Diverse children's books are not phonics-structured. We are the intersection.

> Read the full vision: [`docs/VISION.md`](docs/VISION.md)

---

## The Core Promise

**Every word in every story is either:**
1. **Decodable** at the selected level (the child can sound it out using only taught graphemes), OR
2. **A listed tricky word** for that level or below.

No exceptions. This is the entire educational value.

---

## How It Works

```
Level + Focus Sounds → Cultural Research → Story Writing → Phonics Validation → Image Generation → PDF Assembly
```

Each book goes through a mandatory **9-step production pipeline** with quality checkpoints at every stage. Cultural research (Step 0) happens BEFORE anything else — ensuring every setting is authentic, contemporary, and dignified.

Characters are **universal** (the girl, the boy, Mum) — not personalised with specific names. This means every book works for every child who picks it up.

---

## Reading Levels

Six levels aligned to the Letters and Sounds progression:

| Level | Name | Colour | What's Taught | Books |
|-------|------|--------|---------------|-------|
| 1 | Starting Stories | 🩷 Pink | All Set 1 sounds — letters + digraphs (sh, th, ch, ng, nk, qu) | 10 ✅ |
| 2 | Longer Sounds | 🟡 Amber | Set 2 long vowels — ay, ee, igh, ow, oo, ar, or, air, ir, ou, oy | 4 of 5 |
| 3 | New Spellings | 🟢 Green | Split digraphs (a-e, i-e, o-e, u-e) + consonant clusters | 1 of 5 |
| 4 | Building Fluency | 🔵 Blue | Later Set 3 — are, ur, er, ew, ue, ow (cow) | 0 of 4 |
| 5 | Reading Together | 🟣 Purple | Final Set 3 — ore, oor, ire, ear, ure, tion | 0 of 4 |
| 6 | Reading Champion | 🩵 Teal | Suffix patterns — ous, cious/tious, able/ible | 0 of 4 |

**32 books total** across 6 levels — each set in a different contemporary culture from around the world.

> **Note:** MyPhonicsBooks is an independent product based on Letters and Sounds (public domain). We are not associated with Read Write Inc or any commercial phonics programme.

---

## Production Status

| Level | Status | Completed Books |
|-------|--------|-----------------|
| **L1** | ✅ COMPLETE | 10/10 — Tap! Tap! Tap!, The Mud on the Dog, The Fish in the Tank, The Red Socks, Run Pup Run!, Fox Fell Off!, The Jam Jug, The Yak and the Box, Chop Chop Chop!, Buzz and Sing! |
| **L2** | 🔄 In Progress | 4/5 — The Night Light, Moo at the Zoo, The Shadow Show, The Fair in the Air |
| **L3** | 🔄 In Progress | 1/5 — The Big Bike Race |
| **L4–L6** | 🔲 Not Started | 0/12 |

---

## Book Format

- **Size:** A5 (half A4), saddle-stitched (fold and staple)
- **Level 1:** 12 pages (3 sheets of A4) — one sentence per page, large illustrations
- **Levels 2–6:** 16 pages (4 sheets of A4) — story text + illustrations, activity pages, writing practice, nonsense word challenge, reading certificate
- **Font:** [Andika](https://software.sil.org/andika/) (SIL International) — designed for literacy with single-storey 'a' and 'g'

---

## Getting Started

### Prerequisites

- Python 3.12+
- [Playwright](https://playwright.dev/) (for PDF rendering)

### Generate a Book

```bash
cd myphonicsbooks

# Generate images (hero + all scenes)
py -3.12 scripts/generate_gemini_images.py L1

# Generate PDF
py -3.12 scripts/generate_pilot_books.py L1
```

---

## Tech Stack

- **Story generation:** Claude (Anthropic) with phonics-constrained prompting
- **Image generation:** Gemini Imagen / Flux Kontext Pro via fal.ai — hero injection pipeline
- **PDF rendering:** Jinja2 + Playwright (HTML/CSS → A5 PDF)
- **Font:** Andika (SIL Open Font Licence)
- **Python:** 3.12

---

## Project Structure

```
myphonicsbooks/
├── CLAUDE.md                      ← Master system guide
├── docs/
│   ├── VISION.md                  ← The Open Window vision & philosophy
│   ├── MYPHONICSBOOKS_COMPLETE_GUIDE.md
│   └── brand-guidelines.md
├── PRODUCTION_CHECKLIST.md        ← Tracks completed books
├── data/                          ← Phonics knowledge base
│   ├── graphemes_by_level.json    ← Taught graphemes per level
│   ├── tricky_words_by_level.json ← Exception words per level
│   └── *_story_*.py               ← Story data files
├── .claude/skills/                ← 12 specialist production skills
│   ├── workflow-orchestrator/     ← Master 9-step pipeline
│   ├── cultural-researcher/       ← Pre-production cultural research
│   ├── phonics-story-writer/      ← Story writing with engagement hooks
│   ├── art-generator/             ← Hero injection image pipeline
│   ├── illustration-director/     ← Image prompts and QA
│   ├── book-assessor/             ← Quality gatekeeper
│   └── ...                        ← 6 more specialist skills
├── scripts/                       ← Generation scripts
├── templates/                     ← Jinja2 HTML/CSS templates
├── output/
│   ├── images/                    ← Generated illustrations
│   └── books/                     ← Production PDFs by level
└── assets/fonts/                  ← Andika font files
```

---

## Cultural Diversity

Each book is set in a different contemporary culture. Across the full series, children encounter the world:

**Represented so far:** UK (multiple regions), Middle East, Himalayan/Central Asia, South Asia, Caribbean, East Asia (Japan)

**Planned:** East Africa, West Africa, Southeast Asia, South America, North Africa, Northern Europe, Eastern Europe, Pacific Islands, and more.

Every culture is shown **contemporary-first** — how people actually live today, not through heritage stereotypes. Tradition appears as living texture within modern life, not as the entire picture.

> Read the full cultural approach: [`docs/VISION.md`](docs/VISION.md)

---

## Language

British English throughout — colour, organised, mum.

## Licence

All rights reserved. This is a commercial product.

Font files (Andika) are distributed under the [SIL Open Font Licence](https://scripts.sil.org/OFL).
