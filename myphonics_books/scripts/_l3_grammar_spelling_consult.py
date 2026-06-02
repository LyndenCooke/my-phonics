"""L3 grammar + spelling + blending worksheet DESIGN consult.

The single-sound (phonics) sheets reuse the proven build_sound_prompt pipeline.
This consult designs the NET-NEW sheets in the L3 Complete Pack:
  - Grammar: question mark (statement vs question), capital letters for names/places
  - Spelling/tricky: he, she, we, me, be (look-cover-write-check)
  - Blending: adjacent consonant clusters (st, sp, bl, cr, fr, ...)

We ask the SSP consultant for a concrete, A4-portrait layout per sheet so we can
turn each into a gpt-image worksheet prompt that matches the house style
(pink banner, pastel boxes, grey footer, 3-zone handwriting lines, pure-black-dot eyes).

Output: output/worksheet_plan/l3_grammar_spelling_design.md + .json
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

from openai import OpenAI

ROOT = Path(__file__).resolve().parent.parent
for line in (ROOT / ".env").read_text(encoding="utf-8", errors="ignore").splitlines():
    if line.startswith("OPENAI_API_KEY="):
        os.environ["OPENAI_API_KEY"] = line.split("=", 1)[1].strip()

OUT = ROOT / "output" / "worksheet_plan"
client = OpenAI()
MODEL = "gpt-4o"

SYSTEM = (
    "You are a senior UK SSP literacy consultant designing printable A4 worksheets "
    "for 5-6 year olds (Reception/Year 1). You know the National Curriculum KS1 "
    "English requirements and RWI/Letters & Sounds. You design clean, teacher-ready "
    "single-page worksheets — one clear learning objective per sheet, generous white "
    "space, no clutter. You output concrete layouts a designer can build verbatim."
)

USER = """We are building the LEVEL 3 ('Special Friends') Complete Pack for MyPhonicsBooks.
The phonics/sound sheets (ch, th, ng, qu, zz) are already handled by another pipeline.

Design the NET-NEW sheets below. Constraints common to ALL sheets:
- A4 portrait. Pink (#E84B8A) top banner with the sheet title + a "Level 3" chip.
- Grey footer: "MyPhonicsBooks · decodable phonics practice".
- House style: soft pastel rounded boxes, cute simple cartoons, pure-black-dot eyes
  on any character/animal, 3-zone handwriting lines where children write (solid
  baseline, dashed midline, dotted topline), lowercase single-storey 'a', no serifs.
- DECODABLE RULE for L3: only graphemes taught by L3 may appear in words children
  READ or WRITE (all single letters + ck, ff, ll, ss, zz, sh, ch, th, ng, nk, qu;
  adjacent consonant clusters allowed). Tricky words allowed: I, the, no, go, to,
  into, is, he, she, we, me, be. Sentence length 4-7 words.
- British English. No brand names. No text baked into pictures.

SHEETS TO DESIGN (one concrete layout each):

1. GRAMMAR — "Full Stop or Question Mark?"
   Objective: child decides if a sentence is a statement or a question and writes
   the correct end mark. (Question mark is newly taught at L3.)

2. GRAMMAR — "Capital Letters for Names"
   Objective: capital letters for names of people and places. Child rewrites or
   marks the capital at the start of given names.

3. SPELLING / TRICKY WORDS — "he she we me be"
   Objective: look-cover-write-check practice of the 5 new L3 tricky words.

4. BLENDING — "Blend the Clusters"
   Objective: read/build CCVC and CVCC words with adjacent consonant clusters
   (st, sp, sn, bl, cr, fr, fl, gr, etc.). Phase-4 adjacent-consonant skill.

For EACH sheet return a JSON object with:
  "title": banner title text
  "objective": one line
  "sections": array of 2-3 sections, each {"heading", "instruction", "layout"}
     where "layout" concretely describes rows/cells/pictures/lines so a designer
     can build it exactly (name the example words and pictures to use — all
     decodable per the L3 rule above).
  "word_list": the exact decodable words/sentences used on the sheet
  "image_dictionary": [word, concrete child-safe picture description] for every picture

Return ONE JSON object keyed "sheet_1".."sheet_4" inside a ```json fence. No prose.
"""


def main():
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "system", "content": SYSTEM}, {"role": "user", "content": USER}],
        temperature=0.4,
    )
    content = resp.choices[0].message.content or ""
    (OUT / "l3_grammar_spelling_design.md").write_text(
        f"# L3 Grammar/Spelling/Blending Design\n\n{content}\n", encoding="utf-8")
    m = re.search(r"```json\s*(.+?)```", content, re.DOTALL)
    if m:
        try:
            data = json.loads(m.group(1))
            (OUT / "l3_grammar_spelling_design.json").write_text(
                json.dumps(data, indent=2), encoding="utf-8")
            print("Wrote l3_grammar_spelling_design.json with sheets:", list(data.keys()))
        except json.JSONDecodeError as e:
            print("JSON parse failed:", e)
    else:
        print("No JSON fence; see .md")


if __name__ == "__main__":
    main()
