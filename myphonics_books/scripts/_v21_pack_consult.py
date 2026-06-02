"""v2.1 per-book worksheet pack content consult.

For a given book ID (e.g. L1_1), asks the SSP consultant to produce concrete
page-by-page content for the 6-page pack defined in the Curriculum Ledger v2.1
Worksheet Pack System section. Strict decodable to the book's level.

Output: output/worksheet_plan/v21_packs/{book_id}_pack.json
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path

from openai import OpenAI

ROOT = Path(__file__).resolve().parent.parent
for line in (ROOT / ".env").read_text(encoding="utf-8", errors="ignore").splitlines():
    if line.startswith("OPENAI_API_KEY="):
        os.environ["OPENAI_API_KEY"] = line.split("=", 1)[1].strip()

OUT = ROOT / "output" / "worksheet_plan" / "v21_packs"
OUT.mkdir(parents=True, exist_ok=True)

client = OpenAI()
MODEL = "gpt-4o"

# Per-level decodable rule + tricky words + sentence length (from ledger)
LEVEL_SPEC = {
    1: {
        "name": "Ditties",
        "decodable": "Only s, a, t, p, i, n, m, d, g, o. No clusters, no digraphs, no doubles. CVC or VC.",
        "tricky": "I, the",
        "sentence_len": "3-5 words",
        "writing_track": "Form lowercase letters correctly; finger spaces; compose orally before writing.",
    },
    2: {
        "name": "First Sounds",
        "decodable": "L1 + c, k, ck, e, u, r, h, b, f, ff, l, ll, ss, j, v, w, x, y, z. CVC/CVCC with doubles. No vowel digraphs.",
        "tricky": "I, the, no, go, to, into, is",
        "sentence_len": "3-6 words",
        "writing_track": "Capital at sentence start, full stop, capital I, finger spaces consolidated.",
    },
    3: {
        "name": "Special Friends",
        "decodable": "L1-L2 + sh, nk, ch, th, ng, qu, zz. CCVC/CVCC with adjacent clusters now permitted.",
        "tricky": "L2 + he, she, we, me, be",
        "sentence_len": "4-7 words",
        "writing_track": "Capital letters for names of people and places; question mark introduced.",
    },
    # L4-L8 spec to be filled in when those packs are built
}

PAGE_SPEC = {
    1: "Handwriting and formation",
    2: "Spelling pattern practise",
    3: "Grammar mini-skill",
    4: "Sentence writing (Say it. Tap it. Write it. Check it.)",
    5: "Book-linked activity (comprehension/retrieval tied to THIS book)",
    6: "Review or challenge (mixed practise, mini-assessment)",
}


def build_user(book_id: str, level: int, book_title: str, book_summary: str,
               focus_graphemes: list[str], story_words: list[str],
               characters: str) -> str:
    spec = LEVEL_SPEC[level]
    pages_md = "\n".join(f"  Page {n}. {desc}" for n, desc in PAGE_SPEC.items())
    return f"""Produce concrete page-by-page worksheet content for a NEW 6-page pack
for book {book_id} — "{book_title}" (Level {level}, {spec['name']}).

BOOK CONTEXT
- Summary: {book_summary}
- Focus sounds for this book: {", ".join(focus_graphemes)}
- Story words used in the book: {", ".join(story_words)}
- Characters / setting (for the book-linked Page 5): {characters}

LEVEL CONSTRAINTS (strict)
- Decodable rule: {spec['decodable']}
- Tricky words allowed: {spec['tricky']}
- Sentence length band: {spec['sentence_len']}
- Writing track: {spec['writing_track']}

THE PACK (6 pages, fixed order)
{pages_md}

PAGE-LEVEL DIRECTIONS (from the Curriculum Ledger v2.1 Worksheet Pack System):

Page 1 — Handwriting (for Level {level}): choose 1-2 specific activity types from
the L{level} handwriting activity bank in the ledger (e.g. for L1: rainbow trace
with start-dot + arrow, pencil-path patterns, find-the-letter grid).

Page 2 — Spelling pattern practise (for Level {level}): choose 1-2 from the L{level}
spelling bank (e.g. for L1: match picture to initial sound, write missing sound
in a CVC word).

Page 3 — Grammar mini-skill (for Level {level}): pick the primary grammar focus
from the L{level} grammar activity types and design ONE clear sheet. For L1 the
primary format is "Orally-composed caption frame" (Hold a Sentence).

Page 4 — Sentence writing: the "Say it. Tap it. Write it. Check it." routine.
For L1 this is "Copy a caption from a model" (picture + caption above + writing
line below).

Page 5 — Book-linked activity: pick ONE activity from the ledger Page 5 bank that
suits THIS specific book. For L1 with this book, candidates: "Draw and label a
character", "Find 3 words with today's sound in the book", "Answer 3 questions
about the story (literal)". Use the actual characters/setting above. Re-read the
book IS the goal — don't avoid it.

Page 6 — Review or challenge (for L{level}): the L{level} review format (e.g. for
L1: "Circle the sound; trace the letter; copy the caption. 3 quick tasks.").

OUTPUT — strict JSON inside a ```json fence with this exact shape:

{{
  "book_id": "{book_id}",
  "level": {level},
  "book_title": "{book_title}",
  "pages": [
    {{
      "page_num": 1,
      "title": "<banner title>",
      "skill_chip": "<Handwriting | Spelling | Grammar | Sentence Writing | Book-Linked | Review>",
      "objective": "<one line, what this page teaches>",
      "sections": [
        {{
          "heading": "<section heading>",
          "instruction": "<child-facing instruction, one sentence>",
          "layout": "<concrete physical layout: rows, cells, picture positions, lines, boxes — written so a designer can build it exactly>",
          "content": "<the exact words/letters/sentences/example words this section uses>"
        }}
      ],
      "image_dictionary": [["word_or_concept", "concrete child-safe picture description"]],
      "word_inventory": "<every distinct word that appears anywhere on the page; verify each is decodable or on the tricky list above>"
    }},
    ... 5 more pages ...
  ]
}}

CRITICAL: every word in word_inventory MUST be decodable per the level's rule
above, or in the tricky list. Reject your own draft if any word violates this.
No prose outside the JSON.
"""


# Pre-loaded book metadata for the pilot. Other books wired in as we go.
BOOKS = {
    "L1_1": {
        "level": 1,
        "book_title": "Tap! Tap! Tap!",
        "book_summary": (
            "A small child sitting on a mat hears tap, tap, tap — guesses what it "
            "is (a rat? a bat?) before discovering a friendly fat cat tapping with "
            "its paw. The child pats the cat, the cat naps, the child is happy."
        ),
        "focus_graphemes": ["s", "a", "t", "p", "i", "n"],
        "story_words": ["sit", "mat", "tap", "rat", "bat", "pat", "cat", "fat", "naps"],
        "characters": (
            "A young child (white British boy, brown hair, green-stripe t-shirt, blue "
            "trousers) and a fat friendly ginger cat. Setting: the child's home — sitting "
            "on a striped mat on a wooden floor."
        ),
    },
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("book_id", help="e.g. L1_1")
    args = ap.parse_args()
    meta = BOOKS[args.book_id]

    user = build_user(args.book_id, meta["level"], meta["book_title"],
                      meta["book_summary"], meta["focus_graphemes"],
                      meta["story_words"], meta["characters"])
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system",
             "content": ("You are a senior UK SSP literacy consultant designing "
                         "printable A4 worksheets for Reception/KS1 children. You "
                         "follow the National Curriculum and RWI/Letters & Sounds. "
                         "You output strict JSON, no prose.")},
            {"role": "user", "content": user},
        ],
        temperature=0.3,
    )
    content = resp.choices[0].message.content or ""
    md_path = OUT / f"{args.book_id}_pack.md"
    md_path.write_text(f"# v2.1 pack consult — {args.book_id}\n\n{content}\n",
                       encoding="utf-8")

    m = re.search(r"```json\s*(.+?)```", content, re.DOTALL)
    if m:
        try:
            data = json.loads(m.group(1))
            out_path = OUT / f"{args.book_id}_pack.json"
            out_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
            print(f"Wrote {out_path}")
        except json.JSONDecodeError as e:
            print(f"JSON parse failed: {e}")
    else:
        print(f"No JSON fence in response — see {md_path}")


if __name__ == "__main__":
    main()
