# MyPhonicsBooks -- The Complete Guide

**Version:** 1.0 | **Date:** February 2026 | **Author:** MyPhonicsBooks Team

---

## Table of Contents

1. [What Is MyPhonicsBooks?](#1-what-is-myphonicsbooks)
2. [The Problem We Solve](#2-the-problem-we-solve)
3. [The Product](#3-the-product)
4. [The Non-Negotiable Constraint](#4-the-non-negotiable-constraint)
5. [Phonics Education Background](#5-phonics-education-background)
6. [Our 6 Reading Levels -- Complete Breakdown](#6-our-6-reading-levels)
7. [All 30 Stories](#7-all-30-stories)
8. [Book Design and Structure](#8-book-design-and-structure)
9. [10 Story Templates](#9-10-story-templates)
10. [The Technical Pipeline](#10-the-technical-pipeline)
11. [Assessment and Level-Finding](#11-assessment-and-level-finding)
12. [Marketing Strategy](#12-marketing-strategy)
13. [The Funnel -- Awareness to Retention](#13-the-funnel)
14. [Brand Identity and Voice](#14-brand-identity-and-voice)
15. [Visual Design System](#15-visual-design-system)
16. [Pricing Strategy](#16-pricing-strategy)
17. [Legal and Compliance](#17-legal-and-compliance)
18. [Current State and Roadmap](#18-current-state-and-roadmap)

---

## 1. What Is MyPhonicsBooks?

MyPhonicsBooks creates **decodable, phonics-structured reading books** for children aged 4-8. Each book is set in a different contemporary culture — an **open window** for children to see the world. The system generates a **print-ready A5 PDF**. Print on A4, fold in half, staple -- real book.

Every word in every story is scientifically matched to exactly what the child can decode at their current reading level. No guessing. No frustration. Just books where children can read every single word — while meeting children from cultures around the globe.

**One-liner:** *Decodable phonics books. An open window to the world.*

**Mission:** Every child deserves a reading book matched to exactly what they can decode today — and a window into a world bigger than their own.

---

## 2. The Problem We Solve

### The Parent Problem
Parents know their child is learning phonics at school, but they cannot find books at home that match. The books in shops are either:
- Too easy (boring, child already knows all the words)
- Too hard (child encounters words they cannot decode, gets frustrated, starts guessing)
- Generic (no connection to the child's world -- not their name, not their interests)

There is no middle ground. Parents do not know what "Level 2" means, which sounds have been taught, or which words their child can actually read. They are flying blind.

### The School Problem
Teachers using phonics programmes like Read Write Inc (RWI) or Letters and Sounds send children home with decodable readers. But there are never enough. Children read the same books repeatedly. Parents ask "what can I buy?" and teachers have no easy answer that perfectly matches the school's phonics progression.

### Our Solution
MyPhonicsBooks bridges the gap:
1. **Free online assessment** tells parents their child's exact phonics level in 3 minutes
2. **Culturally diverse books** set in contemporary cultures around the world, each an open window for children
3. **Every word is phonics-checked** against the UK curriculum -- no word enters the book unless the child can decode it
4. **Print at home** on A4 paper, fold, staple -- a real book for pennies
5. **Aligned to what schools teach** -- based on Letters and Sounds (public domain), aligned to the RWI progression

---

## 3. The Product

### What Parents Get
- **An A5 booklet** (16 pages for Levels 2-6, 12 pages for Level 1)
- Stories set in diverse contemporary cultures from around the world
- Characters referenced generically (the girl, the boy, Mum, Dad) -- universal templates any child can use
- Story themes matched to the child's reading level with culturally authentic settings
- A "Guide for Grown-Ups" page with before/during/after reading tips
- A phonics reference chart showing the sounds used in the book
- Comprehension questions
- A handwriting practice page
- A nonsense words challenge (Phonics Screening Check preparation)
- A "Reading Star Certificate" for the child to colour in

### How It Works
```
Level + Focus sounds identified
                        |
                        v
Cultural Research: Region selected + brief verified
                        |
                        v
Story generated: Phonics-compliant, culturally authentic
                        |
                        v
Quality gate: Every word validated against phonics rules
                        |
                        v
Images generated: Hero injection pipeline (Gemini/Flux via fal.ai)
                        |
                        v
PDF assembled: Jinja2 HTML template + Playwright rendering
                        |
                        v
Output: Print-ready A5 PDF -- print on A4, fold, staple
```

### The Template-Based Approach
We use **fixed story templates** across **6 reading levels**. Each book follows a proven narrative arc. Characters are **universal** (the girl, the boy, Mum) — not personalised with specific children's names. This ensures every book works for every child who picks it up. Cultural diversity comes from the SETTINGS and visual world of each book, not from personalisation.

---

## 4. The Non-Negotiable Constraint

**Every word in every story must be either:**
1. **Decodable** at the selected level (the child can sound it out using only graphemes they have been taught), OR
2. **A listed tricky word** for that level or below (common exception words like "the", "said", "was")

No exceptions. No "children probably know this word." No guessing. This is the entire educational value proposition. If a word fails the phonics check, it does not go in the book. The story gets rewritten.

This constraint is what makes MyPhonicsBooks different from every other personalised children's book on the market. Other products personalise the name and theme but pay no attention to reading level. We personalise AND guarantee every word is readable.

---

## 5. Phonics Education Background

### What Is Systematic Synthetic Phonics (SSP)?
SSP is the method used in every state school in England to teach reading. Children learn to:
1. **Decode** -- match written letters (graphemes) to spoken sounds (phonemes)
2. **Blend** -- push sounds together to read words (c-a-t = cat)
3. **Segment** -- break words into sounds for spelling

Sounds are taught in a specific, researched order. Children only read words made from sounds they have already been taught. This is called "decodable text."

### Letters and Sounds (DfE 2007) -- Our Primary Reference
Letters and Sounds is a phonics programme published by the UK Department for Education. It is **public domain** and forms the basis of our product. It divides phonics learning into 6 phases:

| Phase | Focus | Duration | Key Sounds |
|-------|-------|----------|------------|
| 1 | Listening and oral skills | Pre-school | No reading/writing |
| 2 | First letter sounds, CVC blending | Reception, 6 weeks | s, a, t, p, i, n, m, d, g, o, c, k, ck, e, u, r, h, b, f, ff, l, ll, ss |
| 3 | Digraphs and vowel sounds | Reception, 12 weeks | j, v, w, x, y, z, zz, qu + ch, sh, th, ng + ai, ee, igh, oa, oo, ar, or, ur, ow, oi, ear, air, ure, er |
| 4 | Consonant clusters (no new sounds) | Reception-Y1, 6 weeks | CCVC (frog), CVCC (jump), CCVCC (stomp) |
| 5 | Alternative spellings and pronunciations | Year 1, full year | ay, ou, ie, ea, oy, ir, ue, aw, a-e, i-e, o-e, u-e, ew, oe, au, ph, wh |
| 6 | Suffixes, prefixes, spelling rules | Year 2, full year | -s, -es, -ing, -ed, -er, -est, -ly, un-, dis-, re- |

### Read Write Inc (RWI) -- Our Alignment Reference
RWI is the most widely used commercial phonics programme in UK schools. We are NOT Read Write Inc. We use our own terminology and our own level system. However, because most parents will recognise RWI from their child's school, we align our levels to the RWI colour-band progression so that a child reading "Green books" at school will be matched to our Level 2.

**RWI Sound Sets:**
- **Set 1 (36 graphemes):** All single letters + special friends (sh, th, ch, qu, ng, nk) + best friends (ff, ll, ss, zz, ck)
- **Set 2 (11 graphemes):** Long vowel sounds -- ay, ee, igh, ow, oo, ar, or, air, ir, ou, oy
- **Set 3 (19 graphemes):** Alternative spellings -- ea, oi, a-e, i-e, o-e, u-e, aw, are, ur, er, ow(cow), ai, oa, ew, ire, ear, ure, tion, cious/tious

**RWI Book Colour Bands:** Ditty, Red, Green, Purple, Pink, Orange, Yellow, Blue, Grey

### UK Phonics Screening Check
A statutory assessment at the end of Year 1 (age 5-6). 40 words: 20 real + 20 pseudo-words ("nonsense words"). Pass mark: 32/40. Our books include a Nonsense Words Challenge page that directly prepares children for this test.

### Terminology Translation

| RWI Term | Letters and Sounds Term | MyPhonicsBooks Term |
|----------|------------------------|---------------------|
| Green words | Decodable words | Story words / Decodable words |
| Red words | Tricky words | Tricky words |
| Alien words | Pseudo-words | Nonsense words |
| Colour bands | Phases | Levels 1-6 |
| Speed Sounds | Graphemes | Sounds / Graphemes |
| Special Friends | Digraphs | Digraphs |
| Best Friends | Double consonants | Doubles (ff, ll, ss, zz, ck) |

---

## 6. Our 6 Reading Levels -- Complete Breakdown

### Level 1: Starting Stories
- **Colour:** Pink (#E84B8A)
- **Maps to:** RWI Red (All Set 1 complete)
- **Letters and Sounds:** Phase 2 + Phase 3 consonants
- **Age range:** 4-5 | **Year group:** Reception / Year 1
- **Graphemes (36 total):** s, a, t, p, i, n, m, d, g, o, c, k, ck, e, u, r, h, b, f, ff, l, ll, ss, j, v, w, x, y, z, zz, qu, ch, sh, th, ng, nk
- **Tricky words:** the, to, I, no, go, into
- **Word structure:** CVC + consonant digraphs (NO consonant clusters)
- **Book format:** Ditty (12 pages, 3 sheets A4, 6 story pages)
- **Font size:** 26pt
- **Sentences per page:** 1
- **Words per sentence:** 3-5
- **Words per book:** 40-80
- **What this means for parents:** "Your child is just starting out. They know their letter sounds and can blend simple three-letter words like cat, dog, and sun. These short, simple stories will give them the confidence to read their very first book."

### Level 2: Longer Sounds
- **Colour:** Amber (#F59E0B)
- **Maps to:** RWI Green + Purple (Set 2)
- **Letters and Sounds:** Phase 3 (vowel digraphs)
- **Age range:** 4-5 | **Year group:** Reception / Year 1
- **New graphemes (11):** ay, ee, igh, ow(blow), oo(zoo/look), ar, or, air, ir, ou, oy
- **Cumulative graphemes:** 47 total
- **New tricky words:** he, she, we, me, be, my, you, her, said, your, are, put
- **Word structure:** CVC + all digraphs + vowel digraphs (NO consonant clusters)
- **Book format:** Standard (16 pages, 4 sheets A4, 8 story pages)
- **Font size:** 22pt
- **Sentences per page:** 2
- **Words per sentence:** 4-7
- **Words per book:** 80-130
- **What this means for parents:** "Your child is learning longer sounds like 'ee' in tree and 'igh' in night. They can read words with these new sound patterns and are building confidence with slightly longer sentences."

### Level 3: New Spellings
- **Colour:** Green (#22C55E)
- **Maps to:** RWI Pink + Orange (Early Set 3)
- **Letters and Sounds:** Phase 4 + Phase 5a
- **Age range:** 5-6 | **Year group:** Year 1
- **New graphemes (10):** ea, a-e, i-e, o-e, u-e, oi, aw, ai, oa, ie
- **Also unlocked:** Consonant clusters (bl, br, cl, cr, dr, fl, fr, gl, gr, pl, pr, sc, sk, sl, sm, sn, sp, st, sw, tr, tw, scr, spl, spr, str + final clusters ft, lk, lp, lt, mp, nd, nk, nt, pt, sk, sp, st)
- **Cumulative graphemes:** 57 total
- **New tricky words:** all, like, want, call, some, what, they, do, old, was, so, washing
- **Word structure:** Split digraphs, alternative spellings, consonant clusters (CCVC, CVCC, CCVCC)
- **Font size:** 20pt
- **Sentences per page:** 2-3
- **Words per sentence:** 5-9
- **Words per book:** 130-200
- **Key concept:** Same sound, different spellings -- children learn that "ay" in day, "a-e" in cake, and "ai" in rain are all the same sound spelled differently.
- **What this means for parents:** "Your child is discovering that the same sound can be written in different ways. They are learning 'magic e' words like cake and bike, and tackling longer words with consonant blends."

### Level 4: Building Fluency
- **Colour:** Blue (#3B82F6)
- **Maps to:** RWI Yellow (Later Set 3)
- **Letters and Sounds:** Phase 5b
- **Age range:** 5-7 | **Year group:** Year 1 / Year 2
- **New graphemes (6):** are, ur, er, ew, ue, ow(cow)
- **Cumulative graphemes:** 63 total
- **New tricky words:** saw, watch, their, school, where, were, small, who, tall, brother, any, fall
- **Word structure:** All previous + multi-syllable words begin
- **Font size:** 18pt
- **Sentences per page:** 3-4
- **Words per sentence:** 7-11
- **Words per book:** 200-280
- **Key concept:** ow now has BOTH pronunciations (blow AND cow). More alternative spellings: air/are, ir/ur/er, oo/u-e/ue/ew. Fluency building with longer reads.
- **What this means for parents:** "Your child is becoming a fluent reader. They can handle longer sentences and multi-syllable words. These stories are designed to build reading stamina and confidence."

### Level 5: Reading Together
- **Colour:** Purple (#8B5CF6)
- **Maps to:** RWI Blue (Final Set 3)
- **Letters and Sounds:** Phase 5c
- **Age range:** 6-7 | **Year group:** Year 2
- **New graphemes (6):** ore, oor, ire, ear, ure, tion
- **Cumulative graphemes:** 69 total
- **New tricky words:** does, could, would, anyone, over, through, once, whole, people, water
- **Word structure:** Complex patterns, multi-syllable, comprehension focus
- **Font size:** 16pt
- **Sentences per page:** 4-5
- **Words per sentence:** 8-13
- **Words per book:** 280-380
- **Key concept:** All core phonics code complete. Comprehension becomes a key focus alongside decoding. Longer, emotionally complex narratives.
- **What this means for parents:** "Your child has learned almost all the phonics code. Now they are building comprehension -- understanding what they read, not just decoding the words. These stories have richer plots and deeper emotional themes."

### Level 6: Reading Champion
- **Colour:** Teal (#14B8A6)
- **Maps to:** RWI Grey (Suffix patterns)
- **Letters and Sounds:** Phase 6
- **Age range:** 6-8 | **Year group:** Year 2 / Year 3
- **New graphemes (5):** ous, cious, tious, able, ible
- **Cumulative graphemes:** 74 total
- **New tricky words:** should, many, above, father, son, mother, buy, bought, great, caught, worse, love, wear, thought, everyone, walk, talk
- **Word structure:** Complex multi-syllable, suffixes, all alternative spellings, independent reading
- **Font size:** 14pt
- **Sentences per page:** 5-6
- **Words per sentence:** 10-15
- **Words per book:** 380-500
- **Key concept:** Full phonics code mastered. Suffix patterns for long words (marvellous, incredible, cautious). Independent reading.
- **What this means for parents:** "Your child is a Reading Champion! They can tackle complex words with suffixes and read independently. These stories prepare them for the transition to chapter books and free reading."

---

## 7. All 30 Stories

### Level 1: Starting Stories (5 books, ditty format, 40-80 words each)

| # | Title | Template | Focus Sounds | Theme |
|---|-------|----------|-------------|-------|
| 1 | Mud on the Mat | The Family Day | s,a,t,p,i,n,m,d | Child comes inside with muddy boots. Mum is not happy. Child gets a mop. All tidy! |
| 2 | The Duck Egg | The Discovery | g,o,c,k,ck,e,u,b | Child finds an egg by the pond. A crack! A duck pops out and hops into the pond. |
| 3 | The Big Hill | The Weather Day | h,r,f,ff,l,ll,ss | Hot sun. Child huffs up a big hill. Rests. Rolls all the way back down. Fun! |
| 4 | Vet Visit | The Pet Story | j,v,w,x,y,z,zz | Child takes a pet to the vet. A jab and a pill. The dog wags. Back in the van. |
| 5 | The Shell Shop | The Adventure | ch,sh,th,ng,nk,qu | Child goes to a shop by the sea. Picks shells. Quick! Into the bag. |

### Level 2: Longer Sounds (5 books, standard format, 80-130 words each)

| # | Title | Template | Focus Sounds | Theme |
|---|-------|----------|-------------|-------|
| 1 | Night at the Beach | The Adventure | ay, ee, igh | Late trip to the beach. Moon shines bright. Stars high. Perfect night by the sea. |
| 2 | The Toy Zoo | The Big Day | oo, ow | Child sets up a toy zoo in the room. Lines up animals. A show for Mum! |
| 3 | The Dark Park | The Family Day | ar, or | Child and Dad go to the park as it gets dark. Owl hoots. Torch lights the path. |
| 4 | The Bird Fair | The Discovery | air, ir | At the fair, a bird show! A girl holds a big bird. It soars up high. |
| 5 | The Noisy Crowd | The Sport/Game | ou, oy | Big football match. Crowd is loud! Shouts and cheers. Joy! |

### Level 3: New Spellings (5 books, 130-200 words each)

| # | Title | Template | Focus Sounds | Theme |
|---|-------|----------|-------------|-------|
| 1 | The Bike Race | The Sport/Game | a-e, i-e + clusters | Bike race at the lake. Past the wide lake, round the pine trees. A shiny prize! |
| 2 | The Stone Flute | The Discovery | o-e, u-e + clusters | Child finds a stone shaped like a flute. A sweet tune fills the air. Animals come close. |
| 3 | A Treat by the Stream | The Family Day | ea, ie + clusters | Picnic with treats. Swans glide past. Peaceful afternoon by the stream. |
| 4 | The Broken Toy | The Helper | oi, aw + clusters | Friend's toy is broken. Child fixes it with oil and care. The toy spins again! |
| 5 | The Slow Boat | The Adventure | ai, oa + review | Rain on the coat. Floating down the stream. A rainbow arcs across the sky. |

### Level 4: Building Fluency (5 books, 200-280 words each)

| # | Title | Template | Focus Sounds | Theme |
|---|-------|----------|-------------|-------|
| 1 | The Nurse and the Herd | The Helper | ur, er | Nurse visits a farm. A calf has hurt its leg. Kindness matters. |
| 2 | The Town Square | The Adventure | are, ow(cow) | Exploring the town square on market day. Stalls everywhere! Enormous cake. |
| 3 | The Rescue Crew | The Big Day | ew, ue | Storm blows through the village. A crew gathers. By evening, the lane is clear. Heroes! |
| 4 | The Owl Tower | The Discovery | mixed alternatives | School trip to a tall tower. An owl swoops over the fields. Wonder. |
| 5 | The Winter Market | The Family Day | all L4 review | Winter market with lanterns. Hot stew. Snowflakes flutter. A true treat. |

### Level 5: Reading Together (5 books, 280-380 words each)

| # | Title | Template | Focus Sounds | Theme |
|---|-------|----------|-------------|-------|
| 1 | The Campfire Shore | The Adventure | ire, ore | Hiking along the shore. Campfire crackles. Lighthouse sweeps the dark sea. Inspiring. |
| 2 | The Deer Near the Door | The Discovery | ear, oor | A young deer appears at the back door. A clear moment of connection. |
| 3 | The Nature Station | The Family Day | ure, tion | Class visits a nature station in the forest. Exploration game. What an education! |
| 4 | The Lighthouse Keeper | The New Friend | mixed final Set 3 | Meeting an old lighthouse keeper. Maps, charts, a daring rescue story. True friendship. |
| 5 | The School Celebration | The Big Day | all L5 review | End of year celebration. Each section contributes. A perfect end to an incredible year. |

### Level 6: Reading Champion (5 books, 380-500 words each)

| # | Title | Template | Focus Sounds | Theme |
|---|-------|----------|-------------|-------|
| 1 | The Famous Garden | The Discovery | ous | Grandmother's famous garden. Enormous roses, mysterious fountain. Generous day of wonder. |
| 2 | The Incredible Bake-Off | The Big Day | able, ible | School bake-off. Incredible chocolate cake. Remarkable, memorable afternoon. |
| 3 | The Cautious Explorer | The Adventure | cious, tious | Cautious child on a nature trip. Precious discovery: a nest of rare birds. Gracious quality. |
| 4 | The Marvellous Machine | The Helper | mixed suffixes | Fixing Father's curious machine. Precious gear missing. Tremendous, honourable achievement. |
| 5 | The Whole Story | The New Friend | all L6 review | Last day of school. Reflecting on the year. Adventurous, enjoyable, unforgettable. |

### Sound Coverage Strategy
Each level has 5 books. Sounds are distributed so that:
- Each book focuses on 2-4 specific new sounds
- Across all 5 books, ALL new sounds for that level are covered
- Earlier sounds appear naturally in all books (cumulative reinforcement)
- Writing practice graphemes across 5 books cover all key new sounds
- No single book tries to teach everything

---

## 8. Book Design and Structure

### Physical Specifications
- **Page size:** A5 portrait (148mm x 210mm)
- **Paper:** 120gsm white A4 paper, landscape orientation
- **Assembly:** Print double-sided, fold A4 sheets to A5, saddle-stitch (staple on the spine)
- **Level 1:** 12 pages = 3 sheets A4
- **Levels 2-6:** 16 pages = 4 sheets A4

### Font: Andika (SIL International)
We use Andika exclusively for all text inside printed books. Andika is a typeface designed specifically for literacy education. It features **single-storey 'a' and single-storey 'g'** -- matching how children are taught to write these letters. This is critical: if a child sees a double-storey 'a' (like in most adult fonts), it looks nothing like the letter they have learned to form.

Andika is free and open-source under the SIL Open Font License.

### Level 1: Ditty Template (12 pages)

| Page | Content |
|------|---------|
| 1 | **Front Cover** -- Level colour banner, title, sounds row, illustration space |
| 2 | **Guide for Grown-Ups** -- Simplified: 2 tips (Before Reading / After Reading) |
| 3 | **Sounds and Words** -- Bigger squares, fewer items. Story words + tricky words |
| 4-9 | **Story (6 pages)** -- ONE sentence per page. 26pt font. 80% illustration space |
| 10 | **Can You Read? + Draw** -- 4 decodable words + drawing box |
| 11 | **Writing Practice** -- 3 graphemes only, bigger handwriting rows |
| 12 | **Back Cover** -- Brand, 6-level series grid |

### Levels 2-6: Standard Template (16 pages)

| Page | Content |
|------|---------|
| 1 | **Front Cover** -- Level colour banner, sounds row, title, illustration space |
| 2 | **Guide for Grown-Ups** -- 3-column tips (Before / During / After reading) |
| 3 | **Combined Reference** -- Phonics chart grid + Story Words + Tricky Words + tip |
| 4-11 | **Story (8 pages)** -- Text on TOP (25-30%), illustration below (70-75%) |
| 12 | **Combined Activity** -- Comprehension questions + "Can You Read?" words + Draw box |
| 13 | **Writing Practice** -- 4-line handwriting system with trace letters |
| 14 | **Nonsense Words Challenge** -- Grid of pseudo-words (Phonics Screening Check prep) |
| 15 | **Reading Star Certificate** -- Decorative border, name/date lines, celebration |
| 16 | **Back Cover** -- Brand mark, 6-level series grid |

### Story Page Layout
Text appears at the TOP of the page (25-30% of the space), with the illustration below (70-75%). This is intentional: children read first, then look at the picture to confirm and enjoy -- not the other way around. The picture supports comprehension, not word identification (a core SSP principle).

### 4-Line Handwriting System
The writing practice page uses a British-standard 4-line system:
- Line 1 (dotted): Ascender line -- top of tall letters (b, d, f, h, k, l, t)
- Line 2 (solid): x-height line -- top of short letters (a, c, e, m, n, o)
- Line 3 (dotted): Baseline guide -- helps align letter bottoms
- Line 4 (solid): Baseline -- where letters sit

### Print Safety Rules
- No tints lighter than #e0e0e0 -- they disappear on consumer inkjet printers
- Page numbers: dark square badges (#1a1a1a, 8mm x 8mm), alternating left (even) and right (odd)
- No CSS gradients (inconsistent print rendering)
- All critical content kept 5mm from page edges (no bleed on home printers)

---

## 9. 10 Story Templates

Every story across all 6 levels uses one of these 10 narrative templates. Each template defines a story arc, emotional beat, 8 scenes with placeholders, illustration briefs, comprehension questions, and interest mappings.

| # | Template | Core Arc | Emotional Beat |
|---|----------|----------|----------------|
| 1 | **The Adventure** | Child goes somewhere new and discovers something exciting | Courage, curiosity |
| 2 | **The Lost Thing** | Child finds something and returns it to its owner | Kindness, integrity |
| 3 | **The New Friend** | Child meets someone different and forms a bond | Friendship, acceptance |
| 4 | **The Big Day** | A special event or occasion | Excitement, pride |
| 5 | **The Helper** | Child solves a problem or helps someone | Empathy, competence |
| 6 | **The Discovery** | Child finds a secret place or hidden wonder | Wonder, exploration |
| 7 | **The Pet Story** | An animal companion adventure | Care, responsibility |
| 8 | **The Sport/Game** | Competition, team activity, or physical challenge | Perseverance, sportsmanship |
| 9 | **The Weather Day** | Weather changes the day in unexpected ways | Adaptability, resilience |
| 10 | **The Family Day** | Outing or activity with family | Belonging, togetherness |

### Personalisation Slots
Each template has placeholder slots that get filled with the child's details:
- **[NAME]** -- Child's first name (main character)
- **[FRIEND]** -- Friend or sibling name
- **[LOCATION]** -- Setting matched to the story
- **[INTEREST]** -- Used to flavour what they discover
- **[DISCOVERY]** -- What they find, derived from interest

### Interest Mappings
Each template maps child interests to story-specific content. For example, "The Adventure" template maps:
- Dinosaurs -> "big dinosaur fossil"
- Space -> "shiny meteor rock"
- Unicorns -> "sparkly crystal cave"
- Football -> "hidden sports field"
- Animals -> "fox den with cubs"
- Baking -> "wild berry bush"
- Nature -> "hidden waterfall"
- Vehicles -> "old train track"
- Music -> "birds singing together"
- Art -> "rocks with painted shapes"

---

## 10. The Technical Pipeline

### Architecture
```
Parent Input -> Story Selection -> Text Generation (Claude API) -> Quality Gate -> Image Generation -> PDF Assembly
```

### PDF Generation Pipeline
```
generate_book.py -> Jinja2 (templates/book.html) -> Playwright/Chromium -> A5 PDF
```

### Key Technology Choices
- **Story generation:** Claude API (Anthropic) -- constrained text generation with phonics validation
- **Image generation:** Gemini Imagen / Flux Kontext Pro via fal.ai -- hero injection pipeline for character consistency
- **PDF rendering:** Playwright (headless Chromium) -- renders HTML/CSS to pixel-perfect PDF
- **Templating:** Jinja2 -- HTML templates with dynamic content injection
- **Font embedding:** Base64 data URIs (Playwright's Chromium blocks file:// URLs in headless mode)
- **Python:** 3.12 required for all scripts

### Quality Gate (Word Validation)
Before any story enters a book, every word is run through a validation pipeline:
```
FOR each word in the story:
  1. Is it a designated tricky word for this level? -> PASS
  2. Break it into graphemes using longest-first matching
  3. Is every grapheme in the cumulative set for this level? -> PASS
  4. Does it contain an untaught grapheme? -> FAIL -> replace word
  5. Does it contain a consonant cluster? -> Check if clusters are allowed (Level 3+)
```

### Key Files
| File | Purpose |
|------|---------|
| generate_book.py | Entry point -- renders Jinja2 template + Playwright PDF |
| core/generate_story_text.py | Claude API -- constrained story generation |
| core/validate_word_bank.py | Quality gate -- phonics validation |
| validate_words.py | Grapheme decomposition, word classification |
| data/graphemes_by_level.json | Which graphemes are taught at each level |
| data/tricky_words_by_level.json | Exception words per level (cumulative) |
| data/word_banks/level_N_words.json | Permitted decodable words per level |
| data/story_summaries.json | All 30 story summaries with focus sounds |

---

## 11. Assessment and Level-Finding

### Diagnostic Assessment: "Find Your Child's Level in 3 Minutes"
The online assessment determines a child's current phonics level before they start. It is gamified, child-facing, and requires no parent login.

**4 Stages:**
1. **Sound Recognition** -- Show graphemes, child says the sound
2. **Word Reading** -- Show decodable words, child reads them
3. **Nonsense Word Reading** -- Pseudo-words for pure decoding (no memorisation possible)
4. **Tricky Word Recognition** -- Common exception words

**Adaptive Algorithm:**
- Start at Level 1, Sound Group 1 (s, a, t, p, i)
- 4/5 correct -> move to next sound group
- 2-3/5 correct -> test 3 more from same group
  - 2/3 correct -> move on (borderline, note for review)
  - 0-1/3 correct -> STOP (ceiling found)
- 0-1/5 correct -> STOP (ceiling found)
- After sounds -> test word reading at identified level
- After words -> test nonsense words
- Result: "Your child is at Level X"

**Duration target:** 3-5 minutes, maximum 8 minutes.

**Gamification Principles:**
- Friendly character guide (alien/robot) that reacts to answers
- No failure states -- every answer progresses; wrong answers just note the gap
- Visual rewards -- stars, badges, animations for correct answers
- Audio support -- all instructions read aloud
- Touch-friendly -- large buttons (minimum 48px, ideally 64px)
- Adaptive difficulty -- starts easy, gets harder only if succeeding
- Graceful stop -- always ends on a success when ceiling is found

**Summative Thresholds:**
- Sound recognition: 90%+ accuracy
- Word reading: 85%+ accuracy
- Nonsense words: 80%+ accuracy
- Fluency: reading connected text without excessive sounding out

---

## 12. Marketing Strategy

### The Alex Hormozi Approach Applied to MyPhonicsBooks

We follow the Hormozi school of marketing: **lead with irresistible value, remove all risk, and let the product sell itself.** The book IS the marketing. Every free book a parent prints is a demonstration of value that sells itself.

### Core Marketing Principles

**1. The Grand Slam Offer**
We do not sell "phonics books." We sell "the moment your child reads their own name in a story and their face lights up." The offer must be so good that parents feel stupid saying no.

- **Dream outcome:** "My child can read confidently"
- **Perceived likelihood of achievement:** "Every word is matched to their exact level"
- **Time delay:** "Get a personalised book in under 2 minutes"
- **Effort and sacrifice:** "Print at home on normal paper"

**2. Lead with Free Value (100% Free Line)**
Give away so much value for free that parents cannot believe it:
- Free level assessment (3 minutes, no login)
- 5 free decodable books at their child's level
- Free reading tips and phonics guides
- Free progress tracking

The free product must be genuinely excellent. If the free books are amazing, parents will pay for the premium features (AI-custom stories, interest-matching, unlimited books).

**3. Risk Reversal**
- No login to start the assessment
- No payment for the first 5 books
- No commitment -- cancel anytime on subscriptions
- Money-back guarantee on all paid products

**4. Social Proof at Scale**
- Parent testimonials with real results ("Emma went up 2 levels in 3 months")
- School endorsements
- Numbers: "Used by X,000 parents across the UK"
- Trust signals: "Aligned with the UK phonics curriculum" / "Based on Letters and Sounds"

### Target Audience
**Primary:** UK parents of children aged 4-7 (Reception to Year 2)
- 80%+ mothers (primary education decision-maker)
- Mobile-first (80%+ traffic expected from Facebook mobile)
- Many feel anxious about their child's reading progress
- Want to help but don't know how
- Intimidated by phonics jargon
- Will pay for something that genuinely works

**Secondary:** Home educators, tutors, teaching assistants, grandparents

### Channel Strategy

**Facebook/Instagram Ads (Primary channel)**
- Format: Video ads (child reading their personalised book, face lighting up)
- Targeting: UK parents, children aged 4-7, interests in education/reading/parenting
- Hook: "Struggling to find books at the right level?"
- Copy formula: Pain -> Solution -> Proof -> CTA

**Content Marketing (SEO)**
- Blog posts: "Is my child on track with phonics?", "Free phonics games to play at home", "What is the Phonics Screening Check?"
- Target keywords: "free phonics books", "phonics level test", "Year 1 phonics check practice", "decodable books for kids"

**Word of Mouth (Viral loop)**
- Every book has the brand name on it
- Parents share "look what my child is reading" on social media
- Referral programme: "Give a friend 5 free books, get a free custom book"

**School Partnerships**
- Teachers recommend to parents at parents' evening
- Schools get branded assessment tools for free
- "Recommended by teachers at X schools"

### Ad Copy Formula
**Pain -> Solution -> Proof -> CTA**

Example:
> Struggling to find books at the right level for your child?
>
> MyPhonicsBooks creates personalised stories using only the sounds they have been taught. Every word is checked against the UK phonics curriculum.
>
> Get a free book for [Name] ->

### Headlines That Work
| Good | Bad |
|------|-----|
| Help Emma read with confidence | Buy our phonics books |
| A reading book made just for Liam | Personalised educational content |
| Matched to their exact phonics level | Advanced AI-powered book generation |
| Every word they can actually read | Comprehensive decodable text solutions |

### CTAs That Convert
| Good | Bad |
|------|-----|
| Get Emma's free book | Download now |
| Find your child's level | Take the test |
| Start reading together | Purchase product |
| See what Emma can read | View demo |

---

## 13. The Funnel -- Awareness to Retention

### Overall Flow
```
AWARENESS -> ASSESSMENT -> RESULT -> FREE BOOKS -> CUSTOMISATION -> PAYMENT -> RETENTION
```

### Stage 1: Awareness (Traffic)
**Goal:** Get parents to the assessment page.
- SEO: "free phonics books," "phonics level test," "Year 1 phonics check practice"
- Facebook/Instagram: parenting groups, TikTok educational content
- Word of mouth: shareability of free books
- School partnerships: teacher recommendations
- Content marketing: phonics tips blog posts

**Landing Page Elements:**
- Hero: "Find Your Child's Reading Level in 3 Minutes"
- Social proof: "Used by X,000 parents across the UK"
- Trust signals: "Aligned with Letters and Sounds" / "Based on the UK phonics curriculum"
- Single CTA: "Start Free Assessment" (large, colourful button)
- No sign-up required to START
- Mobile-first design

### Stage 2: Assessment (Engagement)
**Goal:** Child completes the gamified level finder.
- No login wall -- start immediately
- Child-facing UI with audio instructions
- Fun character guide
- 3-5 minutes, max 8 minutes
- Celebrate correct answers, graceful ceiling detection

### Stage 3: Results (Conversion Point)
**Goal:** Show result and capture parent's email.
- Headline: "Emma is at Level 2 -- Longer Sounds!" (personalised, positive)
- Visual level indicator: 6 coloured circles
- What this means: plain English explanation
- Strengths and areas to practise

**Email Capture (gate the free books):**
> "Get 5 FREE personalised phonics books for Emma -- Level 2"
> [Email input] [Get Free Books ->]
> "No spam. Just books. Unsubscribe anytime."

**Why gate HERE (not before assessment):**
- Parent has invested 3-5 minutes
- They have seen personalised, specific VALUE
- The offer is concrete ("5 FREE books for YOUR child")
- Much higher conversion than gating the assessment itself

### Stage 4: Free Books (Value Delivery)
**Goal:** Deliver 5 free template books and build trust.
- Instant: Generate 5 PDFs personalised with child's name
- Email: Send download links immediately
- All at the child's assessed level
- Template stories (not AI-customised -- that is the paid product)

**Email Engagement Sequence:**
- Day 0: "Here are Emma's free books!" + download links
- Day 3: "How is Emma enjoying the books?" + reading tips
- Day 7: "Emma might be ready for more!" + preview of next books
- Day 14: "Create a custom story for Emma" + paid CTA

### Stage 5: Customisation (Upsell)
**Goal:** Convert to paid with AI-customised books.

**Free vs Paid:**
- Free: personalised name + level-appropriate phonics + pre-written stories
- Paid: + AI-written stories about the child's interests + child as main character + choose adventure theme + AI-generated illustrations + progress tracking + unlimited books

### Stage 6: Retention
**Goal:** Keep parents subscribed and recommending.
- Monthly "Reading Star Certificate" email with progress
- Re-assessment every 4-6 weeks: "Emma might be ready for Level 3!"
- Seasonal special books (Christmas phonics, summer reading)
- Sibling discount
- Referral programme

### Key Metrics

| Metric | Target |
|--------|--------|
| Landing -> Start Assessment | 60%+ |
| Start -> Complete Assessment | 80%+ |
| Complete -> View Results | 95%+ |
| Results -> Email Capture | 40-50% |
| Email -> Download Free Books | 90%+ |
| Free -> Paid Conversion | 5-10% |
| Monthly churn | <8% |

---

## 14. Brand Identity and Voice

### Brand Personality
Warm, encouraging, knowledgeable -- like a friendly Year 1 teacher at pick-up time. Never condescending. Never salesy. Always child-first.

### Writing Style
- **British English throughout:** colour, organised, mum, favourite, practise (verb)
- **Lead with the child's name, not the product:** "Help Emma read with confidence" not "Buy our phonics books"
- **Speak to parents as partners, not customers**
- **Simple language:** say "reading level" not "grapheme-phoneme correspondence"
- **Warm but credible:** friendly teacher, not corporate marketing

### Trust Phrases (Use These)
- "Aligned with the UK phonics curriculum"
- "Based on Letters and Sounds"
- "Every word matched to your child's reading level"
- "Designed by phonics specialists"

### Phrases to Avoid
- "Limited time!" / urgency pressure
- "Buy now!" / hard sell language
- Mentioning Read Write Inc, Oxford Reading Tree, or any commercial programme by name
- American English (color, mom, favorite)
- Edu-jargon parents would not know (GPC, segmenting, blending -- unless explaining them)

### Parent-Facing Level Descriptions

| Level | Simple Description |
|-------|--------------------|
| 1 | Just starting -- learning first letter sounds (s, a, t, p, i, n...) |
| 2 | Building up -- adding longer sounds like ee, igh, ar, oo |
| 3 | New spellings -- magic e words and different ways to write the same sound |
| 4 | Building fluency -- longer sentences, more alternatives, multi-syllable words |
| 5 | Reading together -- complex stories, comprehension skills |
| 6 | Reading champion -- suffixes, independent reading, big words |

---

## 15. Visual Design System

### Level Colours
These are the core of the brand. Each reading level has a fixed colour used across books, UI, ads, and everything else.

| Level | Name | Hex Code | Description |
|-------|------|----------|-------------|
| 1 | Starting Stories | #E84B8A | Pink |
| 2 | Longer Sounds | #F59E0B | Amber |
| 3 | New Spellings | #22C55E | Green |
| 4 | Building Fluency | #3B82F6 | Blue |
| 5 | Reading Together | #8B5CF6 | Purple |
| 6 | Reading Champion | #14B8A6 | Teal |

### Brand Accent Colours
- **Primary accent:** Deep indigo #312e81 -- warm, authoritative, does not clash with any level colour
- **Gradient (CTAs):** from indigo-600 to violet-600
- **Light tint (backgrounds):** indigo-50 (#eef2ff)

### Neutral Palette
- Text: slate-900 (#0f172a)
- Secondary text: slate-600 (#475569)
- Borders: slate-200 (#e2e8f0)
- Background: slate-50 (#f8fafc)
- Card background: white/70 with backdrop-blur (glass-panel effect)

### Website Typography
| Role | Font | Weights |
|------|------|---------|
| Body | Plus Jakarta Sans | 400, 500, 600, 700 |
| Headings | Outfit | 500, 600, 700, 800 |

### Book Typography
| Level | Font Size | Rationale |
|-------|-----------|-----------|
| 1 | 26pt | Largest -- first readers need big, clear text |
| 2 | 22pt | Still large, digraphs introduced |
| 3 | 20pt | Moderate -- longer words need more space |
| 4 | 18pt | Standard -- blending longer clusters |
| 5 | 16pt | Smaller -- multi-syllable words |
| 6 | 14pt | Smallest -- approaching standard reading size |

### UI Patterns
- **Glass-panel cards:** rgba(255,255,255,0.7) with backdrop-blur-12px
- **Primary CTA:** Gradient indigo-to-violet, rounded-xl, shadow, 48px+ height
- **Touch targets:** Minimum 48px for all interactive elements, 64px for child-facing UI
- **Mobile-first:** 80%+ traffic from Facebook mobile; hero must fit above fold at 375px

---

## 16. Pricing Strategy

| Product | Price |
|---------|-------|
| Level assessment | Free |
| 5 template books (per level) | Free |
| Single AI-custom book | GBP 3-5 |
| Bundle (5 AI-custom books) | GBP 10-15 |
| Monthly subscription (unlimited) | GBP 7-10/month |
| Annual subscription | GBP 60-70/year |

**Conversion triggers:**
- "Emma has finished all 5 free Level 2 books!"
- "Ready for the next adventure? Create a custom story about Emma's favourite things"
- "First custom book free with any subscription"

---

## 17. Legal and Compliance

### Required Disclaimers
- "Based on Letters and Sounds (DfE 2007), a public-domain phonics programme"
- "Not affiliated with Read Write Inc, Oxford Reading Tree, or any commercial phonics programme"

### GDPR Compliance
- Email capture requires explicit opt-in checkbox (not pre-ticked)
- Privacy policy link visible at point of data collection
- Unsubscribe link in every email
- Data stored in UK/EU or GDPR-compliant infrastructure

### Children's Data (ICO Age Appropriate Design Code)
- We collect the child's first name and reading level only
- No direct child accounts -- all interaction through parent
- No child photos or biometric data
- Compliant with ICO Age Appropriate Design Code principles

### Important Legal Position
We are an independent product. We are NOT Read Write Inc. We do NOT use RWI materials, RWI branding, or RWI terminology in our customer-facing product. Our product is based on Letters and Sounds, which is a public-domain publication by the UK Department for Education. We use the RWI progression internally as an alignment reference only, because it is the most common programme in UK schools and parents recognise it.

---

## 18. Current State and Roadmap

### What Is Working Now
- PDF generation pipeline (Jinja2 + Playwright) -- fully working, tested across all 6 levels
- Book templates -- complete (12-page ditty for L1, 16-page standard for L2-6)
- Story summaries -- all 30 stories written with focus sounds and target words
- Story templates -- 10 narrative templates with personalisation slots and interest mappings
- Grapheme data -- complete cumulative grapheme lists for all 6 levels
- Tricky words -- complete cumulative lists for all 6 levels
- Word banks -- 6 levels of decodable words (~1000+ words)
- Font -- Andika (SIL) embedded via base64

### What Needs Building
- **Image generation** -- currently placeholder boxes; need AI-generated illustrations for each story page
- **Frontend** -- React + Vite skeleton exists; needs full UI build (landing page, assessment, dashboard)
- **Backend** -- FastAPI endpoints exist; need Stripe integration, PDF generation API, user accounts
- **Assessment funnel** -- designed and documented; needs frontend implementation
- **Email sequences** -- designed; needs email service integration (SendGrid/Mailchimp/Loops)
- **Claude API story generation** -- code exists; needs testing and validation pipeline
- **Facebook ads** -- creative and copy strategy defined; needs production and launch

### The Vision
A parent sees a Facebook ad. Clicks through. Their child takes a 3-minute assessment on the phone. The parent gets 5 free books instantly. The child reads their name in a story and lights up. The parent is hooked. They subscribe. Every month, new books arrive matched to their child's growing reading ability. The child progresses through the levels. The parent tells other parents. The flywheel spins.

Every word. Every page. Every book. Matched to exactly what the child can read today.

That is MyPhonicsBooks.

---

*This document is the single source of truth for everything about MyPhonicsBooks. Use it for briefing collaborators, feeding into AI tools like NotebookLM or Claude, creating infographics, writing ad copy, or onboarding team members.*
