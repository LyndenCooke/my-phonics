# SOUNDLINGS — Design Brief v1.0

**Replaces:** SoundGame ("What sound is it?") as the flagship child-facing game.
**Goal:** a game children open *by choice*, not because a grown-up said so.
**Benchmark:** Teach Your Monster to Read (BAFTA winner). Their hook: the phonics feeds a creature who needs you. Ours will be stronger because our creatures ARE the sounds.

---

## 1. Title and pitch

**SOUNDLINGS** — *Every sound is a little creature. Hatch them all.*

Every grapheme the child will ever learn (82 across the 8-level journey) is a
Soundling: a small creature whose body/markings visually echo its letters.
Finding a Soundling's sound inside real words feeds it. Fed enough, an egg
hatches; hatched, it grows; grown, it turns golden. The collection is
permanent — the child owns it, and it is always waiting for them.

Why this wins the "come back freely" battle: a quiz forgets you; a pet misses
you. The strongest return loop in children's games is a creature with a
persistent state that only the child can advance (Pokémon, Tamagotchi, Toca).

---

## 2. Pedagogy (unchanged, non-negotiable)

- Core skill: **grapheme recognition inside real decodable words** — exactly
  what `buildRounds()` in `src/lib/soundGameWords.ts` already does. We reuse
  that engine verbatim: word from the child's level, 3 grapheme options,
  distractors from the same level, never a distractor that also appears in
  the word.
- No penalty for wrong answers. Wrong = the Soundling looks puzzled and the
  child tries again. First-try correct = full feed; second-try = half feed.
  No child ever loses progress.
- The only formal gate in the app remains the Level Check. Soundlings is
  practice with ownership, never assessment.
- Child-facing copy never uses adult terms (assessment, decoding, mastery).

---

## 3. Core loop (second to second)

A session is a **Visit** to the child's current level habitat.

1. Habitat opens. The child's Soundlings from this level are on screen —
   hatched ones wander/idle, eggs sit in nests, one egg is **glowing**
   (today's featured egg — see return hooks).
2. Child taps any Soundling or egg → that grapheme becomes the target.
   (Or taps the big **PLAY** paw button → game picks, favouring the
   least-fed Soundlings.)
3. An encounter: a word card appears ("Tap the sound hiding in… **moon**"),
   speaker button says the word in the **George voice** (`/sounds/words/*.mp3`,
   existing pipeline), three grapheme stones below.
4. Correct → the grapheme **lights up inside the word** (the teach moment,
   kept from SoundGame), a berry flies to the Soundling, it munches with a
   pop + sparkle, feed meter ticks up. 950ms, auto-advance.
5. Every 5 encounters → back to the habitat to see growth: meter fills,
   egg cracks, hatch cinematic, confetti. Then "Keep playing?" / "All done".

**Controls:** tap/click only. Touch-first (phone/tablet), mouse (desktop),
and finger-tap on 1920×1080 classroom whiteboards — full-screen layout,
no `max-w-sm/md` anywhere, targets ≥ 88px on whiteboard.

**Growth ladder per Soundling** (feeds = first-try correct encounters):
| State | Feeds | Visual |
|---|---|---|
| Egg | 0–2 | Egg in level colour, grapheme faintly on shell |
| Hatched | 3 | Baby creature, big dot eyes |
| Grown | 10 | Full creature, accessory appears |
| Golden | 25 | Golden shimmer variant + star on album card |

**Modes:**
- **Visit** (default) — untimed, 5-encounter rounds, the relax replacement.
- **Feeding Frenzy** — 30 seconds, replaces Speedy: berries rain, how many
  Soundlings can you feed? Unlocked once the child has hatched 3 Soundlings
  (so the timed mode is a reward, not a pressure default).

---

## 4. The collection (the return engine)

**The Sound Book** — an album, one page per level, one card per Soundling.
82 total: L1×10, L2×19, L3×7, L4×11, L5×10, L6×14, L7×6, L8×5.
Unhatched = egg silhouette. Card shows creature, grapheme, its two bank
words, and feed count. Completing a level's page → that page turns gold +
ties into the existing certificate/stamp moment.

**Daily return hooks (all gentle, zero dark patterns):**
- **Glowing egg of the day** — one egg per day glows and hatches at only
  2 feeds instead of 3. Different every day (seeded by date).
- **Sleepy Soundlings** — a Soundling not fed for 3+ days is shown asleep
  (never sad, never sick — no guilt mechanics, just "wake me up!").
- **Hatch-day surprise** — every hatch shows the creature's 2-second
  signature animation the child hasn't seen before. Surprise inventory
  = 82 tiny moments of novelty.

**Persistence:** phase 1 follows the existing stamps pattern
(`src/lib/stamps.ts`, localStorage keyed per child) so we ship without a
schema change: `soundlings:{childId}` → `{ [grapheme]: { feeds, hatchedAt,
lastFedAt } }`. Phase 2 syncs to Supabase (`child_soundlings` table) so the
collection follows the child across devices. The storage module is written
behind an interface from day one so phase 2 is a swap, not a rewrite.

---

## 5. Art direction (one locked style, no exceptions)

**Style lock (used verbatim in every Higgsfield `generate_image` prompt):**
> Soft gouache children's picture-book illustration, warm paper texture,
> rounded shapes, gentle rim light. Creature eyes are tiny solid black dots
> only — no white highlights, no irises. No outlines heavier than pencil
> weight. Palette anchored to [level hex]. Plain transparent background.

- **Creatures:** each level shares one body family (so 82 stays coherent
  and affordable): L1 round chicks, L2 pebble-bugs, L3 twin-tailed "special
  friends" (two letters = two tails), L4 long stretchy creatures (long
  sounds), L5 creatures with a detachable sparkle (split digraph = split
  charm), L6 chameleon-like (alternative spellings), L7 wise birds,
  L8 caped "champion" creatures. Within a family: colour/accessory
  variations per grapheme, grapheme subtly marked on the belly/shell.
- **Habitats:** 8 full-screen backgrounds, one per level, in the level's
  colour world and drawn from the books' cultural settings (the brand's
  "window into the world"): e.g. L4 green = Kenyan savannah dusk, L2 coral
  = Icelandic hot springs under northern lights. Final setting list comes
  from the shipped books per level.
- **Per-creature assets:** egg, baby, grown (golden = CSS/filter shimmer on
  grown — no extra generation). 3 images × 82 = 246 creature images
  **generated level-by-level, current level first** — a child only ever
  sees their level, so MVP generates L1–L4 only (47 creatures, 141 images)
  and the rest follow as children reach them.
- Everything else (meters, buttons, cards, confetti) stays in the existing
  "paper & stickers" DOM language — it's good, and it keeps the app feeling
  like one object.

## 6. Audio

- **Words:** George ElevenLabs MP3s via existing `speakWord()` — already the
  right voice, already cached in `/sounds/words/`.
- **SFX** (Higgsfield `generate_audio`, one warm acoustic style): berry pop,
  munch, egg crack, hatch chime, page turn, gentle "try again" boop,
  frenzy tick. Seven files, reused everywhere.
- **Music:** one 60–90s gentle loop per habitat is the dream; MVP ships one
  shared loop + per-level ambience layer. Mute button top-right, state
  remembered.

## 7. UI copy (literal strings)

- Habitat header: `{Level name} Grove` (e.g. "Longer Sounds Grove"), sticker
  style. Buttons: `PLAY`, `Sound Book`, `All done`.
- Encounter: `Tap the sound hiding in…` / solved first try: `{Soundling
  name} loved that! ⭐` / second try: `You found it! 👏`
- Hatch: `Your {grapheme} Soundling hatched!` → `Say hello to {name}!`
- Names: each grapheme gets a decodable-at-level name (the "ee" Soundling
  is **Bee**, "sh" is **Shell**, "oo" is **Moon**…) — full 82-name table to
  be written into `soundlingNames.ts`, every name decodable at or below its
  own level so the name itself is reading practice.
- Album: `The Sound Book` / empty egg cards: `Who's inside?`
- Frenzy end: `{n} Soundlings fed in 30 seconds!`

## 8. Tech

- **In-repo React**, no game engine: framer-motion for creature idle/bounce
  (it's already a dependency and handles this scale), CSS sprite layering,
  `useReducedMotion` respected throughout (existing pattern).
- New files: `src/games/soundlings/` — `Soundlings.tsx` (shell),
  `Habitat.tsx`, `Encounter.tsx`, `SoundBook.tsx`, `soundlingStore.ts`
  (persistence interface), `soundlingNames.ts`, `assets.ts` (manifest).
  Round engine imported from `src/lib/soundGameWords.ts` unchanged.
- Entry point: replaces the `'sound'` game card in `ChildHomeScreen.tsx`
  (card renamed **Soundlings**, blurb `Feed your sound creatures!`).
  SoundGame.tsx is retired after Soundlings ships, not before.
- Asset delivery: generated images optimised (WebP, ≤60KB each) into
  `public/soundlings/{level}/{grapheme}-{state}.webp`; manifest in code.

## 9. Build phases

1. **Playable core** (no generated art yet): habitat + encounters + growth
   + persistence, placeholder circles. Proves the loop in ~a day of work.
2. **L1 art drop:** 10 creatures + L1 habitat + SFX through Higgsfield,
   wired in. This is the "wow" checkpoint — evaluate before mass generation.
3. **L2–L4 art**, Sound Book album, Feeding Frenzy, music.
4. **L5–L8 art** on demand, Supabase sync, then retire SoundGame and fold
   Finish-the-word and Tricky-word encounters into habitats as bonus
   encounter types (one meta, three skills).

## 10. Success test

A parent reports the child asked to open the app unprompted. Proxy metrics:
repeat sessions per child per week on the game, and average collection size.
If children hatch ≥5 Soundlings in week one, the loop works.
