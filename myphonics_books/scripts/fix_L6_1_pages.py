"""
Fix specific L6.1 pages: 1, 2, 4, 8

Problems to fix:
  - Pages 1 & 2: Stranger danger feel — add neighbours/community context
  - Page 1: Storyteller has white in eyes
  - Page 4: Baker has white in eyes
  - Page 8: Yusuf looks younger/smaller, wrong shoe colour (blue not white)

Injection approach (LEARNED FROM FAILURE):
  - Hero ref + storyteller ref ONLY (no background plates — they wreck scale)
  - Setting described in text prompt only
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
BOOK_DIR = Path(__file__).parent.parent / "output" / "images" / "L6_1_B1"

REQUEST_DELAY = 4
MAX_RETRIES = 3
BACKOFF_BASE = 5

BASE_STYLE = (
    "Whimsical children's book illustration. Hand-drawn cartoon style with "
    "soft watercolour textured backgrounds and clean black-outlined characters. "
    "CRITICAL EYE RULE: EVERY character (boy, old man, baker, EVERYONE) MUST have eyes that are "
    "tiny solid black filled circles like dots drawn with a black marker pen. "
    "NO white around the black, NO iris, NO pupil, NO highlight, NO detail whatsoever. "
    "Just small simple black dots. This applies to ALL characters in the scene. "
    "Warm, friendly, inviting. Soft pastel backgrounds with pops of bright colour. "
    "Simple rounded shapes, gentle lighting. Professional picture book quality. "
    "No text, words, letters, or numbers in the image."
)

YUSUF = (
    "the boy from the MAIN CHARACTER REFERENCE (bright yellow t-shirt, light grey cotton "
    "trousers, white trainers, short black hair, medium-dark brown skin)"
)

STORYTELLER = (
    "the older man from the SIDE CHARACTER REFERENCE (white linen collared shirt, "
    "light stone trousers, brown sandals, short grey hair, short grey beard, "
    "carries a small worn brown leather notebook)"
)

# Pages to fix with REWORKED prompts addressing stranger danger + eye issues
FIXES = [
    {
        "name": "page1",
        "inject_storyteller": True,
        "prompt": (
            f"Show {YUSUF} sitting on the front steps of a cream-coloured Cairo apartment "
            "block, chin resting on his hand, looking bored. "
            f"A friendly NEIGHBOURHOOD ELDER — {STORYTELLER} — sits down on the step beside him. "
            "The elder is clearly a KNOWN LOCAL FIGURE — a woman sweeping a doorstep nearby waves "
            "hello to him, and a shopkeeper in the background nods at him. He is part of this "
            "community, not a stranger. He has a warm, grandfatherly smile. "
            "The street is busy and public — other residents visible on balconies and in doorways. "
            "Palm trees, cream apartment blocks, bright afternoon sky. "
            "Both characters sitting at the SAME level on the steps, similar framing size. "
            "CRITICAL: EVERY character's eyes must be tiny solid black dots — NO white at all. "
            "Same characters as their REFERENCE images. Landscape orientation."
        ),
    },
    {
        "name": "page2",
        "inject_storyteller": True,
        "prompt": (
            f"Show {YUSUF} sitting on apartment steps with arms crossed, looking sceptical. "
            f"The neighbourhood elder — {STORYTELLER} — sits beside him on the SAME step, "
            "leaning forward slightly with sparkling eyes, talking with one hand gesturing "
            "expressively. He holds his worn brown leather notebook in the other hand. "
            "They are at the SAME level, sitting side by side like a grandfather and grandson "
            "having a chat. A neighbour passes by with shopping bags, a cat sits on a nearby wall. "
            "The street is alive and public — this is a community conversation, not an isolated encounter. "
            "Cream apartment blocks, palm trees, warm afternoon light. "
            "CRITICAL: EVERY character's eyes must be tiny solid black dots — NO white at all. "
            "Same characters as their REFERENCE images. Landscape orientation."
        ),
    },
    {
        "name": "page4",
        "inject_storyteller": True,
        "prompt": (
            f"Show {YUSUF} and the neighbourhood elder ({STORYTELLER}) standing at the open "
            "door of a small neighbourhood bakery set in a cream-coloured building with painted "
            "green wooden shutters. Inside the bakery, an older baker in a white apron holds out "
            "a round golden flatbread (aish baladi) with a warm welcoming smile. "
            "Steam rises from a clay oven visible behind him. Warm golden tones fill the scene. "
            "Yusuf's eyes go wide at the bread. The baker clearly knows the elder — they greet "
            "each other like old friends. "
            "CRITICAL: EVERY character in this scene — the boy, the elder, AND the baker — "
            "must have eyes that are tiny solid black filled circles. NO white in ANY eyes. "
            "Same characters as their REFERENCE images. Landscape orientation."
        ),
    },
    {
        "name": "page8",
        "inject_storyteller": False,
        "prompt": (
            f"Show {YUSUF} sitting on the front steps of his cream-coloured Cairo apartment "
            "block in the warm golden evening light. He holds a small worn brown leather notebook "
            "open on his lap, smiling contentedly at the busy street before him. "
            "He looks happy, peaceful, and proud — not bored any more. "
            "The street is alive: a vendor with a colourful umbrella cart, street cats lounging, "
            "a distant minaret catching the golden sunset light, palm trees swaying. "
            "IMPORTANT: Yusuf must be the SAME SIZE and proportions as the reference — "
            "an 8-9 year old boy, not smaller. His trainers are WHITE (not blue). "
            "Warm, glowing sunset colours over the whole scene. "
            "Same character as the MAIN CHARACTER REFERENCE. Landscape orientation."
        ),
    },
]


async def generate_scene(
    session: aiohttp.ClientSession,
    prompt: str,
    refs: dict[str, str],
    label: str,
) -> bytes | None:
    """Generate a scene with hero + optional storyteller injection."""

    full_prompt = f"{prompt} {BASE_STYLE}"
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"

    parts = [
        {"text": "MAIN CHARACTER REFERENCE - Keep this boy's exact face, outfit, hair, skin tone, and proportions:"},
        {"inlineData": {"mimeType": "image/png", "data": refs["hero"]}},
    ]

    if "storyteller" in refs:
        parts.append({"text": "SIDE CHARACTER REFERENCE - This is the neighbourhood elder. Keep his face, outfit, hair, and proportions identical:"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": refs["storyteller"]}})

    parts.append({"text": f"SCENE TO GENERATE: {full_prompt}"})

    ref_names = list(refs.keys())
    print(f"  [{label}] Generating with refs: {', '.join(ref_names)}...")

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
                    print(f"  [{label}] No image data in response")
                    return None
                elif response.status == 429:
                    wait = BACKOFF_BASE * (2 ** attempt)
                    print(f"  [{label}] Rate limited. Waiting {wait}s...")
                    await asyncio.sleep(wait)
                    continue
                else:
                    text = await response.text()
                    print(f"  [{label}] API error {response.status}: {text[:300]}")
                    if attempt < MAX_RETRIES - 1:
                        wait = BACKOFF_BASE * (2 ** attempt)
                        await asyncio.sleep(wait)
                    continue
        except Exception as e:
            print(f"  [{label}] Error: {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(BACKOFF_BASE)
            continue

    return None


async def main():
    if not GEMINI_API_KEY:
        print("ERROR: GOOGLE_GEMINI_API_KEY not found in .env")
        sys.exit(1)

    print(f"\nFixing L6.1 pages: {', '.join(f['name'] for f in FIXES)}")
    print(f"Output: {BOOK_DIR}\n")

    # Load references
    hero_path = BOOK_DIR / "hero_reference.png"
    storyteller_path = BOOK_DIR / "side_storyteller_reference.png"

    if not hero_path.exists():
        print("ERROR: hero_reference.png not found!")
        return
    if not storyteller_path.exists():
        print("ERROR: side_storyteller_reference.png not found!")
        return

    hero_b64 = base64.b64encode(hero_path.read_bytes()).decode("utf-8")
    storyteller_b64 = base64.b64encode(storyteller_path.read_bytes()).decode("utf-8")
    print(f"  Loaded hero ({len(hero_b64)} chars)")
    print(f"  Loaded storyteller ({len(storyteller_b64)} chars)")

    async with aiohttp.ClientSession() as session:
        for fix in FIXES:
            name = fix["name"]
            output_path = BOOK_DIR / f"{name}.png"

            # Back up current
            if output_path.exists():
                backup = BOOK_DIR / f"{name}_prev.png"
                output_path.rename(backup)
                print(f"  [{name}] Backed up -> {backup.name}")

            # Build refs
            refs = {"hero": hero_b64}
            if fix["inject_storyteller"]:
                refs["storyteller"] = storyteller_b64

            image_bytes = await generate_scene(session, fix["prompt"], refs, name)

            if image_bytes:
                output_path.write_bytes(image_bytes)
                size_kb = len(image_bytes) / 1024
                print(f"  [{name}] Saved ({size_kb:.0f} KB)")
            else:
                print(f"  [{name}] FAILED - restoring backup")
                backup = BOOK_DIR / f"{name}_prev.png"
                if backup.exists():
                    backup.rename(output_path)

            await asyncio.sleep(REQUEST_DELAY)

    print("\nDone!")


if __name__ == "__main__":
    asyncio.run(main())
