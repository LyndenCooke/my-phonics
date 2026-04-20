import React from "react";
import { Img, staticFile } from "remotion";
import { COLOURS, LEVEL_COLOURS, FONTS } from "../lib/theme";
import { FadeUp, LevelDots, CTAPill, Watermark, GlassPanel } from "../lib/animations";

/** Feed 14: "Built by a British teacher. Used by families worldwide." */
export const FeedSocialProof: React.FC = () => {
  const quotes = [
    { text: "We live in Dubai and this is exactly what we needed.", stars: 5 },
    { text: "My daughter went from guessing to actually reading.", stars: 5 },
  ];

  return (
    <div style={{ width: 1080, height: 1080, position: "relative", overflow: "hidden", background: COLOURS.deepBlack }}>
      <Img src={staticFile("gemini-raw/gem_08_social_proof_v2.png")}
        style={{ width: 1080, height: 1080, objectFit: "cover", position: "absolute" }} />

      <GlassPanel style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "50px 60px 60px", borderRadius: 0 }}>
        <Watermark colour="rgba(80,220,130,0.9)" />

        <FadeUp delay={5}>
          <div style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 42, color: COLOURS.softWhite, lineHeight: 1.25 }}>
            Built by a British teacher.
          </div>
        </FadeUp>

        <FadeUp delay={18}>
          <div style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 42, color: COLOURS.green, lineHeight: 1.25 }}>
            Used by families worldwide.
          </div>
        </FadeUp>

        {/* Quote cards */}
        <div style={{ marginTop: 30 }}>
          {quotes.map((q, i) => (
            <FadeUp key={i} delay={40 + i * 15}>
              <div style={{
                background: "rgba(22,28,35,0.85)", borderRadius: 12,
                padding: "16px 24px", marginBottom: 14,
              }}>
                <div style={{ fontFamily: FONTS.body, fontSize: 20, color: COLOURS.warmWhite, fontStyle: "italic" }}>
                  "{q.text}"
                </div>
                <div style={{ color: COLOURS.amber, fontSize: 14, marginTop: 6, letterSpacing: 2 }}>
                  {"★".repeat(q.stars)}
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </GlassPanel>

      <div style={{ position: "absolute", bottom: 30, left: 60 }}>
        <LevelDots colours={LEVEL_COLOURS} delay={75} />
      </div>

      <FadeUp delay={80} style={{ position: "absolute", bottom: 70, left: 60 }}>
        <CTAPill text="Try It Free" bg={COLOURS.green} fg={COLOURS.deepBlack} delay={80} />
      </FadeUp>
    </div>
  );
};
