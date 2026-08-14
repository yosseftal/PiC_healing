// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { LocalGuestRepository } from "pic-adapter-local-guest";
import { DelegatingRepositoryPort } from "pic-engine";
import { App } from "./App";
import { GuestModeShell } from "./GuestModeShell";
import { SessionEngineProvider } from "./session-engine-context";
import { compositionRoot } from "./composition-root";

/**
 * Ticket 14's thin smoke tests (per the spec's Testing Decisions - "UI layer: thin smoke tests only... no
 * business-rule assertions belong at this layer"). This repo does not enable Vitest's global test APIs
 * (every other test file explicitly imports from "vitest"), so `@testing-library/react`'s automatic
 * `afterEach` cleanup never registers itself - clean up explicitly instead.
 */
afterEach(() => {
  cleanup();
});

describe("pic-web app shell", () => {
  it("renders GuestModeShell without throwing given a freshly-booted SessionEngine", () => {
    expect(() =>
      render(
        <SessionEngineProvider>
          <GuestModeShell>
            <div>child content</div>
          </GuestModeShell>
        </SessionEngineProvider>,
      ),
    ).not.toThrow();
  });

  it("renders the full App shell without throwing at boot", () => {
    const { getByTestId } = render(<App />);

    expect(getByTestId("guest-flow-create-group")).toBeTruthy();
  });

  const singletonTitle =
    "constructs exactly one LocalGuestRepository instance at boot, never inside a re-rendered component";
  it(singletonTitle, () => {
    const repositoryPortBeforeRender = compositionRoot.repositoryPort;
    expect(repositoryPortBeforeRender).toBeInstanceOf(DelegatingRepositoryPort);
    expect(repositoryPortBeforeRender.getProvider()).toBeInstanceOf(LocalGuestRepository);

    const { rerender, unmount } = render(<App />);
    rerender(<App />);
    rerender(<App />);

    // The composition root is a module-level singleton (see composition-root.ts's header comment) - three
    // renders of a tree that transitively reads it must never observe a different instance.
    expect(compositionRoot.repositoryPort).toBe(repositoryPortBeforeRender);

    unmount();
    expect(compositionRoot.repositoryPort).toBe(repositoryPortBeforeRender);
  });
});
