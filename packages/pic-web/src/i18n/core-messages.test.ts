import { describe, expect, it } from "vitest";
import { dictionaries, messageDefinitions, resolveMessage } from "./core-messages";
import { validateMessages } from "./messages";

describe("required approved shared utility messages", () => {
  it("has complete parameter-correct Hebrew and English dictionaries without required-key fallback", () => {
    expect(validateMessages(messageDefinitions, dictionaries)).toEqual([]);
    for (const locale of ["he", "en"] as const) {
      for (const key of Object.keys(messageDefinitions) as (keyof typeof messageDefinitions)[]) {
        const resolved = key === "player.navigationEntry"
          ? resolveMessage(locale, key, { unit: "unit-1", state: "In view" })
          : key === "rating.prior" || key === "summary.rating"
          ? resolveMessage(locale, key, { polarity: "Positive", intensity: 8, maximum: 10 })
          : key === "symptom.count" || key === "summary.count"
          ? resolveMessage(locale, key, { count: 2 })
          : resolveMessage(locale, key);
        expect(resolved.fallback).toBe(false);
        expect(resolved.locale).toBe(locale);
        expect(resolved.text.trim().length).toBeGreaterThan(0);
        expect(resolved.text).not.toBe(key);
        expect(resolved.text).not.toMatch(/\bpending\b|\btodo\b|\btbd\b|\{[a-zA-Z]+\}/i);
      }
    }
  });

  it("covers literal symptom-count plurals in both approved locales", () => {
    expect([0, 1, 2, 10].map((count) => resolveMessage("en", "symptom.count", { count }).text))
      .toEqual(["0 symptoms in this group", "1 symptom in this group", "2 symptoms in this group", "10 symptoms in this group"]);
    expect([0, 1, 2, 10].map((count) => resolveMessage("he", "symptom.count", { count }).text))
      .toEqual(["0 סימפטומים בקבוצה", "סימפטום 1 בקבוצה", "2 סימפטומים בקבוצה", "10 סימפטומים בקבוצה"]);
    expect([0, 1, 2, 10].map((count) => resolveMessage("en", "summary.count", { count }).text))
      .toEqual(["0 symptoms in this group", "1 symptom in this group", "2 symptoms in this group", "10 symptoms in this group"]);
    expect([0, 1, 2, 10].map((count) => resolveMessage("he", "summary.count", { count }).text))
      .toEqual(["0 סימפטומים בקבוצה", "סימפטום 1 בקבוצה", "2 סימפטומים בקבוצה", "10 סימפטומים בקבוצה"]);
  });
});
