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
  const scene1 = Math.min(frame / (fps * 3), 1);
  const scene2 = Math.max(0, Math.min((frame - fps * 3) / (fps * 4), 1));
  const scene3 = Math.max(0, Math.min((frame - fps * 7) / (fps * 5), 1));
  const scene4 = Math.max(0, Math.min((frame - fps * 12) / (fps * 3), 1));

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(135deg, #fef3c7 0%, #dbeafe 100%)",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {scene1 > 0 && scene2 === 0 && (
        <div style={{
          position: "absolute", width: "100%", height: "100%",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          opacity: scene1,
        }}>
          <span style={{ fontSize: 170, marginBottom: 30 }}>❓</span>
          <h2 style={{ fontSize: 84, fontWeight: 700, color: SLATE_900 }}>Still guessing?</h2>
        </div>
      )}

      {scene2 > 0 && scene3 === 0 && (
        <div style={{
          position: "absolute", width: "100%", height: "100%",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          opacity: scene2,
        }}>
          <h2 style={{ fontSize: 68, fontWeight: 700, color: SLATE_900, textAlign: "center" }}>
            Wrong level =<br />
            <span style={{ color: LEVEL_COLOURS[1] }}>frustration</span>
          </h2>
        </div>
      )}

      {scene3 > 0 && scene4 === 0 && (
        <div style={{
          position: "absolute", width: "100%", height: "100%",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          opacity: scene3,
        }}>
          <div style={{
            background: WHITE, padding: "35px 55px", borderRadius: 22,
            boxShadow: "0 18px 55px rgba(0,0,0,0.1)", marginBottom: 45,
          }}>
            <h3 style={{ fontSize: 58, fontWeight: 700, color: SLATE_900, marginBottom: 15 }}>
              3-minute assessment
            </h3>
            <p style={{ fontSize: 40, color: INDIGO, textAlign: "center", margin: 0 }}>
              Exact level matched
            </p>
          </div>
        </div>
      )}

      {scene4 > 0 && (
        <div style={{
          position: "absolute", width: "100%", height: "100%",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          opacity: scene4,
        }}>
          <div style={{ display: "flex", gap: -30, marginBottom: 55 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{
                transform: `translateY(${i===2 ? -30 : 10}px) rotate(${(i-2)*5}deg)`,
                zIndex: i===2 ? 10 : 1,
              }}>
                <BookCover level={i as 1|2|3} title={`Level ${i}`} width={180} height={250} />
              </div>
            ))}
          </div>
          <div style={{
            background: `linear-gradient(135deg, ${INDIGO}, #4f46e5)`,
            padding: "24px 48px", borderRadius: 16,
          }}>
            <span style={{ color: WHITE, fontSize: 44, fontWeight: 700 }}>
              3 free books + community →
            </span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
