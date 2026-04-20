# Interactive Book Converter

## Purpose
Convert any completed PDF book into an interactive digital experience. This workflow takes an existing book's story data, illustrations, and audio — and produces the `interactiveBookData.ts` entry + generates all required audio files.

## Prerequisites
- Book must be fully produced (story text, illustrations, PDF exists)
- Story data available in `data/story_summaries.json` or the book's story JSON
- Illustrations in `output/images/L{level}_{number}_B1/` (cover.png, page1-6.png)
- ElevenLabs API key in `phonics-fun-hub/.env`
- Python venv at `venv/` with `requests` installed

## Workflow Steps

### Step 1: Gather Book Data
Read the book's story data to extract:
- **Book ID**: e.g. `L1.2` (level.number)
- **Title**: e.g. "Sit, Sam, Sit!"
- **Focus sounds**: from `data/graphemes_by_level.json`
- **Story text**: sentences per page, word-by-word with phoneme breakdowns
- **Tricky words**: used in the story
- **Level**: determines which activities to include

Source files:
```
data/story_summaries.json          # Story text and metadata
data/graphemes_by_level.json       # Focus sounds per level
output/images/L{l}_{n}_B1/*.png    # Illustrations
```

### Step 2: Copy Illustrations
```bash
mkdir -p public/illustrations/{level}_{number}/
cp output/images/L{level}_{number}_B1/*.png public/illustrations/{level}_{number}/
```
- cover.png → cover image
- page1.png through page6.png → story illustrations
- Verify images are square, no text overlay

### Step 3: Generate Sentence Audio
Run the sentence audio generator for this book:
```bash
cd myphonics_books
venv/Scripts/python.exe scripts/generate_sentence_audio.py
```
Update the SENTENCES dict in the script first with the new book's sentences:
```python
SENTENCES = {
    'L{l}_{n}_p1': 'First page text here...',
    'L{l}_{n}_p2': 'Second page text...',
    # ... one per story page
}
```
Audio settings:
- Model: `eleven_multilingual_v2`
- Voice: George (JBFqnCBsd6RMkjVDRZzb)
- Stability: 0.55, similarity: 0.80, style: 0.15
- Add `...` after `. `, `? `, `! ` for natural pauses
- Output: `public/sounds/sentences/L{l}_{n}_p{page}.mp3`

### Step 4: Generate Missing Word Audio
Check which story words + spotlight words are missing from `/public/sounds/words/`:
```python
# For each word in the book that doesn't have an mp3:
# Generate with ElevenLabs George voice, eleven_turbo_v2_5 model
# Output: public/sounds/words/{word}.mp3
```

### Step 5: Build Interactive Page Data
Add a new entry to `src/lib/interactiveBookData.ts`:

**Page order** (pedagogically correct — RWI "speed sounds" then "read" then "activities"):
1. **Cover** — title, subtitle, cover illustration
2. **Sound grid + Story words** — focus sounds ONLY + tappable story words (pre-reading practice)
3. **Story pages** (6 pages) — read the story with illustrations
4. **Comprehension quiz** — while story is fresh (3 inference questions)
5. **Sound spotlights** — one per focus sound, 4 example words each
6. **Word reading** — 4 story words to read independently
7. **Tricky words** — the tricky words used in this story
8. **Spelling** — 4 words with letter tiles + distractors
9. **Alien/nonsense words** — 12 CVC words using focus sounds
10. **Writing practice** — focus sound letters to trace
11. **Story ordering** — 6 story images to put in sequence
12. **Drawing** — "Draw Your Favourite Part"
13. **Certificate** — celebration with book title

**Data structure per story page:**
```typescript
{
  type: 'story',
  sentences: ['Sentence one.', 'Sentence two.'],  // Natural sentence breaks
  words: [
    tricky('I', 'I'),           // Tricky words
    cvc('sit', 'sit'),          // CVC words auto-split phonemes
    { display: 'at', word: 'at', phonemes: ['a','t'] },  // Custom phonemes
  ],
  imageUrl: '/illustrations/{l}_{n}/page{X}.png',
  audioUrl: '/sounds/sentences/L{l}_{n}_p{X}.mp3',
}
```

**Quiz questions should test:**
1. Character/setting recall (who/what/where)
2. Plot comprehension (what happened)
3. Inference (why/how)

**Spelling words:** Pick 4 CVC words from the story. Add 2 distractor letters.

**Alien words:** Generate 12 nonsense CVC words using ONLY the focus sounds.

### Step 6: Register the Book
Add to the `INTERACTIVE_BOOKS` map:
```typescript
export const INTERACTIVE_BOOKS: Record<string, InteractivePage[]> = {
  'L1.1': BOOK_L1_1_PAGES,
  'L1.2': BOOK_L1_2_PAGES,  // new
};
```

### Step 7: Verify
- Start dev server, navigate to `/prototype`
- Check every page type renders correctly
- Test "Read to me" plays George voice with word highlighting
- Test tapping individual words plays correct audio
- Test all activities (quiz, spelling, ordering) work
- Check mobile layout (portrait stacking)

## Level-Specific Rules

### L1 (s,a,t,p,i,n → Set 1)
- Sound grid: only 6 focus sounds
- All words should be CVC
- Simple comprehension questions
- No dialogue in stories

### L2 (digraphs: sh, ch, th, ng, nk, etc.)
- Sound grid: Set 1 + Set 2 focus sounds
- Include digraph words in spotlight
- Phoneme breakdowns include digraphs: `['sh','i','p']`

### L3 (consonant clusters: bl, cr, st, etc.)
- Include cluster words: `['s','t','r','i','p']`
- More complex spelling with 4-5 letter words

### L4+ (long vowels, split digraphs)
- Add dialogue awareness
- More inference-heavy quiz questions
- Spotlight pages for complex graphemes (a_e, igh, etc.)

## File Locations
- **Component**: `src/components/InteractiveBookReader.tsx`
- **Data**: `src/lib/interactiveBookData.ts`
- **Illustrations**: `public/illustrations/{level}_{number}/`
- **Sentence audio**: `public/sounds/sentences/`
- **Word audio**: `public/sounds/words/`
- **Phoneme audio**: `public/sounds/`
- **Audio gen script**: `myphonics_books/scripts/generate_sentence_audio.py`
- **Skill doc**: `myphonics_books/.claude/skills/interactive-book-designer.md`
