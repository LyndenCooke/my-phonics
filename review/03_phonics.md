# Pass 3 — Phonics / SSP (RWI-literate) Review

## Scope and method

I reviewed the stated curriculum ladders, tricky-word lists and three story files (L1, L3, L5) with programmatic checks where possible. Where I could not confirm against an official DfE source directly from the repo, I mark findings as **suspect** vs **verified**.

---

## Curriculum integrity

### 1) Progression quality (Letters & Sounds alignment)

**Verified strength:** progression is broadly SSP-shaped and cumulative.
- L1 single-letter + core digraph foundation.
- L2 long vowel phase.
- L3 split digraphs + alternatives + clusters.
- L4/L5 broader alternatives and fluency.
- L6 suffix patterns.
Sources: `myphonics_books/data/graphemes_by_level.json:2-103`, `myphonics_books/docs/curriculum_ladder.md:5-61`.

**Verified issue (P1): internal consistency conflicts between curriculum docs.**
- Checklist and ladder disagree on completion/status/titles in places (e.g. L2.5 title; L3.2 title; completion counts). This weakens pedagogical governance and could undermine trust with literacy professionals. `myphonics_books/PRODUCTION_CHECKLIST.md:91-97,106-116`, `myphonics_books/docs/curriculum_ladder.md:22-35`.

**Suspect issue (P2): RWI mapping labels may overstate equivalence.**
- The product correctly states “not RWI,” but JSON uses “maps_to” RWI stages. This is probably fine internally, but public copy should avoid implying program interchangeability. `myphonics_books/CLAUDE.md:102`, `myphonics_books/data/graphemes_by_level.json:4,21,38,58,74,90`.

### 2) Spot-check 3 stories at different levels (every-word rule)

Stories checked:
- L1: `tap_story_l1_1_book1.py`
- L3: `bike_race_story_l3_1_book1.py`
- L5: `before_the_shore_story_l5_1_book1.py`

I used `myphonics_books.core.validate_word_bank.validate_story_pages` to parse `story_pages[].text` and evaluate allowed words.

**Verified results:** all 3 failed the strict validator.
- L1 fail words included `naps`, `happy`.
- L3 had many failures (e.g. `Bikes`, `line`, `gate`, `race` etc.).
- L5 had many failures (e.g. `from`, `tired`, `sore`, `bench`, `shore` etc.).

This indicates one of two launch-critical problems:
1) story text is out of policy, or
2) validation lexicon/rules are stale against current writing conventions.
Either way, the quality gate is currently unreliable. Story files: `myphonics_books/data/tap_story_l1_1_book1.py:16-31`, `myphonics_books/data/bike_race_story_l3_1_book1.py:20-36`, `myphonics_books/data/before_the_shore_story_l5_1_book1.py:37-87`; validator: `myphonics_books/core/validate_word_bank.py:146-239`.

**Important:** this is a verified tooling result, not a full human re-decode of each token.

### 3) Tricky word list sampling (5 random checks)

Sampled words from `tricky_words_by_level.json`:
- `the` (L1)
- `you` (L2)
- `they` (L3)
- `could` (L5)
- `people` (L5)

These align with common Letters and Sounds phase lists from reference teaching sources (letters-and-sounds.com phase intros; phase 5 tricky set also aligns with common school resources). Repo list source: `myphonics_books/data/tricky_words_by_level.json:5-36`.

**Caveat (suspect):** I did not locate an official DfE-hosted canonical tricky-word list file inside the repo, so this external alignment check is “best available,” not legal-standard source verification.

---

## Pedagogy review

### Guide for Grown-Ups usefulness

**Verified strength:** simple, parent-friendly and practical (before/during/after routine, effort praise).
- Useful for non-teacher parents.
- Clear behavioural prompts.
Source: `myphonics_books/templates/book.html:1150-1178`.

**Gap (P2):** lacks explicit guidance on error correction sequence (e.g. sound-talk → blend → reread sentence) and when to stop/help; a phonics-trained parent may expect more precision.

### Assessment funnel level-placement quality

**Verified strength:** adaptive structure exists (screening + tranche logic + early stop/auto-pass/stop-fail confidence model).
Source: `src/pages/Assessment.tsx:75-260`.

**Risk (P1):** without robust psychometric validation dataset and outcome back-testing, placement confidence is algorithmic but not yet evidence-calibrated for misplacement rates.

### Font, size progression, handwriting practice

**Verified strength:** Andika used in templates and interactive reader; level-based story font size intent exists (26→14 via curriculum config).
Sources: `myphonics_books/CLAUDE.md:60-61,101`, `myphonics_books/data/graphemes_by_level.json:13,30,50,66,82,98`, `myphonics_books/templates/book.html:12,18-39`, `src/components/InteractiveBookReader.tsx:36`.

### Activity pages / nonsense words / PSC alignment

**Verified partial alignment:** nonsense-word challenge exists structurally in templates and interactive surfaces. `myphonics_books/templates/book.html:1341-1365`, `src/components/InteractiveBookReader.tsx:939`.

**Gap (P2):** I did not find explicit PSC-style pseudo-word visual conventions (alien context/cues) in this pass; format may still be pedagogically useful but not tightly exam-mirrored.

---

## Risks likely to trigger rejection by schools/tutors

### P0
1. **Decodability governance not currently trustworthy** (validator/story mismatch unresolved).

### P1
2. **Conflicting curriculum-status docs** can look like weak academic QA control.
3. **Assessment placement confidence not externally validated** beyond internal logic.

### P2
4. Some copy uses mixed terminology around “sight words/tricky words”; strict SSP practitioners may prefer consistency.

---

## Severity summary

- **P0:** validator/story compliance gap must be resolved before claiming “every word decodable or tricky.”
- **P1:** documentation consistency and assessment validation.
- **P2:** pedagogical refinements and stronger PSC fidelity signalling.
