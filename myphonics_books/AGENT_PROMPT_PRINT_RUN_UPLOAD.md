# AGENT PROMPT — Fix picture-word cards + upload print run to the business Drive

Paste everything below the line into Claude Code, run from
`C:\Users\ASUS\myphonicsbooks`.

---

You have two jobs: fix a broken PDF, then upload the finished print run to
the MyPhonicsBooks business Google Drive (hello@myphonicsbooks.co.uk). Work
in this exact order and verify visually at every render step.

## Context

- Repo root is `C:\Users\ASUS\myphonicsbooks`; the phonics product code lives
  in `myphonics_books/`.
- The print-run staging folder is `PRINT_RUN_2026-07-10/` at repo root. It
  contains 15 numbered files (00_PRINT_MANIFEST.md plus 14 PDFs) and a
  `_drive/` subfolder of upload copies from an earlier session. Some `_drive`
  copies are 300dpi compressions made to dodge a 10MB upload limit that does
  not apply to you: ignore and delete `_drive/`, you will upload full-quality
  originals.
- Do not modify anything in `myphonics_books/data/*.json` (shared curriculum
  data used by other products).

## Job 1 · Fix the picture-word cards PDF (it has no pictures)

`myphonics_books/output/cards/picture_words/picture_word_cards_L1-L4.pdf`
renders its picture sides as grey placeholder boxes labelled "image". The
word sides are fine. The source photos DO exist: 116 PNGs in
`myphonics_books/output/cards/picture_words/images/` with names like
`L1-a-ant__apple.png`. The generator is
`myphonics_books/scripts/generate_cards.py` with data in
`scripts/cards_data.py`; the broken PDF was rendered via Chromium (Jinja2 →
Playwright pattern) on 5 July, so the images stopped resolving at render
time (likely a relative path or file:// URI issue in the HTML template, or
the image filename mapping no longer matches the files on disk).

1. Reproduce: regenerate the picture-word cards and confirm the placeholders.
2. Diagnose: inspect the debug HTML
   (`output/cards/picture_words/_debug_picture_words_*.html`) and check what
   `src` each card image gets versus what exists in `images/`. Fix the root
   cause in the generator or template; do not hand-edit the PDF.
3. Regenerate `picture_word_cards_L1-L4.pdf` (and `_all.pdf` if the script
   produces it).
4. Verify: convert at least 3 pages to PNG (`pdftoppm`), open and LOOK at
   them. Every picture card must show its photo. Do not declare success
   without looking.
5. Copy the fixed PDF over
   `PRINT_RUN_2026-07-10/08_Picture_Word_Cards_L1-L4.pdf`.

While you are there, page 1 of the deck may be a cover/instructions page:
check it renders correctly too.

## Job 2 · Upload the print run to the business Google Drive

Target account: **hello@myphonicsbooks.co.uk** (the business Drive, NOT any
personal account). That Drive already has a `MyPhonicsBooks` area; the known
folder id `1VaWTwvDnoUzps9QCSghURPTwHyAgme6t` is the parent that contains its
existing `Sound_Books` folder; verify it and use it as the parent, or fall
back to creating the folder at My Drive root.

1. Tooling: check whether Google Drive for desktop is running with the
   hello@ account (look for a synced drive letter or
   `%USERPROFILE%\My Drive`). If yes, copy via the filesystem. If not, use
   `rclone`: `winget install Rclone.Rclone`, then `rclone config` to create a
   `gdrive-mpb` remote (drive scope, browser OAuth: sign in as
   hello@myphonicsbooks.co.uk, and say so before opening the browser so
   Lynden can pick the right account).
2. Create `PRINT_RUN_2026-07-10` under the MyPhonicsBooks folder in that
   Drive.
3. Upload FULL-QUALITY files, numbered names as-is:
   - `PRINT_RUN_2026-07-10/00_PRINT_MANIFEST.md` and files 01-14 (originals
     at repo root staging, not `_drive` copies)
   - the fixed `08_Picture_Word_Cards_L1-L4.pdf` from Job 1
   - `15_Storybook_Tap_Tap_Tap.pdf`: use the full-quality original at
     `myphonics_books/output/books/Level1/1_1 Tap Tap Tap.pdf`, renamed
   - the workbook original is
     `worksheet-engine/output/workbook2__1.pdf` → `14_Workbook_L1.pdf`
4. Verify: list the remote folder and confirm all 16 files with sizes
   matching local (the workbook is ~13.6MB, the storybook ~16.3MB; if you see
   ~2MB versions you uploaded the compressed ones by mistake).
5. Report the folder link.

## House rules

British English. No other phonics schemes' trademarked terminology in
anything you write. If you touch any card artwork, illustrated eyes are
always a solid black filled oval, never white-highlighted. Do not renumber
or regenerate storybook assets; do not touch `data/*.json`.
