// Proxy to parent directory's Tailwind config
// Needed because the dev server process runs from this directory
export default {
  plugins: {
    tailwindcss: { config: '../tailwind.config.ts' },
    autoprefixer: {},
  },
};
