import React from "react";
import { Img, staticFile } from "remotion";
import { COLOURS, LEVEL_COLOURS, FONTS } from "../lib/theme";
import { FadeUp, LevelDots, CTAPill, Watermark, GlassPanel } from "../lib/animations";

/** Story 04: "Living abroad? Scared they're falling behind?" */
export const StoryExpatFear: React.FC = () => {
  return (
    <div style={{ width: 1080, height: 1920, position: "relative", overflow: "hidden", background: COLOURS.deepBlack }}>
      {/* Image in bottom half */}
      <Img src={staticFile("gemini-raw/gem_04_world_connections.png")}
        style={{ width: 1080, height: 1080, objectFit: "cover", position: "absolute", bottom: 0 }} />

      {/* Dark panel top */}
      <GlassPanel style={{ position: "absolute", top: 0, left: 0, right: 0, height: 840, borderRadius: 0, padding: "60px 60px" }}>
        <Watermark style={{ position: "relative", top: 0, right: 0, marginBottom: 40 }} colour="rgba(100,160,255,0.9)" />

        <FadeUp delay={5}>
          <div style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 48, color: COLOURS.softWhite, lineHeight: 1.2, marginTop: 40 }}>
            Living abroad?
          </div>
        </FadeUp>

        <FadeUp delay={18}>
          <div style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 48, color: COLOURS.pink, lineHeight: 1.2, marginTop: 8 }}>
            Scared they're falling behind?
          </div>
        </FadeUp>

        <FadeUp delay={40}>
          <div style={{ fontFamily: FONTS.body, fontSize: 26, color: COLOURS.lightGrey, lineHeight: 1.6, marginTop: 30, maxWidth: 940 }}>
            No British school checking. No phonics screening. No one telling you where they actually are. And every month, the gap between where they are and where a child in Britain would be gets wider.
          </div>
        </FadeUp>

        <FadeUp delay={70}>
          <div style={{ fontFamily: FONTS.body, fontSize: 24, color: COLOURS.midGrey, lineHeight: 1.5, marginTop: 24, maxWidth: 940 }}>
            A British teacher built a system for families abroad. A 3-minute assessment finds their exact level.
          </div>
        </FadeUp>
      </GlassPanel>

      {/* Bottom CTA bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "rgba(12,12,18,0.85)", padding: "30px 60px 50px",
      }}>
        <LevelDots colours={LEVEL_COLOURS} delay={90} style={{ justifyContent: "center", marginBottom: 16 }} />
        <div style={{ display: "flex", justifyContent: "center" }}>
          <CTAPill text="Find Their Reading Level" bg={COLOURS.blue} fg={COLOURS.softWhite} delay={95} />
        </div>
        <FadeUp delay={105}>
          <div style={{ fontFamily: FONTS.body, fontSize: 17, color: COLOURS.midGrey, textAlign: "center", marginTop: 14 }}>
            Free. No login. Takes 3 minutes.
          </div>
        </FadeUp>
      </div>
    </div>
  );
};
