"""Generate the Phonics Screening Check mock pack (audit blocker #3).

Two full 40-word practice checks (Mock A, Mock B) in the official DfE PSC
format, each with a pupil booklet and a teacher pack:

  output/psc_mock/PSC_Mock_A_pupil.pdf    output/psc_mock/PSC_Mock_A_teacher.pdf
  output/psc_mock/PSC_Mock_B_pupil.pdf    output/psc_mock/PSC_Mock_B_teacher.pdf

Format (mirrors the real check):
  * 40 words per check: 20 pseudowords + 20 real words, no overlap A/B.
  * Section 1 (12 words: 8 pseudo + 4 real) — simpler structures,
    Phase 2-3 GPCs, CVC/CVCC/CCVC.
  * Section 2 (28 words: 12 pseudo + 16 real) — Phase 5 GPCs (split
    digraphs, alternative spellings), adjacent consonants, two-syllable words.
  * Pseudowords come FIRST within each section and carry an alien creature.
  * Pupil booklet: 4 words per A4 page, very large Andika type.

Assessable code = the scheme's cumulative code through L5 (see
output/worksheet_plan/CURRICULUM_LEDGER.md) PLUS the five read-only PSC
graphemes er ur ow(cow) ear ure taught in Year 1 Spring 2
(SCHOOL_SCHEME_RECEPTION_TO_Y2.md v1.1). Every real word is decodable
letter-by-letter within that code.

Alien art: no reusable alien raster assets exist in the book pipeline (the
book "Alien Words Challenge" page is pure CSS), so the aliens here are
friendly inline SVG blob creatures — solid black oval eyes only, no white
catchlights (house style rule).

Run:  py -3.12 scripts/generate_psc_mock.py
Deps: jinja2, playwright (chromium installed)
"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

from jinja2 import Environment, BaseLoader
from playwright.async_api import async_playwright

HERE = Path(__file__).resolve().parent
REPO = HERE.parent                                   # myphonics_books/
FONTS = REPO / "assets" / "fonts"
OUT_DIR = REPO / "output" / "psc_mock"
BUILD_DIR = OUT_DIR / "_build"
OUT_DIR.mkdir(parents=True, exist_ok=True)
BUILD_DIR.mkdir(exist_ok=True)

L5_BLUE = "#3B82F6"
L5_BLUE_DARK = "#1D4ED8"
L5_BLUE_PALE = "#EFF6FF"

# ---------------------------------------------------------------------------
# WORD DATA
# Each scored word: (word, kind, target GPC, note-for-teacher)
# kind: "pseudo" | "real".  Pseudo notes = acceptable-pronunciation guidance.
# ---------------------------------------------------------------------------

MOCKS = {
    "A": {
        "practice": [
            ("ib",   "pseudo", "VC blend",  "i-b"),
            ("dop",  "pseudo", "CVC blend", "d-o-p"),
            ("sun",  "real",   "CVC",       ""),
            ("mat",  "real",   "CVC",       ""),
        ],
        "s1_pseudo": [
            ("fex",   "x",        "f-e-x; x = /ks/"),
            ("yub",   "y",        "y-u-b"),
            ("chab",  "ch",       "ch as in chip; also accept /k/ (school) or /sh/ (chef)"),
            ("quep",  "qu",       "qu = /kw/"),
            ("vun",   "v",        "v-u-n"),
            ("steck", "ck",       "s-t-e-ck; ck = /k/"),
            ("thip",  "th",       "th voiced or unvoiced — both acceptable"),
            ("zong",  "ng",       "z-o-ng"),
        ],
        "s1_real": [
            ("jam",   "j (CVC)"),
            ("shelf", "sh (CVCC)"),
            ("grip",  "CCVC clusters"),
            ("drink", "nk (CCVC+C)"),
        ],
        "s2_pseudo": [
            ("sprake", "a-e",      "a-e = /ai/ as in cake; CCC onset"),
            ("brime",  "i-e",      "i-e = /igh/ as in time"),
            ("smode",  "o-e",      "o-e = /oa/ as in home"),
            ("plute",  "u-e",      "u-e = /oo/ (flute) or /yoo/ (cube) — both acceptable"),
            ("sheam",  "ea",       "ea = /ee/ (dream) or /e/ (bread) — both acceptable"),
            ("gloit",  "oi",       "oi = /oy/ as in coin"),
            ("dawp",   "aw",       "aw = /or/ as in paw"),
            ("traib",  "ai",       "ai = /ai/ as in rain"),
            ("spoad",  "oa",       "oa = /oa/ as in boat"),
            ("terb",   "er",       "er = /ur/ as in her"),
            ("murb",   "ur",       "ur = /ur/ as in turn"),
            ("clow",   "ow",       "ow = /ow/ (cow) or /oa/ (blow) — both acceptable"),
        ],
        "s2_real": [
            ("brave",    "a-e"),
            ("slide",    "i-e"),
            ("stone",    "o-e"),
            ("flute",    "u-e"),
            ("beach",    "ea + ch"),
            ("crawl",    "aw"),
            ("point",    "oi"),
            ("train",    "ai"),
            ("toast",    "oa"),
            ("herd",     "er — read-only PSC grapheme"),
            ("burst",    "ur — read-only PSC grapheme"),
            ("crowd",    "ow (cow) — read-only PSC grapheme"),
            ("fright",   "igh"),
            ("market",   "ar, two-syllable"),
            ("footpath", "oo (short) + th, two-syllable"),
            ("enjoy",    "oy, two-syllable"),
        ],
    },
    "B": {
        "practice": [
            ("ep",   "pseudo", "VC blend",  "e-p"),
            ("lem",  "pseudo", "CVC blend", "l-e-m"),
            ("top",  "real",   "CVC",       ""),
            ("red",  "real",   "CVC",       ""),
        ],
        "s1_pseudo": [
            ("zeck",  "z + ck",   "z-e-ck"),
            ("vob",   "v",        "v-o-b"),
            ("quen",  "qu",       "qu = /kw/"),
            ("jash",  "j + sh",   "j-a-sh"),
            ("thend", "th",       "th-e-n-d; th voiced or unvoiced"),
            ("yiz",   "y + z",    "y-i-z"),
            ("chot",  "ch",       "ch as in chip; also accept /k/ (school) or /sh/ (chef)"),
            ("zunk",  "nk",       "z-u-nk"),
        ],
        "s1_real": [
            ("chop",  "ch (CVC)"),
            ("swim",  "CCVC clusters"),
            ("stamp", "CCVCC clusters"),
            ("thick", "th + ck (CVC)"),
        ],
        "s2_pseudo": [
            ("glay",  "ay",   "ay = /ai/ as in day"),
            ("smeet", "ee",   "ee = /ee/ as in see"),
            ("vight", "igh",  "igh = /igh/ as in night"),
            ("smow",  "ow",   "ow = /oa/ (blow) or /ow/ (cow) — both acceptable"),
            ("blout", "ou",   "ou = /ow/ as in out; also accept /oo/ (soup)"),
            ("smair", "air",  "air = /air/ as in fair"),
            ("firp",  "ir",   "ir = /ur/ as in bird"),
            ("frope", "o-e",  "o-e = /oa/ as in home"),
            ("drute", "u-e",  "u-e = /oo/ (flute) or /yoo/ (cube) — both acceptable"),
            ("blie",  "ie",   "ie = /igh/ (pie) or /ee/ (chief) — both acceptable"),
            ("glear", "ear",  "ear = /eer/ (near) or /air/ (pear) — both acceptable"),
            ("nure",  "ure",  "ure = /oor/ or /yoor/ (sure, cure) — both acceptable"),
        ],
        "s2_real": [
            ("spray",  "ay"),
            ("street", "ee"),
            ("bright", "igh"),
            ("window", "ow (blow), two-syllable"),
            ("proud",  "ou"),
            ("chair",  "air"),
            ("shirt",  "ir"),
            ("storm",  "or"),
            ("smooth", "oo (long) + th"),
            ("flies",  "ie + plural -s"),
            ("oyster", "oy + er, two-syllable"),
            ("escape", "a-e, two-syllable"),
            ("prize",  "i-e"),
            ("scream", "ea"),
            ("crunch", "ch + clusters"),
            ("throat", "oa + th"),
        ],
    },
}


# ---------------------------------------------------------------------------
# ALIEN SVGs — friendly blob creatures.  House rule: eyes are SOLID BLACK
# filled ovals only — never add white circles or catchlights.
# ---------------------------------------------------------------------------

ALIEN_PALETTES = [
    ("#8ED08E", "#5FAE5F"),   # green
    ("#B79DE0", "#8F6DC7"),   # purple
    ("#F5B26B", "#DE923F"),   # orange
    ("#7EC8E3", "#4FA3C4"),   # blue
    ("#F09EB0", "#D9758C"),   # pink
    ("#E8D26E", "#C9AF3F"),   # yellow
]


def alien_svg(i: int) -> str:
    """Return one of six friendly blob-alien SVGs, deterministic by index."""
    body, dark = ALIEN_PALETTES[i % len(ALIEN_PALETTES)]
    kind = i % 3
    if kind == 0:      # round blob, two antennae
        return f'''<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
<path d="M30 18 Q26 4 18 6" stroke="{dark}" stroke-width="4" fill="none" stroke-linecap="round"/>
<path d="M70 18 Q74 4 82 6" stroke="{dark}" stroke-width="4" fill="none" stroke-linecap="round"/>
<circle cx="18" cy="6" r="5" fill="{dark}"/><circle cx="82" cy="6" r="5" fill="{dark}"/>
<ellipse cx="50" cy="58" rx="36" ry="34" fill="{body}"/>
<ellipse cx="38" cy="52" rx="6.5" ry="9" fill="#111111"/>
<ellipse cx="62" cy="52" rx="6.5" ry="9" fill="#111111"/>
<path d="M38 72 Q50 82 62 72" stroke="#111111" stroke-width="3.5" fill="none" stroke-linecap="round"/>
<ellipse cx="30" cy="92" rx="8" ry="5" fill="{dark}"/><ellipse cx="70" cy="92" rx="8" ry="5" fill="{dark}"/>
</svg>'''
    if kind == 1:      # tall blob, one antenna, three eyes
        return f'''<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
<path d="M50 16 Q50 4 50 4" stroke="{dark}" stroke-width="4" fill="none" stroke-linecap="round"/>
<circle cx="50" cy="5" r="5.5" fill="{dark}"/>
<path d="M50 14 C20 14 16 46 22 66 C27 84 40 96 50 96 C60 96 73 84 78 66 C84 46 80 14 50 14 Z" fill="{body}"/>
<ellipse cx="36" cy="46" rx="5.5" ry="8" fill="#111111"/>
<ellipse cx="50" cy="42" rx="5.5" ry="8" fill="#111111"/>
<ellipse cx="64" cy="46" rx="5.5" ry="8" fill="#111111"/>
<path d="M40 68 Q50 76 60 68" stroke="#111111" stroke-width="3.5" fill="none" stroke-linecap="round"/>
</svg>'''
    # kind == 2: wide blob with side arms
    return f'''<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
<path d="M34 26 Q28 12 20 14" stroke="{dark}" stroke-width="4" fill="none" stroke-linecap="round"/>
<circle cx="20" cy="14" r="5" fill="{dark}"/>
<path d="M66 26 Q72 12 80 14" stroke="{dark}" stroke-width="4" fill="none" stroke-linecap="round"/>
<circle cx="80" cy="14" r="5" fill="{dark}"/>
<ellipse cx="50" cy="62" rx="40" ry="30" fill="{body}"/>
<path d="M12 58 Q2 52 6 44" stroke="{dark}" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M88 58 Q98 52 94 44" stroke="{dark}" stroke-width="5" fill="none" stroke-linecap="round"/>
<ellipse cx="38" cy="56" rx="6" ry="8.5" fill="#111111"/>
<ellipse cx="62" cy="56" rx="6" ry="8.5" fill="#111111"/>
<path d="M40 74 Q50 81 60 74" stroke="#111111" stroke-width="3.5" fill="none" stroke-linecap="round"/>
</svg>'''


# ---------------------------------------------------------------------------
# Assemble the check: pseudo first, then real, within each section.
# ---------------------------------------------------------------------------

def build_rows(mock: dict) -> list[dict]:
    """Ordered list of the 40 scored words with metadata + alien index."""
    rows: list[dict] = []
    alien_i = 0
    n = 0
    for w, gpc, note in mock["s1_pseudo"]:
        n += 1
        rows.append(dict(n=n, word=w, kind="pseudo", section=1, gpc=gpc,
                         note=note, alien=alien_svg(alien_i)))
        alien_i += 1
    for w, gpc in mock["s1_real"]:
        n += 1
        rows.append(dict(n=n, word=w, kind="real", section=1, gpc=gpc,
                         note="", alien=None))
    for w, gpc, note in mock["s2_pseudo"]:
        n += 1
        rows.append(dict(n=n, word=w, kind="pseudo", section=2, gpc=gpc,
                         note=note, alien=alien_svg(alien_i)))
        alien_i += 1
    for w, gpc in mock["s2_real"]:
        n += 1
        rows.append(dict(n=n, word=w, kind="real", section=2, gpc=gpc,
                         note="", alien=None))
    return rows


def build_practice(mock: dict) -> list[dict]:
    out = []
    alien_i = 3   # different starting palette so practice aliens vary
    for w, kind, gpc, note in mock["practice"]:
        out.append(dict(word=w, kind=kind, gpc=gpc, note=note,
                        alien=alien_svg(alien_i) if kind == "pseudo" else None))
        if kind == "pseudo":
            alien_i += 1
    return out


def paginate(rows: list[dict], per_page: int = 4) -> list[dict]:
    """Split scored rows into pupil pages of 4, tagging each page's section."""
    pages = []
    for i in range(0, len(rows), per_page):
        chunk = rows[i:i + per_page]
        pages.append(dict(
            rows=chunk,
            section=chunk[0]["section"],
            first_of_section=(i == 0 or rows[i - 1]["section"] != chunk[0]["section"]),
        ))
    return pages


# ---------------------------------------------------------------------------
# TEMPLATES
# ---------------------------------------------------------------------------

PUPIL_TEMPLATE = """<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  @font-face { font-family:'Andika'; src:url('{{ font_regular }}'); font-weight:400; }
  @font-face { font-family:'Andika'; src:url('{{ font_bold }}'); font-weight:700; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Andika', sans-serif; color:#1a1a1a; }
  .page { width:210mm; height:297mm; padding:16mm 18mm 14mm;
          page-break-after:always; position:relative; display:flex;
          flex-direction:column; background:#ffffff; }

  /* ---------- cover ---------- */
  .cover { background:{{ blue_pale }}; align-items:center; text-align:center; }
  .cover-band { width:100%; background:{{ blue }}; border-radius:6mm;
                padding:10mm 8mm; color:#ffffff; margin-top:26mm; }
  .cover-kicker { font-size:14pt; letter-spacing:1.5px; text-transform:uppercase;
                  opacity:.92; }
  .cover-title { font-size:30pt; font-weight:700; line-height:1.25; margin-top:3mm; }
  .cover-sub { font-size:14pt; margin-top:3mm; opacity:.92; }
  .cover-alien { width:44mm; height:44mm; margin-top:14mm; }
  .cover-fields { width:100%; margin-top:16mm; text-align:left; font-size:14pt; }
  .cover-fields .field { display:flex; align-items:flex-end; gap:4mm; margin-top:9mm; }
  .cover-fields .lbl { width:34mm; font-weight:700; }
  .cover-fields .line { flex:1; border-bottom:0.5mm solid #94A3B8; height:9mm; }
  .cover-foot { position:absolute; bottom:12mm; left:0; right:0; text-align:center;
                font-size:10pt; color:#64748B; }

  /* ---------- word pages ---------- */
  .head { display:flex; justify-content:space-between; align-items:center;
          border-bottom:0.8mm solid {{ blue }}; padding-bottom:3mm; }
  .head .mock { font-size:11pt; color:#64748B; }
  .section-pill { display:inline-block; background:{{ blue }}; color:#fff;
                  font-size:12pt; font-weight:700; padding:1.5mm 6mm;
                  border-radius:5mm; }
  .section-pill.practice { background:#94A3B8; }
  .words { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; }
  .word-row { display:flex; align-items:center; min-height:52mm; }
  .alien-box { width:34mm; height:34mm; flex-shrink:0; margin-right:14mm; }
  .alien-box svg { width:100%; height:100%; }
  .alien-spacer { width:34mm; flex-shrink:0; margin-right:14mm; }
  .the-word { font-size:52pt; letter-spacing:1.5px; }
  .pagenum { position:absolute; bottom:9mm; right:18mm; font-size:10pt; color:#94A3B8; }

  .practice-note { font-size:12.5pt; color:#475569; margin-top:3mm; }
</style></head><body>

<!-- ============ COVER ============ -->
<div class="page cover">
  <div class="cover-band">
    <div class="cover-kicker">Phonics Screening Check</div>
    <div class="cover-title">Practice Check {{ mock_id }}</div>
    <div class="cover-sub">Pupil booklet &middot; 40 words</div>
  </div>
  <div class="cover-alien">{{ cover_alien }}</div>
  <div class="cover-fields">
    <div class="field"><span class="lbl">Name</span><span class="line"></span></div>
    <div class="field"><span class="lbl">Class</span><span class="line"></span></div>
    <div class="field"><span class="lbl">Date</span><span class="line"></span></div>
  </div>
  <div class="cover-foot">MyPhonicsBooks &middot; myphonicsbooks.co.uk &middot; Level 5 &mdash; New Spellings</div>
</div>

<!-- ============ PRACTICE PAGE ============ -->
<div class="page">
  <div class="head">
    <span class="section-pill practice">Practice words</span>
    <span class="mock">Practice Check {{ mock_id }}</span>
  </div>
  <div class="practice-note">These words do not count. Alien words have an alien picture next to them.</div>
  <div class="words">
    {% for r in practice %}
    <div class="word-row">
      {% if r.alien %}<div class="alien-box">{{ r.alien }}</div>
      {% else %}<div class="alien-spacer"></div>{% endif %}
      <div class="the-word">{{ r.word }}</div>
    </div>
    {% endfor %}
  </div>
</div>

<!-- ============ WORD PAGES ============ -->
{% for p in pages %}
<div class="page">
  <div class="head">
    <span class="section-pill">Section {{ p.section }}</span>
    <span class="mock">Practice Check {{ mock_id }}</span>
  </div>
  <div class="words">
    {% for r in p.rows %}
    <div class="word-row">
      {% if r.alien %}<div class="alien-box">{{ r.alien }}</div>
      {% else %}<div class="alien-spacer"></div>{% endif %}
      <div class="the-word">{{ r.word }}</div>
    </div>
    {% endfor %}
  </div>
  <div class="pagenum">{{ loop.index }}</div>
</div>
{% endfor %}
</body></html>
"""

TEACHER_TEMPLATE = """<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  @font-face { font-family:'Andika'; src:url('{{ font_regular }}'); font-weight:400; }
  @font-face { font-family:'Andika'; src:url('{{ font_bold }}'); font-weight:700; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Andika', sans-serif; color:#1a1a1a; font-size:10.5pt; }
  .page { width:210mm; height:297mm; padding:14mm 16mm; page-break-after:always;
          position:relative; background:#fff; }
  h1 { font-size:19pt; color:{{ blue_dark }}; }
  h2 { font-size:13pt; color:{{ blue_dark }}; margin:5mm 0 2mm; }
  p  { margin:2mm 0; line-height:1.45; }
  .band { background:{{ blue }}; color:#fff; border-radius:4mm; padding:6mm 7mm;
          margin-bottom:6mm; }
  .band .kicker { font-size:10pt; text-transform:uppercase; letter-spacing:1.2px; opacity:.9; }
  .band h1 { color:#fff; margin-top:1mm; }
  .box { background:{{ blue_pale }}; border-left:1.2mm solid {{ blue }};
         border-radius:2mm; padding:3.5mm 5mm; margin:3mm 0; }
  .say { background:#F8FAFC; border:0.35mm solid #CBD5E1; border-radius:2mm;
         padding:3mm 4.5mm; margin:2.5mm 0; font-style:italic; }
  .say strong { font-style:normal; }
  ul { margin:2mm 0 2mm 6mm; line-height:1.5; }
  .foot { position:absolute; bottom:9mm; left:16mm; right:16mm; display:flex;
          justify-content:space-between; font-size:8.5pt; color:#94A3B8; }

  /* score sheet — two columns of 20 words so all 40 fit on one page */
  .cols { display:flex; gap:4mm; margin-top:2mm; }
  .col { flex:1; }
  table { width:100%; border-collapse:collapse; }
  th { background:{{ blue }}; color:#fff; font-size:7.6pt; padding:1.1mm 1.6mm;
       text-align:left; }
  td { border-bottom:0.25mm solid #E2E8F0; padding:0.9mm 1.6mm; font-size:7.6pt;
       vertical-align:middle; line-height:1.25; }
  tr.sect td { background:{{ blue_pale }}; font-weight:700; color:{{ blue_dark }};
               font-size:8pt; padding:1.2mm 1.6mm; }
  .w { font-weight:700; font-size:9.5pt; }
  .pseudo-tag { display:inline-block; background:#EDE9FE; color:#6D28D9;
                font-size:6.6pt; font-weight:700; border-radius:2mm; padding:0 1.5mm; }
  .real-tag { display:inline-block; background:#DCFCE7; color:#15803D;
              font-size:6.6pt; font-weight:700; border-radius:2mm; padding:0 1.5mm; }
  .tick { width:5mm; height:5mm; border:0.4mm solid #94A3B8; border-radius:1.2mm;
          display:inline-block; }
  .gpc { font-weight:700; color:{{ blue_dark }}; }
  .note { color:#475569; }
  .score-band { display:flex; gap:5mm; margin-top:3.5mm; }
  .score-cell { flex:1; background:{{ blue_pale }}; border-radius:2.5mm;
                padding:2.5mm 4mm; font-size:9.5pt; }
  .score-cell b { font-size:13pt; color:{{ blue_dark }}; }
</style></head><body>

<!-- ============ PAGE 1: OVERVIEW ============ -->
<div class="page">
  <div class="band">
    <div class="kicker">Teacher pack &middot; Phonics Screening Check practice</div>
    <h1>Practice Check {{ mock_id }} &mdash; Administration Guide</h1>
  </div>

  <h2>What this is</h2>
  <p>A full 40-word practice check in the format of the statutory Phonics Screening
     Check taken at the end of Year 1. It sits at <strong>Level 5 &mdash; New Spellings</strong>
     of the MyPhonicsBooks scheme: every real word is decodable within the code taught
     by the end of Level 5, plus the five read-only check graphemes
     (<strong>er, ur, ow</strong> as in cow, <strong>ear, ure</strong>) covered in the
     Year 1 Spring 2 revision half-term.</p>

  <h2>Structure</h2>
  <ul>
    <li><strong>40 words:</strong> 20 alien (pseudo) words and 20 real words.</li>
    <li><strong>Section 1 (words 1&ndash;12):</strong> simpler structures &mdash; single-letter
        sounds, consonant digraphs (sh, ch, th, ng, nk, qu, ck), CVC/CVCC/CCVC words.</li>
    <li><strong>Section 2 (words 13&ndash;40):</strong> more complex &mdash; split digraphs
        (a-e, i-e, o-e, u-e), alternative vowel spellings, adjacent consonants and
        two-syllable words.</li>
    <li>Within each section the alien words come first, exactly as in the real check.
        Every alien word has an alien picture beside it.</li>
  </ul>

  <h2>Before you start</h2>
  <ul>
    <li>Work one-to-one in a quiet space. The check is <strong>not timed</strong>;
        most children finish in 4&ndash;9 minutes.</li>
    <li>Have the pupil booklet in front of the child and this pack&rsquo;s score
        sheet in front of you.</li>
    <li>You may pause between pages, encourage generally (&ldquo;you&rsquo;re working
        hard&rdquo;) and re-settle the child, but you must not comment on whether
        individual answers are right or wrong.</li>
  </ul>

  <div class="box">
    <strong>Scoring at a glance.</strong> One mark per word read correctly &mdash; any
    phonically plausible pronunciation of an alien word is acceptable (see the notes
    column on the score sheet). The historical threshold has been
    <strong>32 out of 40</strong>; treat it as a guide to check-readiness, not a pass/fail
    judgement. Analyse <em>which</em> graphemes were missed and feed them into keep-up teaching.
  </div>

  <div class="foot"><span>MyPhonicsBooks &middot; Practice Check {{ mock_id }}</span>
    <span>Level 5 &middot; page 1 of 3</span></div>
</div>

<!-- ============ PAGE 2: SCRIPT ============ -->
<div class="page">
  <h1>Administration script</h1>
  <p>Read the wording in the boxes verbatim. Do not sound out any word for the child,
     and do not tell the child whether an answer is correct.</p>

  <h2>1 &middot; Introducing the check</h2>
  <div class="say">&ldquo;In this activity, I am going to ask you to read some words
     aloud. You may have seen some of the words before, and others will be new to you.
     You should try to read each word, but don&rsquo;t worry if you can&rsquo;t. If it
     helps, you may sound out the letters before saying the word. Some of the words are
     real words, and some are alien words. The alien words have a picture of an alien
     next to them.&rdquo;</div>

  <h2>2 &middot; Practice words</h2>
  <div class="say">&ldquo;Let&rsquo;s try some practice words first. This word is an
     alien word &mdash; can you see the alien? Have a go at reading it.&rdquo;</div>
  <p>Work through all four practice words. You may help, prompt and demonstrate with the
     practice words only. When the child is settled:</p>
  <div class="say">&ldquo;Now we are going to read the rest of the words in the booklet.
     I can&rsquo;t help you with these ones, but I want you to try your best. Are you
     ready?&rdquo;</div>

  <h2>3 &middot; During the check</h2>
  <ul>
    <li>Turn the pages for the child, keeping a comfortable pace.</li>
    <li>If the child hesitates for around ten seconds, say:
        <span class="say" style="display:inline-block; margin:0;">&ldquo;Can you try the
        next one?&rdquo;</span></li>
    <li>If the child misreads a word and then self-corrects, award the mark &mdash; the
        <strong>final</strong> attempt counts. You may say:
        <span class="say" style="display:inline-block; margin:0;">&ldquo;Would you like
        to have another go?&rdquo;</span> once per word if the child seems unsettled.</li>
    <li>Do <strong>not</strong> sound out words, mouth the sounds, or repeat the word after
        the child.</li>
    <li>If the child sounds out a word but does not blend it aloud, say:
        <span class="say" style="display:inline-block; margin:0;">&ldquo;Can you say the
        whole word?&rdquo;</span></li>
    <li>Stop the check if the child becomes distressed; it can be finished later the
        same day.</li>
  </ul>

  <h2>4 &middot; Ending the check</h2>
  <div class="say">&ldquo;Well done, you have finished. Thank you for trying so hard with
     your reading.&rdquo;</div>

  <div class="foot"><span>MyPhonicsBooks &middot; Practice Check {{ mock_id }}</span>
    <span>Level 5 &middot; page 2 of 3</span></div>
</div>

<!-- ============ PAGE 3: ANSWER / SCORE SHEET ============ -->
<div class="page">
  <h1>Answer and score sheet &mdash; Practice Check {{ mock_id }}</h1>
  <p style="font-size:8.6pt;">Tick each word read correctly. For alien words, accept any
     phonically plausible pronunciation &mdash; the notes give the expected sounding and
     acceptable alternatives where a grapheme has more than one common sound.</p>

  <div class="cols">
    {% for half in [rows[:20], rows[20:]] %}
    <div class="col"><table>
      <tr><th style="width:5mm;">#</th><th style="width:15mm;">Word</th>
          <th style="width:10mm;">Type</th><th>Target GPC &amp; notes</th>
          <th style="width:7mm;">&#10003;</th></tr>
      {% for r in half %}
      {% if r.n == 1 %}<tr class="sect"><td colspan="5">Section 1 &mdash; words 1&ndash;12</td></tr>{% endif %}
      {% if r.n == 13 %}<tr class="sect"><td colspan="5">Section 2 &mdash; words 13&ndash;40</td></tr>{% endif %}
      <tr><td>{{ r.n }}</td><td class="w">{{ r.word }}</td>
          <td>{% if r.kind == 'pseudo' %}<span class="pseudo-tag">ALIEN</span>{% else %}<span class="real-tag">REAL</span>{% endif %}</td>
          <td><span class="gpc">{{ r.gpc }}</span>{% if r.note %} &middot; <span class="note">{{ r.note }}</span>{% endif %}</td>
          <td><span class="tick"></span></td></tr>
      {% endfor %}
    </table></div>
    {% endfor %}
  </div>

  <div class="score-band">
    <div class="score-cell">Section 1 score<br><b>&nbsp;&nbsp;/ 12</b></div>
    <div class="score-cell">Section 2 score<br><b>&nbsp;&nbsp;/ 28</b></div>
    <div class="score-cell">Total<br><b>&nbsp;&nbsp;/ 40</b></div>
    <div class="score-cell" style="flex:2;">Guide: the threshold has historically been
      <b style="font-size:10.5pt;">32 / 40</b>.<br>Below 32? Log the missed graphemes and
      target them in keep-up sessions.</div>
  </div>

  <div class="foot"><span>MyPhonicsBooks &middot; Practice Check {{ mock_id }}</span>
    <span>Level 5 &middot; page 3 of 3</span></div>
</div>
</body></html>
"""


# ---------------------------------------------------------------------------
# RENDER
# ---------------------------------------------------------------------------

async def print_pdfs(jobs: list[tuple[Path, Path]]) -> None:
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        for html, pdf in jobs:
            await page.goto(html.as_uri(), wait_until="networkidle")
            await asyncio.sleep(0.8)   # let the embedded font settle
            await page.pdf(path=str(pdf), width="210mm", height="297mm",
                           print_background=True,
                           margin={"top": "0", "bottom": "0", "left": "0", "right": "0"})
        await browser.close()


def main() -> None:
    env = Environment(loader=BaseLoader(), autoescape=False)
    common = dict(
        font_regular=(FONTS / "Andika-Regular.ttf").as_uri(),
        font_bold=(FONTS / "Andika-Bold.ttf").as_uri(),
        blue=L5_BLUE, blue_dark=L5_BLUE_DARK, blue_pale=L5_BLUE_PALE,
    )

    # sanity: word counts + no overlap between mocks
    all_words: dict[str, list[str]] = {}
    for mid, mock in MOCKS.items():
        rows = build_rows(mock)
        assert len(rows) == 40, f"Mock {mid}: {len(rows)} scored words"
        assert sum(r["kind"] == "pseudo" for r in rows) == 20
        assert sum(r["section"] == 1 for r in rows) == 12
        all_words[mid] = [r["word"] for r in rows]
        assert len(set(all_words[mid])) == 40, f"Mock {mid}: duplicate word"
    overlap = set(all_words["A"]) & set(all_words["B"])
    assert not overlap, f"Word overlap between mocks: {overlap}"

    jobs: list[tuple[Path, Path]] = []
    for mid, mock in MOCKS.items():
        rows = build_rows(mock)
        practice = build_practice(mock)
        pages = paginate(rows)

        pupil_html = env.from_string(PUPIL_TEMPLATE).render(
            mock_id=mid, practice=practice, pages=pages,
            cover_alien=alien_svg(0 if mid == "A" else 1), **common)
        teacher_html = env.from_string(TEACHER_TEMPLATE).render(
            mock_id=mid, rows=rows, **common)

        ph = BUILD_DIR / f"pupil_{mid}.html"
        th = BUILD_DIR / f"teacher_{mid}.html"
        ph.write_text(pupil_html, encoding="utf-8")
        th.write_text(teacher_html, encoding="utf-8")
        jobs.append((ph, OUT_DIR / f"PSC_Mock_{mid}_pupil.pdf"))
        jobs.append((th, OUT_DIR / f"PSC_Mock_{mid}_teacher.pdf"))

    print("Printing PDFs with Chromium...")
    asyncio.run(print_pdfs(jobs))

    for _, pdf in jobs:
        print(f"  {pdf}  ({pdf.stat().st_size/1024:.0f} KB)")
    print("Done.")


if __name__ == "__main__":
    main()
