import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { COLORS, FONTS } from "../styles";

/**
 * Scene 2 of "The Headline" ad.
 * Delivers the context: "The government declared 2026 the National Year of Reading.
 * That's how serious this is."
 */
export const NewsContextScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Line 1: "The government just declared..."
  const line1Opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const line1Y = interpolate(frame, [0, 20], [40, 0], {
    extrapolateRight: "clamp",
  });

  // Bold year "2026"
  const yearScale = spring({
    frame: frame - 25,
    fps,
    config: { damping: 10, stiffness: 120 },
  });

  // Line 2: "National Year of Reading"
  const line2Opacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Line 3: "That's how bad it is."
  const line3Opacity = interpolate(frame, [65, 80], [0, 1], {
    extrapolateRight: "clamp",
  });
  const line3Scale = spring({
    frame: frame - 65,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Subtle red underline animation
  const underlineWidth = interpolate(frame, [80, 100], [0, 100], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: COLORS.darkBgGradient,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: 80,
      }}
    >
      {/* Line 1 */}
      <p
        style={{
          fontFamily: FONTS.body,
          fontSize: 38,
          color: COLORS.mutedText,
          opacity: line1Opacity,
          transform: `translateY(${line1Y}px)`,
          margin: 0,
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        The government just declared
      </p>

      {/* Year + Title */}
      <div
        style={{
          marginTop: 30,
          textAlign: "center",
          opacity: line2Opacity,
        }}
      >
        <h1
          style={{
            fontFamily: FONTS.heading,
            fontSize: 72,
            fontWeight: 800,
            color: COLORS.white,
            margin: 0,
            lineHeight: 1.3,
            transform: `scale(${Math.max(0.1, yearScale)})`,
          }}
        >
          <span style={{ color: COLORS.amber }}>2026</span>
          <br />
          the National Year
          <br />
          of Reading
        </h1>
      </div>

      {/* Line 3: The punch */}
      <div
        style={{
          marginTop: 60,
          opacity: line3Opacity,
          transform: `scale(${Math.max(0.1, line3Scale)})`,
          textAlign: "center",
          position: "relative",
        }}
      >
        <p
          style={{
            fontFamily: FONTS.heading,
            fontSize: 48,
            fontWeight: 700,
            color: COLORS.white,
            margin: 0,
          }}
        >
          That's how serious this is.
        </p>
        {/* Red underline */}
        <div
          style={{
            position: "absolute",
            bottom: -10,
            left: "50%",
            transform: "translateX(-50%)",
            width: `${underlineWidth}%`,
            height: 4,
            background: COLORS.newsRed,
            borderRadius: 2,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
