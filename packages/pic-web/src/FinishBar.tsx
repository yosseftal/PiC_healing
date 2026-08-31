/**
 * Sovereign Finish controls (DEC-015 §4, §7b). Dumb reflection from `PlayerSession` — never calls
 * `playerEngine.finish` directly; guest path gates through `SessionEngine.onFinishRequested`.
 */
import type { PlayerSession } from "pic-engine";
import { useSessionEngineActions } from "./session-engine-context";
import { useAsyncAction } from "./use-async-action";

export function FinishBar({ sessionId, session }: { sessionId: string; session: PlayerSession }) {
  const { onFinishRequested } = useSessionEngineActions();
  const {
    status: finishStatus,
    run: requestFinish,
    retry: retryFinish,
  } = useAsyncAction(onFinishRequested);

  if (session.success_declared) {
    return null;
  }

  const canFinish = session.terminal_nemar_response === "yes";

  return (
    <footer data-testid="finish-bar">
      {canFinish ? (
        <button type="button" data-testid="finish-button" onClick={() => void requestFinish(sessionId, "finish")}>
          Finish
        </button>
      ) : null}
      <button
        type="button"
        data-testid="finish-anyway-button"
        onClick={() => void requestFinish(sessionId, "finishAnyway")}
      >
        Finish Anyway
      </button>
      {finishStatus === "recovery" ? (
        <div role="status">
          <p>Your session is ready when you are.</p>
          <button type="button" onClick={() => void retryFinish()}>
            Try finishing again
          </button>
        </div>
      ) : null}
    </footer>
  );
}
