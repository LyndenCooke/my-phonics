# MyPhonicsBooks — Complete Production Workflow

**Updated:** 2026-03-04
**Purpose:** Step-by-step guide showing which skills to use, when to use them, and what checkpoints are mandatory.

**Master Skill:** `.claude/skills/workflow-orchestrator/SKILL.md` — invoke with `/create-book L1.3`

---

## Workflow Overview (9 Steps)

```
STEP 0: Cultural Research → cultural-researcher skill (NEW)
   ↓ Cultural Brief produced
STEP 1: Story Writing → phonics-story-writer skill (uses Cultural Brief)
   ↓
STEP 2: Story QA → book-assessor skill (CHECKs 1-3, 8-9: phonics, engagement, variety, craft)
   ↓ PASS
STEP 2b: Character Selection → illustration-director skill (matches Cultural Brief)
   ↓
STEP 3a: Object Identification → illustration-director skill
   ↓
STEP 3b: Image Prompts → illustration-director skill (CHECK: object consistency + Cultural Brief)
   ↓
STEP 4: Image Generation → art-generator skill (via generate_gemini_images.py)
   ↓
STEP 5: Image QA → illustration-director skill (CHECK: READ all images, eyes, modesty, safety, culture)
   ↓ PASS
STEP 6: Book Assembly → book-template-designer skill (via generate_pilot_books.py)
   ↓
STEP 7: Final QA → book-assessor skill (ALL 9 checks + vibe: READ all images + HTML)
   ↓ PASS
DONE: Production-ready PDF → update PRODUCTION_CHECKLIST.md
```

---

## STEP 0: Cultural Research (NEW — mandatory for diverse settings)

**Skill:** `.claude/skills/cultural-researcher/SKILL.md`
**Who:** cultural-researcher
**Input:** Target setting/culture for this book
**Output:** Cultural Brief document

### What Happens:
- Research the specific region, country, or community the book will depict
- Verify clothing, architecture, food, landscape against real sources (use web search)
- Run stereotype checks — actively avoid Western misrepresentations
- Verify internal consistency (all details from SAME region)
- Produce a Cultural Brief that guides all subsequent steps

### When to Run:
- **ALWAYS** when the book is set outside a generic British context
- **SKIP ONLY** for generic British home/garden settings

### Checkpoint:
✅ Cultural Brief produced with specific, verified details?
✅ Stereotype check passed?
✅ Internal consistency verified (all details from same region)?
✅ Dignity check passed?

**If Brief has issues → FIX before proceeding to Step 1**
**If PASS → Proceed to Step 1**

---

## STEP 1: Story Writing

**Skill:** `.claude/skills/phonics-story-writer/SKILL.md`
**Who:** phonics-story-writer (can be invoked or used as reference)
**Input:** Level (L1-L6), story template choice, Cultural Brief (from Step 0)
**Output:** Story dictionary with text, words, questions

### What Happens:
- Load graphemes and tricky words for target level from JSON
- Write 6 pages (L1) or 8 pages (L2-L6) following template structure
- Apply "majority decodable" approach (SATPIN focus for L1.1)
- Include 3+ engagement hooks (Dear Zoo style)
- Create emotional journey (problem → tension → resolution)

### Key Rules:
- Story sense comes FIRST (not phonics perfection)
- Use tricky words freely to maintain narrative flow
- Every word must be decodable OR a tricky word
- No consonant clusters below L3

### Deliverables:
```python
{
  "book_title": "...",
  "story_pages": [{text: "...", image: None}, ...],
  "story_words": [...],
  "tricky_words": [...],
  "read_words": [...],
  "nonsense_words": [...],
  "questions": [...],
  "writing_graphemes": [...]
}
```

---

## STEP 2: Story QA

**Skill:** `.claude/skills/book-assessor/SKILL.md` (Step 2 methodology)
**Who:** book-assessor
**Input:** Story dictionary from Step 1
**Output:** PASS or FAIL verdict

### Mandatory Checks:
1. **CHECK 1: Phonics Accuracy**
   - Decompose every word into graphemes
   - Verify against cumulative graphemes JSON
   - Verify tricky words against cumulative list
   - **FAIL** if any word is not decodable

2. **CHECK 2: Level Data**
   - Verify graphemes, tricky words, word counts match level specs
   - Check sentence counts per page
   - **FAIL** if specs violated

3. **CHECK 3: Story Quality**
   - Count engagement hooks (minimum 3)
   - Verify emotional arc present
   - Check title creates curiosity
   - Verify British English throughout
   - **FAIL** if story is flat or nonsensical

### Checkpoint:
✅ **All words decodable or tricky?**
✅ **3+ engagement hooks present?**
✅ **Story makes narrative sense?**

**If FAIL:** Return to Step 1, rewrite story.
**If PASS:** Proceed to Step 3a.

---

## STEP 3a: Object Identification

**Skill:** `.claude/skills/illustration-director/SKILL.md` (Step 3a)
**Who:** illustration-director
**Input:** Approved story from Step 2
**Output:** List of recurring objects with exact visual descriptions

### What Happens:
- Read through all story pages
- Identify objects mentioned more than once (hat, toy, pet, vehicle, etc.)
- For EACH recurring object, define its visual appearance ONCE:
  - Colour (e.g., "red", "navy blue", "bright yellow")
  - Style (e.g., "knitted beanie", "bucket hat", "teddy bear")
  - Key detail (e.g., "with white pom-pom", "with green stripes")

### Example:
```
Story: "The Hat in the Pit"
- "hat" appears on pages 3, 4, 5, 6
- Object definition: "A red knitted beanie hat with a white pom-pom on top"
- This EXACT description will be used in prompts for pages 3, 4, 5, 6
```

### Deliverables:
```python
recurring_objects = {
  "hat": "A red knitted beanie hat with a white pom-pom on top",
  "toy": "A blue stuffed elephant with floppy ears",
  # etc.
}
```

---

## STEP 3b: Image Prompts

**Skill:** `.claude/skills/illustration-director/SKILL.md` (Step 3b-3c)
**Who:** illustration-director
**Input:** Story + recurring objects from Step 3a
**Output:** Hero prompt + 7 scene prompts (cover + 6 pages L1, or cover + 8 pages L2-6)

### What Happens:
1. Write hero reference prompt (character description from art-generator roster)
2. Write cover prompt (portrait orientation)
3. Write scene prompts for each story page (landscape orientation)

### Mandatory Prompt Structure:
Every scene prompt MUST include:
1. "Show the character from the reference image [EXACT action from text]."
2. Specific visible details (objects using EXACT descriptions from Step 3a, settings)
3. "Same character, same outfit, same appearance as reference."
4. For recurring objects: "The same [exact object description from Step 3a]."
5. "Small simple oval eyes with solid dark fill."
6. "Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters."
7. "No text, words, or letters in the image."
8. Orientation (Portrait for Cover, Landscape for Story pages)

### Checkpoint (Step 3c):
✅ **Action matches story text word-for-word?**
✅ **Character description matches hero reference?**
✅ **KEY OBJECT CONSISTENCY: Each recurring object has EXACT SAME description in ALL prompts?**
✅ **Eyes specified as "small simple oval eyes with solid dark fill"?**
✅ **Art style keywords included?**
✅ **"No text, words, or letters" included?**

**If ANY prompt fails:** Rewrite before proceeding.
**If ALL pass:** Proceed to Step 4.

---

## STEP 4: Image Generation

**Skill:** `.claude/skills/art-generator/SKILL.md`
**Who:** art-generator (via `scripts/generate_gemini_images.py`)
**Input:** Hero prompt + scene prompts from Step 3b
**Output:** PNG files (hero_reference.png, cover.png, page1.png, ..., page6.png)

### What Happens:
1. Generate hero reference image (text-to-image mode)
2. Convert hero to base64
3. For each scene: inject hero base64 + scene prompt (image editing mode)
4. Save all images to `output/images/L{n}_B{book}/`

### Script:
```bash
cd C:\Users\ASUS\myphonicsbooks\myphonicsbooks
py -3.12 scripts/generate_gemini_images.py L1
```

### Output:
```
output/images/L1_B1/
├── hero_reference.png
├── cover.png
├── page1.png
├── page2.png
├── page3.png
├── page4.png
├── page5.png
└── page6.png
```

---

## STEP 5: Image QA (CRITICAL)

**Skill:** `.claude/skills/illustration-director/SKILL.md` (Step 6)
**Who:** illustration-director
**Input:** All PNG files from Step 4
**Output:** PASS or FAIL verdict (with specific images to regenerate if FAIL)

### MANDATORY: Visual Verification

**You MUST use the Read tool to VIEW every image:**

```python
Read output/images/L1_B1/hero_reference.png
Read output/images/L1_B1/page1.png
Read output/images/L1_B1/page2.png
Read output/images/L1_B1/page3.png
Read output/images/L1_B1/page4.png
Read output/images/L1_B1/page5.png
Read output/images/L1_B1/page6.png
```

### Mandatory Checks:

1. **Character Consistency:**
   - VIEW hero reference
   - VIEW each scene
   - COMPARE visually: Same face, hair, outfit, proportions?
   - **FAIL** if character drifts

2. **Object Consistency (CRITICAL):**
   - Identify all pages where recurring object appears (e.g., hat on pages 3-6)
   - VIEW all those images
   - COMPARE visually: Same colour, style, details in ALL appearances?
   - Example: If hat is red beanie on page 3, MUST be red beanie on pages 4, 5, 6
   - **FAIL** if object changes (e.g., white hat page 3, red hat page 6)

3. **Eye Style:**
   - VIEW each character image
   - VERIFY: Small simple ovals with solid dark fill (no irises, no highlights)?
   - **FAIL** if eyes show detail

4. **Action/Text Match:**
   - Compare visual to story text
   - **FAIL** if mismatch

5. **Visual Quality:**
   - Check for text/words/letters → **FAIL** if present
   - Check art style consistency

### Checkpoint:
✅ **Character identical across all pages?**
✅ **Objects identical across all appearances?**
✅ **Eyes simple ovals (no detail)?**
✅ **Actions match story text?**
✅ **No text in images?**

**If FAIL:**
- Identify which images failed and why
- Update prompts for failing images only
- Regenerate ONLY the failing images
- Re-run Step 5 on regenerated images

**If PASS:** Proceed to Step 6.

---

## STEP 6: Book Assembly

**Skill:** `.claude/skills/book-template-designer/SKILL.md`
**Who:** book-template-designer (via `scripts/generate_pilot_books.py`)
**Input:** Story dict + approved images
**Output:** PDF + debug HTML

### What Happens:
1. Load story data
2. Load images (base64 embed)
3. Render Jinja2 template (`book_templates/book.html`)
4. Save debug HTML
5. Convert HTML to PDF via Playwright

### Script:
```bash
cd C:\Users\ASUS\myphonicsbooks\myphonicsbooks
py -3.12 scripts/generate_pilot_books.py L1
```

### Output:
```
output/books/
├── The_Hat_in_the_Pit_Book1_Level1.pdf
└── debug_The_Hat_in_the_Pit_L1.html
```

---

## STEP 7: Final QA (CRITICAL)

**Skill:** `.claude/skills/book-assessor/SKILL.md` (Step 6 methodology)
**Who:** book-assessor
**Input:** PDF + debug HTML + all images
**Output:** Final PASS or FAIL verdict

### MANDATORY: Visual Verification (Again)

**You MUST READ all images AGAIN + parse debug HTML:**

```python
# Re-read ALL images
Read output/images/L1_B1/hero_reference.png
Read output/images/L1_B1/page1.png
... (all pages)

# Read debug HTML
Read output/books/debug_The_Hat_in_the_Pit_L1.html
```

### Mandatory Checks:

1. **Re-verify Text:** Run phonics decomposition again on final rendered text
2. **Re-verify Character Consistency:** VIEW all images, compare to hero
3. **Re-verify Object Consistency:** VIEW all images, check objects same across pages
4. **Re-verify Eye Style:** VIEW all character images, confirm simple ovals
5. **Visual Quality:** No text in images, art style consistent
6. **Page Layout (HTML):** Parse debug HTML, check text positioning, font size
7. **Cover & Structure (HTML):** Parse HTML, verify 16 pages, level colour, etc.
8. **Overall Quality:** "Would a parent be happy to print this?"
9. **Brand Guidelines:** Level colours, fonts, naming correct

### Checkpoint:
✅ **All words still decodable?**
✅ **Character identical across all pages?**
✅ **Objects identical across all appearances?**
✅ **Eyes simple ovals (no detail)?**
✅ **Layout correct in HTML?**
✅ **16-page structure complete?**
✅ **Professional quality?**

**If FAIL:**
- Identify which step introduced the failure
- Return to that step (e.g., Step 4 for image issues, Step 6 for layout issues)
- Fix the issue
- Restart workflow from that step

**If PASS:**
- Book is production-ready
- Deliver PDF to user

---

## Quick Reference: Which Skill When?

| You Need To... | Use This Skill |
|----------------|----------------|
| Run the full workflow end-to-end | **workflow-orchestrator** (`/create-book L1.3`) |
| Research a culture/country for a book | **cultural-researcher** (Step 0) |
| Write a decodable story | phonics-story-writer (Step 1) |
| Check story quality + cross-book variety | book-assessor (Step 2, Checks 1-3, 8-9) |
| Select/define character for a story | illustration-director (Step 2b) |
| Identify recurring objects | illustration-director (Step 3a) |
| Write image prompts | illustration-director (Step 3b) |
| Generate images with hero injection | art-generator (Step 4, via script) |
| Check if images are consistent + safe + modest | illustration-director (Step 5) |
| Assemble PDF from story + images | book-template-designer (Step 6, via script) |
| Final quality check (ALL 9 checks) | book-assessor (Step 7) |

---

## Common Failures and Fixes

| Failure | Step | Fix |
|---------|------|-----|
| Word not decodable | Step 2 | Return to Step 1, rewrite sentence |
| Story has no emotional arc | Step 2 | Return to Step 1, rewrite with engagement hooks |
| Object description differs between prompts | Step 3b | Update prompts to use identical object description |
| Character face changes between pages | Step 5 | Check hero reference clarity, regenerate failing images |
| Object colour changes between pages | Step 5 | Update prompts with exact object description, regenerate |
| Eyes show detail (irises, highlights) | Step 5 | Add stronger eye style emphasis to prompts, regenerate |
| Text appears in image | Step 5 | Add "No text" emphasis to prompts, regenerate |
| Layout broken in PDF | Step 7 | Check HTML template, verify image sizes |

---

## Non-Negotiable Rules

1. **ALWAYS read images before approving them.** Use the Read tool.
2. **ALWAYS define recurring objects ONCE** with exact visual description.
3. **ALWAYS verify object consistency visually** across all pages.
4. **NEVER skip checkpoints.** If a check fails, stop and fix.
5. **NEVER issue a PASS verdict without viewing images.**
6. **ALWAYS use British English** (colour, mum, favourite).
7. **ALWAYS prioritize story sense** over phonics perfection (majority decodable).

---

## End of Workflow

When Step 7 returns **PASS**, the book is ready for production.
