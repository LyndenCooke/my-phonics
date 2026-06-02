"""
Aesthetic exploration run on gpt-image-2.

Five distinct visual treatments, same brand vocabulary. Designed to
show the range of what gpt-image-2 can render so Lynden can pick a
direction.

Run: python .scratch/explore_aesthetics.py

Budget: approx $0.92 (2 square high + 3 portrait high).
"""

from __future__ import annotations

import base64
import os
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = REPO_ROOT / "myphonics_books" / ".env"
OUT_DIR = REPO_ROOT / ".scratch" / "smoke"
OUT_DIR.mkdir(parents=True, exist_ok=True)

load_dotenv(ENV_PATH)
API_KEY = os.environ.get("OPENAI_API_KEY")
if not API_KEY or not API_KEY.startswith("sk-"):
    print(f"ERROR: OPENAI_API_KEY not found / invalid in {ENV_PATH}")
    sys.exit(1)

MODEL = "gpt-image-2"

BRAND_CORE = (
    "Brand palette for MyPhonicsBooks: deep indigo #312e81 primary, warm cream "
    "#FAF6EF, near-black #0B0B0F, with level accent colours pink #E84B8A, amber "
    "#F59E0B, green #22C55E, blue #3B82F6, purple #8B5CF6, teal #14B8A6. "
    "Typography: Outfit 900 for headlines and numbers; Outfit 700 for CTAs; "
    "Plus Jakarta Sans for body. No emojis. British English. No em dashes. "
    "No realistic human faces. No photorealism of people. Keep the top-right "
    "corner empty of any art or text so a logo can be composited later."
)


AESTHETICS = {
    # 1. MINIMALIST — one hook, massive type, nothing else.
    "minimal_10min": {
        "size": "1024x1024",
        "prompt": f"""Square 1024x1024 Meta ad.

{BRAND_CORE}

AESTHETIC: true minimalism. One gigantic phrase filling most of the canvas. Vast negative space. Nothing decorative. Feels like an Apple ad.

LAYOUT:
Background: solid warm cream #FAF6EF edge to edge.

Centered vertically and horizontally, in Outfit 900, near-black #0B0B0F, approximately 240 pt, tightest letter spacing, two lines stacked:
"10 minutes."
"Every day."

Below the phrase, a single thin pink #E84B8A horizontal line 320px wide.

Below the line, small supporting text in Plus Jakarta Sans 500 approximately 22pt, indigo #312e81 at 80 percent opacity, centered:
"Changes how your child reads for life."

Bottom 90px of the canvas: small pill-shaped CTA centered, fill indigo #312e81, text in Outfit 700 approximately 22pt cream: "Find their level"

No rainbow strip, no other decoration. Resist the urge to add icons, illustrations or backgrounds. Leave the top-right corner empty for post-composited logo.""",
    },

    # 2. NEWSPAPER / EDITORIAL — The Economist / FT feel.
    "newspaper": {
        "size": "1024x1536",
        "prompt": f"""Portrait 1024x1536 Meta ad styled as the front page of a serious broadsheet newspaper.

{BRAND_CORE}

AESTHETIC: The Economist / Financial Times feel. Authoritative, editorial, serif display type mixed with sans body. Off-white newsprint background with faint paper texture. Two-column grid.

LAYOUT:
Very top strip: 40 pt masthead in a high-contrast serif display font, near-black, centered: "THE READING REPORT"
Thin double indigo #312e81 rule above and below the masthead.
Directly under the masthead, small Plus Jakarta Sans caps, approximately 12pt, spaced letters: "ISSUE 01   ·   APRIL 2026   ·   SPECIAL REPORT"

Top 45 percent of remaining page: a single massive headline in Outfit 900 near-black, approximately 92pt, tight leading, left aligned, spanning full width:
"1 in 5 children fail the UK phonics check at age 6."

Below the headline, a one-line deck in Plus Jakarta Sans italic 400, approximately 22pt, indigo #312e81:
"And most parents are not told until Year 3, when the gap is already three years wide."

Below the deck, a thin amber #F59E0B rule full width.

Middle 35 percent of page: two body columns in Plus Jakarta Sans 400 approximately 13pt, near-black, tight columns with a vertical thin indigo rule between them. Fill with plausible body text about the UK Phonics Screening Check, children falling behind, and early-intervention evidence. Each column about 10 lines. Use realistic editorial phrasing, not lorem ipsum.

To the right of the lower portion of the body text, a small boxed pull-quote in Outfit 700 approximately 18pt, pink #E84B8A, with quotation marks:
"The gap that starts at five is still there at sixteen."

Bottom 20 percent: a thick indigo #312e81 footer panel spanning full width.
Inside the panel, left aligned, Outfit 900 cream approximately 32pt: "Read. At their actual level. At home."
Right aligned inside the panel, a cream rounded-rect CTA button with pink #E84B8A text in Outfit 700 approximately 20pt: "Free 3-minute assessment"

Very bottom 6px: thin six-segment rainbow strip (pink, amber, green, blue, purple, teal).

Keep the top-right corner area empty for logo compositing. No emojis. No photos of people.""",
    },

    # 3. CINEMATIC ILLUSTRATED HERO — global setting, child silhouette, poetic.
    "cinematic_rooftop": {
        "size": "1024x1536",
        "prompt": f"""Portrait 1024x1536 Meta ad with a cinematic illustrated hero scene.

{BRAND_CORE}

AESTHETIC: feels like a Studio Ghibli poster or a Netflix documentary key-art still. Emotional, quiet, scroll-stopping. Illustrated only, not photographic. Warm evening palette.

SCENE:
A young child, seen in profile silhouette from behind and slightly above, sitting cross-legged on a flat rooftop in a Pakistani city at dusk. The child is reading an open book in their lap. The book is open and glows a soft warm cream #FAF6EF as if lit from within. Around the rooftop edge, a string of small warm lights. In the distance across rooftops, the silhouettes of minarets and a setting sun. Deep indigo #312e81 night sky fading to warm amber #F59E0B horizon. Soft small stars dotted in the upper sky.

No realistic face, child shown from behind only. Flat illustration, thick outlines, geometric shapes, no gradients inside shapes but colour blocks can sit against each other. Like a contemporary indie-book jacket.

OVERLAY TEXT:
Upper third of canvas, Outfit 900 cream #FAF6EF approximately 72pt, left aligned, three short lines:
"The first"
"word she"
"ever read."

Bottom 15 percent of canvas: a subtle cream rounded pill CTA, centered, with indigo #312e81 text in Outfit 700 approximately 22pt: "Start the free assessment"

Very bottom 6px: thin six-segment rainbow strip (pink, amber, green, blue, purple, teal).

Keep top-right corner empty for logo compositing. No photographic face detail. Silhouette only.""",
    },

    # 4. MAGAZINE COVER — pink field, big cover line, cover teasers.
    "magazine_cover": {
        "size": "1024x1024",
        "prompt": f"""Square 1024x1024 Meta ad styled as a high-end magazine cover.

{BRAND_CORE}

AESTHETIC: Monocle magazine or TIME cover feel. Confident, editorial, one dominant cover line with small supporting teasers. Illustrated, not photographic. Pink #E84B8A as the dominant field colour.

LAYOUT:
Full-bleed background: pink #E84B8A solid.

Top strip, masthead in Outfit 900 cream #FAF6EF approximately 52pt, left aligned: "MYPHONICSBOOKS"
Right aligned on the same line, small Plus Jakarta Sans 500 cream approximately 13pt: "THE READING ISSUE · 2026"

A thin cream rule full width under the masthead.

Central area: a large illustrated stack of three children's phonics books, gently fanned. The top book cover shows a stylised scene of a child in traditional dress sitting cross legged reading. The books are in the six level colours visible on their spines: pink, amber, green, blue, purple, teal. Flat illustration, thick outlines, no photorealism. The books take up roughly the middle 50 percent of the canvas.

Overlaid in front of the books, left aligned, the cover line in Outfit 900 cream #FAF6EF, approximately 90pt, three lines with tight leading:
"32 books."
"6 levels."
"One habit."

Down the right edge of the canvas, three small vertical cover teasers in Plus Jakarta Sans 600 cream approximately 15pt, each preceded by a small indigo #312e81 bullet circle:
"The ten minute habit that compounds"
"Why the UK phonics check flags 1 in 5"
"Founding families join at one pound"

Bottom strip: small cream pill CTA, left aligned, indigo #312e81 text in Outfit 700 approximately 20pt: "Start the free assessment"

Very bottom 6px: thin six-segment rainbow strip (pink, amber, green, blue, purple, teal).

Keep the top-right corner empty for logo compositing.""",
    },

    # 5. BOLD TYPOGRAPHIC POSTER — slab type as the art.
    "typographic_poster": {
        "size": "1024x1536",
        "prompt": f"""Portrait 1024x1536 Meta ad that is a pure typographic poster. Typography IS the art.

{BRAND_CORE}

AESTHETIC: risograph / contemporary indie-print poster. Two-colour feel: indigo #312e81 ink on cream #FAF6EF paper, with pink #E84B8A used as a single accent. Gentle grainy half-tone texture on the flat colour fields. Bold slab sans type filling the canvas. Think Anthony Burrill or a modern British letterpress studio.

LAYOUT:
Background: warm cream #FAF6EF full bleed, with very faint half-tone grain texture.

Top 8 percent: small Plus Jakarta Sans 600 caps, indigo #312e81, approximately 14pt, spaced letters, left aligned: "MYPHONICSBOOKS · READING POSTER No. 03"
Thin indigo rule under it, full width.

Central 75 percent of canvas, a single enormous word repeated on three stacked lines in Outfit 900, indigo #312e81, approximately 280pt, tight leading, left aligned, letters almost touching the edges:
"READ"
"READ"
"READ"

The middle "READ" has a diagonal hand-stamped look-through treatment where it is overprinted in pink #E84B8A half-tone, offset slightly from the indigo version. Feels like a misregistered two-colour print.

To the right of the stacked words, in the narrow remaining strip, a vertical line of small Plus Jakarta Sans 400 indigo text rotated 90 degrees clockwise, approximately 14pt: "Ten minutes a day. Every day. For the next two years."

Bottom 17 percent of canvas: a thick pink #E84B8A block with rounded top corners.
Inside this block, centered, Outfit 900 cream #FAF6EF approximately 40pt: "Start the free assessment"
Below that, Plus Jakarta Sans 500 cream approximately 16pt: "3 minutes. No account."

Very bottom 6px: thin six-segment rainbow strip (pink, amber, green, blue, purple, teal).

Keep the top-right corner empty for logo compositing. No illustration of people. No extra decorative elements.""",
    },
}


def generate(name: str, prompt: str, size: str) -> bool:
    out_path = OUT_DIR / f"aesthetic_{name}.png"
    print(f"\n[{name}]  size={size}")
    try:
        r = requests.post(
            "https://api.openai.com/v1/images/generations",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": MODEL,
                "prompt": prompt,
                "n": 1,
                "size": size,
                "quality": "high",
            },
            timeout=420,
        )
    except Exception as e:
        print(f"  Network error: {e}")
        return False

    if not r.ok:
        print(f"  HTTP {r.status_code}")
        print(f"  {r.text[:800]}")
        return False

    data = r.json()
    img_data = data["data"][0]
    if "b64_json" in img_data:
        img_bytes = base64.b64decode(img_data["b64_json"])
    elif "url" in img_data:
        img_bytes = requests.get(img_data["url"], timeout=60).content
    else:
        print(f"  Unexpected response shape: {list(img_data.keys())}")
        return False

    out_path.write_bytes(img_bytes)
    print(f"  Saved {len(img_bytes) // 1024} KB to {out_path}")
    return True


def main() -> int:
    print(f"Model: {MODEL}   Aesthetics: {len(AESTHETICS)}")
    successes = 0
    for i, (name, spec) in enumerate(AESTHETICS.items()):
        ok = generate(name, spec["prompt"], spec["size"])
        if ok:
            successes += 1
        if i < len(AESTHETICS) - 1:
            time.sleep(8)
    print(f"\nDone. {successes}/{len(AESTHETICS)} saved to {OUT_DIR}")
    return 0 if successes == len(AESTHETICS) else 1


if __name__ == "__main__":
    sys.exit(main())
