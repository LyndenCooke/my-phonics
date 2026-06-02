"""V3 Instagram posts — editorial typography, classic cream brand background,
9 distinct hook types. PIL-driven so logo + cover art are pixel-perfect.

Inspired by Lovevery / Reading Eggs aesthetic. Poppins display type.

Output: output/instagram_posts_v3/*.png at 1080 x 1350 (Instagram 4:5).
"""
from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(r"C:\Users\ASUS\myphonicsbooks\myphonics_books")
ASSETS = ROOT / "output/instagram_posts/_assets"
LOGO_LOCKUP = ROOT / "phonics-fun-hub/public/logo/mpb-lockup.png"
OUT_DIR = ROOT / "output/instagram_posts_v3"
OUT_DIR.mkdir(parents=True, exist_ok=True)

W, H = 1080, 1350

# ---- brand ----
CREAM       = (255, 248, 244)   # --background: 15 60% 98% ≈ MPB classic cream
CREAM_DEEP  = (250, 240, 232)   # secondary cream
INK         = (23, 28, 36)      # near-black for body text
INK_SOFT    = (60, 70, 86)      # secondary text
PINK        = (232, 75, 138)    # --level-1 / brand primary
INDIGO      = (49, 46, 129)     # accent
TINT_PINK   = (253, 237, 243)
TINT_GREEN  = (233, 248, 238)
TINT_BUTTER = (255, 245, 224)
TINT_LILAC  = (240, 235, 251)
TINT_BLUE   = (231, 240, 253)
TINT_TEAL   = (224, 245, 241)

LEVEL = {
    "L1": {"hex": (232, 75, 138),  "tint": TINT_PINK,   "name": "Starting Stories",  "slug": "L1_3", "title": "The Fish in the Tank"},
    "L2": {"hex": (245, 158, 11),  "tint": TINT_BUTTER, "name": "Longer Sounds",      "slug": "L2_1", "title": "The Night Light"},
    "L3": {"hex": (34, 197, 94),   "tint": TINT_GREEN,  "name": "New Spellings",      "slug": "L3_3", "title": "The Dream Team"},
    "L4": {"hex": (59, 130, 246),  "tint": TINT_BLUE,   "name": "Building Fluency",   "slug": "L4_1", "title": "The Purple Purse"},
    "L5": {"hex": (139, 92, 246),  "tint": TINT_LILAC,  "name": "Reading Together",   "slug": "L5_1", "title": "Before the Shore"},
    "L6": {"hex": (20, 184, 166),  "tint": TINT_TEAL,   "name": "Reading Champion",   "slug": "L6_4", "title": "The Incredible Bush Walk"},
}

# ---- fonts: Poppins display + Inter / Andika ----
USER_FONTS = Path(r"C:/Users/ASUS/AppData/Local/Microsoft/Windows/Fonts")
F_BLACK     = str(USER_FONTS / "Poppins-Black.ttf")
F_EXTRABOLD = str(USER_FONTS / "Poppins-ExtraBold.ttf")
F_BOLD      = str(USER_FONTS / "Poppins-Bold.ttf")
F_SEMI      = str(USER_FONTS / "Poppins-SemiBold.ttf")
F_MED       = str(USER_FONTS / "Poppins-Medium.ttf")
F_REG       = str(USER_FONTS / "Poppins-Regular.ttf")
F_ITAL      = str(USER_FONTS / "Poppins-Italic.ttf")


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def measure(d: ImageDraw.ImageDraw, text: str, f: ImageFont.FreeTypeFont) -> tuple[int, int]:
    l, t, r, b = d.textbbox((0, 0), text, font=f)
    return r - l, b - t


# ---- background utilities ----

def make_bg(color: tuple[int, int, int]) -> Image.Image:
    return Image.new("RGB", (W, H), color)


def add_paper_grain(img: Image.Image, strength: int = 3) -> Image.Image:
    """Very subtle paper-grain — adds tiny brightness variation only, no darkening."""
    import random
    base = img.convert("RGB").copy()
    px = base.load()
    rng = random.Random(42)
    for _ in range(W * H // 200):
        x = rng.randrange(W); y = rng.randrange(H)
        r, g, b = px[x, y]
        d = rng.randrange(-strength, strength + 1)
        px[x, y] = (max(0, min(255, r + d)), max(0, min(255, g + d)), max(0, min(255, b + d)))
    return base


def soft_shadow(im: Image.Image, blur: int = 28, alpha: int = 90,
                offset: tuple[int, int] = (0, 14)) -> tuple[Image.Image, tuple[int, int]]:
    pad = blur * 2
    base = Image.new("RGBA", (im.width + pad * 2, im.height + pad * 2), (0, 0, 0, 0))
    alpha_layer = im.split()[3] if im.mode == "RGBA" else None
    shadow_solid = Image.new("RGBA", im.size, (0, 0, 0, alpha))
    base.paste(shadow_solid, (pad, pad), alpha_layer)
    return base.filter(ImageFilter.GaussianBlur(blur)), (-pad + offset[0], -pad + offset[1])


def paste_with_shadow(canvas: Image.Image, im: Image.Image, x: int, y: int,
                      blur: int = 28, alpha: int = 90, offset: tuple[int, int] = (0, 14)) -> None:
    sh, (sx, sy) = soft_shadow(im, blur=blur, alpha=alpha, offset=offset)
    canvas.alpha_composite(sh, (x + sx, y + sy))
    canvas.alpha_composite(im if im.mode == "RGBA" else im.convert("RGBA"), (x, y))


def cover(slug: str, width: int) -> Image.Image:
    im = Image.open(ASSETS / f"cover_{slug}.png").convert("RGBA")
    h = int(width * im.height / im.width)
    return im.resize((width, h), Image.LANCZOS)


def logo(width: int) -> Image.Image:
    im = Image.open(LOGO_LOCKUP).convert("RGBA")
    h = int(width * im.height / im.width)
    return im.resize((width, h), Image.LANCZOS)


# ---- segmented headline (per-word colour + strikethrough) ----

@dataclass
class Seg:
    text: str
    colour: tuple[int, int, int] | None = None    # None = INK
    strike: bool = False
    weight: str = "black"   # 'black' | 'extrabold' | 'bold'


def headline_wrapped(canvas: Image.Image, segments: list[Seg], y: int,
                     size: int, max_w: int, line_gap: int = 6,
                     align: str = "centre") -> int:
    """Render a multi-segment headline that may wrap. Returns final y."""
    d = ImageDraw.Draw(canvas)

    def f_for(weight: str) -> ImageFont.FreeTypeFont:
        return font({"black": F_BLACK, "extrabold": F_EXTRABOLD, "bold": F_BOLD}[weight], size)

    # tokenise: keep spaces between words and segment boundaries; honour explicit \n
    tokens: list[tuple[Seg, str]] = []
    for s in segments:
        parts = s.text.split("\n")
        for pi, part in enumerate(parts):
            words = part.split(" ")
            for i, w in enumerate(words):
                if w:
                    tokens.append((s, w))
                if i < len(words) - 1:
                    tokens.append((s, " "))
            if pi < len(parts) - 1:
                tokens.append((s, "\n"))
        tokens.append((s, " "))  # space between segments
    while tokens and tokens[-1][1] in (" ", "\n"):
        tokens.pop()

    # word-wrap by line; honour explicit "\n" tokens as forced breaks
    lines: list[list[tuple[Seg, str]]] = []
    current: list[tuple[Seg, str]] = []
    cur_w = 0
    for seg, tok in tokens:
        if tok == "\n":
            while current and current[-1][1] == " ":
                current.pop()
            lines.append(current)
            current = []
            cur_w = 0
            continue
        f = f_for(seg.weight)
        tw = measure(d, tok, f)[0]
        if tok != " " and current and cur_w + tw > max_w:
            while current and current[-1][1] == " ":
                current.pop()
            lines.append(current)
            current = []
            cur_w = 0
        if not (tok == " " and not current):
            current.append((seg, tok))
            cur_w += tw
    if current:
        while current and current[-1][1] == " ":
            current.pop()
        lines.append(current)

    line_h = size  # rough
    sample_f = f_for("black")
    _, line_h = measure(d, "Hg", sample_f)

    for li, line in enumerate(lines):
        # compute line width
        line_w = 0
        for seg, tok in line:
            line_w += measure(d, tok, f_for(seg.weight))[0]
        if align == "centre":
            x = (W - line_w) // 2
        elif align == "left":
            x = (W - max_w) // 2
        else:
            x = (W + max_w) // 2 - line_w
        for seg, tok in line:
            f = f_for(seg.weight)
            tw, th = measure(d, tok, f)
            colour = seg.colour or INK
            d.text((x, y), tok, font=f, fill=colour)
            if seg.strike and tok.strip():
                sy = y + int(th * 0.55)
                d.line((x, sy, x + tw, sy), fill=colour, width=max(3, size // 22))
            x += tw
        y += line_h + line_gap

    return y


def simple_text(canvas: Image.Image, text: str, f: ImageFont.FreeTypeFont,
                y: int, max_w: int, fill: tuple[int, int, int],
                line_gap: int = 6, align: str = "centre") -> int:
    d = ImageDraw.Draw(canvas)
    words = text.split()
    lines: list[str] = []
    cur = ""
    for w in words:
        trial = (cur + " " + w).strip()
        if measure(d, trial, f)[0] <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    for line in lines:
        tw, th = measure(d, line, f)
        if align == "centre":
            x = (W - tw) // 2
        elif align == "left":
            x = (W - max_w) // 2
        else:
            x = (W + max_w) // 2 - tw
        d.text((x, y), line, font=f, fill=fill)
        y += th + line_gap
    return y


# ---- brand decoration ----

def colour_strip(canvas: Image.Image, y: int, height: int = 10) -> None:
    """Lovevery-style 6-segment colour strip across the canvas."""
    seg_w = W // 6
    d = ImageDraw.Draw(canvas)
    for i, lvl in enumerate(["L1", "L2", "L3", "L4", "L5", "L6"]):
        d.rectangle((i * seg_w, y, (i + 1) * seg_w, y + height), fill=LEVEL[lvl]["hex"])


def chip(canvas: Image.Image, text: str, cx: int, cy: int,
         bg: tuple[int, int, int], fg: tuple[int, int, int] = (255, 255, 255),
         size: int = 24, pad_x: int = 22, pad_y: int = 12) -> tuple[int, int]:
    d = ImageDraw.Draw(canvas)
    f = font(F_BOLD, size)
    tw, th = measure(d, text, f)
    w = tw + pad_x * 2
    h = th + pad_y * 2
    x = cx - w // 2
    y = cy - h // 2
    d.rounded_rectangle((x, y, x + w, y + h), radius=h // 2, fill=bg)
    d.text((x + pad_x, y + pad_y - 2), text, font=f, fill=fg)
    return w, h


def small_brand_mark(canvas: Image.Image, y: int = 56, width: int = 320) -> int:
    lg = logo(width)
    x = (W - lg.width) // 2
    canvas.alpha_composite(lg, (x, y))
    return y + lg.height


def footer_caption(canvas: Image.Image, text: str = "decodable phonics books · print at home",
                   y: int = H - 60) -> None:
    d = ImageDraw.Draw(canvas)
    f = font(F_MED, 22)
    tw, _ = measure(d, text, f)
    d.text(((W - tw) // 2, y), text, font=f, fill=INK_SOFT)


# ---- post layouts ----

def L_text_only_question(bg: tuple[int, int, int],
                         segments: list[Seg], subhead: str,
                         covers: list[str] | None = None,
                         size: int = 110) -> Image.Image:
    canvas = make_bg(bg).convert("RGBA")
    small_brand_mark(canvas, y=64, width=340)
    head_y_start = 220
    head_end = headline_wrapped(canvas, segments, head_y_start, size,
                                max_w=W - 120, line_gap=4)
    sub_y = head_end + 28
    sub_end = simple_text(canvas, subhead, font(F_SEMI, 38), sub_y, W - 200, INK_SOFT, 8)
    if covers:
        c_w = 260 if len(covers) == 1 else 220
        gap = 26
        total = c_w * len(covers) + gap * (len(covers) - 1)
        x0 = (W - total) // 2
        # place covers in lower half — anchor to bottom edge with margin
        cv_sample = cover(LEVEL[covers[0]]["slug"], c_w)
        cy = H - cv_sample.height - 90
        # if headline reached too far down, push covers down further (safety)
        cy = max(cy, sub_end + 60)
        for i, lvl in enumerate(covers):
            cv = cover(LEVEL[lvl]["slug"], c_w)
            rot = cv.rotate([-5, 0, 5][i] if len(covers) == 3 else 0,
                            resample=Image.BICUBIC, expand=True)
            x = x0 + i * (c_w + gap) - (rot.width - c_w) // 2
            paste_with_shadow(canvas, rot, x, cy, blur=26, alpha=95, offset=(0, 12))
    colour_strip(canvas, H - 18, 18)
    return canvas


def L_three_fan(bg: tuple[int, int, int], segments: list[Seg], subhead: str,
                levels: list[str], head_size: int = 96,
                head_top: bool = True) -> Image.Image:
    canvas = make_bg(bg).convert("RGBA")
    small_brand_mark(canvas, y=64, width=300)
    c_w = 300
    gap = 30
    total = c_w * 3 + gap * 2
    x0 = (W - total) // 2
    rotations = [-7, 0, 7]
    if head_top:
        head_end = headline_wrapped(canvas, segments, 230, head_size, max_w=W - 100, line_gap=4)
        sub_y = head_end + 22
        sub_end = simple_text(canvas, subhead, font(F_SEMI, 32), sub_y, W - 220, INK_SOFT, 6)
        cy = sub_end + 70
    else:
        cy = 240
    for i, lvl in enumerate(levels):
        cv = cover(LEVEL[lvl]["slug"], c_w)
        rot = cv.rotate(rotations[i], resample=Image.BICUBIC, expand=True)
        x = x0 + i * (c_w + gap) - (rot.width - c_w) // 2
        y = cy - (rot.height - cv.height) // 2
        paste_with_shadow(canvas, rot, x, y, blur=26, alpha=95, offset=(0, 12))
    if not head_top:
        bottom_y = cy + cv.height + 40
        head_end = headline_wrapped(canvas, segments, bottom_y, head_size, max_w=W - 100, line_gap=4)
        simple_text(canvas, subhead, font(F_SEMI, 32), head_end + 22, W - 220, INK_SOFT, 6)
    colour_strip(canvas, H - 18, 18)
    return canvas


def L_six_grid(bg: tuple[int, int, int], segments: list[Seg], subhead: str,
               head_size: int = 100) -> Image.Image:
    canvas = make_bg(bg).convert("RGBA")
    small_brand_mark(canvas, y=64, width=300)
    head_end = headline_wrapped(canvas, segments, 240, head_size, max_w=W - 120, line_gap=4)
    sub_y = head_end + 22
    sub_end = simple_text(canvas, subhead, font(F_SEMI, 32), sub_y, W - 240, INK_SOFT, 6)
    grid_y = sub_end + 60
    c_w = 290
    gap_x = 30
    gap_y = 24
    grid_w = c_w * 3 + gap_x * 2
    x0 = (W - grid_w) // 2
    for i, lvl in enumerate(["L1", "L2", "L3", "L4", "L5", "L6"]):
        row, col = divmod(i, 3)
        cv = cover(LEVEL[lvl]["slug"], c_w)
        paste_with_shadow(canvas, cv, x0 + col * (c_w + gap_x), grid_y + row * (cv.height + gap_y),
                          blur=22, alpha=80, offset=(0, 10))
    return canvas


def L_spotlight_big_number(level: str, segments: list[Seg], subhead: str,
                            head_size: int = 96) -> Image.Image:
    info = LEVEL[level]
    canvas = make_bg(info["tint"]).convert("RGBA")
    small_brand_mark(canvas, y=64, width=300)
    # giant number on the left, cover on the right
    d = ImageDraw.Draw(canvas)
    big_n = level[-1]
    f_giant = font(F_BLACK, 540)
    nw, nh = measure(d, big_n, f_giant)
    nx = 70
    ny = 250
    d.text((nx, ny), big_n, font=f_giant, fill=info["hex"])
    # cover next to number
    cv = cover(info["slug"], 460)
    cv_x = W - cv.width - 70
    cv_y = ny + 30
    paste_with_shadow(canvas, cv, cv_x, cv_y, blur=32, alpha=110, offset=(0, 16))
    # headline below
    head_y = max(ny + nh, cv_y + cv.height) + 30
    head_end = headline_wrapped(canvas, segments, head_y, head_size, max_w=W - 100, line_gap=2)
    simple_text(canvas, subhead, font(F_SEMI, 32), head_end + 16, W - 200, INK_SOFT, 6)
    return canvas


def L_centered_spotlight(level: str, segments: list[Seg], subhead: str,
                          head_size: int = 92) -> Image.Image:
    info = LEVEL[level]
    canvas = make_bg(CREAM).convert("RGBA")
    small_brand_mark(canvas, y=64, width=300)
    # level chip
    chip(canvas, f"LEVEL {level[1]} · {info['name'].upper()}",
         cx=W // 2, cy=240, bg=info["hex"], size=24)
    cv = cover(info["slug"], 520)
    cv_x = (W - cv.width) // 2
    cv_y = 300
    paste_with_shadow(canvas, cv, cv_x, cv_y, blur=34, alpha=110, offset=(0, 16))
    head_y = cv_y + cv.height + 36
    head_end = headline_wrapped(canvas, segments, head_y, head_size, max_w=W - 100, line_gap=2)
    simple_text(canvas, subhead, font(F_SEMI, 30), head_end + 14, W - 200, INK_SOFT, 6)
    return canvas


# ---- 9 POSTS — each a different hook ----

POSTS = {
    # 1. PAIN-POINT QUESTION (binary). The "is your child..." opener.
    "01_question_guessing": dict(
        builder=L_text_only_question,
        bg=CREAM,
        segments=[
            Seg("Is your child"),
            Seg(" guessing", colour=PINK),
            Seg(" words from\nthe pictures?"),
        ],
        subhead="If yes — they need decodable books.",
        covers=["L1"],
        size=96,
    ),
    # 2. CONTRARIAN — most-aren't-actually
    "02_contrarian_decodable": dict(
        builder=L_text_only_question,
        bg=CREAM,
        segments=[
            Seg("Most reading books"), Seg(" "),
            Seg("aren't decodable.", colour=PINK),
        ],
        subhead="Every word in ours is. Matched to your child's exact level.",
        covers=["L1", "L3", "L5"],
        size=100,
    ),
    # 3. BIG NUMBER — L1 spotlight
    "03_big_number_L1": dict(
        builder=L_spotlight_big_number,
        level="L1",
        segments=[Seg("Just learning their"), Seg(" "),
                  Seg("sounds?", colour=PINK)],
        subhead="Start with Level 1 — Starting Stories.",
        head_size=72,
    ),
    # 4. BIG PROMISE — first book they can actually read
    "04_first_book_actually": dict(
        builder=L_centered_spotlight,
        level="L3",
        segments=[Seg("Their first book they can"), Seg(" "),
                  Seg("actually read.", colour=PINK)],
        subhead="Every word matched to the sounds they've been taught.",
        head_size=64,
    ),
    # 5. SIX LEVELS LADDER — all 6 covers
    "05_six_levels_grid": dict(
        builder=L_six_grid,
        bg=CREAM,
        segments=[Seg("Six levels."), Seg(" "),
                  Seg("One for your child.", colour=PINK)],
        subhead="From their first sound to reading independently.",
        head_size=80,
    ),
    # 6. CURIOSITY GAP — what level
    "06_what_level": dict(
        builder=L_three_fan,
        bg=CREAM,
        segments=[Seg("What level is your child"), Seg(" "),
                  Seg("reading at?", colour=PINK)],
        subhead="Free 2-minute assessment — link in bio.",
        levels=["L2", "L4", "L6"],
        head_size=82,
        head_top=True,
    ),
    # 7. BEFORE/AFTER — battle / ritual
    "07_battle_ritual": dict(
        builder=L_text_only_question,
        bg=CREAM,
        segments=[
            Seg("Bedtime reading used to be a "),
            Seg("battle.", colour=PINK, strike=True),
            Seg("\n"),  # newline trick (handled as space — break manually)
        ],
        subhead="Now it's the calmest part of the day.",
        covers=["L4"],
        size=104,
    ),
    # 8. FOUNDER WHY — story hook
    "08_school_readers": dict(
        builder=L_three_fan,
        bg=CREAM,
        segments=[Seg("School readers weren't"), Seg(" "),
                  Seg("enough.", colour=PINK)],
        subhead="So we made the books our own children actually wanted to read.",
        levels=["L1", "L3", "L5"],
        head_size=92,
        head_top=False,
    ),
    # 9. DIVERSITY / REPRESENTATION
    "09_see_themselves": dict(
        builder=L_six_grid,
        bg=CREAM,
        segments=[Seg("A character your child"), Seg(" "),
                  Seg("can see themselves in.", colour=PINK)],
        subhead="Six children. Six adventures. One in every book.",
        head_size=72,
    ),
}


def build(post_id: str) -> Path:
    spec = POSTS[post_id]
    builder = spec.pop("builder")
    canvas = builder(**spec)
    spec["builder"] = builder  # restore for repeated runs
    canvas = add_paper_grain(canvas.convert("RGB"), strength=3)
    out = OUT_DIR / f"{post_id}.png"
    canvas.save(out, optimize=True)
    print(f"  -> {out}")
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default=None)
    args = ap.parse_args()
    targets = [args.only] if args.only else list(POSTS)
    for t in targets:
        match = [k for k in POSTS if k.startswith(t) or k == t]
        for m in match:
            print(f"[{m}] building...")
            build(m)


if __name__ == "__main__":
    main()
