/**
 * Unified Player screen (Ticket 08-08 / Wave 9.1): dumb reflection over `PlayerSession` — no rating UI
 * anywhere in this subtree (DEC-015, spec §F). Screen-local resolving → ready → recovery gate holds Active
 * content until getTreatment + parse + cache have settled (Decision B).
 */
import { useEffect, useState } from "react";
import { TERMINAL_NEMAR_UNIT_ID } from "pic-engine";
import { AtomicUnitView } from "./AtomicUnitView";
import { FinishBar } from "./FinishBar";
import { useGuestFlowFacts } from "./guest-flow-context";
import { setGuestFlowPlayerSession } from "./guest-flow-facts";
import { NavigationTreePanel } from "./NavigationTreePanel";
import { findActiveUnit } from "./player-active-unit";
import { usePlayerSession } from "./player-engine-context";
import { TerminalNemarUnit } from "./TerminalNemarUnit";
import { useTreatmentContentActions } from "./treatment-content-context";
import { ZERO_H3_GUARD_MESSAGE } from "./zero-h3-guard-message";

type PlayerContentPhase = "resolving" | "ready" | "recovery";

export function UnifiedPlayerScreen() {
  const { activePlayerSessionId } = useGuestFlowFacts();
  const session = usePlayerSession(activePlayerSessionId ?? "");
  const { getParsedTreatmentContent } = useTreatmentContentActions();
  const [loadingPhase, setLoadingPhase] = useState<PlayerContentPhase>("resolving");
  const treatmentId = session?.treatment_id;

  useEffect(() => {
    if (activePlayerSessionId === null || treatmentId === undefined) {
      return;
    }
    let cancelled = false;
    setLoadingPhase("resolving");
    void getParsedTreatmentContent(treatmentId)
      .then((units) => {
        if (cancelled) {
          return;
        }
        setLoadingPhase(units.length === 0 ? "recovery" : "ready");
      })
      .catch(() => {
        if (!cancelled) {
          setLoadingPhase("recovery");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activePlayerSessionId, treatmentId, getParsedTreatmentContent]);

  if (activePlayerSessionId === null || session === null) {
    return null;
  }

  if (loadingPhase !== "ready") {
    return (
      <section data-testid="guest-flow-player">
        <h1>Unified Player</h1>
        {loadingPhase === "recovery" ? (
          <>
            <p data-testid="zero-h3-guard-player">{ZERO_H3_GUARD_MESSAGE}</p>
            <button
              type="button"
              data-testid="player-content-recovery"
              onClick={() => setGuestFlowPlayerSession(null)}
            >
              Choose another guidance
            </button>
          </>
        ) : null}
      </section>
    );
  }

  const activeUnit = findActiveUnit(session.units);
  const isTerminalNemar = activeUnit?.unit_id === TERMINAL_NEMAR_UNIT_ID;

  return (
    <section data-testid="guest-flow-player">
      <h1>Unified Player</h1>
      {isTerminalNemar ? (
        <TerminalNemarUnit sessionId={activePlayerSessionId} />
      ) : activeUnit !== undefined ? (
        <AtomicUnitView
          sessionId={activePlayerSessionId}
          treatmentId={session.treatment_id}
          unit={activeUnit}
        />
      ) : null}
      <NavigationTreePanel sessionId={activePlayerSessionId} session={session} />
      <FinishBar sessionId={activePlayerSessionId} session={session} />
    </section>
  );
}
