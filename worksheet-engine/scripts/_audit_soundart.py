# Audit every soundart crop: does the image actually show its word, is the
# subject clipped, does the crop contain ruled lines or printed text? Flags
# go to soundart_audit.json for manual review of failures only.
import base64
import json
import re
from pathlib import Path

import requests

HERE = Path(__file__).resolve().parent.parent
ART = HERE / "public" / "soundart"
OUT = HERE / "output" / "_research" / "soundart_audit.json"

env = (HERE.parent / "myphonics_books" / ".env").read_text(encoding="utf-8")
KEY = re.search(r"OPENAI_API_KEY=(\S+)", env).group(1)


def check(png: Path, word: str) -> dict:
    b64 = base64.b64encode(png.read_bytes()).decode()
    r = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {KEY}"},
        json={
            "model": "gpt-4o",
            "temperature": 0,
            "response_format": {"type": "json_object"},
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "text", "text":
                        f'This clipart should depict the word "{word}" for a phonics worksheet. Return JSON: '
                        '{"shows": "<one or two words: what the image shows>", '
                        f'"matches": true/false (does it plausibly depict "{word}"?), '
                        '"clipped": true/false (is the subject visibly cut off at an edge?), '
                        '"junk": true/false (does the crop contain ruled handwriting lines, printed text or page furniture?)}'},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}", "detail": "low"}},
                ],
            }],
        },
        timeout=120,
    )
    r.raise_for_status()
    return json.loads(r.json()["choices"][0]["message"]["content"])


def main() -> None:
    results = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    pngs = sorted(ART.glob("*/*.png"))
    flagged = 0
    for i, png in enumerate(pngs):
        key = f"{png.parent.name}/{png.stem}"
        if key in results:
            continue
        word = png.stem.replace("_", " ")
        try:
            v = check(png, word)
        except Exception as e:  # noqa: BLE001
            v = {"error": str(e)}
        results[key] = v
        bad = (not v.get("matches", True)) or v.get("clipped") or v.get("junk") or v.get("error")
        if bad:
            flagged += 1
            print("FLAG", key, json.dumps(v))
        if i % 25 == 0:
            OUT.write_text(json.dumps(results, indent=2), encoding="utf-8")
    OUT.write_text(json.dumps(results, indent=2), encoding="utf-8")
    bad_total = [k for k, v in results.items()
                 if (not v.get("matches", True)) or v.get("clipped") or v.get("junk") or v.get("error")]
    print(f"{len(results)} checked, {len(bad_total)} flagged")
    for k in bad_total:
        print(" ", k, json.dumps(results[k]))


if __name__ == "__main__":
    main()
