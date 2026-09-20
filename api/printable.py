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

from pypdf import PdfReader, PdfWriter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOOK_DIR = os.path.join(ROOT, "public", "book-pdfs")
BOOK_ID = re.compile(r"^[1-6]_\d{1,2}$")


def extract_page(book_id: str, page_no: int) -> bytes:
    """Return the bytes of a one-page PDF holding page `page_no` (1-based)."""
    reader = PdfReader(os.path.join(BOOK_DIR, f"{book_id}.pdf"))
    if not 1 <= page_no <= len(reader.pages):
        raise IndexError(page_no)
    writer = PdfWriter()
    writer.add_page(reader.pages[page_no - 1])
    writer.add_metadata({"/Title": f"MyPhonicsBooks printable {book_id} p{page_no}", "/Producer": "myphonicsbooks.co.uk"})
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


class handler(BaseHTTPRequestHandler):  # noqa: N801 (Vercel expects this name)
    def do_GET(self):  # noqa: N802
        q = parse_qs(urlparse(self.path).query)
        book = (q.get("book") or [""])[0]
        page = (q.get("page") or [""])[0]
        if not BOOK_ID.match(book) or not page.isdigit() or not os.path.exists(os.path.join(BOOK_DIR, f"{book}.pdf")):
            return self._send(404, b"not found", "text/plain")
        try:
            pdf = extract_page(book, int(page))
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
