"""
Generate illustrations for L2.1 "Night Lights" using Gemini API.
COMPLETE REGENERATION — replacing stereotypical zen garden version.

Setting: Contemporary Tokyo, Japan — modern city streets at night
Main character: Japanese boy (5-6, blue puffer jacket, grey joggers)
Side character: Dad (dark navy coat)
Key object: Small stuffed orange tabby toy cat (pages 7-8 only)

Usage:
    py -3.12 scripts/generate_l2_1_images.py           # Generate all
    py -3.12 scripts/generate_l2_1_images.py hero       # Hero only
    py -3.12 scripts/generate_l2_1_images.py scenes     # Scenes only
"""

import asyncio, aiohttp, os, sys, base64
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

GEMINI_API_KEY = os.environ.get("GOOGLE_GEMINI_API_KEY")
BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
OUTPUT_DIR = Path(__file__).parent.parent / "output" / "images" / "L2_1_B1"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
EYE_REF_PATH = Path(__file__).parent.parent / "output" / "images" / "L4_1_B1" / "hero_reference.png"
REQUEST_DELAY = 4; MAX_RETRIES = 3; BACKOFF_BASE = 5

SKIN_HEX = "#D4A574"; HAIR_HEX = "#1A1110"

BASE_STYLE = (
    "Whimsical children's book illustration. Hand-drawn cartoon style with "
    "soft watercolour textured backgrounds and clean black-outlined characters. "
    "CRITICAL EYE RULE: Every character MUST have eyes that are tiny solid black "
    "filled circles like dots. NO white, NO iris, NO highlight. "
    "Warm, friendly. No text, words, letters, or numbers in the image."
)

BOY_HERO = {
    "description": (
        f"A cartoon boy character, about 5 years old, with light-medium East Asian "
        f"skin hex {SKIN_HEX}. Straight short neat black hair hex {HAIR_HEX}. "
        f"He wears a puffy blue puffer jacket (quilted, modern), grey joggers, "
        f"and white trainers. "
        f"Solid black dot eyes — ZERO white. "
        f"Friendly curious expression. "
        f"NO rosy cheeks. Standing neutral pose, full body, plain cream background."
    ),
}

DAD_DESC = (
    "Japanese dad (30s, skin #D4A574, short black hair, clean-shaven, warm "
    "expression, dark navy winter coat, dark trousers, dark shoes)"
)

TOKYO_NIGHT = (
    "modern Tokyo city street at night: bright street lights, glowing vending "
    "machines (drink machines with colourful lit panels), a lit-up konbini "
    "(convenience store with bright fluorescent lights), modern apartment "
    "buildings with warm lit windows, clean pavements"
)

TOY_CAT = (
    "a small stuffed orange tabby cat toy — soft, plush, well-loved, about "
    "the size of a child's hand"
)

SCENES = [
    {"name": "cover", "prompt": (
        f"Show the boy from the reference image (blue puffer jacket, grey joggers) "
        f"hugging {TOY_CAT} on a {TOKYO_NIGHT}. Behind him, {DAD_DESC} smiles. "
        f"Tokyo at night feels magical and safe — warm golden street lights, "
        f"glowing shops, colourful vending machines. "
        f"Skin {SKIN_HEX}. Eyes: tiny solid black dots. Portrait 3:4."
    )},
    {"name": "page1", "prompt": (
        f"Show the boy from the reference image (blue puffer jacket, grey joggers) "
        f"standing in a modern minimalist Japanese apartment, looking worried, "
        f"patting sofa cushions, searching for something. A window shows Tokyo "
        f"city at dusk — modern buildings, lights coming on. The toy cat is NOT "
        f"visible anywhere. Clean modern apartment interior. "
        f"Skin {SKIN_HEX}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page2", "prompt": (
        f"Show the boy from the reference image (blue puffer jacket) and {DAD_DESC} "
        f"stepping out of a modern Tokyo apartment building onto a {TOKYO_NIGHT}. "
        f"The boy looks up at all the bright city lights with wonder. Street lights "
        f"and building lights rise high above them. "
        f"Skin {SKIN_HEX}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page3", "prompt": (
        f"Show the boy from the reference image (blue puffer jacket) peering through "
        f"the bright glass window of a lit-up Japanese konbini (convenience store) "
        f"at night, hands pressed against glass, searching inside. Bright fluorescent "
        f"light floods out. Colourful drinks and snacks visible. {DAD_DESC} stands "
        f"behind him on the pavement. Boy looks disappointed — not finding it. "
        f"Skin {SKIN_HEX}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page4", "prompt": (
        f"Show the boy from the reference image (blue puffer jacket) pointing down "
        f"a darker Tokyo side street at night. {DAD_DESC} walks beside him. Some "
        f"street lights and a glowing vending machine visible, but the street is "
        f"dimmer. Boy looks uncertain. Modern apartment buildings cast shadows. "
        f"Skin {SKIN_HEX}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page5", "prompt": (
        f"Show the boy from the reference image (blue puffer jacket) looking up at "
        f"a big bright full moon high above the Tokyo buildings. His face shows "
        f"wonder mixed with disappointment. {DAD_DESC} beside him, also looking up. "
        f"Modern Tokyo skyline silhouettes and lit windows frame the bright moon. "
        f"Skin {SKIN_HEX}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page6", "prompt": (
        f"Show the boy from the reference image (blue puffer jacket) looking dejected, "
        f"shoulders slumped, on a Tokyo street at night. {DAD_DESC} crouches down to "
        f"his level with an encouraging expression, one hand on the boy's shoulder. "
        f"Vending machines glow behind them. A bicycle parked nearby. "
        f"Skin {SKIN_HEX}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page7", "prompt": (
        f"{DAD_DESC} points excitedly at a bright street light illuminating a low "
        f"wall where {TOY_CAT} sits, clearly visible in the pool of light. The boy "
        f"from the reference image (blue puffer jacket) rushes towards it with arms "
        f"outstretched, face full of joy. Bright street light above. {TOKYO_NIGHT}. "
        f"Skin {SKIN_HEX}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page8", "prompt": (
        f"Show the boy from the reference image (blue puffer jacket) hugging {TOY_CAT} "
        f"tight to his chest, beaming with joy. {DAD_DESC} stands beside him smiling "
        f"warmly, hand on the boy's head. {TOKYO_NIGHT} behind them, beautifully lit. "
        f"Warm, happy ending. "
        f"Skin {SKIN_HEX}. Eyes: tiny solid black dots. Landscape."
    )},
]


async def gen_image(session, parts):
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"
    payload = {"contents": [{"parts": parts}], "generationConfig": {"responseModalities": ["IMAGE"]}}
    for attempt in range(MAX_RETRIES):
        try:
            async with session.post(url, json=payload) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    for p in result.get("candidates", [{}])[0].get("content", {}).get("parts", []):
                        if "inlineData" in p:
                            return base64.b64decode(p["inlineData"]["data"])
                elif resp.status in (429, 503):
                    await asyncio.sleep(BACKOFF_BASE * (2 ** attempt))
                else:
                    print(f"    Error {resp.status}")
                    await asyncio.sleep(BACKOFF_BASE * (2 ** attempt))
        except Exception as e:
            print(f"    {e}"); await asyncio.sleep(BACKOFF_BASE)
    return None


async def main():
    mode = sys.argv[1].lower() if len(sys.argv) > 1 else "all"
    if not GEMINI_API_KEY: print("ERROR: No API key"); sys.exit(1)

    print(f"\n{'='*55}")
    print(f'L2.1: "Night Lights" — Contemporary Tokyo (REGEN)')
    print(f"Output: {OUTPUT_DIR}\nMode: {mode}")
    print(f"{'='*55}")

    eye_b64 = base64.b64encode(EYE_REF_PATH.read_bytes()).decode("utf-8") if EYE_REF_PATH.exists() else None
    hero_path = OUTPUT_DIR / "hero_reference.png"

    async with aiohttp.ClientSession() as session:

        if mode in ("all", "hero"):
            print("\n[hero] Generating...")
            parts = []
            if eye_b64:
                parts.append({"text": "EYE STYLE — copy tiny solid black dot eyes:"})
                parts.append({"inlineData": {"mimeType": "image/png", "data": eye_b64}})
            parts.append({"text": f"Generate: {BOY_HERO['description']} {BASE_STYLE}"})
            data = await gen_image(session, parts)
            if data:
                hero_path.write_bytes(data)
                print(f"[hero] Saved ({len(data)//1024} KB)")
            else:
                print("FATAL: Hero failed"); sys.exit(1)
            await asyncio.sleep(REQUEST_DELAY)

        if mode == "hero":
            print("Hero done."); return

        if not hero_path.exists():
            print("ERROR: No hero"); sys.exit(1)
        hero_b64 = base64.b64encode(hero_path.read_bytes()).decode("utf-8")

        print(f"\n  Generating {len(SCENES)} scenes...\n")
        generated, failed = [], []

        for scene in SCENES:
            out = OUTPUT_DIR / f"{scene['name']}.png"
            print(f"  [{scene['name']}] Generating...")
            parts = []
            if eye_b64:
                parts.append({"text": "EYE STYLE — ALL characters: tiny solid black dots:"})
                parts.append({"inlineData": {"mimeType": "image/png", "data": eye_b64}})
            parts.append({"text": f"CHARACTER — BOY. Keep: East Asian skin {SKIN_HEX}, black hair, blue puffer jacket, grey joggers, white trainers:"})
            parts.append({"inlineData": {"mimeType": "image/png", "data": hero_b64}})
            parts.append({"text": f"SCENE: {scene['prompt']} {BASE_STYLE}"})

            data = await gen_image(session, parts)
            if data:
                out.write_bytes(data)
                print(f"  [{scene['name']}] Saved ({len(data)//1024} KB)")
                generated.append(scene["name"])
            else:
                print(f"  [{scene['name']}] FAILED")
                failed.append(scene["name"])
            await asyncio.sleep(REQUEST_DELAY)

        print(f"\n{'='*55}")
        print(f"Generated: {len(generated)}/{len(SCENES)}")
        if failed: print(f"Failed: {', '.join(failed)}")
        else: print("All images generated!")
        print(f"{'='*55}")


if __name__ == "__main__":
    asyncio.run(main())
