# Worksheet Recreation Skill

## Purpose
Recreate worksheet layouts from a visual reference with high fidelity, then turn them into editable, reusable, print-ready templates (phonics worksheets, handwriting sheets, early-years/primary resources, decodable packs).

The goal is **not** to create a new worksheet inspired by the image. The goal is to:
1. Read the reference image carefully.
2. Extract the layout system behind it.
3. Recreate the page as a fixed print design.
4. Preserve the visual hierarchy, proportions, spacing, alignment and aesthetic quality.
5. Make controlled improvements only when requested.
6. Convert the result into a reusable template system.

## Golden Rule
Do not design from memory. Do not improvise. Do not create a generic worksheet. The visual reference is the source of truth. Reproduce the reference layout first; content changes come second.

## Output Standard
A successful recreation should look like it belongs in the same worksheet pack as the reference: print-ready, balanced, intentional, child-friendly, pedagogically clear, visually consistent, professionally typeset — not like a webpage, generic PDF, or raw HTML.

## When To Use
Recreate a worksheet from an image; convert an image-generated worksheet into code; pixel-perfect worksheet; reusable template; copy a PDF/screenshot layout; improve a coded worksheet to match a reference; build a worksheet generator; create a pack from one visual style.

## Required Workflow

### Phase 1: Visual Reading
Inspect the reference as a designer: page size, orientation, margins, header/footer regions, activity sections, section numbering, border radius/thickness, colour palette, typography hierarchy, image placement, handwriting line style, grid, spacing rhythm, density, intentional white space, repeated components, custom positioning. Never skip this.

### Phase 2: Layout Map
Before coding, write a layout map: canvas size, safe margins, header/footer x/y/w/h, each section panel x/y/w/h, title positions, instruction positions, card positions, image-box positions, handwriting line positions, badge positions, type sizes, line weights, colour values, spacing values. Use fixed coordinates or fixed ratios. Do not rely on auto-flow for the main layout.

### Phase 3: Template Extraction
Components: page shell, header, sound tile, title block, level badge, sound badge, section panel, section number circle, section heading, instruction text, image card, handwriting row, trace word box, blank writing box, missing sound card, footer bar. Each component has strict sizing/positioning rules.

### Phase 4: Code Generation
Use a fixed print layout (SVG / reportlab / HTML+CSS absolute / React+SVG). Avoid normal flowing HTML, flexible main-structure layouts, content-driven section heights, responsive behaviour, browser default line heights. Place every major element intentionally.

### Phase 5: Visual QA
Compare against the reference image (run `worksheet_visual_qa_checklist.md`). Fix visual problems before content generation.

### Phase 6: Template Lock
Once correct, lock it. Only change words, images, sounds, instructions, page numbering, titles. The layout stays stable across the pack.

## Pixel-Perfect Interpretation
"Pixel-perfect" reproduces proportions, hierarchy, spacing rhythm, alignment, type scale, component relationships, aesthetic feel, print density, page balance — not accidental generation artefacts. Straighten uneven lines, place misaligned badges properly, standardise inconsistent handwriting lines, use clean editable text.

## Common Failure Modes
- **Generic worksheet** (simple title, thin divider, lots of white space, weak boxes): return to the layout map; recreate header/panels/borders/spacing exactly; match density before changing content.
- **Large empty gaps**: fixed section heights; panels fill the page; enlarge images/handwriting; use ~88–94% of page height before the footer.
- **Header doesn't fit**: controlled header region; vertically centre all elements; keep badges inside the pink; reduce badge height/font; tighten title; proportionate sound tile.
- **Images tiny**: transparent PNGs; remove white backgrounds; crop to object bounds; scale to 65–80% of card; centre optically; never tiny text labels.
- **Handwriting wrong**: infant print font; align to baseline not box centre; define x-height/ascender/descender guides; consistent positions; no joined cursive unless required.
- **Missing words not centred**: centre the full imagined word; reserve invisible space for the missing letter; optical adjustments; align baselines.

## User Feedback Handling
Treat visual feedback as authoritative. Convert it into precise rules (e.g. "badge doesn't fit" → badges fully inside header, min 6mm horizontal padding, vertical-centre, no edge overlap).

## Self-Review Protocol
Run before returning output: Reference match · Page use (no large gaps, ~good height use, footer near bottom) · Typography (title large/centred, headings readable, consistent sizes, no clipping) · Images (present, large, bg removed, not over borders, optically centred) · Handwriting (dark models, light traces, consistent guides, matching baselines, descender space, appropriate trace count) · Cards (consistent radius/stroke, balanced padding, aligned) · Export (clean PDF, sharp text/lines, correct size, safe margins, reliable fonts).

## Final Instruction
Prioritise visual fidelity and professional polish over speed. Do not move on to generating more pages until the master page is visually approved.
