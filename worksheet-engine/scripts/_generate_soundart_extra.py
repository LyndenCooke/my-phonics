# Generate clipart for the five L3 graphemes that have no approved Sound Pack
# sheet (ch th ng qu zz), in the MyPhonicsBooks house style, via Vertex AI
# (the standalone Gemini key is billing-depleted). Words are selections from
# approved pools: word banks / book texts for the trace rows, the consultant-
# authored sound-book lists for the picture words.
import base64
import json
import subprocess
import sys
import time
from io import BytesIO
from pathlib import Path

import requests
from PIL import Image

HERE = Path(__file__).resolve().parent.parent
ROOT = HERE.parent
STYLE_REF = ROOT / "myphonics_books" / "output" / "images" / "L2_6_B1" / "object_ref_bird.png"
OUTROOT = HERE / "public" / "soundart"

REGION = "us-central1"
MODEL = "gemini-2.5-flash-image"

STYLE_RULES = (
    "MyPhonicsBooks interior illustration style: smooth dark vector-like "
    "outlines, soft flat colours with gentle shading, subtle paper grain "
    "texture inside the object only, gentle modern children's book look, "
    "simple recognisable silhouette, friendly and warm. "
    "Single isolated subject centred in frame on a plain pure white background "
    "(no scene, no other objects, no shadow on the floor, no border, no frame). "
    "STRICTLY NO text, no letters, no numbers, no words anywhere in the image. "
    "STRICTLY NOT: watercolour wash, pencil sketch, classroom clipart, Jolly "
    "Phonics style, Read Write Inc style, photorealism, 3D render, anime, "
    "manga. The reference image shows the EXACT style, line weight, texture, "
    "and palette feel I want - match it closely."
)

ITEMS: dict[str, dict[str, str]] = {
    "ch": {
        "chop": "a wooden chopping board with a carrot chopped into neat round slices",
        "chip": "golden potato chips in a red-and-white striped paper cone",
        "chin": "a smiling child's face in profile pointing one finger at their chin",
        "chat": "two friendly children sitting cross-legged facing each other, chatting",
        "chicken": "a friendly white hen with a red comb standing in side profile",
        "cheese": "a wedge of yellow cheese with round holes",
        "cherry": "two bright red cherries joined on one green stem with a leaf",
        "chair": "a simple wooden chair with a tall back, seen at a slight angle",
    },
    "th": {
        "thin": "a very tall thin striped drinking straw",
        "thick": "a thick closed blue book with many pages",
        "thumb": "a friendly hand giving a thumbs up",
        "tooth": "a single shiny white tooth with two roots",
        "throne": "a golden royal throne with red velvet cushioning",
        "thorn": "a green rose stem with several small thorns and one leaf",
    },
    "ng": {
        "sing": "a happy child singing with three small music notes floating beside them",
        "song": "a cluster of three cheerful music notes",
        "long": "a very long striped woolly scarf laid in a wavy line",
        "ring": "a gold ring with a round red gem",
        "bang": "a small toy drum with a starburst above it showing a loud bang",
        "king": "a friendly king with a gold crown and red robe",
        "wing": "a single white feathered bird wing, spread open",
        "swing": "a garden rope swing with a flat wooden seat",
        "spring": "a coiled silver metal spring",
    },
    "qu": {
        "quick": "a child running fast to the right with small motion lines behind them",
        "quack": "a yellow duck with an open orange beak, quacking",
        "queen": "a friendly queen with a silver crown and a blue royal gown",
        "quilt": "a folded patchwork quilt with colourful squares",
        "quail": "a small round brown quail bird with a curled head plume",
    },
    "zz": {
        "buzz": "a striped bumblebee in flight with small motion lines",
        "fizz": "a glass bottle of fizzy orange drink with rising bubbles",
        "jazz": "a golden saxophone",
        "puzzle": "a single large blue jigsaw puzzle piece",
        "blizzard": "a grey snow cloud with many snowflakes falling from it",
        "muzzle": "a friendly brown dog's face in profile with a long gentle muzzle",
    },
}


def auth() -> tuple[str, str]:
    tok = subprocess.run(["gcloud", "auth", "print-access-token"],
                         capture_output=True, text=True, shell=True).stdout.strip()
    proj = subprocess.run(["gcloud", "config", "get-value", "project"],
                          capture_output=True, text=True, shell=True).stdout.strip()
    if not tok or not proj:
        sys.exit("gcloud auth unavailable")
    return tok, proj


def generate(token: str, project: str, ref_b64: str, prompt: str) -> bytes | None:
    url = (f"https://{REGION}-aiplatform.googleapis.com/v1/projects/{project}"
           f"/locations/{REGION}/publishers/google/models/{MODEL}:generateContent")
    payload = {
        "contents": [{
            "role": "user",
            "parts": [
                {"inlineData": {"mimeType": "image/png", "data": ref_b64}},
                {"text": prompt},
            ],
        }],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }
    for attempt in range(4):
        r = requests.post(url, json=payload,
                          headers={"Authorization": f"Bearer {token}"}, timeout=180)
        if r.status_code == 200:
            for cand in r.json().get("candidates", []):
                for part in cand.get("content", {}).get("parts", []):
                    inline = part.get("inlineData") or part.get("inline_data")
                    if inline and "data" in inline:
                        return base64.b64decode(inline["data"])
            return None
        print(f"   HTTP {r.status_code}: {r.text[:200]}")
        time.sleep(5 * (2 ** attempt))
    return None


def postprocess(raw: bytes) -> bytes:
    img = Image.open(BytesIO(raw)).convert("RGB")
    w, h = img.size
    side = min(w, h)
    img = img.crop(((w - side) // 2, (h - side) // 2, (w + side) // 2, (h + side) // 2))
    img = img.resize((768, 768), Image.LANCZOS)
    out = BytesIO()
    img.save(out, format="PNG", optimize=True)
    return out.getvalue()


def main() -> None:
    token, project = auth()
    ref_b64 = base64.b64encode(STYLE_REF.read_bytes()).decode()
    report = {}
    for g, words in ITEMS.items():
        outdir = OUTROOT / g
        outdir.mkdir(parents=True, exist_ok=True)
        for word, obj in words.items():
            out = outdir / f"{word}.png"
            if out.exists() and out.stat().st_size > 5000:
                print(f"{g}/{word} exists, skip")
                continue
            prompt = f"Create a clean isolated children's book illustration of {obj}. {STYLE_RULES}"
            raw = generate(token, project, ref_b64, prompt)
            if raw:
                out.write_bytes(postprocess(raw))
                print(f"{g}/{word} saved")
                report[f"{g}/{word}"] = "ok"
            else:
                print(f"{g}/{word} FAILED")
                report[f"{g}/{word}"] = "failed"
            time.sleep(2)
    (OUTROOT / "_extra_report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print("done:", sum(1 for v in report.values() if v == "ok"), "generated")


if __name__ == "__main__":
    main()
