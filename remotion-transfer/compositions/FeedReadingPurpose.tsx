import React from "react";
import { Img, staticFile } from "remotion";
import { COLOURS, LEVEL_COLOURS, FONTS } from "../lib/theme";
import { FadeUp, LevelDots, CTAPill, Watermark, GlassPanel } from "../lib/animations";

/** Feed 09 / Meta: "Are they reading with purpose?" */
export const FeedReadingPurpose: React.FC = () => {
  return (
    <div style={{ width: 1080, height: 1080, position: "relative", overflow: "hidden", background: COLOURS.deepBlack }}>
      <Img src={staticFile("gemini-raw/gem_11_reading_purpose.png")}
        style={{ width: 1080, height: 1080, objectFit: "cover", position: "absolute" }} />

      <GlassPanel style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "50px 60px 60px", borderRadius: 0 }}>
        <Watermark colour="rgba(255,120,170,0.9)" />

        <FadeUp delay={5}>
          <div style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 46, color: COLOURS.softWhite, lineHeight: 1.25 }}>
            Are they reading
          </div>
        </FadeUp>

        <FadeUp delay={18}>
          <div style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 46, color: COLOURS.pink, lineHeight: 1.25 }}>
            with purpose?
          </div>
        </FadeUp>

        <FadeUp delay={40}>
          <div style={{ fontFamily: FONTS.body, fontSize: 22, color: COLOURS.lightGrey, lineHeight: 1.5, marginTop: 24, maxWidth: 900 }}>
            Or are they just looking at words they can't decode? Every book in this system uses only words matched to their assessed reading level.
          </div>
        </FadeUp>
      </GlassPanel>

      <div style={{ position: "absolute", bottom: 30, left: 60 }}>
        <LevelDots colours={LEVEL_COLOURS} delay={60} />
      </div>

      <FadeUp delay={65} style={{ position: "absolute", bottom: 70, left: 60 }}>
        <CTAPill text="Find Their Reading Level" bg={COLOURS.pink} fg={COLOURS.softWhite} delay={65} />
      </FadeUp>
    </div>
  );
};
