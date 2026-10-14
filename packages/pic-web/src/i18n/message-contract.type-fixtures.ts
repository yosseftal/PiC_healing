import { createMessageResolver } from "./messages";
import type { useLocale } from "./locale-provider";

const definitions = {
  unavailable: { params: [] },
  greeting: { params: ["name"] },
  count: { params: ["count"], plural: "count" },
  terminology: { params: ["count"], plural: "count", terminology: ["nemar"] },
} as const;
const resolve = createMessageResolver(definitions, { he: {}, en: { unavailable: "Unavailable" } }, "unavailable");

/** Compile-only contract checks: invalid calls cannot enter typed screen code. */
export function verifyMessageCallContracts(message: ReturnType<typeof useLocale>["message"]) {
  resolve("he", "unavailable");
  resolve("en", "greeting", { name: "Alex" });
  resolve("he", "count", { count: 2 });
  resolve("he", "terminology", { count: 2 });
  message("joint.question");
  message("player.terminalNavigationEntry", { state: "In view" });
  // @ts-expect-error The context supplies terminology; callers cannot override it.
  message("joint.question", { nemar: "replacement" });
  // @ts-expect-error Required caller parameters remain required alongside internal terminology.
  message("player.terminalNavigationEntry");
  // @ts-expect-error Terminology does not weaken plural numeric requirements.
  resolve("he", "terminology", { count: "two" });
  // @ts-expect-error Required plural parameters cannot be omitted when terminology is present.
  resolve("he", "terminology");
  // @ts-expect-error Unknown keys are not part of the canonical key set.
  resolve("en", "unknown");
  // @ts-expect-error Interpolation requires the declared parameter.
  resolve("en", "greeting");
  // @ts-expect-error Unknown parameters do not match the message contract.
  resolve("en", "greeting", { name: "Alex", extra: "unexpected" });
  // @ts-expect-error Plural counts must be numeric.
  resolve("en", "count", { count: "two" });
  // @ts-expect-error Parameter-free messages do not accept an interpolation object.
  resolve("he", "unavailable", {});
}
