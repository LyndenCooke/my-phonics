"""Render a Create-A-Book custom book through the REAL book_v2 template.

Called by the forge dev server (server/forge/jobs.mjs) with a JSON spec:
{
  "book_title": str, "child_name": str, "level": int, "focus_sound": str,
  "story_pages": [str, ...],              # page texts in order
  "story_words": [...], "read_words": [...], "questions": [...],
  "alien_words": [...], "tricky_words_used": [...],
  "images_dir": path,                     # cover.jpg / pageN.jpg / hero.jpg
  "out_path": path,                       # where to write the PDF
  "profile": {name, age, country, countryFlag, likes, culture, faith}
}

Missing word-list fields fall back to sensible defaults so books generated
before the schema carried them still render.
"""
import argparse
import asyncio
import json
import re
import sys
import tempfile
from pathlib import Path

from PIL import Image

SCRIPTS = Path(__file__).parent
sys.path.insert(0, str(SCRIPTS))
sys.path.insert(0, str(SCRIPTS.parent))  # for core.pdf_generator

from generate_book import (  # noqa: E402
    build_book_data_from_story,
    render_book_html,
    html_to_pdf,
    image_to_data_uri,
)


def jpgs_to_pngs(src: Path, page_count: int) -> Path:
    """build_book_data_from_story looks for cover.png / pageN.png — the forge
    saves jpegs, so convert into a temp dir."""
    tmp = Path(tempfile.mkdtemp(prefix="custom_book_"))

    def conv(name_in: str, name_out: str) -> None:
        p = src / name_in
        if p.exists():
            Image.open(p).convert("RGB").save(tmp / name_out)

    conv("cover.jpg", "cover.png")
    for i in range(1, page_count + 1):
        conv(f"page{i}.jpg", f"page{i}.png")
    return tmp


def flag_iso(country_flag: str | None) -> str | None:
    """ISO alpha-2 from either a 2-letter code ("GB") or a flag emoji (two
    regional-indicator codepoints)."""
    if not country_flag:
        return None
    s = country_flag.strip()
    if len(s) == 2 and s.isalpha() and s.isascii():
        return s.lower()
    codes = [ord(c) - 0x1F1E6 for c in s if 0x1F1E6 <= ord(c) <= 0x1F1FF]
    if len(codes) == 2:
        return "".join(chr(ord("a") + c) for c in codes)
    return None


def fetch_flag(country_flag: str | None) -> str | None:
    """Real flag PNG as a data URI (flagcdn), or None offline — the page
    renders without it."""
    iso = flag_iso(country_flag)
    if not iso:
        return None
    try:
        import base64
        import urllib.request
        with urllib.request.urlopen(f"https://flagcdn.com/w320/{iso}.png", timeout=10) as r:
            return "data:image/png;base64," + base64.b64encode(r.read()).decode()
    except Exception:
        return None


def fallback_alien_words(focus: str) -> list:
    """Nonsense words for books whose stories predate the alien_words field.
    Frames only use Level-1 letters (s a t p i n m d g o) so they are safe
    at every level."""
    f = focus.lower()
    if len(f) > 1 and f[0] in "aeiou":  # vowel digraph → middle position
        frames = [f"s{f}p", f"m{f}n", f"t{f}d", f"p{f}g"]
    elif len(f) > 1:  # consonant digraph → end position
        frames = [f"ta{f}", f"po{f}", f"mi{f}", f"so{f}"]
    else:  # single letter → start position
        frames = [f"{f}ap", f"{f}ot", f"{f}im", f"{f}an"]
    return frames


def build_custom_book_data(spec: dict, images_dir: Path) -> dict:
    """The one, shared spec -> book_data path. `images_dir` must contain
    cover.jpg / pageN.jpg / hero.jpg / landmark.jpg — where those files come
    from (already on local disk, or just-decoded from base64) is the only
    thing that differs between the local CLI render and the serverless HTML
    render; everything past this point must stay byte-for-byte identical or
    the two renderers WILL drift. The serverless renderer (api/render-book-
    html.py) calls this SAME function; it just populates images_dir by
    fetching each page's Supabase Storage URL over HTTPS instead of reading
    an already-local directory."""
    page_texts = spec["story_pages"]
    focus = spec["focus_sound"]

    tmp_images = jpgs_to_pngs(images_dir, len(page_texts))

    # Page count follows the level, same as the real 33-book library —
    # Lynden 2026-08-09: "16 for 1-4 and 20 for 5-8." (Custom books use a
    # different split to the library's own 16/L1-3, 20/L4-8 — this is the
    # Create-A-Book ruling specifically, not a correction of the library.)
    # Previously this was hardcoded to 16 for every level, so a Level 5+
    # custom book shipped without the fuller Word Workshop / Writing
    # Practice / etc. page set a real book at that level gets.
    level_num = int(spec["level"])
    page_count = 16 if level_num <= 4 else 20

    questions = spec.get("questions") or [
        "Who is the star of the story?",
        "What happened at the end?",
        f'Can you spot the sound "{focus}" in the story?',
    ]

    story_dict = {
        "level": int(spec["level"]),
        "book_title": spec["book_title"],
        "story_pages": [{"text": t} for t in page_texts],
        "focus_graphemes": [focus],
        "story_words": spec.get("story_words") or [],
        "read_words": spec.get("read_words") or spec.get("story_words") or [],
        "questions": [
            q if isinstance(q, dict) else {"text": q} for q in questions
        ],
        "nonsense_words": spec.get("alien_words") or fallback_alien_words(focus),
        "tricky_words_used": spec.get("tricky_words_used") or [],
        # {word: [index, ...]} — graphemes making a shifty sound in THAT word,
        # so they get the slate diamond instead of a dot (the u in
        # "nutritious" is /oo/, not the /u/ of "up").  Filtered against the
        # ledger's diamond-eligible list at render time, so a bad annotation
        # can only ever be dropped, never invent a mark.
        "shifty_marks": spec.get("shifty_marks") or {},
        # "Watch Out" boxes on the Story Words page — used when the focus
        # grapheme has more than one taught pronunciation.
        "pronunciation_notes": spec.get("pronunciation_notes") or [],
        "sub_level": None,
    }

    book_data = build_book_data_from_story(
        story_dict,
        child_name=spec["child_name"],
        friend_name="",
        image_dir=tmp_images,
        page_count=page_count,
        edition="home",
        # Whole current level counts as taught for a one-off custom book —
        # kills within-level "coming at Level N" labels (see generate_book).
        full_level_window=True,
    )

    # Custom-book sound chart (Lynden 2026-08-13): a Create-A-Book child is not
    # mid-series — the library's "previous level + this level so far" warm-up
    # omitted foundational sounds (a, m, t...) and read as an incomplete chart.
    # Custom books show the FULL cumulative set under "Sounds you should know"
    # (the template switches the label when `profile` is set).
    from generate_book import BASE_DIR as _BOOKS_BASE
    with open(_BOOKS_BASE / "data" / "graphemes_by_level.json", encoding="utf-8") as f:
        _graphemes_data = json.load(f)
    _cumulative_chart = []
    for _lv in range(1, level_num + 1):
        _cumulative_chart.extend(_graphemes_data.get(f"level_{_lv}", {}).get("graphemes", []))
    # The focus sound is TODAY'S NEW SOUND - it must not also sit in the
    # "Sounds you should know" grid, which reads as a progression
    # contradiction (Lynden 2026-08-21: "ur is simultaneously old and new").
    _focus_set = {g.lower() for g in (story_dict.get("focus_graphemes") or [])}
    book_data["chart_graphemes"] = [g for g in _cumulative_chart if g.lower() not in _focus_set]

    # Same principle for Future Sounds: the library's taught-window cuts the
    # current level at the book's focus sound (right for a mid-series reader,
    # wrong for a one-off) — it flagged th as a "future" sound in a Level 3
    # book whose own chart teaches th. For custom books a sound is future
    # only if its home level is genuinely ABOVE this book's level; the forge's
    # writer already uses the full-level window, so this makes the printed
    # page agree with the story's actual decodability rules.
    # -ed policy (Lynden 2026-08-15, option (a) "for the minute"): stories
    # narrate in the past tense, so -ed words saturate every custom book. At
    # L4+ the suffix is a DELIBERATELY TAUGHT EXCEPTION — the prep page's
    # three-ways -ed guide (build_ed_guide) does the teaching — so it must
    # not ALSO be labelled a future sound: a book cannot teach a unit and
    # call it "coming at Level 7" on the same spread ("The Train in the
    # Drain" shipped exactly that contradiction).
    book_data["future_sounds"] = [
        s for s in book_data.get("future_sounds", [])
        if s.get("level") and int(s["level"]) > level_num
        and not (level_num >= 4 and s.get("grapheme") == "ed")
    ]

    prof = spec.get("profile") or {}
    hero = images_dir / "hero.jpg"
    landmark_img = images_dir / "landmark.jpg"
    landmark = prof.get("landmark") or {}
    book_data["profile"] = {
        "name": prof.get("name") or spec["child_name"],
        "age": prof.get("age"),
        "city": prof.get("city"),
        "country": prof.get("country"),
        "countryFlag": prof.get("countryFlag"),
        "flagImage": fetch_flag(prof.get("countryFlag")),
        "greeting": prof.get("greeting"),
        "facts": prof.get("facts") or [],
        "landmark": {
            "name": landmark.get("name"),
            "fact": landmark.get("fact"),
            "image": image_to_data_uri(landmark_img) if landmark_img.exists() else None,
        } if landmark else None,
        "likes": prof.get("likes"),
        "culture": prof.get("culture"),
        "faith": prof.get("faith"),
        "heroImage": image_to_data_uri(hero) if hero.exists() else None,
    }
    return book_data


def assert_decodable(spec: dict) -> None:
    """Hard gate: nothing that lies about decoding may reach a printed page.

    The Story Words page says "Sound out each phoneme, then blend", and the
    splitter silently dots any letter it cannot match - so an untaught or
    dishonest spelling printed as though it behaved ("knack" as k-n-a-ck,
    "listened" as eight dots). That breaks the 100% decodable claim at the
    exact place the claim is made, so it fails the build (Lynden 2026-08-21).
    The TITLE is checked too: it is the first thing a child tries to read.
    """
    sys.path.insert(0, str(SCRIPTS))
    from v2_helpers import decode_problems
    from generate_book import BASE_DIR as _BD
    level = int(spec["level"])
    with open(_BD / "data" / "graphemes_by_level.json", encoding="utf-8") as f:
        cumulative = json.load(f)[f"level_{level}"]["cumulative_graphemes"]
    with open(_BD / "data" / "tricky_words_by_level.json", encoding="utf-8") as f:
        tricky = {w.lower() for w in json.load(f)[f"level_{level}"]["cumulative"]}
    name = str(spec.get("child_name") or "").lower()

    def _check(words, where):
        words = [w for w in words if w and w.lower() not in tricky and w.lower() != name]
        return [f"{where}: {r}" for r in decode_problems(words, cumulative)]

    problems = _check(spec.get("read_words") or [], "practice word")
    problems += _check(spec.get("story_words") or [], "story word")
    problems += _check(re.findall(r"[A-Za-z']+", spec.get("book_title") or ""), "TITLE")
    if problems:
        raise SystemExit("decodability gate:" + chr(10) + chr(10).join("  - " + p for p in problems))

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", required=True, help="Path to the book spec JSON")
    args = ap.parse_args()

    spec = json.loads(Path(args.json).read_text(encoding="utf-8"))
    images_dir = Path(spec["images_dir"])

    assert_decodable(spec)
    book_data = build_custom_book_data(spec, images_dir)

    html = render_book_html(book_data)
    out = Path(spec["out_path"])
    out.parent.mkdir(parents=True, exist_ok=True)
    asyncio.run(html_to_pdf(html, out))

    # HARD PAGE-COUNT GATE (Lynden 2026-08-13, after a 17-page L3 export):
    # 16 total pages at L1-4, 20 at L5-8 — anything else cannot saddle-stitch
    # and must never ship. Fail the render, don't warn.
    from pypdf import PdfReader
    expected = 16 if int(spec["level"]) <= 4 else 20
    got = len(PdfReader(out).pages)
    if got != expected:
        out.unlink(missing_ok=True)
        raise SystemExit(
            f"page-count gate: rendered {got} pages, Level {spec['level']} requires exactly {expected}"
        )
    # PRINT MASTERS (Lynden 2026-08-21): the A5 render is the SCREEN file.
    # A print vendor needs 3mm bleed with a stamped TrimBox and the cover
    # supplied separately from the text block - the fleet already has both
    # steps, and the custom path simply never called them, so every custom
    # PDF was trim-size, bleedless and single-file. --print-masters runs the
    # same chain the classroom books use.
    if spec.get("print_masters") or "--print-masters" in sys.argv:
        from make_print_masters import make_master
        from split_for_bookvault import split
        master = out.with_name(out.stem + "_print.pdf")
        make_master(out, master, barcode=False)
        pdir = out.parent / "print"
        info = split(master, pdir)  # returns page counts; files land in pdir
        print(f"print master: {master}")
        print(f"cover file:   {pdir / 'cover.pdf'}")
        print(f"text file:    {pdir / 'text.pdf'} ({info['interior']}pp of {info['total']})")

    print(str(out))


if __name__ == "__main__":
    main()
