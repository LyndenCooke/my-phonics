"""
Decodability audit — the QA sweep behind the CRITICAL CONSTRAINT in CLAUDE.md:
every word must be decodable at the given level OR be a listed tricky word.

For each book (new 8-level id) it computes the graphemes taught UP TO THAT
BOOK — prior levels in full plus the current level up to the book's furthest
focus sound (the same window as the page-2 sound chart) — then scans:
  - the story text        (violations + ahead-of-schedule tricky words)
  - read_words            (violations)
  - nonsense_words        (violations — nonsense words must be 100% decodable)
  - writing_words         (violations)

A word passes when it can be segmented into taught graphemes.  Known digraphs
(ss, ck, sh, th, ...) that the child hasn't met yet may NOT be read as two
separate letters — "mess" is not m-e-s-s before ss is taught.

Usage:  py -3.12 scripts/audit_decodability.py
Output: output/qa/decodability_audit.md  (+ summary on stdout)
"""

import json
import re
import sys
from pathlib import Path

BASE_DIR = Path(__file__).parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR.parent))

from generate_pilot_books import get_pilot_stories, LEVEL_KEYS, NEW_TO_OLD  # noqa: E402
from v2_helpers import (  # noqa: E402
    taught_graphemes, all_known_units, can_decode, check_word,
)

DATA_DIR = BASE_DIR.parent / "data"
OUT_PATH = BASE_DIR.parent / "output" / "qa" / "decodability_audit.md"

# Tokens that are placeholders or character names (pre-taught by the adult).
SKIP_TOKENS = {"child_name", "friend_name", "emma", "mia", "nonna", "luca"}


def load_json(name):
    with open(DATA_DIR / name, "r", encoding="utf-8") as f:
        return json.load(f)


# taught_graphemes / all_known_units / can_decode / check_word now live in
# v2_helpers.py, shared with the page-2 "Future Sounds" preview band in
# generate_book.py — one source of truth for what counts as decodable.


def main():
    graphemes_data = load_json("graphemes_by_level.json")
    tricky_data = load_json("tricky_words_by_level.json")
    stories = get_pilot_stories()
    known_units = all_known_units(graphemes_data)

    master_tricky = {}  # word -> level introduced
    for lv in range(1, 9):
        for w in tricky_data.get(f"level_{lv}", {}).get("new_tricky_words", []):
            master_tricky.setdefault(w.lower(), lv)

    lines = [
        "# Decodability audit",
        "",
        "Every word a child cannot yet decode at the point the book appears.",
        "Taught window per book = prior levels in full + current level up to the",
        "book's furthest focus sound.  Regenerate with"
        " `py -3.12 scripts/audit_decodability.py`.",
        "",
    ]
    summary = []

    def new_id_sort(nid):
        a, b = nid.split(".")
        return (int(a), int(b))

    for new_id in sorted(NEW_TO_OLD, key=new_id_sort):
        old_id = NEW_TO_OLD[new_id]
        key = LEVEL_KEYS.get(old_id)
        story = stories.get(key) if key else None
        if not story:
            lines.append(f"## L{new_id} — MISSING STORY (old id {old_id})\n")
            continue
        level = int(new_id.split(".")[0])
        focus = story.get("focus_graphemes", [])
        taught = taught_graphemes(graphemes_data, level, focus)
        author_tricky = {w.lower() for w in story.get("tricky_words_used", [])}

        story_text = " ".join(p["text"] for p in story.get("story_pages", []))
        seen, violations, ahead = [], [], []
        for tok in re.findall(r"[A-Za-z']+", story_text):
            w = tok.strip("'").lower()
            if w.endswith("'s"):  # possessive morpheme, not a grapheme
                w = w[:-2]
            if not w or w in SKIP_TOKENS or w in seen:
                continue
            seen.append(w)
            mt = master_tricky.get(w)
            if mt is not None or w in author_tricky:
                if mt is not None and mt > level:
                    ahead.append(f"{w} (listed L{mt})")
                continue
            reason = check_word(w, taught, known_units)
            if reason:
                violations.append(f"**{w}** — {reason}")

        act_violations = []
        for field in ("read_words", "nonsense_words", "writing_words"):
            for tok in story.get(field, []):
                w = tok.strip("'").lower()
                reason = check_word(w, taught, known_units)
                if reason:
                    act_violations.append(f"**{w}** ({field}) — {reason}")

        summary.append((new_id, story.get("book_title", "?"), len(violations), len(act_violations)))
        lines.append(f"## L{new_id} — {story.get('book_title', '?')}  (old {old_id}, focus: {', '.join(focus)})")
        lines.append("")
        if violations:
            lines.append("Story-text violations:")
            lines.extend(f"- {v}" for v in violations)
        else:
            lines.append("Story text: clean.")
        if ahead:
            lines.append("Tricky words used ahead of schedule (auto-flagged on p3): " + ", ".join(ahead))
        if act_violations:
            lines.append("Activity-word violations:")
            lines.extend(f"- {v}" for v in act_violations)
        lines.append("")

    lines.insert(6, "| Book | Title | Story violations | Activity violations |")
    lines.insert(7, "|---|---|---|---|")
    for i, (nid, title, sv, av) in enumerate(summary):
        lines.insert(8 + i, f"| L{nid} | {title} | {sv} | {av} |")
    lines.insert(8 + len(summary), "")

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUT_PATH}")
    total_sv = sum(s[2] for s in summary)
    total_av = sum(s[3] for s in summary)
    print(f"{total_sv} story-text violations, {total_av} activity-word violations across {len(summary)} books")
    for nid, title, sv, av in summary:
        if sv or av:
            print(f"  L{nid} {title}: {sv} story / {av} activity")


if __name__ == "__main__":
    main()
