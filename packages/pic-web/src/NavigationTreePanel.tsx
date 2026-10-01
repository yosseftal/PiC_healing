/**
 * Exclusive non-linear navigation affordance (DEC-015 §7a). The only manual jump entry point in the Player
 * subtree — no skip/back/done buttons.
 */
import { useRef } from "react";
import type { PlayerSession } from "pic-engine";
import { usePlayerEngineActions } from "./player-engine-context";
import { useAsyncAction } from "./use-async-action";

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
    <nav aria-label="Navigation tree" data-testid="navigation-tree-panel">
      <ul>
        {session.units.map((unit) => (
          <li key={unit.unit_id}>
            <button
              type="button"
              data-testid={`navigation-tree-jump-${unit.unit_id}`}
              onClick={() => void requestNavigation(unit.unit_id)}
            >
              {unit.unit_id} ({unit.state})
            </button>
          </li>
        ))}
      </ul>
      {navigationStatus === "recovery" ? (
        <div role="status">
          <p>Your chosen step is ready for another try.</p>
          <button
            type="button"
            onClick={() => {
              if (requestedUnitRef.current !== null) {
                void requestNavigation(requestedUnitRef.current, true);
              }
            }}
          >
            Try this navigation again
          </button>
        </div>
      ) : null}
    </nav>
  );
}
