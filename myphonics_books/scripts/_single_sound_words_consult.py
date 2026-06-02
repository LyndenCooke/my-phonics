"""Single-sound worksheet WORD BANK consult.

For a given new-ledger level, asks a senior SSP consultant to produce, for each
grapheme, the word lists that drive the single-sound worksheet:
  - 5 §2 "Trace the Words" entries (word + concrete picture description)
  - 4 §3 "Write the Missing" entries (DIFFERENT words + picture description)
  - the grapheme position (start / end / middle)
  - a one-line handwriting/formation rule

Constraints enforced in the prompt:
  - Every word must be highly image-able for a 4-6 year old (no abstract words).
  - Words must clearly contain the target grapheme in the stated position.
  - §3 words must differ from §2 words.
  - British English. No brand names. No text inside pictures.

Output: output/worksheet_plan/single_sound_words_L{level}.json

Usage:
  py -3.12 scripts/_single_sound_words_consult.py 2 c k ck e u r h b f ff l ll ss j v w x y z
  py -3.12 scripts/_single_sound_words_consult.py 3 ch th ng qu zz
"""
from __future__ import annotations

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

OUT = ROOT / "output" / "worksheet_plan"
OUT.mkdir(parents=True, exist_ok=True)

client = OpenAI()
MODEL = "gpt-4o"

SYSTEM = (
    "You are a senior systematic synthetic phonics (SSP) consultant with deep "
    "UK Reception/KS1 classroom experience and expert knowledge of RWI and "
    "Letters & Sounds. You choose worksheet words that are (a) unambiguously "
    "image-able for a 4-6 year old, (b) clearly contain the target grapheme in "
    "the required position, and (c) age-appropriate and British English. You "
    "avoid abstract words, brand names, and anything hard to draw clearly. "
    "You output strict JSON only."
)


def build_user(level: int, graphemes: list[str]) -> str:
    return f"""Produce the single-sound worksheet word bank for LEVEL {level} graphemes:
{", ".join(graphemes)}

For EACH grapheme produce a JSON object keyed by the grapheme, with:
  "position": "start" | "end" | "middle"   (where the grapheme sits in the words)
  "sound_name": short phonics description, e.g. "/k/ sound spelled c (as in 'cat')"
  "rule": one sentence on lowercase letter formation for handwriting strips
  "s2_words": array of EXACTLY 5 [word, picture_description] pairs (Trace the Words)
  "s3_words": array of EXACTLY 4 [word, picture_description] pairs (Write the Missing) —
              these 4 words MUST be different from the 5 s2_words

Rules:
- Every word must visibly contain the grapheme {graphemes} in the stated position.
- Picture descriptions: concrete, single-subject, child-friendly, no text in image,
  British English. Any animal/face uses "pure black dot eyes".
- For double-letter graphemes (ff, ll, ss, zz) and end-position graphemes (ck, x, ng, nk),
  position is "end".
- For medial vowels (e, u), position is "middle" and words are CVC with the vowel in the middle.
- Prefer words a child can decode or recognise; keep them short (3-5 letters where possible).

Output ONE JSON object mapping each grapheme to its spec, inside a ```json fence. No prose.
"""


def main():
    level = int(sys.argv[1])
    graphemes = sys.argv[2:]
    if not graphemes:
        print("provide level + graphemes", file=sys.stderr)
        return 2

    resp = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": build_user(level, graphemes)},
        ],
        temperature=0.3,
    )
    content = resp.choices[0].message.content or ""
    m = re.search(r"```json\s*(.+?)```", content, re.DOTALL)
    raw = m.group(1) if m else content
    data = json.loads(raw)

    # attach level to each entry
    for g in data:
        data[g]["level"] = level

    out_path = OUT / f"single_sound_words_L{level}.json"
    out_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print(f"Wrote {out_path} with {len(data)} graphemes: {list(data.keys())}")


if __name__ == "__main__":
    main()
