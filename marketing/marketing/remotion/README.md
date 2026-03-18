# MyPhonicsBooks Remotion Videos

Meta-safe marketing videos using actual book templates.

## Quick Start

```bash
cd remotion
npm install
npm run dev  # Opens Remotion Studio at http://localhost:3000
```

## Render Videos

```bash
# Render all videos
npm run render-all

# Or individually
npx remotion render HookWrongBooks output/hook-wrong-books.mp4
npx remotion render HookThreeMinutes output/hook-3-minutes.mp4
npx remotion render HookTheGap output/hook-the-gap.mp4
npx remotion render HookStillGuessing output/hook-still-guessing.mp4
```

## Compositions

| Video | Duration | Description |
|-------|----------|-------------|
| **HookWrongBooks** | 15s | Wrong books → MyPhonicsBooks → CTA |
| **HookThreeMinutes** | 15s | 3 min assessment → checklist → CTA |
| **HookTheGap** | 15s | Problem/Solution split screen |
| **HookStillGuessing** | 15s | Question → frustration → solution → CTA |

## Specs

- **Resolution:** 1080×1350 (4:5 for Instagram/Facebook)
- **FPS:** 30
- **Format:** H.264, yuv420p
- **Duration:** 15 seconds

## Features

✅ Real MyPhonicsBooks cover templates  
✅ Level colours (#E84B8A, #F59E0B, etc.)  
✅ Islamic-compliant (no faces, minimal eyes)  
✅ No music (add voiceover separately)  
✅ Customizable child name (default: "Emma")

## Customize

Edit `src/compositions/HookWrongBooks.tsx`:
- Change `childName` prop (default: "Emma")
- Adjust timing or text
- Update book titles
