"""
Convert output/sound_books/_word_consult.json into data/sound_books/inventory.py,
preserving the inventory.py structure (level metadata, _b/_s helpers, instructions)
but swapping in the new spotlight word lists.

Applies these manual fixes during conversion:
  - L7.3 ear: drop bear/pear/tear (those are /eə/ "air" sound, not /ɪə/)
              substitute year/clear/dear so all words use the target /ɪə/ phoneme.
  - L8.1 -ous: drop "delicious" (that's -cious, covered in L8.2);
               substitute "marvellous".
  - L1.5 i: "ice cream" → "icecream" so the segmenter handles it as one token.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
CONSULT = ROOT / "output" / "sound_books" / "_word_consult.json"
OUT = ROOT / "data" / "sound_books" / "inventory.py"


# Manual QA fixes — applied to specific (book_id, grapheme) entries.
FIXES = {
    ("L7.3", "ear"): {
        "drop": {"bear", "pear", "tear"},
        "add": [
            {"word": "year", "query": "calendar year", "note": "/ɪə/ ear sound, clear photo"},
            {"word": "dear", "query": "handwritten letter dear", "note": "/ɪə/ ear sound"},
            {"word": "clear", "query": "clear glass water", "note": "/ɪə/ ear sound, photo-able"},
        ],
    },
    ("L8.1", "ous"): {
        "drop": {"delicious"},
        "add": [
            {"word": "marvellous", "query": "spectacular fireworks", "note": "British spelling, ends -ous"},
        ],
    },
    ("L1.5", "i"): {
        "rename": {"ice cream": "icecream"},
        "query_override": {"icecream": "ice cream cone"},
    },
}


# Preserved instruction strings from the previous inventory (the specialist
# only authored words — instructions remain ours, tuned for child + grown-up).
INSTRUCTIONS = {
    "s": "Say the sound: s. Snake sound, hiss like a snake. ssss!",
    "a": "Say the sound: a. Open your mouth, short sound. a-a-a!",
    "t": "Say the sound: t. Tongue behind teeth, short puff. t-t-t!",
    "p": "Say the sound: p. Pop your lips. p-p-p!",
    "i": "Say the sound: i. Short and quick. i-i-i!",
    "n": "Say the sound: n. Tongue at the top, hum. nnnn!",
    "m": "Say the sound: m. Lips together, hum. mmmm!",
    "d": "Say the sound: d. Tongue behind teeth, voiced. d-d-d!",
    "g": "Say the sound: g. Back of the throat. g-g-g!",
    "o": "Say the sound: o. Round mouth, short. o-o-o!",
    "c": "Say the sound: c. Back of the throat, like a cough. c-c-c!",
    "k": "Say the sound: k. Same sound as c — back of the throat. k-k-k!",
    "ck": "Say the sound: ck. Two letters, one sound — same as c and k. ck-ck-ck!",
    "e": "Say the sound: e. Short and open. e-e-e!",
    "u": "Say the sound: u. Open mouth, short. u-u-u!",
    "r": "Say the sound: r. Tongue back, voiced. rrrr!",
    "h": "Say the sound: h. A puff of air. h-h-h!",
    "b": "Say the sound: b. Lips together, then pop. b-b-b!",
    "f": "Say the sound: f. Top teeth on bottom lip. ffff!",
    "l": "Say the sound: l. Tongue at the top, voiced. llll!",
    "ff": "Say the sound: ff. Double letter — two f's make one sound. ff!",
    "ll": "Say the sound: ll. Double letter — two l's make one sound. ll!",
    "ss": "Say the sound: ss. Double letter — two s's, same as a single s. ssss!",
    "zz": "Say the sound: zz. Double letter — two z's. zzzz!",
    "j": "Say the sound: j. Voiced, like at the start of jam. j-j-j!",
    "v": "Say the sound: v. Top teeth on bottom lip, voiced — like f but louder. vvv!",
    "w": "Say the sound: w. Round your lips. wwww!",
    "x": "Say the sound: x. Two sounds blended — ks. x-x-x!",
    "y": "Say the sound: y. Tongue up, voiced. y-y-y!",
    "z": "Say the sound: z. Same as ss but louder. zzz!",
    "sh": "Say the sound: sh. Lips pushed forward, quiet sound. shhhh!",
    "nk": "Say the sound: nk. Back of the throat, two sounds blended. nk!",
    "ch": "Say the sound: ch. Like a train chugging. ch-ch-ch!",
    "th": "Say the sound: th. Tongue between teeth, then breathe. th!",
    "ng": "Say the sound: ng. Back of the throat, hum. ng!",
    "qu": "Say the sound: qu. Two letters that always go together — k+w. qu!",
    "ay": "Say the sound: ay. Long a — like in 'day'. ay!",
    "ee": "Say the sound: ee. Long e — like in 'see'. ee!",
    "igh": "Say the sound: igh. Three letters, one sound — long i. igh!",
    "oo": "Say the sound: oo.",  # overridden per book below
    "ar": "Say the sound: ar. Open your mouth wide. arrr!",
    "or": "Say the sound: or. Round your lips. orrr!",
    "air": "Say the sound: air. Three letters, one sound. air!",
    "ir": "Say the sound: ir. Like 'er' — same sound, different spelling. ir!",
    "ou": "Say the sound: ou. Like 'ow' in 'cow'. ou!",
    "oy": "Say the sound: oy. Round your lips, then smile. oy!",
    "a-e": "Say the sound: a-e. Split digraph — silent e at the end makes the a say its name. a-e!",
    "i-e": "Say the sound: i-e. Split digraph — silent e makes the i say its name. i-e!",
    "o-e": "Say the sound: o-e. Split digraph — silent e makes the o say its name. o-e!",
    "u-e": "Say the sound: u-e. Split digraph — silent e makes the u say its name. u-e!",
    "ea": "Say the sound: ea. Long e — like in 'sea'. ea!",
    "ie": "Say the sound: ie. Long i — like in 'pie'. ie!",
    "oi": "Say the sound: oi. Like 'oy' — same sound, different spelling. oi!",
    "aw": "Say the sound: aw. Like 'or' — same sound, different spelling. aw!",
    "ai": "Say the sound: ai. Long a — like in 'rain'. ai!",
    "oa": "Say the sound: oa. Long o — like in 'boat'. oa!",
    "ur": "Say the sound: ur. Same as ir and er — three ways to spell the same sound. ur!",
    "er": "Say the sound: er. Same as ir and ur. er!",
    "are": "Say the sound: are. Like 'air' — same sound, different spelling. are!",
    "ew": "Say the sound: ew. Like 'oo' in 'zoo'. ew!",
    "ue": "Say the sound: ue. Like 'oo' in 'zoo'. ue!",
    "wr": "Say the sound: wr. The w is silent — only the r is heard. wr!",
    "kn": "Say the sound: kn. The k is silent — only the n is heard. kn!",
    "ge": "Say the sound: ge. Like j — same sound, different spelling. ge!",
    "dge": "Say the sound: dge. Three letters, one sound — like j. dge!",
    "mb": "Say the sound: mb. The b is silent — only the m is heard. mb!",
    "gn": "Say the sound: gn. The g is silent — only the n is heard. gn!",
    "ph": "Say the sound: ph. Two letters, one sound — like f. ph!",
    "wh": "Say the sound: wh. The h is silent — only the w is heard. wh!",
    "ire": "Say the sound: ire. Three letters, one sound — long i + er. ire!",
    "ore": "Say the sound: ore. Like 'or' — same sound, different spelling. ore!",
    "ear": "Say the sound: ear. Three letters, one sound — like 'eer'. ear!",
    "oor": "Say the sound: oor. Like 'or' — same sound, different spelling. oor!",
    "ure": "Say the sound: ure. Three letters, one sound. ure!",
    "tion": "Say the sound: tion. Four letters, one sound — like 'shun'. tion!",
    "ous": "Say the sound: ous. Ending found on adjectives — 'full of'. ous!",
    "cious": "Say the sound: cious. Spelt c-i-o-u-s, sounds like 'shus'. cious!",
    "tious": "Say the sound: tious. Spelt t-i-o-u-s, sounds like 'shus'. tious!",
    "able": "Say the sound: able. Ending — means 'can be'. able!",
    "ible": "Say the sound: ible. Ending — also means 'can be'. ible!",
}

# Per-book instruction overrides (oo has two pronunciations across L4.5/L4.6)
INSTRUCTION_OVERRIDES = {
    ("L4.5", "oo"): "Say the sound: oo. Long oo — like in 'zoo'. oooo!",
    ("L4.6", "oo"): "Say the sound: oo. Short oo — like in 'look'. oo!",
    ("L6.4", "ow"): "Say the sound: ow. Like 'ou' in 'out' — same sound. ow!",
    ("L4.4", "ow"): "Say the sound: ow. Long o — like in 'blow'. ow!",
}


# Comparison sounds (L5+) — preserve from prior inventory
COMPARISON = {
    "L5.1": ["ay", "ai"],
    "L5.2": ["igh", "ie"],
    "L5.3": ["ow", "oa"],
    "L5.4": ["oo", "ue", "ew"],
    "L5.5": ["ee"],
    "L5.6": ["igh", "i-e"],
    "L5.7": ["oy"],
    "L5.8": ["or"],
    "L5.9": ["ay", "a-e"],
    "L5.10": ["ow", "o-e"],
    "L6.1": ["ir", "er"],
    "L6.2": ["ir", "ur"],
    "L6.3": ["air"],
    "L6.4": ["ou"],
    "L6.5": ["oo", "u-e"],
    "L6.6": ["r", "n"],
    "L6.7": ["j"],
    "L6.8": ["m", "n"],
    "L6.9": ["f", "w"],
    "L7.1": ["i-e", "igh"],
    "L7.2": ["or", "aw", "oor"],
    "L7.3": ["ee", "ea"],
    "L7.4": ["or", "ore"],
    "L7.5": ["oo"],
}


def _format_word(w: dict) -> str:
    word = w["word"]
    query = (w.get("query") or "").strip()
    if not query or query.lower() == word.lower():
        return f'"{word}"'
    # Escape quotes in query
    safe_query = query.replace('"', "'")
    return f'{{"word": "{word}", "query": "{safe_query}"}}'


def main():
    raw = json.loads(CONSULT.read_text(encoding="utf-8"))
    books = raw["books"]

    # Apply fixes
    for b in books:
        bid = b["id"]
        for s in b["sounds"]:
            g = s["grapheme"]
            fix = FIXES.get((bid, g))
            if not fix:
                continue
            if "drop" in fix:
                s["words"] = [w for w in s["words"] if w["word"] not in fix["drop"]]
            if "add" in fix:
                s["words"].extend(fix["add"])
            if "rename" in fix:
                for w in s["words"]:
                    if w["word"] in fix["rename"]:
                        w["word"] = fix["rename"][w["word"]]
            if "query_override" in fix:
                for w in s["words"]:
                    if w["word"] in fix["query_override"]:
                        w["query"] = fix["query_override"][w["word"]]

    # Build inventory.py text
    lines = []
    lines.append('"""')
    lines.append("Sound Books — full inventory (73 books across L1-L8).")
    lines.append("")
    lines.append("Word lists are SOUND-SPOTLIGHT (image-able, initial-sound matching)")
    lines.append("authored by senior literacy consultant — NOT decodable drills.")
    lines.append("See output/sound_books/_word_consult_transcript.md for full brief.")
    lines.append("")
    lines.append("Each entry shape:")
    lines.append("  level / sub_level / book_number   — IDs")
    lines.append("  title                              — display title")
    lines.append("  sounds                             — list of {grapheme, instruction?, words}")
    lines.append("  comparison_sounds                  — list of alternative spellings (L5+)")
    lines.append('"""')
    lines.append("")
    lines.append("LEVEL_COLOURS = {")
    for lv, c in [(1, "#E84B8A"), (2, "#F97066"), (3, "#F59E0B"), (4, "#22C55E"),
                  (5, "#3B82F6"), (6, "#6366F1"), (7, "#8B5CF6"), (8, "#14B8A6")]:
        lines.append(f'    {lv}: "{c}",')
    lines.append("}")
    lines.append("")
    lines.append("LEVEL_NAMES = {")
    for lv, n in [(1, "Ditties"), (2, "First Sounds"), (3, "Special Friends"),
                  (4, "Longer Sounds"), (5, "New Spellings"), (6, "Building Fluency"),
                  (7, "Reading Together"), (8, "Reading Champion")]:
        lines.append(f'    {lv}: "{n}",')
    lines.append("}")
    lines.append("")
    lines.append("# QUERY_OVERRIDES kept for backwards compat — most queries now live")
    lines.append("# inline in each word dict via {'word': ..., 'query': ...}.")
    lines.append("QUERY_OVERRIDES = {}")
    lines.append("")
    lines.append("def _b(level, sub, num, title, sounds, comparison=None):")
    lines.append("    return {")
    lines.append('        "level": level, "sub_level": sub, "book_number": num,')
    lines.append('        "title": title, "sounds": sounds,')
    lines.append('        "comparison_sounds": comparison or [],')
    lines.append("    }")
    lines.append("")
    lines.append("def _s(grapheme, instruction, words):")
    lines.append('    return {"grapheme": grapheme, "instruction": instruction, "words": words}')
    lines.append("")
    lines.append("")
    lines.append("INVENTORY = [")

    for b in books:
        bid = b["id"]
        m = re.fullmatch(r"L(\d+)\.(\d+)", bid)
        if not m:
            raise SystemExit(f"Bad book id: {bid}")
        lv, sub = int(m.group(1)), int(m.group(2))
        title = b["title"]
        comp = COMPARISON.get(bid)
        # Build sounds
        sounds_src = []
        for s in b["sounds"]:
            g = s["grapheme"]
            instr = INSTRUCTION_OVERRIDES.get((bid, g)) or INSTRUCTIONS.get(g) or "Say the sound. Can you think of a word with this sound?"
            words_src = []
            for w in s["words"]:
                words_src.append("        " + _format_word(w) + ",")
            sounds_src.append(
                f'    _s("{g}", "{instr}", [\n' + "\n".join(words_src) + "\n    ])"
            )
        sounds_block = ",\n".join(sounds_src)
        title_escaped = title.replace('"', '\\"')
        if comp:
            comp_str = ", comparison=[" + ", ".join(f'"{c}"' for c in comp) + "]"
        else:
            comp_str = ""
        lines.append(f'    _b({lv}, {sub}, 1, "{title_escaped}", [')
        for line in sounds_block.split("\n"):
            lines.append("    " + line)
        lines.append(f"    ]{comp_str}),")

    lines.append("]")
    lines.append("")
    lines.append('if __name__ == "__main__":')
    lines.append('    print(f"Total Sound Books: {len(INVENTORY)}")')
    lines.append("    by_level = {}")
    lines.append("    for b in INVENTORY:")
    lines.append('        by_level.setdefault(b["level"], []).append(b["title"])')
    lines.append("    for lv in sorted(by_level):")
    lines.append('        print(f"  L{lv}: {len(by_level[lv])} books")')
    lines.append("")

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"[migrate] wrote {OUT} ({len(lines)} lines)")
    print(f"[migrate] books: {len(books)}")


if __name__ == "__main__":
    main()
