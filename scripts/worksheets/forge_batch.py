"""
Run the worksheet forge over marketing/worksheets_plan.json, file the PDFs and
PNG previews under public/worksheets/<folder>/, merge each pack into one PDF,
and write public/worksheets/manifest.json (what the site and the social drip
read).

Idempotent: sheets whose PDF already exists are skipped, so it can be re-run.

  py -3.12 scripts/worksheets/forge_batch.py            # everything
  py -3.12 scripts/worksheets/forge_batch.py --level 4  # one level
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FORGE = os.path.join(ROOT, "worksheet-forge")
PLAN = os.path.join(ROOT, "marketing", "worksheets_plan.json")
WS = os.path.join(ROOT, "public", "worksheets")
MANIFEST = os.path.join(WS, "manifest.json")
TMP = os.path.join(ROOT, ".tmp_forge_batch")


def forge(prompt, seed, dest_pdf, dest_png, log):
    os.makedirs(TMP, exist_ok=True)
    for f in os.listdir(TMP):
        os.remove(os.path.join(TMP, f))
    t0 = time.time()
    try:
        r = subprocess.run(["node", "forge.mjs", prompt, "--no-ai", "--seed", str(seed), "--out", TMP],
                           cwd=FORGE, capture_output=True, text=True, timeout=120)
    except subprocess.TimeoutExpired:
        log.write(f"TIMEOUT {prompt}\n")
        return None
    pdfs = [f for f in os.listdir(TMP) if f.endswith(".pdf")]
    notes = [ln.strip() for ln in (r.stdout + r.stderr).splitlines() if "note:" in ln or "warn" in ln.lower()]
    if r.returncode != 0 or not pdfs:
        log.write(f"FAIL {prompt}\n{r.stdout[-800:]}\n{r.stderr[-800:]}\n")
        return None
    os.makedirs(os.path.dirname(dest_pdf), exist_ok=True)
    shutil.move(os.path.join(TMP, pdfs[0]), dest_pdf)
    png = pdfs[0][:-4] + ".png"
    if os.path.exists(os.path.join(TMP, png)):
        shutil.move(os.path.join(TMP, png), dest_png)
    return dict(seconds=round(time.time() - t0, 1), notes=notes)


def merge(pdfs, out):
    from pypdf import PdfWriter
    w = PdfWriter()
    for p in pdfs:
        w.append(p)
    with open(out, "wb") as f:
        w.write(f)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--level", type=int)
    args = ap.parse_args()
    packs = json.load(open(PLAN, encoding="utf-8"))
    manifest = json.load(open(MANIFEST, encoding="utf-8")) if os.path.exists(MANIFEST) else {"packs": []}
    done = {p["folder"]: p for p in manifest["packs"]}
    log = open(os.path.join(ROOT, "marketing", "worksheets_forge.log"), "a", encoding="utf-8")
    total = sum(len(p["sheets"]) for p in packs if not args.level or p["level"] == args.level)
    n = 0
    for pack in packs:
        if args.level and pack["level"] != args.level:
            continue
        folder = os.path.join(WS, pack["folder"])
        out_sheets = []
        for s in pack["sheets"]:
            n += 1
            pdf = os.path.join(folder, s["stem"] + ".pdf")
            png = os.path.join(folder, s["stem"] + ".png")
            rel = f"/worksheets/{pack['folder']}/{s['stem']}"
            if not os.path.exists(pdf):
                res = forge(s["prompt"], s["seed"], pdf, png, log)
                if res is None:
                    print(f"[{n}/{total}] FAILED {pack['folder']}/{s['stem']}", flush=True)
                    continue
                print(f"[{n}/{total}] {pack['folder']}/{s['stem']}  {res['seconds']}s  {' | '.join(res['notes'])}", flush=True)
            out_sheets.append(dict(stem=s["stem"], title=s["title"], objective=s["objective"], how=s["how"],
                                   intent=s["intent"], grapheme=s["grapheme"], href=rel + ".pdf",
                                   thumb=rel + ".png" if os.path.exists(png) else None))
        if not out_sheets:
            continue
        bundle = os.path.join(folder, "pack.pdf")
        merge([os.path.join(folder, s["stem"] + ".pdf") for s in out_sheets], bundle)
        b = pack["book"]
        done[pack["folder"]] = dict(
            kind=pack["kind"], level=pack["level"], folder=pack["folder"], label=pack["label"],
            book=dict(title=b["title"], slug=b["slug"], file_id=b["file_id"], sub=b.get("sub"), sounds=b["sounds"]),
            bundle=f"/worksheets/{pack['folder']}/pack.pdf", sheets=out_sheets)
        manifest["packs"] = sorted(done.values(), key=lambda p: (p["level"], p["kind"] != "book", p["book"].get("sub") or "zz"))
        json.dump(manifest, open(MANIFEST, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    log.close()
    print(f"manifest: {len(manifest['packs'])} packs, {sum(len(p['sheets']) for p in manifest['packs'])} sheets")


if __name__ == "__main__":
    main()
