"""
Build a visual showcase PDF for Manus AI.

Includes:
- Brand guidelines (text)
- Hero reference characters (all levels)
- Book cover samples
- Interior page samples (story pages, activities, reference pages)
- Marketing mockups (v1 + v2)
- Full example book (L3.2 Lost at the Night Market)
"""

import os
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak,
    Table, TableStyle, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

BASE = Path(__file__).parent.parent
ROOT = BASE.parent  # myphonicsbooks/
OUTPUT = BASE / "output"
IMAGES = OUTPUT / "images"
BOOKS = OUTPUT / "books"
MARKETING = ROOT / "marketing-mockups"
COVERS = ROOT / "public" / "covers"
BOOK_PAGES = ROOT / "public" / "book-pages"

OUT_PDF = OUTPUT / "MyPhonicsBooks_Visual_Showcase.pdf"

# Level colours
LEVEL_COLOURS = {
    1: "#E84B8A", 2: "#F59E0B", 3: "#22C55E",
    4: "#3B82F6", 5: "#8B5CF6", 6: "#14B8A6",
}

LEVEL_NAMES = {
    1: "Starting Stories", 2: "Longer Sounds", 3: "New Spellings",
    4: "Building Fluency", 5: "Reading Together", 6: "Reading Champion",
}


def build_pdf():
    doc = SimpleDocTemplate(
        str(OUT_PDF), pagesize=A4,
        leftMargin=15*mm, rightMargin=15*mm,
        topMargin=15*mm, bottomMargin=15*mm,
    )
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle', parent=styles['Title'],
        fontSize=28, spaceAfter=6*mm, textColor=HexColor("#312e81"),
        fontName='Helvetica-Bold',
    )
    h1 = ParagraphStyle(
        'H1', parent=styles['Heading1'],
        fontSize=22, spaceAfter=4*mm, spaceBefore=8*mm,
        textColor=HexColor("#312e81"), fontName='Helvetica-Bold',
    )
    h2 = ParagraphStyle(
        'H2', parent=styles['Heading2'],
        fontSize=16, spaceAfter=3*mm, spaceBefore=5*mm,
        textColor=HexColor("#475569"), fontName='Helvetica-Bold',
    )
    body = ParagraphStyle(
        'Body', parent=styles['Normal'],
        fontSize=10, spaceAfter=2*mm, leading=14,
        textColor=HexColor("#0f172a"),
    )
    caption = ParagraphStyle(
        'Caption', parent=styles['Normal'],
        fontSize=8, alignment=TA_CENTER, textColor=HexColor("#64748b"),
        spaceAfter=3*mm,
    )
    center_body = ParagraphStyle(
        'CenterBody', parent=body, alignment=TA_CENTER,
    )

    elements = []

    def add_image(path, width=None, height=None, cap=None):
        """Add an image if it exists."""
        p = Path(path)
        if not p.exists():
            return
        if width and height:
            elements.append(Image(str(p), width=width, height=height))
        elif width:
            elements.append(Image(str(p), width=width))
        else:
            elements.append(Image(str(p), width=80*mm))
        if cap:
            elements.append(Paragraph(cap, caption))

    def add_image_row(paths, width_each, captions=None, max_height=None):
        """Add images side by side in a table."""
        mh = max_height or 180*mm
        imgs = []
        caps = []
        for i, p in enumerate(paths):
            pp = Path(p)
            if pp.exists():
                img = Image(str(pp), width=width_each)
                iw, ih = img.wrap(0, 0)
                if ih > mh:
                    ratio = mh / ih
                    img = Image(str(pp), width=width_each * ratio, height=mh)
                imgs.append(img)
                if captions and i < len(captions):
                    caps.append(Paragraph(captions[i], caption))
                else:
                    caps.append(Paragraph(pp.stem, caption))
            else:
                imgs.append(Paragraph("(missing)", body))
                caps.append(Paragraph("", caption))

        if imgs:
            t = Table([imgs, caps], colWidths=[width_each + 5*mm] * len(imgs))
            t.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            elements.append(t)

    # ═══════════════════════════════════════════════════════════════
    # COVER PAGE
    # ═══════════════════════════════════════════════════════════════
    elements.append(Spacer(1, 40*mm))
    elements.append(Paragraph("MyPhonicsBooks", title_style))
    elements.append(Paragraph("Visual Showcase & Brand Reference", h2))
    elements.append(Spacer(1, 10*mm))
    elements.append(Paragraph(
        "Decodable phonics books for children aged 4-8.<br/>"
        "Every book is a window into a different contemporary culture.<br/>"
        "Print-ready A5 PDFs generated from templates.",
        center_body
    ))
    elements.append(Spacer(1, 10*mm))

    # Level colour bar
    colour_data = []
    for lvl in range(1, 7):
        colour_data.append(Paragraph(
            f"<b>L{lvl}</b><br/>{LEVEL_NAMES[lvl]}",
            ParagraphStyle('lc', parent=caption, textColor=white, fontSize=7)
        ))
    ct = Table([colour_data], colWidths=[28*mm]*6, rowHeights=[14*mm])
    ct.setStyle(TableStyle([
        ('BACKGROUND', (i, 0), (i, 0), HexColor(LEVEL_COLOURS[i+1])) for i in range(6)
    ] + [
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOX', (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
    ]))
    elements.append(ct)
    elements.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════
    # BRAND GUIDELINES SUMMARY
    # ═══════════════════════════════════════════════════════════════
    elements.append(Paragraph("Brand Guidelines", h1))

    elements.append(Paragraph("<b>Mission:</b> Every child deserves a reading book matched to exactly what they can decode today.", body))
    elements.append(Paragraph("<b>Tagline:</b> <i>Decodable phonics books. Print at home.</i>", body))
    elements.append(Paragraph("<b>Brand personality:</b> Warm, encouraging, knowledgeable — like a friendly Year 1 teacher at pick-up time.", body))
    elements.append(Spacer(1, 3*mm))

    elements.append(Paragraph("Voice & Tone", h2))
    elements.append(Paragraph("British English throughout. Lead with the child, not the product. Speak to parents as partners. Warm but credible: friendly teacher, not corporate marketing.", body))
    elements.append(Spacer(1, 2*mm))

    elements.append(Paragraph("Visual Identity", h2))
    elements.append(Paragraph("<b>Primary accent:</b> Deep indigo #312e81 | <b>Gradient:</b> indigo-600 to violet-600 | <b>Body font:</b> Plus Jakarta Sans | <b>Headings:</b> Outfit | <b>Book font:</b> Andika (single-storey a and g)", body))
    elements.append(Spacer(1, 2*mm))

    elements.append(Paragraph("Art Style", h2))
    elements.append(Paragraph("Whimsical children's book illustration. Hand-drawn cartoon style with soft watercolour textured backgrounds and clean black-outlined characters. Eyes are small solid black dots — no iris, no highlight. Each book features a different culture and setting.", body))
    elements.append(Spacer(1, 2*mm))

    elements.append(Paragraph("Ad Copy Formula", h2))
    elements.append(Paragraph("<b>Pain → Solution → Proof → CTA</b><br/><i>\"Struggling to find books at the right level? MyPhonicsBooks creates stories using only the sounds they've been taught. Every word is checked against the UK phonics curriculum. Get a free book →\"</i>", body))
    elements.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════
    # HERO REFERENCE CHARACTERS
    # ═══════════════════════════════════════════════════════════════
    elements.append(Paragraph("Character Gallery — Hero References", h1))
    elements.append(Paragraph("Each book has a unique hero character. These are the reference images used to maintain consistency across all pages.", body))
    elements.append(Spacer(1, 3*mm))

    # Grid of heroes — 3 per row
    hero_folders = sorted(IMAGES.glob("L*_B1"))
    hero_paths = []
    hero_caps = []
    for f in hero_folders:
        hp = f / "hero_reference.png"
        if hp.exists():
            hero_paths.append(hp)
            # Extract level info
            name = f.name  # e.g. L3_2_B1
            parts = name.replace("L","").replace("_B1","").split("_")
            hero_caps.append(f"L{parts[0]}.{parts[1]}")

    # Show in rows of 5
    img_w = 32*mm
    for i in range(0, len(hero_paths), 5):
        batch_paths = hero_paths[i:i+5]
        batch_caps = hero_caps[i:i+5]
        add_image_row(batch_paths, img_w, batch_caps, max_height=40*mm)
        elements.append(Spacer(1, 2*mm))

    elements.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════
    # BOOK COVERS
    # ═══════════════════════════════════════════════════════════════
    elements.append(Paragraph("Book Covers — Sample Selection", h1))
    elements.append(Paragraph("Covers across all 6 levels showing the colour-coded level system and diverse cultural settings.", body))
    elements.append(Spacer(1, 3*mm))

    cover_files = sorted(COVERS.glob("*_cover.jpg"))
    cover_w = 35*mm
    for i in range(0, len(cover_files), 5):
        batch = cover_files[i:i+5]
        caps = [f.stem.replace("_cover","").replace("_",".") for f in batch]
        add_image_row(batch, cover_w, caps, max_height=50*mm)
        elements.append(Spacer(1, 2*mm))

    elements.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════
    # INTERIOR PAGES — L3.2 Night Market (full book)
    # ═══════════════════════════════════════════════════════════════
    elements.append(Paragraph("Full Book Example — L3.2 \"Lost at the Night Market\"", h1))
    elements.append(Paragraph("Complete 24-page book showing all page types: cover, guide, reference, story pages, activities, writing, nonsense words, certificate, back cover.", body))
    elements.append(Spacer(1, 3*mm))

    bp = BOOK_PAGES / "3_2"
    page_w = 75*mm
    for i in range(1, 25, 2):
        p1 = bp / f"p{i}.jpg"
        p2 = bp / f"p{i+1}.jpg"
        paths = [p for p in [p1, p2] if p.exists()]
        caps = [f"Page {i}", f"Page {i+1}"]
        if paths:
            add_image_row(paths, page_w, caps[:len(paths)], max_height=100*mm)
            elements.append(Spacer(1, 2*mm))

    elements.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════
    # INTERIOR PAGES — sample from other books
    # ═══════════════════════════════════════════════════════════════
    elements.append(Paragraph("Interior Page Samples — Other Books", h1))
    elements.append(Paragraph("Selected pages from across the series showing different levels, cultures, and page types.", body))
    elements.append(Spacer(1, 3*mm))

    # A few sample interior pages from different books
    sample_pages = [
        (BOOK_PAGES / "1_3" / "p1.jpg", "L1.3 Cover — The Fish in the Tank"),
        (BOOK_PAGES / "1_3" / "p5.jpg", "L1.3 Story page"),
        (BOOK_PAGES / "2_1" / "p1.jpg", "L2.1 Cover — The Night Light (Japan)"),
        (BOOK_PAGES / "2_3" / "p1.jpg", "L2.3 Cover — Morning on the Farm (Kenya)"),
        (BOOK_PAGES / "4_1" / "p1.jpg", "L4.1 Cover — The Purple Purse (Turkey)"),
        (BOOK_PAGES / "5_1" / "p1.jpg", "L5.1 Cover — Before the Shore (London)"),
        (BOOK_PAGES / "6_1" / "p1.jpg", "L6.1 Cover — The Marvellous Neighbourhood (Egypt)"),
    ]

    for i in range(0, len(sample_pages), 3):
        batch = sample_pages[i:i+3]
        paths = [p for p, _ in batch]
        caps = [c for _, c in batch]
        add_image_row(paths, 50*mm, caps, max_height=70*mm)
        elements.append(Spacer(1, 2*mm))

    elements.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════
    # MARKETING MOCKUPS
    # ═══════════════════════════════════════════════════════════════
    elements.append(Paragraph("Marketing Mockups — Social Media Ads", h1))

    # V1
    elements.append(Paragraph("Version 1 — Instagram & Facebook", h2))
    v1_files = sorted(MARKETING.glob("*.png"))
    for i in range(0, len(v1_files), 3):
        batch = v1_files[i:i+3]
        caps = [f.stem.replace("_"," ") for f in batch]
        add_image_row(batch, 55*mm, caps, max_height=80*mm)
        elements.append(Spacer(1, 2*mm))

    elements.append(PageBreak())

    # V2
    elements.append(Paragraph("Version 2 — Targeted Ads", h2))
    v2_dir = MARKETING / "v2"
    if v2_dir.exists():
        v2_files = sorted(v2_dir.glob("*.png"))
        for i in range(0, len(v2_files), 3):
            batch = v2_files[i:i+3]
            caps = [f.stem.replace("_"," ") for f in batch]
            add_image_row(batch, 55*mm, caps, max_height=80*mm)
            elements.append(Spacer(1, 2*mm))

    elements.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════
    # CURRICULUM OVERVIEW
    # ═══════════════════════════════════════════════════════════════
    elements.append(Paragraph("Curriculum Overview — 32 Books Across 6 Levels", h1))
    elements.append(Spacer(1, 3*mm))

    books_data = [
        ["Level", "Books", "Focus", "Cultures"],
        ["L1 Starting Stories", "10", "All Set 1 sounds (36 graphemes)", "UK, Nepal, Pakistan, Trinidad, Middle East"],
        ["L2 Longer Sounds", "5", "Long vowels (ay, ee, igh, ow, oo, ar, or, air, ir, ou, oy)", "Japan, Zoo, Kenya, UK Fair, Iceland"],
        ["L3 New Spellings", "5", "Split digraphs (a-e, i-e, o-e, u-e) + alternatives", "France, Thailand, Ghana, South Korea, Trinidad"],
        ["L4 Building Fluency", "4", "Complex vowels (ur, er, are, ew, ue)", "Turkey, UK Woodland, Mexico, Malaysia"],
        ["L5 Reading Together", "4", "Final Set 3 (ore, oor, ire, ear, ure, tion)", "London Jewish, Sweden, India, Brazil"],
        ["L6 Reading Champion", "4", "Suffixes (ous, able, ible, cious, tious)", "Egypt, China, Italy, Australia"],
    ]

    bt = Table(books_data, colWidths=[35*mm, 12*mm, 55*mm, 70*mm])
    bt.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor("#312e81")),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(bt)

    # Build
    doc.build(elements)
    print(f"\nShowcase PDF saved: {OUT_PDF}")
    print(f"Size: {OUT_PDF.stat().st_size / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    build_pdf()
