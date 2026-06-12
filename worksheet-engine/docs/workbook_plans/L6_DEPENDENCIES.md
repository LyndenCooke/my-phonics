# L6 Edition B workbook — authoring dependencies (content gaps)

These pages render with the LAYOUT COMPLETE and the content slot clearly
flagged empty. They are excluded from the QA pass-list and re-enter QA when
the approved content lands. Per the build instruction, none of this content
may be selected or written by the build — it must be authored and approved
(master plan §6).

## 1. SW2 comprehension question sets (master plan §6.1)

Three questions per book, answerable in one full sentence, authored from the
book texts and decodability-checked at L6. The questions in the story data
files (`questions` blocks) are grown-up-read prompts and are NOT
decodability-checked for child reading, so they were not used.

| Page (Edition B) | Pool id | Needed |
|---|---|---|
| p7 | L6.B1.SW2 | 3 questions from The Purple Purse |
| p18 | L6.B2.SW2 | 3 questions from The Brown Owl |
| p29 | L6.B3.SW2 | 3 questions from The New Glue |

(B4 has no SW2 by plan.)

## 2. Big-write improve-step weak/strong pairs (master plan §6.2)

One weak/strong sentence pair per book (the moment to improve and extend),
authored from the book text. The slot is the dashed box above the plan box.

| Page | Pool id | Moment (per plan) |
|---|---|---|
| p12 | L6.B1.BW1 | a Purple Purse moment |
| p23 | L6.B2.BW1 | the owlets moment |
| p35 | L6.B3.BW1 | the glue moment |
| p43 | L6.B4.BW1 | the monkey moment |

## 3. Spelling test word lists (master plan §6.4)

Ten words per book test from the book's focus sounds + the L6 tricky words,
plus the half-term list drawn across the block. The test pages themselves
are complete (T10 never prints words); the gap is the published list in
TEACHER_SEQUENCE_L6.md and the corresponding Answers entries (currently
flagged "Word list to come"). SWYK answers must be checked against the
final lists (SWYK answers exclude test words).

| Page | Pool id | Needed |
|---|---|---|
| p11 | L6.B1.ST1 | 10 words (ur er + tricky their, oh) |
| p22 | L6.B2.ST1 | 10 words (are ow + tricky people, Mr, Mrs) |
| p34 | L6.B3.ST1 | 10 words (ew ue + tricky looked, called, asked) |
| p42 | L6.B4.ST1 | 10 words (review + tricky could) |
| p47 | L6.ST-HT | 10 words across all four books |

## 4. Joined display font approval (not content, but gating)

The eight handwriting pages (p8, p13, p19, p24, p30, p36, p41, p44) render
their tramline grids complete with the model rows withheld (PENDING-FONT).
Playwrite GB J is implemented and sampled (`output/font-sample__6.pdf`);
on approval the models switch on by clearing `pendingFont` in
`src/data/pool/l6.ts` — no layout change.
