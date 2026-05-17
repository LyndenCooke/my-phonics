"""
Publish regenerated PDFs to production: Vercel `public/` AND Supabase Storage.

  output/books/Level{L}/{L}_{n} {title}.pdf
       -> public/book-pdfs/{L}_{n}.pdf                 (Vercel static, legacy links)
       -> Supabase book-pdfs/a5/{L}_{n}.pdf            (what /library Download serves)
       -> public/covers/{L}_{n}_cover.jpg              (cover thumb, page 1 ~150 DPI)

  output/books/Level{L}/{L}_{n} {title} - Printable Booklet.pdf
       -> Supabase book-pdfs/a4/{L}_{n}.pdf            (2-up A4 saddle-stitch download)

Existing covers are 875x1240 px (= 148x210mm at ~150 DPI), so we render at
matrix ~2.085 to match.

Why the Supabase upload matters: the /library Download button hits the
`generate-pdf-download` edge function, which serves directly from the
Supabase `book-pdfs` bucket — NOT from `public/book-pdfs/`. Skipping the
upload means parents download whatever was last hand-uploaded to the
bucket, which is exactly the drift bug we hit in May 2026.

Usage:
    py -3.12 scripts/publish_l1_to_webapp.py            # all levels, full sync
    py -3.12 scripts/publish_l1_to_webapp.py 1 3        # only the listed levels
    py -3.12 scripts/publish_l1_to_webapp.py --no-upload    # skip Supabase (Vercel-only)
"""
import os
import re
import shutil
import sys
from pathlib import Path

import fitz  # PyMuPDF
from dotenv import load_dotenv

BASE = Path(__file__).parent.parent          # myphonics_books/
ROOT = BASE.parent                            # myphonicsbooks/
DST_PDFS = ROOT / "public" / "book-pdfs"
DST_COVERS = ROOT / "public" / "covers"

BUCKET = "book-pdfs"
# Prod project ref — used as a default when SUPABASE_URL is missing or
# blank in `.env`. Override by setting SUPABASE_URL explicitly if you need
# to push to a non-prod project.
PROD_SUPABASE_URL = "https://jfbgdeyjngvzpfucwpuk.supabase.co"
COVER_ZOOM = 875 / 148 * 25.4 / 72            # ~2.085 -> 875x1240 px output

DST_PDFS.mkdir(parents=True, exist_ok=True)
DST_COVERS.mkdir(parents=True, exist_ok=True)


def get_supabase():
    """Init the storage client from `.env`. Returns None when creds are
    missing so a fresh checkout still gets the Vercel copy + cover pipeline
    without exploding.

    Falls back to a forgiving manual parse of `.env` if python-dotenv's
    strict parser bails on a malformed line (e.g. a key with spaces) before
    reaching the Supabase entries further down."""
    env_path = BASE / ".env"
    load_dotenv(env_path)
    url = os.environ.get("SUPABASE_URL")
    key = (
        os.environ.get("SUPABASE_SERVICE_KEY")
        or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    )

    if not (url and key) and env_path.exists():
        for raw in env_path.read_text(encoding="utf-8", errors="replace").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            k = k.strip()
            if not k or " " in k:  # skip malformed keys
                continue
            v = v.strip().strip('"').strip("'")
            os.environ.setdefault(k, v)
        url = os.environ.get("SUPABASE_URL")
        key = (
            os.environ.get("SUPABASE_SERVICE_KEY")
            or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        )

    if not url:
        url = PROD_SUPABASE_URL
        print(f"i  SUPABASE_URL blank in .env -- defaulting to prod ({url})")

    if not key:
        print("!  SUPABASE_SERVICE_KEY missing in .env -- bucket upload skipped")
        return None

    from supabase import create_client
    return create_client(url, key)


def upload_pdf(sb, local_path: Path, dest_key: str) -> None:
    """Upsert a local PDF into the bucket. upsert=true keeps re-runs idempotent
    without us tracking which files have already been uploaded."""
    with open(local_path, "rb") as fh:
        data = fh.read()
    sb.storage.from_(BUCKET).upload(
        path=dest_key,
        file=data,
        file_options={
            "content-type": "application/pdf",
            "upsert": "true",
            "cache-control": "no-cache",
        },
    )


def publish_level(level: int, sb) -> list[int]:
    src_dir = BASE / "output" / "books" / f"Level{level}"
    if not src_dir.exists():
        print(f"Level{level}: no output folder, skipping")
        return []

    # Index booklets by their (level, n) so we can pair them with the A5 file.
    booklets: dict[int, Path] = {}
    booklet_pat = re.compile(rf"^{level}_(\d+) .+ - Printable Booklet\.pdf$")
    for bk in sorted(src_dir.glob(f"{level}_*.pdf")):
        m = booklet_pat.match(bk.name)
        if m:
            booklets[int(m.group(1))] = bk

    a5_pat = re.compile(rf"^{level}_(\d+) .+\.pdf$")
    published: list[int] = []

    for pdf in sorted(src_dir.glob(f"{level}_*.pdf")):
        if "WATERMARKED" in pdf.name or pdf.name.startswith("debug_"):
            continue
        if "Printable Booklet" in pdf.name:
            continue  # handled via the booklets map below
        m = a5_pat.match(pdf.name)
        if not m:
            continue
        n = int(m.group(1))

        # 1. Vercel static copy — kept so anyone linking /book-pdfs/X_Y.pdf
        #    directly (older emails, marketing materials) still resolves.
        dst_pdf = DST_PDFS / f"{level}_{n}.pdf"
        dst_cover = DST_COVERS / f"{level}_{n}_cover.jpg"
        shutil.copy2(pdf, dst_pdf)

        # 2. Cover thumb (also Vercel-served, used by BookCard).
        doc = fitz.open(pdf)
        pix = doc[0].get_pixmap(matrix=fitz.Matrix(COVER_ZOOM, COVER_ZOOM))
        pix.save(str(dst_cover), jpg_quality=88)
        doc.close()

        pdf_mb = dst_pdf.stat().st_size / 1024 / 1024
        cover_kb = dst_cover.stat().st_size / 1024
        line = (
            f"  L{level}.{n:<2} -> {dst_pdf.name} ({pdf_mb:.1f} MB)"
            f"  +  {dst_cover.name} ({cover_kb:.0f} KB, {pix.width}x{pix.height})"
        )

        # 3. Supabase Storage — what the in-app Download button actually serves.
        if sb is not None:
            upload_pdf(sb, pdf, f"a5/{level}_{n}.pdf")
            booklet = booklets.get(n)
            if booklet is not None:
                upload_pdf(sb, booklet, f"a4/{level}_{n}.pdf")
                line += "  [bucket: a5 + a4]"
            else:
                line += "  [bucket: a5 only -- no booklet]"

        print(line)
        published.append(n)

    return published


if __name__ == "__main__":
    no_upload = "--no-upload" in sys.argv
    positional = [a for a in sys.argv[1:] if not a.startswith("--")]

    if positional:
        levels = [int(a) for a in positional]
    else:
        levels = [1, 2, 3, 4, 5, 6]

    sb = None if no_upload else get_supabase()

    grand_total = 0
    for lvl in levels:
        print(f"--- Level {lvl} ---")
        pub = publish_level(lvl, sb)
        grand_total += len(pub)
        print()

    print(f"Published {grand_total} books total.")
    if sb is not None:
        print(f"Synced to Supabase bucket: {BUCKET}")
