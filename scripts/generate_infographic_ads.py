"""
MyPhonicsBooks -- Infographic Ad Generator (gpt-image-2)
=========================================================
Uses OpenAI's new gpt-image-2 to produce NotebookLM-quality infographic
Meta ads — hook headline, visual, CTA, brand — all in one generation with
reliable typography.

Run:
  python scripts/generate_infographic_ads.py

Output: marketing-visuals/gpt-generated/
"""

import os
import re
import sys
import base64
from pathlib import Path

SCRIPT_DIR   = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
ENV_FILE     = PROJECT_ROOT / "myphonics_books" / ".env"
OUT_DIR      = PROJECT_ROOT / "marketing-visuals" / "gpt-generated"

MODEL = "gpt-image-1.5"  # gpt-image-2 requires org verification; 1.5 is the
                          # next-best unrestricted option with strong text rendering

# ── Brand reference baked into every prompt ────────────────────────────────
BRAND_DNA = """
Brand: MyPhonicsBooks — a decodable phonics reading programme for children aged 4-8.
Brand voice: warm, evidence-based, culturally inclusive, never patronising.
Visual style: editorial infographic, clean, confident, magazine-quality typography.
Colour palette: deep indigo #1e1b4b background preferred, white text, and six level colours:
  Pink #E84B8A (Level 1), Amber #F59E0B (Level 2), Green #22C55E (Level 3),
  Blue #3B82F6 (Level 4), Purple #8B5CF6 (Level 5), Teal #14B8A6 (Level 6).
Fonts: Outfit (headings) or Inter — heavy sans-serif weights 800-900 for headlines,
  500-600 for body. No handwriting fonts. British English.
Brand badge: small "MyPhonicsBooks" wordmark with a small gradient dot next to it.
"""


ADS = [
    {
        "id":   "ig01_sounds_audit",
        "size": "1024x1024",
        "prompt": BRAND_DNA + """
Design a 1:1 Instagram feed infographic ad, 1024x1024.
LAYOUT — top band, middle grid, bottom CTA, like a NotebookLM insight card.

TOP (upper third):
  Tiny brand badge "MyPhonicsBooks" (white) in the top-left.
  A small pill chip on the top-right reading "5-MIN ASSESSMENT".
  Below, a big bold hook question filling the top third in Outfit 900:
    "Does your 5-year-old
     know these 12 sounds?"

MIDDLE (central two-thirds):
  A clean 4-column × 3-row grid of 12 phonics sound cards.
  Each card is a rounded-square tile with a soft subtle drop shadow and shows
  one lowercase letter in a single-story style, large, centered, in dark ink
  on a cream card background #f8f5e8.
  The 12 sounds in order (reading left to right, top row first):
    s   a   t   p
    i   n   m   d
    g   o   c   k

BOTTOM (lower sixth):
  A horizontal info bar: "Most UK 5-year-olds know 8 of these by reception."
  Below that, a white pill CTA button aligned right: "Find their level →"
  On the left, small text: "Free · 5 minutes · no account".

Background: deep indigo #1e1b4b with a soft top-left radial glow in #312e81.
Typography hierarchy must be clean and editorial — no decorative fonts. All
text must be rendered in crisp, professional letterforms. No book covers in
this ad — pure editorial infographic.
""",
    },
    {
        "id":   "ig02_where_is_your_child",
        "size": "1024x1024",
        "prompt": BRAND_DNA + """
Design a 1:1 Instagram feed infographic ad, 1024x1024, in the style of a
NotebookLM reading-journey visualisation.

LAYOUT — top title, middle horizontal ladder, bottom CTA.

TOP:
  Tiny "MyPhonicsBooks" brand badge top-left.
  Headline in Outfit 900, large, white, centred:
    "Where is your child
     on the reading journey?"
  Sub-headline below in lighter weight:
    "Six colour-coded levels. One path. We place them in 5 minutes."

MIDDLE — a horizontal reading-level ladder running left to right:
  Six circular nodes connected by a dashed line, each node a filled circle
  in its level colour with the level number in white Outfit 900:
    (●pink #E84B8A L1) — (●amber #F59E0B L2) — (●green #22C55E L3) —
    (●blue #3B82F6 L4) — (●purple #8B5CF6 L5) — (●teal #14B8A6 L6)
  Beneath each node, a small label stacked vertically:
    L1 Pink "Starting Stories" · Age 4-5
    L2 Amber "Longer Sounds" · Age 5
    L3 Green "New Spellings" · Age 5-6
    L4 Blue "Building Fluency" · Age 6
    L5 Purple "Reading Together" · Age 6-7
    L6 Teal "Reading Champion" · Age 7+

BOTTOM:
  A subtle progress indicator showing "most parents land their child around
  Level 2-3 after the assessment."
  White pill CTA: "Start the free assessment →"

Background: deep indigo #1e1b4b. Clean editorial infographic feel. All
typography crisp and legible, no handwriting fonts. No book covers.
""",
    },
    {
        "id":   "ig03_global_comparison",
        "size": "1024x1024",
        "prompt": BRAND_DNA + """
Design a 1:1 Instagram feed infographic ad, 1024x1024, in the style of a
magazine data visualisation.

LAYOUT — top hook, middle bar chart, bottom insight line + CTA.

TOP:
  Small "MyPhonicsBooks" badge top-left and pill "DATA INSIGHT" top-right.
  Hook headline, Outfit 900, white, centred, large:
    "The UK expects Level 4 reading
     by age 7. Where does your child stand?"

MIDDLE — a clean horizontal bar chart with four bars, each a thick rounded
rectangle, showing expected reading level by age for typical UK children:
  Age 4 — Level 1 (pink bar #E84B8A, shortest)
  Age 5 — Level 2 (amber bar #F59E0B)
  Age 6 — Level 3 (green bar #22C55E)
  Age 7 — Level 4 (blue bar #3B82F6, longest)
  Each bar labelled at its end in white numeric text "L1", "L2", "L3", "L4".
  Y-axis labels "Age 4", "Age 5", "Age 6", "Age 7" on the left in light grey.

BOTTOM:
  One-sentence insight in italic-looking white: "Phonics progression is
  predictable — every child gets there, but only if the books match."
  On the same row on the right, white pill CTA: "Place your child →"

Background: deep indigo #1e1b4b with a very subtle grid of dotted lines
behind the chart. Clean editorial infographic. Every letter crisp and
perfectly legible. No book covers.
""",
    },
    {
        "id":   "ig04_representation",
        "size": "1024x1536",
        "prompt": BRAND_DNA + """
Design a 4:5 Instagram feed ad, 1024x1280 portrait, in the style of a
NotebookLM cultural-representation infographic card.

LAYOUT — top hook, middle split visualisation, bottom CTA.

TOP (top quarter):
  Small "MyPhonicsBooks" badge top-left.
  Headline Outfit 900 in white, centred:
    "Is the hero of your child's book
     a mirror... or a window?"

MIDDLE (central half):
  Two stacked rows. Each row is a band of five small simple flat vector
  illustration portraits of children, each in a coloured circle (no photos,
  no realistic faces — just simple minimal icon-style portraits). Each portrait
  is a different culture:
  Top row label "What most phonics books show:" — 5 identical pale-skinned
  kids, all roughly identical, in beige circles. Bleached, uniform, dull.
  Bottom row label "What MyPhonicsBooks shows:" — 5 visibly different kids:
  a hijab-wearing girl, a Japanese boy, an East African girl with beaded
  cornrows, a South Asian boy, a Jewish boy with a kippah. Each in its own
  vibrant brand-colour circle (pink, amber, green, blue, purple, teal).

BOTTOM:
  One strong insight line in white: "Children read better when they see
  themselves on the page."
  White pill CTA centred: "See all 32 books →"
  Tiny trust line below: "Built across 8 cultures. Every word decodable."

Background: deep indigo #1e1b4b. Clean, editorial, confident typography.
All text must be crisp, legible, correctly spelled. No book covers in this ad.
""",
    },
    {
        "id":   "ig05_breadth_proof",
        "size": "1024x1024",
        "prompt": BRAND_DNA + """
Design a 1:1 Instagram feed infographic ad, 1024x1024, in the style of a
magazine "stats block" layout.

LAYOUT — four big stat tiles in a 2x2 grid, with a headline above and CTA below.

TOP:
  Small "MyPhonicsBooks" badge top-left.
  Headline Outfit 900 in white, centred:
    "Built in 18 months.
     One family at a time."

CENTRE — a 2x2 grid of four large stat cards, each a rounded rectangle with
a subtle 1px inner border, showing:
  Top-left card:  number "32" huge in Outfit 900 white; label below "Books"
    in Outfit 700 letter-spaced uppercase.
  Top-right card: number "6" huge; label "Reading Levels"
  Bottom-left:    number "8+" huge; label "Cultural settings"
  Bottom-right:   number "100%" huge; label "Decodable"
  Each card sits on a subtle dark panel slightly lighter than the indigo bg.
  The "32" card has a tiny pink dot; "6" amber; "8+" green; "100%" teal —
  as tiny corner accents.

BOTTOM:
  A single trust line in white: "No screens. No apps. Real printed books."
  White pill CTA centred: "Start the free assessment →"

Background: deep indigo #1e1b4b. Editorial, confident, NotebookLM-precise
typography. Every letter crisp and perfectly rendered. No book covers.
""",
    },
]


def load_api_key():
    import re
    for line in ENV_FILE.read_text().splitlines():
        if line.startswith("OPENAI_API_KEY="):
            return re.split(r"\s", line.split("=", 1)[1])[0].strip('"\'')
    print("ERROR: OPENAI_API_KEY not found")
    sys.exit(1)


def generate(client, ad: dict):
    out_path = OUT_DIR / f"{ad['id']}.png"
    if out_path.exists():
        print(f"  EXISTS: {out_path.name} -- skipping")
        return

    print(f"  Generating: {ad['id']} ({ad['size']})...")
    try:
        response = client.images.generate(
            model=MODEL,
            prompt=ad["prompt"],
            size=ad["size"],
            n=1,
        )
        # gpt-image-2 returns base64 by default
        b64 = response.data[0].b64_json
        if b64:
            out_path.write_bytes(base64.b64decode(b64))
            print(f"  [OK] {out_path.name}")
        else:
            url = response.data[0].url
            if url:
                import urllib.request
                out_path.write_bytes(urllib.request.urlopen(url).read())
                print(f"  [OK] {out_path.name} (from URL)")
            else:
                print(f"  No image data returned")
    except Exception as e:
        print(f"  Error: {e}")


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"MyPhonicsBooks -- Infographic Ad Generator ({MODEL})")
    print("=" * 58)

    from openai import OpenAI
    key = load_api_key()
    print(f"API key loaded: {key[:10]}...")
    client = OpenAI(api_key=key)

    print(f"\nGenerating {len(ADS)} infographic ads...")
    for ad in ADS:
        generate(client, ad)

    print(f"\nAll done. Outputs saved to:\n  {OUT_DIR}")


if __name__ == "__main__":
    main()
