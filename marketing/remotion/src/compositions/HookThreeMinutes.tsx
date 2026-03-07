import { useCurrentFrame, interpolate } from "remotion";
import { AbsoluteFill } from "remotion";
import React from "react";
import { LEVEL_COLOURS } from "../components/BookCover";

const SLATE_900 = "#0f172a";
const WHITE = "#ffffff";
const INDIGO = "#312e81";

export const HookThreeMinutes: React.FC = () => {
  const frame = useCurrentFrame();
  const fps = 30;
  const scene1 = Math.min(frame / (fps * 3), 1);
  const scene2 = Math.max(0, Math.min((frame - fps * 3) / (fps * 4), 1));
  const scene3 = Math.max(0, Math.min((frame - fps * 7) / (fps * 5), 1));
  const scene4 = Math.max(0, Math.min((frame - fps * 12) / (fps * 3), 1));

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(135deg, #fef3c7 0%, #fce7f3 50%, #e0f2fe 100%)",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {scene1 > 0 && scene2 === 0 && (
        <div style={{
          position: "absolute", width: "100%", height: "100%",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          opacity: scene1,
        }}>
          <span style={{ fontSize: 280, fontWeight: 800, color: LEVEL_COLOURS[1], lineHeight: 1 }}>3</span>
          <span style={{ fontSize: 72, fontWeight: 700, color: SLATE_900 }}>minutes</span>
        </div>
      )}

      {scene2 > 0 && scene3 === 0 && (
        <div style={{
          position: "absolute", width: "100%", height: "100%",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          opacity: scene2,
        }}>
          <span style={{ fontSize: 160, marginBottom: 30 }}>❓</span>
          <h2 style={{ fontSize: 56, fontWeight: 700, color: SLATE_900, textAlign: "center" }}>
            Still guessing<br />their reading level?
          </h2>
        </div>
      )}

      {scene3 > 0 && scene4 === 0 && (
        <div style={{
          position: "absolute", width: "100%", height: "100%",
          display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center",
          paddingLeft: 120,
          opacity: scene3,
        }}>
          {["Sounds they know", "Sounds to practise", "Books matched"].map((text, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 20, marginBottom: 30,
              opacity: interpolate(scene3, [i*0.15, i*0.15+0.3], [0, 1]),
            }}>
              <span style={{
                width: 56, height: 56, background: LEVEL_COLOURS[i+1], borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, color: WHITE,
              }}>✓</span>
              <span style={{ fontSize: 44, fontWeight: 600, color: SLATE_900 }}>{text}</span>
            </div>
          ))}
        </div>
      )}

      {scene4 > 0 && (
        <div style={{
          position: "absolute", width: "100%", height: "100%",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          opacity: scene4,
        }}>
          <h2 style={{ fontSize: 54, fontWeight: 700, color: SLATE_900, marginBottom: 40 }}>
            Free. No card needed.
          </h2>
          <div style={{
            background: `linear-gradient(135deg, ${INDIGO}, #4f46e5)`,
            padding: "26px 52px", borderRadius: 16,
          }}>
            <span style={{ color: WHITE, fontSize: 48, fontWeight: 700 }}>Try it →</span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
