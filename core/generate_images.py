"""
Image generation for MyPhonicsBooks.

Supports multiple image generation backends:
- Gemini (Google Imagen) - primary illustration engine
- DALL-E (OpenAI) - alternative option
- Midjourney (via API) - premium option
- Placeholder - for testing without API calls

Art Style: Islamic-friendly children's book illustrations
- Minimal/abstract facial features (dot eyes or slits, no detailed eyes)
- Warm, welcoming, modern illustration style
- Soft shapes, bright colours
- Focus on body language and setting to convey emotion
"""

import os
import base64
import json
import httpx
from pathlib import Path
from typing import Optional, Dict, List
from dataclasses import dataclass, field
from enum import Enum

from dotenv import load_dotenv
load_dotenv()


class ImageEngine(Enum):
    """Available image generation engines."""
    GEMINI = "gemini"
    DALLE = "dalle"
    MIDJOURNEY = "midjourney"
    PLACEHOLDER = "placeholder"


class ArtStyle(Enum):
    """Available art styles for illustrations."""
    MINIMAL_FACE = "minimal_face"  # Islamic-friendly, minimal facial features
    WATERCOLOUR = "watercolour"
    FLAT_VECTOR = "flat_vector"
    SOFT_PAINTERLY = "soft_painterly"


@dataclass
class BrandStyle:
    """
    Brand art style configuration for MyPhonicsBooks.

    This defines the consistent visual style across all books.
    """
    name: str = "MyPhonicsBooks Standard"

    # Facial features style (Islamic-friendly)
    face_style: str = "minimal and abstract"
    eye_style: str = "simple dots, small curved lines, or gentle slits - NO detailed eyes, NO pupils, NO irises"
    expression_method: str = "body language, posture, and gesture rather than detailed facial expressions"

    # Overall illustration style
    art_style: str = "warm, friendly, modern children's book illustration"
    colour_palette: str = "bright, cheerful colours with soft pastels"
    shapes: str = "soft, rounded shapes with gentle curves"
    line_style: str = "clean outlines with soft edges"

    # What to avoid
    avoid: List[str] = field(default_factory=lambda: [
        "detailed realistic eyes",
        "pupils or irises",
        "photorealistic faces",
        "anime/manga style",
        "scary or dark imagery",
        "complex detailed backgrounds"
    ])

    def to_style_prompt(self) -> str:
        """Generate the style portion of an image prompt."""
        avoid_str = ", ".join(self.avoid)
        return f"""
ART STYLE REQUIREMENTS (MUST FOLLOW):
- Style: {self.art_style}
- Colours: {self.colour_palette}
- Shapes: {self.shapes}
- Lines: {self.line_style}

CRITICAL - FACIAL FEATURES:
- Faces must be {self.face_style}
- Eyes: {self.eye_style}
- Show emotion through {self.expression_method}
- Characters should feel warm and friendly without detailed facial features

MUST AVOID: {avoid_str}
"""


# Global brand style instance
BRAND_STYLE = BrandStyle()


@dataclass
class GeneratedImage:
    """Result of image generation."""
    success: bool
    image_path: Optional[Path] = None
    image_data: Optional[bytes] = None
    error: Optional[str] = None
    prompt_used: str = ""


@dataclass
class CharacterDescription:
    """Consistent character description for illustration coherence."""
    name: str
    appearance: str  # e.g., "a 5-year-old girl with curly brown hair"
    clothing: str  # e.g., "wearing a red t-shirt and blue jeans"
    skin_tone: str = "warm medium skin tone"
    hair_style: str = ""

    def to_prompt(self) -> str:
        """Generate character description for prompt."""
        parts = [self.name]
        if self.appearance:
            parts.append(self.appearance)
        if self.skin_tone:
            parts.append(f"with {self.skin_tone}")
        if self.clothing:
            parts.append(self.clothing)
        return ", ".join(parts)


class ImageGenerator:
    """Generates illustrations for phonics books."""

    def __init__(self, engine: ImageEngine = ImageEngine.PLACEHOLDER, style: BrandStyle = None):
        self.engine = engine
        self.style = style or BRAND_STYLE
        self.output_dir = Path("output/images")
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # API keys
        self.gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_GEMINI_API_KEY")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.midjourney_api_key = os.getenv("MIDJOURNEY_API_KEY")

    def generate_cover(
        self,
        title: str,
        child_name: str,
        character: CharacterDescription,
        theme: str,
        level: int,
        colour_code: str
    ) -> GeneratedImage:
        """Generate a book cover illustration."""
        prompt = self._build_cover_prompt(title, character, theme, colour_code)
        return self._generate(prompt, f"cover_{child_name}")

    def generate_illustration(
        self,
        page_number: int,
        scene_description: str,
        character: CharacterDescription,
        emotional_tone: str,
        book_id: str
    ) -> GeneratedImage:
        """Generate a story page illustration."""
        prompt = self._build_illustration_prompt(scene_description, character, emotional_tone)
        return self._generate(prompt, f"{book_id}_page{page_number}")

    def generate_style_test(self, style_name: str, test_scene: str) -> GeneratedImage:
        """Generate a test image to evaluate art style."""
        prompt = f"""
{self.style.to_style_prompt()}

TEST SCENE: {test_scene}

Create a single illustration showing a child character in this scene.
The character should have minimal facial features (dot eyes or slits only).
Focus on warm, inviting colours and clear, simple composition.
"""
        return self._generate(prompt, f"style_test_{style_name}")

    def _generate(self, prompt: str, filename: str) -> GeneratedImage:
        """Route to appropriate generation engine."""
        if self.engine == ImageEngine.GEMINI:
            return self._generate_gemini(prompt, filename)
        elif self.engine == ImageEngine.DALLE:
            return self._generate_dalle(prompt, filename)
        elif self.engine == ImageEngine.MIDJOURNEY:
            return self._generate_midjourney(prompt, filename)
        else:
            return self._generate_placeholder(prompt, filename)

    def _build_cover_prompt(
        self,
        title: str,
        character: CharacterDescription,
        theme: str,
        colour_code: str
    ) -> str:
        """Build prompt for cover illustration."""
        return f"""Create a children's book cover illustration.

{self.style.to_style_prompt()}

SUBJECT:
- Main character: {character.to_prompt()}
- The child should be the clear focus, shown from mid-body or full-body
- Character should appear happy and welcoming through POSTURE and GESTURE (not facial details)

THEME: {theme}
- Background should hint at the story theme with simple, cheerful elements

COLOURS:
- Primary accent colour: {colour_code}
- Use warm, inviting colours throughout

COMPOSITION:
- Portrait/vertical orientation
- Child centered in the image
- Leave space at top for title text
- Leave space at bottom for personalisation text
- Simple, uncluttered background

This is a PERSONALISED book where the child reader IS the main character.
Make it feel special and magical.
"""

    def _build_illustration_prompt(
        self,
        scene_description: str,
        character: CharacterDescription,
        emotional_tone: str
    ) -> str:
        """Build prompt for story page illustration."""
        return f"""Create a children's book illustration for a story page.

{self.style.to_style_prompt()}

SCENE: {scene_description}

MAIN CHARACTER: {character.to_prompt()}
- Character must look CONSISTENT (same hair, clothing, skin tone throughout book)
- Show emotion through BODY LANGUAGE: {emotional_tone}
- NO detailed facial features - use posture, gesture, and context to show feeling

COMPOSITION:
- Landscape/horizontal orientation
- Leave clear space at bottom (about 25%) for story text
- Simple background that supports but doesn't overwhelm the scene
- Clear visual storytelling - a young child should understand what's happening

TARGET AUDIENCE: Children ages 4-7 learning to read
"""

    def _generate_gemini(self, prompt: str, filename: str) -> GeneratedImage:
        """Generate image using Google Gemini Imagen."""
        if not self.gemini_api_key:
            return GeneratedImage(
                success=False,
                error="GEMINI_API_KEY not set in environment",
                prompt_used=prompt
            )

        try:
            # Use Imagen 3 via Gemini API
            url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key={self.gemini_api_key}"

            payload = {
                "instances": [{"prompt": prompt}],
                "parameters": {
                    "sampleCount": 1,
                    "aspectRatio": "4:3",
                    "safetyFilterLevel": "block_few",
                    "personGeneration": "allow_all"
                }
            }

            print(f"  Generating image with Gemini Imagen...")

            with httpx.Client(timeout=120.0) as client:
                response = client.post(url, json=payload)

                if response.status_code != 200:
                    # Try alternative endpoint
                    return self._generate_gemini_flash(prompt, filename)

                data = response.json()

                # Extract image from Imagen response
                if "predictions" in data and data["predictions"]:
                    for prediction in data["predictions"]:
                        if "bytesBase64Encoded" in prediction:
                            image_data = base64.b64decode(prediction["bytesBase64Encoded"])

                            image_path = self.output_dir / f"{filename}.png"
                            with open(image_path, "wb") as f:
                                f.write(image_data)

                            print(f"  Saved: {image_path}")
                            return GeneratedImage(
                                success=True,
                                image_path=image_path,
                                image_data=image_data,
                                prompt_used=prompt
                            )

                # Fallback to Gemini Flash with image generation
                return self._generate_gemini_flash(prompt, filename)

        except Exception as e:
            print(f"  Gemini Imagen error: {e}")
            # Try fallback
            return self._generate_gemini_flash(prompt, filename)

    def _generate_gemini_flash(self, prompt: str, filename: str) -> GeneratedImage:
        """Fallback: Generate image using Gemini 2.5 Flash Image."""
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key={self.gemini_api_key}"

            payload = {
                "contents": [{
                    "parts": [{"text": f"Generate an image: {prompt}"}]
                }],
                "generationConfig": {
                    "responseModalities": ["image", "text"]
                }
            }

            print(f"  Trying Gemini Flash image generation...")

            with httpx.Client(timeout=120.0) as client:
                response = client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()

                if "candidates" in data and data["candidates"]:
                    parts = data["candidates"][0].get("content", {}).get("parts", [])
                    for part in parts:
                        if "inlineData" in part:
                            image_data = base64.b64decode(part["inlineData"]["data"])

                            image_path = self.output_dir / f"{filename}.png"
                            with open(image_path, "wb") as f:
                                f.write(image_data)

                            print(f"  Saved: {image_path}")
                            return GeneratedImage(
                                success=True,
                                image_path=image_path,
                                image_data=image_data,
                                prompt_used=prompt
                            )

                return GeneratedImage(
                    success=False,
                    error="No image in Gemini response",
                    prompt_used=prompt
                )

        except Exception as e:
            return GeneratedImage(
                success=False,
                error=f"Gemini Flash error: {str(e)}",
                prompt_used=prompt
            )

    def _generate_dalle(self, prompt: str, filename: str) -> GeneratedImage:
        """Generate image using OpenAI DALL-E 3."""
        if not self.openai_api_key:
            return GeneratedImage(
                success=False,
                error="OPENAI_API_KEY not set in environment",
                prompt_used=prompt
            )

        try:
            url = "https://api.openai.com/v1/images/generations"

            headers = {
                "Authorization": f"Bearer {self.openai_api_key}",
                "Content-Type": "application/json"
            }

            # DALL-E prompt with style instructions
            dalle_prompt = f"{prompt}\n\nIMPORTANT: Characters must have minimal/abstract facial features - simple dot eyes or gentle slits only, NO detailed eyes with pupils."

            payload = {
                "model": "dall-e-3",
                "prompt": dalle_prompt,
                "n": 1,
                "size": "1024x1024",
                "quality": "standard",
                "response_format": "b64_json"
            }

            print(f"  Generating image with DALL-E 3...")

            with httpx.Client(timeout=90.0) as client:
                response = client.post(url, headers=headers, json=payload)
                response.raise_for_status()

                data = response.json()

                if "data" in data and data["data"]:
                    image_data = base64.b64decode(data["data"][0]["b64_json"])

                    image_path = self.output_dir / f"{filename}.png"
                    with open(image_path, "wb") as f:
                        f.write(image_data)

                    print(f"  Saved: {image_path}")
                    return GeneratedImage(
                        success=True,
                        image_path=image_path,
                        image_data=image_data,
                        prompt_used=dalle_prompt
                    )

                return GeneratedImage(
                    success=False,
                    error="No image in DALL-E response",
                    prompt_used=dalle_prompt
                )

        except Exception as e:
            return GeneratedImage(
                success=False,
                error=str(e),
                prompt_used=prompt
            )

    def _generate_midjourney(self, prompt: str, filename: str) -> GeneratedImage:
        """Generate image using Midjourney API."""
        if not self.midjourney_api_key:
            return GeneratedImage(
                success=False,
                error="MIDJOURNEY_API_KEY not set in environment",
                prompt_used=prompt
            )

        try:
            # Using goapi.ai Midjourney API
            url = "https://api.goapi.ai/mj/v2/imagine"

            headers = {
                "X-API-Key": self.midjourney_api_key,
                "Content-Type": "application/json"
            }

            # Midjourney prompt with style parameters
            mj_prompt = f"{prompt} --style raw --no detailed eyes, realistic eyes, pupils --ar 4:3"

            payload = {
                "prompt": mj_prompt,
                "process_mode": "fast"
            }

            print(f"  Generating image with Midjourney...")

            with httpx.Client(timeout=180.0) as client:
                response = client.post(url, headers=headers, json=payload)
                response.raise_for_status()

                data = response.json()

                # Midjourney API returns a task ID, need to poll for result
                if "task_id" in data:
                    task_id = data["task_id"]
                    return self._poll_midjourney_result(task_id, filename, prompt)

                return GeneratedImage(
                    success=False,
                    error="No task_id in Midjourney response",
                    prompt_used=mj_prompt
                )

        except Exception as e:
            return GeneratedImage(
                success=False,
                error=str(e),
                prompt_used=prompt
            )

    def _poll_midjourney_result(self, task_id: str, filename: str, prompt: str) -> GeneratedImage:
        """Poll Midjourney API for task result."""
        import time

        url = f"https://api.goapi.ai/mj/v2/fetch/{task_id}"
        headers = {"X-API-Key": self.midjourney_api_key}

        for _ in range(60):  # Max 5 minutes polling
            time.sleep(5)

            try:
                with httpx.Client(timeout=30.0) as client:
                    response = client.get(url, headers=headers)
                    data = response.json()

                    if data.get("status") == "finished":
                        image_url = data.get("task_result", {}).get("image_url")
                        if image_url:
                            # Download the image
                            img_response = client.get(image_url)
                            image_data = img_response.content

                            image_path = self.output_dir / f"{filename}.png"
                            with open(image_path, "wb") as f:
                                f.write(image_data)

                            print(f"  Saved: {image_path}")
                            return GeneratedImage(
                                success=True,
                                image_path=image_path,
                                image_data=image_data,
                                prompt_used=prompt
                            )

                    elif data.get("status") == "failed":
                        return GeneratedImage(
                            success=False,
                            error=f"Midjourney task failed: {data.get('error')}",
                            prompt_used=prompt
                        )

            except Exception as e:
                print(f"  Polling error: {e}")
                continue

        return GeneratedImage(
            success=False,
            error="Midjourney task timed out",
            prompt_used=prompt
        )

    def _generate_placeholder(self, prompt: str, filename: str) -> GeneratedImage:
        """Generate a placeholder SVG for testing."""
        try:
            svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f8f4f0"/>
      <stop offset="100%" style="stop-color:#e8e4e0"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bg)"/>
  <rect x="40" y="40" width="720" height="520" fill="#ffffff" stroke="#E91E63" stroke-width="3" rx="15"/>

  <!-- Simple character silhouette with minimal face -->
  <ellipse cx="400" cy="220" rx="60" ry="70" fill="#ffdbac"/>
  <ellipse cx="400" cy="350" rx="80" ry="100" fill="#E91E63"/>

  <!-- Minimal eyes (dots) -->
  <circle cx="380" cy="210" r="4" fill="#333"/>
  <circle cx="420" cy="210" r="4" fill="#333"/>

  <!-- Simple smile curve -->
  <path d="M 385 240 Q 400 255 415 240" stroke="#333" stroke-width="2" fill="none"/>

  <text x="400" y="480" text-anchor="middle" font-family="Georgia, serif" font-size="18" fill="#666666">
    [Illustration Preview]
  </text>
  <text x="400" y="510" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#999999">
    MyPhonicsBooks - Minimal Face Style
  </text>
</svg>'''

            image_path = self.output_dir / f"{filename}.svg"
            with open(image_path, "w", encoding="utf-8") as f:
                f.write(svg_content)

            return GeneratedImage(
                success=True,
                image_path=image_path,
                prompt_used=prompt
            )

        except Exception as e:
            return GeneratedImage(
                success=False,
                error=str(e),
                prompt_used=prompt
            )


def generate_book_illustrations(
    book_id: str,
    child_name: str,
    character_description: str,
    title: str,
    theme: str,
    level: int,
    colour_code: str,
    scene_briefs: List[Dict],
    engine: ImageEngine = ImageEngine.PLACEHOLDER
) -> Dict[int, Path]:
    """
    Generate all illustrations for a book.

    Args:
        book_id: Unique identifier for the book
        child_name: Name of the child protagonist
        character_description: Description of child's appearance
        title: Book title
        theme: Story theme
        level: Reading level
        colour_code: Level colour hex code
        scene_briefs: List of dicts with page_number, description, emotional_tone
        engine: Which image generation engine to use

    Returns:
        Dict mapping page numbers to image file paths
    """
    generator = ImageGenerator(engine=engine)

    # Create character description
    character = CharacterDescription(
        name=child_name,
        appearance=character_description or "a young child with a friendly posture",
        clothing="wearing comfortable casual clothes",
        skin_tone="warm skin tone"
    )

    illustrations = {}

    print(f"Generating illustrations using {engine.value}...")

    # Generate cover (page 1)
    print(f"  Cover...")
    cover_result = generator.generate_cover(
        title=title,
        child_name=child_name,
        character=character,
        theme=theme,
        level=level,
        colour_code=colour_code
    )
    if cover_result.success:
        illustrations[1] = cover_result.image_path
    else:
        print(f"  Cover failed: {cover_result.error}")

    # Generate story page illustrations
    for scene in scene_briefs:
        page_num = scene.get("page_number", 0)
        description = scene.get("description", "")
        tone = scene.get("emotional_tone", "happy")

        print(f"  Page {page_num}...")
        result = generator.generate_illustration(
            page_number=page_num,
            scene_description=description,
            character=character,
            emotional_tone=tone,
            book_id=book_id
        )
        if result.success:
            illustrations[page_num] = result.image_path
        else:
            print(f"  Page {page_num} failed: {result.error}")

    print(f"Generated {len(illustrations)} illustrations")
    return illustrations


def test_art_styles():
    """Generate test images to compare art styles."""
    print("Testing art styles...")

    test_scene = "A young child sitting in a sunny park, holding a toy dinosaur, looking happy and excited"

    # Test with each available engine
    for engine in [ImageEngine.GEMINI, ImageEngine.DALLE]:
        print(f"\nTesting {engine.value}...")
        generator = ImageGenerator(engine=engine)
        result = generator.generate_style_test(engine.value, test_scene)

        if result.success:
            print(f"  Success: {result.image_path}")
        else:
            print(f"  Failed: {result.error}")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--test-styles":
        test_art_styles()
    else:
        print("Image generation module loaded.")
        print(f"Available engines: {[e.value for e in ImageEngine]}")
        print(f"\nBrand style: {BRAND_STYLE.name}")
        print(f"Eye style: {BRAND_STYLE.eye_style}")
        print("\nRun with --test-styles to generate test images")
