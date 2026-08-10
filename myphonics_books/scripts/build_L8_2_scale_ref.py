"""Build a two-up SCALE reference for 8.2 — the girl and the boy at true relative heights.

Three generations of page 1 in a row put the three-year-old at nearly the
eight-year-old's height, even with the stored brief saying "his seated head
reaches only about her hip" and the correction naming the fault outright. The
reason is in the reference stack, not the wording: hero_reference.png fills its
frame with the girl and boy_reference.png fills its frame with the boy, so
every sheet says "this character is one frame tall" and nothing in the stack
carries the relationship between them. Text cannot fix that — the same lesson
the forge SKILL.md records about floor plans, where only a location image holds
the room.

So the sheets are composed onto one canvas, on one ground line, with the boy
scaled to the book's own brief: standing, his head reaches the girl's waist.

The boy's tile keeps the page-8 background he was cropped from. Cutting him out
cleanly is not worth it — the injected label tells the model to read only the
height difference, and it does.

    py -3.12 scripts/build_L8_2_scale_ref.py
"""

from pathlib import Path

import numpy as np
from PIL import Image

BOOK_DIR = Path(__file__).parent.parent / "output" / "images" / "L8_2_B1"
CREAM = (250, 247, 235)
BOY_OF_GIRL = 0.55  # standing, head to her waist


def figure_bbox(im, tol=18):
    """Bounding box of the drawn figure against the sheet's cream ground."""
    a = np.asarray(im).astype(int)
    mask = (abs(a - np.array(CREAM)).max(axis=2) > tol)
    ys, xs = np.where(mask)
    return xs.min(), ys.min(), xs.max(), ys.max()


def main():
    girl = Image.open(BOOK_DIR / "hero_reference.png").convert("RGB")
    boy = Image.open(BOOK_DIR / "boy_reference.png").convert("RGB")
    girl.load()
    boy.load()

    gx0, gy0, gx1, gy1 = figure_bbox(girl)
    gc = girl.crop((gx0 - 24, gy0 - 14, gx1 + 15, gy1 + 5))
    # The boy's sheet is a scene crop, so its "figure" bbox is the whole tile.
    bc = boy.crop(figure_bbox(boy))

    target = int(gc.size[1] * BOY_OF_GIRL)
    bs = bc.resize((int(bc.size[0] * target / bc.size[1]), target), Image.LANCZOS)

    canvas = Image.new("RGB", (1200, 1000), CREAM)
    baseline = 940
    canvas.paste(gc, (150, baseline - gc.size[1]))
    canvas.paste(bs, (700, baseline - bs.size[1]))

    out = BOOK_DIR / "_scale_reference.png"
    canvas.save(out)
    print(f"girl {gc.size[1]}px, boy {bs.size[1]}px "
          f"(ratio {bs.size[1] / gc.size[1]:.2f}) -> {out.name}")


if __name__ == "__main__":
    main()
