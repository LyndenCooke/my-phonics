import React from "react";
import { Img, staticFile } from "remotion";
import { COLOURS, LEVEL_COLOURS, FONTS } from "../lib/theme";
import { FadeUp, ScaleIn, LevelDots, CTAPill, Watermark, GlassPanel } from "../lib/animations";

/** Story 13: "What reading level are they actually at?" — Direct CTA */
export const StoryAssessmentCTA: React.FC = () => {
  return (
    <div style={{ width: 1080, height: 1920, position: "relative", overflow: "hidden", background: COLOURS.deepBlack }}>
      {/* Image bottom */}
      <Img src={staticFile("gemini-raw/gem_09_assessment.png")}
        style={{ width: 1080, height: 1080, objectFit: "cover", position: "absolute", bottom: 0 }} />

      {/* Top panel */}
      <GlassPanel style={{ position: "absolute", top: 0, left: 0, right: 0, borderRadius: 0, padding: "60px 60px", height: 780 }}>
        <Watermark style={{ position: "relative", top: 0, right: 0, marginBottom: 40 }} colour="rgba(120,160,255,0.9)" />

        <FadeUp delay={5}>
          <div style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 48, color: COLOURS.softWhite, lineHeight: 1.2, marginTop: 30 }}>
            What reading level are they actually at?
          </div>
        </FadeUp>

        <FadeUp delay={25}>
          <div style={{ fontFamily: FONTS.body, fontSize: 26, color: COLOURS.lightGrey, lineHeight: 1.5, marginTop: 30, maxWidth: 940 }}>
            Most parents don't know. That means most children are reading the wrong books.
          </div>
        </FadeUp>

        {/* Big "3 minutes" card */}
        <ScaleIn delay={50}>
          <div style={{
            background: "rgba(22,22,40,0.88)", borderRadius: 18, padding: "24px 30px",
            marginTop: 36, display: "flex", alignItems: "center", gap: 24,
          }}>
            <div style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 90, color: COLOURS.blue }}>3</div>
            <div>
              <div style={{ fontFamily: FONTS.heading, fontWeight: 500, fontSize: 34, color: COLOURS.softWhite }}>minutes</div>
              <div style={{ fontFamily: FONTS.body, fontSize: 24, color: COLOURS.lightGrey, marginTop: 4 }}>to find their exact level.</div>
              <div style={{ fontFamily: FONTS.body, fontSize: 20, color: COLOURS.midGrey, marginTop: 4 }}>Then a free book matched to it.</div>
            </div>
          </div>
        </ScaleIn>
      </GlassPanel>

      {/* Bottom CTA */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "rgba(12,12,18,0.85)", padding: "30px 60px 50px",
      }}>
        <LevelDots colours={LEVEL_COLOURS} delay={80} style={{ justifyContent: "center", marginBottom: 16 }} />
        <div style={{ display: "flex", justifyContent: "center" }}>
          <CTAPill text="Find Their Reading Level Now" bg={COLOURS.blue} fg={COLOURS.softWhite} delay={85} />
        </div>
        <FadeUp delay={95}>
          <div style={{ fontFamily: FONTS.body, fontSize: 17, color: COLOURS.midGrey, textAlign: "center", marginTop: 14 }}>
            Free. No login. Takes 3 minutes.
          </div>
        </FadeUp>
      </div>
    </div>
  );
};
