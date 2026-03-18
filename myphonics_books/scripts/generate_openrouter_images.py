"""
Generate illustrations for L2.3 using Gemini 2.5 Flash Image via OpenRouter.

Uses the cover image as a character reference for consistency across all pages.
Maintains the same Gemini art style used across the entire book series.
"""

import requests
import base64
import time
import sys
from pathlib import Path

API_KEY = "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"
API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "google/gemini-2.5-flash-image"

OUTPUT_DIR = Path(__file__).parent.parent / "output" / "images" / "L2_3_B1"

# Character reference preamble (sent with every request alongside cover image)
CHAR_REF = (
    "REFERENCE IMAGE: This shows the two main characters. You MUST replicate them EXACTLY "
    "in the new scene — same skin tone (very dark), same outfits (boy: orange t-shirt, "
    "blue trousers, dusty boots; dad: green shirt, long trousers), same art style "
    "(whimsical children's book, soft watercolour backgrounds, clean black outlines), "
    "same simple black dot eyes (tiny solid circles, no white). "
)

STYLE = (
    "Whimsical children's book illustration. Soft watercolour textured backgrounds, "
    "clean black-outlined characters. Simple black dot eyes on all characters. "
    "Warm, friendly, professional picture book quality. Square format 1024x1024. "
    "No text, words, letters, or numbers in the image."
)

# Scene prompts for each page
SCENES = {
    "page1": (
        "SCENE: View from INSIDE a car looking forward through the windshield. "
        "The boy (from reference) sits in the back seat wearing a seatbelt, pointing excitedly "
        "ahead at a Kenyan farm visible through the windshield. His dad (from reference) is "
        "driving in the front seat — we see the back of his head and shoulders, hands on the wheel. "
        "Red-brown dirt road leads to a stone farmhouse with tin roof, banana trees, green rolling hills. "
        "Sunny day, bright blue sky."
    ),
    "page2": (
        "SCENE: The boy and his dad (both from reference) stand in a big open farm yard. "
        "The boy looks amazed and excited, pointing at something. His dad leans on a wooden fence "
        "nearby, smiling warmly. A large glass jar filled with dried yellow corn kernels sits on "
        "a wooden table/bench. Red-brown earth, wooden fences, green Kenyan highlands with "
        "rolling hills behind. Banana trees visible."
    ),
    "page3": (
        "SCENE: The boy (from reference) digs energetically in red-brown earth with a garden fork "
        "(4 metal prongs, wooden handle), grinning with effort. His dad (from reference) works "
        "nearby, carrying a bucket of vegetables. Lush vegetable garden with rows of green leafy "
        "plants. Kenyan farmstead in background with round thatched huts. Bright sunny day. "
        "Chickens scratching in the dirt."
    ),
    "page4": (
        "SCENE: DUSK — orange-purple sunset sky. The boy and his dad (both from reference) "
        "stand in the farmyard looking at a large wooden barn. The boy points at the barn "
        "curiously, the dad stands beside him. The barn is MUCH larger than the characters, "
        "dominating the background. Barn door slightly ajar. Warm orange sunset light. "
        "Mysterious mood. Acacia trees in the distance."
    ),
    "page5": (
        "SCENE: NIGHT — dark sky full of stars. The boy (from reference) walks determinedly "
        "along a red-brown dirt path towards the big wooden barn, holding a bright yellow "
        "PLASTIC BATTERY-POWERED FLASHLIGHT (modern torch, NOT fire). The flashlight beam "
        "cuts through the darkness. His dad (from reference) walks alongside him. "
        "The barn looms ahead. Brave, adventurous mood."
    ),
    "page6": (
        "SCENE: INSIDE A DARK BARN. The boy (from reference) shines a bright yellow plastic "
        "flashlight into a dark corner, revealing a small shape nestled in the hay. His dad "
        "(from reference) stands behind/beside the boy. Wooden barn walls, hay bales stacked "
        "around. Dramatic flashlight beam illuminating the corner. Curiosity and excitement."
    ),
    "page7": (
        "SCENE: Inside the barn, warm golden morning light filtering through wooden slats. "
        "The boy (from reference) kneels in golden hay looking delighted. His dad (from reference) "
        "crouches nearby with a proud smile. In front of them: a tiny newborn white baby goat "
        "(kid) with floppy ears lying in the hay next to its brown mother goat. "
        "Warm, tender moment."
    ),
    "page8": (
        "SCENE: Warm golden morning light. The boy (from reference) sits in golden hay near "
        "the open barn door, gently hugging a tiny white baby goat against his chest, beaming "
        "with pure joy. His dad (from reference) sits beside the boy with an arm around his "
        "shoulder, smiling proudly. The brown mother goat stands nearby. Green Kenyan hills "
        "visible through the open barn doors. Beautiful family moment."
    ),
}


def generate_image(cover_b64: str, scene_name: str, scene_prompt: str) -> bytes | None:
    """Generate a single scene image using the cover as reference."""
    full_prompt = f"{CHAR_REF}\n\nNEW SCENE TO CREATE:\n{scene_prompt}\n\nSTYLE: {STYLE}"

    try:
        response = requests.post(
            API_URL,
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": MODEL,
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{cover_b64}"}},
                        {"type": "text", "text": full_prompt},
                    ]
                }],
                "modalities": ["image", "text"],
                "max_tokens": 8192,
            },
            timeout=180,
        )

        if response.status_code != 200:
            print(f"  ❌ HTTP {response.status_code}: {response.text[:200]}")
            return None

        data = response.json()

        # Check for errors
        if "error" in data:
            print(f"  ❌ API error: {data['error']}")
            return None

        # Extract image
        images = data["choices"][0]["message"].get("images", [])
        if not images:
            print(f"  ❌ No image in response")
            return None

        url = images[0]["image_url"]["url"]
        _, b64data = url.split(",", 1)
        img_bytes = base64.b64decode(b64data)

        cost = data.get("usage", {}).get("cost", 0)
        print(f"  ✅ {scene_name}: {len(img_bytes)/1024:.0f} KB (${cost:.4f})")
        return img_bytes

    except Exception as e:
        print(f"  ❌ {scene_name}: {type(e).__name__}: {e}")
        return None


def main():
    # Determine which pages to generate
    pages_to_gen = list(SCENES.keys())
    if len(sys.argv) > 1:
        arg = sys.argv[1]
        if arg in SCENES:
            pages_to_gen = [arg]
        elif arg == "all":
            pages_to_gen = list(SCENES.keys())
        else:
            print(f"Unknown argument: {arg}")
            print(f"Valid: {', '.join(SCENES.keys())} or 'all'")
            return

    # Load cover as reference
    cover_path = OUTPUT_DIR / "cover.png"
    if not cover_path.exists():
        print(f"❌ Cover not found: {cover_path}")
        return

    print(f"Loading cover reference: {cover_path}")
    with open(cover_path, "rb") as f:
        cover_b64 = base64.b64encode(f.read()).decode()
    print(f"Cover loaded: {cover_path.stat().st_size / 1024:.0f} KB")

    print(f"\nGenerating {len(pages_to_gen)} images using {MODEL}...")
    print("=" * 50)

    total_cost = 0
    success = 0
    failed = 0

    for scene_name in pages_to_gen:
        scene_prompt = SCENES[scene_name]
        output_path = OUTPUT_DIR / f"{scene_name}.png"

        # Back up existing image
        if output_path.exists():
            backup = OUTPUT_DIR / f"{scene_name}_gemini_backup.png"
            if not backup.exists():
                output_path.rename(backup)
                print(f"  Backed up existing → {backup.name}")
            else:
                output_path.unlink()

        img_bytes = generate_image(cover_b64, scene_name, scene_prompt)
        if img_bytes:
            output_path.write_bytes(img_bytes)
            success += 1
        else:
            failed += 1
            # Restore backup if generation failed
            backup = OUTPUT_DIR / f"{scene_name}_gemini_backup.png"
            if backup.exists():
                backup.rename(output_path)
                print(f"  Restored backup for {scene_name}")

        # Rate limit
        if scene_name != pages_to_gen[-1]:
            time.sleep(2)

    print("=" * 50)
    print(f"Done: {success}/{len(pages_to_gen)} successful, {failed} failed")


if __name__ == "__main__":
    main()
