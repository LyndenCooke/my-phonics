"""Second pass on L4 spotlight: bee/seed/high regenerated with a more
realistic storybook look (less flat/babyish), matching our illustrated
characters. Reuses generate() + auth from regen_spotlight_vertex but with a
more realistic style string. (The ray's eyes are fixed separately by pixel
surgery; day/hay/night/light/reef are kept.)
"""
from __future__ import annotations

import shutil
from io import BytesIO

from PIL import Image

from regen_spotlight_vertex import generate, PHOTOS_DIR, BACKUP_DIR

STYLE_REAL = (
    "A clean, gently REALISTIC children's storybook illustration of a single "
    "subject, centred on a plain pure-WHITE background. Natural proportions with "
    "soft shading and real form and depth, like a warm modern picture book - NOT "
    "a flat babyish clip-art, NOT a cutesy mascot, NOT overly simplified. Fine "
    "clean outlines, tasteful natural colours (NO garish rainbow colours). ONE "
    "clear, immediately recognisable subject, large and centred. "
    "NO baked-in text, letters or numbers. NO busy background, NO border or frame. "
    "EYES RULE (mandatory): if the subject is a creature with eyes, draw each eye "
    "as a single small SOLID-BLACK filled dot - 100% black, NO white, NO sclera, "
    "NO catchlight, NO glint, NO coloured iris - exactly like the gentle dot eyes "
    "on the animals in our storybooks. Inanimate objects must have NO face, NO "
    "eyes and NO mouth at all."
)

TARGETS = [
    ("ee", "bee",
     "a honey bee with a soft fuzzy striped body in warm amber-yellow and black, "
     "two delicate translucent wings with fine vein lines, gentle soft shading and "
     "rounded natural form, small tidy solid-black dot eyes, calm and natural, "
     "flying gently. A realistic storybook bee, not a flat cartoon."),
    ("ee", "seed",
     "a single seed - a smooth brown apple pip / sunflower seed - shown larger and "
     "clearer with natural surface texture, soft shading and a subtle sense of form, "
     "simple and immediately readable as a seed."),
    ("igh", "high",
     "a tall, steep snow-capped mountain peak rising HIGH above a few soft white "
     "clouds, the sharp summit well above the cloud line to clearly show great "
     "height and altitude, with cool soft realistic shading. No face, no people, "
     "no text."),
]

if __name__ == "__main__":
    ok = 0
    for g, w, subj in TARGETS:
        prompt = f"{STYLE_REAL}\n\nSubject: {subj}."
        print(f"[{g}/{w}] generating (realistic)...")
        raw = generate(prompt)
        if not raw:
            print(f"   FAILED {g}/{w}")
            continue
        out = PHOTOS_DIR / g / f"{w}.jpg"
        BACKUP_DIR.mkdir(parents=True, exist_ok=True)
        if out.exists():
            shutil.copy2(out, BACKUP_DIR / f"{g}_{w}.real_old.jpg")
        Image.open(BytesIO(raw)).convert("RGB").save(out, format="JPEG", quality=90, optimize=True)
        print(f"   saved {out.relative_to(PHOTOS_DIR.parent.parent)} ({out.stat().st_size // 1024} KB)")
        ok += 1
    print(f"\nDone: {ok}/{len(TARGETS)} regenerated.")
