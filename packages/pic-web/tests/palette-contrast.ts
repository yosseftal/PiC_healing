import { expect, type Locator } from "@playwright/test";

/** Measure computed foregrounds against ancestor surfaces, including sRGB gradient samples and alpha. */
export async function expectReadable(locator: Locator, boundaries = false, focus = false) {
  const results = await locator.evaluateAll((elements, options) => {
    type Color = [number, number, number, number];
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true })!;
    const color = (value: string): Color => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      const data = context.getImageData(0, 0, 1, 1).data;
      return [data[0]!, data[1]!, data[2]!, data[3]! / 255];
    };
    const over = (front: Color, back: Color): Color => [
      front[0] * front[3] + back[0] * (1 - front[3]),
      front[1] * front[3] + back[1] * (1 - front[3]),
      front[2] * front[3] + back[2] * (1 - front[3]), 1,
    ];
    const luminance = (value: Color) => {
      const channels = value.slice(0, 3).map((channel) => {
        const unit = channel / 255;
        return unit <= 0.04045 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
      });
      return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
    };
    const contrast = (a: Color, b: Color) => {
      const first = luminance(a), second = luminance(b);
      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
    };
    const backgrounds = (element: Element | null): Color[] => {
      if (element === null) return [[255, 255, 255, 1]];
      const style = getComputedStyle(element);
      const parents = backgrounds(element.parentElement);
      const base = color(style.backgroundColor);
      const stops = style.backgroundImage.match(/(?:rgba?|color)\([^)]*\)/g)?.map(color);
      if (!stops) return parents.map((parent) => over(base, parent));
      // Current token gradients have two opaque sRGB stops. Include their interior, not just the endpoints.
      const start = stops[0]!, end = stops[stops.length - 1]!;
      return parents.flatMap((parent) => [0, 0.25, 0.5, 0.75, 1].map((position) => {
        const sample: Color = [
          start[0] + (end[0] - start[0]) * position, start[1] + (end[1] - start[1]) * position,
          start[2] + (end[2] - start[2]) * position, start[3] + (end[3] - start[3]) * position,
        ];
        return over(sample, over(base, parent));
      }));
    };
    return elements.filter((element) => element.checkVisibility()
      && !element.closest('[aria-hidden="true"], :disabled')).map((element) => {
      const style = getComputedStyle(element);
      const inside = backgrounds(element), outside = backgrounds(element.parentElement);
      const ink = color(style.color), border = color(style.borderTopColor), outline = color(style.outlineColor);
      return {
        label: `${element.tagName}: ${element.textContent?.trim().slice(0, 50)}`,
        text: Math.min(...inside.map((surface) => contrast(over(ink, surface), surface))),
        boundary: options.boundaries ? Math.max(
          Math.min(...inside.map((surface) => contrast(over(border, surface), surface))),
          Math.min(...outside.map((surface) => contrast(over(border, surface), surface))),
        ) : null,
        focus: options.focus ? Math.min(...outside.map((surface) => contrast(over(outline, surface), surface))) : null,
        outlineWidth: Number.parseFloat(style.outlineWidth),
      };
    });
  }, { boundaries, focus });
  expect(results.length).toBeGreaterThan(0);
  for (const result of results) {
    expect(result.text, `${result.label} text`).toBeGreaterThanOrEqual(4.5);
    if (result.boundary !== null) expect(result.boundary, `${result.label} boundary`).toBeGreaterThanOrEqual(3);
    if (result.focus !== null) {
      expect(result.outlineWidth).toBeGreaterThanOrEqual(3);
      expect(result.focus, `${result.label} focus`).toBeGreaterThanOrEqual(3);
    }
  }
}
