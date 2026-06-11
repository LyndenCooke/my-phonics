# MyPhonicsBooks Workbook Plans — combined planning set (v2, 2026-06-11)

All 17 planning documents in one file: master plan, eight level plans, eight teacher sequences. Single source folder: worksheet-engine/docs/workbook_plans/.


================================================================
FILE: WORKBOOK_MASTER_PLAN.md
================================================================

# Workbook Master Plan (L1 to L8) — v2, correction pass 2026-06-11

Planning only. No worksheet content, code, assets or covers. Status:
SIGNED OFF IN PRINCIPLE 2026-06-11 — Decisions 1-6 applied and the three
carried questions resolved (section 7). Build is gated only on the
content-authoring dependencies in section 6.

Companion files: `WORKBOOK_PLAN_L1..L8.md` (pool tables, page specs, edition
assembly per level) · `TEACHER_SEQUENCE_L1..L8.md` (fortnight day maps per
edition, block maps, week-6 assessment — website copy).

---

## 0. Verified level structure (unchanged from v1)

Eight levels, confirmed against the Ledger v2.1, `generate_book.py`,
`graphemes_by_level.json` and the 33 shipped book PDFs. All sources agree.

| Level | Name | Colour | Books | Phase mapping | Year group |
|---|---|---|---|---|---|
| L1 | Ditties | Pink `#E84B8A` | 2 | Phase 2 sets 1-2 | Reception early |
| L2 | First Sounds | Coral `#F97066` | 5 | Phase 2 sets 3-5 | Reception |
| L3 | Special Friends | Amber `#F59E0B` | 3 | Phase 3 cons. digraphs + Phase 4 | Reception late |
| L4 | Longer Sounds | Green `#22C55E` | 6 | Phase 3 vowel digraphs / RWI Set 2 | Reception-Y1 |
| L5 | New Spellings | Blue `#3B82F6` | 5 | Phase 5 split digraphs + first alts | Year 1 |
| L6 | Building Fluency | Indigo `#6366F1` | 4 | Phase 5 more alternatives | Y1 post-PSC into Y2 |
| L7 | Reading Together | Purple `#8B5CF6` | 4 | Late Phase 5 trigraphs | Year 2 |
| L8 | Reading Champion | Teal `#14B8A6` | 4 | Phase 6 suffix morphology | Y2-Y3 readiness |

L6 = Year 2 target; L7-L8 = greater depth.

### Discrepancy and content-bug log (do not fix in this pass)

1. **6_1 The Purple Purse, Word Workshop grammar spotlight**: example
   sentences ("Slowly, the crab hid under the rock", "They swam quickly to
   the boat") are not from the Purse book world — template bleed from another
   book.
2. **6_1 back cover**: lists the old six-level series names and claims
   Phase 6 alignment; the ledger maps L6 to Phase 5 alternatives. (Related
   code: stale `SERIES_LEVELS` in `scripts/generate_book.py`.)
3. **content_by_book.json audit remains open**: non-decodable items at L1
   ("paint", "seat"). Excluded as a source until audited.
4. Old-numbering data files (`word_banks/level_1..6_words.json`,
   `book_story_words_extracted.json`) — use only via `NEW_TO_OLD`.
5. Stale 6-level files: `PRODUCTION_CHECKLIST.md`, `story_summaries.json`.
6. zz placement: ledger L3 vs the L2 combined ss+zz sound book.
7. Asset manifests exist for L6 only; all other levels' slots are
   `manifest: TO-CREATE` and stay empty until approved art exists.
8. L8 "[Y3 next step]" banner needs child-facing "Next step" chip wording.

---

## 1. Two editions, one content pool (Decision 1)

Every activity page is a single **pool object** tagged:

```
pool: { id, strand, book, slot, editions }
  id       L{level}.B{book}.{STRAND}{i}   e.g. L6.B1.GR2
  strand   GR grammar · HW handwriting · SP spelling (Look Cover Write
           Check) · DI dictation (Listen and Write) · ST spelling test ·
           SW sentence work · BW big write · RV revisit · SWYK · ANS
  book     home book (or LEVEL for closing pages)
  slot     day type + position, e.g. W1-RD2, W2-WO3, HW-SLOT (outside
           phonics lesson, L5+), BLOCK-W6 (assessment event)
  editions A:book — in Edition A this content is carried by the book's
           existing back matter (not rebound)
           A:wb — binds into the Edition A workbook
           B:wb — binds into the Edition B workbook (every pool object)
```

- **Edition A (Classic)**: books keep their shipped back-matter activity
  pages; the workbook carries grammar, handwriting, spelling tests, big
  writes and whatever the book does not.
- **Edition B (Keepable)**: books are reading-only (sounds pages, story
  words, story, sound spotlight, oral talk-about-it); the workbook carries
  EVERY activity page in teaching order. **Edition B is the primary build.**
  Edition A is a re-binding that reuses the existing book back matter.
- A pool page renders identically in both editions; only page furniture
  (page numbers, contents, answer-key placement) regenerates per edition.
- Pages that must differ between editions become two pool objects and are
  flagged. **Zero dual objects are planned across all eight levels.**
- `A:book` equivalences map pool objects to the shipped 16-page book shape
  (p12 combined activity, p13 writing practice, p14 nonsense words). The
  exact per-book correspondence must be verified against each shipped PDF at
  build; every `A:book` tag in the level plans is provisional until then.
- Page numbers are an assembly output. Level plans order pool objects in
  teaching order; the assembler numbers them per edition.

Each level plan ends with an **edition assembly table**: which pool pages
bind into which document in each edition.

---

## 2. The fortnight cycle and the six-week block (Decision 2)

Default: **two weeks per book** — week 1: four reading days; week 2: three
reading days; remaining days are workout days (W1: 1, W2: 2). Every fortnight
carries exactly three core workout tasks: the extended writing task (or
grammar spread where one exists), the spelling test, and the big write that
closes the cycle.

### Day types (Decision 3)

- **Reading day (RD)**: full 30-minute phonics lesson (speed sounds, green
  words, tricky words, partner read), then ONE short workbook page maximum,
  finishable in 8-10 minutes. Nothing ever stacks two workbook pages onto a
  reading day.
- **Workout day (WO)**: 5-8 minute warm-up (quick sounds, quick green words,
  quick tricky words), then ONE longer task: a grammar spread, the big
  write, the spelling test or an extended sentence-work task.

Template fit per day type: T2 single-page grammar, T8 LCWC, T9 dictation,
T4 (3-item) sentence work and T1 handwriting are RD pages. T3 spreads,
T5 big writes, T10 spelling tests and extended T4 pages are WO tasks.
A two-page big write (L7-L8) is one WO session.

### Standard fortnight maps

**L1-L4 (formation band — handwriting inside the phonics lesson):**

| Day | Type | Workbook page |
|---|---|---|
| W1-D1 | RD | HW1 (in lesson — forming the new sound IS the sound work) |
| W1-D2 | RD | SP1 Look Cover Write Check |
| W1-D3 | RD | GR1 (single-page unit) |
| W1-D4 | RD | HW2 (in lesson) |
| W1-D5 | WO | SW1 extended sentence work |
| W2-D1 | RD | DI1 Listen and Write |
| W2-D2 | RD | RV or SW short (level plans state which) |
| W2-D3 | RD | free re-read — no page |
| W2-D4 | WO | ST1 spelling test |
| W2-D5 | WO | BW big write (closes the cycle) |

**L5-L8 (joining band — handwriting outside the phonics lesson):**

| Day | Type | Workbook page |
|---|---|---|
| W1-D1 | RD | SP1 LCWC |
| W1-D2 | RD | GR-A (T2 single page) |
| W1-D3 | RD | SW1 hold the sentence |
| W1-D4 | RD | DI1 Listen and Write |
| W1-D5 | WO | SW2 extended (answer it in sentences) or GR spread |
| W2-D1 | RD | SP2 LCWC (tricky/CEW set) |
| W2-D2 | RD | GR-B (T2) where present, else RV short |
| W2-D3 | RD | GR-C (T2) where present (multi-unit books), else free re-read |
| W2-D4 | WO | ST1 spelling test |
| W2-D5 | WO | BW big write (plan + write = one session at L7-L8) |
| HW slot | — | HW1, HW2 in the school handwriting slot, any two days, marked "outside phonics lesson" |

Multi-unit books absorb their extra unit on W2-D3 (all approved L6 units are
benchmark single pages, so even The New Glue fits its fortnight — see carried
question 2). Books on compressed cycles (under 10 days) keep all three core
WO tasks and flex the RD count; the sequence docs show every book's exact map.

### Six-week blocks and the week-6 assessment

A six-week block (half term) closes cleanly at a book boundary, with the
final two days of week 6 as the **assessment event**. Show what you know is
that event, not merely closing pages. It consists of, at every level: the
SWYK page(s) (WO task) + the half-term spelling test ST-HT (10 words drawn
across the block; 4-6 words at L1-L2) + an oral reading check from the
block's final book (teacher checklist in the sequence doc; no workbook page).

| Level | Block map | Padding |
|---|---|---|
| L1 | One block: B1 W1-3, B2 W4-6 (3 weeks per book) | Sound books, ditties and blending repetition fill the extra week per book |
| L2 | Block A: B1 W1-2, B2 W3-4, B3 W5-6 · Block B: B4 W1-2, B5 W3-4, W5-6 consolidation | Block B W5-6: sound books, blending, revisit pages |
| L3 | One block: B1 W1-2, B2 W3-4, B3 W5-6 | None needed (canonical fit) |
| L4 | Block A: B1-B3 · Block B: B4-B6 (2 weeks each) | None |
| L5 | Block A: B1-B3 · Block B: B4 W1-2, B5 W3-4, W5-6 PSC preparation | Block B W5-6: PSC-style practice via sound books |
| L6 | One block: B1 d1-7, B2 d8-14, B3 d15-23, B4 d24-28, assessment d29-30 | B3 (The New Glue) takes the long share |
| L7 | One block: B1 d1-7, B2 d8-14, B3 d15-22, B4 d23-28, assessment d29-30 | B3/B4 carry two grammar units each |
| L8 | One block: B1 d1-7, B2 d8-15, B3 d16-23, B4 d24-28, assessment d29-30 | B2/B3 carry two units each |

---

## 3. Strand progressions

### Grammar (unchanged from v1)

| Level | Units | Distribution across books |
|---|---|---|
| L1 | G-L1.1-1.3 | B1: 1.1 · B2: 1.2 + 1.3 (1.3 delivered as B2's extended sentence work) |
| L2 | G-L2.1-2.4 | B1-B4 one each · B5 revisit (confirmed) |
| L3 | G-L3.1-3.4 | B1: 3.1 · B2: 3.2 · B3: 3.3 + 3.4 |
| L4 | G-L4.1-4.5 | B1: 4.1 · B2: 4.2 · B3: 4.4 · B4: 4.3 · B5: 4.5 · B6 revisit (confirmed) |
| L5 | G-L5.1-5.6 | B1-B4 one each · B5: 5.5 + 5.6 (spread) |
| L6 | G-L6.1-6.7 | B1: 6.6 + 6.7 · B2: 6.1 + 6.4 · B3: 6.2 + 6.3 + 6.5 · B4 revisit (confirmed; B3 runs nine days, not extra weeks) |
| L7 | G-L7.1-7.6 | B1: 7.1 · B2: 7.2 · B3: 7.3 + 7.4 · B4: 7.5 + 7.6 |
| L8 | G-L8.1-8.6 | B1: 8.3 · B2: 8.4 + 8.2[Y3] · B3: 8.6 + 8.1[Y3] · B4: 8.5[Y3] + mastery revisit |

### Handwriting (placement split per Decision 4)

| Level | Focus | Placement |
|---|---|---|
| L1 | 10 letters by family, start dot + arrow | IN the phonics lesson (reading days) |
| L2 | Remaining letters, doubles, capitals | IN the phonics lesson |
| L3 | Digraphs as one unit; sitting on the line | IN the phonics lesson |
| L4 | Size consistency; word then sentence copying | IN the phonics lesson |
| L5 | Pre-cursive lead-out flicks | OUTSIDE the lesson (handwriting slot / workout segment) |
| L6 | First diagonal + horizontal joins, no lead-ins | OUTSIDE the lesson |
| L7 | Consistent joining incl o r v w joins | OUTSIDE the lesson |
| L8 | Fluent joined copy feeding the big write | OUTSIDE the lesson |

**Boundary: between L4 and L5** (resolved 2026-06-11) — the
formation/pre-cursive seam. Scheduling guidance only.

**Handwriting pages never teach** (resolved 2026-06-11): they are practice
sheets like the sound sheets — tramline sets with the handwriting markers,
nothing else. Joining from L6 is simply the style the practice words are
printed in, as part of the sound work; the teacher does any explaining.
Sources unchanged: word banks via `NEW_TO_OLD` + tricky/CEW lists + book
texts. Precursive/cursive display font remains a build dependency.

### Spelling (new strand, Decision 5)

Shapes modelled on the shipped book back matter; sources are ONLY the
level's word lists and tricky/CEW lists. Test words are listed in the
teacher sequence docs (website), never on the workbook page; SWYK answers
exclude test words.

| Level | LCWC (T8) source | Listen and Write (T9) | Fortnightly test (T10) |
|---|---|---|---|
| L1 | I, the + CVC words (word bank old-L1 subset) | 3-word approved sentences (ledger L1 dictation spec) | 4 words: 2 sound + 2 tricky |
| L2 | no, go, to, into, is + CVC/CVCC words | 3-5 word sentences (ledger L2 spec) | 6 words: 4 + 2 |
| L3 | he, she, we, me, be + digraph and cluster words | 4-7 word sentences | 8 words |
| L4 | was, my, you, they, her, all, are + vowel-digraph words | sentences with the book's digraphs (book text) | 8 words |
| L5 | the 14 new tricky words + doubling/un- words | 5-10 word sentences (book text) | 10 words |
| L6 | the 9 new tricky words + the book's focus-sound words | 6-12 word sentences (book text) | 10 words |
| L7 | Y2 CEW first set + suffix-rule words | 8-15 word sentences (book text) | 10 words, CEW-weighted |
| L8 | Y2 CEW remaining set + -ous/-able family words | varied sentences (book text) | 10 words, CEW + suffix |

### Big writes (confirmed: one per book, closing WO day)

Forms unchanged from v1: caption (L1-L2) → finish-and-write (L3) →
and-joined sentences (L4) → First/Next/Then retell (L5) → improve and
extend (L6) → plan + recount/description (L7, 2pp) → draft + self-edit
rewrite (L8, 2pp). Line counts and pitches per template T5.

---

## 4. Template library

Geometry for all templates: locked flowy system (A4 portrait, fixed mm,
header wave carrying the title, faint foot ground wave with page badge,
soft borderless tint boxes, one type scale, no bold, colour from
`getLevelTheme(level)`). Content area ≈ 35-260mm; block heights are
fractions of it. Day-type fit per section 2.

**T1 — HANDWRITING (practice sheet, no instruction).** Handwriting pages
are practice sheets exactly like the sound sheets: tramline sets only, each
set = one grey model row to trace + one write row, with the standard
handwriting markers (start dots, directional arrows) as page furniture.
4 sets per page maximum, generous gaps. NO worked-example block, NO
explanation of formation or joining anywhere on the page — the teacher
explains. From L6 the models are simply printed joined; joining is part of
the sound work, not a taught topic on the page. No art near tramlines;
optional one perch creature in the outer foot corner, clear of all lines.

**T2 — GRAMMAR (single page, the L6 benchmark shape).** Watch first tint
box (~22%, worked example + one-line terminology note); ONE task block
(~55%, 4-6 items, We do row 1); foot task "Now you write" + check strip +
3 single lines (~18%). Up to 3 grounded/perch/bleed art slots.

**T3 — GRAMMAR SPREAD.** Left: Watch first (~30%) + guided items (~50%).
Right: independent items (~70%) + foot task + check strip. One WO session.

**T4 — SENTENCE WORK.** Watch first tint box (~25%, model sentence with
Say it / Tap it cues); write block (~55%, 3 items max, double lines L1-L3,
single from L4); check strip foot (~15%); one grounded art slot.

**T5 — BIG WRITE.** Prompt slot + planning/picture box (~30%); writing
lines (~55%; pitch ≥14mm L1-L3, 12mm L4-L6, 10mm L7-L8, never compressed);
check strip (~10%); one small grounded-foot art slot, never inside the
writing block. Plan/draft/rewrite variants per level as stated in the
level plans.

**T6 — SHOW WHAT YOU KNOW.** Two task blocks maximum per page, reusing
approved items from the level's units (pointers; no new content); foot
task + check strip on the final page. Tests the ledger exit criteria.

**T7 — ANSWERS.** Single text block, unit-by-unit, accent unit names, body
ink answers, no bold, no art. Final page of the workbook.

New templates:

**T8 — LOOK COVER WRITE CHECK** (RD, 8-10 min)
- Header wave: title. Block A (~15%): Watch first — one word looked at,
  covered (fold cue on the column edge), written, checked.
- Block B (~70%): 5 word rows. Row = word (look column) · fold/cover rule ·
  write 1 · write 2 · check tick box. Double-height write cells at L1-L3,
  single from L4.
- Foot: ground wave; one perch creature outer corner ~14mm, clear of cells.
- Source: the level's spelling row in section 3. No invented words.

**T9 — LISTEN AND WRITE** (RD, 8-10 min)
- Header wave: title. Block A (~15%): Watch first cue — the grown-up reads
  the sentence; Say it, Tap it icons (structural copy).
- Block B (~65%): 3 numbered sentence slots, 2 double lines each at L1-L3,
  2 single lines at L4+, generous pitch.
- Foot (~15%): check strip (capital · spaces · end mark).
- Sentence sources: ledger dictation specs (L1-L3) / approved book text
  (L4+). Sentences printed only in the Answers pages and sequence doc.

**T10 — SPELLING TEST** (WO, week 2)
- Header wave: "Spelling test". Block A (~75%): numbered write lines
  (4 at L1, 6 at L2, 8 at L3-L4, 10 at L5-L8), double at L1-L3, single
  from L4, 12mm+ pitch.
- Block B (~15%): "My score" box (child-facing) + check strip variant
  (I checked my tricky words).
- Words: drawn from that book's focus sounds + tricky words; the list lives
  in the teacher sequence doc. ST-HT (half-term variant) draws across the
  block.
- Art: none. A test page stays clean.

Page-load rules per day type apply everywhere (section 2). White space
remains a feature; splitting remains the preferred fix.

---

## 5. Expected sizes (Edition B workbook, pages incl front matter)

| Level | Per-book pool pages | Books | Closing (SWYK + ST-HT + ANS) | Total |
|---|---|---|---|---|
| L1 | 8 | 2 | 1 + 1 + 1 (+2 front) | 21 |
| L2 | 8 | 5 | 1 + 2 + 1 (+2 front) | 46 |
| L3 | 8 (B3: 9) | 3 | 1 + 1 + 2 (+2 front) | 31 |
| L4 | 7 | 6 | 1 + 2 + 2 (+2 front) | 49 |
| L5 | 10 (B5: 11) | 5 | 2 + 2 + 2 (+2 front) | 59 |
| L6 | 11 (B3: 12, B4: 8) | 4 | 2 + 1 + 2 (+2 front) | 49 |
| L7 | 11 (B3, B4: 12) | 4 | 2 + 1 + 2 (+2 front) | 53 |
| L8 | 9 (B2-B4: 10) | 4 | 2 + 1 + 2 (+2 front) | 46 |

Edition A workbooks are thinner (the books carry their own back matter);
each level plan's assembly table shows the exact split.

---

## 6. Content to author and approve before build (not decisions, dependencies)

1. Comprehension question sets per book (SW2 extended pages) — author from
   book texts, decodability-checked.
2. L6 improve-a-sentence weak/strong pairs; L8 proofreading paragraphs and
   weak-draft models — author from book texts.
3. Dictation sentence sets at L4+ from book texts (L1-L3 use ledger specs).
4. Spelling test word lists per book (sequence docs) — select from approved
   lists only.
5. Art manifests for L1-L5, L7, L8 worlds; precursive font for join models.

---

## 7. Resolutions (2026-06-11) — no open questions remain

1. **Joining begins at L6.** Confirmed. It is not explained on any page;
   joined models simply appear as part of the sound work and the teacher
   explains.
2. **L6 grammar distribution stands.** The New Glue carries three grammar
   pages and runs nine days inside the six-week block (one extra day over
   the other books, never extra weeks).
3. **Handwriting boundary L4/L5 stands** as scheduling guidance only. At
   every level the handwriting pages are pure practice sheets (T1): the
   sheets with the handwriting markers, no teaching or explanation in the
   workbook.

The plan set is ready for build once the content-authoring dependencies in
section 6 are supplied and approved.


================================================================
FILE: WORKBOOK_PLAN_L1.md
================================================================

# Workbook Plan — L1 Ditties (Pink #E84B8A) — v2, correction pass

Pool-based plan. Edition B workbook: 21 pages. Rhythm: each book runs a core
fortnight inside a 3-week slot (block map: B1 W1-3, B2 W4-6); padding days
use sound books, ditties and blending repetition with no workbook page.
Templates T1-T10 and the L1-L4 standard fortnight map per
WORKBOOK_MASTER_PLAN.md. Theme: `getLevelTheme(1)`.

## 1. Scope (Ledger L1)

GPCs s a t p i n m d g o · tricky I, the · VC/CVC only, no clusters/digraphs
/doubles · band 3-5 words · Books: L1.1 Tap! Tap! Tap! (s a t p i n) ·
L1.2 The Mud on the Dog (m d g o).

## 2. Strand allocations

- Grammar: B1 G-L1.1 (count the words) · B2 G-L1.2 (say it first) +
  G-L1.3 (finger spaces, delivered as B2's extended sentence work).
- Handwriting: IN the phonics lesson (formation band). Families: curly
  caterpillar s a d g o · long ladder i t · one-armed robot p n m.
- Spelling: LCWC I, the + CVC words · dictation 3-word sentences (ledger L1
  spec) · test 4 words (2 sound + 2 tricky).
- Big write: draw + copy a caption, 2 double lines, closes each fortnight.

## 3. Pool — Book 1: Tap! Tap! Tap!

| Pool id | Page | Strand · template | Slot | Editions |
|---|---|---|---|---|
| L1.B1.HW1 | Letters s a t i | HW · T1 | W1-D1 RD (in lesson) | B:wb · A:book (p13, provisional) |
| L1.B1.SP1 | Look Cover Write Check: I, the + 3 CVC words | SP · T8 | W1-D2 RD | B:wb · A:wb |
| L1.B1.GR1 | Count the words (G-L1.1) | GR · T2 | W1-D3 RD | B:wb · A:wb |
| L1.B1.HW2 | Letters p n + first words | HW · T1 | W1-D4 RD (in lesson) | B:wb · A:book (p13, provisional) |
| L1.B1.SW1 | Copy a caption (extended) | SW · T4 | W1-D5 WO | B:wb · A:book (p12, provisional) |
| L1.B1.DI1 | Listen and write | DI · T9 | W2-D1 RD | B:wb · A:wb |
| L1.B1.ST1 | Spelling test (4 words) | ST · T10 | W2-D4 WO | B:wb · A:wb |
| L1.B1.BW1 | Big write: Tap! Tap! Tap! | BW · T5 | W2-D5 WO | B:wb · A:wb |

Specs (v1 zone maps stand):
- HW1: 4 tramline sets s a t i (model row + write row each, standard
  handwriting markers); practice sheet only, no instruction; no art.
- HW2: 4 sets: p, n + 2 CVC word sets (word bank old-L1 filtered to
  s a t p i n).
- SP1: T8 5 rows; double-height write cells; perch motif (cat) foot corner —
  manifest: TO-CREATE (L1 world).
- GR1: Watch first = approved 2-word book sentence with word dots; 4 items
  from Book L1.1 text (pp 4-9); count boxes; foot = say-and-tick. Art: cat
  grounded-box ~18mm, tap perch ~16mm — TO-CREATE.
- SW1: Watch first caption + Say/Tap cues; 3 caption items + 1 double line
  each (extended WO version); check strip = finger spaces. Source: Book L1.1
  approved captions.
- DI1: 3 sentence slots × 2 double lines; sentences from ledger L1 dictation
  spec (printed in Answers + sequence doc only).
- ST1: 4 numbered double lines; score box; words listed in sequence doc.
- BW1: prompt slot (book moment pointer) + picture box ~55mm + 2 double
  lines; check strip finger spaces. Art: cat grounded-foot ~14mm — TO-CREATE.

## 4. Pool — Book 2: The Mud on the Dog

| Pool id | Page | Strand · template | Slot | Editions |
|---|---|---|---|---|
| L1.B2.HW1 | Letters m d g o | HW · T1 | W1-D1 RD (in lesson) | B:wb · A:book (p13, provisional) |
| L1.B2.SP1 | LCWC: I, the + 3 CVC words (m d g o) | SP · T8 | W1-D2 RD | B:wb · A:wb |
| L1.B2.GR1 | Say it first (G-L1.2) | GR · T2 | W1-D3 RD | B:wb · A:wb |
| L1.B2.HW2 | Words from the book | HW · T1 | W1-D4 RD (in lesson) | B:wb · A:book (p13, provisional) |
| L1.B2.SW1 | Finger spaces (G-L1.3, extended) | SW/GR · T4 | W1-D5 WO | B:wb · A:book (p12, provisional) |
| L1.B2.DI1 | Listen and write | DI · T9 | W2-D1 RD | B:wb · A:wb |
| L1.B2.ST1 | Spelling test (4 words) | ST · T10 | W2-D4 WO | B:wb · A:wb |
| L1.B2.BW1 | Big write: The Mud on the Dog | BW · T5 | W2-D5 WO | B:wb · A:wb |

Specs:
- HW1: 4 sets m d g o. HW2: 4 CVC word sets across all 10 GPCs.
- GR1 (G-L1.2): 3 picture items (dog; mud; tin — manifest: TO-CREATE) +
  "Say it. Now write it." + 1 double line each; captions from Book L1.2.
- SW1 (G-L1.3): squashed vs spaced Watch first; 2 caption items + 1 double
  line each; tick-between-words check. Source: Book L1.2 captions. Art: dog
  perch ~16mm — TO-CREATE.
- DI1/ST1/BW1: as B1 with Book L1.2 sources; BW art dog grounded-foot.

## 5. Closing pool (LEVEL)

| Pool id | Page | Template | Slot | Editions |
|---|---|---|---|---|
| L1.SWYK | Show what you know | T6 | BLOCK-W6 WO (assessment event) | B:wb · A:wb |
| L1.ST-HT | Half-term spelling test (6 words across the block) | T10 | BLOCK-W6 WO | B:wb · A:wb |
| L1.ANS | Answers (final page) | T7 | — | B:wb · A:wb |

SWYK spec: Block A = count-the-words (2 reused items); Block B = copy one
caption with finger spaces (1 reused) + 1 double line; check strip. The
week-6 assessment event = SWYK + ST-HT + oral reading check from Book 2
(checklist in TEACHER_SEQUENCE_L1.md).

## 6. Edition assembly

| Pool pages | Edition A | Edition B |
|---|---|---|
| HW1 ×2, SW1 ×2 | Carried by each book's existing back matter (p13 writing practice; p12 combined activity) — provisional until checked against shipped PDFs | Workbook, teaching order |
| HW2, SP, GR, DI, ST, BW ×2 each | Edition A workbook | Workbook, teaching order |
| SWYK, ST-HT, ANS | Edition A workbook | Workbook (ends on Answers) |
| Book-side | Books unchanged (shipped shape) | Books rebound reading-only: sounds pages, story words, story, sound spotlight, oral talk-about-it |

Edition A workbook ≈ 13 pages + front matter; Edition B workbook = 21 pages.
Page numbers and contents regenerate per edition. Zero dual pool objects.


================================================================
FILE: WORKBOOK_PLAN_L2.md
================================================================

# Workbook Plan — L2 First Sounds (Coral #F97066) — v2, correction pass

Pool-based plan. Edition B workbook: 46 pages. Two six-week blocks
(Block A: B1-B3 · Block B: B4-B5 + consolidation W5-6), two weeks per book,
L1-L4 standard fortnight map. Theme: `getLevelTheme(2)`.

## 1. Scope (Ledger L2)

GPCs new: c k ck e u r h b f ff l ll ss j v w x y z · tricky new: no, go,
to, into, is (cum. 7) · CVC/CVCC, doubles allowed, no vowel digraphs · band
3-6 words · Books: L2.1 The Red Socks (c k ck e) · L2.2 Run, Pup, Run!
(u r h b) · L2.3 Fox Fell Off! (f l ff ll ss) · L2.4 The Jam Jug (j v w) ·
L2.5 The Yak and the Box (x y z).

## 2. Strand allocations

- Grammar: B1 G-L2.1 capital start · B2 G-L2.2 full stop · B3 G-L2.3
  capital I · B4 G-L2.4 sentence or not · B5 revisit (confirmed).
- Handwriting: IN the phonics lesson. Formation + capitals beside
  lower-case partners.
- Spelling: LCWC no/go/to/into/is + CVC/CVCC words · dictation 3-5 word
  sentences (ledger L2 spec) · test 6 words (4 sound + 2 tricky).
- Big write: caption from a book picture, picture box + 3 double lines.

## 3. Pool — per book (the five books share one shape)

Each book contributes 8 pool pages on the L1-L4 standard map:

| Pool id pattern | Page | Strand · template | Slot | Editions |
|---|---|---|---|---|
| L2.B{m}.HW1 | Letter formation | HW · T1 | W1-D1 RD (in lesson) | B:wb · A:book (p13, provisional) |
| L2.B{m}.SP1 | Look Cover Write Check | SP · T8 | W1-D2 RD | B:wb · A:wb |
| L2.B{m}.GR1 | Grammar unit (below) | GR · T2 | W1-D3 RD | B:wb · A:wb |
| L2.B{m}.HW2 | Words and capitals | HW · T1 | W1-D4 RD (in lesson) | B:wb · A:book (p13, provisional) |
| L2.B{m}.SW1 | Say it, tap it, write it (extended) | SW · T4 | W1-D5 WO | B:wb · A:book (p12, provisional) |
| L2.B{m}.DI1 | Listen and write | DI · T9 | W2-D1 RD | B:wb · A:wb |
| L2.B{m}.ST1 | Spelling test (6 words) | ST · T10 | W2-D4 WO | B:wb · A:wb |
| L2.B{m}.BW1 | Big write | BW · T5 | W2-D5 WO | B:wb · A:wb |

W2-D2 RD: tricky-word re-read from the reading book (no workbook page).
W2-D3 RD: free re-read.

Per-book specifics (v1 zone maps stand; all sources are pointers):

**B1 The Red Socks** — HW1 sets c, k, ck (one unit), e. HW2 sets: C c pair,
2 word sets (ck/e words), tricky set no, go. GR1 = G-L2.1: Watch first
lower-case→fixed sentence; 4 fix items from Book L2.1 text; foot write +
check strip (capital · spaces · full stop). SW1: 3 approved sentences +
1 double line each. DI1: 3 slots, sentences ledger L2 spec / Book L2.1.
BW1: picture box ~50mm + 3 double lines. Art slots: sock grounded-box,
book-world perch foot-right — manifest: TO-CREATE (L2 world).

**B2 Run, Pup, Run!** — HW1 u r h b; HW2 R r + words + tricky to, into.
GR1 = G-L2.2 full stop insert (4 items, Book L2.2). Art: pup motifs —
TO-CREATE.

**B3 Fox Fell Off!** — HW1 f l ff ll; HW2 F f + ss words + tricky is.
GR1 = G-L2.3 capital I circle-and-fix (4 items, Book L2.3, only sentences
genuinely containing I). Art: fox motifs — TO-CREATE.

**B4 The Jam Jug** — HW1 j v w (zig-zag family); HW2 J j + 3 word sets.
GR1 = G-L2.4 sentence-or-not tick grid (5 items; non-sentences are approved
word-list fragments, never invented). Art: jug motifs — TO-CREATE.

**B5 The Yak and the Box** — HW1 x y z; HW2 Y y + x-final words. GR1 =
revisit fix-it list (4 items mixing G-L2.1-2.4 formats on approved L2.5
sentences; reads as one "fix the sentence" skill). Art: yak motifs —
TO-CREATE.

## 4. Closing pool (LEVEL)

| Pool id | Page | Template | Slot | Editions |
|---|---|---|---|---|
| L2.SWYK | Show what you know | T6 | Block A W6 WO (assessment event) | B:wb · A:wb |
| L2.ST-HTA | Half-term test, Block A (8 words across B1-B3) | T10 | Block A W6 WO | B:wb · A:wb |
| L2.ST-HTB | Half-term test, Block B (8 words across B4-B5) | T10 | Block B W6 WO | B:wb · A:wb |
| L2.ANS | Answers (final page) | T7 | — | B:wb · A:wb |

SWYK spec: Block A = fix the sentence (3 reused items: capital, full stop,
capital I); Block B = write one sentence from a picture slot (TO-CREATE) +
2 double lines; check strip. Week-6 assessment events = SWYK (Block A) or
consolidation revisit (Block B) + ST-HT + oral reading check from the
block's final book.

## 5. Edition assembly

| Pool pages | Edition A | Edition B |
|---|---|---|
| HW1, HW2, SW1 (per book) | Carried by the book's back matter (p13; p12) — provisional | Workbook |
| SP1, GR1, DI1, ST1, BW1 (per book) | Edition A workbook | Workbook |
| SWYK, ST-HT ×2, ANS | Edition A workbook | Workbook (ends on Answers) |
| Book-side | Books unchanged | Books rebound reading-only |

Edition A workbook ≈ 29 pages; Edition B workbook = 46 pages. Zero dual
pool objects.


================================================================
FILE: WORKBOOK_PLAN_L3.md
================================================================

# Workbook Plan — L3 Special Friends (Amber #F59E0B) — v2, correction pass

Pool-based plan. Edition B workbook: 31 pages. One six-week block (B1 W1-2,
B2 W3-4, B3 W5-6 — the canonical fit), L1-L4 standard fortnight map.
Theme: `getLevelTheme(3)`.

## 1. Scope (Ledger L3)

GPCs new: sh nk ch th ng qu zz · tricky new: he, she, we, me, be (cum. 12) ·
clusters now permitted (Phase 4: st sp str scr bl cr fl gl) · band 4-7
words · Books: L3.1 The Fish in the Tank (sh nk) · L3.2 Chop, Chop, Chop!
(ch th) · L3.3 Buzz and Sing! (ng qu zz). zz source discrepancy logged in
the master plan.

## 2. Strand allocations

- Grammar: B1 G-L3.1 capitals for names · B2 G-L3.2 question mark ·
  B3 G-L3.3 statement vs question + G-L3.4 question words.
- Handwriting: IN the phonics lesson. Digraphs formed as one unit; sitting
  on the line; cluster words.
- Spelling: LCWC he/she/we/me/be + digraph and cluster words · dictation
  4-7 word sentences · test 8 words.
- Big write: finish and write sentences about the book, picture box +
  4 double lines.

## 3. Pool — per book

8 pool pages per book (B3: 9) on the L1-L4 standard map:

| Pool id pattern | Page | Strand · template | Slot | Editions |
|---|---|---|---|---|
| L3.B{m}.HW1 | Digraph formation | HW · T1 | W1-D1 RD (in lesson) | B:wb · A:book (p13, provisional) |
| L3.B{m}.SP1 | Look Cover Write Check | SP · T8 | W1-D2 RD | B:wb · A:wb |
| L3.B{m}.GR1 | Grammar unit | GR · T2 | W1-D3 RD | B:wb · A:wb |
| L3.B{m}.HW2 | Cluster words on the line | HW · T1 | W1-D4 RD (in lesson) | B:wb · A:book (p13, provisional) |
| L3.B{m}.SW1 | Finish the sentence (extended) | SW · T4 | W1-D5 WO | B:wb · A:book (p12, provisional) |
| L3.B{m}.DI1 | Listen and write | DI · T9 | W2-D1 RD | B:wb · A:wb |
| L3.B3.GR2 | Question words (G-L3.4, B3 only) | GR · T2 | W2-D2 RD | B:wb · A:wb |
| L3.B{m}.ST1 | Spelling test (8 words) | ST · T10 | W2-D4 WO | B:wb · A:wb |
| L3.B{m}.BW1 | Big write | BW · T5 | W2-D5 WO | B:wb · A:wb |

B1/B2 W2-D2: tricky-word re-read, no page. W2-D3: free re-read.

Per-book specifics (v1 zone maps stand):

**B1 The Fish in the Tank** — HW1: tramline sets sh, nk + 2 word sets
(practice sheet only, no instruction). HW2: sets 2 cluster
(st/sp), 1 sh/nk, 1 tricky (he, she). GR1 = G-L3.1: name-or-not tick grid,
5 items from Book L3.1 text; rewrite-with-capital fix boxes; foot write +
check strip (capital for the name · spaces · full stop). SW1: 3 stem items
(book stems + word-bank completions) + 1 double line each. DI1: 3 slots ×
2 double lines. BW1: picture box ~50mm + 4 double lines. Art: fish
grounded-box, tank perch — manifest: TO-CREATE (L3 world).

**B2 Chop, Chop, Chop!** — HW1 ch, th + words; HW2 scr/str clusters +
tricky we, me. GR1 = G-L3.2 question-mark insert (4 approved questions from
Book L3.2; Watch first statement/question end-mark pair; foot = write your
own question, stem given). Art: pot and veg motifs — TO-CREATE.

**B3 Buzz and Sing!** — HW1 ng, qu, zz + 1 word set; HW2 ng/qu words +
tricky be (zz words via the L2 ss+zz sound book list until the discrepancy
resolves). GR1 = G-L3.3 statement vs question tick grid (6 approved
sentences). GR2 = G-L3.4 question-word match (4 approved questions ↔
who/what/where/when; foot = copy your favourite question). Art: bee and
bird motifs — TO-CREATE.

## 4. Closing pool (LEVEL)

| Pool id | Page | Template | Slot | Editions |
|---|---|---|---|---|
| L3.SWYK | Show what you know | T6 | BLOCK-W6 WO (assessment event) | B:wb · A:wb |
| L3.ST-HT | Half-term test (10 words across the block) | T10 | BLOCK-W6 WO | B:wb · A:wb |
| L3.ANS-A / L3.ANS-B | Answers (2 pages, final) | T7 | — | B:wb · A:wb |

SWYK spec: Block A = choose . or ? (4 reused sentences); Block B = write
one question (approved question-word stems) + 2 double lines; check strip.
Assessment event = SWYK + ST-HT + oral reading check from Book 3.

## 5. Edition assembly

| Pool pages | Edition A | Edition B |
|---|---|---|
| HW1, HW2, SW1 (per book) | Book back matter (p13; p12) — provisional | Workbook |
| SP1, GR1/GR2, DI1, ST1, BW1 | Edition A workbook | Workbook |
| SWYK, ST-HT, ANS ×2 | Edition A workbook | Workbook (ends on Answers) |
| Book-side | Books unchanged | Books rebound reading-only |

Edition A workbook ≈ 19 pages; Edition B = 31 pages. Zero dual pool objects.


================================================================
FILE: WORKBOOK_PLAN_L4.md
================================================================

# Workbook Plan — L4 Longer Sounds (Green #22C55E) — v2, correction pass

Pool-based plan. Edition B workbook: 49 pages. Two six-week blocks (Block A:
B1-B3 · Block B: B4-B6, two weeks per book), L1-L4 standard fortnight map.
Theme: `getLevelTheme(4)`.

## 1. Scope (Ledger L4)

GPCs new (RWI Set 2 primary): ay ee igh ow oo(zoo) oo(look) ar or air ir
ou oy · tricky new: was, my, you, they, her, all, are (cum. 19) · two-
syllable words introduced · band 4-8 words · Books: L4.1 The Night Light
(ay ee igh) · L4.2 Moo at the Zoo (ow oo) · L4.3 Morning on the Farm
(ar or) · L4.4 The Fair in the Air (air ir) · L4.5 Round and Round (ou oy)
· L4.6 The Night Fair (review).

## 2. Strand allocations

- Grammar: B1 G-L4.1 join with and · B2 G-L4.2 choose . ? ! · B3 G-L4.4
  plurals · B4 G-L4.3 days of the week · B5 G-L4.5 suffixes -ing -ed -er ·
  B6 revisit (confirmed).
- Handwriting: IN the phonics lesson (last formation-band level; boundary
  confirmed at L4/L5). One page per book:
  copy words then one approved book sentence, size on the line.
- Spelling: LCWC was/my/you/they/her/all/are + vowel-digraph words ·
  dictation sentences with the book's digraphs (book text) · test 8 words.
- Big write: 2-3 sentences joining ideas with and, picture box + 5 single
  lines.

## 3. Pool — per book

7 pool pages per book on the L1-L4 standard map (HW2 slot unused at L4 —
one handwriting page per book; W1-D4 becomes a free re-read):

| Pool id pattern | Page | Strand · template | Slot | Editions |
|---|---|---|---|---|
| L4.B{m}.HW1 | Copy it neatly | HW · T1 | W1-D1 RD (in lesson) | B:wb · A:book (p13, provisional) |
| L4.B{m}.SP1 | Look Cover Write Check | SP · T8 | W1-D2 RD | B:wb · A:wb |
| L4.B{m}.GR1 | Grammar unit | GR · T2 | W1-D3 RD | B:wb · A:wb |
| L4.B{m}.SW1 | Hold the sentence (extended) | SW · T4 | W1-D5 WO | B:wb · A:book (p12, provisional) |
| L4.B{m}.DI1 | Listen and write | DI · T9 | W2-D1 RD | B:wb · A:wb |
| L4.B{m}.ST1 | Spelling test (8 words) | ST · T10 | W2-D4 WO | B:wb · A:wb |
| L4.B{m}.BW1 | Big write | BW · T5 | W2-D5 WO | B:wb · A:wb |

Per-book specifics (v1 zone maps stand; sources are pointers):

**B1 The Night Light** — HW1: tramline sets — 2 word (ay/ee/igh), 1 tricky
(was, my), 1 sentence (Book L4.1); practice sheet only, no instruction.
GR1 = G-L4.1: 3 sentence-pair items joined with and, 2 single lines each;
foot = own and-sentence + check strip. SW1: 3 say-hold-write items (cover
and write) + 1 single line each. DI1: 3 slots × 2 single lines (book-text
sentences). BW1: picture box ~45mm + 5 single lines, 12mm pitch; check
strip + "did you use and?". Art: lantern grounded-box, moon perch —
manifest: TO-CREATE (L4 world).

**B2 Moo at the Zoo** — HW1 ow/oo sets + tricky you, they. GR1 = G-L4.2
tick-one-of-three end marks (5 items, Book L4.2). Art: cow, gate —
TO-CREATE.

**B3 Morning on the Farm** — HW1 ar/or + tricky her, all. GR1 = G-L4.4
plural match (5 singular↔plural pairs from the approved L4 pool; foot =
plural sentence). Art: tractor, hen — TO-CREATE.

**B4 The Fair in the Air** — HW1 air/ir + tricky are. GR1 = G-L4.3 days
fix-the-capital (5 day names, structural copy; foot = day sentence, frame
given). Art: balloon, flag — TO-CREATE.

**B5 Round and Round** — HW1 ou/oy sets. GR1 = G-L4.5 suffix build grid
(4 roots × -ing/-ed/-er, no root change; foot = -ing sentence). Art:
roundabout — TO-CREATE.

**B6 The Night Fair (review)** — HW1 mixed L4 words + sentence. GR1 =
revisit fix-it list (4 items: and-join, end mark, plural, suffix on Book
L4.6 sentences). Art: stall, lantern — TO-CREATE.

## 4. Closing pool (LEVEL)

| Pool id | Page | Template | Slot | Editions |
|---|---|---|---|---|
| L4.SWYK | Show what you know | T6 | Block B W6 WO (assessment event) | B:wb · A:wb |
| L4.ST-HTA | Half-term test, Block A (10 words, B1-B3) | T10 | Block A W6 WO | B:wb · A:wb |
| L4.ST-HTB | Half-term test, Block B (10 words, B4-B6) | T10 | Block B W6 WO | B:wb · A:wb |
| L4.ANS-A / L4.ANS-B | Answers (2 pages, final) | T7 | — | B:wb · A:wb |

SWYK spec: Block A = and-join (2 reused pairs) + end marks (2 reused);
Block B = plural match (3 reused) + one -ing sentence + 2 single lines;
check strip. Block A's week 6 closes with ST-HTA + oral reading check from
B3; Block B's with SWYK + ST-HTB + reading check from B6.

## 5. Edition assembly

| Pool pages | Edition A | Edition B |
|---|---|---|
| HW1, SW1 (per book) | Book back matter (p13; p12) — provisional | Workbook |
| SP1, GR1, DI1, ST1, BW1 | Edition A workbook | Workbook |
| SWYK, ST-HT ×2, ANS ×2 | Edition A workbook | Workbook (ends on Answers) |
| Book-side | Books unchanged | Books rebound reading-only |

Edition A workbook ≈ 35 pages; Edition B = 49 pages. Zero dual pool objects.


================================================================
FILE: WORKBOOK_PLAN_L5.md
================================================================

# Workbook Plan — L5 New Spellings (Blue #3B82F6) — v2, correction pass

Pool-based plan. Edition B workbook: 59 pages. Two six-week blocks (Block A:
B1-B3 · Block B: B4 W1-2, B5 W3-4, W5-6 PSC preparation via sound books),
L5-L8 standard fortnight map. Handwriting now sits OUTSIDE the phonics
lesson (boundary confirmed at L4/L5). Theme: `getLevelTheme(5)`.

## 1. Scope (Ledger L5)

GPCs new: a-e i-e o-e u-e ea ie oi aw ai oa · tricky new (14): said, so,
have, like, some, come, were, there, little, one, do, when, out, what
(cum. 33) · band 5-10 words · Books: L5.1 The Big Bike Race (a-e i-e) ·
L5.2 Lost at the Night Market (o-e u-e) · L5.3 The Dream Team (ea ie) ·
L5.4 What Min Saw (oi aw) · L5.5 The Boat with the Red Sail (ai oa).

## 2. Strand allocations

- Grammar: B1 G-L5.1 doubling · B2 G-L5.2 prefix un- · B3 G-L5.3 commas in
  lists · B4 G-L5.4 sequencing · B5 G-L5.5 + G-L5.6 (T3 spread).
- Handwriting: pre-cursive lead-out flicks; two pages per book in the
  school handwriting slot, marked "outside phonics lesson". Pre-cursive
  display font is a build dependency.
- Spelling: LCWC the 14 tricky words split across books + doubling/un-
  words · dictation 5-10 word sentences (book text) · test 10 words.
- Big write: First/Next/Then retell, 3-box plan strip + 7 single lines.

## 3. Pool — per book

10 pool pages per book (B5: 11) on the L5-L8 standard map:

| Pool id pattern | Page | Strand · template | Slot | Editions |
|---|---|---|---|---|
| L5.B{m}.SP1 | LCWC: focus-spelling words | SP · T8 | W1-D1 RD | B:wb · A:wb |
| L5.B{m}.GR1 | Grammar unit (B5: spread left) | GR · T2 (B5: T3) | W1-D2 RD (B5: W1-D5 WO) | B:wb · A:wb |
| L5.B{m}.SW1 | Hold the sentence | SW · T4 | W1-D3 RD | B:wb · A:book (p12, provisional) |
| L5.B{m}.DI1 | Listen and write | DI · T9 | W1-D4 RD | B:wb · A:wb |
| L5.B{m}.SW2 | Answer it in a sentence (extended) | SW · T4 | W1-D5 WO (B5: W2-D2 RD, short form) | B:wb · A:wb |
| L5.B{m}.SP2 | LCWC: tricky-word set | SP · T8 | W2-D1 RD | B:wb · A:wb |
| L5.B5.GR2 | Spread right (G-L5.6) | GR · T3 | with GR1 (one WO session) | B:wb · A:wb |
| L5.B{m}.HW1 | Flick it (formation) | HW · T1 | HW-SLOT, W1 (outside phonics lesson) | B:wb · A:book (p13, provisional) |
| L5.B{m}.HW2 | Flick the words | HW · T1 | HW-SLOT, W2 (outside phonics lesson) | B:wb · A:wb |
| L5.B{m}.ST1 | Spelling test (10 words) | ST · T10 | W2-D4 WO | B:wb · A:wb |
| L5.B{m}.BW1 | Big write | BW · T5 | W2-D5 WO | B:wb · A:wb |

W2-D2 (B1-B4): grammar-light revisit re-read, no page. W2-D3: free re-read.

Per-book specifics (v1 zone maps stand):

**B1 The Big Bike Race** — SP1: a-e/i-e words. GR1 = G-L5.1 doubling build
grid (4 roots × -ing/-ed; foot -ing sentence). SW1: 3 say-hold-write items.
DI1: 3 slots × 2 single lines. SW2 extended: Watch first Q+A; 3 questions ×
2 single lines (approved comprehension set — authoring dependency, master
plan section 6). SP2: said, so, have. HW1: flick groups i l t u / a d h n +
2 word sets. HW2: a-e/i-e word sets + tricky set + best-word set. ST1: 10
numbered lines. BW1: 3-box plan + 7 single lines. Art: bike grounded-box,
flag perch — manifest: TO-CREATE (L5 world).

**B2 Lost at the Night Market** — GR1 = G-L5.2 un- match (4 pairs). SP2:
like, some, come. Art: lantern, stall — TO-CREATE.

**B3 The Dream Team** — GR1 = G-L5.3 commas insert (4 list sentences from
Book L5.3). SP2: were, there, little. Art: kite, team — TO-CREATE.

**B4 What Min Saw** — GR1 = G-L5.4 order strip (4 approved retell
sentences; number + write first two with First/Next). SP2: one, do, when.
Art: magpie — TO-CREATE.

**B5 The Boat with the Red Sail** — GR1+GR2 = T3 spread: left teaches
G-L5.5 noun/verb (Watch first marked sentence; 3 guided items), right
practises G-L5.6 grow-the-noun (4 phrases + approved word-bank panel; foot
write + check strip). One WO session. SW2 short form on W2-D2. SP2: out,
what. Art: boat, sail — TO-CREATE.

## 4. Closing pool (LEVEL)

| Pool id | Page | Template | Slot | Editions |
|---|---|---|---|---|
| L5.SWYK-A | Show what you know A | T6 | Block B W6 WO | B:wb · A:wb |
| L5.SWYK-B | Show what you know B | T6 | Block B W6 WO (same event) | B:wb · A:wb |
| L5.ST-HTA | Half-term test, Block A (10 words, B1-B3) | T10 | Block A W6 WO | B:wb · A:wb |
| L5.ST-HTB | Half-term test, Block B (10 words, B4-B5 + PSC prep) | T10 | Block B W6 WO | B:wb · A:wb |
| L5.ANS-A / L5.ANS-B | Answers (2 pages, final) | T7 | — | B:wb · A:wb |

SWYK-A: doubling build + un- match / commas + noun-verb mark-up (reused
items). SWYK-B: order the retell (3 reused) + write 2 sequenced sentences +
3 single lines + check strip. Week-6 events: Block A = ST-HTA + reading
check from B3; Block B = SWYK A+B + ST-HTB + reading check from B5 (the
level's PSC-readiness checkpoint).

## 5. Edition assembly

| Pool pages | Edition A | Edition B |
|---|---|---|
| HW1, SW1 (per book) | Book back matter (p13; p12) — provisional | Workbook |
| SP1, SP2, GR, DI1, SW2, HW2, ST1, BW1 | Edition A workbook | Workbook |
| SWYK ×2, ST-HT ×2, ANS ×2 | Edition A workbook | Workbook (ends on Answers) |
| Book-side | Books unchanged | Books rebound reading-only |

Edition A workbook ≈ 45 pages; Edition B = 59 pages. Zero dual pool objects.


================================================================
FILE: WORKBOOK_PLAN_L6.md
================================================================

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


================================================================
FILE: WORKBOOK_PLAN_L7.md
================================================================

# Workbook Plan — L7 Reading Together (Purple #8B5CF6) — v2, correction pass

Pool-based plan. Edition B workbook: 53 pages. One six-week block (B1 d1-7,
B2 d8-14, B3 d15-22, B4 d23-28, assessment d29-30), L5-L8 standard
fortnight map. Theme: `getLevelTheme(7)`. Greater-depth level.

## 1. Scope (Ledger L7)

GPCs new: ire ore ear oor ure tion · CEW: NC Y2 first set (door, floor,
poor, because, find, kind, mind, behind, child, children, wild, climb,
most, only, both, old, cold, gold, hold, told, every, everybody, even,
great, break, steak, pretty, beautiful, after, fast, last, past, father,
class, grass, pass, plant, path, bath) · band 8-15 words · Books: L7.1
Before the Shore (ire ore) · L7.2 Near the Door (ear oor) · L7.3 Sure She
Can! (ure tion) · L7.4 A Place for Me (review).

## 2. Strand allocations

- Grammar: B1 G-L7.1 possessive apostrophe · B2 G-L7.2 homophones ·
  B3 G-L7.3 time adverbials + G-L7.4 progressive tense · B4 G-L7.5 suffix
  builders + G-L7.6 commas + recount challenge. All T2 singles on reading
  days.
- Handwriting: consistent joining incl o r v w horizontal joins; two pages
  per book, HW-SLOT, outside the phonics lesson. Joined copy sources are
  approved book sentences (the old "copy a proverb" remains replaced).
- Spelling: LCWC CEW sets split across books + suffix-rule words ·
  dictation 8-15 word sentences (book text) · test 10 words, CEW-weighted.
- Big write: two pages — plan (genre frame) + write (11 single lines) —
  one WO session closing each book.

## 3. Pool — per book

11 pool pages per book (B3, B4: 12) on the L5-L8 standard map:

| Pool id pattern | Page | Strand · template | Slot | Editions |
|---|---|---|---|---|
| L7.B{m}.SP1 | LCWC: CEW set | SP · T8 | W1-D1 RD | B:wb · A:wb |
| L7.B{m}.GR1 | Grammar unit A | GR · T2 | W1-D2 RD | B:wb · A:wb |
| L7.B{m}.SW1 | Hold the sentence | SW · T4 | W1-D3 RD | B:wb · A:book (p12, provisional) |
| L7.B{m}.DI1 | Listen and write | DI · T9 | W1-D4 RD | B:wb · A:wb |
| L7.B{m}.SW2 | Answer it in sentences (extended, incl inference) | SW · T4 | W1-D5 WO | B:wb · A:wb |
| L7.B{m}.SP2 | LCWC: CEW set 2 + suffix-rule words | SP · T8 | W2-D1 RD | B:wb · A:wb |
| L7.B3/B4.GR2 | Grammar unit B | GR · T2 | W2-D2 RD | B:wb · A:wb |
| L7.B{m}.HW1 | Joined up: o r v w joins | HW · T1 | HW-SLOT W1 (outside phonics lesson) | B:wb · A:book (p13, provisional) |
| L7.B{m}.HW2 | Joined copy (approved book sentence) | HW · T1 | HW-SLOT W2 (outside phonics lesson) | B:wb · A:wb |
| L7.B{m}.ST1 | Spelling test (10 words) | ST · T10 | W2-D4 WO | B:wb · A:wb |
| L7.B{m}.BWa | Big write plan (genre frame) | BW · T5 | W2-D5 WO (one session) | B:wb · A:wb |
| L7.B{m}.BWb | Big write | BW · T5 | W2-D5 WO (same session) | B:wb · A:wb |

Base set = 11 pages (B1/B2, no GR2); B3/B4 carry GR2 for 12.

Per-book specifics (v1 zone maps stand; sources are pointers):

**B1 Before the Shore** — SP1 door, floor, poor + ire/ore words; SP2
because, find, kind. GR1 = G-L7.1 apostrophe insert (5 approved phrases
from Book L7.1; foot 's sentence + check strip). SW1: 3 say-hold-write
items, 2 single lines each. SW2: 3 approved questions, at least one
inferential (authoring dependency). DI1: 3 slots × 2 single lines. HW1
or/ore join sets + CEW set. HW2: one approved sentence joined + CEW set.
BWa: recount frame — 4 labelled boxes (First/Next/Then/Finally), 2 short
lines + sketch space each. BWb: prompt restated + 11 single lines, 10mm
pitch + check strip (capital · end marks · time words · sense). Art: shore
grounded-box, gull perch — manifest: TO-CREATE (L7 world).

**B2 Near the Door** — SP1/SP2 CEW sets (most, only, both / old, cold,
gold). GR1 = G-L7.2 homophones cloze (pairs as they occur in Book L7.2).
BWa description frame (who/where/what/feel). Art: door, lane — TO-CREATE.

**B3 Sure She Can!** — GR1 = G-L7.3 time adverbials order strip (4 approved
recount sentences). GR2 = G-L7.4 progressive rewrite (4 approved sentences
→ was/were + -ing) W2-D2. SP sets: every, even, great / told, hold. BWa
recount frame. Art: station, flag — TO-CREATE.

**B4 A Place for Me** — GR1 = G-L7.5 suffix build grid (4 approved roots ×
-ly/-ful/-ness, only forms in the approved pool). GR2 = G-L7.6 commas in
2 approved lists + 3-sentence recount frame (challenge intent within the
two-block limit) W2-D2. SP sets: after, fast, last, past / class, grass,
pass. BWa plan: your own place (book-theme pointer). Art: nest, home —
TO-CREATE.

## 4. Closing pool (LEVEL)

| Pool id | Page | Template | Slot | Editions |
|---|---|---|---|---|
| L7.SWYK-A | Show what you know A | T6 | BLOCK-W6 WO d29 | B:wb · A:wb |
| L7.SWYK-B | Show what you know B | T6 | BLOCK-W6 WO d29 | B:wb · A:wb |
| L7.ST-HT | Half-term test (10 CEW-weighted words) | T10 | BLOCK-W6 WO d30 | B:wb · A:wb |
| L7.ANS-A / L7.ANS-B | Answers (2 pages, final) | T7 | — | B:wb · A:wb |

SWYK-A: apostrophes (2 reused) + homophones (2 reused) / progressive
(1 reused) + suffix build (2 reused). SWYK-B: order the recount (3 reused)
+ write a 3-sentence recount with time words + 4 single lines + check
strip. Week-6 event = SWYK A+B + ST-HT + oral reading check from A Place
for Me. Secure bar: apostrophe 4/5; homophones 4/5; recount with 3 time
adverbials.

## 5. Edition assembly

| Pool pages | Edition A | Edition B |
|---|---|---|
| HW1, SW1 (per book) | Book back matter (p13; p12) — provisional | Workbook |
| SP1, SP2, GR1/GR2, DI1, SW2, HW2, ST1, BWa, BWb | Edition A workbook | Workbook |
| SWYK ×2, ST-HT, ANS ×2 | Edition A workbook | Workbook (ends on Answers) |
| Book-side | Books unchanged | Books rebound reading-only |

Edition A workbook ≈ 43 pages; Edition B = 53 pages. Zero dual pool objects.


================================================================
FILE: WORKBOOK_PLAN_L8.md
================================================================

# Workbook Plan — L8 Reading Champion (Teal #14B8A6) — v2, correction pass

Pool-based plan. Edition B workbook: 46 pages. One six-week block (B1 d1-7,
B2 d8-15, B3 d16-23, B4 d24-28, assessment d29-30), L5-L8 standard
fortnight map. Theme: `getLevelTheme(8)`. Greater-depth level; [Y3] units
carry a child-facing "Next step" chip (wording flagged in the master plan
discrepancy log).

## 1. Scope (Ledger L8)

No new single-grapheme code; suffix morphology -ous -cious -tious -able
-ible (suffix teaching lives in the sound-book strand; the words appear
here in spelling and writing sources) · CEW: NC Y2 remaining set (hour,
move, prove, improve, sure, sugar, eye, could, should, would, who, whole,
any, many, clothes, busy, people, water, again, half, money, Mr, Mrs,
parents, Christmas) · band varied · Books: L8.1 The Marvellous
Neighbourhood (-ous) · L8.2 You Are Remarkable (-able -ible) · L8.3 It
Looks Suspicious! (-cious -tious) · L8.4 The Incredible Bush Walk (review).
Non-fiction feature per book (labels, letter, list, diary) — verify the
feature-to-book mapping against the shipped PDFs (old-numbered
story_summaries.json).

## 2. Strand allocations

- Grammar: B1 G-L8.3 possessives singular/plural · B2 G-L8.4 openers +
  G-L8.2 speech marks [Y3] · B3 G-L8.6 proofread + G-L8.1 fronted
  adverbials [Y3] · B4 G-L8.5 time/place/cause [Y3] + mastery revisit.
- Handwriting: fluent joined copy, ONE page per book (the same approved
  passage the big write later improves), HW-SLOT, outside the phonics
  lesson.
- Spelling: LCWC CEW remaining set split across books + -ous/-able family
  words · dictation varied sentences (book text) · test 10 words, CEW +
  suffix.
- Big write: two pages — draft (12 single lines + plan strip) + self-edit
  rewrite (12 single lines + expanded check strip) — drafted on the W2-D4
  area and completed as the closing WO session. Proofreading paragraphs and
  weak-draft models are an authoring dependency.

## 3. Pool — per book

9 pool pages per book (B2-B4: 10) on the L5-L8 standard map:

| Pool id pattern | Page | Strand · template | Slot | Editions |
|---|---|---|---|---|
| L8.B{m}.SP1 | LCWC: CEW set + suffix family words | SP · T8 | W1-D1 RD | B:wb · A:wb |
| L8.B{m}.GR1 | Grammar unit A | GR · T2 | W1-D2 RD | B:wb · A:wb |
| L8.B{m}.SW1 | Hold the sentence | SW · T4 | W1-D3 RD | B:wb · A:book (p12, provisional) |
| L8.B{m}.DI1 | Listen and write | DI · T9 | W1-D4 RD | B:wb · A:wb |
| L8.B{m}.SW2 | Answer it in sentences (extended: literal, inferential, summarising) | SW · T4 | W1-D5 WO | B:wb · A:wb |
| L8.B2-4.GR2 | Grammar unit B | GR · T2 | W2-D2 RD | B:wb · A:wb |
| L8.B{m}.HW1 | Fluent copy (approved passage) | HW · T1 | HW-SLOT (outside phonics lesson) | B:wb · A:book (p13, provisional) |
| L8.B{m}.ST1 | Spelling test (10 words) | ST · T10 | W2-D4 WO | B:wb · A:wb |
| L8.B{m}.BWa | Big write draft (plan strip + 12 lines) | BW · T5 | W2-D5 WO (one session…) | B:wb · A:wb |
| L8.B{m}.BWb | Check it, make it better (12 lines + self-edit strip) | BW · T5 | …completing the session | B:wb · A:wb |

W2-D1: CEW re-read day, no page (SP1 carries both CEW sets at L8).
W2-D3: free re-read (B1) or GR2 overflow.

Per-book specifics (v1 zone maps stand; sources are pointers):

**B1 The Marvellous Neighbourhood (7 days)** — SP1 hour, move, prove +
-ous words. GR1 = G-L8.3: singular/plural possessive tick-grid sort,
5 approved phrases + apostrophe fix slots; foot = one of each + check
strip. SW1: 3 say-hold-write items × 2 single lines. SW2: 3 approved
questions incl one-sentence summary. DI1: 3 slots. HW1: approved 2-3
sentence passage + CEW set. BWa: the book's non-fiction feature (pointer)
+ 3-cell plan strip + 12 single lines, 10mm pitch. BWb: self-edit list
(capitals · end marks · spelling checked · sense) + 12 lines. Art: street
grounded-box, postbox perch — manifest: TO-CREATE (L8 world).

**B2 You Are Remarkable (8 days)** — SP1 should, would, could + -able
words. GR1 = G-L8.4 vary the opener (one approved sentence rewritten 3
ways; opener bank structural). GR2 = G-L8.2 speech marks [Y3, Next step
chip] (3 approved dialogue lines) W2-D2. BWa the letter feature. Art:
medal, mirror — TO-CREATE.

**B3 It Looks Suspicious! (8 days)** — SP1 who, whole, any + -cious words.
GR1 = G-L8.6 proofread (one approved-error paragraph, 5 planted errors,
margin fix column — authoring dependency). GR2 = G-L8.1 fronted adverbials
[Y3] (3 approved sentences flipped + comma) W2-D2. BWa the diary/list
feature. Art: magnifying glass, footprints — TO-CREATE.

**B4 The Incredible Bush Walk (5-day close)** — SP1 water, again, half +
mixed suffix words. GR1 = G-L8.5 time/place/cause [Y3] cloze-and-sort
(4 approved sentences, bank before/after/outside/because) W1-D2. GR2 =
mastery revisit fix-it list (4 items reusing 8.3/8.4/8.6 formats on Book
L8.4 sentences) W1-D3, with SW1 moving to W1-D4 and DI1 into the W2 run-in.
BWa/BWb the bush walk recount, closing the level. Art: trail, bird —
TO-CREATE.

## 4. Closing pool (LEVEL)

| Pool id | Page | Template | Slot | Editions |
|---|---|---|---|---|
| L8.SWYK-A | Show what you know A | T6 | BLOCK-W6 WO d29 | B:wb · A:wb |
| L8.SWYK-B | Show what you know B | T6 | BLOCK-W6 WO d29 | B:wb · A:wb |
| L8.ST-HT | Half-term test (10 words, CEW + suffix) | T10 | BLOCK-W6 WO d30 | B:wb · A:wb |
| L8.ANS-A / L8.ANS-B | Answers (2 pages, final) | T7 | — | B:wb · A:wb |

SWYK-A: possessive sort (2 reused) + opener rewrite (1 reused) / proofread
mini (1 reused) + speech marks (1 reused, Next step). SWYK-B: fronted
adverbial flip (1 reused, Next step) + write 3 sentences each opening a
different way + 4 single lines + self-edit strip. Week-6 event = SWYK A+B +
ST-HT + oral reading check from The Incredible Bush Walk. Secure bar:
possessives 4/5; proofread 4/5 errors; openers 2/3; [Y3] items reported as
working towards.

## 5. Edition assembly

| Pool pages | Edition A | Edition B |
|---|---|---|
| HW1, SW1 (per book) | Book back matter (p13; p12) — provisional | Workbook |
| SP1, GR1/GR2, DI1, SW2, ST1, BWa, BWb | Edition A workbook | Workbook |
| SWYK ×2, ST-HT, ANS ×2 | Edition A workbook | Workbook (ends on Answers) |
| Book-side | Books unchanged | Books rebound reading-only |

Edition A workbook ≈ 38 pages; Edition B = 46 pages. Zero dual pool objects.


================================================================
FILE: TEACHER_SEQUENCE_L1.md
================================================================

# Teaching Sequence — Level 1 Ditties (website copy) — v2

For the website only. Nothing here appears inside a workbook or book. The
website emits one page per edition from this source: Edition B (Keepable)
uses the workbook column; Edition A (Classic) uses its column, where some
activities live in the book's own back pages.

## The two kinds of day

- **Reading day**: the full 30-minute phonics lesson (speed sounds, green
  words, tricky words, partner read), then ONE short page, 8-10 minutes. At
  this level the handwriting page happens inside the lesson, because forming
  the new sound's letters is the sound work.
- **Workout day**: a 5-8 minute warm-up (quick sounds, quick green words,
  quick tricky words), then one longer task: the sentence task, the spelling
  test or the big write.

## The six-week block

| Weeks | Book |
|---|---|
| 1-3 | Tap! Tap! Tap! (core fortnight + a padding week of sound books, ditties and blending games) |
| 4-6 | The Mud on the Dog (same shape) |
| End of week 6 | Assessment: Show what you know + half-term spelling test (6 words) + listen to your child read The Mud on the Dog (reading check) |

## Book 1 — Tap! Tap! Tap! (core fortnight)

| Day | Type | After the lesson / warm-up | Edition B (workbook) | Edition A |
|---|---|---|---|---|
| W1-D1 | Reading | handwriting, in the lesson | Letters s a t i | Book back pages (writing practice) |
| W1-D2 | Reading | spelling | Look Cover Write Check | Workbook |
| W1-D3 | Reading | grammar | Count the words | Workbook |
| W1-D4 | Reading | handwriting, in the lesson | Letters p n + first words | Book back pages |
| W1-D5 | Workout | sentence task | Copy a caption | Book back pages (activity page) |
| W2-D1 | Reading | dictation | Listen and write | Workbook |
| W2-D2 | Reading | tricky-word re-read | no page | no page |
| W2-D3 | Reading | free re-read | no page | no page |
| W2-D4 | Workout | spelling test (4 words — list below) | Spelling test | Workbook |
| W2-D5 | Workout | big write | Big write: Tap! Tap! Tap! | Workbook |
| Week 3 | padding | sound books, ditties, blending repetition | no pages | no pages |

## Book 2 — The Mud on the Dog (weeks 4-6, same map)

W1-D1 Letters m d g o · W1-D2 LCWC · W1-D3 Say it first · W1-D4 Words from
the book · W1-D5 (Workout) Finger spaces · W2-D1 Listen and write ·
W2-D4 (Workout) Spelling test · W2-D5 (Workout) Big write. Week 6 padding
days give way to the assessment event on the final two days.

## Spelling test words

Drawn from the book's focus sounds and tricky words, from the approved L1
lists only. The word lists are finalised at build and published here, never
printed in the workbook.

## Week-6 reading check

Listen to your child read the block's final book. Check: says each sound,
blends without help, notices the tricky words, points to each word.


================================================================
FILE: TEACHER_SEQUENCE_L2.md
================================================================

# Teaching Sequence — Level 2 First Sounds (website copy) — v2

For the website only. One page per edition is emitted from this source.

## The two kinds of day

As Level 1: reading days = full 30-minute phonics lesson + one short page
(8-10 minutes; handwriting happens inside the lesson at this level).
Workout days = short warm-up + one longer task (sentence task, spelling
test or big write).

## The two six-week blocks

| Block | Weeks | Book |
|---|---|---|
| A | 1-2 | The Red Socks |
| A | 3-4 | Run, Pup, Run! |
| A | 5-6 | Fox Fell Off! → end of week 6: half-term spelling test (8 words) + reading check |
| B | 1-2 | The Jam Jug |
| B | 3-4 | The Yak and the Box |
| B | 5-6 | Consolidation: sound books, blending, revisit · end of week 6: Show what you know + half-term spelling test (8 words) + reading check |

## The fortnight, every book

| Day | Type | After the lesson / warm-up | Edition B (workbook) | Edition A |
|---|---|---|---|---|
| W1-D1 | Reading | handwriting, in the lesson | Letter formation | Book back pages (writing practice) |
| W1-D2 | Reading | spelling | Look Cover Write Check | Workbook |
| W1-D3 | Reading | grammar | Grammar page (below) | Workbook |
| W1-D4 | Reading | handwriting, in the lesson | Words and capitals | Book back pages |
| W1-D5 | Workout | sentence task | Say it, tap it, write it | Book back pages (activity page) |
| W2-D1 | Reading | dictation | Listen and write | Workbook |
| W2-D2 | Reading | tricky-word re-read | no page | no page |
| W2-D3 | Reading | free re-read | no page | no page |
| W2-D4 | Workout | spelling test (6 words) | Spelling test | Workbook |
| W2-D5 | Workout | big write | Big write | Workbook |

Grammar page per book: 1 The Red Socks — Capital letters · 2 Run, Pup,
Run! — Full stops · 3 Fox Fell Off! — Capital I · 4 The Jam Jug — Is it a
sentence? · 5 The Yak and the Box — Fix the sentence (revisit).

## Spelling test words

Six per fortnight: four from the book's focus sounds, two tricky words,
from the approved L2 lists only. Lists finalised at build and published
here; the half-term tests draw across the block's books.

## Week-6 reading check

Listen to your child read the block's final book. Check: blends CVC words
with doubles, reads the seven tricky words, starts sentences with a capital
when reading their own writing back.


================================================================
FILE: TEACHER_SEQUENCE_L3.md
================================================================

# Teaching Sequence — Level 3 Special Friends (website copy) — v2

For the website only. One page per edition is emitted from this source.

## The two kinds of day

Reading days = full 30-minute phonics lesson + one short page (handwriting
inside the lesson at this level). Workout days = short warm-up + one longer
task.

## The six-week block

| Weeks | Book |
|---|---|
| 1-2 | The Fish in the Tank |
| 3-4 | Chop, Chop, Chop! |
| 5-6 | Buzz and Sing! → end of week 6: Show what you know + half-term spelling test (10 words) + reading check |

## The fortnight, every book

| Day | Type | After the lesson / warm-up | Edition B (workbook) | Edition A |
|---|---|---|---|---|
| W1-D1 | Reading | handwriting, in the lesson | Digraph formation | Book back pages (writing practice) |
| W1-D2 | Reading | spelling | Look Cover Write Check | Workbook |
| W1-D3 | Reading | grammar | Grammar page (below) | Workbook |
| W1-D4 | Reading | handwriting, in the lesson | Cluster words on the line | Book back pages |
| W1-D5 | Workout | sentence task | Finish the sentence | Book back pages (activity page) |
| W2-D1 | Reading | dictation | Listen and write | Workbook |
| W2-D2 | Reading | grammar 2 (Book 3 only) / re-read | Question words (Book 3) · else no page | Workbook (Book 3) |
| W2-D3 | Reading | free re-read | no page | no page |
| W2-D4 | Workout | spelling test (8 words) | Spelling test | Workbook |
| W2-D5 | Workout | big write | Big write | Workbook |

Grammar pages: 1 The Fish in the Tank — Capitals for names · 2 Chop, Chop,
Chop! — Question marks · 3 Buzz and Sing! — Statement or question? (W1-D3)
and Question words (W2-D2).

## Spelling test words

Eight per fortnight from the book's digraphs, cluster words and tricky
words (approved lists only); finalised at build and published here.

## Week-6 reading check

Listen to your child read Buzz and Sing! Check: reads sh, ch, th, ng, nk,
qu at sight, blends cluster words (stop, frog), reads the twelve tricky
words.


================================================================
FILE: TEACHER_SEQUENCE_L4.md
================================================================

# Teaching Sequence — Level 4 Longer Sounds (website copy) — v2

For the website only. One page per edition is emitted from this source.

## The two kinds of day

Reading days = full 30-minute phonics lesson + one short page (the copying
page sits inside the lesson — the last level where handwriting is part of
the sound work). Workout days = short warm-up + one longer task.

## The two six-week blocks

| Block | Weeks | Book |
|---|---|---|
| A | 1-2 | The Night Light |
| A | 3-4 | Moo at the Zoo |
| A | 5-6 | Morning on the Farm → end of week 6: half-term spelling test (10 words) + reading check |
| B | 1-2 | The Fair in the Air |
| B | 3-4 | Round and Round |
| B | 5-6 | The Night Fair → end of week 6: Show what you know + half-term spelling test (10 words) + reading check |

## The fortnight, every book

| Day | Type | After the lesson / warm-up | Edition B (workbook) | Edition A |
|---|---|---|---|---|
| W1-D1 | Reading | handwriting, in the lesson | Copy it neatly | Book back pages (writing practice) |
| W1-D2 | Reading | spelling | Look Cover Write Check | Workbook |
| W1-D3 | Reading | grammar | Grammar page (below) | Workbook |
| W1-D4 | Reading | free re-read | no page | no page |
| W1-D5 | Workout | sentence task | Hold the sentence | Book back pages (activity page) |
| W2-D1 | Reading | dictation | Listen and write | Workbook |
| W2-D2 | Reading | tricky-word re-read | no page | no page |
| W2-D3 | Reading | free re-read | no page | no page |
| W2-D4 | Workout | spelling test (8 words) | Spelling test | Workbook |
| W2-D5 | Workout | big write | Big write | Workbook |

Grammar pages: 1 The Night Light — Joining with and · 2 Moo at the Zoo —
Choose . ? ! · 3 Morning on the Farm — Plurals · 4 The Fair in the Air —
Days of the week · 5 Round and Round — Suffixes -ing -ed -er · 6 The Night
Fair — Fix the sentence (revisit).

## Spelling test words

Eight per fortnight from the book's vowel digraphs and tricky words
(approved lists only); finalised at build and published here.

## Week-6 reading check

Listen to your child read the block's final book. Check: reads the Set 2
vowel digraphs at sight, blends two-syllable words, reads the nineteen
tricky words, reads with phrasing rather than word by word.


================================================================
FILE: TEACHER_SEQUENCE_L5.md
================================================================

# Teaching Sequence — Level 5 New Spellings (website copy) — v2

For the website only. One page per edition is emitted from this source.

## The two kinds of day

Reading days = full 30-minute phonics lesson + one short page. Workout
days = short warm-up + one longer task. **From this level handwriting moves
out of the phonics lesson**: the two flick pages per book sit in the
school's handwriting slot (or a spare workout segment), marked below.

## The two six-week blocks

| Block | Weeks | Book |
|---|---|---|
| A | 1-2 | The Big Bike Race |
| A | 3-4 | Lost at the Night Market |
| A | 5-6 | The Dream Team → end of week 6: half-term spelling test (10 words) + reading check |
| B | 1-2 | What Min Saw |
| B | 3-4 | The Boat with the Red Sail |
| B | 5-6 | Phonics Screening Check preparation (sound books, alien-word practice) → end of week 6: Show what you know + half-term spelling test + reading check |

## The fortnight, every book

| Day | Type | After the lesson / warm-up | Edition B (workbook) | Edition A |
|---|---|---|---|---|
| W1-D1 | Reading | spelling | Look Cover Write Check (sound words) | Workbook |
| W1-D2 | Reading | grammar | Grammar page (below) | Workbook |
| W1-D3 | Reading | sentence | Hold the sentence | Book back pages (activity page) |
| W1-D4 | Reading | dictation | Listen and write | Workbook |
| W1-D5 | Workout | comprehension writing | Answer it in a sentence | Workbook |
| W2-D1 | Reading | spelling | Look Cover Write Check (tricky words) | Workbook |
| W2-D2 | Reading | re-read | no page (Book 5: short Answer it) | as Edition B |
| W2-D3 | Reading | free re-read | no page | no page |
| W2-D4 | Workout | spelling test (10 words) | Spelling test | Workbook |
| W2-D5 | Workout | big write | Big write (First, Next, Then) | Workbook |
| HW slot | outside phonics lesson | two sessions per fortnight | Flick it · Flick the words | Book back pages (writing practice) · Workbook |

Grammar pages: 1 The Big Bike Race — Doubling rule · 2 Lost at the Night
Market — Prefix un- · 3 The Dream Team — Commas in lists · 4 What Min Saw —
First, Next, Then · 5 The Boat with the Red Sail — Nouns and verbs + Grow
the noun phrase (a two-page spread; it takes the W1-D5 workout slot, and
Answer it moves to W2-D2 as a short page).

## Spelling test words

Ten per fortnight from the book's new spellings and tricky words (approved
lists only); finalised at build and published here.

## Week-6 reading check

Listen to your child read the block's final book. Check: reads split
digraphs and the alternative spellings met so far, multi-syllable words,
all thirty-three tricky words. Block B's check is the PSC-readiness
checkpoint.


================================================================
FILE: TEACHER_SEQUENCE_L6.md
================================================================

# Teaching Sequence — Level 6 Building Fluency (website copy) — v2

For the website only. One page per edition is emitted from this source.
Level 6 is where children meet the full Year 2 expectations, and where
handwriting begins to join.

## The two kinds of day

Reading days = full 30-minute phonics lesson + one short page. Workout
days = short warm-up + one longer task. Handwriting (first joins) sits
outside the phonics lesson, two sessions per book in the handwriting slot.

## The six-week block

Four books share one block, so each runs a compressed fortnight; The New
Glue carries three grammar skills and takes the longest share.

| Days | Book |
|---|---|
| 1-7 | The Purple Purse |
| 8-14 | The Brown Owl |
| 15-23 | The New Glue |
| 24-28 | The Cheeky Monkey |
| 29-30 | Assessment: Show what you know (both pages) + half-term spelling test (10 words) + reading check |

## The Purple Purse and The Brown Owl (7 days each)

| Day | Type | After the lesson / warm-up | Edition B (workbook) | Edition A |
|---|---|---|---|---|
| D1 | Reading | spelling | Look Cover Write Check (sound words) | Workbook |
| D2 | Reading | grammar 1 | Purse: Contractions · Owl: Four kinds of sentence | Workbook |
| D3 | Reading | sentence | Hold the sentence | Book back pages (activity page) |
| D4 | Reading | dictation | Listen and write | Workbook |
| D5 | Workout | comprehension writing | Answer it in a sentence | Workbook |
| D6 | Reading | grammar 2 + spelling | Purse: Keep the tense · Owl: When, if, that, because (the LCWC tricky page moves to the warm-up) | Workbook |
| D7 | Workout | spelling test, then big write across the afternoon session where the timetable allows; otherwise the big write takes the first day of the next book's week | Spelling test · Big write | Workbook |
| HW slot | outside phonics lesson | two sessions | First joins · Joined words | Book back pages (writing practice) · Workbook |

## The New Glue (9 days)

| Day | Type | Edition B (workbook) | Edition A |
|---|---|---|---|
| D1 | Reading | Look Cover Write Check | Workbook |
| D2 | Reading | Grow the noun phrase | Workbook |
| D3 | Reading | Hold the sentence | Book back pages |
| D4 | Reading | Listen and write | Workbook |
| D5 | Workout | Answer it in a sentence | Workbook |
| D6 | Reading | And, but, or, so | Workbook |
| D7 | Reading | Adjectives and adverbs | Workbook |
| D8 | Workout | Spelling test | Workbook |
| D9 | Workout | Big write | Workbook |
| HW slot | outside lesson | Joins · Joined words | Book back pages · Workbook |

## The Cheeky Monkey (5 days, review book)

D1 Reading: Look Cover Write Check · D2 Reading: Fix and answer (revisit) ·
D3 Reading: Hold the sentence · D4 Reading: Listen and write · D5 Workout:
Spelling test, then Big write closes the level. One handwriting-slot
session: joined phrases from all four books.

## Spelling test words

Ten per fortnight from the book's focus sounds and the level's tricky words
(oh, their, people, Mr, Mrs, looked, called, asked, could); finalised at
build and published here. The half-term test draws across all four books.

## Week-6 reading check

Listen to your child read The Cheeky Monkey. Check: reads the alternative
spellings (ur, er, are, ow, ew, ue) at sight, multi-syllable words with
suffixes, reads with expression. Secure here means the Year 2 expectations
are met.


================================================================
FILE: TEACHER_SEQUENCE_L7.md
================================================================

# Teaching Sequence — Level 7 Reading Together (website copy) — v2

For the website only. One page per edition is emitted from this source.
Levels 7 and 8 are greater-depth levels for children working beyond the
expected Year 2 standard.

## The two kinds of day

Reading days = full 30-minute phonics lesson + one short page. Workout
days = short warm-up + one longer task. The two-page big write (plan, then
write) is one workout session. Handwriting (consistent joining) sits
outside the phonics lesson, two sessions per book.

## The six-week block

| Days | Book |
|---|---|
| 1-7 | Before the Shore |
| 8-14 | Near the Door |
| 15-22 | Sure She Can! |
| 23-28 | A Place for Me |
| 29-30 | Assessment: Show what you know (both pages) + half-term spelling test (10 words, common exception words weighted) + reading check |

## Before the Shore and Near the Door (7 days each)

| Day | Type | After the lesson / warm-up | Edition B (workbook) | Edition A |
|---|---|---|---|---|
| D1 | Reading | spelling | Look Cover Write Check (CEW set) | Workbook |
| D2 | Reading | grammar | Shore: Possessive apostrophe · Door: Homophones | Workbook |
| D3 | Reading | sentence | Hold the sentence | Book back pages (activity page) |
| D4 | Reading | dictation | Listen and write | Workbook |
| D5 | Workout | comprehension writing | Answer it in sentences | Workbook |
| D6 | Reading | spelling 2 | Look Cover Write Check (CEW set 2) | Workbook |
| D7 | Workout | spelling test, then the big write session (plan + write) | Spelling test · Big write plan + Big write | Workbook |
| HW slot | outside phonics lesson | two sessions | Joined up (o r v w) · Joined copy | Book back pages (writing practice) · Workbook |

## Sure She Can! and A Place for Me (8 days each)

As above, with a second grammar page on D6 and the spelling moving to the
warm-ups:

- Sure She Can!: D2 Time words · D6 Progressive tense.
- A Place for Me: D2 Suffix builders · D6 Commas and recount.
- D7 Workout: spelling test. D8 Workout: big write plan + write.

## Spelling test words

Ten per fortnight, weighted to the Year 2 common exception words met in
that book, plus suffix-rule words from the approved pool; finalised at
build and published here.

## Week-6 reading check

Listen to your child read A Place for Me. Check: reads the trigraphs (ire,
ore, ear, oor, ure) and tion fluently, reads with expression and
intonation, self-corrects. Handwriting check: joining is consistent across
whole words.


================================================================
FILE: TEACHER_SEQUENCE_L8.md
================================================================

# Teaching Sequence — Level 8 Reading Champion (website copy) — v2

For the website only. One page per edition is emitted from this source.
Level 8 completes the scheme: Year 2 mastery, with clearly marked Next Step
pages looking ahead to Year 3. The big write becomes a full draft-and-
improve cycle.

## The two kinds of day

Reading days = full 30-minute phonics lesson + one short page. Workout
days = short warm-up + one longer task. The draft and the improved rewrite
are two workout tasks on consecutive workout days (or one extended
session). Handwriting (one fluent copy per book) sits outside the phonics
lesson and copies the same passage the big write later improves, so neat
transcription feeds composition.

## The six-week block

| Days | Book |
|---|---|
| 1-7 | The Marvellous Neighbourhood |
| 8-15 | You Are Remarkable |
| 16-23 | It Looks Suspicious! |
| 24-28 | The Incredible Bush Walk |
| 29-30 | Assessment: Show what you know (both pages) + half-term spelling test (10 words) + reading check |

## The Marvellous Neighbourhood (7 days)

| Day | Type | After the lesson / warm-up | Edition B (workbook) | Edition A |
|---|---|---|---|---|
| D1 | Reading | spelling | Look Cover Write Check | Workbook |
| D2 | Reading | grammar | Possessives: one dog's, two dogs' | Workbook |
| D3 | Reading | sentence | Hold the sentence | Book back pages (activity page) |
| D4 | Reading | dictation | Listen and write | Workbook |
| D5 | Workout | comprehension writing | Answer it in sentences | Workbook |
| D6 | Workout | spelling test, then the draft | Spelling test · Big write draft | Workbook |
| D7 | Workout | the improve session | Check it, make it better | Workbook |
| HW slot | outside phonics lesson | one session | Fluent copy | Book back pages (writing practice) |

## You Are Remarkable and It Looks Suspicious! (8 days each)

As above with a second grammar page mid-cycle:

- You Are Remarkable: D2 Vary the opener · D6 Speech marks (Next step) ·
  D7 spelling test + draft · D8 improve.
- It Looks Suspicious!: D2 Edit and proofread · D6 Fronted adverbials
  (Next step) · D7 spelling test + draft · D8 improve.

## The Incredible Bush Walk (5 days, review book)

D1 Reading: Look Cover Write Check · D2 Reading: Time, place and cause
(Next step) · D3 Reading: Fix-it list (mastery revisit) · D4 Reading: Hold
the sentence + Listen and write in the warm-up · D5 Workout: spelling
test, then the draft and improve sessions close the level across the final
afternoons.

## Spelling test words

Ten per fortnight: the remaining Year 2 common exception words met in that
book plus -ous/-able family words from the approved pool; finalised at
build and published here.

## Week-6 reading check

Listen to your child read The Incredible Bush Walk. Check: reads fluently
with comprehension, infers meaning from context, discusses word choices.
Secure here means Year 2 mastery with Year 3 readiness; Next Step skills
are celebrated as working towards, never required.
