import { locks } from "node:worker_threads";

// jsdom has no Web Locks implementation. Exercise the real Node lock manager in unit tests.
if (typeof navigator !== "undefined" && !navigator.locks) {
  Object.defineProperty(navigator, "locks", { configurable: true, value: locks });
}
