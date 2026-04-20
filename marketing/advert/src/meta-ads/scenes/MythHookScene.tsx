import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { COLORS, FONTS } from "../styles";

/**
 * Scene 1 of "The Myth" ad.
 * Opens with common parent belief in a speech bubble style,
 * then agitates with the truth.
 */
export const MythHookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Speech bubble scales in
  const bubbleScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  // Quote text
  const quoteOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateRight: "clamp",
  });

  // "Every parent thinks this" label
  const labelOpacity = interpolate(frame, [25, 40], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: COLORS.lightBgGradient,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: 80,
      }}
    >
      {/* "Every parent thinks this" */}
      <p
        style={{
          fontFamily: FONTS.body,
          fontSize: 28,
          color: "#94a3b8",
          margin: 0,
          marginBottom: 40,
          opacity: labelOpacity,
          textTransform: "uppercase",
          letterSpacing: 3,
          fontWeight: 600,
        }}
      >
        Every parent thinks this
      </p>

      {/* Speech bubble */}
      <div
        style={{
          transform: `scale(${bubbleScale})`,
          background: COLORS.white,
          borderRadius: 30,
          padding: "60px 70px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
          border: "3px solid #e2e8f0",
          position: "relative",
          maxWidth: 850,
        }}
      >
        {/* Quote marks */}
        <span
          style={{
            position: "absolute",
            top: 20,
            left: 30,
            fontFamily: "Georgia, serif",
            fontSize: 100,
            color: "#e2e8f0",
            lineHeight: 1,
          }}
        >
          "
        </span>

        <p
          style={{
            fontFamily: FONTS.heading,
            fontSize: 52,
            fontWeight: 700,
            color: COLORS.darkText,
            margin: 0,
            textAlign: "center",
            opacity: quoteOpacity,
            lineHeight: 1.4,
          }}
        >
          They just need to
          <br />
          <span style={{ color: COLORS.blue }}>read more</span>
        </p>

        {/* Closing quote */}
        <span
          style={{
            position: "absolute",
            bottom: 10,
            right: 30,
            fontFamily: "Georgia, serif",
            fontSize: 100,
            color: "#e2e8f0",
            lineHeight: 1,
          }}
        >
          "
        </span>
      </div>
    </AbsoluteFill>
  );
};
