# Create-A-Book Forge

Build every custom book through the workflow and gates below. Treat every gate as blocking. Do not export a book with a known failure.

## 1. Binding sources

Use these sources in this order of authority:

1. The user's supplied child, family, faith, location and preference data.
2. `data/reading_progression.json` for level-specific graphemes, tricky words, sentence ranges, punctuation and language devices.
3. The approved MyPhonicsBooks PDF components and design tokens.
4. This skill.

If `data/reading_progression.json` is missing, internally contradictory or incomplete for the requested level, stop before story generation. Do not invent a level specification.

Never invent personal facts. Use "In the family's words" only for wording the family actually supplied. Treat culture/profile pages as fact-checked editorial content, not as permission to fabricate biography.

## 2. Non-negotiables

- Use British English throughout.
- Draw eyes as tiny solid black filled shapes: no sclera, catchlight, iris or coloured pupil.
- Keep clothing modest, child-appropriate and unchanged unless the story explicitly includes a clothing change.
- Keep each recurring character's identity, age, proportions, hair and fixed outfit consistent.
- Keep each recurring object's identity features consistent even while its position or state changes.
- Allow settings and scenes to progress. Preserve permanent location facts while changing only what the story requires.
- Show one visually coherent time-slice per page. Do not ask one image to show mutually exclusive before-and-after states.
- Show every concrete noun and physical action needed to understand the page.
- Show no floating body parts, unsupported bodies, hovering objects or impossible furniture.
- Keep one room or one coherent outdoor area per frame. Never reveal a second room merely as background decoration.
- Never show a finished object before the page on which it is completed.
- Never duplicate a character or recurring object unless the story explicitly requires more than one.
- Do not place visible words, letters, numerals, signatures or watermarks inside generated artwork unless the page plan explicitly requires readable text.
- Use the slate diamond component for a taught spelling making a different sound. Do not substitute a circle.

## 3. Phonics contract

### 3.1 Text zones

Classify every piece of book text before QA:

- `assessed_reader_text`: story prose, word cards, examples, answer choices, captions the child must read and pseudo-words.
- `adult_guidance`: parent/teacher instructions that are not part of the child's decoding task.
- `profile_editorial`: personalised and cultural material outside the decodable story.

Apply the level's full decodability rules to `assessed_reader_text`. Do not use `adult_guidance` or `profile_editorial` to hide words the child is expected to read.

### 3.2 Decodability

For every assessed real word:

- Segment the word into graphemes before judging it.
- Accept it only when every position is covered by a taught grapheme at or below the selected level, the exact word is on the permitted tricky-word list, or it is the child's supplied name.
- Record every uncovered position and its expected teaching level.
- Allow no more than three distinct above-level orthographic word forms in the entire story. Inflections count separately: *boat* and *boats*, or *hop* and *hopped*, are different forms. Repeated uses of the same form do not create a new form, but repetition must remain natural.
- Preview every allowed above-level story word under Future Sounds. Never assess a Future Sounds spelling in a word card, pseudo-word, answer choice, Sound Detective task or grammar activity at the current level. Do not introduce additional above-level examples outside the story.
- Rewrite the story whenever it contains more than three above-level forms. Do not waive the rule because several violations share the same suffix or grapheme.

### 3.3 Focus sound

Use one to three distinct orthographic focus-word forms in the story. Treat inflections as separate forms. Three is a ceiling, not a target. Do not force a focus word onto every page or repeat it unnaturally.

Activity pages may reuse the approved focus words and add only level-decodable examples. Validate pseudo-words against taught graphemes.

### 3.4 Shifty sounds

For each assessed word:

1. Split the word into graphemes.
2. Compare each taught grapheme with its taught base sound.
3. Mark only graphemes producing a different sound.
4. Filter marks through the shifty-sound ledger.

Alternative spellings for the intended phoneme keep their ordinary line. A taught letter or grapheme producing a different phoneme receives the slate diamond. Enforce the marker through the PDF component and DOM, not through prose instructions alone.

### 3.5 Mechanics and progression

Validate deterministically where possible:

- capital letter at every sentence start;
- capitalised names and pronoun I;
- permitted terminal punctuation;
- sentence and word counts;
- permitted punctuation by level;
- sentence-opening variety;
- consistent tense;
- required sentence forms and language devices from the level specification.

At Level 6 and above, fail when more than half of story sentences begin with the hero's name, a pronoun referring to the hero, or "The".

## 4. Story contract

### 4.1 Required story output

Declare:

- title;
- level and focus sound;
- setting: place, season, weather and three to five drawable permanent features;
- cast: hero plus no more than three recurring non-hero people;
- one fixed outfit and stable identity description per recurring person;
- `key_objects`: no more than three, with permanent appearance features only;
- one to three reusable `location_id` values;
- pages with text, location, story beat and temporal state;
- `cover_brief` based on the story's own final triumph or resolved state.

Do not put an object's location or temporary state inside its permanent appearance description.

### 4.2 Required beats

Include, in visible order:

1. idea or need;
2. setting out;
3. the doing itself;
4. a prepared problem or setback;
5. putting it right;
6. the result, shared or recognised.

Do not skip the doing itself. Do not make the reader infer an important event between pages. Establish the cause of the setback before the setback happens.

### 4.3 One time-slice per page

For each page declare:

- `pre_state`;
- `depicted_moment`;
- `post_state`;
- `named_visible_things`;
- `physical_action`;
- `emotion`.

The prose and illustration must centre on `depicted_moment`. Rewrite a page that requires one frame to show two incompatible states, such as a cap simultaneously worn and attached to a stick.

### 4.4 Plausibility gate

Before generating art:

1. Walk the causal chain page by page.
2. List every object with a physical role on more than one page.
3. Commit to its size, rigidity, owner and function on each page.
4. Compare those states explicitly.
5. Reject impossible transformations, unsupported mechanisms and unexplained outcomes.

Permit one bounded story rewrite. Re-run story, phonics and plausibility QA after the rewrite. Stop if it still fails.

## 5. Continuity model

Use fixed identity with controlled progression. Do not freeze an entire setting into one unchanging frame.

### 5.1 Permanent anchors

Create and approve:

- one hero reference;
- one reference for each recurring cast member;
- one identity reference for each visually important recurring object when text alone is insufficient;
- one locked art-language clause used unchanged in every image prompt.

Permanent character anchors govern identity. A later scene may improve pose or context reference, but it may never replace or override the approved identity anchor.

### 5.2 Location foundations

For every `location_id`, declare permanent facts such as:

- architecture and materials;
- fixed structures and landmarks;
- floor or ground treatment;
- window, wall and fitting designs;
- broad spatial relationship between permanent features;
- time, season and weather unless the story changes them.

The first scene at a location becomes an approved visual foundation only after passing identity, setting and story QA. Never promote a failed or unreviewed scene into an anchor.

Location foundations preserve the world's identity, not an exact camera frame. Permit new angles, movement through the space and temporary objects when the director declares them.

### 5.3 Page continuity state

For every page produce:

```json
{
  "page": 1,
  "location_id": "stable_location_id",
  "camera": "wide | medium | closeup | new-angle | same-view",
  "depicted_moment": "one visible moment",
  "character_instances": [
    {
      "character_id": "dad",
      "count": 1,
      "placement": "on the boat",
      "scale": "distant",
      "action": "holding the tiller",
      "must_not_appear_at": ["on the pavement"]
    }
  ],
  "objects": [
    {
      "object_id": "dad_boat",
      "identity_features": ["white hull", "green flag", "covered cabin"],
      "state_now": "moving from the dock",
      "placement": "on the river"
    }
  ],
  "changes_this_page": [],
  "must_remain": [],
  "must_not_show": []
}
```

State exact visible-character counts, placements and scales. Naming a character in the sentence does not authorise the generator to place a full-size copy in the foreground.

### 5.4 Reference stack

Use the minimum references needed for the page in this order:

1. hero identity reference when the hero is visible;
2. visible cast identity references;
3. recurring-object identity reference when needed;
4. approved location foundation;
5. previous approved scene only when spatial or state progression materially benefits from it.

Use a previous scene as continuity evidence, never as the sole authority for identity, object design or art language. State what must change and what must remain. Do not inherit undeclared people, furniture, objects or errors from the previous scene.

### 5.5 API conversation state

Treat each book as one continuing creative conversation, not a collection of unrelated API calls.

Create one durable `conversation_id` per book with the Responses and Conversations APIs when available. Otherwise chain the planning turns with `previous_response_id`; with Chat Completions, resend the managed history explicitly.

Keep story generation, rewrites, director planning and sequential page planning in that book conversation so phrases such as "the next scene" and "further down the trail" retain their narrative meaning.

Persist `conversation_id`, `last_planning_response_id`, `last_approved_image_id`, `book_state_version` and the current structured continuity state with the job.

Do not require the user to repeat character, setting or earlier-page information. Assemble the necessary context automatically.

For a continuing location or physical action, give image generation the previous approved image output or image ID together with the new page delta. Use the Responses API's multi-turn image flow or the equivalent supported provider mechanism.

Force a new scene rather than an edit when the page requires a new composition. Use an edit only when intentionally modifying the same composition.

For a new location, omit the previous scene image unless it materially helps; retain the book conversation, permanent identity anchors and art language.

After a page passes QA, append its approved plan, image identifier and resulting state to the book conversation and increment `book_state_version`.

Never treat conversational memory as the exact source of truth for identity, counts, placement or object state. The structured continuity state and approved visual references remain binding.

Do not allow different model providers to imply shared memory. Pass the required conversation summary, state and references explicitly across provider boundaries.

Keep QA calls independent when independence reduces confirmation bias. An independent QA call must still receive the exact candidate, page contract, binding references and state version it is judging.

Fail a context-dependent stage when it has neither the correct book conversation linkage nor a complete explicit context package. Periodically compact long conversations into a verified summary, but never compact away identity anchors, unresolved failures, permanent setting facts, object identities or current states.

## 6. Director contract

For each page declare:

- camera and framing;
- staging and exact placement;
- visible cast with count and scale;
- emotion;
- visible named things;
- recurring objects by stable ID;
- each object's state on this page;
- physical interaction or mechanism;
- changes from the previous page;
- facts that must remain unchanged;
- forbidden people, objects, states and future facts.

Anything the hero makes remains absent until the page on which it first exists. Anything completed remains visually identical after completion unless the story changes it.

For a close-up, keep the face and shoulders or the relevant connected body in frame. Never request hands or limbs without their owner.

## 7. Image generation and QA

Generate scenes page by page. Do not generate the cover until the story scenes and final object states are approved.

### 7.1 Scene prompt structure

Use these sections in every prompt:

- TASK
- IDENTITY AND ART ANCHORS
- SHOW NOW
- CHARACTER COUNT AND PLACEMENT
- OBJECT IDENTITIES AND STATES
- SETTING FOUNDATION AND ALLOWED CHANGES
- PHYSICAL ACTION
- DO NOT SHOW
- FORMAT

### 7.2 Eye QA

For every visible face:

1. Detect and crop the face.
2. Upscale the crop.
3. Describe what is inside each eye outline.
4. Pass only solid black filled eyes with no white or coloured interior.

Run the check on the whole page and each face crop.

### 7.3 Text-to-image QA

Describe before judging:

- every physical thing named by the sentence;
- the action actually visible;
- each recurring object's state;
- the visible mechanism behind fitting, plugging, pouring, lifting or attaching;
- whether the image shows the intended moment rather than a moment before or after it.

Fail when any necessary named thing, action or physical anchor is missing.

### 7.4 Identity and continuity QA

Compare the scene with the permanent references and declared continuity state:

- count every visible character and recurring object;
- verify every declared placement and forbidden location;
- compare clothing, colours, hair, age and proportions;
- compare permanent object features;
- compare permanent setting features;
- list additions not authorised by the director;
- detect duplicated characters or objects;
- detect premature future states;
- verify that every declared change occurred and every `must_remain` fact remained.

Do not accept "similar". Name exact matches and differences.

### 7.5 Physical plausibility QA

Check:

- connected limbs and bodies;
- correct furniture parts and support;
- seated characters supported by fully drawn seats;
- objects held, fixed, resting or hanging by a visible mechanism;
- correct scale relationships;
- no impossible intersections or hovering;
- no character occupying two locations in one frame.

### 7.6 Repair rule

On failure, return:

- page number;
- observed evidence;
- violated field or rule;
- one narrow repair instruction;
- elements that must remain unchanged.

Permit one bounded repair regeneration. Re-run every failed gate and all dependent gates. If the repaired page still fails, stop the build. Never export a known failure.

## 8. Cover contract

Use the story's resolved triumph moment and finished object state. Apply the same character-count, placement, identity, object and setting QA as an interior page.

Do not:

- duplicate a character who is already visible elsewhere in the cover scene;
- show a finished object inconsistent with its final story appearance;
- invent extra family members;
- combine incompatible viewpoints or story moments;
- show mid-story states merely to summarise the plot.

## 9. Activity-page contract

Build activity pages from the approved story data. Never generate them from an unvalidated draft.

### 9.1 Completeness

- Populate every intended template region or remove it cleanly.
- Show no empty image frames, faint placeholder words, duplicated labels or missing assets.
- Keep instructions adjacent to the task they govern.
- Avoid large accidental blank areas.
- Do not shrink content below legibility limits to force it onto one page; simplify or split the activity.

### 9.2 Required checks

- **Sound Spotlight**: use only approved level-decodable words; display each word once unless repetition has a declared instructional purpose.
- **Trace and Form**: show the focus grapheme and correctly aligned handwriting lines.
- **Alien Words**: validate every pseudo-word against taught graphemes.
- **Sound Detective**: never assess Future Sounds.
- **Story Order**: use six distinct, legible plot beats including the beginning, problem and resolution; randomise display order without duplicating a beat.
- **Tell the Story**: use prompts and goals permitted at the level.
- **Talk About It**: ask questions answerable from the story and artwork.
- **Word Workshop at Levels 5-8**: require at least four scorable responses across at least two task types, unless the binding level specification requires more.

### 9.3 Morphology and pronunciation

Teach suffix pronunciations by final phoneme, not merely by final letter. Do not use invented spellings such as *play'd* or *hop't* as though they were correct orthography. Use approved child-friendly phoneme notation and examples from the level specification.

## 10. Whole-book QA

Run one ordered pass over all approved pages:

- Track every recurring character's clothing, hair, age and proportions.
- Track every recurring object's permanent identity and changing state.
- Confirm each progression moves forward without unexplained regression.
- Confirm no finished state appears early, including in backgrounds or on the cover.
- Confirm arrivals do not appear before they arrive.
- Confirm every story beat has a corresponding image.
- Confirm the visual story is understandable without reading the prose.
- Confirm setting changes are intentional progression rather than drift.
- Confirm the cover matches the approved final states.
- Compare a full contact sheet for identity, style, scale, colour and narrative flow.

Any whole-book failure returns affected pages and a narrow repair plan. Re-run page QA and whole-book QA after repair.

## 11. PDF production contract

Generate the final book through the real `book_v2` A5 Playwright template.

- Levels 1-4: exactly 16 total PDF pages, including front and back covers.
- Levels 5-8: exactly 20 total PDF pages, including front and back covers.
- Total page count must be divisible by four.
- Use A5 page dimensions on every page.
- Keep internal page numbering consecutive and exclude cover numbering according to the template specification.
- Keep all required content inside trim-safe areas.
- Resolve every image and font asset before export.
- Enforce the slate diamond through the rendered component.
- Permit no DOM overflow, clipped text, overlapping elements, broken tables or placeholder assets.
- Keep child-facing body text at 9 pt or larger and task/answer text at 11 pt or larger. Use smaller chart text only when an approved print test proves legibility; otherwise split the chart.

After export:

1. Verify page count, A5 dimensions, font embedding and asset resolution programmatically.
2. Render every page at 200 DPI.
3. Inspect every rendered page individually.
4. Inspect a full-book contact sheet.
5. Check legibility at actual A5 print size.

Fail on sparse accidental layouts, empty components, duplicate labels, tiny charts or inconsistent margins.

Do not deliver until the latest rendered PDF passes every check.

## 12. Build order

```
validate inputs and level specification
  -> create or resume the book conversation and continuity state
  -> story and story schema
  -> deterministic mechanics and decodability QA
  -> story plausibility QA
  -> one bounded rewrite if required, then re-QA
  -> shifty-sound analysis
  -> director and page continuity states
  -> permanent character/object anchors and art language
  -> approved location foundations
  -> scenes page by page
  -> text-to-image, identity, continuity, eye and physics QA per scene
  -> whole-book progression QA
  -> cover generation and QA
  -> activity pages and activity QA
  -> book_v2 PDF
  -> programmatic PDF checks
  -> 200-DPI page review and contact-sheet review
  -> deliver only on full pass
```

Use the configured stage owners unless deliberately replaced: gpt-5.5 for story, rewrite, plausibility and director; gpt-5.6-sol for decodability and shifty analysis; the configured vision model, currently gpt-5.4-mini, for image QA; gpt-image-2 medium for artwork; authenticated Vertex Gemini only as image fallback; and Playwright book_v2 for PDF composition.

Model substitution must preserve the structured schemas, evidence-first judgements, repair limits and fail-closed behaviour. Do not weaken a gate merely because another model is used.

## 13. Implementation requirements

Use deterministic code for facts a model does not need to guess:

- capitals and terminal punctuation;
- sentence, word and opener counts;
- page count and A5 dimensions;
- text overflow and missing assets;
- component type for shifty markers;
- activity item counts;
- duplicate IDs and invalid continuity-state fields;
- missing or mismatched `conversation_id`, response linkage, image ID and `book_state_version`.

Use structured model outputs for judgements that require language or vision:

- grapheme segmentation and true phonics violations;
- causal plausibility;
- action and mechanism legibility;
- character/object/location comparison;
- progression versus drift;
- physical plausibility;
- contact-sheet narrative coherence.

Require evidence fields before pass/fail fields. A bare pass/fail judgement is invalid.

Record every failure, repair and final disposition. A successful export is not proof of a successful book.

Keep `sceneConsistencyQA()` wired into scene generation and job execution. Extend it to consume the character counts, placements, stable object IDs, location foundations, page changes, unchanged facts and forbidden states defined above. Apply the same gates to the cover.

Implement conversation state according to the current official OpenAI guidance for the Responses/Conversations APIs and multi-turn image generation. Do not assume that a successful API response proves the request received the correct book context; log and verify the identifiers and state version used by every context-dependent stage.

## 14. Implementation status (2026-08-11)

Real findings from a live production book ("Amina and the Book", Level 4, focus sound "oo") run against the pipeline as it stood before this pass. Recorded here so nobody re-discovers the same gap from scratch.

**Built this pass:**
- **§5.1 key-object identity references.** `generateObjectRef()` (`images.mjs`) draws each `key_objects` entry once on a plain background, the same fix hero/cast sheets already had; `objectSheetFor()` (`jobs.mjs`) caches it per book and injects it into every `generateScene()`/`generateCover()` call whose page/cover declares that object. Before this, a key object was redrawn from its text `look` alone on every page and drifted — the test book's red cap changed colour and trim shape page to page because nothing anchored it visually.
- **§2/§10 concealed-object check.** `reviewStoryPlausibility()`'s schema (`claude.mjs`) gained a `concealed_objects` field, checked against each page's `scene` field (the illustration brief), not just the reader-facing `text` — the test book's story stage wrote "a tiny corner of the book is just visible" into five different pre-reveal scene briefs while the reader's sentence honestly said the book was missing. A violation here now feeds `issues` and drives the existing one-bounded-rewrite path.
- **§3.3 focus-sound phoneme correctness.** `focusSoundViolations()` (`phonics.mjs`) is a deterministic check (no model call) against `pronunciations.json`'s per-sound `examples` and `from_level`: if a focus-grapheme word appears in an ABOVE-level sound's example list, it is a violation regardless of the story-level ≤3-above-level-words allowance, because a focus-word example teaching a not-yet-unlocked sound of its own grapheme is a different and worse failure than an incidental above-level word elsewhere in the story. The test book mixed "moon" (long /oo/, taught from Level 4 — correct) with "book"/"look" (short /oo/, taught from Level 5 — above-level) as if interchangeable; at Level 4 only "moon" should have been used.

**Still NOT built — §5.5 conversation/response-ID state.** The fixes above thread continuity through reference IMAGES (the existing `castRefs`/`anchorBuf` pattern, now extended to `objectRefs`), not through OpenAI Responses-API conversation state. There is no `conversation_id`, `previous_response_id`, or `book_state_version` anywhere in `claude.mjs`/`images.mjs`/`jobs.mjs`; every image call is still an independent `/v1/images/edits` request. Reference-image threading is enough to fix the visual-consistency symptoms observed so far, but §5.5's actual requirement — a durable per-book conversation an agent could ask "the next scene" of and have it mean something — remains unimplemented. Do not assume it works because the symptom it would have prevented (object drift) is now fixed by a different mechanism.
