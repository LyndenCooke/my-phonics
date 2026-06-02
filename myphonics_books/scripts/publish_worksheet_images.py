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

# Level 2 (new ledger "First Sounds") — 19 single-letter / double-letter graphemes,
# ordered to follow the L2 book grouping in the Curriculum Ledger v2.0.
L2_SOUNDS = [
    ("sound_c_v1.png",  "sound_c",  "The Sound c"),
    ("sound_k_v1.png",  "sound_k",  "The Sound k"),
    ("sound_ck_v1.png", "sound_ck", "The Sound ck"),
    ("sound_e_v1.png",  "sound_e",  "The Sound e"),
    ("sound_u_v1.png",  "sound_u",  "The Sound u"),
    ("sound_r_v1.png",  "sound_r",  "The Sound r"),
    ("sound_h_v1.png",  "sound_h",  "The Sound h"),
    ("sound_b_v1.png",  "sound_b",  "The Sound b"),
    ("sound_f_v1.png",  "sound_f",  "The Sound f"),
    ("sound_l_v1.png",  "sound_l",  "The Sound l"),
    ("sound_ff_v1.png", "sound_ff", "The Sound ff"),
    ("sound_ll_v1.png", "sound_ll", "The Sound ll"),
    ("sound_ss_v1.png", "sound_ss", "The Sound ss"),
    ("sound_j_v1.png",  "sound_j",  "The Sound j"),
    ("sound_v_v1.png",  "sound_v",  "The Sound v"),
    ("sound_w_v1.png",  "sound_w",  "The Sound w"),
    ("sound_x_v1.png",  "sound_x",  "The Sound x"),
    ("sound_y_v1.png",  "sound_y",  "The Sound y"),
    ("sound_z_v1.png",  "sound_z",  "The Sound z"),
]

# Level 3 (new ledger "Special Friends") COMPLETE pack: the full 7 special-friend
# sounds + the net-new grammar / spelling / blending sheets, in teaching order.
L3_PACK = [
    ("sound_sh_v1.png",            "01_sound_sh",              "The Sound sh"),
    ("sound_nk_v1.png",            "02_sound_nk",              "The Sound nk"),
    ("sound_ch_v1.png",            "03_sound_ch",              "The Sound ch"),
    ("sound_th_v1.png",            "04_sound_th",              "The Sound th"),
    ("sound_ng_v1.png",            "05_sound_ng",              "The Sound ng"),
    ("sound_qu_v1.png",            "06_sound_qu",              "The Sound qu"),
    ("sound_zz_v1.png",            "07_sound_zz",              "The Sound zz"),
    ("l3_blending_clusters_v1.png","08_blend_clusters",        "Blend the Clusters"),
    ("l3_spelling_tricky_v1.png",  "09_tricky_words",          "Tricky Words: he she we me be"),
    ("l3_grammar_endmarks_v1.png", "10_full_stop_or_question", "Full Stop or Question Mark?"),
    ("l3_grammar_capitals_v1.png", "11_capitals_for_names",    "Capital Letters for Names"),
]

# Level 4 (new ledger "Longer Sounds") COMPLETE pack: 12 vowel digraphs + 6
# grammar/spelling/tricky sheets in teaching order. Green banner (#22C55E).
L4_PACK = [
    ("sound_ay_v1.png",         "01_sound_ay",         "The Sound ay"),
    ("sound_ee_v1.png",         "02_sound_ee",         "The Sound ee"),
    ("sound_igh_v1.png",        "03_sound_igh",        "The Sound igh"),
    ("sound_ow_v1.png",         "04_sound_ow",         "The Sound ow (as in cow)"),
    ("sound_oo_long_v1.png",    "05_sound_oo_long",    "The Sound oo (as in moon)"),
    ("sound_oo_short_v1.png",   "06_sound_oo_short",   "The Sound oo (as in book)"),
    ("sound_ar_v1.png",         "07_sound_ar",         "The Sound ar"),
    ("sound_or_v1.png",         "08_sound_or",         "The Sound or"),
    ("sound_air_v1.png",        "09_sound_air",        "The Sound air"),
    ("sound_ir_v1.png",         "10_sound_ir",         "The Sound ir"),
    ("sound_ou_v1.png",         "11_sound_ou",         "The Sound ou"),
    ("sound_oy_v1.png",         "12_sound_oy",         "The Sound oy"),
    ("l4_join_with_and_v1.png",                      "13_grammar_and",        "Join with 'and'"),
    ("l4_full_stop_question_mark_or_exclamation_m_v1.png", "14_grammar_endmarks_3way", "Full Stop, Question Mark or Exclamation Mark?"),
    ("l4_days_of_the_week_v1.png",                   "15_grammar_days",        "Days of the Week"),
    ("l4_one_or_many_v1.png",                        "16_spelling_plurals",    "One or Many? (-s / -es)"),
    ("l4_suffix_wheel_v1.png",                       "17_spelling_suffix_wheel","Suffix Wheel (-s -ing -ed)"),
    ("l4_read_and_match_v1.png",                     "18_tricky_was_my_you",   "Tricky Words: was my you they her all are"),
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
    ("L2 — First Sounds single-sound pack", L2_SOUNDS,   "Sound_Pack_L2",             "Sound_Pack_L2",             "L2_Sound_Pack"),
    ("L3 — Special Friends COMPLETE pack",   L3_PACK,     "Level_3_Pack",              "Level_3_Pack",              "L3_Complete_Pack"),
    ("L4 — Longer Sounds COMPLETE pack",     L4_PACK,     "Level_4_Pack",              "Level_4_Pack",              "L4_Complete_Pack"),
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
    import sys
    # Optional substring filter(s): only process packs whose bundle stem or name
    # contains one of the given args. e.g. `python publish_worksheet_images.py L2_Sound_Pack`
    filters = [a for a in sys.argv[1:] if not a.startswith("-")]
    for name, spec, drive_sub, web_sub, bundle in PACKS:
        if filters and not any(f in bundle or f in name for f in filters):
            continue
        drive_dst = DRIVE / drive_sub
        web_dst = PUBLIC / web_sub
        print(f"\n=== {name} ===")
        print(f"  Drive: {drive_dst}")
        export(spec, drive_dst, bundle)
        mirror_to_web(drive_dst, web_dst)
    print("\nDone.")


if __name__ == "__main__":
    main()
