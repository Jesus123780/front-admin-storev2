import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,ts,jsx,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      js,
      "@typescript-eslint": tseslint.plugin,
      react: pluginReact,
      next: nextPlugin,
    },
    rules: {
      "no-console": "error",
      "no-debugger": "error",
      "react/react-in-jsx-scope": "off",
      "quotes": ["error", "single", { "avoidEscape": true }],
    },
  },
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  nextPlugin.configs.recommended,
]);
