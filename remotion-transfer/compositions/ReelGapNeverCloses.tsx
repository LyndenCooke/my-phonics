import React from "react";
import { Img, staticFile, Sequence } from "remotion";
import { COLOURS, LEVEL_COLOURS, FONTS } from "../lib/theme";
import { FadeUp, ScaleIn, LevelDots, CTAPill, Watermark } from "../lib/animations";

/**
 * Reel 02: "Reading problems don't sort themselves out"
 * ~45 seconds at 30fps = 1350 frames
 */
export const ReelGapNeverCloses: React.FC = () => {
  return (
    <div style={{
      width: 1080, height: 1920, position: "relative", overflow: "hidden",
      background: COLOURS.deepBlack, fontFamily: FONTS.heading,
    }}>
      <Img src={staticFile("gemini-raw/gem_02_confident_reader_v2.png")}
        style={{ width: 1080, height: 1080, objectFit: "cover", position: "absolute", bottom: 0, opacity: 0.55 }} />

      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(12,12,18,0.95) 0%, rgba(12,12,18,0.65) 55%, rgba(12,12,18,0.3) 100%)",
      }} />

      <Watermark style={{ position: "absolute", top: 30, right: 40 }} />

      {/* 0–5s: Hook */}
      <Sequence from={0} durationInFrames={210}>
        <div style={{ position: "absolute", top: 220, left: 60, right: 60 }}>
          <FadeUp delay={5}>
            <div style={{ fontSize: 50, fontWeight: 700, color: COLOURS.softWhite, lineHeight: 1.2 }}>
              Reading problems
            </div>
          </FadeUp>
          <FadeUp delay={20}>
            <div style={{ fontSize: 50, fontWeight: 700, color: COLOURS.pink, lineHeight: 1.2, marginTop: 8 }}>
              don't sort themselves out.
            </div>
          </FadeUp>
        </div>
      </Sequence>

      {/* 7–15s: Problem */}
      <Sequence from={210} durationInFrames={300}>
        <div style={{ position: "absolute", top: 200, left: 60, right: 60 }}>
          <FadeUp delay={0}>
            <div style={{ fontSize: 42, fontWeight: 700, color: COLOURS.softWhite, lineHeight: 1.3 }}>
              Parents assume they'll catch up. Teachers hope the next year will fix it.
            </div>
          </FadeUp>
          <FadeUp delay={30}>
            <div style={{ fontSize: 42, fontWeight: 700, color: COLOURS.amber, lineHeight: 1.3, marginTop: 20 }}>
              It doesn't work like that.
            </div>
          </FadeUp>
          <FadeUp delay={55}>
            <div style={{ fontFamily: FONTS.body, fontSize: 25, color: COLOURS.lightGrey, lineHeight: 1.5, marginTop: 30 }}>
              The research is clear: children who are behind in reading at six are still behind at fourteen. The gap widens.
            </div>
          </FadeUp>
        </div>
      </Sequence>

      {/* 15–28s: Why it matters */}
      <Sequence from={510} durationInFrames={390}>
        <div style={{ position: "absolute", top: 200, left: 60, right: 60 }}>
          <FadeUp delay={0}>
            <div style={{ fontSize: 42, fontWeight: 700, color: COLOURS.softWhite, lineHeight: 1.3 }}>
              The fix isn't more reading time.
            </div>
          </FadeUp>
          <FadeUp delay={20}>
            <div style={{ fontSize: 42, fontWeight: 700, color: COLOURS.blue, lineHeight: 1.3, marginTop: 12 }}>
              It's reading the right thing at the right level.
            </div>
          </FadeUp>
          <FadeUp delay={50}>
            <div style={{ fontFamily: FONTS.body, fontSize: 24, color: COLOURS.lightGrey, lineHeight: 1.5, marginTop: 30 }}>
              A book where every word uses sounds they already know. Where they decode, not guess. Where confidence builds because success is built in.
            </div>
          </FadeUp>
        </div>
      </Sequence>

      {/* 28–45s: Solution + CTA */}
      <Sequence from={840} durationInFrames={510}>
        <div style={{ position: "absolute", top: 250, left: 60, right: 60, textAlign: "center" }}>
          <FadeUp delay={0}>
            <div style={{ fontSize: 44, fontWeight: 700, color: COLOURS.softWhite, lineHeight: 1.2 }}>
              A British teacher built this.
            </div>
          </FadeUp>
          <FadeUp delay={18}>
            <div style={{ fontSize: 44, fontWeight: 700, color: COLOURS.green, lineHeight: 1.2, marginTop: 10 }}>
              For families like yours.
            </div>
          </FadeUp>
          <FadeUp delay={40}>
            <div style={{ fontFamily: FONTS.body, fontSize: 24, color: COLOURS.lightGrey, lineHeight: 1.5, marginTop: 30 }}>
              3-minute assessment. Free personalised book. Every word matched to their level.
            </div>
          </FadeUp>

          <div style={{ marginTop: 50 }}>
            <LevelDots colours={LEVEL_COLOURS} delay={65} size={16} gap={10} style={{ justifyContent: "center" }} />
          </div>
          <div style={{ marginTop: 35 }}>
            <CTAPill text="Link in bio" bg={COLOURS.green} fg={COLOURS.deepBlack} delay={80} />
          </div>
        </div>
      </Sequence>
    </div>
  );
};
