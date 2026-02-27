"""Check embedded fonts in both PDFs."""
import fitz

print("=== OUR GENERATED PDF (AFTER FIX) ===")
doc = fitz.open(r"C:\Users\ASUS\myphonicsbooks\myphonicsbooks\output\books\The_Lost_Doll_Level1_Emma.pdf")
fonts = set()
for page_num in range(len(doc)):
    page = doc[page_num]
    font_list = page.get_fonts(full=True)
    for f in font_list:
        fonts.add((f[3], f[4]))
for name, ftype in sorted(fonts):
    print(f"  {name} ({ftype})")
doc.close()

print("\n=== REFERENCE PDF ===")
doc2 = fitz.open(r"C:\Users\ASUS\Downloads\emma_level1_opt.pdf")
fonts2 = set()
for page_num in range(len(doc2)):
    page = doc2[page_num]
    font_list = page.get_fonts(full=True)
    for f in font_list:
        fonts2.add((f[3], f[4]))
for name, ftype in sorted(fonts2):
    print(f"  {name} ({ftype})")
doc2.close()
