---
name: worksheet-design
description: The locked design and pedagogy rules for every MyPhonicsBooks printable worksheet (phonics, grammar, handwriting, spelling). Use whenever creating, editing or rendering a worksheet, booklet, sound sheet or grammar sheet in the worksheet-engine, or generating any worksheet PDF. Enforces the flowy house style, one font scale, no bold, plain consistent writing lines, varied creative imagery, the decodable rule and British English.
---

# MyPhonicsBooks Worksheet Design

Single source of truth for how a worksheet looks and teaches. Do not invent a new chrome, do not declare your own layout "locked", do not override these. New activity formats supply content only; the frame and the constants are fixed. Render the real engine (Chromium via the PDF pipeline) to check work; never judge from an approximate preview.

## 1. House style: the flowy state (keep it)
- A full-bleed wavy header band in the level colour, worksheet title only, white, centred. No pills or tile in the header.
- A soft tinted "Watch first" box for the worked example (the I do step). Tint is the level light colour, never a hard border.
- Big, calm, readable type, generous white space, a faint "ground wave" at the foot, a round page-number badge in the level colour.

## 2. Type: one scale, and NO BOLD
- NEVER bold. Emphasis comes from the accent colour and size, never weight. Andika everywhere (placeholder for Sassoon; swapping the font must not change layout).
- ONE shared type scale, same role same size on every page: title 27pt, instruction 16pt, body/sentence/word-bank/example 18pt, footer 9pt. Sentences are never too small.
- There is NO tier of tiny grey text. Every instruction is the normal instruction size. Do not append little subtitles, hints or sub-prompts ("Have a first look", column hints under headers, "a sentence using so" tacked onto "Now you write"). If it needs saying, say it once, normal size. The apply task is one normal line: "Now you write a sentence using so."

## 3. Writing lines: plain, black, evenly spaced
- Grammar and sentence answers are written on PLAIN black ruled lines. Do NOT use the 3-zone handwriting guide (faint top, dashed x-height, descender) on grammar sheets; that guide is reserved for the handwriting strand only.
- One fixed row height gives a constant, generous gap between every black line, and the same gap from the instruction down to the first line, on every sheet. The line-to-line spacing must be uniform across the whole booklet.
- A cloze gap inside a sentence is a short, tight underline with even space either side; do not leave large odd gaps around it.

## 4. Imagery: varied, line-art, placed with creativity
- Use the book's world: several different line-art objects and characters (owl, purse, glue, branch, leaf, moon...), not one image repeated, and never a single cropped raster photo dropped in a corner.
- Place them creatively in the white space, varied position per sheet. Not always the bottom-right corner. They sit on their own layer and never push the content around.
- Flat line-art / single-object clipart, pure-white background, trimmed tight, generous and consistent size. Never shrink an image just to fit more on a page.
- Creatures use small solid pure-black round dot eyes. No whites, no shines, no coloured irises. Non-negotiable.

## 5. Worked example (Watch first)
- Short example: prompt, arrow, answer on one line, the answer in the accent colour, the arrow centred between them, not crammed against the answer.
- Long example (a full sentence, e.g. tense rewrite): STACK it, prompt on one line and the corrected answer on the line below. It must fit inside the box and never overflow the page.

## 6. Colour
- Every colour from getLevelTheme(level). Never hard-code a hex. A mis-keyed level fails loudly, never falls back to pink. Levels: 1 Pink, 2 Coral, 3 Amber, 4 Green, 5 Blue, 6 Indigo, 7 Purple, 8 Teal.

## 7. Language and punctuation
- British English throughout. NO em dashes (use a colon, semicolon or full stop). No Oxford commas. Short, plain child-facing instructions.

## 8. Decodable rule and bands
- Every word is decodable using GPCs taught at or before its level, or is a listed tricky or common-exception word for that level or earlier. Defer to the Curriculum Ledger. Stay inside the level sentence-length band.

## 9. Pedagogy on every sheet
- I do (Watch first, worked example), We do (do the first row together), You do (the rest), then one apply line.
- Teach and name statutory grammar terminology. Exclamations are the statutory form: start with What or How, have a subject and a verb, and end on an action verb, never on "is" or "was".

## 10. Booklet assembly (a workbook, not loose sheets)
- Order: cover, contents, how-to, the units, a review or challenge, an answer key, a certificate. Never ship bare concatenated worksheets.

## 11. Acceptance checks
1. No bold anywhere; only the shared type-scale sizes; no tiny grey appended text.
2. Writing lines are plain black, evenly spaced, with the same instruction-to-line and line-to-line gap across the booklet.
3. Imagery is varied line-art placed creatively, not one cropped photo in the corner.
4. Long worked examples are stacked and fit; short ones have a centred arrow.
5. Zero em dashes; British English. Every word passes the decodable check.
6. Colours only from getLevelTheme(level). Booklet has cover, contents, how-to, units, review, answers, certificate.
