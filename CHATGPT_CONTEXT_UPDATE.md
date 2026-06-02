# Context Update for ChatGPT — MyPhonicsBooks Learning Journey

You previously produced a Learning Journey plan for MyPhonicsBooks. This document corrects several assumptions, fills in missing context and adds decisions made since your original plan. Please reiterate your pathway plan with these corrections applied.

---

## 1. Corrections to your original plan

### 1a. The block structure is not always Sound Books → Blending Book → Storybook

You presented every block as a clean three-step pattern. The actual teaching sequence is more nuanced:

- Some storybooks depend directly on Sound Books without a Blending Book in between. For example, in L4 "Moo at the Zoo" depends directly on the ow and oo Sound Books. There is no Blending Book between them. Blending Book 9 comes after Moo at the Zoo.
- From L6 onwards there are NO Blending Books at all. Children blend in context inside the storybooks. Your generic "Block structure" template implies every level has all three book types. It does not.

The pathway visual must handle levels without Blending Books cleanly, not just footnote it.

### 1b. Assessment places at a level, not at a specific step within a level

You said the system should place a child at a "Level, Block and exact next step" (e.g. "Sound Book: sh"). The current assessment places at a LEVEL only. A nextStep() function can determine the next resource within that level, but only if you know which steps are already completed. For a brand new child, the assessment says "you are L3" and the system starts them at step 1 of L3.

Placing within a block (e.g. "you know sh and ch but not th") would require per-GPC assessment, which does not exist yet. So "exact next step" placement within a level is aspirational, not current.

### 1c. The storybooks already contain built-in practice

You treated worksheets as a separate step after the storybook. But each 16-page storybook already includes:

- A combined activity page (comprehension questions, "Can You Read?" word list, "Draw Your Favourite Part")
- A writing practice page (4-line handwriting)
- A nonsense words challenge page (Phonics Screening Check preparation)

The interactive digital versions add even more:

- Spelling drag-and-drop
- Story ordering (drag images into correct sequence)
- Multiple-choice comprehension quiz
- Grammar word-order activity (drag words to build sentences, from L2+)
- Sound spotlight with tappable words and phoneme breakdowns

So the "Practise" step partly already happens INSIDE the storybook. The separate worksheet packs add additional practice (sound hunt, trace/write, sound sort) but a child who finishes the storybook has already done meaningful practice. The pathway should show in-book activities and worksheet packs as related but distinct.

### 1d. "Mini-checks" and "checkpoints" after every block are wrong

You suggested mini-assessments after each block. This would be exhausting for the child and the teacher and is not how schools work.

The teacher already knows whether a child is keeping up because they are listening to them read the Blending Book and the Storybook. The reading IS the check. Teacher judgment at block boundaries is enough. Formal assessment happens at level boundaries and during whole-school assessment windows (see section 2 below).

### 1e. The child-facing gamification layer does not exist

Sound Stars, Blend Badges, Story Keys — none of this is built. The interactive books have a certificate page at the end of each book, but there is no progress tracking, no unlocking, no badge system. It is a good idea for the future but it is new scope, not something to present as part of the current product.

### 1f. You missed the Open Window philosophy

Every storybook features a child from a different contemporary culture. This is a core differentiator. "The Fish in the Tank" has a British-Asian girl, each book is a window into a different community. For international schools (Saudi Arabia, Pakistan, Gulf states), this is a major selling point. The books show diversity without tokenising anyone.

### 1g. You missed that Sound Books use real photographs

Sound Books use real photographs from Pexels (API-sourced, high-quality). Storybooks use AI-generated watercolour-style illustrations. The pathway visual should distinguish these: Sound Books = real photos, Blending Books = illustrated word-then-picture reveal format, Storybooks = fully illustrated narratives with consistent characters.

### 1h. Review storybooks have special dependency logic

Review books (The Night Fair at L4, A Place for Me at L7, The Incredible Bush Walk at L8) depend on EVERY other storybook in the level being completed first. They are the level gate and consolidation read, not just another step. The pathway needs to show them as the final checkpoint before level-up.

### 1i. The interactive book features are richer than you assumed

You mentioned "interactive versions" but underestimated what they contain. Each interactive book has:

- Tappable words with phoneme pop-ups and audio
- Vocabulary preview before reading
- Sound spotlight pages (with dual-variant columns at L5+ for graphemes with multiple sounds, e.g. "ure" as /yoor/ vs /er/)
- Drag-to-spell activities
- Drag-to-order story sequencing
- Multiple-choice comprehension quiz
- Grammar word-order activities (from L2+)
- Writing practice
- Nonsense words challenge
- Reading Star certificate

This is a full digital practice session, not just a "read on screen" version.

### 1j. SchoolPathway.tsx already exists

You suggested building a "Learning Journey" page from scratch. A SchoolPathway component already exists showing the exact teaching sequence per level with dependency chains and a "mark as complete to unlock next step" toggle. It just needs wiring into the app routing.

---

## 2. Assessment windows — how schools actually assess

We discussed this after your original plan. The correct model is NOT "assess after each book" or "assess whenever you feel like it". Schools run structured assessment windows.

### The rhythm

**Half-termly assessment windows** — every 6 weeks, the whole school runs assessments in the same week. Every child gets assessed, every class gets regrouped, and the phonics lead sees the full picture.

### How it works

1. **Phonics lead sets an assessment window** — e.g. "Spring 1 Assessment: week of 24 February". All teachers see it on their dashboard.
2. **During the window** — teachers run the quick screener or full assessment on each child. The dashboard shows progress: "Year 1 Willow: 22/28 assessed, 6 remaining".
3. **After the window closes** — the platform shows results across the whole school. Children are automatically grouped by level. The phonics lead can see who needs moving up, who is stuck, who needs intervention. Classes can be regrouped across year groups if needed (a strong Reception child joining a Year 1 group, a struggling Year 1 child dropping back).
4. **Between windows** — teachers teach through the blocks using teacher judgment. No formal assessment until the next window in 6 weeks.

### This gives you

- 6 assessment points per year (one per half-term)
- Whole-school data at each point for the phonics lead and SLT
- Cross-class grouping decisions made together, not in isolation
- A clear cycle: assess → group → teach → reassess
- Before/after comparison at each window

### What this means for the pathway

The pathway cycle is NOT: Assess → Learn → Blend → Read → Practise → Reassess (per child, per book)

The pathway cycle IS:

**Whole-school assessment window → Phonics lead regroups → Teachers teach through blocks using teacher judgment → Next assessment window**

Within a level, the teacher moves through the blocks using their professional judgment about when a child is ready. They do not need formal checkpoints between blocks. They listen to the child read and decide.

Formal assessment happens:
- On entry (initial placement)
- At each half-termly assessment window (whole school, same week)
- Ad hoc if a teacher thinks a child is stuck or has jumped ahead

---

## 3. Levels vary in size — blocks are the management unit

The levels are not all the same size:

| Level | Name | Sound Books | Blending Books | Storybooks | Total Steps |
|-------|------|-------------|----------------|------------|-------------|
| L1 | Ditties | 10 | 2 | 2 | 14 |
| L2 | First Sounds | 15 | 3 | 5 | 23 |
| L3 | Special Friends | 6 | 2 | 3 | 11 |
| L4 | Longer Sounds | 12 | 3 | 6 | 21 |
| L5 | New Spellings | 10 | 2 | 5 | 17 |
| L6 | Building Fluency | 9 | 0 | 4 | 13 |
| L7 | Reading Together | 6 | 0 | 4 | 10 |
| L8 | Reading Champion | 5 | 0 | 4 | 9 |

L2 has 23 steps. L8 has 9. A child could be on L2 for half a term while L8 flies past in a week.

The blocks within each level are the natural management unit:

- L2 has 3 blocks: c/k/ck/e/u/r/h/b block, f/l/doubles block, j/v/w/x/y/z block
- L4 has 3 blocks + review: ay/ee/igh, then ow/oo/ar/or, then air/ir/ou/oy, then review
- L7 has 3 blocks + review: ire/ore, then ear/oor, then ure/tion, then review

The dashboard should show progress by block within a level, not just "child is on L2". Something like: "Aisha — L2 First Sounds — Block 2 of 3 (f, l, doubles)". That way a teacher running L2 across half a term can see where each child actually is.

---

## 4. The actual teaching sequences (use these, not your simplified versions)

These are the exact sequences with real dependency chains. Some storybooks come before Blending Books. Some depend on specific Sound Books, not on a Blending Book.

### L1 — Ditties (14 steps, 2 blocks)

**Block 1: s a t p i n**
1. Sound Book: s
2. Sound Book: a
3. Sound Book: t
4. Sound Book: p
5. Sound Book: i
6. Sound Book: n
7. Blending Book 1 — s a t p (requires Sound Books 1–6)
8. Storybook: Tap! Tap! Tap! (requires Blending Book 1)

**Block 2: m d g o**
9. Sound Book: m
10. Sound Book: d
11. Sound Book: g
12. Sound Book: o
13. Blending Book 2 — SATPIN + MDGO (requires Sound Books 9–12)
14. Storybook: The Mud on the Dog (requires Blending Book 2)

### L2 — First Sounds (23 steps, 3 blocks)

**Block 1: c k ck e u r h b**
1. Sound Book: c
2. Sound Book: k
3. Sound Book: ck (requires c + k)
4. Sound Book: e
5. Sound Book: u
6. Sound Book: r
7. Sound Book: h
8. Sound Book: b
9. Blending Book 3 (requires Sound Books 1–8)
10. Storybook: The Red Socks (requires Blending Book 3)
11. Storybook: Run, Pup, Run! (requires Blending Book 3)

**Block 2: f l ff ll ss zz**
12. Sound Book: f
13. Sound Book: l
14. Sound Book: ff + ll (requires f + l)
15. Sound Book: ss + zz
16. Blending Book 5 (requires Sound Books 14–15)
17. Storybook: Fox Fell Off! (requires Blending Book 5)

**Block 3: j v w x y z**
18. Sound Book: j
19. Sound Book: v + w
20. Sound Book: x + y + z
21. Blending Book 4 (requires Sound Books 12–13, 18–20)
22. Storybook: The Jam Jug (requires Blending Book 4)
23. Storybook: The Yak and the Box (requires Blending Book 4)

### L3 — Special Friends (11 steps, 2 blocks)

**Block 1: sh nk ch th**
1. Sound Book: sh
2. Sound Book: nk
3. Sound Book: ch
4. Sound Book: th
5. Blending Book 6 — sh ch th (requires Sound Books 1, 3, 4)
6. Storybook: The Fish in the Tank (requires Blending Book 6 + nk Sound Book)
7. Storybook: Chop, Chop, Chop! (requires Blending Book 6)

**Block 2: ng qu**
8. Sound Book: ng
9. Sound Book: qu
10. Blending Book 7 — nk ng qu (requires Sound Books 2, 8, 9)
11. Storybook: Buzz and Sing! (requires Blending Book 7)

### L4 — Longer Sounds (21 steps, 3 blocks + review)

**Block 1: ay ee igh**
1. Sound Book: ay
2. Sound Book: ee
3. Sound Book: igh
4. Blending Book 8 (requires Sound Books 1–3)
5. Storybook: The Night Light (requires Blending Book 8)

**Block 2: ow oo ar or**
6. Sound Book: ow (blow)
7. Sound Book: oo (zoo)
8. Sound Book: oo (look)
9. Storybook: Moo at the Zoo (requires Sound Books 6–8 directly, NO Blending Book)
10. Sound Book: ar
11. Sound Book: or
12. Blending Book 9 (requires Sound Books 6–8, 10–11)
13. Storybook: Morning on the Farm (requires Blending Book 9)

**Block 3: air ir ou oy**
14. Sound Book: air
15. Sound Book: ir
16. Storybook: The Fair in the Air (requires Sound Books 14–15 directly, NO Blending Book)
17. Sound Book: ou
18. Sound Book: oy
19. Blending Book 10 (requires Sound Books 14–15, 17–18)
20. Storybook: Round and Round (requires Blending Book 10)

**Review**
21. Storybook: The Night Fair (REVIEW — requires ALL L4 storybooks completed)

### L5 — New Spellings (17 steps, 3 blocks)

**Block 1: split digraphs**
1. Sound Book: a-e
2. Sound Book: i-e
3. Sound Book: o-e
4. Sound Book: u-e
5. Blending Book 11 (requires Sound Books 1–4)
6. Storybook: The Big Bike Race (requires Blending Book 11)
7. Storybook: Lost at the Night Market (requires Blending Book 11)

**Block 2: ea ie**
8. Sound Book: ea
9. Sound Book: ie
10. Storybook: The Dream Team (requires Sound Books 8–9 directly)

**Block 3: oi aw ai oa**
11. Sound Book: oi
12. Sound Book: aw
13. Sound Book: ai
14. Sound Book: oa
15. Blending Book 12 (requires Sound Books 8–14)
16. Storybook: What Min Saw (requires Sound Books 11–12)
17. Storybook: The Boat with the Red Sail (requires Sound Books 13–14)

### L6 — Building Fluency (13 steps, 3 blocks + extension, NO Blending Books)

**Block 1: ur er**
1. Sound Book: ur
2. Sound Book: er
3. Storybook: The Purple Purse (requires Sound Books 1–2)

**Block 2: are ow(brown)**
4. Sound Book: are
5. Sound Book: ow (brown)
6. Storybook: The Brown Owl (requires Sound Books 4–5)

**Block 3: ew ue**
7. Sound Book: ew + ue
8. Storybook: The New Glue (requires Sound Book 7)

**Extension (silent letters)**
9. Sound Book: wr + kn
10. Sound Book: ge + dge
11. Sound Book: mb + gn
12. Sound Book: ph + wh

**Review**
13. Storybook: The Cheeky Monkey (requires Sound Books 1–2, 4–5, 7)

### L7 — Reading Together (10 steps, 3 blocks + review, NO Blending Books)

**Block 1: ire ore**
1. Sound Book: ire
2. Sound Book: ore
3. Storybook: Before the Shore (requires Sound Books 1–2)

**Block 2: ear oor**
4. Sound Book: ear
5. Sound Book: oor
6. Storybook: Near the Door (requires Sound Books 4–5)

**Block 3: ure tion**
7. Sound Book: ure
8. Sound Book: tion
9. Storybook: Sure She Can! (requires Sound Books 7–8)

**Review**
10. Storybook: A Place for Me (REVIEW — requires ALL L7 storybooks)

### L8 — Reading Champion (9 steps, 3 blocks + review, NO Blending Books)

**Block 1: -ous**
1. Sound Book: -ous
2. Storybook: The Marvellous Neighbourhood (requires Sound Book 1)

**Block 2: -cious -tious**
3. Sound Book: -cious
4. Sound Book: -tious
5. Storybook: It Looks Suspicious! (requires Sound Books 3–4)

**Block 3: -able -ible**
6. Sound Book: -able
7. Sound Book: -ible
8. Storybook: You Are Remarkable (requires Sound Books 6–7)

**Review**
9. Storybook: The Incredible Bush Walk (REVIEW — requires ALL L8 storybooks)

---

## 5. The correct pathway cycle

Do NOT use: Assess → Learn → Blend → Read → Practise → Reassess (per child, per book)

DO use this:

### Whole-school cycle (half-termly)
**Assessment Window → Regroup → Teach Blocks → Next Assessment Window**

### Within a level (teacher-led, no formal assessment)
**Sound Books → Blending Book (if available at this level) → Storybook (with built-in activities) → Worksheet pack → Teacher judges readiness → Next block**

### The core product promise
Every child is placed by assessment into a precise 118-step teaching pathway. They learn each sound through a real-photo Sound Book, practise blending through a Blending Book (L1–L5), read it in a matched illustrated storybook, complete practice activities both inside the book and in linked worksheets, and are reassessed at the next whole-school assessment window. The platform shows the teacher exactly where each child is and what resource to use next.

---

## 6. Additional context for your revised plan

### The font
All books use Andika (SIL International) — a font designed for literacy with single-storey "a" and "g" for beginning readers.

### British English throughout
colour, organised, mum, favourite, practise (verb). No Oxford commas. No em dashes.

### Target market for this plan
International schools in Saudi Arabia, Pakistan and the Gulf states. These schools follow the British National Curriculum. They do not need DfE validation. They care about British curriculum alignment, quality of resources and practical usability.

### The programme is NOT Read Write Inc
MyPhonicsBooks is based on Letters and Sounds (public domain), not Read Write Inc (commercial, trademarked). Own terminology, own levels, own structure. Do not reference RWI in any school-facing materials.

### The characters have small solid black dot eyes
All illustrated characters across all storybooks must have small simple oval eyes with solid dark fill. Never "big eyes" or "wide eyes". This is a non-negotiable art direction rule.

### Each storybook features a child from a different culture
This is the "Open Window" philosophy. Every book is a window into a different contemporary culture. This is a key differentiator for international schools.

---

## 7. What to do now

Please reiterate your Learning Journey plan with all of the above corrections and context applied. Specifically:

1. Fix the block structures to match the actual teaching sequences (not all blocks have Blending Books, some storybooks come before Blending Books)
2. Remove mini-checks/checkpoints from between blocks — replace with teacher judgment
3. Add the half-termly whole-school assessment window model
4. Show progress by block within a level (e.g. "Block 2 of 3")
5. Acknowledge that gamification (stars, badges, keys) is future scope, not current
6. Include the Open Window cultural diversity as a selling point
7. Distinguish between Sound Books (real photos), Blending Books (illustrated word-reveal) and Storybooks (illustrated narratives)
8. Show the correct pathway cycle: Assessment Window → Regroup → Teach Blocks → Next Window
9. Show the storybook's built-in activities as part of the practice step, with worksheets as additional reinforcement
10. Handle review storybooks as level gates (depend on all other storybooks in the level)
