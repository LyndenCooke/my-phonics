# grammar_level_content_template.md

Use this to build any level's grammar booklet in the same shape as L6. Keep the
flowy spec and the schema fixed across all levels. Only the content below
changes per level. Fill every placeholder, then run the acceptance checks in
`grammar_layout_spec.md` section 8.

---

## What changes per level

| Field | Source | L6 example |
| --- | --- | --- |
| level number | the scheme | 6 |
| levelLabel | the scheme | Building Fluency |
| level colour | `getLevelTheme(level)` | Indigo `#6366F1` |
| anchorBooks | the four level readers | Purple Purse, Brown Owl, New Glue, Cheeky Monkey |
| soundsRevisited | the GPCs taught at this level | ur, er, are, ow, ew, ue |
| sentence band | the scheme | 6 to 12 words |
| grammar focus per unit | `docs/grammar_scheme_of_work.md` | see the seven domains |
| number of units | the scheme for that level | 7 |
| decoration keys | that level's book world | owl, purse, glue, branch |
| apply prompts | phrased to that level's books | "a command about the owl" |

What does not change: the four-role type scale, the writing-line gap token, the
imagery rule, the short-versus-long example rule, the per-format layouts, the
booklet assembly, the house style.

---

## Level header skeleton

```
level: <n>
levelLabel: <name>            # Ditties, First Sounds, Special Friends, Longer
                              # Sounds, New Spellings, Building Fluency, Reading
                              # Together, Reading Champion
colour: getLevelTheme(<n>)
anchorBooks: [<book1>, <book2>, <book3>, <book4>]
soundsRevisited: [<gpc>, <gpc>, ...]
sentenceBand: <min> to <max> words
unitCount: <n>
```

The five spiralling domains from the scheme of work, picked at the right
difficulty for the level: word structure and word classes; sentence structure;
text and cohesion; punctuation; statutory terminology. Each level draws its
units from these domains at its own band.

---

## Per-unit skeleton

```
code: G-L<n>.<k>
name: <header title, 6 words or fewer>
format: tickgrid | build | cloze | circle | match | rewrite
objective: <one line, what the child can do>
ncLink: <the National Curriculum point for this level>
terminology: [<statutory terms to name>]
anchorBook: <which level book this unit ties to>
soundsRevisited: <the level sounds these sentences reuse>

s1 (Watch first):
  exampleLayout: inline | stacked     # stacked only for a full-sentence rewrite
  prompt: <prompt>
  answer: <answer>
  note: <optional terminology line, normal size, only if a term must be named>

doInstruction: <one line, warm, child-facing>
wordBank: [<words>]                    # build and cloze only

rows:
  - { text: <sentence or phrase>, answer: <answer> }
  - ...                                # 4 to 6 rows

apply: "Now you write <one task tied to the level books>."

decorations:                           # 2 to 3, varied placement, white space
  - { key: <object>, position: top-right,  xMm: 178, yMm: 48,  sizeMm: 20 }
  - { key: <object>, position: mid-left,    xMm: 4,   yMm: 160, sizeMm: 18 }
  - { key: <object>, position: foot-right,  xMm: 182, yMm: 266, sizeMm: 16 }
```

---

## Per-unit rules to check while filling

- Every word is decodable at this level or a listed tricky word for this level
  or earlier. Do not write a word that needs a later GPC.
- Every sentence sits in the level sentence band.
- The Watch first example uses the same skill as the rows, and ties to a level
  book.
- The apply task is one normal line. No appended hint.
- Set `exampleLayout: stacked` only when the example is a full-sentence rewrite.
  Everything else is inline.
- Decoration keys come from this level's book world, placed in genuine white
  space, varied per sheet, never always the corner. Dot eyes only.
- Lower levels use shorter sentences, fewer rows and simpler terminology. A
  Ditties (L1) tickgrid might sort only statement and question, with 4 rows of
  3 to 5 word sentences.

---

## Booklet front and back matter per level

Reuse the L6 copy, swapping the level number, label and the subtitle skill list.

- Cover wordmark "Grammar", subtitle "Level <n> · <label>", a line-art cluster
  from the level books, "Worksheet Pack", and a four-item skill subtitle.
- Contents auto-generated from the assembler.
- How this pack works: the same I do, We do, You do copy and the same closing
  line. Swap the level number in the decodable line.
- Review: reuse approved sentences from this level's own units. Do not invent
  new decodable text; the level author writes any new book or decodable text.
- Answers: one heading per unit in the accent colour, answers below.
- Certificate: "Well done!", a name line, "has finished the Level <n> Grammar
  pack", and a skill summary line.
