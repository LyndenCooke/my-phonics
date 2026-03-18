"""Quick test of fal.ai connection."""
import os
from dotenv import load_dotenv
load_dotenv()

key = os.environ.get("FAL_KEY", "MISSING")
if key == "MISSING":
    print("ERROR: FAL_KEY not found in .env")
    exit(1)

print(f"FAL_KEY: {key[:12]}...{key[-4:]}")

import fal_client
print("fal_client imported OK")

# Test: generate a simple cartoon cat
print("Generating test image (cartoon cat)...")
try:
    result = fal_client.subscribe(
        "fal-ai/flux/dev",
        arguments={
            "prompt": "A friendly cartoon cat reading a colourful book, sitting on a cosy cushion. Simple children's illustration. Watercolour style. No text in image.",
            "image_size": {"width": 512, "height": 512},
            "num_images": 1,
            "output_format": "png",
        },
    )
    print(f"Result keys: {list(result.keys())}")
    if "images" in result and len(result["images"]) > 0:
        url = result["images"][0]["url"]
        print(f"Image URL: {url}")

        import httpx
        resp = httpx.get(url)
        out = os.path.join(os.path.dirname(__file__), "output", "images", "test_flux.png")
        with open(out, "wb") as f:
            f.write(resp.content)
        print(f"Saved: {out} ({len(resp.content)/1024:.0f} KB)")
    else:
        print(f"No images: {result}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
