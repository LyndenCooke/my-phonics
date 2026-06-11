# Worksheet asset audit, L6 grammar booklet

Date: 2026-06-10. Compiled from the repo only. Companion to `book_world_L6.md` (the L6 book world bible). No worksheet layout code was changed for this audit.

Sources: manifest `worksheet-engine/src/data/grammarAssets.ts`, unit data `worksheet-engine/src/data/grammar/l6.ts`, files on disk in `worksheet-engine/public/clipart/`, prior inspection `worksheet-engine/docs/levels_plan_summary.md` section 3.

Manifest semantics (from the `grammarAssets.ts` header): status ok means approved art in the chosen style is in place, redraw means a file exists but breaks the style, missing means no art yet. The renderer draws a key only when its manifest status is ok AND its file exists; a redraw or missing slot stays empty and `npm run validate` reports it.

The required style for every asset (manifest header): one line-art treatment, trimmed white or transparent background, small solid pure-black dot eyes. The cited source document `grammar_aesthetic_direction.md` does not exist in the repo; the bible (`book_world_L6.md` section 1) now records the book world this art must come from.

---

## 1. Every asset key the L6 grammar units reference

Only `l6.ts` references illustration assets at all; `l1.ts` to `l5.ts`, `l7.ts` and `l8.ts` contain no illustration fields (checked by search, zero matches outside l6.ts). Key references in `l6.ts` by unit:

| Unit | Name | Keys referenced (role) | Line |
|---|---|---|---|
| G-L6.1 | Four kinds of sentence | owl (anchoredCharacter); leaf, branch (watchArt) | 39, 40 |
| G-L6.2 | Make the noun phrase grow | glue, purse, branch, owlets (rowArt and row icons); owl (watchArt) | 76, 78, 88 to 91 |
| G-L6.3 | Joining with and, but, or, so | cup, rug, glue (anchoredScene) | 113, 116 to 118 |
| G-L6.4 | Joining with when, if, that, because | owl, owlets, branch, moon (footScene); purse (watchArt) | 154, 157 to 160, 164 |
| G-L6.5 | Adjectives and adverbs | cat (anchoredCharacter) | 192 |
| G-L6.6 | Apostrophes for contractions | owl (anchoredCharacter) | 225 |
| G-L6.7 | Keep the tense the same | cat (anchoredCharacter) | 256 |
| G-L6.R | Show what you know | monkey, purse, glue (scene) | 292, 295 to 297 |

Distinct keys referenced: owl, owlets, branch, leaf, moon, purse, glue, cup, rug, cat, monkey (11 keys).

## 2. Manifest entries against files on disk

State of `worksheet-engine/public/clipart/` checked 2026-06-10. The `_raw/` subfolder holds untrimmed or rejected originals and is not read by the renderer.

| Key | Manifest status | Manifest file | File on disk | Referenced by L6 units | Verdict |
|---|---|---|---|---|---|
| owl | missing | none | no `owl.png` (rejected white-eye original survives at `_raw/owl.png`) | G-L6.1, G-L6.2 (watch), G-L6.4, G-L6.6 | no file; slot prints empty on four pages |
| owlets | missing | none | none | G-L6.2, G-L6.4 | no file; slot prints empty |
| cat | missing | none | no `cat.png` (rejected coloured one-off survives at `_raw/cat.png`) | G-L6.5, G-L6.7 | no file; slot prints empty |
| monkey | ok | monkey.png | present | G-L6.R | ok; manifest note says confirm against The Cheeky Monkey book art |
| bird | missing | none | none | not referenced by any unit | gap only if a unit adopts it (the card in The New Glue carries a blue bird drawing) |
| branch | ok | branch.png | present | G-L6.1 (watch), G-L6.2, G-L6.4 | ok |
| tree | ok | tree.png | present | not referenced by any L6 unit | unused at L6 |
| leaf | ok | leaf.png | present | G-L6.1 (watch) | ok |
| moon | ok | moon.png | present | G-L6.4 | ok |
| purse | ok | purse.png | present | G-L6.2, G-L6.4 (watch), G-L6.R | ok |
| glue | ok | glue.png | present | G-L6.2, G-L6.3, G-L6.R | ok |
| cup | missing | none | none | G-L6.3 | no file; the G-L6.3 foot scene prints without two of its three objects |
| rug | missing | none | none | G-L6.3 | no file; as above |
| card | missing | none | none | not referenced by any unit | gap only if adopted |

Summary: of the 11 keys the units reference, 6 have approved files (monkey, branch, leaf, moon, purse, glue) and 5 have no file at all (owl, owlets, cat, cup, rug). The two unreferenced missing keys are bird and card. tree is approved but unused at L6.

## 3. Off-style files

No currently active file breaks the line-art dot-eye rule. The two breaches recorded in `levels_plan_summary.md` section 3 (owl.png with white-shine eyes, cat.png full colour) have since been removed from the active folder; their manifest entries are now missing rather than redraw, and the rejected originals survive only in `_raw/`. That summary table is therefore stale on those two rows.

Adjacent but out of scope: the full-colour word clipart (tap, pin, hat and the rest) and tap-mascot.png belong to the sound-sheet strand and are coloured by design; they must not be reused on grammar pages (`levels_plan_summary.md` section 3).

## 4. What the bible now makes commissionable

The five empty slots map directly to book world entities whose verbatim look is recorded in `book_world_L6.md`:

| Key | Source in the book world |
|---|---|
| owl | The Brown Owl, OWL_DESC (tawny owl, cream-brown chest, round facial disc, dot eyes) |
| owlets | The Brown Owl, OWLETS_DESC (two fluffy owlets, pale brown down, dot eyes) |
| cat | The New Glue, ginger tabby with orange stripes, white chest, white paws, white-tipped tail, dot eyes |
| cup | The New Glue page 4, a blue ceramic cup |
| rug | The New Glue page 4, a bright woven striped rug |

---

## 5. Story PDFs per level, L1 to L8

Checked directly on disk 2026-06-10 under `myphonics_books/output/books/Level{n}/`. Every reading PDF has a matching Printable Booklet PDF and a debug HTML render file. Titles agree with the Curriculum Ledger v2.1 table in `levels_plan_summary.md` section 1.

| Level | Books on disk | Titles |
|---|---|---|
| L1 | 2 | 1_1 Tap Tap Tap, 1_2 The Mud on the Dog |
| L2 | 5 | 2_1 The Red Socks, 2_2 Run Pup Run, 2_3 Fox Fell Off, 2_4 The Jam Jug, 2_5 The Yak and the Box |
| L3 | 3 | 3_1 The Fish in the Tank, 3_2 Chop Chop Chop, 3_3 Buzz and Sing |
| L4 | 6 | 4_1 The Night Light, 4_2 Moo at the Zoo, 4_3 Morning on the Farm, 4_4 The Fair in the Air, 4_5 Round and Round, 4_6 The Night Fair |
| L5 | 5 | 5_1 The Big Bike Race, 5_2 Lost at the Night Market, 5_3 The Dream Team, 5_4 What Min Saw, 5_5 The Boat with the Red Sail |
| L6 | 4 | 6_1 The Purple Purse, 6_2 The Brown Owl, 6_3 The New Glue, 6_4 The Cheeky Monkey |
| L7 | 4 | 7_1 Before the Shore, 7_2 Near the Door, 7_3 Sure She Can, 7_4 A Place for Me |
| L8 | 4 | 8_1 The Marvellous Neighbourhood, 8_2 You Are Remarkable, 8_3 It Looks Suspicious, 8_4 The Incredible Bush Walk |

Total 33 books, matching the ledger. Extending the same bible-and-manifest system to another level needs the same inputs that existed for L6: the story data files in `myphonics_books/data/` (present for most books under their old 6-level IDs), the generation scripts in `myphonics_books/scripts/` and book-anchored grammar units. Note that only L6 grammar units are book-anchored today; L1 to L5, L7 and L8 units carry the placeholder "Level N readers" as anchorBook (`levels_plan_summary.md` section 4, point 7), so a bible for those levels has no worksheet consumer yet.

Caution on old-to-new ID mapping when extending: image folders under `myphonics_books/output/images/` use old 6-level IDs (for example L4_1_B1 is now book 6.1, and the scripts named `*l6_*` or `L6_1` refer to the old L6, now L8). The mapping is documented in `EIGHT_LEVEL_MIGRATION_PROMPT.md`.
