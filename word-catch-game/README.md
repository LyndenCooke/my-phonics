# Word Catch! - a MyPhonicsBooks 2D phonics game

Tab the cat catches falling sound-bubbles to build real decodable words from the
MyPhonicsBooks Letters and Sounds progression. Ages 4-8. Plain JS + Canvas 2D,
no build step, no external requests.

## What is in here

```
word-catch-game/
├── index.html        game page (DOM overlays: menu, level map, round end, pause)
├── game.js           game logic + rendering (fixed-timestep canvas loop)
├── strings.js        every player-visible string (swap for localisation)
├── logic.js          solo stub required by the Higgsfield game platform
├── design/
│   ├── assets.csv    asset manifest (what each asset is and where it came from)
│   ├── thumbnail.png 16:9 marketplace cover (title baked in)
│   └── favicon.png   1:1 catalog icon
└── assets/
    ├── words.js      120 decodable words in 6 levels, generated from
    │                 myphonics_books/data word banks + graphemes_by_level.json
    ├── sounds/       48 recorded phoneme mp3s (copied from public/sounds/)
    ├── img/          keyed sprites from the book clipart + brand wordmark
    └── fonts/        Andika (the book typeface)
```

All art is the real book artwork (Tap! Tap! Tap! cat and boy, The Mud on the Dog
retriever, hen, fox, goldfish tank) keyed to transparency. Phoneme audio is the
real ElevenLabs recordings. Full words are spoken with the browser's speech
synthesis (en-GB voice preferred). Music and SFX are synthesised with WebAudio,
so the game makes no network requests at all.

## Play it

- Live on the website: it is also copied to `public/word-catch/`, so the deployed
  site serves it at `/word-catch/`.
- Locally: `python3 -m http.server` in this folder, open `/index.html`.
  Append `?dev=1` for the FPS overlay and the `window.__WC` debug hook.

Controls: arrows / A-D or mouse / touch drag to move, Space / tap to pounce,
P or Esc pause, M mute. Gamepad supported (stick + A button).

## Regenerating data and art

- `scratchpad build_words.py` (session script) rebuilt `assets/words.js`:
  greedy longest-match grapheme segmentation (split digraphs a-e/i-e/o-e/u-e
  handled) over the level word banks; only words whose every grapheme has a
  recorded mp3 are used.
- Sprites were keyed from `public/clipart/` with an edge flood-fill.

## Deploying to the Higgsfield games marketplace (optional)

The folder already matches the platform's required zip layout:

1. `zip -r word-catch.zip index.html logic.js game.js strings.js assets design/assets.csv`
2. Upload the zip with the Higgsfield `media_upload` tool, PUT the bytes,
   confirm with `media_confirm` (type `file`).
3. Upload `design/thumbnail.png` and `design/favicon.png` the same way.
4. Call `deploy_game` with title "Word Catch! - MyPhonicsBooks", the two image
   URLs and the zip URL. Save the returned `game_id` for future updates.
