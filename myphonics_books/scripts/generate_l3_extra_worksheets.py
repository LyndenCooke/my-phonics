"""Generate the L3 Complete Pack's NET-NEW sheets (grammar + spelling + blending).

These are bespoke full-A4 worksheets (not single-sound sheets). They reuse the
same style + tracing reference images as the single-sound pack (no book
characters). Content is locked to the L3 decodable rule and uses the L3 banner
colour (amber #F59E0B).

Sheets:
  l3_grammar_endmarks   — Full Stop or Question Mark?
  l3_grammar_capitals   — Capital Letters for Names
  l3_spelling_tricky    — he/she/we/me/be (Read & Match, picture → word)
  l3_blending_clusters  — Blend the Clusters

Usage:
  py -3.12 scripts/generate_l3_extra_worksheets.py                 # all 4
  py -3.12 scripts/generate_l3_extra_worksheets.py l3_spelling_tricky
"""
from __future__ import annotations

import argparse
import base64
import os
import sys
import time
from pathlib import Path

from generate_worksheet_image import REF_DIR, EXTRA_REF_DIR, EXTRA_REF_FILES, OUT_DIR, LEVEL_COLOURS  # type: ignore
from openai import OpenAI

ROOT = Path(__file__).resolve().parents[1]
for line in (ROOT / ".env").read_text(encoding="utf-8", errors="ignore").splitlines():
    if line.startswith("OPENAI_API_KEY="):
        os.environ["OPENAI_API_KEY"] = line.split("=", 1)[1].strip()

L3_COLOUR = LEVEL_COLOURS[3]  # amber #F59E0B

HOUSE = f"""Printable A4 portrait phonics worksheet for MyPhonicsBooks.
Use the attached images for STYLE ONLY (rounded banner, soft pastel rounded
boxes, cute simple cartoons, grey footer). Do NOT copy their content. Do NOT
use pink for the banner — Level 3 uses AMBER {L3_COLOUR}.

HOUSE STYLE (binding):
- Top banner solid colour {L3_COLOUR} (amber) — NOT pink. Title on the left,
  two chips top-right: "Level 3" and the sheet's skill chip.
- Footer left (grey, 9pt): "MyPhonicsBooks · decodable phonics practice".
- Generous white space, airy. NO reward stars, NO star strips anywhere.
- Any handwriting space uses full 3-zone guide lines: solid BASELINE, dashed
  MIDLINE at x-height, faint dotted TOPLINE. Lowercase single-storey 'a', no
  serifs. Every printed letter sits ON the baseline.
- Any cartoon character or animal has TWO SMALL PURE BLACK SOLID DOT EYES only
  — NO whites inside the dot, NO pupils, NO sparkle highlights, NO eyelashes.
  Just two solid black dots. British English. NO TEXT BAKED INTO ANY PICTURE.
"""

ENDMARKS = HOUSE + """
Title: "Full Stop or Question Mark?"   Skill chip: "Grammar"

OBJECTIVE: the child reads each sentence and writes the correct end mark — a full
stop ( . ) for a statement or a question mark ( ? ) for a question.

LAYOUT — TWO sections.

[1] "Read and Decide" — instruction: "Read each sentence. Write . or ? in the box."
    Small KEY at top of the section: a big example full stop labelled "tells us"
    and a big example question mark labelled "asks us".
    FOUR sentence rows stacked vertically. Each row: the sentence in clear
    lowercase (capital at start) on the left, single EMPTY rounded square box
    (~10mm) at the end for the child's mark.
      Row 1:  Can a cat jump   [ ]
      Row 2:  The sun is hot   [ ]
      Row 3:  Is it in the box   [ ]
      Row 4:  We can run and jump   [ ]

[2] "Now you try" — instruction: "Write your own. Don't forget the end mark!"
    TWO labelled prompts, each followed by a long EMPTY 3-zone handwriting strip
    spanning the full width of the section:
      Prompt 1 (left label):  "Write a statement."   [ empty 3-zone strip ]
      Prompt 2 (left label):  "Write a question."    [ empty 3-zone strip ]
    A small reminder under the second strip in tiny grey text: "End with . or ?"

ONLY these words may appear on the page (plus the marks . and ?): Can, a, cat,
jump, The, sun, is, hot, Is, it, in, the, box, We, can, run, and. Plus the
section headings, instructions, the key labels "tells us" / "asks us", and
the §2 labels "Write a statement." / "Write a question." / "End with . or ?".
NO other words.
"""

CAPITALS = HOUSE + """
Title: "Capital Letters for Names"   Skill chip: "Grammar"

OBJECTIVE: capital letters for names of PEOPLE and PLACES.

LAYOUT — two sections.
[1] "Find the Names" — instruction: "Circle the names that need a capital letter."
    THREE sentences printed in all-lowercase (deliberately, so the child spots the
    names). Each sits in its own soft pastel rounded box, with a small cartoon
    illustration to the right.
      tom and sam went to london          [Big Ben + two boys]
      jill went to paris                  [Eiffel Tower + a girl]
      ben and ann sit in the sun          [two children sitting under a smiling sun]
[2] "Write it Right" — instruction: "Write each sentence with capital letters for
    the names." THREE long 3-zone handwriting strips (one per sentence) that are
    EMPTY for the child to rewrite. A small grey prompt of the matching lowercase
    sentence sits to the LEFT of each strip.

ONLY these words may appear: tom/Tom, and, sam/Sam, went, to, london/London,
jill/Jill, paris/Paris, ben/Ben, ann/Ann, sit, in, the, sun. No other words.
"""

TRICKY = HOUSE + """
Title: "Read and Match"   Skill chip: "Tricky Words"

OBJECTIVE: recognise the five new L3 tricky words he, she, we, me, be by
matching each to the picture that best shows its meaning.

LAYOUT — one big two-column section, FIVE rows, stretched generously down the
whole page below the banner.

LEFT COLUMN — FIVE small pictures (one per row), each in its own soft pastel
rounded box, positioned with small white space between rows:
  Row A:  a single cartoon boy smiling, head-and-shoulders, PURE BLACK DOT EYES
  Row B:  a single cartoon girl smiling, head-and-shoulders, PURE BLACK DOT EYES
  Row C:  a group of three cartoon children standing together, smiling, all with
          PURE BLACK DOT EYES
  Row D:  a single cartoon child pointing one finger at their own chest (meaning
          "me"), head-and-shoulders, PURE BLACK DOT EYES
  Row E:  a single cartoon caterpillar smiling with a tiny thought bubble above
          showing a butterfly silhouette (meaning "I want to BE a butterfly"),
          PURE BLACK DOT EYES on the caterpillar

MIDDLE COLUMN — open white space the full vertical run of the rows, where the
child will draw matching lines.

RIGHT COLUMN — FIVE small pill-shaped pastel boxes (one per row), each
containing ONE tricky word in clean lowercase, in a SHUFFLED order top to bottom
so the answers are not aligned with the pictures:
  Top to bottom:  we   me   she   be   he
  (yes, that order — deliberately not matching the picture order)

Below the layout, instruction sits at the top of the section:
"Draw a line from each picture to the right tricky word."

ONLY these words may appear on the page: he, she, we, me, be. No other words on
the page apart from the section heading and instruction.
"""

CLUSTERS = HOUSE + """
Title: "Blend the Clusters"   Skill chip: "Blending"

OBJECTIVE: read and build CCVC / CVCC words with adjacent consonant clusters
(Phase-4 adjacent-consonant blending).

LAYOUT — two sections with DIFFERENT WORDS in each section (do NOT reuse §1
words in §2).

[1] "Blend and Read" — instruction: "Say each sound. Blend them to read the word."
    FOUR cells in a row. Each cell:
      - ONE clear picture on top.
      - BELOW the picture, the word printed in clean lowercase.
      - BELOW the word, ONE SMALL DOT under EACH SINGLE PHONEME (sound button).
        EACH DOT MUST SIT DIRECTLY UNDER ITS PHONEME (letter), not between
        letters, not floating off centre.
      - DO NOT draw any line UNDER the word. Just the dots. These four words
        have NO digraphs and NO "special friends", so there is NOTHING to
        underline. ABSOLUTELY NO LINE under the word.
    Words + pictures:
      stop  = a red octagonal STOP sign (no letters on the sign)
      frog  = a cute green frog sitting, PURE BLACK DOT EYES
      snap  = a hand with finger and thumb snapping, small motion marks
      flag  = a single triangular flag on a pole, waving

[2] "Build the Word" — instruction: "Write the letters in the boxes to build
    the word." FOUR rows of NEW words (NOT the same as §1). Each row:
      - One small picture on the LEFT.
      - A row of EMPTY square letter boxes (one box per letter) in the MIDDLE.
      - The jumbled letters shown small to the RIGHT as a letter bank.
    Use these FOUR new words (final-cluster CVCC, different from §1):
      lamp  =  a small bedside lamp turned on, soft yellow glow (4 boxes)  bank: a m l p
      milk  =  a single glass of white milk, no straw (4 boxes)            bank: i k m l
      mask  =  a single party eye-mask on a stick (4 boxes)                bank: s a m k
      nest  =  a single brown bird's nest with three small speckled eggs   bank: t n s e
                inside (4 boxes)

ONLY these letters/words may appear: stop, frog, snap, flag, lamp, milk, mask,
nest and their individual letters. No other words.
"""

PROMPTS = {
    "l3_grammar_endmarks":  ENDMARKS,
    "l3_grammar_capitals":  CAPITALS,
    "l3_spelling_tricky":   TRICKY,
    "l3_blending_clusters": CLUSTERS,
}


def refs() -> list[Path]:
    rs = sorted(REF_DIR.glob("ChatGPT Image*.png"))
    for extra in EXTRA_REF_FILES:
        p = EXTRA_REF_DIR / extra
        if p.exists():
            rs.append(p)
    return rs


def gen(client, key, prompt, ref_files, model, size, quality, max_retries=5):
    out_path = OUT_DIR / f"{key}_v1.png"
    last = None
    for attempt in range(1, max_retries + 1):
        opened = [open(r, "rb") for r in ref_files]
        try:
            r = client.images.edit(model=model, image=opened, prompt=prompt,
                                    size=size, quality=quality, n=1)
            out_path.write_bytes(base64.b64decode(r.data[0].b64_json))
            return out_path
        except Exception as e:  # noqa: BLE001
            last = e
            w = min(2 ** attempt, 30)
            print(f"    {key}: attempt {attempt} failed ({type(e).__name__}); retry {w}s")
            time.sleep(w)
        finally:
            for fh in opened:
                fh.close()
    raise RuntimeError(f"{key} failed: {last}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("keys", nargs="*")
    ap.add_argument("--model", default="gpt-image-2")
    ap.add_argument("--size", default="1024x1536")
    ap.add_argument("--quality", default="high")
    ap.add_argument("--redo", action="store_true")
    args = ap.parse_args()
    targets = args.keys or list(PROMPTS.keys())
    rf = refs()
    client = OpenAI()
    for k in targets:
        out = OUT_DIR / f"{k}_v1.png"
        if out.exists() and not args.redo:
            print(f"  cached {k}")
            continue
        print(f"  generating {k} ...")
        gen(client, k, PROMPTS[k], rf, args.model, args.size, args.quality)
        print(f"    saved {out.name}")
        time.sleep(1)


if __name__ == "__main__":
    main()
