// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { LocalGuestRepository } from "pic-adapter-local-guest";
import { DelegatingRepositoryPort } from "pic-engine";
import { App } from "./App";
import { GuestModeShell } from "./GuestModeShell";
import { SessionEngineProvider } from "./session-engine-context";
import { LocaleProvider } from "./i18n/locale-provider";
import { compositionRoot } from "./composition-root";
import { resetGuestFlowFactsForTest } from "./guest-flow-facts";

/**
 * Ticket 14's thin smoke tests (per the spec's Testing Decisions - "UI layer: thin smoke tests only... no
 * business-rule assertions belong at this layer"). This repo does not enable Vitest's global test APIs
 * (every other test file explicitly imports from "vitest"), so `@testing-library/react`'s automatic
 * `afterEach` cleanup never registers itself - clean up explicitly instead.
 */
beforeEach(() => {
  resetGuestFlowFactsForTest();
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => {
  cleanup();
  resetGuestFlowFactsForTest();
  localStorage.clear();
  sessionStorage.clear();
});

describe("pic-web app shell", () => {
  it("renders GuestModeShell without throwing given a freshly-booted SessionEngine", () => {
    expect(() =>
      render(
        <LocaleProvider><SessionEngineProvider>
          <GuestModeShell>
            <div>child content</div>
          </GuestModeShell>
        </SessionEngineProvider></LocaleProvider>,
      ),
    ).not.toThrow();
  });

  it("renders the fresh welcome in the full App shell without throwing at boot", async () => {
    render(<App />);

    expect(await screen.findByTestId("welcome-screen")).toBeTruthy();
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
