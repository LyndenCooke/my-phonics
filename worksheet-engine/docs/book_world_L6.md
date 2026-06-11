# L6 book world bible

Date: 2026-06-10. Compiled from the repo only, for commissioning worksheet illustration in the L6 grammar booklet. Every claim cites a file. Where something is not in the repo it is said plainly. Verbatim prompts are quoted exactly, including their original punctuation.

A note on numbering. The shipped books are Level 6 in the 8-level school system (the covers read "Level 6 · Building Fluency", see `myphonics_books/output/books/Level6/debug_6_1_The_Purple_Purse.html` line 2070). The story data files, image folders and generation scripts all still use the old internal IDs L4_1 to L4_4 from the 6-level system. So 6_1 maps to L4_1, 6_2 to L4_2, 6_3 to L4_3 and 6_4 to L4_4 throughout this document.

The four shipped PDFs (each also has a Printable Booklet PDF):

| Book | PDF | Story data | Reference images |
|---|---|---|---|
| 6.1 The Purple Purse | `myphonics_books/output/books/Level6/6_1 The Purple Purse.pdf` | `myphonics_books/data/purple_purse_story_l4_1_book1.py` | `myphonics_books/output/images/L4_1_B1/` |
| 6.2 The Brown Owl | `myphonics_books/output/books/Level6/6_2 The Brown Owl.pdf` | `myphonics_books/data/brown_owl_story_l4_2_book1.py` | `myphonics_books/output/images/L4_2_B1/` |
| 6.3 The New Glue | `myphonics_books/output/books/Level6/6_3 The New Glue.pdf` | `myphonics_books/data/new_glue_story_l4_3_book1.py` | `myphonics_books/output/images/L4_3_B1/` |
| 6.4 The Cheeky Monkey | `myphonics_books/output/books/Level6/6_4 The Cheeky Monkey.pdf` | `myphonics_books/data/how_now_story_l4_4_book1.py` | `myphonics_books/output/images/L4_4_B1/` and `public/illustrations/4_4/` |

Story text in the shipped debug HTML files matches the story data files word for word (all four checked directly against `myphonics_books/output/books/Level6/debug_6_*.html`).

---

## 1. The illustration style definition

### 1.1 The book art style (what the worksheets must match)

The canonical base style prompt, applied to every generated scene (`myphonics_books/scripts/generate_gemini_images.py` lines 39 to 49), verbatim:

> "Whimsical children's book illustration. Hand-drawn cartoon style with soft watercolour textured backgrounds and clean black-outlined characters. CRITICAL EYE RULE: Every character (human, animal, everyone) MUST have eyes that are tiny solid black filled circles like dots drawn with a black marker pen. NO white around the black, NO iris, NO pupil, NO highlight, NO detail whatsoever. Just small simple black dots - cute and friendly like a teddy bear's eyes. Warm, friendly, inviting. Soft pastel backgrounds with pops of bright colour. Simple rounded shapes, gentle lighting. Professional picture book quality. No text, words, letters, or numbers in the image."

Broken into the commissioning attributes:

- Line weight: characters are "clean black-outlined". No numeric line weight (pt or px) is recorded anywhere in the repo.
- Dot eyes rule: tiny solid black filled circles, no white, no iris, no pupil, no highlight. This applies to every character, human and animal. It is the single most enforced rule in the pipeline; there are repeated repair scripts for eye breaches (`fix_eyes.py`, `paint_eyes_black.py`, `fix_l4_2_owl_eyes.py` and others in `myphonics_books/scripts/`).
- Palette and wash: soft watercolour textured backgrounds, soft pastel backgrounds with pops of bright colour, simple rounded shapes, gentle lighting.
- Background treatment: full watercolour scene behind the characters in the books. Character reference sheets use a plain light solid-colour background (cream or grey) with no scenery.
- No text, words, letters or numbers in any image.

### 1.2 The worksheet line-art adaptation

The grammar worksheets do not reuse the full-colour book art directly. The manifest rule (`worksheet-engine/src/data/grammarAssets.ts` header) is one line-art treatment for every object and character, trimmed white or transparent background, small solid pure-black dot eyes. The manifest and `worksheet-engine/src/data/grammarSchema.ts` both cite `grammar_aesthetic_direction.md` as the source for this; that document does not exist in the repo. The fullest surviving statement of the worksheet style is the manifest header itself plus `worksheet-engine/docs/worksheet_design_rules.md` section 4.

### 1.3 The generation pipeline (character consistency)

From the docstring of `myphonics_books/scripts/generate_gemini_images.py`: a hero reference image is generated first (text-to-image, model gemini-2.5-flash-image), then for each scene the hero image is sent together with the scene prompt so the model uses the hero as a visual reference. Side characters (Dad, Mum) have their own reference images (`side_hero_dad.png`, `side_hero_mum.png`). For 6.4 the monkey also has a dedicated reference (`regen_l4_4_full.py`). `L4_1_B1/hero_reference.png` is reused as a known-good eye-style reference by the 6.4 scripts (`generate_l4_4_images.py` line 26, `regen_l4_4_full.py` line 33).

Style variants that exist in the repo and should NOT be used for commissioning:

- Three scenes of The New Glue (cover, page 3, page 6) were prompted in a "kawaii/Sanrio" flat-colour variant rather than the watercolour base style (`generate_gemini_images.py`, SCENE_PROMPTS["4.3"]).
- A "realistic integrated" experiment for 6.4 exists in `regenerate_l4_4_realistic.py` (photorealistic children's book style). It was superseded by `regen_l4_4_full.py`, which returns to the cartoon base style.
- The first Brown Owl run used Flux Kontext Pro via fal.ai (`generate_l4_2_images.py`) with a softer eye rule ("small simple oval eyes with solid dark fill"). It was superseded by a full Gemini regeneration (`regen_l4_2_all_gemini.py`) with the strict dot-eye rule.

---

## 2. Book 6.1 The Purple Purse

- Target sounds: ur, er (story words: purple, purse, turned, ferns, herbs, never).
- Setting and country: Kadıköy/Moda neighbourhood, Istanbul, Turkey. Contemporary modern residential neighbourhood, not tourist Istanbul. Cultural brief: `myphonics_books/data/cultural_brief_L4_1.txt`.
- One line summary: a girl loses her purple purse, searches the neighbourhood with Dad and a market lady at a herb stall returns it with the coins still inside.

Source for all of the above: `myphonics_books/data/purple_purse_story_l4_1_book1.py`.

### Characters

Girl (hero, named only as "Istanbul girl" in the data; the story is told in first person). About 7 years old in the art prompt (6 in the story data). Dark brown wavy hair in a ponytail, light olive skin, purple jumper with small gold star pattern, light blue zip-up jacket, dark navy jeans, white trainers. Verbatim character consistency prompt (`generate_gemini_images.py`, HERO_PROMPTS["4.1"]):

> "A cartoon girl character, about 7 years old, with light olive skin and dark brown wavy hair tied in a ponytail. She wears a purple jumper with a small gold star pattern, a light blue zip-up jacket over the top, dark navy jeans, and white trainers. She has small friendly dot eyes, solid black, tiny and cute like a teddy bear - not too big, a warm determined expression, and rosy cheeks. Standing in a neutral pose, facing the viewer, full body visible from head to toe. Arms slightly away from body, feet shoulder-width apart. Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."

Short in-scene tag: "the girl in the purple jumper with gold stars and light blue jacket".

Dad (side character). Verbatim side-hero prompt (`generate_gemini_images.py`, SIDE_HERO_PROMPTS["4.1"]):

> "A cartoon adult man character, about 35 years old, with light olive skin and short dark brown hair. He has a short neat beard. He wears a dark charcoal casual jacket over a grey shirt, dark jeans, and dark grey trainers. He has small friendly dot eyes, solid black, tiny and cute like a teddy bear — not too big. He has a warm, kind, fatherly expression with a slight smile. Standing in a neutral pose, facing the viewer, full body visible from head to toe. Arms slightly away from body, feet shoulder-width apart. Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."

Short tag: "the dad in the dark jacket and grey shirt". Note a data drift: the story file describes Dad as clean-shaven; the image prompt gives him a short neat beard. The image prompt is what the shipped art was generated from.

One-off figures with no reference image (described inline in scene prompts only): a middle-aged shopkeeper in an apron (page 4) and a smiling woman in a headscarf at the herb stall, the "market lady" (pages 6 and 7).

### Recurring locations and objects as they appear in the art

From SCENE_PROMPTS["4.1"]: the purse is always "a small purple velvet purse with a gold clasp" (this exact phrase recurs in the cover and pages 6, 7 and 8). Modern city street with colourful apartment buildings in cream and pastel tones, balconies with flower boxes and colourful awnings. A green park with a wooden bench, ferns and mature trees. A small corner shop with a colourful awning. An old stone wall covered in climbing ferns with a small stone church behind. A street-side herb stall with bunches of fresh herbs in wooden crates. A cat appears on a wall on page 2 and on a windowsill on page 8 (the cultural brief notes cats as a distinctive Istanbul detail).

---

## 3. Book 6.2 The Brown Owl

- Target sounds: are, ow as in cow (story words: owl, stared, brown, dare, howl, care).
- Setting and country: British woodland at dusk, United Kingdom. No cultural brief file exists for this book.
- One line summary: a girl hears a howl at dusk, walks into the woods with Mum and watches a brown owl feed its owlets in a tree hole.

Source: `myphonics_books/data/brown_owl_story_l4_2_book1.py`.

### Characters

Girl (hero, unnamed; first-person narrator). Mixed-race British girl, about 6, curly dark brown hair in two puffs, medium brown skin, navy duffle coat. Verbatim character consistency prompt from the final Gemini regeneration (`myphonics_books/scripts/regen_l4_2_all_gemini.py`, HERO_PROMPT):

> "A cartoon girl character, about 6 years old, with medium brown skin (hex #8B6B4A) and curly dark brown hair in two puffs tied with navy blue hair bobbles. She wears a navy blue duffle coat with wooden toggle buttons, dark grey joggers, and brown lace-up boots. She has tiny solid black filled circle eyes (NO white, NO iris — just small dark dots). Friendly cheerful expression. Standing in a neutral pose, facing the viewer, full body visible from head to toe. Arms slightly away from body, feet shoulder-width apart. Plain light grey solid-colour background."

Mum (side character). Verbatim prompt (same file, MUM_PROMPT):

> "A cartoon adult woman character, about 30 years old. She is an ADULT with adult proportions — tall, long legs, mature body shape, NOT a child. Medium brown skin (hex #8B6B4A, same as the girl in the reference), curly dark brown hair pulled back in a low bun. She wears a dark green parka coat with hood down, black trousers, and brown walking boots. She has tiny solid black filled circle eyes (NO white, NO iris — just small dark dots). Warm friendly expression. Standing in a neutral pose, facing the viewer, full body visible from head to toe. Arms slightly away from body. She is clearly TALL — about 165cm. Plain light grey solid-colour background."

An earlier hero variant exists in `generate_gemini_images.py` (HERO_PROMPTS["4.2"], softer wording, no hex value) and the original Flux run in `generate_l4_2_images.py`. The regen file above is the latest full regeneration.

### Recurring locations and objects as they appear in the art

Defined once and reused exactly across all scene prompts (`regen_l4_2_all_gemini.py`; near-identical wording in `generate_l4_2_images.py`), verbatim:

- Owl: "a large tawny owl with rich dark brown feathers, lighter cream-brown chest markings, a round facial disc, small solid black dot eyes, and a sharp curved beak"
- Tree: "a tall mature oak tree with thick textured bark, bare winter branches, and a dark oval hole about halfway up the trunk"
- Owlets: "two small fluffy baby owlets with pale brown downy feathers, darker brown markings, round faces like miniature versions of the mother owl, and small solid black dot eyes"
- Woodland: "a woodland path through bare winter trees (oak, birch) with some evergreen pines. Fallen brown and orange leaves on the ground. Twilight sky with deep blue and purple tones"

Also in the art: the lit window of the girl's house at dusk (page 1), a mouse in the owl's talons (page 7), a starry sky with a crescent moon on the walk home (page 8, `brown_owl_story_l4_2_book1.py`).

---

## 4. Book 6.3 The New Glue

- Target sounds: ew, ue (story words: glue, blue, new, drew, threw, grew).
- Setting and country: a modern home in Oaxaca, Mexico. Colourful walls, terracotta tiles, craft culture. Cultural brief: `myphonics_books/data/cultural_brief_L4_3.txt`.
- One line summary: a girl presses too much blue glue on a homemade card and sets off a cumulative chain of chaos through the house, ending with the card safely delivered to Mum.

Source: `myphonics_books/data/new_glue_story_l4_3_book1.py`.

### Characters

Girl (hero, named only as "Oaxaca girl"). Verbatim character consistency prompt (`generate_gemini_images.py`, HERO_PROMPTS["4.3"]):

> "A cartoon girl character, about 7 years old, with medium brown skin and long straight dark hair in two braids. Round face, rosy cheeks. She wears a yellow t-shirt and blue denim dungarees with silver buckles, and white trainers. She has small friendly dot eyes, solid black, tiny and cute like a teddy bear - not too big, a cheerful mischievous expression. Standing in a neutral pose, facing the viewer, full body visible from head to toe. Arms slightly away from body, feet shoulder-width apart. Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."

Short tag: "the girl with braids in yellow t-shirt and blue dungarees".

Dad (side character). Verbatim prompt (`generate_gemini_images.py`, SIDE_HERO_PROMPTS["4.3"]):

> "A cartoon adult man character, about 35 years old, with medium brown skin and short dark hair. He has a neat dark moustache. He wears a cream button-up shirt with rolled-up sleeves, dark jeans, and brown leather sandals. He has small friendly dot eyes, solid black, tiny and cute like a teddy bear — not too big. He has a warm, friendly, fatherly expression with a slight smile. He is TALL — a fully grown adult man, much taller than a child. Standing in a neutral pose, facing the viewer, full body visible from head to toe. Arms slightly away from body, feet shoulder-width apart. Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."

Mum appears on page 8 only. No character consistency prompt or reference image exists for her anywhere in the repo; the page 8 scene prompt describes her only as "a woman" who "smiles with delight".

The cat (recurring animal character, no dedicated reference image). Described inline in the scene prompts, fullest recurring form (SCENE_PROMPTS["4.3"], pages 4, 5 and 7): "a medium-sized ginger tabby cat with orange stripes, white chest, white paws, and white-tipped tail", with blue glue smears on its back from page 3 onward, and the standard solid black dot eyes.

### Recurring locations and objects as they appear in the art

From SCENE_PROMPTS["4.3"] and the story file: a pot of bright blue glue; a white handmade card with a blue bird drawing; a colourful tiled staircase with decorative patterned tiles on the risers; warm terracotta walls; a living room with colourful pottery and small ceramic animals on shelves, a green armchair with patterned cushions and a bright woven striped rug; a kitchen with blue and white Talavera patterned wall tiles and clay pots on a shelf; a patio garden with bougainvillea, potted plants, cacti and a terracotta pot of blue flowers on the garden wall; the front entrance with potted plants and terracotta tiles.

Style caution for commissioning: the cover, page 3 and page 6 prompts use the kawaii flat-colour variant, not the watercolour base style (see section 1.3). The line-art worksheet assets should follow the base style rules, not the kawaii variant.

---

## 5. Book 6.4 The Cheeky Monkey

- Target sounds: review of all L6 vowel sounds, are, ur, er, ew, ue, ow (story words: brown, furry, down, now, how, new).
- Setting and country: Masjid Putra (the Putra Mosque) and Putrajaya Lake, Putrajaya, Malaysia. Cultural brief: `myphonics_books/data/cultural_brief_L4_4.md`.
- One line summary: a boy visiting the pink mosque gardens with Mum chases a cheeky macaque that steals his snack, and the chase ends peacefully by the lake.
- Title note: the story data file is headed "How Now?" and SCENE_PROMPTS["4.4"] still carries that title, but the book_title field and the shipped PDF are The Cheeky Monkey.

Source: `myphonics_books/data/how_now_story_l4_4_book1.py`.

This book has three generations of image script. The final one is `myphonics_books/scripts/regen_l4_4_full.py` (boy in full-length trousers for modesty, Mum with proper adult proportions, a dedicated monkey reference, mosque corrected to a single minaret and shown only on the cover, page 1 and page 8). The prompts below are from that final script. Earlier variants (`generate_l4_4_images.py` with blue shorts, `regenerate_l4_4_realistic.py` realistic experiment) are superseded.

### Characters

Boy (hero, unnamed "Malaysian boy"). Verbatim character consistency prompt (`regen_l4_4_full.py`, BOY_DESC; SKIN_HEX is "#8B6B4A" and HAIR_HEX is "#0D0D0D"):

> "A cartoon boy, about 5 years old, Malaysian, with medium brown skin (hex #8B6B4A). Short neat black hair (hex #0D0D0D). He wears small round glasses with thin dark frames. Bright orange cotton t-shirt, blue cotton TROUSERS (full-length, NOT shorts), simple brown sandals. Solid black dot eyes behind the glasses — ZERO white. Bright curious excited expression. NO rosy cheeks, NO blush marks. Standing neutral pose, full body, plain light cream background."

In-scene tag: "the boy from the character reference (orange t-shirt, blue TROUSERS, round glasses, brown sandals, skin #8B6B4A)".

Mum (side character, Malaysian Muslim mother in niqab, shown with dignity and warmth per the story data notes). Verbatim prompt (`regen_l4_4_full.py`, MUM_DESC):

> "A cartoon adult woman, Malaysian Muslim mother, TALL and slender with proper adult proportions (NOT chibi, NOT stubby, NOT round-headed). She wears a flowing dark emerald-green abaya that reaches her ankles, with a black niqab covering her face — only warm brown eyes visible. Hands visible showing medium brown skin (hex #8B6B4A). Black flat shoes. Dignified, graceful posture. Her body proportions should match a real adult woman — tall, slender waist, the abaya drapes elegantly. Head is oval (NOT round). Solid black dot eyes — ZERO white. Standing neutral pose, full body, plain light cream background."

The monkey (animal character with its own reference image). Verbatim prompt (`regen_l4_4_full.py`, MONKEY_DESC):

> "A cartoon brown long-tailed macaque monkey. Pale pinkish-tan face, warm brown fur on body and limbs, long curved tail. Bright cheeky mischievous expression with a wide grin. Small rounded ears. Light tan chest/belly. Solid black dot eyes — ZERO white. Sitting pose, full body, plain light cream background."

### Recurring locations and objects as they appear in the art

From `regen_l4_4_full.py` tags and the story file recurring_objects dict:

- Mosque: "Masjid Putra — a rose-pink granite mosque with ONE large dome and ONE single tall minaret (NOT multiple minarets). The mosque has smaller pink domes along the roofline but only ONE main minaret tower." Appears only on the cover, page 1 and page 8 in the final art plan.
- Lake: "Putrajaya Lake — calm blue water", reflecting the pink mosque on page 8.
- Gardens: "lush manicured tropical gardens with palm trees, hibiscus flowers, flowering bushes, and neat hedges", with low stone garden walls the monkey sits on.
- Snack: a small snack bag or packet that the monkey steals.

---

## 6. What does not exist in the repo

- `grammar_aesthetic_direction.md`, cited by `grammarAssets.ts` and `grammarSchema.ts`, does not exist.
- No numeric line weight, brush spec or colour swatch list for the book art exists; the style is defined entirely by the prompt text quoted in section 1.
- No character consistency prompt exists for Mum in The New Glue.
- No names exist for any of the four hero children or their parents; the data files use descriptive labels only (Istanbul girl, Oaxaca girl, Malaysian boy; the Brown Owl girl has no label at all).
- No cultural brief exists for The Brown Owl.
- The shipped PDFs could not be visually inspected for this document (PDF page rendering failed on this machine for lack of disk space); art descriptions above come from the generation prompts and the debug HTML text, which were verified against the story data files. `worksheet-engine/docs/levels_plan_summary.md` section 3 records a visual inspection of the worksheet clipart files dated 2026-06-10.
