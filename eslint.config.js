import js from "@eslint/js";
import globals from "globals";
import html from "@html-eslint/eslint-plugin";
import htmlParser from "@html-eslint/parser";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "playwright-report/**", "test-results/**"],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.js", "tests/**/*.js", "*.config.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        control: "readonly",
        display: "readonly",
      },
    },
  },
  {
    files: ["**/*.html"],
    plugins: { "@html-eslint": html },
    languageOptions: { parser: htmlParser },
    rules: {
      "@html-eslint/require-img-alt": "error",
      "@html-eslint/require-lang": "error",
      "@html-eslint/require-doctype": "error",
      "@html-eslint/no-duplicate-id": "error",
      "@html-eslint/no-duplicate-attrs": "error",
      "@html-eslint/use-baseline": "warn",
    },
  },
  prettier,
];
