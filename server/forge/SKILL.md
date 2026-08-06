# Create-A-Book Forge — the system

The doctrine every custom book is built to, and the QA gates that enforce it.
Read this BEFORE changing a prompt in `claude.mjs` / `images.mjs`, and before
adding a pipeline stage. Every rule here was written because a real book
shipped the failure it prevents; the failure is named next to each rule so
nobody removes a guard without knowing what it cost.

---

## 1. Non-negotiables

| Rule | Why it exists |
|---|---|
| **Eyes are tiny solid black filled dots.** No white sclera, no catchlight, no iris. | House style. A white-sclera face reached a finished book on 2026-07-25. |
| **A taught letter making a DIFFERENT sound gets the slate diamond**, never a dot (the `u` in *nutritious* says /yoo/, not the /u/ of *up*). Alternative SPELLINGS (`ti` = /sh/ in *patient*) keep their ordinary line. | Pedagogy. The child must not be told a shifty sound is the base sound. |
| **Every word is decodable at the book's level**, or a listed tricky word, or the child's name. ≤3 above-level words are allowed and auto-previewed as Future Sounds. | The whole product promise. |
| **The focus sound appears in 1–3 words MAX** — three is a ceiling, not a target. | `tious` has 5 words in the entire bank; "at least 3" produced a story that was nothing but showcase words. |
| **No floating body parts.** A closeup keeps the character's face and shoulders in frame; never a hand entering from the edge with no body. | A closeup brief written as "her hands and the bowl" was drawn as a disembodied hand. |
| **One room per frame.** A brief may never say another room is "visible behind" — the illustrator invents furniture that breaks the anchor. | Kofi p5 grew a phantom kitchen counter. |
| **British English throughout** (colour, mum, favourite). | |

---

## 2. Build order

```
story (gpt-5.5)            world + cast + key objects + pages + cover_brief
  ↓
decodability QA (5.6-sol)  segment-before-judge; rewrite ONLY if >3 distinct violations
  ↓
shifty marking (5.6-sol)   per-word grapheme split → diamond indices → ledger-filtered
  ↓
director (gpt-5.5)         per page: camera, staging, objects+state, cast_present
  ↓
hero sheet                 the child, eye-ref injected
cast sheets                every other recurring person, ONE fixed outfit each
  ↓
scenes, page by page       reference stack below; first image at a location
                           becomes that location's anchor
  ↓
cover                      the story's own triumph moment, in the story's world
  ↓
book_v2 PDF                real template, A5, via Playwright
```

## 3. The reference stack

Every scene prompt carries images in this order. This is the spine of
consistency — text alone cannot hold a floor plan or a face.

1. **Hero sheet** — the child. Always.
2. **Cast sheets** — only the people the director says are in this frame.
3. **Location anchor** — the first image made at this location, with
   camera-specific wording:
   - `same-view` → reproduce the exact frame, only the action changes
   - `closeup` → fill the frame; any visible background is the same materials
   - `new-angle` / first visit → same place, different viewpoint, invent nothing

**The anchor is injected on EVERY revisit, not just identical-frame beats.**
Gating it on `same-view` meant books whose director preferred closeups — i.e.
most of them — got no visual continuity at all and re-invented the room page
by page. That was the single worst bug in this pipeline's history.

**A cast member's best reference is how they were drawn in their first
scene**, not a sheet made from text: drawn in isolation, an adult renders
childlike, and a mum comes out looking like an older sister.

## 4. What each stage must declare

- **Story** — `setting` (place + 3-5 *drawable* architecture features, season,
  weather), `cast` (≤3 non-hero people, each with ONE outfit for the whole
  book), `key_objects` (≤3, appearance ONLY — never where it sits: a "look"
  that says "simmering on the stove" gets a stove drawn on the floor),
  `cover_brief`, and a `location` id per page (1–3 locations, reused).
- **Beats** — idea → setting out → **THE DOING ITSELF** → something goes wrong
  → putting it right → the result, shared. Beat 3 is the one that gets skipped
  and it is the heart of the book. A reader must never have to imagine an
  event that happened between two pages.
- **Director** — per page: `camera`, `staging`, `emotion`, `objects`
  (only what is visible, each with its state ON THIS PAGE), `cast_present`.
  Anything the child MAKES is absent until the page it is finished.

---

## 5. QA gates

### Running now

| Gate | Model | Asks |
|---|---|---|
| Eye rule | 5.4-mini | Describe what is inside each eye outline, THEN judge. Run on the whole page and again on each zoomed face crop. |
| Decodability | **5.6-sol** | Segment each word into taught graphemes; a violation is only a position where nothing matches. |
| Shifty marking | **5.6-sol** | Split into graphemes; list only letters making a different sound than taught. Ledger-filtered. |

**Two rules learned the hard way about vision QA:**
1. **Describe before judging.** A bare pass/fail rubber-stamps everything — the
   eye QA once wrote *"solid black dots, no white sclera"* about a face with
   obvious white sclera, and passed 11/11 images on a book that failed.
2. **Zoom.** At page scale a pair of eyes is a few dozen pixels. Find the
   faces, crop, upscale, then ask.

Both apply to any rubric-based image QA, not just eyes.

### The gap — consistency QA (specified, NOT built)

No gate checks that the pictures agree with each other or with the words.
These are the questions it should ask, each against the page image plus its
references, and each **describe-before-judging**:

**Per scene, vs the location anchor**
1. List every fixed feature you can see (window shape and pane count, floor
   material and pattern, wall finish, units, fittings, what is through the
   window). Now list the same for the anchor image. Which differ?
2. Is there any furniture, appliance or structure in this image that is not in
   the anchor? Name it.
3. Is any object duplicated that appears once in the anchor?

**Per scene, vs the hero and cast sheets**
4. For each person: describe their clothing, its colours, their hair, and their
   apparent age. Does each match their reference exactly? Name every
   difference.
5. Does anyone appear as a hand, arm or body part with no body attached?
6. Is every adult drawn with adult proportions, and every child with child
   proportions?

**Per scene, vs the page text and the object states**
7. Read the sentence. List every physical thing it names. Is each one visible?
8. List every key object visible. For each, is it in the state the director
   declared for THIS page — or is something shown finished, full, clean or
   present that should not exist yet?
9. Does the picture show the action of this sentence, or a moment before or
   after it?

**Object progression across the book — the story's own subject**
Many of these books are about something CHANGING: a cake being baked, a plant
growing, a picture being painted. The object's journey IS the story, and the
commonest failure is showing its end state early — or, worse, showing the end
state *and* the early state in the same frame.
10. Name the story's main changing object. For each page in order, describe
    the state it is in.
11. Does that sequence only ever move forward — seed, shoot, bud, flower — with
    no page showing a later state than the words describe?
12. Is the finished state visible ANYWHERE before the page on which it is
    completed, including in the background, on a shelf, in someone's hands, or
    as a second copy of the same object?
13. Does the same object appear TWICE in one frame in two different states?
14. Once completed, does it keep exactly the same appearance to the end of the
    book (same decoration, same colour, same size)?
15. Does the cover show the object in its finished state only — never mid-story?

**Text, against the level spec** (`data/reading_progression.json`)
16. Quote the first word of every sentence. Is each one capitalised? Is the
    child's name capitalised everywhere, and the pronoun I?
17. Does every sentence end with a full stop, question mark or exclamation
    mark?
18. List every word in the book. For each, state whether it is (a) decodable
    from the taught graphemes at this level, (b) on this level's tricky-word
    list, or (c) neither. Only (c) is a violation.
19. Which tricky words are used, and are they all at or below this level? Is
    any word being treated as tricky that this level expects to be decoded?
20. Count sentences per page and words per sentence. Do they sit in this
    level's range, or does the book read below its level?
21. Which punctuation is used? Is any of it from above this level (a comma at
    Level 3, an apostrophe before they are taught)?
22. Which sentence forms appear — statement, question, exclamation, command?
    Does the book use the forms this level expects?
23. Does the book demonstrate this level's new devices? (L4 joining with
    'and'; L6 subordination and expanded noun phrases; **L7 time adverbials
    and complex sentences**; L8 fronted adverbials with commas, varied
    openings.) Quote the sentence that shows each.
24. Is the tense consistent across the whole book?
25. How many sentences begin with the hero's name or "The"? More than half is
    a fail at L6+.
26. Is the focus sound used in ONE to THREE words — not crammed into every
    page?

**Physical plausibility — could this be built?**
27. Describe every piece of furniture in the frame. Does each have the right
    number of legs, all reaching the floor, with the seat and back properly
    joined? Does it have the same parts it had on earlier pages?
28. Is every seated character sitting ON something that is fully drawn
    underneath them and could take their weight — not on thin air, and not
    beside their own chair?
29. Is anything hovering — an object not resting on a surface, hanging from a
    fixing, or held in a hand?

**Story logic**
30. Whatever goes wrong: was its cause shown or named BEFORE it happened? A
    chair that "cracked on the wet step" when no wet step was ever established
    is a cheat — a child should be able to say why it went wrong.
31. Does anyone who ARRIVES partway through appear earlier, in the words or the
    pictures, undercutting their arrival?
32. Below Level 6, does any character speak? Speech marks are not taught yet,
    so unattributed dialogue ("Will you fix it?") must not appear.

**Across the finished book (one pass, all pages)**
33. Does any character change clothing, hair or apparent age between pages?
28. Is there a beat the words describe that no picture shows?
29. Would a child who cannot yet read the words be able to follow the whole
    story from the pictures alone?

Questions 16, 17, 20, 21 and 25 are answered DETERMINISTICALLY in
`prose.mjs` — a regex is more reliable than a model for capitals, terminal
punctuation, counts and sentence openers, and `fixMechanics` repairs
capitalisation automatically rather than reporting it. Do not spend a model
call on something a regex can prove.

A failure returns the page number, the specific difference, and a repair
instruction narrow enough for an edit pass — never "regenerate the page".

---

## 6. Cost expectations (OpenAI, July 2026)

| Item | Cost |
|---|---|
| Story + rewrite + director (gpt-5.5) | ~$0.45 |
| Phonics + shifty (5.6-sol) | ~$0.13 |
| Image, gpt-image-2 medium (in $8/M, out $30/M image tokens) | ~$0.076 |
| Cast sheet, each | ~$0.07 |
| **8-page book, hero + cover + landmark + 1 cast member** | **~$1.30–1.45** |

Vertex Gemini is the fallback and costs ~$0.039/image, but needs a live
`gcloud` session — it has expired mid-run and killed a job. OpenAI needs no
gcloud, which is why it is the default.

---

## 7. Known gaps

- **The word bank is the binding constraint.** 1,751 green words total; Level 8
  adds only 69; `tious` has 5 and `cious` has 0. The ledger's own coverage
  sheet marks 8 sounds Thin and 13 OK. Little Wandle and RWI run far larger
  banks — this is what makes the stories feel thin, not the model.
- **No reading-progression spec.** Nothing sets sentences per page, words per
  sentence, or required sentence types by level, so a Level 8 book can come
  back as thin as a Level 3 one.
- **Consistency QA is unbuilt** (§5).
- **Cast references are synthetic sheets**, not first-appearance crops (§3).
