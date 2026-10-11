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
          : resolveMessage(locale, key);
        expect(resolved.fallback).toBe(false);
      }
    }
  });
});
