"""Copy confirmed worksheet PNGs to Drive + public/, building A4 PDFs (individual + bundled).

Drive layout:
  G:/My Drive/MyPhonicsBooks/07_TPT/Worksheets/L1/1_1_Tap_Tap_Tap_Pack/   (book pack)
  G:/My Drive/MyPhonicsBooks/07_TPT/Worksheets/L1/1_2_Mud_on_Dog_Pack/    (book pack)
  G:/My Drive/MyPhonicsBooks/07_TPT/Worksheets/Sound_Pack/                (SATPIN)
  G:/My Drive/MyPhonicsBooks/07_TPT/Worksheets/Sound_Pack_MDGO/           (m d g o)

Each pack contains:
  - individual {stem}.png + {stem}.pdf for every sheet
  - one bundled multi-page PDF named after the pack (with clickable bookmarks)

Mirrored to public/worksheets/ so the WorksheetsPanel React component serves them.
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

# A4 at 300 dpi: 210mm × 297mm = 2480 × 3508 px (close enough).
A4_W, A4_H = 2480, 3508


# Each pack: src filename -> (clean output stem, bookmark title)
L11_BOOK = [
    ("worksheet_01_tap_sound_hunt_v5.png",      "01_sound_hunt",         "1. Tap! Tap! Sound Hunt"),
    ("worksheet_02_tap_the_sounds_v1.png",      "02_tap_the_sounds",     "2. Tap the Sounds"),
    ("worksheet_03_read_and_do_v2.png",         "03_read_and_do",        "3. Read and Do"),
    ("worksheet_04_alien_word_mission_v1.png",  "04_alien_word_mission", "4. Alien Word Mission"),
    ("worksheet_05_story_and_draw_v1.png",      "05_story_and_draw",     "5. Story and Draw"),
]

SATPIN_SOUNDS = [
    ("sound_s_v4.png", "sound_s", "The Sound s"),
    ("sound_a_v3.png", "sound_a", "The Sound a"),
    ("sound_t_v1.png", "sound_t", "The Sound t"),
    ("sound_p_v2.png", "sound_p", "The Sound p"),
    ("sound_i_v2.png", "sound_i", "The Sound i"),
    ("sound_n_v1.png", "sound_n", "The Sound n"),
]

L12_BOOK = [
    ("l12_worksheet_01_sound_hunt_v1.png",      "01_sound_hunt",         "1. Sound Hunt: m d g o"),
    ("l12_worksheet_02_trace_and_write_v1.png", "02_trace_and_write",    "2. Trace and Write"),
    ("l12_worksheet_03_read_and_do_v1.png",     "03_read_and_do",        "3. Read and Do"),
    ("l12_worksheet_04_alien_words_v1.png",     "04_alien_word_mission", "4. Alien Word Mission"),
    ("l12_worksheet_05_story_and_draw_v1.png",  "05_story_and_draw",     "5. Story and Draw"),
]

MDGO_SOUNDS = [
    ("sound_m_v1.png", "sound_m", "The Sound m"),
    ("sound_d_v1.png", "sound_d", "The Sound d"),
    ("sound_g_v1.png", "sound_g", "The Sound g"),
    ("sound_o_v1.png", "sound_o", "The Sound o"),
]

L13_BOOK = [
    ("l13_worksheet_01_sound_hunt_v1.png",     "01_sound_hunt",         "1. Sound Hunt: sh and nk"),
    ("l13_worksheet_02_trace_and_write_v1.png", "02_trace_and_write",   "2. Trace and Write: sh and nk"),
    ("l13_worksheet_03_read_and_do_v1.png",    "03_read_and_do",        "3. Read and Do"),
    ("l13_worksheet_04_alien_words_v1.png",    "04_alien_word_mission", "4. Alien Word Mission"),
    ("l13_worksheet_05_sound_sort_v1.png",     "05_sound_sort",         "5. Sound Sort: sh or nk?"),
]

SHNK_SOUNDS = [
    ("sound_sh_v1.png", "sound_sh", "The Sound sh"),
    ("sound_nk_v1.png", "sound_nk", "The Sound nk"),
]


# Pack registry — drives both Drive output and public/ mirroring.
# Each entry: (display name, sheet spec, drive subpath, web subpath, bundle filename stem)
PACKS = [
    ("L1.1 — Tap! Tap! Tap! book pack",  L11_BOOK,      "L1/1_1_Tap_Tap_Tap_Pack",   "L1/1_1_Tap_Tap_Tap_Pack",   "Tap_Tap_Tap_Pack"),
    ("L1.1 — SATPIN single-sound pack",  SATPIN_SOUNDS, "Sound_Pack",                "Sound_Pack",                "SATPIN_Sound_Pack"),
    ("L1.2 — The Mud on the Dog pack",   L12_BOOK,      "L1/1_2_Mud_on_Dog_Pack",    "L1/1_2_Mud_on_Dog_Pack",    "Mud_on_Dog_Pack"),
    ("L1.2 — m d g o single-sound pack", MDGO_SOUNDS,   "Sound_Pack_MDGO",           "Sound_Pack_MDGO",           "MDGO_Sound_Pack"),
    ("L1.3 — Fish in the Tank book pack", L13_BOOK,     "L1/1_3_Fish_in_Tank_Pack",  "L1/1_3_Fish_in_Tank_Pack",  "Fish_in_Tank_Pack"),
    ("L1.3 — sh + nk digraph pack",       SHNK_SOUNDS,  "Sound_Pack_SHNK",           "Sound_Pack_SHNK",           "SHNK_Sound_Pack"),
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
    dst.mkdir(parents=True, exist_ok=True)
    pdfs: list[Path] = []
    a4_pages: list[Image.Image] = []
    bookmarks: list[str] = []
    for src_name, out_stem, title in spec:
        src = SRC / src_name
        if not src.exists():
            fallback = dst / f"{out_stem}.png"
            if fallback.exists():
                src = fallback
                print(f"  (using existing Drive PNG: {out_stem}.png)")
            else:
                print(f"  SKIP (missing): {src_name}")
                continue
        dst_png = dst / f"{out_stem}.png"
        if src.resolve() != dst_png.resolve():
            shutil.copy2(src, dst_png)
        with Image.open(src) as img:
            page = png_to_a4(img)
            pdf_path = dst / f"{out_stem}.pdf"
            page.save(pdf_path, "PDF", resolution=300.0)
            pdfs.append(pdf_path)
            a4_pages.append(page)
            bookmarks.append(title)
            print(f"  OK {out_stem}.png + .pdf")
    if bundle_name and a4_pages:
        bundle_path = dst / f"{bundle_name}.pdf"
        a4_pages[0].save(
            bundle_path, "PDF",
            save_all=True,
            append_images=a4_pages[1:],
            resolution=300.0,
        )
        reader = PdfReader(str(bundle_path))
        writer = PdfWriter()
        for p in reader.pages:
            writer.add_page(p)
        for i, title in enumerate(bookmarks):
            writer.add_outline_item(title, i)
        writer.page_mode = "/UseOutlines"
        with open(bundle_path, "wb") as fh:
            writer.write(fh)
        pdfs.append(bundle_path)
        print(f"  OK {bundle_name}.pdf  ({len(a4_pages)} pages, {len(bookmarks)} bookmarks)")
    return pdfs


def mirror_to_web(drive_dst: Path, web_dst: Path) -> None:
    """Copy the just-built PDFs + PNG previews from Drive to public/."""
    web_dst.mkdir(parents=True, exist_ok=True)
    for src in drive_dst.glob("*.pdf"):
        shutil.copy2(src, web_dst / src.name)
    for src in drive_dst.glob("*.png"):
        shutil.copy2(src, web_dst / src.name)
    print(f"  mirrored {drive_dst.name} -> {web_dst.relative_to(REPO)}")


def main() -> None:
    for name, spec, drive_sub, web_sub, bundle in PACKS:
        drive_dst = DRIVE / drive_sub
        web_dst = PUBLIC / web_sub
        print(f"\n=== {name} ===")
        print(f"  Drive: {drive_dst}")
        export(spec, drive_dst, bundle)
        mirror_to_web(drive_dst, web_dst)
    print("\nDone.")


if __name__ == "__main__":
    main()
