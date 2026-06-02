"""
Senior-literacy consultation for the MyPhonicsBooks worksheet library.

Three-round back-and-forth with a senior SSP literacy consultant persona to
design a worksheet TYPE catalogue that:
  - has real classroom variety (sound-finding, cut-and-paste, matching,
    rainbow-trace, scissor work, comprehension), not just "draw the picture"
  - scaffolds appropriately at each level (4-5 yo cut/match vs. 7+ yo
    suffix sorts and dictation)
  - ties tightly to each book's focus sounds + tricky words

Outputs the full transcript to output/worksheet_plan/_consult_transcript.md
and a JSON plan ready for the builder script.
"""

import json
import os
import sys
from pathlib import Path
from openai import OpenAI

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

env = ROOT / ".env"
for line in env.read_text().splitlines():
    if line.startswith("OPENAI_API_KEY="):
        os.environ["OPENAI_API_KEY"] = line.split("=", 1)[1].strip()

OUT = ROOT / "output" / "worksheet_plan"
OUT.mkdir(parents=True, exist_ok=True)

graphemes = json.loads((ROOT / "data" / "graphemes_by_level.json").read_text())
tricky = json.loads((ROOT / "data" / "tricky_words_by_level.json").read_text())
ladder = (ROOT / "docs" / "curriculum_ladder.md").read_text(encoding="utf-8")

CURRICULUM_SUMMARY = ""
for lvl_key in ["level_1", "level_2", "level_3", "level_4", "level_5", "level_6"]:
    g = graphemes[lvl_key]
    t = tricky[lvl_key]
    CURRICULUM_SUMMARY += (
        f"\n- L{lvl_key[-1]} ({g['name']}, {g['maps_to']}): "
        f"NEW graphemes={g['graphemes']}; "
        f"NEW tricky words={t['new_tricky_words']}; "
        f"font {g['font_size']}pt; "
        f"{g['focus_description']}\n"
    )

client = OpenAI()
MODEL = "gpt-4o"

SYSTEM = (
    "You are a senior systematic synthetic phonics (SSP) literacy consultant "
    "with 20+ years of UK Reception/KS1 classroom experience. You have led "
    "Letters & Sounds and Read Write Inc rollouts and you design printable "
    "worksheets that real teachers actually use, not generic colour-and-trace "
    "filler. You think pedagogically about scaffolding (sound → blending → "
    "reading → writing → comprehension), about cognitive load, about what a "
    "tired teacher can run a small group with after lunch. You believe in "
    "variety: sound-finding hunts, cut-and-paste sorts, dot-marker pages, "
    "rainbow tracing, picture-word matching, sentence-building, dictation, "
    "scissor-skill activities. You also know that an A5 page is small and "
    "must do ONE thing well, not three things badly. Be opinionated."
)

messages = [{"role": "system", "content": SYSTEM}]


def turn(user_msg: str, round_label: str) -> str:
    messages.append({"role": "user", "content": user_msg})
    resp = client.chat.completions.create(
        model=MODEL, messages=messages, temperature=0.4
    )
    out = resp.choices[0].message.content
    messages.append({"role": "assistant", "content": out})
    print(f"\n\n========== {round_label} ==========\n{out}\n")
    return out


# --------- ROUND 1: WORKSHEET TYPE LIBRARY ACROSS LEVELS ----------
r1 = turn(
    f"""I am designing the printable worksheet library for MyPhonicsBooks, a
decodable-book scheme covering L1–L6 (RWI Red through Grey, ages roughly 4–7+).
The worksheets will be bundled as PDFs behind a free Teachers Pay Teachers
"Teacher Pass." Each of the 32 published books needs MINIMUM 5 one-page A5
printable worksheets tied to that book's focus sounds, tricky words, and
story content. They must be printable in black/grey (some colour fills OK
but never required) and self-explanatory to a teacher.

CURRICULUM AT A GLANCE:
{CURRICULUM_SUMMARY}

ROUND 1 QUESTION:
Design a WORKSHEET TYPE LIBRARY of ~10–14 distinct worksheet types that,
between them, give a classroom teacher genuine variety across the
6-level scheme. For each TYPE, give me:
  - Name (e.g. "Sound Hunt", "Cut & Paste Sort")
  - One-sentence pedagogical purpose
  - Which levels it suits (L1–L6) and why
  - Cognitive scaffold position (sound discrimination / phoneme-grapheme /
    blending / segmenting / sight word / fluency / comprehension / writing)
  - Physical interaction (cut, paste, trace, dot, write, draw, tick, colour,
    fold, match)
  - How much "tied to the specific book" vs. "generic sound work" the type is

Be opinionated. Tell me which types are non-negotiable for early levels
and which only become useful from L3 onward. Under 700 words.""",
    "ROUND 1 — Worksheet type library",
)

# --------- ROUND 2: PER-LEVEL "5 ESSENTIAL" PACK ---------
r2 = turn(
    """Good. ROUND 2 QUESTION:

For each of L1, L2, L3, L4, L5, L6, give me the EXACT 5-worksheet pack
every book at that level should have. Use the type library you just
described, but specialise each entry to match what books at that level
need most. Format strictly as:

L{n} — 5-worksheet pack
1. [Type name] — [child-friendly title pattern, e.g. "Find the {sound} sounds"]
   - Why it's pack item #1 (sequence position)
2. ...

Two non-negotiables:
- The pack at every level must include letter formation / handwriting in
  some form, but how it manifests should evolve (L1: trace SATPIN; L6:
  fluent dictation).
- The pack at every level must include a comprehension-or-discussion
  activity tied to the specific book, but how it manifests should evolve
  (L1: draw your favourite part; L6: write 3 sentences responding to a
  prompt about the story).

Push back if any of the 5 slots are weak. Under 600 words.""",
    "ROUND 2 — Per-level 5-worksheet packs",
)

# --------- ROUND 3: CUT / ADD / IMPLEMENTATION RISKS ---------
r3 = turn(
    """Final round. ROUND 3 QUESTION:

(a) For each level, if a teacher could only print 3 of your 5 worksheets,
    which 3 are the highest leverage? Order them.
(b) Which of your 5 per level is the WEAKEST and what would you replace
    it with if I gave you another budget slot?
(c) What is the SINGLE biggest design pitfall I should avoid when
    actually implementing these as printable PDFs (e.g. font choice,
    instruction wording, cut lines, image use)?
(d) Are there any worksheets in your pack that would be FATALLY BORING
    for the child by L4–L6 and need to be redesigned for the older end
    of the scheme?

I will use your answers to lock the worksheet types and start building
HTML templates tonight. Be concrete and ruthless. Under 500 words.""",
    "ROUND 3 — Cuts, additions, pitfalls",
)


transcript_path = OUT / "_consult_transcript.md"
transcript_md = "# Worksheet pedagogy consult — transcript\n\n"
for m in messages:
    role = m["role"]
    transcript_md += f"\n\n## {role.upper()}\n\n{m['content']}\n"
transcript_path.write_text(transcript_md, encoding="utf-8")
print(f"\n\nTranscript saved -> {transcript_path}")
