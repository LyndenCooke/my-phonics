"""RETIRED one-time migration — DO NOT RE-RUN.

Rebuilt graphemes_by_level.json + tricky_words_by_level.json from the v2.1
Curriculum Ledger's 8-level scheme for the original 6->8 level realignment.
Its hardcoded LEVELS/NEW_TRICKY dicts below are a SNAPSHOT from that one
migration and have gone stale — the live data files have since been hand-
edited multiple times (e.g. the 2026-07-03 tricky-word cleanup removing
fast/last/past/after/father/class/grass/pass/plant/path/bath and out, and
the 2026-07-12 Shifty->main-ladder promotions of wh/ph/ve). Re-running this
script would silently overwrite those fixes with the old, wrong lists —
that regression already happened once (caught 2026-07-12). Guarded below:
refuses to run if the *.6level.bak marker from the original migration is
already present.
"""
import json
import shutil
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"

# ---- 8-level scheme (verbatim from output/worksheet_plan/CURRICULUM_LEDGER.md v2.1) ----
LEVELS = {
    1: dict(name="Ditties", colour="#E84B8A", maps_to="RWI Early Set 1 / Phase 2 sets 1-2",
            graphemes=["s","a","t","p","i","n","m","d","g","o"], font_size=36, story_pages=6, template_type="ditty"),
    2: dict(name="First Sounds", colour="#F97066", maps_to="RWI remaining Set 1 singles + doubles / Phase 2 sets 3-5",
            graphemes=["c","k","ck","e","u","r","h","b","f","ff","l","ll","ss","j","v","w","x","y","z"], font_size=36, story_pages=6, template_type="ditty"),
    3: dict(name="Special Friends", colour="#F59E0B", maps_to="RWI Set 1 special friends / Phase 3 consonant digraphs + Phase 4",
            graphemes=["sh","nk","ch","th","ng","qu","zz"], font_size=36, story_pages=6, template_type="ditty"),
    4: dict(name="Longer Sounds", colour="#22C55E", maps_to="RWI Set 2 / Phase 3 vowel digraphs",
            graphemes=["ay","ee","igh","ow","oo","ar","or","air","ir","ou","oy"], font_size=28, story_pages=8, template_type="story"),
    5: dict(name="New Spellings", colour="#3B82F6", maps_to="RWI early Set 3 / Phase 5 split digraphs + first alternatives",
            graphemes=["a-e","i-e","o-e","u-e","ea","ie","oi","aw","ai","oa","ve"], font_size=24, story_pages=8, template_type="story"),
    6: dict(name="Building Fluency", colour="#6366F1", maps_to="RWI Set 3 continued / Phase 5 more alternatives",
            graphemes=["ur","er","are","ow","ew","ue"], font_size=20, story_pages=8, template_type="story"),
    7: dict(name="Reading Together", colour="#8B5CF6", maps_to="RWI Grey 9-11 / late Phase 5 trigraphs",
            graphemes=["ire","ore","ear","oor","ure","tion"], font_size=18, story_pages=8, template_type="story"),
    8: dict(name="Reading Champion", colour="#14B8A6", maps_to="RWI Grey 12-13 / Phase 6 suffix morphology",
            graphemes=["ous","cious","tious","able","ible"], font_size=16, story_pages=8, template_type="story"),
}

NEW_TRICKY = {
    1: ["I","the"],
    2: ["no","go","to","into","is"],
    3: ["he","she","we","me","be"],
    4: ["was","my","you","they","her","all","are"],
    5: ["said","so","have","like","some","come","were","there","little","one","do","when","out","what"],
    6: ["oh","their","people","Mr","Mrs","looked","called","asked","could"],
    7: ["door","floor","poor","because","find","kind","mind","behind","child","children","wild","climb",
        "most","only","both","old","cold","gold","hold","told","every","everybody","even","great","break",
        "steak","pretty","beautiful","after","fast","last","past","father","class","grass","pass","plant","path","bath"],
    8: ["hour","move","prove","improve","sure","sugar","eye","should","would","who","whole","any","many",
        "clothes","busy","water","again","half","money","parents","Christmas"],
}


def dedupe(seq):
    seen, out = set(), []
    for x in seq:
        if x not in seen:
            seen.add(x); out.append(x)
    return out


def main():
    bak_marker = DATA / "tricky_words_by_level.6level.bak"
    if bak_marker.exists() and "--force" not in sys.argv:
        print(
            "REFUSING TO RUN: this migration already happened once "
            f"({bak_marker.name} exists) and its hardcoded word lists are "
            "stale. Re-running would overwrite hand-made curriculum fixes. "
            "Pass --force if you truly mean to reset from this snapshot."
        )
        sys.exit(1)

    # backup
    for fn in ("graphemes_by_level.json", "tricky_words_by_level.json"):
        src = DATA / fn
        bak = DATA / (fn.replace(".json", ".6level.bak"))
        if src.exists() and not bak.exists():
            shutil.copy(src, bak)
            print(f"backed up {fn} -> {bak.name}")

    graphemes, tricky = {}, {}
    cum_g, cum_t = [], []
    for lv in range(1, 9):
        L = LEVELS[lv]
        cum_g = dedupe(cum_g + L["graphemes"])
        cum_t = dedupe(cum_t + NEW_TRICKY[lv])
        graphemes[f"level_{lv}"] = {
            "name": L["name"], "maps_to": L["maps_to"], "colour": L["colour"],
            "graphemes": L["graphemes"], "cumulative_graphemes": list(cum_g),
            "font_size": L["font_size"], "story_pages": L["story_pages"],
            "template_type": L["template_type"],
        }
        tricky[f"level_{lv}"] = {
            "name": L["name"], "maps_to": L["maps_to"],
            "new_tricky_words": NEW_TRICKY[lv], "cumulative": list(cum_t),
        }

    (DATA / "graphemes_by_level.json").write_text(json.dumps(graphemes, indent=2, ensure_ascii=False), encoding="utf-8")
    (DATA / "tricky_words_by_level.json").write_text(json.dumps(tricky, indent=2, ensure_ascii=False), encoding="utf-8")
    print("wrote 8-level graphemes_by_level.json + tricky_words_by_level.json")
    for lv in range(1, 9):
        print(f"  L{lv} {LEVELS[lv]['name']:<18} {len(LEVELS[lv]['graphemes'])} graphemes, "
              f"{len(graphemes[f'level_{lv}']['cumulative_graphemes'])} cumulative")


if __name__ == "__main__":
    main()
