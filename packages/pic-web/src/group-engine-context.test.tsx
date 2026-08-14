// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { GroupEngineProvider, useGroupEngineActions, useGroupEngineState } from "./group-engine-context";

afterEach(() => {
  cleanup();
});

describe("group-engine-context", () => {
  it("GroupEngine hooks throw outside provider", () => {
    expect(() => renderHook(() => useGroupEngineActions())).toThrow(
      "GroupEngine hooks must be used within a GroupEngineProvider",
    );
    expect(() => renderHook(() => useGroupEngineState())).toThrow(
      "GroupEngine hooks must be used within a GroupEngineProvider",
    );
  });

  it("GroupEngine hooks work inside provider", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <GroupEngineProvider>{children}</GroupEngineProvider>
    );
    const { result: actionsResult } = renderHook(() => useGroupEngineActions(), { wrapper });
    const { result: stateResult } = renderHook(() => useGroupEngineState(), { wrapper });

    expect(actionsResult.current).toBeDefined();
    expect(typeof actionsResult.current.createDraftGroup).toBe("function");
    expect(stateResult.current).toEqual({ activeGroupId: null });
  });
});
