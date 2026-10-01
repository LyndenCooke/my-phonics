"""
/api/printable?book=2_2&page=12  ->  that ONE page of the published book PDF,
served as its own downloadable PDF. Pretty form (vercel.json rewrite):
/p/2_2/12

Why: every book already carries 8-10 standalone activity pages (Our Sounds,
Sound Spotlight, Trace & Form, Alien Words, Talk About It, Word Workshop...).
The daily Facebook drip (scripts/social/) links to them individually. Extracting
on request means zero extra files in the repo and the link can never drift from
the published book.
"""
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import io
import os
import re

import urllib.request

from pypdf import PdfReader, PdfWriter

# The published books live in Supabase Storage (public bucket "book-pdfs",
# a5/<id>.pdf) — NOT in the Vercel deployment: .vercelignore excludes *.pdf.
BOOK_URL = "https://jfbgdeyjngvzpfucwpuk.supabase.co/storage/v1/object/public/book-pdfs/a5/{id}.pdf"
BOOK_ID = re.compile(r"^(s8_)?[1-8]_\d{1,2}$")


def fetch_book(book_id: str) -> bytes | None:
    try:
        with urllib.request.urlopen(BOOK_URL.format(id=book_id), timeout=25) as r:
            return r.read()
    except Exception:
        return None


SPEC = re.compile(r"^\d{1,2}(-\d{1,2})?(,\d{1,2}(-\d{1,2})?)*$")


def select_pages(reader: PdfReader, spec: str) -> list[int]:
    """`12` -> [12]; `12-15` -> [12..15]; `2,3,12-19` -> that list (1-based, in order)."""
    n = len(reader.pages)
    if not SPEC.match(spec):
        raise IndexError(spec)
    pages = []
    for part in spec.split(","):
        a, _, b = part.partition("-")
        lo, hi = int(a), int(b or a)
        if not 1 <= lo <= hi <= n:
            raise IndexError(part)
        pages.extend(range(lo, hi + 1))
    if len(pages) > 24:
        raise IndexError("too many pages")
    return pages


def extract_page(book_id: str, page_spec, pdf_bytes: bytes | None = None) -> bytes:
    """Return a PDF holding the requested page(s): an int, "12", "12-15" or "pack"."""
    pdf_bytes = pdf_bytes if pdf_bytes is not None else fetch_book(book_id)
    if pdf_bytes is None:
        raise FileNotFoundError(book_id)
    reader = PdfReader(io.BytesIO(pdf_bytes))
    pages = select_pages(reader, str(page_spec))
    writer = PdfWriter()
    for p in pages:
        writer.add_page(reader.pages[p - 1])
    writer.add_metadata({"/Title": f"MyPhonicsBooks printable {book_id} p{page_spec}", "/Producer": "myphonicsbooks.co.uk"})
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


class handler(BaseHTTPRequestHandler):  # noqa: N801 (Vercel expects this name)
    def do_GET(self):  # noqa: N802
        q = parse_qs(urlparse(self.path).query)
        book = (q.get("book") or [""])[0]
        page = (q.get("page") or [""])[0]
        if not BOOK_ID.match(book) or not SPEC.match(page):
            return self._send(404, b"not found", "text/plain")
        try:
            pdf = extract_page(book, page)
        except FileNotFoundError:
            return self._send(404, b"no such book", "text/plain")
        except IndexError:
            return self._send(404, b"no such page", "text/plain")
        self._send(200, pdf, "application/pdf", {
            "Content-Disposition": f'inline; filename="myphonicsbooks-{book}-p{page}.pdf"',
            "Cache-Control": "public, max-age=86400, s-maxage=2592000",
        })

    def _send(self, status, body, ctype, extra=None):
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)
