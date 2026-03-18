import { useCurrentFrame, interpolate } from "remotion";
import { AbsoluteFill } from "remotion";
import React from "react";
import { BookCover, OpenBook, LEVEL_COLOURS } from "../components/BookCover";

const INDIGO = "#312e81";
const SLATE_900 = "#0f172a";
const WHITE = "#ffffff";

interface Props {
  childName?: string;
}

export const HookWrongBooks: React.FC<Props> = ({ childName = "Emma" }) => {
  const frame = useCurrentFrame();
  const fps = 30;
  
  const scene1End = fps * 3;
  const scene2End = fps * 7;
  const scene3End = fps * 11;
  const scene4End = fps * 15;

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
      {/* Scene 1 */}
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
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} style={{
              background: "#cbd5e1",
              borderRadius: 8,
              transform: `rotate(${(i-4)*18}deg)`,
              height: i%2===0 ? "65%" : "80%",
              marginTop: i%2===0 ? "20%" : "10%",
            }} />
          ))}
        </div>

        <h1 style={{
          fontSize: 110,
          fontWeight: 800,
          color: SLATE_900,
          textAlign: "center",
          lineHeight: 1.05,
          zIndex: 10,
          opacity: interpolate(scene1, [0, 0.3, 1], [0, 1, 1]),
          transform: `translateY(${interpolate(scene1, [0, 1], [40, 0])}px)`,
        }}>
          Wrong books
          <br />
          <span style={{ color: LEVEL_COLOURS[1] }}>kill confidence</span>
        </h1>
      </div>

      {/* Scene 2 */}
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
          transform: `translateY(${(1-scene2)*60}px)`,
        }}
      >
        <div style={{
          display: "flex",
          gap: -45,
          marginBottom: 70,
          transform: `scale(${0.9 + scene2 * 0.1})`,
        }}>
          {[1,2,3].map(i => (
            <div key={i} style={{
              transform: `translateY(${i===2 ? -25 : 8}px) rotate(${(i-2)*4}deg)`,
              zIndex: i===2 ? 10 : 1,
              opacity: interpolate(scene2, [0.2*i, 0.2*i+0.4], [0, 1]),
            }}>
              <BookCover
                level={i as 1|2|3}
                title={i===1 ? "Tap! Tap! Tap!" : i===2 ? "The Night Light" : "The Big Bike Race"}
                width={220}
                height={300}
              />
            </div>
          ))}
        </div>

        <h2 style={{
          fontSize: 66,
          fontWeight: 700,
          color: SLATE_900,
          textAlign: "center",
          lineHeight: 1.25,
          maxWidth: "85%",
          opacity: interpolate(scene2, [0.3, 0.6], [0, 1]),
        }}>
          Matched to exactly
          <br />
          <span style={{ color: INDIGO }}>what they can decode</span>
        </h2>
      </div>

      {/* Scene 3 */}
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
        }}
      >
        <div style={{
          marginBottom: 60,
          opacity: interpolate(scene3, [0, 0.3], [0, 1]),
        }}>
          <OpenBook
            level={1}
            leftPageText="[Name] had a big fish in a tank."
            childName={childName}
          />
        </div>

        <h2 style={{
          fontSize: 76,
          fontWeight: 800,
          color: SLATE_900,
          textAlign: "center",
          lineHeight: 1.05,
          opacity: interpolate(scene3, [0.4, 0.7], [0, 1]),
        }}>
          <span style={{ color: LEVEL_COLOURS[1] }}>{childName}.</span>
          <br />Their level.<br />Their book.
        </h2>
      </div>

      {/* Scene 4 */}
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
        <div style={{
          display: "flex",
          gap: -35,
          marginBottom: 70,
        }}>
          {[1,2,3].map(i => (
            <div key={i} style={{
              transform: `translateY(${i===2 ? -35 : 15}px) rotate(${(i-2)*6}deg)`,
              zIndex: i===2 ? 10 : 1,
              opacity: interpolate(scene4, [0.15*i, 0.15*i+0.3], [0, 1]),
            }}>
              <BookCover level={i as 1|2|3} title={`Level ${i}`} width={200} height={270} />
            </div>
          ))}
        </div>

        <h2 style={{
          fontSize: 80,
          fontWeight: 800,
          color: SLATE_900,
          textAlign: "center",
          lineHeight: 1.05,
          marginBottom: 35,
        }}>
          <span style={{ color: LEVEL_COLOURS[1] }}>3 free books</span>
          <br />
          <span style={{ fontSize: 60 }}>+ community</span>
        </h2>

        <div style={{
          background: `linear-gradient(135deg, ${INDIGO}, #4f46e5)`,
          padding: "26px 64px",
          borderRadius: 18,
          boxShadow: `0 12px 40px ${INDIGO}40`,
        }}>
          <span style={{ color: WHITE, fontSize: 50, fontWeight: 700 }}>
            Get started →
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
