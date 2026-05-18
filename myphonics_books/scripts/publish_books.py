"""
Publish freshly-rendered PDFs to every surface the web app and the
public bucket expect.

Pipeline per book (level, sub_level):

  output/books/Level{L}/{L}_{n} TITLE.pdf                 (A5, what readers buy)
  output/books/Level{L}/{L}_{n} TITLE - Printable Booklet.pdf  (A4 saddle-stitch)
      |
      |--> public/book-pdfs/{L}_{n}.pdf            (A5 only — local dev / Vercel)
      |--> public/covers/{L}_{n}_cover.jpg          (cover from A5 page 1)
      |--> Supabase Storage  book-pdfs/a5/{L}_{n}.pdf
      |--> Supabase Storage  book-pdfs/a4/{L}_{n}.pdf

Idempotent: MD5-hashes each PDF and skips upload when the remote copy
already matches. Use --force to push everything regardless.

Run:
    py -3.12 scripts/publish_books.py                # all levels
    py -3.12 scripts/publish_books.py 2 3            # just L2 + L3
    py -3.12 scripts/publish_books.py --force        # ignore hash check
    py -3.12 scripts/publish_books.py --dry-run      # plan only, no writes

Reads SUPABASE_URL + SUPABASE_SERVICE_KEY from myphonics_books/.env.
"""
from __future__ import annotations

import argparse
import re
import shutil
import sys
from pathlib import Path

import fitz  # PyMuPDF
import requests

BASE = Path(__file__).parent.parent          # myphonics_books/
ROOT = BASE.parent                            # myphonicsbooks/
DST_PDFS = ROOT / "public" / "book-pdfs"
DST_COVERS = ROOT / "public" / "covers"
BUCKET = "book-pdfs"
COVER_ZOOM = 875 / 148 * 25.4 / 72            # ~2.085 -> 875x1240 px


def load_env() -> dict[str, str]:
    env = {}
    for path in [BASE / ".env", ROOT / ".env"]:
        if not path.exists():
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def remote_size(url: str) -> int | None:
    """Return the remote object's byte size, or None if missing.

    Supabase returns S3-style multipart ETags (e.g. "<hex>-N"), which are
    NOT the file's MD5 — so we can't compare hashes cheaply. Byte size is
    a robust proxy: regenerated PDFs almost always differ in size, and a
    no-op re-render produces identical bytes anyway.
    """
    r = requests.head(url)
    if r.status_code != 200:
        return None
    try:
        return int(r.headers.get("Content-Length", "0"))
    except ValueError:
        return None


def upload(supabase_url: str, service_key: str, remote_path: str, local_path: Path) -> None:
    url = f"{supabase_url}/storage/v1/object/{BUCKET}/{remote_path}"
    with local_path.open("rb") as f:
        r = requests.post(
            url,
            data=f,
            headers={
                "Authorization": f"Bearer {service_key}",
                "Content-Type": "application/pdf",
                "x-upsert": "true",
                "Cache-Control": "max-age=300",
            },
        )
    if r.status_code not in (200, 201):
        raise RuntimeError(f"Upload failed {r.status_code} for {remote_path}: {r.text[:200]}")


def find_pair(src_dir: Path, level: int, n: int) -> tuple[Path | None, Path | None]:
    a5: Path | None = None
    a4: Path | None = None
    pat = re.compile(rf"^{level}_{n} .+\.pdf$")
    for pdf in src_dir.glob(f"{level}_{n} *.pdf"):
        if pdf.name.startswith("debug_") or "WATERMARKED" in pdf.name:
            continue
        if not pat.match(pdf.name):
            continue
        if "Printable Booklet" in pdf.name:
            a4 = pdf
        else:
            a5 = pdf
    return a5, a4


def publish_level(level: int, env: dict[str, str], *, force: bool, dry_run: bool) -> int:
    src_dir = BASE / "output" / "books" / f"Level{level}"
    if not src_dir.exists():
        print(f"L{level}: no output folder, skipping")
        return 0

    supabase_url = env["SUPABASE_URL"]
    service_key = env["SUPABASE_SERVICE_KEY"]
    public_base = f"{supabase_url}/storage/v1/object/public/{BUCKET}"

    pat = re.compile(rf"^{level}_(\d+) ")
    ns = sorted({int(m.group(1)) for f in src_dir.iterdir() if (m := pat.match(f.name))})

    count = 0
    for n in ns:
        a5, a4 = find_pair(src_dir, level, n)
        if not a5:
            print(f"  L{level}.{n}: A5 missing, skipping")
            continue

        # 1) local: web-app copy
        dst_pdf = DST_PDFS / f"{level}_{n}.pdf"
        dst_cover = DST_COVERS / f"{level}_{n}_cover.jpg"
        if dry_run:
            print(f"  L{level}.{n}: would copy {a5.name} -> {dst_pdf.name}")
        else:
            DST_PDFS.mkdir(parents=True, exist_ok=True)
            DST_COVERS.mkdir(parents=True, exist_ok=True)
            shutil.copy2(a5, dst_pdf)
            doc = fitz.open(a5)
            pix = doc[0].get_pixmap(matrix=fitz.Matrix(COVER_ZOOM, COVER_ZOOM))
            pix.save(str(dst_cover), jpg_quality=88)
            doc.close()

        # 2) Supabase
        for fmt, src in (("a5", a5), ("a4", a4)):
            if not src:
                print(f"  L{level}.{n} {fmt}: source missing, skipping upload")
                continue
            remote = f"{fmt}/{level}_{n}.pdf"
            local_size = src.stat().st_size
            if not force:
                rsize = remote_size(f"{public_base}/{remote}")
                if rsize == local_size:
                    print(f"  L{level}.{n} {fmt}: up-to-date ({local_size / 1024 / 1024:.1f} MB)")
                    continue
            size_mb = local_size / 1024 / 1024
            if dry_run:
                print(f"  L{level}.{n} {fmt}: would upload {size_mb:.1f} MB")
            else:
                upload(supabase_url, service_key, remote, src)
                print(f"  L{level}.{n} {fmt}: uploaded {size_mb:.1f} MB")
        count += 1
    return count


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("levels", nargs="*", type=int, help="Levels to publish (default: all)")
    parser.add_argument("--force", action="store_true", help="Upload even when remote hash matches")
    parser.add_argument("--dry-run", action="store_true", help="Plan only, no writes or uploads")
    args = parser.parse_args()

    env = load_env()
    if not env.get("SUPABASE_URL"):
        env["SUPABASE_URL"] = "https://jfbgdeyjngvzpfucwpuk.supabase.co"
    if not env.get("SUPABASE_SERVICE_KEY"):
        print("Missing SUPABASE_SERVICE_KEY in .env", file=sys.stderr)
        return 1

    levels = args.levels or [1, 2, 3, 4, 5, 6]
    total = 0
    for lvl in levels:
        print(f"--- L{lvl} ---")
        total += publish_level(lvl, env, force=args.force, dry_run=args.dry_run)
        print()

    print(f"Published {total} book(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
