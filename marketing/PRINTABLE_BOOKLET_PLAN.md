# Printable Marketing Booklets — Plan

A free, printed decodable book from each level, given to parents, libraries and schools. It reads as a genuine book, not a flyer. The selling is concentrated at the back, with one subtle, genuinely useful touch in the middle: a "find your level" page. A parent or librarian should be able to hand it to a child and have a real reading experience, then discover the rest of the offer at the end.

## Guiding principle: real book first, marketing at the back

- The body stays a real book. Same covers, same story, same activities. Nothing about the first two-thirds should feel like an advert.
- The only mid-book change is swapping the handwriting page for a "find your child's level" page. That earns its place because it is useful, not salesy.
- The marketing lives in a clear cluster at the back: inside back cover, back cover and a bound leaflet section. This is the part that can lean harder.
- This split is what makes it library-safe. Libraries accept good free children's books and bin obvious marketing. Keep the front honest and the back will be forgiven.

## Source material

These are your normal A5 PDF books, one chosen per level, not a separate edition. Pick the strongest, most engaging book at each level; where two are close, choose the more visually distinctive setting so the "children see themselves" point shows on the shelf. Covers already exist at `marketing/leaflet/assets/cover_L1.png` through `cover_L8.png`.

---

## Page-by-page layout (recommended: 20 pages, A5, saddle-stitched)

Keeps the entire real book intact, swaps only the handwriting page, then appends a 4-page marketing and leaflet section at the back. Saddle-stitching needs a multiple of four, so 20 works cleanly.

| Page | Content | Change from standard book |
|---|---|---|
| 1 | Front cover: level colour, sounds row, illustration, title | Unchanged. Reads as a real book. |
| 2 | Guide for Grown-Ups | Keep. Add one quiet line: "Not sure this is the right level? Find out free in 3 minutes" with the level colour, nothing loud. |
| 3 | Combined Reference: phonics chart, story words, tricky words | Unchanged |
| 4 to 11 | The story (8 pages) | Unchanged. The real reading experience. |
| 12 | Combined Activity: questions, read words, draw | Unchanged |
| 13 | **Find Your Child's Reading Level** + QR | **Swapped in** for the Writing Practice / handwriting page |
| 14 | Nonsense Words Challenge | Keep. It is a real part of the book and quietly reinforces "they decode, not guess" |
| 15 | Reading Star Certificate | Keep. Gift-like, makes the free book feel generous |
| 16 | Back cover of the book block | Light: title, level band, "Read the whole level at myphonicsbooks.com" |
| 17 | Leaflet / marketing — what it is, the level ladder | Bound-in leaflet section begins |
| 18 | Leaflet / marketing — testimonials | The social proof page |
| 19 | Leaflet / marketing — how it works, free assessment, offer | Heavier marketing allowed here |
| 20 | **Outer back cover**: colour bands top and bottom, marketing in the middle, big QR to assessment | Your main marketing surface |

If print budget is tight, a 16-page version works too: drop the certificate (p15) and fold the leaflet into pages 15 and 16 only. You lose two marketing pages and the gift feel, but save a sheet per booklet. Recommended only at very high volumes.

---

## The "Find Your Level" page (p13)

This replaces handwriting and does double duty: genuinely useful to the parent, and the bridge to the digital funnel. Pull the content straight from `MyPhonicsBooks_Assessment_Sheet.xlsx`, which already has, per level: Sounds, Real Words, Alien Words, Tricky Words.

Layout:

- **Title:** "Is this the right level for your child?"
- **A short check for this level only**, four quick rows lifted from the assessment sheet: say these sounds, read these real words, decode these alien words, read these tricky words.
- **A simple scoring rule:** comfortable with most of these means this level fits; struggling means try a level down; flying means try a level up.
- **The QR / barcode:** "For the exact level in 3 minutes, scan here." Goes straight to the digital adaptive assessment.
- **Tone:** a helpful teacher, not a sales page. This page is why the booklet doesn't feel like a ploy.

**Dependency to resolve first:** the assessment sheet is still built on the old 6 levels, while the booklets are 8 levels. The per-level items need remapping to the 8-level ledger before this page can be generated for all eight books. This is a content job, not a print job, and it blocks p13.

---

## The back marketing cluster (p17 to p20)

- **p20 outer back cover:** colour band across the top and the bottom in the level colour, marketing message in the middle, and the large QR to the free assessment. This is the page a librarian or parent sees face-up on a table, so it carries the main call to action.
- **p19:** how it works in three steps, the free assessment and the current offer.
- **p18:** testimonials. Three or four short parent quotes. If you don't have written ones yet, this page is the reason to collect them this week, even two strong lines each.
- **p17:** what MyPhonicsBooks is and the full 8-level ladder, so they see the journey beyond this one book.

The existing leaflet (`marketing/leaflet/leaflet.html`) already has the front and back artwork and the colour-band system. It becomes pages 17 to 20 rather than a separate insert, so the whole thing is one printed object.

---

## Print-run weighting

Weight heavily toward the early levels. A child placed at L1 or L2 has the whole journey, and the whole subscription life, ahead of them. A child reading at L7 or L8 is nearly fluent and will not be a customer for long, so printing many of those wastes budget.

| Level | Name | Share of run | Per 500 | Per 1,000 |
|---|---|---|---|---|
| L1 | Ditties | 26% | 130 | 260 |
| L2 | First Sounds | 21% | 105 | 210 |
| L3 | Special Friends | 16% | 80 | 160 |
| L4 | Longer Sounds | 12% | 60 | 120 |
| L5 | New Spellings | 9% | 45 | 90 |
| L6 | Building Fluency | 7% | 35 | 70 |
| L7 | Reading Together | 5% | 25 | 50 |
| L8 | Reading Champion | 4% | 20 | 40 |

For a first run, consider printing only L1 to L5 and keeping L6 to L8 as QR-only or print-on-demand. Most of your true beginners, and your best long-term customers, sit in the first few levels.

---

## Tracking which booklets actually work

Give each level its own QR so you can see which booklet drives signups, using your existing analytics.

- Point each QR at the assessment with a source tag, for example `myphonicsbooks.com/assessment?src=booklet_L1`.
- Add a channel tag too if useful, for example `&via=library` or `&via=event`, so you can tell a library pickup from a school handout.
- This ties straight into the Google Analytics you already run and tells you, level by level and channel by channel, what to reprint.

---

## Production specs

- **Size:** A5, 148 by 210 mm, matching the books and the leaflet.
- **Pages:** 20, saddle-stitched (multiple of four).
- **Stock:** cover 250 to 300 gsm, inside 120 to 150 gsm. Heavier inside than a flyer, so it feels like a book.
- **Bleed:** 3 mm all round; keep text 5 mm inside the trim.
- **Colour:** full colour throughout. The covers and level bands carry the brand, so do not skimp to mono.
- **The "barcode":** this is the QR to the assessment, not a retail ISBN barcode. No ISBN needed for free giveaways. If a library asks for one later, that is a separate step.

---

## What you already have vs what's to build

**Have:**
- The real books and covers per level (the PDF pipeline)
- The leaflet artwork and colour-band system (`marketing/leaflet/`)
- The assessment item content (`MyPhonicsBooks_Assessment_Sheet.xlsx`)
- A site QR asset (`marketing/leaflet/assets/qr_site.png`)

**To build:**
1. Remap the assessment items from 6 levels to the 8-level ledger (blocks the p13 page).
2. Design the p13 "Find Your Level" page template.
3. Generate 8 per-level QR codes with source tags.
4. Lay out the back cluster (p17 to p20) from the existing leaflet.
5. Collect three or four short testimonials for p18.
6. Assemble the 20-page print PDF per level and weight the print run.

---

## Suggested next step

Decide on the 20-page versus 16-page build and confirm the print-run weighting. Then the fastest unblock is the assessment remap, since it gates the one page that makes this a lead generator rather than just a nice free book.
