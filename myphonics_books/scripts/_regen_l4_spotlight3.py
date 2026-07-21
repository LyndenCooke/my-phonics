"""Third pass on L4 spotlight: high/bee/ray/reef redrawn in the SAME warm
hand-drawn storybook style as our boy/dad characters (soft shading, clean
outlines, tiny solid-black dot eyes) - NOT photorealistic, NOT flat baby
clip-art. Reuses generate()+auth from regen_spotlight_vertex.
"""
from __future__ import annotations

import shutil
from io import BytesIO

from PIL import Image

from regen_spotlight_vertex import generate, PHOTOS_DIR, BACKUP_DIR

STYLE_STORYBOOK = (
    "Whimsical children's picture-book illustration in a warm, hand-drawn cartoon "
    "style with soft shading and clean black outlines - exactly the same gentle "
    "illustrated style as the characters in our storybooks. A friendly cartoon: "
    "NOT photorealistic, NOT a flat babyish clip-art, NOT a pencil sketch. ONE "
    "subject, large and centred on a plain pure-WHITE background, with soft "
    "watercolour-style shading. NO baked-in text, letters or numbers, NO busy "
    "background, NO border or frame. "
    "EYES RULE (mandatory): a creature's eyes are tiny SOLID-BLACK filled dots - "
    "100% black, NO white, NO sclera, NO catchlight, NO shine, NO coloured iris - "
    "just like the gentle dot eyes on our story characters. Inanimate objects have "
    "NO face, NO eyes and NO mouth."
)

TARGETS = [
    ("igh", "high",
     "a tall pointed snow-capped mountain peak rising high above two or three soft "
     "white clouds, the summit well above the cloud line to show height. No face, "
     "no people."),
    ("ee", "bee",
     "a friendly honey bee with a plump round yellow-and-black striped body and two "
     "simple soft pale wings, flying gently, tiny solid-black dot eyes, no smile."),
    ("ay", "ray",
     "a manta ray gliding, seen from above with its wings spread wide and a long "
     "thin tail, soft friendly blue colouring, tiny solid-black dot eyes (no white, "
     "no shine), no mouth, calm."),
    ("ee", "reef",
     "a small, simple, calm coral reef - just a few soft-coloured coral shapes with "
     "one little orange fish beside them, gentle and uncluttered; the fish has one "
     "tiny solid-black dot eye."),
]

if __name__ == "__main__":
    ok = 0
    for g, w, subj in TARGETS:
        prompt = f"{STYLE_STORYBOOK}\n\nSubject: {subj}."
        print(f"[{g}/{w}] generating (storybook)...")
        raw = generate(prompt)
        if not raw:
            print(f"   FAILED {g}/{w}")
            continue
        out = PHOTOS_DIR / g / f"{w}.jpg"
        BACKUP_DIR.mkdir(parents=True, exist_ok=True)
        if out.exists():
            shutil.copy2(out, BACKUP_DIR / f"{g}_{w}.sb_old.jpg")
        Image.open(BytesIO(raw)).convert("RGB").save(out, format="JPEG", quality=90, optimize=True)
        print(f"   saved {g}/{w} ({out.stat().st_size // 1024} KB)")
        ok += 1
    print(f"\nDone: {ok}/{len(TARGETS)} regenerated.")
