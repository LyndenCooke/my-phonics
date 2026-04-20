import React from "react";
import { Img, staticFile, Sequence, useCurrentFrame, interpolate } from "remotion";
import { COLOURS, LEVEL_COLOURS, FONTS } from "../lib/theme";
import { FadeUp, ScaleIn, CountUp, LevelDots, CTAPill, Watermark } from "../lib/animations";

/**
 * Reel 03: "You don't need more reading time. You need the right reading."
 * ~45 seconds at 30fps = 1350 frames
 */
export const ReelTenMinutes: React.FC = () => {
  return (
    <div style={{
      width: 1080, height: 1920, position: "relative", overflow: "hidden",
      background: COLOURS.deepBlack, fontFamily: FONTS.heading,
    }}>
      <Img src={staticFile("gemini-raw/gem_06_ten_minutes.png")}
        style={{ width: 1080, height: 1080, objectFit: "cover", position: "absolute", bottom: 0, opacity: 0.55 }} />

      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(12,12,18,0.95) 0%, rgba(12,12,18,0.65) 55%, rgba(12,12,18,0.3) 100%)",
      }} />

      <Watermark style={{ position: "absolute", top: 30, right: 40 }} colour="rgba(59,130,246,0.9)" />

      {/* 0–4s: Hook */}
      <Sequence from={0} durationInFrames={180}>
        <div style={{ position: "absolute", top: 220, left: 60, right: 60 }}>
          <FadeUp delay={5}>
            <div style={{ fontSize: 50, fontWeight: 700, color: COLOURS.softWhite, lineHeight: 1.2 }}>
              You don't need more reading time.
            </div>
          </FadeUp>
          <FadeUp delay={22}>
            <div style={{ fontSize: 50, fontWeight: 700, color: COLOURS.blue, lineHeight: 1.2, marginTop: 12 }}>
              You need the right reading.
            </div>
          </FadeUp>
        </div>
      </Sequence>

      {/* 4–14s: Problem */}
      <Sequence from={120} durationInFrames={360}>
        <div style={{ position: "absolute", top: 200, left: 60, right: 60 }}>
          <FadeUp delay={0}>
            <div style={{ fontSize: 40, fontWeight: 700, color: COLOURS.softWhite, lineHeight: 1.3 }}>
              Most children spend an hour a day looking at words they can't actually decode.
            </div>
          </FadeUp>
          <FadeUp delay={25}>
            <div style={{ fontSize: 40, fontWeight: 700, color: COLOURS.pink, lineHeight: 1.3, marginTop: 16 }}>
              They guess. They memorise pictures. They fake it.
            </div>
          </FadeUp>
          <FadeUp delay={55}>
            <div style={{ fontSize: 36, fontWeight: 700, color: COLOURS.softWhite, lineHeight: 1.3, marginTop: 30 }}>
              And parents think they're reading.
            </div>
          </FadeUp>
          <ScaleIn delay={72}>
            <div style={{ fontSize: 48, fontWeight: 700, color: COLOURS.pink, marginTop: 16 }}>
              They're not.
            </div>
          </ScaleIn>
        </div>
      </Sequence>

      {/* 14–25s: Contrarian flip */}
      <Sequence from={420} durationInFrames={360}>
        <div style={{ position: "absolute", top: 200, left: 60, right: 60 }}>
          <FadeUp delay={0}>
            <div style={{ fontSize: 40, fontWeight: 700, color: COLOURS.softWhite, lineHeight: 1.3 }}>
              Ten minutes of the right reading
            </div>
          </FadeUp>
          <FadeUp delay={18}>
            <div style={{ fontSize: 40, fontWeight: 700, color: COLOURS.blue, lineHeight: 1.3, marginTop: 8 }}>
              beats an hour of guessing.
            </div>
          </FadeUp>

          {/* Clock graphic: 10 > 60 */}
          <div style={{ display: "flex", alignItems: "center", gap: 30, marginTop: 50, justifyContent: "center" }}>
            <ScaleIn delay={35}>
              <div style={{
                fontSize: 72, fontWeight: 700, color: COLOURS.midGrey,
                textDecoration: "line-through", textDecorationColor: COLOURS.pink,
              }}>60</div>
            </ScaleIn>
            <FadeUp delay={45}>
              <div style={{ fontSize: 36, color: COLOURS.midGrey }}>→</div>
            </FadeUp>
            <ScaleIn delay={50}>
              <div style={{ fontSize: 72, fontWeight: 700, color: COLOURS.blue }}>10</div>
            </ScaleIn>
          </div>

          <FadeUp delay={65}>
            <div style={{ fontFamily: FONTS.body, fontSize: 24, color: COLOURS.lightGrey, textAlign: "center", marginTop: 20 }}>
              minutes. Every word matched to their level.
            </div>
          </FadeUp>
        </div>
      </Sequence>

      {/* 25–36s: 73% stat + assessment */}
      <Sequence from={750} durationInFrames={330}>
        <div style={{ position: "absolute", top: 200, left: 60, right: 60 }}>
          <FadeUp delay={0}>
            <div style={{ fontSize: 40, fontWeight: 700, color: COLOURS.softWhite, lineHeight: 1.3 }}>
              But you have to know their level first.
            </div>
          </FadeUp>
          <ScaleIn delay={20}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 30 }}>
              <div style={{ fontSize: 80, fontWeight: 700, color: COLOURS.pink }}>
                <CountUp target={73} suffix="%" startFrame={25} duration={25} />
              </div>
              <div style={{ fontFamily: FONTS.body, fontSize: 26, color: COLOURS.lightGrey }}>
                of parents don't.
              </div>
            </div>
          </ScaleIn>
          <FadeUp delay={60}>
            <div style={{ fontFamily: FONTS.body, fontSize: 24, color: COLOURS.lightGrey, lineHeight: 1.5, marginTop: 30 }}>
              A 3-minute assessment fixes it. You find their exact level. They get a free book matched to it.
            </div>
          </FadeUp>
        </div>
      </Sequence>

      {/* 36–45s: CTA */}
      <Sequence from={1080} durationInFrames={270}>
        <div style={{ position: "absolute", top: 280, left: 60, right: 60, textAlign: "center" }}>
          <FadeUp delay={0}>
            <div style={{ fontSize: 42, fontWeight: 700, color: COLOURS.softWhite, lineHeight: 1.2 }}>
              Real reading. Not pretend reading.
            </div>
          </FadeUp>
          <FadeUp delay={18}>
            <div style={{ fontFamily: FONTS.body, fontSize: 28, color: COLOURS.amber, marginTop: 16 }}>
              But only if you start between 4 and 6.
            </div>
          </FadeUp>

          <div style={{ marginTop: 60 }}>
            <LevelDots colours={LEVEL_COLOURS} delay={40} size={16} gap={10} style={{ justifyContent: "center" }} />
          </div>
          <div style={{ marginTop: 35 }}>
            <CTAPill text="Link in bio" bg={COLOURS.blue} fg={COLOURS.softWhite} delay={55} />
          </div>
        </div>
      </Sequence>
    </div>
  );
};
