"""Generate product mockup images for the physical shop (/shop).

Composites real print artwork (storybook PDFs, card deck PDFs) into clean
flat-with-shadow product mockups on a near-white background. No fake 3D
perspective. Output: optimised WebP to public/shop/, named by SKU
(lower-cased, dots and spaces -> dashes).

Workbook mockups use the real printed booklet cover (worksheet-engine
workbook2__{level}.pdf); a token-built placeholder is only a fallback.

Run:  py -3.12 scripts/generate_shop_mockups.py
Requires: PyMuPDF (fitz), Pillow with WebP support.
"""

from __future__ import annotations

import glob
import io
import math
import os
import sys
import urllib.request

import fitz  # PyMuPDF
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOOKS_DIR = os.path.join(ROOT, "myphonics_books", "output", "books")
CARDS_TIER1 = os.path.join(
    ROOT, "myphonics_books", "output", "cards", "tier1",
    "sound_cards_tier1_premium_all.pdf",
)
WORD_CARDS_DIR = os.path.join(ROOT, "myphonics_books", "output", "word_cards")
# Wipe-clean workbook interiors: L1-L3 in output/, L4-L8 in "new booklets/".
WB_ENGINE = os.path.join(ROOT, "worksheet-engine", "output")
# The approved illustrated W2 workbook covers (all 8, l1.png..l8.png). These
# are the real covers; the PDFs only carry them if re-rendered after 2026-06-13.
W2_COVERS = os.path.join(ROOT, "worksheet-engine", "public", "covers", "w2")
OUT_DIR = os.path.join(ROOT, "public", "shop")

BG = (250, 250, 248)  # #FAFAF8

# Journey levels — keep in step with src/lib/levels8.ts
LEVELS = {
    1: ("Ditties", "#E84B8A", "#BE1862"),
    2: ("First Sounds", "#F97066", "#C2362C"),
    3: ("Special Friends", "#F59E0B", "#92600A"),
    4: ("Longer Sounds", "#22C55E", "#15803D"),
    5: ("New Spellings", "#3B82F6", "#1D4FD8"),
    6: ("Building Fluency", "#6366F1", "#4338CA"),
    7: ("Reading Together", "#8B5CF6", "#6D3BD8"),
    8: ("Reading Champion", "#14B8A6", "#0E7C70"),
}

# Books per journey level, in journey order. PDFs live in
# output/books/Level{n}/{n}_{i} Title.pdf (post 2026-07-03 re-levelling).
# Level1 also holds stale legacy renders (1_3..1_10) — only 1_1/1_2 are L1.
BOOKS_PER_LEVEL = {1: 2, 2: 5, 3: 3, 4: 6, 5: 5, 6: 4, 7: 4, 8: 4}

OUTFIT_TTF = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Outfit.ttf")
OUTFIT_URL = "https://github.com/google/fonts/raw/main/ofl/outfit/Outfit%5Bwght%5D.ttf"


def hex_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def tint(hexcol: str, strength: float = 0.08) -> tuple[int, int, int]:
    """Level colour blended into the near-white background."""
    r, g, b = hex_rgb(hexcol)
    return tuple(round(c * (1 - strength) + v * strength) for c, v in zip(BG, (r, g, b)))


def outfit(size: int, weight: int = 800) -> ImageFont.FreeTypeFont:
    if not os.path.exists(OUTFIT_TTF):
        urllib.request.urlretrieve(OUTFIT_URL, OUTFIT_TTF)
    f = ImageFont.truetype(OUTFIT_TTF, size)
    try:
        f.set_variation_by_axes([weight])
    except Exception:
        pass
    return f


def render_pdf_page(path: str, page: int = 0, target_h: int = 1100,
                    crop: fitz.Rect | None = None) -> Image.Image:
    doc = fitz.open(path)
    pg = doc[page]
    rect = crop or pg.rect
    scale = target_h / rect.height
    pix = pg.get_pixmap(matrix=fitz.Matrix(scale, scale), clip=rect)
    img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
    doc.close()
    return img


def rounded(img: Image.Image, radius: int,
            outline: tuple[int, int, int] | None = None) -> Image.Image:
    """Give an image rounded corners (returns RGBA)."""
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, img.width - 1, img.height - 1], radius, fill=255)
    out = img.convert("RGBA")
    out.putalpha(mask)
    if outline:
        ImageDraw.Draw(out).rounded_rectangle(
            [0, 0, img.width - 1, img.height - 1], radius, outline=outline + (255,), width=2)
    return out


def paste_with_shadow(canvas: Image.Image, item: Image.Image, xy: tuple[int, int],
                      rotate: float = 0.0, shadow_alpha: int = 60,
                      offset: tuple[int, int] = (10, 16), blur: int = 18) -> None:
    """Paste an RGBA item onto the canvas with a soft drop shadow."""
    if rotate:
        item = item.rotate(rotate, expand=True, resample=Image.BICUBIC)
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sh = Image.new("RGBA", item.size, (0, 0, 0, 0))
    sh.paste(Image.new("RGBA", item.size, (30, 24, 30, shadow_alpha)), (0, 0), item)
    shadow.paste(sh, (xy[0] + offset[0], xy[1] + offset[1]), sh)
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur))
    canvas.alpha_composite(shadow)
    canvas.alpha_composite(item, xy)


def page_edge(cover: Image.Image, thickness: int = 7) -> Image.Image:
    """Add a soft page-thickness edge along the right side of a cover."""
    w, h = cover.size
    out = Image.new("RGB", (w + thickness, h), (255, 255, 255))
    out.paste(cover, (0, 0))
    d = ImageDraw.Draw(out)
    for i in range(thickness):
        shade = 235 - (i % 3) * 10
        d.line([(w + i, 3), (w + i, h - 4)], fill=(shade, shade - 2, shade - 4))
    return out


def book_item(pdf_path: str, height: int) -> Image.Image:
    cover = render_pdf_page(pdf_path, target_h=height)
    cover = page_edge(cover)
    return rounded(cover, max(6, height // 90))


def new_canvas(size: tuple[int, int], bg: tuple[int, int, int] = BG) -> Image.Image:
    return Image.new("RGBA", size, bg + (255,))


def _vgrad(size: tuple[int, int], top: tuple[int, int, int],
           bottom: tuple[int, int, int]) -> Image.Image:
    """Vertical gradient canvas, light at the top settling into a touch more
    colour at the bottom — gives the flat tint some depth."""
    w, h = size
    strip = Image.new("RGB", (1, h))
    for y in range(h):
        t = (y / (h - 1)) ** 1.15
        strip.putpixel((0, y), tuple(round(a + (b - a) * t) for a, b in zip(top, bottom)))
    return strip.resize((w, h)).convert("RGBA")


def staged(size: tuple[int, int], hexcol: str | None = None) -> Image.Image:
    """Base canvas: a soft neutral gradient, or a gentle level-tint gradient."""
    if hexcol is None:
        return _vgrad(size, (252, 252, 250), (243, 242, 246))
    return _vgrad(size, tint(hexcol, 0.045), tint(hexcol, 0.15))


def ground_shadow(canvas: Image.Image, cx: int, cy: int, rw: int, rh: int,
                  alpha: int = 46, blur: int = 42) -> None:
    """A soft elliptical shadow on the floor to anchor a cluster of objects."""
    sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse([cx - rw, cy - rh, cx + rw, cy + rh], fill=(30, 24, 30, alpha))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)))


def shelf_row(canvas: Image.Image, items: list[Image.Image], center_x: int,
              baseline_y: int, overlap: float = 0.4, front: str = "left",
              fit_width: int | None = None,
              shadow_alpha: int = 34, blur: int = 12) -> tuple[int, int, int]:
    """Lay items in a straight row, bottoms aligned on `baseline_y`, evenly
    overlapped and centred on `center_x`. `front='left'` paints the leftmost
    item on top (reading order). If `fit_width` is given, the overlap is chosen
    so the whole row spans exactly that width. Returns (left_x, right_x, top_y)."""
    if fit_width is not None and len(items) > 1:
        w = items[0].width
        overlap = 1 - (fit_width - items[-1].width) / (w * (len(items) - 1))
        overlap = min(max(overlap, 0.18), 0.82)
    xs, cur = [], 0
    for it in items:
        xs.append(cur)
        cur += round(it.width * (1 - overlap))
    total = xs[-1] + items[-1].width
    x0 = center_x - total // 2
    pos = [(x0 + xi, baseline_y - it.height) for xi, it in zip(xs, items)]
    order = range(len(items) - 1, -1, -1) if front == "left" else range(len(items))
    for i in order:
        paste_with_shadow(canvas, items[i], pos[i], shadow_alpha=shadow_alpha,
                          blur=blur, offset=(6, 10))
    top_y = min(p[1] for p in pos)
    return x0, x0 + total, top_y


def deck_item(front: Image.Image, radius: int = 16) -> tuple[Image.Image, Image.Image]:
    """A card deck as (top_card, plain_back_card) for stacking."""
    card = rounded(front, radius, outline=(226, 226, 224))
    back = rounded(Image.new("RGB", front.size, (255, 255, 255)), radius, outline=(232, 232, 230))
    return card, back


def paste_deck(canvas: Image.Image, front: Image.Image, xy: tuple[int, int],
               radius: int = 16, spread: int = 7) -> None:
    """Place a small stacked deck (two plain cards behind a crisp front)."""
    card, back = deck_item(front, radius)
    paste_with_shadow(canvas, back, xy, rotate=-6, shadow_alpha=34, blur=12, offset=(5, 9))
    paste_with_shadow(canvas, back, (xy[0] + spread, xy[1]), rotate=4, shadow_alpha=30, blur=12, offset=(5, 9))
    paste_with_shadow(canvas, card, xy, shadow_alpha=42, blur=14, offset=(6, 10))


def save(canvas: Image.Image, sku: str) -> None:
    name = sku.lower().replace(".", "-").replace(" ", "-") + ".webp"
    path = os.path.join(OUT_DIR, name)
    canvas.convert("RGB").save(path, "WEBP", quality=82, method=6)
    print(f"  {name}  {canvas.width}x{canvas.height}  {os.path.getsize(path)//1024} KB")


def find_book_pdf(level: int, index: int) -> str:
    pattern = os.path.join(BOOKS_DIR, f"Level{level}", f"{level}_{index} *.pdf")
    hits = [p for p in glob.glob(pattern) if "Printable" not in p]
    if not hits:
        raise FileNotFoundError(pattern)
    return hits[0]


# ── Mockup builders ─────────────────────────────────────────────────────────

def single_book(level: int, index: int) -> None:
    canvas = staged((800, 800))
    item = book_item(find_book_pdf(level, index), 600)
    x, y = (800 - item.width) // 2, 96
    ground_shadow(canvas, 400, y + item.height + 6, item.width // 2 + 24, 30)
    paste_with_shadow(canvas, item, (x, y), shadow_alpha=44, blur=20)
    save(canvas, f"r-l{level}-{index}")


def level_set(level: int) -> None:
    """The level's covers as a clean baseline-aligned row on a tint gradient."""
    n = BOOKS_PER_LEVEL[level]
    canvas = staged((960, 800), LEVELS[level][1])
    h = 560 if n <= 3 else 520 if n <= 5 else 470
    items = [book_item(find_book_pdf(level, i + 1), h) for i in range(n)]
    baseline = 400 + h // 2
    fit = 320 if n == 1 else min(820, 300 + n * 95)
    ground_shadow(canvas, 480, baseline + 8, fit // 2 + 20, 30)
    shelf_row(canvas, items, 480, baseline, fit_width=fit)
    save(canvas, f"rs-l{level}")


def full_library() -> None:
    """One flagship cover per level as one wide row — the whole journey."""
    canvas = staged((1200, 800))
    items = [book_item(find_book_pdf(lv, 1), 470) for lv in range(1, 9)]
    baseline = 400 + 470 // 2
    ground_shadow(canvas, 600, baseline + 8, 540, 34)
    shelf_row(canvas, items, 600, baseline, fit_width=1060)
    save(canvas, "r-lib")


def card_stack(front: Image.Image, sku: str, level_hex: str) -> None:
    """A deck: crisp front card with two plain offset cards behind."""
    canvas = staged((800, 800), level_hex)
    card, _ = deck_item(front, 22)
    x, y = (800 - card.width) // 2, (800 - card.height) // 2 + 6
    ground_shadow(canvas, 400, y + card.height + 6, card.width // 2 + 40, 28)
    paste_deck(canvas, front, (x, y), radius=22, spread=10)
    save(canvas, sku)


def sound_card_deck() -> None:
    # Premium card PDF pages carry ~9mm of bleed + crop marks around the
    # 74x105mm card; sound_card_front clips to the trimmed card area.
    card_stack(sound_card_front(560), "sc-full", "#6366F1")


def word_card_deck(level: int) -> None:
    # Word-card sheets are 8-up A7-landscape cells on A4; the top-left cell
    # of page 1 is the level-banner sound card — the natural deck front.
    card_stack(word_card_front(level, 420), f"wc-l{level}", LEVELS[level][1])


def draw_pen(canvas: Image.Image, x: int, y: int, length: int, angle: float,
             body: tuple[int, int, int] = (36, 41, 56)) -> None:
    """A simple wet-erase pen as a flat vector shape: cap, barrel with a
    white label band, tapered nib."""
    w = max(22, length // 11)
    pen = Image.new("RGBA", (length, w + 6), (0, 0, 0, 0))
    d = ImageDraw.Draw(pen)
    cap_l = int(length * 0.28)
    nib_l = int(length * 0.10)
    mid = (w + 6) // 2
    # barrel
    d.rounded_rectangle([cap_l - 8, 3, length - nib_l, w + 3], w // 2, fill=body)
    # white label band on the barrel
    d.rectangle([cap_l + 14, 6, length - nib_l - 26, w], fill=(245, 245, 243))
    # cap (slightly lighter, with a clip)
    cap_col = tuple(min(255, c + 30) for c in body)
    d.rounded_rectangle([0, 1, cap_l, w + 5], w // 2, fill=cap_col)
    d.rounded_rectangle([10, mid - 2, cap_l - 14, mid + 2], 2, fill=body)
    # tapered felt nib
    d.polygon([(length - nib_l, mid - w // 3), (length - nib_l, mid + w // 3),
               (length - 2, mid)], fill=(205, 205, 209))
    paste_with_shadow(canvas, pen.rotate(angle, expand=True, resample=Image.BICUBIC),
                      (x, y), shadow_alpha=40, blur=8)


def find_workbook_pdf(level: int) -> str | None:
    for base in (WB_ENGINE, os.path.join(WB_ENGINE, "new booklets")):
        p = os.path.join(base, f"workbook2__{level}.pdf")
        if os.path.exists(p):
            return p
    return None


def workbook_cover(level: int, height: int = 640) -> Image.Image:
    """The approved illustrated W2 cover (worksheet-engine/public/covers/w2/
    l{level}.png) — the real cover for every level. Falls back to the booklet
    PDF page 1, then the token placeholder, only if the PNG is missing."""
    png = os.path.join(W2_COVERS, f"l{level}.png")
    if os.path.exists(png):
        img = Image.open(png).convert("RGB")
        return img.resize((round(img.width * height / img.height), height), Image.LANCZOS)
    pdf = find_workbook_pdf(level)
    if pdf:
        return render_pdf_page(pdf, 0, target_h=height)
    return _workbook_cover_placeholder(level, height)


def _workbook_cover_placeholder(level: int, height: int = 640) -> Image.Image:
    """Fallback only: built from design tokens (Outfit heading, level band)."""
    name, hexcol, ink = LEVELS[level]
    w = int(height / 1.414 * 1.05)
    img = Image.new("RGB", (w, height), (255, 255, 255))
    d = ImageDraw.Draw(img)
    col = hex_rgb(hexcol)
    band_h = int(height * 0.34)
    d.rectangle([0, 0, w, band_h], fill=col)
    f_small = outfit(int(height * 0.037), 700)
    f_big = outfit(int(height * 0.062), 900)
    f_lv = outfit(int(height * 0.034), 800)
    d.text((int(w * 0.12), int(band_h * 0.22)), "Wipe-Clean", font=f_big, fill="white")
    d.text((int(w * 0.12), int(band_h * 0.22) + int(height * 0.075)), "Workbook",
           font=f_big, fill="white")
    d.text((int(w * 0.12), int(band_h * 0.70)), f"Level {level} · {name}",
           font=f_lv, fill="white")
    d.text((int(w * 0.12), int(height * 0.42)), "Write, wipe, practise again",
           font=f_small, fill=hex_rgb(ink))
    # Tramline handwriting motif — echoes the gold-standard 4-line guides
    y0 = int(height * 0.56)
    gap = int(height * 0.055)
    for i, (colr, dash) in enumerate([((120, 120, 126), False), (col, True),
                                      ((60, 60, 66), False), ((170, 170, 176), True)]):
        y = y0 + i * gap
        if dash:
            for xx in range(int(w * 0.12), int(w * 0.88), 18):
                d.line([(xx, y), (xx + 9, y)], fill=colr, width=3)
        else:
            d.line([(int(w * 0.12), y), (int(w * 0.88), y)], fill=colr, width=3)
    f_foot = outfit(int(height * 0.026), 700)
    d.text((int(w * 0.12), int(height * 0.88)),
           "Wet-erase or dry-wipe pens only", font=f_foot, fill=(110, 110, 116))
    d.text((int(w * 0.12), int(height * 0.925)),
           "MyPhonicsBooks", font=f_foot, fill=hex_rgb(ink))
    # Wiro binding rings along the left edge
    for yy in range(24, height - 12, 34):
        d.ellipse([6, yy, 26, yy + 20], outline=(150, 152, 158), width=5)
        d.ellipse([10, yy + 4, 22, yy + 16], fill=(250, 250, 248))
    return img


def workbook(level: int) -> None:
    canvas = staged((800, 800), LEVELS[level][1])
    wb = rounded(workbook_cover(level, 600), 10)
    x, y = 96, 100
    ground_shadow(canvas, 360, y + wb.height + 6, wb.width // 2 + 30, 28)
    paste_with_shadow(canvas, wb, (x, y), shadow_alpha=44, blur=20)
    # pen leaning against the workbook, standing at the same baseline
    draw_pen(canvas, 520, 250, 300, -74)
    save(canvas, f"wb-l{level}")


def pen_pack() -> None:
    canvas = staged((800, 800))
    ground_shadow(canvas, 400, 470, 250, 34)
    for i in range(3):
        draw_pen(canvas, 150 + i * 30, 250 + i * 110, 500, -12)
    save(canvas, "pen-3")


def word_card_front(level: int, target_h: int) -> Image.Image:
    path = os.path.join(WORD_CARDS_DIR, f"L{level}_sound_cards.pdf")
    doc = fitz.open(path)
    r = doc[0].rect
    doc.close()
    return render_pdf_page(path, 0, target_h=target_h,
                           crop=fitz.Rect(1, 1, r.width / 2 - 1, r.height / 4 - 1))


def level_bundle(level: int) -> None:
    """One balanced group: the readers + workbook in a single baseline-aligned
    row (workbook as the taller bookend), with the word card deck and pen as a
    tidy front accent."""
    n = BOOKS_PER_LEVEL[level]
    hexcol = LEVELS[level][1]
    canvas = staged((1100, 800), hexcol)
    hr = 400  # reader height
    readers = [book_item(find_book_pdf(level, i + 1), hr) for i in range(n)]
    wb = rounded(workbook_cover(level, round(hr * 1.12)), 9)  # A4, a touch taller
    row = readers + [wb]
    baseline = 540
    ground_shadow(canvas, 550, baseline + 26, 470, 32)
    shelf_row(canvas, row, 550, baseline, fit_width=980, shadow_alpha=32, blur=12)
    # front accent: word card deck + pen, sitting on the floor below the row
    front = word_card_front(level, 185)
    fx = 550 - front.width // 2 + 30
    paste_deck(canvas, front, (fx, baseline - 8), radius=13, spread=6)
    draw_pen(canvas, fx - 235, baseline + 30, 250, -15)
    save(canvas, f"bn-l{level}")


def sound_card_front(target_h: int) -> Image.Image:
    doc = fitz.open(CARDS_TIER1)
    r = doc[0].rect
    doc.close()
    mx = (r.width - 74 * 72 / 25.4) / 2
    my = (r.height - 105 * 72 / 25.4) / 2
    return render_pdf_page(CARDS_TIER1, 0, target_h=target_h,
                           crop=fitz.Rect(mx, my, r.width - mx, r.height - my))


def family_bundle() -> None:
    """The whole scheme: the 8-level colour journey in one row (a workbook as
    the bookend), with both card decks and the pen as a tidy front accent."""
    canvas = staged((1200, 800))
    # one flagship reader per level — the row shows the whole colour journey
    readers = [book_item(find_book_pdf(lv, 1), 340) for lv in range(1, 9)]
    wb = rounded(workbook_cover(1, round(340 * 1.12)), 9)
    row = readers + [wb]
    baseline = 500
    ground_shadow(canvas, 600, baseline + 30, 560, 34)
    shelf_row(canvas, row, 600, baseline, fit_width=1080, shadow_alpha=30, blur=11)
    # front accent: sound deck + word deck + pen, sitting on the floor
    sc = sound_card_front(205)
    paste_deck(canvas, sc, (600 - sc.width - 12, baseline - 6), radius=12, spread=6)
    wc = word_card_front(4, 150)
    paste_deck(canvas, wc, (616, baseline + 26), radius=11, spread=5)
    draw_pen(canvas, 372, baseline + 96, 240, -12)
    save(canvas, "bn-fam")


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    only = sys.argv[1:] or None

    def want(*names: str) -> bool:
        return only is None or any(n in only for n in names)

    print("Generating shop mockups ->", OUT_DIR)
    if want("singles"):
        for lv, n in BOOKS_PER_LEVEL.items():
            for i in range(1, n + 1):
                single_book(lv, i)
    if want("sets"):
        for lv in BOOKS_PER_LEVEL:
            level_set(lv)
    if want("library"):
        full_library()
    if want("workbooks"):
        for lv in BOOKS_PER_LEVEL:
            workbook(lv)
    if want("cards"):
        sound_card_deck()
        for lv in BOOKS_PER_LEVEL:
            word_card_deck(lv)
    if want("bundles"):
        for lv in BOOKS_PER_LEVEL:
            level_bundle(lv)
        family_bundle()
    if want("pens"):
        pen_pack()
    print("Done.")


if __name__ == "__main__":
    main()
