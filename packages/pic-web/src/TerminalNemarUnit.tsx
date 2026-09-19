/**
 * Mandatory closing muscle test (DEC-015 §7b). Yes enables standard Finish; No records Integrating — never
 * "failed" framing.
 */
import { usePlayerEngineActions } from "./player-engine-context";
import { useAsyncAction } from "./use-async-action";

interface TerminalNemarUnitProps {
  sessionId: string;
  /** Dumb reflection of `PlayerSession.terminal_nemar_response` — never local state (DEC-015). */
  response: "yes" | "no" | null;
}

export function TerminalNemarUnit({ sessionId, response }: TerminalNemarUnitProps) {
  const { respondTerminalNemar } = usePlayerEngineActions();
  const {
    status: responseStatus,
    run: submitResponse,
    retry: retryResponse,
  } = useAsyncAction(respondTerminalNemar);

  return (
    <section data-testid="terminal-nemar-unit">
      <p>Is it NEMAR that this treatment ended successfully?</p>
      <button
        type="button"
        data-testid="terminal-nemar-yes"
        aria-pressed={response === "yes"}
        onClick={() => void submitResponse(sessionId, "yes")}
      >
        Yes
      </button>
      <button
        type="button"
        data-testid="terminal-nemar-no"
        aria-pressed={response === "no"}
        onClick={() => void submitResponse(sessionId, "no")}
      >
        No
      </button>
      {response === "yes" ? (
        <p role="status" data-testid="terminal-nemar-response-recorded">
          Your Yes response was recorded — Finish is now available below.
        </p>
      ) : null}
      {response === "no" ? (
        <p role="status" data-testid="terminal-nemar-response-recorded">
          Your No response was recorded. This session is Integrating — Finish Anyway remains available
          whenever you're ready.
        </p>
      ) : null}
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
