"""Build BIRD references for 8.4 with correct solid-black-dot eyes.

Lynden 2026-08-05: "the eye rule extends to all living things, remember this is
an islamic business. no white."

Prompting alone will not do it. Told to give a bird plain black eyes the model
complies for the children and hands the bird a pale iris and a catchlight every
time — in edits AND in fresh generations. A second corrective pass fixes the
bird but damages the rest of the frame (it gave the boy white eyes and moved 34%
of the pixels).

The pattern that DOES work is already in this repo: scripts/fix_l4_2_owl_eyes.py
injects an OWL REFERENCE whose eyes are correct, and the scene inherits them —
hero injection, applied to the animal. So generate one clean reference per bird
species here, verify the eyes, and inject them into every page alongside the
people. A bird alone on a plain background is also trivial to correct
deterministically if the eye still comes out wrong, because nothing else is near
it (row-span fill between the outline edges — see feedback_mpb_eye_style_rule).

    py -3.12 scripts/make_L8_4_bird_refs.py
"""

import asyncio
import base64
import subprocess
import sys
from pathlib import Path

import aiohttp

BASE = Path(__file__).parent.parent
BOOK_DIR = BASE / "output" / "images" / "L8_4_B1"
EYE_STYLE_REF = BOOK_DIR / "hero_tom.png"      # approved, correct black dot eyes

EYE_RULE = (
    "CRITICAL EYE RULE: the bird's eye must be ONE SINGLE SOLID BLACK FILLED "
    "DOT — a plain black circle, completely filled. NO white at all. NO white "
    "sclera, NO coloured iris, NO pale ring, NO pupil ring, NO catchlight, NO "
    "highlight, NO glint, NO shine. Look at the EYE STYLE REFERENCE image: the "
    "boy's eyes are simple solid black dots with zero white. The bird's eye must "
    "be exactly that — a flat black dot and nothing more."
)

STYLE = (
    "Whimsical children's book illustration, hand-drawn cartoon style, clean "
    "black outlines, soft watercolour texture, warm friendly colours. The bird "
    "stands alone, full body, side-on, centred on a PLAIN light cream background "
    "with no scenery, no plants, no ground, no shadow, no other objects. "
    "No text, words, letters or numbers in the image."
)

BIRDS = {
    "bird_lyrebird_reference": (
        "A superb lyrebird: a ground-dwelling Australian bird the size of a "
        "chicken, warm brown body plumage, paler cream throat and chest, strong "
        "grey legs, a slender dark curved beak, a small crest of fine feathers "
        "on the head, and an ENORMOUS spectacular silver-grey lyre-shaped tail "
        "fanned wide and upright behind it with delicate feather barring. "
        "Standing side-on, beak slightly open as if singing."
    ),
    "bird_rosella_reference": (
        "A crimson rosella: a small bright Australian parrot with vivid scarlet "
        "red head, chest and belly, deep blue cheeks, blue and black patterned "
        "wings and a blue tail, pale curved beak, grey feet. "
        "Perched side-on on a short bare twig."
    ),
}


def vertex_auth():
    def g(*a):
        return subprocess.run(["gcloud", *a], capture_output=True,
                              text=True, shell=True).stdout.strip()
    tok, proj = g("auth", "print-access-token"), g("config", "get-value", "project")
    if not tok or not proj:
        raise RuntimeError("needs `gcloud auth login`")
    return tok, proj


def b64(p: Path) -> str:
    return base64.b64encode(p.read_bytes()).decode("utf-8")


async def main():
    tok, proj = vertex_auth()
    url = (f"https://us-central1-aiplatform.googleapis.com/v1/projects/{proj}"
           "/locations/us-central1/publishers/google/models/"
           "gemini-2.5-flash-image:generateContent")
    headers = {"Authorization": f"Bearer {tok}"}
    eye_ref = b64(EYE_STYLE_REF)

    async with aiohttp.ClientSession() as session:
        for name, desc in BIRDS.items():
            parts = [
                {"text": "EYE STYLE REFERENCE — copy this eye style EXACTLY. "
                         "These eyes are tiny solid black dots with no white, no "
                         "iris, no highlight:"},
                {"inlineData": {"mimeType": "image/png", "data": eye_ref}},
                {"text": "SUBJECT TO GENERATE: %s %s %s" % (desc, EYE_RULE, STYLE)},
            ]
            payload = {"contents": [{"role": "user", "parts": parts}],
                       "generationConfig": {"responseModalities": ["IMAGE"]}}
            print("  [%s] generating..." % name)
            img = None
            for attempt in range(4):
                async with session.post(url, json=payload, headers=headers) as r:
                    if r.status == 200:
                        res = await r.json()
                        for c in res.get("candidates", []):
                            for p in c.get("content", {}).get("parts", []):
                                if "inlineData" in p:
                                    img = base64.b64decode(p["inlineData"]["data"])
                        break
                    print("    HTTP %s" % r.status)
                await asyncio.sleep(20 * (2 ** attempt))
            if img:
                (BOOK_DIR / ("%s.png" % name)).write_bytes(img)
                print("  [%s] saved (%.0f KB)" % (name, len(img) / 1024))
            else:
                print("  [%s] FAILED" % name)
            await asyncio.sleep(4)


if __name__ == "__main__":
    asyncio.run(main())
