"""
Build marketing/social/queue.json — every free printable we can post, one per
day, in curriculum order (Level 1 -> 8), each with a paste-ready caption.

Sources (all already published, nothing new is made):
  * 33 book PDFs            public/book-pdfs/<6level id>.pdf
  * every activity page     inside those books, served one page at a time by
                            api/printable.py  ->  /p/<book>/<page>
  * 65 worksheet PDFs       public/worksheets/**

Run:  py -3.12 scripts/social/build_queue.py
Then: scripts/social/post_next.py posts the next unposted item (GitHub Action).
"""
import glob
import json
import os
import re
import sys

import fitz  # PyMuPDF

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BASE = "https://myphonicsbooks.vercel.app"
OUT = os.path.join(ROOT, "marketing", "social", "queue.json")

LEVEL_NAMES = {1: "Ditties", 2: "First Sounds", 3: "Special Friends", 4: "Longer Sounds",
               5: "New Spellings", 6: "Building Fluency", 7: "Reading Together", 8: "Reading Champion"}

SIGN_OFF = "All 33 books, worksheets and games are free on our page: MyPhonicsBooks"

# Activity page types found inside the books, keyed by how the page's text starts.
# (label, one-line parent-facing description)
PAGE_TYPES = [
    ("Our Sounds", "Sound mat", "Every sound in the book on one page. Say each one out loud before reading."),
    ("Story Words", "Story words", "The book's words, sound by sound, ready to blend before the story."),
    ("Sound Spotlight", "Sound Spotlight", "The focus sounds of this book with picture words to read and say."),
    ("Trace & Form", "Trace & Form", "Trace the grey letters, then write the sounds yourself."),
    ("Alien Words", "Alien Words Challenge", "Made-up words to sound out, the same skill the Year 1 phonics check tests."),
    ("Put the Story in Order", "Story sequencing", "Number the pictures in order, then retell the story."),
    ("Tell the Story", "Tell the Story", "Retell the story in your own words using the pictures."),
    ("Your Turn to Write", "Your Turn to Write", "Sentence starters and a writing goal to retell the story."),
    ("Talk About It", "Talk About It", "Finding, thinking and feeling questions to talk through together."),
    ("Word Workshop", "Grammar Spotlight", "One focused grammar challenge from the story."),
    ("Can You Read These?", "Can You Read These?", "Words and sentences to read, then choose the missing word."),
    ("Shifty Sounds", "Shifty Sounds", "Different spellings, same sound. Grow the code."),
]


def load_books():
    cat = open(os.path.join(ROOT, "src/school/data/bookCatalog.ts"), encoding="utf-8").read()
    rx = re.compile(r"subLevel: '(L\d+\.\d+)',\s*parent6SubLevel: '(L\d+\.\d+)',\s*title: '([^']+)',\s*slug: '([^']+)',\s*focusSounds: \[([^\]]*)\]")
    books = []
    for sub, parent6, title, slug, sounds in rx.findall(cat):
        lvl, idx = map(int, sub[1:].split("."))
        books.append(dict(level=lvl, idx=idx, sub=sub, title=title, slug=slug,
                          file_id=parent6[1:].replace(".", "_"),
                          sounds=", ".join(s.strip("' ") for s in sounds.split(",") if s.strip())))
    books.sort(key=lambda b: (b["level"], b["idx"]))
    assert len(books) == 33, f"expected 33 books, found {len(books)}"
    return books


def activity_pages(book):
    """Yield (page_no, label, blurb) for every standalone activity page in the book PDF."""
    doc = fitz.open(os.path.join(ROOT, "public/book-pdfs", f"{book['file_id']}.pdf"))
    for i, page in enumerate(doc, 1):
        text = " ".join(page.get_text().split())
        for key, label, blurb in PAGE_TYPES:
            if text.startswith(key):
                yield i, label, blurb
                break


WS_LEVEL = {
    "Sound_Pack": (1, "s a t p i n sound sheets"),
    "Sound_Pack_MDGO": (1, "m d g o sound sheets"),
    "L1/1_1_Tap_Tap_Tap_Pack": (1, "Tap! Tap! Tap! book pack"),
    "L1/1_2_Mud_on_Dog_Pack": (1, "The Mud on the Dog book pack"),
    "Sound_Pack_L2": (2, "Level 2 sound sheets"),
    "Sound_Pack_SHNK": (3, "sh and nk sound sheets"),
    "L1/1_3_Fish_in_Tank_Pack": (3, "The Fish in the Tank book pack"),
    "Level_3_Pack": (3, "Level 3 practice pack"),
}


def worksheets():
    items = []
    for f in sorted(glob.glob(os.path.join(ROOT, "public/worksheets/**/*.pdf"), recursive=True)):
        rel = os.path.relpath(f, os.path.join(ROOT, "public/worksheets")).replace("\\", "/")
        folder = rel.rsplit("/", 1)[0]
        if folder not in WS_LEVEL:
            print(f"warning: unmapped worksheet folder {folder}", file=sys.stderr)
            continue
        lvl, pack = WS_LEVEL[folder]
        fname = os.path.basename(f)[:-4]
        is_pack = not re.match(r"^\d\d_", fname) and not fname.startswith("sound_")
        name = re.sub(r"^\d+_", "", fname).replace("_", " ")
        name = name[:1].upper() + name[1:]
        items.append(dict(level=lvl, pack=pack, name=("Full pack: " if is_pack else "") + name,
                          is_pack=is_pack, url=f"{BASE}/worksheets/{rel}", local=os.path.relpath(f, ROOT).replace("\\", "/")))
    items.sort(key=lambda s: (s["level"], s["pack"], not s["is_pack"], s["url"]))
    return items


def level_line(level):
    return f"Level {level} of 8 · {LEVEL_NAMES[level]}"


def build():
    books = load_books()
    queue = []

    def add(**item):
        item["id"] = f"{len(queue) + 1:03d}"
        queue.append(item)

    for lvl in range(1, 9):
        lvl_books = [b for b in books if b["level"] == lvl]
        # 1) the books themselves
        for b in lvl_books:
            add(kind="book", level=lvl, title=b["title"], sounds=b["sounds"],
                url=f"{BASE}/book-pdfs/{b['file_id']}.pdf", preview_pdf=f"public/book-pdfs/{b['file_id']}.pdf", preview_page=1,
                caption=(f"FREE phonics book: {b['title']}\n"
                         f"{level_line(lvl)} · sounds: {b['sounds']}\n"
                         f"One of 33 decodable books that go in order from first sounds to fluent reading. Book {b['idx']} of Level {lvl}.\n"
                         f"Print it: {BASE}/book-pdfs/{b['file_id']}.pdf\n{SIGN_OFF}"))
        # 2) every activity page inside those books, one per post
        for b in lvl_books:
            for page_no, label, blurb in activity_pages(b):
                url = f"{BASE}/p/{b['file_id']}/{page_no}"
                add(kind="page", level=lvl, title=f"{label} — {b['title']}", sounds=b["sounds"],
                    url=url, preview_pdf=f"public/book-pdfs/{b['file_id']}.pdf", preview_page=page_no,
                    caption=(f"FREE phonics printable: {label} from {b['title']}\n"
                             f"{level_line(lvl)} · sounds: {b['sounds']}\n"
                             f"{blurb}\n"
                             f"Print it: {url}\n"
                             f"Want the whole book? {BASE}/book-pdfs/{b['file_id']}.pdf\n{SIGN_OFF}"))
        # 3) worksheets for the level
        for s in [w for w in worksheets() if w["level"] == lvl]:
            add(kind="worksheet", level=lvl, title=s["name"], sounds=s["pack"],
                url=s["url"], preview_pdf=s["local"], preview_page=1,
                caption=(f"FREE phonics worksheet: {s['name']}\n"
                         f"{level_line(lvl)} · {s['pack']}\n"
                         f"Matches the books at this level, so the practice uses only sounds your child has met.\n"
                         f"Print it: {s['url']}\n{SIGN_OFF}"))

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(queue, f, ensure_ascii=False, indent=1)
    kinds = {k: sum(1 for q in queue if q["kind"] == k) for k in ("book", "page", "worksheet")}
    print(f"wrote {os.path.relpath(OUT, ROOT)}: {len(queue)} posts {kinds}")


if __name__ == "__main__":
    build()
