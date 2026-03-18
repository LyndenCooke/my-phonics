import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";

export const OpeningScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Window opening animation
  const windowScale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  const textOpacity = interpolate(frame, [30, 60], [0, 1], {
    extrapolateRight: "clamp",
  });

  const subtitleOpacity = interpolate(frame, [60, 90], [0, 1], {
    extrapolateRight: "clamp",
  });

  const glowIntensity = interpolate(frame, [0, 120], [0, 30]);

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      {/* Animated window frame */}
      <div
        style={{
          width: 400,
          height: 500,
          border: "8px solid #f8b500",
          borderRadius: 20,
          transform: `scale(${windowScale})`,
          boxShadow: `0 0 ${glowIntensity}px rgba(248, 181, 0, 0.6)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #87CEEB 0%, #E0F6FF 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Window panes */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: 4,
            background: "#f8b500",
            top: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            height: "100%",
            width: 4,
            background: "#f8b500",
            left: "50%",
          }}
        />

        {/* Globe emoji floating in window */}
        <div
          style={{
            fontSize: 120,
            position: "absolute",
            animation: "float 3s ease-in-out infinite",
            transform: `translateY(${Math.sin(frame / 10) * 10}px)`,
          }}
        >
          🌍
        </div>
      </div>

      {/* Main text */}
      <h1
        style={{
          fontFamily: "system-ui, sans-serif",
          fontSize: 72,
          fontWeight: 800,
          color: "white",
          marginTop: 50,
          opacity: textOpacity,
          textAlign: "center",
          textShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        Every book is a window
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontFamily: "system-ui, sans-serif",
          fontSize: 36,
          color: "#f8b500",
          opacity: subtitleOpacity,
          marginTop: 10,
          fontStyle: "italic",
        }}
      >
        Every page is a world
      </p>
    </AbsoluteFill>
  );
};
