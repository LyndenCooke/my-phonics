# Worksheet template production plan — reference-first, then code

**Why this exists.** Code is good at *reproducing* a worksheet design and *parameterising* it per level; it is poor at *inventing* a strong design from a blank page. So the production order is fixed: **design the reference image first** (in ChatGPT / an image tool), approve the look, **then recreate it in code** and parameterise it per level. The reference image is the source of truth (see `worksheet_recreation_skill.md`). This document is the plan for *which* references we need, *which* templates repeat across levels, and the *brief* to feed the image tool.

Read with: `worksheet_template_spec.md` (design contract), `booklet_plan.md` §B (the full template back-log + schema fields), the L6 grammar build spec.

---

## 1. The workflow (every new template)

1. **Brief the image tool** with the style contract (§3) + the per-template line (§4) + attached examples (the locked `sound_a` sheet, and any old worksheet images in that style).
2. **Generate the reference image** for ONE level/colour (we pilot most templates at **L6 indigo**, the richest grammar band).
3. **Approve the look** (round boxes, header, spacing, density). Iterate the image, not the code.
4. **Recreate in code** to the locked system: `SheetShell` chrome, `getLevelTheme(level)` colour, `TraceLine` for every writing line, fixed mm layout, data-driven content.
5. **Parameterise per level**: the template never changes — only the level colour (`getLevelTheme`) and the data swap. One template → all 8 levels.
6. **QA** against `worksheet_visual_qa_checklist.md` and the reference image.

> The 7 L6 grammar sheets already built (`grammar__g-l6-*.pdf`) are **drafts on the locked system**, not throwaway. They become final once a ChatGPT reference confirms/upgrades the look per format. The code is ready to be tuned to match an approved image.

---

## 2. Reuse map — how often a template is drawn vs recoloured

The key planning fact: **a template is designed once and then recoloured + refilled per level.** You do *not* redraw a tick-grid for every level — you draw it once, then `getLevelTheme(level)` + new data produce L1…L8. References are needed per **template**, not per level.

| Bucket | Meaning | Reference images needed | Templates |
|---|---|---|---|
| **A. One reference → all levels** | Same activity recurs across many levels; build once, recolour + refill | 1 per template | `SingleSound` (LOCKED ✓), `HandwritingCopy` (print), `TrickyWords`, sentence-writing family, `BookletCover`, `ContentsPage`, `Certificate`, and the **6 grammar formats** below |
| **B. One reference → some levels** | Recurs but only in a band of levels | 1 per template | `SpellingSort`, `SuffixTransform` (L5/L7), `Comprehension` (upper), `ConsonantAltSort` (L6), `CommasInLists`/punctuation-insert family |
| **C. New reference, level-specific** | Appears at one level / changes shape enough to redesign | 1 each, when reached | **Joined** `HandwritingCopy` (upper levels — distinct from print), `SuffixSpelling` (replaces SingleSound at L8), `WordFamilyTree` (L8), `TimeAdverbialStrip`, `ProofreadChallenge` (L8) |

**Repetition examples the user flagged:**
- **Sounds repeat at later levels** → `SingleSound` is bucket A: one locked template, every grapheme/level just swaps data + colour. Already done.
- **Joined handwriting comes later** → `HandwritingCopy` has a `mode` field; *print* mode is bucket A (one reference now), *join* mode is bucket C (its own reference when we reach the upper levels). The template frame is shared; only the writing-row content/mode changes.

---

## 3. The style contract (paste this block at the top of every image brief)

```
Make a single A4 portrait worksheet IMAGE (210×297mm, ratio ~1:1.414), print-ready, high resolution.

STYLE: a clean, friendly UK primary-school worksheet — like Twinkl or Schofield & Sims,
NOT a webpage, app screen or form. Use:
- a solid colour HEADER BAR across the top with a white, centred title; a small white
  rounded-square MASCOT TILE on the left; two small stacked rounded PILLS on the right
  (top = level label, bottom = the strand word).
- ROUNDED PANELS with thin coloured borders for each activity section, each with a small
  numbered circle + bold heading.
- a thin LIGHT-GREY FOOTER BAR at the bottom (brand left, caption right).
- one rounded infant-print font throughout (single-storey a and g), child-friendly.
- writing lines drawn as faint dashed handwriting guidelines (top, mid, baseline).
- generous white space; the page should feel full but calm, not crowded.

COLOUR: use ONE theme colour only — [LEVEL COLOUR HEX] — for the header bar, panel borders,
number circles and small accents. Everything else is black text on white. No other bright colours.

Attached examples show the exact house style — match the header bar, panels, pills and footer.
[attach: the sound_a sheet image + 1–2 old MyPhonicsBooks worksheet images]
```

Then add the per-template line from §4, e.g. *"Design this worksheet for: Level 6, colour Indigo #6366F1, strand 'Grammar'. Activity: …"*.

L6 pilot colour is **Indigo `#6366F1`** (`light #ECEDFE`, `border #B6B9FA`). Full set in `levelThemes.ts`.

---

## 4. The grammar reference set to make next (6 images, all L6 indigo)

Each is bucket **A** — one reference now, then the format spirals across L1–L8 with new content + colour. All bound-booklet (no cut-outs). Add each line under the §3 block:

| # | Format (code template) | Brief line to add | Key elements to show |
|---|---|---|---|
| 1 | **Tick-grid** (`GrammarTickGrid`, G-L6.1) | "Activity: read each sentence and tick which kind it is." | A worked "Watch first" example panel; a grid of 8 sentences down the left, 4 tick-box columns headed Statement / Question / Command / Exclamation. |
| 2 | **Build** (`GrammarBuild`, G-L6.2) | "Activity: add describing words to grow a noun phrase." | A word-bank strip; rows showing a short phrase ("the owl") → an arrow → a blank handwriting line to rewrite it bigger. |
| 3 | **Cloze** (`GrammarCloze`, G-L6.3/4) | "Activity: write the missing joining word in each gap." | A word-bank box (and/but/or/so); sentences with a short ruled gap mid-line to write the word. |
| 4 | **Match** (`GrammarMatch`, G-L6.6) | "Activity: draw a line to join each pair to its short form." | Two columns of rounded word cards with a small dot on each inner edge to draw between; left in order, right scrambled. |
| 5 | **Circle/underline** (`GrammarCircle`, G-L6.5) | "Activity: circle the adjective, underline the adverb." | A key line showing the two marks (in black); 4 large, well-spaced sentences with room to mark. |
| 6 | **Rewrite** (`GrammarRewrite`, G-L6.7) | "Activity: rewrite a sentence to fix the tense." | The sentence in a tinted box; a blank handwriting line below to rewrite it. |

Shared on all six: header bar (mascot tile + title + L6/Grammar pills), a thin terminology row under the header, a "**Watch first**" worked-example panel (the I-do step), then the activity panel.

**After approval:** I tune each existing template to match its reference, lock it, then the same template renders L1–L8 by swapping colour + data.

---

## 5. Action items

- [ ] **User:** generate the 6 grammar reference images (§4) in ChatGPT, attaching the `sound_a` sheet + any old worksheet examples. Approve the look per format.
- [ ] **Me:** recreate/tune each grammar template to its approved reference; re-render `grammar__g-l6-*`; QA.
- [ ] **Me:** fix the stale `booklet_plan.md` §B rows that say "cut-and-sort / dashed cut lines" — bound booklets have **no cut-outs** (sorts are tick-grids / write-ins). `CutAndSort`/`SentenceTypeSort` → tick or write-in variants.
- [ ] **Then:** mascot tile asset — no L6 book-mascot art exists yet (placeholder "abc"); generate/import the L6 hero so the tile matches the sound sheets.
- [ ] **Then:** roll the 6 locked grammar templates to L4/L5/L7 (data only), per `booklet_plan.md` §D.
