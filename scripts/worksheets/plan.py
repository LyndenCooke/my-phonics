"""
The worksheet plan for every book, Levels 1-8: which sheets each book pack
gets, in pedagogical order, with the forge prompt that makes each one.

A worksheet is a task sequence with one purpose. Each intent below is a fixed
line-up of forge blocks (see worksheet-forge/planner/planner.mjs RECIPES):

  handwriting  trace_letters -> trace_words -> missing_grapheme      (L1-3)
  segmenting   phoneme_frames -> missing_grapheme -> dictation       (L1-4)
  draw         trace_words -> read_draw_write                        (L1-3)
  sentences    cloze -> sentence_unjumble -> yes_no                  (L3+)
  spelling     best_bet -> cloze -> dictation                        (L5+)
  assess       real_alien_sort -> speed_read -> dictation            (check-up)
  fluency      roll_and_read -> speed_read -> real_alien_sort
  code         crack_the_code -> speed_read -> dictation
  wordsearch   word_search -> crack_the_code -> speed_read
  game         board_game -> speed_read                              (story game)

Progression by level: form & hear (L1-3) -> hear & read in context (L4) ->
choose spellings (L5) -> spell + fluency/puzzles (L6-8). Review books (the
last in a level) get a check-up per sound instead of new teaching.

Run:  py -3.12 scripts/worksheets/plan.py   -> marketing/worksheets_plan.json
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "marketing", "worksheets_plan.json")

# Sheet vocabulary: intent -> (title template, objective template, how-to template)
INTENTS = {
    "handwriting": ("Trace and write {g}",
                    "Form the sound {g} correctly and write words that use it.",
                    "Trace the letters while saying the sound, trace the words, then write the missing sound yourself."),
    "segmenting":  ("Hear and build {g}",
                    "Hear every sound in a {g} word and write it down.",
                    "Say the word, tap one box per sound, write the missing sound, then write the dictated words. One sound per box, never one letter."),
    "draw":        ("Read, draw and write",
                    "Read a sentence with the book's sounds and show you understood it.",
                    "Trace the words, read the sentence aloud, draw exactly what it says, then copy it."),
    "sentences":   ("Read {g} in sentences",
                    "Read and complete sentences that use the sound {g}.",
                    "Pick the word from the bank for each gap, rebuild the muddled sentence, then answer yes or no. Sound out; don't guess from the picture."),
    "spelling":    ("Spell {g} words",
                    "Choose the right spelling for the {g} sound and use it.",
                    "Circle the correct spelling, use the words in the sentences, then write the dictated words without looking back."),
    "assess":      ("Check-up: {g}",
                    "Show the sound {g} is secure before moving on.",
                    "Read each word and tick real or alien, then time the speed read three times, then dictation. If more than two are wrong, go back a sheet."),
    "fluency":     ("Fluency: {g}",
                    "Read {g} words quickly and accurately.",
                    "Roll the die and read that column, then the speed read three times, then real or alien. Speed comes from repetition, not rushing."),
    "code":        ("Crack the code: {g}",
                    "Decode {g} words letter by letter.",
                    "Use the key to decode each word and write it, then speed read, then dictation."),
    "wordsearch":  ("Word search: {g}",
                    "Find and read {g} words fast.",
                    "Ring each word in the grid and tick it off, crack the code, then speed read."),
    "game":        ("Story game: {book}",
                    "Read the book's words in a race game, so practice feels like play.",
                    "You need a die and two counters. Read the word you land on; alien cells are made-up words to sound out. Play it twice."),
}


def load_books():
    cat = open(os.path.join(ROOT, "src/school/data/bookCatalog.ts"), encoding="utf-8").read()
    rx = re.compile(r"subLevel: '(L\d+\.\d+)',\s*parent6SubLevel: '(L\d+\.\d+)',\s*title: '([^']+)',\s*slug: '([^']+)',\s*focusSounds: \[([^\]]*)\]")
    books = []
    for sub, parent6, title, slug, sounds in rx.findall(cat):
        lvl, idx = map(int, sub[1:].split("."))
        raw = [s.strip().strip("'") for s in sounds.split(",") if s.strip()]
        # 'ow (brown)' -> ow ; '-ous' -> ous
        clean = [re.sub(r"\s*\(.*\)$", "", s).lstrip("-") for s in raw]
        books.append(dict(level=lvl, idx=idx, sub=sub, title=title, slug=slug, file_id=parent6[1:].replace(".", "_"), sounds=clean))
    books.sort(key=lambda b: (b["level"], b["idx"]))
    return books


# Sounds a level teaches that no book focuses on; they get one sheet each in a level extras pack.
LEVEL_EXTRAS = {4: ["wh"], 5: ["tch", "dge", "kn", "wr", "mb", "gn"], 6: ["ph"], 8: ["sion"]}
# Existing hand-made packs (keep; add a "more practice" group only)
HAS_PACK = {"1_1", "1_2", "1_3"}


def sheet(book, intent, g=None, n=0):
    title, objective, how = INTENTS[intent]
    fmt = dict(g=g or "", book=book["title"])
    stem = f"{n:02d}_{intent}" + (f"_{g.replace('-', '')}" if g else "")
    prompt = {
        "handwriting": f"a handwriting worksheet for level {book['level']} sound '{g}'",
        "segmenting":  f"a segmenting worksheet for level {book['level']} sound '{g}'",
        "draw":        f"a draw worksheet for level {book['level']} sound '{g}'",
        "sentences":   f"a sentences worksheet for level {book['level']} sound '{g}'",
        "spelling":    f"a spelling worksheet for level {book['level']} sound '{g}'",
        "assess":      f"an assessment worksheet for level {book['level']} sound '{g}'",
        "fluency":     f"a fluency worksheet for level {book['level']} sound '{g}'",
        "code":        f"a crack the code worksheet for level {book['level']} sound '{g}'",
        "wordsearch":  f"a word search worksheet for level {book['level']} sound '{g}'",
        "game":        f"a board game for level {book['level']} sound '{g}'",
    }[intent]
    return dict(intent=intent, grapheme=g, stem=stem, title=title.format(**fmt), objective=objective.format(**fmt),
                how=how.format(**fmt), prompt=prompt, seed=7 + n)


def plan_book(book, is_review):
    lvl, snd = book["level"], book["sounds"]
    sheets, n = [], 0

    def add(intent, g=None):
        nonlocal n
        n += 1
        sheets.append(sheet(book, intent, g, n))

    main = snd[0]
    if lvl <= 3:
        if book["file_id"] in HAS_PACK:
            # already has a designed pack: add variants that raise attainment
            add("assess", main); add("draw", main); add("game", main)
        else:
            for g in snd: add("handwriting", g)
            add("segmenting", main); add("draw", main); add("game", main)
    elif is_review:
        for g in snd: add("assess", g)
        add("game", main)
    elif lvl == 4:
        for g in snd: add("segmenting", g); add("sentences", g)
        add("assess", main); add("game", main)
    elif lvl == 5:
        for g in snd: add("spelling", g); add("sentences", g)
        add("assess", main); add("game", main)
    elif lvl == 6:
        for g in snd: add("spelling", g); add("code", g)
        add("sentences", main); add("game", main)
    elif lvl == 7:
        for g in snd: add("spelling", g); add("fluency", g)
        add("sentences", main); add("game", main)
    else:
        for g in snd: add("spelling", g); add("wordsearch", g)
        add("sentences", main); add("game", main)
    return sheets


def build():
    books = load_books()
    packs = []
    by_level = {}
    for b in books:
        by_level.setdefault(b["level"], []).append(b)
    for lvl, lb in by_level.items():
        for b in lb:
            is_review = lvl >= 4 and b is lb[-1] and len(b["sounds"]) >= 4
            folder = f"L{lvl}/{b['file_id']}_{re.sub(r'[^a-z0-9]+', '_', b['slug'])}"
            packs.append(dict(kind="book", level=lvl, book=b, folder=folder,
                              label=("More practice" if b["file_id"] in HAS_PACK else "Worksheets"),
                              sheets=plan_book(b, is_review)))
        if lvl in LEVEL_EXTRAS:
            fake = dict(level=lvl, title=f"Level {lvl} extra sounds", slug=f"level-{lvl}-extras", file_id=None, sounds=LEVEL_EXTRAS[lvl])
            intent = "segmenting" if lvl <= 4 else "spelling"
            packs.append(dict(kind="extras", level=lvl, book=fake, folder=f"L{lvl}/extras",
                              label="Extra sounds", sheets=[sheet(fake, intent, g, i + 1) for i, g in enumerate(LEVEL_EXTRAS[lvl])]))
    total = sum(len(p["sheets"]) for p in packs)
    json.dump(packs, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"wrote {os.path.relpath(OUT, ROOT)}: {len(packs)} packs, {total} sheets")
    for p in packs:
        print(f"  L{p['level']} {p['book']['title']:32s} {len(p['sheets']):2d}  " + ", ".join(s["stem"] for s in p["sheets"]))


if __name__ == "__main__":
    build()
