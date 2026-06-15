# ---------------------------------------------------------------------------
# generate_w2_covers.py — workbook covers for all 8 levels in the style of the
# approved reference (docs/cover_refs/favourite.png, Lynden's pick).
#
# gpt-image-2 /images/edit with the favourite as the style anchor; per level it
# swaps the background to the ledger colour, the hero to an animal/object from
# that level's books, and the cover copy. Output is centre-cropped to the A4
# ratio, then gpt-4o vision-checks the CROPPED image (exact text, single hero,
# nothing clipped) and failures regenerate, up to 3 attempts.
#
#   py -3.12 scripts/generate_w2_covers.py        # all levels
#   py -3.12 scripts/generate_w2_covers.py 3 7    # just these
# Output: public/covers/w2/l<n>.png  (+ output/_research/w2_cover_qa.json)
# ---------------------------------------------------------------------------
import base64
import io
import json
import re
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests
from PIL import Image

HERE = Path(__file__).resolve().parent.parent
REF = HERE / "docs" / "cover_refs" / "favourite.png"
OUT = HERE / "public" / "covers" / "w2"
QA_OUT = HERE / "output" / "_research" / "w2_cover_qa.json"
OUT.mkdir(parents=True, exist_ok=True)
QA_OUT.parent.mkdir(parents=True, exist_ok=True)

env = (HERE.parent / "myphonics_books" / ".env").read_text(encoding="utf-8")
KEY = re.search(r"OPENAI_API_KEY=(\S+)", env).group(1)
HDR = {"Authorization": f"Bearer {KEY}"}

# Ledger colours + names mirror src/design/levelThemes.ts — keep in sync.
# Heroes are OBJECTS from that level's workbook books (Lynden 2026-06-13: no
# animals — generated animal faces don't follow the house eye pattern — and a
# book object must keep its identifying feature in B/W line art, e.g. the L5
# boat's stripes). Keep in sync with generate_w2_covers_vertex.py.
LEVELS = {
    1: {"name": "Ditties",          "hex": "#E84B8A", "colour": "vivid pink",
        "hero": "a mop standing in a round bucket, from 'The Mud on the Dog'",
        "skills": "sounds · grammar · spelling · big writes"},
    2: {"name": "First Sounds",     "hex": "#F97066", "colour": "warm coral",
        "hero": "a pair of cosy knitted socks side by side, each with a ribbed "
                "cuff, from 'The Red Socks'",
        "skills": "sounds · grammar · spelling · big writes"},
    3: {"name": "Special Friends",  "hex": "#F59E0B", "colour": "warm amber-orange",
        "hero": "a simple rectangular fish tank with pebbles, one water plant "
                "and a few rising bubbles (no fish), from 'The Fish in the Tank'",
        "skills": "sounds · grammar · spelling · big writes"},
    4: {"name": "Longer Sounds",    "hex": "#22C55E", "colour": "fresh green",
        "hero": "a simple farm barn with big double doors and a hay bale beside "
                "it, from 'Morning on the Farm'",
        "skills": "grammar · spelling · big writes · handwriting"},
    5: {"name": "New Spellings",    "hex": "#3B82F6", "colour": "bright blue",
        "hero": "a small sailing boat with one big triangular sail, a bold "
                "stripe along the front edge of the sail and one bold horizontal "
                "stripe along the hull, sitting on two simple wavy water lines, "
                "from 'The Boat with the Red Sail' (the stripes must be clearly "
                "visible even in white line art)",
        "skills": "grammar · spelling · big writes · handwriting"},
    6: {"name": "Building Fluency", "hex": "#6366F1", "colour": "indigo-violet",
        "hero": "a leafy fern with gracefully arching fronds growing from a "
                "small plant pot, from 'The Purple Purse' (the word fern is in "
                "the book)",
        "skills": "grammar · spelling · big writes · handwriting"},
    7: {"name": "Reading Together", "hex": "#8B5CF6", "colour": "rich purple",
        "hero": "a tall lighthouse with horizontal stripes standing on a small "
                "rock, from 'Before the Shore'",
        "skills": "grammar · spelling · big writes · handwriting"},
    8: {"name": "Reading Champion", "hex": "#14B8A6", "colour": "teal",
        "hero": "a row of three small friendly houses with pitched roofs, from "
                "'The Marvellous Neighbourhood'",
        "skills": "grammar · spelling · big writes · handwriting"},
}

A4 = 297 / 210  # crop target: full-bleed A4 portrait


def prompt_for(n: int) -> str:
    L = LEVELS[n]
    return (
        "Recreate this exact children's workbook cover, keeping the identical layout, "
        "composition, hand-drawn white line-art illustration style, typography, white "
        "outlined badge, decorative corner stars, white Name/Class panel at the bottom "
        "left and the MyPhonicsBooks logo at the bottom — change ONLY the following:\n"
        f"1. The entire flat background colour becomes {L['colour']} (hex {L['hex']}) — "
        "one single solid flat colour everywhere, no gradients.\n"
        f"2. The badge at the top reads exactly: LEVEL {n} · {L['name'].upper()}\n"
        "3. The big main title reads exactly: Workbook\n"
        f"4. The decorated line under the title reads exactly: Level {n} · {L['name']}\n"
        f"5. The small dot-separated line under that reads exactly: {L['skills']}\n"
        f"6. The illustration becomes {L['hero']}, drawn as simple white line art with "
        "the same weight and charm as the reference illustration, one single subject.\n"
        "Every word must be spelled exactly as given. Keep every element well inside "
        "the edges with generous breathing room — nothing may touch or sit near the "
        "top or bottom edge of the image."
    )


def crop_a4(png: bytes) -> bytes:
    im = Image.open(io.BytesIO(png)).convert("RGB")
    w, h = im.size
    want_h = round(w * A4)
    if h > want_h:
        top = (h - want_h) // 2
        im = im.crop((0, top, w, top + want_h))
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    return buf.getvalue()


def generate(n: int) -> bytes:
    r = requests.post(
        "https://api.openai.com/v1/images/edits",
        headers=HDR,
        files={"image[]": ("ref.png", REF.read_bytes(), "image/png")},
        data={"model": "gpt-image-2", "prompt": prompt_for(n),
              "size": "1024x1536", "quality": "high", "n": 1},
        timeout=300,
    )
    r.raise_for_status()
    return base64.b64decode(r.json()["data"][0]["b64_json"])


def qa(n: int, png: bytes) -> dict:
    L = LEVELS[n]
    b64 = base64.b64encode(png).decode()
    expect = (
        f"badge 'LEVEL {n} · {L['name'].upper()}', title 'Workbook', "
        f"subtitle 'Level {n} · {L['name']}', skills line '{L['skills']}', "
        f"a Name/Class panel, a MyPhonicsBooks logo, and the illustration: {L['hero']}"
    )
    r = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers=HDR,
        json={
            "model": "gpt-4o", "temperature": 0,
            "response_format": {"type": "json_object"},
            "messages": [{"role": "user", "content": [
                {"type": "text", "text":
                    "You are QA-checking a children's workbook cover. It must contain: "
                    + expect + ". Check: (1) every piece of text is spelled EXACTLY "
                    "right with no typos or duplicated/garbled words, (2) there is ONE "
                    "single hero illustration matching the description, (3) no element "
                    "is cut off by any edge of the image, (4) the background is one "
                    "flat solid colour. Reply JSON: {\"pass\": bool, \"problems\": "
                    "[strings]}"},
                {"type": "image_url",
                 "image_url": {"url": f"data:image/png;base64,{b64}"}},
            ]}],
        },
        timeout=120,
    )
    r.raise_for_status()
    return json.loads(r.json()["choices"][0]["message"]["content"])


def run(n: int) -> dict:
    last = None
    for attempt in range(1, 4):
        try:
            png = crop_a4(generate(n))
            verdict = qa(n, png)
            last = {"level": n, "attempt": attempt, **verdict}
            print(f"[L{n}] attempt {attempt}: "
                  f"{'PASS' if verdict.get('pass') else verdict.get('problems')}")
            if verdict.get("pass"):
                (OUT / f"l{n}.png").write_bytes(png)
                return last
            # keep the latest attempt anyway so there is always something to eyeball
            (OUT / f"l{n}.png").write_bytes(png)
        except Exception as e:  # noqa: BLE001 — log and retry, this is a batch tool
            print(f"[L{n}] attempt {attempt} ERROR: {e}")
            last = {"level": n, "attempt": attempt, "pass": False, "problems": [str(e)]}
    return last


def main():
    levels = [int(a) for a in sys.argv[1:]] or list(LEVELS)
    with ThreadPoolExecutor(max_workers=4) as ex:
        results = list(ex.map(run, levels))
    QA_OUT.write_text(json.dumps(results, indent=2), encoding="utf-8")
    bad = [r for r in results if not r.get("pass")]
    print(f"\n{len(results) - len(bad)}/{len(results)} passed -> {OUT}")
    for r in bad:
        print(f"  L{r['level']} STILL FAILING: {r.get('problems')}")


if __name__ == "__main__":
    main()
