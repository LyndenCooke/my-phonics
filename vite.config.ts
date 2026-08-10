import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import forgePlugin from "./server/forge/vitePlugin.mjs";
import worksheetForgePlugin from "./server/worksheet-forge/vitePlugin.mjs";

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => ({
  // Force production env constants whenever we're running `vite build`,
  // regardless of what NODE_ENV the host sets. Vercel was (somehow) running
  // the build with NODE_ENV=development, which made `import.meta.env.DEV`
  // evaluate to `true` and collapsed entitlement OR chains to a constant
  // `true` — unlocking every paid book for anonymous visitors. See PR #39
  // for the source-level fix; this stops it happening again for any future
  // code that references DEV/PROD/NODE_ENV.
  define: command === 'build'
    ? {
        'import.meta.env.DEV': 'false',
        'import.meta.env.PROD': 'true',
        'import.meta.env.MODE': JSON.stringify('production'),
        'process.env.NODE_ENV': JSON.stringify('production'),
      }
    : undefined,
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    watch: {
      // Playwright writes a churn of trace / screenshot / HTML report
      // files during a stress-test run. That pile drowns Vite's file
      // watcher and crashes the dev server. Exclude those directories.
      ignored: [
        "**/review/stress_test/_out/**",
        "**/review/stress_test/.playwright-artifacts-*/**",
        "**/playwright-report/**",
        "**/test-results/**",
        // Heavy non-app directories — watching these OOMs the dev server
        // (Node heap-limit crash ~50s after boot on this repo).
        "**/myphonics_books/**",
        "**/marketing/**",
        "**/PRINT_RUN_2026-07-10/**",
        "**/worksheet-engine/node_modules/**",
        "**/books/**",
        // The forge writes generated art + its file store here mid-job; a
        // watcher event on these would full-reload the wizard while it polls.
        "**/public/custom-books/**",
        "**/server/forge/.data/**",
        // The worksheet machine renders PDFs/PNGs here mid-request; a watcher
        // event would full-reload /create-worksheet while it waits.
        "**/worksheet-forge/output/**",
      ],
    },
  },
  plugins: [react(), mode === "development" && componentTagger(), forgePlugin(), worksheetForgePlugin()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
