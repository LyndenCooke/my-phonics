import React from "react";
import { Img, staticFile } from "remotion";
import { COLOURS, LEVEL_COLOURS, FONTS } from "../lib/theme";
import { FadeUp, LevelDots, CTAPill, Watermark, GlassPanel } from "../lib/animations";

/** Feed 10: "A British teacher built this for families like yours" */
export const FeedBritishTeacher: React.FC = () => {
  return (
    <div style={{ width: 1080, height: 1080, position: "relative", overflow: "hidden", background: COLOURS.deepBlack }}>
      <Img src={staticFile("gemini-raw/gem_07_british_teacher_v2.png")}
        style={{ width: 1080, height: 1080, objectFit: "cover", position: "absolute" }} />

      <GlassPanel style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "50px 60px 60px", borderRadius: 0 }}>
        <Watermark colour="rgba(80,220,130,0.9)" />

        <FadeUp delay={5}>
          <div style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 42, color: COLOURS.softWhite, lineHeight: 1.25 }}>
            A British teacher built this
          </div>
        </FadeUp>

        <FadeUp delay={18}>
          <div style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 42, color: COLOURS.green, lineHeight: 1.25 }}>
            for families like yours.
          </div>
        </FadeUp>

        <FadeUp delay={40}>
          <div style={{ fontFamily: FONTS.body, fontSize: 22, color: COLOURS.lightGrey, lineHeight: 1.5, marginTop: 24, maxWidth: 900 }}>
            Not a tech company. Not an app with cartoon rewards. A qualified UK teacher who knows exactly how British children learn to read.
          </div>
        </FadeUp>
      </GlassPanel>

      <div style={{ position: "absolute", bottom: 30, left: 60 }}>
        <LevelDots colours={LEVEL_COLOURS} delay={60} />
      </div>

      <FadeUp delay={65} style={{ position: "absolute", bottom: 70, left: 60 }}>
        <CTAPill text="Start the Free Assessment" bg={COLOURS.green} fg={COLOURS.deepBlack} delay={65} />
      </FadeUp>
    </div>
  );
};
