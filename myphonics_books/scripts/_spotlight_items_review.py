"""
Ask gpt-5 (senior literacy specialist) to author the missing structured
`spotlight` sub-object for each of the 32 books that don't have one.

L3.1 already has a hand-authored example — we use it as the format spec.

Output: JSON saved to output/spotlight_items.json AND a human-readable
review to output/pedagogy_review_v3_spotlight_items.md.

Run from `myphonics_books/`:
    py -3.12 scripts/_spotlight_items_review.py
"""

import json
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
ENV_PATH = BASE_DIR / ".env"

api_key = os.environ.get("OPENAI_API_KEY")
if not api_key and ENV_PATH.exists():
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        if line.startswith("OPENAI_API_KEY="):
            api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
            break
if not api_key:
    sys.exit("No OPENAI_API_KEY found in env or .env")

sys.path.insert(0, str(BASE_DIR / "data"))
from grammar_spotlights import GRAMMAR_SPOTLIGHTS  # noqa: E402

from openai import OpenAI  # noqa: E402

client = OpenAI(api_key=api_key)

# Books we already have a hand-authored spotlight for — skip them.
ALREADY_DONE = {key for key, entry in GRAMMAR_SPOTLIGHTS.items()
                if "spotlight" in entry}

TODO = {key: entry for key, entry in GRAMMAR_SPOTLIGHTS.items()
        if key not in ALREADY_DONE}

L3_1_EXAMPLE = json.dumps({
    "skill":       "End marks: . or ?",
    "instruction": "Choose . or ? for each sentence. Tick your choice, then write it at the end.",
    "items": [
        {"text": "Bikes line up at the gate",          "choices": [".", "?"]},
        {"text": "Can I win",                          "choices": [".", "?"]},
        {"text": "I ride past the lake and turn back", "choices": [".", "?"]},
    ],
}, indent=2, ensure_ascii=False)

LADDER_BRIEF = "\n".join(
    f"  {key}: {entry['focus_skill']}  →  mastery: {entry['mastery_signal']}"
    for key, entry in GRAMMAR_SPOTLIGHTS.items()
)

PER_BOOK_BLOCK = "\n\n".join(
    f"=== {key}  ({entry['book']}) ===\n"
    f"focus_skill:        {entry['focus_skill']}\n"
    f"mastery_signal:     {entry['mastery_signal']}\n"
    f"workshop_listen_write: {entry['workshop_listen_write']}\n"
    f"reference_tip:      {entry['reference_tip']}"
    for key, entry in TODO.items()
)

LEVEL_NOTES = """
Decoding constraints by level (UK Letters & Sounds-aligned):

  L1 (10 books, Phase 2 — Reception entry):
    Set 1 graphemes only.  No clusters.  Tricky words available: I, the,
    a, no, to, into, go.  Items should be 3-6 word captions or one short
    sentence; child copies/completes a single word or punctuation mark.
    Avoid asking for original sentence-writing inside the spotlight box —
    that comes in Listen-and-Write.

  L2 (6 books, Phase 3 — late Reception):
    Long vowels added (ai, ee, igh, oa, oo, ar, or, ur, ow, oi, ear,
    air, ure, er).  Tricky: he, she, we, me, be, was, my, you, they,
    her, all, are.  Items: 5-8 word sentences; gap-fills with picture
    cue OK; up to 3 items.

  L3 (5 books, Phase 4 — Year 1 entry):
    Set 1 + clusters (st-, sp-, fl-, etc., -nd, -mp, -nk, etc.).  No new
    graphemes — coverage of CVCC / CCVC / CCVCC / CCCVCC.  Tricky: said,
    so, have, like, some, come, were, there, little, one, do, when, out,
    what.  Items: 6-10 word sentences; choose-one tickbox or rewrite-the-
    sentence.

  L4 (4 books, Phase 5a — Year 1):
    Alternative spellings unlocked (ay, ea, ie, oe, ue, ow=oa, ie=igh,
    aw, oy, ir, ue=oo, e-e, etc.).  Tricky: oh, their, people, Mr, Mrs,
    looked, called, asked.  Items: full sentences; tense work; up to 4
    items.

  L5 (4 books, Phase 5b — late Year 1):
    Final Set 3 alternatives + comprehension focus.  Tricky: water, where,
    who, again, thought, through, work, mouse, many, laughed, because,
    different, any, eyes, friends, once, please.  Items: subordinate
    clauses, comma work, contractions; sentences may be 8-12 words.

  L6 (4 books, Year 2 secure):
    Suffixes -ed/-ing/-er/-est/-ly/-ness/-ful/-less, possessive 's,
    inverted commas for speech.  Items: paragraph-level edit, possessive
    phrase building, speech punctuation.  Up to 4 items, may include a
    short paragraph (2-3 sentences) for editing.

GENERAL RULES (apply to ALL books):
  - Items must be decodable at THIS level using ONLY graphemes/tricky
    words taught up to and including this level.  Cumulative — not
    restricted to the book's focus graphemes.
  - When `choices` is present, it's a tickbox — child picks ONE.
  - When `choices` is absent, the child writes an open answer (single
    word, phrase, or short sentence depending on level).
  - The skill probed by `items` MUST match the book's `mastery_signal`
    directly.  If the mastery signal says "writes one question with ?",
    the items should give the child opportunities to do exactly that.
  - 2-4 items per book.  L1 = 2-3 short items.  L6 = 2-4 longer items.
  - British English throughout (full stop, colour, mum, favourite).
  - Don't repeat the L3.1 example — it stays as-is.
"""

SYSTEM = (
    "You are a senior literacy specialist (UK / British English) who has "
    "designed phonics intervention programmes used in primary schools. "
    "You combine systematic synthetic phonics expertise (Letters & Sounds, "
    "RWI, Phonics Bug) with classroom realism: parents at the kitchen "
    "table, ages 4-8, ten-minute attention spans, A5 print. You give "
    "concrete, implementable advice — exact wording, exact layout — not "
    "platitudes. You author tasks that probe the stated mastery signal "
    "directly, never invent generic 'best practice' content. You respect "
    "decoding constraints absolutely: a word the child cannot decode at "
    "this level is a word the child cannot read, full stop."
)

USER = f"""
# Brief

I'm building 33 decodable phonics readers (A5, ages 4-8).  Each book
has a Word Workshop page with a "Grammar Spotlight" tickbox / fill-in
mini-task.  This task probes the book's `mastery_signal` directly.

Book L3.1 already has a hand-authored example.  Format is JSON:

```json
{L3_1_EXAMPLE}
```

`items[].choices` is optional — present = tickbox (child picks one);
absent = open answer (child writes a word / phrase / short sentence).

# What I want from you

For EACH of the 32 books listed below, author a `spotlight` JSON object
in exactly this schema:

  {{
    "skill":       "<short heading, ~3-6 words, matches focus_skill>",
    "instruction": "<one-line task for the child>",
    "items": [
      {{"text": "<sentence/phrase>", "choices": [...]}},   // tickbox
      {{"text": "<sentence/phrase>"}}                       // open answer
    ]
  }}

# Constraints
{LEVEL_NOTES}

# The 32 books

{PER_BOOK_BLOCK}

# Output format — STRICT JSON, machine-parseable

Return ONE JSON object whose keys are the book sub-level strings
(e.g. "1.1", "2.4", "6.4") and whose values are the spotlight
sub-objects for that book.  Do NOT include the L3.1 entry.  Do NOT
wrap in markdown code fences.  Do NOT add commentary outside the JSON.

The very first character of your response must be `{{` and the very
last must be `}}`.
"""

print(f"Asking gpt-5 to author {len(TODO)} spotlight sub-objects "
      f"(L3.1 stays as-is)...")
print(f"Prompt length: ~{len(USER):,} chars")

response = client.responses.create(
    model="gpt-5",
    reasoning={"effort": "high"},
    input=[
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": USER},
    ],
)

# Pull text out of the response
raw = response.output_text
print(f"\nReceived {len(raw):,} chars from gpt-5.")

# Save raw to disk first so we never lose it
review_md = BASE_DIR / "output" / "pedagogy_review_v3_spotlight_items.md"
review_md.write_text(
    f"# Pedagogy review v3 — spotlight items (model: gpt-5)\n\n"
    f"## Raw model output\n\n```json\n{raw}\n```\n",
    encoding="utf-8",
)
print(f"Raw output saved to {review_md.relative_to(BASE_DIR)}")

# Strip code fences if present
text = raw.strip()
if text.startswith("```"):
    # remove leading ```json or ``` and trailing ```
    text = text.split("```", 2)[1]
    if text.startswith("json"):
        text = text[4:]
    text = text.rsplit("```", 1)[0]
    text = text.strip()

try:
    parsed = json.loads(text)
except json.JSONDecodeError as exc:
    print(f"\nJSON parse failed: {exc}")
    print("Raw output kept at output/pedagogy_review_v3_spotlight_items.md.")
    sys.exit(2)

missing = [k for k in TODO if k not in parsed]
extra = [k for k in parsed if k not in TODO]
print(f"\nParsed {len(parsed)} entries. Missing: {missing}. Extra: {extra}.")

out_path = BASE_DIR / "output" / "spotlight_items.json"
out_path.write_text(json.dumps(parsed, indent=2, ensure_ascii=False),
                    encoding="utf-8")
print(f"Structured items saved to {out_path.relative_to(BASE_DIR)}")
