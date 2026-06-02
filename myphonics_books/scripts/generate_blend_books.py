"""
Blend Books — generate A6 mini-books (Pre-L1 / RWI Sound Blending equivalent).

Pipeline per book:
  1. For each page, generate a cartoon illustration via gpt-image-1.
  2. Generate a cover illustration that mirrors the title sentiment.
  3. Render templates/book_blend.html via Jinja2.
  4. Convert HTML to A6 PDF via Playwright (reuses html_to_pdf).

Outputs: output/blend_books/Blend_{n}.pdf (+ page PNGs in images/)

Usage:
  py -3.12 scripts/generate_blend_books.py             # all 4
  py -3.12 scripts/generate_blend_books.py --book 2    # single book
  py -3.12 scripts/generate_blend_books.py --no-images # use placeholders
  py -3.12 scripts/generate_blend_books.py --redo-images  # force regen
"""
from __future__ import annotations

import argparse
import asyncio
import base64
import os
import sys
import time
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(BASE_DIR))

from jinja2 import Environment, FileSystemLoader
from openai import OpenAI

from data.blend_books import BLEND_BOOKS, LEVEL_COLOUR  # noqa: E402
from scripts.generate_book import html_to_pdf, image_to_data_uri  # noqa: E402


# ─── .env loader ─────────────────────────────────────────────
def _load_env():
    env_path = BASE_DIR / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())


_load_env()

OUT_DIR = BASE_DIR / "output" / "blend_books"
IMG_DIR = OUT_DIR / "images"
OUT_DIR.mkdir(parents=True, exist_ok=True)
IMG_DIR.mkdir(parents=True, exist_ok=True)

FONTS_DIR = BASE_DIR / "assets" / "fonts"
TEMPLATE_PATH = BASE_DIR / "templates" / "book_blend.html"

STYLE_TAIL = (
    " Style: clean simple cartoon, flat colours, bold black outlines, "
    "round friendly forms, pure black dot eyes for any people, no text "
    "anywhere in the image, soft cream or pastel background only. "
    "Square 1:1 composition with the subject centred and clearly visible."
)


def _slugify(book_id: str, page_idx: int) -> str:
    return f"{book_id.lower()}_p{page_idx:02d}"


def _gen_image(prompt: str, output_path: Path, client: OpenAI, max_retries: int = 5) -> Path:
    """Generate a single image via gpt-image-1, with retry/backoff on transient errors."""
    full_prompt = prompt + STYLE_TAIL
    print(f"  generating {output_path.name}...")
    last_err = None
    for attempt in range(1, max_retries + 1):
        try:
            resp = client.images.generate(
                model="gpt-image-1",
                prompt=full_prompt,
                size="1024x1024",
                n=1,
            )
            img_b64 = resp.data[0].b64_json
            output_path.write_bytes(base64.b64decode(img_b64))
            return output_path
        except Exception as e:  # noqa: BLE001 — transient API/connection errors
            last_err = e
            wait = min(2 ** attempt, 30)
            print(f"    attempt {attempt}/{max_retries} failed ({type(e).__name__}); retrying in {wait}s")
            time.sleep(wait)
    raise RuntimeError(f"image gen failed after {max_retries} attempts: {last_err}")


def _ensure_images(book_id: str, book: dict, client: OpenAI, force: bool) -> dict:
    """Generate (or reuse) per-page + cover images. Returns a dict with file paths."""
    book_dir = IMG_DIR / book_id
    book_dir.mkdir(exist_ok=True)

    # Cover image: use the cover-relevant prompt (mirror the first content page hero)
    # For simplicity, we'll reuse page 1's image as the cover image.
    cover_path = book_dir / "cover.png"
    cover_base = book.get("cover_prompt", book["pages"][0]["image_prompt"])
    cover_prompt = (
        f"A friendly book cover illustration for a children's first reading book titled "
        f"\"{book['title']}\". {cover_base}"
    )
    if force or not cover_path.exists():
        _gen_image(cover_prompt, cover_path, client)
        time.sleep(2)

    page_paths = []
    for i, p in enumerate(book["pages"]):
        path = book_dir / f"page_{i+1:02d}.png"
        if force or not path.exists():
            _gen_image(p["image_prompt"], path, client)
            time.sleep(2)
        page_paths.append(path)

    return {"cover": cover_path, "pages": page_paths}


def _render_book(book_id: str, book: dict, images: dict) -> Path:
    """Render the HTML and convert to PDF."""
    env = Environment(loader=FileSystemLoader(str(BASE_DIR / "templates")))
    tmpl = env.get_template("book_blend.html")

    pages_for_template = []
    for i, p in enumerate(book["pages"]):
        pages_for_template.append({
            "word": p["word"],
            "image": image_to_data_uri(images["pages"][i]) if images["pages"][i].exists() else None,
        })

    html = tmpl.render(
        book_title=book["title"],
        subtitle=book["subtitle"],
        book_number=book["book_number"],
        level_colour=LEVEL_COLOUR,
        cumulative_graphemes=book["cumulative_graphemes"],
        cover_image=image_to_data_uri(images["cover"]) if images["cover"].exists() else None,
        pages=pages_for_template,
        font_regular=(FONTS_DIR / "Andika-Regular.ttf").as_uri(),
        font_bold=(FONTS_DIR / "Andika-Bold.ttf").as_uri(),
    )

    html_path = OUT_DIR / f"{book_id}.html"
    html_path.write_text(html, encoding="utf-8")

    pdf_path = OUT_DIR / f"{book_id}.pdf"
    asyncio.run(html_to_pdf(html, pdf_path))
    print(f"  wrote {pdf_path}")
    return pdf_path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--book", type=int, help="Only build one book (1-4)")
    ap.add_argument("--no-images", action="store_true", help="Skip image gen, render with placeholders")
    ap.add_argument("--redo-images", action="store_true", help="Force regen even if cached")
    args = ap.parse_args()

    client = OpenAI() if not args.no_images else None
    books = list(BLEND_BOOKS.items())
    if args.book:
        books = [(f"Blend_{args.book}", BLEND_BOOKS[f"Blend_{args.book}"])]

    for book_id, book in books:
        print(f"\n== {book_id}: {book['title']} ==")
        if args.no_images:
            empty_dir = IMG_DIR / book_id
            empty_dir.mkdir(exist_ok=True)
            images = {
                "cover": empty_dir / "cover.png",
                "pages": [empty_dir / f"page_{i+1:02d}.png" for i in range(len(book["pages"]))],
            }
        else:
            images = _ensure_images(book_id, book, client, args.redo_images)
        _render_book(book_id, book, images)


if __name__ == "__main__":
    main()
