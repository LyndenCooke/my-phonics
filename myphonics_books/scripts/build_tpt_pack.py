"""
Build the Teachers Pay Teachers (TPT) intro card for MyPhonicsBooks.

Outputs ONE file to output/tpt_pack/:
  - MyPhonicsBooks_Teacher_Access.pdf  (single-page A4 — voucher code, URL, QR, steps, perks)

The book PDFs and printable worksheets are NOT bundled with the TPT download.
They live behind the teacher portal code at myphonicsbooks.co.uk/teachers.

Usage:
    py -3.12 scripts/build_tpt_pack.py
    py -3.12 scripts/build_tpt_pack.py --voucher-code TPT-EARLY-READ
"""

import argparse
import asyncio
import base64
import io
import sys
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from core.pdf_generator import get_pdf_generator  # noqa: E402


TEMPLATE = "tpt_intro.html"
FONTS_DIR = ROOT / "assets" / "fonts"
OUTPUT_DIR = ROOT / "output" / "tpt_pack"

# Level 1 colour (matches book_v2 SATPIN pink)
LEVEL_COLOUR = "#E84B8A"

SITE_URL = "myphonicsbooks.co.uk"
TEACHER_ACCESS_URL = "myphonicsbooks.co.uk/teachers"
FREE_READ_URL = "myphonicsbooks.co.uk/library"
DEFAULT_VOUCHER_CODE = "TPT-TEACHERS"


def file_to_base64_url(path: Path, mime: str) -> str:
    data = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{data}"


def qr_data_url(url: str) -> str:
    import qrcode
    q = qrcode.QRCode(box_size=10, border=2, error_correction=qrcode.constants.ERROR_CORRECT_M)
    q.add_data(url)
    q.make(fit=True)
    img = q.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def render_html(voucher_code: str) -> str:
    env = Environment(
        loader=FileSystemLoader(str(ROOT / "templates")),
        autoescape=select_autoescape(["html"]),
    )
    tmpl = env.get_template(TEMPLATE)

    fonts = {
        "font_regular": file_to_base64_url(FONTS_DIR / "Andika-Regular.ttf", "font/ttf"),
        "font_bold":    file_to_base64_url(FONTS_DIR / "Andika-Bold.ttf",    "font/ttf"),
        "font_italic":  file_to_base64_url(FONTS_DIR / "Andika-Italic.ttf",  "font/ttf"),
    }

    qr_image = qr_data_url(f"https://{TEACHER_ACCESS_URL}")

    return tmpl.render(
        pack_title="MyPhonicsBooks — Free Teacher Access",
        level_colour=LEVEL_COLOUR,
        voucher_code=voucher_code,
        site_url=SITE_URL,
        teacher_access_url=TEACHER_ACCESS_URL,
        qr_image=qr_image,
        **fonts,
    )


async def render_pack_pdf(html: str, out_path: Path) -> Path:
    gen = get_pdf_generator()
    # A4 portrait
    await gen.generate(html, out_path, width_mm=210, height_mm=297)
    return out_path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--voucher-code",
        default=DEFAULT_VOUCHER_CODE,
        help="Voucher code printed on the teacher access PDF",
    )
    ap.add_argument(
        "--debug-html",
        action="store_true",
        help="Also write the rendered HTML next to the PDF for inspection",
    )
    args = ap.parse_args()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"[1/2] Rendering teacher access HTML (voucher: {args.voucher_code})...")
    html = render_html(args.voucher_code)

    if args.debug_html:
        debug_path = OUTPUT_DIR / "_debug_teacher_access.html"
        debug_path.write_text(html, encoding="utf-8")
        print(f"       wrote debug HTML -> {debug_path}")

    pack_pdf = OUTPUT_DIR / "MyPhonicsBooks_Teacher_Access.pdf"
    print(f"[2/2] Rendering teacher access PDF -> {pack_pdf}")
    asyncio.run(render_pack_pdf(html, pack_pdf))

    print()
    print("Done. TPT deliverable ready:")
    size_kb = pack_pdf.stat().st_size // 1024
    print(f"  {pack_pdf.name}  ({size_kb} KB)")
    print()
    print("Note: book PDFs and worksheets are NOT bundled.")
    print("They will live behind the teacher portal code at:")
    print(f"  https://{TEACHER_ACCESS_URL}")


if __name__ == "__main__":
    main()
