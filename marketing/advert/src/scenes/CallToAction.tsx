import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import "./CallToAction.css";

export const CallToAction: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo animation
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  const logoRotate = interpolate(frame, [0, 30], [-5, 0], {
    extrapolateRight: "clamp",
  });

  // Tagline
  const taglineOpacity = interpolate(frame, [30, 60], [0, 1], {
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [30, 60], [30, 0], {
    extrapolateRight: "clamp",
  });

  // Website
  const websiteOpacity = interpolate(frame, [70, 100], [0, 1], {
    extrapolateRight: "clamp",
  });
  const websiteScale = spring({
    frame: frame - 70,
    fps,
    config: { damping: 10, stiffness: 120 },
  });

  // Final pulse
  const pulse = Math.sin(frame / 8) * 0.03 + 1;

  // Particle effect
  const particles = Array.from({ length: 20 }, (_, i) => ({
    x: Math.sin(i * 0.5 + frame / 30) * 400 + 960,
    y: Math.cos(i * 0.7 + frame / 25) * 300 + 540,
    size: 4 + Math.sin(i + frame / 10) * 2,
    opacity: 0.3 + Math.sin(i * 2 + frame / 15) * 0.2,
  }));

  return (
    <AbsoluteFill className="absoluteFill">
      {/* Floating particles */}
      {particles.map((p, i) => {
        const particleStyle = {
          "--left": `${p.x}px`,
          "--top": `${p.y}px`,
          "--width": `${p.size}px`,
          "--height": `${p.size}px`,
          "--opacity": p.opacity,
        } as React.CSSProperties;

        return (
          <div
            key={i}
            className="particle"
            // eslint-disable-next-line react/no-inline-styles
            style={particleStyle}
          />
        );
      })}

      {/* Logo / Brand */}
      {(() => {
        const logoStyle = {
          "--transform": `scale(${logoScale * pulse}) rotate(${logoRotate}deg)`,
        } as React.CSSProperties;

        return (
          <div
            className="logoContainer"
            // eslint-disable-next-line react/no-inline-styles
            style={logoStyle}
          >
            {/* Book icon with window */}
            <div className="iconRow">
              <div className="icon">📖</div>
              <div className="separator" />
              <div className="icon">🌍</div>
            </div>

            <h1 className="title">MyPhonicsBooks</h1>
          </div>
        );
      })()}

      {/* Tagline */}
      {(() => {
        const taglineStyle = {
          "--opacity": taglineOpacity,
          "--transform": `translateY(${taglineY}px)`,
        } as React.CSSProperties;

        return (
          <p
            className="tagline"
            // eslint-disable-next-line react/no-inline-styles
            style={taglineStyle}
          >
            Decodable phonics books.{" "}
            <span className="highlight">An open window to the world.</span>
          </p>
        );
      })()}

      {/* Website CTA */}
      {(() => {
        const websiteStyle = {
          "--opacity": websiteOpacity,
          "--transform": `scale(${Math.max(0.1, websiteScale)})`,
        } as React.CSSProperties;

        return (
          <div
            className="websiteCta"
            // eslint-disable-next-line react/no-inline-styles
            style={websiteStyle}
          >
            <div className="ctaButton">
              <p className="ctaText">Start your child's journey today</p>
            </div>
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};
