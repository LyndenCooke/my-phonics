import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Staggered text animations
  const line1Opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  const line1Y = interpolate(frame, [0, 30], [50, 0], { extrapolateRight: "clamp" });

  const line2Opacity = interpolate(frame, [30, 60], [0, 1], { extrapolateRight: "clamp" });
  const line2Y = interpolate(frame, [30, 60], [50, 0], { extrapolateRight: "clamp" });

  const vsOpacity = interpolate(frame, [70, 90], [0, 1], { extrapolateRight: "clamp" });
  const vsScale = spring({ frame: frame - 70, fps, config: { damping: 10 } });

  const line3Opacity = interpolate(frame, [100, 130], [0, 1], { extrapolateRight: "clamp" });
  const line3Y = interpolate(frame, [100, 130], [50, 0], { extrapolateRight: "clamp" });

  const strikethrough1 = interpolate(frame, [140, 160], [0, 100], { extrapolateRight: "clamp" });
  const strikethrough2 = interpolate(frame, [150, 170], [0, 100], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: 80,
      }}
    >
      {/* Two boxes side by side */}
      <div
        style={{
          display: "flex",
          gap: 60,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Left box - Phonics books */}
        <div
          style={{
            background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)",
            padding: "40px 50px",
            borderRadius: 20,
            opacity: line1Opacity,
            transform: `translateY(${line1Y}px)`,
            position: "relative",
          }}
        >
          <p
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: 32,
              color: "white",
              margin: 0,
              textAlign: "center",
            }}
          >
            📚 Decodable phonics books
          </p>
          <p
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: 24,
              color: "rgba(255,255,255,0.8)",
              margin: "15px 0 0 0",
              textAlign: "center",
            }}
          >
            Generic British settings
          </p>
          {/* Strikethrough */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              width: `${strikethrough1}%`,
              height: 4,
              background: "white",
              transform: "rotate(-5deg)",
            }}
          />
        </div>

        {/* VS */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: "#f8b500",
            opacity: vsOpacity,
            transform: `scale(${Math.max(0.1, vsScale)})`,
          }}
        >
          VS
        </div>

        {/* Right box - Diverse books */}
        <div
          style={{
            background: "linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)",
            padding: "40px 50px",
            borderRadius: 20,
            opacity: line2Opacity,
            transform: `translateY(${line2Y}px)`,
            position: "relative",
          }}
        >
          <p
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: 32,
              color: "white",
              margin: 0,
              textAlign: "center",
            }}
          >
            🌍 Diverse children's books
          </p>
          <p
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: 24,
              color: "rgba(255,255,255,0.8)",
              margin: "15px 0 0 0",
              textAlign: "center",
            }}
          >
            Not phonics-structured
          </p>
          {/* Strikethrough */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              width: `${strikethrough2}%`,
              height: 4,
              background: "white",
              transform: "rotate(-5deg)",
            }}
          />
        </div>
      </div>

      {/* Bottom text */}
      <div
        style={{
          marginTop: 60,
          opacity: line3Opacity,
          transform: `translateY(${line3Y}px)`,
        }}
      >
        <p
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 42,
            color: "white",
            margin: 0,
            textAlign: "center",
            fontWeight: 600,
          }}
        >
          Why can't children have{" "}
          <span style={{ color: "#f8b500" }}>both</span>?
        </p>
      </div>
    </AbsoluteFill>
  );
};
