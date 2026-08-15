/**
 * Sovereign Finish controls (DEC-015 §4, §7b). Dumb reflection from `PlayerSession` — never calls
 * `playerEngine.finish` directly; guest path gates through `SessionEngine.onFinishRequested`.
 */
import type { PlayerSession } from "pic-engine";
import { useSessionEngineActions } from "./session-engine-context";

export function FinishBar({ sessionId, session }: { sessionId: string; session: PlayerSession }) {
  const { onFinishRequested } = useSessionEngineActions();

  if (session.success_declared) {
    return null;
  }

  const canFinish = session.terminal_nemar_response === "yes";

  return (
    <footer data-testid="finish-bar">
      {canFinish ? (
        <button type="button" data-testid="finish-button" onClick={() => void onFinishRequested(sessionId, "finish")}>
          Finish
        </button>
      ) : null}
      <button
        type="button"
        data-testid="finish-anyway-button"
        onClick={() => void onFinishRequested(sessionId, "finishAnyway")}
      >
        Finish Anyway
      </button>
    </footer>
  );
}
