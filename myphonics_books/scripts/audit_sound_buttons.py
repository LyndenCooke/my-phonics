"""
Sound-button marks audit — QA for the Story Words dots / underlines / arcs.

Triggered by Lynden's 2026-07-02 find: "purple" and "purse" in L6.1 drew a
bogus magic-e over-arc that DELETED the correct 'ur' underline (the split-
digraph detector accepted any number of middle consonants and overrode
vowels that were already part of a taught grapheme). Also: -ed and -le were
inconsistently treated between phoneme buttons and marks.

For every book this script renders the mark pattern of every sound-buttoned
word (the page-3 Story Words panel) in readable notation and flags:
  - over-arcs (magic-e)   — should ONLY appear on genuine V-C-e words
  - -ed / -le suffix units
  - taught multi-letter graphemes present in the word but NOT marked as a
    unit (possible mis-segmentation — needs a human eye, some are fine)

Usage:  py -3.12 scripts/audit_sound_buttons.py
Output: output/qa/sound_button_audit.md  (+ summary on stdout)
"""

import sys
from pathlib import Path

BASE_DIR = Path(__file__).parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR.parent))

from generate_pilot_books import get_pilot_stories, LEVEL_KEYS, NEW_TO_OLD  # noqa: E402
from audit_decodability import load_json  # noqa: E402
from v2_helpers import build_sound_buttoned_words  # noqa: E402

OUT_PATH = BASE_DIR.parent / "output" / "qa" / "sound_button_audit.md"


def render_marks(word: str, marks: list) -> str:
    """Human-readable mark notation: (ur)=underline unit, {u_e}=over-arc,
    plain letter = dot."""
    lower = word.lower()
    covered = {}
    for m in marks:
        for idx in m["indices"]:
            covered[idx] = m
    out, i = [], 0
    while i < len(lower):
        m = covered.get(i)
        if m and m["type"] == "under_arc":
            span = "".join(lower[j] for j in m["indices"])
            out.append(f"({span})")
            i = m["indices"][-1] + 1
        elif m and m["type"] == "over_arc":
            span = "".join(lower[j] for j in m["indices"])
            out.append(f"{{{span[0]}_{span[-1]} arc over {span[1:-1]}}}")
            i = m["indices"][-1] + 1
        else:
            out.append(lower[i])
            i += 1
    return " ".join(out)


def main():
    graphemes_data = load_json("graphemes_by_level.json")
    stories = get_pilot_stories()

    def new_id_sort(nid):
        a, b = nid.split(".")
        return (int(a), int(b))

    lines = [
        "# Sound-button marks audit",
        "",
        "Every Story Words / read-words entry with its rendered mark pattern.",
        "`(xx)` = underline unit, `{x_e arc}` = magic-e over-arc, bare letter = dot.",
        "Regenerate with `py -3.12 scripts/audit_sound_buttons.py`.",
        "",
    ]
    n_arcs = n_suffix = n_unmarked = 0
    arc_rows, unmarked_rows = [], []

    for new_id in sorted(NEW_TO_OLD, key=new_id_sort):
        old_id = NEW_TO_OLD[new_id]
        key = LEVEL_KEYS.get(old_id)
        story = stories.get(key) if key else None
        if not story:
            continue
        level = int(new_id.split(".")[0])
        cumulative = []
        for lv in range(1, level + 1):
            cumulative.extend(graphemes_data.get(f"level_{lv}", {}).get("graphemes", []))
        multi_taught = [g for g in set(cumulative) if len(g) >= 2 and "-" not in g]

        words = story.get("story_words") or story.get("read_words") or []
        buttoned = build_sound_buttoned_words(words, cumulative)

        lines.append(f"## L{new_id} — {story.get('book_title', '?')}")
        lines.append("")
        for entry in buttoned:
            word, marks = entry["word"], entry["marks"]
            pattern = render_marks(word, marks)
            flags = []
            if any(m["type"] == "over_arc" for m in marks):
                flags.append("MAGIC-E ARC — verify genuine V-C-e")
                n_arcs += 1
                arc_rows.append(f"L{new_id} **{word}** → `{pattern}`")
            if word.lower().endswith(("ed", "le")) and any(
                m["type"] == "under_arc" and m["indices"][-1] == len(word) - 1
                and len(m["indices"]) == 2 for m in marks
            ):
                flags.append("suffix unit")
                n_suffix += 1
            # Taught multi-letter grapheme visible in the word but not marked
            # as one unit — POSITIONAL: an occurrence fully inside a longer
            # marked span ('ir' inside '(air)', 'ou' inside '(ous)') is fine;
            # only flag occurrences sitting in unmarked (dot) territory.
            marked_idx = set()
            for m in marks:
                if len(m["indices"]) >= 2:
                    marked_idx.update(m["indices"])
            lw = word.lower()
            unmarked = set()
            for g in multi_taught:
                start = lw.find(g)
                while start != -1:
                    span = set(range(start, start + len(g)))
                    if not span & marked_idx:
                        unmarked.add(g)
                    start = lw.find(g, start + 1)
            unmarked = sorted(unmarked)
            if unmarked:
                flags.append("contains unmarked taught unit(s): " + ", ".join(unmarked))
                n_unmarked += 1
                unmarked_rows.append(
                    f"L{new_id} **{word}** → `{pattern}` (unmarked: {', '.join(unmarked)})")
            flag_str = "  ⚠ " + "; ".join(flags) if flags else ""
            lines.append(f"- **{word}** → `{pattern}`{flag_str}")
        lines.append("")

    lines.insert(6, f"Summary: {n_arcs} magic-e arcs, {n_suffix} -ed/-le suffix units, "
                    f"{n_unmarked} words with unmarked taught units.")
    lines.insert(7, "")
    if arc_rows:
        lines.insert(8, "### All magic-e arcs (each must be a real V-C-e word)")
        lines.insert(9, "")
        for i, r in enumerate(arc_rows):
            lines.insert(10 + i, f"- {r}")
        lines.insert(10 + len(arc_rows), "")

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUT_PATH}")
    print(f"{n_arcs} magic-e arcs | {n_suffix} suffix units | {n_unmarked} unmarked-unit words")
    for r in arc_rows:
        print("  ARC", r)
    for r in unmarked_rows:
        print("  UNMARKED", r)


if __name__ == "__main__":
    main()
