# Workbook Plan — L6 Building Fluency (Indigo #6366F1) — v2, correction pass

Pool-based plan. Edition B workbook: 49 pages. One six-week block (B1 d1-7,
B2 d8-14, B3 d15-23, B4 d24-28, assessment d29-30), L5-L8 standard
fortnight map compressed per book as shown in TEACHER_SEQUENCE_L6.md.
Theme: `getLevelTheme(6)`.

The shipped L6 grammar booklet (output/qa_L6, grammar-booklet__6.pdf)
remains the VISUAL benchmark. Approved unit content is reused unchanged
from `docs/grammar_L6_contents.md` / `src/data/grammar/l6.ts`. Content bugs
logged in the master plan (6_1 Word Workshop sentences; 6_1 back cover).

## 1. Scope (Ledger L6)

GPCs new: ur er are ow(brown) ew ue (consonant alternatives live in the
sound books, not the workbook) · tricky new: oh, their, people, Mr, Mrs,
looked, called, asked, could (cum. 42) · band 6-12 words · Books: L6.1 The
Purple Purse (ur er) · L6.2 The Brown Owl (are ow) · L6.3 The New Glue
(ew ue) · L6.4 The Cheeky Monkey (review).

## 2. Strand allocations

- Grammar (re-ordered so no page references an unread book — confirmed;
  The New Glue runs nine days, not extra weeks): B1 G-L6.6 contractions +
  G-L6.7 tense · B2 G-L6.1 sentence
  types + G-L6.4 subordination · B3 G-L6.2 noun phrases + G-L6.3
  co-ordination + G-L6.5 adjectives/adverbs · B4 mixed revisit (approved
  review items). All units are benchmark T2 single pages, so they sit on
  reading days; The New Glue absorbs its third unit on W2-D3 inside its
  nine-day fortnight.
- Handwriting: FIRST JOINS, confirmed at L6 — diagonal and horizontal
  families, no lead-ins. Practice sheets only: joined models to trace and
  copy as part of the sound work, no explanation on the page (the teacher
  explains). Two pages per book, HW-SLOT, outside the phonics lesson.
  Precursive font dependency.
- Spelling: LCWC the 9 tricky words split across books + focus-sound words
  · dictation 6-12 word sentences (book text) · test 10 words.
- Big write: improve and extend a moment from the book, plan box + 9 single
  lines. Improve-step weak/strong pairs are an authoring dependency.

## 3. Pool — per book

11 pool pages per book (B3: 12, B4: 8). Art uses the approved
`grammarAssets.ts` manifest keys (all status ok).

| Pool id pattern | Page | Strand · template | Slot | Editions |
|---|---|---|---|---|
| L6.B{m}.SP1 | LCWC: focus-sound words | SP · T8 | W1-D1 RD | B:wb · A:wb |
| L6.B{m}.GR1 | Grammar unit A | GR · T2 | W1-D2 RD | B:wb · A:wb |
| L6.B{m}.SW1 | Hold the sentence | SW · T4 | W1-D3 RD | B:wb · A:book (p12, provisional) |
| L6.B{m}.DI1 | Listen and write | DI · T9 | W1-D4 RD | B:wb · A:wb |
| L6.B{m}.SW2 | Answer it in a sentence (extended) | SW · T4 | W1-D5 WO | B:wb · A:wb |
| L6.B{m}.SP2 | LCWC: tricky-word set | SP · T8 | W2-D1 RD | B:wb · A:wb |
| L6.B{m}.GR2 | Grammar unit B | GR · T2 | W2-D2 RD | B:wb · A:wb |
| L6.B3.GR3 | Grammar unit C (B3 only) | GR · T2 | W2-D3 RD | B:wb · A:wb |
| L6.B{m}.HW1 | First joins (family page) | HW · T1 | HW-SLOT W1 (outside phonics lesson) | B:wb · A:book (p13, provisional) |
| L6.B{m}.HW2 | Joined words | HW · T1 | HW-SLOT W2 (outside phonics lesson) | B:wb · A:wb |
| L6.B{m}.ST1 | Spelling test (10 words) | ST · T10 | W2-D4 WO | B:wb · A:wb |
| L6.B{m}.BW1 | Big write | BW · T5 | W2-D5 WO | B:wb · A:wb |

Per-book specifics (approved content; v1 zone maps stand):

**B1 The Purple Purse** — SP1 ur/er words; SP2 their, oh. GR1 = G-L6.6
contractions verbatim (5 match pairs; apply "write a sentence using it's";
art purse grounded-box ~18mm, cat perch ~16mm). GR2 = G-L6.7 tense verbatim
(stacked Watch first; 4 rewrite items; art cat grounded-foot, card perch).
SW1: 3 approved L6.1 sentences (art hero_purse_action grounded-foot ~18mm).
SW2: 3 approved questions × 2 single lines (authoring dependency; art purse
perch). DI1: 3 slots (Book L6.1 sentences). HW1: diagonal join family + ur
join sets. HW2: joined ur/er words + tricky set + approved phrase set.
BW1: plan box ~40mm + 9 single lines (art hero_purse_standing ~16mm).

**B2 The Brown Owl** — SP1 are/ow words; SP2 people, Mr, Mrs. GR1 = G-L6.1
four kinds of sentence verbatim (tick grid 6×4; apply command-about-the-owl;
art owl perch ~20mm, branch grounded ~18mm, leaf grounded-foot ~16mm).
GR2 = G-L6.4 subordination verbatim (cloze when/if/that/because; art owl,
purse, moon). SW1 art scene_owl_branch ~20mm; SW2 art owlets perch. HW1
horizontal join family. BW1 the owlets moment (art scene_owl_owlets_moon
~18mm).

**B3 The New Glue (9-day fortnight)** — SP1 ew/ue words; SP2 looked,
called, asked. GR1 = G-L6.2 grow the noun phrase verbatim (build, 4 rows,
row icons glue/purse/branch/owlets; art owl perch, moon grounded-foot).
GR2 = G-L6.3 co-ordination verbatim (cloze and/but/or/so; art glue, cup,
scene_cup_rug_glue). GR3 = G-L6.5 adjectives and adverbs verbatim (circle +
underline, 4 items; art branch perch, cat grounded, leaf grounded-foot) on
W2-D3. SW1 art hero_glue_action; SW2 art bird perch. BW1 the glue moment
(art hero_glue_standing).

**B4 The Cheeky Monkey (5-day close)** — 8 pool pages: SP1 mixed-word LCWC
(incl could) W1-D1 · GR1 = revisit: approved review items recast as one
fix-and-answer list (art scene_review ~20mm, monkey perch ~20mm) W1-D2 ·
SW1 (3 approved L6.4 sentences) W1-D3 · DI1 W1-D4 · HW1 joined phrases from
all four books (HW-SLOT) · ST1 W1-D5 WO · BW1 the monkey moment (art
hero_monkey_standing; manifest eye note logged) d28 WO. No SP2/SW2/GR2.

## 4. Closing pool (LEVEL)

| Pool id | Page | Template | Slot | Editions |
|---|---|---|---|---|
| L6.SWYK-A | Show what you know A | T6 | BLOCK-W6 WO d29 | B:wb · A:wb |
| L6.SWYK-B | Show what you know B | T6 | BLOCK-W6 WO d29 (same event) | B:wb · A:wb |
| L6.ST-HT | Half-term test (10 words across the block) | T10 | BLOCK-W6 WO d30 | B:wb · A:wb |
| L6.ANS-A / L6.ANS-B | Answers (2 pages, final) | T7 | — | B:wb · A:wb |

SWYK-A: sentence types (2 reused rows) + contraction match (2 reused) /
noun phrase build (1 reused) + joining cloze (2 reused). Art monkey perch.
SWYK-B: tense rewrite (2 reused) + write 3 sentences (joining word + noun
phrase) + 4 single lines + check strip. Art owl perch. Week-6 assessment
event = SWYK A+B + ST-HT + oral reading check from The Cheeky Monkey.
Answers reuse the approved L6 key, re-paged.

## 5. Edition assembly

| Pool pages | Edition A | Edition B |
|---|---|---|
| HW1, SW1 (per book) | Book back matter (p13; p12) — provisional | Workbook |
| SP1, SP2, GR1-3, DI1, SW2, HW2, ST1, BW1 | Edition A workbook | Workbook |
| SWYK ×2, ST-HT, ANS ×2 | Edition A workbook | Workbook (ends on Answers) |
| Book-side | Books unchanged (6_1 content bugs logged for the book pipeline) | Books rebound reading-only |

Edition A workbook ≈ 39 pages; Edition B = 49 pages. Zero dual pool objects.
