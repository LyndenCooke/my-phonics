import React from "react";
import { Img, staticFile } from "remotion";
import { COLOURS, LEVEL_COLOURS, FONTS } from "../lib/theme";
import { FadeUp, LevelDots, CTAPill, Watermark, GlassPanel } from "../lib/animations";

/** Facebook 07: "Start them off right" (1200x628) */
export const FbStartRight: React.FC = () => {
  return (
    <div style={{ width: 1200, height: 628, position: "relative", overflow: "hidden", background: COLOURS.deepBlack }}>
      <Img src={staticFile("gemini-raw/gem_10_start_right_v2.png")}
        style={{ width: 1200, height: 1200, objectFit: "cover", position: "absolute", top: -286 }} />

      {/* Left panel overlay */}
      <GlassPanel style={{
        position: "absolute", top: 0, left: 0, bottom: 0, width: 620,
        borderRadius: 0, padding: "40px 45px",
      }}>
        <Watermark style={{ position: "relative", top: 0, right: 0, marginBottom: 20, fontSize: 15 }} colour="rgba(170,140,255,0.9)" />

        <FadeUp delay={5}>
          <div style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 40, color: COLOURS.softWhite, lineHeight: 1.2 }}>
            Start them off
          </div>
        </FadeUp>

        <FadeUp delay={15}>
          <div style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 40, color: COLOURS.purple, lineHeight: 1.2 }}>
            right.
          </div>
        </FadeUp>

        <FadeUp delay={35}>
          <div style={{ fontFamily: FONTS.body, fontSize: 18, color: COLOURS.lightGrey, lineHeight: 1.5, marginTop: 18, maxWidth: 520 }}>
            Most children are given books above their level. They guess at words instead of reading them. A 3-minute assessment changes everything.
          </div>
        </FadeUp>

        <FadeUp delay={55} style={{ marginTop: 20 }}>
          <CTAPill text="Find Their Reading Level" bg={COLOURS.purple} fg={COLOURS.softWhite} delay={55}
            style={{ fontSize: 17, padding: "10px 24px" }} />
        </FadeUp>
      </GlassPanel>

      <div style={{ position: "absolute", bottom: 16, left: 45 }}>
        <LevelDots colours={LEVEL_COLOURS} delay={65} size={10} gap={6} />
      </div>
    </div>
  );
};
