# L6 Edition B workbook — content selections (AWAITING LYNDEN'S APPROVAL)

Every selected word, sentence and list in the pilot, with its source pointer.
Selection only — nothing here is invented. Data lives in
`worksheet-engine/src/data/pool/l6.ts`; this file mirrors it for sign-off.

Source keys:

- **Book L6.n pX** — story page X of the shipped book (verbatim sentence).
  Story sources via `NEW_TO_OLD` (new 6.1-6.4 = old 4.1-4.4):
  `purple_purse_story_l4_1_book1.py`, `brown_owl_story_l4_2_book1.py`,
  `new_glue_story_l4_3_book1.py`, `how_now_story_l4_4_book1.py`.
- **writing_words / story_words / read_words** — the approved word lists
  inside those story files.
- **Word bank (old L6)** — `data/word_banks/level_6_words.json`, the bank
  that carries the ur/er/are/ew/ue alternative spellings. NOTE: the book-id
  remap (new 6.x = old 4.x) does NOT hold for the word banks — the old L4
  bank (RWI Yellow, clusters + ea) contains almost none of the L6 GPC words
  (only "burst"). The banks indexed by GPC coverage put the L6 alternatives
  in the old L6 bank and `ow` in the old L3 bank. Flagged for confirmation.
- **Tricky Ln** — `data/tricky_words_by_level.json` (cumulative).
- **Approved phrase set** — the G-L6.2 noun-phrase answers, verbatim
  (`docs/grammar_L6_contents.md`): "the big brown owl", "the new blue glue",
  "the soft purple purse", "the bare brown branch", "the soft fluffy owlets".

## Look Cover Write Check (T8)

| Page | Example | Rows | Source |
|---|---|---|---|
| B1.SP1 | nurse | purple, purse, church, fern, never | Book L6.1 writing_words ∩ word bank (old L6) |
| B1.SP2 | said (L5 revision) | their, oh (new) + were, there, when (L5 revision) | Tricky L5/L6 |
| B2.SP1 | stare | care, dare, owl, brown, down | Book L6.2 writing_words (the full approved list of 6) |
| B2.SP2 | come (L5 revision) | people, Mr, Mrs (new) + their, oh (revision) | Tricky L5/L6 |
| B3.SP1 | new | glue, blue, drew, true, flew | Book L6.3 writing_words (the full approved list of 6) |
| B3.SP2 | people (revision) | looked, called, asked (new) + Mr, Mrs (revision) | Tricky L6 |
| B4.SP1 | brown | could (new) + furry, now, stare, blue | Tricky L6 + Book L6.4 writing_words |

## Listen and write — dictation sentences (T9; printed ONLY in Answers + here)

| Page | Sentences (verbatim) | Source |
|---|---|---|
| B1.DI1 | 1. Dad came with me to search. 2. We walked up and down the street. 3. I held the purse close to my chest. | Book L6.1 p2, p2, p8 |
| B2.DI1 | 1. The air was cool on my bare cheeks. 2. I stared back but I did not dare to get close. 3. We went home under the stars. | Book L6.2 p2, p4, p8 |
| B3.DI1 | 1. She drew a bird on a card. 2. The cat grew cross and ran. 3. At last, the card was finished. | Book L6.3 p1, p3, p8 |
| B4.DI1 | 1. It sat on a wall and turned to stare. 2. The blue lake was still and cool. 3. The boy sat down with Mum by the water. | Book L6.4 p3, p2, p8 |

## Hold the sentence (T4, printed on the page)

| Page | Sentences (verbatim) | Source |
|---|---|---|
| B1.SW1 | 1. I turned my pockets inside out, but it was not there. 2. Then a market lady held up a purple purse! 3. Dad and I walked home in the warm afternoon. | Book L6.1 p1, p6, p8 |
| B2.SW1 | 1. Then the owl spread its wings and swooped down from the branch. 2. We set off down the dark path together. 3. The brown owl and her owlets were safe in the dark. | Book L6.2 p5, p2, p8 |
| B3.SW1 | 1. The girl had a pot of new blue glue. 2. The cup fell and tea ran down on to the new rug. 3. The cat just sat and chewed its fur clean. | Book L6.3 p1, p4, p7 |
| B4.SW1 | 1. But the monkey just grinned and ran on. 2. The monkey sat by the water with his snack. 3. Her dark gown flowed in the warm air. | Book L6.4 p4, p6, p7 |

No sentence is reused between a book's SW1 and DI1 pages.

## Handwriting sets (T1; models render only after the joined font is approved)

| Page | Sets | Source |
|---|---|---|
| B1.HW1 First joins | ur ur ur · er er er · turn turn · her her | L6 GPCs (ledger) · word bank (old L6) · Tricky L4 |
| B1.HW2 Joined words | purse purple · fern never · their oh · the soft purple purse | Book L6.1 writing_words · Tricky L6 · approved phrase set |
| B2.HW1 First joins | ow ow ow · down town · brown brown · owl howl | L6 GPCs · Book L6.2 writing_words/story_words · word bank (old L3: town) |
| B2.HW2 Joined words | care dare stare · brown down · people people · the big brown owl | Book L6.2 writing_words · Tricky L6 · approved phrase set |
| B3.HW1 Joins | ew ew ew · ue ue ue · new flew · glue blue | L6 GPCs · Book L6.3 writing_words |
| B3.HW2 Joined words | drew threw · true blue · looked called · the new blue glue | Book L6.3 story_words/writing_words · Tricky L6 · approved phrase set |
| B4.HW1 Joined phrases | the soft purple purse · the big brown owl · the new blue glue · the soft fluffy owlets | Approved phrase set (G-L6.2 answers), verbatim |
| B4.HW2 Joined words | oh their could · looked called · asked people · Mr Mrs | Tricky L6 (review of the level's nine) |

## Show what you know — reused items (T6, by pointer)

| Page | Item | Pointer | Answer |
|---|---|---|---|
| SWYK-A | Tick the kind | G-L6.1 row 1 ("The owl sat on a bare branch.") | Statement |
| SWYK-A | Tick the kind | G-L6.1 row 3 ("Look up at the tree!") | Command |
| SWYK-A | Match the short form | G-L6.6 pairs 1, 4 (I am, we are) | I'm, we're |
| SWYK-A | Grow the noun phrase | G-L6.2 row 3 ("the branch") + the unit's word bank | the bare brown branch |
| SWYK-A | Choose the joining word | G-L6.3 row 2, G-L6.4 row 1 + both banks | and, if |
| SWYK-B | Rewrite in the past | G-L6.7 rows 3, 4 | gave, slipped |

B4's "Fix and answer" page reuses the approved review unit (g-l6-review)
verbatim, retitled per the teacher sequence.

## NOT selected (authoring dependencies — see L6_DEPENDENCIES.md)

SW2 comprehension questions · big-write weak/strong pairs · all spelling
test word lists (ST1 ×4 and ST-HT).
