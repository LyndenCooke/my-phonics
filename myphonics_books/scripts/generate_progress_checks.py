"""Half-termly progress-check sheets + paper class trackers (audit blocker #2).

Produces output/progress_checks/:
  * 17 one-page A4 check sheets — one per half-term row of
    SCHOOL_SCHEME_RECEPTION_TO_Y2.md (Reception Aut 1 -> Y2 Sum 2, skipping the
    pure PSC-revision half-term, Y1 Spring 2). Named e.g. L5b_check_Y1_Aut2.pdf.
  * 8 A3-landscape class trackers — one per level, 30 name rows x one column per
    half-termly checkpoint + a Quick Level Check exit column.

Design family: mirrors marketing/paper-assessment (level colour band header,
Outfit/Plus Jakarta chrome, bundled Andika for every child-facing grapheme/word).

Content rules (enforced by curation, spot-audit list printed at the end):
  * "Read the sounds"  = the GPCs newly taught in that half-term (scheme §2).
  * "Read the words"   = 10 real words decodable using ONLY the cumulative code
    up to and including that half-term (+ tricky words already taught).
  * "Alien words"      = 2 pseudowords targeting this half-term's GPCs — L1-L5
    only. Alien words are deliberately retired after the PSC, so L6+ sheets
    carry 2 extra real "challenge words" instead.
  * Tricky row         = that half-term's new tricky words / CEWs
    (CURRICULUM_LEDGER.md membership).

Run:  py -3.12 scripts/generate_progress_checks.py
Deps: jinja2, playwright (chromium), pymupdf (merge only — optional).
"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

from jinja2 import DictLoader, Environment, select_autoescape
from playwright.async_api import async_playwright

HERE = Path(__file__).resolve().parent
REPO = HERE.parent                                  # myphonics_books/
FONTS = REPO / "assets" / "fonts"
OUT_DIR = REPO / "output" / "progress_checks"
BUILD_DIR = OUT_DIR / "_build"
for d in (OUT_DIR, BUILD_DIR):
    d.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------- level meta
LEVELS = {
    1: ("Ditties", "#E84B8A"),
    2: ("First Sounds", "#F97066"),
    3: ("Special Friends", "#F59E0B"),
    4: ("Longer Sounds", "#22C55E"),
    5: ("New Spellings", "#3B82F6"),
    6: ("Building Fluency", "#6366F1"),
    7: ("Reading Together", "#8B5CF6"),
    8: ("Reading Champion", "#14B8A6"),
}


def darken(hex_colour: str, factor: float = 0.62) -> str:
    """Ink variant of a level colour (for headings on white)."""
    h = hex_colour.lstrip("#")
    r, g, b = (int(h[i : i + 2], 16) for i in (0, 2, 4))
    return "#{:02x}{:02x}{:02x}".format(*(round(c * factor) for c in (r, g, b)))


# ------------------------------------------------------------- checkpoints
# One entry per half-term row of SCHOOL_SCHEME_RECEPTION_TO_Y2.md §2.
# Y1 Spring 2 (whole-code PSC revision, no new code) is skipped by design.
#
# sounds: list of (grapheme, hint-word-or-None). Hints disambiguate the two
# oo/ow pronunciations and label review sections.
S = lambda *gs: [(g, None) for g in gs]  # noqa: E731

CHECKPOINTS: list[dict] = [
    # ---------------- Reception ----------------
    dict(
        code="L1", level=1, term="Reception · Autumn 1", slug="R_Aut1",
        focus="First 10 sounds · blend and read VC/CVC",
        sounds=S("s", "a", "t", "p", "i", "n", "m", "d", "g", "o"),
        words=["sat", "pin", "tap", "dog", "mat", "dig", "top", "nap", "sip", "got"],
        alien=["sog", "pim"],
        tricky=["I", "the"], tricky_review=False,
    ),
    dict(
        code="L2a", level=2, term="Reception · Autumn 2", slug="R_Aut2",
        focus="c k ck e u r h b f ff · CVC across the wider code",
        sounds=S("c", "k", "ck", "e", "u", "r", "h", "b", "f", "ff"),
        words=["cat", "kid", "cup", "red", "hen", "bus", "fun", "sock", "huff", "back"],
        alien=["keb", "fup"],
        tricky=["I", "the"], tricky_review=True,
    ),
    dict(
        code="L2b", level=2, term="Reception · Spring 1", slug="R_Spr1",
        focus="l ll ss j v w x y z · all 26 letters complete",
        sounds=S("l", "ll", "ss", "j", "v", "w", "x", "y", "z"),
        words=["leg", "jam", "van", "wet", "six", "yes", "zip", "bell", "miss", "box"],
        alien=["jav", "zill"],
        tricky=["no", "go", "to", "into", "is"], tricky_review=False,
    ),
    dict(
        code="L3", level=3, term="Reception · Spring 2", slug="R_Spr2",
        focus="Consonant digraphs + adjacent consonants",
        sounds=S("sh", "nk", "ch", "th", "ng", "qu", "zz"),
        words=["ship", "chat", "thin", "ring", "wink", "quiz", "buzz", "stop", "frog", "crisp"],
        alien=["shog", "thip"],
        tricky=["he", "she", "we", "me", "be"], tricky_review=False,
    ),
    dict(
        code="L4a", level=4, term="Reception · Summer 1", slug="R_Sum1",
        focus="First vowel digraphs",
        sounds=[("ay", "day"), ("ee", "see"), ("igh", "night"),
                ("ow", "blow"), ("oo", "zoo"), ("oo", "look")],
        words=["day", "see", "high", "snow", "moon", "look", "tray", "feet", "night", "book"],
        alien=["zay", "foop"],
        tricky=["was", "my", "you", "they"], tricky_review=False,
    ),
    dict(
        code="L4b", level=4, term="Reception · Summer 2", slug="R_Sum2",
        focus="Remaining vowel digraphs · two-syllable words",
        sounds=[("ar", "car"), ("or", "fork"), ("air", "hair"),
                ("ir", "bird"), ("ou", "out"), ("oy", "boy")],
        words=["car", "park", "fork", "storm", "hair", "fair", "bird", "girl", "shout", "boy"],
        alien=["zorb", "gair"],
        tricky=["her", "all", "are"], tricky_review=False,
    ),
    # ---------------- Year 1 ----------------
    dict(
        code="L5a", level=5, term="Year 1 · Autumn 1", slug="Y1_Aut1",
        focus="Split digraphs (magic e)",
        sounds=[("a-e", "cake"), ("i-e", "bike"), ("o-e", "home"), ("u-e", "cube")],
        words=["cake", "make", "bike", "time", "home", "bone", "cube", "flute", "shine", "snake"],
        alien=["vake", "pome"],
        tricky=["said", "so", "have", "like"], tricky_review=False,
    ),
    dict(
        code="L5b", level=5, term="Year 1 · Autumn 2", slug="Y1_Aut2",
        focus="Same sound, different spelling",
        sounds=[("ea", "dream"), ("ie", "pie"), ("oi", "coin"),
                ("aw", "yawn"), ("ai", "rain"), ("oa", "boat")],
        words=["dream", "beach", "pie", "coin", "yawn", "rain", "boat", "tie", "draw", "soap"],
        alien=["zoin", "traip"],
        tricky=["some", "come", "were", "there", "little", "one"], tricky_review=False,
    ),
    dict(
        code="L5c", level=5, term="Year 1 · Spring 1", slug="Y1_Spr1",
        focus="Full L5 code · suffixes with root change · prefix un-",
        sounds=[("a-e", None), ("i-e", None), ("o-e", None), ("u-e", None),
                ("ea", None), ("ie", None), ("oi", None), ("aw", None),
                ("ai", None), ("oa", None)],
        sounds_review=True,
        words=["hopping", "running", "patted", "waited", "jumping",
               "cooking", "sleeping", "unzip", "unpack", "unfit"],
        alien=["sprake", "glone"],
        tricky=["do", "when", "out", "what"], tricky_review=False,
    ),
    # (Y1 Spring 2 = whole-code PSC revision half-term — no check sheet by design.)
    dict(
        code="L6a", level=6, term="Year 1 · Summer 1", slug="Y1_Sum1",
        focus="More vowel alternatives (post-check momentum)",
        sounds=[("ur", "turn"), ("er", "her"), ("are", "share"),
                ("ow", "brown"), ("ew", "flew"), ("ue", "blue")],
        words=["turn", "church", "share", "care", "brown", "town", "flew", "chew", "blue", "glue"],
        challenge=["summer", "flower"],
        tricky=["oh", "looked", "called"], tricky_review=False,
    ),
    dict(
        code="L6b", level=6, term="Year 1 · Summer 2", slug="Y1_Sum2",
        focus="First alternative consonant spellings",
        sounds=[("wr", "write"), ("kn", "knee"), ("ge", "page"), ("dge", "bridge")],
        words=["write", "wrong", "knee", "know", "page", "cage", "bridge", "fudge", "wrap", "knit"],
        challenge=["wrote", "hedge"],
        tricky=["Mr", "Mrs", "asked"], tricky_review=False,
    ),
    # ---------------- Year 2 ----------------
    dict(
        code="L6c", level=6, term="Year 2 · Autumn 1", slug="Y2_Aut1",
        focus="Full L6 code · silent letters and word-pool graphemes",
        sounds=[("mb", "lamb"), ("gn", "gnat"), ("ph", "phone"), ("wh", "when"),
                ("oe", "toe"), ("au", "sauce"), ("e-e", "these"), ("c", "city")],
        words=["lamb", "climb", "gnat", "phone", "graph", "when", "whisk", "toe", "city", "comb"],
        challenge=["gnaw", "sauce"],
        tricky=["their", "people", "could"], tricky_review=False,
    ),
    dict(
        code="L7a", level=7, term="Year 2 · Autumn 2", slug="Y2_Aut2",
        focus="Trigraphs · Y2 common exception words begin",
        sounds=[("ire", "fire"), ("ore", "more"), ("ear", "near"),
                ("oor", "door"), ("ure", "sure"), ("tion", "station")],
        words=["fire", "hire", "more", "shore", "near", "hear", "door", "floor", "sure", "station"],
        challenge=["wire", "score"],
        tricky=["because", "find", "kind", "mind", "child", "wild"], tricky_review=False,
    ),
    dict(
        code="L7b", level=7, term="Year 2 · Spring 1", slug="Y2_Spr1",
        focus="Suffix spelling rules: doubling, drop-e, y to i",
        sounds=[("-ing", None), ("-ed", None), ("-er", None), ("-est", None),
                ("-y", None), ("-ful", None), ("-ly", None), ("-ment", None), ("-ness", None)],
        sounds_title="Read the endings",
        words=["skipping", "bigger", "making", "nicer", "happier",
               "funniest", "jumped", "careful", "slowly", "kindness"],
        challenge=["payment", "darkness"],
        tricky=["most", "only", "both", "cold", "every", "great"], tricky_review=False,
    ),
    dict(
        code="L8a", level=8, term="Year 2 · Spring 2", slug="Y2_Spr2",
        focus="Morphology opens longer words",
        sounds=[("-ous", None), ("-cious", None), ("-tious", None), ("-able", None),
                ("-ible", None), ("re-", None), ("dis-", None), ("mis-", None)],
        sounds_title="Read the word parts",
        words=["famous", "dangerous", "delicious", "precious", "cautious",
               "comfortable", "sensible", "replay", "dislike", "mistake"],
        challenge=["enormous", "horrible"],
        tricky=["hour", "move", "prove", "sugar", "eye", "who"], tricky_review=False,
    ),
    dict(
        code="L8b", level=8, term="Year 2 · Summer 1", slug="Y2_Sum1",
        focus="-tion and -sion families · remaining Y2 CEWs",
        sounds=[("-tion", None), ("-sion", None), ("-ous", None),
                ("-able", None), ("-ible", None), ("mis-", None)],
        sounds_title="Read the word parts",
        words=["action", "fiction", "mention", "invention", "section",
               "mission", "passion", "discussion", "version", "explosion"],
        challenge=["celebration", "confusion"],
        tricky=["should", "would", "whole", "many", "busy", "water"], tricky_review=False,
    ),
    dict(
        code="L8c", level=8, term="Year 2 · Summer 2", slug="Y2_Sum2",
        focus="Fluency and stamina · programme complete",
        sounds=[("re-", None), ("dis-", None), ("mis-", None), ("-ous", None),
                ("-cious", None), ("-able", None), ("-ible", None),
                ("-tion", None), ("-sion", None)],
        sounds_review=True, sounds_title="Read the word parts",
        words=["marvellous", "incredible", "remarkable", "suspicious", "reaction",
               "permission", "unhappiness", "disagreement", "movement", "adventurous"],
        challenge=["imagination", "invisible"],
        tricky=["again", "half", "money", "parents", "clothes", "Christmas"],
        tricky_review=False,
    ),
]

# ------------------------------------------------------------- templates
CHECK_TEMPLATE = """<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="UTF-8">
<title>Progress Check {{ C.code }}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  @font-face { font-family:'Andika'; src:url('{{ font_regular }}') format('truetype'); font-weight:400; }
  @font-face { font-family:'Andika'; src:url('{{ font_bold }}') format('truetype'); font-weight:700; }
  :root {
    --level: {{ C.hex }}; --ink: {{ C.ink }};
    --text:#1f2937; --muted:#6b7280; --line:#e5e7eb;
    --bleed:3mm; --safe:8mm;
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { font-family:"Plus Jakarta Sans",sans-serif; color:var(--text);
    -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  @page { size:216mm 303mm; margin:0; }
  .sheet { width:216mm; height:303mm; position:relative; background:#fff;
    overflow:hidden; display:flex; flex-direction:column; }
  h1,h2,h3,h4 { font-family:"Outfit",sans-serif; }
  .kid { font-family:"Andika",sans-serif; }

  .header { background:var(--level); color:#fff;
    padding:calc(var(--bleed) + 5mm) var(--safe) 5mm var(--safe);
    display:flex; align-items:flex-end; justify-content:space-between; gap:8mm; }
  .header .brand { font-size:10.5pt; font-weight:700; opacity:.92; }
  .header h1 { font-size:22pt; font-weight:900; line-height:1.05; margin-top:1.2mm; letter-spacing:-.3pt; }
  .header .sub { font-size:10.5pt; font-weight:600; opacity:.95; margin-top:1.2mm; }
  .lvlbadge { flex:0 0 auto; text-align:center; background:rgba(255,255,255,.18);
    border:1.4pt solid rgba(255,255,255,.7); border-radius:4mm; padding:2.4mm 5mm; min-width:36mm; }
  .lvlbadge .lab { font-family:"Outfit"; font-size:7.5pt; font-weight:700; letter-spacing:1.3pt; text-transform:uppercase; opacity:.9; }
  .lvlbadge .num { font-family:"Outfit"; font-size:21pt; font-weight:900; line-height:1.1; }
  .lvlbadge .nm { font-family:"Outfit"; font-size:9pt; font-weight:700; }

  .namebar { display:flex; gap:8mm; padding:3.2mm var(--safe); border-bottom:1.2pt solid var(--line);
    font-size:9.5pt; font-weight:600; color:var(--muted); align-items:baseline; }
  .namebar .fill { flex:1; border-bottom:1pt solid #94a3b8; min-height:5.5mm; }
  .namebar .fill.short { flex:0 0 34mm; }
  .namebar b { color:var(--ink); }

  .body { flex:1; padding:3.6mm var(--safe) 0 var(--safe); display:flex; flex-direction:column; gap:3mm; }
  .howto { font-size:8.4pt; color:var(--muted); line-height:1.35; }
  .howto b { color:var(--text); }

  .box { border:1.2pt solid var(--line); border-radius:3mm; overflow:hidden;
    display:flex; flex-direction:column; flex:1 1 auto; }
  .box-head { display:flex; align-items:center; gap:3mm; padding:2.2mm 4mm;
    background:color-mix(in srgb, var(--level) 9%, #fff);
    border-bottom:1pt solid color-mix(in srgb, var(--level) 22%, #fff); }
  .box-head .n { font-family:"Outfit"; font-weight:900; font-size:10pt; color:#fff;
    background:var(--level); width:6.2mm; height:6.2mm; border-radius:50%;
    display:inline-flex; align-items:center; justify-content:center; flex:0 0 auto; }
  .box-head h3 { font-size:11.5pt; font-weight:800; color:var(--ink); }
  .box-head .tag { font-family:"Outfit"; font-size:6.8pt; font-weight:800; letter-spacing:.6pt;
    text-transform:uppercase; color:var(--level); border:1pt solid var(--level);
    border-radius:3mm; padding:.4mm 2mm; }
  .box-head .instr { font-size:8pt; color:var(--muted); margin-left:auto; text-align:right; max-width:78mm; }
  .box-head .scorebox { flex:0 0 auto; font-family:"Outfit"; font-size:8.5pt; font-weight:800;
    color:var(--ink); border:1.2pt solid var(--ink); border-radius:2mm; padding:1.2mm 2.4mm;
    background:#fff; white-space:nowrap; margin-left:3mm; }
  .box-head .scorebox span { display:inline-block; width:7mm; border-bottom:1pt solid var(--ink); }

  .chips { display:flex; flex-wrap:wrap; gap:2.2mm; padding:2.8mm 4mm;
    flex:1; align-content:center; align-items:center; }
  .chip { font-family:"Andika",sans-serif; font-weight:700; border:1pt solid var(--line);
    border-radius:2mm; background:#fff; min-width:12mm; text-align:center;
    padding:1.5mm 2.6mm; display:inline-flex; flex-direction:column;
    align-items:center; justify-content:center; }
  .chip .hint { font-family:"Plus Jakarta Sans"; font-weight:500; font-size:6.5pt; color:var(--muted); margin-top:.6mm; }
  .sounds .chip { font-size:17pt; min-width:15mm; }
  .words .chip { font-size:13.5pt; }
  .alien .chip { font-size:13.5pt; border-style:dashed;
    border-color:color-mix(in srgb, var(--level) 55%, #cbd5e1); }
  .tricky .chip { font-size:12.5pt; }

  .judge { margin:1mm var(--safe) 0 var(--safe); border:1.4pt solid var(--level);
    border-radius:3mm; overflow:hidden; }
  .judge-head { background:var(--level); color:#fff; font-family:"Outfit"; font-weight:800;
    font-size:10pt; padding:1.8mm 4mm; display:flex; justify-content:space-between; align-items:baseline; }
  .judge-head .crit { font-family:"Plus Jakarta Sans"; font-weight:600; font-size:7.6pt; opacity:.95; }
  .judge-body { display:flex; }
  .judge-col { flex:1; padding:2.6mm 4mm; font-size:8.6pt; line-height:1.4; }
  .judge-col + .judge-col { border-left:1pt solid var(--line); }
  .judge-col h4 { font-family:"Outfit"; font-size:7.6pt; font-weight:800; letter-spacing:.5pt;
    text-transform:uppercase; color:var(--muted); margin-bottom:1mm; }
  .bigtick { display:flex; gap:4mm; align-items:center; }
  .bigtick .opt { display:flex; gap:2mm; align-items:center; font-family:"Outfit"; font-weight:800; font-size:10.5pt; color:var(--ink); }
  .bigtick .sq { width:6.5mm; height:6.5mm; border:1.4pt solid var(--ink); border-radius:1.5mm; }
  .nextstep { border-top:1pt solid var(--line); padding:2.4mm 4mm 3mm 4mm; font-size:8.8pt; }
  .nextstep b { font-family:"Outfit"; color:var(--ink); }
  .nextstep .line { border-bottom:1pt solid #94a3b8; height:6mm; margin-top:1.6mm; }

  .footer { margin-top:auto; display:flex; align-items:center; justify-content:space-between;
    padding:2.6mm var(--safe) calc(var(--bleed) + 4mm) var(--safe); border-top:1.2pt solid var(--line); }
  .footer .l { font-size:7.8pt; color:var(--muted); max-width:120mm; line-height:1.35; }
  .footer .r { font-family:"Outfit"; font-weight:800; font-size:10pt; color:var(--ink); text-align:right; }
  .footer .r .qts { font-family:"Plus Jakarta Sans"; font-size:7.4pt; color:var(--muted); font-weight:500; }
</style>
</head>
<body>
<div class="sheet">
  <div class="header">
    <div>
      <div class="brand">MyPhonicsBooks · Half-Termly Progress Check</div>
      <h1>{{ C.code }} · {{ C.term_flat }}</h1>
      <div class="sub">{{ C.focus }}</div>
    </div>
    <div class="lvlbadge">
      <div class="lab">Level</div>
      <div class="num">{{ C.level }}{{ C.sub }}</div>
      <div class="nm">{{ C.name }}</div>
    </div>
  </div>

  <div class="namebar">
    <b>Name</b><span class="fill"></span>
    <b>Class</b><span class="fill short"></span>
    <b>Date</b><span class="fill short"></span>
  </div>

  <div class="body">
    <div class="howto"><b>Teacher-administered, one to one (3-4 minutes).</b>
      Work down the boxes with the child. Tick each item read correctly, write the score,
      then tick the judgement and record it on the Level {{ C.level }} class tracker.</div>

    {% for s in C.sections %}
    <div class="box {{ s.css }}">
      <div class="box-head">
        <span class="n">{{ loop.index }}</span>
        <h3>{{ s.title }}</h3>
        {% if s.tag %}<span class="tag">{{ s.tag }}</span>{% endif %}
        <span class="instr">{{ s.instruction }}</span>
        <span class="scorebox"><span></span>&nbsp;/ {{ s['items']|length }}</span>
      </div>
      <div class="chips">
        {% for it in s['items'] %}
        <span class="chip">{{ it.text }}{% if it.hint %}<span class="hint">as in {{ it.hint }}</span>{% endif %}</span>
        {% endfor %}
      </div>
    </div>
    {% endfor %}
  </div>

  <div class="judge">
    <div class="judge-head"><span>Judgement</span>
      <span class="crit">Secure = every sound, at least {{ C.words_secure }} words, and every tricky word.</span></div>
    <div class="judge-body">
      <div class="judge-col">
        <h4>Tick one</h4>
        <div class="bigtick">
          <span class="opt"><span class="sq"></span> Secure</span>
          <span class="opt"><span class="sq"></span> Developing</span>
        </div>
      </div>
      <div class="judge-col">
        <h4>If developing</h4>
        Start the daily 10-minute keep-up routine on the sounds missed, and re-check within two weeks.
      </div>
    </div>
    <div class="nextstep"><b>Next step</b> (which sounds or words to practise):<div class="line"></div></div>
  </div>

  <div class="footer">
    <div class="l">{{ C.footnote }}</div>
    <div class="r">myphonicsbooks.co.uk<div class="qts">Built by a British primary teacher, QTS.</div></div>
  </div>
</div>
</body>
</html>
"""

TRACKER_TEMPLATE = """<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="UTF-8">
<title>Class Tracker Level {{ T.level }}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root { --level: {{ T.hex }}; --ink: {{ T.ink }};
    --text:#1f2937; --muted:#6b7280; --line:#d7dbe2; }
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { font-family:"Plus Jakarta Sans",sans-serif; color:var(--text);
    -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  @page { size:420mm 297mm; margin:0; }
  .sheet { width:420mm; height:297mm; background:#fff; display:flex; flex-direction:column; overflow:hidden; }
  h1 { font-family:"Outfit",sans-serif; }

  .header { background:var(--level); color:#fff; padding:7mm 10mm 5.5mm 10mm;
    display:flex; align-items:flex-end; justify-content:space-between; gap:10mm; }
  .header .brand { font-size:11pt; font-weight:700; opacity:.92; }
  .header h1 { font-size:24pt; font-weight:900; letter-spacing:-.3pt; margin-top:1mm; }
  .header .meta { display:flex; gap:8mm; align-items:baseline; font-size:11pt; font-weight:600; }
  .header .meta .fill { display:inline-block; width:52mm; border-bottom:1.2pt solid rgba(255,255,255,.85); }

  .legend { display:flex; gap:8mm; align-items:center; padding:3mm 10mm;
    border-bottom:1.2pt solid var(--line); font-size:9pt; color:var(--muted); }
  .legend b { color:var(--ink); font-family:"Outfit"; }
  .legend .chip { border:1pt solid var(--line); border-radius:2mm; padding:.8mm 2.6mm; color:var(--text); font-weight:600; }

  table { width:calc(100% - 20mm); margin:3.5mm 10mm 0 10mm; border-collapse:collapse; table-layout:fixed; }
  th, td { border:1pt solid var(--line); }
  thead th { background:color-mix(in srgb, var(--level) 10%, #fff); color:var(--ink);
    font-family:"Outfit"; font-weight:800; font-size:9.5pt; padding:2mm 1.5mm; vertical-align:bottom; }
  thead th .t { display:block; font-family:"Plus Jakarta Sans"; font-weight:600; font-size:7.6pt; color:var(--muted); margin-top:.8mm; }
  thead th.namecol { text-align:left; padding-left:3mm; width:58mm; }
  thead th.exit { background:color-mix(in srgb, var(--level) 24%, #fff); }
  tbody td { height:{{ T.row_h }}mm; }
  tbody td.name { padding-left:3mm; font-size:9pt; color:var(--muted); }
  tbody td.mark { position:relative; }
  tbody td.mark .sd { position:absolute; right:1.6mm; bottom:1mm;
    font-family:"Outfit"; font-size:7.2pt; font-weight:700; color:#b6bcc7; letter-spacing:.4pt; }
  tbody tr:nth-child(5n) td { border-bottom-width:1.6pt; border-bottom-color:#aab1bd; }

  .footer { margin-top:auto; display:flex; justify-content:space-between; align-items:center;
    padding:2.5mm 10mm 5mm 10mm; font-size:8.5pt; color:var(--muted); }
  .footer b { color:var(--ink); font-family:"Outfit"; }
</style>
</head>
<body>
<div class="sheet">
  <div class="header">
    <div>
      <div class="brand">MyPhonicsBooks · Class Progress Tracker</div>
      <h1>Level {{ T.level }} · {{ T.name }}</h1>
    </div>
    <div class="meta">
      <span>Class <span class="fill"></span></span>
      <span>Teacher <span class="fill"></span></span>
      <span>Year <span class="fill"></span></span>
    </div>
  </div>

  <div class="legend">
    <span><b>How to use:</b> after each half-termly progress check, write the <b>date</b> in the cell and circle <b>S</b> or <b>D</b>.</span>
    <span class="chip"><b>S</b> = Secure — move on</span>
    <span class="chip"><b>D</b> = Developing — daily keep-up, re-check within two weeks</span>
    <span class="chip"><b>Exit</b> = Quick Level Check passed — child moves to Level {{ T.next_level }}</span>
  </div>

  <table>
    <thead>
      <tr>
        <th class="namecol">Name</th>
        {% for cp in T.checkpoints %}
        <th>{{ cp.code }} check<span class="t">{{ cp.term }}</span></th>
        {% endfor %}
        <th class="exit">Quick Level Check<span class="t">exit to Level {{ T.next_level }}</span></th>
      </tr>
    </thead>
    <tbody>
      {% for i in range(30) %}
      <tr>
        <td class="name">{{ i + 1 }}</td>
        {% for cp in T.checkpoints %}<td class="mark"><span class="sd">S / D</span></td>{% endfor %}
        <td class="mark"><span class="sd">S / D</span></td>
      </tr>
      {% endfor %}
    </tbody>
  </table>

  <div class="footer">
    <span><b>Keep-up, not catch-up:</b> a D never waits until the next half-term — start the 10-minute daily routine the same week.</span>
    <span><b>myphonicsbooks.co.uk</b></span>
  </div>
</div>
</body>
</html>
"""

# ------------------------------------------------------------- assembly


def prep_checkpoint(c: dict) -> dict:
    name, hexc = LEVELS[c["level"]]
    c = dict(c)
    c["name"] = name
    c["hex"] = hexc
    c["ink"] = darken(hexc)
    c["sub"] = c["code"].replace(f"L{c['level']}", "")
    c["term_flat"] = c["term"].replace(" · ", " ")

    chip = lambda w: {"text": w, "hint": None}  # noqa: E731
    sections = []

    sounds_title = c.get("sounds_title", "Read the sounds")
    sections.append({
        "css": "sounds", "title": sounds_title,
        "tag": "review" if c.get("sounds_review") else ("new this half-term" if not c.get("sounds_title") else "taught this half-term"),
        "instruction": "Point to each card. Child says the sound (or reads the word part).",
        "items": [{"text": g, "hint": h} for g, h in c["sounds"]],
    })
    sections.append({
        "css": "words", "title": "Read the words", "tag": None,
        "instruction": "Every word uses only the code taught so far. No time limit.",
        "items": [chip(w) for w in c["words"]],
    })
    if c.get("alien"):
        sections.append({
            "css": "alien", "title": "Alien words", "tag": "made-up words",
            "instruction": "Tell the child these are made-up alien names — sound them out.",
            "items": [chip(w) for w in c["alien"]],
        })
    else:
        sections.append({
            "css": "words", "title": "Challenge words", "tag": "longer words",
            "instruction": "Two longer real words using this half-term's new code.",
            "items": [chip(w) for w in c["challenge"]],
        })
    sections.append({
        "css": "tricky",
        "title": "Tricky words" if c["level"] < 7 else "Common exception words",
        "tag": "review" if c["tricky_review"] else None,
        "instruction": ("No new tricky words this half-term — re-check the earlier set."
                        if c["tricky_review"] else
                        "Read on sight — these cannot be fully sounded out yet."),
        "items": [chip(w) for w in c["tricky"]],
    })
    c["sections"] = sections
    c["words_secure"] = f"8/{len(c['words'])}"
    extra = ("Alien words are deliberately retired after Level 5 — this sheet uses real challenge words instead."
             if not c.get("alien") else
             "Alien (made-up) words check pure decoding — praise the sounding-out, not just the answer.")
    c["footnote"] = (f"Half-termly progress check {c['code']} — {c['term_flat']} · "
                     f"Level {c['level']} {name}. {extra}")
    return c


def build_trackers() -> list[dict]:
    trackers = []
    for level, (name, hexc) in LEVELS.items():
        cps = [{"code": c["code"], "term": c["term"].replace(" · ", " ")}
               for c in CHECKPOINTS if c["level"] == level]
        n_cols = len(cps) + 1
        # 30 rows in the space left under header+legend (~225mm usable)
        row_h = round(min(7.4, 222 / 30), 2)
        trackers.append({
            "level": level, "name": name, "hex": hexc, "ink": darken(hexc),
            "next_level": min(level + 1, 8) if level < 8 else "— (programme complete)",
            "checkpoints": cps, "n_cols": n_cols, "row_h": row_h,
        })
    return trackers


async def render_pdfs(jobs: list[tuple[Path, Path, str, str]]) -> None:
    """jobs: (html_path, pdf_path, width, height)."""
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        for html, pdf, w, h in jobs:
            await page.goto(html.as_uri(), wait_until="networkidle")
            await asyncio.sleep(1.2)  # webfonts settle
            await page.pdf(path=str(pdf), width=w, height=h, print_background=True,
                           margin={"top": "0", "bottom": "0", "left": "0", "right": "0"})
        await browser.close()


def main() -> None:
    env = Environment(
        loader=DictLoader({"check.j2": CHECK_TEMPLATE, "tracker.j2": TRACKER_TEMPLATE}),
        autoescape=select_autoescape(["html", "j2"]),
    )
    font_reg = (FONTS / "Andika-Regular.ttf").as_uri()
    font_bold = (FONTS / "Andika-Bold.ttf").as_uri()

    jobs: list[tuple[Path, Path, str, str]] = []

    print(f"1/3  Rendering {len(CHECKPOINTS)} half-termly check sheets...")
    for raw in CHECKPOINTS:
        c = prep_checkpoint(raw)
        html = env.get_template("check.j2").render(C=c, font_regular=font_reg, font_bold=font_bold)
        hpath = BUILD_DIR / f"{c['code']}_check_{c['slug']}.html"
        hpath.write_text(html, encoding="utf-8")
        pdf = OUT_DIR / f"{c['code']}_check_{c['slug']}.pdf"
        jobs.append((hpath, pdf, "216mm", "303mm"))

    print("2/3  Rendering 8 class trackers (A3 landscape)...")
    for t in build_trackers():
        html = env.get_template("tracker.j2").render(T=t)
        hpath = BUILD_DIR / f"L{t['level']}_class_tracker.html"
        hpath.write_text(html, encoding="utf-8")
        pdf = OUT_DIR / f"L{t['level']}_class_tracker.pdf"
        jobs.append((hpath, pdf, "420mm", "297mm"))

    print("3/3  Printing PDFs with Chromium...")
    asyncio.run(render_pdfs(jobs))

    print("\nWord audit (real | alien/challenge | tricky):")
    for raw in CHECKPOINTS:
        extra = raw.get("alien") or raw.get("challenge")
        print(f"  {raw['code']:<4} {', '.join(raw['words'])}"
              f"  |  {', '.join(extra)}  |  {', '.join(raw['tricky'])}")

    print("\nOutputs:")
    ok = True
    for _, pdf, _, _ in jobs:
        exists = pdf.exists() and pdf.stat().st_size > 5000
        ok &= exists
        print(f"  [{'OK ' if exists else 'FAIL'}] {pdf.relative_to(REPO)}  ({pdf.stat().st_size/1024:.0f} KB)" if pdf.exists()
              else f"  [FAIL] {pdf}")
    if not ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
