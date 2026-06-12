# L6 Edition B workbook — build log (pilot, 2026-06-11)

Plan ambiguities met during the build and how each was resolved. Everything
here is reversible data; flag anything you want done differently.

## Page-count reconciliation (B4 = 8 pages)

The master plan size table and the L6 plan both state B4 carries 8 pool
pages, and both fix the Edition B total at 49; but the L6 plan's B4
paragraph enumerates only 7 (SP1, GR1, SW1, DI1, HW1, ST1, BW1) and the
teacher sequence says "one handwriting-slot session". The build instruction
also says 49 pages (and "B1: 12", where both plan tables say 11 — read as a
typo). Resolution: B4 carries a second handwriting-slot page, B4.HW2
"Joined words" (a tricky-word review set, selection only), because HW2 is
the only standard slot not excluded by the plan's "No SP2/SW2/GR2". This
honours the signed-off 49 total. If you prefer the 7-page B4, delete
L6.B4.HW2 from `src/data/pool/l6.ts` and the workbook reflows to 48 pages.

## Teaching-order placement of the HW pages

The HW slot is "outside the phonics lesson, any two days". In page order the
build places HW1 after the week-1 pages (after SW2, or after DI1 in B4's
5-day week) and HW2 as the book's final page. SP2 sits before GR2 (the
sequence moves the LCWC tricky page to the D6 warm-up).

## Word-bank remap for LCWC focus words

"Word sets from the word bank via the NEW_TO_OLD remap" — NEW_TO_OLD maps
new L6 books to old L4 books, but the old L4 word bank (RWI Yellow) carries
almost none of the L6 GPCs (only "burst"). The ur/er/are/ew/ue words live in
the old L6 bank and the ow words in the old L3 bank. The build selects from
the books' own approved writing_words lists first, cross-referenced to the
banks that actually carry those GPCs. Recorded per word in L6_SELECTIONS.md.

## Spelling test word lists treated as an authoring dependency

The master plan calls the test lists a select-from-approved task, but the
build instruction lists "final spelling-test word lists" as an AUTHORING
DEPENDENCY ("do NOT write that content"). The instruction wins: no lists
were selected; T10 pages are complete (they never print words) and the
Answers entries are flagged. QA gate check 8 is therefore satisfiable only
for dictation sentences until the lists land.

## B4's revisit page recast

GR1 of B4 reuses the approved review unit (g-l6-review) verbatim, retitled
"Fix and answer" per the teacher sequence (the "Show what you know" title
belongs to the closing assessment). Its instruction renders as the approved
wording's doing part, "Do one of each." — no new decodable text.

## Art slot mapping

The plan's placement vocabulary maps onto the locked reserved zones:
grounded-box → the Watch-first box rail; perch / grounded-foot → the apply
rail (with ground shadow for grounded) or the full-width foot band when the
plan sizes the piece ≥30 mm; T8/T4/T5/T6 foot art → a reserved foot band,
outer corner. The apply rail's height is now pool-driven (plan size + 8 mm,
22-36 mm) so art can never reach above the apply block; booklet units omit
the field and the benchmark renders unchanged. Specific foldings:

- B2.GR1 "owl perch + branch grounded" renders as the one self-contained
  scene_owl_branch in the rail (the owl on its load-bearing branch), with
  the leaf + branch accents in the Watch-first box (as the benchmark).
- B4.GR1 "scene_review + monkey perch" folds into scene_review alone (the
  scene IS the monkey on the wall); a second zone for a separate monkey
  does not exist on a review-format page.
- B1.GR2 "card perch" renders as the card in the Watch-first rail.

## Edition A size

The Edition A dry-run assembles 41 pages (49 minus the eight A:book pages);
the plan's estimate was ≈39. Assembly-level only; nothing rendered.

## Structural copy and decodability

New structural copy was kept to decodable words plus the approved corpus
(words already shipped in the benchmark booklet or the plan docs: write,
sentence, joining word, the statutory terminology). Notable choices:
"Hide it" instead of "cover it"/"fold it" in child-facing routine copy
("cover" and "fold" are not decodable at L6); plan-specified titles ("Look
Cover Write Check", "Listen and write", "Spelling test", "My score") kept
as signed off and logged here as title-level exceptions.

## Joined font

Playwrite GB J ("Playwrite England Joined", TypeTogether via Google Fonts,
SIL OFL) implemented as 'SchoolJoined' with measured metrics
(JOINED_METRICS) and a scoped OpenType re-enable (the global ligature
kill-switch stays on for all decodable text; the joined model rows re-enable
calt/liga only inside their own SVG text). One-page sample rendered for
approval; all eight HW pages ship PENDING-FONT until then. The ligature
stress words (first, off, fluffy, finger, flew) render whole in the sample.

## Pipeline hazard rule

The chroma-key-before-resize rule is now permanent in the worksheet
recreation SKILL.md, and gate check 3 is enforced by
`scripts/qa-saturation.mjs` (saturated non-indigo pixel count per page,
measured not eyeballed).
