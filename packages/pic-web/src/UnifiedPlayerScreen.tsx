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
import { useAsyncAction } from "./use-async-action";
import { ZERO_H3_GUARD_MESSAGE } from "./zero-h3-guard-message";

type PlayerContentPhase = "resolving" | "ready" | "empty";

export function UnifiedPlayerScreen() {
  const { activePlayerSessionId } = useGuestFlowFacts();
  const session = usePlayerSession(activePlayerSessionId ?? "");
  const { getParsedTreatmentContent } = useTreatmentContentActions();
  const [loadingPhase, setLoadingPhase] = useState<PlayerContentPhase>("resolving");
  const treatmentId = session?.treatment_id;
  const {
    status: contentStatus,
    run: resolveContent,
    retry: retryContent,
  } = useAsyncAction(async (requestedTreatmentId: string, isCancelled: () => boolean) => {
    setLoadingPhase("resolving");
    const units = await getParsedTreatmentContent(requestedTreatmentId);
    if (!isCancelled()) {
      setLoadingPhase(units.length === 0 ? "empty" : "ready");
    }
  });

  useEffect(() => {
    if (activePlayerSessionId === null || treatmentId === undefined) {
      return;
    }
    let cancelled = false;
    void resolveContent(treatmentId, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [activePlayerSessionId, treatmentId, getParsedTreatmentContent, resolveContent]);

  if (activePlayerSessionId === null || session === null) {
    return null;
  }

  if (loadingPhase !== "ready") {
    const showRecovery = loadingPhase === "empty" || contentStatus === "recovery";
    return (
      <section data-testid="guest-flow-player">
        <h1>Unified Player</h1>
        {showRecovery ? (
          <>
            <p data-testid="zero-h3-guard-player">{ZERO_H3_GUARD_MESSAGE}</p>
            {contentStatus === "recovery" ? (
              <>
                <p>Your guidance can reconnect whenever you choose.</p>
                <button type="button" onClick={() => void retryContent()}>
                  Try guidance again
                </button>
              </>
            ) : null}
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
