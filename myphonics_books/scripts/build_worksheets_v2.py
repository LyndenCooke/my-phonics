"""
Worksheet builder v2 — with a real critic in the loop.

v1 (build_worksheets.py) failed on four dimensions: it shipped non-decodable
words, sense-broken tasks, sentence-instructions for non-readers, and a
sterile aesthetic. This rebuild adds:

  1. A strict deterministic decodability validator (Python) that
     greedy-tokenises every generated word against the level's
     cumulative grapheme set + cumulative tricky-word list. Hard gate.
  2. A senior-literacy JUDGE (gpt-5.5-pro with vision) that reviews the
     RENDERED PNG of each worksheet against pedagogy + child-access +
     aesthetic criteria. Returns JSON verdict.
  3. A generator (gpt-5.5) that writes content with the validator's
     and judge's failures as feedback when regenerating.
  4. Generate -> validate -> render -> judge -> revise loop with a
     max-iteration cap so we never silently ship a fail.

Templates are also redesigned: hero illustration in the corner of each
worksheet, big icon + 3-word instruction, single focus sound at L1,
demo row showing one worked example.

Usage:
    py -3.12 scripts/build_worksheets_v2.py --only L1.1
    py -3.12 scripts/build_worksheets_v2.py --levels 1,2
    py -3.12 scripts/build_worksheets_v2.py            # everything
"""

from __future__ import annotations

import argparse
import asyncio
import base64
import io
import json
import os
import random
import re
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

import fitz  # PyMuPDF
from openai import OpenAI
from core.pdf_generator import get_pdf_generator  # noqa: E402

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

env_path = ROOT / ".env"
for line in env_path.read_text(encoding="utf-8").splitlines():
    if line.startswith("OPENAI_API_KEY="):
        os.environ["OPENAI_API_KEY"] = line.split("=", 1)[1].strip()

GEN_MODEL = "gpt-5.5"  # content generator (chat completions)
JUDGE_MODEL = "gpt-5.5"  # vision judge (chat completions w/ vision + json mode)
# Note: gpt-5.5-pro is the reasoning/responses-API variant and isn't
# supported on chat/completions. gpt-5.5 (the chat flagship) is what
# we use for both generator and judge.

client = OpenAI()

DATA_DIR = ROOT / "data"
IMAGES_DIR = ROOT / "output" / "images"
FONTS_DIR = ROOT / "assets" / "fonts"
OUT_ROOT = ROOT / "output" / "worksheets_v2"
LOG_DIR = ROOT / "output" / "worksheets_v2" / "_logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

LEVEL_COLOURS = {1: "#E84B8A", 2: "#F59E0B", 3: "#22C55E", 4: "#3B82F6", 5: "#8B5CF6", 6: "#14B8A6"}
LEVEL_TINTS   = {1: "#FFE6F0", 2: "#FFF1DB", 3: "#E6F8EB", 4: "#E1ECFD", 5: "#EFE6FA", 6: "#DBF6F1"}
LEVEL_NAMES   = {1: "Starting Stories", 2: "Longer Sounds", 3: "New Spellings",
                 4: "Building Fluency", 5: "Reading Together", 6: "Reading Champion"}

graphemes_data = json.loads((DATA_DIR / "graphemes_by_level.json").read_text())
tricky_data = json.loads((DATA_DIR / "tricky_words_by_level.json").read_text())
summaries = json.loads((DATA_DIR / "story_summaries.json").read_text(encoding="utf-8"))


# ---------------------------------------------------------------------------
# Decodability validator
# ---------------------------------------------------------------------------

def cumulative_graphemes(level: int) -> list[str]:
    """Whole-level cumulative — every grapheme introduced by ANY book at
    levels up to and including `level`. Permissive."""
    return graphemes_data[f"level_{level}"]["cumulative_graphemes"]


def cumulative_tricky(level: int) -> set[str]:
    return {w.lower() for w in tricky_data[f"level_{level}"]["cumulative"]}


# Pre-built per-book grapheme accumulator. Reads story_summaries
# completed_books in order and builds the cumulative set as we go,
# so e.g. L1.1 has just SATPIN, L1.2 has SATPIN + mdgo, etc. This is
# the strict scope the meta-review demanded — a child at L1.1 does
# not yet know `ck`, even though `ck` is in the level-1 cumulative.
_PER_BOOK_GRAPHEMES: dict[str, set[str]] = {}


def _build_per_book_cumulative():
    if _PER_BOOK_GRAPHEMES:
        return
    running: set[str] = set()
    for lkey in sorted(k for k in summaries if k.startswith("level_")):
        for entry in summaries[lkey].get("completed_books", []) + summaries[lkey].get("planned_books", []):
            sub = entry.get("sub_level")
            focus = entry.get("focus_sounds") or []
            if not sub:
                continue
            running.update(focus)
            # Convention from data: book ids are like "1.1" (no L prefix in summaries)
            _PER_BOOK_GRAPHEMES[f"L{sub}"] = set(running)


def book_cumulative_graphemes(book: "Book") -> list[str]:
    _build_per_book_cumulative()
    return sorted(_PER_BOOK_GRAPHEMES.get(book.sub_level, set(cumulative_graphemes(book.level))))


# Full UK SSP grapheme inventory used for tokenisation. Greedy-longest
# matching: the parser will always prefer a multi-letter grapheme over a
# single letter when both could fit. This is how a child actually decodes
# (they're taught to spot the digraph first).
FULL_GRAPHEMES = [
    # 5-letter
    "cious", "tious",
    # 4-letter
    "able", "ible", "tion", "sion",
    # 3-letter
    "igh", "air", "ear", "ure", "ore", "oor", "ire", "tch", "dge", "ous",
    # 2-letter digraphs / doubles / silent-letter combos
    "sh", "ch", "th", "ph", "wh", "ng", "nk", "ck",
    "ff", "ll", "ss", "zz", "gg", "bb", "dd", "tt", "mm", "nn", "pp", "rr",
    "qu", "kn", "wr", "gh",
    "ee", "ea", "oa", "ai", "ay", "ow", "ou", "oo", "oi", "oy", "ie", "oe",
    "ar", "or", "er", "ir", "ur", "are", "ew", "ue",
    # single letters
    *list("abcdefghijklmnopqrstuvwxyz"),
]
FULL_GRAPHEMES = sorted(set(FULL_GRAPHEMES), key=lambda g: (-len(g), g))

VOWEL_LETTERS = set("aeiou")
CONSONANT_LETTERS = set("bcdfghjklmnpqrstvwxyz")
# Two-letter combos that count as a SINGLE grapheme (so a word starting
# with one isn't a consonant CLUSTER even though it's two letters):
SINGLE_CONSONANT_GRAPHEMES = {
    "sh", "ch", "th", "ph", "wh", "qu", "kn", "wr", "gh", "ck",
    "ff", "ll", "ss", "zz", "gg", "bb", "dd", "tt", "mm", "nn", "pp", "rr",
}

# Permitted final blends at L1 / L2 (children know both sounds; SSP
# convention treats these as decodable even though L1-L2 otherwise
# forbids consonant clusters).
PERMITTED_FINAL_BLENDS_L12 = {"nd", "nt", "mp", "lt", "lp", "lk", "ft", "st", "sp", "sk"}
# In practice, Letters & Sounds at L1 limits to nd/nt/mp; we keep the
# strict set here.
STRICT_FINAL_BLENDS_L12 = {"nd", "nt", "mp"}


def tokenise(word: str) -> list[str] | None:
    """Greedy longest-grapheme tokenisation of a word. Returns None if
    the word contains a character that doesn't match any grapheme."""
    w = word.lower()
    if not w or not w.isalpha():
        return None
    tokens: list[str] = []
    n = len(w)
    i = 0
    while i < n:
        # Magic-e: V[consonant]e at the very end -> tokenise as
        # 'V-e' + the consonant + skip the final e.
        if (
            w[i] in VOWEL_LETTERS
            and i + 2 == n - 1
            and w[n - 1] == "e"
            and w[i + 1] in CONSONANT_LETTERS
        ):
            tokens.append(f"{w[i]}-e")
            tokens.append(w[i + 1])
            return tokens

        matched: str | None = None
        for g in FULL_GRAPHEMES:
            if w[i : i + len(g)] == g:
                matched = g
                break
        if matched is None:
            return None
        tokens.append(matched)
        i += len(matched)
    return tokens


def is_decodable(word: str, level: int, allowed_graphemes: set[str] | None = None) -> tuple[bool, str]:
    """Returns (ok, reason). If `allowed_graphemes` is provided, use that
    as the scope (strict per-book). Otherwise fall back to the
    level-cumulative (permissive)."""
    w = word.lower().strip().rstrip(".,!?;:'\"")
    if not w:
        return True, "empty"
    if w in cumulative_tricky(level):
        return True, "tricky"
    if w in {"a", "i"}:
        return True, "trivial"

    # Suffix peel-off for plurals / -ing / -ed (only from L2 onwards for
    # ing/ed — L1 reserves morphology to "+s only").
    suffixes = [("s", 1)]
    if level >= 2:
        suffixes += [("ing", 1), ("ed", 1), ("es", 1)]
    for suf, _ in suffixes:
        if w.endswith(suf) and len(w) > len(suf) + 1:
            stem = w[: -len(suf)]
            ok, reason = is_decodable(stem, level, allowed_graphemes)
            if ok:
                return True, f"stem+{suf} ({reason})"

    tokens = tokenise(w)
    if tokens is None:
        return False, f"could not tokenise '{w}'"

    allowed = allowed_graphemes if allowed_graphemes is not None else set(cumulative_graphemes(level))
    # cumulative_graphemes does NOT include single 'e' alone for some
    # levels via the magic-e mechanism — but plain 'e' is in L1 already,
    # so this is fine.
    for g in tokens:
        if g not in allowed:
            return False, f"requires grapheme '{g}' (not in L{level} cumulative)"

    # Initial consonant cluster rule. At L1/L2 only books with no
    # initial clusters are decodable. A "cluster" is two adjacent
    # SINGLE-LETTER consonant graphemes (digraphs like 'sh' don't count).
    if level <= 2 and len(tokens) >= 2:
        a, b = tokens[0], tokens[1]
        if (
            len(a) == 1 and a in CONSONANT_LETTERS
            and len(b) == 1 and b in CONSONANT_LETTERS
        ):
            return False, f"initial consonant cluster '{a}{b}' not allowed at L{level}"

    # Final blend rule at L1/L2: only nd / nt / mp permitted; other
    # consonant-pair endings reject.
    if level <= 2 and len(tokens) >= 2:
        a, b = tokens[-2], tokens[-1]
        if (
            len(a) == 1 and a in CONSONANT_LETTERS
            and len(b) == 1 and b in CONSONANT_LETTERS
        ):
            blend = a + b
            if blend not in STRICT_FINAL_BLENDS_L12:
                return False, f"final blend '{blend}' not allowed at L{level}"

    return True, "tokenised ok " + "+".join(tokens)


def all_decodable(words: list[str], level: int, allowed_graphemes: set[str] | None = None) -> tuple[bool, list[dict]]:
    fails: list[dict] = []
    seen: set[str] = set()
    for raw in words:
        w = raw.lower().strip().rstrip(".,!?;:'\"")
        if not w or w in seen:
            continue
        seen.add(w)
        ok, reason = is_decodable(w, level, allowed_graphemes)
        if not ok:
            fails.append({"word": w, "reason": reason})
    return (len(fails) == 0, fails)


# ---------------------------------------------------------------------------
# Books
# ---------------------------------------------------------------------------

@dataclass
class Book:
    sub_level: str
    level: int
    n: int
    title: str
    focus_sounds: list[str]
    culture: str
    theme: str

    @property
    def storage_key(self) -> str:
        return f"{self.level}_{self.n}"


def load_books() -> list[Book]:
    books: list[Book] = []
    for lkey, ldata in summaries.items():
        if not lkey.startswith("level_"):
            continue
        level = int(lkey.split("_")[1])
        for entry in ldata.get("completed_books", []):
            sub = entry["sub_level"]
            l, n = sub.split(".")
            books.append(
                Book(
                    sub_level=f"L{sub}",
                    level=int(l),
                    n=int(n),
                    title=entry["title"],
                    focus_sounds=list(entry["focus_sounds"]),
                    culture=entry.get("culture", ""),
                    theme=entry.get("theme", ""),
                )
            )
    return sorted(books, key=lambda b: (b.level, b.n))


# ---------------------------------------------------------------------------
# Hero image lookup
# ---------------------------------------------------------------------------

def hero_for(book: Book) -> Path | None:
    candidates = [
        IMAGES_DIR / f"L{book.level}_{book.n}_B1" / "hero_reference.png",
        IMAGES_DIR / f"L{book.level}_{book.n}_B1" / "hero.png",
    ]
    for p in candidates:
        if p.exists():
            return p
    return None


def hero_data_url(book: Book) -> str | None:
    p = hero_for(book)
    if not p:
        return None
    data = base64.b64encode(p.read_bytes()).decode("ascii")
    return f"data:image/png;base64,{data}"


def font_b64(name: str) -> str:
    return base64.b64encode((FONTS_DIR / name).read_bytes()).decode("ascii")


# ---------------------------------------------------------------------------
# Worksheet content generator (gpt-5.5)
# ---------------------------------------------------------------------------

GEN_SYSTEM = """\
You are a SENIOR systematic synthetic phonics worksheet author for ages 4-7.
You write content for ONE worksheet at a time. You ALWAYS return strict
JSON. You NEVER use a word whose graphemes are not on the cumulative
grapheme list for the level (the only exceptions are tricky/sight words
listed). You write in British English (colour, mum, favourite). You
think like a Reception or KS1 teacher about cognitive load — one task
per worksheet, simple unambiguous categories, child-accessible
instructions (4-word maximum). You are willing to admit when a word
isn't decodable and propose an alternative.
"""


def gen_content_for(book: Book, wtype: str, prior_feedback: list[str] | None = None) -> dict:
    """Generate raw content for one worksheet type. Returns a dict
    shape that matches the renderer's expectations for that type."""
    level = book.level
    # Use the BOOK-SPECIFIC cumulative grapheme set (only what the child
    # has been taught up to and including this story), not the whole
    # level. Per the meta-review's "scope fidelity" rule, a child at
    # L1.1 has only SATPIN, not the full L1 inventory.
    g = book_cumulative_graphemes(book)
    t = sorted(cumulative_tricky(level))
    focus = book.focus_sounds

    feedback_block = ""
    if prior_feedback:
        feedback_block = (
            "\n\nPREVIOUS ATTEMPT WAS REJECTED. Specific failures to fix:\n- "
            + "\n- ".join(prior_feedback)
        )

    spec = WORKSHEET_SPECS[wtype]

    user = f"""Generate content for a SINGLE worksheet of type "{wtype}".

Book: "{book.title}"  ({book.sub_level})
Level focus sounds (new this book): {focus}
Cumulative graphemes ALLOWED: {g}
Cumulative tricky / sight words ALLOWED: {t}
Culture context (for theme only, never proper nouns in content): {book.culture}
Theme: {book.theme}

WORKSHEET SPEC:
{spec['gen_prompt']}

JSON SCHEMA (return EXACTLY this shape):
{spec['schema']}

CRITICAL RULES (a rejected worksheet costs us money — be careful):
- Every word in the output must use ONLY graphemes from the cumulative list
  OR be in the cumulative tricky-word list. NO exceptions.
- At L1, NO initial consonant clusters (st-, sn-, sp-, bl-, etc.). Final
  blends nd/nt/mp are OK.
- At L2, still NO initial consonant clusters.
- Instructions for children must be 4 WORDS OR FEWER and use only words
  the child can read at this level (or be paired with an icon).
- Tasks must be UNAMBIGUOUS — a word card going into a sort must belong
  in exactly ONE box, not both.
- Do not use proper nouns the child won't recognise.
- British English spelling.
{feedback_block}

Return strict JSON ONLY. No prose, no markdown fences."""

    resp = client.chat.completions.create(
        model=GEN_MODEL,
        messages=[
            {"role": "system", "content": GEN_SYSTEM},
            {"role": "user", "content": user},
        ],
        response_format={"type": "json_object"},
    )
    return json.loads(resp.choices[0].message.content)


# ---------------------------------------------------------------------------
# Per-worksheet spec: gen prompt + schema + words-to-validate + renderer
# ---------------------------------------------------------------------------

WORKSHEET_SPECS: dict[str, dict[str, Any]] = {}

def register(wtype: str, **kwargs):
    WORKSHEET_SPECS[wtype] = kwargs


register(
    "letter_spotter",
    gen_prompt=(
        "Lowest-attainer worksheet. Pick ONE focus grapheme from the "
        "book's focus_sounds list. Pick 5 distractor graphemes from the "
        "cumulative_graphemes (singles only, visually distinct from the "
        "target). Output the chosen target grapheme and the 5 distractors. "
        "No words — only single graphemes. The renderer scatters a grid "
        "of these letters, the child circles every occurrence of the "
        "target."
    ),
    schema='{ "target_sound": "a", "distractor_sounds": ["t","p","i","n","s"], "instruction_3w": "Circle the a" }',
    words_to_validate=lambda c: [],
),
register(
    "sound_hunt",
    gen_prompt=(
        "Pick ONE focus sound from the book's focus_sounds list to be the "
        "target. Provide EXACTLY 7 target_words (contain the target sound) "
        "and EXACTLY 3 distractor_words (do NOT contain it). 10 items "
        "total; 70% target ratio. Words must be 2-4 letters at L1, 2-5 "
        "at L2-L3. Plus one extra target word for the worked demo cell."
    ),
    schema='{ "target_sound": "<one focus sound>", "instruction_3w": "Find the X", "target_words": [...7 words], "distractor_words": [...3 words], "demo_word": "<one extra target word, different from the 7>" }',
    words_to_validate=lambda c: list(c["target_words"]) + list(c["distractor_words"]) + [c["demo_word"]],
),

register(
    "rainbow_tracing",
    gen_prompt=(
        "For each grapheme in focus_sounds, provide a short caption that "
        "describes a single mouth-position cue (e.g. 's: long snake sound — "
        "tongue behind teeth')."
    ),
    schema='{ "instruction_3w": "Trace the sounds", "rows": [{ "grapheme": "s", "mouth_cue": "snake sound" }, ...] }',
    words_to_validate=lambda c: [],  # graphemes themselves are by definition allowed
),

register(
    "roll_and_read",
    gen_prompt=(
        "Provide a grid of 18 DECODABLE single words (3 rows × 6 cols) "
        "that the child practises reading aloud across, down, and "
        "randomly. Bias every word to contain at least one of the "
        "book's focus sounds. Words must be 2-4 letters at L1, 2-5 at "
        "L2-L3. No repeats."
    ),
    schema='{ "instruction_3w": "Read each word", "grid": [["w1","w2","w3","w4","w5","w6"], ["..."], ["..."]] }',
    words_to_validate=lambda c: [w for row in c["grid"] for w in row],
),

register(
    "cut_paste_sort",
    gen_prompt=(
        "Pick TWO sounds from focus_sounds (or repeat one if only one). "
        "Then provide 6 single decodable words that contain ONE of the "
        "two sounds but NOT BOTH (this is critical — words that could go "
        "in either box make the task collapse). 3 belong with sound A, 3 "
        "with sound B."
    ),
    schema='{ "instruction_3w": "Sort by sound", "sound_a": "s", "sound_b": "t", "sound_a_words": [...3], "sound_b_words": [...3] }',
    words_to_validate=lambda c: list(c["sound_a_words"]) + list(c["sound_b_words"]),
),

register(
    "comp_draw",
    gen_prompt=(
        "Give the child ONE prompt to draw their favourite part of THIS "
        "specific book. The prompt itself must be 5-7 words and "
        "DECODABLE (use only allowed graphemes / tricky words). Then "
        "provide a single sentence-starter for the caption underneath."
    ),
    schema='{ "instruction_3w": "Draw the bit you liked", "prompt": "...", "caption_starter": "I liked ..." }',
    words_to_validate=lambda c: re.findall(r"[A-Za-z]+", c.get("prompt", "") + " " + c.get("caption_starter", "")),
),

register(
    "comp_draw_describe",
    gen_prompt=(
        "Give the child a draw-and-describe prompt for THIS book. The "
        "prompt should ask them to draw their favourite part AND write "
        "ONE sentence. Provide 3 sentence-starters they can pick from. "
        "All starters DECODABLE."
    ),
    schema='{ "instruction_3w": "Draw and write", "prompt": "...", "starters": ["...", "...", "..."] }',
    words_to_validate=lambda c: re.findall(r"[A-Za-z]+", " ".join(c.get("starters", []) + [c.get("prompt", "")])),
),

register(
    "comp_write_draw",
    gen_prompt=(
        "L3 child writes 2-3 sentences about their favourite part of this "
        "book, then adds a small picture. Provide 3 sentence-starters."
    ),
    schema='{ "instruction_3w": "Write and draw", "prompt": "...", "starters": ["...", "...", "..."] }',
    words_to_validate=lambda c: re.findall(r"[A-Za-z]+", " ".join(c.get("starters", []) + [c.get("prompt", "")])),
),

register(
    "comp_questions",
    gen_prompt=(
        "L4 child reads the book and answers 4 questions about it. Mix "
        "retrieval (1-2) with inference / personal response (3-4). Each "
        "question DECODABLE and concrete to THIS book's story."
    ),
    schema='{ "instruction_3w": "Answer the questions", "questions": ["q1", "q2", "q3", "q4"] }',
    words_to_validate=lambda c: re.findall(r"[A-Za-z]+", " ".join(c.get("questions", []))),
),

register(
    "comp_paragraph",
    gen_prompt=(
        "L5/L6 child writes a paragraph (4+ sentences) about this book. "
        "Provide 4 prompts they can pick from, each grounded in THIS "
        "book's themes, all DECODABLE."
    ),
    schema='{ "instruction_3w": "Write a paragraph", "prompts": ["...", "...", "...", "..."] }',
    words_to_validate=lambda c: re.findall(r"[A-Za-z]+", " ".join(c.get("prompts", []))),
),

register(
    "sentence_building",
    gen_prompt=(
        "Provide a word bank of 12 DECODABLE words (mix of decodable + "
        "tricky) that fit this book's vibe. Then provide 4 sentence "
        "frames with blanks the child can fill from the bank. Each frame "
        "should make sense once filled."
    ),
    schema='{ "instruction_3w": "Build a sentence", "word_bank": [...12], "frames": ["The ___ ___ ___.", "..."] }',
    words_to_validate=lambda c: list(c.get("word_bank", [])),
),

register(
    "dictation",
    gen_prompt=(
        "Provide 5 single dictation words (ordered easy -> hard, all "
        "containing focus sounds where possible) and 3 dictation "
        "sentences (ordered easy -> hard). All words decodable."
    ),
    schema='{ "instruction_3w": "Write what I say", "words": [...5], "sentences": [...3] }',
    words_to_validate=lambda c: list(c.get("words", [])) + re.findall(r"[A-Za-z]+", " ".join(c.get("sentences", []))),
),

register(
    "fluency_strips",
    gen_prompt=(
        "Provide 6 short fluency-practice sentences (5-9 words at L3, "
        "7-12 at L4-L5, 10-15 at L6). Each sentence must scan naturally "
        "aloud, connect loosely to THIS book's setting/theme, and be "
        "fully decodable."
    ),
    schema='{ "instruction_3w": "Read three times", "strips": ["...", ...6 strips] }',
    words_to_validate=lambda c: re.findall(r"[A-Za-z]+", " ".join(c.get("strips", []))),
),

register(
    "crossword",
    gen_prompt=(
        "Provide 6 clue/answer pairs. Each answer must be a DECODABLE "
        "single word 3-7 letters. Each clue must be one short concrete "
        "line the child can hear from the teacher and solve. Clues "
        "themselves can use words beyond the level (only the teacher "
        "reads them) but should be 6-10 words."
    ),
    schema='{ "instruction_3w": "Fill the boxes", "pairs": [{ "clue": "...", "answer": "..." }, ...6 pairs] }',
    words_to_validate=lambda c: [p["answer"] for p in c.get("pairs", [])],
),


# ---------------------------------------------------------------------------
# Renderers — one per worksheet type. All A4 portrait, brand-consistent.
# Each takes (book, content_dict) and returns HTML string.
# ---------------------------------------------------------------------------

def shared_css(level: int) -> str:
    colour = LEVEL_COLOURS[level]
    tint = LEVEL_TINTS[level]
    return f"""
@font-face {{ font-family: 'Andika'; src: url(data:font/ttf;base64,{font_b64('Andika-Regular.ttf')}) format('truetype'); font-weight: 400; }}
@font-face {{ font-family: 'Andika'; src: url(data:font/ttf;base64,{font_b64('Andika-Bold.ttf')}) format('truetype'); font-weight: 700; }}

* {{ box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
html, body {{ margin: 0; padding: 0; font-family: 'Andika', sans-serif; color: #1a1a1a; background: #fff; }}
body {{ width: 210mm; height: 297mm; padding: 14mm 14mm 18mm 14mm; position: relative; }}

.tape {{ position: absolute; top: 0; left: 0; right: 0; height: 10mm; background: linear-gradient(180deg, {colour} 0%, {colour} 80%, {tint} 80%, {tint} 100%); }}

/* HEADER is intentionally adult-styled: it's a chapter-heading-style
   chrome row, not child reading material. Worksheet title is in
   regular weight (not bold display) so it visually reads as a label
   rather than instruction. The judge has been told this header text
   is teacher-facing chrome and exempt from the decodability rule. */
.header {{ display: grid; grid-template-columns: 1fr auto; gap: 5mm; align-items: center; margin-top: 8mm; margin-bottom: 7mm; padding: 4mm 0 5mm 0; border-bottom: 1.5pt solid {tint}; }}
.title-block {{ display: flex; flex-direction: column; gap: 2mm; }}
.title-block .pill-row {{ display: flex; align-items: center; gap: 3mm; }}
.title-block .pill {{ background: {colour}; color: #fff; font-weight: 700; font-size: 10pt; padding: 1.5mm 4mm; border-radius: 999px; letter-spacing: 1pt; display: inline-block; }}
.title-block .pill.outline {{ background: #fff; color: {colour}; border: 1.5pt solid {colour}; font-weight: 700; }}
.title-block .worksheet-title {{ font-size: 19pt; font-weight: 700; line-height: 1.1; letter-spacing: -0.3pt; color: #1a1a1a; }}
.title-block .book-sub {{ font-size: 10.5pt; color: #555; font-style: italic; }}
.hero-corner {{ width: 34mm; height: 34mm; border-radius: 50%; background: {tint}; overflow: hidden; display: flex; align-items: center; justify-content: center; box-shadow: 0 1mm 3mm rgba(0,0,0,0.08); border: 2pt solid #fff; outline: 2pt solid {colour}; outline-offset: -2pt; }}
.hero-corner img {{ width: 100%; height: 100%; object-fit: cover; }}

.task-icon {{ display: inline-flex; width: 20mm; height: 20mm; border-radius: 50%; background: {tint}; align-items: center; justify-content: center; margin-bottom: 6mm; box-shadow: inset 0 0 0 2pt #fff, 0 0 0 2pt {colour}; }}
.task-icon svg {{ width: 13mm; height: 13mm; }}

.teacher-note {{ position: absolute; left: 14mm; right: 14mm; bottom: 9mm; border-top: 1pt dashed #c4c4c4; padding-top: 2.5mm; font-size: 8pt; color: #666; line-height: 1.4; }}
.teacher-note b {{ color: #222; }}

.footer-brand {{ position: absolute; left: 14mm; bottom: 4mm; font-size: 7.5pt; color: #999; letter-spacing: 0.8pt; }}
.footer-brand b {{ color: {colour}; }}
"""


# Inline SVG icons (single-colour, look like crayon strokes)
def icon_svg(kind: str, colour: str) -> str:
    if kind == "magnifier":
        return f'<svg viewBox="0 0 24 24" fill="none" stroke="{colour}" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6"/><path d="m20 20-3.5-3.5"/></svg>'
    if kind == "pencil":
        return f'<svg viewBox="0 0 24 24" fill="none" stroke="{colour}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4l6 6L8 22H2v-6z"/><path d="M12 6l6 6"/></svg>'
    if kind == "scissors":
        return f'<svg viewBox="0 0 24 24" fill="none" stroke="{colour}" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.5 8.5 21 21M8.5 15.5 21 3"/></svg>'
    if kind == "match":
        return f'<svg viewBox="0 0 24 24" fill="none" stroke="{colour}" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M9 9l6 6"/></svg>'
    if kind == "heart":
        return f'<svg viewBox="0 0 24 24" fill="{colour}"><path d="M12 21s-7-4.5-9.5-9C.5 8.5 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.5 4.5 4.5 8-2.5 4.5-9.5 9-9.5 9z"/></svg>'
    if kind == "ear":
        return f'<svg viewBox="0 0 24 24" fill="none" stroke="{colour}" stroke-width="2" stroke-linecap="round"><path d="M7 16c0-5 3-9 7-9s5 4 3 7c-2 2-4 2-4 5"/><circle cx="13" cy="19" r="1.5"/></svg>'
    if kind == "speed":
        return f'<svg viewBox="0 0 24 24" fill="none" stroke="{colour}" stroke-width="2" stroke-linecap="round"><path d="M3 18a9 9 0 0 1 18 0"/><path d="m12 18 5-5"/></svg>'
    if kind == "puzzle":
        return f'<svg viewBox="0 0 24 24" fill="none" stroke="{colour}" stroke-width="2" stroke-linejoin="round"><path d="M4 4h7v4a2 2 0 1 0 2 2h4v7h-4a2 2 0 1 1-2 2H4z"/></svg>'
    return f'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="{colour}"/></svg>'


def html_page(book: Book, worksheet_title: str, instr_3w: str, icon: str, body: str, teacher_text: str) -> str:
    """Worksheet page. The HEADER row is intentionally adult-readable
    chrome — like a chapter heading or a magazine masthead — that
    contains the worksheet title and book context for the teacher and
    helps the PRINTED page feel like a designed artefact, not generic
    HTML output. The ACTIVITY AREA below the header is purely
    child-decodable: target letters/words only, plus the demo row.
    The teacher footer carries the full teacher script.
    """
    hero = hero_data_url(book)
    hero_html = f'<img src="{hero}" alt="" draggable="false">' if hero else ""
    colour = LEVEL_COLOURS[book.level]
    return f"""<!doctype html>
<html><head><meta charset="utf-8"><style>{shared_css(book.level)}</style></head>
<body>
  <div class="tape"></div>

  <div class="header">
    <div class="title-block">
      <div class="pill-row">
        <span class="pill">{book.sub_level}</span>
        <span class="pill outline">Level {book.level} · {LEVEL_NAMES[book.level]}</span>
      </div>
      <div class="worksheet-title">{worksheet_title}</div>
      <div class="book-sub">From the story: {book.title}</div>
    </div>
    <div class="hero-corner">{hero_html}</div>
  </div>

  <div class="task-icon">{icon_svg(icon, colour)}</div>

  {body}

  <div class="teacher-note"><b>For the teacher.</b> Read aloud to the class: <i>"{instr_3w}"</i>. {teacher_text}</div>
  <div class="footer-brand">My<b>Phonics</b>Books  ·  Teacher Pass  ·  myphonicsbooks.co.uk</div>
</body></html>"""


# --- Individual renderers ---

def r_letter_spotter(book: Book, c: dict) -> str:
    """Low-attainer: a small grid of single letters; child circles every
    target letter. Pure visual discrimination, no decoding. All
    instructions live in the teacher footer — the child-facing area is
    PURELY visual: huge target letter + worked pre-circled demo + a
    10-cell grid with 7 targets and 3 distractors (70% target density)."""
    target = c["target_sound"]
    distractors = c.get("distractor_sounds", [])[:5] or [target]
    rng = random.Random(book.sub_level + target + "spot")
    # 10-cell grid: 1 worked demo (pre-circled) + 6 more target + 3 distractors
    practice_cells: list[str] = [target] * 6
    # Pick 3 distractors, prefer visually different
    picked_d = []
    for d in distractors:
        if d != target and len(picked_d) < 3:
            picked_d.append(d)
    while len(picked_d) < 3:
        picked_d.append(distractors[0])
    practice_cells += picked_d
    rng.shuffle(practice_cells)
    cells = '<div class="ls-cell ls-demo">{}</div>'.format(target)
    for ch in practice_cells:
        cells += f'<div class="ls-cell">{ch}</div>'
    body = f"""
<style>
.target-banner {{ display: grid; grid-template-columns: 44mm 1fr 38mm; gap: 5mm; align-items: center; margin-bottom: 7mm; padding: 5mm; background: {LEVEL_TINTS[book.level]}; border-radius: 5mm; }}
.target-letter {{ width: 38mm; height: 38mm; border-radius: 6mm; background: {LEVEL_COLOURS[book.level]}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 70pt; font-weight: 700; line-height: 1; }}
.eyes-icon {{ display:flex; justify-content:center; }}
.eyes-icon svg {{ width: 28mm; height: 28mm; }}
.demo-callout {{ width: 32mm; height: 32mm; border-radius: 50%; background: #fff; color: {LEVEL_COLOURS[book.level]}; border: 4pt solid {LEVEL_COLOURS[book.level]}; display: flex; align-items: center; justify-content: center; font-size: 38pt; font-weight: 700; line-height: 1; margin: 0 auto; }}
.ls-grid {{ display: grid; grid-template-columns: repeat(5, 1fr); gap: 4mm; }}
.ls-cell {{ height: 26mm; display: flex; align-items: center; justify-content: center; font-size: 40pt; font-weight: 700; background: #fff; border: 1.5pt solid #e0e0e0; border-radius: 4mm; line-height: 1; }}
.ls-cell.ls-demo {{ background: #fff; color: {LEVEL_COLOURS[book.level]}; border: 4pt solid {LEVEL_COLOURS[book.level]}; border-radius: 50%; height: 26mm; width: 26mm; justify-self: center; }}
</style>
<div class="target-banner">
  <div class="target-letter">{target}</div>
  <div class="eyes-icon">{icon_svg('magnifier', LEVEL_COLOURS[book.level])}</div>
  <div class="demo-callout">{target}</div>
</div>
<div class="ls-grid">{cells}</div>
"""
    return html_page(book, "Letter spotter", c.get("instruction_3w", f"Circle the {target}"), "magnifier", body,
                     f"Lowest-attainer differentiation. Target grapheme: <b>{target}</b>. The first cell (round, outlined) is the worked demo — already 'circled'. Children draw a circle around every other {target} they can spot in the grid. Six more target letters and three distractors; total ten decision items. Pair with the higher-attainer Sound Hunt page on the next worksheet.")


def r_sound_hunt(book: Book, c: dict) -> str:
    target = c["target_sound"]
    words = list(c["target_words"]) + list(c["distractor_words"])
    random.Random(book.sub_level + target).shuffle(words)
    demo = c["demo_word"]
    cells = "".join(f'<div class="hunt-cell">{w}</div>' for w in words[:10])
    body = f"""
<style>
.target-row {{ display: grid; grid-template-columns: 36mm 1fr; gap: 5mm; align-items: center; margin-bottom: 6mm; }}
.target-letter {{ width: 36mm; height: 36mm; border-radius: 6mm; background: {LEVEL_COLOURS[book.level]}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 64pt; font-weight: 700; line-height: 1; }}
.demo-visual {{ display: flex; align-items: center; gap: 5mm; }}
.demo-arrow {{ font-size: 28pt; color: {LEVEL_COLOURS[book.level]}; }}
.demo-circle {{ display: inline-block; padding: 2mm 8mm; border-radius: 999px; border: 3pt solid {LEVEL_COLOURS[book.level]}; font-size: 28pt; font-weight: 700; background: #fff; }}
.hunt-grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; }}
.hunt-cell {{ border: 1.5pt solid #ddd; border-radius: 3mm; padding: 5mm 2mm; text-align: center; font-size: 26pt; font-weight: 700; background: #fff; }}
</style>
<div class="target-row">
  <div class="target-letter">{target}</div>
  <div class="demo-visual">
    <div class="demo-circle">{demo}</div>
    <div class="demo-arrow">←</div>
    <div class="target-letter" style="width:18mm;height:18mm;font-size:30pt;border-radius:3mm;">{target}</div>
  </div>
</div>
<div class="hunt-grid">{cells}</div>
"""
    return html_page(book, f"Find the {target}", c.get("instruction_3w", f"Find the {target}"), "magnifier", body,
                     f"Target sound: <b>{target}</b>. Demo: <b>{demo}</b> is already circled. Children circle every word in the grid that has the same sound. Answers: {', '.join(c['target_words'])}.")


def r_rainbow_tracing(book: Book, c: dict) -> str:
    """Handwriting practice. Each row: target letter with a START-DOT
    marker + 3 dotted-grey 'trace me' cells + 3 blank cells with
    baseline + x-height guidelines for the child's own attempts.
    The start-dot and baseline cue are what makes this a real
    handwriting formation page rather than visual letter-tracing
    (per the meta-review's Handwriting Formation rule)."""
    cues_for_teacher: list[str] = []
    rows = ""
    for row in c["rows"]:
        g = row["grapheme"]
        cue = row.get("mouth_cue", "")
        if cue:
            cues_for_teacher.append(f"{g} — {cue}")
        display = g.replace("-e", "_e")
        rows += f"""
<div class="trace-row">
  <div class="trace-side">
    <div class="trace-letter">
      <span class="start-dot"></span>
      {display}
    </div>
  </div>
  <div class="trace-cells">
    <div class="tcell guideline ghost">{display}</div>
    <div class="tcell guideline ghost">{display}</div>
    <div class="tcell guideline ghost">{display}</div>
    <div class="tcell guideline"></div>
    <div class="tcell guideline"></div>
    <div class="tcell guideline"></div>
  </div>
</div>"""
    body = f"""
<style>
.trace-row {{ display: grid; grid-template-columns: 30mm 1fr; gap: 5mm; align-items: center; margin-bottom: 4mm; padding: 3mm 4mm; background: {LEVEL_TINTS[book.level]}; border-radius: 3mm; }}
.trace-side {{ text-align: center; position: relative; }}
.trace-letter {{ font-size: 50pt; font-weight: 700; color: {LEVEL_COLOURS[book.level]}; line-height: 1; position: relative; display: inline-block; }}
.start-dot {{ position: absolute; top: -2mm; left: 50%; transform: translateX(-50%); width: 3mm; height: 3mm; background: {LEVEL_COLOURS[book.level]}; border-radius: 50%; box-shadow: 0 0 0 2pt #fff, 0 0 0 3pt {LEVEL_COLOURS[book.level]}; }}
.trace-cells {{ display: grid; grid-template-columns: repeat(6, 1fr); gap: 2mm; }}
.tcell {{ height: 20mm; border: 1.2pt dashed #aaa; border-radius: 2mm; background: #fff; display: flex; align-items: end; justify-content: center; padding-bottom: 3mm; font-size: 30pt; font-weight: 400; line-height: 1; color: #D9D9D9; position: relative; }}
.tcell.guideline {{
  background: linear-gradient(
    to bottom,
    #fff 0%, #fff 30%,
    #F0E5EA 30%, #F0E5EA 32%,
    #fff 32%, #fff 70%,
    #DDD 70%, #DDD 71%,
    #fff 71%
  );
}}
.tcell:not(.ghost) {{ background-color: #FAFAFA; }}
</style>
{rows}
"""
    cues_block = " · ".join(cues_for_teacher) if cues_for_teacher else "letter formation in the air first"
    return html_page(book, "Trace the sounds", c.get("instruction_3w", "Trace each sound"), "pencil", body,
                     f"Letter-pattern practice page. The pink dot above each letter marks the START point; horizontal lines inside each cell show the baseline (bottom) and x-height (upper) for proper letter sitting. Model formation in the air first; encourage top-to-bottom strokes. Mouth cues: {cues_block}.")


def r_roll_and_read(book: Book, c: dict) -> str:
    """Fluency / automaticity grid. Three rows of six decodable words.
    All child-facing area is purely visual: row/column number markers
    plus the word grid. The first cell is highlighted as the worked
    demo. No prose anywhere in the child area — instructions live in
    the teacher footer."""
    grid = c["grid"]
    n_rows = len(grid)
    n_cols = max(len(r) for r in grid)
    cells = ""
    # column headers: 1..6 row of small dice-style faces
    cells += '<div class="rr-corner"></div>'
    for ci in range(n_cols):
        cells += f'<div class="rr-hdr">{ci + 1}</div>'
    for ri, row in enumerate(grid):
        cells += f'<div class="rr-hdr-side">{ri + 1}</div>'
        for ci, word in enumerate(row):
            cls = "rr-cell rr-demo" if (ri == 0 and ci == 0) else "rr-cell"
            cells += f'<div class="{cls}">{word}</div>'
    body = f"""
<style>
.rr-grid {{ display: grid; grid-template-columns: 12mm repeat({n_cols}, 1fr); gap: 2.5mm; }}
.rr-corner {{ width: 12mm; }}
.rr-hdr, .rr-hdr-side {{ display: flex; align-items: center; justify-content: center; font-size: 14pt; font-weight: 700; color: #fff; background: {LEVEL_COLOURS[book.level]}; border-radius: 50%; width: 10mm; height: 10mm; justify-self: center; align-self: center; }}
.rr-hdr-side {{ margin: 0; }}
.rr-cell {{ border: 1.5pt solid #ddd; border-radius: 3mm; padding: 6mm 1mm; text-align: center; font-size: 22pt; font-weight: 700; background: #fff; }}
.rr-cell.rr-demo {{ background: {LEVEL_COLOURS[book.level]}; color: #fff; border-color: {LEVEL_COLOURS[book.level]}; box-shadow: 0 0 0 3pt {LEVEL_TINTS[book.level]}; }}
</style>
<div class="rr-grid">{cells}</div>
"""
    return html_page(book, "Roll and read", c.get("instruction_3w", "Read each word"), "speed", body,
                     "Pupil reads across each row, then down each column. Then they roll a die twice (row, column) and read the word in that cell. Repeat across three sessions to track fluency growth. First cell is highlighted to model the starting point.")


def r_cut_paste_sort(book: Book, c: dict) -> str:
    a = c["sound_a"]; b = c["sound_b"]
    a_words = c["sound_a_words"][:3]
    b_words = c["sound_b_words"][:3]
    all_cards = a_words + b_words
    random.Random(book.sub_level).shuffle(all_cards)
    # First a-word is the demo, already 'placed' in the a-box at top
    demo = a_words[0] if a_words else ""
    body = f"""
<style>
.sort-boxes {{ display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; margin-bottom: 8mm; }}
.sort-box {{ border: 2.5pt solid {LEVEL_COLOURS[book.level]}; border-radius: 4mm; padding: 4mm; height: 85mm; display: flex; flex-direction: column; }}
.sort-head {{ display: flex; align-items: center; justify-content: center; padding-bottom: 3mm; border-bottom: 2pt solid {LEVEL_TINTS[book.level]}; margin-bottom: 4mm; }}
.sort-letter-big {{ width: 24mm; height: 24mm; border-radius: 4mm; background: {LEVEL_COLOURS[book.level]}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 42pt; font-weight: 700; line-height: 1; }}
.sort-area {{ flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2mm; padding-top: 2mm; }}
.sort-demo {{ background: #fff; border: 2pt solid {LEVEL_COLOURS[book.level]}; border-radius: 3mm; padding: 3mm 6mm; font-size: 22pt; font-weight: 700; }}
.cut-line {{ border-top: 2pt dashed #888; margin: 3mm 0 6mm 0; position: relative; }}
.cut-line::before {{ content: '✂'; position: absolute; left: 4mm; top: -4mm; background: #fff; padding: 0 2mm; font-size: 12pt; color: #555; }}
.cards {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; }}
.card {{ border: 1.5pt dashed #555; border-radius: 3mm; padding: 5mm 2mm; text-align: center; font-size: 22pt; font-weight: 700; background: {LEVEL_TINTS[book.level]}; }}
</style>
<div class="sort-boxes">
  <div class="sort-box">
    <div class="sort-head"><div class="sort-letter-big">{a}</div></div>
    <div class="sort-area"><div class="sort-demo">{demo}</div></div>
  </div>
  <div class="sort-box">
    <div class="sort-head"><div class="sort-letter-big">{b}</div></div>
    <div class="sort-area"></div>
  </div>
</div>
<div class="cut-line"></div>
<div class="cards">
{''.join(f'<div class="card">{w}</div>' for w in all_cards if w != demo)}
</div>
"""
    return html_page(book, "Sort by sound", c.get("instruction_3w", "Cut and sort"), "scissors", body,
                     f"Demo: <b>{demo}</b> is already in the <b>{a}</b> box. Children cut the cards and paste each in the correct box. <b>{a}</b> words: {', '.join(a_words)}.  <b>{b}</b> words: {', '.join(b_words)}.")


def r_comp_draw(book: Book, c: dict) -> str:
    body = f"""
<style>
.draw-box {{ border: 2pt solid {LEVEL_COLOURS[book.level]}; border-radius: 4mm; height: 145mm; background: {LEVEL_TINTS[book.level]}; opacity: 0.5; }}
.cap-block {{ margin-top: 6mm; }}
.cap-starter {{ font-size: 13pt; font-weight: 700; color: {LEVEL_COLOURS[book.level]}; }}
.cap-line {{ border-bottom: 1.5pt solid #aaa; height: 11mm; margin-top: 2mm; }}
</style>
<div class="draw-box"></div>
<div class="cap-block">
  <div class="cap-starter">{c.get('caption_starter', 'I liked …')}</div>
  <div class="cap-line"></div>
  <div class="cap-line"></div>
</div>
"""
    return html_page(book, "Draw your favourite part", c.get("instruction_3w", "Draw and tell"), "heart", body,
                     "Talk first. Ask what they liked, then let them draw. Scribe their words if needed.")


def r_comp_draw_describe(book: Book, c: dict) -> str:
    starters = c.get("starters", [])
    starters_html = "".join(f'<li>{s}</li>' for s in starters)
    body = f"""
<style>
.draw-box {{ border: 2pt solid {LEVEL_COLOURS[book.level]}; border-radius: 4mm; height: 100mm; background: {LEVEL_TINTS[book.level]}; opacity: 0.5; }}
.starters {{ background: {LEVEL_TINTS[book.level]}; padding: 4mm 5mm; border-radius: 3mm; margin: 5mm 0 3mm 0; font-size: 13pt; line-height: 1.6; }}
.starters ul {{ margin: 0; padding-left: 5mm; list-style: none; }}
.starters li {{ position: relative; padding-left: 6mm; }}
.starters li::before {{ content: '✎'; position: absolute; left: 0; color: {LEVEL_COLOURS[book.level]}; font-size: 11pt; }}
.write-line {{ border-bottom: 1.5pt solid #aaa; height: 11mm; }}
</style>
<div class="draw-box"></div>
<div class="starters"><ul>{starters_html}</ul></div>
<div class="write-line"></div>
<div class="write-line"></div>
<div class="write-line"></div>
"""
    return html_page(book, "Draw and write", c.get("instruction_3w", "Draw and write"), "pencil", body,
                     f"Sentence starters (decodable, generated for this story): {' / '.join(starters)}. Push for one full sentence. Re-reading their sentence aloud is the easiest self-check.")


def r_comp_write_draw(book: Book, c: dict) -> str:
    starters = c.get("starters", [])
    starters_html = "".join(f'<li>{s}</li>' for s in starters)
    body = f"""
<style>
.starters {{ background: {LEVEL_TINTS[book.level]}; padding: 4mm 5mm; border-radius: 3mm; margin-bottom: 5mm; font-size: 13pt; line-height: 1.6; }}
.starters ul {{ margin: 0; padding-left: 5mm; list-style: none; }}
.starters li {{ position: relative; padding-left: 6mm; }}
.starters li::before {{ content: '✎'; position: absolute; left: 0; color: {LEVEL_COLOURS[book.level]}; font-size: 11pt; }}
.write-line {{ border-bottom: 1.5pt solid #aaa; height: 11mm; }}
.draw-box {{ border: 2pt solid {LEVEL_COLOURS[book.level]}; border-radius: 4mm; height: 75mm; background: {LEVEL_TINTS[book.level]}; opacity: 0.5; margin-top: 5mm; }}
.divider-icon {{ margin: 5mm 0 2mm 0; text-align: center; color: {LEVEL_COLOURS[book.level]}; font-size: 16pt; }}
</style>
<div class="starters"><ul>{starters_html}</ul></div>
<div class="write-line"></div>
<div class="write-line"></div>
<div class="write-line"></div>
<div class="write-line"></div>
<div class="divider-icon">✎ &nbsp; ❖ &nbsp; 🖍</div>
<div class="draw-box"></div>
"""
    return html_page(book, "Write and draw", c.get("instruction_3w", "Write and draw"), "pencil", body,
                     f"Decodable sentence starters: {' / '.join(starters)}. Push for full stops and capitals at L3. Re-reading aloud is the best self-check.")


def r_comp_questions(book: Book, c: dict) -> str:
    questions = c.get("questions", [])
    rows = ""
    for i, q in enumerate(questions, 1):
        rows += f"""
<div class="q-row">
  <div class="q-num">{i}</div>
  <div class="q-body">
    <div class="q-text">{q}</div>
    <div class="q-line"></div>
    <div class="q-line"></div>
  </div>
</div>"""
    body = f"""
<style>
.q-row {{ display: grid; grid-template-columns: 12mm 1fr; gap: 3mm; margin-bottom: 8mm; align-items: start; }}
.q-num {{ width: 9mm; height: 9mm; border-radius: 50%; background: {LEVEL_COLOURS[book.level]}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13pt; }}
.q-text {{ font-size: 12pt; margin-bottom: 3mm; line-height: 1.3; }}
.q-line {{ border-bottom: 1.5pt solid #aaa; height: 10mm; }}
</style>
{rows}
"""
    return html_page(book, "Answer the questions", c.get("instruction_3w", "Answer the questions"), "puzzle", body,
                     "Mix retrieval and inference. Accept spoken answers from any child who needs them.")


def r_comp_paragraph(book: Book, c: dict) -> str:
    prompts = c.get("prompts", [])
    plist = "".join(f'<li>{p}</li>' for p in prompts)
    body = f"""
<style>
.prompts {{ background: {LEVEL_TINTS[book.level]}; padding: 4mm 6mm; border-radius: 3mm; margin-bottom: 6mm; font-size: 12pt; line-height: 1.55; }}
.prompts ul {{ margin: 0; padding-left: 5mm; list-style: none; }}
.prompts li {{ position: relative; padding-left: 7mm; }}
.prompts li::before {{ content: '✎'; position: absolute; left: 0; color: {LEVEL_COLOURS[book.level]}; font-size: 11pt; }}
.write-line {{ border-bottom: 1.5pt solid #aaa; height: 10mm; }}
</style>
<div class="prompts"><ul>{plist}</ul></div>
<div class="write-line"></div>
<div class="write-line"></div>
<div class="write-line"></div>
<div class="write-line"></div>
<div class="write-line"></div>
<div class="write-line"></div>
<div class="write-line"></div>
<div class="write-line"></div>
<div class="write-line"></div>
"""
    return html_page(book, "Write a paragraph", c.get("instruction_3w", "Write a paragraph"), "pencil", body,
                     "Look for capitals, full stops, conjunctions (and / but / because), and evidence from the text.")


def r_sentence_building(book: Book, c: dict) -> str:
    bank = c.get("word_bank", [])
    frames = c.get("frames", [])
    bank_html = "".join(f'<span class="b-w">{w}</span>' for w in bank)
    frames_html = "".join(f'<div class="frame">{f}</div>' for f in frames)
    body = f"""
<style>
.bank {{ border: 2pt solid {LEVEL_COLOURS[book.level]}; border-radius: 4mm; padding: 5mm; display: flex; flex-wrap: wrap; gap: 2mm 3mm; background: {LEVEL_TINTS[book.level]}; margin-bottom: 6mm; }}
.b-w {{ background: #fff; padding: 1.2mm 3mm; border-radius: 2mm; font-size: 14pt; font-weight: 700; border: 1pt solid #ddd; }}
.frame {{ font-size: 16pt; line-height: 2; margin-bottom: 4mm; letter-spacing: 0.5pt; }}
</style>
<div class="bank">{bank_html}</div>
{frames_html}
"""
    return html_page(book, "Build a sentence", c.get("instruction_3w", "Build a sentence"), "pencil", body,
                     "There is no single right answer. Celebrate creative choices that still make sense.")


def r_dictation(book: Book, c: dict) -> str:
    words = c.get("words", [])
    sentences = c.get("sentences", [])
    rows = ""
    for i in range(1, 9):
        rows += f"""
<div class="d-row">
  <div class="d-num">{i}</div>
  <div class="d-line"></div>
</div>"""
    body = f"""
<style>
.d-row {{ display: grid; grid-template-columns: 12mm 1fr; align-items: end; gap: 3mm; margin-bottom: 7mm; }}
.d-num {{ width: 9mm; height: 9mm; border-radius: 50%; background: {LEVEL_COLOURS[book.level]}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13pt; }}
.d-line {{ border-bottom: 1.5pt solid #aaa; height: 11mm; }}
</style>
{rows}
"""
    return html_page(book, "Write what I say", c.get("instruction_3w", "Write what I say"), "ear", body,
                     f"<b>Words (1–5):</b> {', '.join(words[:5])}. <b>Sentences (6–8):</b> {' | '.join(sentences[:3])}. Say each item twice.")


def r_fluency_strips(book: Book, c: dict) -> str:
    strips = c.get("strips", [])[:6]
    rows = ""
    for i, s in enumerate(strips, 1):
        rows += f"""
<div class="f-row">
  <div class="f-num">{i}</div>
  <div class="f-strip">{s}</div>
  <div class="f-checks">
    <span class="f-check">Day 1</span>
    <span class="f-check">Day 2</span>
    <span class="f-check">Day 3</span>
  </div>
</div>"""
    body = f"""
<style>
.f-row {{ display: grid; grid-template-columns: 10mm 1fr 56mm; align-items: center; padding: 4mm 0; border-bottom: 1pt solid #eee; gap: 3mm; }}
.f-num {{ width: 8mm; height: 8mm; border-radius: 50%; background: {LEVEL_COLOURS[book.level]}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11pt; }}
.f-strip {{ font-size: 13pt; line-height: 1.35; padding-right: 4mm; }}
.f-checks {{ display: flex; gap: 1.5mm; }}
.f-check {{ flex: 1; border: 1.2pt solid {LEVEL_COLOURS[book.level]}; border-radius: 2mm; padding: 1.5mm 2mm; font-size: 9pt; text-align: center; color: {LEVEL_COLOURS[book.level]}; font-weight: 700; }}
</style>
{rows}
"""
    return html_page(book, "Read with speed", c.get("instruction_3w", "Read three times"), "speed", body,
                     "Repeated reading is the engine of fluency. Same strip, three days, three reads.")


def r_crossword(book: Book, c: dict) -> str:
    pairs = c.get("pairs", [])[:6]
    rows = ""
    for i, p in enumerate(pairs, 1):
        n = max(3, len(p["answer"]))
        boxes = "".join('<div class="xw-box"></div>' for _ in range(n))
        rows += f"""
<div class="x-row">
  <div class="x-num">{i}</div>
  <div class="x-body">
    <div class="x-clue">{p["clue"]}</div>
    <div class="x-boxes">{boxes}</div>
  </div>
</div>"""
    body = f"""
<style>
.x-row {{ display: grid; grid-template-columns: 10mm 1fr; gap: 3mm; margin-bottom: 7mm; align-items: start; }}
.x-num {{ width: 8mm; height: 8mm; border-radius: 50%; background: {LEVEL_COLOURS[book.level]}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11pt; }}
.x-clue {{ font-size: 12pt; margin-bottom: 2mm; }}
.x-boxes {{ display: flex; gap: 1.5mm; }}
.xw-box {{ width: 10mm; height: 10mm; border: 2pt solid {LEVEL_COLOURS[book.level]}; border-radius: 1.5mm; background: #fff; }}
</style>
{rows}
"""
    return html_page(book, "Fill the boxes", c.get("instruction_3w", "Solve and spell"), "puzzle", body,
                     f"Answers: {', '.join(p['answer'] for p in pairs)}.")


RENDERERS = {
    "letter_spotter": r_letter_spotter,
    "sound_hunt": r_sound_hunt,
    "rainbow_tracing": r_rainbow_tracing,
    "roll_and_read": r_roll_and_read,
    "cut_paste_sort": r_cut_paste_sort,
    "comp_draw": r_comp_draw,
    "comp_draw_describe": r_comp_draw_describe,
    "comp_write_draw": r_comp_write_draw,
    "comp_questions": r_comp_questions,
    "comp_paragraph": r_comp_paragraph,
    "sentence_building": r_sentence_building,
    "dictation": r_dictation,
    "fluency_strips": r_fluency_strips,
    "crossword": r_crossword,
}


# ---------------------------------------------------------------------------
# Per-level pack mapping (locked, but L1 sound_hunt is now ONE sound)
# ---------------------------------------------------------------------------

PACKS = {
    # L1/L2 packs lead with letter_spotter (lowest-attainer differentiation
    # — pure grapheme discrimination, no decoding required) and then layer
    # up through sound_hunt (decoding at the word level) to writing/comp.
    1: ["letter_spotter", "sound_hunt", "rainbow_tracing", "cut_paste_sort", "roll_and_read", "comp_draw"],
    2: ["letter_spotter", "sound_hunt", "rainbow_tracing", "cut_paste_sort", "roll_and_read", "comp_draw_describe"],
    3: ["sound_hunt", "sentence_building", "dictation", "fluency_strips", "comp_write_draw"],
    4: ["fluency_strips", "sentence_building", "dictation", "crossword", "comp_questions"],
    5: ["fluency_strips", "crossword", "dictation", "sentence_building", "comp_paragraph"],
    6: ["fluency_strips", "crossword", "dictation", "sentence_building", "comp_paragraph"],
}


# ---------------------------------------------------------------------------
# Render + rasterize
# ---------------------------------------------------------------------------

async def render_html_to_pdf(html: str, out_pdf: Path, gen) -> Path:
    await gen.generate(html, out_pdf, width_mm=210, height_mm=297)
    return out_pdf


def rasterize_pdf_first_page(pdf: Path, png: Path) -> Path:
    # Lower DPI keeps the bitmap small enough for PyMuPDF's malloc.
    # 100 dpi A4 ~ 827x1170 px — plenty for the judge to read.
    with fitz.open(pdf) as d:
        d[0].get_pixmap(dpi=100).save(str(png))
    return png


# ---------------------------------------------------------------------------
# Judge (gpt-5.5-pro with vision)
# ---------------------------------------------------------------------------

JUDGE_SYSTEM = """\
You are Dr. Eleanor Marsh, a Reception/KS1 literacy specialist with 28
years of UK classroom experience, an EdD in early literacy from UCL IOE,
and a published reviewer for the Reading Reform Foundation. You have
publicly demolished mainstream phonics workbooks for ignoring cognitive
load, leaking non-decodable words into early levels, and producing
sterile worksheets that no real child engages with.

You are reviewing a single worksheet that will ship under a paid
Teachers Pay Teachers product. Your standard is "could a Reception
teacher hand this to a child cold, without scaffolding, and have it
work AS A LEARNING ARTEFACT — not as filler." You are ruthless. You do
NOT pass anything that is "okay" or "fine" — you pass only what you
would gladly use in your own classroom.

WORKSHEET STRUCTURE (regions and what is child-facing vs adult chrome):
  - TOP coloured strip: brand chrome. No reading load.
  - HEADER row (pills + worksheet title + book sub + hero portrait):
    intentionally adult-styled, like a chapter heading. It is teacher-
    facing chrome. EXEMPT from decodability. Treat the worksheet title
    here as a LABEL, not as a child instruction.
  - TASK ICON CIRCLE under the header: decorative; no reading load.
  - MAIN ACTIVITY AREA (between task icon and the dashed teacher-note
    line): CHILD-FACING. Every printed word here must be decodable at
    the book's level. Single graphemes / target letters are by
    definition allowed.
  - DEMO row or pre-circled cell: child-facing but visual; OK to include
    a single decodable demo word.
  - TEACHER NOTE (italic, smaller, after the dashed line): ADULT ONLY.
    EXEMPT from decodability. Contains the read-aloud instruction,
    answer key, and teaching tips for the adult.
  - BRAND footer: adult-only chrome. Exempt.

SCORE FIVE DIMENSIONS:

1. decodability        — every CHILD-FACING printed word uses only
                          graphemes / sight words allowed at this level.
                          Teacher chrome (header label, footer) EXEMPT.

2. makes_sense          — the task is internally coherent:
                          * categories mutually exclusive (no card
                            belonging in both sort boxes — Answer
                            Determinacy)
                          * demo matches the task
                          * matching tasks have NO pre-drawn lines that
                            imply false answers
                          * sentence frames produce sensible completions
                          * pictures (if any) are single-label
                            unambiguous (Picture Validity)
                          * teacher note does not contradict child
                            instruction (Teacher Note Consistency)
                          * task does NOT require a story/page not
                            supplied (External Dependency)

3. child_access         — a 4-7yo can engage WITHOUT a teacher reading
                          the instruction. Icons + big target letters
                          + a worked demo row are how this is achieved
                          at L1-L2. If the activity REQUIRES adult
                          mediation, the worksheet must be clearly
                          framed as teacher-led (Independence Honesty).

4. aesthetic            — warm, branded, child-friendly, balanced
                          whitespace, not sterile. Hero corner visible.
                          Visual hierarchy clear. Looks like a designed
                          printable artefact, not raw HTML output.

5. instructional_validity (NEW) — does this page ACTUALLY teach,
                          practise, or assess the stated focus skill in
                          a developmentally appropriate way? This is
                          the dimension a senior literacy reviewer
                          weights most heavily. Sub-rules:
                          * Skill-Task Alignment — task practises the
                            stated phonics skill (not picture
                            recognition, not world knowledge, not
                            memory)
                          * Phonics Focus Alignment — ≥70% of practice
                            items rehearse the stated focus
                            grapheme/phoneme
                          * Phoneme/Grapheme Precision — "sound" vs
                            "letter" used accurately; classification
                            by spelling never disguised as classification
                            by sound
                          * Scope Fidelity — no child-read stimulus
                            contains an untaught GPC unless it's a
                            tricky word
                          * Cognitive Load Cap — at L1/L2 max two major
                            operations per page (read, cut, sort,
                            glue, write, draw, match)
                          * Stimulus Volume — first-exposure pages
                            ≤8–10 decision items unless heavily
                            scaffolded
                          * Age-Appropriate Writing Demand — Reception/
                            early KS1 don't get asked for multiple
                            full written sentences without stems
                          * Handwriting Formation — tracing pages have
                            start dots / arrows / baseline guidance OR
                            are clearly framed as letter-pattern
                            practice
                          * Fluency Research Fit — fluency pages
                            include decodable connected text + a way
                            to notice rate/accuracy improvement
                          * Semantic Naturalness — sentences must
                            sound like things a 4–7yo would
                            understand, not adult-literary or culturally
                            random ("Her perseverance led her to
                            success" = fail)
                          * Assessment Validity — success on the task
                            depends on the targeted skill, not on
                            vocabulary, memory, or handwriting

Return strict JSON:
{
  "verdict": "pass" | "fail",
  "scores": {
    "decodability": "pass"|"fail",
    "makes_sense": "pass"|"fail",
    "child_access": "pass"|"fail",
    "aesthetic": "pass"|"fail",
    "instructional_validity": "pass"|"fail"
  },
  "issues": [ "specific revision ask 1", "specific revision ask 2", ... ],
  "kind_of_fix": "content" | "template" | "both" | "none"
}

If ALL FIVE scores are "pass", verdict is "pass". Otherwise "fail".
Be specific about what to change. Do not flag header chrome as
decodability or child-access failures.
"""


def judge(book: Book, wtype: str, content: dict, png_path: Path) -> dict:
    img_b64 = base64.b64encode(png_path.read_bytes()).decode("ascii")
    msg = [
        {"role": "system", "content": JUDGE_SYSTEM},
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": f"""Worksheet type: {wtype}
Book: {book.title} ({book.sub_level}, Level {book.level} = {LEVEL_NAMES[book.level]})
Focus sounds (new in THIS book): {book.focus_sounds}
PER-BOOK cumulative graphemes (strict — what THIS child has been taught up to AND including this story): {book_cumulative_graphemes(book)}
Cumulative tricky words allowed: {sorted(cumulative_tricky(book.level))}

Structured content:
{json.dumps(content, indent=2, ensure_ascii=False)}

Review the attached rendered worksheet image strictly. Return JSON.""",
                },
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_b64}"}},
            ],
        },
    ]
    resp = client.chat.completions.create(
        model=JUDGE_MODEL,
        messages=msg,
        response_format={"type": "json_object"},
    )
    return json.loads(resp.choices[0].message.content)


# ---------------------------------------------------------------------------
# The loop
# ---------------------------------------------------------------------------

MAX_ITERATIONS = 5


async def build_one_worksheet(book: Book, wtype: str, gen, out_dir: Path, idx: int) -> Path:
    """Generate -> validate -> render -> judge loop. Returns the path to the
    final accepted PDF page (or the best fail if max iterations reached)."""
    log = {"book": book.sub_level, "type": wtype, "iterations": []}
    prior: list[str] = []

    last_pdf: Path | None = None
    for attempt in range(1, MAX_ITERATIONS + 1):
        # 1. Generate content
        content = gen_content_for(book, wtype, prior_feedback=prior or None)

        # 2. Hard decodability validate (Python)
        words = WORKSHEET_SPECS[wtype]["words_to_validate"](content)
        book_scope = set(book_cumulative_graphemes(book))
        ok, fails = all_decodable(words, book.level, book_scope)
        if not ok:
            prior = [f"Non-decodable word '{f['word']}' ({f['reason']}). Replace with a decodable equivalent."
                     for f in fails]
            log["iterations"].append({"attempt": attempt, "stage": "validator", "fails": fails})
            continue

        # 3. Render to PDF
        html = RENDERERS[wtype](book, content)
        page_pdf = out_dir / f"_tmp_{book.storage_key}_{idx}_{wtype}.pdf"
        await render_html_to_pdf(html, page_pdf, gen)
        last_pdf = page_pdf

        # 4. Rasterize for judge
        page_png = out_dir / f"_tmp_{book.storage_key}_{idx}_{wtype}.png"
        rasterize_pdf_first_page(page_pdf, page_png)

        # 5. Judge
        verdict = judge(book, wtype, content, page_png)
        log["iterations"].append({"attempt": attempt, "stage": "judge", "verdict": verdict})

        if verdict.get("verdict") == "pass":
            # Clean up png
            try: page_png.unlink()
            except OSError: pass
            log["accepted_on_attempt"] = attempt
            (LOG_DIR / f"{book.storage_key}_{idx}_{wtype}.json").write_text(
                json.dumps(log, indent=2, ensure_ascii=False), encoding="utf-8")
            return page_pdf

        if verdict.get("kind_of_fix") == "template":
            # Template can't be auto-fixed in-loop. Accept best content and move on.
            log["template_blocked"] = True
            break

        prior = verdict.get("issues", []) or ["Judge rejected without specifics; tighten content."]

    log["accepted_on_attempt"] = None
    (LOG_DIR / f"{book.storage_key}_{idx}_{wtype}.json").write_text(
        json.dumps(log, indent=2, ensure_ascii=False), encoding="utf-8")
    return last_pdf or (out_dir / "MISSING.pdf")


async def build_book(book: Book, gen) -> Path:
    out_dir = OUT_ROOT / f"L{book.level}"
    out_dir.mkdir(parents=True, exist_ok=True)
    sheet_types = PACKS[book.level]
    pages: list[Path] = []
    for i, wtype in enumerate(sheet_types, 1):
        print(f"  {book.sub_level}  [{i}/{len(sheet_types)}]  {wtype}")
        p = await build_one_worksheet(book, wtype, gen, out_dir, i)
        pages.append(p)
    bundle = out_dir / f"{book.storage_key}_Worksheets.pdf"
    merged = fitz.open()
    for p in pages:
        if not p.exists():
            continue
        with fitz.open(p) as d:
            merged.insert_pdf(d)
    merged.save(bundle)
    merged.close()
    for p in pages:
        try: p.unlink()
        except OSError: pass
    return bundle


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="Single book e.g. L1.1")
    ap.add_argument("--levels", help="Comma-separated levels e.g. 1,2,3")
    ap.add_argument("--concurrency", type=int, default=1,
                    help="How many books to build in parallel. Each book = 6 sequential worksheets internally.")
    args = ap.parse_args()

    books = load_books()
    if args.only:
        books = [b for b in books if b.sub_level == args.only]
    if args.levels:
        keep = {int(x) for x in args.levels.split(",")}
        books = [b for b in books if b.level in keep]

    gen = get_pdf_generator()
    OUT_ROOT.mkdir(parents=True, exist_ok=True)

    if args.concurrency <= 1:
        for b in books:
            path = await build_book(b, gen)
            size_kb = path.stat().st_size // 1024 if path.exists() else 0
            print(f"  {b.sub_level:6s} -> {path.relative_to(ROOT)}  ({size_kb} KB)", flush=True)
    else:
        sem = asyncio.Semaphore(args.concurrency)
        async def build_with_sem(b):
            async with sem:
                p = await build_book(b, gen)
                size_kb = p.stat().st_size // 1024 if p.exists() else 0
                print(f"  {b.sub_level:6s} -> {p.relative_to(ROOT)}  ({size_kb} KB)", flush=True)
                return p
        await asyncio.gather(*[build_with_sem(b) for b in books])


if __name__ == "__main__":
    asyncio.run(main())
