"""
Drop forged sheets the forge flagged as "very few <sound> words" (they pad
with off-sound words, which defeats the sheet's purpose), re-merge each pack
PDF, and rewrite public/worksheets/manifest.json.

Reads marketing/worksheets_batch.out (the batch log) for the flags.

  py -3.12 scripts/worksheets/prune_sparse.py
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WS = os.path.join(ROOT, "public", "worksheets")
MANIFEST = os.path.join(WS, "manifest.json")
LOG = os.path.join(ROOT, "marketing", "worksheets_batch.out")


def merge(pdfs, out):
    from pypdf import PdfWriter
    w = PdfWriter()
    for p in pdfs:
        w.append(p)
    with open(out, "wb") as f:
        w.write(f)


def main():
    sparse = set()
    for ln in open(LOG, encoding="utf-8", errors="replace"):
        m = re.match(r"\[\d+/\d+\] (\S+)\s+[\d.]+s\s+.*very few", ln)
        if m:
            sparse.add(m.group(1))  # "L2/1_7_the_jam_jug/02_handwriting_v"
    m = json.load(open(MANIFEST, encoding="utf-8"))
    dropped, kept_packs = [], []
    for p in m["packs"]:
        keep = []
        for s in p["sheets"]:
            key = f"{p['folder']}/{s['stem']}"
            if key in sparse:
                dropped.append(key)
                for ext in (".pdf", ".png"):
                    f = os.path.join(WS, p["folder"], s["stem"] + ext)
                    if os.path.exists(f):
                        os.remove(f)
            else:
                keep.append(s)
        if not keep:
            bundle = os.path.join(WS, p["folder"], "pack.pdf")
            if os.path.exists(bundle):
                os.remove(bundle)
            continue
        if len(keep) != len(p["sheets"]):
            merge([os.path.join(WS, p["folder"], s["stem"] + ".pdf") for s in keep], os.path.join(WS, p["folder"], "pack.pdf"))
        p["sheets"] = keep
        kept_packs.append(p)
    m["packs"] = kept_packs
    json.dump(m, open(MANIFEST, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"dropped {len(dropped)} sparse sheets: {', '.join(dropped)}")
    print(f"manifest: {len(kept_packs)} packs, {sum(len(p['sheets']) for p in kept_packs)} sheets")


if __name__ == "__main__":
    main()
