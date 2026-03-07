# MyPhonicsBooks — Remotion Video Ads

Meta-safe marketing videos using actual book templates.

## Setup

```bash
cd remotion
npm install
```

## Preview Videos

```bash
npm run dev
```

This opens Remotion Studio at http://localhost:3000

## Render Videos

```bash
# Render Hook 1: Wrong Books (15s)
npx remotion render HookWrongBooks output/hook-wrong-books.mp4

# Render Hook 2: 3 Minutes
npx remotion render HookThreeMinutes output/hook-3-minutes.mp4

# Render Hook 3: The Gap
npx remotion render HookTheGap output/hook-the-gap.mp4

# Render Hook 4: Still Guessing
npx remotion render HookStillGuessing output/hook-still-guessing.mp4
```

## Available Compositions

| ID | Duration | Description |
|----|----------|-------------|
| `HookWrongBooks` | 15s | "Wrong books kill confidence" → books → CTA |
| `HookThreeMinutes` | 15s | "3 minutes" → assessment → CTA |
| `HookTheGap` | 15s | Split screen problem → solution |
| `HookStillGuessing` | 15s | Problem → solution → CTA |

## Video Specs

- **Size:** 1080×1350 (4:5 for Instagram/Facebook feed)
- **FPS:** 30
- **Format:** H.264, yuv420p
- **Duration:** 15 seconds each

## Brand Compliance

✅ Uses actual MyPhonicsBooks cover templates
✅ Exact level colours (#E84B8A, #F59E0B, etc.)
✅ Book illustrations with minimal/slit eyes (Islamic-compliant)
✅ No realistic human faces
✅ No music (add voiceover separately if needed)
✅ Matches brand fonts (Plus Jakarta Sans + Andika)

## Customization

Edit `src/compositions/HookWrongBooks.tsx` to:
- Change child name (default: "Emma")
- Adjust timing
- Modify text
- Update book titles

All book components are in `src/components/BookCover.tsx`
