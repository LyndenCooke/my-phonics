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
- Make the hero's declared gender unmistakable at first glance in the hero sheet and every scene. In this soft round-faced style an unstressed gender renders ambiguous and boys drift girlish ("Yusuf looks like a girl", two books, 2026-08-12): a boy gets short boyish hair unless another style is given, boyish clothing, no long eyelashes, no bow, no dress or skirt.
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

The practice word list (`read_words`) is exactly 6 words drawn from words that actually appear in the story, at least 3 of which contain the focus sound (the same 3+ words above satisfy this) — never a list where only one word carries the sound being taught.

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
