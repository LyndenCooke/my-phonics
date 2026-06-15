"""Generate individual device/booklet mockup assets with gpt-image-2,
for compositing back into the crisp HTML leaflet.
Usage: py -3.12 generate_assets.py <asset>   (tablet|stack|phone|laptop)
"""
import base64
import io
import os
import sys
from pathlib import Path

from PIL import Image
from openai import OpenAI

HERE = Path(__file__).parent
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


STYLE = (
    "Clean studio product mockup on a PURE WHITE background with a single soft, "
    "subtle drop shadow under the object. Nothing else in frame — no props, no text, "
    "no watermarks, no background decoration of any kind. Photorealistic, premium, "
    "evenly lit. The supplied screenshot/cover must be reproduced EXACTLY, pixel-faithful, "
    "not redrawn, fully legible."
)

ASSETS = {
    "tablet": {
        "refs": [HERE / "assets" / "shot_reader_story.png"],
        "prompt": STYLE + " A slim modern black tablet in landscape orientation, rotated a "
        "subtle 5-degree three-quarter angle, displaying the supplied app screenshot "
        "(boy on a rug, sentence 'It is not a rat. It is not a bat.') filling its screen "
        "edge to edge with a thin black bezel.",
    },
    "stack": {
        "refs": [HERE / "assets" / "cover_L1.png"],
        "prompt": STYLE + " A small fanned stack of three VERY THIN saddle-stitched A5 "
        "children's booklets — each only about 16 pages, 2 millimetres thin, like a "
        "school reading pamphlet, NOT a thick book. The top booklet shows the supplied "
        "pink 'Tap! Tap! Tap!' cover exactly. The two beneath peek out slightly, rotated "
        "a few degrees, you can see their thin stapled page edges.",
    },
    "phone": {
        "refs": [HERE / "assets" / "crop_assessment.png"],
        "prompt": STYLE + " A modern smartphone standing upright, very slight tilt, "
        "displaying the supplied phonics assessment screenshot (white flash card with "
        "the letter 's', 'Not yet' and 'Correct' buttons) filling its screen with a thin "
        "black bezel.",
    },
    "laptop": {
        "refs": [HERE / "assets" / "crop_library.png"],
        "prompt": STYLE + " A slim modern silver laptop, open, facing slightly to the "
        "right at a gentle three-quarter angle, displaying the supplied children's book "
        "library screenshot (grid of colourful book cards) filling its screen.",
    },
}


def run(name: str):
    spec = ASSETS[name]
    client = OpenAI()
    uploads = [up(p, f"ref{i}.png") for i, p in enumerate(spec["refs"])]
    print(f"[{name}] generating...")
    resp = client.images.edit(
        model="gpt-image-2",
        image=uploads,
        prompt=spec["prompt"],
        size="1536x1024" if name in ("tablet", "laptop") else "1024x1024",
        quality="high",
        n=1,
    )
    data = base64.b64decode(resp.data[0].b64_json)
    out = HERE / "assets" / f"mock_{name}.png"
    out.write_bytes(data)
    print("saved", out)


if __name__ == "__main__":
    run(sys.argv[1])
