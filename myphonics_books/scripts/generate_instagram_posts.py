"""Generate 9 Instagram posts for MyPhonicsBooks.

Pipeline:
  1. OpenAI gpt-image-1 -> soft watercolor brand background (no text, no objects)
  2. PIL composites real book covers + logo + headline typography on top

Final size: 1080 x 1350 (Instagram 4:5 portrait — the 'rectangle' that looks
good on the profile grid).
"""
from __future__ import annotations

import base64
import io
import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(r"C:\Users\ASUS\myphonicsbooks\myphonics_books")
load_dotenv(ROOT / ".env")

OUT_DIR = ROOT / "output/instagram_posts"
BG_DIR = OUT_DIR / "_backgrounds"
ASSETS = OUT_DIR / "_assets"
LOGO_LOCKUP = ROOT / "phonics-fun-hub/public/logo/mpb-lockup.png"
LOGO_MARK = ROOT / "phonics-fun-hub/public/logo/mpb-mark-transparent.png"
LOGO_WORDMARK = ROOT / "phonics-fun-hub/public/logo/mpb-wordmark.png"

W, H = 1080, 1350

# Brand colours
NAVY = (31, 41, 55)
INDIGO_900 = (49, 46, 129)
INDIGO_50 = (238, 242, 255)
WHITE = (255, 255, 255)
LEVEL_COLOURS = {
    "L1": "#E84B8A", "L2": "#F59E0B", "L3": "#22C55E",
    "L4": "#3B82F6", "L5": "#8B5CF6", "L6": "#14B8A6",
}

# Fonts: Segoe UI family as Outfit/Plus Jakarta Sans substitutes
F_BLACK = "C:/Windows/Fonts/seguibl.ttf"   # Segoe UI Black - massive headlines
F_BOLD  = "C:/Windows/Fonts/segoeuib.ttf"  # Bold
F_SEMI  = "C:/Windows/Fonts/seguisb.ttf"   # Semibold
F_REG   = "C:/Windows/Fonts/segoeui.ttf"


@dataclass
class Book:
    slug: str
    title: str
    level: str
    level_name: str
    colour: str

BOOKS = {
    "L1": Book("L1_3", "The Fish in the Tank",     "L1", "Starting Stories",   "#E84B8A"),
    "L2": Book("L2_1", "The Night Light",          "L2", "Longer Sounds",      "#F59E0B"),
    "L3": Book("L3_3", "The Dream Team",           "L3", "New Spellings",      "#22C55E"),
    "L4": Book("L4_1", "The Purple Purse",         "L4", "Building Fluency",   "#3B82F6"),
    "L5": Book("L5_1", "Before the Shore",         "L5", "Reading Together",   "#8B5CF6"),
    "L6": Book("L6_4", "The Incredible Bush Walk", "L6", "Reading Champion",   "#14B8A6"),
}


# ---------- helpers ----------

def hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def text_size(draw: ImageDraw.ImageDraw, text: str, f: ImageFont.FreeTypeFont) -> tuple[int, int]:
    l, t, r, b = draw.textbbox((0, 0), text, font=f)
    return r - l, b - t


def drop_shadow(img: Image.Image, blur: int = 30, alpha: int = 110) -> Image.Image:
    """Return an RGBA shadow plate the same size as img with extra padding."""
    pad = blur * 2
    base = Image.new("RGBA", (img.width + pad * 2, img.height + pad * 2), (0, 0, 0, 0))
    shadow = Image.new("RGBA", img.size, (0, 0, 0, alpha))
    base.paste(shadow, (pad, pad), img.split()[3] if img.mode == "RGBA" else None)
    return base.filter(ImageFilter.GaussianBlur(blur))


def paste_with_shadow(canvas: Image.Image, img: Image.Image, x: int, y: int,
                      blur: int = 30, alpha: int = 110, offset: tuple[int, int] = (0, 12)) -> None:
    shadow = drop_shadow(img, blur=blur, alpha=alpha)
    pad = blur * 2
    canvas.alpha_composite(shadow, (x - pad + offset[0], y - pad + offset[1]))
    canvas.alpha_composite(img if img.mode == "RGBA" else img.convert("RGBA"), (x, y))


def fit_book_cover(path: Path, target_w: int) -> Image.Image:
    """Open cover, scale to target width keeping A5 aspect ratio (1480:2095), with a soft rounded shadow."""
    im = Image.open(path).convert("RGBA")
    aspect = im.height / im.width
    target_h = int(target_w * aspect)
    return im.resize((target_w, target_h), Image.LANCZOS)


def wrap_text(draw: ImageDraw.ImageDraw, text: str, f: ImageFont.FreeTypeFont, max_w: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    cur = ""
    for w in words:
        trial = (cur + " " + w).strip()
        if text_size(draw, trial, f)[0] <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def draw_text_block(canvas: Image.Image, text: str, f: ImageFont.FreeTypeFont,
                    centre_x: int, top_y: int, max_w: int,
                    fill: tuple[int, int, int] = NAVY,
                    line_gap: int = 8, align: str = "centre") -> int:
    """Return total drawn height."""
    d = ImageDraw.Draw(canvas)
    lines = wrap_text(d, text, f, max_w)
    y = top_y
    for line in lines:
        w, h = text_size(d, line, f)
        if align == "centre":
            x = centre_x - w // 2
        elif align == "left":
            x = centre_x
        else:
            x = centre_x - w
        d.text((x, y), line, font=f, fill=fill)
        y += h + line_gap
    return y - top_y


# ---------- background generation via OpenAI ----------

_client: OpenAI | None = None

def client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI()
    return _client


def get_background(name: str, prompt: str) -> Image.Image:
    """Generate (or load cached) background. Saves as PNG in _backgrounds dir."""
    cache = BG_DIR / f"{name}.png"
    if cache.exists():
        return Image.open(cache).convert("RGB").resize((W, H), Image.LANCZOS)

    BG_DIR.mkdir(parents=True, exist_ok=True)
    print(f"  > generating background via OpenAI: {name}")
    full_prompt = (
        prompt
        + " Hand-painted watercolour wash texture, soft and gentle, plenty of empty space, "
        "no objects, no people, no animals, no text, no letters, no numbers, no logos. "
        "Bright, airy, friendly children's book brand aesthetic. Vertical composition."
    )
    resp = client().images.generate(
        model="gpt-image-1",
        prompt=full_prompt,
        size="1024x1536",
        quality="medium",
        n=1,
    )
    b64 = resp.data[0].b64_json
    raw = Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGB")
    raw.save(cache)
    # Resize 1024x1536 (2:3) to 1080x1350 (4:5) — crop centre vertically.
    scale = W / raw.width
    new_h = int(raw.height * scale)
    raw = raw.resize((W, new_h), Image.LANCZOS)
    top = (new_h - H) // 2
    return raw.crop((0, top, W, top + H))


# ---------- logo ----------

def add_logo(canvas: Image.Image, position: str = "top", scale: float = 0.42) -> None:
    """Place the lockup logo. position: 'top' or 'bottom'."""
    logo = Image.open(LOGO_LOCKUP).convert("RGBA")
    target_w = int(W * scale)
    target_h = int(target_w * logo.height / logo.width)
    logo = logo.resize((target_w, target_h), Image.LANCZOS)
    x = (W - target_w) // 2
    y = 60 if position == "top" else H - target_h - 50
    canvas.alpha_composite(logo, (x, y))


# ---------- layout: 6-up grid (3 cols x 2 rows) ----------

def layout_all_six(bg: Image.Image, headline: str, subhead: str,
                   showcase_levels: list[str]) -> Image.Image:
    canvas = bg.convert("RGBA")
    add_logo(canvas, "top", scale=0.40)

    # 6 covers in 3 cols x 2 rows
    cover_w = 280
    gap_x = 30
    gap_y = 24
    grid_w = cover_w * 3 + gap_x * 2
    grid_x = (W - grid_w) // 2

    # Headline first (between logo and grid)
    d = ImageDraw.Draw(canvas)
    f_head = font(F_BLACK, 78)
    f_sub = font(F_SEMI, 36)

    headline_y = 220
    drew = draw_text_block(canvas, headline, f_head, W // 2, headline_y, W - 120,
                           fill=NAVY, line_gap=6)
    sub_y = headline_y + drew + 8
    if subhead:
        draw_text_block(canvas, subhead, f_sub, W // 2, sub_y, W - 160,
                        fill=INDIGO_900, line_gap=4)

    # Grid below
    grid_y = sub_y + (90 if subhead else 70)

    for i, lvl in enumerate(showcase_levels):
        row, col = divmod(i, 3)
        cover = fit_book_cover(ASSETS / f"cover_{BOOKS[lvl].slug}.png", cover_w)
        x = grid_x + col * (cover_w + gap_x)
        y = grid_y + row * (cover.height + gap_y)
        paste_with_shadow(canvas, cover, x, y, blur=22, alpha=80, offset=(0, 8))

    return canvas


# ---------- layout: 3 covers in a row, headline below ----------

def layout_three_row(bg: Image.Image, headline: str, subhead: str,
                     levels: list[str], headline_top: bool = True) -> Image.Image:
    canvas = bg.convert("RGBA")
    add_logo(canvas, "top", scale=0.40)

    cover_w = 290
    gap = 30
    row_w = cover_w * 3 + gap * 2
    row_x = (W - row_w) // 2

    f_head = font(F_BLACK, 80)
    f_sub = font(F_SEMI, 36)

    if headline_top:
        head_y = 230
        drew = draw_text_block(canvas, headline, f_head, W // 2, head_y, W - 120, NAVY, 6)
        sub_y = head_y + drew + 14
        if subhead:
            draw_text_block(canvas, subhead, f_sub, W // 2, sub_y, W - 160, INDIGO_900, 4)
        covers_y = sub_y + (110 if subhead else 90)
    else:
        covers_y = 240

    # Place covers, slight fan/rotation for personality
    rotations = [-6, 0, 6]
    for i, lvl in enumerate(levels):
        cover = fit_book_cover(ASSETS / f"cover_{BOOKS[lvl].slug}.png", cover_w)
        rot = cover.rotate(rotations[i], resample=Image.BICUBIC, expand=True)
        x = row_x + i * (cover_w + gap) - (rot.width - cover_w) // 2
        y = covers_y - (rot.height - cover.height) // 2
        paste_with_shadow(canvas, rot, x, y, blur=26, alpha=95, offset=(0, 12))

    if not headline_top:
        covers_bottom = covers_y + cover.height + 40
        drew = draw_text_block(canvas, headline, f_head, W // 2, covers_bottom, W - 120, NAVY, 6)
        if subhead:
            draw_text_block(canvas, subhead, f_sub, W // 2, covers_bottom + drew + 14, W - 160, INDIGO_900, 4)

    return canvas


# ---------- layout: spotlight one book ----------

def layout_spotlight(bg: Image.Image, lvl: str, headline: str, subhead: str) -> Image.Image:
    canvas = bg.convert("RGBA")
    add_logo(canvas, "top", scale=0.40)

    book = BOOKS[lvl]
    colour_rgb = hex_to_rgb(book.colour)

    # Level chip near top
    d = ImageDraw.Draw(canvas)
    chip_label = f"LEVEL {lvl[1]} · {book.level_name.upper()}"
    f_chip = font(F_BOLD, 28)
    cw, ch = text_size(d, chip_label, f_chip)
    chip_pad_x, chip_pad_y = 28, 14
    chip_w = cw + chip_pad_x * 2
    chip_h = ch + chip_pad_y * 2
    chip_x = (W - chip_w) // 2
    chip_y = 230
    d.rounded_rectangle(
        (chip_x, chip_y, chip_x + chip_w, chip_y + chip_h),
        radius=chip_h // 2, fill=colour_rgb,
    )
    d.text((chip_x + chip_pad_x, chip_y + chip_pad_y - 2), chip_label, font=f_chip, fill=WHITE)

    # Cover centred below chip
    cover_w = 520
    cover = fit_book_cover(ASSETS / f"cover_{book.slug}.png", cover_w)
    cover_x = (W - cover_w) // 2
    cover_y = chip_y + chip_h + 40
    paste_with_shadow(canvas, cover, cover_x, cover_y, blur=36, alpha=120, offset=(0, 18))

    # Headline below cover
    f_head = font(F_BLACK, 64)
    f_sub = font(F_SEMI, 32)
    head_y = cover_y + cover.height + 36
    drew = draw_text_block(canvas, headline, f_head, W // 2, head_y, W - 120, NAVY, 4)
    if subhead:
        draw_text_block(canvas, subhead, f_sub, W // 2, head_y + drew + 10, W - 160, INDIGO_900, 4)

    return canvas


# ---------- post specs ----------

POSTS = [
    {
        "name": "01_hero_all_six",
        "layout": "all_six",
        "bg_prompt": ("Soft warm cream and peach watercolour wash background, faint blush pink "
                      "and gentle butter yellow blooms in the corners, mostly empty centre."),
        "headline": "Decodable phonics books.",
        "subhead": "Print at home. Read tonight.",
        "levels": ["L1", "L2", "L3", "L4", "L5", "L6"],
    },
    {
        "name": "02_three_starting",
        "layout": "three_row",
        "bg_prompt": "Pale pink and rose watercolour wash, soft cloudy texture, plenty of breathing room.",
        "headline": "Just starting to read?",
        "subhead": "Stories made of the sounds they already know.",
        "levels": ["L1", "L2", "L3"],
        "headline_top": True,
    },
    {
        "name": "03_three_growing",
        "layout": "three_row",
        "bg_prompt": "Pale sky-blue and lavender watercolour wash, gentle and airy, lots of soft empty space.",
        "headline": "Building reading confidence.",
        "subhead": "Longer words. Bigger adventures.",
        "levels": ["L4", "L5", "L6"],
        "headline_top": True,
    },
    {
        "name": "04_spotlight_L3",
        "layout": "spotlight",
        "bg_prompt": "Very pale mint green watercolour wash, soft and subtle, lots of negative space.",
        "level": "L3",
        "headline": "Magic-e words, new spellings.",
        "subhead": "When sh, ch, and th aren't enough anymore.",
    },
    {
        "name": "05_spotlight_L5",
        "layout": "spotlight",
        "bg_prompt": "Very pale lavender and lilac watercolour wash, dreamy and gentle, mostly empty.",
        "level": "L5",
        "headline": "Longer stories. Deeper meaning.",
        "subhead": "When they want a real book to read together.",
    },
    {
        "name": "06_six_levels_grid",
        "layout": "all_six",
        "bg_prompt": ("Pale indigo and soft cream watercolour wash, very gentle and subtle, "
                      "lots of clean empty space, faint sparkle texture in corners."),
        "headline": "Six reading levels.",
        "subhead": "One that fits your child today.",
        "levels": ["L1", "L2", "L3", "L4", "L5", "L6"],
    },
    {
        "name": "07_print_at_home",
        "layout": "three_row",
        "bg_prompt": "Warm cream and butter-yellow watercolour wash, cosy and homely, soft texture, mostly empty.",
        "headline": "Print at home tonight.",
        "subhead": "A5 PDF — saddle-stitch booklet ready.",
        "levels": ["L2", "L4", "L6"],
        "headline_top": False,
    },
    {
        "name": "08_uk_curriculum",
        "layout": "three_row",
        "bg_prompt": "Pale slate blue and soft lavender watercolour wash, calm and trustworthy, plenty of empty space.",
        "headline": "Aligned with the UK phonics curriculum.",
        "subhead": "Every word matched to your child's level.",
        "levels": ["L1", "L3", "L5"],
        "headline_top": True,
    },
    {
        "name": "09_a_story_for_every_child",
        "layout": "all_six",
        "bg_prompt": ("Soft rainbow watercolour wash, faintest pastel hints of pink, amber, green, blue, "
                      "violet and teal in the corners, mostly cream centre, very subtle and gentle."),
        "headline": "A story for every child.",
        "subhead": "Six characters. Six adventures. One in every book.",
        "levels": ["L1", "L2", "L3", "L4", "L5", "L6"],
    },
]


def build_post(spec: dict) -> Image.Image:
    bg = get_background(spec["name"], spec["bg_prompt"])
    if spec["layout"] == "all_six":
        return layout_all_six(bg, spec["headline"], spec["subhead"], spec["levels"])
    if spec["layout"] == "three_row":
        return layout_three_row(bg, spec["headline"], spec["subhead"], spec["levels"],
                                headline_top=spec.get("headline_top", True))
    if spec["layout"] == "spotlight":
        return layout_spotlight(bg, spec["level"], spec["headline"], spec["subhead"])
    raise ValueError(f"unknown layout {spec['layout']}")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="comma-separated names to build (else all)")
    args = ap.parse_args()
    only = set(args.only.split(",")) if args.only else None
    for spec in POSTS:
        if only and spec["name"] not in only:
            continue
        print(f"[{spec['name']}] building...")
        img = build_post(spec).convert("RGB")
        out = OUT_DIR / f"{spec['name']}.png"
        img.save(out, optimize=True)
        print(f"  -> {out}  {img.size}")


if __name__ == "__main__":
    main()
