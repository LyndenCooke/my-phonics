import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
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
