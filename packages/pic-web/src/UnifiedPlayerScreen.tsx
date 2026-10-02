/**
 * Unified Player screen (Ticket 08-08 / Wave 9.1): dumb reflection over `PlayerSession` — no rating UI
 * anywhere in this subtree (DEC-015, spec §F). Screen-local resolving → ready → recovery gate holds Active
 * content until getTreatment + parse + cache have settled (Decision B).
 */
import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
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
import { TherapeuticSheet } from "./therapeutic-sheet";
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
  const [utilitiesOpen, setUtilitiesOpen] = useState(false);
  const playerRootRef = useRef<HTMLElement>(null);
  const incomingHeadingRef = useRef<HTMLHeadingElement>(null);
  const requestedUnitRef = useRef<string | null>(null);
  const navigationClosingRef = useRef(false);
  const finishClosingRef = useRef(false);
  const closedNavigationRef = useRef<string | null>(null);
  const headingObserverRef = useRef<MutationObserver | null>(null);
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
    if (
      requestedUnitRef.current !== null &&
      requestedUnitRef.current === activeKey &&
      closedNavigationRef.current !== activeKey
    ) {
      closedNavigationRef.current = activeKey;
      navigationClosingRef.current = true;
      setUtilitiesOpen(false);
    }
  }, [session, activeKey]);

  useEffect(() => () => headingObserverRef.current?.disconnect(), []);

  if (activePlayerSessionId === null || session === null) {
    return null;
  }

  const isTerminalNemar = activeKey === TERMINAL_NEMAR_UNIT_ID;
  const showRecovery = loadingPhase === "empty" || contentStatus === "recovery";

  return (
    <section ref={playerRootRef} data-testid="guest-flow-player" className="pic-player-screen">
      <TherapeuticFrame
        title="Unified Player"
        stageLabel="Player guidance"
        utilityTrigger={loadingPhase === "ready" ? (
          <TherapeuticSheet
            title="Player utilities"
            description="Choose a step or finish when you are ready."
            triggerLabel="Open Player utilities"
            trigger={<Menu aria-hidden="true" size={20} />}
            open={utilitiesOpen}
            onOpenChange={setUtilitiesOpen}
            onCloseAutoFocus={() => {
              if (finishClosingRef.current) {
                finishClosingRef.current = false;
                const gate = document.querySelector<HTMLDialogElement>(
                  'dialog[open][aria-labelledby="persistence-gate-title"]',
                );
                if (gate !== null) {
                  gate.focus();
                  return true;
                }
                return false;
              }
              if (!navigationClosingRef.current) {
                return false;
              }
              navigationClosingRef.current = false;
              const heading = incomingHeadingRef.current;
              if (
                heading === null ||
                heading.closest("[data-active-key]")?.getAttribute("data-active-key") !== activeKey
              ) {
                headingObserverRef.current?.disconnect();
                const observer = new MutationObserver(() => {
                  const incoming = incomingHeadingRef.current;
                  if (
                    incoming !== null &&
                    incoming.closest("[data-active-key]")?.getAttribute("data-active-key") === activeKey
                  ) {
                    observer.disconnect();
                    headingObserverRef.current = null;
                    incoming.focus();
                  }
                });
                if (playerRootRef.current !== null) {
                  observer.observe(playerRootRef.current, { childList: true, subtree: true });
                  headingObserverRef.current = observer;
                }
                return false;
              }
              heading.focus();
              return true;
            }}
          >
            <div className="pic-player-utilities">
              <NavigationTreePanel
                sessionId={activePlayerSessionId}
                session={session}
                onNavigationRequested={(unitId) => {
                  closedNavigationRef.current = null;
                  headingObserverRef.current?.disconnect();
                  headingObserverRef.current = null;
                  requestedUnitRef.current = unitId === activeKey ? null : unitId;
                }}
                onNavigationFailed={(unitId) => {
                  if (requestedUnitRef.current === unitId) {
                    requestedUnitRef.current = null;
                  }
                }}
              />
              <FinishBar
                sessionId={activePlayerSessionId}
                session={session}
                onFinishResolved={() => {
                  finishClosingRef.current = true;
                  setUtilitiesOpen(false);
                }}
              />
            </div>
          </TherapeuticSheet>
        ) : undefined}
      >
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
                    successDeclared={session.success_declared}
                    headingRef={incomingHeadingRef}
                    onFinishResolved={() => {
                      document.querySelector<HTMLDialogElement>(
                        'dialog[open][aria-labelledby="persistence-gate-title"]',
                      )?.focus();
                    }}
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
        </div>
      </TherapeuticFrame>
    </section>
  );
}
