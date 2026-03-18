"""
Regenerate specific images using Google Gemini 2.5 Flash Image.
Uses requests (sync) instead of aiohttp.
Only regenerates images that are MISSING from the output directory.
"""

import os
import base64
import time
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.environ.get("GOOGLE_GEMINI_API_KEY")
BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
OUTPUT_DIR = Path(__file__).parent.parent / "output" / "images"
MAX_RETRIES = 3
BACKOFF_BASE = 5
REQUEST_DELAY = 3

BASE_STYLE = (
    "Whimsical children's book illustration. Hand-drawn cartoon style with "
    "soft watercolour textured backgrounds and clean black-outlined characters. "
    "CRITICAL EYE RULE: Every character (human, animal, everyone) MUST have eyes that are "
    "tiny solid black filled circles like dots drawn with a black marker pen. "
    "NO white around the black, NO iris, NO pupil, NO highlight, NO detail whatsoever. "
    "Just small simple black dots - cute and friendly like a teddy bear's eyes. "
    "Warm, friendly, inviting. Soft pastel backgrounds with pops of bright colour. "
    "Simple rounded shapes, gentle lighting. Professional picture book quality. "
    "No text, words, letters, or numbers in the image."
)


def generate_hero_image(prompt: str) -> bytes | None:
    """Generate a hero reference image (text-to-image, no reference needed)."""
    full_prompt = f"{prompt} {BASE_STYLE}"
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"

    payload = {
        "contents": [{"parts": [{"text": full_prompt}]}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }

    for attempt in range(MAX_RETRIES):
        try:
            resp = requests.post(url, json=payload, timeout=120)
            if resp.status_code == 200:
                result = resp.json()
                candidates = result.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    for part in parts:
                        if "inlineData" in part:
                            return base64.b64decode(part["inlineData"]["data"])
                print(f"    No image data in response")
                return None
            elif resp.status_code == 429:
                wait = BACKOFF_BASE * (2 ** attempt)
                print(f"    Rate limited. Waiting {wait}s...")
                time.sleep(wait)
                continue
            else:
                print(f"    API error {resp.status_code}: {resp.text[:300]}")
                if attempt < MAX_RETRIES - 1:
                    wait = BACKOFF_BASE * (2 ** attempt)
                    print(f"    Retrying in {wait}s...")
                    time.sleep(wait)
                continue
        except Exception as e:
            print(f"    Request error: {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(BACKOFF_BASE)
            continue
    return None


def generate_image(hero_base64: str, prompt: str) -> bytes | None:
    """Generate a scene image using Gemini with hero reference."""
    full_prompt = f"{prompt} {BASE_STYLE}"
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"

    payload = {
        "contents": [{
            "parts": [
                {"inlineData": {"mimeType": "image/png", "data": hero_base64}},
                {"text": full_prompt}
            ]
        }],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }

    for attempt in range(MAX_RETRIES):
        try:
            resp = requests.post(url, json=payload, timeout=120)
            if resp.status_code == 200:
                result = resp.json()
                candidates = result.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    for part in parts:
                        if "inlineData" in part:
                            return base64.b64decode(part["inlineData"]["data"])
                print(f"    No image data in response")
                return None
            elif resp.status_code == 429:
                wait = BACKOFF_BASE * (2 ** attempt)
                print(f"    Rate limited. Waiting {wait}s...")
                time.sleep(wait)
                continue
            else:
                print(f"    API error {resp.status_code}: {resp.text[:300]}")
                if attempt < MAX_RETRIES - 1:
                    wait = BACKOFF_BASE * (2 ** attempt)
                    print(f"    Retrying in {wait}s...")
                    time.sleep(wait)
                continue
        except Exception as e:
            print(f"    Request error: {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(BACKOFF_BASE)
            continue
    return None


def regenerate_book(level_key: str, book_dir_name: str, scenes: list[dict]):
    """Regenerate missing images for a book."""
    book_dir = OUTPUT_DIR / book_dir_name
    hero_path = book_dir / "hero_reference.png"

    if not hero_path.exists():
        print(f"  ERROR: No hero reference at {hero_path}")
        return

    hero_base64 = base64.b64encode(hero_path.read_bytes()).decode("utf-8")
    print(f"  Hero loaded ({len(hero_base64)} chars)")

    for scene in scenes:
        output_path = book_dir / f"{scene['name']}.png"
        if output_path.exists():
            print(f"  [{scene['name']}] Already exists, skipping")
            continue

        print(f"  [{scene['name']}] Generating...")
        image_bytes = generate_image(hero_base64, scene["prompt"])

        if image_bytes:
            output_path.write_bytes(image_bytes)
            size_kb = len(image_bytes) / 1024
            print(f"  [{scene['name']}] Saved ({size_kb:.0f} KB)")
        else:
            print(f"  [{scene['name']}] FAILED")

        time.sleep(REQUEST_DELAY)


if __name__ == "__main__":
    import sys
    import importlib.util

    if not GEMINI_API_KEY:
        print("ERROR: GOOGLE_GEMINI_API_KEY not found in .env")
        sys.exit(1)

    print(f"API Key: {GEMINI_API_KEY[:10]}...{GEMINI_API_KEY[-4:]}")

    # Load HERO_PROMPTS and SCENE_PROMPTS without triggering aiohttp import
    spec_file = Path(__file__).parent / "generate_gemini_images.py"
    source = spec_file.read_text()

    # Extract HERO_PROMPTS
    hero_start = source.index("HERO_PROMPTS = {")
    hero_end = source.index("\nSCENE_PROMPTS = {")
    hero_code = source[hero_start:hero_end]
    hero_ns = {}
    exec(hero_code, {}, hero_ns)
    HERO_PROMPTS = hero_ns["HERO_PROMPTS"]
    print(f"Loaded hero prompts for levels: {list(HERO_PROMPTS.keys())}")

    # Extract SCENE_PROMPTS
    start = source.index("SCENE_PROMPTS = {")
    end = source.index("\n# L2-L6 scene prompts")
    scene_code = source[start:end]
    local_ns = {}
    exec(scene_code, {}, local_ns)
    SCENE_PROMPTS = local_ns["SCENE_PROMPTS"]
    print(f"Loaded scene prompts for levels: {list(SCENE_PROMPTS.keys())}")

    levels_to_regenerate = ["1.1", "1.2", 1]  # L1.1, L1.2, L1.3

    if len(sys.argv) > 1:
        arg = sys.argv[1]
        if "." in arg:
            levels_to_regenerate = [arg]
        elif arg.isdigit():
            levels_to_regenerate = [int(arg)]
        else:
            print("Usage: python regenerate_images.py [1|1.1|1.2]")
            sys.exit(1)

    for level in levels_to_regenerate:
        if level not in SCENE_PROMPTS:
            print(f"No prompts for level {level}")
            continue

        level_str = str(level).replace(".", "_")
        book_dir_name = f"L{level_str}_B1"

        print(f"\n{'='*55}")
        print(f"Level {level}: \"{SCENE_PROMPTS[level]['title']}\"")
        print(f"Dir: {book_dir_name}")
        print(f"{'='*55}")

        # Ensure output directory exists
        book_dir = OUTPUT_DIR / book_dir_name
        book_dir.mkdir(parents=True, exist_ok=True)

        # Generate hero if missing
        hero_path = book_dir / "hero_reference.png"
        if not hero_path.exists() and level in HERO_PROMPTS:
            print(f"  [hero] Generating hero reference...")
            hero_bytes = generate_hero_image(HERO_PROMPTS[level]["description"])
            if hero_bytes:
                hero_path.write_bytes(hero_bytes)
                size_kb = len(hero_bytes) / 1024
                print(f"  [hero] Saved ({size_kb:.0f} KB)")
                time.sleep(REQUEST_DELAY)
            else:
                print(f"  [hero] FAILED - cannot generate scenes without hero")
                continue

        regenerate_book(level, book_dir_name, SCENE_PROMPTS[level]["scenes"])

    print("\nDone!")
