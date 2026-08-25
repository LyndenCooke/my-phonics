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

**tch ruling (Lynden 2026-08-26):** `tch` = /ch/ after a short vowel is a
SHIFTY spelling available from **Level 5**. It was already in
`shifty_sounds.json` (new_spelling_cards, allowed_from_level 5) but had never
been added to `graphemes_by_level.json`, so catch/match/hatch/kitchen were
impossible at EVERY level while the writer kept reaching for them naturally.
Now in the Level 5 grapheme list and the L5-L8 cumulative lists. Below L5 a
tch word is a previewable Future Sound, not a flat impossibility. `kn`, `wr`,
`mb`, `gn` and `dge` are still in no level's list — the same question stands
for them.

**Accent policy (Lynden 2026-08-25):** the scheme reads the BATH-vowel as
short /a/ — "I say bath the way it is decoded, not like a posh Londoner."
So ask, bath, grass, branch, path are honestly decodable with short a and
must never be flagged. This is NOT inconsistent with the all-family ban
(call, small, wall): a-before-ll says /or/ in every British accent, so the
want-family treatment stands there (ruled 2026-08-24).

**-ed ruling (Lynden 2026-07-13):** past-tense -ed words ("shouted") are
NOT decodable below L7 — the ending says /id/ /t/ /d/, none of which is
taught earlier. The engine flags them as missing unit `ed` (previewed as a
purple L7 cell in the Future Sounds band); activity words (read/nonsense/
writing lists) may NEVER carry an -ed word below L7. Honest exceptions
that must NOT be flagged: magic-e stems + d (named, liked, smiled — render
as magic-e per the marks ruling) and words whose e is consumed by a taught
grapheme (stared = st-are-d once 'are' lands, rescued = ue+d, need = ee+d).
Implementation: the ed-honesty check in `missing_units` (v2_helpers).

**-ed guide (Lynden 2026-07-25):** the Future Sounds band can only carry ONE
`ed` cell with ONE example, but below L7 the child can read NONE of a story's
-ed words. Page 3 therefore carries a fixed **three-row guide** under the
Tricky Words strip — the three ways -ed is said, each with its reason:

| | | |
|---|---|---|
| `started → start-id` | /id/ | an 'id' beat, after a t or d |
| `turned → turn'd` | /d/ | a soft 'd', after a vowel or a soft sound |
| `walked → walk't` | /t/ | a quick 't', after a sharp sound like p, k or ch |

Apostrophe = no extra beat, hyphen = an extra beat — the same distinction
§7's marks make. **Do NOT list every -ed word in the book** (built that way
first and rejected: "dont put every word but give the 3 example of the
different ways it can be said and why"). Learn the three rules and every -ed
word opens up. Each row's example is drawn from THIS book where it uses one,
else a stock word (wanted / played / jumped).

Built by `build_ed_guide` (v2_helpers) and gated by `missing_units`, so it
can never disagree with the band: the honest exceptions above (stared,
smiled) are decodable and never used as examples, and tricky words (looked,
asked, called) are told from the strip instead. Per-book hand-authored "How
-ed sounds at the end" notes are retired — the guide supersedes them.

**Band prints in bands 4+5 only (Lynden 2026-08-23, specialist-reviewed):**
the guide teaches a RULE, and re-teaching it in seven books read as filler.
It now prints in **4.5** (the first book that meets -ed words) and **5.2**,
via `show_ed_guide: False` in 5.4, 5.5, 6.1, 6.2 and 6.4's story dicts. The
page-2 Future Sounds `ed` cell still appears everywhere the story earns it,
and a genuinely awkward -ed word in a band-less book rides as a word-level
note in the existing caption format, never as a re-teach. (The specialist
recommended once per level band incl. L6/L8; Lynden ruled bands 4+5 only —
the L8 ledger teaching moment is the workbook strand's job, not the
storybooks'.)

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
- **No ahead-of-schedule flagging from L7 (2026-07-26, Lynden on 7.2: "a lot
  of the tricky words have be done so many times... they should already know
  them").** Below L7 a word listed at a LATER level is still flagged — it
  genuinely isn't decodable yet. From L7 only words introduced at THAT level
  are pre-taught: a fluent Year-2 reader meets "again"/"water" constantly, and
  flagging them as new on a Level 7 page is noise. Implemented as `_ahead_ok`
  in generate_book.py.
- **Book-specific tricky words must not repeat across books (2026-07-26).** A
  word in a story dict's `tricky_words_used` with no level on the master list
  can never graduate, so it is re-flagged in every book that lists it (`want`
  fired in 5.4, 6.2 AND 7.3; `where` in 6.4, 7.2 AND 7.4). Fix in this order:
  1. If the repeats span DIFFERENT levels, give the word a home level on the
     master list = the level of the first book that introduces it (`want`→L5,
     `where`→L6, `through`→L7). The graduation rule then hides it everywhere
     later, for free.
  2. If they repeat WITHIN one level (`eyes`/`heart` across two L7 books), no
     home level can separate them — delete the word from the LATER book's
     `tricky_words_used` instead.
  Check the blast radius before homing: a master-listed word is auto-detected
  from story TEXT in every book, so a common word can appear where it never
  did before (`over`→L7 leaked into 6.1 and 7.2 and was backed out).
- **Taxonomy + purpose (Lynden 2026-08-23, specialist-reviewed R1):** once
  Shifty Sounds are in play, tricky words continue ONLY as (a) truly
  inexplicable words (one, once, eye, said), (b) high-frequency words needed
  BEFORE their shifty pattern's `allowed_from_level`, and (c) unsegmentable
  loanwords. Category (b) carries a **sunset**: from the pattern's allowed
  level the word's true status is Shifty, recorded in
  `SHIFTY_EXPLAINED_FROM` (audit_tricky_words.py) — never re-list such a
  word as tricky at/above its sunset level. The L5+ strip's purpose is
  **automatic recognition taught through the tricky part** — not "sight
  vocabulary" (look-and-say language; the child still decodes the regular
  parts and is told the one irregular grapheme).
- **Flag once, then omit (Lynden 2026-08-23):** at L5+ a tricky word prints
  in the strip ONLY in the first book (journey order) that displays it;
  every later book omits it entirely, and every chip that prints is a plain
  white card. The specialist review recommended keeping later chips as
  quiet "practice" chips (books are read out of sequence — cold-open
  support); that variant shipped for a few hours, Lynden saw the grey chips
  rendered and ruled them out ("looks broken"), accepting the cold-open
  trade-off. First-display map: `data/tricky_word_intro.json`, built by
  `scripts/build_tricky_intro.py` — **regenerate after any story-text or
  tricky-list change** or the one flagging sits in the wrong book (the map
  is stable under the filter: an intro book always still shows its word).
  L7-L8 keep full suppression (2026-07-26 ruling above). The pre-L4 half of
  the proposal ("explanation once") stays REJECTED: below L5 chips AND
  word→say rows repeat wherever the word appears — the row is the home
  edition's substitute for a teacher's mouth, and red-word learning is
  repetition-to-automaticity.
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
  - `-ed` (turned = turn + ed) — ONE unit ONLY for the /d/ (turned) and /t/
    (jumped) pronunciations; guards: length ≥5, not a magic-e stem (liked
    keeps i-e).  **EXCEPTION (Lynden 2026-07-22): when the letter before -ed
    is `t` or `d`, the ending says /id/ = TWO phonemes** (pointed = p-oi-n-t-i-d,
    wanted, landed, needed) — mark it as an e-dot + d-dot, NOT one under-arc.
    The page-2 Future Sounds caption for these reads "ed — sounds like 'id'
    in <word>".
  - `-se` (purse, house, cheese) and `-ve` (give, love): the silent e NEVER
    gets its own dot. Merge only when the preceding vowel is consumed by a
    digraph or a consonant precedes s/v — a lone vowel before s/v means
    magic-e (close, wave, five).
- **Shifty diamond in books (2026-07-26, Lynden on 6.4's "furry"):** a taught
  letter making one of its OTHER sounds gets the slate `#475569` DIAMOND, not a
  dot — "the y in cheeky is the /ee/ sound... it is a shifty sound and not a
  original sound". Live for word-final y: /ee/ (furry, happy) and /igh/ (my,
  fly). Never fires when the y belongs to a taught digraph — day/way/toy/joy
  keep their `ay`/`oy` under-line. This brings books in line with the word
  cards, which have diamond-marked alt pronunciations since the deck was built.
  `y` = /ee/ and /igh/ were restored to `shifty_sounds.json` for it (they were
  pulled 2026-07-03 pending "per-book Watch Out notes" — the diamond IS that
  explanation). Only `alternative_pronunciation` cards may ever earn it (§5).
- **A shifty unit may be MORE THAN ONE LETTER (Lynden 2026-08-06, on 8.4's
  "gorgeous"):** "/ge/ is the shifty sound, it sounds like /j/, not just the g
  on its own." So gorgeous reads g - or - **ge** - ous, the diamond is centred
  BETWEEN the two letters, there is no under-line on the pair, and the e gets no
  dot of its own. Note this is a deliberate exception to the "alternative
  SPELLINGS keep their ordinary mark" line in §5 — ruled twice, so do not
  "correct" it back. Implemented per-book via `extra_button_units` in the story
  dict (8.4 declares `["ge"]`), NOT by adding ge to the grapheme ladder: the
  ladder would re-segment large, change and village across all 33 books and add
  a cell to every L8 sound chart. The diamond's x is the centre of the whole
  unit in `book_v2.html`, so single-letter diamonds are unaffected.
- Implementation: `split_into_phonemes` + `_compute_marks` in
  `v2_helpers.py`; interactive mirror: `TappableWord.tsx` `MULTI_LETTER`
  (includes le, ed, se, ve). Print and interactive must never disagree.
  **The diamond is print-only so far — the interactive reader still dots a
  final y. That is live 4-surface drift (§9), not a settled state.**

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
