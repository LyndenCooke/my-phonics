# Pass 3 — Asset existence sweep

Scanned directories: ['src', 'supabase\\functions']

Public root: `public`

## Summary

- Static asset references found: **822**
- Present in ./public: **809**
- Missing: **13**
- Phonemes referenced in interactiveBookData: **36**
- Phonemes missing audio: **0**
- Book covers referenced: **0**
- Book covers missing: **0**

## Missing static assets

### `/book-pages/${key}/p${index + 1}.jpg`
- referenced by `src\components\BookReader.tsx`

### `/book-pages/${key}/p${pageNumber}.jpg`
- referenced by `src\lib\imageResolver.ts`

### `/covers/${c.sub_level.replace(/^L/, `
- referenced by `src\hooks\useBooks.ts`

### `/covers/${firstBook.sub_level.replace(/^L/, `
- referenced by `src\pages\Assessment.tsx`

### `/covers/${key}_cover.jpg`
- referenced by `src\lib\imageResolver.ts`
- referenced by `src\pages\Showcase.tsx`

### `/covers/${sub.replace(/^L/, `
- referenced by `src\pages\Index.tsx`

### `/illustrations/${b.key}/cover.png`
- referenced by `src\pages\LandingPage.tsx`

### `/illustrations/${book.subLevel.replace(`
- referenced by `src\pages\Prototype.tsx`

### `/illustrations/${c.key}/cover.png`
- referenced by `src\pages\LandingPage.tsx`

### `/images/words/${w.word}.png`
- referenced by `src\components\InteractiveBookReader.tsx`

### `/sounds/${g.toLowerCase().replace(/-/g, `
- referenced by `src\components\InteractiveBookReader.tsx`

### `/sounds/${key}.mp3`
- referenced by `src\components\PhonemePlayer.tsx`
- referenced by `src\components\interactive\TappableWord.tsx`

### `/sounds/words/${key}.mp3`
- referenced by `src\components\WordPlayer.tsx`

## Missing phoneme audio

_None — all phonemes have a matching `.mp3`._

## Missing book covers

_None — every book cover resolves._

## Dynamic template references (not auto-verified)

These references use template literals so the exact path is computed at runtime. The asset existence can't be checked statically; rely on Pass 2 runtime reader walk for coverage.

- `/book-pages/${key}/p${index + 1}.jpg` in `src\components\BookReader.tsx`
- `/sounds/${g.toLowerCase().replace(/-/g, '_')}.mp3` in `src\components\InteractiveBookReader.tsx`
- `/images/words/${w.word}.png` in `src\components\InteractiveBookReader.tsx`
- `/sounds/${key}.mp3` in `src\components\PhonemePlayer.tsx`
- `/sounds/words/${key}.mp3` in `src\components\WordPlayer.tsx`
- `/covers/${c.sub_level.replace(/^L/, '').replace('.', '_')}_cover.jpg` in `src\hooks\useBooks.ts`
- `/covers/${key}_cover.jpg` in `src\lib\imageResolver.ts`
- `/book-pages/${key}/p${pageNumber}.jpg` in `src\lib\imageResolver.ts`
- `/covers/${firstBook.sub_level.replace(/^L/, '').replace('.', '_')}_cover.jpg` in `src\pages\Assessment.tsx`
- `/covers/${sub.replace(/^L/, '').replace('.', '_')}_cover.jpg` in `src\pages\Index.tsx`
- `/illustrations/${b.key}/cover.png` in `src\pages\LandingPage.tsx`
- `/illustrations/${c.key}/cover.png` in `src\pages\LandingPage.tsx`
- `/illustrations/${book.subLevel.replace('L','').replace('.','_')}/cover.png` in `src\pages\Prototype.tsx`
- `/covers/${key}_cover.jpg` in `src\pages\Showcase.tsx`
- `/sounds/${key}.mp3` in `src\components\interactive\TappableWord.tsx`
