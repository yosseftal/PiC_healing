import {
  clearPromotionRecovery, readPromotionRecovery, savePromotionRecovery, type PromotionRecovery,
} from "./promotion-recovery";
import { readVerificationPending, saveVerificationPending } from "./verification-pending";
import {
  advanceInquiryGeneration, hasInquiryDraft, inquiryGenerationStore, reopenFlowOperations,
  prepareFlowSettlement, restoreInquiryGeneration, trackExclusiveFlowOperation, trackFlowOperation,
} from "./inquiry-lifecycle";
import {
  clearInquiryResetRecovery, readInquiryResetRecovery, saveInquiryResetRecovery,
  type InquiryResetRecovery,
} from "./inquiry-reset-recovery";
/**
 * The single composition root (ticket 14, Wave 7): constructs exactly one `LocalGuestRepository` and
 * exactly one `SessionEngine` - wired to a `PlayerEngine`/`LibraryEngine`/`TimelineEngine` trio built on
 * that same adapter, since `SessionEngine`'s constructor requires a `PlayerEngine` to complete a gated
 * Finish request after promotion (ticket 09). One authoritative SessionEngine is active outside React;
 * interrupted completion rebinds it through its public constructor with the retained pending intent.
 * ES module consumers share these composition-owned resources; React renders never reconstruct them.
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
let promotionRecovery = readPromotionRecovery();
if (promotionRecovery !== null) restoreInquiryGeneration(promotionRecovery.generation);
const persistedGuestFlowFacts = promotionRecovery === null ?
  resetRecovery?.facts ?? guestRepository.getGuestFlowFactsSync() : {
    activeGroupId: promotionRecovery.snapshot.group?.id ?? null,
    activePlayerSessionId: promotionRecovery.snapshot.playerSession.id,
    symptomAdditionComplete: true, groupFinalized: true, summaryAcknowledged: true,
  };
const persistedGuestGate = promotionRecovery === null ?
  resetRecovery?.gate ?? guestRepository.getGuestSessionGateSync() : {
    gateTriggered: true, pendingFinishRequest: {
      sessionId: promotionRecovery.snapshot.playerSession.id, kind: promotionRecovery.kind,
    },
  };
let verificationPending = readVerificationPending();
if (verificationPending?.sessionId !== persistedGuestGate.pendingFinishRequest?.sessionId ||
  verificationPending?.kind !== persistedGuestGate.pendingFinishRequest?.kind) verificationPending = null;
if (verificationPending !== null) restoreInquiryGeneration(verificationPending.generation);
let pendingGuestFinishRequest = persistedGuestGate.pendingFinishRequest;
const libraryEngine = new LibraryEngine(repositoryPort);
const timelineEngine = new TimelineEngine(repositoryPort);
const playerEngine = new PlayerEngine(repositoryPort, libraryEngine, timelineEngine);
const groupEngine = new GroupEngine(repositoryPort);

let authenticatedPort: RepositoryPort | null = null;

const sessionOptions = {
  onPromotionSucceeded: () => {
    if (authenticatedPort !== null) {
      repositoryPort.swapProvider(authenticatedPort);
    }
  },
  initialGateState: persistedGuestGate,
};
let sessionEngine = new SessionEngine(repositoryPort, playerEngine, sessionOptions);
let recoveryStatus: "pending" | "failed" | null = promotionRecovery === null ? null : "failed";

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
const promotionRecoveryStore = createExternalStore(() => recoveryStatus);
const verificationStore = createExternalStore(() => verificationPending);

let resetting = false;
let promotionSwitching = false;
let suppressSessionNotifications = false;
function subscribeSessionEngine() {
  return sessionEngine.subscribe(() => { if (!suppressSessionNotifications) sessionEngineStore.notify(); });
}
let unsubscribeSessionEngine = subscribeSessionEngine();

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
  if (promotionRecovery !== null) {
    snapshots.set(promotionRecovery.snapshot.playerSession.id, promotionRecovery.snapshot.playerSession);
  }
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
      const recoverySession = promotionRecovery?.snapshot.playerSession ?? resetRecovery?.playerSession;
      snapshots.set(sessionId, session ?? (recoverySession?.id === sessionId ? recoverySession : null));
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
      if ((promotionSwitching || promotionRecovery !== null) && !allowDuringPromotion) {
        return Promise.reject(new Error("Saving is pending"));
      }
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
  promote(snapshot: GuestSnapshot, owner: string): Promise<void> {
    return coordinatePromotion(authenticatedPort ?? repositoryPort.getProvider(), snapshot, owner);
  },
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
      if (!confirmed && (localWork || promotionRecovery !== null || hasInquiryDraft())) return "confirmation";
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
        if (verificationPending !== null) saveVerificationPending(null);
        if (resetRecovery !== null) clearInquiryResetRecovery();
        if (promotionRecovery !== null) clearPromotionRecovery();
      } catch (error) {
        if (resetRecovery !== null) {
          try { await restoreResetRecovery(resetRecovery); } catch { /* Envelope retains the retry. */ }
        } else {
          await guestRepository.saveGuestFlowFacts(previousFacts);
        }
        throw error;
      }
      resetRecovery = null;
      promotionRecovery = null;
      frozenPromotion = null;
      recoveryStatus = null;
      verificationPending = null;
      verificationStore.notify();
      if (state.mode === "authenticated" && authenticatedPort !== null) repositoryPort.swapProvider(authenticatedPort);
      pendingGuestFinishRequest = null;
      activeGroupId = null;
      playerSessionStore.clear();
      facts.clearGuestFlowFacts();
      groupEngineStore.notify();
      advanceInquiryGeneration();
      promotionRecoveryStore.notify();
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
let recoveryIdentityRejected = false;
let loginPromotion: Promise<void> | null = null;
let publicPromotionOwner: string | null = null;
let frozenPromotion: {
  generation: number; snapshot: GuestSnapshot; owner: string | null; kind: "finish" | "finishAnyway";
} | null = promotionRecovery ?? (verificationPending?.frozen ? { ...verificationPending.frozen, owner: null } : null);
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
  async promoteWithAuthenticatedRepository(
    port: RepositoryPort,
    guestSnapshot: GuestSnapshot,
    newUserId: string,
  ): Promise<void> {
    const pending = pendingGuestFinishRequest;
    const frozen = promotionRecovery ?? frozenPromotion ?? {
      snapshot: structuredClone(guestSnapshot), owner: newUserId,
      generation: inquiryGenerationStore.getSnapshot(), kind: pending?.kind ?? "finish",
    };
    if (pending?.sessionId !== frozen.snapshot.playerSession.id || pending.kind !== frozen.kind) {
      throw new Error("The snapshot does not belong to the current pending work");
    }
    if ((frozen.owner !== null && frozen.owner !== newUserId) ||
      frozen.generation !== inquiryGenerationStore.getSnapshot()) {
      throw new Error("The saving request no longer belongs to this inquiry and identity");
    }
    const request: PromotionRecovery = { ...frozen, owner: newUserId };
    frozenPromotion = request;
    savePromotionRecovery(request);
    promotionRecovery = request;
    recoveryStatus = "pending";
    promotionRecoveryStore.notify();
    // After an interrupted completion the old engine has already consumed its pending intent.
    // Replace the one authoritative engine through its public constructor, retaining the exact gate.
    if (sessionEngine.getState().mode === "authenticated") {
      unsubscribeSessionEngine();
      sessionEngine = new SessionEngine(repositoryPort, playerEngine, {
        ...sessionOptions, initialGateState: { gateTriggered: true,
          pendingFinishRequest: { sessionId: request.snapshot.playerSession.id, kind: request.kind } },
      });
      unsubscribeSessionEngine = subscribeSessionEngine();
    }
    try {
      await promoteWithAuthenticatedRepository({
        delegatingPort: repositoryPort, authenticatedPort: port, guestSnapshot: request.snapshot, newUserId,
        promote: untrackedSessionEngineActions.promote,
        getPromotionStatus: () => sessionEngine.getState().promotionStatus,
        registerAuthenticatedPort: swapToSupabaseAdapter,
      });
      if (sessionEngine.getState().promotionStatus !== "succeeded") {
        recoveryStatus = "failed";
        return;
      }
      const completed = await port.getPlayerSession(request.snapshot.playerSession.id);
      if (completed?.success_declared !== true) throw new Error("Completion needs recovery");
      const facts = await import("./guest-flow-facts");
      await facts.settleGuestFlowPersistence();
      if (verificationPending !== null) saveVerificationPending(null);
      if (resetRecovery !== null) clearInquiryResetRecovery();
      await guestRepository.clear();
      clearPromotionRecovery();
      verificationPending = null;
      verificationStore.notify();
      promotionRecovery = null;
      frozenPromotion = null;
      resetRecovery = null;
      pendingGuestFinishRequest = null;
      facts.setGuestFlowPlayerSession(null, false);
      recoveryStatus = null;
    } catch (error) {
      recoveryStatus = "failed";
      throw error;
    } finally { sessionEngineStore.notify(); promotionRecoveryStore.notify(); }
  },
  register(credentials: LoginCredentials & { name: string }): Promise<void> {
    if (loginPromotion !== null) return loginPromotion;
    const generation = inquiryGenerationStore.getSnapshot();
    loginPromotion = trackExclusiveFlowOperation(async () => {
      const config = readSupabasePublicConfigFromEnv(import.meta.env as Record<string, string | undefined>);
      if (config === null) throw new Error("Public authentication configuration is unavailable");
      const pending = pendingGuestFinishRequest;
      if (pending === null || verificationPending !== null || (frozenPromotion !== null &&
        (frozenPromotion.owner !== null || frozenPromotion.generation !== generation ||
          frozenPromotion.snapshot.playerSession.id !== pending.sessionId || frozenPromotion.kind !== pending.kind))) {
        throw new Error("Use sign-in for the existing pending work");
      }
      browserClient ??= createSupabaseBrowserClient(config);
      const { data, error } = await browserClient.auth.signUp({
        email: credentials.email.trim(), password: credentials.password,
        options: { data: { full_name: credentials.name.trim() } },
      });
      if (error !== null) throw error;
      if (!data.user?.id || generation !== inquiryGenerationStore.getSnapshot()) {
        throw new Error("Registration could not be confirmed");
      }
      // Even an immediate signup session is re-verified by the single explicit sign-in/save path.
      verificationPending = { email: credentials.email.trim(), name: credentials.name.trim(),
        generation, sessionId: pending.sessionId, kind: pending.kind,
        frozen: frozenPromotion === null ? null : {
          snapshot: frozenPromotion.snapshot, generation: frozenPromotion.generation, kind: frozenPromotion.kind,
        } };
      try { saveVerificationPending(verificationPending); } finally { verificationStore.notify(); }
    }).finally(() => { loginPromotion = null; });
    return loginPromotion;
  },
  resendVerification(): Promise<void> {
    if (loginPromotion !== null) return loginPromotion;
    const request = verificationPending;
    loginPromotion = trackExclusiveFlowOperation(async () => {
      if (request === null || request.generation !== inquiryGenerationStore.getSnapshot() ||
        request.sessionId !== pendingGuestFinishRequest?.sessionId || request.kind !== pendingGuestFinishRequest.kind) {
        throw new Error("There is no pending registration for this inquiry");
      }
      const config = readSupabasePublicConfigFromEnv(import.meta.env as Record<string, string | undefined>);
      if (config === null) throw new Error("Public authentication configuration is unavailable");
      browserClient ??= createSupabaseBrowserClient(config);
      const { error } = await browserClient.auth.resend({ type: "signup", email: request.email });
      if (error !== null) throw error;
    }).finally(() => { loginPromotion = null; });
    return loginPromotion;
  },
  signInAndPromote(credentials?: LoginCredentials): Promise<void> {
    if (loginPromotion !== null) return loginPromotion;
    const generation = inquiryGenerationStore.getSnapshot();
    loginPromotion = trackExclusiveFlowOperation(async () => {
      const config = readSupabasePublicConfigFromEnv(import.meta.env as Record<string, string | undefined>);
      if (config === null) throw new Error("Public authentication configuration is unavailable");
      browserClient ??= createSupabaseBrowserClient(config);
      const client = browserClient;
      if (frozenPromotion !== null && frozenPromotion.generation !== generation) {
        throw new Error("The saving request no longer belongs to this inquiry and identity");
      }
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
        catch (error) { verifiedIdentity = false; recoveryIdentityRejected = true; throw error; }
        if (request.generation !== inquiryGenerationStore.getSnapshot() ||
          (request.owner !== null && request.owner !== user.id) ||
          (verificationPending !== null && (verificationPending.email.toLowerCase() !== user.email?.toLowerCase() ||
            verificationPending.generation !== request.generation ||
            verificationPending.sessionId !== request.snapshot.playerSession.id ||
            verificationPending.kind !== request.kind))) {
          verifiedIdentity = false;
          recoveryIdentityRejected = true;
          throw new Error("The saving request no longer belongs to this inquiry and identity");
        }
        request.owner = user.id;
        verifiedIdentity = true;
        recoveryIdentityRejected = false;
        savePromotionRecovery({ ...request, owner: user.id });
        promotionRecovery = { ...request, owner: user.id };
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
        if (sessionEngineStore.getSnapshot().promotionStatus === "succeeded") {
          frozenPromotion = null;
        }
      } finally { promotionSwitching = false; }
    }).finally(() => { loginPromotion = null; });
    return loginPromotion;
  },
  hasVerifiedIdentity: () => verifiedIdentity,
  canRetryWithoutCredentials: () => verifiedIdentity || (promotionRecovery !== null && !recoveryIdentityRejected),
};
function coordinatePromotion(port: RepositoryPort, snapshot: GuestSnapshot, owner: string): Promise<void> {
  if (loginPromotion !== null) {
    if ((publicPromotionOwner ?? promotionRecovery?.owner ?? frozenPromotion?.owner) !== owner) {
      return Promise.reject(new Error("The saving request belongs to another identity"));
    }
    return loginPromotion;
  }
  publicPromotionOwner = owner;
  loginPromotion = trackExclusiveFlowOperation(() =>
    untrackedPromotePathActions.promoteWithAuthenticatedRepository(port, snapshot, owner),
  ).finally(() => { loginPromotion = null; publicPromotionOwner = null; });
  return loginPromotion;
}
const promotePathActions = {
  ...untrackedPromotePathActions,
  promoteWithAuthenticatedRepository: coordinatePromotion,
};

/** Resets composition-layer group flow pointer between tests. */
export function resetGroupFlowFactsForTest(): void {
  activeGroupId = null;
  groupEngineStore.notify();
}

void import("./guest-flow-facts").then(async ({ initGuestFlowFacts, setGuestFlowPlayerSession }) => {
  initGuestFlowFacts({
    getActiveGroupId: () => activeGroupId,
    getSessionState: () => sessionEngineStore.getSnapshot(),
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
  verificationStore,
  inquiryResetActions,
  repositoryPort,
  groupEngine,
  playerEngine,
  sessionEngineStore,
  promotionRecoveryStore,
  sessionEngineActions,
  groupEngineStore,
  groupEngineActions,
  playerSessionStore,
  playerEngineActions,
  promotePathActions,
  catalogActions,
  treatmentContentActions,
};
