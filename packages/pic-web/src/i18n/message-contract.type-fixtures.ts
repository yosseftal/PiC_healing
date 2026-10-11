import { createMessageResolver } from "./messages";

const definitions = {
  unavailable: { params: [] },
  greeting: { params: ["name"] },
  count: { params: ["count"], plural: "count" },
} as const;
const resolve = createMessageResolver(definitions, { he: {}, en: { unavailable: "Unavailable" } }, "unavailable");

/** Compile-only contract checks: invalid calls cannot enter typed screen code. */
export function verifyMessageCallContracts() {
  resolve("he", "unavailable");
  resolve("en", "greeting", { name: "Alex" });
  resolve("he", "count", { count: 2 });
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
