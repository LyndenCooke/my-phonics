// Shared design tokens for all Meta ad variants
export const COLORS = {
  // Backgrounds
  darkBg: "#0f172a",
  darkBgGradient: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
  lightBg: "#fafafa",
  lightBgGradient: "linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)",

  // Text
  white: "#ffffff",
  darkText: "#0f172a",
  mutedText: "#94a3b8",

  // Brand / Level colours
  pink: "#E84B8A",
  amber: "#F59E0B",
  green: "#22C55E",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  teal: "#14B8A6",

  // Accents
  red: "#EF4444",
  newsRed: "#DC2626",
  indigoViolet: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
  ctaGradient: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",

  // Overlays
  overlay: "rgba(15, 23, 42, 0.85)",
} as const;

export const FONTS = {
  heading: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
  body: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
} as const;

// 9:16 vertical video dimensions
export const META_AD_CONFIG = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationShort: 15 * 30, // 15 seconds = 450 frames
  durationLong: 30 * 30, // 30 seconds = 900 frames
} as const;
