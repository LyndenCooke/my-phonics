# Claude Code task: rebuild the Level 6 Grammar booklet to the locked flowy spec

You are implementing in the MyPhonicsBooks `worksheet-engine` (Next.js, React,
TypeScript; print routes rendered to A4 PDF by Puppeteer). Chromium is installed
locally. Work on a feature branch. Do NOT touch the phonics sound sheets or the
parent-facing site, and do NOT deploy.

## House style (enforce everywhere you print a word)
British English. NO em dashes (use a colon, semicolon or full stop). No Oxford
commas. NO bold anywhere (emphasis is the accent colour and size only). Colours
come only from `getLevelTheme(level)`, never hard-coded. The decodable rule
holds: every word decodable at L6 or a listed tricky word for L6 or earlier;
sentences 6 to 12 words.

## Read these specs first (already in the repo, this is the authority)
- `worksheet-engine/docs/grammar_booklet_plan.md` - overview and the 13-page pagination
- `worksheet-engine/docs/grammar_layout_spec.md` - THE layout authority: mm, pt, tokens, per-format layouts, acceptance checks (section 8)
- `worksheet-engine/docs/grammar_issues_analysis.md` - the nine issues, each with root cause, exact fix and the file to touch
- `worksheet-engine/docs/grammar_schema_changes.md` - the schema v2 to v3 deltas
- `worksheet-engine/docs/grammar_L6_contents.md` - the seven L6 units verbatim plus front and back matter, review and decorations
- `worksheet-engine/docs/grammar_level_content_template.md` - the shape to extend to L1 to L8 later
- `worksheet-engine/docs/worksheet_design_rules.md` - the house design rules

## Current state (already done; build on it, do not undo or duplicate)
- Active renderer: `src/components/grammar/FlowySheet.tsx` wrapping
  `src/components/grammar/FlowyLayout.tsx`. The print route
  `src/app/print/grammar/[unit]/page.tsx` renders `FlowySheet`. KEEP this flowy
  chrome. Do NOT route grammar through the boxed `SheetShell.tsx` /
  `GrammarLayout.tsx` chrome.
- `WriteLine` (currently in `src/components/grammar/GrammarLayout.tsx`) is already
  reverted to plain black ruled lines (no three-zone handwriting guide). It
  currently uses lineGapMm 11 and colour #555; change it to the spec: ink
  `#1A1A1A`, stroke 0.4 mm, gap driven by `--write-line-gap` (9 mm). Move it to a
  shared module so both strands import one ruled-line component.
- Bold is already removed in the flowy components; keep font-weight 400.
- "Have a first look." is removed; the tickgrid column hint subtitles are
  removed; column labels are at instruction size.
- "Now you write -" is changed to a colon, and em dashes are stripped from
  `src/data/grammar/*.ts`. Now make the apply line one full instruction sentence
  from `apply.prompt` (for example "Now you write a command about the owl.").
- Some font literals were normalised; finish the job so every grammar font size
  is one of the four role tokens.

## Implement, in this order
1. Schema v3 in `src/data/grammarSchema.ts` per `grammar_schema_changes.md`:
   add `s1.exampleLayout: "inline" | "stacked"`; redefine `note` as the optional
   instruction-size terminology line (ink, never small or grey); `apply: { prompt: string; lines?: number }` default 3;
   `decorations[]` with the asset-key set, `xMm`, `yMm`, `sizeMm` (16 to 22),
   optional `rotationDeg`, validated 2 to 3 per unit; per-format `rowWriteLines`
   (build 1, rewrite 2); tickgrid `categories` fixed enum with no hint subfield;
   cloze rows carry gap position only; add `review` to the format union; add a
   `bookletMeta` object (level, levelLabel, coverSkills, howTo, howToClosing,
   reviewUnitId, certificate). Keep all existing v2 fields. Types must compile.
2. Layout tokens on the FlowyLayout page root, set once and used everywhere:
   `--type-title 27pt`, `--type-instruction 16pt`, `--type-body 18pt`,
   `--type-footer 9pt`, `--type-display 44pt` (cover and certificate only),
   `--write-line-gap 9mm`, `--cloze-gap-width 26mm`, `--cloze-gap-pad 3mm`.
   Replace every grammar font-size and every writing-line gap with these. Add a
   render or build guard that fails if any grammar node uses a size outside the
   token set.
3. FlowyLayout chrome: full-bleed wavy header (title only, no pills, no mascot
   tile); Watch-first tint box (label, worked example, optional terminology note
   at instruction size, no "Have a first look"); faint ground wave; round page
   badge; footer strapline. Remove the single corner raster character tile. Add a
   decoration layer that reads `decorations[]` and places 2 to 3 flat line-art
   objects at `xMm`/`yMm`/`sizeMm`, kept clear of text, tick targets and writing
   lines. Apply the same line-art cluster rule to the cover and certificate.
4. Worked example: inline (centred arrow, even spacing, answer in accent) vs
   stacked (rewrite). Auto-fallback to stacked if the inline width exceeds the
   usable Watch-first width (182 mm). No example may overflow.
5. Per-format bodies in `FlowySheet.tsx` exactly per `grammar_layout_spec.md`
   section 7: tickgrid (four fixed 28 mm tick columns, flexing sentence column,
   6 mm tick box, hairline row separators), build (tinted 4x2 word bank, row =
   line-art icon + base phrase + centred arrow + one ruled line), cloze (bank
   chips + a 26 mm gap with 3 mm even padding, no per-row ruled lines), circle
   (marking shown inside the Watch-first example, no legend panel, no per-row
   lines), match (two chip columns, right column shuffled, connect dots), rewrite
   (tinted source strip + two ruled lines). Every ruled line uses the shared
   WriteLine at `--write-line-gap`.
6. Add the `review` format to the `FlowySheet` dispatch (page 11). It renders
   reused items by pointer to approved unit rows; it carries no new decodable
   text.
7. Booklet assembler driven by `bookletMeta`: emit, in order, cover, contents,
   how-to, the seven units, the review, the answers, the certificate (13 pages).
   `grammarRegistry.ts` lists the units in page order and exposes `bookletMeta`
   so the route holds no copy.
8. Write `src/data/grammar/l6.ts` to v3 from `grammar_L6_contents.md` exactly:
   every unit, example, row, answer, apply line, decoration set, soundsRevisited
   and the bookletMeta. Do not invent or substitute any word.

## Verify before you call it done
- `npx tsc --noEmit` passes with zero errors.
- Start the app (`npm run dev`) and render the full L6 booklet to PDF with the
  installed Chromium (the project PDF pipeline). Produce all 13 pages.
- Run every acceptance check in `grammar_layout_spec.md` section 8. In
  particular confirm: only the four role sizes appear on unit pages; no bold;
  every writing line is plain black at the one constant gap; every cloze gap is
  26 mm with 3 mm even padding; 2 to 3 line-art decorations per sheet placed in
  white space with no corner raster photo; short examples inline with a centred
  arrow and long examples stacked; the booklet has cover, contents, how-to, the
  seven units, review, answers and certificate; every word is decodable at L6.
- Share one rendered page back for review.

Branch only. Do not deploy.
