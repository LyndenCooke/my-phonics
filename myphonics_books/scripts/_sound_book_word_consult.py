"""
Senior-literacy consult to design SOUND SPOTLIGHT word lists for all 73
MyPhonicsBooks Sound Books.

This is a single-round call (the brief is detailed enough that round-tripping
adds little). Outputs:
  - output/sound_books/_word_consult_transcript.md   (system + user + reply)
  - output/sound_books/_word_consult.json            (parsed JSON word lists)

Run:
  py -3.12 scripts/_sound_book_word_consult.py
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

# Load OPENAI_API_KEY from .env
env_path = ROOT / ".env"
for line in env_path.read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, _, v = line.partition("=")
    k = k.strip()
    v = v.strip().strip('"').strip("'")
    if "#" in v:
        v = v.split("#", 1)[0].strip()
    if k and k not in os.environ:
        os.environ[k] = v

from openai import OpenAI  # noqa: E402

OUT = ROOT / "output" / "sound_books"
OUT.mkdir(parents=True, exist_ok=True)


SYSTEM = """You are a senior UK systematic synthetic phonics (SSP) literacy
consultant with 20+ years of Reception/KS1 classroom experience. You've led
Letters & Sounds and Read Write Inc rollouts. You are designing word lists
for a series of "Sound Spotlight" picture books for children aged 4-8.

These books are PICTURE BOOKS, not decodable readers. Each page shows a real
photograph of an object/scene with the word printed underneath. The child
spots the target sound in the word.

Hard rules:
1. PHOTO-ABLE: every word must be a concrete noun (or vivid action) that a
   stock photo from Pexels can unambiguously depict. A 4-year-old should
   instantly recognise the picture and name it. NO abstract function words
   (it, at, on, an, us). NO words a photographer would shoot ambiguously.
2. CHILD-SAFE & BRITISH: British English vocabulary (lorry not truck,
   biscuit not cookie). No adult themes. No alcohol/violence/innuendo.
3. SOUND POSITION: the target sound should appear in the natural position
   for that grapheme (e.g. s/sh/ch usually initial; ng/nk/tion/ous usually
   end; ay/igh/oo/ea usually medial; air/are/ire/ore usually end).
4. NO WORKSHEET OVERLAP: decodable satpin drill words (sit, sad, sip, sun,
   six, mat, man, etc.) are already covered in the worksheets. Avoid them
   here. 1-2 decodable words per book are fine if they're particularly
   image-able; the rest should be picture-rich words children won't yet be
   able to fully decode.
5. CONCRETE NOUNS BIAS: animals, food, objects, vehicles, clothing,
   weather, body parts, toys — these photograph well. Avoid emotions,
   relationships, abstract concepts unless the photo is iconic.
6. 6 WORDS per book unless the book has multiple sounds (combined books
   like ff+ll, ew+ue, wr+kn) — those get 3-4 words per sound.
7. BRITISH SPELLING throughout (colour, favourite, lorry).

Return STRICT JSON only — no commentary, no markdown fences. Schema:

{
  "books": [
    {
      "id": "L3.1",
      "title": "Sound Book: sh",
      "sounds": [
        {
          "grapheme": "sh",
          "words": [
            {"word": "shark", "query": "great white shark", "note": "iconic, all kids know"},
            {"word": "sheep", "query": "fluffy sheep field", "note": "concrete farm animal"},
            ...
          ]
        }
      ]
    },
    ...
  ]
}

The "query" field is the Pexels search string — be specific enough to get
a clean, child-friendly stock photo on the first hit. The "note" field is
a one-line pedagogical justification (you'll be reviewed on it).
"""


# Compact brief — the 73 books grouped by level, target sounds only.
BRIEF_INVENTORY = """
The 73 Sound Books are fixed. You CANNOT change which sound each book targets;
you only choose the words. Here is the inventory (book ID -> target sound(s)):

L1 — Ditties (single phoneme each, initial position):
  L1.1 s | L1.2 a | L1.3 t | L1.4 p | L1.5 i | L1.6 n |
  L1.7 m | L1.8 d | L1.9 g | L1.10 o

L2 — First Sounds:
  L2.1 c | L2.2 k | L2.3 ck (end) | L2.4 e | L2.5 u | L2.6 r |
  L2.7 h | L2.8 b | L2.9 f | L2.10 l |
  L2.11 ff + ll (combined, end position) |
  L2.12 ss + zz (combined, end position) |
  L2.13 j | L2.14 v + w (combined) | L2.15 x + y + z (combined)

L3 — Special Friends (digraphs, usually initial):
  L3.1 sh | L3.2 nk (end) | L3.3 ch | L3.4 th | L3.5 ng (end) | L3.6 qu

L4 — Longer Sounds (vowel digraphs/trigraphs):
  L4.1 ay (end) | L4.2 ee (medial/end) | L4.3 igh (medial) |
  L4.4 ow (long o, end) | L4.5 oo (long, like 'zoo') |
  L4.6 oo (short, like 'look') | L4.7 ar | L4.8 or |
  L4.9 air (end) | L4.10 ir | L4.11 ou (medial, like 'out') | L4.12 oy (end)

L5 — New Spellings (alternative spellings, split digraphs):
  L5.1 a-e split digraph | L5.2 i-e split | L5.3 o-e split | L5.4 u-e split |
  L5.5 ea | L5.6 ie | L5.7 oi | L5.8 aw | L5.9 ai | L5.10 oa

L6 — Building Fluency:
  L6.1 ur | L6.2 er (end-of-word usually) | L6.3 are (end) |
  L6.4 ow (like 'cow') | L6.5 ew + ue (combined) |
  L6.6 wr + kn (combined, silent letters) |
  L6.7 ge + dge (combined, end) |
  L6.8 mb + gn (combined, silent letters) |
  L6.9 ph + wh (combined)

L7 — Reading Together:
  L7.1 ire (end) | L7.2 ore (end) | L7.3 ear (end) |
  L7.4 oor (end) | L7.5 ure (end) | L7.6 tion (end)

L8 — Reading Champion (suffix patterns, end-of-word):
  L8.1 -ous | L8.2 -cious | L8.3 -tious | L8.4 -able | L8.5 -ible

Return JSON for ALL 73 books.
"""


def main():
    client = OpenAI()
    model = "gpt-4o"

    user_msg = BRIEF_INVENTORY + "\n\nReturn the full JSON now."

    print(f"[consult] calling {model} ...")
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": user_msg},
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    reply = resp.choices[0].message.content
    print(f"[consult] got {len(reply)} chars back")

    transcript = (
        "# Sound Book word-list consult\n\n"
        f"Model: {model}\n\n"
        "## System\n\n```\n" + SYSTEM + "\n```\n\n"
        "## User\n\n```\n" + user_msg + "\n```\n\n"
        "## Reply\n\n```json\n" + reply + "\n```\n"
    )
    (OUT / "_word_consult_transcript.md").write_text(transcript, encoding="utf-8")

    try:
        parsed = json.loads(reply)
    except json.JSONDecodeError as e:
        print(f"[consult] WARNING: JSON parse failed: {e}")
        print("[consult] raw reply saved; please fix manually.")
        return

    (OUT / "_word_consult.json").write_text(
        json.dumps(parsed, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    books = parsed.get("books") or []
    print(f"[consult] parsed {len(books)} books")
    if len(books) != 73:
        print(f"[consult] WARNING: expected 73, got {len(books)}")
    for b in books[:3]:
        print(f"  - {b.get('id')}: {b.get('title')}")
        for s in b.get("sounds", []):
            words = ", ".join(w["word"] for w in s.get("words", []))
            print(f"      {s['grapheme']}: {words}")


if __name__ == "__main__":
    main()
