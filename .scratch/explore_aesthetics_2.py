"""
Aesthetic exploration round 2.

Five more directions, including first use of /v1/images/edits to
feed a REAL PDF cover PNG as input and have gpt-image-2 compose a
magazine cover around it.

Run: python .scratch/explore_aesthetics_2.py

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
    "No realistic human faces on real photography. Keep the top-right "
    "corner empty of any art or text so a logo can be composited later."
)

COVER_PATH = REPO_ROOT / "marketing-visuals" / "pdf-covers" / "1_3_The_Fish_in_the_Tank_cover.png"


# ─────────────────────────────────────────────────────────────────────
# 1. MAGAZINE COVER V2 — using real book cover via /v1/images/edits
# ─────────────────────────────────────────────────────────────────────

MAGAZINE_V2_PROMPT = f"""Use the provided children's book cover as the exact hero element of a 1024x1024 square magazine cover for MyPhonicsBooks. The provided image IS the cover of our Level 1 book "The Fish in the Tank". Place it as a real printed book object on the layout. Preserve the cover illustration exactly, pixel-faithful, do not redraw, restyle or alter its art or title text.

{BRAND_CORE}

AESTHETIC: Monocle / TIME magazine cover, editorial, confident. Pink #E84B8A dominant background. Cream masthead strip top. Tasteful, British, not shouty.

LAYOUT:

Background: solid pink #E84B8A full bleed.

Top 9 percent: thin cream #FAF6EF masthead strip. Inside it:
- Left aligned, Outfit 900 indigo #312e81 approximately 48pt: "MYPHONICSBOOKS"
- Right aligned small Plus Jakarta Sans 500 indigo approximately 12pt: "THE READING ISSUE  ·  2026"
Thin indigo rule under the strip.

Centre of canvas: place the provided book cover as a real printed book, slightly tilted 5 degrees, with a subtle drop shadow. Cover should occupy roughly 45 percent of canvas width. Behind the hero book, partially visible, fan two additional ghost book shapes in amber and teal spine colours to hint at the six-level collection, but subtle so the hero cover stays dominant.

Left of the book, Outfit 900 cream #FAF6EF approximately 76pt, left aligned, three lines tight leading:
"32 books."
"6 levels."
"One habit."

Right of the book, a vertical stack of three short cover teasers, each in Plus Jakarta Sans 600 cream approximately 14pt, each preceded by a small indigo bullet circle:
"The ten minute habit"
"Why 1 in 5 fails phonics"
"Founding families at one pound"

Bottom 12 percent: cream pill CTA left aligned, indigo text Outfit 700 approximately 20pt: "Start the free assessment"

Very bottom 6px: six-segment rainbow strip (pink, amber, green, blue, purple, teal).

Keep the top-right corner empty for logo compositing. Do not invent taglines not listed above. Preserve the provided cover pixel-exact."""


# ─────────────────────────────────────────────────────────────────────
# 2. GAP CHART — widening reading-gap line graph
# ─────────────────────────────────────────────────────────────────────

GAP_CHART_PROMPT = f"""Portrait 1024x1536 Meta ad with a minimalist editorial line chart as the visual hero.

{BRAND_CORE}

AESTHETIC: Financial Times / Economist data-visualisation. Clean, serious, authoritative. Near-black background, two diverging lines as the subject.

LAYOUT:

Background: near-black #0B0B0F full bleed.

Top 22 percent: headline block, left aligned, Outfit 900 cream #FAF6EF.
Line 1 approximately 56pt, cream: "A six-month gap at age 5"
Line 2 approximately 56pt, pink #E84B8A: "becomes a six-year gap by 16."

Below headline, Plus Jakarta Sans 400 italic approximately 18pt, cream 50 percent opacity:
"Education Endowment Foundation · UK longitudinal data"

Middle 60 percent: a clean minimalist line chart, filling most of the canvas width with generous padding, no chart frame box.

X-axis along bottom of chart area: six age ticks labelled left to right in Plus Jakarta Sans 500 cream 60 percent opacity approximately 13pt:
"Age 5", "Age 7", "Age 9", "Age 11", "Age 14", "Age 16"

Y-axis on left: no numbers, just a tiny rotated label in Plus Jakarta Sans 400 cream 40 percent opacity approximately 11pt: "reading age"

Two lines drawn:
- TOP LINE in green #22C55E, 4px thick, rising smooth diagonal from lower-left to upper-right, with small green circle data points at each age tick. Label beside the rightmost point in Outfit 700 green approximately 18pt: "On track"
- BOTTOM LINE in pink #E84B8A, 4px thick, starting 10 percent lower than green at Age 5, flattening and dipping further behind as it moves right. Small pink circle data points at each tick. Label beside the rightmost point in Outfit 700 pink approximately 18pt: "Falling behind"

Between the two lines, shade a very soft pink translucent fill to emphasise the widening gap.

At the widest part of the gap (around Age 16), a small annotation box in rounded rect, pink 15 percent fill with pink 1px border. Inside in Outfit 700 pink approximately 22pt: "6 years". Below in Plus Jakarta Sans 500 cream 60 percent opacity approximately 13pt: "behind"

Vertical dashed line at Age 7 position, amber #F59E0B 30 percent opacity, with a small amber label at the top in Plus Jakarta Sans 600 amber approximately 12pt, caps: "CRITICAL WINDOW"

Bottom 14 percent: rounded pill CTA centered, fill pink #E84B8A, text in Outfit 700 cream approximately 30pt: "Find their level"
Below CTA, Plus Jakarta Sans 500 cream 50 percent opacity approximately 16pt: "3-minute free assessment"

Very bottom 6px: six-segment rainbow strip.

Keep top-right corner empty for logo compositing. No faces. No photos."""


# ─────────────────────────────────────────────────────────────────────
# 3. TRAJECTORY SPLIT — two outcomes for the same child
# ─────────────────────────────────────────────────────────────────────

TRAJECTORY_PROMPT = f"""Portrait 1024x1536 Meta ad, two stacked illustrated panels showing two possible reading trajectories for the same child.

{BRAND_CORE}

AESTHETIC: flat editorial illustration, contemporary children's book style, warm and quiet. Not frightening. No photorealism.

LAYOUT:

Top 12 percent: headline strip on near-black #0B0B0F background.
Outfit 900 cream #FAF6EF approximately 42pt, centered, two lines:
"Two children. Same age."
"Two different endings."

UPPER PANEL (38 percent of canvas height): background warm amber #F59E0B at 25 percent saturation (muted, washed). Label at top-left in Outfit 700 muted amber approximately 18pt caps: "WITHOUT STRUCTURED PHONICS"

Scene: side-profile illustrated silhouette of a child (no facial features, just outline) at a desk, shoulders slightly slumped, head low, looking down at a closed book. A speech bubble above showing fragmented letter sounds "b... at... c...?" in tentative Plus Jakarta Sans 500 30 percent opacity. Clock on wall showing "10" to suggest age. Palette muted and warm-grey.

Small annotation bottom-right of this panel in Plus Jakarta Sans 500 near-black approximately 16pt:
"Still sounding out at age 10."

LOWER PANEL (38 percent of canvas height): background warm green #22C55E at 25 percent saturation. Label at top-left in Outfit 700 green approximately 18pt caps: "WITH STRUCTURED PHONICS"

Scene: side-profile illustrated silhouette of a child cross-legged on a cushion, posture upright, open book held in their lap, small confident smile hinted in profile without facial features. A speech bubble above with a full fluent sentence in Plus Jakarta Sans 600 60 percent opacity: "The fish in the tank looked at the boy."  Soft glow around the book.

Small annotation bottom-right of this panel in Plus Jakarta Sans 500 near-black approximately 16pt:
"Reading fluently at age 7."

Bottom 12 percent: back to near-black #0B0B0F. Pill CTA centered, pink #E84B8A fill, cream text Outfit 700 approximately 26pt: "Start the free assessment"
Below CTA, Plus Jakarta Sans 500 cream 50 percent opacity approximately 15pt: "Find their level in 3 minutes"

Very bottom 6px: six-segment rainbow strip.

Keep top-right corner empty for logo compositing. No realistic human faces. Silhouettes only."""


# ─────────────────────────────────────────────────────────────────────
# 4. TEACHER MANIFESTO — typographic authority poster
# ─────────────────────────────────────────────────────────────────────

MANIFESTO_PROMPT = f"""Portrait 1024x1536 Meta ad designed as a typographic manifesto poster. Text IS the visual.

{BRAND_CORE}

AESTHETIC: British indie-print manifesto. Cream paper texture background. Indigo ink on cream. One small pink accent. Feels like a letter or broadside, not a digital ad.

LAYOUT:

Background: warm cream #FAF6EF full bleed with very subtle paper grain texture.

Top 8 percent: small Plus Jakarta Sans 600 indigo #312e81 approximately 13pt caps, letter-spaced, left aligned: "A NOTE FROM THE TEACHER  ·  MYPHONICSBOOKS"
Thin indigo rule under it.

Main manifesto text, left aligned, stretching across most of the page vertically, with breathing room between lines. All Outfit 900 indigo #312e81 approximately 68pt, tight leading, some phrases emphasised in pink #E84B8A:

"Made by a"
"British primary"
"teacher."

Thin pink rule, 80px wide.

"Not a tech startup."
"Not an AI company."
"Not a chain."

Thin pink rule, 80px wide.

"Just a teacher"
"who built"
"thirty-two books,"
"six levels,"
"one method."

Thin pink rule, 80px wide.

In smaller Outfit 700 indigo approximately 28pt:
"Aligned to the UK Letters and Sounds programme. Phases 2 to 6."

Bottom 14 percent: pink #E84B8A block with rounded top corners, spanning full width.
Inside, centered, Outfit 900 cream #FAF6EF approximately 34pt: "Start the free assessment"
Below, Plus Jakarta Sans 500 cream approximately 16pt: "3 minutes. No account. Free."

Very bottom 6px: six-segment rainbow strip.

Keep top-right corner empty for logo compositing. No illustration. No photography. Pure typography only."""


# ─────────────────────────────────────────────────────────────────────
# 5. SCHOOL COST COMPARISON — David vs Goliath price visual
# ─────────────────────────────────────────────────────────────────────

SCHOOL_COST_PROMPT = f"""Square 1024x1024 Meta ad showing a dramatic cost comparison between commercial school phonics schemes and MyPhonicsBooks.

{BRAND_CORE}

AESTHETIC: bold editorial infographic, Economist-style comparison chart. Two opposing columns, one towering, one tiny. Cream background, indigo and pink as the two compared tones.

LAYOUT:

Background: warm cream #FAF6EF full bleed.

Top 15 percent: headline block, centered, Outfit 900 near-black #0B0B0F approximately 48pt, two lines tight:
"Schools pay thousands."
"You pay one pound."

Below headline, Plus Jakarta Sans 400 italic near-black 60 percent opacity approximately 15pt:
"What a typical UK primary school spends on a commercial phonics scheme, versus the MyPhonicsBooks Founding Family access."

Middle 65 percent: two comparison columns side by side, centered.

LEFT column (the commercial scheme), occupying roughly 45 percent of middle area:
Tall indigo #312e81 solid rectangle, about 85 percent of panel height, with a subtle shadow.
At the very top of the rectangle in Outfit 900 cream approximately 72pt, centered: "£2,400"
Below the number inside the rectangle in Outfit 700 cream 80 percent opacity approximately 22pt: "per year"
Small caption below the rectangle outside in Plus Jakarta Sans 500 indigo approximately 14pt, centered:
"Commercial school phonics scheme, average UK primary cost for materials plus licensing."

RIGHT column (MyPhonicsBooks), occupying roughly 45 percent of middle area:
Tiny pink #E84B8A solid rectangle, only about 3 percent of panel height, sitting on the same baseline as the left column.
Above the small pink rectangle floating in Outfit 900 pink approximately 160pt, centered: "£1"
Below the small rectangle in Plus Jakarta Sans 500 near-black approximately 14pt, centered:
"Founding Family access. Lifetime. All 32 books."

Between the two columns, a thin vertical cream #FAF6EF rule with a small indigo "vs" label in Outfit 700 approximately 20pt.

Bottom 12 percent: pill CTA centered, pink fill, cream Outfit 700 approximately 28pt: "Apply to join"
Below, Plus Jakarta Sans 500 near-black 60 percent opacity approximately 14pt:
"Founding Family applications, limited intake."

Very bottom 6px: six-segment rainbow strip.

Keep top-right corner empty for logo compositing. The £2,400 is a representative figure; do not treat it as a precise claim. Numbers must render exactly as written."""


# ─────────────────────────────────────────────────────────────────────
# Run
# ─────────────────────────────────────────────────────────────────────

def generate_standard(name: str, prompt: str, size: str) -> bool:
    out_path = OUT_DIR / f"round2_{name}.png"
    print(f"\n[{name}]  size={size}  endpoint=generations")
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


def generate_edit(name: str, prompt: str, size: str, image_path: Path) -> bool:
    out_path = OUT_DIR / f"round2_{name}.png"
    print(f"\n[{name}]  size={size}  endpoint=edits  ref={image_path.name}")

    if not image_path.exists():
        print(f"  ERROR: reference not found at {image_path}")
        return False

    try:
        with open(image_path, "rb") as f:
            files = {
                "image": (image_path.name, f, "image/png"),
            }
            data = {
                "model": MODEL,
                "prompt": prompt,
                "n": "1",
                "size": size,
                "quality": "high",
            }
            r = requests.post(
                "https://api.openai.com/v1/images/edits",
                headers={"Authorization": f"Bearer {API_KEY}"},
                files=files,
                data=data,
                timeout=420,
            )
    except Exception as e:
        print(f"  Network error: {e}")
        return False

    if not r.ok:
        print(f"  HTTP {r.status_code}")
        print(f"  {r.text[:800]}")
        return False

    resp = r.json()
    img_data = resp["data"][0]
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
    print(f"Model: {MODEL}")
    runs = [
        ("magazine_v2_realcover", "edits",        MAGAZINE_V2_PROMPT,  "1024x1024"),
        ("gap_chart",             "generations",  GAP_CHART_PROMPT,    "1024x1536"),
        ("trajectory_split",      "generations",  TRAJECTORY_PROMPT,   "1024x1536"),
        ("teacher_manifesto",     "generations",  MANIFESTO_PROMPT,    "1024x1536"),
        ("school_cost",           "generations",  SCHOOL_COST_PROMPT,  "1024x1024"),
    ]

    successes = 0
    for i, (name, mode, prompt, size) in enumerate(runs):
        if mode == "edits":
            ok = generate_edit(name, prompt, size, COVER_PATH)
        else:
            ok = generate_standard(name, prompt, size)
        if ok:
            successes += 1
        if i < len(runs) - 1:
            time.sleep(8)
    print(f"\nDone. {successes}/{len(runs)} saved to {OUT_DIR}")
    return 0 if successes == len(runs) else 1


if __name__ == "__main__":
    sys.exit(main())
