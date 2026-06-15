# MyPhonicsBooks — Master System Guide

Decodable phonics books for children aged 4-8. Every book is an open window to a different contemporary culture. Parents get a print-ready A5 PDF.

**CRITICAL CONSTRAINT:** Every word must be decodable at the given level OR be a listed tricky word. See `data/graphemes_by_level.json` and `data/tricky_words_by_level.json`.

---

## Quick Start

```
/create-book L5.4
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

## Reading Levels (8-level Curriculum Ledger v2.1, realigned 2026-06-08)

| Level | Name | Colour | Books | Maps to | Year Group |
|-------|------|--------|-------|---------|------------|
| L1 | Ditties | `#E84B8A` Pink | 2 | Phase 2 sets 1-2 | Reception |
| L2 | First Sounds | `#F97066` Coral | 5 | Phase 2 sets 3-5 | Reception |
| L3 | Special Friends | `#F59E0B` Amber | 3 | Phase 3 consonant digraphs + Phase 4 | Reception |
| L4 | Longer Sounds | `#22C55E` Green | 6 | Phase 3 vowel digraphs | Reception / Year 1 |
| L5 | New Spellings | `#3B82F6` Blue | 5 | Phase 5 split digraphs + first alternatives | Year 1 |
| L6 | Building Fluency | `#6366F1` Indigo | 4 | Phase 5 more alternatives | Year 1 / Year 2 |
| L7 | Reading Together | `#8B5CF6` Purple | 4 | Late Phase 5 trigraphs | Year 2 |
| L8 | Reading Champion | `#14B8A6` Teal | 4 | Phase 6 suffix morphology | Year 2 / Year 3 |

Story font sizes: L1-L3=36pt, L4=28pt, L5=24pt, L6=20pt, L7=18pt, L8=16pt (see `STORY_FONT_SIZES` in `scripts/generate_book.py` — the single source of truth for level names, colours, ages and year groups).

**Positioning:** L6 is the target for meeting Year 2 expectations; L7-L8 are greater depth/stretch for high achievers.

**Asset remap:** old Level 1 (10 books) split into new L1/L2/L3; old L2-L6 shifted to L4-L8. Stories and image folders are still keyed by ORIGINAL ids — see `NEW_TO_OLD` in `scripts/generate_pilot_books.py`. Never regenerate images just because the public level number changed.

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

**Two editions (decided 2026-06-11):** readers fork into a Classroom edition (reusable: write-on pages p12 draw / p13 writing / p15 certificate replaced with talk-based activities — discussion questions, Sound Spotlight, oral retell, word hunts) and a Home edition (unchanged, keeps writing pages for printed PDFs). All writing and handwriting tasks live in the companion workbooks. Handwriting ladder across workbook levels: L1-2 print formation, L3-4 line placement and size, L5 pre-cursive flicks, L6 first diagonal/horizontal joins (no lead-in strokes), L7 consistent joining, L8 fluent joined writing. Join pages need a precursive font (Andika cannot join).

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
