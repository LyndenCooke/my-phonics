# AGENT PROMPT — Interactive Curriculum Journey Map (paste into Claude Code)

Copy everything below the line into Claude Code, run from the repository root
(`C:\Users\ASUS\myphonicsbooks`).

---

You are building the **Curriculum Journey Map** for MyPhonicsBooks: an
interactive, two-scale "you are here" visual that children, parents and
teachers use to see progress through the whole phonics curriculum. It is the
on-screen sibling of the static zoom-out strip printed on every lesson
overview page, so the two must tell the same story from the same data.

## Project context (assume nothing else is known)

- This repository root is the MyPhonicsBooks website: React 18 + Vite +
  TypeScript + Tailwind. Components live in `src/`.
- `src/lib/levels8.ts` is the source of truth for the 8 journey levels and
  book-to-level placement (`JOURNEY_SUBLEVEL_BY_LEGACY`). Folder names and
  legacy 6-level tags elsewhere are misleading; trust `levels8.ts`.
- The full curriculum spine lives at
  `myphonics_books/data/lesson_overviews.json`: `total_lessons` (462) and
  `map`, an ordered array where each row is one lesson with fields:
  `n` (global lesson number, 1-462), `level` (1-8), `level_name`, `colour`,
  `half_term`, `code` (L2a, PSC prep etc.), `week`, `day`, `day_total`,
  `gpc`, `focus`, `title`, `objective`, `type` (gpc | review | assessment |
  keepup | focus | psc_prep | psc_mock), `book`, `book_title`, `sound_index`.
  Treat this file as READ ONLY. Add a small build/copy step that trims it to
  a public JSON the site can fetch (drop `objective`, keep the rest) rather
  than importing the raw file at runtime.
- The 8 levels, in order, with their exact colours (never substitute):
  L1 Ditties #E84B8A · L2 First Sounds #F97066 · L3 Special Friends #F59E0B ·
  L4 Longer Sounds #22C55E · L5 New Spellings #3B82F6 · L6 Building Fluency
  #6366F1 · L7 Reading Together #8B5CF6 · L8 Reading Champion #14B8A6.

## What to build

`<JourneyMap currentLesson={n} />` in `src/components/journey/`, a
self-contained component with two views and an animated zoom between them.

**1. Whole-journey view (zoomed out).** The 8 levels drawn as large
checkpoint circles along a winding path (a gentle S-curve flowing down or
across the screen; a journey with bends, not a straight rail and not a
literal snake). Each checkpoint: the level number, name and colour.
States derived from `currentLesson`: completed levels filled in their colour
with a tick; the current level larger with a soft pulsing ring and a
"you are here" marker; future levels greyed outlines. Under each checkpoint a
small progress figure (e.g. "12 of 27 lessons"). A short colour-graded
progress bar of the whole 462-lesson journey sits above or below the path.

**2. Inside-a-level view (zoomed in).** Clicking or tapping a level
checkpoint zooms into that level: the same winding-path language, now showing
that level's own mini checkpoints in level colour, one per week from the
`map` rows (group by `week` within the level; label each with its `gpc` or
focus, e.g. "sh", "Quick Check", "Keep-up"). Assessment weeks get a flag
style, not a circle. The current week expands to show its Day 1-5 pips
(`day` of `day_total`), matching the printed page's pips exactly. Each mini
checkpoint can show a small popover on tap: lesson title, book title if any,
and lesson numbers. A clear back control zooms out to the whole journey.

**Zoom behaviour.** A smooth animated transition (scale and pan, or a
crossfade between layered views; framer-motion is welcome if already a
dependency, otherwise CSS transitions). Respect `prefers-reduced-motion` by
swapping to instant view changes.

## Design language

- Headings in Outfit, body in Plus Jakarta Sans; any child-facing grapheme
  labels (sh, igh, a-e) in Andika.
- Glass-panel cards for popovers; indigo/violet gradient only for primary
  CTAs; the path itself stays neutral grey with level-coloured checkpoints.
- Mobile-first: the path must read well at 375px wide and scale up; touch
  targets at least 40px.
- Keyboard accessible: checkpoints are buttons, focus states visible,
  Escape zooms out; sensible aria labels ("Level 3, Special Friends,
  complete").
- No illustrations of characters are needed; if any are ever added, eyes are
  a solid black filled oval, never white-highlighted.

## Hard rules

- British English in all UI copy. No em dashes and no Oxford commas in copy.
- Our terminology only: never use other phonics schemes' trademarked terms
  (no "Speed Sounds", "green words" and similar).
- Do not modify `myphonics_books/data/*.json`, `src/lib/levels8.ts` or any
  shared data; the component reads, never writes.
- Level colours exactly as listed; never default to pink.

## Acceptance checklist

1. `<JourneyMap currentLesson={83} />` shows L1 and L2 complete, L3 current
   with the pulse on the sh week, day pips 3 of 5 filled, and correct counts.
2. Tapping L3 zooms in; Escape or the back control zooms out; both animated
   unless reduced motion is set.
3. Works at 375px and 1280px; passes keyboard-only navigation.
4. The trimmed public JSON regenerates from `lesson_overviews.json` with a
   single documented command, and the component renders purely from it plus
   `currentLesson`.
5. A short Storybook story or demo route showing lessons 1, 83, 250 and 462.
