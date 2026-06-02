# 8-Level Migration Prompt — for Claude Code

Paste this into Claude Code to plan and execute the migration from 6 levels to 8 levels.

---

## Context

The MyPhonicsBooks project at `C:\Users\ASUS\myphonicsbooks\` currently runs a 6-level phonics structure. The curriculum has been redesigned to 8 levels aligned to Read Write Inc (RWI) Speed Sound Sets. The **Curriculum Ledger** is the single source of truth:

`myphonics_books/output/worksheet_plan/CURRICULUM_LEDGER.md`

The full restructure rationale is in:

`myphonics_books/output/worksheet_plan/rwi_aligned_proposal.md`

Read both files before doing anything.

## Dual-track approach

**Do NOT touch the parent-facing production site yet.** The public site stays at 6 levels until the school version is proven. Instead:

1. Create a feature branch `feature/8-levels` for all migration work
2. Add a `LEVEL_MODE` environment variable: `"parent-6"` (default, current behaviour) or `"school-8"` (new)
3. All level config exports (`LEVELS`, `LEVEL_COLORS`, `LEVEL_NAMES_SHORT`, `LEVEL_NAMES`, `SCREENING_WORDS`, `PASS_CRITERIA`, `AGE_EXPECTATIONS`, `ASSESSMENT_ITEMS`) should check `LEVEL_MODE` and return the appropriate dataset
4. The parent-6 path must return exactly the current data — zero regressions
5. Components that consume level data already use these exports, so the switch should be transparent

## What changes and where

### 1. Level definitions

**File: `src/lib/types.ts`**

Current `LEVELS` array has 6 entries. Add the 8-level version:

```
Old → New mapping:
Old L1 "Starting Stories" (10 books) → splits into:
  New L1 "Ditties"           (2 books: L1.1, L1.2)
  New L2 "First Sounds"      (5 books: old L1.4-L1.8 → new L2.1-L2.5)
  New L3 "Special Friends"   (3 books: old L1.3, L1.9, L1.10 → new L3.1-L3.3)
Old L2 "Longer Sounds"  (6 books) → New L4 "Longer Sounds"  (6 books, same content)
Old L3 "New Spellings"   (5 books) → New L5 "New Spellings"  (5 books, same content)
Old L4 "Building Fluency"(4 books) → New L6 "Building Fluency"(4 books, same content)
Old L5 "Reading Together" (4 books) → New L7 "Reading Together"(4 books, same content)
Old L6 "Reading Champion" (4 books) → New L8 "Reading Champion"(4 books, same content)
```

New 8-level LEVELS array:

| Level | Name | Age Range | Colour Name | Hex | HSL (for CSS) |
|---|---|---|---|---|---|
| 1 | Ditties | Ages 4-5 | Pink | #E84B8A | 338 78% 60% |
| 2 | First Sounds | Ages 4-5 | Coral | #F97066 | 5 93% 69% |
| 3 | Special Friends | Ages 4-5 | Amber | #F59E0B | 38 92% 50% |
| 4 | Longer Sounds | Ages 4-6 | Green | #22C55E | 142 71% 45% |
| 5 | New Spellings | Ages 5-6 | Blue | #3B82F6 | 217 91% 60% |
| 6 | Building Fluency | Ages 5-7 | Indigo | #6366F1 | 239 84% 67% |
| 7 | Reading Together | Ages 6-7 | Purple | #8B5CF6 | 258 90% 66% |
| 8 | Reading Champion | Ages 6-8 | Teal | #14B8A6 | 173 58% 39% |

Note: Old L1 Pink stays as L1 Pink. Old L2 Amber becomes L3 Amber. Old L3 Green → L4 Green. Old L4 Blue → L5 Blue. Old L5 Purple → L7 Purple. Old L6 Teal → L8 Teal. Two NEW colours: Coral #F97066 (L2) and Indigo #6366F1 (L6).

### 2. Tailwind config and CSS variables

**File: `tailwind.config.ts`** — add `level.7`, `level.8`, `level["7-ink"]`, `level["8-ink"]` tokens.

**File: `src/index.css`** — add CSS custom properties:

```css
--level-7: 258 90% 66%;    /* Purple — same as old --level-5 */
--level-8: 173 58% 39%;    /* Teal — same as old --level-6 */
--level-7-ink: 258 60% 50%;
--level-8-ink: 173 58% 28%;
```

And update the existing vars when in school-8 mode:
```css
--level-1: 338 78% 60%;    /* Pink — unchanged */
--level-2: 5 93% 69%;      /* Coral — NEW */
--level-3: 38 92% 50%;     /* Amber — was level-2 */
--level-4: 142 71% 45%;    /* Green — was level-3 */
--level-5: 217 91% 60%;    /* Blue — was level-4 */
--level-6: 239 84% 67%;    /* Indigo — NEW */
```

### 3. Assessment data

**File: `src/lib/assessmentData.ts`**

The current 346-item question bank maps to 6 levels. For 8 levels:

**LEVEL_NAMES** — update to 8 entries with correct phase mappings:
```
1: { name: 'Ditties',           colour: 'Pink',   phase: 'Phase 2 (Sets 1-2)' }
2: { name: 'First Sounds',      colour: 'Coral',  phase: 'Phase 2 (Sets 3-5)' }
3: { name: 'Special Friends',   colour: 'Amber',  phase: 'Phase 3 (consonant digraphs)' }
4: { name: 'Longer Sounds',     colour: 'Green',  phase: 'Phase 3 (vowel digraphs)' }
5: { name: 'New Spellings',     colour: 'Blue',   phase: 'Phase 5 (split digraphs)' }
6: { name: 'Building Fluency',  colour: 'Indigo', phase: 'Phase 5 (alternatives)' }
7: { name: 'Reading Together',  colour: 'Purple', phase: 'Phase 5-6 (trigraphs)' }
8: { name: 'Reading Champion',  colour: 'Teal',   phase: 'Phase 6 (morphology)' }
```

**ASSESSMENT_ITEMS** — The old L1 items (36 sounds + 12 real + 12 alien + 6 tricky + 12 speedy = 78 items) need splitting into three new levels:

Split logic based on the Curriculum Ledger GPCs:
- **New L1 (Ditties):** sounds s, a, t, p, i, n, m, d, g, o. Real/alien words using only these 10 letters. Tricky words: I, the.
- **New L2 (First Sounds):** sounds c, k, ck, e, u, r, h, b, f, ff, l, ll, ss, j, v, w, x, y, z. Real/alien words using L1+L2 GPCs. Tricky words: no, go, to, into, is.
- **New L3 (Special Friends):** sounds sh, nk, ch, th, ng, qu, zz. Real/alien words using L1+L2+L3 GPCs. Tricky words: he, she, we, me, be.

Old L2 items → New L4 (re-tag `level: 2` to `level: 4`)
Old L3 items → New L5 (re-tag `level: 3` to `level: 5`)
Old L4 items → New L6 (re-tag `level: 4` to `level: 6`)
Old L5 items → New L7 (re-tag `level: 5` to `level: 7`)
Old L6 items → New L8 (re-tag `level: 6` to `level: 8`)

New items needed for L1-L3 (the old L1 is being split, so some items already exist — just re-assign them and fill gaps):

**New L1 items to create:**
- Sounds: s, a, t, p, i, n, m, d, g, o (10 items)
- Real words: sat, pin, dog, mop, dig, nit, tap, tip, nip, pan (10 items, VC/CVC only from SATPIN+MDGO)
- Alien words: pid, gom, sot, nid, mig, tog, dap, nop, gip, sim (10 items)
- Tricky words: I, the (2 items)

**New L2 items to create:**
- Sounds: c, k, ck, e, u, r, h, b, f, ff, l, ll, ss (13 items — j, v, w, x, y, z tested via words)
- Real words: duck, bell, huff, jet, web, fox, cup, red, log, kiss (10 items)
- Alien words: veck, zuff, rell, hib, lub, fick, joss, wug, yat, beff (10 items)
- Tricky words: no, go, to, into, is (5 items)

**New L3 items to create:**
- Sounds: sh, ch, th, ng, nk, qu, zz (7 items)
- Real words: ship, chop, thin, ring, bank, quick, buzz, fish, rush, much (10 items)
- Alien words: shog, chib, thup, ning, zonk, quab, theng, shuck, chid, nunk (10 items)
- Tricky words: he, she, we, me, be (5 items)

**AGE_EXPECTATIONS** — update for 8 levels:
```
4-4.5   Reception (Autumn)          Expected: L1        Below: N/A              Above: L2
4.5-5   Reception (Spring/Summer)   Expected: L1-L3     Below: Still on L1      Above: L4
5-5.5   Year 1 (Autumn)             Expected: L3-L4     Below: L1-L2            Above: L5
5.5-6   Year 1 (Spring/Summer)      Expected: L4-L5     Below: L1-L3            Above: L6
6-7     Year 2                      Expected: L5-L7     Below: L1-L4            Above: L8
7-8     Year 3                      Expected: L7-L8     Below: L1-L6            Above: Beyond L8
```

### 4. Adaptive engine

**File: `src/lib/adaptiveEngine.ts`**

**SCREENING_WORDS** — update to 8 words (one decodable word per level that a child at that level should be able to read):
```
L1: "dog"        (CVC from SATPIN+MDGO)
L2: "bell"       (CVC with double letter, needs L2 GPCs)
L3: "fish"       (CVC with digraph sh, needs L3)
L4: "park"       (vowel digraph ar, needs L4)
L5: "cake"       (split digraph a-e, needs L5)
L6: "nurse"      (alternative spelling ur, needs L6)
L7: "station"    (trigraph tion, needs L7)
L8: "incredible" (suffix -ible, needs L8)
```

**LEVEL_COLORS** — add entries 7 and 8:
```
7: 'bg-purple-500'
8: 'bg-teal-500'
```

**LEVEL_NAMES_SHORT** — add entries 7 and 8.

**PASS_CRITERIA** — add entries for levels 7 and 8:
```
7: { sounds: 90, words: 85, alien: 75, tricky: 70, fluency: 100 }
8: { sounds: 90, words: 85, alien: 75, tricky: 70, fluency: 110 }
```

Note: alien words are retired after L6 in the worksheet lifecycle, but the assessment can still test them at L7/L8 for diagnostic purposes. Keep the alien threshold but mark it optional.

**calculateStartLevel** — update the cap from `Math.min(highest, 5)` to `Math.min(highest, 7)` (so screening can identify up to L7, with L8 confirmed by full assessment).

### 5. Book catalog

**File: `src/lib/bookCatalog.ts`**

Remap all 33 books. The complete mapping (from rwi_aligned_proposal.md Section 5):

| Old sub_level | Old level | New sub_level | New level | Title |
|---|---|---|---|---|
| L1.1 | 1 | L1.1 | 1 | Tap! Tap! Tap! |
| L1.2 | 1 | L1.2 | 1 | The Mud on the Dog |
| L1.3 | 1 | L3.1 | 3 | The Fish in the Tank |
| L1.4 | 1 | L2.1 | 2 | The Red Socks |
| L1.5 | 1 | L2.2 | 2 | Run, Pup, Run! |
| L1.6 | 1 | L2.3 | 2 | Fox Fell Off! |
| L1.7 | 1 | L2.4 | 2 | The Jam Jug |
| L1.8 | 1 | L2.5 | 2 | The Yak and the Box |
| L1.9 | 1 | L3.2 | 3 | Chop, Chop, Chop! |
| L1.10 | 1 | L3.3 | 3 | Buzz and Sing! |
| L2.1 | 2 | L4.1 | 4 | The Night Light |
| L2.2 | 2 | L4.2 | 4 | Moo at the Zoo |
| L2.3 | 2 | L4.3 | 4 | Morning on the Farm |
| L2.4 | 2 | L4.4 | 4 | The Fair in the Air |
| L2.5 | 2 | L4.5 | 4 | Round and Round |
| L2.6 | 2 | L4.6 | 4 | The Night Fair |
| L3.1 | 3 | L5.1 | 5 | The Big Bike Race |
| L3.2 | 3 | L5.2 | 5 | Lost at the Night Market |
| L3.3 | 3 | L5.3 | 5 | The Dream Team |
| L3.4 | 3 | L5.4 | 5 | What Min Saw |
| L3.5 | 3 | L5.5 | 5 | The Boat with the Red Sail |
| L4.1 | 4 | L6.1 | 6 | The Purple Purse |
| L4.2 | 4 | L6.2 | 6 | The Brown Owl |
| L4.3 | 4 | L6.3 | 6 | The New Glue |
| L4.4 | 4 | L6.4 | 6 | The Cheeky Monkey |
| L5.1 | 5 | L7.1 | 7 | Before the Shore |
| L5.2 | 5 | L7.2 | 7 | Near the Door |
| L5.3 | 5 | L7.3 | 7 | Sure She Can! |
| L5.4 | 5 | L7.4 | 7 | A Place for Me |
| L6.1 | 6 | L8.1 | 8 | The Marvellous Neighbourhood |
| L6.2 | 6 | L8.2 | 8 | You Are Remarkable |
| L6.3 | 6 | L8.3 | 8 | It Looks Suspicious! |
| L6.4 | 6 | L8.4 | 8 | The Incredible Bush Walk |

Update each entry's `level`, `sub_level`, and `sort_order` accordingly.

### 6. Interactive book data

**Files: `src/lib/interactiveBookData.ts` through `interactiveBookDataL6.ts`**

These contain sentence-level tappable audio data. They need renaming/reorganising to match the new level structure. The data inside doesn't change — just the level tags and file organisation.

### 7. Database migration

**File: new migration in `supabase/migrations/`**

The `assessment_results` table stores `level` as an integer. The `books` table has `level` and `sub_level` columns. The `user_books` table references books.

For the school-8 track:
- Add a `level_mode` column to `children` or `profiles` (default: 'parent-6')
- Create a `level_mapping` view or function that translates between 6-level and 8-level IDs
- Assessment results should store the `level_mode` used at time of assessment
- Do NOT alter existing rows — add new columns, don't change old data

### 8. International level mapping

Create a reference file `src/lib/internationalMapping.ts` that maps our levels to international equivalents for school use:

| Our Level | UK (Letters & Sounds) | UK (RWI) | UK Year Group | Australia | US (Common Core) | IB PYP |
|---|---|---|---|---|---|---|
| L1 Ditties | Phase 2 (early) | Early Set 1 | Reception (Autumn) | Foundation | Pre-K / K | EY1 |
| L2 First Sounds | Phase 2 (late) + Phase 3 singles | Set 1 (singles) | Reception | Foundation | Kindergarten | EY1 |
| L3 Special Friends | Phase 3 (consonant digraphs) + Phase 4 | Set 1 (digraphs) | Reception (late) | Foundation/Year 1 | Kindergarten | EY2 |
| L4 Longer Sounds | Phase 3 (vowel digraphs) | Set 2 | Reception-Year 1 | Year 1 | Grade 1 | EY2 |
| L5 New Spellings | Phase 5 (split digraphs) | Early Set 3 | Year 1 | Year 1-2 | Grade 1 | Grade 1 |
| L6 Building Fluency | Phase 5 (alternatives) | Set 3 continued | Year 1-2 | Year 2 | Grade 1-2 | Grade 1-2 |
| L7 Reading Together | Phase 5 (late) - Phase 6 | Grey (final sounds) | Year 2 | Year 2-3 | Grade 2 | Grade 2 |
| L8 Reading Champion | Phase 6 (morphology) | Grey (suffixes) | Year 2-3 | Year 3 | Grade 2-3 | Grade 2-3 |

This should be exported as a constant and used on:
- The assessment results screen (show the international equivalent for the child's country)
- The school dashboard (so international schools can map to their local curriculum)
- A public-facing "How Our Levels Work" page

### 9. Components to check

Grep for any component that hardcodes level numbers, colours, or names. Key ones:

- `src/components/WorksheetsPanel.tsx` — level tabs
- `src/pages/Assessment.tsx` — results display
- `src/pages/AssessmentResult.tsx` — results page
- `src/pages/Index.tsx` — library/level filters
- `src/pages/ParentDashboard.tsx` — progress display
- `src/pages/Progress.tsx` — per-level progress
- `src/pages/Learn.tsx` — level navigation
- `src/pages/Teachers.tsx` — school view
- `src/pages/TeachersLibrary.tsx` — school library
- Any component using `LEVELS.length`, `level <= 6`, or `Array(6).fill()`

All of these should work off the exported `LEVELS` array length, not hardcoded 6.

### 10. Python book data files

**Directory: `myphonics_books/data/`**

Each book's `.py` data file has `level` and `sub_level` fields. These need updating to match the new mapping. For example:

- `tap_story_l1_1_book1.py` → update `level = 1, sub_level = "L1.1"` (stays same)
- `red_socks_story_l1_4_book4.py` → update `level = 2, sub_level = "L2.1"`
- `fish_tank_story_l1_3_book3.py` → update `level = 3, sub_level = "L3.1"`
- All L2 books → level 4
- All L3 books → level 5
- All L4 books → level 6
- All L5 books → level 7
- All L6 books → level 8

Also update `level_colour` in each file to match the new hex values.

Do NOT rename the .py files themselves yet — just update the data inside them. File renaming is a separate step.

## Build order

1. **Read the Curriculum Ledger** (`CURRICULUM_LEDGER.md`) — this is the source of truth for all GPCs, tricky words, and level definitions
2. **Create feature branch** `feature/8-levels`
3. **Add LEVEL_MODE env var** and dual-track config wrapper
4. **Update CSS variables and Tailwind config** (add levels 7-8, add Coral and Indigo)
5. **Update types.ts** (8-level LEVELS array behind LEVEL_MODE)
6. **Update assessmentData.ts** (split old L1 items, remap old L2-L6, create new items for L1-L3, update AGE_EXPECTATIONS)
7. **Update adaptiveEngine.ts** (new screening words, colours, names, pass criteria, cap)
8. **Update bookCatalog.ts** (remap all 33 books)
9. **Create internationalMapping.ts**
10. **Update interactive book data files** (level tags)
11. **Update Python book data files** (level and colour fields)
12. **Scan all components** for hardcoded level references
13. **Write database migration** (new columns, level_mode support)
14. **Test** — both parent-6 and school-8 modes

## Important constraints

- **British English** spelling throughout (colour, favourite, centre, practise, etc.)
- **Zero regressions** on the parent-6 path — current production behaviour must be preserved
- The **decodable rule** is absolute — every assessment word must be decodable at its level
- **Small solid black dot eyes** on all illustrated characters (Islamic ruling) — not relevant for assessment but keep in mind for any new illustrations
- Do NOT modify existing shipped worksheet PDFs or their paths
- Do NOT rename Python .py book files (just update data inside them)
- Do NOT deploy to production — this stays on the feature branch

## What NOT to do

- Don't touch the Curriculum Ledger — it's already been updated
- Don't generate Sound Books — that's being done separately
- Don't create worksheets — that's a future task
- Don't change the Supabase production database — migration is for the feature branch only
