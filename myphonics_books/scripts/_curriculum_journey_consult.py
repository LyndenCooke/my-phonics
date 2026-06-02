"""Senior SSP + KS1 literacy consult for the OVERALL curriculum journey.

Five rounds covering:
  R1. Handwriting/letter-formation journey across L1-L6
  R2. Grammar/punctuation/sentence-structure journey across L1-L6
  R3. Spelling/orthography journey across L1-L6
  R4. Standard worksheet-pack composition per level (given R1-R3)
  R5. Saudi/EAL school market — adaptations for Arabic-speaking learners
      and English-as-additional-language classrooms

Outputs:
  output/worksheet_plan/curriculum_journey.md   — full transcript + plan
  output/worksheet_plan/pack_composition.json   — per-level worksheet slot template
  output/worksheet_plan/saudi_adaptations.md    — cultural/linguistic notes
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

graphemes = json.loads((ROOT / "data" / "graphemes_by_level.json").read_text())
tricky = json.loads((ROOT / "data" / "tricky_words_by_level.json").read_text())

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

# Current pack pattern context (so the consultant knows what's already built)
CURRENT_STATE = """
Already shipped to production:
- L1.1 (Tap! Tap! Tap! — SATPIN focus) — 5-worksheet pack + 6 SATPIN single-sound sheets
- L1.2 (The Mud on the Dog — m d g o focus) — 5-pack + 4 single-sound sheets
- L1.3 (The Fish in the Tank — sh nk focus) — 5-pack + 2 single-digraph sheets
- L1.1's 5-pack: Sound Hunt, Trace+Write, Read+Do, Alien Word Mission, Story+Draw
- L1.3 onward: replaced Story+Draw with Sound Sort (skill-only direction)

Production target audience now includes Saudi Arabian schools (English as Additional
Language, ages 4-8, alongside the original UK home-learning parent audience).

The 5-worksheet pack is currently mostly phonics-skill focused but the user's
critical feedback is that letter-FORMATION and GRAMMAR are under-represented.
"""

client = OpenAI()
MODEL = "gpt-4o"

SYSTEM = (
    "You are a senior systematic synthetic phonics (SSP) literacy consultant with "
    "20+ years of UK Reception/KS1 classroom experience AND meaningful experience "
    "delivering English-medium phonics in Gulf-region schools (UAE/Saudi/Bahrain). "
    "You have led Letters & Sounds and Read Write Inc rollouts. You are an expert "
    "in early-years handwriting pedagogy (Nelson, PenPals, Twinkl Handwriting), "
    "KS1 grammar and punctuation milestones, and orthographic-mapping spelling "
    "approaches. You design printable worksheets that real teachers actually use, "
    "not generic filler. You are opinionated, concrete, and specific. Your job in "
    "this consult is to draw a comprehensive multi-level JOURNEY plan, not to "
    "design individual worksheets. Be ruthless about cognitive load and sequencing."
)


def turn(messages: list[dict], user_msg: str, round_label: str) -> tuple[str, list[dict]]:
    messages = messages + [{"role": "user", "content": user_msg}]
    print(f"\n========== {round_label} (calling {MODEL}) ==========")
    resp = client.chat.completions.create(
        model=MODEL, messages=messages, temperature=0.3, max_tokens=4000
    )
    out = resp.choices[0].message.content
    messages = messages + [{"role": "assistant", "content": out}]
    print(out)
    return out, messages


def main() -> None:
    messages: list[dict] = [{"role": "system", "content": SYSTEM}]

    # -------- ROUND 1: HANDWRITING JOURNEY --------
    r1, messages = turn(messages, f"""I am scoping the OVERALL learning journey for the MyPhonicsBooks worksheet
library — printable A4 sheets that supplement our decodable phonics books. The
library covers L1-L6 (UK ages 4-8; RWI Red through Grey).

CURRICULUM AT A GLANCE:
{CURRICULUM_SUMMARY}

CURRENT STATE:
{CURRENT_STATE}

ROUND 1 — HANDWRITING / LETTER FORMATION JOURNEY

Design the COMPLETE letter-formation and handwriting journey from L1 (Reception,
age 4) through L6 (Year 2, age 7-8). For each level, give:

  - WHAT handwriting skill is the primary focus at this level
  - HOW it builds on the previous level (sequencing logic)
  - WHICH specific drills make sense (e.g. air-write, dot-to-dot, dotted-trace,
    independent copy, missing-letter dictation, "best version" box)
  - WHAT THREE-ZONE GUIDE conventions apply (solid baseline + dashed midline +
    dotted topline; or change as the child progresses)
  - WHEN cursive/pre-cursive/joined handwriting is introduced (UK schools typically
    start joined entry-exit strokes around Y1/age-5-6; pure cursive Y2)
  - HOW many handwriting-specific sheets per BOOK pack should we allocate at each
    level (currently 1 sheet per pack — argue for more or fewer)

Output as a structured table per level (L1...L6). Under 700 words.
Be opinionated about the joined-vs-print question.""", "ROUND 1 — Handwriting journey")

    # -------- ROUND 2: GRAMMAR JOURNEY --------
    r2, messages = turn(messages, """ROUND 2 — GRAMMAR / PUNCTUATION / SENTENCE-STRUCTURE JOURNEY

Same format. For each level L1...L6, give:

  - WHICH grammar/punctuation concept is the primary focus at this level
  - WHAT the child should master by end of level (concrete milestones)
  - WHICH drills work for this concept (e.g. sentence-builder strips,
    capital-spotter, full-stop hunt, plurals match, contractions sort,
    question-vs-statement sort)
  - HOW many grammar-specific sheets per BOOK pack at each level (currently zero
    — propose a count)
  - HOW it interacts with phonics: e.g. plurals -s teaches s/z sound, contractions
    teach apostrophe AND elision

For Reception/Y1 (L1-L3) the journey should cover: capital I, capital sentence
starts, full stops, finger spaces, question marks, exclamation marks (used
sparingly), plurals -s, simple noun-verb agreement. By Y2 (L5-L6) we should be
into contractions, possessive 's, conjunctions (and, but, because), adverbs,
adjectives, past/present tense -ed/-ing.

Under 700 words. Be explicit about what is too advanced for each level.""", "ROUND 2 — Grammar journey")

    # -------- ROUND 3: SPELLING JOURNEY --------
    r3, messages = turn(messages, """ROUND 3 — SPELLING / ORTHOGRAPHY JOURNEY

Same format. For each level L1...L6, give:

  - PRIMARY spelling skill at this level (phoneme-grapheme segmenting,
    sound-out-and-write, common rules like 'doubling', sight-word retention,
    morphological awareness)
  - WHICH drills (dictation, missing-letter, anagram, word-build with letter
    tiles, rhyme-completion, magic-e transformations)
  - HOW many spelling-specific sheets per BOOK pack at each level
  - TRICKY-WORD treatment: at every level there are new tricky words. How should
    they be taught — separately every pack? Rainbow-trace? Look-cover-write-check?

Cover the orthographic milestones a child should hit at each year:
  L1 (Reception): hear all sounds in CVC, write CVC from dictation, recall 6
    tricky words
  L6 (Y2): apply -ed/-ing/-er/-est suffixes, drop-e and double-up rules,
    homophones (there/their/they're isn't until later, but two/to/too is Y2)

Under 700 words.""", "ROUND 3 — Spelling journey")

    # -------- ROUND 4: PACK COMPOSITION --------
    r4, messages = turn(messages, """ROUND 4 — STANDARD WORKSHEET-PACK COMPOSITION (the critical synthesis)

Given the three journeys you just designed, define the STANDARD WORKSHEET-PACK
COMPOSITION per level. Currently a pack has 5 sheets. Argue for the right NUMBER
of sheets per book at each level (could be 5, could be 7) AND the standard SLOTS
(e.g. "slot 1 = phonics drill; slot 2 = handwriting; slot 3 = grammar; ...").

For each level L1-L6, give the pack as a JSON-friendly list:

{
  "L1": {
    "pack_size": <number>,
    "slots": [
      {"n": 1, "category": "phonics", "type": "<type-name>", "purpose": "<1-sentence>"},
      ...
    ]
  },
  "L2": {...}, ...
}

The slots should be CONSISTENT across all books at a given level (so book L1.1,
L1.2, L1.3 all have identical pack structures, just specialised to that book's
focus sounds and content). This consistency is the entire point — teachers can
predict what they're getting.

CRITICAL CONSTRAINT: every level's pack must include at least one HANDWRITING
sheet AND at least one GRAMMAR sheet (this is the user's feedback that drove
this consult).

Output PURE JSON inside a ```json``` fenced block. No prose outside the block.
Under 1200 words.""", "ROUND 4 — Pack composition")

    # -------- ROUND 5: SAUDI / EAL ADAPTATIONS --------
    r5, messages = turn(messages, """ROUND 5 — SAUDI / EAL ADAPTATIONS

The product is now also targeting Saudi Arabian primary schools where English is
taught as an Additional Language (EAL). Children speak Arabic at home; English
phonics is being taught from age 4-5 alongside Arabic. Schools want a worksheet
library that is:
  - culturally sensitive (no pork, no alcohol, no dogs as main characters in
    some contexts, modesty in illustrations, no Christmas/Easter, halal-friendly
    food where food appears, hijab acceptable on female characters)
  - linguistically appropriate for L2 learners (Arabic-speaking children find
    /p/-vs-/b/ harder than native English children; vowels are particularly
    tricky because Arabic has fewer short vowels; right-to-left reading habits
    can affect English directional cues)
  - aligned with Ministry-approved content where possible (acknowledge if you
    don't know specifics)

Give me:

A. A short list of CONTENT CHANGES we should make for a "Saudi/EAL edition" of
   the worksheet library — what to ADD, what to REPLACE, what to AVOID.
B. A short list of PEDAGOGICAL ADJUSTMENTS — e.g. more explicit minimal-pair
   practice on /p/ vs /b/, /i/ vs /e/, longer time on vowel sounds, explicit
   direction-of-writing reminders (left-to-right arrows on every handwriting
   sheet).
C. An honest answer on whether we should run TWO separate library editions
   (UK + Saudi) or one library with optional Saudi-edition variants of certain
   sheets. Weigh maintenance cost vs market fit.

Under 700 words. Be honest if some questions need a local Saudi consultant —
flag those clearly.""", "ROUND 5 — Saudi / EAL")

    # -------- WRITE OUTPUTS --------
    transcript = "\n\n".join([
        "# Comprehensive Curriculum-Journey Consult",
        "",
        "## Round 1 — Handwriting / Letter Formation Journey",
        r1,
        "## Round 2 — Grammar / Punctuation Journey",
        r2,
        "## Round 3 — Spelling / Orthography Journey",
        r3,
        "## Round 4 — Standard Pack Composition (per level)",
        r4,
        "## Round 5 — Saudi / EAL Adaptations",
        r5,
    ])
    (OUT / "curriculum_journey.md").write_text(transcript, encoding="utf-8")
    (OUT / "saudi_adaptations.md").write_text(
        "# Saudi / EAL Adaptations\n\n" + r5, encoding="utf-8"
    )

    # Extract the JSON block from Round 4 if present
    if "```json" in r4:
        start = r4.find("```json") + 7
        end = r4.find("```", start)
        try:
            pack_json = json.loads(r4[start:end].strip())
            (OUT / "pack_composition.json").write_text(
                json.dumps(pack_json, indent=2), encoding="utf-8"
            )
            print(f"\n[OK] Extracted pack_composition.json with {len(pack_json)} levels")
        except json.JSONDecodeError as e:
            print(f"\n[WARN] Round 4 JSON block failed to parse: {e}")
    else:
        print("\n[WARN] Round 4 had no ```json``` block — no pack_composition.json saved")

    print(f"\nWrote {OUT / 'curriculum_journey.md'}")
    print(f"Wrote {OUT / 'saudi_adaptations.md'}")


if __name__ == "__main__":
    main()
