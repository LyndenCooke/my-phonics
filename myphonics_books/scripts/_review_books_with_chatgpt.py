"""
Review every generated MyPhonicsBooks PDF using ChatGPT (OpenAI) vision.

For each book PDF:
  1. Open the PDF and render each page as a PNG (pymupdf).
  2. Send all pages as images to a vision-capable OpenAI model along with
     the book's level data (graphemes_by_level, tricky_words_by_level) and
     the source story text.
  3. Save a structured review to output/reviews/{Level}/{book}.md covering:
       - grammar / spelling errors
       - tricky-word scheme adherence (any non-cumulative tricky words used)
       - sound scheme adherence (any words that use untaught graphemes)
       - "story words" that are actually tricky words (not decodable)
       - writing-task fit for the level (lines, scaffold, prompts)
       - text-image consistency (animal anatomy, eye colour, etc.)
       - missing illustrations on any page
       - any other concrete defects with exact page numbers + suggested fix

Run from `myphonics_books/`:
    py -3.12 scripts/_review_books_with_chatgpt.py             # all books
    py -3.12 scripts/_review_books_with_chatgpt.py L5          # one level
    py -3.12 scripts/_review_books_with_chatgpt.py "L5/5_2 Near the Door.pdf"

Uses gpt-5 with reasoning=high; falls back to gpt-4.1 / gpt-4o.
"""

from __future__ import annotations

import base64
import io
import json
import os
import re
import sys
import time
from pathlib import Path

# ─── Env / API key ────────────────────────────────────────────────
ROOT = Path(__file__).parent.parent
ENV_PATH = ROOT / ".env"

api_key = os.environ.get("OPENAI_API_KEY")
if not api_key and ENV_PATH.exists():
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        if line.startswith("OPENAI_API_KEY="):
            api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
            break
if not api_key:
    sys.exit("No OPENAI_API_KEY found in env or .env")

import fitz  # pymupdf
import httpx

# The openai SDK 2.21.0 hangs locally — bypass it and POST directly to the
# Responses API via httpx (proven to work in standalone tests).
HTTP = httpx.Client(
    base_url="https://api.openai.com/v1",
    headers={"Authorization": f"Bearer {api_key}"},
    timeout=httpx.Timeout(connect=15.0, read=600.0, write=600.0, pool=15.0),
)

# ─── Scheme data (loaded once) ────────────────────────────────────
GRAPHEMES = json.loads((ROOT / "data" / "graphemes_by_level.json").read_text(encoding="utf-8"))
TRICKY = json.loads((ROOT / "data" / "tricky_words_by_level.json").read_text(encoding="utf-8"))

# ─── Story-data registry ──────────────────────────────────────────
# Map "L{level}_{sub}" → story-data .py file in data/.
STORY_FILES: dict[str, Path] = {}
for p in (ROOT / "data").glob("*_story_l*_book*.py"):
    m = re.search(r"_l(\d+)_(\d+)_book", p.name)
    if m:
        STORY_FILES[f"L{m.group(1)}_{m.group(2)}"] = p


def load_story_meta(level: int, sub: int) -> dict | None:
    """Best-effort load of a book's story dict from data/."""
    key = f"L{level}_{sub}"
    path = STORY_FILES.get(key)
    if not path:
        return None
    try:
        ns: dict = {}
        exec(path.read_text(encoding="utf-8"), ns)
        for v in ns.values():
            if isinstance(v, dict) and f"L{level}_{sub}_B1" in v:
                return v[f"L{level}_{sub}_B1"]
    except Exception as e:
        print(f"  ! could not load {path.name}: {e}", file=sys.stderr)
    return None


# ─── PDF rendering ────────────────────────────────────────────────
def render_pages(pdf_path: Path, dpi: int = 110) -> list[bytes]:
    doc = fitz.open(pdf_path)
    pages: list[bytes] = []
    zoom = dpi / 72.0
    matrix = fitz.Matrix(zoom, zoom)
    for page in doc:
        pix = page.get_pixmap(matrix=matrix, alpha=False)
        pages.append(pix.tobytes("png"))
    doc.close()
    return pages


def encode_b64(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")


# ─── Prompt construction ──────────────────────────────────────────
SYSTEM = (
    "You are a senior UK literacy specialist (Letters & Sounds + RWI) reviewing "
    "a printable A5 decodable phonics book intended for ages 4-8. The book is "
    "delivered as a stack of page images. You read every page, treat the book "
    "as a unit, and produce ONE structured review. Be concrete, terse, and "
    "actionable. British English throughout. Quote the exact wording you would "
    "change. Always cite the exact page number. If something is fine, say so "
    "in one line — don't pad. Never invent issues."
)

REVIEW_TEMPLATE = """# Book under review

- Title: {title}
- Level: L{level} ({level_name}) — sub-level {sub}
- Page count of PDF: {page_count}
- Focus graphemes for this book: {focus_graphemes}

# Phonics scheme — what the child is allowed to read at this level

Cumulative graphemes (taught at L{level} or below):
{cumulative_graphemes}

Cumulative tricky words (must be told to the child — NOT decodable):
{cumulative_tricky}

NEW tricky words first introduced at L{level}:
{new_tricky}

# Source story text (Jinja-rendered onto the story pages)

{story_text}

# Declared in the book data
- "story_words" (must all be DECODABLE at this level — never tricky words):
  {story_words}
- "tricky_words_used" (declared by the author — should match what's in the text):
  {tricky_words_used}
- "writing_words" (what the writing task practises): {writing_words}
- "writing_starters": {writing_starters}

# What I want from you — produce these sections, in this exact order

## 1. Sound-scheme audit
For every story page (4 onwards), list any word in the rendered text that
contains a grapheme NOT in the cumulative list AND is NOT a cumulative
tricky word. If everything is clean, say "Clean." Otherwise: page → word →
offending grapheme → recommended replacement.

## 2. Tricky-word audit
- Any tricky word used that is NOT in the cumulative list at this level?
- Any word the data file calls a "story word" that is in fact a tricky
  word at this level (i.e. not decodable from the cumulative graphemes)?
- Any tricky word in the text that the data file failed to declare under
  "tricky_words_used"?

## 3. Grammar / mechanics
Spelling, capitalisation, punctuation, agreement. Page → defect → fix.

## 4. Text–image consistency
Look at every story page image vs its text. Report mismatches: animal
anatomy, body parts, eye colour, expressions, what's poking out from
behind a tree, who is doing what, weather, posture, count of objects.
Watch carefully for: text says "bright eyes" but illustration uses tiny
solid black dot eyes; text says "ear" but image shows tail (or vice
versa); text says one animal but the image shows another.

## 5. Missing illustrations
Any page where the illustration is missing, blank, broken, a placeholder,
or just a coloured box where there should be a scene? Page numbers please.

## 6. Writing-task fit for the level
On the writing/retell pages, judge whether: line count, line type
(handwriting paper vs plain ruled), starter words, sentence length, and
any "writing goals" checklist match what a child at L{level} can
realistically produce. If the writing space looks squashed, say so.
Recommend exact line counts and prompt wording.

## 7. Activity difficulty
Are the activities (match-to-picture, ordering, comprehension questions,
draw-your-favourite-part, dictation) calibrated for L{level}? If
match-to-picture or word-to-picture matching looks too easy for this
level, say so and suggest a tougher swap (e.g. sentence-to-picture).

## 8. Top 5 fixes — ranked
A numbered list. For each: WHERE (page number) → WHAT to change → WHY
it matters at this level. No more than 5.

Keep total length under ~900 words. Use bullets, not paragraphs.
"""


def build_prompt(book: dict, story: dict | None, page_count: int) -> str:
    level = book["level"]
    level_key = f"level_{level}"
    cumulative = GRAPHEMES.get(level_key, {}).get("cumulative_graphemes", [])
    new_tricky = TRICKY.get(level_key, {}).get("new_tricky_words", [])
    cumulative_tricky = TRICKY.get(level_key, {}).get("cumulative", [])
    level_name = GRAPHEMES.get(level_key, {}).get("name", "")

    if story:
        story_text = "\n\n".join(
            f"PAGE {sp.get('page_number', i + 1)}: {sp.get('text', '')}"
            for i, sp in enumerate(story.get("story_pages", []))
        ) or "(no source story_pages found)"
        focus_graphemes = ", ".join(story.get("focus_graphemes", []))
        story_words = ", ".join(story.get("story_words", []))
        tricky_words_used = ", ".join(story.get("tricky_words_used", []))
        writing_words = ", ".join(story.get("writing_words", []))
        writing_starters = " | ".join(story.get("writing_starters", []))
    else:
        story_text = "(source story file not found — review the rendered pages directly)"
        focus_graphemes = "?"
        story_words = "?"
        tricky_words_used = "?"
        writing_words = "?"
        writing_starters = "?"

    return REVIEW_TEMPLATE.format(
        title=book["title"],
        level=level,
        sub=book["sub"],
        level_name=level_name,
        page_count=page_count,
        focus_graphemes=focus_graphemes,
        cumulative_graphemes=", ".join(cumulative),
        cumulative_tricky=", ".join(cumulative_tricky),
        new_tricky=", ".join(new_tricky),
        story_text=story_text,
        story_words=story_words,
        tricky_words_used=tricky_words_used,
        writing_words=writing_words,
        writing_starters=writing_starters,
    )


# ─── OpenAI call ──────────────────────────────────────────────────
MODELS = ("gpt-5", "gpt-5-mini", "gpt-4.1", "gpt-4o")


def review_book(pdf_path: Path, book: dict, story: dict | None) -> tuple[str, str]:
    """Returns (markdown_review, model_used)."""
    pages_png = render_pages(pdf_path)
    page_count = len(pages_png)
    print(f"  rendered {page_count} pages", flush=True)

    prompt = build_prompt(book, story, page_count)

    content: list[dict] = [{"type": "input_text", "text": prompt}]
    for i, png in enumerate(pages_png, 1):
        content.append({"type": "input_text", "text": f"PDF page {i}:"})
        content.append({
            "type": "input_image",
            "image_url": f"data:image/png;base64,{encode_b64(png)}",
        })

    last_err: Exception | None = None
    for model in MODELS:
        try:
            print(f"  -> {model}", flush=True)
            payload = {
                "model": model,
                "instructions": SYSTEM,
                "input": [{"role": "user", "content": content}],
            }
            if model.startswith(("gpt-5", "o")):
                payload["reasoning"] = {"effort": "medium"}
            resp = HTTP.post("/responses", json=payload)
            if resp.status_code != 200:
                raise RuntimeError(f"HTTP {resp.status_code}: {resp.text[:300]}")
            data = resp.json()
            text = _extract_output_text(data)
            if not text:
                raise RuntimeError(f"empty output_text in response: {str(data)[:300]}")
            return text, model
        except Exception as e:
            last_err = e
            print(f"     {model} failed: {type(e).__name__}: {str(e)[:200]}",
                  file=sys.stderr)
    raise RuntimeError(f"All models failed: {last_err}")


def _extract_output_text(data: dict) -> str:
    """Pull the assistant text from a Responses-API JSON payload.

    The Responses API returns `output` as a list of content blocks; the
    final 'message' block contains 'content' blocks with type 'output_text'.
    """
    # Convenience field some payloads include
    if isinstance(data.get("output_text"), str):
        return data["output_text"]
    chunks: list[str] = []
    for block in data.get("output", []) or []:
        if block.get("type") == "message":
            for c in block.get("content", []) or []:
                if c.get("type") in ("output_text", "text") and c.get("text"):
                    chunks.append(c["text"])
    return "\n".join(chunks).strip()


# ─── Discovery ────────────────────────────────────────────────────
def parse_pdf(pdf_path: Path) -> dict | None:
    """Extract level/sub/title from filename like '5_2 Near the Door.pdf'."""
    m = re.match(r"(\d+)_(\d+)\s+(.+)\.pdf$", pdf_path.name, re.IGNORECASE)
    if not m:
        return None
    return {
        "level": int(m.group(1)),
        "sub": int(m.group(2)),
        "title": m.group(3).strip(),
    }


def find_pdfs(filter_arg: str | None) -> list[Path]:
    books_dir = ROOT / "output" / "books"
    pdfs: list[Path] = []
    if filter_arg:
        # Either "L5", "L5/", or a relative/absolute path.
        f = filter_arg.replace("\\", "/").strip("/")
        if re.fullmatch(r"[Ll](\d+)", f):
            level_dir = books_dir / f"Level{f[1:]}"
            pdfs = sorted(level_dir.glob("*.pdf"))
        elif (books_dir / f).exists():
            p = books_dir / f
            pdfs = [p] if p.is_file() else sorted(p.glob("*.pdf"))
        elif Path(filter_arg).exists():
            pdfs = [Path(filter_arg)]
        else:
            sys.exit(f"Could not interpret filter: {filter_arg}")
    else:
        for n in range(1, 7):
            level_dir = books_dir / f"Level{n}"
            if level_dir.is_dir():
                pdfs.extend(sorted(level_dir.glob("*.pdf")))
    # exclude debug/test/preview PDFs
    return [
        p for p in pdfs
        if not p.stem.startswith(("debug_", "v2_test_", "test_"))
        and "WATERMARKED" not in p.name
    ]


# ─── Main ─────────────────────────────────────────────────────────
def main() -> None:
    arg = sys.argv[1] if len(sys.argv) > 1 else None
    pdfs = find_pdfs(arg)
    if not pdfs:
        sys.exit("No PDFs found.")

    out_root = ROOT / "output" / "reviews"
    out_root.mkdir(parents=True, exist_ok=True)

    print(f"Reviewing {len(pdfs)} book(s)\n", flush=True)

    for i, pdf in enumerate(pdfs, 1):
        print(f"[{i}/{len(pdfs)}] {pdf.name}", flush=True)
        meta = parse_pdf(pdf)
        if not meta:
            print(f"  ! skipping — could not parse {pdf.name}", flush=True)
            continue

        story = load_story_meta(meta["level"], meta["sub"])
        out_dir = out_root / f"Level{meta['level']}"
        out_dir.mkdir(exist_ok=True)
        out_path = out_dir / f"{pdf.stem}.md"

        # skip if up-to-date
        if out_path.exists() and out_path.stat().st_mtime > pdf.stat().st_mtime:
            print(f"  · up to date, skipping", flush=True)
            continue

        try:
            t0 = time.time()
            review, model = review_book(pdf, meta, story)
            dt = time.time() - t0
        except Exception as e:
            print(f"  X review failed: {e}", flush=True)
            continue

        story_key = f"L{meta['level']}_{meta['sub']}"
        story_file = STORY_FILES.get(story_key, "NOT FOUND")
        out_path.write_text(
            f"# Review — {pdf.name}\n\n"
            f"_Model: {model}_\n\n"
            f"_Source story file: {story_file}_\n\n"
            f"{review}\n",
            encoding="utf-8",
        )
        print(f"  saved {out_path.relative_to(ROOT)}  ({dt:.0f}s)", flush=True)


if __name__ == "__main__":
    main()
