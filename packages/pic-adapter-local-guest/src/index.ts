/**
 * `pic-adapter-local-guest` - the `localStorage`-backed `RepositoryPort` implementation Guest Mode runs
 * against (ticket 10; DEC-017 "Guest Group data is not modeled in Supabase at all"). Zero network calls:
 * this file imports nothing but `pic-engine`'s types/port, and reads/writes only through the small
 * `GuestKeyValueStorage` seam below - no `fetch`, no `XMLHttpRequest`, no Supabase client, anywhere.
 *
 * **Storage design.** All seven non-promotion entities live together as one JSON blob (a
 * `GuestRepositorySnapshot`) under a single storage key, read-modify-written on every call. A guest has
 * exactly one local "database", so one blob keeps every write atomic from the caller's point of view (no
 * partial-multi-key state to ever observe half-written) and keeps the adapter trivially portable between
 * real `localStorage` (string-keyed, string-valued) and an in-memory `Map` fallback for Node/tests - both
 * only need `getItem`/`setItem` on one key. The alternative (one storage key per entity/id) would need a
 * key-enumeration primitive (`localStorage` has one, `Map`-backed fallbacks would need to fake it) just to
 * implement nothing this adapter's callers actually need.
 */

import type {
  GuestSessionGateState,
  LibraryRow,
  LibraryRowProvenance,
  PlayerSession,
  PlayerUnit,
  PromoteGuestToAccountInput,
  PromoteGuestToAccountResult,
  RepositoryPort,
  SymptomGroup,
  TimelineEvent,
} from "pic-engine";
import { DEFAULT_GUEST_SESSION_GATE_STATE } from "pic-engine";

/** The minimal Web Storage shape this adapter needs - satisfied by real `localStorage` or a test double. */
export interface GuestKeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * Fixed (not random) so that a real browser page reload - which constructs a brand-new
 * `LocalGuestRepository` instance with default options - reconnects to the *same* `localStorage` slot as
 * before the reload. This is what "Guest state persists across refresh" structurally requires: a random
 * per-instance default key would make every fresh page load start from an empty guest store.
 */
export const DEFAULT_GUEST_STORAGE_KEY = "pic:guest-repository:v1";

export interface LocalGuestRepositoryOptions {
  storage?: GuestKeyValueStorage;
  storageKey?: string;
}

/**
 * Fresh, per-instance, `Map`-backed fallback for environments with no real `localStorage` (Node/vitest's
 * default `test` environment). Deliberately a plain class instantiated anew per repository instance rather
 * than a module-level singleton `Map` - a shared singleton would leak state across unrelated
 * `LocalGuestRepository` instances (e.g. across independent tests), which is exactly the isolation a
 * `Map`-per-instance avoids.
 */
class InMemoryGuestKeyValueStorage implements GuestKeyValueStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

/**
 * Resolves real `localStorage` via `globalThis` (rather than referencing the bare `localStorage` global
 * identifier) so this package's `tsconfig` never needs the `"dom"` lib just to type-check a feature-detect
 * check. The `try`/`catch` matters on its own merits too: some browser privacy modes (e.g. Safari Private
 * Browsing) throw on *accessing* `window.localStorage` itself, not only on calling `.setItem` - the throw
 * happens on the property read below, which is exactly what the `try` wraps.
 */
function resolveDefaultStorage(): GuestKeyValueStorage {
  try {
    const globalWithStorage = globalThis as typeof globalThis & { localStorage?: GuestKeyValueStorage };
    if (typeof globalWithStorage.localStorage !== "undefined") {
      return globalWithStorage.localStorage;
    }
  } catch {
    // Falls through to the in-memory fallback below - see this function's doc comment.
  }
  return new InMemoryGuestKeyValueStorage();
}

interface GuestRepositorySnapshot {
  groups: Record<string, SymptomGroup>;
  playerSessions: Record<string, PlayerSession>;
  libraryRows: Record<string, LibraryRow>;
  libraryRowIdByTreatmentId: Record<string, string>;
  usedIncrementIdempotencyKeysByRowId: Record<string, string[]>;
  timelineEvents: TimelineEvent[];
  sessionGate?: GuestSessionGateState;
}

function emptySnapshot(): GuestRepositorySnapshot {
  return {
    groups: {},
    playerSessions: {},
    libraryRows: {},
    libraryRowIdByTreatmentId: {},
    usedIncrementIdempotencyKeysByRowId: {},
    timelineEvents: [],
  };
}

/**
 * DEC-015's flat 4-state Unified Player model treats `in_view` as ephemeral: the single unit currently
 * being rendered, never a state a *permanent* store should durably persist. `PlayerEngine` owns no storage
 * of its own, though, and legitimately writes `in_view` into whatever `RepositoryPort` it is given so it
 * can read back "which unit was being viewed" on a later call - a deliberate, already-shipped upstream
 * design, not a bug for this adapter to reject or work around.
 *
 * This adapter is exactly the permanent-store boundary that normalization belongs at instead: any unit
 * whose `state` is `in_view` is downgraded to `unseen` here, applied identically on write
 * (`savePlayerSession`) and, defensively, on read (`getPlayerSession` - in case a stored snapshot predates
 * this rule, or `storage` was edited out-of-band). `unseen`, never `skipped`, is the conservative choice:
 * this adapter cannot always know whether a given unit was `unseen` or `skipped` immediately before the
 * render that produced its `in_view` write, and understating "reached" (`unseen`) is the safe failure
 * mode - never fabricating a false claim of having been bypassed via a Navigation-Tree jump (`skipped`)
 * for a unit that may never actually have been jumped over.
 */
function withInViewNormalized(unit: PlayerUnit): PlayerUnit {
  return unit.state === "in_view" ? { ...unit, state: "unseen" } : unit;
}

/**
 * Guest data structurally cannot "promote" against itself. Promotion (DEC-017) means moving a Guest
 * Group's no-identity data into a newly authenticated account, and an authenticated account's durable home
 * is `pic-adapter-supabase` (ticket 13) - never this adapter, whose entire reason to exist is Guest Mode's
 * *absence* of an account. There is no destination store here to promote *into*.
 */
export class GuestRepositoryCannotPromoteError extends Error {
  constructor() {
    super(
      "LocalGuestRepository.promoteGuestToAccount: Guest data cannot promote itself. Promotion always " +
        "targets pic-adapter-supabase (ticket 13) - construct that adapter for the newly authenticated " +
        "account and call promoteGuestToAccount there instead.",
    );
    this.name = "GuestRepositoryCannotPromoteError";
  }
}

/**
 * The `localStorage`-backed (or in-memory, off-browser) `RepositoryPort` Guest Mode runs against (ticket
 * 10). See this file's header comment for the storage design, and `withInViewNormalized` /
 * `GuestRepositoryCannotPromoteError` for the two behaviors that depart from a "dumb" pass-through store.
 */
export class LocalGuestRepository implements RepositoryPort {
  private readonly storage: GuestKeyValueStorage;
  private readonly storageKey: string;

  constructor(options: LocalGuestRepositoryOptions = {}) {
    this.storage = options.storage ?? resolveDefaultStorage();
    this.storageKey = options.storageKey ?? DEFAULT_GUEST_STORAGE_KEY;
  }

  private readSnapshot(): GuestRepositorySnapshot {
    const raw = this.storage.getItem(this.storageKey);
    if (raw === null) {
      return emptySnapshot();
    }
    // Spread over `emptySnapshot()` so a snapshot written before a schema addition (or edited out-of-band)
    // never crashes a reader on a missing key - it just behaves as if that slice were always empty.
    const parsed = JSON.parse(raw) as Partial<GuestRepositorySnapshot>;
    return { ...emptySnapshot(), ...parsed };
  }

  private writeSnapshot(snapshot: GuestRepositorySnapshot): void {
    this.storage.setItem(this.storageKey, JSON.stringify(snapshot));
  }

  async getGroup(groupId: string): Promise<SymptomGroup | null> {
    return this.readSnapshot().groups[groupId] ?? null;
  }

  async saveGroup(group: SymptomGroup): Promise<void> {
    const snapshot = this.readSnapshot();
    snapshot.groups[group.id] = group;
    this.writeSnapshot(snapshot);
  }

  async getPlayerSession(sessionId: string): Promise<PlayerSession | null> {
    const session = this.readSnapshot().playerSessions[sessionId];
    if (session === undefined) {
      return null;
    }
    return { ...session, units: session.units.map(withInViewNormalized) };
  }

  async savePlayerSession(session: PlayerSession): Promise<void> {
    const snapshot = this.readSnapshot();
    snapshot.playerSessions[session.id] = { ...session, units: session.units.map(withInViewNormalized) };
    this.writeSnapshot(snapshot);
  }

  async getOrCreateLibraryRow(treatmentId: string, provenance: LibraryRowProvenance): Promise<LibraryRow> {
    const snapshot = this.readSnapshot();
    const existingRowId = snapshot.libraryRowIdByTreatmentId[treatmentId];
    const existingRow = existingRowId === undefined ? undefined : snapshot.libraryRows[existingRowId];
    if (existingRow !== undefined) {
      return existingRow;
    }

    const newRow: LibraryRow = {
      id: crypto.randomUUID(),
      treatment_id: treatmentId,
      use_count: 0,
      provenance,
      variant_type: "original",
      global_reference_id: treatmentId,
      protocol_content: null,
      created_at: new Date().toISOString(),
    };
    snapshot.libraryRows[newRow.id] = newRow;
    snapshot.libraryRowIdByTreatmentId[treatmentId] = newRow.id;
    this.writeSnapshot(snapshot);
    return newRow;
  }

  async incrementUseCount(libraryRowId: string, idempotencyKey: string): Promise<LibraryRow> {
    const snapshot = this.readSnapshot();
    const row = snapshot.libraryRows[libraryRowId];
    if (row === undefined) {
      throw new Error(`LocalGuestRepository.incrementUseCount: no library row with id "${libraryRowId}"`);
    }

    const usedKeys = snapshot.usedIncrementIdempotencyKeysByRowId[libraryRowId] ?? [];
    if (!usedKeys.includes(idempotencyKey)) {
      usedKeys.push(idempotencyKey);
      snapshot.usedIncrementIdempotencyKeysByRowId[libraryRowId] = usedKeys;
      row.use_count += 1;
      this.writeSnapshot(snapshot);
    }

    return row;
  }

  async appendTimelineEvent(event: Omit<TimelineEvent, "id" | "created_at">): Promise<TimelineEvent> {
    const snapshot = this.readSnapshot();
    const fullEvent: TimelineEvent = {
      ...event,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    snapshot.timelineEvents.push(fullEvent);
    this.writeSnapshot(snapshot);
    return fullEvent;
  }

  async promoteGuestToAccount(input: PromoteGuestToAccountInput): Promise<PromoteGuestToAccountResult> {
    void input; // never read - see GuestRepositoryCannotPromoteError's doc comment for why
    throw new GuestRepositoryCannotPromoteError();
  }

  async getGuestSessionGate(): Promise<GuestSessionGateState> {
    return this.readGuestSessionGateSync();
  }

  async saveGuestSessionGate(state: GuestSessionGateState): Promise<void> {
    const snapshot = this.readSnapshot();
    snapshot.sessionGate = { ...state };
    this.writeSnapshot(snapshot);
  }

  /**
   * Synchronous read of the persisted Persistence Gate flags for composition-root boot rehydration. The
   * composition root constructs `SessionEngine` at module load (before any async boundary), so it needs a
   * sync path into the same `localStorage` blob `saveGuestSessionGate` writes.
   */
  getGuestSessionGateSync(): GuestSessionGateState {
    return this.readGuestSessionGateSync();
  }

  private readGuestSessionGateSync(): GuestSessionGateState {
    const gate = this.readSnapshot().sessionGate;
    if (gate === undefined) {
      return { ...DEFAULT_GUEST_SESSION_GATE_STATE };
    }
    return {
      gateTriggered: gate.gateTriggered,
      pendingFinishRequest:
        gate.pendingFinishRequest === null ? null : { ...gate.pendingFinishRequest },
    };
  }
}
