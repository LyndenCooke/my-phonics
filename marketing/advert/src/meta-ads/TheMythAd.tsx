import { AbsoluteFill, Sequence } from "remotion";
import { MythHookScene } from "./scenes/MythHookScene";
import { MythBustScene } from "./scenes/MythBustScene";
import { CTAScene } from "./scenes/CTAScene";

/**
 * "The Myth" — Belief Breaker Ad (15 seconds)
 *
 * Hormozi Framework: Common Belief > Bust > Solution > CTA
 *
 * Opens with what every parent thinks: "They just need to read more."
 * Then breaks the belief: wrong level books kill confidence.
 * Solution: books matched to exactly what they can decode.
 *
 * 0-3s: Common belief in speech bubble
 * 3-10s: Myth bust — "Wrong. Wrong level books kill confidence."
 * 10-15s: CTA — "3-minute assessment. 3 free books. Zero risk."
 */
export const TheMythAd: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Scene 1: Myth Hook (0-3s = 0-90 frames) */}
      <Sequence from={0} durationInFrames={90}>
        <MythHookScene />
      </Sequence>

      {/* Scene 2: Myth Bust (3-10s = 90-300 frames) */}
      <Sequence from={90} durationInFrames={210}>
        <MythBustScene />
      </Sequence>

      {/* Scene 3: CTA (10-15s = 300-450 frames) */}
      <Sequence from={300} durationInFrames={150}>
        <CTAScene
          headline="The right level matters"
          subline="3-minute assessment. 3 free books. Zero risk."
          buttonText="Find their level"
        />
      </Sequence>
    </AbsoluteFill>
  );
};
