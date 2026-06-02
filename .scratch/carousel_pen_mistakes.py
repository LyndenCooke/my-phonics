"""
Carousel: "5 English Learning Mistakes" — handwritten ballpoint-pen on
plain paper. The visual IS the credibility (looks like a teacher's
real notes, not an ad).

7 slides: cover + 5 mistakes + payoff/CTA.

Output: .scratch/carousel/pen_mistakes/slide_1.png ... slide_7.png
Cost:   7 x 1024x1536 high = approx $1.16
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
OUT_DIR = REPO_ROOT / ".scratch" / "carousel" / "pen_mistakes"
OUT_DIR.mkdir(parents=True, exist_ok=True)

load_dotenv(ENV_PATH)
API_KEY = os.environ.get("OPENAI_API_KEY")
if not API_KEY or not API_KEY.startswith("sk-"):
    print(f"ERROR: OPENAI_API_KEY not found / invalid in {ENV_PATH}")
    sys.exit(1)

MODEL = "gpt-image-2"
SIZE = "1024x1536"


# Visual scaffold — every slide must look like a page from the same notebook.
SCAFFOLD = """Portrait 1024x1536 image of a single page of plain off-white paper, photographed almost flat from above on a quiet desk. The page fills the canvas almost edge to edge with a small amount of background visible at the very edges (the desk surface, slightly out of focus, neutral warm grey).

PAPER: plain unlined off-white printer paper, very subtle paper grain texture, a faint shadow at one edge to suggest it is a real physical sheet on a surface, no holes, no lines, no graph squares. Tiny faint paper creases or fold marks acceptable.

PEN: every word and mark on the page is handwritten with a real blue ballpoint pen. The ink is a typical slightly cool blue, hex roughly #1A3FA0, not navy and not royal. The line weight varies naturally as a real ballpoint does, with the occasional thicker spot where pressure increased and a few barely-visible ink starvation breaks. Letters are clearly legible printed handwriting (not cursive, not a stylised font), the kind a primary teacher writes when making quick notes for a colleague. Slight slope to the writing, slight irregular baseline, real human imperfection, NEVER perfectly aligned.

MARGINALIA AND EMPHASIS: handwritten underlines (sometimes wavy, sometimes double), small circles around key phrases, small arrows pointing from one phrase to another, asterisks, and the very occasional crossed-out word with the corrected word above it. These should feel scattered and natural, not designed.

ABSOLUTE RULES: no logos, no brand marks, no printed type, no computer-generated text, no Outfit or Plus Jakarta typography styling — everything is handwritten. No emojis. British English spelling throughout. No em dashes (use full stops or commas). No torn edges, no notebook spiral, no lines, no grid. Top-right corner of the page must be left empty so a small wordmark can be composited later.

The carousel reads as if a real British primary school teacher sat down and wrote out a list of mistakes she keeps seeing parents make. Each slide is one page from that same notebook. Voice is warm, plain-spoken, professional. NOT teacherly-condescending."""


SLIDES = [
    # ─── 1. COVER
    {
        "name": "slide_1_cover",
        "content": """The page contains the following handwritten content, with generous spacing, well composed on the page:

Large handwritten title across the upper third, sitting on a slight angle, in slightly larger handwriting with a hand-drawn underline beneath it:
"5 English learning mistakes"

Below that, smaller, slightly indented:
"parents make."

Below that, after a clear gap, in slightly smaller handwriting:
"(I see these every week as a teacher.)"

In the lower right area, written at a slight angle, smaller, like a small note to self:
"swipe -->"
with a hand-drawn arrow next to the word, drawn as a simple two-stroke arrowhead.

In the lower left corner, signed in slightly smaller handwriting:
"- Lynden"

Marginalia: a small wavy underline beneath the words "5" and "every week". A small star or asterisk drawn next to the line "(I see these every week as a teacher.)" Nothing else.""",
    },

    # ─── 2. MISTAKE 1
    {
        "name": "slide_2_mistake_1",
        "content": """Handwritten content on the page, well composed, top to bottom with breathing room:

Upper-left area, large handwritten:
"1."

Just below "1." and slightly to the right, the heading in slightly larger handwriting:
'Guess from the picture.'
The single quotation marks are drawn around the heading.

Below the heading, after a small gap, body text in clean print handwriting, three short lines:
"It feels helpful."
"It is the opposite of how"
"reading actually works."

Below that, after another gap, a longer body block in slightly smaller handwriting flowing across roughly four to five lines:
"Ofsted (2022) and the DfE Reading Framework explicitly recommend decodable text. That means words your child has actually been taught to sound out, not words they are guessing from a picture."

Marginalia: a hand-drawn circle around 'Ofsted (2022)'. A wavy underline under the words 'decodable text'. A small arrow drawn from 'guessing from a picture' pointing back up to the heading. A tiny "x" in the bottom-left margin. In the very bottom-right corner, small handwritten "1 of 5".""",
    },

    # ─── 3. MISTAKE 2
    {
        "name": "slide_3_mistake_2",
        "content": """Handwritten content on the page, well composed:

Upper-left area, large handwritten:
"2."

Heading just below in slightly larger handwriting:
"Waiting until 6 or 7"
"to start phonics."

Body text, several lines with breathing space:
"Phonics has TWICE the"
"effect when started before"
"Year 1 (National Reading"
"Panel, 2000)."

After a small gap:
"Reception is the floor."
"Not the start."

After another gap, smaller handwriting:
"Ages 4 to 5 is the sweet spot."

Marginalia: a strong double-underline under the word 'TWICE'. A small arrow drawn from the word 'TWICE' pointing left toward the body of the page. A hand-drawn circle around '(National Reading Panel, 2000)'. A tiny exclamation mark "!" in the right margin opposite 'sweet spot'. In the very bottom-right corner, small handwritten "2 of 5".""",
    },

    # ─── 4. MISTAKE 3
    {
        "name": "slide_4_mistake_3",
        "content": """Handwritten content on the page, well composed:

Upper-left area, large handwritten:
"3."

Heading in slightly larger handwriting:
"Books that are"
"too hard."

After a gap, body text:
"If your child cannot sound"
"out 95% of the words on a"
"page, the book is too hard."

After another gap:
"Frustration kills reading."

After another gap:
"Decodable books match the"
"sounds they actually know."

Marginalia: a wavy underline under '95%'. A hand-drawn small frowny face drawn in pen as part of the marginalia next to 'Frustration kills reading.' (a simple circle with two dots for eyes and a downturned mouth, ballpoint-pen style, not cute, just casual). The phrase 'Decodable books' is circled. In the very bottom-right corner, small handwritten "3 of 5".""",
    },

    # ─── 5. MISTAKE 4
    {
        "name": "slide_5_mistake_4",
        "content": """Handwritten content on the page, well composed:

Upper-left area, large handwritten:
"4."

Heading in slightly larger handwriting:
"Reading TO them,"
"not WITH them."

After a gap, body text:
"Bedtime stories build"
"vocabulary."

After a gap:
"They do not teach decoding."

After another gap:
"Decoding is built through"
"your child sounding words"
"out, slowly, every day."

Marginalia: the words 'TO' and 'WITH' in the heading are emphasised with a hand-drawn box around each one. A small arrow points from 'TO' to 'vocabulary' and a separate arrow points from 'WITH' to 'sounding words out'. A small wavy underline under 'every day'. In the very bottom-right corner, small handwritten "4 of 5".""",
    },

    # ─── 6. MISTAKE 5
    {
        "name": "slide_6_mistake_5",
        "content": """Handwritten content on the page, well composed:

Upper-left area, large handwritten:
"5."

Heading in slightly larger handwriting:
"Waiting for the school"
"to flag it."

After a gap, body text:
"1 in 5 children fail the Year"
"1 phonics check (DfE 2024)."

After a gap:
"Many are not flagged for"
"extra support until Year 3."

After another gap:
"By then the gap is hard"
"to close."

Marginalia: a hand-drawn circle around '1 in 5'. A double underline beneath 'Year 3'. A small arrow from 'Year 3' pointing down toward 'hard to close'. A tiny asterisk next to '(DfE 2024)'. In the very bottom-right corner, small handwritten "5 of 5".""",
    },

    # ─── 7. PAYOFF / CTA
    {
        "name": "slide_7_cta",
        "content": """Handwritten content on the page, well composed in the centre with breathing space above and below:

In the upper-middle area, larger handwriting on three short lines:
"Avoid these 5 mistakes"
"and your child"
"will read."

After a clear gap, smaller handwriting, four lines:
"Find out exactly where"
"they are. Free 3-minute"
"reading assessment."

After another gap, in slightly cleaner writing as if written more carefully:
"myphonicsbooks.com"
with a hand-drawn underline beneath it.

In the lower-left, signed:
"- Lynden"
"primary teacher"

Marginalia: a hand-drawn arrow pointing from the word 'free' back up to the heading. A small star next to 'myphonicsbooks.com'. A small wavy underline under 'will read'. Nothing else. The page should feel like the warm, decisive last note of a list.""",
    },
]


def build_prompt(slide: dict) -> str:
    return f"""{SCAFFOLD}

THIS SLIDE'S CONTENT:

{slide['content']}

Final reminder: the entire image is one piece of plain paper photographed from above. Every word and every mark is handwritten in real-feeling blue ballpoint pen. No printed text. No graphic design ornaments. No watermarks. No logo. Top-right corner empty for compositing later. The handwriting must read as a real teacher's notes, with natural imperfection."""


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
