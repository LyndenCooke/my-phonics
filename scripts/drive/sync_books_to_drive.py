"""
Refresh the 33 storybook PDFs in the business Google Drive
(hello@myphonicsbooks.co.uk -> MyPhonicsBooks/04_Books_PDFs/Level N/) from the
published copies in Supabase Storage (book-pdfs/a5/<legacy id>.pdf).

Files are overwritten IN PLACE, so every Drive file keeps its id, share links
and version history (the previous copy stays under Manage versions). Drive
names are the journey-level names already in use ("4_1 The Night Light.pdf").

Placement follows src/lib/levels8.ts JOURNEY_SUBLEVEL_BY_LEGACY; never the
Supabase folder numbers.

Needs rclone with a Drive remote signed in as hello@myphonicsbooks.co.uk:
    rclone config   ->  new remote "gdrive-mpb", type drive, scope drive

Run:
    py -3.12 scripts/drive/sync_books_to_drive.py --dry-run
    py -3.12 scripts/drive/sync_books_to_drive.py
Options:
    --remote NAME       rclone remote (default gdrive-mpb)
    --source-dir DIR    use local full-quality PDFs named <legacy id>.pdf
                        (e.g. 2_1.pdf) instead of downloading from Supabase
"""
import argparse
import os
import subprocess
import sys
import tempfile
import urllib.request

BOOK_URL = "https://jfbgdeyjngvzpfucwpuk.supabase.co/storage/v1/object/public/book-pdfs/a5/{id}.pdf"
# MyPhonicsBooks/04_Books_PDFs in the hello@ Drive.
BOOKS_FOLDER_ID = "1VaWTwvDnoUzps9QCSghURPTwHyAgme6t"

# legacy id -> Drive file name (journey id + title). Mirrors JOURNEY_SUBLEVEL_BY_LEGACY.
BOOKS = {
    "1_1": "1_1 Tap Tap Tap.pdf",
    "1_2": "1_2 The Mud on the Dog.pdf",
    "1_4": "2_1 The Red Socks.pdf",
    "1_5": "2_2 Run, Pup, Run.pdf",
    "1_6": "2_3 Fox Fell Off.pdf",
    "1_7": "2_4 The Jam Jug.pdf",
    "1_8": "2_5 The Yak and the Box.pdf",
    "1_3": "3_1 The Fish in the Tank.pdf",
    "1_9": "3_2 Chop, Chop, Chop.pdf",
    "1_10": "3_3 Buzz and Sing.pdf",
    "2_1": "4_1 The Night Light.pdf",
    "2_2": "4_2 Hot Food, Cool Moon.pdf",
    "2_3": "4_3 Morning on the Farm.pdf",
    "2_4": "4_4 The Fair in the Air.pdf",
    "2_5": "4_5 Round and Round.pdf",
    "2_6": "4_6 The Night Fair.pdf",
    "3_1": "5_1 The Big Bike Race.pdf",
    "3_2": "5_2 Lost at the Night Market.pdf",
    "3_3": "5_3 The Dream Team.pdf",
    "3_4": "5_4 What Min Saw.pdf",
    "3_5": "5_5 The Boat with the Red Sail.pdf",
    "4_1": "6_1 The Purple Purse.pdf",
    "4_2": "6_2 The Brown Owl.pdf",
    "4_3": "6_3 The New Glue.pdf",
    "4_4": "6_4 The Cheeky Monkey.pdf",
    "5_1": "7_1 Before the Shore.pdf",
    "5_2": "7_2 Near the Door.pdf",
    "5_3": "7_3 Sure She Can.pdf",
    "5_4": "7_4 A Place for Me.pdf",
    "6_1": "8_1 The Marvellous Neighbourhood.pdf",
    "6_2": "8_2 You Are Remarkable.pdf",
    "6_3": "8_3 It Looks Suspicious.pdf",
    "6_4": "8_4 The Incredible Bush Walk.pdf",
}

# Drive files whose book has been retitled: moved (not deleted) to _Superseded.
SUPERSEDED = {"Level 4/4_2 Moo at the Zoo.pdf"}


def rclone(remote, *args, dry_run=False):
    cmd = ["rclone", *args, "--drive-root-folder-id", BOOKS_FOLDER_ID]
    if dry_run:
        cmd.append("--dry-run")
    print("  $", " ".join(cmd))
    subprocess.run(cmd, check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--remote", default="gdrive-mpb")
    ap.add_argument("--source-dir")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    with tempfile.TemporaryDirectory() as tmp:
        for legacy, name in BOOKS.items():
            level = name.split("_")[0]
            if a.source_dir:
                src = os.path.join(a.source_dir, f"{legacy}.pdf")
            else:
                src = os.path.join(tmp, f"{legacy}.pdf")
                urllib.request.urlretrieve(BOOK_URL.format(id=legacy), src)
            print(f"{legacy:>5} -> Level {level}/{name}  ({os.path.getsize(src) // 1024} KB)")
            rclone(a.remote, "copyto", src, f"{a.remote}:Level {level}/{name}", dry_run=a.dry_run)

        for path in SUPERSEDED:
            print(f"retired -> _Superseded/{os.path.basename(path)}")
            try:
                rclone(a.remote, "moveto", f"{a.remote}:{path}",
                       f"{a.remote}:_Superseded/{os.path.basename(path)}", dry_run=a.dry_run)
            except subprocess.CalledProcessError:
                print("  (already moved)")

    print("\nCheck sizes against Supabase:")
    rclone(a.remote, "lsl", f"{a.remote}:", "--include", "Level */*.pdf")


if __name__ == "__main__":
    sys.exit(main())
