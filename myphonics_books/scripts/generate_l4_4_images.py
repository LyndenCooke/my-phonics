"""
Generate illustrations for L4.4 "The Cheeky Monkey" using Gemini API.
REGENERATION — previous images had wrong art style (semi-photorealistic).

Setting: Masjid Putra, Putrajaya, Malaysia
Main character: Malaysian boy (orange t-shirt, blue shorts, GLASSES)
Side characters: Mum (green abaya, black niqab), brown macaque monkey

DISABILITY REPRESENTATION: Boy wears round glasses (visible in all scenes).

Usage:
    py -3.12 scripts/generate_l4_4_images.py           # Generate all
    py -3.12 scripts/generate_l4_4_images.py hero       # Hero only
    py -3.12 scripts/generate_l4_4_images.py scenes     # Scenes only
"""

import asyncio, aiohttp, os, sys, base64
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

GEMINI_API_KEY = os.environ.get("GOOGLE_GEMINI_API_KEY")
BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
OUTPUT_DIR = Path(__file__).parent.parent / "output" / "images" / "L4_4_B1"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
EYE_REF_PATH = Path(__file__).parent.parent / "output" / "images" / "L4_1_B1" / "hero_reference.png"
REQUEST_DELAY = 4; MAX_RETRIES = 3; BACKOFF_BASE = 5

SKIN_HEX = "#8B6B4A"; HAIR_HEX = "#0D0D0D"

BASE_STYLE = (
    "Whimsical children's book illustration. Hand-drawn cartoon style with "
    "soft watercolour textured backgrounds and clean black-outlined characters. "
    "CRITICAL EYE RULE: Every character MUST have eyes that are tiny solid black "
    "filled circles like dots. NO white, NO iris, NO highlight. "
    "Warm, friendly. No text, words, letters, or numbers in the image."
)

BOY_HERO = {
    "description": (
        f"A cartoon boy character, about 5 years old, with medium brown Malaysian "
        f"skin, hex colour {SKIN_HEX}. Short neat black hair (hex {HAIR_HEX}). "
        f"He wears small round glasses with thin dark frames. "
        f"He wears a bright orange cotton t-shirt, blue knee-length shorts, "
        f"and simple brown sandals. "
        f"Solid black dot eyes behind the glasses — ZERO white. "
        f"Bright curious excited expression. "
        f"NO rosy cheeks, NO blush marks. Standing neutral pose, full body, "
        f"plain light cream background."
    ),
}

MUM_DESC = (
    "Malaysian Muslim mother (flowing dark green abaya, black niqab covering "
    "face with only warm brown eyes visible, dignified posture, kind expression "
    "in eyes)"
)

MONKEY_DESC = (
    "a brown long-tailed macaque monkey with pale face, brown fur, long tail, "
    "cheeky mischievous expression"
)

MOSQUE = (
    "the stunning Masjid Putra mosque with beautiful rose-pink granite domes "
    "and tall minarets against a bright blue sky"
)

SCENES = [
    {"name": "cover", "prompt": (
        f"Show the boy from the reference image (orange t-shirt, blue shorts, "
        f"round glasses, brown sandals) standing in gardens near {MOSQUE} in "
        f"Putrajaya, Malaysia. {MONKEY_DESC} sits on a garden wall nearby. "
        f"{MUM_DESC} stands beside the boy. Putrajaya Lake and palm trees in "
        f"background. Bright sunny day. The boy must be wearing his ROUND GLASSES. "
        f"Skin {SKIN_HEX}. Eyes: tiny solid black dots. Portrait 3:4."
    )},
    {"name": "page1", "prompt": (
        f"Show the boy from the reference image (orange t-shirt, blue shorts, "
        f"round glasses) and {MUM_DESC} standing in gardens looking up at {MOSQUE}. "
        f"Manicured gardens with tropical flowers in foreground. The boy looks "
        f"amazed, pointing up at the pink domes. Warm morning light. "
        f"Boy MUST wear his round glasses. Skin {SKIN_HEX}. "
        f"Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page2", "prompt": (
        f"Show the boy from the reference image (orange t-shirt, blue shorts, "
        f"round glasses) walking with {MUM_DESC} along the edge of Putrajaya Lake. "
        f"{MOSQUE} reflected in calm blue water. Palm trees and gardens line the "
        f"lakeside path. Other visitors stroll in background. Peaceful morning. "
        f"Boy MUST wear his round glasses. Skin {SKIN_HEX}. "
        f"Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page3", "prompt": (
        f"Show the boy from the reference image (orange t-shirt, blue shorts, "
        f"round glasses) stopped on the lakeside path near {MOSQUE}, looking "
        f"surprised at {MONKEY_DESC} sitting on a low garden wall. The monkey "
        f"turns to stare at the boy. Pink mosque and blue lake in background. "
        f"Boy's hands raised in surprise. Boy MUST wear his round glasses. "
        f"Skin {SKIN_HEX}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page4", "prompt": (
        f"{MONKEY_DESC} runs through manicured gardens near {MOSQUE}, holding a "
        f"small snack bag in its paws. The boy from the reference image (orange "
        f"t-shirt, blue shorts, round glasses) chases after it with arms "
        f"outstretched. Monkey looks back with a mischievous grin. Pink flowering "
        f"bushes and palm trees. Rose-pink mosque domes in background. "
        f"Boy MUST wear his round glasses. Skin {SKIN_HEX}. "
        f"Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page5", "prompt": (
        f"Show the boy from the reference image (orange t-shirt, blue shorts, "
        f"round glasses) running through gardens of {MOSQUE}, looking around a "
        f"large palm tree. The brown tail of a macaque monkey is just visible "
        f"behind the trunk. Colourful tropical flowers and manicured hedges. "
        f"Pink mosque with domes in background. Boy looks puzzled, searching. "
        f"Boy MUST wear his round glasses. Skin {SKIN_HEX}. "
        f"Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page6", "prompt": (
        f"By the edge of Putrajaya Lake. The boy from the reference image (orange "
        f"t-shirt, blue shorts, round glasses) stands catching his breath, hands "
        f"on hips, looking amused at {MONKEY_DESC} sitting contentedly on the "
        f"lakeside wall, calmly eating the snack. {MOSQUE} reflected in calm blue "
        f"lake behind them. Boy MUST wear his round glasses. "
        f"Skin {SKIN_HEX}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page7", "prompt": (
        f"By Putrajaya Lake. The boy from the reference image (orange t-shirt, "
        f"blue shorts, round glasses) stands proudly with {MUM_DESC} whose gown "
        f"flows gently in the breeze. {MONKEY_DESC} sits nearby on the wall, "
        f"still munching. {MOSQUE} and its reflection in the blue lake behind. "
        f"Both look happy. Warm tropical light. "
        f"Boy MUST wear his round glasses. Skin {SKIN_HEX}. "
        f"Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page8", "prompt": (
        f"The boy from the reference image (orange t-shirt, blue shorts, round "
        f"glasses) sits on a low wall by Putrajaya Lake with {MUM_DESC}. They "
        f"look out at the view — {MOSQUE} with domes and minarets reflected in "
        f"calm blue water. {MONKEY_DESC} sits nearby contentedly. Both boy and "
        f"mother look happy and peaceful. Warm golden afternoon light. "
        f"Boy MUST wear his round glasses. Skin {SKIN_HEX}. "
        f"Eyes: tiny solid black dots. Landscape."
    )},
]

async def generate_hero_image(session, hero_info, output_path):
    full_prompt = f"{hero_info['description']} {BASE_STYLE}"
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"
    parts = []
    if EYE_REF_PATH.exists():
        eye_b64 = base64.b64encode(EYE_REF_PATH.read_bytes()).decode("utf-8")
        parts.append({"text": "EYE STYLE REFERENCE — copy tiny solid black dot eyes:"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": eye_b64}})
        parts.append({"text": f"Generate NEW character with SAME eye style: {full_prompt}"})
    else:
        parts.append({"text": full_prompt})
    payload = {"contents": [{"parts": parts}], "generationConfig": {"responseModalities": ["IMAGE"]}}
    for attempt in range(MAX_RETRIES):
        try:
            async with session.post(url, json=payload) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    for p in result.get("candidates", [{}])[0].get("content", {}).get("parts", []):
                        if "inlineData" in p:
                            data = base64.b64decode(p["inlineData"]["data"])
                            output_path.write_bytes(data); print(f"  [hero] Saved ({len(data)//1024} KB)")
                            return output_path
                elif resp.status in (429, 503):
                    await asyncio.sleep(BACKOFF_BASE * (2 ** attempt))
                else:
                    print(f"  [hero] Error {resp.status}"); await asyncio.sleep(BACKOFF_BASE * (2 ** attempt))
        except Exception as e:
            print(f"  [hero] {e}"); await asyncio.sleep(BACKOFF_BASE)
    return None

async def generate_scene_image(session, hero_b64, eye_ref_b64, scene):
    full_prompt = f"{scene['prompt']} {BASE_STYLE}"
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"
    parts = []
    if eye_ref_b64:
        parts.append({"text": "EYE STYLE REFERENCE — tiny solid black dots, ZERO white:"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": eye_ref_b64}})
    parts.append({"text": f"CHARACTER REFERENCE — BOY. Keep: brown skin {SKIN_HEX}, black hair, ROUND GLASSES, orange t-shirt, blue shorts, brown sandals:"})
    parts.append({"inlineData": {"mimeType": "image/png", "data": hero_b64}})
    parts.append({"text": f"SCENE TO GENERATE: {full_prompt}"})
    payload = {"contents": [{"parts": parts}], "generationConfig": {"responseModalities": ["IMAGE"]}}
    for attempt in range(MAX_RETRIES):
        try:
            async with session.post(url, json=payload) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    for p in result.get("candidates", [{}])[0].get("content", {}).get("parts", []):
                        if "inlineData" in p:
                            return base64.b64decode(p["inlineData"]["data"])
                    return None
                elif resp.status in (429, 503):
                    await asyncio.sleep(BACKOFF_BASE * (2 ** attempt))
                else:
                    print(f"    Error {resp.status}"); await asyncio.sleep(BACKOFF_BASE * (2 ** attempt))
        except Exception as e:
            print(f"    {e}"); await asyncio.sleep(BACKOFF_BASE)
    return None

async def main():
    mode = sys.argv[1].lower() if len(sys.argv) > 1 else "all"
    if not GEMINI_API_KEY: print("ERROR: No API key"); sys.exit(1)
    print(f"\n{'='*55}\nL4.4: \"The Cheeky Monkey\" — Putrajaya, Malaysia (REGEN + GLASSES)\nOutput: {OUTPUT_DIR}\nMode: {mode}\n{'='*55}")
    hero_path = OUTPUT_DIR / "hero_reference.png"
    async with aiohttp.ClientSession() as session:
        if mode in ("all", "hero"):
            if not hero_path.exists() or mode in ("hero", "all"):
                print("  [hero] Generating...")
                if not await generate_hero_image(session, BOY_HERO, hero_path):
                    print("FATAL: Hero failed"); sys.exit(1)
                await asyncio.sleep(REQUEST_DELAY)
        if mode == "hero": print("Hero done."); return
        if not hero_path.exists(): print("ERROR: No hero"); sys.exit(1)
        hero_b64 = base64.b64encode(hero_path.read_bytes()).decode("utf-8")
        eye_ref_b64 = base64.b64encode(EYE_REF_PATH.read_bytes()).decode("utf-8") if EYE_REF_PATH.exists() else None
        print(f"\n  Generating {len(SCENES)} scenes...\n")
        generated, failed = [], []
        for scene in SCENES:
            out = OUTPUT_DIR / f"{scene['name']}.png"
            print(f"  [{scene['name']}] Generating...")
            data = await generate_scene_image(session, hero_b64, eye_ref_b64, scene)
            if data:
                out.write_bytes(data); print(f"  [{scene['name']}] Saved ({len(data)//1024} KB)")
                generated.append(scene['name'])
            else:
                print(f"  [{scene['name']}] FAILED"); failed.append(scene['name'])
            await asyncio.sleep(REQUEST_DELAY)
        print(f"\n{'='*55}\nGenerated: {len(generated)}/{len(SCENES)}")
        if failed: print(f"Failed: {', '.join(failed)}")
        else: print("All images generated!")
        print(f"Output: {OUTPUT_DIR}\n{'='*55}")

if __name__ == "__main__":
    asyncio.run(main())
