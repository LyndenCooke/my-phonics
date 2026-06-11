# grammar_schema_changes.md

The deltas to `src/data/grammarSchema.ts` (v2 to v3) and the registry needed to
support the spec. Keep all existing v2 fields. Add the following.

---

## 1. Worked-example length

Add to the `s1` object:

```ts
exampleLayout: "inline" | "stacked"   // required; rewrite uses "stacked"
```

`note?` already exists. Redefine its role: it is the optional terminology line,
rendered at instruction size in ink inside the Watch-first box. It is never
small and never grey. Use it only when a statutory term must be named (for
example the exclamation rule in G-L6.1).

---

## 2. Apply line is one full sentence

`apply.prompt` already exists. Require it to hold the complete sentence, for
example "Now you write a command about the owl." The renderer prints it as one
instruction-role line. Remove any `apply.hint` or label-plus-fragment path that
produced the small grey tail.

Add:

```ts
apply: {
  prompt: string;
  lines?: number;     // ruled lines under the apply prompt, default 3
}
```

---

## 3. Decoration layer

`decorations[]` already carries `xMm`, `yMm`, `sizeMm`. Add:

```ts
decorations: Array<{
  key: string;        // line-art asset id: owl, owlets, branch, leaf, moon,
                      // purse, glue, cup, cat, bird, card, rug, monkey
  xMm: number;
  yMm: number;
  sizeMm: number;     // 16 to 22
  rotationDeg?: number;
}>
```

Validation: 2 to 3 entries per unit. The renderer keeps each clear of text, tick
targets and writing lines. Assets are flat line-art, dot eyes only.

---

## 4. Per-format row writing lines

Most formats derive their line count from the format. Where a row carries its
own lines, make it explicit so the renderer does not guess:

```ts
// build payload
rowWriteLines: 1     // one long ruled line per row, after the arrow

// rewrite payload
rowWriteLines: 2     // two ruled lines per row, below the source strip
```

tickgrid, cloze, circle and match have no per-row lines; the child writes in the
grid, the gap, on the sentence, or draws the join.

---

## 5. tickgrid categories without hints

The category header is a fixed enum, no hint subtitles:

```ts
// tickgrid payload
categories: ["Statement", "Question", "Command", "Exclamation"]
rows: Array<{ text: string; answer: "Statement" | "Question" | "Command" | "Exclamation" }>
```

Remove any `hint` subfield from the column or category type.

---

## 6. cloze gap is layout-driven

The cloze payload marks the gap position only, no inline hint:

```ts
// cloze payload
rows: Array<{ before: string; after: string; answer: string }>
```

The renderer draws the fixed 26 mm underline with 3 mm even padding between
`before` and `after`.

---

## 7. Booklet-level meta and the review format

Front and back matter are data-driven by a booklet-level object, not hard-coded
in the route:

```ts
bookletMeta: {
  level: number;
  levelLabel: string;          // Building Fluency
  coverSkills: string[];       // ["sentences", "noun phrases", "joining words", "tense"]
  howTo: Array<{ title: string; body: string }>;   // I do, We do, You do
  howToClosing: string;        // "Say it. Tap it. Write it. Check it."
  reviewUnitId: string;        // the review unit code
  certificate: {
    headline: string;          // "Well done!"
    line: string;              // "has finished the Level 6 Grammar pack"
    summary: string;           // skill summary line
  };
}
```

Add a new format to the format union and to `FlowySheet.tsx` dispatch:

```ts
format: "tickgrid" | "build" | "cloze" | "circle" | "match" | "rewrite" | "review"
```

The `review` payload reuses items from existing units, so it references unit
codes plus the chosen row rather than carrying new sentences:

```ts
// review payload
items: Array<{
  sourceUnit: string;          // G-L6.1 ...
  task: string;                // short label, e.g. "Tick the kind"
  rowRef: string | number;     // which approved row to reuse
  answer: string;
}>
```

This keeps the no-invent rule intact: the review carries no new decodable text,
only pointers to approved rows.

---

## 8. Layout tokens (not data, but record them)

These live on the page root in `FlowyLayout.tsx`, set once, used everywhere:

```css
--type-title: 27pt;
--type-instruction: 16pt;
--type-body: 18pt;
--type-footer: 9pt;
--type-display: 44pt;        /* cover and certificate only */
--write-line-gap: 9mm;       /* the rewrite-sheet target; one number */
--cloze-gap-width: 26mm;
--cloze-gap-pad: 3mm;
```

Registry note: `grammarRegistry.ts` should list the units in page order and
expose `bookletMeta` so the assembler can emit cover, contents, how-to, the
units, the review, the answers and the certificate without the route holding
any copy.
