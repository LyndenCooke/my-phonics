"""
v4 — direct-response ad creatives.

Six new frameworks not yet in the library, each with its own visual treatment so
they read as different ad STYLES, not just different copy in one template:

  01_money_math       — subscription vs one-off, two big columns
  02_tutor_compare    — tutor £40/hr vs whole library £24, bar chart
  03_pas_guesses      — problem/agitate/solution over hero photo
  04_before_after     — two quote bubbles, before vs after
  05_window           — loss aversion / phonics window closing
  06_hidden_cost      — free apps aren't free, ledger breakdown

Output: 1080x1920 PNGs in `./` and `G:\My Drive\MyPhonicsBooks\02_Marketing\Mockups_v4\`.
"""
import asyncio
import base64
import shutil
from pathlib import Path
from playwright.async_api import async_playwright

DRIVE = Path(r"G:\My Drive\MyPhonicsBooks")
COVERS = DRIVE / "04_Books_PDFs" / "Covers"
LOGO = DRIVE / "01_Brand" / "mpb-lockup.png"
HERO_DIR = Path(r"C:\Users\ASUS\myphonicsbooks\marketing-mockups\v3\hero_with_covers")
OUT_LOCAL = Path(__file__).parent
OUT_DRIVE = DRIVE / "02_Marketing" / "Mockups_v4"

PINK = "#E84B8A"
INK = "#0f172a"
AMBER = "#F59E0B"
GREEN = "#22C55E"


def data_uri(path: Path) -> str:
    mime = "image/png" if path.suffix.lower() == ".png" else "image/jpeg"
    b64 = base64.b64encode(path.read_bytes()).decode()
    return f"data:{mime};base64,{b64}"


LOGO_URI = data_uri(LOGO)
COVERS_GRID_URIS = [data_uri(COVERS / f"{i}_1_cover.jpg") for i in range(1, 7)]
HERO_OPEN_BOOK = data_uri(HERO_DIR / "03_open_book_bed.png")
HERO_FANNED = data_uri(HERO_DIR / "01_fanned_5_levels.png")
HERO_STACK = data_uri(HERO_DIR / "02_stack_6_spines.png")
HERO_KITCHEN = data_uri(HERO_DIR / "04_kitchen_table_morning.png")


BASE_HEAD = f"""
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  html, body {{ width: 1080px; height: 1920px; }}
  body {{
    font-family: 'Plus Jakarta Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow: hidden;
  }}
  .logo {{ height: 80px; display: block; }}
  .logo-dark {{ filter: brightness(0) invert(1); }}
  .footer {{ font-size: 22px; font-weight: 600; opacity: .65; }}
  .cta {{
    display: inline-flex;
    align-items: center;
    gap: 18px;
    background: linear-gradient(90deg, {PINK}, #c33574);
    color: white;
    font-family: 'Outfit', sans-serif;
    font-weight: 700;
    font-size: 40px;
    padding: 28px 52px;
    border-radius: 999px;
    box-shadow: 0 14px 36px rgba(232,75,138,.4);
  }}
  .cta .arrow {{
    width: 44px; height: 44px;
    border-radius: 50%;
    background: rgba(255,255,255,.22);
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 26px;
  }}
</style>
"""


def shell(body: str, bg: str = "#fdfdfd") -> str:
    return f"""<!doctype html><html><head>{BASE_HEAD}</head>
<body style="background:{bg};">{body}</body></html>"""


# ---------- 01 money math (two big numbers) ----------
def ad_01_money_math() -> str:
    covers_strip = "".join(
        f'<div style="border-radius:10px; overflow:hidden; '
        f'box-shadow:0 8px 20px rgba(0,0,0,.18); aspect-ratio:2/3;">'
        f'<img src="{u}" style="width:100%; height:100%; object-fit:cover; display:block;"/>'
        f'</div>'
        for u in COVERS_GRID_URIS
    )
    return shell(f"""
<div style="padding:48px 72px 60px; height:100%; display:grid;
            grid-template-rows:auto auto 1fr auto; row-gap:40px; color:{INK};">

  <div style="display:flex; justify-content:center;">
    <img class="logo" src="{LOGO_URI}"/>
  </div>

  <div style="display:grid; grid-template-columns:repeat(6,1fr); gap:14px;">
    {covers_strip}
  </div>

  <div style="display:flex; flex-direction:column; justify-content:flex-start;">

    <div style="font-family:'Outfit'; font-weight:700; font-size:42px;
                text-align:center; color:#64748b; letter-spacing:.04em;
                text-transform:uppercase; margin-bottom:28px;">
      The same goal. Two prices.
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:36px;">

      <div style="background:#f1f5f9; border-radius:32px; padding:48px 36px;
                  text-align:center; position:relative;">
        <div style="font-size:30px; font-weight:700; color:#64748b;
                    text-transform:uppercase; letter-spacing:.06em;">
          A phonics app
        </div>
        <div style="font-family:'Outfit'; font-weight:900; font-size:140px;
                    line-height:1; margin-top:24px; color:#94a3b8;
                    position:relative; display:inline-block;">
          £216
          <span style="position:absolute; left:-8px; right:-8px; top:50%;
                       height:8px; background:#ef4444; border-radius:4px;
                       transform:rotate(-6deg);"></span>
        </div>
        <div style="font-size:26px; color:#64748b; font-weight:500;
                    margin-top:24px; line-height:1.4;">
          £8.99/month × 24 months.<br>Cancelled the day they read.
        </div>
      </div>

      <div style="background:#fdf2f8; border:3px solid {PINK}; border-radius:32px;
                  padding:48px 36px; text-align:center; position:relative;">
        <div style="font-size:30px; font-weight:700; color:{PINK};
                    text-transform:uppercase; letter-spacing:.06em;">
          MyPhonicsBooks
        </div>
        <div style="font-family:'Outfit'; font-weight:900; font-size:140px;
                    line-height:1; margin-top:24px; color:{INK};">
          £24
        </div>
        <div style="font-size:26px; color:{INK}; font-weight:600;
                    margin-top:24px; line-height:1.4;">
          All six levels.<br>Yours forever. Every sibling after.
        </div>
      </div>

    </div>

    <div style="margin-top:60px; font-size:32px; line-height:1.4; color:#334155;
                font-weight:500; text-align:center; max-width:880px;
                margin-left:auto; margin-right:auto;">
      Both teach phonics. Only one of them stops costing you money.
    </div>

  </div>

  <div style="display:flex; flex-direction:column; align-items:center; gap:24px;">
    <div class="cta">See the six books <span class="arrow">&#8594;</span></div>
    <div class="footer">myphonicsbooks.co.uk &nbsp;·&nbsp; UK curriculum aligned</div>
  </div>

</div>
""")


# ---------- 02 tutor comparison (bar chart) ----------
def ad_02_tutor_compare() -> str:
    covers_strip_2 = "".join(
        f'<div style="border-radius:10px; overflow:hidden; '
        f'box-shadow:0 8px 24px rgba(0,0,0,.5); aspect-ratio:2/3;">'
        f'<img src="{u}" style="width:100%; height:100%; object-fit:cover; display:block;"/>'
        f'</div>'
        for u in COVERS_GRID_URIS
    )
    return shell(f"""
<div style="padding:48px 72px 60px; height:100%; display:grid;
            grid-template-rows:auto 1fr auto; row-gap:36px; color:#ffffff;">

  <div style="display:flex; justify-content:center;">
    <img class="logo logo-dark" src="{LOGO_URI}"/>
  </div>

  <div style="display:flex; flex-direction:column; justify-content:flex-start;">

    <h1 style="font-family:'Outfit'; font-weight:800; font-size:86px;
               line-height:1.04; letter-spacing:-.02em; text-align:center;
               margin-bottom:60px;">
      One hour of tutoring<br>
      or <span style="color:{PINK}; text-decoration:underline;
                       text-decoration-thickness:8px; text-underline-offset:14px;">
      every book they need</span>.
    </h1>

    <!-- bar 1: tutor -->
    <div style="margin-bottom:32px;">
      <div style="display:flex; justify-content:space-between; align-items:baseline;
                  font-size:28px; font-weight:700; color:#cbd5e1; margin-bottom:14px;">
        <span>One phonics tutoring session</span>
        <span style="font-family:'Outfit'; font-size:48px; font-weight:800;
                     color:#ffffff;">£40</span>
      </div>
      <div style="height:48px; background:#334155; border-radius:24px;">
        <div style="width:100%; height:100%; background:#64748b;
                    border-radius:24px;"></div>
      </div>
      <div style="font-size:22px; color:#94a3b8; margin-top:10px;">
        Covers one grapheme. Maybe two. Gone in 60 minutes.
      </div>
    </div>

    <!-- bar 2: books -->
    <div>
      <div style="display:flex; justify-content:space-between; align-items:baseline;
                  font-size:28px; font-weight:700; color:#fbcfe8; margin-bottom:14px;">
        <span>All six MyPhonicsBooks levels</span>
        <span style="font-family:'Outfit'; font-size:48px; font-weight:800;
                     color:{PINK};">£24</span>
      </div>
      <div style="height:48px; background:#334155; border-radius:24px;">
        <div style="width:60%; height:100%;
                    background:linear-gradient(90deg, {PINK}, #f472b6);
                    border-radius:24px;"></div>
      </div>
      <div style="font-size:22px; color:#fbcfe8; margin-top:10px;">
        Reception to Year 2 curriculum. At your child's pace, on your sofa.
      </div>
    </div>

    <div style="margin-top:48px; font-size:30px; line-height:1.4;
                color:#e2e8f0; font-weight:500; text-align:center;">
      The library costs less than the consultation.
    </div>

    <div style="margin-top:56px; display:grid;
                grid-template-columns:repeat(6,1fr); gap:14px;">
      {covers_strip_2}
    </div>

    <div style="margin-top:24px; font-size:24px; color:#94a3b8;
                font-weight:600; text-align:center; letter-spacing:.04em;">
      L1 &middot; L2 &middot; L3 &middot; L4 &middot; L5 &middot; L6 &nbsp;&mdash;&nbsp;
      Reception to Year 2
    </div>
  </div>

  <div style="display:flex; flex-direction:column; align-items:center; gap:20px;">
    <div class="cta">See the curriculum <span class="arrow">&#8594;</span></div>
    <div class="footer" style="color:#94a3b8;">myphonicsbooks.co.uk</div>
  </div>

</div>
""", bg=INK)


# ---------- 03 PAS — over hero photo ----------
def ad_03_pas_guesses() -> str:
    return shell(f"""
<div style="position:relative; height:100%;">

  <img src="{HERO_OPEN_BOOK}" style="position:absolute; inset:0;
        width:100%; height:100%; object-fit:cover; filter:brightness(.55);"/>

  <div style="position:absolute; inset:0;
              background:linear-gradient(180deg,
                rgba(15,23,42,.92) 0%,
                rgba(15,23,42,.3) 45%,
                rgba(15,23,42,.92) 100%);"></div>

  <div style="position:relative; padding:80px 72px; height:100%;
              display:grid; grid-template-rows:auto 1fr auto;
              row-gap:50px; color:#ffffff;">

    <div style="display:flex; justify-content:center;">
      <img class="logo logo-dark" src="{LOGO_URI}"/>
    </div>

    <div style="display:flex; flex-direction:column; justify-content:center; gap:48px;">

      <div>
        <div style="font-family:'Outfit'; font-weight:700; font-size:32px;
                    color:{PINK}; text-transform:uppercase; letter-spacing:.1em;
                    margin-bottom:18px;">
          The problem
        </div>
        <h1 style="font-family:'Outfit'; font-weight:900; font-size:112px;
                   line-height:.98; letter-spacing:-.025em;">
          She guesses.<br>
          <span style="color:{PINK};">Every word.</span>
        </h1>
      </div>

      <div style="font-size:34px; line-height:1.36; color:#e2e8f0;
                  font-weight:500; max-width:880px;">
        Most readers in trouble aren't lazy or slow. They've been taught
        to recognise whole words instead of decode them — and the books at
        home reinforce the habit every night.
      </div>

      <div style="font-size:32px; line-height:1.36; color:#ffffff;
                  font-weight:700; max-width:880px;
                  padding:32px 36px; border-left:6px solid {PINK};
                  background:rgba(232,75,138,.12);">
        Decodable books reverse it in weeks. Every word uses only the sounds
        she's been taught. There's nothing left to guess.
      </div>
    </div>

    <div style="display:flex; flex-direction:column; align-items:center; gap:24px;">
      <div class="cta">Find her level &mdash; 3 mins
        <span class="arrow">&#8594;</span></div>
      <div class="footer" style="color:#cbd5e1;">myphonicsbooks.co.uk</div>
    </div>

  </div>
</div>
""", bg=INK)


# ---------- 04 before / after speech bubbles ----------
def ad_04_before_after() -> str:
    return shell(f"""
<div style="padding:80px 72px; height:100%; display:grid;
            grid-template-rows:auto 1fr auto; row-gap:50px; color:{INK};">

  <div style="display:flex; justify-content:center;">
    <img class="logo" src="{LOGO_URI}"/>
  </div>

  <div style="display:flex; flex-direction:column; justify-content:center;
              align-items:center; gap:60px;">

    <!-- BEFORE -->
    <div style="width:100%;">
      <div style="font-family:'Outfit'; font-weight:700; font-size:30px;
                  color:#94a3b8; text-transform:uppercase; letter-spacing:.1em;
                  margin-bottom:18px; text-align:center;">
        Before
      </div>
      <div style="background:#f1f5f9; border-radius:48px 48px 48px 12px;
                  padding:48px 56px; max-width:780px; margin:0 auto;
                  position:relative;">
        <div style="font-family:'Outfit'; font-weight:800; font-size:72px;
                    line-height:1.1; color:#64748b;">
          "Um... is it... dog?"
        </div>
        <div style="font-size:24px; color:#94a3b8; margin-top:18px; font-weight:600;">
          Guessing. Looking at the picture. Hoping.
        </div>
      </div>
    </div>

    <!-- arrow -->
    <div style="font-size:80px; color:{PINK};">&darr;</div>

    <!-- AFTER -->
    <div style="width:100%;">
      <div style="font-family:'Outfit'; font-weight:700; font-size:30px;
                  color:{PINK}; text-transform:uppercase; letter-spacing:.1em;
                  margin-bottom:18px; text-align:center;">
        After two weeks
      </div>
      <div style="background:#fdf2f8; border:3px solid {PINK};
                  border-radius:48px 48px 12px 48px;
                  padding:48px 56px; max-width:780px; margin:0 auto;
                  position:relative;">
        <div style="font-family:'Outfit'; font-weight:800; font-size:72px;
                    line-height:1.1; color:{INK};">
          "d &mdash; o &mdash; g. <span style="color:{PINK};">Dog!</span>"
        </div>
        <div style="font-size:24px; color:{PINK}; margin-top:18px; font-weight:700;">
          Decoding. Sounding out. Reading.
        </div>
      </div>
    </div>

  </div>

  <div style="display:flex; flex-direction:column; align-items:center; gap:24px;">
    <div style="font-size:30px; color:#475569; font-weight:600; text-align:center;
                max-width:820px;">
      The difference is the books between bedtime and the next school day.
    </div>
    <div class="cta">See the six books <span class="arrow">&#8594;</span></div>
    <div class="footer">myphonicsbooks.co.uk &nbsp;·&nbsp; UK curriculum aligned</div>
  </div>

</div>
""")


# ---------- 05 window — loss aversion ----------
def ad_05_window() -> str:
    return shell(f"""
<div style="padding:80px 72px; height:100%; display:grid;
            grid-template-rows:auto 1fr auto; row-gap:60px; color:#ffffff;">

  <div style="display:flex; justify-content:center;">
    <img class="logo logo-dark" src="{LOGO_URI}"/>
  </div>

  <div style="display:flex; flex-direction:column; justify-content:center;
              align-items:center; text-align:center; gap:40px;">

    <div style="font-family:'Outfit'; font-weight:700; font-size:34px;
                color:#fbbf24; text-transform:uppercase; letter-spacing:.12em;">
      The phonics window
    </div>

    <h1 style="font-family:'Outfit'; font-weight:900; font-size:200px;
               line-height:.92; letter-spacing:-.04em; color:#ffffff;">
      Age 4 &ndash; 7
    </h1>

    <div style="font-size:36px; line-height:1.4; color:#e2e8f0;
                font-weight:500; max-width:860px;">
      The children who decode fluently by Year 2 read for pleasure for life.
      The ones who don't, rarely catch up.
    </div>

    <div style="margin-top:24px; padding:36px 48px; background:rgba(251,191,36,.1);
                border:2px solid #fbbf24; border-radius:24px;
                max-width:860px;">
      <div style="font-family:'Outfit'; font-weight:800; font-size:36px;
                  color:#fbbf24; line-height:1.3;">
        It's not won at school.<br>
        It's won in the half-hour between dinner and bed.
      </div>
    </div>

  </div>

  <div style="display:flex; flex-direction:column; align-items:center; gap:24px;">
    <div class="cta">Find their level &mdash; 3 mins
      <span class="arrow">&#8594;</span></div>
    <div class="footer" style="color:#94a3b8;">myphonicsbooks.co.uk</div>
  </div>

</div>
""", bg=INK)


# ---------- 06 hidden cost — receipt/ledger ----------
def ad_06_hidden_cost() -> str:
    covers_strip_6 = "".join(
        f'<div style="border-radius:10px; overflow:hidden; '
        f'box-shadow:0 8px 20px rgba(0,0,0,.18); aspect-ratio:2/3;">'
        f'<img src="{u}" style="width:100%; height:100%; object-fit:cover; display:block;"/>'
        f'</div>'
        for u in COVERS_GRID_URIS
    )
    return shell(f"""
<div style="padding:56px 72px 60px; height:100%; display:grid;
            grid-template-rows:auto 1fr auto; row-gap:40px; color:{INK};">

  <div style="display:flex; justify-content:center;">
    <img class="logo" src="{LOGO_URI}"/>
  </div>

  <div style="display:flex; flex-direction:column; justify-content:flex-start;">

    <h1 style="font-family:'Outfit'; font-weight:800; font-size:96px;
               line-height:1.02; letter-spacing:-.02em; text-align:center;
               margin-bottom:48px;">
      &ldquo;Free&rdquo; reading apps<br>
      <span style="color:{PINK};">aren't free.</span>
    </h1>

    <div style="background:#fafaf9; border:2px dashed #cbd5e1;
                border-radius:24px; padding:48px 56px; font-family:'Outfit';">

      <div style="font-size:26px; font-weight:700; color:#64748b;
                  text-transform:uppercase; letter-spacing:.08em;
                  margin-bottom:32px; text-align:center;">
        20 minutes/day, one school year
      </div>

      <div style="display:flex; justify-content:space-between;
                  padding:18px 0; border-bottom:1px solid #e2e8f0;
                  font-size:32px;">
        <span style="color:#334155; font-weight:600;">Screen time</span>
        <span style="font-weight:800; color:{INK};">122 hours</span>
      </div>

      <div style="display:flex; justify-content:space-between;
                  padding:18px 0; border-bottom:1px solid #e2e8f0;
                  font-size:32px;">
        <span style="color:#334155; font-weight:600;">In-app upsells seen</span>
        <span style="font-weight:800; color:{INK};">~1,800</span>
      </div>

      <div style="display:flex; justify-content:space-between;
                  padding:18px 0; border-bottom:1px solid #e2e8f0;
                  font-size:32px;">
        <span style="color:#334155; font-weight:600;">Habit being built</span>
        <span style="font-weight:800; color:{INK};">tapping</span>
      </div>

      <div style="display:flex; justify-content:space-between;
                  padding:18px 0;
                  font-size:32px;">
        <span style="color:#334155; font-weight:600;">Habit you wanted</span>
        <span style="font-weight:800; color:{PINK};">decoding</span>
      </div>

    </div>

    <div style="margin-top:40px; font-size:32px; line-height:1.4; color:#334155;
                font-weight:500; text-align:center; max-width:880px;
                margin-left:auto; margin-right:auto;">
      Six paper books cost £24 once. None of these costs come with them.
    </div>

    <div style="margin-top:48px; display:grid;
                grid-template-columns:repeat(6,1fr); gap:14px;">
      {covers_strip_6}
    </div>

  </div>

  <div style="display:flex; flex-direction:column; align-items:center; gap:20px;">
    <div class="cta">See the six books <span class="arrow">&#8594;</span></div>
    <div class="footer">myphonicsbooks.co.uk &nbsp;·&nbsp; UK curriculum aligned</div>
  </div>

</div>
""")


ADS = [
    ("01_money_math", ad_01_money_math),
    ("02_tutor_compare", ad_02_tutor_compare),
    ("03_pas_guesses", ad_03_pas_guesses),
    ("04_before_after", ad_04_before_after),
    ("05_window", ad_05_window),
    ("06_hidden_cost", ad_06_hidden_cost),
]


async def main():
    OUT_LOCAL.mkdir(parents=True, exist_ok=True)
    OUT_DRIVE.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(
            viewport={"width": 1080, "height": 1920}, device_scale_factor=1)
        page = await ctx.new_page()
        outs = []
        for slug, fn in ADS:
            await page.set_content(fn(), wait_until="networkidle")
            out = OUT_LOCAL / f"{slug}.png"
            await page.screenshot(
                path=str(out), full_page=False,
                clip={"x": 0, "y": 0, "width": 1080, "height": 1920})
            print(f"[ok] {out.name}")
            outs.append(out)
        await browser.close()
    for o in outs:
        shutil.copy2(o, OUT_DRIVE / o.name)
        print(f"[copied] {o.name}")


if __name__ == "__main__":
    asyncio.run(main())
