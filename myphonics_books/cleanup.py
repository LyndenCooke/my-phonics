import os
import shutil

inner_root = r"c:\Users\ASUS\myphonicsbooks\myphonicsbooks"
outer_root = r"c:\Users\ASUS\myphonicsbooks"

try:
    os.makedirs(os.path.join(inner_root, "scripts"), exist_ok=True)
except Exception:
    pass

try:
    os.makedirs(os.path.join(inner_root, "docs", "ui_mockups"), exist_ok=True)
except Exception:
    pass

scripts_to_move = [
    "_test_fal.py", "canva_api.py", "canva_auth.py", "check_fonts.py", "compare_backends.py", 
    "generate_book.py", "generate_flux_images.py", "generate_gemini_images.py", "generate_images.py", 
    "generate_marketing_kit.py", "generate_pilot_books.py", "generate_preview_books.py", 
    "generate_test_books.py", "preview_pages.py", "rebuild_word_banks.py", "validate_words.py"
]

for script in scripts_to_move:
    src = os.path.join(inner_root, script)
    dst = os.path.join(inner_root, "scripts", script)
    if os.path.exists(src) and not os.path.exists(dst):
        try:
            shutil.move(src, dst)
            print(f"Moved {script}")
        except Exception as e:
            print(f"Error moving {script}: {e}")

inner_output_books = os.path.join(inner_root, "output", "books")
inner_output = os.path.join(inner_root, "output")

if os.path.exists(inner_output_books):
    for f in os.listdir(inner_output_books):
        if f != "Is_It_a_Bug_Level1.pdf":
            file_path = os.path.join(inner_output_books, f)
            if os.path.isfile(file_path):
                os.remove(file_path)

if os.path.exists(inner_output):
    for f in os.listdir(inner_output):
        if f.startswith("debug_") and f.endswith(".html"):
            file_path = os.path.join(inner_output, f)
            if os.path.isfile(file_path):
                os.remove(file_path)

outer_output = os.path.join(outer_root, "output")
if os.path.exists(outer_output):
    try:
        shutil.rmtree(outer_output)
    except Exception as e:
        print(f"Could not delete outer output: {e}")

docs_to_move = [
    "MyPhonicsBooks_Assessment_Funnel.html",
    "MyPhonicsBooks_MVP_Dashboard.html",
    "MyPhonicsBooks_MVP_Gap_Analysis.docx",
    "MyPhonicsBooks_Resource_Hub.html"
]

for doc in docs_to_move:
    src = os.path.join(outer_root, doc)
    dst = os.path.join(inner_root, "docs", "ui_mockups", doc)
    if os.path.exists(src) and not os.path.exists(dst):
        try:
            shutil.move(src, dst)
        except Exception:
            pass

docs_to_delete = [
    "MyPhonicsBooks_Art_Generation_Prompt.md",
    "The_Lost_Doll_Level1_Emma_template.pdf"
]

for doc in docs_to_delete:
    src = os.path.join(outer_root, doc)
    if os.path.exists(src):
        os.remove(src)

print("Cleanup script complete.")
