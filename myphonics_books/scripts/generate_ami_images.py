"""
Generate illustrations for the Ami Gift Book.

SINGLE HERO INJECTION: Ami character is generated as hero reference,
then injected into every scene.

Usage:
    python generate_ami_images.py              # Generate all images
    python generate_ami_images.py hero         # Generate hero reference only
    python generate_ami_images.py scenes       # Generate scenes only (hero must exist)
    python generate_ami_images.py cover        # Generate cover only
"""

import asyncio
import aiohttp
import os
import base64
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.environ.get("GOOGLE_GEMINI_API_KEY")
BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
OUTPUT_DIR = Path(__file__).parent.parent / "output" / "images" / "ami_book"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Rate limiting
REQUEST_DELAY = 4  # seconds between requests
MAX_RETRIES = 3
BACKOFF_BASE = 5

# ─── Style ────────────────────────────────────────────────────────

BASE_STYLE = (
    "Beautiful children's book illustration with a semi-realistic soft painted style — "
    "more realistic than cartoon but still warm and storybook-like. "
    "Soft watercolour textured backgrounds, gentle warm lighting, rich colours. "
    "ABSOLUTELY CRITICAL EYE RULE — THIS IS THE MOST IMPORTANT INSTRUCTION: "
    "Every single character — ALL people — MUST have eyes drawn as "
    "small cute curved slit lines, like happy closed-eye smiling. Two little curved lines "
    "like upside-down smiles. NO open eyes. NO eyeballs. NO iris. NO pupils. NO white sclera. "
    "NO detailed eyes whatsoever. Just simple cute curved slit lines — like the Japanese ^_^ emoticon eyes. "
    "This is a strict religious and artistic requirement — DO NOT show open eyes on ANY character. "
    "Professional picture book quality. Warm and dignified. "
    "No text, words, letters, or numbers in the image."
)

# ─── Hero Prompt ─────────────────────────────────────────────────

HERO_AMI = {
    "name": "Ami",
    "filename": "hero_ami.png",
    "description": (
        "A cartoon Pakistani Muslim woman, about 55-60 years old. NOT ancient, NOT frail — she is active and strong. "
        "DARK brown skin — darker Pakistani skin tone, like deep warm brown. NOT light, NOT medium. Genuinely dark brown. "
        "Round, warm face with soft features and a gentle loving smile. Minimal wrinkles — she looks well for her age. "
        "Her hair is DARK BROWN — rich dark brown like chocolate. NOT grey, NOT white, NOT silver, NOT greyish. "
        "There is absolutely ZERO grey in her hair. It is dark brown, period. "
        "CRITICAL EYE RULE: Her eyes are small cute CLOSED slit lines — like ^_^ emoticon. "
        "Two tiny curved lines. NO open eyes, NO eyeballs, NO iris, NO pupils, NO whites showing. "
        "Just simple cute closed curved lines for eyes. "
        "She wears a beautiful patterned floral dupatta/hijab — dark fabric (dark green/teal) covered with small "
        "white and yellow flower patterns, with an orange/brown geometric border at the edges. "
        "The dupatta is loosely draped around her head and over her shoulders. "
        "Underneath she wears a long teal/blue kameez (tunic dress) that reaches past her knees, "
        "comfortable and modest. Slightly plump, warm motherly build. "
        "Standing in a relaxed natural pose, facing the viewer, full body visible from head to toes. "
        "Warm approachable presence — the kind of woman who always has food ready for you. "
        "Plain light warm cream background (no scenery, no objects, no patterns)."
    ),
}

# ─── Scene Prompts ────────────────────────────────────────────────
# REFERENCE IMAGE 1 = Ami
# Only Ami appears in all images. Other characters are generic.

SCENE_PROMPTS = [
    {
        "name": "cover",
        "prompt": (
            "Show the elderly woman from REFERENCE IMAGE 1 in a warm portrait-style image. "
            "She is smiling gently, hands clasped together or holding a cup of chai. "
            "MUST have cute closed slit eyes — curved lines like ^_^ — NO open eyes. "
            "Warm golden light surrounds her. Soft teal and amber tones in the background. "
            "Dignified, loving, and beautiful. She is the heart of the family. "
            "Same character, same patterned floral dupatta, same teal kameez as reference. "
            "Portrait format. Only this one character."
        ),
    },
    {
        "name": "page1",
        "prompt": (
            "Show TWO characters in a modern airport arrivals hall, standing with a GAP between them — NOT touching: "
            "1) The woman from REFERENCE IMAGE 1 on the left, pulling a small suitcase, smiling. "
            "2) A young man on the right — light skin, very short dark buzz-cut hair, DARK FULL BEARD, "
            "slim/lean build, wearing a black jumper. He is waving or gesturing a greeting. "
            "There is clear SPACE between them. They are NOT touching, NOT holding hands, NOT hugging. "
            "Warm evening light. Desert city through windows. "
            "BOTH characters MUST have CLOSED slit eyes ^_^ — NO open eyes, NO eyeballs. "
            "Same floral dupatta and teal kameez as reference. Landscape format. ONLY these two people."
        ),
    },
    {
        "name": "page2",
        "prompt": (
            "Show the elderly woman from REFERENCE IMAGE 1 standing at a counter or table, "
            "neatly folding freshly laundered clothes into perfect piles. "
            "A drying rack with hanging clothes behind her. Warm cosy domestic interior. "
            "She looks content and focused, in her element. "
            "MUST have cute closed slit eyes ^_^ — NO open eyes. "
            "Same patterned floral dupatta and teal kameez as reference. "
            "Same character as reference. Landscape format. Only this one character."
        ),
    },
    {
        "name": "page3",
        "prompt": (
            "Show the elderly woman from REFERENCE IMAGE 1 cooking in a kitchen. "
            "Steam rising from a large pot of daal, roti cooking on a flat tawa/pan, "
            "bowls of spices and ingredients around her. She looks happy and focused. "
            "Warm golden kitchen light, rich warm colours. Smells delicious. "
            "MUST have cute closed slit eyes ^_^ — NO open eyes. "
            "Same patterned floral dupatta and teal kameez as reference. "
            "Same character as reference. Landscape format. Only this one character."
        ),
    },
    {
        "name": "page4",
        "prompt": (
            "Show TWO characters sitting at a small kitchen table in the early morning: "
            "1) The elderly woman from REFERENCE IMAGE 1, same floral dupatta and teal kameez. "
            "2) A young man — light skin, very short dark BUZZ-CUT hair, DARK FULL BEARD, "
            "slim/lean build, wearing a dark jumper. "
            "Dark outside the window, soft warm kitchen light inside. "
            "Dates, water, and paratha on the table. Quiet intimate Suhoor conversation. "
            "A clock showing very early hours. Peaceful, special moment. "
            "BOTH characters MUST have cute closed slit eyes ^_^ — NO open eyes. "
            "Same character as reference. Landscape format. ONLY these two people."
        ),
    },
    {
        "name": "page5",
        "prompt": (
            "Show the elderly woman from REFERENCE IMAGE 1 standing proudly behind a magnificent "
            "iftar spread on a big table. Samosas, pakoras, dates, fruit chaat, drinks, daal, rice — "
            "the table is completely full of food, overflowing with dishes. "
            "Warm golden evening light. She looks proud and satisfied with her work. "
            "MUST have cute closed slit eyes ^_^ — NO open eyes. "
            "Same patterned floral dupatta and teal kameez as reference. "
            "Same character as reference. Landscape format. Only this one character."
        ),
    },
    {
        "name": "page6",
        "prompt": (
            "Show the elderly woman from REFERENCE IMAGE 1 laughing joyfully in a living room. "
            "She is clapping her hands or pointing playfully. "
            "The scene is fun and chaotic — cushions slightly askew, someone has been running around. "
            "She has the biggest happiest laugh on her face. Pure joy. "
            "MUST have cute closed slit eyes ^_^ — NO open eyes. "
            "Same patterned floral dupatta and teal kameez as reference. "
            "Same character as reference. Landscape format. Only this one character."
        ),
    },
    {
        "name": "page7",
        "prompt": (
            "Show the woman from REFERENCE IMAGE 1 sitting on a sofa with one finger gently raised. "
            "A younger man (light skin, buzz-cut dark hair, dark full beard, slim build, black clothes) "
            "sitting in a SEPARATE armchair across from her, NOT touching, with a gap between them. "
            "They are NOT hugging, NOT touching, NOT side by side. Separate seats. "
            "A Quran on the side table. Cosy warm living room. "
            "ABSOLUTELY CRITICAL: BOTH characters have CLOSED eyes — tiny curved slit lines like ^_^. "
            "The woman's eyes are closed happy slits. The man's eyes are closed happy slits. "
            "NO eyeballs. NO open eyes. NO iris. NO pupils. NO whites. ONLY curved closed lines. "
            "Same floral dupatta and teal kameez as reference. Landscape format."
        ),
    },
    {
        "name": "page8",
        "prompt": (
            "Show the elderly woman from REFERENCE IMAGE 1 walking along a sunny Middle Eastern street, "
            "carrying a small shopping bag with groceries (milk carton visible). "
            "Bright sunshine, sandy-coloured buildings, a small corner shop/baqala behind her, "
            "palm trees, warm Qatar street scene. She walks with determination despite the heat. "
            "MUST have cute closed slit eyes ^_^ — NO open eyes. "
            "Same patterned floral dupatta and teal kameez as reference. "
            "Same character as reference. Landscape format. Only this one character."
        ),
    },
    {
        "name": "page9",
        "prompt": (
            "Show the elderly woman from REFERENCE IMAGE 1 in a kitchen, handing a glass of water "
            "towards the viewer (hand extended). Fridge behind her with containers of food visible. "
            "She has a caring but no-nonsense expression — the face of 'drink your water'. "
            "Warm kitchen scene, practical and loving. "
            "MUST have cute closed slit eyes ^_^ — NO open eyes. "
            "Same patterned floral dupatta and teal kameez as reference. "
            "Same character as reference. Landscape format. Only this one character."
        ),
    },
    {
        "name": "page10",
        "prompt": (
            "Show the elderly woman from REFERENCE IMAGE 1 in a living room, tidying up — "
            "folding a blanket, baby toys nearby on the floor, a cup of chai sitting untouched "
            "on a side table (she's been too busy to drink it). Her hands always busy. "
            "The scene shows all the little things she does — domesticity and love. "
            "MUST have cute closed slit eyes ^_^ — NO open eyes. "
            "Same patterned floral dupatta and teal kameez as reference. "
            "Same character as reference. Landscape format. Only this one character."
        ),
    },
    {
        "name": "page11",
        "prompt": (
            "Show the elderly woman from REFERENCE IMAGE 1 cooking at a stove in a London kitchen. "
            "Through the window behind her, a classic London scene — red-brick terraced houses, "
            "maybe a red bus or grey London sky. She looks completely at home, same warm expression. "
            "Same cooking, same love, different city. "
            "MUST have cute closed slit eyes ^_^ — NO open eyes. "
            "Same patterned floral dupatta and teal kameez as reference. "
            "Same character as reference. Landscape format. Only this one character."
        ),
    },
    {
        "name": "page12",
        "prompt": (
            "Beautiful warm close-up portrait of the elderly woman from REFERENCE IMAGE 1. "
            "The gentlest, most peaceful smile. Soft golden light around her. "
            "She is holding a cup of chai in both hands, finally sitting down for herself. "
            "Peaceful, dignified, loved. The most beautiful portrait — showing the warmth "
            "and strength of a woman who gives everything to her family. "
            "MUST have cute closed slit eyes ^_^ — NO open eyes. "
            "Same patterned floral dupatta and teal kameez as reference. "
            "Same character as reference. Portrait format. Only this one character."
        ),
    },
]


# ─── Gemini API Functions ─────────────────────────────────────────

async def generate_hero(session, hero_info):
    """Generate a hero reference image using Gemini text-to-image."""
    hero_path = OUTPUT_DIR / hero_info["filename"]
    full_prompt = f"{hero_info['description']} {BASE_STYLE}"

    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": full_prompt}]}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }

    print(f"  [{hero_info['name']}] Generating hero reference...")

    for attempt in range(MAX_RETRIES):
        try:
            async with session.post(url, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    candidates = result.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        for part in parts:
                            if "inlineData" in part:
                                image_data = base64.b64decode(part["inlineData"]["data"])
                                hero_path.write_bytes(image_data)
                                size_kb = len(image_data) / 1024
                                print(f"  [{hero_info['name']}] Saved ({size_kb:.0f} KB) -> {hero_path}")
                                return hero_path
                    print(f"  [{hero_info['name']}] No image data in response")
                    return None
                elif response.status == 429:
                    wait = BACKOFF_BASE * (2 ** attempt)
                    print(f"  [{hero_info['name']}] Rate limited. Waiting {wait}s...")
                    await asyncio.sleep(wait)
                elif response.status == 503:
                    wait = BACKOFF_BASE * (2 ** attempt)
                    print(f"  [{hero_info['name']}] Service unavailable. Waiting {wait}s...")
                    await asyncio.sleep(wait)
                else:
                    text = await response.text()
                    print(f"  [{hero_info['name']}] API error {response.status}: {text[:300]}")
                    if attempt < MAX_RETRIES - 1:
                        await asyncio.sleep(BACKOFF_BASE * (2 ** attempt))
        except Exception as e:
            print(f"  [{hero_info['name']}] Request error: {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(BACKOFF_BASE)

    return None


async def generate_scene(session, scene, ami_b64):
    """Generate a scene image with hero injection."""
    full_prompt = f"{scene['prompt']} {BASE_STYLE}"
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"

    # Build parts with hero reference
    parts = [
        {"text": "REFERENCE IMAGE 1 — This is Ami. Keep this woman's exact appearance (face, skin tone, clothing, dupatta pattern) in the generated scene:"},
        {"inlineData": {"mimeType": "image/png", "data": ami_b64}},
        {"text": f"SCENE TO GENERATE: {full_prompt}"},
    ]

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }

    for attempt in range(MAX_RETRIES):
        try:
            async with session.post(url, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    candidates = result.get("candidates", [])
                    if candidates:
                        resp_parts = candidates[0].get("content", {}).get("parts", [])
                        for part in resp_parts:
                            if "inlineData" in part:
                                return base64.b64decode(part["inlineData"]["data"])
                    print(f"    No image data in response")
                    return None
                elif response.status == 429:
                    wait = BACKOFF_BASE * (2 ** attempt)
                    print(f"    Rate limited. Waiting {wait}s...")
                    await asyncio.sleep(wait)
                elif response.status == 503:
                    wait = BACKOFF_BASE * (2 ** attempt)
                    print(f"    Service unavailable. Waiting {wait}s...")
                    await asyncio.sleep(wait)
                else:
                    text = await response.text()
                    print(f"    API error {response.status}: {text[:300]}")
                    if attempt < MAX_RETRIES - 1:
                        await asyncio.sleep(BACKOFF_BASE * (2 ** attempt))
        except Exception as e:
            print(f"    Request error: {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(BACKOFF_BASE)

    return None


# ─── Main ─────────────────────────────────────────────────────────

async def main():
    import sys
    mode = sys.argv[1] if len(sys.argv) > 1 else "all"

    if not GEMINI_API_KEY:
        print("ERROR: GOOGLE_GEMINI_API_KEY not found in .env")
        print("Set GOOGLE_GEMINI_API_KEY=your_key in .env")
        sys.exit(1)

    print("=" * 55)
    print("  Ami — Gift Book Image Generation")
    print("  Single Hero Injection (Ami)")
    print(f"  Output: {OUTPUT_DIR}")
    print(f"  Mode: {mode}")
    print("=" * 55)

    async with aiohttp.ClientSession() as session:

        # ── Step 1: Generate or load hero reference ──
        ami_path = OUTPUT_DIR / HERO_AMI["filename"]

        if mode in ("all", "hero"):
            if not ami_path.exists() or mode == "hero":
                result = await generate_hero(session, HERO_AMI)
                if not result:
                    print("FATAL: Could not generate Ami hero")
                    return
                await asyncio.sleep(REQUEST_DELAY)

        if mode == "hero":
            print(f"\nHero-only mode — done!")
            print(f"  Ami: {ami_path}")
            return

        # ── Step 2: Load hero as base64 ──
        if not ami_path.exists():
            print("ERROR: Hero image not found. Run with 'hero' mode first.")
            return

        ami_b64 = base64.b64encode(ami_path.read_bytes()).decode("utf-8")
        print(f"\n  Hero loaded:")
        print(f"    Ami: {len(ami_b64):,} chars base64")

        # ── Step 3: Generate scenes ──
        scenes_to_generate = SCENE_PROMPTS
        if mode == "cover":
            scenes_to_generate = [s for s in SCENE_PROMPTS if s["name"] == "cover"]

        generated = []
        for scene in scenes_to_generate:
            output_path = OUTPUT_DIR / f"{scene['name']}.png"

            if output_path.exists() and mode not in ("hero", "cover"):
                print(f"  [{scene['name']}] Already exists, skipping")
                generated.append(str(output_path))
                continue

            print(f"  [{scene['name']}] Generating with Ami hero injection...")

            image_bytes = await generate_scene(session, scene, ami_b64)

            if image_bytes:
                output_path.write_bytes(image_bytes)
                size_kb = len(image_bytes) / 1024
                print(f"  [{scene['name']}] Saved ({size_kb:.0f} KB)")
                generated.append(str(output_path))
            else:
                print(f"  [{scene['name']}] FAILED")

            await asyncio.sleep(REQUEST_DELAY)

        print(f"\n{'=' * 55}")
        print(f"  Generated {len(generated)}/{len(scenes_to_generate)} images")
        print(f"  Output: {OUTPUT_DIR}")
        print(f"{'=' * 55}")


if __name__ == "__main__":
    asyncio.run(main())
