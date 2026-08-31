/**
 * Mandatory closing muscle test (DEC-015 §7b). Yes enables standard Finish; No records Integrating — never
 * "failed" framing.
 */
import { usePlayerEngineActions } from "./player-engine-context";
import { useAsyncAction } from "./use-async-action";

export function TerminalNemarUnit({ sessionId }: { sessionId: string }) {
  const { respondTerminalNemar } = usePlayerEngineActions();
  const {
    status: responseStatus,
    run: submitResponse,
    retry: retryResponse,
  } = useAsyncAction(respondTerminalNemar);

  return (
    <section data-testid="terminal-nemar-unit">
      <p>Is it NEMAR that this treatment ended successfully?</p>
      <button type="button" data-testid="terminal-nemar-yes" onClick={() => void submitResponse(sessionId, "yes")}>
        Yes
      </button>
      <button type="button" data-testid="terminal-nemar-no" onClick={() => void submitResponse(sessionId, "no")}>
        No
      </button>
      {responseStatus === "recovery" ? (
        <div role="status">
          <p>Your Terminal NEMAR response is ready for another try.</p>
          <button type="button" onClick={() => void retryResponse()}>
            Try this Terminal NEMAR response again
          </button>
        </div>
      ) : null}
    </section>
  );
}
