# Clipart — the owned word library

One file per word, named by `imageKey` from the book data, e.g. `tap.svg`,
`pin.svg`. Supported: `.svg` (preferred), `.png`, `.webp`, `.jpg`.

- **Consistency is the whole point.** Use ONE style across the whole library
  (this is how Twinkl/Education.com worksheets look cohesive). Never generate a
  fresh image per worksheet.
- A missing file renders a **dashed placeholder box** with the word, and
  `npm run validate` warns which words still need art — so the page never breaks.
- Seed from existing assets in the repo, e.g.
  `../../../myphonics_books/phonics-fun-hub/public/sounds/words/`.

Words needed for the first book (Tap! Tap! Tap!): `tap pin pan ant` (match sheet),
plus `sat tin nap sit` if you extend it.
