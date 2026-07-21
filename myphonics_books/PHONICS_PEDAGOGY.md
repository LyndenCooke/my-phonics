# PHONICS PEDAGOGY — BINDING RULES

**Status: BINDING.** Every feature that touches phonics — books, games,
assessment, worksheets, word cards, interactive reader, audio — follows this
document. If code or content contradicts it, the code/content is wrong.
Rulings here were made by Lynden (QTS) on the dates noted; do not re-litigate
them, and do not "improve" them without a new explicit ruling.

---

## 1. Source of truth — who owns what

| Truth | Canonical file | Never |
|---|---|---|
| The 8-level grapheme ladder | `data/graphemes_by_level.json` | hardcode level lists/colours anywhere else |
| Tricky (red) words | `data/tricky_words_by_level.json` | resurrect de-listed words (see §4) |
| Shifty Sounds cards + decisions | `data/shifty_sounds.json` (`_decisions` block is part of the record) | present alt-spellings as "shifts" in marks |
| Word pool / practice words | `data/word_banks/*.json` + story dicts | invent words not honestly decodable |
| Human-readable export | `output/worksheet_plan/MPB_WORD_LEDGER.xlsx` (+ Drive `Curriculum/`) | **hand-edit the xlsx — it is GENERATED.** Change the JSON, re-run `py -3.12 scripts/build_word_ledger.py` |

`scripts/migrate_8level_data.py` is a RETIRED one-time migration with a stale
snapshot inside. It self-guards against re-running. Never bypass the guard —
a re-run once silently resurrected 12 de-listed tricky words.

## 2. The ladder (8 levels, Curriculum Ledger v2.1)

L1 Ditties `#E84B8A` · L2 First Sounds `#F97066` · L3 Special Friends
`#F59E0B` · L4 Longer Sounds `#22C55E` · L5 New Spellings `#3B82F6` ·
L6 Building Fluency `#6366F1` · L7 Reading Together `#8B5CF6` ·
L8 Reading Champion `#14B8A6`.

Every sheet, book, card or screen at level N uses level N's colour (never
default to L1 pink). Phase labels come from `PHASE_LABELS` in
`v2_helpers.py` (L1-2 Phase 2, L3 Phase 3-4, L4 Phase 3, L5-7 Phase 5,
L8 Phase 6) — fixed 2026-07-12 after stale 6-level labels shipped.

**Promotions into the ladder (locked 2026-07-03, applied 2026-07-12):**
`wh` → L4, `ph` → L6. **`ve` must NOT be a ladder grapheme** — tried and
reverted 2026-07-12: a bare `ve` grapheme wrongly blocks magic-e words
ending in v (wave, five). It stays a Shifty alternative-spelling card.

## 3. Decodability

A word is decodable at a book iff it segments into graphemes from the
book's **taught window** = all prior levels + current level up to the book's
furthest focus sound. An untaught known digraph may NOT be read as separate
letters ("mess" is not m-e-s-s before ss). Engine: `taught_graphemes` /
`can_decode` in `scripts/v2_helpers.py` — the ONE implementation, shared by
`audit_decodability.py` and the Future Sounds band. Never fork it.

**Known limit (the 'happy' class):** the engine is letter-based; it passes
words whose letters are taught but whose sounds are not (final-y=/ee/,
soft c/g). These are swept into the ledger's **"Trap Words (books)"** sheet
for a human ruling — word-swap, tricky-listing, or Watch Out note. The
engine must never silently bless them as clean.

**-ed ruling (Lynden 2026-07-13):** past-tense -ed words ("shouted") are
NOT decodable below L7 — the ending says /id/ /t/ /d/, none of which is
taught earlier. The engine flags them as missing unit `ed` (previewed as a
purple L7 cell in the Future Sounds band); activity words (read/nonsense/
writing lists) may NEVER carry an -ed word below L7. Honest exceptions
that must NOT be flagged: magic-e stems + d (named, liked, smiled — render
as magic-e per the marks ruling) and words whose e is consumed by a taught
grapheme (stared = st-are-d once 'are' lands, rescued = ue+d, need = ee+d).
Implementation: the ed-honesty check in `missing_units` (v2_helpers).

## 4. Tricky (red) words

Doctrine: **tricky = a word whose pronunciation nothing else explains.**
If a recurring pattern explains it (s=/z/, ve, wh=/h/…) it is Shifty, not
tricky. If the graphemes at its level read it correctly, it is GREEN — not
tricky at all.

- De-listed by ruling, never to return (release-gate tripwired):
  **fast, last, past, after, father, class, grass, pass, plant, path, bath**
  (the /ar/-a family reads fine as short-a — 2026-07-03) and **out**
  (ou is taught at L4 — 2026-07-12).
- Words that decode at a later level "graduate" there (door/floor/poor at
  oor). The ledger's Red Words sheet records each word's true status.
- Books auto-detect page-3 tricky words by scanning story text against the
  master list (new at level, review from previous level, or ahead of
  schedule). Book-specific one-offs ("bush", "with", "souq") ride in the
  story dict's `tricky_words_used`.
- **Graduation on display (2026-07-13, "Near the Door" catch):** a word is
  never SHOWN as tricky in a book whose taught window honestly decodes it
  (`has_graduated` in `audit_tricky_words.py` — can_decode + curated
  irregulars + `HONEST_PARSE_UNIT` for the door/oor family). And no word may
  ever be both a Story/read word and a tricky word in the same book — the
  release gate's check 7 enforces both. New authored tricky words that
  letter-parse must be classified into `PHONETICALLY_IRREGULAR` or de-listed;
  the gate failing on an unknown word is the classification prompt.

## 5. Shifty Sounds (locked 2026-07-03/05)

- Band = GPCs where a **taught grapheme makes a different sound** — only
  `alternative_pronunciation` cards ever earn the inline diamond mark
  (`#475569` slate). Alternative SPELLINGS (ck, tch, ve…) get normal marks
  once taught, never diamonds. The rejected "twin sounds" double-dot idea is
  dead.
- Page-2 band: charcoal `#475569`, L4+ only (`SHIFTY_MIN_LEVEL = 4`,
  reaffirmed 2026-07-12), max 2 per book, only sounds the story actually
  uses, never before a card's `allowed_from_level`.
- Open idea (not built): Shifty Sounds mini-activity in the back of books.

## 6. Future Sounds band (built 2026-07-12)

Instead of rewriting stories, untaught main-ladder graphemes a story uses
are PREVIEWED on the page-2 chart, each cell coloured to the level that
teaches it. Cap 8 per book. A word that can't be previewed (unsegmentable
loanword like "souq") must be in `tricky_words_used`. This is the standing
answer to decodability violations — story rewrites are the exception, not
the rule.

## 7. Marking grammar (sound buttons)

- Single taught grapheme → **dot**. Multi-letter grapheme → **under-line**
  (Lynden ruled straight line, not curved arc — template change pending
  where still curved; split-digraph over-arc STAYS curved).
- Magic-e → curved **over-arc** V…e with exactly ONE consonant between;
  the consonant keeps its dot. A vowel already inside a matched multi-char
  grapheme is never a magic-e vowel (purse's u belongs to ur).
- **Final units — always ONE unit, never letter dots** (ruled 2026-07-12):
  - `-le` (purple, little) — defers to able/ible.
  - `-ed` (turned = turn + ed) — /d/ /t/ /id/; guards: length ≥5, not a
    magic-e stem (liked keeps i-e).
  - `-se` (purse, house, cheese) and `-ve` (give, love): the silent e NEVER
    gets its own dot. Merge only when the preceding vowel is consumed by a
    digraph or a consonant precedes s/v — a lone vowel before s/v means
    magic-e (close, wave, five).
- Implementation: `split_into_phonemes` + `_compute_marks` in
  `v2_helpers.py`; interactive mirror: `TappableWord.tsx` `MULTI_LETTER`
  (includes le, ed, se, ve). Print and interactive must never disagree.

## 8. Alien (nonsense) words

100% decodable at the book's taught window AND not real words — including
slang and informal British words a parent would recognise (tink, yob, quid,
bunk were all shipped and caught 2026-07-12). The release gate checks every
list against all word banks + a curated blacklist in `audit_release.py`.

## 9. Four-surface sync

Story text lives in FOUR places that do not share a source: the Python
story dict (print), the interactive `.ts` data, the ElevenLabs script, and
the generated mp3s. ANY story change must update all four or log the debt.

## 10. Release gate — mandatory

```
py -3.12 -X utf8 scripts/audit_release.py
```

Runs sound-button audit, tricky-word audit, decodability/Future-Sounds
coverage, alien-word reality check, back-cover integrity (8 ledger levels,
colours, journey thumbs) and regression tripwires. **Non-zero exit = do not
publish. No exceptions.** Extend the gate whenever a new class of bug is
found manually — a bug caught by a human twice is a gate failure once.
