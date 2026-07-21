"""Teacher's Guides — one printable A4 booklet per level (L1-L8).

School-scheme blocker #1 (teacher guides). Each guide walks a class teacher
through a single level: what it teaches, the weekly rhythm, a teaching spread
for every GPC (sample words + two dictation sentences + the errors to expect),
and an assessment page that ties into the half-termly progress checks, the
Quick Level Check and the keep-up 1:1 routine. L5 gains a Phonics Screening
Check preparation page.

Content is driven entirely by data/teacher_guides.json (level membership,
GPCs, tricky words, exit criteria verbatim from CURRICULUM_LEDGER.md v2.1;
weekly rhythm text from SCHOOL_SCHEME_RECEPTION_TO_Y2.md v1.1). Cross-links to
the sibling print products (progress checks, keep-up kit, PSC mock) are pulled
live from generate_progress_checks.CHECKPOINTS so the guide never drifts.

Every word in the word lists and dictation sentences is decodable at the level
or a taught tricky word — verified by grapheme segmentation (audit_decodability).

Design family: mirrors marketing/paper-assessment + generate_progress_checks —
level-colour band, Outfit/Plus Jakarta chrome, bundled Andika for every
child-facing grapheme and word. NOT Read Write Inc terminology.

Run:  py -3.12 scripts/generate_teacher_guides.py
Deps: jinja2, playwright (chromium).
Out:  output/teacher_guides/L{n}_Teachers_Guide.pdf  (8 files)
"""
from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

from jinja2 import DictLoader, Environment, select_autoescape
from playwright.async_api import async_playwright

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
sys.path.insert(0, str(HERE))

from generate_progress_checks import CHECKPOINTS  # noqa: E402  (per-level half-termly checks)

FONTS = REPO / "assets" / "fonts"
DATA = REPO / "data" / "teacher_guides.json"
OUT_DIR = REPO / "output" / "teacher_guides"
BUILD_DIR = OUT_DIR / "_build"
for d in (OUT_DIR, BUILD_DIR):
    d.mkdir(parents=True, exist_ok=True)


def darken(hex_colour: str, factor: float = 0.60) -> str:
    """Ink variant of a level colour, for headings on white."""
    h = hex_colour.lstrip("#")
    r, g, b = (int(h[i : i + 2], 16) for i in (0, 2, 4))
    return "#{:02x}{:02x}{:02x}".format(*(round(c * factor) for c in (r, g, b)))


# ------------------------------------------------------- cross-product links
def checks_for_level(level: int) -> list[dict]:
    """Half-termly progress-check sheets that fall inside this level."""
    out = []
    for c in CHECKPOINTS:
        if c["level"] == level:
            out.append({
                "code": c["code"],
                "term": c["term"].replace(" · ", " "),
                "focus": c["focus"],
                "file": f"{c['code']}_check_{c['slug']}.pdf",
            })
    return out


# ------------------------------------------------------------- the template
GUIDE_TEMPLATE = """<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="UTF-8">
<title>Level {{ L.level }} Teacher's Guide — {{ L.name }}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  @font-face { font-family:'Andika'; src:url('{{ font_regular }}') format('truetype'); font-weight:400; }
  @font-face { font-family:'Andika'; src:url('{{ font_bold }}') format('truetype'); font-weight:700; }
  :root {
    --level:{{ L.colour }}; --ink:{{ L.ink }};
    --text:#1f2937; --muted:#6b7280; --line:#e5e7eb; --soft:#f8fafc;
    --safe:15mm;
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { font-family:"Plus Jakarta Sans",sans-serif; color:var(--text);
    -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  @page { size:210mm 297mm; margin:0; }
  .page { width:210mm; height:297mm; position:relative; background:#fff;
    overflow:hidden; display:flex; flex-direction:column; page-break-after:always; }
  .page:last-child { page-break-after:auto; }
  h1,h2,h3,h4 { font-family:"Outfit",sans-serif; }
  .kid { font-family:"Andika",sans-serif; }

  /* running header on interior pages */
  .rh { display:flex; align-items:center; justify-content:space-between;
    padding:8mm var(--safe) 0 var(--safe); }
  .rh .tag { display:flex; align-items:center; gap:3mm; font-family:"Outfit";
    font-weight:800; font-size:9pt; color:var(--ink); }
  .rh .dot { width:6mm; height:6mm; border-radius:50%; background:var(--level); }
  .rh .pg { font-size:8.5pt; color:var(--muted); font-weight:600; }
  .body { flex:1; padding:5mm var(--safe) 10mm var(--safe); display:flex; flex-direction:column; }
  .ptitle { font-size:19pt; font-weight:900; color:var(--ink); letter-spacing:-.3pt; margin-bottom:1mm; }
  .plead { font-size:9.5pt; color:var(--muted); line-height:1.4; margin-bottom:4mm; max-width:150mm; }

  /* ---------- COVER ---------- */
  .cover { background:var(--level); color:#fff; }
  .cover .top { padding:26mm var(--safe) 0 var(--safe); flex:1; display:flex; flex-direction:column; }
  .cover .brand { font-family:"Outfit"; font-weight:700; font-size:11pt; opacity:.9; letter-spacing:.3pt; }
  .cover .kicker { font-family:"Outfit"; font-weight:800; font-size:12pt; opacity:.92;
    margin-top:20mm; text-transform:uppercase; letter-spacing:2pt; }
  .cover h1 { font-size:52pt; font-weight:900; line-height:1; margin-top:3mm; letter-spacing:-1pt; }
  .cover .lname { font-size:26pt; font-weight:800; margin-top:2mm; opacity:.96; }
  .cover .meta { margin-top:auto; padding:0 0 4mm 0; display:flex; gap:6mm; flex-wrap:wrap; }
  .cover .mcard { background:rgba(255,255,255,.16); border:1.4pt solid rgba(255,255,255,.55);
    border-radius:4mm; padding:4mm 6mm; min-width:44mm; }
  .cover .mcard .k { font-family:"Outfit"; font-size:7.5pt; font-weight:800; letter-spacing:1.2pt;
    text-transform:uppercase; opacity:.85; }
  .cover .mcard .v { font-family:"Outfit"; font-size:14pt; font-weight:800; margin-top:1mm; }
  .cover .foot { background:rgba(0,0,0,.10); padding:6mm var(--safe);
    display:flex; justify-content:space-between; align-items:center; font-size:9pt; }
  .cover .foot .r { font-family:"Outfit"; font-weight:800; text-align:right; }
  .cover .foot .r small { display:block; font-family:"Plus Jakarta Sans"; font-weight:500; opacity:.85; font-size:7.6pt; }
  .cover .sounds { margin-top:8mm; display:flex; flex-wrap:wrap; gap:2.4mm; }
  .cover .sounds .g { font-family:"Andika"; font-weight:700; font-size:13pt; background:rgba(255,255,255,.2);
    border-radius:2mm; padding:1.4mm 3mm; }

  /* ---------- generic cards ---------- */
  .card { border:1.2pt solid var(--line); border-radius:3mm; overflow:hidden; margin-bottom:4mm; }
  .card-h { background:color-mix(in srgb, var(--level) 9%, #fff); padding:2.6mm 4mm;
    border-bottom:1pt solid color-mix(in srgb, var(--level) 20%, #fff);
    display:flex; align-items:center; gap:3mm; }
  .card-h h3 { font-size:11.5pt; font-weight:800; color:var(--ink); }
  .card-h .tag { margin-left:auto; font-family:"Outfit"; font-size:6.8pt; font-weight:800;
    letter-spacing:.6pt; text-transform:uppercase; color:var(--level);
    border:1pt solid var(--level); border-radius:3mm; padding:.4mm 2.2mm; }
  .card-b { padding:3.4mm 4mm; }

  .gpc-grid { display:flex; flex-wrap:wrap; gap:2.6mm; }
  .gpc-grid .g { font-family:"Andika"; font-weight:700; font-size:17pt; border:1.2pt solid var(--line);
    border-radius:2.4mm; background:#fff; min-width:14mm; text-align:center; padding:2mm 3mm;
    display:inline-flex; align-items:center; justify-content:center; }
  .tw-grid { display:flex; flex-wrap:wrap; gap:2.4mm; }
  .tw-grid .w { font-family:"Andika"; font-weight:700; font-size:13pt; border:1.2pt dashed
    color-mix(in srgb, var(--level) 55%, #cbd5e1); border-radius:2.2mm; background:var(--soft);
    padding:1.4mm 3mm; }
  .note { font-size:8.6pt; color:var(--muted); line-height:1.4; margin-top:2.6mm; }

  ul.exit { list-style:none; }
  ul.exit li { position:relative; padding:1.8mm 0 1.8mm 8mm; font-size:10pt; line-height:1.35;
    border-bottom:1pt solid var(--line); }
  ul.exit li:last-child { border-bottom:none; }
  ul.exit li::before { content:"✓"; position:absolute; left:0; top:1.8mm;
    font-family:"Outfit"; font-weight:900; color:var(--level); font-size:11pt; }

  /* term map */
  table.tm { width:100%; border-collapse:collapse; }
  table.tm th, table.tm td { border:1pt solid var(--line); padding:2.4mm 3mm; text-align:left;
    vertical-align:top; font-size:8.8pt; line-height:1.35; }
  table.tm th { background:color-mix(in srgb, var(--level) 10%, #fff); color:var(--ink);
    font-family:"Outfit"; font-weight:800; font-size:8.4pt; }
  table.tm td.code { font-family:"Outfit"; font-weight:800; color:var(--level); white-space:nowrap; }
  table.tm .kid { font-family:"Andika"; font-weight:700; }

  /* weekly rhythm */
  .rhythm-row { display:flex; gap:3mm; margin-bottom:2.6mm; align-items:stretch; }
  .rhythm-row .day { flex:0 0 20mm; background:var(--level); color:#fff; border-radius:2.4mm;
    display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2mm; text-align:center; }
  .rhythm-row .day .n { font-family:"Outfit"; font-weight:900; font-size:16pt; line-height:1; }
  .rhythm-row .day .l { font-family:"Outfit"; font-weight:700; font-size:6.6pt; letter-spacing:.5pt;
    text-transform:uppercase; margin-top:1mm; opacity:.9; }
  .rhythm-row .rc { flex:1; border:1.2pt solid var(--line); border-radius:2.4mm; padding:2.6mm 3.4mm; }
  .rhythm-row .rc h4 { font-size:10.5pt; font-weight:800; color:var(--ink); }
  .rhythm-row .rc p { font-size:8.6pt; color:var(--text); line-height:1.35; margin-top:.8mm; }
  .rhythm-row .rc .res { font-size:7.8pt; color:var(--muted); margin-top:1mm; }
  .callout { border-left:3pt solid var(--level); background:var(--soft); border-radius:0 2.4mm 2.4mm 0;
    padding:2.8mm 4mm; font-size:9pt; line-height:1.4; margin-bottom:3mm; }
  .callout b { color:var(--ink); font-family:"Outfit"; }

  /* GPC teaching card */
  .gpc { border:1.4pt solid var(--line); border-radius:3.2mm; overflow:hidden; margin-bottom:5mm; display:flex; }
  .gpc .left { flex:0 0 40mm; background:color-mix(in srgb, var(--level) 12%, #fff);
    border-right:1.2pt solid color-mix(in srgb, var(--level) 22%, #fff);
    display:flex; flex-direction:column; align-items:center; justify-content:center; padding:5mm 3mm; text-align:center; }
  .gpc .left .grapheme { font-family:"Andika"; font-weight:700; font-size:34pt; color:var(--ink); line-height:1; }
  .gpc .left .lab { font-size:8pt; color:var(--muted); margin-top:2mm; line-height:1.3; }
  .gpc .right { flex:1; padding:3.6mm 4.4mm; }
  .gpc .sect { font-family:"Outfit"; font-weight:800; font-size:7.4pt; letter-spacing:.7pt;
    text-transform:uppercase; color:var(--level); margin-bottom:1.4mm; }
  .gpc .words { display:flex; flex-wrap:wrap; gap:2mm; margin-bottom:3mm; }
  .gpc .words .w { font-family:"Andika"; font-weight:700; font-size:12.5pt; border:1pt solid var(--line);
    border-radius:2mm; padding:1mm 2.6mm; background:#fff; }
  .gpc .dict { display:flex; flex-direction:column; gap:1.4mm; margin-bottom:3mm; }
  .gpc .dict .d { font-family:"Andika"; font-weight:700; font-size:11pt; color:var(--text);
    padding-left:6mm; position:relative; }
  .gpc .dict .d::before { content:"“"; position:absolute; left:0; top:-1mm; font-size:15pt; color:var(--level); }
  .gpc .err { background:var(--soft); border-radius:2.2mm; padding:2.4mm 3.2mm; font-size:8.6pt;
    line-height:1.4; color:var(--text); }
  .gpc .err b { font-family:"Outfit"; color:var(--ink); }

  /* assessment page */
  .asmt-step { display:flex; gap:3.4mm; margin-bottom:3.2mm; align-items:flex-start; }
  .asmt-step .n { flex:0 0 auto; font-family:"Outfit"; font-weight:900; font-size:11pt; color:#fff;
    background:var(--level); width:8mm; height:8mm; border-radius:50%; display:inline-flex;
    align-items:center; justify-content:center; }
  .asmt-step .t { font-size:9.4pt; line-height:1.4; }
  .asmt-step .t b { font-family:"Outfit"; color:var(--ink); }
  .checklist { border:1.2pt solid var(--line); border-radius:2.6mm; overflow:hidden; }
  .checklist .ci { display:flex; align-items:center; gap:3mm; padding:2.4mm 3.4mm; font-size:8.8pt;
    border-bottom:1pt solid var(--line); }
  .checklist .ci:last-child { border-bottom:none; }
  .checklist .ci .code { font-family:"Outfit"; font-weight:800; color:var(--level); flex:0 0 16mm; }
  .checklist .ci .term { flex:0 0 40mm; color:var(--muted); font-weight:600; }
  .checklist .ci .foc { flex:1; }
  .footer { margin-top:auto; display:flex; justify-content:space-between; align-items:center;
    padding-top:4mm; border-top:1.2pt solid var(--line); font-size:7.8pt; color:var(--muted); }
  .footer b { font-family:"Outfit"; color:var(--ink); }
</style>
</head>
<body>

<!-- ============ PAGE 1 · COVER ============ -->
<div class="page cover">
  <div class="top">
    <div class="brand">MyPhonicsBooks · School Scheme</div>
    <div class="kicker">Teacher's Guide</div>
    <h1>Level {{ L.level }}</h1>
    <div class="lname">{{ L.name }}</div>
    <div class="sounds">
      {% for g in L.gpcs_display %}<span class="g kid">{{ g }}</span>{% endfor %}
    </div>
    <div class="meta">
      <div class="mcard"><div class="k">Year group</div><div class="v">{{ L.year_group }}</div></div>
      <div class="mcard"><div class="k">Half-terms</div><div class="v">{{ L.half_terms }}</div></div>
      <div class="mcard"><div class="k">Phase</div><div class="v">{{ L.phase }}</div></div>
    </div>
  </div>
  <div class="foot">
    <div>A complete teaching companion for Level {{ L.level }} · {{ L.age }}</div>
    <div class="r">myphonicsbooks.co.uk<small>Built by a British primary teacher, QTS.</small></div>
  </div>
</div>

<!-- ============ PAGE 2 · WHAT THIS LEVEL TEACHES ============ -->
<div class="page">
  <div class="rh"><div class="tag"><span class="dot"></span>Level {{ L.level }} · {{ L.name }}</div><div class="pg">What this level teaches</div></div>
  <div class="body">
    <div class="ptitle">What Level {{ L.level }} teaches</div>
    <div class="plead">{{ L.phase }} · {{ L.year_group }} · {{ L.half_terms }}. Everything in this guide uses only the code below, plus the tricky words listed. Nothing a child cannot yet decode appears in the word lists or dictation.</div>

    <div class="card">
      <div class="card-h"><h3>New sounds (GPCs)</h3><span class="tag">{{ L.gpcs_display|length }} this level</span></div>
      <div class="card-b">
        <div class="gpc-grid">{% for g in L.gpcs_display %}<span class="g">{{ g }}</span>{% endfor %}</div>
        {% if L.gpcs_note %}<div class="note">{{ L.gpcs_note }}</div>{% endif %}
      </div>
    </div>

    <div class="card">
      <div class="card-h"><h3>{{ L.tricky_label or "New tricky words" }}</h3><span class="tag">read on sight</span></div>
      <div class="card-b">
        <div class="tw-grid">{% for w in L.tricky_new %}<span class="w">{{ w }}</span>{% endfor %}</div>
        <div class="note">These cannot yet be fully sounded out — teach them as instant sight words and keep them on the working wall. All earlier tricky words remain under review.</div>
      </div>
    </div>

    <div class="card">
      <div class="card-h"><h3>Term-by-term map</h3></div>
      <div class="card-b" style="padding:0;">
        <table class="tm">
          <tr><th style="width:24mm;">Half-term</th><th style="width:16mm;">Unit</th><th>Teach</th><th style="width:44mm;">Secure by the end</th></tr>
          {% for t in L.term_map %}
          <tr><td>{{ t.term }}</td><td class="code">{{ t.code }}</td><td>{{ t.teach }}</td><td>{{ t.secure }}</td></tr>
          {% endfor %}
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-h"><h3>Exit criteria — before moving on</h3><span class="tag">Curriculum Ledger</span></div>
      <div class="card-b">
        <ul class="exit">{% for e in L.exit_criteria %}<li>{{ e }}</li>{% endfor %}</ul>
      </div>
    </div>
    <div class="footer"><span><b>Level {{ L.level }} · {{ L.name }}</b> — Teacher's Guide</span><span>myphonicsbooks.co.uk</span></div>
  </div>
</div>

<!-- ============ PAGE 3 · WEEKLY RHYTHM ============ -->
<div class="page">
  <div class="rh"><div class="tag"><span class="dot"></span>Level {{ L.level }} · {{ L.name }}</div><div class="pg">The weekly rhythm</div></div>
  <div class="body">
    <div class="ptitle">The weekly rhythm</div>
    <div class="plead">Five short sessions, the same shape every week so children always know what is coming. <b>Every session opens with a 2–3 minute speed review</b> of all taught sound cards (whole-class chorus) before the day's activity, and Days 1–3 each end with a two-minute "write it" moment on whiteboards.</div>

    {% if L.rhythm == "condensed" %}
    <div class="callout"><b>Two condensed cycles a week at this level.</b> The code is still arriving fast (about two new sounds a week), so the week carries two short cycles rather than one full five-day cycle — matching the pace of the term map above.</div>
    <div class="rhythm-row"><div class="day"><span class="n">1–2</span><span class="l">Sound A</span></div><div class="rc"><h4>Meet &amp; blend — Sound A</h4><p>Day 1 meet the first new sound (see it, say it, form it); Day 2 blend words from it and review.</p><p class="res">Sound Book · main sound card · workbook formation page · word cards · alien words</p></div></div>
    <div class="rhythm-row"><div class="day"><span class="n">3–4</span><span class="l">Sound B</span></div><div class="rc"><h4>Meet &amp; blend — Sound B</h4><p>Day 3 meet the second new sound; Day 4 blend words from it and review. Each of Days 1–3 ends with a two-minute whiteboard "write it".</p><p class="res">Sound Book · main sound card · workbook formation page · word cards</p></div></div>
    <div class="rhythm-row"><div class="day"><span class="n">5</span><span class="l">Prove</span></div><div class="rc"><h4>Read &amp; prove — both sounds</h4><p>Read and prove both new sounds together: the matched decodable, oral retell, review games and the Quick Check page.</p><p class="res">Decodable storybook · Quick Check page · online games</p></div></div>
    {% else %}
    <div class="callout"><b>The full five-day, single-sound cycle.</b> From Level 3 onwards the code matures more slowly, so each new sound gets its own week. The same decodable storybook is read three times across Days 3–5 — decode, then fluency, then retell — before it goes home for the home-reading loop through the parent app.</div>
    <div class="rhythm-row"><div class="day"><span class="n">1</span><span class="l">Meet</span></div><div class="rc"><h4>Meet the sound</h4><p>See it, say it, form it. Introduce the new sound with its real-photo Sound Book and card, and practise letter formation.</p><p class="res">Sound Book · main sound card · workbook formation page</p></div></div>
    <div class="rhythm-row"><div class="day"><span class="n">2</span><span class="l">Blend</span></div><div class="rc"><h4>Blend it</h4><p>Read words built from the new sound plus review. Ends with a two-minute whiteboard "write it".</p><p class="res">Blending Book page · word cards{% if L.level <= 5 %} · alien words{% endif %}</p></div></div>
    <div class="rhythm-row"><div class="day"><span class="n">3</span><span class="l">Read</span></div><div class="rc"><h4>Read it — first read</h4><p>First read of the matched decodable storybook: decoding for accuracy. Ends with a whiteboard "write it".</p><p class="res">Decodable storybook (1st read) · tricky-word cards</p></div></div>
    <div class="rhythm-row"><div class="day"><span class="n">4</span><span class="l">Write</span></div><div class="rc"><h4>Write it — second read</h4><p>Re-read the storybook for fluency, then "Say it. Tap it. Write it. Check it." dictation.</p><p class="res">Decodable storybook (2nd read) · workbook dictation + spelling page</p></div></div>
    <div class="rhythm-row"><div class="day"><span class="n">5</span><span class="l">Prove</span></div><div class="rc"><h4>Prove it — third read</h4><p>Third read plus oral retell, review, games and the shifty slot. The book goes home.</p><p class="res">Decodable storybook (3rd read) · Quick Check page · online games{% if L.level >= 4 %} · shifty sound card{% endif %}</p></div></div>
    {% endif %}

    <div class="callout" style="margin-top:2mm;"><b>Keep-up, not catch-up.</b> Any child not secure on Day 5 gets the 10-minute daily 1:1 routine (picture-word cards + single-sound sheet) before the next sound, so the gap never compounds. The routine is set out on the assessment page.</div>
    <div class="footer"><span><b>Level {{ L.level }} · {{ L.name }}</b> — Teacher's Guide</span><span>Weekly rhythm follows the School Scheme (Reception → Y2)</span></div>
  </div>
</div>

<!-- ============ PER-GPC TEACHING SPREADS ============ -->
{% for pagerows in gpc_pages %}
<div class="page">
  <div class="rh"><div class="tag"><span class="dot"></span>Level {{ L.level }} · {{ L.name }}</div><div class="pg">Teaching the sounds{% if gpc_pages|length > 1 %} · {{ loop.index }}/{{ gpc_pages|length }}{% endif %}</div></div>
  <div class="body">
    {% if loop.first %}<div class="ptitle">Teaching the sounds</div>
    <div class="plead">One spread per sound: a sample of decodable words, two dictation sentences to say aloud for "Say it, tap it, write it, check it", and the errors to expect so you can pre-empt them. Every word here is decodable at this level or a taught tricky word.</div>{% endif %}
    {% for sp in pagerows %}
    <div class="gpc">
      <div class="left">
        <div class="grapheme">{{ sp.display_g or sp.g }}</div>
        <div class="lab">{{ sp.label }}</div>
      </div>
      <div class="right">
        <div class="sect">Sample words</div>
        <div class="words">{% for w in sp.words %}<span class="w">{{ w }}</span>{% endfor %}</div>
        <div class="sect">Dictation — say it, tap it, write it, check it</div>
        <div class="dict">{% for d in sp.dictation %}<div class="d">{{ d }}</div>{% endfor %}</div>
        <div class="err"><b>Errors to expect.</b> {{ sp.errors }}</div>
        {% if sp.note %}<div class="note">{{ sp.note }}</div>{% endif %}
      </div>
    </div>
    {% endfor %}
    <div class="footer"><span><b>Level {{ L.level }} · {{ L.name }}</b> — Teacher's Guide</span><span>myphonicsbooks.co.uk</span></div>
  </div>
</div>
{% endfor %}

{% if L.psc_page %}
<!-- ============ PSC PREP PAGE (L5 only) ============ -->
<div class="page">
  <div class="rh"><div class="tag"><span class="dot"></span>Level {{ L.level }} · {{ L.name }}</div><div class="pg">Phonics Screening Check</div></div>
  <div class="body">
    <div class="ptitle">Preparing for the Phonics Screening Check</div>
    <div class="plead">The statutory Phonics Screening Check falls in the summer term of Year 1, at the very end of Level 5 / start of Level 6. Spring 2 of Level 5 is a whole-code revision half-term with no new sounds — its job is to make every child fluent across the full assessable code, including the five read-only graphemes below.</div>

    <div class="callout"><b>Five read-only graphemes for the check.</b> The Screening Check can present these five spellings, so children must be able to <i>read</i> them even though they are taught for spelling later in the programme. Teach them for reading only during Spring 2:</div>
    <div class="card"><div class="card-b"><div class="gpc-grid">
      <span class="g">er</span><span class="g">ur</span><span class="g">ow<small style="font-size:7pt;display:block;font-family:Plus Jakarta Sans;color:var(--muted)">as in cow</small></span><span class="g">ear</span><span class="g">ure</span>
    </div></div></div>

    <div class="card">
      <div class="card-h"><h3>Spring 2 revision routine</h3></div>
      <div class="card-b">
        <div class="asmt-step"><span class="n">1</span><span class="t"><b>Daily alien-word fluency.</b> A short timed read of made-up (alien) words across the full L1–L5 code plus the five read-only graphemes — the exact format of the check.</span></div>
        <div class="asmt-step"><span class="n">2</span><span class="t"><b>Gap-fill from the tracker.</b> Use the Level 5 class tracker to target the specific sounds each child still misses, in 1:1 or small-group keep-up.</span></div>
        <div class="asmt-step"><span class="n">3</span><span class="t"><b>Real + alien word mix.</b> Practise both, so children apply pure decoding and don't guess from memory.</span></div>
      </div>
    </div>
    <div class="callout"><b>Mock check.</b> Use the two mock papers in <b>output/psc_mock/</b> (Mock A and Mock B, pupil + teacher versions) a few weeks before the real window to identify who needs a final keep-up push. Alien words are retired from teaching after the check, at Level 6.</div>
    <div class="footer"><span><b>Level {{ L.level }} · {{ L.name }}</b> — Teacher's Guide</span><span>PSC = statutory Phonics Screening Check, Year 1 summer</span></div>
  </div>
</div>
{% endif %}

<!-- ============ ASSESSMENT PAGE ============ -->
<div class="page">
  <div class="rh"><div class="tag"><span class="dot"></span>Level {{ L.level }} · {{ L.name }}</div><div class="pg">Assessment &amp; keep-up</div></div>
  <div class="body">
    <div class="ptitle">Assessment &amp; keeping every child on track</div>
    <div class="plead">Assessment is continuous, not a one-off test. Half-termly progress checks catch slips early; the Quick Level Check confirms a child is ready to move on; the keep-up routine closes gaps the same week they appear.</div>

    <div class="card">
      <div class="card-h"><h3>Half-termly progress checks for this level</h3><span class="tag">output/progress_checks/</span></div>
      <div class="card-b" style="padding:0;">
        <div class="checklist">
          {% for c in checks %}
          <div class="ci"><span class="code">{{ c.code }}</span><span class="term">{{ c.term }}</span><span class="foc">{{ c.focus }}</span></div>
          {% endfor %}
        </div>
        <div class="note" style="padding:2.4mm 4mm 3mm 4mm;">Each is a 3–4 minute 1:1 check (sounds · words · {% if L.level <= 5 %}alien words{% else %}challenge words{% endif %} · tricky words). Record every result on the Level {{ L.level }} class tracker and mark S (secure) or D (developing).</div>
      </div>
    </div>

    <div class="card">
      <div class="card-h"><h3>The Quick Level Check — the gate to Level {{ L.next_level }}</h3></div>
      <div class="card-b">
        <div class="note" style="margin-top:0;">Run the Quick Level Check when a child looks secure across the whole level — usually at the end of {{ L.half_terms }}. A child passes, and moves to {% if L.level < 8 %}Level {{ L.next_level }}{% else %}independent reading — the programme is complete{% endif %}, only when every exit criterion is met:</div>
        <ul class="exit" style="margin-top:2mm;">{% for e in L.exit_criteria %}<li>{{ e }}</li>{% endfor %}</ul>
      </div>
    </div>

    <div class="card">
      <div class="card-h"><h3>The 10-minute keep-up 1:1 routine</h3><span class="tag">output/keep_up_kit/</span></div>
      <div class="card-b">
        <div class="asmt-step"><span class="n">1</span><span class="t"><b>Review the missed sounds</b> (2 min) — flash the specific cards the child stumbled on, using picture-word cards.</span></div>
        <div class="asmt-step"><span class="n">2</span><span class="t"><b>Blend to read</b> (3 min) — read words and a couple of alien words built from those sounds, on the single-sound sheet.</span></div>
        <div class="asmt-step"><span class="n">3</span><span class="t"><b>Read a caption</b> (2 min) — a short decodable sentence using the target sound.</span></div>
        <div class="asmt-step"><span class="n">4</span><span class="t"><b>Say it, write it</b> (3 min) — dictate one or two words; the child writes and checks.</span></div>
        <div class="note">Run it daily until the child is secure, then re-check within two weeks. Full scripts and printable cards are in the Keep-Up Kit (output/keep_up_kit/).</div>
      </div>
    </div>
    <div class="footer"><span><b>Level {{ L.level }} · {{ L.name }}</b> — Teacher's Guide · programme by a British primary teacher, QTS</span><span>myphonicsbooks.co.uk</span></div>
  </div>
</div>

</body>
</html>
"""


def build_context(level_data: dict) -> dict:
    L = dict(level_data)
    L["ink"] = darken(L["colour"])
    L["next_level"] = L["level"] + 1 if L["level"] < 8 else 8
    return L


def paginate_gpcs(spreads: list[dict], per_page: int = 2) -> list[list[dict]]:
    return [spreads[i : i + per_page] for i in range(0, len(spreads), per_page)]


async def render_pdfs(jobs: list[tuple[Path, Path]]) -> None:
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        for html, pdf in jobs:
            await page.goto(html.as_uri(), wait_until="networkidle")
            await asyncio.sleep(1.2)  # webfonts settle
            await page.pdf(path=str(pdf), width="210mm", height="297mm",
                           print_background=True,
                           margin={"top": "0", "bottom": "0", "left": "0", "right": "0"})
        await browser.close()


def main() -> None:
    data = json.loads(DATA.read_text(encoding="utf-8"))
    env = Environment(
        loader=DictLoader({"guide.j2": GUIDE_TEMPLATE}),
        autoescape=select_autoescape(["html", "j2"]),
    )
    font_reg = (FONTS / "Andika-Regular.ttf").as_uri()
    font_bold = (FONTS / "Andika-Bold.ttf").as_uri()

    jobs: list[tuple[Path, Path]] = []
    page_counts: dict[int, int] = {}

    print(f"Rendering {len(data['levels'])} Teacher's Guides...")
    for lvl in data["levels"]:
        L = build_context(lvl)
        gpc_pages = paginate_gpcs(lvl["spreads"], per_page=2)
        checks = checks_for_level(L["level"])

        # page count = cover + teaches + rhythm + gpc pages + (psc) + assessment
        n_pages = 3 + len(gpc_pages) + (1 if L.get("psc_page") else 0) + 1
        page_counts[L["level"]] = n_pages

        html = env.get_template("guide.j2").render(
            L=L, gpc_pages=gpc_pages, checks=checks,
            font_regular=font_reg, font_bold=font_bold,
        )
        hpath = BUILD_DIR / f"L{L['level']}_Teachers_Guide.html"
        hpath.write_text(html, encoding="utf-8")
        pdf = OUT_DIR / f"L{L['level']}_Teachers_Guide.pdf"
        jobs.append((hpath, pdf))

    asyncio.run(render_pdfs(jobs))

    print("\nOutputs:")
    ok = True
    for lvl in data["levels"]:
        pdf = OUT_DIR / f"L{lvl['level']}_Teachers_Guide.pdf"
        exists = pdf.exists() and pdf.stat().st_size > 5000
        ok &= exists
        size = f"{pdf.stat().st_size/1024:.0f} KB" if pdf.exists() else "—"
        print(f"  [{'OK ' if exists else 'FAIL'}] {pdf.relative_to(REPO)}  "
              f"(~{page_counts[lvl['level']]} pages, {size})")
    if not ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
