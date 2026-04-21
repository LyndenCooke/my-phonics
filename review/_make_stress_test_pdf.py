"""One-off: render review/STRESS_TEST_PROMPT.md to PDF."""
from pathlib import Path
import markdown
from playwright.sync_api import sync_playwright

HERE = Path(__file__).parent
MD = HERE / "STRESS_TEST_PROMPT.md"
PDF = HERE / "STRESS_TEST_PROMPT.pdf"

body_html = markdown.markdown(
    MD.read_text(encoding="utf-8"),
    extensions=["fenced_code", "tables", "toc", "sane_lists"],
)

css = """
@page { size: A4; margin: 18mm 16mm; }
body { font-family: -apple-system, 'Segoe UI', sans-serif; color: #1a1a1a;
       line-height: 1.5; font-size: 10.5pt; }
h1 { font-size: 22pt; border-bottom: 2px solid #111; padding-bottom: 6pt;
     page-break-before: auto; }
h1:first-of-type { page-break-before: avoid; }
h2 { font-size: 15pt; margin-top: 18pt; border-bottom: 1px solid #ccc;
     padding-bottom: 4pt; page-break-after: avoid; }
h3 { font-size: 12pt; margin-top: 12pt; page-break-after: avoid; }
code { background: #f5f5f5; padding: 1px 4px; border-radius: 3px;
       font-family: ui-monospace, 'Consolas', monospace; font-size: 9.5pt; }
pre { background: #f5f5f5; padding: 10pt; border-radius: 6pt;
      white-space: pre-wrap; word-wrap: break-word; font-size: 9pt;
      page-break-inside: avoid; }
pre code { background: none; padding: 0; }
ul, ol { padding-left: 18pt; }
li { margin-bottom: 2pt; }
hr { border: none; border-top: 1px solid #ddd; margin: 14pt 0; }
blockquote { border-left: 3px solid #ddd; margin: 8pt 0; padding-left: 10pt;
             color: #555; }
table { border-collapse: collapse; margin: 8pt 0; }
th, td { border: 1px solid #ddd; padding: 4pt 8pt; font-size: 9.5pt; }
th { background: #f5f5f5; }
strong { color: #000; }
a { color: #0b5fff; text-decoration: none; }
"""

html = f"""<!doctype html>
<html><head><meta charset="utf-8">
<title>MyPhonicsBooks — Synthetic Stress Test</title>
<style>{css}</style>
</head><body>{body_html}</body></html>"""

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.set_content(html, wait_until="load")
    page.pdf(path=str(PDF), format="A4",
             margin={"top": "18mm", "bottom": "18mm",
                     "left": "16mm", "right": "16mm"},
             print_background=True)
    browser.close()

print(f"wrote {PDF} ({PDF.stat().st_size // 1024} KB)")
