"""
Let gpt-image-1 compose the whole Facebook creative from the real assets:
the day's sheet pages (first page of each), the story's booklet cutout and the
logo go in as reference images via /v1/images/edits, with a layout brief.

  py -3.12 scripts/social/gen_creative_ai.py 004 [--quality high] [--out path]
"""
import argparse
import io
import json
import os
import sys
import uuid
import urllib.request
import base64

import fitz

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_icons import key  # noqa: E402

LOGO = os.path.join(ROOT, "public", "logo", "mpb-lockup.png")
CUTOUTS = os.path.join(ROOT, "public", "shop", "cutouts")

BRIEF = """Design a professional, scroll-stopping 1:1 Facebook ad for MyPhonicsBooks, a UK children's phonics brand.
Reference image 1 is the brand logo lockup: reproduce it EXACTLY, unchanged, bottom-right.
{cut_line}
The remaining reference images are real worksheet pages: show them as {n} sheets of white paper fanned out in the centre of the image with soft drop shadows, reproducing each page's content faithfully (same layout, same drawings, same words) and legibly.
Layout: clean white background. Top: a small lavender pill label reading "FREE PHONICS WORKSHEETS". Below it a big bold dark-navy (#1E2A4A) rounded sans-serif headline reading exactly "{headline}" and a smaller grey subline reading exactly "{subline}". A tilted yellow round sticker top-right reading "{sticker}". A few small pink (#E84B8A) burst accents.
Bottom: a row of four small flat icons with captions "Builds reading skills", "Fun and engaging", "Ideal for home learning", "Supports confidence"; then a green (#4ABD6D) pill button reading "Download for free" with a download arrow icon.
Style: flat vector, friendly, premium education brand, brand colours navy #1E2A4A, pink #E84B8A, yellow #FFD60A, green #4ABD6D, lavender #E4DAFA. All text must be spelled exactly as given, no extra text, no watermarks."""


def sheet_pngs(item):
    out = []
    for s in item.get("sheets", [])[:3]:
        p = os.path.join(ROOT, s["local"])
        doc = fitz.open(p) if os.path.exists(p) else fitz.open(stream=urllib.request.urlopen(s["url"]).read(), filetype="pdf")
        out.append(doc[0].get_pixmap(dpi=100).tobytes("png"))
    return out


def edit(images, prompt, quality):
    boundary = uuid.uuid4().hex
    body = b""
    def field(name, value):
        return f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n".encode()
    body += field("model", "gpt-image-1") + field("prompt", prompt) + field("size", "1024x1024") + field("quality", quality) + field("n", "1")
    for i, (fname, data) in enumerate(images):
        body += (f"--{boundary}\r\nContent-Disposition: form-data; name=\"image[]\"; filename=\"{fname}\"\r\nContent-Type: image/png\r\n\r\n").encode() + data + b"\r\n"
    body += f"--{boundary}--\r\n".encode()
    req = urllib.request.Request("https://api.openai.com/v1/images/edits", data=body, method="POST",
                                 headers={"Authorization": f"Bearer {key()}", "Content-Type": f"multipart/form-data; boundary={boundary}"})
    with urllib.request.urlopen(req, timeout=300) as r:
        return base64.b64decode(json.load(r)["data"][0]["b64_json"])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("id")
    ap.add_argument("--quality", default="high")
    ap.add_argument("--out")
    a = ap.parse_args()
    queue = json.load(open(os.path.join(ROOT, "marketing", "social", "queue.json"), encoding="utf-8"))
    item = next(q for q in queue if q["id"] == a.id)
    from creative import STICKER
    images = [("logo.png", open(LOGO, "rb").read())]
    cut_line = ""
    if item.get("book_idx"):
        cp = os.path.join(CUTOUTS, f"r-l{item['level']}-{item['book_idx']}.png")
        if os.path.exists(cp):
            images.append(("book.png", open(cp, "rb").read()))
            cut_line = "Reference image 2 is a photo of the printed story booklet: place it, unchanged, peeking out behind the sheets on the right."
    pngs = sheet_pngs(item)
    images += [(f"sheet{i+1}.png", p) for i, p in enumerate(pngs)]
    prompt = BRIEF.format(cut_line=cut_line, n=len(pngs), headline=item.get("headline") or item["title"],
                          subline=item.get("subline", ""), sticker=STICKER.get(item["level"], ""))
    png = edit(images, prompt, a.quality)
    out = a.out or os.path.join(ROOT, "marketing", "social", f"ai_{a.id}.png")
    open(out, "wb").write(png)
    print(out)


if __name__ == "__main__":
    main()
