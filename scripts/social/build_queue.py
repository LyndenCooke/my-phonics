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
# Published books are in Supabase Storage, not the Vercel deploy (.vercelignore: *.pdf).
BOOK_URL = "https://jfbgdeyjngvzpfucwpuk.supabase.co/storage/v1/object/public/book-pdfs/a5/{id}.pdf"
OUT = os.path.join(ROOT, "marketing", "social", "queue.json")

LEVEL_NAMES = {1: "Ditties", 2: "First Sounds", 3: "Special Friends", 4: "Longer Sounds",
               5: "New Spellings", 6: "Building Fluency", 7: "Reading Together", 8: "Reading Champion"}

SIGN_OFF = "All 33 books, worksheets and games are free on our page: MyPhonicsBooks"

# Activity page types found inside the books, keyed by how the page's text starts.
# (text prefix, label, learning objective, how to use).  {sounds} is filled per book.
PAGE_TYPES = [
    ("Our Sounds", "Sound mat",
     "Say every sound in this book, including the new ones: {sounds}.",
     "Point to each sound and say it as a pure sound (mmm, not em). Do the whole mat once before reading the story, then once more the next day."),
    ("Story Words", "Story words",
     "Blend the story's words before meeting them in the story.",
     "Say each sound under the word, then push them together into the word. Underlined letters work as one sound. Two or three words a time is plenty."),
    ("Sound Spotlight", "Sound Spotlight",
     "Read words that use this book's focus sounds: {sounds}.",
     "Say the sound at the top, then read the three words beneath it. Ask your child to point to the sound inside each word."),
    ("Trace & Form", "Trace & Form",
     "Form the focus sounds correctly: {sounds}.",
     "Trace the grey letters slowly while saying the sound, then write two more on the line without help."),
    ("Alien Words", "Alien Words Challenge",
     "Decode made-up words using only phonics, the exact skill the Year 1 phonics screening check tests.",
     "Sound out each alien word and blend it. Because they aren't real words, guessing can't work, so this shows whether the sounds are really secure."),
    ("Put the Story in Order", "Story sequencing",
     "Retell the story in the right order.",
     "Number the pictures 1, 2, 3, 4. Then tell the story from the pictures using first, next, then and last."),
    ("Tell the Story", "Tell the Story",
     "Retell the story in your own words.",
     "Use the numbered pictures as prompts. Aim for one sentence per picture. This builds comprehension and spoken sentences, not reading."),
    ("Your Turn to Write", "Your Turn to Write",
     "Write a short retell of the story using sentence starters.",
     "Read the starters together, choose one goal to tick, then write. Spell by sounding out; don't correct every mistake."),
    ("Talk About It", "Talk About It",
     "Answer finding, thinking and feeling questions about the story.",
     "Finding questions have the answer on the page. Thinking questions need a reason. Feeling questions have no wrong answer. Talk, don't write."),
    ("Word Workshop", "Grammar Spotlight",
     "Practise one grammar skill taken from this story.",
     "Read the rule box together, then do the challenge. One skill only, so it sticks."),
    ("Can You Read These?", "Can You Read These?",
     "Read words with this book's sounds and pick the right word for each sentence.",
     "Sound out each word first. Then read each sentence and choose the word that fits the gap."),
    ("Shifty Sounds", "Shifty Sounds",
     "Recognise different spellings of the same sound.",
     "Read down each column. The spelling changes but the sound stays the same. Say the sound out loud each time."),
]


def worksheet_objective(s):
    """(objective, how) for a worksheet, from its pack and name."""
    name = s["name"].replace("Full pack: ", "")
    low = name.lower()
    if low.startswith("sound "):
        g = name.split(" ", 1)[1]
        return (f"Hear, say, read and write the sound {g}.",
                "Say the sound, circle the pictures that start with it, then trace and write it. One sound per sheet, so nothing is mixed in.")
    if "sound hunt" in low:
        return ("Spot the book's sounds at the start of words.", "Say each picture word and listen for the first sound. Circle the ones that match.")
    if "trace" in low or "tap the sounds" in low:
        return ("Form the book's new sounds correctly.", "Trace slowly while saying the sound, then write it on your own.")
    if "read and do" in low:
        return ("Read a short instruction and act on it.", "Sound out each word, read the whole line, then do what it says. This proves the reading was understood.")
    if "alien" in low:
        return ("Decode made-up words, the skill the Year 1 phonics screening check tests.", "Sound out and blend. No guessing is possible with alien words.")
    if "story and draw" in low:
        return ("Read a sentence and show understanding by drawing it.", "Read the sentence, then draw exactly what it says. Compare the picture with the words.")
    if "sound sort" in low:
        return ("Sort words by the sound they contain.", "Read each word, decide which sound it has, and write it in the right column.")
    if "blend clusters" in low:
        return ("Blend two consonants together at the start of words.", "Say both sounds quickly, then the rest of the word. Keep the two sounds separate; they aren't one sound.")
    if "tricky words" in low:
        return ("Read the tricky words that can't be fully sounded out.", "Say the sound that is tricky, then read the whole word. Read them daily until they're instant.")
    if "full stop" in low:
        return ("Choose between a full stop and a question mark.", "Read each sentence aloud. If your voice goes up and it asks something, it needs a question mark.")
    if "capitals" in low:
        return ("Use capital letters for names.", "Find the names in each sentence and rewrite them with a capital letter.")
    if s["is_pack"]:
        return (f"The complete {s['pack']} in one PDF.", "One sheet a day, in order. Each builds on the last.")
    return ("Practise the sounds from this level's books.", "Sound out, blend, and check against the pictures.")


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
    """Yield (page_no, label, objective, how) for every standalone activity page in the book PDF."""
    doc = fitz.open(os.path.join(ROOT, "public/book-pdfs", f"{book['file_id']}.pdf"))
    for i, page in enumerate(doc, 1):
        text = " ".join(page.get_text().split())
        for key, label, objective, how in PAGE_TYPES:
            if text.startswith(key):
                yield i, label, objective, how
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


def page_list(nums):
    """[2,3,12,13,14,17] -> '2-3,12-14,17' for the /p/<book>/<pages> route."""
    nums = sorted(nums)
    out, start, prev = [], nums[0], nums[0]
    for n in nums[1:] + [None]:
        if n is not None and n == prev + 1:
            prev = n
            continue
        out.append(f"{start}-{prev}" if prev > start else str(start))
        if n is not None:
            start = prev = n
    return ",".join(out)


def level_line(level):
    return f"Level {level} of 8 · {LEVEL_NAMES[level]}"


# Two worksheets per book, each a progression of tasks toward one purpose.
# (label as found by activity_pages, short verb for the subline, one-line purpose of the step)
SOUNDS_STEPS = [
    ("Sound Spotlight", "read", "Say the focus sound, then read the words that use it."),
    ("Trace & Form", "write", "Trace the sound while saying it, then write it on your own."),
    ("Alien Words Challenge", "decode", "Sound out made-up words with the focus sounds. No guessing is possible, so this checks the sound is secure."),
    ("Can You Read These?", "apply", "Read real words with the sounds and choose the right word for each sentence."),
    ("Shifty Sounds", "compare", "Read the same sound in its different spellings."),
]
STORY_STEPS = [
    ("Story sequencing", "order", "Number the pictures in the order the story happened."),
    ("Tell the Story", "retell", "Retell the story from the pictures, one sentence per picture."),
    ("Your Turn to Write", "write", "Write a short retell using the sentence starters."),
    ("Talk About It", "discuss", "Answer finding, thinking and feeling questions together."),
    ("Grammar Spotlight", "grammar", "Practise the one grammar point the story uses."),
]


def compose_worksheets(book, pages):
    """Yield the sounds worksheet and the story worksheet for a book, each a
    dict with name, objective, how, steps [(page_no, label, verb, purpose)], url."""
    by_label = {label: page_no for page_no, label, _, _ in pages}

    def pick(steps):
        return [(by_label[l], l, v, p) for (l, v, p) in steps if l in by_label]

    sounds = pick(SOUNDS_STEPS)
    story = pick(STORY_STEPS)
    if sounds:
        yield dict(name="Sounds worksheet",
                   objective=f"Read, write and decode this book's focus sounds: {book['sounds']}.",
                   how="Do the tasks in order, one sitting or one a day. Read before writing, write before decoding. Stop while it's still going well.",
                   steps=sounds, url=f"{BASE}/p/{book['file_id']}/{page_list(s[0] for s in sounds)}")
    if story:
        yield dict(name="Story worksheet",
                   objective=f"Show understanding of {book['title']} by putting it in order, retelling it and talking about it.",
                   how="Read the story again first. Then do the tasks in order: order the pictures, retell out loud, then the questions. Talking counts; not everything needs writing.",
                   steps=story, url=f"{BASE}/p/{book['file_id']}/{page_list(s[0] for s in story)}")


def build():
    books = load_books()
    queue = []

    def add(**item):
        item["id"] = f"{len(queue) + 1:03d}"
        queue.append(item)

    for lvl in range(1, 9):
        lvl_books = [b for b in books if b["level"] == lvl]
        name = LEVEL_NAMES[lvl]
        # Per book: the book, then its two WORKSHEETS. A worksheet here is a
        # task sequence with one purpose (Lynden 2026-09-20: "singular
        # worksheets should be seen as a task with a progression based on a
        # clear purpose"). Reference pages (Our Sounds, Story Words) are not
        # worksheets and are never posted alone; the book post points to them.
        for b in lvl_books:
            book_url = BOOK_URL.format(id=b["file_id"])
            pages = list(activity_pages(b))
            add(kind="book", level=lvl, level_name=name, title=b["title"], sounds=b["sounds"],
                headline=b["title"], subline=f"Decodable book · sounds {b['sounds']}",
                objective=f"Read a whole story using only the sounds taught so far, up to {b['sounds'].split(', ')[-1]}.",
                url=book_url, preview_pdf=f"public/book-pdfs/{b['file_id']}.pdf", preview_page=1, pdf_url=book_url,
                caption=(f"FREE decodable book: {b['title']}\n"
                         f"{level_line(lvl)} · Book {b['idx']} · sounds: {b['sounds']}\n\n"
                         f"OBJECTIVE: read a whole story using only sounds your child has been taught, so every word can be sounded out. No guessing.\n\n"
                         f"HOW TO USE: pages 2 and 3 are the sound mat and the story words. Say the sounds, blend the words, then read the story together. "
                         f"Two worksheets for this book follow over the next two days: one on its sounds, one on the story.\n\n"
                         f"Print the book: {book_url}\n{SIGN_OFF}"))
            for ws in compose_worksheets(b, pages):
                add(kind="worksheet", level=lvl, level_name=name, title=f"{ws['name']} — {b['title']}", sounds=b["sounds"],
                    headline=ws["name"], subline=f"{b['title']} · {len(ws['steps'])} tasks · " + " → ".join(s[2] for s in ws["steps"]),
                    objective=ws["objective"],
                    url=ws["url"], preview_pdf=f"public/book-pdfs/{b['file_id']}.pdf", preview_page=ws["steps"][0][0], pdf_url=book_url,
                    caption=(f"FREE phonics worksheet: {ws['name']} ({len(ws['steps'])} tasks)\n"
                             f"{level_line(lvl)} · from {b['title']} · sounds: {b['sounds']}\n\n"
                             f"OBJECTIVE: {ws['objective']}\n\n"
                             + "\n".join(f"TASK {i}: {label}. {purpose}" for i, (_, label, _, purpose) in enumerate(ws["steps"], 1)) +
                             f"\n\nHOW TO USE: {ws['how']}\n\n"
                             f"Print the worksheet: {ws['url']}\n"
                             f"The book it belongs to: {book_url}\n{SIGN_OFF}"))
        # Worksheets for the level, after its books
        for s in [w for w in worksheets() if w["level"] == lvl]:
            objective, how = worksheet_objective(s)
            add(kind="worksheet", level=lvl, level_name=name, title=s["name"], sounds=s["pack"],
                headline=s["name"].replace("Full pack: ", ""), subline=f"{s['pack']}",
                objective=objective,
                url=s["url"], preview_pdf=s["local"], preview_page=1, pdf_url=s["url"],
                caption=(f"FREE phonics worksheet: {s['name']}\n"
                         f"{level_line(lvl)} · {s['pack']}\n\n"
                         f"OBJECTIVE: {objective}\n\n"
                         f"HOW TO USE: {how}\n\n"
                         f"Print it: {s['url']}\n{SIGN_OFF}"))

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(queue, f, ensure_ascii=False, indent=1)
    kinds = {k: sum(1 for q in queue if q["kind"] == k) for k in ("book", "worksheet")}
    print(f"wrote {os.path.relpath(OUT, ROOT)}: {len(queue)} posts {kinds}")


if __name__ == "__main__":
    build()
