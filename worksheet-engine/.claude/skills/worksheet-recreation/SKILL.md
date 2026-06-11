---
name: worksheet-recreation
description: >-
  Use for ANY MyPhonicsBooks printable worksheet / booklet template work in the
  worksheet-engine: recreating a ChatGPT or reference worksheet image/PDF into
  code, building a new activity template, parameterising a template per level,
  or rendering/QAing worksheet PDFs. Enforces the reference-first → recreate →
  lock workflow and the locked sound_a design system (SheetShell chrome,
  TraceLine writing lines, getLevelTheme colour, fixed-mm A4 layout, no
  cut-outs). Triggers: "recreate this worksheet", "make a worksheet template",
  "build the L<n> <strand> sheet", "match this reference image", "pixel-perfect
  worksheet", "turn this image-generated sheet into code", grammar/handwriting/
  spelling/sound worksheet building.
---

# Worksheet recreation (MyPhonicsBooks)

The engine is `worksheet-engine/` (Next.js + React/SVG → Puppeteer PDF). Code is good at *reproducing* and *parameterising* a design, poor at *inventing* one. So always work **reference-first**: design/approve the look as an image, then recreate it in code, then lock and parameterise per level.

## Authority — read before building
1. `docs/worksheet_recreation_skill.md` — the 6-phase recreation process (full text).
2. `docs/worksheet_template_spec.md` — the design contract + the **as-built `sound_a` master** values and locked rules.
3. `docs/worksheet_visual_qa_checklist.md` — run after every render.
4. `docs/template_production_plan.md` — the reference-first workflow, the reuse map (one reference per template, not per level), and the ChatGPT image briefs.
5. `docs/grammar_scheme_of_work.md` + the L6 grammar build spec — content authority for the grammar strand.

## The non-negotiable system (do not reinvent)
- **Grammar chrome = the "flowy" system** in `src/components/grammar/FlowyLayout.tsx` + `FlowySheet.tsx` (current standard, supersedes the boxed `GrammarLayout`): wavy header/title-only, faint ground wave (flow only where there's no text), soft borderless tint boxes, our character big in the corner, page-number badge, big NO-bold type. See QA checklist §21. Roll it to other levels by swapping colour + character.
- **Sound sheets chrome comes from `src/components/SheetShell.tsx`** — the locked `sound_a` header bar, bordered panels, `SectionHead`, footer, mm geometry. `SingleSound.tsx` is the LOCKED master. (The flowy direction may later flow back to the sound sheets too.)
- **Two line types, don't mix them.** `TraceLine` (3-zone dashed handwriting guide, real Andika metrics) is ONLY for handwriting/letter-formation practice — test seating with `tall pin dog jump`. For writing words/phrases/sentences as answers (grammar, cloze gaps, rewrites, apply tasks) use a plain `WriteLine` (single rule), sitting just below the prompt/arrow. Never hand-draw `<div>` lines.
- **Colour only from `getLevelTheme(level)`** — never hard-code a hex; never default to pink. L6 = indigo `#6366F1`.
- **Fixed A4 in mm**, 6mm outer margin, content fills ~96% of height, absolute positioning (not flowing layout).
- **Bound booklets ⇒ no cut-outs / scissors** — sorts are tick-grids or write-ins.
- **Clipart = B/W LINE ART of the house characters/objects** (`LINEART=1` in `generate-clipart.mjs`) — same character style, no colour. Render via `Clipart` (fill + multiply), gated by `hasClipart(key)` so a missing piece leaves a clean slot, never a fake. **Place icons only where they aid the task** (the noun being expanded, a §1 worked example, a header mascot) — not on abstract tasks; don't copy decorative reference icons.
- **Spacing & sizing:** numbered `NumBadge` per activity row; word banks as pills / a labelled tinted panel; subtitle tight under its section title but a clear gap before the content; in-panel labels ≥11pt; child-facing words large (~16–17pt). Full checklist in `docs/worksheet_visual_qa_checklist.md` §7 + §20.

## Process (the 6 phases)
1. **Visual reading** — read the reference image as a designer (regions, radii, palette, type scale, density).
2. **Layout map** — fixed mm coordinates for header / panels / rows / footer before any code.
3. **Template extraction** — reuse `SheetShell` primitives; add only the activity body.
4. **Code generation** — React/SVG, fixed layout, `TraceLine` + `getLevelTheme` + data-driven content.
5. **Visual QA** — `npm run dev`, `npm run pdf <book> <sheet>`, compare to the reference; run the QA checklist.
6. **Lock** — once approved, freeze the layout; per level only the colour + data change. One template → all 8 levels.

## Golden rule
The reference image is the source of truth. Reproduce the layout first; content second. Do not move on to more pages until the master page is visually approved. Treat the user's visual feedback as authoritative and convert it into precise mm/ratio rules.
