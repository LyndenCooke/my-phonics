import os, sys, subprocess, concurrent.futures, pathlib
import pypdfium2 as pdfium

ROOT = r"C:\Users\ASUS\myphonicsbooks\myphonics_books"
SRC = os.path.join(ROOT, "output", "books", "Level1")
DST = os.path.join(ROOT, "_review_pages")

books = [
    ("book01", "1 The Fish in the Tank.pdf"),
    ("book02", "1_1 Tap Tap Tap.pdf"),
    ("book03", "1_2 The Mud on the Dog.pdf"),
    ("book04", "1_4 The Red Socks.pdf"),
    ("book05", "1_5 Run, Pup, Run.pdf"),
    ("book06", "1_6 Fox Fell Off.pdf"),
    ("book07", "1_7 The Jam Jug.pdf"),
    ("book08", "1_8 The Yak and the Box.pdf"),
    ("book09", "1_9 Chop, Chop, Chop.pdf"),
    ("book10", "1_10 Buzz and Sing.pdf"),
]

for slug, fn in books:
    src = os.path.join(SRC, fn)
    out = os.path.join(DST, slug)
    os.makedirs(out, exist_ok=True)
    if not os.path.exists(src):
        print("MISSING", src)
        continue
    pdf = pdfium.PdfDocument(src)
    n = len(pdf)
    base = os.path.splitext(fn)[0]
    for i in range(n):
        png = os.path.join(out, f"{base}_p{i+1:02d}.png")
        if os.path.exists(png):
            continue
        page = pdf[i]
        bitmap = page.render(scale=1.6)
        pil = bitmap.to_pil()
        pil.save(png, "PNG", optimize=True)
        page.close()
    pdf.close()
    print(slug, n, "pages")
print("DONE")
