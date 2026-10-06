/**
 * Sovereign Finish controls (DEC-015 §4, §7b). Dumb reflection from `PlayerSession` — never calls
 * `playerEngine.finish` directly; guest path gates through `SessionEngine.onFinishRequested`.
 */
import type { PlayerSession } from "pic-engine";
import { useSessionEngineActions } from "./session-engine-context";
import { useAsyncAction } from "./use-async-action";
import { UTILITY_CONTROL } from "./control-affordance";

export function FinishBar({
  sessionId,
  session,
  onFinishResolved,
}: {
  sessionId: string;
  session: PlayerSession;
  onFinishResolved?: () => void;
}) {
  const { onFinishRequested } = useSessionEngineActions();
  const {
    status: finishStatus,
    run: requestFinish,
    retry: retryFinish,
  } = useAsyncAction(onFinishRequested);

  if (session.success_declared) {
    return null;
  }

  async function finish(): Promise<void> {
    const result = await requestFinish(sessionId, "finishAnyway");
    if (result.ok) {
      onFinishResolved?.();
    }
  }

  async function retry(): Promise<void> {
    const result = await retryFinish();
    if (result?.ok) {
      onFinishResolved?.();
    }
  }

  return (
    <footer data-testid="finish-bar">
      <button
        className={UTILITY_CONTROL}
        type="button"
        data-testid="finish-anyway-button"
        onClick={() => void finish()}
      >
        Finish Anyway
      </button>
      {finishStatus === "recovery" ? (
        <div role="status">
          <p>Your session is ready when you are.</p>
          <button className={UTILITY_CONTROL} type="button" onClick={() => void retry()}>
            Try finishing again
          </button>
        </div>
      ) : null}
    </footer>
  );
}
