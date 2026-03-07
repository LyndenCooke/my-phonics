import { useCurrentFrame } from "remotion";
import { AbsoluteFill } from "remotion";
import React from "react";
import { BookCover, LEVEL_COLOURS } from "../components/BookCover";

const SLATE_900 = "#0f172a";
const WHITE = "#ffffff";
const INDIGO = "#312e81";
const AMBER = "#F59E0B";

export const HookTheGap: React.FC = () => {
  const frame = useCurrentFrame();
  const fps = 30;
  const progress = frame / (fps * 15);

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {progress < 0.53 && (
        <div style={{
          display: "flex", width: "100%", height: "100%",
          opacity: progress < 0.53 ? 1 : 0,
        }}>
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            background: "#e2e8f0",
            opacity: Math.min(progress * 3.75, 1),
          }}>
            <div style={{
              width: 220, height: 300, background: "#cbd5e1", borderRadius: 12,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 40,
            }}>
              <span style={{ fontSize: 90 }}>📖</span>
            </div>
            <p style={{ fontSize: 32, fontWeight: 600, color: SLATE_900, textAlign: "center" }}>
              Phonics-perfect<br />but boring
            </p>
          </div>

          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            background: "#fefce8",
            opacity: progress > 0.13 ? Math.min((progress - 0.13) * 3.75, 1) : 0,
          }}>
            <div style={{
              width: 220, height: 300, background: AMBER, borderRadius: 12,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 40,
            }}>
              <span style={{ fontSize: 90 }}>🌍</span>
            </div>
            <p style={{ fontSize: 32, fontWeight: 600, color: SLATE_900, textAlign: "center" }}>
              Beautiful stories<br />but too hard
            </p>
          </div>
        </div>
      )}

      {progress >= 0.53 && progress < 0.8 && (
        <div style={{
          position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <h2 style={{ fontSize: 68, fontWeight: 700, color: SLATE_900 }}>Why not both?</h2>
        </div>
      )}

      {progress >= 0.53 && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex", flexDirection: "column", alignItems: "center",
          opacity: progress > 0.8 ? (progress - 0.8) * 5 : 0,
        }}>
          <div style={{ marginBottom: 40 }}>
            <BookCover
              level={1}
              title="The solution"
              width={260}
              height={360}
            />
          </div>
          <div style={{
            background: `linear-gradient(135deg, ${INDIGO}, #4f46e5)`,
            padding: "22px 44px", borderRadius: 14,
          }}>
            <span style={{ color: WHITE, fontSize: 42, fontWeight: 700 }}>3 free books →</span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
