import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";

// Cultures to showcase
const cultures = [
  { emoji: "🇬🇧", name: "London", color: "#e74c3c" },
  { emoji: "🇯🇵", name: "Tokyo", color: "#e91e63" },
  { emoji: "🇰🇪", name: "Nairobi", color: "#4caf50" },
  { emoji: "🇧🇷", name: "São Paulo", color: "#2196f3" },
  { emoji: "🇶🇦", name: "Doha", color: "#9c27b0" },
  { emoji: "🇮🇳", name: "Mumbai", color: "#ff9800" },
];

const BookCard: React.FC<{
  culture: { emoji: string; name: string; color: string };
  delay: number;
  index: number;
}> = ({ culture, delay, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardSpring = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const cardScale = Math.max(0, cardSpring);
  const rotation = interpolate(frame - delay, [0, 30], [-10, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Floating animation
  const floatY = Math.sin((frame + index * 20) / 15) * 5;

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${culture.color} 0%, ${culture.color}dd 100%)`,
        width: 250,
        height: 320,
        borderRadius: 20,
        transform: `scale(${cardScale}) rotate(${rotation}deg) translateY(${floatY}px)`,
        boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{ fontSize: 80, marginBottom: 10 }}>{culture.emoji}</div>
      <p
        style={{
          fontFamily: "system-ui, sans-serif",
          fontSize: 28,
          color: "white",
          fontWeight: 700,
          margin: 0,
        }}
      >
        {culture.name}
      </p>
      <div
        style={{
          background: "rgba(255,255,255,0.2)",
          padding: "8px 16px",
          borderRadius: 20,
          marginTop: 15,
        }}
      >
        <p
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 16,
            color: "white",
            margin: 0,
          }}
        >
          100% Decodable
        </p>
      </div>
    </div>
  );
};

export const ProductShowcase: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, 30], [-30, 0], {
    extrapolateRight: "clamp",
  });

  // Scroll effect for cards
  const scrollX = interpolate(frame, [60, 200], [0, -600], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        overflow: "hidden",
      }}
    >
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <h2
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 56,
            color: "white",
            fontWeight: 800,
            margin: 0,
          }}
        >
          One curriculum.{" "}
          <span style={{ color: "#f8b500" }}>A world of stories.</span>
        </h2>
      </div>

      {/* Scrolling cards */}
      <div
        style={{
          position: "absolute",
          top: 250,
          left: 100,
          display: "flex",
          gap: 40,
          transform: `translateX(${scrollX}px)`,
        }}
      >
        {cultures.map((culture, i) => (
          <BookCard
            key={culture.name}
            culture={culture}
            delay={20 + i * 15}
            index={i}
          />
        ))}
      </div>

      {/* Phonics example at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 30,
          opacity: interpolate(frame, [100, 130], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        <PhonicsWord word="c-a-t" delay={100} />
        <PhonicsWord word="sh-o-p" delay={115} />
        <PhonicsWord word="m-ar-k-e-t" delay={130} />
      </div>
    </AbsoluteFill>
  );
};

const PhonicsWord: React.FC<{ word: string; delay: number }> = ({
  word,
  delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 10, stiffness: 150 },
  });

  return (
    <div
      style={{
        background: "rgba(248, 181, 0, 0.2)",
        border: "3px solid #f8b500",
        padding: "15px 30px",
        borderRadius: 15,
        transform: `scale(${Math.max(0, scale)})`,
      }}
    >
      <p
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: 32,
          color: "#f8b500",
          margin: 0,
          fontWeight: 700,
          letterSpacing: 4,
        }}
      >
        {word}
      </p>
    </div>
  );
};
