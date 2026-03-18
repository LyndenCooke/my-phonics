import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";

export const UniqueValueScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animations
  const mainTextScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  const checkmark1 = interpolate(frame, [40, 60], [0, 1], {
    extrapolateRight: "clamp",
  });
  const checkmark2 = interpolate(frame, [70, 90], [0, 1], {
    extrapolateRight: "clamp",
  });

  const bottomOpacity = interpolate(frame, [100, 130], [0, 1], {
    extrapolateRight: "clamp",
  });
  const bottomScale = spring({
    frame: frame - 100,
    fps,
    config: { damping: 10, stiffness: 100 },
  });

  // Pulsing glow
  const glowIntensity = 20 + Math.sin(frame / 10) * 10;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      {/* Main statement */}
      <div
        style={{
          transform: `scale(${mainTextScale})`,
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 64,
            color: "white",
            fontWeight: 800,
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          No other product
          <br />
          does <span style={{ color: "#f8b500" }}>both</span>.
        </h2>
      </div>

      {/* Two checkmarks */}
      <div
        style={{
          display: "flex",
          gap: 80,
          marginTop: 60,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 15,
            opacity: checkmark1,
            transform: `translateX(${interpolate(
              frame,
              [40, 60],
              [-30, 0],
              { extrapolateRight: "clamp" }
            )}px)`,
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              background: "#4ecdc4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            ✓
          </div>
          <p
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: 28,
              color: "white",
              margin: 0,
            }}
          >
            Phonics accurate
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 15,
            opacity: checkmark2,
            transform: `translateX(${interpolate(
              frame,
              [70, 90],
              [30, 0],
              { extrapolateRight: "clamp" }
            )}px)`,
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              background: "#f8b500",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            ✓
          </div>
          <p
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: 28,
              color: "white",
              margin: 0,
            }}
          >
            Globally diverse
          </p>
        </div>
      </div>

      {/* Bottom emphasis */}
      <div
        style={{
          marginTop: 80,
          opacity: bottomOpacity,
          transform: `scale(${Math.max(0.1, bottomScale)})`,
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 36,
            color: "#f8b500",
            margin: 0,
            fontWeight: 600,
            textShadow: `0 0 ${glowIntensity}px rgba(248, 181, 0, 0.5)`,
          }}
        >
          We are the intersection.
        </p>
      </div>
    </AbsoluteFill>
  );
};
