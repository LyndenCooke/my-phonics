"""
Carousel: "How much should it cost to teach a child to read?"

Story arc carousel in the same handwritten-ballpoint aesthetic as
carousel_pen_mistakes.py. Visual carries meaning:
  - Slides 2-4: math literally accumulates on the page (each step adds
    a real sum, with a running total in the margin)
  - Slide 5: stark single number isolated in space
  - Slide 6: that number is crossed out with thick pen strokes, then
    replaced with the £1 reveal
  - Slide 7: clean CTA

7 slides x 1024x1536 high = approx $1.16
Output: .scratch/carousel/cost_reveal/slide_*.png
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
OUT_DIR = REPO_ROOT / ".scratch" / "carousel" / "cost_reveal"
OUT_DIR.mkdir(parents=True, exist_ok=True)

load_dotenv(ENV_PATH)
API_KEY = os.environ.get("OPENAI_API_KEY")
if not API_KEY or not API_KEY.startswith("sk-"):
    print(f"ERROR: OPENAI_API_KEY not found / invalid in {ENV_PATH}")
    sys.exit(1)

MODEL = "gpt-image-2"
SIZE = "1024x1536"


SCAFFOLD = """Portrait 1024x1536 image of a single page of plain off-white paper, photographed almost flat from above on a quiet desk. The page fills the canvas almost edge to edge with a small amount of background visible at the very edges (the desk surface, slightly out of focus, neutral warm grey).

PAPER: plain unlined off-white printer paper, very subtle paper grain texture, a faint shadow at one edge to suggest it is a real physical sheet on a surface, no holes, no lines, no graph squares. Tiny faint paper creases or fold marks acceptable.

PEN: every word and mark on the page is handwritten with a real blue ballpoint pen. The ink is a typical slightly cool blue, hex roughly #1A3FA0, not navy and not royal. The line weight varies naturally as a real ballpoint does, with the occasional thicker spot where pressure increased and a few barely-visible ink starvation breaks. Letters are clearly legible printed handwriting (not cursive, not a stylised font), the kind a primary teacher writes when making quick notes. Slight slope to the writing, slight irregular baseline, real human imperfection, NEVER perfectly aligned.

MARGINALIA AND EMPHASIS: handwritten underlines (sometimes wavy, sometimes double), small circles around key phrases, small arrows pointing from one phrase to another, asterisks, and small hand-drawn doodles where called for (calculator icon, frowny face, etc). These should feel scattered and natural, not designed.

ABSOLUTE RULES: no logos, no brand marks, no printed type, no computer-generated text, no Outfit or Plus Jakarta typography styling, everything is handwritten. No emojis. British English spelling throughout. No em dashes (use full stops or commas). No torn edges, no notebook spiral, no lines, no grid. Top-right corner of the page must be left empty so a small wordmark can be composited later.

This is one page in a series. The handwriting style and pen colour must match a previous notebook the same teacher used. Voice is warm, plain-spoken, professional. NOT teacherly-condescending. The image must feel like a real piece of paper photographed casually, not a designed graphic."""


SLIDES = [
    # ─── 1. HOOK
    {
        "name": "slide_1_hook",
        "content": """Handwritten content on the page, well composed:

In the upper third, large handwritten title across two or three lines:
"How much should it cost"
"to teach a child"
"to read?"

After a clear gap, in slightly smaller handwriting:
"(I added up what one mum in"
"my class paid last year."
"Brace.)"

In the bottom-right area, written at a slight angle, smaller, like a small note:
"swipe -->"
with a hand-drawn arrow next to the word, drawn as a simple two-stroke arrowhead.

Marginalia: a hand-drawn underline beneath the word "cost" in the title. A small calculator doodle in the lower-left margin (a simple square with a few buttons drawn inside, ballpoint-pen style). A small "!" next to the word "Brace." Nothing else.""",
    },

    # ─── 2. TUTOR
    {
        "name": "slide_2_tutor",
        "content": """Handwritten content on the page, well composed top to bottom with breathing room:

Upper-left area, large handwritten:
"Step 1."

Heading just below in slightly larger handwriting:
"A private phonics tutor."

After a small gap, the math sum written out as a real handwritten calculation across one or two lines:
"£30/hr  x  1 hour a week  x  38 school weeks"

A horizontal line (like an underline) beneath the sum.

Below the line, the result on its own line in slightly larger handwriting:
"= £1,140"

After a clear gap, smaller handwritten parenthetical comment:
"(more than her gym"
"membership.)"

Marginalia: a hand-drawn circle around the number "£1,140". A small wavy underline beneath the heading "A private phonics tutor." A tiny "ouch" written in the right margin near the £1,140 figure. In the very bottom-right corner, a small handwritten "1 of 6" running total label is NOT yet drawn.

Top-right corner of the page must remain empty for compositing.""",
    },

    # ─── 3. PHONICS APP
    {
        "name": "slide_3_app",
        "content": """Handwritten content on the page, well composed:

Upper-left area, large handwritten:
"Step 2."

Heading just below in slightly larger handwriting:
"A phonics app subscription."

After a small gap, the math sum written out:
"£8.99 / month  x  12 months"

A horizontal line beneath the sum.

Below the line, the result:
"= £108"

After a clear gap, smaller handwritten parenthetical:
"(the kind with talking"
"dragons that do not"
"actually teach phonics.)"

Now, in the upper-right area of the page (NOT the top-right corner, which stays empty, but slightly lower), a small hand-drawn box with handwriting inside it:
"Total so far:"
"£1,248"
The box is a roughly-drawn rectangle in pen, with the words inside it.

Marginalia: a circle around "£108". A wavy underline beneath the "Total so far:" inside the box. A small arrow from "phonics" in the parenthetical comment pointing to the word "dragons" with a small question mark.""",
    },

    # ─── 4. BOOKS
    {
        "name": "slide_4_books",
        "content": """Handwritten content on the page, well composed:

Upper-left area, large handwritten:
"Step 3."

Heading just below in slightly larger handwriting:
'Reading books from Amazon.'
The single quotation marks are drawn around the heading.

After a small gap, the math sum:
"£30 / month  x  12 months"

A horizontal line beneath the sum.

Below the line, the result:
"= £360"

After a clear gap, smaller handwritten parenthetical comment:
"(only 1 in 10 of those books"
"are actually decodable.)"

In the upper-right area of the page (not the top-right corner, which stays empty), a small hand-drawn box with handwriting inside:
"Total so far:"
"£1,608"
The box is a roughly-drawn rectangle in pen.

Marginalia: a hand-drawn circle around "£360". A wavy underline beneath "1 in 10". A small frowny face drawn in pen near the parenthetical, simple circle with two dots and a downturned mouth, ballpoint style. The word "decodable" is underlined.""",
    },

    # ─── 5. THE TOTAL (the emotional drop)
    {
        "name": "slide_5_total",
        "content": """Handwritten content on the page, mostly empty space at the top and bottom, with one large isolated number in the centre.

In the very centre of the page, occupying roughly one quarter of the page height, the figure handwritten very large in clean confident strokes:
"£1,608"

Below the large number, in noticeably smaller handwriting on its own line:
"a year."

After a clear gap below that, in smaller handwriting on two short lines:
"And her daughter still"
"cannot read 'shop'."

Above the large number, in much smaller handwriting (like a quiet aside): a single word: "Total:"

Marginalia: A small hand-drawn arrow pointing from "shop" up toward the large £1,608 figure, as if connecting cause and effect. A wavy double-underline beneath "still". Nothing else, the page should breathe with white space. The visual force of this slide is the isolation of the number.""",
    },

    # ─── 6. THE CROSS-OUT REVEAL
    {
        "name": "slide_6_reveal",
        "content": """Handwritten content on the page, with a dramatic visual pivot.

Upper-third of the page, smaller handwriting on two short lines:
"Then her sister told her"
"about something else."

Below that, mid-upper area of page, the number "£1,608" written in handwriting at medium size, then DRAMATICALLY CROSSED OUT with three or four THICK BLUE PEN STRIKETHROUGH LINES drawn at slight angles through it. The strikethrough must be heavy and unmistakable, like a teacher firmly correcting an answer, not a delicate single line. The £1,608 should still be legible underneath the strikethrough lines.

After a clear gap below the crossed-out figure, in much larger confident handwriting on its own line, this number stands alone:
"£1"

Beneath the £1, in smaller handwriting on three lines:
"Forever."
"All 32 decodable books."
"Built by a British primary teacher."

Marginalia: a hand-drawn arrow from "£1,608" pointing DOWN to the "£1". A small star or asterisk next to "£1". A wavy underline beneath the words "British primary teacher." Nothing else. The strikethrough is the visual centrepiece.""",
    },

    # ─── 7. CTA
    {
        "name": "slide_7_cta",
        "content": """Handwritten content on the page, well composed in the centre with breathing space above and below:

In the upper-middle area, larger handwriting on three short lines:
"First step:"
"find out where they"
"actually are."

After a clear gap, smaller handwriting on three lines:
"Free 3-minute"
"reading assessment."
"At their exact level."

After another gap, in slightly cleaner writing as if written more carefully:
"myphonicsbooks.com"
with a hand-drawn underline beneath it.

In the lower-right, written at a slight angle:
"(it really is just £1.)"

Marginalia: a hand-drawn arrow pointing from the word "Free" up to the heading. A small star next to "myphonicsbooks.com". A small wavy underline under "exact level". Nothing else. The page should feel like the warm, decisive last note of a story."""
    },
]


def build_prompt(slide: dict) -> str:
    return f"""{SCAFFOLD}

THIS SLIDE'S CONTENT:

{slide['content']}

Final reminder: the entire image is one piece of plain paper photographed from above. Every word and every mark is handwritten in real-feeling blue ballpoint pen. No printed text. No graphic design ornaments. No watermarks. No logo. Top-right corner empty for compositing later. The handwriting must read as a real teacher's notes, with natural imperfection. Numbers must render exactly as written: £30, £1,140, £8.99, £108, £30, £360, £1,608, £1, 38, 12. No commas in unexpected places. Use £ symbol consistently."""


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
