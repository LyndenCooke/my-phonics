"""
Generate illustrations for Mama and Me — Mother's Day Gift Book.

DUAL HERO INJECTION: Two consistent characters (Baby Safia + Mama Aisha)
are generated as hero references, then injected into every scene.

Usage:
    python generate_mama_images.py              # Generate all images
    python generate_mama_images.py hero         # Generate hero references only
    python generate_mama_images.py scenes       # Generate scenes only (heroes must exist)
    python generate_mama_images.py cover        # Generate cover only
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
OUTPUT_DIR = Path(__file__).parent.parent / "output" / "images" / "mama_book"
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
    "Every single character — baby, woman, ALL people — MUST have eyes drawn as "
    "small cute curved slit lines, like happy closed-eye smiling. Two little curved lines "
    "like upside-down smiles. NO open eyes. NO eyeballs. NO iris. NO pupils. NO white sclera. "
    "NO detailed eyes whatsoever. Just simple cute curved slit lines — like the Japanese ^_^ emoticon eyes. "
    "This is a strict religious and artistic requirement — DO NOT show open eyes on ANY character. "
    "Professional picture book quality. Tender and emotional. "
    "No text, words, letters, or numbers in the image."
)

# ─── Hero Prompts ─────────────────────────────────────────────────

HERO_BABY = {
    "name": "Baby Safia",
    "filename": "hero_safia.png",
    "description": (
        "A cartoon baby girl character, about 11 months old. Light olive skin tone. "
        "Small cute slit eyes — like happy closed-eye smiling, two little curved lines like upside-down smiles. Simple, cute, warm. "
        "Soft brown baby hair, fine and natural, with a bit of volume and a natural soft upward sweep at the top — "
        "like a real baby's hair that hasn't been brushed, soft and fluffy not spiky. "
        "NOT ginger, NOT auburn — natural medium brown. Adorably chubby round cheeks, rosy cheeks, "
        "and a cheerful gummy smile with NO teeth showing. "
        "She wears a white long-sleeve top with small pink details, and little pink leggings. "
        "Sitting up in a natural baby pose, facing the viewer. "
        "Pudgy baby proportions — slightly oval head shape (not perfectly round), tiny body, chubby arms and legs. "
        "Plain light warm cream background (no scenery, no objects, no patterns). "
        "Full body visible from head to toes."
    ),
}

HERO_MAMA = {
    "name": "Mama Aisha",
    "filename": "hero_mama.png",
    "description": (
        "A cartoon young woman character, about 28 years old. Warm olive/medium-brown skin, "
        "wearing a beautiful teal/green hijab that drapes softly around her head and shoulders. "
        "Small cute slit eyes — like happy closed-eye smiling, two little curved lines like upside-down smiles. Simple, cute, warm. "
        "A warm loving smile, soft rounded features, and rosy lips. "
        "She wears a comfortable long teal/dark green modest dress (abaya style) that reaches her ankles, "
        "with simple flat shoes. Elegant but comfortable — a real mum who takes care of herself. "
        "Standing in a relaxed, natural pose, facing the viewer, full body visible. "
        "Arms slightly away from body, natural mother's posture — warm and approachable. "
        "Plain light warm cream background (no scenery, no objects, no patterns)."
    ),
}

# ─── Scene Prompts ────────────────────────────────────────────────
# REFERENCE IMAGE 1 = Baby Safia, REFERENCE IMAGE 2 = Mama Aisha
# Images focus ONLY on Safia and Mama. Other people described in text only.

SCENE_PROMPTS = [
    {
        "name": "cover",
        "prompt": (
            "Show the baby from REFERENCE IMAGE 1 being held lovingly by the woman from REFERENCE IMAGE 2. "
            "Both have cute closed slit eyes — curved lines like ^_^ — NO open eyes on EITHER character. "
            "The mama is cuddling the baby close, both smiling with eyes closed happily. "
            "Warm golden light surrounds them. Soft, dreamy background with hints of purple and pink. "
            "This is a Mother's Day book cover — intimate, emotional, and beautiful. Only these two characters. "
            "Same characters, same appearance as reference images. "
            "Portrait format."
        ),
        "heroes": ["safia", "mama"],
    },
    {
        "name": "page1",
        "prompt": (
            "Show the woman from REFERENCE IMAGE 2 walking through a lush tropical jungle, visibly pregnant (round belly), "
            "with golden light filtering through the green trees and leaves around her. "
            "She looks strong, peaceful, and determined, with one hand on her belly. "
            "Mountains visible in the misty background. A sense of adventure and travel. "
            "Same character, same appearance as reference. "
            "Landscape format."
        ),
        "heroes": ["mama"],
    },
    {
        "name": "page2",
        "prompt": (
            "Show the woman from REFERENCE IMAGE 2 in a hospital room, holding a tiny newborn baby wrapped in a white blanket for the very first time. "
            "She has tears of joy on her face, looking down at the baby with overwhelming love. "
            "Warm soft light. Intimate, tender moment. Simple hospital room background. "
            "Same character, same appearance as reference. "
            "Landscape format."
        ),
        "heroes": ["mama"],
    },
    {
        "name": "page3",
        "prompt": (
            "Show the woman from REFERENCE IMAGE 2 standing beside a glass hospital crib/incubator in an ICU. "
            "Inside the crib is a very tiny baby wearing a small white babygrow/onesie and wrapped in a soft white blanket. "
            "The baby is clothed and cosy. The woman's hand is placed gently on the glass. "
            "Soft blue light from the monitors, warm golden light on the woman. "
            "She has a gentle emotional expression with her eyes as cute closed curved slit lines — "
            "exactly matching the ^_^ slit eyes in the reference images. NO open eyes, NO eyeballs, NO iris. "
            "Her eyes are gentle curved lines, softly closed. "
            "The feeling is protective love — she will not leave. "
            "Only these two characters — nobody else. "
            "Same character, same appearance as reference — same slit eyes as reference. "
            "Landscape format."
        ),
        "heroes": ["baby", "mama"],
    },
    {
        "name": "page4",
        "prompt": (
            "Show the woman from REFERENCE IMAGE 2 sitting in the back seat of a car, carefully holding "
            "a tiny baby (from REFERENCE IMAGE 1, but much smaller, newborn size) wrapped in a white blanket. "
            "She is looking down at the baby with gentle relief and joy. "
            "Warm light coming through the car window. The feeling is 'finally going home'. "
            "Same characters, same appearance as references. "
            "Landscape format."
        ),
        "heroes": ["safia", "mama"],
    },
    {
        "name": "page5",
        "prompt": (
            "Show the woman from REFERENCE IMAGE 2 sitting in a comfortable rocking chair in a cosy warm living room, "
            "nursing/holding the baby from REFERENCE IMAGE 1 (small baby, a few weeks old) close to her chest. "
            "Golden warm light fills the room. Cushions, a cup of tea nearby, a cosy blanket. "
            "The scene radiates love, calm, and safety. "
            "Same characters, same appearance as references. "
            "Landscape format."
        ),
        "heroes": ["safia", "mama"],
    },
    {
        "name": "page6",
        "prompt": (
            "Show the woman from REFERENCE IMAGE 2 arriving at a front door with the baby from REFERENCE IMAGE 1 in her arms. "
            "Family members' hands reaching out excitedly to welcome them — many hands and arms visible at the edges. "
            "The baby is smiling happily. Mama is smiling too. "
            "ALL characters have cute closed slit eyes — curved lines like ^_^ — NO open eyes on anyone. "
            "Warm, welcoming atmosphere. A happy family gathering scene. "
            "Same characters, same appearance as references. "
            "Landscape format."
        ),
        "heroes": ["safia", "mama"],
    },
    {
        "name": "page7",
        "prompt": (
            "Show the woman from REFERENCE IMAGE 2 standing at a doorway — SAME teal hijab and teal abaya as reference, "
            "but with a handbag over her shoulder ready for work. She is blowing a kiss goodbye. "
            "Both characters have cute closed slit eyes — curved lines like ^_^ — NO open eyes on EITHER character. "
            "The baby from REFERENCE IMAGE 1 is sitting on the floor with colourful toys, waving a chubby hand. "
            "Warm sunny Qatar-style interior with light walls. Only these two characters — nobody else in the scene. "
            "IMPORTANT: the woman MUST wear her teal hijab and teal dress, same as in the reference image. "
            "Same characters, same appearance as references. "
            "Landscape format."
        ),
        "heroes": ["safia", "mama"],
    },
    {
        "name": "page8",
        "prompt": (
            "Show the woman from REFERENCE IMAGE 2 sitting on the floor at a baby sensory class with the baby from REFERENCE IMAGE 1. "
            "Colourful soft play equipment, rattles, and sensory toys around them. The baby is clapping happily. "
            "Mama is cheering and clapping along, encouraging the baby. Bright cheerful colours, fun atmosphere. "
            "Both have cute closed slit eyes — curved lines like ^_^ — NO open eyes. "
            "Only these two characters — nobody else in the scene. "
            "Same characters, same appearance as references. "
            "Landscape format."
        ),
        "heroes": ["safia", "mama"],
    },
    {
        "name": "page9",
        "prompt": (
            "Show the baby from REFERENCE IMAGE 1 sitting in a highchair, face and hands completely covered "
            "in mashed avocado and banana — a glorious mess! Huge delighted messy grin. "
            "The woman from REFERENCE IMAGE 2 is standing next to the highchair, laughing with her hand over her mouth, "
            "holding a cloth. Bits of food on the floor and tray. Bright, fun kitchen scene. "
            "Same characters, same appearance as references. "
            "Landscape format."
        ),
        "heroes": ["safia", "mama"],
    },
    {
        "name": "page10",
        "prompt": (
            "Show the woman from REFERENCE IMAGE 2 and the baby from REFERENCE IMAGE 1 sitting together at a table "
            "with a beautiful iftar spread — dates, food, warm dishes. Golden sunset light streaming through a window. "
            "The baby is in a highchair reaching for food with chubby hands. Mama is smiling. "
            "Warm, special family moment. Cosy London home interior. "
            "Same characters, same appearance as references. "
            "Landscape format."
        ),
        "heroes": ["safia", "mama"],
    },
    {
        "name": "page11",
        "prompt": (
            "Show the woman from REFERENCE IMAGE 2 sitting in a cosy armchair in a living room, "
            "cuddling the baby from REFERENCE IMAGE 1 protectively close to her chest. "
            "The baby is nestling into mama for safety and comfort. "
            "Mama looks calm and protective — their own peaceful bubble. "
            "ONLY these two characters — nobody else in the image. No other people, no boys, no visitors. "
            "BOTH characters must have cute slit eyes ^_^ — closed curved lines, NO open eyes, NO eyeballs. "
            "Same characters, same slit eyes, same appearance as references. "
            "Landscape format."
        ),
        "heroes": ["safia", "mama"],
    },
    {
        "name": "page12",
        "prompt": (
            "Show the baby from REFERENCE IMAGE 1 giving a huge open-mouth grin, showing ONE tiny white tooth. "
            "She is playfully biting a colourful teething ring. "
            "The woman from REFERENCE IMAGE 2 is beside her, pretending to be dramatically shocked — "
            "hand on her cheek, mouth open in playful surprise. "
            "Bright, fun, playful scene. Both characters look happy and silly. "
            "Same characters, same appearance as references. "
            "Landscape format."
        ),
        "heroes": ["safia", "mama"],
    },
    {
        "name": "page13",
        "prompt": (
            "Show the woman from REFERENCE IMAGE 2 and the baby from REFERENCE IMAGE 1 in an intimate close-up. "
            "The baby is nestled against mama, smiling softly up at her. "
            "The mama has her face close to the baby, a gentle soft smile. "
            "BOTH the woman AND the baby have cute closed slit eyes — tiny curved lines like ^_^. "
            "NO open eyes on either character, NO eyeballs, NO iris, NO pupils. "
            "Warm golden light wrapping around them both. Just the two of them, nothing else matters. "
            "The most beautiful, emotional moment. Soft, dreamy, full of love. "
            "Same characters, same appearance as references. "
            "Landscape format."
        ),
        "heroes": ["safia", "mama"],
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


async def generate_scene(session, scene, safia_b64, mama_b64):
    """Generate a scene image with dual hero injection."""
    full_prompt = f"{scene['prompt']} {BASE_STYLE}"
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"

    # Build parts with hero references
    parts = []
    if "safia" in scene["heroes"]:
        parts.append({"text": "REFERENCE IMAGE 1 — This is baby Safia. Keep this baby's exact appearance (face, hair, skin tone, expression style) in the generated scene:"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": safia_b64}})
    if "mama" in scene["heroes"]:
        label = "2" if "safia" in scene["heroes"] else "1"
        parts.append({"text": f"REFERENCE IMAGE {label} — This is Mama Aisha. Keep this woman's exact appearance (face, hair, skin tone, clothing style) in the generated scene:"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": mama_b64}})
    parts.append({"text": f"SCENE TO GENERATE: {full_prompt}"})

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
    print("  Mama and Me — Image Generation")
    print("  Dual Hero Injection (Baby Safia + Mama Aisha)")
    print(f"  Output: {OUTPUT_DIR}")
    print(f"  Mode: {mode}")
    print("=" * 55)

    async with aiohttp.ClientSession() as session:

        # ── Step 1: Generate or load hero references ──
        safia_path = OUTPUT_DIR / HERO_BABY["filename"]
        mama_path = OUTPUT_DIR / HERO_MAMA["filename"]

        if mode in ("all", "hero"):
            if not safia_path.exists() or mode == "hero":
                result = await generate_hero(session, HERO_BABY)
                if not result:
                    print("FATAL: Could not generate Baby Safia hero")
                    return
                await asyncio.sleep(REQUEST_DELAY)

            if not mama_path.exists() or mode == "hero":
                result = await generate_hero(session, HERO_MAMA)
                if not result:
                    print("FATAL: Could not generate Mama Aisha hero")
                    return
                await asyncio.sleep(REQUEST_DELAY)

        if mode == "hero":
            print("\nHero-only mode — done!")
            print(f"  Baby Safia: {safia_path}")
            print(f"  Mama Aisha: {mama_path}")
            return

        # ── Step 2: Load heroes as base64 ──
        if not safia_path.exists() or not mama_path.exists():
            print("ERROR: Hero images not found. Run with 'hero' mode first.")
            return

        safia_b64 = base64.b64encode(safia_path.read_bytes()).decode("utf-8")
        mama_b64 = base64.b64encode(mama_path.read_bytes()).decode("utf-8")
        print(f"\n  Heroes loaded:")
        print(f"    Baby Safia: {len(safia_b64):,} chars base64")
        print(f"    Mama Aisha: {len(mama_b64):,} chars base64")

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

            hero_list = " + ".join(scene["heroes"])
            print(f"  [{scene['name']}] Generating with {hero_list}...")

            image_bytes = await generate_scene(session, scene, safia_b64, mama_b64)

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
