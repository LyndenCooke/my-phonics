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
- Make the hero's declared gender unmistakable at first glance in the hero sheet and every scene. In this soft round-faced style an unstressed gender renders ambiguous and boys drift girlish ("Yusuf looks like a girl", two books, 2026-08-12): a boy reads as a boy whatever his hair length (boys can have long hair — do not force it short): boyish face and build, boyish clothing, no long eyelashes, no bow, no dress or skirt.
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

Use AT LEAST THREE, up to three, distinct orthographic focus-word forms in the story — three is both the floor and the ceiling. "One to three" landed a real Level 4 book on a single focus word ("soon" alone for a whole "oo" book — Lynden 2026-08-11: "there is only one story word... should be at least 3"); a book that undershoots has failed exactly as much as one that crams the sound onto every page. Treat inflections as separate forms. Spread naturally across the story rather than forced onto every page or repeated unnaturally, but never fewer than three.

The practice word list (`read_words`) is exactly 6 words drawn from words that actually appear in the story: EXACTLY 2 containing the focus sound plus 4 other level-worthy story words (Lynden 2026-08-16, was 3+3 — the sound is already spotlighted elsewhere in the book; this page earns more by widening level vocabulary than by drilling the sound a third time). The STORY TEXT still uses at least 3 distinct focus-word forms; the page just shows two of them.

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

Every obstacle posed must be overcome on the page by the hero's own visible effort or idea. A story that poses a blocker ("Can Yusuf get to it?" behind a gate full of cats) and then shows the hero at the goal without the page where they get past that specific blocker has failed, even if nothing is physically impossible (Lynden, 2026-08-12, "Yusuf Gets to the Dock"). The plausibility gate rejects it. "The Stuck Stool" is the model: setup, effort, earned result.

### 4.2a Plot source

The plot comes from the story shape and the focus-sound words alone. The family's notes (`culture_notes`) and the child's `likes` are set dressing: they colour what the pictures show (dress, food, streets, architecture) and must never supply the obstacle, the solution, a plot-driving character or animal, or the reason anything happens. Failure example: "feeding the cats by the harbour" in the notes became eight cats blocking the ferry gate as the plot obstacle (2026-08-12). `likes` is not passed to the story writer at all.

Stories should quietly carry one small moral a parent would want — effort, patience, honesty, kindness, fairness: Islamic values lived in everyday action — shown through the events, never stated in the text.

### 4.2b Journey stories: destination discipline

If the story travels toward a destination, the destination appears at most twice in the art: an optional distant glimpse in the opening establishing shot, then not again until the arrival page. Mid-journey pages frame the route and its obstacle with the destination out of frame. A journey book whose destination is visible in every picture reads as though the hero was standing beside it all along.

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
5. the immediately previous page's own image, whenever it shares this page's location — not gated on a judgement call. Undeclared recurring set-pieces (a specific rock's shape, where an object was left) only have this ONE source of visual continuity, since no formal reference was ever generated for them — gating this on "materially benefits" left every such prop free to reinvent itself every page (Lynden 2026-08-11: "the rock changes in every scene... no continuation of story through realistic image/object progression").

Use a previous scene as continuity evidence, never as the sole authority for identity, object design or art language — a character/object identity reference always wins over what the previous scene happens to show. State what must change and what must remain. Do not inherit undeclared people, furniture, objects or errors from the previous scene.

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

**§5.5 conversation/response-ID state — BUILT 2026-08-11 (hybrid), after a real pilot.** A standalone 4-page pilot (`_pilot_out/`, rock/pad/tide sequence) proved the two mechanisms have complementary strengths: the Responses-API chain (`previous_response_id`) kept the rock's shape, the pad's position and the tide's progression perfectly across all four turns — exactly what the stateless pipeline could not do — while the hero's OUTFIT drifted turn to turn because no identity reference was attached after turn 1. So the adopted design is hybrid: `responsesImage()` (`images.mjs`) runs each scene as a turn in one per-book conversation (`job.chainResponseId`, persisted in job state), with the hero/cast/object identity references STILL attached to every turn as input images. Chain = world state; references = identity. The cover chains onto the final scene so it inherits the resolved world (§8). Consistency-QA repairs chain onto the failed turn itself — a true multi-turn edit — and any chain failure falls back to the stateless legacy path automatically (`FORGE_CHAIN_SCENES=0` disables the chain outright). Known gap: an eye-repair edit happens outside the conversation, so the chain's internal image keeps unrepaired eyes — harmless for world continuity, but do not extend the chain to carry identity for that reason.

## 15. Second production run — real bugs found (2026-08-11)

The round-1 fixes above were re-tested on a second live book ("Amina and the Pad", Level 4, "oo", story shape "The race against time"). The pad/rug/string references worked — verified by directly comparing the generated `object_pad.jpg` reference against pages 1, 3 and 7 — but a fresh set of bugs surfaced, all now fixed:

- **§5.4 undeclared recurring set-pieces drifted.** The pad had a formal `key_objects` reference and stayed consistent; the ROCK it sat on did not, because it was only ever setting/location text, never a `key_objects` entry, and the location anchor is fixed to the very first image at that location — stale for anything the story adds later. Fixed by threading the immediately previous page's own image as an additional reference whenever it shares the current page's location (`prevBuf` in `generateScene`/`jobs.mjs`), not gated on a judgement call — see the rewritten §5.4 above. This is the actual mechanism the doctrine's "previous approved scene" bullet always meant, now automatic rather than aspirational.
- **Object-name matching was exact-string-only and failed silently.** `objectSheetFor` matched the director's per-page object name against `key_objects[].name` with strict equality; "black string" vs "string" missed, silently returning no reference for that page with no error logged — which is exactly why the string still drifted (and appeared attached to the wrong body part, see below) even though a reference sheet existed. Fixed with `resolveKeyObject()`: substring match both ways, and always cache/inject under the CANONICAL `key_objects.name`, never the page's own wording.
- **Wrong-body-part mechanism errors passed QA.** Page 5's text said the string was "on its leg"; the image showed it tied around the tail/wing, and `sceneConsistencyQA`'s `mechanism_legible` field passed it anyway, describing a leg attachment that was not in the picture — a hallucinated pass, not a real check. The schema description and system prompt now explicitly require naming the EXACT part the text specifies vs. the exact part the image shows contact at, and fail on a mismatch even when both objects are technically visible and touching.
- **Focus-word count collapsed to 1, not "1 to 3."** "Use one to three" let the model land on a single word ("soon") for a whole book. Changed to a hard floor of 3 (`focusSoundCountViolation()` in `phonics.mjs`, deterministic, folded into the same rewrite path as the other decodability checks) and tightened `read_words` to exactly 6 words with at least 3 containing the focus sound — was "6-8, at least half," which the model under-delivered on with nothing checking it.
- **Prose register drifted into adult/literary phrasing.** "The wash ran up and up" is not language a young child speaks or hears spoken to them. Added an explicit register rule to the story-writer prompt; no deterministic check exists for this yet (it is a judgement call, not a countable fact) — worth a future QA gate if it recurs.
- **A story shape grew an unrelated subplot.** "The race against time"'s own definition is a single throughline (beat the clock); the model added a disconnected animal-rescue detour mid-race that the shape never called for, on top of making the plausibility QA's job harder (two mechanisms to check instead of one). Added an explicit "stay on the shape's own throughline" rule to the story-writer prompt. No deterministic check — this is the same category as the register issue, a coherence judgement, not a countable fact.

## 16. Third run (hybrid chain) — checklist blindness (2026-08-11)

The first hybrid-chain book ("Amina Gets Food") confirmed the continuity fix — same outfit, same market, the map progressing believably page to page, story markedly better — and surfaced a NEW class of defect that every existing gate structurally could not see: the hero's face had NO NOSE on the fish-stall page, she reads the map from its blank back (printed side facing the camera), and the food bag squashes oddly against the map under one arm. All three passed every QA gate.

**The lesson: a checklist QA answers only its checklist.** The eye gate asks only about eyes; the consistency gate asks only "are the named objects present, does the action match, is the mechanism visible." No question asked "is the face complete" or "is the held object facing its user," so no answer ever flagged it — while a cold review of the finished PDF with NO checklist (ChatGPT, no SKILL.md, no hints) caught all three immediately, because fresh eyes look at everything. Fixes:

- The face-crop gate (`EYE_QA_SCHEMA` + `eyeRuleQA`) now checks FACE COMPLETENESS — a required `features_seen` field lists which of eyes/eyebrows/nose/mouth are actually drawn per face, and a front or three-quarter face missing its nose or mouth fails. `repairEyes` adapts its edit prompt when the failure is a missing feature rather than a wrong eye.
- `sceneConsistencyQA` gained a required open-ended `defect_sweep` field — "ignore the checklist, look with fresh eyes, what would a picky parent object to?" — with held-object orientation (a map/book being read faces its reader, never its blank back) and impossible held-item overlaps called out explicitly, feeding the same one-bounded repair path.

Keep both kinds of field in every future vision gate: structured comparisons force real judgements the model cannot hedge past, and the open sweep catches the failure category nobody predicted. One without the other has now demonstrably shipped defects.

## 17. Fourth run — mutable state + cast age (2026-08-12)

"Food for All" ran with the new gates live and proved them (face completeness recorded per page; page 4's consistency QA failed a first attempt and the chained repair fixed it before shipping). Two new defect classes surfaced, both root-caused and fixed:

- **Mutable object state had no anchor.** The dot card kept its IDENTITY (white card — pinned by its reference sheet) but its size and the placement of the dots on it changed between pages, because dot layout is STATE, not identity: the reference sheet shows a blank card, the conversation chain carries the world only loosely, and the director's plan says what SHOULD happen — nothing recorded what the approved image ACTUALLY showed. Built `extractSceneState()` (`claude.mjs`): after each page passes QA, one vision call records each key object's literal visible state (size, position, orientation, layout of marks/contents), persisted as `job.carriedState` and injected into the NEXT page's prompt as binding fact when the location is unchanged. This is §5.5's "extract the resulting state" requirement, previously the one unbuilt piece of it. Non-fatal on failure — the next page just falls back to plan-only state.
- **Cast sheets hard-coded ADULT.** "Sam, Amina's pal — a six-year-old boy" rendered as a bearded man because `generateCastMember` unconditionally injected "this is an ADULT" (added 2026-07-26 when text-only mums rendered as older sisters — right for parents, wrong the first time a story cast a child). Every scene then faithfully matched Sam's wrong sheet, so no downstream QA could catch it — when a reference itself is wrong, reference-following turns the error into consistency. The age clause now follows the declared member (boy/girl/child/kid or stated age ≤12, digits or words → child proportions, no facial hair). Standing lesson: a bug in a REFERENCE propagates invisibly; sheet-vs-declaration verification at generation time is the only gate that can see it.

## 18. Fifth run — the cold-read gap made structural (2026-08-13)

"The Chip on Top" (Level 3, "ch") ran with all prior gates live, passed every one, and was rejected by a cold external review of the finished PDF (5.5/10): a 17-page export (unstitchable — §11 already demanded 16), only 3 Story Words shown (the writer had produced the required 6; the PDF spec passed only the 3 focus examples), a premise too thin to be a story (a mix-up corrected in one glance), instruction-register narration ("Yusuf can check the top"), an identification chip with no fixed shape or location (invisible in most frames), and characters boarding the ferry between pages with no sentence moving them. **The doctrine above already forbade most of this — the failures were unimplemented or unwired checks, not missing rules.**

Root cause of "why did our QA miss what a cold reviewer caught instantly": every gate was (a) a VERIFIER, asked "does this match the spec?", where the external review was a CRITIC, asked "why should this not ship?"; and (b) scoped to one page or one artifact, where the failures lived at the level of the whole book. Framing and altitude, not model quality.

Built this pass:

- **§11 page-count gate, deterministic, both render paths.** `pdfPageCount()` (`pdf.mjs`) + a hard throw in `renderPdfServerless` (`jobs.mjs`), and a pypdf assertion that deletes the output in `generate_custom_book.py`. 16 pages L1-4, 20 pages L5-8, no delivery on mismatch. Composition made true: custom story pages are 6 at L1-4 / 8 at L5-8 (`storyPagesFor`, `jobs.mjs`), and the 16pp custom template drops the written-retell "Tell the Story" page in favour of Meet the Star (`book_v2.html`, gated on `profile and page_count == 16`).
- **§9 six Story Words.** `buildPdfSpecCore` now passes all six `read_words` (≥3 focus-sound) as `story_words`; the writer already produced them, the display was dropping half.
- **§4.1 plot-critical marks pinned.** Writer: a distinguishing feature gets an exact shape AND an exact location ("a small crescent-shaped piece missing from the upper-right corner of the lid"), and near-identical objects differ by exactly that one bold feature. Director rule 8a: the mark is in shot, at its declared spot, on every relevant page; pages with both similar objects must be tellable-apart by a non-reader; the deciding page shows the hero looking at/touching the mark. `sceneConsistencyQA` gained a required `distinguishing_feature` field (fail on missing/moved/misshapen mark, or indistinguishable similar objects); `extractSceneState` records the mark's exact shape and position for the next page.
- **§10 cold-editor whole-book gate, wired as a step.** New `review` step between `country` and `assemble` (`stepReview`, `jobs.mjs` → `coldEditorReview`, `claude.mjs`): the finished book — cover + every page image (downscaled) + every sentence + declared Story Words and key objects — goes to a critic-framed editor. `cold_read` free reaction FIRST, then rubric fields (story quality, language, object identity, image-text agreement, phonics presentation), then issues with reject/minor severity. Any reject-severity issue fails the book before assembly; the review is stored in `breakdown.editor_review` either way. The bar in the prompt: "pass only if you would send it to print under your own name"; a premise-thin mix-up and can-verb narration are named as failures.
- **§4.2c story-development + narration rules in the writer.** A premise is not a plot (goal, developed problem, cost, change — stakes named before writing); narration never uses "can + verb" for performed actions; prose moves the reader between locations the pictures change to.

Added same day (Lynden rulings):

- **Rewrite once.** A cold-editor rejection triggers ONE bounded revision (`reviseStoryAfterEditor`, `claude.mjs`): the story is rewritten against the editor's reject reasons (plot may change; child, setting, level constraints and focus sound keep), then the machine re-enters at phonics QA — direction, scenes and cover regenerate; the hero sheet survives and cast/object sheets refill on demand. A second rejection fails the book with both reviews stored (`editor_review_first` + `editor_review`).
- **Custom-book sound chart.** Custom books (profile set) show the FULL cumulative grapheme chart under "Sounds you should know" (`generate_custom_book.py` overrides `chart_graphemes`; label switches in `book_v2.html`) — the library's "previous level + this level up to the focus sound" warm-up is for mid-series readers and omitted foundations (a, m, t...) for a one-off reader.
- **Future Sounds for custom books = strictly above-level.** The library taught-window's mid-level cut flagged `th` as a Future Sound in a Level 3 book whose own chart teaches `th`; custom books now filter `future_sounds` to home-level > book level, matching the full-level window the forge's writer already uses for decodability.

Known still-open (needs Lynden/pedagogy): word-by-word tricky-word classification display on the reference page, and the green-words bank expansion (1,950 words; "problem" absent). The cold editor's `phonics_presentation` field flags contradictions in the meantime.

## 19. Sixth run — visual continuity is the remaining frontier (2026-08-14)

"The Star Card" (Level 4, "ar") was the first book through the full gauntlet: cold editor rejected the thin first draft, rewrite-once produced a real search story, the page-count gate caught (and forced the fix of) a pre-existing 17-page L4 template bug. Lynden's review: still not a pass — the gauntlet catches structure but missed the two things that matter most, character consistency and object-state continuity. Page 4 redressed the hero entirely (no headscarf, yellow dress vs her white-headscarf pink-tunic sheet) and no gate could see it; the mat — the story's hiding place — was never tracked, so its pattern, tassels and lifted-edge physics drifted.

Built this pass:

- **§7 character wardrobe QA per scene.** `sceneConsistencyQA` now receives downscaled hero + cast reference sheets and a required `character_match` field: describe the scene's wardrobe item by item (head covering present/absent + colour, garments + colours, footwear, hairstyle, accessories) and compare against each sheet. ANY wardrobe difference is a fail — identity is the whole look, not the face. Feeds the existing one-repair-pass loop in both scene paths.
- **§5 dynamic continuity register.** An object joins the register the moment the story makes it load-bearing, not only as an up-front key_object: `extractSceneState` now records director-declared per-page objects too, and the director's rules require a full fixed description at first appearance, the same description on every later page, attached parts (tassels, fringes, straps) moving WITH their object, and each image starting from the previous image's physical state (card poking out → same corner lifted → bent corner still bent).
- **§4 naturalness never overrides decodability.** Editor + rewrite prompts: the right wording is the most natural available WITHIN the taught graphemes — "caught" over "hit" at L4 is worse, not better. Restructure the sentence if no natural in-level word exists.
- **§3.3/§9 six Story Words enforced deterministically.** The writer returned 8 and the page printed 8; `stepQa` now normalises `read_words` to exactly 6 (≤3 focus-first + others, topped up from the story's own bank-decodable vocabulary), and `buildPdfSpecCore` hard-caps at 6.
- **§3 full-level taught window for custom books, at the root.** `build_book_data_from_story(full_level_window=True)`: the whole current level counts as taught, so `or`/`ou` can never be labelled "coming at Level 4" inside a Level 4 book — this reaches the Sound Spotlight future row and Sound Detective, which the earlier post-hoc `future_sounds` filter could not.

Open policy question for Lynden (pedagogy, not code): `-ed` (L7) appears as a Future Sound preview while the story uses showed/lifted/jumped and the tricky-words strip teaches around it — is teaching-around-a-future-concept acceptable at L4, or should the writer be banned from -ed forms below L7? Also his ruling stands: deterministic code wherever possible (page count, word counts, sound classification); AI review focuses on language, motivation, character continuity, object-state continuity, realistic progression between consecutive images.

## 20. Seventh pass — simplicity, one-thread planning, and the two lanes (2026-08-16 → 08-19)

> **SUPERSEDED IN PART BY SECTION 21 (2026-08-22).** The lanes, the simplicity caps and the operational lessons below still hold, but books are no longer planned by inventing a story: they VARY one of the 33 published books. Where 20 and 21 disagree, 21 wins.


Four complete books shipped (Hamza L4 "ow" 16pp, Safa L3 "th" 16pp, Danyal L2 "ll" 16pp, Maryam L5 "oa" 20pp — $1.30-$2.65 all-in). Lynden's verdict: "fairly impressed" — with named defects, every one traceable to a specific mechanism. The doctrine changes below are binding.

### 20.1 Simplicity IS the house style (Lynden: "the more details the more chance of failure")

The data was unambiguous: simple stories (The Wet Way $0.37, The Hoop Contest $0.40) passed the editor first-draft AND made the best books; complex ones cost $1.0-1.6 in edit passes. Binding caps: ONE story thread in one connected location, hero plus AT MOST one adult, AT MOST TWO key objects, exactly ONE physical mechanism a parent could re-enact in the kitchen. The editor's calibration bar is the published MPB books, NEVER literary fiction: blocking is only nonsense/contradiction, a hero who causes nothing, unsafe behaviour, phonics violations, or text/scene disagreement. Simplicity is never a fault; the editor fixes stiff lines itself instead of demanding rewrites.

### 20.2 No full rejections — edit requests only (Lynden 2026-08-17)

A gate never kills a book. Both rejection sites record remaining blocking issues as edit requests on the row (`story_gate_edit_requests` / `editor_edit_requests`) and the book proceeds. Story-gate passes bounded by FORGE_STORY_EDIT_REQUESTS (default 2 — each pass costs a first draft; it is a spend ceiling, not a quality dial). The premise unlocks when the editor files area "premise" — and a hero who causes nothing, or a problem resolved by weather/luck/time/an adult, IS a premise failure, filed as such — and also on the final edit pass (a premise that survived one failed rewrite is the thing that keeps failing).

### 20.3 One-thread planning (the architecture that won)

Everything for one book in ONE model conversation (gpt-5.6-sol, Responses chain): write → self-check → same-window editor → forward simulation (what a child sees N→N+1) → BACKWARD planning pass (walk from the final image to page 1; plant evidence early; residue persists after the mechanism resolves) → storyboard physics gate (materials behave like themselves — water soaks and darkens, never pebbles; causes visibly connected to effects) → the final per-page package in `directed[]` form. Measured: $0.59-0.79 all-in including image planning, zero edit passes over five runs, and the physics gate caught real faults text-only (wet paper must darken; felucca-sail wind would move loose paper — shelter the balcony). Reference harness: `_test_one_thread_book.mjs`. PORT INTO THE JOBS MACHINE — the four books ran generation-QA only, and every defect Lynden found (setting drift, kite redesign, cover thobe colour) maps to a bypassed jobs-machine mechanism (location anchors, object ref sheets, cover QA, final editor).

### 20.4 Shifty sounds gate the writer, not just the marks

A grapheme only counts WITH its taught pronunciation. "Up Now!" (L4 "ow") used now/down — ow=/ow/ is Level 6; ow=/oa/ (blow/snow/low) is the L4 sound. The doctrine block is generated from `shifty_sounds.json` per level ("ow at Level 4 is ONLY /oa/ as in blow/snow — NEVER /ow/ as in cow/now/down, that is Level 6"), plus a deterministic post-check greps the ledger's own example words for gated pronunciations out of the title, text and word lists. String containment (`w.includes("ow")`) is sound-blind and forbidden as a focus-word test.

### 20.5 Object identity: pin where present, forbid before reveal

Two failures, one rule. The chain proof's kite changed colour because nothing pinned it; the global fix (identity pin in EVERY brief) then made Maryam's resolution bowl appear from page 1 — an identity pin in a brief leaks into presence. Binding: pin an object's full identity ONLY on pages where the storyboard places it, and auto-add "not visible yet" to `forbidden_visible_states` of every page before the object's reveal. Text pins are insufficient for identity across pages — the object reference sheet mechanism is still required.

### 20.6 Wardrobe wording names the drawable state

"Long dark hair under a scarf" drew hair flowing out the back; "a hijab covering ALL her hair — no hair visible at front, sides or back" drew it right. Same law as setting-needs-architecture: name what the picture must show, never the garment category. A full redo from a corrected hero sheet cost $0.70 on the flat lane.

### 20.7 Two image lanes, both OpenAI

The chain lane (Responses API, 1536x1024, usage-priced $0.11-0.43/scene, cost GROWS with page position as the chain re-reads its history) and the flat lane (gpt-image-2 via fal, 1024x768, flat $0.07/image, `FORGE_IMG_ENGINE=gpt2`). Lynden rated the flat lane's output highly BLIND — it is the value lane; the fal key works again. Chained scene 4 in the proof cost $0.093 — chain is not automatically the expensive option early in a book. An explicit FORGE_IMG_ENGINE pin means NO fallback; without a pin, engine failover happens silently (Danyal/Maryam fell to fal after 503s) — a pin must become mandatory per book in the port.

### 20.8 Judging: cross-vendor, medium effort, plausibility on the cheap seat

The gate never runs on the writer's vendor (claude.mjs `judge:`). Opus 5 at effort medium found the SAME issues as high for 27% less; below medium the gate stops finding things. Plausibility (mechanical: sizes, apertures, ownership) prefers the cheap vendor; the cold editor's literary read keeps Claude. Rubrics are prompt-cached; cached input is priced at write 1.25x / read 0.1x in the ledger.

### 20.9 The 20pp custom layout had never rendered

Every L5+ custom book since the 08-13 page-count gate had been text-only; first real render produced 21pp (fleet 20pp plan + Meet the Star). Fixed: Word Workshop yields its slot when `profile` is present (same swap the 16pp layout already does; drill lives in the companion workbooks per 2026-07-22). Fleet books have no profile and are untouched. L7-8 custom is the SAME latent class and remains unexercised — exercise it before any L7-8 custom sale.

### 20.10 Operational lessons that cost money to learn

Validate level/sound pairings against /levels BEFORE a run (7 of 10 test cases died at the door). A poll loop must retry 5xx — one ENETUNREACH stranded a paid job that POST /retry resumed from checkpoint. "Killed" task status is not proof the process died — check the process table before relaunching, or you pay for a duplicate run. Image-generation harnesses must be resume-aware: anything on disk is paid for. No automatic attempt exceeds $1.75 without a wired cap — the batch harness had none and Hamza's art cost $2.04.


## 21. Eighth pass — variation from the 33 books, and the rules that came out of it (2026-08-19 → 08-22)

Thirteen books shipped across the two lanes. §20's one-thread harness did its job and its findings are folded in below; **where §20 and §21 disagree, §21 wins.** Everything here is live in `claude.mjs`, `jobs.mjs`, `images.mjs`, `phonics.mjs`, `book_v2.html` and the data files, and every rule below exists because a real book failed without it.

### 21.1 Books VARY a published book — they no longer invent a plot (Lynden 2026-08-21)

"The 33 books i made have great stories. All you need to do is make variations of them based on new places/objects and characters." This is now the architecture, and it retires the failure class that produced almost every story defect we ever found: circling searches, invented contraptions, heroes who caused nothing, word-hunting.

`data/story_patterns.json` holds every published book distilled to STRUCTURE — `pattern_name`, `spine` as stageable beats, the **DEVICE** that makes it work for a child, the `slots` a reimagining must replace, three suggested settings, and an honest `simplest_level`. Built once by `_distil_patterns.mjs` ($0.27); static thereafter. `sourceStoryFor(level, avoid)` picks by the pattern's own FLOOR, **not** by matching source level to target level — a Level 2 book may wear a Level 7 structure, because what changes with level is the sentence length and vocabulary, not the shape of a story. `recentSourceStories()` stops the same plot recurring.

The writer's brief then says: keep the spine and the device; simplify the LANGUAGE, never the STORY; replace place, objects, people and sound entirely; **the family resemblance is welcome** ("as all movies are pretty much stories reimagined") but not one sentence carries over.

**When the pattern will not fit the page budget, cut the COUNT and never the DEVICE.** A Level 2 attempt at the three-clue journey kept three animals and dropped the guessing, leaving a list of sightings; two guessed reveals beat three bare ones.

**Trust the floors.** Forcing a pattern below its `simplest_level` produced disconnected fragments ("A dot did pop. A tot did nod.").

**Level ids:** `core_story_digest.json` stores LEGACY ids — the old ten Level 1 books were split across new L1/L2/L3 (`NEW_TO_OLD` in `generate_pilot_books.py`). `story_patterns.json` carries the true current level. Ledger: 2/5/3/6/5/4/4/4 = 33. **Level 1 is only *Tap! Tap! Tap!* and *The Mud on the Dog*.**

### 21.2 The writer's brief is a brief, not a rulebook

It had grown to 5,127 words carrying 64 prohibitions, with the published exemplars buried two-thirds down — so the model spent itself on compliance and returned sentences that were legal rather than warm ("A chip is on the lid"). Restructured to ~2,900 words in eight sections: **exemplars first**, then voice, story, phonics contract, level, illustrator, house checklist, outputs. A 190-rule inventory was extracted before the rewrite and verified after; nothing was lost.

`polishStoryAloud` then gives the writer what it never had: its own finished story, a short craft brief, and permission to care only how it sounds. It costs about a penny when nothing needs changing and $0.08 when it rewrites — **so its cost is a quality signal**. Every polished line is re-checked with `decodeProblems` and reverted if the prettier wording broke the phonics contract.

### 21.3 Level 1 is a ditty; Level 2 and up are stories

At Level 1 the sound leads and repetition is the form — a child with ten letters reads the next line because it is almost the last one. Repeat a frame with ONE word changed; use the focus sound in as many words as the bank allows. **Commas are allowed at Level 1 for repetition only** (recorded in `reading_progression.json`, not just the prompt). **Only repeat a word that still means the same thing alone**: "I sit, sit, sit" works; "I stand, stand, stand" says the child is standing and the tin has vanished.

**This applies to Level 1 alone.** Gated at ≤2 it produced a chant at Level 2, which Lynden rejected.

The fix that actually made Level 1 work was not prose but **handing the writer the words**: `focusBank` filters the level's word bank to the focus sound, turning "derive every /s/ word from ten letters" into a choice. Level 1 has 31 of them. Generally: **prose permission is applied inconsistently; a countable target sticks** — ≥4 pages reusing a frame, ≥2 comma lines, ≥half the content words carrying the sound.

**Level 1 vowels are too thin for initial-position ditties** — "o" has ONE Level 1 word starting with it, "i" has three. Unresolved product question.

### 21.4 Phonics honesty, and what the page may claim

`split_into_phonemes` silently falls back to one dot per letter for any letter with no taught grapheme, so untaught and dishonest spellings printed as if fully decodable — "knack" as k·n·a·ck, "listened" as eight dots — under the words *"Sound out each phoneme, then blend."* That breaks the 100% decodable claim at the exact spot the claim is made.

- `decode_problem` (Python, fails the PDF build) and `decodeProblems` (JS, runs in the machine) are mirrors: untaught graphemes, plus a named list of **dishonest spellings** — a word only counts as decodable if its taught letter-sounds actually produce the word children say (wash is 'wosh', basket is 'baskit', listened has a silent t).
- **The title is checked too** — it was never checked before, and shipped "kn".
- **Practice words may not be people** — a book listed "amara" and "dad" among its six Story Words.
- **The hero's name is a tricky word.** Sounded honestly, "Tomasz" is t-o-m-a-s-z. It is taught in the Tricky Words strip with a per-book `nameBreakdown` ($0.0003), and the writer names the hero in sentence one then uses pronouns.
- All 97 ledger tricky words have curated breakdowns (`data/tricky_word_breakdowns.json`) showing the parts, the misbehaving one, and the plain spoken form. **Breakdowns and the name note stop after Level 4** (Lynden 2026-08-22): by Level 5 these are sight words.
- **No word-hunting (L2+):** 3–4 distinct focus words, one per sentence. Nothing exists only because its name carries the sound — a book put GOATS at a bus stop. The story text is one of FOUR surfaces teaching the sound (title, Story Words, Sound Spotlight, alien words) and must not do that work alone.

### 21.5 Story rules that each cost a book to learn

- **Pointable beats.** Every beat changes something a child can point at — physical (sunk/floating, wet/dry) or **social** (one child holding everything while others are empty-handed). "Pats the base flat" is invisible at picture-book scale.
- **Teach the real technique.** A skipping book had Mum say "wait for the tap on the ground, then jump", which cues the jump far too late. A hero who succeeds on advice that would not work teaches a child something false, and every other gate passed it.
- **Drawable, not invented.** The mechanism is a common, instantly recognisable activity — never a new contraption. A ring threaded on a string between two people is an invention; a kite is not. Name the traditional form of everyday objects (a washing line is a rope between posts, not a folding rack).
- **A search must narrow.** Each look rules a place out or yields a clue; never send the hero back somewhere already searched without a new reason SHOWN. Grass → bench → same grass makes the first look careless.
- **Plant the lost thing** visibly in an earlier picture — the one deliberate exception to hiding an object before its reveal.
- **The world is fixed; the spot is not.** The brief used to contain both "prefer stories that move" and "the setting is identical on every page", and the model resolved it by never moving her. A travelling story takes a different point on the route each page and says what changed.
- **The second attempt must LOOK like one** — different position, hand, tool or route. Two pictures of the same attempt are one attempt.
- **Name a key object the same way every time.** "A small tin" on page 3 and "the blue oil tin" on page 7 produced two different objects; the illustrator draws what the sentence says, and a new adjective silently redesigns the thing.
- **No spec-sheet sentences and no adult interiority.** "It had black wheels and a white star on its roof" is a catalogue entry — object detail belongs in the scene brief. "Her chest felt tight" is grown-up; show feeling through what the child does and says.

### 21.6 Images: design the plausibility in

The scene prompt only ever carried a general homily (things rest on surfaces, nothing hovers), which cannot prevent a specific impossibility. The **director now emits a per-page `physics` contract** — what touches what, what carries the weight, how many of each thing, and the exact shape and low point of any rope or line — injected verbatim as "PHYSICS OF THIS PICTURE". On its first test every page passed QA first time.

**A camera plan belongs beside it.** Physics without framing gives six correct pictures a child cannot tell apart; vary wide / mid / low / close / over-shoulder, and make the ordering activity solvable.

**The cover is a crop of a story page, never generated** (Lynden 2026-08-20). It picks the page with the biggest CHILD face among pages 1..N−1 — the biggest face overall is usually the adult — and crops portrait centred on it, for about $0.001. This deleted a whole defect class: painted-in lettering killed two books, and generated covers also duplicated the hero and invented settings.

### 21.7 QA in three layers, and no gate may kill a paid book

1. **Deterministic, free, cannot drift:** the decodability gate; a perceptual-hash check that no two page images are near-identical; and `ship_report.json` naming every gate that ran — *a gate that silently did not run is the worst failure mode we have hit.*
2. **Adversarial lenses on the cold editor**, because every earlier gate checked the book against ITSELF: `teaching_truth` (is it true — judge the exact arrangement drawn, and count what the job needs: one plank will not lift a two-wheeled cart), `image_physics` (count strands, limbs, wheels), `setting_persistence`, `middle_progress` (does the middle narrow or circle?). A missing answer escalates to blocking. **Keep these answers to two or three sentences** — the lenses exist to make the model LOOK, not write.
3. **Repair, not rewrite.** Every editor issue carries a REQUIRED `pages` list; empty means genuinely whole-book. Only premise/story/language/phonics/safety/teaching-truth force a rewrite; a cover fault re-crops; a page failing QA twice ships with a recorded edit request. §20.2's "no full rejections" was never applied at the page level, and one stubborn page used to kill a fully paid book.

### 21.8 What a book costs, and where it actually goes

A clean book is about **$2.10** (The Green Jeep: $1.07 text, $1.03 images). A clean page is $0.083; **a page that fails QA costs $0.31–0.52**, so QA churn — not image price — is the cost driver. Scene QA now grades blocking vs minor and only blocking regenerates.

Measured savings: story gate capped to one pass (~$0.80); plausibility folded into the story gate, which was a second paid read of the same 60 words ($0.41); phonics QA deterministic-first; the cover free. **The cold editor is now the largest single line** (~$0.62) because the new lenses invite essays and it was sent 1024px thumbnails of every page — cut to 640px with a brevity instruction.

`FORGE_MAX_BOOK_USD` caps and pauses correctly; a retry raises it one unit, so only resume when you mean to spend.

### 21.9 Operational traps that cost money

- **Never edit `server/forge/*.mjs` while a book is running** — vite hot-reloads and kills the generation mid-flight.
- **Check for a stray second dev server**: one took port 8081 while curl kept hitting a stale 8080, so edits and API calls hit different processes.
- **fal locks with "User is locked. Reason: TOP_UP"** — probe with a REAL generation call; a bare POST returns a 422 validation error before the lock ever shows.
- Deliver PDFs to BOTH desktops: OneDrive Files On-Demand can hide a file written to the OneDrive Desktop.

### 21.10 Still open

- **300 dpi is unsolved** and is the only hard print blocker: source art maxes at 1536px, A5 with bleed needs ~1819px.
- PDFs are untagged (Playwright cannot; the Prince backend could).
- **Pattern adherence is unchecked** — a book assigned one structure can write another and nothing notices.
- Split-digraph marking on the Story Words page needs planner-supplied segmentations.
- The 33 pattern `device` lines and floors, and the 97 tricky-word breakdowns, were authored by Claude and want a specialist read before print.

## 22. Night runs — three-run improvement loop (2026-08-23, overnight)

Lynden's brief before sleeping: run the pipeline three times, review after each,
bank every fix here, then validate on a final run. Target: **≤$2.50 a book, quality
output**. Baseline going in: "Kai and the Car Tracks" at $3.72, where $1.30 of that
was the (now fixed) editor-wipe bug and ~$0.55 the repair round it forced.

### Run 1 — Amina, "oi", L5, Marrakech (789dbaa4): killed at the imagery gate

The story arrived at the gate with two open majors and $0.95 already spent, so no
image money followed it — the cheapest review a bad draft can get. Findings:

1. **Prompt rules are advice; schemas are physics.** The writer prompt has said
   "maximum 3 cast" since 08-21; this story declared SIX (mum, lost boy, guard,
   and the boy's mum AND dad) — six sheets to pay for and crowd into eight
   scenes. Same night, the freshly-written "no marks on unique objects" rule was
   ignored too: a lone toy pony got a "coin spot" and page 7 turned on it with no
   setup (the editor's open major). Fixes: `maxItems: 3` on cast and key_objects
   in STORY_SCHEMA (the schema layer retries until obeyed), and the mark rule now
   ends with a mandatory self-check ("reread key_objects; delete unearned mark
   clauses"). If the mark disease appears again, the next escalation is
   deterministic: strip mark-phrases from `look` in code when no second similar
   object exists.
2. **Family resemblance must know WHOSE family.** The hero-sheet-as-reference
   binding (added earlier tonight) would have matched "boy_mum" — the OTHER
   family's mother — to the hero's colouring. Detection now requires the relative
   to be the hero's own (bare "Mum"/"Dad"/"Nana" or "<hero>'s mum"), and excludes
   "his/her/their mum", "<name>_mum", "<other>'s mum". Eight-case test passed.
3. **Where the text money goes:** story $0.09, phonics QA $0.15, story gate
   $0.44, directing $0.28. The gate is the biggest text line: first review + one
   revision + follow-up. A draft that passes first time costs ~$0.20 at the gate;
   convergence on the first draft (fewer editor-bait defects like unearned marks)
   is therefore also the main text-cost lever.

### Runs 2-4: blocked on OpenAI quota (2026-08-23 ~03:00)

Run 2 (same Amina spec, on the fixed code) died at the first writer call:
OpenAI credit exhausted — the recurring pattern. Book b410a939 is checkpointed
at paused_provider_credit with $0 spent and resumes with POST /retry after a
top-up; it will pick up every fix from run 1 (schema caps, scoped family
binding, hardened mark rule). Deliberately NOT rerouted to the Anthropic key
overnight: a vendor swap mid-loop would invalidate the comparison and spend
un-authorised billing. The loop resumes at "run 2" the moment credit exists.

### Run 2 — Amina, "oi", L5 (b410a939, "The Foil Card"): first fully

autonomous READY book (2026-08-23 afternoon, after credit top-up)

Resumed with POST /retry; ran story → gate → imagery → cold editor → ready
with zero human repairs. Findings:

1. **Every run-1 fix held.** Cast came back as 2 (dad, sis) against the
   schema cap that run 1 blew with six; no unearned mark on any key object;
   the family cast is the hero's own. The story gate passed FIRST TIME with
   zero majors and five minors — gate cost $0.14 vs $0.44 when a revision
   round is needed. Convergence-on-first-draft is real and it works.
2. **Cost $3.78 vs the $2.50 target.** Breakdown: text $0.89 (story 0.40,
   direct 0.31, gate 0.14, QA 0.05), scenes $2.07 across 8 pages (per-scene
   spread $0.11–$0.61 — the spread is QA repaints), hero+cover+country $0.16,
   final cold-editor review $0.66. The $2.50 target assumed ~6 images; an
   8-page book with per-scene vision QA plus a $0.66 whole-book review may
   structurally land ~$3.00–3.80. Levers, in order: (a) fewer repaint
   retries (the contact fix below removes one class of them), (b) the review
   stage price, (c) scene count. Decision on which to pull is Lynden's.
3. **Contact beats get drawn as near-misses.** The cold editor's one OPEN
   major at ship: text "slid into a mop", picture shows Dad slipping NEXT to
   the mop. Director rule 9z only demanded contact staging on the mechanism/
   resolution page, so a mid-book slapstick collision had no contact
   requirement. FIXED: 9z now applies to every page whose text asserts
   contact (slid into, bumped, knocked, caught), with the touching parts
   named in required_visible_states. The repair budget had gone to page 7,
   and the book shipped with the mop major open — by design (one revision,
   then proceed), but the 9z fix should stop the class.
4. Un-actioned minors that shipped: hero agency dips pages 4–6 (dad performs
   the save), "oi" practice on the light side (3 distinct words — meets the
   writer rule as written, editor wanted more). Logged, not fixed: both are
   taste-level and the current rules already sit at the agreed thresholds.

### Run 3 — Yusuf, "ur", L6, Istanbul (9878e41e, "A Turn for Baba"):

ready autonomously, but the dearest book yet ($4.57)

Third clean first-draft gate pass in a row ($0.12 gate). Deterministic
phonics check came back clean and SKIPPED the paid QA gate entirely (QA line
$0.04) — the renderer-sync work directly saving money. Findings:

1. **"purse" killed the PDF at typeset — the -se one-unit ruling was never
   ported to JS.** decodeProblems read p-ur-s-e (every letter taught);
   the renderer splits p/ur/se and refuses the untaught "se" unit
   (Lynden's 2026-07-12 silent-e ruling). The finished book's typeset
   failed on both the page-7 text and the practice word. FIXED
   (`d0ab6899`): the JS gate now mirrors split_into_phonemes' word-final
   se/ve merge, magic-e guard included, verified against the Python gate
   on purse/horse/house/nurse/mouse/wave/give. The shipped book was
   repaired by hand: page 7 "his purse" → "his bag" (the drawn object is
   a small brown pouch — still honest), practice word purse → turn
   (already in the story, keeps exactly 2 focus-sound words); PDF then
   typeset clean.
2. **The broadened contact rule (9z) worked where it applied**: page 5's
   bag-pull is drawn with both boys gripping the bag — genuine contact,
   the class run 2 shipped broken. But the editor's open major moved one
   layer up: page 5's text narrates THREE actions (bag freed, tins
   stacked, cart swept) and the picture shows only the first. Multi-action
   page text cannot be drawn by one frame. Candidate fix (NOT yet applied
   — needs a decision on writer-vs-director): either the writer keeps each
   page's text to what one picture can show, or the director must stage
   evidence of every named action (tins mid-stack in the background).
3. **Cost $4.57 — where it went**: scenes $3.10 (scene:5 $0.63, scene:6
   $0.93 — the page-7 purse-absence proof looped repaints then regenerated
   from scratch chasing "pocket visibly open and empty"), review $0.49,
   story $0.41. The 9a absence-proof rule is the priciest thing in the
   imagery pipeline when it fights the illustrator.
4. **The write cost mystery solved (Lynden asked)**: story-stage cost is
   bimodal across the fleet — ~$0.03 (books written by last night's
   FORGE_WRITER_MODEL=cheap server) vs ~$0.26–0.41 (gpt-5.5 writer).
   No retries involved; it is purely the model. The cheap writer's Kai
   9701bff9 was the first-ever clean gate pass, so the evidence so far
   says mini drafts survive the gpt-5.5 judges fine. The validation run
   should set FORGE_WRITER_MODEL=gpt-5.4-mini (~$0.37/book saving) and
   settle it.

### Validation run: PAUSED ON OPENAI QUOTA AGAIN (2026-08-23 ~17:33)

Runs 2+3 consumed the whole top-up (~$8.35 billed). Validation book
Sana "ee"/L4 Lahore (63c1f9e2) is checkpointed at paused_provider_credit,
$0 spent. Resume after top-up: POST /retry on it — the dev server must be
the one started with FORGE_WRITER_MODEL=gpt-5.4-mini (the cheap-writer
A/B is the point of this run). Gotcha found doing this: TaskStop/Ctrl-C
on `npm run dev` can orphan the vite child on Windows — the replacement
server silently takes 8081 while the old env keeps serving 8080. Check
the port banner before trusting which env a run executes under.
After the validation book: review it against every s22 finding (schema
caps, marks, family binding, contact staging, se/ve gate, story quality
from the mini writer), write the verdict here, then the loop is done —
remaining open items: multi-action page text (finding 2, run 3),
absence-proof repaint cost (finding 3, run 3), review-stage price.

### Validation run — Sana, "ee", L4, Lahore (63c1f9e2, "Sana and the

Green Seeds"): $2.40, UNDER TARGET, zero open editor notes

Resumed after the second top-up on the FORGE_WRITER_MODEL=gpt-5.4-mini
server. First book to come in under the $2.50 target, and the first to
ship with NO open edit requests at the final editor. Verdict by finding:

1. **Cheap writer: adopt, with the revision caveat.** Write $0.023 (vs
   ~$0.40 gpt-5.5). The mini draft did NOT pass the gate first time —
   one revision round, gate total $0.36 vs $0.12–0.14 for gpt-5.5
   first-drafts — so the net text saving is ~$0.15/book, not $0.37.
   Post-revision quality held: convergent re-review confirmed 2/2 notes
   fixed, and the final cold editor passed the whole book clean at
   $0.13 (vs $0.49–0.66 when it finds faults). Sample of one, but the
   pattern matches Kai 9701bff9 (also mini, also clean).
2. **Every banked fix held**: cast 3/3 cap, family binding correct, no
   PDF typeset failure (se/ve gate live upstream — the writer's draft
   contained no -se words to catch), read_words normaliser + sanitiser
   both fired correctly in the log. The lone tin has a "red star" mark
   BUT the text itself establishes it on p2 — earned, unlike run 1's
   coin spot; the pictures agree with the words. Watch item, not a
   defect.
3. **The multi-action-page class recurred** (gate follow-up minor: p6
   carries two actions) — third sighting tonight. This is now the top
   open item.
4. **L4's 6-page shape is the cost sweet spot**: scenes $1.41 total,
   review $0.13, all-in $2.40. An 8-page L5/L6 book on this exact
   pipeline would still land ~$3.30–4.00; the $2.50 target is
   realistic for L1–L4, aspirational above it without pulling the
   review-price or repaint levers.

**Loop complete (4 books, 3 review cycles, all fixes committed).**
Books on both Desktops: The Foil Card ($3.78), A Turn for Baba
($4.57, purse-repaired), Sana and the Green Seeds ($2.40).

### Post-delivery: Lynden's read of the Sana book found what the vision

QA rubber-stamped — and answered "why so many repaints?"

Lynden spotted seed counts changing and a three-armed Mum. Pixel check
confirmed worse: 2 seeds on p1, 4 on p3, 6+ on p5 (only p4 was right),
plus the extra arm on p6. Repaired for $0.83 (pages 1/3/5/6, book now
$3.23), verified by zoomed count before redelivery.

Why QA missed it: the page judge compares each image to its own
SENTENCE, and the sentence never says "three" — only the object
register does; its severity guidance even demoted counts to "minor".
FIXED: mandatory `count_check` field (count any register object with a
declared number <=6; mismatch = blocking) and the defect sweep must
now STATE each figure's limb counts (extra arms hide in overlapping
figures during hand-overs).

Why the repaints keep happening at all (Lynden: "use our other
stories — you're inventing the wheel"): the stories ARE varied from
the 33 (Sana <- The Yak and the Box), but the STAGING threw away the
sources' implicit engineering. The proven book keeps its counted set
zipped in a box — the count lives in the WORDS ("Six figs in the box.
I zip it up"), never asking the illustrator to draw N of anything.
The variation exposed loose seeds on four pages, hitting the
documented can't-count-N weakness four times. FIXED: director rule 9v
— a counted set stays inside its closed container on every page
except at most ONE close-up page where seeing them is the story's
point. Stage counts the way the proven books do.

Also found: a `ready` book's job state (castSheets, anchors,
sceneUrls) is dropped at completion, so /repair on a delivered book
errors with "no job state". The art survives on disk under fixed
names and the job can be rebuilt from the row (story.directed +
page imageUrls + cast_*.jpg/hero.jpg + anchors from first-page-per-
location) — done by hand this time; a repairBook that self-rebuilds
is the permanent fix, not yet written.
