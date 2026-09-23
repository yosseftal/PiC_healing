import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PIC_MOTION } from "./index";

const stylesheetPath = fileURLToPath(new URL("./visual-foundation.css", import.meta.url));
const stylesheet = readFileSync(stylesheetPath, "utf8");
const mainSource = readFileSync(fileURLToPath(new URL("../main.tsx", import.meta.url)), "utf8");
const viteConfig = readFileSync(fileURLToPath(new URL("../../vite.config.ts", import.meta.url)), "utf8");

function customProperty(name: string): string {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = stylesheet.match(new RegExp(`${escapedName}:\\s*([^;]+);`));
  if (match === null) {
    throw new Error(`Missing visual-foundation token: ${name}`);
  }
  return match[1].trim();
}

describe("pic-web visual foundation", () => {
  it("publishes every approved semantic token with its frozen value", () => {
    const expectedTokens: Readonly<Record<string, string>> = {
      "--color-pic-sterile": "#F7F9F5",
      "--color-pic-surface": "#FFFFFF",
      "--color-pic-sage-50": "#F2F7F1",
      "--color-pic-sage-100": "#E3EFE4",
      "--color-pic-sage-200": "#CFE1D1",
      "--color-pic-sage-500": "#7FA687",
      "--color-pic-sage-700": "#3E6749",
      "--color-pic-lavender-50": "#F7F4FB",
      "--color-pic-lavender-100": "#EFEAF7",
      "--color-pic-lavender-200": "#DDD2EE",
      "--color-pic-lavender-500": "#9B85BE",
      "--color-pic-lavender-700": "#5D477D",
      "--color-pic-ink": "#25312B",
      "--color-pic-quiet": "#56635D",
      "--color-pic-line": "#DCE4DD",
      "--color-pic-focus": "#6F568F",
      "--color-pic-focus-offset": "#F7F9F5",
      "--font-pic-sans": 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
      "--text-pic-display": "clamp(1.5rem, 1.25rem + 1vw, 2rem)",
      "--text-pic-heading": "clamp(1.25rem, 1.125rem + 0.5vw, 1.5rem)",
      "--text-pic-body": "1rem",
      "--text-pic-guidance": "1.0625rem",
      "--text-pic-quiet": "0.875rem",
      "--leading-pic-display": "1.2",
      "--leading-pic-heading": "1.3",
      "--leading-pic-body": "1.65",
      "--leading-pic-quiet": "1.5",
      "--font-weight-pic-display": "600",
      "--font-weight-pic-heading": "600",
      "--measure-pic-reading": "62ch",
      "--measure-pic-reading-max": "70ch",
      "--spacing-pic-calm-1": "8px",
      "--spacing-pic-calm-2": "12px",
      "--spacing-pic-calm-3": "16px",
      "--spacing-pic-calm-4": "24px",
      "--spacing-pic-calm-5": "32px",
      "--spacing-pic-calm-6": "48px",
      "--size-pic-touch": "44px",
      "--radius-pic-card": "24px",
      "--radius-pic-card-compact": "18px",
      "--radius-pic-button": "14px",
      "--radius-pic-pill": "9999px",
      "--focus-ring-pic-width": "3px",
      "--focus-ring-pic-offset": "2px",
      "--gradient-pic-healing":
        "linear-gradient(135deg, var(--color-pic-sage-100), var(--color-pic-lavender-100))",
      "--gradient-pic-confirmation": "linear-gradient(135deg, var(--color-pic-surface), var(--color-pic-sage-50))",
      "--gradient-pic-reflection":
        "linear-gradient(135deg, var(--color-pic-surface), var(--color-pic-lavender-50))",
      "--shadow-pic-card": "0 18px 48px rgb(37 49 43 / 0.08)",
      "--shadow-pic-sheet": "0 0 48px rgb(37 49 43 / 0.16)",
    };

    for (const [name, value] of Object.entries(expectedTokens)) {
      expect(customProperty(name), name).toBe(value);
    }
  });

  it("keeps CSS motion values aligned with typed Motion values", () => {
    expect(customProperty("--motion-pic-fast")).toBe(`${PIC_MOTION.duration.fast * 1000}ms`);
    expect(customProperty("--motion-pic-standard")).toBe(`${PIC_MOTION.duration.standard * 1000}ms`);
    expect(customProperty("--motion-pic-deliberate")).toBe(`${PIC_MOTION.duration.deliberate * 1000}ms`);
    expect(customProperty("--motion-pic-drawer")).toBe(`${PIC_MOTION.duration.drawer * 1000}ms`);
    expect(customProperty("--ease-pic-organic")).toBe(`cubic-bezier(${PIC_MOTION.ease.organic.join(", ")})`);
    expect(customProperty("--distance-pic-step")).toBe(PIC_MOTION.distance.step);
    expect(customProperty("--distance-pic-drawer")).toBe(PIC_MOTION.distance.drawer);
  });

  it("normalizes only app roots and supplies reduced-motion defaults", () => {
    expect(stylesheet).toMatch(/html,\s*body,\s*#root\s*\{[^}]*height:\s*100%;[^}]*width:\s*100%;/s);
    expect(stylesheet).toMatch(/body\s*\{[^}]*margin:\s*0;[^}]*font-family:\s*var\(--font-pic-sans\);/s);
    expect(stylesheet).not.toMatch(/body\s*\{[^}]*overflow:\s*hidden;/s);
    expect(stylesheet).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    expect(stylesheet).toMatch(/--distance-pic-step-active:\s*0px;/);
    expect(stylesheet).toMatch(/--distance-pic-drawer-active:\s*0%;/);
  });

  it("loads the Tailwind entry stylesheet through the Vite integration", () => {
    expect(stylesheet).toMatch(/^@import\s+"tailwindcss"\s+source\(none\);/);
    expect(stylesheet).toContain('@source "../";');
    expect(mainSource).toContain('import "./visual-foundation/visual-foundation.css";');
    expect(viteConfig).toContain('import tailwindcss from "@tailwindcss/vite";');
    expect(viteConfig).toMatch(/plugins:\s*\[react\(\),\s*tailwindcss\(\)\]/);
  });
});
