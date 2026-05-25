"""Focused L1.2 worksheet pack consult.

The 3-round generic library design already ran (see ../output/worksheet_plan/plan.json).
L1.1 has been built and shipped using a specific 5-worksheet pack (Sound Hunt,
Trace & Write, Read & Do, Alien Words, Story & Draw). This script asks the
SSP consultant to specialise that proven pack for L1.2 'The Mud on the Dog'
focus sounds m, d, g, o on top of cumulative SATPIN.

Writes output/worksheet_plan/L1_2_plan.md (human-readable) + L1_2_plan.json (machine-readable).
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from openai import OpenAI

ROOT = Path(__file__).resolve().parent.parent
env = ROOT / ".env"
for line in env.read_text().splitlines():
    if line.startswith("OPENAI_API_KEY="):
        os.environ["OPENAI_API_KEY"] = line.split("=", 1)[1].strip()

OUT = ROOT / "output" / "worksheet_plan"
OUT.mkdir(parents=True, exist_ok=True)

client = OpenAI()
MODEL = "gpt-4o"

SYSTEM = (
    "You are a senior systematic synthetic phonics (SSP) literacy consultant "
    "with 20+ years of UK Reception/KS1 classroom experience. You have led "
    "Letters & Sounds and Read Write Inc rollouts. You design printable "
    "worksheets that real teachers actually use, not generic colour-and-trace "
    "filler. Worksheets must drill standalone phonics skills — never re-tell "
    "the story (the book already does that). Be opinionated, concrete, and "
    "specific. Output structured plans, not waffle."
)

USER = """We have shipped the L1.1 worksheet pack for 'Tap! Tap! Tap!' (SATPIN).
The proven 5-worksheet structure for L1 books is:

  1. Sound Hunt        — 6 columns, one per focus letter; child circles the
                         picture (of 3) that starts with that sound.
  2. Trace and Write   — two 3-zone handwriting strips covering all focus
                         letters; solid model letter then 4 dotted traces.
  3. Read and Do       — short decodable sentences each with a tiny action
                         the child performs ("Tap your nose").
  4. Alien Word Mission — grid of nonsense CVC words using focus sounds; child
                         reads and ticks/marks the ones that 'sound real'.
  5. Story and Draw    — a tiny re-read prompt + a generous draw box ("Draw
                         the part where ___"). Note: this is the ONE
                         book-tied sheet; the other four are pure skill drill.

LEVEL 1.2 — 'The Mud on the Dog'
  - NEW focus graphemes: m, d, g, o
  - Cumulative graphemes available: s a t p i n m d g o (and that's it)
  - Tricky words available: the, to, I, no, go, into, me
  - Story words from the book: dog, mud, mop, mum, mess, got, big, tub
    (Note: 'big' uses b, which is NOT yet introduced at L1.2 — flag if a
    worksheet needs to avoid it; for this pack we should stick strictly to
    s a t p i n m d g o.)
  - Decodable nonsense words pre-vetted: mog, dum, gop, dob, mib, gat, dom,
    mug, dop, gum, mod, gim  (note: 'mib', 'gat' use untaught letters — flag)
  - Character on the page: British-Asian girl (NOT the boy+cat from L1.1)
  - Page format: A4 portrait, B/W friendly, single child working solo

YOUR TASK — specialise the 5-worksheet pack for L1.2:

For each of the 5 worksheets, give me:

  - **Title** (child-facing, e.g. "Sound Hunt: m d g o")
  - **Focus** (which exact letters/sounds it drills)
  - **Content spec** (what pictures, what words, what letters appear — be
    explicit. e.g. for Sound Hunt: 4 columns m/d/g/o with which correct
    picture and which 2 distractors per column. ONLY use words/pictures
    decodable at L1.2 — no b, no e, no u except in approved tricky words.)
  - **Layout notes** (anything special: number of columns, strips,
    boxes; banner colour stays pink #E84B8A; title block; activity blocks)
  - **Pedagogical justification** (1 sentence — why this exact drill at
    pack-position N for a child who just finished L1.1)

Rules:
  - The Sound Hunt MUST be 4 columns (one per new sound m d g o), NOT 6 —
    because we're drilling the NEW sounds, not re-testing SATPIN.
  - The Trace and Write must be EXACTLY two strips: strip 1 = m d, strip 2
    = g o (so the new letters get full real estate; SATPIN is in old packs).
  - Read and Do sentences must use ONLY s a t p i n m d g o + listed tricky.
    Give me 4 concrete sentences with the action verb embedded.
  - Alien Word Mission must use ONLY decodable letters. Give me 8 alien
    words (mix of real-vs-fake or all fake — your call, defend it). Flag
    'mib' and 'gat' if you don't like them.
  - Story and Draw must NOT make the child sequence the story. Just one
    short prompt with a single draw box.

OUTPUT FORMAT — strict JSON, no prose outside the JSON block. Schema:

```json
{
  "level": "L1.2",
  "book_title": "The Mud on the Dog",
  "focus_sounds": ["m", "d", "g", "o"],
  "worksheets": [
    {
      "n": 1,
      "title": "...",
      "focus": "...",
      "content_spec": "...",
      "layout_notes": "...",
      "justification": "..."
    },
    ...
  ],
  "warnings": ["any flags about words/letters/pictures that don't fit L1.2"]
}
```
"""


def main() -> None:
    print("Calling consultant for L1.2...")
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": USER},
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    plan_json = resp.choices[0].message.content
    plan = json.loads(plan_json)

    (OUT / "L1_2_plan.json").write_text(
        json.dumps(plan, indent=2), encoding="utf-8"
    )

    # Human-readable rendering
    md = [f"# L1.2 Worksheet Plan — {plan['book_title']}",
          "",
          f"**Focus sounds:** {' '.join(plan['focus_sounds'])}",
          ""]
    for w in plan["worksheets"]:
        md.append(f"## {w['n']}. {w['title']}")
        md.append("")
        md.append(f"**Focus:** {w['focus']}")
        md.append("")
        md.append(f"**Content spec:** {w['content_spec']}")
        md.append("")
        md.append(f"**Layout:** {w['layout_notes']}")
        md.append("")
        md.append(f"**Why pack-position {w['n']}:** {w['justification']}")
        md.append("")
    if plan.get("warnings"):
        md.append("## Warnings / Flags")
        md.append("")
        for w in plan["warnings"]:
            md.append(f"- {w}")
        md.append("")
    (OUT / "L1_2_plan.md").write_text("\n".join(md), encoding="utf-8")

    print(f"\nWrote {OUT / 'L1_2_plan.md'}")
    print(f"Wrote {OUT / 'L1_2_plan.json'}")
    print("\n----- Plan -----")
    print((OUT / "L1_2_plan.md").read_text(encoding="utf-8"))


if __name__ == "__main__":
    main()
