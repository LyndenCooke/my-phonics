import { useCurrentFrame, interpolate, Easing } from "remotion";
import { AbsoluteFill } from "remotion";
import React from "react";
import { BookCover, OpenBook, LEVEL_COLOURS } from "../components/BookCover";

const INDIGO = "#312e81";
const SLATE_900 = "#0f172a";
const WHITE = "#ffffff";

interface HookWrongBooksProps {
  childName?: string;
}

export const HookWrongBooks: React.FC<HookWrongBooksProps> = ({
  childName = "Emma",
}) => {
  const frame = useCurrentFrame();
  const fps = 30;
  
  // Scene timings (15 seconds total = 450 frames at 30fps)
  const scene1End = fps * 3;   // 0-3s
  const scene2End = fps * 7;   // 3-7s
  const scene3End = fps * 11;  // 7-11s
  const scene4End = fps * 15;  // 11-15s

  // Scene progress calculations
  const scene1 = Math.min(frame / scene1End, 1);
  const scene2 = Math.max(0, Math.min((frame - scene1End) / (scene2End - scene1End), 1));
  const scene3 = Math.max(0, Math.min((frame - scene2End) / (scene3End - scene2End), 1));
  const scene4 = Math.max(0, Math.min((frame - scene3End) / (scene4End - scene3End), 1));

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #fef3c7 0%, #fce7f3 50%, #dbeafe 100%)",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      {/* SCENE 1: Problem (0-3s) - "Wrong books kill confidence" */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: scene1 > 0 ? (scene2 > 0 ? 1 - scene2 : 1) : 0,
          transform: `translateY(${scene2 * -50}px)`,
        }}
      >
        {/* Messy books background */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 20,
            padding: 40,
            opacity: 0.25,
            filter: "blur(3px)",
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              style={{
                background: "#cbd5e1",
                borderRadius: 8,
                transform: `rotate(${(i - 4) * 18}deg)`,
                height: i % 2 === 0 ? "65%" : "80%",
                marginTop: i % 2 === 0 ? "20%" : "10%",
              }}
            />
          ))}
        </div>

        <h1
          style={{
            fontSize: 110,
            fontWeight: 800,
            color: SLATE_900,
            textAlign: "center",
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            zIndex: 10,
            opacity: interpolate(scene1, [0, 0.3, 1], [0, 1, 1]),
            transform: `translateY(${interpolate(scene1, [0, 1], [40, 0])}px)`,
          }}
        >
          Wrong books
          <br />
          <span style={{ color: LEVEL_COLOURS[1] }}>kill confidence</span>
        </h1>
      </div>

      {/* SCENE 2: Solution (3-7s) - "Matched to exactly what they can decode" */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: scene2,
          transform: `translateY(${(1 - scene2) * 60}px) scale(${0.95 + scene2 * 0.05})`,
        }}
      >
        {/* Three MyPhonicsBooks covers using actual template */}
        <div
          style={{
            display: "flex",
            gap: -45,
            marginBottom: 70,
            transform: `scale(${0.9 + scene2 * 0.1})`,
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                transform: `translateY(${i === 2 ? -25 : 8}px) rotate(${(i - 2) * 4}deg)`,
                zIndex: i === 2 ? 10 : 1,
                opacity: interpolate(scene2, [0.2 * i, 0.2 * i + 0.4], [0, 1]),
              }}
            >
              <BookCover
                level={i as 1 | 2 | 3}
                title={i === 1 ? "Tap! Tap! Tap!" : i === 2 ? "The Night Light" : "The Big Bike Race"}
                width={220}
                height={300}
                showSpine={i !== 2}
              />
            </div>
          ))}
        </div>

        <h2
          style={{
            fontSize: 66,
            fontWeight: 700,
            color: SLATE_900,
            textAlign: "center",
            lineHeight: 1.25,
            maxWidth: "85%",
            opacity: interpolate(scene2, [0.3, 0.6], [0, 1]),
          }}
        >
          Matched to exactly
          <br />
          <span style={{ color: INDIGO }}>what they can decode</span>
        </h2>
      </div>

      {/* SCENE 3: Personalisation (7-11s) - "Their name. Their level." */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: scene3 > 0 ? (scene4 > 0 ? 1 - scene4 : 1) : 0,
          transform: `scale(${0.95 + scene3 * 0.05})`,
        }}
      >
        <div
          style={{
            marginBottom: 60,
            opacity: interpolate(scene3, [0, 0.3], [0, 1]),
          }}
        >
          <OpenBook
            level={1}
            leftPageText={`[Name] had a big fish in a tank.`}
            childName={childName}
            rightPageContent={
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: `linear-gradient(135deg, ${LEVEL_COLOURS[1]}18, ${LEVEL_COLOURS[2]}10)`,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 120 }}>🐟</span>
              </div>
            }
          />
        </div>

        <h2
          style={{
            fontSize: 76,
            fontWeight: 800,
            color: SLATE_900,
            textAlign: "center",
            lineHeight: 1.05,
            opacity: interpolate(scene3, [0.4, 0.7], [0, 1]),
          }}
        >
          <span style={{ color: LEVEL_COLOURS[1] }}>{childName}.</span>
          <br />
          Their level.
          <br />
          Their book.
        </h2>
      </div>

      {/* SCENE 4: CTA (11-15s) - "3 free books + community" */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: scene4,
          background: `radial-gradient(circle at center, ${LEVEL_COLOURS[1]}12, transparent 70%)`,
        }}
      >
        {/* Three books fanned */}
        <div
          style={{
            display: "flex",
            gap: -35,
            marginBottom: 70,
            transform: `scale(${0.85 + scene4 * 0.15})`,
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                transform: `translateY(${i === 2 ? -35 : i === 1 ? 15 : 15}px) rotate(${(i - 2) * 6}deg)`,
                zIndex: i === 2 ? 10 : 1,
                opacity: interpolate(scene4, [0.15 * i, 0.15 * i + 0.3], [0, 1]),
              }}
            >
              <BookCover
                level={i as 1 | 2 | 3}
                title={i === 1 ? "Level 1" : i === 2 ? "Level 2" : "Level 3"}
                width={200}
                height={270}
              />
            </div>
          ))}
        </div>

        <h2
          style={{
            fontSize: 80,
            fontWeight: 800,
            color: SLATE_900,
            textAlign: "center",
            lineHeight: 1.05,
            marginBottom: 35,
            opacity: interpolate(scene4, [0.3, 0.5], [0, 1]),
          }}
        >
          <span style={{ color: LEVEL_COLOURS[1] }}>3 free books</span>
          <br />
          <span style={{ fontSize: 60 }}>+ community</span>
        </h2>

        {/* CTA Button */}
        <div
          style={{
            background: `linear-gradient(135deg, ${INDIGO}, #4f46e5)`,
            padding: "26px 64px",
            borderRadius: 18,
            boxShadow: `0 12px 40px ${INDIGO}40`,
            transform: `scale(${0.9 + interpolate(scene4, [0.5, 0.8], [0, 0.1], { extrapolateRight: "clamp" })})`,
            opacity: interpolate(scene4, [0.5, 0.7], [0, 1]),
          }}
        >
          <span
            style={{
              color: WHITE,
              fontSize: 50,
              fontWeight: 700,
            }}
          >
            Get started →
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
