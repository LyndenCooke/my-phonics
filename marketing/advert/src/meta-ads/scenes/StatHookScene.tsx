import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { COLORS, FONTS } from "../styles";

/**
 * Scene 1 of "The Stat" ad.
 * Giant number fills the screen as a pattern interrupt.
 * "20%" then "of Year 1 children failed the phonics check"
 */
export const StatHookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Number counter animation (counts from 0 to 20)
  const count = Math.min(
    20,
    Math.floor(interpolate(frame, [0, 25], [0, 20], { extrapolateRight: "clamp" }))
  );

  // Number scale bounce
  const numberScale = spring({
    frame: frame - 25,
    fps,
    config: { damping: 8, stiffness: 100 },
  });

  // Context text
  const contextOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: "clamp",
  });
  const contextY = interpolate(frame, [30, 50], [40, 0], {
    extrapolateRight: "clamp",
  });

  // Red flash on impact
  const flashOpacity = frame >= 25 && frame <= 30
    ? interpolate(frame, [25, 30], [0.3, 0], { extrapolateRight: "clamp" })
    : 0;

  // Subtle background pulse
  const bgPulse = frame > 25 ? 0.05 + Math.sin((frame - 25) / 12) * 0.02 : 0;

  return (
    <AbsoluteFill
      style={{
        background: COLORS.darkBgGradient,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      {/* Red flash overlay */}
      <AbsoluteFill
        style={{
          background: COLORS.newsRed,
          opacity: flashOpacity,
        }}
      />

      {/* Circular background glow */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.newsRed}${Math.floor(bgPulse * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
        }}
      />

      {/* Giant number */}
      <div
        style={{
          transform: `scale(${frame < 25 ? 1 : Math.max(0.8, numberScale)})`,
        }}
      >
        <h1
          style={{
            fontFamily: FONTS.heading,
            fontSize: 220,
            fontWeight: 900,
            color: COLORS.white,
            margin: 0,
            lineHeight: 1,
            textAlign: "center",
          }}
        >
          {count}
          <span style={{ color: COLORS.newsRed }}>%</span>
        </h1>
      </div>

      {/* Context text */}
      <div
        style={{
          opacity: contextOpacity,
          transform: `translateY(${contextY}px)`,
          textAlign: "center",
          marginTop: 30,
          padding: "0 80px",
        }}
      >
        <p
          style={{
            fontFamily: FONTS.heading,
            fontSize: 40,
            fontWeight: 600,
            color: COLORS.mutedText,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          of Year 1 children
          <br />
          <span style={{ color: COLORS.white, fontWeight: 700 }}>
            failed the phonics check
          </span>
        </p>
      </div>
    </AbsoluteFill>
  );
};
