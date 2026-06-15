"""Generate L6 Grammar worksheet REFERENCE images via OpenAI gpt-image-2.

These are the visual references the worksheet-engine grammar templates are
recreated from (reference-first workflow — see worksheet-engine/docs/
template_production_plan.md and the worksheet-recreation skill). Sends the
locked engine sound_a render + the house-style mockups to images.edit as STYLE
anchors, recoloured to the Level 6 indigo theme.

Usage:
    py -3.12 scripts/generate_grammar_refs.py tickgrid    # one
    py -3.12 scripts/generate_grammar_refs.py all         # all six
"""
from __future__ import annotations

import base64
import sys
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

ROOT = Path(__file__).resolve().parents[1]          # .../myphonics_books
load_dotenv(ROOT / ".env")
REPO = ROOT.parent                                   # .../myphonicsbooks

# Style anchors: the LOCKED engine sound_a render (layout/components we want to
# match) + two house-style mockups (polish/feel). Colour comes from the prompt.
REF_FILES = [
    REPO / "worksheet-engine" / "output" / "_png" / "sound-a.png",
    REPO / "marketing-mockups" / "worksheet images" / "ChatGPT Image May 20, 2026, 09_43_08 PM.png",
    REPO / "marketing-mockups" / "worksheet images" / "v2" / "2118f643-67e0-47d6-bf31-5dcfc7cb6ccc.png",
]

OUT_DIR = REPO / "worksheet-engine" / "output" / "grammar_refs"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# --- Shared creative brief (every grammar reference) -----------------------
# NOTE: this is a CREATIVE brief, not a layout spec. The house chrome (header,
# terminology line, Watch-first note, footer) is FIXED and must match the
# attached images. The activity area is the model's to DESIGN — we give it the
# teaching intent and the exact content, and let it invent the look. The code
# then recreates whatever creative the model produces.
PREAMBLE = """You are the DESIGNER. Create the CREATIVE — design how this worksheet should LOOK and
FEEL — for a printable A4 portrait GRAMMAR worksheet for MyPhonicsBooks, Level 6 (ages 6-7).
Make it a warm, engaging, uncluttered Year-2 worksheet a child would enjoy. You have real
creative freedom over the ACTIVITY area: its arrangement, spacing, little supporting
illustrations or icons, and how the task is presented — as long as it stays clear, calm and
easy for a young child to follow.

KEEP THESE HOUSE ELEMENTS FIXED — match the attached images, do not redesign them:
- HEADER BAR: a solid INDIGO #6366F1 rounded bar across the top. White, bold, centred TITLE =
  "{title}". On the left, a small white rounded-square mascot tile. On the right, two small
  stacked rounded pills: white "L6" above pale-indigo "Grammar".
- A thin line just under the header: left, small grey caps "{nc}"; right, in indigo,
  "Grammar words: {terms}".
- A short "Watch first" worked example near the top (this is the modelled "I do" step):
  {example}.
- FOOTER: a thin light-grey rounded bar. Left (grey): "MyPhonicsBooks · decodable phonics
  practice". Right (grey): "Grammar · {code}".

Theme colour INDIGO #6366F1 (soft tints #ECEDFE and #B6B9FA for fills/borders), otherwise
black text on white. One rounded infant-print font throughout (single-storey a and g).
British English. Generous white space; fill about 95% of the page height. NO scissors or
cut-out cards. NO reward stars.

NOW DESIGN THE ACTIVITY (your creative), under a clear heading "{do}":
{activity}
"""

PROMPTS = {
    # G-L6.1 — tick grid
    "tickgrid": PREAMBLE.format(
        title="Four kinds of sentence",
        nc="YEAR 2 · SENTENCE",
        terms="statement, question, command, exclamation",
        code="G-L6.1",
        do="Tick the kind each sentence is",
        example='"How high the brown owl flew!" with an arrow to the word "Exclamation" (in bold indigo), '
                'and a small grey note: "An exclamation starts with What or How, has a subject and a verb, '
                'and ends on an action word — not just an ! mark."',
        activity=(
            "The child reads each sentence and decides which of the four kinds it is — a statement, a "
            "question, a command or an exclamation — using the end mark as the clue, then records their "
            "choice. Use exactly these eight sentences: 'The owl sat on a bare branch.', 'What was that "
            "noise?', 'Look up at the tree!', 'What a loud howl the owl made!', 'The owl stared down at "
            "me.', 'Can we go and look?', 'Come down to the path now.', 'How fast that owl swooped down!'. "
            "Design an engaging, clear way for a 6-7 year old to show their answer for each one (a tick "
            "grid, labelled choice boxes, a colour key — your creative choice). Finish with a short "
            "'Now you write' line asking the child to write a command about the owl, on a handwriting line."
        ),
    ),
    # G-L6.2 — build
    "build": PREAMBLE.format(
        title="Make the noun phrase grow",
        nc="YEAR 2 · SENTENCE",
        terms="noun phrase, adjective, noun",
        code="G-L6.2",
        do="Write each noun phrase again, grown bigger",
        example='"the owl" with an arrow to "the big brown owl" (in bold indigo).',
        activity=(
            "The child grows each short noun phrase into a longer, more descriptive one by adding "
            "adjectives, then writes the grown phrase on a handwriting line. Offer these describing words "
            "for them to choose from: brown, new, blue, bare, soft, fluffy, big, purple. The four phrases "
            "to grow: 'the glue', 'the purse', 'the branch', 'the owlets'. Design an inviting way to "
            "present the word choices and the four write-your-own rows — your creative choice."
        ),
    ),
    # G-L6.3 — cloze (and/but/or/so)
    "cloze_coord": PREAMBLE.format(
        title="Joining with and, but, or, so",
        nc="YEAR 2 · SENTENCE",
        terms="conjunction, co-ordination, clause",
        code="G-L6.3",
        do="Write the best joining word in each gap",
        example='"He turned to look ___ he did not see the wet patch." with an arrow to "but" (bold indigo).',
        activity=(
            "The child chooses the best joining word to fill the gap in each sentence and writes it in. "
            "Offer the four choices: and, but, or, so. The four sentences (each has one gap): 'The glue "
            "was wet ___ it stuck to her hand.', 'She drew a bird ___ she gave the card to Mum.', 'We can "
            "use glue ___ we can use tape.', 'The cup fell ___ the tea ran on the rug.'. Design a clear, "
            "friendly way to present the word choices and the four fill-in sentences — your creative choice."
        ),
    ),
    # G-L6.4 — cloze (when/if/that/because)
    "cloze_sub": PREAMBLE.format(
        title="Joining: when, if, that, because",
        nc="YEAR 2 · SENTENCE",
        terms="conjunction, subordination, clause",
        code="G-L6.4",
        do="Write the best joining word in each gap",
        example='"I was glad ___ I found my purple purse." with an arrow to "because" (bold indigo).',
        activity=(
            "The child chooses the best joining word to fill the gap in each sentence and writes it in. "
            "Offer the four choices: when, if, that, because — and flag them gently as 'joining words to "
            "know' (these are words to recognise and copy, not yet to spell). The four sentences (each "
            "has one gap): 'We can see the owl ___ we stay still.', 'I think ___ the owl is rare.', 'The "
            "owlets cheep ___ they want food.', 'We set off down the path ___ it got dark.'. Design a "
            "clear, friendly way to present the word choices and the fill-in sentences — your creative choice."
        ),
    ),
    # G-L6.5 — circle / underline
    "circle": PREAMBLE.format(
        title="Adjectives and adverbs",
        nc="YEAR 2 · WORD CLASSES",
        terms="adjective, adverb",
        code="G-L6.5",
        do="Circle the adjective. Underline the adverb",
        example='"The brown owl flew quickly." with an arrow to "circle brown · underline quickly" (bold indigo).',
        activity=(
            "The child marks two word classes in each sentence: circle the adjective, underline the "
            "adverb. Make the two marks easy to understand (a little key or reminder of what 'circle' "
            "and 'underline' mean). The four sentences, printed large with room to mark on them: 'The "
            "bare branch swayed gently.', 'The new glue stuck fast.', 'The purple purse sat safely in "
            "her bag.', 'The cross cat ran off quickly.'. No writing lines needed. Design an engaging, "
            "spacious layout for marking — your creative choice."
        ),
    ),
    # G-L6.6 — match
    "match": PREAMBLE.format(
        title="Apostrophes for contractions",
        nc="YEAR 2 · PUNCTUATION",
        terms="apostrophe, contraction",
        code="G-L6.6",
        do="Draw a line to join each pair to its short form",
        example='"do not" with an arrow to "don\'t" (bold indigo), and a small grey note: '
                '"The apostrophe stands in for the o."',
        activity=(
            "The child joins each full pair of words to its matching short form (contraction) by drawing "
            "a line between them. The pairs are: 'it is' = it's, 'I am' = I'm, 'did not' = didn't, 'we "
            "are' = we're, 'can not' = can't. Present the full forms on one side and the contractions on "
            "the other in a scrambled order so it is a real matching task. Finish with a short 'Now you "
            "write' line asking the child to write a sentence using it's about the owl, on a handwriting "
            "line. Design an engaging matching layout — your creative choice."
        ),
    ),
    # G-L6.7 — rewrite
    "rewrite": PREAMBLE.format(
        title="Keep the tense the same",
        nc="YEAR 2 · TEXT",
        terms="verb, tense, past, present",
        code="G-L6.7",
        do="Write each sentence again, all in the past tense",
        example='"I turn out my pockets and found my purse." with an arrow to '
                '"I turned out my pockets and found my purse." (bold indigo).',
        activity=(
            "Each sentence slips out of the past tense partway through; the child rewrites the whole "
            "sentence so it is all in the past. The four sentences to fix: 'The card flew off and stick "
            "to the cat.', 'The cat grew cross and run off.', 'She drew a bird and give it to Mum.', "
            "'Dad turned to look and slips over.'. Give each one a handwriting line to rewrite it on. "
            "Design a clear, encouraging layout for reading then rewriting each sentence — your creative "
            "choice."
        ),
    ),
}


def generate(key: str, client: OpenAI) -> None:
    prompt = PROMPTS[key]
    refs = [open(p, "rb") for p in REF_FILES if p.exists()]
    if not refs:
        raise SystemExit("No reference images found — check REF_FILES paths.")
    print(f"-> generating {key} ({len(refs)} style refs)...")
    result = client.images.edit(
        model="gpt-image-2",
        image=refs,
        prompt=prompt,
        size="1024x1536",
        quality="high",
    )
    for f in refs:
        f.close()
    png = base64.b64decode(result.data[0].b64_json)
    out = OUT_DIR / f"ref-{key}.png"
    out.write_bytes(png)
    print(f"OK {out}")


def main() -> None:
    arg = sys.argv[1] if len(sys.argv) > 1 else "tickgrid"
    keys = list(PROMPTS) if arg == "all" else [arg]
    for k in keys:
        if k not in PROMPTS:
            raise SystemExit(f"Unknown key '{k}'. Options: {', '.join(PROMPTS)} | all")
    client = OpenAI()  # OPENAI_API_KEY from .env
    for k in keys:
        generate(k, client)


if __name__ == "__main__":
    main()
