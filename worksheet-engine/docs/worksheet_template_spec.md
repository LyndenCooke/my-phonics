# Worksheet Template Specification

## Purpose
Defines the reusable visual system for MyPhonicsBooks-style worksheet templates. Use with `worksheet_recreation_skill.md` and `worksheet_visual_qa_checklist.md`. Aim: consistent, attractive, print-ready pages generated from code that still feel like professionally designed phonics resources.

## Design Philosophy
The worksheet should feel: friendly, clean, structured, child-friendly, bright but not overwhelming, visually full without being crowded, consistent across a scheme — closer to a designed Canva/Twinkl-style resource than a webpage or document.

It must **not** feel sparse, generic, overly pink, like raw HTML, like a school form, or like a word-processor export.

## Page Setup
- A4 portrait, 210 × 297 mm. PDF output, 300 dpi raster; vector text/lines wherever possible.
- Digital coordinate system: 794 × 1123 px (or hi-res 1240 × 1754). Use one consistently.
- Margins: outer 22–30 px (≈ 7–9 mm). Content must not touch the page edge. Footer near the bottom but inside the safe margin.

## Colour System
**Primary pink** (`#E83E83`), dark pink `#D92772`, light pink border `#F6A9C8`, very light pink `#FDEAF2`. Use for header background, section number circles, accents, thin borders, optional x-height guide.

**Neutrals**: main black `#222`, soft black `#333`, grey text `#666`, handwriting grey `#B5B5B5`, guide grey `#D8D8D8`, footer grey `#EFEFEF`.

**Balance rule**: pink creates identity, not domination. Pink header + number circles + borders; black section headings if the page feels too pink; black instruction text; grey handwriting guides; pink x-height guide only if it adds clarity.

## Typography
- **Title font**: rounded friendly display (Baloo / Fredoka / Nunito ExtraBold) — large, readable, playful, not cramped.
- **Body font**: clear rounded sans (Nunito / Quicksand / Poppins / Arial Rounded).
- **Handwriting font**: simple infant print — single-storey `a`, clear ascenders/descenders, not cursive/joined/slanted (Sassoon-style if licensed; Edu Beginner/Foundation; or **Andika** as used here).

Sizes (794×1123): title 38–48; sound tile letter 38–48; level badge 14–18; sound badge 13–17; section number 16–20; section heading 22–28; instruction 13–17; footer 10–13; trace letters 38–50; trace words 32–44; missing letters 32–42. Scale proportionally for hi-res.

## Header
Pink rounded banner with left sound tile, centred title, level + sound badges.
- Banner (794 canvas): x 24, y 22, w 746, h 105–120, radius 24–32. May be slightly shorter if space is needed but must still feel substantial.
- **Left sound tile**: white rounded tile, vertically centred, must not dominate. w 85–100, h 72–92, radius 16–22, letter in primary pink, optically centred.
- **Title** ("The Sound a"): horizontally centred in the visual header, vertically centred, no awkward gap before the target sound (reduce tracking if it looks broken). Target sound may be italic/bold but remains part of the title. Must not collide with tile or badges.
- **Right badges** (`Level 1`, `Sound • a`): fully inside the header, no text touching edges, vertically stacked with consistent gap, right-aligned, not overflowing. w 86–110, h 26–32, gap 8–10, right inset 12–18, radius 16–18.

## Section Panels
Each activity in a rounded panel: thin light-pink border (1.5–2px), radius 20–28, controlled internal padding, number circle (pink fill, white number, ø 28–36, aligned to heading baseline), heading (black recommended when pink is overused), instruction (smaller, black/dark grey, ≥14–24px above content).

## Template: Single Sound Worksheet
Structure: Header → §1 Trace the letter → §2 Trace the words → §3 Write the missing sound → Footer.

Vertical distribution (794×1123, guides): Header 22–130; §1 145–320; §2 340–800; §3 820–1025; Footer 1060–1090.

### §1 Trace the Letter
1 solid model letter + 4 trace letters + blank writing space. Avoid too many traces / no free space / huge model-to-trace gap / a narrow band. Writing box full width, h 70–95, rounded, 20–28 left/right padding. Default trace count: 1 model + 4 traces + 35–45% of the row blank (very young: 1 + 5 + 25–35% blank). Don't fill the whole line with traces unless asked.

### §2 Trace the Words
Row = image card | trace word box | blank writing box. Ratios: image 16–20%, trace 38–42%, blank 38–42%.
- **Image cards**: transparent PNG; remove white bg; crop tightly; scale object to 65–80% of card; centre optically; bg must not cover border/padding; never tiny text labels; if missing, fail clearly and report. Padding 8–14, minimal top padding, object large and recognisable.
- **Trace word box**: one word (model) or two repeated words (practice). Pick one system and apply consistently. One word → left-aligned, baseline-centred, breathing room after. Two words → slightly smaller, evenly spaced, same baseline.
- **Blank box**: identical handwriting guides, no text.

### §3 Write the Missing Sound
Card = image area + handwriting guide + word with missing grapheme (`ant→_nt`, `axe→_xe`, `rat→r_t`, `jam→j_m`).
- Image: large, transparent bg, tightly cropped, above the writing line without colliding.
- **Missing word alignment (critical)**: position visible letters as if the missing letter were present. Calculate full word width including the missing grapheme, reserve invisible space, place visible letters around the gap, centre the full imagined word optically. (`_nt` centres as `ant`; `r_t` reserves the `a` gap and centres `rat`.)
- Baseline: dark grey/black, below the letters, descender space, not cutting descenders; shared across all cards.

## Handwriting Line System
Lines: top guide, x-height, baseline, optional descender. Style: top light grey continuous/soft dashed; x-height light pink dashed; baseline darker grey continuous; descender light grey dashed. If the top guide is the upper boundary it must look intentional, not a random decorative dash. Positions within a box: top ~20–25% from top; x-height ~40–48%; baseline ~68–75%; descender ~84–90% (adjust by font). Align letters by **baseline anchor**, not bounding box; test `cat mat hat bag pan sit tap pin`.

## Footer
Light grey rounded bar near the bottom margin, full content width, h 26–34. Left: `MyPhonicsBooks · decodable phonics practice` (brand may be pink/bold). Right: `Single Sound · a` or `Worksheet 1 of 5`. Vertically centred, text not touching edges.

## Asset Handling
Transparent PNG, tightly cropped object, consistent style, no white box / watermark / shadow box (unless intentional). If source has white bg: remove it, crop to object, preserve antialiasing, export transparent, scale to card. Images occupy ~65–80% of card height, ~65–85% of width. Across one sheet, similar objects feel similar size; centre optically.

## Quality Bar
**Visual**: looks like a professional phonics resource; uses the page well; not HTML-like; no awkward gaps; no cramped labels; header fits cleanly; boxes align. **Educational**: task understood quickly; pictures recognisable; letters suit early handwriting; tracing not excessive; independent writing space; clear missing-sound task. **Technical**: correct page size; sharp text/lines; non-blurry images; reliable fonts; missing assets reported.

---

## As-built (this engine — `src/components/templates/SingleSound.tsx`)
This renderer works in **millimetres** (A4 210×297, outer margin 6mm). Live values:

| Region | y, h (mm) | | Element | Value |
|---|---|---|---|---|
| Header | 6, 26 | | Sound tile | 17×17mm, radius 4.5 |
| §1 | 36, 48 | | Title | 29pt, centred, single space |
| §2 | 88, 134 | | Section title | black (`titleColor` option) |
| §3 | 226, 56 | | Number circle | pink, 7mm |
| Footer | 285, 7 | | Gaps | 4mm (3 before footer) |

Fonts: **Andika** (body + handwriting). Handwriting via `TraceLine.tsx` (SVG, baseline-exact; `model`, `modelWeight`, `align`, `midlineColor`, `ascenderDashed`). Images via `Clipart.tsx` (`fill` + `multiply`; art pre-trimmed by `scripts/trim-clipart.mjs`). Colour from `levelThemes.ts` (`theme.primary`/`theme.border`) — never hard-coded. The mm values above are the source of truth for this engine; the px figures earlier are the general system guidance.

## Locked template rules (2026-06-07 — `sound_a` approved as the master)
1. **Font is a TEMPORARY placeholder.** Andika is a stand-in; the final brand
   handwriting font is **Sassoon (Primary or Infant)**. The layout is locked
   independently of the font — when Sassoon is licensed, drop the ttf in
   `public/fonts`, re-measure with `scripts/measure-font.mjs`, paste the ratios
   into `handwriting.ts`, repoint `FONT.hand`/`FONT.trace`. No template changes.
2. **Missing-word optical centring.** In §3, render the COMPLETE imagined word
   and make the target grapheme **invisible** (a transparent `TraceLine`
   segment) so it reserves its true width; centre the whole word
   (`align="middle"`). Never centre only the visible letters. (`_nt` is centred
   as `ant`, with the `a`'s width reserved on the left.)
3. **Header badge.** The character mascot sits in a consistent white **rounded
   square badge** (logo-like, ~20mm), vertically centred — deliberate, not
   "dropped in the corner". The 2nd header pill carries the booklet STRAND
   (e.g. "Handwriting"), not a repeat of the sound.
