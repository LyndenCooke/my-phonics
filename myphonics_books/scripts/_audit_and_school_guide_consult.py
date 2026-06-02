"""Audit of current MPB inventory + design of a schools curriculum guide.

Inputs:
  - All 32 book data files (titles, focus sounds, tricky words, words used)
  - The just-completed curriculum_journey.md
  - The pack_composition.json (target structure per level)
  - Current worksheet-pack shipped state (L1.1, L1.2, L1.3 — both book + sound packs)

Three rounds:
  R1. AUDIT — strengths/weaknesses of the current product for school adoption
  R2. GAP ANALYSIS — what's missing; ordered by school-buying-readiness priority
  R3. SCHOOLS CURRICULUM GUIDE — week-by-week scope and sequence
     (the headline deliverable: a teacher-facing planning document)

Outputs:
  output/worksheet_plan/audit_and_gaps.md
  output/worksheet_plan/schools_curriculum_guide.md
"""
from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path
from openai import OpenAI

ROOT = Path(__file__).resolve().parent.parent
env = ROOT / ".env"
for line in env.read_text().splitlines():
    if line.startswith("OPENAI_API_KEY="):
        os.environ["OPENAI_API_KEY"] = line.split("=", 1)[1].strip()

OUT = ROOT / "output" / "worksheet_plan"
DATA = ROOT / "data"

client = OpenAI()
MODEL = "gpt-4o"

# -------- Build book inventory by parsing data/*_story_l*_book1.py --------
def extract(text: str, key: str) -> str:
    m = re.search(rf'"{key}"\s*:\s*(\[[^\]]*\]|"[^"]*")', text)
    return m.group(1) if m else "?"


BOOK_INVENTORY: list[dict] = []
for f in sorted(DATA.glob("*_story_l*_book1.py")):
    text = f.read_text(encoding="utf-8")
    title = extract(text, "book_title")
    focus = extract(text, "focus_graphemes")
    tricky = extract(text, "tricky_words_used")
    story_words = extract(text, "story_words")
    sub_level_m = re.search(r'"sub_level"\s*:\s*("?L?[\d.]+"?)', text)
    sub = sub_level_m.group(1).strip('"') if sub_level_m else "?"
    BOOK_INVENTORY.append({
        "level": sub,
        "title": title.strip('"'),
        "focus_sounds": focus,
        "tricky_words_used": tricky,
        "story_words": story_words,
    })

BOOK_INVENTORY_STR = "\n".join(
    f"- {b['level']} '{b['title']}' — focus: {b['focus_sounds']}, "
    f"tricky: {b['tricky_words_used']}, story_words: {b['story_words']}"
    for b in BOOK_INVENTORY
)

# -------- Current worksheet-shipped state --------
WORKSHEET_STATE = """
Already shipped (5 sheets per book + matching single-sound pack):
  - L1.1 Tap! Tap! Tap! — 5-pack (Sound Hunt, Trace+Write, Read+Do, Alien Word, Story+Draw)
    + 6 SATPIN single-sound sheets
  - L1.2 The Mud on the Dog — 5-pack (same structure) + 4 single-sound (m d g o)
  - L1.3 The Fish in the Tank — 5-pack (Sound Hunt, Trace+Write, Read+Do, Alien Word,
    Sound Sort) + 2 single-digraph (sh, nk)
    NOTE: L1.3 replaced 'Story+Draw' with 'Sound Sort' per direction shift to skill-only.

Not yet shipped:
  - L1.4 through L1.10 (focus sounds locked, character refs exist for all 10)
  - L2.1 through L2.6
  - L3.1 through L3.5
  - L4.1 through L4.4
  - L5.1 through L5.4
  - L6.1 through L6.4
  = 25 books × 5-7 worksheets each = ~125-175 worksheet sheets remaining
"""

# -------- Read the journey plan and pack composition --------
journey = (OUT / "curriculum_journey.md").read_text(encoding="utf-8")
try:
    pack_comp = json.dumps(
        json.loads((OUT / "pack_composition.json").read_text(encoding="utf-8")),
        indent=2,
    )
except FileNotFoundError:
    pack_comp = "(pack_composition.json not yet generated)"


SYSTEM = (
    "You are a senior systematic synthetic phonics (SSP) literacy consultant with "
    "20+ years of UK and Gulf-region primary classroom experience. You have led "
    "RWI/Letters & Sounds rollouts in MAT schools, IB schools, and Saudi/UAE "
    "international schools. You speak the language of headteachers and English "
    "subject leads, not of curriculum theorists. You write practical, "
    "teacher-facing guides that head-teachers actually USE. You are concrete, "
    "opinionated, and pragmatic — you flag risks and skip platitudes."
)


def turn(messages: list[dict], user_msg: str, round_label: str) -> tuple[str, list[dict]]:
    messages = messages + [{"role": "user", "content": user_msg}]
    print(f"\n========== {round_label} ==========")
    resp = client.chat.completions.create(
        model=MODEL, messages=messages, temperature=0.3, max_tokens=4000
    )
    out = resp.choices[0].message.content
    messages = messages + [{"role": "assistant", "content": out}]
    print(out[:1200] + ("..." if len(out) > 1200 else ""))
    return out, messages


def main() -> None:
    messages: list[dict] = [{"role": "system", "content": SYSTEM}]

    # -------- ROUND 1: AUDIT --------
    r1, messages = turn(messages, f"""I am preparing MyPhonicsBooks (decodable English phonics books for ages 4-8) for
adoption by Saudi Arabian primary schools. The product currently has 32 published
decodable books across 6 levels, plus 3 worksheet packs shipped (L1.1, L1.2, L1.3).
We just designed a comprehensive curriculum journey (handwriting + grammar +
spelling × L1-L6) and a per-level pack composition. Now I need you to AUDIT what
we have and identify what's missing for institutional school sale.

================================================================
CURRENT BOOK INVENTORY (32 published decodable books):
{BOOK_INVENTORY_STR}
================================================================

CURRENT WORKSHEET STATE:
{WORKSHEET_STATE}

================================================================
JUST-DESIGNED CURRICULUM JOURNEY (handwriting / grammar / spelling):
{journey[:4000]}
[... truncated for context — full doc in repo ...]
================================================================

JUST-DESIGNED PACK COMPOSITION (per level):
{pack_comp[:3000]}
================================================================

ROUND 1 — AUDIT

Give me an honest, ruthless audit of the current product as a school-sellable
phonics curriculum. Use this structure:

1. STRENGTHS (what we have that schools will actually buy)
   - For each strength, name the specific evidence in the inventory above.
2. WEAKNESSES (what's missing or weak)
   - For each weakness, be SPECIFIC. E.g. "no comprehension assessments aligned to
     levels" not "needs more assessment." Name what's actually absent.
3. PHONICS PROGRESSION INTEGRITY
   - Does the sound progression across the 32 books actually work? Flag any
     gaps, overlaps, or ordering issues you spot.
4. BREADTH OF CONTENT
   - Does the book content cover enough variety (story types, cultural settings,
     themes)? Is the volume adequate for a full school year per level?

Under 1000 words. Cite specific book titles when you make a claim.""", "ROUND 1 — Audit")

    # -------- ROUND 2: GAP ANALYSIS --------
    r2, messages = turn(messages, """ROUND 2 — GAP ANALYSIS PRIORITISED FOR SCHOOL ADOPTION

A Saudi primary school is deciding whether to adopt MyPhonicsBooks. They will say
YES if (in order of decisiveness):

  - It looks comprehensive (covers a full year per level, all phonics + handwriting
    + grammar + spelling)
  - It's predictable (every book follows the same pack structure; teachers can plan)
  - It has assessment tools (so progression is measurable)
  - It has a TEACHER'S CURRICULUM GUIDE (so a non-specialist teacher can pick it
    up and run it)
  - It's culturally OK (no haram content, hijab acceptable, no Christmas etc.)

Given the audit, list the GAPS we need to close in priority order. For each gap:

  - WHAT it is (specific, measurable)
  - WHY a school cares
  - EFFORT to build (small / medium / large)
  - ORDER it should be done in

Group into:
  IMMEDIATE BLOCKERS (won't sign without this)
  STRONG-WANTS (will significantly improve chance of sign)
  NICE-TO-HAVES (post-sign expansion)

Under 800 words.""", "ROUND 2 — Gap analysis")

    # -------- ROUND 3: SCHOOLS CURRICULUM GUIDE --------
    r3, messages = turn(messages, """ROUND 3 — THE SCHOOLS CURRICULUM GUIDE (the headline deliverable)

Write the actual SCHOOLS CURRICULUM GUIDE that we will give to a head-teacher or
English subject lead when they evaluate MyPhonicsBooks. This is the document the
school's English coordinator reads first.

Required sections:

# MyPhonicsBooks — Schools Curriculum Guide

## At a glance
- 1 paragraph summary of the whole programme
- A table showing levels, age range, RWI mapping, number of books, expected weeks

## Phonics progression
- Compact table showing graphemes introduced at each level (use the 32-book data
  above; build a clean table from real focus_graphemes)

## Weekly scope and sequence
- For EACH of the 6 levels, give a sample "10-week plan" or "weeks-per-book"
  table showing which book a class would cover when, plus suggested worksheet
  slots (drawing on the pack_composition designed earlier).
- Be concrete. E.g. "Week 1: Book L1.1 — read Mon-Wed, worksheet Trace+Write
  Tues, worksheet Sound Hunt Thurs, group dictation Fri."

## Handwriting journey at a glance
- 1 paragraph + small diagram description of progression L1→L6

## Grammar journey at a glance
- Same

## Spelling/orthography journey
- Same

## Assessment
- What the teacher should be checking at the end of each level
- Suggested in-class checks the teacher can run (these may be products we still
  need to BUILD — that's fine, list them so we know what we still owe schools)

## Pacing for different cohorts
- A note for native-English schools vs EAL (Saudi) schools — explicit time
  adjustments where relevant.

Output as MARKDOWN. Aim for a guide a school could print as a 6-8 page PDF and
hand to teachers. Under 2000 words. Be concrete and useful — not aspirational.""", "ROUND 3 — Schools curriculum guide")

    # Save outputs
    (OUT / "audit_and_gaps.md").write_text(
        "# MyPhonicsBooks — Audit + Gap Analysis (for school adoption)\n\n"
        "## Round 1 — Audit\n\n" + r1 + "\n\n## Round 2 — Gap Analysis\n\n" + r2,
        encoding="utf-8",
    )
    (OUT / "schools_curriculum_guide.md").write_text(r3, encoding="utf-8")

    print(f"\nWrote {OUT / 'audit_and_gaps.md'}")
    print(f"Wrote {OUT / 'schools_curriculum_guide.md'}")
    print(f"\nInventory parsed: {len(BOOK_INVENTORY)} books")


if __name__ == "__main__":
    main()
