import os
import io
from pathlib import Path
from dotenv import load_dotenv
from PIL import Image

from google import genai
from google.genai import types

load_dotenv()

BASE_DIR = Path(__file__).parent.parent
OUTPUT_DIR = BASE_DIR / "output" / "images" / "L1_Gemini"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ─── 1. HERO DEFINITION & STYLE ─────────────────────────────────────────────
# Animal character to avoid safety filters and maintain consistency via strict prompting.
HERO_CHARACTER = "A cartoon red fox cub character, standing upright on two legs. The fox has bright orange fur, a fluffy tail with a white tip, and large pointy ears. He is wearing a bright yellow raincoat and bright blue wellies (wellington boots). He has a simple, cheerful, friendly face with small black dot eyes."

ART_STYLE = "Whimsical children's book illustration, hand-drawn cartoon style. Plain solid white background (absolutely no scenery, no environment, no ground, no sky). Clean black-outlined character, flat pastel colours, simple rounded shapes. No text, words, or letters."

# ─── 2. SCENES ─────────────────────────────────────────────────────────────
SCENES = {
    "cover": f"Show {HERO_CHARACTER} sitting happily. {ART_STYLE}",
    "page1": f"Show {HERO_CHARACTER} standing and smiling. {ART_STYLE}",
    "page2": f"Show {HERO_CHARACTER} running fast with his arms pumping. {ART_STYLE}",
    "page3": f"Show {HERO_CHARACTER} running up a small simple grassy slope. {ART_STYLE}",
    "page4": f"Show {HERO_CHARACTER} holding a large green sun hat. {ART_STYLE}",
    "page5": f"Show {HERO_CHARACTER} wearing the green sun hat, but it is too big and falls over his eyes. {ART_STYLE}",
    "page6": f"Show {HERO_CHARACTER} sitting comfortably on a simple brown fallen log. {ART_STYLE}",
    "page7": f"Show {HERO_CHARACTER} curled up asleep, taking a nap. {ART_STYLE}",
    "page8": f"Show {HERO_CHARACTER} jumping up happily, having fun. {ART_STYLE}",
}

# ─── 3. GENERATION PIPELINE ──────────────────────────────────────────────────
def generate_scene(client, name: str, prompt: str):
    print(f"\n--- Generating Scene '{name}' ---")
    scene_path = OUTPUT_DIR / f"{name}.png"
    
    if scene_path.exists():
        print(f"Scene {name} already exists. Skipping.")
        return

    print(f"Prompt: {prompt}")

    import time
    for attempt in range(3):
        try:
            # Load the hero reference to pass back to the model
            hero_path = OUTPUT_DIR / "hero_reference.png"
            if not hero_path.exists():
                print("ERROR: Hero reference not found! Cannot inject character.")
                return
            
            hero_image = Image.open(hero_path)

            full_prompt = f"Generate an exact illustration of this character: [HERO_IMAGE]. Requirements: {prompt}"

            # Use gemini-2.5-flash-image to generate the image via multimodal instructing
            response = client.models.generate_content(
                model='gemini-2.5-flash-image',
                contents=[hero_image, full_prompt],
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE"],
                     # We cannot strict 3:4/4:3 in generate_content natively here easily, let it pick default
                )
            )

            # Extract the image from the response
            if not response.parts:
                print(f"FAILED: No parts returned for scene {name}.")
                return

            for part in response.parts:
                if part.inline_data:
                    generated_image = part.as_image()
                    generated_image.save(scene_path)
                    print(f"Saved: {scene_path}")
                    return # Success
                     
            print(f"FAILED: No valid inline image data for scene {name}.")
            
        except Exception as e:
            print(f"Attempt {attempt+1} failed for {name}: {e}")
            if attempt < 2:
                print("Retrying in 5 seconds...")
                time.sleep(5)
            else:
                print(f"FAILED to generate {name} after 3 attempts.")
                return

# ─── 4. EXECUTION ────────────────────────────────────────────────────────────
def main():
    print("Starting Gemini Image Generation Pipeline for Level 1...\n")

    api_key = os.environ.get("GOOGLE_GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GOOGLE_GEMINI_API_KEY or GEMINI_API_KEY environment variable is not set. Please set it in your .env file or environment.")
        return
        
    client = genai.Client(api_key=api_key)
    
    # Generate Hero Reference (for visual check, even if not injected directly)
    hero_prompt = f"Show {HERO_CHARACTER} standing in a neutral pose, facing the viewer, full body visible from head to toe. {ART_STYLE}"
    generate_scene(client, "hero_reference", hero_prompt)
    
    # Generate Story Scenes
    for name, prompt in SCENES.items():
        generate_scene(client, name, prompt)
        
    print(f"\nPipeline complete! Review the outputs in: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
