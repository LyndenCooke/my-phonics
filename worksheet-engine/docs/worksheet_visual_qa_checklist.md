# Worksheet Visual QA Checklist

## Purpose
Use this checklist after generating any worksheet from a visual reference or coded template. The aim is to catch the small visual problems that make a worksheet look unprofessional, even when the general layout is correct. This file is a practical review tool. It should be run before showing the output to the user.

## Review Method
Open the generated page as an image, not only as a PDF. View it:
- zoomed out, to judge the overall page balance
- at normal print size, to judge readability
- zoomed in, to inspect alignment, lines, borders and images

Compare it against the reference image if one exists. Do not only inspect the source code.

## Pass Levels
- **PASS**: no issue
- **MINOR**: visible but acceptable for draft
- **FIX**: must fix before production
- **BLOCKER**: makes the worksheet unusable or clearly unprofessional

## 1. Overall Page Balance
- Does the worksheet visually resemble the reference?
- Does the page feel full but not crowded?
- Are there any accidental large empty gaps?
- Does any section look too tall or too short?
- Does the footer sit neatly near the bottom?
- Does the worksheet feel like a designed resource rather than a document?

Common fixes: increase content size; reduce unused vertical padding; redistribute section heights; enlarge images; tighten gaps; adjust header height.

## 2. Header
- Is the header height proportionate?
- Are all elements inside the pink header?
- Does the left sound tile fit properly?
- Is the title visually centred?
- Does the final sound letter in the title feel attached to the title?
- Are the right badges fully visible?
- Do the `Level` and `Sound` badges have enough padding?
- Are the two badges vertically aligned and evenly spaced?
- Does anything touch the edge?

MyPhonicsBooks-specific: `Level 1` and `Sound • a` must not look squeezed into the corner. The left `a` tile must not feel too tall/disproportionate. The title must not have an awkward large gap before the final `a`.

Common fixes: reduce badge font size; increase badge width; move badges upward; reduce header height if too dominant; centre title within available space; reduce tracking; resize sound tile.

## 3. Section Panels
- Aligned to the same left/right margins? Consistent corners? Consistent border thickness? Balanced internal padding?
- Section number circles aligned with headings? Headings/instructions sit comfortably? Content not too close to instruction text? Enough space between sections?

Common fixes: set panel widths globally; consistent radius/stroke; standard title area height; 14–24px below instruction; fixed y positions.

## 4. Section Headings
- Readable? Colour controlled? Too much pink? Would black headings improve balance? Heading aligned with number circle?

Recommendation: keep number circles pink; use black section headings when the page already has a strong pink header; pink only if still balanced.

## 5. Instruction Text
- Readable? Too close to the boxes below? Too far from the heading? Clashes with handwriting guide lines? Consistently positioned across sections?

Common fixes: adjust y offset; consistent line height; padding below; dark grey or black.

## 6. Images
For every image: present? large enough? recognisable instantly? white rectangular background? tightly cropped? optically centred? overlaps a border/line? too high/low/left/right? matches the size of other images?

Production rules: no tiny text labels as image replacements; no white image backgrounds over boxes; no tiny images in large cards; transparent PNG preferred; fill 65–80% of the card where possible.

Common fixes: remove background; crop transparent pixels; scale larger; set max width/height; object-fit contain after cropping; adjust optical x/y offset.

## 7. Writing Lines vs Handwriting Lines
**Two different things — do not mix them up:**
- **Handwriting guide line** (the 3-zone dashed `TraceLine`: ascender · x-height · baseline · descender) is ONLY for handwriting/letter-formation practice. Use it where the task is *how to form letters*.
- **Plain writing line** (a single ruled `WriteLine`) is for writing words, phrases or sentences as answers — grammar, cloze gaps, rewrites, "now you write" tasks. Do NOT put the dashed handwriting guide under an ordinary writing answer; it clutters and miscues.
- A writing line should sit **just below** the prompt/arrow it belongs to (the child writes underneath), not level with or above it.

Handwriting-guide checks (when one IS used): consistent across boxes? baseline strongest? x-height level-colour dashed? top guide light? descender light dashed? rows align from one baseline model? not too faint/close?

Common fixes: one reusable component per type (`TraceLine` for handwriting, `WriteLine` for answers); fixed line positions; baseline just under the prompt; never hand-draw lines.

## 8. Trace Letter Section
- One clear dark model letter? Trace letters close enough to the model? Too many trace letters? Independent writing space? Letters on the baseline? Trace letters light enough? Row balanced?

Preferred pattern: 1 dark model letter; 4 trace letters; remaining space blank for independent writing.

## 9. Trace Word Section
- Image cards large/clear? Trace word boxes aligned with blank boxes? Word sitting correctly on baseline? Too large/small? Box feels empty? Repeat twice? Blank boxes visually identical to trace boxes?

Decision rule: practice box → repeat the word twice if space allows; model box → one word, leave clear space. Do not sit between the two.

## 10. Missing Sound Section
- Each image clear/large enough? Missing word centred as a complete word? Visible letters too far left/right? Missing space obvious? Cards aligned? Same baseline? Image background interfering? Bottom section too compressed?

Critical rule: centre the **imagined full word**, not only the visible letters. For `nt`, centre the invisible `a` + `nt` as if the word is `ant`. For `r t`, reserve space for `a` between letters and centre `rat`.

## 11. Typography and Fonts
- Display font child-friendly? Handwriting font suitable for early phonics? Too cursive? Too slanted? Lowercase `a` correct? Ascenders/descenders clear? Sizes consistent? Any text clipped?

Common fixes: infant print handwriting font; reduce slant; single-storey `a`; explicit line-height; embed fonts; test `a t p g j y`.

## 12. Borders and Corners
- Rounded corners consistent? Borders same pink? Too thick/faint? Images/white backgrounds covering borders? Enough internal padding? Cards aligned in columns/rows?

## 13. Spacing
- Consistent gap heading→instruction, instruction→content, between rows, between columns, between sections? Too much empty space around the header?

Suggested tokens: tiny 4px; small 8px; medium 14px; large 20px; section gap 18–26px.

## 14. Print Readiness
- PDF A4? Safe margins? Text/lines vector-sharp? Images high-res? Anything blurs? Colours too pale? Handwriting lines visible on paper? Footer prints fully?

## 15. Accessibility and Child Use
- Task immediately understandable? Images clear for young children? Writing space large enough? Letters not too small? Page not overwhelming? Enough contrast? Instructions short?

## 16. Reference Fidelity Score
Score /10: layout match 3; typography match 2; spacing/alignment 2; image handling 2; print polish 1.

Do not rate above 8 if: images too small; badges overflow; handwriting lines inconsistent; missing words off-centre; major section spacing differs. Do not rate above 6 if it looks like a generic worksheet rather than the reference family.

## 17. Required Fix Report Format
**Overall Verdict** (one sentence) · **What Is Working** · **Must Fix Before Production** · **Micro Polish** · **Exact Next Instructions** (copy-paste-ready for the coding agent).

## 18. Copy-Paste Fix Prompt Template
```text
Do not redesign the worksheet. Keep the current template structure and apply only the following visual fixes.
1. Header: [...]
2. Section spacing: [...]
3. Images: [...]
4. Handwriting: [...]
5. Missing sound cards: [...]
After applying the fixes, render the PDF and run the Worksheet Visual QA Checklist before returning the output.
```

## 19. Approval Rule
Approved only when: the user says the layout is approved; QA score ≥ 8.5/10; no BLOCKER issues; no FIX issues; the template can be reused without layout drift. Once approved, freeze the template and generate future worksheets from it.

## 20. Grammar Booklet Sheets — aesthetic rules (learned on L6)
- **Writing lines:** plain `WriteLine`, never the dashed handwriting guide (see §7). The rule sits just below the prompt/arrow.
- **Row rhythm:** each activity row gets a filled level-colour numbered badge (`NumBadge`). Word banks are rounded pills / a labelled tinted panel, not a thin bordered strip.
- **Spacing rhythm (§2 header → content):** subtitle sits CLOSE under its section title (tight row-gap); leave a CLEAR gap between the subtitle and the first content block (word bank / first row). The common failure is the reverse — big title→subtitle gap, subtitle crammed onto the content.
- **Label sizes:** in-panel labels like "Choose from these words:" must be readable (≈11pt+), not tiny caption text. Child-facing words (bank words, base phrases) want to be large (≈16–17pt).
- **Clipart = line art, placed only where pedagogically useful.** B/W line-art of the house characters/objects (`LINEART=1` in `generate-clipart.mjs`), reserved for places where a picture supports the task (the noun being expanded; a §1 worked example) — NOT on abstract tasks (choosing a conjunction, marking word classes, matching function words). Don't replicate decorative ref icons. Icon slots are gated by `hasClipart(key)` so they stay clean until art exists.
- **Header tile:** a picture mascot (e.g. the `abc` blocks for grammar), not a bare text glyph. Falls back to the glyph only until the art exists.
- **Consistent text size within a sheet:** pull the activity sentence size from one shared token (`GRAMMAR_PT.sentence`), don't hard-code per template — mixed letter sizes on one worksheet look wrong. The §1 worked example should match the §2 body size.
- **Worked example for gap-fill (cloze):** model it by writing the answer ONTO the line inside the complete sentence ("I was glad **because** I found my purse."), with the answer in the accent colour + underlined. Do NOT show "sentence-with-blank → answer" with a dangling arrow — it reads as a broken sentence.
- **Use vertical space deliberately:** with few short rows in a tall panel, rule the rows (hairline under each, like the tick-grid) and enlarge the body text rather than leaving big empty gaps. Centre a word-bank band between the subtitle and the first row. Big empty gaps are the #1 tell of a sheet that wasn't eyeballed — never ship them.
- **Cap activity rows at ~6.** It's a worksheet, not a test. If there's more content, shorten or split. Eight rows is too many.
- **End every sheet with a writing-application task** (a "Now you write —" line). The L6 pedagogy is skill → activity → *use it in your own writing*; the write-it-yourself step matters as much as the activity. Writing space costs almost nothing (one or two ruled lines at the foot).
- **Self-QA discipline (do this without being asked):** open each rendered sheet and ask the obvious questions a non-expert would — is the font too small? are these two things too close / too far? does this line need to be here, and is it in the right place? is there dead white space? Fix what's clearly off BEFORE showing the user. Don't make the user point out basics.

## 21. Flowy chrome — CURRENT grammar standard (supersedes the boxed look)
The L6 grammar booklet uses the "flowy" system in `FlowyLayout.tsx` + `FlowySheet.tsx` (not the old bordered `GrammarLayout`). Rules:
- **Don't look like HTML.** No rigid panels/boxes everywhere; use soft, borderless **tinted shapes** for the few things that group (the §1 Watch-first box, a word bank). Geometric perfection (straight rules, uniform rounded rects, flat fills, grid-snapped everything) is what reads as "made on a computer."
- **Flow = our motif, not RWI's stars.** A full-bleed **wavy header** (title only — no pills, no mascot tile) and a **barely-there ground wave**. Flow lives ONLY where there is no text — never tint behind body text.
- **Corner character is BOOK-ANCHORED, not on every page.** Set `unit.character` only where that book's character art exists (owl → the Brown Owl sheets). The same character on all 7 pages reads as repetitive/lazy. Generate each book's character to fill the rest.
- **Writing lines are dark** (`FLOW.line` ≈ #444, not faint grey) so children can see them. Full-sentence writing tasks get **two** lines.
- **No ruled line under each sentence** (cloze/circle): the write-in gap IS the line; an extra full-width rule under every sentence is clutter. (Tick-grid keeps row lines — it's a table.)
- **The full-bleed top must truly bleed** — back the wavy header with a solid top fill so there's never a white sliver above it.
- **Page-number badge in the corner** (soft circle, level colour) — it's a booklet, so NOT the unit code. `getGrammarPage()` (front matter = pages 1–3).
- **Big type, NO bold anywhere** — black/accent colour carries emphasis. Shared sentence size (~18pt); examples ~19pt. Never go small.
- **§1 Watch-first** in its own soft box: gap-fill formats write the answer onto the line in the full sentence; long examples stack prompt-over-answer; others show prompt → answer (+ optional picture).
- Keep §6/§7/§20 rules (ruled rows, ≤6 rows, a writing task to finish, writing line well below its label, no bg over text).
