"""
MyPhonicsBooks — Sound Cards data & sheet-layout helpers.

Loads output/worksheet_plan/sound_cards.json, enriches each card with
render-ready fields (says_short, twin badge text, etc.), and lays cards
out into physical print sheets for Tier 1 (premium, imposed, duplex) and
Tier 2 (free A4 cut-sheet).

Pure data/layout module — no Jinja2, no Playwright. Kept separate from
generate_cards.py so the layout logic can be unit-tested on its own.
"""

import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
CARDS_JSON = BASE_DIR / "output" / "worksheet_plan" / "sound_cards.json"

LEVEL_ORDER = [f"L{n}" for n in range(1, 9)]

# Named rollout batches per the print-run plan (acceptance criterion 6):
#   L1-L4 first, then L5-L6, then L7-L8 (+ the ough insert, handled separately).
ROLLOUT_BATCHES = {
    "batch1": ["L1", "L2", "L3", "L4"],
    "batch2": ["L5", "L6"],
    "batch3": ["L7", "L8"],
}

# ─── Physical geometry (mm) ──────────────────────────────────────
CARD_TRIM_W = 74.0
CARD_TRIM_H = 105.0
BLEED = 3.0
CARD_BLEED_W = CARD_TRIM_W + 2 * BLEED   # 80mm
CARD_BLEED_H = CARD_TRIM_H + 2 * BLEED   # 111mm

# One shared starting font-size (CSS px) for every grapheme/hero-word
# element across all three products. Previously each card shrank
# independently to MAXIMISE its own fill, so "s" ballooned to ~490px
# while "cious" shrank to ~100px — wildly inconsistent card-to-card.
# Calibrated instead against the widest 1-3 character grapheme in the
# whole deck ("dge", 3 chars) at 90% of the trim-safe width, with a
# small safety margin — so every grapheme of 3 characters or fewer
# (95 of 103 in the deck) renders at this EXACT size, and only the 8
# four/five-character clusters (tion, augh, eigh, able, sion, ible,
# cious, tious) shrink below it, only as far as each one needs.
GRAPHEME_TARGET_PX = 135

# ─── The three card identities (locked 2026-07-05) ──────────────
# 1. MAIN — the sounds taught in the books, for nursery→Y1 children.
#    White card, level-colour corner strip. Its back shows ONLY its own
#    sound + example: it must never mention the later shifts, so the
#    youngest readers are never confused by z/sh/zh lurking on "s".
# 2. SHIFTY — a separate grey card, charcoal corner strip (the locked
#    Shifty Sounds band colour, outside the 8-level rainbow), one per
#    grapheme that makes more than one sound. Its back lists EVERY
#    pronunciation including the original (the shifty card may go over
#    old ground; the main card may not go over shifty ground). It joins
#    the deck at the level where the grapheme's FIRST alternative
#    pronunciation is taught — shifty sounds are taught later, mainly
#    through games.
# 3. EXTRA — new spellings for already-known sounds (wr, kn, ph, tch),
#    taught outside the main book ladder (games / mini-books). Oat card
#    with a deep-indigo corner strip (the brand accent, NOT a level
#    colour) so it reads as an additional strand, not a ninth level.
MAIN_TINT = "#FFFFFF"
SHIFTY_TINT = "#ECEFF1"
EXTRA_TINT = "#F2EBDD"
SHIFTY_BAND_COLOUR = "#475569"   # locked in data/shifty_sounds.json
EXTRA_STRIP_COLOUR = "#312e81"   # brand deep indigo (docs/brand-guidelines.md)

# Tier 1 — one card per page-pair (front, then its back immediately
# after), matching the free-printable/ough one-card-at-a-time pattern
# instead of imposing a 3x3 sheet grid. This is also the more standard
# submission format for a commercial card printer: they gang/impose
# print-ready front+back pairs themselves with their own RIP software,
# so it drops the "flip on the long edge" duplex-mirroring assumption
# entirely — that was a real physical guess about press feed
# orientation; a plain page-per-side sequence needs no guess at all.
#
# The page is the bleed box PLUS a margin equal to the crop marks'
# reach (crop_marks() in _shared.html extends GAP+LENGTH = 6mm beyond
# the bleed edge). Without that margin the marks fall outside the PDF's
# page bounds and get silently clipped — confirmed by inspecting the
# ough insert, which had exactly this bug (page size == bleed box, no
# room for the marks it was drawing); fixed there at the same time.
CARD_PAGE_MARGIN = 6.0
CARD_PAGE_W = CARD_BLEED_W + 2 * CARD_PAGE_MARGIN   # 92mm
CARD_PAGE_H = CARD_BLEED_H + 2 * CARD_PAGE_MARGIN   # 123mm

# Tier 2 free printable — A4 landscape, cards tile edge-to-edge with no
# bleed (4 cols x 2 rows of portrait A7 cards = 296 x 210mm, a near-exact
# fit inside 297 x 210mm A4 landscape).
TIER2_SHEET_W = 297.0
TIER2_SHEET_H = 210.0
TIER2_COLS = 4
TIER2_ROWS = 2
TIER2_PER_SHEET = TIER2_COLS * TIER2_ROWS  # 8

# Picture-word cards — landscape (rotated A7: 105 x 74mm instead of the
# usual 74 x 105mm), double-sided: image on the front, word on the
# back, no bleed. Landscape gives ~40% more width than the old portrait
# single-face design, which is what lets every word share ONE fixed
# font size (PICTURE_WORD_TARGET_PX) instead of shrinking per word —
# "underpants"/"instrument"/"helicopter" (the longest in the deck) are
# the calibration ceiling, same principle as GRAPHEME_TARGET_PX.
# Sheet is A4 PORTRAIT (210 x 297mm): rotating the card 90 degrees and
# rotating the sheet 90 degrees preserves the same exact-tiling A-series
# relationship Tier 2 relies on (2 cols x 4 rows = 296mm used of 297mm,
# same near-zero waste, just swapped axes).
#
# These are a DIY home-print job (unlike Tier 1, a commercial press
# job where imposition is the printer's problem) — the parent/teacher
# picks their own printer's duplex setting, so an imposed sheet with a
# mirrored back is the right format here, not something to avoid.
PW_CARD_W = 105.0
PW_CARD_H = 74.0
PW_SHEET_W = 210.0
PW_SHEET_H = 297.0
PW_COLS = 2
PW_ROWS = 4
PW_PER_SHEET = PW_COLS * PW_ROWS  # 8
PW_WORD_TARGET_PX = 57


def tier2_cell_positions() -> list[tuple[float, float]]:
    """Row-major (left_mm, top_mm) of each trim-box origin on a Tier 2 sheet.

    Cards tile edge-to-edge (no bleed, no gutter); the 1mm slack between
    4 x CARD_TRIM_W (296mm) and TIER2_SHEET_W (297mm) is split as an
    equal margin on the left and right.
    """
    margin_x = (TIER2_SHEET_W - TIER2_COLS * CARD_TRIM_W) / 2
    margin_y = (TIER2_SHEET_H - TIER2_ROWS * CARD_TRIM_H) / 2
    positions = []
    for r in range(TIER2_ROWS):
        for c in range(TIER2_COLS):
            left = margin_x + c * CARD_TRIM_W
            top = margin_y + r * CARD_TRIM_H
            positions.append((left, top))
    return positions


def pw_cell_positions() -> list[tuple[float, float]]:
    """Row-major (left_mm, top_mm) of each picture-word card on its A4
    portrait sheet. Cards tile edge-to-edge (no bleed); the ~1mm slack
    between 4 x PW_CARD_H (296mm) and PW_SHEET_H (297mm) splits as an
    equal margin top/bottom."""
    margin_x = (PW_SHEET_W - PW_COLS * PW_CARD_W) / 2
    margin_y = (PW_SHEET_H - PW_ROWS * PW_CARD_H) / 2
    positions = []
    for r in range(PW_ROWS):
        for c in range(PW_COLS):
            left = margin_x + c * PW_CARD_W
            top = margin_y + r * PW_CARD_H
            positions.append((left, top))
    return positions


def load_raw() -> dict:
    with open(CARDS_JSON, "r", encoding="utf-8") as f:
        return json.load(f)


# There are no separate twin cards any more (decided 2026-07-05). The
# deck is main sound cards + shifty-sound (extra_spelling) cards only.
# A grapheme's alternative pronunciations fold onto the BACK of its one
# main card as sound → example rows, e.g. the "s" card's back reads:
#   s   sun
#   z   is
#   sh  sure
#   zh  treasure
# Twins can live at a different level from their main (z-for-s arrives
# at L4, sh/zh at L8) — the merged back deliberately shows them all
# regardless of which levels are being printed, because the card is a
# lifetime reference for that spelling, not a per-level consumable.
# The sound card never carries an image itself — for L1-L2, the image
# lives on a separate companion "picture word" card instead (see
# build_picture_word_cards), printed single-sided/no-bleed rather than
# folded into the premium double-sided deck, on cost grounds.
MAX_BACK_WORDS = 6
PICTURE_CARD_LEVELS = {"L1", "L2"}

# L1/L2 word lists are pedagogy-curated, not pulled from the curriculum
# word bank. The word bank optimises for strict decodability at that
# level, which produces two problems for these two products: obscure
# words a child has never encountered (sap, nit, cob, fen, gill, hull),
# and outright non-picturable function words (am, an, at, if, us). At
# L1-L2 the child is reading a whole, familiar word next to its picture —
# not decoding the rest of it letter by letter — so "familiar and
# picturable" beats "decodable" as the selection criterion (s can be
# snow/soap/sleep even though none of that is decodable at L1). Hand
# picked, one list per L1/L2 sound card; the source word bank is still
# used as a fallback for any grapheme not covered here.
FAMILIAR_WORDS_BY_GRAPHEME = {
    # L1
    # "sock" and "duck" also appear under "ck" below (a rarer/later-taught
    # digraph than the plain letter sounds here) — 2026-07-10: dropped from
    # here to avoid the same photo appearing twice in the deck; "ck" keeps
    # them since the rarer sound should get the picture, per house rule.
    "s": ["sun", "snake", "soap", "star", "snow", "seal", "spider"],
    "a": ["ant", "apple", "alligator", "astronaut", "axe", "ambulance"],
    "t": ["tap", "tiger", "teddy", "tomato", "torch", "tractor", "toothbrush"],
    "p": ["pig", "panda", "penguin", "pizza", "popcorn", "parrot"],
    "i": ["ink", "igloo", "insect", "instrument"],
    "n": ["net", "nurse", "nest", "noodle", "necklace", "newspaper"],
    # "mermaid" removed 2026-07-10 (not an appropriate subject for this
    # age group); "muffin" removed — duplicates "ff" below (rarer sound
    # keeps the picture, same rule as sock/duck above).
    "m": ["moon", "monkey", "mouse", "mirror", "mat"],
    "d": ["dog", "dinosaur", "drum", "dolphin", "door", "dice"],
    "g": ["goat", "guitar", "gorilla", "goggles", "garden", "gift"],
    "o": ["ox", "octopus", "orange", "ostrich", "otter", "onion"],
    # L2
    "c": ["cat", "car", "cup", "candle", "camera", "cake", "castle"],
    "k": ["kit", "kite", "king", "kangaroo", "kettle", "key"],
    "ck": ["duck", "sock", "clock", "rock", "truck", "chick"],
    "e": ["egg", "elephant", "engine", "elbow", "envelope"],
    "u": ["up", "umbrella", "underpants", "uncle"],
    "r": ["rat", "rabbit", "rainbow", "robot", "ring", "rocket"],
    "h": ["hat", "hen", "horse", "house", "hammer", "helicopter"],
    "b": ["bat", "ball", "banana", "balloon", "bear", "bus"],
    "f": ["fan", "fish", "frog", "flower", "fire", "feather"],
    "ff": ["puff", "cliff", "muffin", "waffle", "sniff", "fluff"],
    "l": ["leg", "lion", "ladybird", "ladder", "lamp", "lemon"],
    "ll": ["bell", "doll", "shell", "hill", "llama", "well"],
    "ss": ["hiss", "kiss", "dress", "glass", "grass", "princess"],
    "j": ["jam", "jelly", "jigsaw", "jacket", "juice", "jeep"],
    "v": ["van", "volcano", "vase", "violin", "vegetables", "vet"],
    "w": ["wet", "web", "whale", "watch", "window", "worm"],
    "x": ["box", "fox", "six", "taxi", "mix", "wax"],
    "y": ["yes", "yo-yo", "yak", "yoghurt", "yolk", "yellow"],
    "z": ["zip", "zoo", "zebra", "zigzag", "zero", "zucchini"],
}

# Only living/character subjects get a face (2026-07-10 fix — the prompt
# used to force "small solid black dot eyes" onto every word, so objects
# like sun, star, apple, sock and soap all got a cute face they shouldn't
# have. Anything not in this set renders as a plain object/scene with no
# eyes at all; anything in it still follows the eye-style rule (solid
# black dot, no iris/pupil/highlight) when it does get a face.
FACE_WORDS = {
    "alligator", "ant", "astronaut", "bat", "bear", "cat", "chick",
    "dinosaur", "dog", "doll", "dolphin", "duck", "elephant", "fish",
    "fox", "frog", "goat", "gorilla", "hen", "horse", "insect",
    "kangaroo", "king", "ladybird", "lion", "llama", "monkey",
    "mouse", "nurse", "octopus", "ostrich", "otter", "ox", "panda",
    "parrot", "penguin", "pig", "princess", "rabbit", "rat", "robot",
    "seal", "snake", "teddy", "tiger", "uncle", "vet", "whale", "worm",
    "yak", "zebra",
}

# Creatures where a touch of habitat (grass, water, sky) genuinely adds
# context, not decoration — the rest of FACE_WORDS (people, toy/robot
# characters) reads better as a plain portrait, same as every object
# card. 2026-07-10: cards were coming back with a busy decorative scene
# behind EVERY subject (swirls, hearts, gradients) regardless of whether
# it meant anything — plain-by-default with habitat as the one earned
# exception.
HABITAT_FACE_WORDS = {
    "alligator", "ant", "bat", "bear", "cat", "chick", "dog", "dolphin",
    "duck", "elephant", "fish", "fox", "frog", "goat", "gorilla", "hen",
    "horse", "insect", "kangaroo", "ladybird", "lion", "llama", "monkey",
    "mouse", "octopus", "ostrich", "otter", "ox", "panda", "parrot",
    "penguin", "pig", "rabbit", "rat", "seal", "snake", "tiger", "whale",
    "worm", "yak", "zebra",
}

# Matches the eye-style rule + flat-illustration brief already used for
# the per-card image_prompt in sound_cards.json — kept identical so a
# word's picture-card image looks like it belongs with the rest.
_IMAGE_PROMPT_TEMPLATE_FACE_HABITAT = (
    "child-friendly flat illustration of '{word}', small solid black dot "
    "eyes only (no iris, no pupil, no highlight), a simple hint of its "
    "natural setting behind it (not a busy decorated scene), "
    "MyPhonicsBooks style, warm colours, no text"
)
_IMAGE_PROMPT_TEMPLATE_FACE_PLAIN = (
    "child-friendly flat illustration of '{word}', small solid black dot "
    "eyes only (no iris, no pupil, no highlight), plain simple background "
    "(solid or softly shaded, no busy decoration), MyPhonicsBooks style, "
    "warm colours, no text"
)
_IMAGE_PROMPT_TEMPLATE_OBJECT = (
    "child-friendly flat illustration of '{word}', a plain object with no "
    "face and no eyes, plain simple background (solid or softly shaded, "
    "no busy decoration), MyPhonicsBooks style, warm colours, no text"
)


def _image_prompt_for(word: str) -> str:
    if word in HABITAT_FACE_WORDS:
        template = _IMAGE_PROMPT_TEMPLATE_FACE_HABITAT
    elif word in FACE_WORDS:
        template = _IMAGE_PROMPT_TEMPLATE_FACE_PLAIN
    else:
        template = _IMAGE_PROMPT_TEMPLATE_OBJECT
    return template.format(word=word)


def build_back_words(card: dict) -> list[str]:
    """Key word first, then a familiar/picturable word list (deduped),
    capped at MAX_BACK_WORDS. Falls back to the curriculum word bank for
    any grapheme not in FAMILIAR_WORDS_BY_GRAPHEME (L3+, mainly)."""
    key_word = card.get("key_word", "")
    grapheme = card.get("grapheme", "").lower()
    words = FAMILIAR_WORDS_BY_GRAPHEME.get(grapheme) or card.get("words") or []
    seen = set()
    ordered = []
    if key_word:
        ordered.append(key_word)
        seen.add(key_word.lower())
    for w in words:
        if w.lower() not in seen:
            ordered.append(w)
            seen.add(w.lower())
    return ordered[:MAX_BACK_WORDS]


# The card back needs one short sound label per row; a handful of
# says_plain heads in the source data are descriptive phrases instead.
# "oo short" -> "oo" and "voiced th" -> "th" intentionally duplicate
# their sibling row's label (oo moon / oo book, th thin / th then) —
# that IS the teaching point: same label, two sounds, told apart by the
# example word, exactly how RWI presents them.
_SOUND_LABEL_OVERRIDES = {
    "schwa uh": "uh",       # "schwa" is teacher jargon
    "oo short": "oo",
    "voiced th": "th",
    "shun zhun": "zhun",    # sion card; "zhun" matches its example, television
}


def says_head(card: dict) -> str:
    """'zh, as in treasure' -> 'zh'. Falls back to the grapheme itself."""
    plain = card.get("says_plain") or ""
    head = plain.split(",")[0].strip()
    head = _SOUND_LABEL_OVERRIDES.get(head.lower(), head)
    return head or card.get("grapheme", "")


def enrich_card(card: dict) -> dict:
    """Add render-ready derived fields to a raw card dict (non-destructive)."""
    c = dict(card)
    back_words = build_back_words(c)
    c["back_words"] = back_words
    c["back_words_text"] = "\n".join(back_words)
    c["is_picture_card_source"] = (
        c.get("type") == "main" and c.get("level") in PICTURE_CARD_LEVELS
    )
    return c


def build_deck(cards: list[dict]) -> list[dict]:
    """Build the physical deck from the raw card list.

    - MAIN cards: white, level-strip corner, back = own sound only
      (never mentions the shifts — nursery→Y1 children use these).
    - SHIFTY cards: one NEW grey card per grapheme with alternative
      pronunciations, charcoal corner, back = ALL sounds (original
      first). Enters the deck at the level of the grapheme's first
      alternative pronunciation, since that's when the shift is taught.
    - EXTRA cards: oat, indigo corner, back = own sound only.

    Raw type=='twin' cards stop being physical cards: they only supply
    rows to their grapheme's shifty card. Each returned card carries
    `kind` ('main'|'shifty'|'extra'), `tint` and `corner_colour` so the
    templates never have to reason about types again.
    """
    twins_by_group = {}
    for c in cards:
        if c["type"] == "twin":
            twins_by_group.setdefault(c["twin_group"], []).append(c)

    deck = []
    for c in cards:
        if c["type"] == "twin":
            continue
        own_row = [{"sound": says_head(c), "word": c.get("key_word", "")}]
        if c["type"] == "extra_spelling":
            c.update(kind="extra", tint=EXTRA_TINT,
                     corner_colour=EXTRA_STRIP_COLOUR, pronunciations=own_row)
            deck.append(c)
            continue

        c.update(kind="main", tint=MAIN_TINT,
                 corner_colour=c["level_colour"], pronunciations=own_row)
        deck.append(c)

        siblings = sorted(twins_by_group.get(c.get("twin_group") or "", []),
                          key=lambda t: t.get("twin_number") or 0)
        if siblings:
            first_shift_level = min((s["level"] for s in siblings),
                                    key=lambda lv: LEVEL_ORDER.index(lv))
            deck.append({
                **c,
                "card_id": f"SHIFTY-{c['grapheme']}",
                "kind": "shifty",
                "level": first_shift_level,
                "tint": SHIFTY_TINT,
                "corner_colour": SHIFTY_BAND_COLOUR,
                "is_picture_card_source": False,
                "pronunciations": own_row + [
                    {"sound": says_head(t), "word": t.get("key_word", "")}
                    for t in siblings
                ],
            })

    # Group by level (shifty cards after that level's mains/extras) so
    # print batches stay level-ordered.
    ordered = []
    for lv in LEVEL_ORDER:
        ordered += [c for c in deck if c["level"] == lv and c["kind"] != "shifty"]
        ordered += [c for c in deck if c["level"] == lv and c["kind"] == "shifty"]
    return ordered


def parse_level_selector(selector: str | None) -> list[str]:
    """'all' | 'L3' | 'L1-L4' | 'L1,L3,L5' | 'batch1' -> ordered level list."""
    if selector is None or selector.lower() == "all":
        return list(LEVEL_ORDER)
    selector = selector.strip()
    if selector.lower() in ROLLOUT_BATCHES:
        return list(ROLLOUT_BATCHES[selector.lower()])
    if "-" in selector and "," not in selector:
        start, end = (s.strip().upper() for s in selector.split("-", 1))
        i0, i1 = LEVEL_ORDER.index(start), LEVEL_ORDER.index(end)
        return LEVEL_ORDER[i0:i1 + 1]
    wanted = {s.strip().upper() for s in selector.split(",")}
    return [lv for lv in LEVEL_ORDER if lv in wanted]


def load_cards(level_selector: str = "all") -> tuple[list[dict], list[dict]]:
    """Return (deck_cards, ough_insert_cards), filtered + enriched.

    The deck is built from the FULL card list before the level filter,
    so a shifty card assembled from cross-level pronunciations is
    complete no matter which levels are being printed.
    """
    raw = load_raw()
    levels = set(parse_level_selector(level_selector))
    all_cards = build_deck([enrich_card(c) for c in raw["cards"]])
    cards = [c for c in all_cards if c["level"] in levels]
    ough = [enrich_card(c) for c in raw["ough_insert_set"] if c["level"] in levels]
    return cards, ough


def build_picture_word_cards(cards: list[dict]) -> list[dict]:
    """Expand each L1-L2 main sound card into its companion picture-word
    cards — one per word in that card's back_words list (image + word,
    single face). RWI-style: the sound card stays one card; these are the
    separate "free" (single-sided, no-bleed, cost-efficient) practice cards
    that go with it, not extra content crammed onto the sound card's back.
    White like the main cards they accompany.
    """
    out = []
    for card in cards:
        if not card.get("is_picture_card_source"):
            continue
        for word in card["back_words"]:
            out.append({
                "card_id": f"{card['card_id']}__{word}",
                "source_card_id": card["card_id"],
                "word": word,
                "level": card["level"],
                "level_colour": card["level_colour"],
                "tint": MAIN_TINT,
                "image_prompt": _image_prompt_for(word),
            })
    return out


def _chunk(seq: list, n: int) -> list[list]:
    return [seq[i:i + n] for i in range(0, len(seq), n)]


# ─── Print grouping (2026-07-05) ─────────────────────────────────
# Cards print in single-type runs, never interleaved: every main sound
# (level order), then every shifty card, then every extra. A stack cut
# or gathered from pages in this order comes out pre-sorted — no
# re-sorting needed afterwards.
KIND_ORDER = ["main", "shifty", "extra"]


def _print_groups(cards: list[dict]) -> list[tuple[str | None, list[dict]]]:
    """Split a deck slice into single-type print groups, order preserved."""
    groups = []
    for kind in KIND_ORDER:
        g = [c for c in cards if c.get("kind") == kind]
        if g:
            groups.append((kind, g))
    leftover = [c for c in cards if c.get("kind") not in KIND_ORDER]
    if leftover:  # picture-word cards etc. — no kind, one plain group
        groups.append((None, leftover))
    return groups


def build_tier1_pages(cards: list[dict]) -> list[dict]:
    """Flatten the deck into print order — one page-pair per card.

    Order is kind-major, level-ordered within each kind (see
    _print_groups): every main sound in level order, then every shifty
    card, then every extra. Each card contributes two consecutive
    pages: {"side": "front", "card": c} immediately followed by
    {"side": "back", "card": c} — a print house's own imposition
    software gangs these up; we don't guess at sheet layout or duplex
    feed orientation any more.
    """
    pages = []
    for _kind, group_cards in _print_groups(cards):
        for card in group_cards:
            pages.append({"side": "front", "card": card})
            pages.append({"side": "back", "card": card})
    return pages


def build_tier2_sheets(cards: list[dict]) -> list[dict]:
    """Group cards into single-sided A4 sheets of TIER2_PER_SHEET cards
    each — one card type per sheet (the grid has no margin to print a
    label in, so the corner colours do the naming)."""
    sheets = []
    for _kind, group_cards in _print_groups(cards):
        for chunk in _chunk(group_cards, TIER2_PER_SHEET):
            cells = list(chunk) + [None] * (TIER2_PER_SHEET - len(chunk))
            sheets.append({"cells": cells})
    return sheets


def build_pw_sheets(cards: list[dict]) -> list[dict]:
    """Group picture-word cards into double-sided A4 portrait sheets,
    8 per sheet (2 cols x 4 rows): [{side, cells}, ...]. Back cells are
    column-mirrored per row (2 columns, so each row of 2 just swaps)
    so a home printer's "flip on long edge" duplex setting lines the
    word up behind its picture.
    """
    sheets = []
    for chunk in _chunk(cards, PW_PER_SHEET):
        front_cells = list(chunk) + [None] * (PW_PER_SHEET - len(chunk))
        back_cells = [None] * PW_PER_SHEET
        for r in range(PW_ROWS):
            for c in range(PW_COLS):
                idx = r * PW_COLS + c
                mirrored_idx = r * PW_COLS + (PW_COLS - 1 - c)
                back_cells[mirrored_idx] = front_cells[idx]
        sheets.append({"side": "front", "cells": front_cells})
        sheets.append({"side": "back", "cells": back_cells})
    return sheets
