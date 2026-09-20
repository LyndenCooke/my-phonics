"""
Post the next unposted item from marketing/social/queue.json to the
MyPhonicsBooks Facebook Page: render a JPG preview of the printable, upload it
as a photo post with the caption, record it in marketing/social/posted.json.

Runs daily from .github/workflows/daily-post.yml. Needs two repo secrets:
  FB_PAGE_ID            the numeric Page id
  FB_PAGE_ACCESS_TOKEN  a long-lived Page token with pages_manage_posts,
                        pages_read_engagement (Meta for Developers -> your app
                        -> Graph API Explorer -> get Page token -> extend it)

Without the secrets it runs as a dry run: prints the caption, writes the
preview to marketing/social/preview.jpg, records nothing.

  py -3.12 scripts/social/post_next.py            # next item
  py -3.12 scripts/social/post_next.py --id 042   # a specific item
  py -3.12 scripts/social/post_next.py --dry-run  # never posts
"""
import argparse
import json
import os
import sys
import urllib.request
import urllib.parse
import uuid
from datetime import datetime, timezone

import fitz  # PyMuPDF

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
QUEUE = os.path.join(ROOT, "marketing", "social", "queue.json")
POSTED = os.path.join(ROOT, "marketing", "social", "posted.json")
PREVIEW = os.path.join(ROOT, "marketing", "social", "preview.jpg")
GRAPH = "https://graph.facebook.com/v21.0"


def load(path, default):
    if not os.path.exists(path):
        return default
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def render_preview(item):
    """First page (or the specific activity page) as a JPG, ~1200px tall."""
    doc = fitz.open(os.path.join(ROOT, item["preview_pdf"]))
    page = doc[item["preview_page"] - 1]
    pix = page.get_pixmap(dpi=150)
    pix.save(PREVIEW)
    return PREVIEW


def post_photo(page_id, token, caption, jpg_path):
    """POST /{page-id}/photos as multipart. Returns the post id."""
    boundary = uuid.uuid4().hex
    body = b""
    for name, value in (("message", caption), ("published", "true")):
        body += (f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n").encode()
    with open(jpg_path, "rb") as f:
        img = f.read()
    body += (f"--{boundary}\r\nContent-Disposition: form-data; name=\"source\"; filename=\"printable.jpg\"\r\n"
             f"Content-Type: image/jpeg\r\n\r\n").encode() + img + b"\r\n"
    body += f"--{boundary}--\r\n".encode()
    req = urllib.request.Request(
        f"{GRAPH}/{page_id}/photos?{urllib.parse.urlencode({'access_token': token})}",
        data=body, method="POST",
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--id", help="post this queue id instead of the next unposted one")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    queue = load(QUEUE, [])
    if not queue:
        sys.exit("queue.json is empty — run scripts/social/build_queue.py first")
    posted = load(POSTED, {})

    if args.id:
        item = next((q for q in queue if q["id"] == args.id), None)
        if not item:
            sys.exit(f"no queue item {args.id}")
    else:
        item = next((q for q in queue if q["id"] not in posted), None)
        if not item:
            # Everything has gone out once. Different people see the page every
            # day, so start the cycle again rather than go quiet.
            print("queue exhausted — resetting posted.json and starting from the top")
            posted = {}
            item = queue[0]

    jpg = render_preview(item)
    page_id, token = os.environ.get("FB_PAGE_ID"), os.environ.get("FB_PAGE_ACCESS_TOKEN")
    dry = args.dry_run or not (page_id and token)

    print(f"[{item['id']}] {item['kind']} · L{item['level']} · {item['title']}\n{item['url']}\n---\n{item['caption']}\n---")
    if dry:
        print(f"DRY RUN (no FB_PAGE_ID/FB_PAGE_ACCESS_TOKEN). Preview at {os.path.relpath(jpg, ROOT)}")
        return

    result = post_photo(page_id, token, item["caption"], jpg)
    posted[item["id"]] = {"at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                          "fb": result.get("post_id") or result.get("id"), "title": item["title"]}
    with open(POSTED, "w", encoding="utf-8") as f:
        json.dump(posted, f, ensure_ascii=False, indent=1)
    print(f"posted -> {posted[item['id']]['fb']}")


if __name__ == "__main__":
    main()
