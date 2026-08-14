// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  PlayerEngineProvider,
  usePlayerEngineActions,
  usePlayerSession,
} from "./player-engine-context";

afterEach(() => {
  cleanup();
});

describe("player-engine-context", () => {
  it("PlayerEngine hooks throw outside provider", () => {
    expect(() => renderHook(() => usePlayerEngineActions())).toThrow(
      "PlayerEngine hooks must be used within a PlayerEngineProvider",
    );
    expect(() => renderHook(() => usePlayerSession("session-id"))).toThrow(
      "PlayerEngine hooks must be used within a PlayerEngineProvider",
    );
  });

  it("PlayerEngine hooks work inside provider", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <PlayerEngineProvider>{children}</PlayerEngineProvider>
    );
    const { result: actionsResult } = renderHook(() => usePlayerEngineActions(), { wrapper });
    const { result: sessionResult } = renderHook(() => usePlayerSession("missing-session"), { wrapper });

    expect(actionsResult.current).toBeDefined();
    expect(typeof actionsResult.current.startSession).toBe("function");
    expect(sessionResult.current).toBeNull();
  });
});
