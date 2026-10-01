/**
 * Unified Player screen (Ticket 08-08 / Wave 9.1): dumb reflection over `PlayerSession` — no rating UI
 * anywhere in this subtree (DEC-015, spec §F). Screen-local resolving → ready → recovery gate holds Active
 * content until getTreatment + parse + cache have settled (Decision B).
 */
import { useEffect, useRef, useState } from "react";
import { TERMINAL_NEMAR_UNIT_ID } from "pic-engine";
import { AtomicUnitView } from "./AtomicUnitView";
import { FinishBar } from "./FinishBar";
import { HorizontalSlideContainer } from "./HorizontalSlideContainer";
import { useGuestFlowFacts } from "./guest-flow-context";
import { setGuestFlowPlayerSession } from "./guest-flow-facts";
import { NavigationTreePanel } from "./NavigationTreePanel";
import { findActiveUnit } from "./player-active-unit";
import { usePlayerSession } from "./player-engine-context";
import { TerminalNemarUnit } from "./TerminalNemarUnit";
import { TherapeuticContentCard, TherapeuticFrame } from "./therapeutic-frame/TherapeuticFrame";
import { useTreatmentContentActions } from "./treatment-content-context";
import { useAsyncAction } from "./use-async-action";
import { ZERO_H3_GUARD_MESSAGE } from "./zero-h3-guard-message";
import "./unified-player-screen.css";

type PlayerContentPhase = "resolving" | "ready" | "empty";

export function UnifiedPlayerScreen() {
  const { activePlayerSessionId } = useGuestFlowFacts();
  const session = usePlayerSession(activePlayerSessionId ?? "");
  const { getParsedTreatmentContent } = useTreatmentContentActions();
  const [loadingPhase, setLoadingPhase] = useState<PlayerContentPhase>("resolving");
  const incomingHeadingRef = useRef<HTMLHeadingElement>(null);
  const requestedUnitRef = useRef<string | null>(null);
  const treatmentId = session?.treatment_id;
  const activeUnit = session === null ? undefined : findActiveUnit(session.units);
  const activeKey = activeUnit?.unit_id;
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

  useEffect(() => {
    if (requestedUnitRef.current !== null && requestedUnitRef.current !== activeKey) {
      requestedUnitRef.current = null;
    }
  }, [session, activeKey]);

  if (activePlayerSessionId === null || session === null) {
    return null;
  }

  const isTerminalNemar = activeKey === TERMINAL_NEMAR_UNIT_ID;
  const showRecovery = loadingPhase === "empty" || contentStatus === "recovery";

  return (
    <section data-testid="guest-flow-player" className="pic-player-screen">
      <TherapeuticFrame title="Unified Player" stageLabel="Player guidance">
        <div className="pic-player-layout">
          {loadingPhase !== "ready" ? (
            <TherapeuticContentCard aria-label="Player content status">
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
            </TherapeuticContentCard>
          ) : activeUnit === undefined ? null : (
            <HorizontalSlideContainer
              activeKey={activeUnit.unit_id}
              orderedKeys={session.units.map((unit) => unit.unit_id)}
              stepLabel={isTerminalNemar ? "Terminal NEMAR step" : "Current Atomic Unit step"}
              userInitiated={requestedUnitRef.current === activeKey}
              focusTargetRef={incomingHeadingRef}
              onTransitionComplete={({ activeKey: completedKey }) => {
                if (requestedUnitRef.current === completedKey) {
                  requestedUnitRef.current = null;
                }
              }}
            >
              {isTerminalNemar ? (
                <TherapeuticContentCard aria-label="Terminal NEMAR guidance">
                  <TerminalNemarUnit
                    sessionId={activePlayerSessionId}
                    response={session.terminal_nemar_response}
                    headingRef={incomingHeadingRef}
                  />
                </TherapeuticContentCard>
              ) : (
                <AtomicUnitView
                  sessionId={activePlayerSessionId}
                  treatmentId={session.treatment_id}
                  unit={activeUnit}
                  headingRef={incomingHeadingRef}
                />
              )}
            </HorizontalSlideContainer>
          )}
          {loadingPhase === "ready" ? (
            <>
              <NavigationTreePanel
                sessionId={activePlayerSessionId}
                session={session}
                onNavigationRequested={(unitId) => {
                  requestedUnitRef.current = unitId === activeKey ? null : unitId;
                }}
                onNavigationFailed={(unitId) => {
                  if (requestedUnitRef.current === unitId) {
                    requestedUnitRef.current = null;
                  }
                }}
              />
              <FinishBar sessionId={activePlayerSessionId} session={session} />
            </>
          ) : null}
        </div>
      </TherapeuticFrame>
    </section>
  );
}
