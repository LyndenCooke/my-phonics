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
