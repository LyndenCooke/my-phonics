# Interactive Book Designer

## Purpose
Design and build interactive digital book experiences for MyPhonicsBooks. The prototype renders phonics books as interactive apps with tappable words, tracing, and activities — NOT as PDF viewers.

## Critical Design Rules

### 1. Use REAL Illustrations, Never PDF Screenshots
- Story illustrations live in `/public/illustrations/{level}_{book}/page{N}.png` (square, no text overlay)
- These are the raw AI-generated illustrations — square format, no page numbers, no baked-in text
- PDF page images (`/book-pages/`) are NEVER used — they have text baked in and page numbers
- The cover illustration is `cover.png` in the same folder
- If an illustration doesn't exist, show a coloured placeholder — never fall back to PDF screenshots

### 2. Font: Andika Everywhere
- ALL text in the interactive reader MUST use the Andika font
- Apply `font-family: 'Andika', sans-serif` to the root container
- This is a phonics-optimised font: clear letter shapes, no ambiguous glyphs (a vs. α)
- Already loaded via Google Fonts in `index.html`
- Use the existing `.font-child` CSS class OR set font-family directly

### 3. Story Page Layout (Landscape Desktop)
```
┌──────────────────────────────────────────────────┐
│  ┌─────────────┐                                 │
│  │             │                                 │
│  │  SQUARE     │    I sit at a mat.              │
│  │  IMAGE      │    Tap, tap, tap!               │
│  │  rounded    │                                 │
│  │  corners    │    [Read to me]                 │
│  │             │                                 │
│  └─────────────┘                                 │
└──────────────────────────────────────────────────┘
```
- Image: Square aspect ratio, displayed in a rounded-corner container on the LEFT
- Image does NOT stretch full-height — it sits centered with padding/margin
- Text: RIGHT side, vertically centered, LARGE (3xl-4xl for words)
- Text area has warm background (amber-50)
- "Read to me" button at bottom of text area
- On mobile: image on top (smaller), text below (still large)

### 4. Story Page Text Sizing
- Story words: `text-3xl md:text-4xl` minimum — children need to read these
- Phoneme breakdown circles: `w-10 h-10 text-base` — large enough to tap
- "Read to me" button: full width, prominent
- All interactive text uses Andika

### 5. Sound Spotlight Pages
- Use actual illustrations or clear, large emoji as visual aids
- The big letter button: massive (w-32 h-32 or larger)
- Word cards: large text (2xl+), plenty of tap target area
- If we have actual spotlight images in future, use them instead of emoji

### 6. No PDF/Parent Content
- NO "Guide for Grown-Ups" pages
- NO "Notes for Grown-Ups" pages
- NO back cover image pages
- NO `image_page` type at all — every page is interactive
- The book flow: Cover → Sounds → Story → Activities → Certificate

### 7. Activities
- **Writing Practice**: Canvas clears when switching letters (use React `key` prop to force remount)
- **Story Ordering**: 6 boxes with story images, drag or tap-to-swap, shows success state
- **Drawing Canvas**: Colour picker + clear button
- **Nonsense Words**: Grid of alien words with phoneme breakdown
- **Word Reading**: Large tappable word cards

### 8. Image Path Convention
For book `L{level}.{number}`:
- Illustrations: `/illustrations/{level}_{number}/page{1-6}.png`
- Cover: `/illustrations/{level}_{number}/cover.png`
- Source files: `myphonics_books/output/images/L{level}_{number}_B1/*.png`

### 9. Page Data Structure
Each book's interactive data lives in `src/lib/interactiveBookData.ts`. Story pages reference illustration URLs (NOT PDF page URLs). The `imageUrl` field should always point to `/illustrations/` not `/book-pages/`.

## Files
- `src/components/InteractiveBookReader.tsx` — Main reader component
- `src/components/interactive/TappableWord.tsx` — Tappable word with phoneme breakdown
- `src/lib/interactiveBookData.ts` — Page data and types
- `src/pages/Prototype.tsx` — Standalone demo route at `/prototype`
