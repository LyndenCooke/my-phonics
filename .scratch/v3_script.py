"""
MyPhonicsBooks — Meta Visuals v3 generator.

Visual-first, scroll-stopping creatives for Meta (Instagram + Facebook)
built with OpenAI's gpt-image-1.

Usage:
    # Everything (approx 42 images)
    python generate_meta_visuals.py

    # A theme group (A, B, C, D, E, F)
    python generate_meta_visuals.py A
    python generate_meta_visuals.py E

    # A single country pack (both E1 founders + F1 window)
    python generate_meta_visuals.py pakistan

    # A single visual by name
    python generate_meta_visuals.py A1_window_brain
    python generate_meta_visuals.py E1_founders_india

Environment:
    OPENAI_API_KEY must be set in the repo-root .env.
"""

from __future__ import annotations

import base64
import os
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.environ.get("OPENAI_API_KEY")
SCRIPT_DIR = Path(__file__).parent
OUTPUT_DIR = SCRIPT_DIR / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# gpt-image-1 accepts 1024x1024, 1024x1536, 1536x1024, auto.
SIZE_SQUARE = "1024x1024"
SIZE_PORTRAIT = "1024x1536"
SIZE_LANDSCAPE = "1536x1024"

# Brand palette tokens reused across every prompt.
BRAND = (
    "MyPhonicsBooks brand palette: pink #E84B8A, amber #F59E0B, green #22C55E, "
    "blue #3B82F6, purple #8B5CF6, teal #14B8A6. Background: near-black #0B0B0F "
    "or warm cream #FAF6EF. Typography: bold sans-serif, generous whitespace."
)

STYLE = (
    "Flat vector infographic poster style. Clean geometric shapes. No realistic "
    "human faces anywhere, no photo-realism. Use simple icons, silhouettes and "
    "abstract figures only. Minimal text, no fake logos. Thick strokes, high "
    "contrast, social-media-first composition. Designed to stop the scroll. "
    "British English only. No emojis. No Oxford commas. No em dashes."
)

SAFETY = (
    "No children's faces. No identifiable people. No watermarks. No fake brand "
    "names. No text that could be read as a medical or outcome guarantee."
)


# ─────────────────────────────────────────────────────────────────────
# A. The 4-7 Window
# ─────────────────────────────────────────────────────────────────────

A_VISUALS = {
    "A1_window_brain": {
        "prompt": (
            "A stylised child-shaped brain made of glowing neural filaments "
            "against a near-black background. The brain glows brightly with "
            "pink and teal neurons between ages 4, 5, 6 and 7 (numbers "
            "floating as small pill badges around the brain). After 7, the "
            "neuron glow fades to cool grey. Single bold label in white: "
            "'4 · 5 · 6 · 7'. Small caption underneath in amber: 'the window'. "
            f"{BRAND} {STYLE} {SAFETY}"
        ),
        "size": SIZE_SQUARE,
    },
    "A2_window_staircase": {
        "prompt": (
            "An isometric staircase of 10 steps climbing from left to right. "
            "Steps labelled 4, 5, 6, 7 glow bright pink and teal. Steps "
            "labelled 8, 9, 10 are cracked, missing or crumbling into grey "
            "dust. A small silhouette figure stands on step 7 hesitating "
            "before the gap. Near-black background. Headline top-left: "
            "'The window'. "
            f"{BRAND} {STYLE} {SAFETY}"
        ),
        "size": SIZE_SQUARE,
    },
    "A3_two_trees": {
        "prompt": (
            "Side-by-side comparison of two stylised trees on a warm cream "
            "background. Left tree has deep colourful roots and a full "
            "canopy in pink and teal. Right tree has shallow roots and "
            "thin, wilting branches in muted grey. The ground between them "
            "is split like a diagram. No text labels on the trees. "
            f"{BRAND} {STYLE} {SAFETY}"
        ),
        "size": SIZE_SQUARE,
    },
    "A4_gaps_compound": {
        "prompt": (
            "A minimalist line chart on a near-black background. X-axis "
            "labelled 'Age 4 → 11'. Two curves start at the same point: a "
            "pink one climbs steeply and confidently, a grey one flattens "
            "and falls behind. No numerical values. Clean grid, thick "
            "strokes. Small label under the pink line: 'secure'. Small "
            "label under the grey line: 'guessing'. "
            f"{BRAND} {STYLE} {SAFETY}"
        ),
        "size": SIZE_SQUARE,
    },
    "A5_foundation_crack": {
        "prompt": (
            "Two simple house silhouettes side by side on warm cream. Left "
            "house sits on a solid deep teal foundation labelled 'phonics'. "
            "Right house tilts on a cracked grey foundation with visible "
            "fissures. No people, no faces, no text except the single word "
            "'phonics' on the left foundation. Flat vector infographic. "
            f"{BRAND} {STYLE} {SAFETY}"
        ),
        "size": SIZE_SQUARE,
    },
}


# ─────────────────────────────────────────────────────────────────────
# B. Reading Age Awareness
# ─────────────────────────────────────────────────────────────────────

B_VISUALS = {
    "B1_reading_age_gap": {
        "prompt": (
            "A split-screen infographic. Left side, pink panel: huge number "
            "'6' with caption 'age'. Right side, grey panel: huge number "
            "'4' with caption 'reading age'. A lightning-bolt shape connects "
            "them diagonally with a large question mark in the gap. Near-"
            "black background behind both panels. "
            f"{BRAND} {STYLE} {SAFETY}"
        ),
        "size": SIZE_SQUARE,
    },
    "B2_parents_73pct": {
        "prompt": (
            "Ten simple adult silhouettes arranged in two rows of five on a "
            "near-black background. Seven of them have a glowing question "
            "mark above their head in pink. Three have a glowing lightbulb "
            "above their head in teal. Huge bold number '73%' occupies the "
            "top third. No faces on the silhouettes, just clean abstract "
            "shapes. "
            f"{BRAND} {STYLE} {SAFETY}"
        ),
        "size": SIZE_SQUARE,
    },
    "B3_book_above_level": {
        "prompt": (
            "A small teetering stack of three tiny books on the ground. A "
            "single enormous book towers above them, too big to balance, "
            "about to fall. Flat vector style. Warm cream background. "
            "Subtle pink shadow under the giant book. No text. "
            f"{BRAND} {STYLE} {SAFETY}"
        ),
        "size": SIZE_SQUARE,
    },
}


# ─────────────────────────────────────────────────────────────────────
# C. 10-Minute Habit Math
# ─────────────────────────────────────────────────────────────────────

C_VISUALS = {
    "C1_habit_math_feed": {
        "prompt": (
            "A three-panel horizontal infographic on a near-black "
            "background. Panel 1: a small clock face showing '10 min', a "
            "single thin book beside it. Panel 2: a calendar grid with the "
            "caption '60 hours', a stack of five books beside it. Panel 3: "
            "a timeline of four years, caption '240 hours', a tall tower of "
            "twenty books beside it. Thick pink arrows connect the panels. "
            "Clean, bold, poster-like. "
            f"{BRAND} {STYLE} {SAFETY}"
        ),
        "size": SIZE_SQUARE,
    },
    "C2_habit_story": {
        "prompt": (
            "A tall vertical three-stage tower on a warm cream background, "
            "sized for Instagram Stories. Bottom third: a small clock "
            "labelled '10 min'. Middle third: a medium stack of books "
            "labelled '1 year'. Top third: a grand tower of books in "
            "rainbow brand colours labelled '4 years'. Thick teal upward "
            "arrows between each stage. Minimal caption at the very top: "
            "'small habit · big reader'. "
            f"{BRAND} {STYLE} {SAFETY}"
        ),
        "size": SIZE_PORTRAIT,
    },
    "C3_habit_seed": {
        "prompt": (
            "A three-stage metaphor left-to-right: a small seed, a sapling, "
            "a tall fruiting tree. Each stage is rendered as a flat "
            "illustration. The tree's fruit are tiny book shapes in brand "
            "colours. Warm cream background. No text. "
            f"{BRAND} {STYLE} {SAFETY}"
        ),
        "size": SIZE_SQUARE,
    },
}


# ─────────────────────────────────────────────────────────────────────
# D. Do The Assessment First — 4-Step Journey
# ─────────────────────────────────────────────────────────────────────

D_VISUALS = {
    "D1_journey_4_step": {
        "prompt": (
            "A horizontal four-panel journey on a near-black background. "
            "Panel 1: a large magnifying glass over a tiny open book, "
            "labelled small '1 assess'. Panel 2: a single bright book cover "
            "in pink (MyPhonicsBooks style) with the title area left blank, "
            "labelled '2 get'. Panel 3: a stylised home printer emitting a "
            "freshly printed page, labelled '3 print'. Panel 4: a small "
            "silhouette of a seated child (back view, no face) holding the "
            "book, labelled '4 read'. Thick pink arrows between the panels. "
            "Each panel is a clean square card with rounded corners. "
            f"{BRAND} {STYLE} {SAFETY}"
        ),
        "size": SIZE_LANDSCAPE,
    },
    "D2_journey_story": {
        "prompt": (
            "A tall vertical four-step flow sized for Instagram Stories, on "
            "warm cream. Step 1 at the top: magnifying glass over a book, "
            "caption 'assess'. Step 2: a pink decodable book cover "
            "(MyPhonicsBooks style, blank title area), caption 'get'. "
            "Step 3: a printer with a printed page, caption 'print'. "
            "Step 4 at the bottom: a small silhouetted child reading "
            "(back view, no face), caption 'read'. Thick teal downward "
            "arrows between each step. "
            f"{BRAND} {STYLE} {SAFETY}"
        ),
        "size": SIZE_PORTRAIT,
    },
}


# ─────────────────────────────────────────────────────────────────────
# Country data powers E (Founders) + F (Critical Window per country)
# ─────────────────────────────────────────────────────────────────────

# Flag palette hints are descriptive, not pixel-perfect. gpt-image-1
# does well with flat geometric flag cues as accent colours.
COUNTRY_DATA = {
    "uk": {
        "name": "United Kingdom",
        "flag_hint": "red, white and navy Union Jack accent",
        "founders_price": "£1",
        "founders_label": "Founders Club",
        "window_anchor": "Reception starts the window",
    },
    "pakistan": {
        "name": "Pakistan",
        "flag_hint": "dark green and white crescent-and-star accent",
        "founders_price": "Rs 299",
        "founders_label": "Founders Club",
        "window_anchor": "English-medium from KG",
    },
    "bangladesh": {
        "name": "Bangladesh",
        "flag_hint": "bottle-green and red accent",
        "founders_price": "৳120",
        "founders_label": "Founders Club",
        "window_anchor": "English from Class 1",
    },
    "india": {
        "name": "India",
        "flag_hint": "saffron, white and green tricolour accent",
        "founders_price": "₹99",
        "founders_label": "Founders Club",
        "window_anchor": "LKG to UKG: the window",
    },
    "malaysia": {
        "name": "Malaysia",
        "flag_hint": "red, white, navy and yellow crescent accent",
        "founders_price": "RM 5",
        "founders_label": "Founders Club",
        "window_anchor": "English from Tahun 1",
    },
    "philippines": {
        "name": "Philippines",
        "flag_hint": "royal blue, red, white and yellow sun accent",
        "founders_price": "₱60",
        "founders_label": "Founders Club",
        "window_anchor": "English from Kinder",
    },
    "indonesia": {
        "name": "Indonesia",
        "flag_hint": "red and white horizontal accent",
        "founders_price": "Rp 20K",
        "founders_label": "Founders Club",
        "window_anchor": "English from SD kelas 1",
    },
    "vietnam": {
        "name": "Vietnam",
        "flag_hint": "red and yellow star accent",
        "founders_price": "₫25K",
        "founders_label": "Founders Club",
        "window_anchor": "English from Lớp 1",
    },
    "nigeria": {
        "name": "Nigeria",
        "flag_hint": "green and white vertical accent",
        "founders_price": "₦1,500",
        "founders_label": "Founders Club",
        "window_anchor": "English from Primary 1",
    },
    "kenya": {
        "name": "Kenya",
        "flag_hint": "black, red and green with white trim accent",
        "founders_price": "KSh 150",
        "founders_label": "Founders Club",
        "window_anchor": "English from Grade 1",
    },
    "ghana": {
        "name": "Ghana",
        "flag_hint": "red, gold, green with black star accent",
        "founders_price": "GH₵ 15",
        "founders_label": "Founders Club",
        "window_anchor": "English from KG",
    },
    "egypt": {
        "name": "Egypt",
        "flag_hint": "red, white, black horizontal accent",
        "founders_price": "E£ 60",
        "founders_label": "Founders Club",
        "window_anchor": "English from KG1",
    },
    "turkey": {
        "name": "Turkey",
        "flag_hint": "red with white crescent-and-star accent",
        "founders_price": "₺40",
        "founders_label": "Kurucu Kulübü",
        "window_anchor": "İngilizce 2. sınıftan",
    },
    "morocco": {
        "name": "Morocco",
        "flag_hint": "red with green star accent",
        "founders_price": "MAD 10",
        "founders_label": "Founders Club",
        "window_anchor": "English from primary",
    },
    "tunisia": {
        "name": "Tunisia",
        "flag_hint": "red with white disc and crescent-and-star accent",
        "founders_price": "3 DT",
        "founders_label": "Founders Club",
        "window_anchor": "Anglais dès l'école",
    },
}


def build_founders_prompt(data: dict) -> str:
    return (
        f"A square social-media poster for the '{data['founders_label']}' "
        f"aimed at parents in {data['name']}. Dominant element: a large bold "
        f"price badge '{data['founders_price']}' rendered as a glossy coin "
        "shape in brand pink with a teal outline. A curved ribbon behind "
        f"the coin reads '{data['founders_label']}' in clean sans-serif "
        "capitals. A circle of 8 tiny abstract parent-and-child silhouette "
        "icons orbits the coin, rendered in brand colours. Subtle "
        f"{data['flag_hint']} as a soft background motif, not overpowering. "
        "Near-black background with a faint star-field of small dots. "
        "Tiny caption under the coin: 'founding members'. "
        f"{BRAND} {STYLE} {SAFETY}"
    )


def build_country_window_prompt(data: dict) -> str:
    return (
        f"A square social-media infographic for parents in {data['name']}. "
        "Central element: a stylised child-shaped brain outline glowing in "
        "pink and teal at ages 4, 5, 6 and 7, with small pill badges for "
        "each number floating around it. After age 7 the glow fades to "
        f"cool grey. Subtle background motif using {data['flag_hint']}, "
        "flat and low-contrast so the brain pops. Bold headline at the "
        f"top: 'The 4 to 7 window'. Small caption strip at the bottom: "
        f"'{data['window_anchor']}'. No faces, no photos. Near-black "
        "background. "
        f"{BRAND} {STYLE} {SAFETY}"
    )


# Build the full E + F dictionaries from COUNTRY_DATA.
E_VISUALS = {
    f"E1_founders_{slug}": {
        "prompt": build_founders_prompt(data),
        "size": SIZE_SQUARE,
    }
    for slug, data in COUNTRY_DATA.items()
}

F_VISUALS = {
    f"F1_window_{slug}": {
        "prompt": build_country_window_prompt(data),
        "size": SIZE_SQUARE,
    }
    for slug, data in COUNTRY_DATA.items()
}


# ─────────────────────────────────────────────────────────────────────
# Registry
# ─────────────────────────────────────────────────────────────────────

ALL_VISUALS: dict[str, dict] = {
    **A_VISUALS,
    **B_VISUALS,
    **C_VISUALS,
    **D_VISUALS,
    **E_VISUALS,
    **F_VISUALS,
}

GROUP_PREFIXES = {"A": "A", "B": "B", "C": "C", "D": "D", "E": "E1", "F": "F1"}


# ─────────────────────────────────────────────────────────────────────
# Generation
# ─────────────────────────────────────────────────────────────────────


def generate_image(name: str, prompt: str, size: str) -> Path | None:
    output_path = OUTPUT_DIR / f"{name}.png"
    if output_path.exists():
        print(f"  [{name}] already exists, skipping")
        return output_path

    print(f"  [{name}] generating ({size})...")
    try:
        response = requests.post(
            "https://api.openai.com/v1/images/generations",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-image-1",
                "prompt": prompt,
                "n": 1,
                "size": size,
                "quality": "high",
            },
            timeout=240,
        )
        response.raise_for_status()
        data = response.json()
        image_data = data["data"][0]

        if "b64_json" in image_data:
            img_bytes = base64.b64decode(image_data["b64_json"])
        elif "url" in image_data:
            img_bytes = requests.get(image_data["url"], timeout=60).content
        else:
            print(f"  [{name}] ERROR: no image data in response")
            return None

        output_path.write_bytes(img_bytes)
        print(f"  [{name}] saved ({len(img_bytes) // 1024} KB)")
        return output_path

    except requests.exceptions.HTTPError as e:
        print(f"  [{name}] HTTP error: {e}")
        if e.response is not None:
            print(f"  [{name}] body: {e.response.text[:500]}")
        return None
    except Exception as e:
        print(f"  [{name}] ERROR: {e}")
        return None


def resolve_targets(arg: str | None) -> list[str]:
    if not arg:
        return list(ALL_VISUALS.keys())

    key = arg.strip()
    key_lower = key.lower()

    if key in ALL_VISUALS:
        return [key]
    for name in ALL_VISUALS:
        if name.lower() == key_lower:
            return [name]

    if key.upper() in GROUP_PREFIXES:
        prefix = GROUP_PREFIXES[key.upper()]
        return [n for n in ALL_VISUALS if n.startswith(prefix)]

    if key_lower in COUNTRY_DATA:
        return [
            f"E1_founders_{key_lower}",
            f"F1_window_{key_lower}",
        ]

    return []


def main() -> None:
    if not API_KEY or API_KEY.startswith("your_"):
        print("ERROR: set OPENAI_API_KEY in the repo-root .env")
        sys.exit(1)

    arg = sys.argv[1] if len(sys.argv) > 1 else None
    targets = resolve_targets(arg)

    if not targets:
        print(f"Unknown target: {arg}")
        print("Available groups: A, B, C, D, E, F")
        print(f"Available countries: {', '.join(COUNTRY_DATA.keys())}")
        print(f"Available visuals: {', '.join(ALL_VISUALS.keys())}")
        sys.exit(1)

    print("=" * 64)
    print("MyPhonicsBooks — Meta Visuals v3")
    print(f"Output dir: {OUTPUT_DIR}")
    print(f"Targets: {len(targets)}")
    print("=" * 64)

    success = 0
    for i, name in enumerate(targets):
        config = ALL_VISUALS[name]
        result = generate_image(name, config["prompt"], config["size"])
        if result:
            success += 1
        if i < len(targets) - 1:
            time.sleep(12)

    print()
    print(f"Done. {success}/{len(targets)} images saved to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
