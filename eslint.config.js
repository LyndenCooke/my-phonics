import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "build",
      // Claude Code worktrees — duplicate the entire codebase, so without
      // this every error gets reported 6–8 times locally.
      ".claude/**",
      // Python projects + their venvs ship .d.ts files for Playwright that
      // are not our code. The web-app CI doesn't see these because it
      // checks out a clean tree without Python.
      "myphonics_books/**",
      "myphonics_apps/**",
      // Marketing renderers and leadgen scripts have their own toolchains.
      "marketing-mockups/**",
      "marketing/**",
      "leadgen/**",
      // Build / generation scripts (often plain Node, not React).
      "scripts/**",
      // Local scratch directory.
      ".scratch/**",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // Demoted to warn: most existing usage is in catch handlers and
      // webhook payloads where typing properly is its own refactor. New
      // code should still avoid `any` — the warning keeps it visible.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
);
