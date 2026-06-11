# L6 Grammar booklet: worksheet build spec

This is the page-level specification for the seven L6 Grammar worksheets. It exists because the first build let the code decide the pedagogy and the styling, and both drifted. This document fixes the content, the teaching shape and the layout so the renderer only draws what is written here. It never invents content.

Read with: `grammar_scheme_of_work.md` (the scheme), `worksheet_template_spec.md` (the design contract), `SingleSound.tsx` (the approved sound_a master), `TraceLine.tsx` and `handwriting.ts` (the metric-driven writing lines).

---

## A. What the current build got wrong (correct before rebuilding)

1. **Cut-outs.** `GrammarSort.tsx` renders dashed cut-out cards and sorting bins for G-L6.1. These booklets are bound: there are no scissors activities. Every sort becomes a write-in, tick or draw-a-line task.
2. **Wrong chrome.** The grammar sheets wrap `WorksheetFrame` (minimal black-on-white: tiny badge, one thin rule). The approved look is the `sound_a` master in `SingleSound.tsx`: a full level-colour header bar, bordered rounded panels, numbered section heads and a grey footer bar. Grammar must use that same chrome so a Grammar sheet and a Sound sheet look like one scheme.
3. **Wrong writing lines.** `GrammarFrame` defines its own `WriteRule` (a dashed line plus a solid line) and uses it in Build and Rewrite. No grammar component imports `TraceLine`. Every writing row must use `TraceLine` so letters seat on real Andika metrics, exactly as on the sound sheets.

### Required engineering changes (before content)

- Extract the `sound_a` chrome from `SingleSound.tsx` into a shared frame (header bar, panel, `SectionHead`, footer) and have both Sound and Grammar render through it. Do not rebuild a parallel chrome.
- Delete `WriteRule` and `AnswerBox`. Every writing line is a `TraceLine`. Every short answer slot is a short `TraceLine` (a ruled gap), not a plain box.
- Remove the cut-out path from `GrammarSort`. Replace with the tick-grid in G-L6.1 below.
- Keep the data layer (`grammarSchema.ts`, `l6.ts`) but apply the content corrections in section D.

---

## B. Shared visual contract for every grammar sheet (mirror sound_a)

Fixed A4 210 x 297 mm, outer margin 6 mm, content width 198 mm. Indigo theme from `getLevelTheme(6)` (`primary #6366F1`, `light #ECEDFE`, `border #B6B9FA`, `accentText #4338CA`). Never hard-code these. Andika throughout. British English.

Layout map (mm), same rhythm as the sound master:

| Region | y, h | Contents |
|---|---|---|
| Header bar | 6, 26 | Indigo bar, radius 6. White title (the worksheet objective, 26-28pt, centred). Left white tile: the L6 book mascot. Right pills: white "L6" pill over an indigo-tint "Grammar" pill. Identical to the sound header, strand pill says Grammar. |
| §1 "Watch first" (I do) | 36, 26 | Bordered white panel. Numbered circle 1, title "Watch first", grey subtitle "I do it. You watch." Inside: the worked example as `prompt → answer`, the answer in the indigo accent. This is the modelled step, shown already done. |
| §2 activity (We do then You do) | 66, 213 | Bordered white panel. Numbered circle 2, title = the doing instruction. The first one or two rows are tagged "We do" (a faint indigo dot), the rest "You do". Rows use `TraceLine` for any writing. |
| Footer | 285, 7 | Grey #F1F1F1 bar. Left: MyPhonicsBooks brand. Right: "Grammar · G-L6.x". |

Writing-line rules (all via `TraceLine`):

- Sentence-writing rows: `xHeightMm: 6`, full panel width, `midlineColor` = theme border, ascender line on.
- Short answer gaps inside a printed line (a missing conjunction, a contraction): a `TraceLine` segment about 24-30 mm wide, `xHeightMm: 6`, no ascender, sitting on the text baseline.
- Never use a plain rectangle for writing. Never hand-draw a line.

Terminology chips: a thin row under the header showing the NC link on the left and the statutory terms on the right, in the indigo accent. Same on every sheet.

Teaching shape on every sheet: **I do** (§1 worked example), **We do** (first rows of §2, lightly scaffolded), **You do** (remaining rows, independent), then where space allows a one-line **apply** task at the foot of §2.

---

## B2. Sound-linked and book-linked examples (the L6 USP)

Two rules make this booklet part of the scheme, not generic grammar practice. The renderer still uses only the words written in section C; these tables explain the sourcing, they are not a licence to substitute.

1. **Sound-linked.** Where the grammar allows, example words carry the L6 graphemes so grammar practice also revisits the sounds. L6 new code: ur, er, are, ow (as in cow), ew, ue, plus the consonant alternatives wr, kn, ge, dge, mb, gn, ph, wh. Reach first for the book vocabulary below, which is already sound-rich.
2. **Book-linked.** Examples are drawn or lightly adapted from the four L6 books, so the grammar feels tied to the reading the child has just done. Each worksheet is anchored to one book.

L6 books and their sound-rich vocabulary (from the story data):

| Book | Sounds | Words to draw on |
|---|---|---|
| The Purple Purse | ur, er | purple, purse, turned, fur, burst, church, hurt, her, ferns, corner, herbs, seller, never, after |
| The Brown Owl | are, ow (cow) | stared, bare, rare, dare, care, shared, scared; howl, growl, brown, down, owl, owlets, wow, crowded, how, now |
| The New Glue | ew, ue | new, drew, flew, grew, threw, chewed; glue, blue, due, true, rescued |
| The Cheeky Monkey (review) | mixed L6 | revisits all of the above |

Worksheet-to-book anchor:

| Unit | Anchor book | Why it fits |
|---|---|---|
| G-L6.1 sentence types | The Brown Owl | the story holds all four types naturally ("A big brown owl!", "What was that?", "Look!", statements) |
| G-L6.2 expanded noun phrase | Brown Owl, Purple Purse, New Glue | the big brown owl, the purple purse, the new blue glue |
| G-L6.3 co-ordination and/but/or/so | The New Glue | the book's own grammar focus is connectives (but, so, then) |
| G-L6.4 subordination | Purple Purse, Brown Owl | because/when/if/that fit the search and the owl-watch |
| G-L6.5 adjectives and adverbs | The Brown Owl | rich in describing words and manner (stared, swooped down) |
| G-L6.6 contractions | cross-book dialogue | "It is true", "I did not dare" become it's, didn't |
| G-L6.7 tense consistency | New Glue, Purple Purse | past-tense recounts to keep consistent |

---

## C. The seven worksheets (content is final, render exactly this)

Sentence-length band L6 is 6 to 12 words. Examples use sounds and tricky words taught at or before L6 and are anchored to the L6 books (section B2). See section D for the deliberate exceptions.

### G-L6.1 Four kinds of sentence
- **NC:** Year 2 · sentence. **Terminology:** statement, question, command, exclamation.
- **Objective (header):** "Which kind of sentence is it?"
- **Format (no cut-out):** a tick grid. Each sentence is a row; four narrow tick columns headed Statement, Question, Command, Exclamation. The child ticks one. The end mark is the clue.
- **Anchor book:** The Brown Owl.
- **Teaching point (put on the sheet):** an exclamation starts with **What** or **How** and has a subject and a verb (for example "How high the brown owl flew!"). The exclamation mark on its own is not enough. End it on an action verb (flew, made, swooped), never on "is" or "was", so it does not sound stilted.
- **I do (§1):** `How high the brown owl flew!` → tick **Exclamation** (starts with How, has a subject and verb, ends on the action verb "flew").
- **We do (first 2 rows, arrowed):**
  - `The owl sat on a bare branch.` → Statement
  - `What was that noise?` → Question
- **You do (rows 3 to 8):**
  - `Look up at the tree!` → Command
  - `What a loud howl the owl made!` → Exclamation
  - `The owl stared down at me.` → Statement
  - `Can we go and look?` → Question
  - `Come down to the path now.` → Command
  - `How fast that owl swooped down!` → Exclamation
- **Apply (one `TraceLine` row):** "Write a command about the owl." (e.g. `Stand by the tree.`)
- **Sounds revisited:** brown, owl, down, howl (ow); flew (ew); bare, stared (are).

### G-L6.2 Make the noun phrase grow
- **NC:** Year 2 · sentence. **Terminology:** noun phrase, adjective, noun.
- **Objective:** "Add describing words to grow each noun phrase."
- **Format:** word-bank box at the top, then rows: the base phrase printed on the left, a `TraceLine` writing row on the right to write the grown phrase. Builds on the L5 step "a noun can have words before it".
- **Anchor books:** Brown Owl, Purple Purse, New Glue.
- **Word bank (sound-rich):** brown, new, blue, bare, soft, fluffy, big, purple.
- **I do (§1):** `the owl` → `the big brown owl` (The Brown Owl).
- **We do (row 1):** `the glue` → `the new blue glue` (The New Glue).
- **You do (rows 2 to 4):**
  - `the purse` → `the soft purple purse` (The Purple Purse)
  - `the branch` → `the bare brown branch` (The Brown Owl)
  - `the owlets` → `the soft fluffy owlets` (The Brown Owl)
- **Sounds revisited:** owl, brown (ow); new, blue (ew, ue); bare, purple (are, ur).
- **Note:** answers are exemplars; any sensible adjective(s) from the bank before the noun are correct. The answer key lists these as models.

### G-L6.3 Joining with and, but, or, so
- **NC:** Year 2 · sentence. **Terminology:** conjunction, co-ordination, clause.
- **Objective:** "Choose the best joining word for each gap."
- **Format:** word-bank box (and, but, or, so), then rows printed as `before ___ after` with the gap as a short `TraceLine` slot the child writes the word into.
- **Anchor book:** The New Glue (its own focus is connectives: but, so, then).
- **I do (§1):** `He turned to look ___ he did not see the wet patch.` → `but` (The New Glue).
- **We do (row 1):** `The glue was wet ___ it stuck to her hand.` → `so`.
- **You do (rows 2 to 4):**
  - `She drew a bird ___ she gave the card to Mum.` → `and`
  - `We can use glue ___ we can use tape.` → `or`
  - `The cup fell ___ the tea ran on the rug.` → `so`
- **Sounds revisited:** glue, blue (ue); drew, new (ew); turned (ur).

### G-L6.4 Joining with when, if, that, because
- **NC:** Year 2 · sentence. **Terminology:** conjunction, subordination, clause.
- **Objective:** "Choose the best joining word for each gap."
- **Format:** as G-L6.3. Word bank: when, if, that, because. These four are flagged on the sheet as "joining words to know" (see section D).
- **Anchor books:** Purple Purse, Brown Owl.
- **I do (§1):** `I was glad ___ I found my purple purse.` → `because` (The Purple Purse).
- **We do (row 1):** `We can see the owl ___ we stay still.` → `if` (The Brown Owl).
- **You do (rows 2 to 4):**
  - `I think ___ the owl is rare.` → `that`
  - `The owlets cheep ___ they want food.` → `because`
  - `We set off down the path ___ it got dark.` → `when`
- **Sounds revisited:** purse (ur); owl, owlets (ow); rare (are).

### G-L6.5 Adjectives and adverbs
- **NC:** Year 2 · word classes. **Terminology:** adjective, adverb.
- **Objective:** "Circle the adjective. Underline the adverb."
- **Format:** a key reminder line (circle = adjective, underline = adverb), then each sentence printed large with room to mark. No writing line needed. Two marks only, both print cleanly in black.
- **Anchor book:** The Brown Owl.
- **I do (§1):** `The brown owl flew quickly.` → circle **brown**, underline **quickly**.
- **We do (row 1):** `The bare branch swayed gently.` → bare, gently.
- **You do (rows 2 to 4):**
  - `The new glue stuck fast.` → new, fast (The New Glue)
  - `The purple purse sat safely in her bag.` → purple, safely (The Purple Purse)
  - `The cross cat ran off quickly.` → cross, quickly (The New Glue)
- **Sounds revisited:** brown (ow); bare (are); new (ew); purple (ur).

### G-L6.6 Apostrophes for contractions
- **NC:** Year 2 · punctuation. **Terminology:** apostrophe, contraction.
- **Objective:** "Join each pair to its short form."
- **Format:** draw-a-line match (allowed in a booklet, no cut-out). Two columns: full form on the left, contraction on the right, scrambled. Child draws a line. Foot of panel: one `TraceLine` row to write a chosen contraction in a sentence.
- **Anchor:** cross-book dialogue ("It is true" and "I did not dare").
- **I do (§1):** `do not` → `don't` (the apostrophe stands in for the o).
- **We do:** model joining `it is` → `it's` (from "It is true", The New Glue).
- **You do (pairs, right column scrambled on the sheet):**
  - `I am` → `I'm`
  - `did not` → `didn't` (from "I did not dare", The Brown Owl)
  - `we are` → `we're`
  - `can not` → `can't`
- **Apply (one `TraceLine` row):** "Write a sentence using it's about the owl."
- **Note:** contractions are function words, so this sheet is book-linked through its dialogue rather than through L6 sounds.

### G-L6.7 Keep the tense the same
- **NC:** Year 2 · text. **Terminology:** verb, tense, past, present.
- **Objective:** "Each sentence slips from past to present. Write it all in the past."
- **Format:** the slipped sentence printed, a `TraceLine` writing row below to rewrite it. The verb to fix is the second one in each sentence.
- **Anchor books:** Purple Purse, New Glue.
- **I do (§1):** `I turn out my pockets and found my purse.` → `I turned out my pockets and found my purse.` (The Purple Purse)
- **We do (row 1):** `The card flew off and stick to the cat.` → `The card flew off and stuck to the cat.` (The New Glue)
- **You do (rows 2 to 4):**
  - `The cat grew cross and run off.` → `The cat grew cross and ran off.`
  - `She drew a bird and give it to Mum.` → `She drew a bird and gave it to Mum.`
  - `Dad turned to look and slips over.` → `Dad turned to look and slipped over.`
- **Sounds revisited:** purse, turned (ur); flew, drew, grew (ew).

---

## D. Decodability and terminology flags (deliberate decisions)

1. **Function-word conjunctions in G-L6.4.** `because`, `when`, `if`, `that` are required for Year 2 subordination, but `because` is a Year 2 common exception word that our spelling progression masters at L7. Decision: teach all four at L6 as "joining words to know", presented in the bank with a small marker, the same way tricky words are recognised before they are spelled. The child selects and copies them with support; full spelling accountability sits at L7. Mark them on the sheet, do not treat them as fully decodable.
2. **Adjective bank in G-L6.2.** The bank is the books' own sound-rich describing words: brown, new, blue, bare, soft, fluffy, big, purple. All decodable at L6 (`purple` uses ur, `bare` uses are, `new` and `blue` use ew and ue). The first build's `old` (an L7 common exception word) was removed.
3. Everything else in section C is decodable using L1 to L6 sounds and the cumulative tricky-word list. The renderer must not substitute its own words.
4. **Book sentences are lightly adapted, not lifted verbatim.** Some book lines are shortened or altered to fit the grammar task and the 6 to 12 word band (for example a tense slip is introduced on purpose in G-L6.7, and exclamations are recast into the statutory What/How form in G-L6.1). The characters and meaning stay true to the book so the link is real.

---

## E. Answer key (back of booklet)

- **G-L6.1 (Brown Owl):** Statement: "The owl sat on a bare branch.", "The owl stared down at me." Question: "What was that noise?", "Can we go and look?" Command: "Look up at the tree!", "Come down to the path now." Exclamation: "How high the brown owl flew!", "What a loud howl the owl made!", "How fast that owl swooped down!" Adult note: a statutory exclamation starts with What or How and has a subject and verb, ending with ! and on an action verb ("How high the owl flew!"). Contrast a question, which asks and adds a helper verb ("How high did the owl fly?"), and a command, which tells someone to do something ("Look at that owl!"). We avoid ending on "is" or "was", which sounds stilted.
- **G-L6.2:** model answers: the big brown owl, the new blue glue, the soft purple purse, the bare brown branch, the soft fluffy owlets. Accept any sensible adjective(s) from the bank before the noun.
- **G-L6.3 (New Glue):** but (modelled), so, and, or, so.
- **G-L6.4 (Purple Purse, Brown Owl):** because (modelled), if, that, because, when. Adult note: "because" answers a why; "when" answers a time; "if" sets a condition; "that" links a thought.
- **G-L6.5 (Brown Owl):** brown/quickly (modelled), bare/gently, new/fast, purple/safely, cross/quickly.
- **G-L6.6:** it is→it's, I am→I'm, did not→didn't, we are→we're, can not→can't. Child-facing terms are "contraction" and "apostrophe"; the statutory "compound" is not used here.
- **G-L6.7 (Purple Purse, New Glue):** the second verb put back into the past: turned; stuck; ran; gave; slipped.

---

## F. Definition of done (QA before sign-off)

1. Side by side, an L6 Grammar sheet and the `sound_a` sheet read as one scheme: same indigo header bar, same panel borders and radius, same numbered section heads, same grey footer.
2. Every writing line is a `TraceLine`. Place the test word `tall pin dog jump` in a row and confirm letters seat on the baseline with descenders reaching the bottom line.
3. No dashed cut lines, no sorting bins, no scissors language anywhere.
4. Colours come only from `getLevelTheme(6)`. No hard-coded indigo, no leftover pink.
5. Every example word checks against the L6 decodable list plus the cumulative tricky list, except the four flagged conjunctions in G-L6.4.
6. Renders through the print route to a clean A4 PDF, content filling roughly 96 percent of the height, nothing clipped.
7. Build order: fix the shared chrome and `TraceLine` wiring first, rebuild G-L6.1 (tick grid) and G-L6.7 (rewrite) as the two that exercise the grid and the writing rows, visual-QA those two, then the remaining five.
