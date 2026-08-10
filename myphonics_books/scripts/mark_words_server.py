"""Local sound-mark review tool.

Serves every sound-buttoned word in the 33 books on http://localhost:8765 so
the marks can be reviewed and shifty diamonds added by clicking a letter.

WHY THIS EXISTS AS A SERVER AND NOT A SPREADSHEET: a sound mark is a visual
object.  Judging whether "fabulous" should carry a diamond on its u means
seeing the dots and arcs under the letters exactly as the child will, which a
column of text cannot show.  The words come from
generate_book.build_book_data_from_story() — the SAME call the print pipeline
makes — so what you see here is what prints, not an approximation.

It never edits the story dicts.  Saving writes a review file:

    output/worksheet_plan/shifty_marks_review.json

keyed by book id, in exactly the shape a story dict's `shifty_marks` takes, so
approved marks can be pasted (or applied) afterwards.  Deliberate: the story
dicts carry hand-written pedagogy rulings in their comments, and a tool that
rewrote them automatically would strip that reasoning out.

Run:
    py -3.12 -X utf8 scripts/mark_words_server.py            # cached build
    py -3.12 -X utf8 scripts/mark_words_server.py --refresh  # rebuild cache
    py -3.12 -X utf8 scripts/mark_words_server.py --port 9000
"""

from __future__ import annotations

import json
import sys
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE / "scripts"))

CACHE = BASE / "output" / "worksheet_plan" / "_mark_words_cache.json"
REVIEW = BASE / "output" / "worksheet_plan" / "shifty_marks_review.json"

# Level colours, so each book reads at a glance as the level it belongs to.
LEVEL_COLOURS = {
    1: "#E84B8A", 2: "#F97066", 3: "#F59E0B", 4: "#22C55E",
    5: "#3B82F6", 6: "#6366F1", 7: "#8B5CF6", 8: "#14B8A6",
}


def build_books(refresh: bool = False) -> list[dict]:
    """Every book's buttoned words, via the real print-pipeline call."""
    if CACHE.exists() and not refresh:
        return json.loads(CACHE.read_text(encoding="utf-8"))

    from generate_book import build_book_data_from_story
    from generate_pilot_books import (get_pilot_stories, LEVEL_KEYS,
                                      NEW_TO_OLD, CHILD_NAME, FRIEND_NAME)
    stories = get_pilot_stories()
    books = []
    ids = sorted(NEW_TO_OLD, key=lambda k: [int(p) for p in k.split(".")])
    for i, bid in enumerate(ids, 1):
        story = stories.get(LEVEL_KEYS.get(NEW_TO_OLD[bid]))
        if not story:
            continue
        print(f"  [{i}/{len(ids)}] {bid} {story.get('book_title')}")
        # MUST match generate_pilot_pdf: the story dicts still carry their
        # ORIGINAL (pre-8-level) level, and the pipeline overrides it to the
        # new public level before building.  Skipping this builds every book
        # against the wrong cumulative grapheme set — "chop" came out as
        # c-h-o-p instead of ch-o-p, which would have sent a reviewer hunting
        # for a bug in books that print perfectly well.
        story["level"] = int(bid.split(".")[0])
        data = build_book_data_from_story(
            story, CHILD_NAME, FRIEND_NAME, None,
            edition="library", book_id=bid)
        books.append({
            "id": bid,
            "level": int(bid.split(".")[0]),
            "title": story.get("book_title"),
            "colour": LEVEL_COLOURS.get(int(bid.split(".")[0]), "#E84B8A"),
            "existing": story.get("shifty_marks") or {},
            "words": data.get("sound_buttoned_words") or [],
        })
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    CACHE.write_text(json.dumps(books, ensure_ascii=False), encoding="utf-8")
    return books


PAGE = r"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sound marks review — MyPhonicsBooks</title>
<style>
  :root{
    --bg:hsl(15 60% 98%); --ink:hsl(0 0% 10%); --muted:hsl(0 0% 40%);
    --primary:hsl(338 78% 57%); --card:#fff; --line:#ececf2;
    --diamond:#475569; --sel:hsl(338 78% 90%);
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);padding-bottom:96px;
       font:15px/1.5 "Segoe UI",system-ui,-apple-system,sans-serif}
  header{position:sticky;top:0;z-index:9;background:rgba(255,255,255,.94);
         backdrop-filter:blur(8px);border-bottom:1px solid var(--line);
         padding:14px 22px;display:flex;gap:16px;align-items:center;flex-wrap:wrap}
  h1{font-size:17px;margin:0;font-weight:800;letter-spacing:-.01em}
  .sub{color:var(--muted);font-size:13px}
  .grow{flex:1}
  button{font:inherit;font-weight:700;border-radius:999px;cursor:pointer;border:0}
  .save{background:var(--primary);color:#fff;padding:9px 20px}
  .save:disabled{opacity:.45;cursor:default}
  .ghost{background:#fff;border:1px solid var(--line);padding:8px 16px}
  main{padding:22px;max-width:1180px;margin:0 auto}
  .book{margin-bottom:30px}
  .bh{display:flex;align-items:center;gap:10px;margin:0 0 12px}
  .pill{color:#fff;font-weight:800;font-size:12px;padding:3px 10px;border-radius:6px}
  .bt{font-weight:800}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:12px}
  .w{background:var(--card);border:1px solid var(--line);border-radius:12px;
     padding:12px 8px 8px;text-align:center;overflow:hidden}
  .w.active{border-color:var(--primary);box-shadow:0 0 0 3px hsl(338 78% 94%)}
  .w.chg{border-color:var(--diamond)}

  /* LETTERS ON A GRID.  One column per letter, three rows: over-arc / letters
     / under-marks.  Marks are placed by grid-column span, so a mark can cover
     letters WITHOUT moving them — which is the whole point for split digraphs
     like o_e in "stone", where the arc spans o to e straight over the n and
     the n keeps its own dot.  The earlier version grouped each mark's letters
     together in the DOM, which physically reordered the word to "stoen". */
  .wg{display:inline-grid;grid-auto-rows:min-content;justify-items:center;
      align-items:end;column-gap:3px}
  .Lc{grid-row:2;cursor:pointer;border-radius:4px;padding:0 3px;line-height:1.2;
      user-select:none;letter-spacing:.5px}
  .Lc:hover{background:hsl(338 78% 94%)}
  .Lc.sel{background:var(--sel);box-shadow:0 0 0 2px var(--primary)}
  .ov{grid-row:1;align-self:end;height:8px;width:100%;
      border-top:2px solid #111;border-left:2px solid #111;border-right:2px solid #111;
      border-radius:6px 6px 0 0}
  .un{grid-row:3;height:11px;width:100%;position:relative}
  .un.bar::after{content:"";position:absolute;left:2px;right:2px;top:3px;
                 height:2px;background:#111;border-radius:2px}
  .un.dot::after{content:"";position:absolute;left:50%;top:3px;width:4px;height:4px;
                 margin-left:-2px;border-radius:50%;background:#111}
  .un.dia::after{content:"";position:absolute;left:50%;top:2px;width:7px;height:7px;
                 margin-left:-3.5px;background:var(--diamond);transform:rotate(45deg)}
  /* A diamond that covers more than one letter (the "ge" in gorgeous) sits
     centred over the whole span with no bar — PHONICS_PEDAGOGY §5. */
  .wt{margin-top:5px;font-size:11px;color:var(--muted);word-break:break-all}
  .says{font-size:10px;color:var(--diamond);font-weight:700}

  /* Mark bar — fixed, appears once letters are selected. */
  .bar-wrap{position:fixed;left:0;right:0;bottom:0;z-index:20;
            background:rgba(255,255,255,.97);border-top:1px solid var(--line);
            box-shadow:0 -6px 24px #0000000d;padding:12px 22px;
            display:none;gap:10px;align-items:center;flex-wrap:wrap}
  .bar-wrap.on{display:flex}
  .mk{border:1px solid var(--line);background:#fff;padding:9px 16px;border-radius:10px;
      display:inline-flex;align-items:center;gap:8px;font-size:14px}
  .mk:hover:not(:disabled){border-color:var(--primary)}
  .mk:disabled{opacity:.35;cursor:default}
  .gl{width:34px;height:14px;position:relative;display:inline-block}
  .gl.d::after{content:"";position:absolute;left:50%;top:5px;width:5px;height:5px;
               margin-left:-2.5px;border-radius:50%;background:#111}
  .gl.l::after{content:"";position:absolute;left:2px;right:2px;top:6px;height:2px;
               background:#111;border-radius:2px}
  .gl.s::after{content:"";position:absolute;left:50%;top:4px;width:8px;height:8px;
               margin-left:-4px;background:var(--diamond);transform:rotate(45deg)}
  .gl.o::after{content:"";position:absolute;left:2px;right:2px;top:2px;height:7px;
               border-top:2px solid #111;border-left:2px solid #111;
               border-right:2px solid #111;border-radius:6px 6px 0 0}
  dialog{border:0;border-radius:14px;padding:0;box-shadow:0 20px 60px #0003}
  dialog::backdrop{background:#0006}
  /* max-width matters: without it the sound chips laid out on ONE line and
     grew the dialog past the viewport, pushing Set off the right edge. */
  .dlg{padding:20px;min-width:300px;max-width:min(92vw,470px)}
  .dlg h3{margin:0 0 4px;font-size:15px}
  .dlg p{margin:0 0 14px;color:var(--muted);font-size:13px}
  .opts{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:14px}
  .opt{border:1px solid var(--line);background:#fff;padding:6px 12px;border-radius:999px;font-size:13px}
  .opt:hover{border-color:var(--primary)}
  input[type=text]{width:100%;padding:9px 11px;border:1px solid var(--line);
                   border-radius:9px;font:inherit;margin-bottom:12px}
  .row{display:flex;gap:8px;justify-content:flex-end}
  pre{background:#fff;border:1px solid var(--line);border-radius:10px;padding:14px;
      overflow:auto;font-size:12px;max-height:44vh}
</style></head><body>
<header>
  <div><h1>Sound marks review</h1><div class="sub" id="count"></div></div>
  <div class="grow"></div>
  <span class="sub" id="status" style="font-weight:700;color:var(--primary)"></span>
  <button class="ghost" onclick="showJson()">View JSON</button>
  <button class="save" id="saveBtn" disabled onclick="save()">Save marks</button>
</header>
<main id="root"></main>

<div class="bar-wrap" id="bar">
  <div><b id="barW"></b> <span class="sub" id="barSel"></span></div>
  <div class="grow"></div>
  <button class="mk" id="mDot"  onclick="apply('dot')"><i class="gl d"></i>Dot</button>
  <button class="mk" id="mBar"  onclick="apply('under_arc')"><i class="gl l"></i>Digraph line</button>
  <button class="mk" id="mOver" onclick="apply('over_arc')"><i class="gl o"></i>Split digraph</button>
  <button class="mk" id="mDia"  onclick="apply('diamond')"><i class="gl s"></i>Shifty</button>
  <button class="mk" onclick="resetWord()">Reset word</button>
  <button class="mk" onclick="clearSel()">Cancel</button>
</div>

<dialog id="dlg"><div class="dlg">
  <h3 id="dlgT"></h3>
  <p>What sound do these letters actually make?</p>
  <div class="opts" id="opts"></div>
  <input type="text" id="custom" placeholder="or type a sound, e.g. /yoo/">
  <div class="row">
    <button class="ghost" onclick="dlg.close()">Cancel</button>
    <button class="save" onclick="commit()">Set</button>
  </div>
</div></dialog>

<dialog id="jd"><div class="dlg" style="min-width:600px">
  <h3>Reviewed marks</h3>
  <p>Only words you changed. Diamonds map to <code>shifty_marks</code>; changed
     units map to <code>extra_button_units</code> or a split exception.</p>
  <pre id="jsonOut"></pre>
  <div class="row"><button class="ghost" onclick="jd.close()">Close</button></div>
</div></dialog>

<script>
const BOOKS = __DATA__;
const SOUNDS = ["/ai/","/ee/","/igh/","/oa/","/oo/","/yoo/","/or/","/ur/","/ow/",
                "/j/","/s/","/z/","/k/","/sh/","/h/","/u/","/o/","/w/","schwa /uh/"];
const edits = {};                 // bookId -> word -> marks[]
let sel = null;                   // {b, word, idx:Set}

const key = (b,w)=>b+"|"+w;
function marksFor(b,w){
  const e = (edits[b.id]||{})[w.word];
  return e ? e : w.marks;
}
function isEdited(b,w){ return !!(edits[b.id]||{})[w.word]; }

function render(){
  let n=0;
  document.getElementById('root').innerHTML = BOOKS.map(b=>{
    const cards = b.words.map(w=>{
      n++;
      const marks = marksFor(b,w);
      const L = w.word.length;
      const fs = Math.max(12, Math.min(23, 235 / L));
      const active = sel && sel.b===b.id && sel.word===w.word;

      // letters, always in word order, one grid column each
      let cells = [...w.word].map((ch,i)=>{
        const on = active && sel.idx.has(i);
        return `<span class="Lc${on?' sel':''}" style="grid-column:${i+1}"
                 onclick="tap(event,'${b.id}','${w.word}',${i})">${ch}</span>`;
      });
      // marks, placed across the columns they span
      marks.forEach(m=>{
        const a = Math.min(...m.indices)+1, z = Math.max(...m.indices)+2;
        if (m.type==='over_arc')
          cells.push(`<span class="ov" style="grid-column:${a}/${z}"></span>`);
        else if (m.type==='under_arc')
          cells.push(`<span class="un bar" style="grid-column:${a}/${z}"></span>`);
        else if (m.type==='diamond')
          cells.push(`<span class="un dia" style="grid-column:${a}/${z}"></span>`);
        else
          cells.push(`<span class="un dot" style="grid-column:${a}/${z}"></span>`);
      });
      const says = marks.filter(m=>m.says)
        .map(m=>`${m.indices.map(i=>w.word[i]).join('')} = ${m.says}`).join(' · ');
      return `<div class="w ${active?'active':''} ${isEdited(b,w)?'chg':''}">
        <div class="wg" style="font-size:${fs.toFixed(1)}px;
             grid-template-columns:repeat(${L},auto)">${cells.join('')}</div>
        <div class="wt">${unitsOf(w.word,marks).join(' · ')}</div>
        ${says?`<div class="says">${says}</div>`:''}</div>`;
    }).join('');
    return `<section class="book"><div class="bh">
              <span class="pill" style="background:${b.colour}">${b.id}</span>
              <span class="bt">${b.title}</span>
              <span class="sub">${b.words.length} words</span></div>
            <div class="grid">${cards}</div></section>`;
  }).join('');
  document.getElementById('count').textContent =
    `${BOOKS.length} books · ${n} words · click letters, then pick a mark`;
  syncBar();
}

function unitsOf(word, marks){
  return [...marks].sort((a,b)=>Math.min(...a.indices)-Math.min(...b.indices))
    .map(m=>m.indices.map(i=>word[i]).join(''));
}

function tap(ev, bid, word, i){
  ev.stopPropagation();
  if (!sel || sel.b!==bid || sel.word!==word) sel = {b:bid, word, idx:new Set()};
  sel.idx.has(i) ? sel.idx.delete(i) : sel.idx.add(i);
  if (!sel.idx.size) sel = null;
  render();
}
function clearSel(){ sel=null; render(); }

function syncBar(){
  const bar = document.getElementById('bar');
  if (!sel){ bar.classList.remove('on'); return; }
  bar.classList.add('on');
  const idx = [...sel.idx].sort((a,b)=>a-b);
  const letters = idx.map(i=>sel.word[i]).join('');
  document.getElementById('barW').textContent = sel.word;
  document.getElementById('barSel').textContent =
    `— selected "${letters}" (${idx.length} letter${idx.length>1?'s':''})`;
  const contiguous = idx.every((v,k)=>k===0 || v===idx[k-1]+1);
  // A dot is ONE letter making ONE sound; a line needs 2+ letters that sit
  // together; a split digraph is exactly 2 letters with a gap between them.
  document.getElementById('mDot').disabled  = idx.length!==1;
  document.getElementById('mBar').disabled  = !(idx.length>1 && contiguous);
  document.getElementById('mOver').disabled = !(idx.length===2 && !contiguous);
  document.getElementById('mDia').disabled  = false;
}

let pending = null;
function apply(type){
  const idx = [...sel.idx].sort((a,b)=>a-b);
  if (type==='diamond'){
    // Capture the TARGET here, not in commit(): the dialog is outside .w and
    // .bar-wrap, so clicking a sound chip fired the outside-click handler and
    // cleared `sel` before commit() could read it — Set silently did nothing.
    pending = {type, idx, b: sel.b, word: sel.word};
    document.getElementById('dlgT').textContent =
      `${sel.word} — "${idx.map(i=>sel.word[i]).join('')}"`;
    document.getElementById('opts').innerHTML =
      SOUNDS.map(s=>`<button class="opt" onclick="choose('${s}')">${s}</button>`).join('');
    document.getElementById('custom').value='';
    dlg.showModal();
    return;
  }
  setMark({type, indices:idx});
}
function choose(s){ document.getElementById('custom').value=s; commit(); }
function commit(){
  const says = document.getElementById('custom').value.trim();
  if(!says) return;
  setMark({type:'diamond', indices:pending.idx, says}, pending.b, pending.word);
  dlg.close();
}

function setMark(mark, bid, word){
  bid = bid || (sel && sel.b); word = word || (sel && sel.word);
  const b = BOOKS.find(x=>x.id===bid);
  const w = b && b.words.find(x=>x.word===word);
  if (!w) { alert('Lost track of that word — reselect and try again.'); return; }
  const cur = (edits[b.id]||{})[w.word] || JSON.parse(JSON.stringify(w.marks));
  // Drop anything overlapping the new mark, then insert it — a letter can
  // only belong to one unit.
  const taken = new Set(mark.indices);
  const kept = cur.filter(m=>!m.indices.some(i=>taken.has(i)));
  kept.push(mark);
  kept.sort((a,b)=>Math.min(...a.indices)-Math.min(...b.indices));
  edits[b.id] = edits[b.id] || {};
  edits[b.id][w.word] = kept;
  sel = null; dirty(); render();
}
function resetWord(){
  const b = sel.b, w = sel.word;
  if (edits[b]) { delete edits[b][w]; if(!Object.keys(edits[b]).length) delete edits[b]; }
  sel=null; dirty(); render();
}
function dirty(){
  const n = Object.values(edits).reduce((a,b)=>a+Object.keys(b).length,0);
  const btn = document.getElementById('saveBtn');
  btn.disabled = !n;
  btn.textContent = n ? `Save ${n} change${n>1?'s':''}` : 'Save marks';
  document.getElementById('status').textContent =
    n ? `${n} unsaved change${n>1?'s':''}` : '';
}

function payload(){
  const out={};
  for (const [bid, words] of Object.entries(edits)){
    const bk = BOOKS.find(x=>x.id===bid);
    out[bid]={};
    for (const [word, marks] of Object.entries(words)){
      out[bid][word] = {
        units: unitsOf(word, marks),
        marks: marks.map(m=>({type:m.type, letters:m.indices.map(i=>word[i]).join(''),
                              indices:m.indices, ...(m.says?{says:m.says}:{})})),
        shifty_marks: marks.filter(m=>m.type==='diamond')
                           .map(m=>({index:Math.min(...m.indices), says:m.says||''})),
      };
    }
  }
  return out;
}
function showJson(){
  const p = payload();
  document.getElementById('jsonOut').textContent =
    Object.keys(p).length ? JSON.stringify(p,null,2) : 'No changes yet.';
  jd.showModal();
}
async function save(){
  const r = await fetch('/save',{method:'POST',body:JSON.stringify(payload())});
  const j = await r.json();
  if(!j.ok){ alert('Save failed: '+j.error); return; }
  // Saved marks stay on screen and stay editable — the file is the record,
  // so you can keep going and save again, or stop and point Claude at it.
  document.getElementById('status').textContent =
    `Saved ${j.words} word${j.words>1?'s':''} — tell Claude to apply them`;
  document.getElementById('status').style.color = '#15803d';
}
document.addEventListener('click', e=>{
  if(!e.target.closest('.w,.bar-wrap,dialog')) clearSel();
});
render();
</script></body></html>
"""


class Handler(BaseHTTPRequestHandler):
    books: list = []

    def log_message(self, *a):
        pass

    def do_GET(self):
        if self.path not in ("/", "/index.html"):
            self.send_error(404)
            return
        html = PAGE.replace("__DATA__", json.dumps(self.books, ensure_ascii=False))
        body = html.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path != "/save":
            self.send_error(404)
            return
        try:
            n = int(self.headers.get("Content-Length", 0))
            edits = json.loads(self.rfile.read(n) or b"{}")
            REVIEW.parent.mkdir(parents=True, exist_ok=True)
            REVIEW.write_text(json.dumps({
                "_note": ("Reviewed shifty marks from mark_words_server.py. "
                          "Shape matches a story dict's shifty_marks. NOT applied "
                          "automatically — the story dicts carry the pedagogy "
                          "rationale in comments and must be edited deliberately."),
                "books": edits,
            }, indent=2, ensure_ascii=False), encoding="utf-8")
            total = sum(len(b) for b in edits.values())
            out = {"ok": True, "words": total, "path": str(REVIEW)}
            print(f"  saved {total} words -> {REVIEW}")
        except Exception as e:                                # noqa: BLE001
            out = {"ok": False, "error": str(e)}
        body = json.dumps(out).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main() -> int:
    port = 8765
    if "--port" in sys.argv:
        port = int(sys.argv[sys.argv.index("--port") + 1])
    refresh = "--refresh" in sys.argv
    print("Building words from the print pipeline"
          + (" (refreshing cache)" if refresh else " (cached)") + "...")
    Handler.books = build_books(refresh)
    total = sum(len(b["words"]) for b in Handler.books)
    url = f"http://localhost:{port}"
    print(f"\n  {len(Handler.books)} books, {total} words")
    print(f"  {url}   (Ctrl+C to stop)\n")
    try:
        webbrowser.open(url)
    except Exception:                                          # noqa: BLE001
        pass
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
    return 0


if __name__ == "__main__":
    sys.exit(main())
