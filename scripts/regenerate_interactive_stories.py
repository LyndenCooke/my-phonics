"""
Regenerate the `type: 'story'` page entries in src/lib/interactiveBookData*.ts
from the May-11 Python story sources.

For each sub-level:
  1. Load `story_pages` from myphonics_books/data/<stem>.py
  2. For each Python page text, build a TS story-page object:
       - sentences[]: split by . ! ?, keeping the punctuation
       - words[]: per token, classify as tricky() / cvc() / pw() with
                  phonemes derived from the longest-match-first grapheme
                  table mirrored from InteractiveBookReader.splitDigraphs
       - imageUrl: /illustrations/{n}_{m}/page{N}.png
       - audioUrl: /sounds/sentences/L{n}_{m}_p{N}.mp3
  3. Replace the existing run of story pages in the matching
     BOOK_<key>_PAGES export.

Usage:
  py -3.12 scripts/regenerate_interactive_stories.py L2.1
  py -3.12 scripts/regenerate_interactive_stories.py --all
"""
from __future__ import annotations
import argparse
import importlib.util
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "myphonics_books" / "data"
TS_DIR = ROOT / "src" / "lib"
TRICKY_JSON = DATA_DIR / "tricky_words_by_level.json"

PY_FILES: dict[str, str] = {
    "L1.1":  "tap_story_l1_1_book1",
    "L1.2":  "mud_dog_story_l1_2_book1",
    "L1.3":  "fish_story_l1_book1",
    "L1.4":  "red_sock_story_l1_4_book1",
    "L1.5":  "run_pup_story_l1_5_book1",
    "L1.6":  "fox_fell_story_l1_6_book1",
    "L1.7":  "jam_jug_story_l1_7_book1",
    "L1.8":  "yak_box_story_l1_8_book1",
    "L1.9":  "chop_chop_story_l1_9_book1",
    "L1.10": "buzz_sing_story_l1_10_book1",
    "L2.1":  "night_light_story_l2_1_book1",
    "L2.2":  "hot_food_cool_moon_story_l2_2_book1",
    "L2.3":  "bark_dark_story_l2_3_book1",
    "L2.4":  "fair_air_story_l2_4_book1",
    "L2.5":  "loud_toy_story_l2_5_book1",
    "L2.6":  "night_fair_story_l2_6_book1",
    "L3.1":  "bike_race_story_l3_1_book1",
    "L3.2":  "night_market_story_l3_2_book1",
    "L3.3":  "dream_team_story_l3_3_book1",
    "L3.4":  "draw_it_again_story_l3_4_book1",
    "L3.5":  "red_sail_story_l3_5_book1",
    "L4.1":  "purple_purse_story_l4_1_book1",
    "L4.2":  "brown_owl_story_l4_2_book1",
    "L4.3":  "new_glue_story_l4_3_book1",
    "L4.4":  "how_now_story_l4_4_book1",
    "L5.1":  "before_the_shore_story_l5_1_book1",
    "L5.2":  "near_the_door_story_l5_2_book1",
    "L5.3":  "sure_she_can_story_l5_3_book1",
    "L5.4":  "belonging_story_l5_4_book1",
    "L6.1":  "marvellous_neighbourhood_story_l6_1_book1",
    "L6.2":  "remarkable_story_l6_2_book1",
    "L6.3":  "delicious_suspicious_story_l6_3_book1",
    "L6.4":  "bush_walk_story_l6_4_book1",
}

TS_FILES: dict[int, Path] = {
    1: TS_DIR / "interactiveBookData.ts",
    2: TS_DIR / "interactiveBookDataL2.ts",
    3: TS_DIR / "interactiveBookDataL3.ts",
    4: TS_DIR / "interactiveBookDataL4.ts",
    5: TS_DIR / "interactiveBookDataL5.ts",
    6: TS_DIR / "interactiveBookDataL6.ts",
}

# Longest-match-first grapheme list mirrored from InteractiveBookReader.tsx
# splitDigraphs(). Keep them in sync if the reader's list changes.
GRAPHEMES: list[str] = [
    "cious", "tious",
    "tion", "ture", "able", "ible", "ous",
    "igh", "air", "ear", "oor", "ore", "ure", "ire", "are", "our",
    "ay", "ee", "oo", "ar", "or", "ir", "ur", "er", "ou", "oy",
    "oa", "oi", "aw", "ai", "ea", "ie", "ue", "ew",
    "ow", "ey", "oe", "au",
    "sh", "ch", "th", "ng", "nk", "ck", "ff", "ll", "ss", "zz", "qu", "tch",
    "ph", "kn", "wr", "wh",
    "dd", "gg", "mm", "nn", "pp", "rr", "tt", "bb",
    "ed", "sion",
]


# Words the greedy matcher gets wrong; mirrors v2_helpers.py (the PDF side).
SPLIT_EXCEPTIONS: dict[str, list[str]] = {
    "direction": ["d", "i", "r", "e", "c", "tion"],
    "directions": ["d", "i", "r", "e", "c", "tion", "s"],
}


def split_graphemes(word: str) -> list[str]:
    """Longest-match-first grapheme split. Mirrors InteractiveBookReader.splitDigraphs,
    then applies the two conventions the curated data uses on top of it:
    magic-e collapses onto the vowel (came -> c, a-e, m) and a word-final
    -se / -ve after a consonant or long-vowel unit is one silent-e unit
    (purse -> p, ur, se), matching v2_helpers.split_into_phonemes."""
    out: list[str] = []
    i = 0
    lower = word.lower()
    if lower in SPLIT_EXCEPTIONS:
        return list(SPLIT_EXCEPTIONS[lower])
    while i < len(lower):
        matched = None
        for g in GRAPHEMES:
            if lower.startswith(g, i):
                matched = g
                break
        if matched:
            out.append(matched)
            i += len(matched)
        else:
            out.append(lower[i])
            i += 1
    # Magic-e: vowel + single consonant + final e (optionally + s / + d).
    tail = 1 if len(out) >= 4 and out[-1] in ("s", "d") else 0
    n = len(out) - tail
    if (
        n >= 3 and out[n - 1] == "e"
        and len(out[n - 2]) == 1 and out[n - 2] not in "aeiou"
        and len(out[n - 3]) == 1 and out[n - 3] in "aeiou"
    ):
        collapsed = out[: n - 3] + [f"{out[n - 3]}-e", out[n - 2]]
        return collapsed + out[n:] if tail else collapsed
    if (
        len(out) >= 3 and out[-1] == "e" and out[-2] in ("s", "v")
        and (len(out[-3]) >= 2 or out[-3] not in "aeiou")
    ):
        return out[:-2] + [out[-2] + "e"]
    return out


# Legacy 6-level sub-level -> 8-level journey sub-level. tricky_words_by_level.json
# was rebuilt to 8 levels (2026-06-09), so the tricky set must be looked up by
# the JOURNEY level, not the legacy catalogue level the TS files are named by.
LEGACY_TO_JOURNEY: dict[str, str] = {
    "L1.1": "L1.1", "L1.2": "L1.2",
    "L1.4": "L2.1", "L1.5": "L2.2", "L1.6": "L2.3", "L1.7": "L2.4", "L1.8": "L2.5",
    "L1.3": "L3.1", "L1.9": "L3.2", "L1.10": "L3.3",
    "L2.1": "L4.1", "L2.2": "L4.2", "L2.3": "L4.3", "L2.4": "L4.4", "L2.5": "L4.5", "L2.6": "L4.6",
    "L3.1": "L5.1", "L3.2": "L5.2", "L3.3": "L5.3", "L3.4": "L5.4", "L3.5": "L5.5",
    "L4.1": "L6.1", "L4.2": "L6.2", "L4.3": "L6.3", "L4.4": "L6.4",
    "L5.1": "L7.1", "L5.2": "L7.2", "L5.3": "L7.3", "L5.4": "L7.4",
    "L6.1": "L8.1", "L6.2": "L8.2", "L6.3": "L8.3", "L6.4": "L8.4",
}


def journey_level_of(sub_level: str) -> int:
    return int(LEGACY_TO_JOURNEY.get(sub_level, sub_level).split(".")[0][1:])


def load_tricky_cumulative(level: int) -> set[str]:
    data = json.loads(TRICKY_JSON.read_text(encoding="utf-8"))
    return {w.lower() for w in data[f"level_{level}"]["cumulative"]}


def load_python_pages(py_stem: str) -> list[str]:
    path = DATA_DIR / f"{py_stem}.py"
    spec = importlib.util.spec_from_file_location(py_stem, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)  # type: ignore[union-attr]
    for name in dir(mod):
        val = getattr(mod, name)
        if isinstance(val, dict):
            for inner in val.values():
                if isinstance(inner, dict) and "story_pages" in inner:
                    return [p["text"] for p in inner["story_pages"]]
    raise RuntimeError(f"No story_pages found in {py_stem}")


# Split on terminator + whitespace, so `'Yay!'` (no space after !) stays whole.
def normalise_quotes(text: str) -> str:
    """The interactive corpus writes dialogue in straight double quotes and
    apostrophes as straight single quotes; the PDF sources have drifted to
    curly single quotes for dialogue in places. Map: a curly apostrophe
    between letters -> ', every other curly quote -> \"."""
    text = re.sub(r"(?<=[A-Za-z])’(?=[A-Za-z])", "'", text)
    return (text.replace("“", '"').replace("”", '"')
                .replace("‘", '"').replace("’", '"'))


def split_sentences(text: str) -> list[str]:
    text = normalise_quotes(text)
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p for p in parts if p]


def ts_string_literal(s: str) -> str:
    """Render a string as a single-quoted TS literal, escaping internal quotes."""
    return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"


def render_word(token: str, tricky: set[str]) -> str:
    """Render one token (which may include surrounding punctuation) as a
    helper-function call. Returns text like  pw('day,', 'day', ['d','ay']).

    Core = letters with optional internal apostrophe/hyphen between letters
    (so don't/can't keep their apostrophe inside the core, and edge
    apostrophes like in 'Yay!' stay in pre/post).
    """
    m = re.match(
        r"^([^A-Za-z]*?)([A-Za-z]+(?:[\'’-][A-Za-z]+)*)([^A-Za-z]*)$",
        token,
    )
    if not m:
        return f"tricky({ts_string_literal(token)}, {ts_string_literal(token.lower())})"
    core = m.group(2)
    display = token
    clean = core.replace("’", "").replace("'", "").lower()
    # The `I` pronoun is the one canonical capital tricky word in this corpus —
    # keep its display capital but lowercase others.
    second_arg = core if core == "I" else core.lower()
    if clean in tricky:
        return f"tricky({ts_string_literal(display)}, {ts_string_literal(second_arg)})"
    graphemes = split_graphemes(clean)
    if all(len(g) == 1 for g in graphemes):
        return f"cvc({ts_string_literal(display)}, {ts_string_literal(clean)})"
    phonemes = ", ".join(ts_string_literal(g) for g in graphemes)
    return (
        f"pw({ts_string_literal(display)}, "
        f"{ts_string_literal(clean)}, "
        f"[{phonemes}])"
    )


def tokenize(sentence: str) -> list[str]:
    """Split a sentence into whitespace-separated display tokens, preserving
    punctuation attached to each word as in the existing data."""
    return [t for t in re.split(r"\s+", sentence) if t]


def render_story_page(sub_level: str, page_index: int, text: str, tricky: set[str]) -> str:
    """Render a single TS story-page object literal for `text`."""
    sentences = split_sentences(text)
    tokens: list[str] = []
    for s in sentences:
        tokens.extend(tokenize(s))
    sentence_literals = ", ".join(ts_string_literal(s) for s in sentences)
    word_literals = ",\n      ".join(render_word(t, tricky) for t in tokens)
    key = sub_level.replace("L", "").replace(".", "_")
    img = f"/illustrations/{key}/page{page_index}.png"
    aud = f"/sounds/sentences/L{key}_p{page_index}.mp3"
    return (
        f"  {{ type: 'story', sentences: [{sentence_literals}],\n"
        f"    words: [\n"
        f"      {word_literals},\n"
        f"    ],\n"
        f"    imageUrl: '{img}', audioUrl: '{aud}' }},\n"
    )


# ── TS file surgery ─────────────────────────────────────────────────────────

def book_block_bounds(src: str, key: str) -> tuple[int, int] | None:
    """Locate the byte range of `export const BOOK_<key>_PAGES: ... = [ ... ];`
    in the source. Returns None if not present."""
    want = f"BOOK_{key.replace('.', '_')}_PAGES"
    start_pat = re.compile(rf"export const {re.escape(want)}\s*:\s*InteractivePage\[\]\s*=\s*\[")
    m = start_pat.search(src)
    if not m:
        return None
    # Find the matching `];` that closes the array. We balance brackets.
    i = m.end()  # just past the opening '['
    depth = 1
    while i < len(src) and depth > 0:
        c = src[i]
        if c == "[":
            depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0:
                break
        elif c == "'":  # skip single-quoted string
            i += 1
            while i < len(src) and src[i] != "'":
                if src[i] == "\\":
                    i += 2
                    continue
                i += 1
        elif c == '"':  # skip double-quoted string
            i += 1
            while i < len(src) and src[i] != '"':
                if src[i] == "\\":
                    i += 2
                    continue
                i += 1
        elif c == "/" and i + 1 < len(src) and src[i + 1] == "/":
            # line comment
            while i < len(src) and src[i] != "\n":
                i += 1
        elif c == "/" and i + 1 < len(src) and src[i + 1] == "*":
            # block comment
            i += 2
            while i + 1 < len(src) and not (src[i] == "*" and src[i + 1] == "/"):
                i += 1
            i += 2
            continue
        i += 1
    if depth != 0:
        return None
    # Include the trailing `];` so caller can replace the whole declaration body.
    return (m.start(), i + 2)  # i is at ']'; +2 to consume `];`


# Match each story-page object literal inside a book block by scanning for
# `{ type: 'story', ...},` chunks. Uses bracket-balancing the same way as
# book_block_bounds.
def find_story_page_runs(block: str) -> list[tuple[int, int]]:
    """Return contiguous runs of story-page literal byte ranges in `block`.
    Each story-page literal is bracketed by `{` ... `},`."""
    runs: list[list[tuple[int, int]]] = []
    cur: list[tuple[int, int]] = []
    i = 0
    while i < len(block):
        m = re.compile(r"\{\s*type:\s*'story'").search(block, i)
        if not m:
            break
        start = m.start()
        # Balance braces to find the closing `}`.
        depth = 0
        j = m.start()
        while j < len(block):
            c = block[j]
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    j += 1
                    break
            elif c == "'":
                j += 1
                while j < len(block) and block[j] != "'":
                    if block[j] == "\\":
                        j += 2
                        continue
                    j += 1
            elif c == '"':
                j += 1
                while j < len(block) and block[j] != '"':
                    if block[j] == "\\":
                        j += 2
                        continue
                    j += 1
            j += 1
        # Consume a trailing comma if present so we replace the whole entry.
        if j < len(block) and block[j] == ",":
            j += 1
        if j < len(block) and block[j] == "\n":
            # Don't consume the trailing newline — replacement injects its own.
            pass
        # If this entry is adjacent to the previous one (only whitespace +
        # optional line comments between), extend the current run; otherwise
        # start a new run.
        if cur:
            gap = block[cur[-1][1]:start]
            # Allow whitespace and `//` comments in the gap.
            stripped = re.sub(r"//[^\n]*", "", gap).strip()
            if stripped == "":
                cur.append((start, j))
            else:
                runs.append(cur)
                cur = [(start, j)]
        else:
            cur = [(start, j)]
        i = j
    if cur:
        runs.append(cur)
    # Flatten each run to a single (start, end) span covering all entries.
    return [(r[0][0], r[-1][1]) for r in runs]


def regenerate(sub_level: str) -> tuple[str, str]:
    """Return (old_block_excerpt, new_story_block) for review."""
    py_stem = PY_FILES[sub_level]
    level = int(sub_level.split(".")[0][1:])
    tricky = load_tricky_cumulative(journey_level_of(sub_level))
    pages = load_python_pages(py_stem)
    new_entries: list[str] = []
    for idx, text in enumerate(pages, start=1):
        new_entries.append(render_story_page(sub_level, idx, text, tricky))
    new_block = "".join(new_entries)
    return ("", new_block)


def update_ts_file(sub_level: str, *, write: bool) -> str:
    py_stem = PY_FILES[sub_level]
    level = int(sub_level.split(".")[0][1:])
    tricky = load_tricky_cumulative(journey_level_of(sub_level))
    pages = load_python_pages(py_stem)

    ts_path = TS_FILES[level]
    src = ts_path.read_text(encoding="utf-8")
    eol = "\r\n" if "\r\n" in src else "\n"
    src_n = src.replace("\r\n", "\n")

    bounds = book_block_bounds(src_n, sub_level)
    if not bounds:
        raise RuntimeError(f"BOOK_{sub_level.replace('.', '_')}_PAGES not found in {ts_path.name}")
    block_start, block_end = bounds
    block_text = src_n[block_start:block_end]

    # Locate run(s) of story-page entries inside this block.
    runs = find_story_page_runs(block_text)
    if not runs:
        raise RuntimeError(f"No `type: 'story'` entries found in BOOK_{sub_level.replace('.', '_')}_PAGES")
    # We expect exactly one contiguous story-page section per book. If there
    # are multiple runs (e.g. story interspersed with other pages), we abort
    # rather than guess.
    if len(runs) > 1:
        raise RuntimeError(
            f"Multiple story-page runs found in BOOK_{sub_level.replace('.', '_')}_PAGES "
            f"({len(runs)} runs). Manual edit required."
        )
    run_start, run_end = runs[0]

    # Render new entries.
    new_entries = []
    for idx, text in enumerate(pages, start=1):
        new_entries.append(render_story_page(sub_level, idx, text, tricky))
    new_chunk = "".join(new_entries).rstrip("\n")

    # Splice the new chunk back into the block.
    new_block = block_text[:run_start] + new_chunk + block_text[run_end:]
    new_src_n = src_n[:block_start] + new_block + src_n[block_end:]
    new_src = new_src_n.replace("\n", eol) if eol == "\r\n" else new_src_n

    if write:
        ts_path.write_text(new_src, encoding="utf-8", newline="")
    # Compose a unified diff summary for stdout.
    return (
        f"{sub_level}: replaced {(run_end - run_start)} bytes of story pages "
        f"with {len(new_chunk)} bytes ({len(pages)} new pages)."
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("subs", nargs="*", help="Sub-levels e.g. L2.1 L2.2")
    ap.add_argument("--all", action="store_true", help="Update every book")
    ap.add_argument("--dry-run", action="store_true", help="Print plan only")
    args = ap.parse_args()

    targets: list[str]
    if args.all:
        targets = list(PY_FILES.keys())
    elif args.subs:
        targets = args.subs
    else:
        ap.error("Pass one or more sub-levels (e.g. L2.1) or --all")
        return 2

    for sub in targets:
        if sub not in PY_FILES:
            print(f"!! Unknown sub-level: {sub}")
            continue
        try:
            msg = update_ts_file(sub, write=not args.dry_run)
            print(msg)
        except Exception as e:
            print(f"!! {sub}: {e}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
