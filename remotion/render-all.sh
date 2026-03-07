#!/bin/bash

# Render all 4 video hooks for Meta ads
# Output: remotion/output/*.mp4

mkdir -p output

echo "Rendering Hook 1: Wrong Books..."
npx remotion render HookWrongBooks output/hook-wrong-books.mp4

echo "Rendering Hook 2: 3 Minutes..."
npx remotion render HookThreeMinutes output/hook-3-minutes.mp4

echo "Rendering Hook 3: The Gap..."
npx remotion render HookTheGap output/hook-the-gap.mp4

echo "Rendering Hook 4: Still Guessing..."
npx remotion render HookStillGuessing output/hook-still-guessing.mp4

echo "Done! Videos saved to remotion/output/"
