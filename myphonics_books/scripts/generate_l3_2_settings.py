"""
Generate SETTING REFERENCE images for L3.2 "Lost at the Night Market".

Pass 1: Create consistent environments WITHOUT characters.
These are then injected into scene generation (Pass 2) alongside the hero.

Settings generated:
  1. market_setting.png — The main market aisle (stalls, lanterns, ground, sky)
  2. elephant_stall.png — Close-up of the stone elephant stall
  3. dark_corner.png — The quiet dark corner where girl gets lost

Usage:
    py -3.12 scripts/generate_l3_2_settings.py
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
OUTPUT_DIR = Path(__file__).parent.parent / "output" / "images" / "L3_2_B1"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

REQUEST_DELAY = 3
MAX_RETRIES = 3
BACKOFF_BASE = 5

STYLE = (
    "Whimsical children's book illustration. Hand-drawn cartoon style with "
    "soft watercolour textured backgrounds and clean black outlines. "
    "Warm, friendly, inviting. Soft pastel backgrounds with pops of bright colour. "
    "Simple rounded shapes, gentle lighting. Professional picture book quality. "
    "No text, words, letters, or numbers in the image. "
    "NO people or characters in this image — EMPTY SCENE ONLY."
)

SETTINGS = [
    {
        "name": "market_setting",
        "prompt": (
            "A bustling Thai night market in Bangkok at night — EMPTY, no people. "
            "Rows of colourful market stalls with fabric canopies (red, orange, "
            "yellow) line both sides of a sandy/dirt path. Strings of warm round "
            "paper lanterns hang between the stalls above the aisle. Steam rises "
            "from noodle pots at stalls. Tropical plants in terracotta pots sit "
            "beside the stalls. Dark navy blue night sky with small white stars "
            "visible above. Warm golden glow from lanterns and stall lights. "
            "The ground is sandy-brown packed dirt, consistent throughout. "
            "This is the MAIN AISLE of the market — the central walkway. "
            "NO people, NO characters — completely empty scene. "
            "Landscape format."
        ),
    },
    {
        "name": "elephant_stall",
        "prompt": (
            "A single market stall in a Thai night market at night — EMPTY, no "
            "people. The stall has a wooden frame with a red/pink fabric canopy "
            "overhead. On wooden shelves, rows of cute small carved stone elephant "
            "figurines in various poses (standing, sitting, trunk raised). Each "
            "elephant is about 10-15cm tall, smooth grey stone with simple carved "
            "details. Warm lanterns hang from the canopy frame. The ground in "
            "front is sandy-brown packed dirt. Dark navy blue night sky with stars "
            "visible above. Other market stalls softly visible in the background. "
            "NO people, NO characters — just the stall and its elephants. "
            "Landscape format."
        ),
    },
    {
        "name": "dark_corner",
        "prompt": (
            "A quiet, dimmer corner of a Thai night market at night — EMPTY, no "
            "people. Fewer lanterns here — just a single string of small warm "
            "bulbs. A couple of closed wooden shutter stalls on the sides. The "
            "ground is the same sandy-brown packed dirt. Dark navy night sky with "
            "stars above. Shadows and dim lighting create a lonely atmosphere. "
            "Some stall canopies visible but folded/closed. A single potted plant. "
            "This feels quieter and emptier than the main market aisle. "
            "NO people, NO characters — empty scene only. "
            "Landscape format."
        ),
    },
]


async def generate_setting(session, setting):
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"
    full_prompt = f"{setting['prompt']} {STYLE}"
    parts = [{"text": f"GENERATE THIS EMPTY SCENE (no people): {full_prompt}"}]
    payload = {"contents": [{"parts": parts}], "generationConfig": {"responseModalities": ["IMAGE"]}}
    for attempt in range(MAX_RETRIES):
        try:
            async with session.post(url, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    for part in result.get("candidates", [{}])[0].get("content", {}).get("parts", []):
                        if "inlineData" in part:
                            return base64.b64decode(part["inlineData"]["data"])
                    return None
                elif response.status in (429, 503):
                    wait = BACKOFF_BASE * (2 ** attempt)
                    print(f"    {response.status}, waiting {wait}s...")
                    await asyncio.sleep(wait)
                else:
                    print(f"    Error {response.status}: {(await response.text())[:200]}")
                    await asyncio.sleep(BACKOFF_BASE * (2 ** attempt))
        except Exception as e:
            print(f"    {e}")
            await asyncio.sleep(BACKOFF_BASE)
    return None


async def main():
    if not GEMINI_API_KEY:
        print("ERROR: GOOGLE_GEMINI_API_KEY not found"); return

    print(f"\n{'='*55}")
    print("L3.2 Setting References — Thai Night Market")
    print(f"Output: {OUTPUT_DIR}\n{'='*55}\n")

    async with aiohttp.ClientSession() as session:
        for setting in SETTINGS:
            out = OUTPUT_DIR / f"{setting['name']}.png"
            print(f"  [{setting['name']}] Generating...")
            data = await generate_setting(session, setting)
            if data:
                out.write_bytes(data)
                print(f"  [{setting['name']}] Saved ({len(data)//1024} KB)")
            else:
                print(f"  [{setting['name']}] FAILED")
            await asyncio.sleep(REQUEST_DELAY)

    print(f"\n{'='*55}\nDone! Use these as setting references in scene generation.\n{'='*55}")


if __name__ == "__main__":
    asyncio.run(main())
