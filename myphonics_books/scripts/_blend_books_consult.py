"""Pre-L1 Blend Books — senior-literacy consult.

Sends the draft 4-book Blend Books outline to a senior SSP consultant for
critique BEFORE we generate any images or commit to text. Memory feedback:
don't wing pedagogy decisions on this product.

Writes output/blend_books/_consult_transcript.md and a structured JSON of
revised page content per book.
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

OUT = ROOT / "output" / "blend_books"
OUT.mkdir(parents=True, exist_ok=True)

# Load the draft outlines
sys.path.insert(0, str(ROOT))
from data.blend_books_outline import BLEND_BOOKS  # type: ignore

client = OpenAI()
MODEL = "gpt-4o"

SYSTEM = (
    "You are a senior systematic synthetic phonics (SSP) literacy consultant "
    "with 20+ years of UK Reception classroom experience. You have led both "
    "Letters & Sounds and Read Write Inc rollouts in primary schools. You "
    "have personally taught hundreds of 4-5 year olds to blend. You know "
    "the RWI Sound Blending Books 1-4 inside out. You have strong opinions "
    "about what works for a child who can hear individual phonemes but has "
    "not yet linked them into a whole word. Be opinionated, concrete, and "
    "specific. No waffle. If a page is wrong, say it's wrong and give the "
    "fix."
)

USER = """MyPhonicsBooks is creating a NEW pre-L1 product line: BLEND BOOKS.

These sit BEFORE our L1 'Ditties' (which are still 16-page A5 decodable
storybooks). The new Blend Books are RWI Sound Blending Book equivalents:
4 mini-books, A6 finished size, 8 pages each (cover + 6 content + back),
introducing blending progressively across SATPIN+MDGO.

CONSTRAINTS (strict, from our v2.0 Curriculum Ledger):
  - Each book uses ONLY its cumulative grapheme set.
  - Tricky words allowed: 'I' and 'the' only.
  - CVC or VC words only. No consonant clusters. No digraphs. No double
    letters. No plural-s yet.
  - Page format is picture-dominant; word/short fragment underneath.

PROGRESSION:
  - Book 1: s, a, t (3 graphemes — extremely thin)
  - Book 2: + p, i, n  (full SATPIN)
  - Book 3: + m, d
  - Book 4: + g, o  (full L1 set)

DRAFT OUTLINES TO CRITIQUE:

""" + json.dumps(BLEND_BOOKS, indent=2) + """

PLEASE PROVIDE:

1. **Book 1 verdict.** The 3-grapheme pool is brutally thin. Is the
   word-card format the right call, or would you scrap blending in Book 1
   entirely and just drill /s/, /a/, /t/ as standalone sounds (no words)?
   Or is there a smarter structure I'm missing? Be specific.

2. **Per-book page-by-page review.** For each book and each page:
   - Is the word/fragment phonically valid under the strict L1 ledger?
   - Is it image-able for a 4-5 year old? (Some words like 'at', 'as' are
     hard to picture concretely.)
   - Suggest a replacement if needed, with the new word + image prompt.

3. **Book 4 page 5 fix.** I flagged 'Mum mops' as a plural-s violation.
   Propose a replacement page that keeps the dog-and-pot through-line.

4. **Format opinion.** A6 finished, 8 pages, single-staple. Is that the
   right call for a 4-year-old's hand-and-eye? Or should they be A5?
   Should the word sit above or below the picture? Big font (40pt+)?

5. **Order of introduction within a book.** Should Book 1 page 1 always
   be a single-grapheme cue (e.g. just /s/ with a snake) before any
   blending starts? Or jump straight to VC blends like 'at'?

6. **One concrete revised JSON** for the full 4-book set, in the same
   shape as the draft, that I can commit and turn into pages. Page count
   = 6 content pages per book (covers handled separately). Each page must
   have: 'text' (or 'word'), 'image_prompt' (short, concrete, child-safe),
   and 'rationale' (why this page belongs here pedagogically).

Output the revised JSON inside a ```json ``` fence so I can parse it.
"""


def main():
    transcript_path = OUT / "_consult_transcript.md"
    revised_json_path = OUT / "blend_books_revised.json"

    print(f"Calling {MODEL}...")
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": USER},
        ],
        temperature=0.4,
    )
    content = resp.choices[0].message.content or ""

    transcript_path.write_text(
        f"# Blend Books — Senior SSP Consult\n\n"
        f"**Model:** {MODEL}\n\n"
        f"---\n\n## Prompt\n\n{USER}\n\n---\n\n## Response\n\n{content}\n",
        encoding="utf-8",
    )
    print(f"Wrote transcript: {transcript_path}")

    # Extract the JSON block
    import re
    m = re.search(r"```json\s*(.+?)```", content, re.DOTALL)
    if m:
        try:
            revised = json.loads(m.group(1))
            revised_json_path.write_text(json.dumps(revised, indent=2), encoding="utf-8")
            print(f"Wrote revised JSON: {revised_json_path}")
        except json.JSONDecodeError as e:
            print(f"Could not parse JSON block: {e}")
    else:
        print("No JSON fence found in response — see transcript.")


if __name__ == "__main__":
    main()
