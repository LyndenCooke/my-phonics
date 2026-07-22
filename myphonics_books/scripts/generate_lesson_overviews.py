"""Lesson Overviews: one filmable A4 page per lesson, Reception to Y2.

The single most important teaching artefact in the programme: a complete
ordered set of lesson overviews (one per lesson, every lesson R-Y2) that
Lynden teaches and records directly to camera, uploaded in order as a
YouTube series. One lesson = one page = one video.

Sources of truth (READ ONLY, never mutated here):
  - output/worksheet_plan/SCHOOL_SCHEME_RECEPTION_TO_Y2.md v1.1  (weekly rhythm)
  - output/worksheet_plan/CURRICULUM_LEDGER.md v2.1              (what is taught where)
  - data/teacher_guides.json    (per-GPC words, dictation, errors, notes)
  - data/graphemes_by_level.json, data/tricky_words_by_level.json (decodability)
Lesson design features folded in from output/worksheet_plan/LESSON_DESIGN_RESEARCH.md.

All NEW content lives in data/lesson_overviews.json (this product's own file):
  { "version", "total_lessons", "map": [spine rows], "lessons": {"<n>": body} }

Run:
  py -3.12 scripts/generate_lesson_overviews.py --build-map          # rebuild spine + LESSON_MAP.md
  py -3.12 scripts/generate_lesson_overviews.py --render 1           # render lesson 1 to PDF
  py -3.12 scripts/generate_lesson_overviews.py --render 1 --engine weasyprint  # sandbox fallback

Out: output/lesson_overviews/L{n}__{global#:04d}__{day}_{slug}.pdf
Deps: jinja2, playwright (chromium)  [weasyprint optional fallback engine]

House rules: British English; our own terminology only (no other schemes'
trademarked terms); level colours exactly as the ledger; no em dashes.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from jinja2 import Environment, DictLoader, select_autoescape

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
sys.path.insert(0, str(HERE))

DATA = REPO / "data"
OUT_DIR = REPO / "output" / "lesson_overviews"
PLAN_DIR = REPO / "output" / "worksheet_plan"
OVERVIEWS_JSON = DATA / "lesson_overviews.json"
FONTS = REPO / "assets" / "fonts"

LEVEL_COLOURS = {1: "#E84B8A", 2: "#F97066", 3: "#F59E0B", 4: "#22C55E",
                 5: "#3B82F6", 6: "#6366F1", 7: "#8B5CF6", 8: "#14B8A6"}
LEVEL_NAMES = {1: "Ditties", 2: "First Sounds", 3: "Special Friends",
               4: "Longer Sounds", 5: "New Spellings", 6: "Building Fluency",
               7: "Reading Together", 8: "Reading Champion"}

# ── Storybooks (ledger v2.1 book tables, PUBLIC 8-level ids). Assets for these
#    resolve via NEW_TO_OLD in generate_pilot_books.py; never renumber. ─────────
BOOKS = {
    "1.1": "Tap! Tap! Tap!", "1.2": "The Mud on the Dog",
    "2.1": "The Red Socks", "2.2": "Run, Pup, Run!", "2.3": "Fox Fell Off!",
    "2.4": "The Jam Jug", "2.5": "The Yak and the Box",
    "3.1": "The Fish in the Tank", "3.2": "Chop, Chop, Chop!", "3.3": "Buzz and Sing!",
    "4.1": "The Night Light", "4.2": "Hot Food, Cool Moon", "4.3": "Morning on the Farm",
    "4.4": "The Fair in the Air", "4.5": "Round and Round", "4.6": "The Night Fair",
    "5.1": "The Big Bike Race", "5.2": "Lost at the Night Market", "5.3": "The Dream Team",
    "5.4": "What Min Saw", "5.5": "The Boat with the Red Sail",
    "6.1": "The Purple Purse", "6.2": "The Brown Owl", "6.3": "The New Glue",
    "6.4": "The Cheeky Monkey",
    "7.1": "Before the Shore", "7.2": "Near the Door", "7.3": "Sure She Can!",
    "7.4": "A Place for Me",
    "8.1": "The Marvellous Neighbourhood", "8.2": "You Are Remarkable",
    "8.3": "It Looks Suspicious!", "8.4": "The Incredible Bush Walk",
}

# GPC -> storybook id for the Read/Write/Prove days of that GPC's cycle.
GPC_BOOK = {
    # L1 (condensed weeks; book named on the week's Day 5 read)
    "s": "1.1", "a": "1.1", "t": "1.1", "p": "1.1", "i": "1.1", "n": "1.1",
    "m": "1.2", "d": "1.2", "g": "1.2", "o": "1.2",
    # L2
    "c": "2.1", "k": "2.1", "ck": "2.1", "e": "2.1",
    "u": "2.2", "r": "2.2", "h": "2.2", "b": "2.2",
    "f": "2.3", "ff": "2.3", "l": "2.3", "ll": "2.3",
    "ss": "2.4", "j": "2.4", "v": "2.4", "w": "2.4",
    "x": "2.5", "y": "2.5", "z": "2.5",
    # L3
    "sh": "3.1", "nk": "3.1", "ch": "3.2", "th": "3.2",
    "ng": "3.3", "qu": "3.3", "zz": "3.3",
    # L4
    "ay": "4.1", "ee": "4.1", "igh": "4.1",
    "ow (blow)": "4.2", "oo (zoo)": "4.2", "oo (look)": "4.2",
    "ar": "4.3", "or": "4.3", "air": "4.4", "ir": "4.4",
    "ou (out)": "4.5", "oy": "4.5",
    # L5
    "a-e": "5.1", "i-e": "5.1", "o-e": "5.2", "u-e": "5.2",
    "ea": "5.3", "ie": "5.3", "oi": "5.4", "aw": "5.4", "ai": "5.5", "oa": "5.5",
    # L6 (consonant alternatives have no matched storybook: see gaps register)
    "ur": "6.1", "er": "6.1", "are": "6.2", "ow (brown)": "6.2",
    "ew": "6.3", "ue": "6.3",
    "wr": None, "kn": None, "ge/dge": None, "mb": None, "gn": None,
    "ph": None, "wh": None,
    # L7
    "ire": "7.1", "ore": "7.1", "ear": "7.2", "oor": "7.2",
    "ure": "7.3", "tion": "7.3",
    # L8
    "-ous": "8.1", "-able": "8.2", "-ible": "8.2",
    "-cious": "8.3", "-tious": "8.3", "re- dis- mis- sub-": None, "-tion/-sion": None,
}

# GPC -> Sound Book PDF (what EXISTS in output/sound_books today; None = gap).
SOUND_BOOKS = {
    "s": "L1/L1_01_s.pdf", "a": "L1/L1_02_a.pdf", "t": "L1/L1_03_t.pdf",
    "p": "L1/L1_04_p.pdf", "i": "L1/L1_05_i.pdf", "n": "L1/L1_06_n.pdf",
    "m": "L1/L1_07_m.pdf", "d": "L1/L1_08_d.pdf", "g": "L1/L1_09_g.pdf",
    "o": "L1/L1_10_o.pdf",
    "c": "L2/L2_01_c.pdf", "k": "L2/L2_02_k.pdf", "ck": "L2/L2_03_ck.pdf",
    "e": "L2/L2_04_e.pdf", "u": "L2/L2_05_u.pdf", "r": "L2/L2_06_r.pdf",
    "h": "L2/L2_07_h.pdf", "b": "L2/L2_08_b.pdf", "f": "L2/L2_09_f.pdf",
    "l": "L2/L2_10_l.pdf", "ff": "L2/L2_11_ff_ll.pdf", "ll": "L2/L2_11_ff_ll.pdf",
    "ss": "L2/L2_12_ss_zz.pdf", "j": "L2/L2_13_j.pdf", "v": "L2/L2_14_v_w.pdf",
    "w": "L2/L2_14_v_w.pdf", "x": "L2/L2_15_x_y_z.pdf", "y": "L2/L2_15_x_y_z.pdf",
    "z": "L2/L2_15_x_y_z.pdf",
    "sh": "L3/L3_01_sh.pdf", "nk": "L3/L3_02_nk.pdf", "ch": "L3/L3_03_ch.pdf",
    "th": "L3/L3_04_th.pdf", "ng": "L3/L3_05_ng.pdf", "qu": "L3/L3_06_qu.pdf",
    "zz": "L2/L2_12_ss_zz.pdf",
    "ay": "L4/L4_01_ay.pdf", "ee": "L4/L4_02_ee.pdf", "igh": "L4/L4_03_igh.pdf",
    "ow (blow)": "L4/L4_04_ow.pdf", "oo (zoo)": "L4/L4_05_oo_long.pdf",
    "oo (look)": "L4/L4_06_oo_short.pdf", "ar": "L4/L4_07_ar.pdf",
    "or": "L4/L4_08_or.pdf", "air": "L4/L4_09_air.pdf", "ir": "L4/L4_10_ir.pdf",
    "ou (out)": "L4/L4_11_ou.pdf", "oy": "L4/L4_12_oy.pdf",
    "a-e": "L5/L5_01_a_e.pdf", "i-e": "L5/L5_02_i_e.pdf", "o-e": "L5/L5_03_o_e.pdf",
    "u-e": "L5/L5_04_u_e.pdf", "ea": "L5/L5_05_ea.pdf", "ie": "L5/L5_06_ie.pdf",
    "oi": "L5/L5_07_oi.pdf", "aw": "L5/L5_08_aw.pdf", "ai": "L5/L5_09_ai.pdf",
    "oa": "L5/L5_10_oa.pdf",
    "ur": "L6/L6_01_ur.pdf", "er": "L6/L6_02_er.pdf", "are": "L6/L6_03_are.pdf",
    "ow (brown)": "L6/L6_04_ow.pdf", "ew": "L6/L6_05_ew_ue.pdf",
    "ue": "L6/L6_05_ew_ue.pdf", "wr": "L6/L6_06_wr_kn.pdf", "kn": "L6/L6_06_wr_kn.pdf",
    "ge/dge": "L6/L6_07_ge_dge.pdf", "mb": "L6/L6_08_mb_gn.pdf",
    "gn": "L6/L6_08_mb_gn.pdf", "ph": "L6/L6_09_ph_wh.pdf", "wh": "L6/L6_09_ph_wh.pdf",
    "ire": "L7/L7_01_ire.pdf", "ore": "L7/L7_02_ore.pdf", "ear": "L7/L7_03_ear.pdf",
    "oor": "L7/L7_04_oor.pdf", "ure": "L7/L7_05_ure.pdf", "tion": "L7/L7_06_tion.pdf",
    "-ous": "L8/L8_01_ous_cious_tious.pdf", "-cious": "L8/L8_01_ous_cious_tious.pdf",
    "-tious": "L8/L8_01_ous_cious_tious.pdf", "-able": "L8/L8_02_able_ible.pdf",
    "-ible": "L8/L8_02_able_ible.pdf", "re- dis- mis- sub-": None, "-tion/-sion": None,
}

# Sound Blending Books per level (new 8-level ids, matching the ledger notes).
BLEND_BOOKS = {1: "SB_L1_Book_1 to 4", 2: "SB_L2_Book_5 to 7",
               3: "SB_L3_Book_8 to 9", 4: "SB_L4_Book_10 to 11", 5: "SB_L5_Book_12"}

# Half-termly Quick Check PDFs (generate_progress_checks CHECKPOINTS).
CHECK_FILES = {
    "L1": "L1_check_R_Aut1.pdf", "L2a": "L2a_check_R_Aut2.pdf",
    "L2b": "L2b_check_R_Spr1.pdf", "L3": "L3_check_R_Spr2.pdf",
    "L4a": "L4a_check_R_Sum1.pdf", "L4b": "L4b_check_R_Sum2.pdf",
    "L5a": "L5a_check_Y1_Aut1.pdf", "L5b": "L5b_check_Y1_Aut2.pdf",
    "L5c": "L5c_check_Y1_Spr1.pdf", "L6a": "L6a_check_Y1_Sum1.pdf",
    "L6b": "L6b_check_Y1_Sum2.pdf", "L6c": "L6c_check_Y2_Aut1.pdf",
    "L7a": "L7a_check_Y2_Aut2.pdf", "L7b": "L7b_check_Y2_Spr1.pdf",
    "L8a": "L8a_check_Y2_Spr2.pdf", "L8b": "L8b_check_Y2_Sum1.pdf",
}

DAY_NAMES = {1: "Meet the sound", 2: "Blend it", 3: "Read it", 4: "Write it", 5: "Prove it"}


def load(name):
    with open(DATA / name, encoding="utf-8") as f:
        return json.load(f)


def slug(text):
    s = re.sub(r"[^a-z0-9]+", "-", str(text).lower()).strip("-")
    return s or "x"


def pairs(seq):
    out, i = [], 0
    while i < len(seq):
        out.append((seq[i], seq[i + 1] if i + 1 < len(seq) else None))
        i += 2
    return out


# ─────────────────────────────────────────────────────────────────────────────
# Lesson map
# ─────────────────────────────────────────────────────────────────────────────

def build_map():
    """The complete ordered lesson list: the YouTube playlist order."""
    tg = {l["level"]: l for l in load("teacher_guides.json")["levels"]}
    rows = []
    n = 0

    def add(level, half_term, code, day, day_total, title, objective, focus,
            ltype, week=None, gpc=None, book=None, sound_index=None):
        nonlocal n
        n += 1
        rows.append(dict(
            n=n, level=level, level_name=LEVEL_NAMES[level],
            colour=LEVEL_COLOURS[level], half_term=half_term, code=code,
            week=week, day=day, day_total=day_total, gpc=gpc, focus=focus,
            title=title, objective=objective, type=ltype, book=book,
            book_title=BOOKS.get(book) if book else None,
            sound_index=sound_index,
        ))

    def quick_check(level, half_term, code):
        add(level, half_term, code, 1, 1,
            f"Quick Check: {code}",
            f"Half-termly check of every {code} sound, word and tricky word; "
            "keep-up decisions made today.",
            f"Assessment ({CHECK_FILES.get(code, 'check TBD')})", "assessment")

    def keep_up(level, half_term, code):
        add(level, half_term, code, 1, 1,
            f"The keep-up routine at Level {level}",
            "For grown-ups: the daily ten-minute 1:1 routine that stops any gap "
            "compounding; keep-up, not catch-up.",
            "Keep-Up Kit guidance", "keepup")

    def condensed_level(level, segments):
        """L1-L2: two condensed cycles per week; D1-2 sound A, D3-4 sound B,
        D5 read + prove both."""
        lv = tg[level]
        sounds = lv["gpcs_display"]
        idx = {g: i + 1 for i, g in enumerate(sounds)}
        total = len(sounds)
        first_qc_done = False
        for half_term, code, seg in segments:
            for w, (a, b) in enumerate(pairs(seg), start=1):
                book = GPC_BOOK.get(b or a)
                if b:
                    add(level, half_term, code, 1, 5, f"Meet the sound: {a}",
                        f"Say, spot and form the new sound {a}.", a, "gpc",
                        week=w, gpc=a, book=book, sound_index=idx[a])
                    add(level, half_term, code, 2, 5, f"Blend it: {a}",
                        f"Blend and read words with {a}.", a, "gpc",
                        week=w, gpc=a, book=book, sound_index=idx[a])
                    add(level, half_term, code, 3, 5, f"Meet the sound: {b}",
                        f"Say, spot and form the new sound {b}.", b, "gpc",
                        week=w, gpc=b, book=book, sound_index=idx[b])
                    add(level, half_term, code, 4, 5, f"Blend it: {b}",
                        f"Blend and read words with {b}.", b, "gpc",
                        week=w, gpc=b, book=book, sound_index=idx[b])
                    add(level, half_term, code, 5, 5,
                        f"Read and prove it: {a} and {b}",
                        f"Read this week's pages, prove {a} and {b} are secure "
                        "and take the reading home.", f"{a} + {b}", "gpc",
                        week=w, gpc=b, book=book, sound_index=idx[b])
                else:  # final single sound week (z)
                    add(level, half_term, code, 1, 5, f"Meet the sound: {a}",
                        f"Say, spot and form the new sound {a}.", a, "gpc",
                        week=w, gpc=a, book=book, sound_index=idx[a])
                    add(level, half_term, code, 2, 5, f"Blend it: {a}",
                        f"Blend and read words with {a}.", a, "gpc",
                        week=w, gpc=a, book=book, sound_index=idx[a])
                    add(level, half_term, code, 3, 5, "Review: every letter",
                        "Speed-read the whole single-letter code.",
                        "review", "review", week=w, book=book)
                    add(level, half_term, code, 4, 5, "Review: doubles and tricky words",
                        "Review ff, ll, ss, ck and all tricky words so far.",
                        "review", "review", week=w, book=book)
                    add(level, half_term, code, 5, 5, f"Read and prove it: {a}",
                        f"Read this week's pages, prove {a} is secure and take "
                        "the reading home.", a, "gpc", week=w, gpc=a, book=book,
                        sound_index=idx[a])
            quick_check(level, half_term, code)
            if not first_qc_done:
                keep_up(level, half_term, code)
                first_qc_done = True
        return total

    def full_cycles(level, half_term, code, gpcs, tg_level, start_week=1):
        """From L3: one GPC per week, the full 5-day cycle."""
        sounds = tg_level["gpcs_display"]
        idx = {g: i + 1 for i, g in enumerate(sounds)}
        w = start_week
        for g in gpcs:
            book = GPC_BOOK.get(g)
            add(level, half_term, code, 1, 5, f"Meet the sound: {g}",
                f"Say, spot and form the new sound {g}.", g, "gpc",
                week=w, gpc=g, book=book, sound_index=idx.get(g))
            add(level, half_term, code, 2, 5, f"Blend it: {g}",
                f"Blend and read words with {g}.", g, "gpc",
                week=w, gpc=g, book=book, sound_index=idx.get(g))
            # Days 3-5 lead with the book, the writing and the proving; the
            # week's sound is only a one-minute reminder in the speed review.
            if book:
                add(level, half_term, code, 3, 5,
                    f"Read it: {BOOKS[book]} ({g})",
                    "First read of the storybook: decode every word. The "
                    "sound appears only as a quick reminder in the speed "
                    "review.", g, "gpc",
                    week=w, gpc=g, book=book, sound_index=idx.get(g))
                add(level, half_term, code, 4, 5,
                    f"Write it: {BOOKS[book]} ({g})",
                    "Second read for fluency, then dictation from the book: "
                    "say it, tap it, write it, check it.", g, "gpc",
                    week=w, gpc=g, book=book, sound_index=idx.get(g))
                add(level, half_term, code, 5, 5,
                    f"Prove it: {BOOKS[book]} ({g})",
                    "Third read with retell, review games and the shifty "
                    "slot; the book goes home.", g, "gpc",
                    week=w, gpc=g, book=book, sound_index=idx.get(g))
            else:
                # No matched storybook by design (no new books are planned):
                # these cycles read from cards, the worksheet page and a quick
                # slideshow instead. The sheet, not a book, goes home.
                add(level, half_term, code, 3, 5,
                    f"Read it: words and sentences with {g}",
                    f"First read of the {g} sheet and cards: decode every "
                    "word.", g, "gpc", week=w, gpc=g, book=None,
                    sound_index=idx.get(g))
                add(level, half_term, code, 4, 5,
                    f"Write it: dictation with {g}",
                    "Re-read the sheet for fluency, then say it, tap it, "
                    "write it, check it.", g, "gpc", week=w, gpc=g, book=None,
                    sound_index=idx.get(g))
                add(level, half_term, code, 5, 5, f"Prove it: {g}",
                    "Third read with retell and review games; the sheet goes "
                    "home.", g, "gpc", week=w, gpc=g, book=None,
                    sound_index=idx.get(g))
            w += 1
        return w

    def focus_week(level, half_term, code, week, titles, book=None):
        """A 5-day week of named focus lessons (review, suffix rules, etc.)."""
        for d, (t, obj, ltype) in enumerate(titles, start=1):
            add(level, half_term, code, d, 5, t, obj, t, ltype,
                week=week, book=book)

    def review_week(level, half_term, code, week, book):
        bt = BOOKS[book]
        focus_week(level, half_term, code, week, [
            (f"Review the sounds of Level {level}",
             "Speed-read every sound of the level; sort and spot.", "review"),
            ("Review: blend across the level",
             "Blend and read mixed words from the whole level.", "review"),
            (f"Read it: {bt}",
             "First read of the review storybook: decode every word.", "review"),
            (f"Write it: dictation across Level {level}",
             "Second read for fluency, then dictation across the level.", "review"),
            (f"Prove it: {bt}",
             "Third read with retell; the review book goes home.", "review"),
        ], book=book)

    # ── L1 Ditties: R Autumn 1 ────────────────────────────────────────────────
    condensed_level(1, [("Reception · Autumn 1", "L1", tg[1]["gpcs_display"])])

    # ── L2 First Sounds: R Autumn 2 + Spring 1 ───────────────────────────────
    g2 = tg[2]["gpcs_display"]
    condensed_level(2, [("Reception · Autumn 2", "L2a", g2[:10]),
                        ("Reception · Spring 1", "L2b", g2[10:])])

    # ── L3 Special Friends: R Spring 2 (full cycles begin; Phase 4 adjacent
    #    consonant drills run daily inside every lesson from here) ────────────
    full_cycles(3, "Reception · Spring 2", "L3", tg[3]["gpcs_display"], tg[3])
    quick_check(3, "Reception · Spring 2", "L3")
    keep_up(3, "Reception · Spring 2", "L3")

    # ── L4 Longer Sounds: R Summer ────────────────────────────────────────────
    g4 = tg[4]["gpcs_display"]
    w = full_cycles(4, "Reception · Summer 1", "L4a", g4[:6], tg[4])
    quick_check(4, "Reception · Summer 1", "L4a")
    keep_up(4, "Reception · Summer 1", "L4a")
    w = full_cycles(4, "Reception · Summer 2", "L4b", g4[6:], tg[4], start_week=w)
    review_week(4, "Reception · Summer 2", "L4b", w, "4.6")
    quick_check(4, "Reception · Summer 2", "L4b")

    # ── L5 New Spellings: Y1 Autumn + Spring ─────────────────────────────────
    g5 = tg[5]["gpcs_display"]
    w = full_cycles(5, "Year 1 · Autumn 1", "L5a", g5[:4], tg[5])
    quick_check(5, "Year 1 · Autumn 1", "L5a")
    keep_up(5, "Year 1 · Autumn 1", "L5a")
    w = full_cycles(5, "Year 1 · Autumn 2", "L5b", g5[4:], tg[5], start_week=w)
    quick_check(5, "Year 1 · Autumn 2", "L5b")
    focus_week(5, "Year 1 · Spring 1", "L5c", w, [
        ("Tricky words: do, when, out, what",
         "Read and spell the last four Year 1 tricky words.", "focus"),
        ("Suffix -ing when the root changes",
         "Double the last letter: hop becomes hopping.", "focus"),
        ("Suffixes -ed and -er when the root changes",
         "Apply the doubling rule to -ed and -er.", "focus"),
        ("Write it: suffixes in sentences",
         "Dictation and sentence writing with suffix words.", "focus"),
        ("Prove it: suffix round-up",
         "Prove the doubling rule is secure; mixed review.", "focus")])
    focus_week(5, "Year 1 · Spring 1", "L5c", w + 1, [
        ("The prefix un-", "Read and build un- words: unkind, unhappy.", "focus"),
        ("Commas in lists", "Say, read and punctuate a simple list.", "focus"),
        ("Sequence the story", "Order sentences with First, Next, Then.", "focus"),
        ("Write it: a tiny narrative",
         "Write two or three sequenced sentences.", "focus"),
        ("Prove it: Level 5 writing round-up",
         "Prove suffixes, un- and commas are secure.", "focus")])
    quick_check(5, "Year 1 · Spring 1", "L5c")
    # PSC preparation block: Y1 Spring 2 (whole-code revision half-term)
    ro = [("er", "her"), ("ur", "turn"), ("ow", "cow"), ("ear", "near"), ("ure", "sure")]
    for g, ex in ro:
        add(5, "Year 1 · Spring 2", "PSC prep", 1, 1,
            f"Read-only sound: {g} as in {ex}",
            f"Read {g} in real and alien words; spelling comes later in the "
            "journey.", g, "psc_prep")
    for t, obj in [
        ("Revision: the single-letter code", "Speed-read L1 and L2; mixed real and alien words."),
        ("Revision: special friends", "Speed-read the L3 digraphs; alien-word fluency."),
        ("Revision: longer sounds", "Speed-read the L4 vowel digraphs; alien-word fluency."),
        ("Revision: new spellings", "Speed-read L5 split digraphs and alternatives."),
        ("Alien words: the fluency game", "Read any alien word the code can make."),
    ]:
        add(5, "Year 1 · Spring 2", "PSC prep", 1, 1, t, obj, "revision", "psc_prep")
    add(5, "Year 1 · Spring 2", "PSC prep", 1, 1, "Practice check A",
        "Full practice run of a screening-style check (Mock A).", "PSC Mock A", "psc_mock")
    add(5, "Year 1 · Spring 2", "PSC prep", 1, 1, "Practice check B",
        "Full practice run of a screening-style check (Mock B).", "PSC Mock B", "psc_mock")

    # ── L6 Building Fluency: Y1 Summer (post-PSC) into Y2 Autumn ─────────────
    g6 = tg[6]["gpcs_display"]
    w = full_cycles(6, "Year 1 · Summer 1", "L6a", g6[:6], tg[6])
    quick_check(6, "Year 1 · Summer 1", "L6a")
    keep_up(6, "Year 1 · Summer 1", "L6a")
    w = full_cycles(6, "Year 1 · Summer 2", "L6b", g6[6:9], tg[6], start_week=w)
    quick_check(6, "Year 1 · Summer 2", "L6b")
    w = full_cycles(6, "Year 2 · Autumn 1", "L6c", g6[9:], tg[6], start_week=w)
    focus_week(6, "Year 2 · Autumn 1", "L6c", w, [
        ("Word-pool sounds: oe and au", "Read oe (toe) and au (cause) in words.", "focus"),
        ("Word-pool sounds: e-e", "Read the split digraph e-e (these).", "focus"),
        ("Soft c and sc", "Read c as /s/ (city) and sc as /s/ (science).", "focus"),
        ("Write it: word-pool dictation", "Dictation across the word-pool sounds.", "focus"),
        ("Prove it: word-pool round-up", "Prove the word-pool sounds are secure.", "focus")])
    review_week(6, "Year 2 · Autumn 1", "L6c", w + 1, "6.4")
    quick_check(6, "Year 2 · Autumn 1", "L6c")

    # ── L7 Reading Together: Y2 Autumn 2 + Spring 1 ──────────────────────────
    w = full_cycles(7, "Year 2 · Autumn 2", "L7a", tg[7]["gpcs_display"], tg[7])
    quick_check(7, "Year 2 · Autumn 2", "L7a")
    keep_up(7, "Year 2 · Autumn 2", "L7a")
    suffix_weeks = [
        ("The doubling rule", "Double the last letter before -ing, -ed, -er, -est."),
        ("The drop-e rule", "Drop the e before a vowel suffix: make becomes making."),
        ("The y to i rule", "Change y to i: happy becomes happier, happiest."),
        ("Suffixes -ful and -ly", "Build and spell -ful and -ly words."),
        ("Suffixes -ment and -ness", "Build and spell -ment and -ness words."),
        ("Homophones", "Choose there, their or they're; here or hear; see or sea."),
    ]
    for i, (t, obj) in enumerate(suffix_weeks):
        focus_week(7, "Year 2 · Spring 1", "L7b", w + i, [
            (f"Meet the rule: {t.lower()}", obj, "focus"),
            (f"Build it: {t.lower()}", "Build, sort and read words that follow the rule.", "focus"),
            (f"Read it: {t.lower()} in books", "Spot the rule at work while re-reading a storybook.", "focus"),
            (f"Write it: {t.lower()}", "Say it, tap it, write it, check it with rule words.", "focus"),
            (f"Prove it: {t.lower()}", "Prove the rule is secure; mixed dictation.", "focus")])
    review_week(7, "Year 2 · Spring 1", "L7b", w + 6, "7.4")
    quick_check(7, "Year 2 · Spring 1", "L7b")

    # ── L8 Reading Champion: Y2 Spring 2 + Summer ────────────────────────────
    l8a = ["-ous", "-able", "-ible", "-cious", "-tious", "re- dis- mis- sub-"]
    w = full_cycles(8, "Year 2 · Spring 2", "L8a", l8a, tg[8])
    quick_check(8, "Year 2 · Spring 2", "L8a")
    keep_up(8, "Year 2 · Spring 2", "L8a")
    w = full_cycles(8, "Year 2 · Summer 1", "L8b", ["-tion/-sion"], tg[8], start_week=w)
    focus_week(8, "Year 2 · Summer 1", "L8b", w, [
        ("Exception words: set one", "Read and spell the first Year 2 exception words.", "focus"),
        ("Exception words: set two", "Read and spell more Year 2 exception words.", "focus"),
        ("Exception words: set three", "Read and spell the final Year 2 exception words.", "focus"),
        ("Write it: exception words in sentences", "Dictation packed with exception words.", "focus"),
        ("Prove it: the spelling test", "The Year 2 exception word spelling test.", "focus")])
    review_week(8, "Year 2 · Summer 1", "L8b", w + 1, "8.4")
    quick_check(8, "Year 2 · Summer 1", "L8b")
    for t, obj in [
        ("Reading stamina", "Read longer texts without running out of steam."),
        ("Expression and intonation", "Make your reading voice do the work."),
        ("Editing and proofreading", "Find and fix errors like an author."),
        ("Write it, edit it, improve it", "Draft, self-check and rewrite a paragraph."),
        ("Ready for Year 3", "Meet inverted commas; look ahead to the next journey."),
    ]:
        add(8, "Year 2 · Summer 2", "L8c", 1, 1, t, obj, "fluency", "focus")
    add(8, "Year 2 · Summer 2", "L8c", 1, 1, "Reading Champion: journey complete",
        "Celebrate the whole journey from s to stories; final check-out.",
        "celebration + exit check", "assessment")

    return rows


def sounds_total(level, tg=None):
    tg = tg or {l["level"]: l for l in load("teacher_guides.json")["levels"]}
    return len(tg[level]["gpcs_display"])


def write_lesson_map_md(rows):
    counts = {}
    for r in rows:
        counts[r["level"]] = counts.get(r["level"], 0) + 1
    lines = [
        "# MyPhonicsBooks · The Lesson Map",
        "",
        "The complete ordered list of every lesson in the curriculum: the YouTube",
        "playlist order. One row = one lesson = one video = one A4 overview page.",
        "Derived from SCHOOL_SCHEME_RECEPTION_TO_Y2.md v1.1 and CURRICULUM_LEDGER.md",
        "v2.1 by scripts/generate_lesson_overviews.py (machine-readable spine:",
        "data/lesson_overviews.json). Do not hand-edit; rebuild with --build-map.",
        "",
        f"**Total lessons: {len(rows)}**",
        "",
        "| Level | Lessons |", "|---|---|",
    ]
    for lv in sorted(counts):
        lines.append(f"| L{lv} {LEVEL_NAMES[lv]} | {counts[lv]} |")
    lines += [
        "",
        "Lesson types: gpc = 5-day teaching cycle (condensed 2-sounds-a-week at",
        "L1-L2) · review = review week with the level's review storybook ·",
        "assessment = half-termly Quick Check · keepup = keep-up routine guidance",
        "for grown-ups · focus = named skill week (suffix rules, tricky words,",
        "word-pool sounds, fluency) · psc_prep / psc_mock = the Year 1 Spring 2",
        "revision half-term and practice checks.",
        "",
        "| # | Level | Half-term | Wk | Day | Focus | Title | Objective |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for r in rows:
        day = f"{r['day']}/{r['day_total']}" if r["day_total"] > 1 else "·"
        lines.append(
            f"| {r['n']} | L{r['level']} {r['level_name']} | {r['half_term']} "
            f"({r['code']}) | {r['week'] or '·'} | {day} | {r['focus']} | "
            f"{r['title']} | {r['objective']} |")
    (PLAN_DIR / "LESSON_MAP.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def build_and_save_map():
    rows = build_map()
    existing = {}
    if OVERVIEWS_JSON.exists():
        existing = json.loads(OVERVIEWS_JSON.read_text(encoding="utf-8")).get("lessons", {})
    payload = {
        "_comment": (
            "Lesson Overviews product data: the complete lesson map (playlist "
            "spine) plus fully-authored lesson bodies keyed by global lesson "
            "number. Owned by scripts/generate_lesson_overviews.py. Shared "
            "curriculum data files are never modified by this product."),
        "version": "0.1",
        "total_lessons": len(rows),
        "map": rows,
        "lessons": existing,
    }
    OVERVIEWS_JSON.write_text(json.dumps(payload, indent=2, ensure_ascii=False),
                              encoding="utf-8")
    write_lesson_map_md(rows)
    print(f"Lesson map built: {len(rows)} lessons -> {OVERVIEWS_JSON.name}, LESSON_MAP.md")
    return payload


# ─────────────────────────────────────────────────────────────────────────────
# Rendering
# ─────────────────────────────────────────────────────────────────────────────

TEMPLATE = r"""<!doctype html>
<html><head><meta charset="utf-8">
{% if use_webfonts %}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
{% endif %}
<style>
  @font-face { font-family:'Andika'; src:url('{{ font_regular }}'); font-weight:400; }
  @font-face { font-family:'Andika'; src:url('{{ font_bold }}'); font-weight:700; }
  @page { size:A4; margin:0; }
  :root { --lc:{{ L.colour }}; --ink:#1F2937; --muted:#6B7280; --line:#E5E7EB;
          --tint:{{ L.colour }}1A; }
  * { box-sizing:border-box; margin:0; padding:0; }
  html,body { width:210mm; height:297mm; font-family:"Plus Jakarta Sans","Segoe UI",sans-serif;
              color:var(--ink); font-size:9.2pt; }
  h1,h2,h3 { font-family:"Outfit","Segoe UI",sans-serif; }
  .kid { font-family:"Andika",sans-serif; }
  .page { width:210mm; height:297mm; display:flex; flex-direction:column; }

  /* header band */
  .band { background:var(--lc); color:#fff; padding:4.5mm 10mm 4mm; }
  .band .top { display:flex; justify-content:space-between; align-items:baseline; }
  .band .lesson-no { font-family:"Outfit"; font-weight:900; font-size:10pt;
    letter-spacing:.5mm; text-transform:uppercase; opacity:.95; }
  .band .meta { font-weight:700; font-size:9.5pt; opacity:.95; }
  .band h1 { font-size:20pt; font-weight:800; margin:1.2mm 0 .8mm; }
  .band .objective { font-size:10pt; font-weight:600; opacity:.96; }

  /* zoom-out map */
  .zoom { padding:3mm 10mm 2.6mm; border-bottom:1.2pt solid var(--line); }
  .zoom .crumb { font-family:"Outfit"; font-weight:700; font-size:8.6pt;
    color:var(--muted); margin-bottom:1.6mm; }
  .zoom .crumb b { color:var(--lc); }
  .rail { display:flex; gap:1.2mm; margin-bottom:2.2mm; }
  .rail .seg { flex:1; border-radius:1.5mm; padding:1.4mm 0 1.2mm; text-align:center;
    font-family:"Outfit"; font-weight:800; font-size:6.6pt; line-height:1.25;
    border:.9pt solid var(--line); color:#9CA3AF; background:#fff; }
  .rail .seg .nm { display:block; font-weight:600; font-size:5.8pt; }
  .rail .seg.done { background:#F3F4F6; color:#6B7280; border-color:#D1D5DB; }
  .rail .seg.here { background:var(--seg); border-color:var(--seg); color:#fff; }
  .local { display:flex; align-items:center; gap:4mm; }
  .local .lbl { font-family:"Outfit"; font-weight:800; font-size:8pt; color:var(--ink); }
  .dots { display:flex; gap:1mm; align-items:center; }
  .dots i { width:3.4mm; height:2.2mm; border-radius:1mm; background:#E5E7EB; }
  .dots i.on { background:var(--lc); }
  .pips { display:flex; gap:1mm; }
  .pips i { width:2.6mm; height:2.6mm; border-radius:50%; background:#E5E7EB; }
  .pips i.on { background:var(--lc); }

  /* body */
  .body { flex:1; padding:2.4mm 10mm 0; display:flex; flex-direction:column; gap:2mm; }
  .panel { border:1.1pt solid var(--line); border-radius:2.5mm; overflow:hidden; }
  .panel .ph { font-family:"Outfit"; font-weight:800; font-size:8.8pt;
    padding:1.4mm 4mm; background:var(--tint); color:var(--ink);
    text-transform:uppercase; letter-spacing:.3mm; }
  .panel .pc { padding:1.6mm 4mm 2mm; }

  .res ul { list-style:none; }
  .res li { display:flex; gap:2.5mm; padding:.6mm 0; font-size:9pt; }
  .res li .box { display:inline-block; width:3mm; height:3mm; border:1.1pt solid var(--lc);
    border-radius:.8mm; flex:0 0 auto; margin-top:.7mm; }
  .res li b { font-weight:700; }
  .res li .when { color:var(--muted); font-size:8.2pt; }

  table.flow { width:100%; border-collapse:collapse; }
  table.flow td { vertical-align:top; padding:1.2mm 2.5mm; border-top:.9pt solid var(--line); }
  table.flow tr:first-child td { border-top:none; }
  td.clock { width:14mm; white-space:nowrap; }
  td.clock .t { display:inline-block; font-family:"Outfit"; font-weight:800;
    font-size:9.2pt; color:#fff; background:var(--lc); border-radius:1.5mm;
    padding:.5mm 1.6mm; }
  td.step .sn { font-family:"Outfit"; font-weight:800; font-size:9.8pt; }
  td.step .do { font-size:9pt; margin-top:.5mm; line-height:1.35; }
  td.step .tp { font-size:8.3pt; color:var(--muted); margin-top:.5mm; line-height:1.3; }
  td.step .tp b { color:var(--lc); }

  .cols { display:flex; gap:2.2mm; }
  .cols .panel { flex:1; }
  .lang .gpc-line { display:flex; align-items:center; gap:3.5mm; margin-bottom:1mm; }
  .lang .big-gpc { font-family:"Andika"; font-weight:700; font-size:22pt;
    color:var(--lc); line-height:1; }
  .lang .lab { font-size:8.8pt; font-weight:600; color:var(--muted); }
  .lang h4, .watch h4 { font-family:"Outfit"; font-size:7.8pt; font-weight:800;
    color:var(--muted); text-transform:uppercase; letter-spacing:.3mm; margin:1.3mm 0 .5mm; }
  .words { font-family:"Andika"; font-size:12pt; line-height:1.55; }
  .words span { margin-right:3.5mm; }
  .lang .note, .watch p { font-size:8.6pt; line-height:1.35; }
  .watch li { font-size:8.8pt; line-height:1.4; margin-left:4.5mm; margin-bottom:.6mm; }

  .foot { margin-top:auto; background:var(--tint); border-top:1.4pt solid var(--lc);
    padding:2.2mm 10mm 2.6mm; display:flex; gap:5mm; align-items:center; }
  .foot .h { font-family:"Outfit"; font-weight:800; font-size:8.2pt;
    text-transform:uppercase; letter-spacing:.3mm; color:var(--lc); white-space:nowrap; }
  .foot p { font-size:8.8pt; line-height:1.35; }
</style></head><body>
<div class="page">

  <div class="band">
    <div class="top">
      <span class="lesson-no">Lesson {{ n }} of {{ total }}</span>
      <span class="meta">{{ L.half_term }} &nbsp;·&nbsp; Week {{ L.week }} · Day {{ L.day }} of {{ L.day_total }}</span>
    </div>
    <h1>{{ L.title }}</h1>
    <div class="objective">Level {{ L.level }} · {{ L.level_name }} &nbsp;·&nbsp; {{ L.objective }}</div>
  </div>

  <div class="zoom">
    <div class="crumb">Whole journey &nbsp;&rsaquo;&nbsp; <b>Level {{ L.level }} · {{ L.level_name }}</b>
      {% if L.sound_index %}&nbsp;&rsaquo;&nbsp; <b>Sound {{ L.sound_index }} of {{ sound_total }}{% if L.gpc %} ({{ L.gpc }}){% endif %}</b>{% endif %}
      &nbsp;&rsaquo;&nbsp; <b>Day {{ L.day }} of {{ L.day_total }}</b></div>
    <div class="rail">
      {% for lv in levels %}
      <div class="seg {% if lv.n < L.level %}done{% elif lv.n == L.level %}here{% endif %}"
           {% if lv.n == L.level %}style="--seg:{{ lv.colour }}"{% endif %}>
        L{{ lv.n }}<span class="nm">{{ lv.name }}</span>
      </div>
      {% endfor %}
    </div>
    <div class="local">
      {% if L.sound_index %}
      <span class="lbl">Sound {{ L.sound_index }} of {{ sound_total }}</span>
      <span class="dots">{% for i in range(sound_total) %}<i {% if i < L.sound_index %}class="on"{% endif %}></i>{% endfor %}</span>
      {% endif %}
      <span class="lbl">Day {{ L.day }} of {{ L.day_total }}</span>
      <span class="pips">{% for i in range(L.day_total) %}<i {% if i < L.day %}class="on"{% endif %}></i>{% endfor %}</span>
    </div>
  </div>

  <div class="body">

    <div class="panel res">
      <div class="ph">Resources for this lesson · in order of use</div>
      <div class="pc"><ul>
        {% for r in B.resources %}
        <li><span class="box"></span><span><b>{{ r.item }}</b>
          {% if r.detail %}· {{ r.detail }}{% endif %}
          {% if r.when %}<span class="when"> · {{ r.when }}</span>{% endif %}</span></li>
        {% endfor %}
      </ul></div>
    </div>

    <div class="panel">
      <div class="ph">The lesson · about {{ B.duration }} minutes</div>
      <div class="pc" style="padding:0 1.5mm;">
        <table class="flow">
          {% for s in B.flow %}
          <tr>
            <td class="clock"><span class="t">{{ s.clock }}</span></td>
            <td class="step">
              <div class="sn">{{ s.step }}</div>
              <div class="do">{{ s.does }}</div>
              {% if s.point %}<div class="tp"><b>Key point:</b> {{ s.point }}</div>{% endif %}
            </td>
          </tr>
          {% endfor %}
        </table>
      </div>
    </div>

    <div class="cols">
      <div class="panel lang">
        <div class="ph">This lesson's language</div>
        <div class="pc">
          {% if B.language.gpc %}
          <div class="gpc-line"><span class="big-gpc kid">{{ B.language.gpc }}</span>
            <span class="lab">{{ B.language.label }}</span></div>
          {% endif %}
          {% if B.language.oral %}
          <h4>Oral blending (say it, never show it)</h4>
          <div class="words">{% for w in B.language.oral %}<span>{{ w }}</span>{% endfor %}</div>
          {% endif %}
          {% if B.language.words %}
          <h4>{{ B.language.words_label or "Words to blend and read" }}</h4>
          <div class="words">{% for w in B.language.words %}<span>{{ w }}</span>{% endfor %}</div>
          {% endif %}
          {% if B.language.dictation %}
          <h4>Dictation</h4>
          <div class="words">{% for s in B.language.dictation %}<span>{{ s }}</span>{% endfor %}</div>
          {% endif %}
          {% if B.language.tricky %}
          <h4>Tricky word{{ B.language.tricky|length > 1 and 's' or '' }}</h4>
          <div class="words">{% for w in B.language.tricky %}<span>{{ w }}</span>{% endfor %}</div>
          {% endif %}
          {% if B.language.note %}<h4>Note</h4><p class="note">{{ B.language.note }}</p>{% endif %}
        </div>
      </div>
      <div class="panel watch">
        <div class="ph">Watch for</div>
        <div class="pc"><ul>
          {% for wf in B.watch_for %}<li>{{ wf }}</li>{% endfor %}
        </ul></div>
      </div>
    </div>

  </div>

  <div class="foot">
    <span class="h">Home &amp; follow-along</span>
    <p>{{ B.home }}</p>
  </div>

</div>
</body></html>
"""


def render_lesson(n, engine="playwright"):
    data = json.loads(OVERVIEWS_JSON.read_text(encoding="utf-8"))
    row = next((r for r in data["map"] if r["n"] == n), None)
    body = data["lessons"].get(str(n))
    if not row or not body:
        raise SystemExit(f"Lesson {n}: map row or authored body missing.")
    tg = {l["level"]: l for l in load("teacher_guides.json")["levels"]}
    env = Environment(loader=DictLoader({"page": TEMPLATE}),
                      autoescape=select_autoescape(["html"]))
    html = env.get_template("page").render(
        n=n, total=data["total_lessons"], L=row, B=body,
        sound_total=len(tg[row["level"]]["gpcs_display"]),
        levels=[dict(n=i, name=LEVEL_NAMES[i], colour=LEVEL_COLOURS[i])
                for i in range(1, 9)],
        font_regular=(FONTS / "Andika-Regular.ttf").as_uri(),
        font_bold=(FONTS / "Andika-Bold.ttf").as_uri(),
        use_webfonts=(engine == "playwright"),
    )
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    stem = f"L{row['level']}__{n:04d}__d{row['day']}_{slug(row['gpc'] or row['focus'])}"
    html_path = OUT_DIR / f"{stem}.html"
    pdf_path = OUT_DIR / f"{stem}.pdf"
    html_path.write_text(html, encoding="utf-8")

    if engine == "weasyprint":
        from weasyprint import HTML
        HTML(string=html, base_url=str(OUT_DIR)).write_pdf(str(pdf_path))
    else:
        import asyncio
        from playwright.async_api import async_playwright

        async def go():
            async with async_playwright() as p:
                b = await p.chromium.launch()
                pg = await b.new_page()
                await pg.goto(html_path.as_uri())
                await pg.wait_for_timeout(400)
                await pg.pdf(path=str(pdf_path), format="A4",
                             print_background=True,
                             margin=dict(top="0", bottom="0", left="0", right="0"))
                await b.close()
        asyncio.run(go())
    print(f"Rendered {pdf_path}")
    return pdf_path


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--build-map", action="store_true")
    ap.add_argument("--render", type=int)
    ap.add_argument("--engine", default="playwright",
                    choices=["playwright", "weasyprint"])
    args = ap.parse_args()
    if args.build_map:
        build_and_save_map()
    if args.render:
        render_lesson(args.render, engine=args.engine)
    if not args.build_map and not args.render:
        ap.print_help()
