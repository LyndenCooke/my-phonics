import { AbsoluteFill, Sequence } from "remotion";
import { NewsHookScene } from "./scenes/NewsHookScene";
import { NewsContextScene } from "./scenes/NewsContextScene";
import { NewsFlipScene } from "./scenes/NewsFlipScene";
import { CTAScene } from "./scenes/CTAScene";

/**
 * "The Headline" — News Hook Ad (15 seconds)
 *
 * Hormozi Framework: Hook > Context > Flip > CTA
 *
 * Opens with a real news headline about the UK reading crisis.
 * Parent sees something they may have scrolled past.
 * Then we flip: the solution isn't more books, it's the RIGHT books.
 *
 * 0-3s: News headline screenshot (pattern interrupt)
 * 3-7s: Context — "2026 National Year of Reading"
 * 7-11s: Flip — "The right books, matched to what they can decode"
 * 11-15s: CTA — "Find their level. Free."
 */
export const TheHeadlineAd: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Scene 1: News Hook (0-3s = 0-90 frames) */}
      <Sequence from={0} durationInFrames={90}>
        <NewsHookScene />
      </Sequence>

      {/* Scene 2: Context (3-7s = 90-210 frames) */}
      <Sequence from={90} durationInFrames={120}>
        <NewsContextScene />
      </Sequence>

      {/* Scene 3: Flip (7-11s = 210-330 frames) */}
      <Sequence from={210} durationInFrames={120}>
        <NewsFlipScene />
      </Sequence>

      {/* Scene 4: CTA (11-15s = 330-450 frames) */}
      <Sequence from={330} durationInFrames={120}>
        <CTAScene
          headline="Find their level"
          subline="3-minute assessment. 3 free books."
          buttonText="Start free assessment"
        />
      </Sequence>
    </AbsoluteFill>
  );
};
