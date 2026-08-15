/**
 * Mandatory closing muscle test (DEC-015 §7b). Yes enables standard Finish; No records Integrating — never
 * "failed" framing.
 */
import { usePlayerEngineActions } from "./player-engine-context";

export function TerminalNemarUnit({ sessionId }: { sessionId: string }) {
  const { respondTerminalNemar } = usePlayerEngineActions();

  return (
    <section data-testid="terminal-nemar-unit">
      <p>Is it NEMAR that this treatment ended successfully?</p>
      <button type="button" data-testid="terminal-nemar-yes" onClick={() => void respondTerminalNemar(sessionId, "yes")}>
        Yes
      </button>
      <button type="button" data-testid="terminal-nemar-no" onClick={() => void respondTerminalNemar(sessionId, "no")}>
        No
      </button>
    </section>
  );
}
