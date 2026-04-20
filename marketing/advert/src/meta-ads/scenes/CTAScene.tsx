import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { COLORS, FONTS } from "../styles";

/**
 * Shared CTA scene used across all ad variants.
 * "Find their level in 3 minutes. Free."
 * Includes animated CTA button and 3 free books mention.
 */
export const CTAScene: React.FC<{
  headline?: string;
  subline?: string;
  buttonText?: string;
}> = ({
  headline = "Find their level",
  subline = "3-minute assessment. 3 free books.",
  buttonText = "Start free assessment",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo / brand entrance
  const brandScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  // Headline
  const headlineOpacity = interpolate(frame, [15, 35], [0, 1], {
    extrapolateRight: "clamp",
  });
  const headlineY = interpolate(frame, [15, 35], [30, 0], {
    extrapolateRight: "clamp",
  });

  // Subline
  const sublineOpacity = interpolate(frame, [35, 55], [0, 1], {
    extrapolateRight: "clamp",
  });

  // CTA button
  const buttonScale = spring({
    frame: frame - 50,
    fps,
    config: { damping: 10, stiffness: 120 },
  });

  // Button pulse
  const pulse = frame > 70 ? 1 + Math.sin((frame - 70) / 8) * 0.03 : 1;

  // "Zero risk" badge
  const badgeOpacity = interpolate(frame, [65, 80], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Level colour bar at bottom
  const levelColors = [
    COLORS.pink,
    COLORS.amber,
    COLORS.green,
    COLORS.blue,
    COLORS.purple,
    COLORS.teal,
  ];

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
      {/* Brand name */}
      <div
        style={{
          transform: `scale(${brandScale})`,
          marginBottom: 50,
        }}
      >
        <h2
          style={{
            fontFamily: FONTS.heading,
            fontSize: 42,
            fontWeight: 800,
            color: COLORS.white,
            margin: 0,
            letterSpacing: -1,
          }}
        >
          My
          <span style={{ color: COLORS.blue }}>Phonics</span>
          Books
        </h2>
      </div>

      {/* Headline */}
      <h1
        style={{
          fontFamily: FONTS.heading,
          fontSize: 72,
          fontWeight: 800,
          color: COLORS.white,
          margin: 0,
          textAlign: "center",
          opacity: headlineOpacity,
          transform: `translateY(${headlineY}px)`,
          lineHeight: 1.2,
        }}
      >
        {headline}
      </h1>

      {/* Subline */}
      <p
        style={{
          fontFamily: FONTS.body,
          fontSize: 34,
          color: COLORS.mutedText,
          margin: 0,
          marginTop: 30,
          textAlign: "center",
          opacity: sublineOpacity,
          lineHeight: 1.5,
        }}
      >
        {subline}
      </p>

      {/* CTA Button */}
      <div
        style={{
          marginTop: 60,
          transform: `scale(${Math.max(0, buttonScale) * pulse})`,
        }}
      >
        <div
          style={{
            background: COLORS.ctaGradient,
            padding: "28px 60px",
            borderRadius: 20,
            boxShadow: "0 15px 40px rgba(99, 102, 241, 0.4)",
          }}
        >
          <p
            style={{
              fontFamily: FONTS.heading,
              fontSize: 36,
              fontWeight: 700,
              color: COLORS.white,
              margin: 0,
            }}
          >
            {buttonText} →
          </p>
        </div>
      </div>

      {/* Zero risk badge */}
      <div
        style={{
          marginTop: 30,
          opacity: badgeOpacity,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: COLORS.green,
          }}
        />
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 24,
            color: COLORS.green,
            margin: 0,
          }}
        >
          Free. No card needed.
        </p>
      </div>

      {/* Level colour bar at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          display: "flex",
          height: 8,
        }}
      >
        {levelColors.map((color, i) => {
          const barWidth = interpolate(frame, [80 + i * 3, 90 + i * 3], [0, 100], {
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={i}
              style={{
                flex: 1,
                background: color,
                width: `${barWidth}%`,
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
