import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
      ],
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
