"""
Fix white eyes in cartoon illustrations.

Finds small bright/white regions surrounded by dark pixels (eye whites on dark skin)
and fills them with black to create solid dot eyes.

Usage:
    py -3.12 scripts/fix_eyes.py L2.3          # Fix all images for L2.3
    py -3.12 scripts/fix_eyes.py L2.3 page7    # Fix specific image
    py -3.12 scripts/fix_eyes.py L2.3 --preview # Show what would be changed without saving
"""

import sys
from pathlib import Path
from PIL import Image
import numpy as np

OUTPUT_DIR = Path(__file__).parent.parent / "output" / "images"


def find_and_fill_eye_whites(img_path, save=True, verbose=False):
    """
    Find small bright regions tightly surrounded by very dark pixels and fill black.

    Tight criteria to avoid false positives:
    - Region must be bright (avg brightness > 200)
    - Region must be small (5-300 pixels)
    - Region must be roughly circular (aspect ratio < 2.5)
    - Immediate 2px ring must be very dark (avg < 60) — eye outline + dark skin
    - Region must be in the upper 60% of the image (faces are usually upper half)
    """
    img = Image.open(img_path).convert("RGB")
    arr = np.array(img)
    h, w = arr.shape[:2]

    # Find bright pixels (potential eye whites) — must be genuinely white/very light
    brightness = arr.mean(axis=2)
    bright_mask = brightness > 200

    # Connected component labeling
    from scipy import ndimage
    labeled, num_features = ndimage.label(bright_mask)

    filled_count = 0
    total_pixels_filled = 0

    for label_id in range(1, num_features + 1):
        component = labeled == label_id
        size = component.sum()

        # Size filter: eyes in these illustrations are typically 10-300 pixels
        if size > 300 or size < 5:
            continue

        # Get bounding box
        coords = np.argwhere(component)
        y_min, x_min = coords.min(axis=0)
        y_max, x_max = coords.max(axis=0)
        y_center = (y_min + y_max) / 2

        # Must be in upper 60% of image (faces are in the upper portion)
        if y_center > h * 0.6:
            continue

        # Aspect ratio check — eyes are roundish
        height = y_max - y_min + 1
        width = x_max - x_min + 1
        if min(height, width) == 0:
            continue
        aspect = max(height, width) / min(height, width)
        if aspect > 2.5:
            continue

        # Tight surround check: 2px ring must be very dark (eye outline + dark skin)
        pad = 2
        y_s = max(0, y_min - pad)
        y_e = min(h, y_max + pad + 1)
        x_s = max(0, x_min - pad)
        x_e = min(w, x_max + pad + 1)

        surround = np.zeros(bright_mask.shape, dtype=bool)
        surround[y_s:y_e, x_s:x_e] = True
        surround = surround & ~component

        if surround.sum() == 0:
            continue

        surround_brightness = brightness[surround].mean()

        # Very strict: surrounding must be very dark (< 60)
        if surround_brightness < 60:
            arr[component] = [0, 0, 0]
            filled_count += 1
            total_pixels_filled += size
            if verbose:
                print(f"    → Filled region at ({x_min},{y_min})-({x_max},{y_max}), "
                      f"size={size}px, surround_brightness={surround_brightness:.0f}")

    if save and filled_count > 0:
        result = Image.fromarray(arr)
        result.save(img_path)

    return filled_count, total_pixels_filled


def fix_level_images(level_key, specific_image=None, preview=False):
    """Fix eyes for all images in a level folder."""
    # Convert level key like "2.3" to folder name "L2_3_B1"
    parts = level_key.replace("L", "").split(".")
    folder_name = f"L{parts[0]}_{parts[1]}_B1"
    folder = OUTPUT_DIR / folder_name

    if not folder.exists():
        print(f"Folder not found: {folder}")
        return

    # Get image files
    if specific_image:
        files = [folder / f"{specific_image}.png"]
    else:
        files = sorted(folder.glob("*.png"))

    print(f"{'PREVIEW' if preview else 'Fixing'} eyes in {folder.name}:")
    print("=" * 50)

    for img_path in files:
        if not img_path.exists():
            print(f"  [{img_path.stem}] File not found, skipping")
            continue

        filled, pixels = find_and_fill_eye_whites(img_path, save=not preview)
        if filled > 0:
            action = "Would fill" if preview else "Filled"
            print(f"  [{img_path.stem}] {action} {filled} eye region(s) ({pixels} pixels)")
        else:
            print(f"  [{img_path.stem}] No eye whites detected")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: py -3.12 scripts/fix_eyes.py L2.3 [page_name] [--preview]")
        sys.exit(1)

    level = sys.argv[1]
    specific = None
    preview = "--preview" in sys.argv

    for arg in sys.argv[2:]:
        if arg != "--preview":
            specific = arg

    fix_level_images(level, specific, preview)
