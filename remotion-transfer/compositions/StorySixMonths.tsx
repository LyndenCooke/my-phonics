import React from "react";
import { Img, staticFile } from "remotion";
import { COLOURS, LEVEL_COLOURS, FONTS } from "../lib/theme";
import { FadeUp, ScaleIn, LevelDots, CTAPill, Watermark, GlassPanel } from "../lib/animations";

/** Story 05: "From first sounds to confident reader" — 6-month transformation */
export const StorySixMonths: React.FC = () => {
  const steps = [
    { num: "1", title: "Take the free 3-minute assessment", desc: "Find their exact reading level" },
    { num: "2", title: "Get a free book matched to their stage", desc: "Every word suited to what they know" },
    { num: "3", title: "10 minutes a day. Watch them grow.", desc: "Systematic British phonics progression" },
  ];

  return (
    <div style={{ width: 1080, height: 1920, position: "relative", overflow: "hidden", background: COLOURS.deepBlack }}>
      {/* Image in bottom portion */}
      <Img src={staticFile("gemini-raw/gem_03_level_pathway.png")}
        style={{ width: 1080, height: 1080, objectFit: "cover", position: "absolute", bottom: 0 }} />

      {/* Top panel */}
      <GlassPanel style={{ position: "absolute", top: 0, left: 0, right: 0, borderRadius: 0, padding: "60px 60px", height: 920 }}>
        <Watermark style={{ position: "relative", top: 0, right: 0, marginBottom: 30 }} colour="rgba(100,210,195,0.9)" />

        <FadeUp delay={5}>
          <div style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 46, color: COLOURS.softWhite, lineHeight: 1.2, marginTop: 20 }}>
            From first sounds to confident reader.
          </div>
        </FadeUp>

        <FadeUp delay={22}>
          <div style={{ fontFamily: FONTS.heading, fontWeight: 500, fontSize: 30, color: COLOURS.teal, lineHeight: 1.3, marginTop: 16 }}>
            Have them secure in English reading within 6 months.
          </div>
        </FadeUp>

        {/* Step cards */}
        <div style={{ marginTop: 36 }}>
          {steps.map((step, i) => (
            <FadeUp key={i} delay={45 + i * 18}>
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 18,
                background: "rgba(20,35,35,0.8)", borderRadius: 14,
                padding: "18px 22px", marginBottom: 14,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", background: COLOURS.teal,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  fontFamily: FONTS.heading, fontWeight: 700, fontSize: 22, color: COLOURS.deepBlack,
                }}>
                  {step.num}
                </div>
                <div>
                  <div style={{ fontFamily: FONTS.heading, fontWeight: 500, fontSize: 22, color: COLOURS.warmWhite }}>
                    {step.title}
                  </div>
                  <div style={{ fontFamily: FONTS.body, fontSize: 17, color: COLOURS.lightGrey, marginTop: 4 }}>
                    {step.desc}
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </GlassPanel>

      {/* Bottom CTA */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "rgba(12,12,18,0.85)", padding: "30px 60px 50px",
      }}>
        <LevelDots colours={LEVEL_COLOURS} delay={100} style={{ justifyContent: "center", marginBottom: 16 }} />
        <div style={{ display: "flex", justifyContent: "center" }}>
          <CTAPill text="Start the Free Assessment" bg={COLOURS.teal} fg={COLOURS.deepBlack} delay={105} />
        </div>
        <FadeUp delay={115}>
          <div style={{ fontFamily: FONTS.body, fontSize: 17, color: COLOURS.midGrey, textAlign: "center", marginTop: 14 }}>
            Free. 3 minutes. No login.
          </div>
        </FadeUp>
      </div>
    </div>
  );
};
