"""
Generate Sound Spotlight Images using Gemini
=============================================
Creates clear, educational illustrations for Sound Spotlight pages.
Each image is a simple, unambiguous illustration of a word with the
focus sound visually highlighted (e.g., arrow pointing to the fin on a fish).

Style: Simple flat educational illustration — NOT artsy photography.
Think flashcard quality: child sees image, immediately knows the word.

Usage:
    py -3.12 scripts/generate_spotlight_images.py              # Generate all missing
    py -3.12 scripts/generate_spotlight_images.py sh nk         # Specific graphemes
    py -3.12 scripts/generate_spotlight_images.py --check       # Report missing
    py -3.12 scripts/generate_spotlight_images.py --regen sh    # Force regenerate

Requires: GOOGLE_GEMINI_API_KEY in .env
"""

import asyncio
import aiohttp
import base64
import json
import os
import sys
import time
from pathlib import Path

# Load env
from dotenv import load_dotenv
load_dotenv()

GEMINI_API_KEY = os.environ.get("GOOGLE_GEMINI_API_KEY")
BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

PROJECT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_DIR / "data"
PHOTOS_DIR = PROJECT_DIR / "assets" / "photos"

# Rate limiting for Gemini
REQUEST_DELAY = 4  # seconds between requests
MAX_RETRIES = 3
BACKOFF_BASE = 10

# ─── Image Generation Style ────────────────────────────────────

SPOTLIGHT_STYLE = (
    "Simple, clear educational flashcard illustration for young children aged 4-6. "
    "Flat cartoon style with bold black outlines and bright solid colours. "
    "White or very light plain background. The subject should be large, centred, "
    "and immediately recognisable — a child should look at this and instantly "
    "know what it is. NO text, NO letters, NO words, NO labels in the image. "
    "NO photographic style. NO complex backgrounds. NO artistic effects. "
    "Think: the clearest, simplest flashcard illustration possible. "
    "Clean, friendly, educational. Like a Twinkl or Sparklebox resource."
)


def get_image_prompt(word, grapheme):
    """Generate a clear, educational prompt for the word."""
    # Special prompts for words that need extra clarity
    CUSTOM_PROMPTS = {
        "sit": "A happy cartoon child sitting cross-legged on the floor, simple and clear",
        "sun": "A bright yellow cartoon sun with simple rays, large and centred",
        "hat": "A colourful sun hat, large and clear, front view",
        "cat": "A friendly cartoon tabby cat sitting, facing viewer, simple and clear",
        "dog": "A friendly cartoon brown puppy, sitting, facing viewer, tail wagging",
        "bus": "A bright red double-decker bus, side view, simple cartoon style",
        "cup": "A simple cartoon teacup with a handle, colourful, large and centred",
        "bed": "A simple cartoon bed with a pillow and colourful duvet, side view",
        "hen": "A cartoon brown hen standing, side view, simple and friendly",
        "fox": "A cartoon red fox standing, side view, bushy tail, simple",
        "box": "A simple open cardboard box, brown, large and centred",
        "jam": "A glass jar of strawberry jam with a red label, simple and clear",
        "net": "A simple fishing net with a long handle, clear and recognisable",
        "web": "A simple cartoon spider web with a tiny spider, clear design",
        "wig": "A colourful curly wig on a stand, bright and simple",
        "yak": "A cartoon yak (large hairy bovine), standing side view, friendly",
        "zip": "A jacket zipper pulled halfway up, close-up, clear and simple",
        "bee": "A cartoon bumblebee with black and yellow stripes, flying, simple",
        "moon": "A large crescent moon with a happy face, night sky, simple",
        "car": "A simple cartoon red car, side view, round wheels, friendly",
        "bird": "A cartoon robin bird perched on a branch, simple and colourful",
        "toy": "A colourful cartoon teddy bear, sitting, friendly and simple",
        "rain": "Simple cartoon rain drops falling from a grey cloud, clear",
        "boat": "A simple cartoon sailing boat on blue water, side view",
        "cake": "A birthday cake with candles and icing, simple cartoon, front view",
        "bike": "A simple cartoon bicycle, side view, bright colours",
        "kite": "A colourful diamond kite flying with a tail, simple cartoon",
        "bone": "A simple cartoon dog bone, white with round ends, large",
        "coin": "A shiny gold coin, front view, simple cartoon",
        "fire": "A simple cartoon campfire with orange flames and logs",
        "door": "A simple cartoon wooden door with a round handle, front view",
        "phone": "A simple cartoon telephone, bright coloured, clear",
        "knee": "A cartoon child pointing to their knee, simple and educational",
        "train": "A simple cartoon steam train, side view, bright colours, puffing smoke",
        "shell": "A simple cartoon seashell, spiral shape, pastel colours, large",
        "ship": "A simple cartoon sailing ship on the sea, side view",
        "fish": "A cartoon goldfish, orange, swimming, simple and clear, side view",
        "shed": "A small cartoon garden shed, front view, simple",
        "shop": "A small cartoon shop with an awning, front view, simple",
        "ring": "A simple cartoon gold ring, large and centred",
        "king": "A cartoon king wearing a crown, friendly face, upper body",
        "sink": "A simple cartoon kitchen sink with a tap, front view",
        "tank": "A cartoon fish tank (aquarium) with a fish inside, clear glass",
        "duck": "A cartoon yellow rubber duck, simple and cute, front view",
        "sock": "A colourful cartoon striped sock, large, simple",
        "lock": "A simple cartoon padlock, gold colour, front view",
        "bell": "A simple cartoon golden bell, large and centred",
        "hill": "A simple green cartoon hill with grass, clear shape",
        "bull": "A cartoon brown bull standing, side view, strong and friendly",
        "buzz": "A cartoon bee buzzing with motion lines, simple and clear",
        "bath": "A cartoon bathtub with bubbles, simple side view",
        "leaf": "A single green cartoon leaf, large and clear, simple veins",
        "snail": "A cartoon snail with a spiral shell, simple and cute",
        "goat": "A cartoon white goat standing, side view, simple and friendly",
        "pie": "A cartoon fruit pie, golden crust, simple top view",
        "hare": "A cartoon brown hare sitting, long ears, simple and clear",
        "table": "A simple cartoon wooden table, front view, four legs",
        "star": "A simple five-pointed yellow star, large, cartoon style",
        "glue": "A cartoon glue stick, upright, simple and recognisable",
        "shore": "A simple cartoon beach shore with sand and gentle waves",
        "ear": "A cartoon human ear, close-up, simple and clear, educational",
        "dolphin": "A cartoon dolphin jumping out of water, simple and friendly",
        "station": "A simple cartoon train station with a platform and sign",
        "famous": "A cartoon star with sunglasses and a cape, fun and simple",
        "table": "A simple cartoon dining table with four legs, wooden, clear",
    }

    if word in CUSTOM_PROMPTS:
        return f"{SPOTLIGHT_STYLE}\n\nSubject: {CUSTOM_PROMPTS[word]}"

    # Default: just describe the word clearly
    return (
        f"{SPOTLIGHT_STYLE}\n\n"
        f"Subject: A clear, simple cartoon illustration of '{word}'. "
        f"The image should be immediately recognisable as '{word}' to a young child."
    )


async def generate_image(session, word, grapheme, force=False):
    """Generate a single spotlight image using Gemini."""
    safe_grapheme = grapheme.replace("-", "_")
    output_dir = PHOTOS_DIR / safe_grapheme
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{word}.jpg"

    if output_path.exists() and not force:
        return "skipped"

    if not GEMINI_API_KEY:
        print("  ERROR: GOOGLE_GEMINI_API_KEY not set")
        return "failed"

    prompt = get_image_prompt(word, grapheme)

    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"

    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"],
        }
    }

    for attempt in range(MAX_RETRIES):
        try:
            async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=60)) as resp:
                if resp.status == 429:
                    wait = BACKOFF_BASE * (2 ** attempt)
                    print(f"    Rate limited, waiting {wait}s...")
                    await asyncio.sleep(wait)
                    continue

                if resp.status != 200:
                    error_text = await resp.text()
                    print(f"    ERROR {resp.status}: {error_text[:200]}")
                    if attempt < MAX_RETRIES - 1:
                        await asyncio.sleep(BACKOFF_BASE)
                        continue
                    return "failed"

                data = await resp.json()

                # Extract image from response
                candidates = data.get("candidates", [])
                if not candidates:
                    print(f"    No candidates in response")
                    return "failed"

                parts = candidates[0].get("content", {}).get("parts", [])
                for part in parts:
                    if "inlineData" in part:
                        img_data = part["inlineData"]["data"]
                        img_bytes = base64.b64decode(img_data)

                        output_path.write_bytes(img_bytes)
                        return "downloaded"

                print(f"    No image in response parts")
                return "failed"

        except asyncio.TimeoutError:
            print(f"    Timeout (attempt {attempt + 1}/{MAX_RETRIES})")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(BACKOFF_BASE)
        except Exception as e:
            print(f"    ERROR: {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(BACKOFF_BASE)

    return "failed"


def load_spotlight_words():
    """Load the spotlight words JSON."""
    with open(DATA_DIR / "spotlight_words.json") as f:
        data = json.load(f)
    return {k: v for k, v in data.items() if not k.startswith("_")}


def get_photo_path(grapheme, word):
    """Return the expected photo file path."""
    safe_grapheme = grapheme.replace("-", "_")
    return PHOTOS_DIR / safe_grapheme / f"{word}.jpg"


def check_missing():
    """Report which images are missing."""
    data = load_spotlight_words()
    total = 0
    missing = 0
    present = 0

    print("=" * 60)
    print("SPOTLIGHT IMAGES STATUS")
    print("=" * 60)

    for grapheme, info in sorted(data.items()):
        words = info["words"]
        total += len(words)
        grapheme_missing = []

        for entry in words:
            path = get_photo_path(grapheme, entry["word"])
            if path.exists():
                present += 1
            else:
                missing += 1
                grapheme_missing.append(entry["word"])

        if grapheme_missing:
            print(f"  {grapheme:>6}: MISSING {', '.join(grapheme_missing)}")
        else:
            print(f"  {grapheme:>6}: OK ({len(words)} images)")

    print(f"\n  Total: {total} | Present: {present} | Missing: {missing}")
    return missing


async def generate_grapheme_images(grapheme, word_list, force=False):
    """Generate images for all words under a grapheme."""
    downloaded = 0
    skipped = 0
    failed = 0

    async with aiohttp.ClientSession() as session:
        for entry in word_list:
            word = entry["word"]
            print(f"  [{grapheme}] {word}...", end=" ", flush=True)

            result = await generate_image(session, word, grapheme, force)
            print(result)

            if result == "downloaded":
                downloaded += 1
            elif result == "skipped":
                skipped += 1
            else:
                failed += 1

            if result == "downloaded":
                await asyncio.sleep(REQUEST_DELAY)

    return downloaded, skipped, failed


async def main():
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    flags = [a for a in sys.argv[1:] if a.startswith("-")]

    if "--check" in flags:
        check_missing()
        return

    force = "--regen" in flags

    if not GEMINI_API_KEY:
        print("ERROR: Set GOOGLE_GEMINI_API_KEY in .env")
        sys.exit(1)

    data = load_spotlight_words()

    # Filter to specific graphemes if provided
    if args:
        graphemes = {g: data[g] for g in args if g in data}
        if not graphemes:
            print(f"No matching graphemes: {args}")
            print(f"Available: {', '.join(sorted(data.keys()))}")
            sys.exit(1)
    else:
        graphemes = data

    print("=" * 60)
    print("GENERATING SPOTLIGHT IMAGES (Gemini)")
    print("=" * 60)

    total_downloaded = 0
    total_skipped = 0
    total_failed = 0

    for grapheme in sorted(graphemes.keys()):
        info = graphemes[grapheme]
        print(f"\n[{grapheme}] (Level {info['decodable_at']})")

        d, s, f = await generate_grapheme_images(
            grapheme, info["words"], force
        )
        total_downloaded += d
        total_skipped += s
        total_failed += f

    print(f"\n{'=' * 60}")
    print(f"DONE: {total_downloaded} generated, {total_skipped} skipped, {total_failed} failed")


if __name__ == "__main__":
    asyncio.run(main())
