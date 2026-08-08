# MyPhonicsBooks levels plan summary (L1 to L8)

Date: 2026-06-10. Compiled from the repo only. Every claim cites a file; where something is not in the repo it is said plainly.

Authoritative sources used:

- Curriculum Ledger v2.1 (8 levels): `myphonics_books/output/worksheet_plan/CURRICULUM_LEDGER.md`
- Grammar scope and sequence: `worksheet-engine/docs/grammar_scheme_of_work.md`
- Booklet plan and template back-log: `worksheet-engine/docs/booklet_plan.md`, `worksheet-engine/docs/booklet_sequence.md`
- Grammar build status: `worksheet-engine/docs/grammar_progression_overview.md`
- Sound Book inventory: `myphonics_books/data/sound_books/inventory.py`
- School mini-app data: `src/school/data/` (levels, bookCatalog, soundBooks, blendingBooks, worksheets, assessmentItems, pathway, teachingSequence)
- School alignment audit: `myphonics_books/output/worksheet_plan/school_alignment.md`
- Asset manifest: `worksheet-engine/src/data/grammarAssets.ts`, files in `worksheet-engine/public/clipart/`

A note on numbering. The repo carries two numbering systems. The 8-level "school" system (Ledger v2.1) is current. `myphonics_books/CLAUDE.md`, `myphonics_books/PRODUCTION_CHECKLIST.md` and `myphonics_books/data/story_summaries.json` still describe the old parent-6 system (L1 Starting Stories ... L6 Reading Champion) and are stale relative to the shipped 8-level outputs. This report uses the 8-level system throughout.

---

## 1. Levels, colours, books and GPCs

All book PDFs below exist in `myphonics_books/output/books/Level{n}/` (regenerated 2026-06-08 to 2026-06-09, each with a reading PDF and a "Printable Booklet" PDF). Status reflects only that a PDF is present; the per-book QA tracker (`PRODUCTION_CHECKLIST.md`) has not been updated to the 8-level numbering, so 8-level QA status is not recorded anywhere in the repo.

### L1 Ditties, Pink #E84B8A, Reception early

GPCs taught: s, a, t, p, i, n, m, d, g, o. Tricky words: I, the. (Ledger L73-L119)

| Book | Title | Focus sounds | Status |
|---|---|---|---|
| L1.1 | Tap! Tap! Tap! | s, a, t, p, i, n | PDF published (`Level1/1_1 Tap Tap Tap.pdf`) |
| L1.2 | The Mud on the Dog | m, d, g, o | PDF published (`Level1/1_2 The Mud on the Dog.pdf`) |

### L2 First Sounds, Coral #F97066, Reception

GPCs taught: c, k, ck, e, u, r, h, b, f, ff, l, ll, ss, j, v, w, x, y, z. Tricky words new: no, go, to, into, is. (Ledger L124-L181)

| Book | Title | Focus sounds | Status |
|---|---|---|---|
| L2.1 | The Red Socks | c, k, ck, e | PDF published (`Level2/2_1`) |
| L2.2 | Run, Pup, Run! | u, r, h, b | PDF published (`Level2/2_2`) |
| L2.3 | Fox Fell Off! | f, l, ff, ll | PDF published (`Level2/2_3`) |
| L2.4 | The Jam Jug | j, v, w | PDF published (`Level2/2_4`) |
| L2.5 | The Yak and the Box | x, y, z | PDF published (`Level2/2_5`) |

### L3 Special Friends, Amber #F59E0B, Reception late

GPCs taught: sh, nk, ch, th, ng, qu, zz. Tricky words new: he, she, we, me, be. Adjacent consonant clusters (Phase 4) taught explicitly at this level. (Ledger L184-L242)

| Book | Title | Focus sounds | Status |
|---|---|---|---|
| L3.1 | The Fish in the Tank | sh, nk | PDF published (`Level3/3_1`) |
| L3.2 | Chop, Chop, Chop! | ch, th | PDF published (`Level3/3_2`) |
| L3.3 | Buzz and Sing! | ng, qu, zz | PDF published (`Level3/3_3`) |

### L4 Longer Sounds, Green #22C55E, Reception to Y1

GPCs taught (RWI Set 2 primary spellings): ay, ee, igh, ow (blow), oo (zoo), oo (look), ar, or, air, ir, ou, oy. Tricky words new: was, my, you, they, her, all, are. (Ledger L246-L315)

| Book | Title | Focus sounds | Status |
|---|---|---|---|
| L4.1 | The Night Light | ay, ee, igh | PDF published (`Level4/4_1`) |
| L4.2 | Hot Food, Cool Moon | ow, oo | PDF published (`Level4/4_2`) |
| L4.3 | Morning on the Farm | ar, or | PDF published (`Level4/4_3`) |
| L4.4 | The Fair in the Air | air, ir | PDF published (`Level4/4_4`) |
| L4.5 | Round and Round | ou, oy | PDF published (`Level4/4_5`) |
| L4.6 | The Night Fair | review all L4 | PDF published (`Level4/4_6`) |

### L5 New Spellings, Blue #3B82F6, Year 1

GPCs taught: a-e, i-e, o-e, u-e, ea, ie, oi, aw, ai, oa. Tricky words new (14): said, so, have, like, some, come, were, there, little, one, do, when, out, what. (Ledger L319-L381)

| Book | Title | Focus sounds | Status |
|---|---|---|---|
| L5.1 | The Big Bike Race | a-e, i-e | PDF published (`Level5/5_1`) |
| L5.2 | Lost at the Night Market | o-e, u-e | PDF published (`Level5/5_2`) |
| L5.3 | The Dream Team | ea, ie | PDF published (`Level5/5_3`) |
| L5.4 | What Min Saw | oi, aw | PDF published (`Level5/5_4`) |
| L5.5 | The Boat with the Red Sail | ai, oa | PDF published (`Level5/5_5`) |

### L6 Building Fluency, Indigo #6366F1, Year 1 post-PSC into Year 2

Vowel GPCs taught: ur, er, are, ow (brown), ew, ue. Consonant alternatives taught: wr, kn, ge, dge, mb, gn, ph, wh. Word-pool-only graphemes (no dedicated book): oe, au, e-e, c as /s/, sc as /s/. Tricky words new (9): oh, their, people, Mr, Mrs, looked, called, asked, could. (Ledger L387-L472)

| Book | Title | Focus sounds | Status |
|---|---|---|---|
| L6.1 | The Purple Purse | ur, er | PDF published (`Level6/6_1`) |
| L6.2 | The Brown Owl | are, ow (brown) | PDF published (`Level6/6_2`) |
| L6.3 | The New Glue | ew, ue | PDF published (`Level6/6_3`) |
| L6.4 | The Cheeky Monkey | review all L6 | PDF published (`Level6/6_4`) |

The consonant alternatives are covered by combined Sound Books at this level, not storybooks: wr+kn, ge+dge, mb+gn, ph+wh (Ledger L429-L436; PDFs `output/sound_books/L6/L6_06_wr_kn.pdf` through `L6_09_ph_wh.pdf`).

### L7 Reading Together, Purple #8B5CF6, Year 2

GPCs taught: ire, ore, ear, oor, ure, tion. Tricky/CEW: Y2 common exception words, first set (door, floor, poor, because, find, kind ... bath, full list at Ledger L488-L489). Phase 6 morphology introduced (suffix rules, doubling, drop-e, y to i). (Ledger L477-L546)

| Book | Title | Focus sounds | Status |
|---|---|---|---|
| L7.1 | Before the Shore | ire, ore | PDF published (`Level7/7_1`) |
| L7.2 | Near the Door | ear, oor | PDF published (`Level7/7_2`) |
| L7.3 | Sure She Can! | ure, tion | PDF published (`Level7/7_3`) |
| L7.4 | A Place for Me | review all L7 | PDF published (`Level7/7_4`) |

### L8 Reading Champion, Teal #14B8A6, Year 2 into Year 3 readiness

No new single-grapheme code. Suffix morphology taught: -ous, -cious, -tious, -able, -ible, plus extended prefixes and suffixes (re-, dis-, mis-, sub-, -tion, -sion). Remaining Y2 CEWs (hour, move, prove ... Christmas, Ledger L570-L573). (Ledger L549-L618)

| Book | Title | Focus sounds | Status |
|---|---|---|---|
| L8.1 | The Marvellous Neighbourhood | -ous | PDF published (`Level8/8_1`) |
| L8.2 | You Are Remarkable | -able, -ible | PDF published (`Level8/8_2`) |
| L8.3 | It Looks Suspicious! | -cious, -tious | PDF published (`Level8/8_3`) |
| L8.4 | The Incredible Bush Walk | review all L8 | PDF published (`Level8/8_4`) |

All 33 storybooks named in the ledger therefore have PDFs. Each L6 book in the old numbering (now L8) carries a non-fiction text feature (labels, letter, list, diary) per `data/story_summaries.json` `nonfiction_feature_note`.

---

## 2. Worksheet strands per level and unit counts

Three planning layers exist. They are consistent in strands but differ in packaging.

### 2a. Per-level booklet plan (`worksheet-engine/docs/booklet_plan.md`)

One booklet per level. Strands: Phonics (sound sheets, spelling sorts, tricky words, alien words), Handwriting, Grammar (including sentence writing), front and back matter (cover, contents, how-to, review or challenge, certificate). A Science strand was raised in the brief but has no curricular source anywhere in the repo; the plan flags it as out for v1 (`booklet_plan.md` section A0).

| Level | Sound sheets (SingleSound) | Handwriting pages | Grammar pages | Other phonics pages | Total pages |
|---|---|---|---|---|---|
| L1 | 10 | 2 | 2 | SoundMat, TrickyWords | 21 |
| L2 | 19 | 2 | 3 | SoundMat, TrickyWords | 31 |
| L3 | 7 | 2 | 3 | SoundMat, BlendingDrill, TrickyWords | 20 |
| L4 | 11 | 2 | 4 | SpellingSort, TrickyWords | 24 |
| L5 | 10 | 2 | 4 + 1 comprehension | SpellingSort, WordLadder, TrickyWords | 25 |
| L6 | 14 (6 vowel + 8 consonant alt) | 2 | 5 | SpellingSort, ConsonantAltSort, TrickyWords | 29 |
| L7 | 6 | 2 | 4 + 1 comprehension | SuffixTransform, CEWSpellingTest | 20 |
| L8 | 0 (5 SuffixSpelling sheets instead) | 2 | 4 + 1 comprehension | WordFamilyTree, CEWSpellingTest | 19 |

Totals: 72 SingleSound sheets plus 5 SuffixSpelling sheets, 189 pages across 8 booklets. Build status: only `SingleSound` is built and locked (`src/components/templates/SingleSound.tsx`); `MatchPictureWord` exists as a draft. Everything else in the template back-log (BookletCover, ContentsPage, HowToUse, Certificate, HandwritingCopy, TrickyWords, SpellingSort, BlendingDrill and the rest) is marked TO-BUILD. Sound-sheet data exists for one grapheme only (`src/data/sounds/a.ts`); rendered outputs are `output/sound__a.pdf` and `output/sound__t.pdf`.

### 2b. Grammar strand (separate workbook per level)

Per `grammar_scheme_of_work.md` the grammar strand is its own booklet at every level, with units coded G-L{level}.{n}:

| Level | Booklet name | Units |
|---|---|---|
| L1 | Foundations | 3 (G-L1.1 to G-L1.3) |
| L2 | First Punctuation | 4 |
| L3 | Names and Questions | 4 |
| L4 | Joining and Endings | 5 |
| L5 | Word Building and Order | 6 |
| L6 | Sentence Types and Phrases | 7 plus review |
| L7 | Apostrophes and Cohesion | 6 |
| L8 | Mastery and Year 3 Readiness | 6 (3 Y2 mastery + 3 flagged [Y3 next step]) |

Build status (per `grammar_progression_overview.md` and `output/`): all 41 unit worksheets render in the flowy engine, and per-level booklet PDFs exist (`worksheet-engine/output/grammar_L1_booklet.pdf` to `grammar_L8_booklet.pdf` plus `grammar_ALL_levels.pdf`). The booklet shell (cover, contents, how-to, answers, certificate) is implemented in `src/components/grammar/booklet/GrammarBooklet.tsx`. L6 is the hand-built reviewed exemplar (`src/data/grammar/l6.ts`, authored from `docs/grammar_L6_contents.md`); L1 to L5, L7 and L8 are first drafts authored by `myphonics_books/scripts/author_grammar.py` and still need a decodability and pedagogy QA pass. The status line in `grammar_scheme_of_work.md` ("No worksheets built yet") is stale.

### 2c. School resource model (`src/school/data/worksheets.ts` and `school_alignment.md`)

The school pathway counts four worksheet pack kinds: a 5-page pack per storybook, a 1 to 2 page worksheet per Sound Book, one cumulative sound mat per level and one tricky word card set per level. Encoded totals (`school_alignment.md` section 1): L1 14, L2 22, L3 11, L4 20, L5 17, L6 15, L7 12, L8 11, total 122 packs. The seven-component lifecycle (letter tracing, handwriting, alien words, tricky words, sentence and grammar, comprehension, vocabulary and spelling) is encoded per level in `WORKSHEET_COMPONENTS` and matches the Ledger lifecycle table (Ledger L49-L57). Alien words go light at L6 and are retired from L7.

Companion print products per level (not worksheets but sequenced with them):

- Sound Books: 70 PDFs in `myphonics_books/output/sound_books/` (L1 10, L2 15, L3 6, L4 12, L5 10, L6 9, L7 6, L8 2). Inventory in `data/sound_books/inventory.py`.
- Blending Books: 12 defined for L1 to L5 in `src/school/data/blendingBooks.ts`. No blending book PDFs exist anywhere in the repo.

---

## 3. Illustration assets per level

There are two asset registers for worksheets:

1. `worksheet-engine/public/clipart/` (26 files plus untrimmed copies in `_raw/`), documented by `public/clipart/README.md`. One flat namespace keyed by imageKey; the renderer (`src/components/Clipart.tsx`) draws a key only when its file exists, otherwise a placeholder.
2. `worksheet-engine/src/data/grammarAssets.ts`, the grammar line-art manifest (status ok, redraw or missing per key).

The grammar style rule (manifest header and `docs/worksheet_design_rules.md` section 4) is: one line-art treatment, trimmed white or transparent background, creatures with small solid pure-black dot eyes, no whites, no shines, no coloured irises. The sound-sheet word images are a separate full-colour flat clipart set used by the locked `SingleSound` master. Note that `grammarAssets.ts` and `grammarSchema.ts` both cite `grammar_aesthetic_direction.md` as their source; that document does not exist in the repo.

Visual inspection of every file (all are AI-generated PNG clipart; none is a raster photo):

### Grammar line-art set (used as decorations in `src/data/grammar/l1.ts` to `l8.ts`)

| Key | File | Style | Eyes | Flag |
|---|---|---|---|---|
| owl | owl.png | line-art | large circle eyes with white interiors and shine dots | FLAG: breaks dot-eye rule; manifest status redraw |
| monkey | monkey.png | pure line-art | solid black dots | none |
| cat | cat.png | full colour (orange cartoon) | solid black dots | FLAG: coloured; manifest status redraw |
| branch | branch.png | pure line-art | n/a | none |
| tree | tree.png | pure line-art | n/a | none |
| leaf | leaf.png | pure line-art | n/a | none |
| moon | moon.png | pure line-art (has a face) | solid black dot | none |
| purse | purse.png | pure line-art | n/a | none |
| glue | glue.png | pure line-art | n/a | none |
| feather | feather.png | pure line-art | n/a | none |
| banana | banana.png | pure line-art | n/a | none |
| coins | coins.png | pure line-art | n/a | none |
| paintbrush | paintbrush.png | pure line-art (solid black tip) | n/a | none |
| abc | abc.png | pure line-art (ABC blocks) | n/a | none |

Manifest keys with no file at all: owlets, bird, cup, rug, card (`grammarAssets.ts` status missing).

### Sound-sheet word clipart (full-colour set for the SingleSound master and book sheets)

| Key | File | Style | Eyes | Flag |
|---|---|---|---|---|
| tap | tap.png | full colour flat clipart | n/a | coloured by design for the sound strand; breaks the one-line-art rule if reused on grammar pages |
| pin | pin.png | full colour | n/a | as above |
| tin | tin.png | full colour | n/a | as above |
| mat | mat.png | full colour | n/a | as above |
| hat | hat.png | full colour | n/a | as above |
| bag | bag.png | full colour | n/a | as above |
| pan | pan.png | full colour | n/a | as above |
| axe | axe.png | full colour | n/a | as above |
| jam | jam.png | full colour | n/a | as above |
| ant | ant.png | full colour (red-brown) | solid black oval, no white | coloured |
| rat | rat.png | full colour (grey) | solid black dot | coloured |
| cat | cat.png | shared with grammar set above | dots | coloured |
| tap-mascot | tap-mascot.png | full-colour washed book-style illustration (boy and ginger cat), used as the SingleSound header mascot | solid black dots on both | washed by design (book art) |

No file in either set has big white cartoon eyes except owl.png. No asset is a photograph; the only photographic imagery in the wider system is inside the Sound Book PDFs themselves, which use real photographs by design (`school_alignment.md` section 2).

Amendment (2026-06-10, later the same day, after the L6 flowy rebuild):

- owl.png and cat.png were removed from the active folder; the rejected originals survive only in `_raw/`. Their manifest entries are now `missing`, not `redraw` (see `worksheet_asset_audit_L6.md` section 3). The two FLAG rows above are stale.
- The renderer rule in this section is stale: `Clipart.tsx` now draws a grammar-manifest key only when its manifest status is `ok` AND its file exists. A file alone no longer renders for keys in `grammarAssets.ts`.
- The `cat` key is no longer shared between the two registers. The sound strand's full-colour cat now lives at `cat-word.png` (referenced by `src/data/sounds/a.ts`); the bare `cat` key is grammar-only and gated by the manifest.
- moon.png has a face and is KEEP per the approved L6 image plan ("already in style"). The cover note "small and solid" refers to full opacity (versus the removed ghost moon), not to removing the face.

Level coverage of clipart is effectively L1-word plus L6-grammar only. `booklet_plan.md` section C estimates roughly 125 further single-object images, 8 cover mascots and about 6 comprehension scenes are needed across L1 to L8 (per-level word lists are itemised there). Booklet cover mascots are planned to be sourced from `myphonics_books/output/images/L{old}_{sub}_B1/hero_reference.png`, which still uses the old 6-level folder names.

---

## 4. Gaps

Books and data:

1. No missing book PDFs. All 33 ledger books have reading and printable-booklet PDFs under `myphonics_books/output/books/Level1..Level8/` (regenerated 2026-06-08/09).
2. Stale 6-level planning files. `myphonics_books/CLAUDE.md` (6 levels, different level names and colours), `myphonics_books/PRODUCTION_CHECKLIST.md` (says 7 books remain) and `myphonics_books/data/story_summaries.json` (level_6 status NOT_STARTED, titles null) all contradict the shipped 8-level outputs. `myphonics_books/data/graphemes_by_level.json` is also still 6-level (`booklet_plan.md` section 0.3). There is no 8-level QA tracker.
3. Sound Book count drift. `inventory.py` docstring claims 73 books; the inventory and the PDF output both contain 70 (the L8 suffixes were merged into 2 combined books). `src/school/data/soundBooks.ts` encodes 73, so the school app's counts and the print output disagree by 3. Further naming and comparison-sound drift is itemised in `school_alignment.md` section 3.
4. zz placement. The ledger puts zz at L3 (Ledger L191) but the only zz Sound Book is the L2 combined ss and zz book (`output/sound_books/L2/L2_12_ss_zz.pdf`); there is no L3 zz book, while `booklet_plan.md` schedules a zz SingleSound sheet at L3.
5. Blending Books: 12 are defined in `src/school/data/blendingBooks.ts` and counted in the school pathway, but no blending book PDFs exist in the repo.

Worksheets:

6. Sound, handwriting and tricky-word strands are plan-only beyond the master. Of the 77 planned phonics sheets, data exists for one grapheme (`src/data/sounds/a.ts`); `HandwritingCopy`, `TrickyWords`, `BookletCover`, `ContentsPage`, `Certificate` and every other non-grammar template in `booklet_plan.md` section B are TO-BUILD.
7. Grammar drafts have no real anchor books. Only `src/data/grammar/l6.ts` anchors units to actual titles (The Purple Purse, The Brown Owl, The New Glue, The Cheeky Monkey). L1 to L5, L7 and L8 all carry the generic placeholder "Level N readers" as anchorBook, and `grammar_progression_overview.md` lists book-anchored examples and a decodability plus pedagogy QA pass as outstanding work.
8. Stale status lines: `grammar_scheme_of_work.md` still says "No worksheets built yet"; 41 worksheets and 8 booklet PDFs now exist.

Assets:

9. Asset keys referenced by worksheets with no file: owlets (G-L6.2 rowArt and G-L6.4 foot scene), cup and rug (G-L6.3 foot scene), all in `src/data/grammar/l6.ts`. The renderer degrades gracefully, so these pages currently print without their art. Manifest keys bird and card are also missing but are not yet referenced by any unit.
10. Style breaches: owl.png has white-shine eyes (manifest status redraw, referenced by G-L6.1, G-L6.4, G-L6.6 and an L5, L7 and L8 decoration each) and cat.png is full colour (manifest status redraw, referenced by G-L6.5, G-L6.7).
11. `grammar_aesthetic_direction.md` is cited by `grammarAssets.ts` and `grammarSchema.ts` but is not in the repo.
12. Clipart volume: roughly 125 word images, 8 cover mascots and 6 scenes are still to generate per `booklet_plan.md` section C; the mascot source folders still use old 6-level names, so imports must go through the old-to-new map until renamed (`booklet_plan.md` section 0.4 cites `EIGHT_LEVEL_MIGRATION_PROMPT.md`).

---

## 5. Other school and scheme pieces worksheets should align with

- Teaching sequence and pathway. `src/school/data/teachingSequence.ts` and `pathway.ts` define the 118-step pathway: for each GPC, Sound Book then Blending Book (L1 to L5) then Storybook, with companions per resource (Sound Book worksheet, 5-page storybook pack, interactive digital book) and per-level wraparound (sound mat, tricky word cards, 40+ phoneme audio files). Worksheet IDs should key off the canonical school-8 IDs proposed in `school_alignment.md`.
- Assessment. An assessment item bank exists per level in `src/school/data/assessmentItems.ts` with six categories: sound recognition, real word reading, alien words, tricky words, speedy reading, fluency. L1 to L3 items are newly written for the 8-level structure; L4 to L8 were lifted from the parent-6 bank and flagged for refinement. Worksheet alien-word and tricky-word content should stay consistent with this bank (and with the alien-word retirement after L6).
- Stamps and certificates. The reader app awards one stamp per unique reading day per book, with readiness check-ins at stamps 3 to 5 and a certificate unlocking at 5 stamps (`src/lib/stamps.ts`, MAX_STAMPS 5). Separately, each printed book carries a Reading Star Certificate page (`myphonics_books/CLAUDE.md` 16-page structure), each grammar booklet ends with a level certificate (`GrammarBooklet.tsx`, scheme section 3) and each planned level booklet ends with a Certificate page (`booklet_plan.md`). Worksheet certificates should not clash with the 5-stamp book certificate language.
- Exit criteria. Both the Ledger (per-level Exit Criteria sections) and the grammar scheme (section 7, with measurable secure thresholds such as "4 of 5") define what the review pages must check. Review and challenge pages should test exactly these.
- Parent-facing pieces. The pack formula requires parent-friendly instructions and a teacher-credible NC alignment (Ledger, Worksheet Pack System design principles); grammar booklets include a how-to page using I do, We do, You do and an answer key for the parent or teacher (scheme section 3). Wider planning documents in `myphonics_books/output/worksheet_plan/` include `schools_curriculum_guide.md`, `curriculum_journey.md`, `learning_journey.md` and `saudi_adaptations.md`.
- Decodability is the binding constraint everywhere: every worksheet word must be decodable at the level or be a listed tricky word, grammar must not exceed the level's writing track, and sentence-length bands apply (L1 3-5 words up to L8 varied; Ledger cross-level audit checklist, scheme section 4).
