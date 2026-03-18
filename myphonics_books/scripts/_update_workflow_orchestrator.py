"""Temporary script to update workflow-orchestrator SKILL.md with new 3a/3b/3c/3d steps."""
import pathlib
import re

SKILL_PATH = pathlib.Path(r"C:/Users/ASUS/myphonicsbooks/myphonics_books/.claude/skills/workflow-orchestrator/SKILL.md")

content = SKILL_PATH.read_text(encoding="utf-8")

# 1. Update the workflow diagram
OLD_DIAGRAM = """STEP 0: Cultural Research → cultural-researcher skill
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
DONE: Production-ready PDF"""

NEW_DIAGRAM = """STEP 0: Cultural Research → cultural-researcher skill
   ↓
STEP 1: Story Writing → phonics-story-writer skill
   ↓
STEP 2: Story QA → book-assessor skill
   ↓ PASS
STEP 2b: Character Selection → illustration-director skill
   ↓
STEP 3a: Identification → illustration-director skill
          (recurring objects, distinct locations, secondary characters)
   ↓
STEP 3b: Reference Image Generation → illustration-director skill
          (hero, side char heroes, background plates, object references)
   ↓
STEP 3c: Injection Plan → illustration-director skill
          (scene-by-scene table: which references inject into which scene)
   ↓
STEP 3d: Scene Prompts → illustration-director skill
          (hero prompt + all scene prompts using injection plan)
   ↓
STEP 4: Image Generation → art-generator skill (via script, using injection plan)
   ↓
STEP 5: Image QA → illustration-director skill (READ all images)
   ↓ PASS
STEP 6: Book Assembly → book-template-designer skill (via script)
   ↓
STEP 7: Final QA → book-assessor skill (READ all images + HTML)
   ↓ PASS
DONE: Production-ready PDF"""

content = content.replace(OLD_DIAGRAM, NEW_DIAGRAM)

# 2. Replace STEP 3a section
OLD_3A = """## STEP 3a: Object Identification

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

**If ANY prompt fails → Rewrite before proceeding**"""

NEW_3A = """## STEP 3a: Identification

**Skill:** `.claude/skills/illustration-director/SKILL.md`
**Input:** Approved story + Cultural Brief
**Output:** Three lists — recurring objects, distinct locations, secondary characters

### What Happens:
Read through the entire story and identify:

**Recurring objects** — any physical prop appearing on 2+ pages:
- Define EXACT visual appearance: colour, size, style, material, key identifying features
- Example: "a traditional Trinidadian pirogue — blue wooden hull, red stripe along the side and on the sail"

**Distinct locations** — each separate setting used on 2+ pages:
- Define EXACT setting appearance: architecture, vegetation, sky, lighting, key props, time of day
- Example: "Gulf of Paria waterfront dock — wooden dock planks, brightly painted wooden houses (yellow, pink, turquoise) behind, royal palms, green-blue water, warm tropical overcast sky"

**Secondary characters** — any named character appearing on 2+ pages (not the main hero):
- Define EXACT appearance: age, skin tone (hex), hair (hex + style), full outfit every item
- Example: "Dad — Afro-Trinidadian man, skin #4E3222, very short close-cropped hair #0D0D0D, bright yellow waterproof fisherman's jacket, grey t-shirt, dark shorts, rubber boots"

---

## STEP 3b: Reference Image Generation

**Skill:** `.claude/skills/illustration-director/SKILL.md` (section 4.1-4.4)
**Input:** Identification lists from Step 3a + Cultural Brief
**Output:** All reference PNG files (hero, side chars, background plates, object refs)

### What Happens:
Generate ALL reference images BEFORE any scene images are created:

1. **Main hero reference** (`hero_reference.png`) — text-to-image with eye-style reference injected
2. **Side character hero references** — one per named secondary character (`side_[name]_reference.png`)
3. **Background plates** — one per distinct location on 2+ pages (`bg_[location].png`)
4. **Object references** — one per recurring prop (`obj_[name].png`)

### MANDATORY:
- Show main hero to user for approval before proceeding
- If skin tone wrong → use recolour mode (do NOT regenerate from scratch)
- If eyes wrong → strengthen eye reference injection, regenerate

### Checkpoint:
✅ Main hero approved by user?
✅ All named side characters have hero reference images?
✅ All multi-scene locations have background plate images?
✅ All recurring props have object reference images?

**Do NOT proceed to Step 3c until ALL reference images exist**

---

## STEP 3c: Injection Plan

**Skill:** `.claude/skills/illustration-director/SKILL.md` (section 4.5)
**Input:** All reference images from Step 3b + story page list
**Output:** Injection plan table (which references inject into which scene)

### What Happens:
Produce a table mapping every scene (cover + each page) to its required references:

| Scene | Main Hero | Side Char Refs | Background Plate | Object Refs |
|-------|-----------|----------------|-----------------|-------------|
| Cover | hero_reference | — | — | obj_[name] |
| Page 1 | hero_reference | — | bg_[location] | — |
| ... | ... | ... | ... | ... |

Rules:
- Every scene with main character: inject hero_reference
- Every scene with a named side character: inject their side_[name]_reference
- Every scene at a location with a background plate: inject bg_[location]
- Every scene where a recurring object appears: inject obj_[name]
- Multiple references can be injected simultaneously

### Checkpoint:
✅ Every page mapped in the table?
✅ Every reference image file listed actually exists?
✅ Plan reviewed and agreed before image generation starts?

**Do NOT proceed to Step 3d until injection plan is complete**

---

## STEP 3d: Scene Prompts

**Skill:** `.claude/skills/illustration-director/SKILL.md` (sections 4.6-4.7)
**Input:** Story + injection plan + Cultural Brief
**Output:** Scene prompts for cover + all pages

### What Happens:
- Write scene prompts, using the injection plan to know which references each scene receives
- Include eye style, art style, modesty, and "no text" in every prompt
- Verify Cultural Brief architectural/cultural details are in each relevant prompt

### Checkpoint:
✅ Every prompt aligned with injection plan?
✅ Action in each prompt matches story text exactly?
✅ Eye style in every prompt?
✅ Modesty standards in every prompt?
✅ "No text, words, or letters" in every prompt?

**If ANY prompt fails → Rewrite before proceeding**"""

content = content.replace(OLD_3A, NEW_3A)

# 3. Update STEP 4 to mention injection plan
OLD_STEP4_INTRO = """### What Happens:
1. **Load eye-style reference** from a previous approved book (e.g. `L4_1_B1/hero_reference.png`)
2. **Generate hero reference image** with eye reference injected + hex colour codes for skin/hair
3. **Show hero to user for approval** — MANDATORY checkpoint before proceeding
4. If skin tone wrong → use recolour mode (edit existing image, don't regenerate)
5. If eyes wrong → re-inject with stronger eye reference
6. Once hero approved → convert hero to base64
7. **Inject hero into each scene prompt** (image editing mode)
8. Save to `output/images/L{n}_{sub}_B{book}/`"""

NEW_STEP4_INTRO = """### What Happens:
1. **Load all reference images** (hero, side chars, background plates, objects) from Step 3b
2. **Load injection plan** from Step 3c — know which references go into which scene
3. **Generate cover and each scene** using image editing mode, injecting the correct references per the plan
4. Label each injected reference in the call (MAIN CHARACTER REFERENCE, SIDE CHARACTER REFERENCE, BACKGROUND REFERENCE, OBJECT REFERENCE)
5. Save to `output/images/L{n}_{sub}_B{book}/`

Note: Hero was already approved at Step 3b. Do NOT regenerate the hero here."""

content = content.replace(OLD_STEP4_INTRO, NEW_STEP4_INTRO)

# 4. Update MANDATORY section in STEP 4
OLD_MANDATORY = """### MANDATORY for hero generation:
- **Eye reference injection:** Always inject a previous book's hero as eye-style reference
- **Hex colour codes:** Always specify exact hex for skin (`#3A2518`) and hair (`#0D0D0D`) — never vague descriptions
- **No blush:** Always include "NO rosy cheeks, NO blush marks" in prompts
- **User approval:** ALWAYS show heroes and wait for user feedback before generating scenes"""

NEW_MANDATORY = """### MANDATORY for image generation:
- **Injection plan:** Always follow the injection plan from Step 3c — no improvising
- **Label every reference:** Label each injected image in the API call so the model knows its role
- **No blush:** Always include "NO rosy cheeks, NO blush marks" in prompts
- **Hex colour codes:** Never use vague colour descriptions — use hex codes from the character definitions"""

content = content.replace(OLD_MANDATORY, NEW_MANDATORY)

# 5. Update failure recovery table
OLD_FAILURE = "| Object inconsistency | Step 3b + Step 4 | Fix prompt, regenerate failing images |"
NEW_FAILURE = "| Object inconsistency | Step 3a + Step 3b | Generate object reference image; update injection plan; regenerate failing images |"
content = content.replace(OLD_FAILURE, NEW_FAILURE)

# 6. Update pre-flight checklist
OLD_PREFLIGHT = "- [ ] Inject eye-style reference image when generating heroes (use approved hero from any previous book)"
NEW_PREFLIGHT = """- [ ] Inject eye-style reference image when generating heroes (use approved hero from any previous book)
- [ ] Complete Step 3a identification (objects, locations, side characters) before any reference generation
- [ ] Generate ALL reference images (hero, side chars, background plates, objects) before any scene generation
- [ ] Produce injection plan table (Step 3c) before any scene generation"""
content = content.replace(OLD_PREFLIGHT, NEW_PREFLIGHT)

SKILL_PATH.write_text(content, encoding="utf-8")
print(f"Done. Wrote {len(content)} chars, {len(content.splitlines())} lines")
print("Checking key replacements:")
print("  3a section:", "STEP 3a: Identification" in content)
print("  3b section:", "STEP 3b: Reference Image Generation" in content)
print("  3c section:", "STEP 3c: Injection Plan" in content)
print("  3d section:", "STEP 3d: Scene Prompts" in content)
print("  diagram updated:", "STEP 3b: Reference Image Generation" in content)
