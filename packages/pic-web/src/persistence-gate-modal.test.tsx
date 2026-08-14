// @vitest-environment jsdom
import { randomUUID } from "node:crypto";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_GUEST_STORAGE_KEY } from "pic-adapter-local-guest";
import type { FinalizedSymptomGroup, PlayerSession, RepositoryPort } from "pic-engine";

function buildFinalizedGroup(overrides: Partial<FinalizedSymptomGroup> = {}): FinalizedSymptomGroup {
  return {
    id: randomUUID(),
    name: "Lower Back",
    symptoms: [],
    created_at: new Date().toISOString(),
    joint_treatment_muscle_test: "together",
    joint_treatment_test_at: new Date().toISOString(),
    ...overrides,
  };
}

function buildPlayerSession(groupId: string, overrides: Partial<PlayerSession> = {}): PlayerSession {
  return {
    id: randomUUID(),
    treatment_id: "treatment-fixture",
    linked_group_id: groupId,
    units: [{ unit_id: "a", state: "completed" }],
    terminal_nemar_response: "yes",
    success_declared: false,
    finished_at: null,
    integrating_reason: null,
    ...overrides,
  };
}

function storageHasGuestEntityData(raw: string | null): boolean {
  if (raw === null) {
    return false;
  }
  const snapshot = JSON.parse(raw) as {
    groups?: Record<string, unknown>;
    playerSessions?: Record<string, unknown>;
  };
  return (
    Object.keys(snapshot.groups ?? {}).length > 0 || Object.keys(snapshot.playerSessions ?? {}).length > 0
  );
}

async function loadFreshModules() {
  vi.resetModules();
  localStorage.clear();
  const { compositionRoot } = await import("./composition-root");
  const { PersistenceGateModal } = await import("./PersistenceGateModal");
  const { SessionEngineProvider } = await import("./session-engine-context");
  return { compositionRoot, PersistenceGateModal, SessionEngineProvider };
}

async function openGateWithGuestSession(
  compositionRoot: Awaited<ReturnType<typeof loadFreshModules>>["compositionRoot"],
) {
  const group = buildFinalizedGroup();
  const session = buildPlayerSession(group.id);
  await compositionRoot.repositoryPort.saveGroup(group);
  await compositionRoot.repositoryPort.savePlayerSession(session);
  await compositionRoot.sessionEngineActions.onFinishRequested(session.id, "finish");
  return { group, session };
}

function renderModal(
  PersistenceGateModal: Awaited<ReturnType<typeof loadFreshModules>>["PersistenceGateModal"],
  SessionEngineProvider: Awaited<ReturnType<typeof loadFreshModules>>["SessionEngineProvider"],
) {
  return render(
    <SessionEngineProvider>
      <PersistenceGateModal />
    </SessionEngineProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("PersistenceGateModal", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders nothing when gateTriggered is false", async () => {
    const { PersistenceGateModal, SessionEngineProvider } = await loadFreshModules();
    const { container } = renderModal(PersistenceGateModal, SessionEngineProvider);

    expect(container.firstChild).toBeNull();
  });

  it("renders auth options when gateTriggered and promotionStatus idle", async () => {
    const { compositionRoot, PersistenceGateModal, SessionEngineProvider } = await loadFreshModules();
    await openGateWithGuestSession(compositionRoot);

    renderModal(PersistenceGateModal, SessionEngineProvider);

    expect(screen.getByRole("dialog", { name: "Keep your session" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign in (dev tracer stub)" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue without saving" })).toBeTruthy();
  });

  it("renders retry affordance when promotionStatus failed", async () => {
    const { compositionRoot, PersistenceGateModal, SessionEngineProvider } = await loadFreshModules();
    const { group, session } = await openGateWithGuestSession(compositionRoot);
    const guestProvider = compositionRoot.repositoryPort.getProvider();

    const failingPort: RepositoryPort = {
      ...(guestProvider as RepositoryPort),
      async promoteGuestToAccount() {
        throw new Error("network drop");
      },
    };

    await compositionRoot.promotePathActions.promoteWithAuthenticatedRepository(
      failingPort,
      { group, playerSession: session },
      "user-retry",
    );

    renderModal(PersistenceGateModal, SessionEngineProvider);

    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    expect(screen.queryByText(/partial/i)).toBeNull();
    expect(screen.queryByText(/lost/i)).toBeNull();
  });

  it("decline calls discardGuestState and clears guest storage", async () => {
    const { compositionRoot, PersistenceGateModal, SessionEngineProvider } = await loadFreshModules();
    await openGateWithGuestSession(compositionRoot);
    expect(storageHasGuestEntityData(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY))).toBe(true);

    renderModal(PersistenceGateModal, SessionEngineProvider);
    fireEvent.click(screen.getByRole("button", { name: "Continue without saving" }));

    await vi.waitFor(() => {
      expect(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY)).toBeNull();
    });
    expect(compositionRoot.sessionEngineStore.getSnapshot().gateTriggered).toBe(false);
  });
});
