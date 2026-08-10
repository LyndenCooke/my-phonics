"""
v2 template helpers — derive new data fields the book_v2.html template needs.

Functions here turn existing book_data into:
  - sound_buttoned_words: phoneme-split words for the sound-button word lists
  - formation_drills: per-grapheme rhyme + stroke count for the formation page
  - ordering_items: shuffled story-image cards for the Tell-the-Story page
  - phase_label: "Letters and Sounds Phase X" string for cover + back cover
  - dictation_sentence: short sentence from the story for the Spelling page
"""

import random
from pathlib import Path


# ─── Phoneme splitting ───────────────────────────────────────────
# Greedy longest-match. We sort cumulative graphemes by length DESC so
# digraphs / trigraphs win over single letters. Falls back to single
# letters for anything unknown (which is fine — single letters are also
# valid phonemes).

# Known exceptions where greedy longest-match produces the wrong split.
# Manually-curated minimum so we don't ship pedagogically wrong notation.
SPLIT_EXCEPTIONS = {
    # Unstressed initial 'a' (schwa) followed by 'r' — the 'ar' is NOT the
    # /ar/ digraph here. Splitter should treat the 'a' as a single phoneme.
    "around": ["a", "r", "ou", "n", "d"],
    "across": ["a", "c", "r", "o", "ss"],
    "again": ["a", "g", "ai", "n"],
    "away": ["a", "w", "ay"],
    "about": ["a", "b", "o", "u", "t"],
    "above": ["a", "b", "o", "v", "e"],
}

# Doubled consonants — single phoneme.  The pedagogical rule is: a doubled
# consonant tells the child the previous vowel is SHORT (closed syllable).
# When the greedy splitter sees a doubled-consonant pattern, it should
# treat both letters as one grapheme, NOT consume the first as part of a
# vowel+consonant digraph (er, or, ar, ir, ur).
DOUBLED_CONSONANTS = frozenset({
    "bb", "cc", "dd", "ff", "gg", "ll", "mm", "nn", "pp", "rr", "ss", "tt", "zz",
})


def split_into_phonemes(word: str, cumulative_graphemes: list) -> list:
    """Split a word into phoneme units using greedy longest-match.

    >>> split_into_phonemes("fish", ["sh","f","i"])
    ['f', 'i', 'sh']
    >>> split_into_phonemes("ship", ["sh","i","p"])
    ['sh', 'i', 'p']
    """
    lower = word.lower()
    # Hand-curated exceptions where greedy matching is pedagogically wrong
    if lower in SPLIT_EXCEPTIONS:
        # Filter to phonemes the level actually teaches (degrade gracefully
        # if a phoneme isn't in the cumulative set yet)
        return SPLIT_EXCEPTIONS[lower]

    # Sort by length desc so "sh" matches before "s"
    sorted_g = sorted(set(cumulative_graphemes), key=len, reverse=True)
    # Drop split digraphs (a-e etc.) — they don't sit contiguously in the
    # word so the greedy matcher would mishandle them. Render letter-wise.
    sorted_g = [g for g in sorted_g if "-" not in g]

    out = []
    i = 0
    # Reserve trailing units as ONE phoneme button (same rules as
    # _compute_marks so buttons and marks never disagree):
    #   -ed past tense (turned, jumped) — len>=5 skips shed/sled, and
    #   magic-e stems (liked, named) keep their V-C-e split instead;
    #   -le final stable syllable after a consonant (purple, little) —
    #   defers to longer taught graphemes ending in le (able, ible).
    suffix = None
    if (
        len(lower) >= 5
        and lower.endswith("ed")
        and lower[-3] not in "aeiou"  # avoid words like "need", "feed"
        and not (lower[-4] in "aeiou" and (lower[-4], "e") in SPLIT_DIGRAPHS)
    ):
        suffix = "ed"
    elif (
        len(lower) >= 4
        and lower.endswith("le")
        and lower[-3] not in "aeiou"
        and not any(g.endswith("le") and lower.endswith(g) for g in sorted_g)
    ):
        suffix = "le"
    end = len(lower) - 2 if suffix else len(lower)

    available = set(sorted_g)
    while i < end:
        matched = False
        for g in sorted_g:
            if g == "ed":
                continue
            if lower[i:i + len(g)] != g:
                continue
            # Doubled-consonant lookahead.  e.g. matching "er" in "terrible"
            # at i=1 would consume positions 1-2 ('e','r') and leave the 'r'
            # at position 3 stranded — splitting the doubled "rr" that the
            # child is taught to read as one sound.  Refuse this match if
            # the last char of g is also the next char in the word AND that
            # pair is a recognised doubled-consonant grapheme.
            if len(g) >= 2:
                end_pos = i + len(g)
                if (
                    end_pos < end
                    and g[-1] == lower[end_pos]
                    and (g[-1] + g[-1]) in DOUBLED_CONSONANTS
                    and (g[-1] + g[-1]) in available
                ):
                    continue
            out.append(g)
            i += len(g)
            matched = True
            break
        if not matched:
            out.append(lower[i])
            i += 1

    if suffix:
        out.append(suffix)

    # Word-final -se / -ve = ONE grapheme unit (purse = p/ur/se, house =
    # h/ou/se, give-style ve).  Lynden's ruling 2026-07-12: the final e is
    # silent spelling convention, not a phoneme — a trailing s-dot + e-dot
    # pair claims two sounds that aren't there.  Guard: only merge when the
    # preceding vowel is already consumed by a multi-char grapheme (ur, ou,
    # ee...) or the char before s/v is a consonant — a LONE vowel before
    # the s/v (wave, five, home...) means magic-e, which keeps its V-C-e
    # treatment and must never collapse into -ve.
    if (
        len(out) >= 3
        and out[-1] == "e"
        and out[-2] in ("s", "v")
        and (len(out[-3]) >= 2 or out[-3] not in "aeiou")
    ):
        out[-2:] = [out[-2] + "e"]
    return out


def build_sound_buttoned_words(words: list, cumulative_graphemes: list) -> list:
    """Turn a list of word strings into [{word, phonemes, marks}] dicts.

    `marks` is the renderable instruction set used by the SVG sound-button
    renderer.  Each entry is one of:
        {"type": "dot", "indices": [i]}            single-phoneme letter
        {"type": "under_arc", "indices": [i, j]}   digraph or trigraph
        {"type": "over_arc", "indices": [i, j]}    split digraph (a-e etc.)
    Indices are 0-based positions of the affected characters in the
    original word string.  The renderer uses these to position dots and
    arcs against per-character widths.
    """
    out = []
    for w in words:
        if not w:
            continue
        marks = _compute_marks(w, cumulative_graphemes)
        # Keep `phonemes` for legacy templates; the new template uses `marks`.
        phonemes = split_into_phonemes(w, cumulative_graphemes)
        out.append({"word": w, "phonemes": phonemes, "marks": marks})
    return out


# Split-digraph patterns that the marks computer detects.  Each is a
# (vowel, terminal) tuple — vowel-consonant-e where the consonant in the
# middle keeps its own dot beneath the over-arc.
SPLIT_DIGRAPHS = [
    ("a", "e"),  # cake, name, lake
    ("i", "e"),  # bike, like, time
    ("o", "e"),  # bone, hope, smoke
    ("u", "e"),  # tune, cute, flute
    ("e", "e"),  # eve, theme, complete
]


def _compute_marks(word: str, cumulative_graphemes: list) -> list:
    """Return the list of mark instructions for one word.

    Walks the word, greedy-matching graphemes (longest first).  When a
    multi-char grapheme is matched it emits an under-arc spanning those
    indices; single letters emit a dot.  After the linear pass we scan
    for split-digraph patterns (CVC-e where the e is silent and the
    vowel is in the taught set) and rewrite the matching dots into an
    over-arc spanning the vowel and silent-e (the consonant in between
    keeps its dot).
    """
    sorted_g = sorted(set(cumulative_graphemes), key=len, reverse=True)
    sorted_g = [g for g in sorted_g if "-" not in g]
    available = set(sorted_g)

    marks = []
    lower = word.lower()
    i = 0
    used_indices = set()

    # Reserve trailing morpheme/syllable units so they render as ONE sound:
    #   -ed past tense (turned, jumped) — /d/ /t/ /id/
    #   -le final stable syllable after a consonant (purple, little, apple)
    # Guards: -ed skips short words (shed, sled) and magic-e stems (liked,
    # named — the V-C-e pattern wins); -le defers to longer taught graphemes
    # that end in le (able, ible) so 'table' still matches 'able' whole.
    suffix = None
    if (len(lower) >= 5 and lower.endswith("ed")
            and lower[-3] not in "aeiou"
            and not (lower[-4] in "aeiou" and (lower[-4], "e") in SPLIT_DIGRAPHS)):
        suffix = "ed"
    elif (len(lower) >= 4 and lower.endswith("le")
            and lower[-3] not in "aeiou"
            and not any(g.endswith("le") and lower.endswith(g) for g in sorted_g)):
        suffix = "le"
    end = len(lower) - 2 if suffix else len(lower)

    while i < end:
        matched = False
        for g in sorted_g:
            if len(g) <= 1 or lower[i:i + len(g)] != g:
                continue
            # Doubled-consonant lookahead — same rule as split_into_phonemes.
            # Refuse a multi-char match whose last letter would orphan the
            # next letter of a doubled-consonant grapheme.
            end_pos = i + len(g)
            if (
                end_pos < end
                and g[-1] == lower[end_pos]
                and (g[-1] + g[-1]) in DOUBLED_CONSONANTS
                and (g[-1] + g[-1]) in available
            ):
                continue
            indices = list(range(i, i + len(g)))
            marks.append({"type": "under_arc", "indices": indices})
            used_indices.update(indices)
            i += len(g)
            matched = True
            break
        if not matched:
            marks.append({"type": "dot", "indices": [i]})
            used_indices.add(i)
            i += 1

    if suffix:
        marks.append({"type": "under_arc", "indices": [len(lower) - 2, len(lower) - 1]})

    # Detect split digraph: a single-vowel + single-consonant + final 'e'
    # where the vowel-e pair is in our split-digraph set, AND the level
    # has at least one split digraph in its taught set (so we don't apply
    # the rule to L1/L2 words like "bike" before split digraphs are taught).
    #
    # IMPORTANT — only apply the over-arc when the V…e span is NOT already
    # covered by a single recognised multi-char grapheme (e.g. "ore" in
    # "shore", "ure" in "pure", "able" in "table", "ible" in "possible").
    # Those are real graphemes that should keep their under-arc — they are
    # not magic-e split digraphs and the over-arc would be pedagogically wrong.
    has_split_digraphs = any("-" in g for g in cumulative_graphemes)
    if has_split_digraphs and not suffix and len(lower) >= 3 and lower[-1] == "e":
        # Find the LAST vowel before the final 'e' that fits the pattern
        for v_idx in range(len(lower) - 2, -1, -1):
            v = lower[v_idx]
            if (v, "e") in SPLIT_DIGRAPHS:
                # A vowel that's already INSIDE a matched multi-char grapheme
                # (the 'u' of 'ur' in "purple"/"purse") is spoken for — it is
                # NOT a magic-e vowel. Overriding it deleted the correct 'ur'
                # underline and drew a bogus over-arc across half the word.
                in_multi = any(
                    m["type"] == "under_arc" and v_idx in m["indices"]
                    for m in marks
                )
                if in_multi:
                    continue
                # Magic-e needs EXACTLY ONE consonant in the middle (cake,
                # bike, home). Longer spans (purse: u-rs-e, purple: u-rpl-e)
                # are never split digraphs.
                mid = lower[v_idx + 1:-1]
                if len(mid) == 1 and mid not in "aeiou":
                    e_idx = len(lower) - 1
                    # If a single under_arc grapheme already spans [v_idx, e_idx]
                    # (e.g. "ore", "ure", "ire", "ear", "are", "able", "ible",
                    # "ture", etc.), leave it alone — that under-arc is the
                    # correct pedagogical mark for the suffix grapheme.
                    already_covered = any(
                        m["type"] == "under_arc"
                        and v_idx in m["indices"]
                        and e_idx in m["indices"]
                        for m in marks
                    )
                    if already_covered:
                        break
                    # Rewrite marks: drop dots/arcs touching v_idx or e_idx,
                    # keep dots for the consonant(s) in between, then add
                    # an over-arc spanning [v_idx, e_idx].
                    new_marks = [m for m in marks if v_idx not in m["indices"] and e_idx not in m["indices"]]
                    new_marks.append({"type": "over_arc", "indices": list(range(v_idx, e_idx + 1))})
                    marks = sorted(new_marks, key=lambda m: m["indices"][0])
                    break

    # Word-final -se / -ve = ONE under-arc unit (purse = p/ur/se), mirroring
    # split_into_phonemes.  Runs AFTER magic-e detection: for wave/five the
    # final e is already inside an over-arc so the two-trailing-dots
    # precondition fails and magic-e keeps the word.  Only merge when the
    # s/v and e are both still lone dots AND the char before the s/v is a
    # consonant or a vowel already consumed by a multi-char grapheme.
    if len(lower) >= 4 and lower[-1] == "e" and lower[-2] in ("s", "v"):
        s_idx, e_idx = len(lower) - 2, len(lower) - 1
        s_dot = next((m for m in marks if m["type"] == "dot" and m["indices"] == [s_idx]), None)
        e_dot = next((m for m in marks if m["type"] == "dot" and m["indices"] == [e_idx]), None)
        prev_ok = lower[-3] not in "aeiou" or any(
            m["type"] == "under_arc" and (len(lower) - 3) in m["indices"]
            for m in marks
        )
        if s_dot and e_dot and prev_ok:
            marks = [m for m in marks if m is not s_dot and m is not e_dot]
            marks.append({"type": "under_arc", "indices": [s_idx, e_idx]})
            marks = sorted(marks, key=lambda m: m["indices"][0])
    return marks


# ─── Formation drills ────────────────────────────────────────────
# Brief verbal patter ("rhymes") for forming each grapheme. These are the
# kind of phrases a Reception teacher says aloud while modelling on the
# whiteboard. Not exhaustive — fallback is a generic stroke count.

FORMATION_RHYMES = {
    # Original purely-descriptive formation cues — no character / object
    # metaphors borrowed from RWI, Jolly Phonics, or Letterland.  Each
    # cue describes the pencil path geometrically.  Stroke counts reflect
    # how many separate pen-lifts the formation requires.
    "s": ("Start at the top: curve back, then forward", 1),
    "a": ("Round to the left, close the loop, then a tail", 2),
    "t": ("Down a tall line, then a short cross", 2),
    "p": ("Down below the line, back up, then a circle on the right", 2),
    "i": ("A short line down, then a dot on top", 2),
    "n": ("Down a line, back up, then over and down", 1),
    "m": ("Down a line, back up, over and down, back up, over and down", 1),
    "d": ("Round to the left, up high, then back down", 2),
    "g": ("Round to the left, then a tail that hooks below", 2),
    "o": ("One smooth circle, starting at the top", 1),
    "c": ("Start at the top: a round curve that opens to the right", 1),
    "k": ("Down a tall line, in to the middle, out to the foot", 3),
    "e": ("A short line across, then curve around to close it", 1),
    "u": ("Down, curve along the bottom, up, then a small line down", 2),
    "r": ("Down a line, back up, then a small hook to the right", 1),
    "h": ("Down a tall line, back up, then over and down", 1),
    "b": ("Down a tall line, back up a little, then a circle on the right", 2),
    "f": ("Curve from the top, down a line, then a small cross", 2),
    "l": ("One straight line, top to bottom", 1),
    "j": ("Short line down, hook below the line, then a dot on top", 2),
    "v": ("Slope down to the point, then slope back up", 1),
    "w": ("Slope down, slope up, slope down, slope up", 1),
    "x": ("One slope, then cross it with another", 2),
    "y": ("Slope down to the middle, then a long tail below the line", 2),
    "z": ("Across the top, slope down, then across the bottom", 1),
    # Digraphs — combined formation cue
    "sh": ("Shape the s, then the h: 'sh, hush!'", 2),
    "ch": ("c first, then h: 'ch, choo-choo!'", 2),
    "th": ("t first, then h: 'th, thumb!'", 2),
    "ng": ("n first, then g: 'ng, sing!'", 2),
    "nk": ("n first, then k: 'nk, sink!'", 2),
    "ck": ("c first, then k: short and sharp", 2),
    "qu": ("q first, then u: they always go together", 2),
    "ff": ("f then f: double for fluff", 2),
    "ll": ("l then l: double for ball", 2),
    "ss": ("s then s: double for hiss", 2),
    "zz": ("z then z: double for buzz", 2),
    # Long vowel digraphs
    "ay": ("a says /ay/ at the end", 2),
    "ee": ("Two e's: 'ee, see!'", 2),
    "igh": ("i, g, h: three letters, one sound", 3),
    "oo": ("Two o's: 'oo, look!' or 'oo, moon!'", 2),
    "ow": ("o then w: 'ow, snow!' or 'ow, cow!'", 2),
    "ar": ("a then r: 'ar, car!'", 2),
    "or": ("o then r: 'or, fork!'", 2),
    "air": ("a, i, r: 'air, fair!'", 3),
    "ir": ("i then r: 'ir, bird!'", 2),
    "ou": ("o then u: 'ou, ouch!'", 2),
    "oy": ("o then y: 'oy, boy!'", 2),
    # Set 3 / split digraphs
    "ea": ("e then a: 'ea, sea!'", 2),
    "ie": ("i then e: 'ie, pie!'", 2),
    "oa": ("o then a: 'oa, boat!'", 2),
    "ai": ("a then i: 'ai, rain!'", 2),
    "oi": ("o then i: 'oi, coin!'", 2),
    "aw": ("a then w: 'aw, claw!'", 2),
    "a-e": ("a, consonant, e: magic e makes a say its name", 3),
    "i-e": ("i, consonant, e: magic e makes i say its name", 3),
    "o-e": ("o, consonant, e: magic e makes o say its name", 3),
    "u-e": ("u, consonant, e: magic e makes u say its name", 3),
    # Level 4+
    "ur": ("u then r: 'ur, turn!'", 2),
    "er": ("e then r: 'er, her!'", 2),
    "ew": ("e then w: 'ew, new!'", 2),
    "ue": ("u then e: 'ue, blue!'", 2),
    "are": ("a, r, e: 'are, share!'", 3),
    # Level 5
    "ore": ("o, r, e: 'ore, more!'", 3),
    "oor": ("o, o, r: 'oor, door!'", 3),
    "ire": ("i, r, e: 'ire, fire!'", 3),
    "ear": ("e, a, r: 'ear, hear!'", 3),
    "ure": ("u, r, e: 'ure, sure!'", 3),
    "tion": ("t, i, o, n: says /shun/", 4),
    # Level 6 — suffixes
    "ous": ("o, u, s: says /us/", 3),
    "able": ("a, b, l, e: says /ay-bul/", 4),
    "ible": ("i, b, l, e: says /ih-bul/", 4),
    "cious": ("c, i, o, u, s: says /shus/", 5),
    "tious": ("t, i, o, u, s: says /shus/", 5),
}


def build_formation_drills(focus_graphemes: list) -> list:
    """Return [{grapheme, rhyme, strokes}] for each focus grapheme."""
    out = []
    for g in focus_graphemes:
        rhyme, strokes = FORMATION_RHYMES.get(
            g.lower(),
            (f"Form each letter of '{g}' carefully", len(g) if "-" not in g else 3),
        )
        out.append({"grapheme": g, "rhyme": rhyme, "strokes": strokes})
    return out


# ─── Phase label ─────────────────────────────────────────────────

# 8-level ledger mapping (was the stale pre-realignment 6-level map, which
# stamped e.g. "Phase 5" on a new-L3 Special Friends book — caught 2026-07-12).
PHASE_LABELS = {
    1: "Letters and Sounds Phase 2",
    2: "Letters and Sounds Phase 2",
    3: "Letters and Sounds Phase 3-4",
    4: "Letters and Sounds Phase 3",
    5: "Letters and Sounds Phase 5",
    6: "Letters and Sounds Phase 5",
    7: "Letters and Sounds Phase 5",
    8: "Letters and Sounds Phase 6",
}


def get_phase_label(level: int) -> str:
    return PHASE_LABELS.get(level, f"Letters and Sounds Phase {level + 1}")


# ─── Story ordering ──────────────────────────────────────────────

def build_ordering_items(story_pages: list, count: int = 4, seed: int = 42) -> list:
    """Pick `count` evenly-spaced story pages, shuffle them, return
    [{image, original_index}]. The number-box on each card is blank for
    the child to fill in — we don't reveal the correct order on the page.
    """
    n = len(story_pages)
    if n == 0:
        return [{"image": None, "original_index": i} for i in range(count)]

    # Pick `count` indices spread across the story
    if n <= count:
        indices = list(range(n))
    else:
        step = n / count
        indices = [int(i * step) for i in range(count)]

    items = [
        {"image": story_pages[i].get("image"), "original_index": i}
        for i in indices
    ]
    rng = random.Random(seed)
    rng.shuffle(items)
    return items


# ─── Special-friend match (Tell-the-Story bottom half, 16pp books) ───
# Small decodable word banks for the Level 3 "special friend" digraphs.
# Every word uses only its focus digraph plus earlier single-letter sounds,
# so it stays decodable on the Special Friends page (no untaught graphemes).
SPECIAL_FRIEND_BANK = {
    "sh": ["fish", "shop", "ship", "wish", "shed", "cash"],
    "ch": ["chip", "chop", "rich", "chin", "chat", "much"],
    "th": ["that", "this", "with", "moth", "thin", "bath"],
    "ng": ["ring", "song", "king", "bang", "long", "wing"],
    "nk": ["tank", "pink", "sink", "bank", "wink", "honk"],
    "ck": ["sock", "duck", "kick", "rock", "back", "neck"],
    "qu": ["quiz", "quit", "quick", "quack"],
}


def build_special_friend_match(focus_graphemes: list, story_words: list = None,
                               per_friend: int = 3, seed: int = 11) -> dict | None:
    """Build a 'draw a line from each word to its special friend' activity for
    the bottom half of the Tell-the-Story page on 16pp digraph books.

    Returns {"friends": ["sh", "nk"], "words": [{"word", "friend"}, ...]} or
    None when fewer than two usable special friends are available (e.g. Level
    1/2 books whose focus is single letters), in which case the page simply
    shows the enlarged picture grid with no matching task below.
    """
    seen = []
    for g in (focus_graphemes or []):
        if len(g) >= 2 and g in SPECIAL_FRIEND_BANK and g not in seen:
            seen.append(g)
    if len(seen) < 2:
        return None

    friends = seen[:2]                       # two columns keeps 6 words tidy
    rng = random.Random(seed)
    story_set = {w.lower() for w in (story_words or [])}
    words = []
    for g in friends:
        bank = SPECIAL_FRIEND_BANK[g]
        preferred = [w for w in bank if w in story_set]      # reuse story words first
        rest = [w for w in bank if w not in story_set]
        rng.shuffle(rest)
        for w in (preferred + rest)[:per_friend]:
            words.append({"word": w, "friend": g})
    rng.shuffle(words)
    return {"friends": friends, "words": words}


# ─── Page count selection ────────────────────────────────────────

DEFAULT_PAGE_COUNT = {
    1: 16, 2: 16, 3: 16,   # old L1 books (now split L1-L3) — 16pp
    4: 20, 5: 20, 6: 20,   # old L2-L4 books — 20pp
    7: 20, 8: 20,          # slimmed 24→20 (2026-07-03): Word Workshop,
                           # Listen and Write, Read & Match and Sentence
                           # Stretch dropped; Writing Practice, Talk About
                           # It and Prefix Power kept.
}


def get_page_count(level: int, override: int = None) -> int:
    if override in (16, 20, 24):
        return override
    return DEFAULT_PAGE_COUNT.get(level, 20)


# ─── Dictation sentence ──────────────────────────────────────────

def build_match_to_picture(spotlight_pages: list, count: int = 3, seed: int = 7) -> list:
    """Pick `count` (word, photo) pairs from the spotlight data and return
    them as [{word, photo}], plus a shuffled picture order list so the
    matching activity isn't trivial.

    Returns:
        {
            "words":    [{"word": "fish", "photo": "data:..."}, ...],
            "pic_order": [2, 0, 1]   # which word's photo appears in slot i
        }
    """
    pairs = []
    for spot in spotlight_pages:
        for entry in spot.get("words", []):
            if entry.get("photo") and entry.get("word"):
                pairs.append({"word": entry["word"], "photo": entry["photo"]})
                if len(pairs) >= count:
                    break
        if len(pairs) >= count:
            break

    if len(pairs) < count:
        return {"words": pairs, "pic_order": list(range(len(pairs)))}

    # Shuffle picture order — but never leave any picture in its own slot
    rng = random.Random(seed)
    indices = list(range(count))
    for _ in range(20):
        rng.shuffle(indices)
        if all(i != idx for idx, i in enumerate(indices)):
            break
    return {"words": pairs[:count], "pic_order": indices}


def _initial_grapheme(word: str, cumulative_graphemes: list) -> str:
    """Return the initial *grapheme* of a word — picks the longest matching
    grapheme at position 0.  E.g. 'ship' -> 'sh', not 's'.
    """
    sorted_g = sorted(set(cumulative_graphemes), key=len, reverse=True)
    sorted_g = [g for g in sorted_g if "-" not in g]
    lower = word.lower()
    for g in sorted_g:
        if lower.startswith(g):
            return g
    return word[0].lower()


def build_initial_sounds(focus_graphemes: list, spotlight_pages: list,
                         cumulative_graphemes: list = None,
                         count: int = 3, seed: int = 11) -> list:
    """For L1: image + 2 sound options, child circles the initial *grapheme*.

    Returns [{photo, word, options: [grapheme_correct, grapheme_distractor]}].
    The correct option is the longest grapheme that matches the start of
    the word ('ship' -> 'sh' not 's'), so digraphs are taught correctly.
    Distractor is drawn from focus_graphemes excluding the correct one.
    """
    items = []
    cumulative = cumulative_graphemes or focus_graphemes
    rng = random.Random(seed)
    seen_words = set()

    for spot in spotlight_pages:
        for entry in spot.get("words", []):
            if not entry.get("photo") or not entry.get("word"):
                continue
            word = entry["word"]
            if word in seen_words:
                continue
            seen_words.add(word)
            correct = _initial_grapheme(word, cumulative)
            # Distractor: prefer a single-letter grapheme from the
            # cumulative set that matches the correct's "type" (single
            # vs multi).  This gives better variety than always-focus.
            simples = [g for g in cumulative
                       if len(g) == 1 and "-" not in g and g != correct]
            wrong_pool = simples or [g for g in focus_graphemes if g != correct]
            if not wrong_pool:
                wrong_pool = [g for g in ["t", "p", "n", "m", "s"] if g != correct]
            distractor = rng.choice(wrong_pool)
            opts = [correct, distractor]
            rng.shuffle(opts)
            items.append({
                "photo": entry["photo"],
                "word": word,
                "correct": correct,
                "options": opts,
            })
            if len(items) >= count:
                break
        if len(items) >= count:
            break
    return items


def build_guide_blend_example(sound_buttoned_words: list) -> dict:
    """Pick a short word from the book's own story-words and emit a
    blendable example for the Guide for Grown-Ups page.

    Returns:
        {"phonemes": ["sh","i","p"], "word": "ship", "phoneme_str": "/sh/-/i/-/p/"}
    """
    if not sound_buttoned_words:
        return None
    # Prefer a 3-phoneme word (CVC or CCV) since that's the cleanest
    # example for blending. Fall back to the first available.
    candidates = [w for w in sound_buttoned_words if 2 <= len(w.get("phonemes", [])) <= 4]
    if not candidates:
        candidates = sound_buttoned_words
    chosen = candidates[0]
    phonemes = chosen.get("phonemes", [])
    return {
        "phonemes": phonemes,
        "word": chosen["word"],
        "phoneme_str": " ".join(f"/{p}/" for p in phonemes),
    }


def pick_dictation_sentence(story_pages: list, max_words: int = 8) -> str:
    """Pick the shortest story sentence as the dictation prompt.

    Children at L2-L6 need a short, fully-decodable sentence to write from
    dictation. Story sentences are guaranteed decodable, so we just pick
    the shortest one.
    """
    if not story_pages:
        return None
    # Flatten any multi-sentence pages by splitting on '.'/'!'/'?'
    candidates = []
    for p in story_pages:
        text = p.get("text", "")
        for chunk in text.replace("!", ".").replace("?", ".").split("."):
            chunk = chunk.strip().strip('"').strip()
            if not chunk:
                continue
            wc = len(chunk.split())
            if 3 <= wc <= max_words:
                candidates.append((wc, chunk))
    if not candidates:
        return None
    candidates.sort(key=lambda x: x[0])
    return candidates[0][1] + "."


# ─── Shifty Sounds ───────────────────────────────────────────────
# The strand covering GPCs the main ladder doesn't teach directly
# (alternative spellings like ph/tch/dge, alternative pronunciations like
# y=/ee/).  A book at L4+ may display up to two in a small charcoal band
# under the sound tables, which pre-teaches them before the story.
# Data: data/shifty_sounds.json.  L1-L3 never show the band.

SHIFTY_COLOUR = "#475569"           # locked 2026-07-03 — outside the level rainbow
SHIFTY_MIN_LEVEL = 4                # L1-L3 stay clean
SHIFTY_MAX_PER_BOOK = 2

# (grapheme, sound) pairs that are in the data deck but NOT band-worthy:
# the main ladder's own teaching already covers them, so banding them would
# re-teach what the child knows.
SHIFTY_EXCLUDE = {
    ("th", "voiced /th/"),   # voiced/unvoiced th split isn't taught separately
    ("ow", "/ow/"),          # ladder L4 'ow' IS /ow/ (owl, down); card base is /oa/
}

_shifty_cache = None
_tricky_master_cache = None


def _load_shifty_data():
    global _shifty_cache
    if _shifty_cache is None:
        import json
        path = Path(__file__).resolve().parent.parent / "data" / "shifty_sounds.json"
        with open(path, encoding="utf-8") as f:
            _shifty_cache = json.load(f)
    return _shifty_cache


def _tricky_word_levels() -> dict:
    """lower-case tricky word -> level it is introduced at (master list)."""
    global _tricky_master_cache
    if _tricky_master_cache is None:
        import json
        path = Path(__file__).resolve().parent.parent / "data" / "tricky_words_by_level.json"
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        _tricky_master_cache = {}
        for lv in range(1, 9):
            for w in data.get(f"level_{lv}", {}).get("new_tricky_words", []):
                _tricky_master_cache.setdefault(w.lower(), lv)
    return _tricky_master_cache


def build_shifty_sounds(story_tokens: list, level: int,
                        cumulative_graphemes: list) -> list:
    """Detect up to SHIFTY_MAX_PER_BOOK Shifty Sounds present in this book.

    story_tokens: lower-cased words from the story text + story_words list.
    Returns [{"grapheme", "sound", "example"}, ...] ordered by confidence.

    Detection is deliberately conservative — this drives a printed teaching
    band, so a false positive is worse than a miss:
      - alternative SPELLINGS (ph, tch, eigh…) match when the letter string
        appears in a story word AND the grapheme isn't already taught in the
        main ladder at this level.  An exact hit on one of the card's own
        example words counts as higher confidence than a bare substring.
      - alternative PRONUNCIATIONS (y=/ee/, ea=/e/…) only match on an exact
        story-word hit in the card's examples — a letter string can't tell
        us how it is pronounced.
    """
    if level < SHIFTY_MIN_LEVEL:
        return []
    data = _load_shifty_data()
    tricky_lv = _tricky_word_levels()
    # A word already listed as a tricky word at or below this level is read on
    # sight — banding its hidden sound ("the" = voiced th, "he" = open e) is
    # noise on every book, not teaching.  Those graduations belong to the
    # tricky-to-decodable engine work, not the printed band.
    def _known_tricky(word):
        return tricky_lv.get(word.lower(), 99) <= level
    tokens = {t.lower().strip("'") for t in story_tokens if t}
    taught = set(cumulative_graphemes)
    candidates = []  # (confidence desc sort key, entry)

    # Letter strings that map to MORE than one sound across the spelling cards
    # ("ere" = /air/ there AND /ear/ here): a bare substring can't tell which,
    # so those cards only ever fire on an exact example-word hit.
    from collections import Counter
    _g_counts = Counter(c["grapheme"].lstrip("-") for c in data.get("new_spelling_cards", []))

    for card in data.get("new_spelling_cards", []):
        g = card["grapheme"].lstrip("-")
        if card.get("allowed_from_level", 99) > level or g in taught:
            continue
        if (g, card["sound"]) in SHIFTY_EXCLUDE:
            continue
        example_hits = [w for w in card.get("examples", [])
                        if w.lower() in tokens and not _known_tricky(w)]
        # Substring-only evidence is accepted only for unambiguous 3+ letter
        # graphemes (tch, dge, eigh): a 2-letter string inside a word proves
        # nothing ("ve" in "brave" is magic-e + v, not the ve ending), and an
        # ambiguous string ("ere") can't reveal its sound.
        substring_hits = [t for t in tokens if g in t and not _known_tricky(t)]
        if not example_hits and (
            len(g) < 3 or _g_counts[g] > 1 or not substring_hits
        ):
            continue
        confidence = 2 if example_hits else 1
        shown = example_hits[0] if example_hits else sorted(substring_hits)[0]
        candidates.append((
            (-confidence, card.get("allowed_from_level", 99), g),
            {"grapheme": card["grapheme"], "sound": card["sound"], "example": shown},
        ))

    for card in data.get("alt_pronunciation_cards", []):
        g = card["grapheme"]
        # First pronunciation is the base (main-ladder) sound — skip it.
        for pron in card.get("pronunciations", [])[1:]:
            if pron.get("allowed_from_level", 99) > level:
                continue
            if (g, pron["sound"]) in SHIFTY_EXCLUDE:
                continue
            hits = [w for w in pron.get("examples", [])
                    if w.lower() in tokens and not _known_tricky(w)]
            if not hits:
                continue
            candidates.append((
                (-3, pron.get("allowed_from_level", 99), g),
                {"grapheme": g, "sound": pron["sound"], "example": hits[0]},
            ))

    candidates.sort(key=lambda c: c[0])
    result, seen = [], set()
    for _, entry in candidates:
        dedupe_key = (entry["grapheme"], entry["sound"])
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        result.append(entry)
        if len(result) >= SHIFTY_MAX_PER_BOOK:
            break
    return result


# ─── Decodability engine (shared with scripts/audit_decodability.py) ────
# Moved here 2026-07-12 so the QA audit and the page-2 "Future Sounds"
# preview band use the exact same segmentation logic — one source of
# truth for "is this word decodable at this book's taught window".

def taught_graphemes(graphemes_data: dict, level: int, focus: list) -> list:
    """Prior levels in full + current level up to the furthest focus sound.

    Suffix units (ed, ing, er… from a level's "suffixes" list) count as
    taught from the START of their level — per the L7 morphology note, a
    word is decodable at L7+ when its root decodes and the suffix is
    taught.  Below that level, -ed words are NOT decodable (Lynden
    2026-07-13: "shouted" isn't decodable — ed says /id/)."""
    taught = []
    for lv in range(1, level):
        entry = graphemes_data.get(f"level_{lv}", {})
        taught.extend(entry.get("graphemes", []))
        taught.extend(s for s in entry.get("suffixes", []) if s not in taught)
    entry = graphemes_data.get(f"level_{level}", {})
    cur = entry.get("graphemes", [])
    last_idx = -1
    for g in focus:
        if g in cur:
            last_idx = max(last_idx, cur.index(g))
    taught.extend(cur[: last_idx + 1] if last_idx >= 0 else list(focus))
    taught.extend(s for s in entry.get("suffixes", []) if s not in taught)
    for g in focus:
        if g not in taught:
            taught.append(g)
    return taught


def all_known_units(graphemes_data: dict) -> set:
    """Every multi-letter contiguous grapheme in the whole scheme."""
    units = set()
    for lv in range(1, 9):
        for g in graphemes_data.get(f"level_{lv}", {}).get("graphemes", []):
            if len(g) >= 2 and "_" not in g and "-" not in g:
                units.add(g)
    return units


def can_decode(word: str, taught: list, known_units: set,
               forbid_single_e_at: int = -1) -> bool:
    """DP segmentation of word into taught graphemes (incl. split digraphs).

    A single-letter grapheme may NOT be used where an UNTAUGHT known unit
    starts.  `forbid_single_e_at`: optional index where a LONE 'e' match is
    disallowed — used by the -ed honesty check in missing_units to ask
    "can this word decode WITHOUT reading the past-tense e as its own
    phoneme?" (stared = st-are-d yes; shouted no).

    NOTE (2026-07-12): split digraphs are stored as e.g. "a-e" (hyphen) in
    graphemes_by_level.json, but this function's `splits` detection has
    always matched on underscore ("_"), which never appears in the data —
    so the dedicated split-digraph path below has been dead code all along
    (CVCe words like "bike"/"gate" only ever passed because b/i/k/e are all
    already-taught singles, not because this matched the split pattern).
    Fixing the separator to "-" was tried and reverted: it makes the DP
    falsely accept words like "river" as a false split match on "i_v_e"
    (mid-word, not a real magic-e), silently hiding a real violation. Left
    as "_" (i.e. splits inert) to preserve existing, audited behaviour
    across the whole fleet. A correct fix needs the split match to respect
    syllable/morpheme boundaries, not just the bare V-C-e letter pattern —
    flagged for a future pass, not attempted here.
    """
    taught_set = set(taught)
    singles = {g for g in taught_set if len(g) == 1}
    splits = [g for g in taught_set if "_" in g and len(g) == 3]
    contiguous = sorted((g for g in taught_set if "-" not in g), key=len, reverse=True)
    untaught_units = [u for u in known_units if u not in taught_set]
    n = len(word)
    ok = [False] * (n + 1)
    ok[n] = True
    for i in range(n - 1, -1, -1):
        blocked_single = any(word.startswith(u, i) for u in untaught_units)
        for g in contiguous:
            if len(g) == 1 and blocked_single:
                continue
            if len(g) == 1 and i == forbid_single_e_at and g == "e":
                continue
            if word.startswith(g, i) and ok[i + len(g)]:
                ok[i] = True
                break
        if not ok[i]:
            for g in splits:  # e.g. a-e matches "a<taught consonant>e"
                if (
                    i + 3 <= n
                    and word[i] == g[0]
                    and word[i + 2] == g[2]
                    and word[i + 1] in singles
                    and ok[i + 3]
                ):
                    ok[i] = True
                    break
    return ok[0]


def missing_units(word: str, taught: list, known_units: set) -> set:
    """Return the untaught letters/graphemes blocking `word`, or empty set
    if it already decodes.  A word that fails for a structural reason (not
    a bare untaught letter/unit) comes back as {word} — the whole word,
    which callers should treat as "not a clean single sound to preview"."""
    if can_decode(word, taught, known_units):
        # -ed honesty (Lynden 2026-07-13): "shouted" letter-decodes but the
        # ending says /id/ /t/ /d/ — an untaught sound until the ed suffix
        # lands (L7).  Flag ONLY when the word cannot decode without a bare
        # final e+d: "stared" passes once 'are' is taught (are+d), and
        # short true-/ed/ words (bed, shed, need) are protected by the
        # length guard and the DP itself.
        if len(word) >= 5 and word.endswith("ed") and "ed" not in set(taught):
            # magic-e stem + d (named = n+a-e+m+d, liked = l+i-e+k+d) is an
            # honest parse when the split digraph is taught — Lynden's marks
            # ruling already renders these as magic-e, never as an ed unit.
            # Vowel-before guard stops "shouted" fake-matching as u-e.
            import re as _re
            m = _re.match(r"^(.*)([aeiou])([bcdfgklmnpstvz])ed$", word)
            is_magic_e_stem = bool(
                m and f"{m.group(2)}-e" in set(taught)
                and (not m.group(1) or m.group(1)[-1] not in "aeiou")
                and (not m.group(1) or can_decode(m.group(1), taught, known_units))
            )
            if not is_magic_e_stem and not can_decode(
                    word, taught, known_units,
                    forbid_single_e_at=len(word) - 2):
                # r-family stems: "tired" is /t/ /ire/ /d/ (Lynden
                # 2026-07-19) — when the letters before the final d ARE a
                # roadmap unit (ire, ure, ear, are...), preview THAT unit,
                # not a bogus 'ed'.  The d is an ordinary taught letter.
                for u in sorted((x for x in known_units if x not in set(taught)),
                                key=len, reverse=True):
                    if word.endswith(u + "d"):
                        stem = word[: -len(u) - 1]
                        if not stem or can_decode(stem, taught, known_units):
                            return {u}
                return {"ed"}
        return set()
    taught_set = set(taught)
    taught_letters = {ch for g in taught_set for ch in g if ch not in ("_", "-")}
    missing = {ch for ch in word if ch.isalpha() and ch not in taught_letters}
    present_untaught = {u for u in known_units if u not in taught_set and u in word}
    if present_untaught:
        # An untaught digraph is ONE future sound ('ss' in "mess"), not two
        # stray letters (Lynden 2026-07-15) — report the unit itself and drop
        # any missing letters the unit already accounts for, but keep letters
        # missing in their own right ('e' in "mess" is still untaught).
        missing = {ch for ch in missing if not any(ch in u for u in present_untaught)}
        return missing | present_untaught
    if missing:
        return missing
    return {word}


def check_word(word: str, taught: list, known_units: set):
    """Return None if fine, else a short human-readable reason string."""
    missing = missing_units(word, taught, known_units)
    if not missing:
        return None
    if missing == {word}:
        return "not segmentable from taught sounds"
    return "uses untaught " + ", ".join(f"'{m}'" for m in sorted(missing))


def _grapheme_taught_level(unit: str, graphemes_data: dict):
    """First level (1-8) whose OWN grapheme list (or suffixes list — 'ed'
    lands at L7) introduces `unit`, or None if it isn't on the roadmap
    anywhere (e.g. 'sion' currently has no L8 book that teaches it — a
    curriculum gap, not something to mislabel)."""
    for lv in range(1, 9):
        entry = graphemes_data.get(f"level_{lv}", {})
        if unit in entry.get("graphemes", []) or unit in entry.get("suffixes", []):
            return lv
    return None


FUTURE_MAX_PER_BOOK = 8


def build_future_sounds(story_tokens: list, level: int, taught: list,
                         known_units: set, graphemes_data: dict,
                         level_colours: dict, tricky_words: set = frozenset()) -> list:
    """Sounds this story's words actually use that aren't taught yet AT
    THIS BOOK — previewed honestly on the page-2 chart instead of quietly
    smuggled through.  Each entry is tagged with the level that genuinely
    teaches it (and that level's ledger colour), deduped by grapheme, one
    example word per grapheme, capped at FUTURE_MAX_PER_BOOK and ordered
    by how soon it's coming.

    Whole-word "not segmentable" fallbacks are skipped — the chart previews
    single sounds, not entire irregular words (those belong in a Watch Out
    / pronunciation note instead).  Tricky words (read on sight, e.g. "the",
    "have") are excluded from scanning entirely — they're read by sight, not
    decoded, so a tricky word's letters shouldn't drive a Future Sounds
    example (matches audit_decodability.py's own tricky-word skip).
    """
    found = {}  # unit -> example word (first one wins)
    for tok in story_tokens:
        w = tok.lower().strip("'")
        if not w or w in tricky_words:
            continue
        # Contractions: apostrophe is spelling, not a sound — scan "can't"
        # as c-a-n-t (mirrors audit_release's normalisation).
        w = w.replace("'", "")
        if not w.isalpha():
            continue
        for u in missing_units(w, taught, known_units):
            if u == w:
                continue  # not a clean single sound — skip
            found.setdefault(u, w)

    entries = []
    for unit, example in found.items():
        lv = _grapheme_taught_level(unit, graphemes_data)
        # None = not on the roadmap anywhere (e.g. "sion") — nothing honest
        # to preview.  lv == level is real too (a later BOOK within this
        # same level teaches it, e.g. 'm' for an L1.1 book) — only lv < level
        # would mean "already taught", which can't happen for a genuine miss.
        if lv is None:
            continue
        entries.append({
            "grapheme": unit,
            "level": lv,
            "colour": level_colours.get(lv, "#9aa0aa"),
            "example": example,
        })
    entries.sort(key=lambda e: (e["level"], e["grapheme"]))
    return entries[:FUTURE_MAX_PER_BOOK]
