import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/coverage/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        fetch: "readonly",
        URL: "readonly",
      },
    },
  },
  {
    // `.cjs` files (e.g. tool configs like `.dependency-cruiser.cjs`) are CommonJS by their own file
    // extension, even though the rest of this workspace is `"type": "module"` - without these globals
    // ESLint's `no-undef` rule flags `module`/`require` as undefined.
    files: ["**/*.cjs"],
    languageOptions: {
      globals: {
        module: "readonly",
        exports: "writable",
        require: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
  },
);
