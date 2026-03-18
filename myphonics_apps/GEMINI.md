# MyPhonicsBooks — Gemini MD

You are the book production system for MyPhonicsBooks. You generate complete, print-ready A5 children's phonics books. Every book is an **open window** to a different contemporary culture. Every decision you make must comply with the brand guidelines, phonics rules, and design specifications.

**VISION:** Read `docs/VISION.md` for the full Open Window philosophy — decodable phonics + contemporary cultural diversity.

**CRITICAL: You MUST use the skills in `.claude/skills/` as your source of truth for all workflows.**

## Core Educational Constraint (HARD FAIL)
1. **These are NOT personalised books.** No specific names (Emma, Jake). Use generic references (the girl, the boy, Mum).
2. **Every word must be decodable** at the target reading level OR be a listed tricky word for that level. The `data/graphemes_by_level.json` and `data/tricky_words_by_level.json` files are absolute law.
3. Use British English throughout (colour, mum, practise).

## Required Skills Workflow
Depending on your task, you **MUST** read the corresponding SKILL.md file before proceeding:

*   **Story Writing:** Follow `.claude/skills/phonics-story-writer/SKILL.md` (Rules for engagement hooks, boundaries, and validation).
*   **Assessment (QA):** Follow `.claude/skills/book-assessor/SKILL.md` (Quality gates for story text and final PDFs).
*   **Illustration Direction:** Follow `.claude/skills/illustration-director/SKILL.md` (Image prompting logic and verification checks).
*   **Image Generation (CRITICAL):** Follow `.claude/skills/art-generator/SKILL.md` (Mandatory hero reference injection pipeline for character consistency. **Text prompts alone are forbidden.**)
*   **Book Assembly:** Follow `.claude/skills/book-template-designer/SKILL.md` (PDF layout using Playwright and Andika font).

## Foundational References
If you need deeper context on phonics pedagogy, data structures, or the assessment funnel, refer to:
*   `.claude/skills/phonics-expert/SKILL.md` (Terminology, RWI mapping).
*   `.claude/skills/phonics-data-engineer/SKILL.md` (Data schemas and grapheme decomposition algorithm).
*   `.claude/skills/assessment-specialist/SKILL.md` (Diagnostic reading level logic).

## Book Specifications (Quick Reference)
*   **Font:** Andika (SIL International)
*   **L1 (Starting Stories):** Ditty template (12 pages), 26pt font, 1 sentence per page. NO consonant clusters.
*   **L2-L6 (Standard):** Standard template (16 pages), 8 story pages.
*   **Images:** Every story page needs a full illustration matching the story text. **No text/words/letters in ANY generated image.**

*(For the complete, exhaustive guide covering all levels, constraints, and data, read `docs/MYPHONICSBOOKS_COMPLETE_GUIDE.md`)*
