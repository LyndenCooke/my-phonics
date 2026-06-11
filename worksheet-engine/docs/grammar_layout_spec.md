# grammar_layout_spec.md

The definitive flowy grammar page specification. This is the single layout
authority for every grammar sheet at every level. All values are exact. Layout
is positioned in millimetres on A4 portrait. Type is in points. Colour is read
from `getLevelTheme(level)` and never hard-coded.

House style applies to every word printed: British English, no em dashes, no
Oxford commas, no bold anywhere, warm child-facing instructions.

---

## 1. Page and colour tokens

| Token | Value |
| --- | --- |
| Page | A4 portrait, 210 x 297 mm |
| Outer margin | 6 mm all sides |
| Content box | x 6 to 204 mm (width 198 mm), y 6 to 291 mm (height 285 mm) |
| Level colour | `theme.colour` from `getLevelTheme(level)` |
| Level light (tints) | `theme.light`, an 8 to 12 percent tint of the level colour |
| Ink | `#1A1A1A` for all body, sentence and ruled-line ink |
| Accent | level colour, used only for answers, arrows, headers and badges |

For L6 the level colour is Indigo `#6366F1` and the light tint is its 10 percent
wash. Never write the hex into a component; pull it from the theme.

---

## 2. The one type scale (locked)

Four roles only. Same role, same size, on every worksheet page. Regular weight
throughout. No bold. No tier of small grey text exists.

| Role | Size | Used for |
| --- | --- | --- |
| title | 27 pt | the worksheet header title (the only text in the header band) |
| instruction | 16 pt | the `doInstruction` line, the `Watch first` label, the apply line, the terminology note, tickgrid column headers, the word-bank label, how-to step titles, answer-key unit headings |
| body | 18 pt | worked-example text, every sentence, word-bank words, cloze sentences, match chips |
| footer | 9 pt | the foot strapline and the page-number badge |

Front-matter display size (cover only, never on a worksheet page): the cover
wordmark uses a 44 pt display size. This is the only place a fifth size
appears, and it never sits on a worksheet page, so the one-scale rule on the
units holds.

No size other than the four roles (and the front-matter display line) may
appear anywhere in the booklet.

---

## 3. Vertical regions of a standard worksheet page (mm from top)

These are the regions for any of the four unit, five, six, seven units. The
header is full bleed. Everything else sits inside the content box.

| Region | Top y | Notes |
| --- | --- | --- |
| Header band | 0 | full bleed, level colour, wavy bottom edge |
| (header title) | centre at y 20 | title role 27 pt, white, centred horizontally, header text only |
| Watch-first box | 44 | soft tinted box, level light, no border, 6 mm corner radius |
| Instruction line | Watch-first bottom + 5 | instruction role 16 pt, ink |
| Activity area | instruction bottom + `--write-line-gap` | format-specific, see section 7 |
| Apply line | after the last activity row + 6 | instruction role, one line |
| Apply writing lines | apply line + `--write-line-gap` | 3 ruled lines by default |
| Ground wave | y 278 | faint level-colour wave, 8 percent opacity, behind footer |
| Footer strapline | baseline y 289 | footer role, x 6 mm |
| Page badge | centre x 192, y 285 | round 12 mm, level colour fill, white number |

### Header band geometry

- Full-bleed rectangle from y 0, filled with the level colour.
- Bottom edge is a sine wave: mean y 38 mm, amplitude 4 mm, so the edge runs
  between y 34 and y 42 mm. One full period across the 210 mm width.
- Title only. No pills. No mascot tile. No subtitle in the band on a worksheet
  page. White, centred, vertical centre at y 20 mm.

### Watch-first box

- Fill: level light tint. No border. Corner radius 6 mm. Internal padding 8 mm.
- Line 1: the `Watch first` label, instruction role, level colour.
- Then the worked example, body role, laid out inline or stacked per section 6.
- Optional terminology note: where a unit must name statutory terminology
  (for example the exclamation rule), one line at instruction role in ink,
  inside the box, below the example. It is normal size, never small, never
  grey, and appears only when `s1.note` is set.
- There is no `Have a first look` line. Delete that string everywhere.
- Short-example box height about 26 mm. Stacked-example box height about 42 mm.

---

## 4. Writing lines (the single most important fix)

Grammar answers are written on plain black ruled lines. The three-zone
handwriting guide (faint top line, dashed x-height, descender line) is for the
handwriting strand only and never appears on a grammar sheet.

| Property | Value |
| --- | --- |
| Line style | solid, ink `#1A1A1A`, stroke 0.4 mm (about 1.1 pt) |
| `--write-line-gap` | 9 mm (the rewrite-sheet target spacing; one token, set once) |
| Line-to-line gap | `--write-line-gap` |
| Instruction-to-first-line gap | `--write-line-gap` (the same number) |
| Default apply lines | 3 |
| Build row lines | 1 long line per row, after the arrow |
| Rewrite row lines | 2 lines per row, below the source strip |

The gap is constant and generous and identical on every sheet and in every
block. There is no dashed line and no faint guide line anywhere on a grammar
sheet. A cloze gap is not a writing line: see section 7.

---

## 5. Imagery (decoration layer)

The book world supplies the art. Use flat line-art objects and characters from
the level's books and world: owl, owlets, branch, leaf, moon, purse, glue, cup,
cat, bird, card, rug, monkey and similar.

| Rule | Value |
| --- | --- |
| Count per sheet | 2 to 3 line-art objects |
| Placement | varied per sheet, in genuine white space, never always the bottom corner |
| Source | flat line-art, transparent or white background, trimmed |
| Size | 16 to 22 mm tall, consistent and generous, never shrunk to fit |
| Eyes | small solid pure-black round dots only, no whites, no shines, no coloured irises |
| Never | a single cropped raster photo, a corner character tile, art over text, art over a tick target or a writing line |

Placement logic: read the page, find the white regions for that format (right
of short sentences, the left margin beside a word bank, the foot near the
ground wave), and drop the objects there. Position is set per unit in the
`decorations[]` array as `key`, `xMm`, `yMm`, `sizeMm`. The renderer must keep
every decoration clear of text, tick targets and writing lines.

---

## 6. Worked example: short versus long

The `s1.exampleLayout` field decides the layout. Set it per unit.

### Short example, `exampleLayout: "inline"`

Prompt, then a centred arrow, then the answer, on one line. The answer is in the
accent colour. The arrow has even space on both sides and is never crammed
against the answer.

```
the owl   →   the big brown owl
```

Used by tickgrid, build, circle and match.

### Long example, `exampleLayout: "stacked"`

A full sentence prompt with the corrected sentence below it. Prompt on line 1
in ink, corrected answer on line 2 in the accent colour. It must fit inside the
content width and never overflow.

```
I turn out my pockets and found my purse.
I turned out my pockets and found my purse.
```

Used by rewrite.

### Selection rule

If the rendered width of `prompt + arrow + answer` at 18 pt exceeds the usable
Watch-first width (198 mm minus 2 x 8 mm padding, so 182 mm), the renderer must
fall back to stacked even if the unit is marked inline. The rewrite unit is
always stacked. No worked example may ever overflow the page edge.

---

## 7. Per-format layout

All formats share the header, Watch-first box, instruction line, apply line and
footer above. Only the activity area differs.

### tickgrid (G-L6.1)

- Instruction: one line, for example "Tick the kind each sentence is".
- Column header row: the four category words at instruction role, no hint
  subtitles. Categories come from a fixed enum: Statement, Question, Command,
  Exclamation.
- Columns: a flexing sentence column on the left, then four fixed tick columns
  of 28 mm each (112 mm total). The sentence column takes the remaining 86 mm.
  Sentences in this format must stay short, which the L6 set does.
- Row: sentence (body role, left) and four tick boxes. Tick box is a 6 mm
  square, 1 mm corner radius, ink stroke 0.4 mm, centred in its column. Row
  height 16 mm. A faint hairline separator (level colour, 12 percent, 0.3 mm)
  sits between rows.
- Apply: one instruction line plus 3 ruled lines.

### build (G-L6.2)

- Instruction: one line, for example "Write each noun phrase again, grown
  bigger".
- Word bank: a tinted panel (level light), label "Choose a word" at instruction
  role in the level colour, then the adjective words at body role in a 4 by 2
  grid. No border on the panel, 6 mm corner radius.
- Row: a line-art object (16 to 20 mm), the base phrase (body role, for example
  "the glue"), a centred arrow, then one long black ruled line to write the
  grown phrase. Row height set so the line-to-line gap matches
  `--write-line-gap`.
- Apply: one instruction line plus 3 ruled lines.

### cloze (G-L6.3, G-L6.4)

- Instruction: one line, for example "Write the best joining word in each gap".
- Word bank: a tinted panel with the connective chips at body role, each in a
  soft rounded outline (level colour stroke, 1 mm radius, no fill).
- Row: a sentence at body role with one cloze gap. The cloze gap is a short
  tight underline, 26 mm long (fits the longest L6 connective written by hand),
  with exactly 3 mm of even space on each side. No large or odd gaps. One
  sentence per line, line-to-line gap `--write-line-gap`. The child writes in
  the gap, so there are no per-row ruled lines.
- Apply: one instruction line plus 3 ruled lines.

### circle (G-L6.5)

- Instruction: one line, "Circle the adjective. Underline the adverb."
- The marking convention is taught in the Watch-first box itself: the example
  sentence is shown with the adjective circled and the adverb underlined. There
  is no separate legend panel and no repeated hint text.
- Row: a sentence at body role. The child circles and underlines on the
  sentence, so there are no ruled lines between rows. Row-to-row gap
  `--write-line-gap`.
- Apply: one instruction line plus 3 ruled lines.

### match (G-L6.6)

- Instruction: one line, "Draw a line to join each pair to its short form".
- Two columns of chips. Left column holds the long forms in order. Right column
  holds the short forms in a shuffled order so the join is a real task. Each
  chip is a rounded outline (level colour stroke, no fill), body role, height
  14 mm. Left chips carry a connect dot on the right edge, right chips a connect
  dot on the left edge. Vertical gap between chips `--write-line-gap`.
- Apply: one instruction line plus 3 ruled lines.

### rewrite (G-L6.7)

- Instruction: one line, "Rewrite each one all in the past tense".
- Watch-first is the stacked long example (section 6).
- Row: the source sentence sits in a soft tinted strip (level light, no border,
  4 mm radius, body role). Below it are 2 plain black ruled lines for the
  rewrite, at `--write-line-gap`. Inter-row gap 5 mm.
- Apply: one instruction line plus 3 ruled lines.

---

## 8. Acceptance checks

A page passes only if every check is true.

Type and weight
- [ ] Every header title is 27 pt. Every instruction is 16 pt. Every body,
  sentence, example and word-bank word is 18 pt. The footer is 9 pt.
- [ ] No size other than the four roles appears on any worksheet page.
- [ ] No bold anywhere. Emphasis is colour and size only.

House style
- [ ] British English throughout. No em dashes. No Oxford commas. No emojis.

Writing lines
- [ ] Every writing line is a solid black ruled line. No three-zone handwriting
  guide and no dashed or faint guide line on any grammar sheet.
- [ ] The line-to-line gap is constant and equals `--write-line-gap` on every
  sheet, and the instruction-to-first-line gap equals the same number.

Cloze
- [ ] Every cloze gap is a 26 mm underline with 3 mm even space on each side.
  No large or odd gaps.

Tiny text
- [ ] No `Have a first look`. No column hint subtitles. No apply hint fragment.
  The apply task is one normal instruction line.

Imagery
- [ ] 2 to 3 line-art decorations per sheet, varied placement, never only the
  bottom-right corner, never a raster photo, never over text or a writing line.
- [ ] Every creature has small solid black round dot eyes only.

Worked example
- [ ] Short examples are inline with a centred arrow and even spacing. Long
  examples are stacked. No worked example overflows the content width.

Chrome
- [ ] The header is a full-bleed wavy band, level colour, white centred title
  only, no pills and no mascot tile.
- [ ] A faint ground wave sits at the foot. A round level-colour page badge
  sits bottom-right. The footer strapline is present.

Booklet
- [ ] The booklet has cover, contents, how-to, the seven units, a review and an
  answer key (12 pages, ending on Answers — no certificate page). It is never
  a bare concatenation of sheets.
- [ ] No motif band anywhere: the header wave and the foot ground wave carry
  the flowy identity on their own.

Decodability
- [ ] Every word on every sheet is decodable at L6 or a listed tricky word for
  L6 or earlier. Every sentence is 6 to 12 words.
