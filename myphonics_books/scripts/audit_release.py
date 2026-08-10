"""Release gate — ONE command that must pass before books ship.

Chains every automated QA check so problems are caught by script, not by
Lynden flipping through printed books.  Non-zero exit on ANY failure.

    py -3.12 -X utf8 scripts/audit_release.py

Checks:
  1. Sound-button audit         — 0 mis-segmented words (audit_sound_buttons)
  2. Tricky-word master audit   — 0 mislisted decodable words (audit_tricky_words)
  3. Decodability + Future Sounds coverage — every story-text violation must
     be PREVIEWABLE: either its missing units fit the page-2 Future Sounds
     band (≤ FUTURE_MAX_PER_BOOK per book, each unit on the roadmap) or the
     word is in that book's tricky_words_used.  Un-previewable words fail.
  4. Alien words are alien      — no nonsense word may be a real word
     (checked against ALL word banks + a curated blacklist).
  5. Back cover integrity       — SERIES_LEVELS is exactly the 8 ledger
     levels with ledger colours, and every journey cover thumb exists.
  6. Regression tripwires       — words Lynden explicitly de-listed from the
     tricky master (2026-07-03/12) must never reappear (guards against the
     migrate_8level_data.py stale-snapshot class of bug).
"""
import json
import re
import subprocess
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
ROOT = BASE.parent
sys.path.insert(0, str(BASE))
sys.path.insert(0, str(ROOT))

FAILURES: list[str] = []


def fail(msg: str) -> None:
    FAILURES.append(msg)
    print(f"  FAIL  {msg}")


def ok(msg: str) -> None:
    print(f"  ok    {msg}")


# ── 1 + 2: chain the existing audits as subprocesses ─────────────────────
def run_child_audits() -> None:
    print("\n[1] Sound-button audit")
    r = subprocess.run([sys.executable, "-X", "utf8", str(BASE / "audit_sound_buttons.py")],
                       capture_output=True, text=True, encoding="utf-8")
    out = (r.stdout or "") + (r.stderr or "")
    m = re.search(r"(\d+) unmarked-unit words", out)
    if r.returncode != 0 or not m or int(m.group(1)) != 0:
        fail(f"sound-button audit: {'exit ' + str(r.returncode) if r.returncode else out.strip().splitlines()[-1]}")
    else:
        ok("0 mis-segmented sound-button words")

    print("\n[2] Tricky-word master audit")
    r = subprocess.run([sys.executable, "-X", "utf8", str(BASE / "audit_tricky_words.py")],
                       capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0:
        tail = ((r.stdout or "") + (r.stderr or "")).strip().splitlines()[-3:]
        fail("tricky-word audit failed: " + " | ".join(tail))
    else:
        ok("0 mislisted tricky words")


# ── 3: decodability — every violation must be previewable ────────────────
def check_decodability_coverage() -> None:
    print("\n[3] Decodability + Future Sounds coverage")
    from generate_pilot_books import get_pilot_stories, LEVEL_KEYS, NEW_TO_OLD
    from v2_helpers import (taught_graphemes, all_known_units, can_decode,
                            missing_units, _grapheme_taught_level,
                            FUTURE_MAX_PER_BOOK)
    graphemes_data = json.load(open(ROOT / "data" / "graphemes_by_level.json", encoding="utf-8"))
    tricky_data = json.load(open(ROOT / "data" / "tricky_words_by_level.json", encoding="utf-8"))
    known_units = all_known_units(graphemes_data)
    master_tricky = set()
    for lv in range(1, 9):
        master_tricky |= {w.lower() for w in tricky_data.get(f"level_{lv}", {}).get("new_tricky_words", [])}

    stories = get_pilot_stories()
    books_checked = 0
    for new_id in sorted(NEW_TO_OLD, key=lambda k: [int(p) for p in k.split(".")]):
        key = LEVEL_KEYS.get(NEW_TO_OLD[new_id])
        story = stories.get(key) if key else None
        if not story:
            fail(f"L{new_id}: story missing")
            continue
        books_checked += 1
        level = int(new_id.split(".")[0])
        taught = taught_graphemes(graphemes_data, level, story.get("focus_graphemes", []))
        author_tricky = {w.lower() for w in story.get("tricky_words_used", [])}
        text = " ".join(p["text"] for p in story.get("story_pages", []))
        future_units: set[str] = set()
        for tok in {t.strip("'").lower() for t in re.findall(r"[A-Za-z']+", text)}:
            w = tok[:-2] if tok.endswith("'s") else tok
            if not w or w in master_tricky or w in author_tricky:
                continue
            # Contractions: the apostrophe is spelling, not a sound — "can't"
            # segments as c-a-n-t (same normalisation as build_future_sounds).
            w = w.replace("'", "")
            missing = missing_units(w, taught, known_units)
            if not missing:
                continue
            if missing == {w}:
                fail(f"L{new_id}: '{w}' unsegmentable and not tricky-listed — un-previewable")
                continue
            for u in missing:
                if _grapheme_taught_level(u, graphemes_data) is None:
                    fail(f"L{new_id}: '{w}' needs '{u}' which no level teaches — un-previewable")
                else:
                    future_units.add(u)
        if len(future_units) > FUTURE_MAX_PER_BOOK:
            fail(f"L{new_id}: {len(future_units)} future sounds > band cap {FUTURE_MAX_PER_BOOK} — some drop silently")
        # Activity words must be FULLY decodable — no preview escape hatch.
        # missing_units (not bare can_decode) so the -ed honesty rule
        # applies: "chewed" in read_words is a failure below L7.
        for field in ("read_words", "nonsense_words", "writing_words"):
            for w in story.get(field, []):
                if missing_units(w.strip("'").lower(), taught, known_units):
                    fail(f"L{new_id}: {field} '{w}' not decodable at this book")
        # Story Words are presented as "sound out each phoneme, then blend", so
        # an undecodable -ed suffix word ("shouted", "pointed") must NOT sit
        # there even though it's a genuine Future Sound (Lynden 2026-07-22):
        # it belongs in the story text, taught by the -ed note.  Targeted at
        # -ed suffixes so plain CVC blends never trip it; stared/tired pass
        # because they decode via are/ire (missing_units empty).
        for w in story.get("story_words", []):
            wl = w.strip("'").lower()
            if (wl.endswith("ed") and len(wl) >= 5 and wl[-3] not in "aeiou"
                    and missing_units(wl, taught, known_units)):
                fail(f"L{new_id}: story_words '{w}' is an undecodable -ed word "
                     f"— move it to the story text, not the sound-out grid")
    ok(f"{books_checked} books: all violations previewable, activity words clean")


# ── 4: nonsense words must not be real words ─────────────────────────────
# Curated trap list: real words that LOOK like CVC/CVCC nonsense.  Word
# banks catch most; these cover slang/informal words banks omit.
REAL_WORD_BLACKLIST = {
    "tink", "donk", "bunk", "shim", "bonk", "zonk", "monk", "honk", "sunk",
    "dunk", "hunk", "junk", "punk", "gunk", "funk", "mink", "rink", "sink",
    "wink", "link", "pink", "kink", "dink", "fink", "yonks", "conk", "tosh",
    "posh", "gosh", "gash", "dosh", "mash", "dash", "cash", "bash", "rash",
    "sash", "hash", "lash", "gush", "mush", "hush", "rush", "lush", "bush",
    "dish", "wish", "fish", "shin", "shed", "shop", "ship", "shot", "shut",
    "wag", "jab", "vat", "keg", "cog", "jig", "jog", "jot", "jut", "vet",
    # caught 2026-07-12 (manual spot + gate first run)
    "yob", "tux", "quid", "spear", "nay", "tee", "ding", "zig", "thud",
    "ping", "ring", "king", "wing", "sing", "zing", "song", "long", "bang",
    "rang", "sang", "gang", "hang", "dong", "gong", "tong", "bong", "wham",
    "smear", "blear", "shear", "clear", "swear", "aft", "dab", "nib", "sop",
}


def check_alien_words() -> None:
    print("\n[4] Alien words are actually alien")
    real: set[str] = set(REAL_WORD_BLACKLIST)
    for f in (ROOT / "data" / "word_banks").glob("level_*_words.json"):
        try:
            bank = json.load(open(f, encoding="utf-8"))
            real |= {w.lower() for w in bank.get("words", [])}
        except Exception as exc:
            fail(f"word bank {f.name}: {type(exc).__name__}: {exc}")
    from generate_pilot_books import get_pilot_stories, LEVEL_KEYS, NEW_TO_OLD
    stories = get_pilot_stories()
    hits = 0
    for new_id in sorted(NEW_TO_OLD, key=lambda k: [int(p) for p in k.split(".")]):
        story = stories.get(LEVEL_KEYS.get(NEW_TO_OLD[new_id]))
        if not story:
            continue
        for w in story.get("nonsense_words", []):
            if w.lower() in real:
                fail(f"L{new_id}: alien word '{w}' is a REAL word")
                hits += 1
    if not hits:
        ok("no real words hiding in nonsense-word lists")


# ── 5: back cover integrity ──────────────────────────────────────────────
def check_back_cover() -> None:
    print("\n[5] Back cover journey integrity")
    from generate_book import SERIES_LEVELS, LEVEL_COLOURS, LEVEL_NAMES
    if len(SERIES_LEVELS) != 8:
        fail(f"SERIES_LEVELS has {len(SERIES_LEVELS)} levels, expected 8")
        return
    for lvl in SERIES_LEVELS:
        n = lvl["num"]
        if lvl["colour"] != LEVEL_COLOURS[n]:
            fail(f"SERIES_LEVELS L{n} colour {lvl['colour']} != ledger {LEVEL_COLOURS[n]}")
        if lvl["name"] != LEVEL_NAMES[n]:
            fail(f"SERIES_LEVELS L{n} name '{lvl['name']}' != ledger '{LEVEL_NAMES[n]}'")
        cover = ROOT.parent / "public" / "covers" / f"{lvl['legacy_key']}_cover.jpg"
        if not cover.exists():
            fail(f"journey thumb source missing: {cover.name}")
    if not FAILURES or all("SERIES_LEVELS" not in f and "journey thumb" not in f for f in FAILURES):
        ok("8 ledger levels, ledger colours, all 8 cover thumbs present")


# ── 6: regression tripwires ──────────────────────────────────────────────
# Lynden's explicit de-listings.  If any reappear, a stale snapshot
# (e.g. migrate_8level_data.py) has clobbered the data again.
NEVER_TRICKY = {
    "fast", "last", "past", "after", "father", "class", "grass", "pass",
    "plant", "path", "bath",   # /ar/-a family — ruled decodable 2026-07-03
    "out",                      # ou taught L4 — ruled decodable 2026-07-12
}


def check_tripwires() -> None:
    print("\n[6] Regression tripwires")
    tricky_data = json.load(open(ROOT / "data" / "tricky_words_by_level.json", encoding="utf-8"))
    hits = 0
    for lv in range(1, 9):
        entry = tricky_data.get(f"level_{lv}", {})
        for fld in ("new_tricky_words", "cumulative"):
            for w in entry.get(fld, []):
                if w.lower() in NEVER_TRICKY:
                    fail(f"'{w}' is back in tricky level_{lv}.{fld} — stale-snapshot regression!")
                    hits += 1
    graphemes = json.load(open(ROOT / "data" / "graphemes_by_level.json", encoding="utf-8"))
    for lv, g in (("level_4", "wh"), ("level_6", "ph")):
        if g not in graphemes.get(lv, {}).get("graphemes", []):
            fail(f"promoted grapheme '{g}' missing from {lv} — promotion regressed")
            hits += 1
    if "ve" in graphemes.get("level_5", {}).get("graphemes", []):
        fail("'ve' is in level_5 graphemes — reverted 2026-07-12 (breaks wave/five), must stay Shifty")
        hits += 1
    if not hits:
        ok("no de-listed tricky words resurrected; grapheme promotions intact")


# ── 7: tricky/decodable contradictions per book ──────────────────────────
# A word must never be BOTH declared decodable (story_words / read_words)
# and tricky-listed in the same book, and an authored tricky_words_used
# entry that has honestly graduated at that book's window is a data slip
# ("saw" at L7.2 — Lynden 2026-07-13, "Near the Door" catch).
def check_tricky_contradictions() -> None:
    print("\n[7] Tricky vs decodable contradictions")
    from generate_pilot_books import get_pilot_stories, LEVEL_KEYS, NEW_TO_OLD
    from v2_helpers import taught_graphemes
    from audit_tricky_words import has_graduated
    graphemes_data = json.load(open(ROOT / "data" / "graphemes_by_level.json", encoding="utf-8"))
    stories = get_pilot_stories()
    hits = 0
    for new_id in sorted(NEW_TO_OLD, key=lambda k: [int(p) for p in k.split(".")]):
        story = stories.get(LEVEL_KEYS.get(NEW_TO_OLD[new_id]))
        if not story:
            continue
        level = int(new_id.split(".")[0])
        window = taught_graphemes(graphemes_data, level, story.get("focus_graphemes", []))
        declared = {str(w).lower() for w in story.get("story_words", [])} \
            | {str(w).lower() for w in story.get("read_words", [])}
        for w in story.get("tricky_words_used", []):
            wl = w.lower()
            if wl in declared:
                fail(f"L{new_id}: '{w}' is BOTH a story/read word and tricky_words_used")
                hits += 1
            elif has_graduated(w, window):
                fail(f"L{new_id}: tricky_words_used '{w}' is honestly decodable at this book — de-list it")
                hits += 1
    if not hits:
        ok("no word is both decodable and tricky in any book")


# ── 8: spotlight image audit state (no API calls — reads the checkpoint) ──
# Every image the 33 books use must have a CURRENT vision verdict of pass,
# or a human-approved override pinned to this exact file version (see
# output/qa/spotlight_image_overrides.json).  A changed image invalidates
# both its verdict and its override, forcing a fresh vision check
# (py -3.12 -X utf8 scripts/audit_spotlight_images.py).
def check_spotlight_images() -> None:
    print("\n[8] Sound Spotlight image audit state")
    from audit_spotlight_images import collect_usage
    cp_path = ROOT / "output" / "qa" / "spotlight_image_audit.checkpoint.json"
    ov_path = ROOT / "output" / "qa" / "spotlight_image_overrides.json"
    cp = json.load(open(cp_path, encoding="utf-8")) if cp_path.exists() else {}
    ov = json.load(open(ov_path, encoding="utf-8")) if ov_path.exists() else {}
    hits = 0
    for path_s in collect_usage():
        p = Path(path_s)
        key = str(p.relative_to(ROOT)).replace("\\", "/")
        stamp = f"{p.stat().st_mtime_ns}:{p.stat().st_size}"
        entry = cp.get(key)
        if not entry or entry.get("stamp") != stamp:
            fail(f"image not vision-checked at current version: {key} — run audit_spotlight_images.py")
            hits += 1
            continue
        verdict = (entry.get("result") or {}).get("verdict")
        if verdict == "pass":
            continue
        if ov.get(key, {}).get("stamp") == stamp:
            continue  # human-approved at this exact version
        fail(f"image fails vision audit (no override): {key} — "
             f"{(entry.get('result') or {}).get('reason', verdict)}")
        hits += 1
    if not hits:
        ok("every in-use spotlight image passes or is human-approved at its current version")


def check_sound_detective_claims() -> None:
    """No two books may run the same Sound Detective (Lynden 2026-07-29), and
    the allocation file must match the current stories + Shifty ledger."""
    print("\n[9] Sound Detective uniqueness")
    path = ROOT / "data" / "sound_detective_claims.json"
    if not path.exists():
        fail("data/sound_detective_claims.json missing — run "
             "scripts/build_sound_detective_claims.py")
        return
    claims = json.load(open(path, encoding="utf-8")).get("claims", {})
    seen = {}
    dupes = 0
    for book_id, keys in claims.items():
        for k in keys:
            if k in seen:
                fail(f"Sound Detective '{k}' used by BOTH {seen[k]} and {book_id}")
                dupes += 1
            seen[k] = book_id
    rc = subprocess.call(
        [sys.executable, "-X", "utf8",
         str(ROOT / "scripts" / "build_sound_detective_claims.py"), "--check"],
        stdout=subprocess.DEVNULL,
    )
    if rc != 0:
        fail("data/sound_detective_claims.json is STALE — rerun "
             "scripts/build_sound_detective_claims.py and re-render")
        return
    if not dupes:
        ok(f"{len(seen)} Sound Detective rows over {len(claims)} books, all distinct")


MAX_PRONUNCIATION_EXAMPLES = 6


def check_pronunciation_notes() -> None:
    """The "Watch Out — How to Say" box shares page 3 with Focus Sounds, Story
    Words and Tricky Words.  8.2 had grown to NINE entries, six of them the
    same -able pattern, and swamped the page (Lynden 2026-07-29).  Teach the
    pattern in the body text and list only what genuinely varies."""
    print("\n[10] Watch Out box size")
    import re
    over = 0
    for path in sorted((ROOT / "data").glob("*_book1.py")):
        text = path.read_text(encoding="utf-8")
        for block in re.findall(r'"pronunciation_notes".*?"examples":\s*\[(.*?)\]',
                                text, re.S):
            n = len(re.findall(r'"[^"]+→[^"]*"', block))
            if n > MAX_PRONUNCIATION_EXAMPLES:
                fail(f"{path.name}: {n} 'Watch Out' entries "
                     f"(max {MAX_PRONUNCIATION_EXAMPLES}) — teach the pattern "
                     "in the body text instead of listing every word")
                over += 1
    if not over:
        ok(f"no book lists more than {MAX_PRONUNCIATION_EXAMPLES} "
           "'Watch Out' pronunciations")


def check_printed_qrs() -> None:
    """Decode every QR out of the rendered library PDFs and match it against
    the LOCKED registry (data/print_qr_registry.json).

    A printed QR cannot be reissued.  The failure this guards against is
    mundane and fatal: somebody adds a QR with an inline f-string URL, or
    "tidies" a route, and 33 print runs ship codes that will 404 forever.  So
    this does not trust the generator — it reads the actual pixels back out of
    the finished PDF and asserts the decoded string is one the registry
    authorises for that book.  Unknown strings fail; missing codes fail."""
    print("\n[11] Printed QR codes match the locked registry")
    try:
        import cv2
        import numpy as np
    except ImportError:
        fail("opencv (cv2) not available — cannot verify printed QR codes")
        return
    from print_qr import all_printed_urls

    import fitz
    pdfs = sorted((ROOT / "output" / "books" / "print_classroom").rglob("*.pdf"))
    pdfs = [p for p in pdfs if not p.name.startswith("debug")]
    if not pdfs:
        fail("no library PDFs found to check QR codes in")
        return

    detector = cv2.QRCodeDetector()
    checked = 0
    for pdf in pdfs:
        book_id = pdf.stem.split(" ")[0].replace("_", ".")
        try:
            allowed = set(all_printed_urls(book_id).values())
        except KeyError as e:
            fail(str(e))
            continue
        doc = fitz.open(pdf)
        found: set[str] = set()
        for page in doc:
            for img in page.get_images(full=True):
                pix = fitz.Pixmap(doc, img[0])
                if pix.n > 3:
                    pix = fitz.Pixmap(fitz.csRGB, pix)
                arr = np.frombuffer(pix.samples, dtype=np.uint8).reshape(
                    pix.height, pix.width, pix.n)
                # QRs render small; upscale so the detector has enough pixels.
                if pix.width < 300:
                    arr = cv2.resize(arr, None, fx=4, fy=4,
                                     interpolation=cv2.INTER_NEAREST)
                try:
                    data, *_ = detector.detectAndDecode(arr)
                except cv2.error:
                    continue
                if data:
                    found.add(data)
        doc.close()
        rogue = found - allowed
        if rogue:
            fail(f"{book_id}: QR target not in the registry: {sorted(rogue)}")
        elif not found:
            fail(f"{book_id}: no QR codes decoded — check the onboarding page")
        else:
            checked += 1
    if checked:
        ok(f"{checked} books: every decoded QR is a locked /b/... registry URL")


def main() -> int:
    print("MyPhonicsBooks release gate")
    print("=" * 45)
    run_child_audits()
    check_decodability_coverage()
    check_alien_words()
    check_back_cover()
    check_tripwires()
    check_tricky_contradictions()
    check_spotlight_images()
    check_sound_detective_claims()
    check_pronunciation_notes()
    check_printed_qrs()
    print("\n" + "=" * 45)
    if FAILURES:
        print(f"RELEASE GATE: {len(FAILURES)} FAILURE(S) — DO NOT PUBLISH")
        return 1
    print("RELEASE GATE: ALL CHECKS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
