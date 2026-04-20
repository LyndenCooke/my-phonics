/** MyPhonicsBooks design tokens for Remotion compositions */

export const COLOURS = {
  pink: "#E84B8A",
  pinkLight: "#FF78AA",
  amber: "#F59E0B",
  green: "#22C55E",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  teal: "#14B8A6",
  softWhite: "#FCfAF5",
  warmWhite: "#FFFDF8",
  deepBlack: "#121216",
  panelDark: "rgba(12,12,18,0.78)",
  panelDarker: "rgba(12,12,18,0.85)",
  lightGrey: "#BEBEBF",
  midGrey: "#82828C",
} as const;

export const LEVEL_COLOURS = [
  COLOURS.pink,
  COLOURS.amber,
  COLOURS.green,
  COLOURS.blue,
  COLOURS.purple,
  COLOURS.teal,
];

export const FONTS = {
  heading: "Poppins, 'Plus Jakarta Sans', sans-serif",
  body: "Lato, Inter, sans-serif",
} as const;

/** Image paths relative to public/ folder */
export const GEM = (name: string) => `/gemini-raw/${name}`;
