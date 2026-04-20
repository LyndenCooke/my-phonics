import React from "react";
import { Img, staticFile, Sequence, useCurrentFrame, interpolate } from "remotion";
import { COLOURS, LEVEL_COLOURS, FONTS } from "../lib/theme";
import { FadeUp, ScaleIn, LevelDots, CTAPill, Watermark } from "../lib/animations";

/**
 * Reel 04: "The Expat Reading Gap"
 * ~50 seconds at 30fps = 1500 frames
 */
export const ReelExpatGap: React.FC = () => {
  const frame = useCurrentFrame();

  // Diverging lines for "gap widening" visual (used in section 3)
  const gapWidth = interpolate(frame, [660, 840], [8, 140], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <div style={{
      width: 1080, height: 1920, position: "relative", overflow: "hidden",
      background: COLOURS.deepBlack, fontFamily: FONTS.heading,
    }}>
      <Img src={staticFile("gemini-raw/gem_04_world_connections.png")}
        style={{ width: 1080, height: 1080, objectFit: "cover", position: "absolute", bottom: 0, opacity: 0.5 }} />

      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(12,12,18,0.96) 0%, rgba(12,12,18,0.7) 50%, rgba(12,12,18,0.35) 100%)",
      }} />

      <Watermark style={{ position: "absolute", top: 30, right: 40 }} colour="rgba(100,160,255,0.9)" />

      {/* 0–5s: Hook */}
      <Sequence from={0} durationInFrames={180}>
        <div style={{ position: "absolute", top: 220, left: 60, right: 60 }}>
          <FadeUp delay={5}>
            <div style={{ fontSize: 50, fontWeight: 700, color: COLOURS.softWhite, lineHeight: 1.2 }}>
              Living abroad?
            </div>
          </FadeUp>
          <FadeUp delay={20}>
            <div style={{ fontSize: 46, fontWeight: 700, color: COLOURS.pink, lineHeight: 1.2, marginTop: 12 }}>
              Let me tell you what keeps expat parents up at night.
            </div>
          </FadeUp>
        </div>
      </Sequence>

      {/* 5–15s: The problem */}
      <Sequence from={150} durationInFrames={330}>
        <div style={{ position: "absolute", top: 200, left: 60, right: 60 }}>
          <FadeUp delay={0}>
            <div style={{ fontSize: 42, fontWeight: 700, color: COLOURS.softWhite, lineHeight: 1.3 }}>
              Their child speaks English at home...
            </div>
          </FadeUp>
          <FadeUp delay={22}>
            <div style={{ fontSize: 42, fontWeight: 700, color: COLOURS.blue, lineHeight: 1.3, marginTop: 12 }}>
              but can they actually read it?
            </div>
          </FadeUp>
          <FadeUp delay={42}>
            <div style={{ fontSize: 42, fontWeight: 700, color: COLOURS.softWhite, lineHeight: 1.3, marginTop: 12 }}>
              At the level they should be at?
            </div>
          </FadeUp>
          <ScaleIn delay={65}>
            <div style={{ fontSize: 48, fontWeight: 700, color: COLOURS.pink, marginTop: 30 }}>
              Most can't.
            </div>
          </ScaleIn>
        </div>
      </Sequence>

      {/* 15–28s: No safety net */}
      <Sequence from={450} durationInFrames={420}>
        <div style={{ position: "absolute", top: 200, left: 60, right: 60 }}>
          <FadeUp delay={0}>
            <div style={{ fontSize: 38, fontWeight: 700, color: COLOURS.softWhite, lineHeight: 1.3 }}>
              No British school checking. No phonics screening. No one telling you where they actually are.
            </div>
          </FadeUp>

          <FadeUp delay={30}>
            <div style={{ fontSize: 38, fontWeight: 700, color: COLOURS.amber, lineHeight: 1.3, marginTop: 30 }}>
              And every month that passes...
            </div>
          </FadeUp>

          {/* Diverging gap lines */}
          <FadeUp delay={50}>
            <div style={{ marginTop: 30, display: "flex", flexDirection: "column", alignItems: "center", gap: gapWidth }}>
              <div style={{ width: 300, height: 4, background: COLOURS.green, borderRadius: 2 }} />
              <div style={{ width: 300, height: 4, background: COLOURS.pink, borderRadius: 2 }} />
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 22, color: COLOURS.midGrey, textAlign: "center", marginTop: 20 }}>
              the gap gets wider.
            </div>
          </FadeUp>
        </div>
      </Sequence>

      {/* 28–40s: Solution */}
      <Sequence from={840} durationInFrames={360}>
        <div style={{ position: "absolute", top: 200, left: 60, right: 60 }}>
          <FadeUp delay={0}>
            <div style={{ fontSize: 40, fontWeight: 700, color: COLOURS.softWhite, lineHeight: 1.3 }}>
              That's why a British teacher with QTS
            </div>
          </FadeUp>
          <FadeUp delay={18}>
            <div style={{ fontSize: 40, fontWeight: 700, color: COLOURS.teal, lineHeight: 1.3, marginTop: 8 }}>
              built a phonics system for families abroad.
            </div>
          </FadeUp>
          <FadeUp delay={40}>
            <div style={{ fontFamily: FONTS.body, fontSize: 24, color: COLOURS.lightGrey, lineHeight: 1.5, marginTop: 30 }}>
              A 3-minute assessment finds their exact reading level. Then they get a free personalised book matched to it.
            </div>
          </FadeUp>
          <FadeUp delay={65}>
            <div style={{ fontFamily: FONTS.body, fontSize: 24, color: COLOURS.teal, lineHeight: 1.5, marginTop: 16 }}>
              Every word suited to what they know. Not a guess. Not a hope. Matched.
            </div>
          </FadeUp>
        </div>
      </Sequence>

      {/* 40–50s: CTA */}
      <Sequence from={1200} durationInFrames={300}>
        <div style={{ position: "absolute", top: 300, left: 60, right: 60, textAlign: "center" }}>
          <ScaleIn delay={0}>
            <div style={{ fontSize: 48, fontWeight: 700, color: COLOURS.softWhite, lineHeight: 1.2 }}>
              Find their level.
            </div>
          </ScaleIn>
          <ScaleIn delay={18}>
            <div style={{ fontSize: 48, fontWeight: 700, color: COLOURS.teal, lineHeight: 1.2, marginTop: 8 }}>
              Free.
            </div>
          </ScaleIn>

          <div style={{ marginTop: 50 }}>
            <LevelDots colours={LEVEL_COLOURS} delay={35} size={16} gap={10} style={{ justifyContent: "center" }} />
          </div>
          <div style={{ marginTop: 35 }}>
            <CTAPill text="Link in bio" bg={COLOURS.pink} fg={COLOURS.softWhite} delay={50} />
          </div>
          <FadeUp delay={65}>
            <div style={{ fontFamily: FONTS.body, fontSize: 18, color: COLOURS.midGrey, marginTop: 20 }}>
              Free. No login. Takes 3 minutes.
            </div>
          </FadeUp>
        </div>
      </Sequence>
    </div>
  );
};
