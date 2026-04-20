import React from "react";
import { Img, staticFile, useCurrentFrame, interpolate } from "remotion";
import { COLOURS, LEVEL_COLOURS, FONTS } from "../lib/theme";
import { FadeUp, LevelDots, CTAPill, Watermark, GlassPanel } from "../lib/animations";

/** Feed 03: "Between ages 4 and 6, something important happens" */
export const FeedCriticalWindow: React.FC = () => {
  const frame = useCurrentFrame();
  const glowOpacity = interpolate(Math.sin(frame / 15), [-1, 1], [0.15, 0.35]);

  return (
    <div style={{ width: 1080, height: 1080, position: "relative", overflow: "hidden", background: COLOURS.deepBlack }}>
      <Img src={staticFile("gemini-raw/gem_05_reading_gap.png")}
        style={{ width: 1080, height: 1080, objectFit: "cover", position: "absolute" }} />

      <GlassPanel style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "50px 60px 60px", borderRadius: 0 }}>
        <Watermark colour="rgba(245,158,11,0.9)" />

        <FadeUp delay={5}>
          <div style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 42, color: COLOURS.softWhite, lineHeight: 1.25 }}>
            Between ages 4 and 6,
          </div>
        </FadeUp>

        <FadeUp delay={18}>
          <div style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 42, color: COLOURS.amber, lineHeight: 1.25 }}>
            something important happens.
          </div>
        </FadeUp>

        <FadeUp delay={40}>
          <div style={{ fontFamily: FONTS.body, fontSize: 23, color: COLOURS.lightGrey, lineHeight: 1.5, marginTop: 24, maxWidth: 900 }}>
            The brain is wired to learn to read. Miss this window and the gap doesn't close. It widens. Every year. Every stage.
          </div>
        </FadeUp>

        {/* Pulsing amber glow behind the age range */}
        <FadeUp delay={55}>
          <div style={{
            display: "inline-block", marginTop: 20, padding: "10px 28px",
            borderRadius: 12, background: `rgba(245,158,11,${glowOpacity})`,
            fontFamily: FONTS.heading, fontWeight: 700, fontSize: 36, color: COLOURS.amber,
          }}>
            Ages 4–6: the critical window
          </div>
        </FadeUp>
      </GlassPanel>

      <div style={{ position: "absolute", bottom: 30, left: 60 }}>
        <LevelDots colours={LEVEL_COLOURS} delay={70} />
      </div>

      <FadeUp delay={75} style={{ position: "absolute", bottom: 70, left: 60 }}>
        <CTAPill text="Find Their Reading Level" bg={COLOURS.amber} fg={COLOURS.deepBlack} delay={75} />
      </FadeUp>
    </div>
  );
};
