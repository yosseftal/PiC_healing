/**
 * Exclusive non-linear navigation affordance (DEC-015 §7a). The only manual jump entry point in the Player
 * subtree — no skip/back/done buttons.
 */
import { useRef } from "react";
import { TERMINAL_NEMAR_UNIT_ID, type PlayerSession } from "pic-engine";
import { usePlayerEngineActions } from "./player-engine-context";
import { useAsyncAction } from "./use-async-action";
import { UTILITY_CONTROL } from "./control-affordance";
import { useLocale } from "./i18n/locale-provider";
import { LocalizedMessage } from "./i18n/localized-message";

const stateMessages = {
  unseen: "player.state.unseen", in_view: "player.state.in_view",
  skipped: "player.state.skipped", completed: "player.state.completed",
} as const;

export function NavigationTreePanel({
  sessionId,
  session,
  onNavigationRequested,
  onNavigationFailed,
}: {
  sessionId: string;
  session: PlayerSession;
  onNavigationRequested?: (unitId: string) => void;
  onNavigationFailed?: (unitId: string) => void;
}) {
  const { message } = useLocale();
  const requestedUnitRef = useRef<string | null>(null);
  const { jumpTo } = usePlayerEngineActions();
  const {
    status: navigationStatus,
    run: navigate,
    retry: retryNavigation,
  } = useAsyncAction(jumpTo);

  async function requestNavigation(unitId: string, retry = false): Promise<void> {
    requestedUnitRef.current = unitId;
    onNavigationRequested?.(unitId);
    const result = retry ? await retryNavigation() : await navigate(sessionId, unitId);
    if (result?.ok === false && requestedUnitRef.current === unitId) {
      onNavigationFailed?.(unitId);
    }
  }

  return (
    <nav aria-label={message("player.navigation").text} data-testid="navigation-tree-panel">
      <ul>
        {session.units.map((unit) => (
          <li key={unit.unit_id}>
            <button
              className={`${UTILITY_CONTROL} w-full justify-start text-start`}
              type="button"
              data-testid={`navigation-tree-jump-${unit.unit_id}`}
              onClick={() => void requestNavigation(unit.unit_id)}
            >
              <LocalizedMessage message={message("player.navigationEntry", {
                unit: unit.unit_id === TERMINAL_NEMAR_UNIT_ID ? message("player.terminalTitle").text
                  : unit.unit_id === "unit-0" ? message("player.continuousGuidance").text : unit.unit_id,
                state: message(stateMessages[unit.state]).text,
              })} />
            </button>
          </li>
        ))}
      </ul>
      {navigationStatus === "recovery" ? (
        <div role="status">
          <p><LocalizedMessage message={message("player.navigationRecovery")} /></p>
          <button
            className={UTILITY_CONTROL}
            type="button"
            onClick={() => {
              if (requestedUnitRef.current !== null) {
                void requestNavigation(requestedUnitRef.current, true);
              }
            }}
          >
            <LocalizedMessage message={message("player.retryNavigation")} />
          </button>
        </div>
      ) : null}
    </nav>
  );
}
