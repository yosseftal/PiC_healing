// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMessageResolver, validateMessages } from "./messages";
import { LocalizedMessage } from "./localized-message";

const definitions = {
  unavailable: { params: [] },
  greeting: { params: ["name"] },
  visits: { params: ["count"], plural: "count" },
} as const;

const dictionaries = {
  he: { unavailable: "לא זמין", greeting: "שלום {name}", visits: {
    one: "{count} ביקור", two: "{count} ביקורים", other: "{count} ביקורים",
  } },
  en: { unavailable: "Text unavailable", greeting: "Welcome {name}", visits: {
    one: "{count} visit", other: "{count} visits",
  } },
};

afterEach(cleanup);

describe("typed message resolution", () => {
  it("resolves the chosen language and renders personal inserts as isolated escaped text", () => {
    const resolve = createMessageResolver(definitions, dictionaries, "unavailable");
    const message = resolve("he", "greeting", { name: '<img src=x onerror="alert(1)">' });
    render(<LocalizedMessage message={message} />);
    const output = screen.getByText(/שלום/);
    expect(output.getAttribute("lang")).toBe("he");
    expect(output.getAttribute("dir")).toBe("rtl");
    expect(output.querySelector("img")).toBeNull();
    expect(output.querySelector("bdi")?.textContent).toBe('<img src=x onerror="alert(1)">');
    expect(message.fallback).toBe(false);
    expect(validateMessages(definitions, dictionaries)).toEqual([]);
  });

  it("falls back from the selected locale to Hebrew then English with truthful message metadata", () => {
    const resolve = createMessageResolver(definitions, {
      he: dictionaries.he,
      en: { unavailable: "Text unavailable", visits: dictionaries.en.visits },
    }, "unavailable");
    expect(resolve("en", "greeting", { name: "Alex" })).toMatchObject({
      text: "שלום Alex", locale: "he", direction: "rtl", fallback: true,
    });
    const englishOnly = createMessageResolver(definitions, { he: {}, en: dictionaries.en }, "unavailable");
    expect(englishOnly("he", "greeting", { name: "Alex" })).toMatchObject({
      text: "Welcome Alex", locale: "en", direction: "ltr", fallback: true,
    });
  });

  it("uses declared locale plural variants and locale number formatting", () => {
    const resolve = createMessageResolver(definitions, dictionaries, "unavailable");
    expect(resolve("he", "visits", { count: 0 }).text).toBe("0 ביקורים");
    expect(resolve("he", "visits", { count: 1 }).text).toBe("1 ביקור");
    expect(resolve("he", "visits", { count: 2 }).text).toBe("2 ביקורים");
    expect(resolve("he", "visits", { count: 3 }).text).toBe("3 ביקורים");
    expect(resolve("he", "visits", { count: 0.5 }).text).toBe("0.5 ביקור");
    expect(resolve("he", "visits", { count: 1.5 }).text).toBe("1.5 ביקורים");
    expect(resolve("en", "visits", { count: 1.5 }).text).toBe("1.5 visits");
    expect(resolve("en", "visits", { count: 0 }).text).toBe("0 visits");
    expect(resolve("en", "visits", { count: 1 }).text).toBe("1 visit");
    expect(resolve("en", "visits", { count: 1200 }).text).toBe("1,200 visits");
  });

  it("replaces runtime defects with approved availability text and reports the defect", () => {
    const report = vi.fn();
    const resolve = createMessageResolver(definitions, dictionaries, "unavailable", report);
    // Simulate untyped input at a runtime boundary; typed callers cannot omit required parameters.
    const runtimeResolve = resolve as (locale: "he" | "en", key: string, params?: object) => ReturnType<typeof resolve>;
    for (const [key, params] of [
      ["unknown.key", {}], ["greeting", {}], ["greeting", { name: "Alex", extra: "unexpected" }],
      ["visits", { count: "two" }], ["visits", { count: NaN }], ["toString", {}],
    ] as const) {
      expect(runtimeResolve("en", key, params)).toMatchObject({ text: "Text unavailable", locale: "en", fallback: true });
    }
    expect(report).toHaveBeenCalledTimes(6);
  });

  it("rejects missing required approved keys, unknown keys, parameter mismatches and missing plural forms", () => {
    const invalidDictionaries = {
      he: { unavailable: "לא זמין", greeting: "שלום {unexpected}", visits: { one: "{count} ביקור" } },
      en: { ...dictionaries.en, unknown: "Extra" },
    };
    const defects = validateMessages(definitions, invalidDictionaries);
    expect(defects).toContain("he:greeting: missing or invalid template");
    expect(defects).toContain("he:visits:two: missing or invalid plural");
    expect(defects).toContain("he:visits:other: missing or invalid plural");
    expect(defects).toContain("en:unknown: unknown key");
    expect(validateMessages(definitions, { he: {}, en: dictionaries.en }))
      .toContain("he:greeting: missing or invalid template");
  });

  it("resolves a missing selected plural form through Hebrew with actual-language metadata", () => {
    const resolve = createMessageResolver(definitions, {
      he: dictionaries.he,
      en: { ...dictionaries.en, visits: { one: "{count} visit" } },
    }, "unavailable");
    expect(resolve("en", "visits", { count: 2 })).toMatchObject({
      text: "2 ביקורים", locale: "he", direction: "rtl", fallback: true,
    });
  });

  it("rejects plain string and malformed plural templates at runtime and uses valid fallback variants", () => {
    const plainString = createMessageResolver(definitions, {
      he: dictionaries.he, en: { ...dictionaries.en, visits: "Broken {count}" },
    }, "unavailable");
    expect(plainString("en", "visits", { count: 2 })).toMatchObject({
      text: "2 ביקורים", locale: "he", fallback: true,
    });
    const malformed = createMessageResolver(definitions, {
      he: dictionaries.he, en: { ...dictionaries.en, visits: { one: "Wrong {unapproved}", other: "{count} visits" } },
    }, "unavailable");
    expect(malformed("en", "visits", { count: 1 })).toMatchObject({ text: "1 ביקור", locale: "he", fallback: true });
  });

  it("requires an approved generic availability message when no requested template is usable", () => {
    const resolve = createMessageResolver(definitions, { he: {}, en: {} }, "unavailable");
    expect(() => resolve("en", "greeting", { name: "Alex" })).toThrow("Approved availability message is required");
  });

  it.each(["fr", "", "he_??", "he-IL", null, undefined])(
    "normalizes unsupported runtime locale %s before message lookup and numeric/plural formatting", (locale) => {
      const report = vi.fn();
      const resolve = createMessageResolver(definitions, dictionaries, "unavailable", report);
      // Simulate an untyped integration; the public Locale contract still accepts only he/en.
      const runtimeResolve = resolve as (locale: unknown, key: string, params?: object) => ReturnType<typeof resolve>;
      expect(runtimeResolve(locale, "greeting", { name: "Alex" })).toMatchObject({
        text: "שלום Alex", locale: "he", direction: "rtl", fallback: true,
      });
      expect(runtimeResolve(locale, "visits", { count: 1200 })).toMatchObject({
        text: "1,200 ביקורים", locale: "he", direction: "rtl", fallback: true,
      });
      expect(runtimeResolve(locale, "visits", { count: 0.5 }).text).toBe("0.5 ביקור");
      expect(report).toHaveBeenCalledTimes(3);
      expect(report).toHaveBeenCalledWith("Unsupported message locale");
    },
  );
});
