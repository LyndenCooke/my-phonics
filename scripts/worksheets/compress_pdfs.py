"""
Downsample the clipart inside forged worksheet PDFs to print resolution and
re-merge each pack PDF. The forge embeds 1024px art in ~2cm slots (4MB+ a
sheet); 300dpi is all a printer uses. Idempotent: images already at or under
300dpi are left alone. (PyMuPDF's own rewrite_images segfaults on some of
these files, hence the manual resize.)

  py -3.12 scripts/worksheets/compress_pdfs.py            # Levels 4-8
  py -3.12 scripts/worksheets/compress_pdfs.py --level 5  # one level
"""
import argparse
import io
import json
import os

import fitz  # PyMuPDF
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WS = os.path.join(ROOT, "public", "worksheets")
MANIFEST = os.path.join(WS, "manifest.json")
DPI = 300


def compress(path):
    before = os.path.getsize(path)
    doc = fitz.open(path)
    for page in doc:
        for im in page.get_images(full=True):
            xref, smask, w, h = im[0], im[1], im[2], im[3]
            rects = page.get_image_rects(xref)
            if smask or not rects:
                continue
            target = int(max(r.width for r in rects) / 72 * DPI)
            if w <= target * 1.1:
                continue
            pix = fitz.Pixmap(fitz.csRGB, fitz.Pixmap(doc, xref))
            img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
            img = img.resize((target, round(target * h / w)), Image.LANCZOS)
            buf = io.BytesIO()
            img.save(buf, "JPEG", quality=90)
            page.replace_image(xref, stream=buf.getvalue())
    data = doc.tobytes(garbage=4, deflate=True)
    doc.close()
    if len(data) < before * 0.9:
        with open(path, "wb") as f:
            f.write(data)
    return before, os.path.getsize(path)


def merge(pdfs, out):
    from pypdf import PdfWriter
    w = PdfWriter()
    for p in pdfs:
        w.append(p)
    with open(out, "wb") as f:
        w.write(f)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--level", type=int)
    args = ap.parse_args()
    manifest = json.load(open(MANIFEST, encoding="utf-8"))
    was = now = 0
    for pack in manifest["packs"]:
        if pack["level"] < 4 or (args.level and pack["level"] != args.level):
            continue
        pdfs = [os.path.join(ROOT, "public", s["href"].lstrip("/")) for s in pack["sheets"]]
        for p in pdfs:
            b, a = compress(p)
            was += b
            now += a
        merge(pdfs, os.path.join(ROOT, "public", pack["bundle"].lstrip("/")))
    print(f"sheets: {was / 1e6:.1f} MB -> {now / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
