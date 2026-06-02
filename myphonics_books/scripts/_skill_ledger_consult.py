"""Build a White-Rose-Maths-style SKILL LEDGER for MyPhonicsBooks.

The user's pedagogy principle: every literacy skill must have a clear lifecycle
across levels — introduced → practised → mastered → assumed knowledge — and
nothing is re-taught once it should be long-term memory. This is the source of
truth for all future worksheet design.

Four rounds (each builds on the previous):
  R1. Build the SKILL LEDGER — every individual skill with lifecycle (JSON)
  R2. Produce the PER-LEVEL VIEW — NEW / PRACTISED / ASSUMED at each level
  R3. Map the 32 published books to the ledger — coverage + gaps
  R4. Produce the PER-BOOK PACK PLAN — concrete 5-6 sheet plan for each book

Outputs:
  output/worksheet_plan/skill_ledger.json   (R1 machine-readable)
  output/worksheet_plan/skill_ledger.md     (R1+R2 human-readable)
  output/worksheet_plan/book_coverage.md    (R3)
  output/worksheet_plan/per_book_packs.json (R4 machine-readable)
  output/worksheet_plan/per_book_packs.md   (R4 human-readable)
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

# Build book inventory
def extract(text: str, key: str) -> str:
    m = re.search(rf'"{key}"\s*:\s*(\[[^\]]*\]|"[^"]*")', text)
    return m.group(1) if m else "?"


BOOK_INVENTORY: list[dict] = []
for f in sorted(DATA.glob("*_story_l*_book1.py")):
    text = f.read_text(encoding="utf-8")
    sub = re.search(r'"sub_level"\s*:\s*("?L?[\d.]+"?)', text)
    BOOK_INVENTORY.append({
        "level": sub.group(1).strip('"') if sub else "?",
        "title": extract(text, "book_title").strip('"'),
        "focus": extract(text, "focus_graphemes"),
    })

BOOK_INVENTORY_STR = "\n".join(
    f"- {b['level']} '{b['title']}' (focus: {b['focus']})"
    for b in BOOK_INVENTORY
)

graphemes = json.loads((DATA / "graphemes_by_level.json").read_text())
tricky = json.loads((DATA / "tricky_words_by_level.json").read_text())
CURRICULUM_SUMMARY = ""
for k in ["level_1", "level_2", "level_3", "level_4", "level_5", "level_6"]:
    g = graphemes[k]; t = tricky[k]
    CURRICULUM_SUMMARY += (
        f"- L{k[-1]}: NEW graphemes={g['graphemes']}; "
        f"NEW tricky={t['new_tricky_words']}; focus={g['focus_description']}\n"
    )


SYSTEM = (
    "You are a senior systematic synthetic phonics (SSP) curriculum architect with "
    "20+ years of UK Reception/KS1 classroom experience. You also know White Rose "
    "Maths inside out — the gold standard for small-step mastery progression "
    "(introduce → fluent practice → master → assumed knowledge). You are designing "
    "an MPB English-phonics curriculum to MATCH that rigour. Every skill must have "
    "a clear lifecycle. Nothing gets re-taught after the level it should be locked "
    "in. The output is the SOURCE OF TRUTH for all future worksheet design. Be "
    "exhaustive but precise. When asked for JSON, output JSON only — no prose."
)


def turn(messages, user_msg, label, force_json=False):
    messages = messages + [{"role": "user", "content": user_msg}]
    print(f"\n========== {label} ==========")
    kwargs = dict(model=MODEL, messages=messages, temperature=0.2, max_tokens=4000)
    if force_json:
        kwargs["response_format"] = {"type": "json_object"}
    resp = client.chat.completions.create(**kwargs)
    out = resp.choices[0].message.content
    messages = messages + [{"role": "assistant", "content": out}]
    print(out[:1500] + ("..." if len(out) > 1500 else ""))
    return out, messages


def main() -> None:
    messages = [{"role": "system", "content": SYSTEM}]

    # ---------- R1: SKILL LEDGER ----------
    r1, messages = turn(messages, f"""I am building a White-Rose-Maths-style SKILL LEDGER for MyPhonicsBooks
(decodable phonics for ages 4-8, levels L1-L6 mapping to RWI Red through Grey).

CURRICULUM GRAPHEMES + TRICKY WORDS:
{CURRICULUM_SUMMARY}

LEVELS AT A GLANCE:
- L1 (Reception, age 4-5): 10 books, single sounds + simple digraphs (ck/sh/nk/ch/th/ng/qu)
- L2 (Year 1, age 5-6): 6 books, long vowel sounds (ay/ee/igh/ow/oo/ar/or/air/ir/ou/oy)
- L3 (Year 1, age 6): 5 books, split digraphs + first alternative spellings
- L4 (Year 2, age 6-7): 4 books, later alternatives + multi-syllable + fluency
- L5 (Year 2, age 7): 4 books, comprehension focus + final Set 3
- L6 (Year 2, age 7-8): 4 books, suffixes + independent reading

ROUND 1 — THE SKILL LEDGER

Produce a comprehensive JSON list of EVERY individual literacy skill across the
six levels, covering four streams:
  - "handwriting" (motor + letter formation + spacing + joining)
  - "phonics-decoding" (grapheme-phoneme correspondence, blending, segmenting)
  - "spelling-encoding" (writing words, dictation, spelling rules)
  - "grammar-punctuation" (capitals, full stops, plurals, tense, etc.)
  - "vocabulary-fluency" (sight words, reading fluency, comprehension)

Each skill must have a clear lifecycle. EVERY skill carries:
  {{
    "id": "<kebab-case unique slug, e.g. 'finger-spaces'>",
    "name": "<human-readable, e.g. 'Use finger spaces between words'>",
    "category": "<one of the five above>",
    "prerequisite_skill_ids": ["<other skill ids this depends on>"],
    "introduced_at":    "<level.book>" or "<level start>" e.g. "L1.1" or "L1-start",
    "practised_through": "<level.book>" e.g. "L1.5" — the LAST level/book where this is
                        actively practised in worksheets,
    "mastered_by":      "<level.book>" e.g. "L1.10" — child is expected to do it
                        fluently and accurately,
    "assumed_from":     "<level.book>" e.g. "L2.1" — never re-taught from this point,
                        assumed long-term memory,
    "notes": "<optional one-line clarification, max 100 chars>"
  }}

Cover at MINIMUM 60 skills across the four streams. Examples to seed your
thinking — but DO NOT just use these; expand the list:
  - "finger-spaces" (handwriting)
  - "capital-i" — write capital I for the pronoun (grammar)
  - "capital-sentence-start" — capital at start of every sentence (grammar)
  - "full-stop" — full stop at end of every sentence (grammar)
  - "satpin-formation" — correctly form lowercase s, a, t, p, i, n (handwriting)
  - "blend-cvc" — blend 3 sounds into a CVC word (phonics-decoding)
  - "segment-cvc-spelling" — segment a heard CVC word into 3 sounds for spelling
  - "tricky-word-the" — read and spell 'the' (vocabulary-fluency)
  - "plurals-s" — add -s to make plurals (grammar + spelling rule)
  - "contractions-not" — read and write n't contractions (grammar)
  - "magic-e" — recognise and apply silent e (split digraph)
  - "suffix-ed-no-rule-change" — add -ed without doubling or dropping (spelling)
  - "cursive-baseline-exit" — pre-cursive exit strokes (handwriting)
  - ...

CRITICAL RULES:
1. Each skill's lifecycle must be sensible — finger spaces introduced L1.1,
   mastered_by L1.5-L1.10, assumed_from L2.1.
2. The prerequisite_skill_ids must form a DAG (no cycles).
3. If a skill is a UK-Y2-level skill (e.g. apostrophe-possessive-s), set
   introduced_at to L5.x or L6.x — do not put it in L1.
4. Be SPECIFIC: not "punctuation" but separate skills for "full-stop",
   "question-mark", "exclamation-mark", "comma-in-list" each with own lifecycle.

Output PURE JSON: {{ "skills": [ ... ] }} — no prose outside the JSON.""", "R1 Skill ledger", force_json=True)

    try:
        ledger = json.loads(r1)
        (OUT / "skill_ledger.json").write_text(
            json.dumps(ledger, indent=2), encoding="utf-8"
        )
        skill_count = len(ledger.get("skills", []))
        print(f"\n[OK] Parsed {skill_count} skills into skill_ledger.json")
    except Exception as e:
        print(f"[ERROR] Could not parse R1 JSON: {e}")
        ledger = {"skills": []}

    # ---------- R2: PER-LEVEL VIEW ----------
    r2, messages = turn(messages, """ROUND 2 — PER-LEVEL VIEW

Given the skill ledger you just built, produce a clean per-level summary showing
what's NEW, what's PRACTISED (carrying over and consolidating), and what's
ASSUMED (long-term memory) at each level L1 through L6.

Format as Markdown with one section per level:

## Level 1 (Reception, age 4-5)
**NEW skills introduced this level:** (list with skill ids)
**PRACTISED skills (still consolidating):** (list)
**ASSUMED skills (long-term memory before starting this level):** (none for L1)
**End-of-level expectation:** 2-3 sentences on what a child should fluently do.

## Level 2 (Year 1, age 5-6)
... etc

CRITICAL: A skill should appear in 'ASSUMED' at the level AFTER its 'assumed_from'
field in the ledger. The lists must be CONSISTENT with the ledger.

Also flag any OVERLAPS or REDUNDANCIES you notice in the ledger — places where a
skill is still being practised after it should already be assumed knowledge.

Under 1200 words.""", "R2 Per-level view")

    (OUT / "skill_ledger.md").write_text(
        "# MyPhonicsBooks Skill Ledger\n\n"
        "Source of truth for skill progression. Every worksheet must align to the\n"
        "lifecycle (introduce → practise → master → assumed knowledge) below.\n\n"
        "Machine-readable JSON: `skill_ledger.json`\n\n"
        "## Per-Level View\n\n" + r2,
        encoding="utf-8",
    )

    # ---------- R3: MAP 32 BOOKS TO LEDGER ----------
    r3, messages = turn(messages, f"""ROUND 3 — MAP THE 32 PUBLISHED BOOKS TO THE LEDGER

PUBLISHED BOOK INVENTORY:
{BOOK_INVENTORY_STR}

For EACH book, declare:
  - WHICH skills from the ledger does this book PRIMARILY introduce or practise?
  - Is the book's focus correctly placed in the curriculum sequence? Flag any
    book whose focus sounds clash with the level it sits at (e.g. a book using
    sounds that shouldn't be introduced yet, or vice versa).

Group output by level. For each book, give:
  - Book id (e.g. "L1.1 Tap! Tap! Tap!")
  - 'introduces' skills (list of skill ids from the ledger)
  - 'practises' skills (list)
  - One-line sequence check verdict: OK / FLAG (and why)

End with an OVERALL ASSESSMENT:
  - Are there ledger skills with NO BOOK to anchor them? (gap)
  - Are there books that don't introduce any NEW skills? (redundancy)
  - Is the sequence pedagogically sound, or do we need to renumber any books?

Under 1500 words.""", "R3 Book coverage")
    (OUT / "book_coverage.md").write_text(
        "# Book → Skill Ledger Mapping\n\n" + r3, encoding="utf-8"
    )

    # ---------- R4: PER-BOOK PACK PLAN ----------
    r4, messages = turn(messages, """ROUND 4 — THE PER-BOOK PACK PLAN

For EACH of the 32 published books, design the standard pack of worksheets
drawing FROM THE LEDGER. The pack must contain a defensible 5-6 sheets that
together advance the child along the skill ledger AT THE RIGHT POINT in their
progression — never practising a skill that should already be in long-term
memory, never demanding a skill that hasn't been introduced.

For each book, give a JSON entry:
{
  "L1.1": {
    "title": "Tap! Tap! Tap!",
    "pack": [
      {
        "slot": 1,
        "category": "phonics-decoding",
        "skill_ids": ["satpin-recognition", "blend-cvc"],
        "worksheet_type": "sound-hunt",
        "description": "<one-line, e.g. '6-column sound hunt for s a t p i n with 3 pictures per column, child circles the correct one'>"
      },
      ... 5 more slots ...
    ]
  },
  "L1.2": { ... },
  ...
}

The pack MUST include at least one of each:
  - phonics-decoding sheet
  - handwriting sheet
  - grammar-punctuation sheet (yes, at L1 too — even Capital I or full-stop hunt
    is grammar)
  - tricky-words / sight-word sheet

For L1.1, the grammar slot is the LIGHTEST possible (e.g. spot the capital I in
sentences) because the child is brand new. By L6, it's "insert adverbs" or
"contractions" level.

Output PURE JSON wrapped in ```json ... ```. No prose outside the JSON block.
Aim for completeness over brevity.""", "R4 Per-book pack plan")

    # Extract JSON
    if "```json" in r4:
        start = r4.find("```json") + 7
        end = r4.find("```", start)
        try:
            pack_plan = json.loads(r4[start:end].strip())
            (OUT / "per_book_packs.json").write_text(
                json.dumps(pack_plan, indent=2), encoding="utf-8"
            )
            print(f"\n[OK] Extracted per_book_packs.json with {len(pack_plan)} books")
        except json.JSONDecodeError as e:
            print(f"[WARN] R4 JSON parse failed: {e}")

    (OUT / "per_book_packs.md").write_text(
        "# Per-Book Pack Plan\n\nGenerated from the skill ledger. Machine-readable: per_book_packs.json\n\n" + r4,
        encoding="utf-8",
    )

    print(f"\nWrote skill_ledger.json, skill_ledger.md, book_coverage.md, per_book_packs.json, per_book_packs.md")


if __name__ == "__main__":
    main()
