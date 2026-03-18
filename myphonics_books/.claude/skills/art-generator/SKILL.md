---
name: Art Generator
description: End-to-end illustration generation skill for MyPhonicsBooks. Manages the hero-first character injection pipeline to guarantee visual consistency across all pages of a book. Covers hero generation, background removal, scene composition, and cross-page verification. Works with Flux Kontext Pro (primary) and Gemini Imagen (fallback).
---

# Art Generator — MyPhonicsBooks

You are the art generation engine for MyPhonicsBooks. Your job is to produce a complete, visually consistent set of illustrations for a single book. Character consistency is achieved mechanically through **hero image injection**, not through text prompts alone. Text prompts alone will fail. The hero image must be generated first, then injected into every subsequent scene.

---

## 1. The Hero Injection Pipeline (MANDATORY)

This is the core workflow. Every book follows these steps in exact order. Do not skip steps. Do not generate scene images without a hero reference.

```
STEP 1  Generate hero reference image (text-to-image)
        ↓
STEP 2  Review hero image (character match, eye style, proportions)
        ↓  FAIL → regenerate with adjusted prompt
STEP 3  Remove background from hero image (isolate character)
        ↓
STEP 4  Upload hero reference to image storage (get persistent URL)
        ↓
STEP 5  For each scene: inject hero reference + scene prompt → generate image
        ↓
STEP 6  Verify each scene (character match, action match, consistency)
        ↓  FAIL → adjust scene prompt → regenerate that scene only
STEP 7  Cross-page consistency check (all scenes together)
        ↓  FAIL → identify drift → regenerate affected scenes
STEP 8  Deliver final images
```

### Why Hero Injection Works

When you generate images from text prompts alone, the AI interprets character descriptions differently each time. The character's face, proportions, outfit colours, and pose will vary across pages. This is unacceptable for a children's book.

Hero injection solves this by giving the image model a **visual reference** of the exact character. The model uses the reference image to maintain the character's appearance while placing them in new scenes and poses. The reference image is the single source of truth for what the character looks like.

---

## 2. Step-by-Step Workflow

### Step 1: Generate Hero Reference Image

**Purpose:** Create a single, clean, full-body portrait of the book's character that will be used as the visual anchor for all subsequent images.

**Engine:** Text-to-image with eye-style reference injection (Gemini primary, Flux Dev fallback)

#### MANDATORY: Eye Style Reference Injection

**NEVER generate a hero from text alone.** Always inject a previous book's hero image as an eye-style reference. This is the only reliable way to get correct solid black dot eyes.

**Eye reference image:** Use any approved hero from a previous book (e.g. `output/images/L4_1_B1/hero_reference.png`). The specific character doesn't matter — only the eye style is being referenced.

**Gemini prompt structure with eye reference:**
```python
parts = [
    {"text": "EYE STYLE REFERENCE — The new character MUST have the EXACT same eye style as this character. Look at the eyes: they are tiny solid black dots with no white highlights, no reflections, no detail. Copy this eye style exactly:"},
    {"inlineData": {"mimeType": "image/png", "data": eye_ref_b64}},
    {"text": f"Now generate a NEW character (different person, different outfit) but with the SAME tiny solid black dot eye style as the reference above. Here is the character to generate: {full_prompt}"},
]
```

#### MANDATORY: Hex Colour Codes for Skin and Hair

**NEVER use vague descriptions like "dark brown skin".** AI models interpret these inconsistently. Always specify exact hex colour codes.

**Prompt must include:**
```
Skin colour: [HEX] (description). Hair colour: [HEX] (description).
The skin must be darker than [lighter hex] and lighter than [hair hex].
```

**Example hex values for reference:**
| Skin Tone | Skin Hex | Hair Hex | Description |
|-----------|----------|----------|-------------|
| Very dark (West African) | `#3A2518` | `#0D0D0D` | Dark chocolate, near-black hair |
| Dark (East African) | `#4E3524` | `#0D0D0D` | Rich brown, black hair |
| Medium-dark (South Asian) | `#8B6B4A` | `#1A1A1A` | Warm brown, very dark hair |
| Medium (Mediterranean) | `#B8956A` | `#2C1810` | Golden brown, dark brown hair |
| Light-medium (East Asian) | `#D4A574` | `#1A1110` | Warm tan, near-black hair |
| Light (Northern European) | `#F0D0B0` | `#8B6B3D` | Peach, sandy brown hair |

#### Recolour Step (if skin tone is wrong after generation)

If the hero is generated but the skin tone is too light/dark, use Gemini's image editing to recolour WITHOUT regenerating:

```python
parts = [
    {"inlineData": {"mimeType": "image/png", "data": hero_b64}},
    {"text": f"Edit this character image. Change ONLY the skin colour to {SKIN_HEX} and hair colour to {HAIR_HEX}. Keep everything else EXACTLY the same — same pose, outfit, eyes, expression, background."},
]
```

This preserves the character design (eyes, outfit, pose) while fixing only the skin/hair colour.

**Text prompt structure:**
```
A cartoon [girl/boy] character, about [age] years old, with skin colour [HEX] ([description]) and [hair description] in colour [HEX].
[She/He] wears [full outfit description from character roster].
[She/He] has small friendly dot eyes, solid black filled circles with ZERO white — no highlight, no reflection, no shine. Just solid black circles like ink dots.
A [expression]. ABSOLUTELY NO rosy cheeks, NO blush marks, NO pink or red circles on face — clean smooth skin on cheeks.
Standing in a neutral pose, facing the viewer, full body visible from head to toe.
Arms slightly away from body, feet shoulder-width apart.
Plain light cream solid-colour background (no scenery, no objects, no patterns).
Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds,
clean black-outlined characters, warm friendly atmosphere, soft pastel colours, simple rounded shapes,
gentle lighting. No text, words, or letters in the image.
```

**Critical details for the hero prompt:**
- **Eye style reference image injected** — MANDATORY, never skip
- **Hex colour codes for skin and hair** — MANDATORY, never use vague descriptions
- **Neutral pose facing viewer** — arms visible, not hidden behind body
- **Full body from head to toe** — no cropping at feet or head
- **Plain background** — a solid light colour, nothing else. This makes background removal clean.
- **Arms away from body** — visible separation between arms and torso for cleaner extraction
- **No objects in hands** — the hero reference is the character alone
- **No blush marks** — explicitly state "NO rosy cheeks, NO blush marks"

**Resolution:** 768 x 1024 pixels (portrait, 3:4 ratio)

**Flux Dev settings:**
```python
fal_client.subscribe("fal-ai/flux/dev", arguments={
    "prompt": full_prompt,
    "image_size": {"width": 768, "height": 1024},
    "num_images": 1,
    "output_format": "png",
    "guidance_scale": 4.0,
    "num_inference_steps": 28,
})
```

**Gemini Imagen settings:**
```python
# POST to https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict
{
    "instances": [{"prompt": full_prompt}],
    "parameters": {"sampleCount": 1, "aspectRatio": "3:4"}
}
```

### Step 2: Review Hero Image

Before proceeding, visually verify the hero image against this checklist:

- [ ] **Skin tone:** Matches the target hex colour (not too light, not too dark, no blue/grey tint)
- [ ] **Eyes:** Solid black dots with NO white highlights, reflections, or detail. Compare against the eye reference image used in Step 1.
- [ ] **No blush:** NO rosy cheeks, NO pink/red circles on face — clean smooth skin
- [ ] **Face:** Matches the character description (hair style, hair colour)
- [ ] **Outfit:** Correct colours and garments
- [ ] **Proportions:** Child-like, slightly stylised (larger head, rounded features), age-appropriate
- [ ] **Full body:** Head to toe visible, no cropping
- [ ] **Background:** Plain, clean, easy to remove
- [ ] **No text:** No words, letters, or numbers in the image
- [ ] **Art style:** Cartoon with clean outlines, watercolour feel. Not photorealistic, not 3D, not anime.

**If ANY check fails — use the targeted fix, don't regenerate from scratch:**

| Failure | Fix |
|---------|-----|
| Eyes have white highlights | Re-inject with stronger eye reference + "ZERO white in eyes" |
| Skin tone too light | Use recolour mode with darker hex value (do NOT regenerate) |
| Skin has blue/grey tint | Use recolour mode with warm brown hex, remove all "blue-black" language |
| Blush marks on cheeks | Regenerate with "ABSOLUTELY NO rosy cheeks, NO blush marks, NO pink or red circles on face" |
| Character too realistic | Add: "2D cartoon illustration, NOT photorealistic, NOT 3D rendered" |
| Background too complex | Add: "Plain single-colour background only, no scenery, no patterns, no objects" |
| Feet cut off | Add: "Zoomed out to show COMPLETE full body including shoes/feet touching the ground" |
| Arms hidden | Add: "Arms slightly away from body, both hands visible at sides" |

**Maximum 3 attempts per issue. Show hero to user for approval BEFORE generating scenes.**

### Step 3: Remove Background

**Purpose:** Isolate the character from the background so the injection into scenes is cleaner. The model needs a clear character reference, not a character embedded in a scene.

**Method (Python with rembg):**
```python
from rembg import remove
from PIL import Image
import io

# Load hero image
hero_image = Image.open("hero_reference.png")

# Remove background
hero_nobg = remove(hero_image)

# Save with transparent background
hero_nobg.save("hero_reference_nobg.png")
```

**Alternative method (if rembg unavailable):**
```bash
pip install backgroundremover
backgroundremover -i hero_reference.png -o hero_reference_nobg.png
```

**Alternative method (API-based):**
```python
# Use remove.bg API or similar service
import requests
response = requests.post(
    "https://api.remove.bg/v1.0/removebg",
    files={"image_file": open("hero_reference.png", "rb")},
    data={"size": "auto"},
    headers={"X-Api-Key": REMOVE_BG_KEY},
)
with open("hero_reference_nobg.png", "wb") as f:
    f.write(response.content)
```

**When background removal is not possible:**
If no background removal tool is available, proceed with the original hero image. The plain background from Step 1 will still work as a reference — it is just less ideal. The key is that the hero image exists and is passed to the scene generator.

**Quality check after removal:**
- [ ] Character fully intact (no missing limbs, hair, or clothing edges)
- [ ] Clean edges (no background artifacts or fringing)
- [ ] Transparent background (PNG with alpha channel)

### Step 4: Upload Hero Reference

**Purpose:** Make the hero image available via URL so it can be passed to the scene generation engine as a reference.

**Flux (fal.ai):**
```python
import fal_client

reference_url = fal_client.upload_file("hero_reference_nobg.png")
# Returns a URL like: https://fal.media/files/...
```

**Gemini:**
Gemini's image editing API accepts base64-encoded images inline. Convert the hero to base64:
```python
import base64

with open("hero_reference_nobg.png", "rb") as f:
    hero_base64 = base64.b64encode(f.read()).decode("utf-8")
```

**Store the reference for the entire book generation session.** Every scene prompt will use this same reference. Do not regenerate or re-upload between scenes.

### Step 5: Generate Scene Images (With Hero Injection)

For each story page (and the cover), generate an illustration by passing BOTH the hero reference AND a scene-specific prompt.

#### Flux Kontext Pro (Primary Engine)

```python
result = fal_client.subscribe("fal-ai/flux-pro/kontext", arguments={
    "prompt": scene_prompt,
    "image_url": reference_url,  # ← THIS IS THE INJECTION
    "num_images": 1,
    "output_format": "png",
    "guidance_scale": 3.5,
    "safety_tolerance": "5",
})
```

The `image_url` parameter is the hero injection. Kontext Pro uses this reference image to maintain the character's appearance while generating the new scene described in the prompt.

#### Gemini (Fallback Engine — Image Editing Mode)

```python
# Use Gemini's image editing to place the character in a scene
# POST to models/gemini-2.0-flash:generateContent (or equivalent)
{
    "contents": [{
        "parts": [
            {"inlineData": {"mimeType": "image/png", "data": hero_base64}},
            {"text": scene_prompt}
        ]
    }],
    "generationConfig": {"responseModalities": ["image", "text"]}
}
```

If Gemini's image editing mode is unavailable, use Gemini Imagen with the full character description repeated in every scene prompt. This is the weakest approach for consistency but is the fallback of last resort.

#### Scene Prompt Structure

Every scene prompt follows this format:

**Cover (portrait, 3:4):**
```
Show the character from the reference image [EXACT action related to the story's climax or theme].
[Setting description]. [Key object description if applicable].
[Expression and body language].
Same character, same outfit, same appearance as reference.
Small simple oval eyes with solid dark fill.
Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds,
clean black-outlined characters. No text, words, or letters in the image.
Portrait format.
```

**Story pages (landscape, 4:3):**
```
Show the character from the reference image [EXACT action from story text for this page].
[Specific visible details: what they are holding, what is nearby].
[Setting: described consistently with other pages].
[Expression matching the story mood].
Same character, same outfit, same appearance as reference.
Small simple oval eyes with solid dark fill.
Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds,
clean black-outlined characters. No text, words, or letters in the image.
Landscape format.
```

**Critical prompt rules:**
- Always include "the character from the reference image" or equivalent phrasing
- Always include "Same character, same outfit, same appearance as reference"
- The action MUST match the story text word-for-word (see Section 4)
- Always end with "No text, words, or letters in the image"
- Always include the eye style reminder: "Small simple oval eyes with solid dark fill"

#### Object and Setting Consistency

Before writing any scene prompts, define the key objects and setting ONCE:

```
KEY OBJECT: [exact description, e.g. "a large pale cream spiral shell with pink tones and a visible spiral pattern"]
SETTING: [exact description, e.g. "a sunny green garden with colourful orange and yellow flowers, warm light, and a muddy patch of brown earth"]
```

Use these EXACT phrases in every prompt where the object or setting appears. Do not paraphrase. Do not vary the description.

### Step 6: Verify Each Scene Image

After generating each scene, check:

- [ ] **Character match:** Face, hair, clothes, proportions match the hero reference
- [ ] **Eye style:** Small oval, solid fill. NOT detailed eyes with irises or highlights.
- [ ] **Action match:** Character is doing what the story text says for this page
- [ ] **Object match:** Key objects (shell, doll, bike, etc.) look the same as defined
- [ ] **Setting match:** Background and location are consistent with other pages
- [ ] **No text:** No words, letters, or numbers in the image
- [ ] **Art style:** Cartoon with watercolour backgrounds and outlined characters
- [ ] **Appropriate:** Suitable for children aged 4 to 8

**If a scene fails:**
- Adjust only the scene prompt (do NOT regenerate the hero)
- Add emphasis to the failing element in the prompt
- Regenerate that scene only
- Maximum 2 retries per scene

### Step 7: Cross-Page Consistency Check

After all scenes are generated, lay them out side by side and verify:

- [ ] Same character face across all pages
- [ ] Same outfit colours across all pages (no colour shifts)
- [ ] Same hairstyle across all pages
- [ ] Same age and proportions across all pages
- [ ] Key objects consistent in colour, shape, and size across all appearances
- [ ] Setting consistent across story pages (same garden, same beach, etc.)
- [ ] Art style uniform — no mixing of styles between pages
- [ ] Eye style consistent — no pages where eyes suddenly have irises or highlights

**If drift is detected:**
- Identify which scenes have drifted from the hero reference
- Regenerate ONLY the drifted scenes using the same hero reference URL
- Do NOT regenerate the hero — that would make ALL images inconsistent

### Step 8: Deliver Final Images

Output the following files per book:

```
output/images/L{level}_B{book}/
├── hero_reference.png          # Original hero (keep for re-use)
├── hero_reference_nobg.png     # Background-removed hero (keep for re-use)
├── cover.png                   # 768 x 1024 (portrait)
├── page1.png                   # 1024 x 768 (landscape)
├── page2.png
├── page3.png
├── page4.png
├── page5.png
├── page6.png                   # L1 ends here (6 story pages)
├── page7.png                   # L2-6 continue
└── page8.png                   # L2-6 end here (8 story pages)
```

---

## 3. Character Selection (Two Modes)

### Mode A: Template Books (Current)
When creating template books (no personalisation), each STORY gets a UNIQUE character. This provides variety across the book collection.

**IMPORTANT:** Choose a character whose outfit and appearance SUITS the story context.
- Indoor story about cooking? → Don't use wellies and dungarees
- Outdoor adventure? → Don't use formal school clothes
- Summer outdoor story? → Use modest summer clothing (t-shirt, trousers/leggings)

**IMPORTANT - Halal Compliance:**
- NO shorts (use joggers, trousers, or leggings instead)
- NO swimwear or beachwear (use modest summer clothing)
- NO bare legs or revealing clothing
- All characters must wear modest, family-appropriate attire

### Mode B: Personalised Books (Future)
When personalisation is enabled, the customer uploads a photo of their child. That child becomes the character in EVERY page. The character roster below is NOT used.

---

## 3.1 Character Roster for Template Books

Each story should use a DIFFERENT character. Choose based on:
1. **Story context** — Does the outfit make sense for the setting?
2. **Diversity** — Mix genders, ethnicities, ages across the collection
3. **Level age** — Character age should roughly match the reader's age

### Indoor/Casual Characters

**CHAR-A: British-Asian girl (casual home)**
A cartoon girl character, about 5 years old, with warm brown skin, long straight black hair in two low bunches. She wears a soft pink t-shirt with a small flower print, comfortable blue joggers, and purple fluffy slippers. She has small simple oval eyes with solid dark fill (no detailed irises or highlights), a cheerful smile, and rosy cheeks.
*Best for:* Indoor stories, home settings, calm activities

**CHAR-B: White British boy (casual home)**
A cartoon boy character, about 5 years old, with light skin and short sandy brown hair with a side parting. He wears a green striped t-shirt, comfortable navy blue joggers, and cosy socks. He has small simple oval eyes with solid dark fill (no detailed irises or highlights), a friendly grin, and freckles.
*Best for:* Indoor stories, home settings, playful activities

**CHAR-C: Black British girl (smart casual)**
A cartoon girl character, about 6 years old, with dark brown skin and natural black hair in cute afro puffs with colourful bobbles. She wears a bright yellow cardigan over a white t-shirt, comfortable blue jeans, and white canvas shoes. He has small simple oval eyes with solid dark fill (no detailed irises or highlights), a bright curious expression, and rosy cheeks.
*Best for:* Indoor/outdoor, school, shops, visiting places

### Outdoor/Adventure Characters

**CHAR-D: British-Asian girl (outdoor adventure)**
A cartoon girl character, about 5 years old, with dark brown skin and short curly black hair. She wears a bright red jumper, dark blue denim dungarees, and blue wellies (wellington boots). She has small simple oval eyes with solid dark fill (no detailed irises or highlights), a cheerful smile, and rosy cheeks.
*Best for:* Outdoor stories, gardens, muddy play, farms, puddles

**CHAR-E: Mixed heritage boy (outdoor explorer)**
A cartoon boy character, about 6 years old, with light brown skin and thick curly brown hair. He wears an orange waterproof jacket, dark green cargo trousers, and brown hiking boots. He has small simple oval eyes with solid dark fill (no detailed irises or highlights), an adventurous expression, and rosy cheeks.
*Best for:* Nature walks, forest, park adventures, exploring

**CHAR-F: Muslim girl (rainy day)**
A cartoon girl character, about 6 years old, with warm brown skin and a soft lilac hijab. She wears a bright yellow raincoat over a purple dress, and red wellies. She has small simple oval eyes with solid dark fill (no detailed irises or highlights), a curious smile, and rosy cheeks.
*Best for:* Rainy day stories, autumn, puddles, weather themes

### Summer/Outdoor Characters (Modest)

**CHAR-G: White British boy (summer outdoor)**
A cartoon boy character, about 5 years old, with light skin, blonde hair, and a sun hat. He wears a light blue t-shirt, comfortable beige trousers, and sandals. He has small simple oval eyes with solid dark fill (no detailed irises or highlights), an excited expression, and sun cream on his nose.
*Best for:* Summer stories, park, garden play, sunny day activities

**CHAR-H: South Asian girl (summer outdoor)**
A cartoon girl character, about 6 years old, with medium brown skin and long black hair in a high ponytail. She wears a bright pink t-shirt, comfortable purple leggings, and trainers. She has small simple oval eyes with solid dark fill (no detailed irises or highlights), a determined sporty expression.
*Best for:* Park activities, sports day, active outdoor play

### School/Formal Characters

**CHAR-I: Black British boy (school)**
A cartoon boy character, about 7 years old, with dark brown skin and short black hair with a neat shape-up. He wears a navy blue school jumper with a white collar showing, grey school trousers, and black school shoes. He has small simple oval eyes with solid dark fill (no detailed irises or highlights), a confident thoughtful expression.
*Best for:* School stories, learning, classroom, library

**CHAR-J: East Asian girl (school)**
A cartoon girl character, about 7 years old, with East Asian features and a neat black bob haircut with a fringe. She wears a burgundy school cardigan over a white blouse, a grey pleated skirt, white socks, and black Mary Jane shoes. She has small simple oval eyes with solid dark fill (no detailed irises or highlights), a gentle curious expression.
*Best for:* School stories, reading, quiet activities, thoughtful themes

### Pet Owner Characters

**CHAR-K: White British girl (pet owner)**
A cartoon girl character, about 6 years old, with light skin, long ginger hair in a single plait, and freckles. She wears a teal hoodie, dark grey leggings, and green trainers. She has small simple oval eyes with solid dark fill (no detailed irises or highlights), a caring gentle expression.
*Best for:* Pet stories, animals, nature, caring themes

**CHAR-L: Mixed heritage boy (pet owner)**
A cartoon boy character, about 6 years old, with medium brown skin and messy dark brown curls. He wears a red hoodie, blue jeans, and white trainers. He has small simple oval eyes with solid dark fill (no detailed irises or highlights), an excited loving expression.
*Best for:* Pet stories, energetic animals, playful themes

---

## 3.2 Character Selection Process

When starting a new story:

1. **Read the story text** — What is the setting? What activities happen?
2. **Check the setting:**
   - Indoor/home → Use CHAR-A, CHAR-B, CHAR-C
   - Outdoor/garden/farm → Use CHAR-D, CHAR-E, CHAR-F
   - Summer/outdoor active → Use CHAR-G, CHAR-H
   - School/formal → Use CHAR-I, CHAR-J
   - Pet-focused → Use CHAR-K, CHAR-L
3. **Check diversity:** Don't repeat the same character across consecutive books
4. **Note your choice** in the story data file:
   ```python
   "character_id": "CHAR-A",
   "character_name": "British-Asian girl (casual home)",
   ```

---

## 3.3 Legacy Level-Based Characters (Deprecated)

The following level-based character assignments are DEPRECATED for template books but retained for reference:

| Level | Character | Notes |
|-------|-----------|-------|
| L1 | CHAR-D (dungarees/wellies girl) | Originally assigned, now use story-appropriate |
| L2 | CHAR-F (hijab/raincoat girl) | Originally assigned, now use story-appropriate |
| L3 | Green cycling boy | Not in new roster |
| L4 | Orange hoodie plait girl | Similar to CHAR-E |
| L5 | Blue fleece boy | Not in new roster |
| L6 | CHAR-J (East Asian bob girl) | Originally assigned, now use story-appropriate |

---

## 4. Action-Text Alignment

The image for each page MUST show EXACTLY what the story text describes. This is the second most important rule after character consistency.

### How to Write Scene Prompts

1. Read the story text for the page
2. Identify the specific ACTION (what is the character doing?)
3. Identify the specific OBJECTS (what are they interacting with?)
4. Identify the SETTING (where are they?)
5. Identify the EMOTION (how do they feel?)
6. Write the prompt to show precisely that action, those objects, in that setting, with that emotion

### Examples

| Story Text | Correct Prompt | Wrong Prompt |
|-----------|---------------|-------------|
| "I dig in the mud. Dig, dig, dig!" | "...digging energetically in thick brown mud with a small spade, mud flying..." | "...standing near some mud." |
| "I hit a thing! Is it a bug?" | "...pausing mid-dig, looking surprised, has just hit something hard buried in mud..." | "...holding a bug." |
| "It is not a bug. I tug at it." | "...gripping and pulling with both hands at an object sticking out of mud..." | "...digging more." |
| "Tug, tug, tug! It is big!" | "...leaning back, pulling a large shell halfway out of mud, amazed expression..." | "...with a shell." |

### Common Mistakes
- Showing a generic scene instead of the specific action from the text
- Showing the result before it happens (holding the shell on the page where she's still tugging)
- Forgetting to include the key object
- Object changing appearance between pages
- Character doing something different from what the text says

---

## 5. Art Style Reference

### Include These Keywords in Every Prompt
"Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters, warm friendly atmosphere, soft pastel colours, simple rounded shapes, gentle lighting."

### Always End Every Prompt With
"No text, words, or letters in the image."

### Always Include the Eye Reminder
"Small simple oval eyes with solid dark fill."

### The Style IS
- Hand-drawn cartoon with clean black outlines
- Watercolour-textured backgrounds (soft, warm)
- Warm, cosy, inviting — a book a child would pick up
- Soft pastel backgrounds with pops of bright colour
- Simple rounded shapes, gentle even lighting

### The Style IS NOT
- Photorealistic or 3D rendered
- Anime or manga
- Flat vector art
- Dark, moody, or dramatic
- Overly detailed or busy

---

## 6. Engine-Specific Configuration

### Flux Kontext Pro (Primary — via fal.ai)

| Setting | Value |
|---------|-------|
| Hero generation | `fal-ai/flux/dev` (text-to-image) |
| Scene generation | `fal-ai/flux-pro/kontext` (image-to-image with reference) |
| Hero resolution | 768 x 1024 (portrait) |
| Cover resolution | 768 x 1024 (portrait) |
| Story page resolution | 1024 x 768 (landscape) |
| Output format | PNG |
| Guidance scale (hero) | 4.0 |
| Inference steps (hero) | 28 |
| Guidance scale (scenes) | 3.5 |
| Rate limit | 2 seconds between requests |
| Hero injection parameter | `image_url` (URL of uploaded hero image) |

### Gemini Imagen (Fallback)

| Setting | Value |
|---------|-------|
| API | `generativelanguage.googleapis.com/v1beta` |
| Hero generation | `imagen-3.0-generate-002:predict` (text-to-image) |
| Scene generation | `gemini-2.0-flash:generateContent` with image input (image editing mode) |
| Cover aspect | 3:4 (portrait) |
| Story page aspect | 4:3 (landscape) |
| Rate limit | 3 seconds between requests |
| Max retries | 3 with exponential backoff (base 5 seconds) |
| Hero injection method | Inline base64 image in `inlineData` field |

**Gemini injection approach:**
When using Gemini in image editing mode, the hero image is passed as an `inlineData` part alongside the text prompt. The model uses this reference to maintain character appearance. If Gemini's image editing mode is unavailable, fall back to repeating the full character description in every prompt — but flag this as degraded mode, as consistency will be lower.

---

## 7. Workflow Position

This skill covers **Steps 3 and 4** of the Master Book Production Workflow:

- **Step 3:** Image Prompt Writing — use this skill's prompt templates (Section 2, Step 5)
- **Step 4:** Image Generation — use this skill's full pipeline (Section 2, Steps 1 to 8)
- **Step 6:** Referenced during Full Book Assessment — use Section 2, Steps 6 and 7 for image checks

### Dependencies
- **Before this skill runs:** The story must be written and assessed (Steps 1 and 2). The story text for each page must be finalised.
- **After this skill runs:** The images are passed to the book-template-designer for PDF assembly (Step 5).

### Required inputs
- Level number (1 to 6)
- Book number (1 to 5)
- Story text per page (finalised, phonics-validated)
- Key object description (defined once)
- Setting description (defined once)

### Outputs
- hero_reference.png (keep for future books at the same level)
- hero_reference_nobg.png (background-removed, keep for re-use)
- cover.png
- page1.png through page6.png (Level 1) or page8.png (Levels 2 to 6)

---

## 8. Re-Using Hero Images Across Books

Each level has ONE character who appears in ALL 5 books at that level. Once you have a good hero reference image for a level, you can re-use it across multiple books.

**Re-use workflow:**
1. Check if `output/images/L{level}_B1/hero_reference_nobg.png` already exists
2. If it exists and was previously approved, skip Steps 1 to 3
3. Upload the existing hero (Step 4) and proceed directly to scene generation (Step 5)

This saves generation time and guarantees the character looks identical across all books at the same level.

**When to regenerate the hero:**
- The previous hero failed the eye style check
- The previous hero has proportion issues
- You are changing the character design (requires brand guidelines update first)
