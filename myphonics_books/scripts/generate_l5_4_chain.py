"""
Generate L5.4 "A Place for Me" — Colombian morning market.

Chain-editing workflow:
  1. Generate hero references (visiting boy + local boy)
  2. Generate background plate (empty market street)
  3. Generate page 1 FRESH with references
  4. Each subsequent page: chain from previous OR fresh with refs
  5. Cover: fresh with both refs

Usage:
    py -3.12 scripts/generate_l5_4_chain.py all             # Everything
    py -3.12 scripts/generate_l5_4_chain.py hero1            # Visiting boy ref
    py -3.12 scripts/generate_l5_4_chain.py hero2            # Local boy ref
    py -3.12 scripts/generate_l5_4_chain.py bg               # Background plate
    py -3.12 scripts/generate_l5_4_chain.py page1            # Single page
    py -3.12 scripts/generate_l5_4_chain.py page3 force      # Force regen
    py -3.12 scripts/generate_l5_4_chain.py cover            # Cover
"""

import asyncio
import aiohttp
import os
import sys
import base64
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.environ.get("GOOGLE_GEMINI_API_KEY")
BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
IMAGE_MODEL = "gemini-2.5-flash-image"
OUTPUT_DIR = Path(__file__).parent.parent / "output" / "images" / "L5_4_B1"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

EYE_REF_PATH = Path(__file__).parent.parent / "output" / "images" / "L4_1_B1" / "hero_reference.png"

REQUEST_DELAY = 3
MAX_RETRIES = 3
BACKOFF_BASE = 5

# ─── Style ────────────────────────────────────────────────────────
BASE_STYLE = (
    "Whimsical children's book illustration. Hand-drawn cartoon style with "
    "soft watercolour textured backgrounds and clean black-outlined characters. "
    "CRITICAL EYE RULE: Every character MUST have eyes that are small solid dark "
    "filled OVALS — wider than tall, like a simple almond-shaped cartoon eye. "
    "NO white around the dark fill, NO iris, NO pupil, NO highlight. "
    "Just small simple dark ovals — cute and friendly. "
    "Warm, friendly, inviting. Soft pastel backgrounds with pops of bright colour. "
    "Simple rounded shapes, gentle lighting. Professional picture book quality. "
    "No text, words, letters, or numbers in the image. "
    "CLOTHING RULE: ALL characters (main and background) must wear long trousers "
    "or long dresses — absolutely NO skirts, NO shorts on anyone."
)

# ─── Characters ──────────────────────────────────────────────────
HERO1_DESC = (
    "White British boy, 6 years old, light skin (hex #F0D0B0), short brown hair "
    "with a side parting, blue t-shirt, khaki long trousers, white trainers. "
    "Friendly face, small dark oval eyes with NO white."
)

HERO2_DESC = (
    "Colombian boy, 6 years old, warm brown skin (hex #B8956A), thick curly dark "
    "brown hair (NOT straight, visibly curly/wavy — different from the British boy's "
    "straight hair). Bright green t-shirt, dark blue long trousers, brown sandals. "
    "Big warm friendly smile, round cheeks, expressive animated face. "
    "Small dark oval eyes with NO white."
)

# ─── Setting ─────────────────────────────────────────────────────
SETTING_DESC = (
    "Cartagena, Colombia walled old city morning market. "
    "BOLD vivid coloured Spanish colonial buildings — bright yellow (most common), "
    "terracotta orange, cobalt blue, coral pink, mint green. NOT pastel — SATURATED "
    "vivid colours. 2-3 storey buildings with wooden balconies and iron railings "
    "overflowing with bright pink/magenta bougainvillea. Large ornate dark wooden "
    "doors. Terracotta clay tile roofs. Narrow cobblestone streets. "
    "Tall curved coconut palm trees (NOT straight generic cartoon palms — real "
    "coconut palms lean and curve with feathery fronds). "
    "Fruit vendors with simple wooden tables/carts under canvas shade canopies. "
    "Piles of tropical fruit — bright yellow-orange mangoes, green papayas, "
    "plantains, bananas, green coconuts, limes, passion fruit. "
    "Warm golden morning sunlight."
)

# ─── Chain ────────────────────────────────────────────────────────
CHAIN = [
    {
        "name": "bg_market",
        "base": None,
        "inject_hero1": False,
        "inject_hero2": False,
        "inject_setting": False,
        "prompt": (
            f"Generate an EMPTY background scene with NO characters, NO people. "
            f"{SETTING_DESC} "
            f"Show a narrow cobblestone street in Cartagena's walled old city. "
            f"BOLD vivid coloured colonial buildings on both sides — bright yellow, "
            f"terracotta, cobalt blue. Wooden balconies with iron railings overflowing "
            f"with bright pink bougainvillea. Large dark wooden doors. Terracotta roofs. "
            f"Coconut palms leaning over the street. Fruit vendor carts with canvas "
            f"shade canopies, piled with mangoes and bananas. "
            f"Warm golden morning light. Landscape 1024x768. {BASE_STYLE}"
        ),
    },
    {
        "name": "page1",
        "base": None,
        "inject_hero1": True,
        "inject_hero2": False,
        "inject_setting": False,
        "prompt": (
            f"Show the character from the reference image peering around the corner "
            f"of a bright yellow colonial building in Cartagena, Colombia. He grips "
            f"the edge of the wall with one hand and leans forward, curious. His dad "
            f"(light skin, brown hair, casual shirt, long trousers) stands behind "
            f"him, hand on the boy's shoulder. "
            f"Around the corner they can see a cobblestone street where market vendors "
            f"are setting up — stacking mangoes on a wooden cart, hanging colourful "
            f"cloth. Terracotta orange and cobalt blue buildings with wooden balconies "
            f"overflowing with bright pink bougainvillea. Coconut palms. Terracotta "
            f"tile roofs. Warm golden early morning light. "
            f"Same character, same outfit (blue t-shirt, khaki trousers, white trainers). "
            f"Whimsical children's book illustration. No text. Landscape orientation."
        ),
    },
    {
        "name": "page2",
        "base": None,
        "inject_hero1": True,
        "inject_hero2": False,
        "inject_setting": False,
        "prompt": (
            f"Show the character from the reference image standing on tiptoes trying "
            f"to see over a crowded Cartagena market stall. He is small next to the "
            f"huge piles of tropical fruit — bright yellow mangoes, green papayas, "
            f"fat plantains, bananas, limes — stacked high on a wooden table. "
            f"The market is busy and bustling around him. Other people browse the "
            f"stalls (all in long trousers or long dresses). A canvas shade canopy "
            f"above. Vivid colonial buildings in the background — terracotta, cobalt "
            f"blue — with bougainvillea on the balconies. The boy looks amazed and "
            f"a little overwhelmed. "
            f"Same character, same outfit (blue t-shirt, khaki trousers, white trainers). "
            f"Whimsical children's book illustration. No text. Landscape orientation."
        ),
    },
    {
        "name": "page3",
        "base": None,
        "inject_hero1": True,
        "inject_hero2": False,
        "inject_setting": False,
        "prompt": (
            f"Show the character from the reference image sitting on a stone step "
            f"beside a large ornate dark wooden door of a bright yellow colonial "
            f"building in Cartagena. He hugs his knees, looking down, anxious and "
            f"alone. The busy market carries on in the street in front of him but "
            f"nobody notices him. Vendors calling out, people walking past. "
            f"Pink bougainvillea trails down from the balcony above the door. "
            f"Cobblestone street. Warm light but he feels cold and left out. "
            f"Same character, same outfit (blue t-shirt, khaki trousers, white trainers). "
            f"Whimsical children's book illustration. No text. Landscape orientation."
        ),
    },
    {
        "name": "page4",
        "base": "page3",
        "inject_hero1": False,
        "inject_hero2": True,
        "inject_setting": False,
        "prompt": (
            f"Keep the same scene and same art style. Keep the visiting boy (blue "
            f"t-shirt, khaki trousers) still sitting on the step in the SAME position. "
            f"ADD a second boy — a local Colombian boy (use the HERO2 REFERENCE for "
            f"his appearance — green t-shirt, dark blue trousers, medium-warm skin) "
            f"crouching down beside him with a big friendly grin, pointing toward the "
            f"street. TWO boys must be visible — one sitting, one crouching beside him. "
            f"The visiting boy looks up at the new boy with surprise and a small smile. "
            f"Same yellow building, same wooden door, same bougainvillea. "
            f"Whimsical children's book illustration. No text. Landscape orientation."
        ),
    },
    {
        "name": "page5",
        "base": "page4",
        "inject_hero1": False,
        "inject_hero2": False,
        "inject_setting": False,
        "prompt": (
            f"Keep the same two boys and same art style. New scene: "
            f"The local boy (green t-shirt) stands behind a market stall piled high "
            f"with mangoes and holds up a huge ripe yellow mango triumphantly above "
            f"his head, grinning. The visiting boy (blue t-shirt) stands on the other "
            f"side of the stall, leaning forward, eyes wide, impressed and laughing. "
            f"Piles of tropical fruit around them — mangoes, papayas, green limes, "
            f"plantains. Canvas shade canopy above. Cartagena colonial buildings in "
            f"the background. "
            f"Whimsical children's book illustration. No text. Landscape orientation."
        ),
    },
    {
        "name": "page6",
        "base": "page5",
        "inject_hero1": False,
        "inject_hero2": False,
        "inject_setting": False,
        "prompt": (
            f"Keep the same two boys and same art style. New scene: "
            f"Both boys sit side by side on a low stone step in the shade of a "
            f"terracotta colonial building, each eating a big ripe mango with their "
            f"hands. The visiting boy (blue t-shirt) has mango juice dripping down "
            f"his chin and is laughing. The local boy (green t-shirt) takes a huge "
            f"bite. Mango skins and seeds on the step beside them. "
            f"A cobblestone street with market stalls visible in the background. "
            f"Warm relaxed moment between friends. "
            f"Whimsical children's book illustration. No text. Landscape orientation."
        ),
    },
    {
        "name": "page7",
        "base": "page6",
        "inject_hero1": False,
        "inject_hero2": False,
        "inject_setting": False,
        "prompt": (
            f"Keep the same two boys and same art style. New scene: "
            f"The local Colombian boy (curly hair, green t-shirt) stands up excitedly "
            f"and points down a busy Cartagena market street. The visiting boy (blue "
            f"t-shirt) jumps to his feet, eyes wide — he has spotted his dad in the "
            f"distance! The dad (light skin, brown hair, casual shirt) is visible "
            f"further down the cobblestone street, looking around searching. "
            f"Colourful colonial buildings, market stalls, bougainvillea. "
            f"Excitement and relief on the visiting boy's face. "
            f"Whimsical children's book illustration. No text. Landscape orientation."
        ),
    },
    {
        "name": "page8",
        "base": "page7",
        "inject_hero1": False,
        "inject_hero2": False,
        "inject_setting": False,
        "prompt": (
            f"Keep the same art style. New scene: "
            f"The dad (light skin, brown hair) kneels on the cobblestone street "
            f"hugging the visiting boy (blue t-shirt) tightly, relief on both faces. "
            f"The local Colombian boy (curly hair, green t-shirt) stands beside them "
            f"smiling warmly. The dad reaches one hand out to the local boy in thanks. "
            f"Colourful Cartagena buildings behind, warm golden light, market stalls. "
            f"A warm happy reunion. "
            f"Whimsical children's book illustration. No text. Landscape orientation."
        ),
    },
    {
        "name": "cover",
        "base": None,
        "inject_hero1": True,
        "inject_hero2": True,
        "inject_setting": True,
        "prompt": (
            f"PORTRAIT orientation (768x1024) BOOK COVER. "
            f"WIDE SHOT of a colourful Colombian morning market. "
            f"Use the SETTING REFERENCE for the market — colourful buildings stretch "
            f"up high, market stalls with fruit, tropical trees. "
            f"The market is the STAR — fills most of the image. "
            f"In the LOWER HALF, two boys stand together, taking up about 40% of "
            f"image height. Visiting boy ({HERO1_DESC}) on the right. "
            f"Local boy ({HERO2_DESC}) on the left. "
            f"Both smiling at the viewer. NOT holding hands. "
            f"Leave blank space at the very top for a title. "
            f"{BASE_STYLE} Portrait 768x1024."
        ),
    },
]


# ─── API ─────────────────────────────────────────────────────────

async def load_b64(path: Path) -> str | None:
    if not path.exists():
        print(f"[ERR] Not found: {path}")
        return None
    return base64.standard_b64encode(path.read_bytes()).decode("utf-8")


async def generate_with_retry(session, parts, retries=MAX_RETRIES):
    for attempt in range(retries):
        try:
            url = f"{BASE_URL}/models/{IMAGE_MODEL}:generateContent?key={GEMINI_API_KEY}"
            payload = {
                "contents": [{"parts": parts}],
                "generationConfig": {"responseModalities": ["IMAGE"]},
            }
            async with session.post(url, json=payload) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    cands = result.get("candidates", [])
                    if cands and "content" in cands[0]:
                        for part in cands[0]["content"].get("parts", []):
                            if "inlineData" in part and "data" in part["inlineData"]:
                                return base64.b64decode(part["inlineData"]["data"])
                            if "text" in part:
                                print(f"  API text: {part['text'][:200]}")
                                return None
                    print(f"  Unexpected response structure")
                    return None
                elif resp.status == 429:
                    wait = BACKOFF_BASE ** (attempt + 1)
                    print(f"  Rate limited — waiting {wait}s...")
                    await asyncio.sleep(wait)
                else:
                    text = await resp.text()
                    print(f"  Error {resp.status}: {text[:200]}")
                    if attempt < retries - 1:
                        await asyncio.sleep(REQUEST_DELAY)
        except Exception as e:
            print(f"  Attempt {attempt+1} failed: {e}")
            if attempt < retries - 1:
                await asyncio.sleep(REQUEST_DELAY)
    return None


async def generate_hero(session, name, desc, eye_b64):
    """Generate a hero reference image."""
    out_path = OUTPUT_DIR / f"{name}.png"
    print(f"  [{name}] Generating hero reference...")

    # Use L5.3 hero as style reference — matches our series look
    style_ref_path = Path(__file__).parent.parent / "output" / "images" / "L5_3_B1" / "hero_reference.png"

    prompt = (
        f"Generate a NEW character in the EXACT SAME art style as the reference "
        f"image — same line weight, same colouring style, same proportions, same "
        f"eye style (small dark ovals). The new character is: {desc} "
        f"Standing in a neutral pose facing the viewer, full body visible head to toe. "
        f"Arms slightly away from body, feet shoulder-width apart. "
        f"Plain light cream solid-colour background (no scenery). "
        f"{BASE_STYLE}"
    )

    parts = []
    if style_ref_path.exists():
        style_b64 = base64.standard_b64encode(style_ref_path.read_bytes()).decode("utf-8")
        parts.append({"text": "ART STYLE REFERENCE — match this exact style, proportions, and eye style for the new character:"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": style_b64}})
    elif eye_b64:
        parts.append({"text": "EYE STYLE REFERENCE — copy this exact eye style:"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": eye_b64}})
    parts.append({"text": prompt})

    img = await generate_with_retry(session, parts)
    if img:
        out_path.write_bytes(img)
        print(f"  [{name}] Saved ({len(img)/1024:.0f} KB)")
        return True
    print(f"  [{name}] FAILED")
    return False


async def generate_step(session, step, hero1_b64, hero2_b64, setting_b64, eye_b64, force=False):
    name = step["name"]
    out_path = OUTPUT_DIR / f"{name}.png"

    if out_path.exists() and not force:
        print(f"  [{name}] Already exists — skipping")
        return True

    print(f"  [{name}] Generating...")
    parts = []

    # Count injections to decide if we can fit eye ref
    img_count = sum([
        bool(step.get("base")),
        bool(step.get("inject_hero1") and hero1_b64),
        bool(step.get("inject_hero2") and hero2_b64),
        bool(step.get("inject_setting") and setting_b64),
    ])

    if eye_b64 and img_count < 2:
        parts.append({"text": "EYE STYLE REFERENCE — copy this exact eye style (small dark ovals, NO white):"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": eye_b64}})

    # Chain base
    if step.get("base"):
        base_path = OUTPUT_DIR / f"{step['base']}.png"
        if not base_path.exists():
            print(f"  [{name}] ERROR: base {step['base']}.png not found")
            return False
        base_b64 = await load_b64(base_path)
        parts.append({"text": "PREVIOUS PAGE — keep same style and characters unless told otherwise:"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": base_b64}})

    if step.get("inject_hero1") and hero1_b64:
        parts.append({"text": "HERO 1 REFERENCE (visiting boy) — use for appearance only, draw naturally:"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": hero1_b64}})

    if step.get("inject_hero2") and hero2_b64:
        parts.append({"text": "HERO 2 REFERENCE (local boy) — use for appearance only, draw naturally:"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": hero2_b64}})

    if step.get("inject_setting") and setting_b64:
        parts.append({"text": "SETTING REFERENCE — maintain this architecture and market style:"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": setting_b64}})

    parts.append({"text": step["prompt"]})

    img = await generate_with_retry(session, parts)
    if img:
        out_path.write_bytes(img)
        print(f"  [{name}] Saved ({len(img)/1024:.0f} KB)")
        return True
    print(f"  [{name}] FAILED")
    return False


async def main():
    if not GEMINI_API_KEY:
        print("[ERR] GOOGLE_GEMINI_API_KEY not set")
        sys.exit(1)

    target = sys.argv[1] if len(sys.argv) > 1 else "all"
    force = "force" in sys.argv

    async with aiohttp.ClientSession() as session:
        eye_b64 = await load_b64(EYE_REF_PATH) if EYE_REF_PATH.exists() else None

        # Hero generation commands
        if target == "hero1":
            await generate_hero(session, "hero1_reference", HERO1_DESC, eye_b64)
            return
        if target == "hero2":
            await generate_hero(session, "hero2_reference", HERO2_DESC, eye_b64)
            return

        # Load references
        hero1_b64 = await load_b64(OUTPUT_DIR / "hero1_reference.png")
        hero2_b64 = await load_b64(OUTPUT_DIR / "hero2_reference.png")
        setting_b64 = None

        bg_path = OUTPUT_DIR / "bg_market.png"
        if bg_path.exists():
            setting_b64 = await load_b64(bg_path)

        if target == "all":
            if not hero1_b64 or not hero2_b64:
                print("[ERR] Generate hero1 and hero2 first")
                sys.exit(1)
            for step in CHAIN:
                ok = await generate_step(session, step, hero1_b64, hero2_b64, setting_b64, eye_b64, force)
                if not ok:
                    print(f"[ERR] Failed at {step['name']}")
                    break
                if step["name"] == "bg_market":
                    setting_b64 = await load_b64(OUTPUT_DIR / "bg_market.png")
                await asyncio.sleep(REQUEST_DELAY)
        else:
            step = next((s for s in CHAIN if s["name"] == target), None)
            if not step:
                print(f"[ERR] Unknown: {target}")
                print(f"Valid: hero1, hero2, {', '.join(s['name'] for s in CHAIN)}")
                sys.exit(1)
            await generate_step(session, step, hero1_b64, hero2_b64, setting_b64, eye_b64, force)

    print("\n[OK] Done!")

if __name__ == "__main__":
    asyncio.run(main())
