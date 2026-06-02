"""Build a comprehensive MyPhonicsBooks SKILL LEDGER using a hybrid approach:

1. AUTO-GENERATE phonics + tricky-word skills programmatically from the existing
   data files (graphemes_by_level.json, tricky_words_by_level.json, story files).
   These are mechanical — no LLM needed. ~150 skills produced.

2. CALL OpenAI for the META-SKILLS — handwriting techniques, grammar/punctuation,
   reading-fluency/comprehension, writing-composition. ~40-60 skills produced.

3. MERGE both into a single skill_ledger.json with consistent schema and
   lifecycle (introduced_at / practised_through / mastered_by / assumed_from).

The lifecycle convention:
  - introduced_at:    book where the skill is first taught (e.g. L1.1)
  - practised_through: book where active worksheet practice ends (e.g. L1.10)
  - mastered_by:      end-of-level expectation (e.g. L1-end)
  - assumed_from:     never re-taught in worksheets from this book on (e.g. L2.1)
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path
from openai import OpenAI

ROOT = Path(__file__).resolve().parent.parent
env = ROOT / ".env"
for line in env.read_text().splitlines():
    if line.startswith("OPENAI_API_KEY="):
        os.environ["OPENAI_API_KEY"] = line.split("=", 1)[1].strip()

OUT = ROOT / "output" / "worksheet_plan"
DATA = ROOT / "data"

# ---------------- DATA LOAD ----------------
graphemes = json.loads((DATA / "graphemes_by_level.json").read_text())
tricky = json.loads((DATA / "tricky_words_by_level.json").read_text())

# Parse the 32 books to know which grapheme is introduced in which book
def extract(text: str, key: str) -> str:
    m = re.search(rf'"{key}"\s*:\s*(\[[^\]]*\]|"[^"]*")', text)
    return m.group(1) if m else "[]"

books_by_level: dict[int, list[dict]] = {1: [], 2: [], 3: [], 4: [], 5: [], 6: []}
for f in sorted(DATA.glob("*_story_l*_book1.py")):
    text = f.read_text(encoding="utf-8")
    # Parse level + sub-level from the FILENAME (unambiguous). Pattern: *_l{level}_{sub}_book1.py
    fn_match = re.search(r"_l(\d+)_(\d+)_book\d+\.py$", f.name)
    if not fn_match:
        # Some legacy filenames (fish_story_l1_book1.py) use l{level}_book without sub.
        legacy = re.search(r"_l(\d+)_book\d+\.py$", f.name)
        if legacy:
            lvl = int(legacy.group(1))
            sub_n = 3 if "fish" in f.name else 1   # the only legacy file is L1.3 (fish_story)
        else:
            continue
    else:
        lvl = int(fn_match.group(1))
        sub_n = int(fn_match.group(2))
    if lvl not in books_by_level:
        continue
    title_m = re.search(r'"book_title"\s*:\s*"([^"]+)"', text)
    focus_m = re.search(r'"focus_graphemes"\s*:\s*\[([^\]]*)\]', text)
    focus = [g.strip().strip('"') for g in (focus_m.group(1).split(",") if focus_m else [])]
    books_by_level[lvl].append({
        "id": f"L{lvl}.{sub_n}",
        "title": title_m.group(1) if title_m else "(unknown)",
        "focus_graphemes": [g for g in focus if g],
        "sub_n": sub_n,
    })

for lvl in books_by_level:
    books_by_level[lvl].sort(key=lambda b: b["sub_n"])

# Map grapheme -> book_id of first introduction
grapheme_intro: dict[str, str] = {}
for lvl, books in books_by_level.items():
    for b in books:
        for g in b["focus_graphemes"]:
            if g not in grapheme_intro:
                grapheme_intro[g] = b["id"]

# Map level to (last book id, next-level first book id)
last_book_of: dict[int, str] = {}
first_book_of: dict[int, str] = {}
for lvl, books in books_by_level.items():
    if books:
        last_book_of[lvl] = books[-1]["id"]
        first_book_of[lvl] = books[0]["id"]


def next_level_first_book(lvl: int) -> str:
    """Return the first book id of the next level — used for 'assumed_from'."""
    if lvl + 1 in first_book_of:
        return first_book_of[lvl + 1]
    return f"L{lvl + 1}.1"


def level_of_book(book_id: str) -> int:
    m = re.match(r"L(\d+)\.\d+", book_id)
    return int(m.group(1)) if m else 1


# ---------------- AUTO-GENERATE PHONICS + TRICKY-WORD SKILLS ----------------
skills: list[dict] = []

# 1. Grapheme decode + encode skills
for grapheme, intro_book in grapheme_intro.items():
    lvl = level_of_book(intro_book)
    last_book = last_book_of[lvl]
    next_lvl_first = next_level_first_book(lvl)
    # Sanitise grapheme for id (e.g. 'a-e' stays 'a-e', 'sh' stays 'sh')
    g_id = grapheme.replace(" ", "")
    skills.append({
        "id": f"decode-{g_id}",
        "name": f"Read words containing the grapheme '{grapheme}'",
        "category": "phonics-decoding",
        "prerequisite_skill_ids": [],
        "introduced_at": intro_book,
        "practised_through": last_book,
        "mastered_by": f"L{lvl}-end",
        "assumed_from": next_lvl_first,
        "notes": f"Grapheme-phoneme correspondence for '{grapheme}'."
    })
    skills.append({
        "id": f"spell-{g_id}",
        "name": f"Spell words using the grapheme '{grapheme}'",
        "category": "spelling-encoding",
        "prerequisite_skill_ids": [f"decode-{g_id}"],
        "introduced_at": intro_book,
        "practised_through": last_book,
        "mastered_by": f"L{lvl}-end",
        "assumed_from": next_lvl_first,
        "notes": f"Segment + encode for grapheme '{grapheme}'."
    })

# 2. Letter formation skills (one per single LOWERCASE letter; not digraphs)
single_letters_introduced: dict[str, str] = {}
for grapheme, book_id in grapheme_intro.items():
    if len(grapheme) == 1 and grapheme.isalpha():
        single_letters_introduced[grapheme] = book_id

for letter, intro_book in single_letters_introduced.items():
    lvl = level_of_book(intro_book)
    last_book = last_book_of[lvl]
    skills.append({
        "id": f"form-letter-{letter}",
        "name": f"Correctly form lowercase letter '{letter}'",
        "category": "handwriting",
        "prerequisite_skill_ids": [],
        "introduced_at": intro_book,
        "practised_through": last_book,
        "mastered_by": f"L{lvl}-end",
        "assumed_from": next_level_first_book(lvl),
        "notes": "Single-stroke ductus on 3-zone guides; letter on baseline.",
    })

# 3. Tricky-word skills
for lvl_key in ["level_1", "level_2", "level_3", "level_4", "level_5", "level_6"]:
    lvl = int(lvl_key.split("_")[1])
    new_tricky = tricky[lvl_key]["new_tricky_words"]
    intro_book = first_book_of.get(lvl, f"L{lvl}.1")
    last_book = last_book_of.get(lvl, f"L{lvl}.1")
    for w in new_tricky:
        wid = re.sub(r"[^a-z]+", "-", w.lower()).strip("-")
        skills.append({
            "id": f"tricky-word-{wid}",
            "name": f"Read and spell the tricky word '{w}'",
            "category": "vocabulary-fluency",
            "prerequisite_skill_ids": [],
            "introduced_at": intro_book,
            "practised_through": last_book,
            "mastered_by": f"L{lvl}-end",
            "assumed_from": next_level_first_book(lvl),
            "notes": "Sight-word — not fully decodable at level of introduction.",
        })

# 4. Blending + segmenting CVC skills (foundational)
skills.extend([
    {
        "id": "blend-cvc-spoken",
        "name": "Blend 3 spoken sounds into a CVC word",
        "category": "phonics-decoding",
        "prerequisite_skill_ids": [],
        "introduced_at": "L1.1",
        "practised_through": "L1.10",
        "mastered_by": "L1-end",
        "assumed_from": "L2.1",
        "notes": "Oral blending before reading.",
    },
    {
        "id": "segment-cvc-spoken",
        "name": "Segment a heard CVC word into 3 sounds",
        "category": "phonics-decoding",
        "prerequisite_skill_ids": ["blend-cvc-spoken"],
        "introduced_at": "L1.1",
        "practised_through": "L1.10",
        "mastered_by": "L1-end",
        "assumed_from": "L2.1",
        "notes": "Oral segmenting before spelling.",
    },
    {
        "id": "blend-cvc-print",
        "name": "Read a printed CVC word by blending",
        "category": "phonics-decoding",
        "prerequisite_skill_ids": ["blend-cvc-spoken"],
        "introduced_at": "L1.1",
        "practised_through": "L1.10",
        "mastered_by": "L1-end",
        "assumed_from": "L2.1",
    },
    {
        "id": "spell-cvc-dictation",
        "name": "Spell a heard CVC word by segmenting and writing",
        "category": "spelling-encoding",
        "prerequisite_skill_ids": ["segment-cvc-spoken"],
        "introduced_at": "L1.2",
        "practised_through": "L1.10",
        "mastered_by": "L1-end",
        "assumed_from": "L2.1",
    },
])

print(f"Auto-generated {len(skills)} skills from data files")

# ---------------- LLM CALL FOR META-SKILLS ----------------
client = OpenAI()
MODEL = "gpt-4o"

# Helper info
LIFECYCLE_NOTE = """
Lifecycle convention (use these exact level/book ids):
  L1.1, L1.2, ..., L1.10  (10 books in Level 1)
  L2.1, L2.2, ..., L2.6
  L3.1, L3.2, ..., L3.5
  L4.1, L4.2, ..., L4.4
  L5.1, L5.2, ..., L5.4
  L6.1, L6.2, ..., L6.4
  "L1-end" / "L2-end" etc. for the mastered_by field.
  "L2.1" / "L3.1" etc. for assumed_from.

Each skill MUST have:
  - introduced_at: a specific level+book id
  - practised_through: last book where worksheets still practise this
  - mastered_by: end-of-level marker (LX-end)
  - assumed_from: never re-taught from this book onwards
"""


def llm_call(stream_name: str, examples: str, target_count: int) -> list[dict]:
    print(f"\n[LLM] Generating {stream_name} meta-skills...")
    resp = client.chat.completions.create(
        model=MODEL, temperature=0.2, max_tokens=8000,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": (
                "You are a senior UK primary literacy curriculum architect (KS1, "
                "ages 4-7). You design progressive skill ledgers in the White Rose "
                "Maths small-step mastery tradition. Be exhaustive and precise. "
                "Each skill must have a clear lifecycle. Never re-teach after the "
                "level a skill should be mastered."
            )},
            {"role": "user", "content": f"""I'm building a comprehensive SKILL LEDGER for the MyPhonicsBooks English-phonics
curriculum spanning L1 (age 4-5, Reception) through L6 (age 7-8, Y2).

The phonics decoding/encoding and tricky-word skills are already auto-generated.
You are responsible ONLY for the {stream_name} stream of skills.

{LIFECYCLE_NOTE}

Example skills in {stream_name}:
{examples}

Output PURE JSON: {{ "skills": [ ... ] }} — at least {target_count} skills covering
the full L1-L6 range. Each skill has fields:
  id, name, category, prerequisite_skill_ids, introduced_at, practised_through,
  mastered_by, assumed_from, notes.

The category field must be EXACTLY "{stream_name}" for every skill in this batch.

Be opinionated about WHEN each skill is introduced and assumed. Build a DAG of
prerequisites where appropriate. Don't pad with trivial skills — every entry
must be teachable as a discrete classroom drill.
"""}
        ],
    )
    out = resp.choices[0].message.content
    try:
        data = json.loads(out)
        sk = data.get("skills", [])
        # Normalise category
        for s in sk:
            s["category"] = stream_name
        print(f"  Got {len(sk)} skills in {stream_name}")
        return sk
    except Exception as e:
        print(f"  [WARN] {stream_name} JSON parse failed: {e}")
        return []


# Three LLM batches — kept small per batch to avoid token-limit truncation
hw_skills = llm_call(
    "handwriting",
    examples=(
        '- {"id": "pencil-grip", "name": "Hold a pencil with a tripod grip", ...}\n'
        '- {"id": "letter-on-baseline", "name": "Every letter body sits on the baseline", ...}\n'
        '- {"id": "finger-spaces", "name": "Leave a finger space between every word", ...}\n'
        '- {"id": "pre-cursive-exit-strokes", "name": "Add entry/exit strokes ready for joining", ...}\n'
        '- {"id": "cursive-join-diagonal", "name": "Join letters with a diagonal stroke (an, in, un)", ...}\n'
        '- {"id": "cursive-join-horizontal", "name": "Join letters with a horizontal stroke (oa, ow)", ...}\n'
        '- {"id": "consistent-x-height", "name": "All x-height letters are the same height", ...}\n'
    ),
    target_count=18,
)

grammar_skills = llm_call(
    "grammar-punctuation",
    examples=(
        '- {"id": "capital-i-pronoun", "name": "Write the pronoun I as a capital", ...}\n'
        '- {"id": "capital-sentence-start", "name": "Start every sentence with a capital letter", ...}\n'
        '- {"id": "full-stop-end", "name": "End every sentence with a full stop", ...}\n'
        '- {"id": "question-mark", "name": "Use a question mark at the end of a question", ...}\n'
        '- {"id": "plurals-s", "name": "Add -s for regular plurals", ...}\n'
        '- {"id": "plurals-es-after-hiss", "name": "Add -es after s/x/sh/ch sounds", ...}\n'
        '- {"id": "past-tense-ed", "name": "Add -ed for regular past tense", ...}\n'
        '- {"id": "contractions-not", "name": "Read and write contractions with n\'t (don\'t, can\'t)", ...}\n'
        '- {"id": "comma-in-list", "name": "Use commas to separate items in a list", ...}\n'
        '- {"id": "conjunction-and", "name": "Join two ideas with the conjunction and", ...}\n'
    ),
    target_count=25,
)

vocab_skills = llm_call(
    "vocabulary-fluency",
    examples=(
        '- {"id": "reading-fluency-pace-l1", "name": "Read decodable CVC sentences at a slow steady pace", ...}\n'
        '- {"id": "answer-direct-comp-question", "name": "Answer a literal question about a story (who/what/where)", ...}\n'
        '- {"id": "infer-character-feeling", "name": "Infer how a character feels from clues in the text", ...}\n'
        '- {"id": "predict-next-event", "name": "Predict what happens next from picture and text cues", ...}\n'
        '- {"id": "retell-story-3-step", "name": "Retell a story in beginning/middle/end", ...}\n'
        '- {"id": "vocab-from-context", "name": "Work out the meaning of an unfamiliar word from context", ...}\n'
    ),
    target_count=15,
)

skills.extend(hw_skills)
skills.extend(grammar_skills)
skills.extend(vocab_skills)

print(f"\nTotal skills: {len(skills)}")
print(f"  - phonics-decoding:     {sum(1 for s in skills if s['category'] == 'phonics-decoding')}")
print(f"  - spelling-encoding:    {sum(1 for s in skills if s['category'] == 'spelling-encoding')}")
print(f"  - handwriting:          {sum(1 for s in skills if s['category'] == 'handwriting')}")
print(f"  - grammar-punctuation:  {sum(1 for s in skills if s['category'] == 'grammar-punctuation')}")
print(f"  - vocabulary-fluency:   {sum(1 for s in skills if s['category'] == 'vocabulary-fluency')}")

# Save the full ledger
(OUT / "skill_ledger.json").write_text(
    json.dumps({"skills": skills}, indent=2), encoding="utf-8"
)
print(f"\nWrote {OUT / 'skill_ledger.json'}")

# Build a quick per-level summary markdown
def book_to_level(b: str) -> int:
    m = re.match(r"L(\d+)", b)
    return int(m.group(1)) if m else 1

per_level: dict[int, dict[str, list[str]]] = {
    l: {"new": [], "practised": [], "assumed": []} for l in range(1, 7)
}
for s in skills:
    lvl_intro = book_to_level(s["introduced_at"])
    if lvl_intro in per_level:
        per_level[lvl_intro]["new"].append(s["id"])
    for l in range(lvl_intro + 1, 7):
        per_level[l]["assumed"].append(s["id"])
    lvl_pract_end = book_to_level(s.get("practised_through", s["introduced_at"]))
    for l in range(lvl_intro, lvl_pract_end + 1):
        if l != lvl_intro:
            per_level[l]["practised"].append(s["id"])

md = ["# MyPhonicsBooks Skill Ledger — Per-Level View",
      "",
      f"Total skills: **{len(skills)}**",
      "",
      "Machine-readable: `skill_ledger.json`",
      ""]
for l in range(1, 7):
    by_cat: dict[str, list[str]] = {}
    for sid in per_level[l]["new"]:
        cat = next((s["category"] for s in skills if s["id"] == sid), "?")
        by_cat.setdefault(cat, []).append(sid)
    md.append(f"## Level {l}")
    md.append("")
    md.append(f"**NEW this level ({len(per_level[l]['new'])} skills):**")
    for cat in sorted(by_cat):
        md.append(f"- _{cat}_: {', '.join(sorted(by_cat[cat]))}")
    md.append("")
    md.append(f"**PRACTISED (carrying over) — {len(per_level[l]['practised'])} skills**  ")
    md.append(f"**ASSUMED (long-term memory) — {len(per_level[l]['assumed'])} skills**")
    md.append("")

(OUT / "skill_ledger.md").write_text("\n".join(md), encoding="utf-8")
print(f"Wrote {OUT / 'skill_ledger.md'}")


# ============================================================
# BOOK COVERAGE — what skills each book introduces vs practises
# ============================================================
def book_index(book_id: str) -> tuple[int, int]:
    """Sort key: (level, sub_n)."""
    m = re.match(r"L(\d+)\.(\d+)", book_id)
    if not m:
        return (9, 9)
    return (int(m.group(1)), int(m.group(2)))


def is_at_or_before(a: str, b: str) -> bool:
    """Return True if book id a comes at or before book id b."""
    return book_index(a) <= book_index(b)


# Build a flat list of all book ids in order
all_book_ids: list[str] = []
for lvl in range(1, 7):
    for b in books_by_level.get(lvl, []):
        all_book_ids.append(b["id"])

book_lookup = {bid: next((b for lvl in range(1, 7) for b in books_by_level.get(lvl, []) if b["id"] == bid), None)
               for bid in all_book_ids}


def book_coverage(book_id: str) -> dict:
    introduces: list[str] = []
    practises: list[str] = []
    for s in skills:
        intro = s["introduced_at"]
        if intro == book_id:
            introduces.append(s["id"])
        elif is_at_or_before(intro, book_id):
            # Still being practised if book_id <= practised_through (within same level)
            pt = s.get("practised_through", intro)
            if "-end" in pt:
                # e.g. "L1-end" — practised through the last book of level 1
                pt_lvl = int(pt[1])
                pt_book = last_book_of.get(pt_lvl, intro)
                if is_at_or_before(book_id, pt_book):
                    practises.append(s["id"])
            elif is_at_or_before(book_id, pt):
                practises.append(s["id"])
    return {"introduces": introduces, "practises": practises}


cov_md = ["# Book → Skill Coverage", "",
          "For each published book: which skills it INTRODUCES (new at this point in",
          "the curriculum) vs PRACTISES (introduced earlier, still actively drilled here).",
          "",
          "Source of truth: `skill_ledger.json`.", ""]
for lvl in range(1, 7):
    if not books_by_level.get(lvl):
        continue
    cov_md.append(f"## Level {lvl}")
    cov_md.append("")
    for b in books_by_level[lvl]:
        cov = book_coverage(b["id"])
        cov_md.append(f"### {b['id']} — *{b['title']}*  (focus: {', '.join(b['focus_graphemes']) or '—'})")
        if cov["introduces"]:
            by_cat: dict[str, list[str]] = {}
            for sid in cov["introduces"]:
                cat = next((s["category"] for s in skills if s["id"] == sid), "?")
                by_cat.setdefault(cat, []).append(sid)
            cov_md.append(f"**Introduces ({len(cov['introduces'])} skills):**")
            for cat in sorted(by_cat):
                cov_md.append(f"- *{cat}*: {', '.join(sorted(by_cat[cat]))}")
        else:
            cov_md.append("**Introduces:** _(none — this is a review/consolidation book)_")
        cov_md.append(f"**Still practising:** {len(cov['practises'])} skills carrying over from earlier books in this level.")
        cov_md.append("")

(OUT / "book_coverage.md").write_text("\n".join(cov_md), encoding="utf-8")
print(f"Wrote {OUT / 'book_coverage.md'}")


# ============================================================
# PER-BOOK PACK PLAN — generated mechanically from the ledger
# ============================================================
# Pack composition by level: each book gets ~6 slots covering the four streams.
# Slot rules:
#   slot 1 — phonics-decoding (the new sound)
#   slot 2 — handwriting (the new letter formation, or active practice)
#   slot 3 — spelling-encoding (the new sound, segment + write)
#   slot 4 — grammar-punctuation (whichever grammar skill is currently active)
#   slot 5 — vocabulary-fluency (tricky word or fluency drill active here)
#   slot 6 — alien-words / cumulative blending review
#
# The actual skill ids drawn for slots 4/5 depend on what's been introduced
# but not yet assumed at this point in the curriculum.

def pack_for(book_id: str) -> list[dict]:
    cov = book_coverage(book_id)
    intro_by_cat: dict[str, list[str]] = {}
    for sid in cov["introduces"]:
        cat = next((s["category"] for s in skills if s["id"] == sid), "?")
        intro_by_cat.setdefault(cat, []).append(sid)
    pract_by_cat: dict[str, list[str]] = {}
    for sid in cov["practises"]:
        cat = next((s["category"] for s in skills if s["id"] == sid), "?")
        pract_by_cat.setdefault(cat, []).append(sid)

    def pick(cat: str, k: int = 3) -> list[str]:
        return (intro_by_cat.get(cat, []) + pract_by_cat.get(cat, []))[:k]

    decoding = pick("phonics-decoding", 4)
    handwriting = pick("handwriting", 4)
    spelling = pick("spelling-encoding", 4)
    grammar = pick("grammar-punctuation", 2)
    fluency = pick("vocabulary-fluency", 3)

    pack = [
        {"slot": 1, "category": "phonics-decoding", "skill_ids": decoding,
         "worksheet_type": "sound-hunt",
         "description": "Identify pictures starting with / containing the focus sound(s)."},
        {"slot": 2, "category": "handwriting", "skill_ids": handwriting,
         "worksheet_type": "trace-and-write",
         "description": "Dotted-trace + independent-write the focus letters with full 3-zone guides."},
        {"slot": 3, "category": "spelling-encoding", "skill_ids": spelling,
         "worksheet_type": "missing-letter-or-dictation",
         "description": "Segment a heard or pictured word and write the missing grapheme(s)."},
        {"slot": 4, "category": "grammar-punctuation", "skill_ids": grammar or ["(no active grammar skill)"],
         "worksheet_type": "grammar-drill",
         "description": "Specific grammar drill matching the active skill (capital-spotter / full-stop hunt / etc)."},
        {"slot": 5, "category": "vocabulary-fluency", "skill_ids": fluency,
         "worksheet_type": "tricky-words-and-fluency",
         "description": "Rainbow-trace tricky word(s) introduced at this level + a short fluency strip."},
        {"slot": 6, "category": "phonics-decoding", "skill_ids": [s for s in decoding] + ["blend-cvc-print"],
         "worksheet_type": "alien-words",
         "description": "Alien-word mission for decoding-only nonsense words using the focus sound(s)."},
    ]
    return pack


per_book = {bid: {"title": book_lookup[bid]["title"] if book_lookup[bid] else "(unknown)",
                  "focus_graphemes": book_lookup[bid]["focus_graphemes"] if book_lookup[bid] else [],
                  "pack": pack_for(bid)}
            for bid in all_book_ids}

(OUT / "per_book_packs.json").write_text(
    json.dumps(per_book, indent=2), encoding="utf-8"
)
print(f"Wrote {OUT / 'per_book_packs.json'}")

# Human-readable
pp_md = ["# Per-Book Worksheet Pack Plan",
         "",
         "Generated from the skill ledger. Each book's pack has 6 slots covering",
         "the four streams: phonics-decoding, handwriting, spelling-encoding,",
         "grammar-punctuation, vocabulary-fluency, plus an alien-words cumulative.",
         "",
         "Source: `skill_ledger.json`. Machine-readable: `per_book_packs.json`.",
         ""]
for lvl in range(1, 7):
    if not books_by_level.get(lvl):
        continue
    pp_md.append(f"## Level {lvl}")
    pp_md.append("")
    for b in books_by_level[lvl]:
        pp_md.append(f"### {b['id']} — *{b['title']}*  (focus: {', '.join(b['focus_graphemes']) or '—'})")
        pp_md.append("")
        for slot in per_book[b["id"]]["pack"]:
            ids = ", ".join(slot["skill_ids"]) if slot["skill_ids"] else "(none)"
            pp_md.append(f"- **Slot {slot['slot']} — {slot['worksheet_type']}** ({slot['category']})")
            pp_md.append(f"  - Skills: `{ids}`")
            pp_md.append(f"  - {slot['description']}")
        pp_md.append("")

(OUT / "per_book_packs.md").write_text("\n".join(pp_md), encoding="utf-8")
print(f"Wrote {OUT / 'per_book_packs.md'}")
