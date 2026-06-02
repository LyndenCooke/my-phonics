"""L4 grammar + spelling design consult.

Designs the bespoke NET-NEW sheets in the L4 Complete Pack (everything beyond
the 12 single-sound sheets). Sheets to design:
  - Joining clauses with 'and'
  - Three-way punctuation choose (. ? !)  — exclamation mark newly taught
  - Days of the week capital fix
  - Singular/plural picture sort (-s vs -es)
  - Suffix wheel (-s/-ing/-ed/-er, NO root change)
  - Tricky words (was/my/you/they/her/all/are) — Read & Match

Output: output/worksheet_plan/l4_grammar_spelling_design.{md,json}
"""
from __future__ import annotations
import json, os, re
from pathlib import Path
from openai import OpenAI

ROOT = Path(__file__).resolve().parent.parent
for line in (ROOT / ".env").read_text(encoding="utf-8", errors="ignore").splitlines():
    if line.startswith("OPENAI_API_KEY="):
        os.environ["OPENAI_API_KEY"] = line.split("=", 1)[1].strip()
OUT = ROOT / "output" / "worksheet_plan"
client = OpenAI()

SYSTEM = ("You are a senior UK SSP literacy consultant designing printable A4 "
          "worksheets for Reception/Year 1 children. National Curriculum + RWI/L&S. "
          "Concrete teacher-ready layouts. Output strict JSON only.")

USER = """LEVEL 4 ('Longer Sounds') Complete Pack — design the bespoke NET-NEW sheets.

The 12 single-sound sheets (ay/ee/igh/ow/oo-long/oo-short/ar/or/air/ir/ou/oy) are
handled by another pipeline. Design these SIX sheets to round out the L4 pack:

Common constraints (binding):
- A4 portrait. GREEN banner #22C55E (L4 colour — NOT pink).
- House style: pink-style rounded boxes, cute simple cartoons, grey footer,
  3-zone handwriting lines, lowercase single-storey a no serifs, pure-black-dot
  eyes on any character/animal, British English, NO text baked into pictures.
- DECODABLE RULE for L4: all single letters + ck, ff, ll, ss, zz, sh, ch, th,
  ng, nk, qu, and the L4 vowel digraphs (ay, ee, igh, ow, oo, ar, or, air, ir,
  ou, oy). Tricky words allowed: I, the, no, go, to, into, is, he, she, we, me,
  be, was, my, you, they, her, all, are. Adjacent consonant clusters permitted.
  Sentence length 4-8 words.

SHEETS TO DESIGN:

1. GRAMMAR — "Join with 'and'"
   Objective: take two short clauses and join them into one sentence using 'and'.

2. GRAMMAR — "Full Stop, Question Mark or Exclamation Mark?"
   Objective: child reads each sentence and writes the correct end mark (. or ? or !).
   Exclamation mark is newly taught at L4.

3. GRAMMAR — "Days of the Week"
   Objective: capital letter for days of the week. Child rewrites lowercase day-names
   with capitals.

4. SPELLING — "One or Many?" (singular/plural)
   Objective: form regular plurals with -s and -es. Picture sort (1 vs many) with
   the -s and -es endings colour-coded.

5. SPELLING — "Suffix Wheel"
   Objective: add -s, -ing, -ed (and optionally -er) to a root word with NO root
   change (jump → jumps, jumping, jumped). Petal/wheel layout.

6. TRICKY WORDS — "Read and Match" (same format as L3)
   Objective: match each new tricky word (was, my, you, they, her, all, are) to a
   picture that shows its meaning. Pictures on the left, words shuffled on the right,
   draw a line.

For EACH sheet return a JSON object with keys:
  "title", "skill_chip", "objective",
  "sections": [ { "heading", "instruction", "layout", "content" } ],
  "word_list": every distinct word that appears anywhere on the page,
  "image_dictionary": [[word_or_concept, concrete child-safe picture description]]

CRITICAL: every word in word_list MUST be L4-decodable per the rule above or in
the tricky list. Reject your own draft if any word violates this — common slips
include 'when/then/them/their' (L5), 'love/come' (L5 tricky), apostrophe forms
(L6). For "Days of the Week" the day names themselves are PROPER NOUNS treated
as exceptions to the decodable rule (NC allows day names).

Return ONE JSON object keyed "sheet_1".."sheet_6" inside a ```json fence. No prose.
"""

def main():
    resp = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": SYSTEM}, {"role": "user", "content": USER}],
        temperature=0.4,
    )
    content = resp.choices[0].message.content or ""
    (OUT / "l4_grammar_spelling_design.md").write_text(
        f"# L4 grammar/spelling/tricky design\n\n{content}\n", encoding="utf-8")
    m = re.search(r"```json\s*(.+?)```", content, re.DOTALL)
    if m:
        try:
            data = json.loads(m.group(1))
            (OUT / "l4_grammar_spelling_design.json").write_text(
                json.dumps(data, indent=2), encoding="utf-8")
            print("Wrote l4_grammar_spelling_design.json with sheets:", list(data.keys()))
        except json.JSONDecodeError as e:
            print("JSON parse failed:", e)
    else:
        print("No JSON fence; see .md")

if __name__ == "__main__":
    main()
