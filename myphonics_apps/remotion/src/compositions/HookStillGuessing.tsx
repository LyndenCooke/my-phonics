import { useCurrentFrame, interpolate } from "remotion";
import { AbsoluteFill } from "remotion";
import React from "react";
import { BookCover, LEVEL_COLOURS } from "../components/BookCover";

const SLATE_900 = "#0f172a";
const WHITE = "#ffffff";
const INDIGO = "#312e81";

export const HookStillGuessing: React.FC = () => {
  const frame = useCurrentFrame();
  const fps = 30;

  const scene1End = fps * 3;
  const scene2End = fps * 7;
  const scene3End = fps * 12;
  const scene4End = fps * 15;

  const scene1 = Math.min(frame / scene1End, 1);
  const scene2 = Math.max(0, Math.min((frame - scene1End) / (scene2End - scene1End), 1));
  const scene3 = Math.max(0, Math.min((frame - scene2End) / (scene3End - scene2End), 1));
  const scene4 = Math.max(0, Math.min((frame - scene3End) / (scene4End - scene3End), 1));

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #fef3c7 0%, #dbeafe 100%)",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      {/* Scene 1: Problem (0-3s) */}
      {scene1 > 0 && scene2 === 0 && (
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            opacity: scene1,
          }}
        >
          <span style={{ fontSize: 180, marginBottom: 40 }}>❓</span>
          <h2
            style={{
              fontSize: 90,
              fontWeight: 700,
              color: SLATE_900,
              textAlign: "center",
            }}
          >
            Still guessing?
          </h2>
        </div>
      )}

      {/* Scene 2: Pain (3-7s) */}
      {scene2 > 0 && scene3 === 0 && (
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
          }}
        >
          <h2
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: SLATE_900,
              textAlign: "center",
              maxWidth: "80%",
              lineHeight: 1.2,
            }}
          >
            Wrong level =
            <br />
            <span style={{ color: LEVEL_COLOURS[1] }}>frustration</span>
          </h2>
        </div>
      )}

      {/* Scene 3: Solution (7-12s) */}
      {scene3 > 0 && scene4 === 0 && (
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            opacity: scene3,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "40px 60px",
              borderRadius: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
              marginBottom: 50,
            }}
          >
            <h3
              style={{
                fontSize: 64,
                fontWeight: 700,
                color: SLATE_900,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              3-minute assessment
            </h3>
            <p
              style={{
                fontSize: 44,
                color: INDIGO,
                textAlign: "center",
                margin: 0,
              }}
            >
              Exact level matched
            </p>
          </div>
        </div>
      )}

      {/* Scene 4: CTA (12-15s) */}
      {scene4 > 0 && (
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
          }}
        >
          <div
            style={{
              display: "flex",
              gap: -30,
              marginBottom: 60,
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  transform: `translateY(${i === 2 ? -30 : 10}px) rotate(${(i - 2) * 5}deg)`,
                  zIndex: i === 2 ? 10 : 1,
                }}
              >
                <BookCover
                  level={i as 1 | 2 | 3}
                  title={`Level ${i}`}
                  width={180}
                  height={250}
                />
              </div>
            ))}
          </div>

          <div
            style={{
              background: `linear-gradient(135deg, ${INDIGO}, #4f46e5)`,
              padding: "26px 64px",
              borderRadius: 18,
              boxShadow: `0 12px 40px ${INDIGO}40`,
            }}
          >
            <span
              style={{
                color: WHITE,
                fontSize: 50,
                fontWeight: 700,
              }}
            >
              3 free books + community →
            </span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
