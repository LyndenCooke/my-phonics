"""
Compare the story sentences in src/lib/interactiveBookData*.ts against the
May-11 Python source in myphonics_books/data/*_story_*_book1.py.

Reports, per book, whether the interactive reader's story pages still match
the PDF that was rendered May 12. The TS side parses simply: each
`{ type: 'story', sentences: [...], ...}` literal has its sentences pulled
out by regex. The Python side imports the module and reads `story_pages`.

Run: py -3.12 scripts/audit_interactive_vs_pdf.py
"""
from __future__ import annotations
import importlib.util
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "myphonics_books" / "data"
TS_DIR = ROOT / "src" / "lib"

# Map sub-level -> python file stem prefix used in data/
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

# TS file for each level
TS_FILES: dict[int, Path] = {
    1: TS_DIR / "interactiveBookData.ts",
    2: TS_DIR / "interactiveBookDataL2.ts",
    3: TS_DIR / "interactiveBookDataL3.ts",
    4: TS_DIR / "interactiveBookDataL4.ts",
    5: TS_DIR / "interactiveBookDataL5.ts",
    6: TS_DIR / "interactiveBookDataL6.ts",
}


def load_python_pages(py_stem: str) -> list[str]:
    """Import the story module and return a flat list of page texts."""
    path = DATA_DIR / f"{py_stem}.py"
    spec = importlib.util.spec_from_file_location(py_stem, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)  # type: ignore[union-attr]
    # The dict is named differently per file. Find the only dict-valued
    # uppercase module attribute that contains a 'story_pages' inner key.
    for name in dir(mod):
        val = getattr(mod, name)
        if isinstance(val, dict):
            for inner in val.values():
                if isinstance(inner, dict) and "story_pages" in inner:
                    return [p["text"] for p in inner["story_pages"]]
    raise RuntimeError(f"No story_pages found in {py_stem}")


# Capture a single book block: starts at `export const BOOK_<key>_PAGES`
# and ends at the next `export const` or end of file.
BOOK_BLOCK_RE = re.compile(
    r"export const (BOOK_L\d+_\d+_PAGES)\s*:\s*InteractivePage\[\]\s*=\s*\[(.*?)\n\];",
    re.DOTALL,
)

# Inside a block, capture sentence arrays from `type: 'story'` literals.
STORY_SENTENCES_RE = re.compile(
    r"type:\s*'story'\s*,\s*sentences:\s*\[([^\]]*)\]",
    re.DOTALL,
)


def load_ts_pages(level: int, key: str) -> list[str] | None:
    """Return the flat list of sentence strings for BOOK_<key>_PAGES."""
    src = TS_FILES[level].read_text(encoding="utf-8").replace("\r\n", "\n")
    want = f"BOOK_{key.replace('.', '_')}_PAGES"
    # Find the start of this block, then read forward until the next
    # `export const` (or EOF). Avoids worrying about brace-matching.
    starts = [(m.start(), m.group(1)) for m in re.finditer(
        r"export const (BOOK_L\d+_\d+_PAGES)", src
    )]
    block = None
    for i, (pos, name) in enumerate(starts):
        if name != want:
            continue
        end = starts[i + 1][0] if i + 1 < len(starts) else len(src)
        block = src[pos:end]
        break
    if block is None:
        return None
    sentences: list[str] = []
    for sm in STORY_SENTENCES_RE.finditer(block):
        raw = sm.group(1)
        # Sentence literals may be single- OR double-quoted ("The yak can't get it!").
        for q in re.finditer(r"'((?:\\'|[^'])*)'|\"((?:\\\"|[^\"])*)\"", raw):
            sentences.append((q.group(1) or q.group(2) or "").replace("\\'", "'"))
    return sentences


def main() -> int:
    print(f"{'Book':<6}  {'PY pages':<9}  {'TS pages':<9}  Status")
    print("-" * 60)
    stale = []
    missing_ts = []
    for sub_level, py_stem in PY_FILES.items():
        level = int(sub_level.split(".")[0][1:])
        try:
            py_pages = load_python_pages(py_stem)
        except Exception as e:
            print(f"{sub_level:<6}  ERR        --         python: {e}")
            continue
        ts_pages = load_ts_pages(level, sub_level)
        if ts_pages is None:
            print(f"{sub_level:<6}  {len(py_pages):<9}  --         no TS block found")
            missing_ts.append(sub_level)
            continue
        # The TS often splits each python page into multiple `type: 'story'`
        # pages (e.g. two sentences split into two pages). So compare by
        # joined text rather than count.
        # Curly quotes in the PDF sources vs straight quotes in the corpus are
        # not drift - normalise before comparing.
        def straight(t: str) -> str:
            t = re.sub(r"(?<=[A-Za-z])\u2019(?=[A-Za-z])", "'", t)  # apostrophe inside a word
            return (t.replace("\u201c", '"').replace("\u201d", '"')
                     .replace("\u2018", '"').replace("\u2019", '"'))
        py_text = " ".join(straight(s).strip() for s in py_pages)
        ts_text = " ".join(straight(s).strip() for s in ts_pages)
        match = py_text == ts_text
        # Looser match: token equality ignoring whitespace/punct variations.
        def norm(s: str) -> str:
            return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()
        loose = norm(py_text) == norm(ts_text)
        status = "OK" if match else ("close" if loose else "STALE")
        print(f"{sub_level:<6}  {len(py_pages):<9}  {len(ts_pages):<9}  {status}")
        if not match:
            stale.append(sub_level)

    print()
    print(f"Stale (text differs): {len(stale)} books -> {', '.join(stale) or '-'}")
    if missing_ts:
        print(f"No TS block: {', '.join(missing_ts)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
