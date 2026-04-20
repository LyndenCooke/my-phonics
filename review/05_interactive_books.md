# Pass 5 — Interactive Books Deep Dive

## Executive summary

Interactive books are structurally rich and clearly the strongest “product moat” surface, but there are launch-critical consistency gaps between marketed promises and actual fallback behaviour, plus missing resilience for media/network failures.

---

## Full data flow mapping

## 1) Book definition source

- Book inventory comes from Supabase `books` table merged with local `BOOK_CATALOG` fallback.
- Mapping key for interactivity is `book.subLevel` (e.g., `L3.1`).
Sources: `src/hooks/useBooks.ts:10-43`, `src/pages/Index.tsx:42-73`, `src/lib/bookCatalog.ts:23-68`.

## 2) Interactive page rendering

- `Index` selects interactive vs static reader using `hasInteractiveData(subLevel)`.
- Interactive pages are loaded from `INTERACTIVE_BOOKS` map (`subLevel -> InteractivePage[]`).
Sources: `src/pages/Index.tsx:246-255`, `src/lib/interactiveBookData.ts:1960-1999`, `src/components/InteractiveBookReader.tsx:892-897`.

## 3) Audio triggers

- Word tap triggers phoneme-by-phoneme playback from `/sounds/{phoneme}.mp3`, then speech synthesis for blended word.
- Missing phoneme audio is swallowed (`catch {}`), so user may get silent degradation.
Sources: `src/components/interactive/TappableWord.tsx:16-19,229-255`.

## 4) User interactions

- Swipe, keyboard, nav buttons and page progress bar managed locally in component state.
Sources: `src/components/InteractiveBookReader.tsx:899-922,965-974`.

## 5) Progress tracking

- I did not verify active page progress writes to `user_books.last_page_read`; current reading appears session-local unless other hidden flows write completion.
Sources: `src/components/InteractiveBookReader.tsx:893-975`, `src/pages/Index.tsx:220-227`.

---

## Book type and level consistency

### Verified strengths
- All levels L1–L6 have entries in interactive map.
- Reader supports multiple pedagogical page types (`story`, `sound_grid`, `nonsense_words`, `quiz`, etc.).
Sources: `src/lib/interactiveBookData.ts:1960-1994`, `src/components/InteractiveBookReader.tsx:929-944`.

### Verified risk (P0)
- If interactive data does not exist for a selected title, app silently falls back to static JPG reader. This is functional, but contradicts broad “interactive” product messaging if not clearly labeled per book.
Source: `src/pages/Index.tsx:246-268`.

---

## Audio coverage audit

I ran a script to extract all phonemes referenced in interactive data files (`interactiveBookData*.ts`) and check for corresponding `/public/sounds/{phoneme}.mp3` files.

**Result (verified):**
- Required phoneme files: 36
- Missing phoneme files: 0

This is a strong result for baseline phoneme audio completeness.

**Caveat (P1):** sentence narration still depends on browser speech synthesis quality, not guaranteed uniform prerecorded assets.

---

## Illustration loading / optimization

### Verified observations
- Static and interactive pages rely heavily on image assets (`/book-pages`, `/illustrations`), and Vercel rewrites are configured for those paths.
Sources: `vercel.json:3-9`, `src/components/BookReader.tsx:38-40`, `src/pages/LandingPage.tsx:162,267`.

### Risks
- **P1:** little explicit in-UI recovery if key illustration fails in reader.
- **P2:** heavy image-first rendering could hurt weak-network mobile users without adaptive loading strategy.

---

## State management edge cases

### Refresh / back button / multiple tabs

- Reader state is in-memory `useState` and not URL-addressable; refreshing loses place.
- Multiple tabs do not share synchronized read state.
Sources: `src/components/InteractiveBookReader.tsx:893-899`, `src/components/BookReader.tsx:30-37`.

Severity:
- **P1** for persistence expectations (“pick up where left off” value proposition).

---

## Error-state review

### Image fails
- Static reader shows fallback only when page URL key invalid, not robustly for per-image load errors. `src/components/BookReader.tsx:140-153`.

### Audio fails
- Phoneme playback errors are suppressed in tap flow; parent/child gets no actionable feedback. `src/components/interactive/TappableWord.tsx:16-19`.

### Supabase timeout/failure
- Data hooks vary in error propagation and UI handling; some errors become thrown query errors, while others are silently absorbed (e.g., `useBooks` merge path). `src/hooks/useBooks.ts:10-43,53-59`.

Severity:
- **P1** overall for resilience and trust.

---

## Prioritised interactive-surface fixes

### P0
1. Align product promise with per-book capability (interactive badge/filters or remove overbroad claims).

### P1
1. Persist page progress (`last_page_read`) and completion writes from both reader modes.
2. Add explicit media error UI (retry, continue without audio).
3. Add low-bandwidth mode (reduced image quality / preload strategy).
4. Add resilience for speech-synthesis unavailability by optional pre-generated word/sentence audio fallback.

### P2
1. Reader deep-linking (`/library/:book/:page`) to improve resume/share/debug.
