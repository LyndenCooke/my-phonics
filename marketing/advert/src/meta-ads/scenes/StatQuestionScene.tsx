import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { COLORS, FONTS } from "../styles";

/**
 * Scene 2 of "The Stat" ad.
 * "Do you know if yours would pass?"
 * Then transitions to the solution: free assessment.
 */
export const StatQuestionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Question text
  const questionOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const questionScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  // Question mark animation
  const qMarkScale = spring({
    frame: frame - 20,
    fps,
    config: { damping: 6, stiffness: 120 },
  });

  // Divider
  const dividerWidth = interpolate(frame, [35, 50], [0, 60], {
    extrapolateRight: "clamp",
  });

  // Solution line 1
  const sol1Opacity = interpolate(frame, [50, 65], [0, 1], {
    extrapolateRight: "clamp",
  });
  const sol1Y = interpolate(frame, [50, 65], [30, 0], {
    extrapolateRight: "clamp",
  });

  // Solution line 2
  const sol2Opacity = interpolate(frame, [65, 80], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Checkmarks
  const checks = [
    { text: "UK phonics curriculum", delay: 75 },
    { text: "Exact level in 3 minutes", delay: 85 },
    { text: "Books matched to their level", delay: 95 },
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
      {/* Question */}
      <div
        style={{
          opacity: questionOpacity,
          transform: `scale(${Math.max(0.1, questionScale)})`,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            fontFamily: FONTS.heading,
            fontSize: 56,
            fontWeight: 800,
            color: COLORS.white,
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          Would yours pass?
        </h1>

        {/* Animated question mark */}
        <div
          style={{
            transform: `scale(${Math.max(0, qMarkScale)})`,
            marginTop: 20,
          }}
        >
          <span
            style={{
              fontFamily: FONTS.heading,
              fontSize: 100,
              fontWeight: 900,
              color: COLORS.amber,
            }}
          >
            ?
          </span>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          width: `${dividerWidth}%`,
          height: 2,
          background: "linear-gradient(90deg, transparent, #475569, transparent)",
          margin: "40px 0",
        }}
      />

      {/* Solution */}
      <div
        style={{
          opacity: sol1Opacity,
          transform: `translateY(${sol1Y}px)`,
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: FONTS.heading,
            fontSize: 44,
            fontWeight: 700,
            color: COLORS.white,
            margin: 0,
          }}
        >
          Find out in{" "}
          <span style={{ color: COLORS.amber }}>3 minutes</span>
        </h2>
      </div>

      {/* Checkmarks */}
      <div
        style={{
          marginTop: 40,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          alignItems: "flex-start",
        }}
      >
        {checks.map((check, i) => {
          const checkOpacity = interpolate(frame, [check.delay, check.delay + 12], [0, 1], {
            extrapolateRight: "clamp",
          });
          const checkX = interpolate(frame, [check.delay, check.delay + 12], [-30, 0], {
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 15,
                opacity: checkOpacity,
                transform: `translateX(${checkX}px)`,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: COLORS.green,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  color: "white",
                  fontWeight: 700,
                }}
              >
                ✓
              </div>
              <p
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 30,
                  color: COLORS.white,
                  margin: 0,
                }}
              >
                {check.text}
              </p>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
