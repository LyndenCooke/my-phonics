"""
Regenerate L4.4 "How Now?" illustrations with REALISTIC integrated style.

The original images had characters that looked "pasted in" due to cartoon style.
This version uses a more photorealistic children's book style where characters
are naturally integrated into scenes.

Usage:
    python regenerate_l4_4_realistic.py              # Generate all images
    python regenerate_l4_4_realistic.py hero         # Hero only
    python regenerate_l4_4_realistic.py page 3       # Specific page only
"""

import asyncio
import aiohttp
import os
import base64
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.environ.get("GOOGLE_GEMINI_API_KEY")
BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
OUTPUT_DIR = Path(__file__).parent.parent / "output" / "images" / "L4_4_B1"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

REQUEST_DELAY = 4  # seconds between requests (increased for stability)
MAX_RETRIES = 3
BACKOFF_BASE = 5

# ─── REALISTIC INTEGRATED STYLE ─────────────────────────────────
# This is the key change - from cartoon to realistic children's book

REALISTIC_STYLE = (
    "Beautiful soft realistic children's book illustration with a gentle watercolour wash aesthetic. "
    "Photorealistic rendering of characters with soft, warm lighting. "
    "Characters are naturally integrated into the scene - NOT separate or pasted in. "
    "Same artistic rendering for characters AND background - cohesive unified style throughout. "
    "Soft focus background with detailed foreground characters. "
    "Warm, inviting, professional picture book quality like modern high-end children's books. "
    "Natural proportions, realistic skin tones and fabric textures. "
    "Gentle expressions, warm atmosphere. "
    "No text, words, letters, or numbers in the image."
)

# ─── CHARACTER DESCRIPTIONS ─────────────────────────────────────

BOY_HERO = {
    "full": (
        "A Malaysian boy, about 5 years old, with medium tan-brown skin, short neat black hair, "
        "round friendly face with warm brown eyes, natural child proportions. "
        "Wearing a bright orange cotton t-shirt, blue knee-length shorts, and simple tan sandals. "
        "Natural, realistic appearance - a real child, not a cartoon. "
        "Soft realistic children's book illustration style."
    ),
    "short": "the Malaysian boy (about 5, tan-brown skin, short black hair, orange t-shirt, blue shorts)",
}

MUM_DESCRIPTION = (
    "his mother - a Malaysian Muslim woman in a flowing dark green abaya and black niqab, "
    "only her warm brown eyes visible above the face veil, showing a kind gentle expression. "
    "Elegant, dignified, warm presence."
)

MONKEY_DESCRIPTION = (
    "a brown long-tailed macaque monkey with tan-brown fur, pale pinkish face, "
    "expressive dark eyes, long curled tail - realistic but friendly-looking"
)

MOSQUE_DESCRIPTION = (
    "Masjid Putra (Putra Mosque) in Putrajaya, Malaysia - stunning rose-pink granite mosque "
    "with multiple domes and tall minarets, set against bright blue sky. "
    "The iconic pink mosque is reflected in the calm blue waters of Putrajaya Lake. "
    "Surrounded by manicured tropical gardens with palm trees and flowering bushes."
)

# ─── SCENE PROMPTS ─────────────────────────────────────────────

SCENE_PROMPTS = {
    "hero": (
        f"{BOY_HERO['full']} "
        "Standing in a relaxed natural pose, facing the viewer, full body visible from head to toe. "
        "Arms naturally at sides. Plain warm cream studio background. "
        "Soft realistic children's book portrait style. "
        "Natural, warm, inviting. No text in image."
    ),

    "side_hero_mum": (
        "A Malaysian Muslim woman in a flowing dark green abaya and black niqab. "
        "Only her warm brown eyes visible above the face veil, showing a kind gentle expression. "
        "Elegant, dignified, warm presence. About 30 years old. "
        "Standing in a relaxed natural pose, facing the viewer, full body visible. "
        "Plain warm cream studio background. "
        "Soft realistic children's book portrait style. "
        "Natural, warm, inviting. No text in image."
    ),

    "cover": (
        f"A heartwarming scene at {MOSQUE_DESCRIPTION} "
        f"{BOY_HERO['short']} stands in the gardens looking up at the stunning pink mosque, "
        f"his expression full of wonder. Standing beside him is {MUM_DESCRIPTION}. "
        f"A cheeky {MONKEY_DESCRIPTION} sits on a garden wall nearby, adding playful energy. "
        "Beautiful warm afternoon light. Palm trees and tropical flowers frame the scene. "
        "The characters are NATURALLY INTEGRATED into the environment - same rendering style throughout. "
        f"{REALISTIC_STYLE} Portrait orientation."
    ),

    "page1": (
        f"At {MOSQUE_DESCRIPTION}, {BOY_HERO['short']} and {MUM_DESCRIPTION} stand in the gardens, "
        "looking up at the stunning rose-pink domes and minarets against bright blue sky. "
        "The boy points up with amazement, his face full of wonder. "
        "Manicured gardens with tropical flowers and palm trees surround them. "
        "Other visitors (families, women in hijab) stroll in the background. "
        "Warm morning light. Characters naturally integrated into scene. "
        f"{REALISTIC_STYLE} Landscape orientation."
    ),

    "page2": (
        f"{BOY_HERO['short']} walks along the edge of Putrajaya Lake with {MUM_DESCRIPTION}. "
        f"The beautiful {MOSQUE_DESCRIPTION} is reflected perfectly in the calm blue water. "
        "Palm trees and manicured gardens line the lakeside path. "
        "The boy looks happy and relaxed, walking beside his mother. "
        "Peaceful morning atmosphere, soft warm light. "
        "Characters naturally integrated - same realistic style for people and environment. "
        f"{REALISTIC_STYLE} Landscape orientation."
    ),

    "page3": (
        f"By the lakeside near {MOSQUE_DESCRIPTION}, {BOY_HERO['short']} has stopped, "
        f"looking surprised at a {MONKEY_DESCRIPTION} sitting on a low garden wall nearby. "
        "The monkey turns its head to stare at the boy with a cheeky mischievous expression. "
        "The boy's hands are raised in surprise, mouth open in amazement. "
        "Pink mosque and blue lake visible in the background, tropical plants around them. "
        "Natural interaction - boy and monkey both look real and present in the scene. "
        f"{REALISTIC_STYLE} Landscape orientation."
    ),

    "page4": (
        f"In the manicured gardens near {MOSQUE_DESCRIPTION}, a {MONKEY_DESCRIPTION} "
        "runs through the gardens carrying a small snack packet in its paws. "
        f"{BOY_HERO['short']} chases after it with arms outstretched, looking determined. "
        "The monkey looks back over its shoulder with a mischievous grin. "
        "Pink flowering bushes, palm trees, rose-pink mosque domes visible in background. "
        "Dynamic action scene with natural movement. "
        f"{REALISTIC_STYLE} Landscape orientation."
    ),

    "page5": (
        f"In the tropical gardens of {MOSQUE_DESCRIPTION}, {BOY_HERO['short']} "
        "runs around a large palm tree, looking puzzled and searching. "
        "Just the brown furry tail of the macaque monkey is visible disappearing behind the trunk. "
        "Colourful tropical flowers and manicured hedges in the garden. "
        "The stunning pink mosque with its domes and minarets rises in the background. "
        "The boy looks curious and slightly out of breath from running. "
        f"{REALISTIC_STYLE} Landscape orientation."
    ),

    "page6": (
        f"By the edge of Putrajaya Lake, {BOY_HERO['short']} has stopped, catching his breath. "
        f"A {MONKEY_DESCRIPTION} sits contentedly on the lakeside wall, calmly eating the snack. "
        "The monkey looks unbothered, happily munching. "
        f"The beautiful {MOSQUE_DESCRIPTION} is reflected in the calm blue lake behind them. "
        "The boy has his hands on his hips, looking amused at the monkey. "
        "Warm afternoon light. Natural, relaxed scene. "
        f"{REALISTIC_STYLE} Landscape orientation."
    ),

    "page7": (
        f"By Putrajaya Lake, {BOY_HERO['short']} stands proudly with {MUM_DESCRIPTION}. "
        "The mother's flowing dark green abaya moves gently in the tropical breeze. "
        "Her eyes above the niqab show warm pride and amusement. "
        f"A {MONKEY_DESCRIPTION} sits nearby on the wall, still munching on the snack. "
        f"The stunning {MOSQUE_DESCRIPTION} and its reflection in the blue lake behind them. "
        "Both boy and mother look happy, sharing a warm moment. "
        f"{REALISTIC_STYLE} Landscape orientation."
    ),

    "page8": (
        f"{BOY_HERO['short']} sits on a low stone wall by Putrajaya Lake with {MUM_DESCRIPTION}. "
        "They look out at the stunning view together - the rose-pink Masjid Putra mosque "
        "with its domes and minarets reflected perfectly in the calm blue water. "
        f"A {MONKEY_DESCRIPTION} sits contentedly nearby, having finished its snack. "
        "Golden afternoon light bathes the scene. Boy and mother both look peaceful and happy. "
        "Beautiful, serene ending scene. "
        f"{REALISTIC_STYLE} Landscape orientation."
    ),
}


async def generate_image(session, prompt: str, aspect_ratio: str = "4:3") -> bytes | None:
    """Generate a single image using Gemini 2.5 Flash Image."""
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}

    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "responseModalities": ["image", "text"],
            "responseMimeType": "text/plain"
        }
    }

    for attempt in range(MAX_RETRIES):
        try:
            async with session.post(
                url,
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=120)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    # Extract image from response
                    if "candidates" in data:
                        for part in data["candidates"][0]["content"]["parts"]:
                            if "inlineData" in part:
                                image_data = base64.b64decode(part["inlineData"]["data"])
                                return image_data
                    print(f"  No image in response: {data}")
                    return None
                elif response.status == 429:
                    wait = BACKOFF_BASE * (2 ** attempt)
                    print(f"  Rate limited, waiting {wait}s...")
                    await asyncio.sleep(wait)
                else:
                    text = await response.text()
                    print(f"  Error {response.status}: {text[:200]}")
                    if attempt < MAX_RETRIES - 1:
                        await asyncio.sleep(BACKOFF_BASE)
        except Exception as e:
            print(f"  Exception: {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(BACKOFF_BASE)

    return None


async def generate_with_reference(session, hero_base64: str, prompt: str) -> bytes | None:
    """Generate image with hero reference injection."""
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}

    # Include hero reference for character consistency
    enhanced_prompt = (
        f"Using the character from the reference image as the main boy character. "
        f"IMPORTANT: Keep the boy's appearance EXACTLY as shown - same face, same clothes, same proportions. "
        f"The boy is naturally part of this scene, not pasted in. "
        f"\n\n{prompt}"
    )

    payload = {
        "contents": [{
            "parts": [
                {"inlineData": {"mimeType": "image/png", "data": hero_base64}},
                {"text": enhanced_prompt}
            ]
        }],
        "generationConfig": {
            "responseModalities": ["image", "text"],
            "responseMimeType": "text/plain"
        }
    }

    for attempt in range(MAX_RETRIES):
        try:
            async with session.post(
                url,
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=120)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if "candidates" in data:
                        for part in data["candidates"][0]["content"]["parts"]:
                            if "inlineData" in part:
                                image_data = base64.b64decode(part["inlineData"]["data"])
                                return image_data
                    print(f"  No image in response")
                    return None
                elif response.status == 429:
                    wait = BACKOFF_BASE * (2 ** attempt)
                    print(f"  Rate limited, waiting {wait}s...")
                    await asyncio.sleep(wait)
                else:
                    text = await response.text()
                    print(f"  Error {response.status}: {text[:200]}")
                    if attempt < MAX_RETRIES - 1:
                        await asyncio.sleep(BACKOFF_BASE)
        except Exception as e:
            print(f"  Exception: {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(BACKOFF_BASE)

    return None


async def main():
    args = sys.argv[1:]

    # Determine what to generate
    generate_hero = True
    generate_mum = True
    generate_scenes = True
    specific_page = None

    if args:
        if args[0] == "hero":
            generate_scenes = False
            generate_mum = False
        elif args[0] == "mum":
            generate_hero = False
            generate_scenes = False
        elif args[0] == "page" and len(args) > 1:
            generate_hero = False
            generate_mum = False
            specific_page = int(args[1])

    print("=" * 60)
    print("L4.4 'How Now?' - REALISTIC IMAGE REGENERATION")
    print("=" * 60)
    print(f"Output: {OUTPUT_DIR}")
    print()

    hero_base64 = None

    async with aiohttp.ClientSession() as session:
        # Step 1: Generate hero reference
        if generate_hero:
            print("Step 1: Generating REALISTIC hero reference...")
            hero_data = await generate_image(session, SCENE_PROMPTS["hero"], "3:4")
            if hero_data:
                hero_path = OUTPUT_DIR / "hero_reference.png"
                with open(hero_path, "wb") as f:
                    f.write(hero_data)
                print(f"  [OK] Saved: {hero_path}")
                hero_base64 = base64.b64encode(hero_data).decode("utf-8")
            else:
                print("  [FAIL] Failed to generate hero")
                return
            await asyncio.sleep(REQUEST_DELAY)
        else:
            # Load existing hero
            hero_path = OUTPUT_DIR / "hero_reference.png"
            if hero_path.exists():
                with open(hero_path, "rb") as f:
                    hero_base64 = base64.b64encode(f.read()).decode("utf-8")
                print(f"Using existing hero: {hero_path}")

        # Step 2: Generate mum side hero
        if generate_mum:
            print("\nStep 2: Generating Mum side hero...")
            mum_data = await generate_image(session, SCENE_PROMPTS["side_hero_mum"], "3:4")
            if mum_data:
                mum_path = OUTPUT_DIR / "side_hero_mum.png"
                with open(mum_path, "wb") as f:
                    f.write(mum_data)
                print(f"  [OK] Saved: {mum_path}")
            else:
                print("  [FAIL] Failed to generate mum")
            await asyncio.sleep(REQUEST_DELAY)

        # Step 3: Generate scenes
        if generate_scenes and hero_base64:
            scenes = ["cover", "page1", "page2", "page3", "page4", "page5", "page6", "page7", "page8"]

            if specific_page is not None:
                scenes = [f"page{specific_page}"]

            print(f"\nStep 3: Generating {len(scenes)} REALISTIC scenes with hero injection...")

            for scene_name in scenes:
                print(f"\n  Generating {scene_name}...")
                prompt = SCENE_PROMPTS[scene_name]

                image_data = await generate_with_reference(session, hero_base64, prompt)

                if image_data:
                    output_path = OUTPUT_DIR / f"{scene_name}.png"
                    with open(output_path, "wb") as f:
                        f.write(image_data)
                    print(f"    [OK] Saved: {output_path}")
                else:
                    print(f"    [FAIL] Failed: {scene_name}")

                await asyncio.sleep(REQUEST_DELAY)

    print("\n" + "=" * 60)
    print("REGENERATION COMPLETE")
    print("=" * 60)
    print(f"\nImages saved to: {OUTPUT_DIR}")
    print("\nPlease verify:")
    print("  1. Characters look realistic and naturally integrated")
    print("  2. Boy's appearance is consistent across all pages")
    print("  3. Mosque (pink) is consistent in all backgrounds")
    print("  4. Monkey looks natural in scenes")


if __name__ == "__main__":
    asyncio.run(main())