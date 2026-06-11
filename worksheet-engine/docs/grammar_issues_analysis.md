# grammar_issues_analysis.md

Each issue from the brief, the root cause in the current engine, and the exact
change. File paths are the active flowy renderer and data layer named in the
brief. Component names are the brief's: `FlowySheet.tsx`, `FlowyLayout.tsx`,
`WriteLine` (in `GrammarLayout`), `grammarSchema.ts`, `grammarRegistry.ts` and
the print route `src/app/print/grammar/[unit]/page.tsx`.

---

## Issue 1: bare concatenated worksheets, no booklet structure

Root cause: the print route renders unit sheets only. There is no booklet
assembler, so cover, contents, how-to, review, answers and certificate are not
emitted as part of the run.

Status: the render now has cover, contents, how-to, answers and certificate.
What is still missing is the review or challenge page.

Fix:
- Add a booklet assembler that emits, in order: cover, contents, how-to, the
  units, the review, the answer key, the certificate. See pagination in
  `grammar_booklet_plan.md`.
- Add the review page as a new format `review` rendered by `FlowySheet.tsx`.
  Content is in `grammar_L6_contents.md` and reuses approved unit items only.
- Drive front and back matter from a booklet-level meta object, see
  `grammar_schema_changes.md`.

---

## Issue 2: inconsistent font sizes (about twenty ad-hoc sizes)

Root cause: sizes are set per element across `FlowyLayout.tsx` and the format
components rather than from a shared scale.

Fix:
- Define four CSS variables on the page root in `FlowyLayout.tsx`:
  `--type-title: 27pt`, `--type-instruction: 16pt`, `--type-body: 18pt`,
  `--type-footer: 9pt`. Add front-matter only `--type-display: 44pt` used by the
  cover and certificate.
- Replace every hard-coded font-size in the grammar components with one of these
  variables, mapping by role per `grammar_layout_spec.md` section 2.
- Add a build-time guard or a render check that fails if any grammar node uses a
  font-size outside the token set.

---

## Issue 3: bold where there should be none

Root cause: `font-weight` is being raised on labels, headers or emphasis spans.

Fix:
- Set `font-weight: 400` on the grammar page root and remove every local
  `font-weight` raise in `FlowyLayout.tsx` and the format components.
- Emphasis is colour (accent) and size only. The `Watch first` label, category
  headers, answer headings and the apply line all stay regular weight.

---

## Issue 4: inconsistent writing lines, three-zone guide on grammar sheets

Root cause: `WriteLine` and the format components mix the handwriting three-zone
guide with ruled lines, and row heights differ per format, so the gap is not
constant.

Fix:
- `WriteLine` renders one solid ink line only, stroke 0.4 mm, colour `#1A1A1A`.
  No faint top line, no dashed x-height, no descender line on grammar sheets.
- Add the token `--write-line-gap: 9mm` on the page root and drive every gap
  from it: line-to-line, instruction-to-first-line, build row line, rewrite row
  lines, apply lines. One number, set once.
- Set it to the rewrite-sheet measured value if that differs from 9 mm; the
  brief names the rewrite spacing as the target.

---

## Issue 5: tiny grey appended text

Root cause: the renderer appends sub-strings to the `Watch first` label
("Have a first look"), under category headers (tells you, asks, do it, strong
feeling) and to the apply prompt ("a command about the owl"), at a smaller grey
size.

Fix:
- Remove the `Have a first look` string from the Watch-first renderer.
- Remove the per-column hint subtitles from the tickgrid header. Render the four
  category words only, at instruction role.
- The apply line is one instruction-role line built from `apply.prompt`. Delete
  any split into a label plus a small grey fragment. The data carries the full
  sentence, for example "Now you write a command about the owl."
- Delete any field or code path that produces small grey text. There is no small
  grey tier in the scale.

---

## Issue 6: wrong imagery, single corner raster character

Root cause: each sheet places one cropped raster character tile in the
bottom-right. There is no decoration layer driven by the book world.

Fix:
- Remove the corner character tile from `FlowyLayout.tsx`.
- Add a decoration layer that reads `decorations[]` and places 2 to 3 flat
  line-art objects per sheet at `xMm`, `yMm`, `sizeMm`, by `key`, in white
  space, varied per sheet. Rules in `grammar_layout_spec.md` section 5.
- Line-art assets only, transparent or white background, trimmed. Creatures use
  small solid black round dot eyes.
- The renderer keeps decorations clear of text, tick targets and writing lines.
- Apply the same rule to the cover: replace the single raster tile with a
  line-art cluster of book-world objects.

---

## Issue 7: long worked example overflows, arrow crammed

Root cause: the worked example is always laid out inline, so a full sentence
rewrite runs past the page edge and the arrow sits hard against the answer.

Fix:
- Add `s1.exampleLayout: "inline" | "stacked"`. Set the rewrite unit to
  stacked, all other L6 units to inline.
- Inline: prompt, centred arrow with even space on both sides, answer in accent
  colour, on one line.
- Stacked: prompt on line 1, corrected answer on line 2 in accent colour.
- Add the fallback in `FlowySheet.tsx`: if the inline rendered width exceeds the
  usable Watch-first width (182 mm), switch to stacked automatically. No example
  may overflow.

---

## Issue 8: cloze gaps have large odd spaces

Root cause: the cloze gap width and the space around it are not fixed, so gaps
vary and look uneven.

Fix:
- Render every cloze gap as a fixed 26 mm underline with exactly 3 mm of space
  on each side. The cloze payload marks the gap position only and carries no
  inline hint.

---

## Issue 9: keep the flowy look, no boxed chrome, no sound sheet inside

Root cause: an alternative boxed chrome (`SheetShell.tsx`, `GrammarLayout.tsx`)
exists and could be selected by mistake.

Fix:
- The print route renders `FlowySheet` wrapping `FlowyLayout` for grammar. Do
  not route grammar through `SheetShell` or `GrammarLayout` chrome. Keep
  `WriteLine` (which currently lives in `GrammarLayout`) but treat it as the
  shared ruled-line component, or move it so both strands import one line
  component.
- Never place a phonics sound sheet inside a grammar booklet. The assembler
  emits grammar formats only.
