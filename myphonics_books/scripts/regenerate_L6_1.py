"""
Regenerate L6.1 "The Marvellous Neighbourhood" images using the full injection system.

NEW INJECTION TYPES (from updated illustration-director skill):
  - Main hero reference (Yusuf — already exists)
  - Side character reference (the storyteller)
  - Background plates (corniche, street)
  - Object reference (notebook)

Each scene gets the exact references it needs per the injection plan.

Usage:
    python scripts/regenerate_L6_1.py              # Generate refs + all scenes
    python scripts/regenerate_L6_1.py refs          # Generate reference images only
    python scripts/regenerate_L6_1.py scenes        # Generate scenes only (refs must exist)
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
BOOK_DIR.mkdir(parents=True, exist_ok=True)

REQUEST_DELAY = 3
MAX_RETRIES = 3
BACKOFF_BASE = 5

BASE_STYLE = (
    "Whimsical children's book illustration. Hand-drawn cartoon style with "
    "soft watercolour textured backgrounds and clean black-outlined characters. "
    "CRITICAL EYE RULE: Every character MUST have eyes that are "
    "tiny solid black filled circles like dots drawn with a black marker pen. "
    "NO white around the black, NO iris, NO pupil, NO highlight, NO detail. "
    "Just small simple black dots — cute and friendly like a teddy bear's eyes. "
    "Warm, friendly, inviting. Soft pastel backgrounds with pops of bright colour. "
    "Simple rounded shapes, gentle lighting. Professional picture book quality. "
    "No text, words, letters, or numbers in the image."
)

# ─── Reference Image Prompts ──────────────────────────────────

STORYTELLER_PROMPT = (
    "A cartoon adult man character, about 60-65 years old, with medium brown skin "
    "(skin colour #B8956A) and short grey hair with a short grey beard. "
    "He wears a white linen collared shirt (slightly crumpled, sleeves rolled to elbows), "
    "light stone-coloured trousers, and brown leather sandals. "
    "He carries a small worn brown leather notebook in one hand. "
    "He has a warm, wise, intelligent expression with a knowing smile. "
    "He has small friendly dot eyes, solid black, tiny and cute like a teddy bear — not too big. "
    "He is TALL — a fully grown adult man, much taller than a child. "
    "Standing in a neutral pose, facing the viewer, full body visible from head to toe. "
    "Arms slightly away from body, feet shoulder-width apart. "
    "Plain light warm sand solid-colour background (no scenery, no objects, no patterns)."
)

BG_CORNICHE_PROMPT = (
    "A wide establishing shot of the Cairo Nile corniche — a broad modern road running "
    "along the River Nile. The broad grey-green Nile stretches across the middle ground "
    "with white-sailed feluccas drifting on the water. Modern Cairo buildings line the "
    "far bank. A decorative iron railing and palm trees line the near side of the road. "
    "Green lampposts along the corniche. In the far hazy golden distance, the tiny "
    "silhouettes of the three Giza pyramids are just visible on the horizon. "
    "Warm afternoon sunlight, hazy golden sky. "
    "Wide landscape shot. NO characters or people anywhere in the scene. "
    "Landscape format (4:3). "
    "Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour "
    "textured backgrounds, warm friendly atmosphere. No text, words, or letters in the image."
)

BG_STREET_PROMPT = (
    "A wide establishing shot of a Cairo residential street. Rows of cream-coloured "
    "apartment blocks with balconies line both sides of the road. Palm trees grow between "
    "the buildings. A few parked cars along the kerb. In the distance, market stalls and "
    "vendors' carts are visible around a corner. A slim white minaret rises above the "
    "rooftops in the background. Concrete front steps lead up to apartment entrances. "
    "Warm afternoon sunlight, bright blue sky. "
    "Wide landscape shot. NO characters or people anywhere in the scene. "
    "Landscape format (4:3). "
    "Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour "
    "textured backgrounds, warm friendly atmosphere. No text, words, or letters in the image."
)

NOTEBOOK_PROMPT = (
    "A small worn brown leather notebook, closed. The leather cover is slightly scuffed "
    "and well-used, with rounded corners and a thin leather strap closure. "
    "The notebook is about the size of a child's hand — small and portable. "
    "Warm brown leather colour with subtle darker creases. "
    "Isolated object on a plain white background, no scene, no characters. "
    "Clear view showing all key identifying details. "
    "Whimsical children's book illustration style, hand-drawn cartoon, clean black outline, "
    "soft colours. No text, words, or letters in the image."
)

# ─── Scene Prompts with Injection Plan ─────────────────────────

YUSUF_SHORT = "Yusuf (the Egyptian boy in the bright yellow t-shirt and light grey trousers)"

SCENES = [
    {
        "name": "cover",
        "inject": {"hero": True, "storyteller": False, "bg_corniche": True, "bg_street": False, "notebook": False},
        "prompt": (
            f"BOOK COVER ILLUSTRATION. Show {YUSUF_SHORT} standing on the Nile corniche "
            "with arms spread wide and a huge delighted smile, looking up at his neighbourhood. "
            "Use the BACKGROUND REFERENCE for the corniche setting — maintain the architecture, "
            "river, feluccas, and distant pyramids identically. "
            "Warm golden afternoon light bathes the scene. "
            "Same character, same outfit, same appearance as the MAIN CHARACTER REFERENCE. "
            "Portrait orientation (3:4)."
        ),
    },
    {
        "name": "page1",
        "inject": {"hero": True, "storyteller": True, "bg_corniche": False, "bg_street": True, "notebook": True},
        "prompt": (
            f"Show {YUSUF_SHORT} sitting on the concrete front steps of a cream-coloured "
            "Cairo apartment block, chin resting on his hand, looking bored and frowning. "
            "Use the BACKGROUND REFERENCE for the street setting — maintain the apartment blocks, "
            "palm trees, and distant market stalls identically. "
            "The SIDE CHARACTER (the storyteller — older man in white linen shirt) approaches and "
            "sits down beside him, carrying the small worn brown leather notebook (OBJECT REFERENCE). "
            "Warm afternoon sunlight. "
            "Same characters as their REFERENCE images. Landscape orientation."
        ),
    },
    {
        "name": "page2",
        "inject": {"hero": True, "storyteller": True, "bg_corniche": False, "bg_street": True, "notebook": False},
        "prompt": (
            f"Show {YUSUF_SHORT} sitting on apartment steps with arms crossed, looking sceptical. "
            "The SIDE CHARACTER (the storyteller) leans forward with sparkling, knowing eyes, "
            "talking animatedly to Yusuf with one hand gesturing expressively. "
            "Use the BACKGROUND REFERENCE for the street setting — maintain the cream apartment "
            "blocks, palm trees, and cars identically. "
            "Warm afternoon light. "
            "Same characters as their REFERENCE images. Landscape orientation."
        ),
    },
    {
        "name": "page3",
        "inject": {"hero": True, "storyteller": True, "bg_corniche": True, "bg_street": False, "notebook": False},
        "prompt": (
            f"Show {YUSUF_SHORT} and the SIDE CHARACTER (the storyteller) standing together "
            "on the Nile corniche. The storyteller points across the broad river with one hand. "
            "Use the BACKGROUND REFERENCE for the corniche — maintain the Nile, feluccas, "
            "far bank buildings, iron railing, palm trees, and lampposts identically. "
            "Yusuf stares at the grey-green water with wide, wondering eyes, seeing it "
            "as if for the very first time. "
            "Same characters as their REFERENCE images. Landscape orientation."
        ),
    },
    {
        "name": "page4",
        "inject": {"hero": True, "storyteller": True, "bg_corniche": False, "bg_street": False, "notebook": False},
        "prompt": (
            f"Show {YUSUF_SHORT} and the SIDE CHARACTER (the storyteller) standing at the open "
            "door of a small neighbourhood bakery set in a cream-coloured building with painted "
            "green wooden shutters. Inside the bakery, an older baker in a white apron holds out "
            "a round golden flatbread (aish baladi). Steam rises from a clay oven behind him. "
            "Warm golden tones fill the scene. Yusuf's eyes go wide at the bread. "
            "Same characters as their REFERENCE images. Landscape orientation."
        ),
    },
    {
        "name": "page5",
        "inject": {"hero": True, "storyteller": True, "bg_corniche": False, "bg_street": False, "notebook": False},
        "prompt": (
            f"Show {YUSUF_SHORT} and the SIDE CHARACTER (the storyteller) walking along a Cairo "
            "street. The storyteller points upward at a slim white minaret rising above "
            "cream-coloured apartment buildings. On a low sunny wall nearby, three street cats — "
            "orange, grey, and white — lounge contentedly in the sun. "
            "In the distance behind the buildings, a glimpse of the Nile with a sailing boat. "
            "Yusuf looks up at the minaret with a thoughtful, less bored expression. "
            "Same characters as their REFERENCE images. Landscape orientation."
        ),
    },
    {
        "name": "page6",
        "inject": {"hero": True, "storyteller": False, "bg_corniche": True, "bg_street": False, "notebook": False},
        "prompt": (
            f"Show {YUSUF_SHORT} standing alone on the corniche, arms slightly spread, "
            "gazing around him with wide, amazed, joyful eyes. His face shows pure wonder. "
            "Use the BACKGROUND REFERENCE for the corniche — maintain the Nile, apartment blocks, "
            "minaret, and distant golden hazy pyramids identically. "
            "Warm golden afternoon light over the whole scene. "
            "Same character as the MAIN CHARACTER REFERENCE. Landscape orientation."
        ),
    },
    {
        "name": "page7",
        "inject": {"hero": True, "storyteller": True, "bg_corniche": False, "bg_street": False, "notebook": True},
        "prompt": (
            f"Show {YUSUF_SHORT} sitting on a low wall, the small worn brown leather notebook "
            "(OBJECT REFERENCE) open on his lap, a blue biro pen in his hand, tongue poking out "
            "in concentration as he writes. The SIDE CHARACTER (the storyteller) stands beside him, "
            "smiling warmly and watching. Cairo neighbourhood buildings visible in the background. "
            "The open notebook page shows hand-drawn labels. "
            "Same characters as their REFERENCE images. Landscape orientation."
        ),
    },
    {
        "name": "page8",
        "inject": {"hero": True, "storyteller": False, "bg_corniche": False, "bg_street": True, "notebook": True},
        "prompt": (
            f"Show {YUSUF_SHORT} sitting on the front steps of his apartment block, "
            "the small worn brown leather notebook (OBJECT REFERENCE) open on his lap, "
            "smiling contentedly at the busy street around him. He looks happy and at peace. "
            "Use the BACKGROUND REFERENCE for the street setting — maintain the apartment blocks, "
            "palm trees, and distant market identically. "
            "Street cats, distant minaret, palm trees catching warm golden evening sunset light. "
            "Warm glowing sunset colours. "
            "Same character as the MAIN CHARACTER REFERENCE. Landscape orientation."
        ),
    },
]


# ─── Generation Functions ──────────────────────────────────────

async def generate_reference_image(
    session: aiohttp.ClientSession, prompt: str, output_path: Path, label: str
) -> Path | None:
    """Generate a text-to-image reference (side hero, bg plate, or object ref)."""
    full_prompt = f"{prompt} {BASE_STYLE}"
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"

    payload = {
        "contents": [{"parts": [{"text": full_prompt}]}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }

    print(f"  [{label}] Generating...")

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
                                output_path.write_bytes(image_data)
                                size_kb = len(image_data) / 1024
                                print(f"  [{label}] Saved ({size_kb:.0f} KB) -> {output_path.name}")
                                return output_path
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
            print(f"  [{label}] Request error: {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(BACKOFF_BASE)
            continue

    return None


async def generate_scene_with_injection(
    session: aiohttp.ClientSession,
    prompt: str,
    refs: dict[str, str],  # name -> base64
    label: str,
) -> bytes | None:
    """Generate a scene with multiple reference image injections."""

    full_prompt = f"{prompt} {BASE_STYLE}"
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"

    # Build parts list with labelled references
    parts = []

    if "hero" in refs:
        parts.append({"text": "MAIN CHARACTER REFERENCE — Keep this character's exact face, outfit, hair, and proportions in the generated scene:"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": refs["hero"]}})

    if "storyteller" in refs:
        parts.append({"text": "SIDE CHARACTER REFERENCE — This is the storyteller. Keep this character's face, outfit, hair, and proportions identical:"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": refs["storyteller"]}})

    if "bg_corniche" in refs:
        parts.append({"text": "BACKGROUND REFERENCE — This is the Nile corniche setting. Maintain this architecture, river, vegetation, and lighting identically:"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": refs["bg_corniche"]}})

    if "bg_street" in refs:
        parts.append({"text": "BACKGROUND REFERENCE — This is the Cairo street setting. Maintain these apartment blocks, palm trees, and market identically:"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": refs["bg_street"]}})

    if "notebook" in refs:
        parts.append({"text": "OBJECT REFERENCE — This is the worn brown leather notebook. Keep this object's appearance, colour, and style identical wherever it appears:"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": refs["notebook"]}})

    parts.append({"text": f"SCENE TO GENERATE: {full_prompt}"})

    ref_count = len([k for k in refs])
    print(f"  [{label}] Generating with {ref_count} reference(s): {', '.join(refs.keys())}...")

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
            print(f"  [{label}] Request error: {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(BACKOFF_BASE)
            continue

    return None


# ─── Main Pipeline ─────────────────────────────────────────────

async def generate_references(session: aiohttp.ClientSession) -> dict[str, Path]:
    """Generate all reference images (side char, bg plates, object ref)."""
    refs = {}

    # Hero already exists
    hero_path = BOOK_DIR / "hero_reference.png"
    if hero_path.exists():
        print(f"  [hero] Using existing hero: {hero_path.name}")
        refs["hero"] = hero_path
    else:
        print("  [hero] ERROR: hero_reference.png not found! Generate it first.")
        return refs

    # Side character: storyteller
    storyteller_path = BOOK_DIR / "side_storyteller_reference.png"
    if not storyteller_path.exists():
        result = await generate_reference_image(session, STORYTELLER_PROMPT, storyteller_path, "storyteller")
        if result:
            refs["storyteller"] = storyteller_path
        await asyncio.sleep(REQUEST_DELAY)
    else:
        print(f"  [storyteller] Using existing: {storyteller_path.name}")
        refs["storyteller"] = storyteller_path

    # Background plate: corniche
    corniche_path = BOOK_DIR / "bg_corniche.png"
    if not corniche_path.exists():
        result = await generate_reference_image(session, BG_CORNICHE_PROMPT, corniche_path, "bg_corniche")
        if result:
            refs["bg_corniche"] = corniche_path
        await asyncio.sleep(REQUEST_DELAY)
    else:
        print(f"  [bg_corniche] Using existing: {corniche_path.name}")
        refs["bg_corniche"] = corniche_path

    # Background plate: street
    street_path = BOOK_DIR / "bg_street.png"
    if not street_path.exists():
        result = await generate_reference_image(session, BG_STREET_PROMPT, street_path, "bg_street")
        if result:
            refs["bg_street"] = street_path
        await asyncio.sleep(REQUEST_DELAY)
    else:
        print(f"  [bg_street] Using existing: {street_path.name}")
        refs["bg_street"] = street_path

    # Object reference: notebook
    notebook_path = BOOK_DIR / "obj_notebook.png"
    if not notebook_path.exists():
        result = await generate_reference_image(session, NOTEBOOK_PROMPT, notebook_path, "obj_notebook")
        if result:
            refs["notebook"] = notebook_path
        await asyncio.sleep(REQUEST_DELAY)
    else:
        print(f"  [obj_notebook] Using existing: {notebook_path.name}")
        refs["notebook"] = notebook_path

    return refs


async def generate_scenes(session: aiohttp.ClientSession, ref_paths: dict[str, Path]):
    """Generate all scene images with full reference injection."""

    # Convert all reference images to base64
    ref_b64 = {}
    for name, path in ref_paths.items():
        if path.exists():
            ref_b64[name] = base64.b64encode(path.read_bytes()).decode("utf-8")
            print(f"  [load] {name}: {len(ref_b64[name])} chars")

    generated = []

    for scene in SCENES:
        output_path = BOOK_DIR / f"{scene['name']}.png"

        # Back up old image
        if output_path.exists():
            backup_path = BOOK_DIR / f"{scene['name']}_old.png"
            output_path.rename(backup_path)
            print(f"  [{scene['name']}] Backed up old image -> {backup_path.name}")

        # Build injection dict for this scene
        scene_refs = {}
        inject = scene["inject"]
        if inject.get("hero") and "hero" in ref_b64:
            scene_refs["hero"] = ref_b64["hero"]
        if inject.get("storyteller") and "storyteller" in ref_b64:
            scene_refs["storyteller"] = ref_b64["storyteller"]
        if inject.get("bg_corniche") and "bg_corniche" in ref_b64:
            scene_refs["bg_corniche"] = ref_b64["bg_corniche"]
        if inject.get("bg_street") and "bg_street" in ref_b64:
            scene_refs["bg_street"] = ref_b64["bg_street"]
        if inject.get("notebook") and "notebook" in ref_b64:
            scene_refs["notebook"] = ref_b64["notebook"]

        image_bytes = await generate_scene_with_injection(
            session, scene["prompt"], scene_refs, scene["name"]
        )

        if image_bytes:
            output_path.write_bytes(image_bytes)
            size_kb = len(image_bytes) / 1024
            print(f"  [{scene['name']}] Saved ({size_kb:.0f} KB)")
            generated.append(scene["name"])
        else:
            print(f"  [{scene['name']}] FAILED — restoring backup")
            backup_path = BOOK_DIR / f"{scene['name']}_old.png"
            if backup_path.exists():
                backup_path.rename(output_path)

        await asyncio.sleep(REQUEST_DELAY)

    print(f"\n{'='*55}")
    print(f"Generated {len(generated)}/{len(SCENES)} images")
    print(f"Output: {BOOK_DIR}")
    print(f"{'='*55}")


async def main(mode: str = "all"):
    if not GEMINI_API_KEY:
        print("ERROR: GOOGLE_GEMINI_API_KEY not found in .env")
        sys.exit(1)

    print(f"\n{'='*55}")
    print("L6.1 - The Marvellous Neighbourhood")
    print("Regenerating with FULL injection system")
    print(f"Mode: {mode}")
    print(f"Output: {BOOK_DIR}")
    print(f"{'='*55}\n")

    async with aiohttp.ClientSession() as session:
        if mode in ("all", "refs"):
            print("--- Step 1: Generate Reference Images ---")
            ref_paths = await generate_references(session)
            print(f"\nReferences ready: {len(ref_paths)}")
            for name, path in ref_paths.items():
                print(f"  {name}: {path.name}")

            if mode == "refs":
                print("\nRefs-only mode — stopping here.")
                return

        if mode in ("all", "scenes"):
            if mode == "scenes":
                # Load existing refs
                ref_paths = {}
                for name, filename in [
                    ("hero", "hero_reference.png"),
                    ("storyteller", "side_storyteller_reference.png"),
                    ("bg_corniche", "bg_corniche.png"),
                    ("bg_street", "bg_street.png"),
                    ("notebook", "obj_notebook.png"),
                ]:
                    p = BOOK_DIR / filename
                    if p.exists():
                        ref_paths[name] = p
                    else:
                        print(f"  WARNING: {filename} not found — run 'refs' first")

            print(f"\n--- Step 2: Generate Scene Images ({len(SCENES)} scenes) ---")
            await generate_scenes(session, ref_paths)


if __name__ == "__main__":
    mode = sys.argv[1].lower() if len(sys.argv) > 1 else "all"
    if mode not in ("all", "refs", "scenes"):
        print("Usage: python scripts/regenerate_L6_1.py [all|refs|scenes]")
        sys.exit(1)
    asyncio.run(main(mode))
