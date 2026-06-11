# Grammar booklets: audit and fix plan

Audit of the grammar booklets generated on 8 June (output/grammar_L*_booklet.pdf and the per-unit PDFs) and the plan to fix them. Verdict: the content scaffold is there, but the build fails on consistency, on the handwriting lines, on completeness and on house style. The root cause is that a new "flowy" layout layer was invented and declared locked, while the only approved master is the sound_a sheet. This plan re-asserts one locked layout and makes every sheet obey it.

---

## 1. What was actually built

- 8 booklet PDFs (L1 to L8) plus per-unit PDFs, generated from new data `src/data/grammar/l1..l8.ts` and a rewritten `grammarSchema.ts`.
- A new chrome layer: `FlowyLayout.tsx`, `FlowySheet.tsx`, `SheetShell.tsx`, `GrammarLayout.tsx`, `GrammarTickGrid.tsx`. Its own header comment calls it "the LOCKED flowy grammar chrome (approved on the build sheet)". It was not approved. The approved master is `SingleSound.tsx` (sound_a).
- A booklet is just the unit pages concatenated. L1 is 3 pages, L6 is 7 pages. There is no cover, contents, how-to, review or answer key.

## 2. Audit findings

### A. Completeness (it is not a scheme yet)
1. The "booklets" are bare worksheets stapled together. L1 has 3 pages because L1 has 3 units. There is no front matter, no answer key, no certificate, none of the booklet structure the scheme defines.
2. So a parent or school sees three loose sheets, not a workbook. This is the "it is like three things" problem.

### B. Aesthetic and consistency (the core failure)
3. **Font sizes are not consistent.** About twenty different hardcoded sizes appear across the components: 27, 20, 19, 18, 17, 16.5, 16, 15, 14.5, 14, 13, 12, 11, 10.5, 10, 9.5, 9, 8.5, 7.5, 6.5 pt. There is a type scale in `tokens.ts` (TYPE) but the grammar components ignore it and set their own. The same role (a sentence the child reads) is 18pt on one sheet and 19pt on another. Word banks are 20pt, bigger than the sentences.
4. **Handwriting lines are not consistent and are not the locked system.** `TraceLine` is used in only 2 of the components. The rest draw a single plain underline (`WriteLine` at colour #444) or an ad hoc `borderBottom`. So: no proper guideline geometry (no top guide, no dashed x-height, no measured baseline), and the line height, the gap between the two writing lines and the gap from the instruction to the line all vary sheet to sheet. This is exactly the inconsistency you flagged.
5. **Spacing is not consistent.** The bodies use `space-around`, `space-evenly` and `space-between`, so the vertical rhythm changes with the number of rows. The word-bank band is 33mm on the build sheet and 46mm on the cloze sheet. The instruction-to-line gap is a one-off `marginTop` in the apply block and different elsewhere.
6. **The flowy chrome is off-brand.** Wavy purple header blob and a "ground wave" at the foot, title-only header with no mascot tile and no level or strand pills, no numbered section panels. It does not match the sound_a sheet, so a Grammar page and a Sound page do not look like one scheme.
7. **Decoration is random and sometimes irrelevant.** A paintbrush sits on the joining-words sheet; a tree sits on the "What is a word?" sheet. Corner objects change per sheet with no link to the book.

### C. Pedagogy
8. **House style breaches in child-facing text.** Around 25 em dashes sit in the grammar data and in the layout ("Now you write — ", and the L6.1 note "ends on an action word — not just an ! mark"). Against the agreed style and not how a worksheet should read.
9. **The teaching staging is thin.** The spec calls for I do, We do, You do. The sheets show only "Watch first" then the activity then "Now you write". There is no guided We do step, no numbered steps, so the modelling is weaker than specified.
10. **Foundation levels are too sparse.** L1 is three single-activity pages. For Reception that is a leaflet, not a booklet.

### D. Governance
11. A component should never declare itself locked. The single source of truth for layout is the sound_a master plus `worksheet_template_spec.md`. The flowy layer overrode that on its own initiative, which is why it drifted.

## 3. Root cause

There is no single locked layout-constants module. Each component hardcodes its own sizes and spacing, and a parallel chrome was invented. Fixing individual pages will not hold. We fix the system once, then every sheet inherits it.

---

## 4. The fix: one locked layout contract

Create `src/design/layout.ts` as the single source for every size and gap. No component may use an inline `fontSize`, an inline writing line or an inline gap again. Everything reads from here. Change a value once, the whole scheme restyles.

### 4.1 Type scale (one set, used everywhere)

| Role | Token | Size | Notes |
|---|---|---|---|
| Header title | `type.title` | 28pt | matches sound_a header |
| Section head | `type.section` | 16pt | numbered panel heads |
| Worked example | `type.example` | 15pt | the I do band |
| Sentence the child reads | `type.body` | 15pt | the one body size, every sheet |
| Instruction | `type.instruction` | 13pt | one size for every instruction |
| Word-bank word | `type.bank` | 15pt | same as body, never larger |
| Terminology and hints | `type.hint` | 9.5pt | NC link, column hints |
| Footer | `type.footer` | 8.5pt | |

These are a starting scale; they are tunable in one place. The rule is that only these tokens appear in code.

### 4.2 Handwriting line geometry (locked, identical on every sheet)

- **Every writing line is a `TraceLine`.** No plain underlines, no `borderBottom`, no `WriteLine`. Delete `WriteLine`.
- One **x-height per booklet**, constant through the whole book: L1 to L4 use 7mm, L5 to L8 use 6mm. Within a booklet it never changes.
- The four guidelines (top, dashed x-height, baseline, descender) come from the font metrics, so the **top-to-baseline distance and the baseline-to-next-line distance are identical on every line in the book**, including the "write your own" lines.
- **Line-to-line gap:** one constant (`space.lineGap`, 4mm) between stacked writing lines.
- **Instruction-to-line gap:** one constant (`space.instrToLine`, 6mm) between any instruction and the writing line beneath it, on every sheet.
- A writing task declares only how many lines it needs (apply = 2). Geometry is fixed.

### 4.3 Spacing tokens (constant everywhere)

| Token | Value | Use |
|---|---|---|
| `page.margin` | 6mm | outer margin (as sound_a) |
| `header.h` | 26mm | coloured header bar height |
| `space.afterHeader` | 5mm | header to first panel |
| `space.sectionGap` | 4mm | between panels |
| `space.instrToContent` | 4mm | instruction to its activity |
| `space.instrToLine` | 6mm | instruction to a writing line |
| `space.lineGap` | 4mm | between writing lines |
| `space.rowGap` | 3mm | between activity rows |
| `footer.h` | 7mm | grey footer bar |

Activity rows are laid out with a fixed `rowGap`, not `space-around`, so two sheets with different row counts still share the same rhythm.

### 4.4 Chrome (reuse sound_a, retire flowy)

- Extract the sound_a chrome into one shared frame and render both Sound and Grammar through it: coloured rounded header bar with the **book mascot tile** and the **level + strand pills**, bordered rounded panels, **numbered section heads** (1 Watch first, 2 the activity, 3 Now you write), grey footer bar with brand and page number.
- Delete `FlowyLayout`, `FlowySheet` and the wavy SVG. No decorative blobs.
- Decoration rule: the only character is the **book mascot in the header tile**, the same position on every sheet. No random corner objects. If a content picture helps (a noun to expand), it sits inline in the row, trimmed, dot eyes on creatures.

### 4.5 House style
- Strip every em dash from the grammar data and the layout. Use a colon or a full stop. "Now you write:" not "Now you write — ".
- British English throughout. The decodable rule and sentence-length band still apply (see the L6 spec).

## 5. Booklet assembly (make it a workbook)

Each level booklet is assembled in this order, not just the units:

1. Cover (level colour, mascot, "Grammar", level name)
2. Contents
3. How to use (the I do, We do, You do routine for the adult)
4. The grammar units for that level
5. Review or challenge page (mixed, NC test format)
6. Answer key (adult, back of book)
7. Certificate

Foundation levels (L1 to L3) need more than three units: add the spiral retrieval pages from the scheme so the booklet has substance.

## 6. Remediation order (engineering)

1. Create `src/design/layout.ts` (sections 4.1 to 4.3).
2. Extract the sound_a chrome into a shared `SheetFrame`; build one `GrammarFrame` on top of it (header bar, mascot tile, pills, numbered panels, footer).
3. Convert every grammar body to read only `layout.ts` tokens and to use `TraceLine` for all writing lines. Delete `WriteLine` and the flowy files.
4. Strip em dashes from `src/data/grammar/*.ts` and the layout.
5. Add the booklet assembly (front matter, review, answer key, certificate) to the PDF build.
6. Re-render L6 and L1, screenshot, and compare side by side with the sound_a sheet.
7. Roll the fix across L2 to L8.

## 7. Acceptance criteria (how we know it is fixed)

1. `grep -rE "fontSize" src/components` returns only references to `layout.ts` tokens. No inline pt values.
2. Every writing line in every booklet is a `TraceLine`. Drop the test row `tall pin dog jump`: letters seat on the baseline, descenders reach the bottom line, identical geometry on every sheet.
3. The instruction-to-line gap and the line-to-line gap measure the same on every sheet (one token each).
4. A Grammar page beside the sound_a page reads as one scheme: same header bar, mascot tile, pills, panels, footer.
5. Zero em dashes anywhere in the grammar data, layout or rendered PDFs.
6. Each booklet has a cover, contents, how-to, the units, a review, an answer key and a certificate.
7. Colours come only from `getLevelTheme(level)`.

## 8. A note on process

Treat `SingleSound.tsx` plus `worksheet_template_spec.md` and `layout.ts` as the only locked design authority. A component must not introduce its own chrome, font sizes or writing lines, and must not mark its own output as approved. New formats supply content and an activity body only; the frame and the constants are fixed.
