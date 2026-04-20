import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { COLORS, FONTS } from "../styles";

/**
 * Scene 3 of "The Headline" ad.
 * The flip: "The solution isn't more books. It's the RIGHT books."
 * Transitions from problem to solution.
 */
export const NewsFlipScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // "The solution isn't more books" - struck through
  const wrongOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const strikeWidth = interpolate(frame, [25, 45], [0, 100], {
    extrapolateRight: "clamp",
  });

  // "It's the RIGHT books" - springs in
  const rightScale = spring({
    frame: frame - 40,
    fps,
    config: { damping: 10, stiffness: 100 },
  });
  const rightOpacity = interpolate(frame, [40, 55], [0, 1], {
    extrapolateRight: "clamp",
  });

  // "Matched to exactly what they can decode" - bottom line
  const matchedOpacity = interpolate(frame, [65, 80], [0, 1], {
    extrapolateRight: "clamp",
  });
  const matchedY = interpolate(frame, [65, 80], [30, 0], {
    extrapolateRight: "clamp",
  });

  // Level colour dots animation
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
      {/* Wrong approach - struck through */}
      <div
        style={{
          opacity: wrongOpacity,
          position: "relative",
          marginBottom: 50,
        }}
      >
        <p
          style={{
            fontFamily: FONTS.heading,
            fontSize: 44,
            color: COLORS.mutedText,
            margin: 0,
            textAlign: "center",
          }}
        >
          "Just read more books"
        </p>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            width: `${strikeWidth}%`,
            height: 4,
            background: COLORS.newsRed,
            borderRadius: 2,
          }}
        />
      </div>

      {/* Right approach */}
      <div
        style={{
          opacity: rightOpacity,
          transform: `scale(${Math.max(0.1, rightScale)})`,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily: FONTS.heading,
            fontSize: 64,
            fontWeight: 800,
            color: COLORS.white,
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          The{" "}
          <span
            style={{
              color: COLORS.green,
              textDecoration: "underline",
              textDecorationColor: COLORS.green,
              textUnderlineOffset: 8,
            }}
          >
            right
          </span>{" "}
          books.
        </h1>
      </div>

      {/* Matched line */}
      <p
        style={{
          fontFamily: FONTS.body,
          fontSize: 36,
          color: COLORS.mutedText,
          opacity: matchedOpacity,
          transform: `translateY(${matchedY}px)`,
          margin: 0,
          marginTop: 40,
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        Matched to exactly what
        <br />
        they can decode
      </p>

      {/* Level colour dots */}
      <div
        style={{
          display: "flex",
          gap: 20,
          marginTop: 50,
        }}
      >
        {levelColors.map((color, i) => {
          const dotScale = spring({
            frame: frame - 75 - i * 5,
            fps,
            config: { damping: 8, stiffness: 150 },
          });
          return (
            <div
              key={i}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: color,
                transform: `scale(${Math.max(0, dotScale)})`,
                boxShadow: `0 0 15px ${color}66`,
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
