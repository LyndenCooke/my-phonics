import React from "react";
import { Img, staticFile } from "remotion";
import { COLOURS, LEVEL_COLOURS, FONTS } from "../lib/theme";
import { FadeUp, LevelDots, CTAPill, Watermark, GlassPanel } from "../lib/animations";

/** Feed 02: "Want them to read English like a British child?" */
export const FeedReadLikeBritish: React.FC = () => {
  return (
    <div style={{ width: 1080, height: 1080, position: "relative", overflow: "hidden", background: COLOURS.deepBlack }}>
      <Img src={staticFile("gemini-raw/gem_04_world_connections.png")}
        style={{ width: 1080, height: 1080, objectFit: "cover", position: "absolute" }} />

      <GlassPanel style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "50px 60px 60px", borderRadius: 0 }}>
        <Watermark colour="rgba(100,180,255,0.9)" />

        <FadeUp delay={5}>
          <div style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 44, color: COLOURS.softWhite, lineHeight: 1.25 }}>
            Want them to read English
          </div>
        </FadeUp>

        <FadeUp delay={18}>
          <div style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 44, color: COLOURS.blue, lineHeight: 1.25 }}>
            like a British child?
          </div>
        </FadeUp>

        <FadeUp delay={40}>
          <div style={{ fontFamily: FONTS.body, fontSize: 23, color: COLOURS.lightGrey, lineHeight: 1.5, marginTop: 24, maxWidth: 900 }}>
            British schools use a structured phonics system that teaches children to decode words, not guess them. Now your family can use the same approach, wherever you live.
          </div>
        </FadeUp>
      </GlassPanel>

      <div style={{ position: "absolute", bottom: 30, left: 60 }}>
        <LevelDots colours={LEVEL_COLOURS} delay={65} />
      </div>

      <FadeUp delay={70} style={{ position: "absolute", bottom: 70, left: 60 }}>
        <CTAPill text="Start the Free Assessment" bg={COLOURS.blue} fg={COLOURS.softWhite} delay={70} />
      </FadeUp>
    </div>
  );
};
