"""
Carousel: "Meet Aisha" — 8-slide emotional-journey carousel for Meta/Insta.

Adapts the proven wire-and-ball visual metaphor (from Lynden's
LinkedIn Fatima carousel) into MyPhonicsBooks brand colours: cream
wire on near-black ground, pink ball as Aisha, cream dots as peers,
amber as the stat-highlight accent.

The wire shape changes per slide; the brand vocabulary stays
identical so the carousel reads as one continuous journey.

Output: .scratch/carousel/aisha/slide_1.png ... slide_8.png
Cost:   8 x 1024x1536 high = approx $1.32
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
OUT_DIR = REPO_ROOT / ".scratch" / "carousel" / "aisha"
OUT_DIR.mkdir(parents=True, exist_ok=True)

load_dotenv(ENV_PATH)
API_KEY = os.environ.get("OPENAI_API_KEY")
if not API_KEY or not API_KEY.startswith("sk-"):
    print(f"ERROR: OPENAI_API_KEY not found / invalid in {ENV_PATH}")
    sys.exit(1)

MODEL = "gpt-image-2"
SIZE = "1024x1536"


# Visual scaffold — identical on every slide so the carousel reads as one piece.
SCAFFOLD = """Portrait 1024x1536 Meta carousel slide for MyPhonicsBooks.

VISUAL SYSTEM (must be identical across the whole carousel):
- Background: solid near-black with a faint indigo undertone, hex #0B0B14, full bleed.
- A single thin continuous "wire" line drawn in warm cream #FAF6EF, stroke weight roughly 3 to 4 pixels, flat ends, no shadow on the wire itself, no decoration.
- One glowing ball on the wire to represent Aisha. The ball is a solid filled circle, fill colour pink #E84B8A, diameter approximately 90 pixels, with a soft warm pink halo glow extending about 50 pixels around it. The ball sits exactly on the wire.
- Other supporting dots when present are smaller solid filled circles, fill warm cream #FAF6EF, diameter roughly 50 pixels, with a soft cream halo glow.
- Typography: Plus Jakarta Sans 600 for body text, cream #FAF6EF, well spaced. Stat highlights are wrapped in a small filled rounded rectangle of amber #F59E0B with near-black text Outfit 800 inside.
- No emojis. British English. No em dashes. No realistic human faces. No photography. Pure geometric flat composition only. No watermarks. No fake logos.
- Top-right corner of the canvas: leave empty of any art, wire, or text so a logo can be composited later.

The carousel reads as a continuous emotional journey. Each slide is one beat in a story. Keep all aesthetic constants identical so a viewer feels they are watching one ball travel along one wire as they swipe."""


SLIDES = [
    # ─── 1. HOOK — character intro
    {
        "name": "slide_1_hook",
        "beat": "Hook. Character introduction. Calm, anchoring.",
        "wire_shape": "The wire enters the canvas from the lower-left edge as a rising curve, peaks at roughly the horizontal centre at about 55 percent down from the top, and exits the canvas off the right edge as a near-straight horizontal line. The pink Aisha ball sits exactly on the apex of that curve, in the centre of the canvas.",
        "text_top": "Meet Aisha.",
        "text_bottom": "She's 5 years old.",
        "extras": "No supporting dots. No stat highlight. Just the wire and the pink ball.",
    },
    # ─── 2. PROBLEM + STAT
    {
        "name": "slide_2_problem",
        "beat": "The problem. Surfaces a shocking stat.",
        "wire_shape": "The wire enters from the left edge mid-height, slopes sharply downward to a low point around 75 percent down from the top in the lower-third of the canvas, then continues out the right edge angling slightly upward. The pink Aisha ball sits at that low point.",
        "text_top": "Last year, she read",
        "text_bottom": "Her classmate read [HIGHLIGHT_AMBER:1.8 million.]",
        "text_middle": "[HIGHLIGHT_AMBER:8,000 words.]",
        "extras": "Two amber stat highlight boxes sit inline within the text: '8,000 words.' in the middle line and '1.8 million.' in the bottom line. Tiny attribution text below the bottom line in Plus Jakarta Sans 400 cream 40 percent opacity, approximately 13pt: 'Anderson, Wilson and Fielding, 1988'.",
    },
    # ─── 3. INSIGHT / AHA
    {
        "name": "slide_3_insight",
        "beat": "The aha moment. Reframes the problem.",
        "wire_shape": "The wire enters bottom-left and travels right as a jagged heart-rate-monitor pattern with several sharp small peaks and dips, then climbs to a single tall sharp peak in the centre-right area. The pink Aisha ball sits exactly at the top of that tall peak.",
        "text_top": "She wasn't lazy.",
        "text_bottom": "She was reading the wrong books.",
        "extras": "No supporting dots. No stat highlight.",
    },
    # ─── 4. REFRAME — visual contrast
    {
        "name": "slide_4_reframe",
        "beat": "Reframe with visual contrast. She vs Them.",
        "wire_shape": "The wire enters top-right and drops vertically to the upper-third area, where it ends in a small cluster of FOUR cream supporting dots arranged in a tight diamond shape (one at top, two in middle either side, one at bottom). A SECOND fragment of wire enters lower-left, peaks in the lower-middle area as a single curved hill, and exits lower-right. The pink Aisha ball sits on the peak of the lower wire fragment, well below and apart from the cream dot cluster above.",
        "text_top": "She wasn't competing with smart kids.",
        "text_bottom": "She was reading words she'd never been taught to sound out.",
        "extras": "The four cream dots represent words above her phonics level. The pink ball alone represents Aisha. The vertical separation between cluster and ball is the whole point of the slide.",
    },
    # ─── 5. PIVOT
    {
        "name": "slide_5_pivot",
        "beat": "Pivot. The decision to change course.",
        "wire_shape": "The wire enters from the left edge horizontally, reaches a fork point in the centre-left area where TWO cream dots sit close together at the fork. From that fork, an upper branch of wire slopes upward to the top-right corner. A lower branch slopes downward and exits the bottom-right edge. The pink Aisha ball sits on the UPPER branch, partway along its rise toward the top-right.",
        "text_top": "Her mum stopped buying random books",
        "text_bottom": "and started using [HIGHLIGHT_AMBER:phonics levels.]",
        "extras": "An amber stat highlight box wraps the words 'phonics levels.' in the bottom line. The two cream dots at the fork represent the two paths.",
    },
    # ─── 6. STRATEGY — numbers
    {
        "name": "slide_6_strategy",
        "beat": "Strategy reveal. The mechanism. Specific numbers.",
        "wire_shape": "The wire enters from the left and reaches a central hub point. From that hub, SIX wire segments fan outward to the right at different angles (think of a hand fan or sun rays), each ending in a small cream supporting dot. The six end dots are arranged in a vertical fan from upper-right to lower-right. The pink Aisha ball sits at the central hub where all six wires converge.",
        "text_top": "The system:",
        "text_bottom": "Every word at her level.",
        "text_middle": "[HIGHLIGHT_AMBER:6 levels.] [HIGHLIGHT_AMBER:32 books.]",
        "extras": "Two amber stat highlight boxes side by side in the middle line. The six fanning wires represent the six MyPhonicsBooks levels.",
    },
    # ─── 7. OUTCOME — proof
    {
        "name": "slide_7_outcome",
        "beat": "Outcome. Visible proof of progress.",
        "wire_shape": "The wire enters from the upper-left as several short line fragments converging into a single point. From that convergence point, a long string of EIGHT cream supporting dots is threaded along a gently curving wire that arcs down then up through the centre of the canvas, ending in the right area. The final ninth ball at the right end of the chain is the pink Aisha ball.",
        "text_top": "Six months later",
        "text_bottom": "Six months ahead of her class.",
        "text_middle": "Aisha read [HIGHLIGHT_AMBER:fluently.]",
        "extras": "An amber stat highlight box wraps the word 'fluently.' in the middle line. The string of cream dots ending in the pink ball reads as a chain of progress, with Aisha now at the end of it.",
    },
    # ─── 8. FLIP TO YOU + CTA
    {
        "name": "slide_8_cta",
        "beat": "Flip to second person. Direct invitation.",
        "wire_shape": "The wire enters from the left edge horizontally at mid-height. It reaches a central point where the pink ball labelled 'Your child' sits. Just to the right of the ball, the wire bends sharply upward by 90 degrees, rises briefly, then bends right again to exit the canvas off the upper-right edge. The bend reads as a hopeful step up.",
        "text_top": "Where is your child on their reading journey?",
        "text_bottom": "Find their level. [HIGHLIGHT_PINK_PILL:Free 3-minute assessment.]",
        "extras": "Above the pink ball, in cream Plus Jakarta Sans 600 approximately 28pt, the single word: 'Your child'. The bottom line ends with a rounded pink #E84B8A pill button with cream Outfit 700 text 'Free 3-minute assessment.' acting as the CTA.",
    },
]


def build_prompt(slide: dict) -> str:
    """Assemble the full prompt for a single slide."""
    text_block = "TEXT ON CANVAS:\n"
    text_block += f"- Top text in Plus Jakarta Sans 600 cream approximately 44pt, centered horizontally near the top of the canvas (roughly 12 percent down from the top): \"{slide['text_top']}\"\n"
    if "text_middle" in slide:
        text_block += f"- Middle text in Plus Jakarta Sans 600 cream approximately 44pt, centered horizontally just below the top text: \"{slide['text_middle']}\"\n"
    text_block += f"- Bottom text in Plus Jakarta Sans 600 cream approximately 44pt, centered horizontally near the bottom of the canvas (roughly 88 percent down from the top): \"{slide['text_bottom']}\"\n"

    return f"""{SCAFFOLD}

This slide is: {slide['beat']}

WIRE SHAPE FOR THIS SLIDE:
{slide['wire_shape']}

{text_block}
{slide['extras']}

Render any [HIGHLIGHT_AMBER:phrase] markup as the phrase wrapped in a small filled rounded rectangle of amber #F59E0B with the phrase text inside in Outfit 800 near-black, sized to match the surrounding text. Render any [HIGHLIGHT_PINK_PILL:phrase] as the phrase wrapped in a rounded pink #E84B8A pill button with cream Outfit 700 text inside. Do not render the markup brackets or the labels themselves; only render the phrase styled as described.

Final constraints: only one wire (or wire-fragment as specified), no extra ornaments, no rainbow strip on this carousel, no logo. Pure flat geometric composition. Plenty of breathing space between elements. Calm, restrained, editorial. Top-right corner empty for logo compositing."""


def generate(name: str, prompt: str) -> bool:
    out_path = OUT_DIR / f"{name}.png"
    print(f"\n[{name}]")
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
                "size": SIZE,
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
    print(f"Model: {MODEL}   Size: {SIZE}   Slides: {len(SLIDES)}")
    successes = 0
    for i, slide in enumerate(SLIDES):
        prompt = build_prompt(slide)
        ok = generate(slide["name"], prompt)
        if ok:
            successes += 1
        if i < len(SLIDES) - 1:
            time.sleep(8)
    print(f"\nDone. {successes}/{len(SLIDES)} saved to {OUT_DIR}")
    return 0 if successes == len(SLIDES) else 1


if __name__ == "__main__":
    sys.exit(main())
