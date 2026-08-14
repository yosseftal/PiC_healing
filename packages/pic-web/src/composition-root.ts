/**
 * The single composition root (ticket 14, Wave 7): constructs exactly one `LocalGuestRepository` and
 * exactly one `SessionEngine` - wired to a `PlayerEngine`/`LibraryEngine`/`TimelineEngine` trio built on
 * that same adapter, since `SessionEngine`'s constructor requires a `PlayerEngine` to complete a gated
 * Finish request after promotion (ticket 09) - once, at module load time, outside any React render. ES
 * modules are cached per process, so every import of this file anywhere in the app sees the exact same
 * `guestRepository`/`sessionEngine` instances; nothing here is reconstructed by a re-render.
 *
 * **Convention (ticket 14 DoD - "no component other than this composition root imports
 * pic-adapter-local-guest or pic-adapter-supabase directly"):** this file is the *only* one in `pic-web`
 * allowed to import either adapter package. `./.dependency-cruiser.cjs` enforces this mechanically; every
 * other file reaches the currently-active `RepositoryPort` and engine instances exclusively through
 * `./session-engine-context.tsx`'s React Context, never via a direct adapter import.
 */
import { LocalGuestRepository } from "pic-adapter-local-guest";
import {
  DelegatingRepositoryPort,
  LibraryEngine,
  PlayerEngine,
  SessionEngine,
  TimelineEngine,
} from "pic-engine";
import type { GuestSnapshot, RepositoryPort } from "pic-engine";

const guestRepository = new LocalGuestRepository();
const repositoryPort: DelegatingRepositoryPort = new DelegatingRepositoryPort(guestRepository);
const libraryEngine = new LibraryEngine(repositoryPort);
const timelineEngine = new TimelineEngine(repositoryPort);
const playerEngine = new PlayerEngine(repositoryPort, libraryEngine, timelineEngine);

let authenticatedPort: RepositoryPort | null = null;

const sessionEngine = new SessionEngine(repositoryPort, playerEngine, {
  onPromotionSucceeded: () => {
    if (authenticatedPort !== null) {
      repositoryPort.swapProvider(authenticatedPort);
    }
    void guestRepository.clear();
  },
  initialGateState: guestRepository.getGuestSessionGateSync(),
});

/**
 * A `useSyncExternalStore`-compatible wrapper around a plain synchronous getter (ticket 14: "Dumb
 * Reflection... subscribing to engine state via useSyncExternalStore or equivalent"). `pic-engine` stays
 * 100% framework-agnostic by design (the spec's one Seam) - it has no event emitter, no notion of "who is
 * listening." This is the React-specific adaptation `pic-web` owns: `getSnapshot` must return a *cached,
 * stable* reference between real state changes (`useSyncExternalStore` treats a new object identity on
 * every call as "always changed", which either loops or re-renders on every pass) - the cache is only
 * refreshed inside `notify()`, called exactly when a mutation actually happened.
 */
function createExternalStore<TState>(getState: () => TState) {
  const listeners = new Set<() => void>();
  let cachedSnapshot = getState();

  return {
    getSnapshot(): TState {
      return cachedSnapshot;
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    notify(): void {
      cachedSnapshot = getState();
      for (const listener of listeners) {
        listener();
      }
    },
  };
}

const sessionEngineStore = createExternalStore(() => sessionEngine.getState());

sessionEngine.subscribe(() => sessionEngineStore.notify());

/**
 * The only way any component may trigger a `SessionEngine` mutation - each action calls straight through
 * to the real engine method. `SessionEngine` owns all `notify()` timing (including `promotionStatus:
 * 'pending'` before the RPC resolves), so these wrappers never call `sessionEngineStore.notify()` themselves.
 */
const sessionEngineActions = {
  async onFinishRequested(sessionId: string, kind: "finish" | "finishAnyway"): Promise<void> {
    await sessionEngine.onFinishRequested(sessionId, kind);
  },
  async promote(guestState: GuestSnapshot, newUserId: string): Promise<void> {
    await sessionEngine.promote(guestState, newUserId);
  },
  async discardGuestState(): Promise<void> {
    await sessionEngine.discardGuestState();
    await guestRepository.clear();
  },
};

/**
 * Registers the authenticated `RepositoryPort` and swaps the active provider after promotion succeeds
 * (Wave 7.5 adapter rebind). Call this before `sessionEngineActions.promote` so `onPromotionSucceeded` can
 * retarget every engine to the new adapter before the replayed gated Finish runs.
 */
export function swapToSupabaseAdapter(port: RepositoryPort): void {
  authenticatedPort = port;
}

/** Everything a consumer needs, handed down exactly once via `SessionEngineProvider`. */
export const compositionRoot = {
  repositoryPort,
  sessionEngineStore,
  sessionEngineActions,
};
