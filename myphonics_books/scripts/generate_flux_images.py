"""
Generate illustrations for pilot books using Flux Kontext Pro via fal.ai.

Uses a hero reference image for character consistency across all pages.
Workflow:
  1. Generate hero reference image (text-to-image via Flux dev)
  2. Upload reference to fal.ai storage
  3. For each page, send reference + scene prompt to Kontext Pro
  4. Download and save results

Usage:
    py -3.12 generate_flux_images.py              # Generate all 6 books
    py -3.12 generate_flux_images.py test          # Test with 1 image
    py -3.12 generate_flux_images.py L1            # Generate 1 specific level
    py -3.12 generate_flux_images.py L1 hero       # Regenerate hero image only
"""

import os
import sys
import time
import json
import httpx
import base64
import fal_client
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

FAL_KEY = os.environ.get("FAL_KEY")
if FAL_KEY:
    os.environ["FAL_KEY"] = FAL_KEY  # fal_client reads from env

OUTPUT_DIR = Path(__file__).parent / "output" / "images"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Rate limiting
REQUEST_DELAY = 2  # seconds between requests


# ─── Style & Characters ─────────────────────────────────────────

BASE_STYLE = (
    "Whimsical children's book illustration. Hand-drawn cartoon style with "
    "soft watercolour textured backgrounds and clean black-outlined characters. "
    "Small simple oval eyes with solid dark fill, no detailed irises or highlights. "
    "Warm, friendly, inviting. Soft pastel backgrounds with pops of bright colour. "
    "Simple rounded shapes, gentle lighting. Professional picture book quality. "
    "No text, words, letters, or numbers in the image."
)

# Detailed character descriptions for hero image generation
HERO_PROMPTS = {
    1: {
        "description": (
            "A cartoon girl character, about 5 years old, with dark brown skin and "
            "short curly black hair. She wears a bright red jumper, dark blue denim "
            "dungarees, and blue wellies (wellington boots). She has small simple "
            "oval eyes with solid dark fill (no detailed irises or highlights), "
            "a cheerful smile, and rosy cheeks. She is standing in a sunny "
            "garden, facing the viewer, full body visible from head to toe."
        ),
        "short": "the girl in the red jumper and blue wellies",
    },
    2: {
        "description": (
            "A cartoon girl character, about 6 years old, wearing a soft lilac hijab "
            "and a bright yellow raincoat over a purple dress. She has warm brown skin, "
            "small simple oval eyes with solid dark fill (no detailed irises or highlights), "
            "and a curious smile. She wears red wellies. She is "
            "standing on a beach, facing the viewer, full body visible from head to toe."
        ),
        "short": "the girl in the yellow raincoat and lilac hijab",
    },
    3: {
        "description": (
            "A cartoon boy character, about 7 years old, with messy blond hair poking "
            "out from under a green cycling helmet. He wears a green cycling jersey "
            "with a white stripe, black shorts, and white trainers. He has light skin, "
            "freckles, small simple oval eyes with solid dark fill (no detailed irises "
            "or highlights), and an excited grin. He is standing next to a bicycle, "
            "facing the viewer, full body visible from head to toe."
        ),
        "short": "the boy in the green cycling jersey and helmet",
    },
    4: {
        "description": (
            "A cartoon girl character, about 7 years old, with long dark brown hair in "
            "a thick plait over one shoulder. She wears an orange hoodie, dark grey "
            "leggings, and brown muddy boots. She has olive skin, small simple oval "
            "eyes with solid dark fill (no detailed irises or highlights), and "
            "a determined expression. She is standing on a village lane, facing the "
            "viewer, full body visible from head to toe."
        ),
        "short": "the girl in the orange hoodie with the plait",
    },
    5: {
        "description": (
            "A cartoon boy character, about 8 years old, with short curly brown hair. "
            "He wears a blue fleece jacket over a white t-shirt, khaki trousers, and "
            "brown walking boots. He has light brown skin, small simple oval eyes with "
            "solid dark fill (no detailed irises or highlights), and a calm "
            "thoughtful expression. He is standing on a cliff path overlooking the sea, "
            "facing the viewer, full body visible from head to toe."
        ),
        "short": "the boy in the blue fleece",
    },
    6: {
        "description": (
            "A cartoon girl character, about 8 years old, with a neat black bob haircut. "
            "She wears a teal cardigan over a white blouse, a dark blue pleated skirt, "
            "white socks, and black shoes. She has a woven sun hat. She has East Asian "
            "features, small simple oval eyes with solid dark fill (no detailed irises "
            "or highlights), and a gentle curious expression. She is standing "
            "in a garden, facing the viewer, full body visible from head to toe."
        ),
        "short": "the girl in the teal cardigan and sun hat",
    },
}


# ─── Scene Prompts per Level ────────────────────────────────────

SCENE_PROMPTS = {
    1: {
        "title": "Is It a Bug?",
        # KEY OBJECT: "a large pale cream spiral shell with pink tones" — use this EXACT phrase everywhere
        # SETTING: "a sunny green garden with colourful flowers and a muddy patch of thick brown mud"
        "scenes": [
            {
                # Cover — shows the climax (child with shell)
                "name": "cover",
                "prompt": "Place {char} kneeling in garden mud, holding up a large pale cream spiral shell with pink tones, amazed joyful expression. Muddy hands and dungarees. A sunny green garden with colourful flowers behind her. Small simple oval eyes with solid dark fill. Portrait format, 3:4 aspect ratio.",
                "size": {"width": 768, "height": 1024},
            },
            {
                # Page 1: "I dig in the mud. Dig, dig, dig!"
                "name": "page1",
                "prompt": "Show {char} digging energetically in thick brown mud with a small spade in a sunny green garden. Mud flying up, focused happy expression. Colourful flowers and green grass around the muddy patch. Small simple oval eyes with solid dark fill. Landscape format.",
                "size": {"width": 1024, "height": 768},
            },
            {
                # Page 2: "I hit a thing! Is it a bug?"
                "name": "page2",
                "prompt": "Show {char} pausing mid-dig in the mud, looking very surprised and curious. She has just hit something hard buried in the thick brown mud. A mysterious round bump is poking slightly out of the mud. Same sunny green garden with colourful flowers. Small simple oval eyes with solid dark fill. Landscape format.",
                "size": {"width": 1024, "height": 768},
            },
            {
                # Page 3: "It is not a bug. I tug at it."
                "name": "page3",
                "prompt": "Show {char} gripping and tugging with both hands at a mysterious object partially sticking out of the thick brown mud. The top of a large pale cream spiral shell is visible poking out of the mud. She is pulling hard with a determined expression. Same sunny green garden with colourful flowers. Small simple oval eyes with solid dark fill. Landscape format.",
                "size": {"width": 1024, "height": 768},
            },
            {
                # Page 4: "Tug, tug, tug! It is big!"
                "name": "page4",
                "prompt": "Show {char} leaning right back, tugging very hard with both hands. A large pale cream spiral shell with pink tones is halfway out of the thick brown mud, almost free. Mud splashing dramatically. She looks excited and amazed at how big it is. Same sunny green garden. Small simple oval eyes with solid dark fill. Landscape format.",
                "size": {"width": 1024, "height": 768},
            },
            {
                # Page 5: "It is a shell! A big, big shell!"
                "name": "page5",
                "prompt": "Show {char} holding up a large pale cream spiral shell with pink tones proudly above her head with both hands. Huge delighted smile. Mud all over her red jumper and blue dungarees. Same sunny green garden with colourful flowers. Small simple oval eyes with solid dark fill. Landscape format.",
                "size": {"width": 1024, "height": 768},
            },
            {
                # Page 6: "I run to Mum. I got a big shell!"
                "name": "page6",
                "prompt": "Show {char} running happily towards a smiling woman (her mum) near a garden shed, proudly holding up the large pale cream spiral shell with pink tones. The mum has open welcoming arms. Warm sunny green garden atmosphere with colourful flowers. Small simple oval eyes with solid dark fill. Landscape format.",
                "size": {"width": 1024, "height": 768},
            },
        ],
    },
}
# L2-L6 scene prompts will be added when those levels are ready


# ─── fal.ai API Functions ───────────────────────────────────────

def generate_hero_image(level: int) -> Path | None:
    """Generate a hero reference image for the character using Flux text-to-image."""
    hero = HERO_PROMPTS.get(level)
    if not hero:
        print(f"  No hero prompt for level {level}")
        return None

    book_dir = OUTPUT_DIR / f"L{level}_B1"
    book_dir.mkdir(parents=True, exist_ok=True)
    hero_path = book_dir / "hero_reference.png"

    full_prompt = f"{hero['description']} {BASE_STYLE}"

    print(f"  [hero] Generating reference image...")
    try:
        result = fal_client.subscribe(
            "fal-ai/flux/dev",
            arguments={
                "prompt": full_prompt,
                "image_size": {"width": 768, "height": 1024},
                "num_images": 1,
                "output_format": "png",
                "guidance_scale": 4.0,
                "num_inference_steps": 28,
            },
        )

        if result and "images" in result and len(result["images"]) > 0:
            image_url = result["images"][0]["url"]
            # Download the image
            response = httpx.get(image_url)
            if response.status_code == 200:
                hero_path.write_bytes(response.content)
                size_kb = len(response.content) / 1024
                print(f"  [hero] Saved ({size_kb:.0f} KB) -> {hero_path}")
                return hero_path
            else:
                print(f"  [hero] Download failed: {response.status_code}")
                return None
        else:
            print(f"  [hero] No image in response: {result}")
            return None
    except Exception as e:
        print(f"  [hero] Error: {e}")
        return None


def upload_reference(image_path: Path) -> str | None:
    """Upload a local image to fal.ai storage, return the URL."""
    try:
        url = fal_client.upload_file(str(image_path))
        print(f"  [upload] Reference uploaded -> {url[:60]}...")
        return url
    except Exception as e:
        print(f"  [upload] Error: {e}")
        return None


def generate_scene_image(
    reference_url: str, prompt: str, size: dict, char_short: str
) -> bytes | None:
    """Generate a scene image using Kontext Pro with character reference."""

    # Replace {char} placeholder with short character description
    full_prompt = prompt.replace("{char}", char_short)
    full_prompt += f" {BASE_STYLE}"

    try:
        result = fal_client.subscribe(
            "fal-ai/flux-pro/kontext",
            arguments={
                "prompt": full_prompt,
                "image_url": reference_url,
                "num_images": 1,
                "output_format": "png",
                "guidance_scale": 3.5,
                "safety_tolerance": "5",
            },
        )

        if result and "images" in result and len(result["images"]) > 0:
            image_url = result["images"][0]["url"]
            response = httpx.get(image_url)
            if response.status_code == 200:
                return response.content
            else:
                print(f"    Download failed: {response.status_code}")
                return None
        else:
            print(f"    No image in response: {json.dumps(result, indent=2)[:300]}")
            return None
    except Exception as e:
        print(f"    Error: {e}")
        return None


# ─── Main Generation Functions ──────────────────────────────────

def generate_book_images(level: int, hero_only: bool = False):
    """Generate all images for one pilot book with character consistency."""

    if level not in SCENE_PROMPTS:
        print(f"No scene prompts defined for level {level}")
        return []

    if level not in HERO_PROMPTS:
        print(f"No hero prompt defined for level {level}")
        return []

    book = SCENE_PROMPTS[level]
    hero = HERO_PROMPTS[level]
    book_dir = OUTPUT_DIR / f"L{level}_B1"
    book_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n{'='*55}")
    print(f"Level {level}: \"{book['title']}\"")
    print(f"Output: {book_dir}")
    print(f"Scenes: {len(book['scenes'])}")
    print(f"{'='*55}")

    # Step 1: Generate or load hero reference image
    hero_path = book_dir / "hero_reference.png"
    if not hero_path.exists() or hero_only:
        hero_path_result = generate_hero_image(level)
        if not hero_path_result:
            print("FATAL: Could not generate hero reference image")
            return []
        hero_path = hero_path_result

    if hero_only:
        print("Hero-only mode — stopping here.")
        return [str(hero_path)]

    # Step 2: Upload reference to fal.ai storage
    reference_url = upload_reference(hero_path)
    if not reference_url:
        print("FATAL: Could not upload reference image")
        return []

    # Step 3: Generate each scene
    generated = []
    for scene in book["scenes"]:
        output_path = book_dir / f"{scene['name']}.png"

        # Skip if already exists
        if output_path.exists():
            print(f"  [{scene['name']}] Already exists, skipping")
            generated.append(str(output_path))
            continue

        print(f"  [{scene['name']}] Generating...")

        image_bytes = generate_scene_image(
            reference_url,
            scene["prompt"],
            scene["size"],
            hero["short"],
        )

        if image_bytes:
            output_path.write_bytes(image_bytes)
            size_kb = len(image_bytes) / 1024
            print(f"  [{scene['name']}] Saved ({size_kb:.0f} KB)")
            generated.append(str(output_path))
        else:
            print(f"  [{scene['name']}] FAILED")

        time.sleep(REQUEST_DELAY)

    print(f"\nGenerated {len(generated)}/{len(book['scenes'])} images for Level {level}")
    return generated


def test_single():
    """Quick test — generate just the hero reference for L1."""
    print("Testing Flux via fal.ai...")
    if not FAL_KEY:
        print("ERROR: FAL_KEY not found in .env")
        return

    print(f"FAL_KEY: {FAL_KEY[:12]}...{FAL_KEY[-4:]}")

    hero_path = generate_hero_image(1)
    if hero_path:
        print(f"\nSuccess! Hero image: {hero_path}")
    else:
        print("\nFAILED")


# ─── Entry Point ────────────────────────────────────────────────

if __name__ == "__main__":
    if not FAL_KEY:
        print("ERROR: FAL_KEY not found in .env")
        print("Set FAL_KEY=your_key in .env")
        sys.exit(1)

    if len(sys.argv) > 1:
        arg = sys.argv[1].lower()
        if arg == "test":
            test_single()
        elif arg.startswith("l") and arg[1:].isdigit():
            level = int(arg[1:])
            hero_only = len(sys.argv) > 2 and sys.argv[2].lower() == "hero"
            generate_book_images(level, hero_only=hero_only)
        else:
            print("Usage: py -3.12 generate_flux_images.py [test|L1|L2|...|L6] [hero]")
    else:
        for level in SCENE_PROMPTS:
            generate_book_images(level)
