#!/bin/bash
mkdir -p output
npx remotion render HookWrongBooks output/hook-wrong-books.mp4
npx remotion render HookThreeMinutes output/hook-3-minutes.mp4
npx remotion render HookTheGap output/hook-the-gap.mp4
npx remotion render HookStillGuessing output/hook-still-guessing.mp4
echo "Done! Videos in remotion/output/"
