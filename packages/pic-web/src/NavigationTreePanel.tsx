/**
 * Exclusive non-linear navigation affordance (DEC-015 §7a). The only manual jump entry point in the Player
 * subtree — no skip/back/done buttons.
 */
import type { PlayerSession } from "pic-engine";
import { usePlayerEngineActions } from "./player-engine-context";

export function NavigationTreePanel({ sessionId, session }: { sessionId: string; session: PlayerSession }) {
  const { jumpTo } = usePlayerEngineActions();

  return (
    <nav aria-label="Navigation tree" data-testid="navigation-tree-panel">
      <ul>
        {session.units.map((unit) => (
          <li key={unit.unit_id}>
            <button
              type="button"
              data-testid={`navigation-tree-jump-${unit.unit_id}`}
              onClick={() => void jumpTo(sessionId, unit.unit_id)}
            >
              {unit.unit_id} ({unit.state})
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
