"""Upload cover/text PDFs to Bookvault titles via their file-drop chain.

The portal's own upload page (files.bookvault.app) does this in four steps,
and the API exposes every one of them, so 66 files can go up from a script
instead of 300-odd browser clicks:

  1. GET  /v3/FileDropRequest?DropType=TextFile|CoverFile&ISBN=...
         -> https://files.bookvault.app?UploadToken=<JWT>&ISBN=...
  2. GET  that page, scrape the signed S3 POST policy form
  3. POST multipart to the S3 bucket  (expects HTTP 201)
  4. POST /v3/UploadTool?ISBN=...  {"FileName","s3Location"}
         with header  Authorization: PodAuth <UploadToken>

Validation then runs server-side; poll /v3/File?isbn=... or the portal.

Usage:
    py -3.12 -X utf8 scripts/upload_bookvault_files.py            # all books
    py -3.12 -X utf8 scripts/upload_bookvault_files.py 1.1 1.2    # a subset
    py -3.12 -X utf8 scripts/upload_bookvault_files.py --covers-only
    py -3.12 -X utf8 scripts/upload_bookvault_files.py --dry-run
"""
from __future__ import annotations

import json
import mimetypes
import re
import sys
import urllib.parse
import urllib.request
import uuid
from pathlib import Path

BASE = Path(__file__).parent.parent
FILES = BASE / "output" / "bookvault" / "files_barcoded"
IDS = BASE / "output" / "bookvault" / "bookvault_title_ids.json"
API = "https://api.bookvault.app/v3"
# Cloudflare 403s the stock urllib UA — see reference_mpb_bookvault_api.
UA = "MyPhonicsBooks/1.0 (+https://myphonicsbooks.co.uk)"


def api_key() -> str:
    for line in (BASE / ".env").read_text(encoding="utf-8", errors="ignore").splitlines():
        m = re.match(r"\s*BOOKVAULT_API_KEY\s*=\s*(.+)", line)
        if m:
            return m.group(1).strip().strip('"').strip("'")
    raise SystemExit("BOOKVAULT_API_KEY missing from myphonics_books/.env")


def _get(url: str, headers: dict) -> bytes:
    return urllib.request.urlopen(
        urllib.request.Request(url, headers={"User-Agent": UA, **headers}), timeout=90
    ).read()


def _multipart(fields: list[tuple[str, str]], name: str, data: bytes) -> tuple[bytes, str]:
    b = "----bv" + uuid.uuid4().hex
    out = []
    for k, v in fields:
        out.append(f"--{b}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode())
    ct = mimetypes.guess_type(name)[0] or "application/pdf"
    out.append(
        f"--{b}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{name}\"\r\n"
        f"Content-Type: {ct}\r\n\r\n".encode() + data + b"\r\n")
    out.append(f"--{b}--\r\n".encode())
    return b"".join(out), f"multipart/form-data; boundary={b}"


def upload(isbn: str, drop_type: str, path: Path, key: str) -> str:
    """Push one PDF and register it. Returns the S3 key on success."""
    auth = {"Authorization": "basic " + key}
    drop_url = json.loads(_get(f"{API}/FileDropRequest?DropType={drop_type}&ISBN={isbn}", auth))
    token = urllib.parse.parse_qs(urllib.parse.urlparse(drop_url).query).get("UploadToken", [""])[0]
    if not token:
        raise RuntimeError(f"{isbn} {drop_type}: no UploadToken in drop URL")

    page = _get(drop_url, {}).decode("utf-8", "replace")
    form = re.search(r'<form action="([^"]+)"', page).group(1)
    fields = []
    for tag in re.findall(r"<input[^>]*type=[\"']hidden[\"'][^>]*>", page):
        n = re.search(r"name=[\"']([^\"']+)", tag)
        v = re.search(r"value=[\"']([^\"']*)", tag)
        if n:
            fields.append((n.group(1), v.group(1) if v else ""))

    data = path.read_bytes()
    suffix = "t" if drop_type == "TextFile" else "c"
    s3_key = f"{isbn}-{suffix}.pdf"
    # The policy carries starts-with conditions on $key, $Content-Type and
    # $Content-Length, so all three must be POSTed — omitting the two blank
    # ones is what makes S3 answer 403.  key must precede the file part.
    fields = [(k, v) for k, v in fields
              if k not in ("key", "Content-Type", "Content-Length")]
    fields = ([("key", s3_key),
               ("Content-Type", "application/pdf"),
               ("Content-Length", str(len(data)))] + fields)
    body, ctype = _multipart(fields, s3_key, data)

    r = urllib.request.urlopen(
        urllib.request.Request(form, data=body,
                               headers={"User-Agent": UA, "Content-Type": ctype}), timeout=300)
    if r.status not in (200, 201, 204):
        raise RuntimeError(f"{isbn} {drop_type}: S3 returned {r.status}")

    payload = json.dumps({"FileName": s3_key, "s3Location": s3_key}).encode()
    req = urllib.request.Request(
        f"{API}/UploadTool?ISBN={isbn}", data=payload, method="POST",
        headers={"User-Agent": UA, "Content-Type": "application/json; charset=utf-8",
                 "Authorization": "PodAuth " + token})
    urllib.request.urlopen(req, timeout=120).read()
    return s3_key


def revalidate(isbn: str, drop_type: str, key: str) -> None:
    """Ask Bookvault to re-process a file already on the title.

    Mirrors the portal's own ProcessReVal(): same UploadTool endpoint with
    reValidate=true and no new S3 object.  Use it when the files are fine but
    a derived asset (proof render, retail cover thumbnail) did not generate."""
    auth = {"Authorization": "basic " + key}
    drop_url = json.loads(_get(f"{API}/FileDropRequest?DropType={drop_type}&ISBN={isbn}", auth))
    token = urllib.parse.parse_qs(urllib.parse.urlparse(drop_url).query).get("UploadToken", [""])[0]
    suffix = "t" if drop_type == "TextFile" else "c"
    payload = json.dumps({"FileName": f"{isbn}-{suffix}.pdf"}).encode()
    req = urllib.request.Request(
        f"{API}/UploadTool?ISBN={isbn}&reValidate=true", data=payload, method="POST",
        headers={"User-Agent": UA, "Content-Type": "application/json; charset=utf-8",
                 "Authorization": "PodAuth " + token})
    urllib.request.urlopen(req, timeout=120).read()


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    dry = "--dry-run" in sys.argv
    only = ([("CoverFile", "cover.pdf")] if "--covers-only" in sys.argv
            else [("TextFile", "text.pdf")] if "--text-only" in sys.argv
            else [("TextFile", "text.pdf"), ("CoverFile", "cover.pdf")])
    books = json.loads(IDS.read_text(encoding="utf-8"))
    todo = args or sorted(books, key=lambda b: [int(x) for x in b.split(".")])
    key = api_key()

    if "--revalidate" in sys.argv:
        ok = fail = 0
        for bid in todo:
            isbn = books[bid]["isbn"]
            for drop_type, _ in only:
                try:
                    revalidate(isbn, drop_type, key)
                    print(f"OK   {bid:4} {isbn} revalidate {drop_type}")
                    ok += 1
                except Exception as e:
                    print(f"FAIL {bid:4} {isbn} revalidate {drop_type}: {e}")
                    fail += 1
        print(str(ok) + " revalidated, " + str(fail) + " failed")
        return 1 if fail else 0

    ok = fail = 0
    for bid in todo:
        isbn = books[bid]["isbn"]
        for drop_type, fname in only:
            p = FILES / bid / fname
            if not p.exists():
                print(f"FAIL {bid} {drop_type}: {p} missing")
                fail += 1
                continue
            if dry:
                print(f"DRY  {bid} {isbn} {drop_type:9} {p.name} {p.stat().st_size/1e6:.2f}MB")
                continue
            try:
                k = upload(isbn, drop_type, p, key)
                print(f"OK   {bid:4} {isbn} {drop_type:9} -> {k}")
                ok += 1
            except Exception as e:
                print(f"FAIL {bid:4} {isbn} {drop_type:9}: {e}")
                fail += 1
    print(f"\n{ok} uploaded, {fail} failed")
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
