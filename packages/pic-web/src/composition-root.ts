import {
  advanceInquiryGeneration, hasInquiryDraft, inquiryGenerationStore, reopenFlowOperations,
  prepareFlowSettlement, trackExclusiveFlowOperation, trackFlowOperation,
} from "./inquiry-lifecycle";
import {
  clearInquiryResetRecovery, readInquiryResetRecovery, saveInquiryResetRecovery,
  type InquiryResetRecovery,
} from "./inquiry-reset-recovery";
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
  parseStructuredMarkdown,
  PlayerEngine,
  SessionEngine,
  TimelineEngine,
} from "pic-engine";
import type { AtomicUnitContent, Intensity, JointTreatmentMuscleTestResult, Polarity, Treatment } from "pic-engine";
import type { GuestSnapshot, RepositoryPort } from "pic-engine";
import type { PlayerSession } from "pic-engine";
import {
  assembleGuestSnapshotForPendingGate,
  createSupabaseBrowserClient,
  createSupabaseRepositoryFromClient,
  promoteWithAuthenticatedRepository,
  readSupabasePublicConfigFromEnv,
  ensureOwnProfile,
  getVerifiedUser,
  signInWithCredentials,
} from "./promote-path";
import type { LoginCredentials } from "./promote-path";

const guestRepository = new LocalGuestRepository();
const repositoryPort: DelegatingRepositoryPort = new DelegatingRepositoryPort(guestRepository);
let resetRecovery = readInquiryResetRecovery();
const persistedGuestFlowFacts = resetRecovery?.facts ?? guestRepository.getGuestFlowFactsSync();
const persistedGuestGate = resetRecovery?.gate ?? guestRepository.getGuestSessionGateSync();
let pendingGuestFinishRequest = persistedGuestGate.pendingFinishRequest;
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
  initialGateState: persistedGuestGate,
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

let resetting = false;
let promotionSwitching = false;
let suppressSessionNotifications = false;
sessionEngine.subscribe(() => { if (!suppressSessionNotifications) sessionEngineStore.notify(); });

/** Composition-layer flow fact: last group created via wrapped `createDraftGroup`. */
let activeGroupId: string | null = persistedGuestFlowFacts.activeGroupId;

const groupEngineStore = createExternalStore(() => ({ activeGroupId }));

/**
 * `useSyncExternalStore`-compatible cache for `RepositoryPort.getPlayerSession` reads.
 * `getSnapshot` is synchronous; `refresh` repopulates from the shared `repositoryPort` after mutations.
 */
function createPlayerSessionStore(port: DelegatingRepositoryPort) {
  const listeners = new Set<() => void>();
  const snapshots = new Map<string, PlayerSession | null>();
  if (resetRecovery?.playerSession) snapshots.set(resetRecovery.playerSession.id, resetRecovery.playerSession);

  return {
    getSnapshot(sessionId: string): PlayerSession | null {
      return snapshots.get(sessionId) ?? null;
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    clear(): void {
      snapshots.clear();
    },
    async refresh(sessionId: string): Promise<void> {
      const generation = inquiryGenerationStore.getSnapshot();
      const session = await port.getPlayerSession(sessionId);
      if (generation !== inquiryGenerationStore.getSnapshot()) return;
      snapshots.set(sessionId, session ?? (resetRecovery?.playerSession?.id === sessionId ? resetRecovery.playerSession : null));
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
const untrackedSessionEngineActions = {
  async onFinishRequested(sessionId: string, kind: "finish" | "finishAnyway"): Promise<void> {
    // Public call arguments retain the newest intent even when the engine's gate storage write rejects.
    pendingGuestFinishRequest = sessionEngine.getState().mode === "guest" ? { sessionId, kind } : null;
    await sessionEngine.onFinishRequested(sessionId, kind);
    await playerSessionStore.refresh(sessionId);
    if (playerSessionStore.getSnapshot(sessionId)?.success_declared === true) {
      const { setGuestFlowPlayerSession } = await import("./guest-flow-facts");
      setGuestFlowPlayerSession(null);
    }
  },
  async promote(guestState: GuestSnapshot, newUserId: string): Promise<void> {
    await sessionEngine.promote(guestState, newUserId);
    if (sessionEngineStore.getSnapshot().promotionStatus === "succeeded") {
      pendingGuestFinishRequest = null;
      const { setGuestFlowPlayerSession, settleGuestFlowPersistence } = await import("./guest-flow-facts");
      setGuestFlowPlayerSession(null);
      await settleGuestFlowPersistence();
      // `setGuestFlowPlayerSession` persists via a direct `guestRepository.saveGuestFlowFacts` binding
      // (bypassing the just-swapped delegating port), which would otherwise resurrect the guest storage
      // blob that `onPromotionSucceeded` already cleared moments ago (DEC-017 "evaporate" - no guest
      // residue survives a successful promotion). Re-clearing here, last, keeps that guarantee intact.
      await guestRepository.clear();
      if (resetRecovery !== null) {
        clearInquiryResetRecovery();
        resetRecovery = null;
      }
    }
  },

};

const untrackedGroupEngineActions = {
  async createDraftGroup(name: string): Promise<string> {
    const groupId = await groupEngine.createDraftGroup(name);
    activeGroupId = groupId;
    groupEngineStore.notify();
    const { persistGuestFlowFactsNow } = await import("./guest-flow-facts");
    persistGuestFlowFactsNow();
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
  getGroup(groupId: string) {
    return repositoryPort.getGroup(groupId);
  },
  async finalizeGroup(groupId: string) {
    const result = await groupEngine.finalizeGroup(groupId);
    const { setGuestFlowGroupFinalized } = await import("./guest-flow-facts");
    setGuestFlowGroupFinalized(true);
    return result;
  },
};

const untrackedPlayerEngineActions = {
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

/** All public operations participate, including callers outside React event handlers. */
function trackedActions<T extends Record<string, (...args: never[]) => Promise<unknown>>>(
  actions: T, allowDuringPromotion = false,
): T {
  return Object.fromEntries(Object.entries(actions).map(([name, action]) => [
    name, (...args: never[]) => trackFlowOperation(() => {
      if (promotionSwitching && !allowDuringPromotion) return Promise.reject(new Error("Saving is pending"));
      return resetRecovery === null ? action(...args) :
      initialResetRecovery.then(async () => {
        await recoverPendingReset();
        return action(...args);
      });
    }),
  ])) as T;
}
const groupEngineActions = trackedActions(untrackedGroupEngineActions);
const playerEngineActions = trackedActions(untrackedPlayerEngineActions);
const sessionEngineActions = {
  ...trackedActions({ onFinishRequested: untrackedSessionEngineActions.onFinishRequested }),
  ...trackedActions({ promote: untrackedSessionEngineActions.promote }, true),
  async discardGuestState(): Promise<void> {
    await inquiryResetActions.resetInquiry(true);
  },
};

async function restoreResetRecovery(recovery: InquiryResetRecovery): Promise<void> {
  // Restore through public contracts. onFinishRequested rearms memory even if its storage write rejects.
  try {
    if (recovery.group !== null) await guestRepository.saveGroup(recovery.group);
    if (recovery.playerSession !== null) await guestRepository.savePlayerSession(recovery.playerSession);
    await guestRepository.saveGuestFlowFacts(recovery.facts);
  } finally {
    const pending = recovery.gate.pendingFinishRequest;
    pendingGuestFinishRequest = pending;
    if (pending !== null) await sessionEngine.onFinishRequested(pending.sessionId, pending.kind);
  }
}
async function recoverPendingReset(): Promise<void> {
  if (resetRecovery === null) return;
  await restoreResetRecovery(resetRecovery);
  clearInquiryResetRecovery();
  resetRecovery = null;
}
const initialResetRecovery = resetRecovery === null ? Promise.resolve() :
  recoverPendingReset().catch(() => undefined);
// Failed recovery stays in the envelope and can be retried from the Gate; never discard it on boot.

const inquiryResetActions = {
  async resetInquiry(confirmed = false): Promise<"confirmation" | "reset"> {
    if (resetting) throw new Error("Inquiry reset is already pending");
    resetting = true;
    const settleOperations = prepareFlowSettlement();
    try {
      const facts = await import("./guest-flow-facts");
      await initialResetRecovery;
      await settleOperations();
      await recoverPendingReset();
      await facts.settleGuestFlowPersistence();
      const state = sessionEngine.getState();
      const localWork = state.mode === "guest" && (
        activeGroupId !== null || facts.guestFlowFactsStore.getSnapshot().activePlayerSessionId !== null ||
        state.gateTriggered
      );
      if (!confirmed && (localWork || hasInquiryDraft())) return "confirmation";
      const previousFacts = facts.collectPersistedGuestFlowFacts();
      if (state.mode === "guest" && state.gateTriggered && resetRecovery === null) {
        const persistedGate = await repositoryPort.getGuestSessionGate();
        const gate = { gateTriggered: true,
          pendingFinishRequest: pendingGuestFinishRequest ?? persistedGate.pendingFinishRequest };
        const sessionId = gate.pendingFinishRequest?.sessionId ?? previousFacts.activePlayerSessionId;
        const playerSession = sessionId === null ? null : await repositoryPort.getPlayerSession(sessionId);
        const groupId = previousFacts.activeGroupId ?? playerSession?.linked_group_id ?? null;
        const group = groupId === null ? null : await repositoryPort.getGroup(groupId);
        const recovery = { gate, facts: previousFacts, group, playerSession };
        saveInquiryResetRecovery(recovery);
        resetRecovery = recovery;
      }
      suppressSessionNotifications = true;
      try {
        // Clear persisted pointers first, retaining the visible work until the owned blob is removed.
        await guestRepository.saveGuestFlowFacts(facts.DEFAULT_PERSISTED_GUEST_FLOW_FACTS);
        if (state.mode === "guest" && state.gateTriggered) await sessionEngine.discardGuestState();
        await guestRepository.clear();
        if (resetRecovery !== null) clearInquiryResetRecovery();
      } catch (error) {
        if (resetRecovery !== null) {
          try { await restoreResetRecovery(resetRecovery); } catch { /* Envelope retains the retry. */ }
        } else {
          await guestRepository.saveGuestFlowFacts(previousFacts);
        }
        throw error;
      }
      resetRecovery = null;
      pendingGuestFinishRequest = null;
      activeGroupId = null;
      playerSessionStore.clear();
      facts.clearGuestFlowFacts();
      groupEngineStore.notify();
      advanceInquiryGeneration();
      return "reset";
    } finally {
      reopenFlowOperations();
      resetting = false;
      const publishSession = suppressSessionNotifications;
      suppressSessionNotifications = false;
      if (publishSession) sessionEngineStore.notify();
    }
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

let browserClient: ReturnType<typeof createSupabaseBrowserClient> | null = null;
let verifiedIdentity = false;
let loginPromotion: Promise<void> | null = null;
let frozenPromotion: {
  generation: number; snapshot: GuestSnapshot; owner: string | null; kind: "finish" | "finishAnyway";
} | null = null;
const untrackedPromotePathActions = {
  assembleGuestSnapshotForPendingGate(): Promise<GuestSnapshot | null> {
    return assembleGuestSnapshotForPendingGate(guestRepository);
  },
  createSupabaseBrowserClient,
  createSupabaseRepositoryFromClient,
  readSupabasePublicConfigFromEnv,
  ensureOwnProfile,
  getVerifiedUser,
  signInWithCredentials,
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
      promote: untrackedSessionEngineActions.promote,
      getPromotionStatus: () => sessionEngineStore.getSnapshot().promotionStatus,
      registerAuthenticatedPort: swapToSupabaseAdapter,
    });
  },
  signInAndPromote(credentials?: LoginCredentials): Promise<void> {
    if (loginPromotion !== null) return loginPromotion;
    const generation = inquiryGenerationStore.getSnapshot();
    loginPromotion = trackExclusiveFlowOperation(async () => {
      const config = readSupabasePublicConfigFromEnv(import.meta.env as Record<string, string | undefined>);
      if (config === null) throw new Error("Public authentication configuration is unavailable");
      browserClient ??= createSupabaseBrowserClient(config);
      const client = browserClient;
      if (frozenPromotion?.generation !== generation) frozenPromotion = null;
      if (frozenPromotion === null) {
        const snapshot = await assembleGuestSnapshotForPendingGate(guestRepository);
        const pending = pendingGuestFinishRequest;
        if (snapshot === null || pending === null) throw new Error("There is no pending work to save");
        frozenPromotion = { generation, snapshot: structuredClone(snapshot), owner: null, kind: pending.kind };
      }
      const request = frozenPromotion;
      if (credentials !== undefined && !verifiedIdentity) await signInWithCredentials(client, credentials);
      const verifyOwner = async () => {
        let user;
        try { user = await getVerifiedUser(client); }
        catch (error) { verifiedIdentity = false; throw error; }
        if (request.generation !== inquiryGenerationStore.getSnapshot() ||
          (request.owner !== null && request.owner !== user.id)) {
          frozenPromotion = null;
          verifiedIdentity = false;
          throw new Error("The saving request no longer belongs to this inquiry and identity");
        }
        request.owner = user.id;
        verifiedIdentity = true;
        return user;
      };
      const user = await verifyOwner();
      await ensureOwnProfile(client, user);
      await verifyOwner();
      if (pendingGuestFinishRequest?.kind !== request.kind ||
        pendingGuestFinishRequest.sessionId !== request.snapshot.playerSession.id) {
        throw new Error("The pending Finish request changed");
      }
      promotionSwitching = true;
      try {
        await untrackedPromotePathActions.promoteWithAuthenticatedRepository(
          createSupabaseRepositoryFromClient(client), request.snapshot, user.id,
        );
        if (sessionEngineStore.getSnapshot().promotionStatus === "succeeded") frozenPromotion = null;
      } finally { promotionSwitching = false; }
    }).finally(() => { loginPromotion = null; });
    return loginPromotion;
  },
  hasVerifiedIdentity: () => verifiedIdentity,
};
const promotePathActions = {
  ...untrackedPromotePathActions,
  ...trackedActions({
    promoteWithAuthenticatedRepository: untrackedPromotePathActions.promoteWithAuthenticatedRepository,
  }),
};

/** Resets composition-layer group flow pointer between tests. */
export function resetGroupFlowFactsForTest(): void {
  activeGroupId = null;
  groupEngineStore.notify();
}

void import("./guest-flow-facts").then(async ({ initGuestFlowFacts, setGuestFlowPlayerSession }) => {
  initGuestFlowFacts({
    getActiveGroupId: () => activeGroupId,
    getSessionState: () => sessionEngine.getState(),
    subscribeToGroup: groupEngineStore.subscribe,
    subscribeToSession: sessionEngineStore.subscribe,
    initialFacts: persistedGuestFlowFacts,
    persistGuestFlowFacts: (facts) => {
      return guestRepository.saveGuestFlowFacts(facts);
    },
  });

  const initialGeneration = inquiryGenerationStore.getSnapshot();
  try { await initialResetRecovery; } catch { return; }
  const sessionId = persistedGuestFlowFacts.activePlayerSessionId;
  if (sessionId !== null) {
    const session = await repositoryPort.getPlayerSession(sessionId);
    if (initialGeneration !== inquiryGenerationStore.getSnapshot()) return;
    if (session?.success_declared === true) {
      setGuestFlowPlayerSession(null);
    } else {
      await playerSessionStore.refresh(sessionId);
    }
  }
});

const catalogActions = {
  listTreatments(): Promise<import("pic-engine").TreatmentListItem[]> {
    return repositoryPort.listTreatments();
  },
};

/** Module-scoped parsed-content cache — fresh on tab reload, per Wave 9 Content Cache Lifetime decision. */
const parsedTreatmentContentById = new Map<string, AtomicUnitContent[]>();

/** Web-only source metadata, read from the same tab-cached source as canonical parsing. */
const treatmentSourceById = new Map<string, Promise<Treatment | null>>();
function getTreatmentContentSource(treatmentId: string): Promise<Treatment | null> {
  const cached = treatmentSourceById.get(treatmentId);
  if (cached !== undefined) return cached;
  const pending = repositoryPort.getTreatment(treatmentId).then((source) => {
    if (source === null) treatmentSourceById.delete(treatmentId);
    return source;
  }).catch((error: unknown) => {
    treatmentSourceById.delete(treatmentId);
    throw error;
  });
  treatmentSourceById.set(treatmentId, pending);
  return pending;
}

const treatmentContentActions = {
  getTreatmentContentSource,
  async getParsedTreatmentContent(treatmentId: string): Promise<AtomicUnitContent[]> {
    const cached = parsedTreatmentContentById.get(treatmentId);
    if (cached !== undefined) {
      return cached;
    }
    const treatment = await getTreatmentContentSource(treatmentId);
    if (treatment === null) {
      return [];
    }
    const parsed = parseStructuredMarkdown(treatment.structured_markdown);
    parsedTreatmentContentById.set(treatmentId, parsed);
    return parsed;
  },
};

/** Clears the tab-scoped treatment content cache between tests. */
export function resetTreatmentContentCacheForTest(): void {
  parsedTreatmentContentById.clear();
  treatmentSourceById.clear();
}

/** Everything a consumer needs, handed down exactly once via app-level providers. */
export const compositionRoot = {
  inquiryResetActions,
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
  treatmentContentActions,
};
