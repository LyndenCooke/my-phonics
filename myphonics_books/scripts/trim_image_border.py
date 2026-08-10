"""Crop the cream 'painted panel' border some generated pages come back with.

The image model obeys the FULL BLEED instruction in BASE_STYLE most of the
time but not always — on L7.3 three of seven regenerated pages still came back
inside a rounded cream panel while their neighbours were edge-to-edge, so one
book mixed two framings (Lynden 2026-07-27: "the image settings ... isn't
really strong with consistency"). Re-rolling is a coin flip; this is
deterministic.

Detects a near-uniform border by walking in from each edge while the row or
column stays close to the corner colour, then crops slightly further in so the
panel's ROUNDED corners go too, leaving a clean full-bleed image.

    py -3.12 scripts/trim_image_border.py output/images/L7_3_B1/page2.png ...
    py -3.12 scripts/trim_image_border.py --check <files>   # report only

Originals are kept alongside as <name>_bordered.png the first time a file is
trimmed, so this is always undoable.
"""

import sys
from pathlib import Path

from PIL import Image, ImageStat

# A row/column counts as "still border" while its mean colour sits within this
# distance of the corner colour AND it is visually flat (low spread).
TOLERANCE = 18
FLATNESS = 12
# Extra bite past the detected edge, as a fraction of the image, to clear the
# rounded corner arc.
CORNER_BITE = 0.012


def _close(stat_mean, ref, spread) -> bool:
    return (max(abs(a - b) for a, b in zip(stat_mean, ref)) <= TOLERANCE
            and max(spread) <= FLATNESS)


def detect_border(im: Image.Image) -> tuple[int, int, int, int]:
    """(left, top, right, bottom) inset of the uniform border, in pixels."""
    rgb = im.convert("RGB")
    w, h = rgb.size
    ref = rgb.getpixel((2, 2))
    limit_x, limit_y = w // 4, h // 4

    def scan(vertical: bool, from_end: bool) -> int:
        n = w if vertical else h
        limit = limit_x if vertical else limit_y
        for i in range(limit):
            idx = (n - 1 - i) if from_end else i
            strip = (rgb.crop((idx, 0, idx + 1, h)) if vertical
                     else rgb.crop((0, idx, w, idx + 1)))
            st = ImageStat.Stat(strip)
            if not _close(st.mean, ref, st.stddev):
                return i
        return 0

    return scan(True, False), scan(False, False), scan(True, True), scan(False, True)


def trim(path: Path, apply: bool = True) -> bool:
    im = Image.open(path)
    w, h = im.size
    left, top, right, bottom = detect_border(im)
    # All four edges must show a border — a single dark edge is composition,
    # not a frame.
    if min(left, top, right, bottom) < 4:
        print(f"  {path.name}: no border detected (l{left} t{top} r{right} b{bottom})")
        return False
    bite = int(min(w, h) * CORNER_BITE)
    box = (left + bite, top + bite, w - right - bite, h - bottom - bite)
    print(f"  {path.name}: border l{left} t{top} r{right} b{bottom} "
          f"-> crop to {box[2] - box[0]}x{box[3] - box[1]}")
    if not apply:
        return True
    backup = path.with_name(path.stem + "_bordered.png")
    if not backup.exists():
        backup.write_bytes(path.read_bytes())
    im.convert("RGB").crop(box).save(path)
    return True


def main(argv: list[str]) -> int:
    args = [a for a in argv if not a.startswith("--")]
    apply = "--check" not in argv
    if not args:
        print(__doc__)
        return 2
    hits = 0
    for a in args:
        p = Path(a)
        if not p.exists():
            print(f"  {a}: not found")
            continue
        hits += bool(trim(p, apply=apply))
    print(f"{hits} image(s) {'trimmed' if apply else 'would be trimmed'}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
