---
name: Workflow Orchestrator
description: Master orchestrator for the complete book production workflow. Executes all steps from cultural research through final QA with mandatory checkpoints. Invoke with /workflow-orchestrator or /create-book.
user_invocable: true
---

# Workflow Orchestrator

You are the master orchestrator for MyPhonicsBooks production. You execute the complete 9-step workflow to produce a single book from scratch, with mandatory quality checkpoints at each stage.

**Invoke with:** `/create-book L1.3` or `/workflow-orchestrator L2.1 "The Lost Teddy"`

---

## Pre-Flight Verification (MANDATORY)

Before starting ANY book, confirm you will:
- [ ] Invoke cultural-researcher for non-British settings
- [ ] Invoke book-assessor at Step 2 AND Step 7
- [ ] READ every image at Step 5 AND Step 7 (using the Read tool)
- [ ] Compare against ultimate template at Step 7
- [ ] NOT skip any step even if the book "looks fine"

---

## Curriculum Ladder (Master Reference)

### Level 1: Starting Stories (COMPLETE)
- **Colour:** #E84B8A (Pink)
- **Graphemes:** 36 (all Set 1)
- **Books:** 10 (L1.1-L1.10)
- **Status:** COMPLETE

### Level 2: Longer Sounds
- **Colour:** #F59E0B (Amber)
- **Graphemes:** ay, ee, igh, ow, oo, ar, or, air, ir, ou, oy (11 new)
- **Books needed:** 5
  - L2.1: ay, ee, igh
  - L2.2: ow, oo
  - L2.3: ar, or
  - L2.4: air, ir
  - L2.5: ou, oy
- **Word structure:** NO consonant clusters yet

### Level 3: New Spellings
- **Colour:** #22C55E (Green)
- **Graphemes:** ea, a-e, i-e, o-e, u-e, oi, aw, ai, oa, ie (10 new)
- **Books needed:** 5
  - L3.1: a-e, i-e
  - L3.2: o-e, u-e
  - L3.3: ea, ie
  - L3.4: oi, aw
  - L3.5: ai, oa
- **Word structure:** CONSONANT CLUSTERS NOW UNLOCKED

### Level 4: Building Fluency
- **Colour:** #3B82F6 (Blue)
- **Graphemes:** are, ur, er, ew, ue, ow-cow (6 new)
- **Books needed:** 4
  - L4.1: ur, er
  - L4.2: are, ow (cow pronunciation)
  - L4.3: ew, ue
  - L4.4: review
- **Word structure:** Multi-syllable words begin

### Level 5: Reading Together
- **Colour:** #8B5CF6 (Purple)
- **Graphemes:** ore, oor, ire, ear, ure, tion (6 new)
- **Books needed:** 4
  - L5.1: ire, ore
  - L5.2: ear, oor
  - L5.3: ure, tion
  - L5.4: review
- **Word structure:** Comprehension focus

### Level 6: Reading Champion
- **Colour:** #14B8A6 (Teal)
- **Graphemes:** ous, cious, tious, able, ible (5 new)
- **Books needed:** 4
  - L6.1: ous
  - L6.2: able, ible
  - L6.3: cious, tious
  - L6.4: review
- **Word structure:** Suffix patterns, independent reading

---

## Ultimate Template Reference

**Location:** `output/books/ultimate_templates/`

Each level should have an ultimate template book as the gold standard:
- **L1:** `L1_The_Fish_in_the_Tank_ULTIMATE.pdf` (COMPLETE)
- **L2-L6:** First book at each level becomes the ultimate template for that level

At Step 7 (Final QA), you MUST:
1. Read `output/books/ultimate_templates/ULTIMATE_TEMPLATE.md`
2. Compare the new book against the L1 ultimate template for:
   - Story emotional journey quality
   - Tricky words display (actual words used, not cumulative)
   - Focus sounds display (actual sounds used in story)
   - Image quality and character consistency
   - Layout and professional finish
3. If this is the FIRST book at a new level (e.g., L2.1), it becomes the ultimate template for that level

---

## Pre-Flight Checks

BEFORE starting any book production:

1. **Read `PRODUCTION_CHECKLIST.md`** — know what books already exist, what sounds are covered, what settings/cultures have been used
2. **Read `data/graphemes_by_level.json`** and `data/tricky_words_by_level.json`** — load phonics data
3. **Read `data/story_summaries.json`** — check the book_plan for focus sounds at each sub-level
4. **Identify the target level and sub-level** — which sounds does this book need to focus on?
5. **Check what's missing** — which sounds, cultures, story structures, character types are under-represented?

---

## The 9-Step Workflow

```
STEP 0: Cultural Research → cultural-researcher skill
   ↓
STEP 1: Story Writing → phonics-story-writer skill
   ↓
STEP 2: Story QA → book-assessor skill
   ↓ PASS
STEP 2b: Character Selection → illustration-director skill
   ↓
STEP 3a: Object Identification → illustration-director skill
   ↓
STEP 3b: Image Prompts → illustration-director skill
   ↓
STEP 4: Image Generation → art-generator skill (via script)
   ↓
STEP 5: Image QA → illustration-director skill (READ all images)
   ↓ PASS
STEP 6: Book Assembly → book-template-designer skill (via script)
   ↓
STEP 7: Final QA → book-assessor skill (READ all images + HTML)
   ↓ PASS
DONE: Production-ready PDF
```

---

## STEP 0: Cultural Research (NEW — mandatory for diverse settings)

**Skill:** `.claude/skills/cultural-researcher/SKILL.md`
**Input:** Target setting/culture for this book
**Output:** Cultural Brief document

### What Happens:
- Research the specific region, country, or community the book will depict
- **Apply the Contemporary World Principle** — research how people ACTUALLY live TODAY, not just heritage/traditional imagery
- Verify clothing, architecture, food, landscape details against real, current sources
- Run stereotype checks — actively avoid Western misrepresentations AND "postcard" portrayals that freeze cultures in their traditional past
- Verify internal consistency (all details from SAME region)
- Run the Mandatory Contemporary Balance Check (see cultural-researcher skill)
- Produce a Cultural Brief that guides all subsequent steps

### When to Run:
- **ALWAYS** when the book is set outside a generic British context
- **ALWAYS** when the book features characters from specific cultural backgrounds
- **SKIP ONLY** for generic British home/garden settings with no cultural specificity

### Checkpoint:
✅ Cultural Brief produced with specific, verified details
✅ Contemporary Balance Check passed — setting is contemporary-first, not heritage-only
✅ Stereotype check passed
✅ Internal consistency verified
✅ Dignity check passed
✅ A child FROM this culture would recognise their daily life in this book

**If Brief has issues → FIX before proceeding to Step 1**

---

## STEP 1: Story Writing

**Skill:** `.claude/skills/phonics-story-writer/SKILL.md`
**Input:** Level, focus sounds, Cultural Brief (from Step 0)
**Output:** Story dictionary (text, words, questions)

### What Happens:
- Write story using phonics constraints for the target level
- Apply engagement hooks (Dear Zoo style: page-turn tension, curiosity gaps, repetition with variation)
- Create emotional journey (NOT just "problem → I am happy")
- Use Cultural Brief to ensure accurate cultural details in text
- Check PRODUCTION_CHECKLIST.md to avoid duplicating story structures or endings

### Key Rules:
- **Story sense FIRST** — phonics compliance is necessary but not sufficient
- **Variety matters** — check what endings/structures already exist at this level
- **Cultural Brief compliance** — use correct terms, food names, family structures from the brief
- **British English** throughout

### Deliverables:
Story data file saved to `data/` with all required fields.

---

## STEP 2: Story QA

**Skill:** `.claude/skills/book-assessor/SKILL.md`
**Input:** Story dictionary from Step 1
**Output:** PASS or FAIL verdict

### Mandatory Checks:
Run book-assessor CHECKs 1, 2, 3, 8, 9:
1. **Phonics Accuracy** (CHECK 1) — every word decodable or tricky
2. **Level Data** (CHECK 2) — correct graphemes, tricky words displayed
3. **Story Quality** (CHECK 3) — engagement hooks, narrative coherence, British English
4. **Cross-Book Variety** (CHECK 8) — ending, structure, setting, character type differ from existing books
5. **Story Craft & RWI** (CHECK 9) — active voice, rhythm, focus sounds prominent

### Checkpoint:
✅ All words decodable or tricky?
✅ 3+ engagement hooks present?
✅ Story makes narrative sense with proper arc (problem → complication → resolution)?
✅ At L2+, every page has MINIMUM 2 sentences? (HARD FAIL if not)
✅ Sentence variety present — not just flat declarations?
✅ Story feels like a step UP from the previous level?
✅ Ending differs from majority of existing books?
✅ Story structure not over-used at this level?
✅ Cultural details match the Cultural Brief (contemporary-first)?

**If FAIL → Return to Step 1 with specific feedback**
**If PASS → Proceed to Step 2b**

---

## STEP 2b: Character Selection

**Skill:** `.claude/skills/illustration-director/SKILL.md`
**Input:** Approved story, Cultural Brief
**Output:** Character description (from roster or custom)

### What Happens:
- Select character from the 12-character roster OR define a custom character
- Ensure outfit suits the story setting and Cultural Brief
- Ensure modesty standards met (dresses with leggings, no bare legs, no shorts)
- Check character type variety against existing books

### Key Rules:
- Each STORY gets a DIFFERENT character (not level-based)
- **Contemporary clothing is the DEFAULT** — children in most countries wear modern casual clothes (t-shirts, jeans, trainers). Traditional outfits are only appropriate when the Cultural Brief specifies a festival, cultural event, or region where traditional dress is genuinely everyday wear
- Outfit must match the Cultural Brief's CONTEMPORARY REALITY CHECK, not Western assumptions about what people "should" wear in that country
- Custom characters for culturally specific settings (roster characters for generic British settings)

---

## STEP 3a: Object Identification

**Skill:** `.claude/skills/illustration-director/SKILL.md`
**Input:** Approved story
**Output:** Recurring object definitions

### What Happens:
- Identify objects mentioned more than once in the story
- Define EXACT visual appearance for each (colour, style, detail)
- These definitions are used IDENTICALLY in every prompt where the object appears

---

## STEP 3b: Image Prompts

**Skill:** `.claude/skills/illustration-director/SKILL.md`
**Input:** Story + character + objects + Cultural Brief
**Output:** Hero prompt + scene prompts

### What Happens:
- Write hero reference prompt incorporating Cultural Brief clothing/appearance details
- Write scene prompts incorporating Cultural Brief architecture/landscape/objects
- Verify object descriptions identical across all prompts
- Include eye style, art style, modesty, and "no text" requirements in every prompt

### Checkpoint:
✅ All prompts include Cultural Brief details?
✅ Object descriptions identical across all prompts?
✅ Eye style specified in every prompt?
✅ Modesty standards in every prompt?
✅ "No text, words, or letters" in every prompt?

**If ANY prompt fails → Rewrite before proceeding**

---

## STEP 4: Image Generation

**Skill:** `.claude/skills/art-generator/SKILL.md`
**Script:** `scripts/generate_gemini_images.py`
**Input:** Hero prompt + scene prompts
**Output:** PNG files (hero_reference.png, cover.png, page1-6.png)

### What Happens:
1. Generate hero reference image (text-to-image)
2. Convert hero to base64
3. Inject hero into each scene prompt (image editing mode)
4. Save to `output/images/L{n}_{sub}_B{book}/`

---

## STEP 5: Image QA (CRITICAL — must READ every image)

**Skill:** `.claude/skills/illustration-director/SKILL.md`
**Input:** All PNG files from Step 4
**Output:** PASS or FAIL

### MANDATORY: Use Read tool to VIEW every image file

### Checks:
1. **Eyes:** Tiny solid black dots — NO white sclera, NO highlights
2. **Modesty:** All characters fully covered, dresses have leggings
3. **Safety:** No children with knives/sharp objects, adults handle dangerous tasks
4. **Character consistency:** Same face, hair, outfit across all pages
5. **Object consistency:** Recurring objects identical in every appearance
6. **Cultural accuracy:** Clothing, architecture, objects match Cultural Brief
7. **Action/text match:** Each image matches its story page
8. **Art style:** Consistent whimsical children's book style throughout

### Checkpoint:
✅ Every image viewed with Read tool?
✅ Eyes correct in ALL images?
✅ Modesty maintained in ALL images?
✅ Safety standards met?
✅ Character consistent across pages?
✅ Objects consistent across pages?
✅ Cultural Brief compliance?

**If FAIL → Identify failing images, update prompts, regenerate ONLY failures, re-verify**
**If PASS → Proceed to Step 6**

---

## STEP 6: Book Assembly

**Skill:** `.claude/skills/book-template-designer/SKILL.md`
**Script:** `scripts/generate_pilot_books.py`
**Input:** Story data + approved images
**Output:** PDF + debug HTML

### What Happens:
1. Load story data from `data/` file
2. Load images (base64 embed)
3. Render Jinja2 template
4. Generate PDF via Playwright
5. Save to `output/books/Level{n}/`

---

## STEP 7: Final QA (CRITICAL — the quality gate)

**Skill:** `.claude/skills/book-assessor/SKILL.md`
**Input:** PDF + debug HTML + all images
**Output:** Final PASS or FAIL verdict

### MANDATORY: Run ALL book-assessor checks (1-9)

This is the FULL assessment. Re-read all images. Parse the debug HTML. Run every check:
1. Phonics Accuracy
2. Level Data Accuracy
3. Story Quality
4. Image-Story Alignment
5. Character & Visual Guidelines (eyes, modesty, safety, culture, consistency)
6. Page Layout
7. Cover & Structure
8. Cross-Book Variety
9. Story Craft & RWI Alignment

Plus the Overall Vibe check.

### Checkpoint:
✅ ALL 9 checks + vibe check passed?

**If FAIL → Return to the step that introduced the failure, fix, restart from there**
**If PASS → Book is production-ready. Update PRODUCTION_CHECKLIST.md**

---

## Post-Production

After a book passes Step 7:

1. **Update `PRODUCTION_CHECKLIST.md`:**
   - Add the book to the completed table
   - Update curriculum coverage tracker
   - Note the setting/culture used

2. **Save the Cultural Brief** (if one was produced) alongside the story data for future reference

3. **Report to user:**
   ```
   BOOK COMPLETE: [Title]
   Level: [Level]
   Focus Sounds: [sounds]
   Setting: [culture/region]
   PDF: [path]
   All 9 checks PASSED.
   ```

---

## Failure Recovery

| Failure Type | Return To | Fix |
|---|---|---|
| Phonics word not decodable | Step 1 | Rewrite sentence |
| Story too similar to existing book | Step 1 | Change structure/ending |
| Cultural inaccuracy | Step 0 | Re-research, update brief |
| Image eyes wrong | Step 4 | Strengthen eye prompt, regenerate |
| Image modesty issue | Step 4 | Update outfit in prompt, regenerate |
| Image safety issue | Step 1 + Step 4 | Rewrite story if needed + regenerate images |
| Object inconsistency | Step 3b + Step 4 | Fix prompt, regenerate failing images |
| Layout broken | Step 6 | Check HTML template |

---

## Maximum Iterations

- **Story rewrites:** Max 3 rounds between Steps 1-2
- **Image regeneration:** Max 3 rounds between Steps 4-5
- **Full workflow restart:** Max 2 times

If still failing after max iterations → flag to user with detailed report of all remaining issues.
