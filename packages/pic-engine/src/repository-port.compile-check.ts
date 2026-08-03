/**
 * Compile-time proof that `RepositoryPort` is a real, enforced contract, not just documentation.
 *
 * This file is checked by the same `tsc --noEmit` run as the rest of `packages/pic-engine` (see this
 * package's `tsconfig.json`, whose `include` covers all of `src`). It is deliberately named so it does
 * NOT match vitest's test glob (`packages/*\/src/**\/*.{test,spec}.ts` in the root `vitest.config.ts`) -
 * this file asserts nothing at runtime; the only assertion it makes is "does this file typecheck," which
 * only `tsc` can answer.
 */
import type { RepositoryPort } from "./repository-port";

/**
 * A fully-conforming stub, proving a correct implementation is assignable to `RepositoryPort`. If this
 * stopped compiling, `RepositoryPort`'s shape changed in a way incompatible with this proof file, and the
 * proof file (not necessarily the interface) needs updating.
 */
const completePort: RepositoryPort = {
  getGroup: async () => null,
  saveGroup: async () => undefined,
  getPlayerSession: async () => null,
  savePlayerSession: async () => undefined,
  getOrCreateLibraryRow: async () => {
    throw new Error("compile-check only - never called");
  },
  incrementUseCount: async () => {
    throw new Error("compile-check only - never called");
  },
  appendTimelineEvent: async () => {
    throw new Error("compile-check only - never called");
  },
  promoteGuestToAccount: async () => {
    throw new Error("compile-check only - never called");
  },
  getGuestSessionGate: async () => ({
    gateTriggered: false,
    pendingFinishRequest: null,
  }),
  saveGuestSessionGate: async () => undefined,
};
void completePort;

/**
 * The actual proof: an object literal missing `promoteGuestToAccount` must fail to satisfy
 * `RepositoryPort`. If `RepositoryPort` ever loses enforcement of this method (e.g. it accidentally
 * becomes optional, or the interface is weakened), the assignment below stops producing an error,
 * `@ts-expect-error` becomes an "unused directive," and `tsc --noEmit` fails - catching the regression at
 * build time instead of leaving it merely documented in prose.
 */
// @ts-expect-error - object literal is missing `promoteGuestToAccount`, so it must not satisfy RepositoryPort.
const incompletePort: RepositoryPort = {
  getGroup: async () => null,
  saveGroup: async () => undefined,
  getPlayerSession: async () => null,
  savePlayerSession: async () => undefined,
  getOrCreateLibraryRow: async () => {
    throw new Error("compile-check only - never called");
  },
  incrementUseCount: async () => {
    throw new Error("compile-check only - never called");
  },
  appendTimelineEvent: async () => {
    throw new Error("compile-check only - never called");
  },
  // `promoteGuestToAccount` intentionally omitted to prove the interface is enforced.
};
void incompletePort;
