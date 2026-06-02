"""Rasterise page 1 of each selected book PDF to PNG for Instagram compositing."""
from pathlib import Path
import fitz

ROOT = Path(r"C:\Users\ASUS\myphonicsbooks\myphonics_books")
OUT = ROOT / "output" / "instagram_posts" / "_assets"
OUT.mkdir(parents=True, exist_ok=True)

BOOKS = [
    ("L1_3", ROOT / "output/books/Level1/1 The Fish in the Tank.pdf",        "The Fish in the Tank",      "L1", "#E84B8A"),
    ("L2_1", ROOT / "output/books/Level2/2_1 The Night Light.pdf",            "The Night Light",           "L2", "#F59E0B"),
    ("L3_3", ROOT / "output/books/Level3/3_3 The Dream Team.pdf",             "The Dream Team",            "L3", "#22C55E"),
    ("L4_1", ROOT / "output/books/Level4/4_1 The Purple Purse.pdf",           "The Purple Purse",          "L4", "#3B82F6"),
    ("L5_1", ROOT / "output/books/Level5/5_1 Before the Shore.pdf",           "Before the Shore",          "L5", "#8B5CF6"),
    ("L6_4", ROOT / "output/books/Level6/6_4 The Incredible Bush Walk.pdf",   "The Incredible Bush Walk",  "L6", "#14B8A6"),
]

for slug, pdf_path, title, level, colour in BOOKS:
    if not pdf_path.exists():
        print(f"MISSING: {pdf_path}")
        continue
    doc = fitz.open(pdf_path)
    page = doc[0]
    pix = page.get_pixmap(matrix=fitz.Matrix(4, 4))
    out_path = OUT / f"cover_{slug}.png"
    pix.save(out_path)
    print(f"OK  {slug}  {out_path.name}  {pix.width}x{pix.height}")
    doc.close()
