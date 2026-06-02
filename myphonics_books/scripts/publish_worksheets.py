"""
Publish bundled worksheet PDFs to the public `worksheet-pdfs` Supabase bucket.

Mirrors `publish_books.py`. Idempotent — skips any object whose remote
byte size matches the local file. `--force` re-uploads everything.

Output per book (built by build_worksheets.py):
    output/worksheets/L{n}/{level}_{n}_Worksheets.pdf

Uploads to:
    Supabase Storage  worksheet-pdfs/{level}_{n}.pdf

Public URL:
    {SUPABASE_URL}/storage/v1/object/public/worksheet-pdfs/{level}_{n}.pdf

Run:
    py -3.12 scripts/publish_worksheets.py
    py -3.12 scripts/publish_worksheets.py --force
    py -3.12 scripts/publish_worksheets.py --dry-run
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

import requests

BASE = Path(__file__).parent.parent
ROOT = BASE.parent
SRC_DEFAULT = BASE / "output" / "worksheets_v2"  # v2 engine output is now the source of truth
BUCKET = "worksheet-pdfs"


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


PAT = re.compile(r"^(\d+)_(\d+)_Worksheets\.pdf$")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="Re-upload even if size matches")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--src", default=str(SRC_DEFAULT),
                    help="Source directory containing L{n}/{level}_{n}_Worksheets.pdf bundles")
    args = ap.parse_args()
    SRC = Path(args.src)

    env = load_env()
    supabase_url = env.get("VITE_SUPABASE_URL") or env.get("SUPABASE_URL") or "https://jfbgdeyjngvzpfucwpuk.supabase.co"
    service_key = env.get("SUPABASE_SERVICE_KEY")
    if not service_key:
        print("ERROR: SUPABASE_SERVICE_KEY missing from .env", file=sys.stderr)
        sys.exit(1)
    public_base = f"{supabase_url}/storage/v1/object/public/{BUCKET}"

    pdfs: list[Path] = sorted(SRC.rglob("*_Worksheets.pdf"))
    if not pdfs:
        print(f"No worksheet bundles found under {SRC}.", file=sys.stderr)
        sys.exit(1)

    uploaded = skipped = 0
    for pdf in pdfs:
        m = PAT.match(pdf.name)
        if not m:
            print(f"  skip  {pdf.name}  (unexpected name)")
            continue
        level, n = m.group(1), m.group(2)
        remote_name = f"{level}_{n}.pdf"
        local_size = pdf.stat().st_size

        if not args.force:
            rsize = remote_size(f"{public_base}/{remote_name}")
            if rsize == local_size:
                print(f"  L{level}.{n}  up-to-date ({local_size / 1024:.0f} KB)")
                skipped += 1
                continue

        size_kb = local_size / 1024
        if args.dry_run:
            print(f"  L{level}.{n}  would upload {size_kb:.0f} KB -> {remote_name}")
            continue

        upload(supabase_url, service_key, remote_name, pdf)
        print(f"  L{level}.{n}  uploaded {size_kb:.0f} KB -> {remote_name}")
        uploaded += 1

    print(f"\nDone. uploaded={uploaded}  skipped={skipped}")
    print(f"Public base: {public_base}/")


if __name__ == "__main__":
    main()
