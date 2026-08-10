Paste everything below the line into Claude Code, run from `C:\Users\ASUS\myphonicsbooks`.

---

You are adjusting the 8 MyPhonicsBooks workbooks so their page counts are print-ready for saddle-stitch binding, ahead of a real print run. This is content work, not just a config change: page counts are driven by which pool pages are selected per level, so hitting a target means actually adding or removing real teaching pages, not padding with blanks.

## Context

- Repo root: `C:\Users\ASUS\myphonicsbooks`. The workbook product lives in `worksheet-engine/`.
- Read `worksheet-engine/README.md`, `worksheet-engine/docs/workbook_plans/WORKBOOK_MASTER_PLAN.md` and the per-level plan `worksheet-engine/docs/workbook_plans/WORKBOOK_PLAN_L<n>.md` for each level you touch, before editing anything. These define the pool-page system, pedagogy rules and what "Edition B (Keepable)" means.
- Level content lives in `worksheet-engine/src/data/workbook2/l1.ts` through `l8.ts`, wired up via `worksheet-engine/src/data/workbook2/registry.ts` and `levels.ts`.
- PDFs are rendered by starting the Next.js app (`npm run dev` in `worksheet-engine/`) and, in a second shell, `npm run pdf workbook2 <level>` (see `worksheet-engine/scripts/generate-pdf.mjs`), which hits `http://localhost:3000/print/workbook2/<level>` with Puppeteer and writes `worksheet-engine/output/workbook2__<level>.pdf`. Some levels' latest output currently sits in `worksheet-engine/output/new booklets/` instead — check both locations and make sure you overwrite the current file, not a stale copy.

## The page-count targets

Binding is saddle-stitch, which needs the page count to be a multiple of 4. I checked the actual current PDFs with `pdfinfo` (not the older planning-doc estimates, which are stale) and rounded each to the nearest multiple of 4:

| Level | Current pages | Target pages | Change needed |
|---|---|---|---|
| L1 | 28 | 28 | none |
| L2 | 51 | 52 | +1 page |
| L3 | 33 | 32 | -1 page |
| L4 | 49 | 48 | -1 page |
| L5 | 43 | 44 | +1 page |
| L6 | 38 | 40 | +2 pages |
| L7 | 37 | 36 | -1 page |
| L8 | 38 | 40 | +2 pages |

L1 is already correct and needs no work; the other seven need a real edit.

## What "add or remove a page" means here

Do not pad with blank pages or delete content indiscriminately. For each level:

- **To remove a page**: find the least essential pool page for that level (extra practice reps, not the SWYK/spelling test/answer-key close-out, which the master plan says must stay) and drop it, or consolidate two lightly-loaded pages into one if the template supports it. Check the level's assembly table in its `WORKBOOK_PLAN_L<n>.md` before deciding what is safe to cut.
- **To add a page**: add one more pool page consistent with that level's existing day-type pattern (see section 2 and 3 of `WORKBOOK_MASTER_PLAN.md` for which template fits which day type: T2 grammar, T8 LCWC, T9 dictation, T4 sentence work, T1 handwriting, T5 big write, T10 spelling test). Do not invent a new template or restructure the week; add within the established pattern.
- Every word used on any page you touch must be decodable at that level, or a listed tricky word for that level. This rule is non-negotiable — check against the level's word list before finalising any new page, per `CLAUDE.md`.
- Illustrated characters (if any appear on the pages you touch) always have small solid black dot eyes. Never "big eyes" or "wide eyes", and never a white highlight in the eye.
- British English spelling throughout (colour, personalised, organised, etc.). No terminology from other phonics schemes.

## Front matter and cover

Check whether the "+2 front matter" pages mentioned in `WORKBOOK_MASTER_PLAN.md` section 5 are counted inside these page totals or are a separate cover design outside the page count (the print spec calls for uncoated inner pages and a separate satin cover stock, which suggests the cover may not be part of this page count at all). Confirm which is true from the actual PDF and the print route, and tell me in your final report — don't just assume.

## What to do, in order

1. For each of L2, L3, L4, L5, L6, L7, L8: read that level's plan doc, decide the specific page to add or remove (or which two pages to consolidate), make the edit in `src/data/workbook2/l<n>.ts`, and note what you changed and why.
2. Run the provenance checker (`worksheet-engine/scripts/check-w2-provenance.ts`, likely via an npm script — check `package.json`) after each level's edit to confirm your change didn't break source-pointer validation.
3. Regenerate the PDF for that level (`npm run dev`, then `npm run pdf workbook2 <n>` in a second shell) and confirm the new page count with `pdfinfo` before moving to the next level.
4. Once all seven are regenerated, convert at least 2 pages per changed level to PNG (`pdftoppm`) and actually look at them: confirm the added/removed page reads correctly, nothing overlaps, and no page looks obviously wrong or blank.
5. Copy the final PDFs to wherever the canonical output location is for this project (check `CLAUDE.md` for the convention — do not leave them only in a "new booklets" side folder if that's not where downstream tooling expects them).

## Final report

Give me a table: Level | old page count | new page count | what you added/removed | provenance check passed (yes/no) | visually verified (yes/no). Also tell me clearly whether the cover is inside or outside these page counts, per the check above.
