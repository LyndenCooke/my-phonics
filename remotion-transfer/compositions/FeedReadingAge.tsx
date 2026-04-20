import React from "react";
import { Img, staticFile } from "remotion";
import { COLOURS, LEVEL_COLOURS, FONTS } from "../lib/theme";
import { FadeUp, ScaleIn, CountUp, LevelDots, CTAPill, Watermark, GlassPanel } from "../lib/animations";

/** Feed 01: "73% of parents don't know their child's reading age" */
export const FeedReadingAge: React.FC = () => {
  return (
    <div style={{ width: 1080, height: 1080, position: "relative", overflow: "hidden", background: COLOURS.deepBlack }}>
      <Img src={staticFile("gemini-raw/gem_01_children_reading_v2.png")}
        style={{ width: 1080, height: 1080, objectFit: "cover", position: "absolute" }} />

      <GlassPanel style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "50px 60px 60px", borderRadius: 0 }}>
        <Watermark />
        <FadeUp delay={5}>
          <div style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 80, color: COLOURS.pink, lineHeight: 1.0 }}>
            <CountUp target={73} suffix="%" startFrame={8} duration={25} />
          </div>
        </FadeUp>

        <FadeUp delay={20}>
          <div style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 42, color: COLOURS.softWhite, lineHeight: 1.25, marginTop: 10 }}>
            of parents don't know their child's reading age.
          </div>
        </FadeUp>

        <FadeUp delay={45}>
          <div style={{ fontFamily: FONTS.body, fontSize: 24, color: COLOURS.lightGrey, lineHeight: 1.5, marginTop: 20, maxWidth: 900 }}>
            If they're reading the wrong books, they're not really reading. They're guessing.
          </div>
        </FadeUp>
      </GlassPanel>

      <div style={{ position: "absolute", bottom: 30, left: 60 }}>
        <LevelDots colours={LEVEL_COLOURS} delay={60} />
      </div>

      <FadeUp delay={70} style={{ position: "absolute", bottom: 70, left: 60 }}>
        <CTAPill text="Find Their Reading Level" bg={COLOURS.pink} fg={COLOURS.softWhite} delay={70} />
      </FadeUp>
    </div>
  );
};
