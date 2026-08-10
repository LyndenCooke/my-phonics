"""Build ALL references for 8.4 from scratch — characters AND animals.

Lynden 2026-08-05: "when I say redo, I mean strip everything and start again.
You can start without trying to be consistent with the old story, the old
pictures, and old characters. That's what's confusing you." Plus: one animal per
image, and build the reference BEFORE putting it in a scene.

So nothing here inherits from the previous art. The old L8_4_B1 folder was moved
to _archive_L8_4_B1_*, and every reference below is generated new.

Character designs are deliberately made UNCONFUSABLE, because the drift that
started all this was Mia turning ginger on page 1 and losing her ponytail into a
shapeless bun:
  Mia — DARK BROWN hair, simple NEAT LOW ponytail (never a bun, never a big
        round mass on top of the head)
  Tom — GINGER hair, short and cropped
Nobody else in the book has either colour, so a swap is immediately visible.

Eyes: prompting alone never gives an ANIMAL solid black eyes, however emphatic.
Generate, then check, then fix deterministically with scripts/solidify_eye.py
(read coordinates off scripts/grid_overlay.py — never estimate them). Once a
reference is correct, injecting it is what carries correct eyes into the scenes.

    py -3.12 scripts/build_L8_4_refs.py            # all
    py -3.12 scripts/build_L8_4_refs.py hero_mia   # named
"""

import asyncio
import base64
import subprocess
import sys
from pathlib import Path

import aiohttp

BOOK_DIR = Path(__file__).parent.parent / "output" / "images" / "L8_4_B1"
# MANDATORY per .claude/skills/art-generator §1: never generate a hero from text
# alone — inject an APPROVED hero from an earlier book so the eye style is copied
# visually. Skipping this is exactly why the first pass produced big white-sclera
# eyes that then had to be painted, and painted eyes do not transfer cleanly into
# scenes. With the reference injected the eyes come out natively correct.
# A HUMAN eye-style reference fixes humans but not birds — the model keeps its
# own idea of a bird eye. So animals get an ANIMAL whose eye is already right:
# L4.6's little bird has a clean solid black dot, and L6.2's barn owl has solid
# black almond eyes. Injecting those beats painting an oval on afterwards, which
# reads as crude and pasted-on (Lynden, 2026-08-05).
EYE_STYLE_HUMAN = (Path(__file__).parent.parent / "output" / "images" /
                   "L4_1_B1" / "hero_reference.png")
EYE_STYLE_ANIMAL = (Path(__file__).parent.parent / "output" / "images" /
                    "L4_6_B1" / "object_ref_bird.png")
EYE_STYLE_ANIMAL2 = (Path(__file__).parent.parent / "output" / "images" /
                     "L6_2_B1" / "owl_reference.png")
REQUEST_DELAY = 4
MAX_RETRIES = 5
BACKOFF_BASE = 20

EYE_RULE = (
    "CRITICAL EYE RULE: each eye is ONE SINGLE SOLID BLACK FILLED DOT — a plain "
    "black circle, completely filled. NO white anywhere in the eye. NO white "
    "sclera, NO coloured iris, NO pale ring, NO pupil ring, NO catchlight, NO "
    "highlight, NO glint. Just a flat black dot."
)

STYLE = (
    "Whimsical children's book illustration, hand-drawn cartoon style, clean "
    "black outlines, flat colour with soft watercolour texture, warm and simple. "
    "The subject stands alone, full body, centred on a PLAIN light cream "
    "background — no scenery, no plants, no ground, no shadow, no other objects, "
    "nothing else at all. No text, words, letters or numbers in the image."
)

REFS = {
    "hero_mia": (
        "A cartoon girl of about 9 or 10 called Mia. Skin #9C6B4A (warm mid "
        "brown). Hair BLACK, worn in ONE long single plait hanging over her "
        "shoulder in front — not loose, not a ponytail, not a bun. "
        "She wears a PURPLE long-sleeved top, NAVY BLUE long trousers covering "
        "her legs to the ankle, and teal canvas shoes. No bag, nothing in her "
        "hands. Standing facing the viewer, arms slightly away from her sides, "
        "full body from head to shoes. A bright, eager expression. No blush "
        "circles on the cheeks."
    ),
    "hero_tom": (
        "A cartoon boy of about 7 or 8 called Tom, the girl's YOUNGER brother, "
        "clearly SHORTER than her. Same family: skin #9C6B4A (warm mid brown), "
        "BLACK hair, short and tightly curled. "
        "He wears a MUSTARD YELLOW t-shirt, DARK GREEN long trousers covering "
        "his legs to the ankle, and brown boots, and holds a small closed "
        "sketchbook against his chest with both hands. Standing facing the "
        "viewer, full body from head to boots. A calm, watchful expression. No "
        "blush circles on the cheeks."
    ),
    "hero_dad": (
        "A cartoon adult man in his forties, the children's dad. Same family: "
        "skin #8A5C3E, black hair, neat short black beard. He wears a BLUE "
        "CHECKED shirt with the sleeves rolled up, STONE-GREY long trousers, "
        "brown walking boots and a navy cap. Standing facing the viewer, full "
        "body from cap to boots, relaxed and kind. No blush circles."
    ),
    "animal_lyrebird": (
        "A superb lyrebird: an Australian ground bird about the size of a "
        "chicken, warm brown body, paler cream throat, strong grey legs, "
        "slender dark curved beak, small fine crest, and an ENORMOUS "
        "silver-grey lyre-shaped tail fanned wide and upright behind it. "
        "Standing side-on, beak open as if singing."
    ),
    "animal_rosella": (
        "A crimson rosella: a small Australian parrot with a vivid scarlet red "
        "head, chest and belly, deep blue cheek patch, blue and black wings, a "
        "blue tail, pale curved beak and grey feet. Perched side-on on a short "
        "bare twig."
    ),
}

ORDER = ["hero_mia", "hero_tom", "hero_dad", "animal_lyrebird", "animal_rosella"]


def vertex_auth():
    def g(*a):
        return subprocess.run(["gcloud", *a], capture_output=True,
                              text=True, shell=True).stdout.strip()
    tok, proj = g("auth", "print-access-token"), g("config", "get-value", "project")
    if not tok or not proj:
        raise RuntimeError("needs `gcloud auth login`")
    return tok, proj


async def main():
    targets = [a for a in sys.argv[1:] if not a.startswith("-")] or ORDER
    bad = [t for t in targets if t not in REFS]
    if bad:
        sys.exit("unknown: %s" % bad)

    tok, proj = vertex_auth()
    url = (f"https://us-central1-aiplatform.googleapis.com/v1/projects/{proj}"
           "/locations/us-central1/publishers/google/models/"
           "gemini-2.5-flash-image:generateContent")
    headers = {"Authorization": f"Bearer {tok}"}
    BOOK_DIR.mkdir(parents=True, exist_ok=True)

    async with aiohttp.ClientSession() as session:
        for name in ORDER:
            if name not in targets:
                continue
            is_animal = name.startswith("animal_")
            refs = ([EYE_STYLE_ANIMAL, EYE_STYLE_ANIMAL2] if is_animal
                    else [EYE_STYLE_HUMAN])
            parts = []
            for rp in refs:
                parts.append({"text":
                    "EYE STYLE REFERENCE — the %s you generate MUST have this "
                    "EXACT eye style. Look closely at this animal's eye: it is "
                    "ONE tiny solid black filled dot, with no white, no sclera, "
                    "no coloured iris, no pale ring and no highlight. Copy that "
                    "eye exactly." % ("bird" if is_animal else "character")})
                parts.append({"inlineData": {"mimeType": "image/png",
                              "data": base64.b64encode(rp.read_bytes()).decode()}})
            parts.append({"text":
                "Now generate a COMPLETELY DIFFERENT subject (a different "
                "species/person, not the one above) but with that SAME tiny "
                "solid black eye. SUBJECT: %s %s %s"
                % (REFS[name], EYE_RULE, STYLE)})
            payload = {"contents": [{"role": "user", "parts": parts}],
                       "generationConfig": {"responseModalities": ["IMAGE"]}}
            print("  [%s] generating..." % name)
            img = None
            for attempt in range(MAX_RETRIES):
                try:
                    async with session.post(url, json=payload,
                                            headers=headers) as r:
                        if r.status == 200:
                            res = await r.json()
                            for c in res.get("candidates", []):
                                for p in c.get("content", {}).get("parts", []):
                                    if "inlineData" in p:
                                        img = base64.b64decode(
                                            p["inlineData"]["data"])
                            break
                        print("    HTTP %s" % r.status)
                except Exception as e:
                    print("    %s" % e)
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(BACKOFF_BASE * (2 ** attempt))
            if img:
                (BOOK_DIR / ("%s.png" % name)).write_bytes(img)
                print("  [%s] saved (%.0f KB)" % (name, len(img) / 1024))
            else:
                print("  [%s] FAILED" % name)
            await asyncio.sleep(REQUEST_DELAY)


if __name__ == "__main__":
    asyncio.run(main())
