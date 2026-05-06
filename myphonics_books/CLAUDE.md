# MyPhonicsBooks — Master System Guide

Decodable phonics books for children aged 4-8. Every book is an open window to a different contemporary culture. Parents get a print-ready A5 PDF.

**CRITICAL CONSTRAINT:** Every word must be decodable at the given level OR be a listed tricky word. See `data/graphemes_by_level.json` and `data/tricky_words_by_level.json`.

---

## Quick Start

```
/create-book L3.4
```

This runs the full 9-step workflow. See `.claude/skills/workflow-orchestrator/SKILL.md`.

---

## 9-Step Workflow

| Step | Task | Skill | Key Check |
|:-----|:-----|:------|:----------|
| 0 | Cultural Research | `cultural-researcher` | Stereotype/dignity check |
| 1 | Story Writing | `phonics-story-writer` | Engagement hooks required |
| 2 | Story QA | `book-assessor` | Phonics accuracy, narrative |
| 2b | Character Selection | `illustration-director` | Outfit suits story + culture |
| 3a-b | Object ID + Prompts | `illustration-director` | Object descriptions identical across all prompts |
| 4 | Image Generation | `art-generator` | Hero injection pipeline |
| 5 | Image QA | `illustration-director` | READ all images, verify consistency |
| 6 | Book Assembly | `book-template-designer` | PDF + debug HTML |
| 7 | Final QA | `book-assessor` | ALL 9 checks, READ images + HTML |

**Steps 5 & 7:** MUST use Read tool to VIEW every image. Check character, objects, eyes, modesty, safety.

---

## Story Writing Rules

Stories must have emotional journey + Dear Zoo-style hooks (cliffhangers, curiosity gaps, repetition with variation). Phonics compliance alone is NOT enough. Always read `phonics-story-writer` skill first.

---

## Hero Injection (Mandatory for Images)

Character consistency comes from injecting a hero reference image into every scene, NOT text descriptions. Generate hero ONCE, inject into ALL scenes. Read `art-generator` skill for full pipeline.

---

## Reading Levels

| Level | Name | Colour | Books | Key Feature |
|-------|------|--------|-------|-------------|
| L1 | Starting Stories | `#E84B8A` Pink | 10 | Set 1 graphemes. NO clusters. 6 story pages. |
| L2 | Longer Sounds | `#F59E0B` Amber | 5 | Long vowels. NO clusters. 8 pages. |
| L3 | New Spellings | `#22C55E` Green | 5 | Split digraphs. Clusters unlocked. 8 pages. |
| L4 | Building Fluency | `#3B82F6` Blue | 4 | Complex vowels. Multi-syllable. 8 pages. |
| L5 | Reading Together | `#8B5CF6` Purple | 4 | Final Set 3. Comprehension focus. 8 pages. |
| L6 | Reading Champion | `#14B8A6` Teal | 4 | Suffixes. Independent reading. 8 pages. |

Font sizes: L1=26pt, L2=22pt, L3=20pt, L4=18pt, L5=16pt, L6=14pt

**Full curriculum ladder:** `docs/curriculum_ladder.md`
**Remaining book plans:** `PRODUCTION_CHECKLIST.md` + `data/story_summaries.json`

---

## 16-Page Book Structure

```
Page 1    Front Cover (level colour, sounds row, illustration, title)
Page 2    Guide for Grown-Ups
Page 3    Combined Reference (phonics chart, story words, tricky words)
Pages 4-11  Story (L1=6 pages, L2+=8 pages)
Page 12   Combined Activity (questions, read words, draw)
Page 13   Writing Practice (4-line handwriting)
Page 14   Nonsense Words Challenge
Page 15   Reading Star Certificate
Page 16   Back Cover
```

---

## PDF Pipeline

```
generate_book.py -> Jinja2 (book_templates/book.html) -> Playwright -> A5 PDF
```

Images: `output/images/L{n}_{sub}_B{book}/` | Books: `output/books/Level{n}/`

```bash
py -3.12 scripts/generate_gemini_images.py L1       # Generate images
py -3.12 scripts/generate_pilot_books.py L1          # Generate PDF
```

---

## Key Rules

- **British English** throughout (colour, mum, favourite)
- **Font:** Andika (single-storey a/g for beginning readers)
- **We are NOT Read Write Inc** — own terminology, based on Letters and Sounds (public domain)
- **Ultimate templates:** `output/books/ultimate_templates/` — gold standard for QA comparison
- **Python 3.12** required for all scripts
