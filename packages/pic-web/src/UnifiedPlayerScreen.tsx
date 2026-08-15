/**
 * Unified Player screen (Ticket 08-08): dumb reflection over `PlayerSession` — no rating UI anywhere in this
 * subtree (DEC-015, spec §F).
 */
import { TERMINAL_NEMAR_UNIT_ID } from "pic-engine";
import { AtomicUnitView } from "./AtomicUnitView";
import { FinishBar } from "./FinishBar";
import { useGuestFlowFacts } from "./guest-flow-context";
import { NavigationTreePanel } from "./NavigationTreePanel";
import { findActiveUnit } from "./player-active-unit";
import { usePlayerSession } from "./player-engine-context";
import { TerminalNemarUnit } from "./TerminalNemarUnit";

export function UnifiedPlayerScreen() {
  const { activePlayerSessionId } = useGuestFlowFacts();
  const session = usePlayerSession(activePlayerSessionId ?? "");

  if (activePlayerSessionId === null || session === null) {
    return null;
  }

  const activeUnit = findActiveUnit(session.units);
  const isTerminalNemar = activeUnit?.unit_id === TERMINAL_NEMAR_UNIT_ID;

  return (
    <section data-testid="guest-flow-player">
      <h1>Unified Player</h1>
      {isTerminalNemar ? (
        <TerminalNemarUnit sessionId={activePlayerSessionId} />
      ) : activeUnit !== undefined ? (
        <AtomicUnitView sessionId={activePlayerSessionId} unit={activeUnit} />
      ) : null}
      <NavigationTreePanel sessionId={activePlayerSessionId} session={session} />
      <FinishBar sessionId={activePlayerSessionId} session={session} />
    </section>
  );
}
