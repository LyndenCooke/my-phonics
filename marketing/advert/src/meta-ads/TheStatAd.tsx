import { AbsoluteFill, Sequence } from "remotion";
import { StatHookScene } from "./scenes/StatHookScene";
import { StatQuestionScene } from "./scenes/StatQuestionScene";
import { CTAScene } from "./scenes/CTAScene";

/**
 * "The Stat" — Pattern Interrupt Ad (15 seconds)
 *
 * Hormozi Framework: Bold Number > Question > Solution > CTA
 *
 * Opens with a giant "20%" that fills the screen.
 * Then asks: "Would yours pass?"
 * Solution: find out in 3 minutes with a free assessment.
 *
 * 0-2s: Giant "20%" pattern interrupt
 * 2-7s: "of Year 1 children failed" + "Would yours pass?"
 * 7-11s: Solution checklist
 * 11-15s: CTA
 */
export const TheStatAd: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Scene 1: Stat Hook (0-3s = 0-90 frames) */}
      <Sequence from={0} durationInFrames={90}>
        <StatHookScene />
      </Sequence>

      {/* Scene 2: Question + Solution (3-11s = 90-330 frames) */}
      <Sequence from={90} durationInFrames={240}>
        <StatQuestionScene />
      </Sequence>

      {/* Scene 3: CTA (11-15s = 330-450 frames) */}
      <Sequence from={330} durationInFrames={120}>
        <CTAScene
          headline="Get their level + 3 free books"
          subline="Free. No card needed."
          buttonText="Start assessment"
        />
      </Sequence>
    </AbsoluteFill>
  );
};
