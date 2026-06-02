"""
MyPhonicsBooks — OpenAI Marketing Image Generator
==================================================
Generates illustrated marketing images using the OpenAI image generation API
(gpt-image-1 with dall-e-3 fallback).

Three concept sets:
  1. 10-minute reading habit visuals
  2. Early reading gap → life impact (targeting parents of 4–6 year olds)
  3. Hero character scenes (based on the L1_3 hijab-girl character illustration)

All images: illustrated flat design, NO photorealistic human faces.
Brand colours: indigo #312e81 · pink #E84B8A · teal #14B8A6 · amber #F59E0B

Run from Claude Code:
  python scripts/generate_awareness_images.py

Requires: pip install openai
API key:  OPENAI_API_KEY in myphonics_books/.env
"""

import os
import sys
import base64
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────

SCRIPT_DIR   = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
ENV_FILE     = PROJECT_ROOT / "myphonics_books" / ".env"
COVERS_DIR   = PROJECT_ROOT / "marketing-visuals" / "pdf-covers"
IMAGES_DIR   = PROJECT_ROOT / "myphonics_books" / "output" / "images"
OUT_DIR      = PROJECT_ROOT / "marketing-visuals" / "openai-generated"

# Prefer gpt-image-1 (better text, supports image input); falls back to dall-e-3
PREFERRED_MODEL = "gpt-image-1"
FALLBACK_MODEL  = "dall-e-3"

# ── Brand context appended to every prompt ────────────────────────────────────

BRAND_SUFFIX = """
Style rules:
- Illustrated flat design, editorial illustration style — NOT photorealistic
- No realistic human faces; characters have simple stylised features with small solid black dot eyes
- Warm, joyful, child-safe aesthetic
- Colour palette: deep indigo (#312e81), vivid pink (#E84B8A), teal (#14B8A6), amber (#F59E0B), green (#22C55E)
- Clean composition, strong focal point, minimal clutter
- 1:1 square format unless noted
- No text or lettering in the image (text will be added as HTML overlay)
"""

# ── Image concepts ────────────────────────────────────────────────────────────

CONCEPTS = [

    # ── SET 1: 10-MINUTE READING HABIT ───────────────────────────────────────

    {
        "id":      "habit_clock",
        "folder":  "habit",
        "name":    "10-minute habit — clock scene",
        "size":    "1024x1024",
        "quality": "high",
        "prompt":  """
A warm, inviting flat illustration for a children's phonics app. The central element is a
large, friendly round clock or timer showing '10 minutes'. Around it, soft cosy details:
a small stack of colourful children's books, a warm reading lamp, perhaps a cushion.
The colour palette is deep indigo and warm amber — calm but encouraging.
The mood is 'this is all it takes'. Minimal. Beautiful. No characters.
""" + BRAND_SUFFIX,
    },

    {
        "id":      "habit_before_after",
        "folder":  "habit",
        "name":    "10-minute habit — before/after reading level",
        "size":    "1024x1024",
        "quality": "high",
        "prompt":  """
A minimal flat design illustration showing two sides of a transformation.
Left side (muted, grey-purple): a small child sitting alone looking at a book, confused,
uncertain — illustrated style, no realistic face.
Right side (vibrant indigo to teal gradient): the same child confidently holding an open
book upright, clearly reading, joyful — flat illustration, simple solid dot eyes.
A clean vertical dividing line separates the two halves, with a subtle directional arrow.
Feel: empowering, clear, optimistic. No text.
""" + BRAND_SUFFIX,
    },

    {
        "id":      "habit_school_stat",
        "folder":  "habit",
        "name":    "10-minute habit — school phonics session visual",
        "size":    "1024x1024",
        "quality": "high",
        "prompt":  """
A clean editorial flat illustration representing a morning school phonics routine.
Simple abstract visual: rows of stylised illustrated books arranged in a neat arc or
semicircle, glowing warmly. In the centre, a bold geometric circle suggesting a clock or
sun — morning energy, routine, consistency.
Colour palette: deep indigo background, warm amber and pink accent elements.
Mood: structured, purposeful, achievable. No characters. No text.
""" + BRAND_SUFFIX,
    },

    # ── SET 2: EARLY GAP → LIFE IMPACT ───────────────────────────────────────

    {
        "id":      "gap_diverging_paths",
        "folder":  "gap-impact",
        "name":    "Gap impact — diverging life paths",
        "size":    "1024x1024",
        "quality": "high",
        "prompt":  """
An abstract editorial illustration of two paths diverging from a single starting point.
Both paths begin together at the bottom-left as one hopeful road.
One path (teal/green) curves upward smoothly — open, wide, lit.
The other path (muted rose/pink) gradually flattens and narrows, fading toward the edges.
The style is clean geometric line art on a very dark indigo background — like a beautiful
data visualisation made into art. No characters. No text. Minimal. Powerful.
""" + BRAND_SUFFIX,
    },

    {
        "id":      "gap_golden_window",
        "folder":  "gap-impact",
        "name":    "Gap impact — golden window ages 4-7",
        "size":    "1024x1024",
        "quality": "high",
        "prompt":  """
A luminous flat illustration representing a window of opportunity — the early years.
Central image: a warm golden window, open wide, with soft amber light pouring through.
Outside the window, a glimpse of a bright landscape — books floating gently, rising.
The window frame is deep indigo. The light is golden. The mood is urgent and beautiful —
like dawn breaking, like a door that won't stay open forever.
Around the window edges, the darkness gathers. Symbolic but beautiful. No text.
""" + BRAND_SUFFIX,
    },

    {
        "id":      "gap_age5_vs_age16",
        "folder":  "gap-impact",
        "name":    "Gap impact — age 5 small gap becomes age 16 large gap",
        "size":    "1024x1792",
        "quality": "high",
        "prompt":  """
A tall vertical editorial illustration — a timeline of a reading journey.
At the top: a small, subtle crack or gap — barely visible, like a hairline fracture.
The crack slowly widens as the illustration moves downward through time.
At the bottom: the crack has become a vast divide — a canyon — between two platforms.
One platform is bright, elevated, vibrant (teal). One is lower, dim (muted pink).
The style is abstract geometric art on deep indigo. No characters. No text.
The image should feel like a silent, powerful warning — beautiful but clear.
""" + BRAND_SUFFIX,
    },

    # ── SET 3: HERO CHARACTER SCENES ─────────────────────────────────────────

    {
        "id":      "hero_hijab_reading",
        "folder":  "characters",
        "name":    "Hero — hijab girl reading confidently",
        "size":    "1024x1024",
        "quality": "high",
        "prompt":  """
A joyful flat editorial illustration of a young South Asian girl (aged 5-6) wearing a
bright pink hijab, sitting confidently and reading an open book.
She is in a wheelchair. She is smiling broadly, fully absorbed in the story.
Illustration style: flat design with bold colours, simplified features,
small solid black dot eyes — warm brown skin, expressive posture.
Background: deep indigo with soft geometric shapes and a teal glow behind her.
The mood is empowering, joyful, proud. She owns this moment. No text.
""" + BRAND_SUFFIX,
    },

    {
        "id":      "hero_boy_market",
        "folder":  "characters",
        "name":    "Hero — West African boy with book at market",
        "size":    "1024x1024",
        "quality": "high",
        "prompt":  """
A warm, vibrant flat editorial illustration of a young West African boy (aged 5-6)
at a colourful market stall, holding up an open book with delight.
Flat design style: bold warm colours, simplified features, small solid black dot eyes,
dark rich brown skin, bright expression. The market background is minimal and impressionistic —
colourful shapes suggesting fruit, cloth, warmth.
The colour palette: warm amber, deep indigo, vivid green.
Mood: curious, joyful, culturally grounded. No text.
""" + BRAND_SUFFIX,
    },

    {
        "id":      "hero_dream_state",
        "folder":  "characters",
        "name":    "Hero — child reading ahead of their peers, dream state",
        "size":    "1024x1024",
        "quality": "high",
        "prompt":  """
A dreamy, aspirational flat illustration. A small child (gender-neutral, illustrated,
no realistic face) stands at the top of a gentle hill made entirely of colourful books —
stacked, tidy, glowing. The child holds a book open and looks out at a wide, bright horizon.
The sky is a deep indigo-to-teal gradient. Stars or small floating letters drift upward.
The mood is achievement, pride, possibility.
Flat editorial style with simplified characters and small solid dot eyes. No text.
""" + BRAND_SUFFIX,
    },

]


# ── Helpers ───────────────────────────────────────────────────────────────────

def load_api_key():
    if not ENV_FILE.exists():
        print(f"ERROR: .env not found at {ENV_FILE}")
        sys.exit(1)
    with open(ENV_FILE) as f:
        for line in f:
            if line.startswith("OPENAI_API_KEY="):
                raw = line.strip().split("=", 1)[1]
                return raw.split()[0].strip().strip('"\'')
    print("ERROR: OPENAI_API_KEY not found in .env")
    sys.exit(1)


def get_client():
    from openai import OpenAI
    key = load_api_key()
    print(f"API key loaded: {key[:12]}...")
    return OpenAI(api_key=key)


def try_generate(client, concept: dict, model: str) -> bytes | None:
    """Try generating with a given model. Returns raw PNG bytes or None."""
    from openai import OpenAI

    quality = concept.get("quality", "high")
    # dall-e-3 uses 'hd' not 'high'
    if model == "dall-e-3":
        quality = "hd"

    kwargs = dict(
        model=model,
        prompt=concept["prompt"].strip(),
        size=concept["size"],
        n=1,
    )
    if model == "gpt-image-1":
        kwargs["quality"] = quality
        kwargs["output_format"] = "png"
    else:
        kwargs["quality"] = quality
        kwargs["response_format"] = "b64_json"

    response = client.images.generate(**kwargs)
    part = response.data[0]

    if hasattr(part, "b64_json") and part.b64_json:
        return base64.b64decode(part.b64_json)

    if hasattr(part, "url") and part.url:
        import urllib.request
        with urllib.request.urlopen(part.url) as r:
            return r.read()

    return None


def generate_image(client, concept: dict):
    out_dir = OUT_DIR / concept["folder"]
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{concept['id']}.png"

    if out_path.exists():
        print(f"  EXISTS: {out_path.name} — skipping")
        return

    print(f"  Generating: {concept['name']}...")

    for model in [PREFERRED_MODEL, FALLBACK_MODEL]:
        try:
            data = try_generate(client, concept, model)
            if data:
                with open(out_path, "wb") as f:
                    f.write(data)
                print(f"  [OK] {out_path.name}  (model: {model})")
                return
        except Exception as e:
            print(f"  [{model} failed] {e}")
            if model == FALLBACK_MODEL:
                print(f"  ERROR: both models failed for {concept['id']}")


# ── Hero character with reference image ──────────────────────────────────────

def generate_hero_from_reference(client):
    """
    Uses gpt-image-1's edit endpoint to generate a marketing image
    referencing the actual L1_3 book cover illustration.
    """
    cover_path = COVERS_DIR / "1_3_The_Fish_in_the_Tank_cover.png"
    if not cover_path.exists():
        print(f"  SKIP reference hero: cover not found at {cover_path}")
        return

    out_dir = OUT_DIR / "characters"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "hero_L1_3_reference_composite.png"

    if out_path.exists():
        print(f"  EXISTS: {out_path.name} — skipping")
        return

    print("  Generating hero reference composite from L1_3 cover...")

    prompt = """
Using the illustration style in this book cover as the sole reference,
create a standalone marketing image of the same girl character — wearing her bright
pink hijab, in her wheelchair — reading an open book joyfully.
She should be centred on a deep indigo background with a warm glow behind her.
Keep exactly the same illustration art style: flat design, simplified features,
small solid black dot eyes, warm brown skin. The mood is proud, joyful, focused.
No book cover text, no level bands — just the character in her illustrated style.
No text in the output image. Square 1:1 format.
""".strip()

    try:
        response = client.images.edit(
            model="gpt-image-1",
            image=open(cover_path, "rb"),
            prompt=prompt,
            size="1024x1024",
        )
        part = response.data[0]
        data = None
        if hasattr(part, "b64_json") and part.b64_json:
            data = base64.b64decode(part.b64_json)
        elif hasattr(part, "url") and part.url:
            import urllib.request
            with urllib.request.urlopen(part.url) as r:
                data = r.read()

        if data:
            with open(out_path, "wb") as f:
                f.write(data)
            print(f"  [OK] {out_path.name}")
        else:
            print("  No image returned from edit endpoint")

    except Exception as e:
        print(f"  Error generating reference composite: {e}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print("MyPhonicsBooks — OpenAI Awareness Image Generator")
    print("=" * 52)

    client = get_client()

    print(f"\nGenerating {len(CONCEPTS)} concept images...")
    print(f"Model preference: {PREFERRED_MODEL} → {FALLBACK_MODEL} fallback\n")

    # Group by folder for progress display
    folders = {}
    for c in CONCEPTS:
        folders.setdefault(c["folder"], []).append(c)

    for folder, concepts in folders.items():
        print(f"\n[{folder.upper()}]")
        for concept in concepts:
            generate_image(client, concept)

    # Special: hero reference composite using the actual book cover
    print("\n[HERO REFERENCE — using book cover as input]")
    generate_hero_from_reference(client)

    print(f"\nAll done. Outputs saved to:\n  {OUT_DIR}")
    print("\nSubfolders:")
    print("  habit/       — 10-minute reading habit visuals")
    print("  gap-impact/  — early gap → later life consequence visuals")
    print("  characters/  — hero character illustrated scenes")
    print("\nNext step: open HTML templates and drop these images as backgrounds.")
    print("Run: python scripts/generate_awareness_images.py")


if __name__ == "__main__":
    main()
