"""
MyPhonicsBooks Marketing Content Renderer
Uses Playwright to render HTML compositions with Gemini images to PNG.
Produces: Instagram Feed (1080x1080), Stories (1080x1920), Facebook (1200x628), Meta Ads (1080x1080)
"""
import os, sys, time, base64

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
PANEL_DARK = "rgba(12,12,18,0.78)"
LIGHT_GREY = "#BEBEBF"
MID_GREY = "#82828C"

LEVEL_COLOURS = [PINK, AMBER, GREEN, BLUE, PURPLE, TEAL]

def img_to_data_uri(path):
    """Convert image file to base64 data URI for embedding in HTML."""
    with open(path, "rb") as f:
        data = base64.b64encode(f.read()).decode()
    return f"data:image/png;base64,{data}"

def level_dots_html(size=14, gap=8):
    dots = ""
    for c in LEVEL_COLOURS:
        dots += f'<div style="width:{size}px;height:{size}px;border-radius:50%;background:{c};"></div>'
    return f'<div style="display:flex;gap:{gap}px;">{dots}</div>'

def cta_pill(text, bg, fg, font_size=22):
    return f'''<div style="display:inline-block;background:{bg};color:{fg};
        font-family:'Poppins',sans-serif;font-weight:600;font-size:{font_size}px;
        padding:14px 36px;border-radius:999px;">{text}</div>'''

def watermark(colour="rgba(80,220,130,0.9)"):
    return f'''<div style="font-family:'Poppins',sans-serif;font-weight:500;font-size:18px;
        color:{colour};position:absolute;top:24px;right:40px;">MyPhonicsBooks</div>'''

def glass_panel(content, extra_style=""):
    return f'''<div style="background:{PANEL_DARK};padding:50px 60px 60px;
        backdrop-filter:blur(12px);{extra_style}">{content}</div>'''

def base_html(width, height, body_content, bg_image_path=None):
    bg_css = ""
    if bg_image_path:
        uri = img_to_data_uri(bg_image_path)
        bg_css = f"background-image:url('{uri}');background-size:cover;background-position:center;"

    return f'''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Lato:wght@300;400;500;700&display=swap');
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ width:{width}px; height:{height}px; overflow:hidden; background:{DEEP_BLACK};
    font-family:'Poppins',sans-serif; -webkit-font-smoothing:antialiased; }}
.bg {{ position:absolute; width:{width}px; height:{height}px; {bg_css} }}
.content {{ position:relative; width:{width}px; height:{height}px; }}
</style>
</head>
<body>
<div class="bg"></div>
<div class="content">
{body_content}
</div>
</body>
</html>'''


# ══════════════════════════════════════════════
#  COMPOSITIONS
# ══════════════════════════════════════════════

def feed_reading_age():
    """Feed 01: 73% of parents don't know their child's reading age"""
    gem = os.path.join(GEMINI_RAW, "gem_01_children_reading_v2.png")
    panel = glass_panel(f'''
        {watermark()}
        <div style="font-weight:700;font-size:80px;color:{PINK};line-height:1.0;">73%</div>
        <div style="font-weight:700;font-size:42px;color:{SOFT_WHITE};line-height:1.25;margin-top:10px;">
            of parents don't know their child's reading age.</div>
        <div style="font-family:'Lato',sans-serif;font-size:24px;color:{LIGHT_GREY};line-height:1.5;margin-top:20px;max-width:900px;">
            If they're reading the wrong books, they're not really reading. They're guessing.</div>
    ''', "position:absolute;top:0;left:0;right:0;border-radius:0;")

    bottom = f'''
        <div style="position:absolute;bottom:30px;left:60px;">{level_dots_html()}</div>
        <div style="position:absolute;bottom:70px;left:60px;">{cta_pill("Find Their Reading Level", PINK, SOFT_WHITE)}</div>
    '''
    return base_html(1080, 1080, panel + bottom, gem), "awareness/instagram-feed", "feed_01_reading_age.png"


def feed_read_like_british():
    """Feed 02: Want them to read English like a British child?"""
    gem = os.path.join(GEMINI_RAW, "gem_04_world_connections.png")
    panel = glass_panel(f'''
        {watermark("rgba(100,180,255,0.9)")}
        <div style="font-weight:700;font-size:44px;color:{SOFT_WHITE};line-height:1.25;">
            Want them to read English</div>
        <div style="font-weight:700;font-size:44px;color:{BLUE};line-height:1.25;">
            like a British child?</div>
        <div style="font-family:'Lato',sans-serif;font-size:23px;color:{LIGHT_GREY};line-height:1.5;margin-top:24px;max-width:900px;">
            British schools use a structured phonics system that teaches children to decode words, not guess them.
            Now your family can use the same approach, wherever you live.</div>
    ''', "position:absolute;top:0;left:0;right:0;border-radius:0;")

    bottom = f'''
        <div style="position:absolute;bottom:30px;left:60px;">{level_dots_html()}</div>
        <div style="position:absolute;bottom:70px;left:60px;">{cta_pill("Start the Free Assessment", BLUE, SOFT_WHITE)}</div>
    '''
    return base_html(1080, 1080, panel + bottom, gem), "awareness/instagram-feed", "feed_02_read_like_british.png"


def feed_critical_window():
    """Feed 03: Between ages 4 and 6, something important happens"""
    gem = os.path.join(GEMINI_RAW, "gem_05_reading_gap.png")
    panel = glass_panel(f'''
        {watermark("rgba(245,158,11,0.9)")}
        <div style="font-weight:700;font-size:42px;color:{SOFT_WHITE};line-height:1.25;">
            Between ages 4 and 6,</div>
        <div style="font-weight:700;font-size:42px;color:{AMBER};line-height:1.25;">
            something important happens.</div>
        <div style="font-family:'Lato',sans-serif;font-size:23px;color:{LIGHT_GREY};line-height:1.5;margin-top:24px;max-width:900px;">
            The brain is wired to learn to read. Miss this window and the gap doesn't close. It widens. Every year. Every stage.</div>
        <div style="display:inline-block;margin-top:20px;padding:10px 28px;border-radius:12px;
            background:rgba(245,158,11,0.25);font-weight:700;font-size:36px;color:{AMBER};">
            Ages 4&ndash;6: the critical window</div>
    ''', "position:absolute;top:0;left:0;right:0;border-radius:0;")

    bottom = f'''
        <div style="position:absolute;bottom:30px;left:60px;">{level_dots_html()}</div>
        <div style="position:absolute;bottom:70px;left:60px;">{cta_pill("Find Their Reading Level", AMBER, DEEP_BLACK)}</div>
    '''
    return base_html(1080, 1080, panel + bottom, gem), "awareness/instagram-feed", "feed_03_critical_window.png"


def feed_ten_minutes():
    """Feed 04: You don't need 50 minutes a day. You need 10."""
    gem = os.path.join(GEMINI_RAW, "gem_06_ten_minutes.png")
    panel = glass_panel(f'''
        {watermark("rgba(59,130,246,0.9)")}
        <div style="font-weight:700;font-size:42px;color:{SOFT_WHITE};line-height:1.25;">
            You don't need 50 minutes a day.</div>
        <div style="font-weight:700;font-size:42px;color:{BLUE};line-height:1.25;">
            You need 10.</div>
        <div style="font-family:'Lato',sans-serif;font-size:23px;color:{LIGHT_GREY};line-height:1.5;margin-top:24px;max-width:900px;">
            Ten minutes of reading at the right level beats an hour of guessing at the wrong one.
            Every word matched to what they already know.</div>
        <div style="display:flex;gap:30px;margin-top:28px;align-items:center;">
            <div style="font-weight:700;font-size:60px;color:{MID_GREY};
                text-decoration:line-through;text-decoration-color:{PINK};">60 min</div>
            <div style="font-weight:700;font-size:60px;color:{BLUE};">10 min</div>
        </div>
    ''', "position:absolute;top:0;left:0;right:0;border-radius:0;")

    bottom = f'''
        <div style="position:absolute;bottom:30px;left:60px;">{level_dots_html()}</div>
        <div style="position:absolute;bottom:70px;left:60px;">{cta_pill("Start the Free Assessment", BLUE, SOFT_WHITE)}</div>
    '''
    return base_html(1080, 1080, panel + bottom, gem), "awareness/instagram-feed", "feed_04_ten_minutes.png"


def feed_british_teacher():
    """Feed 10: A British teacher built this for families like yours"""
    gem = os.path.join(GEMINI_RAW, "gem_07_british_teacher_v2.png")
    panel = glass_panel(f'''
        {watermark("rgba(80,220,130,0.9)")}
        <div style="font-weight:700;font-size:42px;color:{SOFT_WHITE};line-height:1.25;">
            A British teacher built this</div>
        <div style="font-weight:700;font-size:42px;color:{GREEN};line-height:1.25;">
            for families like yours.</div>
        <div style="font-family:'Lato',sans-serif;font-size:22px;color:{LIGHT_GREY};line-height:1.5;margin-top:24px;max-width:900px;">
            Not a tech company. Not an app with cartoon rewards. A qualified UK teacher who knows
            exactly how British children learn to read.</div>
    ''', "position:absolute;top:0;left:0;right:0;border-radius:0;")

    bottom = f'''
        <div style="position:absolute;bottom:30px;left:60px;">{level_dots_html()}</div>
        <div style="position:absolute;bottom:70px;left:60px;">{cta_pill("Start the Free Assessment", GREEN, DEEP_BLACK)}</div>
    '''
    return base_html(1080, 1080, panel + bottom, gem), "consideration/instagram-feed", "feed_10_british_teacher.png"


def feed_social_proof():
    """Feed 14: Built by a British teacher. Used by families worldwide."""
    gem = os.path.join(GEMINI_RAW, "gem_08_social_proof_v2.png")
    quotes_html = ""
    quotes = [
        ("We live in Dubai and this is exactly what we needed.", 5),
        ("My daughter went from guessing to actually reading.", 5),
    ]
    for text, stars in quotes:
        star_str = "&#9733;" * stars
        quotes_html += f'''<div style="background:rgba(22,28,35,0.85);border-radius:12px;padding:16px 24px;margin-bottom:14px;">
            <div style="font-family:'Lato',sans-serif;font-size:20px;color:{WARM_WHITE};font-style:italic;">
                &ldquo;{text}&rdquo;</div>
            <div style="color:{AMBER};font-size:14px;margin-top:6px;letter-spacing:2px;">{star_str}</div>
        </div>'''

    panel = glass_panel(f'''
        {watermark("rgba(80,220,130,0.9)")}
        <div style="font-weight:700;font-size:42px;color:{SOFT_WHITE};line-height:1.25;">
            Built by a British teacher.</div>
        <div style="font-weight:700;font-size:42px;color:{GREEN};line-height:1.25;">
            Used by families worldwide.</div>
        <div style="margin-top:30px;">{quotes_html}</div>
    ''', "position:absolute;top:0;left:0;right:0;border-radius:0;")

    bottom = f'''
        <div style="position:absolute;bottom:30px;left:60px;">{level_dots_html()}</div>
        <div style="position:absolute;bottom:70px;left:60px;">{cta_pill("Try It Free", GREEN, DEEP_BLACK)}</div>
    '''
    return base_html(1080, 1080, panel + bottom, gem), "conversion/instagram-feed", "feed_14_social_proof.png"


def feed_reading_purpose():
    """Feed 09: Are they reading with purpose?"""
    gem = os.path.join(GEMINI_RAW, "gem_11_reading_purpose.png")
    panel = glass_panel(f'''
        {watermark("rgba(255,120,170,0.9)")}
        <div style="font-weight:700;font-size:46px;color:{SOFT_WHITE};line-height:1.25;">
            Are they reading</div>
        <div style="font-weight:700;font-size:46px;color:{PINK};line-height:1.25;">
            with purpose?</div>
        <div style="font-family:'Lato',sans-serif;font-size:22px;color:{LIGHT_GREY};line-height:1.5;margin-top:24px;max-width:900px;">
            Or are they just looking at words they can't decode? Every book in this system uses only
            words matched to their assessed reading level.</div>
    ''', "position:absolute;top:0;left:0;right:0;border-radius:0;")

    bottom = f'''
        <div style="position:absolute;bottom:30px;left:60px;">{level_dots_html()}</div>
        <div style="position:absolute;bottom:70px;left:60px;">{cta_pill("Find Their Reading Level", PINK, SOFT_WHITE)}</div>
    '''
    return base_html(1080, 1080, panel + bottom, gem), "consideration/instagram-feed", "feed_09_reading_purpose.png"


def meta_dont_guess():
    """Meta Ad 12: Don't guess their reading level. Know it."""
    gem = os.path.join(GEMINI_RAW, "gem_09_assessment.png")
    panel = glass_panel(f'''
        {watermark("rgba(59,130,246,0.9)")}
        <div style="font-weight:700;font-size:44px;color:{SOFT_WHITE};line-height:1.25;">
            Don't guess their reading level.</div>
        <div style="font-weight:700;font-size:44px;color:{BLUE};line-height:1.25;">
            Know it.</div>
        <div style="font-family:'Lato',sans-serif;font-size:23px;color:{LIGHT_GREY};line-height:1.5;margin-top:24px;max-width:900px;">
            A free 3-minute assessment finds their exact level. Then they get a personalised book matched to it.
            Every word suited to what they know.</div>
        <div style="display:inline-flex;align-items:baseline;gap:12px;margin-top:20px;
            background:rgba(59,130,246,0.15);padding:10px 24px;border-radius:12px;">
            <span style="font-weight:700;font-size:56px;color:{BLUE};">3</span>
            <span style="font-weight:500;font-size:28px;color:{SOFT_WHITE};">minutes. Free.</span>
        </div>
    ''', "position:absolute;top:0;left:0;right:0;border-radius:0;")

    bottom = f'''
        <div style="position:absolute;bottom:30px;left:60px;">{level_dots_html()}</div>
        <div style="position:absolute;bottom:70px;left:60px;">{cta_pill("Find Their Level Now", BLUE, SOFT_WHITE)}</div>
    '''
    return base_html(1080, 1080, panel + bottom, gem), "awareness/meta-ads", "meta_12_dont_guess.png"


# ── STORIES (1080x1920) ──

def story_expat_fear():
    """Story 04: Living abroad? Scared they're falling behind?"""
    gem = os.path.join(GEMINI_RAW, "gem_04_world_connections.png")
    uri = img_to_data_uri(gem)

    body = f'''
        <div style="position:absolute;bottom:0;width:1080px;height:1080px;
            background-image:url('{uri}');background-size:cover;background-position:center;"></div>
        <div style="position:absolute;top:0;left:0;right:0;height:840px;background:{PANEL_DARK};
            backdrop-filter:blur(12px);padding:60px;">
            <div style="font-weight:500;font-size:18px;color:rgba(100,160,255,0.9);margin-bottom:40px;">MyPhonicsBooks</div>
            <div style="font-weight:700;font-size:48px;color:{SOFT_WHITE};line-height:1.2;margin-top:40px;">
                Living abroad?</div>
            <div style="font-weight:700;font-size:48px;color:{PINK};line-height:1.2;margin-top:8px;">
                Scared they're falling behind?</div>
            <div style="font-family:'Lato',sans-serif;font-size:26px;color:{LIGHT_GREY};line-height:1.6;margin-top:30px;max-width:940px;">
                No British school checking. No phonics screening. No one telling you where they actually are.
                And every month, the gap between where they are and where a child in Britain would be gets wider.</div>
            <div style="font-family:'Lato',sans-serif;font-size:24px;color:{MID_GREY};line-height:1.5;margin-top:24px;max-width:940px;">
                A British teacher built a system for families abroad. A 3-minute assessment finds their exact level.</div>
        </div>
        <div style="position:absolute;bottom:0;left:0;right:0;background:rgba(12,12,18,0.85);padding:30px 60px 50px;text-align:center;">
            <div style="display:flex;gap:8px;justify-content:center;margin-bottom:16px;">{level_dots_html()}</div>
            {cta_pill("Find Their Reading Level", BLUE, SOFT_WHITE)}
            <div style="font-family:'Lato',sans-serif;font-size:17px;color:{MID_GREY};margin-top:14px;">
                Free. No login. Takes 3 minutes.</div>
        </div>
    '''
    return base_html(1080, 1920, body), "awareness/instagram-stories", "story_04_expat_fear.png"


def story_six_months():
    """Story 05: From first sounds to confident reader"""
    gem = os.path.join(GEMINI_RAW, "gem_03_level_pathway.png")
    uri = img_to_data_uri(gem)

    steps = [
        ("1", "Take the free 3-minute assessment", "Find their exact reading level"),
        ("2", "Get a free book matched to their stage", "Every word suited to what they know"),
        ("3", "10 minutes a day. Watch them grow.", "Systematic British phonics progression"),
    ]
    steps_html = ""
    for num, title, desc in steps:
        steps_html += f'''<div style="display:flex;align-items:flex-start;gap:18px;
            background:rgba(20,35,35,0.8);border-radius:14px;padding:18px 22px;margin-bottom:14px;">
            <div style="width:40px;height:40px;border-radius:50%;background:{TEAL};display:flex;
                align-items:center;justify-content:center;flex-shrink:0;font-weight:700;font-size:22px;color:{DEEP_BLACK};">{num}</div>
            <div>
                <div style="font-weight:500;font-size:22px;color:{WARM_WHITE};">{title}</div>
                <div style="font-family:'Lato',sans-serif;font-size:17px;color:{LIGHT_GREY};margin-top:4px;">{desc}</div>
            </div>
        </div>'''

    body = f'''
        <div style="position:absolute;bottom:0;width:1080px;height:1080px;
            background-image:url('{uri}');background-size:cover;background-position:center;"></div>
        <div style="position:absolute;top:0;left:0;right:0;height:920px;background:{PANEL_DARK};
            backdrop-filter:blur(12px);padding:60px;">
            <div style="font-weight:500;font-size:18px;color:rgba(100,210,195,0.9);margin-bottom:30px;">MyPhonicsBooks</div>
            <div style="font-weight:700;font-size:46px;color:{SOFT_WHITE};line-height:1.2;margin-top:20px;">
                From first sounds to confident reader.</div>
            <div style="font-weight:500;font-size:30px;color:{TEAL};line-height:1.3;margin-top:16px;">
                Have them secure in English reading within 6 months.</div>
            <div style="margin-top:36px;">{steps_html}</div>
        </div>
        <div style="position:absolute;bottom:0;left:0;right:0;background:rgba(12,12,18,0.85);padding:30px 60px 50px;text-align:center;">
            <div style="display:flex;gap:8px;justify-content:center;margin-bottom:16px;">{level_dots_html()}</div>
            {cta_pill("Start the Free Assessment", TEAL, DEEP_BLACK)}
            <div style="font-family:'Lato',sans-serif;font-size:17px;color:{MID_GREY};margin-top:14px;">
                Free. 3 minutes. No login.</div>
        </div>
    '''
    return base_html(1080, 1920, body), "consideration/instagram-stories", "story_05_six_months.png"


def story_assessment_cta():
    """Story 13: What reading level are they actually at?"""
    gem = os.path.join(GEMINI_RAW, "gem_09_assessment.png")
    uri = img_to_data_uri(gem)

    body = f'''
        <div style="position:absolute;bottom:0;width:1080px;height:1080px;
            background-image:url('{uri}');background-size:cover;background-position:center;"></div>
        <div style="position:absolute;top:0;left:0;right:0;height:780px;background:{PANEL_DARK};
            backdrop-filter:blur(12px);padding:60px;">
            <div style="font-weight:500;font-size:18px;color:rgba(120,160,255,0.9);margin-bottom:40px;">MyPhonicsBooks</div>
            <div style="font-weight:700;font-size:48px;color:{SOFT_WHITE};line-height:1.2;margin-top:30px;">
                What reading level are they actually at?</div>
            <div style="font-family:'Lato',sans-serif;font-size:26px;color:{LIGHT_GREY};line-height:1.5;margin-top:30px;max-width:940px;">
                Most parents don't know. That means most children are reading the wrong books.</div>
            <div style="background:rgba(22,22,40,0.88);border-radius:18px;padding:24px 30px;
                margin-top:36px;display:flex;align-items:center;gap:24px;">
                <div style="font-weight:700;font-size:90px;color:{BLUE};">3</div>
                <div>
                    <div style="font-weight:500;font-size:34px;color:{SOFT_WHITE};">minutes</div>
                    <div style="font-family:'Lato',sans-serif;font-size:24px;color:{LIGHT_GREY};margin-top:4px;">to find their exact level.</div>
                    <div style="font-family:'Lato',sans-serif;font-size:20px;color:{MID_GREY};margin-top:4px;">Then a free book matched to it.</div>
                </div>
            </div>
        </div>
        <div style="position:absolute;bottom:0;left:0;right:0;background:rgba(12,12,18,0.85);padding:30px 60px 50px;text-align:center;">
            <div style="display:flex;gap:8px;justify-content:center;margin-bottom:16px;">{level_dots_html()}</div>
            {cta_pill("Find Their Reading Level Now", BLUE, SOFT_WHITE)}
            <div style="font-family:'Lato',sans-serif;font-size:17px;color:{MID_GREY};margin-top:14px;">
                Free. No login. Takes 3 minutes.</div>
        </div>
    '''
    return base_html(1080, 1920, body), "conversion/instagram-stories", "story_13_assessment_cta.png"


# ── FACEBOOK (1200x628) ──

def fb_start_right():
    """Facebook 07: Start them off right"""
    gem = os.path.join(GEMINI_RAW, "gem_10_start_right_v2.png")
    uri = img_to_data_uri(gem)

    body = f'''
        <div style="position:absolute;top:0;right:0;width:1200px;height:1200px;
            background-image:url('{uri}');background-size:cover;background-position:center top;
            transform:translateY(-286px);"></div>
        <div style="position:absolute;top:0;left:0;bottom:0;width:620px;background:{PANEL_DARK};
            backdrop-filter:blur(12px);padding:40px 45px;">
            <div style="font-weight:500;font-size:15px;color:rgba(170,140,255,0.9);margin-bottom:20px;">MyPhonicsBooks</div>
            <div style="font-weight:700;font-size:40px;color:{SOFT_WHITE};line-height:1.2;">
                Start them off</div>
            <div style="font-weight:700;font-size:40px;color:{PURPLE};line-height:1.2;">
                right.</div>
            <div style="font-family:'Lato',sans-serif;font-size:18px;color:{LIGHT_GREY};line-height:1.5;margin-top:18px;max-width:520px;">
                Most children are given books above their level. They guess at words instead of reading them.
                A 3-minute assessment changes everything.</div>
            <div style="margin-top:20px;">{cta_pill("Find Their Reading Level", PURPLE, SOFT_WHITE, 17)}</div>
            <div style="position:absolute;bottom:16px;left:45px;">{level_dots_html(10, 6)}</div>
        </div>
    '''
    return base_html(1200, 628, body), "consideration/facebook", "fb_07_start_right.png"


def fb_gap_widens():
    """Facebook 06: The gap doesn't close. It widens."""
    gem = os.path.join(GEMINI_RAW, "gem_05_reading_gap.png")
    uri = img_to_data_uri(gem)

    body = f'''
        <div style="position:absolute;top:0;right:0;width:1200px;height:1200px;
            background-image:url('{uri}');background-size:cover;background-position:center;
            transform:translateY(-286px);"></div>
        <div style="position:absolute;top:0;left:0;bottom:0;width:620px;background:{PANEL_DARK};
            backdrop-filter:blur(12px);padding:40px 45px;">
            <div style="font-weight:500;font-size:15px;color:rgba(245,158,11,0.9);margin-bottom:20px;">MyPhonicsBooks</div>
            <div style="font-weight:700;font-size:38px;color:{SOFT_WHITE};line-height:1.2;">
                The gap doesn't close.</div>
            <div style="font-weight:700;font-size:38px;color:{AMBER};line-height:1.2;margin-top:4px;">
                It widens.</div>
            <div style="font-family:'Lato',sans-serif;font-size:18px;color:{LIGHT_GREY};line-height:1.5;margin-top:18px;max-width:520px;">
                Children who struggle with reading at age six are still struggling at fourteen. The research is clear.
                But the fix is simpler than you think: the right book, at the right level, for 10 minutes a day.</div>
            <div style="margin-top:20px;">{cta_pill("Find Their Reading Level", AMBER, DEEP_BLACK, 17)}</div>
            <div style="position:absolute;bottom:16px;left:45px;">{level_dots_html(10, 6)}</div>
        </div>
    '''
    return base_html(1200, 628, body), "awareness/facebook", "fb_06_gap_widens.png"


def meta_confident_reader():
    """Meta Ad: From guessing to reading"""
    gem = os.path.join(GEMINI_RAW, "gem_02_confident_reader_v2.png")
    panel = glass_panel(f'''
        {watermark("rgba(80,220,130,0.9)")}
        <div style="font-weight:700;font-size:44px;color:{SOFT_WHITE};line-height:1.25;">
            From guessing</div>
        <div style="font-weight:700;font-size:44px;color:{GREEN};line-height:1.25;">
            to reading.</div>
        <div style="font-family:'Lato',sans-serif;font-size:23px;color:{LIGHT_GREY};line-height:1.5;margin-top:24px;max-width:900px;">
            A 3-minute assessment finds their reading level. Then they get a free personalised book where every word is matched to what they already know. Not a guess. Matched.</div>
    ''', "position:absolute;top:0;left:0;right:0;border-radius:0;")

    bottom = f'''
        <div style="position:absolute;bottom:30px;left:60px;">{level_dots_html()}</div>
        <div style="position:absolute;bottom:70px;left:60px;">{cta_pill("Start the Free Assessment", GREEN, DEEP_BLACK)}</div>
    '''
    return base_html(1080, 1080, panel + bottom, gem), "consideration/meta-ads", "meta_08_confident_reader.png"


def meta_expat_reading():
    """Meta Ad: Living abroad? They can still read like a British child."""
    gem = os.path.join(GEMINI_RAW, "gem_04_world_connections.png")
    panel = glass_panel(f'''
        {watermark("rgba(100,160,255,0.9)")}
        <div style="font-weight:700;font-size:44px;color:{SOFT_WHITE};line-height:1.25;">
            Living abroad?</div>
        <div style="font-weight:700;font-size:38px;color:{BLUE};line-height:1.25;margin-top:6px;">
            They can still read like a British child.</div>
        <div style="font-family:'Lato',sans-serif;font-size:23px;color:{LIGHT_GREY};line-height:1.5;margin-top:24px;max-width:900px;">
            A UK teacher with QTS built a phonics reading system for families abroad.
            Free 3-minute assessment. Free personalised book. Every word matched to their level.</div>
    ''', "position:absolute;top:0;left:0;right:0;border-radius:0;")

    bottom = f'''
        <div style="position:absolute;bottom:30px;left:60px;">{level_dots_html()}</div>
        <div style="position:absolute;bottom:70px;left:60px;">{cta_pill("Find Their Reading Level", BLUE, SOFT_WHITE)}</div>
    '''
    return base_html(1080, 1080, panel + bottom, gem), "conversion/meta-ads", "meta_09_expat_reading.png"


def meta_ten_min_ad():
    """Meta Ad 15: 10 minutes. The right book. Real progress."""
    gem = os.path.join(GEMINI_RAW, "gem_06_ten_minutes.png")
    panel = glass_panel(f'''
        {watermark("rgba(59,130,246,0.9)")}
        <div style="font-weight:700;font-size:44px;color:{SOFT_WHITE};line-height:1.25;">
            10 minutes. The right book.</div>
        <div style="font-weight:700;font-size:44px;color:{BLUE};line-height:1.25;">
            Real progress.</div>
        <div style="font-family:'Lato',sans-serif;font-size:23px;color:{LIGHT_GREY};line-height:1.5;margin-top:24px;max-width:900px;">
            An hour of guessing isn't reading. Ten minutes of the right book is.
            Every word matched to your child's assessed reading level.</div>
        <div style="display:inline-flex;align-items:baseline;gap:12px;margin-top:20px;
            background:rgba(59,130,246,0.15);padding:10px 24px;border-radius:12px;">
            <span style="font-weight:700;font-size:56px;color:{BLUE};">10</span>
            <span style="font-weight:500;font-size:28px;color:{SOFT_WHITE};">min/day</span>
        </div>
    ''', "position:absolute;top:0;left:0;right:0;border-radius:0;")

    bottom = f'''
        <div style="position:absolute;bottom:30px;left:60px;">{level_dots_html()}</div>
        <div style="position:absolute;bottom:70px;left:60px;">{cta_pill("Start the Free Assessment", BLUE, SOFT_WHITE)}</div>
    '''
    return base_html(1080, 1080, panel + bottom, gem), "conversion/meta-ads", "meta_15_ten_minutes.png"


def fb_reading_purpose():
    """Facebook 16: Give them books that match"""
    gem = os.path.join(GEMINI_RAW, "gem_11_reading_purpose.png")
    uri = img_to_data_uri(gem)

    body = f'''
        <div style="position:absolute;top:0;right:0;width:1200px;height:1200px;
            background-image:url('{uri}');background-size:cover;background-position:center;
            transform:translateY(-286px);"></div>
        <div style="position:absolute;top:0;left:0;bottom:0;width:620px;background:{PANEL_DARK};
            backdrop-filter:blur(12px);padding:40px 45px;">
            <div style="font-weight:500;font-size:15px;color:rgba(255,120,170,0.9);margin-bottom:20px;">MyPhonicsBooks</div>
            <div style="font-weight:700;font-size:38px;color:{SOFT_WHITE};line-height:1.2;">
                Give them books</div>
            <div style="font-weight:700;font-size:38px;color:{PINK};line-height:1.2;margin-top:4px;">
                that actually match.</div>
            <div style="font-family:'Lato',sans-serif;font-size:18px;color:{LIGHT_GREY};line-height:1.5;margin-top:18px;max-width:520px;">
                Most reading books aren't matched to anything. Ours are matched to your child's assessed
                phonics level. Every word. Every page. Built by a British teacher with QTS.</div>
            <div style="margin-top:20px;">{cta_pill("Find Their Reading Level", PINK, SOFT_WHITE, 17)}</div>
            <div style="position:absolute;bottom:16px;left:45px;">{level_dots_html(10, 6)}</div>
        </div>
    '''
    return base_html(1200, 628, body), "conversion/facebook", "fb_16_reading_purpose.png"


# ══════════════════════════════════════════════
#  RENDERER
# ══════════════════════════════════════════════

ALL_COMPOSITIONS = [
    feed_reading_age,
    feed_read_like_british,
    feed_critical_window,
    feed_ten_minutes,
    feed_british_teacher,
    feed_social_proof,
    feed_reading_purpose,
    meta_dont_guess,
    meta_confident_reader,
    meta_expat_reading,
    meta_ten_min_ad,
    story_expat_fear,
    story_six_months,
    story_assessment_cta,
    fb_start_right,
    fb_gap_widens,
    fb_reading_purpose,
]


def render_all():
    from playwright.sync_api import sync_playwright

    print(f"Rendering {len(ALL_COMPOSITIONS)} compositions...")
    print(f"Output base: {OUTPUT_BASE}")

    with sync_playwright() as p:
        browser = p.chromium.launch()

        for i, comp_fn in enumerate(ALL_COMPOSITIONS):
            html, subdir, filename = comp_fn()
            out_dir = os.path.join(OUTPUT_BASE, subdir)
            os.makedirs(out_dir, exist_ok=True)
            out_path = os.path.join(out_dir, filename)

            # Extract dimensions from HTML
            # Parse width/height from the body style
            import re
            w_match = re.search(r'width:(\d+)px', html[:500])
            h_match = re.search(r'height:(\d+)px', html[:500])
            width = int(w_match.group(1)) if w_match else 1080
            height = int(h_match.group(1)) if h_match else 1080

            page = browser.new_page(viewport={"width": width, "height": height})
            page.set_content(html, wait_until="networkidle")
            # Wait for fonts to load
            page.wait_for_timeout(2000)
            page.screenshot(path=out_path, type="png")
            page.close()

            size_kb = os.path.getsize(out_path) / 1024
            print(f"  [{i+1}/{len(ALL_COMPOSITIONS)}] {filename} ({width}x{height}) -> {size_kb:.0f}KB")

        browser.close()

    print(f"\nDone! {len(ALL_COMPOSITIONS)} images rendered to {OUTPUT_BASE}")


if __name__ == "__main__":
    render_all()
