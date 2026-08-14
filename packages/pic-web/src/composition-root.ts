/**
 * The single composition root (ticket 14, Wave 7): constructs exactly one `LocalGuestRepository` and
 * exactly one `SessionEngine` - wired to a `PlayerEngine`/`LibraryEngine`/`TimelineEngine` trio built on
 * that same adapter, since `SessionEngine`'s constructor requires a `PlayerEngine` to complete a gated
 * Finish request after promotion (ticket 09) - once, at module load time, outside any React render. ES
 * modules are cached per process, so every import of this file anywhere in the app sees the exact same
 * `guestRepository`/`sessionEngine` instances; nothing here is reconstructed by a re-render.
 *
 * **Convention (ticket 14 DoD - "no component other than this composition root imports
 * pic-adapter-local-guest or pic-adapter-supabase directly"):** `./composition-root.ts` and
 * `./promote-path.ts` are the only files in `pic-web` allowed to import either adapter package.
 * `./.dependency-cruiser.cjs` enforces this mechanically; every other file reaches the currently-active
 * `RepositoryPort` and engine instances exclusively through `./session-engine-context.tsx`,
 * `./group-engine-context.tsx`, and `./player-engine-context.tsx` React Context boundaries, never via a
 * direct adapter import.
 */
import { LocalGuestRepository } from "pic-adapter-local-guest";
import {
  DelegatingRepositoryPort,
  GroupEngine,
  LibraryEngine,
  PlayerEngine,
  SessionEngine,
  TimelineEngine,
} from "pic-engine";
import type { Intensity, JointTreatmentMuscleTestResult, Polarity } from "pic-engine";
import type { GuestSnapshot, RepositoryPort } from "pic-engine";
import type { PlayerSession } from "pic-engine";
import {
  assembleGuestSnapshotForPendingGate,
  createSupabaseBrowserClient,
  createSupabaseRepositoryFromClient,
  promoteWithAuthenticatedRepository,
  readSupabasePublicConfigFromEnv,
  readTestUserCredentialsFromEnv,
  signInAsTestUser,
  signInAsTestUserFromEnv,
} from "./promote-path";

const guestRepository = new LocalGuestRepository();
const repositoryPort: DelegatingRepositoryPort = new DelegatingRepositoryPort(guestRepository);
const libraryEngine = new LibraryEngine(repositoryPort);
const timelineEngine = new TimelineEngine(repositoryPort);
const playerEngine = new PlayerEngine(repositoryPort, libraryEngine, timelineEngine);
const groupEngine = new GroupEngine(repositoryPort);

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

/** Composition-layer flow fact: last group created via wrapped `createDraftGroup` (Ticket 08-03). */
let activeGroupId: string | null = null;

const groupEngineStore = createExternalStore(() => ({ activeGroupId }));

/**
 * `useSyncExternalStore`-compatible cache for `RepositoryPort.getPlayerSession` reads (Ticket 08-03).
 * `getSnapshot` is synchronous; `refresh` repopulates from the shared `repositoryPort` after mutations.
 */
function createPlayerSessionStore(port: DelegatingRepositoryPort) {
  const listeners = new Set<() => void>();
  const snapshots = new Map<string, PlayerSession | null>();

  return {
    getSnapshot(sessionId: string): PlayerSession | null {
      return snapshots.get(sessionId) ?? null;
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async refresh(sessionId: string): Promise<void> {
      snapshots.set(sessionId, await port.getPlayerSession(sessionId));
      for (const listener of listeners) {
        listener();
      }
    },
  };
}

const playerSessionStore = createPlayerSessionStore(repositoryPort);

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

const groupEngineActions = {
  async createDraftGroup(name: string): Promise<string> {
    const groupId = await groupEngine.createDraftGroup(name);
    activeGroupId = groupId;
    groupEngineStore.notify();
    return groupId;
  },
  addSymptom(groupId: string, name: string): Promise<string> {
    return groupEngine.addSymptom(groupId, name);
  },
  hasPriorRating(symptomId: string): Promise<boolean> {
    return groupEngine.hasPriorRating(symptomId);
  },
  rate(symptomId: string, update: { polarity?: Polarity; intensity?: Intensity }): Promise<void> {
    return groupEngine.rate(symptomId, update);
  },
  revealPriorRating(symptomId: string): Promise<{ polarity: Polarity; intensity: Intensity } | null> {
    return groupEngine.revealPriorRating(symptomId);
  },
  setJointTreatmentMuscleTest(groupId: string, answer: JointTreatmentMuscleTestResult): Promise<void> {
    return groupEngine.setJointTreatmentMuscleTest(groupId, answer);
  },
  async finalizeGroup(groupId: string) {
    await groupEngine.finalizeGroup(groupId);
    const { setGuestFlowGroupFinalized } = await import("./guest-flow-facts");
    setGuestFlowGroupFinalized(true);
  },
};

const playerEngineActions = {
  async startSession(treatmentId: string, linkedGroupId: string | null, unitIds: string[]): Promise<string> {
    const sessionId = await playerEngine.startSession(treatmentId, linkedGroupId, unitIds);
    await playerSessionStore.refresh(sessionId);
    const { setGuestFlowPlayerSession } = await import("./guest-flow-facts");
    setGuestFlowPlayerSession(sessionId);
    return sessionId;
  },
  async advance(sessionId: string): Promise<void> {
    await playerEngine.advance(sessionId);
    await playerSessionStore.refresh(sessionId);
  },
  async jumpTo(sessionId: string, unitId: string): Promise<void> {
    await playerEngine.jumpTo(sessionId, unitId);
    await playerSessionStore.refresh(sessionId);
  },
  async respondTerminalNemar(sessionId: string, response: "yes" | "no"): Promise<void> {
    await playerEngine.respondTerminalNemar(sessionId, response);
    await playerSessionStore.refresh(sessionId);
  },
  async finish(sessionId: string): Promise<void> {
    await playerEngine.finish(sessionId);
    await playerSessionStore.refresh(sessionId);
  },
  async finishAnyway(sessionId: string): Promise<void> {
    await playerEngine.finishAnyway(sessionId);
    await playerSessionStore.refresh(sessionId);
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

/** Wave 8 ticket 08-01: promote-path actions for Persistence Gate wiring (Ticket 08-02 consumes these). */
const promotePathActions = {
  assembleGuestSnapshotForPendingGate(): Promise<GuestSnapshot | null> {
    return assembleGuestSnapshotForPendingGate(guestRepository);
  },
  createSupabaseBrowserClient,
  createSupabaseRepositoryFromClient,
  readSupabasePublicConfigFromEnv,
  readTestUserCredentialsFromEnv,
  signInAsTestUser,
  signInAsTestUserFromEnv,
  promoteWithAuthenticatedRepository(
    port: RepositoryPort,
    guestSnapshot: GuestSnapshot,
    newUserId: string,
  ): Promise<void> {
    return promoteWithAuthenticatedRepository({
      delegatingPort: repositoryPort,
      authenticatedPort: port,
      guestSnapshot,
      newUserId,
      promote: sessionEngineActions.promote.bind(sessionEngineActions),
      getPromotionStatus: () => sessionEngineStore.getSnapshot().promotionStatus,
      registerAuthenticatedPort: swapToSupabaseAdapter,
    });
  },
  /** Dev tracer stub: assemble pending gate snapshot, sign in from env, and run promotion (Ticket 08-02). */
  async promoteGuestSessionFromEnv(env: Record<string, string | undefined>): Promise<void> {
    const guestSnapshot = await assembleGuestSnapshotForPendingGate(guestRepository);
    if (guestSnapshot === null) {
      return;
    }
    const { userId, repository } = await signInAsTestUserFromEnv(env);
    await promoteWithAuthenticatedRepository({
      delegatingPort: repositoryPort,
      authenticatedPort: repository,
      guestSnapshot,
      newUserId: userId,
      promote: sessionEngineActions.promote.bind(sessionEngineActions),
      getPromotionStatus: () => sessionEngineStore.getSnapshot().promotionStatus,
      registerAuthenticatedPort: swapToSupabaseAdapter,
    });
  },
};

/** Resets composition-layer group flow pointer between tests (Ticket 08-04). */
export function resetGroupFlowFactsForTest(): void {
  activeGroupId = null;
  groupEngineStore.notify();
}

void import("./guest-flow-facts").then(({ initGuestFlowFacts }) => {
  initGuestFlowFacts({
    getActiveGroupId: () => activeGroupId,
    getSessionState: () => sessionEngine.getState(),
    subscribeToGroup: groupEngineStore.subscribe,
    subscribeToSession: sessionEngineStore.subscribe,
  });
});

const catalogActions = {
  listTreatments(): Promise<import("pic-engine").TreatmentListItem[]> {
    return repositoryPort.listTreatments();
  },
};

/** Everything a consumer needs, handed down exactly once via app-level providers. */
export const compositionRoot = {
  repositoryPort,
  groupEngine,
  playerEngine,
  sessionEngineStore,
  sessionEngineActions,
  groupEngineStore,
  groupEngineActions,
  playerSessionStore,
  playerEngineActions,
  promotePathActions,
  catalogActions,
};
