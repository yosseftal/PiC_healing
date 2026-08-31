import { useCallback, useEffect, useRef, useState } from "react";

export type AsyncActionStatus = "idle" | "recovery";

export type AsyncActionRunResult<Result> =
  | { ok: true; value: Result }
  | { ok: false };

/**
 * UI-local recovery state for fire-and-forget actions. Engine state remains the sole source of domain truth.
 */
export function useAsyncAction<Arguments extends unknown[], Result>(
  action: (...arguments_: Arguments) => Promise<Result>,
) {
  const actionRef = useRef(action);
  const mountedRef = useRef(true);
  const invocationRef = useRef(0);
  const lastArgumentsRef = useRef<Arguments | null>(null);
  const [status, setStatus] = useState<AsyncActionStatus>("idle");
  const statusRef = useRef<AsyncActionStatus>("idle");
  actionRef.current = action;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(async (...arguments_: Arguments): Promise<AsyncActionRunResult<Result>> => {
    const invocation = invocationRef.current + 1;
    invocationRef.current = invocation;
    lastArgumentsRef.current = arguments_;
    if (mountedRef.current && statusRef.current === "recovery") {
      statusRef.current = "idle";
      setStatus("idle");
    }

    try {
      const value = await actionRef.current(...arguments_);
      return { ok: true, value };
    } catch {
      if (mountedRef.current && invocationRef.current === invocation) {
        statusRef.current = "recovery";
        setStatus("recovery");
      }
      return { ok: false };
    }
  }, []);

  const retry = useCallback(async (): Promise<AsyncActionRunResult<Result> | null> => {
    const lastArguments = lastArgumentsRef.current;
    return lastArguments === null ? null : run(...lastArguments);
  }, [run]);

  return { status, run, retry };
}
