import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { COLORS, FONTS } from "../styles";

/**
 * Scene 2 of "The Myth" ad.
 * Busts the myth: "Wrong level books don't build confidence. They kill it."
 * Then reveals the better way.
 */
export const MythBustScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // "Wrong." stamp effect
  const stampScale = spring({
    frame: frame - 5,
    fps,
    config: { damping: 8, stiffness: 200 },
  });
  const stampRotation = interpolate(frame, [5, 15], [-15, -5], {
    extrapolateRight: "clamp",
  });

  // Explanation text
  const explainOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateRight: "clamp",
  });
  const explainY = interpolate(frame, [20, 40], [30, 0], {
    extrapolateRight: "clamp",
  });

  // Kill word emphasis
  const killScale = spring({
    frame: frame - 45,
    fps,
    config: { damping: 8, stiffness: 150 },
  });

  // Divider line
  const dividerWidth = interpolate(frame, [55, 70], [0, 80], {
    extrapolateRight: "clamp",
  });

  // Solution text
  const solutionOpacity = interpolate(frame, [70, 90], [0, 1], {
    extrapolateRight: "clamp",
  });
  const solutionY = interpolate(frame, [70, 90], [30, 0], {
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
      {/* "Wrong." stamp */}
      <div
        style={{
          transform: `scale(${Math.max(0, stampScale)}) rotate(${stampRotation}deg)`,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            border: `6px solid ${COLORS.newsRed}`,
            borderRadius: 12,
            padding: "12px 40px",
          }}
        >
          <h1
            style={{
              fontFamily: FONTS.heading,
              fontSize: 64,
              fontWeight: 900,
              color: COLORS.newsRed,
              margin: 0,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            Wrong.
          </h1>
        </div>
      </div>

      {/* Explanation */}
      <div
        style={{
          opacity: explainOpacity,
          transform: `translateY(${explainY}px)`,
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: FONTS.heading,
            fontSize: 44,
            fontWeight: 600,
            color: COLORS.white,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Wrong level books don't
          <br />
          build confidence.
        </p>
        <p
          style={{
            fontFamily: FONTS.heading,
            fontSize: 52,
            fontWeight: 800,
            color: COLORS.white,
            margin: 0,
            marginTop: 20,
            transform: `scale(${Math.max(0.1, killScale)})`,
          }}
        >
          They{" "}
          <span
            style={{
              color: COLORS.newsRed,
              textDecoration: "underline",
              textDecorationColor: COLORS.newsRed,
              textUnderlineOffset: 8,
            }}
          >
            kill
          </span>{" "}
          it.
        </p>
      </div>

      {/* Divider */}
      <div
        style={{
          width: `${dividerWidth}%`,
          height: 2,
          background: "linear-gradient(90deg, transparent, #475569, transparent)",
          margin: "50px 0",
        }}
      />

      {/* Solution */}
      <div
        style={{
          opacity: solutionOpacity,
          transform: `translateY(${solutionY}px)`,
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: FONTS.heading,
            fontSize: 40,
            fontWeight: 600,
            color: COLORS.white,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Every word matched to
          <br />
          <span style={{ color: COLORS.green, fontWeight: 800 }}>
            exactly what they can decode
          </span>
        </p>
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 32,
            color: COLORS.mutedText,
            margin: 0,
            marginTop: 20,
          }}
        >
          Their name. Their level. Their book.
        </p>
      </div>
    </AbsoluteFill>
  );
};
