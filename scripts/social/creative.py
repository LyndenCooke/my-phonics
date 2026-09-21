"""
Branded 1080x1080 Facebook creatives, white background, in the MyPhonicsBooks
house style (Outfit type, level colours, sticker accents):

  render_creative(item, pages_png, out)   worksheet day: pill, headline, the
                                          day's sheets fanned (with the story's
                                          booklet cutout behind them when the
                                          pack belongs to a book), four benefit
                                          icons, "Download for free" button, logo
  render_book_creative(item, out)         book day: same skeleton around the
                                          photographic booklet cutout
"""
import io
import math
import os

from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FONT = os.path.join(ROOT, "marketing", "social", "assets", "Outfit.ttf")
LOGO = os.path.join(ROOT, "public", "logo", "mpb-lockup.png")
CUTOUTS = os.path.join(ROOT, "public", "shop", "cutouts")

W, H = 1080, 1080
WHITE = (255, 255, 255)
NAVY = (30, 42, 74)
INK = (90, 96, 112)
PINK = (232, 75, 138)
YELLOW = (255, 214, 10)
GREEN = (74, 189, 109)
LAVENDER = (226, 214, 250)
LEVEL_COLOURS = {1: (232, 75, 138), 2: (255, 122, 89), 3: (245, 166, 35), 4: (74, 189, 109),
                 5: (91, 158, 255), 6: (167, 142, 255), 7: (154, 92, 255), 8: (43, 138, 110)}
STICKER = {1: "Perfect for early readers!", 2: "Perfect for early readers!", 3: "Perfect for early readers!",
           4: "Great for Year 1!", 5: "Great for Year 1!", 6: "For confident readers!",
           7: "For confident readers!", 8: "For confident readers!"}
BENEFITS = [("book", "Builds reading skills"), ("pencil", "Fun and engaging"),
            ("star", "Ideal for home learning"), ("heart", "Supports confidence")]


def font(size, weight=800):
    f = ImageFont.truetype(FONT, size)
    try:
        f.set_variation_by_axes([weight])
    except Exception:
        pass
    return f


def _fit(d, text, size, max_w, min_size=40):
    f = font(size)
    while d.textlength(text, font=f) > max_w and size > min_size:
        size -= 3
        f = font(size)
    return f


def _wrap(d, text, f, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=f) <= max_w:
            cur = t
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def _shadowed(canvas, im, xy, blur=18, offset=(0, 16), alpha=70):
    """Paste an RGBA image with a soft drop shadow."""
    x, y = xy
    sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    dark = Image.new("RGBA", im.size, (30, 20, 40, 255))
    dark.putalpha(im.split()[-1].point(lambda a: int(a * alpha / 255)))
    sh.alpha_composite(dark, (x + offset[0], y + offset[1]))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)))
    canvas.alpha_composite(im, (x, y))


def _sparkle(d, x, y, colour, size=44, angle=0):
    """Three short strokes, the 'attention' sticker used on the site."""
    for a in (-35, 0, 35):
        r = math.radians(angle + a)
        d.line([(x, y), (x + math.cos(r) * size, y - math.sin(r) * size)], fill=colour, width=9)


def _pill(d, text, cy, fill, colour, size=30, pad=(40, 16), x=None, weight=800):
    f = font(size, weight)
    tw = d.textlength(text, font=f)
    w, h = tw + pad[0] * 2, size + pad[1] * 2
    x0 = (W - w) / 2 if x is None else x
    d.rounded_rectangle([x0, cy - h / 2, x0 + w, cy + h / 2], h / 2, fill=fill)
    d.text((x0 + pad[0], cy - h / 2 + pad[1] - 3), text, font=f, fill=colour)
    return x0, cy - h / 2, x0 + w, cy + h / 2


def _sticker(canvas, text, cx, cy, r=118, fill=YELLOW, angle=-10):
    """Round yellow sticker with rotated text, like the reference."""
    layer = Image.new("RGBA", (r * 2 + 20, r * 2 + 20), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse([10, 10, 10 + r * 2, 10 + r * 2], fill=fill)
    f = font(30, 800)
    lines = _wrap(d, text, f, r * 2 - 50)
    total = len(lines) * 36
    for i, ln in enumerate(lines):
        d.text((10 + r - d.textlength(ln, font=f) / 2, 10 + r - total / 2 + i * 36), ln, font=f, fill=NAVY)
    layer = layer.rotate(angle, expand=True, resample=Image.BICUBIC)
    canvas.alpha_composite(layer, (int(cx - layer.width / 2), int(cy - layer.height / 2)))


def _icon(d, kind, cx, cy, s=34):
    """Simple flat icons in brand colours."""
    if kind == "book":
        d.rounded_rectangle([cx - s, cy - s * 0.8, cx, cy + s * 0.8], 8, fill=(91, 158, 255), outline=NAVY, width=4)
        d.rounded_rectangle([cx, cy - s * 0.8, cx + s, cy + s * 0.8], 8, fill=(200, 224, 255), outline=NAVY, width=4)
    elif kind == "pencil":
        pts = [(cx - s, cy + s * 0.6), (cx + s * 0.6, cy - s), (cx + s, cy - s * 0.6), (cx - s * 0.6, cy + s)]
        d.polygon(pts, fill=YELLOW, outline=NAVY)
        d.polygon([(cx - s, cy + s * 0.6), (cx - s * 0.6, cy + s), (cx - s * 1.05, cy + s * 1.05)], fill=NAVY)
    elif kind == "star":
        pts = []
        for i in range(10):
            rr = s if i % 2 == 0 else s * 0.45
            a = math.radians(-90 + i * 36)
            pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
        d.polygon(pts, fill=YELLOW, outline=NAVY)
    elif kind == "heart":
        r = s * 0.5
        d.ellipse([cx - s, cy - s * 0.7, cx - s + 2 * r, cy - s * 0.7 + 2 * r], fill=PINK, outline=NAVY, width=3)
        d.ellipse([cx, cy - s * 0.7, cx + 2 * r, cy - s * 0.7 + 2 * r], fill=PINK, outline=NAVY, width=3)
        d.polygon([(cx - s + 2, cy), (cx + s - 2, cy), (cx, cy + s)], fill=PINK)
        d.line([(cx - s + 2, cy), (cx, cy + s), (cx + s - 2, cy)], fill=NAVY, width=3)


def _benefits(canvas, y):
    d = ImageDraw.Draw(canvas)
    col_w = (W - 60) / 4
    f = font(24, 700)
    for i, (kind, label) in enumerate(BENEFITS):
        x0 = 30 + i * col_w
        _icon(d, kind, x0 + 38, y, 28)
        lines = _wrap(d, label, f, col_w - 86)
        top = y - 14 * len(lines)
        for j, ln in enumerate(lines[:3]):
            d.text((x0 + 82, top + j * 28), ln, font=f, fill=NAVY)


def _download_button(canvas, cy, label="Download for free"):
    d = ImageDraw.Draw(canvas)
    f = font(44, 800)
    tw = d.textlength(label, font=f)
    w, h = tw + 170, 92
    x0 = (W - w) / 2 - 40
    d.rounded_rectangle([x0, cy - h / 2, x0 + w, cy + h / 2], h / 2, fill=GREEN)
    # arrow-into-tray glyph
    ax, ay = x0 + 60, cy
    d.line([(ax, ay - 22), (ax, ay + 8)], fill=WHITE, width=7)
    d.polygon([(ax - 16, ay - 2), (ax + 16, ay - 2), (ax, ay + 14)], fill=WHITE)
    d.line([(ax - 22, ay + 22), (ax + 22, ay + 22)], fill=WHITE, width=7)
    d.text((x0 + 100, cy - h / 2 + 22), label, font=f, fill=WHITE)
    _sparkle(d, x0 - 34, cy + 4, GREEN, 30, 150)
    _sparkle(d, x0 + w + 34, cy + 4, GREEN, 30, 30)
    # logo lockup at the right
    lg = Image.open(LOGO).convert("RGBA")
    lh = 52
    lg = lg.resize((int(lg.width * lh / lg.height), lh), Image.LANCZOS)
    canvas.alpha_composite(lg, (W - lg.width - 40, int(cy - lh / 2)))


def _header(canvas, item, kicker):
    """Pill + headline + subline + sparkle + sticker. Returns y below the header."""
    d = ImageDraw.Draw(canvas)
    level = item["level"]
    colour = LEVEL_COLOURS.get(level, PINK)
    _pill(d, kicker, 62, LAVENDER, NAVY, 34)
    _sparkle(d, 96, 178, colour, 44, 200)
    _sticker(canvas, STICKER.get(level, ""), W - 112, 128, r=92)
    # Headline lives in the band between the sparkle and the sticker.
    head = item.get("headline") or item["title"]
    max_w = W - 2 * 215
    hf = _fit(d, head, 92, max_w, min_size=64)
    lines = [head] if d.textlength(head, font=hf) <= max_w else _wrap(d, head, hf, max_w)[:2]
    y = 104
    for ln in lines:
        d.text(((W - d.textlength(ln, font=hf)) / 2, y), ln, font=hf, fill=NAVY)
        y += int(hf.size * 1.02)
    sub = item.get("subline", "")
    sf = font(34, 600)
    if sub:
        d.text(((W - d.textlength(sub, font=sf)) / 2, y + 8), sub, font=sf, fill=NAVY)
        y += 50
    return y + 20


def _cutout(item, width):
    path = os.path.join(CUTOUTS, f"r-l{item['level']}-{item.get('book_idx', 1)}.png")
    if not os.path.exists(path):
        return None
    im = Image.open(path).convert("RGBA")
    return im.resize((width, int(im.height * width / im.width)), Image.LANCZOS)


def render_creative(item, pages_png: list, out_path: str):
    """Worksheet day: the sheets fanned across the middle, story booklet behind if any."""
    c = Image.new("RGBA", (W, H), WHITE + (255,))
    top = _header(c, item, "FREE PHONICS WORKSHEETS")
    band_top, band_bottom = top, H - 300
    n = max(1, len(pages_png))

    # Story booklet peeking out behind the sheets, when the pack belongs to a book
    if item.get("book_idx"):
        cut = _cutout(item, 360)
        if cut is not None:
            cut = cut.rotate(8, expand=True, resample=Image.BICUBIC)
            _shadowed(c, cut, (W - cut.width - 20, band_bottom - cut.height + 10), alpha=50)

    # Fanned sheets: -6°, 0°, +6°, overlapping
    sheet_h = band_bottom - band_top - 40
    sheet_w = int(sheet_h / 1.414)
    spread = 300 if n == 3 else (240 if n == 2 else 0)
    angles = {1: [0], 2: [-4, 4], 3: [-7, 0, 7]}[min(n, 3)]
    for i, png in enumerate(pages_png[:3]):
        page = Image.open(io.BytesIO(png)).convert("RGB").resize((sheet_w, sheet_h), Image.LANCZOS).convert("RGBA")
        frame = Image.new("RGBA", (sheet_w + 16, sheet_h + 16), WHITE + (255,))
        frame.alpha_composite(page, (8, 8))
        frame = frame.rotate(angles[i], expand=True, resample=Image.BICUBIC)
        cx = W / 2 + (i - (n - 1) / 2) * spread
        cy = band_top + (band_bottom - band_top) / 2
        _shadowed(c, frame, (int(cx - frame.width / 2), int(cy - frame.height / 2)))

    _benefits(c, H - 215)
    _download_button(c, H - 95)
    c.convert("RGB").save(out_path, quality=92)
    return out_path


def render_book_creative(item, out_path: str):
    """Book day: the photographic booklet large in the middle."""
    c = Image.new("RGBA", (W, H), WHITE + (255,))
    top = _header(c, item, "FREE DECODABLE BOOK")
    band_top, band_bottom = top, H - 300
    cut = _cutout(item, 640)
    if cut is not None:
        cut = cut.rotate(-3, expand=True, resample=Image.BICUBIC)
        scale = min(1.0, (band_bottom - band_top - 20) / cut.height)
        if scale < 1:
            cut = cut.resize((int(cut.width * scale), int(cut.height * scale)), Image.LANCZOS)
        _shadowed(c, cut, (int((W - cut.width) / 2), int(band_top + (band_bottom - band_top - cut.height) / 2)), blur=26, offset=(0, 22))
    _benefits(c, H - 215)
    _download_button(c, H - 95, "Print it for free")
    c.convert("RGB").save(out_path, quality=92)
    return out_path
