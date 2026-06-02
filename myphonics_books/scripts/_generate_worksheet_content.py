"""
Per-book OpenAI content generator for worksheets.

The random word-shuffler in build_worksheets.py produces fine sound-hunt
grids but gibberish fluency strips like "The burst cheer he snow." Real
classroom worksheets need real sentences — meaningful, decodable, and
tied to the book's themes.

This script asks gpt-4o to produce, per book:
  - 6 fluency-strip sentences (decodable at the book's level, themed to
    the story setting)
  - 5 dictation words + 3 dictation sentences (incremental difficulty)
  - 6 crossword (clue, answer) pairs (answers drawn from words decodable
    at the level)

Output is cached to output/worksheet_plan/content_by_book.json. The
build_worksheets.py renderers read from this cache when present.
"""

import json
import os
import sys
import time
from pathlib import Path
from openai import OpenAI

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

env = ROOT / ".env"
for line in env.read_text().splitlines():
    if line.startswith("OPENAI_API_KEY="):
        os.environ["OPENAI_API_KEY"] = line.split("=", 1)[1].strip()

CACHE_PATH = ROOT / "output" / "worksheet_plan" / "content_by_book.json"
CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)

graphemes = json.loads((ROOT / "data" / "graphemes_by_level.json").read_text())
tricky = json.loads((ROOT / "data" / "tricky_words_by_level.json").read_text())
summaries = json.loads((ROOT / "data" / "story_summaries.json").read_text(encoding="utf-8"))


def gather_books():
    books = []
    for lkey, ldata in summaries.items():
        if not lkey.startswith("level_"):
            continue
        level = int(lkey.split("_")[1])
        for entry in ldata.get("completed_books", []):
            sub = entry["sub_level"]
            books.append(
                {
                    "sub_level": f"L{sub}",
                    "level": level,
                    "title": entry["title"],
                    "focus_sounds": entry["focus_sounds"],
                    "culture": entry.get("culture", ""),
                    "theme": entry.get("theme", ""),
                }
            )
    return sorted(books, key=lambda b: (b["level"], b["sub_level"]))


SYSTEM = (
    "You are a senior systematic synthetic phonics (SSP) literacy "
    "consultant authoring print-ready worksheet content for the "
    "MyPhonicsBooks scheme. You write only DECODABLE content at the "
    "given level — every word must use a grapheme on the cumulative list "
    "OR be on the cumulative tricky-words list. You never invent words. "
    "British English spelling throughout. You return strict JSON only — "
    "no preamble, no markdown fences."
)


def prompt_for(book):
    level = book["level"]
    g = graphemes[f"level_{level}"]
    t = tricky[f"level_{level}"]
    return f"""For the book "{book['title']}" (level L{book['sub_level'][1:]},
focus sounds {book['focus_sounds']}, setting: {book['culture']}, theme: {book['theme']}),
produce worksheet content in this exact JSON shape:

{{
  "fluency_strips": [
    "Six short decodable sentences (5-9 words each at L1-L3, 7-12 words at L4-L5, 10-15 at L6). Each sentence must read meaningfully and connect loosely to the book's setting or theme."
  ],
  "dictation": {{
    "words": ["five decodable words, ordered easiest -> hardest, biased toward the book's focus sounds"],
    "sentences": ["three decodable sentences, ordered easiest -> hardest"]
  }},
  "crossword": [
    {{"clue": "A meaningful one-line clue a child can solve, written in plain English a teacher can read aloud", "answer": "a decodable lowercase answer 3-7 letters"}}
  ]
}}

CONSTRAINTS (non-negotiable):
- Cumulative graphemes available: {g['cumulative_graphemes']}
- Cumulative tricky words (sight words) available: {t['cumulative']}
- NEW focus sounds the worksheet should emphasise: {book['focus_sounds']}
- All answers/words must use ONLY the cumulative graphemes or be in the cumulative tricky-words list
- Crossword: provide EXACTLY 6 clue/answer pairs. Answers must be unique.
- British English (colour, mum, favourite).
- No proper nouns the child wouldn't know. No abstract concepts.
- Fluency sentences must scan naturally aloud (not "burst cheer snow most").

Return STRICT JSON only."""


def main():
    client = OpenAI()
    books = gather_books()
    cache: dict = {}
    if CACHE_PATH.exists():
        cache = json.loads(CACHE_PATH.read_text(encoding="utf-8"))

    for b in books:
        key = b["sub_level"]
        if key in cache:
            print(f"  {key}  cached, skip")
            continue
        print(f"  {key}  generating...")
        try:
            resp = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": SYSTEM},
                    {"role": "user", "content": prompt_for(b)},
                ],
                temperature=0.4,
                response_format={"type": "json_object"},
            )
            content = json.loads(resp.choices[0].message.content)
            cache[key] = content
            CACHE_PATH.write_text(json.dumps(cache, indent=2, ensure_ascii=False), encoding="utf-8")
        except Exception as e:
            print(f"    ERROR: {e}")
            time.sleep(2)

    print(f"\nDone. Cache at {CACHE_PATH.relative_to(ROOT)}  ({len(cache)} books)")


if __name__ == "__main__":
    main()
