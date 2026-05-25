"""Copy confirmed worksheet PNGs to Drive and build A4 PDFs (individual + bundled).

Drive layout (auto-syncs):
  G:/My Drive/MyPhonicsBooks/07_TPT/Worksheets/L1/1_1_Tap_Tap_Tap_Pack/
      01_sound_hunt.png          + 01_sound_hunt.pdf
      02_tap_the_sounds.png      + 02_tap_the_sounds.pdf
      03_read_and_do.png         + 03_read_and_do.pdf
      04_alien_word_mission.png  + 04_alien_word_mission.pdf
      05_story_and_draw.png      + 05_story_and_draw.pdf
      Tap_Tap_Tap_Pack.pdf       (bundled 5-page)

  G:/My Drive/MyPhonicsBooks/07_TPT/Worksheets/Sound_Pack/
      sound_s.png .. sound_n.png + matching single-page PDFs
      SATPIN_Sound_Pack.pdf      (bundled 6-page)
"""
from __future__ import annotations

import shutil
from pathlib import Path
from PIL import Image
from pypdf import PdfReader, PdfWriter

REPO = Path(__file__).resolve().parents[2]
SRC = REPO / "marketing-mockups" / "worksheet images" / "v2"
DRIVE = Path("G:/My Drive/MyPhonicsBooks/07_TPT/Worksheets")
PUBLIC = REPO / "public" / "worksheets"
BOOK_DST = DRIVE / "L1" / "1_1_Tap_Tap_Tap_Pack"
SOUND_DST = DRIVE / "Sound_Pack"
# Mirrored web-served locations (used by src/components/WorksheetsPanel.tsx)
WEB_BOOK_DST = PUBLIC / "L1" / "1_1_Tap_Tap_Tap_Pack"
WEB_SOUND_DST = PUBLIC / "Sound_Pack"
for d in (BOOK_DST, SOUND_DST, WEB_BOOK_DST, WEB_SOUND_DST):
    d.mkdir(parents=True, exist_ok=True)

# A4 at 300 dpi: 210mm × 297mm = 2480 × 3508 px (close enough).
A4_W, A4_H = 2480, 3508  # px at 300 dpi

# Confirmed per-book pack: src filename -> (clean output stem, bookmark title)
BOOK_PACK = [
    ("worksheet_01_tap_sound_hunt_v5.png",      "01_sound_hunt",         "1. Tap! Tap! Sound Hunt"),
    ("worksheet_02_tap_the_sounds_v1.png",      "02_tap_the_sounds",     "2. Tap the Sounds"),
    ("worksheet_03_read_and_do_v2.png",         "03_read_and_do",        "3. Read and Do"),
    ("worksheet_04_alien_word_mission_v1.png",  "04_alien_word_mission", "4. Alien Word Mission"),
    ("worksheet_05_story_and_draw_v1.png",      "05_story_and_draw",     "5. Story and Draw"),
]

# Single-sound pack
SOUND_PACK = [
    ("sound_s_v4.png", "sound_s", "The Sound s"),
    ("sound_a_v3.png", "sound_a", "The Sound a"),
    ("sound_t_v1.png", "sound_t", "The Sound t"),
    ("sound_p_v2.png", "sound_p", "The Sound p"),
    ("sound_i_v2.png", "sound_i", "The Sound i"),
    ("sound_n_v1.png", "sound_n", "The Sound n"),
]


def png_to_a4(img: Image.Image) -> Image.Image:
    """Centre image on A4 portrait canvas, preserving aspect ratio."""
    img = img.convert("RGB")
    scale = min(A4_W / img.width, A4_H / img.height)
    new_w = int(img.width * scale)
    new_h = int(img.height * scale)
    resized = img.resize((new_w, new_h), Image.LANCZOS)
    canvas = Image.new("RGB", (A4_W, A4_H), "white")
    canvas.paste(resized, ((A4_W - new_w) // 2, (A4_H - new_h) // 2))
    return canvas


def export(spec: list[tuple[str, str, str]], dst: Path, bundle_name: str | None) -> list[Path]:
    """Copy PNGs, write A4 PDFs, and bundle with bookmarks. Returns the PDF paths."""
    pdfs: list[Path] = []
    a4_pages: list[Image.Image] = []
    bookmarks: list[str] = []
    for src_name, out_stem, title in spec:
        src = SRC / src_name
        if not src.exists():
            # Fall back to an existing Drive PNG (earlier manual copy).
            fallback = dst / f"{out_stem}.png"
            if fallback.exists():
                src = fallback
                print(f"  (using existing Drive PNG: {out_stem}.png)")
            else:
                print(f"  SKIP (missing): {src_name}")
                continue
        # PNG copy (skip if src already IS the destination)
        dst_png = dst / f"{out_stem}.png"
        if src.resolve() != dst_png.resolve():
            shutil.copy2(src, dst_png)
        # A4 PDF
        with Image.open(src) as img:
            page = png_to_a4(img)
            pdf_path = dst / f"{out_stem}.pdf"
            page.save(pdf_path, "PDF", resolution=300.0)
            pdfs.append(pdf_path)
            a4_pages.append(page)
            bookmarks.append(title)
            print(f"  OK {out_stem}.png + .pdf")
    # Bundled multi-page PDF with clickable bookmarks
    if bundle_name and a4_pages:
        bundle_path = dst / f"{bundle_name}.pdf"
        # Step 1: write the multi-page PDF
        a4_pages[0].save(
            bundle_path, "PDF",
            save_all=True,
            append_images=a4_pages[1:],
            resolution=300.0,
        )
        # Step 2: add bookmarks + set the reader to show the bookmark sidebar on open
        reader = PdfReader(str(bundle_path))
        writer = PdfWriter()
        for p in reader.pages:
            writer.add_page(p)
        for i, title in enumerate(bookmarks):
            writer.add_outline_item(title, i)
        # /UseOutlines = open the document with the bookmarks panel visible
        writer.page_mode = "/UseOutlines"
        with open(bundle_path, "wb") as fh:
            writer.write(fh)
        pdfs.append(bundle_path)
        print(f"  OK {bundle_name}.pdf  ({len(a4_pages)} pages, {len(bookmarks)} bookmarks)")
    return pdfs


def mirror_to_web(drive_dst: Path, web_dst: Path) -> None:
    """Copy the just-built PDFs (and PNG thumbnails for previews) from Drive to public/."""
    for src in drive_dst.glob("*.pdf"):
        shutil.copy2(src, web_dst / src.name)
    for src in drive_dst.glob("*.png"):
        shutil.copy2(src, web_dst / src.name)
    print(f"  mirrored {drive_dst.name} -> {web_dst.relative_to(REPO)}")


def main() -> None:
    print(f"\nPer-book pack -> {BOOK_DST}")
    export(BOOK_PACK, BOOK_DST, "Tap_Tap_Tap_Pack")
    print(f"\nSingle-sound pack -> {SOUND_DST}")
    export(SOUND_PACK, SOUND_DST, "SATPIN_Sound_Pack")
    print("\nMirroring to web /public for the WorksheetsPanel UI...")
    mirror_to_web(BOOK_DST, WEB_BOOK_DST)
    mirror_to_web(SOUND_DST, WEB_SOUND_DST)
    print("\nDone.")


if __name__ == "__main__":
    main()
