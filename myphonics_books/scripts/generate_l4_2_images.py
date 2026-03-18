"""
Generate illustrations for L4.2 "The Brown Owl" using Flux Kontext Pro via fal.ai.

Hero injection pipeline:
  1. Generate hero reference (text-to-image via Flux Dev)
  2. Upload reference to fal.ai storage
  3. Generate cover + 8 story pages with hero injection (Kontext Pro)

Usage:
    py -3.12 scripts/generate_l4_2_images.py           # Generate all images
    py -3.12 scripts/generate_l4_2_images.py hero       # Hero reference only
    py -3.12 scripts/generate_l4_2_images.py page3      # Regenerate specific page
"""

import os
import sys
import time
import json
import httpx
import fal_client
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
load_dotenv(Path(__file__).parent.parent / ".env")

FAL_KEY = os.environ.get("FAL_KEY")
if FAL_KEY:
    os.environ["FAL_KEY"] = FAL_KEY

OUTPUT_DIR = Path(__file__).parent.parent / "output" / "images" / "L4_2_B1"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

REQUEST_DELAY = 2  # seconds between API requests


# ─── Style ──────────────────────────────────────────────────────

BASE_STYLE = (
    "Whimsical children's book illustration. Hand-drawn cartoon style with "
    "soft watercolour textured backgrounds and clean black-outlined characters. "
    "Small simple oval eyes with solid dark fill, no detailed irises or highlights. "
    "Warm, friendly, inviting. Soft pastel backgrounds with pops of bright colour. "
    "Simple rounded shapes, gentle lighting. Professional picture book quality. "
    "No text, words, letters, or numbers in the image."
)


# ─── Character ──────────────────────────────────────────────────

HERO_PROMPT = (
    "A cartoon girl character, about 6 years old, with medium brown skin and "
    "curly dark brown hair in two puffs tied with navy blue hair bobbles. "
    "She wears a navy blue duffle coat with wooden toggle buttons, dark grey "
    "joggers, and brown lace-up boots. She has small simple oval eyes with "
    "solid dark fill (no detailed irises or highlights), a friendly cheerful "
    "expression and rosy cheeks. Standing in a neutral pose, facing the viewer, "
    "full body visible from head to toe. Arms slightly away from body, feet "
    "shoulder-width apart. Plain light grey solid-colour background (no scenery, "
    "no objects, no patterns)."
)

CHAR_SHORT = "the girl with curly dark brown hair puffs in the navy blue duffle coat"

# Secondary character: Mum
MUM_DESC = (
    "a taller woman with medium brown skin and curly dark brown hair pulled "
    "back in a low bun, wearing a dark green parka with hood down, black "
    "trousers, and brown walking boots"
)

# ─── Recurring Objects (defined ONCE, used EXACTLY in all prompts) ──

OWL_DESC = (
    "a large tawny owl with rich dark brown feathers, lighter cream-brown "
    "chest markings, a round facial disc, small solid black dot eyes, "
    "and a sharp curved beak"
)

TREE_DESC = (
    "a tall mature oak tree with thick textured bark, bare winter branches, "
    "and a dark oval hole about halfway up the trunk"
)

OWLETS_DESC = (
    "two small fluffy baby owlets with pale brown downy feathers, darker "
    "brown markings, round faces like miniature versions of the mother owl, "
    "and small solid black dot eyes"
)

WOODLAND_DESC = (
    "a woodland path through bare winter trees (oak, birch) with some "
    "evergreen pines. Fallen brown and orange leaves on the ground. "
    "Twilight sky with deep blue and purple tones"
)


# ─── Scene Prompts ──────────────────────────────────────────────

SCENES = [
    {
        "name": "cover",
        "prompt": (
            f"Show {{char}} standing at the edge of a dark woodland path at dusk, "
            f"looking up in wonder at {OWL_DESC} perched on a bare oak branch above her. "
            f"The owl stares back. {WOODLAND_DESC}. "
            f"The girl wears her navy blue duffle coat, dark grey joggers, and brown boots. "
            f"Same character, same outfit, same appearance as reference. "
            f"Small simple oval eyes with solid dark fill. "
            f"Portrait format."
        ),
        "size": {"width": 768, "height": 1024},
    },
    {
        # Page 1: "It was getting dark. From deep in the trees came a loud howl, then a growl.
        #          What was that? I stared out the window but all I saw were shadows."
        "name": "page1",
        "prompt": (
            f"Show {{char}} pressing her face to a window at dusk, peering out into the dark. "
            f"She looks curious and excited, hands pressed against the glass. "
            f"Warm yellow lamplight inside contrasts with blue-grey twilight outside. "
            f"Dark tree silhouettes visible through the window. "
            f"She wears her navy blue duffle coat (ready to go outside). "
            f"Same character, same outfit, same appearance as reference. "
            f"Small simple oval eyes with solid dark fill. "
            f"Landscape format."
        ),
        "size": {"width": 1024, "height": 768},
    },
    {
        # Page 2: "'Can we go and look?' I asked Mum. She got me my thick coat and boots.
        #          We set off down the dark path together. The air was cool on my bare cheeks."
        "name": "page2",
        "prompt": (
            f"Show {{char}} walking down {WOODLAND_DESC} together with {MUM_DESC}. "
            f"The girl wears her navy blue duffle coat and brown boots. "
            f"The mum has her arm around the girl's shoulder. Fallen leaves on the ground. "
            f"Cool twilight atmosphere. Both looking ahead along the path. "
            f"Same character, same outfit, same appearance as reference. "
            f"Small simple oval eyes with solid dark fill. "
            f"Landscape format."
        ),
        "size": {"width": 1024, "height": 768},
    },
    {
        # Page 3: "Then Mum stopped and stared up. 'Look!' she said.
        #          A big brown owl sat on a bare branch. It stared down at us and did not look scared at all."
        "name": "page3",
        "prompt": (
            f"Show {{char}} (a small 6-year-old girl in navy duffle coat) and her MUM "
            f"({MUM_DESC}, IMPORTANT: Mum is a TALL ADULT WOMAN, much taller than the child, "
            f"NOT a child) both looking up in wonder at {OWL_DESC} perched high on a bare branch "
            f"of {TREE_DESC}. {WOODLAND_DESC} backdrop with twilight sky. "
            f"The girl only reaches her mum's waist. "
            f"Same character, same outfit, same appearance as reference. "
            f"Small simple oval eyes with solid dark fill on ALL characters. "
            f"Landscape format."
        ),
        "size": {"width": 1024, "height": 768},
    },
    {
        # Page 4: "I stared at the owl. The owl stared right back. 'How rare!' said Mum.
        #          'You do not see owls like this!' I wanted to get close but I did not dare."
        "name": "page4",
        "prompt": (
            f"Close-up composition: {{char}} and {OWL_DESC} facing each other. "
            f"The girl stares up with wide-eyed wonder from below. The owl stares back from "
            f"its bare branch, head tilted slightly. {MUM_DESC} stands behind with a hand on "
            f"the girl's shoulder. Bare branches frame the scene. Dusk woodland setting. "
            f"Same character, same outfit, same appearance as reference. "
            f"Small simple oval eyes with solid dark fill on ALL characters. "
            f"Landscape format."
        ),
        "size": {"width": 1024, "height": 768},
    },
    {
        # Page 5: "Then the owl spread its wings and swooped down. Wow!
        #          It landed on a stump close to us. I froze. I did not dare to make a sound."
        "name": "page5",
        "prompt": (
            f"Show {OWL_DESC} in dramatic flight with wings spread wide, swooping down "
            f"from the branch. {{char}} stands frozen below with mouth open in amazement. "
            f"A tree stump visible on the ground nearby. Dynamic swooping motion captured. "
            f"Dusk woodland setting with bare trees. "
            f"Same character, same outfit, same appearance as reference. "
            f"Small simple oval eyes with solid dark fill. "
            f"Landscape format."
        ),
        "size": {"width": 1024, "height": 768},
    },
    {
        # Page 6: "The owl looked up at a hole high in the tree. Out came soft cheeps.
        #          'Owlets!' said Mum. 'She must look after them!'
        #          I peeked and saw fluffy brown faces staring down at me."
        "name": "page6",
        "prompt": (
            f"A nighttime woodland scene. In the centre, {TREE_DESC} with a dark oval hole "
            f"partway up. Two small fluffy pale brown baby owlets peek their heads out of "
            f"the hole, staring down. {OWL_DESC} (normal bird size, about 40cm tall) perches "
            f"on a branch next to the hole. On the left side, {{char}} (small 6-year-old girl "
            f"in navy duffle coat) stands on tiptoes looking up, delighted. On the right side, "
            f"her MUM (a TALL ADULT WOMAN in dark green parka, black trousers, brown boots, "
            f"medium brown skin, dark hair in a bun) points up at the owlets. "
            f"Dark blue twilight sky, bare winter trees in background. "
            f"Same character, same outfit, same appearance as reference. "
            f"Small simple oval eyes with solid dark fill on ALL characters. "
            f"Landscape format."
        ),
        "size": {"width": 1024, "height": 768},
    },
    {
        # Page 7: "The owl swooped back up with a mouse in its claws. The owlets crowded round,
        #          cheeping loud. What a rare sight! Mum and I shared a smile."
        "name": "page7",
        "prompt": (
            f"A nighttime woodland scene. In the centre, {TREE_DESC} with a dark oval hole "
            f"partway up. {OWL_DESC} (normal bird size) flies up to the hole carrying a small "
            f"grey mouse in its talons. Two small fluffy pale brown baby owlets lean out of "
            f"the hole with open beaks, cheeping. Below the tree on the left, {{char}} (small "
            f"6-year-old girl in navy duffle coat) watches with a big smile. On the right, "
            f"her MUM (a TALL ADULT WOMAN in dark green parka, black trousers, brown boots, "
            f"medium brown skin, dark hair in a bun) also smiles warmly. "
            f"Dark blue night sky with stars. Bare winter trees in background. "
            f"Same character, same outfit, same appearance as reference. "
            f"Small simple oval eyes with solid dark fill on ALL characters. "
            f"Landscape format."
        ),
        "size": {"width": 1024, "height": 768},
    },
    {
        # Page 8: "We went home under the stars. 'I want to go back and care for them,' I said.
        #          Mum took my hand. 'We will,' she said. I smiled all the way home.
        #          The brown owl and her owlets were safe in the dark."
        "name": "page8",
        "prompt": (
            f"Show {{char}} and {MUM_DESC} walking home along {WOODLAND_DESC}. "
            f"The girl holds her mum's hand and smiles contentedly. "
            f"A beautiful starry night sky above with a crescent moon. "
            f"In the background, the silhouette of {TREE_DESC} visible against the stars. "
            f"Warm, peaceful, safe atmosphere. "
            f"Same character, same outfit, same appearance as reference. "
            f"Small simple oval eyes with solid dark fill. "
            f"Landscape format."
        ),
        "size": {"width": 1024, "height": 768},
    },
]


# ─── API Functions ──────────────────────────────────────────────

def generate_hero_image() -> Path | None:
    """Generate hero reference image using Flux Dev (text-to-image)."""
    hero_path = OUTPUT_DIR / "hero_reference.png"
    full_prompt = f"{HERO_PROMPT} {BASE_STYLE}"

    print(f"  [hero] Generating reference image...")
    try:
        result = fal_client.subscribe(
            "fal-ai/flux/dev",
            arguments={
                "prompt": full_prompt,
                "image_size": {"width": 768, "height": 1024},
                "num_images": 1,
                "output_format": "png",
                "guidance_scale": 4.0,
                "num_inference_steps": 28,
            },
        )

        if result and "images" in result and len(result["images"]) > 0:
            image_url = result["images"][0]["url"]
            response = httpx.get(image_url)
            if response.status_code == 200:
                hero_path.write_bytes(response.content)
                size_kb = len(response.content) / 1024
                print(f"  [hero] Saved ({size_kb:.0f} KB) -> {hero_path}")
                return hero_path
        print(f"  [hero] No image in response")
        return None
    except Exception as e:
        print(f"  [hero] Error: {e}")
        return None


def upload_reference(image_path: Path) -> str | None:
    """Upload hero image to fal.ai storage, return URL."""
    try:
        url = fal_client.upload_file(str(image_path))
        print(f"  [upload] Reference uploaded -> {url[:60]}...")
        return url
    except Exception as e:
        print(f"  [upload] Error: {e}")
        return None


def generate_scene(reference_url: str, scene: dict) -> bytes | None:
    """Generate a scene image using Kontext Pro with hero injection."""
    full_prompt = scene["prompt"].replace("{char}", CHAR_SHORT)
    full_prompt += f" {BASE_STYLE}"

    try:
        result = fal_client.subscribe(
            "fal-ai/flux-pro/kontext",
            arguments={
                "prompt": full_prompt,
                "image_url": reference_url,
                "num_images": 1,
                "output_format": "png",
                "guidance_scale": 3.5,
                "safety_tolerance": "5",
            },
        )

        if result and "images" in result and len(result["images"]) > 0:
            image_url = result["images"][0]["url"]
            response = httpx.get(image_url)
            if response.status_code == 200:
                return response.content
        print(f"    No image in response")
        return None
    except Exception as e:
        print(f"    Error: {e}")
        return None


# ─── Main ───────────────────────────────────────────────────────

def main():
    if not FAL_KEY:
        print("ERROR: FAL_KEY not found in .env")
        sys.exit(1)

    print(f"\n{'='*55}")
    print(f"Level 4.2: \"The Brown Owl\"")
    print(f"Output: {OUTPUT_DIR}")
    print(f"Scenes: {len(SCENES)} (cover + 8 pages)")
    print(f"{'='*55}")

    # Parse args
    target = sys.argv[1].lower() if len(sys.argv) > 1 else "all"

    # Step 1: Generate hero reference
    hero_path = OUTPUT_DIR / "hero_reference.png"
    if target in ("hero", "all") or not hero_path.exists():
        hero_path = generate_hero_image()
        if not hero_path:
            print("FATAL: Could not generate hero reference image")
            sys.exit(1)
        if target == "hero":
            print("Hero-only mode — done.")
            return

    # Step 2: Upload reference
    reference_url = upload_reference(hero_path)
    if not reference_url:
        print("FATAL: Could not upload reference image")
        sys.exit(1)

    # Step 3: Generate scenes
    scenes_to_generate = SCENES
    if target not in ("all", "hero"):
        # Regenerate specific page(s)
        scenes_to_generate = [s for s in SCENES if s["name"] == target]
        if not scenes_to_generate:
            print(f"Unknown target: {target}")
            print(f"Options: all, hero, cover, page1-page8")
            sys.exit(1)

    generated = []
    for scene in scenes_to_generate:
        output_path = OUTPUT_DIR / f"{scene['name']}.png"

        # Skip existing unless specifically targeting this scene
        if output_path.exists() and target == "all":
            print(f"  [{scene['name']}] Already exists, skipping")
            generated.append(str(output_path))
            continue

        print(f"  [{scene['name']}] Generating...")
        image_bytes = generate_scene(reference_url, scene)

        if image_bytes:
            output_path.write_bytes(image_bytes)
            size_kb = len(image_bytes) / 1024
            print(f"  [{scene['name']}] Saved ({size_kb:.0f} KB)")
            generated.append(str(output_path))
        else:
            print(f"  [{scene['name']}] FAILED")

        time.sleep(REQUEST_DELAY)

    total = len(SCENES) if target == "all" else len(scenes_to_generate)
    print(f"\nGenerated {len(generated)}/{total} images for L4.2 The Brown Owl")


if __name__ == "__main__":
    main()
