# Grammar booklet: planning brief for Claude Chat

You are the PLANNER. Read everything below, then produce a complete plan and the
content files for the MyPhonicsBooks grammar worksheet booklets. Nothing is
assumed: all the context you need is in this brief.

## The workflow you sit in
1. Claude Chat (you): turn this brief into a precise plan, exact contents and
   ready-to-save Markdown files.
2. Cowork (file + environment agent): takes your output and writes it into the
   repo, renders previews, runs checks.
3. Claude Code (operations): implements the React/TypeScript changes in the
   worksheet-engine.

So your output must be implementation-ready and unambiguous: exact text, exact
layout values, exact file contents. Do not hand-wave. Where you specify layout,
give millimetres and point sizes. Where you specify content, give the exact
words and the answer key.

## House style rules (non-negotiable, apply to everything you write)
- British English spelling and punctuation throughout.
- NO em dashes anywhere. Use a colon, semicolon or full stop.
- No Oxford commas.
- NO bold in the worksheets. Emphasis is carried by the accent colour and size.
- Warm, plain, child-facing instructions.

---

## 1. Project context
MyPhonicsBooks is a decodable phonics scheme for UK children aged 4 to 8. The
`worksheet-engine` is a Next.js app (React + TypeScript). Each worksheet is a
print route rendered to a print-accurate A4 PDF by Puppeteer (headless Chrome).
Fonts: Andika is the current handwriting/body face (a placeholder for Sassoon
Primary; swapping the font must never change the layout). Page is A4 portrait,
210 x 297 mm, 6 mm outer margin, 198 mm content width, positioned in millimetres.

The scheme has 8 levels, each with its own colour:
L1 Ditties Pink #E84B8A, L2 First Sounds Coral #F97066, L3 Special Friends Amber
#F59E0B, L4 Longer Sounds Green #22C55E, L5 New Spellings Blue #3B82F6,
L6 Building Fluency Indigo #6366F1, L7 Reading Together Purple #8B5CF6,
L8 Reading Champion Teal #14B8A6. Colour is read from getLevelTheme(level), never
hard-coded.

Grammar is its own standalone booklet at every level, running parallel to the
phonics (sound) sheets, with its own NC-aligned scope and sequence. Worksheets
must obey the decodable rule: every word is decodable using the GPCs taught at or
before that level, or is a listed tricky / common-exception word for that level
or earlier. L6 sentence-length band is 6 to 12 words.

## 2. The look we want: the "flowy" state (keep it)
The approved aesthetic is "flowy", and it must be kept (do not revert to a boxed,
bordered, sound-sheet chrome):
- A full-bleed wavy header band in the level colour, worksheet title only, white,
  centred. No pills or mascot tile in the header.
- A soft tinted "Watch first" box for the worked example (the I do step). Tint is
  the level light colour, no hard border.
- Big, calm, readable type, generous white space, a faint "ground wave" at the
  foot, a round page-number badge in the level colour.

## 3. Locked design rules (the worksheet-design skill, in full)
- Type: ONE scale, same role same size on every page. Target scale: title 27pt,
  instruction 16pt, body/sentence/word-bank/example 18pt, footer 9pt. Sentences
  are never too small. There is NO tier of tiny grey text. Every instruction is
  the normal instruction size. Do not append little subtitles, hints or
  sub-prompts ("Have a first look", column hints under headers, "a sentence using
  so" tacked onto "Now you write"). The apply task is one normal line, e.g.
  "Now you write a sentence using so."
- Writing lines: grammar answers are written on PLAIN black ruled lines. Do NOT
  use the 3-zone handwriting guide (faint top, dashed x-height, descender) on
  grammar sheets; that guide is for the handwriting strand only. One fixed row
  height gives a constant, generous gap between every black line, the same gap
  from the instruction to the first line, uniform across the whole booklet. A
  cloze gap inside a sentence is a short, tight underline with even space either
  side, no large odd gaps.
- Imagery: use the book's world, several different line-art objects and
  characters (owl, purse, glue, branch, leaf, moon...), placed creatively in the
  white space, varied position per sheet, NOT always the bottom corner, NEVER a
  single cropped raster photo. Flat line-art, white background, trimmed, generous
  consistent size, never shrunk to fit. Creatures use small solid pure-black
  round dot eyes (no whites, no shines, no coloured irises).
- Worked example (Watch first): short example = prompt, arrow, answer on one line
  with the arrow centred, answer in the accent colour. Long example (a full
  sentence, e.g. tense rewrite) = STACK it, prompt on one line, corrected answer
  below; it must fit and never overflow.
- Pedagogy: I do (Watch first), We do (first row together), You do (the rest),
  then one apply line. Teach and name statutory grammar terminology.
  Exclamations are the statutory form: start with What or How, have a subject and
  a verb, and end on an action verb, never on "is" or "was".
- Booklet assembly: cover, contents, how-to, the units, a review or challenge, an
  answer key, a certificate. Never ship bare concatenated worksheets.

## 4. Current engine state (so you know what exists)
- Active renderer: `src/components/grammar/FlowySheet.tsx` (dispatches by format)
  wrapping `src/components/grammar/FlowyLayout.tsx` (the flowy chrome). The print
  route `src/app/print/grammar/[unit]/page.tsx` renders FlowySheet.
- An alternative boxed chrome exists (`SheetShell.tsx`, `GrammarLayout.tsx`) but
  is not the active grammar renderer; the flowy one is. `WriteLine` (the writing
  line component) lives in GrammarLayout and is now plain black ruled lines.
- Data: `src/data/grammar/l1.ts` ... `l8.ts`, typed by
  `src/data/grammarSchema.ts` (v2). Registry: `src/lib/grammarRegistry.ts`.
- Schema (v2) fields per unit: id, code, level, levelLabel, strand, levelSubtitle,
  name (header title), doInstruction (the §2 instruction), objective, ncLink,
  terminology[], anchorBook, decorations[] (varied line-art objects with xMm/yMm/
  sizeMm), s1 { prompt, answer, note?, tags?, image? } (the Watch-first example),
  weDoCount, apply { prompt }, format. Format payloads: tickgrid, build, cloze,
  circle, match, rewrite.
- PDF pipeline: `npm run dev` then `npm run pdf` renders each print route to
  `output/<...>.pdf` with Puppeteer. Chromium is installed locally.

## 5. The grammar scheme and the L6 content
The standalone grammar scheme (docs/grammar_scheme_of_work.md) spirals five
domains across L1 to L8: word structure and word classes; sentence structure;
text and cohesion; punctuation; statutory terminology. L6 is the Year 2 statutory
booklet "Building Fluency" (Indigo), anchored to the four L6 books: The Purple
Purse (ur, er), The Brown Owl (are, ow), The New Glue (ew, ue), The Cheeky Monkey
(review). Examples are book-linked and sound-linked (they reuse the level's
sounds), and decodable at L6.

The seven L6 grammar units (exact content, already approved):

- G-L6.1 Four kinds of sentence (tickgrid). Watch first: "How high the brown owl
  flew!" = Exclamation. Rows to tick (Statement/Question/Command/Exclamation):
  "The owl sat on a bare branch." (Statement), "What was that noise?" (Question),
  "Look up at the tree!" (Command), "What a loud howl the owl made!" (Exclamation),
  "The owl stared down at me." (Statement), "Can we go and look?" (Question).
  Apply: write a command about the owl.
- G-L6.2 Make the noun phrase grow (build). Bank: brown, new, blue, bare, soft,
  fluffy, big, purple. Watch first: "the owl" -> "the big brown owl". Rows:
  the glue -> the new blue glue; the purse -> the soft purple purse; the branch ->
  the bare brown branch; the owlets -> the soft fluffy owlets. Apply: write a big
  noun phrase about an owl.
- G-L6.3 Joining with and, but, or, so (cloze). Bank: and, but, or, so. Watch
  first: "He turned to look ___ he did not see the patch." = but. Rows: "The glue
  was wet ___ it stuck to her hand." (so); "She drew a bird ___ she gave it to
  Mum." (and); "We can use glue ___ we can use tape." (or); "The cup fell ___ the
  tea ran on the rug." (so). Apply: write a sentence using so.
- G-L6.4 Joining with when, if, that, because (cloze). Bank: when, if, that,
  because. Watch first: "I was glad ___ I found my purse." = because. Rows: "We
  can see the owl ___ we stay still." (if); "I think ___ the owl is rare." (that);
  "The owlets cheep ___ they want food." (because); "We set off ___ it got dark."
  (when). Apply: write a sentence using because.
- G-L6.5 Adjectives and adverbs (circle: circle the adjective, underline the
  adverb). Watch first: "The brown owl flew quickly." (adjective brown, adverb
  quickly). Rows: "The bare branch swayed gently." (bare/gently); "The new glue
  stuck fast." (new/fast); "The purple purse sat safely in her bag."
  (purple/safely); "The cross cat ran off quickly." (cross/quickly). Apply: write
  a sentence with an adjective and an adverb.
- G-L6.6 Apostrophes for contractions (match, draw a line). Watch first: do not ->
  don't. Pairs: I am -> I'm; it is -> it's; did not -> didn't; we are -> we're;
  can not -> can't. Apply: write a sentence using it's about the owl.
- G-L6.7 Keep the tense the same (rewrite; long example, must stack). Watch first:
  "I turn out my pockets and found my purse." -> "I turned out my pockets and
  found my purse." Rows (rewrite all in the past): "The card flew off and stick to
  the cat." (stuck); "The cat grew cross and run off." (ran); "She drew a bird and
  give it to Mum." (gave); "Dad turned to look and slips over." (slipped). Apply:
  write what happened next in the past tense.

## 6. The issues with the current layout (fix these)
1. The booklets are bare concatenated worksheets (L1 is 3 pages); there is no
   cover, contents, how-to, review, answer key or certificate. Make it a workbook.
2. Font sizes were inconsistent (around twenty ad-hoc sizes). Lock to one scale.
3. Bold appeared where there should be none. No bold anywhere.
4. Writing lines were inconsistent. They must be plain black ruled lines with one
   constant, generous gap between lines and a constant gap from the instruction;
   the same on every sheet. The line-to-line spacing in the rewrite sheet was the
   target spacing.
5. Tiny grey appended text was being added ("Have a first look", column hints,
   "a sentence using so"). Remove it; all instructions in the normal size.
6. Imagery was wrong: a single cropped photo of one character in the bottom
   corner. We want varied line-art objects and characters placed creatively
   across the page, different per sheet, never always the corner.
7. Long worked examples overflowed the page and the arrow was crammed against the
   answer. Short examples = inline with a centred arrow; long examples = stacked.
8. Cloze gaps had large odd spaces around them; tighten and even them.
9. Keep the flowy look. Do not revert to a boxed sound-sheet chrome. Do not place
   a phonics sound sheet inside a grammar booklet.

## 7. What to produce (your deliverables)
Produce these as clean Markdown, ready to save into the repo:

1. **`grammar_layout_spec.md`**: the definitive flowy grammar page spec. Exact A4
   regions in mm (header, terminology line if any, Watch-first box, activity
   area, apply, footer, decoration layer), the one type scale (roles -> pt), the
   writing-line spec (row height, line-to-line gap, instruction-to-line gap), the
   imagery rule (how many objects, placement logic, sizes), the short-vs-long
   worked-example rule, and per-format layout (tickgrid, build, cloze, circle,
   match, rewrite). Include acceptance checks.
2. **`grammar_issues_analysis.md`**: each issue above, the root cause, and the
   exact fix, so Claude Code knows precisely what to change.
3. **`grammar_L6_contents.md`**: the seven L6 units exactly (section 5), each with
   its Watch-first example, rows, answers, apply line, anchor book, the sounds it
   revisits, and the decoration objects to place (which line-art keys, where).
   Plus the booklet front/back matter copy (cover, contents, how-to, review,
   answer key, certificate).
4. **A content template** for extending the same to L1 to L8 (what changes per
   level: sounds, books, grammar focus from the scheme), so the other levels can
   be filled in the same shape.
5. A short note on any **data-schema changes** needed to support the above
   (e.g. fields for decoration placement, example-length handling).

Be exact. This goes straight to implementation.
