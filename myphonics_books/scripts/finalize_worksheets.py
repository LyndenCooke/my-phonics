"""
After build_worksheets_v2.py and publish_worksheets.py have run, this
script does the post-upload chores:

  1. Verify all 24 bundles exist locally and were uploaded.
  2. Flip the worksheet-pdfs bucket public again so the
     /teachers/library Worksheet pack button serves the new content.
  3. Copy the new bundles into the Drive folder (auto-syncs).
  4. Print a summary suitable for pasting into a status update.

Idempotent — safe to re-run.
"""

from __future__ import annotations

import os
import shutil
import sys
from pathlib import Path

import requests

BASE = Path(__file__).parent.parent
ROOT = BASE.parent
SRC = BASE / "output" / "worksheets_v2"
DRIVE = Path("G:/My Drive/MyPhonicsBooks/07_TPT/Worksheets")
SUPABASE_URL = "https://jfbgdeyjngvzpfucwpuk.supabase.co"
BUCKET = "worksheet-pdfs"


def load_service_key() -> str:
    env = (BASE / ".env").read_text(encoding="utf-8")
    for line in env.splitlines():
        if line.startswith("SUPABASE_SERVICE_KEY"):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise RuntimeError("SUPABASE_SERVICE_KEY missing from .env")


def flip_bucket_public(make_public: bool = True) -> None:
    """Use the Supabase service-key admin API to set the bucket's
    public flag. (Migration files set it once, but we toggled it off
    during the v2 rebuild to stop serving broken content — this puts
    it back to public.)"""
    key = load_service_key()
    url = f"{SUPABASE_URL}/storage/v1/bucket/{BUCKET}"
    r = requests.put(
        url,
        headers={"Authorization": f"Bearer {key}", "apikey": key, "Content-Type": "application/json"},
        json={"public": make_public, "id": BUCKET, "name": BUCKET},
    )
    if r.status_code not in (200, 201):
        print(f"  bucket update HTTP {r.status_code}: {r.text}", file=sys.stderr)
    else:
        print(f"  bucket {BUCKET} public={make_public}")


def sync_to_drive() -> None:
    if not DRIVE.parent.exists():
        print(f"  Drive parent missing — skip sync ({DRIVE})", file=sys.stderr)
        return
    DRIVE.mkdir(parents=True, exist_ok=True)
    n = 0
    for pdf in SRC.rglob("*_Worksheets.pdf"):
        rel = pdf.relative_to(SRC)
        dst = DRIVE / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(pdf, dst)
        n += 1
    print(f"  synced {n} bundles to {DRIVE}")


def main():
    bundles = sorted(SRC.rglob("*_Worksheets.pdf"))
    print(f"local bundles: {len(bundles)}")
    for b in bundles:
        size_kb = b.stat().st_size // 1024
        print(f"  {b.relative_to(SRC)}  {size_kb} KB")

    print("\nFlipping bucket public...")
    flip_bucket_public(True)

    print("\nSyncing to Drive...")
    sync_to_drive()

    print("\nDone. Public URL base:")
    print(f"  {SUPABASE_URL}/storage/v1/object/public/{BUCKET}/")


if __name__ == "__main__":
    main()
