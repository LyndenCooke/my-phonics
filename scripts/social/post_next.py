"""
Post the next unposted item from marketing/social/queue.json to the
MyPhonicsBooks Facebook Page and Instagram: render the creative, upload it as
a Page photo post with the caption, then publish the same image to the
Instagram Business account linked to the Page (with a link-in-bio caption,
since Instagram captions are not clickable). Record it in
marketing/social/posted.json.

Runs daily from .github/workflows/daily-post.yml. Needs two repo secrets:
  FB_PAGE_ID            the numeric Page id
  FB_PAGE_ACCESS_TOKEN  a long-lived Page token with pages_manage_posts,
                        pages_read_engagement, and for Instagram also
                        instagram_basic + instagram_content_publish (the app
                        needs the Instagram use case, and the Instagram
                        account must be a Business/Creator account linked to
                        the Page). Without those, Instagram is skipped with a
                        warning and Facebook still goes out.

Without the secrets it runs as a dry run: prints the caption, writes the
preview to marketing/social/preview.jpg, records nothing.

  py -3.12 scripts/social/post_next.py            # next item
  py -3.12 scripts/social/post_next.py --id 042   # a specific item
  py -3.12 scripts/social/post_next.py --dry-run  # never posts
  py -3.12 scripts/social/post_next.py --check-ig # report the linked IG account
"""
import re
import time
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


def _open_pdf(local_rel, url):
    local = os.path.join(ROOT, local_rel)
    if os.path.exists(local):
        return fitz.open(local)
    with urllib.request.urlopen(url, timeout=60) as r:
        return fitz.open(stream=r.read(), filetype="pdf")


def render_preview(item):
    """One branded card: the photographic book cutout for a book post, or the
    day's worksheets (first page of each) side by side."""
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    if item.get("kind") == "book":
        from creative import render_book_creative
        return render_book_creative(item, PREVIEW)
    sheets = item.get("sheets") or [dict(local=item["preview_pdf"], url=item["pdf_url"])]
    pngs = []
    for s in sheets[:3]:
        doc = _open_pdf(s["local"], s["url"])
        pngs.append(doc[0].get_pixmap(dpi=110).tobytes("png"))
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from creative import render_creative
    return render_creative(item, pngs, PREVIEW)


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


def _get(path, token, **params):
    params["access_token"] = token
    with urllib.request.urlopen(f"{GRAPH}/{path}?{urllib.parse.urlencode(params)}", timeout=60) as r:
        return json.load(r)


def _post(path, token, **params):
    params["access_token"] = token
    req = urllib.request.Request(f"{GRAPH}/{path}", data=urllib.parse.urlencode(params).encode(), method="POST")
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


HASHTAGS = "#phonics #freeprintables #homelearning #earlyreading #eyfs #ks1 #learntoread #teachersofinstagram #homeschooluk #decodablebooks"


def ig_caption(item):
    """Instagram captions are not clickable: drop the URLs, point to the bio."""
    lines = []
    for ln in item["caption"].splitlines():
        if re.search(r"https?://", ln):
            if "Read it first" in ln:
                lines.append(re.sub(r"Read it first:.*$", "Read it first, free in our library.", ln))
            continue  # per-sheet, pack and sign-off links live in the bio instead
        lines.append(ln)
    text = "\n".join(lines).strip()
    if item.get("kind") == "book":
        where, path = "Library, Level " + str(item["level"]), "library"
    else:
        where, path = "Worksheets, Level " + str(item["level"]), "worksheets"
    text += ("\n\nEvery PDF is free. Tap the link in our bio, then " + where + "."
             "\nOr go straight to myphonicsbooks.co.uk/" + path + "\n\n" + HASHTAGS)
    return text[:2190]


def ig_user(page_id, token):
    return (_get(page_id, token, fields="instagram_business_account").get("instagram_business_account") or {}).get("id")


def post_instagram(page_id, token, photo_id, caption):
    """Publish the Facebook photo we just uploaded (via its CDN URL) to the
    Instagram account linked to the Page. Returns the IG media id."""
    ig = ig_user(page_id, token)
    if not ig:
        raise RuntimeError("no Instagram Business account linked to this Page (or token lacks instagram_basic)")
    images = _get(photo_id, token, fields="images")["images"]
    image_url = max(images, key=lambda i: i["width"])["source"]
    container = _post(f"{ig}/media", token, image_url=image_url, caption=caption)["id"]
    for _ in range(30):
        status = _get(container, token, fields="status_code")["status_code"]
        if status == "FINISHED":
            break
        if status in ("ERROR", "EXPIRED"):
            raise RuntimeError(f"Instagram container {container} {status}")
        time.sleep(3)
    return _post(f"{ig}/media_publish", token, creation_id=container)["id"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--id", help="post this queue id instead of the next unposted one")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--check-ig", action="store_true", help="print the Instagram account linked to the Page and exit")
    args = ap.parse_args()

    if args.check_ig:
        page_id, token = os.environ.get("FB_PAGE_ID"), os.environ.get("FB_PAGE_ACCESS_TOKEN")
        ig = ig_user(page_id, token)
        print("instagram_business_account:", ig or "NONE", "" if not ig else _get(ig, token, fields="username,name"))
        return

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

    print(f"[{item['id']}] {item['kind']} · L{item['level']} · {item['title']}\n{item['url']}\n---\n{item['caption']}\n---\nINSTAGRAM:\n{ig_caption(item)}\n---")
    if dry:
        print(f"DRY RUN (no FB_PAGE_ID/FB_PAGE_ACCESS_TOKEN). Preview at {os.path.relpath(jpg, ROOT)}")
        return

    result = post_photo(page_id, token, item["caption"], jpg)
    posted[item["id"]] = {"at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                          "fb": result.get("post_id") or result.get("id"), "title": item["title"]}
    try:
        posted[item["id"]]["ig"] = post_instagram(page_id, token, result["id"], ig_caption(item))
        print(f"instagram -> {posted[item['id']]['ig']}")
    except Exception as e:  # Facebook is out; never lose the record over Instagram
        body = getattr(e, "read", lambda: b"")()
        print(f"WARNING instagram skipped: {e} {body[:400]!r}")
    with open(POSTED, "w", encoding="utf-8") as f:
        json.dump(posted, f, ensure_ascii=False, indent=1)
    print(f"posted -> {posted[item['id']]['fb']}")


if __name__ == "__main__":
    main()
