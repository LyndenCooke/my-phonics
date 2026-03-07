import { useCurrentFrame } from "remotion";
import { AbsoluteFill } from "remotion";
import React from "react";

const SLATE_900 = "#0f172a";
const WHITE = "#ffffff";
const PINK = "#E84B8A";
const AMBER = "#F59E0B";
const INDIGO = "#312e81";

export const HookTheGap: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = frame / 450;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      {/* Scene 1-2: Split screen problem */}
      {progress < 0.53 && (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            opacity: progress < 0.53 ? 1 : 0,
          }}
        >
          {/* Left: Boring phonics book */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "#e2e8f0",
              opacity: progress < 0.27 ? Math.min(progress * 3.75, 1) : 1,
            }}
          >
            <div
              style={{
                width: 240,
                height: 320,
                background: "#cbd5e1",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 40,
              }}
            >
              <span style={{ fontSize: 100 }}>📖</span>
            </div>
            <p
              style={{
                fontSize: 36,
                fontWeight: 600,
                color: SLATE_900,
                textAlign: "center",
              }}
            >
              Phonics-perfect
              <br />
              but boring
            </p>
          </div>

          {/* Right: Beautiful but hard */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "#fefce8",
              opacity:
                progress > 0.13
                  ? Math.min((progress - 0.13) * 3.75, 1)
                  : 0,
            }}
          >
            <div
              style={{
                width: 240,
                height: 320,
                background: AMBER,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 40,
              }}
            >
              <span style={{ fontSize: 100 }}>🌍</span>
            </div>
            <p
              style={{
                fontSize: 36,
                fontWeight: 600,
                color: SLATE_900,
                textAlign: "center",
              }}
            >
              Beautiful stories
              <br />
              but too hard
            </p>
          </div>
        </div>
      )}

      {/* Scene 3: The Gap */}
      {progress >= 0.53 && progress < 0.8 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <h2
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: SLATE_900,
              textAlign: "center",
              marginBottom: 60,
            }}
          >
            Why not both?
          </h2>
        </div>
      )}

      {/* Scene 4: Solution */}
      {progress >= 0.53 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            opacity: progress > 0.8 ? (progress - 0.8) * 5 : 0,
          }}
        >
          <div
            style={{
              width: 280,
              height: 380,
              background: PINK,
              borderRadius: 12,
              border: "4px solid white",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 30,
              marginBottom: 40,
            }}
          >
            <div
              style={{
                width: "100%",
                height: 180,
                background: WHITE,
                borderRadius: 8,
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 80 }}>📚</span>
            </div>
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: WHITE,
                textAlign: "center",
              }}
            >
              Phonics-perfect
            </span>
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: WHITE,
              }}
            >
              Globally-minded
            </span>
          </div>

          <div
            style={{
              background: `linear-gradient(135deg, ${INDIGO}, #4f46e5)`,
              padding: "24px 48px",
              borderRadius: 14,
            }}
          >
            <span
              style={{
                color: WHITE,
                fontSize: 44,
                fontWeight: 700,
              }}
            >
              3 free books →
            </span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
