import React from "react";
import { Img, staticFile } from "remotion";
import { COLOURS, LEVEL_COLOURS, FONTS } from "../lib/theme";
import { FadeUp, ScaleIn, LevelDots, CTAPill, Watermark, GlassPanel } from "../lib/animations";

/** Meta Ad 12: "Don't guess their reading level. Know it." */
export const MetaDontGuess: React.FC = () => {
  return (
    <div style={{ width: 1080, height: 1080, position: "relative", overflow: "hidden", background: COLOURS.deepBlack }}>
      <Img src={staticFile("gemini-raw/gem_09_assessment.png")}
        style={{ width: 1080, height: 1080, objectFit: "cover", position: "absolute" }} />

      <GlassPanel style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "50px 60px 60px", borderRadius: 0 }}>
        <Watermark colour="rgba(59,130,246,0.9)" />

        <FadeUp delay={5}>
          <div style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 44, color: COLOURS.softWhite, lineHeight: 1.25 }}>
            Don't guess their reading level.
          </div>
        </FadeUp>

        <FadeUp delay={20}>
          <div style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 44, color: COLOURS.blue, lineHeight: 1.25 }}>
            Know it.
          </div>
        </FadeUp>

        <FadeUp delay={42}>
          <div style={{ fontFamily: FONTS.body, fontSize: 23, color: COLOURS.lightGrey, lineHeight: 1.5, marginTop: 24, maxWidth: 900 }}>
            A free 3-minute assessment finds their exact level. Then they get a personalised book matched to it. Every word suited to what they know.
          </div>
        </FadeUp>

        {/* Big "3 min" stat */}
        <ScaleIn delay={60}>
          <div style={{
            display: "inline-flex", alignItems: "baseline", gap: 12, marginTop: 20,
            background: "rgba(59,130,246,0.15)", padding: "10px 24px", borderRadius: 12,
          }}>
            <span style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 56, color: COLOURS.blue }}>3</span>
            <span style={{ fontFamily: FONTS.heading, fontWeight: 500, fontSize: 28, color: COLOURS.softWhite }}>minutes. Free.</span>
          </div>
        </ScaleIn>
      </GlassPanel>

      <div style={{ position: "absolute", bottom: 30, left: 60 }}>
        <LevelDots colours={LEVEL_COLOURS} delay={75} />
      </div>

      <FadeUp delay={80} style={{ position: "absolute", bottom: 70, left: 60 }}>
        <CTAPill text="Find Their Level Now" bg={COLOURS.blue} fg={COLOURS.softWhite} delay={80} />
      </FadeUp>
    </div>
  );
};
