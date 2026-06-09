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
    # Detect past-tense -ed and reserve it as one phoneme button at the end.
    # Phase-5 onwards children are taught the -ed morpheme rule, so we treat
    # the final '-ed' as a single grapheme in past-tense forms (verb + ed).
    has_ed_morpheme = (
        len(lower) >= 4
        and lower.endswith("ed")
        and lower[-3] not in "aeiou"  # avoid words like "need", "feed"
    )
    end = len(lower) - 2 if has_ed_morpheme else len(lower)

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

    if has_ed_morpheme:
        out.append("ed")
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
    end = len(lower)
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
    if has_split_digraphs and len(lower) >= 3 and lower[-1] == "e":
        # Find the LAST vowel before the final 'e' that fits the pattern
        for v_idx in range(len(lower) - 2, -1, -1):
            v = lower[v_idx]
            if (v, "e") in SPLIT_DIGRAPHS:
                # Check: between v_idx and final e there's exactly 1+
                # consonant(s) — the silent-e magic-e pattern needs at
                # least one consonant in the middle.
                mid = lower[v_idx + 1:-1]
                if mid and all(c not in "aeiou" for c in mid):
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

PHASE_LABELS = {
    1: "Letters and Sounds Phase 2-3",
    2: "Letters and Sounds Phase 3",
    3: "Letters and Sounds Phase 5",
    4: "Letters and Sounds Phase 5",
    5: "Letters and Sounds Phase 5-6",
    6: "Letters and Sounds Phase 6",
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


# ─── Page count selection ────────────────────────────────────────

DEFAULT_PAGE_COUNT = {
    1: 16, 2: 16, 3: 16,   # old L1 books (now split L1-L3) — 16pp
    4: 20, 5: 20, 6: 20,   # old L2-L4 books — 20pp
    7: 24, 8: 24,          # old L5-L6 books — 24pp
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
