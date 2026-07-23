# MyPhonicsBooks — Printable Worksheet Booklet Plan (L1–L8)

**Status:** Plan for review. No templates built yet. Page-by-page back-log only.
**Authoritative sources used:** 8-level `output/worksheet_plan/CURRICULUM_LEDGER.md` (v2.1); `worksheet-engine/docs/worksheet_template_spec.md`; `src/components/templates/SingleSound.tsx`; `src/data/soundSchema.ts`; `src/design/levelThemes.ts`; `src/components/TraceLine.tsx`; `src/design/handwriting.ts`; `myphonics_books/output/images/L{n}_{sub}_B1/`.
**Date:** 2026-06-07. British English throughout.

---

## 0. Read-first flags (conflicts surfaced, not guessed)

These are places where the brief and the sources disagree, or where a source is stale. I have planned to the authoritative ledger and listed the conflict rather than inventing curriculum.

1. **8 levels, not 6 — resolved in favour of 8.** The brief says L1–L8. The Drive PDF `Curriculum/CURRICULUM LEDGER.pdf` is v1.0 (6 levels). The repo mirror `output/worksheet_plan/CURRICULUM_LEDGER.md` is **v2.1 (8 levels)**, matches `EIGHT_LEVEL_MIGRATION_PROMPT.md`, and matches `src/design/levelThemes.ts` (8 themed colours). The 8-level ledger is the school levelling system this booklet targets, so it is the authority here. **Action for Lynden:** the Drive PDF should be re-exported from the v2.1 markdown so the two stop disagreeing.

2. **"Science" strand has no curricular source.** The brief lists Science as a strand "where the level calls for it". The ledger, the grammar/spelling design docs and the worksheet pack system contain **no Science track**. The only occurrence of "science" in any source is as an example word for the grapheme `sc` (`/s/ as in science`) at L6. I will **not invent a science curriculum**. I have left Science as an explicit, flagged decision (section A0) with a recommended default. Nothing else in the plan depends on it.

3. **`myphonics_books/data/graphemes_by_level.json` is stale (6-level).** Its `level_1` still bundles all of RWI Set 1 (45 graphemes) under the old "Starting Stories" model. The migration prompt confirms these Python/JSON data files are **not yet remapped**. The phonics page counts below come from the **ledger's per-level NEW GPC lists**, not this file. **Dependency:** the data files must be remapped to 8 levels (migration prompt step 11) before any template is fed live data.

4. **Book art is still on 6-level folder names.** Mascots live at `output/images/L{n}_{sub}_B1/hero_reference.png` using the OLD numbering (`L1_1`…`L6_4`). The 8-level remap (migration prompt §5) renames these (e.g. old `L1_4` → new `L2.1`). Header-mascot keys in the plan reference the **new** level/book id; the asset must be sourced from the current folder via the old→new map in `EIGHT_LEVEL_MIGRATION_PROMPT.md` until the folders are renamed.

5. **Two packaging models exist.** The ledger's "Worksheet Pack System" is **one 6-page pack per book** (33 books × 6 pages). The brief asks for **one booklet per level** combining strands. This plan delivers the **per-level booklet**, reusing the ledger's per-level activity types as the page bank. The per-book 6-page pack remains valid as a future product; the templates built for this plan serve both.

---

## A. Per-level booklet plans

### Conventions used in every table

- **Strand** is one of: Phonics (individual sounds + spelling + tricky words), Handwriting, Grammar (incl. sentence writing), Science (flagged), Front/Back matter.
- **Template** names map to section B. `SingleSound` is the LOCKED master and already EXISTS.
- Single-Sound sheets: **one per NEW grapheme at that level** (ledger GPC list). Letter *formation* (§1 trace) is inside SingleSound, so the Handwriting strand carries only the joining/fluency/copying progression, never per-letter tracing.
- Every handwriting guideline is rendered by `TraceLine` (metric-driven, Andika). Never hand-drawn. Hierarchy: solid light top guide, pink-dashed x-height, solid darker baseline.
- Colour per level is read from `getLevelTheme(level)` — never hard-coded.
- "clipart needed" flags **(creature → solid black dot eyes)** wherever an animal/creature object is used.

### A0. Science strand decision (applies to all levels)

Recommended default until Lynden confirms a scope: **Science is OUT of the booklet for v1**, because no source defines it and the decodable rule would heavily constrain any science vocabulary. If a cross-curricular page is wanted, the lowest-risk option is a single optional **"Word and World"** page per level that reuses each book's existing `cultural_brief_*` theme (e.g. L4 *Hot Food, Cool Moon* → animals; L7/L8 *Incredible Bush Walk* → habitats), written to the level's decodable rule. Marked **TO-CONFIRM**; it does not block any template build.

---

### Level 1 — Ditties · Pink #E84B8A · Reception (4–5)

New GPCs (10): **s a t p i n m d g o**. Tricky words: **I, the**. Grammar track: oral sentence, finger spaces, letter/word terminology.

| # | strand | template | content summary | data needed | clipart needed (eyes) | notes |
|---|---|---|---|---|---|---|
| 1 | Front matter | `BookletCover` | L1 cover, pink, title "Ditties — Worksheet Pack", L1 book mascot | level, name, mascot key `L1.1` | hero from `L1_1_B1/hero_reference.png` | cover scene optional from `cover.png` |
| 2 | Front matter | `ContentsPage` | numbered index of this pack | auto from page list | — | |
| 3 | Front matter | `HowToUse` | parent note: "Say it. Tap it. Write it. Check it." | static copy | — | one paragraph, no jargon |
| 4 | Phonics | `SoundMat` | Phase 2 (10 sounds) picture mat | 10 graphemes + 1 image each | sun, ant, tap, pig, net, mat, dog, gas… **(none are creatures except ant, dog, pig → dot eyes)** | reference chart, not a writing task |
| 5–14 | Phonics | `SingleSound` ×10 | one sheet per grapheme s,a,t,p,i,n,m,d,g,o | per grapheme: 5 trace words + 4 missing words (all VC/CVC from SATPIN+MDGO) | per sheet ~5–9 objects; **cat/dog/pig/ant/rat = dot eyes** | LOCKED template; strand pill "Phonics" |
| 15 | Phonics | `TrickyWords` | I, the — rainbow trace + read | 2 tricky words | — | |
| 16 | Handwriting | `HandwritingCopy` | pencil-control patterns (loops, zigzags, spirals) | pattern set | — | `TraceLine` patterns row |
| 17 | Handwriting | `HandwritingCopy` | letter-family formation (long-ladder / one-armed robot / curly caterpillar / zig-zag) | 4 family groupings of taught letters | — | start-dot + directional arrow |
| 18 | Grammar | `HoldASentence` | caption frame: picture + "Say it, then write it" | 1 decodable caption (e.g. "I sit.") | 1 object | RWI Hold-a-Sentence |
| 19 | Grammar | `MatchPictureWord` | match picture to caption | 3–4 picture/caption pairs | 3–4 objects (dot eyes if creature) | EXISTS-draft template |
| 20 | Back matter | `QuickCheck` | circle the sound · trace the letter · copy the caption | 3 mini tasks | 1 object | ledger page-6 (L1) |
| 21 | Back matter | `Certificate` | "L1 Ditties — completed" award, child name line | level, name | optional mascot | |

**L1 totals:** 21 pages · 10 SingleSound · 2 Handwriting · 2 Grammar · Science 0 (flagged).

---

### Level 2 — First Sounds · Coral #F97066 · Reception (4–5)

New GPCs (19): **c k ck e u r h b f ff l ll ss j v w x y z**. New tricky: **no, go, to, into, is**. Grammar: capital letter at sentence start, full stop, capital I.

| # | strand | template | content summary | data needed | clipart needed (eyes) | notes |
|---|---|---|---|---|---|---|
| 1 | Front matter | `BookletCover` | L2 cover, coral, mascot `L2.1` (old `L1_4`) | level, mascot key | hero from old `L1_4_B1` | old→new map |
| 2 | Front matter | `ContentsPage` | index | auto | — | |
| 3 | Front matter | `HowToUse` | parent note | static | — | |
| 4 | Phonics | `SoundMat` | Phase 2 complete chart | cumulative graphemes + cues | mixed objects (dot eyes for creatures) | |
| 5–23 | Phonics | `SingleSound` ×19 | one per grapheme c,k,ck,e,u,r,h,b,f,ff,l,ll,ss,j,v,w,x,y,z | per grapheme 5 trace + 4 missing (CVC/CVCC, double-letter endings) | duck, bell, fox, web, jet, yak, zip… **fox/duck/yak/cat = dot eyes** | sound buttons: dot per phoneme, line under ck |
| 24 | Phonics | `TrickyWords` | no, go, to, into, is — look/cover/write/check | 5 tricky words | — | |
| 25 | Handwriting | `HandwritingCopy` | remaining lowercase + entry strokes | letter set | — | |
| 26 | Handwriting | `HandwritingCopy` | capital vs lowercase matching + finger-space practice | 26 pairs / spacing demo | — | |
| 27 | Grammar | `TickTheCorrect` | tick the correctly-punctuated sentence | 4 sentence options | — | SPaG tick-one-of-four |
| 28 | Grammar | `InsertMissing` | insert the full stop / capital I hunt | 4 short sentences | — | |
| 29 | Grammar | `SentenceFromPicture` | "I can see a ___." picture prompt | 2–3 prompts | 2–3 objects (dot eyes) | ledger page-4 (L2) |
| 30 | Back matter | `QuickCheck` | add capitals + full stops to 3 sentences | 3 sentences | — | |
| 31 | Back matter | `Certificate` | L2 award | level, name | — | |

**L2 totals:** 31 pages · 19 SingleSound · 2 Handwriting · 3 Grammar · Science 0.

---

### Level 3 — Special Friends · Amber #F59E0B · Reception (late)

New GPCs (7): **sh nk ch th ng qu zz**. New tricky: **he, she, we, me, be**. Grammar: question mark, proper nouns (capitals for names). Adjacent-consonant blending (Phase 4) taught explicitly.

| # | strand | template | content summary | data needed | clipart needed (eyes) | notes |
|---|---|---|---|---|---|---|
| 1 | Front matter | `BookletCover` | L3 cover, amber, mascot `L3.1` (old `L1_3`) | level, mascot key | hero old `L1_3_B1` | |
| 2 | Front matter | `ContentsPage` | index | auto | — | |
| 3 | Front matter | `HowToUse` | parent note | static | — | |
| 4 | Phonics | `SoundMat` | digraph mat (sh, ch, th, ng, nk, qu, zz) | 7 graphemes + cues | ship, chip, fish, ring… **fish = dot eyes** | dash under digraphs |
| 5–11 | Phonics | `SingleSound` ×7 | one per digraph sh,nk,ch,th,ng,qu,zz | per grapheme 5 trace + 4 missing (CVC/CCVC) | ship, shell, chop, thin, ring, quiz, buzz | digraph dash buttons |
| 12 | Phonics | `BlendingDrill` | adjacent-consonant drills (st, sp, str, scr, bl, cr…) | cluster set + alien words | — | Phase 4 explicit; PSC-prep alien row |
| 13 | Phonics | `TrickyWords` | he, she, we, me, be | 5 tricky words | — | |
| 14 | Handwriting | `HandwritingCopy` | digraph formation (sh, ch, th, ng…) | digraph set | — | |
| 15 | Handwriting | `HandwritingCopy` | copy short captions with digraphs; ascender/descender height | 3–4 captions | 1–2 objects (dot eyes) | |
| 16 | Grammar | `CutAndSort` | proper-noun sort: common noun vs name columns | 8 word cards | — | EXISTS-draft `CutAndStick`/`SortBySound` variant |
| 17 | Grammar | `QuestionOrStatement` | question vs statement sort; match question word | 4 sentences + who/what/where… | — | |
| 18 | Grammar | `FinishTheSentence` | sentence starter completed with decodable word | 3 starters | 3 objects (dot eyes) | ledger page-4 (L3) |
| 19 | Back matter | `QuickCheck` | choose . or ? for 4 sentences; write one question | 4 sentences | — | |
| 20 | Back matter | `Certificate` | L3 award | level, name | — | |

**L3 totals:** 20 pages · 7 SingleSound · 2 Handwriting · 3 Grammar · Science 0.

---

### Level 4 — Longer Sounds · Green #22C55E · Reception–Y1 (4–6)

New GPCs (11 graphemes; ledger counts 12 sounds — `oo` sheet covers long *zoo* + short *look*): **ay ee igh ow(blow) oo ar or air ir ou oy**. New tricky: **was, my, you, they, her, all, are**. Grammar: join with "and", exclamation mark, days-of-week capitals, plurals -s/-es, verb suffixes (no root change). Grammar content already designed in `output/worksheet_plan/l4_grammar_spelling_design.md`.

| # | strand | template | content summary | data needed | clipart needed (eyes) | notes |
|---|---|---|---|---|---|---|
| 1 | Front matter | `BookletCover` | L4 cover, green, mascot `L4.1` (old `L2_1`) | level, mascot key | hero old `L2_1_B1` | |
| 2 | Front matter | `ContentsPage` | index | auto | — | |
| 3 | Front matter | `HowToUse` | parent note | static | — | |
| 4–14 | Phonics | `SingleSound` ×11 | one per grapheme ay,ee,igh,ow,oo,ar,or,air,ir,ou,oy | per grapheme 5 trace + 4 missing | tray, bee, light, snow, zoo/book, car, fork, chair, bird, owl, boy… **bee/owl/bird = dot eyes** | `oo` sheet shows both pronunciations |
| 15 | Phonics | `SpellingSort` | long oo vs short oo; ay/ai awareness (reading only) | 2-bin sort words | — | ledger page-2 (L4) |
| 16 | Phonics | `TrickyWords` | was, my, you, they, her, all, are | 7 tricky words | — | |
| 17 | Handwriting | `HandwritingCopy` | copy decodable sentences with vowel digraphs; consistent size | 3 sentences | — | recap formation k,b,d,p,q |
| 18 | Handwriting | `HandwritingCopy` | days-of-the-week capitals practice | 7 day names | — | |
| 19 | Grammar | `JoinWithAnd` | join two clauses with "and" (two-column) | 4 clause pairs (from l4 design sheet_1) | cat, sun, hat (dot eyes for cat) | content ready in design doc |
| 20 | Grammar | `ThreeWayEndMark` | choose . ? or ! | 4 sentences (design sheet_2) | dog, ship, moon (dog → dot eyes) | |
| 21 | Grammar | `PluralMatch` | add -s / -es; 1 cat → 2 cats; 1 fox → 2 foxes | 6 singular/plural pairs | cat, fox (dot eyes) | |
| 22 | Grammar | `SentenceFromTwoPictures` | "write one sentence using and" | 2 picture prompts | 2 objects (dot eyes) | ledger page-4 (L4) |
| 23 | Back matter | `QuickCheck` | "and" joins ×3; end marks ×3 | mixed | — | |
| 24 | Back matter | `Certificate` | L4 award | level, name | — | |

**L4 totals:** 24 pages · 11 SingleSound · 2 Handwriting · 4 Grammar · Science 0 (candidate: animals, via *Hot Food, Cool Moon* — TO-CONFIRM).

---

### Level 5 — New Spellings · Blue #3B82F6 · Year 1 (5–6)

New GPCs (10): **a-e i-e o-e u-e ea ie oi aw ai oa**. New tricky (14): said, so, have, like, some, come, were, there, little, one, do, when, out, what. Grammar: suffixes with root change, prefix un-, commas in lists, sequencing. Sound buttons now dropping away. Comprehension becomes Core. Grammar content designed in `l3_grammar_spelling_design.md` style (l5 doc TO-BUILD).

| # | strand | template | content summary | data needed | clipart needed (eyes) | notes |
|---|---|---|---|---|---|---|
| 1–3 | Front matter | `BookletCover` / `ContentsPage` / `HowToUse` | L5 cover (blue, mascot `L5.1` = old `L3_1`), index, parent note | level, mascot key | hero old `L3_1_B1` | |
| 4–13 | Phonics | `SingleSound` ×10 | split digraphs a-e,i-e,o-e,u-e + alts ea,ie,oi,aw,ai,oa | per grapheme 5 trace + 4 missing | cake, bike, bone, cube, sea, pie, coin, claw, rain, boat | §3 split-digraph centring uses invisible `TraceLine` segment |
| 14 | Phonics | `SpellingSort` | /ay/ sort across ay, a-e, ai (same sound, different spelling) | 3-bin sort | — | ledger page-2 (L5) |
| 15 | Phonics | `WordLadder` | change one phoneme at a time (cat→cot→got→get) | ladder chain | — | new template |
| 16 | Phonics | `TrickyWords` | 14 new tricky words (sentence completion) | 14 words | — | |
| 17 | Handwriting | `HandwritingCopy` | copy suffix words (-ing, -ed, -er); pre-cursive entry strokes | word set | — | lead-ins on joining letters |
| 18 | Handwriting | `HandwritingCopy` | word ladders written neatly | ladder words | — | |
| 19 | Grammar | `SuffixBuild` | doubling-rule build (hop→hopping, run→running) | 5 roots | — | |
| 20 | Grammar | `PrefixMatch` | prefix un- (kind→unkind, happy→unhappy) | 5 pairs | — | draw-a-line match |
| 21 | Grammar | `CommasInLists` | insert commas in lists | 3 lists | — | |
| 22 | Grammar | `SequenceWriting` | 3-picture sequence: "write using First, Next, Then" | 3-image strip | 3 objects (dot eyes) | ledger page-4 (L5) |
| 23 | Grammar | `Comprehension` | 3–4 literal questions on a short decodable text | text + Qs | 1 scene | book-linked option |
| 24 | Back matter | `ChallengePage` | commas ×2, suffixes ×3, one time-word sentence | mixed | — | ledger page-6 (L5) |
| 25 | Back matter | `Certificate` | L5 award | level, name | — | |

**L5 totals:** 25 pages · 10 SingleSound · 2 Handwriting · 4 Grammar + 1 Comprehension · Science 0.

---

### Level 6 — Building Fluency · Indigo #6366F1 · Y1 post-PSC–Y2 (5–7)

New vowel GPCs (6): **ur er are ow(brown) ew ue**. New consonant alternatives (8): **wr kn ge dge mb gn ph wh**. Word-pool only (no dedicated sheet): oe, au, e-e, c-as-/s/, sc-as-/s/. New tricky (9): oh, their, people, Mr, Mrs, looked, called, asked, could. Grammar: four sentence types, expanded noun phrases, conjunctions, contractions, tense consistency.

| # | strand | template | content summary | data needed | clipart needed (eyes) | notes |
|---|---|---|---|---|---|---|
| 1–3 | Front matter | `BookletCover` / `ContentsPage` / `HowToUse` | L6 cover (indigo, mascot `L6.1` = old `L4_1`), index, note | level, mascot key | hero old `L4_1_B1` | |
| 4–9 | Phonics | `SingleSound` ×6 | vowel alts ur, er, are, ow(brown), ew, ue | per grapheme 5 trace + 4 missing | nurse, fern, hare, owl, screw, glue… **hare/owl = dot eyes** | ow = new "cow" pronunciation sheet |
| 10–17 | Phonics | `SingleSound` ×8 | consonant alts wr, kn, ge, dge, mb, gn, ph, wh | per grapheme 5 trace + 4 missing | wrist, knee, cage, bridge, lamb, gnat, phone, whale… **lamb/gnat/whale = dot eyes** | silent-letter note in instruction |
| 18 | Phonics | `SpellingSort` | /ur/ sort across ir, ur, er | 3-bin sort | — | |
| 19 | Phonics | `ConsonantAltSort` | wr/r, kn/n, ge/dge/j, mb/m, ph/f, wh/w | sort cards | — | |
| 20 | Phonics | `TrickyWords` | 9 new tricky words in context | 9 words | — | alien words LIGHT only at L6 |
| 21 | Handwriting | `HandwritingCopy` | pre-cursive joins (diagonal + horizontal) | join sets | — | |
| 22 | Handwriting | `HandwritingCopy` | copy an expanded noun phrase; write a sentence twice (draft + neat) | 1 phrase + 1 sentence | — | |
| 23 | Grammar | `SentenceTypeSort` | sort statement / question / command / exclamation | 8 cards | — | |
| 24 | Grammar | `ExpandedNounPhrase` | "the ___ ___ cat" with adjective bank | adjective bank + nouns | cat (dot eyes) | |
| 25 | Grammar | `ConjunctionGapFill` | and/but/or/so/when/if/because cloze | 6 sentences | — | |
| 26 | Grammar | `ContractionMatch` | do not↔don't, I am↔I'm; fix tense | 6 pairs | — | |
| 27 | Grammar | `ImproveTheSentence` | "The cat sat." → add adjective/adverb/better verb | 1 weak sentence | cat (dot eyes) | ledger page-4 (L6) |
| 28 | Back matter | `ChallengePage` | identify 4 sentence types; add adjective ×3; fix 2 contractions | mixed | — | |
| 29 | Back matter | `Certificate` | L6 award | level, name | — | |

**L6 totals:** 29 pages · 14 SingleSound · 2 Handwriting · 5 Grammar · Science 0.

---

### Level 7 — Reading Together · Purple #8B5CF6 · Year 2 (6–7)

New GPCs (6 trigraphs/complex): **ire ore ear oor ure tion**. Tricky/CEW: Y2 first set (door, floor, poor, because, find, kind, mind, behind, child, children, wild, climb, most, only, both, old, cold, gold, hold, told, every, even, great, break, steak, pretty, beautiful, after, fast, last, past, father, class, grass, pass, plant, path, bath). Grammar: possessive apostrophes, time adverbials, recount structure, homophones. Alien words RETIRED. Handwriting content-led (joined).

| # | strand | template | content summary | data needed | clipart needed (eyes) | notes |
|---|---|---|---|---|---|---|
| 1–3 | Front matter | `BookletCover` / `ContentsPage` / `HowToUse` | L7 cover (purple, mascot `L7.1` = old `L5_1`), index, note | level, mascot key | hero old `L5_1_B1` | |
| 4–9 | Phonics | `SingleSound` ×6 | ire, ore, ear, oor, ure, tion | per grapheme 5 trace + 4 missing | fire, shore, ear, door, sure, station | `tion` taught as unit; longer words |
| 10 | Phonics | `SuffixTransform` | run→running, hop→hopped, happy→happier (doubling / drop-e / y→i) | root sets | — | Phase 6 morphology intro |
| 11 | Phonics | `CEWSpellingTest` | Y2 CEW list (first set) look/cover/write/check | CEW set | — | replaces tricky-word card |
| 12 | Handwriting | `HandwritingCopy` | copy vocabulary list in joined writing | word list | — | content-led |
| 13 | Handwriting | `HandwritingCopy` | copy a short proverb / passage (joined) | 1 passage | — | |
| 14 | Grammar | `ApostropheInsert` | possessive apostrophe insert (the dog's bone) | 5 sentences | dog (dot eyes) | |
| 15 | Grammar | `HomophoneChoose` | there/their/they're, here/hear, see/sea cloze | 6 gaps | — | |
| 16 | Grammar | `TimeAdverbialStrip` | 4-box comic ordered with First/Next/Then/Finally | 4-box strip | 4 scenes | |
| 17 | Grammar | `GenreFrameRecount` | templated recount page (RWI Get Writing) | sentence starters | 1 scene | ledger page-4 (L7) |
| 18 | Grammar | `Comprehension` | literal + inferential + vocabulary-in-context Qs | text + Qs | 1 scene | |
| 19 | Back matter | `ChallengePage` | fix apostrophes ×3; homophone ×3; 3-sentence recount | mixed | — | |
| 20 | Back matter | `Certificate` | L7 award | level, name | — | |

**L7 totals:** 20 pages · 6 SingleSound · 2 Handwriting · 4 Grammar + 1 Comprehension · Science 0 (candidate: habitats — TO-CONFIRM).

---

### Level 8 — Reading Champion · Teal #14B8A6 · Y2–Y3 readiness (6–8)

No new single-grapheme code — **suffix morphology**: **-ous, -cious, -tious, -able, -ible** (taught as spelling-pattern sheets, not letter-trace SingleSound). Remaining Y2 CEWs. Grammar: fronted adverbials, speech punctuation, sentence variety, proofreading/editing. Tricky words retrieval only.

| # | strand | template | content summary | data needed | clipart needed (eyes) | notes |
|---|---|---|---|---|---|---|
| 1–3 | Front matter | `BookletCover` / `ContentsPage` / `HowToUse` | L8 cover (teal, mascot `L8.1` = old `L6_1`), index, note | level, mascot key | hero old `L6_1_B1` | |
| 4–8 | Phonics | `SuffixSpelling` ×5 | one sheet per suffix: -ous, -cious, -tious, -able, -ible | per suffix: word family + build + read | — | NOT SingleSound; pattern/word-build sheet |
| 9 | Phonics | `WordFamilyTree` | -tion / -sion / -cian family tree | family sets | — | ledger page-2 (L8) |
| 10 | Phonics | `CEWSpellingTest` | remaining Y2 CEWs to mastery | CEW set | — | |
| 11 | Handwriting | `HandwritingCopy` | copy-and-improve: rewrite a paragraph with corrections | 1 paragraph | — | purple-pen editing convention |
| 12 | Handwriting | `HandwritingCopy` | neat final-draft presentation | 1 passage | — | joined, content-led |
| 13 | Grammar | `FrontedAdverbialFlip` | move adverbial to front + add comma | 5 sentences | — | |
| 14 | Grammar | `SpeechMarksInsert` | add inverted commas to dialogue | 4 lines | — | Y3 prep |
| 15 | Grammar | `SentenceVarietyBank` | rewrite one sentence 4 ways (opener variety) | 1 base sentence | — | |
| 16 | Grammar | `PossessiveSort` | singular vs plural possessive sort | 8 cards | — | |
| 17 | Grammar | `Comprehension` | literal, inferential, summarising, prediction | text + Qs | 1 scene | |
| 18 | Back matter | `ProofreadChallenge` | paragraph with 5 deliberate errors; fronted-adverbial rewrite; speech marks ×2 | error paragraph | — | ledger page-6 (L8) |
| 19 | Back matter | `Certificate` | L8 award + "Ready for Year 3" | level, name | — | |

**L8 totals:** 19 pages · 5 SuffixSpelling (phonics) · 2 Handwriting · 4 Grammar + 1 Comprehension · Science 0.

---

### Per-level page-count summary

| Level | Colour | New GPC sheets | Total pages | Science |
|---|---|---|---|---|
| L1 Ditties | Pink | 10 SingleSound | 21 | 0 (flagged) |
| L2 First Sounds | Coral | 19 SingleSound | 31 | 0 |
| L3 Special Friends | Amber | 7 SingleSound | 20 | 0 |
| L4 Longer Sounds | Green | 11 SingleSound | 24 | 0 (animals?) |
| L5 New Spellings | Blue | 10 SingleSound | 25 | 0 |
| L6 Building Fluency | Indigo | 14 SingleSound | 29 | 0 |
| L7 Reading Together | Purple | 6 SingleSound | 20 | 0 (habitats?) |
| L8 Reading Champion | Teal | 5 SuffixSpelling | 19 | 0 |
| **Total** | | **72 SingleSound + 5 Suffix** | **189 pages** | |

---

## B. Template back-log

All templates obey the locked spec: fixed A4 210×297 mm, 6 mm outer margin, content fills ~96% of height, inline section headers (no boxed headings), boxless trace sections, Andika font, `getLevelTheme(level)` colour, `TraceLine` for all guidelines, `Clipart` (fill + multiply) for images. mm regions below follow the as-built `SingleSound` grid (Header 6,26 · body bands · Footer 285,7).

| Template | Purpose | Layout sketch (mm, A4 210×297, margin 6) | Schema fields | Status · priority |
|---|---|---|---|---|
| `SingleSound` | One grapheme: trace letter, trace words, write missing sound | Header y6 h26 (mascot tile 17² + title + level/strand pills); §1 Trace letter y36 h48 (1 model + 4 trace + blank, `TraceLine`); §2 Trace words y88 h134 (rows: image 16–20% / trace 38–42% / blank 38–42%); §3 Missing sound y226 h56 (image + `TraceLine` word with invisible target segment); Footer y285 h7 | `SoundSheetData` (id, grapheme, phoneme, level, levelLabel, characterImageKey, strand, traceWords[], missingWords[]) | **EXISTS (LOCKED master)** · — |
| `BookletCover` | Per-level cover: colour field, level name, book mascot scene | Full-bleed level-colour band top ~120; centred title (Outfit/heading); mascot badge ~40²; subtitle "Worksheet Pack"; footer brand | level, name, mascotKey, coverImageKey | TO-BUILD · P0 |
| `ContentsPage` | Numbered index of the pack | Header band; two-column list page#→title with strand chips | entries[]{page,title,strand} | TO-BUILD · P0 |
| `HowToUse` | Parent note + "Say it. Tap it. Write it. Check it." | Header; 3–4 short prose blocks; routine strip | static copy, level | TO-BUILD · P1 |
| `Certificate` | End-of-pack award | Decorative border (level colour); name line `TraceLine`; level + date | level, name | TO-BUILD · P1 |
| `HandwritingCopy` | Joining/fluency/copy progression (every level) | Header; instruction; 3–6 `TraceLine` rows (model + trace + blank), x-height shrinks by level | level, mode(pattern\|letters\|caption\|sentence\|join\|paragraph), modelText[], xHeightMm | TO-BUILD · P0 |
| `SoundMat` | Reference GPC chart (L1–L4) | Header; grid of grapheme tiles + cue image (no writing) | level, tiles[]{grapheme,imageKey} | TO-BUILD · P1 |
| `TrickyWords` | Tricky-word trace/read/LCWC | Header; word rows with `TraceLine`; rainbow-trace or look-cover-write-check grid | level, words[], mode | TO-BUILD · P0 |
| `SpellingSort` | Sort words into 2–3 sound bins | Header; instruction; labelled bins + word cards | level, bins[]{label}, words[]{text,bin} | TO-BUILD · P1 |
| `BlendingDrill` | Adjacent-consonant clusters + alien words (L3) | Header; cluster table; alien-word row (PSC format) | level, clusters[], alienWords[] | TO-BUILD · P1 |
| `ConsonantAltSort` | wr/r, kn/n, ph/f… alternative sort (L6) | Header; multi-column sort | level, columns[], words[] | TO-BUILD · P2 |
| `WordLadder` | Change one phoneme at a time (L5) | Header; vertical ladder of `TraceLine` rungs | level, chain[] | TO-BUILD · P2 |
| `SuffixBuild` / `SuffixTransform` | Root + suffix with doubling/drop-e/y→i (L5,L7) | Header; root → rule → built-word columns, `TraceLine` answer | level, roots[]{root,suffix,rule,answer} | TO-BUILD · P1 |
| `SuffixSpelling` | L8 suffix word-family sheet (replaces SingleSound at L8) | Header; suffix focus; word-family read + build + write rows | level, suffix, words[] | TO-BUILD · P1 |
| `WordFamilyTree` | -tion/-sion/-cian families (L8) | Header; branching tree graphic + write slots | level, families[] | TO-BUILD · P2 |
| `PrefixMatch` / `ContractionMatch` / `HomophoneChoose` | Draw-a-line / cloze pairs | Header; two columns + connector space, or cloze lines | level, pairs[] or gaps[] | TO-BUILD · P1 |
| `CommasInLists` / `InsertMissing` / `ApostropheInsert` / `SpeechMarksInsert` | Insert-the-missing punctuation | Header; sentence list with insertion gaps | level, sentences[] | TO-BUILD · P1 |
| `TickTheCorrect` / `ThreeWayEndMark` | Tick-one-of-four / choose . ? ! | Header; sentence + option boxes | level, items[]{sentence,options,answer} | TO-BUILD · P1 |
| `CutAndSort` / `SentenceTypeSort` / `PossessiveSort` / `QuestionOrStatement` | Cut-and-sort into labelled columns | Header; columns + cards (dashed cut lines) | level, columns[], cards[] | TO-BUILD · P1 |
| `JoinWithAnd` / `ConjunctionGapFill` | Coordinate/subordinate clause joins | Header; clause pairs + join line, or cloze | level, pairs[]/sentences[] | TO-BUILD · P1 |
| `ExpandedNounPhrase` / `ImproveTheSentence` / `SentenceVarietyBank` / `FrontedAdverbialFlip` | Build/improve sentences | Header; base text + word bank + `TraceLine` write space | level, base, bank[] | TO-BUILD · P1 |
| `HoldASentence` / `SentenceFromPicture` / `SentenceFromTwoPictures` / `FinishTheSentence` / `SequenceWriting` / `GenreFrameRecount` | "Say it…write it" sentence writing (every level) | Header; picture prompt(s) + caption/starter + `TraceLine` writing lines | level, prompts[]{imageKey,caption}, lines | TO-BUILD · P0 |
| `MatchPictureWord` | Match picture ↔ word/caption | Header; pictures column ↔ words column + connector | level, pairs[]{imageKey,word} | **EXISTS-draft** · P2 (QA vs spec) |
| `Comprehension` | Read short text + answer questions | Header; decodable passage panel; 3–5 question lines | level, passage, questions[] | TO-BUILD · P1 |
| `PluralMatch` | Singular→plural -s/-es | Header; pair rows + `TraceLine` | level, pairs[] | TO-BUILD · P2 |
| `CEWSpellingTest` | Y2 CEW look-cover-write-check (L7,L8) | Header; LCWC grid | level, words[] | TO-BUILD · P2 |
| `TimeAdverbialStrip` | 4-box recount comic | Header; 4 panels + connector words + write lines | level, panels[] | TO-BUILD · P2 |
| `QuickCheck` / `ChallengePage` / `ProofreadChallenge` | End-of-pack mixed review | Header; 3 mixed mini-tasks (level-scaled) | level, tasks[] | TO-BUILD · P1 |

**Existing engine templates to reconcile (already in `src/components/templates/`):** `Challenge`, `CutAndStick`, `DrawAndWrite`, `MissingSound`, `ReadAndTick`, `SentenceBuilder`, `SortBySound`, `SoundSpotting`, `TraceSounds`. These are **drafts** predating the locked `sound_a` master. Before reuse each must pass `worksheet_visual_qa_checklist.md` and adopt the locked rules (Andika via `TraceLine`, `getLevelTheme`, inline headers, boxless trace, 96% fill). Map: `SortBySound`→`SpellingSort`/`CutAndSort`; `ReadAndTick`→`TickTheCorrect`; `SentenceBuilder`→sentence-writing family; `DrawAndWrite`→book-linked draw/label; `TraceSounds`/`MissingSound` are subsumed by `SingleSound`. **Do not redesign `SingleSound`.**

---

## C. Asset / clipart list (de-duplicated)

**Style rules for every asset (from spec + brief):** flat single-object clipart, pure-white background (rendered `mix-blend: multiply` on white cards), trimmed tight by `scripts/trim-clipart.mjs`, object 65–80% of card, Andika-era friendly flat style. **Creatures use the locked eye style: small solid pure-black round dot eyes — never large/wide eyes, no white shines, no coloured irises.** Generate clipart via `scripts/generate-clipart.mjs` (Vertex); header mascots via `scripts/generate-mascot.mjs`.

**Already in `worksheet-engine/public/clipart/` (13):** ant*, axe, bag, cat*, hat, jam, mat, pan, pin, rat*, tap, tin, tap-mascot (\* = creature, eyes already locked). `_raw/` holds untrimmed sources.

**Mascots needed (one per booklet cover, from book heroes):** L1.1, L2.1, L3.1, L4.1, L5.1, L6.1, L7.1, L8.1 — sourced from `output/images/L{old}_{sub}_B1/hero_reference.png` via the old→new map (§0.4). All are characters → **dot eyes** (already correct in book art; confirm on import).

**New clipart to generate, grouped by level (representative key words; full set = the trace/missing words per `SingleSound` sheet).** Creatures flagged.

- **L1 (SATPIN+MDGO words):** sun, tap, pin, net, pot, mop, dig, nap, tin, mat + creatures: **ant, cat, dog, pig, rat, hen** (dot eyes). ~16 new.
- **L2 (single letters + doubles):** cup, kit, web, jet, leg, van, wig, box, bus, bell, doll, kiss, huff + creatures: **fox, duck, yak, ox, cub** (dot eyes). ~18 new.
- **L3 (digraphs):** ship, shell, chip, chop, bath, ring, king, quiz, buzz, bank + creatures: **fish, moth, chick** (dot eyes). ~13 new.
- **L4 (Set 2 vowels):** tray, hay, week, feet, light, night, snow, boat?, zoo, book, car, star, fork, corn, chair, hair, bird, shirt, cloud, mouth, boy, toy + creatures: **bee, owl, goat?, cow** (dot eyes). ~22 new.
- **L5 (split digraphs + alts):** cake, gate, bike, kite, bone, rope, cube, tube, sea, leaf, pie, tie, coin, claw, rain, train, boat, coat + creatures: **snake, mole, seal** (dot eyes). ~21 new.
- **L6 (vowel + consonant alts):** nurse, fern, hare, screw, glue, wrist, knee, cage, bridge, fridge, phone, graph, wheel, whisk + creatures: **owl, lamb, gnat, whale, snail** (dot eyes). ~19 new.
- **L7 (trigraphs):** fire, wire, shore, store, ear, door, floor, sure, station, lotion + creatures: **deer** (dot eyes). ~11 new.
- **L8 (suffix words, abstract — fewer objects):** mountain, ocean, station, table, apple + scene art for comprehension. ~5 new + scenes.

**Approx new clipart volume:** ~125 single-object images + 8 cover mascots + ~6 comprehension scenes. **De-dup rule:** a word reused across levels (e.g. `boat` L4/L5) is generated once and shared. Maintain one flat `public/clipart/<word>.png` namespace; never regenerate an existing key.

---

## D. Recommended build order

1. **Unblock data first (not a template).** Remap the 8-level data per `EIGHT_LEVEL_MIGRATION_PROMPT.md` (graphemes/tricky words/book catalog/Python files) so templates read correct per-level content. Without this, page content is wrong. Confirm the **Science decision** (§A0) and the **Drive PDF re-export** (§0.1).
2. **P0 shell templates** (used in every pack, every level): `BookletCover`, `ContentsPage`, `HandwritingCopy`, `TrickyWords`, the sentence-writing family (`HoldASentence` → `SentenceFromPicture` → `GenreFrameRecount`). These plus the existing `SingleSound` make a complete L1 pack end-to-end.
3. **Pilot L1 fully** (cover → 10 SingleSound → handwriting → grammar → certificate), run `scripts/generate-pdf.mjs`, pass `worksheet_visual_qa_checklist.md`. L1 is the smallest complete vertical slice and validates the booklet frame.
4. **Generate L1–L3 clipart** (the heaviest creature load) via `generate-clipart.mjs`, trim via `trim-clipart.mjs`, verify dot-eye rule on every creature.
5. **P1 grammar/spelling templates**, sequenced by level demand: L2–L4 first (`TickTheCorrect`, `InsertMissing`, `JoinWithAnd`, `ThreeWayEndMark`, `SpellingSort`, `BlendingDrill`), using the ready content in `l3_/l4_grammar_spelling_design.md`. Author the missing L1, L2, L5–L8 grammar/spelling design docs in the same JSON shape before building those.
6. **Build L2 → L3 → L4 packs**, reusing templates; each new level mostly adds data, not new templates.
7. **P1/P2 upper-level templates** (`SuffixSpelling`, `SuffixTransform`, `Comprehension`, `ApostropheInsert`, `HomophoneChoose`, `SentenceTypeSort`, `FrontedAdverbialFlip`, `ProofreadChallenge`) for L5–L8; build L5 → L8 packs.
8. **Reconcile draft templates** (`SortBySound`, `ReadAndTick`, `SentenceBuilder`, etc.) against the locked spec, or retire them in favour of the new builds.
9. **Cross-level QA pass:** run the audit checklist (decodable rule, grammar ≤ writing track, no alien words past L6, sentence-length bands, colour-per-level via `getLevelTheme`, every guideline via `TraceLine`, every creature dot-eyed, British English). Use a verification subagent for the decodable-word audit.

**Critical-path templates to build next (the four that unlock the most pages):** `HandwritingCopy`, `TrickyWords`, the sentence-writing family, and `BookletCover`/`ContentsPage` — together with the existing `SingleSound` they complete every L1–L4 pack.

