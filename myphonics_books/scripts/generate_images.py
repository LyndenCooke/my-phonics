"""
Generate illustrations for phonics books using Kie.ai API.

Uses Flux Kontext model for consistent, child-friendly illustrations.
"""

import asyncio
import aiohttp
import os
import json
import base64
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

KIE_API_KEY = os.environ.get("KIE_API_KEY")
BASE_URL = "https://api.kie.ai/api/v1"
OUTPUT_DIR = Path(__file__).parent / "output" / "images"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# Style prompt for consistent children's book illustrations
STYLE_PROMPT = """
Children's book illustration style, soft watercolor textures,
warm and friendly, simple shapes, pastel colors with pops of bright color,
suitable for ages 4-7, no text in image, safe for children,
professional children's book quality, gentle and inviting atmosphere
"""


async def generate_image(prompt: str, aspect_ratio: str = "1:1") -> dict:
    """Submit an image generation request to Kie.ai Flux Kontext API."""

    url = f"{BASE_URL}/flux/kontext/generate"
    headers = {
        "Authorization": f"Bearer {KIE_API_KEY}",
        "Content-Type": "application/json"
    }

    full_prompt = f"{prompt}. {STYLE_PROMPT}"

    payload = {
        "prompt": full_prompt,
        "aspectRatio": aspect_ratio,
        "outputFormat": "png",
        "model": "flux-kontext-pro",
        "enableTranslation": True,
        "safetyTolerance": 1  # Safe for children
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=payload) as response:
            result = await response.json()
            print(f"Generate response: {json.dumps(result, indent=2)}")
            return result


async def check_task_status(task_id: str) -> dict:
    """Check the status of an image generation task."""

    url = f"{BASE_URL}/flux/kontext/record-info"
    headers = {
        "Authorization": f"Bearer {KIE_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {"taskId": task_id}

    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=payload) as response:
            result = await response.json()
            return result


async def wait_for_image(task_id: str, max_wait: int = 120) -> str | None:
    """Poll for image completion and return the image URL."""

    print(f"Waiting for task {task_id}...")

    for i in range(max_wait // 5):
        await asyncio.sleep(5)

        result = await check_task_status(task_id)
        print(f"  Status check {i+1}: {result.get('data', {}).get('status', 'unknown')}")

        data = result.get("data", {})
        status = data.get("status", "")

        if status == "completed" or status == "success":
            # Try different possible field names for the image URL
            image_url = (
                data.get("imageUrl") or
                data.get("image_url") or
                data.get("output") or
                data.get("result", {}).get("imageUrl") or
                data.get("result", {}).get("image_url")
            )
            if image_url:
                print(f"  Image ready: {image_url[:80]}...")
                return image_url
            else:
                print(f"  Completed but no URL found. Full response: {json.dumps(result, indent=2)}")
                return None

        elif status == "failed" or status == "error":
            print(f"  Task failed: {data.get('error', 'Unknown error')}")
            return None

    print("  Timeout waiting for image")
    return None


async def download_image(url: str, output_path: Path) -> bool:
    """Download an image from URL and save to file."""

    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status == 200:
                content = await response.read()
                output_path.write_bytes(content)
                print(f"  Saved: {output_path}")
                return True
            else:
                print(f"  Download failed: {response.status}")
                return False


async def generate_book_images(level: int = 2):
    """Generate all images for a test book."""

    print(f"\nGenerating images for Level {level} Test Book")
    print("=" * 50)

    if not KIE_API_KEY:
        print("ERROR: KIE_API_KEY not found in environment")
        return

    # Define prompts for Level 2 test book
    # Cover image + 8 story page illustrations
    prompts = [
        {
            "name": "cover",
            "prompt": "A cheerful child reading a colorful book, sitting on a cozy cushion, surrounded by friendly animals and magical sparkles",
            "aspect": "3:4"  # Portrait for cover
        },
        {
            "name": "page1",
            "prompt": "A child waking up in the morning, sunshine through window, cozy bedroom with toys",
            "aspect": "16:9"  # Landscape for story pages
        },
        {
            "name": "page2",
            "prompt": "A child eating breakfast at kitchen table with family, cereal bowl and orange juice",
            "aspect": "16:9"
        },
        {
            "name": "page3",
            "prompt": "A child walking to school on a sunny day, carrying a backpack, friendly neighborhood",
            "aspect": "16:9"
        },
        {
            "name": "page4",
            "prompt": "A child in classroom sitting at desk, teacher at whiteboard, other children learning",
            "aspect": "16:9"
        },
        {
            "name": "page5",
            "prompt": "Children playing in school playground, swings and slides, happy faces",
            "aspect": "16:9"
        },
        {
            "name": "page6",
            "prompt": "A child doing artwork, painting with brushes, colorful paints on table",
            "aspect": "16:9"
        },
        {
            "name": "page7",
            "prompt": "A child reading a book in cozy library corner, bookshelves around",
            "aspect": "16:9"
        },
        {
            "name": "page8",
            "prompt": "A child returning home, hugging parent at door, happy reunion",
            "aspect": "16:9"
        }
    ]

    generated_images = []

    for item in prompts:
        print(f"\n[{item['name']}] Generating...")

        # Submit generation request
        result = await generate_image(item["prompt"], item["aspect"])

        if result.get("code") != 200:
            print(f"  ERROR: {result.get('message', 'Unknown error')}")
            continue

        task_id = result.get("data", {}).get("taskId")
        if not task_id:
            print(f"  ERROR: No task ID returned")
            continue

        # Wait for completion
        image_url = await wait_for_image(task_id)

        if image_url:
            # Download the image
            output_path = OUTPUT_DIR / f"level{level}_{item['name']}.png"
            success = await download_image(image_url, output_path)

            if success:
                generated_images.append({
                    "name": item["name"],
                    "path": str(output_path),
                    "url": image_url
                })

    print(f"\n\nGenerated {len(generated_images)} images")
    print(f"Output directory: {OUTPUT_DIR}")

    # Save manifest
    manifest_path = OUTPUT_DIR / f"level{level}_manifest.json"
    manifest_path.write_text(json.dumps(generated_images, indent=2))
    print(f"Manifest saved: {manifest_path}")

    return generated_images


async def test_single_image():
    """Test generating a single image to verify API works."""

    print("Testing Kie.ai API with single image...")
    print(f"API Key: {KIE_API_KEY[:8]}...{KIE_API_KEY[-4:]}")

    result = await generate_image(
        "A friendly cartoon cat reading a book, simple children's illustration",
        "1:1"
    )

    if result.get("code") == 200:
        task_id = result.get("data", {}).get("taskId")
        print(f"Task ID: {task_id}")

        if task_id:
            image_url = await wait_for_image(task_id)
            if image_url:
                output_path = OUTPUT_DIR / "test_image.png"
                await download_image(image_url, output_path)
                print(f"\nSuccess! Test image saved to: {output_path}")
    else:
        print(f"API Error: {result}")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "test":
        asyncio.run(test_single_image())
    else:
        asyncio.run(generate_book_images(level=2))
