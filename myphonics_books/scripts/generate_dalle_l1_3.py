"""
Generate L1.3 Fish in the Tank illustrations using GPT Image 1.

Usage:
    python generate_dalle_l1_3.py           # Generate all
    python generate_dalle_l1_3.py hero      # Hero only
    python generate_dalle_l1_3.py page3     # Single page
"""

import os
import sys
import time
import base64
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.environ.get("OPENAI_API_KEY")
OUTPUT_DIR = Path(__file__).parent.parent / "output" / "images" / "L1_3_B1"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ─── Character Description (used in EVERY prompt) ──────────────────

CHARACTER = (
    "A 5-year-old British Muslim girl sitting in a manual wheelchair. "
    "She wears a soft lilac hijab that COMPLETELY covers ALL of her hair — "
    "absolutely NO hair visible, not even a fringe or strand. "
    "She wears a bright yellow long-sleeve top, teal leggings, and pink trainers. "
    "Her wheelchair has a purple frame and yellow wheel spokes. "
    "She has warm brown skin. "
    "CRITICAL: She has exactly TWO arms and TWO hands — no more, no less."
)

STYLE = (
    "Whimsical children's book illustration, hand-drawn cartoon style, "
    "soft watercolour textured backgrounds, clean black-outlined characters, "
    "warm friendly atmosphere, soft pastel colours, simple rounded shapes, "
    "gentle lighting. Small simple dot eyes with solid dark fill, no detailed "
    "irises or highlights — like a teddy bear's eyes. "
    "No text, words, letters, or numbers anywhere in the image."
)

# ─── Key Objects (consistent descriptions) ──────────────────────────

FISH = "a small bright orange-gold goldfish with a round body and flowing tail fin"
BAG = "a clear plastic bag tied at the top, filled with water"
TANK = "a small rectangular glass fish tank with blue gravel at the bottom and a small green plastic plant inside"
CUP = "a small white ceramic cup"

# ─── Room Descriptions ──────────────────────────────────────────────

HALLWAY = (
    "A cosy British home hallway/entrance — wooden floor, coat hooks on the wall, "
    "a front door with frosted glass panels, a small shelf with a plant, warm lighting."
)

KITCHEN = (
    "A bright British kitchen — white cabinets, wooden countertops, "
    "tiled floor, a window above the sink letting in natural light, "
    "a kettle on the counter, a fruit bowl."
)

BEDROOM = (
    "A child's bedroom with soft lilac walls, a small wooden bed with a "
    "lilac duvet and yellow cushions, three small animal pictures on the wall "
    "(badger, fox, owl), a white bedside cabinet with drawers, "
    "purple curtains on the window, a cream circular rug on the wooden floor, "
    "some colourful building blocks and a toy bus on the rug."
)

# ─── Prompts ────────────────────────────────────────────────────────

PROMPTS = {
    "hero_reference": {
        "prompt": (
            f"{CHARACTER} "
            "Full body view, facing the viewer, neutral pose with hands resting "
            "on the wheelchair armrests. Warm curious expression with a slight smile. "
            "Plain light lilac solid-colour background — no scenery, no objects. "
            f"{STYLE}"
        ),
        "size": "1024x1024",
    },
    "cover": {
        "prompt": (
            f"{CHARACTER} "
            f"She is in a child's bedroom, smiling with excitement, looking at "
            f"{TANK} which sits on a white bedside cabinet next to her. "
            f"{FISH} swims happily inside the tank. "
            "She is leaning forward slightly with delight, one hand on the wheelchair "
            "armrest, the other hand reaching toward the tank. "
            f"Setting: {BEDROOM} "
            "Portrait composition (taller than wide). "
            f"{STYLE}"
        ),
        "size": "1024x1792",
    },
    "page1": {
        "prompt": (
            f"{CHARACTER} "
            f"She is in a hallway, holding up {BAG} with {FISH} swimming inside it. "
            "She holds the bag with BOTH hands, looking excited and proud. "
            "The wheelchair wheels rest firmly on the wooden hallway floor. "
            f"Setting: {HALLWAY} "
            "Landscape composition (wider than tall). "
            f"{STYLE}"
        ),
        "size": "1792x1024",
    },
    "page2": {
        "prompt": (
            f"{CHARACTER} "
            f"She is in a kitchen, looking down at {BAG} with {FISH} inside, "
            "resting on her lap. She has a concerned, worried expression. "
            "The fish looks cramped in the small bag. "
            "One hand holds the bag, the other hand rests on the wheelchair armrest. "
            "The wheelchair wheels rest firmly on the kitchen tile floor. "
            f"Setting: {KITCHEN} "
            "Landscape composition (wider than tall). "
            f"{STYLE}"
        ),
        "size": "1792x1024",
    },
    "page3": {
        "prompt": (
            f"{CHARACTER} "
            f"She is in a kitchen, holding up {CUP} in one hand and looking at it "
            "with a disappointed frown, shaking her head. The cup is clearly too "
            "small for a fish. Her other hand rests on her lap. "
            f"{BAG} with {FISH} inside sits on the kitchen counter behind her. "
            "The wheelchair wheels rest firmly on the kitchen tile floor. "
            f"Setting: {KITCHEN} "
            "Landscape composition (wider than tall). "
            f"{STYLE}"
        ),
        "size": "1792x1024",
    },
    "page4": {
        "prompt": (
            f"{CHARACTER} "
            f"She is in her bedroom, pointing excitedly with one hand at {TANK} "
            "which sits on a white bedside cabinet next to her bed. Her other hand "
            "rests on the wheelchair armrest. She has a big triumphant smile. "
            f"{FISH} is visible swimming inside the tank. "
            "The wheelchair wheels rest firmly on the wooden floor. "
            f"Setting: {BEDROOM} "
            "Landscape composition (wider than tall). "
            f"{STYLE}"
        ),
        "size": "1792x1024",
    },
    "page5": {
        "prompt": (
            f"{CHARACTER} "
            f"She is in her bedroom, leaning forward joyfully and clapping both "
            "hands together with delight. She is watching a single "
            f"{FISH} swimming happily in {TANK} on the white bedside cabinet. "
            "Only ONE fish in the tank. No bag visible anywhere. "
            "The wheelchair wheels rest firmly on the wooden floor. "
            f"Setting: {BEDROOM} "
            "Landscape composition (wider than tall). "
            f"{STYLE}"
        ),
        "size": "1792x1024",
    },
    "page6": {
        "prompt": (
            f"{CHARACTER} "
            f"She is in her bedroom with a big warm satisfied smile, "
            "both hands resting on the wheelchair armrests, looking content and proud. "
            f"{TANK} sits on the white bedside cabinet next to her bed, "
            f"with a single {FISH} swimming happily inside. "
            "Peaceful, warm afternoon light from the window. "
            "Only ONE fish. No bag visible. "
            "The wheelchair wheels rest firmly on the wooden floor. "
            f"Setting: {BEDROOM} "
            "Landscape composition (wider than tall). "
            f"{STYLE}"
        ),
        "size": "1792x1024",
    },
}


def generate_image(name: str, prompt: str, size: str) -> Path | None:
    """Generate a single image using DALL-E 3."""
    output_path = OUTPUT_DIR / f"{name}.png"
    if output_path.exists():
        print(f"  [{name}] Already exists, skipping")
        return output_path

    print(f"  [{name}] Generating...")
    try:
        response = requests.post(
            "https://api.openai.com/v1/images/generations",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-image-1",
                "prompt": prompt,
                "n": 1,
                "size": size,
                "quality": "high",
            },
            timeout=180,
        )
        response.raise_for_status()
        data = response.json()
        image_data = data["data"][0]

        # gpt-image-1 returns b64_json by default
        if "b64_json" in image_data:
            img_bytes = base64.b64decode(image_data["b64_json"])
        elif "url" in image_data:
            img_response = requests.get(image_data["url"], timeout=60)
            img_response.raise_for_status()
            img_bytes = img_response.content
        else:
            print(f"  [{name}] ERROR: No image data in response")
            return None

        output_path.write_bytes(img_bytes)
        size_kb = len(img_bytes) // 1024
        print(f"  [{name}] Saved ({size_kb} KB) -> {output_path}")
        return output_path

    except requests.exceptions.HTTPError as e:
        print(f"  [{name}] ERROR: {e}")
        if e.response is not None:
            print(f"  [{name}] Response: {e.response.text[:500]}")
        return None
    except Exception as e:
        print(f"  [{name}] ERROR: {e}")
        return None


def main():
    if not API_KEY or API_KEY.startswith("your_"):
        print("ERROR: Set OPENAI_API_KEY in .env")
        sys.exit(1)

    # Determine what to generate
    targets = list(PROMPTS.keys())
    if len(sys.argv) > 1:
        arg = sys.argv[1].lower()
        if arg == "hero":
            targets = ["hero_reference"]
        elif arg in PROMPTS:
            targets = [arg]
        else:
            print(f"Unknown target: {arg}")
            print(f"Available: hero, {', '.join(PROMPTS.keys())}")
            sys.exit(1)

    print(f"\n{'='*60}")
    print(f'L1.3: "The Fish in the Tank" (DALL-E 3)')
    print(f"Output: {OUTPUT_DIR}")
    print(f"Targets: {len(targets)}")
    print(f"{'='*60}")

    success = 0
    for name in targets:
        config = PROMPTS[name]
        result = generate_image(name, config["prompt"], config["size"])
        if result:
            success += 1
        # Rate limit — DALL-E 3 allows ~5/min on most tiers
        if name != targets[-1]:
            time.sleep(15)

    print(f"\nGenerated {success}/{len(targets)} images")


if __name__ == "__main__":
    main()
