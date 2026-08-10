"""Full re-render of 8.2 "You Are Remarkable" story pages (Lynden call 2026-08-05).

WHY A FULL RE-RENDER RATHER THAN MORE PATCHING
----------------------------------------------
The lost boy has never been a real hero in this book. The girl gets her full
spec in every page prompt AND hero_reference.png injected into every scene;
the boy was one line of text ("dark jacket with green buttons") and shorthand
like "the small boy with stuffed panda". boy_reference.png was only made in
April, after the pages existed, and was only ever used for patch-up edits.

Two composition-preserving edit passes (2026-07-29, 2026-08-05) failed the same
way: each pass fixes the attribute it names and silently re-rolls the ones it
doesn't. The result across the eight pages was three different haircuts, green
buttons present on some pages and absent on others, the patch pocket missing or
mirrored, and shoes flipping between white, navy and black.

So this script does what CLAUDE.md already prescribes — consistency comes from
injecting the reference, not from describing the character — and injects BOTH
hero_reference.png (girl) and boy_reference.png (boy) into every scene, with
both locked specs (GIRL_SPEC / BOY_SPEC in the story data) inlined in the
prompt text.

This REPLACES the artwork: compositions will differ from the approved pages.
Originals are backed up to page{N}_pre_rerender.png.

    py -3.12 scripts/rerender_L8_2_pages.py            # all 8 pages
    py -3.12 scripts/rerender_L8_2_pages.py 1 4 6      # named pages only
"""
from __future__ import annotations

import base64
import shutil
import sys
import time
from pathlib import Path

import requests

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR.parent))

from generate_gemini_images import BASE_STYLE  # noqa: E402
from regen_scene_vertex import vertex_auth  # noqa: E402
from data.remarkable_story_l6_2_book1 import REMARKABLE_STORY_BOOK1  # noqa: E402

BOOK_DIR = BASE_DIR.parent / "output" / "images" / "L8_2_B1"
SUFFIX = "_pre_rerender"
REGION = "us-central1"
MODEL = "gemini-2.5-flash-image"
REQUEST_DELAY = 5

CONSISTENCY = (
    "BOTH children are established characters and MUST match their reference "
    "images exactly — the older girl matches REFERENCE IMAGE 1 and the little "
    "lost boy matches REFERENCE IMAGE 2. The boy's three fixed identifiers are "
    "non-negotiable and must be clearly visible in this picture: (1) his NEAT "
    "SHORT BLACK BOWL CUT, cut above the ears so both ears show — never a long "
    "helmet of hair covering the ears; (2) the vertical row of round BRIGHT "
    "GREEN buttons down the centre front of his navy jacket; (3) his WHITE "
    "trainers. He is a THREE-year-old toddler and must be drawn much smaller "
    "than the girl."
)


def generate(girl_b64: str, boy_b64: str, prompt: str, label: str) -> bytes | None:
    tok, proj = vertex_auth()
    url = (f"https://{REGION}-aiplatform.googleapis.com/v1/projects/{proj}"
           f"/locations/{REGION}/publishers/google/models/{MODEL}:generateContent")
    parts = [
        {"text": "REFERENCE IMAGE 1 — the older girl, the main character. Keep "
                 "her exact appearance, outfit and hair in the generated scene:"},
        {"inlineData": {"mimeType": "image/png", "data": girl_b64}},
        {"text": "REFERENCE IMAGE 2 — the little lost boy, the secondary "
                 "character. Keep his exact face, bowl-cut hair, navy jacket "
                 "with its row of green buttons and patch pocket, white "
                 "trainers and toddler proportions in the generated scene:"},
        {"inlineData": {"mimeType": "image/png", "data": boy_b64}},
        {"text": f"SCENE TO GENERATE: {prompt} {CONSISTENCY} {BASE_STYLE}"},
    ]
    payload = {"contents": [{"role": "user", "parts": parts}],
               "generationConfig": {"responseModalities": ["IMAGE"]}}
    headers = {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}
    for attempt in range(4):
        r = requests.post(url, json=payload, headers=headers, timeout=300)
        if r.status_code == 429:
            wait = 15 * (2 ** attempt)
            print(f"   [{label}] rate-limited, sleeping {wait}s")
            time.sleep(wait)
            continue
        if r.status_code != 200:
            print(f"   [{label}] HTTP {r.status_code}: {r.text[:300]}")
            return None
        cands = (r.json().get("candidates") or [{}])[0]
        for part in cands.get("content", {}).get("parts", []):
            if "inlineData" in part:
                return base64.b64decode(part["inlineData"]["data"])
        print(f"   [{label}] no image in response")
        return None
    return None


def main() -> None:
    pages = {p["page_number"]: p for p in
             REMARKABLE_STORY_BOOK1["L6_2_B1"]["story_pages"]}

    wanted = [int(a) for a in sys.argv[1:] if a.isdigit()] or sorted(pages)
    bad = [n for n in wanted if n not in pages]
    if bad:
        sys.exit(f"no such page(s): {bad}")

    girl_ref = BOOK_DIR / "hero_reference.png"
    boy_ref = BOOK_DIR / "boy_reference.png"
    for p in (girl_ref, boy_ref):
        if not p.exists():
            sys.exit(f"missing reference: {p}")
    girl_b64 = base64.b64encode(girl_ref.read_bytes()).decode()
    boy_b64 = base64.b64encode(boy_ref.read_bytes()).decode()

    failed = []
    for n in wanted:
        label = f"page{n}"
        out = BOOK_DIR / f"{label}.png"
        backup = BOOK_DIR / f"{label}{SUFFIX}.png"
        if out.exists() and not backup.exists():
            shutil.copy2(out, backup)

        print(f"[{label}] rendering...")
        raw = generate(girl_b64, boy_b64, pages[n]["image_prompt"], label)
        if not raw:
            print(f"   [{label}] FAILED — original left in place")
            failed.append(label)
            continue
        out.write_bytes(raw)
        print(f"   [{label}] saved ({len(raw) // 1024} KB)")
        time.sleep(REQUEST_DELAY)

    print(f"\nDone. Originals kept as *{SUFFIX}.png")
    if failed:
        print(f"FAILED: {', '.join(failed)}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
