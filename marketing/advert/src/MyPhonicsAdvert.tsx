import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { OpeningScene } from "./scenes/OpeningScene";
import { ProblemScene } from "./scenes/ProblemScene";
import { ProductShowcase } from "./scenes/ProductShowcase";
import { UniqueValueScene } from "./scenes/UniqueValueScene";
import { CallToAction } from "./scenes/CallToAction";

export const MyPhonicsAdvert: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
      }}
    >
      {/* Scene 1: Opening Hook (0-4s) */}
      <Sequence from={0} durationInFrames={120}>
        <OpeningScene />
      </Sequence>

      {/* Scene 2: Problem Statement (4-10s) */}
      <Sequence from={120} durationInFrames={180}>
        <ProblemScene />
      </Sequence>

      {/* Scene 3: Product Showcase (10-18s) */}
      <Sequence from={300} durationInFrames={240}>
        <ProductShowcase />
      </Sequence>

      {/* Scene 4: Unique Value (18-24s) */}
      <Sequence from={540} durationInFrames={180}>
        <UniqueValueScene />
      </Sequence>

      {/* Scene 5: Call to Action (24-30s) */}
      <Sequence from={720} durationInFrames={180}>
        <CallToAction />
      </Sequence>
    </AbsoluteFill>
  );
};
