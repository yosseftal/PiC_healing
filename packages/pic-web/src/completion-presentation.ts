import type { PlayerSession } from "pic-engine";

export interface CompletionScope {
  owner: string | null;
  generation: number;
  providerKey: string;
}

export type CompletionChoice = "questionnaire" | "catalog";

export interface CompletionPresentationSnapshot {
  readonly visible: boolean;
  readonly choice: CompletionChoice | null;
  readonly hasCurrentGroup: boolean;
  readonly busy: boolean;
}

export interface CompletionPresentationDependencies {
  /** Captures an opaque owner/provider/generation guard for the current inquiry. */
  captureAccess: () => () => void;
  currentScope: () => CompletionScope;
  getSession: (sessionId: string) => Promise<PlayerSession | null>;
  getCurrentGroupId: () => string | null;
  /** True acknowledges completed navigation; confirmation, cancellation and unsettled navigation return false. */
  onReturnToQuestionnaire: (groupId: string | null) => boolean | Promise<boolean>;
  onChooseCatalog: () => boolean | Promise<boolean>;
  storage?: Pick<Storage, "getItem" | "setItem">;
  subscribeToScope?: (listener: () => void) => () => void;
}

export interface CompletionRecoveryMetadata extends Readonly<CompletionScope> {
  readonly version: 2;
  readonly providerKey: "account" | "guest";
  readonly sessionId: string;
  readonly choice: CompletionChoice | null;
}

interface VerifiedCompletion {
  scope: CompletionScope;
  sessionId: string;
  choice: CompletionChoice | null;
  assertAccess: () => void;
}

const STORAGE_KEY = "pic-web.completion.v2";

function sameScope(left: CompletionScope, right: CompletionScope): boolean {
  return left.owner === right.owner && left.providerKey === right.providerKey &&
    left.generation === right.generation;
}

function storageFor(dependencies: Pick<CompletionPresentationDependencies, "storage">) {
  if (dependencies.storage !== undefined) return dependencies.storage;
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}

function boundedId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 256;
}

/** Boot metadata is untrusted: the caller must still verify identity and the exact public session. */
export function readCompletionRecovery(
  storage: Pick<Storage, "getItem"> | null = storageFor({}),
): CompletionRecoveryMetadata | null {
  if (storage === null) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null || raw.length > 4096) return null;
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null ||
      !("version" in value) || value.version !== 2 ||
      !("owner" in value) || value.owner !== null && !boundedId(value.owner) ||
      !("providerKey" in value) || value.providerKey !== "account" && value.providerKey !== "guest" ||
      value.providerKey === "account" && value.owner === null ||
      value.providerKey === "guest" && value.owner !== null ||
      !("generation" in value) || typeof value.generation !== "number" ||
      !Number.isSafeInteger(value.generation) || value.generation < 0 ||
      !("sessionId" in value) || !boundedId(value.sessionId) ||
      !("choice" in value) ||
      (value.choice !== null && value.choice !== "questionnaire" && value.choice !== "catalog")) return null;
    return Object.freeze({ version: 2, owner: value.owner, providerKey: value.providerKey,
      generation: value.generation, sessionId: value.sessionId, choice: value.choice });
  } catch {
    return null;
  }
}

/** Writes an untrusted recovery hint; only a separately verified public session may authorize its presentation. */
export function writeCompletionRecoveryHint(
  metadata: CompletionRecoveryMetadata,
  storage: Pick<Storage, "getItem" | "setItem"> | null = storageFor({}),
): boolean {
  if (storage === null) return false;
  try {
    const raw = JSON.stringify(metadata);
    const normalized = readCompletionRecovery({ getItem: () => raw });
    if (normalized === null) return false;
    const bounded = JSON.stringify(normalized);
    storage.setItem(STORAGE_KEY, bounded);
    return storage.getItem(STORAGE_KEY) === bounded;
  } catch {
    return false;
  }
}
function readRetained(
  storage: Pick<Storage, "getItem"> | null,
  scope: CompletionScope,
): CompletionRecoveryMetadata | null {
  const retained = readCompletionRecovery(storage);
  return retained !== null && sameScope(retained, scope) ? retained : null;
}

const hiddenSnapshot: CompletionPresentationSnapshot = Object.freeze({
  visible: false,
  choice: null,
  hasCurrentGroup: false,
  busy: false,
});

/** A retained pointer is a recovery hint, never evidence that Finish or promotion succeeded. */
export function createCompletionPresentation(dependencies: CompletionPresentationDependencies) {
  const storage = storageFor(dependencies);
  const listeners = new Set<() => void>();
  let verified: VerifiedCompletion | null = null;
  let snapshot = hiddenSnapshot;
  let revision = 0;
  let busy = false;
  let disposed = false;

  function currentRecord() {
    try {
      if (disposed || verified === null || !sameScope(verified.scope, dependencies.currentScope())) return null;
      verified.assertAccess();
      return verified;
    } catch {
      return null;
    }
  }

  function updateSnapshot() {
    const record = currentRecord();
    if (record === null && verified !== null) {
      ++revision;
      verified = null;
      busy = false;
    }
    const next = record === null ? hiddenSnapshot : {
      visible: record.choice === null,
      choice: record.choice,
      hasCurrentGroup: dependencies.getCurrentGroupId() !== null,
      busy,
    };
    if (snapshot.visible === next.visible && snapshot.choice === next.choice &&
      snapshot.hasCurrentGroup === next.hasCurrentGroup && snapshot.busy === next.busy) return false;
    snapshot = Object.freeze(next);
    return true;
  }

  function notify() {
    if (!updateSnapshot()) return;
    for (const listener of listeners) listener();
  }

  function writeRetained(record: CompletionRecoveryMetadata | null): boolean {
    if (storage === null) return false;
    try {
      const raw = JSON.stringify(record);
      storage.setItem(STORAGE_KEY, raw);
      return storage.getItem(STORAGE_KEY) === raw;
    } catch {
      return false;
    }
  }

  function retain(record: VerifiedCompletion): boolean {
    const { providerKey, owner } = record.scope;
    if (providerKey !== "account" && providerKey !== "guest" ||
      providerKey === "account" && owner === null || providerKey === "guest" && owner !== null) return false;
    return writeRetained({ ...record.scope, providerKey, version: 2, sessionId: record.sessionId, choice: record.choice });
  }

  async function readConfirmedSession(sessionId: string) {
    const scope = { ...dependencies.currentScope() };
    if (!boundedId(sessionId) || !Number.isSafeInteger(scope.generation) || scope.generation < 0 ||
      scope.providerKey !== "account" && scope.providerKey !== "guest" ||
      scope.providerKey === "account" && !boundedId(scope.owner) ||
      scope.providerKey === "guest" && scope.owner !== null) return null;
    const assertAccess = dependencies.captureAccess();
    assertAccess();
    const session = await dependencies.getSession(sessionId);
    assertAccess();
    if (!sameScope(scope, dependencies.currentScope()) || session?.id !== sessionId ||
      session.success_declared !== true) return null;
    return { scope, assertAccess };
  }

  /** Stage before owned storage cleanup; only showConfirmed may publish the completion surface afterward. */
  async function stageConfirmedRecovery(sessionId: string): Promise<boolean> {
    if (disposed) return false;
    const previous = currentRecord();
    suspend();
    const request = revision;
    try {
      const confirmed = await readConfirmedSession(sessionId);
      if (confirmed === null || request !== revision || disposed) return false;
      const retained = readRetained(storage, confirmed.scope);
      const choice = previous?.sessionId === sessionId && sameScope(previous.scope, confirmed.scope) ?
        previous.choice : retained?.sessionId === sessionId ? retained.choice : null;
      return retain({ ...confirmed, sessionId, choice });
    } catch {
      return false;
    }
  }

  async function showConfirmed(sessionId: string): Promise<boolean> {
    if (disposed) return false;
    const request = ++revision;
    const previous = currentRecord();
    verified = null;
    busy = false;
    notify();
    try {
      const confirmed = await readConfirmedSession(sessionId);
      if (confirmed === null || request !== revision || disposed) return false;
      const retained = readRetained(storage, confirmed.scope);
      const retainedChoice = previous?.sessionId === sessionId && sameScope(previous.scope, confirmed.scope) ?
        previous.choice : retained?.sessionId === sessionId ? retained.choice : null;
      const choice = retainedChoice === "questionnaire" && dependencies.getCurrentGroupId() === null ? null : retainedChoice;
      verified = { ...confirmed, sessionId, choice };
      retain(verified);
      notify();
      return true;
    } catch {
      return false;
    }
  }

  async function choose(choice: CompletionChoice): Promise<boolean> {
    const record = currentRecord();
    if (record === null || record.choice !== null || busy) return false;
    const request = revision;
    busy = true;
    notify();
    try {
      let confirmed;
      try { confirmed = await readConfirmedSession(record.sessionId); } catch { confirmed = null; }
      if (request !== revision || currentRecord() !== record) return false;
      if (confirmed === null || !sameScope(record.scope, confirmed.scope)) {
        verified = null;
        return false;
      }
      const accepted = choice === "questionnaire" ?
        await dependencies.onReturnToQuestionnaire(dependencies.getCurrentGroupId()) :
        await dependencies.onChooseCatalog();
      if (!accepted || request !== revision || currentRecord() !== record) return false;
      verified = { ...record, choice };
      retain(verified);
      return true;
    } catch {
      return false;
    } finally {
      if (request === revision) {
        busy = false;
        notify();
      }
    }
  }

  function getRecoverySessionId(): string | null {
    try {
      if (disposed) return null;
      dependencies.captureAccess()();
      return readRetained(storage, dependencies.currentScope())?.sessionId ?? null;
    } catch {
      return null;
    }
  }

  function suspend() {
    ++revision;
    verified = null;
    busy = false;
    notify();
  }

  const unsubscribeScope = dependencies.subscribeToScope?.(() => {
    if (currentRecord() === null) suspend();
    else notify();
  });

  return {
    getSnapshot(): CompletionPresentationSnapshot {
      updateSnapshot();
      return snapshot;
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    getRecoverySessionId,
    async recoverConfirmed(): Promise<boolean> {
      const sessionId = getRecoverySessionId();
      return sessionId === null ? false : showConfirmed(sessionId);
    },
    stageConfirmedRecovery,
    showConfirmed,
    suspend,
    /** Clear only after an explicit successful reset or new focus; suspend preserves same-owner recovery. */
    invalidate() {
      writeRetained(null);
      suspend();
    },
    returnToQuestionnaire: () => choose("questionnaire"),
    chooseAnotherTreatment: () => choose("catalog"),
    dispose() {
      unsubscribeScope?.();
      disposed = true;
      suspend();
      listeners.clear();
    },
  };
}

export type CompletionPresentation = ReturnType<typeof createCompletionPresentation>;
