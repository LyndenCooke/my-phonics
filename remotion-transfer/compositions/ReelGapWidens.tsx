import React from "react";
import {
  Img, staticFile, useCurrentFrame, useVideoConfig,
  interpolate, spring, Sequence, Audio,
} from "remotion";
import { COLOURS, LEVEL_COLOURS, FONTS } from "../lib/theme";
import { FadeUp, ScaleIn, LevelDots, CTAPill, Watermark } from "../lib/animations";

/**
 * Reel 01: "The gap doesn't close. It widens."
 * ~50 seconds at 30fps = 1500 frames
 * Audio: tts_2026-03-29T23-13-53-330Z.mp3
 */
export const ReelGapWidens: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Diverging gap animation: two lines moving apart
  const gapWidth = interpolate(frame, [300, 750], [4, 180], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <div style={{
      width: 1080, height: 1920, position: "relative", overflow: "hidden",
      background: COLOURS.deepBlack, fontFamily: FONTS.heading,
    }}>
      {/* Background image — reading gap visual */}
      <Img src={staticFile("gemini-raw/gem_05_reading_gap.png")}
        style={{
          width: 1080, height: 1080, objectFit: "cover",
          position: "absolute", bottom: 0, opacity: 0.6,
        }} />

      {/* Dark gradient overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(12,12,18,0.95) 0%, rgba(12,12,18,0.7) 50%, rgba(12,12,18,0.4) 100%)",
      }} />

      <Watermark style={{ position: "absolute", top: 30, right: 40 }} />

      {/* Section 1: 0–5s (f0–150) — Hook */}
      <Sequence from={0} durationInFrames={210}>
        <div style={{ position: "absolute", top: 200, left: 60, right: 60 }}>
          <FadeUp delay={5}>
            <div style={{ fontSize: 52, fontWeight: 700, color: COLOURS.softWhite, lineHeight: 1.2 }}>
              Let me tell you something
            </div>
          </FadeUp>
          <FadeUp delay={20}>
            <div style={{ fontSize: 52, fontWeight: 700, color: COLOURS.pink, lineHeight: 1.2, marginTop: 8 }}>
              most parents don't want to hear.
            </div>
          </FadeUp>
        </div>
      </Sequence>

      {/* Section 2: 5–12s (f150–360) — Problem statement */}
      <Sequence from={150} durationInFrames={300}>
        <div style={{ position: "absolute", top: 200, left: 60, right: 60 }}>
          <FadeUp delay={0}>
            <div style={{ fontSize: 44, fontWeight: 700, color: COLOURS.softWhite, lineHeight: 1.3 }}>
              If your child can't read properly by age six...
            </div>
          </FadeUp>
          <FadeUp delay={25}>
            <div style={{ fontSize: 44, fontWeight: 700, color: COLOURS.amber, lineHeight: 1.3, marginTop: 12 }}>
              the gap doesn't close.
            </div>
          </FadeUp>

          {/* Diverging lines visual */}
          <FadeUp delay={45}>
            <div style={{ marginTop: 50, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div style={{
                width: 320, height: 4, background: COLOURS.green, borderRadius: 2,
                transform: `translateY(-${gapWidth / 2}px)`,
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{
                width: 320, height: 4, background: COLOURS.pink, borderRadius: 2,
                transform: `translateY(${gapWidth / 2}px)`,
              }} />
            </div>
            <div style={{ textAlign: "center", marginTop: gapWidth / 2 + 30 }}>
              <span style={{ fontFamily: FONTS.body, fontSize: 22, color: COLOURS.midGrey }}>
                It widens. Every year. Every stage.
              </span>
            </div>
          </FadeUp>
        </div>
      </Sequence>

      {/* Section 3: 15–25s (f450–750) — Evidence + emotion */}
      <Sequence from={450} durationInFrames={360}>
        <div style={{ position: "absolute", top: 200, left: 60, right: 60 }}>
          <FadeUp delay={0}>
            <div style={{ fontSize: 42, fontWeight: 700, color: COLOURS.softWhite, lineHeight: 1.3 }}>
              They fall behind in reading.
            </div>
          </FadeUp>
          <FadeUp delay={20}>
            <div style={{ fontSize: 42, fontWeight: 700, color: COLOURS.softWhite, lineHeight: 1.3, marginTop: 8 }}>
              Then writing. Then every subject
            </div>
          </FadeUp>
          <FadeUp delay={35}>
            <div style={{ fontSize: 42, fontWeight: 700, color: COLOURS.pink, lineHeight: 1.3, marginTop: 8 }}>
              that depends on reading.
            </div>
          </FadeUp>
          <FadeUp delay={60}>
            <div style={{ fontFamily: FONTS.body, fontSize: 26, color: COLOURS.lightGrey, lineHeight: 1.5, marginTop: 40 }}>
              And by the time anyone notices, the window where it was easiest to fix has closed.
            </div>
          </FadeUp>
        </div>
      </Sequence>

      {/* Section 4: 25–38s (f750–1140) — Solution */}
      <Sequence from={750} durationInFrames={420}>
        <div style={{ position: "absolute", top: 180, left: 60, right: 60 }}>
          <FadeUp delay={0}>
            <div style={{ fontSize: 40, fontWeight: 700, color: COLOURS.softWhite, lineHeight: 1.3 }}>
              That's why a British teacher
            </div>
          </FadeUp>
          <FadeUp delay={15}>
            <div style={{ fontSize: 40, fontWeight: 700, color: COLOURS.green, lineHeight: 1.3, marginTop: 8 }}>
              built a reading system
            </div>
          </FadeUp>
          <FadeUp delay={28}>
            <div style={{ fontSize: 40, fontWeight: 700, color: COLOURS.softWhite, lineHeight: 1.3, marginTop: 8 }}>
              that finds their exact level first.
            </div>
          </FadeUp>

          <FadeUp delay={55}>
            <div style={{ fontFamily: FONTS.body, fontSize: 24, color: COLOURS.lightGrey, lineHeight: 1.5, marginTop: 36 }}>
              A 3-minute assessment. Then a free personalised book where every word is matched to what they already know.
            </div>
          </FadeUp>

          <FadeUp delay={80}>
            <div style={{ fontFamily: FONTS.body, fontSize: 24, color: COLOURS.teal, lineHeight: 1.5, marginTop: 20 }}>
              Not a guess. Not a hope. Matched.
            </div>
          </FadeUp>
        </div>
      </Sequence>

      {/* Section 5: 38–50s (f1140–1500) — CTA */}
      <Sequence from={1140} durationInFrames={360}>
        <div style={{ position: "absolute", top: 300, left: 60, right: 60, textAlign: "center" }}>
          <ScaleIn delay={0}>
            <div style={{ fontSize: 48, fontWeight: 700, color: COLOURS.softWhite, lineHeight: 1.2 }}>
              Find their reading level.
            </div>
          </ScaleIn>
          <ScaleIn delay={20}>
            <div style={{ fontSize: 48, fontWeight: 700, color: COLOURS.green, lineHeight: 1.2, marginTop: 10 }}>
              Free.
            </div>
          </ScaleIn>

          <div style={{ marginTop: 50 }}>
            <LevelDots colours={LEVEL_COLOURS} delay={40} size={16} gap={10}
              style={{ justifyContent: "center" }} />
          </div>

          <div style={{ marginTop: 40 }}>
            <CTAPill text="Link in bio" bg={COLOURS.green} fg={COLOURS.deepBlack} delay={55} />
          </div>

          <FadeUp delay={70}>
            <div style={{ fontFamily: FONTS.body, fontSize: 18, color: COLOURS.midGrey, marginTop: 20 }}>
              Free. No login. Takes 3 minutes.
            </div>
          </FadeUp>
        </div>
      </Sequence>

      {/* Audio — uncomment when audio file is in public/ */}
      {/* <Audio src={staticFile("audio/reel_01.mp3")} /> */}
    </div>
  );
};
