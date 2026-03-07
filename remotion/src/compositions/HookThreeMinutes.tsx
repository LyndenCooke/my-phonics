import { useCurrentFrame, interpolate } from "remotion";
import { AbsoluteFill } from "remotion";
import React from "react";

const LEVEL_COLOURS = {
  1: "#E84B8A",
  2: "#F59E0B",
  3: "#22C55E",
  4: "#3B82F6",
  5: "#8B5CF6",
  6: "#14B8A6",
};

const SLATE_900 = "#0f172a";
const WHITE = "#ffffff";

export const HookThreeMinutes: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = frame / 450;

  const scene1 = Math.min(progress * 7.5, 1);
  const scene2 = Math.max(0, Math.min((progress - 0.133) * 7.5, 1));
  const scene3 = Math.max(0, Math.min((progress - 0.267) * 7.5, 1));
  const scene4 = Math.max(0, Math.min((progress - 0.667) * 2.5, 1));

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #fefce8 0%, #fdf2f8 50%, #e0f2fe 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Scene 1: "3 minutes" */}
      {scene1 > 0 && !scene2 && (
        <div
          style={{
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            opacity: scene1,
            transform: `scale(${0.8 + scene1 * 0.2})`,
          }}
        >
          <span
            style={{
              fontSize: 300,
              fontWeight: 800,
              color: LEVEL_COLOURS[1],
              lineHeight: 1,
            }}
          >
            3
          </span>
          <span
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: SLATE_900,
              marginTop: -20,
            }}
          >
            minutes
          </span>
        </div>
      )}

      {/* Scene 2: Problem */}
      {scene2 > 0 && !scene3 && (
        <div
          style={{
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            opacity: scene2,
            transform: `translateX(${(1 - scene2) * 100}px)`,
          }}
        >
          <span style={{ fontSize: 200 }}>❓</span>
          <h2
            style={{
              fontSize: 60,
              fontWeight: 700,
              color: SLATE_900,
              textAlign: "center",
              marginTop: 40,
              maxWidth: "80%",
              lineHeight: 1.3,
            }}
          >
            Still guessing
            <br />
            their reading level?
          </h2>
        </div>
      )}

      {/* Scene 3: Solution Checklist */}
      {scene3 > 0 && !scene4 && (
        <div
          style={{
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            opacity: scene3,
            transform: `translateX(${(1 - scene3) * -50}px)`,
          }}
        >
          {[
            "Sounds they know",
            "Sounds to practise",
            "Books matched",
          ].map((text, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                marginBottom: 30,
                opacity: Math.max(0, (scene3 - i * 0.2) / 0.8),
                transform: `translateX(${(1 - Math.max(0, (scene3 - i * 0.2) / 0.8)) * 50}px)`,
              }}
            >
              <span
                style={{
                  width: 60,
                  height: 60,
                  background: LEVEL_COLOURS[i + 1],
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                  color: WHITE,
                }}
              >
                ✓
              </span>
              <span
                style={{
                  fontSize: 48,
                  fontWeight: 600,
                  color: SLATE_900,
                }}
              >
                {text}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Scene 4: CTA */}
      {scene4 > 0 && (
        <div
          style={{
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            opacity: scene4,
          }}
        >
          <h2
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: SLATE_900,
              textAlign: "center",
              marginBottom: 40,
            }}
          >
            Free. No card needed.
          </h2>
          <div
            style={{
              background: "linear-gradient(135deg, #312e81, #4f46e5)",
              padding: "28px 56px",
              borderRadius: 16,
            }}
          >
            <span
              style={{
                color: WHITE,
                fontSize: 52,
                fontWeight: 700,
              }}
            >
              Try it →
            </span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
