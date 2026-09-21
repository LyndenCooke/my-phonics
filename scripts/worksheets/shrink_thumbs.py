"""Downscale forged worksheet PNG previews (forge writes ~1200px, ~140 KB) to
480px-wide thumbnails (~35 KB) so the repo and the site stay light.

  py -3.12 scripts/worksheets/shrink_thumbs.py
"""
import glob
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WIDTH = 480

n = before = after = 0
for f in glob.glob(os.path.join(ROOT, "public", "worksheets", "L[1-8]", "*", "*.png")):
    if os.path.basename(os.path.dirname(f)).endswith("_Pack"):
        continue  # hand-made packs keep their original previews
    im = Image.open(f)
    if im.width <= WIDTH:
        continue
    before += os.path.getsize(f)
    im = im.convert("RGB").resize((WIDTH, int(im.height * WIDTH / im.width)), Image.LANCZOS)
    im.save(f, optimize=True)
    after += os.path.getsize(f)
    n += 1
print(f"shrunk {n} previews: {before/1e6:.1f} MB -> {after/1e6:.1f} MB")
