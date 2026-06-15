"""Polish the rendered leaflet sides with gpt-image-2 (images.edit).

Sends the HTML-rendered side as the master layout reference plus the raw
screenshots/logo so the model can re-set them faithfully (e.g. screen
content placed onto laptop/tablet mockups). Run:  py -3.12 polish_gptimage.py front|back
"""
import io
import os
import sys
from pathlib import Path

from PIL import Image
from openai import OpenAI

HERE = Path(__file__).parent
OUT = HERE / "output"
ENV = HERE.parent.parent / "myphonics_books" / ".env"

for line in ENV.read_text().splitlines():
    if line.strip() and not line.startswith("#") and "=" in line:
        k, _, v = line.partition("=")
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def up(path: Path, name: str, max_dim: int = 1400):
    im = Image.open(path).convert("RGB")
    im.thumbnail((max_dim, max_dim), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    return (name, buf.getvalue(), "image/png")


COMMON = (
    "You are re-setting an A5 print leaflet for the children's reading brand 'my phonics books'. "
    "The FIRST supplied image is the finished leaflet layout — recreate it faithfully: SAME layout, "
    "SAME copy word-for-word (do not invent, drop or reword ANY text), same brand colours "
    "(navy #27344A, pink #E84B8A, cream) and the same fonts (rounded geometric sans). "
    "Use the other supplied images as exact sources — never redraw the logo, book covers or "
    "app screenshots; place them photographically. "
    "Where a QR code appears, render a plain black-on-white QR placeholder square in exactly the "
    "same position and size (it will be replaced afterwards). "
    "Finish: premium, airy, modern children's publishing leaflet; crisp print-ready vector look; "
    "soft realistic shadows; no sparkles, no extra characters, no extra text anywhere."
)

SPECS = {
    "front": {
        "refs": [
            OUT / "leaflet_front.png",
            HERE.parent.parent / "public" / "logo" / "mpb-lockup.png",
            HERE / "assets" / "shot_reader_story.png",
            HERE / "assets" / "cover_L1.png",
        ],
        "prompt": COMMON + "\n\nUPGRADES for this side only — make it clearly look like a "
        "professionally art-directed print advert, NOT a flat web page:\n"
        "- Background: soft hand-painted cream/blush watercolour wash with gentle pastel blooms "
        "in the corners and subtle paper grain, instead of flat fills.\n"
        "- The row of EIGHT book covers: keep exactly eight covers in the same order with their "
        "coloured banners (pink, coral, amber, green, blue, indigo, purple, teal) lining up with "
        "the numbered 1-8 rainbow bar below — but render them as physical books with visible "
        "thickness, slight individual tilts, and soft realistic drop shadows, as if standing on "
        "an invisible shelf.\n"
        "- In the 'Read on screen' card, place the supplied app screenshot (boy on rug, 'It is "
        "not a rat. It is not a bat.') on a glossy modern tablet held at a slight 3/4 angle, with "
        "realistic screen reflection and shadow.\n"
        "- In the 'Or print at home' card, show the supplied pink 'Tap! Tap! Tap!' cover as a "
        "photoreal stack of three printed A5 booklets, fanned, with visible page edges.\n"
        "- Give the navy footer strip a very subtle dark gradient and let the QR placeholder sit "
        "on a softly shadowed white card.\n"
        "- Headline and all body text stay word-for-word identical, but typeset with crisp "
        "professional kerning and gentle ink texture.",
    },
    "back": {
        "refs": [
            OUT / "leaflet_back.png",
            HERE / "assets" / "crop_assessment.png",
            HERE / "assets" / "crop_library.png",
            HERE / "assets" / "shot_reader_story.png",
        ],
        "prompt": COMMON + "\n\nUPGRADES for this side only:\n"
        "- Step 1 'Check': place the supplied assessment screenshot (white card with the letter "
        "'s', Not yet / Correct buttons) on the screen of a modern smartphone mockup held upright.\n"
        "- Step 2 'Match': place the supplied library screenshot (grid of children's book cards) "
        "on the screen of a slim silver laptop mockup.\n"
        "- Step 3 'Read': place the supplied reader screenshot (boy on rug, 'It is not a rat.') on "
        "a tablet mockup in landscape.\n"
        "- Keep the three numbered step rows, the 'What's inside' checklist and the footer exactly "
        "as in the layout reference.",
    },
}


def run(side: str, tag: str = ""):
    spec = SPECS[side]
    client = OpenAI()
    uploads = [up(p, f"ref{i}.png") for i, p in enumerate(spec["refs"])]
    print(f"[{side}] sending {len(uploads)} refs to gpt-image-2...")
    resp = client.images.edit(
        model="gpt-image-2",
        image=uploads,
        prompt=spec["prompt"],
        size="1024x1536",
        quality="high",
        n=1,
    )
    import base64
    data = base64.b64decode(resp.data[0].b64_json)
    out = OUT / f"polished_{side}{tag}.png"
    out.write_bytes(data)
    print("saved", out)


if __name__ == "__main__":
    side = sys.argv[1] if len(sys.argv) > 1 else "front"
    tag = sys.argv[2] if len(sys.argv) > 2 else ""
    run(side, tag)
