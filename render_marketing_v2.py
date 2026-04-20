"""
MyPhonicsBooks Marketing Content Renderer v2
Bottom-panel layout: Gemini image fills the frame, text in compact glass strip at bottom.
"""
import os, sys, time, base64, re

# ── Paths ──
GEMINI_RAW = r"C:\Users\ASUS\myphonicsbooks\content\gemini-raw"
OUTPUT_BASE = r"C:\Users\ASUS\myphonicsbooks\content"

# ── Colours ──
PINK = "#E84B8A"
AMBER = "#F59E0B"
GREEN = "#22C55E"
BLUE = "#3B82F6"
PURPLE = "#8B5CF6"
TEAL = "#14B8A6"
SOFT_WHITE = "#FCFAF5"
WARM_WHITE = "#FFFDF8"
DEEP_BLACK = "#121216"
PANEL_DARK = "rgba(10,10,16,0.82)"
PANEL_DARKER = "rgba(10,10,16,0.88)"
LIGHT_GREY = "#BEBEBF"
MID_GREY = "#82828C"

LEVEL_COLOURS = [PINK, AMBER, GREEN, BLUE, PURPLE, TEAL]

def img_uri(path):
    with open(path, "rb") as f:
        return f"data:image/png;base64,{base64.b64encode(f.read()).decode()}"

def dots(size=12, gap=6):
    d = "".join(f'<div style="width:{size}px;height:{size}px;border-radius:50%;background:{c};"></div>' for c in LEVEL_COLOURS)
    return f'<div style="display:flex;gap:{gap}px;">{d}</div>'

def pill(text, bg, fg, fs=20):
    return f'<div style="display:inline-block;background:{bg};color:{fg};font-family:Poppins,sans-serif;font-weight:600;font-size:{fs}px;padding:12px 32px;border-radius:999px;">{text}</div>'

def mark(colour="rgba(80,220,130,0.9)"):
    return f'<div style="position:absolute;top:20px;right:32px;font-family:Poppins,sans-serif;font-weight:500;font-size:16px;color:{colour};">MyPhonicsBooks</div>'

def html(w, h, body, bg_path=None):
    bg = f"background-image:url('{img_uri(bg_path)}');background-size:cover;background-position:center;" if bg_path else ""
    return f'''<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Lato:wght@300;400;500;700&display=swap');
*{{margin:0;padding:0;box-sizing:border-box;}}
body{{width:{w}px;height:{h}px;overflow:hidden;background:{DEEP_BLACK};font-family:Poppins,sans-serif;-webkit-font-smoothing:antialiased;}}
.bg{{position:absolute;width:{w}px;height:{h}px;{bg}}}
.content{{position:relative;width:{w}px;height:{h}px;}}
.bottom-panel{{position:absolute;bottom:0;left:0;right:0;background:{PANEL_DARK};backdrop-filter:blur(14px);padding:28px 44px 32px;}}
.bottom-panel-tight{{position:absolute;bottom:0;left:0;right:0;background:{PANEL_DARKER};backdrop-filter:blur(14px);padding:22px 44px 28px;}}
.gradient-fade{{position:absolute;bottom:0;left:0;right:0;height:50%;background:linear-gradient(to top,rgba(10,10,16,0.9) 0%,rgba(10,10,16,0.5) 40%,transparent 100%);pointer-events:none;}}
h1{{font-weight:700;line-height:1.15;}}
h2{{font-weight:700;line-height:1.2;}}
.sub{{font-family:Lato,sans-serif;color:{LIGHT_GREY};line-height:1.45;}}
.row{{display:flex;align-items:center;gap:16px;margin-top:12px;}}
</style></head><body><div class="bg"></div><div class="content">{body}</div></body></html>'''


# ══════════════════════════════════════════════
#  FEED COMPOSITIONS (1080x1080) — bottom panel
# ══════════════════════════════════════════════

def feed_reading_age():
    gem = os.path.join(GEMINI_RAW, "gem_01_children_reading_v2.png")
    body = f'''
        {mark()}
        <div class="gradient-fade"></div>
        <div class="bottom-panel">
            <h1 style="font-size:64px;color:{PINK};">73%</h1>
            <h2 style="font-size:34px;color:{SOFT_WHITE};margin-top:6px;">of parents don't know their child's reading age.</h2>
            <p class="sub" style="font-size:20px;margin-top:10px;">If they're reading the wrong books, they're not really reading. They're guessing.</p>
            <div class="row">{pill("Find Their Reading Level", PINK, SOFT_WHITE)} {dots()}</div>
        </div>'''
    return html(1080, 1080, body, gem), "awareness/instagram-feed", "feed_01_reading_age.png"


def feed_read_like_british():
    gem = os.path.join(GEMINI_RAW, "gem_04_world_connections.png")
    body = f'''
        {mark("rgba(100,180,255,0.9)")}
        <div class="gradient-fade"></div>
        <div class="bottom-panel">
            <h2 style="font-size:36px;color:{SOFT_WHITE};">Want them to read English</h2>
            <h2 style="font-size:36px;color:{BLUE};">like a British child?</h2>
            <p class="sub" style="font-size:19px;margin-top:10px;">British schools use structured phonics to teach children to decode words, not guess. Now your family can use the same approach, wherever you live.</p>
            <div class="row">{pill("Start the Free Assessment", BLUE, SOFT_WHITE)} {dots()}</div>
        </div>'''
    return html(1080, 1080, body, gem), "awareness/instagram-feed", "feed_02_read_like_british.png"


def feed_critical_window():
    gem = os.path.join(GEMINI_RAW, "gem_05_reading_gap.png")
    body = f'''
        {mark("rgba(245,158,11,0.9)")}
        <div class="gradient-fade"></div>
        <div class="bottom-panel">
            <h2 style="font-size:34px;color:{SOFT_WHITE};">Between ages 4 and 6,</h2>
            <h2 style="font-size:34px;color:{AMBER};">something important happens.</h2>
            <p class="sub" style="font-size:19px;margin-top:10px;">The brain is wired to learn to read. Miss this window and the gap doesn't close. It widens.</p>
            <div style="display:inline-block;margin-top:10px;padding:8px 20px;border-radius:10px;background:rgba(245,158,11,0.2);font-weight:700;font-size:24px;color:{AMBER};">Ages 4&ndash;6: the critical window</div>
            <div class="row">{pill("Find Their Reading Level", AMBER, DEEP_BLACK)} {dots()}</div>
        </div>'''
    return html(1080, 1080, body, gem), "awareness/instagram-feed", "feed_03_critical_window.png"


def feed_ten_minutes():
    gem = os.path.join(GEMINI_RAW, "gem_06_ten_minutes.png")
    body = f'''
        {mark("rgba(59,130,246,0.9)")}
        <div class="gradient-fade"></div>
        <div class="bottom-panel">
            <h2 style="font-size:34px;color:{SOFT_WHITE};">You don't need 50 minutes a day.</h2>
            <h2 style="font-size:34px;color:{BLUE};">You need 10.</h2>
            <p class="sub" style="font-size:19px;margin-top:10px;">Ten minutes at the right level beats an hour of guessing. Every word matched to what they know.</p>
            <div class="row" style="gap:24px;">
                <span style="font-weight:700;font-size:44px;color:{MID_GREY};text-decoration:line-through;text-decoration-color:{PINK};">60 min</span>
                <span style="font-weight:700;font-size:44px;color:{BLUE};">10 min</span>
            </div>
            <div class="row">{pill("Start the Free Assessment", BLUE, SOFT_WHITE)} {dots()}</div>
        </div>'''
    return html(1080, 1080, body, gem), "awareness/instagram-feed", "feed_04_ten_minutes.png"


def feed_british_teacher():
    gem = os.path.join(GEMINI_RAW, "gem_07_british_teacher_v2.png")
    body = f'''
        {mark("rgba(80,220,130,0.9)")}
        <div class="gradient-fade"></div>
        <div class="bottom-panel">
            <h2 style="font-size:34px;color:{SOFT_WHITE};">A British teacher built this</h2>
            <h2 style="font-size:34px;color:{GREEN};">for families like yours.</h2>
            <p class="sub" style="font-size:19px;margin-top:10px;">Not a tech company. Not an app with cartoon rewards. A qualified UK teacher who knows exactly how British children learn to read.</p>
            <div class="row">{pill("Start the Free Assessment", GREEN, DEEP_BLACK)} {dots()}</div>
        </div>'''
    return html(1080, 1080, body, gem), "consideration/instagram-feed", "feed_10_british_teacher.png"


def feed_social_proof():
    gem = os.path.join(GEMINI_RAW, "gem_08_social_proof_v2.png")
    q1 = f'<div style="background:rgba(18,22,30,0.85);border-radius:10px;padding:12px 18px;margin-top:10px;"><span style="font-family:Lato,sans-serif;font-size:18px;color:{WARM_WHITE};font-style:italic;">&ldquo;We live in Dubai and this is exactly what we needed.&rdquo;</span><span style="color:{AMBER};font-size:12px;margin-left:10px;letter-spacing:2px;">&#9733;&#9733;&#9733;&#9733;&#9733;</span></div>'
    q2 = f'<div style="background:rgba(18,22,30,0.85);border-radius:10px;padding:12px 18px;margin-top:8px;"><span style="font-family:Lato,sans-serif;font-size:18px;color:{WARM_WHITE};font-style:italic;">&ldquo;My daughter went from guessing to actually reading.&rdquo;</span><span style="color:{AMBER};font-size:12px;margin-left:10px;letter-spacing:2px;">&#9733;&#9733;&#9733;&#9733;&#9733;</span></div>'
    body = f'''
        {mark("rgba(80,220,130,0.9)")}
        <div class="gradient-fade"></div>
        <div class="bottom-panel">
            <h2 style="font-size:32px;color:{SOFT_WHITE};">Built by a British teacher.</h2>
            <h2 style="font-size:32px;color:{GREEN};">Used by families worldwide.</h2>
            {q1}{q2}
            <div class="row">{pill("Try It Free", GREEN, DEEP_BLACK)} {dots()}</div>
        </div>'''
    return html(1080, 1080, body, gem), "conversion/instagram-feed", "feed_14_social_proof.png"


def feed_reading_purpose():
    gem = os.path.join(GEMINI_RAW, "gem_11_reading_purpose.png")
    body = f'''
        {mark("rgba(255,120,170,0.9)")}
        <div class="gradient-fade"></div>
        <div class="bottom-panel">
            <h2 style="font-size:36px;color:{SOFT_WHITE};">Are they reading</h2>
            <h2 style="font-size:36px;color:{PINK};">with purpose?</h2>
            <p class="sub" style="font-size:19px;margin-top:10px;">Or just looking at words they can't decode? Every book in this system uses only words matched to their assessed reading level.</p>
            <div class="row">{pill("Find Their Reading Level", PINK, SOFT_WHITE)} {dots()}</div>
        </div>'''
    return html(1080, 1080, body, gem), "consideration/instagram-feed", "feed_09_reading_purpose.png"


def meta_dont_guess():
    gem = os.path.join(GEMINI_RAW, "gem_09_assessment.png")
    body = f'''
        {mark("rgba(59,130,246,0.9)")}
        <div class="gradient-fade"></div>
        <div class="bottom-panel">
            <h2 style="font-size:36px;color:{SOFT_WHITE};">Don't guess their reading level.</h2>
            <h2 style="font-size:36px;color:{BLUE};">Know it.</h2>
            <p class="sub" style="font-size:19px;margin-top:10px;">A free 3-minute assessment finds their exact level. Then a personalised book matched to it.</p>
            <div style="display:inline-flex;align-items:baseline;gap:10px;margin-top:10px;background:rgba(59,130,246,0.15);padding:8px 20px;border-radius:10px;">
                <span style="font-weight:700;font-size:44px;color:{BLUE};">3</span>
                <span style="font-weight:500;font-size:22px;color:{SOFT_WHITE};">minutes. Free.</span>
            </div>
            <div class="row">{pill("Find Their Level Now", BLUE, SOFT_WHITE)} {dots()}</div>
        </div>'''
    return html(1080, 1080, body, gem), "awareness/meta-ads", "meta_12_dont_guess.png"


def meta_confident_reader():
    gem = os.path.join(GEMINI_RAW, "gem_02_confident_reader_v2.png")
    body = f'''
        {mark("rgba(80,220,130,0.9)")}
        <div class="gradient-fade"></div>
        <div class="bottom-panel">
            <h2 style="font-size:36px;color:{SOFT_WHITE};">From guessing</h2>
            <h2 style="font-size:36px;color:{GREEN};">to reading.</h2>
            <p class="sub" style="font-size:19px;margin-top:10px;">A 3-minute assessment finds their level. Then a free book where every word is matched to what they know.</p>
            <div class="row">{pill("Start the Free Assessment", GREEN, DEEP_BLACK)} {dots()}</div>
        </div>'''
    return html(1080, 1080, body, gem), "consideration/meta-ads", "meta_08_confident_reader.png"


def meta_expat_reading():
    gem = os.path.join(GEMINI_RAW, "gem_04_world_connections.png")
    body = f'''
        {mark("rgba(100,160,255,0.9)")}
        <div class="gradient-fade"></div>
        <div class="bottom-panel">
            <h2 style="font-size:34px;color:{SOFT_WHITE};">Living abroad?</h2>
            <h2 style="font-size:30px;color:{BLUE};">They can still read like a British child.</h2>
            <p class="sub" style="font-size:19px;margin-top:10px;">A UK teacher built a phonics system for families abroad. Free assessment. Free personalised book. Every word matched.</p>
            <div class="row">{pill("Find Their Reading Level", BLUE, SOFT_WHITE)} {dots()}</div>
        </div>'''
    return html(1080, 1080, body, gem), "conversion/meta-ads", "meta_09_expat_reading.png"


def meta_ten_min_ad():
    gem = os.path.join(GEMINI_RAW, "gem_06_ten_minutes.png")
    body = f'''
        {mark("rgba(59,130,246,0.9)")}
        <div class="gradient-fade"></div>
        <div class="bottom-panel">
            <h2 style="font-size:34px;color:{SOFT_WHITE};">10 minutes. The right book.</h2>
            <h2 style="font-size:34px;color:{BLUE};">Real progress.</h2>
            <p class="sub" style="font-size:19px;margin-top:10px;">An hour of guessing isn't reading. Ten minutes of the right book is. Every word matched to their level.</p>
            <div class="row">{pill("Start the Free Assessment", BLUE, SOFT_WHITE)} {dots()}</div>
        </div>'''
    return html(1080, 1080, body, gem), "conversion/meta-ads", "meta_15_ten_minutes.png"


# ══════════════════════════════════════════════
#  STORIES (1080x1920) — image top, text bottom
# ══════════════════════════════════════════════

def story_expat_fear():
    gem = os.path.join(GEMINI_RAW, "gem_04_world_connections.png")
    body = f'''
        {mark("rgba(100,160,255,0.9)")}
        <div style="position:absolute;bottom:0;left:0;right:0;height:55%;background:linear-gradient(to top,rgba(10,10,16,0.95) 0%,rgba(10,10,16,0.7) 60%,transparent 100%);"></div>
        <div style="position:absolute;bottom:0;left:0;right:0;padding:0 50px 50px;">
            <h2 style="font-size:44px;color:{SOFT_WHITE};">Living abroad?</h2>
            <h2 style="font-size:44px;color:{PINK};">Scared they're falling behind?</h2>
            <p class="sub" style="font-size:22px;margin-top:16px;">No British school checking. No phonics screening. No one telling you where they actually are. And every month, the gap gets wider.</p>
            <p class="sub" style="font-size:20px;margin-top:14px;color:{MID_GREY};">A British teacher built a system for families abroad. A 3-minute assessment finds their exact level.</p>
            <div style="margin-top:20px;text-align:center;">{dots(14, 8)}</div>
            <div style="margin-top:14px;text-align:center;">{pill("Find Their Reading Level", BLUE, SOFT_WHITE, 22)}</div>
            <p style="font-family:Lato,sans-serif;font-size:15px;color:{MID_GREY};text-align:center;margin-top:10px;">Free. No login. Takes 3 minutes.</p>
        </div>'''
    return html(1080, 1920, body, gem), "awareness/instagram-stories", "story_04_expat_fear.png"


def story_six_months():
    gem = os.path.join(GEMINI_RAW, "gem_03_level_pathway.png")
    steps = [
        ("1", "Take the free 3-minute assessment", "Find their exact reading level"),
        ("2", "Get a free book matched to their stage", "Every word suited to what they know"),
        ("3", "10 minutes a day. Watch them grow.", "Systematic British phonics progression"),
    ]
    steps_html = ""
    for num, title, desc in steps:
        steps_html += f'''<div style="display:flex;align-items:flex-start;gap:14px;background:rgba(16,24,28,0.85);border-radius:12px;padding:14px 18px;margin-top:10px;">
            <div style="width:36px;height:36px;border-radius:50%;background:{TEAL};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:700;font-size:20px;color:{DEEP_BLACK};">{num}</div>
            <div><div style="font-weight:500;font-size:20px;color:{WARM_WHITE};">{title}</div>
            <div style="font-family:Lato,sans-serif;font-size:15px;color:{LIGHT_GREY};margin-top:2px;">{desc}</div></div></div>'''

    body = f'''
        {mark("rgba(100,210,195,0.9)")}
        <div style="position:absolute;bottom:0;left:0;right:0;height:60%;background:linear-gradient(to top,rgba(10,10,16,0.95) 0%,rgba(10,10,16,0.7) 60%,transparent 100%);"></div>
        <div style="position:absolute;bottom:0;left:0;right:0;padding:0 50px 50px;">
            <h2 style="font-size:40px;color:{SOFT_WHITE};">From first sounds to confident reader.</h2>
            <p style="font-weight:500;font-size:26px;color:{TEAL};margin-top:10px;">Secure in English reading within 6 months.</p>
            {steps_html}
            <div style="margin-top:18px;text-align:center;">{dots(14, 8)}</div>
            <div style="margin-top:12px;text-align:center;">{pill("Start the Free Assessment", TEAL, DEEP_BLACK, 22)}</div>
            <p style="font-family:Lato,sans-serif;font-size:15px;color:{MID_GREY};text-align:center;margin-top:10px;">Free. 3 minutes. No login.</p>
        </div>'''
    return html(1080, 1920, body, gem), "consideration/instagram-stories", "story_05_six_months.png"


def story_assessment_cta():
    gem = os.path.join(GEMINI_RAW, "gem_09_assessment.png")
    body = f'''
        {mark("rgba(120,160,255,0.9)")}
        <div style="position:absolute;bottom:0;left:0;right:0;height:55%;background:linear-gradient(to top,rgba(10,10,16,0.95) 0%,rgba(10,10,16,0.7) 60%,transparent 100%);"></div>
        <div style="position:absolute;bottom:0;left:0;right:0;padding:0 50px 50px;">
            <h2 style="font-size:42px;color:{SOFT_WHITE};">What reading level are they actually at?</h2>
            <p class="sub" style="font-size:22px;margin-top:14px;">Most parents don't know. That means most children are reading the wrong books.</p>
            <div style="background:rgba(18,18,35,0.88);border-radius:14px;padding:20px 24px;margin-top:16px;display:flex;align-items:center;gap:20px;">
                <div style="font-weight:700;font-size:72px;color:{BLUE};">3</div>
                <div>
                    <div style="font-weight:500;font-size:28px;color:{SOFT_WHITE};">minutes</div>
                    <div style="font-family:Lato,sans-serif;font-size:20px;color:{LIGHT_GREY};margin-top:2px;">to find their exact level.</div>
                </div>
            </div>
            <div style="margin-top:18px;text-align:center;">{dots(14, 8)}</div>
            <div style="margin-top:12px;text-align:center;">{pill("Find Their Reading Level Now", BLUE, SOFT_WHITE, 22)}</div>
            <p style="font-family:Lato,sans-serif;font-size:15px;color:{MID_GREY};text-align:center;margin-top:10px;">Free. No login. Takes 3 minutes.</p>
        </div>'''
    return html(1080, 1920, body, gem), "conversion/instagram-stories", "story_13_assessment_cta.png"


# ══════════════════════════════════════════════
#  FACEBOOK (1200x628) — image fills, text left panel
# ══════════════════════════════════════════════

def fb_start_right():
    gem = os.path.join(GEMINI_RAW, "gem_10_start_right_v2.png")
    body = f'''
        <div style="position:absolute;top:0;left:0;bottom:0;width:560px;background:linear-gradient(to right,rgba(10,10,16,0.92) 0%,rgba(10,10,16,0.7) 80%,transparent 100%);"></div>
        <div style="position:absolute;top:0;left:0;bottom:0;width:520px;padding:36px 40px;">
            <div style="font-weight:500;font-size:14px;color:rgba(170,140,255,0.9);margin-bottom:14px;">MyPhonicsBooks</div>
            <h2 style="font-size:36px;color:{SOFT_WHITE};">Start them off</h2>
            <h2 style="font-size:36px;color:{PURPLE};">right.</h2>
            <p class="sub" style="font-size:16px;margin-top:14px;">Most children are given books above their level. They guess at words instead of reading them. A 3-minute assessment changes everything.</p>
            <div style="margin-top:16px;">{pill("Find Their Reading Level", PURPLE, SOFT_WHITE, 16)}</div>
            <div style="position:absolute;bottom:14px;left:40px;">{dots(9, 5)}</div>
        </div>'''
    return html(1200, 628, body, gem), "consideration/facebook", "fb_07_start_right.png"


def fb_gap_widens():
    gem = os.path.join(GEMINI_RAW, "gem_05_reading_gap.png")
    body = f'''
        <div style="position:absolute;top:0;left:0;bottom:0;width:560px;background:linear-gradient(to right,rgba(10,10,16,0.92) 0%,rgba(10,10,16,0.7) 80%,transparent 100%);"></div>
        <div style="position:absolute;top:0;left:0;bottom:0;width:520px;padding:36px 40px;">
            <div style="font-weight:500;font-size:14px;color:rgba(245,158,11,0.9);margin-bottom:14px;">MyPhonicsBooks</div>
            <h2 style="font-size:34px;color:{SOFT_WHITE};">The gap doesn't close.</h2>
            <h2 style="font-size:34px;color:{AMBER};">It widens.</h2>
            <p class="sub" style="font-size:16px;margin-top:14px;">Children who struggle at six are still struggling at fourteen. The fix: the right book, at the right level, 10 minutes a day.</p>
            <div style="margin-top:16px;">{pill("Find Their Reading Level", AMBER, DEEP_BLACK, 16)}</div>
            <div style="position:absolute;bottom:14px;left:40px;">{dots(9, 5)}</div>
        </div>'''
    return html(1200, 628, body, gem), "awareness/facebook", "fb_06_gap_widens.png"


def fb_reading_purpose():
    gem = os.path.join(GEMINI_RAW, "gem_11_reading_purpose.png")
    body = f'''
        <div style="position:absolute;top:0;left:0;bottom:0;width:560px;background:linear-gradient(to right,rgba(10,10,16,0.92) 0%,rgba(10,10,16,0.7) 80%,transparent 100%);"></div>
        <div style="position:absolute;top:0;left:0;bottom:0;width:520px;padding:36px 40px;">
            <div style="font-weight:500;font-size:14px;color:rgba(255,120,170,0.9);margin-bottom:14px;">MyPhonicsBooks</div>
            <h2 style="font-size:34px;color:{SOFT_WHITE};">Give them books</h2>
            <h2 style="font-size:34px;color:{PINK};">that actually match.</h2>
            <p class="sub" style="font-size:16px;margin-top:14px;">Most reading books aren't matched to anything. Ours are matched to your child's assessed phonics level. Every word. Every page.</p>
            <div style="margin-top:16px;">{pill("Find Their Reading Level", PINK, SOFT_WHITE, 16)}</div>
            <div style="position:absolute;bottom:14px;left:40px;">{dots(9, 5)}</div>
        </div>'''
    return html(1200, 628, body, gem), "conversion/facebook", "fb_16_reading_purpose.png"


# ══════════════════════════════════════════════
ALL = [
    feed_reading_age, feed_read_like_british, feed_critical_window, feed_ten_minutes,
    feed_british_teacher, feed_social_proof, feed_reading_purpose,
    meta_dont_guess, meta_confident_reader, meta_expat_reading, meta_ten_min_ad,
    story_expat_fear, story_six_months, story_assessment_cta,
    fb_start_right, fb_gap_widens, fb_reading_purpose,
]

def render_all():
    from playwright.sync_api import sync_playwright
    print(f"Rendering {len(ALL)} compositions (v2 bottom-panel layout)...")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for i, fn in enumerate(ALL):
            h, subdir, fname = fn()
            out_dir = os.path.join(OUTPUT_BASE, subdir)
            os.makedirs(out_dir, exist_ok=True)
            out = os.path.join(out_dir, fname)
            w_m = re.search(r'width:(\d+)px', h[:400])
            h_m = re.search(r'height:(\d+)px', h[:400])
            w, ht = int(w_m.group(1)), int(h_m.group(1))
            page = browser.new_page(viewport={"width": w, "height": ht})
            page.set_content(h, wait_until="networkidle")
            page.wait_for_timeout(2000)
            page.screenshot(path=out, type="png")
            page.close()
            kb = os.path.getsize(out) / 1024
            print(f"  [{i+1}/{len(ALL)}] {fname} ({w}x{ht}) {kb:.0f}KB")
        browser.close()
    print(f"\nDone! {len(ALL)} images rendered.")

if __name__ == "__main__":
    render_all()
