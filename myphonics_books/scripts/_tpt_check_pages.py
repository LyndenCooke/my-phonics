"""Rasterize each page of the TPT teacher access PDF to PNG for inspection."""
from pathlib import Path
import fitz

ROOT = Path(__file__).parent.parent
pdf = ROOT / "output" / "tpt_pack" / "MyPhonicsBooks_Teacher_Access.pdf"
out = ROOT / "output" / "tpt_pack" / "_preview"
out.mkdir(parents=True, exist_ok=True)

doc = fitz.open(pdf)
print(f"Pages: {doc.page_count}")
for i in range(doc.page_count):
    pix = doc[i].get_pixmap(matrix=fitz.Matrix(1.5, 1.5))
    p = out / f"p{i+1:02d}.png"
    pix.save(p)
    print(f"  p{i+1:02d} -> {p.name} ({pix.width}x{pix.height})")
