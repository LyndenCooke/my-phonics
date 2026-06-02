"""Assemble + publish a v2.1 worksheet pack (6 sheets) to the Drive.

For a given book_id, reads:
  output/worksheet_plan/v21_packs/{book_id}_pack.json        (page titles)
  output/worksheet_plan/v21_packs/imgs/{book_id}/page_*.png  (rendered images)

Produces individual A4 PDFs per page + a single bookmarked multi-page bundle PDF,
copies to:
  G:/My Drive/MyPhonicsBooks/07_TPT/Worksheets/Level_{n}/{book_id_safe}_Pack/
And mirrors to public/worksheets/Level_{n}/{book_id_safe}_Pack/ for the web app.

Usage:
  py -3.12 scripts/publish_v21_pack.py L1_1
  py -3.12 scripts/publish_v21_pack.py L1_1 L1_2 L2_1
"""
from __future__ import annotations

import json
import re
import shutil
import sys
from pathlib import Path

from PIL import Image
from pypdf import PdfReader, PdfWriter

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent
PACKS_DIR = ROOT / "output" / "worksheet_plan" / "v21_packs"
IMG_ROOT = PACKS_DIR / "imgs"
DRIVE = Path("G:/My Drive/MyPhonicsBooks/07_TPT/Worksheets")
PUBLIC = REPO / "public" / "worksheets"

A4_W, A4_H = 2480, 3508  # px @ 300 dpi


def safe_slug(s: str) -> str:
    return re.sub(r"[^A-Za-z0-9]+", "_", s).strip("_")


def png_to_a4(img: Image.Image) -> Image.Image:
    img = img.convert("RGB")
    scale = min(A4_W / img.width, A4_H / img.height)
    new_w, new_h = int(img.width * scale), int(img.height * scale)
    resized = img.resize((new_w, new_h), Image.LANCZOS)
    canvas = Image.new("RGB", (A4_W, A4_H), "white")
    canvas.paste(resized, ((A4_W - new_w) // 2, (A4_H - new_h) // 2))
    return canvas


def publish_one(book_id: str) -> None:
    spec_path = PACKS_DIR / f"{book_id}_pack.json"
    if not spec_path.exists():
        print(f"  SKIP {book_id}: no pack JSON")
        return
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    level = spec["level"]
    book_title = spec["book_title"]
    title_slug = safe_slug(book_title)
    pack_folder_name = f"{book_id}_{title_slug}_Pack"
    img_dir = IMG_ROOT / book_id

    drive_dst = DRIVE / f"Level_{level}" / pack_folder_name
    web_dst = PUBLIC / f"Level_{level}" / pack_folder_name
    drive_dst.mkdir(parents=True, exist_ok=True)
    web_dst.mkdir(parents=True, exist_ok=True)

    print(f"\n=== {book_id} (L{level}) — {book_title} ===")
    print(f"  Drive: {drive_dst}")

    a4_pages: list[Image.Image] = []
    bookmarks: list[str] = []

    for page in spec["pages"]:
        n = page["page_num"]
        src = img_dir / f"page_{n:02d}.png"
        if not src.exists():
            print(f"  MISSING page {n} png — skipping")
            continue
        stem = f"{n:02d}_{safe_slug(page['skill_chip']).lower()}"
        dst_png = drive_dst / f"{stem}.png"
        shutil.copy2(src, dst_png)
        with Image.open(src) as img:
            page_a4 = png_to_a4(img)
            (drive_dst / f"{stem}.pdf").write_bytes(b"")  # placeholder, overwrite next:
            page_a4.save(drive_dst / f"{stem}.pdf", "PDF", resolution=300.0)
            a4_pages.append(page_a4)
            bookmarks.append(f"{n}. {page['title']}")
            print(f"  OK {stem}.png + .pdf")

    if not a4_pages:
        print("  nothing to bundle")
        return

    bundle_path = drive_dst / f"{book_id}_Pack.pdf"
    a4_pages[0].save(bundle_path, "PDF", save_all=True,
                     append_images=a4_pages[1:], resolution=300.0)
    reader = PdfReader(str(bundle_path))
    writer = PdfWriter()
    for p in reader.pages:
        writer.add_page(p)
    for i, t in enumerate(bookmarks):
        writer.add_outline_item(t, i)
    writer.page_mode = "/UseOutlines"
    with open(bundle_path, "wb") as fh:
        writer.write(fh)
    print(f"  OK {bundle_path.name} ({len(a4_pages)} pages, {len(bookmarks)} bookmarks)")

    # mirror to public/
    for f in drive_dst.glob("*.pdf"):
        shutil.copy2(f, web_dst / f.name)
    for f in drive_dst.glob("*.png"):
        shutil.copy2(f, web_dst / f.name)
    print(f"  mirrored -> {web_dst.relative_to(REPO)}")


def main():
    if len(sys.argv) < 2:
        print("usage: publish_v21_pack.py <book_id> [book_id ...]")
        sys.exit(2)
    for book_id in sys.argv[1:]:
        publish_one(book_id)


if __name__ == "__main__":
    main()
