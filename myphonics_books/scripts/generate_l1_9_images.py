"""
Generate illustrations for L1.9 "Chop, Chop, Chop!" using Gemini API.

CHAIN-EDITING APPROACH:
  - Page 1 is generated from scratch using all hero/kitchen references.
  - Every subsequent page injects the PREVIOUS page image and gives a minimal
    edit instruction. This keeps chips, kitchen, characters, and style
    100% consistent — the model only changes what is specified.

Usage:
    py -3.12 scripts/generate_l1_9_images.py              # Full chain from page1
    py -3.12 scripts/generate_l1_9_images.py page1        # Regenerate base page only
    py -3.12 scripts/generate_l1_9_images.py page3        # Regen from page2 base
    py -3.12 scripts/generate_l1_9_images.py cover        # Regen cover from page1 base
"""

import asyncio, aiohttp, os, sys, base64
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

GEMINI_API_KEY = os.environ.get("GOOGLE_GEMINI_API_KEY")
BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
OUTPUT_DIR = Path(__file__).parent.parent / "output" / "images" / "L1_9_B1"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

EYE_REF_PATH = Path(__file__).parent.parent / "output" / "images" / "L4_1_B1" / "hero_reference.png"
HERO_CHILD   = OUTPUT_DIR / "hero_reference.png"
HERO_GRANDMA = OUTPUT_DIR / "side_hero_grandma.png"
KITCHEN_REF  = OUTPUT_DIR / "kitchen_reference.png"

REQUEST_DELAY = 4
MAX_RETRIES   = 3
BACKOFF_BASE  = 5

BASE_STYLE = (
    "Whimsical children's book illustration. Hand-drawn cartoon style with "
    "soft watercolour textured backgrounds and clean black-outlined characters. "
    "CRITICAL EYE RULE: EVERY character MUST have eyes that are small solid dark "
    "filled OVALS — wider than tall, simple almond shape, no white, no iris, "
    "no highlight, no reflection, no pupil detail. "
    "Warm, friendly. No text, words, letters, or numbers in the image."
)

# ── Descriptions used ONLY for the initial page1 generation ─────────────────

CHILD_DESC = (
    "a SMALL BOY (MALE, 5 years old): short bowl-cut black hair to ear level, "
    "medium brown skin, turquoise kurta top with thin gold trim at collar and "
    "cuffs, white loose trousers, brown sandals. "
    "HEIGHT: his head reaches only to Nan's waist — he is MUCH SHORTER, "
    "roughly HALF Nan's height."
)
GRANDMA_DESC = (
    "South Asian grandmother 'Nan': grey hair tied in a neat bun at the back "
    "of her head, warm brown skin with wrinkles, small gold stud earrings, "
    "sage-green shalwar kameez, floral dupatta with red/pink/yellow flowers "
    "on green background, brown sandals. "
    "HEIGHT: full-grown adult, TWICE the height of the small boy."
)
KITCHEN = (
    "South Asian home kitchen: warm cream walls, blue-and-white floral patterned "
    "square tile backsplash behind the counter, honey-coloured wooden counter "
    "along the back wall (NO cabinet doors — plain solid counter front), "
    "a wooden open shelf above holding a row of small glass spice jars "
    "(turmeric yellow, red, green, brown), two round brass pots on the counter, "
    "small framed window on the LEFT with warm daylight, terracotta tiled floor."
)
CHIPS = (
    "LONG RECTANGULAR THICK POTATO CHIPS — pale golden elongated rectangular "
    "batons, like thick-cut British chip-shop chips. Each chip is 4-5x longer "
    "than it is wide. NOT round, NOT oval, NOT nugget-shaped."
)
CHOPPING_BOARD = (
    "a honey-coloured wooden chopping board lying FLAT ON THE COUNTER SURFACE — "
    "NOT held up, NOT floating. Nan's hands work on it from above."
)
BIG_DISH = "a round ceramic plate/dish with a blue floral rim"
DIP_BOWL = "a small round white bowl with red tomato-chutney dip"

# ── Scene chain ──────────────────────────────────────────────────────────────
#
# Each entry defines:
#   name        — output filename (without .png)
#   base        — which page's image to use as the "previous page" input
#                 (None = generate from scratch using all references)
#   edit        — the minimal edit instruction sent alongside the base image
#
# Rule: keep edit instructions SHORT and specific — only describe what changes.

CHAIN = [
    {
        "name": "page1",
        "base": None,  # generated from scratch — establishes everything
        "edit": (
            f"Generate a landscape 4:3 children's book illustration. "
            f"COMPOSITION: There is a honey-coloured wooden kitchen worktable/counter "
            f"in the FOREGROUND (bottom of image, running left-to-right). "
            f"Nan and the boy stand BEHIND the table, facing the viewer. "
            f"The chopping board sits FLAT ON TOP of the table in front of Nan "
            f"(between her body and the viewer). She leans forward over the table "
            f"and chops downward with a knife — both hands pressing on the board "
            f"which lies flat on the table surface. She does NOT pick up the board. "
            f"The boy stands beside Nan behind the table, also facing us, hands "
            f"clapped in excitement. "
            f"BACKGROUND (visible behind the characters): warm cream wall, "
            f"blue-and-white floral tile backsplash at mid-height, a wooden shelf "
            f"above holding coloured glass spice jars, two round brass pots on the "
            f"table surface, a small framed window on the LEFT with warm daylight. "
            f"Terracotta tiled floor visible in the foreground below the table. "
            f"CHARACTERS: {GRANDMA_DESC} {CHILD_DESC} "
            f"HEIGHT RULE: Nan is TWICE the boy's height. Boy's head reaches "
            f"only to Nan's waist. Chips on the board: {CHIPS} {BASE_STYLE}"
        ),
    },
    {
        "name": "page2",
        "base": "page1",
        "edit": (
            "Keep the kitchen, characters, and style EXACTLY as in this image. "
            "Change only the action: Nan has finished chopping and is now holding "
            "up ONE THIN chip slice in her raised left hand to show the boy. "
            "On the board on the counter there are also some THICK chip pieces. "
            "The knife rests on the board. Nan is smiling and pointing to show "
            "the difference between thin and thick. "
            "Boy watches with his hands clasped behind his back, looking curious."
        ),
    },
    {
        "name": "page3",
        "base": "page1",
        "edit": (
            "Keep the kitchen, characters, and style EXACTLY as in this image. "
            "Change only the action and objects: "
            "REMOVE the chopping board and knife. "
            "ADD a small black frying pan sitting on a compact portable single-burner "
            "hob on the RIGHT side of the counter. Nan stands at the hob using "
            "tongs to lower long rectangular golden chips into the pan — steam rising. "
            "On the LEFT, the boy stands safely away from the hob, proudly holding "
            "up a round ceramic plate with a blue floral rim with both hands — "
            "the plate is empty and ready. Boy is NOT near the hot pan."
        ),
    },
    {
        "name": "page4",
        "base": "page1",
        "edit": (
            "Keep the kitchen, characters, and style EXACTLY as in this image. "
            "Change only the action: "
            "REMOVE the chopping board and knife. "
            "The round ceramic plate with blue floral rim now sits on the counter "
            "full of long rectangular golden chips. "
            "The boy is standing at the counter holding up ONE single long "
            "rectangular golden chip between his thumb and finger, eyes wide with "
            "delight, showing it off. "
            "Nan stands beside the boy smiling warmly down at him. "
            "No knife visible. No hot pan visible."
        ),
    },
    {
        "name": "page5",
        "base": "page4",
        "edit": (
            "Keep the kitchen, characters, and style EXACTLY as in this image. "
            "Change only the action: "
            "The boy is now dipping the tip of ONE long rectangular golden chip "
            "into a small round white bowl of red tomato-chutney dip — chip "
            "half-submerged in the red dip — his mouth is open in a happy 'yum' "
            "smile. The round plate of long rectangular chips remains on the counter. "
            "Nan stands beside the boy laughing warmly, watching him enjoy the chip."
        ),
    },
    {
        "name": "page6",
        "base": "page5",
        "edit": (
            "Keep the kitchen, characters, and style EXACTLY as in this image. "
            "Change only the action: both the boy AND Nan are now each holding "
            "a long rectangular golden chip and munching it with big happy smiles — "
            "cheeks full, eyes squeezed in joy. The plate of chips and the small "
            "dip bowl remain on the counter between them. "
            "Warm, cosy, shared-meal feeling."
        ),
    },
    {
        "name": "cover",
        "base": "page1",
        "edit": (
            "Keep the kitchen, characters, and style EXACTLY as in this image. "
            "Convert to PORTRAIT 3:4 format (taller than wide). "
            "Nan stands at the counter chopping long rectangular chips on the "
            "wooden board — knife in hand, mid-chop. The boy stands beside her "
            "clapping with excitement. Make it feel like a warm, inviting book "
            "cover — slightly zoomed in on the characters. Portrait 3:4."
        ),
    },
]


async def gen_image(session, parts):
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }
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
                    body = await resp.text()
                    print(f"    Error {resp.status}: {body[:300]}")
                    await asyncio.sleep(BACKOFF_BASE * (2 ** attempt))
        except Exception as e:
            print(f"    {e}")
            await asyncio.sleep(BACKOFF_BASE)
    return None


def load_b64(path: Path) -> str | None:
    if path and path.exists():
        return base64.b64encode(path.read_bytes()).decode("utf-8")
    return None


def build_parts_fresh(scene: dict) -> list:
    """Parts for page1 — generated from scratch with all references."""
    parts = []
    eye_b64 = load_b64(EYE_REF_PATH)
    if eye_b64:
        parts.append({"text": "EYE STYLE REFERENCE — every character must have eyes exactly like this: tiny solid black dot, ZERO white:"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": eye_b64}})
    child_b64 = load_b64(HERO_CHILD)
    if child_b64:
        parts.append({"text": "CHARACTER 1 — SMALL BOY. Match this character exactly (outfit, hair, skin):"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": child_b64}})
    grandma_b64 = load_b64(HERO_GRANDMA)
    if grandma_b64:
        parts.append({"text": "CHARACTER 2 — GRANDMOTHER 'Nan'. Match this character exactly (green outfit, floral dupatta, grey back-bun hair):"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": grandma_b64}})
    kitchen_b64 = load_b64(KITCHEN_REF)
    if kitchen_b64:
        parts.append({"text": "KITCHEN SETTING REFERENCE — use this exact kitchen (same tiles, shelf, brass pots, window position):"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": kitchen_b64}})
    parts.append({"text": scene["edit"]})
    return parts


def build_parts_edit(scene: dict, base_b64: str) -> list:
    """Parts for chain pages — edit the previous page image."""
    parts = [
        {"text": "PREVIOUS PAGE — apply the edit instruction below to this image, keeping everything else identical:"},
        {"inlineData": {"mimeType": "image/png", "data": base_b64}},
        {"text": scene["edit"]},
    ]
    return parts


async def generate_scene(session, scene: dict, force: bool = False) -> bool:
    out = OUTPUT_DIR / f"{scene['name']}.png"
    if out.exists() and not force:
        print(f"  [{scene['name']}] Already exists — skipping (use force to regen)")
        return True

    print(f"  [{scene['name']}] Generating...")

    if scene["base"] is None:
        parts = build_parts_fresh(scene)
    else:
        base_path = OUTPUT_DIR / f"{scene['base']}.png"
        if not base_path.exists():
            print(f"  [{scene['name']}] ERROR: base image {scene['base']}.png not found")
            return False
        base_b64 = load_b64(base_path)
        parts = build_parts_edit(scene, base_b64)

    data = await gen_image(session, parts)
    if data:
        out.write_bytes(data)
        print(f"  [{scene['name']}] Saved ({len(data) // 1024} KB)")
        return True
    else:
        print(f"  [{scene['name']}] FAILED")
        return False


async def main():
    if not GEMINI_API_KEY:
        print("ERROR: No GOOGLE_GEMINI_API_KEY")
        sys.exit(1)

    args = [a.lower() for a in sys.argv[1:]]
    target_names = [a for a in args if a not in ("all", "force")]
    force = "force" in args or bool(target_names)

    print(f"\n{'='*60}")
    print(f'L1.9: "Chop, Chop, Chop!" — chain-edit approach')
    print(f"Output: {OUTPUT_DIR}")
    print(f"Targets: {target_names or 'all'}")
    print(f"{'='*60}\n")

    # Validate heroes exist for fresh generation
    if not HERO_CHILD.exists() or not HERO_GRANDMA.exists():
        print(f"ERROR: Missing hero files in {OUTPUT_DIR}")
        sys.exit(1)

    async with aiohttp.ClientSession() as session:
        generated, failed = [], []

        for scene in CHAIN:
            # If specific targets given, only run those
            if target_names and scene["name"] not in target_names:
                continue

            ok = await generate_scene(session, scene, force=force)
            (generated if ok else failed).append(scene["name"])
            await asyncio.sleep(REQUEST_DELAY)

        print(f"\n{'='*60}")
        print(f"Generated: {len(generated)}")
        if failed:
            print(f"Failed:    {', '.join(failed)}")
        else:
            print("All done!")
        print(f"{'='*60}")


if __name__ == "__main__":
    asyncio.run(main())
