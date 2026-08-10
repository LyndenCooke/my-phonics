"""Vercel Python serverless function: renders a Create-A-Book custom book's
HTML through the REAL book_v2 template (same Jinja2 code path as the local
studio-machine pipeline — see myphonics_books/scripts/generate_custom_book.py)
and uploads the result to Supabase Storage.

Why a separate function, and why it returns a STORAGE URL rather than the
HTML itself: Playwright (the local renderer's PDF step) does not run on
Vercel's Python runtime, so PDF conversion happens in Node instead
(server/forge/pdf.mjs, puppeteer-core + @sparticuz/chromium). This function
only needs to produce the HTML. The rendered HTML embeds every page image as
a base64 data URI (same as the local renderer, for template-fidelity reasons
— see build_custom_book_data's docstring) and can run to several MB, well
past what's safe to pass back through a synchronous function response body.
Uploading it and returning a small URL sidesteps that entirely: the Node
step just fetches the URL and hands the HTML straight to Chromium.

POST body (JSON) — the same spec shape generate_custom_book.py's CLI takes,
except `image_urls` (a {name: https-url} map: cover, page1..pageN, hero,
landmark) replaces `images_dir`, since there is no shared local disk here.
Images are fetched over HTTPS from Supabase Storage — keeps the REQUEST body
tiny too (text + URLs only), matching the same reasoning as the response.
"""
import json
import os
import sys
import tempfile
import urllib.request
from http.server import BaseHTTPRequestHandler
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = REPO_ROOT / "myphonics_books" / "scripts"
sys.path.insert(0, str(SCRIPTS))
sys.path.insert(0, str(SCRIPTS.parent))  # for core.pdf_generator (unused here, but generate_book imports cleanly either way)

# TEMPORARY diagnostics — two prior deploys (includeFiles alone, then
# includeFiles+excludeFiles together) both hit
# "ModuleNotFoundError: No module named 'generate_custom_book'" here, and
# guessing a third fix blind isn't worth another 2-5 minute deploy cycle.
# This prints BEFORE the import that's failing, so even if it fails again we
# get the real directory layout Vercel actually deployed instead of another
# guess. Remove once the import is confirmed working.
print(f"DIAG __file__={__file__}", file=sys.stderr)
print(f"DIAG REPO_ROOT={REPO_ROOT} exists={REPO_ROOT.exists()}", file=sys.stderr)
print(f"DIAG SCRIPTS={SCRIPTS} exists={SCRIPTS.exists()}", file=sys.stderr)
try:
    if REPO_ROOT.exists():
        print(f"DIAG REPO_ROOT contents={sorted(p.name for p in REPO_ROOT.iterdir())}", file=sys.stderr)
    mb = REPO_ROOT / "myphonics_books"
    print(f"DIAG myphonics_books exists={mb.exists()}", file=sys.stderr)
    if mb.exists():
        print(f"DIAG myphonics_books contents={sorted(p.name for p in mb.iterdir())}", file=sys.stderr)
    if SCRIPTS.exists():
        print(f"DIAG SCRIPTS contents={sorted(p.name for p in SCRIPTS.iterdir())}", file=sys.stderr)
except Exception as diag_err:
    print(f"DIAG listing failed: {diag_err}", file=sys.stderr)
print(f"DIAG sys.path={sys.path}", file=sys.stderr)

from generate_custom_book import build_custom_book_data  # noqa: E402
from generate_book import render_book_html  # noqa: E402


def fetch_images(image_urls: dict) -> Path:
    """Download each page/hero/landmark/cover image over HTTPS into a fresh
    temp dir as .jpg — the exact shape build_custom_book_data expects from a
    local images_dir (this is the ONLY thing that differs from the CLI path;
    everything past this point is the identical, unmodified function)."""
    tmp = Path(tempfile.mkdtemp(prefix="custom_book_src_"))
    for name, url in (image_urls or {}).items():
        if not url:
            continue
        try:
            with urllib.request.urlopen(url, timeout=20) as r:
                (tmp / f"{name}.jpg").write_bytes(r.read())
        except Exception as e:
            print(f"WARNING: failed to fetch {name} from {url}: {e}", file=sys.stderr)
    return tmp


def upload_html(book_id: str, html: str) -> str:
    """Same Supabase Storage bucket ('custom-books') and upsert convention as
    server/forge/storage.mjs's saveImage — kept in sync deliberately so a
    book's HTML lives next to its images/PDF at a predictable path."""
    supabase_url = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not supabase_url or not service_key:
        raise RuntimeError("Supabase env vars missing (VITE_SUPABASE_URL / SUPABASE_SERVICE_KEY)")

    body = html.encode("utf-8")
    req = urllib.request.Request(
        f"{supabase_url}/storage/v1/object/custom-books/{book_id}/book.html",
        data=body,
        method="POST",
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "text/html; charset=utf-8",
            "x-upsert": "true",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        if r.status >= 300:
            raise RuntimeError(f"storage upload failed: {r.status}")
    return f"{supabase_url}/storage/v1/object/public/custom-books/{book_id}/book.html"


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            spec = json.loads(self.rfile.read(length).decode("utf-8"))
            book_id = spec["book_id"]

            images_dir = fetch_images(spec.get("image_urls") or {})
            book_data = build_custom_book_data(spec, images_dir)
            html = render_book_html(book_data)
            html_url = upload_html(book_id, html)

            self._send_json(200, {"html_url": html_url})
        except Exception as e:
            print(f"ERROR in render-book-html: {e}", file=sys.stderr)
            self._send_json(500, {"error": str(e)})

    def _send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
