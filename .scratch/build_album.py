#!/usr/bin/env python3
# Renders the rebuilt L6 grammar booklet (+ a sound_a reference sheet) under the
# LOCKED layout: one type scale, one handwriting geometry on every line,
# sound_a chrome, no flowy waves, no em dashes. SVG -> PNG (cairosvg) -> PDF.
import base64, os, cairosvg
from PIL import Image

ENG = "/sessions/bold-sharp-mccarthy/mnt/myphonicsbooks/worksheet-engine"
CLIP = ENG + "/public/clipart"
HERO = "/sessions/bold-sharp-mccarthy/mnt/myphonicsbooks/myphonics_books/output/images/L4_1_B1/hero_reference.png"
OUT = "/sessions/bold-sharp-mccarthy/mnt/myphonicsbooks/.scratch/album"
os.makedirs(OUT, exist_ok=True)

# ---- locked tokens --------------------------------------------------------
PT = 0.3528  # pt -> mm
TYPE = {"title":28,"section":16,"example":15,"body":15,"instruction":13,"bank":15,"hint":9.5,"footer":8.5}
INK = {"text":"#1a1a1a","muted":"#5f5f5f","faint":"#8a8a8a","trace":"#b3b3b3",
       "rule":"#d6d6d6","ruleStrong":"#9a9a9a","guide":"#e0e0e0"}
SP = {"margin":6,"headerH":26,"afterHeader":5,"sectionGap":4,"instrToContent":4,
      "instrToLine":6,"lineGap":4,"rowGap":3,"footerH":7}
W = 210 - 2*SP["margin"]  # 198
# Andika measured metrics (handwriting.ts)
M = {"x":0.5078,"asc":0.7813,"desc":0.2393}
THEME = {
 1:{"primary":"#E84B8A","light":"#FDEAF2","border":"#F6B8D2","accent":"#C2185B"},
 6:{"primary":"#6366F1","light":"#ECEDFE","border":"#B6B9FA","accent":"#4338CA"},
}

def esc(s): return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
def b64(path):
    if not os.path.exists(path): return None
    return base64.b64encode(open(path,"rb").read()).decode()
def clip(name):
    d=b64(f"{CLIP}/{name}.png"); return d
def img(x,y,w,h,data):
    if not data: return ""
    return f'<image x="{x}" y="{y}" width="{w}" height="{h}" preserveAspectRatio="xMidYMid meet" xlink:href="data:image/png;base64,{data}"/>'

def text(x,y,s,pt,fill=INK["text"],weight=400,anchor="start",family="Andika"):
    return f'<text x="{x}" y="{y}" font-family="{family}" font-size="{pt*PT:.3f}" fill="{fill}" font-weight="{weight}" text-anchor="{anchor}">{esc(s)}</text>'

def rrect(x,y,w,h,r,fill,stroke=None,sw=0):
    s=f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" ry="{r}" fill="{fill}"{s}/>'

# ---- handwriting row: identical geometry everywhere -----------------------
def hw_geom(xh, pad=1.5):
    fs=xh/M["x"]; asc=fs*M["asc"]; desc=fs*M["desc"]
    base=pad+asc; xy=base-xh; dy=base+desc; h=dy+pad
    return {"fs":fs,"asc":asc,"desc":desc,"base":base,"xy":xy,"dy":dy,"h":h}

def traceline(x,y,w,xh=6,model="",trace="",align="start"):
    g=hw_geom(xh); out=[f'<g transform="translate({x},{y})">']
    # guidelines: top (faint), x-height (dashed pink-grey), baseline (strong), descender (dashed faint)
    out.append(f'<line x1="0" y1="{g["asc"]*0+1.5:.3f}" x2="{w}" y2="1.5" stroke="{INK["guide"]}" stroke-width="0.3"/>')
    out.append(f'<line x1="0" y1="{g["xy"]:.3f}" x2="{w}" y2="{g["xy"]:.3f}" stroke="{INK["border_mid"] if False else INK["faint"]}" stroke-width="0.3" stroke-dasharray="1.6 1.4"/>')
    out.append(f'<line x1="0" y1="{g["base"]:.3f}" x2="{w}" y2="{g["base"]:.3f}" stroke="{INK["ruleStrong"]}" stroke-width="0.45"/>')
    out.append(f'<line x1="0" y1="{g["dy"]:.3f}" x2="{w}" y2="{g["dy"]:.3f}" stroke="{INK["guide"]}" stroke-width="0.3" stroke-dasharray="1.6 1.4"/>')
    if model or trace:
        tx = w/2 if align=="middle" else 4
        anchor = "middle" if align=="middle" else "start"
        runs=""
        if model: runs+=f'<tspan fill="{INK["text"]}" font-weight="700">{esc(model)}</tspan>'
        if trace: runs+=f'<tspan fill="{INK["trace"]}">{esc((" " if model else "")+trace)}</tspan>'
        out.append(f'<text x="{tx}" y="{g["base"]:.3f}" text-anchor="{anchor}" font-family="Andika" font-size="{g["fs"]:.3f}">{runs}</text>')
    out.append("</g>")
    return "".join(out), g["h"]
INK["border_mid"]=INK["faint"]

# ---- chrome ---------------------------------------------------------------
def page_open():
    return ['<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="210mm" height="297mm" viewBox="0 0 210 297"><rect width="210" height="297" fill="#ffffff"/>']
def page_close(parts):
    parts.append("</svg>"); return "".join(parts)

def header_bar(p, level, title, strand, mascot_data=None, grapheme=None):
    t=THEME[level]; x=SP["margin"]; y=SP["margin"]; h=SP["headerH"]
    p.append(rrect(x,y,W,h,6,t["primary"]))
    # title centred
    p.append(text(105, y+h/2+TYPE["title"]*PT*0.36, title, TYPE["title"], "#ffffff", 700, "middle"))
    # left tile
    tile=20; ty=y+(h-tile)/2
    p.append(rrect(x+4,ty,tile,tile,4.5,"#ffffff"))
    if mascot_data: p.append(img(x+5,ty+1,tile-2,tile-2,mascot_data))
    elif grapheme is not None:
        p.append(text(x+4+tile/2, ty+tile/2+TYPE["title"]*PT*0.34, grapheme, 22, t["primary"], 700, "middle"))
    # right pills
    px=x+W-4
    p.append(rrect(px-22, y+h/2-7.5, 22, 6.5, 3.2, "#ffffff"))
    p.append(text(px-11, y+h/2-2.7, f"L{level}" if level!=1 else "Level 1", TYPE["hint"], t["primary"], 700, "middle"))
    p.append(rrect(px-26, y+h/2+1.5, 26, 6.5, 3.2, t["light"]))
    p.append(text(px-13, y+h/2+6.2, strand, TYPE["hint"], t["accent"], 700, "middle"))

def section_head(p, x, y, n, title, subtitle, level):
    t=THEME[level]; r=3.5
    p.append(f'<circle cx="{x+r}" cy="{y+r}" r="{r}" fill="{t["primary"]}"/>')
    p.append(text(x+r, y+r+TYPE["section"]*PT*0.34, str(n), 12, "#ffffff", 700, "middle"))
    p.append(text(x+2*r+3, y+r+TYPE["section"]*PT*0.34, title, TYPE["section"], INK["text"], 700))
    if subtitle:
        tw=len(title)*TYPE["section"]*PT*0.55
        p.append(text(x+2*r+6+tw, y+r+TYPE["section"]*PT*0.34, subtitle, TYPE["hint"], INK["muted"]))

def footer(p, level, right):
    t=THEME[level]; x=SP["margin"]; y=297-SP["margin"]-SP["footerH"]
    p.append(rrect(x,y,W,SP["footerH"],3,"#F1F1F1"))
    p.append(f'<text x="{x+5}" y="{y+SP["footerH"]/2+1.2}" font-family="Andika" font-size="{TYPE["footer"]*PT:.3f}"><tspan fill="{t["primary"]}" font-weight="700">MyPhonicsBooks</tspan><tspan fill="{INK["muted"]}"> · decodable phonics practice</tspan></text>')
    p.append(text(x+W-5, y+SP["footerH"]/2+1.2, right, TYPE["footer"], INK["muted"], 400, "end"))

def panel(p,x,y,w,h,level):
    p.append(rrect(x,y,w,h,6,"#ffffff",THEME[level]["border"],0.6))

# ---- grammar unit frame ---------------------------------------------------
def grammar_frame(level, title, mascot, watch_prompt, watch_answer, watch_note, do_instr, body_fn, apply_prompt, page_no):
    t=THEME[level]; p=page_open()
    header_bar(p, level, title, "Grammar", mascot_data=mascot)
    # §1 Watch first
    y1=SP["margin"]+SP["headerH"]+SP["afterHeader"]; h1=28
    panel(p,SP["margin"],y1,W,h1,level)
    section_head(p,SP["margin"]+5,y1+3,1,"Watch first","I do it. You watch.",level)
    ey=y1+15
    p.append(text(SP["margin"]+9, ey, watch_prompt, TYPE["example"], INK["muted"]))
    aw=len(watch_prompt)*TYPE["example"]*PT*0.52
    p.append(text(SP["margin"]+9+aw+4, ey, "→", TYPE["example"], t["primary"]))
    p.append(text(SP["margin"]+9+aw+11, ey, watch_answer, TYPE["example"], t["accent"], 700))
    if watch_note:
        p.append(text(SP["margin"]+9, y1+h1-4, watch_note, TYPE["hint"], INK["muted"]))
    # §2 activity
    y2=y1+h1+SP["sectionGap"]; h2=150
    panel(p,SP["margin"],y2,W,h2,level)
    section_head(p,SP["margin"]+5,y2+3,2,do_instr,"",level)
    body_fn(p, SP["margin"]+6, y2+16, W-12, h2-22, level, t)
    # §3 Now you write
    y3=y2+h2+SP["sectionGap"]; h3=297-SP["margin"]-SP["footerH"]-2 - y3
    panel(p,SP["margin"],y3,W,h3,level)
    section_head(p,SP["margin"]+5,y3+3,3,"Now you write",apply_prompt,level)
    tl,_=traceline(SP["margin"]+8, y3+16, W-16, 6)
    p.append(tl)
    tl2,_=traceline(SP["margin"]+8, y3+16+hw_geom(6)["h"]+SP["lineGap"], W-16, 6)
    p.append(tl2)
    footer(p, level, f"Grammar · page {page_no}")
    return page_close(p)

# ---- activity bodies ------------------------------------------------------
def body_tickgrid(rows, cols, hints):
    def f(p,x,y,w,h,level,t):
        colw=20; first=w-len(cols)*colw
        # header row
        for i,c in enumerate(cols):
            cx=x+first+i*colw+colw/2
            p.append(text(cx,y, c, TYPE["hint"], t["accent"],700,"middle"))
            p.append(text(cx,y+3.4, hints[c], 6.5, INK["faint"],400,"middle"))
        p.append(f'<line x1="{x}" y1="{y+5}" x2="{x+w}" y2="{y+5}" stroke="{t["border"]}" stroke-width="0.5"/>')
        rh=(h-8)/len(rows); ry=y+8
        for r in rows:
            cy=ry+rh/2
            p.append(text(x, cy+TYPE["body"]*PT*0.34, r[0], TYPE["body"], INK["text"]))
            for i,c in enumerate(cols):
                bx=x+first+i*colw+colw/2-3
                p.append(rrect(bx,cy-3,6,6,1,"#ffffff",INK["ruleStrong"],0.4))
            p.append(f'<line x1="{x}" y1="{ry+rh:.2f}" x2="{x+w}" y2="{ry+rh:.2f}" stroke="{INK["rule"]}" stroke-width="0.3"/>')
            ry+=rh
    return f

def body_cloze(bank, rows):
    def f(p,x,y,w,h,level,t):
        # bank band
        bh=34; p.append(rrect(x,y,w,bh,8,t["light"]))
        n=len(bank); gap=w/(n+1)
        for i,word in enumerate(bank):
            p.append(rrect(x+gap*(i+1)-13, y+bh/2-6, 26, 12, 3, "#ffffff", t["border"],0.5))
            p.append(text(x+gap*(i+1), y+bh/2+TYPE["bank"]*PT*0.34, word, TYPE["bank"], t["accent"],700,"middle"))
        # rows
        ry=y+bh+6; rh=(h-bh-6)/len(rows)
        for r in rows:
            cy=ry+rh/2
            p.append(text(x, cy+TYPE["body"]*PT*0.34, r[0], TYPE["body"], INK["text"]))
            bw=len(r[0])*TYPE["body"]*PT*0.52
            p.append(f'<line x1="{x+bw+3}" y1="{cy+2}" x2="{x+bw+3+30}" y2="{cy+2}" stroke="{INK["ruleStrong"]}" stroke-width="0.5"/>')
            p.append(text(x+bw+3+33, cy+TYPE["body"]*PT*0.34, r[1], TYPE["body"], INK["text"]))
            ry+=rh
    return f

def body_build(bank, rows):
    def f(p,x,y,w,h,level,t):
        bh=30; p.append(rrect(x,y,w,bh,8,t["light"]))
        p.append(text(x+5,y+bh/2-1,"Choose",TYPE["instruction"],t["accent"]))
        p.append(text(x+5,y+bh/2+4.5,"a word",TYPE["instruction"],t["accent"]))
        cols=4
        for i,word in enumerate(bank):
            col=i%cols; row=i//cols
            cx=x+28+(w-32)/cols*(col+0.5)
            cyy=y+9+row*13
            p.append(text(cx,cyy,word,TYPE["bank"],INK["text"],400,"middle"))
        ry=y+bh+6; rh=(h-bh-6)/len(rows)
        for base,icon in rows:
            cy=ry+rh/2
            if icon and clip(icon): p.append(img(x,cy-8,16,16,clip(icon)))
            p.append(text(x+19,cy+TYPE["body"]*PT*0.34, base, TYPE["body"], INK["muted"]))
            p.append(text(x+57,cy+TYPE["body"]*PT*0.34,"→",TYPE["body"],t["accent"]))
            tl,_=traceline(x+64,cy-hw_geom(6)["base"]+1,w-64,6); p.append(tl)
            ry+=rh
    return f

def body_circle(targets, rows):
    def f(p,x,y,w,h,level,t):
        kh=12; p.append(rrect(x,y,w,kh,7,t["light"]))
        demos={"adjective":"big","adverb":"quickly"}
        kx=x+12
        for label,mark in targets:
            if mark=="circle":
                p.append(f'<ellipse cx="{kx+8}" cy="{y+kh/2}" rx="9" ry="4.5" fill="none" stroke="{t["accent"]}" stroke-width="0.6"/>')
            else:
                p.append(f'<line x1="{kx}" y1="{y+kh/2+3}" x2="{kx+16}" y2="{y+kh/2+3}" stroke="{t["accent"]}" stroke-width="0.8"/>')
            p.append(text(kx+3,y+kh/2+TYPE["hint"]*PT*0.34,demos[label],TYPE["hint"],INK["text"]))
            p.append(text(kx+20,y+kh/2+TYPE["hint"]*PT*0.34,("Circle the " if mark=="circle" else "Underline the ")+label,TYPE["hint"],INK["muted"]))
            kx=x+w/2+6
        ry=y+kh+6; rh=(h-kh-6)/len(rows)
        for r in rows:
            cy=ry+rh/2
            p.append(text(x+2,cy+TYPE["body"]*PT*0.34,r,TYPE["example"],INK["text"]))
            ry+=rh
    return f

def body_match(pairs):
    def f(p,x,y,w,h,level,t):
        order=[2,3,1,4,0]  # scrambled right column
        rights=[pairs[i%len(pairs)][1] for i in order][:len(pairs)]
        cw=70; rh=h/len(pairs)
        for i,(l,_r) in enumerate(pairs):
            cy=y+i*rh+rh/2
            p.append(rrect(x,cy-6.5,cw,13,3,"#ffffff",t["border"],0.5))
            p.append(text(x+5,cy+TYPE["body"]*PT*0.34,l,TYPE["body"],INK["text"]))
            p.append(f'<circle cx="{x+cw-4}" cy="{cy}" r="1.4" fill="{t["primary"]}"/>')
            rx=x+w-cw
            p.append(rrect(rx,cy-6.5,cw,13,3,"#ffffff",t["border"],0.5))
            p.append(f'<circle cx="{rx+4}" cy="{cy}" r="1.4" fill="{t["primary"]}"/>')
            p.append(text(rx+9,cy+TYPE["body"]*PT*0.34,rights[i],TYPE["body"],INK["text"]))
            ry=cy
    return f

def body_rewrite(rows):
    def f(p,x,y,w,h,level,t):
        rh=h/len(rows)
        for bad,_good in rows:
            cy=y+(rows.index((bad,_good)))*rh
            p.append(rrect(x,cy+1,w,9,3,t["light"]))
            p.append(text(x+4,cy+7,bad,14.5,INK["muted"]))
            tl,_=traceline(x,cy+12,w,5.5); p.append(tl)
    return f

# ---- non-unit pages -------------------------------------------------------
def page_cover():
    t=THEME[6]; p=page_open()
    p.append(rrect(0,0,210,180,0,t["primary"]))
    p.append(rrect(0,150,210,40,0,t["primary"]))  # ensure straight bottom (no wave)
    m=b64(HERO)
    if m:
        p.append(rrect(64,52,82,82,10,"#ffffff"))
        p.append(img(67,55,76,76,m))
    p.append(text(105,165,"Grammar",40,"#ffffff",700,"middle"))
    p.append(text(105,178,"Level 6 · Building Fluency",TYPE["section"],"#E7E7FB",400,"middle"))
    p.append(text(105,212,"Worksheet Pack",TYPE["section"],INK["muted"],400,"middle"))
    p.append(text(105,224,"Statement · question · command · exclamation · noun phrases · joining words · tense",TYPE["hint"],INK["faint"],400,"middle"))
    p.append(text(105,280,"MyPhonicsBooks · myphonicsbooks.co.uk",TYPE["footer"],INK["muted"],400,"middle"))
    return page_close(p)

def page_contents():
    t=THEME[6]; p=page_open()
    header_bar(p,6,"Contents","Grammar",grapheme=None)
    items=[("How this pack works","3"),("Phonics reference: the Sound a","4"),
           ("Four kinds of sentence","5"),("Make the noun phrase grow","6"),
           ("Joining with and, but, or, so","7"),("Joining with when, if, that, because","8"),
           ("Adjectives and adverbs","9"),("Apostrophes for contractions","10"),
           ("Keep the tense the same","11"),("Answers","12"),("Well done!","13")]
    y=50
    for name,no in items:
        p.append(text(SP["margin"]+6,y,name,TYPE["body"],INK["text"]))
        p.append(text(SP["margin"]+W-6,y,no,TYPE["body"],t["accent"],700,"end"))
        p.append(f'<line x1="{SP["margin"]+6}" y1="{y+3}" x2="{SP["margin"]+W-6}" y2="{y+3}" stroke="{INK["rule"]}" stroke-width="0.2" stroke-dasharray="0.8 1.2"/>')
        y+=14
    footer(p,6,"Grammar · page 2")
    return page_close(p)

def page_howto():
    t=THEME[6]; p=page_open()
    header_bar(p,6,"How this pack works","Grammar")
    steps=[("I do","Watch first. The grown-up reads the worked example at the top and says how it works."),
           ("We do","Do the first one together. Talk about the answer before writing."),
           ("You do","The child finishes the rest on their own, then writes their own sentence at the foot.")]
    y=50
    for n,(h,d) in enumerate(steps,1):
        panel(p,SP["margin"],y,W,26,6)
        p.append(f'<circle cx="{SP["margin"]+12}" cy="{y+13}" r="6" fill="{t["primary"]}"/>')
        p.append(text(SP["margin"]+12,y+13+4,str(n),16,"#ffffff",700,"middle"))
        p.append(text(SP["margin"]+24,y+11,h,TYPE["section"],INK["text"],700))
        p.append(text(SP["margin"]+24,y+19,d,TYPE["instruction"],INK["muted"]))
        y+=32
    p.append(text(SP["margin"]+6,y+8,"Say it. Tap it. Write it. Check it.",TYPE["section"],t["accent"],700))
    p.append(text(SP["margin"]+6,y+16,"Every sentence is decodable at Level 6 and ties to the Level 6 books.",TYPE["instruction"],INK["muted"]))
    footer(p,6,"Grammar · page 3")
    return page_close(p)

def page_sound_a():
    level=1; t=THEME[level]; p=page_open()
    header_bar(p,level,"The Sound a","Phonics",grapheme="a")
    # §1 trace letter
    y1=SP["margin"]+SP["headerH"]+SP["afterHeader"]; h1=34
    panel(p,SP["margin"],y1,W,h1,level)
    section_head(p,SP["margin"]+5,y1+3,1,"Trace the Letter a","Trace it. Then write some on your own.",level)
    tl,_=traceline(SP["margin"]+8,y1+16,W-16,8,model="a",trace="a a a a"); p.append(tl)
    # §2 trace words
    y2=y1+h1+SP["sectionGap"]; h2=120
    panel(p,SP["margin"],y2,W,h2,level)
    section_head(p,SP["margin"]+5,y2+3,2,"Trace the Words","Trace each word. Then write it on your own.",level)
    words=[("cat","cat"),("hat","hat"),("mat","mat"),("pan","pan"),("bag","bag")]
    ry=y2+16; rh=(h2-20)/len(words)
    for w_,img_ in words:
        picW=26; trW=(W-12-picW-8)/2
        if clip(img_): p.append(img(SP["margin"]+6,ry+rh/2-9,18,18,clip(img_)))
        tl,_=traceline(SP["margin"]+6+picW, ry+rh/2-hw_geom(7)["base"]+1, trW, 7, trace=f"{w_}  {w_}"); p.append(tl)
        tl2,_=traceline(SP["margin"]+6+picW+trW+8, ry+rh/2-hw_geom(7)["base"]+1, trW, 7); p.append(tl2)
        ry+=rh
    # §3 missing
    y3=y2+h2+SP["sectionGap"]; h3=297-SP["margin"]-SP["footerH"]-2-y3
    panel(p,SP["margin"],y3,W,h3,level)
    section_head(p,SP["margin"]+5,y3+3,3,"Write the Missing a","What letter is missing? Write the a.",level)
    miss=[("rat","r_t","rat"),("jam","j_m","jam"),("ant","_nt","ant"),("tap","t_p","tap")]
    cw=(W-12-3*4)/4
    for i,(word,shown,im) in enumerate(miss):
        cx=SP["margin"]+6+i*(cw+4)
        p.append(rrect(cx,y3+16,cw,h3-22,4,"#ffffff",t["border"],0.5))
        if clip(im): p.append(img(cx+cw/2-9,y3+19,18,18,clip(im)))
        # missing-word: visible letters with a blank where the a goes (optical centre)
        left,right=shown.split("_")
        fs_pt=20; cwid=fs_pt*PT*0.60
        total=(len(left)+1+len(right))*cwid
        sx=cx+cw/2-total/2; base=y3+16+(h3-22)-4
        p.append(text(sx,base,left,fs_pt,INK["text"],700,"start"))
        gx=sx+len(left)*cwid
        p.append(f'<line x1="{gx+0.6}" y1="{base+1}" x2="{gx+cwid-0.6}" y2="{base+1}" stroke="{INK["ruleStrong"]}" stroke-width="0.6"/>')
        p.append(text(gx+cwid,base,right,fs_pt,INK["text"],700,"start"))
    footer(p,level,"Single Sound · a")
    return page_close(p)

def page_answers():
    p=page_open(); header_bar(p,6,"Answers","Grammar")
    ans=[("Four kinds of sentence","Statement: 1, 5. Question: 2, 6. Command: 3. Exclamation: 4. A command tells you to do something; an exclamation starts with What or How and has a verb."),
         ("Make the noun phrase grow","the big brown owl · the new blue glue · the soft purple purse · the bare brown branch · the soft fluffy owlets (any sensible adjective from the bank is fine)."),
         ("Joining with and, but, or, so","but (shown) · so · and · or · so."),
         ("Joining with when, if, that, because","because (shown) · if · that · because · when."),
         ("Adjectives and adverbs","brown/quickly (shown) · bare/gently · new/fast · purple/safely · cross/quickly."),
         ("Apostrophes for contractions","I am=I'm · it is=it's · did not=didn't · we are=we're · can not=can't."),
         ("Keep the tense the same","turned · stuck · ran · gave · slipped (the second verb back into the past).")]
    y=46
    for h,d in ans:
        p.append(text(SP["margin"]+6,y,h,TYPE["instruction"],THEME[6]["accent"],700))
        # wrap
        words=d.split(); line=""; yy=y+6
        for wd in words:
            if len(line)+len(wd)>92:
                p.append(text(SP["margin"]+6,yy,line,TYPE["hint"],INK["muted"])); line=wd; yy+=5
            else: line=(line+" "+wd).strip()
        p.append(text(SP["margin"]+6,yy,line,TYPE["hint"],INK["muted"]))
        y=yy+10
    footer(p,6,"Grammar · page 12")
    return page_close(p)

def page_certificate():
    t=THEME[6]; p=page_open()
    p.append(rrect(12,12,186,273,8,"#ffffff",t["primary"],1.2))
    p.append(rrect(16,16,178,265,6,"#ffffff",t["border"],0.5))
    m=b64(HERO)
    if m: p.append(img(85,40,40,40,m))
    p.append(text(105,100,"Well done!",36,t["accent"],700,"middle"))
    p.append(text(105,118,"has finished the Level 6 Grammar pack",TYPE["section"],INK["text"],400,"middle"))
    p.append(f'<line x1="55" y1="150" x2="155" y2="150" stroke="{INK["ruleStrong"]}" stroke-width="0.5"/>')
    p.append(text(105,156,"name",TYPE["hint"],INK["faint"],400,"middle"))
    p.append(text(105,200,"Statements, questions, commands, exclamations, noun phrases,",TYPE["instruction"],INK["muted"],400,"middle"))
    p.append(text(105,208,"joining words, contractions and keeping the tense the same.",TYPE["instruction"],INK["muted"],400,"middle"))
    p.append(text(105,265,"MyPhonicsBooks",TYPE["section"],t["primary"],700,"middle"))
    return page_close(p)

# ---- assemble -------------------------------------------------------------
mascot=b64(HERO)
pages=[]
pages.append(("01_cover",page_cover()))
pages.append(("02_contents",page_contents()))
pages.append(("03_howto",page_howto()))
pages.append(("04_sound_a",page_sound_a()))

pages.append(("05_g1", grammar_frame(6,"Four kinds of sentence",mascot,
    "How high the brown owl flew!","Exclamation",
    "An exclamation starts with What or How, has a subject and a verb, and ends on an action word.",
    "Tick the kind each sentence is",
    body_tickgrid([("The owl sat on a bare branch.",),("What was that noise?",),("Look up at the tree!",),
                   ("What a loud howl the owl made!",),("The owl stared down at me.",),("Can we go and look?",)],
                  ["Statement","Question","Command","Exclamation"],
                  {"Statement":"tells you something","Question":"asks something","Command":"tells you to do it","Exclamation":"shows strong feeling"}),
    "a command about the owl.",5)))

pages.append(("06_g2", grammar_frame(6,"Make the noun phrase grow",mascot,
    "the owl","the big brown owl","",
    "Write each noun phrase again, grown bigger",
    body_build(["brown","new","blue","bare","soft","fluffy","big","purple"],
               [("the glue","glue"),("the purse","purse"),("the branch","branch"),("the owlets","owl")]),
    "a big noun phrase about an owl.",6)))

pages.append(("07_g3", grammar_frame(6,"Joining with and, but, or, so",mascot,
    "He turned to look ___ he did not see the wet patch.","but","",
    "Write the best joining word in each gap",
    body_cloze(["and","but","or","so"],
               [("The glue was wet","it stuck to her hand."),("She drew a bird","she gave the card to Mum."),
                ("We can use glue","we can use tape."),("The cup fell","the tea ran on the rug.")]),
    "a sentence using so.",7)))

pages.append(("08_g4", grammar_frame(6,"Joining with when, if, that, because",mascot,
    "I was glad ___ I found my purple purse.","because","",
    "Write the best joining word in each gap",
    body_cloze(["when","if","that","because"],
               [("We can see the owl","we stay still."),("I think","the owl is rare."),
                ("The owlets cheep","they want food."),("We set off down the path","it got dark.")]),
    "a sentence using because.",8)))

pages.append(("09_g5", grammar_frame(6,"Adjectives and adverbs",mascot,
    "The brown owl flew quickly.","quick + ly","",
    "Circle the adjective. Underline the adverb.",
    body_circle([("adjective","circle"),("adverb","underline")],
                ["The bare branch swayed gently.","The new glue stuck fast.",
                 "The purple purse sat safely in her bag.","The cross cat ran off quickly."]),
    "a sentence with an adjective and an adverb.",9)))

pages.append(("10_g6", grammar_frame(6,"Apostrophes for contractions",mascot,
    "do not","don't","",
    "Draw a line to join each pair to its short form",
    body_match([("I am","I'm"),("it is","it's"),("did not","didn't"),("we are","we're"),("can not","can't")]),
    "a sentence using it's about the owl.",10)))

pages.append(("11_g7", grammar_frame(6,"Keep the tense the same",mascot,
    "I turn out my pockets and found my purse.","I turned out my pockets and found my purse.","",
    "Rewrite each one all in the past tense",
    body_rewrite([("The card flew off and stick to the cat.","stuck"),("The cat grew cross and run off.","ran"),
                  ("She drew a bird and give it to Mum.","gave"),("Dad turned to look and slips over.","slipped")]),
    "what happened next in the past tense.",11)))

pages.append(("12_answers",page_answers()))
pages.append(("13_certificate",page_certificate()))

imgs=[]
for name,svg in pages:
    png=f"{OUT}/{name}.png"
    cairosvg.svg2png(bytestring=svg.encode(),write_to=png,output_width=1240,output_height=1754)
    imgs.append(Image.open(png).convert("RGB"))
pdf=f"{ENG}/output/grammar_L6_REBUILT.pdf"
imgs[0].save(pdf,save_all=True,append_images=imgs[1:])
print("PAGES",len(pages)); print("PDF",pdf)
