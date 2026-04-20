import React from "react";
import { Img, staticFile } from "remotion";
import { COLOURS, LEVEL_COLOURS, FONTS } from "../lib/theme";
import { FadeUp, ScaleIn, LevelDots, CTAPill, Watermark, GlassPanel } from "../lib/animations";

/** Feed 04: "You don't need 50 minutes a day. You need 10." */
export const FeedTenMinutes: React.FC = () => {
  return (
    <div style={{ width: 1080, height: 1080, position: "relative", overflow: "hidden", background: COLOURS.deepBlack }}>
      <Img src={staticFile("gemini-raw/gem_06_ten_minutes.png")}
        style={{ width: 1080, height: 1080, objectFit: "cover", position: "absolute" }} />

      <GlassPanel style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "50px 60px 60px", borderRadius: 0 }}>
        <Watermark colour="rgba(59,130,246,0.9)" />

        <FadeUp delay={5}>
          <div style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 42, color: COLOURS.softWhite, lineHeight: 1.25 }}>
            You don't need 50 minutes a day.
          </div>
        </FadeUp>

        <FadeUp delay={18}>
          <div style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 42, color: COLOURS.blue, lineHeight: 1.25 }}>
            You need 10.
          </div>
        </FadeUp>

        <FadeUp delay={40}>
          <div style={{ fontFamily: FONTS.body, fontSize: 23, color: COLOURS.lightGrey, lineHeight: 1.5, marginTop: 24, maxWidth: 900 }}>
            Ten minutes of reading at the right level beats an hour of guessing at the wrong one. Every word matched to what they already know.
          </div>
        </FadeUp>

        <div style={{ display: "flex", gap: 30, marginTop: 28 }}>
          <ScaleIn delay={55}>
            <div style={{
              fontFamily: FONTS.heading, fontWeight: 700, fontSize: 60, color: COLOURS.midGrey,
              textDecoration: "line-through", textDecorationColor: COLOURS.pink,
            }}>60 min</div>
          </ScaleIn>
          <ScaleIn delay={65}>
            <div style={{
              fontFamily: FONTS.heading, fontWeight: 700, fontSize: 60, color: COLOURS.blue,
            }}>10 min</div>
          </ScaleIn>
        </div>
      </GlassPanel>

      <div style={{ position: "absolute", bottom: 30, left: 60 }}>
        <LevelDots colours={LEVEL_COLOURS} delay={75} />
      </div>

      <FadeUp delay={80} style={{ position: "absolute", bottom: 70, left: 60 }}>
        <CTAPill text="Start the Free Assessment" bg={COLOURS.blue} fg={COLOURS.softWhite} delay={80} />
      </FadeUp>
    </div>
  );
};
