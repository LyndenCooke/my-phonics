import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { COLORS, FONTS } from "../styles";

/**
 * Scene 1 of "The Headline" ad.
 * Shows a fake news headline screenshot that looks like a real article,
 * creating the pattern interrupt / news-jacking hook.
 */
export const NewsHookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Red bar slides in from left
  const redBarWidth = interpolate(frame, [0, 15], [0, 100], {
    extrapolateRight: "clamp",
  });

  // "BREAKING" label fades in
  const breakingOpacity = interpolate(frame, [10, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Headline types in character by character
  const headlineText = "1 in 4 children leave primary school unable to read";
  const charsVisible = Math.floor(
    interpolate(frame, [20, 70], [0, headlineText.length], {
      extrapolateRight: "clamp",
    })
  );

  // Source line fades in
  const sourceOpacity = interpolate(frame, [65, 80], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Subtle screen shake on "unable to read"
  const shakeX =
    frame > 55 && frame < 65 ? Math.sin(frame * 3) * 3 : 0;
  const shakeY =
    frame > 55 && frame < 65 ? Math.cos(frame * 4) * 2 : 0;

  return (
    <AbsoluteFill
      style={{
        background: COLORS.darkBgGradient,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
      }}
    >
      {/* News card container */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 24,
          width: 920,
          padding: 0,
          overflow: "hidden",
          boxShadow: "0 25px 80px rgba(0,0,0,0.4)",
          transform: `translate(${shakeX}px, ${shakeY}px)`,
        }}
      >
        {/* Red accent bar at top */}
        <div
          style={{
            height: 8,
            background: COLORS.newsRed,
            width: `${redBarWidth}%`,
          }}
        />

        <div style={{ padding: "50px 60px" }}>
          {/* BREAKING label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 30,
              opacity: breakingOpacity,
            }}
          >
            <div
              style={{
                background: COLORS.newsRed,
                color: "white",
                fontFamily: FONTS.heading,
                fontSize: 22,
                fontWeight: 800,
                padding: "8px 18px",
                borderRadius: 6,
                letterSpacing: 2,
              }}
            >
              UK EDUCATION
            </div>
            <span
              style={{
                fontFamily: FONTS.body,
                fontSize: 20,
                color: "#64748b",
              }}
            >
              April 2026
            </span>
          </div>

          {/* Headline text */}
          <h1
            style={{
              fontFamily: FONTS.heading,
              fontSize: 52,
              fontWeight: 800,
              color: COLORS.darkText,
              lineHeight: 1.3,
              margin: 0,
              minHeight: 210,
            }}
          >
            {headlineText.slice(0, charsVisible)}
            {charsVisible < headlineText.length && (
              <span
                style={{
                  borderRight: "3px solid #0f172a",
                  animation: "blink 0.5s step-end infinite",
                }}
              />
            )}
          </h1>

          {/* Source line */}
          <div
            style={{
              marginTop: 30,
              paddingTop: 20,
              borderTop: "2px solid #e2e8f0",
              opacity: sourceOpacity,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: COLORS.newsRed,
              }}
            />
            <span
              style={{
                fontFamily: FONTS.body,
                fontSize: 20,
                color: "#94a3b8",
              }}
            >
              ITV News / National Literacy Trust, 2025
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
