# MyPhonicsBooks — Master System Guide

Decodable phonics books for children aged 4–8. Every book is an open window to a different contemporary culture. Parents get a print-ready A5 PDF generated from templates.

**VISION:** Read `docs/VISION.md` for the full Open Window philosophy — why we combine decodable phonics with contemporary cultural diversity.

**CRITICAL CONSTRAINT:** Every word in a story **must be decodable** at the given level OR be a listed **tricky word** for that level. (See `data/graphemes_by_level.json` and `data/tricky_words_by_level.json`).

---

## 🚀 Quick Start

To create a book, use the master workflow orchestrator:

```
/create-book L1.3
/create-book L2.1 "The Lost Teddy"
/create-book L4.2
```

This single command executes all 9 steps with mandatory quality checkpoints. See `.claude/skills/workflow-orchestrator/SKILL.md` for full documentation.

**Manual workflow:** If you need to run individual steps (debugging, testing), follow the workflow table below.

---

## Master Book Production Workflow

You **must** use the appropriate skill for each step in this pipeline. **Every checkpoint is mandatory** — do NOT skip visual verification steps.

| Step | Task | Target Skill | Checkpoint | Output |
| :--- | :--- | :--- | :--- | :--- |
| **0** | Cultural Research | **`cultural-researcher`** 🌍 | ✅ Stereotype check, internal consistency, dignity check | Cultural Brief |
| **1** | Story Writing | **`phonics-story-writer`** ⭐ | None | Story dict (text, words, questions) |
| **2** | Story QA | **`book-assessor`** ✅ | ✅ Phonics accuracy (CHECK 1,2,3,8,9), engagement hooks | PASS/FAIL verdict |
| **2b** | Character Selection | **`illustration-director`** 📸 | ✅ Outfit suits story context + cultural brief | Character description |
| **3a** | Object Identification | **`illustration-director`** 📸 | None | Recurring objects with exact visual descriptions |
| **3b** | Image Prompts | **`illustration-director`** 📸 | ✅ Object descriptions identical across all prompts | Hero prompt + scene prompts |
| **4** | Image Generation | **`art-generator`** 🎨 | None | Hero reference + all scene PNGs |
| **5** | Image QA | **`illustration-director`** 📸 | ✅ **MUST READ all images**, verify eyes/modesty/safety/consistency | PASS/FAIL, regenerate if needed |
| **6** | Book Assembly | **`book-template-designer`** 📄 | None | PDF + debug HTML |
| **7** | Final QA | **`book-assessor`** ✅ | ✅ **ALL 9 checks**, **READ all images + HTML**, compare to ultimate template | Final PASS/FAIL verdict |

### Mandatory Checkpoints Explained

**Step 2 (Story QA):** Run phonics decomposition on every word. Verify engagement hooks present. Check narrative makes sense.

**Step 3a (Object Identification):** Analyze story text to find recurring objects (hat, toy, pet, vehicle, etc.). Define exact visual description ONCE for each object.

**Step 3b (Prompt QA):** Cross-check all prompts. If "red knitted beanie with white pom-pom" is the hat description, it MUST appear identically in EVERY prompt where the hat appears.

**Step 5 (Image QA):** **CRITICAL** — Use Read tool to VIEW every image file. Compare visually:
- Character face/outfit/hair same in all pages?
- Key objects (hat, toy, etc.) same colour/style in all appearances?
- Eyes simple ovals with solid fill (no detail)?
If ANY fail → regenerate specific images, re-verify.

**Step 7 (Final QA):** **CRITICAL** — Use Read tool to VIEW all images AGAIN + parse debug HTML:
- Re-verify character consistency
- Re-verify object consistency
- Check layout/structure in HTML
- Final visual quality check
If ANY fail → return to appropriate step, fix, restart from there.

---

## ⭐ CRITICAL: Story Writing Must Be Engaging

**Phonics compliance is NOT enough.** Every story must:
- Have a clear **emotional journey** (problem → tension → satisfying resolution)
- Use **Dear Zoo-style engagement hooks** (page-turn cliffhangers, curiosity gaps, repetition with variation)
- Create a **"want to know what happens next"** feeling on every page
- Deliver a **payoff that feels earned** by the build-up

**Bad L1 example:** "I dig in the mud. I hit a thing. It is a shell." ← Phonically perfect, narratively flat.

**Good L1 example:** "I had no hat. I was sad. (page turn) → I got Dad's hat. It was BIG! (page turn) → It fell off. No! (page turn) → Then Nan got me THIS hat. It fit!" ← Emotional stakes, pattern, payoff.

➡️ **Always consult `.claude/skills/phonics-story-writer/SKILL.md` before writing stories.** It contains the full engagement framework.

---

## 🎨 CRITICAL: Hero Injection for Character Consistency

**The art-generator skill MUST be followed for every book.** Text prompts alone will fail. Character consistency is achieved mechanically through **hero image injection**, not text descriptions.

### The Hero Injection Pipeline (Mandatory)

```
STEP 1  Generate hero reference image (text-to-image, neutral pose, full body)
        ↓
STEP 2  Review hero (eyes, outfit, proportions) — FAIL → regenerate
        ↓
STEP 3  Remove background (isolate character with transparent PNG)
        ↓
STEP 4  Upload hero reference (get persistent URL)
        ↓
STEP 5  For EVERY scene: inject hero reference + scene prompt → generate image
        ↓
STEP 6  Verify each scene (character match, action match, eye style)
        ↓
STEP 7  Cross-page consistency check (all scenes together)
        ↓
STEP 8  Deliver final images
```

### Why This Matters

Without hero injection:
- ❌ Eyes change style between pages (detailed irises on page 1, solid ovals on page 6)
- ❌ Art style drifts (watercolour page 1, flat vector page 8)
- ❌ Character appearance shifts (different hair, outfit colours change)
- ❌ Object consistency fails (the shell changes shape/colour)

With hero injection:
- ✅ Same character face, outfit, proportions across all pages
- ✅ Same art style throughout
- ✅ Eye style remains consistent (small simple ovals)
- ✅ Objects and settings remain visually consistent

➡️ **The hero reference image is generated ONCE, then injected into EVERY scene.** Do NOT regenerate the hero between pages.

➡️ **Always consult `.claude/skills/art-generator/SKILL.md` before generating images.** It contains the full pipeline with all quality checks.

---

## How to Use Skills

### When Writing Stories
1. **READ** the phonics-story-writer skill first to understand the engagement framework
2. **APPLY** the techniques (Dear Zoo hooks, emotional stakes, page-turn cliffhangers)
3. **VERIFY** every word is decodable using the skill's checklists
4. If stuck or the user requests a full story generation → **INVOKE** `/phonics-story-writer` skill

### When Generating Images
1. **READ** the art-generator skill to understand the hero injection pipeline
2. **GENERATE** the hero reference FIRST (Step 1-4 in the pipeline)
3. **INJECT** the hero into every scene (Step 5)
4. **VERIFY** each scene matches the story text exactly (Step 6-7)
5. If the user reports consistency issues → check which step was skipped

### When Assembling Books
1. **READ** the book-template-designer skill for template structure
2. **VERIFY** all required data is present (story text, images, graphemes, tricky words)
3. **RUN** the PDF generation script with the correct book data

### Additional Reference Skills
Review these skills for pedagogy and overarching logic:
- **Phonics Pedagogy:** `.claude/skills/phonics-expert/SKILL.md`
- **Leveling/RWI Mapping:** `.claude/skills/rwi-knowledge-specialist/SKILL.md`
- **Data Engineering:** `.claude/skills/phonics-data-engineer/SKILL.md`
- **Parent Assessment UX:** `.claude/skills/assessment-funnel/SKILL.md` and `.claude/skills/assessment-specialist/SKILL.md`

---

## Curriculum Ladder (Complete)

Each level introduces new sounds. Books at each level are numbered to ensure systematic coverage.

### Level 1: Starting Stories (COMPLETE — 10 books)
| Sub | Focus Sounds | Title | Status |
|-----|--------------|-------|--------|
| L1.1 | s, a, t, p, i, n | Tap! Tap! Tap! | ✅ |
| L1.2 | m, d, g, o | The Mud on the Dog | ✅ |
| L1.3 | sh, nk | The Fish in the Tank | ✅ (ULTIMATE) |
| L1.4 | c, k, ck, e | The Red Socks | ✅ |
| L1.5 | u, r, h, b | Run, Pup, Run! | ✅ |
| L1.6 | f, l, ff, ll | Fox Fell Off! | ✅ |
| L1.7 | j, v, w | The Jam Jug | ✅ |
| L1.8 | x, y, z | The Yak and the Box | ✅ |
| L1.9 | ch, th | Chop, Chop, Chop! | ✅ |
| L1.10 | ng, qu, ss, zz | Buzz and Sing! | ✅ |

### Level 2: Longer Sounds (5 books needed)
| Sub | Focus Sounds | Title | Status |
|-----|--------------|-------|--------|
| L2.1 | ay, ee, igh | The Night Light | ✅ |
| L2.2 | ow, oo | Moo at the Zoo / The Shadow Show | ✅ |
| L2.3 | ar, or | | 🔄 In progress |
| L2.4 | air, ir | The Fair in the Air | ✅ |
| L2.5 | ou, oy | | 🔲 |

### Level 3: New Spellings (5 books needed)
| Sub | Focus Sounds | Title | Status |
|-----|--------------|-------|--------|
| L3.1 | a-e, i-e | The Big Bike Race | ✅ |
| L3.2 | o-e, u-e | | 🔲 |
| L3.3 | ea, ie | | 🔲 |
| L3.4 | oi, aw | | 🔲 |
| L3.5 | ai, oa | | 🔲 |
**Note:** Consonant clusters unlocked at L3

### Level 4: Building Fluency (4 books needed)
| Sub | Focus Sounds | Status |
|-----|--------------|--------|
| L4.1 | ur, er | 🔲 |
| L4.2 | are, ow (cow) | 🔲 |
| L4.3 | ew, ue | 🔲 |
| L4.4 | review | 🔲 |

### Level 5: Reading Together (4 books needed)
| Sub | Focus Sounds | Status |
|-----|--------------|--------|
| L5.1 | ire, ore | 🔲 |
| L5.2 | ear, oor | 🔲 |
| L5.3 | ure, tion | 🔲 |
| L5.4 | review | 🔲 |

### Level 6: Reading Champion (4 books needed)
| Sub | Focus Sounds | Status |
|-----|--------------|--------|
| L6.1 | ous | 🔲 |
| L6.2 | able, ible | 🔲 |
| L6.3 | cious, tious | 🔲 |
| L6.4 | review | 🔲 |

---

## The 6 Reading Levels (Quick Reference)

*(Always consult the JSON data files for the exact graphemes and tricky words)*

| Level | Name | Colour | Books | Key Feature |
|-------|------|--------|-------|-------------|
| **L1** | Starting Stories | `#E84B8A` Pink | 10 | All Set 1 (36 graphemes). NO clusters. 6 story pages (ditty). |
| **L2** | Longer Sounds | `#F59E0B` Amber | 5 | Long vowels (ay, ee, igh, ow, oo, ar, or, air, ir, ou, oy). NO clusters. 8 pages. |
| **L3** | New Spellings | `#22C55E` Green | 5 | Split digraphs (a-e, i-e, o-e, u-e). **Clusters unlocked.** 8 pages. |
| **L4** | Building Fluency | `#3B82F6` Blue | 4 | Complex vowels (are, ur, er, ew, ue, ow-cow). Multi-syllable. 8 pages. |
| **L5** | Reading Together | `#8B5CF6` Purple | 4 | Final Set 3 (ore, oor, ire, ear, ure, tion). Comprehension focus. 8 pages. |
| **L6** | Reading Champion | `#14B8A6` Teal | 4 | Suffixes (ous, cious, tious, able, ible). Independent reading. 8 pages. |

**Font sizes:** L1=26pt, L2=22pt, L3=20pt, L4=18pt, L5=16pt, L6=14pt

### Level 1 Progressive Sub-Levels (MAJORITY Decodable Approach)

Level 1 books introduce sounds progressively, NOT all 36 graphemes at once:

- **L1.1 (SATPIN focus):** Focus sounds: s, a, t, p, i, n. These should appear in MOST words. Tricky words: flexible — use whatever makes the story work (I, a, the, to, no, go, into, have, has, see, happy, etc.).
- **L1.2 (Add consonants):** Focus: m, d, g, c, k, ck, e, u, r, h, b, f, ff, l, ll, ss. Tricky words: flexible.
- **L1.3 (Add digraphs):** Focus: j, v, w, x, y, z, zz, qu, ch, sh, th, ng, nk. Complete Set 1.

**Key principle:** The focus sounds should appear FREQUENTLY (majority decodable). Tricky words are used freely to maintain narrative sense. A good story with flexible tricky word use beats a nonsensical story with strict phonics constraints.

---

## The 16-Page Book Structure

```
Page  1   Front Cover — level colour, brand, sounds row, illustration, title
Page  2   Guide for Grown-Ups — before/during/after tips
Page  3   Combined Reference — phonics chart (circled focus), story words, tricky words
Pages 4–11   Story (6 or 8 pages) — Text on top (~25%), illustration below (~75%)
Page 12   Combined Activity — questions, "Can You Read?", "Draw Your Favourite Part"
Page 13   Writing Practice — 4-line handwriting system with trace letters
Page 14   Nonsense Words Challenge — CVC pseudo-words for Phonics Screening Check prep
Page 15   Reading Star Certificate — "I Read a Book!" with name/date lines
Page 16   Back Cover — brand, age/year, description, 6-level series grid
```

**Story pages:** L1 = 6 pages (ditty template). L2-L6 = 8 pages (standard template).

---

## PDF Generation Pipeline

```
generate_book.py → Jinja2 (book_templates/book.html) → Playwright → A5 PDF
```

| Component | File | Purpose |
|-----------|------|---------|
| Template | `book_templates/book.html` | Jinja2 HTML/CSS — all 16 page types in one file |
| Generator | `generate_book.py` | Python — renders template + converts to PDF |
| Font | `assets/fonts/Andika-*.ttf` | SIL Andika — single-storey 'a' and 'g' for literacy |
| Output | `output/books/` | Generated PDFs |
| Images | `output/images/L{n}_B{book}/` | Hero reference + cover + page1-page8 |

---

## Quick Start CLI

```bash
cd C:\Users\ASUS\myphonicsbooks\myphonicsbooks

# Generate images (hero + all scenes)
py -3.12 scripts/generate_flux_images.py L1       # Generate all L1 images
py -3.12 scripts/generate_flux_images.py L1 hero  # Regenerate hero only

# Generate PDF (requires images in output/images/)
py -3.12 scripts/generate_pilot_books.py L1       # Generate L1 PDF
```

---

## Key Design Decisions

1. **Text on top of story pages** — child reads first, then looks at picture (matches openClaw reference)
2. **Hero injection for images** — ONE character reference reused across all pages for consistency
3. **Combined reference page** — phonics + story words + tricky words on ONE page
4. **Combined activity page** — questions + read words + draw on ONE page
5. **4-line handwriting system** — ascender (dotted), x-height (solid), baseline guide (dotted), baseline (solid)
6. **Nonsense Words page** — directly prepares for UK Year 1 Phonics Screening Check
7. **Certificate page** — positive reinforcement; child signs their name
8. **Story Words (not all decodable words)** — focused subset that appears multiple times in the story

---

## Ultimate Template Reference

**Location:** `output/books/ultimate_templates/`

The first book at each level that passes all quality checks becomes the "ultimate template" for that level — the gold standard all subsequent books must match.

**Current ultimate templates:**
- **L1:** `L1_The_Fish_in_the_Tank_ULTIMATE.pdf` ✅
- **L2-L6:** First book to pass becomes the ultimate

**At Step 7 (Final QA), you MUST:**
1. Read `output/books/ultimate_templates/ULTIMATE_TEMPLATE.md`
2. Compare the new book against the ultimate template for:
   - Story emotional journey quality
   - Tricky words display (actual words used, not cumulative)
   - Focus sounds display (actual sounds used)
   - Image quality and character consistency
   - Professional finish

---

## Project Structure

```
myphonicsbooks/
├── CLAUDE.md                      ← This file (master guide)
├── WORKFLOW_COMPLETE.md           ← Detailed step-by-step workflow guide
├── docs/VISION.md                 ← The Open Window vision & philosophy
├── PRODUCTION_CHECKLIST.md        ← Tracks completed books and curriculum coverage
├── data/                          ← All phonics knowledge
│   ├── graphemes_by_level.json    ← Definitive grapheme lists per level
│   ├── tricky_words_by_level.json ← Definitive tricky word lists per level
│   ├── story_summaries.json       ← Curriculum structure + book planning
│   └── *_story_*.py               ← Individual story data files (L1 complete)
├── .claude/skills/                ← 12 specialist skills
│   ├── workflow-orchestrator/     🎯 Master 9-step production pipeline
│   ├── cultural-researcher/       🌍 Pre-production cultural research
│   ├── phonics-story-writer/      ⭐ Story writing with engagement hooks
│   ├── art-generator/             🎨 Hero injection image pipeline
│   ├── illustration-director/     📸 Character selection, prompts, image QA
│   ├── book-assessor/             ✅ Quality gatekeeper (9 checks + vibe)
│   ├── book-template-designer/    📄 PDF assembly
│   ├── phonics-expert/            📚 Pedagogy reference
│   ├── rwi-knowledge-specialist/  🎯 RWI-to-MPB mapping
│   ├── phonics-data-engineer/     🗂️ Data structure guide
│   ├── assessment-specialist/     🧪 Diagnostic assessment logic
│   └── assessment-funnel/         💰 Marketing/conversion UX
├── scripts/                       ← Generation scripts
│   ├── generate_gemini_images.py  ← Gemini hero injection pipeline
│   └── generate_pilot_books.py    ← PDF generation
├── templates/                     ← Jinja2 HTML/CSS templates
│   ├── book_ditty.html            ← L1 template (12 pages, 6 story)
│   └── book.html                  ← L2-L6 template (16 pages, 8 story)
├── output/
│   ├── images/L{n}_{sub}_B{book}/ ← Generated images (hero + scenes)
│   └── books/
│       ├── Level1/ through Level6/ ← Production PDFs by level
│       └── ultimate_templates/    ← Gold standard reference books
└── assets/fonts/                  ← Andika font files
```

---

## British English Throughout

- colour (not color)
- organised (not organized)
- mum (not mom)
- favourite (not favorite)

**Font:** Andika (SIL International) — single-storey 'a' and 'g' for beginning readers.

---

## Important Notes

- We are **NOT Read Write Inc** — own terminology, own levels, based on Letters and Sounds (public domain)
- API keys were exposed in .env — user should rotate them
- Python 3.12 required for all scripts
- Complete documentation: `docs/MYPHONICSBOOKS_COMPLETE_GUIDE.md`
