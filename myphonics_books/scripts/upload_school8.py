"""Upload the 33 new 8-level book PDFs to the book-pdfs bucket under SCHOOL-ONLY
keys (s8_{level}_{n}) so the school domain serves them via signed URLs. The
public site never requests s8_* keys, so production is unaffected."""
import glob, os, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from publish_books import load_env, upload

BASE = Path(__file__).resolve().parent.parent
ORDER = ['1.1','1.2','2.1','2.2','2.3','2.4','2.5','3.1','3.2','3.3','4.1','4.2','4.3','4.4','4.5','4.6',
         '5.1','5.2','5.3','5.4','5.5','6.1','6.2','6.3','6.4','7.1','7.2','7.3','7.4','8.1','8.2','8.3','8.4']

env = load_env()
url = env.get("SUPABASE_URL") or "https://jfbgdeyjngvzpfucwpuk.supabase.co"
key = env["SUPABASE_SERVICE_KEY"]

def find(level, fid, booklet):
    pats = glob.glob(str(BASE / f"output/books/Level{level}/{fid} *.pdf"))
    for p in pats:
        b = os.path.basename(p)
        if "WATERMARK" in b: continue
        if booklet and "Printable Booklet" in b: return p
        if not booklet and "Printable Booklet" not in b: return p
    return None

n = 0
for id in ORDER:
    level, fid = id.split('.')[0], id.replace('.', '_')
    a5 = find(level, fid, booklet=False)       # sequential reading PDF -> a5/
    a4 = find(level, fid, booklet=True)         # imposed booklet      -> a4/
    skey = f"s8_{fid}"
    for fmt, src in (("a5", a5), ("a4", a4)):
        if not src:
            print(f"  L{id} {fmt}: MISSING source"); continue
        size = os.path.getsize(src) / 1e6
        upload(url, key, f"{fmt}/{skey}.pdf", Path(src))
        print(f"  L{id} {fmt}: uploaded {size:.1f}MB -> {fmt}/{skey}.pdf")
    n += 1
print(f"Done. {n} books uploaded under s8_ keys.")
