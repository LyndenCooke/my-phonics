# Interactive Books — Review Guide for External AI

This file is a navigation guide for ChatGPT, Codex, or any external AI reviewer. It describes the architecture, data structures, and file locations for the 32 interactive phonics books in this app.

---

## Quick-Start Reading Guide

To review the full content of the interactive books:

1. **Book data (text, structure, phoneme breakdowns):**
   - L1 books (L1.1–L1.10): `src/lib/interactiveBookData.ts`
   - L2 books (L2.1–L2.5): `src/lib/interactiveBookDataL2.ts`
   - L3 books (L3.1–L3.5): `src/lib/interactiveBookDataL3.ts`
   - L4 books (L4.1–L4.4): `src/lib/interactiveBookDataL4.ts`
   - L5 books (L5.1–L5.4): `src/lib/interactiveBookDataL5.ts`
   - L6 books (L6.1–L6.4): `src/lib/interactiveBookDataL6.ts`

2. **Illustrations:** `public/illustrations/<L>_<N>/` — e.g. L1.1 → `public/illustrations/1_1/`
   - `cover.png` — cover art
   - `page1.png` … `page8.png` — story page illustrations

3. **Main reader component:** `src/components/InteractiveBookReader.tsx`

4. **Page type definitions & exported map:** `src/lib/interactiveBookData.ts` (top of file)

5. **Book selector UI (demo page):** `src/pages/Prototype.tsx`

---

## Architecture Overview

- **Stack:** React 18 + TypeScript + Vite + Tailwind CSS
- **Routing:** React Router; `/prototype` shows the interactive book selector
- **Audio:** ElevenLabs (George voice) for sentence MP3s → `public/sounds/sentences/`; phoneme sounds → `public/sounds/*.mp3`; word sounds → `public/sounds/words/`
- **Images:** Gemini-generated illustrations, stored in `public/illustrations/`

### Key exported symbols (all from `src/lib/interactiveBookData.ts`)

| Symbol | What it is |
|---|---|
| `INTERACTIVE_BOOKS` | `Record<string, InteractivePage[]>` — the full 32-book map |
| `InteractivePage` | Union type — 14 page variants (see below) |
| `StoryWord` | Per-word data with phoneme breakdown |
| `SpotlightItem` | Sound spotlight card (word + image + focusIndex) |
| `OrderingItem` | Story ordering card (image + label + correctIndex) |
| `QuizQuestion` | Comprehension question with options |
| `SpellingWord` | Spelling activity (word + letters array) |

---

## Page Type System (14 variants)

Each book is an array of `InteractivePage` objects. The `type` field determines what the reader renders:

| type | Purpose | Key fields |
|---|---|---|
| `cover` | Title page | `title`, `subtitle`, `imageUrl` |
| `sound_grid` | Focus sounds display | `focusSounds[]`, `allSounds[]` |
| `vocab_preview` | New vocabulary preview | `words: StoryWord[]` |
| `story` | Story page with image | `sentences[]`, `words: StoryWord[]`, `imageUrl`, `audioUrl?` |
| `sound_spotlight` | Spotlight a target sound | `sound`, `items: SpotlightItem[]` |
| `word_reading` | Blending practice list | `words: StoryWord[]` |
| `tricky_words` | Sight words to memorise | `words: StoryWord[]` |
| `writing_practice` | Letter/word writing | `letters[]` |
| `drawing` | Free drawing activity | `prompt` |
| `nonsense_words` | Non-word blending | `words: StoryWord[]` |
| `story_ordering` | Sequence 4 story events | `items: OrderingItem[]` |
| `quiz` | Comprehension quiz | `questions: QuizQuestion[]` |
| `spelling` | Drag-letter spelling | `words: SpellingWord[]` |
| `certificate` | Completion certificate | `bookTitle` |

### `StoryWord` interface

```typescript
interface StoryWord {
  display: string;      // Text shown on screen (may include punctuation, e.g. "sat,")
  word: string;         // Clean word for audio lookup (e.g. "sat")
  phonemes: string[];   // Phoneme breakdown e.g. ["s","a","t"] — empty for tricky words
  isTricky?: boolean;   // If true, learned by sight not sounding out
}
```

---

## 32-Book Index

| Key | Title | Level | Focus Sounds | Illustration folder |
|---|---|---|---|---|
| L1.1 | Tap! Tap! Tap! | 1 — Starting Stories | s, a, t, p, i, n | `public/illustrations/1_1/` |
| L1.2 | The Mud on the Dog | 1 — Starting Stories | m, d, g, o | `public/illustrations/1_2/` |
| L1.3 | The Fish in the Tank | 1 — Starting Stories | sh, nk | `public/illustrations/1_3/` |
| L1.4 | The Red Socks | 1 — Starting Stories | c, k, ck, e | `public/illustrations/1_4/` |
| L1.5 | Run, Pup, Run! | 1 — Starting Stories | u, r, h, b | `public/illustrations/1_5/` |
| L1.6 | Fox Fell Off! | 1 — Starting Stories | f, l, ff, ll | `public/illustrations/1_6/` |
| L1.7 | The Jam Jug | 1 — Starting Stories | j, v, w | `public/illustrations/1_7/` |
| L1.8 | The Yak and the Box | 1 — Starting Stories | x, y, z | `public/illustrations/1_8/` |
| L1.9 | Chop, Chop, Chop! | 1 — Starting Stories | ch, th | `public/illustrations/1_9/` |
| L1.10 | Buzz and Sing! | 1 — Starting Stories | ss, zz, qu, ng | `public/illustrations/1_10/` |
| L2.1 | The Night Light | 2 — Longer Sounds | ay, ee, igh | `public/illustrations/2_1/` |
| L2.2 | Moo at the Zoo | 2 — Longer Sounds | ow, oo | `public/illustrations/2_2/` |
| L2.3 | Morning on the Farm | 2 — Longer Sounds | ar, or | `public/illustrations/2_3/` |
| L2.4 | The Fair in the Air | 2 — Longer Sounds | air, ir | `public/illustrations/2_4/` |
| L2.5 | Round and Round | 2 — Longer Sounds | ou, oy | `public/illustrations/2_5/` |
| L3.1 | The Big Bike Race | 3 — New Spellings | a-e, i-e | `public/illustrations/3_1/` |
| L3.2 | The Stone Flute | 3 — New Spellings | o-e, u-e | `public/illustrations/3_2/` |
| L3.3 | Reach for the Treat! | 3 — New Spellings | ea, ie | `public/illustrations/3_3/` |
| L3.4 | What Min Saw | 3 — New Spellings | oi, aw | `public/illustrations/3_4/` |
| L3.5 | The Boat with the Red Sail | 3 — New Spellings | ai, oa | `public/illustrations/3_5/` |
| L4.1 | The Purple Purse | 4 — Building Fluency | ur, er | `public/illustrations/4_1/` |
| L4.2 | The Brown Owl | 4 — Building Fluency | are, ow | `public/illustrations/4_2/` |
| L4.3 | The New Glue | 4 — Building Fluency | ew, ue | `public/illustrations/4_3/` |
| L4.4 | The Cheeky Monkey | 4 — Building Fluency | are, ur, er, ew, ue, ow | `public/illustrations/4_4/` |
| L5.1 | Before the Shore | 5 — Reading Together | ore, ire, oor | `public/illustrations/5_1/` |
| L5.2 | Near the Door | 5 — Reading Together | ear, oor | `public/illustrations/5_2/` |
| L5.3 | Sure She Can | 5 — Reading Together | ure, tion | `public/illustrations/5_3/` |
| L5.4 | A Place for Me | 5 — Reading Together | ore, oor, ire, ear, ure, tion | `public/illustrations/5_4/` |
| L6.1 | The Marvellous Neighbourhood | 6 — Reading Champion | ous | `public/illustrations/6_1/` |
| L6.2 | You Are Remarkable | 6 — Reading Champion | able, ible | `public/illustrations/6_2/` |
| L6.3 | It Looks Suspicious! | 6 — Reading Champion | cious, tious | `public/illustrations/6_3/` |
| L6.4 | The Incredible Bush Walk | 6 — Reading Champion | ous, able, ible, cious, tious | `public/illustrations/6_4/` |

---

## Curriculum Progression

| Level | Name | Age | Sounds introduced |
|---|---|---|---|
| 1 | Starting Stories | 4–5 | All single letters + sh, nk, ck, ch, th, ff, ll, ss, zz, qu, ng |
| 2 | Longer Sounds | 4–5 | ay, ee, igh, ow/oo, ar, or, air, ir, ou, oy |
| 3 | New Spellings | 5–6 | Split digraphs (a-e, i-e, o-e, u-e), ea, ie, oi, aw, ai, oa |
| 4 | Building Fluency | 5–6 | ur, er, are, ow (brown), ew, ue |
| 5 | Reading Together | 6–7 | ore, ire, oor, ear, ure, tion |
| 6 | Reading Champion | 7–8 | Suffixes: ous, able, ible, cious, tious |

---

## Illustration Folder Convention

```
public/illustrations/<level>_<book>/
  cover.png      ← cover illustration
  page1.png      ← story page 1
  page2.png      ← story page 2
  ...
  page8.png      ← story page 8 (most books have 8 story pages)
```

Example: L3.2 "The Stone Flute" → `public/illustrations/3_2/cover.png`, `page1.png` … `page8.png`

---

## Audio File Conventions

| Type | Path | Naming |
|---|---|---|
| Phonemes | `public/sounds/<grapheme>.mp3` | e.g. `sh.mp3`, `igh.mp3` |
| Words | `public/sounds/words/<word>.mp3` | e.g. `cat.mp3`, `ship.mp3` |
| Sentences | `public/sounds/sentences/L<level>_<book>_p<page>.mp3` | e.g. `L1_3_p1.mp3` |

---

## Tricky Words Note

Tricky words are common high-frequency words that cannot be fully decoded at the current level. In `StoryWord`, they are marked `isTricky: true` and have an empty `phonemes: []` array. The reader renders them with a special highlight and does not attempt phoneme-by-phoneme audio playback.

Common tricky words used across the series: `the`, `I`, `a`, `is`, `no`, `go`, `to`, `do`, `she`, `he`, `we`, `me`, `be`, `was`, `said`, `are`, `were`, `you`, `they`, `my`, `by`, `all`, `here`, `there`, `where`, `some`, `come`, `one`, `once`.
