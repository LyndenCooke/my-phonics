import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

/** Fade-and-slide-up text block */
export const FadeUp: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, duration = 20, distance = 40, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 18, mass: 0.8 } });
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateY = interpolate(progress, [0, 1], [distance, 0]);

  return (
    <div style={{ opacity, transform: `translateY(${translateY}px)`, ...style }}>
      {children}
    </div>
  );
};

/** Scale-in with slight bounce */
export const ScaleIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 12, mass: 0.6 } });
  const scale = interpolate(progress, [0, 1], [0.6, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  return (
    <div style={{ opacity, transform: `scale(${scale})`, ...style }}>
      {children}
    </div>
  );
};

/** Typing / reveal effect for a line of text */
export const TypeReveal: React.FC<{
  text: string;
  startFrame: number;
  framesPerChar?: number;
  style?: React.CSSProperties;
}> = ({ text, startFrame, framesPerChar = 1, style }) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const charsToShow = Math.min(text.length, Math.floor(elapsed / framesPerChar));

  return (
    <span style={style}>
      {text.slice(0, charsToShow)}
      <span style={{ opacity: 0 }}>{text.slice(charsToShow)}</span>
    </span>
  );
};

/** Animated counter 0 -> target */
export const CountUp: React.FC<{
  target: number;
  suffix?: string;
  startFrame?: number;
  duration?: number;
  style?: React.CSSProperties;
}> = ({ target, suffix = "", startFrame = 0, duration = 30, style }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - startFrame, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const value = Math.round(target * progress);

  return <span style={style}>{value}{suffix}</span>;
};

/** Level dots row */
export const LevelDots: React.FC<{
  colours: string[];
  delay?: number;
  size?: number;
  gap?: number;
  style?: React.CSSProperties;
}> = ({ colours, delay = 0, size = 14, gap = 8, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ display: "flex", gap, ...style }}>
      {colours.map((c, i) => {
        const d = delay + i * 3;
        const progress = spring({ frame: frame - d, fps, config: { damping: 14 } });
        const scale = interpolate(progress, [0, 1], [0, 1]);
        const opacity = interpolate(progress, [0, 1], [0, 1]);
        return (
          <div
            key={i}
            style={{
              width: size,
              height: size,
              borderRadius: "50%",
              backgroundColor: c,
              transform: `scale(${scale})`,
              opacity,
            }}
          />
        );
      })}
    </div>
  );
};

/** Glass panel overlay */
export const GlassPanel: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      background: "rgba(12,12,18,0.78)",
      borderRadius: 18,
      padding: "40px 50px",
      backdropFilter: "blur(12px)",
      ...style,
    }}
  >
    {children}
  </div>
);

/** CTA pill button */
export const CTAPill: React.FC<{
  text: string;
  bg: string;
  fg: string;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ text, bg, fg, delay = 0, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 16 } });
  const scale = interpolate(progress, [0, 1], [0.8, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  return (
    <div
      style={{
        display: "inline-block",
        background: bg,
        color: fg,
        fontFamily: "Poppins, sans-serif",
        fontWeight: 600,
        fontSize: 22,
        padding: "14px 36px",
        borderRadius: 999,
        transform: `scale(${scale})`,
        opacity,
        ...style,
      }}
    >
      {text}
    </div>
  );
};

/** Branding watermark */
export const Watermark: React.FC<{
  colour?: string;
  style?: React.CSSProperties;
}> = ({ colour = "rgba(80,220,130,0.9)", style }) => (
  <div
    style={{
      fontFamily: "Poppins, sans-serif",
      fontWeight: 500,
      fontSize: 18,
      color: colour,
      position: "absolute",
      top: 24,
      right: 40,
      ...style,
    }}
  >
    MyPhonicsBooks
  </div>
);
