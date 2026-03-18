import os
import io
import json
import base64
from pathlib import Path
from dotenv import load_dotenv

# Optional: load rembg for background removal if available
try:
    from rembg import remove
    REMBG_AVAILABLE = True
except ImportError:
    REMBG_AVAILABLE = False
    print("WARNING: rembg not installed. Background removal will be skipped.")

from PIL import Image
import fal_client

# Load environment variables (FAL_KEY)
load_dotenv()

BASE_DIR = Path(__file__).parent.parent
OUTPUT_DIR = BASE_DIR / "output" / "images" / "L1_Test"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ─── 1. HERO DEFINITION (Level 1) ─────────────────────────────────────────────
# Straight from Art-Generator.md Level 1 definition
HERO_PROMPT_TEMPLATE = """A cartoon girl character, about 5 years old, with dark brown skin and short curly black hair.
She wears a bright red jumper, dark blue denim dungarees, and blue wellies (wellington boots).
She has small simple oval eyes with solid dark fill (no detailed irises or highlights),
with a cheerful smile, and rosy cheeks.
Standing in a neutral pose, facing the viewer, full body visible from head to toe.
Arms slightly away from body, feet shoulder-width apart.
Plain light solid-colour background (no scenery, no objects, no patterns).
Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds,
clean black-outlined characters, warm friendly atmosphere, soft pastel colours, simple rounded shapes,
gentle lighting. No text, words, or letters in the image."""

HERO_INJECTION_REMINDER = """Same character, same outfit, same appearance as reference.
Small simple oval eyes with solid dark fill.
Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds,
clean black-outlined characters. No text, words, or letters in the image."""

# ─── 2. SCENE PROMPTS ────────────────────────────────────────────────────────

# Define objects and setting consistently
KEY_OBJECT = "a large pale cream spiral shell with pink tones and a visible spiral pattern"
SETTING = "a sunny green garden with colourful orange and yellow flowers, warm light, and a muddy patch of brown earth"

SCENES = {
    "cover": f"Show the character from the reference image looking excitedly at {KEY_OBJECT} lying in {SETTING}. Big cheerful expression. {HERO_INJECTION_REMINDER}\nPortrait format.",
    "page1": f"Show the character from the reference image digging energetically in thick brown mud with a small spade, mud flying in {SETTING}. Focused expression. {HERO_INJECTION_REMINDER}\nLandscape format.",
    "page2": f"Show the character from the reference image pausing mid-dig, looking surprised, has just hit something hard buried in the mud in {SETTING}. {HERO_INJECTION_REMINDER}\nLandscape format.",
    "page3": f"Show the character from the reference image gripping and pulling with both hands at an object sticking out of the mud in {SETTING}. Determined expression. {HERO_INJECTION_REMINDER}\nLandscape format.",
    "page4": f"Show the character from the reference image leaning back, pulling {KEY_OBJECT} halfway out of the mud in {SETTING}. Amazed expression. {HERO_INJECTION_REMINDER}\nLandscape format.",
    "page5": f"Show the character from the reference image holding up {KEY_OBJECT}, covered in a little bit of mud, proudly showing it off in {SETTING}. Big happy smile. {HERO_INJECTION_REMINDER}\nLandscape format.",
    "page6": f"Show the character from the reference image washing {KEY_OBJECT} under a gentle stream of water from an outdoor tap. Water splashing, clean shell shining. Content smile. {HERO_INJECTION_REMINDER}\nLandscape format.",
}

# ─── 3. PIPELINE FUNCTIONS ────────────────────────────────────────────────────

def generate_hero() -> Path:
    print("\n--- STEP 1: Generating Hero Reference (Flux Dev) ---")
    hero_path = OUTPUT_DIR / "hero_reference.png"

    if hero_path.exists():
        print(f"Hero already exists at {hero_path}. Skipping generation.")
        return hero_path

    # Use fal-ai/flux/dev
    result = fal_client.subscribe(
        "fal-ai/flux/dev",
        arguments={
            "prompt": HERO_PROMPT_TEMPLATE,
            "image_size": {"width": 768, "height": 1024},
            "num_images": 1,
            "output_format": "png",
            "guidance_scale": 4.0,
            "num_inference_steps": 28,
        },
    )
    
    image_url = result['images'][0]['url']
    print(f"Hero generated: {image_url}")
    
    # Download and save the image locally
    import requests
    response = requests.get(image_url)
    hero_path.write_bytes(response.content)
    print(f"Saved: {hero_path}")
    
    return hero_path

def remove_background(hero_path: Path) -> Path:
    print("\n--- STEP 3: Removing Background ---")
    nobg_path = OUTPUT_DIR / "hero_reference_nobg.png"
    
    if nobg_path.exists():
        print(f"Background-removed hero already exists at {nobg_path}.")
        return nobg_path
        
    if not REMBG_AVAILABLE:
        print("rembg not available, using original hero image as reference.")
        return hero_path

    print("Processing image with rembg...")
    original_img = Image.open(hero_path)
    nobg_img = remove(original_img)
    nobg_img.save(nobg_path, format="PNG")
    print(f"Saved background-removed hero to {nobg_path}")
    return nobg_path

def upload_reference(nobg_path: Path) -> str:
    print("\n--- STEP 4: Uploading Reference to Fal.ai ---")
    url = fal_client.upload_file(str(nobg_path))
    print(f"Reference URL: {url}")
    return url

def generate_scene(name: str, prompt: str, reference_url: str):
    print(f"\n--- STEP 5: Generating Scene '{name}' (Flux Pro Kontext) ---")
    scene_path = OUTPUT_DIR / f"{name}.png"
    
    if scene_path.exists():
        print(f"Scene {name} already exists. Skipping.")
        return

    # Use fal-ai/flux-pro/kontext to inject the hero graphic
    result = fal_client.subscribe(
        "fal-ai/flux-pro/kontext",
        arguments={
            "prompt": prompt,
            "image_url": reference_url,
            "num_images": 1,
            "output_format": "png",
            "guidance_scale": 3.5,
            "safety_tolerance": "5",
        },
    )
    
    image_url = result['images'][0]['url']
    print(f"Scene {name} generated: {image_url}")
    
    # Download and save
    import requests
    response = requests.get(image_url)
    scene_path.write_bytes(response.content)
    print(f"Saved: {scene_path}")

# ─── 4. EXECUTION ────────────────────────────────────────────────────────────

def main():
    print("Starting Artificial Imager Pipeline for Level 1...\n")

    # Step: Verify Fal key is present
    if not os.environ.get("FAL_KEY"):
        print("ERROR: FAL_KEY environment variable is not set. Please set it in your .env file or environment.")
        return
    
    # Step 1: Generate Hero
    hero_path = generate_hero()
    
    # Step 2: In a real system the user would review the hero image. We will skip review for this automated script.
    
    # Step 3: Remove Background
    nobg_path = remove_background(hero_path)
    
    # Step 4: Upload Background-Removed Hero
    reference_url = upload_reference(nobg_path)
    
    # Step 5: Render scenes targeting standard 12-page setup (6 distinct scenes + cover)
    for name, prompt in SCENES.items():
        generate_scene(name, prompt, reference_url)
        
    print(f"\nPipeline complete! Review the outputs in: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
