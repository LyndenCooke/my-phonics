"""Build a single readable LEARNING JOURNEY document from the skill ledger.

One markdown file the user can read top-to-bottom and judge whether any
sub-level is overloaded. Format:

  # The Learning Journey
  ## Level N — Big Idea
  | Book | NEW (count) | What's NEW |
  | ...  | ...         | plain-English summary |

  By the end of Level N, the child can: <2-3 bullets>

No skill ids in the body — pure plain English suitable for a head-teacher to
read.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "output" / "worksheet_plan"
DATA = ROOT / "data"

ledger = json.loads((OUT / "skill_ledger.json").read_text())
all_skills = ledger["skills"]

# index skills by id
by_id = {s["id"]: s for s in all_skills}


# Re-parse book inventory (same as ledger build script)
books_by_level: dict[int, list[dict]] = {1: [], 2: [], 3: [], 4: [], 5: [], 6: []}
for f in sorted(DATA.glob("*_story_l*_book1.py")):
    text = f.read_text(encoding="utf-8")
    fn_match = re.search(r"_l(\d+)_(\d+)_book\d+\.py$", f.name)
    if not fn_match:
        legacy = re.search(r"_l(\d+)_book\d+\.py$", f.name)
        if not legacy:
            continue
        lvl = int(legacy.group(1))
        sub_n = 3 if "fish" in f.name else 1
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
        "focus": [g for g in focus if g],
        "sub_n": sub_n,
    })

for lvl in books_by_level:
    books_by_level[lvl].sort(key=lambda b: b["sub_n"])


# Plain-English level headlines
LEVEL_HEADLINES = {
    1: {
        "name": "Starting Stories",
        "age": "Reception · age 4–5",
        "rwi": "RWI Red",
        "big_idea": (
            "Master every Set 1 single-letter sound and the simple digraphs (ck, sh, nk, "
            "ch, th, ng, qu, ff, ll, ss, zz). Form every lowercase letter on the baseline. "
            "Blend and segment any CVC word. Use a capital I, a capital at the start of a "
            "sentence, a full stop at the end, and finger spaces between words. Read and "
            "spell the six core tricky words (the, to, I, no, go, into)."
        ),
        "end_of_level": [
            "form every lowercase letter independently with correct ductus",
            "use finger spaces, capital letters and full stops in their own writing",
            "decode and spell any CVC word built from Set 1 sounds",
            "recognise the six L1 tricky words by sight",
        ],
    },
    2: {
        "name": "Longer Sounds",
        "age": "Year 1 · age 5–6",
        "rwi": "RWI Green + Purple",
        "big_idea": (
            "Add the long-vowel sounds (ay, ee, igh, ow, oo, ar, or, air, ir, ou, oy). "
            "Begin pre-cursive entry-exit strokes; consistent x-height. Recognise "
            "exclamation marks, regular plurals (-s), and 14 new tricky words."
        ),
        "end_of_level": [
            "decode and spell long-vowel words (e.g. tree, light, town, foil)",
            "write with consistent x-height and pre-cursive entry-exit strokes",
            "use exclamation marks appropriately and add -s for plurals",
            "recognise 14 new tricky words (he/she/we/me/be/my/you/her/said/your/are/put + …)",
        ],
    },
    3: {
        "name": "New Spellings",
        "age": "Year 1 · age 6",
        "rwi": "RWI Pink + Orange",
        "big_idea": (
            "Discover that one sound can be spelled different ways: split digraphs "
            "(a-e, i-e, o-e, u-e) and first alternatives (ea, ai, oa, ie, oi, aw, ew, ue). "
            "Begin true cursive joining (diagonal + horizontal joins). Past-tense -ed, "
            "contractions with n't, plurals after hissing sounds (-es)."
        ),
        "end_of_level": [
            "apply the magic-e/split-digraph rule (e.g. cake, time, hope, tube)",
            "read and write words with first alternative spellings (ea, ai, oa, ie)",
            "make basic cursive joins between letters",
            "use past-tense -ed and read contractions like don't, can't",
        ],
    },
    4: {
        "name": "Building Fluency",
        "age": "Year 2 · age 6–7",
        "rwi": "RWI Yellow",
        "big_idea": (
            "Later alternatives (are, ur, er, ew, ue, ow). Multi-syllable words. Reading "
            "with greater fluency. Conjunctions (and), commas in lists, apostrophe in "
            "contractions and possession."
        ),
        "end_of_level": [
            "decode 2-3 syllable words fluently",
            "use commas to separate items in a list",
            "use apostrophe for contractions and simple possession",
            "join two ideas with the conjunction 'and'",
        ],
    },
    5: {
        "name": "Reading Together",
        "age": "Year 2 · age 7",
        "rwi": "RWI Blue",
        "big_idea": (
            "Final advanced graphemes (ire, ore, ear, oor, tion, ure). Reading "
            "comprehension and inference become primary. Conjunctions but/because, "
            "compound sentences, apostrophe-possession."
        ),
        "end_of_level": [
            "read longer narratives independently with strong comprehension",
            "infer character feelings and sequence events in a story",
            "write compound sentences with conjunctions (and, but, because)",
            "use the apostrophe correctly for possession",
        ],
    },
    6: {
        "name": "Reading Champion",
        "age": "Year 2 · age 7–8",
        "rwi": "RWI Grey",
        "big_idea": (
            "Advanced suffixes (-ous, -cious, -tious, -able, -ible). Homophones. "
            "Independent writing with personal handwriting style. Speech marks, "
            "semicolons (introduction), complex sentences."
        ),
        "end_of_level": [
            "apply suffix spelling rules (drop-e, doubling)",
            "identify and use homophones correctly (to/two/too)",
            "use speech marks for direct speech",
            "write at speed with consistent personal handwriting style",
        ],
    },
}


# Build a plain-English summary of new skills per book.
GRAMMAR_LABELS = {
    "capital-i-pronoun": "capital I",
    "capital-sentence-start": "capital letter at start of sentence",
    "full-stop-end": "full stop at end of sentence",
    "question-mark": "question marks",
    "exclamation-mark": "exclamation marks",
    "plurals-s": "regular plurals (add -s)",
    "plurals-es-after-hiss": "plurals after hissing sounds (-es)",
    "past-tense-ed": "past tense (-ed ending)",
    "contractions-not": "contractions with n't (don't, can't)",
    "comma-in-list": "commas in a list",
    "conjunction-and": "joining ideas with 'and'",
    "conjunction-but": "joining ideas with 'but'",
    "conjunction-because": "joining ideas with 'because'",
    "apostrophe-contraction": "apostrophe in contractions",
    "apostrophe-possession": "apostrophe for possession (the cat's tail)",
    "speech-marks": "speech marks",
    "semicolon-complex": "semicolons",
    "colon-list": "colons",
    "hyphen-compound": "hyphens in compound words",
    "homophones": "homophones (to/two/too, there/their/they're)",
}

HANDWRITING_LABELS = {
    "pencil-grip": "tripod pencil grip",
    "basic-strokes": "basic pre-letter strokes",
    "letter-on-baseline": "letters sitting on the baseline",
    "letter-formation": "consistent letter formation",
    "letter-formation-lowercase": "consistent lowercase letter formation",
    "letter-formation-uppercase": "first capital letter formation",
    "finger-spaces": "finger spaces between words",
    "consistent-x-height": "consistent x-height across letters",
    "pre-cursive-exit-strokes": "pre-cursive entry/exit strokes",
    "letter-spacing": "consistent letter spacing",
    "word-spacing": "consistent word spacing",
    "cursive-join-diagonal": "diagonal cursive joins",
    "cursive-join-horizontal": "horizontal cursive joins",
    "cursive-join-loop": "looped cursive joins",
    "cursive-join-mixed": "mixed cursive joins",
    "consistent-slant": "consistent handwriting slant",
    "personal-style": "personal handwriting style",
    "speed": "writing at speed",
    "neatness": "neatness across longer passages",
    "capital-letter-formation": "capital letter formation",
    "cursive-capital-joins": "joining capitals into cursive script",
    "cursive-speed": "writing cursive at speed",
    "letter-size-consistency": "letter-size consistency",
    "spacing-between-letters": "spacing between letters",
    "writing-alignment": "writing alignment across the page",
    "writing-on-lined-paper": "writing neatly on lined paper",
    "personal-handwriting-style": "personal handwriting style",
}

FLUENCY_LABELS = {
    "reading-fluency-pace-l1": "early reading pace (CVC sentences)",
    "answer-direct-comp-question": "answer direct comprehension questions",
    "retell-story-3-step": "retell a story in beginning/middle/end",
    "infer-character-feeling": "infer character feelings",
    "predict-next-event": "predict the next event in a story",
    "vocab-from-context": "work out word meaning from context",
    "summarize-paragraph": "summarise a paragraph",
    "summarize-main-idea": "summarise the main idea",
    "compare-contrast-characters": "compare and contrast characters",
    "identify-main-idea": "identify the main idea of a passage",
    "draw-conclusions": "draw conclusions from a text",
    "sequence-events": "sequence events in order",
    "make-connections": "make text-to-self / text-to-text connections",
    "make-text-connections": "make connections between texts",
    "identify-author-purpose": "identify the author's purpose",
    "synthesize-information": "synthesise information from a text",
    "critique-text": "critique a short text",
    "evaluate-text-credibility": "evaluate the credibility of a text",
    "evaluate-author-intent": "evaluate the author's intent",
    "analyze-text-structure": "analyse text structure",
    "interpret-figurative-language": "interpret figurative language",
}


def label_for(skill_id: str) -> str:
    if skill_id in GRAMMAR_LABELS:
        return GRAMMAR_LABELS[skill_id]
    if skill_id in HANDWRITING_LABELS:
        return HANDWRITING_LABELS[skill_id]
    if skill_id in FLUENCY_LABELS:
        return FLUENCY_LABELS[skill_id]
    if skill_id.startswith("tricky-word-"):
        word = skill_id.replace("tricky-word-", "")
        return f"'{word}'"
    if skill_id.startswith("form-letter-"):
        return None  # handled by counting letters explicitly
    if skill_id.startswith("decode-"):
        return None  # handled by listing focus graphemes
    if skill_id.startswith("spell-"):
        return None
    if skill_id == "blend-cvc-print" or skill_id == "blend-cvc-spoken":
        return "blend CVC words"
    if skill_id == "segment-cvc-spoken":
        return "segment heard CVC words"
    if skill_id == "spell-cvc-dictation":
        return "spell heard CVC words"
    return skill_id  # fallback to id


def describe_book_new_skills(book_id: str, focus: list[str]) -> str:
    """Build a short plain-English summary of what's NEW at this book."""
    new_skill_ids = [s["id"] for s in all_skills if s.get("introduced_at") == book_id]

    parts: list[str] = []

    # 1. New focus graphemes (sounds) — from book's focus_graphemes
    if focus:
        if len(focus) == 1:
            parts.append(f"sound **{focus[0]}**")
        else:
            parts.append("sounds " + ", ".join(f"**{g}**" for g in focus))

    # 2. New letter formations (form-letter-X)
    new_letters = sorted([s["id"].replace("form-letter-", "") for s in all_skills
                          if s.get("introduced_at") == book_id
                          and s["id"].startswith("form-letter-")])
    if new_letters:
        if len(new_letters) <= 6:
            parts.append(f"write letters {' '.join(new_letters)}")
        else:
            parts.append(f"write {len(new_letters)} new letters")

    # 3. New tricky words
    tricky_new = sorted([s["id"].replace("tricky-word-", "") for s in all_skills
                         if s.get("introduced_at") == book_id
                         and s["id"].startswith("tricky-word-")])
    if tricky_new:
        if len(tricky_new) <= 4:
            parts.append("tricky words " + ", ".join(f"'{w}'" for w in tricky_new))
        else:
            parts.append(f"{len(tricky_new)} new tricky words")

    # 4. Specific meta skills (grammar / handwriting / fluency)
    meta_skills: list[str] = []
    for sid in new_skill_ids:
        if sid.startswith(("decode-", "spell-", "form-letter-", "tricky-word-")):
            continue
        lbl = label_for(sid)
        if lbl:
            meta_skills.append(lbl)
    if meta_skills:
        parts.append("plus " + ", ".join(meta_skills))

    if not parts:
        return "*(consolidation — no new skills at this book)*"

    return ". ".join(p.capitalize() if i == 0 else p for i, p in enumerate(parts)) + "."


# Build the document
md: list[str] = [
    "# The MyPhonicsBooks Learning Journey",
    "",
    "A scannable map of what every child learns at each level and each book.",
    "Use this to check pacing — if a sub-level looks overloaded, the NEW-skills",
    "count flags it. Skills that should already be in long-term memory are not",
    "re-taught — they're shown in the 'assumed' totals.",
    "",
    "---",
    "",
]

prev_assumed = 0
for lvl in range(1, 7):
    info = LEVEL_HEADLINES[lvl]
    books = books_by_level.get(lvl, [])
    new_at_level = sum(1 for s in all_skills
                       if re.match(rf"L{lvl}\.\d+", s.get("introduced_at", "")))

    md.append(f"## Level {lvl} — {info['name']}")
    md.append(f"*{info['age']} · {info['rwi']} · {len(books)} books · {new_at_level} new skills introduced*")
    md.append("")
    md.append(f"**The big idea.** {info['big_idea']}")
    md.append("")
    if prev_assumed:
        md.append(f"**Assumed knowledge entering this level:** {prev_assumed} skills already mastered from earlier levels (not re-practised in worksheets).")
        md.append("")

    md.append("| Book | NEW skills | What's new at this book |")
    md.append("|---|---:|---|")
    for b in books:
        count_new = sum(1 for s in all_skills if s.get("introduced_at") == b["id"])
        desc = describe_book_new_skills(b["id"], b["focus"])
        md.append(f"| **{b['id']}** *{b['title']}* | {count_new} | {desc} |")
    md.append("")

    md.append(f"**By the end of Level {lvl}, a child can:**")
    for eol in info["end_of_level"]:
        md.append(f"- {eol}")
    md.append("")
    md.append("---")
    md.append("")
    prev_assumed += new_at_level

# Final footer
md.append("## Summary at a glance")
md.append("")
md.append("| Level | Age | Books | New skills | Cumulative skills mastered |")
md.append("|---|---|---:|---:|---:|")
cumulative = 0
for lvl in range(1, 7):
    info = LEVEL_HEADLINES[lvl]
    books = books_by_level.get(lvl, [])
    new_at_level = sum(1 for s in all_skills
                       if re.match(rf"L{lvl}\.\d+", s.get("introduced_at", "")))
    cumulative += new_at_level
    md.append(f"| L{lvl} {info['name']} | {info['age']} | {len(books)} | {new_at_level} | {cumulative} |")

(OUT / "learning_journey.md").write_text("\n".join(md), encoding="utf-8")
print(f"Wrote {OUT / 'learning_journey.md'}")
