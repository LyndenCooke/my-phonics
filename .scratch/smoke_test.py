"""
Smoke test for the new all-AI Meta ad approach.

Generates Asset A1 "200x word gap" at 1024x1536 portrait using
gpt-image-2 at quality=high with the proposed MyPhonicsBooks
brand-kit paragraph.

Cost: roughly $0.165 for one image.

Output: .scratch/smoke/A1_word_gap.png
"""

from __future__ import annotations

import base64
import os
import sys
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


BRAND_KIT = (
    "Illustration style: flat editorial vector, clean geometric shapes, thick "
    "outlines, no gradients, no photorealism. Palette: deep indigo #312e81 as "
    "primary, warm cream #FAF6EF or near-black #0B0B0F as background. Level "
    "accents: pink #E84B8A, amber #F59E0B, green #22C55E, blue #3B82F6, purple "
    "#8B5CF6, teal #14B8A6 used sparingly as highlights, not base colours. "
    "Typography: Outfit 900 (bold, tight letter-spacing) for headlines and "
    "numbers; Outfit 700 for CTAs; Plus Jakarta Sans 500 for small supporting "
    "text. No emojis. British English spelling. No Oxford commas. No em "
    "dashes. Recurring brand motif: a thin six-segment rainbow strip (pink, "
    "amber, green, blue, purple, teal, in that order, left to right) at the "
    "very bottom edge. Reserve a 120x120 pixel clear zone in the top-right "
    "corner for the MyPhonicsBooks wordmark to be composited in post."
)

A1_PROMPT = f"""Portrait 1024x1536 Meta ad for MyPhonicsBooks, a UK children's decodable phonics product.

{BRAND_KIT}

LAYOUT:

Top 28 percent: hook headline on near-black #0B0B0F background.
Line 1, Outfit 900 approximately 140pt, pink #E84B8A, left aligned: "200x"
Line 2, Outfit 900 approximately 56pt, cream #FAF6EF, left aligned: "the word gap between"
Line 3, Outfit 900 approximately 56pt, cream #FAF6EF, left aligned: "readers and non-readers."

Middle 54 percent: flat cream #FAF6EF panel with two vertical bar-chart columns side by side, centered.
Left bar: very short, about 3 percent of panel height, filled solid indigo #312e81.
Directly below the left bar, in Outfit 700 approximately 32pt, indigo:
"8,000"
and below in Plus Jakarta Sans 500 approximately 18pt, indigo 70 percent opacity:
"words read per year"

Right bar: very tall, about 90 percent of panel height, filled solid pink #E84B8A.
Directly below the right bar, in Outfit 700 approximately 32pt, pink:
"1,823,000"
and below in Plus Jakarta Sans 500 approximately 18pt, pink 70 percent opacity:
"words read per year"

Small italic attribution strip centered at the bottom of the middle panel in Plus Jakarta Sans 500 approximately 14pt, near-black 60 percent opacity:
"Anderson, Wilson and Fielding 1988. 10th vs 90th percentile readers."

Bottom 18 percent: back to near-black #0B0B0F background.
Centered rounded-rectangle CTA button, fill pink #E84B8A, padding generous.
Text inside button in Outfit 700 approximately 44pt, cream #FAF6EF: "Find their level"
Below the CTA button, in Plus Jakarta Sans 500 approximately 20pt, cream 60 percent opacity, centered:
"3-minute free assessment. No account."

Very bottom 6 pixels: a six-segment rainbow strip (pink, amber, green, blue, purple, teal, left to right).

Top-right corner: leave a 120x120 pixel clear zone, no art, no text, for the MyPhonicsBooks wordmark to be composited later.

Constraints: no realistic human faces, no photography, no stock image aesthetic, no watermarks, no fake logos, no extra text beyond what is specified above. Preserve the exact numbers 200x and 8,000 and 1,823,000 with no typos and no reformatting. Flat vector only."""


MODEL = "gpt-image-2"
SIZE = "1024x1536"
OUT_PATH = OUT_DIR / "A1_word_gap.png"


def main() -> int:
    print(f"Model: {MODEL}   Size: {SIZE}   Quality: high")
    print(f"Out:   {OUT_PATH}")
    print(f"Prompt length: {len(A1_PROMPT)} chars")
    print("Calling OpenAI images endpoint...")

    try:
        r = requests.post(
            "https://api.openai.com/v1/images/generations",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": MODEL,
                "prompt": A1_PROMPT,
                "n": 1,
                "size": SIZE,
                "quality": "high",
            },
            timeout=360,
        )
    except Exception as e:
        print(f"Network error: {e}")
        return 1

    if not r.ok:
        print(f"HTTP {r.status_code}")
        print(r.text[:2000])
        return 1

    data = r.json()
    img_data = data["data"][0]
    if "b64_json" in img_data:
        img_bytes = base64.b64decode(img_data["b64_json"])
    elif "url" in img_data:
        img_bytes = requests.get(img_data["url"], timeout=60).content
    else:
        print(f"Unexpected response shape: {list(img_data.keys())}")
        return 1

    OUT_PATH.write_bytes(img_bytes)
    print(f"Saved {len(img_bytes) // 1024} KB to {OUT_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
